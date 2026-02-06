/**
 * Accounting Integrations Module
 * Main entry point for all accounting system integrations
 * @module integrations
 * @version 1.0.0
 */

// Core modules
export { BaseConnector } from './core/connector.js';
export {
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
} from './core/canonical-model.js';

export {
  SyncEngine,
  MemoryStorage,
  ConsoleAudit
} from './core/sync-engine.js';

// Connectors
export { EconomicConnector } from './connectors/economic/index.js';

/**
 * Create a connector instance by type
 * @param {string} type - Connector type ('economic', 'dinero', 'billy', 'visma')
 * @param {Object} config - Connector configuration
 * @returns {BaseConnector}
 */
export function createConnector(type, config) {
  switch (type.toLowerCase()) {
    case 'economic':
    case 'e-conomic':
      const { EconomicConnector } = require('./connectors/economic/index.js');
      return new EconomicConnector(config);

    case 'dinero':
      throw new Error('Dinero connector not yet implemented. Coming Q1 2026.');

    case 'billy':
      throw new Error('Billy connector not yet implemented. Coming Q2 2026.');

    case 'visma':
    case 'visma.net':
      throw new Error('Visma.net connector not yet implemented. Coming Q3 2026.');

    default:
      throw new Error(`Unknown connector type: ${type}`);
  }
}

/**
 * Get list of available connectors
 * @returns {Array<{name: string, type: string, status: string, version: string}>}
 */
export function getAvailableConnectors() {
  return [
    {
      name: 'e-conomic',
      type: 'economic',
      status: 'available',
      version: '1.0.0',
      features: ['customers', 'products', 'invoices', 'payments', 'accounts', 'vat']
    },
    {
      name: 'Dinero',
      type: 'dinero',
      status: 'planned',
      version: null,
      eta: 'Q1 2026'
    },
    {
      name: 'Billy',
      type: 'billy',
      status: 'planned',
      version: null,
      eta: 'Q2 2026'
    },
    {
      name: 'Visma.net',
      type: 'visma',
      status: 'planned',
      version: null,
      eta: 'Q3 2026'
    }
  ];
}

/**
 * Integration Manager class for managing multiple connections
 */
export class IntegrationManager {
  constructor() {
    this._connectors = new Map();
    this._syncEngines = new Map();
  }

  /**
   * Register a connector for a company
   * @param {string} companyId
   * @param {string} type
   * @param {Object} config
   */
  async registerConnector(companyId, type, config) {
    const connector = createConnector(type, config);
    await connector.connect();

    this._connectors.set(companyId, connector);

    // Create sync engine for this connector
    const engine = new SyncEngine({
      connector,
      storage: new MemoryStorage(),
      audit: new ConsoleAudit()
    });
    this._syncEngines.set(companyId, engine);

    return {
      connectorType: type,
      connected: true,
      company: connector.getCompanyInfo?.() || null
    };
  }

  /**
   * Get connector for a company
   * @param {string} companyId
   * @returns {BaseConnector|null}
   */
  getConnector(companyId) {
    return this._connectors.get(companyId) || null;
  }

  /**
   * Get sync engine for a company
   * @param {string} companyId
   * @returns {SyncEngine|null}
   */
  getSyncEngine(companyId) {
    return this._syncEngines.get(companyId) || null;
  }

  /**
   * Disconnect and remove a connector
   * @param {string} companyId
   */
  async removeConnector(companyId) {
    const connector = this._connectors.get(companyId);
    if (connector) {
      await connector.disconnect();
      this._connectors.delete(companyId);
      this._syncEngines.delete(companyId);
    }
  }

  /**
   * Run sync for a company
   * @param {string} companyId
   * @param {Object} options
   */
  async runSync(companyId, options = {}) {
    const engine = this._syncEngines.get(companyId);
    if (!engine) {
      throw new Error(`No connector registered for company ${companyId}`);
    }

    return engine.runSync({
      companyId,
      ...options
    });
  }

  /**
   * Get all registered companies
   * @returns {Array<string>}
   */
  getRegisteredCompanies() {
    return Array.from(this._connectors.keys());
  }
}

// Default export
export default {
  createConnector,
  getAvailableConnectors,
  IntegrationManager,
  EconomicConnector,
  SyncEngine,
  MemoryStorage,
  ConsoleAudit
};
