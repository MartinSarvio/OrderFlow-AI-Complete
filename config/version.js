// OrderFlow Version Configuration
// Single source of truth for version information
const VERSION_CONFIG = {
  version: '4.1.5',
  build: 4150,
  cacheName: 'orderflow-v4150',
  releaseDate: '2026-02-10',

  // Sidebar Template Metadata
  sidebarTemplate: {
    version: '4.1.5',
    protected: true,
    authorizationRequired: true,
    lastModified: '2026-02-10'
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
