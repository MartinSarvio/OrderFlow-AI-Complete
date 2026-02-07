import { writeFileSync, mkdirSync, appendFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

// ============================================================
// Audit Logger Hook — Logs all tool calls to JSONL files
// ============================================================

export interface AuditEntry {
  timestamp: string;
  sessionId: string;
  agentName: string;
  event: 'tool_call' | 'tool_result' | 'agent_start' | 'agent_stop' | 'error' | 'escalation';
  toolName?: string;
  input?: Record<string, unknown>;
  output?: string;
  durationMs?: number;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  metadata?: Record<string, unknown>;
}

const LOG_DIR = join(process.cwd(), 'logs', 'audit');

/**
 * Ensure log directory exists
 */
function ensureLogDir(): void {
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * Get log file path for a session
 */
function getLogPath(sessionId: string): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return join(LOG_DIR, `${date}_${sessionId}.jsonl`);
}

/**
 * Write an audit entry to the session's log file
 */
export function logAudit(entry: AuditEntry): void {
  try {
    ensureLogDir();
    const logPath = getLogPath(entry.sessionId);
    const line = JSON.stringify(entry) + '\n';
    appendFileSync(logPath, line, 'utf-8');
  } catch (err) {
    // Audit logging should never crash the agent
    console.error('[AuditLogger] Failed to write:', err);
  }
}

/**
 * Create an audit logger bound to a specific session and agent
 */
export function createAuditLogger(sessionId: string, agentName: string) {
  return {
    /**
     * Log a tool call (PreToolUse hook)
     */
    logToolCall(toolName: string, input: Record<string, unknown>): void {
      logAudit({
        timestamp: new Date().toISOString(),
        sessionId,
        agentName,
        event: 'tool_call',
        toolName,
        input: sanitizeInput(input),
        severity: 'info',
      });
    },

    /**
     * Log a tool result (PostToolUse hook)
     */
    logToolResult(
      toolName: string,
      output: string,
      durationMs: number,
      metadata?: Record<string, unknown>
    ): void {
      logAudit({
        timestamp: new Date().toISOString(),
        sessionId,
        agentName,
        event: 'tool_result',
        toolName,
        output: truncateOutput(output),
        durationMs,
        severity: 'info',
        metadata,
      });
    },

    /**
     * Log agent start
     */
    logAgentStart(metadata?: Record<string, unknown>): void {
      logAudit({
        timestamp: new Date().toISOString(),
        sessionId,
        agentName,
        event: 'agent_start',
        severity: 'info',
        metadata,
      });
    },

    /**
     * Log agent stop
     */
    logAgentStop(metadata?: Record<string, unknown>): void {
      logAudit({
        timestamp: new Date().toISOString(),
        sessionId,
        agentName,
        event: 'agent_stop',
        severity: 'info',
        metadata,
      });
    },

    /**
     * Log an error
     */
    logError(error: string, toolName?: string, metadata?: Record<string, unknown>): void {
      logAudit({
        timestamp: new Date().toISOString(),
        sessionId,
        agentName,
        event: 'error',
        toolName,
        output: error,
        severity: 'error',
        metadata,
      });
    },

    /**
     * Log a critical escalation
     */
    logEscalation(reason: string, metadata?: Record<string, unknown>): void {
      logAudit({
        timestamp: new Date().toISOString(),
        sessionId,
        agentName,
        event: 'escalation',
        output: reason,
        severity: 'critical',
        metadata,
      });
    },
  };
}

/**
 * Sanitize tool input — redact sensitive values
 */
function sanitizeInput(input: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['api_key', 'apikey', 'password', 'secret', 'token', 'authorization'];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'string' && value.length > 500) {
      sanitized[key] = value.substring(0, 500) + '...[truncated]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Truncate long tool outputs
 */
function truncateOutput(output: string, maxLength: number = 2000): string {
  if (output.length <= maxLength) return output;
  return output.substring(0, maxLength) + `...[truncated, total ${output.length} chars]`;
}

export type AuditLogger = ReturnType<typeof createAuditLogger>;
