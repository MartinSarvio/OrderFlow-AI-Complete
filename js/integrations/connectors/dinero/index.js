/**
 * Dinero Connector Implementation
 * Integration with Dinero REST API v1
 * @module integrations/connectors/dinero
 * @version 1.0.0
 *
 * API Documentation: https://api.dinero.dk/docs
 */

import { BaseConnector } from '../../core/connector.js';
import {
  mapDineroCustomerToCanonical,
  mapCanonicalCustomerToDinero,
  mapDineroInvoiceToCanonical,
  mapCanonicalInvoiceToDinero,
  mapDineroProductToCanonical
} from './mappers.js';

export class DineroConnector extends BaseConnector {
  constructor(config) {
    const baseConfig = {
      baseUrl: 'https://api.dinero.dk/v1',
      rateLimit: 100,
      timeout: 30000,
      ...config
    };

    super(baseConfig);

    this.name = 'dinero';
    this.version = '1.0.0';

    if (!config.apiKey) throw new Error('apiKey is required for Dinero connector');
    if (!config.organizationId) throw new Error('organizationId is required for Dinero connector');

    this._apiKey = config.apiKey;
    this._organizationId = config.organizationId;
    this._companyInfo = null;
  }

  async connect() {
    try {
      const response = await this._request('GET', `/${this._organizationId}/organizations`);
      this._companyInfo = response;
      this._isConnected = true;
      return true;
    } catch (error) {
      this._isConnected = false;
      throw new Error(`Failed to connect to Dinero: ${error.message}`);
    }
  }

  async disconnect() {
    this._isConnected = false;
    this._companyInfo = null;
  }

  async testConnection() {
    try {
      const response = await this._request('GET', `/${this._organizationId}/organizations`);
      return { valid: true, message: `Connected to ${response.Name || 'Dinero'}`, company: { name: response.Name } };
    } catch (error) {
      return { valid: false, message: error.message };
    }
  }

  getCompanyInfo() { return this._companyInfo; }

  _getAuthHeaders() {
    return { 'Authorization': `Bearer ${this._apiKey}` };
  }

  // ============ CUSTOMERS ============

  async listCustomers(options = {}) {
    const params = { page: options.page || 0, pageSize: options.pageSize || 100 };
    const response = await this._request('GET', `/${this._organizationId}/contacts`, { params });
    const data = (response.Collection || []).map(mapDineroCustomerToCanonical);
    return { data, hasMore: data.length === params.pageSize, cursor: data.length === params.pageSize ? String(params.page + 1) : null };
  }

  async getCustomer(contactGuid) {
    const response = await this._request('GET', `/${this._organizationId}/contacts/${contactGuid}`);
    return mapDineroCustomerToCanonical(response);
  }

  async createCustomer(canonicalCustomer) {
    const dineroData = mapCanonicalCustomerToDinero(canonicalCustomer);
    const response = await this._request('POST', `/${this._organizationId}/contacts`, { body: dineroData });
    return mapDineroCustomerToCanonical(response);
  }

  // ============ INVOICES ============

  async listInvoices(options = {}) {
    const params = { page: options.page || 0, pageSize: options.pageSize || 100 };
    if (options.startDate) params.startDate = options.startDate;
    if (options.endDate) params.endDate = options.endDate;
    const response = await this._request('GET', `/${this._organizationId}/invoices`, { params });
    const data = (response.Collection || []).map(mapDineroInvoiceToCanonical);
    return { data, hasMore: data.length === params.pageSize };
  }

  async getInvoice(invoiceGuid) {
    const response = await this._request('GET', `/${this._organizationId}/invoices/${invoiceGuid}`);
    return mapDineroInvoiceToCanonical(response);
  }

  async createInvoice(canonicalInvoice) {
    const dineroData = mapCanonicalInvoiceToDinero(canonicalInvoice);
    const response = await this._request('POST', `/${this._organizationId}/invoices`, { body: dineroData });
    return mapDineroInvoiceToCanonical(response);
  }

  // ============ PRODUCTS ============

  async listProducts(options = {}) {
    const params = { page: options.page || 0, pageSize: options.pageSize || 100 };
    const response = await this._request('GET', `/${this._organizationId}/products`, { params });
    const data = (response.Collection || []).map(mapDineroProductToCanonical);
    return { data, hasMore: data.length === params.pageSize };
  }
}
