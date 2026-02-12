# FLOW / OrderFlow AI — Komplet Teknisk Audit

**Dato:** 2026-02-12  
**Version:** 4.11.6 (build 4918)  
**Auditor:** Projektleder / Teknisk Arkitekt  
**Status:** ⚠️ Prototype/MVP — IKKE produktionsklar

---

## Executive Summary

FLOW er en ambitiøs restaurant-automationsplatform med **94+ sider** i én SPA, **~47K linjer JavaScript** i én fil, og **~16K linjer HTML** i én fil. Projektet har en imponerende bredde af features, men den tekniske virkelighed er:

- **~70% af alle features er UI-only** med hardcoded/mock data
- **Alle regnskabsintegrationer er UI-only** — ingen lever
- **Alle sociale integrationer (Instagram, Facebook) er UI-only** i praksis
- **API-nøgler gemmes i localStorage** i browseren — alvorligt sikkerhedsproblem
- **Ingen tests, ingen CI/CD, ingen staging** — single main branch direkte til produktion
- **363 steder bruger innerHTML** med minimal sanitering — XSS-risiko
- **46.848 linjer i én JS-fil** — uvedligeholdelig teknisk gæld

**Bundlinje:** Platformen er en overbevisende demo/prototype. For at blive et reelt produkt kræves fundamental refaktorering af arkitektur, sikkerhed og datahåndtering.

---

## 1. Teknisk Statusrapport — Side for Side

### 1.1 Dashboard & Oversigt

| Side | Virker? | Data | Bemærkning |
|------|---------|------|------------|
| Dashboard (hoved) | Delvist | Mock + Supabase | Viser KPI-kort. Tal er blanding af Supabase-data og `Math.random()`-genererede dummy-tal. Revenue-historik er genereret. |
| `page-kunder` | Delvist | Supabase + mock | Henter fra `restaurants` tabel, men falder tilbage til hardcoded demo-restauranter (Bella Italia, Sushi House, Burger Joint). |
| `page-orders` | Delvist | Mock | Ordrelisten genereres med `Math.random()` for datoer, produkter og beløb. Ingen ægte ordredata vist. |
| `page-activities` | Delvist | Mock | Aktivitetslog genereres lokalt med ID'er som `act_[timestamp]_[random]`. |

### 1.2 Rapporter

| Side | Virker? | Data | Bemærkning |
|------|---------|------|------------|
| `page-salgsoversigt` | Delvist | Mock | Omsætningstal er genereret med `Math.random()`. Ingen rigtige salgsdata. |
| `page-korttransaktioner` | Nej | Hardcoded | Tabellen er hardcoded i HTML. Ingen Stripe-integration. |
| `page-dagsrapport` | Delvist | Mock | Genererede tal. |
| `page-produktrapport` | Delvist | Mock | Genererede tal. |
| `page-zrapport` | Delvist | Mock | Z-rapport med genereret data. |
| `page-konverteringsrapport` | Nej | Mock | Konverteringstal er opdigtede. |
| `page-genbestillingsrapport` | Nej | Mock | Genereret. |
| `page-anmeldelsesrapport` | Delvist | Mock | Trustpilot/Google data er hardcoded per demo-restaurant. |
| `page-heatmaprapport` | Nej | Mock | Ingen ægte heatmap-data. |

**Vurdering:** Alle rapporter viser pænt UI men ingen af dem trækker reelle data. De er ren demo.

### 1.3 Programmer / Agents

| Side | Virker? | Data | Bemærkning |
|------|---------|------|------------|
| `page-instagram-workflow` | Delvist | UI-only | OrderingAgent.js (2.2K linjer) er velskrevet med conversation state machine, men har INGEN reel Instagram API-forbindelse. Kræver ekstern webhook-opsætning. |
| `page-facebook-workflow` | Delvist | UI-only | Samme som Instagram — OrderingAgent er identisk for begge kanaler. Ingen Facebook Graph API. |
| `page-sms-workflows` | Delvist | Supabase | Har Supabase Edge Functions (`receive-sms`, `send-sms`, `receive-sms-inmobile`). Dette er den MEST implementerede integration. |
| `page-search-engine` | Delvist | UI-only | SEO-værktøjer med v1/v2 toggle. Kræver Firecrawl + Serper API-nøgler i localStorage. |
| `page-seo-scanner` | Delvist | Ekstern API | Bruger reelt Firecrawl og Google Places via bruger-indtastede API-nøgler. Virker hvis nøgler er sat. |
| `page-workflow-kontrol` | Nej | UI-only | Workflow-kontrolpanel uden backend. |

### 1.4 Leads & CRM

| Side | Virker? | Data | Bemærkning |
|------|---------|------|------------|
| `page-alle-kunder` | Delvist | Supabase + mock | Henter fra Supabase `customers` tabel, men genererer random data som fallback. |
| `page-leads` | Delvist | Mock | Leads er genereret lokalt. |
| `page-leads-pipeline` | Nej | Mock | Kanban-board med hardcoded leads. |
| `page-leads-activities` | Nej | Mock | Genereret aktivitetslog. |
| `page-leads-reports` | Nej | Mock | Genererede rapporttal. |

### 1.5 App Builder

| Side | Virker? | Data | Bemærkning |
|------|---------|------|------------|
| Alle `page-appbuilder-*` sider | Ja | localStorage | App Builder er en af de mest funktionelle dele. Gemmer config i `localStorage` per template. Preview virker via `postMessage` til iframe. |
| `page-appbuilder-mobilapp` | Ja | localStorage | Mobil preview virker med live data fra builder. |

**Vurdering:** App Builder er reelt funktionelt, men data persisterer KUN i localStorage — mistes ved browser-rydning.

### 1.6 Web Builder

| Side | Virker? | Data | Bemærkning |
|------|---------|------|------------|
| Alle `page-wb-*` sider | Ja | localStorage | Samme som App Builder — funktionelt men localStorage-only. |
| Template checkout | Ja | Supabase + Stripe | `order-api.js` + `template-auth.js` + Stripe PaymentIntent. Dette er ægte og virker. |

### 1.7 Analytics

| Side | Virker? | Data | Bemærkning |
|------|---------|------|------------|
| `page-analytics` (alle) | Delvist | Mock | Flotte charts og tal, men alt er genereret med `Math.random()`. Ingen ægte analytics pipeline. |

### 1.8 CMS

| Side | Virker? | Data | Bemærkning |
|------|---------|------|------------|
| `page-flow-cms` | Ja | Supabase + localStorage | CMS loader henter fra Supabase først, fallback til localStorage → defaults. Funktionelt. |
| `page-template-editor` | Ja | localStorage | Template editor virker for de 3 web-skabeloner. |

### 1.9 Auth & Profil

| Side | Virker? | Data | Bemærkning |
|------|---------|------|------------|
| Login/Signup | Ja | Supabase Auth | Ægte auth med email/password, Google OAuth, Facebook OAuth. OTP og 2FA (TOTP) implementeret. |
| `page-admin-profil` | Delvist | Supabase + localStorage | Henter brugerdata fra Supabase auth, men profil-felter gemmes delvist i localStorage. |
| `page-admin-sikkerhed` | Delvist | Supabase Auth | Password-ændring virker. 2FA virker delvist. Sessions-oversigt er mock. |
| `page-admin-abonnement` | Nej | UI-only | Abonnementssiden kalder `/api/stripe/create-checkout` som ikke eksisterer som Edge Function. |
| `page-kunde-*` (alle) | Delvist | Mock + localStorage | Kundeprofil-siderne bruger primært localStorage og demo-data. |

### 1.10 Indstillinger

| Side | Virker? | Data | Bemærkning |
|------|---------|------|------------|
| `page-bogholderi` | Nej | UI-only | Regnskabsindstillinger er ren UI. |
| `page-betaling` | Delvist | UI-only | Stripe-nøgler gemmes i localStorage. Ingen reel betalingsopsætning. |
| `page-vaerktoejer` | Delvist | UI-only | Agent-kort og hardware-tabs er placeholders. |

### 1.11 Marketing

| Side | Virker? | Data | Bemærkning |
|------|---------|------|------------|
| `page-loyalty` | Nej | Mock | Loyalty-program med hardcoded tier-data. |
| `page-campaigns` | Nej | Mock | Kampagne-UI uden backend. |
| `page-segments` | Nej | Mock | Segmentering uden data. |
| `page-udsendelser` | Nej | Mock | SMS/email udsendelser — UI only. |
| `page-ai-medier` | Nej | UI-only | Billedgenerering kræver OpenAI/Minimax API-nøgler i localStorage. |

---

## 2. Gap Analyse

### 2.1 Funktioner der er UI-only (ingen backend)

**Kritisk — disse sider har INGEN backend-logik:**

1. **ALLE rapporter** — Salgsoversigt, Dagsrapport, Produktrapport, Z-rapport, Heatmap, Konvertering, Genbestilling
2. **ALLE analytics-sider** — Revenue, Products, AI, Channels
3. **Hele Leads/CRM-modulet** — Pipeline, Activities, Reports
4. **Hele Marketing-modulet** — Loyalty, Campaigns, Segments, Udsendelser
5. **Regnskabs-integration UI** — e-conomic, Dinero, Billy, Visma (kodearkitektur eksisterer, men intet er koblet)
6. **Betalings-administration** — Stripe admin-opsætning
7. **Workflow kontrol** — Ingen ægte workflow-engine
8. **Hardware/Enheder** — POS, Printer, KDS er placeholders

### 2.2 Manglende fejlhåndtering

- **272 try-blokke vs 311 catch-blokke** — tallene stemmer nogenlunde, men mange catch-blokke er tomme eller `console.log`-only
- **Ingen global error handler** — uncaught exceptions forsvinder lydløst
- **Ingen retry-logik** på Supabase-kald (undtagen i ordering-agent)
- **Ingen offline-håndtering** — appen crasher ved manglende netværk
- **Ingen loading states** på mange sider — brugeren ser bare tomt indhold
- **Ingen validering** af API-nøgler inden brug
- **Supabase-fejl vises som toast** men logges ikke til nogen monitoring

### 2.3 Sikkerhedsproblemer

**🔴 KRITISK:**

1. **Supabase anon key er hardcoded i kildekoden** (linje 343) — dette er standard for Supabase, men:
2. **API-nøgler (Stripe secret, OpenAI, InMobile, etc.) gemmes i `localStorage`** — kan tilgås af ethvert script på domænet, inkl. XSS
3. **363 steder bruger `innerHTML`** med bruger-input uden sanitering — massiv XSS-risiko
4. **Kun 1 `escapeHtml` funktion** (defineret lokalt i én funktion) — bruges ikke globalt
5. **Stripe SECRET key gemmes i frontend localStorage** — dette er en katastrofal sikkerhedsbrist. Secret keys SKAL være server-side only
6. **Ingen CSRF-beskyttelse** på nogen formular
7. **Ingen rate limiting** på login eller API-kald
8. **Session tokens** håndteres af Supabase (OK), men der er ingen session-invalidering ved rolle-ændring

**🟡 MIDDEL:**

9. **RLS er implementeret** på core tables (restaurants, products, orders) — dette er positivt
10. **Password reset** har sanitering af expiry-minutter — OK
11. **OAuth flows** via Supabase Auth er korrekt implementeret
12. **Edge Functions** kører server-side — OK for SMS og payment intents

### 2.4 Performance Issues

1. **46.848 linjer i én JS-fil** — initial parse-tid er enorm
2. **15.809 linjer i én HTML-fil** — DOM er gigantisk selv om kun én side er synlig
3. **Ingen code splitting** — hele appen loades selv for simple sider
4. **632 localStorage-operationer** — synkront I/O ved hvert sidevisit
5. **99 steder med `Math.random()`** for data-generering — unødvendigt CPU-brug
6. **Ingen lazy loading** af sider eller komponenter
7. **Ingen caching-strategi** udover service worker cache name
8. **Chart.js loaded fra CDN** — blokerer rendering
9. **470 `window.*` globale** — namespace-forurening og potentielle konflikter
10. **Ingen virtualisering** af lister — alle rækker renderes

### 2.5 Kode-kvalitet

**Duplicate code:**
- OrderingAgent-logik kopieret for Instagram og Facebook (identisk kode)
- Demo-restauranter (Bella Italia, Sushi House, Burger Joint) defineret med fuld menu i 3+ steder
- `supabaseClient || window.supabaseClient || supabase` gentages 10+ steder
- escapeHtml defineret inline i individuelle funktioner

**Dead code:**
- `DEMO_MODE: false` konfiguration (linje 348) — aldrig brugt som feature flag
- Flere `page-mine-oplysninger`, `page-ordrehistorik` markeret som "(legacy)"
- `jsPDF mock` shim (linje 315) — uklart om det bruges

**Arkitektur-problemer:**
- **Ingen modul-system** — alt er globalt scope
- **1.410 funktioner** i én fil — ingen organisering
- **Blanding af concerns** — UI rendering, data fetching, business logic, auth alt i app.js
- **Sidebar defineret 2 steder** (partials/sidebar.html + index.html linje 616-635) — skal holdes synkrone manuelt

---

## 3. Integrationsanalyse

### 3.1 Oversigt over alle integrationer

| Integration | Status | Type | Auth-metode | Virker reelt? |
|-------------|--------|------|-------------|---------------|
| **Supabase** | ✅ Ægte | Backend | Anon key + JWT | Ja — Auth, DB, Edge Functions |
| **Stripe (checkout)** | ✅ Ægte | Betaling | Edge Function | Ja — PaymentIntent i templates |
| **Stripe (admin)** | ❌ UI-only | Betaling | localStorage secret key | Nej — `/api/stripe/create-checkout` eksisterer ikke |
| **OpenAI** | ⚠️ Delvist | AI | Manuel API-nøgle i localStorage | Ja, men nøgle sendes fra browser — sikkerhedsrisiko |
| **InMobile** | ⚠️ Delvist | SMS | Manuel API-nøgle | Edge Functions eksisterer, men kræver korrekt opsætning |
| **Firecrawl** | ⚠️ Delvist | Web scraping | Manuel API-nøgle | Bruges i SEO scanner — virker med nøgle |
| **Google Places** | ⚠️ Delvist | Reviews | Manuel API-nøgle | Bruges i SEO scanner |
| **Serper** | ⚠️ Delvist | Search | Manuel API-nøgle | Bruges i SEO scanner |
| **e-conomic** | ❌ Kode eksisterer | Regnskab | App Secret + Agreement Token | Connector-klasse er skrevet (well-structured), men ALDRIG kaldt fra UI |
| **Dinero** | ❌ Kun stubs | Regnskab | API-nøgle | Connector-fil eksisterer med mappers, men tomt |
| **Billy** | ❌ Kun stubs | Regnskab | API token | Connector-fil eksisterer med mappers, men tomt |
| **Visma** | ❌ Kun stubs | Regnskab | Bearer token | Connector-fil eksisterer med mappers, men tomt |
| **Trustpilot** | ❌ UI-only | Reviews | Manuel API-nøgle i localStorage | Ingen API-kald — kun hardcoded review-tal |
| **Instagram** | ❌ UI-only | Social | Access token i localStorage | Ingen Instagram Graph API-kald. OrderingAgent kræver ekstern webhook |
| **Facebook** | ⚠️ Delvist | Social/Auth | Supabase OAuth | OAuth login virker. Messenger-integration er UI-only |
| **Google (Auth)** | ✅ Ægte | Auth | Supabase OAuth | Google login virker |
| **OpenRouter** | ❌ UI-only | AI | Manuel nøgle | Felt eksisterer, ingen kald |
| **Minimax** | ❌ UI-only | Video AI | Manuel nøgle | Felt eksisterer, ingen kald |

### 3.2 Detaljeret: Regnskabsintegrationer

**Arkitektur-kvalitet: 8/10** — Overraskende god

Integrations-arkitekturen (`js/integrations/`) er den bedst strukturerede del af hele kodebasen:
- `BaseConnector` abstract class med rate limiting, retry, error handling
- `CanonicalModel` for data-transformation mellem systemer
- `SyncEngine` med cursor-baseret pagination
- Per-connector `mappers.js` med bidirektionel transformation

**Problem:** Intet af dette bruges. Connector-koden er ALDRIG importeret eller kaldt fra `app.js` eller HTML.

**Hvad skal til:**
1. Koble connector-klasserne til UI (Indstillinger → Integrationer)
2. Tilføj server-side proxy (Edge Function) — API-nøgler MÅ IKKE sendes fra browser
3. Implement sync-cron (Supabase scheduled function eller ekstern cron)
4. Test med sandbox/demo miljøer hos hvert system

### 3.3 OAuth vs. Manuel API-nøgle

| System | Nuværende | Korrekt metode |
|--------|-----------|----------------|
| e-conomic | Manuel (App Secret + Agreement Token) | **OK for REST API** — e-conomic bruger token-baseret auth, ikke OAuth |
| Dinero | Manuel API-nøgle | Bør være **OAuth 2.0** (Dinero understøtter det) |
| Billy | Manuel API token | **OK** — Billy bruger API tokens |
| Visma | Manuel Bearer token | Bør være **OAuth 2.0** (Visma.net kræver det) |
| Stripe | Manuel nøgler i frontend 🔴 | **Server-side only** med Stripe Connect OAuth |
| Instagram | Manuel access token | **SKAL være OAuth** — Instagram Graph API kræver det |
| Facebook | Supabase OAuth (login) | Login OK, men Messenger API kræver **Page Access Token via OAuth** |
| Trustpilot | Manuel API-nøgle | Bør være **OAuth 2.0** for Business API |

### 3.4 Blueprint: "One Page Integration" med OAuth

```
┌─────────────────────────────────────────────────┐
│  FLOW Integration Page (per system)             │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  Status: ● Ikke forbundet               │   │
│  │                                          │   │
│  │  [Forbind med {System}]  ← OAuth knap   │   │
│  │                                          │   │
│  │  Klik starter OAuth flow:               │   │
│  │  1. Redirect til {system}/oauth/auth    │   │
│  │  2. Bruger godkender                    │   │
│  │  3. Callback til Edge Function          │   │
│  │  4. Edge Function gemmer tokens i DB    │   │
│  │  5. Redirect tilbage til FLOW           │   │
│  │  6. Status: ● Forbundet                │   │
│  │                                          │   │
│  │  Seneste sync: 12:45                    │   │
│  │  [Synkroniser nu] [Fjern forbindelse]   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Sync-indstillinger:                           │
│  ☑ Synkroniser ordrer automatisk               │
│  ☑ Synkroniser kunder                          │
│  ☐ Synkroniser produkter                       │
│  Interval: [Hver time ▼]                       │
└─────────────────────────────────────────────────┘
```

**Implementerings-krav:**
1. **Supabase Edge Function:** `oauth-callback` — modtager auth code, bytter til tokens, gemmer krypteret i DB
2. **Supabase tabel:** `integration_tokens` med `user_id`, `system`, `access_token` (krypteret), `refresh_token`, `expires_at`
3. **Sync Edge Function:** `sync-integration` — henter tokens fra DB, kalder connector, opdaterer data
4. **Frontend:** Kun redirect-URL og status-visning — INGEN tokens i browser

---

## 4. Prioriteret Handlingsplan

### 🔴 KRITISK — Skal fixes NU

| # | Problem | Indsats | Beskrivelse |
|---|---------|---------|-------------|
| 1 | **Stripe secret key i localStorage** | 2t | Fjern al mulighed for at gemme secret keys i frontend. Opret Edge Function for alle Stripe-operationer |
| 2 | **XSS via innerHTML** | 1-2 dage | Implementér global `escapeHtml()` utility. Audit og fix alle 363 innerHTML-steder. Overvej DOMPurify |
| 3 | **API-nøgler i localStorage** | 1 dag | Migrer ALLE API-nøgler til Supabase DB (krypteret). Frontend sender aldrig nøgler direkte til 3. parts API'er |
| 4 | **Ingen error monitoring** | 4t | Tilføj global `window.onerror` + `unhandledrejection` handler. Log til Supabase eller eksternt (Sentry) |

### 🟠 HØJ PRIORITET — Næste sprint

| # | Problem | Indsats | Beskrivelse |
|---|---------|---------|-------------|
| 5 | **Split app.js** | 3-5 dage | Del 47K linjer op i moduler: auth.js, dashboard.js, reports.js, cms.js, builders.js, settings.js, etc. Brug ES modules |
| 6 | **Fjern mock data fra dashboard** | 2 dage | Dashboard skal vise "Ingen data endnu" i stedet for random tal. Falske tal giver falsk tillid |
| 7 | **Builder data til Supabase** | 2 dage | App/Web Builder gemmer i localStorage = mistes. Migrer til `builder_configs` tabel (migration eksisterer allerede!) |
| 8 | **Kobl e-conomic connector** | 3 dage | Connector-koden er skrevet og god. Opret Edge Function proxy, kobl til UI |
| 9 | **Stripe Connect for admin** | 2 dage | Implementér korrekt Stripe Connect OAuth i stedet for manuelt kopierede nøgler |
| 10 | **SMS workflow end-to-end** | 2 dage | Edge Functions eksisterer. Kobl UI → Edge Function → InMobile komplet |

### 🟡 MEDIUM — Backlog

| # | Problem | Indsats | Beskrivelse |
|---|---------|---------|-------------|
| 11 | **Split index.html** | 3 dage | 16K linjer HTML → brug template literals eller partials dynamisk loaded |
| 12 | **Implementér ægte analytics** | 5 dage | Kobl ordredata til rapporter. Start med Salgsoversigt + Dagsrapport |
| 13 | **Instagram/Facebook OAuth** | 5 dage | Implementér korrekt OAuth flow for Instagram Graph API og Facebook Page tokens |
| 14 | **Leads/CRM med database** | 5 dage | Opret Supabase tabeller for leads, pipeline stages, activities |
| 15 | **CI/CD pipeline** | 1 dag | GitHub Actions: lint, build, deploy preview for PRs |
| 16 | **Staging environment** | 1 dag | Vercel preview deployments + separat Supabase projekt for staging |
| 17 | **Loading states** | 2 dage | Tilføj skeleton/loading UI til alle sider der henter data |
| 18 | **Offline-håndtering** | 2 dage | Detect offline, queue operations, sync ved reconnect |
| 19 | **Dinero OAuth integration** | 3 dage | Implementér Dinero connector med OAuth 2.0 |
| 20 | **Visma.net OAuth integration** | 3 dage | Implementér Visma connector med OAuth 2.0 |

### 🟢 LAV — Nice to have

| # | Problem | Indsats | Beskrivelse |
|---|---------|---------|-------------|
| 21 | **TypeScript migration** | Løbende | Gradvis migration for type safety |
| 22 | **Unit tests** | Løbende | Start med auth flows og connector-kode |
| 23 | **Fjern legacy sider** | 1 dag | `page-mine-oplysninger`, `page-ordrehistorik`, etc. markeret legacy |
| 24 | **Deduplier restaurant-data** | 1 dag | Demo-menuer defineret 3+ steder |
| 25 | **Virtual scrolling** | 2 dage | For kundelister og ordrelister |
| 26 | **i18n framework** | 3 dage | Erstatte hardcoded danske strenge med i18n |
| 27 | **Accessibility audit** | 2 dage | ARIA labels, keyboard navigation, screen reader support |
| 28 | **Performance budget** | 1 dag | Lighthouse CI med budgets for LCP, FID, CLS |

---

## 5. Hvad VIRKER Godt

For at være fair — disse ting er solide:

1. **Supabase Auth** — Login, signup, OAuth (Google/Facebook), password reset, OTP, 2FA
2. **RLS policies** — Core tables har row-level security
3. **Edge Functions** — SMS, payment intents, webhooks er korrekt server-side
4. **Template checkout flow** — Stripe PaymentIntent med unified_orders tabel
5. **OrderingAgent** — Velstruktureret conversation state machine (mangler bare real API)
6. **Integration connector-arkitektur** — BaseConnector, CanonicalModel, SyncEngine er godt designet
7. **CMS** — Flow CMS fungerer med Supabase-first loading
8. **App/Web Builder** — Funktionelt med live preview via postMessage
9. **Database migrations** — Velorganiserede SQL-filer med RLS, GDPR, multi-tenant

---

## 6. Risiko-vurdering

| Risiko | Sandsynlighed | Konsekvens | Mitigation |
|--------|---------------|------------|------------|
| XSS-angreb via innerHTML | Høj | Kritisk — session hijacking | Fix #2 |
| Stripe secret key lækket | Middel | Kritisk — økonomisk tab | Fix #1 |
| Data-tab (localStorage) | Høj | Middel — brugere mister config | Fix #7 |
| Appen bryder ved 100+ restauranter | Høj | Middel — performance | Fix #5, #25 |
| Deployment-fejl (ingen staging) | Middel | Middel — nedetid | Fix #16 |
| Single point of failure (1 fil) | Sikker | Høj — development velocity | Fix #5 |

---

## 7. Anbefalet Sprint-plan

### Sprint 1 (Uge 1-2): Sikkerhed
- Fix #1-4 (Stripe key, XSS, API keys, error monitoring)
- Estimat: 4-5 dage

### Sprint 2 (Uge 3-4): Arkitektur
- Fix #5-6 (Split app.js, fjern mock data)
- Fix #15-16 (CI/CD, staging)
- Estimat: 5-7 dage

### Sprint 3 (Uge 5-6): Første ægte integration
- Fix #7-8 (Builder til Supabase, e-conomic connector)
- Fix #10 (SMS end-to-end)
- Estimat: 7 dage

### Sprint 4 (Uge 7-8): Betalinger & Analytics
- Fix #9, #12 (Stripe Connect, ægte analytics)
- Estimat: 7 dage

---

*Rapporten er udarbejdet baseret på fuld kode-gennemgang af alle kildefiler. Ingen sugarcoating — dette er den reelle status.*
