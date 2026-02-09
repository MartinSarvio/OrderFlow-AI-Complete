/**
 * Privacy Modal Management
 * Advanced privacy settings modal that works alongside the cookie consent banner
 */

(function() {
  'use strict';

  // Language texts
  const LANG_TEXTS = {
    da: {
      description: 'Vi bruger cookies og lignende teknologier til at forbedre din oplevelse, analysere trafik og personliggøre indhold. Du kan tilpasse dine præferencer nedenfor.',
      btnAccept: 'Accepter alle',
      btnDeny: 'Kun nødvendige',
      btnSave: 'Gem mine valg',
      closeLabel: 'Luk',
      cookiePolicy: 'Cookie-politik',
      privacyPolicy: 'Privatlivspolitik',
      categories: {
        necessary: { name: 'Nødvendige', description: 'Disse cookies er nødvendige for at hjemmesiden kan fungere korrekt.' },
        functional: { name: 'Funktionelle', description: 'Disse cookies gør det muligt at huske dine præferencer.' },
        analytics: { name: 'Statistik', description: 'Disse cookies hjælper os med at forstå, hvordan besøgende bruger vores hjemmeside.' },
        marketing: { name: 'Marketing', description: 'Disse cookies bruges til at vise dig relevante annoncer.' }
      }
    },
    en: {
      description: 'We use cookies and similar technologies to improve your experience, analyze traffic and personalize content. You can customize your preferences below.',
      btnAccept: 'Accept all',
      btnDeny: 'Only necessary',
      btnSave: 'Save my choices',
      closeLabel: 'Close',
      cookiePolicy: 'Cookie Policy',
      privacyPolicy: 'Privacy Policy',
      categories: {
        necessary: { name: 'Necessary', description: 'These cookies are essential for the website to function properly.' },
        functional: { name: 'Functional', description: 'These cookies allow us to remember your preferences.' },
        analytics: { name: 'Analytics', description: 'These cookies help us understand how visitors use our website.' },
        marketing: { name: 'Marketing', description: 'These cookies are used to show you relevant advertisements.' }
      }
    }
  };

  // Get current language
  function getCurrentLang() {
    return localStorage.getItem('privacy_language') || 'da';
  }

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

    const lang = getCurrentLang();
    const t = LANG_TEXTS[lang] || LANG_TEXTS.da;

    wrapper.innerHTML = `
      <div class="privacy-modal">
        <div class="privacy-modal-header">
          <span class="privacy-title">${settings.title}</span>
          <div class="privacy-lang-selector" onclick="PrivacyModal.toggleLangDropdown(event)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            <div class="privacy-lang-dropdown" id="privacy-lang-dropdown">
              <button class="privacy-lang-option${lang === 'da' ? ' active' : ''}" onclick="PrivacyModal.setLanguage('da',event)">
                <span>\ud83c\udde9\ud83c\uddf0</span> Dansk
              </button>
              <button class="privacy-lang-option${lang === 'en' ? ' active' : ''}" onclick="PrivacyModal.setLanguage('en',event)">
                <span>\ud83c\uddec\ud83c\udde7</span> English
              </button>
            </div>
          </div>
          <p class="privacy-text">${t.description}</p>
          <button class="privacy-modal-close" onclick="PrivacyModal.hide()" aria-label="${t.closeLabel}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="privacy-modal-content">
          <div class="privacy-category-list">
            ${categories.map(cat => {
              const catText = t.categories[cat.id] || { name: cat.name, description: cat.description };
              return `
              <div class="privacy-category">
                <div class="privacy-category-header">
                  <div class="privacy-category-info">
                    <div class="privacy-category-name">${catText.name}</div>
                    <div class="privacy-category-desc">${catText.description}</div>
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
              </div>`;
            }).join('')}
          </div>

          <div class="privacy-modal-links">
            <a href="/landing-pages/cookie-settings.html">${t.cookiePolicy}</a>
            <a href="/landing-pages/privacy.html">${t.privacyPolicy}</a>
          </div>
        </div>

        <div class="privacy-modal-footer">
          <div class="privacy-modal-buttons">
            <button class="privacy-btn-accept" onclick="PrivacyModal.acceptAll()">${t.btnAccept}</button>
            <button class="privacy-btn-deny" onclick="PrivacyModal.rejectAll()">${t.btnDeny}</button>
            <button class="privacy-btn-save" onclick="PrivacyModal.saveSelection()">${t.btnSave}</button>
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

  // Toggle language dropdown
  function toggleLangDropdown(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('privacy-lang-dropdown');
    if (dropdown) {
      dropdown.classList.toggle('visible');
    }
  }

  // Set language and re-render modal
  function setLanguage(lang, event) {
    if (event) event.stopPropagation();
    localStorage.setItem('privacy_language', lang);

    // Close dropdown
    const dropdown = document.getElementById('privacy-lang-dropdown');
    if (dropdown) dropdown.classList.remove('visible');

    // Remove and re-create modal with new language
    const overlay = document.getElementById('privacy-modal-overlay');
    const wrapper = document.getElementById('privacy-modal-wrapper');
    if (overlay) overlay.remove();
    if (wrapper) wrapper.remove();

    // Re-show with new language
    show();
  }

  // Close dropdown on outside click
  document.addEventListener('click', function() {
    const dropdown = document.getElementById('privacy-lang-dropdown');
    if (dropdown) dropdown.classList.remove('visible');
  });

  // Expose API globally
  window.PrivacyModal = {
    show,
    hide,
    acceptAll,
    rejectAll,
    saveSelection,
    isEnabled,
    getSettings,
    toggleLangDropdown,
    setLanguage
  };

})();
