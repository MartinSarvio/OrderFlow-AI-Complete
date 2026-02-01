# Projekt Regler for Claude

## Designprincipper
1. Match ALTID eksisterende struktur og design - se lignende komponenter først
2. Ingen ikoner medmindre de allerede bruges i lignende komponenter
3. Minimalistisk design - undgå unødvendige farver og dekorationer
4. Følg eksisterende CSS klasser og mønstre

## Sidebar/Navigation
- Dropdown menus: Simpel flad liste af `.nav-dropdown-item` buttons
- INGEN grupperinger, undertitler eller skillelinjer i dropdowns
- Brug `showPage('page-id')` for navigation

## Ved opgave-fuldførelse
1. Giv kort status på hvad der blev ændret
2. Opdater version i `config/version.js` (version, build, cacheName, releaseDate, sidebarTemplate)
3. Opdater version i `index.html` (Template Version kommentar + script cache `?v=XXX`)
4. Commit til git med beskrivende besked
5. Push til GitHub (auto-deploy til Vercel)

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
