-- Migration 004: Sprint 3 — Builder Configs, Integration Connections
-- Date: 2026-02-13
-- Description: Persistent storage for App/Web Builder configs and integration connection tracking

-- ============================================================
-- 1. builder_configs — App Builder + Web Builder persistent storage
-- ============================================================
CREATE TABLE IF NOT EXISTS builder_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  builder_type TEXT NOT NULL CHECK (builder_type IN ('app_builder', 'web_builder', 'cms')),
  config_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint: one config per user + restaurant + builder type
CREATE UNIQUE INDEX IF NOT EXISTS idx_builder_configs_unique
  ON builder_configs (user_id, COALESCE(restaurant_id, '00000000-0000-0000-0000-000000000000'::uuid), builder_type);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_builder_configs_user ON builder_configs (user_id);
CREATE INDEX IF NOT EXISTS idx_builder_configs_type ON builder_configs (builder_type);

-- RLS
ALTER TABLE builder_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own builder configs"
  ON builder_configs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own builder configs"
  ON builder_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own builder configs"
  ON builder_configs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own builder configs"
  ON builder_configs FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_builder_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_builder_configs_updated_at
  BEFORE UPDATE ON builder_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_builder_configs_updated_at();

-- ============================================================
-- 2. integration_connections — Track external system connections
-- ============================================================
CREATE TABLE IF NOT EXISTS integration_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  system TEXT NOT NULL,  -- 'economic', 'dinero', 'billy', 'visma', 'stripe', etc.
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'syncing')),
  last_sync TIMESTAMPTZ,
  last_sync_status TEXT,  -- 'success', 'partial', 'failed'
  last_sync_records INTEGER DEFAULT 0,
  config JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- One connection per user + restaurant + system
CREATE UNIQUE INDEX IF NOT EXISTS idx_integration_connections_unique
  ON integration_connections (user_id, COALESCE(restaurant_id, '00000000-0000-0000-0000-000000000000'::uuid), system);

CREATE INDEX IF NOT EXISTS idx_integration_connections_user ON integration_connections (user_id);
CREATE INDEX IF NOT EXISTS idx_integration_connections_system ON integration_connections (system);

-- RLS
ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own integration connections"
  ON integration_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integration connections"
  ON integration_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integration connections"
  ON integration_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integration connections"
  ON integration_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER trg_integration_connections_updated_at
  BEFORE UPDATE ON integration_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_builder_configs_updated_at();

-- ============================================================
-- 3. sms_send_log — Track SMS sends for audit and status display
-- ============================================================
CREATE TABLE IF NOT EXISTS sms_send_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  phone_to TEXT NOT NULL,
  message_text TEXT NOT NULL,
  sender TEXT,
  provider TEXT DEFAULT 'inmobile',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  provider_message_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sms_send_log_user ON sms_send_log (user_id);
CREATE INDEX IF NOT EXISTS idx_sms_send_log_created ON sms_send_log (created_at DESC);

-- RLS
ALTER TABLE sms_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sms logs"
  ON sms_send_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sms logs"
  ON sms_send_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);
