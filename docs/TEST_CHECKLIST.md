# FLOW-app Test Checkliste

**Version:** 3.10.3
**Oprettet:** 2026-02-05
**Status:** In Progress

---

## 1. AUTHENTICATION (Auth)

### 1.1 Login Flow
| Test Case | Forventet | Status | Fejl |
|-----------|-----------|--------|------|
| Login med korrekt email/password | Redirect til dashboard | ⬜ | |
| Login med forkert password | Fejlbesked vises | ⬜ | |
| Login med ikke-eksisterende email | Fejlbesked vises | ⬜ | |
| Login validering (tom email) | Validering fejl | ⬜ | |
| Demo login knap | Login som demo bruger | ⬜ | |
| Admin login knap | Login som admin | ⬜ | |

### 1.2 Signup Flow
| Test Case | Forventet | Status | Fejl |
|-----------|-----------|--------|------|
| Opret konto med valid data | Konto oprettes | ⬜ | |
| Signup med eksisterende email | Fejlbesked | ⬜ | |
| Password validering (for kort) | Fejl | ⬜ | |
| Email validering (ugyldig format) | Fejl | ⬜ | |

### 1.3 Two-Factor Authentication (2FA)
| Test Case | Forventet | Status | Fejl |
|-----------|-----------|--------|------|
| Aktivér TOTP authenticator | QR kode vises | ⬜ | |
| Verificér TOTP kode | 2FA aktiveret | ⬜ | |
| Aktivér Email OTP | Toggle virker | ⬜ | |
| Vis backup koder | Koder vises | ⬜ | |
| Generer nye backup koder | Nye koder | ⬜ | |

### 1.4 Session Management
| Test Case | Forventet | Status | Fejl |
|-----------|-----------|--------|------|
| Session persists efter refresh | Forbliver logget ind | ⬜ | |
| Session timeout | Auto-logout efter inaktivitet | ⬜ | |
| Manual logout | Redirect til login | ⬜ | |
| Trusted device registration | Device gemt | ⬜ | |
| Remove trusted device | Device fjernet | ⬜ | |

---

## 2. DASHBOARD

| Test Case | Forventet | Status | Fejl |
|-----------|-----------|--------|------|
| Dashboard load | Stats vises | ⬜ | |
| Empty state (ny bruger) | Tom besked vises | ⬜ | |
| Notifications widget | Notifikationer vises | ⬜ | |
| Recent activity | Aktiviteter vises | ⬜ | |
| Quick actions fungerer | Navigation virker | ⬜ | |

---

## 3. KUNDER/CRM

### 3.1 Kunde Liste
| Test Case | Forventet | Status | Fejl |
|-----------|-----------|--------|------|
| Vis alle kunder | Liste vises | ⬜ | |
| Søg efter kunde | Filtreret resultat | ⬜ | |
| Tilføj ny kunde | Modal åbner | ⬜ | |
| Klik på kunde | Subpage åbner | ⬜ | |
| Delete kunde | Bekræft og slet | ⬜ | |

### 3.2 Kunde Subpages (15 stk)
| Subpage | Funktion | Status | Fejl |
|---------|----------|--------|------|
| subpage-dashboard | Kunde oversigt | ⬜ | |
| subpage-stamdata | Stamdata redigering | ⬜ | |
| subpage-workflow-kontrol | Workflow settings | ⬜ | |
| subpage-produkter | Produkt liste | ⬜ | |
| subpage-kategorier | Kategori editor | ⬜ | |
| subpage-add-product | Tilføj produkt | ⬜ | |
| subpage-add-bulk-product | Bulk tilføj | ⬜ | |
| subpage-import-products | Import produkter | ⬜ | |
| subpage-faktura | Fakturaer | ⬜ | |
| subpage-abonnement | Abonnement | ⬜ | |
| subpage-beskeder | Beskeder/SMS | ⬜ | |
| subpage-moms | MOMS indstillinger | ⬜ | |
| subpage-kundelogs | Kunde noter | ⬜ | |
| subpage-aktivitetslogs | Aktivitets log | ⬜ | |
| subpage-noegletal | Nøgletal/KPIs | ⬜ | |

---

## 4. LEADS MANAGEMENT

| Test Case | Forventet | Status | Fejl |
|-----------|-----------|--------|------|
| Leads oversigt | Liste vises | ⬜ | |
| Pipeline view (Kanban) | Kanban board vises | ⬜ | |
| Flyt lead mellem stages | Drag & drop virker | ⬜ | |
| Leads aktiviteter | Aktivitets log | ⬜ | |
| Leads rapporter | Rapporter vises | ⬜ | |
| Opret nyt lead | Lead oprettes | ⬜ | |
| Rediger lead | Lead opdateres | ⬜ | |
| Slet lead | Lead slettes | ⬜ | |

---

## 5. SALG & ORDRER

| Test Case | Forventet | Status | Fejl |
|-----------|-----------|--------|------|
| Ordrer oversigt | Ordre liste | ⬜ | |
| Salgsoversigt | Salgs stats | ⬜ | |
| Korttransaktioner | Transaktioner vises | ⬜ | |
| Ordre detaljer | Modal/side åbner | ⬜ | |
| Refund ordre | Refund proceseres | ⬜ | |

---

## 6. RAPPORTER (7 stk)

| Rapport | Funktion | Status | Fejl |
|---------|----------|--------|------|
| Dagsrapport | Daglig oversigt | ⬜ | |
| Produktrapport | Produkt salg | ⬜ | |
| Z-rapport | Z-rapport data | ⬜ | |
| Konverteringsrapport | Konvertering % | ⬜ | |
| Genbestillingsrapport | Genbestilling stats | ⬜ | |
| Anmeldelsesrapport | Anmeldelser | ⬜ | |
| Heatmap rapport | Heatmap data | ⬜ | |

---

## 7. MARKETING & LOYALTY

| Test Case | Forventet | Status | Fejl |
|-----------|-----------|--------|------|
| Loyalitetsprogram oversigt | Program vises | ⬜ | |
| Opret reward | Reward oprettes | ⬜ | |
| Rediger reward | Reward opdateres | ⬜ | |
| Slet reward | Reward slettes | ⬜ | |
| Medlemmer liste | Liste vises | ⬜ | |
| Kampagner liste | Kampagner vises | ⬜ | |
| Opret kampagne | Kampagne oprettes | ⬜ | |
| Kundesegmenter | Segmenter vises | ⬜ | |
| Opret segment | Segment oprettes | ⬜ | |
| Udsendelser (Broadcasts) | Liste vises | ⬜ | |

---

## 8. APP BUILDER (14 sider)

| Side | Funktion | Status | Fejl |
|------|----------|--------|------|
| Branding | Logo upload, app navn | ⬜ | |
| Design | Layout valg | ⬜ | |
| Farver | Farvevalg | ⬜ | |
| Billeder | Billede upload | ⬜ | |
| Funktioner | Feature toggles | ⬜ | |
| Menu | Menu redigering | ⬜ | |
| Åbningstider | Timer redigering | ⬜ | |
| Kontakt | Kontaktinfo | ⬜ | |
| Levering | Levering settings | ⬜ | |
| Loyalty | Loyalty settings | ⬜ | |
| Push Notifikationer | Push settings | ⬜ | |
| Ordrer | App ordrer | ⬜ | |
| Kunder | App kunder | ⬜ | |
| Mobil App | Preview + QR | ⬜ | |

---

## 9. WEB BUILDER (10 sider)

| Side | Funktion | Status | Fejl |
|------|----------|--------|------|
| Branding | Logo, navn | ⬜ | |
| Farver | Farvevalg | ⬜ | |
| Billeder | Billede upload | ⬜ | |
| Menu | Menu redigering | ⬜ | |
| Åbningstider | Timer | ⬜ | |
| Kontakt | Kontaktinfo | ⬜ | |
| Blog | Blog posts | ⬜ | |
| Levering | Levering info | ⬜ | |
| Funktioner | Features | ⬜ | |
| Sociale Medier | Social links | ⬜ | |

---

## 10. FLOW CMS

### 10.1 Side Editor
| Test Case | Forventet | Status | Fejl |
|-----------|-----------|--------|------|
| Side liste vises | Liste med sider | ⬜ | |
| Vælg side | Editor vises | ⬜ | |
| **Indstillinger tab** | Tab skifter | ⚠️ | Rapporteret som problematisk |
| **Planlæg knap** | Modal åbner | ⚠️ | Rapporteret som problematisk |
| SEO tab | SEO felter vises | ⬜ | |
| Indhold tab | Sections vises | ⬜ | |
| Tilføj section | Section tilføjes | ⬜ | |
| Slet section | Section slettes | ⬜ | |
| Gem ændringer | Ændringer gemt | ⬜ | |
| Publicer side | Side publiceret | ⬜ | |
| Dupliker side | Side duplikeret | ⬜ | |
| Slet side | Side slettet | ⬜ | |
| Forhåndsvisning | Ny tab åbner | ⬜ | |

### 10.2 Section Types
| Type | Editor | Render | Status |
|------|--------|--------|--------|
| hero | ⬜ | ⬜ | |
| text | ⬜ | ⬜ | |
| features | ⬜ | ⬜ | |
| cta | ⬜ | ⬜ | |
| testimonials | ⬜ | ⬜ | |
| faq | ⬜ | ⬜ | |
| images | ⬜ | ⬜ | |
| trusted | ⬜ | ⬜ | |
| bento | ⬜ | ⬜ | |
| beliefs | ⬜ | ⬜ | |
| logocloud | ⬜ | ⬜ | |
| footer | ⬜ | ⬜ | |
| chat-demo | ⬜ | ⬜ | |

---

## 11. SETTINGS (13 tabs)

| Tab | Funktion | Status | Fejl |
|-----|----------|--------|------|
| API Keys | API nøgle visning/generering | ⬜ | |
| Users | Bruger liste, invite | ⬜ | |
| Edit User | Rediger bruger | ⬜ | |
| Add User | Tilføj bruger | ⬜ | |
| Billing | Abonnement, fakturering | ⬜ | |
| Notifications | Notifikation settings | ⬜ | |
| Roles | Rolle management (admin) | ⬜ | |
| Sprog | Sprog valg | ⬜ | |
| Bank | Bank settings (admin) | ⬜ | |
| Passwords | Password ændring | ⬜ | |
| Support | Support settings | ⬜ | |
| Maintenance | System vedligeholdelse | ⬜ | |
| Cookies | Cookie consent | ⬜ | |

---

## 12. INTEGRATIONER

| Integration | Funktion | Status | Fejl |
|-------------|----------|--------|------|
| Bogholderi liste | Viser integrationer | ⬜ | |
| Tilslut integration | Modal åbner | ⬜ | |
| Betaling setup | Betalings settings | ⬜ | |

---

## 13. LANDING PAGES (33 stk)

| Side | Navigation | Load | Responsiv |
|------|------------|------|-----------|
| landing.html | ⬜ | ⬜ | ⬜ |
| priser.html | ⬜ | ⬜ | ⬜ |
| how-it-works.html | ⬜ | ⬜ | ⬜ |
| om-os.html | ⬜ | ⬜ | ⬜ |
| sms-workflow.html | ⬜ | ⬜ | ⬜ |
| instagram-workflow.html | ⬜ | ⬜ | ⬜ |
| facebook-workflow.html | ⬜ | ⬜ | ⬜ |
| ... (+ 26 andre) | ⬜ | ⬜ | ⬜ |

---

## 14. GLOBAL FUNCTIONALITY

| Funktion | Status | Fejl |
|----------|--------|------|
| Theme toggle (dark/light) | ⬜ | |
| Sidebar collapse | ⬜ | |
| Mobile navigation | ⬜ | |
| Command search (⌘K) | ⬜ | |
| Toast notifications | ⬜ | |
| Modal system | ⬜ | |
| Form validation | ⬜ | |
| Error handling | ⬜ | |
| Loading states | ⬜ | |

---

## SEVERITY LEGEND

- ⬜ Ikke testet
- ✅ Pass
- ⚠️ Issue fundet (P2-P3)
- ❌ Fejl (P0-P1)

## PRIORITY DEFINITIONS

- **P0:** Blokkerer workflow, data tab
- **P1:** Kritisk regression, sikkerhed
- **P2:** Brugerfriktion, inkonsistens
- **P3:** Nice to have

---

## KENDTE ISSUES

| ID | Side/Funktion | Beskrivelse | Severity | Status |
|----|---------------|-------------|----------|--------|
| CMS-001 | CMS Indstillinger tab | Rapporteret som "systemet går amok" | P1 | Under undersøgelse |
| CMS-002 | CMS Planlæg knap | Potentielt relateret til CMS-001 | P1 | Under undersøgelse |

---

**Sidst opdateret:** 2026-02-05
