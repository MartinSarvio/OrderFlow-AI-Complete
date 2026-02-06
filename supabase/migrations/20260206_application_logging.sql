-- ============================================================
-- OrderFlow Application Logging System
-- Version: v137
-- Created: 2026-02-06
--
-- Tables:
--   - application_logs: Structured application logs (hot storage)
--   - audit_trail: Immutable audit log for GDPR compliance
--   - log_retention_config: Per-level retention policies
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- LOG LEVELS ENUM
-- ============================================================
DO $$ BEGIN
    CREATE TYPE log_level AS ENUM ('TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- APPLICATION_LOGS TABLE
-- Main structured logging table with partitioning prep
-- ============================================================
CREATE TABLE IF NOT EXISTS application_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Core fields (always present)
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level log_level NOT NULL,
    event VARCHAR(100) NOT NULL,  -- e.g., 'order.received', 'channel.sms.send_failed'
    service VARCHAR(50) NOT NULL DEFAULT 'orderflow-api',
    version VARCHAR(20),

    -- Context identifiers
    trace_id UUID,                -- Tracks request across entire pipeline
    restaurant_id VARCHAR(50),    -- Tenant identifier
    user_id UUID REFERENCES auth.users(id),

    -- Event-specific payload (varies per event)
    data JSONB DEFAULT '{}',

    -- System metadata
    meta JSONB DEFAULT '{}',      -- environment, region, node_id, etc.

    -- Indexes will query these frequently
    channel VARCHAR(30),          -- sms, instagram, facebook, web, api
    order_id UUID,
    customer_id UUID,

    -- Timestamps for lifecycle
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ        -- For auto-cleanup based on retention policy
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON application_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_level ON application_logs(level) WHERE level IN ('ERROR', 'FATAL', 'WARN');
CREATE INDEX IF NOT EXISTS idx_logs_event ON application_logs(event);
CREATE INDEX IF NOT EXISTS idx_logs_trace_id ON application_logs(trace_id) WHERE trace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_logs_restaurant ON application_logs(restaurant_id) WHERE restaurant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_logs_channel ON application_logs(channel) WHERE channel IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_logs_order ON application_logs(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_logs_expires ON application_logs(expires_at) WHERE expires_at IS NOT NULL;

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_logs_restaurant_event ON application_logs(restaurant_id, event, timestamp DESC);

-- ============================================================
-- AUDIT_TRAIL TABLE
-- Immutable audit log for GDPR/compliance (append-only)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- When and who
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actor_id UUID REFERENCES auth.users(id),
    actor_type VARCHAR(20) NOT NULL DEFAULT 'user', -- user, system, api, webhook
    actor_ip INET,
    actor_user_agent TEXT,

    -- What happened
    action VARCHAR(100) NOT NULL,  -- e.g., 'data.accessed', 'data.exported', 'consent.updated'
    resource_type VARCHAR(50) NOT NULL,  -- customer, order, restaurant, etc.
    resource_id VARCHAR(100),

    -- Context
    restaurant_id VARCHAR(50),

    -- Details (before/after for changes)
    details JSONB DEFAULT '{}',

    -- Compliance metadata
    data_categories TEXT[],       -- ['contact', 'financial', 'behavioral']
    legal_basis VARCHAR(50),      -- consent, contract, legitimate_interest
    retention_period_days INT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit trail indexes (optimized for compliance queries)
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_trail(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_trail(actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_trail(action);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_trail(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_restaurant ON audit_trail(restaurant_id) WHERE restaurant_id IS NOT NULL;

-- ============================================================
-- LOG_RETENTION_CONFIG TABLE
-- Configurable retention policies per log level
-- ============================================================
CREATE TABLE IF NOT EXISTS log_retention_config (
    level log_level PRIMARY KEY,
    hot_days INT NOT NULL,        -- Days in primary storage (indexed, fast)
    warm_days INT NOT NULL,       -- Days in secondary storage
    cold_days INT,                -- Days in archive (NULL = delete after warm)
    index_fields TEXT[],          -- Fields to keep indexed in warm/cold
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default retention policies
INSERT INTO log_retention_config (level, hot_days, warm_days, cold_days, index_fields, notes) VALUES
    ('FATAL', 30, 90, 365, ARRAY['trace_id', 'restaurant_id', 'event'], 'Full indexing, alerting enabled'),
    ('ERROR', 30, 90, 365, ARRAY['trace_id', 'restaurant_id', 'event'], 'Full indexing, alerting enabled'),
    ('WARN', 14, 60, 180, ARRAY['event', 'restaurant_id'], 'Indexed on event type'),
    ('INFO', 7, 30, 90, ARRAY['event'], 'Business events kept longer'),
    ('DEBUG', 3, 14, NULL, NULL, 'Staging: 7 days, Prod: 3 days'),
    ('TRACE', 1, NULL, NULL, NULL, 'Dev/staging only')
ON CONFLICT (level) DO NOTHING;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to calculate expiry date based on log level
CREATE OR REPLACE FUNCTION calculate_log_expiry()
RETURNS TRIGGER AS $$
DECLARE
    retention_days INT;
BEGIN
    SELECT hot_days INTO retention_days
    FROM log_retention_config
    WHERE level = NEW.level;

    IF retention_days IS NOT NULL THEN
        NEW.expires_at := NEW.timestamp + (retention_days || ' days')::INTERVAL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set expiry on insert
DROP TRIGGER IF EXISTS set_log_expiry ON application_logs;
CREATE TRIGGER set_log_expiry
    BEFORE INSERT ON application_logs
    FOR EACH ROW
    EXECUTE FUNCTION calculate_log_expiry();

-- Function to clean expired logs (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_logs()
RETURNS INT AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM application_logs
    WHERE expires_at IS NOT NULL
      AND expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Log the cleanup itself
    INSERT INTO application_logs (level, event, service, data)
    VALUES ('INFO', 'system.cron.completed', 'orderflow-api',
            jsonb_build_object('job_name', 'cleanup_expired_logs', 'records_processed', deleted_count));

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS
ALTER TABLE application_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
CREATE POLICY "Service role full access to logs" ON application_logs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to audit" ON audit_trail
    FOR ALL USING (auth.role() = 'service_role');

-- Policy: Authenticated users can read their restaurant's logs
CREATE POLICY "Users can read own restaurant logs" ON application_logs
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            restaurant_id IS NULL OR
            restaurant_id IN (
                SELECT restaurant_id::VARCHAR FROM restaurant_users
                WHERE user_id = auth.uid()
            )
        )
    );

-- Policy: Only admins can read audit trail
CREATE POLICY "Admins can read audit trail" ON audit_trail
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM restaurant_users
            WHERE user_id = auth.uid()
              AND role IN ('owner', 'admin')
        )
    );

-- ============================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================

-- Recent errors view (last 24 hours)
CREATE OR REPLACE VIEW recent_errors AS
SELECT
    id,
    timestamp,
    level,
    event,
    restaurant_id,
    trace_id,
    channel,
    data->>'error_reason' as error_reason,
    data
FROM application_logs
WHERE level IN ('ERROR', 'FATAL')
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Order pipeline metrics view
CREATE OR REPLACE VIEW order_pipeline_metrics AS
SELECT
    date_trunc('hour', timestamp) as hour,
    restaurant_id,
    channel,
    COUNT(*) FILTER (WHERE event = 'order.received') as orders_received,
    COUNT(*) FILTER (WHERE event = 'order.confirmed') as orders_confirmed,
    COUNT(*) FILTER (WHERE event = 'order.parse_failed') as parse_failures,
    COUNT(*) FILTER (WHERE event = 'order.payment_failed') as payment_failures,
    AVG((data->>'confidence')::FLOAT) FILTER (WHERE event = 'order.parsed') as avg_confidence,
    AVG((data->>'response_time_ms')::INT) FILTER (WHERE event = 'order.parsed') as avg_parse_time_ms
FROM application_logs
WHERE event LIKE 'order.%'
  AND timestamp > NOW() - INTERVAL '7 days'
GROUP BY date_trunc('hour', timestamp), restaurant_id, channel
ORDER BY hour DESC;

-- Channel health view
CREATE OR REPLACE VIEW channel_health AS
SELECT
    channel,
    COUNT(*) FILTER (WHERE level = 'INFO') as info_count,
    COUNT(*) FILTER (WHERE level = 'WARN') as warn_count,
    COUNT(*) FILTER (WHERE level = 'ERROR') as error_count,
    ROUND(
        COUNT(*) FILTER (WHERE level = 'ERROR')::DECIMAL /
        NULLIF(COUNT(*), 0) * 100, 2
    ) as error_rate_pct
FROM application_logs
WHERE channel IS NOT NULL
  AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY channel;

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================
GRANT SELECT ON recent_errors TO authenticated;
GRANT SELECT ON order_pipeline_metrics TO authenticated;
GRANT SELECT ON channel_health TO authenticated;

COMMENT ON TABLE application_logs IS 'Structured application logs with automatic expiry based on log level';
COMMENT ON TABLE audit_trail IS 'Immutable audit log for GDPR compliance - append only';
COMMENT ON TABLE log_retention_config IS 'Configurable retention policies per log level';
