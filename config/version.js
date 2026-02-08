// OrderFlow Version Configuration
// Single source of truth for version information
const VERSION_CONFIG = {
  version: '3.56.2',
  build: 3562,
  cacheName: 'orderflow-v3562',
  releaseDate: '2026-02-08',

  // Sidebar Template Metadata
  sidebarTemplate: {
    version: '3.56.2',
    protected: true,
    authorizationRequired: true,
    lastModified: '2026-02-08'
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
