import { config } from '../config.js';

// ============================================================
// Error Notifier Hook — Slack/email alerts on failures
// ============================================================

export type AlertSeverity = 'warning' | 'error' | 'critical';

export interface Alert {
  severity: AlertSeverity;
  source: string;        // Agent or endpoint name
  title: string;
  details: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ── Rate limiting ────────────────────────────────────────────

const alertHistory = new Map<string, number[]>();
const RATE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Check if alert should be rate-limited
 */
function isRateLimited(source: string): boolean {
  const now = Date.now();
  const history = alertHistory.get(source) || [];

  // Clean old entries
  const recent = history.filter(t => now - t < RATE_WINDOW_MS);
  alertHistory.set(source, recent);

  if (recent.length >= config.maxAlertRatePerEndpoint) {
    return true;
  }

  // Record this alert
  recent.push(now);
  alertHistory.set(source, recent);
  return false;
}

// ── Slack notifications ──────────────────────────────────────

const SEVERITY_EMOJI: Record<AlertSeverity, string> = {
  warning: '\u26A0\uFE0F',
  error: '\u274C',
  critical: '\uD83D\uDEA8',
};

const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  warning: '#FFA500',
  error: '#FF0000',
  critical: '#8B0000',
};

/**
 * Send alert to Slack webhook
 */
async function sendSlackAlert(alert: Alert): Promise<boolean> {
  if (!config.slackWebhookUrl) {
    console.warn('[ErrorNotifier] No Slack webhook URL configured');
    return false;
  }

  try {
    const emoji = SEVERITY_EMOJI[alert.severity];
    const color = SEVERITY_COLOR[alert.severity];

    const payload = {
      text: `${emoji} *FLOW Agent Alert — ${alert.severity.toUpperCase()}*`,
      attachments: [
        {
          color,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*${alert.title}*\nSource: \`${alert.source}\`\n${alert.details}`,
              },
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `\uD83D\uDD52 ${alert.timestamp}`,
                },
              ],
            },
          ],
        },
      ],
    };

    const response = await fetch(config.slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (err) {
    console.error('[ErrorNotifier] Slack send failed:', err);
    return false;
  }
}

// ── Email notifications (for critical alerts) ────────────────

/**
 * Send critical alert via email using Supabase Edge Function
 */
async function sendEmailAlert(alert: Alert): Promise<boolean> {
  if (!config.alertEmail || !config.supabaseUrl || !config.supabaseKey) {
    console.warn('[ErrorNotifier] Email alert config incomplete');
    return false;
  }

  try {
    const response = await fetch(
      `${config.supabaseUrl}/functions/v1/send-otp-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.supabaseKey}`,
        },
        body: JSON.stringify({
          to: config.alertEmail,
          subject: `[FLOW ${alert.severity.toUpperCase()}] ${alert.title}`,
          html: `
            <h2>${SEVERITY_EMOJI[alert.severity]} ${alert.title}</h2>
            <p><strong>Source:</strong> ${alert.source}</p>
            <p><strong>Severity:</strong> ${alert.severity}</p>
            <p><strong>Time:</strong> ${alert.timestamp}</p>
            <hr>
            <pre>${alert.details}</pre>
            ${alert.metadata ? `<pre>${JSON.stringify(alert.metadata, null, 2)}</pre>` : ''}
          `,
          type: 'alert', // Use alert template instead of OTP
        }),
      }
    );

    return response.ok;
  } catch (err) {
    console.error('[ErrorNotifier] Email send failed:', err);
    return false;
  }
}

// ── Public API ───────────────────────────────────────────────

/**
 * Send an alert notification (Slack + optional email for critical)
 */
export async function sendAlert(alert: Alert): Promise<{
  sent: boolean;
  channels: string[];
  rateLimited: boolean;
}> {
  // Check rate limiting
  if (isRateLimited(alert.source)) {
    console.log(`[ErrorNotifier] Rate-limited alert for ${alert.source}`);
    return { sent: false, channels: [], rateLimited: true };
  }

  const channels: string[] = [];

  // Always send to Slack
  const slackSent = await sendSlackAlert(alert);
  if (slackSent) channels.push('slack');

  // Send email for critical alerts
  if (alert.severity === 'critical') {
    const emailSent = await sendEmailAlert(alert);
    if (emailSent) channels.push('email');
  }

  // Console log as fallback
  const logFn = alert.severity === 'critical' ? console.error : console.warn;
  logFn(`[ErrorNotifier] ${SEVERITY_EMOJI[alert.severity]} ${alert.title}: ${alert.details}`);

  return {
    sent: channels.length > 0,
    channels,
    rateLimited: false,
  };
}

/**
 * Create error notifier hooks for an agent
 */
export function createErrorNotifier(agentName: string) {
  return {
    /**
     * Notify about endpoint health issues
     */
    async notifyEndpointIssue(
      endpointName: string,
      status: string,
      details: string,
      critical: boolean
    ): Promise<void> {
      await sendAlert({
        severity: critical ? 'error' : 'warning',
        source: `${agentName}/${endpointName}`,
        title: `Endpoint ${status}: ${endpointName}`,
        details,
        timestamp: new Date().toISOString(),
      });
    },

    /**
     * Notify about critical allergy escalation
     */
    async notifyAllergyEscalation(
      orderId: string,
      allergyInfo: string,
      customerPhone: string
    ): Promise<void> {
      await sendAlert({
        severity: 'critical',
        source: `${agentName}/allergy`,
        title: `\uD83D\uDEA8 ALLERGY ALERT — Order ${orderId}`,
        details: `Customer reported allergy: ${allergyInfo}\nPhone: ${customerPhone}\n\nIMMEDIATE ACTION REQUIRED: Stop preparation and contact customer.`,
        timestamp: new Date().toISOString(),
        metadata: { orderId, allergyInfo, customerPhone },
      });
    },

    /**
     * Notify about payment failures
     */
    async notifyPaymentFailure(
      orderId: string,
      error: string
    ): Promise<void> {
      await sendAlert({
        severity: 'error',
        source: `${agentName}/payment`,
        title: `Payment Failed — Order ${orderId}`,
        details: error,
        timestamp: new Date().toISOString(),
        metadata: { orderId },
      });
    },

    /**
     * Notify about agent errors
     */
    async notifyAgentError(
      error: string,
      context?: Record<string, unknown>
    ): Promise<void> {
      await sendAlert({
        severity: 'error',
        source: agentName,
        title: `Agent Error: ${agentName}`,
        details: error,
        timestamp: new Date().toISOString(),
        metadata: context,
      });
    },

    /**
     * Notify about unhandled SMS (unknown intent)
     */
    async notifyUnhandledSms(
      phone: string,
      message: string,
      orderId?: string
    ): Promise<void> {
      await sendAlert({
        severity: 'warning',
        source: `${agentName}/sms`,
        title: 'Unhandled SMS — Manual Review Needed',
        details: `From: ${phone}\nMessage: "${message}"${orderId ? `\nOrder: ${orderId}` : ''}`,
        timestamp: new Date().toISOString(),
        metadata: { phone, message, orderId },
      });
    },
  };
}

export type ErrorNotifier = ReturnType<typeof createErrorNotifier>;
