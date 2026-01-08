-- ============================================================================
-- SUPABASE MIGRATION: Add Team Invitations Table
-- ============================================================================
-- Formål: Tilføjer pending_invitations tabel for team invitationer
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
-- STEP 1: Create pending_invitations table
-- ============================================================================

CREATE TABLE IF NOT EXISTS pending_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,

    -- Invitation details
    email TEXT NOT NULL,
    role TEXT DEFAULT 'staff' CHECK (role IN ('staff', 'manager', 'admin')),

    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,

    -- Token for accepting invitation (optional - can be used for secure links)
    invitation_token UUID DEFAULT uuid_generate_v4()
);

-- ============================================================================
-- STEP 2: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_pending_invitations_email ON pending_invitations(email);
CREATE INDEX IF NOT EXISTS idx_pending_invitations_inviter ON pending_invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_pending_invitations_restaurant ON pending_invitations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_pending_invitations_status ON pending_invitations(status);
CREATE INDEX IF NOT EXISTS idx_pending_invitations_token ON pending_invitations(invitation_token);

-- ============================================================================
-- STEP 3: Enable RLS (Row Level Security)
-- ============================================================================

ALTER TABLE pending_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Inviters can view their own invitations
CREATE POLICY "Users can view invitations they sent" ON pending_invitations
    FOR SELECT
    USING (auth.uid() = inviter_id);

-- Policy: Inviters can create invitations
CREATE POLICY "Users can create invitations" ON pending_invitations
    FOR INSERT
    WITH CHECK (auth.uid() = inviter_id);

-- Policy: Inviters can update their own invitations
CREATE POLICY "Users can update own invitations" ON pending_invitations
    FOR UPDATE
    USING (auth.uid() = inviter_id);

-- Policy: Inviters can delete their own invitations
CREATE POLICY "Users can delete own invitations" ON pending_invitations
    FOR DELETE
    USING (auth.uid() = inviter_id);

-- ============================================================================
-- STEP 4: Create customer_contacts table (for CSV imports)
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,

    -- Contact info
    name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,

    -- Additional metadata
    notes TEXT,
    tags TEXT[],

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for customer_contacts
CREATE INDEX IF NOT EXISTS idx_customer_contacts_restaurant ON customer_contacts(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customer_contacts_phone ON customer_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_customer_contacts_email ON customer_contacts(email);

-- RLS for customer_contacts
ALTER TABLE customer_contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can access contacts for their restaurants
CREATE POLICY "Users can view contacts for their restaurants" ON customer_contacts
    FOR SELECT
    USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert contacts for their restaurants" ON customer_contacts
    FOR INSERT
    WITH CHECK (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update contacts for their restaurants" ON customer_contacts
    FOR UPDATE
    USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete contacts for their restaurants" ON customer_contacts
    FOR DELETE
    USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE user_id = auth.uid()
        )
    );

-- ============================================================================
-- STEP 5: Helper function to accept invitation
-- ============================================================================

CREATE OR REPLACE FUNCTION accept_invitation(
    p_invitation_token UUID,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_invitation RECORD;
BEGIN
    -- Find invitation by token
    SELECT * INTO v_invitation
    FROM pending_invitations
    WHERE invitation_token = p_invitation_token
    AND status = 'pending'
    AND expires_at > NOW();

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Update invitation status
    UPDATE pending_invitations
    SET status = 'accepted',
        accepted_at = NOW()
    WHERE id = v_invitation.id;

    -- TODO: Add user to restaurant team (requires team_members table)

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICATION QUERIES (run these to verify the migration)
-- ============================================================================

-- Check pending_invitations table exists:
-- SELECT * FROM pending_invitations LIMIT 1;

-- Check customer_contacts table exists:
-- SELECT * FROM customer_contacts LIMIT 1;

-- Check RLS policies:
-- SELECT * FROM pg_policies WHERE tablename = 'pending_invitations';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
