-- Custom Domains Migration
-- Sprint 3: Custom domain support for tenant sites
-- Created: 2026-02-06

-- ============================================
-- DOMAIN MAPPINGS
-- ============================================
CREATE TABLE IF NOT EXISTS domain_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  site_id UUID REFERENCES tenant_sites(id) ON DELETE CASCADE,

  -- Domain info
  hostname VARCHAR(255) NOT NULL, -- bestil.kunde.dk
  domain_type VARCHAR(20) DEFAULT 'cname', -- cname, a_record, subdomain

  -- DNS configuration
  dns_target VARCHAR(255) DEFAULT 'cname.orderflow.dk',
  validation_method VARCHAR(20) DEFAULT 'cname', -- cname, txt, http

  -- Validation
  validation_token TEXT,
  validation_record VARCHAR(255), -- _acme-challenge.bestil.kunde.dk
  validation_value TEXT,

  -- Status
  status VARCHAR(30) DEFAULT 'pending_dns',
  -- pending_dns → pending_validation → pending_cert → active → error
  error_message TEXT,

  -- SSL Certificate
  ssl_provider VARCHAR(30) DEFAULT 'vercel', -- vercel, cloudflare, letsencrypt
  ssl_cert_id VARCHAR(100),
  ssl_expires_at TIMESTAMPTZ,

  -- Verification
  dns_verified_at TIMESTAMPTZ,
  ssl_issued_at TIMESTAMPTZ,
  last_check_at TIMESTAMPTZ,
  check_count INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(hostname)
);

CREATE INDEX IF NOT EXISTS idx_domain_mappings_tenant ON domain_mappings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_domain_mappings_hostname ON domain_mappings(hostname);
CREATE INDEX IF NOT EXISTS idx_domain_mappings_status ON domain_mappings(status);
CREATE INDEX IF NOT EXISTS idx_domain_mappings_pending ON domain_mappings(status) WHERE status IN ('pending_dns', 'pending_validation', 'pending_cert');

-- ============================================
-- DOMAIN VERIFICATION LOG
-- ============================================
CREATE TABLE IF NOT EXISTS domain_verification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domain_mappings(id) ON DELETE CASCADE,
  check_type VARCHAR(30) NOT NULL, -- dns_cname, dns_txt, ssl_cert
  status VARCHAR(20) NOT NULL, -- success, failure, pending
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_domain_log_domain ON domain_verification_log(domain_id, created_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE domain_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_verification_log ENABLE ROW LEVEL SECURITY;

-- Users can manage their own domains
CREATE POLICY "Users can view own domains" ON domain_mappings
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own domains" ON domain_mappings
  FOR ALL USING (
    tenant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
  );

-- Verification log
CREATE POLICY "Users can view own domain logs" ON domain_verification_log
  FOR SELECT USING (
    domain_id IN (
      SELECT id FROM domain_mappings
      WHERE tenant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Generate validation token
CREATE OR REPLACE FUNCTION generate_domain_validation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN 'orderflow-verify-' || encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Create domain mapping with validation
CREATE OR REPLACE FUNCTION create_domain_mapping(
  p_tenant_id UUID,
  p_hostname VARCHAR,
  p_site_id UUID DEFAULT NULL
)
RETURNS TABLE (
  domain_id UUID,
  validation_record VARCHAR,
  validation_value TEXT,
  cname_target VARCHAR
) AS $$
DECLARE
  v_domain_id UUID;
  v_token TEXT;
  v_validation_record VARCHAR;
BEGIN
  -- Generate validation token
  v_token := generate_domain_validation_token();

  -- Create validation record name
  v_validation_record := '_acme-challenge.' || split_part(p_hostname, '.', 1);

  -- Insert domain mapping
  INSERT INTO domain_mappings (
    tenant_id,
    site_id,
    hostname,
    validation_token,
    validation_record,
    validation_value,
    status
  ) VALUES (
    p_tenant_id,
    p_site_id,
    p_hostname,
    v_token,
    v_validation_record,
    v_token,
    'pending_dns'
  )
  RETURNING id INTO v_domain_id;

  RETURN QUERY SELECT
    v_domain_id as domain_id,
    v_validation_record as validation_record,
    v_token as validation_value,
    'cname.orderflow.dk'::VARCHAR as cname_target;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update domain status
CREATE OR REPLACE FUNCTION update_domain_status(
  p_domain_id UUID,
  p_status VARCHAR,
  p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE domain_mappings SET
    status = p_status,
    error_message = p_error_message,
    last_check_at = NOW(),
    check_count = check_count + 1,
    updated_at = NOW(),
    dns_verified_at = CASE WHEN p_status = 'pending_cert' THEN NOW() ELSE dns_verified_at END,
    ssl_issued_at = CASE WHEN p_status = 'active' THEN NOW() ELSE ssl_issued_at END
  WHERE id = p_domain_id;

  -- Log the check
  INSERT INTO domain_verification_log (domain_id, check_type, status, details)
  VALUES (p_domain_id, 'status_update', p_status, jsonb_build_object('error', p_error_message));

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get domain by hostname (for routing)
CREATE OR REPLACE FUNCTION get_domain_by_hostname(p_hostname VARCHAR)
RETURNS TABLE (
  domain_id UUID,
  tenant_id UUID,
  site_id UUID,
  status VARCHAR,
  ssl_valid BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dm.id as domain_id,
    dm.tenant_id,
    dm.site_id,
    dm.status,
    (dm.ssl_expires_at IS NULL OR dm.ssl_expires_at > NOW()) as ssl_valid
  FROM domain_mappings dm
  WHERE dm.hostname = p_hostname
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get pending domains for verification (cron job)
CREATE OR REPLACE FUNCTION get_pending_domains(p_limit INT DEFAULT 50)
RETURNS TABLE (
  domain_id UUID,
  tenant_id UUID,
  hostname VARCHAR,
  status VARCHAR,
  validation_record VARCHAR,
  validation_value TEXT,
  check_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dm.id as domain_id,
    dm.tenant_id,
    dm.hostname,
    dm.status,
    dm.validation_record,
    dm.validation_value,
    dm.check_count
  FROM domain_mappings dm
  WHERE dm.status IN ('pending_dns', 'pending_validation', 'pending_cert')
    AND (dm.last_check_at IS NULL OR dm.last_check_at < NOW() - INTERVAL '5 minutes')
  ORDER BY dm.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_domain_mappings_updated_at
  BEFORE UPDATE ON domain_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE domain_mappings IS 'Custom domain configuration for tenant sites';
COMMENT ON TABLE domain_verification_log IS 'Audit log of domain verification attempts';
COMMENT ON FUNCTION create_domain_mapping IS 'Creates domain mapping with auto-generated validation token';
COMMENT ON FUNCTION update_domain_status IS 'Updates domain status and logs the change';
COMMENT ON FUNCTION get_domain_by_hostname IS 'Resolves hostname to tenant for routing';
COMMENT ON FUNCTION get_pending_domains IS 'Returns domains needing verification (for cron)';
