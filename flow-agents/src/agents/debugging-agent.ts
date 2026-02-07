import { query } from '@anthropic-ai/claude-code';
import type { HookCallback, PreToolUseHookInput } from '@anthropic-ai/claude-code';
import { config, ENDPOINTS } from '../config.js';
import { runFullDiagnostics, formatDiagnosticsReport, type DiagnosticsReport } from '../tools/api-monitor.js';
import { createAuditLogger, type AuditLogger } from '../hooks/audit-logger.js';
import { createErrorNotifier, type ErrorNotifier } from '../hooks/error-notifier.js';

// ============================================================
// Debugging Agent — Endpoint monitoring + auto-fix
// ============================================================

const SYSTEM_PROMPT = `Du er FLOW Debugging Agent — en automatisk overvågnings- og vedligeholdelsesagent for OrderFlow-platformen.

## Din rolle
Du overvåger OrderFlow's kritiske endpoints, identificerer fejl, og enten fixer dem selv eller eskalerer med en konkret diagnose.

## Kritiske endpoints du overvåger
${ENDPOINTS.map(e => `- ${e.name}: ${e.url} ${e.critical ? '(KRITISK)' : '(ikke-kritisk)'}`).join('\n')}

## Thresholds
- Response time > ${config.responseTimeWarning}ms → DEGRADED
- Response time > ${config.responseTimeError}ms eller timeout → DOWN
- HTTP 5xx → DOWN
- HTTP 4xx → DEGRADED

## Arbejdsgang per cyklus
1. Kør run_full_diagnostics for at checke alle endpoints
2. Analyser resultater:
   - HEALTHY: Log og fortsæt
   - DEGRADED: Undersøg årsag, log advarsel
   - DOWN: Forsøg auto-fix, eskalér hvis fejlen fortsætter
3. Tjek Supabase database-forbindelse
4. Rapportér status

## Auto-fix handlinger du kan udføre
- Retry failed requests (op til 3 gange med backoff)
- Ryd cached data der blokerer
- Genstart Edge Functions via Supabase CLI

## Eskalering
- Ukendte fejl → Slack notifikation med fuld diagnose
- Gentagne fejl (3+ i træk) → Email + Slack
- Betalingsfejl → Altid eskalér
- Data-inkonsistens → Altid eskalér

## Output format
Giv ALTID et struktureret JSON-svar med:
{
  "timestamp": "ISO 8601",
  "overallStatus": "healthy|degraded|down",
  "endpoints": [...],
  "autoFixes": ["beskrivelse af fix"],
  "escalations": ["beskrivelse af eskalering"],
  "nextCheckIn": "5 minutes"
}

Svar på dansk.`;

// ── State ────────────────────────────────────────────────────

let sessionId: string | undefined;
let consecutiveFailures = new Map<string, number>();
let lastReport: DiagnosticsReport | null = null;

// ── Hooks ────────────────────────────────────────────────────

function createPreToolUseHook(auditLogger: AuditLogger): HookCallback {
  return async (input, toolUseId, { signal }) => {
    const preInput = input as PreToolUseHookInput;
    auditLogger.logToolCall(
      preInput.tool_name || 'unknown',
      (preInput.tool_input as Record<string, unknown>) || {}
    );

    // Block dangerous bash commands
    if (preInput.tool_name === 'Bash') {
      const command = (preInput.tool_input as Record<string, string>)?.command || '';
      const dangerous = ['rm -rf', 'drop table', 'delete from', 'truncate'];
      if (dangerous.some(d => command.toLowerCase().includes(d))) {
        return {
          hookSpecificOutput: {
            hookEventName: input.hook_event_name,
            permissionDecision: 'deny' as const,
            permissionDecisionReason: `Blocked dangerous command: ${command.substring(0, 50)}`,
          },
        };
      }
    }

    return {};
  };
}

function createPostToolUseHook(auditLogger: AuditLogger): HookCallback {
  return async (input, toolUseId, { signal }) => {
    auditLogger.logToolResult(
      (input as Record<string, unknown>).tool_name as string || 'unknown',
      JSON.stringify((input as Record<string, unknown>).tool_output || '').substring(0, 500),
      0
    );
    return {};
  };
}

// ── Main agent execution ─────────────────────────────────────

/**
 * Run a single debugging cycle
 */
export async function runDebuggingCycle(): Promise<{
  report: DiagnosticsReport;
  sessionId: string | undefined;
}> {
  const cycleId = `debug-${Date.now()}`;
  const auditLogger = createAuditLogger(cycleId, 'debugging-agent');
  const notifier = createErrorNotifier('debugging-agent');

  auditLogger.logAgentStart({ cycleId, resuming: !!sessionId });

  // 1. Run diagnostics first
  const report = await runFullDiagnostics();
  const formattedReport = formatDiagnosticsReport(report);

  // 2. Track consecutive failures
  for (const endpoint of report.endpoints) {
    const key = endpoint.name;
    if (endpoint.status === 'down') {
      const count = (consecutiveFailures.get(key) || 0) + 1;
      consecutiveFailures.set(key, count);

      // Notify on first failure or repeated failures
      if (count === 1 || count === 3 || count % 5 === 0) {
        await notifier.notifyEndpointIssue(
          endpoint.name,
          endpoint.status,
          `${endpoint.error || 'Unknown error'} (failure #${count})`,
          endpoint.critical
        );
      }
    } else {
      // Reset failure counter on success
      if (consecutiveFailures.has(key)) {
        const previousFailures = consecutiveFailures.get(key) || 0;
        if (previousFailures > 0) {
          console.log(`[DebuggingAgent] ${key} recovered after ${previousFailures} failures`);
        }
        consecutiveFailures.delete(key);
      }
    }
  }

  // 3. Send report to Claude for analysis and potential auto-fix
  const prompt = sessionId
    ? `Ny diagnostik-cyklus. Her er den seneste rapport:\n\n${formattedReport}\n\nTidligere status: ${lastReport?.overallStatus || 'unknown'}\n\nAnalyser ændringer siden sidst og foreslå handlinger.`
    : `Første diagnostik-cyklus. Her er rapporten:\n\n${formattedReport}\n\nAnalyser status og giv din vurdering.`;

  try {
    for await (const message of query({
      prompt,
      options: {
        systemPrompt: SYSTEM_PROMPT,
        allowedTools: ['Read', 'Bash', 'Grep', 'Glob'],
        maxTurns: 5,
        model: 'sonnet',
        ...(sessionId ? { resume: sessionId } : {}),
        hooks: {
          PreToolUse: [
            { matcher: 'Bash', hooks: [createPreToolUseHook(auditLogger)] },
          ],
          PostToolUse: [
            { hooks: [createPostToolUseHook(auditLogger)] },
          ],
        },
      },
    })) {
      // Capture session ID for resumption
      if (message.type === 'system' && message.subtype === 'init') {
        sessionId = message.session_id;
      }

      // Log results
      if ('result' in message) {
        console.log('[DebuggingAgent] Analysis:', (message as { result: string }).result);
      }
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('[DebuggingAgent] Agent error:', error);
    auditLogger.logError(error);
    await notifier.notifyAgentError(error, { cycleId });
  }

  lastReport = report;
  auditLogger.logAgentStop({ overallStatus: report.overallStatus });

  return { report, sessionId };
}

/**
 * Get current agent state
 */
export function getAgentState() {
  return {
    sessionId,
    lastReport,
    consecutiveFailures: Object.fromEntries(consecutiveFailures),
  };
}

/**
 * Reset agent state (for testing)
 */
export function resetAgentState() {
  sessionId = undefined;
  lastReport = null;
  consecutiveFailures.clear();
}

// ── Standalone execution ─────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Starting Debugging Agent (standalone)...');
  runDebuggingCycle()
    .then(({ report }) => {
      console.log(`\nCycle complete: ${report.overallStatus}`);
      process.exit(report.overallStatus === 'down' ? 1 : 0);
    })
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(2);
    });
}
