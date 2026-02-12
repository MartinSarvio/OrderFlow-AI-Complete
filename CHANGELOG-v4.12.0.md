# FLOW v4.12.0 — Security Release

**Dato:** 2026-02-12  
**Sprint:** Sprint 1 (Sikkerhed)  
**Audit reference:** AUDIT-RAPPORT-2026-02-12.md, Fix #1-#4

---

## 🔴 Fix #1: Stripe Secret Key fjernet fra frontend

**Problem:** Stripe secret keys (`sk_live_*`) kunne gemmes i localStorage og var tilgængelige for enhver JavaScript på domænet.

**Ændringer:**
- `app/index.html`: Stripe Secret Key input felt erstattet med info-besked om server-side håndtering
- `js/app.js` linje 21716: `stripe_secret_key` fjernet fra settings-objekt i `saveAllApiSettings()`
- `js/app.js` linje 21792: `stripe_secret_key` fjernet fra `localKeys` array i `loadAllApiSettings()`
- `js/app.js` linje 21818: `stripe-secret-key-input` fjernet fra `fieldMappings`
- `js/app.js` linje 21442: Status-check bruger nu kun `stripe_publishable_key`
- `js/security.js`: Automatisk cleanup der fjerner `stripe_secret_key` fra localStorage ved sideload

## 🔴 Fix #2: XSS via innerHTML (systematisk fix)

**Problem:** 369 steder bruger innerHTML, mange med bruger-/database-data uden escaping.

**Ændringer:**
- **Ny fil `js/security.js`:** Global `escapeHtml()` funktion tilgængelig overalt via `window.escapeHtml()`
- **Ny fil `js/security.js`:** Global `sanitizeUrl()` funktion til URL-sanitering
- **DOMPurify CDN** tilføjet til `app/index.html` for HTML content sanitering
- **Fixede innerHTML-steder:**
  - Demo chat beskeder (linje 1018) — bruger-input escaped
  - Sidetitler med dynamiske navne (linje 6950)
  - Error messages fra API-svar (linje 11972, 12208, 12413, 45583) — `err.message` escaped
  - Website URL i statusbeskeder (linje 12115, 12126) — `websiteUrl` escaped
  - QR kode data display (linje 24781, 24791) — `data` escaped
  - Image picker button (linje 33541) — `pickerId` og `sectionId` escaped
  - Database viewer (linje 36189) — `table` navn escaped
  - VAT select options (linje 12946) — `vat.name` og `vat.rate` escaped
  - Restaurant-navne og telefon i grid (linje ~7460) — escaped
  - Restaurant-tabel i Alle Kunder (linje ~7930) — alle felter escaped
  - Produkt-rendering (linje ~11510) — name, category, price escaped
  - Top products (linje ~36505) — name og count escaped
  - CMS indhold (linje 5027) — saniteret med DOMPurify
- **Lokale `escapeHtml()` i CRM-sektioner (linje 8697, 15583):** Beholdt — de virker allerede korrekt

## 🔴 Fix #3: API-nøgler i localStorage

**Problem:** Alle API-nøgler (OpenAI, Firecrawl, Serper, Google, etc.) gemtes i localStorage og sendes direkte fra browseren til 3. parts API'er.

**Ændringer:**
- **Ny fil `js/security.js`:** `saveApiCredential()` og `loadApiCredential()` funktioner der bruger Supabase `api_credentials` tabel
- **Ny fil `js/security.js`:** `proxyApiCall()` funktion til at kalde API'er via Edge Function proxy
- **Ny migration `migrations/003_security_sprint1.sql`:**
  - `api_credentials` tabel med RLS (per-bruger, krypteret)
  - Unik constraint på `user_id + key_name`
  - Policies: brugere kan kun læse/skrive egne credentials
- **Ny Edge Function `supabase/functions/api-proxy/index.ts`:**
  - Proxyer API-kald til OpenAI, Firecrawl, OpenRouter, Serper
  - Henter API-nøgler fra `api_credentials` tabel (ikke fra frontend)
  - Autentificerer bruger via JWT
- **Hardcoded API-nøgler fjernet:**
  - Firecrawl API key (`fc-c12a209b...`) fjernet fra linje 43083 — bruger nu `loadApiCredential()`
  - 6 hardcoded system API keys (Serper ×4, Firecrawl, Google) erstattet med `[SERVER-SIDE]` placeholder
- **⚠️ VIGTIGT:** De fjernede API-nøgler skal tilføjes som environment variables i Supabase Dashboard eller i `api_credentials` tabellen

## 🔴 Fix #4: Error Monitoring

**Problem:** Ingen global error handler — uncaught exceptions forsvinder lydløst.

**Ændringer:**
- **Ny fil `js/security.js`:**
  - `window.onerror` handler — fanger alle uncaught errors
  - `window.addEventListener('unhandledrejection', ...)` — fanger uafventede promise rejections
  - Automatisk logging til `error_logs` Supabase tabel
  - Brugervenlig fejlbesked via toast notification
  - Sensitiv data (API keys, JWT tokens, passwords) strippes automatisk fra fejlbeskeder
- **Ny migration `migrations/003_security_sprint1.sql`:**
  - `error_logs` tabel med RLS
  - Alle authenticated users kan indsætte logs
  - Kun service_role kan læse logs (privacy)
  - Index på timestamp for hurtige queries

## Øvrige ændringer

- **Version:** Bumped til v4.12.0 (build 4920)
- **Cache:** Service worker cache name opdateret til `orderflow-v4920`
- **Asset versioning:** Alle `?v=4912` opdateret til `?v=4920`

## Filer ændret

| Fil | Ændring |
|-----|---------|
| `js/security.js` | **NY** — Global sikkerhedsfunktioner |
| `js/app.js` | XSS fixes, Stripe key fjernet, hardcoded keys fjernet |
| `app/index.html` | DOMPurify CDN, security.js, Stripe input fjernet, cache bust |
| `config/version.js` | v4.12.0, build 4920 |
| `sw.js` | Cache name v4920 |
| `migrations/003_security_sprint1.sql` | **NY** — api_credentials + error_logs tabeller |
| `supabase/functions/api-proxy/index.ts` | **NY** — Server-side API proxy |

## Næste skridt (Sprint 2)

1. Kør migration `003_security_sprint1.sql` i Supabase Dashboard
2. Deploy Edge Function `api-proxy` til Supabase
3. Tilføj API-nøgler som Supabase environment variables eller i `api_credentials` tabellen
4. Gradvis migrering af direkte OpenAI-kald til at bruge `proxyApiCall()` 
5. Rotér ALLE eksponerede API-nøgler (Firecrawl, Serper, Google) — de har været i kildekoden
