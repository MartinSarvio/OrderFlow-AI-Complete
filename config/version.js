// OrderFlow Version Configuration
// Single source of truth for version information
const VERSION_CONFIG = {
  version: '3.9.9',
  build: 399,
  cacheName: 'orderflow-v399',
  releaseDate: '2026-02-05',

  // Sidebar Template Metadata
  sidebarTemplate: {
    version: '3.9.9',
    protected: true,
    authorizationRequired: true,
    lastModified: '2026-02-05'
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
