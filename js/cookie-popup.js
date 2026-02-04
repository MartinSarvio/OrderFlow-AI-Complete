/**
 * Cookie Popup Modal
 * Cookiebot-style popup consent dialog
 * Works with dynamic privacy categories from localStorage
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

  // Default settings
  const defaultSettings = {
    displayStyle: 'banner', // 'banner' or 'popup'
    bannerTitle: 'Vi bruger cookies',
    bannerDesc: 'Vi bruger cookies for at forbedre din oplevelse på vores hjemmeside, analysere trafik og personliggøre indhold.',
    btnAccept: 'Tillad alle',
    btnReject: 'Afvis alle',
    btnSave: 'Gem mine valg',
    popupSettings: {
      logoUrl: '',
      companyName: '',
      showAboutTab: true,
      primaryColor: '#14b8a6'
    }
  };

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

  // Get settings (merge defaults with any saved admin settings)
  function getSettings() {
    const saved = localStorage.getItem('cookieConsentSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaultSettings,
        ...parsed,
        popupSettings: {
          ...defaultSettings.popupSettings,
          ...(parsed.popupSettings || {})
        }
      };
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
    const categories = getPrivacyCategories();
    const consent = { timestamp: Date.now() };

    categories.forEach(cat => {
      consent[cat.id] = cat.required ? true : (preferences[cat.id] || false);
    });

    localStorage.setItem('cookieConsent', JSON.stringify(consent));

    // Dispatch events
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: consent }));
    window.dispatchEvent(new CustomEvent('privacySettingsUpdated', { detail: consent }));

    return consent;
  }

  // Create popup HTML
  function createPopup() {
    const settings = getSettings();
    const categories = getPrivacyCategories();
    const currentConsent = getConsent() || {};
    const popupSettings = settings.popupSettings || {};

    // Check if popup already exists
    if (document.getElementById('cookie-popup-overlay')) return;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'cookie-popup-overlay';
    overlay.className = 'cookie-popup-overlay';

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'cookie-popup-modal';
    modal.className = 'cookie-popup-modal';

    // Generate categories HTML for Details tab
    const categoriesHTML = categories.map(cat => `
      <div class="cookie-category-item" data-category="${cat.id}">
        <div class="cookie-category-header" onclick="CookiePopup.toggleDetails('${cat.id}')">
          <div class="cookie-category-info">
            <span class="cookie-category-name">${cat.name}</span>
          </div>
          <div class="cookie-category-toggle">
            <label class="cookie-toggle-switch">
              <input type="checkbox"
                     id="popup-cat-${cat.id}"
                     data-category-id="${cat.id}"
                     ${cat.required ? 'checked disabled' : ''}
                     ${!cat.required && currentConsent[cat.id] ? 'checked' : ''}>
              <span class="cookie-toggle-slider"></span>
            </label>
            <button class="cookie-expand-btn" id="expand-${cat.id}" aria-label="Vis detaljer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="cookie-category-details" id="details-${cat.id}">
          <p class="cookie-category-desc">${cat.description}</p>
          ${cat.required ? '<p style="font-size:12px;color:#14b8a6;margin-top:8px;">Denne kategori er nødvendig og kan ikke deaktiveres.</p>' : ''}
        </div>
      </div>
    `).join('');

    // Logo HTML
    const logoHTML = popupSettings.logoUrl
      ? `<img src="${popupSettings.logoUrl}" alt="Logo" class="cookie-popup-logo">`
      : `<div class="cookie-popup-logo-placeholder">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>
             <circle cx="8.5" cy="8.5" r="0.5"/><circle cx="16" cy="15.5" r="0.5"/>
             <circle cx="12" cy="12" r="0.5"/><circle cx="11" cy="17" r="0.5"/>
           </svg>
         </div>`;

    modal.innerHTML = `
      <!-- Header -->
      <div class="cookie-popup-header">
        ${logoHTML}
        <span class="cookie-popup-company">${popupSettings.companyName || 'Cookie Indstillinger'}</span>
      </div>

      <!-- Tabs -->
      <div class="cookie-popup-tabs">
        <button class="cookie-popup-tab active" data-tab="consent" onclick="CookiePopup.switchTab('consent')">Samtykke</button>
        <button class="cookie-popup-tab" data-tab="details" onclick="CookiePopup.switchTab('details')">Detaljer</button>
        ${popupSettings.showAboutTab !== false ? '<button class="cookie-popup-tab" data-tab="about" onclick="CookiePopup.switchTab(\'about\')">Om</button>' : ''}
      </div>

      <!-- Content -->
      <div class="cookie-popup-content">
        <!-- Consent Panel -->
        <div class="cookie-popup-panel active" id="panel-consent">
          <h3 class="cookie-popup-title">${settings.bannerTitle}</h3>
          <p class="cookie-popup-text">${settings.bannerDesc}</p>
        </div>

        <!-- Details Panel -->
        <div class="cookie-popup-panel" id="panel-details">
          <div class="cookie-category-list">
            ${categoriesHTML}
          </div>
        </div>

        <!-- About Panel -->
        ${popupSettings.showAboutTab !== false ? `
        <div class="cookie-popup-panel" id="panel-about">
          <div class="cookie-about-section">
            <h4 class="cookie-about-title">Hvad er cookies?</h4>
            <p class="cookie-about-text">Cookies er små tekstfiler, der gemmes på din computer eller mobilenhed, når du besøger en hjemmeside. De bruges til at huske dine præferencer og forbedre din brugeroplevelse.</p>
          </div>
          <div class="cookie-about-section">
            <h4 class="cookie-about-title">Sådan bruger vi cookies</h4>
            <p class="cookie-about-text">Vi bruger cookies til at huske dine indstillinger, analysere trafik på vores hjemmeside og personliggøre indhold. Du kan til enhver tid ændre dine præferencer.</p>
          </div>
          <div class="cookie-about-links">
            <a href="/landing-pages/cookie-settings.html" class="cookie-about-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Cookie-politik
            </a>
            <a href="/landing-pages/privacy.html" class="cookie-about-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Privatlivspolitik
            </a>
          </div>
        </div>
        ` : ''}
      </div>

      <!-- Footer -->
      <div class="cookie-popup-footer">
        <div class="cookie-popup-buttons">
          <button class="cookie-popup-btn cookie-popup-btn-accept" onclick="CookiePopup.acceptAll()">${settings.btnAccept || 'Tillad alle'}</button>
          <button class="cookie-popup-btn cookie-popup-btn-reject" onclick="CookiePopup.rejectAll()">${settings.btnReject || 'Afvis alle'}</button>
          <button class="cookie-popup-btn cookie-popup-btn-save" onclick="CookiePopup.saveSelection()">${settings.btnSave || 'Gem mine valg'}</button>
        </div>
        <div class="cookie-popup-powered">
          Drevet af <a href="#">OrderFlow</a>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
  }

  // Show popup
  function show() {
    createPopup();

    const overlay = document.getElementById('cookie-popup-overlay');
    const modal = document.getElementById('cookie-popup-modal');

    if (overlay && modal) {
      // Update toggles with current consent
      const currentConsent = getConsent() || {};
      const categories = getPrivacyCategories();

      categories.forEach(cat => {
        if (!cat.required) {
          const toggle = document.getElementById(`popup-cat-${cat.id}`);
          if (toggle) {
            toggle.checked = currentConsent[cat.id] || false;
          }
        }
      });

      // Show with animation
      requestAnimationFrame(() => {
        overlay.classList.add('visible');
        modal.classList.add('visible');
        document.body.style.overflow = 'hidden';
      });
    }
  }

  // Hide popup
  function hide() {
    const overlay = document.getElementById('cookie-popup-overlay');
    const modal = document.getElementById('cookie-popup-modal');

    if (overlay && modal) {
      overlay.classList.remove('visible');
      modal.classList.remove('visible');
      document.body.style.overflow = '';
    }
  }

  // Switch tab
  function switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.cookie-popup-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });

    // Update panels
    document.querySelectorAll('.cookie-popup-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `panel-${tabId}`);
    });
  }

  // Toggle category details
  function toggleDetails(categoryId) {
    const details = document.getElementById(`details-${categoryId}`);
    const expandBtn = document.getElementById(`expand-${categoryId}`);

    if (details && expandBtn) {
      details.classList.toggle('visible');
      expandBtn.classList.toggle('expanded');
    }
  }

  // Accept all
  function acceptAll() {
    const categories = getPrivacyCategories();
    const preferences = {};

    categories.forEach(cat => {
      preferences[cat.id] = true;
    });

    saveConsent(preferences);
    hide();

    // Also hide cookie banner if visible
    if (window.CookieConsent && typeof window.CookieConsent.hideBanner === 'function') {
      window.CookieConsent.hideBanner();
    }
  }

  // Reject all (only necessary)
  function rejectAll() {
    const categories = getPrivacyCategories();
    const preferences = {};

    categories.forEach(cat => {
      preferences[cat.id] = cat.required ? true : false;
    });

    saveConsent(preferences);
    hide();

    // Also hide cookie banner if visible
    if (window.CookieConsent && typeof window.CookieConsent.hideBanner === 'function') {
      window.CookieConsent.hideBanner();
    }
  }

  // Save current selection
  function saveSelection() {
    const categories = getPrivacyCategories();
    const preferences = {};

    categories.forEach(cat => {
      const toggle = document.getElementById(`popup-cat-${cat.id}`);
      preferences[cat.id] = cat.required ? true : (toggle?.checked || false);
    });

    saveConsent(preferences);
    hide();

    // Also hide cookie banner if visible
    if (window.CookieConsent && typeof window.CookieConsent.hideBanner === 'function') {
      window.CookieConsent.hideBanner();
    }
  }

  // Initialize
  function init() {
    // Only run on pages that should show cookie consent
    if (window.location.pathname.includes('index.html')) {
      return;
    }

    const settings = getSettings();

    // Only show popup if displayStyle is 'popup'
    if (settings.displayStyle !== 'popup') {
      return;
    }

    // Show popup if no consent given yet
    if (!hasConsent()) {
      setTimeout(show, 500);
    }
  }

  // Expose API globally
  window.CookiePopup = {
    init,
    show,
    hide,
    switchTab,
    toggleDetails,
    acceptAll,
    rejectAll,
    saveSelection,
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
