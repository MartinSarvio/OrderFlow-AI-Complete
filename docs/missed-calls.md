# Håndtering af Missed Calls

> Konverter mistede opkald til ordrer med automatisk SMS-opfølgning.

---

## Hvorfor Missed Calls er vigtige

Hver gang telefonen ringer uden svar, risikerer du at miste en kunde. Med OrderFlows missed call-håndtering:

| Uden OrderFlow | Med OrderFlow |
|----------------|---------------|
| Kunde ringer → Ingen svar → Kunde går til konkurrent | Kunde ringer → Auto-SMS inden 30 sek → Kunde bestiller via SMS |
| **Tabt omsætning** | **Reddet omsætning** |

> **📊 Statistik:** Gennemsnitlig konverteringsrate fra missed call til ordre: **34%**

---

## Sådan virker det

```
📞 Kunde ringer
        ↓
❌ Opkald besvares ikke
        ↓
⏱️ 30 sekunder
        ↓
📱 Auto-SMS sendes til kunde
        ↓
💬 Kunde svarer med ordre
        ↓
🤖 AI behandler ordren
        ↓
✅ Ordre bekræftet!
```

<!-- 📸 DIAGRAM: Missed call flow -->

---

## Aktiver Missed Call Håndtering

### Forudsætninger

- ✅ Telefonnummer registreret på din restaurant
- ✅ SMS-workflow aktiveret

### Opsætning

1. Gå til **Workflow** i sidemenuen
2. Vælg din restaurant
3. Find **"Missed Call Auto-svar"** trigger
4. Klik toggle for at aktivere

<!-- 📸 SCREENSHOT: Missed call toggle i workflow -->

---

## Konfigurer Auto-SMS

### Standard skabelon

```
Hej! Vi så du ringede til {restaurant} 📞

Vi kunne desværre ikke nå telefonen.

Du kan nemt bestille via SMS - skriv bare hvad 
du ønsker, så klarer vi resten!

Mvh {restaurant}
```

### Tilpas beskeden

1. Gå til **Indstillinger** → **SMS Skabeloner**
2. Find **"Missed Call Auto-svar"**
3. Klik **Rediger**
4. Tilpas teksten
5. **Test** og **Gem**

### Effektive beskeder

| ✅ Gør dette | ❌ Undgå dette |
|--------------|----------------|
| Anerkend opkaldet | Ignorer at de ringede |
| Giv klar handling (bestil via SMS) | Vær uklar om næste skridt |
| Hold det kort | Lange beskeder |
| Vær venlig og hjælpsom | Lyd automatiseret |

**Eksempel på god besked:**
```
Hej! Beklager vi missede dit opkald 😊

Skriv din bestilling her, så ordner vi det!

Eks: "2 pepperoni pizzaer til Hovedgaden 15 kl 18"
```

---

## Timing-indstillinger

### Forsinkelse før SMS

| Indstilling | Anbefaling | Begrundelse |
|-------------|------------|-------------|
| **30 sekunder** ✅ | Anbefalet | Giver tid til callback, men ikke for lang ventetid |
| 15 sekunder | For hurtigt | Kunde kan stadig prøve igen |
| 60+ sekunder | For langsomt | Kunde kan have bestilt andetsteds |

### Aktive timer

Konfigurer hvornår auto-SMS sendes:

1. Gå til **Indstillinger** → **Missed Call**
2. Sæt **Aktive timer** (f.eks. 10:00 - 22:00)
3. Opkald uden for disse timer udløser ikke SMS

> **💡 Pro-tip:** Match dine åbningstider, så kunder ikke får SMS kl. 3 om natten.

---

## Undtagelser & Regler

### Bloker gentagne opkald

Undgå at sende flere SMS'er til samme nummer:

| Indstilling | Beskrivelse |
|-------------|-------------|
| **Cooldown periode** | Minimum tid mellem SMS'er til samme nummer |
| **Anbefalet:** 30 minutter | Kunden får kun 1 SMS per halve time |

### Blokerede numre

Tilføj numre der ikke skal modtage auto-SMS:

1. Gå til **Indstillinger** → **Missed Call**
2. Rul til **Blokerede numre**
3. Tilføj nummer (f.eks. leverandører, personlige kontakter)

### Internationale numre

| Indstilling | Beskrivelse |
|-------------|-------------|
| **Tillad alle** | Send til alle numre |
| **Kun Danmark (+45)** | Kun danske numre |
| **Norden** | DK, SE, NO, FI |

---

## Statistik & Rapporter

### Se missed call data

1. Gå til **Dashboard**
2. Find **"Reddet omsætning"** KPI
3. Klik for detaljer

### Missed Call Rapport

Under **Rapporter** → **Konverteringsrapport**:

| Metrik | Beskrivelse |
|--------|-------------|
| **Missed calls i dag** | Antal ubesvarede opkald |
| **SMS'er sendt** | Antal auto-SMS sendt |
| **Konverteringer** | Ordrer fra missed calls |
| **Konverteringsrate** | % der blev til ordrer |
| **Reddet omsætning** | DKK fra konverterede calls |

<!-- 📸 SCREENSHOT: Konverteringsrapport -->

---

## Integration med telefonsystem

### Understøttede systemer

OrderFlow kan integreres med:

| System | Integration |
|--------|-------------|
| **Mobil (direkte)** | Webhook fra telefonudbyder |
| **Fastnet via VoIP** | SIP trunk integration |
| **Telavox** | Native integration |
| **Flexfone** | Native integration |
| **3CX** | API integration |

### Opsæt integration

1. Kontakt din telefonudbyder
2. Bed om "missed call webhook" eller "call event API"
3. Indtast webhook URL i **Indstillinger** → **Integrationer**
4. Test med et opkald

> **📞 Brug for hjælp?** Kontakt support@orderflow.ai - vi hjælper med opsætning.

---

## Best Practices

### 1. Svar alligevel når muligt

Auto-SMS er en backup, ikke en erstatning:
- Prøv altid at besvare opkald
- Brug auto-SMS når det ikke er muligt

### 2. Følg op på konverteringer

Når en kunde bestiller via missed call SMS:
- Bekræft ordren hurtigt
- Overvej at ringe tilbage ved store ordrer
- Giv ekstra god service (de var tålmodige!)

### 3. Analyser mønstre

Se hvornår du får flest missed calls:
- Tilføj personale i spidsbelastning
- Juster åbningstider om nødvendigt

---

## Fejlfinding

### SMS sendes ikke

| Problem | Løsning |
|---------|---------|
| Workflow ikke aktiveret | Aktiver "Missed Call Auto-svar" i Workflow |
| Uden for aktive timer | Tjek timing-indstillinger |
| Nummer på blokeringsliste | Fjern fra blokerede numre |
| Telefon ikke registreret | Tilføj telefonnummer til restaurant |

### For mange SMS'er

| Problem | Løsning |
|---------|---------|
| Samme kunde får flere SMS'er | Øg cooldown periode |
| Interne numre får SMS | Tilføj til blokeringsliste |

### Kunder klager

| Klage | Løsning |
|-------|---------|
| "Jeg ringede ikke" | Tjek telefonnummer (spoofing kan forekomme) |
| "Stop med SMS" | De kan svare STOP for at framelde |
| "Jeg vil ikke bestille via SMS" | Det er frivilligt - de kan stadig ringe |

---

## ROI Beregning

Beregn værdien af missed call håndtering:

```
Månedlig ROI =
  (Antal missed call konverteringer × Gns. ordreværdi)
  - SMS omkostninger

Eksempel:
  50 konverteringer × 200 kr = 10.000 kr
  150 SMS'er × 0,35 kr = 52,50 kr
  
  ROI = 10.000 - 52,50 = 9.947,50 kr/måned
```

---

## Næste skridt

- [Konfigurer SMS-beskeder →](./sms-configuration.md)
- [Se konverteringsrapporter →](./reports-export.md)
- [Opsæt AI-ordrehåndtering →](./ai-order-handling.md)
