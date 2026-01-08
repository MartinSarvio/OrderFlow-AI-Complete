# Rapporter & Eksport

> Generer detaljerede rapporter og eksporter data i PDF, Excel eller CSV.

---

## Tilgængelige rapporter

| Rapport | Beskrivelse | Bedst til |
|---------|-------------|-----------|
| **Dagsrapport** | Komplet overblik over en dags aktivitet | Daglig opfølgning |
| **Produktrapport** | Salg per produkt og kategori | Menuplanlægning |
| **Z-rapport** | Kasserapport med moms | Bogføring |
| **Konverteringsrapport** | Henvendelser vs. ordrer | Performance-analyse |
| **Genbestillingsrapport** | Tilbagevendende kunder | Kundeloyalitet |
| **Anmeldelsesrapport** | Google/Trustpilot statistik | Omdømme |
| **Heatmap-rapport** | Ordrer fordelt på tid | Bemanding |

---

## Dagsrapport

Den mest brugte rapport - giver komplet overblik over en dags ordrer.

### Adgang

1. Gå til **Rapporter** → **Dagsrapport**
2. Vælg dato
3. Klik **Generer rapport**

<!-- 📸 SCREENSHOT: Dagsrapport interface -->

### Indhold

```
┌─────────────────────────────────────────────┐
│ DAGSRAPPORT - 15. januar 2025               │
│ Bella Italia                                │
├─────────────────────────────────────────────┤
│ OMSÆTNING                                   │
│ ─────────────────────────────────────────── │
│ Bruttosalg:              12.450,00 kr       │
│ Rabatter:                  -250,00 kr       │
│ Nettosalg:               12.200,00 kr       │
│ Moms (25%):               3.050,00 kr       │
│ Total inkl. moms:        15.250,00 kr       │
├─────────────────────────────────────────────┤
│ ORDRER                                      │
│ ─────────────────────────────────────────── │
│ Antal ordrer:                    47         │
│ Gns. ordreværdi:             324,47 kr      │
│ Levering:                        32         │
│ Afhentning:                      15         │
├─────────────────────────────────────────────┤
│ BETALINGER                                  │
│ ─────────────────────────────────────────── │
│ Kort:                    11.200,00 kr       │
│ Kontant:                  2.150,00 kr       │
│ MobilePay:                1.900,00 kr       │
└─────────────────────────────────────────────┘
```

### Eksporter

Klik på **Eksporter** dropdown:
- **PDF** - Til print eller arkivering
- **Excel** - Til videre analyse
- **CSV** - Til import i andre systemer

---

## Z-rapport

Officiel kasserapport til bogføring med korrekt momsberegning.

### Hvornår bruges den?

- Daglig kasseafstemning
- Månedlig momsindberetning
- Revision og kontrol

### Indhold

| Sektion | Felter |
|---------|--------|
| **Omsætning** | Brutto, netto, moms |
| **Momsfordeling** | 25% moms, 0% moms (eksport) |
| **Betalingstyper** | Kort, kontant, MobilePay, faktura |
| **Korrektioner** | Returneringer, fejlrettelser |
| **Afstemning** | Forventet vs. optalt |

### Automatisk Z-rapport

Få Z-rapport sendt automatisk:

1. Gå til **Indstillinger** → **Rapporter**
2. Aktiver **Daglig Z-rapport**
3. Vælg modtagere (email)
4. Vælg tidspunkt (f.eks. kl. 23:00)

---

## Produktrapport

Se hvilke produkter der sælger bedst.

### Visninger

| Visning | Viser |
|---------|-------|
| **Top 10 produkter** | Bestsellers efter antal |
| **Efter omsætning** | Produkter efter DKK |
| **Efter kategori** | Grupperet (pizza, drikkevarer, etc.) |
| **Trend** | Sammenligning med forrige periode |

### Eksempel output

```
TOP 10 PRODUKTER (Januar 2025)

#  Produkt              Antal    Omsætning    %
─────────────────────────────────────────────────
1  Pepperoni Pizza       234     20.826 kr   18%
2  Margherita Pizza      198     15.642 kr   14%
3  Coca-Cola 0.5L        312      7.800 kr    7%
4  Pommes Frites         189      5.670 kr    5%
5  Burger Deluxe         145     13.050 kr   11%
...
```

> **💡 Pro-tip:** Brug denne rapport til at identificere produkter der bør fremhæves eller fjernes fra menuen.

---

## Konverteringsrapport

Analyser hvor effektivt du konverterer henvendelser til ordrer.

### Metrics

| Metrik | Forklaring |
|--------|------------|
| **Henvendelser** | Alle SMS, opkald, beskeder |
| **Ordrer** | Afsluttede ordrer |
| **Konverteringsrate** | Ordrer ÷ Henvendelser × 100% |
| **Tabt omsætning** | Estimat på ikke-konverterede |

### Breakdown

```
KONVERTERING - Januar 2025

Kanal             Henvendelser  Ordrer   Rate
────────────────────────────────────────────
SMS                      450     378     84%
Missed call →  SMS       120      41     34%
Telefon                  230     195     85%
────────────────────────────────────────────
TOTAL                    800     614     77%
```

### Forbedringstips

| Konverteringsrate | Vurdering | Anbefaling |
|-------------------|-----------|------------|
| > 80% | ⭐ Fremragende | Fortsæt nuværende strategi |
| 60-80% | ✅ God | Analyser tabte ordrer |
| 40-60% | ⚠️ Kan forbedres | Træn AI, optimer SMS |
| < 40% | ❌ Kritisk | Kontakt support for hjælp |

---

## Eksporter data

### Eksportformater

| Format | Bedst til | Filtype |
|--------|-----------|---------|
| **PDF** | Print, arkivering, deling | .pdf |
| **Excel** | Analyse, viderebehandling | .xlsx |
| **CSV** | Import til andre systemer | .csv |

### Sådan eksporterer du

1. Generer rapporten
2. Klik **Eksporter** (dropdown)
3. Vælg format
4. Filen downloades automatisk

<!-- 📸 SCREENSHOT: Eksport dropdown menu -->

### Bulk eksport

Eksporter flere rapporter på én gang:

1. Gå til **Rapporter** → **Bulk eksport**
2. Vælg rapporttyper
3. Vælg datoperiode
4. Klik **Download alle**

---

## Planlagte rapporter

Få rapporter sendt automatisk til din email.

### Opsætning

1. Gå til **Indstillinger** → **Planlagte rapporter**
2. Klik **Tilføj ny**
3. Konfigurer:

| Felt | Eksempel |
|------|----------|
| **Rapport** | Dagsrapport |
| **Frekvens** | Dagligt / Ugentligt / Månedligt |
| **Tidspunkt** | kl. 08:00 |
| **Format** | PDF |
| **Modtagere** | chef@restaurant.dk |

4. Klik **Gem**

### Populære setups

| Modtager | Rapport | Frekvens |
|----------|---------|----------|
| Ejer | Dagsrapport + Z-rapport | Dagligt |
| Manager | Konverteringsrapport | Ugentligt |
| Bogholder | Z-rapport + Momsrapport | Månedligt |

---

## API eksport

Hent rapportdata via API:

```bash
# Hent dagsrapport
curl -X GET "https://api.orderflow.ai/v1/reports/daily?date=2025-01-15&restaurant_id=rst_abc123" \
  -H "Authorization: Bearer sk_live_..." \
  -H "Accept: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2025-01-15",
    "orders": 47,
    "gross_sales": 15250.00,
    "net_sales": 12200.00,
    "vat": 3050.00,
    ...
  }
}
```

Se [API Reference →](../api/endpoints/reports.md) for alle endpoints.

---

## Tips til rapportanalyse

### Daglig rutine

1. ☀️ **Morgen:** Tjek gårsdagens dagsrapport
2. 📊 **Eftermiddag:** Tjek dagens ordrer vs. forventet
3. 🌙 **Aften:** Quick check på konverteringsrate

### Ugentlig analyse

- Sammenlign med forrige uge
- Identificer trends
- Juster bemanding baseret på heatmap

### Månedlig review

- Gennemgå produktrapport
- Analyser konverteringsudvikling
- Opdater budgetter

---

## Fejlfinding

### Rapport viser forkerte tal

| Problem | Løsning |
|---------|---------|
| Manglende ordrer | Tjek datofilter og restaurant |
| Forkert moms | Verificer momsindstillinger |
| Manglende produkter | Tjek produktkategorier |

### Eksport fejler

| Problem | Løsning |
|---------|---------|
| Timeout | Reducer datoperiode |
| Tomt dokument | Ingen data for periode |
| Formatfejl | Prøv andet format (CSV vs Excel) |

---

## Næste skridt

- [Brugeradministration →](./user-management.md) - Del rapporter med dit team
- [Dashboard Guide →](./dashboard-kpis.md) - Forstå dine KPI'er
- [API Reference →](../api/endpoints/reports.md) - Automatiser rapporter
