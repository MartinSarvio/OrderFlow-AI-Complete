-- =====================================================
-- AI AGENTS TABLE
-- For managing Instagram/Facebook ordering agents
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('instagram', 'facebook')),
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'paused')),

    -- OrderingAgent Configuration (from js/ordering-agent.js)
    config JSONB NOT NULL DEFAULT '{
        "defaultLanguage": "da",
        "maxRetries": 1,
        "escalationThreshold": 2,
        "cateringThreshold": 15,
        "enableAnalytics": true,
        "enablePayments": false,
        "enableMLStorage": true,
        "paymentTimeout": 900000
    }'::jsonb,

    -- Social Integration (tokens stored encrypted)
    access_token_encrypted TEXT,
    page_id TEXT,
    webhook_url TEXT,

    -- Statistics
    conversations_count INTEGER DEFAULT 0,
    orders_completed INTEGER DEFAULT 0,
    last_active_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for ai_agents
CREATE INDEX IF NOT EXISTS idx_ai_agents_user ON public.ai_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_restaurant ON public.ai_agents(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_channel ON public.ai_agents(channel);
CREATE INDEX IF NOT EXISTS idx_ai_agents_status ON public.ai_agents(status);

-- Enable RLS
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_agents
CREATE POLICY "Users can read own agents" ON public.ai_agents
    FOR SELECT USING (auth.uid()::text = user_id OR user_id = 'demo-user');

CREATE POLICY "Users can insert own agents" ON public.ai_agents
    FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id = 'demo-user');

CREATE POLICY "Users can update own agents" ON public.ai_agents
    FOR UPDATE USING (auth.uid()::text = user_id OR user_id = 'demo-user');

CREATE POLICY "Users can delete own agents" ON public.ai_agents
    FOR DELETE USING (auth.uid()::text = user_id OR user_id = 'demo-user');

-- =====================================================
-- SMS WORKFLOWS TABLE
-- For managing SMS automation workflows
-- =====================================================

CREATE TABLE IF NOT EXISTS public.sms_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    variant TEXT NOT NULL CHECK (variant IN ('restaurant', 'haandvaerker', 'custom')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'inactive', 'draft')),

    -- Workflow Configuration
    workflow_nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
    workflow_connections JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Trigger Settings
    triggers JSONB NOT NULL DEFAULT '{
        "on_order_placed": false,
        "on_order_delivered": false,
        "on_customer_signup": false,
        "on_missed_call": false,
        "scheduled": null
    }'::jsonb,

    -- Statistics
    executions_count INTEGER DEFAULT 0,
    sms_sent_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for sms_workflows
CREATE INDEX IF NOT EXISTS idx_sms_workflows_user ON public.sms_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_workflows_restaurant ON public.sms_workflows(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_sms_workflows_variant ON public.sms_workflows(variant);
CREATE INDEX IF NOT EXISTS idx_sms_workflows_status ON public.sms_workflows(status);

-- Enable RLS
ALTER TABLE public.sms_workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sms_workflows
CREATE POLICY "Users can read own workflows" ON public.sms_workflows
    FOR SELECT USING (auth.uid()::text = user_id OR user_id = 'demo-user');

CREATE POLICY "Users can insert own workflows" ON public.sms_workflows
    FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id = 'demo-user');

CREATE POLICY "Users can update own workflows" ON public.sms_workflows
    FOR UPDATE USING (auth.uid()::text = user_id OR user_id = 'demo-user');

CREATE POLICY "Users can delete own workflows" ON public.sms_workflows
    FOR DELETE USING (auth.uid()::text = user_id OR user_id = 'demo-user');

-- =====================================================
-- GRANTS
-- =====================================================

GRANT ALL ON public.ai_agents TO authenticated;
GRANT ALL ON public.ai_agents TO service_role;
GRANT ALL ON public.sms_workflows TO authenticated;
GRANT ALL ON public.sms_workflows TO service_role;

-- =====================================================
-- UPDATE TRIGGERS (auto-update updated_at)
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_agents_updated_at
    BEFORE UPDATE ON public.ai_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sms_workflows_updated_at
    BEFORE UPDATE ON public.sms_workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
