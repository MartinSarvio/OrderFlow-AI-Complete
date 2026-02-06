/**
 * Sync Engine for Accounting Integrations
 * Handles bidirectional synchronization between OrderFlow and accounting systems
 * @module integrations/core/sync-engine
 * @version 1.0.0
 */

import {
  createSyncJob,
  createAuditEvent,
  SyncStatus,
  SyncDirection
} from './canonical-model.js';

/**
 * @typedef {Object} SyncOptions
 * @property {string} companyId - Company ID in OrderFlow
 * @property {string} connectorType - 'economic' | 'dinero' | 'billy' | 'visma'
 * @property {Array<string>} entityTypes - ['customer', 'invoice', 'payment', 'product']
 * @property {string} [direction='pull'] - 'push' | 'pull' | 'bidirectional'
 * @property {boolean} [fullSync=false] - Force full sync instead of incremental
 * @property {string} [since] - ISO8601 timestamp for incremental sync
 * @property {function} [onProgress] - Progress callback
 */

/**
 * Sync Engine manages synchronization between OrderFlow and accounting systems
 */
export class SyncEngine {
  /**
   * @param {Object} options
   * @param {Object} options.connector - Connector instance
   * @param {Object} options.storage - Storage adapter for local data
   * @param {Object} [options.audit] - Audit logger
   */
  constructor(options) {
    this.connector = options.connector;
    this.storage = options.storage;
    this.audit = options.audit || new NoOpAudit();

    this._runningJobs = new Map();
    this._retryDelays = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff
  }

  /**
   * Get connector name
   * @returns {string}
   */
  getConnectorName() {
    return this.connector.getName();
  }

  /**
   * Check if a sync job is running
   * @param {string} companyId
   * @returns {boolean}
   */
  isJobRunning(companyId) {
    return this._runningJobs.has(companyId);
  }

  /**
   * Run a sync job
   * @param {SyncOptions} options
   * @returns {Promise<Object>} Sync job result
   */
  async runSync(options) {
    const {
      companyId,
      entityTypes = ['customer', 'invoice'],
      direction = SyncDirection.PULL,
      fullSync = false,
      since = null,
      onProgress = () => {}
    } = options;

    // Check for running job
    if (this._runningJobs.has(companyId)) {
      throw new Error(`Sync job already running for company ${companyId}`);
    }

    // Create sync job
    const job = createSyncJob({
      companyId,
      connectorType: this.connector.getName(),
      direction,
      entityTypes,
      status: SyncStatus.RUNNING,
      startedAt: new Date().toISOString(),
      triggeredBy: 'manual'
    });

    this._runningJobs.set(companyId, job);

    try {
      // Connect if not connected
      if (!this.connector.isConnected()) {
        await this.connector.connect();
      }

      // Run sync for each entity type
      for (const entityType of entityTypes) {
        onProgress({
          type: 'entity_start',
          entityType,
          job
        });

        try {
          if (direction === SyncDirection.PULL || direction === SyncDirection.BIDIRECTIONAL) {
            await this._pullEntity(job, entityType, { fullSync, since });
          }

          if (direction === SyncDirection.PUSH || direction === SyncDirection.BIDIRECTIONAL) {
            await this._pushEntity(job, entityType);
          }

          onProgress({
            type: 'entity_complete',
            entityType,
            job
          });
        } catch (error) {
          job.errors.push({
            entityType,
            entityId: null,
            errorCode: error.code || 'SYNC_ERROR',
            errorMessage: error.message,
            retryable: error.retryable || false
          });
          job.recordsFailed++;
        }
      }

      // Determine final status
      job.status = job.errors.length > 0
        ? (job.recordsSucceeded > 0 ? SyncStatus.PARTIAL : SyncStatus.FAILED)
        : SyncStatus.COMPLETED;

    } catch (error) {
      job.status = SyncStatus.FAILED;
      job.errors.push({
        entityType: null,
        entityId: null,
        errorCode: error.code || 'FATAL_ERROR',
        errorMessage: error.message,
        retryable: false
      });
    } finally {
      job.completedAt = new Date().toISOString();
      this._runningJobs.delete(companyId);

      // Log audit event
      await this.audit.log(createAuditEvent({
        companyId,
        eventType: 'sync',
        entityType: 'sync_job',
        entityId: job.id,
        systemActor: this.connector.getName(),
        newState: job
      }));
    }

    return job;
  }

  /**
   * Pull entities from accounting system to OrderFlow
   * @private
   * @param {Object} job - Sync job
   * @param {string} entityType
   * @param {Object} options
   */
  async _pullEntity(job, entityType, options = {}) {
    const methodMap = {
      customer: 'listCustomers',
      invoice: 'listInvoices',
      payment: 'listPayments',
      product: 'listProducts',
      account: 'listAccounts',
      vat_code: 'listVatCodes'
    };

    const method = methodMap[entityType];
    if (!method || typeof this.connector[method] !== 'function') {
      throw new Error(`Pull not supported for entity type: ${entityType}`);
    }

    let cursor = null;
    let hasMore = true;

    while (hasMore) {
      const result = await this._retryWithBackoff(async () => {
        return this.connector[method]({ cursor });
      });

      for (const record of result.data) {
        try {
          // Store in local storage with mapping
          await this.storage.upsert(entityType, record);
          job.recordsSucceeded++;
        } catch (error) {
          job.errors.push({
            entityType,
            entityId: record.id,
            errorCode: 'STORAGE_ERROR',
            errorMessage: error.message,
            retryable: true
          });
          job.recordsFailed++;
        }
        job.recordsProcessed++;
      }

      hasMore = result.hasMore;
      cursor = result.cursor;
    }
  }

  /**
   * Push entities from OrderFlow to accounting system
   * @private
   * @param {Object} job - Sync job
   * @param {string} entityType
   */
  async _pushEntity(job, entityType) {
    // Get pending changes from storage
    const pending = await this.storage.getPendingChanges(entityType, job.companyId);

    for (const change of pending) {
      try {
        await this._pushSingleEntity(entityType, change);
        await this.storage.markSynced(entityType, change.id);
        job.recordsSucceeded++;
      } catch (error) {
        job.errors.push({
          entityType,
          entityId: change.id,
          errorCode: error.code || 'PUSH_ERROR',
          errorMessage: error.message,
          retryable: error.retryable || false
        });
        job.recordsFailed++;
      }
      job.recordsProcessed++;
    }
  }

  /**
   * Push a single entity to the accounting system
   * @private
   * @param {string} entityType
   * @param {Object} change
   */
  async _pushSingleEntity(entityType, change) {
    const { action, data, externalId } = change;

    switch (entityType) {
      case 'customer':
        if (action === 'create') {
          return this.connector.createCustomer(data);
        } else if (action === 'update') {
          return this.connector.updateCustomer(externalId, data);
        } else if (action === 'delete') {
          return this.connector.deleteCustomer(externalId);
        }
        break;

      case 'invoice':
        if (action === 'create') {
          const result = await this.connector.createInvoice(data, {
            customerNumber: data.customerExternalId
          });
          // Auto-book if requested
          if (data.autoBook) {
            await this.connector.bookInvoice(result.externalId);
          }
          return result;
        }
        break;

      case 'payment':
        if (action === 'create') {
          return this.connector.createPayment(data, {
            customerNumber: data.customerExternalId
          });
        }
        break;

      case 'product':
        if (action === 'create') {
          return this.connector.createProduct(data);
        } else if (action === 'update') {
          return this.connector.updateProduct(externalId, data);
        }
        break;

      default:
        throw new Error(`Push not supported for entity type: ${entityType}`);
    }
  }

  /**
   * Retry a function with exponential backoff
   * @private
   * @param {Function} fn
   * @param {number} [maxRetries=5]
   * @returns {Promise<any>}
   */
  async _retryWithBackoff(fn, maxRetries = 5) {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Don't retry non-retryable errors
        if (!error.retryable && error.status && ![429, 500, 502, 503, 504].includes(error.status)) {
          throw error;
        }

        // Wait before retrying
        if (attempt < maxRetries - 1) {
          const delay = this._retryDelays[attempt] || 16000;
          await this._sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Sleep utility
   * @private
   * @param {number} ms
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cancel a running sync job
   * @param {string} companyId
   * @returns {boolean}
   */
  cancelJob(companyId) {
    if (this._runningJobs.has(companyId)) {
      const job = this._runningJobs.get(companyId);
      job.status = SyncStatus.FAILED;
      job.errors.push({
        entityType: null,
        entityId: null,
        errorCode: 'CANCELLED',
        errorMessage: 'Job cancelled by user',
        retryable: false
      });
      this._runningJobs.delete(companyId);
      return true;
    }
    return false;
  }

  /**
   * Get status of a running job
   * @param {string} companyId
   * @returns {Object|null}
   */
  getJobStatus(companyId) {
    return this._runningJobs.get(companyId) || null;
  }
}

/**
 * Simple in-memory storage adapter for development/testing
 */
export class MemoryStorage {
  constructor() {
    this._data = new Map();
    this._pending = new Map();
    this._mappings = new Map();
  }

  /**
   * Upsert a record
   * @param {string} entityType
   * @param {Object} record
   */
  async upsert(entityType, record) {
    const key = `${entityType}:${record.id}`;
    this._data.set(key, {
      ...record,
      _syncedAt: new Date().toISOString()
    });

    // Store external ID mapping
    const connectorType = Object.keys(record.externalIds || {}).find(k => record.externalIds[k]);
    if (connectorType && record.externalIds[connectorType]) {
      const mappingKey = `${entityType}:${connectorType}:${record.externalIds[connectorType]}`;
      this._mappings.set(mappingKey, record.id);
    }
  }

  /**
   * Get a record by ID
   * @param {string} entityType
   * @param {string} id
   * @returns {Object|null}
   */
  async get(entityType, id) {
    return this._data.get(`${entityType}:${id}`) || null;
  }

  /**
   * Get record by external ID
   * @param {string} entityType
   * @param {string} connectorType
   * @param {string} externalId
   * @returns {Object|null}
   */
  async getByExternalId(entityType, connectorType, externalId) {
    const mappingKey = `${entityType}:${connectorType}:${externalId}`;
    const id = this._mappings.get(mappingKey);
    if (id) {
      return this.get(entityType, id);
    }
    return null;
  }

  /**
   * Get all records of a type
   * @param {string} entityType
   * @returns {Array}
   */
  async list(entityType) {
    const results = [];
    for (const [key, value] of this._data) {
      if (key.startsWith(`${entityType}:`)) {
        results.push(value);
      }
    }
    return results;
  }

  /**
   * Add a pending change
   * @param {string} entityType
   * @param {Object} change
   */
  async addPendingChange(entityType, change) {
    const key = `${entityType}:${change.id}`;
    this._pending.set(key, {
      ...change,
      _addedAt: new Date().toISOString()
    });
  }

  /**
   * Get pending changes for sync
   * @param {string} entityType
   * @param {string} [companyId]
   * @returns {Array}
   */
  async getPendingChanges(entityType, companyId = null) {
    const results = [];
    for (const [key, value] of this._pending) {
      if (key.startsWith(`${entityType}:`)) {
        if (!companyId || value.companyId === companyId) {
          results.push(value);
        }
      }
    }
    return results;
  }

  /**
   * Mark a record as synced
   * @param {string} entityType
   * @param {string} id
   */
  async markSynced(entityType, id) {
    const key = `${entityType}:${id}`;
    this._pending.delete(key);
  }

  /**
   * Clear all data
   */
  async clear() {
    this._data.clear();
    this._pending.clear();
    this._mappings.clear();
  }
}

/**
 * No-op audit logger for when audit is not configured
 */
class NoOpAudit {
  async log() {}
}

/**
 * Simple console audit logger
 */
export class ConsoleAudit {
  async log(event) {
    console.log('[AUDIT]', event.eventType, event.entityType, event.entityId);
  }
}

export default {
  SyncEngine,
  MemoryStorage,
  ConsoleAudit
};
