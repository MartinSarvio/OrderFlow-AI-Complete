# OrderFlow Design System v3.0
## Inspireret af Owner.com Premium Aesthetic

> Opdateret: 2026-02-11 | Matched til owner.com redesign 2024

---

## 1. CSS Variables

```css
:root {
  /* ========== FONTS (Owner.com-inspired) ========== */
  /* Note: Vi bruger Inter som primary (allerede loaded) da Suisse Intl er licenseret.
     Inter er visuelt tæt på Suisse og gratis. */
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'Fragment Mono', 'SF Mono', 'Monaco', monospace;
  
  /* ========== TYPOGRAPHY SCALE (Owner.com match) ========== */
  /* Rem-baseret med tight letter-spacing for premium feel */
  --text-hero: 4.8rem;      /* 77px - Hero headlines */
  --text-h1: 3.6rem;        /* 58px */
  --text-h2: 2.8rem;        /* 45px */
  --text-h3: 2.2rem;        /* 35px */
  --text-h4: 1.8rem;        /* 29px */
  --text-body-lg: 1.4rem;   /* 22px */
  --text-body: 1.2rem;      /* 19px - Larger than typical */
  --text-body-sm: 1rem;     /* 16px */
  --text-caption: 0.875rem; /* 14px */
  --text-micro: 0.75rem;    /* 12px */
  
  /* Letter Spacing - Tight (premium) */
  --ls-tight: -0.028em;     /* Hero/H1 */
  --ls-medium: -0.018em;    /* H2/H3 */
  --ls-normal: -0.0125em;   /* H4/Body */
  --ls-none: 0;             /* Captions */
  
  /* Font Weights - Medium-dominant (Owner.com pattern) */
  --fw-regular: 400;
  --fw-medium: 500;         /* PRIMARY weight for headings */
  --fw-semibold: 600;
  --fw-bold: 700;
  
  /* Line Heights */
  --lh-heading: 1.1;        /* Tight for headings */
  --lh-subheading: 1.2;     /* Subheadings */
  --lh-body: 1.5;           /* Body text */
  --lh-relaxed: 1.6;        /* Long-form text */
  
  /* ========== COLORS (Owner.com palette adapted to OrderFlow) ========== */
  
  /* We keep OrderFlow's indigo as primary instead of Owner's blue.
     But adopt their near-black backgrounds and neutral scale. */
  
  /* Dark Mode Backgrounds (Owner-matched near-blacks) */
  --of-bg-deep: #090a0b;        /* Deepest - header/footer */
  --of-bg-primary: #0e0e12;     /* Primary sections */
  --of-bg-elevated: #141418;    /* Cards, elevated */
  --of-bg-surface: #1a1a20;     /* Interactive surfaces */
  
  /* Light Mode Backgrounds (Owner-matched) */
  --of-bg-white: #ffffff;
  --of-bg-off-white: #fafafa;
  --of-bg-light: #f7f7f7;
  --of-bg-subtle: #f1f1f2;
  
  /* Text Colors - Dark on Light */
  --of-text-primary: #080707;   /* Owner.com near-black */
  --of-text-secondary: #3e3e3e; /* Body text */
  --of-text-muted: #717272;     /* Muted */
  --of-text-subtle: #7c7c7c;   /* Subtle */
  --of-text-disabled: #c7c7c7; /* Disabled */
  
  /* Text Colors - Light on Dark */
  --of-text-light: #ffffff;
  --of-text-light-secondary: rgba(255,255,255,0.7);
  --of-text-light-muted: rgba(255,255,255,0.5);
  
  /* Brand Colors (OrderFlow indigo, preserved) */
  --of-primary: #6366F1;
  --of-primary-hover: #818CF8;
  --of-primary-active: #4F46E5;
  --of-primary-dim: rgba(99, 102, 241, 0.12);
  
  /* Neutral Scale (Owner-inspired) */
  --of-gray-50: #fafafa;
  --of-gray-100: #f7f7f7;
  --of-gray-200: #f1f1f2;
  --of-gray-300: #e0e0e1;
  --of-gray-400: #c7c7c7;
  --of-gray-500: #7c7c7c;
  --of-gray-600: #65676c;
  --of-gray-700: #3e3e3e;
  --of-gray-800: #131313;
  --of-gray-900: #090a0b;
  
  /* Semantic (preserved from OrderFlow) */
  --of-success: #10B981;
  --of-warning: #F59E0B;
  --of-danger: #EF4444;
  --of-info: #06B6D4;
  
  /* ========== BORDER RADIUS (Owner.com - rounded) ========== */
  --of-radius-sm: 0.5rem;   /* 8px - small elements */
  --of-radius-md: 0.75rem;  /* 12px - buttons, inputs */
  --of-radius-lg: 1rem;     /* 16px - cards */
  --of-radius-xl: 1.5rem;   /* 24px - large cards */
  --of-radius-2xl: 2rem;    /* 32px - hero sections */
  --of-radius-pill: 3rem;   /* 48px - pills, tags */
  --of-radius-full: 50%;    /* Circles */
  
  /* ========== SPACING (generous, Owner-inspired) ========== */
  --of-space-1: 0.25rem;    /* 4px */
  --of-space-2: 0.5rem;     /* 8px */
  --of-space-3: 0.75rem;    /* 12px */
  --of-space-4: 1rem;       /* 16px */
  --of-space-5: 1.5rem;     /* 24px */
  --of-space-6: 2rem;       /* 32px */
  --of-space-7: 3rem;       /* 48px */
  --of-space-8: 4rem;       /* 64px */
  --of-space-9: 6rem;       /* 96px */
  --of-space-10: 8rem;      /* 128px */
  
  /* Section Spacing */
  --of-section-y: 6rem;     /* Vertical padding between sections */
  --of-section-y-lg: 8rem;  /* Large section padding */
  
  /* ========== SHADOWS ========== */
  --of-shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --of-shadow-md: 0 4px 16px rgba(0,0,0,0.08);
  --of-shadow-lg: 0 8px 32px rgba(0,0,0,0.12);
  --of-shadow-xl: 0 16px 48px rgba(0,0,0,0.16);
  
  /* ========== TRANSITIONS ========== */
  --of-ease: cubic-bezier(0.4, 0, 0.2, 1);
  --of-duration: 200ms;
  --of-transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 2. Typography Guide

### Headings
```css
h1, .heading-1 {
  font-size: var(--text-h1);
  font-weight: var(--fw-medium);  /* 500, NOT 700 */
  letter-spacing: var(--ls-tight);
  line-height: var(--lh-heading);
}

h2, .heading-2 {
  font-size: var(--text-h2);
  font-weight: var(--fw-medium);
  letter-spacing: var(--ls-medium);
  line-height: var(--lh-subheading);
}

h3, .heading-3 {
  font-size: var(--text-h3);
  font-weight: var(--fw-medium);
  letter-spacing: var(--ls-medium);
  line-height: var(--lh-subheading);
}

h4, .heading-4 {
  font-size: var(--text-h4);
  font-weight: var(--fw-medium);
  letter-spacing: var(--ls-normal);
  line-height: var(--lh-body);
}
```

### Body Text
```css
body, .body-text {
  font-size: var(--text-body);  /* 19px - larger than typical */
  font-weight: var(--fw-regular);
  letter-spacing: var(--ls-normal);
  line-height: var(--lh-body);
}

.body-large {
  font-size: var(--text-body-lg);
  letter-spacing: var(--ls-normal);
}

.caption {
  font-size: var(--text-caption);
  font-weight: var(--fw-medium);
  letter-spacing: var(--ls-none);
  text-transform: uppercase;  /* Til labels */
}
```

---

## 3. Component Style Guide

### Buttons
```css
.btn-primary {
  background: var(--of-primary);
  color: white;
  border: none;
  border-radius: var(--of-radius-md);
  padding: 0.875rem 1.75rem;
  font-size: var(--text-body-sm);
  font-weight: var(--fw-medium);
  letter-spacing: var(--ls-normal);
  transition: var(--of-transition);
}
.btn-primary:hover {
  background: var(--of-primary-hover);
}

.btn-secondary {
  background: transparent;
  color: var(--of-text-primary);
  border: 1px solid var(--of-gray-300);
  border-radius: var(--of-radius-md);
  padding: 0.875rem 1.75rem;
}

.btn-pill {
  border-radius: var(--of-radius-pill);
}
```

### Cards
```css
.card {
  background: var(--of-bg-white);
  border-radius: var(--of-radius-lg);
  padding: var(--of-space-6);
  border: 1px solid var(--of-gray-200);
  transition: var(--of-transition);
}
.card:hover {
  box-shadow: var(--of-shadow-md);
}

/* Dark variant */
.card-dark {
  background: var(--of-bg-elevated);
  border: 1px solid rgba(255,255,255,0.08);
  color: var(--of-text-light);
}
```

### Section Layouts
```css
.section {
  padding: var(--of-section-y) 0;
}
.section-dark {
  background: var(--of-bg-deep);
  color: var(--of-text-light);
}
.section-light {
  background: var(--of-bg-off-white);
  color: var(--of-text-primary);
}
.section-white {
  background: var(--of-bg-white);
  color: var(--of-text-primary);
}
```

### Navigation (Header)
```css
.nav-header {
  background: var(--of-bg-deep);  /* #090a0b - Owner-matched */
  color: var(--of-text-light);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 1000;
}
```

### Footer
```css
.footer {
  background: var(--of-bg-deep);  /* Same as header */
  color: var(--of-text-light);
  padding: var(--of-space-9) 0 var(--of-space-7);
}
```

### Input Fields
```css
.input {
  border: 1px solid var(--of-gray-300);
  border-radius: var(--of-radius-md);
  padding: 0.75rem 1rem;
  font-size: var(--text-body-sm);
  transition: var(--of-transition);
}
.input:focus {
  border-color: var(--of-primary);
  box-shadow: 0 0 0 3px var(--of-primary-dim);
}
```

---

## 4. Sider der skal opdateres

### Excluded (IKKE ændres):
- `landing.html` ✗
- `priser.html` ✗
- `how-it-works.html` ✗
- `privacy.html` ✗
- `cookie-settings.html` ✗
- `terms.html` ✗
- `disclaimer.html` ✗
- `restaurant-agreement.html` ✗
- `platform-terms.html` ✗
- `accessibility.html` ✗

### Target sider (prioriteret rækkefølge):

#### Priority 1 – Company sider (mest synlige)
1. **om-os.html** – Om Os / About
2. **ledelse.html** – Ledelse / Team
3. **karriere.html** – Karriere / Careers
4. **partner.html** – Partner
5. **presse.html** – Presse / Press

#### Priority 2 – Marketing sider (lead generation)
6. **online-bestilling.html** – Online bestilling
7. **restaurant-hjemmeside.html** – Restaurant hjemmeside
8. **custom-mobile-app.html** – Custom mobile app
9. **restaurant-mobile-app.html** – Restaurant mobile app
10. **automatiseret-marketing.html** – Automatiseret marketing
11. **loyalitetsprogram.html** – Loyalitetsprogram
12. **seo-for-restauranter.html** – SEO
13. **restaurant-email-marketing.html** – Email marketing
14. **zero-commission-delivery.html** – Zero commission
15. **online-bestillingssystemer.html** – Bestillingssystemer
16. **restaurant-marketing-guide.html** – Marketing guide
17. **case-studies.html** – Case Studies

#### Priority 3 – Content & Support
18. **blog.html** – Blog
19. **blog-post.html** – Blog post template
20. **help-center.html** – Help Center
21. **docs.html** – Docs (support)

#### Priority 4 – Workflow sider
22. **sms-workflow.html**
23. **facebook-workflow.html**
24. **instagram-workflow.html**
25. **search-engine.html**

---

## 5. Implementation Anbefalinger

### Strategi: Progressive Enhancement
1. **Først:** Tilføj nye CSS variables til `design-tokens.css` (additiv, bryder intet)
2. **Derefter:** Opdater header/footer globally (ens på alle sider)
3. **Så:** Company sider (5 sider, høj synlighed, lav risiko)
4. **Så:** Marketing sider (13 sider, core business)
5. **Sidst:** Content + workflow sider

### Key Design Shifts fra nuværende → Owner-matched:
| Element | Nu (OrderFlow) | Nyt (Owner-matched) |
|---------|----------------|---------------------|
| Heading weight | 600-700 (bold) | **500 (medium)** |
| Letter-spacing | 0 | **Negativ (-0.01 til -0.028em)** |
| Body font-size | 14px | **19px** (landing pages) |
| Border-radius | 4-6px | **12-24px** |
| Section padding | 48-64px | **96-128px** |
| Background blacks | #13131F (navy) | **#090a0b (near-black)** |
| Neutral gray tone | Blue-tinged | **Pure neutral** |

### OBS: Dashboard vs. Landing Pages
- Dashboard/app siderne beholder nuværende design-tokens.css (Craftwork dark)
- Kun **public-facing** landing/marketing sider matches til Owner.com
- Header + footer er **ens** på begge kontekster

### Font Note
- Owner.com bruger Suisse International (licenseret, ~$200+)
- Vi fortsætter med Inter som er visuelt tæt og gratis
- Tight letter-spacing giver samme premium-feel
