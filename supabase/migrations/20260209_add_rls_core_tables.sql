-- =====================================================
-- RLS POLICIES FOR CORE TABLES
-- restaurants, products, orders
-- Date: 2026-02-09
-- =====================================================

-- =====================================================
-- RESTAURANTS - Users can only access their own restaurants
-- =====================================================
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY restaurants_select ON restaurants FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY restaurants_insert ON restaurants FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY restaurants_update ON restaurants FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY restaurants_delete ON restaurants FOR DELETE
USING (user_id = auth.uid());

-- =====================================================
-- PRODUCTS - Access via restaurant ownership
-- =====================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_select ON products FOR SELECT
USING (
    restaurant_id IN (
        SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
);

CREATE POLICY products_insert ON products FOR INSERT
WITH CHECK (
    restaurant_id IN (
        SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
);

CREATE POLICY products_update ON products FOR UPDATE
USING (
    restaurant_id IN (
        SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
);

CREATE POLICY products_delete ON products FOR DELETE
USING (
    restaurant_id IN (
        SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
);

-- =====================================================
-- ORDERS - Access via restaurant ownership or order creator
-- =====================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY orders_select ON orders FOR SELECT
USING (
    restaurant_id IN (
        SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
    OR user_id = auth.uid()
);

CREATE POLICY orders_insert ON orders FOR INSERT
WITH CHECK (
    restaurant_id IN (
        SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
    OR user_id = auth.uid()
);

CREATE POLICY orders_update ON orders FOR UPDATE
USING (
    restaurant_id IN (
        SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
);

CREATE POLICY orders_delete ON orders FOR DELETE
USING (
    restaurant_id IN (
        SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
);
