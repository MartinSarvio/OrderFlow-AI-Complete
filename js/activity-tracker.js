/**
 * ACTIVITY TRACKER MODULE
 *
 * Automatisk real-time tracking af alle ændringer i systemet.
 * Integrerer med logActivity() og NotificationSystem for at vise
 * aktiviteter og blå prikker automatisk.
 *
 * Features:
 * - Automatic input change detection (debounced)
 * - Save function wrapping (intercepts all save operations)
 * - Workflow node tracking
 * - Navigation tracking
 * - Integration med NotificationSystem for blue dots
 */

const ActivityTracker = {
  initialized: false,
  debounceTimers: new Map(),
  trackedInputs: new Set(),
  originalFunctions: new Map(),

  /**
   * Initialize the ActivityTracker
   * Call this after DOM is loaded and all modules are available
   */
  init() {
    if (this.initialized) {
      console.warn('ActivityTracker already initialized');
      return;
    }

    console.log('🔄 Initializing ActivityTracker...');

    // Setup all tracking mechanisms
    this.setupInputTracking();
    this.setupSaveFunctionTracking();
    this.setupWorkflowTracking();
    this.setupNavigationTracking();

    this.initialized = true;
    console.log('✅ ActivityTracker initialized successfully');
  },

  /**
   * Setup automatic input change tracking with debouncing
   * Tracks all inputs, textareas, and selects with data-track attribute
   */
  setupInputTracking() {
    // Track existing inputs
    this.trackExistingInputs();

    // Setup MutationObserver to track dynamically added inputs
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            this.trackInputsInElement(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('🎯 Input tracking setup complete');
  },

  /**
   * Track all inputs in an element
   */
  trackInputsInElement(element) {
    const inputs = element.querySelectorAll ?
      element.querySelectorAll('input[data-track], textarea[data-track], select[data-track]') :
      [];

    inputs.forEach(input => this.trackInput(input));

    // Also check if the element itself is an input
    if (element.matches && element.matches('input[data-track], textarea[data-track], select[data-track]')) {
      this.trackInput(element);
    }
  },

  /**
   * Track existing inputs on page load
   */
  trackExistingInputs() {
    const inputs = document.querySelectorAll('input[data-track], textarea[data-track], select[data-track]');
    inputs.forEach(input => this.trackInput(input));
  },

  /**
   * Track a single input element
   */
  trackInput(input) {
    if (this.trackedInputs.has(input)) return;

    const trackConfig = this.parseTrackConfig(input.dataset.track);

    input.addEventListener('change', (e) => {
      this.handleInputChange(e.target, trackConfig);
    });

    input.addEventListener('input', (e) => {
      // Debounce input events (1 second delay)
      this.debounce(`input-${input.id || input.name}`, () => {
        this.handleInputChange(e.target, trackConfig);
      }, 1000);
    });

    this.trackedInputs.add(input);
  },

  /**
   * Parse data-track configuration
   * Format: "category:subCategory:field" or "category:field"
   */
  parseTrackConfig(trackString) {
    const parts = trackString.split(':');
    return {
      category: parts[0] || 'system',
      subCategory: parts[1] || null,
      field: parts[2] || parts[1] || 'value'
    };
  },

  /**
   * Handle input change event
   */
  handleInputChange(input, config) {
    const oldValue = input.dataset.oldValue || '';
    const newValue = input.value;

    // Skip if value hasn't changed
    if (oldValue === newValue) return;

    // Get context from page
    const context = this.getContextFromPage();

    // Log activity
    if (typeof logActivity === 'function') {
      logActivity('update', `${config.field} ændret`, {
        category: config.category,
        subCategory: config.subCategory,
        field: config.field,
        oldValue: oldValue,
        newValue: newValue,
        ...context
      });

      // Add notification
      this.addNotification(config.category, config.subCategory, `${config.field} opdateret`);
    }

    // Update old value
    input.dataset.oldValue = newValue;
  },

  /**
   * Debounce helper
   */
  debounce(key, func, delay) {
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    const timer = setTimeout(() => {
      func();
      this.debounceTimers.delete(key);
    }, delay);

    this.debounceTimers.set(key, timer);
  },

  /**
   * Get context from current page (restaurant name, etc.)
   */
  getContextFromPage() {
    const context = {};

    // Try to get restaurant context
    if (window.currentRestaurant) {
      context.restaurantId = window.currentRestaurant.id;
      context.restaurantName = window.currentRestaurant.name;
    }

    // Try to get current page
    const activePage = document.querySelector('.page.active');
    if (activePage) {
      context.pageId = activePage.id;
    }

    return context;
  },

  /**
   * Setup save function tracking
   * Wraps common save functions to automatically log activities
   */
  setupSaveFunctionTracking() {
    const functionsToWrap = [
      'saveStamdata',
      'saveProduct',
      'saveSettings',
      'saveWorkflow',
      'saveFaktura',
      'saveOrdre',
      'saveKasse',
      'saveDagsrapport',
      'saveIntegration',
      'saveMedarbejder'
    ];

    functionsToWrap.forEach(funcName => {
      if (typeof window[funcName] === 'function') {
        this.wrapSaveFunction(funcName);
      }
    });

    console.log('💾 Save function tracking setup complete');
  },

  /**
   * Wrap a save function to track activity
   */
  wrapSaveFunction(funcName) {
    const originalFunc = window[funcName];
    this.originalFunctions.set(funcName, originalFunc);

    window[funcName] = async (...args) => {
      // Call original function
      const result = await originalFunc.apply(this, args);

      // Log activity after successful save
      const category = this.getCategoryFromFunctionName(funcName);
      const subCategory = this.getSubCategoryFromFunctionName(funcName);

      if (typeof logActivity === 'function') {
        logActivity('update', `${category} gemt`, {
          category: category,
          subCategory: subCategory,
          ...this.getContextFromPage()
        });

        // Add notification
        this.addNotification(category, subCategory, 'Data gemt');
      }

      return result;
    };

    console.log(`🔗 Wrapped function: ${funcName}`);
  },

  /**
   * Get category from function name
   */
  getCategoryFromFunctionName(funcName) {
    const mapping = {
      'saveStamdata': 'kunder',
      'saveProduct': 'kunder',
      'saveSettings': 'indstillinger',
      'saveWorkflow': 'workflow',
      'saveFaktura': 'kunder',
      'saveOrdre': 'ordrer',
      'saveKasse': 'kasse',
      'saveDagsrapport': 'dagsrapport',
      'saveIntegration': 'integrationer',
      'saveMedarbejder': 'kunder'
    };
    return mapping[funcName] || 'system';
  },

  /**
   * Get subcategory from function name
   */
  getSubCategoryFromFunctionName(funcName) {
    const mapping = {
      'saveStamdata': 'stamdata',
      'saveProduct': 'produkter',
      'saveSettings': null,
      'saveWorkflow': null,
      'saveFaktura': 'faktura',
      'saveOrdre': null,
      'saveKasse': null,
      'saveDagsrapport': null,
      'saveIntegration': null,
      'saveMedarbejder': 'medarbejdere'
    };
    return mapping[funcName] || null;
  },

  /**
   * Setup workflow node tracking
   */
  setupWorkflowTracking() {
    // Wrap updateNodeProperty if it exists
    if (typeof window.updateNodeProperty === 'function') {
      const originalFunc = window.updateNodeProperty;
      this.originalFunctions.set('updateNodeProperty', originalFunc);

      window.updateNodeProperty = (nodeId, property, value) => {
        const result = originalFunc(nodeId, property, value);

        // Log workflow activity
        if (typeof logActivity === 'function') {
          logActivity('workflow', `Workflow node opdateret: ${property}`, {
            category: 'workflow',
            subCategory: 'nodes',
            field: property,
            newValue: value,
            nodeId: nodeId
          });

          // Add notification
          this.addNotification('workflow', null, 'Workflow opdateret');
        }

        return result;
      };

      console.log('🔗 Wrapped workflow tracking');
    }
  },

  /**
   * Setup navigation tracking
   */
  setupNavigationTracking() {
    // Track when pages are shown
    if (typeof window.showPage === 'function') {
      const originalShowPage = window.showPage;
      this.originalFunctions.set('showPage', originalShowPage);

      window.showPage = (pageName) => {
        const result = originalShowPage(pageName);

        // Clear notifications for this page (already handled by markPageUpdatesAsSeen)
        // Just log that page was visited
        console.log(`📄 Page visited: ${pageName}`);

        return result;
      };
    }
  },

  /**
   * Add notification via NotificationSystem
   */
  addNotification(category, subCategory, message) {
    if (typeof NotificationSystem === 'undefined') return;

    // Build notification path
    const path = this.buildNotificationPath(category, subCategory);

    // Add notification
    NotificationSystem.add(path, {
      title: 'Ny opdatering',
      message: message,
      timestamp: Date.now()
    });

    console.log(`🔵 Notification added: ${path}`);
  },

  /**
   * Build notification path from category and subcategory
   */
  buildNotificationPath(category, subCategory) {
    if (subCategory) {
      return `${category}.${subCategory}`;
    }
    return category;
  },

  /**
   * Restore original functions (for debugging/testing)
   */
  restore() {
    this.originalFunctions.forEach((originalFunc, funcName) => {
      window[funcName] = originalFunc;
    });
    this.originalFunctions.clear();
    this.initialized = false;
    console.log('🔄 ActivityTracker restored to original state');
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other modules to load
    setTimeout(() => ActivityTracker.init(), 1000);
  });
} else {
  // DOM already loaded
  setTimeout(() => ActivityTracker.init(), 1000);
}
