import { SMS_PATTERNS, type IntentType } from '../config.js';

// ============================================================
// SMS Parser Tool — Intent detection for customer SMS replies
// ============================================================

export interface ParsedSMS {
  intent: IntentType;
  confidence: number;
  rawMessage: string;
  normalizedMessage: string;
  extractedData: Record<string, string>;
  language: 'da' | 'en' | 'unknown';
  flags: string[];
}

export interface OrderValidation {
  valid: boolean;
  reason: string;
  orderStatus: string;
  suggestedAction: string;
}

// ── Language detection patterns ──────────────────────────────

const DANISH_MARKERS = /\b(ja|nej|tak|hej|goddag|venligst|bestilling|allergi|nødder|gluten|laktose|hvad|hvordan|hvornår|hvor|og|er|det|en|til|fra|med|ikke|kan|vil|skal|har|får|gør|ændre|tid|senere|annuller|bekræft|godkend|afbestil|fortryd)\b/i;
const ENGLISH_MARKERS = /\b(yes|no|please|hello|order|allergy|nuts|gluten|lactose|what|how|when|where|and|is|the|a|to|from|with|not|can|will|shall|have|get|do|change|time|later|cancel|confirm|accept)\b/i;

// ── Time extraction patterns ─────────────────────────────────

const TIME_PATTERNS = [
  /kl\.?\s*(\d{1,2})[.:]?(\d{2})?/i,           // kl 19, kl. 19:30, kl 19.30
  /(\d{1,2})[.:](\d{2})\s*(pm|am)?/i,           // 19:30, 7:30pm
  /(\d{1,2})\s*(pm|am)/i,                        // 7pm, 7 am
  /om\s+(\d+)\s*(time|timer|minut|minutter)/i,   // om 2 timer, om 30 minutter
  /in\s+(\d+)\s*(hour|hours|minute|minutes)/i,   // in 2 hours, in 30 minutes
];

// ── Date extraction patterns ─────────────────────────────────

const DATE_PATTERNS = [
  /i\s*(morgen|overmorgen)/i,                                    // i morgen, i overmorgen
  /(tomorrow|day after tomorrow)/i,                              // tomorrow
  /(mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag)/i,  // weekdays Danish
  /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, // weekdays English
  /(\d{1,2})[./-](\d{1,2})/,                                    // 15/3, 15.3, 15-3
];

// ── Emoji intent mapping ─────────────────────────────────────

const EMOJI_INTENTS: Record<string, { intent: IntentType; confidence: number }> = {
  '\uD83D\uDC4D': { intent: 'confirm', confidence: 0.7 },   // 👍
  '\uD83D\uDC4E': { intent: 'cancel', confidence: 0.7 },    // 👎
  '\u2705': { intent: 'confirm', confidence: 0.8 },           // ✅
  '\u274C': { intent: 'cancel', confidence: 0.8 },            // ❌
  '\uD83D\uDE4F': { intent: 'confirm', confidence: 0.6 },   // 🙏
  '\uD83D\uDC4C': { intent: 'confirm', confidence: 0.7 },   // 👌
};

/**
 * Detect language of SMS message
 */
function detectLanguage(message: string): 'da' | 'en' | 'unknown' {
  const danishMatches = (message.match(DANISH_MARKERS) || []).length;
  const englishMatches = (message.match(ENGLISH_MARKERS) || []).length;

  if (danishMatches > englishMatches) return 'da';
  if (englishMatches > danishMatches) return 'en';
  // Check for Danish-specific characters
  if (/[æøåÆØÅ]/.test(message)) return 'da';
  return 'unknown';
}

/**
 * Extract time information from message
 */
function extractTime(message: string): string | null {
  for (const pattern of TIME_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }
  return null;
}

/**
 * Extract date information from message
 */
function extractDate(message: string): string | null {
  for (const pattern of DATE_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }
  return null;
}

/**
 * Check if message is emoji-only
 */
function isEmojiOnly(message: string): boolean {
  const stripped = message.replace(/[\s\uFE0F\u200D]/g, '');
  // Check if all characters are emoji
  const emojiPattern = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{231A}-\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2614}-\u{2615}\u{2648}-\u{2653}\u{267F}\u{2693}\u{26A1}\u{26AA}-\u{26AB}\u{26BD}-\u{26BE}\u{26C4}-\u{26C5}\u{26CE}\u{26D4}\u{26EA}\u{26F2}-\u{26F3}\u{26F5}\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}\u{2712}\u{2714}\u{2716}\u{271D}\u{2721}\u{2728}\u{2733}-\u{2734}\u{2744}\u{2747}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}-\u{2764}\u{2795}-\u{2797}\u{27A1}\u{27B0}\u{27BF}]+$/u;
  return emojiPattern.test(stripped);
}

/**
 * Parse an SMS reply and detect intent
 */
export function parseSmsReply(message: string): ParsedSMS {
  const normalized = message.trim().toLowerCase();
  const flags: string[] = [];
  const extractedData: Record<string, string> = {};

  // Check for emoji-only messages
  if (isEmojiOnly(message.trim())) {
    flags.push('emoji_only');
    // Check known emoji intents
    for (const [emoji, mapping] of Object.entries(EMOJI_INTENTS)) {
      if (message.includes(emoji)) {
        flags.push('low_confidence_emoji');
        return {
          intent: mapping.intent,
          confidence: mapping.confidence,
          rawMessage: message,
          normalizedMessage: normalized,
          extractedData,
          language: 'unknown',
          flags,
        };
      }
    }
    // Unknown emoji
    return {
      intent: 'unknown',
      confidence: 0.3,
      rawMessage: message,
      normalizedMessage: normalized,
      extractedData,
      language: 'unknown',
      flags: [...flags, 'unrecognized_emoji'],
    };
  }

  // Detect language
  const language = detectLanguage(message);

  // Extract time/date data
  const time = extractTime(message);
  const date = extractDate(message);
  if (time) extractedData.time = time;
  if (date) extractedData.date = date;

  // Check patterns in priority order
  // 1. Allergy — highest priority, always escalate
  for (const pattern of SMS_PATTERNS.allergy.patterns) {
    if (pattern.test(normalized)) {
      flags.push('critical_allergy');
      const allergyMatch = normalized.match(pattern);
      if (allergyMatch) extractedData.allergyInfo = allergyMatch[0];
      return {
        intent: 'allergy',
        confidence: SMS_PATTERNS.allergy.confidence,
        rawMessage: message,
        normalizedMessage: normalized,
        extractedData,
        language,
        flags,
      };
    }
  }

  // 2. Cancel
  for (const pattern of SMS_PATTERNS.cancel.patterns) {
    if (pattern.test(normalized)) {
      return {
        intent: 'cancel',
        confidence: SMS_PATTERNS.cancel.confidence,
        rawMessage: message,
        normalizedMessage: normalized,
        extractedData,
        language,
        flags,
      };
    }
  }

  // 3. Reschedule (check before confirm — "ja ændre til kl 19" should be reschedule)
  for (const pattern of SMS_PATTERNS.reschedule.patterns) {
    if (pattern.test(normalized)) {
      return {
        intent: 'reschedule',
        confidence: SMS_PATTERNS.reschedule.confidence,
        rawMessage: message,
        normalizedMessage: normalized,
        extractedData,
        language,
        flags,
      };
    }
  }

  // 4. Confirm
  for (const pattern of SMS_PATTERNS.confirm.patterns) {
    if (pattern.test(normalized)) {
      return {
        intent: 'confirm',
        confidence: SMS_PATTERNS.confirm.confidence,
        rawMessage: message,
        normalizedMessage: normalized,
        extractedData,
        language,
        flags,
      };
    }
  }

  // 5. Question
  for (const pattern of SMS_PATTERNS.question.patterns) {
    if (pattern.test(normalized)) {
      return {
        intent: 'question',
        confidence: SMS_PATTERNS.question.confidence,
        rawMessage: message,
        normalizedMessage: normalized,
        extractedData,
        language,
        flags,
      };
    }
  }

  // 6. Delivery
  for (const pattern of SMS_PATTERNS.delivery.patterns) {
    if (pattern.test(normalized)) {
      return {
        intent: 'delivery',
        confidence: SMS_PATTERNS.delivery.confidence,
        rawMessage: message,
        normalizedMessage: normalized,
        extractedData,
        language,
        flags,
      };
    }
  }

  // 7. Pickup
  for (const pattern of SMS_PATTERNS.pickup.patterns) {
    if (pattern.test(normalized)) {
      return {
        intent: 'pickup',
        confidence: SMS_PATTERNS.pickup.confidence,
        rawMessage: message,
        normalizedMessage: normalized,
        extractedData,
        language,
        flags,
      };
    }
  }

  // 8. Order (food items with quantity)
  for (const pattern of SMS_PATTERNS.order.patterns) {
    if (pattern.test(normalized)) {
      const match = normalized.match(pattern);
      if (match) {
        extractedData.orderItems = match[0];
      }
      return {
        intent: 'order',
        confidence: SMS_PATTERNS.order.confidence,
        rawMessage: message,
        normalizedMessage: normalized,
        extractedData,
        language,
        flags,
      };
    }
  }

  // No match — unknown intent
  flags.push('no_pattern_match');
  return {
    intent: 'unknown',
    confidence: 0.0,
    rawMessage: message,
    normalizedMessage: normalized,
    extractedData,
    language,
    flags,
  };
}

/**
 * Validate parsed SMS against order status
 */
export function validateAgainstOrder(
  parsed: ParsedSMS,
  orderStatus: string,
  orderData?: Record<string, unknown>
): OrderValidation {
  // Check if order is already completed
  const completedStatuses = ['completed', 'delivered', 'færdig', 'leveret', 'afsluttet'];
  if (completedStatuses.includes(orderStatus.toLowerCase())) {
    return {
      valid: false,
      reason: `Order is already ${orderStatus} — cannot ${parsed.intent}`,
      orderStatus,
      suggestedAction: 'inform_customer_order_complete',
    };
  }

  // Check if order is already cancelled
  const cancelledStatuses = ['cancelled', 'annulleret', 'refunded'];
  if (cancelledStatuses.includes(orderStatus.toLowerCase())) {
    return {
      valid: false,
      reason: `Order is already ${orderStatus}`,
      orderStatus,
      suggestedAction: 'inform_customer_order_cancelled',
    };
  }

  // Intent-specific validations
  switch (parsed.intent) {
    case 'cancel': {
      const inProgressStatuses = ['preparing', 'tilberedes', 'cooking', 'in_progress'];
      if (inProgressStatuses.includes(orderStatus.toLowerCase())) {
        return {
          valid: true,
          reason: 'Order is in progress — cancellation may be too late, confirm with restaurant',
          orderStatus,
          suggestedAction: 'confirm_cancellation_with_restaurant',
        };
      }
      return {
        valid: true,
        reason: 'Order can be cancelled',
        orderStatus,
        suggestedAction: 'process_cancellation',
      };
    }

    case 'reschedule': {
      if (!parsed.extractedData.time && !parsed.extractedData.date) {
        return {
          valid: false,
          reason: 'No new time/date extracted from message',
          orderStatus,
          suggestedAction: 'ask_for_new_time',
        };
      }
      return {
        valid: true,
        reason: 'Reschedule request with time data',
        orderStatus,
        suggestedAction: 'process_reschedule',
      };
    }

    case 'allergy': {
      return {
        valid: true,
        reason: 'CRITICAL: Allergy information — must escalate immediately',
        orderStatus,
        suggestedAction: 'critical_escalate_allergy',
      };
    }

    case 'confirm': {
      return {
        valid: true,
        reason: 'Customer confirmed order',
        orderStatus,
        suggestedAction: 'process_confirmation',
      };
    }

    case 'question': {
      return {
        valid: true,
        reason: 'Customer has a question about the order',
        orderStatus,
        suggestedAction: 'answer_question',
      };
    }

    case 'delivery':
    case 'pickup': {
      return {
        valid: true,
        reason: 'Customer selected delivery/pickup method',
        orderStatus,
        suggestedAction: 'process_delivery_method',
      };
    }

    case 'order': {
      return {
        valid: true,
        reason: 'Customer is ordering food items',
        orderStatus,
        suggestedAction: 'process_order_items',
      };
    }

    default: {
      return {
        valid: true,
        reason: 'Unknown intent — needs clarification',
        orderStatus,
        suggestedAction: 'send_clarification_sms',
      };
    }
  }
}

/**
 * MCP tool definitions for the SMS Parser
 */
export const smsParserTools = [
  {
    name: 'parse_sms_reply',
    description: 'Parse an incoming SMS reply from a customer. Detects intent (confirm, cancel, reschedule, question, allergy, unknown), confidence score, language (Danish/English), and extracts relevant data like times and dates.',
    input_schema: {
      type: 'object' as const,
      properties: {
        message: {
          type: 'string',
          description: 'The SMS message text to parse',
        },
      },
      required: ['message'],
    },
  },
  {
    name: 'validate_against_order',
    description: 'Validate a parsed SMS reply against the current order status. Checks if the intended action is possible given the order state.',
    input_schema: {
      type: 'object' as const,
      properties: {
        message: {
          type: 'string',
          description: 'The SMS message text',
        },
        order_status: {
          type: 'string',
          description: 'Current order status (e.g., pending, confirmed, preparing, completed, cancelled)',
        },
      },
      required: ['message', 'order_status'],
    },
  },
];

/**
 * Handle MCP tool calls for the SMS Parser
 */
export function handleSmsParserTool(
  toolName: string,
  input: Record<string, unknown>
): string {
  switch (toolName) {
    case 'parse_sms_reply': {
      const message = input.message as string;
      if (!message) return JSON.stringify({ error: 'message is required' });
      const result = parseSmsReply(message);
      return JSON.stringify(result, null, 2);
    }

    case 'validate_against_order': {
      const message = input.message as string;
      const orderStatus = input.order_status as string;
      if (!message || !orderStatus) {
        return JSON.stringify({ error: 'message and order_status are required' });
      }
      const parsed = parseSmsReply(message);
      const validation = validateAgainstOrder(parsed, orderStatus);
      return JSON.stringify({ parsed, validation }, null, 2);
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}
