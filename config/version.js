// OrderFlow Version Configuration
// Single source of truth for version information
const VERSION_CONFIG = {
  version: '4.17.0',
  build: 4954,
  cacheName: 'orderflow-v4954',
  releaseDate: '2026-02-13',

  // Sidebar Template Metadata
  sidebarTemplate: {
    version: '4.10.1',
    protected: true,
    authorizationRequired: true,
    lastModified: '2026-02-12'
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
