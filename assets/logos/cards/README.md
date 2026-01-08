# Kortlogoer

Denne mappe skal indeholde PNG-logoer for forskellige korttyper.

## Påkrævede filer:

- `visa-debit.png` - Visa Debit kort logo
- `visa-kredit.png` - Visa Kredit kort logo
- `mastercard-debit.png` - Mastercard Debit kort logo
- `mastercard-kredit.png` - Mastercard Kredit kort logo
- `dankort.png` - Dankort logo
- `visa-electron.png` - Visa Electron logo
- `maestro.png` - Maestro kort logo

## Anbefalede specifikationer:

- **Format:** PNG med transparent baggrund
- **Højde:** 24-48px (systemet skalerer automatisk til 24px højde)
- **Bredde:** Proportionel (typisk 60-100px)
- **DPI:** 72-144 dpi for web

## Fallback:

Hvis PNG-filerne ikke findes, vil systemet automatisk vise SVG fallback-logoer defineret i `js/card_logos.js`.

## Hvor finder jeg logoer?

Du kan hente officielle kortlogoer fra:
- **Visa:** https://brand.visa.com
- **Mastercard:** https://brand.mastercard.com
- **Dankort:** https://www.nets.eu/da-dk/loesninger/dankort

**Bemærk:** Sørg for at overholde kortleverandørernes brand guidelines når du bruger deres logoer.
