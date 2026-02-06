# FLOW App - Struktur Oversigt

**Sidst opdateret:** 2026-02-06
**Version:** 3.26.0
**Total antal sider:** 86+

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

## Database Tabeller

### Nye tabeller (v3.12.0)
| Tabel | Beskrivelse |
|-------|-------------|
| `ai_agents` | AI bestillingsagenter til Instagram/Facebook |
| `sms_workflows` | SMS workflow konfigurationer |

### Eksisterende tabeller
| Tabel | Beskrivelse |
|-------|-------------|
| `restaurants` | Restaurant data |
| `builder_configs` | App/Web builder konfigurationer |

---

## Changelog

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
