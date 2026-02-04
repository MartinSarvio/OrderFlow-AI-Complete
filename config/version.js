// OrderFlow Version Configuration
// Single source of truth for version information
const VERSION_CONFIG = {
  version: '3.8.8',
  build: 388,
  cacheName: 'orderflow-v388',
  releaseDate: '2026-02-04',

  // Sidebar Template Metadata
  sidebarTemplate: {
    version: '3.8.8',
    protected: true,
    authorizationRequired: true,
    lastModified: '2026-02-04'
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
