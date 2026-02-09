/**
 * Privacy Modal Management
 * Cookiebot-style privacy consent modal with 3 tabs: Samtykke, Detaljer, Om
 */

(function() {
  'use strict';

  // Track current active tab for language switch preservation
  let currentActiveTab = 'consent';

  // Cookie detail data — what FLOW actually collects
  const COOKIE_DETAILS = {
    necessary: [
      { name: 'cookieConsent', provider: 'FLOW', purpose: 'Gemmer brugerens cookie-samtykkevalg', purposeEN: 'Stores the user\'s cookie consent choices', type: 'localStorage', expiry: 'Permanent' },
      { name: 'orderflow_session', provider: 'FLOW', purpose: 'Session-data til aktiv brugersession', purposeEN: 'Session data for active user session', type: 'localStorage', expiry: 'Session' },
      { name: 'theme', provider: 'FLOW', purpose: 'Gemmer brugerens valg af lyst/m\u00f8rkt tema', purposeEN: 'Stores user\'s light/dark theme preference', type: 'localStorage', expiry: 'Permanent' },
      { name: 'sidebarCollapsed', provider: 'FLOW', purpose: 'Husker sidebar UI-tilstand', purposeEN: 'Remembers sidebar UI state', type: 'localStorage', expiry: 'Permanent' },
      { name: 'orderflow_language', provider: 'FLOW', purpose: 'Gemmer sprogvalg for applikationen', purposeEN: 'Stores application language selection', type: 'localStorage', expiry: 'Permanent' },
      { name: 'privacy_language', provider: 'FLOW', purpose: 'Gemmer sprogvalg i privatlivsindstillinger', purposeEN: 'Stores privacy modal language selection', type: 'localStorage', expiry: 'Permanent' }
    ],
    functional: [
      { name: 'orderflow_notification_settings', provider: 'FLOW', purpose: 'Notifikationspr\u00e6ferencer', purposeEN: 'Notification preferences', type: 'localStorage', expiry: 'Permanent' },
      { name: 'orderflow_quiet_hours', provider: 'FLOW', purpose: 'Indstillinger for stille timer', purposeEN: 'Quiet hours settings', type: 'localStorage', expiry: 'Permanent' },
      { name: 'orderflow_webbuilder_config_*', provider: 'FLOW', purpose: 'Web builder konfiguration per skabelon', purposeEN: 'Web builder config per template', type: 'localStorage', expiry: 'Permanent' },
      { name: 'orderflow_activity_indicator_settings', provider: 'FLOW', purpose: 'Aktivitetsindikator indstillinger', purposeEN: 'Activity indicator settings', type: 'localStorage', expiry: 'Permanent' }
    ],
    analytics: [
      { name: 'orderflow_visitor_id', provider: 'FLOW', purpose: 'Anonymt bes\u00f8gs-ID til statistik', purposeEN: 'Anonymous visitor ID for analytics', type: 'localStorage', expiry: 'Permanent' },
      { name: 'orderflow_session_data', provider: 'FLOW', purpose: 'Sessionsanalyse data', purposeEN: 'Session analytics data', type: 'sessionStorage', expiry: 'Session' },
      { name: 'orderflow_activity_log', provider: 'FLOW', purpose: 'Aktivitetssporing', purposeEN: 'Activity tracking', type: 'localStorage', expiry: 'Permanent' }
    ],
    marketing: []
  };

  // Language texts
  const LANG_TEXTS = {
    da: {
      // Tabs
      tabConsent: 'Samtykke',
      tabDetails: 'Detaljer',
      tabAbout: 'Om',
      // Samtykke tab
      consentTitle: 'Denne hjemmeside bruger cookies',
      consentText: 'Vi bruger cookies og lignende teknologier til at tilpasse vores indhold, til at analysere vores trafik og til at forbedre din oplevelse. Du kan tilpasse dine pr\u00e6ferencer nedenfor eller acceptere alle.',
      // Buttons
      btnAccept: 'Tillad alle',
      btnDeny: 'Afvis',
      btnSave: 'Tillad valgte',
      closeLabel: 'Luk',
      // Links
      cookiePolicy: 'Cookie-politik',
      privacyPolicy: 'Privatlivspolitik',
      // Detaljer tab
      detailsIntro: 'Her kan du se detaljer om de cookies og data vi bruger.',
      noCookies: 'Vi bruger ikke cookies af denne type.',
      // Cookie table headers
      thName: 'Navn',
      thProvider: 'Udbyder',
      thPurpose: 'Form\u00e5l',
      thType: 'Type',
      thExpiry: 'Udl\u00f8b',
      // Om tab
      aboutText1: 'Cookies er sm\u00e5 tekstfiler, som kan bruges af websteder til at g\u00f8re en brugers oplevelse mere effektiv.',
      aboutText2: 'Loven fastsl\u00e5r, at vi kan gemme cookies p\u00e5 din enhed, hvis de er strengt n\u00f8dvendige for at sikre leveringen af den tjeneste, du udtrykkeligt har anmodet om at bruge. For alle andre typer cookies skal vi indhente dit samtykke. Det betyder, at cookies, der kategoriseres som n\u00f8dvendige, behandles i henhold til GDPR art. 6(1)(f). Alle andre cookies, dvs. cookies fra kategorierne pr\u00e6ferencer og marketing, behandles i henhold til GDPR art. 6(1)(a).',
      aboutText3: 'Dette websted bruger forskellige typer af cookies. Nogle cookies s\u00e6ttes af tredjeparts tjenester, der vises p\u00e5 vores sider.',
      aboutText4: 'Du kan til enhver tid \u00e6ndre eller tilbagetr\u00e6kke dit samtykke fra Cookiedeklarationen p\u00e5 vores hjemmeside.',
      aboutText5: 'F\u00e5 mere at vide om, hvem vi er, hvordan du kan kontakte os, og hvordan vi behandler persondata i vores',
      cookieDeclaration: 'Cookiedeklarationen',
      // Categories
      categories: {
        necessary: {
          name: 'N\u00f8dvendige',
          description: 'N\u00f8dvendige cookies hj\u00e6lper med at g\u00f8re en hjemmeside brugbar ved at aktivere grundl\u00e6ggende funktioner s\u00e5som side-navigation og adgang til sikre omr\u00e5der af hjemmesiden. Hjemmesiden kan ikke fungere ordentligt uden disse cookies.'
        },
        functional: {
          name: 'Pr\u00e6ferencer',
          description: 'Pr\u00e6ference-cookies g\u00f8r det muligt for en hjemmeside at huske oplysninger, der \u00e6ndrer den m\u00e5de hjemmesiden ser ud eller opf\u00f8rer sig p\u00e5. F.eks. dit foretrukne sprog, eller den region du befinder dig i.'
        },
        analytics: {
          name: 'Statistik',
          description: 'Statistiske cookies giver hjemmesideejere indsigt i brugernes interaktion med hjemmesiden, ved at indsamle og rapportere oplysninger anonymt.'
        },
        marketing: {
          name: 'Marketing',
          description: 'Marketing cookies bruges til at spore brugere p\u00e5 tv\u00e6rs af websites. Hensigten er at vise annoncer, der er relevante og engagerende for den enkelte bruger, og dermed mere v\u00e6rdifulde for udgivere og tredjeparts-annoncerer.'
        }
      }
    },
    en: {
      tabConsent: 'Consent',
      tabDetails: 'Details',
      tabAbout: 'About',
      consentTitle: 'This website uses cookies',
      consentText: 'We use cookies and similar technologies to customize our content, analyze our traffic and improve your experience. You can customize your preferences below or accept all.',
      btnAccept: 'Allow all',
      btnDeny: 'Deny',
      btnSave: 'Allow selection',
      closeLabel: 'Close',
      cookiePolicy: 'Cookie Policy',
      privacyPolicy: 'Privacy Policy',
      detailsIntro: 'Here you can see details about the cookies and data we use.',
      noCookies: 'We do not use cookies of this type.',
      thName: 'Name',
      thProvider: 'Provider',
      thPurpose: 'Purpose',
      thType: 'Type',
      thExpiry: 'Expiry',
      aboutText1: 'Cookies are small text files that can be used by websites to make a user\'s experience more efficient.',
      aboutText2: 'The law states that we can store cookies on your device if they are strictly necessary to ensure the delivery of the service you have explicitly requested to use. For all other types of cookies, we need to obtain your consent. This means that cookies categorized as necessary are processed in accordance with GDPR Art. 6(1)(f). All other cookies, i.e. cookies from the categories preferences and marketing, are processed in accordance with GDPR Art. 6(1)(a).',
      aboutText3: 'This website uses different types of cookies. Some cookies are placed by third party services that appear on our pages.',
      aboutText4: 'You can at any time change or withdraw your consent from the Cookie Declaration on our website.',
      aboutText5: 'Find out more about who we are, how you can contact us, and how we process personal data in our',
      cookieDeclaration: 'Cookie Declaration',
      categories: {
        necessary: {
          name: 'Necessary',
          description: 'Necessary cookies help make a website usable by enabling basic functions like page navigation and access to secure areas of the website. The website cannot function properly without these cookies.'
        },
        functional: {
          name: 'Preferences',
          description: 'Preference cookies enable a website to remember information that changes the way the website behaves or looks, like your preferred language or the region that you are in.'
        },
        analytics: {
          name: 'Statistics',
          description: 'Statistic cookies help website owners understand how visitors interact with websites by collecting and reporting information anonymously.'
        },
        marketing: {
          name: 'Marketing',
          description: 'Marketing cookies are used to track visitors across websites. The intention is to display ads that are relevant and engaging for the individual user and thereby more valuable for publishers and third party advertisers.'
        }
      }
    }
  };

  // Get current language
  function getCurrentLang() {
    return localStorage.getItem('privacy_language') || 'da';
  }

  // Default categories (fallback if none saved)
  const DEFAULT_CATEGORIES = [
    { id: 'necessary', name: 'N\u00f8dvendige', description: 'Disse cookies er n\u00f8dvendige for at hjemmesiden kan fungere korrekt.', required: true },
    { id: 'functional', name: 'Funktionelle', description: 'Disse cookies g\u00f8r det muligt at huske dine pr\u00e6ferencer.', required: false },
    { id: 'analytics', name: 'Statistik', description: 'Disse cookies hj\u00e6lper os med at forst\u00e5, hvordan bes\u00f8gende bruger vores hjemmeside.', required: false },
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
    if (window.CookieConsent && typeof window.CookieConsent.getConsent === 'function') {
      return window.CookieConsent.getConsent();
    }
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
    categories.forEach(cat => {
      consent[cat.id] = cat.required ? true : (preferences[cat.id] || false);
    });
    localStorage.setItem('cookieConsent', JSON.stringify(consent));
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: consent }));
    window.dispatchEvent(new CustomEvent('privacySettingsUpdated', { detail: consent }));
    return consent;
  }

  // Render cookie table for a category
  function renderCookieTable(categoryId, lang) {
    const cookies = COOKIE_DETAILS[categoryId] || [];
    const t = LANG_TEXTS[lang] || LANG_TEXTS.da;

    if (cookies.length === 0) {
      return '<p class="privacy-no-cookies">' + t.noCookies + '</p>';
    }

    return '<div class="privacy-cookie-table-wrap"><table class="privacy-cookie-table"><thead><tr>' +
      '<th>' + t.thName + '</th>' +
      '<th>' + t.thProvider + '</th>' +
      '<th>' + t.thPurpose + '</th>' +
      '<th>' + t.thType + '</th>' +
      '<th>' + t.thExpiry + '</th>' +
      '</tr></thead><tbody>' +
      cookies.map(function(c) {
        return '<tr>' +
          '<td class="privacy-cookie-name">' + c.name + '</td>' +
          '<td>' + c.provider + '</td>' +
          '<td>' + (lang === 'en' ? c.purposeEN : c.purpose) + '</td>' +
          '<td>' + c.type + '</td>' +
          '<td>' + c.expiry + '</td>' +
          '</tr>';
      }).join('') +
      '</tbody></table></div>';
  }

  // Create modal HTML
  function createModal() {
    const settings = getSettings();
    if (!settings.enabled) return;
    if (document.getElementById('privacy-modal-overlay')) return;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'privacy-modal-overlay';
    overlay.className = 'privacy-modal-overlay';
    overlay.onclick = function(e) {
      if (e.target === overlay) hide();
    };

    // Create modal wrapper
    const wrapper = document.createElement('div');
    wrapper.id = 'privacy-modal-wrapper';
    wrapper.className = 'privacy-modal-wrapper';

    const currentConsent = getConsent() || {};
    const categories = getPrivacyCategories();
    const lang = getCurrentLang();
    const t = LANG_TEXTS[lang] || LANG_TEXTS.da;

    // Build Samtykke tab content
    var consentHtml = '<div class="privacy-panel' + (currentActiveTab === 'consent' ? ' active' : '') + '" id="privacy-panel-consent">' +
      '<div class="privacy-consent-title">' + t.consentTitle + '</div>' +
      '<p class="privacy-consent-text">' + t.consentText + '</p>' +
      '<div class="privacy-consent-categories">';

    categories.forEach(function(cat) {
      var catText = t.categories[cat.id] || { name: cat.name, description: cat.description };
      var cookieCount = (COOKIE_DETAILS[cat.id] || []).length;
      consentHtml += '<div class="privacy-consent-row">' +
        '<div class="privacy-consent-info">' +
          '<span class="privacy-consent-label">' + catText.name + '</span>' +
        '</div>' +
        '<label class="privacy-toggle">' +
          '<input type="checkbox" id="privacy-consent-' + cat.id + '" data-category-id="' + cat.id + '"' +
          (cat.required ? ' checked disabled' : '') +
          (!cat.required && currentConsent[cat.id] ? ' checked' : '') +
          ' onchange="PrivacyModal.syncToggle(\'' + cat.id + '\', this.checked)">' +
          '<span class="privacy-toggle-slider"></span>' +
        '</label>' +
      '</div>';
    });

    consentHtml += '</div>' +
      '<div class="privacy-consent-show-details"><a href="#" onclick="PrivacyModal.switchTab(\'details\');return false">Vis detaljer</a></div>' +
    '</div>';

    // Build Detaljer tab content
    var detailsHtml = '<div class="privacy-panel' + (currentActiveTab === 'details' ? ' active' : '') + '" id="privacy-panel-details">' +
      '<div class="privacy-details-sr-only">Detaljer</div>';

    categories.forEach(function(cat) {
      var catText = t.categories[cat.id] || { name: cat.name, description: cat.description };
      var cookieCount = (COOKIE_DETAILS[cat.id] || []).length;

      detailsHtml += '<div class="privacy-detail-category">' +
        '<div class="privacy-detail-header" onclick="PrivacyModal.toggleCategoryDetails(\'' + cat.id + '\')">' +
          '<div class="privacy-detail-left">' +
            '<button class="privacy-expand-btn" id="privacy-expand-' + cat.id + '" aria-expanded="false" aria-label="' + catText.name + ' (' + cookieCount + ')">' +
              '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>' +
            '</button>' +
            '<span class="privacy-detail-name">' + catText.name + '</span>' +
            '<span class="privacy-cookie-count">' + cookieCount + '</span>' +
          '</div>' +
          '<label class="privacy-toggle" onclick="event.stopPropagation()">' +
            '<input type="checkbox" id="privacy-detail-' + cat.id + '" data-category-id="' + cat.id + '"' +
            (cat.required ? ' checked disabled' : '') +
            (!cat.required && currentConsent[cat.id] ? ' checked' : '') +
            ' onchange="PrivacyModal.syncToggle(\'' + cat.id + '\', this.checked)">' +
            '<span class="privacy-toggle-slider"></span>' +
          '</label>' +
        '</div>' +
        '<div class="privacy-detail-intro">' + catText.description + '</div>' +
        '<div class="privacy-detail-body" id="privacy-details-' + cat.id + '">' +
          renderCookieTable(cat.id, lang) +
        '</div>' +
      '</div>';
    });

    // Cross-domain consent section
    detailsHtml += '<div class="privacy-cross-domain">' +
      '<div class="privacy-cross-domain-header" onclick="PrivacyModal.toggleCrossConsent()">' +
        '<button class="privacy-expand-btn" id="privacy-expand-cross" aria-expanded="false">' +
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>' +
        '</button>' +
        '<span class="privacy-detail-name">Samtykke p\u00e5 tv\u00e6rs af dom\u00e6ner</span>' +
        '<span class="privacy-cookie-count">1</span>' +
      '</div>' +
      '<span class="privacy-cross-domain-desc">Dit samtykke g\u00e6lder for f\u00f8lgende dom\u00e6ner:</span>' +
      '<div class="privacy-cross-domain-body" id="privacy-cross-domains">' +
        '<div class="privacy-cross-domain-list">' +
          '<strong>Liste over dom\u00e6ner, dit samtykke g\u00e6lder for:</strong>' +
          '<div class="privacy-domain-links">' +
            '<a href="https://orderflow.dk" target="_blank" rel="noopener noreferrer">orderflow.dk</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

    detailsHtml += '<div class="privacy-declaration-date">Cookiedeklarationen er sidst opdateret d. ' + new Date().toLocaleDateString('da-DK', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' af <a href="https://orderflow.dk" target="_blank" rel="noopener">FLOW</a></div>';
    detailsHtml += '</div>';

    // Build Om tab content
    var aboutHtml = '<div class="privacy-panel' + (currentActiveTab === 'about' ? ' active' : '') + '" id="privacy-panel-about">' +
      '<div class="privacy-about-sr-only">Om</div>' +
      '<div class="privacy-about-content">' +
        '<p>' + t.aboutText1 + '</p>' +
        '<p>' + t.aboutText2 + '</p>' +
        '<p>' + t.aboutText3 + '</p>' +
        '<p>' + t.aboutText4 + '</p>' +
        '<p>' + t.aboutText5 + ' <a href="/landing-pages/privacy.html" class="privacy-about-link">' + t.privacyPolicy + '</a>.</p>' +
      '</div>' +
    '</div>';

    wrapper.innerHTML =
      '<div class="privacy-modal">' +
        '<div class="privacy-modal-header">' +
          '<span class="privacy-title">' + settings.title + '</span>' +
          '<div class="privacy-lang-selector" onclick="PrivacyModal.toggleLangDropdown(event)">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>' +
            '<div class="privacy-lang-dropdown" id="privacy-lang-dropdown">' +
              '<button class="privacy-lang-option' + (lang === 'da' ? ' active' : '') + '" onclick="PrivacyModal.setLanguage(\'da\',event)">' +
                '<span>\ud83c\udde9\ud83c\uddf0</span> Dansk' +
              '</button>' +
              '<button class="privacy-lang-option' + (lang === 'en' ? ' active' : '') + '" onclick="PrivacyModal.setLanguage(\'en\',event)">' +
                '<span>\ud83c\uddec\ud83c\udde7</span> English' +
              '</button>' +
            '</div>' +
          '</div>' +
          '<button class="privacy-modal-close" onclick="PrivacyModal.hide()" aria-label="' + t.closeLabel + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
              '<line x1="18" y1="6" x2="6" y2="18"></line>' +
              '<line x1="6" y1="6" x2="18" y2="18"></line>' +
            '</svg>' +
          '</button>' +
        '</div>' +

        '<div class="privacy-modal-tabs">' +
          '<button class="privacy-tab-btn' + (currentActiveTab === 'consent' ? ' active' : '') + '" data-tab="consent" onclick="PrivacyModal.switchTab(\'consent\')">' + t.tabConsent + '</button>' +
          '<button class="privacy-tab-btn' + (currentActiveTab === 'details' ? ' active' : '') + '" data-tab="details" onclick="PrivacyModal.switchTab(\'details\')">' + t.tabDetails + '</button>' +
          '<button class="privacy-tab-btn' + (currentActiveTab === 'about' ? ' active' : '') + '" data-tab="about" onclick="PrivacyModal.switchTab(\'about\')">' + t.tabAbout + '</button>' +
        '</div>' +

        '<div class="privacy-modal-content">' +
          consentHtml +
          detailsHtml +
          aboutHtml +
        '</div>' +

        '<div class="privacy-modal-footer">' +
          '<div class="privacy-modal-buttons">' +
            '<button class="privacy-btn-deny" onclick="PrivacyModal.rejectAll()">' + t.btnDeny + '</button>' +
            '<button class="privacy-btn-save" onclick="PrivacyModal.saveSelection()">' + t.btnSave + '</button>' +
            '<button class="privacy-btn-accept" onclick="PrivacyModal.acceptAll()">' + t.btnAccept + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    document.body.appendChild(wrapper);
  }

  // Switch between tabs
  function switchTab(tabId) {
    currentActiveTab = tabId;
    document.querySelectorAll('.privacy-tab-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    document.querySelectorAll('.privacy-panel').forEach(function(panel) {
      panel.classList.toggle('active', panel.id === 'privacy-panel-' + tabId);
    });
  }

  // Toggle expandable cookie details within a category
  function toggleCategoryDetails(categoryId) {
    var details = document.getElementById('privacy-details-' + categoryId);
    var expandBtn = document.getElementById('privacy-expand-' + categoryId);
    if (details) {
      details.classList.toggle('visible');
      if (expandBtn) {
        expandBtn.classList.toggle('expanded');
        expandBtn.setAttribute('aria-expanded', details.classList.contains('visible'));
      }
    }
  }

  // Toggle cross-domain consent section
  function toggleCrossConsent() {
    var body = document.getElementById('privacy-cross-domains');
    var btn = document.getElementById('privacy-expand-cross');
    if (body) {
      body.classList.toggle('visible');
      if (btn) {
        btn.classList.toggle('expanded');
        btn.setAttribute('aria-expanded', body.classList.contains('visible'));
      }
    }
  }

  // Sync toggles between Samtykke and Detaljer tabs
  function syncToggle(categoryId, checked) {
    var consentEl = document.getElementById('privacy-consent-' + categoryId);
    var detailEl = document.getElementById('privacy-detail-' + categoryId);
    if (consentEl) consentEl.checked = checked;
    if (detailEl) detailEl.checked = checked;
  }

  // Show modal
  function show() {
    createModal();

    var overlay = document.getElementById('privacy-modal-overlay');
    var wrapper = document.getElementById('privacy-modal-wrapper');

    if (overlay && wrapper) {
      // Update toggles with current consent
      var currentConsent = getConsent() || {};
      var categories = getPrivacyCategories();
      categories.forEach(function(cat) {
        if (!cat.required) {
          var consentToggle = document.getElementById('privacy-consent-' + cat.id);
          var detailToggle = document.getElementById('privacy-detail-' + cat.id);
          var checked = currentConsent[cat.id] || false;
          if (consentToggle) consentToggle.checked = checked;
          if (detailToggle) detailToggle.checked = checked;
        }
      });

      requestAnimationFrame(function() {
        overlay.classList.add('visible');
        wrapper.classList.add('visible');
        document.body.style.overflow = 'hidden';
      });
    }
  }

  // Hide modal
  function hide() {
    var overlay = document.getElementById('privacy-modal-overlay');
    var wrapper = document.getElementById('privacy-modal-wrapper');
    if (overlay && wrapper) {
      overlay.classList.remove('visible');
      wrapper.classList.remove('visible');
      document.body.style.overflow = '';
    }
  }

  // Accept all
  function acceptAll() {
    var categories = getPrivacyCategories();
    var preferences = {};
    categories.forEach(function(cat) { preferences[cat.id] = true; });
    saveConsent(preferences);
    hide();
    if (window.CookieConsent && typeof window.CookieConsent.hideBanner === 'function') {
      window.CookieConsent.hideBanner();
    }
  }

  // Reject all
  function rejectAll() {
    var categories = getPrivacyCategories();
    var preferences = {};
    categories.forEach(function(cat) { preferences[cat.id] = cat.required ? true : false; });
    saveConsent(preferences);
    hide();
    if (window.CookieConsent && typeof window.CookieConsent.hideBanner === 'function') {
      window.CookieConsent.hideBanner();
    }
  }

  // Save current selection
  function saveSelection() {
    var categories = getPrivacyCategories();
    var preferences = {};
    categories.forEach(function(cat) {
      var toggle = document.getElementById('privacy-consent-' + cat.id);
      preferences[cat.id] = cat.required ? true : (toggle ? toggle.checked : false);
    });
    saveConsent(preferences);
    hide();
    if (window.CookieConsent && typeof window.CookieConsent.hideBanner === 'function') {
      window.CookieConsent.hideBanner();
    }
  }

  // Check if modal is enabled
  function isEnabled() {
    var settings = getSettings();
    return settings.enabled;
  }

  // Toggle language dropdown
  function toggleLangDropdown(event) {
    event.stopPropagation();
    var dropdown = document.getElementById('privacy-lang-dropdown');
    if (dropdown) dropdown.classList.toggle('visible');
  }

  // Set language and re-render modal
  function setLanguage(lang, event) {
    if (event) event.stopPropagation();
    localStorage.setItem('privacy_language', lang);

    var dropdown = document.getElementById('privacy-lang-dropdown');
    if (dropdown) dropdown.classList.remove('visible');

    // Remember current tab
    var activeBtn = document.querySelector('.privacy-tab-btn.active');
    if (activeBtn) currentActiveTab = activeBtn.dataset.tab;

    // Remove and re-create
    var overlay = document.getElementById('privacy-modal-overlay');
    var wrapper = document.getElementById('privacy-modal-wrapper');
    if (overlay) overlay.remove();
    if (wrapper) wrapper.remove();

    show();
  }

  // Close dropdown on outside click
  document.addEventListener('click', function() {
    var dropdown = document.getElementById('privacy-lang-dropdown');
    if (dropdown) dropdown.classList.remove('visible');
  });

  // Expose API globally
  window.PrivacyModal = {
    show: show,
    hide: hide,
    acceptAll: acceptAll,
    rejectAll: rejectAll,
    saveSelection: saveSelection,
    isEnabled: isEnabled,
    getSettings: getSettings,
    toggleLangDropdown: toggleLangDropdown,
    setLanguage: setLanguage,
    switchTab: switchTab,
    toggleCategoryDetails: toggleCategoryDetails,
    toggleCrossConsent: toggleCrossConsent,
    syncToggle: syncToggle
  };

})();
