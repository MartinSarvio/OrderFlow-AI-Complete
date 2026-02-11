# Owner.com Design Analysis

> Analyseret: 2026-02-11 | Kilde: owner-redesign-2024.webflow CSS

## Fonts

| Rolle | Font | Fallback |
|-------|------|----------|
| **Primary** | Suisseintl | sans-serif |
| **Secondary** | Inter | sans-serif |
| **Mono** | Fragment Mono | monospace |

Suisse International er en premium Swiss-style grotesk – ren, geometrisk, luksus-feel.

## Typografi Scale (rem-baseret, base ~16px)

| Brug | Størrelse | Vægt | Letter-spacing |
|------|-----------|------|----------------|
| Hero H1 | 5.6rem (90px) | 500 | -0.031em |
| H1 | 4.8rem (77px) | 500 | -0.028em |
| H2 | 3.2-3.6rem (51-58px) | 500 | -0.02em |
| H3 | 2.4rem (38px) | 500 | -0.018em |
| H4 | 2rem (32px) | 500 | -0.015em |
| Large body | 1.8rem (29px) | 400 | -0.0125em |
| Body | 1.6rem (26px) | 400 | -0.0125em |
| Small | 1.3-1.4rem (21-22px) | 400 | -0.01em |
| Caption | 1rem (16px) | 500 | 0 |

**Key insight:** Negativ letter-spacing overalt (tighter = mere premium). Vægt 500 dominerer (medium, ikke bold).

## Farvepalet

### Primary Palette
| Navn | Hex | Brug |
|------|-----|------|
| **Near-black** | `#090a0b` | Primær baggrund, dark sections |
| **Off-black** | `#080707` | Tekst farve |
| **True black** | `#000000` | Alternativ bg |
| **Dark gray** | `#131313` | Sekundær mørk bg |

### Brand Blue
| Navn | Hex | Brug |
|------|-----|------|
| **Primary blue** | `#1460ef` | CTA buttons, links |
| **Bright blue** | `#015bf8` | Hover/active states |
| **Deep blue** | `#0051f2` | Active/pressed |
| **Light blue** | `#0082f3` | Text links |

### Neutrals
| Navn | Hex | Brug |
|------|-----|------|
| **White** | `#ffffff` | Tekst på dark, light bg |
| **Off-white** | `#fafafa` | Light sections |
| **Light gray 1** | `#f7f7f7` | Subtle bg |
| **Light gray 2** | `#f3f3f3` | Card bg |
| **Light gray 3** | `#f1f1f2` | Borders, dividers |
| **Medium gray 1** | `#e9e9e9` | Hover states |
| **Medium gray 2** | `#e0e0e1` | Active states |
| **Medium gray 3** | `#dedede` | Borders |
| **Medium gray 4** | `#c8c8c8` / `#c7c7c7` | Disabled/muted |
| **Dark gray 1** | `#7c7c7c` | Muted text |
| **Dark gray 2** | `#717272` | Secondary text |
| **Dark gray 3** | `#65676c` | Subtle text |
| **Charcoal** | `#3e3e3e` | Body text on light |

### Semantic
| Navn | Hex | Brug |
|------|-----|------|
| **Error bg** | `#ffdede` | Error states |

## Border Radius System

| Token | Værdi | Brug |
|-------|-------|------|
| xs | 0.8rem (13px) | Small elements, tags |
| sm | 1rem (16px) | Buttons, inputs |
| md | 1.2rem (19px) | Cards |
| lg | 1.6rem (26px) | Large cards |
| xl | 2rem (32px) | Sections |
| 2xl | 2.4rem (38px) | Hero elements |
| pill | 3.2rem (51px) | Pills, badges |
| circle | 50% | Avatars |

**Key insight:** Meget runde corners – langt mere end typisk. Premium soft feel.

## Spacing Patterns

- Baseret på rem-system (ikke px-grid)
- Generøs whitespace
- Sections typisk 6-8rem padding
- Cards typisk 2-3rem padding

## Luxury Design Elementer

1. **Negativ letter-spacing** på alle headings (-0.01em til -0.05em)
2. **Medium weight (500)** frem for bold – mere raffineret
3. **Meget runde border-radius** (1.2-3.2rem)
4. **Near-black baggrunde** (#090a0b) – ikke pure black
5. **Monokrom palette** med single accent color (blue)
6. **Stor typografi** – body text 1.6rem (26px!)
7. **Suisse International** font – premium Swiss grotesk
8. **Tight line-height** (1-1.2 på headings)
9. **Generøs whitespace** mellem sections
10. **Subtile hover transitions** med mørke/lysere variants

## Header/Footer Design

- **Header:** Mørk bg (#090a0b), hvid tekst, simpel nav, prominent CTA button (blue)
- **Footer:** Samme mørke bg, multi-column links, clean dividers
- **Sticky header** med minimal height
- **Ingen visuel forskel** mellem header på light/dark sections
