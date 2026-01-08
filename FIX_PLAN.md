# OrderFlow AI - Komplet Fix Plan
## Kritiske Fejl & Løsninger

**Oprettet:** 2026-01-04
**Status:** Klar til implementation

---

## 🔴 KRITISK FEJL #1: Kunder Forsvinder Efter Oprettelse

### Problem
Når du opretter "Viborg Gourmet Pizza" via `/kunder` siden forsvinder kunden og tælles ikke i "Aktive Kunder".

### Root Cause
`addRestaurantFromPage()` funktion (linje 4017-4090 i app.js):
- Opretter kunde KUN i local array med temp ID
- **Gemmer ALDRIG til Supabase database**
- Kalder `loadRestaurants()` som overskriver array med DB data
- Kunde går tabt fordi den aldrig var i databasen

### Løsning
Ændre `addRestaurantFromPage()` til at gemme til Supabase ligesom `addRestaurant()` gør.

**Fil:** `js/app.js` linje 4017-4090

**Ændringer:**
1. Gør funktionen `async`
2. Opret korrekt data-struktur med `metadata` felt
3. Kald `await SupabaseDB.createRestaurant()`
4. Brug returneret UUID i stedet for temp ID
5. Log aktivitet efter vellykket oprettelse

---

## 🔴 KRITISK FEJL #2: Søgning Finder Ikke Kunder

### Problem
Søgning efter "viborg gourmet pizza" finder ikke kunden.

### Root Cause
- Database bruger `contact_phone` felt
- Søgefunktion leder kun efter `r.phone`
- Feltet matcher ikke, så søgning fejler

### Løsning ✅ FIXED
Allerede rettet i tidligere ændringer:
- Søger nu både `r.phone` og `r.contact_phone`
- Tilføjet søgning i `address` og `city` felter
- Tabel-rendering bruger `r.phone || r.contact_phone`

---

## 🟡 VIGTIG FEJL #3: Dashboard KPI'er Opdateres Ikke

### Problem
Når kunde oprettes, viser dashboard stadig 0 aktive kunder.

### Root Cause
Dashboard KPI'er beregnes fra `restaurants[]` array som bliver overskrevet før kunde er gemt til DB.

### Løsning
Når Fejl #1 er fixet, vil dette automatisk løse sig fordi:
1. Kunde gemmes til Supabase
2. Supabase INSERT event triggers
3. `RealtimeSync.handleRestaurantChange()` opdaterer array
4. `loadDashboard()` beregner korrekte KPI'er fra opdateret array

---

## 🟡 ARKITEKTUR PROBLEM #4: Ingen Kunde-Master Tabel

### Problem Nuværende Situation
- Ordrer gemmer `customer_name` og `customer_phone`
- Ingen `customer_id` linking
- Kan ikke genkende tilbagevendende kunder
- Ingen kunde-specifikke præferencer

### Anbefalede Forbedringer (Fremtid)
1. **Opret `customers` tabel:**
   ```sql
   CREATE TABLE customers (
     id UUID PRIMARY KEY,
     user_id TEXT NOT NULL,
     phone TEXT UNIQUE NOT NULL,
     name TEXT,
     email TEXT,
     address TEXT,
     preferences JSONB DEFAULT '{}',
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **Tilføj `customer_id` til orders tabel:**
   ```sql
   ALTER TABLE orders ADD COLUMN customer_id UUID REFERENCES customers(id);
   ```

3. **Implementér kunde-lookup:**
   - Ved ny ordre: søg kunde via telefonnummer
   - Hvis findes: link med `customer_id`
   - Hvis ny: opret kunde først, så ordre

---

## 🟡 ARKITEKTUR PROBLEM #5: LocalStorage vs Supabase Sync

### Problem
- Ordrer gemmes til `localStorage.orders_module`
- Database har `orders` tabel men ingen sync
- Data går tabt ved device-skift

### Anbefalede Forbedringer (Fremtid)
1. Når ordre oprettes: gem til Supabase orders tabel
2. Tilføj `restaurant_id` foreign key
3. Tilføj `customer_id` når kunde-master er implementeret
4. Real-time sync for nye ordrer
5. Behold localStorage som offline-backup

---

## 🟢 IMPLEMENTATIONSPLAN - PRIORITERET

### FASE 1: KRITISKE FIXES (NU)
**Mål:** Fix kunde-oprettelse så "Viborg Gourmet Pizza" vises korrekt

#### Fix 1.1: Ret addRestaurantFromPage() Funktion
**Fil:** `/Users/martinsarvio/Downloads/OrderFlow-v137/js/app.js`
**Linjer:** 4017-4090

**Ændringer:**
```javascript
// BEFORE: function addRestaurantFromPage() {
// AFTER:  async function addRestaurantFromPage() {

// Opret korrekt data-struktur:
const newRestaurantData = {
  name,
  contact_phone: phone,
  contact_email: email,
  contact_name: contactPerson,
  address,
  city: '', // Hvis du har city felt i formen
  cvr,
  status: phone ? 'active' : 'pending',
  settings: {}, // Tom for nu
  metadata: {
    logo,
    owner,
    openingHours: {},
    kpi: {}
  }
};

// GEM TIL SUPABASE:
try {
  const createdRestaurant = await SupabaseDB.createRestaurant(
    currentUser.id,
    newRestaurantData
  );

  // Tilføj til local array med RIGTIG UUID
  restaurants.push(createdRestaurant);

  // Log aktivitet
  await logActivity('create', `Oprettet restaurant: ${name}`, {
    category: 'restaurant',
    subCategory: 'create',
    restaurantId: createdRestaurant.id,
    data: { name }
  });

  // Opdater UI
  loadRestaurants();
  loadDashboard();

  // Vis profil
  openCrmProfile(createdRestaurant.id);

  showToast('Restaurant oprettet!', 'success');
} catch (err) {
  console.error('❌ Fejl ved oprettelse:', err);
  showToast('Kunne ikke oprette restaurant', 'error');
}
```

#### Fix 1.2: Verificér loadDashboard() Beregninger
**Fil:** `/Users/martinsarvio/Downloads/OrderFlow-v137/js/app.js`
**Funktion:** `loadDashboard()`

**Tjek at KPI'er beregnes korrekt:**
```javascript
// Aktive kunder = restaurants med status 'active'
const activeCount = restaurants.filter(r => r.status === 'active').length;

// Pending kunder = restaurants med status 'pending'
const pendingCount = restaurants.filter(r => r.status === 'pending').length;
```

### FASE 2: VERIFIKATION (EFTER FASE 1)
1. **Test kunde-oprettelse:**
   - Opret ny kunde via `/kunder` siden
   - Verificér kunden vises i listen
   - Verificér dashboard viser korrekt antal aktive
   - Refresh browser - kunde skal stadig være der

2. **Test søgning:**
   - Søg efter "Viborg Gourmet Pizza"
   - Verificér kunde vises i søgeresultater

3. **Test Supabase sync:**
   - Åbn Supabase Dashboard → Table Editor → `restaurants`
   - Verificér ny kunde er gemt med UUID
   - Tjek `contact_phone`, `status`, `metadata` felter

### FASE 3: FORBEDRINGER (SENERE)
1. Implementér kunde-master tabel
2. Tilføj customer_id til ordrer
3. Sync localStorage ordrer til Supabase
4. Implementér kunde-specifikke workflow-indstillinger
5. Tilføj kunde-præferencer (sprog, leveringstype osv.)

---

## 📋 CHECKLISTE - FASE 1 IMPLEMENTATION

- [ ] Backup af app.js før ændringer
- [ ] Ret `addRestaurantFromPage()` til async
- [ ] Opret korrekt `newRestaurantData` struktur
- [ ] Tilføj `await SupabaseDB.createRestaurant()` kald
- [ ] Tilføj error handling (try/catch)
- [ ] Tilføj aktivitetslog ved succesfuld oprettelse
- [ ] Tilføj toast-notifikationer
- [ ] Test kunde-oprettelse i browser
- [ ] Verificér kunde vises i `/kunder`
- [ ] Verificér dashboard opdateres
- [ ] Verificér søgning finder kunde
- [ ] Verificér kunde persisterer efter refresh
- [ ] Verificér Supabase database indeholder kunde

---

## 🎯 FORVENTET RESULTAT EFTER FIX

### Før Fix:
1. Opret "Viborg Gourmet Pizza" via `/kunder` siden
2. ❌ Kunde forsvinder fra listen
3. ❌ Dashboard viser stadig 0 aktive
4. ❌ Søgning finder ikke kunden
5. ❌ Refresh = kunde væk

### Efter Fix:
1. Opret "Viborg Gourmet Pizza" via `/kunder` siden
2. ✅ Kunde vises med UUID i listen
3. ✅ Dashboard opdaterer til 1 aktiv kunde
4. ✅ Søgning finder "viborg gourmet pizza"
5. ✅ Refresh = kunde stadig der
6. ✅ Data gemt i Supabase database
7. ✅ Real-time sync virker på tværs af browser-tabs

---

## 📞 SUPPORT & DEBUGGING

### Hvis kunde stadig forsvinder:
1. Åbn DevTools Console (F12)
2. Klik "Opret Restaurant"
3. Se efter fejl i console
4. Verificér `✅ Restaurant created: <uuid>` vises
5. Tjek Supabase Dashboard → Logs → API Logs

### Hvis dashboard ikke opdateres:
1. Tjek console for `loadDashboard()` fejl
2. Verificér `restaurants[]` array indeholder ny kunde
3. Kør i console: `console.log(restaurants)`

### Hvis real-time sync ikke virker:
1. Tjek console for `✅ Subscribed to restaurant changes`
2. Verificér `RealtimeSync.initialized === true`
3. Kør i console: `RealtimeSync.cleanup()` → `RealtimeSync.init(currentUser.id)`

---

**Klar til implementation!** 🚀
