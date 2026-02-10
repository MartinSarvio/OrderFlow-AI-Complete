# AGENTS.md — OrderFlow AI

> Instructions for AI coding agents working on this codebase.

---

## 1. Project Overview

**OrderFlow AI** is a restaurant automation SaaS platform. It provides order management, AI-powered marketing workflows, website/app builders, CRM, analytics, and accounting integrations — all in one product.

- **Type:** Monolithic Single Page Application (SPA)
- **UI language:** Danish
- **Code language:** English (variable names, comments may mix Danish)
- **Production URL:** Hosted on Vercel
- **Repository:** GitHub (auto-deploys on push to `main`)

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML / CSS / JavaScript (no framework) |
| Build tool | Vite 5 + vite-plugin-handlebars |
| Backend / Database | Supabase (PostgreSQL, Auth, Realtime, Edge Functions) |
| Serverless API | Vercel Functions (Node.js, in `/api/`) |
| AI | OpenAI (gpt-4o-mini), Anthropic Claude |
| Payments | Stripe |
| SMS | InMobile |
| Testing | Vitest + jsdom |
| CI/CD | GitHub Actions → Vercel |
| Package manager | npm |

---

## 3. Architecture

### Core files

| File | Description | Size |
|------|-------------|------|
| `app/index.html` | Entire SPA UI — all pages as inline `<div>` sections | ~15K lines |
| `js/app.js` | All application logic (navigation, CRUD, modals, builders, AI) | ~46K lines |
| `css/styles.css` | Main stylesheet with dark/light theme via CSS custom properties | ~7K lines |
| `config/version.js` | Single source of truth for version info | Small |

### Routing

Hash-based SPA routing: `#dashboard`, `#kunder`, `#settings`, etc. The function `showPage(pageId)` in `app.js` hides/shows `<div>` sections.

### Directory structure

```
FLOW-app/
├── app/index.html          # Main SPA (all UI)
├── js/app.js               # Main app logic
├── js/integrations/        # Accounting connectors (e-conomic, etc.)
├── js/supabase-client.js   # Supabase client setup
├── css/                    # Stylesheets (styles.css, components.css, etc.)
├── config/version.js       # Version configuration
├── landing-pages/          # Public marketing pages (DEVELOPMENT)
├── public/landing/         # Public marketing pages (PRODUCTION copy)
├── templates/skabelon-{1,2,3}/  # Web Builder restaurant templates
├── api/                    # Vercel serverless functions
├── supabase/               # Supabase config, migrations, edge functions
├── flow-agents/            # AI workflow/debugging agents (TypeScript)
├── partials/               # Handlebars partials (sidebar, topbar, etc.)
├── sql/                    # Database schema
├── tests/                  # Vitest test files
├── docs/                   # Documentation
├── tools/                  # Utility tools (image generator)
└── .github/workflows/      # CI/CD pipeline
```

### Landing Pages Workflow

- **Development:** Edit files in `landing-pages/` (paths use `../`)
- **Production:** Copy to `public/landing/` via update script (paths use `../../`)
- **NEVER** edit `public/landing/` directly

---

## 4. Getting Started

```bash
cd FLOW-app
npm install
npm run dev        # Starts Vite on http://localhost:8080
```

Open http://localhost:8080/app to access the application.

**Requirements:**
- Node.js 18+
- Supabase project for auth/data (see `supabase/config.toml`)
- Environment variables for API keys (Stripe, InMobile, OpenAI, etc.)

---

## 5. Build & Test Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 8080) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests in watch mode (Vitest) |
| `npm run test:run` | Run tests once |

### CI/CD Pipeline (`.github/workflows/deploy.yml`)

1. **Validate** — HTML validation, JS syntax check, version consistency
2. **Preview deploy** — Vercel preview on pull requests
3. **Production deploy** — Vercel production on push to `main`

---

## 6. Code Style & Conventions

### Design principles
- **Always match existing structure and design** — look at similar components first
- Use existing CSS classes and patterns — do not invent new visual styles
- Minimalist design — avoid unnecessary colors and decorations
- No icons unless already used in similar components

### Variation for new pages
- Do NOT copy entire page layouts from other pages. Reuse components, not layouts
- Require at least 3 clear differences from the nearest similar page

### Sidebar / Navigation
- Dropdown menus: flat list of `.nav-dropdown-item` buttons
- NO groupings, subtitles, or dividers in dropdowns
- Use `showPage('page-id')` for navigation
- **CRITICAL:** Sidebar changes must ALWAYS be made in BOTH:
  1. `partials/sidebar.html` (used by landing pages)
  2. `app/index.html` (has its own sidebar copy)

### Save buttons
- All "Save" buttons go in the bottom-right corner
- Confirmation message (e.g., "✓ Ændringer gemt") on the left side
- Use flexbox with `justify-content: space-between`

### New pages checklist
When creating a new page:
1. Add page entry to `flowPagesList` in `js/app.js`
2. Add default content to `defaultFlowPageContent` in `js/app.js`
3. Update `Struktur Oversigt.md` with the new page
4. Set up CMS editability if applicable

---

## 7. Version & Release Workflow

**After every task, ALWAYS do these steps:**

1. Bump version in `config/version.js`:
   - `version` (semver string)
   - `build` (integer)
   - `cacheName` (string with build number)
   - `sidebarTemplate.version`
   - `releaseDate` and `sidebarTemplate.lastModified`

2. Bump cache-busters in `app/index.html`:
   - Template Version comment at the top
   - All `?v=XXXX` query params on `<script>` and `<link>` tags

3. Git commit with a descriptive message

4. Git push to GitHub (triggers auto-deploy to Vercel)

---

## 8. Database

**Platform:** Supabase PostgreSQL

**Schema:** `sql/schema.sql`

**Migrations:** 17 files in `supabase/migrations/` covering:
- Auth (2FA, trusted devices, user settings)
- Orders (unified_orders, order_status_history)
- CRM (customers, loyalty tables)
- Builder (builder_configs, multi-tenant sites, custom domains)
- AI (ai_agents, sms_workflows)
- GDPR lifecycle, custom roles, invitations, application logging

**Key tables:**

| Table | Description |
|-------|-------------|
| `restaurants` | Restaurant data |
| `builder_configs` | Web/App builder configurations |
| `unified_orders` | Orders from all channels |
| `customers` | Customer data with stats |
| `ai_agents` | AI ordering agents (Instagram/Facebook) |
| `sms_workflows` | SMS workflow configurations |

---

## 9. API Endpoints

### Vercel Functions (`/api/`)

| Endpoint | Description |
|----------|-------------|
| `auth/provision-customer.js` | Customer provisioning |
| `auth/meta/callback.js` | Meta/Facebook OAuth callback |
| `stripe/create-checkout.js` | Stripe checkout session |
| `stripe/verify-session.js` | Payment verification |
| `sms/incoming.js` | Incoming SMS handler |
| `seo/scan-v3.js` | SEO scanning |
| `generate-image.js` | Google Gemini image generation |
| `google/place-details.js` | Google Places lookup |
| `webhooks/meta.js` | Meta webhook handler |
| `webhooks/sms.js` | SMS webhook handler |

### Supabase Edge Functions (`/supabase/functions/`)

| Function | Description |
|----------|-------------|
| `create-payment-intent` | Stripe PaymentIntent creation |
| `send-sms` | Send SMS via InMobile |
| `receive-sms` / `receive-sms-inmobile` | SMS reception |
| `send-otp-email` | OTP email for auth |
| `ai-chat` | AI chat functionality |
| `aggregate-metrics` | Metrics aggregation |
| `stripe-webhook` | Stripe event handler |
| `receive-missed-call` | Missed call tracking |

---

## 10. Security Considerations

- **Row Level Security (RLS)** is enabled on all Supabase tables
- **API keys** must NEVER be committed to code — use environment variables
- **Stripe webhooks** must verify signatures
- **2FA** is supported via TOTP and trusted devices
- **GDPR lifecycle** management is implemented in database
- **CORS** is configured and tested (`tests/cors.test.js`)
- The `flow-agents/.env` file contains sensitive keys — ensure it's in `.gitignore`

---

## 11. Critical Rules

### Files that MUST NOT be deleted
- `app/index.html` — the entire application UI
- `js/app.js` — all application logic
- `css/styles.css` — main stylesheet
- `templates/skabelon-{1,2,3}/` — Web Builder templates
- `config/version.js` — version source of truth

### Copyright footer in templates
- Left: "Copyright ©2026 All rights reserved FLOW"
- Right: "This template is made with ❤ by FLOW"
- Protected by MutationObserver — MUST NOT be removed

### Builder data is dynamic
- Web Builder and App Builder templates receive data via `postMessage`
- Config is stored per template: `orderflow_webbuilder_config_{templateId}`
- Template data is default — user customizes through the builder UI

### New integrations
Follow the BaseConnector pattern:
- `js/integrations/core/connector.js` — Base class
- `js/integrations/core/canonical-model.js` — Shared data model
- `js/integrations/core/sync-engine.js` — Sync logic
- Create connector in `js/integrations/connectors/{system}/`

### Removing functions
Before removing any function, grep for ALL references (`window.X` exports, onclick handlers, other callers). Ensure at least one definition remains. Removing a function that is referenced by `window.X = X` will cause a `ReferenceError` that breaks the entire JS file.

---

## 12. Testing

**Framework:** Vitest with jsdom environment

**Test files:**
- `tests/analytics.test.js` — Analytics metrics and formatting
- `tests/cors.test.js` — CORS configuration
- `tests/navigation-guard.test.js` — Navigation guards
- `tests/ordering-agent.test.js` — AI ordering agent
- `tests/integrations/economic.test.js` — e-conomic connector

**Run:** `npm run test:run`

---

## 13. Key Documentation

| File | Content |
|------|---------|
| `CLAUDE.md` | Claude-specific development rules and conventions |
| `STRUCTURE.md` | Page structure overview |
| `Struktur Oversigt.md` | Detailed page inventory (94+ pages) |
| `docs/DATA_STRATEGY.md` | Data architecture documentation |
| `docs/INTEGRATION_ARCHITECTURE_ACCOUNTING.md` | Accounting integration design |
| `docs/SUPABASE_SETUP.md` | Database setup guide |
| `docs/ROADMAP.md` | Project roadmap |
| `docs/TEST_CHECKLIST.md` | Testing procedures |
