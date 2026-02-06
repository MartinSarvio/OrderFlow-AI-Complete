/**
 * Canonical Data Model for Accounting Integrations
 * Defines standard data structures that all connectors transform to/from
 * @module integrations/core/canonical-model
 * @version 1.0.0
 */

/**
 * Generate a UUID v4
 * @returns {string}
 */
export function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Get current ISO8601 timestamp
 * @returns {string}
 */
export function now() {
  return new Date().toISOString();
}

// ============ ENUMS ============

export const EntityType = {
  COMPANY: 'company',
  CUSTOMER: 'customer',
  SUPPLIER: 'supplier',
  PRODUCT: 'product',
  ACCOUNT: 'account',
  VAT_CODE: 'vat_code',
  INVOICE: 'invoice',
  CREDIT_NOTE: 'credit_note',
  PAYMENT: 'payment',
  JOURNAL_ENTRY: 'journal_entry',
  ATTACHMENT: 'attachment'
};

export const InvoiceStatus = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
  VOIDED: 'voided'
};

export const PaymentStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

export const PaymentMethod = {
  BANK_TRANSFER: 'bank_transfer',
  CARD: 'card',
  CASH: 'cash',
  MOBILEPAY: 'mobilepay',
  OTHER: 'other'
};

export const AccountType = {
  ASSET: 'asset',
  LIABILITY: 'liability',
  EQUITY: 'equity',
  REVENUE: 'revenue',
  EXPENSE: 'expense'
};

export const VatType = {
  SALES: 'sales',
  PURCHASE: 'purchase',
  EU_GOODS: 'eu_goods',
  EU_SERVICES: 'eu_services',
  REVERSE_CHARGE: 'reverse_charge',
  EXEMPT: 'exempt',
  ZERO: 'zero'
};

export const SyncDirection = {
  PUSH: 'push',
  PULL: 'pull',
  BIDIRECTIONAL: 'bidirectional'
};

export const SyncStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PARTIAL: 'partial'
};

// ============ MODEL FACTORIES ============

/**
 * Create a canonical Address object
 * @param {Object} data
 * @returns {Object}
 */
export function createAddress(data = {}) {
  return {
    street: data.street || null,
    street2: data.street2 || null,
    city: data.city || null,
    postalCode: data.postalCode || null,
    country: data.country || 'DK'
  };
}

/**
 * Create a canonical Company object
 * @param {Object} data
 * @returns {Object}
 */
export function createCompany(data = {}) {
  return {
    id: data.id || generateId(),
    externalIds: {
      economic: data.externalIds?.economic || null,
      dinero: data.externalIds?.dinero || null,
      billy: data.externalIds?.billy || null,
      visma: data.externalIds?.visma || null
    },
    name: data.name || '',
    cvr: data.cvr || null,
    vatNumber: data.vatNumber || null,
    address: createAddress(data.address),
    email: data.email || null,
    phone: data.phone || null,
    bankAccount: {
      regNo: data.bankAccount?.regNo || null,
      accountNo: data.bankAccount?.accountNo || null,
      iban: data.bankAccount?.iban || null
    },
    fiscalYearStart: data.fiscalYearStart || '01-01',
    baseCurrency: data.baseCurrency || 'DKK',
    vatPeriod: data.vatPeriod || 'quarterly',
    createdAt: data.createdAt || now(),
    updatedAt: data.updatedAt || now()
  };
}

/**
 * Create a canonical Customer object
 * @param {Object} data
 * @returns {Object}
 */
export function createCustomer(data = {}) {
  return {
    id: data.id || generateId(),
    companyId: data.companyId || null,
    externalIds: {
      economic: data.externalIds?.economic || null,
      dinero: data.externalIds?.dinero || null,
      billy: data.externalIds?.billy || null,
      visma: data.externalIds?.visma || null
    },
    type: 'customer',
    customerNumber: data.customerNumber || null,
    name: data.name || '',
    cvr: data.cvr || null,
    vatNumber: data.vatNumber || null,
    email: data.email || null,
    phone: data.phone || null,
    address: createAddress(data.address),
    paymentTermsDays: data.paymentTermsDays || 14,
    defaultAccountId: data.defaultAccountId || null,
    defaultVatCodeId: data.defaultVatCodeId || null,
    currency: data.currency || 'DKK',
    isActive: data.isActive !== false,
    gdprConsent: {
      marketing: data.gdprConsent?.marketing || false,
      consentDate: data.gdprConsent?.consentDate || null
    },
    createdAt: data.createdAt || now(),
    updatedAt: data.updatedAt || now()
  };
}

/**
 * Create a canonical Product object
 * @param {Object} data
 * @returns {Object}
 */
export function createProduct(data = {}) {
  return {
    id: data.id || generateId(),
    companyId: data.companyId || null,
    externalIds: {
      economic: data.externalIds?.economic || null,
      dinero: data.externalIds?.dinero || null,
      billy: data.externalIds?.billy || null,
      visma: data.externalIds?.visma || null
    },
    productNumber: data.productNumber || null,
    name: data.name || '',
    description: data.description || null,
    unit: data.unit || 'stk',
    salesPrice: data.salesPrice || 0,
    costPrice: data.costPrice || null,
    vatCodeId: data.vatCodeId || null,
    revenueAccountId: data.revenueAccountId || null,
    inventoryEnabled: data.inventoryEnabled || false,
    stockQuantity: data.stockQuantity || null,
    isActive: data.isActive !== false,
    createdAt: data.createdAt || now(),
    updatedAt: data.updatedAt || now()
  };
}

/**
 * Create a canonical Account object
 * @param {Object} data
 * @returns {Object}
 */
export function createAccount(data = {}) {
  return {
    id: data.id || generateId(),
    companyId: data.companyId || null,
    externalIds: {
      economic: data.externalIds?.economic || null,
      dinero: data.externalIds?.dinero || null,
      billy: data.externalIds?.billy || null,
      visma: data.externalIds?.visma || null
    },
    accountNumber: data.accountNumber || '',
    name: data.name || '',
    accountType: data.accountType || AccountType.EXPENSE,
    vatCodeId: data.vatCodeId || null,
    isSystemAccount: data.isSystemAccount || false,
    isBankAccount: data.isBankAccount || false,
    isActive: data.isActive !== false,
    balance: data.balance || null,
    createdAt: data.createdAt || now(),
    updatedAt: data.updatedAt || now()
  };
}

/**
 * Create a canonical VatCode object
 * @param {Object} data
 * @returns {Object}
 */
export function createVatCode(data = {}) {
  return {
    id: data.id || generateId(),
    companyId: data.companyId || null,
    externalIds: {
      economic: data.externalIds?.economic || null,
      dinero: data.externalIds?.dinero || null,
      billy: data.externalIds?.billy || null,
      visma: data.externalIds?.visma || null
    },
    code: data.code || '',
    name: data.name || '',
    rate: data.rate || 0,
    vatType: data.vatType || VatType.SALES,
    accountId: data.accountId || null,
    isDefault: data.isDefault || false,
    isActive: data.isActive !== false
  };
}

/**
 * Create a canonical InvoiceLine object
 * @param {Object} data
 * @returns {Object}
 */
export function createInvoiceLine(data = {}) {
  const quantity = data.quantity || 1;
  const unitPrice = data.unitPrice || 0;
  const discountPercent = data.discountPercent || 0;
  const vatRate = data.vatRate || 0.25;

  const lineTotal = quantity * unitPrice * (1 - discountPercent / 100);
  const lineTotalIncVat = lineTotal * (1 + vatRate);

  return {
    lineNumber: data.lineNumber || 1,
    productId: data.productId || null,
    description: data.description || '',
    quantity,
    unitPrice,
    discountPercent,
    vatCodeId: data.vatCodeId || null,
    vatRate,
    accountId: data.accountId || null,
    lineTotal: Math.round(lineTotal * 100) / 100,
    lineTotalIncVat: Math.round(lineTotalIncVat * 100) / 100
  };
}

/**
 * Create a canonical Invoice object
 * @param {Object} data
 * @returns {Object}
 */
export function createInvoice(data = {}) {
  const lines = (data.lines || []).map((line, index) =>
    createInvoiceLine({ ...line, lineNumber: index + 1 })
  );

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const vatAmount = lines.reduce((sum, line) =>
    sum + (line.lineTotalIncVat - line.lineTotal), 0
  );
  const total = subtotal + vatAmount;

  return {
    id: data.id || generateId(),
    companyId: data.companyId || null,
    externalIds: {
      economic: data.externalIds?.economic || null,
      dinero: data.externalIds?.dinero || null,
      billy: data.externalIds?.billy || null,
      visma: data.externalIds?.visma || null
    },
    invoiceNumber: data.invoiceNumber || null,
    type: data.type || 'invoice',
    status: data.status || InvoiceStatus.DRAFT,
    customerId: data.customerId || null,
    customerName: data.customerName || '',
    customerAddress: createAddress(data.customerAddress),
    customerVatNumber: data.customerVatNumber || null,
    invoiceDate: data.invoiceDate || new Date().toISOString().split('T')[0],
    dueDate: data.dueDate || null,
    currency: data.currency || 'DKK',
    exchangeRate: data.exchangeRate || 1,
    lines,
    subtotal: Math.round(subtotal * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    amountDue: data.amountDue ?? Math.round(total * 100) / 100,
    paidAmount: data.paidAmount || 0,
    paymentTermsDays: data.paymentTermsDays || 14,
    reference: data.reference || null,
    notes: data.notes || null,
    attachments: data.attachments || [],
    bookedAt: data.bookedAt || null,
    journalEntryId: data.journalEntryId || null,
    createdAt: data.createdAt || now(),
    updatedAt: data.updatedAt || now()
  };
}

/**
 * Create a canonical PaymentAllocation object
 * @param {Object} data
 * @returns {Object}
 */
export function createPaymentAllocation(data = {}) {
  return {
    invoiceId: data.invoiceId || null,
    amount: data.amount || 0
  };
}

/**
 * Create a canonical Payment object
 * @param {Object} data
 * @returns {Object}
 */
export function createPayment(data = {}) {
  const allocations = (data.allocations || []).map(createPaymentAllocation);

  return {
    id: data.id || generateId(),
    companyId: data.companyId || null,
    externalIds: {
      economic: data.externalIds?.economic || null,
      dinero: data.externalIds?.dinero || null,
      billy: data.externalIds?.billy || null,
      visma: data.externalIds?.visma || null
    },
    paymentNumber: data.paymentNumber || null,
    type: data.type || 'incoming',
    status: data.status || PaymentStatus.COMPLETED,
    amount: data.amount || 0,
    currency: data.currency || 'DKK',
    exchangeRate: data.exchangeRate || 1,
    paymentDate: data.paymentDate || new Date().toISOString().split('T')[0],
    paymentMethod: data.paymentMethod || PaymentMethod.BANK_TRANSFER,
    bankAccountId: data.bankAccountId || null,
    bankReference: data.bankReference || null,
    allocations,
    journalEntryId: data.journalEntryId || null,
    createdAt: data.createdAt || now(),
    updatedAt: data.updatedAt || now()
  };
}

/**
 * Create a canonical JournalLine object
 * @param {Object} data
 * @returns {Object}
 */
export function createJournalLine(data = {}) {
  return {
    lineNumber: data.lineNumber || 1,
    accountId: data.accountId || null,
    debit: data.debit || 0,
    credit: data.credit || 0,
    vatCodeId: data.vatCodeId || null,
    vatAmount: data.vatAmount || null,
    description: data.description || null,
    customerId: data.customerId || null,
    supplierId: data.supplierId || null
  };
}

/**
 * Create a canonical JournalEntry object
 * @param {Object} data
 * @returns {Object}
 */
export function createJournalEntry(data = {}) {
  const lines = (data.lines || []).map((line, index) =>
    createJournalLine({ ...line, lineNumber: index + 1 })
  );

  const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);

  return {
    id: data.id || generateId(),
    companyId: data.companyId || null,
    externalIds: {
      economic: data.externalIds?.economic || null,
      dinero: data.externalIds?.dinero || null,
      billy: data.externalIds?.billy || null,
      visma: data.externalIds?.visma || null
    },
    entryNumber: data.entryNumber || null,
    journalId: data.journalId || null,
    entryDate: data.entryDate || new Date().toISOString().split('T')[0],
    postingDate: data.postingDate || new Date().toISOString().split('T')[0],
    description: data.description || '',
    sourceType: data.sourceType || 'manual',
    sourceId: data.sourceId || null,
    lines,
    totalDebit: Math.round(totalDebit * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100,
    isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    isLocked: data.isLocked || false,
    attachments: data.attachments || [],
    createdAt: data.createdAt || now(),
    updatedAt: data.updatedAt || now()
  };
}

/**
 * Create a canonical SyncJob object
 * @param {Object} data
 * @returns {Object}
 */
export function createSyncJob(data = {}) {
  return {
    id: data.id || generateId(),
    companyId: data.companyId || null,
    connectorType: data.connectorType || 'economic',
    direction: data.direction || SyncDirection.PULL,
    entityTypes: data.entityTypes || [],
    status: data.status || SyncStatus.PENDING,
    startedAt: data.startedAt || null,
    completedAt: data.completedAt || null,
    recordsProcessed: data.recordsProcessed || 0,
    recordsSucceeded: data.recordsSucceeded || 0,
    recordsFailed: data.recordsFailed || 0,
    errors: data.errors || [],
    triggeredBy: data.triggeredBy || 'manual',
    metadata: data.metadata || null
  };
}

/**
 * Create a canonical AuditEvent object
 * @param {Object} data
 * @returns {Object}
 */
export function createAuditEvent(data = {}) {
  return {
    id: data.id || generateId(),
    companyId: data.companyId || null,
    timestamp: data.timestamp || now(),
    eventType: data.eventType || 'update',
    entityType: data.entityType || null,
    entityId: data.entityId || null,
    userId: data.userId || null,
    systemActor: data.systemActor || null,
    ipAddress: data.ipAddress || null,
    userAgent: data.userAgent || null,
    previousState: data.previousState || null,
    newState: data.newState || null,
    changeSet: data.changeSet || null,
    metadata: data.metadata || null
  };
}

// ============ VALIDATION ============

/**
 * Validate a CVR number (Danish company registration number)
 * @param {string} cvr
 * @returns {boolean}
 */
export function isValidCvr(cvr) {
  if (!cvr || typeof cvr !== 'string') return false;
  const cleaned = cvr.replace(/\D/g, '');
  return cleaned.length === 8;
}

/**
 * Validate a Danish VAT number
 * @param {string} vatNumber
 * @returns {boolean}
 */
export function isValidDanishVat(vatNumber) {
  if (!vatNumber || typeof vatNumber !== 'string') return false;
  const cleaned = vatNumber.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  return /^DK\d{8}$/.test(cleaned);
}

/**
 * Validate email address
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate an invoice has balanced lines
 * @param {Object} invoice
 * @returns {{valid: boolean, message?: string}}
 */
export function validateInvoice(invoice) {
  if (!invoice.customerId && !invoice.customerName) {
    return { valid: false, message: 'Customer is required' };
  }

  if (!invoice.lines || invoice.lines.length === 0) {
    return { valid: false, message: 'At least one line item is required' };
  }

  for (const line of invoice.lines) {
    if (line.quantity <= 0) {
      return { valid: false, message: `Line ${line.lineNumber}: Quantity must be positive` };
    }
  }

  return { valid: true };
}

/**
 * Validate a journal entry is balanced
 * @param {Object} journalEntry
 * @returns {{valid: boolean, message?: string}}
 */
export function validateJournalEntry(journalEntry) {
  if (!journalEntry.lines || journalEntry.lines.length === 0) {
    return { valid: false, message: 'At least one line is required' };
  }

  if (!journalEntry.isBalanced) {
    return {
      valid: false,
      message: `Entry is not balanced: Debit ${journalEntry.totalDebit}, Credit ${journalEntry.totalCredit}`
    };
  }

  return { valid: true };
}

export default {
  // Enums
  EntityType,
  InvoiceStatus,
  PaymentStatus,
  PaymentMethod,
  AccountType,
  VatType,
  SyncDirection,
  SyncStatus,

  // Factories
  generateId,
  now,
  createAddress,
  createCompany,
  createCustomer,
  createProduct,
  createAccount,
  createVatCode,
  createInvoiceLine,
  createInvoice,
  createPayment,
  createPaymentAllocation,
  createJournalLine,
  createJournalEntry,
  createSyncJob,
  createAuditEvent,

  // Validation
  isValidCvr,
  isValidDanishVat,
  isValidEmail,
  validateInvoice,
  validateJournalEntry
};
