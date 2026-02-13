/**
 * Cookie Consent Management
 * Handles cookie consent banner display and user preferences
 * Supports dynamic categories from admin settings
 */

(function() {
  'use strict';

  // Default categories (fallback if none saved)
  const DEFAULT_CATEGORIES = [
    { id: 'necessary', name: 'Nødvendige', description: 'Disse cookies er nødvendige for at hjemmesiden kan fungere korrekt.', required: true },
    { id: 'functional', name: 'Funktionelle', description: 'Disse cookies gør det muligt at huske dine præferencer.', required: false },
    { id: 'analytics', name: 'Statistik', description: 'Disse cookies hjælper os med at forstå, hvordan besøgende bruger vores hjemmeside.', required: false },
    { id: 'marketing', name: 'Marketing', description: 'Disse cookies bruges til at vise dig relevante annoncer.', required: false }
  ];

  // Get privacy categories from localStorage or use defaults
  function getPrivacyCategories() {
    const saved = localStorage.getItem('privacyCategories');
    if (saved) {
      try {
        const categories = JSON.parse(saved);
        if (Array.isArray(categories) && categories.length > 0) {
          return categories;
        }
      } catch (e) {
        console.error('Error parsing privacy categories:', e);
      }
    }
    return DEFAULT_CATEGORIES;
  }

  // Default settings (can be overridden by admin settings)
  const defaultSettings = {
    bannerTitle: 'Vi bruger cookies',
    bannerDesc: 'Vi bruger cookies for at forbedre din oplevelse på vores hjemmeside, analysere trafik og personliggøre indhold. Ved at klikke "Accepter alle" samtykker du til vores brug af cookies.',
    btnAccept: 'Accepter alle',
    btnReject: 'Kun nødvendige',
    btnSave: 'Gem mine valg',
    bannerActive: true,
    showDetails: true
  };

  // Get settings (merge defaults with any saved admin settings)
  function getSettings() {
    const saved = localStorage.getItem('cookieConsentSettings');
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) };
    }
    return defaultSettings;
  }

  // Check if user has already given consent
  function hasConsent() {
    return localStorage.getItem('cookieConsent') !== null;
  }

  // Get current consent preferences
  function getConsent() {
    const consent = localStorage.getItem('cookieConsent');
    if (consent) {
      return JSON.parse(consent);
    }
    return null;
  }

  // Save consent preferences (supports dynamic categories)
  function saveConsent(preferences) {
    const categories = getPrivacyCategories();
    const consent = { timestamp: Date.now() };

    // Set consent for each category
    categories.forEach(cat => {
      consent[cat.id] = cat.required ? true : (preferences[cat.id] || false);
    });

    localStorage.setItem('cookieConsent', JSON.stringify(consent));

    // Dispatch event for other scripts to react
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: consent }));

    return consent;
  }

  // Accept all cookies
  function acceptAll() {
    const categories = getPrivacyCategories();
    const preferences = {};
    categories.forEach(cat => {
      preferences[cat.id] = true;
    });
    saveConsent(preferences);
    hideBanner();
  }

  // Reject all (only necessary)
  function rejectAll() {
    const categories = getPrivacyCategories();
    const preferences = {};
    categories.forEach(cat => {
      preferences[cat.id] = cat.required ? true : false;
    });
    saveConsent(preferences);
    hideBanner();
  }

  // Save current selection
  function saveSelection() {
    const categories = getPrivacyCategories();
    const preferences = {};

    categories.forEach(cat => {
      const toggle = document.getElementById(`cookie-${cat.id}`);
      preferences[cat.id] = cat.required ? true : (toggle?.checked || false);
    });

    saveConsent(preferences);
    hideBanner();
  }

  // Show banner
  function showBanner() {
    const banner = document.getElementById('cookie-consent-banner');
    if (banner) {
      banner.classList.add('visible');
    }
  }

  // Hide banner
  function hideBanner() {
    const banner = document.getElementById('cookie-consent-banner');
    if (banner) {
      banner.classList.remove('visible');
    }
  }

  // Toggle category details visibility
  function toggleDetails() {
    const categories = document.querySelector('.cookie-categories');
    const toggleBtn = document.querySelector('.cookie-toggle-details');

    if (categories && toggleBtn) {
      categories.classList.toggle('collapsed');
      toggleBtn.classList.toggle('expanded');
    }
  }

  // Create banner HTML
  function createBanner() {
    const settings = getSettings();

    // Don't create if banner is disabled
    if (!settings.bannerActive) return;

    const banner = document.createElement('div');
    banner.id = 'cookie-consent-banner';
    banner.className = 'cookie-banner';

    banner.innerHTML = `
      <div class="cookie-banner-container">
        <div class="cookie-banner-header">
          <div class="cookie-banner-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>
              <path d="M8.5 8.5v.01"/><path d="M16 15.5v.01"/><path d="M12 12v.01"/>
              <path d="M11 17v.01"/><path d="M7 14v.01"/>
            </svg>
          </div>
          <div class="cookie-banner-content">
            <h3 class="cookie-banner-title">${settings.bannerTitle}</h3>
            <p class="cookie-banner-text">${settings.bannerDesc}</p>
          </div>
        </div>

        ${settings.showDetails ? `
        <div class="cookie-categories">
          ${getPrivacyCategories().map(cat => `
            <div class="cookie-category">
              <div class="cookie-category-info">
                <div class="cookie-category-name">${cat.name}</div>
                <div class="cookie-category-desc">${cat.description}</div>
              </div>
              <label class="cookie-toggle">
                <input type="checkbox" id="cookie-${cat.id}" ${cat.required ? 'checked disabled' : ''}>
                <span class="cookie-toggle-slider"></span>
              </label>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <div class="cookie-banner-actions">
          <button class="cookie-btn cookie-btn-primary" onclick="CookieConsent.acceptAll()">${settings.btnAccept}</button>
          <button class="cookie-btn cookie-btn-secondary" onclick="CookieConsent.rejectAll()">${settings.btnReject}</button>
          ${settings.showDetails ? `<button class="cookie-btn cookie-btn-secondary" onclick="CookieConsent.saveSelection()">${settings.btnSave}</button>` : ''}
          ${settings.showDetails ? `
          <button class="cookie-toggle-details" onclick="CookieConsent.toggleDetails()">
            Tilpas valg
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          ` : ''}
          <button class="cookie-btn cookie-btn-link" onclick="CookieConsent.openPrivacyModal()">
            Avancerede indstillinger
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);
  }

  // Initialize
  function init() {
    // Only show cookie consent on the main landing page
    const path = window.location.pathname.toLowerCase();
    const isLandingPage = path === '/' || path === '/landing.html' || path.endsWith('/landing.html');
    if (!isLandingPage) {
      return;
    }

    // Check if popup style is selected - if so, let cookie-popup.js handle it
    const settings = getSettings();
    if (settings.displayStyle === 'popup') {
      // Popup mode - skip banner, CookiePopup.init() will handle it
      return;
    }

    // Create banner if needed
    createBanner();

    // Show banner if no consent given yet
    if (!hasConsent()) {
      // Small delay for smooth animation
      setTimeout(showBanner, 500);
    }
  }

  // Open privacy modal
  function openPrivacyModal() {
    if (window.PrivacyModal && typeof window.PrivacyModal.show === 'function') {
      window.PrivacyModal.show();
    }
  }

  // Expose API globally
  window.CookieConsent = {
    init,
    acceptAll,
    rejectAll,
    saveSelection,
    toggleDetails,
    showBanner,
    hideBanner,
    hasConsent,
    getConsent,
    getSettings,
    openPrivacyModal
  };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
