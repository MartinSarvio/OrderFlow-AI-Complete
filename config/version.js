// OrderFlow Version Configuration
// Single source of truth for version information
const VERSION_CONFIG = {
  version: '2.0.7',
  build: 207,
  cacheName: 'orderflow-v207',
  releaseDate: '2026-02-01',

  // Sidebar Template Metadata
  sidebarTemplate: {
    version: '2.0.7',
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
