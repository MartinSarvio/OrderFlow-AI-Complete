# Integrationsarkitektur: Regnskabssystemer
**Version:** 1.0
**Dato:** 2026-02-05
**Forfatter:** Integrationsarkitekt

---

## 1. ANTAGELSER OG AFGRÆNSNING

### 1.1 Antagelser om produkt og kundetyper

| Dimension | Antagelse |
|-----------|-----------|
| **Produkt** | OrderFlow - Restaurant/SMB SaaS platform med ordrer, fakturering, betalinger |
| **Primære kunder** | Restauranter, takeaway, små detailhandlere (1-50 ansatte) |
| **Sekundære kunder** | Revisorer der servicerer ovenstående |
| **Typisk datavolumen** | 50-500 transaktioner/måned per kunde |
| **Peak volumen** | Op til 2.000 transaktioner/måned for større kæder |
| **Antal samtidige kunder** | Design til 10.000 aktive integrationer |

### 1.2 Afgrænsninger

| Ikke inkluderet | Begrundelse |
|-----------------|-------------|
| Lønsystemer | Separat integrationsspor |
| Lagerstyring (avanceret) | Kun basis inventory sync |
| Koncernregnskab | Out of scope for SMB |
| Udenlandsk moms (OSS) | Phase 2 |

### 1.3 Manglende information og håndtering

| Mangler | Håndtering |
|---------|------------|
| Præcis kundekontoplan | Dynamisk mapping ved onboarding |
| Momskoder per kunde | Standardmapping + override |
| Eksisterende data-format | Import wizard med preview |

---

## 2. FÆLLES KANONISK DATAMODEL

### 2.1 Core Entities

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CANONICAL MODEL                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────┐     ┌─────────┐     ┌─────────────┐                   │
│  │ Company │────▶│  User   │     │  Settings   │                   │
│  └────┬────┘     └─────────┘     └─────────────┘                   │
│       │                                                              │
│       ├──────────────────────────────────────────┐                  │
│       │                                          │                  │
│       ▼                                          ▼                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌─────────┐           │
│  │ Customer │  │ Supplier │  │  Product  │  │ Account │           │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └────┬────┘           │
│       │             │              │             │                  │
│       └─────────────┴──────────────┴─────────────┘                  │
│                            │                                         │
│                            ▼                                         │
│  ┌─────────┐  ┌───────────┐  ┌─────────┐  ┌──────────────┐        │
│  │ Invoice │  │CreditNote │  │ Payment │  │ JournalEntry │        │
│  └────┬────┘  └─────┬─────┘  └────┬────┘  └──────┬───────┘        │
│       │             │             │              │                  │
│       └─────────────┴─────────────┴──────────────┘                  │
│                            │                                         │
│                            ▼                                         │
│  ┌────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │ Attachment │  │ AuditEvent  │  │   SyncJob   │                  │
│  └────────────┘  └─────────────┘  └─────────────┘                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Entity Definitions

#### Company
```json
{
  "id": "uuid",
  "externalIds": {
    "economic": "string|null",
    "dinero": "string|null",
    "billy": "string|null",
    "visma": "string|null"
  },
  "name": "string",
  "cvr": "string(8)",
  "vatNumber": "string|null",
  "address": {
    "street": "string",
    "city": "string",
    "postalCode": "string",
    "country": "DK"
  },
  "email": "string",
  "phone": "string|null",
  "bankAccount": {
    "regNo": "string(4)",
    "accountNo": "string(10)",
    "iban": "string|null"
  },
  "fiscalYearStart": "MM-DD",
  "baseCurrency": "DKK",
  "vatPeriod": "monthly|quarterly",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

#### Customer / Supplier
```json
{
  "id": "uuid",
  "companyId": "uuid",
  "externalIds": { /* per system */ },
  "type": "customer|supplier",
  "name": "string",
  "cvr": "string|null",
  "vatNumber": "string|null",
  "email": "string|null",
  "phone": "string|null",
  "address": { /* same as Company */ },
  "paymentTermsDays": "integer",
  "defaultAccountId": "uuid|null",
  "defaultVatCodeId": "uuid|null",
  "currency": "DKK",
  "isActive": "boolean",
  "gdprConsent": {
    "marketing": "boolean",
    "consentDate": "ISO8601|null"
  },
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

#### ChartOfAccounts (Account)
```json
{
  "id": "uuid",
  "companyId": "uuid",
  "externalIds": { /* per system */ },
  "accountNumber": "string",
  "name": "string",
  "accountType": "asset|liability|equity|revenue|expense",
  "vatCodeId": "uuid|null",
  "isSystemAccount": "boolean",
  "isBankAccount": "boolean",
  "isActive": "boolean",
  "balance": "decimal|null",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

#### VATCode
```json
{
  "id": "uuid",
  "companyId": "uuid",
  "externalIds": { /* per system */ },
  "code": "string",
  "name": "string",
  "rate": "decimal",
  "vatType": "sales|purchase|eu_goods|eu_services|reverse_charge|exempt|zero",
  "accountId": "uuid",
  "isDefault": "boolean",
  "isActive": "boolean"
}
```

#### Product
```json
{
  "id": "uuid",
  "companyId": "uuid",
  "externalIds": { /* per system */ },
  "productNumber": "string",
  "name": "string",
  "description": "string|null",
  "unit": "string",
  "salesPrice": "decimal",
  "costPrice": "decimal|null",
  "vatCodeId": "uuid",
  "revenueAccountId": "uuid",
  "inventoryEnabled": "boolean",
  "stockQuantity": "decimal|null",
  "isActive": "boolean",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

#### Invoice
```json
{
  "id": "uuid",
  "companyId": "uuid",
  "externalIds": { /* per system */ },
  "invoiceNumber": "string",
  "type": "invoice|credit_note",
  "status": "draft|sent|paid|overdue|cancelled|voided",
  "customerId": "uuid",
  "customerName": "string",
  "customerAddress": { /* snapshot */ },
  "customerVatNumber": "string|null",
  "invoiceDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "currency": "DKK",
  "exchangeRate": "decimal",
  "lines": [
    {
      "lineNumber": "integer",
      "productId": "uuid|null",
      "description": "string",
      "quantity": "decimal",
      "unitPrice": "decimal",
      "discountPercent": "decimal",
      "vatCodeId": "uuid",
      "vatRate": "decimal",
      "accountId": "uuid",
      "lineTotal": "decimal",
      "lineTotalIncVat": "decimal"
    }
  ],
  "subtotal": "decimal",
  "vatAmount": "decimal",
  "total": "decimal",
  "amountDue": "decimal",
  "paidAmount": "decimal",
  "paymentTermsDays": "integer",
  "reference": "string|null",
  "notes": "string|null",
  "attachments": ["uuid"],
  "bookedAt": "ISO8601|null",
  "journalEntryId": "uuid|null",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

#### Payment
```json
{
  "id": "uuid",
  "companyId": "uuid",
  "externalIds": { /* per system */ },
  "paymentNumber": "string|null",
  "type": "incoming|outgoing",
  "status": "pending|completed|failed|refunded",
  "amount": "decimal",
  "currency": "DKK",
  "exchangeRate": "decimal",
  "paymentDate": "YYYY-MM-DD",
  "paymentMethod": "bank_transfer|card|cash|mobilepay|other",
  "bankAccountId": "uuid|null",
  "bankReference": "string|null",
  "allocations": [
    {
      "invoiceId": "uuid",
      "amount": "decimal"
    }
  ],
  "journalEntryId": "uuid|null",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

#### JournalEntry
```json
{
  "id": "uuid",
  "companyId": "uuid",
  "externalIds": { /* per system */ },
  "entryNumber": "string",
  "journalId": "uuid|null",
  "entryDate": "YYYY-MM-DD",
  "postingDate": "YYYY-MM-DD",
  "description": "string",
  "sourceType": "invoice|payment|manual|bank|adjustment",
  "sourceId": "uuid|null",
  "lines": [
    {
      "lineNumber": "integer",
      "accountId": "uuid",
      "debit": "decimal",
      "credit": "decimal",
      "vatCodeId": "uuid|null",
      "vatAmount": "decimal|null",
      "description": "string|null",
      "customerId": "uuid|null",
      "supplierId": "uuid|null"
    }
  ],
  "totalDebit": "decimal",
  "totalCredit": "decimal",
  "isBalanced": "boolean",
  "isLocked": "boolean",
  "attachments": ["uuid"],
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

#### Attachment / Voucher
```json
{
  "id": "uuid",
  "companyId": "uuid",
  "externalIds": { /* per system */ },
  "fileName": "string",
  "mimeType": "string",
  "fileSize": "integer",
  "storageUrl": "string",
  "storageProvider": "s3|azure|gcs",
  "checksum": "string",
  "sourceType": "invoice|expense|receipt|bank_statement|other",
  "sourceId": "uuid|null",
  "uploadedBy": "uuid",
  "ocrProcessed": "boolean",
  "ocrData": "json|null",
  "retentionUntil": "YYYY-MM-DD",
  "createdAt": "ISO8601"
}
```

#### AuditEvent
```json
{
  "id": "uuid",
  "companyId": "uuid",
  "timestamp": "ISO8601",
  "eventType": "create|update|delete|sync|export|login|permission_change",
  "entityType": "string",
  "entityId": "uuid",
  "userId": "uuid|null",
  "systemActor": "string|null",
  "ipAddress": "string|null",
  "userAgent": "string|null",
  "previousState": "json|null",
  "newState": "json|null",
  "changeSet": "json|null",
  "metadata": "json|null"
}
```

#### SyncJob
```json
{
  "id": "uuid",
  "companyId": "uuid",
  "connectorType": "economic|dinero|billy|visma",
  "direction": "push|pull|bidirectional",
  "entityTypes": ["string"],
  "status": "pending|running|completed|failed|partial",
  "startedAt": "ISO8601",
  "completedAt": "ISO8601|null",
  "recordsProcessed": "integer",
  "recordsSucceeded": "integer",
  "recordsFailed": "integer",
  "errors": [
    {
      "entityType": "string",
      "entityId": "uuid",
      "errorCode": "string",
      "errorMessage": "string",
      "retryable": "boolean"
    }
  ],
  "triggeredBy": "schedule|manual|webhook|system",
  "metadata": "json|null"
}
```

---

## 3. DATA MAPPING OG REGLER

### 3.1 e-conomic Mapping

**Kilde:** [e-conomic REST API Documentation](https://restdocs.e-conomic.com/)

#### Entity Mapping

| Canonical | e-conomic Endpoint | e-conomic Field | Notes |
|-----------|-------------------|-----------------|-------|
| Company | `/self` | agreementNumber, company | Read-only |
| Customer | `/customers` | customerNumber, name, address, vatNumber | |
| Supplier | `/suppliers` | supplierNumber, name, address | |
| Account | `/accounts` | accountNumber, name, accountType | |
| VATCode | `/vat-zones`, `/vat-accounts` | vatCode, ratePercentage | Kompleks mapping |
| Product | `/products` | productNumber, name, salesPrice | |
| Invoice | `/invoices/drafts`, `/invoices/booked` | draftInvoiceNumber, bookedInvoiceNumber | Draft → Booked flow |
| Payment | `/customer-payments` | customerPaymentNumber | |
| JournalEntry | `/journals/{id}/vouchers` | voucherNumber | |
| Attachment | `/documents` | - | Separat API |

#### Momslogik

| Canonical VAT Type | e-conomic VATZone | e-conomic VATAccount |
|-------------------|-------------------|----------------------|
| sales (25%) | Domestic | Standard moms udgående |
| sales (0%) | Domestic | Momsfri |
| eu_goods | EU | EU-salg varer |
| eu_services | EU | EU-salg ydelser |
| reverse_charge | Abroad | Omvendt betalingspligt |

#### Idempotency

```
Strategi: External ID mapping
- Ved CREATE: Check om externalIds.economic findes
- Ved UPDATE: Brug ETag header for optimistic locking
- Dubletter: Match på customerNumber/invoiceNumber + companyId
```

#### Konfliktløsning (Tovejs)

| Scenarie | Strategi |
|----------|----------|
| Samme felt ændret begge steder | Regnskabssystem vinder (source of truth) |
| Ny record begge steder | Merge med conflict flag til review |
| Slettet i ét system | Soft delete, marker som inactive |

### 3.2 Dinero Mapping

**Kilde:** [Dinero API Documentation](https://api.dinero.dk/)

#### Entity Mapping

| Canonical | Dinero Endpoint | Dinero Field | Notes |
|-----------|----------------|--------------|-------|
| Company | `/organizations/{id}` | organizationId | Via OAuth |
| Customer | `/contacts` | contactGuid, isPerson=false | |
| Supplier | `/contacts` | contactGuid, isSupplier=true | Samme endpoint |
| Account | `/accounts` | accountNumber, name | |
| VATCode | `/ledgeritems/voucher/salestax` | - | Hardcoded standard |
| Product | `/products` | productGuid, name, unit | |
| Invoice | `/invoices` | guid, number | |
| Payment | Ikke direkte API | - | Via bank integration |
| JournalEntry | `/vouchers` | voucherGuid | |
| Attachment | `/files` | fileGuid | |

#### Momslogik

Dinero bruger forenklede momskoder:

| Canonical | Dinero | Rate |
|-----------|--------|------|
| sales (25%) | VatRate25 | 25% |
| sales (0%) | VatRateZero | 0% |
| exempt | VatRateExempt | 0% |

#### Idempotency

```
Strategi: GUID-baseret
- Dinero genererer GUIDs
- Gem mapping: canonical.id ↔ dinero.guid
- Check eksistens før create via GET /contacts?search=
```

### 3.3 Billy Mapping

**Kilde:** [Billy API v2 Documentation](https://www.billy.dk/api/)

#### Entity Mapping

| Canonical | Billy Endpoint | Billy Field | Notes |
|-----------|---------------|-------------|-------|
| Company | `/organizations/{id}` | id | |
| Customer | `/contacts` | id, type=company/person | |
| Supplier | `/contacts` | id, isSupplier=true | |
| Account | `/accounts` | id, accountNo | |
| VATCode | `/salesTaxes` | id, rate | |
| Product | `/products` | id, productNo | |
| Invoice | `/invoices` | id, invoiceNo | |
| Payment | `/bankPayments` | id | |
| JournalEntry | `/daybookTransactions` | id | |
| Attachment | `/files` | id | |

#### Momslogik

| Canonical | Billy salesTaxId | Rate |
|-----------|-----------------|------|
| sales (25%) | Standard 25% | 25% |
| sales (0%) | Momsfri | 0% |
| eu_goods | EU-salg varer | 0% |

#### Idempotency

```
Strategi: Custom ID via meta
- Billy tillader custom attributes
- Gem canonical.id i meta.externalId
- Query: GET /invoices?meta.externalId={id}
```

### 3.4 Visma Mapping

**Kilde:** [Visma.net Integrations Documentation](https://integration.visma.net/API-index/)

#### Relevante Visma Produkter

| Produkt | Målgruppe | API | Relevans |
|---------|-----------|-----|----------|
| Visma e-conomic | SMB DK | REST | ✅ Primær (se 3.1) |
| Visma Dinero | Micro DK | REST | ✅ Primær (se 3.2) |
| Visma.net ERP | Mid-market | REST + SOAP | ⚠️ Sekundær |
| Visma Business | SMB NO/SE | REST | ❌ Ikke DK |
| Visma Spcs | Micro NO/SE | Limited | ❌ Ikke DK |

#### Visma.net ERP Mapping (Sekundær)

| Canonical | Visma.net Endpoint | Notes |
|-----------|-------------------|-------|
| Customer | `/controller/api/v1/customer` | |
| Invoice | `/controller/api/v1/salesorder` | Ordre → Faktura flow |
| JournalEntry | `/controller/api/v1/journaltransaction` | |

---

## 4. INTEGRATIONSNIVEAUER

### 4.1 Version Matrix

| Version | Navn | Kompleksitet | Tid | Pris-tier |
|---------|------|--------------|-----|-----------|
| V1 | Read & Export | Lav | 2-4 uger | Basis |
| V2 | One-way Sync | Medium | 4-8 uger | Standard |
| V3 | Two-way Sync | Høj | 8-12 uger | Professional |
| V4 | Real-time | Meget høj | 12-16 uger | Enterprise |

### 4.2 V1: Read & Export

#### Features
- Læs stamdata (kunder, leverandører, produkter, kontoplan)
- Eksporter fakturaer som CSV/PDF
- Manuel import af fakturaer via fil-upload
- Basis reconciliation rapport

#### Begrænsninger
- Ingen automatisk sync
- Ingen bilag/attachments
- Ingen betalingsstatus
- Manuel trigger

#### Kundens opsætning
- API-nøgle eller OAuth grant
- Valg af kontoplan mapping
- Test-eksport før go-live

#### Tidsestimat per connector

| Fase | Varighed |
|------|----------|
| Analyse | 3 dage |
| Build | 5 dage |
| Test | 3 dage |
| Pilot | 3 dage |
| **Total** | **14 dage** |

#### Risici
- API rate limits ved store eksporter
- Mapping-fejl ved afvigende kontoplaner

### 4.3 V2: One-way Sync

#### Features
Alt fra V1, plus:
- Automatisk daglig sync (pull stamdata, push fakturaer)
- Scheduler med konfigurerbar tid
- Error notifications
- Retry logic

#### Begrænsninger
- Kun push af nye fakturaer
- Ingen opdatering af eksisterende
- Ingen betalingsstatus

#### Kundens opsætning
- Samme som V1
- Vælg sync-tidspunkt
- Konfigurer email-notifikationer

#### Tidsestimat per connector

| Fase | Varighed |
|------|----------|
| Analyse | 5 dage |
| Build | 10 dage |
| Test | 5 dage |
| Pilot | 5 dage |
| **Total** | **25 dage** |

#### Risici
- Drift af scheduler
- Håndtering af locked periods

### 4.4 V3: Two-way Sync

#### Features
Alt fra V2, plus:
- Tovejs sync af stamdata
- Betalingsstatus sync
- Bilag/attachments sync
- Konfliktdetektion og -løsning
- Detaljeret audit trail

#### Begrænsninger
- Ikke real-time (batch hver time)
- Manuel godkendelse ved konflikter

#### Kundens opsætning
- Samme som V2
- Vælg conflict resolution strategy
- Konfigurer hvilke entities der synces

#### Tidsestimat per connector

| Fase | Varighed |
|------|----------|
| Analyse | 8 dage |
| Build | 20 dage |
| Test | 10 dage |
| Pilot | 7 dage |
| **Total** | **45 dage** |

#### Risici
- Kompleks konfliktløsning
- Data integrity ved fejl
- Større testomfang

### 4.5 V4: Real-time

#### Features
Alt fra V3, plus:
- Webhook-baseret real-time sync
- Automatisk bank afstemning
- AI-assisteret kontering
- Dashboard med live status

#### Begrænsninger
- Kræver webhook support fra regnskabssystem
- Højere infrastruktur-krav

#### Kundens opsætning
- Samme som V3
- Webhook URL registrering
- Bank-integration setup

#### Tidsestimat per connector

| Fase | Varighed |
|------|----------|
| Analyse | 10 dage |
| Build | 30 dage |
| Test | 15 dage |
| Pilot | 10 dage |
| **Total** | **65 dage** |

#### Risici
- Webhook reliability
- Event ordering
- Højere driftskompleksitet

---

## 5. API STRATEGI PER SYSTEM

### 5.1 e-conomic

| Aspekt | Detaljer |
|--------|----------|
| **Auth** | X-AppSecretToken + X-AgreementGrantToken headers |
| **OAuth** | Ja, via Visma Connect for partner apps |
| **Base URL** | `https://restapi.e-conomic.com` |
| **Rate Limit** | ~300 requests/min (verificér i docs) |
| **Pagination** | `?pagesize=1000&skipPages=N`, max 1000 per page |
| **Webhooks** | Ja, for de fleste entiteter |
| **Sandbox** | Ja, demo-aftaler tilgængelige |

#### Vigtige Endpoints

```
GET  /customers
POST /customers
GET  /customers/{customerNumber}
PUT  /customers/{customerNumber}

GET  /invoices/drafts
POST /invoices/drafts
POST /invoices/drafts/{draftInvoiceNumber}/book
GET  /invoices/booked

GET  /accounts
GET  /journals/{journalNumber}/vouchers
POST /journals/{journalNumber}/vouchers
```

#### Kendte Faldgruber

| Problem | Løsning |
|---------|---------|
| Draft vs Booked invoices | Altid book draft efter create |
| Moms på linjerniveau | Brug vatAccount, ikke vatRate direkte |
| Låste perioder | Check `closedForInvoices` før booking |
| Afrunding | e-conomic runder selv - match ikke manuelt |
| Kreditnota | Opret som negativ faktura, ikke separat type |

### 5.2 Dinero

| Aspekt | Detaljer |
|--------|----------|
| **Auth** | OAuth 2.0 via Visma Connect ELLER API-key for personal |
| **Base URL** | `https://api.dinero.dk/v1` |
| **Rate Limit** | Ikke dokumenteret - konservativt 60/min |
| **Pagination** | `?page=N&pageSize=100` |
| **Webhooks** | Begrænset support |
| **Sandbox** | Test-organization via signup |

#### Vigtige Endpoints

```
GET  /organizations/{orgId}
GET  /contacts
POST /contacts
GET  /invoices
POST /invoices
POST /invoices/{guid}/book
GET  /vouchers
POST /vouchers
```

#### Kendte Faldgruber

| Problem | Løsning |
|---------|---------|
| Ingen webhook | Poll hver 15 min |
| Contact = Customer+Supplier | Brug `isSupplier` flag |
| Begrænsede momskoder | Map til de 3 standard |
| Manglende payment API | Synk via banktransaktioner |

### 5.3 Billy

| Aspekt | Detaljer |
|--------|----------|
| **Auth** | Bearer token (access token fra UI) |
| **Base URL** | `https://api.billysbilling.com/v2` |
| **Rate Limit** | ~60 requests/min |
| **Pagination** | `?page=N&pageSize=100` |
| **Webhooks** | Nej |
| **Sandbox** | Test-organization |

#### Vigtige Endpoints

```
GET  /organizations/{orgId}
GET  /contacts
POST /contacts
GET  /invoices
POST /invoices
GET  /accounts
GET  /salesTaxes
POST /daybookTransactions
```

#### Kendte Faldgruber

| Problem | Løsning |
|---------|---------|
| Ingen webhooks | Poll-baseret |
| Token udløb | UI-genereret, ikke refresh flow |
| Begrænsede filtre | Client-side filtering |
| Daybook vs Journal | Brug daybookTransactions for posteringer |

### 5.4 Visma.net ERP

| Aspekt | Detaljer |
|--------|----------|
| **Auth** | OAuth 2.0 via Visma Connect |
| **Base URL** | `https://integration.visma.net/API` |
| **Rate Limit** | Per tenant, dokumenteret |
| **Pagination** | Standard REST |
| **Webhooks** | Ja, comprehensive |
| **Sandbox** | Demo tenants |

#### Kendte Faldgruber

| Problem | Løsning |
|---------|---------|
| Kompleks datamodel | Brug v2 endpoints hvor muligt |
| Mange entiteter | Start med Customer, Invoice, GL |
| ERP-logik | Ordre → Faktura flow, ikke direkte faktura |

---

## 6. FEJLHÅNDTERING OG DRIFT

### 6.1 Retry Strategi

```
┌─────────────────────────────────────────────────────────────┐
│                    RETRY FLOW                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Request → [Success?] ──Yes──▶ Done                        │
│                │                                             │
│               No                                             │
│                │                                             │
│                ▼                                             │
│   [Retryable?] ──No──▶ Dead Letter Queue → Alert            │
│        │                                                     │
│       Yes                                                    │
│        │                                                     │
│        ▼                                                     │
│   Exponential Backoff:                                       │
│   Attempt 1: Wait 1s                                         │
│   Attempt 2: Wait 2s                                         │
│   Attempt 3: Wait 4s                                         │
│   Attempt 4: Wait 8s                                         │
│   Attempt 5: Wait 16s                                        │
│        │                                                     │
│        ▼                                                     │
│   [Max retries?] ──Yes──▶ Dead Letter Queue → Alert         │
│        │                                                     │
│       No                                                     │
│        │                                                     │
│        ▼                                                     │
│   Retry Request                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Retryable Errors

| HTTP Status | Retry | Reason |
|-------------|-------|--------|
| 429 | Ja | Rate limited |
| 500 | Ja | Server error |
| 502 | Ja | Gateway error |
| 503 | Ja | Service unavailable |
| 504 | Ja | Timeout |
| 400 | Nej | Bad request |
| 401 | Nej* | Auth error (*refresh token first) |
| 403 | Nej | Forbidden |
| 404 | Nej | Not found |
| 409 | Nej | Conflict |
| 422 | Nej | Validation error |

### 6.2 Dead Letter Queue

```json
{
  "id": "uuid",
  "queuedAt": "ISO8601",
  "originalRequest": {
    "method": "POST",
    "url": "string",
    "headers": {},
    "body": {}
  },
  "attempts": [
    {
      "attemptedAt": "ISO8601",
      "statusCode": 500,
      "response": {}
    }
  ],
  "errorCategory": "validation|auth|rate_limit|server|network",
  "entityType": "invoice",
  "entityId": "uuid",
  "companyId": "uuid",
  "connectorType": "economic",
  "status": "pending|resolved|abandoned",
  "resolvedAt": "ISO8601|null",
  "resolvedBy": "uuid|null",
  "resolution": "retried|skipped|manual_fix"
}
```

### 6.3 Observability

#### Metrics

| Metric | Type | Labels |
|--------|------|--------|
| `sync_jobs_total` | Counter | connector, status, direction |
| `sync_records_total` | Counter | connector, entity, status |
| `sync_duration_seconds` | Histogram | connector, entity |
| `api_requests_total` | Counter | connector, endpoint, status |
| `api_latency_seconds` | Histogram | connector, endpoint |
| `dlq_size` | Gauge | connector, error_category |

#### Logs

```json
{
  "timestamp": "ISO8601",
  "level": "info|warn|error",
  "service": "integration-worker",
  "connector": "economic",
  "companyId": "uuid",
  "syncJobId": "uuid",
  "entityType": "invoice",
  "entityId": "uuid",
  "action": "create|update|delete",
  "duration_ms": 123,
  "external_id": "string",
  "message": "string",
  "error": {
    "code": "string",
    "message": "string",
    "stack": "string"
  }
}
```

#### Tracing

- OpenTelemetry integration
- Span per API request
- Trace ID propageret gennem hele flow
- Sampling: 10% normal, 100% ved fejl

### 6.4 Manuel Reparation

#### Reprocess Flow

1. Find fejlede records i DLQ
2. Inspicer fejlbesked og previous attempts
3. Fix data hvis validationsfejl
4. Trigger reprocess via admin UI
5. Verificer success

#### Replay Flow

1. Identificér periode der skal replays
2. Mark existing records som "pending_replay"
3. Trigger full sync for periode
4. Compare og merge

### 6.5 Reconciliation Reports

| Report | Frekvens | Indhold |
|--------|----------|---------|
| Daily Sync Summary | Daglig | Records synced, failed, skipped |
| Weekly Reconciliation | Ugentlig | Total per entity, discrepancies |
| Monthly Audit | Månedlig | Full comparison, drift detection |

---

## 7. SIKKERHED OG COMPLIANCE

### 7.1 Danske Lovkrav 2026

**Primær kilde:** [Erhvervsstyrelsen - Bogføringsloven](https://erhvervsstyrelsen.dk/vejledning-bogfoeringsloven)

#### Digitale Bogføringskrav

| Krav | Implementation |
|------|----------------|
| Løbende registrering | Real-time posting til journal |
| Dokumentation for hver registrering | Attachment link påkrævet |
| Sikker opbevaring 5 år | Cloud storage med retention policy |
| Backup hos tredjepart | Geo-redundant storage |
| Gendannelse i maskinlæsbart format | Export til SAF-T/CSV |
| Ændringslog | Immutable audit trail |

#### Sporbarhedskrav (Transaction + Control Trail)

| Trail Type | Krav | Implementation |
|------------|------|----------------|
| Transaction Trail | Fra bilag til årsrapport | Link chain: Attachment → Entry → Account → Report |
| Control Trail | Fra årsrapport til bilag | Reverse lookup via entryId |

#### Opbevaringsperioder

| Materiale | Periode | Handling ved udløb |
|-----------|---------|-------------------|
| Bogføringsbilag | 5 år + indeværende | Auto-archive, manual delete |
| Registreringer | 5 år + indeværende | Soft delete, anonymisering |
| Årsrapporter | 5 år + indeværende | Permanent archive |
| Persondata uden lovkrav | GDPR retention | Auto-delete efter formål |

### 7.2 GDPR Implementation

**Kilde:** [Datatilsynet vejledning](https://www.datatilsynet.dk/)

#### Data Categories

| Kategori | Eksempler | Retention | Sletning |
|----------|-----------|-----------|----------|
| Kontaktoplysninger | Navn, email, telefon | 5 år efter sidste transaktion | Anonymisering |
| Finansielle data | Fakturaer, betalinger | 5 år (bogføringsloven) | Arkivering |
| Transaktionshistorik | Ordrer, logs | 5 år | Aggregering |
| Samtykkedata | Marketing consent | Indtil tilbagekaldt | Fuld sletning |

#### GDPR Flows

```
Ret til indsigt (Art. 15):
1. Modtag anmodning
2. Verificér identitet
3. Generer dataudtræk (max 30 dage)
4. Levér i maskinlæsbart format

Ret til sletning (Art. 17):
1. Modtag anmodning
2. Check lovkrav (bogføringsloven > GDPR)
3. Slet hvor muligt
4. Anonymisér hvor lovkrav
5. Dokumentér handling

Dataportabilitet (Art. 20):
1. Modtag anmodning
2. Eksporter til JSON/CSV
3. Levér inden 30 dage
```

### 7.3 Access Control

#### Principle of Least Privilege

| Rolle | Rettigheder |
|-------|-------------|
| Integration Service | Read/Write kun egne sync-data |
| Admin | Full access med audit |
| Support | Read-only + limited write |
| Customer | Egen data only |

#### API Token Scopes

```
integration:read     - Læs stamdata
integration:write    - Skriv fakturaer
integration:admin    - Konfigurer integration
audit:read           - Læs audit logs
export:execute       - Kør data export
```

### 7.4 Kryptering

| Data State | Method | Key Management |
|------------|--------|----------------|
| In Transit | TLS 1.3 | Managed certificates |
| At Rest | AES-256 | AWS KMS / Azure Key Vault |
| Backups | AES-256 | Separate key per tenant |
| Logs | AES-256 | Centralized key |

### 7.5 Audit Trail Design

#### Immutability

```sql
CREATE TABLE audit_events (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID,
  system_actor VARCHAR(100),
  ip_address INET,
  previous_state JSONB,
  new_state JSONB,
  change_set JSONB,
  checksum VARCHAR(64) NOT NULL, -- SHA-256
  previous_checksum VARCHAR(64), -- Chain

  CONSTRAINT no_update CHECK (false) -- Prevent updates
);

-- Append-only: No UPDATE or DELETE allowed
-- Retention: Separate partition per month, archive after 5 years
```

#### Checksum Chain

```
checksum[n] = SHA256(
  entity_id +
  timestamp +
  event_type +
  change_set +
  checksum[n-1]
)
```

### 7.6 Compliance Dokumentation

| Dokument | Indhold | Modtager |
|----------|---------|----------|
| SOC 2 Type II | Security controls | Kunder, revisorer |
| GDPR DPA | Databehandleraftale | Kunder |
| Processing Records | Art. 30 register | Datatilsynet |
| Retention Schedule | Opbevaringsoversigt | Intern + kunder |
| Incident Response Plan | Breach procedure | Intern |

---

## 8. TESTPLAN

### 8.1 Contract Tests

```gherkin
Feature: e-conomic Customer Sync

Scenario: Create customer succeeds
  Given a valid customer payload
  When I POST to /customers
  Then the response status should be 201
  And the response should contain customerNumber

Scenario: Create customer with invalid VAT fails
  Given a customer payload with invalid vatNumber
  When I POST to /customers
  Then the response status should be 400
  And the error should indicate vatNumber validation
```

### 8.2 End-to-End Scenarier

| Scenarie | Steps | Expected |
|----------|-------|----------|
| Ny kunde → Faktura → Betaling | 1. Create customer, 2. Create invoice, 3. Book, 4. Register payment | Alle steps synced |
| Kreditnota | 1. Create invoice, 2. Book, 3. Create credit note | Begge synced, balance 0 |
| Ændring af kunde | 1. Update customer i OrderFlow, 2. Sync | Reflected i regnskab |
| Sletning | 1. Delete customer i regnskab, 2. Sync | Marked inactive i OrderFlow |

### 8.3 Moms og Afrunding

| Test Case | Input | Expected |
|-----------|-------|----------|
| Standard 25% | Netto 100 DKK | Moms 25 DKK, Total 125 DKK |
| Ørebeløb | Netto 99,99 DKK | Moms 25,00 DKK (afrundet) |
| Mixed lines | 25% + 0% | Korrekt split |
| EU-salg | B2B EU kunde | 0% moms, reverse charge |
| Kreditnota | -100 DKK | Negativ moms |

### 8.4 Locked Periods

| Test Case | Handling |
|-----------|----------|
| Posting til låst periode | Reject med clear error |
| Ændring i låst periode | Reject |
| Query locked status | Check før alle writes |

### 8.5 Load Test

| Metric | Target | Test Approach |
|--------|--------|---------------|
| Throughput | 1000 invoices/hour | Bulk create |
| Latency p99 | < 2s | Continuous load |
| Error rate | < 0.1% | Chaos testing |
| Rate limit handling | Graceful backoff | Burst traffic |

---

## 9. ROADMAP OG BESLUTNINGER

### 9.1 Prioriteret Connector Roadmap

| Priority | Connector | Reason | Timeline |
|----------|-----------|--------|----------|
| 1 | e-conomic | Størst markedsandel DK SMB | Q1 |
| 2 | Dinero | Største gratis segment | Q1 |
| 3 | Billy | Stærk i micro-segment | Q2 |
| 4 | Visma.net | Enterprise pipeline | Q3 |

### 9.2 Version Roadmap

```
Q1 2026:
├── V1 e-conomic (Uge 1-4)
├── V1 Dinero (Uge 5-8)
├── V2 e-conomic (Uge 9-12)
└── V2 Dinero (Uge 13-16)

Q2 2026:
├── V1 Billy (Uge 1-4)
├── V2 Billy (Uge 5-8)
├── V3 e-conomic (Uge 9-16)
└── V3 Dinero (Uge 9-16)

Q3 2026:
├── V3 Billy
├── V1-V2 Visma.net
└── V4 e-conomic (beta)

Q4 2026:
├── V4 All connectors
└── SAF-T export compliance
```

### 9.3 Must-Have fra Dag 1

| Krav | Reason |
|------|--------|
| Audit trail | Bogføringsloven krav |
| 5-års retention | Lovkrav |
| Attachment linking | Dokumentationskrav |
| Export capability | Gendannelseskrav |
| Ændringslog | Sporbarhedskrav |
| Encryption at rest | Sikkerhedskrav |
| GDPR DPA template | Kundeaftaler |

### 9.4 Beslutninger der skal træffes

| Beslutning | Options | Anbefaling | Beslutter |
|------------|---------|------------|-----------|
| Hosting | AWS / Azure / GCP | AWS (maturitet) | Tech Lead |
| Queue | SQS / RabbitMQ / Kafka | SQS (simplicity) | Tech Lead |
| Database | PostgreSQL / MySQL | PostgreSQL | Tech Lead |
| Sync frequency V2 | 15m / 1h / 4h | 1h default | Product |
| Conflict strategy | Latest wins / Manual | Manual review | Product |
| Pricing V1-V4 | Bundled / Per version | Per version | Business |

---

## 10. BENCHMARK: 20+ REGNSKABSSYSTEMER

**Kilder:**
- [Stadsrevisionen - 20 bedste regnskabsprogrammer](https://stadsrevisionen.dk/regnskabsprogrammer/)
- [Shopify DK - Regnskabsprogrammer](https://www.shopify.com/dk/blog/regnskabsprogram-til-sma-virksomheder)

### 10.1 System Oversigt

| # | System | Målgruppe | API | Modenhed | DK Moms | EU |
|---|--------|-----------|-----|----------|---------|-----|
| 1 | e-conomic | SMB | REST | ★★★★★ | ✅ | ✅ |
| 2 | Dinero | Micro-SMB | REST | ★★★★☆ | ✅ | ✅ |
| 3 | Billy | Micro | REST | ★★★☆☆ | ✅ | ❌ |
| 4 | Visma.net | Mid-market | REST | ★★★★★ | ✅ | ✅ |
| 5 | Uniconta | SMB | REST+SOAP | ★★★★☆ | ✅ | ✅ |
| 6 | Meneto | SMB | Limited | ★★☆☆☆ | ✅ | ❌ |
| 7 | Simpelt Regnskab | Micro | None | ★☆☆☆☆ | ✅ | ❌ |
| 8 | AirBOSS | SMB | REST | ★★★☆☆ | ✅ | ❌ |
| 9 | WinKAS | SMB | Limited | ★★☆☆☆ | ✅ | ❌ |
| 10 | Danlet | SMB | None | ★☆☆☆☆ | ✅ | ❌ |
| 11 | Dynaccount | SMB | REST | ★★★☆☆ | ✅ | ❌ |
| 12 | Xena | Mid-market | REST | ★★★★☆ | ✅ | ✅ |
| 13 | WebFinance | SMB | Limited | ★★☆☆☆ | ✅ | ❌ |
| 14 | Saldi | SMB | None | ★☆☆☆☆ | ✅ | ❌ |
| 15 | QuickBooks | SMB | REST | ★★★★★ | ⚠️ | ✅ |
| 16 | Xero | SMB | REST | ★★★★★ | ⚠️ | ✅ |
| 17 | Sage | SMB-Mid | REST | ★★★★☆ | ⚠️ | ✅ |
| 18 | SAP Business One | Mid-Enterprise | SDK | ★★★★★ | ✅ | ✅ |
| 19 | Microsoft Dynamics 365 | Enterprise | REST | ★★★★★ | ✅ | ✅ |
| 20 | Odoo | SMB | REST+XML-RPC | ★★★★☆ | ✅ | ✅ |
| 21 | Fortnox | SMB (SE) | REST | ★★★★☆ | ⚠️ | ✅ |
| 22 | Tripletex | SMB (NO) | REST | ★★★★☆ | ⚠️ | ✅ |
| 23 | Reviso | SMB | REST | ★★★☆☆ | ✅ | ✅ |
| 24 | Debitoor (nu SumUp) | Micro | REST | ★★★☆☆ | ✅ | ✅ |
| 25 | Zoho Books | SMB | REST | ★★★★☆ | ⚠️ | ✅ |

**Legend:** ⚠️ = Kræver lokal tilpasning

### 10.2 Entiteter per System

| System | Customers | Products | Invoices | Payments | GL | Attachments |
|--------|-----------|----------|----------|----------|-----|-------------|
| e-conomic | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dinero | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| Billy | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Visma.net | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| QuickBooks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Xero | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 10.3 Export Formater

| System | CSV | PDF | XML | SAF-T | JSON API |
|--------|-----|-----|-----|-------|----------|
| e-conomic | ✅ | ✅ | ❌ | ⚠️ | ✅ |
| Dinero | ✅ | ✅ | ❌ | ⚠️ | ✅ |
| Billy | ✅ | ✅ | ❌ | ❌ | ✅ |
| Visma.net | ✅ | ✅ | ✅ | ✅ | ✅ |

### 10.4 Markedsandel DK (estimeret)

| System | Andel | Segment |
|--------|-------|---------|
| e-conomic | ~35% | SMB |
| Dinero | ~25% | Micro-SMB |
| Billy | ~15% | Micro |
| Visma.net | ~5% | Mid-market |
| Andre | ~20% | Mixed |

---

## 11. CONNECTOR SPEC TEMPLATE

```markdown
# CONNECTOR SPECIFICATION: [SYSTEM NAME]

## 1. SYSTEM INFO
| Field | Value |
|-------|-------|
| System Name | |
| Vendor | |
| API Version | |
| Base URL | |
| Documentation | |
| Support Contact | |

## 2. AUTHENTICATION
| Method | Details |
|--------|---------|
| Type | OAuth2 / API Key / Bearer |
| Token URL | |
| Scopes Required | |
| Token Lifetime | |
| Refresh Strategy | |

### Auth Example
```http
POST /oauth/token
Authorization: Basic base64(client_id:secret)
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=XXX
```

## 3. RATE LIMITS
| Limit | Value |
|-------|-------|
| Requests/minute | |
| Requests/hour | |
| Requests/day | |
| Burst limit | |
| Backoff strategy | Exponential |

## 4. ENDPOINTS

### 4.1 Customers
| Operation | Method | Endpoint | Notes |
|-----------|--------|----------|-------|
| List | GET | | |
| Get | GET | | |
| Create | POST | | |
| Update | PUT/PATCH | | |
| Delete | DELETE | | |

### 4.2 Invoices
| Operation | Method | Endpoint | Notes |
|-----------|--------|----------|-------|
| List | GET | | |
| Get | GET | | |
| Create | POST | | |
| Book | POST | | |
| Void | POST | | |

### 4.3 [Other Entities...]

## 5. FIELD MAPPING

### 5.1 Customer
| Canonical Field | System Field | Transform | Required |
|-----------------|--------------|-----------|----------|
| id | | UUID mapping | - |
| name | | | ✅ |
| email | | | |
| vatNumber | | | |
| address.street | | | |

### 5.2 Invoice
| Canonical Field | System Field | Transform | Required |
|-----------------|--------------|-----------|----------|
| invoiceNumber | | | ✅ |
| customerRef | | ID → Ref | ✅ |
| lines[].quantity | | | ✅ |
| lines[].unitPrice | | Øre → DKK | ✅ |

## 6. VAT MAPPING
| Canonical Code | System Code | Rate |
|----------------|-------------|------|
| DK_STANDARD | | 25% |
| DK_ZERO | | 0% |
| EU_GOODS | | 0% |
| EU_SERVICES | | 0% |

## 7. WEBHOOKS
| Event | Endpoint | Payload |
|-------|----------|---------|
| invoice.created | | |
| invoice.updated | | |
| payment.received | | |

### Webhook Verification
```
Header: X-Webhook-Signature
Algorithm: HMAC-SHA256
```

## 8. IDEMPOTENCY
| Strategy | Implementation |
|----------|----------------|
| Create | Check externalId before insert |
| Update | ETag / If-Match header |
| Duplicate Detection | Query by unique fields |

## 9. PAGINATION
| Type | Parameters |
|------|------------|
| Style | Cursor / Offset |
| Page Size | max X |
| Params | page, pageSize / cursor |

## 10. CONSTRAINTS
| Constraint | Value | Handling |
|------------|-------|----------|
| Max line items | | Split invoice |
| Description length | | Truncate |
| Decimal places | | Round |
| Locked periods | | Check before write |

## 11. KNOWN EDGE CASES
| Case | Behavior | Workaround |
|------|----------|------------|
| | | |
| | | |

## 12. TEST CASES
| ID | Scenario | Input | Expected |
|----|----------|-------|----------|
| TC01 | Create customer | Valid payload | 201 Created |
| TC02 | Create duplicate | Same CVR | 409 Conflict |
| TC03 | Invalid VAT | Wrong format | 400 Error |
| TC04 | Create invoice | Valid | 201 + booking |
| TC05 | Credit note | Negative | Linked to original |
| TC06 | Rate limit | Burst 100 | 429 + Retry-After |

## 13. CHANGE LOG
| Date | Version | Changes |
|------|---------|---------|
| | 1.0 | Initial spec |
```

---

## KILDER

1. [Erhvervsstyrelsen - Bogføringsloven](https://erhvervsstyrelsen.dk/vejledning-bogfoeringsloven) - Hentet 2026-02-05
2. [Erhvervsstyrelsen - Digital bogføring 2026](https://erhvervsstyrelsen.dk/digital-bogfoering-traeder-i-kraft-personligt-ejede-virksomheder-og-foreninger-mfl-den-1-januar) - Hentet 2026-02-05
3. [e-conomic REST API Documentation](https://restdocs.e-conomic.com/) - API reference
4. [Dinero API Documentation](https://api.dinero.dk/) - API reference
5. [Billy API v2 Documentation](https://www.billy.dk/api/) - API reference
6. [Visma Developer Portal](https://developer.visma.com/) - API reference
7. [Visma.net Integrations](https://integration.visma.net/API-index/) - API reference
8. [Datatilsynet](https://www.datatilsynet.dk/) - GDPR vejledning
9. [Stadsrevisionen - Regnskabsprogrammer](https://stadsrevisionen.dk/regnskabsprogrammer/) - Markedsoversigt
10. [Apideck - Top 15 Accounting APIs](https://www.apideck.com/blog/top-15-accounting-apis-to-integrate-with) - API sammenligning
