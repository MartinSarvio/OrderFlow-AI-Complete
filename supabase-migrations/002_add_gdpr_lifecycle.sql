-- ============================================================================
-- SUPABASE MIGRATION: Add GDPR Lifecycle & Customer Termination
-- ============================================================================
-- Formål: Tilføjer kunde-livscyklus med GDPR-compliance
--
-- SÅDAN KØRER DU DENNE MIGRATION:
-- 1. Gå til https://qymtjhzgtcittohutmay.supabase.co
-- 2. Klik på "SQL Editor" i venstre sidebar
-- 3. Opret ny query og indsæt denne fil
-- 4. Klik "Run" for at udføre migrationen
--
-- VIGTIGT: Tag backup før du kører denne migration i produktion!
-- ============================================================================

-- ============================================================================
-- STEP 1: Add new columns to restaurants table
-- ============================================================================

-- Termination fields
ALTER TABLE restaurants
    ADD COLUMN IF NOT EXISTS terminated_at TIMESTAMPTZ;

ALTER TABLE restaurants
    ADD COLUMN IF NOT EXISTS termination_reason TEXT;

ALTER TABLE restaurants
    ADD COLUMN IF NOT EXISTS termination_initiated_by TEXT;

-- GDPR deletion scheduling
ALTER TABLE restaurants
    ADD COLUMN IF NOT EXISTS gdpr_deletion_scheduled_at TIMESTAMPTZ;

ALTER TABLE restaurants
    ADD COLUMN IF NOT EXISTS gdpr_deleted_at TIMESTAMPTZ;

-- Archived data for accounting (keeps financial data after anonymization)
ALTER TABLE restaurants
    ADD COLUMN IF NOT EXISTS archived_data JSONB DEFAULT '{}';

-- Retention period in days (default 5 years = 1825 days)
ALTER TABLE restaurants
    ADD COLUMN IF NOT EXISTS retention_period_days INTEGER DEFAULT 1825;

-- ============================================================================
-- STEP 2: Update status constraint to include new statuses
-- ============================================================================

-- Drop existing constraint if it exists
ALTER TABLE restaurants
    DROP CONSTRAINT IF EXISTS restaurants_status_check;

-- Add new constraint with all statuses
ALTER TABLE restaurants
    ADD CONSTRAINT restaurants_status_check
    CHECK (status IN (
        'pending',      -- Afventer aktivering
        'active',       -- Aktiv kunde
        'inactive',     -- Midlertidig inaktiv
        'demo',         -- Demo/prøveperiode
        'churned',      -- Opsagt af kunde
        'cancelled',    -- Annulleret
        'terminated',   -- Admin-opsagt, retention aktiv
        'gdpr_deleted'  -- GDPR slettet (anonymiseret)
    ));

-- ============================================================================
-- STEP 3: Create GDPR Audit Log table
-- ============================================================================

CREATE TABLE IF NOT EXISTS gdpr_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,

    -- Audit action
    action TEXT NOT NULL CHECK (action IN (
        'termination_initiated',
        'termination_confirmed',
        'data_anonymized',
        'gdpr_deletion_scheduled',
        'gdpr_deletion_executed',
        'retention_period_extended',
        'customer_reactivated',
        'data_export_requested',
        'data_export_completed'
    )),

    -- Details
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',

    -- Who performed the action
    performed_by TEXT NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for gdpr_audit_log
CREATE INDEX IF NOT EXISTS idx_gdpr_audit_restaurant_id ON gdpr_audit_log(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_audit_user_id ON gdpr_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_audit_action ON gdpr_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_gdpr_audit_created_at ON gdpr_audit_log(created_at DESC);

-- ============================================================================
-- STEP 4: Create indexes for new columns
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_restaurants_terminated_at ON restaurants(terminated_at);
CREATE INDEX IF NOT EXISTS idx_restaurants_gdpr_deletion_scheduled ON restaurants(gdpr_deletion_scheduled_at);

-- ============================================================================
-- STEP 5: Enable RLS on gdpr_audit_log
-- ============================================================================

ALTER TABLE gdpr_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own audit logs
CREATE POLICY "Users can view own GDPR audit logs" ON gdpr_audit_log
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own audit logs
CREATE POLICY "Users can insert GDPR audit logs" ON gdpr_audit_log
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- STEP 6: Create helper function for scheduled GDPR deletions
-- ============================================================================

CREATE OR REPLACE FUNCTION get_customers_for_gdpr_deletion()
RETURNS TABLE (
    id UUID,
    name TEXT,
    terminated_at TIMESTAMPTZ,
    gdpr_deletion_scheduled_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.name,
        r.terminated_at,
        r.gdpr_deletion_scheduled_at
    FROM restaurants r
    WHERE r.status = 'terminated'
    AND r.gdpr_deletion_scheduled_at <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 7: Create function to anonymize customer data
-- ============================================================================

CREATE OR REPLACE FUNCTION anonymize_customer_data(
    p_restaurant_id UUID,
    p_performed_by TEXT
) RETURNS VOID AS $$
DECLARE
    v_restaurant RECORD;
    v_archived_data JSONB;
BEGIN
    -- Get current restaurant data
    SELECT * INTO v_restaurant FROM restaurants WHERE id = p_restaurant_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Restaurant not found: %', p_restaurant_id;
    END IF;

    -- Create archived data structure (financial data for accounting)
    v_archived_data := jsonb_build_object(
        'original_id', p_restaurant_id,
        'archived_at', NOW(),
        'financial_summary', jsonb_build_object(
            'total_revenue', v_restaurant.revenue_total,
            'total_orders', v_restaurant.orders_total,
            'created_at', v_restaurant.created_at,
            'terminated_at', v_restaurant.terminated_at
        )
    );

    -- Anonymize PII fields
    UPDATE restaurants SET
        name = '[GDPR ANONYMISERET]',
        contact_name = NULL,
        contact_email = NULL,
        contact_phone = NULL,
        address = NULL,
        city = NULL,
        postal_code = NULL,
        cvr = NULL,
        metadata = jsonb_build_object('gdpr_anonymized', true, 'anonymized_at', NOW()),
        settings = '{}',
        archived_data = v_archived_data,
        status = 'gdpr_deleted',
        gdpr_deleted_at = NOW(),
        updated_at = NOW()
    WHERE id = p_restaurant_id;

    -- Log the action
    INSERT INTO gdpr_audit_log (user_id, restaurant_id, action, description, performed_by)
    VALUES (
        (SELECT user_id FROM restaurants WHERE id = p_restaurant_id),
        p_restaurant_id,
        'gdpr_deletion_executed',
        'Kundedata anonymiseret og GDPR sletning gennemført',
        p_performed_by
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICATION QUERIES (run these to verify the migration)
-- ============================================================================

-- Check new columns exist:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'restaurants' AND column_name IN ('terminated_at', 'gdpr_deletion_scheduled_at', 'archived_data');

-- Check gdpr_audit_log table exists:
-- SELECT * FROM gdpr_audit_log LIMIT 1;

-- Check status constraint:
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
-- WHERE conname = 'restaurants_status_check';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
