-- Create customers table if not exists
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.tenants(id),
  phone TEXT,
  email TEXT,
  name TEXT,
  password_hash TEXT,
  loyalty_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create unique index on email per restaurant
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_email_restaurant ON public.customers(restaurant_id, email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_phone_restaurant ON public.customers(restaurant_id, phone) WHERE phone IS NOT NULL;

-- RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Allow anon to insert (signup)
CREATE POLICY IF NOT EXISTS "customers_insert" ON public.customers FOR INSERT WITH CHECK (true);
-- Allow reading own data
CREATE POLICY IF NOT EXISTS "customers_select" ON public.customers FOR SELECT USING (true);
-- Allow updating own data
CREATE POLICY IF NOT EXISTS "customers_update" ON public.customers FOR UPDATE USING (true);

-- get_or_create_customer function (if not exists)
CREATE OR REPLACE FUNCTION public.get_or_create_customer(
  p_tenant_id UUID,
  p_phone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_name TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  -- Try to find by email first
  IF p_email IS NOT NULL THEN
    SELECT id INTO v_customer_id FROM public.customers
    WHERE restaurant_id = p_tenant_id AND email = p_email LIMIT 1;
  END IF;

  -- Try phone
  IF v_customer_id IS NULL AND p_phone IS NOT NULL THEN
    SELECT id INTO v_customer_id FROM public.customers
    WHERE restaurant_id = p_tenant_id AND phone = p_phone LIMIT 1;
  END IF;

  -- Create if not found
  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (restaurant_id, phone, email, name)
    VALUES (p_tenant_id, p_phone, p_email, p_name)
    RETURNING id INTO v_customer_id;
  ELSE
    -- Update name if provided
    IF p_name IS NOT NULL THEN
      UPDATE public.customers SET name = p_name WHERE id = v_customer_id;
    END IF;
  END IF;

  RETURN v_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
