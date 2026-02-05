# OrderFlow UI Konsistens - Implementeringsguide

## 📋 Oversigt

Denne guide dækker implementeringen af konsistente UI-komponenter og design tokens i OrderFlow.

**Mål:** Eliminere visuelle inkonsistenser og skabe et vedligeholdbart design system.

**Estimeret Tid:** 6-8 timer (afhængigt af erfaring)

---

## 🚀 FASE 1: Import Nye CSS Filer (15 minutter)

### Trin 1.1: Tilføj CSS Filer til index.html

Åbn `/Users/martinsarvio/Downloads/OrderFlow-v137/index.html` og tilføj følgende EFTER `<link rel="stylesheet" href="css/styles.css">`:

```html
<!-- Design Tokens & Utility System -->
<link rel="stylesheet" href="css/design-tokens.css">
<link rel="stylesheet" href="css/utilities.css">
<link rel="stylesheet" href="css/components.css">
```

**Rækkefølge er vigtig:**
1. `design-tokens.css` - CSS variabler først
2. `utilities.css` - Utility classes
3. `components.css` - Komponenter (bruger tokens)

### Trin 1.2: Verificer Import

Åbn developer console i browseren og check:
```javascript
// Test at CSS er loaded
getComputedStyle(document.documentElement).getPropertyValue('--space-5')
// Skal returnere "24px"
```

---

## 🎨 FASE 2: Opdater Eksisterende Styles.css (30 minutter)

### Trin 2.1: Opdater :root Variabler

Åbn `css/styles.css` og ERSTAT de eksisterende CSS variabler med reference til `design-tokens.css`:

**FØR:**
```css
:root {
  --bg: #0a0b0d;
  --space-1: 4px;
  --space-5: 24px;  /* Kan være inkonsistent */
  /* etc. */
}
```

**EFTER:**
```css
/* Import design tokens - disse variabler er nu defineret i design-tokens.css */
/* Vi beholder aliaser for backwards compatibility */
:root {
  /* Backwards compatibility aliases */
  --bg: var(--color-bg);
  --bg2: var(--color-bg-2);
  --bg3: var(--color-bg-3);
  --text: var(--color-text);
  --text2: var(--color-text-secondary);
  --muted: var(--color-text-muted);
  --accent: var(--color-primary);
  --accent-hover: var(--color-primary-hover);
  --accent-dim: var(--color-primary-dim);
  /* Spacing aliases - disse refererer nu til konsistente værdier */
  /* --space-1 til --space-8 er allerede defineret i design-tokens.css */
}
```

### Trin 2.2: Opdater Button Styles

**FØR (linje 79-90 i styles.css):**
```css
.btn {
  padding: 10px 18px;  /* Ikke spacing scale! */
  font-size: 13px;
  /* etc. */
}
```

**EFTER:**
```css
.btn {
  /* Nu bruger vi komponenten fra components.css */
  /* Fjern duplicate definitions eller kommenter dem ud */
}

/* Tilføj .btn-sm hvis ikke findes */
.btn-sm {
  padding: var(--space-1) var(--space-3);  /* 4px 12px */
  font-size: var(--font-size-xs);  /* 11px */
}
```

**VIGTIGT:** Tjek at `.btn` i `components.css` ikke konflikter med `styles.css`. Hvis der er konflikter, kommenter den gamle definition ud i `styles.css`.

---

## 🔧 FASE 3: Refaktorer Index.html - Knapper (1-2 timer)

### Trin 3.1: Erstat Inline Width Styles

**FØR:**
```html
<button class="btn btn-primary" style="width:100%">Gem</button>
```

**EFTER:**
```html
<button class="btn btn-primary btn-block">Gem</button>
<!-- ELLER brug utility class -->
<button class="btn btn-primary w-full">Gem</button>
```

**Søg & Erstat Pattern:**
- Find: `class="btn([^"]*)" style="width:100%"`
- Erstat med: `class="btn$1 btn-block"`

### Trin 3.2: Standardiser Button Padding

Find alle buttons med custom padding og erstat:

**FØR:**
```html
<button style="padding:6px 12px;font-size:13px">...</button>
```

**EFTER:**
```html
<button class="btn btn-sm">...</button>
```

**Søg & Erstat:**
- Find: `style="[^"]*padding:\s*6px\s+12px[^"]*"`
- Erstat med: `class="btn btn-sm"`

### Trin 3.3: Fjern Inline Font-size på Buttons

**FØR:**
```html
<button class="btn" style="font-size:13px">...</button>
```

**EFTER:**
```html
<button class="btn">...</button>  <!-- font-size er allerede i .btn -->
```

---

## 📦 FASE 4: Refaktorer Cards (2-3 timer)

### Trin 4.1: Standardiser Card Padding

**KRITISK:** Replace alle inline padding values på `.card` elementer.

**FØR:**
```html
<div class="card" style="padding:20px">...</div>  <!-- 20px matcher IKKE scale! -->
<div class="card" style="padding:24px">...</div>
<div class="card" style="padding:16px">...</div>
```

**EFTER:**
```html
<!-- 20px → 16px eller 24px -->
<div class="card card-sm">...</div>        <!-- 16px padding -->
<div class="card">...</div>                <!-- 24px padding (default) -->
<div class="card card-lg">...</div>        <!-- 32px padding -->
```

**Konverteringstabel:**
| Gammel Inline Padding | Ny Class | Faktisk Padding |
|-----------------------|----------|-----------------|
| `padding:16px` | `card card-sm` | 16px (OK) |
| `padding:20px` | `card card-sm` ELLER `card` | 16px ELLER 24px |
| `padding:24px` | `card` | 24px (OK) |
| `padding:32px` | `card card-lg` | 32px (OK) |

**Søg & Erstat:**

1. **20px → 24px (standard):**
   - Find: `<div class="card" style="padding:20px"`
   - Erstat: `<div class="card"`

2. **16px → card-sm:**
   - Find: `<div class="card" style="padding:16px"`
   - Erstat: `<div class="card card-sm"`

3. **32px → card-lg:**
   - Find: `<div class="card" style="padding:32px"`
   - Erstat: `<div class="card card-lg"`

### Trin 4.2: Standardiser Border-radius på Custom Containers

**FØR (index.html linje 1137):**
```html
<div style="background:linear-gradient(...);
            border-radius:16px;
            padding:28px;  <!-- 28px matcher IKKE! -->
            ...">
```

**EFTER:**
```html
<div class="payment-card"
     style="background:linear-gradient(...);">
  <!-- Flyt padding til CSS -->
</div>
```

**Tilføj til styles.css:**
```css
.payment-card {
  border-radius: var(--radius-lg);  /* 16px */
  padding: var(--space-6);  /* 32px - tættest på 28px */
  /* Resten af styles... */
}
```

### Trin 4.3: Fix Nested Container Border-radius

**FØR (linje 1141):**
```html
<div style="padding:6px 12px;border-radius:6px;">  <!-- 6px matcher IKKE! -->
```

**EFTER:**
```html
<div class="px-3 py-2 rounded-sm">  <!-- 12px horizontal, 8px vertical, 8px radius -->
</div>
```

---

## 📏 FASE 5: Standardiser Spacing (2 timer)

### Trin 5.1: Erstat Margin-bottom: 20px

**FØR:**
```html
<div style="margin-bottom:20px">...</div>
```

**EFTER:**
```html
<!-- Beslut: 16px eller 24px? -->
<div class="mb-5">...</div>  <!-- 24px - bedre spacing -->
<!-- ELLER -->
<div class="mb-4">...</div>  <!-- 16px - tættere spacing -->
```

**Regel:**
- Brug `mb-5` (24px) for større sections/cards
- Brug `mb-4` (16px) for form groups/mindre elementer

**Søg & Erstat:**
- Find: `style="margin-bottom:20px"`
- Erstat manuelt baseret på kontekst

### Trin 5.2: Erstat Custom Gap Værdier

**FØR:**
```html
<div style="display:grid;gap:20px">...</div>  <!-- 20px! -->
```

**EFTER:**
```html
<div class="d-grid gap-5">...</div>  <!-- 24px -->
<!-- ELLER -->
<div class="d-grid gap-4">...</div>  <!-- 16px -->
```

### Trin 5.3: Fix Payment Card Padding (index.html linje 1137)

**FØR:**
```html
<div style="padding:28px;">
```

**EFTER:**
```html
<div class="p-6">  <!-- 32px - tættest match -->
```

---

## 🎨 FASE 6: Typografi Standardisering (1 time)

### Trin 6.1: Erstat Inline Font-sizes

**Konverteringstabel:**
| Gammel Size | Ny Utility Class | Faktisk Size |
|-------------|------------------|--------------|
| `font-size:9px` | `text-2xs` | 10px (9px for småt!) |
| `font-size:11px` | `text-xs` | 11px |
| `font-size:12px` | `text-sm` | 12px |
| `font-size:13px` | `text-sm` ELLER `text-base` | 12px eller 14px |
| `font-size:14px` | `text-base` | 14px |
| `font-size:16px` | `text-lg` | 16px |
| `font-size:18px` | `text-xl` | 18px |

**Eksempel:**

**FØR:**
```html
<div style="font-size:12px;color:var(--muted)">Hjælpetekst</div>
```

**EFTER:**
```html
<div class="text-sm text-muted">Hjælpetekst</div>
```

### Trin 6.2: Standardiser Font-weight

**FØR:**
```html
<div style="font-weight:600">Overskrift</div>
```

**EFTER:**
```html
<div class="font-semibold">Overskrift</div>
```

---

## 🏷️ FASE 7: Trusted Devices Sektion (30 minutter)

Denne sektion (index.html linje 3069-3162) har gentagen inline styling.

### Trin 7.1: Opret Component Class

**Tilføj til styles.css ELLER components.css:**
```css
.trusted-device {
  display: flex;
  align-items: center;
  gap: var(--space-4);  /* 16px */
  padding: var(--space-4);  /* 16px */
  background: var(--color-bg-3);
  border-radius: var(--radius-md);  /* 12px - IKKE 8px */
}

.trusted-device-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);  /* 12px */
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.trusted-device-icon.gradient-purple {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.trusted-device-icon.gradient-pink {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.trusted-device-info {
  flex: 1;
}

.trusted-device-remove {
  padding: var(--space-2) var(--space-4);  /* 8px 16px */
  font-size: var(--font-size-sm);  /* 12px */
  background: #fee;
  color: #c33;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.trusted-device-remove:hover {
  background: #fdd;
}
```

### Trin 7.2: Refaktorer HTML

**FØR (3069-3080):**
```html
<div style="display:flex;align-items:center;gap:16px;padding:16px;background:var(--bg3);border-radius:8px">
  <div style="width:56px;height:56px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px;...">
    <svg>...</svg>
  </div>
  <div style="flex:1">...</div>
  <button style="padding:8px 16px;font-size:13px;background:#fee;color:#c33;...">Fjern</button>
</div>
```

**EFTER:**
```html
<div class="trusted-device">
  <div class="trusted-device-icon gradient-purple">
    <svg width="28" height="28">...</svg>
  </div>
  <div class="trusted-device-info">
    <div class="font-semibold text-base">iPhone 13 Pro</div>
    <div class="text-sm text-muted">Sidst brugt: I dag kl. 14:23</div>
  </div>
  <button class="trusted-device-remove" onclick="removeTrustedDevice('iphone')">Fjern</button>
</div>
```

**Gentag for alle 8 enheder.**

---

## 🧪 FASE 8: Test & Validering (1 time)

### Trin 8.1: Visual Regression Test

Før du refactorer hver sektion, tag screenshots:

1. **Homepage**
2. **Kunder sektion**
3. **Brugerindstillinger**
4. **Workflow sektion**
5. **Modals**

Efter refactoring, sammenlign for at sikre ingen visuelle breaking changes.

### Trin 8.2: Funktionalitetstest

Test ALLE interaktive elementer:

- [ ] Knapper: Hover, active, disabled states
- [ ] Forms: Input focus, validation, error states
- [ ] Cards: Hover effekter
- [ ] Modals: Åbn/luk animationer
- [ ] Dropdowns: Åbn/luk, item selection
- [ ] Toggles: On/off states
- [ ] Tabs: Switch mellem tabs

### Trin 8.3: Spacing Audit

Brug browser DevTools til at måle spacing:

1. Inspect et element
2. Se computed styles
3. Verificer:
   - Padding matcher spacing scale (4, 8, 12, 16, 24, 32, 48, 64)
   - Margin matcher spacing scale
   - Border-radius matcher (8, 12, 16, 20, 24)

**Automatisk Check (Browser Console):**
```javascript
// Find alle elementer med non-standard padding
Array.from(document.querySelectorAll('*'))
  .filter(el => {
    const padding = parseInt(getComputedStyle(el).paddingTop);
    const validPaddings = [0, 4, 8, 12, 16, 24, 32, 48, 64];
    return padding > 0 && !validPaddings.includes(padding);
  })
  .forEach(el => console.log(el, getComputedStyle(el).paddingTop));
```

### Trin 8.4: Cross-browser Test

Test i:
- [ ] Chrome (primary)
- [ ] Firefox
- [ ] Safari
- [ ] Edge

---

## 📊 FASE 9: Performance Audit (30 minutter)

### Trin 9.1: CSS Fil Størrelse Check

**FØR:**
```bash
ls -lh css/styles.css
# Output: ~450KB (eksempel)
```

**EFTER (med nye filer):**
```bash
ls -lh css/*.css
# design-tokens.css: ~8KB
# utilities.css: ~15KB
# components.css: ~20KB
# styles.css: ~407KB (mindre efter cleanup)
# Total: ~450KB (lignende, men bedre organiseret)
```

### Trin 9.2: Minify CSS for Production

**Installer cssnano (hvis ikke allerede):**
```bash
npm install -g cssnano-cli
```

**Minify:**
```bash
cssnano css/design-tokens.css css/design-tokens.min.css
cssnano css/utilities.css css/utilities.min.css
cssnano css/components.css css/components.min.css
```

**Opdater HTML til production:**
```html
<link rel="stylesheet" href="css/design-tokens.min.css">
<link rel="stylesheet" href="css/utilities.min.css">
<link rel="stylesheet" href="css/components.min.css">
```

---

## 🚨 Breaking Changes & Mitigations

### Breaking Change 1: 20px → 24px Spacing

**Hvad:** Alle `margin-bottom:20px` ændres til 24px eller 16px.

**Impact:** Lodret spacing bliver lidt større eller mindre.

**Mitigation:**
- Gennemgå kritiske sektioner manuelt
- Brug 16px (`mb-4`) hvis layout ser for luftigt ud
- Brug 24px (`mb-5`) som standard

### Breaking Change 2: 28px Padding → 32px

**Hvad:** Payment card padding ændres fra 28px til 32px.

**Impact:** Kortvisning bliver 4px større.

**Mitigation:**
- Acceptabel ændring (32px er standard large padding)
- Hvis problematisk, brug 24px (`p-5`) i stedet

### Breaking Change 3: 6px Border-radius → 8px

**Hvad:** Custom 6px border-radius ændres til 8px.

**Impact:** Subtilt mere afrundet hjørner.

**Mitigation:**
- Praktisk talt umærkelig forskel
- Holder sig til design system

### Breaking Change 4: Button Højde Ændring

**Hvad:** Buttons med `padding:10px 18px` → `8px 16px`.

**Impact:** Buttons bliver 4px lavere.

**Mitigation:**
- Hvis for små, brug `.btn-lg` (12px 24px padding)
- Standard buttons bør være 8px 16px for konsistens

---

## ✅ Completion Checklist

### Design System Setup
- [ ] `design-tokens.css` oprettet og importeret
- [ ] `utilities.css` oprettet og importeret
- [ ] `components.css` oprettet og importeret
- [ ] CSS import rækkefølge verificeret

### Button Refactoring
- [ ] Alle `style="width:100%"` erstattet med `.btn-block` eller `.w-full`
- [ ] Custom padding erstattet med `.btn-sm`, `.btn-md`, `.btn-lg`
- [ ] Inline font-size fjernet

### Card Refactoring
- [ ] Alle inline `padding:20px` erstattet
- [ ] Card variants (`.card-sm`, `.card-lg`) anvendt korrekt
- [ ] Border-radius standardiseret

### Spacing Refactoring
- [ ] `margin-bottom:20px` → `.mb-4` eller `.mb-5`
- [ ] Custom gap værdier erstattet
- [ ] Trusted devices sektion refaktoreret

### Typography Refactoring
- [ ] Inline `font-size` erstattet med utility classes
- [ ] Inline `font-weight` erstattet med utility classes
- [ ] Inline `color` erstattet med utility classes

### Testing
- [ ] Visual regression test passed
- [ ] Funktionalitetstest passed
- [ ] Spacing audit passed
- [ ] Cross-browser test passed
- [ ] Performance audit passed

### Documentation
- [ ] Team briefet om nye CSS-struktur
- [ ] Style guide opdateret
- [ ] Commit messages skrevet

---

## 📚 Næste Skridt Efter Implementering

1. **Opret Style Guide:** Dokumenter alle komponenter med eksempler
2. **Lint Setup:** Installer stylelint for at forhindre inline styles
3. **CI/CD Integration:** Automatisk CSS validering
4. **Team Training:** Hold workshop om ny CSS-struktur
5. **Monitorering:** Track CSS bundle size over tid

---

## 🆘 Troubleshooting

### Problem: Knapper ser for små ud

**Løsning:** Brug `.btn-lg` i stedet for standard `.btn`.

### Problem: Cards har for meget spacing

**Løsning:** Brug `.card-sm` i stedet for `.card`.

### Problem: CSS ikke loaded korrekt

**Check:**
1. Browser cache cleared?
2. Fil sti korrekt i `<link>`?
3. Ingen syntax errors i CSS? (check console)

### Problem: Inline styles tilsidesætter nye classes

**Løsning:** Fjern inline styles FØRST, derefter tilføj classes.

**Prioritet:**
```
Inline styles > Classes > CSS filer
```

Så inline styles vinder altid - derfor skal de fjernes!

---

## 📞 Support

Ved problemer, kontakt:
- UI/UX Team Lead
- Frontend Developer
- Opret GitHub issue

**Estimated Total Time: 6-8 timer**

God implementering! 🚀
