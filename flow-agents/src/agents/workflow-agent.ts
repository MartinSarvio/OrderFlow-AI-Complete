import { config } from '../config.js';
import { parseSmsReply, validateAgainstOrder } from '../tools/sms-parser.js';
import { findOrderByPhone, findThreadByPhone, queryMessages, updateOrderStatus, checkIdempotency, getRestaurantConfig } from '../tools/supabase-query.js';
import { createAuditLogger } from '../hooks/audit-logger.js';
import { createErrorNotifier } from '../hooks/error-notifier.js';

// ============================================================
// Workflow Agent — Order SMS orchestration + edge cases
// ============================================================

const SYSTEM_PROMPT = `Du er FLOW-agenten for restaurant- og takeaway-service.

## Persona (skal kunne mærkes i hvert svar)
Du har mere end 20 års erfaring fra service, restaurant, fast food og take away.
Du møder gæsten med sikkerhed og varme fra første kontakt.
Du giver præcise og rolige svar, lytter aktivt, og guider kunden hele vejen til færdig bestilling.
Du er personlig, ærlig og professionel.

## Samtaleregler
- Svar altid i en menneskelig samtaletone, kort og klart (maks 160 tegn).
- Svar altid på kundens sprog (dansk/engelsk). Dansk er default.
- Spørg aldrig om "ordre-ID" fra kunden.
- Hvis der IKKE er en aktiv ordre og kunden vil bestille:
  - Spørg altid først: levering eller afhentning.
  - Men hvis levering er deaktiveret i restaurantens indstillinger/notifikationer, så sig tydeligt at kun afhentning er muligt.
- Bekræft altid næste konkrete skridt, så kunden ved hvad de skal svare.

## Handlinger
- confirm: bekræft ordre
- cancel: annuller ordre (hvis tilladt)
- reschedule: ændr tidspunkt
- answer: besvar spørgsmål
- escalate: eskalér (fx allergi)
- clarify: afklar næste input fra kunden
- ignore: ignorer dublet/irrelevant

Returnér altid gyldig JSON:
{
  "action": "confirm|cancel|reschedule|answer|escalate|clarify|ignore",
  "smsReply": "kort SMS-tekst",
  "statusUpdate": "ny status eller null",
  "escalation": "eskaleringsbesked eller null",
  "confidence": 0.0-1.0,
  "reasoning": "kort begrundelse"
}`;

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

function extractFirstJsonObject(text: string): string | null {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

async function callOpenAIChat(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 400,
  temperature = 0.2,
): Promise<string> {
  if (!config.openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.openaiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned empty content');
  }
  return content;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function readBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'ja', 'on', 'enabled'].includes(normalized)) return true;
    if (['false', '0', 'no', 'nej', 'off', 'disabled'].includes(normalized)) return false;
  }
  return undefined;
}

function readPathBoolean(root: Record<string, unknown>, path: string): boolean | undefined {
  const parts = path.split('.');
  let current: unknown = root;
  for (const part of parts) {
    current = asRecord(current)[part];
    if (current === undefined) return undefined;
  }
  return readBoolean(current);
}

function resolveDeliveryEnabled(restaurant: Record<string, unknown> | null): boolean {
  if (!restaurant) return true;

  const directFalsePaths = [
    'deliveryEnabled',
    'delivery_enabled',
    'settings.deliveryEnabled',
    'settings.delivery_enabled',
    'workflow.deliveryEnabled',
    'workflow.delivery_enabled',
    'workflowSettings.deliveryEnabled',
    'metadata.deliveryEnabled',
    'metadata.delivery_enabled',
    'notifications.deliveryEnabled',
    'notifications.delivery_enabled',
  ];
  for (const path of directFalsePaths) {
    const value = readPathBoolean(restaurant, path);
    if (value !== undefined) return value;
  }

  const inversePaths = [
    'notifications.no_delivery',
    'notifications.noDelivery',
    'notifications.deliveryDenied',
  ];
  for (const path of inversePaths) {
    const value = readPathBoolean(restaurant, path);
    if (value !== undefined) return !value;
  }

  const allowPaths = [
    'notifications.allow_delivery',
    'notifications.allowDelivery',
  ];
  for (const path of allowPaths) {
    const value = readPathBoolean(restaurant, path);
    if (value !== undefined) return value;
  }

  return true;
}

function resolveRestaurantName(restaurant: Record<string, unknown> | null): string {
  const name = String(restaurant?.name || '').trim();
  return name || 'restauranten';
}

function buildInitialOrderReply(language: 'da' | 'en' | 'unknown', restaurantName: string, deliveryEnabled: boolean): string {
  if (deliveryEnabled) {
    return language === 'en'
      ? `Great, I can help with that at ${restaurantName}. Do you want delivery or pickup?`
      : `Perfekt, jeg hjælper dig gerne hos ${restaurantName}. Ønsker du levering eller afhentning?`;
  }

  return language === 'en'
    ? `Great, I can help at ${restaurantName}. We currently offer pickup only. What would you like to order?`
    : `Perfekt, jeg hjælper dig gerne hos ${restaurantName}. Vi tilbyder kun afhentning lige nu. Hvad vil du bestille?`;
}

// ── Types ────────────────────────────────────────────────────

export interface IncomingSMS {
  messageId: string;
  from: string;        // Phone number
  body: string;        // SMS text
  receivedAt: string;  // ISO 8601
  tenantId?: string;
}

export interface WorkflowResult {
  messageId: string;
  intent: string;
  confidence: number;
  action: string;
  smsReply: string | null;
  statusUpdate: string | null;
  escalation: string | null;
  orderId: string | null;
  threadId: string | null;
  processing: {
    durationMs: number;
    steps: string[];
  };
}

// ── State ────────────────────────────────────────────────────

let processedCount = 0;

// ── Main workflow processing ─────────────────────────────────

/**
 * Process an incoming SMS through the workflow
 */
export async function processIncomingSms(sms: IncomingSMS): Promise<WorkflowResult> {
  const startTime = performance.now();
  const steps: string[] = [];
  const auditLogger = createAuditLogger(`wf-${sms.messageId}`, 'workflow-agent');
  const notifier = createErrorNotifier('workflow-agent');

  auditLogger.logAgentStart({ messageId: sms.messageId, from: sms.from });

  // Step 1: Idempotency check
  steps.push('idempotency_check');
  const { isDuplicate } = await checkIdempotency(sms.messageId, sms.tenantId);
  if (isDuplicate) {
    console.log(`[WorkflowAgent] Duplicate SMS ignored: ${sms.messageId}`);
    auditLogger.logAgentStop({ result: 'duplicate_ignored' });
    return {
      messageId: sms.messageId,
      intent: 'duplicate',
      confidence: 1.0,
      action: 'ignore',
      smsReply: null,
      statusUpdate: null,
      escalation: null,
      orderId: null,
      threadId: null,
      processing: { durationMs: Math.round(performance.now() - startTime), steps },
    };
  }

  // Step 2: Parse SMS intent
  steps.push('parse_sms');
  const parsed = parseSmsReply(sms.body);
  console.log(`[WorkflowAgent] Parsed: intent=${parsed.intent}, confidence=${parsed.confidence}, lang=${parsed.language}`);

  // Step 3: Find associated order and thread
  steps.push('find_order');
  const orderResult = await findOrderByPhone(sms.from);
  const threadResult = await findThreadByPhone(sms.from);

  const orderId = orderResult.data?.id as string | null;
  const threadId = threadResult.data?.id as string | null;
  const orderStatus = (orderResult.data?.status as string) || 'unknown';
  const tenantId = sms.tenantId || (threadResult.data?.tenant_id as string | undefined) || undefined;

  // Step 3.1: Load restaurant settings (delivery on/off, name)
  let restaurantConfig: Record<string, unknown> | null = null;
  if (tenantId) {
    steps.push('load_restaurant_settings');
    const restaurantResult = await getRestaurantConfig({ restaurant_id: tenantId });
    restaurantConfig = restaurantResult.data;
  }
  const deliveryEnabled = resolveDeliveryEnabled(restaurantConfig);
  const restaurantName = resolveRestaurantName(restaurantConfig);

  if (!orderId) {
    console.log(`[WorkflowAgent] No active order found for ${sms.from}`);
    // Start bestilling-samtale menneskeligt: spørg levering/afhentning (eller kun afhentning hvis levering er slået fra).
    if (parsed.intent !== 'allergy' && parsed.intent !== 'question') {
      steps.push('no_order_found');
      auditLogger.logAgentStop({ result: 'no_order_start_order_flow' });
      return {
        messageId: sms.messageId,
        intent: parsed.intent,
        confidence: parsed.confidence,
        action: 'clarify',
        smsReply: buildInitialOrderReply(parsed.language, restaurantName, deliveryEnabled),
        statusUpdate: null,
        escalation: null,
        orderId: null,
        threadId,
        processing: { durationMs: Math.round(performance.now() - startTime), steps },
      };
    }

    if (parsed.intent === 'question') {
      steps.push('no_order_continue_ai');
    }
  }

  // Step 4: Validate against order status
  steps.push('validate_order');
  const validation = validateAgainstOrder(parsed, orderStatus);

  // Step 5: Handle CRITICAL allergy — immediate escalation
  if (parsed.intent === 'allergy') {
    steps.push('critical_allergy_escalation');
    await notifier.notifyAllergyEscalation(
      orderId || 'UNKNOWN',
      parsed.extractedData.allergyInfo || sms.body,
      sms.from
    );
    auditLogger.logEscalation('Allergy alert', {
      orderId,
      allergyInfo: parsed.extractedData.allergyInfo,
      phone: sms.from,
    });

    return {
      messageId: sms.messageId,
      intent: 'allergy',
      confidence: parsed.confidence,
      action: 'escalate',
      smsReply: parsed.language === 'en'
        ? 'Your allergy information has been forwarded to the restaurant IMMEDIATELY. A staff member will contact you shortly.'
        : 'Din allergi-information er sendt til restauranten ØJEBLIKKELIGT. En medarbejder kontakter dig snarest.',
      statusUpdate: 'allergy_hold',
      escalation: `ALLERGY ALERT: ${parsed.extractedData.allergyInfo || sms.body} — Order: ${orderId} — Phone: ${sms.from}`,
      orderId,
      threadId,
      processing: { durationMs: Math.round(performance.now() - startTime), steps },
    };
  }

  // Step 6: Handle based on confidence level
  if (parsed.confidence < 0.5 || parsed.intent === 'unknown') {
    // Low confidence or unknown — use OpenAI (ChatGPT) for analysis
    steps.push('openai_analysis');

    try {
      let agentResult = '';

      // Get conversation context if available
      let contextStr = '';
      if (threadId) {
        const messages = await queryMessages({ thread_id: threadId, limit: 5 });
        if (messages.data.length > 0) {
          contextStr = `\n\nSeneste beskeder i samtalen:\n${messages.data
            .map((m: Record<string, unknown>) => `[${m.direction}] ${m.content}`)
            .join('\n')}`;
        }
      }

      const agentPrompt = `Indgående SMS der kræver analyse:

Fra: ${sms.from}
Besked: "${sms.body}"
Ordre-ID: ${orderId || 'Ingen aktiv ordre'}
Ordre-status: ${orderStatus}
Restaurant: ${restaurantName}
Levering aktiveret: ${deliveryEnabled ? 'ja' : 'nej'}
Parsed intent: ${parsed.intent} (confidence: ${parsed.confidence})
Sprog: ${parsed.language}
Flags: ${parsed.flags.join(', ') || 'ingen'}
${contextStr}

Analyser beskeden og bestem den bedste handling. Svar med JSON.`;

      agentResult = await callOpenAIChat(
        `${SYSTEM_PROMPT}\n\nReturner KUN gyldig JSON uden markdown.`,
        agentPrompt,
        500,
        0.2,
      );

      // Parse agent response
      const jsonCandidate = extractFirstJsonObject(agentResult);
      if (jsonCandidate) {
        try {
          const agentDecision = JSON.parse(jsonCandidate);
          processedCount++;
          auditLogger.logAgentStop({ result: agentDecision.action });

          return {
            messageId: sms.messageId,
            intent: parsed.intent,
            confidence: agentDecision.confidence || parsed.confidence,
            action: agentDecision.action || 'clarify',
            smsReply: agentDecision.smsReply || null,
            statusUpdate: agentDecision.statusUpdate || null,
            escalation: agentDecision.escalation || null,
            orderId,
            threadId,
            processing: { durationMs: Math.round(performance.now() - startTime), steps },
          };
        } catch {
          // JSON parse failed, fall through to clarification
        }
      }
    } catch (err) {
      console.error('[WorkflowAgent] Agent error:', err);
      auditLogger.logError(err instanceof Error ? err.message : String(err));
    }

    // Fallback: send clarification
    steps.push('send_clarification');
    const clarifyWithoutOrder = parsed.language === 'en'
      ? 'Thanks for your message. Please write what you want to order, and we will continue from there.'
      : 'Tak for din besked. Skriv gerne hvad du vil bestille, sa fortsaetter vi herfra.';
    const clarifyWithOrder = parsed.language === 'en'
      ? "Sorry, we didn't understand your message. Please reply YES to confirm or NO to cancel your order."
      : 'Undskyld, vi forstod ikke dit svar. Svar venligst JA for at bekraefte eller NEJ for at annullere din ordre.';
    return {
      messageId: sms.messageId,
      intent: parsed.intent,
      confidence: parsed.confidence,
      action: 'clarify',
      smsReply: orderId ? clarifyWithOrder : clarifyWithoutOrder,
      statusUpdate: null,
      escalation: null,
      orderId,
      threadId,
      processing: { durationMs: Math.round(performance.now() - startTime), steps },
    };
  }

  // Step 7: High confidence — automatic handling
  steps.push(`auto_handle_${parsed.intent}`);

  // Check if validation allows the action
  if (!validation.valid) {
    steps.push('validation_failed');
    const failureReply = parsed.language === 'en'
      ? `Sorry, we can't process that request. ${validation.reason}`
      : `Beklager, vi kan ikke behandle den forespørgsel. ${validation.reason}`;

    return {
      messageId: sms.messageId,
      intent: parsed.intent,
      confidence: parsed.confidence,
      action: 'reject',
      smsReply: failureReply.substring(0, 160),
      statusUpdate: null,
      escalation: null,
      orderId,
      threadId,
      processing: { durationMs: Math.round(performance.now() - startTime), steps },
    };
  }

  // Execute the validated action
  let action = '';
  let smsReply = '';
  let statusUpdate: string | null = null;

  switch (parsed.intent) {
    case 'confirm': {
      action = 'confirm';
      statusUpdate = 'confirmed';
      smsReply = parsed.language === 'en'
        ? 'Thank you! Your order is confirmed \u2705'
        : 'Tak! Din ordre er bekræftet \u2705';

      if (orderId) {
        await updateOrderStatus({
          order_id: orderId,
          new_status: 'confirmed',
          reason: 'Customer confirmed via SMS',
          updated_by: 'workflow-agent',
        });
      }
      break;
    }

    case 'cancel': {
      action = 'cancel';
      statusUpdate = 'cancelled';
      smsReply = parsed.language === 'en'
        ? 'Your order has been cancelled. You will receive a refund within 3-5 days.'
        : 'Din ordre er annulleret. Du vil modtage refundering inden 3-5 dage.';

      if (orderId) {
        await updateOrderStatus({
          order_id: orderId,
          new_status: 'cancelled',
          reason: 'Customer cancelled via SMS',
          updated_by: 'workflow-agent',
        });
      }
      break;
    }

    case 'reschedule': {
      action = 'reschedule';
      const newTime = parsed.extractedData.time || parsed.extractedData.date || 'unspecified';
      statusUpdate = 'rescheduled';
      smsReply = parsed.language === 'en'
        ? `Time changed to ${newTime} \u2705`
        : `Tidspunkt ændret til ${newTime} \u2705`;

      if (orderId) {
        await updateOrderStatus({
          order_id: orderId,
          new_status: 'rescheduled',
          reason: `Customer rescheduled via SMS to ${newTime}`,
          updated_by: 'workflow-agent',
        });
      }
      break;
    }

    case 'question': {
      // Questions use OpenAI (ChatGPT) for a concise answer
      action = 'answer';
      steps.push('generate_answer');

      try {
        const answer = await callOpenAIChat(
          `${SYSTEM_PROMPT}\n\nSkriv kun selve SMS-svaret (ingen JSON), max 160 tegn, ingen markdown.`,
          `Kunde spørger: "${sms.body}"
Ordre-status: ${orderStatus}
Restaurant: ${restaurantName}
Levering aktiveret: ${deliveryEnabled ? 'ja' : 'nej'}
Sprog: ${parsed.language === 'en' ? 'engelsk' : 'dansk'}.
Hvis kunden spørger til bestilling og der ikke er aktiv ordre, spørg levering/afhentning (eller kun afhentning hvis levering er deaktiveret).`,
          120,
          0.2,
        );
        smsReply = answer.substring(0, 160);
      } catch (err) {
        console.error('[WorkflowAgent] Question answer generation failed:', err);
        const lower = sms.body.toLowerCase();
        const asksDelivery = /levering|delivery/.test(lower);
        if (asksDelivery && !deliveryEnabled) {
          smsReply = parsed.language === 'en'
            ? 'We currently offer pickup only. What would you like to order?'
            : 'Vi tilbyder kun afhentning lige nu. Hvad vil du bestille?';
        } else {
          smsReply = parsed.language === 'en'
            ? 'We received your question and will get back to you shortly.'
            : 'Vi har modtaget dit spørgsmål og vender tilbage snarest.';
        }
      }
      break;
    }

    default: {
      action = 'clarify';
      smsReply = orderId
        ? (parsed.language === 'en'
          ? "Sorry, we didn't understand your message. Please reply YES to confirm or NO to cancel."
          : 'Undskyld, vi forstod ikke dit svar. Svar venligst JA for at bekraefte eller NEJ for at annullere.')
        : (parsed.language === 'en'
          ? 'Thanks for your message. Please write what you want to order, and we will continue from there.'
          : 'Tak for din besked. Skriv gerne hvad du vil bestille, sa fortsaetter vi herfra.');
    }
  }

  processedCount++;
  auditLogger.logAgentStop({ action, intent: parsed.intent });

  return {
    messageId: sms.messageId,
    intent: parsed.intent,
    confidence: parsed.confidence,
    action,
    smsReply: smsReply.substring(0, 160),
    statusUpdate,
    escalation: null,
    orderId,
    threadId,
    processing: { durationMs: Math.round(performance.now() - startTime), steps },
  };
}

/**
 * Get agent state
 */
export function getWorkflowState() {
  return {
    openaiModel: config.openaiModel,
    processedCount,
  };
}

/**
 * Reset agent state (for testing)
 */
export function resetWorkflowState() {
  processedCount = 0;
}

// ── Standalone execution (for testing) ───────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Starting Workflow Agent (standalone test)...');

  const testSms: IncomingSMS = {
    messageId: `test-${Date.now()}`,
    from: '+4512345678',
    body: process.argv[2] || 'ja tak',
    receivedAt: new Date().toISOString(),
  };

  console.log(`Testing with message: "${testSms.body}"`);

  processIncomingSms(testSms)
    .then((result) => {
      console.log('\nResult:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
