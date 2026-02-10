/**
 * Billy Field Mappers
 * Transforms data between canonical format and Billy API format
 * @module integrations/connectors/billy/mappers
 * @version 1.0.0
 */

import { createCustomer, createProduct, createInvoice, createInvoiceLine, InvoiceStatus } from '../../core/canonical-model.js';

export function mapBillyCustomerToCanonical(billy) {
  return createCustomer({
    externalIds: { billy: billy.id },
    name: billy.name || '',
    cvr: billy.registrationNo || null,
    email: billy.email || null,
    phone: billy.phone || null,
    address: {
      street: billy.street || '',
      city: billy.cityText || '',
      zip: billy.zipcodeText || '',
      country: billy.countryId || 'DK'
    }
  });
}

export function mapCanonicalCustomerToBilly(canonical) {
  return {
    name: canonical.name,
    registrationNo: canonical.cvr || undefined,
    email: canonical.email || undefined,
    phone: canonical.phone || undefined,
    street: canonical.address?.street || undefined,
    cityText: canonical.address?.city || undefined,
    zipcodeText: canonical.address?.zip || undefined,
    countryId: canonical.address?.country || 'DK',
    isCustomer: true
  };
}

export function mapBillyInvoiceToCanonical(billy) {
  const statusMap = { draft: InvoiceStatus.DRAFT, approved: InvoiceStatus.SENT, paid: InvoiceStatus.PAID, overdue: InvoiceStatus.OVERDUE };

  return createInvoice({
    externalIds: { billy: billy.id },
    invoiceNumber: billy.invoiceNo ? String(billy.invoiceNo) : null,
    status: statusMap[billy.state] || InvoiceStatus.DRAFT,
    issueDate: billy.entryDate || null,
    dueDate: billy.dueDate || null,
    customerId: billy.contactId || null,
    currency: billy.currencyId || 'DKK',
    totalExVat: billy.amount || 0,
    totalVat: billy.tax || 0,
    totalIncVat: (billy.amount || 0) + (billy.tax || 0),
    lines: (billy.lines || []).map(line => createInvoiceLine({
      description: line.description || '',
      quantity: line.quantity || 1,
      unitPrice: line.unitPrice || 0,
      vatRate: 25
    }))
  });
}

export function mapCanonicalInvoiceToBilly(canonical) {
  return {
    contactId: canonical.customerId || undefined,
    entryDate: canonical.issueDate,
    currencyId: canonical.currency || 'DKK',
    paymentTermsDays: 14,
    lines: (canonical.lines || []).map(line => ({
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice
    }))
  };
}

export function mapBillyProductToCanonical(billy) {
  return createProduct({
    externalIds: { billy: billy.id },
    name: billy.name || '',
    description: billy.description || '',
    unitPrice: billy.prices?.[0]?.unitPrice || 0
  });
}
