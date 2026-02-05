# Freepik UI Fonts

Dette er de fonts der bruges på Freepik.com

## Inter (UI Font)
**Bruges til:** Al brødtekst, navigation, knapper, labels
**Designer:** Rasmus Andersson
**Licens:** SIL Open Font License 1.1 (gratis)

Filer inkluderet:
- inter-latin-400-normal.woff2 (Regular)
- inter-latin-500-normal.woff2 (Medium)
- inter-latin-600-normal.woff2 (Semibold)
- inter-latin-700-normal.woff2 (Bold)
- inter-latin-400-italic.woff2 (Regular Italic)
- inter-latin-500-italic.woff2 (Medium Italic)

**Download officiel version:** https://rsms.me/inter/

---

## Degular (Headline Font) - KOMMERCIEL
**Bruges til:** Overskrifter, logo
**Designer:** James Edmondson / OH no Type Co
**Pris:** $49+ fra https://ohnotype.co/fonts/degular
**Alternativ:** Gratis via Adobe Fonts (med Creative Cloud abonnement)

Da Degular er kommerciel, har jeg inkluderet to gratis alternativer:

### Public Sans (Degular Alternativ)
**Ligner:** Ren, moderne sans-serif med lignende proportioner
**Licens:** SIL Open Font License 1.1 (gratis)

### Space Grotesk (Degular Alternativ)
**Ligner:** Moderne geometrisk sans-serif
**Licens:** SIL Open Font License 1.1 (gratis)

---

## CSS Brug

```css
/* Inter for UI tekst */
@font-face {
  font-family: 'Inter';
  src: url('Inter-Freepik-UI/inter-latin-400-normal.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
}

/* Degular alternativ */
@font-face {
  font-family: 'PublicSans';
  src: url('Degular-Alternative-Public-Sans/public-sans-latin-600-normal.woff2') format('woff2');
  font-weight: 600;
  font-style: normal;
}

body {
  font-family: 'Inter', sans-serif;
}

h1, h2, h3 {
  font-family: 'PublicSans', sans-serif;
}
```

---

## Licens Info
Inter og de alternative fonts er alle under SIL Open Font License - gratis til kommerciel brug.
Degular kræver køb af licens fra OhnoType eller brug via Adobe Fonts.
