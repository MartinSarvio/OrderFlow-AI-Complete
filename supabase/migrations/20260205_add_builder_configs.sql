-- =====================================================
-- BUILDER CONFIGURATIONS TABLE
-- Stores App Builder, Web Builder, and CMS configurations
-- =====================================================

-- Create builder_configs table
CREATE TABLE IF NOT EXISTS public.builder_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    config_type TEXT NOT NULL CHECK (config_type IN ('app_builder', 'web_builder', 'cms')),
    config_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure unique config per user/type/restaurant combination
    CONSTRAINT unique_user_config UNIQUE (user_id, config_type, restaurant_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_builder_configs_user_type
    ON public.builder_configs(user_id, config_type);

CREATE INDEX IF NOT EXISTS idx_builder_configs_restaurant
    ON public.builder_configs(restaurant_id);

-- Enable RLS
ALTER TABLE public.builder_configs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own configs
CREATE POLICY "Users can read own configs" ON public.builder_configs
    FOR SELECT USING (auth.uid()::text = user_id OR user_id = 'demo-user');

-- Policy: Users can insert their own configs
CREATE POLICY "Users can insert own configs" ON public.builder_configs
    FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id = 'demo-user');

-- Policy: Users can update their own configs
CREATE POLICY "Users can update own configs" ON public.builder_configs
    FOR UPDATE USING (auth.uid()::text = user_id OR user_id = 'demo-user');

-- Policy: Users can delete their own configs
CREATE POLICY "Users can delete own configs" ON public.builder_configs
    FOR DELETE USING (auth.uid()::text = user_id OR user_id = 'demo-user');

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_builder_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER builder_configs_updated_at
    BEFORE UPDATE ON public.builder_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_builder_configs_updated_at();

-- Grant permissions
GRANT ALL ON public.builder_configs TO authenticated;
GRANT ALL ON public.builder_configs TO service_role;

-- =====================================================
-- TEMPLATES TABLE
-- Stores custom website templates uploaded by admins
-- =====================================================

-- Create templates table
CREATE TABLE IF NOT EXISTS public.templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    file_path TEXT,
    config JSONB NOT NULL DEFAULT '{}',
    preview_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_templates_active
    ON public.templates(is_active);

CREATE INDEX IF NOT EXISTS idx_templates_created_by
    ON public.templates(created_by);

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read active templates
CREATE POLICY "Everyone can read active templates" ON public.templates
    FOR SELECT USING (is_active = true);

-- Policy: Only admins/service_role can insert templates
CREATE POLICY "Service role can insert templates" ON public.templates
    FOR INSERT WITH CHECK (true);

-- Policy: Only admins/service_role can update templates
CREATE POLICY "Service role can update templates" ON public.templates
    FOR UPDATE USING (true);

-- Policy: Only admins/service_role can delete templates
CREATE POLICY "Service role can delete templates" ON public.templates
    FOR DELETE USING (true);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER templates_updated_at
    BEFORE UPDATE ON public.templates
    FOR EACH ROW
    EXECUTE FUNCTION update_templates_updated_at();

-- Grant permissions
GRANT SELECT ON public.templates TO authenticated;
GRANT ALL ON public.templates TO service_role;

-- =====================================================
-- STORAGE BUCKET FOR TEMPLATES
-- =====================================================

-- Create templates storage bucket (run separately in Supabase dashboard if needed)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('templates', 'templates', true)
-- ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.builder_configs IS 'Stores configuration data for App Builder, Web Builder, and CMS';
COMMENT ON COLUMN public.builder_configs.config_type IS 'Type: app_builder, web_builder, or cms';
COMMENT ON COLUMN public.builder_configs.config_data IS 'JSON configuration data';

COMMENT ON TABLE public.templates IS 'Stores custom website templates for Web Builder';
COMMENT ON COLUMN public.templates.config IS 'Template configuration including branding, colors, etc.';
