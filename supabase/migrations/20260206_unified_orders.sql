-- Unified Orders & Inbox Migration
-- Sprint 2: Unified ordre/inbox system
-- Created: 2026-02-06

-- ============================================
-- CUSTOMERS (unified customer identity)
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

  -- Contact info
  phone VARCHAR(20),
  email VARCHAR(255),
  name VARCHAR(255),

  -- Channel identifiers (for linking across channels)
  instagram_user_id VARCHAR(100),
  facebook_psid VARCHAR(100),
  app_user_id UUID,

  -- Profile
  avatar_url TEXT,
  preferred_language VARCHAR(5) DEFAULT 'da',

  -- Metadata
  notes TEXT,
  tags TEXT[],

  -- Stats
  total_orders INT DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_order_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique per tenant + phone/email
  UNIQUE(tenant_id, phone),
  UNIQUE(tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(tenant_id, phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(tenant_id, email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_instagram ON customers(instagram_user_id) WHERE instagram_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_facebook ON customers(facebook_psid) WHERE facebook_psid IS NOT NULL;

-- ============================================
-- CONVERSATION THREADS
-- ============================================
CREATE TABLE IF NOT EXISTS conversation_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- Channel info
  channel VARCHAR(20) NOT NULL, -- sms, instagram, facebook, app, web
  external_thread_id VARCHAR(100), -- provider's thread/conversation ID

  -- Status
  status VARCHAR(20) DEFAULT 'open', -- open, resolved, archived
  priority VARCHAR(10) DEFAULT 'normal', -- low, normal, high, urgent

  -- AI handling
  requires_attention BOOLEAN DEFAULT false,
  ai_confidence DECIMAL(3,2), -- 0.00-1.00
  escalation_reason TEXT,

  -- Assignment
  assigned_to UUID, -- staff member

  -- Metadata
  subject VARCHAR(255),
  tags TEXT[],
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  last_message_at TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_threads_tenant ON conversation_threads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_threads_customer ON conversation_threads(customer_id);
CREATE INDEX IF NOT EXISTS idx_threads_channel ON conversation_threads(tenant_id, channel);
CREATE INDEX IF NOT EXISTS idx_threads_status ON conversation_threads(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_threads_attention ON conversation_threads(tenant_id, requires_attention) WHERE requires_attention = true;
CREATE INDEX IF NOT EXISTS idx_threads_last_message ON conversation_threads(tenant_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_external ON conversation_threads(channel, external_thread_id);

-- ============================================
-- THREAD MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS thread_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES conversation_threads(id) ON DELETE CASCADE,

  -- Message info
  direction VARCHAR(10) NOT NULL, -- inbound, outbound
  sender_type VARCHAR(20) NOT NULL, -- customer, agent, system, ai
  sender_id UUID, -- customer_id or staff user_id

  -- Content
  content TEXT,
  message_type VARCHAR(20) DEFAULT 'text', -- text, image, audio, video, order_event, payment_link, location
  attachments JSONB DEFAULT '[]',

  -- External reference
  external_message_id VARCHAR(100),

  -- AI processing
  intent VARCHAR(50),
  entities JSONB,
  sentiment VARCHAR(20), -- positive, neutral, negative

  -- Delivery status
  status VARCHAR(20) DEFAULT 'sent', -- pending, sent, delivered, read, failed
  error_message TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_messages_thread ON thread_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON thread_messages(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_external ON thread_messages(external_message_id) WHERE external_message_id IS NOT NULL;

-- ============================================
-- UNIFIED ORDERS (canonical order model)
-- ============================================
CREATE TABLE IF NOT EXISTS unified_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

  -- Source
  source_channel VARCHAR(20) NOT NULL, -- sms, instagram, facebook, app, web
  thread_id UUID REFERENCES conversation_threads(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- Order number (human-readable)
  order_number VARCHAR(20),

  -- Line items
  line_items JSONB NOT NULL DEFAULT '[]',
  -- Format: [{ id, name, quantity, unit_price, modifiers: [], notes }]

  -- Totals
  subtotal DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_code VARCHAR(50),
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  service_fee DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  tip_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'DKK',

  -- Fulfillment
  fulfillment_type VARCHAR(20), -- pickup, delivery, dine_in
  scheduled_time TIMESTAMPTZ,
  estimated_ready_time TIMESTAMPTZ,
  actual_ready_time TIMESTAMPTZ,

  -- Delivery details
  delivery_address JSONB,
  -- Format: { street, city, postal_code, country, lat, lng, instructions }
  delivery_notes TEXT,

  -- Customer details (snapshot)
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),

  -- Payment
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, refunded, failed
  payment_method VARCHAR(30), -- card, mobilepay, cash, invoice
  payment_provider VARCHAR(30), -- stripe, mobilepay, etc.
  payment_reference VARCHAR(100),
  payment_link TEXT,
  paid_at TIMESTAMPTZ,

  -- Status machine
  status VARCHAR(30) DEFAULT 'draft',
  -- draft → pending → confirmed → preparing → ready → picked_up/delivered → completed
  -- Can also be: cancelled, refunded

  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancelled_by VARCHAR(50), -- customer, restaurant, system

  -- Notes
  customer_notes TEXT,
  internal_notes TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_tenant ON unified_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON unified_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_thread ON unified_orders(thread_id);
CREATE INDEX IF NOT EXISTS idx_orders_channel ON unified_orders(tenant_id, source_channel);
CREATE INDEX IF NOT EXISTS idx_orders_status ON unified_orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON unified_orders(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_number ON unified_orders(tenant_id, order_number);

-- ============================================
-- ORDER STATUS HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES unified_orders(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL,
  changed_by UUID, -- user_id or null for system
  changed_by_type VARCHAR(20), -- user, system, ai, customer
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_history_order ON order_status_history(order_id, created_at);

-- ============================================
-- MESSAGE IDEMPOTENCY
-- ============================================
CREATE TABLE IF NOT EXISTS message_idempotency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel VARCHAR(20) NOT NULL,
  external_message_id VARCHAR(100) NOT NULL,
  tenant_id UUID,
  thread_id UUID,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel, external_message_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_idempotency_lookup ON message_idempotency(channel, external_message_id, tenant_id);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_idempotency ENABLE ROW LEVEL SECURITY;

-- Customers
CREATE POLICY "Users can view own customers" ON customers
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own customers" ON customers
  FOR ALL USING (
    tenant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
  );

-- Threads
CREATE POLICY "Users can view own threads" ON conversation_threads
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own threads" ON conversation_threads
  FOR ALL USING (
    tenant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
  );

-- Messages
CREATE POLICY "Users can view thread messages" ON thread_messages
  FOR SELECT USING (
    thread_id IN (
      SELECT id FROM conversation_threads
      WHERE tenant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage thread messages" ON thread_messages
  FOR ALL USING (
    thread_id IN (
      SELECT id FROM conversation_threads
      WHERE tenant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
    )
  );

-- Orders
CREATE POLICY "Users can view own orders" ON unified_orders
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own orders" ON unified_orders
  FOR ALL USING (
    tenant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
  );

-- Status history
CREATE POLICY "Users can view order history" ON order_status_history
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM unified_orders
      WHERE tenant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can add order history" ON order_status_history
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT id FROM unified_orders
      WHERE tenant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
    )
  );

-- Idempotency (service role only)
CREATE POLICY "Service role can manage idempotency" ON message_idempotency
  FOR ALL USING (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number(p_tenant_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  today_count INT;
  new_number VARCHAR;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count
  FROM unified_orders
  WHERE tenant_id = p_tenant_id
    AND created_at >= CURRENT_DATE;

  new_number := TO_CHAR(CURRENT_DATE, 'YYMMDD') || '-' || LPAD(today_count::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Get inbox threads with latest message
CREATE OR REPLACE FUNCTION get_inbox_threads(
  p_tenant_id UUID,
  p_status VARCHAR DEFAULT NULL,
  p_channel VARCHAR DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  thread_id UUID,
  channel VARCHAR,
  status VARCHAR,
  customer_name VARCHAR,
  customer_phone VARCHAR,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count BIGINT,
  requires_attention BOOLEAN,
  ai_confidence DECIMAL,
  order_id UUID,
  order_status VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id as thread_id,
    t.channel,
    t.status,
    COALESCE(c.name, c.phone, 'Ukendt') as customer_name,
    c.phone as customer_phone,
    (SELECT m.content FROM thread_messages m WHERE m.thread_id = t.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
    t.last_message_at,
    (SELECT COUNT(*) FROM thread_messages m WHERE m.thread_id = t.id AND m.direction = 'inbound' AND m.read_at IS NULL) as unread_count,
    t.requires_attention,
    t.ai_confidence,
    (SELECT o.id FROM unified_orders o WHERE o.thread_id = t.id ORDER BY o.created_at DESC LIMIT 1) as order_id,
    (SELECT o.status FROM unified_orders o WHERE o.thread_id = t.id ORDER BY o.created_at DESC LIMIT 1) as order_status
  FROM conversation_threads t
  LEFT JOIN customers c ON c.id = t.customer_id
  WHERE t.tenant_id = p_tenant_id
    AND (p_status IS NULL OR t.status = p_status)
    AND (p_channel IS NULL OR t.channel = p_channel)
  ORDER BY t.last_message_at DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get or create customer
CREATE OR REPLACE FUNCTION get_or_create_customer(
  p_tenant_id UUID,
  p_phone VARCHAR DEFAULT NULL,
  p_email VARCHAR DEFAULT NULL,
  p_name VARCHAR DEFAULT NULL,
  p_instagram_id VARCHAR DEFAULT NULL,
  p_facebook_id VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  -- Try to find existing customer
  SELECT id INTO v_customer_id FROM customers
  WHERE tenant_id = p_tenant_id
    AND (
      (phone IS NOT NULL AND phone = p_phone)
      OR (email IS NOT NULL AND email = p_email)
      OR (instagram_user_id IS NOT NULL AND instagram_user_id = p_instagram_id)
      OR (facebook_psid IS NOT NULL AND facebook_psid = p_facebook_id)
    )
  LIMIT 1;

  -- Create if not found
  IF v_customer_id IS NULL THEN
    INSERT INTO customers (tenant_id, phone, email, name, instagram_user_id, facebook_psid)
    VALUES (p_tenant_id, p_phone, p_email, p_name, p_instagram_id, p_facebook_id)
    RETURNING id INTO v_customer_id;
  ELSE
    -- Update existing with new info
    UPDATE customers SET
      phone = COALESCE(p_phone, phone),
      email = COALESCE(p_email, email),
      name = COALESCE(p_name, name),
      instagram_user_id = COALESCE(p_instagram_id, instagram_user_id),
      facebook_psid = COALESCE(p_facebook_id, facebook_psid),
      updated_at = NOW()
    WHERE id = v_customer_id;
  END IF;

  RETURN v_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-generate order number
CREATE OR REPLACE FUNCTION trigger_generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON unified_orders
  FOR EACH ROW EXECUTE FUNCTION trigger_generate_order_number();

-- Update thread last_message_at
CREATE OR REPLACE FUNCTION trigger_update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversation_threads
  SET last_message_at = NEW.created_at,
      updated_at = NOW()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_thread_last_message_trigger
  AFTER INSERT ON thread_messages
  FOR EACH ROW EXECUTE FUNCTION trigger_update_thread_last_message();

-- Log order status changes
CREATE OR REPLACE FUNCTION trigger_log_order_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, status, changed_by_type)
    VALUES (NEW.id, NEW.status, 'system');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_order_status_trigger
  AFTER UPDATE ON unified_orders
  FOR EACH ROW EXECUTE FUNCTION trigger_log_order_status();

-- Update customer stats on order completion
CREATE OR REPLACE FUNCTION trigger_update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE customers SET
      total_orders = total_orders + 1,
      total_spent = total_spent + NEW.total,
      last_order_at = NOW(),
      updated_at = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_stats_trigger
  AFTER UPDATE ON unified_orders
  FOR EACH ROW EXECUTE FUNCTION trigger_update_customer_stats();

-- Auto-update updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_threads_updated_at
  BEFORE UPDATE ON conversation_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON unified_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE customers IS 'Unified customer identity across all channels';
COMMENT ON TABLE conversation_threads IS 'Conversations/threads from all messaging channels';
COMMENT ON TABLE thread_messages IS 'Individual messages within conversation threads';
COMMENT ON TABLE unified_orders IS 'Canonical order model for all channels';
COMMENT ON TABLE order_status_history IS 'Audit log of order status changes';
COMMENT ON TABLE message_idempotency IS 'Prevents duplicate message processing';
COMMENT ON FUNCTION get_inbox_threads IS 'Returns inbox threads with latest message and order info';
COMMENT ON FUNCTION get_or_create_customer IS 'Finds or creates customer by phone/email/social ID';
