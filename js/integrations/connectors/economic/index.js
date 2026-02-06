/**
 * e-conomic Connector Implementation
 * Full integration with e-conomic REST API
 * @module integrations/connectors/economic
 * @version 1.0.0
 *
 * API Documentation: https://restdocs.e-conomic.com/
 */

import { BaseConnector } from '../../core/connector.js';
import {
  mapEconomicCustomerToCanonical,
  mapCanonicalCustomerToEconomic,
  mapEconomicProductToCanonical,
  mapCanonicalProductToEconomic,
  mapEconomicAccountToCanonical,
  mapEconomicVatToCanonical,
  mapEconomicInvoiceToCanonical,
  mapCanonicalInvoiceToEconomic,
  mapEconomicPaymentToCanonical,
  mapCanonicalPaymentToEconomic
} from './mappers.js';

/**
 * @typedef {Object} EconomicConfig
 * @property {string} appSecretToken - X-AppSecretToken header value
 * @property {string} agreementGrantToken - X-AgreementGrantToken header value
 * @property {boolean} [demo=false] - Use demo/sandbox environment
 * @property {number} [rateLimit=300] - Requests per minute (e-conomic limit)
 */

/**
 * e-conomic REST API Connector
 * @extends BaseConnector
 */
export class EconomicConnector extends BaseConnector {
  /**
   * @param {EconomicConfig} config
   */
  constructor(config) {
    const baseConfig = {
      baseUrl: 'https://restapi.e-conomic.com',
      rateLimit: 300, // e-conomic allows ~300 req/min
      timeout: 30000,
      ...config
    };

    super(baseConfig);

    this.name = 'economic';
    this.version = '1.0.0';

    // Validate required auth tokens
    if (!config.appSecretToken) {
      throw new Error('appSecretToken is required for e-conomic connector');
    }
    if (!config.agreementGrantToken) {
      throw new Error('agreementGrantToken is required for e-conomic connector');
    }

    this._appSecretToken = config.appSecretToken;
    this._agreementGrantToken = config.agreementGrantToken;
    this._companyInfo = null;
  }

  // ============ CONNECTION ============

  /**
   * Connect and validate credentials
   * @returns {Promise<boolean>}
   */
  async connect() {
    try {
      // Validate credentials by fetching self/company info
      const response = await this._request('GET', '/self');
      this._companyInfo = response;
      this._isConnected = true;
      this._debug('Connected to e-conomic:', response.company?.name);
      return true;
    } catch (error) {
      this._isConnected = false;
      throw new Error(`Failed to connect to e-conomic: ${error.message}`);
    }
  }

  /**
   * Disconnect from e-conomic
   * @returns {Promise<void>}
   */
  async disconnect() {
    this._isConnected = false;
    this._companyInfo = null;
  }

  /**
   * Test connection validity
   * @returns {Promise<{valid: boolean, message: string, company?: Object}>}
   */
  async testConnection() {
    try {
      const response = await this._request('GET', '/self');
      return {
        valid: true,
        message: `Connected to ${response.company?.name || 'e-conomic'}`,
        company: {
          name: response.company?.name,
          agreementNumber: response.agreementNumber,
          vatNumber: response.company?.vatNumber
        }
      };
    } catch (error) {
      return {
        valid: false,
        message: error.message
      };
    }
  }

  /**
   * Get company information
   * @returns {Object|null}
   */
  getCompanyInfo() {
    return this._companyInfo;
  }

  // ============ AUTH ============

  /**
   * Get authentication headers for e-conomic
   * @protected
   * @returns {Object}
   */
  _getAuthHeaders() {
    return {
      'X-AppSecretToken': this._appSecretToken,
      'X-AgreementGrantToken': this._agreementGrantToken
    };
  }

  // ============ CUSTOMERS ============

  /**
   * List all customers with pagination
   * @param {Object} [options]
   * @param {number} [options.pageSize=1000]
   * @param {number} [options.skipPages=0]
   * @param {string} [options.filter] - OData filter
   * @returns {Promise<{data: Array, hasMore: boolean, cursor?: string}>}
   */
  async listCustomers(options = {}) {
    const params = {
      pagesize: options.pageSize || 1000,
      skippages: options.skipPages || 0
    };

    if (options.filter) {
      params.filter = options.filter;
    }

    const response = await this._request('GET', '/customers', { params });

    const data = (response.collection || []).map(mapEconomicCustomerToCanonical);

    return {
      data,
      hasMore: response.pagination?.nextPage != null,
      cursor: response.pagination?.nextPage ? String(response.pagination.skipPages + 1) : null
    };
  }

  /**
   * Get a single customer by customer number
   * @param {string|number} customerNumber
   * @returns {Promise<Object>}
   */
  async getCustomer(customerNumber) {
    const response = await this._request('GET', `/customers/${customerNumber}`);
    return mapEconomicCustomerToCanonical(response);
  }

  /**
   * Create a new customer
   * @param {Object} customer - Customer in canonical format
   * @returns {Promise<{id: string, externalId: string, data: Object}>}
   */
  async createCustomer(customer) {
    const payload = mapCanonicalCustomerToEconomic(customer);
    const response = await this._request('POST', '/customers', { body: payload });

    return {
      id: customer.id,
      externalId: String(response.customerNumber),
      data: mapEconomicCustomerToCanonical(response)
    };
  }

  /**
   * Update an existing customer
   * @param {string|number} customerNumber
   * @param {Object} customer - Customer data to update
   * @returns {Promise<Object>}
   */
  async updateCustomer(customerNumber, customer) {
    // Get existing customer to preserve required fields
    const existing = await this._request('GET', `/customers/${customerNumber}`);
    const payload = mapCanonicalCustomerToEconomic(customer, existing);

    const response = await this._request('PUT', `/customers/${customerNumber}`, {
      body: payload
    });

    return mapEconomicCustomerToCanonical(response);
  }

  /**
   * Delete (bar) a customer
   * Note: e-conomic doesn't allow deletion, only barring
   * @param {string|number} customerNumber
   * @returns {Promise<boolean>}
   */
  async deleteCustomer(customerNumber) {
    // Bar the customer instead of deleting
    await this._request('PUT', `/customers/${customerNumber}`, {
      body: { barred: true }
    });
    return true;
  }

  /**
   * Search customers by query
   * @param {string} query - Search query
   * @returns {Promise<{data: Array}>}
   */
  async searchCustomers(query) {
    const filter = `name$like:${encodeURIComponent(query)}`;
    return this.listCustomers({ filter });
  }

  // ============ PRODUCTS ============

  /**
   * List all products with pagination
   * @param {Object} [options]
   * @returns {Promise<{data: Array, hasMore: boolean, cursor?: string}>}
   */
  async listProducts(options = {}) {
    const params = {
      pagesize: options.pageSize || 1000,
      skippages: options.skipPages || 0
    };

    const response = await this._request('GET', '/products', { params });

    const data = (response.collection || []).map(mapEconomicProductToCanonical);

    return {
      data,
      hasMore: response.pagination?.nextPage != null,
      cursor: response.pagination?.nextPage ? String(response.pagination.skipPages + 1) : null
    };
  }

  /**
   * Get a single product
   * @param {string} productNumber
   * @returns {Promise<Object>}
   */
  async getProduct(productNumber) {
    const response = await this._request('GET', `/products/${productNumber}`);
    return mapEconomicProductToCanonical(response);
  }

  /**
   * Create a new product
   * @param {Object} product - Product in canonical format
   * @returns {Promise<{id: string, externalId: string, data: Object}>}
   */
  async createProduct(product) {
    const payload = mapCanonicalProductToEconomic(product);
    const response = await this._request('POST', '/products', { body: payload });

    return {
      id: product.id,
      externalId: response.productNumber,
      data: mapEconomicProductToCanonical(response)
    };
  }

  /**
   * Update an existing product
   * @param {string} productNumber
   * @param {Object} product
   * @returns {Promise<Object>}
   */
  async updateProduct(productNumber, product) {
    const payload = mapCanonicalProductToEconomic(product);
    const response = await this._request('PUT', `/products/${productNumber}`, {
      body: payload
    });

    return mapEconomicProductToCanonical(response);
  }

  // ============ ACCOUNTS ============

  /**
   * List chart of accounts
   * @param {Object} [options]
   * @returns {Promise<{data: Array}>}
   */
  async listAccounts(options = {}) {
    const params = {
      pagesize: options.pageSize || 1000,
      skippages: options.skipPages || 0
    };

    const response = await this._request('GET', '/accounts', { params });

    const data = (response.collection || []).map(mapEconomicAccountToCanonical);

    return { data };
  }

  /**
   * Get account by number
   * @param {string|number} accountNumber
   * @returns {Promise<Object>}
   */
  async getAccount(accountNumber) {
    const response = await this._request('GET', `/accounts/${accountNumber}`);
    return mapEconomicAccountToCanonical(response);
  }

  // ============ VAT CODES ============

  /**
   * List VAT accounts (Danish momskoder)
   * @returns {Promise<{data: Array}>}
   */
  async listVatCodes() {
    const response = await this._request('GET', '/vat-accounts', {
      params: { pagesize: 1000 }
    });

    const data = (response.collection || []).map(mapEconomicVatToCanonical);

    return { data };
  }

  /**
   * List VAT zones
   * @returns {Promise<{data: Array}>}
   */
  async listVatZones() {
    const response = await this._request('GET', '/vat-zones');
    return { data: response.collection || [] };
  }

  // ============ INVOICES ============

  /**
   * List all booked invoices
   * @param {Object} [options]
   * @returns {Promise<{data: Array, hasMore: boolean, cursor?: string}>}
   */
  async listInvoices(options = {}) {
    const params = {
      pagesize: options.pageSize || 1000,
      skippages: options.skipPages || 0
    };

    if (options.filter) {
      params.filter = options.filter;
    }

    const response = await this._request('GET', '/invoices/booked', { params });

    const data = (response.collection || []).map(mapEconomicInvoiceToCanonical);

    return {
      data,
      hasMore: response.pagination?.nextPage != null,
      cursor: response.pagination?.nextPage ? String(response.pagination.skipPages + 1) : null
    };
  }

  /**
   * List draft invoices
   * @param {Object} [options]
   * @returns {Promise<{data: Array, hasMore: boolean}>}
   */
  async listDraftInvoices(options = {}) {
    const params = {
      pagesize: options.pageSize || 1000,
      skippages: options.skipPages || 0
    };

    const response = await this._request('GET', '/invoices/drafts', { params });

    const data = (response.collection || []).map(inv => ({
      ...mapEconomicInvoiceToCanonical(inv),
      status: 'draft'
    }));

    return {
      data,
      hasMore: response.pagination?.nextPage != null
    };
  }

  /**
   * Get a booked invoice by number
   * @param {string|number} invoiceNumber
   * @returns {Promise<Object>}
   */
  async getInvoice(invoiceNumber) {
    const response = await this._request('GET', `/invoices/booked/${invoiceNumber}`);
    return mapEconomicInvoiceToCanonical(response);
  }

  /**
   * Get a draft invoice by number
   * @param {string|number} draftNumber
   * @returns {Promise<Object>}
   */
  async getDraftInvoice(draftNumber) {
    const response = await this._request('GET', `/invoices/drafts/${draftNumber}`);
    return {
      ...mapEconomicInvoiceToCanonical(response),
      status: 'draft'
    };
  }

  /**
   * Create a draft invoice
   * @param {Object} invoice - Invoice in canonical format
   * @param {Object} options
   * @param {number} options.customerNumber - e-conomic customer number
   * @returns {Promise<{id: string, externalId: string, data: Object}>}
   */
  async createInvoice(invoice, options = {}) {
    if (!options.customerNumber) {
      throw new Error('customerNumber is required to create invoice in e-conomic');
    }

    const payload = mapCanonicalInvoiceToEconomic(invoice, options);
    const response = await this._request('POST', '/invoices/drafts', { body: payload });

    return {
      id: invoice.id,
      externalId: String(response.draftInvoiceNumber),
      data: {
        ...mapEconomicInvoiceToCanonical(response),
        status: 'draft'
      }
    };
  }

  /**
   * Update a draft invoice
   * @param {string|number} draftNumber
   * @param {Object} invoice
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async updateDraftInvoice(draftNumber, invoice, options = {}) {
    const payload = mapCanonicalInvoiceToEconomic(invoice, options);
    const response = await this._request('PUT', `/invoices/drafts/${draftNumber}`, {
      body: payload
    });

    return {
      ...mapEconomicInvoiceToCanonical(response),
      status: 'draft'
    };
  }

  /**
   * Book (finalize) a draft invoice
   * @param {string|number} draftNumber - Draft invoice number
   * @returns {Promise<{id: string, invoiceNumber: string, data: Object}>}
   */
  async bookInvoice(draftNumber) {
    // Send empty POST to book endpoint
    const response = await this._request('POST', `/invoices/drafts/${draftNumber}/book`);

    return {
      id: String(draftNumber),
      invoiceNumber: String(response.bookedInvoiceNumber),
      data: mapEconomicInvoiceToCanonical(response)
    };
  }

  /**
   * Delete a draft invoice
   * @param {string|number} draftNumber
   * @returns {Promise<boolean>}
   */
  async deleteDraftInvoice(draftNumber) {
    await this._request('DELETE', `/invoices/drafts/${draftNumber}`);
    return true;
  }

  /**
   * Void a booked invoice (not directly supported - use credit note)
   * @param {string|number} invoiceNumber
   * @param {string} [reason]
   * @returns {Promise<boolean>}
   */
  async voidInvoice(invoiceNumber, reason) {
    // e-conomic doesn't support voiding invoices directly
    // You need to create a credit note instead
    throw new Error(
      'e-conomic does not support voiding booked invoices. ' +
      'Create a credit note instead using createCreditNote()'
    );
  }

  /**
   * Create a credit note for an invoice
   * @param {string|number} invoiceNumber - Original invoice number
   * @returns {Promise<Object>}
   */
  async createCreditNote(invoiceNumber) {
    // Get the original invoice
    const original = await this._request('GET', `/invoices/booked/${invoiceNumber}`);

    // Create draft credit note with negative amounts
    const creditLines = (original.lines || []).map(line => ({
      ...line,
      quantity: -Math.abs(line.quantity)
    }));

    const creditDraft = {
      ...original,
      lines: creditLines,
      references: {
        other: `Kreditnota for faktura ${invoiceNumber}`
      }
    };

    delete creditDraft.bookedInvoiceNumber;
    delete creditDraft.pdf;
    delete creditDraft.sent;

    // Create and book the credit note
    const draft = await this._request('POST', '/invoices/drafts', { body: creditDraft });
    const booked = await this._request('POST', `/invoices/drafts/${draft.draftInvoiceNumber}/book`);

    return mapEconomicInvoiceToCanonical(booked);
  }

  // ============ PAYMENTS ============

  /**
   * List customer payments
   * @param {Object} [options]
   * @returns {Promise<{data: Array, hasMore: boolean, cursor?: string}>}
   */
  async listPayments(options = {}) {
    const params = {
      pagesize: options.pageSize || 1000,
      skippages: options.skipPages || 0
    };

    // Filter by customer if provided
    if (options.customerNumber) {
      params.filter = `customer.customerNumber$eq:${options.customerNumber}`;
    }

    const response = await this._request('GET', '/customer-payments', { params });

    const data = (response.collection || []).map(mapEconomicPaymentToCanonical);

    return {
      data,
      hasMore: response.pagination?.nextPage != null,
      cursor: response.pagination?.nextPage ? String(response.pagination.skipPages + 1) : null
    };
  }

  /**
   * Register a customer payment
   * @param {Object} payment - Payment in canonical format
   * @param {Object} options
   * @param {number} options.customerNumber - e-conomic customer number
   * @returns {Promise<{id: string, externalId: string, data: Object}>}
   */
  async createPayment(payment, options = {}) {
    if (!options.customerNumber) {
      throw new Error('customerNumber is required to create payment in e-conomic');
    }

    const payload = mapCanonicalPaymentToEconomic(payment, options);
    const response = await this._request('POST', '/customer-payments', { body: payload });

    return {
      id: payment.id,
      externalId: String(response.customerPaymentNumber),
      data: mapEconomicPaymentToCanonical(response)
    };
  }

  // ============ JOURNALS ============

  /**
   * List journals
   * @returns {Promise<{data: Array}>}
   */
  async listJournals() {
    const response = await this._request('GET', '/journals-experimental');
    return { data: response.collection || [] };
  }

  /**
   * Get vouchers in a journal
   * @param {number} journalNumber
   * @param {Object} [options]
   * @returns {Promise<{data: Array}>}
   */
  async listJournalVouchers(journalNumber, options = {}) {
    const params = {
      pagesize: options.pageSize || 1000,
      skippages: options.skipPages || 0
    };

    const response = await this._request(
      'GET',
      `/journals-experimental/${journalNumber}/vouchers`,
      { params }
    );

    return { data: response.collection || [] };
  }

  /**
   * Create a journal voucher (manual posting)
   * @param {number} journalNumber
   * @param {Object} voucher
   * @returns {Promise<Object>}
   */
  async createJournalVoucher(journalNumber, voucher) {
    const response = await this._request(
      'POST',
      `/journals-experimental/${journalNumber}/vouchers`,
      { body: voucher }
    );

    return response;
  }

  // ============ UTILITY ============

  /**
   * Get invoice PDF
   * @param {string|number} invoiceNumber
   * @returns {Promise<{pdf: string, filename: string}>} Base64 encoded PDF
   */
  async getInvoicePdf(invoiceNumber) {
    const response = await this._request('GET', `/invoices/booked/${invoiceNumber}/pdf`);
    return {
      pdf: response.pdf,
      filename: `invoice-${invoiceNumber}.pdf`
    };
  }

  /**
   * Send invoice by email
   * @param {string|number} invoiceNumber
   * @param {string} email - Recipient email
   * @returns {Promise<boolean>}
   */
  async sendInvoiceEmail(invoiceNumber, email) {
    await this._request('POST', `/invoices/booked/${invoiceNumber}/send`, {
      body: {
        sendTo: email
      }
    });
    return true;
  }

  /**
   * Check if a period is locked
   * @param {string} date - Date to check (YYYY-MM-DD)
   * @returns {Promise<boolean>}
   */
  async isPeriodLocked(date) {
    try {
      const response = await this._request('GET', '/self');
      const closedDate = response.settings?.closedForInvoices;

      if (!closedDate) return false;

      return new Date(date) <= new Date(closedDate);
    } catch {
      return false;
    }
  }

  /**
   * Get next available customer number
   * @returns {Promise<number>}
   */
  async getNextCustomerNumber() {
    const response = await this._request('GET', '/customers', {
      params: { pagesize: 1, sort: '-customerNumber' }
    });

    const lastCustomer = response.collection?.[0];
    return lastCustomer ? lastCustomer.customerNumber + 1 : 1;
  }

  /**
   * Get next available invoice number
   * @returns {Promise<number>}
   */
  async getNextInvoiceNumber() {
    const response = await this._request('GET', '/invoices/booked', {
      params: { pagesize: 1, sort: '-bookedInvoiceNumber' }
    });

    const lastInvoice = response.collection?.[0];
    return lastInvoice ? lastInvoice.bookedInvoiceNumber + 1 : 1;
  }
}

export default EconomicConnector;
