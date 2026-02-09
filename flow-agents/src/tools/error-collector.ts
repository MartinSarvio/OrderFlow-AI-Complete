import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';

// ============================================================
// Error Collector — Gathers errors from all sources for
//                    the Agent Programmer to analyze and fix
// ============================================================

let supabase: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!supabase) {
    if (!config.supabaseUrl || !config.supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
    }
    supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }
  return supabase;
}

// ── Types ────────────────────────────────────────────────────

export interface ErrorPattern {
  id: string;
  source: 'audit_log' | 'supabase' | 'runtime' | 'build';
  errorType: 'parse_error' | 'api_failure' | 'intent_miss' | 'type_error' | 'timeout' | 'unknown_error';
  message: string;
  stackTrace?: string;
  frequency: number;
  firstSeen: string;
  lastSeen: string;
  affectedFile?: string;
  affectedFunction?: string;
  relatedDecisions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ErrorTrends {
  increasing: ErrorPattern[];
  decreasing: ErrorPattern[];
  new: ErrorPattern[];
}

// ── Audit Log Parsing ────────────────────────────────────────

const AUDIT_LOG_DIR = join(process.cwd(), 'logs', 'audit');

interface AuditEntry {
  timestamp: string;
  sessionId: string;
  agentName: string;
  event: string;
  toolName?: string;
  input?: Record<string, unknown>;
  output?: string;
  durationMs?: number;
  severity?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Read and parse JSONL audit log files from the last N hours
 */
function readAuditErrors(windowHours: number): AuditEntry[] {
  const errors: AuditEntry[] = [];

  if (!existsSync(AUDIT_LOG_DIR)) {
    return errors;
  }

  const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000);
  const cutoffDate = cutoff.toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    const files = readdirSync(AUDIT_LOG_DIR)
      .filter(f => f.endsWith('.jsonl'))
      .filter(f => {
        // File format: YYYY-MM-DD_sessionid.jsonl
        const fileDate = f.substring(0, 10);
        return fileDate >= cutoffDate;
      })
      .sort()
      .reverse();

    for (const file of files) {
      try {
        const content = readFileSync(join(AUDIT_LOG_DIR, file), 'utf-8');
        const lines = content.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const entry = JSON.parse(line) as AuditEntry;
            if (entry.event === 'error' || entry.event === 'escalation') {
              if (new Date(entry.timestamp) >= cutoff) {
                errors.push(entry);
              }
            }
          } catch {
            // Skip malformed lines
          }
        }
      } catch {
        // Skip unreadable files
      }
    }
  } catch {
    // Directory read failed
  }

  return errors;
}

/**
 * Extract file/function from error message or stack trace
 */
function extractLocation(message: string, stack?: string): { file?: string; func?: string } {
  // Try stack trace first
  if (stack) {
    const match = stack.match(/at\s+(\w+)\s+\(.*?\/src\/([\w/.-]+\.ts):\d+/);
    if (match) {
      return { func: match[1], file: `src/${match[2]}` };
    }
  }

  // Try common patterns in message
  const fileMatch = message.match(/(?:in|at|from)\s+['"]*(?:.*?\/)?src\/([\w/.-]+\.ts)['"]*(?:\s+(?:line|:)\s*\d+)?/i);
  if (fileMatch) {
    return { file: `src/${fileMatch[1]}` };
  }

  // Check for function name in brackets
  const funcMatch = message.match(/\[(\w+Agent|WorkflowAgent|DebuggingAgent|SmsParser)\]/i);
  if (funcMatch) {
    const funcName = funcMatch[1];
    const fileMap: Record<string, string> = {
      'WorkflowAgent': 'src/agents/workflow-agent.ts',
      'DebuggingAgent': 'src/agents/debugging-agent.ts',
      'SmsParser': 'src/tools/sms-parser.ts',
    };
    return { func: funcName, file: fileMap[funcName] };
  }

  return {};
}

/**
 * Classify error type from message
 */
function classifyError(message: string): ErrorPattern['errorType'] {
  const lower = message.toLowerCase();

  if (lower.includes('typeerror') || lower.includes('cannot read prop') || lower.includes('is not a function')) {
    return 'type_error';
  }
  if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('econnrefused')) {
    return 'timeout';
  }
  if (lower.includes('parse') || lower.includes('json') || lower.includes('syntax')) {
    return 'parse_error';
  }
  if (lower.includes('api') || lower.includes('fetch') || lower.includes('openai') || lower.includes('supabase')) {
    return 'api_failure';
  }
  if (lower.includes('unknown intent') || lower.includes('no_pattern_match') || lower.includes('confidence')) {
    return 'intent_miss';
  }

  return 'unknown_error';
}

/**
 * Determine severity from error characteristics
 */
function determineSeverity(errorType: ErrorPattern['errorType'], frequency: number, source: string): ErrorPattern['severity'] {
  if (errorType === 'type_error' && frequency >= 5) return 'critical';
  if (errorType === 'api_failure' && source === 'runtime') return 'high';
  if (errorType === 'timeout' && frequency >= 3) return 'high';
  if (frequency >= 10) return 'high';
  if (frequency >= 5) return 'medium';
  return 'low';
}

/**
 * Generate a stable ID for grouping similar errors
 */
function generateErrorId(message: string, file?: string): string {
  // Normalize: remove numbers, IDs, timestamps
  const normalized = message
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, 'UUID')
    .replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z?/g, 'TIMESTAMP')
    .replace(/\d+/g, 'N')
    .substring(0, 100);

  const key = `${file || 'unknown'}:${normalized}`;
  // Simple hash
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash |= 0;
  }
  return `err-${Math.abs(hash).toString(36)}`;
}

// ── Main Collection Function ─────────────────────────────────

/**
 * Collect errors from all sources within the specified time window
 */
export async function collectErrors(windowHours: number = 12): Promise<ErrorPattern[]> {
  const patternMap = new Map<string, ErrorPattern>();

  // 1. Collect from JSONL audit logs
  const auditErrors = readAuditErrors(windowHours);
  for (const entry of auditErrors) {
    const { file, func } = extractLocation(entry.output || '', undefined);
    const errorType = classifyError(entry.output || '');
    const id = generateErrorId(entry.output || '', file);

    const existing = patternMap.get(id);
    if (existing) {
      existing.frequency++;
      if (entry.timestamp > existing.lastSeen) existing.lastSeen = entry.timestamp;
      if (entry.timestamp < existing.firstSeen) existing.firstSeen = entry.timestamp;
    } else {
      patternMap.set(id, {
        id,
        source: 'audit_log',
        errorType,
        message: (entry.output || '').substring(0, 500),
        frequency: 1,
        firstSeen: entry.timestamp,
        lastSeen: entry.timestamp,
        affectedFile: file,
        affectedFunction: func,
        relatedDecisions: [],
        severity: 'low', // Updated after all errors collected
      });
    }
  }

  // 2. Collect from Supabase system_logs
  try {
    const client = getClient();
    const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

    const { data: logs, error } = await client
      .from('system_logs')
      .select('*')
      .in('severity', ['error', 'critical'])
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(200);

    if (!error && logs) {
      for (const log of logs) {
        const message = String(log.message || log.details || '');
        const { file, func } = extractLocation(message, log.stack_trace as string | undefined);
        const errorType = classifyError(message);
        const id = generateErrorId(message, file);

        const existing = patternMap.get(id);
        if (existing) {
          existing.frequency++;
          const ts = String(log.created_at || '');
          if (ts > existing.lastSeen) existing.lastSeen = ts;
          if (ts < existing.firstSeen) existing.firstSeen = ts;
        } else {
          patternMap.set(id, {
            id,
            source: 'supabase',
            errorType,
            message: message.substring(0, 500),
            stackTrace: (log.stack_trace as string) || undefined,
            frequency: 1,
            firstSeen: String(log.created_at || new Date().toISOString()),
            lastSeen: String(log.created_at || new Date().toISOString()),
            affectedFile: file,
            affectedFunction: func,
            relatedDecisions: [],
            severity: 'low',
          });
        }
      }
    }
  } catch (err) {
    console.error('[ErrorCollector] Supabase system_logs query failed:', err);
  }

  // 3. Collect intent misses from workflow results (ai_conversations with low confidence)
  try {
    const client = getClient();
    const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

    const { data: conversations, error } = await client
      .from('ai_conversations')
      .select('id, intent, confidence, message, created_at')
      .or('intent.eq.unknown,confidence.lt.0.5')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && conversations) {
      // Group by message pattern
      const intentMissMap = new Map<string, { count: number; messages: string[]; firstSeen: string; lastSeen: string }>();

      for (const conv of conversations) {
        const msg = String(conv.message || '').toLowerCase().trim();
        // Simple normalization: first 3 words as pattern key
        const words = msg.split(/\s+/).slice(0, 3).join(' ');
        const key = words || 'empty_message';

        const existing = intentMissMap.get(key);
        if (existing) {
          existing.count++;
          existing.messages.push(msg.substring(0, 100));
          const ts = String(conv.created_at || '');
          if (ts > existing.lastSeen) existing.lastSeen = ts;
          if (ts < existing.firstSeen) existing.firstSeen = ts;
        } else {
          intentMissMap.set(key, {
            count: 1,
            messages: [msg.substring(0, 100)],
            firstSeen: String(conv.created_at || new Date().toISOString()),
            lastSeen: String(conv.created_at || new Date().toISOString()),
          });
        }
      }

      // Only include patterns with 3+ occurrences
      for (const [key, data] of intentMissMap) {
        if (data.count >= 3) {
          const id = generateErrorId(`intent_miss:${key}`, 'src/tools/sms-parser.ts');
          patternMap.set(id, {
            id,
            source: 'supabase',
            errorType: 'intent_miss',
            message: `Unknown intent pattern (${data.count}x): "${key}" — Examples: ${data.messages.slice(0, 3).join(', ')}`,
            frequency: data.count,
            firstSeen: data.firstSeen,
            lastSeen: data.lastSeen,
            affectedFile: 'src/tools/sms-parser.ts',
            affectedFunction: 'parseSmsReply',
            relatedDecisions: [],
            severity: 'low',
          });
        }
      }
    }
  } catch (err) {
    console.error('[ErrorCollector] ai_conversations query failed:', err);
  }

  // 4. Update severity based on frequency
  const patterns = Array.from(patternMap.values());
  for (const pattern of patterns) {
    pattern.severity = determineSeverity(pattern.errorType, pattern.frequency, pattern.source);
  }

  // Sort by severity (critical first) then frequency
  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  patterns.sort((a, b) => {
    const sevDiff = (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3);
    if (sevDiff !== 0) return sevDiff;
    return b.frequency - a.frequency;
  });

  return patterns;
}

// ── Error Trends ─────────────────────────────────────────────

/**
 * Compare current errors vs previous period to detect trends
 */
export async function getErrorTrends(): Promise<ErrorTrends> {
  // Current period: last 12 hours
  const currentErrors = await collectErrors(12);

  // Previous period: 12-24 hours ago
  // We approximate by collecting 24h and filtering out the current 12h
  const allErrors = await collectErrors(24);
  const cutoff12h = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

  const previousMap = new Map<string, ErrorPattern>();
  for (const err of allErrors) {
    if (err.lastSeen < cutoff12h) {
      previousMap.set(err.id, err);
    }
  }

  const currentMap = new Map<string, ErrorPattern>();
  for (const err of currentErrors) {
    currentMap.set(err.id, err);
  }

  const increasing: ErrorPattern[] = [];
  const decreasing: ErrorPattern[] = [];
  const newErrors: ErrorPattern[] = [];

  for (const [id, current] of currentMap) {
    const previous = previousMap.get(id);
    if (!previous) {
      newErrors.push(current);
    } else if (current.frequency > previous.frequency * 1.5) {
      increasing.push(current);
    }
  }

  for (const [id, previous] of previousMap) {
    if (!currentMap.has(id)) {
      decreasing.push(previous);
    }
  }

  return { increasing, decreasing, new: newErrors };
}

// ── Supabase Persistence ─────────────────────────────────────

/**
 * Save or update an error pattern in Supabase
 */
export async function saveErrorPattern(pattern: ErrorPattern): Promise<string | null> {
  try {
    const client = getClient();

    const { data, error } = await client
      .from('agent_error_patterns')
      .upsert({
        id: pattern.id.length <= 36 ? undefined : undefined, // Let DB generate UUID
        source: pattern.source,
        error_type: pattern.errorType,
        message_pattern: pattern.message,
        frequency: pattern.frequency,
        first_seen: pattern.firstSeen,
        last_seen: pattern.lastSeen,
        affected_file: pattern.affectedFile || null,
        affected_function: pattern.affectedFunction || null,
        severity: pattern.severity,
        status: 'open',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select('id')
      .single();

    if (error) {
      // If upsert fails (e.g., table doesn't exist yet), just log
      console.warn('[ErrorCollector] Failed to save pattern:', error.message);
      return null;
    }

    return (data as Record<string, unknown>)?.id as string || null;
  } catch (err) {
    console.warn('[ErrorCollector] saveErrorPattern failed:', err);
    return null;
  }
}

/**
 * Mark an error pattern as resolved
 */
export async function markErrorResolved(
  patternId: string,
  resolution: string,
  resolvedByChangeId?: string,
): Promise<void> {
  try {
    const client = getClient();

    await client
      .from('agent_error_patterns')
      .update({
        status: 'resolved',
        resolution,
        resolved_by_change_id: resolvedByChangeId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', patternId);
  } catch (err) {
    console.warn('[ErrorCollector] markErrorResolved failed:', err);
  }
}

// ── Standalone execution ─────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running Error Collector (standalone test)...\n');

  collectErrors(24)
    .then((patterns) => {
      console.log(`Found ${patterns.length} error patterns:\n`);
      for (const p of patterns) {
        console.log(`  [${p.severity.toUpperCase()}] ${p.errorType} (${p.frequency}x)`);
        console.log(`    ${p.message.substring(0, 100)}`);
        if (p.affectedFile) console.log(`    File: ${p.affectedFile}`);
        console.log('');
      }

      return getErrorTrends();
    })
    .then((trends) => {
      console.log(`\nTrends:`);
      console.log(`  New: ${trends.new.length}`);
      console.log(`  Increasing: ${trends.increasing.length}`);
      console.log(`  Decreasing: ${trends.decreasing.length}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
