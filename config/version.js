// OrderFlow Version Configuration
// Single source of truth for version information
const VERSION_CONFIG = {
  version: '4.7.13',
  build: 4830,
  cacheName: 'orderflow-v4830',
  releaseDate: '2026-02-11',

  // Sidebar Template Metadata
  sidebarTemplate: {
    version: '4.7.13',
    protected: true,
    authorizationRequired: true,
    lastModified: '2026-02-11'
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
