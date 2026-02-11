# Social Media Integration — Facebook & Instagram

## Oversigt

OrderFlow AI integrerer med Instagram Business API og Facebook Page/Messenger API for automatisk ordremodtagelse, kundeservice og proaktive push-beskeder.

## Opsætning

### 1. Forbind konto via Værktøjer

1. Gå til **Værktøjer** → **Integrationer** tab
2. Find **Agent Instagram** eller **Agent Facebook** kortet
3. Klik **Forbind konto** → OAuth popup åbner
4. Log ind med din Meta Business konto
5. Vælg den Page/konto du vil forbinde
6. Godkend tilladelserne
7. Systemet gemmer automatisk Access Token og Page ID

### 2. Konfigurer Agent

1. Gå til **Værktøjer** → **Agenter** tab
2. Klik på Instagram/Facebook agent-kortet
3. Konfigurationspanelet åbner med:
   - **OAuth status** — Forbundet/Ej forbundet
   - **Auto-reply** — Slå automatisk DM-svar til
   - **Ordremodtagelse** — Modtag bestillinger via DM/Messenger
   - **Sprog** — Dansk eller Engelsk
   - **Webhook URL** — Til Meta webhook setup

### 3. Agent Status

Agent-siderne (Instagram Workflow / Facebook Workflow) viser nu status baseret på integration:

- **Ej forbundet** → Orange status med link til Værktøjer
- **Forbundet + Inaktiv** → Grå, kan aktiveres
- **Forbundet + Aktiv** → Grøn med fuld funktionalitet

## Workflow Automation

### Hvad er Workflows?

Workflows er automatiserede handlinger der kører når en kunde skriver en besked på Instagram/Facebook.

### Standard Workflows

| Workflow | Trigger | Handling |
|----------|---------|----------|
| Velkomst | "hej", "hello" | Sender velkomstbesked med menu |
| Menu | "menu", "menukort" | Sender menu + venter på bestilling |
| Bestilling | "bestil", "order" | Starter ordreflow |
| Åbningstider | "åben", "lukket" | Sender åbningstider |
| Levering | "levering", "delivery" | Sender leveringsinfo |

### Opret Ny Workflow

1. Gå til Instagram/Facebook Workflow siden
2. Find **Workflow Automation** sektionen
3. Klik **+ Ny Workflow**
4. Udfyld:
   - **Navn** — F.eks. "Tilbud info"
   - **Trigger ord** — Komma-separeret liste
   - **Auto-svar** — Beskeden der sendes

### Workflow JSON Format

```json
{
  "id": "wf_custom",
  "name": "Tilbud info",
  "platform": "both",
  "enabled": true,
  "trigger": {
    "type": "message_received",
    "conditions": [
      {
        "field": "text",
        "operator": "contains_any",
        "values": ["tilbud", "rabat", "kampagne"]
      }
    ]
  },
  "actions": [
    {
      "type": "reply",
      "message": "Her er vores aktuelle tilbud! 🎉"
    }
  ]
}
```

### Trigger Operators

- `contains_any` — Teksten indeholder ét af ordene
- `equals` — Teksten matcher præcist
- `starts_with` — Teksten starter med

### Action Types

- `reply` — Send svar-besked
- `send_menu` — Send menu
- `start_order_flow` — Start bestillingsflow via OrderingAgent
- `set_context` — Sæt samtale-kontekst
- `create_order` — Opret ordre
- `update_crm` — Opdater CRM

## Push Beskeder (Produkt Tracking)

### Koncept

Systemet tracker når brugere ser specifikke produkter på Instagram/Facebook og sender proaktive DM/Messenger-beskeder.

### Flow

1. Bruger ser "Margherita Pizza" via Instagram
2. System logger: `user_123 viewed margherita_pizza`
3. Timer: 5 minutter (konfigurerbart)
4. Hvis bruger ikke har bestilt → send push-besked
5. Besked: "Hej! Så du lige vores Margherita Pizza? 🍕 Vil du bestille?"

### Konfiguration

- **Aktiveret/Deaktiveret** — Toggle på workflow-siden
- **Forsinkelse** — 1-30 minutter efter visning
- **Skabeloner** — Tilpas beskederne

### Besked-skabeloner

Tilgængelige variabler:
- `{name}` — Kundens navn
- `{product}` — Produktnavn
- `{emoji}` — Auto-valgt emoji baseret på produkt

## OAuth Flow (Teknisk)

### Demo Mode

Systemet kører i demo/mock-mode indtil rigtige API-nøgler tilføjes:
- OAuth popup viser mock-flow
- Tokens gemmes i localStorage
- Alle funktioner virker med simuleret data

### Produktion

Når Meta API credentials er tilgængelige:
1. Opret Meta App på developers.facebook.com
2. Tilføj Instagram Basic Display + Messenger permissions
3. Konfigurer OAuth redirect URI: `https://app.orderflow.dk/auth/meta/callback`
4. Tokens gemmes i Supabase (krypteret)
5. Token refresh kører automatisk

## Filer

| Fil | Beskrivelse |
|-----|-------------|
| `js/social-integration.js` | Hovedmodul — workflows, push, integration manager |
| `js/app.js` | Agent config panel, OAuth init, Integrationer tab |
| `app/index.html` | Instagram/Facebook workflow pages, Værktøjer page |

## Version

Implementeret i v4.9.0 (build 4900)
