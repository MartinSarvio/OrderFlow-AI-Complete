/**
 * Visma.net Connector Implementation
 * Integration with Visma.net ERP REST API
 * @module integrations/connectors/visma
 * @version 1.0.0
 *
 * API Documentation: https://integration.visma.net/API-index/
 */

import { BaseConnector } from '../../core/connector.js';
import {
  mapVismaCustomerToCanonical,
  mapCanonicalCustomerToVisma,
  mapVismaInvoiceToCanonical,
  mapCanonicalInvoiceToVisma
} from './mappers.js';

export class VismaConnector extends BaseConnector {
  constructor(config) {
    const baseConfig = {
      baseUrl: 'https://integration.visma.net/API',
      rateLimit: 100,
      timeout: 30000,
      ...config
    };

    super(baseConfig);

    this.name = 'visma';
    this.version = '1.0.0';

    if (!config.bearerToken) throw new Error('bearerToken is required for Visma.net connector');

    this._bearerToken = config.bearerToken;
    this._companyInfo = null;
  }

  async connect() {
    try {
      const response = await this._request('GET', '/controller/api/v1/company');
      this._companyInfo = response;
      this._isConnected = true;
      return true;
    } catch (error) {
      this._isConnected = false;
      throw new Error(`Failed to connect to Visma.net: ${error.message}`);
    }
  }

  async disconnect() {
    this._isConnected = false;
    this._companyInfo = null;
  }

  async testConnection() {
    try {
      const response = await this._request('GET', '/controller/api/v1/company');
      return { valid: true, message: `Connected to ${response.name || 'Visma.net'}`, company: { name: response.name } };
    } catch (error) {
      return { valid: false, message: error.message };
    }
  }

  getCompanyInfo() { return this._companyInfo; }

  _getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this._bearerToken}`,
      'ipp-company-id': this._companyInfo?.number || ''
    };
  }

  // ============ CUSTOMERS ============

  async listCustomers(options = {}) {
    const params = { pageSize: options.pageSize || 100, pageNumber: options.page || 1 };
    const response = await this._request('GET', '/controller/api/v1/customer', { params });
    const data = (Array.isArray(response) ? response : []).map(mapVismaCustomerToCanonical);
    return { data, hasMore: data.length === params.pageSize };
  }

  async getCustomer(customerNumber) {
    const response = await this._request('GET', `/controller/api/v1/customer/${customerNumber}`);
    return mapVismaCustomerToCanonical(response);
  }

  async createCustomer(canonicalCustomer) {
    const vismaData = mapCanonicalCustomerToVisma(canonicalCustomer);
    const response = await this._request('POST', '/controller/api/v1/customer', { body: vismaData });
    return mapVismaCustomerToCanonical(response);
  }

  // ============ INVOICES ============

  async listInvoices(options = {}) {
    const params = { pageSize: options.pageSize || 100, pageNumber: options.page || 1 };
    const response = await this._request('GET', '/controller/api/v1/customerInvoice', { params });
    const data = (Array.isArray(response) ? response : []).map(mapVismaInvoiceToCanonical);
    return { data, hasMore: data.length === params.pageSize };
  }

  async createInvoice(canonicalInvoice) {
    const vismaData = mapCanonicalInvoiceToVisma(canonicalInvoice);
    const response = await this._request('POST', '/controller/api/v1/customerInvoice', { body: vismaData });
    return mapVismaInvoiceToCanonical(response);
  }
}
