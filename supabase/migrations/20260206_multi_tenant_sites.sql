-- Multi-Tenant Sites Migration
-- Sprint 1: Website hosting med skabeloner
-- Created: 2026-02-06

-- ============================================
-- TENANT SITES (subdomain mapping)
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  subdomain VARCHAR(63) UNIQUE NOT NULL, -- fx "mario-pizza"
  template_id VARCHAR(50) DEFAULT 'mario', -- roma, mario, etc.
  custom_domain VARCHAR(255), -- bestil.kunde.dk (optional)
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, pending
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast subdomain lookups
CREATE INDEX IF NOT EXISTS idx_tenant_sites_subdomain ON tenant_sites(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenant_sites_custom_domain ON tenant_sites(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenant_sites_tenant ON tenant_sites(tenant_id);

-- ============================================
-- SITE CONFIGS (visual customization)
-- ============================================
CREATE TABLE IF NOT EXISTS site_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

  -- Branding
  logo_url TEXT,
  favicon_url TEXT,
  brand_name VARCHAR(255),

  -- Colors
  primary_color VARCHAR(7) DEFAULT '#6366f1',
  secondary_color VARCHAR(7) DEFAULT '#8b5cf6',
  accent_color VARCHAR(7) DEFAULT '#06b6d4',
  background_color VARCHAR(7) DEFAULT '#ffffff',
  text_color VARCHAR(7) DEFAULT '#1f2937',

  -- Typography
  font_family VARCHAR(100) DEFAULT 'Inter',
  heading_font VARCHAR(100),

  -- Layout
  hero_image_url TEXT,
  hero_title VARCHAR(255),
  hero_subtitle TEXT,

  -- Business info (kan override restaurant data)
  display_name VARCHAR(255),
  tagline VARCHAR(500),
  description TEXT,

  -- Opening hours override
  opening_hours JSONB DEFAULT '{}',

  -- Delivery settings
  delivery_zones JSONB DEFAULT '[]',
  minimum_order_amount DECIMAL(10,2) DEFAULT 0,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  free_delivery_threshold DECIMAL(10,2),

  -- Payment methods enabled
  payment_methods JSONB DEFAULT '["card", "mobilepay"]',

  -- Social links
  social_links JSONB DEFAULT '{}',

  -- SEO
  meta_title VARCHAR(255),
  meta_description VARCHAR(500),
  og_image_url TEXT,

  -- Features enabled
  features JSONB DEFAULT '{
    "ordering": true,
    "reservations": false,
    "loyalty": false,
    "reviews": false,
    "blog": false
  }',

  -- Custom CSS/JS
  custom_css TEXT,
  custom_head_scripts TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id)
);

-- Index for tenant lookup
CREATE INDEX IF NOT EXISTS idx_site_configs_tenant ON site_configs(tenant_id);

-- ============================================
-- MENU CATEGORIES (for site display)
-- ============================================
CREATE TABLE IF NOT EXISTS site_menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  display_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  schedule JSONB, -- optional: only show at certain times
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_menu_categories_tenant ON site_menu_categories(tenant_id);

-- ============================================
-- MENU ITEMS (for site display)
-- ============================================
CREATE TABLE IF NOT EXISTS site_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES site_menu_categories(id) ON DELETE SET NULL,

  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2), -- for discounts

  image_url TEXT,
  images JSONB DEFAULT '[]', -- multiple images

  -- Modifiers/options
  options JSONB DEFAULT '[]', -- size, extras, etc.

  -- Dietary info
  dietary_info JSONB DEFAULT '{}', -- vegetarian, vegan, gluten-free, etc.
  allergens TEXT[],

  -- Availability
  is_available BOOLEAN DEFAULT true,
  available_from TIME,
  available_until TIME,
  available_days INT[], -- 0-6, Sunday-Saturday

  -- Popularity/ordering
  display_order INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_popular BOOLEAN DEFAULT false,

  -- Stock
  track_inventory BOOLEAN DEFAULT false,
  stock_quantity INT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_menu_items_tenant ON site_menu_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_site_menu_items_category ON site_menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_site_menu_items_featured ON site_menu_items(tenant_id, is_featured) WHERE is_featured = true;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE tenant_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_menu_items ENABLE ROW LEVEL SECURITY;

-- Public read access for site data (needed for customer-facing sites)
CREATE POLICY "Public can view active sites" ON tenant_sites
  FOR SELECT USING (status = 'active');

CREATE POLICY "Public can view site configs" ON site_configs
  FOR SELECT USING (true);

CREATE POLICY "Public can view visible menu categories" ON site_menu_categories
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Public can view available menu items" ON site_menu_items
  FOR SELECT USING (is_available = true);

-- Authenticated users can manage their own data
CREATE POLICY "Users can manage own site" ON tenant_sites
  FOR ALL USING (
    tenant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own site config" ON site_configs
  FOR ALL USING (
    tenant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own menu categories" ON site_menu_categories
  FOR ALL USING (
    tenant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own menu items" ON site_menu_items
  FOR ALL USING (
    tenant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get site by subdomain or custom domain
CREATE OR REPLACE FUNCTION get_site_by_host(host_header TEXT)
RETURNS TABLE (
  site_id UUID,
  tenant_id UUID,
  template_id VARCHAR,
  config JSONB
) AS $$
DECLARE
  subdomain_part TEXT;
BEGIN
  -- First check for custom domain match
  RETURN QUERY
  SELECT
    ts.id,
    ts.tenant_id,
    ts.template_id,
    to_jsonb(sc.*) as config
  FROM tenant_sites ts
  LEFT JOIN site_configs sc ON sc.tenant_id = ts.tenant_id
  WHERE ts.custom_domain = host_header AND ts.status = 'active'
  LIMIT 1;

  IF FOUND THEN RETURN; END IF;

  -- Extract subdomain (first part before dot)
  subdomain_part := split_part(host_header, '.', 1);

  -- Check for subdomain match
  RETURN QUERY
  SELECT
    ts.id,
    ts.tenant_id,
    ts.template_id,
    to_jsonb(sc.*) as config
  FROM tenant_sites ts
  LEFT JOIN site_configs sc ON sc.tenant_id = ts.tenant_id
  WHERE ts.subdomain = subdomain_part AND ts.status = 'active'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get full menu for a site
CREATE OR REPLACE FUNCTION get_site_menu(p_tenant_id UUID)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'description', c.description,
        'image_url', c.image_url,
        'items', (
          SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
              'id', i.id,
              'name', i.name,
              'description', i.description,
              'price', i.price,
              'compare_at_price', i.compare_at_price,
              'image_url', i.image_url,
              'options', i.options,
              'dietary_info', i.dietary_info,
              'allergens', i.allergens,
              'is_featured', i.is_featured,
              'is_popular', i.is_popular
            ) ORDER BY i.display_order
          ), '[]'::jsonb)
          FROM site_menu_items i
          WHERE i.category_id = c.id AND i.is_available = true
        )
      ) ORDER BY c.display_order
    )
    FROM site_menu_categories c
    WHERE c.tenant_id = p_tenant_id AND c.is_visible = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenant_sites_updated_at
  BEFORE UPDATE ON tenant_sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_configs_updated_at
  BEFORE UPDATE ON site_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_menu_items_updated_at
  BEFORE UPDATE ON site_menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================

-- Note: This will only work if there's a restaurant with this ID
-- In production, sites are created via the dashboard

COMMENT ON TABLE tenant_sites IS 'Maps subdomains/custom domains to tenants';
COMMENT ON TABLE site_configs IS 'Visual and functional configuration for tenant websites';
COMMENT ON TABLE site_menu_categories IS 'Menu categories displayed on tenant websites';
COMMENT ON TABLE site_menu_items IS 'Individual menu items with pricing and options';
COMMENT ON FUNCTION get_site_by_host IS 'Resolves host header to tenant and config';
COMMENT ON FUNCTION get_site_menu IS 'Returns full menu structure for a tenant';
