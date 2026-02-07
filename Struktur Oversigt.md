# FLOW App - Struktur Oversigt

**Sidst opdateret:** 2026-02-07
**Version:** 3.41.0
**Total antal sider:** 90+

---

## Hovedsektioner

### Dashboard & Oversigt
| Side ID | Beskrivelse |
|---------|-------------|
| `page-kunder` | Kundeoversigt |
| `page-orders` | Ordrer |
| `page-activities` | Aktiviteter |
| `page-activity-detail` | Aktivitet detaljer |

### Rapporter
| Side ID | Beskrivelse |
|---------|-------------|
| `page-salgsoversigt` | Salgsoversigt |
| `page-korttransaktioner` | Korttransaktioner |
| `page-dagsrapport` | Dagsrapport |
| `page-produktrapport` | Produktrapport |
| `page-zrapport` | Z-rapport |
| `page-konverteringsrapport` | Konverteringsrapport |
| `page-genbestillingsrapport` | Genbestillingsrapport |
| `page-anmeldelsesrapport` | Anmeldelsesrapport |
| `page-heatmaprapport` | Heatmap rapport |

### Programmer (Flyout)
| Side ID | Beskrivelse |
|---------|-------------|
| `page-instagram-workflow` | Instagram AI Agent (OrderingAgent for DM) |
| `page-facebook-workflow` | Facebook AI Agent (OrderingAgent for Messenger) |
| `page-sms-workflows` | SMS Workflows (Restaurant/Håndværker varianter) |
| `page-search-engine` | Search Engine (SEO-værktøjer og søgemaskine-optimering) |
| `page-workflow-kontrol` | Workflow kontrol |

### Leads & CRM
| Side ID | Beskrivelse |
|---------|-------------|
| `page-alle-kunder` | Alle kunder |
| `page-leads` | Leads |
| `page-leads-pipeline` | Leads pipeline |
| `page-leads-activities` | Leads aktiviteter |
| `page-leads-reports` | Leads rapporter |

### App Builder
| Side ID | Beskrivelse |
|---------|-------------|
| `page-appbuilder-branding` | Branding/Logo |
| `page-appbuilder-design` | Design/Layout |
| `page-appbuilder-farver` | Farveskema |
| `page-appbuilder-billeder` | Billeder |
| `page-appbuilder-funktioner` | Funktioner |
| `page-appbuilder-menu` | Menu |
| `page-appbuilder-timer` | Åbningstider |
| `page-appbuilder-kontakt` | Kontaktoplysninger |
| `page-appbuilder-levering` | Leveringsindstillinger |
| `page-appbuilder-loyalty` | Loyalitetsprogram |
| `page-appbuilder-push-notifikationer` | Push notifikationer |
| `page-appbuilder-ordrer` | Ordrer |
| `page-appbuilder-kunder` | Kunder |
| `page-appbuilder-mobilapp` | Mobil App preview |

### Web Builder
| Side ID | Beskrivelse |
|---------|-------------|
| `page-wb-branding` | Branding |
| `page-wb-farver` | Farver |
| `page-wb-billeder` | Billeder |
| `page-wb-menu` | Menu |
| `page-wb-timer` | Åbningstider |
| `page-wb-kontakt` | Kontakt |
| `page-wb-blog` | Blog |
| `page-wb-levering` | Levering |
| `page-wb-funktioner` | Funktioner |
| `page-wb-social` | Social media |
| `page-template-editor` | Template Editor (tilg\u00e5s via FLOW CMS \u2192 Skabeloner) |

### Analytics
| Side ID | Beskrivelse |
|---------|-------------|
| `page-analytics` | Analytics hovedside |
| `page-analytics-overview` | Analytics oversigt |
| `page-analytics-sales` | Salgsanalyse |
| `page-analytics-products` | Produktanalyse |
| `page-analytics-ai` | AI Analytics |
| `page-analytics-channels` | Kanalanalyse |

### CMS
| Side ID | Beskrivelse |
|---------|-------------|
| `page-flow-cms` | FLOW CMS |
| `flow-cms-content-farver-og-fonts` | Farver & Fonts (CMS tema-indstillinger) |
| `page-landing-cms` | Landing Page CMS |

### Admin Profil (admin/employee)
| Side ID | Beskrivelse |
|---------|-------------|
| `page-admin-profil` | Admin profiloversigt |
| `page-admin-oplysninger` | Admin personlige oplysninger |
| `page-admin-team` | Team oversigt |
| `page-admin-virksomhed` | Virksomhedsinfo |
| `page-admin-sikkerhed` | Sikkerhed (adgangskode, 2FA, sessioner) |
| `page-admin-aktivitet` | Admin aktivitetslog |
| `page-admin-abonnement` | Abonnement og fakturering |

### Kunde Profil (customer/demo)
| Side ID | Beskrivelse |
|---------|-------------|
| `page-kunde-profil` | Kunde profiloversigt |
| `page-kunde-oplysninger` | Kunde personlige oplysninger |
| `page-kunde-ordrer` | Kunde ordrehistorik |
| `page-kunde-betaling` | Kunde betalingsmetoder |
| `page-kunde-adresser` | Kunde leveringsadresser |
| `page-kunde-loyalitet` | Loyalitetsprogram (point, belønninger, tier) |
| `page-kunde-praeferencer` | Præferencer (notifikationer, sprog, kostpræferencer) |

### Indstillinger
| Side ID | Beskrivelse |
|---------|-------------|
| `page-settings` | Indstillinger |
| `page-mine-oplysninger` | Mine oplysninger (legacy) |
| `page-ordrehistorik` | Ordrehistorik (legacy) |
| `page-betalingsmetoder` | Betalingsmetoder (legacy) |
| `page-leveringsadresser` | Leveringsadresser (legacy) |
| `page-bogholderi` | Bogholderi |
| `page-betaling` | Betaling |

### Marketing
| Side ID | Beskrivelse |
|---------|-------------|
| `page-loyalty` | Loyalty program |
| `page-medlemmer` | Medlemmer |
| `page-campaigns` | Kampagner |
| `page-segments` | Segmenter |
| `page-udsendelser` | Udsendelser |

### Andre
| Side ID | Beskrivelse |
|---------|-------------|
| `page-demo-onboarding` | Demo onboarding |
| `page-produktbibliotek` | Produktbibliotek |
| `page-add-restaurant` | Tilføj restaurant |
| `page-docs` | Dokumentation |

---

## Landing Pages (34 sider)

Udvikling i `landing-pages/` → Produktion i `public/landing/`

### Produkt
| Fil | Titel |
|-----|-------|
| `landing.html` | Flow - Restaurant Automation Platform |
| `how-it-works.html` | Sådan virker det |
| `priser.html` | Priser |
| `online-bestilling.html` | Online Bestilling uden Kommission |
| `custom-mobile-app.html` | Custom Mobile App |
| `zero-commission-delivery.html` | Kommissionsfri Levering |
| `loyalitetsprogram.html` | Loyalitetsprogram til Restaurant |

### Guides
| Fil | Titel |
|-----|-------|
| `online-bestillingssystemer.html` | Online Bestillingssystemer Guide |
| `restaurant-hjemmeside.html` | Restaurant Hjemmeside |
| `restaurant-mobile-app.html` | Restaurant Mobile App Guide |
| `restaurant-marketing-guide.html` | Restaurant Marketing Guide 2024 |
| `restaurant-email-marketing.html` | Restaurant Email Marketing Guide |
| `seo-for-restauranter.html` | SEO for Restauranter |

### Workflow
| Fil | Titel |
|-----|-------|
| `automatiseret-marketing.html` | Automatiseret Marketing til Restaurant |
| `facebook-workflow.html` | Facebook Workflow |
| `instagram-workflow.html` | Instagram Workflow |
| `sms-workflow.html` | SMS Workflow til Restaurant |

### Virksomhed
| Fil | Titel |
|-----|-------|
| `case-studies.html` | Case Studies |
| `om-os.html` | Om os |
| `karriere.html` | Karriere |
| `ledelse.html` | Ledelse |
| `presse.html` | Presse |
| `partner.html` | Partner med Flow |

### Blog
| Fil | Titel |
|-----|-------|
| `blog.html` | Blog |
| `blog-post.html` | Blog Post |

### Juridisk
| Fil | Titel |
|-----|-------|
| `privacy.html` | Privatlivspolitik |
| `terms.html` | Vilkår og betingelser |
| `legal.html` | Juridisk |
| `disclaimer.html` | Ansvarsfraskrivelse |
| `cookie-settings.html` | Cookie-indstillinger |
| `platform-terms.html` | Platform Vilkår |
| `restaurant-agreement.html` | Restaurant Aftale |
| `accessibility.html` | Tilgængelighed |

### Support
| Fil | Titel |
|-----|-------|
| `help-center.html` | Flow Hjælp Center |

---

## Web Builder Skabeloner

| Mappe | Navn | Type | Preview |
|-------|------|------|---------|
| `templates/skabelon-1/` | Pizzeria Roma | React/Vite | `dist/index.html` |
| `templates/skabelon-2/` | Feane Restaurant | jQuery/Bootstrap | `index.html` |
| `templates/skabelon-3/` | Pizza Delicious | jQuery/Bootstrap | `index.html` |

Alle skabeloner modtager dynamisk data via `postMessage` fra hovedapplikationen.

### Skabelon Checkout-sider
| Fil | Skabelon | Beskrivelse |
|-----|----------|-------------|
| `templates/skabelon-2/checkout.html` | Feane | 3-trins checkout med Stripe |
| `templates/skabelon-3/checkout.html` | Pizza | 3-trins checkout med Stripe |

### F\u00e6lles Template JS
| Fil | Beskrivelse |
|-----|-------------|
| `js/template-auth.js` | Kundevendt auth (login, signup, g\u00e6stekøb) |
| `js/order-api.js` | Ordre-API (Supabase + Stripe integration) |
| `templates/skabelon-2/js/cart.js` | Feane kurvsystem |
| `templates/skabelon-3/js/cart.js` | Pizza kurvsystem |

## App Builder Skabeloner

| ID | Navn | Preview | Status |
|----|------|---------|--------|
| `app-skabelon-1` | App Skabelon 1 | `demos/app-preview.html` | Aktiv |
| `app-skabelon-2` | App Skabelon 2 | `demos/app-preview-v2.html` | Planlagt |

---

## Database Tabeller

### Nye tabeller (v3.12.0)
| Tabel | Beskrivelse |
|-------|-------------|
| `ai_agents` | AI bestillingsagenter til Instagram/Facebook |
| `sms_workflows` | SMS workflow konfigurationer |

### Nye tabeller (v3.41.0)
| Tabel | Beskrivelse |
|-------|-------------|
| `unified_orders` | Samlede ordrer fra alle kanaler (templates, app, admin) |
| `order_status_history` | Ordrestatus-historik |
| `customers` | Kundedata med stats |

### Eksisterende tabeller
| Tabel | Beskrivelse |
|-------|-------------|
| `restaurants` | Restaurant data |
| `builder_configs` | App/Web builder konfigurationer |

---

## Changelog

### v3.41.0 (2026-02-07)
- Komplet k\u00f8bsflow i alle 3 webskabeloner med Stripe integration
- Nye filer: `order-api.js`, `template-auth.js` (kundevendt), cart.js per skabelon
- Checkout-sider for skabelon-2 (Feane) og skabelon-3 (Pizza)
- Skabelon-1 (React): Stripe Payment Element + Supabase ordrer
- PWA/mobilapp: Checkout-scripts tilf\u00f8jet
- Supabase Edge Function: `create-payment-intent` (Stripe PaymentIntent)
- Ordrer fra templates synkroniseres til admin via Supabase Realtime
- Template Editor flyttet til FLOW CMS \u2192 Skabeloner (fjernet fra Web Builder sidebar)
- Database: `unified_orders`, `customers`, `order_status_history` tabeller

### v3.14.0 (2026-02-06)
- Tilføjet API Integration sektion til Instagram/Facebook workflow sider
- SMS Workflows viser nu de 2 indbyggede varianter (Restaurant v1.2.0, Håndværker v1.1.0)
- Fjernet "Se Samtaler" link (erstattet med "Se API Logs")
- Tilføjet webhook URL og API key visning til workflow sider

### v3.13.0 (2026-02-05)
- Erstattet `page-ai-agents` med dedikerede workflow sider
- Tilføjet `page-instagram-workflow` - Instagram OrderingAgent med ML statistik
- Tilføjet `page-facebook-workflow` - Facebook OrderingAgent med ML statistik
- Tilføjet version info til OrderingAgent (v1.0.0)
- Opdateret flyout navigation

### v3.12.0 (2026-02-05)
- Tilføjet `page-sms-workflows` - SMS Workflows management
- Tilføjet database migration for `ai_agents` og `sms_workflows`
- Opdateret flyout panel med nye navigationslinks
