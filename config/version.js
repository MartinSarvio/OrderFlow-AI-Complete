// OrderFlow Version Configuration
// Single source of truth for version information
const VERSION_CONFIG = {
  version: '2.8.0',
  build: 280,
  cacheName: 'orderflow-v280',
  releaseDate: '2026-02-02',

  // Sidebar Template Metadata
  sidebarTemplate: {
    version: '2.8.0',
    protected: true,
    authorizationRequired: true,
    lastModified: '2026-02-02'
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
