import 'dotenv/config';
import { config } from './config.js';
import { runDebuggingCycle, getAgentState } from './agents/debugging-agent.js';
import { processIncomingSms, type IncomingSMS } from './agents/workflow-agent.js';
import { runProgrammerCycle, getProgrammerState } from './agents/agent-programmer.js';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// FLOW Agent System — Main Entry Point & Scheduler
// ============================================================

console.log(`
╔═══════════════════════════════════════════╗
║     FLOW Agent System v1.2.0              ║
║     Debug + Workflow + InMobile + Programmer║
╚═══════════════════════════════════════════╝
`);

// ── Validate environment ─────────────────────────────────────

function validateEnv(): boolean {
  const required = [
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
    ['OPENAI_API_KEY', config.openaiApiKey],
    ['OPENAI_MODEL', config.openaiModel],
    ['ANTHROPIC_API_KEY', config.anthropicApiKey],
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

// ── Phone normalization ──────────────────────────────────────

function normalizePhone(raw: string): string {
  let digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('45')) return `+${digits}`;
  if (digits.length === 8) return `+45${digits}`;
  return `+${digits}`;
}

// ── Debugging Agent Scheduler ────────────────────────────────

let debugInterval: ReturnType<typeof setInterval> | null = null;
let debugCycleCount = 0;

async function startDebuggingScheduler(): Promise<void> {
  console.log(`\n🔍 Debugging Agent starting...`);
  console.log(`   Interval: ${config.debugIntervalMs / 1000}s`);
  console.log(`   Endpoints: ${6} configured`);

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
let workflowPollInFlight = false;

async function pollForNewMessages(): Promise<void> {
  if (workflowPollInFlight) return;
  workflowPollInFlight = true;

  try {
    const supabase = createClient(config.supabaseUrl, config.supabaseKey);

    // Query for new inbound customer SMS text messages since last check.
    // NOTE: channel lives on conversation_threads, not thread_messages — use inner join.
    const { data: messages, error } = await supabase
      .from('thread_messages')
      .select('*, conversation_threads!inner(channel, tenant_id)')
      .eq('direction', 'inbound')
      .eq('sender_type', 'customer')
      .eq('message_type', 'text')
      .eq('conversation_threads.channel', 'sms')
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
      const threadData = msg.conversation_threads as Record<string, unknown> | undefined;
      const sms: IncomingSMS = {
        messageId: msg.external_message_id || msg.id || `msg-${Date.now()}`,
        from: (msg.metadata as Record<string, unknown>)?.phone as string || '',
        body: msg.content || '',
        receivedAt: msg.created_at,
        tenantId: (threadData?.tenant_id as string) || undefined,
      };

      if (!sms.from || !sms.body) {
        lastCheckedTimestamp = msg.created_at;
        continue;
      }

      console.log(`   Processing: "${sms.body.substring(0, 50)}${sms.body.length > 50 ? '...' : ''}" from ${sms.from}`);

      try {
        const result = await processIncomingSms(sms);
        processedMessages++;

        console.log(`   → Intent: ${result.intent} (${Math.round(result.confidence * 100)}%) → Action: ${result.action}`);
        if (result.smsReply) {
          console.log(`   → Reply: "${result.smsReply.substring(0, 60)}..."`);
          // Send SMS reply via Supabase Edge Function
          await sendSmsReply(sms.from, result.smsReply);
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
  } finally {
    workflowPollInFlight = false;
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

// ── InMobile Incoming SMS Poller ─────────────────────────────
// Polls InMobile API for incoming SMS (official documented method).
// Each message is returned only once by InMobile (marked as read after retrieval).

let inmobileInterval: ReturnType<typeof setInterval> | null = null;
let inmobilePollCount = 0;
let inmobileMessagesReceived = 0;

async function pollInMobileIncoming(): Promise<void> {
  if (!config.inmobileApiKey) return;

  try {
    inmobilePollCount++;
    const basicAuth = Buffer.from(':' + config.inmobileApiKey).toString('base64');

    const response = await fetch('https://api.inmobile.com/v4/sms/incoming/messages?limit=250', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status !== 204) {
        console.error(`   ❌ InMobile poll failed: ${response.status} ${response.statusText}`);
      }
      return;
    }

    const data = await response.json();
    const messages = data?.messages;

    if (!messages || !Array.isArray(messages) || messages.length === 0) return;

    console.log(`\n📲 InMobile: ${messages.length} incoming SMS message(s)`);

    const supabase = createClient(config.supabaseUrl, config.supabaseKey);

    for (const msg of messages) {
      try {
        const from = msg.from as Record<string, unknown> | undefined;
        const to = msg.to as Record<string, unknown> | undefined;

        let senderRaw = '';
        if (from) {
          senderRaw = String(from.rawSource || '');
          if (!senderRaw && from.phoneNumber) {
            senderRaw = String(from.countryCode || '45') + String(from.phoneNumber);
          }
        }

        const sender = normalizePhone(senderRaw);
        const receiver = normalizePhone(String(to?.msisdn || to?.phoneNumber || ''));
        const text = String(msg.text || '');
        const receivedAt = String(msg.receivedAt || new Date().toISOString());
        const messageId = `inmobile-${sender}-${receivedAt}`;

        if (!sender || !text) {
          console.log(`   Skipping: missing sender or text`);
          continue;
        }

        // Idempotency check
        const { data: existing } = await supabase
          .from('message_idempotency')
          .select('id')
          .eq('channel', 'sms')
          .eq('external_message_id', messageId)
          .limit(1);

        if (existing && existing.length > 0) {
          continue; // Already processed (e.g., via webhook)
        }

        // Mark as processed
        await supabase.from('message_idempotency').insert({
          channel: 'sms',
          external_message_id: messageId,
        });

        inmobileMessagesReceived++;
        console.log(`   From: ${sender}, Text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

        // Insert into messages table (backward compat)
        await supabase.from('messages').insert({
          phone: sender,
          direction: 'inbound',
          content: text,
          provider: 'inmobile',
          receiver: receiver,
          raw_payload: msg,
          created_at: receivedAt,
        });

        // Resolve tenant
        let tenantId: string | null = null;
        if (receiver) {
          const { data: tenants } = await supabase
            .from('restaurants')
            .select('id')
            .eq('sms_number', receiver)
            .limit(1);
          if (tenants && tenants.length > 0) tenantId = tenants[0].id;
        }
        if (!tenantId) {
          const { data: fallback } = await supabase
            .from('restaurants')
            .select('id')
            .limit(1);
          tenantId = fallback?.[0]?.id || null;
        }

        if (!tenantId) {
          console.log(`   No tenant found for receiver: ${receiver}`);
          continue;
        }

        // Find or create customer
        let customerId: string | null = null;
        const { data: custData } = await supabase.rpc('get_or_create_customer', {
          p_tenant_id: tenantId,
          p_phone: sender,
          p_email: null,
          p_name: null,
        });
        if (custData) {
          customerId = Array.isArray(custData) ? custData[0]?.id : custData?.id;
        }

        if (!customerId) {
          const { data: existingCust } = await supabase
            .from('customers')
            .select('id')
            .eq('phone', sender)
            .eq('tenant_id', tenantId)
            .limit(1);
          if (existingCust && existingCust.length > 0) {
            customerId = existingCust[0].id;
          } else {
            const { data: newCust } = await supabase
              .from('customers')
              .insert({ tenant_id: tenantId, phone: sender })
              .select('id')
              .single();
            customerId = newCust?.id || null;
          }
        }

        if (!customerId) {
          console.log(`   Could not create customer for: ${sender}`);
          continue;
        }

        // Find or create thread
        let threadId: string | null = null;
        const { data: threads } = await supabase
          .from('conversation_threads')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('customer_id', customerId)
          .eq('channel', 'sms')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(1);

        if (threads && threads.length > 0) {
          threadId = threads[0].id;
          await supabase
            .from('conversation_threads')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', threadId);
        } else {
          const { data: newThread } = await supabase
            .from('conversation_threads')
            .insert({
              tenant_id: tenantId,
              customer_id: customerId,
              channel: 'sms',
              external_thread_id: sender,
              status: 'open',
              last_message_at: new Date().toISOString(),
            })
            .select('id')
            .single();
          threadId = newThread?.id || null;
        }

        if (!threadId) {
          console.log(`   Could not create thread for: ${sender}`);
          continue;
        }

        // Insert thread_message
        await supabase.from('thread_messages').insert({
          thread_id: threadId,
          direction: 'inbound',
          sender_type: 'customer',
          content: text,
          message_type: 'text',
          external_message_id: messageId,
          metadata: { phone: sender, provider: 'inmobile', receiver, source: 'polling' },
          status: 'pending',
        });

        // Process through workflow agent
        const sms: IncomingSMS = {
          messageId,
          from: sender,
          body: text,
          receivedAt,
          tenantId,
        };

        try {
          const result = await processIncomingSms(sms);
          processedMessages++;
          console.log(`   → Intent: ${result.intent} (${Math.round(result.confidence * 100)}%) → Action: ${result.action}`);

          if (result.smsReply) {
            console.log(`   → Reply: "${result.smsReply.substring(0, 60)}..."`);
            await sendSmsReply(sender, result.smsReply);
          }
          if (result.escalation) {
            console.log(`   ⚠️ ESCALATION: ${result.escalation}`);
          }
        } catch (err) {
          console.error(`   ❌ Workflow processing failed for ${messageId}:`, err);
        }
      } catch (msgErr) {
        console.error(`   ❌ Failed to process InMobile message:`, msgErr);
      }
    }
  } catch (err) {
    console.error('   ❌ InMobile poll error:', err);
  }
}

async function startInMobilePoller(): Promise<void> {
  if (!config.inmobileApiKey) {
    console.log(`\n📲 InMobile Poller skipped (no INMOBILE_API_KEY)`);
    return;
  }

  console.log(`\n📲 InMobile Poller starting...`);
  console.log(`   Poll interval: ${config.inmobilePollMs / 1000}s`);
  console.log(`   API: GET /v4/sms/incoming/messages`);

  // Initial poll
  await pollInMobileIncoming();

  // Schedule recurring polls
  inmobileInterval = setInterval(pollInMobileIncoming, config.inmobilePollMs);
}

// ── Send SMS Reply Helper ────────────────────────────────────

async function sendSmsReply(to: string, message: string): Promise<void> {
  try {
    const response = await fetch(`${config.supabaseUrl}/functions/v1/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.supabaseKey}`,
      },
      body: JSON.stringify({
        to,
        message,
        apiKey: config.inmobileApiKey || undefined,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`   ❌ SMS reply failed: ${err}`);
    }
  } catch (err) {
    console.error(`   ❌ SMS reply error:`, err);
  }
}

// ── Agent Programmer Scheduler ───────────────────────────────

let programmerInterval: ReturnType<typeof setInterval> | null = null;
let programmerCycleCount = 0;
let programmerInFlight = false;

async function startAgentProgrammer(): Promise<void> {
  if (!config.programmerEnabled) {
    console.log(`\n🤖 Agent Programmer disabled (PROGRAMMER_ENABLED=false)`);
    return;
  }

  console.log(`\n🤖 Agent Programmer starting...`);
  console.log(`   Interval: ${config.programmerIntervalMs / 1000}s`);
  console.log(`   Max turns: ${config.programmerMaxTurns}`);
  console.log(`   Max changes/cycle: ${config.programmerMaxChangesPerCycle}`);

  // First cycle after 10 minutes (let other agents warm up and produce logs)
  setTimeout(async () => {
    if (programmerInFlight) return;
    programmerInFlight = true;
    try {
      programmerCycleCount++;
      console.log(`\n── Programmer Cycle #${programmerCycleCount} ──`);
      const result = await runProgrammerCycle();
      console.log(`   Result: ${result.action}, changes: ${result.changes.length}, build: ${result.buildResult}`);
    } catch (err) {
      console.error(`   ❌ Programmer cycle #${programmerCycleCount} failed:`, err);
    } finally {
      programmerInFlight = false;
    }
  }, 10 * 60 * 1000);

  // Schedule recurring cycles
  programmerInterval = setInterval(async () => {
    if (programmerInFlight) return;
    programmerInFlight = true;
    try {
      programmerCycleCount++;
      console.log(`\n── Programmer Cycle #${programmerCycleCount} ──`);
      const result = await runProgrammerCycle();
      console.log(`   Result: ${result.action}, changes: ${result.changes.length}, build: ${result.buildResult}`);
    } catch (err) {
      console.error(`   ❌ Programmer cycle #${programmerCycleCount} failed:`, err);
    } finally {
      programmerInFlight = false;
    }
  }, config.programmerIntervalMs);
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

    if (inmobileInterval) {
      clearInterval(inmobileInterval);
      inmobileInterval = null;
      console.log('   ✓ InMobile poller stopped');
    }

    if (programmerInterval) {
      clearInterval(programmerInterval);
      programmerInterval = null;
      console.log('   ✓ Agent Programmer stopped');
    }

    const state = getAgentState();
    const programmerState = getProgrammerState();
    console.log(`\n📊 Session Summary:`);
    console.log(`   Debug cycles: ${debugCycleCount}`);
    console.log(`   Messages processed: ${processedMessages}`);
    console.log(`   InMobile polls: ${inmobilePollCount}`);
    console.log(`   InMobile messages received: ${inmobileMessagesReceived}`);
    console.log(`   Programmer cycles: ${programmerCycleCount}`);
    console.log(`   Programmer total changes: ${programmerState.totalChanges}`);
    console.log(`   Last debug status: ${state.lastReport?.overallStatus || 'N/A'}`);
    console.log(`   Debug session: ${state.sessionId || 'N/A'}`);
    console.log(`   Programmer session: ${programmerState.sessionId || 'N/A'}`);

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

  // Start all agents
  await Promise.all([
    startDebuggingScheduler(),
    startWorkflowPoller(),
    startInMobilePoller(),
    startAgentProgrammer(),
  ]);

  console.log('\n✅ All agents running. Press Ctrl+C to stop.\n');
}

// Run
main().catch((err) => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
