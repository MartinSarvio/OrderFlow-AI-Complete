-- Add product_categories and vat_rates columns to restaurants table
-- These store arrays of category names and VAT rate objects

-- Add product_categories column (array of text)
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS product_categories text[] DEFAULT '{}';

-- Add vat_rates column (JSONB array of objects like [{name: "Standard", rate: 25}])
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS vat_rates jsonb DEFAULT '[]';

-- Comment for documentation
COMMENT ON COLUMN public.restaurants.product_categories IS 'Array of product category names';
COMMENT ON COLUMN public.restaurants.vat_rates IS 'Array of VAT rate objects with name and rate fields';
