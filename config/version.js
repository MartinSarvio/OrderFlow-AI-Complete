// OrderFlow Version Configuration
// Single source of truth for version information
const VERSION_CONFIG = {
  version: '3.14.3',
  build: 3143,
  cacheName: 'orderflow-v3143',
  releaseDate: '2026-02-06',

  // Sidebar Template Metadata
  sidebarTemplate: {
    version: '3.14.0',
    protected: true,
    authorizationRequired: true,
    lastModified: '2026-02-06'
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
