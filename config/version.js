// OrderFlow Version Configuration
// Single source of truth for version information
const VERSION_CONFIG = {
  version: '1.7.1',
  build: 171,
  cacheName: 'orderflow-v171',
  releaseDate: '2026-01-30',

  // Sidebar Template Metadata
  sidebarTemplate: {
    version: '1.7.1',
    protected: true,
    authorizationRequired: true,
    lastModified: '2026-01-30'
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
