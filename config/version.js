// OrderFlow Version Configuration
// Single source of truth for version information
const VERSION_CONFIG = {
  version: '1.8.2',
  build: 182,
  cacheName: 'orderflow-v182',
  releaseDate: '2026-01-31',

  // Sidebar Template Metadata
  sidebarTemplate: {
    version: '1.8.2',
    protected: true,
    authorizationRequired: true,
    lastModified: '2026-01-31'
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
