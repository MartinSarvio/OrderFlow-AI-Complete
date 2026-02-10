/**
 * Dinero Field Mappers
 * Transforms data between canonical format and Dinero API format
 * @module integrations/connectors/dinero/mappers
 * @version 1.0.0
 */

import { createCustomer, createProduct, createInvoice, createInvoiceLine, InvoiceStatus } from '../../core/canonical-model.js';

export function mapDineroCustomerToCanonical(dinero) {
  return createCustomer({
    externalIds: { dinero: dinero.ContactGuid },
    name: dinero.Name || '',
    cvr: dinero.VatNumber || null,
    email: dinero.Email || null,
    phone: dinero.Phone || null,
    address: {
      street: dinero.Address || '',
      city: dinero.City || '',
      zip: dinero.ZipCode || '',
      country: dinero.Country || 'DK'
    }
  });
}

export function mapCanonicalCustomerToDinero(canonical) {
  return {
    Name: canonical.name,
    VatNumber: canonical.cvr || undefined,
    Email: canonical.email || undefined,
    Phone: canonical.phone || undefined,
    Address: canonical.address?.street || undefined,
    City: canonical.address?.city || undefined,
    ZipCode: canonical.address?.zip || undefined,
    Country: canonical.address?.country || 'DK'
  };
}

export function mapDineroInvoiceToCanonical(dinero) {
  const statusMap = { Draft: InvoiceStatus.DRAFT, Booked: InvoiceStatus.SENT, Paid: InvoiceStatus.PAID, Overdue: InvoiceStatus.OVERDUE };

  return createInvoice({
    externalIds: { dinero: dinero.Guid },
    invoiceNumber: dinero.Number ? String(dinero.Number) : null,
    status: statusMap[dinero.Status] || InvoiceStatus.DRAFT,
    issueDate: dinero.Date || null,
    dueDate: dinero.PaymentDate || null,
    customerId: dinero.ContactGuid || null,
    currency: 'DKK',
    totalExVat: dinero.TotalExVat || 0,
    totalVat: dinero.TotalVat || 0,
    totalIncVat: dinero.TotalIncVat || 0,
    lines: (dinero.ProductLines || []).map(line => createInvoiceLine({
      description: line.Description || '',
      quantity: line.Quantity || 1,
      unitPrice: line.BaseAmountValue || 0,
      vatRate: line.AccountVatRate || 25
    }))
  });
}

export function mapCanonicalInvoiceToDinero(canonical) {
  return {
    ContactGuid: canonical.customerId || undefined,
    Date: canonical.issueDate,
    PaymentConditionNumberOfDays: 14,
    Currency: canonical.currency || 'DKK',
    ProductLines: (canonical.lines || []).map(line => ({
      Description: line.description,
      Quantity: line.quantity,
      BaseAmountValue: line.unitPrice,
      AccountNumber: 1000
    }))
  };
}

export function mapDineroProductToCanonical(dinero) {
  return createProduct({
    externalIds: { dinero: dinero.ProductGuid },
    name: dinero.Name || '',
    description: dinero.Description || '',
    unitPrice: dinero.BaseAmountValue || 0,
    unit: dinero.Unit || 'stk'
  });
}
