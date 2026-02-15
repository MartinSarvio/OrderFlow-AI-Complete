// OrderFlow Version Configuration
// Single source of truth for version information
const VERSION_CONFIG = {
  version: '4.22.13',
  build: 4993,
  cacheName: 'orderflow-v4993',
  releaseDate: '2026-02-15',

  // Sidebar Template Metadata
  sidebarTemplate: {
    version: '4.11.12',
    protected: true,
    authorizationRequired: true,
    lastModified: '2026-02-15'
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
