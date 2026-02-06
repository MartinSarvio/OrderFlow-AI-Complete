/**
 * OrderFlow Structured Logger
 * ===========================
 * Universal logging utility for browser and Edge Functions.
 *
 * Features:
 * - Structured JSON output (Pino-compatible format)
 * - Automatic PII redaction
 * - Trace ID propagation
 * - Context enrichment (restaurant_id, version, etc.)
 * - Log level filtering
 * - Supabase persistence (optional)
 *
 * @version 1.0.0
 * @author OrderFlow Team
 */

(function(root) {
    'use strict';

    // ============================================================
    // CONFIGURATION
    // ============================================================

    const LOG_LEVELS = {
        TRACE: 0,
        DEBUG: 1,
        INFO: 2,
        WARN: 3,
        ERROR: 4,
        FATAL: 5
    };

    const LEVEL_COLORS = {
        TRACE: '#64748B',
        DEBUG: '#7C3AED',
        INFO: '#2563EB',
        WARN: '#CA8A04',
        ERROR: '#EA580C',
        FATAL: '#DC2626'
    };

    // PII patterns to redact
    const PII_PATTERNS = [
        { pattern: /(\+45\d{8})/g, replacement: '+45XXXX$1'.slice(-4) },
        { pattern: /(\+\d{10,15})/g, replacement: (m) => m.slice(0, 4) + 'XXXX' + m.slice(-4) },
        { pattern: /\b[\w.-]+@[\w.-]+\.\w+\b/gi, replacement: '[EMAIL]' },
        { pattern: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, replacement: '[CARD]' },
        { pattern: /\b\d{3}-?\d{2}-?\d{4}\b/g, replacement: '[SSN]' }
    ];

    // ============================================================
    // LOGGER CLASS
    // ============================================================

    class OrderFlowLogger {
        constructor(options = {}) {
            this.service = options.service || 'orderflow-api';
            this.version = options.version || (typeof window !== 'undefined' && window.APP_VERSION) || 'unknown';
            this.environment = options.environment || this._detectEnvironment();
            this.minLevel = LOG_LEVELS[options.level?.toUpperCase()] ?? LOG_LEVELS.INFO;
            this.redactPII = options.redactPII !== false;
            this.persistToSupabase = options.persistToSupabase || false;
            this.supabaseClient = options.supabaseClient || null;

            // Base context attached to all logs
            this.baseContext = {
                service: this.service,
                version: this.version,
                environment: this.environment,
                ...options.baseContext
            };

            // Module name for child loggers
            this.module = options.module || null;
        }

        // ============================================================
        // PUBLIC API
        // ============================================================

        /**
         * Create a child logger with additional context
         * @param {Object} context - Additional context to merge
         * @returns {OrderFlowLogger} Child logger instance
         */
        child(context) {
            const childLogger = new OrderFlowLogger({
                service: this.service,
                version: this.version,
                environment: this.environment,
                level: Object.keys(LOG_LEVELS).find(k => LOG_LEVELS[k] === this.minLevel),
                redactPII: this.redactPII,
                persistToSupabase: this.persistToSupabase,
                supabaseClient: this.supabaseClient,
                baseContext: { ...this.baseContext, ...context },
                module: context.module || this.module
            });
            return childLogger;
        }

        /**
         * Generate a new trace ID
         * @returns {string} UUID v4
         */
        static generateTraceId() {
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                return crypto.randomUUID();
            }
            // Fallback for older environments
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        // Log level methods
        trace(data) { this._log('TRACE', data); }
        debug(data) { this._log('DEBUG', data); }
        info(data) { this._log('INFO', data); }
        warn(data) { this._log('WARN', data); }
        error(data) { this._log('ERROR', data); }
        fatal(data) { this._log('FATAL', data); }

        // ============================================================
        // INTERNAL METHODS
        // ============================================================

        /**
         * Core logging method
         * @private
         */
        _log(level, data) {
            if (LOG_LEVELS[level] < this.minLevel) return;

            // Handle string messages
            if (typeof data === 'string') {
                data = { message: data };
            }

            // Build structured log entry
            const entry = {
                timestamp: new Date().toISOString(),
                level: level,
                event: data.event || 'log.message',
                ...this.baseContext,
                ...(this.module && { module: this.module }),
                ...this._extractContext(data),
                data: this._buildData(data),
                meta: this._buildMeta()
            };

            // Redact PII if enabled
            if (this.redactPII) {
                this._redactPII(entry);
            }

            // Output to console
            this._consoleOutput(level, entry);

            // Persist to Supabase if enabled
            if (this.persistToSupabase && LOG_LEVELS[level] >= LOG_LEVELS.INFO) {
                this._persistLog(entry);
            }

            return entry;
        }

        /**
         * Extract standard context fields from data
         * @private
         */
        _extractContext(data) {
            const context = {};
            const contextFields = ['trace_id', 'restaurant_id', 'user_id', 'order_id', 'customer_id', 'channel'];

            for (const field of contextFields) {
                if (data[field] !== undefined) {
                    context[field] = data[field];
                }
            }

            return context;
        }

        /**
         * Build the data payload (event-specific fields)
         * @private
         */
        _buildData(data) {
            const payload = { ...data };

            // Remove fields that are in the top level
            const topLevelFields = ['event', 'trace_id', 'restaurant_id', 'user_id', 'order_id', 'customer_id', 'channel', 'message'];
            for (const field of topLevelFields) {
                delete payload[field];
            }

            // Include message in data if present
            if (data.message) {
                payload.message = data.message;
            }

            return Object.keys(payload).length > 0 ? payload : undefined;
        }

        /**
         * Build metadata
         * @private
         */
        _buildMeta() {
            const meta = {
                environment: this.environment
            };

            // Add browser info if in browser
            if (typeof window !== 'undefined') {
                meta.userAgent = navigator.userAgent?.slice(0, 100);
                meta.url = window.location?.href;
            }

            // Add Deno info if in Deno
            if (typeof Deno !== 'undefined') {
                meta.runtime = 'deno';
                meta.region = Deno.env?.get?.('DENO_REGION') || 'unknown';
            }

            return meta;
        }

        /**
         * Redact PII from log entry
         * @private
         */
        _redactPII(entry) {
            const redact = (obj) => {
                if (typeof obj === 'string') {
                    let result = obj;
                    for (const { pattern, replacement } of PII_PATTERNS) {
                        result = result.replace(pattern, typeof replacement === 'function' ? replacement : replacement);
                    }
                    return result;
                }

                if (Array.isArray(obj)) {
                    return obj.map(item => redact(item));
                }

                if (obj && typeof obj === 'object') {
                    const redacted = {};
                    for (const [key, value] of Object.entries(obj)) {
                        // Fully redact sensitive field names
                        if (/password|token|secret|key|credential|auth/i.test(key)) {
                            redacted[key] = '[REDACTED]';
                        } else if (/phone|mobile|tel/i.test(key) && typeof value === 'string') {
                            redacted[key] = value.replace(/\d(?=\d{4})/g, 'X');
                        } else if (/email/i.test(key) && typeof value === 'string') {
                            redacted[key] = '[EMAIL]';
                        } else {
                            redacted[key] = redact(value);
                        }
                    }
                    return redacted;
                }

                return obj;
            };

            if (entry.data) {
                entry.data = redact(entry.data);
            }
        }

        /**
         * Output to console with formatting
         * @private
         */
        _consoleOutput(level, entry) {
            const color = LEVEL_COLORS[level];
            const timestamp = entry.timestamp.slice(11, 23); // HH:MM:SS.mmm

            // Pretty print in development
            if (this.environment === 'development' && typeof window !== 'undefined') {
                const prefix = `%c${timestamp} %c${level.padEnd(5)} %c${entry.event}`;
                const styles = [
                    'color: #64748B',
                    `color: ${color}; font-weight: bold`,
                    'color: #E2E8F0'
                ];

                const contextParts = [];
                if (entry.trace_id) contextParts.push(`trace=${entry.trace_id.slice(0, 8)}`);
                if (entry.restaurant_id) contextParts.push(`rest=${entry.restaurant_id}`);
                if (entry.channel) contextParts.push(`ch=${entry.channel}`);

                if (contextParts.length > 0) {
                    console.groupCollapsed(prefix + ` [${contextParts.join(' ')}]`, ...styles);
                } else {
                    console.groupCollapsed(prefix, ...styles);
                }

                if (entry.data) {
                    console.log('Data:', entry.data);
                }
                console.log('Full entry:', entry);
                console.groupEnd();
            } else {
                // JSON output for production/Edge Functions
                const output = JSON.stringify(entry);

                switch (level) {
                    case 'FATAL':
                    case 'ERROR':
                        console.error(output);
                        break;
                    case 'WARN':
                        console.warn(output);
                        break;
                    case 'DEBUG':
                    case 'TRACE':
                        console.debug?.(output) || console.log(output);
                        break;
                    default:
                        console.log(output);
                }
            }
        }

        /**
         * Persist log to Supabase
         * @private
         */
        async _persistLog(entry) {
            try {
                const client = this.supabaseClient || (typeof window !== 'undefined' && window.supabase);
                if (!client) return;

                await client.from('application_logs').insert({
                    timestamp: entry.timestamp,
                    level: entry.level,
                    event: entry.event,
                    service: entry.service,
                    version: entry.version,
                    trace_id: entry.trace_id,
                    restaurant_id: entry.restaurant_id,
                    user_id: entry.user_id,
                    channel: entry.channel,
                    order_id: entry.order_id,
                    customer_id: entry.customer_id,
                    data: entry.data || {},
                    meta: entry.meta || {}
                });
            } catch (err) {
                // Silent fail - don't disrupt app for logging failures
                if (this.environment === 'development') {
                    console.warn('Logger: Failed to persist log to Supabase', err);
                }
            }
        }

        /**
         * Detect current environment
         * @private
         */
        _detectEnvironment() {
            if (typeof Deno !== 'undefined') {
                return Deno.env?.get?.('ENVIRONMENT') || 'production';
            }
            if (typeof window !== 'undefined') {
                const host = window.location?.hostname || '';
                if (host === 'localhost' || host === '127.0.0.1') return 'development';
                if (host.includes('staging') || host.includes('test')) return 'staging';
            }
            return 'production';
        }
    }

    // ============================================================
    // CREATE DEFAULT LOGGERS
    // ============================================================

    const logger = new OrderFlowLogger({
        service: 'orderflow-api',
        level: 'INFO',
        redactPII: true,
        persistToSupabase: false // Enable manually when Supabase is ready
    });

    // Module-specific child loggers
    const orderLogger = logger.child({ module: 'order-pipeline' });
    const channelLogger = logger.child({ module: 'channels' });
    const aiLogger = logger.child({ module: 'ai-processing' });
    const authLogger = logger.child({ module: 'auth-security' });
    const systemLogger = logger.child({ module: 'system-health' });

    // ============================================================
    // EXPORTS
    // ============================================================

    const exports = {
        OrderFlowLogger,
        logger,
        orderLogger,
        channelLogger,
        aiLogger,
        authLogger,
        systemLogger,
        generateTraceId: OrderFlowLogger.generateTraceId,
        LOG_LEVELS
    };

    // Support multiple module systems
    if (typeof module !== 'undefined' && module.exports) {
        // Node.js / CommonJS
        module.exports = exports;
    }

    if (typeof window !== 'undefined') {
        // Browser global
        window.OrderFlowLogger = exports;

        // Convenience aliases
        window.flowLogger = logger;
        window.orderLogger = orderLogger;
        window.channelLogger = channelLogger;
        window.aiLogger = aiLogger;
        window.authLogger = authLogger;
        window.systemLogger = systemLogger;
    }

    // ES Module export (for bundlers)
    if (typeof root !== 'undefined') {
        root.OrderFlowLogger = exports;
    }

})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this);
