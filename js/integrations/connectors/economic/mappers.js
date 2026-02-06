/**
 * e-conomic Field Mappers
 * Transforms data between canonical format and e-conomic API format
 * @module integrations/connectors/economic/mappers
 * @version 1.0.0
 */

import {
  createCustomer,
  createProduct,
  createAccount,
  createVatCode,
  createInvoice,
  createInvoiceLine,
  createPayment,
  AccountType,
  VatType,
  InvoiceStatus,
  PaymentStatus
} from '../../core/canonical-model.js';

// ============ VAT MAPPINGS ============

/**
 * Map e-conomic VAT zone to canonical VAT type
 */
const vatZoneMapping = {
  'Domestic': VatType.SALES,
  'EU': VatType.EU_GOODS,
  'Abroad': VatType.REVERSE_CHARGE
};

/**
 * Map canonical VAT type to e-conomic VAT zone
 */
const reverseVatZoneMapping = {
  [VatType.SALES]: 'Domestic',
  [VatType.EU_GOODS]: 'EU',
  [VatType.EU_SERVICES]: 'EU',
  [VatType.REVERSE_CHARGE]: 'Abroad',
  [VatType.EXEMPT]: 'Domestic',
  [VatType.ZERO]: 'Domestic'
};

// ============ CUSTOMER MAPPERS ============

/**
 * Map e-conomic customer to canonical format
 * @param {Object} economic - e-conomic customer object
 * @returns {Object} Canonical customer
 */
export function mapEconomicCustomerToCanonical(economic) {
  return createCustomer({
    externalIds: {
      economic: String(economic.customerNumber)
    },
    customerNumber: String(economic.customerNumber),
    name: economic.name || '',
    cvr: economic.corporateIdentificationNumber || null,
    vatNumber: economic.vatNumber || null,
    email: economic.email || null,
    phone: economic.telephoneAndFaxNumber || null,
    address: {
      street: economic.address || null,
      city: economic.city || null,
      postalCode: economic.zip || null,
      country: economic.country || 'DK'
    },
    paymentTermsDays: economic.paymentTerms?.daysOfCredit || 14,
    currency: economic.currency || 'DKK',
    isActive: !economic.barred
  });
}

/**
 * Map canonical customer to e-conomic format
 * @param {Object} canonical - Canonical customer object
 * @param {Object} [existingCustomer] - Existing e-conomic customer for updates
 * @returns {Object} e-conomic customer payload
 */
export function mapCanonicalCustomerToEconomic(canonical, existingCustomer = null) {
  const payload = {
    name: canonical.name,
    address: canonical.address?.street || null,
    city: canonical.address?.city || null,
    zip: canonical.address?.postalCode || null,
    country: canonical.address?.country || 'DK',
    email: canonical.email || null,
    telephoneAndFaxNumber: canonical.phone || null,
    corporateIdentificationNumber: canonical.cvr || null,
    vatNumber: canonical.vatNumber || null,
    currency: canonical.currency || 'DKK',
    barred: !canonical.isActive
  };

  // Only include customerNumber on create if specified
  if (!existingCustomer && canonical.customerNumber) {
    payload.customerNumber = parseInt(canonical.customerNumber, 10);
  }

  // Payment terms reference (required)
  if (canonical.paymentTermsDays) {
    payload.paymentTerms = {
      paymentTermsNumber: mapPaymentTermsDaysToNumber(canonical.paymentTermsDays)
    };
  }

  // VAT zone (required)
  payload.vatZone = {
    vatZoneNumber: 1 // Default to Domestic
  };

  // Customer group (required) - use default
  payload.customerGroup = {
    customerGroupNumber: 1
  };

  return payload;
}

/**
 * Map payment terms days to e-conomic payment terms number
 * @param {number} days
 * @returns {number}
 */
function mapPaymentTermsDaysToNumber(days) {
  // Common e-conomic payment terms mappings
  // These should be customized based on the company's setup
  if (days <= 0) return 1;  // Kontant
  if (days <= 7) return 2;  // 7 dage
  if (days <= 14) return 3; // 14 dage
  if (days <= 30) return 4; // 30 dage
  return 5; // Løbende måned + 30
}

// ============ PRODUCT MAPPERS ============

/**
 * Map e-conomic product to canonical format
 * @param {Object} economic - e-conomic product object
 * @returns {Object} Canonical product
 */
export function mapEconomicProductToCanonical(economic) {
  return createProduct({
    externalIds: {
      economic: economic.productNumber
    },
    productNumber: economic.productNumber,
    name: economic.name || '',
    description: economic.description || null,
    unit: economic.unit?.name || 'stk',
    salesPrice: economic.salesPrice || 0,
    costPrice: economic.costPrice || null,
    isActive: !economic.barred
  });
}

/**
 * Map canonical product to e-conomic format
 * @param {Object} canonical - Canonical product object
 * @returns {Object} e-conomic product payload
 */
export function mapCanonicalProductToEconomic(canonical) {
  const payload = {
    productNumber: canonical.productNumber,
    name: canonical.name,
    description: canonical.description || '',
    salesPrice: canonical.salesPrice || 0,
    costPrice: canonical.costPrice || 0,
    barred: !canonical.isActive
  };

  // Unit reference
  if (canonical.unit) {
    payload.unit = {
      unitNumber: mapUnitToNumber(canonical.unit)
    };
  }

  // Product group (required)
  payload.productGroup = {
    productGroupNumber: 1 // Default product group
  };

  return payload;
}

/**
 * Map unit name to e-conomic unit number
 * @param {string} unit
 * @returns {number}
 */
function mapUnitToNumber(unit) {
  const unitMap = {
    'stk': 1,
    'stk.': 1,
    'pcs': 1,
    'kg': 2,
    'l': 3,
    'liter': 3,
    'm': 4,
    'meter': 4,
    'time': 5,
    'timer': 5,
    'hour': 5,
    'hours': 5
  };
  return unitMap[unit.toLowerCase()] || 1;
}

// ============ ACCOUNT MAPPERS ============

/**
 * Map e-conomic account type to canonical
 * @param {string} economicType
 * @returns {string}
 */
function mapEconomicAccountType(economicType) {
  const mapping = {
    'profitAndLoss': AccountType.REVENUE,
    'status': AccountType.ASSET,
    'totalFrom': AccountType.ASSET,
    'heading': AccountType.ASSET,
    'headingStart': AccountType.ASSET
  };
  return mapping[economicType] || AccountType.EXPENSE;
}

/**
 * Map e-conomic account to canonical format
 * @param {Object} economic - e-conomic account object
 * @returns {Object} Canonical account
 */
export function mapEconomicAccountToCanonical(economic) {
  return createAccount({
    externalIds: {
      economic: String(economic.accountNumber)
    },
    accountNumber: String(economic.accountNumber),
    name: economic.name || '',
    accountType: mapEconomicAccountType(economic.accountType),
    isActive: !economic.barred,
    balance: economic.balance || null
  });
}

// ============ VAT CODE MAPPERS ============

/**
 * Map e-conomic VAT account to canonical format
 * @param {Object} economic - e-conomic VAT account object
 * @returns {Object} Canonical VAT code
 */
export function mapEconomicVatToCanonical(economic) {
  return createVatCode({
    externalIds: {
      economic: economic.vatCode
    },
    code: economic.vatCode,
    name: economic.name || '',
    rate: (economic.ratePercentage || 0) / 100,
    vatType: vatZoneMapping[economic.vatZone?.name] || VatType.SALES,
    isActive: true
  });
}

// ============ INVOICE MAPPERS ============

/**
 * Map invoice status from e-conomic
 * @param {Object} economic
 * @returns {string}
 */
function mapEconomicInvoiceStatus(economic) {
  if (economic.remainder === 0 && economic.grossAmount > 0) {
    return InvoiceStatus.PAID;
  }
  if (economic.dueDate && new Date(economic.dueDate) < new Date()) {
    return InvoiceStatus.OVERDUE;
  }
  return InvoiceStatus.SENT;
}

/**
 * Map e-conomic booked invoice to canonical format
 * @param {Object} economic - e-conomic invoice object
 * @returns {Object} Canonical invoice
 */
export function mapEconomicInvoiceToCanonical(economic) {
  const lines = (economic.lines || []).map((line, index) =>
    createInvoiceLine({
      lineNumber: index + 1,
      description: line.description || '',
      quantity: line.quantity || 1,
      unitPrice: line.unitNetPrice || 0,
      discountPercent: line.discountPercentage || 0,
      vatRate: 0.25 // Default Danish VAT
    })
  );

  return createInvoice({
    externalIds: {
      economic: String(economic.bookedInvoiceNumber || economic.draftInvoiceNumber)
    },
    invoiceNumber: String(economic.bookedInvoiceNumber || economic.draftInvoiceNumber),
    status: economic.bookedInvoiceNumber ? mapEconomicInvoiceStatus(economic) : InvoiceStatus.DRAFT,
    customerName: economic.recipient?.name || '',
    customerAddress: {
      street: economic.recipient?.address || null,
      city: economic.recipient?.city || null,
      postalCode: economic.recipient?.zip || null,
      country: economic.recipient?.country || 'DK'
    },
    customerVatNumber: economic.recipient?.vatNumber || null,
    invoiceDate: economic.date || null,
    dueDate: economic.dueDate || null,
    currency: economic.currency || 'DKK',
    exchangeRate: economic.exchangeRate || 1,
    lines,
    subtotal: economic.netAmount || 0,
    vatAmount: economic.vatAmount || 0,
    total: economic.grossAmount || 0,
    amountDue: economic.remainder || 0,
    paidAmount: (economic.grossAmount || 0) - (economic.remainder || 0),
    reference: economic.references?.other || null,
    notes: economic.notes?.heading || null
  });
}

/**
 * Map canonical invoice to e-conomic draft invoice format
 * @param {Object} canonical - Canonical invoice object
 * @param {Object} options - Mapping options
 * @param {number} options.customerNumber - e-conomic customer number
 * @param {number} [options.layoutNumber=1] - Invoice layout number
 * @returns {Object} e-conomic draft invoice payload
 */
export function mapCanonicalInvoiceToEconomic(canonical, options = {}) {
  if (!options.customerNumber) {
    throw new Error('customerNumber is required for e-conomic invoice');
  }

  const lines = canonical.lines.map((line, index) => ({
    lineNumber: index + 1,
    description: line.description || 'Vare',
    quantity: line.quantity,
    unitNetPrice: line.unitPrice,
    discountPercentage: line.discountPercent || 0,
    // Product reference (optional)
    ...(line.productId ? { product: { productNumber: line.productId } } : {})
  }));

  const payload = {
    date: canonical.invoiceDate,
    currency: canonical.currency || 'DKK',
    exchangeRate: canonical.exchangeRate || 1,
    customer: {
      customerNumber: options.customerNumber
    },
    layout: {
      layoutNumber: options.layoutNumber || 1
    },
    paymentTerms: {
      paymentTermsNumber: mapPaymentTermsDaysToNumber(canonical.paymentTermsDays)
    },
    lines
  };

  // Optional fields
  if (canonical.dueDate) {
    payload.dueDate = canonical.dueDate;
  }

  if (canonical.reference) {
    payload.references = {
      other: canonical.reference
    };
  }

  if (canonical.notes) {
    payload.notes = {
      heading: canonical.notes
    };
  }

  // Recipient override (if different from customer)
  if (canonical.customerName || canonical.customerAddress?.street) {
    payload.recipient = {
      name: canonical.customerName,
      address: canonical.customerAddress?.street || null,
      city: canonical.customerAddress?.city || null,
      zip: canonical.customerAddress?.postalCode || null,
      country: canonical.customerAddress?.country || 'DK',
      vatNumber: canonical.customerVatNumber || null
    };
  }

  return payload;
}

// ============ PAYMENT MAPPERS ============

/**
 * Map e-conomic customer payment to canonical format
 * @param {Object} economic - e-conomic payment object
 * @returns {Object} Canonical payment
 */
export function mapEconomicPaymentToCanonical(economic) {
  const allocations = [];

  // If payment is linked to an invoice
  if (economic.invoices && economic.invoices.length > 0) {
    economic.invoices.forEach(inv => {
      allocations.push({
        invoiceId: String(inv.bookedInvoiceNumber),
        amount: inv.amount || economic.amount
      });
    });
  }

  return createPayment({
    externalIds: {
      economic: String(economic.customerPaymentNumber)
    },
    paymentNumber: String(economic.customerPaymentNumber),
    type: 'incoming',
    status: PaymentStatus.COMPLETED,
    amount: economic.amount || 0,
    currency: economic.currency || 'DKK',
    paymentDate: economic.paymentDate || null,
    allocations
  });
}

/**
 * Map canonical payment to e-conomic format
 * @param {Object} canonical - Canonical payment object
 * @param {Object} options - Mapping options
 * @param {number} options.customerNumber - e-conomic customer number
 * @returns {Object} e-conomic payment payload
 */
export function mapCanonicalPaymentToEconomic(canonical, options = {}) {
  if (!options.customerNumber) {
    throw new Error('customerNumber is required for e-conomic payment');
  }

  const payload = {
    paymentDate: canonical.paymentDate,
    amount: canonical.amount,
    currency: canonical.currency || 'DKK',
    customer: {
      customerNumber: options.customerNumber
    }
  };

  // Link to invoices if allocations exist
  if (canonical.allocations && canonical.allocations.length > 0) {
    payload.invoices = canonical.allocations.map(alloc => ({
      bookedInvoiceNumber: parseInt(alloc.invoiceId, 10),
      amount: alloc.amount
    }));
  }

  return payload;
}

export default {
  // Customer
  mapEconomicCustomerToCanonical,
  mapCanonicalCustomerToEconomic,

  // Product
  mapEconomicProductToCanonical,
  mapCanonicalProductToEconomic,

  // Account
  mapEconomicAccountToCanonical,

  // VAT
  mapEconomicVatToCanonical,

  // Invoice
  mapEconomicInvoiceToCanonical,
  mapCanonicalInvoiceToEconomic,

  // Payment
  mapEconomicPaymentToCanonical,
  mapCanonicalPaymentToEconomic
};
