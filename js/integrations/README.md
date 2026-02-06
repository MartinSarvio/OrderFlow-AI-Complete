# Accounting Integrations Module

Integration med danske regnskabssystemer for OrderFlow.

## Understøttede Systemer

| System | Status | Version |
|--------|--------|---------|
| e-conomic | ✅ Tilgængelig | 1.0.0 |
| Dinero | 🔜 Planlagt | Q1 2026 |
| Billy | 🔜 Planlagt | Q2 2026 |
| Visma.net | 🔜 Planlagt | Q3 2026 |

## Hurtig Start

### e-conomic Integration

```javascript
import { EconomicConnector } from './integrations/connectors/economic/index.js';

// Opret connector med API tokens
const connector = new EconomicConnector({
  appSecretToken: 'din-app-secret-token',
  agreementGrantToken: 'din-agreement-grant-token'
});

// Forbind til e-conomic
await connector.connect();

// Test forbindelsen
const test = await connector.testConnection();
console.log(test.company.name);

// Hent kunder
const { data: customers } = await connector.listCustomers();

// Opret kunde
const result = await connector.createCustomer({
  name: 'Ny Restaurant',
  cvr: '12345678',
  email: 'info@restaurant.dk',
  address: {
    street: 'Hovedgaden 1',
    city: 'København',
    postalCode: '1000'
  }
});

// Opret faktura
const invoice = await connector.createInvoice({
  invoiceDate: '2026-02-05',
  lines: [
    { description: 'Burger', quantity: 2, unitPrice: 89 },
    { description: 'Øl', quantity: 2, unitPrice: 45 }
  ]
}, { customerNumber: result.externalId });

// Book fakturaen
const booked = await connector.bookInvoice(invoice.externalId);
console.log(`Faktura nummer: ${booked.invoiceNumber}`);
```

### Synkronisering

```javascript
import { SyncEngine, MemoryStorage } from './integrations/core/sync-engine.js';

const engine = new SyncEngine({
  connector,
  storage: new MemoryStorage()
});

// Kør fuld sync
const job = await engine.runSync({
  companyId: 'company-uuid',
  entityTypes: ['customer', 'invoice', 'payment'],
  direction: 'pull'
});

console.log(`Synket: ${job.recordsSucceeded} records`);
```

## Arkitektur

```
js/integrations/
├── core/
│   ├── connector.js       # Base connector klasse
│   ├── canonical-model.js # Kanonisk datamodel
│   └── sync-engine.js     # Synkroniseringsmotor
├── connectors/
│   └── economic/
│       ├── index.js       # e-conomic connector
│       └── mappers.js     # Data transformation
└── index.js               # Hovedeksport
```

## Kanonisk Datamodel

Alle data transformeres til et fælles format:

- **Customer** - Kunde med CVR, adresse, kontaktinfo
- **Product** - Produkt med pris, moms, enhed
- **Invoice** - Faktura med linjer, moms, beløb
- **Payment** - Betaling med allokering til fakturaer
- **Account** - Konto i kontoplan
- **VatCode** - Momskode

## API Rate Limits

| System | Grænse |
|--------|--------|
| e-conomic | ~300 req/min |
| Dinero | ~60 req/min |
| Billy | ~60 req/min |

Connectoren håndterer automatisk rate limiting med eksponentiel backoff.

## Fejlhåndtering

```javascript
try {
  await connector.createCustomer(data);
} catch (error) {
  if (error.status === 400) {
    // Valideringsfejl
    console.log(error.data);
  } else if (error.status === 429) {
    // Rate limited - automatisk retry
  } else if (error.retryable) {
    // Kan prøves igen
  }
}
```

## Tests

```bash
node --experimental-vm-modules tests/integrations/economic.test.js
```

## Dokumentation

Se [INTEGRATION_ARCHITECTURE_ACCOUNTING.md](../../docs/INTEGRATION_ARCHITECTURE_ACCOUNTING.md) for fuld teknisk dokumentation.

## Compliance

- ✅ Bogføringsloven 2026 (5 års opbevaring)
- ✅ GDPR (Ret til indsigt/sletning)
- ✅ Dansk moms (25%, 0%, EU)
