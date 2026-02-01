// OrderFlow Version Configuration
// Single source of truth for version information
const VERSION_CONFIG = {
  version: '1.9.0',
  build: 190,
  cacheName: 'orderflow-v190',
  releaseDate: '2026-02-01',

  // Sidebar Template Metadata
  sidebarTemplate: {
    version: '1.9.0',
    protected: true,
    authorizationRequired: true,
    lastModified: '2026-02-01'
  },

  getDisplayVersion() {
    return `v${this.version}`;
  },

  getCacheName() {
    return this.cacheName;
  },

  getFullVersion() {
    return `v${this.version} (build ${this.build})`;
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.VERSION_CONFIG = VERSION_CONFIG;
}
