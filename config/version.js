// OrderFlow Version Configuration
// Single source of truth for version information
const VERSION_CONFIG = {
  version: '4.0.1',
  build: 4001,
  cacheName: 'orderflow-v4001',
  releaseDate: '2026-02-09',

  // Sidebar Template Metadata
  sidebarTemplate: {
    version: '4.0.1',
    protected: true,
    authorizationRequired: true,
    lastModified: '2026-02-09'
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
