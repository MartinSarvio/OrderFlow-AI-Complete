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
2. Commit til git med beskrivende besked
3. Push til GitHub (auto-deploy til Vercel)

## Billede-matching
Når der gives et billede at matche: Implementer 100% match - samme spacing, farver, typografi
