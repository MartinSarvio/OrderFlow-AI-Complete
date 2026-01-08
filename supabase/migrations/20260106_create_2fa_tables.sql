-- Migration: Create 2FA tables for OTP authentication
-- Created: 2026-01-06

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: user_2fa_settings
-- Stores 2FA configuration for each user
-- =====================================================
CREATE TABLE IF NOT EXISTS user_2fa_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- TOTP (Authenticator App) settings
  totp_enabled BOOLEAN DEFAULT false,
  totp_secret TEXT,  -- Encrypted secret for TOTP generation
  totp_confirmed BOOLEAN DEFAULT false,  -- True after first successful verification

  -- Email OTP settings
  email_otp_enabled BOOLEAN DEFAULT false,

  -- Backup codes (hashed)
  backup_codes TEXT[],  -- Array of hashed backup codes
  backup_codes_remaining INT DEFAULT 10,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,

  -- Ensure one record per user
  UNIQUE(user_id)
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_user_2fa_settings_user_id ON user_2fa_settings(user_id);

-- =====================================================
-- Table: otp_attempts
-- Tracks OTP generation and verification attempts for rate limiting
-- =====================================================
CREATE TABLE IF NOT EXISTS otp_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,

  -- OTP details
  otp_type TEXT NOT NULL CHECK (otp_type IN ('totp', 'email', 'backup')),
  otp_hash TEXT,  -- Hashed OTP code (for email OTP)

  -- Rate limiting
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 5,
  locked_until TIMESTAMP WITH TIME ZONE,

  -- Expiration
  expires_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Only keep recent attempts
  CONSTRAINT valid_otp_type CHECK (otp_type IN ('totp', 'email', 'backup'))
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_otp_attempts_user_id ON otp_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_attempts_email ON otp_attempts(email);
CREATE INDEX IF NOT EXISTS idx_otp_attempts_created_at ON otp_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_otp_attempts_expires_at ON otp_attempts(expires_at);

-- =====================================================
-- Table: user_roles
-- Explicit role assignments for 2FA enforcement
-- =====================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee', 'customer', 'demo')),
  requires_2fa BOOLEAN DEFAULT true,  -- Whether this user must have 2FA enabled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- =====================================================
-- Function: Update timestamp on modification
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to user_2fa_settings
DROP TRIGGER IF EXISTS update_user_2fa_settings_updated_at ON user_2fa_settings;
CREATE TRIGGER update_user_2fa_settings_updated_at
  BEFORE UPDATE ON user_2fa_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to user_roles
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Function: Cleanup expired OTP attempts
-- Run periodically to keep table size manageable
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_expired_otp_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_attempts
  WHERE expires_at < NOW() - INTERVAL '24 hours'
     OR created_at < NOW() - INTERVAL '7 days';
END;
$$ language 'plpgsql';

-- =====================================================
-- RLS Policies
-- =====================================================

-- Enable RLS on tables
ALTER TABLE user_2fa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- user_2fa_settings: Users can only see/modify their own settings
CREATE POLICY "Users can view own 2FA settings" ON user_2fa_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own 2FA settings" ON user_2fa_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own 2FA settings" ON user_2fa_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- otp_attempts: Users can only see their own attempts
CREATE POLICY "Users can view own OTP attempts" ON otp_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own OTP attempts" ON otp_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own OTP attempts" ON otp_attempts
  FOR UPDATE USING (auth.uid() = user_id);

-- user_roles: Users can view their own role, admins can modify
CREATE POLICY "Users can view own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Service role bypass for all tables (for Edge Functions)
CREATE POLICY "Service role full access 2fa" ON user_2fa_settings
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access otp" ON otp_attempts
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access roles" ON user_roles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- Initial data: Set default roles for employees to require 2FA
-- =====================================================
COMMENT ON TABLE user_2fa_settings IS 'Stores 2FA configuration per user (TOTP, Email OTP, backup codes)';
COMMENT ON TABLE otp_attempts IS 'Tracks OTP attempts for rate limiting and security';
COMMENT ON TABLE user_roles IS 'User role assignments with 2FA enforcement flags';
