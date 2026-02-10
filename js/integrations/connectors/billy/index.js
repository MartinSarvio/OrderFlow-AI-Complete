/**
 * Billy Connector Implementation
 * Integration with Billy REST API v2
 * @module integrations/connectors/billy
 * @version 1.0.0
 *
 * API Documentation: https://www.billy.dk/api
 */

import { BaseConnector } from '../../core/connector.js';
import {
  mapBillyCustomerToCanonical,
  mapCanonicalCustomerToBilly,
  mapBillyInvoiceToCanonical,
  mapCanonicalInvoiceToBilly,
  mapBillyProductToCanonical
} from './mappers.js';

export class BillyConnector extends BaseConnector {
  constructor(config) {
    const baseConfig = {
      baseUrl: 'https://api.billysbilling.com/v2',
      rateLimit: 120,
      timeout: 30000,
      ...config
    };

    super(baseConfig);

    this.name = 'billy';
    this.version = '1.0.0';

    if (!config.apiToken) throw new Error('apiToken is required for Billy connector');

    this._apiToken = config.apiToken;
    this._companyInfo = null;
  }

  async connect() {
    try {
      const response = await this._request('GET', '/organization');
      this._companyInfo = response.organization;
      this._isConnected = true;
      return true;
    } catch (error) {
      this._isConnected = false;
      throw new Error(`Failed to connect to Billy: ${error.message}`);
    }
  }

  async disconnect() {
    this._isConnected = false;
    this._companyInfo = null;
  }

  async testConnection() {
    try {
      const response = await this._request('GET', '/organization');
      return { valid: true, message: `Connected to ${response.organization?.name || 'Billy'}`, company: { name: response.organization?.name } };
    } catch (error) {
      return { valid: false, message: error.message };
    }
  }

  getCompanyInfo() { return this._companyInfo; }

  _getAuthHeaders() {
    return { 'X-Access-Token': this._apiToken };
  }

  // ============ CUSTOMERS (CONTACTS) ============

  async listCustomers(options = {}) {
    const response = await this._request('GET', '/contacts', { params: { isCustomer: true } });
    const data = (response.contacts || []).map(mapBillyCustomerToCanonical);
    return { data, hasMore: false };
  }

  async getCustomer(contactId) {
    const response = await this._request('GET', `/contacts/${contactId}`);
    return mapBillyCustomerToCanonical(response.contact);
  }

  async createCustomer(canonicalCustomer) {
    const billyData = mapCanonicalCustomerToBilly(canonicalCustomer);
    const response = await this._request('POST', '/contacts', { body: { contact: billyData } });
    return mapBillyCustomerToCanonical(response.contacts[0]);
  }

  // ============ INVOICES ============

  async listInvoices(options = {}) {
    const params = {};
    if (options.startDate) params.createdAfter = options.startDate;
    const response = await this._request('GET', '/invoices', { params });
    const data = (response.invoices || []).map(mapBillyInvoiceToCanonical);
    return { data, hasMore: false };
  }

  async getInvoice(invoiceId) {
    const response = await this._request('GET', `/invoices/${invoiceId}`);
    return mapBillyInvoiceToCanonical(response.invoice);
  }

  async createInvoice(canonicalInvoice) {
    const billyData = mapCanonicalInvoiceToBilly(canonicalInvoice);
    const response = await this._request('POST', '/invoices', { body: { invoice: billyData } });
    return mapBillyInvoiceToCanonical(response.invoices[0]);
  }

  // ============ PRODUCTS ============

  async listProducts(options = {}) {
    const response = await this._request('GET', '/products');
    const data = (response.products || []).map(mapBillyProductToCanonical);
    return { data, hasMore: false };
  }
}
