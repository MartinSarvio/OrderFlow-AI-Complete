// OrderFlow Version Configuration
// Single source of truth for version information
const VERSION_CONFIG = {
  version: '3.33.0',
  build: 3330,
  cacheName: 'orderflow-v3330',
  releaseDate: '2026-02-06',

  // Sidebar Template Metadata
  sidebarTemplate: {
    version: '3.33.0',
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
