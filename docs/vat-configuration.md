# Tutorial: Opsætning af moms-regler

> Konfigurer korrekt momsberegning for din virksomhed.

**Tidsforbrug:** 10-15 minutter  
**Niveau:** Begynder  
**Resultat:** Korrekt moms på alle ordrer og rapporter

---

## Hvad du lærer

- ✅ Forstå danske momsregler for restauranter
- ✅ Konfigurere standard momssats
- ✅ Håndtere momsfrie varer
- ✅ Opsætte korrekt momsvisning på kvitteringer
- ✅ Generere momsrapporter

---

## Danske momsregler for restauranter

### Standard momssats: 25%

I Danmark er standard momssats **25%** og gælder for:

- ✅ Mad til fortæring i/fra restaurant
- ✅ Drikkevarer
- ✅ Levering (leveringsgebyr)
- ✅ Tilbehør og tilvalg

### Momsfrie varer (0%)

Visse varer er momsfrie:

- ☐ Eksport til udlandet
- ☐ Aviser og blade
- ☐ Visse finansielle ydelser

> **📌 Note:** Langt de fleste restaurant-transaktioner har 25% moms.

---

## Del 1: Konfigurer basis momsindstillinger (5 min)

### Trin 1: Gå til momsindstillinger

1. Gå til **Indstillinger** i sidemenuen
2. Klik på **Virksomhed** tab
3. Find **Moms & Afgifter** sektionen

<!-- 📸 SCREENSHOT: Momsindstillinger side -->

### Trin 2: Verificer virksomhedsinfo

Sørg for at disse felter er udfyldt:

| Felt | Eksempel | Krav |
|------|----------|------|
| **CVR-nummer** | 12345678 | Påkrævet for fakturering |
| **Virksomhedsnavn** | Restaurant ApS | Juridisk navn |
| **Adresse** | Hovedgaden 1, 2100 København | Registreret adresse |
| **Momsregistreret** | Ja ✅ | Aktiver hvis momsreg. |

### Trin 3: Sæt standard momssats

1. Under **Standard momssats**, vælg **25%**
2. Denne anvendes automatisk på alle produkter

```
┌─────────────────────────────────────┐
│ Standard momssats                   │
│ ┌─────────────────────────────────┐ │
│ │ 25% (Danmark standard)       ▼ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ☑ Vis priser inkl. moms til kunder │
│ ☑ Vis moms separat på kvittering   │
└─────────────────────────────────────┘
```

### Trin 4: Vælg prisvisning

| Indstilling | Anbefaling | Forklaring |
|-------------|------------|------------|
| **Vis priser inkl. moms** | ✅ Anbefalet | Kunder ser slutpris |
| **Vis moms separat på kvittering** | ✅ Anbefalet | Krav for bogføring |

---

## Del 2: Produktspecifik moms (5 min)

Hvis du har produkter med anden momssats:

### Opsæt momskategorier

1. Gå til **Indstillinger** → **Moms & Afgifter**
2. Klik **Tilføj momskategori**
3. Udfyld:

| Felt | Eksempel |
|------|----------|
| **Navn** | Momsfri |
| **Sats** | 0% |
| **Beskrivelse** | Eksportvarer |

### Tildel momskategori til produkt

1. Gå til produktet
2. Under **Avanceret** → **Momskategori**
3. Vælg den relevante kategori
4. Gem

<!-- 📸 SCREENSHOT: Produkt med momskategori -->

### Typiske scenarier

| Scenarie | Momssats | Eksempel |
|----------|----------|----------|
| Normal salg | 25% | Pizza, burger, cola |
| Eksport | 0% | Salg til Sverige/Norge via API |
| Erhvervskunde (EU) | 0%* | Med gyldigt VAT-nummer |

*Kræver reverse charge dokumentation

---

## Del 3: Momsberegning på ordrer

### Sådan beregnes moms

OrderFlow beregner automatisk:

```
Eksempel ordre:
─────────────────────────────────
2x Pepperoni Pizza    178,00 kr
1x Coca-Cola           25,00 kr
Levering               39,00 kr
─────────────────────────────────
Subtotal              242,00 kr
Moms (25%)             48,40 kr
─────────────────────────────────
TOTAL                 290,40 kr
```

### Formel

```
Pris inkl. moms = Pris ekskl. moms × 1,25

Moms = Pris inkl. moms - (Pris inkl. moms ÷ 1,25)
     = 290,40 - (290,40 ÷ 1,25)
     = 290,40 - 232,32
     = 58,08 kr
```

> **💡 Pro-tip:** OrderFlow håndterer afrunding automatisk efter danske regler.

---

## Del 4: Kvittering og faktura (5 min)

### Kvitteringskrav

En gyldig dansk kvittering skal indeholde:

| ✅ Påkrævet | Eksempel |
|------------|----------|
| Virksomhedsnavn | Bella Italia ApS |
| CVR-nummer | CVR: 12345678 |
| Adresse | Hovedgaden 1, 2100 Kbh Ø |
| Dato og tid | 15. jan 2025, kl. 18:32 |
| Ordrenummer | Ordre #1234 |
| Varelinjer med pris | 2x Pepperoni Pizza - 178,00 kr |
| Moms specificeret | Moms 25%: 48,40 kr |
| Total | Total: 290,40 kr |

### Tilpas kvitteringsdesign

1. Gå til **Indstillinger** → **Kvitteringer**
2. Vælg **Kvitteringsskabelon**
3. Tilpas:
   - Logo
   - Tekst (header/footer)
   - Visning af moms

<!-- 📸 SCREENSHOT: Kvitteringseditor -->

### Faktura til erhvervskunder

For erhvervskunder der ønsker faktura:

1. Åbn ordren
2. Klik **Opret faktura**
3. Udfyld kundens CVR-nummer
4. Fakturaen genereres med korrekt moms

---

## Del 5: Momsrapporter

### Z-rapport (daglig)

Z-rapporten viser dagens momsoversigt:

```
Z-RAPPORT - 15. januar 2025
════════════════════════════════════════

OMSÆTNING
─────────────────────────────────────────
Bruttosalg inkl. moms:      15.250,00 kr
Nettosalg ekskl. moms:      12.200,00 kr
─────────────────────────────────────────

MOMS
─────────────────────────────────────────
Salgsmoms (25%):             3.050,00 kr
Momsfrit salg:                   0,00 kr
─────────────────────────────────────────
Total skyldig moms:          3.050,00 kr
════════════════════════════════════════
```

### Momsrapport (periodevis)

For momsindberetning:

1. Gå til **Rapporter** → **Momsrapport**
2. Vælg periode (kvartal/år)
3. Generer rapport
4. Eksporter til PDF/Excel

### Eksporter til bogføring

OrderFlow kan eksportere til:

| System | Format |
|--------|--------|
| E-conomic | Native integration |
| Dinero | CSV import |
| Billy | CSV import |
| SAP | XML eksport |

---

## Særlige situationer

### Rabatter og moms

Moms beregnes **efter** rabat:

```
Original pris:      200,00 kr
Rabat (10%):        -20,00 kr
Pris efter rabat:   180,00 kr
Moms (25%):          36,00 kr
Total:              216,00 kr
```

### Returneringer

Ved returneringer:
1. Moms tilbageføres automatisk
2. Vises på Z-rapport som negativ moms
3. Modregnes i periodens momsopgørelse

### Drikkepenge

Drikkepenge er **ikke** momspligtigt:

```
Ordre total:        290,40 kr
Drikkepenge:         30,00 kr  (ingen moms)
─────────────────────────────
Betalt i alt:       320,40 kr
Moms skyldig:        48,40 kr  (kun fra ordre)
```

---

## Tjekliste: Er din moms korrekt?

| ✅ | Opgave |
|----|--------|
| ☐ | CVR-nummer indtastet |
| ☐ | Standard momssats sat til 25% |
| ☐ | "Vis priser inkl. moms" aktiveret |
| ☐ | "Vis moms på kvittering" aktiveret |
| ☐ | Kvitteringsskabelon verificeret |
| ☐ | Test-ordre oprettet og moms verificeret |
| ☐ | Z-rapport gennemgået |

---

## Fejlfinding

### Moms vises ikke på kvittering

**Løsning:** Aktiver "Vis moms separat" i Indstillinger → Kvitteringer

### Forkert momsberegning

**Tjek:**
1. Er produktprisen inkl. eller ekskl. moms?
2. Er korrekt momssats valgt?
3. Er der specielle momskategorier?

### Z-rapport matcher ikke kassebeholdning

**Mulige årsager:**
- Kontantsalg ikke registreret i systemet
- Returneringer ikke bogført
- Drikkepenge medregnet forkert

---

## Ressourcer

- 📖 [SKAT: Moms for restauranter](https://skat.dk/moms)
- 📖 [Regler for kvitteringer](https://erhvervsstyrelsen.dk)
- 📧 Spørgsmål? [support@orderflow.ai](mailto:support@orderflow.ai)

---

## Næste skridt

- [Rapporter & Eksport →](../guides/reports-export.md)
- [Integration med regnskab →](../guides/pos-integration.md)
- [API: Momsdata →](../api/endpoints/reports.md)
