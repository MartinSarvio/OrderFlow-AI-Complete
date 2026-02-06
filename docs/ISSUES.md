# FLOW-app Issues Log

**Status:** Active
**Updated:** 2026-02-05

This file is the local issue tracker for QA findings. Each issue includes severity, scope, reproduction, evidence, impact, and fix plan. Items marked **(Code‑verified)** are confirmed via code inspection; runtime verification pending.

---

## P0 — Security

### P0-SEC-001 — Supabase `service_role` key exposed client‑side (Code‑verified)
- **Area:** Auth / Data Access / Security
- **Severity:** P0 (critical)
- **Where:** `js/supabase-client.js`
- **Evidence:** `SUPABASE_CONFIG.key` is a `service_role` JWT embedded in client code.
- **Impact:** Full database access from client; RLS bypass; data exfiltration risk.
- **Repro:** Open client source and copy key; use Supabase REST to read/write any table.
- **Expected:** Client uses `anon` key; privileged ops only on server.
- **Actual:** Service role key is shipped to browser.
- **Root cause:** Development shortcut left in production bundle.
- **Fix plan:**
  1. Replace with `anon` key in client.
  2. Move privileged operations to Supabase Edge Functions / serverless API.
  3. Enable/verify RLS policies.
  4. Rotate service role key immediately.
- **Verification:** Run auth flows + ensure restricted data access from client is blocked.

---

## P1 — Data Integrity

### P1-DATA-001 — SMS webhook writes invalid `direction` value (Code‑verified)
- **Area:** SMS / Webhooks / DB
- **Severity:** P1
- **Where:** `api/sms/incoming.js` vs `supabase/migrations/20260107_create_messages.sql`
- **Evidence:** Constraint `messages_direction_check` allows only `inbound|outbound`, but webhook inserts `incoming`.
- **Impact:** Incoming SMS inserts fail; inbound messages dropped.
- **Repro:** Call `/api/sms/incoming` with payload → insert fails with constraint error.
- **Expected:** `direction` should be `inbound`.
- **Actual:** `direction` is `incoming`.
- **Root cause:** Mismatch between API and DB enum/constraint.
- **Fix plan:**
  1. Change webhook to write `inbound`.
  2. Add test for webhook insert.
  3. Verify in Supabase logs.
- **Verification:** Send test webhook; confirm row saved.

---

## P2 — Demo / Missing Endpoints

### P2-DEMO-001 — Demo references missing endpoints `/api/places/details` and `/api/places/reviews` (Code‑verified)
- **Area:** Demos / Business Scanner
- **Severity:** P2
- **Where:** `demos/business-scanner-demo.html`
- **Evidence:** Demo calls endpoints that do not exist in `api/`.
- **Impact:** Demo flow fails at details/reviews steps.
- **Repro:** Open demo, search business → details/reviews requests 404.
- **Expected:** Endpoints return place details and reviews.
- **Actual:** 404 / missing routes.
- **Root cause:** Demo references non‑implemented endpoints.
- **Fix plan:**
  1. Implement `/api/places/details` and `/api/places/reviews`, or
  2. Remove/replace demo calls.
- **Verification:** Run demo; confirm no 404s.

