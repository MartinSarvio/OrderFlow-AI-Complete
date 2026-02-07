import 'dotenv/config';

// ============================================================
// FLOW Agent System Configuration
// ============================================================

export const config = {
  // Anthropic (used by debugging-agent)
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',

  // OpenAI (used by workflow-agent)
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',

  // Supabase
  supabaseUrl: process.env.SUPABASE_URL || 'https://qymtjhzgtcittohutmay.supabase.co',
  supabaseKey: process.env.SUPABASE_SERVICE_KEY || '',

  // InMobile SMS
  inmobileApiKey: process.env.INMOBILE_API_KEY || '',

  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',

  // Notifications
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || '',
  alertEmail: process.env.ALERT_EMAIL || '',

  // Scheduler intervals
  debugIntervalMs: parseInt(process.env.DEBUG_INTERVAL_MS || '300000'),   // 5 min
  workflowPollMs: parseInt(process.env.WORKFLOW_POLL_INTERVAL_MS || '5000'), // 5s
  inmobilePollMs: parseInt(process.env.INMOBILE_POLL_INTERVAL_MS || '15000'), // 15s

  // Thresholds
  responseTimeWarning: 2000,  // ms — mark as degraded
  responseTimeError: 10000,   // ms — mark as down
  maxAlertRatePerEndpoint: 1, // max alerts per 5 min per endpoint
} as const;

// Critical endpoints to monitor
export const ENDPOINTS = [
  {
    name: 'Supabase REST',
    url: `${config.supabaseUrl}/rest/v1/`,
    method: 'GET' as const,
    headers: { 'apikey': config.supabaseKey, 'Authorization': `Bearer ${config.supabaseKey}` },
    critical: true,
  },
  {
    name: 'SMS Send (Edge Function)',
    url: `${config.supabaseUrl}/functions/v1/send-sms`,
    method: 'GET' as const,
    headers: { 'Authorization': `Bearer ${config.supabaseKey}` },
    critical: true,
  },
  {
    name: 'SMS Receive (Edge Function)',
    url: `${config.supabaseUrl}/functions/v1/receive-sms`,
    method: 'GET' as const,
    headers: {},
    critical: true,
  },
  {
    name: 'Payment Intent (Edge Function)',
    url: `${config.supabaseUrl}/functions/v1/create-payment-intent`,
    method: 'GET' as const,
    headers: { 'Authorization': `Bearer ${config.supabaseKey}` },
    critical: true,
  },
  {
    name: 'OTP Email (Edge Function)',
    url: `${config.supabaseUrl}/functions/v1/send-otp-email`,
    method: 'GET' as const,
    headers: { 'Authorization': `Bearer ${config.supabaseKey}` },
    critical: false,
  },
  {
    name: 'SMS Receive InMobile (Edge Function)',
    url: `${config.supabaseUrl}/functions/v1/receive-sms-inmobile`,
    method: 'GET' as const,
    headers: {},
    critical: true,
  },
] as const;

// SMS intent patterns (Danish + English)
export const SMS_PATTERNS = {
  confirm: {
    patterns: [/^(ja|yes|ok|bekr\u00e6ft|accept|godkend|det er fint|sure|yep|jep|selvf\u00f8lgelig)/i],
    confidence: 0.95,
  },
  cancel: {
    patterns: [/^(nej|no|annuller|cancel|afbestil|stop|fortryd)/i],
    confidence: 0.95,
  },
  reschedule: {
    patterns: [/(\u00e6ndre tid|skubbe|senere|different time|flytte|uds\u00e6tte|rykke)/i],
    confidence: 0.85,
  },
  question: {
    patterns: [/(hvad|what|hvordan|how|kan|can|hvorn\u00e5r|when|hvor|where|\?$)/i],
    confidence: 0.8,
  },
  allergy: {
    patterns: [/(allergi|allergy|n\u00f8dder|gluten|laktose|lactose|shellfish|peanut)/i],
    confidence: 0.99,
  },
} as const;

export type IntentType = keyof typeof SMS_PATTERNS | 'unknown';
export type EndpointStatus = 'healthy' | 'degraded' | 'down';
