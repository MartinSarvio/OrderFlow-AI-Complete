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

  // Agent Programmer
  programmerIntervalMs: parseInt(process.env.PROGRAMMER_INTERVAL_MS || '1800000'),  // 30 min
  programmerMaxTurns: parseInt(process.env.PROGRAMMER_MAX_TURNS || '15'),
  programmerMaxChangesPerCycle: parseInt(process.env.PROGRAMMER_MAX_CHANGES || '3'),
  programmerEnabled: process.env.PROGRAMMER_ENABLED !== 'false',  // Default: enabled
  programmerAllowedPaths: ['flow-agents/src/'] as readonly string[],
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
    patterns: [/^(ja|yes|ok|bekræft|accept|godkend|det er fint|sure|yep|jep|selvfølgelig)/i],
    confidence: 0.95,
  },
  cancel: {
    patterns: [/^(nej|no|annuller|cancel|afbestil|stop|fortryd)/i],
    confidence: 0.95,
  },
  reschedule: {
    patterns: [/(ændre tid|skubbe|senere|different time|flytte|udsætte|rykke)/i],
    confidence: 0.85,
  },
  question: {
    patterns: [/(hvad|what|hvordan|how|kan|can|hvornår|when|hvor|where|\?$)/i],
    confidence: 0.8,
  },
  allergy: {
    patterns: [/(allergi|allergy|nødder|gluten|laktose|lactose|shellfish|peanut)/i],
    confidence: 0.99,
  },
  delivery: {
    patterns: [/^(levering|delivery|deliver|bring det|kør det|til døren|udbringning)\s*$/i],
    confidence: 0.9,
  },
  pickup: {
    patterns: [/^(afhentning|pickup|pick up|hente|afhente|selv hente|kommer og henter)\s*$/i],
    confidence: 0.9,
  },
  order: {
    patterns: [/(\d+)\s*x?\s*(pizza|burger|salat|kebab|durum|shawarma|falafel|pommes|fries|cola|vand|øl|sandwich|wrap|nuggets|menu|nr\.?\s*\d+)/i],
    confidence: 0.85,
  },
} as const;

export type IntentType = keyof typeof SMS_PATTERNS | 'unknown';
export type EndpointStatus = 'healthy' | 'degraded' | 'down';
