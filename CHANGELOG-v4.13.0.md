# Changelog v4.13.0 — Architecture Refactoring

**Dato:** 2026-02-12  
**Build:** 4930  
**Sprint:** Sprint 2 — Arkitektur-refaktorering

---

## Fix #5: Split app.js i moduler

**Problem:** `js/app.js` var 46.861 linjer i én fil med 1.383 globale funktioner — uvedligeholdelig.

**Løsning:** Splittet i 15 logiske moduler:

| Fil | Linjer | Indhold |
|-----|--------|---------|
| `js/app.js` (core) | 11.401 | Theme, config, routing, showPage(), globals, activity tracking, workflow engine, AI classification, SMS, test panel, SEO scanner, printer, edit mode, API pagination |
| `js/auth.js` | 3.355 | Login, signup, OAuth (Google/Facebook), 2FA (TOTP + email), session management, device detection, trusted devices |
| `js/dashboard.js` | 408 | loadDashboard(), KPI-kort, revenue chart, breadcrumb, modals |
| `js/customers.js` | 8.469 | CRM, restaurants, alle-kunder grid, customer detail, products, delivery zones, extras, menu import, invoices, subscriptions, stamdata, workflow settings, command search, kundelog, aktivitetslog |
| `js/orders.js` | 1.068 | Ordrer, ordrehistorik, filterOrders, accept/reject/start/complete, order history |
| `js/reports.js` | 1.846 | Alle rapporter (dags, produkt, z, konvertering, genbestilling, anmeldelse, heatmap), ExportService, report file management |
| `js/analytics.js` | 396 | AnalyticsDashboard, alle analytics tabs (overview, sales, products, AI, channels) |
| `js/leads.js` | 311 | Leads, pipeline, filterLeads, formatCurrency |
| `js/marketing.js` | 3.035 | Loyalty program, campaigns, segments, udsendelser, marketing tabs |
| `js/cms.js` | 6.451 | Flow CMS, sider, blog, SEO indstillinger, farver/fonts, data stats, data grid, landing page config, template overrides, custom domains |
| `js/builders.js` | 3.821 | App Builder (alle sider), Web Builder (config, preview, forms, cookie/privacy) |
| `js/settings.js` | 1.828 | Settings tabs, toast, notifications, header notifications, roles, system version, cache/maintenance, diagnostics, export/import |
| `js/integrations.js` | 1.384 | API nøgler, integrationer, FLOW ID, customer integrations |
| `js/agents.js` | 2.404 | Instagram/Facebook/SMS workflows, AI agents, agent overview, versioning, AI media (image/video) |
| `js/demo.js` | 756 | Demo data system: isDemoDataEnabled, toggleDemoData, alle generateDemo* funktioner |

**Script load-rækkefølge i `app/index.html`:**
```
security.js → app.js (core) → auth.js → dashboard.js → customers.js → orders.js →
reports.js → analytics.js → leads.js → marketing.js → cms.js → builders.js →
settings.js → integrations.js → agents.js → demo.js
```

**Bevarede constraints:**
- ✅ Alle funktioner forbliver globale (plain function declarations)
- ✅ Simple `<script>` tags — ingen ES modules, ingen bundler
- ✅ Alle onclick-handlers i HTML virker fortsat
- ✅ Globale variabler (currentUser, restaurants, CONFIG, etc.) i app.js core
- ✅ Ingen cirkulære dependencies — runtime calls resolver cross-module
- ✅ Al eksisterende funktionalitet bevaret

---

## Fix #6: Fjern mock data fra dashboard

**Problem:** Dashboard viste `Math.random()` tal for revenue, ordrer og samtaler selv uden demo-mode.

**Løsning:**
- Fjernet `Math.random()` fallbacks fra `ordersToday` og `revenueToday` beregninger
- `conversations` beregnes nu kun fra ordrer (ikke random)
- Ny `_dashFmt()` helper: viser "—" når demo-mode er OFF og værdien er 0
- Demo-mode bevaret: når `isDemoDataEnabled()` er true, vises reelle demo-data fra generated demo orders

**Før:** Revenue viste fx "12.847 kr" (random) uden nogen data  
**Efter:** Revenue viser "—" uden data, eller reelle demo-tal med demo-mode

---

## Tekniske noter

- Version bumped til v4.13.0 (build 4930)
- Cache buster opdateret på alle script tags (`?v=4130`)
- Ingen ændringer til HTML struktur eller CSS
- Ingen ændringer til Supabase queries eller API kald
