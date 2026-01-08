-- ============================================================================
-- GENDAN FORSVUNDNE KUNDER - SQL SCRIPT
-- ============================================================================
-- Dato: 2026-01-04
-- Formål: Find og gendan kunder oprettet med forkert user_id
-- ============================================================================

-- STEP 1: Find kunder med string user_id "admin-martin"
-- ============================================================================

SELECT
  id,
  name,
  contact_phone,
  contact_email,
  user_id,
  created_at
FROM restaurants
WHERE user_id = 'admin-martin'
ORDER BY created_at DESC;

-- Forventet output:
-- Skulle vise "Viborg Gourmet Pizza" og "test" kunde


-- STEP 2: Hent din rigtige UUID
-- ============================================================================

-- Kør dette i browser console FØRST:
-- console.log('Your UUID:', currentUser.id);
--
-- Eller find det i Supabase Dashboard:
-- Authentication → Users → Find din email → Kopier UUID

-- Eksempel UUID format: a1b2c3d4-e5f6-7890-abcd-ef1234567890


-- STEP 3: Opdater alle kunder til korrekt UUID
-- ============================================================================

-- ⚠️ ERSTAT '<YOUR-UUID-HERE>' MED DIN FAKTISKE UUID FRA STEP 2!

-- UPDATE restaurants
-- SET user_id = '<YOUR-UUID-HERE>'
-- WHERE user_id = 'admin-martin';

-- Eksempel (BRUG IKKE DENNE UUID - DET ER DEMO!):
-- UPDATE restaurants
-- SET user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
-- WHERE user_id = 'admin-martin';


-- STEP 4: Verificér opdatering
-- ============================================================================

-- SELECT
--   id,
--   name,
--   user_id,
--   created_at
-- FROM restaurants
-- WHERE user_id = '<YOUR-UUID-HERE>'
-- ORDER BY created_at DESC;

-- Forventet: Skulle nu vise alle dine kunder inkl. "Viborg Gourmet Pizza" og "test"


-- ============================================================================
-- EKSTRA: Find alle kunder med ikke-UUID user_id format
-- ============================================================================

-- Dette finder ALLE kunder der ikke bruger standard UUID format:

SELECT
  id,
  name,
  user_id,
  created_at,
  CASE
    WHEN user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN '✅ Valid UUID'
    ELSE '❌ Invalid UUID (string)'
  END as id_status
FROM restaurants
ORDER BY created_at DESC;


-- ============================================================================
-- SIKKERHEDSKOPI: Backup før opdatering
-- ============================================================================

-- Opret backup tabel før du opdaterer data:

-- CREATE TABLE restaurants_backup_20260104 AS
-- SELECT * FROM restaurants
-- WHERE user_id = 'admin-martin';

-- Verificér backup:
-- SELECT COUNT(*) FROM restaurants_backup_20260104;

-- Gendan fra backup hvis noget går galt:
-- INSERT INTO restaurants SELECT * FROM restaurants_backup_20260104;


-- ============================================================================
-- EFTER OPDATERING: Test i browser
-- ============================================================================

-- 1. Refresh browser (Cmd+Shift+R)
-- 2. Login med Admin Login
-- 3. Verificér i console:
--    console.log('Restaurants count:', restaurants.length);
--    console.table(restaurants);
-- 4. Check dashboard - skulle vise alle kunder


-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- Problem: Kunder stadig ikke synlige efter UPDATE
-- Løsning: Tjek Row Level Security (RLS) policies

-- Vis eksisterende RLS policies:
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'restaurants';

-- Hvis RLS blokerer, kan du midlertidigt disable det:
-- ALTER TABLE restaurants DISABLE ROW LEVEL SECURITY;

-- Test om kunder nu vises, derefter genaktiver:
-- ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;


-- Problem: Kan ikke finde min UUID
-- Løsning: Hent alle bruger UUID'er fra auth.users

SELECT id, email, created_at
FROM auth.users
WHERE email = 'martinsarvio@hotmail.com';

-- Kopier UUID'en fra output


-- Problem: Flere forskellige user_id'er i databasen
-- Løsning: Find alle unikke user_id'er og deres kunder

SELECT
  user_id,
  COUNT(*) as customer_count,
  STRING_AGG(name, ', ') as customer_names
FROM restaurants
GROUP BY user_id
ORDER BY customer_count DESC;

-- Output viser hvilke user_id'er der findes og hvor mange kunder hver har
