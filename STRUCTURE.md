# OrderFlow Sidestruktur

Denne fil dokumenterer hele systemets sidestruktur. Opdateres hver gang nye sider tilføjes.

---

## [1] Public Website Pages

```
landing.html
├── restaurant-hjemmeside.html
├── online-bestilling.html
├── custom-mobile-app.html
├── zero-commission-delivery.html
├── loyalitetsprogram.html
├── automatiseret-marketing.html
├── how-it-works.html
├── priser.html
├── help-center.html
├── Ressourcer
│   ├── restaurant-marketing-guide.html
│   ├── case-studies.html
│   ├── seo-for-restauranter.html
│   ├── restaurant-email-marketing.html
│   ├── restaurant-mobile-app.html
│   └── online-bestillingssystemer.html
└── Virksomhed
    ├── om-os.html
    │   ├── ledelse.html
    │   └── karriere.html
    ├── partner.html
    └── presse.html
```

## [2] Juridiske Sider

```
├── privacy.html
├── cookie-settings.html
├── terms.html
├── disclaimer.html
├── platform-terms.html
├── accessibility.html
└── restaurant-agreement.html
```

## [3] Admin Dashboard (index.html)

```
Dashboard
└── Kunder
    ├── Tilføj demo-kunde (demo-onboarding)
    ├── Tilføj restaurant (add-restaurant)
    ├── Alle kunder (alle-kunder)
    └── Kundevisning (kunder)
        ├── Ordrer (orders)
        ├── Salgsoversigt (salgsoversigt)
        ├── Korttransaktioner (korttransaktioner)
        ├── Rapporter
        │   ├── Dagsrapport (dagsrapport)
        │   ├── Produktrapport (produktrapport)
        │   ├── Z-rapport (zrapport)
        │   ├── Konvertering (konverteringsrapport)
        │   ├── Genbestilling (genbestillingsrapport)
        │   ├── Anmeldelser (anmeldelsesrapport)
        │   └── Heatmap (heatmaprapport)
        ├── Aktivitetslog (activities)
        ├── Restaurant Order Flow (test)
        └── API Adgang
```

## [4] CMS & Builder Tools

### Web Builder
```
├── Branding (wb-branding)
├── Farver (wb-farver)
├── Billeder (wb-billeder)
├── Menu (wb-menu)
├── Åbningstider (wb-timer)
├── Kontakt (wb-kontakt)
├── Levering (wb-levering)
├── Funktioner (wb-funktioner)
├── Sociale Medier (wb-social)
└── Hjemmeside Preview
```

### App Builder
```
├── Design (appbuilder-design)
├── Funktioner (appbuilder-funktioner)
├── Analytics (appbuilder-analytics)
├── Kunder (appbuilder-kunder)
├── Menu (appbuilder-menu)
├── Ordrer (appbuilder-ordrer)
├── Loyalty (appbuilder-loyalty)
└── Push Notifikationer (appbuilder-push-notifikationer)
```

### Stamdata
```
├── Rediger Sider (flow-cms)
├── Blog
└── SEO Indstillinger
```

## [5] Workflows & Automation

```
Workflow
├── SMS Workflow
├── Instagram Workflow
├── Facebook Workflow
└── AI Feedback (via test/flow-editor)
```

## [6] Marketing Tools

```
Marketing
├── Kampagner (campaigns)
├── Udsendelser
├── Kundesegmenter (segments)
└── Loyalty (loyalty)
```

## [7] Lead Management & Rapporter

### Lead Management
```
├── Leads Oversigt (leads)
├── Pipeline (leads-pipeline)
├── Aktiviteter (leads-activities)
└── Rapporter (leads-reports)
```

### Rapporter (Generelt)
```
├── Dagsrapport
├── Produktrapport
├── Z-rapport
├── Konvertering
├── Genbestilling
├── Anmeldelser
└── Heatmap
```

## [8] Indstillinger & Adgang

```
Indstillinger
├── Brugerindstillinger (settings)
│   ├── Mine oplysninger (mine-oplysninger)
│   ├── Adgangskoder
│   └── Notifikationer
├── Roller
├── Sprog
├── Abonnement
├── Bank/Betaling (betaling, betalingsmetoder)
├── Bogholderi (bogholderi)
├── Systemvedligeholdelse
└── Support
```

## [9] Teknisk Dokumentation

```
docs.html
├── Quickstart
├── Guides
├── API Reference
└── FAQ
```

## [10] Test/Utility Sider

```
├── kvittering.html
├── pwa-preview.html
├── test_faktura.html
├── test_notifications.html
├── business-scanner-demo.html
└── OrderFlow-complete.html
```

## [11] App Test (React/TypeScript)

```
App test/
└── src/
    └── admin/
        └── AdminApp.tsx
```

---

**Sidst opdateret:** 2026-02-01
