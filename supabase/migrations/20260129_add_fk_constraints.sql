-- ============================================================================
-- SUPABASE MIGRATION: Add Foreign Key Constraints
-- ============================================================================
-- Formål: Sikrer dataintegritet ved at tilføje CASCADE DELETE constraints
--
-- SÅDAN KØRER DU DENNE MIGRATION:
-- 1. Gå til https://qymtjhzgtcittohutmay.supabase.co
-- 2. Klik på "SQL Editor" i venstre sidebar
-- 3. Opret ny query og indsæt denne fil
-- 4. Klik "Run" for at udføre migrationen
--
-- VIGTIGT: Kør denne migration i produktionsmiljø med forsigtighed!
-- ============================================================================

-- ============================================================================
-- STEP 1: FIX DATA TYPES - Convert TEXT user_id to UUID
-- ============================================================================
-- Nogle tabeller har user_id som TEXT, men auth.users.id er UUID
-- Vi skal konvertere disse først

-- Activities table: Convert user_id from TEXT to UUID
ALTER TABLE activities
    ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Notifications table: Convert user_id from TEXT to UUID (if needed)
ALTER TABLE notifications
    ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Restaurants table: Convert user_id from TEXT to UUID (if needed)
ALTER TABLE restaurants
    ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Orders table: Convert user_id from TEXT to UUID (if needed)
ALTER TABLE orders
    ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Products table: Convert user_id from TEXT to UUID (if needed)
ALTER TABLE products
    ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- ============================================================================
-- STEP 2: ORDERS TABLE - Foreign Key to Restaurants
-- ============================================================================
-- Når en restaurant slettes, slettes alle tilhørende ordrer automatisk

ALTER TABLE orders
    DROP CONSTRAINT IF EXISTS orders_restaurant_id_fkey;

ALTER TABLE orders
    ADD CONSTRAINT orders_restaurant_id_fkey
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(id)
        ON DELETE CASCADE;

-- ============================================================================
-- STEP 3: PRODUCTS TABLE - Foreign Key to Restaurants
-- ============================================================================
-- Når en restaurant slettes, slettes alle tilhørende produkter automatisk

ALTER TABLE products
    DROP CONSTRAINT IF EXISTS products_restaurant_id_fkey;

ALTER TABLE products
    ADD CONSTRAINT products_restaurant_id_fkey
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(id)
        ON DELETE CASCADE;

-- ============================================================================
-- STEP 4: ACTIVITIES TABLE - Foreign Key to Users (auth.users)
-- ============================================================================

ALTER TABLE activities
    DROP CONSTRAINT IF EXISTS activities_user_id_fkey;

ALTER TABLE activities
    ADD CONSTRAINT activities_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE;

-- ============================================================================
-- STEP 5: NOTIFICATIONS TABLE - Foreign Key to Users (auth.users)
-- ============================================================================

ALTER TABLE notifications
    DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

ALTER TABLE notifications
    ADD CONSTRAINT notifications_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE;

-- ============================================================================
-- STEP 6: RESTAURANTS TABLE - Foreign Key to Users (auth.users)
-- ============================================================================

ALTER TABLE restaurants
    DROP CONSTRAINT IF EXISTS restaurants_user_id_fkey;

ALTER TABLE restaurants
    ADD CONSTRAINT restaurants_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE;

-- ============================================================================
-- STEP 7: ORDERS TABLE - Foreign Key to Users (auth.users)
-- ============================================================================

ALTER TABLE orders
    DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

ALTER TABLE orders
    ADD CONSTRAINT orders_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE;

-- ============================================================================
-- STEP 8: PRODUCTS TABLE - Foreign Key to Users (auth.users)
-- ============================================================================

ALTER TABLE products
    DROP CONSTRAINT IF EXISTS products_user_id_fkey;

ALTER TABLE products
    ADD CONSTRAINT products_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Check column types:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'activities' AND column_name = 'user_id';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
