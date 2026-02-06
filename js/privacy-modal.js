/**
 * Privacy Modal Management
 * Advanced privacy settings modal that works alongside the cookie consent banner
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

  // Default settings
  const defaultSettings = {
    title: 'Privatlivsindstillinger',
    description: 'Vi bruger cookies og lignende teknologier til at forbedre din oplevelse, analysere trafik og personliggøre indhold. Du kan tilpasse dine præferencer nedenfor.',
    btnAccept: 'Accepter alle',
    btnDeny: 'Kun nødvendige',
    btnSave: 'Gem mine valg',
    enabled: true
  };

  // Get settings (merge defaults with any saved admin settings)
  function getSettings() {
    const saved = localStorage.getItem('privacyModalSettings');
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) };
    }
    return defaultSettings;
  }

  // Get current consent from CookieConsent or localStorage
  function getConsent() {
    // Try to get from CookieConsent first
    if (window.CookieConsent && typeof window.CookieConsent.getConsent === 'function') {
      return window.CookieConsent.getConsent();
    }
    // Fall back to localStorage
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

    // Dispatch events
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: consent }));
    window.dispatchEvent(new CustomEvent('privacySettingsUpdated', { detail: consent }));

    return consent;
  }

  // Create modal HTML
  function createModal() {
    const settings = getSettings();

    if (!settings.enabled) return;

    // Check if modal already exists
    if (document.getElementById('privacy-modal-overlay')) return;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'privacy-modal-overlay';
    overlay.className = 'privacy-modal-overlay';
    overlay.onclick = function(e) {
      if (e.target === overlay) {
        hide();
      }
    };

    // Create modal wrapper
    const wrapper = document.createElement('div');
    wrapper.id = 'privacy-modal-wrapper';
    wrapper.className = 'privacy-modal-wrapper';

    // Get current consent and categories
    const currentConsent = getConsent() || {};
    const categories = getPrivacyCategories();

    wrapper.innerHTML = `
      <div class="privacy-modal">
        <div class="privacy-modal-header">
          <span class="privacy-title">${settings.title}</span>
          <div class="privacy-language-indicator" style="display:flex;align-items:center;gap:6px;margin:8px 0 4px;font-size:12px;color:#666">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            <span>Dansk (primær) · English (sekundær)</span>
          </div>
          <p class="privacy-text">${settings.description}</p>
          <button class="privacy-modal-close" onclick="PrivacyModal.hide()" aria-label="Luk">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="privacy-modal-content">
          <div class="privacy-category-list">
            ${categories.map(cat => `
              <div class="privacy-category">
                <div class="privacy-category-header">
                  <div class="privacy-category-info">
                    <div class="privacy-category-name">${cat.name}</div>
                    <div class="privacy-category-desc">${cat.description}</div>
                  </div>
                  <label class="privacy-toggle">
                    <input type="checkbox"
                           id="privacy-${cat.id}"
                           data-category-id="${cat.id}"
                           ${cat.required ? 'checked disabled' : ''}
                           ${!cat.required && currentConsent[cat.id] ? 'checked' : ''}>
                    <span class="privacy-toggle-slider"></span>
                  </label>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="privacy-modal-links">
            <a href="/landing-pages/cookie-settings.html">Cookie-politik</a>
            <a href="/landing-pages/privacy.html">Privatlivspolitik</a>
          </div>
        </div>

        <div class="privacy-modal-footer">
          <div class="privacy-modal-buttons">
            <button class="privacy-btn-accept" onclick="PrivacyModal.acceptAll()">${settings.btnAccept}</button>
            <button class="privacy-btn-deny" onclick="PrivacyModal.rejectAll()">${settings.btnDeny}</button>
            <button class="privacy-btn-save" onclick="PrivacyModal.saveSelection()">${settings.btnSave}</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(wrapper);
  }

  // Show modal
  function show() {
    createModal();

    const overlay = document.getElementById('privacy-modal-overlay');
    const wrapper = document.getElementById('privacy-modal-wrapper');

    if (overlay && wrapper) {
      // Update toggles with current consent (for all dynamic categories)
      const currentConsent = getConsent() || {};
      const categories = getPrivacyCategories();
      categories.forEach(cat => {
        if (!cat.required) {
          const toggle = document.getElementById(`privacy-${cat.id}`);
          if (toggle) {
            toggle.checked = currentConsent[cat.id] || false;
          }
        }
      });

      // Small delay for animation
      requestAnimationFrame(() => {
        overlay.classList.add('visible');
        wrapper.classList.add('visible');
        document.body.style.overflow = 'hidden';
      });
    }
  }

  // Hide modal
  function hide() {
    const overlay = document.getElementById('privacy-modal-overlay');
    const wrapper = document.getElementById('privacy-modal-wrapper');

    if (overlay && wrapper) {
      overlay.classList.remove('visible');
      wrapper.classList.remove('visible');
      document.body.style.overflow = '';
    }
  }

  // Accept all - set all non-required categories to true
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

  // Reject all - set all non-required categories to false
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

  // Save current selection - read all checkboxes
  function saveSelection() {
    const categories = getPrivacyCategories();
    const preferences = {};

    categories.forEach(cat => {
      const toggle = document.getElementById(`privacy-${cat.id}`);
      preferences[cat.id] = cat.required ? true : (toggle?.checked || false);
    });

    saveConsent(preferences);
    hide();

    // Also hide cookie banner if visible
    if (window.CookieConsent && typeof window.CookieConsent.hideBanner === 'function') {
      window.CookieConsent.hideBanner();
    }
  }

  // Check if modal is enabled
  function isEnabled() {
    const settings = getSettings();
    return settings.enabled;
  }

  // Expose API globally
  window.PrivacyModal = {
    show,
    hide,
    acceptAll,
    rejectAll,
    saveSelection,
    isEnabled,
    getSettings
  };

})();
