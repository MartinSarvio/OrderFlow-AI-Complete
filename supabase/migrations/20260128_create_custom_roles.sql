-- Create custom_roles table for role management
CREATE TABLE IF NOT EXISTS custom_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6b7280',
  permissions JSONB DEFAULT '[]'::jsonb,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert system roles (cannot be deleted)
INSERT INTO custom_roles (name, color, permissions, is_system) VALUES
  ('Administrator', '#2dd4bf', '["all"]'::jsonb, true),
  ('Manager', '#22c55e', '["customers","reports","workflow","leads"]'::jsonb, true),
  ('Personale', '#f97316', '["customers_read"]'::jsonb, true)
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read roles
CREATE POLICY "Anyone can read roles" ON custom_roles
  FOR SELECT USING (true);

-- Policy: Only admins can insert/update/delete
CREATE POLICY "Admins can manage roles" ON custom_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Add role column to link users to custom roles
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS custom_role_id UUID REFERENCES custom_roles(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_custom_role ON user_roles(custom_role_id);
