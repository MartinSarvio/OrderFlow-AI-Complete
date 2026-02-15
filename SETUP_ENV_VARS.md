# Opsætning af Environment Variables

## Hurtig Metode: Via Script (Anbefalet)

### Trin 1: Få din Vercel Token
1. Gå til https://vercel.com/account/tokens
2. Klik "Create Token"
3. Kopiér token

### Trin 2: Kør scriptet
```bash
export VERCEL_TOKEN='dit-token-her'
cd /Users/martinsarvio/Downloads/FLOW-app
./scripts/set-vercel-env.sh
```

Scriptet vil bede dig om:
- SUPABASE_URL (default: https://qymtjhzgtcittohutmay.supabase.co)
- SUPABASE_SERVICE_ROLE_KEY (find i Supabase Dashboard → Settings → API)
- SUPABASE_ANON_KEY (find i Supabase Dashboard → Settings → API)

### Trin 3: Redeploy
Efter scriptet er kørt, gå til Vercel Dashboard og klik "Redeploy" på seneste deployment.

---

## Manual Metode: Via Vercel Dashboard

Hvis scriptet ikke virker, kan du sætte variables manuelt:

### 1. Åbn Vercel Settings
https://vercel.com/dashboard/settings/environment-variables

### 2. For HVER variable, tilføj med ALLE tre environments:

**Variable 1: SUPABASE_URL**
- Key: `SUPABASE_URL`
- Value: `https://qymtjhzgtcittohutmay.supabase.co`
- Environments: ✅ Production ✅ Preview ✅ Development

**Variable 2: SUPABASE_SERVICE_ROLE_KEY**
- Key: `SUPABASE_SERVICE_ROLE_KEY`
- Value: [Find i Supabase Dashboard → Settings → API → service_role]
- Environments: ✅ Production ✅ Preview ✅ Development
- Type: ✅ Encrypted

**Variable 3: SUPABASE_ANON_KEY**
- Key: `SUPABASE_ANON_KEY`
- Value: [Find i Supabase Dashboard → Settings → API → anon public]
- Environments: ✅ Production ✅ Preview ✅ Development

### 3. Redeploy
Klik "Redeploy" på seneste deployment efter at have sat variables.

---

## Find Supabase Keys

1. Gå til: https://supabase.com/dashboard/project/qymtjhzgtcittohutmay/settings/api
2. Kopiér:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key (under "Project API keys") → `SUPABASE_SERVICE_ROLE_KEY`
   - **anon public** key → `SUPABASE_ANON_KEY`

---

## Troubleshooting

**Problem:** "Missing Supabase environment variables" fejl
**Løsning:** Tjek at ALLE tre environments er valgt for hver variable

**Problem:** Variables forsvinder efter deployment
**Løsning:** De er sandsynligvis kun sat for ét environment. Sæt dem for alle tre.

**Problem:** Script virker ikke
**Løsning:** Brug den manuelle metode via Vercel Dashboard i stedet.
