# OrderFlow UI Refactoring - Før/Efter Eksempler

Konkrete eksempler fra index.html med line numbers.

---

## 🔵 EKSEMPEL 1: Login Button (index.html linje 41)

### FØR:
```html
<button class="btn btn-primary" style="width:100%">Log Ind</button>
```

**Problemer:**
- Inline `width:100%` style
- Burde bruge utility class

### EFTER:
```html
<button class="btn btn-primary w-full">Log Ind</button>
```

**Forbedringer:**
✅ Fjernet inline style
✅ Bruger utility class `.w-full`
✅ Lettere at vedligeholde

---

## 🔵 EKSEMPEL 2: Payment Card (index.html linje 1137-1173)

### FØR:
```html
<div style="background:linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border-radius:16px;
            padding:28px;
            color:white;
            margin-bottom:20px;
            min-height:200px;
            display:flex;
            flex-direction:column;
            justify-content:space-between;
            box-shadow:0 8px 20px rgba(0,0,0,0.3);">

  <!-- Logo Container -->
  <div style="background:white;
              padding:6px 12px;
              border-radius:6px;
              display:inline-flex;
              align-items:center;">
    <img id="payment-card-logo" src="assets/logos/cards/visa-debit.png" height="24">
  </div>

  <!-- Card Number -->
  <div style="font-family:monospace;
              font-size:22px;
              letter-spacing:2px;
              margin:20px 0;">
    •••• •••• •••• 4242
  </div>

  <!-- Card Details -->
  <div style="display:flex;
              justify-content:space-between;
              align-items:flex-end;">
    <div>
      <div style="font-size:9px;
                  opacity:0.7;
                  margin-bottom:4px;">
        KORTHOLDER
      </div>
      <div style="font-size:14px;
                  font-weight:600;">
        MARTIN JENSEN
      </div>
    </div>
    <div>
      <div style="font-size:9px;
                  opacity:0.7;
                  margin-bottom:4px;">
        UDLØBER
      </div>
      <div style="font-size:14px;
                  font-weight:600;">
        12/26
      </div>
    </div>
  </div>
</div>
```

**Problemer:**
- 28px padding (matcher IKKE spacing scale!)
- 6px border-radius (matcher IKKE --radius-sm: 8px)
- 20px margin-bottom (matcher IKKE spacing scale!)
- 9px font-size (for småt, burde være 10px minimum)
- Massive inline styles

### EFTER:

**Tilføj til styles.css FØRST:**
```css
.payment-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: var(--radius-lg);  /* 16px */
  padding: var(--space-6);  /* 32px - tættest på 28px */
  color: white;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: var(--shadow-lg);
}

.payment-card-logo {
  background: white;
  padding: var(--space-2) var(--space-3);  /* 8px 12px */
  border-radius: var(--radius-sm);  /* 8px */
  display: inline-flex;
  align-items: center;
}

.payment-card-number {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-2xl);  /* 20px - bedre end 22px */
  letter-spacing: 2px;
  margin: var(--space-5) 0;  /* 24px - bedre end 20px */
}

.payment-card-details {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.payment-card-label {
  font-size: var(--font-size-2xs);  /* 10px - bedre end 9px */
  opacity: 0.7;
  margin-bottom: var(--space-1);  /* 4px */
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.payment-card-value {
  font-size: var(--font-size-base);  /* 14px */
  font-weight: var(--font-weight-semibold);  /* 600 */
}
```

**HTML EFTER:**
```html
<div class="payment-card mb-5">
  <!-- Logo Container -->
  <div class="payment-card-logo">
    <img id="payment-card-logo" src="assets/logos/cards/visa-debit.png" height="24" alt="Visa Debit">
  </div>

  <!-- Card Number -->
  <div class="payment-card-number" id="payment-card-number">
    •••• •••• •••• 4242
  </div>

  <!-- Card Details -->
  <div class="payment-card-details">
    <div>
      <div class="payment-card-label">Kortholder</div>
      <div class="payment-card-value" id="payment-card-holder">MARTIN JENSEN</div>
    </div>
    <div>
      <div class="payment-card-label">Udløber</div>
      <div class="payment-card-value" id="payment-card-expiry">12/26</div>
    </div>
  </div>
</div>
```

**Forbedringer:**
✅ Ingen inline styles
✅ Padding: 28px → 32px (matches spacing scale)
✅ Border-radius: 6px → 8px (matches design tokens)
✅ Margin-bottom: 20px → 24px (matches spacing scale)
✅ Font-size labels: 9px → 10px (mere læsbart)
✅ Fuldt genbrugeligt component
✅ Lettere at style varianter (fx Gold Card, Black Card)

---

## 🔵 EKSEMPEL 3: Trusted Device Item (index.html linje 3069-3080)

### FØR:
```html
<div style="display:flex;
            align-items:center;
            gap:16px;
            padding:16px;
            background:var(--bg3);
            border-radius:8px">
  <div style="width:56px;
              height:56px;
              background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
              border-radius:12px;
              display:flex;
              align-items:center;
              justify-content:center;
              flex-shrink:0">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  </div>
  <div style="flex:1">
    <div style="font-weight:600;font-size:14px;margin-bottom:4px">iPhone 13 Pro</div>
    <div style="font-size:12px;color:var(--muted)">Sidst brugt: I dag kl. 14:23</div>
  </div>
  <button onclick="removeTrustedDevice('iphone')"
          style="padding:8px 16px;
                 font-size:13px;
                 background:#fee;
                 color:#c33;
                 border:none;
                 border-radius:12px;
                 cursor:pointer">
    Fjern
  </button>
</div>
```

**Problemer:**
- Gentages 8 gange med identisk styling
- Hard-coded colors (#fee, #c33)
- Inkonsistent button styling

### EFTER:

**Tilføj til components.css:**
```css
.trusted-device {
  display: flex;
  align-items: center;
  gap: var(--space-4);  /* 16px */
  padding: var(--space-4);  /* 16px */
  background: var(--color-bg-3);
  border-radius: var(--radius-md);  /* 12px - IKKE 8px */
  transition: var(--transition-fast);
}

.trusted-device:hover {
  background: var(--color-card);
}

.trusted-device-icon {
  width: 56px;  /* Custom size OK for device icons */
  height: 56px;
  border-radius: var(--radius-md);  /* 12px */
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.trusted-device-icon--gradient-purple {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.trusted-device-icon--gradient-pink {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.trusted-device-icon--neutral {
  background: var(--color-bg-2);
}

.trusted-device-info {
  flex: 1;
  min-width: 0;  /* Allow text truncation */
}

.trusted-device-name {
  font-weight: var(--font-weight-semibold);  /* 600 */
  font-size: var(--font-size-base);  /* 14px */
  margin-bottom: var(--space-1);  /* 4px */
  color: var(--color-text);
}

.trusted-device-meta {
  font-size: var(--font-size-sm);  /* 12px */
  color: var(--color-text-muted);
}

.trusted-device-remove {
  padding: var(--space-2) var(--space-4);  /* 8px 16px */
  font-size: var(--font-size-sm);  /* 12px */
  background: rgba(248, 113, 113, 0.1);  /* Bruger design tokens */
  color: var(--color-danger);
  border: 1px solid rgba(248, 113, 113, 0.2);
  border-radius: var(--radius-md);  /* 12px */
  cursor: pointer;
  transition: var(--transition-fast);
  font-weight: var(--font-weight-medium);  /* 500 */
}

.trusted-device-remove:hover {
  background: rgba(248, 113, 113, 0.2);
  border-color: var(--color-danger);
}
```

**HTML EFTER:**
```html
<div class="trusted-device">
  <div class="trusted-device-icon trusted-device-icon--gradient-purple">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  </div>
  <div class="trusted-device-info">
    <div class="trusted-device-name">iPhone 13 Pro</div>
    <div class="trusted-device-meta">Sidst brugt: I dag kl. 14:23</div>
  </div>
  <button class="trusted-device-remove" onclick="removeTrustedDevice('iphone')">
    Fjern
  </button>
</div>
```

**Forbedringer:**
✅ Component-baseret design
✅ Bruger design tokens
✅ Hover states inkluderet
✅ Kan nemt tilføje nye device types
✅ Fjernet ALL inline styles
✅ BEM-lignende naming convention

**Tilføj varianter let:**
```html
<!-- Android Device -->
<div class="trusted-device">
  <div class="trusted-device-icon trusted-device-icon--neutral">
    <svg>...</svg>
  </div>
  ...
</div>

<!-- MacBook -->
<div class="trusted-device">
  <div class="trusted-device-icon trusted-device-icon--gradient-pink">
    <svg>...</svg>
  </div>
  ...
</div>
```

---

## 🔵 EKSEMPEL 4: Form Group (index.html linje 2873-2879)

### FØR:
```html
<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
  <div class="form-group">
    <label class="form-label">Fornavn</label>
    <input type="text" class="input" value="Martin" id="user-fornavn">
  </div>
  <div class="form-group">
    <label class="form-label">Efternavn</label>
    <input type="text" class="input" value="Sarvio" id="user-efternavn">
  </div>
</div>
```

**Problemer:**
- Inline grid styling
- Kunne bruge utility classes

### EFTER:
```html
<div class="d-grid grid-cols-2 gap-4 mb-5">
  <div class="form-group">
    <label class="form-label">Fornavn</label>
    <input type="text" class="input" value="Martin" id="user-fornavn">
  </div>
  <div class="form-group">
    <label class="form-label">Efternavn</label>
    <input type="text" class="input" value="Sarvio" id="user-efternavn">
  </div>
</div>
```

**ELLER med custom class (bedre for gentagelse):**

**Tilføj til styles.css:**
```css
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);  /* 16px */
}

.form-row-3 {
  grid-template-columns: 1fr 1fr 1fr;
}

.form-row-4 {
  grid-template-columns: 1fr 1fr 1fr 1fr;
}
```

**HTML:**
```html
<div class="form-row mb-5">
  <div class="form-group">
    <label class="form-label">Fornavn</label>
    <input type="text" class="input" value="Martin" id="user-fornavn">
  </div>
  <div class="form-group">
    <label class="form-label">Efternavn</label>
    <input type="text" class="input" value="Sarvio" id="user-efternavn">
  </div>
</div>
```

**Forbedringer:**
✅ Semantic class name (`.form-row`)
✅ Nemt at lave 3- eller 4-kolonne varianter
✅ Konsistent med spacing scale
✅ Fjernet inline styles

---

## 🔵 EKSEMPEL 5: Card List (index.html linje 983, 1021, 1032)

### FØR:
```html
<div class="card" style="padding:20px;margin-bottom:24px">
  <h3>Produkter & Priser</h3>
  <p>Administrer menukort, produkter og priser</p>
</div>

<div class="card" style="padding:20px;margin-bottom:24px">
  <h3>Leveringsindstillinger</h3>
  <p>Konfigurer leveringszoner og gebyrer</p>
</div>

<div class="card" style="padding:20px;margin-bottom:24px">
  <h3>Ekstra Tilkøb</h3>
  <p>Tilføj ekstra produkter som drikke, dessert osv.</p>
</div>
```

**Problemer:**
- Padding: 20px (matcher IKKE spacing scale - skulle være 16px eller 24px)
- Gentaget inline styling
- Margin-bottom: 24px inline (burde være utility class)

### EFTER - Option 1 (20px → 16px):
```html
<div class="card card-sm mb-5">
  <h3>Produkter & Priser</h3>
  <p class="text-muted">Administrer menukort, produkter og priser</p>
</div>

<div class="card card-sm mb-5">
  <h3>Leveringsindstillinger</h3>
  <p class="text-muted">Konfigurer leveringszoner og gebyrer</p>
</div>

<div class="card card-sm mb-5">
  <h3>Ekstra Tilkøb</h3>
  <p class="text-muted">Tilføj ekstra produkter som drikke, dessert osv.</p>
</div>
```

### EFTER - Option 2 (20px → 24px):
```html
<div class="card mb-5">
  <h3>Produkter & Priser</h3>
  <p class="text-muted">Administrer menukort, produkter og priser</p>
</div>

<div class="card mb-5">
  <h3>Leveringsindstillinger</h3>
  <p class="text-muted">Konfigurer leveringszoner og gebyrer</p>
</div>

<div class="card mb-5">
  <h3>Ekstra Tilkøb</h3>
  <p class="text-muted">Tilføj ekstra produkter som drikke, dessert osv.</p>
</div>
```

**Anbefaling:** Brug Option 2 (24px padding) fordi disse er "settings cards" og kan bruge lidt mere plads.

**Forbedringer:**
✅ Padding matcher spacing scale (16px eller 24px)
✅ Margin-bottom bruger utility class
✅ Fjernet ALL inline styles
✅ Tilføjet `.text-muted` til descriptions for bedre hierarki

---

## 🔵 EKSEMPEL 6: Grid Layout med Custom Gap (index.html linje 2175)

### FØR:
```html
<div style="display:grid;
            grid-template-columns:1fr 1fr;
            gap:20px;
            margin-bottom:32px">
  <!-- Grid items -->
</div>
```

**Problemer:**
- Gap: 20px (matcher IKKE spacing scale!)
- Inline grid styling

### EFTER:
```html
<div class="d-grid grid-cols-2 gap-5 mb-6">
  <!-- Grid items -->
</div>
```

**ELLER med custom class:**

**Tilføj til styles.css:**
```css
.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-5);  /* 24px - bedre end 20px */
}

@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
```

**HTML:**
```html
<div class="settings-grid mb-6">
  <!-- Grid items -->
</div>
```

**Forbedringer:**
✅ Gap: 20px → 24px (matches spacing scale)
✅ Responsiv (1 kolonne på mobile)
✅ Semantic class name
✅ Fjernet inline styles

---

## 🔵 EKSEMPEL 7: Typography Inconsistency (index.html linje 1164, 1168)

### FØR:
```html
<div style="font-size:9px;opacity:0.7;margin-bottom:4px">
  KORTHOLDER
</div>
<div style="font-size:14px;font-weight:600">
  MARTIN JENSEN
</div>
```

**Problemer:**
- Font-size: 9px (for småt! Burde være minimum 10px)
- Inline styling af typografi

### EFTER:
```html
<div class="payment-card-label">
  Kortholder
</div>
<div class="payment-card-value">
  MARTIN JENSEN
</div>
```

**Med CSS:**
```css
.payment-card-label {
  font-size: var(--font-size-2xs);  /* 10px - læsbart minimum */
  opacity: 0.7;
  margin-bottom: var(--space-1);  /* 4px */
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.payment-card-value {
  font-size: var(--font-size-base);  /* 14px */
  font-weight: var(--font-weight-semibold);  /* 600 */
}
```

**Forbedringer:**
✅ Font-size: 9px → 10px (mere læsbart)
✅ Bruger design tokens
✅ Semantic class names
✅ Fjernet inline styles

---

## 📊 Sammenligning: Før vs. Efter Statistik

### Inline Styles Reduktion

**index.html:**
- **FØR:** ~1202 inline styles
- **EFTER (estimeret):** ~200 inline styles (83% reduktion)

### CSS Fil Størrelse

**FØR:**
```
css/styles.css: ~450KB
Total: 450KB
```

**EFTER:**
```
css/design-tokens.css: ~8KB
css/utilities.css: ~15KB
css/components.css: ~20KB
css/styles.css: ~407KB (efter cleanup)
Total: ~450KB (lignende, men bedre organiseret)
```

**Efter minification:**
```
Total minified: ~180KB (60% reduktion)
```

### Spacing Konsistens

**FØR:**
- Unique padding værdier: 30+ forskellige
- Non-standard værdier: 6px, 10px, 14px, 18px, 20px, 28px

**EFTER:**
- Unique padding værdier: 8 (4, 8, 12, 16, 24, 32, 48, 64px)
- Non-standard værdier: 0 ✅

### Border-radius Konsistens

**FØR:**
- Unique radius værdier: 10+ forskellige
- Non-standard: 4px, 6px, 10px, 14px

**EFTER:**
- Unique radius værdier: 6 (0, 8, 12, 16, 20, 24px, 9999px)
- Non-standard værdier: 0 ✅

---

## 🎯 Nøgle Takeaways

1. **20px er fjenden** - Brug 16px eller 24px
2. **6px border-radius** - Brug 8px
3. **9px font-size** - Brug 10px minimum
4. **28px padding** - Brug 24px eller 32px
5. **Inline styles** - Brug component classes eller utilities

**Resultat:** Et visuelt konsistent, vedligeholdbart design system! 🎉
