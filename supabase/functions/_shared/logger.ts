/**
 * OrderFlow Edge Function Logger
 * ===============================
 * Structured logging for Supabase Edge Functions (Deno)
 *
 * Usage:
 * ```typescript
 * import { createLogger, channelLogger } from '../_shared/logger.ts'
 *
 * const log = createLogger({ module: 'my-function', traceId: req.headers.get('x-trace-id') })
 * log.info({ event: 'channel.sms.received', from: '+45...' })
 * ```
 */

// ============================================================
// TYPES
// ============================================================

export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface LogContext {
  module?: string;
  traceId?: string;
  restaurantId?: string;
  userId?: string;
  channel?: string;
  orderId?: string;
  customerId?: string;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  service: string;
  version: string;
  module?: string;
  trace_id?: string;
  restaurant_id?: string;
  user_id?: string;
  channel?: string;
  order_id?: string;
  customer_id?: string;
  data?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

interface LogData extends Record<string, unknown> {
  event?: string;
  message?: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  FATAL: 5,
};

const SERVICE_NAME = 'orderflow-edge';
const VERSION = 'v137';

// PII fields to redact
const PII_FIELD_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /credential/i,
  /authorization/i,
];

const PHONE_FIELD_PATTERNS = [/phone/i, /mobile/i, /tel/i, /msisdn/i];
const EMAIL_FIELD_PATTERNS = [/email/i, /mail/i];

// ============================================================
// LOGGER CLASS
// ============================================================

export class EdgeLogger {
  private context: LogContext;
  private minLevel: LogLevel;
  private redactPII: boolean;

  constructor(
    context: LogContext = {},
    options: { level?: LogLevel; redactPII?: boolean } = {}
  ) {
    this.context = context;
    this.minLevel = options.level ?? 'INFO';
    this.redactPII = options.redactPII !== false;
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): EdgeLogger {
    return new EdgeLogger(
      { ...this.context, ...additionalContext },
      { level: this.minLevel, redactPII: this.redactPII }
    );
  }

  /**
   * Generate a new trace ID
   */
  static generateTraceId(): string {
    return crypto.randomUUID();
  }

  // Log level methods
  trace(data: LogData | string): LogEntry | null {
    return this.log('TRACE', data);
  }
  debug(data: LogData | string): LogEntry | null {
    return this.log('DEBUG', data);
  }
  info(data: LogData | string): LogEntry | null {
    return this.log('INFO', data);
  }
  warn(data: LogData | string): LogEntry | null {
    return this.log('WARN', data);
  }
  error(data: LogData | string): LogEntry | null {
    return this.log('ERROR', data);
  }
  fatal(data: LogData | string): LogEntry | null {
    return this.log('FATAL', data);
  }

  // ============================================================
  // PRIVATE METHODS
  // ============================================================

  private log(level: LogLevel, data: LogData | string): LogEntry | null {
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.minLevel]) {
      return null;
    }

    // Handle string messages
    const logData: LogData = typeof data === 'string' ? { message: data } : data;

    // Build structured log entry
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      event: logData.event ?? 'log.message',
      service: SERVICE_NAME,
      version: VERSION,
      ...(this.context.module && { module: this.context.module }),
      ...(this.context.traceId && { trace_id: this.context.traceId }),
      ...(this.context.restaurantId && { restaurant_id: this.context.restaurantId }),
      ...(this.context.userId && { user_id: this.context.userId }),
      ...(this.context.channel && { channel: this.context.channel }),
      ...(this.context.orderId && { order_id: this.context.orderId }),
      ...(this.context.customerId && { customer_id: this.context.customerId }),
      // Override with data-level context if provided
      ...(logData.trace_id && { trace_id: logData.trace_id as string }),
      ...(logData.restaurant_id && { restaurant_id: logData.restaurant_id as string }),
      ...(logData.channel && { channel: logData.channel as string }),
      data: this.buildData(logData),
      meta: this.buildMeta(),
    };

    // Redact PII if enabled
    if (this.redactPII && entry.data) {
      entry.data = this.redactData(entry.data);
    }

    // Output JSON to console
    const output = JSON.stringify(entry);
    switch (level) {
      case 'FATAL':
      case 'ERROR':
        console.error(output);
        break;
      case 'WARN':
        console.warn(output);
        break;
      default:
        console.log(output);
    }

    return entry;
  }

  private buildData(data: LogData): Record<string, unknown> | undefined {
    const payload = { ...data };

    // Remove top-level fields
    const topLevelFields = [
      'event',
      'trace_id',
      'restaurant_id',
      'user_id',
      'order_id',
      'customer_id',
      'channel',
    ];
    for (const field of topLevelFields) {
      delete payload[field];
    }

    return Object.keys(payload).length > 0 ? payload : undefined;
  }

  private buildMeta(): Record<string, unknown> {
    return {
      environment: Deno.env.get('ENVIRONMENT') ?? 'production',
      region: Deno.env.get('DENO_REGION') ?? 'unknown',
      runtime: 'deno',
    };
  }

  private redactData(data: Record<string, unknown>): Record<string, unknown> {
    const redact = (obj: unknown): unknown => {
      if (typeof obj === 'string') {
        // Redact phone numbers
        let result = obj.replace(/(\+\d{2})(\d{4})(\d{4})/g, '$1XXXX$3');
        // Redact emails
        result = result.replace(/[\w.-]+@[\w.-]+\.\w+/gi, '[EMAIL]');
        // Redact card numbers
        result = result.replace(/\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}/g, '[CARD]');
        return result;
      }

      if (Array.isArray(obj)) {
        return obj.map((item) => redact(item));
      }

      if (obj && typeof obj === 'object') {
        const redacted: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
          // Fully redact sensitive fields
          if (PII_FIELD_PATTERNS.some((p) => p.test(key))) {
            redacted[key] = '[REDACTED]';
          } else if (
            PHONE_FIELD_PATTERNS.some((p) => p.test(key)) &&
            typeof value === 'string'
          ) {
            // Partially redact phone numbers
            redacted[key] = value.replace(/\d(?=\d{4})/g, 'X');
          } else if (
            EMAIL_FIELD_PATTERNS.some((p) => p.test(key)) &&
            typeof value === 'string'
          ) {
            redacted[key] = '[EMAIL]';
          } else {
            redacted[key] = redact(value);
          }
        }
        return redacted;
      }

      return obj;
    };

    return redact(data) as Record<string, unknown>;
  }
}

// ============================================================
// FACTORY FUNCTIONS
// ============================================================

/**
 * Create a logger with context
 */
export function createLogger(context: LogContext = {}): EdgeLogger {
  return new EdgeLogger(context);
}

/**
 * Create a logger from a request (extracts trace ID, etc.)
 */
export function createRequestLogger(req: Request, context: LogContext = {}): EdgeLogger {
  const traceId = req.headers.get('x-trace-id') ?? EdgeLogger.generateTraceId();
  const restaurantId = req.headers.get('x-restaurant-id') ?? undefined;

  return new EdgeLogger({
    traceId,
    restaurantId,
    ...context,
  });
}

// ============================================================
// PRE-CONFIGURED LOGGERS
// ============================================================

export const channelLogger = createLogger({ module: 'channels' });
export const orderLogger = createLogger({ module: 'order-pipeline' });
export const aiLogger = createLogger({ module: 'ai-processing' });
export const authLogger = createLogger({ module: 'auth-security' });
export const systemLogger = createLogger({ module: 'system-health' });

// ============================================================
// UTILITY: Create audit log entry (for Supabase insert)
// ============================================================

export interface AuditEntry {
  actor_id?: string;
  actor_type: 'user' | 'system' | 'api' | 'webhook';
  actor_ip?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  restaurant_id?: string;
  details?: Record<string, unknown>;
  data_categories?: string[];
  legal_basis?: string;
}

export function createAuditEntry(entry: AuditEntry): Record<string, unknown> {
  return {
    timestamp: new Date().toISOString(),
    ...entry,
    created_at: new Date().toISOString(),
  };
}
