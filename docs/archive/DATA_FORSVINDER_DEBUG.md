# 🚨 KRITISK: Kunder Forsvinder Fra Database

**Problem:** "Viborg Gourmet Pizza" og "test" kunde er forsvundet fra databasen.

---

## 🔍 MULIGE ÅRSAGER

### Årsag 1: Row Level Security (RLS) Policies Blokerer Adgang ⚠️ MEST SANDSYNLIG

**Problem:** Supabase RLS policies kan blokere SELECT queries hvis de ikke er konfigureret korrekt.

**Hvordan det sker:**
1. Du opretter kunde med Admin Login → `user_id = "martin@email.com"`
2. Du logger ud og logger ind igen
3. Login bruger ANDEN user_id → `user_id = "forskellige-id"`
4. `getRestaurants()` søger efter `user_id = "forskellige-id"`
5. Finder INGEN kunder (fordi de har en anden user_id)
6. `restaurants = []` (tom array)
7. Kunder "forsvinder"

**VIGTIG:** Data er STADIG i databasen - men kan ikke hentes pga. user_id mismatch!

---

### Årsag 2: Service Role Key vs Anon Key

**Problem:** Du bruger muligvis forskellige API keys.

**Service Role Key:**
- Fuld database adgang
- Ignorer RLS policies
- Bruges i development

**Anon Key:**
- Begrænset adgang
- RLS policies anvendes
- Bruges i produktion

**Hvis du skifter mellem keys, kan data være "synlig" med service key men "usynlig" med anon key.**

---

### Årsag 3: Database blev Faktisk Slettet (Mindre Sandsynligt)

**Mulige scenarier:**
- Nogen kaldte `deleteRestaurant()` ved et uheld
- Database blev reset/clearet
- Supabase projekt blev genoprettet fra backup

---

## 🧪 DEBUG PROCEDURE

### Step 1: Tjek Om Data Eksisterer i Supabase

1. **Åbn** Supabase Dashboard: https://supabase.com/dashboard
2. **Login** og vælg projekt: **OrderFlow-AI-Complete**
3. **Gå til** Table Editor → `restaurants` tabel
4. **Tjek** om "Viborg Gourmet Pizza" og "test" findes

**Hvis data FINDES i tabellen:**
→ Problemet er RLS policies eller user_id mismatch (gå til Step 2)

**Hvis data IKKE findes:**
→ Data blev faktisk slettet (gå til Step 4)

---

### Step 2: Verificer User ID Konsistens

1. **Åbn** browser DevTools Console (F12)
2. **Login** i systemet
3. **Kør** i console:
```javascript
console.log('Current user ID:', currentUser.id);
console.log('Current user email:', currentUser.email);
```

4. **Gå til** Supabase Dashboard → Table Editor → `restaurants`
5. **Tjek** `user_id` kolonne for "Viborg Gourmet Pizza"
6. **Sammenlign** user_id fra console med user_id i database

**Hvis de IKKE matcher:**
→ Du logger ind med forskellige konti

**Hvis de MATCHER:**
→ RLS policies blokerer adgang (gå til Step 3)

---

### Step 3: Verificer RLS Policies

1. **Gå til** Supabase Dashboard → Authentication → Policies
2. **Find** policies for `restaurants` tabel
3. **Tjek** SELECT policy

**Forventet SELECT policy:**
```sql
CREATE POLICY "Users can view their own restaurants" ON restaurants
FOR SELECT
USING (auth.uid() = user_id OR user_id = current_user_id());
```

**Hvis policy mangler eller er forkert:**
→ Opret korrekt policy (se Step 5)

---

### Step 4: Tjek Delete History (Hvis Data Ikke Findes)

1. **Åbn** browser DevTools Console
2. **Kør:**
```javascript
// Tjek aktivitetslog for delete events
const activities = JSON.parse(localStorage.getItem('orderflow_activity_log') || '[]');
const deletes = activities.filter(a => a.type === 'delete' || a.description.includes('slettet'));
console.table(deletes);
```

**Hvis delete events findes:**
→ Kunder blev slettet ved et uheld

**Hvis ingen delete events:**
→ Data blev aldrig gemt korrekt

---

## 🛠️ LØSNINGER

### Løsning A: Fix User ID Mismatch

**Hvis du bruger DEMO LOGIN:**

Demo login opretter local user uden Supabase auth:
```javascript
currentUser = {
  id: 'demo-user',
  email: 'demo@orderflow.ai',
  role: 'admin'
};
```

**Men når kunde oprettes, gemmes den med:**
```javascript
user_id = currentUser.id  // = 'demo-user'
```

**Næste gang du logger ind med ADMIN LOGIN:**
```javascript
currentUser = {
  id: 'actual-uuid-from-supabase',  // FORSKELLIG!
  email: 'MartinSarvio@hotmail.com',
  role: 'admin'
};
```

**FIX:**

**Brug KUN Admin Login:**
1. Log altid ind med "Admin Login" knappen
2. IKKE "Demo Login"
3. Dette sikrer konsistent user_id

---

### Løsning B: Deaktiver RLS for Development (MIDLERTIDIG)

**ADVARSEL:** Dette fjerner sikkerhed - kun til debugging!

1. **Gå til** Supabase Dashboard → Table Editor → `restaurants`
2. **Klik** på tabellen → Settings gear icon
3. **Find** "Row Level Security"
4. **Slå den FRA** (midlertidigt)
5. **Test** om data nu vises

**Hvis data vises efter RLS er slået fra:**
→ RLS policies er problemet

**Genaktiver RLS efter test og opret korrekte policies!**

---

### Løsning C: Opret Korrekte RLS Policies

**SQL til at køre i Supabase SQL Editor:**

```sql
-- Fjern eksisterende policies (hvis de findes)
DROP POLICY IF EXISTS "Users can view their own restaurants" ON restaurants;
DROP POLICY IF EXISTS "Users can insert their own restaurants" ON restaurants;
DROP POLICY IF EXISTS "Users can update their own restaurants" ON restaurants;
DROP POLICY IF EXISTS "Users can delete their own restaurants" ON restaurants;

-- Opret nye policies

-- SELECT: Se egne restaurants
CREATE POLICY "Users can view their own restaurants" ON restaurants
FOR SELECT
USING (user_id = current_setting('app.user_id', true));

-- INSERT: Oprette restaurants
CREATE POLICY "Users can insert their own restaurants" ON restaurants
FOR INSERT
WITH CHECK (user_id = current_setting('app.user_id', true));

-- UPDATE: Opdatere egne restaurants
CREATE POLICY "Users can update their own restaurants" ON restaurants
FOR UPDATE
USING (user_id = current_setting('app.user_id', true))
WITH CHECK (user_id = current_setting('app.user_id', true));

-- DELETE: Slette egne restaurants
CREATE POLICY "Users can delete their own restaurants" ON restaurants
FOR DELETE
USING (user_id = current_setting('app.user_id', true));

-- Enable RLS
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
```

---

### Løsning D: Gendan Data (Hvis Slettet)

**Hvis data blev slettet og du har backup:**

1. **Gå til** Supabase Dashboard → Database → Backups
2. **Find** backup fra før sletning
3. **Restore** tabellen

**Hvis ingen backup:**

Du skal oprette kunderne igen:
1. Login med Admin Login
2. Gå til /kunder
3. Opret "Viborg Gourmet Pizza" igen
4. Opret "test" igen

---

## 📊 DEBUGGING COMMANDS

Kør disse i browser console for at diagnosticere:

### Tjek Current User
```javascript
console.log('User:', currentUser);
console.log('User ID:', currentUser?.id);
console.log('User Email:', currentUser?.email);
```

### Tjek Restaurants Array
```javascript
console.log('Restaurants count:', restaurants.length);
console.table(restaurants);
```

### Forsøg Manuel Data Fetch
```javascript
// Hent direkte fra Supabase
if (typeof SupabaseDB !== 'undefined' && currentUser) {
  SupabaseDB.getRestaurants(currentUser.id)
    .then(data => {
      console.log('✅ Fetched from Supabase:', data.length);
      console.table(data);
    })
    .catch(err => {
      console.error('❌ Error:', err);
    });
}
```

### Tjek RLS Fejl
```javascript
// Dette vil vise hvis RLS blokerer
supabase.from('restaurants').select('*')
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ RLS Error:', error);
    } else {
      console.log('✅ RLS OK, found:', data.length);
      console.table(data);
    }
  });
```

---

## ✅ FOREBYGGELSE - Undgå Fremtidige Data Tab

### 1. Brug Kun Admin Login i Development
- IKKE Demo Login
- Konsistent user_id

### 2. Implementer Soft Delete
I stedet for at slette data permanent, marker som deleted:

```javascript
async function deleteRestaurant(id) {
  // IKKE dette:
  // await SupabaseDB.deleteRestaurant(id);

  // GØR dette i stedet:
  await SupabaseDB.updateRestaurant(id, {
    status: 'deleted',
    deleted_at: new Date().toISOString()
  });
}
```

### 3. Tilføj Confirmation til Delete
```javascript
if (confirm(`Er du SIKKER på du vil slette "${restaurant.name}"?`)) {
  if (confirm('ADVARSEL: Dette kan ikke fortrydes! Fortsæt?')) {
    // Først nu slettes data
    await deleteRestaurant(id);
  }
}
```

### 4. Implementer Data Backup
```javascript
// Før sletning, gem backup
function backupBeforeDelete(restaurant) {
  const backups = JSON.parse(localStorage.getItem('deleted_backups') || '[]');
  backups.push({
    ...restaurant,
    deleted_at: new Date().toISOString()
  });
  localStorage.setItem('deleted_backups', JSON.stringify(backups));
}
```

---

## 🚀 HURTIG FIX - STEP BY STEP

**Hvis du vil have data tilbage NU:**

1. **Åbn** Supabase Dashboard
2. **Gå til** Table Editor → `restaurants`
3. **Tjek** om data findes
4. **Hvis JA:** Tjek `user_id` og sammenlign med din current user
5. **Hvis user_id mismatch:** Opret ny kunde med KORREKT login
6. **Hvis NEJ:** Data er væk - opret kunderne igen

**Debugging output at sende til mig:**

Kør dette i console og send output:
```javascript
console.log('=== DEBUG INFO ===');
console.log('Current user:', currentUser);
console.log('Restaurants count:', restaurants.length);
console.log('Restaurants:', restaurants);

// Test Supabase fetch
if (typeof SupabaseDB !== 'undefined' && currentUser) {
  SupabaseDB.getRestaurants(currentUser.id)
    .then(data => console.log('Supabase returned:', data))
    .catch(err => console.error('Supabase error:', err));
}
```

---

**Oprettet:** 2026-01-04
**Prioritet:** KRITISK
**Næste Skridt:** Kør debugging commands og send output
