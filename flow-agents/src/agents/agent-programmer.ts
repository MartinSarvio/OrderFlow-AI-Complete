import { query } from '@anthropic-ai/claude-code';
import type { HookCallback, PreToolUseHookInput } from '@anthropic-ai/claude-code';
import { config } from '../config.js';
import { collectErrors, getErrorTrends, saveErrorPattern, markErrorResolved, type ErrorPattern } from '../tools/error-collector.js';
import { loadAgentCodebase, buildPromptContext, getCodebaseSummary } from '../tools/code-analyzer.js';
import { createAuditLogger, type AuditLogger } from '../hooks/audit-logger.js';
import { createErrorNotifier, type ErrorNotifier } from '../hooks/error-notifier.js';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// Agent Programmer — Self-improving meta-agent (OpenClaw-style)
// Uses Claude Code SDK to read, analyze, and write code fixes
// ============================================================

const SYSTEM_PROMPT = `Du er FLOW Agent Programmer — en meta-agent der overvåger, debugger og forbedrer de andre agenter i FLOW Agent System.

## Dit arbejdsområde
Du har adgang til kildekoden i flow-agents/src/ og kan:
- Læse alle filer med Read/Grep/Glob
- Skrive forbedringer med Edit tool
- Køre builds med Bash (npm run build)
- Køre tests med Bash (npx tsx src/agents/X.ts eller npx tsx src/tools/X.ts)

## Agenter du overvåger
1. workflow-agent.ts — SMS intent-detektion + ordre-håndtering via OpenAI
2. debugging-agent.ts — Endpoint monitoring via Claude Code SDK
3. sms-parser.ts — Regex-baseret intent parsing (confirm, cancel, reschedule, question, allergy)
4. supabase-query.ts — Database queries (orders, threads, messages, idempotency)
5. api-monitor.ts — Parallel health checks for 6 endpoints
6. config.ts — SMS_PATTERNS, ENDPOINTS, thresholds

## Regler (KRITISKE — MÅ ALDRIG OVERTRÆDES)
1. ALDRIG slet filer eller fjern eksisterende funktionalitet
2. ALDRIG ændr allergy-relateret kode (patterns, escalation, confidence) — det er sikkerhedskritisk
3. ALLE ændringer skal være bagudkompatible — eksisterende exports, interfaces og typer skal bevares
4. Kør ALTID 'npm run build' efter ændringer for at verificere TypeScript kompilering
5. Log ALTID hvad du ændrede og hvorfor
6. Foretag KUN ændringer der fikser observerede fejl eller forbedrer målbare metrics
7. MAKS 3 fil-ændringer per cyklus — undgå store refactorings
8. ALDRIG ændr main.ts direkte — det er entry point og kræver menneskelig review
9. Test altid dine ændringer: kør den relevante standalone fil efter edit

## Typiske forbedringer du kan lave
- Tilføj nye SMS regex-patterns i config.ts når du ser gentagende 'unknown' intents
- Ret type-fejl der forårsager runtime errors (manglende null-checks, forkerte casts)
- Forbedre fejlhåndtering (tilføj try-catch, bedre error messages)
- Optimere Supabase queries der er langsomme (tilføj .limit(), bedre filtrering)
- Opdater system prompts baseret på dårlige AI-svar
- Tilføj manglende null-checks og optional chaining

## Output format
Når du er færdig med din analyse og eventuelle ændringer, svar med JSON:
{
  "analysis": "kort beskrivelse af hvad du fandt",
  "changes": [
    { "file": "relativ sti", "description": "hvad du ændrede", "reason": "hvorfor" }
  ],
  "buildResult": "success|failure|skipped",
  "testsRun": ["liste af test-filer kørt"],
  "nextCycleRecommendation": "hvad du vil kigge på næste gang"
}

Hvis du ikke finder fejl der kræver ændringer, returner changes som tom array og beskriv din analyse.`;

// ── Types ────────────────────────────────────────────────────

export interface CodeChange {
  file: string;
  description: string;
  reason: string;
}

export interface ProgrammerResult {
  action: 'fix' | 'skip' | 'error';
  analysis: string;
  changes: CodeChange[];
  buildResult: 'success' | 'failure' | 'skipped';
  testsRun: string[];
  nextCycleRecommendation: string;
  errorsAnalyzed: number;
  cycleId: string;
  durationMs: number;
}

// ── State ────────────────────────────────────────────────────

let sessionId: string | undefined;
let cycleCount = 0;
let lastResult: ProgrammerResult | null = null;
let totalChanges = 0;

// ── Safety Hooks ─────────────────────────────────────────────

/**
 * Allowed paths for file editing (relative patterns)
 */
const ALLOWED_EDIT_PATHS = [
  'flow-agents/src/agents/',
  'flow-agents/src/tools/',
  'flow-agents/src/hooks/',
  'flow-agents/src/config.ts',
];

/**
 * Files that should NEVER be edited by the agent
 */
const PROTECTED_FILES = [
  'main.ts',           // Entry point — human review required
  'agent-programmer.ts', // Self-modification forbidden
];

/**
 * Allowed bash commands (whitelist approach)
 */
const ALLOWED_BASH_PATTERNS = [
  /^npm run build$/,
  /^npx tsx src\/(agents|tools|hooks)\/[\w-]+\.ts(\s+.*)?$/,
  /^npx tsc --noEmit$/,
  /^ls\s+/,
  /^cat\s+/,
  /^wc\s+-l\s+/,
];

/**
 * Blocked bash patterns (explicit deny list)
 */
const BLOCKED_BASH_PATTERNS = [
  'rm ', 'rm\t', 'rmdir',
  'drop table', 'delete from', 'truncate',
  'git push', 'git reset', 'git checkout', 'git clean',
  'npm publish', 'npm unpublish',
  'curl ', 'wget ', 'fetch(',
  'chmod ', 'chown ', 'sudo ',
  'mv ', 'cp ',
  'kill ', 'pkill ',
];

function createSafetyHook(auditLogger: AuditLogger, changeCount: { value: number }): HookCallback {
  return async (input, toolUseId, { signal }) => {
    const preInput = input as PreToolUseHookInput;
    const toolName = preInput.tool_name || 'unknown';
    const toolInput = (preInput.tool_input || {}) as Record<string, string>;

    // Log every tool call
    auditLogger.logToolCall(toolName, toolInput);

    // ── Bash safety ──────────────────────────────────────
    if (toolName === 'Bash') {
      const command = (toolInput.command || '').trim();

      // Check explicit block list first
      for (const blocked of BLOCKED_BASH_PATTERNS) {
        if (command.toLowerCase().includes(blocked.toLowerCase())) {
          console.log(`[AgentProgrammer] BLOCKED Bash: ${command.substring(0, 60)}`);
          return {
            hookSpecificOutput: {
              hookEventName: 'PreToolUse' as const,
              permissionDecision: 'deny' as const,
              permissionDecisionReason: `Blocked dangerous command: ${command.substring(0, 50)}`,
            },
          };
        }
      }

      // Check against allowlist
      const isAllowed = ALLOWED_BASH_PATTERNS.some(pattern => pattern.test(command));
      if (!isAllowed) {
        console.log(`[AgentProgrammer] DENIED Bash (not in allowlist): ${command.substring(0, 60)}`);
        return {
          hookSpecificOutput: {
            hookEventName: 'PreToolUse' as const,
            permissionDecision: 'deny' as const,
            permissionDecisionReason: `Command not in allowlist: ${command.substring(0, 50)}`,
          },
        };
      }
    }

    // ── Edit safety ──────────────────────────────────────
    if (toolName === 'Edit' || toolName === 'Write') {
      const filePath = toolInput.file_path || '';

      // Check max changes per cycle
      if (changeCount.value >= config.programmerMaxChangesPerCycle) {
        console.log(`[AgentProgrammer] DENIED Edit: max ${config.programmerMaxChangesPerCycle} changes reached`);
        return {
          hookSpecificOutput: {
            hookEventName: 'PreToolUse' as const,
            permissionDecision: 'deny' as const,
            permissionDecisionReason: `Maximum ${config.programmerMaxChangesPerCycle} changes per cycle reached`,
          },
        };
      }

      // Check allowed paths
      const isAllowedPath = ALLOWED_EDIT_PATHS.some(p => filePath.includes(p));
      if (!isAllowedPath) {
        console.log(`[AgentProgrammer] DENIED Edit outside allowed paths: ${filePath}`);
        return {
          hookSpecificOutput: {
            hookEventName: 'PreToolUse' as const,
            permissionDecision: 'deny' as const,
            permissionDecisionReason: `Edit blocked outside allowed paths: ${filePath}`,
          },
        };
      }

      // Check protected files
      for (const protected_file of PROTECTED_FILES) {
        if (filePath.includes(protected_file)) {
          console.log(`[AgentProgrammer] DENIED Edit of protected file: ${protected_file}`);
          return {
            hookSpecificOutput: {
              hookEventName: 'PreToolUse' as const,
              permissionDecision: 'deny' as const,
              permissionDecisionReason: `Protected file cannot be edited: ${protected_file}`,
            },
          };
        }
      }

      // Check allergy-related content in the edit
      const oldString = toolInput.old_string || '';
      const newString = toolInput.new_string || '';
      const editContent = `${oldString}\n${newString}`.toLowerCase();
      if (editContent.includes('allergy') || editContent.includes('allergi')) {
        console.log(`[AgentProgrammer] DENIED Edit of allergy-related code`);
        return {
          hookSpecificOutput: {
            hookEventName: 'PreToolUse' as const,
            permissionDecision: 'deny' as const,
            permissionDecisionReason: `Allergy-related code is protected and requires human review`,
          },
        };
      }

      // Track change count
      changeCount.value++;
    }

    return {}; // Allow
  };
}

function createPostToolUseHook(auditLogger: AuditLogger): HookCallback {
  return async (input, toolUseId, { signal }) => {
    const toolName = (input as Record<string, unknown>).tool_name as string || 'unknown';
    const output = JSON.stringify((input as Record<string, unknown>).tool_output || '');
    auditLogger.logToolResult(toolName, output.substring(0, 500), 0);
    return {};
  };
}

// ── Result Parsing ───────────────────────────────────────────

/**
 * Parse Claude's response into a structured ProgrammerResult
 */
function parseResult(rawResult: string, cycleId: string, startTime: number, errorsAnalyzed: number): ProgrammerResult {
  // Try to extract JSON from the response
  const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        action: (parsed.changes?.length > 0) ? 'fix' : 'skip',
        analysis: parsed.analysis || 'No analysis provided',
        changes: Array.isArray(parsed.changes) ? parsed.changes : [],
        buildResult: parsed.buildResult || 'skipped',
        testsRun: Array.isArray(parsed.testsRun) ? parsed.testsRun : [],
        nextCycleRecommendation: parsed.nextCycleRecommendation || '',
        errorsAnalyzed,
        cycleId,
        durationMs: Math.round(performance.now() - startTime),
      };
    } catch {
      // JSON parse failed
    }
  }

  // Fallback: return raw analysis
  return {
    action: 'skip',
    analysis: rawResult.substring(0, 1000),
    changes: [],
    buildResult: 'skipped',
    testsRun: [],
    nextCycleRecommendation: '',
    errorsAnalyzed,
    cycleId,
    durationMs: Math.round(performance.now() - startTime),
  };
}

// ── Supabase Logging ─────────────────────────────────────────

/**
 * Log a code change to the agent_code_changes table
 */
async function logCodeChange(
  change: CodeChange,
  cycleId: string,
  buildPassed: boolean,
  errorPatternId?: string,
): Promise<void> {
  try {
    const supabase = createClient(config.supabaseUrl, config.supabaseKey);

    await supabase.from('agent_code_changes').insert({
      cycle_id: cycleId,
      file_path: change.file,
      change_type: inferChangeType(change.description),
      description: change.description,
      reason: change.reason,
      build_passed: buildPassed,
      error_pattern_id: errorPatternId || null,
    });
  } catch (err) {
    // Best-effort logging — never crash on log failure
    console.warn('[AgentProgrammer] Failed to log code change:', err);
  }
}

function inferChangeType(description: string): string {
  const lower = description.toLowerCase();
  if (lower.includes('bug') || lower.includes('fix') || lower.includes('null') || lower.includes('error')) return 'bug_fix';
  if (lower.includes('pattern') || lower.includes('regex') || lower.includes('intent')) return 'pattern_add';
  if (lower.includes('new') || lower.includes('tilføj') || lower.includes('add')) return 'new_function';
  return 'edit';
}

// ── Main Cycle ───────────────────────────────────────────────

/**
 * Run a single Agent Programmer cycle
 */
export async function runProgrammerCycle(): Promise<ProgrammerResult> {
  const startTime = performance.now();
  const cycleId = `programmer-${Date.now()}`;
  const auditLogger = createAuditLogger(cycleId, 'agent-programmer');
  const notifier = createErrorNotifier('agent-programmer');
  const changeCount = { value: 0 };

  cycleCount++;
  auditLogger.logAgentStart({ cycleId, cycleNumber: cycleCount, resuming: !!sessionId });

  console.log(`[AgentProgrammer] Starting cycle #${cycleCount}...`);

  // Step 1: Collect errors from all sources
  let errors: ErrorPattern[] = [];
  let trends;
  try {
    errors = await collectErrors(12); // Last 12 hours
    trends = await getErrorTrends();
    console.log(`[AgentProgrammer] Found ${errors.length} error patterns, ${trends.new.length} new`);
  } catch (err) {
    console.error('[AgentProgrammer] Error collection failed:', err);
    auditLogger.logError(err instanceof Error ? err.message : String(err));
  }

  // Step 2: If no errors, skip cycle
  if (errors.length === 0 && (!trends || trends.new.length === 0)) {
    console.log('[AgentProgrammer] No errors found — skipping cycle');
    auditLogger.logAgentStop({ result: 'skipped', reason: 'no_errors' });

    return {
      action: 'skip',
      analysis: 'No errors found in the last 12 hours',
      changes: [],
      buildResult: 'skipped',
      testsRun: [],
      nextCycleRecommendation: 'Continue monitoring',
      errorsAnalyzed: 0,
      cycleId,
      durationMs: Math.round(performance.now() - startTime),
    };
  }

  // Step 3: Load codebase context
  const codebase = loadAgentCodebase();
  const context = buildPromptContext(errors, codebase);

  console.log(`[AgentProgrammer] Codebase: ${codebase.totalFiles} files, ${codebase.totalLines} lines`);
  console.log(`[AgentProgrammer] Context built: ${context.length} chars`);

  // Step 4: Build prompt
  const prompt = sessionId
    ? `Ny Agent Programmer cyklus (#${cycleCount}). Fejl siden sidst:\n\n${context}\n\n` +
      `Forrige cyklus resultat: ${lastResult?.analysis || 'N/A'}\n` +
      `Forrige ændringer: ${lastResult?.changes.map(c => c.description).join(', ') || 'Ingen'}\n\n` +
      `Analyser fejlene og fix de vigtigste problemer. Husk: maks ${config.programmerMaxChangesPerCycle} fil-ændringer.`
    : `Første Agent Programmer cyklus. Her er systemets fejl:\n\n${context}\n\n` +
      `Analyser fejlene og fix de vigtigste problemer. Husk: maks ${config.programmerMaxChangesPerCycle} fil-ændringer.` +
      `\n\nStart med at læse de relevante filer, forstå problemet, lav ændringen, og kør build.`;

  // Step 5: Run Claude Code SDK session
  let result: ProgrammerResult;

  try {
    let rawResult = '';

    for await (const message of query({
      prompt,
      options: {
        customSystemPrompt: SYSTEM_PROMPT,
        allowedTools: ['Read', 'Edit', 'Bash', 'Grep', 'Glob'],
        maxTurns: config.programmerMaxTurns,
        model: 'sonnet',
        ...(sessionId ? { resume: sessionId } : {}),
        hooks: {
          PreToolUse: [
            { matcher: 'Bash', hooks: [createSafetyHook(auditLogger, changeCount)] },
            { matcher: 'Edit', hooks: [createSafetyHook(auditLogger, changeCount)] },
            { matcher: 'Write', hooks: [createSafetyHook(auditLogger, changeCount)] },
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
        console.log(`[AgentProgrammer] Session: ${sessionId?.substring(0, 8)}...`);
      }

      // Capture result
      if ('result' in message) {
        rawResult = (message as { result: string }).result;
        console.log(`[AgentProgrammer] Analysis complete (${rawResult.length} chars)`);
      }
    }

    result = parseResult(rawResult, cycleId, startTime, errors.length);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[AgentProgrammer] Claude SDK error:', errorMsg);
    auditLogger.logError(errorMsg);
    await notifier.notifyAgentError(errorMsg, { cycleId, cycleNumber: cycleCount });

    result = {
      action: 'error',
      analysis: `SDK error: ${errorMsg}`,
      changes: [],
      buildResult: 'skipped',
      testsRun: [],
      nextCycleRecommendation: 'Retry',
      errorsAnalyzed: errors.length,
      cycleId,
      durationMs: Math.round(performance.now() - startTime),
    };
  }

  // Step 6: Log code changes to Supabase
  for (const change of result.changes) {
    await logCodeChange(
      change,
      cycleId,
      result.buildResult === 'success',
    );
    totalChanges++;
  }

  // Step 7: Save error patterns to Supabase for tracking
  for (const err of errors.slice(0, 10)) {
    await saveErrorPattern(err);
  }

  // Step 8: Send Slack report if changes were made
  if (result.changes.length > 0) {
    const changeList = result.changes
      .map(c => `• ${c.file}: ${c.description}`)
      .join('\n');

    await notifier.notifyAgentError(
      `Agent Programmer made ${result.changes.length} change(s):\n${changeList}\nBuild: ${result.buildResult}`,
      { cycleId, cycleNumber: cycleCount, buildResult: result.buildResult }
    );
  }

  // Step 9: Update state
  lastResult = result;
  auditLogger.logAgentStop({
    action: result.action,
    changesCount: result.changes.length,
    buildResult: result.buildResult,
    durationMs: result.durationMs,
  });

  console.log(`[AgentProgrammer] Cycle #${cycleCount} complete: ${result.action}, ${result.changes.length} changes, build: ${result.buildResult}`);

  return result;
}

// ── State Access ─────────────────────────────────────────────

/**
 * Get current agent state
 */
export function getProgrammerState() {
  return {
    sessionId,
    cycleCount,
    totalChanges,
    lastResult,
  };
}

/**
 * Reset agent state (for testing)
 */
export function resetProgrammerState() {
  sessionId = undefined;
  cycleCount = 0;
  totalChanges = 0;
  lastResult = null;
}

// ── Standalone execution ─────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(`
╔═══════════════════════════════════════════╗
║     FLOW Agent Programmer (standalone)    ║
║     Self-improving meta-agent             ║
╚═══════════════════════════════════════════╝
`);

  runProgrammerCycle()
    .then((result) => {
      console.log('\n═══ Cycle Result ═══');
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.action === 'error' ? 1 : 0);
    })
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(2);
    });
}
