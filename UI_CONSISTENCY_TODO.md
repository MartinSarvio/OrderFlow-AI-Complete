# OrderFlow UI Konsistens - Prioriteret TODO Liste

**Status:** 🔴 Ikke påbegyndt
**Estimeret Total Tid:** 6-8 timer
**Sidste Opdateret:** Januar 2026

---

## 🚨 KRITISKE OPGAVER (Må IKKE skippes)

### ✅ FASE 0: Setup & Forberedelse (15 minutter)

- [ ] **Import nye CSS filer i index.html**
  - Placering: Efter `<link rel="stylesheet" href="css/styles.css">`
  - Tilføj:
    ```html
    <link rel="stylesheet" href="css/design-tokens.css">
    <link rel="stylesheet" href="css/utilities.css">
    <link rel="stylesheet" href="css/components.css">
    ```
  - Verificer load i DevTools Network tab

- [ ] **Backup af eksisterende filer**
  ```bash
  cp index.html index.html.backup
  cp css/styles.css css/styles.css.backup
  ```

- [ ] **Tag screenshots af kritiske sider**
  - Dashboard
  - Brugerindstillinger
  - Workflow page
  - Modals

---

## 🔴 HØYESTE PRIORITET (Gør FØRST)

### 1️⃣ Spacing Scale Violations (2 timer)

**Disse værdier SKAL elimineres:**

#### **A. Fjern 20px padding på cards**
Antal: ~9 forekomster
Filer: `index.html` linje 983, 1021, 1032, 1063, 1077, 1240, 1244, 1260, 1798

**Action:**
```bash
# Søg efter alle forekomster
grep -n 'class="card" style="padding:20px' index.html

# Find & Replace
# FØR: <div class="card" style="padding:20px
# EFTER: <div class="card
```

**Beslutning:**
- Brug standard `.card` (24px padding) for consistency
- ELLER brug `.card-sm` (16px) hvis plads er tight

#### **B. Fix 28px padding (Payment Card)**
Antal: 1 forekomst
Filer: `index.html` linje 1137

**Action:**
```html
<!-- FØR -->
<div style="padding:28px;">

<!-- EFTER -->
<div class="payment-card">  <!-- 32px padding i CSS -->
```

**Skal oprette `.payment-card` class i styles.css** (se BEFORE_AFTER_EXAMPLES.md)

#### **C. Fix 6px border-radius**
Antal: ~5 forekomster
Filer: `index.html` linje 1141, 2505, 2511, 2623

**Action:**
```bash
# Søg
grep -n 'border-radius:6px' index.html

# Replace med
border-radius:var(--radius-sm)  /* 8px */
```

#### **D. Fix margin-bottom:20px**
Antal: ~30+ forekomster
Filer: index.html (hele filen)

**Action:**
```bash
# Søg
grep -n 'margin-bottom:20px' index.html

# Beslut per case:
# - Stor spacing: class="mb-5"  (24px)
# - Lille spacing: class="mb-4" (16px)
```

**Regel:**
- Cards/Sections → `mb-5` (24px)
- Form groups → `mb-4` (16px)
- List items → `mb-3` (12px)

---

### 2️⃣ Button Consistency (1 time)

#### **A. Fjern inline width på buttons**
Antal: ~4 forekomster
Filer: `index.html` linje 41, 57, 61, 1173

**Action:**
```html
<!-- FØR -->
<button class="btn btn-primary" style="width:100%">Log Ind</button>

<!-- EFTER -->
<button class="btn btn-primary w-full">Log Ind</button>
```

**Søg & Erstat:**
```regex
Find: (class="btn[^"]*")\s*style="width:100%"
Replace: $1 w-full
```

#### **B. Standardiser button padding**
Antal: ~10 forekomster
Custom padding values: `6px 12px`, `8px 16px`, `10px 18px`

**Action:**
```html
<!-- FØR -->
<button style="padding:6px 12px;font-size:13px">...</button>

<!-- EFTER -->
<button class="btn btn-sm">...</button>
```

**Mapping:**
- `padding:6px 12px` → `.btn-sm` (faktisk bliver `4px 12px`)
- `padding:10px 18px` → `.btn` (bliver `8px 16px`)
- `padding:12px 24px` → `.btn-lg`

---

### 3️⃣ Typography Standardization (1 time)

#### **A. Fix 9px font-size (TOO SMALL!)**
Antal: 2 forekomster
Filer: `index.html` linje 1164, 1168 (Payment Card labels)

**Action:**
```html
<!-- FØR -->
<div style="font-size:9px;opacity:0.7">KORTHOLDER</div>

<!-- EFTER -->
<div class="payment-card-label">Kortholder</div>
```

**CSS:**
```css
.payment-card-label {
  font-size: var(--font-size-2xs);  /* 10px minimum! */
  opacity: 0.7;
}
```

#### **B. Standardiser inline font-sizes**
Antal: ~50+ forekomster
Værdier: 11px, 12px, 13px, 14px, 16px, 18px, 24px

**Mapping:**
| Inline | Utility Class | Actual Size |
|--------|---------------|-------------|
| `font-size:11px` | `text-xs` | 11px |
| `font-size:12px` | `text-sm` | 12px |
| `font-size:13px` | `text-sm` | 12px (eller `text-base` hvis vigtig) |
| `font-size:14px` | `text-base` | 14px |
| `font-size:16px` | `text-lg` | 16px |
| `font-size:18px` | `text-xl` | 18px |

**Action:**
```bash
# Find alle inline font-sizes
grep -n 'font-size:[0-9]' index.html | wc -l

# Erstat manuelt baseret på kontekst
```

---

## 🟡 MEDIUM PRIORITET

### 4️⃣ Trusted Devices Refactoring (1 time)

**Antal komponenter:** 8 identiske
**Filer:** `index.html` linje 3069-3162
**Problem:** Massive duplicate inline styles

**Action:**
1. Opret `.trusted-device` component (se BEFORE_AFTER_EXAMPLES.md)
2. Erstat alle 8 forekomster

**Før (Linje 3069-3080):**
```html
<div style="display:flex;align-items:center;gap:16px;padding:16px;...">
  <div style="width:56px;height:56px;background:linear-gradient...">...</div>
  <div style="flex:1">...</div>
  <button style="padding:8px 16px;...">Fjern</button>
</div>
```

**Efter:**
```html
<div class="trusted-device">
  <div class="trusted-device-icon trusted-device-icon--gradient-purple">...</div>
  <div class="trusted-device-info">...</div>
  <button class="trusted-device-remove">Fjern</button>
</div>
```

**Estimeret reduktion:** ~350 lines → ~80 lines

---

### 5️⃣ Grid Layouts (30 minutter)

#### **A. Fix gap:20px**
Antal: ~10 forekomster
Problem: 20px matcher IKKE spacing scale

**Action:**
```html
<!-- FØR -->
<div style="display:grid;gap:20px">

<!-- EFTER -->
<div class="d-grid gap-5">  <!-- 24px -->
```

#### **B. Opret .form-row class**
Antal: Genbruges ~5 gange
Problem: Gentaget `grid-template-columns:1fr 1fr`

**Tilføj til styles.css:**
```css
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);  /* 16px */
}

.form-row-3 { grid-template-columns: repeat(3, 1fr); }
.form-row-4 { grid-template-columns: repeat(4, 1fr); }
```

**Brug:**
```html
<div class="form-row mb-5">
  <div class="form-group">...</div>
  <div class="form-group">...</div>
</div>
```

---

### 6️⃣ Card Variants (30 minutter)

**Problem:** Mange cards med forskellige padding men ingen clear pattern

**Action:**
1. Audit alle `.card` elementer
2. Kategoriser i små/medium/large
3. Anvend variants:
   - `.card-sm` (16px padding)
   - `.card` (24px padding - default)
   - `.card-lg` (32px padding)

**Søg:**
```bash
grep -n '<div class="card"' index.html | grep -i style
```

---

## 🟢 LAV PRIORITET (Nice-to-have)

### 7️⃣ Color Standardization (30 minutter)

**Problem:** Hard-coded colors i stedet for CSS variables

**Eksempler:**
- `color:#c33` → `color:var(--color-danger)`
- `background:#fee` → `background:var(--color-danger-dim)`
- `color:white` → `color:var(--color-text)` ELLER bare fjern (hvis white er default)

**Action:**
```bash
# Find hard-coded hex colors
grep -n 'color:#[0-9a-fA-F]' index.html

# Find hard-coded color names
grep -n "color:white\|color:black" index.html
```

---

### 8️⃣ Opret Missing Utility Classes (30 minutter)

**Tilføj til utilities.css hvis ikke findes:**

```css
/* Grid utilities */
.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

/* Aspect Ratio */
.aspect-square { aspect-ratio: 1 / 1; }
.aspect-video { aspect-ratio: 16 / 9; }

/* Object Fit */
.object-cover { object-fit: cover; }
.object-contain { object-fit: contain; }
```

---

### 9️⃣ Cleanup styles.css (1 time)

**Problem:** Potentielle duplicate definitions mellem styles.css og components.css

**Action:**
1. Find duplicates:
   ```bash
   # Check for .btn definitions
   grep -n "\.btn[^a-z]" css/styles.css
   grep -n "\.btn[^a-z]" css/components.css
   ```

2. Keep komponenter i `components.css`, fjern fra `styles.css`

3. Tilføj kommentar i `styles.css`:
   ```css
   /* Button styles moved to components.css */
   ```

---

## 📊 PROGRESS TRACKING

### Completion Metrics

**Inline Styles Reduktion:**
- [ ] **Target:** Fra 1202 → 200 (83% reduktion)
- [ ] **Current:** ___ inline styles remaining

**Spacing Violations:**
- [ ] **20px eliminated:** 0 / ~40 forekomster
- [ ] **6px border-radius fixed:** 0 / 5 forekomster
- [ ] **28px padding fixed:** 0 / 1 forekomst

**Typography:**
- [ ] **9px font-size fixed:** 0 / 2 forekomster
- [ ] **Inline font-sizes reduced:** 0 / ~50 forekomster

**Components Created:**
- [ ] `.payment-card` component
- [ ] `.trusted-device` component
- [ ] `.form-row` utility class

---

## 🧪 TESTING CHECKLIST

Efter hver fase, test følgende:

### Visual Regression
- [ ] Dashboard looks identical (±4px acceptable)
- [ ] Brugerindstillinger page intact
- [ ] Cards align properly
- [ ] Buttons samme størrelse

### Functionality
- [ ] Alle buttons clickable
- [ ] Forms submit korrekt
- [ ] Modals åbner/lukker
- [ ] Hover states virker

### Responsiveness
- [ ] Test på 375px (mobile)
- [ ] Test på 768px (tablet)
- [ ] Test på 1440px (desktop)

### Cross-browser
- [ ] Chrome
- [ ] Firefox
- [ ] Safari

---

## 🚀 QUICK WINS (Hurtig ROI)

**Start med disse for øjeblikkelig impact:**

1. **Import CSS filer** (5 min) → Giver foundation
2. **Fix 20px padding på cards** (15 min) → Biggest visual impact
3. **Fix button width inline styles** (10 min) → Easy regex replace
4. **Fix 9px font-size** (5 min) → Accessibility win

**Total: 35 minutter for 30% forbedring!**

---

## 📞 SUPPORT & RESOURCES

**Dokumentation:**
- [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) - Detaljeret guide
- [BEFORE_AFTER_EXAMPLES.md](BEFORE_AFTER_EXAMPLES.md) - Konkrete eksempler
- [design-tokens.css](css/design-tokens.css) - Alle CSS variabler
- [utilities.css](css/utilities.css) - Utility classes
- [components.css](css/components.css) - Komponenter

**Værktøjer:**
```bash
# Find inline styles
grep -rn 'style=' index.html | wc -l

# Find specific padding values
grep -n 'padding:20px' index.html

# Find custom colors
grep -n 'color:#[0-9a-fA-F]' index.html
```

**Browser DevTools:**
```javascript
// Check spacing consistency
document.querySelectorAll('.card').forEach(el => {
  console.log(el, getComputedStyle(el).padding);
});
```

---

## ✅ DONE DEFINITION

**En opgave er "done" når:**

1. ✅ Inline styles fjernet ELLER erstattet med classes
2. ✅ Værdier matcher spacing scale (4, 8, 12, 16, 24, 32, 48, 64)
3. ✅ Border-radius matcher tokens (8, 12, 16, 20, 24)
4. ✅ Visual regression test passed
5. ✅ No console errors
6. ✅ Code committed med clear message

---

**God implementering! 🎨**

_Husk: Perfektion er ikke målet. Konsistens er målet._
