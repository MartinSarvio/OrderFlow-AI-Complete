# Tutorial: Træn din AI til ordrestyring

> Lær AI'en at forstå dine produkter, kundemønstre og særlige ønsker.

**Tidsforbrug:** 20-30 minutter  
**Niveau:** Begynder til mellemniveau  
**Resultat:** AI med +90% nøjagtighed på dine ordrer

---

## Hvad du lærer

- ✅ Tilføje og strukturere din produktliste
- ✅ Oprette aliaser og synonymer
- ✅ Håndtere tilvalg og fravalg
- ✅ Tilføje træningseksempler
- ✅ Teste og forbedre AI-nøjagtigheden

---

## Del 1: Opsæt din produktliste (10 min)

En god produktliste er fundamentet for AI-nøjagtighed.

### Trin 1: Gå til produkter

1. Vælg din restaurant i sidemenuen
2. Klik på **Produkter** tab

<!-- 📸 SCREENSHOT: Produktliste tom -->

### Trin 2: Tilføj kategorier først

Strukturér dine produkter i kategorier:

```
📁 Pizza
📁 Burger
📁 Tilbehør
📁 Drikkevarer
📁 Dessert
```

**Sådan:**
1. Klik **Tilføj kategori**
2. Indtast navn (f.eks. "Pizza")
3. Gem

### Trin 3: Tilføj produkter

For hvert produkt, udfyld:

| Felt | Eksempel | Vigtighed |
|------|----------|-----------|
| **Navn** | Pepperoni Pizza | ⭐⭐⭐ Kritisk |
| **Kategori** | Pizza | ⭐⭐⭐ Kritisk |
| **Pris** | 89,00 kr | ⭐⭐⭐ Kritisk |
| **Beskrivelse** | Tomatsauce, mozzarella, pepperoni | ⭐⭐ Vigtigt |
| **Størrelse** | 32cm | ⭐⭐ Vigtigt |

<!-- 📸 SCREENSHOT: Produkt editor udfyldt -->

### Trin 4: Importer eksisterende menukort

Har du allerede en produktliste?

1. Klik **Importer**
2. Upload CSV eller Excel
3. Map kolonner til felter
4. Verificer og importer

**CSV format:**
```csv
name,category,price,description
Pepperoni Pizza,Pizza,89.00,"Tomatsauce, mozzarella, pepperoni"
Margherita Pizza,Pizza,79.00,"Tomatsauce, mozzarella, frisk basilikum"
```

---

## Del 2: Tilføj aliaser og synonymer (5 min)

Kunder bruger forskellige ord for det samme produkt.

### Eksempler på aliaser

| Produkt | Aliaser kunder bruger |
|---------|----------------------|
| Pepperoni Pizza | "pepp", "pepperoni", "salami pizza", "den med pepperoni" |
| Coca-Cola | "cola", "coke", "en cola", "sodavand" |
| Pommes Frites | "fritter", "pomfrit", "fries", "kartofler" |

### Sådan tilføjer du aliaser

1. Klik på et produkt
2. Find **Aliaser** sektionen
3. Tilføj alternative navne (et per linje)
4. Gem

```
pepp
pepperoni
salami pizza
den med pepperoni
den røde
```

> **💡 Pro-tip:** Lyt til hvad kunder faktisk skriver og tilføj løbende.

---

## Del 3: Konfigurer tilvalg og fravalg (5 min)

### Standard tilvalg

Ting kunder ofte tilføjer:

| Tilvalg | Pris | Gælder for |
|---------|------|------------|
| Ekstra ost | +15 kr | Pizza, Burger |
| Bacon | +20 kr | Pizza, Burger |
| Ekstra dressing | +5 kr | Salater |
| Stor portion | +25 kr | Alle retter |

**Sådan opsættes:**

1. Gå til **Indstillinger** → **Tilvalg**
2. Klik **Tilføj tilvalg**
3. Udfyld:
   - Navn: "Ekstra ost"
   - Pris: 15.00
   - Kategorier: Pizza, Burger
4. Gem

### Standard fravalg

Ting kunder ofte fjerner (ingen prisændring):

```
Uden løg
Ingen dressing
Uden tomat
Glutenfri bund (+25 kr)
```

### Aliaser for tilvalg/fravalg

Kunder skriver forskelligt:

| Hvad de skriver | Hvad det betyder |
|-----------------|------------------|
| "ekstra", "mere" | Tilvalg (dobbelt portion) |
| "uden", "ingen", "ikke" | Fravalg |
| "med X" | Tilføj X |
| "skift til", "i stedet for" | Erstat |

---

## Del 4: Tilføj træningseksempler (10 min)

Nu lærer vi AI'en specifikke mønstre fra din virksomhed.

### Hvad er træningseksempler?

Et træningseksempel viser AI'en:
- En **besked** (hvad kunden skriver)
- Den **korrekte fortolkning** (hvad det betyder)

### Vigtige eksempeltyper

#### 1. Standard ordrer

```
Besked: "2 pepperoni og en cola"
Fortolkning:
  - 2x Pepperoni Pizza
  - 1x Coca-Cola
```

#### 2. Ordrer med tilvalg

```
Besked: "en margherita med ekstra ost"
Fortolkning:
  - 1x Margherita Pizza
  - Tilvalg: Ekstra ost (+15 kr)
```

#### 3. Ordrer med fravalg

```
Besked: "burger uden løg og tomat"
Fortolkning:
  - 1x Burger
  - Fravalg: Uden løg, Uden tomat
```

#### 4. Uformelle beskeder

```
Besked: "det sædvanlige til Hansen"
Fortolkning:
  - Kunde: Hansen (gem som stamkunde)
  - Ordre: Tjek kundens tidligere ordrer
```

#### 5. Leveringsinfo

```
Besked: "levering til Hovedgaden 15, 2tv kl 18"
Fortolkning:
  - Adresse: Hovedgaden 15, 2. tv
  - Tidspunkt: 18:00
  - Type: Levering
```

### Sådan tilføjer du eksempler

1. Gå til **Indstillinger** → **AI Træning**
2. Klik **Tilføj eksempel**
3. Indtast kundebesked
4. Angiv korrekt fortolkning
5. Gem

<!-- 📸 SCREENSHOT: AI trænings interface -->

### Anbefalede eksempler at tilføje

| Kategori | Antal eksempler |
|----------|-----------------|
| Standard ordrer | 10-15 |
| Med tilvalg | 5-10 |
| Med fravalg | 5-10 |
| Med leveringsinfo | 5-10 |
| Uformelle/lokale | 5-10 |
| **Total** | **30-55 eksempler** |

---

## Del 5: Test og forbedre (løbende)

### Test din AI

1. Gå til **Workflow** → **Test**
2. Skriv en test-besked
3. Se AI's fortolkning
4. Vurder om den er korrekt

**Test-sætninger at prøve:**

```
"2 store pepperoni med ekstra ost til Vestergade 42"
"en cola og fritter"
"det samme som sidst"
"kan jeg få 3 margherita til afhentning kl 17?"
```

### Analyser fejl

Når AI'en tager fejl:

1. Gå til **Ordrer** → **Behøver gennemgang**
2. Se hvad AI'en gættede vs. hvad der var korrekt
3. Ret ordren
4. Tilføj som træningseksempel

### Månedlig AI review

Hver måned:

1. Tjek AI Success Rate i Dashboard
2. Gennemgå top 10 fejlfortolkninger
3. Tilføj nye træningseksempler
4. Opdater aliaser baseret på nye mønstre

---

## Avanceret: Kontekst og hukommelse

### Stamkunder

AI'en kan huske stamkunders præferencer:

```
Kunde: Anders Jensen (+4512345678)
Præferencer:
  - Altid levering
  - "Det sædvanlige" = 2x Pepperoni + Cola
  - Allergisk over for nødder
```

**Opsætning:**
1. Gå til kundens profil
2. Tilføj **Præferencer**
3. AI'en bruger dette ved fremtidige ordrer

### Tidskontekst

AI'en forstår tid:

| Kunde skriver | AI forstår |
|---------------|------------|
| "til i aften" | I dag, aften (17-21) |
| "om en time" | Nu + 1 time |
| "til weekenden" | Lørdag eller søndag |
| "ASAP" | Hurtigst muligt |

---

## Tjekliste: Er din AI klar?

| ✅ | Opgave |
|----|--------|
| ☐ | Alle produkter tilføjet med korrekte priser |
| ☐ | Kategorier oprettet og tildelt |
| ☐ | Minimum 3 aliaser per populært produkt |
| ☐ | Tilvalg/fravalg konfigureret |
| ☐ | 30+ træningseksempler tilføjet |
| ☐ | Test gennemført med 10 forskellige beskeder |
| ☐ | AI Success Rate > 85% |

---

## Fejlfinding

### AI forstår ikke produktnavn

**Løsning:** Tilføj som alias på produktet

### AI gætter forkert pris

**Løsning:** Opdater produktpris, tjek at størrelser har unikke priser

### AI misforstår tilvalg

**Løsning:** Tilføj specifikt træningseksempel

### AI kan ikke finde adresse

**Løsning:** Tjek at leveringsområder er konfigureret

---

## Næste skridt

- [Byg custom workflows →](./custom-workflow.md)
- [Opsæt moms-regler →](./vat-configuration.md)
- [AI Indstillinger reference →](../api/endpoints/ai.md)

---

## Brug for hjælp?

Vores team kan hjælpe med AI-træning:

- 📧 [support@orderflow.ai](mailto:support@orderflow.ai)
- 📞 +45 12 34 56 78 (hverdage 9-17)
