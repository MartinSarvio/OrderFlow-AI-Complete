# Brugeradministration & Roller

> Opret brugere, tildel roller og administrer adgangsniveauer.

---

## Oversigt over roller

OrderFlow har tre standard-roller med forskellige adgangsniveauer:

| Rolle | Beskrivelse | Typisk bruger |
|-------|-------------|---------------|
| **Admin** | Fuld adgang til alt | Ejer, IT-ansvarlig |
| **Manager** | Adgang til drift og rapporter | Restaurantchef |
| **Medarbejder** | Basisadgang til ordrehåndtering | Køkkenpersonale, bude |

---

## Detaljerede rettigheder

### Admin 👑

| Område | Rettighed |
|--------|-----------|
| **Brugere** | Oprette, redigere, slette alle brugere |
| **Restauranter** | Fuld adgang til alle restauranter |
| **Workflows** | Oprette, redigere, aktivere/deaktivere |
| **Indstillinger** | Alle indstillinger inkl. fakturering |
| **API** | Generere og administrere API-nøgler |
| **Rapporter** | Alle rapporter + eksport |
| **Ordrer** | Fuld adgang |

### Manager 📊

| Område | Rettighed |
|--------|-----------|
| **Brugere** | Se brugere (kan ikke oprette/slette) |
| **Restauranter** | Adgang til tildelte restauranter |
| **Workflows** | Se og aktivere/deaktivere (ikke oprette) |
| **Indstillinger** | Restaurant-indstillinger (ikke fakturering) |
| **API** | Ingen adgang |
| **Rapporter** | Alle rapporter + eksport |
| **Ordrer** | Fuld adgang |

### Medarbejder 👤

| Område | Rettighed |
|--------|-----------|
| **Brugere** | Kun egen profil |
| **Restauranter** | Kun tildelte restauranter |
| **Workflows** | Ingen adgang |
| **Indstillinger** | Kun personlige indstillinger |
| **API** | Ingen adgang |
| **Rapporter** | Kun dagsrapport |
| **Ordrer** | Se og håndtere ordrer |

---

## Opret ny bruger

### Trin-for-trin

1. Gå til **Indstillinger** → **Brugerindstillinger**
2. Klik **Inviter bruger**
3. Udfyld:

| Felt | Beskrivelse |
|------|-------------|
| **Email** | Brugerens email (login) |
| **Navn** | Fulde navn |
| **Rolle** | Admin / Manager / Medarbejder |
| **Restauranter** | Hvilke restauranter de har adgang til |

4. Klik **Send invitation**

<!-- 📸 SCREENSHOT: Inviter bruger dialog -->

### Hvad sker der?

1. Brugeren modtager email med invitation
2. De klikker på link og opretter password
3. De kan nu logge ind med deres rolle

> **💡 Pro-tip:** Invitationen udløber efter 7 dage. Send en ny hvis den ikke aktiveres.

---

## Administrer eksisterende brugere

### Se alle brugere

1. Gå til **Indstillinger** → **Brugerindstillinger**
2. Se listen over alle brugere

| Kolonne | Beskrivelse |
|---------|-------------|
| **Navn** | Brugerens navn |
| **Email** | Login email |
| **Rolle** | Admin/Manager/Medarbejder |
| **Status** | Aktiv / Inviteret / Deaktiveret |
| **Sidst aktiv** | Seneste login |

### Rediger bruger

1. Klik på brugeren i listen
2. Klik **Rediger**
3. Ændr rolle eller restaurantadgang
4. Klik **Gem**

### Deaktiver bruger

Når en medarbejder stopper:

1. Find brugeren i listen
2. Klik **⋮** (menu)
3. Vælg **Deaktiver**
4. Bekræft

> **⚠️ Note:** Deaktiverede brugere kan ikke logge ind, men deres historik bevares.

### Slet bruger

1. Find brugeren i listen
2. Klik **⋮** (menu)
3. Vælg **Slet permanent**
4. Bekræft (denne handling kan ikke fortrydes!)

---

## Restaurant-adgang

Brugere kan have adgang til specifikke restauranter.

### Tildel restaurant-adgang

1. Rediger brugeren
2. Under **Restaurant-adgang**:
   - **Alle restauranter** - Adgang til alle (nu og fremtidige)
   - **Udvalgte** - Vælg specifikke restauranter
3. Gem

### Eksempel

| Bruger | Rolle | Restauranter |
|--------|-------|--------------|
| Anna Admin | Admin | Alle |
| Bo Manager | Manager | Bella Italia, Sushi Heaven |
| Carl Cook | Medarbejder | Kun Bella Italia |

---

## Brugerprofil indstillinger

Alle brugere kan redigere deres egen profil:

### Personlige indstillinger

1. Klik på dit navn øverst til højre
2. Vælg **Profil**
3. Rediger:
   - Profilbillede
   - Navn
   - Telefonnummer
   - Notifikationsindstillinger

### Skift password

1. Gå til **Profil** → **Sikkerhed**
2. Indtast nuværende password
3. Indtast nyt password (min. 8 tegn)
4. Bekræft nyt password
5. Klik **Gem**

### To-faktor autentificering (2FA)

Ekstra sikkerhed for din konto:

1. Gå til **Profil** → **Sikkerhed**
2. Klik **Aktiver 2FA**
3. Scan QR-kode med Google Authenticator eller lignende
4. Indtast kode for at verificere
5. Gem dine backup-koder!

> **💡 Anbefalet:** Alle Admin-brugere bør aktivere 2FA.

---

## Notifikationsindstillinger

Vælg hvilke notifikationer du vil modtage:

| Notifikation | Email | Push | SMS |
|--------------|-------|------|-----|
| Ny ordre | ☐ | ☐ | ☐ |
| Ordre behøver gennemgang | ☐ | ☐ | ☐ |
| Daglig rapport | ☐ | - | - |
| System alerts | ☐ | ☐ | ☐ |

### Konfigurer per bruger

1. Rediger brugeren
2. Gå til **Notifikationer** tab
3. Vælg kanaler for hver type
4. Gem

---

## Aktivitetslog

Se hvad brugere har foretaget sig:

1. Gå til **Indstillinger** → **Aktivitetslogs**
2. Filtrer på bruger, handling eller dato

### Logget aktiviteter

| Aktivitet | Logges |
|-----------|--------|
| Login/logout | ✅ |
| Ordre oprettet/ændret | ✅ |
| Indstillinger ændret | ✅ |
| Bruger oprettet/slettet | ✅ |
| API-kald | ✅ |
| Eksport af data | ✅ |

---

## Sikkerhed best practices

### Ved ansættelse

1. ✅ Opret bruger med mindste nødvendige rettigheder
2. ✅ Brug work-email, ikke privat
3. ✅ Aktiver 2FA for admin-brugere
4. ✅ Dokumenter hvem der har adgang

### Ved fratrædelse

1. ✅ Deaktiver brugeren STRAKS
2. ✅ Roter API-nøgler hvis de havde adgang
3. ✅ Tjek aktivitetslog for unormal adfærd
4. ✅ Opdater delte passwords

### Løbende

- 🔄 Review brugeradgang månedligt
- 🔄 Tjek for inaktive brugere
- 🔄 Sørg for unikke passwords

---

## Bulk operationer

### Importer brugere

Upload en CSV-fil med flere brugere:

1. Klik **Importer brugere**
2. Download skabelon
3. Udfyld CSV med brugerdata
4. Upload filen
5. Bekræft import

**CSV format:**
```csv
email,name,role,restaurants
anders@firma.dk,Anders Jensen,manager,"Bella Italia,Sushi Heaven"
lisa@firma.dk,Lisa Hansen,employee,Bella Italia
```

### Eksporter brugerliste

1. Klik **Eksporter**
2. Vælg format (CSV/Excel)
3. Download filen

---

## Fejlfinding

### Bruger kan ikke logge ind

| Problem | Løsning |
|---------|---------|
| Forkert password | Brug "Glemt password" |
| Bruger deaktiveret | Admin skal genaktivere |
| Invitation udløbet | Send ny invitation |
| 2FA-problem | Admin kan nulstille 2FA |

### Bruger ser ikke restaurant

| Problem | Løsning |
|---------|---------|
| Ikke tildelt | Tildel restaurant-adgang |
| Ny restaurant | Tjek "Alle restauranter" indstilling |

---

## API brugeradministration

Administrer brugere programmatisk:

```bash
# List alle brugere
curl -X GET "https://api.orderflow.ai/v1/users" \
  -H "Authorization: Bearer sk_live_..."

# Opret bruger
curl -X POST "https://api.orderflow.ai/v1/users" \
  -H "Authorization: Bearer sk_live_..." \
  -d '{"email": "ny@firma.dk", "name": "Ny Bruger", "role": "employee"}'
```

Se [API Reference →](../api/endpoints/users.md)

---

## Næste skridt

- [Dashboard Guide →](./dashboard-kpis.md)
- [API & Integrationer →](../api/quickstart.md)
- [Kontakt Support →](../resources/support.md)
