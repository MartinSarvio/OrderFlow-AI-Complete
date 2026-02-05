# 🧪 TEST GUIDE - SUPABASE INITIALIZATION FIX

**Dato:** 2026-01-04
**Formål:** Verificér at Supabase initialization fix virker og gendan forsvundne kunder

---

## ✅ STEP 1: REFRESH BROWSER & TJEK CONSOLE

### Hvad du skal gøre:

1. **Åbn** OrderFlow i browser
2. **Tryk** Cmd+Shift+R (Mac) eller Ctrl+Shift+F5 (Windows) for **hard refresh**
3. **Åbn** DevTools Console (F12 eller Cmd+Option+I)
4. **Observer** console output

### Forventet Output (SUCCESS):

```
✅ Supabase client initialized: https://qymtjhzgtcittohutmay.supabase.co
✅ SupabaseDB helper initialized (waiting for Supabase client...)
```

### Fejl Output (PROBLEM):

```
❌ ReferenceError: Can't find variable: SupabaseDB
⚠️ Supabase library not loaded yet, retrying in 100ms...
```

**Hvis du ser fejl:** Send screenshot af console til mig!

---

## ✅ STEP 2: TEST LOGIN MED UUID

### Hvad du skal gøre:

1. **Udfyld** email: `martinsarvio@hotmail.com`
2. **Udfyld** password: `Ma_93rtin`
3. **Klik** "Log ind" knappen
4. **Vent** på login at gennemføre
5. **Observer** console output

### Forventet Output (SUCCESS):

```
🔑 Attempting login with email: martinsarvio@hotmail.com
✅ Supabase client ready for user login
✅ Login successful: martinsarvio@hotmail.com
✅ Loaded restaurants: X
```

**VIGTIGT:** IKKE dette:
```
⚠️ Supabase not available, using demo login  ❌
Starting demo login with Supabase...  ❌
```

### Verificér User ID er UUID:

4. **Kør** i console:
```javascript
console.log('User ID:', currentUser.id);
console.log('User Email:', currentUser.email);
console.log('Is UUID:', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id));
```

### Forventet Output:

```
User ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
User Email: martinsarvio@hotmail.com
Is UUID: true
```

**IKKE dette:**
```
User ID: "admin-martin"  ❌
Is UUID: false  ❌
```

---

## ✅ STEP 3: TJEK OM KUNDER VISES

### Hvad du skal gøre:

1. **Gå til** Dashboard
2. **Se** om "Viborg Gourmet Pizza" og "test" kunder vises
3. **Gå til** /kunder siden
4. **Tjek** kundelisten

### Hvis kunder IKKE vises:

Det er OK! Vi skal genoprette dem fra databasen. Gå til **STEP 4**.

---

## ✅ STEP 4: FIND FORSVUNDNE KUNDER I DATABASE

### Hvad du skal gøre:

1. **Åbn** Supabase Dashboard: https://supabase.com/dashboard
2. **Login** og vælg projekt: **OrderFlow-AI-Complete**
3. **Gå til** SQL Editor (venstre sidebar)
4. **Kopier** denne SQL query:

```sql
-- Find kunder med forkert user_id
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
```

5. **Klik** "Run" eller tryk Cmd+Enter

### Forventet Resultat:

**Hvis 2 rows returneres:**
```
id                                  | name                    | user_id       | created_at
------------------------------------+-------------------------+---------------+---------------------------
abc-123-def                         | Viborg Gourmet Pizza    | admin-martin  | 2026-01-04 10:30:00+00
xyz-456-ghi                         | test                    | admin-martin  | 2026-01-04 10:32:00+00
```

✅ **Data findes!** Gå videre til STEP 5.

**Hvis 0 rows:**
```
(No rows)
```

❌ **Data blev slettet permanent.** Du skal oprette kunderne igen. Gå til STEP 7.

---

## ✅ STEP 5: HENT DIN RIGTIGE UUID

### Hvad du skal gøre:

1. **Gå tilbage** til OrderFlow browser tab
2. **Kør** i console:

```javascript
console.log('Your UUID:', currentUser.id);
```

3. **Kopier** UUID'en (eksempel: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

**Alternativt - Find UUID i Supabase:**

1. **Gå til** Supabase Dashboard → Authentication → Users
2. **Find** din email: `martinsarvio@hotmail.com`
3. **Kopier** UUID fra User ID kolonnen

---

## ✅ STEP 6: OPDATER KUNDER TIL RIGTIG UUID

### Hvad du skal gøre:

1. **Gå tilbage** til Supabase SQL Editor
2. **Kopier** denne query og **ERSTAT** `<YOUR-UUID-HERE>` med din UUID fra STEP 5:

```sql
-- VIGTIGT: Erstat <YOUR-UUID-HERE> med din faktiske UUID!
UPDATE restaurants
SET user_id = '<YOUR-UUID-HERE>'
WHERE user_id = 'admin-martin';
```

**Eksempel (BRUG IKKE DENNE - DET ER DEMO!):**
```sql
UPDATE restaurants
SET user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE user_id = 'admin-martin';
```

3. **Klik** "Run"

### Forventet Output:

```
Success. Rows affected: 2
```

✅ **Kunder opdateret!**

---

## ✅ STEP 7: VERIFICÉR KUNDER NU VISES

### Hvad du skal gøre:

1. **Gå tilbage** til OrderFlow browser tab
2. **Refresh** siden (F5 eller Cmd+R)
3. **Login** med Admin Login igen
4. **Gå til** Dashboard

### Forventet Resultat:

✅ **"Viborg Gourmet Pizza" og "test" vises nu i kundelisten!**

### Verificér i Console:

```javascript
console.log('Restaurants count:', restaurants.length);
console.table(restaurants.map(r => ({ name: r.name, user_id: r.user_id })));
```

**Forventet Output:**
```
Restaurants count: 2

┌─────────┬──────────────────────┬──────────────────────────────────────┐
│ (index) │        name          │               user_id                │
├─────────┼──────────────────────┼──────────────────────────────────────┤
│    0    │ Viborg Gourmet Pizza │ a1b2c3d4-e5f6-7890-abcd-ef1234567890 │
│    1    │        test          │ a1b2c3d4-e5f6-7890-abcd-ef1234567890 │
└─────────┴──────────────────────┴──────────────────────────────────────┘
```

✅ **SUCCESS!**

---

## ✅ STEP 8: TEST OPRET NY KUNDE (PERSISTENS TEST)

### Hvad du skal gøre:

1. **Gå til** /kunder siden
2. **Klik** "+ Tilføj Restaurant"
3. **Udfyld** formular:
   - Navn: "Test Persistens"
   - Telefon: "12345678"
4. **Klik** "Opret Restaurant"
5. **Observer** console output

### Forventet Console Output:

```
💾 Attempting to save restaurant to Supabase...
✅ Restaurant created in Supabase: <uuid>
🔵 Auto-notification added: kunder.stamdata -> "Ny restaurant oprettet: Test Persistens"
🔵 Dashboard notification added for new customer
```

**VIGTIGT:** INGEN fejl!

### Test Persistens:

6. **Refresh** browser (F5)
7. **Login** igen
8. **Verificér** "Test Persistens" stadig vises

✅ **Hvis kunden stadig vises efter refresh = SUCCESS!**

---

## ✅ STEP 9: TJEK DATABASE DIREKTE

### Hvad du skal gøre:

1. **Gå til** Supabase Dashboard → Table Editor → `restaurants`
2. **Find** "Test Persistens" kunde
3. **Tjek** `user_id` kolonnen

### Forventet:

```
name             | user_id
-----------------+--------------------------------------
Test Persistens  | a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

✅ **UUID format - KORREKT!**

**IKKE dette:**
```
Test Persistens  | admin-martin  ❌
```

---

## 🚨 TROUBLESHOOTING

### Problem 1: "ReferenceError: Can't find variable: SupabaseDB"

**Løsning:**
- Hard refresh browser (Cmd+Shift+R)
- Tjek internet forbindelse
- Verificér Supabase CDN er tilgængelig: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2
- Send screenshot til mig

---

### Problem 2: User ID er stadig "admin-martin"

**Løsning:**
- Supabase initialization timeout
- Tjek console for `⚠️ Supabase initialization timeout` besked
- Prøv at vente 5 sekunder og login igen
- Send screenshot af console

---

### Problem 3: Kunder ikke fundet i database (0 rows)

**Løsning A:** Data blev faktisk slettet
- Du skal oprette "Viborg Gourmet Pizza" og "test" igen

**Løsning B:** Tjek ALLE user_id'er
```sql
-- Find alle unikke user_id'er
SELECT
  user_id,
  COUNT(*) as antal_kunder,
  STRING_AGG(name, ', ') as kunde_navne
FROM restaurants
GROUP BY user_id
ORDER BY antal_kunder DESC;
```

Output viser hvilke user_id'er der findes.

---

### Problem 4: UPDATE query fejler

**Fejl:** `permission denied for table restaurants`

**Løsning:**
- Du skal bruge Service Role Key (allerede sat i config)
- ELLER disable Row Level Security midlertidigt:
```sql
ALTER TABLE restaurants DISABLE ROW LEVEL SECURITY;
-- Kør UPDATE query
-- Genaktiver bagefter:
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
```

---

## ✅ SUCCESS CHECKLIST

- [ ] **Console:** Ingen `ReferenceError` fejl
- [ ] **Console:** `✅ Supabase client initialized` vises
- [ ] **Login:** Bruger UUID user_id (ikke "admin-martin")
- [ ] **Database:** Fandt kunder med `user_id = 'admin-martin'`
- [ ] **Database:** Opdaterede kunder til rigtig UUID
- [ ] **UI:** "Viborg Gourmet Pizza" og "test" vises efter refresh
- [ ] **Persistens:** Ny kunde vises efter browser refresh
- [ ] **Database:** Ny kunde har UUID user_id (tjek i Table Editor)

---

## 📋 HVIS ALLE TESTS ER GRØNNE

🎉 **TILLYKKE!** Supabase initialization fix virker!

**Du har nu:**
- ✅ Stabil Supabase forbindelse
- ✅ Korrekt UUID-baseret authentication
- ✅ Kunder der persisterer korrekt
- ✅ Ingen race conditions
- ✅ Ingen data tab

**Næste skridt:**
- Brug ALTID "Admin Login" (ikke Demo Login)
- Opret nye kunder og test workflow
- Monitorér console for fejl

---

## 📞 HVIS NOGET FEJLER

**Send mig:**
1. Screenshot af browser console
2. Output fra SQL queries
3. Beskrivelse af hvad der ikke virker

Jeg hjælper med debugging! 🚀
