import 'dotenv/config';
import { config } from './config.js';
import { runDebuggingCycle, getAgentState } from './agents/debugging-agent.js';
import { processIncomingSms, type IncomingSMS } from './agents/workflow-agent.js';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// FLOW Agent System — Main Entry Point & Scheduler
// ============================================================

console.log(`
╔═══════════════════════════════════════════╗
║     FLOW Agent System v1.0.0              ║
║     Debugging + Workflow Orchestration     ║
╚═══════════════════════════════════════════╝
`);

// ── Validate environment ─────────────────────────────────────

function validateEnv(): boolean {
  const required = [
    ['ANTHROPIC_API_KEY', config.anthropicApiKey],
    ['SUPABASE_URL', config.supabaseUrl],
    ['SUPABASE_SERVICE_KEY', config.supabaseKey],
  ];

  let valid = true;
  for (const [name, value] of required) {
    if (!value) {
      console.error(`❌ Missing required env var: ${name}`);
      valid = false;
    }
  }

  const optional = [
    ['INMOBILE_API_KEY', config.inmobileApiKey],
    ['STRIPE_SECRET_KEY', config.stripeSecretKey],
    ['SLACK_WEBHOOK_URL', config.slackWebhookUrl],
    ['ALERT_EMAIL', config.alertEmail],
  ];

  for (const [name, value] of optional) {
    if (!value) {
      console.warn(`⚠️  Optional env var not set: ${name}`);
    }
  }

  return valid;
}

// ── Debugging Agent Scheduler ────────────────────────────────

let debugInterval: ReturnType<typeof setInterval> | null = null;
let debugCycleCount = 0;

async function startDebuggingScheduler(): Promise<void> {
  console.log(`\n🔍 Debugging Agent starting...`);
  console.log(`   Interval: ${config.debugIntervalMs / 1000}s`);
  console.log(`   Endpoints: ${5} configured`);

  // Run first cycle immediately
  try {
    debugCycleCount++;
    console.log(`\n── Debug Cycle #${debugCycleCount} ──`);
    const { report } = await runDebuggingCycle();
    console.log(`   Result: ${report.overallStatus} (${report.healthyCount}/${report.totalChecked} healthy)`);
  } catch (err) {
    console.error('   ❌ First debug cycle failed:', err);
  }

  // Schedule recurring cycles
  debugInterval = setInterval(async () => {
    try {
      debugCycleCount++;
      console.log(`\n── Debug Cycle #${debugCycleCount} ──`);
      const { report } = await runDebuggingCycle();
      console.log(`   Result: ${report.overallStatus} (${report.healthyCount}/${report.totalChecked} healthy)`);
    } catch (err) {
      console.error(`   ❌ Debug cycle #${debugCycleCount} failed:`, err);
    }
  }, config.debugIntervalMs);
}

// ── Workflow Agent Poller ────────────────────────────────────

let workflowInterval: ReturnType<typeof setInterval> | null = null;
let lastCheckedTimestamp = new Date().toISOString();
let processedMessages = 0;

async function pollForNewMessages(): Promise<void> {
  try {
    const supabase = createClient(config.supabaseUrl, config.supabaseKey);

    // Query for new inbound SMS messages since last check
    const { data: messages, error } = await supabase
      .from('thread_messages')
      .select('*')
      .eq('direction', 'inbound')
      .eq('channel', 'sms')
      .gt('created_at', lastCheckedTimestamp)
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) {
      console.error('   ❌ Poll error:', error.message);
      return;
    }

    if (!messages || messages.length === 0) return;

    console.log(`\n📨 ${messages.length} new SMS message(s) found`);

    for (const msg of messages) {
      const sms: IncomingSMS = {
        messageId: msg.id || `msg-${Date.now()}`,
        from: msg.from_number || msg.customer_phone || '',
        body: msg.body || msg.content || '',
        receivedAt: msg.created_at,
        tenantId: msg.tenant_id,
      };

      console.log(`   Processing: "${sms.body.substring(0, 50)}${sms.body.length > 50 ? '...' : ''}" from ${sms.from}`);

      try {
        const result = await processIncomingSms(sms);
        processedMessages++;

        console.log(`   → Intent: ${result.intent} (${Math.round(result.confidence * 100)}%) → Action: ${result.action}`);
        if (result.smsReply) {
          console.log(`   → Reply: "${result.smsReply.substring(0, 60)}..."`);
          // TODO: Send SMS reply via Supabase Edge Function
          // await sendSmsReply(sms.from, result.smsReply, sms.tenantId);
        }
        if (result.escalation) {
          console.log(`   ⚠️ ESCALATION: ${result.escalation}`);
        }
      } catch (err) {
        console.error(`   ❌ Failed to process SMS ${sms.messageId}:`, err);
      }

      // Update last checked timestamp
      lastCheckedTimestamp = msg.created_at;
    }
  } catch (err) {
    console.error('   ❌ Workflow poll error:', err);
  }
}

async function startWorkflowPoller(): Promise<void> {
  console.log(`\n📱 Workflow Agent starting...`);
  console.log(`   Poll interval: ${config.workflowPollMs / 1000}s`);
  console.log(`   Watching: inbound SMS messages`);

  // Start polling
  workflowInterval = setInterval(pollForNewMessages, config.workflowPollMs);

  // Also do an initial poll
  await pollForNewMessages();
}

// ── Graceful shutdown ────────────────────────────────────────

function setupGracefulShutdown(): void {
  const shutdown = (signal: string) => {
    console.log(`\n\n🛑 Received ${signal} — shutting down gracefully...`);

    if (debugInterval) {
      clearInterval(debugInterval);
      debugInterval = null;
      console.log('   ✓ Debugging scheduler stopped');
    }

    if (workflowInterval) {
      clearInterval(workflowInterval);
      workflowInterval = null;
      console.log('   ✓ Workflow poller stopped');
    }

    const state = getAgentState();
    console.log(`\n📊 Session Summary:`);
    console.log(`   Debug cycles: ${debugCycleCount}`);
    console.log(`   Messages processed: ${processedMessages}`);
    console.log(`   Last debug status: ${state.lastReport?.overallStatus || 'N/A'}`);
    console.log(`   Debug session: ${state.sessionId || 'N/A'}`);

    console.log('\n👋 FLOW Agent System stopped.\n');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// ── Main ─────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Validate environment
  if (!validateEnv()) {
    console.error('\n❌ Environment validation failed. Fix the issues above and restart.');
    process.exit(1);
  }

  console.log('✅ Environment validated\n');

  // Setup graceful shutdown
  setupGracefulShutdown();

  // Start both agents
  await Promise.all([
    startDebuggingScheduler(),
    startWorkflowPoller(),
  ]);

  console.log('\n✅ All agents running. Press Ctrl+C to stop.\n');
}

// Run
main().catch((err) => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
