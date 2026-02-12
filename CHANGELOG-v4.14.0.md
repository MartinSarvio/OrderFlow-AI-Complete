# FLOW v4.14.0 — Sprint 3: Første Ægte Integrationer

**Dato:** 2026-02-13  
**Build:** 4940  

---

## Fix #7: Builder Data til Supabase

App Builder og Web Builder gemte alt i localStorage — data gik tabt ved browser-rydning.

### Ændringer:
- **Migration `004_sprint3_builders.sql`:** Oprettet `builder_configs` tabel med:
  - `id`, `user_id`, `restaurant_id`, `builder_type`, `config_json`, `created_at`, `updated_at`
  - RLS policies (CRUD kun for egen bruger)
  - Unique constraint per bruger + restaurant + builder type
  - Auto-update trigger på `updated_at`
- **`js/builders.js` opdateret:**
  - `loadAppBuilderConfigAsync()` — loader fra Supabase FØRST, localStorage som fallback/cache
  - `saveAppBuilderConfig()` — gemmer til localStorage (instant UX) + Supabase (persistent)
  - `_saveBuilderConfigToSupabase()` — shared async helper brugt af alle save-funktioner
  - `loadWebBuilderConfigAsync()` — Supabase-first loading for Web Builder
  - Alle auto-save, branding, publish og admin-profil flows bruger nu Supabase som primær storage

---

## Fix #8: e-conomic Connector Koblet til UI

Connector-arkitekturen (`js/integrations/`) var velskrevet men ALDRIG kaldt fra UI.

### Ændringer:
- **Edge Function `supabase/functions/economic-proxy/index.ts`:**
  - Modtager requests fra frontend med action-based routing
  - Henter API credentials fra `api_credentials`, `integration_configs`, eller `integration_connections` tabeller
  - Kalder e-conomic REST API server-side (API nøgler ALDRIG i browser)
  - Understøtter: `test-connection`, `get-company`, `list-customers`, `list-invoices`, `list-products`, `sync-status`, `custom`
  - Opdaterer `integration_connections` automatisk ved succesfuld forbindelse
- **Migration `004_sprint3_builders.sql`:**
  - `integration_connections` tabel (user_id, system, status, last_sync, last_sync_status, config, error_message)
  - RLS policies og auto-update trigger
- **`js/integrations.js` opdateret:**
  - `callEconomicProxy()` — frontend client til economic-proxy Edge Function
  - `testIntegration()` — bruger nu ægte API-kald for e-conomic (via Edge Function)
  - `addIntegration()` — gemmer credentials i `integration_connections`, tester forbindelse automatisk
  - `syncEconomicNow()` — synkroniser-knap der kalder Edge Function
  - `loadEconomicSyncStatus()` / `updateEconomicSyncStatus()` — viser sync-status i UI
  - Connected integrations viser nu "Synkroniser" knap og seneste sync tidspunkt for e-conomic

---

## Fix #10: SMS Workflow End-to-End

Edge Functions for SMS eksisterede allerede. Nu er UI koblet til dem.

### Ændringer:
- **`js/agents.js` opdateret:**
  - `sendTestSms()` — sender ÆGTE SMS via `send-sms` Edge Function (ikke bare UI)
  - SMS test UI tilføjet til Agent Restaurant og Agent Håndværker config panels
  - InMobile webhook URL vist i config panel for korrekt opsætning
  - Fejlhåndtering med status-visning (⏳ Sender... → ✅ Sendt / ❌ Fejl)
  - SMS sends logges til `sms_send_log` tabel i Supabase
  - SMS sends logges til agent activity log
- **Migration `004_sprint3_builders.sql`:**
  - `sms_send_log` tabel for audit trail (user_id, phone_to, message_text, status, provider_message_id)
  - RLS policies

---

## Teknisk Oversigt

| Fil | Ændring |
|-----|---------|
| `migrations/004_sprint3_builders.sql` | 3 nye tabeller: builder_configs, integration_connections, sms_send_log |
| `supabase/functions/economic-proxy/index.ts` | NY Edge Function — e-conomic API proxy |
| `js/builders.js` | Supabase-first load/save for App/Web Builder |
| `js/integrations.js` | e-conomic connector UI, sync status, Edge Function client |
| `js/agents.js` | Ægte SMS sending via Edge Function, test UI, webhook display |
| `config/version.js` | Bumped til v4.14.0 (build 4940) |
