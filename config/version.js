// OrderFlow Version Configuration
// Single source of truth for version information
const VERSION_CONFIG = {
  version: '1.4.6',
  build: 146,
  cacheName: 'orderflow-v146',
  releaseDate: '2026-01-30',

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
