-- Social Integrations: Store Meta OAuth tokens per restaurant
-- Used by callback.js and webhook handler to resolve tokens

-- Social integration tokens table
CREATE TABLE IF NOT EXISTS social_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL, -- 'facebook' or 'instagram'
  platform_id VARCHAR(100), -- Page ID or Instagram Business Account ID
  page_id VARCHAR(100) NOT NULL,
  page_name VARCHAR(255),
  access_token TEXT NOT NULL, -- Page Access Token (long-lived)
  user_access_token TEXT, -- User Access Token (for token refresh)
  status VARCHAR(20) DEFAULT 'connected', -- connected, disconnected, expired
  connected_at TIMESTAMPTZ DEFAULT now(),
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_social_integrations_tenant ON social_integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_social_integrations_page ON social_integrations(page_id);
CREATE INDEX IF NOT EXISTS idx_social_integrations_platform_id ON social_integrations(platform_id);

-- Add facebook_page_id and instagram_account_id to restaurants if not present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'facebook_page_id') THEN
    ALTER TABLE restaurants ADD COLUMN facebook_page_id VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'instagram_account_id') THEN
    ALTER TABLE restaurants ADD COLUMN instagram_account_id VARCHAR(100);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_restaurants_fb_page ON restaurants(facebook_page_id) WHERE facebook_page_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_restaurants_ig_account ON restaurants(instagram_account_id) WHERE instagram_account_id IS NOT NULL;

-- RLS policies
ALTER TABLE social_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own social integrations"
  ON social_integrations FOR SELECT
  USING (tenant_id IN (
    SELECT id FROM restaurants WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can manage own social integrations"
  ON social_integrations FOR ALL
  USING (tenant_id IN (
    SELECT id FROM restaurants WHERE owner_id = auth.uid()
  ));
