import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// SMS provider configuration (InMobile, Twilio, etc.)
const SMS_PROVIDER = process.env.SMS_PROVIDER || 'inmobile';
const SMS_API_KEY = process.env.SMS_API_KEY;
const SMS_SENDER = process.env.SMS_SENDER || 'OrderFlow';

/**
 * SMS Webhook Handler
 * POST /api/webhooks/sms
 *
 * Receives incoming SMS from provider and routes through unified inbox.
 * Supports: InMobile, Twilio, MessageBird formats
 *
 * Flow:
 * 1. Parse incoming message (provider-agnostic)
 * 2. Idempotency check (deduplicate)
 * 3. Resolve tenant from receiving number
 * 4. Find or create customer
 * 5. Find or create conversation thread
 * 6. Store message
 * 7. Process with AI agent
 * 8. Send response via SMS
 */
export default async function handler(req, res) {
  // Health check
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'SMS webhook active',
      provider: SMS_PROVIDER,
      timestamp: new Date().toISOString()
    });
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

    console.log('[SMS Webhook] Incoming:', JSON.stringify(body));

    // Parse message based on provider format
    const parsed = parseIncomingSMS(body);
    if (!parsed.valid) {
      console.log('[SMS Webhook] Invalid message:', parsed.error);
      return res.status(200).json({ status: 'ignored', reason: parsed.error });
    }

    const { phone, content, messageId, receiverNumber } = parsed;

    // Step 1: Idempotency check
    const isDuplicate = await checkIdempotency(supabase, 'sms', messageId);
    if (isDuplicate) {
      console.log('[SMS Webhook] Duplicate message:', messageId);
      return res.status(200).json({ status: 'duplicate', messageId });
    }

    // Step 2: Resolve tenant from receiving number
    const tenantId = await resolveTenant(supabase, receiverNumber);
    if (!tenantId) {
      console.log('[SMS Webhook] Unknown receiving number:', receiverNumber);
      return res.status(200).json({ status: 'ignored', reason: 'unknown_receiver' });
    }

    // Step 3: Find or create customer
    const customer = await getOrCreateCustomer(supabase, tenantId, { phone });

    // Step 4: Find or create conversation thread
    const thread = await getOrCreateThread(supabase, tenantId, customer.id, 'sms', phone);

    // Step 5: Store incoming message
    const message = await storeMessage(supabase, thread.id, {
      direction: 'inbound',
      senderType: 'customer',
      content: content,
      externalMessageId: messageId,
      metadata: { phone, provider: SMS_PROVIDER }
    });

    // Step 6: Mark idempotency
    await markProcessed(supabase, 'sms', messageId, tenantId);

    // Step 7: Process with AI agent (async - don't block webhook response)
    processWithAI(supabase, thread, message, customer, tenantId).catch(err => {
      console.error('[SMS Webhook] AI processing error:', err);
    });

    return res.status(200).json({
      status: 'success',
      threadId: thread.id,
      messageId: message.id
    });

  } catch (err) {
    console.error('[SMS Webhook] Error:', err);
    return res.status(200).json({ status: 'error', message: err.message });
  }
}

/**
 * Parse incoming SMS from various providers
 */
function parseIncomingSMS(body) {
  // InMobile format
  if (body.msisdn && body.text) {
    return {
      valid: true,
      phone: normalizePhone(body.msisdn),
      content: body.text,
      messageId: body.id || body.messageId || `inmobile-${Date.now()}`,
      receiverNumber: body.receiver || body.shortcode || ''
    };
  }

  // Twilio format
  if (body.From && body.Body) {
    return {
      valid: true,
      phone: normalizePhone(body.From),
      content: body.Body,
      messageId: body.MessageSid || body.SmsSid || `twilio-${Date.now()}`,
      receiverNumber: body.To || ''
    };
  }

  // MessageBird format
  if (body.originator && body.body) {
    return {
      valid: true,
      phone: normalizePhone(body.originator),
      content: body.body,
      messageId: body.id || `messagebird-${Date.now()}`,
      receiverNumber: body.recipient || ''
    };
  }

  // Generic format
  if (body.phone && body.message) {
    return {
      valid: true,
      phone: normalizePhone(body.phone),
      content: body.message,
      messageId: body.id || `generic-${Date.now()}`,
      receiverNumber: body.to || ''
    };
  }

  return { valid: false, error: 'Unknown message format' };
}

/**
 * Normalize phone number to E.164 format
 */
function normalizePhone(phone) {
  if (!phone) return '';

  let normalized = phone.toString().replace(/\D/g, '');

  // Danish numbers without country code
  if (normalized.length === 8 && !normalized.startsWith('45')) {
    normalized = '45' + normalized;
  }

  // Add + prefix
  if (!normalized.startsWith('+')) {
    normalized = '+' + normalized;
  }

  return normalized;
}

/**
 * Check if message was already processed
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
 * Mark message as processed
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
 * Resolve tenant from receiving phone number
 */
async function resolveTenant(supabase, receiverNumber) {
  // Look up in tenant configuration
  const { data } = await supabase
    .from('restaurants')
    .select('id')
    .eq('sms_number', receiverNumber)
    .limit(1);

  if (data && data.length > 0) {
    return data[0].id;
  }

  // Fallback: use default tenant (for demo)
  const { data: defaultTenant } = await supabase
    .from('restaurants')
    .select('id')
    .limit(1);

  return defaultTenant?.[0]?.id || null;
}

/**
 * Find or create customer
 */
async function getOrCreateCustomer(supabase, tenantId, { phone, email, name }) {
  const { data } = await supabase.rpc('get_or_create_customer', {
    p_tenant_id: tenantId,
    p_phone: phone || null,
    p_email: email || null,
    p_name: name || null
  });

  if (data && data.length > 0) {
    return data[0];
  }

  // Fallback: direct insert
  const { data: inserted } = await supabase
    .from('customers')
    .insert({ tenant_id: tenantId, phone })
    .select()
    .single();

  return inserted;
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
    // Update last_message_at
    await supabase
      .from('conversation_threads')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', existing[0].id);

    return existing[0];
  }

  // Create new thread
  const { data: newThread } = await supabase
    .from('conversation_threads')
    .insert({
      tenant_id: tenantId,
      customer_id: customerId,
      channel: channel,
      external_thread_id: externalId,
      status: 'open',
      last_message_at: new Date().toISOString()
    })
    .select()
    .single();

  return newThread;
}

/**
 * Store message in thread
 */
async function storeMessage(supabase, threadId, { direction, senderType, content, externalMessageId, metadata }) {
  const { data } = await supabase
    .from('thread_messages')
    .insert({
      thread_id: threadId,
      direction,
      sender_type: senderType,
      content,
      message_type: 'text',
      external_message_id: externalMessageId,
      metadata
    })
    .select()
    .single();

  return data;
}

/**
 * Process message with AI agent and send response
 */
async function processWithAI(supabase, thread, message, customer, tenantId) {
  try {
    // Load conversation history
    const { data: history } = await supabase
      .from('thread_messages')
      .select('*')
      .eq('thread_id', thread.id)
      .order('created_at', { ascending: true })
      .limit(20);

    // Load tenant menu for AI context
    const { data: menu } = await supabase.rpc('get_site_menu', { p_tenant_id: tenantId });

    // Format conversation for AI
    const conversation = (history || []).map(msg => ({
      role: msg.direction === 'inbound' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Call AI agent (would be OrderingAgent in production)
    const aiResponse = await callOrderingAgent(conversation, menu, customer);

    // Calculate confidence score
    const confidence = aiResponse.confidence || 0.85;

    // Update thread with AI confidence
    await supabase
      .from('conversation_threads')
      .update({
        ai_confidence: confidence,
        requires_attention: confidence < 0.7
      })
      .eq('id', thread.id);

    // Store AI response
    await storeMessage(supabase, thread.id, {
      direction: 'outbound',
      senderType: 'ai',
      content: aiResponse.text,
      externalMessageId: null,
      metadata: {
        confidence,
        intent: aiResponse.intent,
        orderData: aiResponse.orderData
      }
    });

    // Send SMS response
    if (aiResponse.text && customer.phone) {
      await sendSMS(customer.phone, aiResponse.text);
    }

    // Create order if AI detected order intent
    if (aiResponse.orderData && aiResponse.intent === 'order') {
      await createOrderFromAI(supabase, tenantId, thread.id, customer.id, aiResponse.orderData);
    }

  } catch (err) {
    console.error('[SMS Webhook] AI processing failed:', err);

    // Mark thread as requiring attention
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
 * Call OrderingAgent for message processing
 * In production, this would call the actual AI service
 */
async function callOrderingAgent(conversation, menu, customer) {
  // Simplified AI response for webhook
  // In production, call OpenAI or Claude API
  const lastMessage = conversation[conversation.length - 1]?.content || '';

  // Simple intent detection
  const orderKeywords = ['bestil', 'ordre', 'pizza', 'burger', 'levering', 'køb'];
  const isOrderIntent = orderKeywords.some(k => lastMessage.toLowerCase().includes(k));

  if (isOrderIntent) {
    return {
      text: 'Tak for din besked! Jeg kan hjælpe dig med at bestille. Hvad vil du gerne have?',
      intent: 'order_inquiry',
      confidence: 0.85,
      orderData: null
    };
  }

  return {
    text: 'Tak for din henvendelse. Hvordan kan jeg hjælpe dig i dag?',
    intent: 'general',
    confidence: 0.75,
    orderData: null
  };
}

/**
 * Send SMS via provider
 */
async function sendSMS(phone, text) {
  console.log(`[SMS] Sending to ${phone}: ${text}`);

  // In production, call SMS provider API
  // Example for InMobile:
  /*
  if (SMS_PROVIDER === 'inmobile') {
    await fetch('https://api.inmobile.com/v4/sms/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SMS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{
          from: SMS_SENDER,
          to: phone,
          text: text
        }]
      })
    });
  }
  */
}

/**
 * Create unified order from AI extracted data
 */
async function createOrderFromAI(supabase, tenantId, threadId, customerId, orderData) {
  const { data: order } = await supabase
    .from('unified_orders')
    .insert({
      tenant_id: tenantId,
      source_channel: 'sms',
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

  // Add order event to thread
  await storeMessage(supabase, threadId, {
    direction: 'outbound',
    senderType: 'system',
    content: `Ordre oprettet: ${order.order_number}`,
    externalMessageId: null,
    metadata: { orderId: order.id, orderNumber: order.order_number }
  });

  return order;
}
