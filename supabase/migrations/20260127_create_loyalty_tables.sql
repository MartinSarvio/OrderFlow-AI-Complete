-- Loyalty Program Tables for OrderFlow
-- Migration: 20260127_create_loyalty_tables.sql

-- Loyalty Points - Kundens akkumulerede points
CREATE TABLE IF NOT EXISTS loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  points INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  birthday DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, customer_phone)
);

-- Loyalty Transactions - Historik over points-ændringer
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loyalty_id UUID REFERENCES loyalty_points(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'expire', 'bonus', 'adjustment')),
  points INTEGER NOT NULL,
  description TEXT,
  order_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loyalty Rewards - Belønninger der kan indløses
CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('discount_percent', 'discount_amount', 'free_item', 'free_delivery')),
  reward_value DECIMAL,
  product_id UUID, -- Hvis reward_type er 'free_item'
  max_redemptions INTEGER, -- NULL = unlimited
  current_redemptions INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loyalty Settings - Restaurant-specifik konfiguration
CREATE TABLE IF NOT EXISTS loyalty_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE UNIQUE,
  enabled BOOLEAN DEFAULT true,
  points_per_kr DECIMAL DEFAULT 1, -- Points pr. krone brugt
  min_order_for_points DECIMAL DEFAULT 50, -- Minimum ordrebeløb for at optjene points
  welcome_bonus INTEGER DEFAULT 50, -- Points ved første ordre
  birthday_bonus INTEGER DEFAULT 100, -- Bonus points på fødselsdag
  tier_bronze_min INTEGER DEFAULT 0,
  tier_silver_min INTEGER DEFAULT 500,
  tier_gold_min INTEGER DEFAULT 1500,
  tier_platinum_min INTEGER DEFAULT 5000,
  silver_multiplier DECIMAL DEFAULT 1.25, -- 25% ekstra points
  gold_multiplier DECIMAL DEFAULT 1.5, -- 50% ekstra points
  platinum_multiplier DECIMAL DEFAULT 2.0, -- 100% ekstra points
  points_expiry_days INTEGER, -- NULL = aldrig
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketing Campaigns
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('sms', 'email')),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'birthday', 'inactive', 'loyalty_tier', 'first_order', 'scheduled')),
  trigger_days INTEGER, -- Dage siden sidste ordre (for inactive)
  trigger_tier TEXT, -- For loyalty_tier trigger
  schedule_cron TEXT, -- For scheduled campaigns
  message_template TEXT NOT NULL,
  audience_filter JSONB DEFAULT '{}', -- {"min_orders": 3, "tier": "gold", "segment": "vip"}
  active BOOLEAN DEFAULT true,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  total_sent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Sends - Log over sendte beskeder
CREATE TABLE IF NOT EXISTS campaign_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  message_content TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'clicked')),
  error_message TEXT,
  cost DECIMAL
);

-- Customer Segments - Foruddefinerede kundesegmenter
CREATE TABLE IF NOT EXISTS customer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  segment_type TEXT NOT NULL CHECK (segment_type IN ('vip', 'new', 'inactive', 'high_value', 'at_risk', 'loyal', 'custom')),
  filter_rules JSONB NOT NULL, -- {"min_orders": 10, "days_inactive": 30, "min_spent": 5000}
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'users',
  auto_update BOOLEAN DEFAULT true,
  customer_count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_loyalty_points_phone ON loyalty_points(customer_phone);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_restaurant ON loyalty_points(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_tier ON loyalty_points(tier);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_loyalty ON loyalty_transactions(loyalty_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created ON loyalty_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_campaign ON campaign_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_phone ON campaign_sends(customer_phone);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_status ON campaign_sends(status);

-- Enable RLS
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic - tillad authenticated users)
CREATE POLICY "Allow authenticated access to loyalty_points" ON loyalty_points FOR ALL USING (true);
CREATE POLICY "Allow authenticated access to loyalty_transactions" ON loyalty_transactions FOR ALL USING (true);
CREATE POLICY "Allow authenticated access to loyalty_rewards" ON loyalty_rewards FOR ALL USING (true);
CREATE POLICY "Allow authenticated access to loyalty_settings" ON loyalty_settings FOR ALL USING (true);
CREATE POLICY "Allow authenticated access to marketing_campaigns" ON marketing_campaigns FOR ALL USING (true);
CREATE POLICY "Allow authenticated access to campaign_sends" ON campaign_sends FOR ALL USING (true);
CREATE POLICY "Allow authenticated access to customer_segments" ON customer_segments FOR ALL USING (true);

-- Insert default segments for new restaurants
CREATE OR REPLACE FUNCTION create_default_segments()
RETURNS TRIGGER AS $$
BEGIN
  -- VIP Kunder
  INSERT INTO customer_segments (restaurant_id, name, description, segment_type, filter_rules, color, icon)
  VALUES (NEW.id, 'VIP Kunder', 'Kunder med mere end 10 ordrer', 'vip', '{"min_orders": 10}', '#f59e0b', 'crown');

  -- Nye Kunder
  INSERT INTO customer_segments (restaurant_id, name, description, segment_type, filter_rules, color, icon)
  VALUES (NEW.id, 'Nye Kunder', 'Kunder med kun 1 ordre', 'new', '{"max_orders": 1, "days_since_first": 30}', '#10b981', 'user-plus');

  -- Inaktive Kunder
  INSERT INTO customer_segments (restaurant_id, name, description, segment_type, filter_rules, color, icon)
  VALUES (NEW.id, 'Inaktive Kunder', 'Ingen ordre i 30+ dage', 'inactive', '{"days_inactive": 30}', '#ef4444', 'user-minus');

  -- Højværdi Kunder
  INSERT INTO customer_segments (restaurant_id, name, description, segment_type, filter_rules, color, icon)
  VALUES (NEW.id, 'Højværdi Kunder', 'Gennemsnitlig ordre over 300 kr', 'high_value', '{"min_avg_order": 300}', '#8b5cf6', 'trending-up');

  -- At Risk (på vej til inaktiv)
  INSERT INTO customer_segments (restaurant_id, name, description, segment_type, filter_rules, color, icon)
  VALUES (NEW.id, 'At Risk', 'Aktive kunder uden ordre i 14-30 dage', 'at_risk', '{"days_inactive_min": 14, "days_inactive_max": 30, "min_orders": 2}', '#f97316', 'alert-triangle');

  -- Loyale Kunder
  INSERT INTO customer_segments (restaurant_id, name, description, segment_type, filter_rules, color, icon)
  VALUES (NEW.id, 'Loyale Kunder', 'Gold eller Platinum loyalty tier', 'loyal', '{"tier": ["gold", "platinum"]}', '#eab308', 'heart');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default segments (optional - run manually for existing restaurants)
-- CREATE TRIGGER create_segments_on_restaurant_insert
-- AFTER INSERT ON restaurants
-- FOR EACH ROW EXECUTE FUNCTION create_default_segments();
