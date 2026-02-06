/**
 * Base Connector Class for Accounting System Integrations
 * @module integrations/core/connector
 * @version 1.0.0
 */

/**
 * @typedef {Object} ConnectorConfig
 * @property {string} baseUrl - API base URL
 * @property {Object} auth - Authentication configuration
 * @property {number} [rateLimit=60] - Requests per minute
 * @property {number} [timeout=30000] - Request timeout in ms
 * @property {boolean} [debug=false] - Enable debug logging
 */

/**
 * @typedef {Object} SyncResult
 * @property {boolean} success
 * @property {number} recordsProcessed
 * @property {number} recordsSucceeded
 * @property {number} recordsFailed
 * @property {Array<SyncError>} errors
 * @property {string} [nextCursor]
 */

/**
 * @typedef {Object} SyncError
 * @property {string} entityType
 * @property {string} entityId
 * @property {string} errorCode
 * @property {string} errorMessage
 * @property {boolean} retryable
 */

/**
 * Abstract base class for all accounting system connectors
 * @abstract
 */
export class BaseConnector {
  /**
   * @param {ConnectorConfig} config
   */
  constructor(config) {
    if (this.constructor === BaseConnector) {
      throw new Error('BaseConnector is abstract and cannot be instantiated directly');
    }

    this.config = {
      rateLimit: 60,
      timeout: 30000,
      debug: false,
      ...config
    };

    this.name = 'base';
    this.version = '1.0.0';
    this._requestCount = 0;
    this._requestWindowStart = Date.now();
    this._isConnected = false;
  }

  /**
   * Get connector name
   * @returns {string}
   */
  getName() {
    return this.name;
  }

  /**
   * Get connector version
   * @returns {string}
   */
  getVersion() {
    return this.version;
  }

  /**
   * Check if connector is connected
   * @returns {boolean}
   */
  isConnected() {
    return this._isConnected;
  }

  /**
   * Initialize connection and validate credentials
   * @abstract
   * @returns {Promise<boolean>}
   */
  async connect() {
    throw new Error('connect() must be implemented by subclass');
  }

  /**
   * Close connection and cleanup
   * @abstract
   * @returns {Promise<void>}
   */
  async disconnect() {
    throw new Error('disconnect() must be implemented by subclass');
  }

  /**
   * Test connection validity
   * @abstract
   * @returns {Promise<{valid: boolean, message: string}>}
   */
  async testConnection() {
    throw new Error('testConnection() must be implemented by subclass');
  }

  // ============ CUSTOMER OPERATIONS ============

  /**
   * List all customers
   * @abstract
   * @param {Object} [options] - Pagination and filter options
   * @param {number} [options.page=1]
   * @param {number} [options.pageSize=100]
   * @param {string} [options.cursor]
   * @returns {Promise<{data: Array, hasMore: boolean, cursor?: string}>}
   */
  async listCustomers(options = {}) {
    throw new Error('listCustomers() must be implemented by subclass');
  }

  /**
   * Get a single customer by ID
   * @abstract
   * @param {string} id - External ID in the accounting system
   * @returns {Promise<Object>}
   */
  async getCustomer(id) {
    throw new Error('getCustomer() must be implemented by subclass');
  }

  /**
   * Create a new customer
   * @abstract
   * @param {Object} customer - Customer data in canonical format
   * @returns {Promise<{id: string, externalId: string, data: Object}>}
   */
  async createCustomer(customer) {
    throw new Error('createCustomer() must be implemented by subclass');
  }

  /**
   * Update an existing customer
   * @abstract
   * @param {string} id - External ID
   * @param {Object} customer - Customer data to update
   * @returns {Promise<Object>}
   */
  async updateCustomer(id, customer) {
    throw new Error('updateCustomer() must be implemented by subclass');
  }

  /**
   * Delete/deactivate a customer
   * @abstract
   * @param {string} id - External ID
   * @returns {Promise<boolean>}
   */
  async deleteCustomer(id) {
    throw new Error('deleteCustomer() must be implemented by subclass');
  }

  // ============ INVOICE OPERATIONS ============

  /**
   * List all invoices
   * @abstract
   * @param {Object} [options] - Pagination and filter options
   * @returns {Promise<{data: Array, hasMore: boolean, cursor?: string}>}
   */
  async listInvoices(options = {}) {
    throw new Error('listInvoices() must be implemented by subclass');
  }

  /**
   * Get a single invoice by ID
   * @abstract
   * @param {string} id - External ID
   * @returns {Promise<Object>}
   */
  async getInvoice(id) {
    throw new Error('getInvoice() must be implemented by subclass');
  }

  /**
   * Create a draft invoice
   * @abstract
   * @param {Object} invoice - Invoice data in canonical format
   * @returns {Promise<{id: string, externalId: string, data: Object}>}
   */
  async createInvoice(invoice) {
    throw new Error('createInvoice() must be implemented by subclass');
  }

  /**
   * Book/finalize a draft invoice
   * @abstract
   * @param {string} draftId - Draft invoice ID
   * @returns {Promise<{id: string, invoiceNumber: string, data: Object}>}
   */
  async bookInvoice(draftId) {
    throw new Error('bookInvoice() must be implemented by subclass');
  }

  /**
   * Void/cancel an invoice
   * @abstract
   * @param {string} id - Invoice ID
   * @param {string} [reason] - Reason for voiding
   * @returns {Promise<boolean>}
   */
  async voidInvoice(id, reason) {
    throw new Error('voidInvoice() must be implemented by subclass');
  }

  // ============ PAYMENT OPERATIONS ============

  /**
   * List all payments
   * @abstract
   * @param {Object} [options] - Pagination and filter options
   * @returns {Promise<{data: Array, hasMore: boolean, cursor?: string}>}
   */
  async listPayments(options = {}) {
    throw new Error('listPayments() must be implemented by subclass');
  }

  /**
   * Register a payment
   * @abstract
   * @param {Object} payment - Payment data
   * @returns {Promise<{id: string, externalId: string, data: Object}>}
   */
  async createPayment(payment) {
    throw new Error('createPayment() must be implemented by subclass');
  }

  // ============ ACCOUNT OPERATIONS ============

  /**
   * List chart of accounts
   * @abstract
   * @param {Object} [options]
   * @returns {Promise<{data: Array}>}
   */
  async listAccounts(options = {}) {
    throw new Error('listAccounts() must be implemented by subclass');
  }

  /**
   * Get account by number
   * @abstract
   * @param {string} accountNumber
   * @returns {Promise<Object>}
   */
  async getAccount(accountNumber) {
    throw new Error('getAccount() must be implemented by subclass');
  }

  // ============ VAT OPERATIONS ============

  /**
   * List VAT codes
   * @abstract
   * @returns {Promise<{data: Array}>}
   */
  async listVatCodes() {
    throw new Error('listVatCodes() must be implemented by subclass');
  }

  // ============ PRODUCT OPERATIONS ============

  /**
   * List all products
   * @abstract
   * @param {Object} [options]
   * @returns {Promise<{data: Array, hasMore: boolean, cursor?: string}>}
   */
  async listProducts(options = {}) {
    throw new Error('listProducts() must be implemented by subclass');
  }

  /**
   * Get a single product
   * @abstract
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async getProduct(id) {
    throw new Error('getProduct() must be implemented by subclass');
  }

  /**
   * Create a product
   * @abstract
   * @param {Object} product
   * @returns {Promise<{id: string, externalId: string, data: Object}>}
   */
  async createProduct(product) {
    throw new Error('createProduct() must be implemented by subclass');
  }

  // ============ SYNC OPERATIONS ============

  /**
   * Sync all entities of a type
   * @param {string} entityType - 'customer' | 'invoice' | 'payment' | 'product'
   * @param {Object} [options]
   * @returns {Promise<SyncResult>}
   */
  async syncEntity(entityType, options = {}) {
    const methodMap = {
      customer: 'listCustomers',
      invoice: 'listInvoices',
      payment: 'listPayments',
      product: 'listProducts'
    };

    const method = methodMap[entityType];
    if (!method) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    const result = {
      success: true,
      recordsProcessed: 0,
      recordsSucceeded: 0,
      recordsFailed: 0,
      errors: []
    };

    try {
      let hasMore = true;
      let cursor = options.cursor;

      while (hasMore) {
        const response = await this[method]({ ...options, cursor });
        result.recordsProcessed += response.data.length;
        result.recordsSucceeded += response.data.length;
        hasMore = response.hasMore;
        cursor = response.cursor;
        result.nextCursor = cursor;
      }
    } catch (error) {
      result.success = false;
      result.errors.push({
        entityType,
        entityId: null,
        errorCode: error.code || 'SYNC_ERROR',
        errorMessage: error.message,
        retryable: this._isRetryableError(error)
      });
    }

    return result;
  }

  // ============ UTILITY METHODS ============

  /**
   * Make an authenticated HTTP request with rate limiting
   * @protected
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint (relative to baseUrl)
   * @param {Object} [options]
   * @param {Object} [options.body] - Request body
   * @param {Object} [options.headers] - Additional headers
   * @param {Object} [options.params] - Query parameters
   * @returns {Promise<Object>}
   */
  async _request(method, endpoint, options = {}) {
    await this._checkRateLimit();

    const url = new URL(endpoint, this.config.baseUrl);

    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      });
    }

    const headers = {
      'Content-Type': 'application/json',
      ...this._getAuthHeaders(),
      ...options.headers
    };

    const fetchOptions = {
      method,
      headers,
      signal: AbortSignal.timeout(this.config.timeout)
    };

    if (options.body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    if (this.config.debug) {
      console.log(`[${this.name}] ${method} ${url.toString()}`);
    }

    this._requestCount++;

    const response = await fetch(url.toString(), fetchOptions);

    if (!response.ok) {
      const error = await this._parseError(response);
      throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  /**
   * Get authentication headers
   * @abstract
   * @protected
   * @returns {Object}
   */
  _getAuthHeaders() {
    throw new Error('_getAuthHeaders() must be implemented by subclass');
  }

  /**
   * Parse error response
   * @protected
   * @param {Response} response
   * @returns {Promise<Error>}
   */
  async _parseError(response) {
    let message = `HTTP ${response.status}: ${response.statusText}`;
    let errorData = null;

    try {
      errorData = await response.json();
      message = errorData.message || errorData.error || message;
    } catch {
      // Response body is not JSON
    }

    const error = new Error(message);
    error.status = response.status;
    error.code = errorData?.code || `HTTP_${response.status}`;
    error.data = errorData;
    error.retryable = this._isRetryableStatus(response.status);

    return error;
  }

  /**
   * Check and enforce rate limiting
   * @protected
   * @returns {Promise<void>}
   */
  async _checkRateLimit() {
    const now = Date.now();
    const windowMs = 60000; // 1 minute

    // Reset window if needed
    if (now - this._requestWindowStart >= windowMs) {
      this._requestCount = 0;
      this._requestWindowStart = now;
    }

    // Check if we've hit the limit
    if (this._requestCount >= this.config.rateLimit) {
      const waitTime = windowMs - (now - this._requestWindowStart);
      if (this.config.debug) {
        console.log(`[${this.name}] Rate limit reached, waiting ${waitTime}ms`);
      }
      await this._sleep(waitTime);
      this._requestCount = 0;
      this._requestWindowStart = Date.now();
    }
  }

  /**
   * Check if HTTP status is retryable
   * @protected
   * @param {number} status
   * @returns {boolean}
   */
  _isRetryableStatus(status) {
    return [429, 500, 502, 503, 504].includes(status);
  }

  /**
   * Check if error is retryable
   * @protected
   * @param {Error} error
   * @returns {boolean}
   */
  _isRetryableError(error) {
    if (error.retryable !== undefined) {
      return error.retryable;
    }
    return error.status ? this._isRetryableStatus(error.status) : false;
  }

  /**
   * Sleep utility
   * @protected
   * @param {number} ms
   * @returns {Promise<void>}
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log debug message
   * @protected
   * @param {...any} args
   */
  _debug(...args) {
    if (this.config.debug) {
      console.log(`[${this.name}]`, ...args);
    }
  }
}

export default BaseConnector;
