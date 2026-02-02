/**
 * Cookie Consent Management
 * Handles cookie consent banner display and user preferences
 */

(function() {
  'use strict';

  // Default settings (can be overridden by admin settings)
  const defaultSettings = {
    bannerTitle: 'Vi bruger cookies',
    bannerDesc: 'Vi bruger cookies for at forbedre din oplevelse på vores hjemmeside, analysere trafik og personliggøre indhold. Ved at klikke "Accepter alle" samtykker du til vores brug af cookies.',
    necessaryDesc: 'Disse cookies er nødvendige for at hjemmesiden kan fungere korrekt. De kan ikke deaktiveres.',
    functionalDesc: 'Disse cookies gør det muligt at huske dine præferencer og tilpasse hjemmesiden til dig.',
    analyticsDesc: 'Disse cookies hjælper os med at forstå, hvordan besøgende bruger vores hjemmeside ved at indsamle anonyme statistikker.',
    marketingDesc: 'Disse cookies bruges til at vise dig relevante annoncer baseret på dine interesser.',
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

  // Save consent preferences
  function saveConsent(preferences) {
    const consent = {
      necessary: true, // Always true
      functional: preferences.functional || false,
      analytics: preferences.analytics || false,
      marketing: preferences.marketing || false,
      timestamp: Date.now()
    };
    localStorage.setItem('cookieConsent', JSON.stringify(consent));

    // Dispatch event for other scripts to react
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: consent }));

    return consent;
  }

  // Accept all cookies
  function acceptAll() {
    saveConsent({
      functional: true,
      analytics: true,
      marketing: true
    });
    hideBanner();
  }

  // Reject all (only necessary)
  function rejectAll() {
    saveConsent({
      functional: false,
      analytics: false,
      marketing: false
    });
    hideBanner();
  }

  // Save current selection
  function saveSelection() {
    const functional = document.getElementById('cookie-functional')?.checked || false;
    const analytics = document.getElementById('cookie-analytics')?.checked || false;
    const marketing = document.getElementById('cookie-marketing')?.checked || false;

    saveConsent({
      functional,
      analytics,
      marketing
    });
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
          <div class="cookie-category">
            <div class="cookie-category-info">
              <div class="cookie-category-name">Nødvendige</div>
              <div class="cookie-category-desc">${settings.necessaryDesc}</div>
            </div>
            <label class="cookie-toggle">
              <input type="checkbox" checked disabled>
              <span class="cookie-toggle-slider"></span>
            </label>
          </div>

          <div class="cookie-category">
            <div class="cookie-category-info">
              <div class="cookie-category-name">Funktionelle</div>
              <div class="cookie-category-desc">${settings.functionalDesc}</div>
            </div>
            <label class="cookie-toggle">
              <input type="checkbox" id="cookie-functional">
              <span class="cookie-toggle-slider"></span>
            </label>
          </div>

          <div class="cookie-category">
            <div class="cookie-category-info">
              <div class="cookie-category-name">Statistik</div>
              <div class="cookie-category-desc">${settings.analyticsDesc}</div>
            </div>
            <label class="cookie-toggle">
              <input type="checkbox" id="cookie-analytics">
              <span class="cookie-toggle-slider"></span>
            </label>
          </div>

          <div class="cookie-category">
            <div class="cookie-category-info">
              <div class="cookie-category-name">Marketing</div>
              <div class="cookie-category-desc">${settings.marketingDesc}</div>
            </div>
            <label class="cookie-toggle">
              <input type="checkbox" id="cookie-marketing">
              <span class="cookie-toggle-slider"></span>
            </label>
          </div>
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
        </div>
      </div>
    `;

    document.body.appendChild(banner);
  }

  // Initialize
  function init() {
    // Only run on pages that should show cookie consent
    // (not on admin pages like index.html)
    if (window.location.pathname.includes('index.html')) {
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
    getSettings
  };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
