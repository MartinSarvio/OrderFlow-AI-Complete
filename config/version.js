// OrderFlow Version Configuration
// Single source of truth for version information
const VERSION_CONFIG = {
  version: '4.13.0',
  build: 4930,
  cacheName: 'orderflow-v4930',
  releaseDate: '2026-02-12',

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
