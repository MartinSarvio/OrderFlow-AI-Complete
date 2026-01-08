# Tutorial: Byg et custom workflow

> Opret avancerede automatiseringsflows tilpasset din virksomheds behov.

**Tidsforbrug:** 30-45 minutter  
**Niveau:** Mellemniveau  
**Resultat:** Et fungerende custom workflow

---

## Hvad du lærer

- ✅ Forstå workflow-komponenter (triggers, conditions, actions)
- ✅ Bygge et workflow fra bunden
- ✅ Bruge betingelser og forgreninger
- ✅ Integrere AI i dit workflow
- ✅ Teste og debugge

---

## Workflow-grundbegreber

Et workflow består af tre hovedelementer:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   TRIGGER   │ →  │  CONDITION  │ →  │   ACTION    │
│  (Hvornår)  │    │   (Hvis)    │    │  (Så gør)   │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Triggers (Hvad starter flowet)

| Trigger | Beskrivelse |
|---------|-------------|
| **SMS modtaget** | Kunde sender SMS |
| **Missed call** | Ubesvaret opkald |
| **Ordre oprettet** | Ny ordre i systemet |
| **Ordre status ændret** | Status ændres |
| **Tidsbaseret** | Kl. X, hver dag/uge |
| **Webhook** | Eksternt system kalder |

### Conditions (Betingelser)

| Condition | Eksempel |
|-----------|----------|
| **Indeholder tekst** | Besked indeholder "pizza" |
| **Tidspunkt** | Mellem kl. 11-22 |
| **Ordreværdi** | Over 200 kr |
| **Kundetype** | Ny kunde / Stamkunde |
| **Status** | Ordre er "pending" |

### Actions (Handlinger)

| Action | Beskrivelse |
|--------|-------------|
| **Send SMS** | Send besked til kunde |
| **Opret ordre** | Generer ordre fra besked |
| **Opdater status** | Ændr ordrestatus |
| **Send email** | Intern notifikation |
| **Kald API** | Integrer eksternt system |
| **AI Handling** | Lad AI fortolke og handle |

---

## Del 1: Åbn Workflow Builder (5 min)

### Adgang til builder

1. Klik på **Workflow** i sidemenuen
2. Vælg restaurant (eller "Alle")
3. Klik **Opret nyt workflow**

<!-- 📸 SCREENSHOT: Workflow builder tom -->

### Interface overblik

```
┌──────────────────────────────────────────────────────────┐
│ [Gem] [Test] [Aktiver]                    Workflow navn  │
├────────────┬─────────────────────────────────────────────┤
│            │                                             │
│  TRIGGERS  │           CANVAS                            │
│            │                                             │
│ CONDITIONS │     ┌─────────┐                             │
│            │     │ Start   │                             │
│  ACTIONS   │     └────┬────┘                             │
│            │          │                                  │
│            │          ▼                                  │
│            │                                             │
└────────────┴─────────────────────────────────────────────┘
```

- **Venstre panel:** Komponenter du kan trække ind
- **Canvas:** Her bygger du dit flow
- **Toolbar:** Gem, test, aktiver

---

## Del 2: Byg dit første workflow (15 min)

Lad os bygge et workflow til automatisk ordrehåndtering med bekræftelse.

### Scenarie

```
Kunde sender SMS med ordre
     ↓
AI fortolker ordren
     ↓
Hvis konfidens > 85%: Auto-bekræft
Hvis konfidens < 85%: Send til manuel gennemgang
     ↓
Send bekræftelse til kunde
```

### Trin 1: Tilføj trigger

1. Fra venstre panel, træk **"SMS modtaget"** ind på canvas
2. Placer den ved Start-noden
3. Forbind dem med en linje

<!-- 📸 SCREENSHOT: Trigger tilføjet -->

**Konfigurer trigger:**
- Restaurant: Vælg din restaurant
- Filter: Alle beskeder (eller kun nye numre)

### Trin 2: Tilføj AI-handling

1. Træk **"AI Fortolkning"** ind
2. Forbind til triggeren

**Konfigurer AI:**
```
AI Model: OrderFlow AI v2
Handling: Fortolk som ordre
Output: ordre_data, konfidens
```

### Trin 3: Tilføj betingelse (branch)

1. Træk **"Betingelse"** ind
2. Forbind til AI-handlingen

**Konfigurer betingelse:**
```
Hvis: konfidens >= 0.85
  → Ja-gren (auto-bekræft)
  → Nej-gren (manuel gennemgang)
```

<!-- 📸 SCREENSHOT: Betingelse med to grene -->

### Trin 4: Tilføj actions

**Ja-gren (høj konfidens):**
1. Træk **"Opret ordre"** ind på ja-grenen
2. Træk **"Send SMS"** ind efter

**Konfigurer "Opret ordre":**
```
Data: {ordre_data} fra AI
Status: confirmed
Auto-pris: Ja
```

**Konfigurer "Send SMS":**
```
Modtager: {kunde.telefon}
Besked: 
"Tak for din ordre hos {restaurant}! 🎉

Ordre #{{ordre.nummer}}
{{ordre.linjer}}

Total: {{ordre.total}} kr
Levering: {{ordre.leveringstid}}

Vi glæder os!"
```

**Nej-gren (lav konfidens):**
1. Træk **"Opret ordre"** ind (status: pending_review)
2. Træk **"Send intern notifikation"** ind
3. Træk **"Send SMS"** ind til kunde

**Konfigurer kunde-SMS (lav konfidens):**
```
"Tak for din besked! 

Vi behandler din ordre og vender tilbage 
inden for få minutter.

Mvh {restaurant}"
```

### Komplet workflow

```
        ┌──────────────────┐
        │  SMS modtaget    │
        └────────┬─────────┘
                 │
                 ▼
        ┌──────────────────┐
        │  AI Fortolkning  │
        └────────┬─────────┘
                 │
                 ▼
        ┌──────────────────┐
        │  Konfidens ≥ 85% │
        └────────┬─────────┘
                 │
        ┌────────┴────────┐
        │                 │
   ┌────▼────┐       ┌────▼────┐
   │   JA    │       │   NEJ   │
   └────┬────┘       └────┬────┘
        │                 │
   ┌────▼────┐       ┌────▼────┐
   │ Opret   │       │ Opret   │
   │ ordre   │       │ ordre   │
   │(confirm)│       │(pending)│
   └────┬────┘       └────┬────┘
        │                 │
   ┌────▼────┐       ┌────▼────┐
   │ Send    │       │ Notifik │
   │ bekræft.│       │ intern  │
   └────┬────┘       └────┬────┘
        │                 │
        │            ┌────▼────┐
        │            │ Send    │
        │            │"vi vender│
        │            │ tilbage"│
        │            └────┬────┘
        │                 │
        └────────┬────────┘
                 │
                 ▼
              [SLUT]
```

---

## Del 3: Test dit workflow (10 min)

### Test-mode

1. Klik **Test** i toolbar
2. Vælg test-type: **Simuler SMS**
3. Indtast test-besked:
   ```
   2 pepperoni pizzaer til Hovedgaden 15 kl 18
   ```
4. Klik **Kør test**

### Analyser test-resultat

Test-panelet viser:

```
┌─────────────────────────────────────────┐
│ TEST RESULTAT                           │
├─────────────────────────────────────────┤
│ ✅ SMS modtaget          0.1s           │
│ ✅ AI Fortolkning        1.2s           │
│    → Konfidens: 92%                     │
│    → Produkter: 2x Pepperoni Pizza      │
│ ✅ Betingelse: JA-gren   0.0s           │
│ ✅ Opret ordre           0.3s           │
│    → Ordre #TEST-1234                   │
│ ✅ Send SMS (simuleret)  0.1s           │
│                                         │
│ TOTAL TID: 1.7 sekunder                 │
└─────────────────────────────────────────┘
```

### Test edge cases

Prøv også:

| Test | Forventet resultat |
|------|-------------------|
| "hej" | Lav konfidens → Nej-gren |
| Ordre på 2000 kr | Høj værdi → Tjek det håndteres |
| Uden adresse | AI beder om leveringsinfo |
| Lukket tid | Besked om åbningstider |

---

## Del 4: Avancerede funktioner (15 min)

### Loops og ventetid

Tilføj forsinkelser mellem handlinger:

```
Ordre leveret
     ↓
[Vent 45 minutter]
     ↓
Send anmeldelses-opfordring
```

**Konfigurer ventetid:**
```
Type: Relativ tid
Værdi: 45 minutter
```

### Variabler og data

Brug variabler til at overføre data:

| Variabel | Tilgængelig fra | Eksempel |
|----------|-----------------|----------|
| `{trigger.besked}` | SMS trigger | "2 pizzaer" |
| `{ai.konfidens}` | AI handling | 0.92 |
| `{ordre.total}` | Opret ordre | 189.00 |
| `{kunde.navn}` | Alle | "Anders" |

### Webhook integration

Kald eksterne systemer:

```
Action: HTTP Request
URL: https://din-webshop.dk/api/orders
Method: POST
Headers: 
  Authorization: Bearer {env.WEBSHOP_KEY}
Body:
{
  "source": "orderflow",
  "order_id": "{ordre.id}",
  "items": {ordre.linjer},
  "total": {ordre.total}
}
```

### Fejlhåndtering

Tilføj error-handling:

1. Højreklik på en action
2. Vælg **"Tilføj fejlhåndtering"**
3. Konfigurer:

```
Ved fejl:
  ☑ Prøv igen (max 3 gange)
  ☑ Vent 30 sekunder mellem forsøg
  ☑ Ved vedvarende fejl: Send alert til admin
```

---

## Del 5: Aktiver og overvåg

### Aktivér workflow

1. Verificer alle test er grønne
2. Klik **Aktiver** i toolbar
3. Vælg **Gradvis udrulning** (anbefalet):
   - Start med 10% af trafik
   - Øg til 50% efter 1 time
   - Fuld aktivering efter 24 timer

### Monitor performance

Gå til **Workflow** → **Analytics**:

| Metrik | Beskrivelse |
|--------|-------------|
| **Kørsler** | Antal gange workflow er kørt |
| **Success rate** | % der fuldførte uden fejl |
| **Gns. tid** | Gennemsnitlig kørselstid |
| **Fejl** | Antal og typer af fejl |

### Alerts

Sæt alerts op:

1. Klik **Alerts** i workflow
2. Tilføj:
   - Fejlrate > 5% → Email til admin
   - Svartid > 5 sek → Slack notifikation

---

## Eksempel-workflows

### 1. Automatisk åbningstid-svar

```
Trigger: SMS modtaget
Condition: Uden for åbningstid
Action: Send SMS
  "Tak for din besked! 
   Vi har lukket nu, men åbner igen {næste_åbningstid}.
   Din besked er gemt, og vi svarer hurtigst muligt."
```

### 2. VIP kunde-behandling

```
Trigger: Ordre oprettet
Condition: Kunde har > 10 tidligere ordrer
Actions:
  - Tilføj 10% rabat automatisk
  - Send personlig velkomst-SMS
  - Marker ordre som "VIP" internt
```

### 3. Lav-lagerbeholdning alert

```
Trigger: Ordre oprettet
Condition: Produkt lager < 5
Actions:
  - Send email til indkøber
  - Opdater produkt som "Få tilbage"
```

---

## Tjekliste: Klar til produktion

| ✅ | Opgave |
|----|--------|
| ☐ | Alle stier testet (ja og nej-grene) |
| ☐ | Edge cases håndteret |
| ☐ | Fejlhåndtering tilføjet |
| ☐ | Test-kørsler succesfulde |
| ☐ | Alerts konfigureret |
| ☐ | Gradvis udrulning valgt |

---

## Fejlfinding

### Workflow kører ikke

| Problem | Løsning |
|---------|---------|
| Ikke aktiveret | Klik "Aktiver" |
| Trigger matcher ikke | Tjek trigger-betingelser |
| Restaurant ikke valgt | Vælg korrekt restaurant |

### Action fejler

| Fejl | Løsning |
|------|---------|
| SMS ikke sendt | Tjek telefonnummer format |
| AI timeout | Øg timeout eller simplificer besked |
| Webhook fejl | Verificer URL og authentication |

---

## Næste skridt

- [API: Workflow endpoints →](../api/endpoints/workflows.md)
- [Webhooks guide →](../api/webhooks.md)
- [AI Træning →](./train-ai-orders.md)

---

## Brug for inspiration?

Se vores **Workflow Galleri** med færdige templates:

1. Gå til **Workflow** → **Galleri**
2. Browse kategorier
3. Klik **Brug template**
4. Tilpas til dit behov
