# Opsætning af AI-ordrehåndtering

> Lær hvordan OrderFlows AI automatisk fortolker og håndterer indkommende ordrer.

---

## Sådan virker AI-ordrehåndtering

Når en kunde sender en SMS eller besked, sker følgende:

```
📱 Kunde sender besked
        ↓
🤖 AI analyserer teksten
        ↓
📋 Ordre oprettes automatisk
        ↓
✅ Bekræftelse sendes til kunde
```

<!-- 📸 DIAGRAM: AI ordreflow visualisering -->

---

## Aktiver AI-ordrehåndtering

### Trin 1: Gå til Workflow

1. Klik på **Workflow** i sidemenuen
2. Vælg din restaurant i dropdown'en

### Trin 2: Aktiver Standard Workflow

1. Find **"AI Ordrehåndtering"** workflow
2. Klik på toggle-knappen for at aktivere
3. Workflowet er nu aktivt!

<!-- 📸 SCREENSHOT: Workflow panel med AI toggle -->

---

## AI Konfidens-niveauer

AI'en vurderer hvor sikker den er på sin fortolkning:

| Konfidens | Handling | Eksempel |
|-----------|----------|----------|
| **90-100%** 🟢 | Auto-bekræft ordre | "2 pepperoni pizzaer til Vestergade 10" |
| **70-89%** 🟡 | Ordre oprettes, markeres til gennemgang | "2 store pizzaer med skinke" |
| **< 70%** 🔴 | Manuel håndtering påkrævet | "det sædvanlige tak" |

### Juster konfidens-tærskel

Du kan ændre hvornår AI'en auto-bekræfter:

1. Gå til **Indstillinger** → **AI Indstillinger**
2. Juster **Auto-bekræft tærskel** (anbefalet: 85%)
3. Klik **Gem**

> **💡 Pro-tip:** Start med 90% og sænk gradvist når AI'en lærer dine produkter.

---

## Hvad AI'en forstår

### Produkter

AI'en genkender:
- Produktnavne (pizza, burger, sushi)
- Størrelser (lille, medium, stor)
- Tilvalg (ekstra ost, uden løg)
- Antal (2 stk, en portion)

### Leveringsinfo

AI'en udtrækker:
- Adresser (Vestergade 42, 8000 Aarhus)
- Tidspunkter (kl. 18, om en time, ASAP)
- Leveringstype (levering, afhentning)

### Kundeinfo

AI'en fanger:
- Navne (levering til Anders)
- Telefonnumre
- Specielle ønsker (ring på døren)

---

## Forbedre AI-nøjagtigheden

### 1. Tilføj din produktliste

Jo bedre produktliste, jo bedre AI:

1. Gå til din restaurant → **Produkter** tab
2. Klik **Tilføj produkt** eller **Importer**
3. Udfyld for hvert produkt:

```
Navn:        Pepperoni Pizza
Kategori:    Pizza
Størrelse:   32cm
Pris:        89,00 kr
Varianter:   Lille (26cm), Familie (45cm)
Beskrivelse: Tomatsauce, mozzarella, pepperoni
```

<!-- 📸 SCREENSHOT: Produkt editor -->

### 2. Tilføj aliaser/synonymer

Kunder bruger forskellige ord for det samme:

| Produkt | Aliaser |
|---------|---------|
| Pepperoni Pizza | Pepp pizza, pepperoni, salami pizza |
| Coca-Cola | Cola, Coke, Sodavand |
| Pommes Frites | Fritter, pomfrit, fries |

**Tilføj aliaser:**
1. Rediger produktet
2. Rul til **Aliaser**
3. Tilføj alternative navne
4. Gem

### 3. Definer tilvalg og fravalg

Angiv hvad der kan tilføjes/fjernes:

```
Tilvalg:  Ekstra ost (+15 kr), Bacon (+20 kr)
Fravalg:  Uden løg, Ingen dressing, Glutenfri bund (+25 kr)
```

---

## Håndter usikre ordrer

Når AI'en er usikker, markeres ordren til gennemgang.

### Se ordrer til gennemgang

1. Gå til **Ordrer** i sidemenuen
2. Klik på filter **"Behøver gennemgang"**
3. Se liste over ventende ordrer

<!-- 📸 SCREENSHOT: Ordrer med gennemgang-filter -->

### Gennemgå en ordre

1. Klik på ordren
2. Se AI's fortolkning vs. original besked
3. Ret eventuelle fejl:
   - Tilføj/fjern produkter
   - Ret antal
   - Opdater leveringsinfo
4. Klik **Bekræft ordre**

### Lær AI'en fra rettelser

Når du retter en ordre, lærer AI'en:

```
Original: "2 pep med ekstra"
AI gættede: 2x Pepperoni Pizza
Du rettede: 2x Pepperoni Pizza + Ekstra ost

→ AI lærer: "ekstra" + pizza = ekstra ost
```

---

## AI Træningsdata

### Se AI's læring

1. Gå til **Indstillinger** → **AI Indstillinger**
2. Klik på **Træningsdata**
3. Se eksempler AI'en har lært fra

### Tilføj manuel træning

Du kan manuelt lære AI'en nye mønstre:

1. Klik **Tilføj eksempel**
2. Indtast eksempel-besked:
   ```
   "Det sædvanlige til Hansen"
   ```
3. Angiv korrekt fortolkning:
   ```
   Kunde: Hansen
   Produkt: Margherita Pizza (hans standard-ordre)
   ```
4. Gem

---

## Avancerede indstillinger

### Automatisk prissætning

| Indstilling | Beskrivelse |
|-------------|-------------|
| **Brug produktpriser** | AI bruger dine listede priser |
| **Tillad prisforhandling** | AI accepterer "hvad koster det?" |
| **Minimum ordre** | Afvis ordrer under X kr |

### Åbningstider

AI'en kan automatisk:
- Informere om lukkede dage
- Foreslå næste ledige tid
- Tage imod forudbestillinger

### Svar-stil

Vælg hvordan AI'en kommunikerer:

| Stil | Eksempel |
|------|----------|
| **Professionel** | "Tak for din ordre. Vi bekræfter..." |
| **Venlig** | "Fedt! 🎉 Din ordre er modtaget..." |
| **Kort** | "Ordre bekræftet. Levering kl. 18:30" |

---

## Overvågning & Rapporter

### AI Performance Dashboard

Under **Dashboard** ser du:
- **AI Success Rate**: % ordrer håndteret uden manuel indgriben
- **Gns. konfidens**: Gennemsnitlig AI-sikkerhed
- **Fejlrate**: Ordrer der krævede rettelser

### Ugentlig AI-rapport

Hver mandag modtager du en email med:
- Ugens AI-statistik
- Top 5 misforståelser
- Anbefalede forbedringer

---

## Fejlfinding

### AI forstår ikke mine produkter

**Løsning:**
1. Tjek at produktet er tilføjet med korrekt navn
2. Tilføj aliaser for alternative navne
3. Tilføj eksempler til træningsdata

### AI gætter forkerte priser

**Løsning:**
1. Opdater produktpriser i systemet
2. Tjek at størrelser har korrekte priser
3. Verificer tilvalgs-priser

### AI svarer på forkert sprog

**Løsning:**
1. Gå til **Indstillinger** → **AI Indstillinger**
2. Sæt **Primært sprog** til Dansk
3. Gem og test

---

## Næste skridt

- [Træn din AI med eksempler →](../tutorials/train-ai-orders.md)
- [Konfigurer SMS-beskeder →](./sms-configuration.md)
- [Byg custom workflows →](../tutorials/custom-workflow.md)
