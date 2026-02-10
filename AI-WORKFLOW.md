# AI Workflow - OrderFlow AI Development

## Projekt Info
- **Repo:** https://github.com/MartinSarvio/OrderFlow-AI-Complete.git
- **Lokal kopi:** `/data/.openclaw/workspace/flow-dev/`
- **Regler:** `CLAUDE.md` (SKAL følges)
- **Agent guide:** `AGENTS.md`

## Kerneværktøjer (Built-in)

### 1. File Operations
- ✅ **Read** - Læs filer (kode, config, docs)
- ✅ **Write** - Opret nye filer
- ✅ **Edit** - Rediger eksisterende filer (præcise edits)

### 2. Terminal/Execution
- ✅ **exec** - Kør shell commands (npm, git, vite, osv.)
- ✅ **process** - Manage background sessions

### 3. Web/Browser
- ✅ **web_search** - Søg på nettet (Perplexity)
- ✅ **web_fetch** - Hent indhold fra URLs
- ✅ **browser** - Browser automation (test UI flows)

### 4. Version Control
- ✅ **Git** - Via exec (commit, push, status, diff, osv.)

## Workflow Steps

### 1. Før jeg starter opgave:
```bash
cd /data/.openclaw/workspace/flow-dev
git status
git pull origin main  # Hent seneste ændringer
```

### 2. Under udvikling:
- Læs relevante filer først (CLAUDE.md, eksisterende komponenter)
- Match eksisterende struktur og design
- Test lokalt hvis muligt
- Undgå at kopiere hele side-kompositioner

### 3. Efter opgave:
```bash
# 1. Opdater version
# - config/version.js (version, build, cacheName, releaseDate, sidebarTemplate)
# - index.html (Template Version kommentar + script cache ?v=XXX)

# 2. Opdater Struktur Oversigt.md (hvis ny side)

# 3. Commit til git
git add .
git commit -m "Beskrivende besked om ændringer"

# 4. Push til GitHub (auto-deploy til Vercel)
git push origin main
```

## Projekt-specifikke Regler (fra CLAUDE.md)

### Design
- ✅ Match ALTID eksisterende struktur
- ✅ Minimalistisk design
- ✅ Følg eksisterende CSS klasser
- ✅ Undgå at kopiere hele side-kompositioner
- ✅ Kræv mindst 3 tydelige forskelle fra nærmeste side

### Sidebar/Navigation
- ✅ Ændringer skal laves BÅDE i:
  - `partials/sidebar.html`
  - `index.html` (linje ~616-635)

### CMS Integration
- ✅ Nye elementer skal automatisk have CMS redigeringsmuligheder
- ✅ Tilføj til flowPagesList, defaultFlowPageContent, renderSectionEditor, osv.

### Web/App Builder
- ✅ Skabeloner må IKKE slettes
- ✅ Data i skabelon = DEFAULT data i builder
- ✅ Copyright footer må IKKE fjernes

## Test Commands

```bash
# Start dev server
npm run dev

# Kør tests
npm test

# Build til produktion
npm run build

# Preview production build
npm run preview
```

## External Skills (Kan installeres ved behov)

### Potentielt nyttige:
- **skill-creator** - Hvis jeg skal lave custom skills til projektet
- **youtube-watcher** - Hvis der er tutorial videos
- **perplexity** - Deep research når jeg har brug for det
- **clawhub** - Søg efter relevante skills

### Nuværende Status:
- ✅ Har adgang til alle core tools
- ✅ Git repo clonet
- ✅ CLAUDE.md læst og forstået
- ✅ AGENTS.md gennemgået
- 🎯 Klar til at hjælpe med udvikling

## Kommunikation

### Når opgave er færdig:
1. ✅ Kort status på hvad der blev ændret
2. ✅ Liste over opdaterede filer
3. ✅ Bekræft at versioner er opdateret
4. ✅ Bekræft at git commit + push er gennemført

### Hvis jeg har brug for hjælp:
- Spørg brugeren før jeg laver breaking changes
- Vis eksempler/previews når relevant
- Forklar tekniske valg når det giver mening
