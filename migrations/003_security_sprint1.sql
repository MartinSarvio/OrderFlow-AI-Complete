-- =====================================================
-- FLOW Security Sprint 1 Migration
-- v4.12.0 - 2026-02-12
-- Creates: api_credentials, error_logs tables with RLS
-- =====================================================

-- =====================================================
-- FIX #3: api_credentials table
-- Stores API keys server-side instead of localStorage
-- Per-user, with RLS so users can only access their own keys
-- =====================================================

CREATE TABLE IF NOT EXISTS public.api_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_name TEXT NOT NULL,
  key_value TEXT NOT NULL, -- In production, use pgcrypto for encryption
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, key_name)
);

-- Enable RLS
ALTER TABLE public.api_credentials ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own credentials
CREATE POLICY "Users can view own credentials" ON public.api_credentials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credentials" ON public.api_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials" ON public.api_credentials
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own credentials" ON public.api_credentials
  FOR DELETE USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_api_credentials_user_key 
  ON public.api_credentials(user_id, key_name);

-- =====================================================
-- FIX #4: error_logs table
-- Server-side error logging for monitoring
-- =====================================================

CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type TEXT NOT NULL DEFAULT 'runtime',
  message TEXT,
  stack TEXT,
  url TEXT,
  user_agent TEXT,
  source TEXT,
  line INTEGER,
  "column" INTEGER,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can insert error logs
CREATE POLICY "Authenticated users can insert error logs" ON public.error_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only admins/service role can read error logs (for privacy)
CREATE POLICY "Service role can read error logs" ON public.error_logs
  FOR SELECT USING (auth.role() = 'service_role');

-- Auto-cleanup old logs (optional: create a cron job)
-- DELETE FROM public.error_logs WHERE timestamp < NOW() - INTERVAL '30 days';

-- Index for timestamp-based queries
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp 
  ON public.error_logs(timestamp DESC);

-- Grant permissions
GRANT INSERT ON public.error_logs TO authenticated;
GRANT ALL ON public.api_credentials TO authenticated;
