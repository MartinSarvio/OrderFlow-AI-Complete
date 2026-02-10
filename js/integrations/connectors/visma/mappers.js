/**
 * Visma.net Field Mappers
 * Transforms data between canonical format and Visma.net API format
 * @module integrations/connectors/visma/mappers
 * @version 1.0.0
 */

import { createCustomer, createInvoice, createInvoiceLine, InvoiceStatus } from '../../core/canonical-model.js';

export function mapVismaCustomerToCanonical(visma) {
  return createCustomer({
    externalIds: { visma: visma.number ? String(visma.number) : visma.internalId },
    customerNumber: visma.number ? String(visma.number) : null,
    name: visma.name || '',
    cvr: visma.corporateId || null,
    vatNumber: visma.vatRegistrationId || null,
    email: visma.email || null,
    phone: visma.phone1 || null,
    address: {
      street: visma.mainAddress?.addressLine1 || '',
      city: visma.mainAddress?.city || '',
      zip: visma.mainAddress?.postalCode || '',
      country: visma.mainAddress?.country?.id || 'DK'
    }
  });
}

export function mapCanonicalCustomerToVisma(canonical) {
  return {
    name: canonical.name,
    corporateId: canonical.cvr || undefined,
    vatRegistrationId: canonical.vatNumber || undefined,
    email: canonical.email || undefined,
    phone1: canonical.phone || undefined,
    mainAddress: {
      addressLine1: canonical.address?.street || '',
      city: canonical.address?.city || '',
      postalCode: canonical.address?.zip || '',
      country: { id: canonical.address?.country || 'DK' }
    }
  };
}

export function mapVismaInvoiceToCanonical(visma) {
  const statusMap = { Hold: InvoiceStatus.DRAFT, Balanced: InvoiceStatus.PAID, Open: InvoiceStatus.SENT, Overdue: InvoiceStatus.OVERDUE };

  return createInvoice({
    externalIds: { visma: visma.referenceNumber || visma.internalId },
    invoiceNumber: visma.referenceNumber || null,
    status: statusMap[visma.status] || InvoiceStatus.DRAFT,
    issueDate: visma.date?.value || null,
    dueDate: visma.dueDate?.value || null,
    customerId: visma.customer?.number ? String(visma.customer.number) : null,
    currency: visma.currencyId || 'DKK',
    totalExVat: visma.amount || 0,
    totalVat: visma.vatTotal || 0,
    totalIncVat: visma.amountInCurrency || visma.amount || 0,
    lines: (visma.invoiceLines || []).map(line => createInvoiceLine({
      description: line.description || '',
      quantity: line.quantity || 1,
      unitPrice: line.unitPriceInCurrency || line.unitPrice || 0,
      vatRate: 25
    }))
  });
}

export function mapCanonicalInvoiceToVisma(canonical) {
  return {
    customer: { number: canonical.customerId },
    date: { value: canonical.issueDate },
    dueDate: { value: canonical.dueDate },
    currencyId: canonical.currency || 'DKK',
    invoiceLines: (canonical.lines || []).map(line => ({
      description: line.description,
      quantity: line.quantity,
      unitPriceInCurrency: line.unitPrice
    }))
  };
}
