-- OrderFlow AI - Supabase Database Schema (Simplified)
-- Project: OrderFlow-AI-Complete
-- Created: 2026-01-04
-- NOTE: This version doesn't require auth.users - uses simple user_id TEXT instead

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- RESTAURANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- Changed from UUID REFERENCES to simple TEXT

  -- Basic Info
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'churned', 'cancelled')),

  -- Contact Info
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,

  -- Location
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Danmark',

  -- Business Info
  cvr TEXT,
  restaurant_type TEXT,

  -- Order Statistics
  orders INTEGER DEFAULT 0,
  orders_this_month INTEGER DEFAULT 0,
  orders_total INTEGER DEFAULT 0,

  -- Revenue Statistics (stored in øre/cents)
  revenue_today BIGINT DEFAULT 0,
  revenue_this_month BIGINT DEFAULT 0,
  revenue_total BIGINT DEFAULT 0,

  -- AI & Integration Settings
  ai_enabled BOOLEAN DEFAULT false,
  integration_status TEXT DEFAULT 'none',

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_order_at TIMESTAMPTZ,

  -- JSON fields for flexible data
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_restaurants_user_id ON restaurants(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_status ON restaurants(status);
CREATE INDEX IF NOT EXISTS idx_restaurants_created_at ON restaurants(created_at DESC);

-- ============================================================================
-- ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,

  -- Order Info
  order_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),

  -- Customer Info
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,

  -- Delivery Info
  delivery_type TEXT CHECK (delivery_type IN ('pickup', 'delivery', 'dine-in')),
  delivery_address TEXT,
  delivery_time TIMESTAMPTZ,

  -- Financial
  subtotal BIGINT NOT NULL,
  tax BIGINT DEFAULT 0,
  delivery_fee BIGINT DEFAULT 0,
  total BIGINT NOT NULL,

  -- Items (stored as JSONB array)
  items JSONB NOT NULL DEFAULT '[]',

  -- Notes
  customer_notes TEXT,
  internal_notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_time ON orders(delivery_time);

-- ============================================================================
-- ACTIVITIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,

  -- Activity Type
  type TEXT NOT NULL CHECK (type IN (
    'update', 'create', 'delete', 'order', 'workflow', 'ai', 'system', 'login',
    'page_create', 'page_rename', 'page_reorder', 'employee', 'user'
  )),

  -- Description
  description TEXT NOT NULL,

  -- Details (flexible JSONB field)
  details JSONB DEFAULT '{}',

  -- Status
  seen BOOLEAN DEFAULT false,

  -- Timestamps
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activities_seen ON activities(seen);
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities((details->>'category'));

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,

  -- Notification Path
  path TEXT NOT NULL,

  -- Content
  title TEXT NOT NULL,
  message TEXT,

  -- Status
  seen BOOLEAN DEFAULT false,

  -- Timestamps
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_path ON notifications(path);
CREATE INDEX IF NOT EXISTS idx_notifications_seen ON notifications(seen);
CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);

-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,

  -- Product Info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,

  -- Pricing (in øre/cents)
  price BIGINT NOT NULL,
  cost BIGINT DEFAULT 0,

  -- Inventory
  sku TEXT,
  in_stock BOOLEAN DEFAULT true,
  stock_quantity INTEGER,

  -- Status
  active BOOLEAN DEFAULT true,

  -- Image
  image_url TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_restaurant_id ON products(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

-- ============================================================================
-- EMPLOYEES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,

  -- Personal Info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,

  -- Employment
  position TEXT,
  role TEXT CHECK (role IN ('admin', 'manager', 'staff', 'kitchen', 'delivery')),
  employment_type TEXT CHECK (employment_type IN ('full-time', 'part-time', 'contractor', 'intern')),

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),

  -- Dates
  hired_at DATE,
  terminated_at DATE,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employees_restaurant_id ON employees(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- ============================================================================
-- AUTO-UPDATE TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - DISABLED FOR DEVELOPMENT
-- ============================================================================
-- NOTE: RLS is commented out because we're using service_role key
-- Uncomment these when switching to anon key + Supabase Auth

-- ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_activity_count_by_category(p_user_id TEXT, p_category TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM activities
    WHERE user_id = p_user_id
      AND details->>'category' = p_category
      AND seen = false
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_activities_details_gin ON activities USING GIN (details);
CREATE INDEX IF NOT EXISTS idx_restaurants_settings_gin ON restaurants USING GIN (settings);
CREATE INDEX IF NOT EXISTS idx_restaurants_metadata_gin ON restaurants USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_orders_items_gin ON orders USING GIN (items);
CREATE INDEX IF NOT EXISTS idx_orders_metadata_gin ON orders USING GIN (metadata);

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE restaurants IS 'Stores all restaurant/customer information';
COMMENT ON TABLE orders IS 'Stores all orders placed by restaurants';
COMMENT ON TABLE activities IS 'Activity log for tracking all changes in the system';
COMMENT ON TABLE notifications IS 'Notification system for blue dot indicators';
COMMENT ON TABLE products IS 'Product library for each restaurant';
COMMENT ON TABLE employees IS 'Employee/staff management for restaurants';

-- End of schema
