import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Meta API configuration
const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'orderflow-webhook-verify';
const META_APP_SECRET = process.env.META_APP_SECRET;
const META_PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN;

/**
 * Meta Webhook Handler (Facebook Messenger + Instagram DMs)
 * GET  /api/webhooks/meta - Webhook verification
 * POST /api/webhooks/meta - Message events
 *
 * Handles:
 * - Facebook Messenger messages
 * - Instagram Direct Messages
 * - Message reactions, read receipts
 *
 * Flow:
 * 1. Parse Meta webhook event
 * 2. Identify channel (facebook/instagram)
 * 3. Idempotency check
 * 4. Resolve tenant from page ID
 * 5. Find or create customer (by PSID/IGSID)
 * 6. Find or create conversation thread
 * 7. Store message
 * 8. Process with AI agent
 * 9. Send response via Meta API
 */
export default async function handler(req, res) {
  // Webhook verification (required by Meta)
  if (req.method === 'GET') {
    return handleVerification(req, res);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = req.body;

    console.log('[Meta Webhook] Incoming:', JSON.stringify(body));

    // Meta sends object with "object" and "entry" fields
    if (body.object !== 'page' && body.object !== 'instagram') {
      console.log('[Meta Webhook] Unknown object type:', body.object);
      return res.status(200).send('EVENT_RECEIVED');
    }

    // Process each entry
    for (const entry of body.entry || []) {
      await processEntry(supabase, entry, body.object);
    }

    // Always respond 200 OK quickly (Meta has 20s timeout)
    return res.status(200).send('EVENT_RECEIVED');

  } catch (err) {
    console.error('[Meta Webhook] Error:', err);
    return res.status(200).send('EVENT_RECEIVED');
  }
}

/**
 * Handle webhook verification from Meta
 */
function handleVerification(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
    console.log('[Meta Webhook] Verification successful');
    return res.status(200).send(challenge);
  }

  console.log('[Meta Webhook] Verification failed');
  return res.status(403).json({ error: 'Verification failed' });
}

/**
 * Process a webhook entry
 */
async function processEntry(supabase, entry, objectType) {
  const pageId = entry.id;

  // Handle messaging events
  if (entry.messaging) {
    for (const event of entry.messaging) {
      await processMessagingEvent(supabase, pageId, event, objectType);
    }
  }

  // Handle Instagram-specific messaging
  if (entry.messages) {
    for (const event of entry.messages) {
      await processMessagingEvent(supabase, pageId, event, 'instagram');
    }
  }
}

/**
 * Process a single messaging event
 */
async function processMessagingEvent(supabase, pageId, event, objectType) {
  // Skip non-message events (delivery, read receipts)
  if (!event.message || event.message.is_echo) {
    return;
  }

  // Determine channel
  const channel = objectType === 'instagram' ? 'instagram' : 'facebook';

  // Extract message data
  const senderId = event.sender?.id;
  const messageId = event.message?.mid;
  const text = event.message?.text || '';
  const attachments = event.message?.attachments || [];

  if (!senderId || !messageId) {
    console.log('[Meta Webhook] Missing sender or message ID');
    return;
  }

  // Step 1: Idempotency check
  const isDuplicate = await checkIdempotency(supabase, channel, messageId);
  if (isDuplicate) {
    console.log('[Meta Webhook] Duplicate message:', messageId);
    return;
  }

  // Step 2: Resolve tenant from page ID
  const tenantId = await resolveTenantFromPage(supabase, pageId, channel);
  if (!tenantId) {
    console.log('[Meta Webhook] Unknown page:', pageId);
    return;
  }

  // Step 3: Find or create customer
  const customerData = channel === 'instagram'
    ? { instagram_user_id: senderId }
    : { facebook_psid: senderId };

  const customer = await getOrCreateCustomer(supabase, tenantId, customerData);

  // Step 4: Find or create thread
  const thread = await getOrCreateThread(supabase, tenantId, customer.id, channel, senderId);

  // Step 5: Build message content
  let content = text;
  if (attachments.length > 0) {
    const attachmentTypes = attachments.map(a => a.type).join(', ');
    content = text ? `${text} [${attachmentTypes}]` : `[${attachmentTypes}]`;
  }

  // Step 6: Store message
  const message = await storeMessage(supabase, thread.id, {
    direction: 'inbound',
    senderType: 'customer',
    content: content,
    messageType: attachments.length > 0 ? 'media' : 'text',
    externalMessageId: messageId,
    metadata: {
      channel,
      senderId,
      pageId,
      attachments: attachments.map(a => ({ type: a.type, url: a.payload?.url }))
    }
  });

  // Step 7: Mark processed
  await markProcessed(supabase, channel, messageId, tenantId);

  // Step 8: Process with AI (MUST await — Vercel kills process after return)
  await processWithAI(supabase, thread, message, customer, tenantId, channel, senderId, pageId);
}

/**
 * Check idempotency
 */
async function checkIdempotency(supabase, channel, externalMessageId) {
  const { data } = await supabase
    .from('message_idempotency')
    .select('id')
    .eq('channel', channel)
    .eq('external_message_id', externalMessageId)
    .limit(1);

  return data && data.length > 0;
}

/**
 * Mark as processed
 */
async function markProcessed(supabase, channel, externalMessageId, tenantId) {
  await supabase
    .from('message_idempotency')
    .insert({
      channel,
      external_message_id: externalMessageId,
      tenant_id: tenantId
    });
}

/**
 * Resolve tenant from Meta page/account ID
 */
async function resolveTenantFromPage(supabase, pageId, channel) {
  const column = channel === 'instagram' ? 'instagram_account_id' : 'facebook_page_id';

  const { data } = await supabase
    .from('restaurants')
    .select('id')
    .eq(column, pageId)
    .limit(1);

  if (data && data.length > 0) {
    return data[0].id;
  }

  // Fallback: default tenant for demo
  const { data: defaultTenant } = await supabase
    .from('restaurants')
    .select('id')
    .limit(1);

  return defaultTenant?.[0]?.id || null;
}

/**
 * Find or create customer
 */
async function getOrCreateCustomer(supabase, tenantId, identifiers) {
  // Look for existing customer
  let query = supabase
    .from('customers')
    .select('*')
    .eq('tenant_id', tenantId);

  if (identifiers.instagram_user_id) {
    query = query.eq('instagram_user_id', identifiers.instagram_user_id);
  } else if (identifiers.facebook_psid) {
    query = query.eq('facebook_psid', identifiers.facebook_psid);
  }

  const { data: existing } = await query.limit(1);

  if (existing && existing.length > 0) {
    return existing[0];
  }

  // Create new customer
  const { data: newCustomer } = await supabase
    .from('customers')
    .insert({
      tenant_id: tenantId,
      ...identifiers
    })
    .select()
    .single();

  // Optionally fetch user profile from Meta API
  // await enrichCustomerProfile(newCustomer.id, identifiers);

  return newCustomer;
}

/**
 * Find or create conversation thread
 */
async function getOrCreateThread(supabase, tenantId, customerId, channel, externalId) {
  // Look for existing open thread
  const { data: existing } = await supabase
    .from('conversation_threads')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('customer_id', customerId)
    .eq('channel', channel)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1);

  if (existing && existing.length > 0) {
    const lastMsg = new Date(existing[0].last_message_at || existing[0].created_at);
    const hoursSinceLastMsg = (Date.now() - lastMsg.getTime()) / (1000 * 60 * 60);

    // Auto-close stale threads (2+ hours of inactivity) → fresh conversation
    if (hoursSinceLastMsg >= 2) {
      console.log(`[Meta] Closing stale thread ${existing[0].id} (${hoursSinceLastMsg.toFixed(1)}h inactive)`);
      await supabase
        .from('conversation_threads')
        .update({ status: 'closed' })
        .eq('id', existing[0].id);
      // Fall through to create new thread
    } else {
      await supabase
        .from('conversation_threads')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', existing[0].id);

      return existing[0];
    }
  }

  // Create new thread
  const { data: newThread } = await supabase
    .from('conversation_threads')
    .insert({
      tenant_id: tenantId,
      customer_id: customerId,
      channel,
      external_thread_id: externalId,
      status: 'open',
      last_message_at: new Date().toISOString()
    })
    .select()
    .single();

  return newThread;
}

/**
 * Store message
 */
async function storeMessage(supabase, threadId, data) {
  const { data: message, error } = await supabase
    .from('thread_messages')
    .insert({
      thread_id: threadId,
      direction: data.direction,
      sender_type: data.senderType,
      content: data.content,
      message_type: data.messageType || 'text',
      external_message_id: data.externalMessageId,
      metadata: data.metadata
    })
    .select()
    .single();

  if (error) console.error('[Meta] storeMessage FAILED:', error.message, 'thread:', threadId);
  else console.log('[Meta] Message stored:', data.direction, threadId);
  return message;
}

/**
 * Process with AI agent
 */
async function processWithAI(supabase, thread, message, customer, tenantId, channel, recipientId, pageId) {
  try {
    // Load conversation history
    const { data: history } = await supabase
      .from('thread_messages')
      .select('*')
      .eq('thread_id', thread.id)
      .order('created_at', { ascending: true })
      .limit(20);

    // Load menu + restaurant name in parallel
    const [{ data: menu }, { data: restaurant }] = await Promise.all([
      supabase.rpc('get_site_menu', { p_tenant_id: tenantId }),
      supabase.from('restaurants').select('name').eq('id', tenantId).single()
    ]);
    const restaurantName = restaurant?.name || null;

    // Format for AI
    const conversation = (history || []).map(msg => ({
      role: msg.direction === 'inbound' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Get thread state from last AI message metadata (reliable — thread_messages.metadata works)
    const lastAiMsg = (history || []).filter(m => m.direction === 'outbound' && m.metadata?.threadState).pop();
    const threadState = lastAiMsg?.metadata?.threadState || {};
    console.log('[Meta] Thread ID:', thread.id, 'Restaurant:', restaurantName, 'Menu items:', menu?.length || 0, 'State:', JSON.stringify(threadState), 'History:', (history||[]).length);
    const aiResponse = await callOrderingAgent(conversation, menu, customer, channel, threadState, restaurantName);
    console.log('[Meta] AI response:', aiResponse.text?.substring(0, 100), 'New state:', aiResponse.newState?.state);

    // Calculate confidence
    const confidence = aiResponse.confidence || 0.85;

    // Update thread with AI state
    const { error: updateErr } = await supabase
      .from('conversation_threads')
      .update({
        ai_confidence: confidence,
        requires_attention: confidence < 0.7,
        metadata: aiResponse.newState || {}
      })
      .eq('id', thread.id);
    if (updateErr) console.error('[Meta] Thread update error:', updateErr);
    else console.log('[Meta] Thread state saved:', JSON.stringify(aiResponse.newState));

    // Store AI response (with threadState for persistence)
    await storeMessage(supabase, thread.id, {
      direction: 'outbound',
      senderType: 'ai',
      content: aiResponse.text,
      messageType: 'text',
      externalMessageId: null,
      metadata: {
        confidence,
        intent: aiResponse.intent,
        orderData: aiResponse.orderData,
        threadState: aiResponse.newState || {}
      }
    });

    // Send response via Meta API
    if (aiResponse.text) {
      await sendMetaMessage(channel, recipientId, aiResponse.text, supabase, pageId);
    }

    // Create order if detected
    if (aiResponse.orderData && aiResponse.intent === 'order') {
      await createOrder(supabase, tenantId, thread.id, customer.id, channel, aiResponse.orderData);
    }

  } catch (err) {
    console.error('[Meta Webhook] AI processing failed:', err);

    await supabase
      .from('conversation_threads')
      .update({
        requires_attention: true,
        ai_confidence: 0
      })
      .eq('id', thread.id);
  }
}

/**
 * Call GPT
 */
async function callGPT(systemPrompt, messages, maxTokens = 500, jsonMode = false) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    console.log('[AI] No OpenAI API key, using fallback');
    return null;
  }
  try {
    const body = {
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: maxTokens,
      temperature: 0.7,
    };
    if (jsonMode) body.response_format = { type: 'json_object' };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) { 
      const errBody = await response.text().catch(() => '');
      console.error('[AI] GPT error:', response.status, errBody); 
      return null; 
    }
    const data = await response.json();
    console.log('[AI] GPT response received, length:', data.choices?.[0]?.message?.content?.length || 0);
    return data.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.error('[AI] GPT call failed:', err.message);
    return null;
  }
}

function buildSystemPrompt(state, cart, fulfillment, contact, menu, restaurantName) {
  // Menu can be flat items or nested categories from get_site_menu RPC
  let menuText = 'Menuen er ikke tilgængelig digitalt endnu.';
  if (menu && Array.isArray(menu) && menu.length > 0) {
    // Check if nested format (categories with items array)
    if (menu[0].items && Array.isArray(menu[0].items)) {
      menuText = menu.map(cat =>
        `[${cat.name}]\n` + (cat.items || []).map(i =>
          `  ${i.name} (${i.price} DKK)${i.description ? ' — ' + i.description : ''}`
        ).join('\n')
      ).join('\n');
    } else {
      // Flat format
      menuText = menu.slice(0, 30).map(i =>
        `${i.name}${i.price ? ' (' + i.price + ' DKK)' : ''}${i.category ? ' [' + i.category + ']' : ''}`
      ).join('\n');
    }
  }
  const cartText = cart.length > 0
    ? cart.map(i => `${i.quantity}x ${i.name} (${i.price * i.quantity} DKK)`).join(', ') + ` — Total: ${cart.reduce((s, i) => s + i.price * i.quantity, 0)} DKK`
    : 'Tom';
  return `Du er en venlig kundeservice-assistent for ${restaurantName || 'virksomheden'}. Du svarer på DANSK.

Du SKAL svare med valid JSON:
{"reply":"Din besked til kunden (kort, venlig, max 2-3 sætninger)","state":"greeting|menu|cart|fulfillment|contact|confirm|completed|support","cart":[{"name":"Varenavn","price":89,"quantity":1}],"fulfillment":"delivery|pickup|null","contact":{"name":"...","phone":"...","address":"..."},"orderReady":false}

REGLER:
- Hold svar korte (max 2-3 sætninger). Brug emoji sparsomt.
- Nævn ALDRIG at du er en AI/bot.
- Lyt til hvad kunden FAKTISK siger — svar på det.
- Hvis kunden siger "hej" eller hilser — svar med en venlig hilsen og spørg hvad du kan hjælpe med. Skift state til "menu" efter hilsen.
- GENTAG ALDRIG det samme svar. Hvis du allerede har sagt hej, gå videre til næste trin.
- Kig på samtalehistorikken — hvis du allerede har hilst, SKAL du skifte til næste state (menu/support).
- "orderReady" skal KUN være true når kunden har bekræftet ordren.
- Bevar eksisterende cart/contact/fulfillment data.
- Hvis kunden nævner mad/bestilling, skift straks til "menu" state.

STATE: ${state} | KURV: ${cartText} | LEVERING: ${fulfillment || 'ikke valgt'} | KONTAKT: ${JSON.stringify(contact || {})}
MENU:\n${menuText}`;
}

/**
 * Call AI agent with GPT
 */
async function callOrderingAgent(conversation, menu, customer, channel, threadState, restaurantName) {
  const lastMessage = conversation[conversation.length - 1]?.content || '';
  let state = threadState?.state || 'greeting';
  let cart = threadState?.cart || [];
  let fulfillment = threadState?.fulfillment || null;
  let contact = threadState?.contact || {};

  // Step 1: Deduplicate consecutive identical messages (prevents GPT from seeing loop pattern)
  const deduped = [];
  for (const msg of conversation) {
    const prev = deduped[deduped.length - 1];
    if (prev && prev.role === msg.role && prev.content === msg.content) continue;
    deduped.push(msg);
  }

  // Step 2: Detect greeting loop — if 2+ of last 3 assistant replies are greetings, reset
  const assistantMsgs = deduped.filter(m => m.role === 'assistant');
  const recentAssistant = assistantMsgs.slice(-3);
  const greetingCount = recentAssistant.filter(m => m.content && m.content.startsWith('Hej')).length;
  const isStuck = recentAssistant.length >= 2 && greetingCount >= recentAssistant.length;

  let gptMessages;
  if (isStuck) {
    // Greeting loop: nuke history, only send last user message for a clean start
    console.log('[AI] STUCK in greeting loop (' + greetingCount + ' greetings). Resetting.');
    state = 'greeting';
    gptMessages = [{ role: 'user', content: lastMessage }];
  } else {
    // Normal flow: use last 6 deduped messages (focused context)
    gptMessages = deduped.slice(-6).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));
  }
  const systemPrompt = buildSystemPrompt(state, cart, fulfillment, contact, menu, restaurantName);
  console.log('[AI] Calling GPT with state:', state, 'messages:', gptMessages.length);
  const gptResponse = await callGPT(systemPrompt, gptMessages, 500, true);
  console.log('[AI] GPT returned:', gptResponse ? gptResponse.substring(0, 200) : 'NULL');

  let response = '';
  let newState = state;
  let orderData = null;
  let confidence = 0.85;

  if (gptResponse) {
    try {
      const parsed = JSON.parse(gptResponse);
      response = parsed.reply || '';
      newState = parsed.state || state;
      confidence = 0.9;
      if (Array.isArray(parsed.cart) && parsed.cart.length > 0) {
        cart = parsed.cart.map(item => ({ name: item.name || 'Ukendt', price: Number(item.price) || 0, quantity: Number(item.quantity) || 1 }));
      }
      if (parsed.fulfillment && parsed.fulfillment !== 'null') fulfillment = parsed.fulfillment;
      if (parsed.contact && typeof parsed.contact === 'object') {
        if (parsed.contact.name) contact.name = parsed.contact.name;
        if (parsed.contact.phone) contact.phone = parsed.contact.phone;
        if (parsed.contact.address) contact.address = parsed.contact.address;
      }
      if (parsed.orderReady === true || newState === 'completed') {
        const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
        const fee = fulfillment === 'delivery' ? 39 : 0;
        orderData = { items: cart, subtotal: total, deliveryFee: fee, total: total + fee, fulfillmentType: fulfillment || 'pickup', customerName: contact.name, customerPhone: contact.phone, deliveryAddress: contact.address };
      }
    } catch (parseErr) {
      console.error('[AI] JSON parse failed, using raw:', parseErr.message);
      response = gptResponse;
    }
  }

  if (!response) {
    response = 'Hej! 😊 Hvordan kan jeg hjælpe dig?';
  }

  return { text: response, intent: 'ai', confidence, orderData, newState: { state: newState, cart, fulfillment, contact } };
}

/**
 * Get page access token from database
 */
async function getPageAccessToken(supabase, pageId, channel) {
  // Try to find token by page_id
  const { data } = await supabase
    .from('social_integrations')
    .select('access_token')
    .eq('page_id', pageId)
    .eq('platform', channel)
    .eq('status', 'connected')
    .limit(1);

  if (data && data.length > 0) {
    return data[0].access_token;
  }

  // Fallback to env var
  return META_PAGE_ACCESS_TOKEN || null;
}

/**
 * Send message via Meta API
 */
async function sendMetaMessage(channel, recipientId, text, supabase, pageId) {
  console.log(`[Meta] Sending ${channel} message to ${recipientId}: ${text}`);

  const accessToken = supabase && pageId
    ? await getPageAccessToken(supabase, pageId, channel)
    : META_PAGE_ACCESS_TOKEN;

  if (!accessToken) {
    console.log('[Meta] No access token available, skipping send');
    return;
  }

  const apiUrl = 'https://graph.facebook.com/v21.0/me/messages';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
        access_token: accessToken
      })
    });

    const result = await response.json();

    if (result.error) {
      console.error('[Meta] Send error:', result.error);
    } else {
      console.log('[Meta] Message sent:', result.message_id);
    }
  } catch (err) {
    console.error('[Meta] API error:', err);
  }
}

/**
 * Create unified order
 */
async function createOrder(supabase, tenantId, threadId, customerId, channel, orderData) {
  const { data: order } = await supabase
    .from('unified_orders')
    .insert({
      tenant_id: tenantId,
      source_channel: channel,
      thread_id: threadId,
      customer_id: customerId,
      line_items: orderData.items || [],
      subtotal: orderData.subtotal || 0,
      delivery_fee: orderData.deliveryFee || 0,
      total: orderData.total || 0,
      fulfillment_type: orderData.fulfillmentType || 'pickup',
      status: 'draft'
    })
    .select()
    .single();

  await storeMessage(supabase, threadId, {
    direction: 'outbound',
    senderType: 'system',
    content: `Ordre oprettet: ${order.order_number}`,
    messageType: 'order_event',
    externalMessageId: null,
    metadata: { orderId: order.id, orderNumber: order.order_number }
  });

  return order;
}
