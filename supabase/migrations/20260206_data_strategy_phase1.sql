-- =====================================================
-- FLOW DATA STRATEGY - PHASE 1: FOUNDATION
-- Version: 1.0
-- Date: 2026-02-06
-- Description: Core tables for analytics, payments, AI tracking, and compliance
-- =====================================================

BEGIN;

-- =====================================================
-- 1. ORDER ITEMS - Detaljerede ordre linjer
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,

    -- Product snapshot (ved ordre tidspunkt)
    product_name TEXT NOT NULL,
    product_sku TEXT,
    product_category TEXT,

    -- Pricing (stored as øre/cents)
    unit_price INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    line_total INTEGER NOT NULL,

    -- Discounts
    discount_amount INTEGER DEFAULT 0,
    discount_reason TEXT,

    -- Options/variants
    options JSONB DEFAULT '[]',
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orderitems_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orderitems_product ON order_items(product_id);

COMMENT ON TABLE order_items IS 'Individual line items within an order';
COMMENT ON COLUMN order_items.unit_price IS 'Price per unit in øre (cents)';
COMMENT ON COLUMN order_items.options IS 'Product options like size, extras [{name, value, price_mod}]';

-- =====================================================
-- 2. PAYMENTS - Betalingstransaktioner
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

    -- Payment details
    amount INTEGER NOT NULL,
    currency CHAR(3) DEFAULT 'DKK',

    -- Status
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded')),

    -- Provider info
    provider TEXT NOT NULL
        CHECK (provider IN ('stripe', 'mobilepay', 'cash', 'invoice', 'card_terminal', 'other')),
    provider_transaction_id TEXT,
    provider_response JSONB,

    -- Card info (masked)
    card_last_four CHAR(4),
    card_brand TEXT,

    -- Refund tracking
    refunded_amount INTEGER DEFAULT 0,
    refund_reason TEXT,

    -- Timestamps
    initiated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_restaurant ON payments(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(provider);

COMMENT ON TABLE payments IS 'Payment transactions for orders';
COMMENT ON COLUMN payments.amount IS 'Payment amount in øre (cents)';

-- =====================================================
-- 3. USER CONSENTS - GDPR samtykke tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,

    -- Consent type
    consent_type TEXT NOT NULL
        CHECK (consent_type IN ('marketing_email', 'marketing_sms', 'analytics', 'cookies', 'terms', 'privacy', 'loyalty')),

    -- Consent status
    granted BOOLEAN NOT NULL,

    -- Consent details
    consent_version TEXT,
    consent_text TEXT,

    -- Collection context
    collection_method TEXT
        CHECK (collection_method IN ('signup_form', 'cookie_banner', 'settings_page', 'checkout', 'loyalty_signup', 'api')),
    ip_address INET,
    user_agent TEXT,

    -- Timestamps
    granted_at TIMESTAMPTZ,
    withdrawn_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consents_user ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_consents_restaurant ON user_consents(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_consents_type ON user_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_consents_granted ON user_consents(granted);

COMMENT ON TABLE user_consents IS 'GDPR consent tracking for users';

-- =====================================================
-- 4. SESSIONS - Bruger sessions tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    visitor_id TEXT NOT NULL,
    session_id TEXT NOT NULL UNIQUE,

    -- Session metadata
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,

    -- Device info
    device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
    browser TEXT,
    os TEXT,
    screen_resolution TEXT,

    -- Traffic source
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    referrer TEXT,
    landing_page TEXT,

    -- Session metrics
    page_views INTEGER DEFAULT 0,
    events_count INTEGER DEFAULT 0,
    orders_created INTEGER DEFAULT 0,

    -- Geolocation (anonymiseret)
    country_code CHAR(2),
    region TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_restaurant ON sessions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_visitor ON sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);

COMMENT ON TABLE sessions IS 'User browsing sessions for analytics';

-- =====================================================
-- 5. EVENTS - Alle bruger events
-- =====================================================
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    session_id TEXT REFERENCES sessions(session_id) ON DELETE SET NULL,

    -- Event identification
    event_name TEXT NOT NULL,
    event_category TEXT NOT NULL
        CHECK (event_category IN ('ecommerce', 'engagement', 'ai', 'social', 'system', 'marketing', 'other')),

    -- Event data
    event_data JSONB DEFAULT '{}',

    -- Page context
    page_url TEXT,
    page_path TEXT,
    page_title TEXT,

    -- Element context (for clicks)
    element_id TEXT,
    element_class TEXT,
    element_text TEXT,
    element_tag TEXT,

    -- Position (for heatmaps)
    viewport_x INTEGER,
    viewport_y INTEGER,
    page_x INTEGER,
    page_y INTEGER,

    -- Timing
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    time_on_page_ms INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_restaurant ON events(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_name ON events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(event_category);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);

COMMENT ON TABLE events IS 'All user interaction events for analytics';

-- =====================================================
-- 6. PAGE VIEWS - Detaljeret sidevisningsdata
-- =====================================================
CREATE TABLE IF NOT EXISTS page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    session_id TEXT REFERENCES sessions(session_id) ON DELETE SET NULL,

    -- Page info
    page_url TEXT NOT NULL,
    page_path TEXT NOT NULL,
    page_title TEXT,

    -- Timing
    entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    exited_at TIMESTAMPTZ,
    time_on_page_ms INTEGER,

    -- Scroll depth
    max_scroll_depth_percent INTEGER CHECK (max_scroll_depth_percent BETWEEN 0 AND 100),

    -- Engagement
    clicks_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pageviews_restaurant ON page_views(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_pageviews_session ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_pageviews_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_pageviews_entered ON page_views(entered_at);

COMMENT ON TABLE page_views IS 'Individual page view records';

-- =====================================================
-- 7. AI CONVERSATIONS - AI chatbot samtaler
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,

    -- Conversation identification
    conversation_id TEXT NOT NULL UNIQUE,

    -- Channel
    channel TEXT NOT NULL
        CHECK (channel IN ('web_chat', 'instagram_dm', 'facebook_messenger', 'sms', 'whatsapp', 'phone')),
    channel_user_id TEXT,

    -- Customer info (if identified)
    customer_phone TEXT,
    customer_name TEXT,

    -- Conversation metadata
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,

    -- State tracking
    current_state TEXT,
    language TEXT DEFAULT 'da' CHECK (language IN ('da', 'en', 'de', 'sv', 'no')),

    -- Outcome
    outcome TEXT CHECK (outcome IN ('order_completed', 'abandoned', 'escalated', 'info_provided', 'error', 'timeout')),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,

    -- Metrics
    message_count INTEGER DEFAULT 0,
    clarification_count INTEGER DEFAULT 0,
    frustration_score DECIMAL(3,2) CHECK (frustration_score BETWEEN 0 AND 1),

    -- Feedback
    customer_rating INTEGER CHECK (customer_rating BETWEEN 1 AND 5),
    customer_feedback TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aiconv_restaurant ON ai_conversations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_aiconv_conversation_id ON ai_conversations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_aiconv_channel ON ai_conversations(channel);
CREATE INDEX IF NOT EXISTS idx_aiconv_outcome ON ai_conversations(outcome);
CREATE INDEX IF NOT EXISTS idx_aiconv_started ON ai_conversations(started_at);
CREATE INDEX IF NOT EXISTS idx_aiconv_customer_phone ON ai_conversations(customer_phone);

COMMENT ON TABLE ai_conversations IS 'AI chatbot conversation sessions';

-- =====================================================
-- 8. AI MESSAGES - Individuelle beskeder i samtale
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id TEXT NOT NULL REFERENCES ai_conversations(conversation_id) ON DELETE CASCADE,

    -- Message content
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,

    -- Intent detection (for user messages)
    detected_intent TEXT,
    intent_confidence DECIMAL(3,2) CHECK (intent_confidence BETWEEN 0 AND 1),
    entities JSONB,

    -- Response metadata (for assistant messages)
    response_time_ms INTEGER,
    tokens_used INTEGER,
    model_version TEXT,

    -- State at message time
    conversation_state TEXT,

    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aimsg_conversation ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_aimsg_role ON ai_messages(role);
CREATE INDEX IF NOT EXISTS idx_aimsg_intent ON ai_messages(detected_intent);
CREATE INDEX IF NOT EXISTS idx_aimsg_timestamp ON ai_messages(timestamp);

COMMENT ON TABLE ai_messages IS 'Individual messages within AI conversations';

-- =====================================================
-- 9. AI INTENTS - Intent definitions og performance
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Intent definition
    intent_name TEXT NOT NULL UNIQUE,
    intent_category TEXT NOT NULL
        CHECK (intent_category IN ('ordering', 'support', 'info', 'social', 'navigation', 'other')),
    description TEXT,

    -- Training examples
    example_phrases JSONB DEFAULT '[]',

    -- Performance metrics (updated periodically)
    total_detections INTEGER DEFAULT 0,
    correct_detections INTEGER DEFAULT 0,
    accuracy_rate DECIMAL(5,4),

    -- Active status
    is_active BOOLEAN DEFAULT TRUE,

    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aiintents_name ON ai_intents(intent_name);
CREATE INDEX IF NOT EXISTS idx_aiintents_category ON ai_intents(intent_category);

COMMENT ON TABLE ai_intents IS 'AI intent definitions and performance tracking';

-- Insert default intents
INSERT INTO ai_intents (intent_name, intent_category, description, example_phrases) VALUES
    ('order_food', 'ordering', 'Customer wants to place a food order', '["Jeg vil gerne bestille", "Kan jeg få en pizza", "I would like to order"]'),
    ('check_hours', 'info', 'Customer asks about opening hours', '["Hvornår har I åbent", "What are your hours", "Er I åbne nu"]'),
    ('check_menu', 'info', 'Customer asks about menu or products', '["Hvad har I på menuen", "What do you serve", "Har I vegetarisk"]'),
    ('check_delivery', 'info', 'Customer asks about delivery options', '["Leverer I til", "How long for delivery", "Hvad koster levering"]'),
    ('modify_order', 'ordering', 'Customer wants to change their order', '["Kan jeg ændre min ordre", "I want to remove", "Tilføj venligst"]'),
    ('cancel_order', 'ordering', 'Customer wants to cancel order', '["Jeg vil gerne annullere", "Cancel my order", "Fortryd bestilling"]'),
    ('complaint', 'support', 'Customer has a complaint', '["Der er noget galt", "Jeg er utilfreds", "This is wrong"]'),
    ('greeting', 'social', 'Customer greets the bot', '["Hej", "Hello", "Goddag"]'),
    ('goodbye', 'social', 'Customer ends conversation', '["Tak", "Goodbye", "Farvel"]'),
    ('unknown', 'other', 'Intent could not be determined', '[]')
ON CONFLICT (intent_name) DO NOTHING;

-- =====================================================
-- 10. AI FEEDBACK - Feedback til AI forbedring
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES ai_messages(id) ON DELETE CASCADE,
    conversation_id TEXT REFERENCES ai_conversations(conversation_id) ON DELETE CASCADE,

    -- Feedback type
    feedback_type TEXT NOT NULL
        CHECK (feedback_type IN ('intent_correction', 'response_quality', 'escalation_reason', 'general')),

    -- Feedback data
    original_value TEXT,
    correct_value TEXT,
    feedback_notes TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),

    -- Source
    feedback_source TEXT CHECK (feedback_source IN ('customer', 'staff', 'automatic', 'review')),
    feedback_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Status
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aifeedback_conversation ON ai_feedback(conversation_id);
CREATE INDEX IF NOT EXISTS idx_aifeedback_type ON ai_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_aifeedback_processed ON ai_feedback(processed);

COMMENT ON TABLE ai_feedback IS 'Feedback for AI improvement and training';

-- =====================================================
-- 11. DAILY METRICS - Daglige aggregerede metrics
-- =====================================================
CREATE TABLE IF NOT EXISTS daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Revenue metrics (i øre)
    total_revenue INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    avg_order_value INTEGER DEFAULT 0,

    -- Order breakdown by fulfillment
    orders_delivery INTEGER DEFAULT 0,
    orders_pickup INTEGER DEFAULT 0,
    orders_dine_in INTEGER DEFAULT 0,

    -- Order breakdown by channel
    orders_web INTEGER DEFAULT 0,
    orders_app INTEGER DEFAULT 0,
    orders_instagram INTEGER DEFAULT 0,
    orders_facebook INTEGER DEFAULT 0,
    orders_sms INTEGER DEFAULT 0,
    orders_phone INTEGER DEFAULT 0,
    orders_walk_in INTEGER DEFAULT 0,
    orders_wolt INTEGER DEFAULT 0,
    orders_foodora INTEGER DEFAULT 0,

    -- Traffic metrics
    unique_visitors INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    total_page_views INTEGER DEFAULT 0,

    -- Engagement
    avg_session_duration_sec INTEGER,
    bounce_rate DECIMAL(5,4),

    -- AI metrics
    ai_conversations INTEGER DEFAULT 0,
    ai_orders_created INTEGER DEFAULT 0,
    ai_conversion_rate DECIMAL(5,4),
    ai_escalations INTEGER DEFAULT 0,

    -- Marketing metrics
    sms_sent INTEGER DEFAULT 0,
    sms_delivered INTEGER DEFAULT 0,
    sms_clicks INTEGER DEFAULT 0,
    email_sent INTEGER DEFAULT 0,
    email_opens INTEGER DEFAULT 0,
    email_clicks INTEGER DEFAULT 0,

    -- Loyalty metrics
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    new_loyalty_members INTEGER DEFAULT 0,

    -- Customer metrics
    new_customers INTEGER DEFAULT 0,
    returning_customers INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(restaurant_id, date)
);

CREATE INDEX IF NOT EXISTS idx_dailymetrics_restaurant ON daily_metrics(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_dailymetrics_date ON daily_metrics(date);

COMMENT ON TABLE daily_metrics IS 'Pre-aggregated daily metrics for fast dashboard loading';
COMMENT ON COLUMN daily_metrics.total_revenue IS 'Total revenue in øre (cents)';

-- =====================================================
-- 12. PRODUCT ANALYTICS - Produkt performance metrics
-- =====================================================
CREATE TABLE IF NOT EXISTS product_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

    -- Time period
    date DATE NOT NULL,

    -- Sales metrics
    units_sold INTEGER DEFAULT 0,
    revenue INTEGER DEFAULT 0,
    orders_containing INTEGER DEFAULT 0,

    -- Calculated metrics
    avg_order_quantity DECIMAL(5,2),

    -- Visibility metrics
    menu_views INTEGER DEFAULT 0,
    add_to_cart INTEGER DEFAULT 0,
    removed_from_cart INTEGER DEFAULT 0,

    -- Conversion rates
    view_to_cart_rate DECIMAL(5,4),
    cart_to_purchase_rate DECIMAL(5,4),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(product_id, date)
);

CREATE INDEX IF NOT EXISTS idx_prodanalytics_product ON product_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_prodanalytics_restaurant ON product_analytics(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_prodanalytics_date ON product_analytics(date);

COMMENT ON TABLE product_analytics IS 'Daily product performance metrics';

-- =====================================================
-- 13. CHANNEL ATTRIBUTION - Marketing attribution
-- =====================================================
CREATE TABLE IF NOT EXISTS channel_attribution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

    -- First touch attribution
    first_touch_channel TEXT,
    first_touch_source TEXT,
    first_touch_medium TEXT,
    first_touch_campaign TEXT,
    first_touch_at TIMESTAMPTZ,

    -- Last touch attribution
    last_touch_channel TEXT,
    last_touch_source TEXT,
    last_touch_medium TEXT,
    last_touch_campaign TEXT,
    last_touch_at TIMESTAMPTZ,

    -- Multi-touch path
    touchpoint_path JSONB DEFAULT '[]',
    touchpoint_count INTEGER DEFAULT 0,

    -- Time to conversion
    days_to_conversion INTEGER,
    sessions_to_conversion INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attribution_order ON channel_attribution(order_id);
CREATE INDEX IF NOT EXISTS idx_attribution_restaurant ON channel_attribution(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_attribution_first_channel ON channel_attribution(first_touch_channel);
CREATE INDEX IF NOT EXISTS idx_attribution_last_channel ON channel_attribution(last_touch_channel);

COMMENT ON TABLE channel_attribution IS 'Marketing channel attribution for orders';

-- =====================================================
-- 14. WEBHOOK LOGS - Webhook requests/responses
-- =====================================================
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,

    -- Webhook identification
    webhook_type TEXT NOT NULL CHECK (webhook_type IN ('incoming', 'outgoing')),
    webhook_name TEXT NOT NULL,

    -- Request details
    method TEXT,
    url TEXT,
    headers JSONB,
    request_body JSONB,

    -- Response details
    response_status INTEGER,
    response_body JSONB,
    response_time_ms INTEGER,

    -- Status
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'timeout', 'retrying', 'pending')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Idempotency
    idempotency_key TEXT,

    -- Timestamps
    received_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooklogs_restaurant ON webhook_logs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_webhooklogs_type ON webhook_logs(webhook_type);
CREATE INDEX IF NOT EXISTS idx_webhooklogs_name ON webhook_logs(webhook_name);
CREATE INDEX IF NOT EXISTS idx_webhooklogs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhooklogs_received ON webhook_logs(received_at);
CREATE INDEX IF NOT EXISTS idx_webhooklogs_idempotency ON webhook_logs(idempotency_key);

COMMENT ON TABLE webhook_logs IS 'Log of all webhook requests and responses';

-- =====================================================
-- 15. INTEGRATION CONFIGS - Integration konfigurationer
-- =====================================================
CREATE TABLE IF NOT EXISTS integration_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

    -- Integration identification
    integration_type TEXT NOT NULL
        CHECK (integration_type IN ('payment', 'accounting', 'sms', 'email', 'social', 'delivery', 'pos', 'other')),
    integration_name TEXT NOT NULL,

    -- Configuration
    config JSONB NOT NULL DEFAULT '{}',
    credentials_encrypted JSONB,

    -- Status
    status TEXT DEFAULT 'inactive'
        CHECK (status IN ('active', 'inactive', 'error', 'pending_setup', 'suspended')),
    last_sync_at TIMESTAMPTZ,
    last_error TEXT,
    last_error_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(restaurant_id, integration_type, integration_name)
);

CREATE INDEX IF NOT EXISTS idx_integrationconfigs_restaurant ON integration_configs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_integrationconfigs_type ON integration_configs(integration_type);
CREATE INDEX IF NOT EXISTS idx_integrationconfigs_status ON integration_configs(status);

COMMENT ON TABLE integration_configs IS 'External integration configurations';

-- =====================================================
-- 16. API LOGS - Udgående API kald
-- =====================================================
CREATE TABLE IF NOT EXISTS api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,

    -- API identification
    api_name TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,

    -- Request (no sensitive data)
    request_params JSONB,
    request_body_hash TEXT,

    -- Response
    response_status INTEGER,
    response_time_ms INTEGER,

    -- Status
    success BOOLEAN,
    error_code TEXT,
    error_message TEXT,

    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apilogs_restaurant ON api_logs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_apilogs_api ON api_logs(api_name);
CREATE INDEX IF NOT EXISTS idx_apilogs_timestamp ON api_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_apilogs_success ON api_logs(success);

COMMENT ON TABLE api_logs IS 'Log of outgoing API calls';

-- =====================================================
-- 17. SYSTEM LOGS - System events og performance
-- =====================================================
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Log identification
    log_level TEXT NOT NULL
        CHECK (log_level IN ('debug', 'info', 'warn', 'error', 'critical')),
    log_category TEXT NOT NULL
        CHECK (log_category IN ('performance', 'security', 'business', 'integration', 'maintenance', 'other')),

    -- Context
    service TEXT,
    function_name TEXT,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Log content
    message TEXT NOT NULL,
    details JSONB,
    stack_trace TEXT,

    -- Request context
    request_id TEXT,
    ip_address INET,
    user_agent TEXT,

    -- Performance (if applicable)
    duration_ms INTEGER,
    memory_mb INTEGER,

    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_syslogs_level ON system_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_syslogs_category ON system_logs(log_category);
CREATE INDEX IF NOT EXISTS idx_syslogs_timestamp ON system_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_syslogs_restaurant ON system_logs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_syslogs_service ON system_logs(service);

COMMENT ON TABLE system_logs IS 'System-wide logging for debugging and monitoring';

-- =====================================================
-- 18. ERROR LOGS - Detaljerede fejl logs
-- =====================================================
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Error identification
    error_type TEXT NOT NULL
        CHECK (error_type IN ('javascript', 'api', 'database', 'integration', 'validation', 'auth', 'other')),
    error_code TEXT,
    error_message TEXT NOT NULL,
    error_hash TEXT,

    -- Context
    service TEXT,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Stack trace
    stack_trace TEXT,

    -- Request context
    request_url TEXT,
    request_method TEXT,
    request_body_hash TEXT,

    -- Browser context (for JS errors)
    browser TEXT,
    os TEXT,
    screen_resolution TEXT,

    -- Occurrence tracking
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    occurrence_count INTEGER DEFAULT 1,

    -- Resolution
    status TEXT DEFAULT 'new'
        CHECK (status IN ('new', 'investigating', 'resolved', 'ignored', 'wont_fix')),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolution_notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_errorlogs_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_errorlogs_status ON error_logs(status);
CREATE INDEX IF NOT EXISTS idx_errorlogs_restaurant ON error_logs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_errorlogs_lastseen ON error_logs(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_errorlogs_hash ON error_logs(error_hash);

COMMENT ON TABLE error_logs IS 'Detailed error tracking for debugging';

-- =====================================================
-- 19. BENCHMARK AGGREGATES - Anonymiseret industri benchmark
-- =====================================================
CREATE TABLE IF NOT EXISTS benchmark_aggregates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Aggregation period
    period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Segment
    industry_segment TEXT,
    size_segment TEXT CHECK (size_segment IN ('small', 'medium', 'large')),
    region TEXT,

    -- Sample size (minimum 5 for anonymity)
    restaurant_count INTEGER NOT NULL CHECK (restaurant_count >= 5),

    -- Revenue benchmarks (i øre)
    avg_daily_revenue INTEGER,
    median_daily_revenue INTEGER,
    p25_daily_revenue INTEGER,
    p75_daily_revenue INTEGER,

    -- Order benchmarks
    avg_order_value INTEGER,
    avg_orders_per_day DECIMAL(6,2),

    -- Channel distribution (percentages)
    pct_orders_web DECIMAL(5,2),
    pct_orders_app DECIMAL(5,2),
    pct_orders_social DECIMAL(5,2),
    pct_orders_delivery_platforms DECIMAL(5,2),

    -- Engagement benchmarks
    avg_conversion_rate DECIMAL(5,4),
    avg_return_customer_rate DECIMAL(5,4),

    -- AI benchmarks
    avg_ai_adoption_rate DECIMAL(5,4),
    avg_ai_conversion_rate DECIMAL(5,4),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_benchmark_period ON benchmark_aggregates(period_type, period_start);
CREATE INDEX IF NOT EXISTS idx_benchmark_segment ON benchmark_aggregates(industry_segment, size_segment);

COMMENT ON TABLE benchmark_aggregates IS 'Anonymized industry benchmarks for comparison';

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_attribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_aggregates ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Order Items: Access via order ownership
CREATE POLICY order_items_select ON order_items FOR SELECT
USING (
    order_id IN (
        SELECT o.id FROM orders o
        WHERE o.restaurant_id IN (
            SELECT r.id FROM restaurants r WHERE r.user_id = auth.uid()
        )
        OR o.user_id = auth.uid()
    )
);

CREATE POLICY order_items_insert ON order_items FOR INSERT
WITH CHECK (
    order_id IN (
        SELECT o.id FROM orders o
        WHERE o.restaurant_id IN (
            SELECT r.id FROM restaurants r WHERE r.user_id = auth.uid()
        )
        OR o.user_id = auth.uid()
    )
);

-- Payments: Restaurant owner access
CREATE POLICY payments_select ON payments FOR SELECT
USING (
    restaurant_id IN (
        SELECT r.id FROM restaurants r WHERE r.user_id = auth.uid()
    )
);

CREATE POLICY payments_insert ON payments FOR INSERT
WITH CHECK (
    restaurant_id IN (
        SELECT r.id FROM restaurants r WHERE r.user_id = auth.uid()
    )
);

-- User Consents: Own consent only
CREATE POLICY user_consents_select ON user_consents FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY user_consents_insert ON user_consents FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY user_consents_update ON user_consents FOR UPDATE
USING (user_id = auth.uid());

-- Sessions: Restaurant owner + anonymous insert for tracking
CREATE POLICY sessions_select ON sessions FOR SELECT
USING (
    restaurant_id IN (
        SELECT r.id FROM restaurants r WHERE r.user_id = auth.uid()
    )
);

CREATE POLICY sessions_insert ON sessions FOR INSERT
WITH CHECK (true);  -- Allow anonymous session creation

-- Events: Restaurant owner + anonymous insert
CREATE POLICY events_select ON events FOR SELECT
USING (
    restaurant_id IN (
        SELECT r.id FROM restaurants r WHERE r.user_id = auth.uid()
    )
);

CREATE POLICY events_insert ON events FOR INSERT
WITH CHECK (true);  -- Allow anonymous event tracking

-- Page Views: Same as events
CREATE POLICY page_views_select ON page_views FOR SELECT
USING (
    restaurant_id IN (
        SELECT r.id FROM restaurants r WHERE r.user_id = auth.uid()
    )
);

CREATE POLICY page_views_insert ON page_views FOR INSERT
WITH CHECK (true);

-- AI Conversations: Restaurant owner
CREATE POLICY ai_conversations_all ON ai_conversations FOR ALL
USING (
    restaurant_id IN (
        SELECT r.id FROM restaurants r WHERE r.user_id = auth.uid()
    )
);

-- AI Messages: Via conversation
CREATE POLICY ai_messages_select ON ai_messages FOR SELECT
USING (
    conversation_id IN (
        SELECT c.conversation_id FROM ai_conversations c
        WHERE c.restaurant_id IN (
            SELECT r.id FROM restaurants r WHERE r.user_id = auth.uid()
        )
    )
);

CREATE POLICY ai_messages_insert ON ai_messages FOR INSERT
WITH CHECK (true);  -- AI agent needs to insert

-- AI Intents: Public read, admin write
CREATE POLICY ai_intents_select ON ai_intents FOR SELECT
USING (true);

-- AI Feedback: Restaurant owner
CREATE POLICY ai_feedback_all ON ai_feedback FOR ALL
USING (
    conversation_id IN (
        SELECT c.conversation_id FROM ai_conversations c
        WHERE c.restaurant_id IN (
            SELECT r.id FROM restaurants r WHERE r.user_id = auth.uid()
        )
    )
);

-- Daily Metrics: Restaurant owner
CREATE POLICY daily_metrics_all ON daily_metrics FOR ALL
USING (
    restaurant_id IN (
        SELECT r.id FROM restaurants r WHERE r.user_id = auth.uid()
    )
);

-- Product Analytics: Restaurant owner
CREATE POLICY product_analytics_all ON product_analytics FOR ALL
USING (
    restaurant_id IN (
        SELECT r.id FROM restaurants r WHERE r.user_id = auth.uid()
    )
);

-- Channel Attribution: Restaurant owner
CREATE POLICY channel_attribution_all ON channel_attribution FOR ALL
USING (
    restaurant_id IN (
        SELECT r.id FROM restaurants r WHERE r.user_id = auth.uid()
    )
);

-- Webhook Logs: Restaurant owner + system insert
CREATE POLICY webhook_logs_select ON webhook_logs FOR SELECT
USING (
    restaurant_id IN (
        SELECT r.id FROM restaurants r WHERE r.user_id = auth.uid()
    )
);

CREATE POLICY webhook_logs_insert ON webhook_logs FOR INSERT
WITH CHECK (true);  -- System needs to log

-- Integration Configs: Restaurant owner
CREATE POLICY integration_configs_all ON integration_configs FOR ALL
USING (
    restaurant_id IN (
        SELECT r.id FROM restaurants r WHERE r.user_id = auth.uid()
    )
);

-- API Logs: Restaurant owner
CREATE POLICY api_logs_select ON api_logs FOR SELECT
USING (
    restaurant_id IN (
        SELECT r.id FROM restaurants r WHERE r.user_id = auth.uid()
    )
);

CREATE POLICY api_logs_insert ON api_logs FOR INSERT
WITH CHECK (true);

-- System Logs: Insert only (admin read via service role)
CREATE POLICY system_logs_insert ON system_logs FOR INSERT
WITH CHECK (true);

-- Error Logs: Insert only
CREATE POLICY error_logs_insert ON error_logs FOR INSERT
WITH CHECK (true);

-- Benchmark Aggregates: Public read
CREATE POLICY benchmark_aggregates_select ON benchmark_aggregates FOR SELECT
USING (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to aggregate daily metrics
CREATE OR REPLACE FUNCTION aggregate_daily_metrics(p_restaurant_id UUID, p_date DATE)
RETURNS void AS $$
DECLARE
    v_metrics RECORD;
BEGIN
    -- Calculate metrics from orders
    SELECT
        COALESCE(SUM(total), 0) as total_revenue,
        COUNT(*) as total_orders,
        COALESCE(AVG(total), 0) as avg_order_value,
        COUNT(*) FILTER (WHERE metadata->>'fulfillment_type' = 'delivery') as orders_delivery,
        COUNT(*) FILTER (WHERE metadata->>'fulfillment_type' = 'pickup') as orders_pickup,
        COUNT(*) FILTER (WHERE metadata->>'fulfillment_type' = 'dine_in') as orders_dine_in
    INTO v_metrics
    FROM orders
    WHERE restaurant_id = p_restaurant_id
    AND DATE(created_at) = p_date;

    -- Upsert daily metrics
    INSERT INTO daily_metrics (
        restaurant_id, date, total_revenue, total_orders, avg_order_value,
        orders_delivery, orders_pickup, orders_dine_in
    ) VALUES (
        p_restaurant_id, p_date, v_metrics.total_revenue, v_metrics.total_orders,
        v_metrics.avg_order_value, v_metrics.orders_delivery, v_metrics.orders_pickup,
        v_metrics.orders_dine_in
    )
    ON CONFLICT (restaurant_id, date) DO UPDATE SET
        total_revenue = EXCLUDED.total_revenue,
        total_orders = EXCLUDED.total_orders,
        avg_order_value = EXCLUDED.avg_order_value,
        orders_delivery = EXCLUDED.orders_delivery,
        orders_pickup = EXCLUDED.orders_pickup,
        orders_dine_in = EXCLUDED.orders_dine_in,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log system event
CREATE OR REPLACE FUNCTION log_system_event(
    p_level TEXT,
    p_category TEXT,
    p_message TEXT,
    p_details JSONB DEFAULT NULL,
    p_service TEXT DEFAULT NULL,
    p_restaurant_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO system_logs (log_level, log_category, message, details, service, restaurant_id)
    VALUES (p_level, p_category, p_message, p_details, p_service, p_restaurant_id)
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check marketing consent
CREATE OR REPLACE FUNCTION check_marketing_consent(p_user_id UUID, p_consent_type TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_consents
        WHERE user_id = p_user_id
        AND consent_type = p_consent_type
        AND granted = true
        AND withdrawn_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record consent
CREATE OR REPLACE FUNCTION record_consent(
    p_user_id UUID,
    p_consent_type TEXT,
    p_granted BOOLEAN,
    p_consent_version TEXT DEFAULT NULL,
    p_collection_method TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_consent_id UUID;
BEGIN
    -- Withdraw existing if revoking
    IF NOT p_granted THEN
        UPDATE user_consents
        SET granted = false, withdrawn_at = NOW(), updated_at = NOW()
        WHERE user_id = p_user_id
        AND consent_type = p_consent_type
        AND granted = true
        RETURNING id INTO v_consent_id;

        IF v_consent_id IS NOT NULL THEN
            RETURN v_consent_id;
        END IF;
    END IF;

    -- Insert new consent
    INSERT INTO user_consents (
        user_id, consent_type, granted, consent_version,
        collection_method, granted_at
    ) VALUES (
        p_user_id, p_consent_type, p_granted, p_consent_version,
        p_collection_method, CASE WHEN p_granted THEN NOW() ELSE NULL END
    )
    RETURNING id INTO v_consent_id;

    RETURN v_consent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_updated_at BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_consents_updated_at BEFORE UPDATE ON user_consents
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER ai_conversations_updated_at BEFORE UPDATE ON ai_conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER daily_metrics_updated_at BEFORE UPDATE ON daily_metrics
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER integration_configs_updated_at BEFORE UPDATE ON integration_configs
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER ai_intents_updated_at BEFORE UPDATE ON ai_intents
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- COMPLETE
-- =====================================================

COMMIT;

-- Log migration completion
SELECT log_system_event(
    'info',
    'maintenance',
    'Data Strategy Phase 1 migration completed',
    jsonb_build_object(
        'tables_created', 19,
        'version', '1.0',
        'migration_date', CURRENT_DATE
    ),
    'migration'
);
