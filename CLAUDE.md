
# Projekt Regler for Claude

## Designprincipper
1. Match ALTID eksisterende struktur og design - se lignende komponenter først
2. Match eksisterende design, men undgå at kopiere hele side-kompositioner
2. Ingen ikoner medmindre de allerede bruges i lignende komponenter
3. Minimalistisk design - undgå unødvendige farver og dekorationer
4. Følg eksisterende CSS klasser og mønstre

## Variation & unikke layouts (alle nye sider)
- Undgå at kopiere hele side-strukturen fra andre sider. Genbrug komponenter, ikke hele layoutet.
- Før design: find 2-3 mest lignende sider og vælg den bedste base.
- Hvis der findes flere eksisterende layoutmønstre, vælg et der ikke matcher den nærmeste side.
- Kræv mindst 3 tydelige forskelle ift. nærmeste side (vælg 3): sektionrækkefølge, grid/kolonner, kort- eller formulargruppering, hero-placering, baggrundsopdeling, spacing/rytme, typografisk hierarki.
- Variation må kun ske indenfor eksisterende CSS-klasser og komponentmønstre. Ingen nye visuelle stilarter.
- Baggrundsstruktur: brug kun eksisterende baggrundsbehandlinger; undgå samme baggrundsopdeling på to nye sider i træk, medmindre der kun findes én.
- Hvis en side SKAL være identisk pga. funktionelt flow, forklar kort hvorfor i opgave-status.

## Sidebar/Navigation
- Dropdown menus: Simpel flad liste af `.nav-dropdown-item` buttons
- INGEN grupperinger, undertitler eller skillelinjer i dropdowns
- Brug `showPage('page-id')` for navigation
- **VIGTIGT:** Ændringer til sidebar skal ALTID laves BÅDE i:
  1. `partials/sidebar.html` - bruges af landing pages
  2. `index.html` (linje ~616-635) - har sin egen sidebar kopi
- Partials-filen inkluderes IKKE automatisk i index.html

## Ved opgave-fuldførelse
1. Giv kort status på hvad der blev ændret
2. Opdater version i `config/version.js` (version, build, cacheName, releaseDate, sidebarTemplate)
3. Opdater version i `index.html` (Template Version kommentar + script cache `?v=XXX`)
4. Commit til git med beskrivende besked
5. Push til GitHub (auto-deploy til Vercel)

## Struktur Oversigt Vedligeholdelse
- **VIGTIGT:** Når der tilføjes nye sider, SKAL `Struktur Oversigt.md` opdateres
- Gælder for ALLE typer side-oprettelser:
  1. **Direkte i koden:** Nye sider med ID'er som `page-*`, `subpage-*`, eller `settings-content-*`
  2. **Via Flow CMS:** Nye sider oprettet gennem CMS editoren
  3. **Via abonnement:** Bruger-oprettede sider (app/website builder)
- Ved opdatering:
  1. Tilføj siden i den relevante sektion i `Struktur Oversigt.md`
  2. Opdater "Sidst opdateret" datoen
  3. Opdater total-antal hvis relevant
  4. Regenerer `Struktur Oversigt.html` hvis PDF skal opdateres

## Billede-matching
Når der gives et billede at matche: Implementer 100% match - samme spacing, farver, typografi

## Gem-knapper placering
- Alle knapper med "Gem", "Gem oplysninger", "Gem Ændringer" skal placeres nederst i højre hjørne
- På modsatte side (venstre) skal der vises en bekræftelse når ændringer er gemt (f.eks. "✓ Ændringer gemt")
- Brug flexbox med `justify-content: space-between` for layout
- Eksempel struktur:
```html
<div style="display:flex;justify-content:space-between;align-items:center;margin-top:24px">
  <span id="save-status" style="color:var(--success);display:none">✓ Ændringer gemt</span>
  <button class="btn btn-primary" onclick="saveFunction()">Gem ændringer</button>
</div>
```

## Projekt Struktur & Navngivning

### Arbejdsprojekt
**FLOW-app** (`/Users/martinsarvio/Downloads/FLOW-app/`) - Vi arbejder ALTID i dette projekt.

### Kernefiler (MÅ IKKE SLETTES)

| Komponent | Sti | Beskrivelse |
|-----------|-----|-------------|
| **Hovedapplikation** | `index.html` | Den primære SPA-applikation med alle sider |
| **Landing Page** | `landing-pages/*.html` | Marketing-sider. "Login" knappen fører til hovedapplikationen |

### Landing Pages Workflow

**Udviklings- og deployment-flow:**

| Mappe | Formål | Beskrivelse |
|-------|--------|-------------|
| `landing-pages/` | **UDVIKLING** | Rediger, tilføj og slet sider HER først |
| `public/landing/` | **PRODUKTION** | Deployes til GitHub - kun opdater via "software opdatering" |

**Arbejdsgang:**
1. **Udvikling:** Alle ændringer til landing pages sker i `landing-pages/` mappen
2. **Test:** Test ændringerne lokalt fra `landing-pages/`
3. **Opdatering:** Når ændringer virker, kør "software opdatering" til `public/landing/`
4. **Deploy:** GitHub deployer automatisk fra `public/` mappen

**Software opdatering kommando:**
```bash
# Kopier alle ændringer fra development til production
cp landing-pages/*.html public/landing/

# Fix stier (landing-pages bruger ../, public/landing bruger ../../)
cd public/landing && for file in *.html; do
  sed -i '' 's|src="../|src="../../|g' "$file"
  sed -i '' 's|href="../|href="../../|g' "$file"
done
```

**VIGTIGT:**
- Rediger ALDRIG direkte i `public/landing/` - brug altid `landing-pages/`
- Stier i `landing-pages/` bruger `../` (1 niveau op)
- Stier i `public/landing/` bruger `../../` (2 niveauer op)

### Web Builder Skabeloner (MÅ IKKE SLETTES)

| Skabelon | Mappe | Status | Bruges til |
|----------|-------|--------|------------|
| **Roma** | `templates/roma/` | PLANLAGT (skal oprettes) | Website skabelon 1 - konfigureres via Web Builder |
| **Mario** | `templates/mario/` | AKTIV | Website skabelon 2 - konfigureres via Web Builder |

**Vigtig regel for Web Builder skabeloner:**
- Al data i skabelonen (menu, oplysninger, åbningstider) vises som DEFAULT i Web Builder
- Brugeren SKAL ændre/slette denne data for at tilpasse deres hjemmeside
- Når "Hjemmeside" knappen trykkes, vises den konfigurerede data fra Web Builder
- Skabelonens data erstattes af brugerens konfiguration
- **DYNAMISK:** Data og layout er dynamisk baseret på den VALGTE skabelon
- Roma og Mario har FORSKELLIGE designs - systemet skal tilpasse sig den aktive skabelon

### App Builder Skabeloner (MÅ IKKE SLETTES)

| Skabelon | Status | Beskrivelse |
|----------|--------|-------------|
| **App Skabelon 1** | AKTIV | Nuværende app skabelon |
| **App Skabelon 2** | PLANLAGT | Tilføjes senere med dropdown til valg mellem skabeloner |

**Vigtig regel for App Builder skabeloner:**
- Samme princip som Web Builder: default data vises fra skabelon
- Brugeren ændrer data i App Builder sektionerne
- "Mobil App" knappen viser den konfigurerede data
- **DYNAMISK:** Data og layout er dynamisk baseret på den VALGTE skabelon
- App Skabelon 1 og 2 har FORSKELLIGE designs - systemet skal tilpasse sig den aktive skabelon

### FLOW CMS Integration
- FLOW CMS skal have en knap der fører direkte til **Landing Page**
- Dette forbinder hele systemet uden at miste data eller struktur
- Flow: FLOW CMS → Landing Page → Login → Hovedapplikation

## Automatisk CMS Integration (VIGTIGT)

Når du opretter nye elementer, tekst, animationer eller sider, SKAL du automatisk opsætte redigeringsmuligheder i FLOW CMS:

### Ved Oprettelse af Ny Side
1. **flowPagesList:** Tilføj til `js/app.js` (linje ~27370)
   ```javascript
   { slug: 'side-navn', title: 'Side Titel', description: 'Beskrivelse' }
   ```
2. **defaultFlowPageContent:** Tilføj default indhold i `js/app.js` (linje ~27418)
3. **HTML:** Inkluder `<script src="/js/flow-cms-render.js"></script>` i filen

### Ved Oprettelse af Nyt Element/Animation
1. **renderSectionEditor():** Tilføj section type i `js/app.js` (linje ~28793)
2. **addSectionToPage():** Tilføj default værdier i `js/app.js` (linje ~29640)
3. **renderSection():** Tilføj case i `js/flow-cms-render.js` (linje ~159)
4. **Render funktion:** Opret dedikeret render funktion i `js/flow-cms-render.js`
5. **Dropdown:** Tilføj til "Tilføj sektion" dropdown i `index.html` (linje ~9378)

### Eksisterende Section Types
`hero`, `text`, `features`, `cta`, `testimonials`, `faq`, `images`, `trusted`, `bento`, `beliefs`, `logocloud`, `footer`, `chat-demo`

### Data Attributter til CMS Felter
Brug `data-cms-field="feltNavn"` på HTML elementer for at gøre dem redigerbare:
```html
<p data-cms-field="userMessage">Besked tekst</p>
<img data-cms-field="userAvatar" src="...">
```

### Sider i Hovedapplikation

#### App Builder Sider
- `page-appbuilder-branding` - Branding/Logo
- `page-appbuilder-design` - Design/Layout
- `page-appbuilder-farver` - Farveskema
- `page-appbuilder-billeder` - Billeder
- `page-appbuilder-funktioner` - Funktioner
- `page-appbuilder-menu` - Menu
- `page-appbuilder-timer` - Åbningstider
- `page-appbuilder-kontakt` - Kontaktoplysninger
- `page-appbuilder-levering` - Leveringsindstillinger
- `page-appbuilder-loyalty` - Loyalitetsprogram
- `page-appbuilder-push-notifikationer` - Push notifikationer
- `page-appbuilder-ordrer` - Ordrer
- `page-appbuilder-kunder` - Kunder
- `page-appbuilder-analytics` - Analytics
- `page-appbuilder-mobilapp` - Mobil App preview

### Rediger Sider
Disse sider redirecter til de respektive undersider. Alle ændringer her påvirker den FAKTISKE data og kode på den endelige side.
