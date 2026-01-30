# OrderFlow Sidebar Template / Skabelon

**VIGTIGT:** Denne fil definerer den låste struktur for sidebar-menuen. Alle fremtidige opdateringer SKAL følge disse regler.

---

## Sidebar Struktur

```
┌─────────────────────────────────┐
│         FLOW LOGO (centreret)   │  ← Fixed position, top:20px, centered
│         [32px højde]            │
├─────────────────────────────────┤
│                                 │
│   ┌─────────────────────────┐   │  ← margin-top: 44px fra header
│   │ 🔍 Søg...          ⌘K   │   │  ← Søgefelt (parallel med header-bund)
│   └─────────────────────────┘   │
│                                 │
├─────────────────────────────────┤  ← sidebar-nav margin-top: 100px
│                                 │
│   MENU                          │  ← nav-section-title (11px, uppercase)
│   ├── Dashboard                 │
│   ├── Kunder                    │
│   ├── Menukort                  │
│   ├── Telefoni                  │
│   └── Marketing ▼               │  ← Dropdown
│       ├── Kampagner             │
│       ├── Udsendelser           │
│       └── Kundesegmenter        │
│                                 │
│   APP BUILDER                   │  ← nav-section-title
│   └── App Builder               │
│                                 │
│   SYSTEM                        │  ← nav-section-title
│   ├── Workflow                  │
│   └── Indstillinger ▼           │  ← Dropdown
│       ├── Generelt              │
│       ├── Stamdata              │
│       └── Support               │
│                                 │
├─────────────────────────────────┤
│   [Toggle Button]               │  ← Bottom left, collapsed: center
└─────────────────────────────────┘
```

---

## CSS Værdier (LÅST)

### Sidebar Dimensioner
- **Bredde (åben):** `260px`
- **Bredde (lukket):** `72px`
- **Background:** `var(--nav-bg)`
- **Z-index:** `200`

### Logo
- **Position:** `fixed`
- **Top:** `20px`
- **Left:** `0`
- **Width:** `260px` (fuld sidebar bredde)
- **Text-align:** `center`
- **Z-index:** `220`
- **Img højde:** `32px`
- **REGEL:** Logo forbliver på PRÆCIS samme position når sidebar collapses

### Søgefelt (.sidebar-search)
- **Position:** `relative`
- **Margin-top:** `44px` (parallel med header-bund)
- **Margin-bottom:** `4px`
- **Skjult når collapsed:** `display: none`

### Navigation (.sidebar-nav)
- **Margin-top:** `100px`
- **Padding:** `16px 12px`
- **Overflow:** Auto med skjult scrollbar

### Kategori Titler (.nav-section-title)
- **Font-size:** `11px`
- **Font-weight:** `600`
- **Text-transform:** `uppercase`
- **Letter-spacing:** `1px`
- **Padding:** `6px 13px`
- **Opacity:** `0.6`

### Menu Buttons (.nav-btn)
- **Font-size:** `12px`
- **Padding:** `8px 14px`
- **Margin-bottom:** `4px`
- **Gap mellem ikon og tekst:** `10px`

### Sektions Mellemrum (.nav-section)
- **Margin-bottom:** `32px`

---

## Regler for Fremtidige Opdateringer

1. **Logo position må IKKE ændres** - den er låst på plads
2. **Søgefelt skal altid være parallel med header-bund** (margin-top: 44px)
3. **Kategori spacing er 4px** mellem items i samme sektion
4. **Sektions spacing er 32px** mellem forskellige kategorier
5. **Version.js og sw.js SKAL altid opdateres** ved ændringer
6. **Cache-busting parametre (?v=XXX) SKAL opdateres** i index.html

---

## Collapsed State

Når sidebar er lukket:
- Logo: Forbliver på PRÆCIS samme position (fixed)
- Søgefelt: Skjult
- Nav buttons: Kun ikoner, centreret
- Tekst: Skjult med opacity transition
- Tooltips: Vises ved hover

---

*Sidst opdateret: v1.6.6 - 2026-01-30*
