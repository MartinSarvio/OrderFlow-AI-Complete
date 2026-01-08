# Konfigurer SMS-beskeder

> Tilpas automatiske SMS-beskeder til dine kunder og optimer din kommunikation.

---

## Oversigt

OrderFlow sender automatisk SMS'er ved forskellige hændelser. Du kan tilpasse alle skabeloner til at matche din tone og brand.

<!-- 📸 SCREENSHOT: SMS Skabeloner oversigt i Indstillinger -->

---

## Adgang til SMS-indstillinger

1. Gå til **Indstillinger** i sidemenuen
2. Klik på **SMS & Beskeder** tab
3. Vælg den restaurant du vil konfigurere

---

## Automatiske SMS-typer

### 1. 📥 Ordrebekræftelse

**Sendes:** Når en ordre oprettes/bekræftes

**Standard skabelon:**
```
Hej {kundenavn}! 👋

Tak for din ordre hos {restaurant}.

Ordrenr: #{ordrenummer}
Total: {total} kr

{leveringsinfo}

Vi glæder os til at servicere dig!
```

**Tilgængelige variabler:**

| Variabel | Beskrivelse | Eksempel |
|----------|-------------|----------|
| `{kundenavn}` | Kundens navn | Anders |
| `{restaurant}` | Restaurant navn | Bella Italia |
| `{ordrenummer}` | Ordre ID | 1234 |
| `{total}` | Total beløb | 259,00 |
| `{leveringsinfo}` | Levering/afhentning info | Levering ca. kl. 18:30 |
| `{adresse}` | Leveringsadresse | Vestergade 42, 8000 Aarhus |
| `{ordrelinjer}` | Liste af produkter | 2x Pepperoni Pizza |

---

### 2. 📞 Missed Call Auto-svar

**Sendes:** Inden for 30 sekunder efter et ubesvaret opkald

**Standard skabelon:**
```
Hej! Vi så du ringede til {restaurant} 📞

Vi kunne desværre ikke nå telefonen. 

Du kan nemt bestille via SMS - skriv bare hvad du ønsker, så klarer vi resten!

Mvh {restaurant}
```

> **💡 Pro-tip:** Denne SMS har den højeste konverteringsrate. Hold den kort og venlig!

---

### 3. 🚗 Leveringsopdatering

**Sendes:** Når ordre ændres til "Undervejs"

**Standard skabelon:**
```
Din ordre fra {restaurant} er nu på vej! 🚗

Forventet levering: {leveringstid}

Spørgsmål? Ring til os på {telefon}
```

---

### 4. ✅ Leveret bekræftelse

**Sendes:** Når ordre markeres som leveret (valgfri)

**Standard skabelon:**
```
Tak for din ordre hos {restaurant}! 🙏

Vi håber du nyder maden.

Vil du hjælpe os? Giv en anmeldelse her:
{anmeldelseslink}
```

---

### 5. ⭐ Anmeldelsesopfordring

**Sendes:** X minutter efter levering (konfigurerbar)

**Standard skabelon:**
```
Hej {kundenavn}!

Hvordan var din oplevelse hos {restaurant}?

Del din mening - det tager kun 30 sek:
⭐ {google_link}

Tak fordi du støtter os lokalt! 💚
```

**Timing indstillinger:**

| Indstilling | Anbefaling |
|-------------|------------|
| **Forsinkelse** | 45-60 minutter efter levering |
| **Tidspunkt** | Send kun mellem kl. 10-20 |
| **Frekvens** | Max 1 gang per kunde per 30 dage |

---

## Rediger en skabelon

### Step-by-step

1. Find skabelonen du vil redigere
2. Klik på **Rediger** (blyant-ikon)
3. Tilpas teksten
4. Brug variabler fra dropdown-menuen
5. Klik **Preview** for at se resultatet
6. Klik **Gem**

<!-- 📸 SCREENSHOT: Skabelon editor med preview -->

### Best practices

| ✅ Gør | ❌ Undgå |
|--------|---------|
| Hold det kort (< 160 tegn = 1 SMS) | Lange beskeder (dyrere) |
| Brug kundens navn | Upersonlige beskeder |
| Inkluder ordrenummer | Manglende reference |
| Klar call-to-action | Forvirrende tekst |
| Test før aktivering | Stavefejl |

---

## SMS-længde & Priser

SMS'er over 160 tegn deles op:

| Tegn | Antal SMS | Pris* |
|------|-----------|-------|
| 1-160 | 1 SMS | 0,35 kr |
| 161-306 | 2 SMS | 0,70 kr |
| 307-459 | 3 SMS | 1,05 kr |

*Priser for ekstra SMS ud over inkluderede

> **💡 Pro-tip:** Tegnene 160 vises live mens du skriver. Emojis tæller som 2 tegn!

---

## Afsender-ID

### Vælg afsendernavn

Du kan tilpasse hvad der vises som afsender:

| Type | Eksempel | Begrænsning |
|------|----------|-------------|
| **Tekstnavn** | BellaItalia | Max 11 tegn, ingen mellemrum |
| **Telefonnummer** | +4512345678 | Dit registrerede nummer |

**Opsætning:**
1. Gå til **Indstillinger** → **SMS & Beskeder**
2. Rul til **Afsender-ID**
3. Vælg type og indtast navn
4. Klik **Gem**

> **⚠️ Note:** Ændringer i afsender-ID kan tage op til 24 timer.

---

## Test dine SMS'er

Før du aktiverer en skabelon i produktion:

1. Klik **Send test-SMS**
2. Indtast dit eget nummer
3. Vælg skabelon
4. Klik **Send**
5. Verificer at beskeden ser korrekt ud

---

## Deaktiver specifikke SMS'er

Du kan slå individuelle SMS-typer fra:

1. Find SMS-typen
2. Klik på toggle-knappen
3. Bekræft deaktivering

**Anbefalinger:**

| SMS-type | Anbefaling |
|----------|------------|
| Ordrebekræftelse | ✅ Altid aktiv |
| Missed call | ✅ Altid aktiv (høj ROI) |
| Leveringsopdatering | 🔶 Valgfri |
| Anmeldelsesopfordring | 🔶 Valgfri, men anbefalet |

---

## SMS-statistik

Under **Rapporter** → **SMS Rapport** kan du se:

- Antal sendte SMS'er per dag/uge/måned
- Leveringsrate (%)
- Omkostninger
- Konvertering (for missed call SMS)

---

## Overholdelse & Regler

### GDPR & Markedsføringsloven

- ✅ Transaktions-SMS (ordrebekræftelse) kræver **ikke** samtykke
- ⚠️ Marketing-SMS (anmeldelsesopfordring) kræver samtykke
- ✅ Kunder kan framelde sig via svar "STOP"

### Automatisk framelding

Når en kunde svarer "STOP", "AFMELD" eller lignende:
1. De tilføjes automatisk til frameldings-listen
2. De modtager ikke flere marketing-SMS
3. De modtager **stadig** transaktions-SMS (ordrebekræftelser)

---

## Fejlfinding

### SMS når ikke frem

| Årsag | Løsning |
|-------|---------|
| Forkert nummer | Tjek telefonnummer format (+45...) |
| Nummer blokeret | Kunden har frameldt sig |
| Netværksfejl | Prøv igen om 5 minutter |
| Kredit opbrugt | Opgradér plan eller køb SMS-pakke |

### Se SMS-historik

1. Gå til kundens profil
2. Klik på **Kommunikation** tab
3. Se alle sendte og modtagne beskeder

---

## Næste skridt

- [Håndtering af Missed Calls →](./missed-calls.md)
- [AI Ordrehåndtering →](./ai-order-handling.md)
- [Rapporter & Eksport →](./reports-export.md)
