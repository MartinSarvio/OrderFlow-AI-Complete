// FLOW Builders Module — App Builder + Web Builder

function showAppBuilderPage(page) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // Show the requested App Builder page
  const pageEl = document.getElementById('page-appbuilder-' + page);
  if (pageEl) {
    pageEl.classList.add('active');
  }
  showPageIdBadge('appbuilder-' + page);

  // Clear all active states
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.nav-dropdown-item').forEach(i => i.classList.remove('active'));
  document.querySelectorAll('.nav-dropdown-toggle').forEach(t => t.classList.remove('active'));

  // Activate the App Builder dropdown
  const appBuilderDropdown = document.getElementById('nav-appbuilder');
  if (appBuilderDropdown) {
    // Activate toggle
    const toggle = appBuilderDropdown.querySelector('.nav-dropdown-toggle');
    if (toggle) toggle.classList.add('active');

    // Activate specific dropdown item
    const items = appBuilderDropdown.querySelectorAll('.nav-dropdown-item');
    items.forEach(item => {
      const onclick = item.getAttribute('onclick');
      if (onclick && onclick.includes(`'${page}'`)) {
        item.classList.add('active');
      }
    });

    // Ensure dropdown is open
    if (!appBuilderDropdown.classList.contains('open')) {
      appBuilderDropdown.classList.add('open');
    }
  }

  // Close sidebar on mobile
  if (window.innerWidth < 1024) {
    document.querySelector('.sidebar')?.classList.remove('open');
  }

  // Initialize page-specific content
  if (page === 'branding') {
    initBrandingPage();
  }

  // Reset unsaved flag - page load is not a user change
  setTimeout(() => {
    appBuilderHasChanges = false;
    updateAppBuilderSaveStatus('saved');
  }, 400);
}

// Update App Builder color
function updateAppBuilderColor(type, color) {
  // Update preview swatch
  const preview = document.getElementById(`appbuilder-${type}-preview`);
  if (preview) {
    preview.style.background = color;
  }

  // Update value display
  const valueEl = document.getElementById(`appbuilder-${type}-value`);
  if (valueEl) {
    valueEl.textContent = color.toUpperCase();
  }

  // Send to iframe
  const previewFrame = document.getElementById('pwa-preview-frame');
  if (previewFrame) {
    const config = {};
    config[type + 'Color'] = color;

    previewFrame.contentWindow.postMessage({
      type: 'UPDATE_CONFIG',
      config: config
    }, '*');
  }
}

// Adjust color brightness
function adjustColor(color, amount) {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Handle App Builder logo upload
function handleAppBuilderLogoUpload(input) {
  const file = input.files[0];
  if (!file) return;

  // Validate file size (2MB max)
  const maxSize = 2 * 1024 * 1024; // 2MB in bytes
  if (file.size > maxSize) {
    alert('Filen er for stor. Maksimal størrelse er 2MB.');
    input.value = '';
    return;
  }

  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    alert('Ugyldig filtype. Tilladte formater: PNG, JPG, SVG.');
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const logoUrl = e.target.result;

    // Update upload area with preview
    const uploadZone = document.querySelector('.logo-upload-zone');
    if (uploadZone) {
      uploadZone.innerHTML = `
        <img src="${logoUrl}"
             style="max-width:120px;max-height:120px;border-radius:var(--radius-lg);margin-bottom:12px;">
        <p style="font-size:14px;font-weight:500;color:var(--text);margin-bottom:4px">Klik for at ændre</p>
        <p style="font-size:12px;color:var(--muted)">${file.name}</p>
      `;
      uploadZone.classList.add('has-file');
      uploadZone.onclick = () => input.click();
    }

    // Send to iframe
    const previewFrame = document.getElementById('pwa-preview-frame');
    if (previewFrame) {
      previewFrame.contentWindow.postMessage({
        type: 'UPDATE_CONFIG',
        config: {
          logoUrl: logoUrl
        }
      }, '*');
    }

    // Show saved badge
    showSavedBadge('branding');
  };
  reader.readAsDataURL(file);
}

// Handle App Builder banner upload
function handleAppBuilderBannerUpload(input) {
  const file = input.files[0];
  if (!file) return;

  // Validate file size (3MB max for banner)
  const maxSize = 3 * 1024 * 1024; // 3MB
  if (file.size > maxSize) {
    alert('Filen er for stor. Maksimal størrelse er 3MB.');
    input.value = '';
    return;
  }

  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg'];
  if (!allowedTypes.includes(file.type)) {
    alert('Ugyldig filtype. Tilladte formater: PNG, JPG.');
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const bannerUrl = e.target.result;

    // Update upload zone with preview
    const uploadZone = document.getElementById('banner-upload-zone');
    if (uploadZone) {
      uploadZone.innerHTML = `
        <img src="${bannerUrl}"
             style="width:100%;height:auto;max-height:160px;object-fit:cover;border-radius:var(--radius-md);box-shadow:0 4px 12px rgba(0,0,0,0.1);">
      `;
      uploadZone.classList.add('has-file');
    }

    // Show remove button
    const removeBtn = document.getElementById('remove-banner-btn');
    if (removeBtn) {
      removeBtn.style.display = 'block';
    }

    // Send to iframe
    const previewFrame = document.getElementById('pwa-preview-frame');
    if (previewFrame) {
      previewFrame.contentWindow.postMessage({
        type: 'UPDATE_CONFIG',
        config: {
          bannerUrl: bannerUrl
        }
      }, '*');
    }

    // Show saved badge
    showSavedBadge('banner');
  };
  reader.readAsDataURL(file);
}

// Remove App Builder banner
function removeAppBuilderBanner() {
  // Reset upload zone to default state
  const uploadZone = document.getElementById('banner-upload-zone');
  if (uploadZone) {
    uploadZone.innerHTML = `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:16px;color:var(--muted)">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <p style="font-size:14px;font-weight:500;color:var(--text);margin-bottom:4px">
        Klik for at uploade banner billede
      </p>
      <p style="font-size:12px;color:var(--muted)">
        PNG eller JPG. Anbefalet: 1200x400px. Max 3MB
      </p>
    `;
    uploadZone.classList.remove('has-file');
    uploadZone.onclick = () => document.getElementById('appbuilder-banner-input').click();
  }

  // Hide remove button
  const removeBtn = document.getElementById('remove-banner-btn');
  if (removeBtn) {
    removeBtn.style.display = 'none';
  }

  // Clear file input
  const fileInput = document.getElementById('appbuilder-banner-input');
  if (fileInput) {
    fileInput.value = '';
  }

  // Send removal to iframe
  const previewFrame = document.getElementById('pwa-preview-frame');
  if (previewFrame) {
    previewFrame.contentWindow.postMessage({
      type: 'UPDATE_CONFIG',
      config: {
        bannerUrl: null  // Remove banner, revert to gradient
      }
    }, '*');
  }
}

// Update App Builder preview name
function updateAppBuilderPreviewName() {
  const nameInput = document.getElementById('appbuilder-app-name');
  const previewFrame = document.getElementById('pwa-preview-frame');

  if (nameInput && previewFrame) {
    const value = nameInput.value.trim() || 'Din Restaurant';

    // Send message to iframe
    previewFrame.contentWindow.postMessage({
      type: 'UPDATE_CONFIG',
      config: {
        appName: value
      }
    }, '*');
  }
}

// Update App Builder preview tagline
function updateAppBuilderPreviewTagline() {
  const taglineInput = document.getElementById('appbuilder-tagline');
  const previewFrame = document.getElementById('pwa-preview-frame');

  if (taglineInput && previewFrame) {
    const value = taglineInput.value.trim() || 'Ægte italiensk pizza siden 1985';

    // Send message to iframe
    previewFrame.contentWindow.postMessage({
      type: 'UPDATE_CONFIG',
      config: {
        tagline: value
      }
    }, '*');
  }
}

// Show saved badge with auto-hide
let badgeTimeouts = {};

function showSavedBadge(section) {
  const badgeId = `${section}-status-badge`;
  const badge = document.getElementById(badgeId);

  if (!badge) return;

  // Clear existing timeout for this badge
  if (badgeTimeouts[badgeId]) {
    clearTimeout(badgeTimeouts[badgeId]);
  }

  // Show badge with animation
  badge.style.display = 'inline-flex';

  // Auto-hide after 2 seconds
  badgeTimeouts[badgeId] = setTimeout(() => {
    badge.style.display = 'none';
  }, 2000);
}

function getAppBuilderPreviewConfig() {
  const nameInput = document.getElementById('appbuilder-app-name');
  const taglineInput = document.getElementById('appbuilder-tagline');
  const primaryColorInput = document.getElementById('appbuilder-primary-color');
  const secondaryColorInput = document.getElementById('appbuilder-secondary-color');

  return {
    appName: nameInput?.value || 'Din Restaurant',
    tagline: taglineInput?.value || 'Autentisk smag siden 1985',
    primaryColor: primaryColorInput?.value || '#D4380D',
    secondaryColor: secondaryColorInput?.value || '#FFF7E6'
  };
}

function getAppPreviewBasePath() {
  const origin = window.location.origin;
  const pathBase = window.location.pathname.replace(/[^/]*$/, '');

  if (origin && origin !== 'null') {
    return origin + pathBase;
  }

  const href = window.location.href.split('#')[0].split('?')[0];
  return href.replace(/[^/]*$/, '');
}

function getAppPreviewUrl() {
  if (window.APP_PREVIEW_URL) return window.APP_PREVIEW_URL;
  const origin = window.location.origin;
  if (origin && origin !== 'null') {
    return origin + '/demos/pwa-preview.html';
  }
  return 'https://flow-lime-rho.vercel.app/demos/pwa-preview.html';
}

function ensureQRCodeLibrary() {
  if (typeof QRCode !== 'undefined') {
    return Promise.resolve(true);
  }

  const loadScript = (src) => new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.qrcodeLib = 'true';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return new Promise((resolve) => {
    const existing = document.querySelector('script[data-qrcode-lib="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    loadScript('js/vendor/qrcode.min.js').then((loaded) => {
      if (loaded) {
        resolve(true);
        return;
      }

      loadScript('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js')
        .then(resolve);
    });
  });
}

// Send initial config to App Builder preview - called directly from iframe onload
function sendInitialAppBuilderConfig() {
  const previewFrame = document.getElementById('pwa-preview-frame');
  if (!previewFrame || !previewFrame.contentWindow) {
    console.warn('PWA preview frame not available');
    return;
  }

  // Wait for iframe to be fully loaded
  setTimeout(() => {
    try {
      const config = getAppBuilderPreviewConfig();

      previewFrame.contentWindow.postMessage({
        type: 'UPDATE_CONFIG',
        config: config
      }, '*');

      // Also send scroll reset command
      previewFrame.contentWindow.postMessage({
        type: 'RESET_SCROLL'
      }, '*');

    } catch (err) {
      console.warn('Error sending PWA config:', err);
    }
  }, 100);
}

// Initialize App Builder event listeners
function initAppBuilder() {
  const previewFrame = document.getElementById('pwa-preview-frame');

  if (previewFrame) {
    // Handle iframe load event
    previewFrame.addEventListener('load', () => {
      // Small delay to ensure iframe content is ready
      setTimeout(() => {
        sendInitialAppBuilderConfig();
      }, 150);
    });

    // Handle messages from iframe
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'PWA_READY') {
        sendInitialAppBuilderConfig();
      }
    });
  }
}

// Show QR code for mobile app preview (branded FLOW QR)
function showAppPreviewQR() {
  syncAppBuilderConfig();

  const container = document.getElementById('app-preview-qr-container');
  if (!container) return;

  const previewUrl = getAppPreviewUrl();
  container.innerHTML = '';
  container.style.background = '#000';
  container.style.borderRadius = '12px';
  container.style.padding = '16px';

  generateBrandedQR(previewUrl, container, { width: 200, height: 200 });
  saveQRToHistory('preview', previewUrl);

  showModal('app-preview-qr');
}

function openAppPreviewTemplate() {
  // Sync config to all previews first
  const config = syncAppBuilderConfig();

  const previewUrl = getAppPreviewUrl();
  const templateWindow = window.open(previewUrl, '_blank', 'noopener');

  if (!templateWindow) {
    toast('Popup blev blokeret. Tillad popups for at åbne skabelonen.', 'warning');
    return;
  }

  const sendConfig = () => {
    if (templateWindow.closed) return;
    templateWindow.postMessage({ type: 'UPDATE_CONFIG', config: config }, '*');
    templateWindow.postMessage({ type: 'RESET_SCROLL' }, '*');
  };

  templateWindow.addEventListener('load', sendConfig);
  setTimeout(sendConfig, 400);
}

// Sync App Builder config to all preview frames
function syncAppBuilderConfig() {
  const config = getAppBuilderPreviewConfig();

  // Send to main preview frame (in App Builder page)
  const mainFrame = document.getElementById('pwa-preview-frame');
  if (mainFrame?.contentWindow) {
    mainFrame.contentWindow.postMessage({ type: 'UPDATE_CONFIG', config }, '*');
    mainFrame.contentWindow.postMessage({ type: 'RESET_SCROLL' }, '*');
  }

  // Send to full preview frame (in Mobil App page)
  const fullFrame = document.getElementById('pwa-fullpreview-frame');
  if (fullFrame?.contentWindow) {
    fullFrame.contentWindow.postMessage({ type: 'UPDATE_CONFIG', config }, '*');
    fullFrame.contentWindow.postMessage({ type: 'RESET_SCROLL' }, '*');
  }

  return config;
}

// Publish mobile app
function publishMobileApp() {
  // Sync config to all previews first
  const config = syncAppBuilderConfig();

  // Add publish metadata
  config.publishedAt = new Date().toISOString();
  config.status = 'published';

  // Save to localStorage + Supabase
  localStorage.setItem('published_mobile_app', JSON.stringify(config));
  _saveBuilderConfigToSupabase('app_builder', config);

  toast('App publiceret!', 'success');
}

// ==================== NEW APP BUILDER FUNCTIONS ====================

// App Builder Config Storage Key
const APP_BUILDER_CONFIG_KEY = 'orderflow_app_builder_config';
const APP_BUILDER_HISTORY_KEY = 'orderflow_app_builder_history';
const WEB_BUILDER_HISTORY_KEY = 'orderflow_webbuilder_history';
const CMS_HISTORY_KEY = 'orderflow_cms_history';
const MAX_HISTORY_VERSIONS = 20;

// ==================== VERSION HISTORY SYSTEM ====================

// Save a version to history
function saveConfigVersion(historyKey, config, label = null) {
  const history = JSON.parse(localStorage.getItem(historyKey) || '[]');

  const version = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    label: label || new Date().toLocaleString('da-DK'),
    config: JSON.parse(JSON.stringify(config)) // Deep clone
  };

  history.unshift(version);

  // Keep only last N versions
  if (history.length > MAX_HISTORY_VERSIONS) {
    history.splice(MAX_HISTORY_VERSIONS);
  }

  localStorage.setItem(historyKey, JSON.stringify(history));
  console.log(`📚 Version saved to ${historyKey}`);
  return version.id;
}

// Get version history
function getConfigHistory(historyKey) {
  return JSON.parse(localStorage.getItem(historyKey) || '[]');
}

// Restore a specific version
function restoreConfigVersion(historyKey, configKey, versionId, syncFn) {
  const history = getConfigHistory(historyKey);
  const version = history.find(v => v.id === versionId);

  if (version) {
    localStorage.setItem(configKey, JSON.stringify(version.config));
    if (syncFn) syncFn(version.config);
    toast('Version gendannet!', 'success');
    return version.config;
  }

  toast('Kunne ikke finde version', 'error');
  return null;
}

// Undo to previous version
function undoConfigChange(historyKey, configKey, syncFn) {
  const history = getConfigHistory(historyKey);

  if (history.length < 2) {
    toast('Ingen tidligere versioner at fortryde til', 'warning');
    return null;
  }

  // Get the version before the current one (index 1 since 0 is current)
  const previousVersion = history[1];

  if (previousVersion) {
    localStorage.setItem(configKey, JSON.stringify(previousVersion.config));
    if (syncFn) syncFn(previousVersion.config);
    toast('Ændring fortrudt', 'success');
    return previousVersion.config;
  }

  return null;
}

// App Builder specific functions
function saveAppBuilderVersion(label = null) {
  const config = loadAppBuilderConfig();
  return saveConfigVersion(APP_BUILDER_HISTORY_KEY, config, label);
}

function undoAppBuilderChange() {
  const config = undoConfigChange(APP_BUILDER_HISTORY_KEY, APP_BUILDER_CONFIG_KEY, (cfg) => {
    syncAllAppPreviews(cfg);
    appBuilderChannel.postMessage({ type: 'appbuilder_update', config: cfg });
  });

  if (config) {
    // Re-render current App Builder page
    const activeAppBuilderPage = document.querySelector('[id^="page-appbuilder-"].active');
    if (activeAppBuilderPage) {
      const pageId = activeAppBuilderPage.id.replace('page-appbuilder-', '');
      showAppBuilderPage(pageId);
    }
  }
}

function getAppBuilderHistory() {
  return getConfigHistory(APP_BUILDER_HISTORY_KEY);
}

// Web Builder specific functions
function saveWebBuilderVersion(label = null) {
  const config = collectWebBuilderFormData();
  return saveConfigVersion(WEB_BUILDER_HISTORY_KEY, config, label);
}

function undoWebBuilderChange() {
  const config = undoConfigChange(WEB_BUILDER_HISTORY_KEY, 'orderflow_webbuilder_config', (cfg) => {
    sendConfigToWebBuilderPreview(cfg);
    webBuilderChannel.postMessage({ type: 'webbuilder_update', config: cfg });
  });

  if (config) {
    // Re-render current Web Builder page
    const activeWebBuilderPage = document.querySelector('[id^="page-webbuilder-"].active');
    if (activeWebBuilderPage) {
      const pageId = activeWebBuilderPage.id.replace('page-webbuilder-', '');
      showWebBuilderPage(pageId);
    }
  }
}

function getWebBuilderHistory() {
  return getConfigHistory(WEB_BUILDER_HISTORY_KEY);
}

// CMS specific functions
function saveCMSVersion(label = null) {
  return saveConfigVersion(CMS_HISTORY_KEY, cmsPages, label);
}

function undoCMSChange() {
  const pages = undoConfigChange(CMS_HISTORY_KEY, 'orderflow_cms_pages', (pages) => {
    cmsPages = pages;
    renderCMSPagesList();
    cmsChannel.postMessage({ type: 'cms_update', pages: pages });
  });
}

function getCMSHistory() {
  return getConfigHistory(CMS_HISTORY_KEY);
}

// Load App Builder Config — Supabase FIRST, localStorage as fallback/cache
function loadAppBuilderConfig() {
  const saved = localStorage.getItem(APP_BUILDER_CONFIG_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  return getDefaultAppBuilderConfig();
}

function getDefaultAppBuilderConfig() {
  return {
    farver: { primary: '#D4380D', secondary: '#FFF7E6', background: '#FFFFFF', text: '#1F2937' },
    billeder: { name: '', tagline: '', logo: null, banner: null },
    timer: {
      mon: { open: '10:00', close: '22:00', closed: false },
      tue: { open: '10:00', close: '22:00', closed: false },
      wed: { open: '10:00', close: '22:00', closed: false },
      thu: { open: '10:00', close: '22:00', closed: false },
      fri: { open: '10:00', close: '23:00', closed: false },
      sat: { open: '11:00', close: '23:00', closed: false },
      sun: { open: '12:00', close: '21:00', closed: false }
    },
    kontakt: { address: '', zip: '', city: '', phone: '', email: '', website: '' },
    social: { facebook: '', instagram: '', tripadvisor: '' },
    levering: { zipcodes: '', distance: 5, minOrder: 100, fee: 39, freeAbove: 300, timeMin: 30, timeMax: 45 },
    funktioner: { onlineOrder: true, push: true, loyalty: false, reservation: false, takeaway: true }
  };
}

// Async loader: tries Supabase first, falls back to localStorage, caches result
async function loadAppBuilderConfigAsync() {
  try {
    const client = window.supabaseClient || window.supabase;
    if (client) {
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        const { data, error } = await client
          .from('builder_configs')
          .select('config_json')
          .eq('user_id', user.id)
          .eq('builder_type', 'app_builder')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data && data.config_json) {
          // Cache to localStorage
          localStorage.setItem(APP_BUILDER_CONFIG_KEY, JSON.stringify(data.config_json));
          console.log('✅ App Builder config loaded from Supabase');
          return data.config_json;
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ Supabase load failed, using localStorage:', err.message);
  }

  // Fallback to localStorage
  return loadAppBuilderConfig();
}

// Save App Builder Config — Supabase FIRST, localStorage as cache
function saveAppBuilderConfig(config) {
  // Always save to localStorage immediately (instant UX)
  localStorage.setItem(APP_BUILDER_CONFIG_KEY, JSON.stringify(config));
  syncAllAppPreviews(config);

  // Broadcast to other tabs for cross-tab sync
  appBuilderChannel.postMessage({ type: 'appbuilder_update', config: config });

  // Save to Supabase FIRST (primary storage)
  _saveBuilderConfigToSupabase('app_builder', config);
}

// Shared async Supabase save for both builders
async function _saveBuilderConfigToSupabase(builderType, config) {
  try {
    const client = window.supabaseClient || window.supabase;
    if (!client) return;

    const { data: { user } } = await client.auth.getUser();
    if (!user) return;

    const { error } = await client
      .from('builder_configs')
      .upsert({
        user_id: user.id,
        builder_type: builderType,
        config_json: config,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,builder_type'
      });

    if (error) {
      console.warn('⚠️ Supabase builder save failed:', error.message);
      // Also try via SupabaseDB helper if available
      if (window.SupabaseDB) {
        await window.SupabaseDB.saveBuilderConfig(builderType, config);
      }
    } else {
      console.log('✅ ' + builderType + ' config synced to Supabase');
    }
  } catch (err) {
    console.warn('⚠️ Supabase sync failed:', err.message);
    // localStorage already has the data — no data loss
  }
}

// Load Web Builder config from Supabase (async)
async function loadWebBuilderConfigAsync() {
  try {
    const client = window.supabaseClient || window.supabase;
    if (client) {
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        const { data, error } = await client
          .from('builder_configs')
          .select('config_json')
          .eq('user_id', user.id)
          .eq('builder_type', 'web_builder')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data && data.config_json) {
          localStorage.setItem('orderflow_webbuilder_config', JSON.stringify(data.config_json));
          console.log('✅ Web Builder config loaded from Supabase');
          return data.config_json;
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ Web Builder Supabase load failed:', err.message);
  }
  const saved = localStorage.getItem('orderflow_webbuilder_config');
  return saved ? JSON.parse(saved) : null;
}

// Auto-save App Builder changes with debounce
let appBuilderAutoSaveTimer = null;
appBuilderHasChanges = false;
let appBuilderIsSaving = false;
let appBuilderSaveCount = 0;

function autoSaveAppBuilder() {
  // Prevent re-entry during save
  if (appBuilderIsSaving) return;

  if (appBuilderAutoSaveTimer) clearTimeout(appBuilderAutoSaveTimer);
  appBuilderHasChanges = true;
  updateAppBuilderSaveStatus('saving');

  appBuilderAutoSaveTimer = setTimeout(() => {
    appBuilderIsSaving = true;
    const config = loadAppBuilderConfig(); // Get from localStorage (already saved by update functions)

    // Save version every 5th save
    appBuilderSaveCount++;
    if (appBuilderSaveCount >= 5) {
      saveAppBuilderVersion();
      appBuilderSaveCount = 0;
    }

    // Broadcast to other tabs
    appBuilderChannel.postMessage({ type: 'appbuilder_update', config: config });

    // Sync to Supabase in background (primary storage)
    _saveBuilderConfigToSupabase('app_builder', config);

    appBuilderHasChanges = false;
    appBuilderIsSaving = false;
    updateAppBuilderSaveStatus('saved');
    console.log('📱 App Builder: Auto-saved changes');
  }, 2000);
}

function updateAppBuilderSaveStatus(status) {
  const statusEls = document.querySelectorAll('[id^="app-save-status"]');
  statusEls.forEach(el => {
    if (status === 'saving') {
      el.textContent = '⏳ Gemmer...';
      el.style.display = 'inline';
      el.style.color = 'var(--warning, #f59e0b)';
    } else if (status === 'saved') {
      el.textContent = '✓ Ændringer gemt';
      el.style.display = 'inline';
      el.style.color = 'var(--success, #22c55e)';
      setTimeout(() => { el.style.display = 'none'; }, 3000);
    }
  });
}

// Collect form data from current App Builder page
function collectAppBuilderFormData() {
  const config = loadAppBuilderConfig();

  // Farver
  const primaryColor = document.getElementById('app-color-primary');
  const secondaryColor = document.getElementById('app-color-secondary');
  const bgColor = document.getElementById('app-color-bg');
  const textColor = document.getElementById('app-color-text');
  if (primaryColor) config.farver.primary = primaryColor.value;
  if (secondaryColor) config.farver.secondary = secondaryColor.value;
  if (bgColor) config.farver.background = bgColor.value;
  if (textColor) config.farver.text = textColor.value;

  // Timer (åbningstider)
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  days.forEach(day => {
    const openEl = document.getElementById(`app-hours-${day}-open`);
    const closeEl = document.getElementById(`app-hours-${day}-close`);
    const closedEl = document.getElementById(`app-hours-${day}-closed`);
    if (openEl) config.timer[day].open = openEl.value;
    if (closeEl) config.timer[day].close = closeEl.value;
    if (closedEl) config.timer[day].closed = closedEl.checked;
  });

  // Kontakt
  const kontaktFields = ['address', 'zip', 'city', 'phone', 'email', 'website'];
  kontaktFields.forEach(field => {
    const el = document.getElementById(`app-kontakt-${field}`);
    if (el) config.kontakt[field] = el.value;
  });

  // Levering
  const leveringFields = {
    zipcodes: 'app-levering-zipcodes',
    distance: 'app-levering-distance',
    minOrder: 'app-levering-min',
    fee: 'app-levering-fee',
    freeAbove: 'app-levering-free',
    timeMin: 'app-levering-time-min',
    timeMax: 'app-levering-time-max'
  };
  Object.entries(leveringFields).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (el) config.levering[key] = el.type === 'number' ? parseFloat(el.value) : el.value;
  });

  return config;
}

// Sync all app previews with current config
function syncAllAppPreviews(config) {
  const iframeIds = ['pwa-preview-frame', 'pwa-preview-farver', 'pwa-preview-billeder',
                     'pwa-preview-timer', 'pwa-preview-kontakt', 'pwa-preview-levering',
                     'pwa-fullpreview-frame'];
  iframeIds.forEach(id => {
    const iframe = document.getElementById(id);
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'UPDATE_CONFIG', config: config }, '*');
    }
  });
}

// Update App Color (Farver page)
function updateAppColor(type, color) {
  const config = loadAppBuilderConfig();
  config.farver[type] = color;

  // Save to localStorage and sync preview immediately
  localStorage.setItem(APP_BUILDER_CONFIG_KEY, JSON.stringify(config));
  syncAllAppPreviews(config);

  // Update preview swatch and value display
  const preview = document.getElementById(`app-${type}-preview`);
  if (preview) preview.style.background = color;

  const valueEl = document.getElementById(`app-${type}-value`);
  if (valueEl) valueEl.textContent = color.toUpperCase();

  // Mark unsaved changes (no auto-save — user must click Gem)
  appBuilderHasChanges = true;
  updateAppBuilderSaveStatus('unsaved');
}

// Save App Builder Colors
function saveAppBuilderColors() {
  const config = loadAppBuilderConfig();
  saveAppBuilderConfig(config);
  toast('Farver gemt!', 'success');

  // Show status indicator
  const status = document.getElementById('farver-save-status');
  if (status) {
    status.style.display = 'inline';
    setTimeout(() => { status.style.display = 'none'; }, 3000);
  }
}

// Update App Info (Billeder page - name/tagline)
function updateAppInfo(field, value) {
  const config = loadAppBuilderConfig();
  config.billeder[field] = value;
  // Save to localStorage and sync preview immediately
  localStorage.setItem(APP_BUILDER_CONFIG_KEY, JSON.stringify(config));
  syncAllAppPreviews(config);
  // Mark unsaved changes (no auto-save — user must click Gem)
  appBuilderHasChanges = true;
  updateAppBuilderSaveStatus('unsaved');
}

// Handle App Logo Upload
function handleAppLogoUpload(input) {
  const file = input.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    alert('Filen er for stor. Maksimal størrelse er 2MB.');
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const config = loadAppBuilderConfig();
    config.billeder.logo = e.target.result;
    saveAppBuilderConfig(config);

    // Update preview
    const preview = document.getElementById('app-logo-preview');
    const img = document.getElementById('app-logo-img');
    const icon = document.getElementById('app-logo-icon');
    const removeBtn = document.getElementById('app-remove-logo-btn');

    if (img) img.src = e.target.result;
    if (preview) preview.style.display = 'block';
    if (icon) icon.style.display = 'none';
    if (removeBtn) removeBtn.style.display = 'block';

    showSavedBadge('billeder-logo');
  };
  reader.readAsDataURL(file);
}

// Remove App Logo
function removeAppLogo() {
  const config = loadAppBuilderConfig();
  config.billeder.logo = null;
  saveAppBuilderConfig(config);

  const preview = document.getElementById('app-logo-preview');
  const icon = document.getElementById('app-logo-icon');
  const removeBtn = document.getElementById('app-remove-logo-btn');

  if (preview) preview.style.display = 'none';
  if (icon) icon.style.display = 'block';
  if (removeBtn) removeBtn.style.display = 'none';
}

// Handle App Banner Upload
function handleAppBannerUpload(input) {
  const file = input.files[0];
  if (!file) return;

  if (file.size > 3 * 1024 * 1024) {
    alert('Filen er for stor. Maksimal størrelse er 3MB.');
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const config = loadAppBuilderConfig();
    config.billeder.banner = e.target.result;
    saveAppBuilderConfig(config);

    // Update preview
    const preview = document.getElementById('app-banner-preview');
    const img = document.getElementById('app-banner-img');
    const icon = document.getElementById('app-banner-icon');
    const text = document.getElementById('app-banner-text');
    const hint = document.getElementById('app-banner-hint');
    const removeBtn = document.getElementById('app-remove-banner-btn');

    if (img) img.src = e.target.result;
    if (preview) preview.style.display = 'block';
    if (icon) icon.style.display = 'none';
    if (text) text.style.display = 'none';
    if (hint) hint.style.display = 'none';
    if (removeBtn) removeBtn.style.display = 'block';

    showSavedBadge('billeder-banner');
  };
  reader.readAsDataURL(file);
}

// Remove App Banner
function removeAppBanner() {
  const config = loadAppBuilderConfig();
  config.billeder.banner = null;
  saveAppBuilderConfig(config);

  const preview = document.getElementById('app-banner-preview');
  const icon = document.getElementById('app-banner-icon');
  const text = document.getElementById('app-banner-text');
  const hint = document.getElementById('app-banner-hint');
  const removeBtn = document.getElementById('app-remove-banner-btn');

  if (preview) preview.style.display = 'none';
  if (icon) icon.style.display = 'block';
  if (text) text.style.display = 'block';
  if (hint) hint.style.display = 'block';
  if (removeBtn) removeBtn.style.display = 'none';
}

// Save App Builder Images
function saveAppBuilderImages() {
  const config = loadAppBuilderConfig();
  saveAppBuilderConfig(config);
  toast('Billeder gemt!', 'success');

  // Show status indicator
  const status = document.getElementById('billeder-save-status');
  if (status) {
    status.style.display = 'inline';
    setTimeout(() => { status.style.display = 'none'; }, 3000);
  }
}

// Handle Branding Logo Upload
function handleBrandingLogoUpload(input) {
  const file = input.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    alert('Filen er for stor. Maksimal størrelse er 2MB.');
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const config = loadAppBuilderConfig();
    config.billeder.logo = e.target.result;
    saveAppBuilderConfig(config);

    // Update branding preview
    const preview = document.getElementById('branding-logo-preview');
    const img = document.getElementById('branding-logo-img');
    const icon = document.getElementById('branding-logo-icon');
    const removeBtn = document.getElementById('branding-remove-logo-btn');

    if (img) img.src = e.target.result;
    if (preview) preview.style.display = 'block';
    if (icon) icon.style.display = 'none';
    if (removeBtn) removeBtn.style.display = 'block';

    // Also update the billeder page if visible
    const appPreview = document.getElementById('app-logo-preview');
    const appImg = document.getElementById('app-logo-img');
    const appIcon = document.getElementById('app-logo-icon');
    const appRemoveBtn = document.getElementById('app-remove-logo-btn');

    if (appImg) appImg.src = e.target.result;
    if (appPreview) appPreview.style.display = 'block';
    if (appIcon) appIcon.style.display = 'none';
    if (appRemoveBtn) appRemoveBtn.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

// Remove Branding Logo
function removeBrandingLogo() {
  const config = loadAppBuilderConfig();
  config.billeder.logo = null;
  saveAppBuilderConfig(config);

  // Update branding page
  const preview = document.getElementById('branding-logo-preview');
  const icon = document.getElementById('branding-logo-icon');
  const removeBtn = document.getElementById('branding-remove-logo-btn');

  if (preview) preview.style.display = 'none';
  if (icon) icon.style.display = 'block';
  if (removeBtn) removeBtn.style.display = 'none';

  // Also update billeder page
  const appPreview = document.getElementById('app-logo-preview');
  const appIcon = document.getElementById('app-logo-icon');
  const appRemoveBtn = document.getElementById('app-remove-logo-btn');

  if (appPreview) appPreview.style.display = 'none';
  if (appIcon) appIcon.style.display = 'block';
  if (appRemoveBtn) appRemoveBtn.style.display = 'none';
}

// Save App Branding
function saveAppBranding() {
  // Collect branding data from form
  const brandingData = {
    restaurantName: document.getElementById('branding-restaurant-name')?.value || '',
    tagline: document.getElementById('branding-tagline')?.value || '',
    primaryColor: document.getElementById('branding-primary-color')?.value || '#6366F1',
    accentColor: document.getElementById('branding-accent-color')?.value || '#10B981'
  };

  // Save to localStorage
  localStorage.setItem('orderflow_app_branding', JSON.stringify(brandingData));

  // Sync to Supabase via builder config
  _saveBuilderConfigToSupabase('app_builder', brandingData);

  const status = document.getElementById('branding-save-status');
  if (status) {
    status.style.display = 'inline';
    setTimeout(() => status.style.display = 'none', 3000);
  }
  toast('Branding gemt!', 'success');
}

// Initialize Branding Page
function initBrandingPage() {
  const config = loadAppBuilderConfig();

  // Set restaurant name and tagline
  const nameInput = document.getElementById('branding-restaurant-name');
  const taglineInput = document.getElementById('branding-restaurant-tagline');

  if (nameInput && config.billeder.name) nameInput.value = config.billeder.name;
  if (taglineInput && config.billeder.tagline) taglineInput.value = config.billeder.tagline;

  // Set logo preview if exists
  if (config.billeder.logo) {
    const preview = document.getElementById('branding-logo-preview');
    const img = document.getElementById('branding-logo-img');
    const icon = document.getElementById('branding-logo-icon');
    const removeBtn = document.getElementById('branding-remove-logo-btn');

    if (img) img.src = config.billeder.logo;
    if (preview) preview.style.display = 'block';
    if (icon) icon.style.display = 'none';
    if (removeBtn) removeBtn.style.display = 'block';
  }
}

// Update App Hours (Timer page)
function updateAppHours(day) {
  const config = loadAppBuilderConfig();
  const open = document.getElementById(`app-hours-${day}-open`)?.value || '10:00';
  const close = document.getElementById(`app-hours-${day}-close`)?.value || '22:00';
  const closed = document.getElementById(`app-hours-${day}-closed`)?.checked || false;

  config.timer[day] = { open, close, closed };
  // Save to localStorage and sync preview immediately
  localStorage.setItem(APP_BUILDER_CONFIG_KEY, JSON.stringify(config));
  syncAllAppPreviews(config);
  // Mark unsaved changes (no auto-save — user must click Gem)
  appBuilderHasChanges = true;
  updateAppBuilderSaveStatus('unsaved');
}

// Toggle Day Closed
// toggleDayClosed — unified version handling both App Builder and Web Builder
function toggleDayClosed(day) {
  // App Builder hours
  const appClosed = document.getElementById(`app-hours-${day}-closed`);
  const appOpen = document.getElementById(`app-hours-${day}-open`);
  const appClose = document.getElementById(`app-hours-${day}-close`);
  if (appClosed && appOpen && appClose) {
    const isClosed = appClosed.checked;
    appOpen.disabled = isClosed;
    appClose.disabled = isClosed;
  }

  // Web Builder hours
  const wbClosed = document.getElementById('wb-hours-' + day + '-closed');
  const wbOpen = document.getElementById('wb-hours-' + day + '-open');
  const wbClose = document.getElementById('wb-hours-' + day + '-close');
  if (wbClosed && wbOpen && wbClose) {
    const isClosed = wbClosed.checked;
    wbOpen.disabled = isClosed;
    wbClose.disabled = isClosed;
  }

  if (typeof updateWebBuilderPreview === 'function') updateWebBuilderPreview();
}

// Save App Builder Hours
function saveAppBuilderHours() {
  toast('Åbningstider gemt!', 'success');
}

// Update App Contact (Kontakt page)
function updateAppContact(field, value) {
  const config = loadAppBuilderConfig();
  config.kontakt[field] = value;
  // Save to localStorage and sync preview immediately
  localStorage.setItem(APP_BUILDER_CONFIG_KEY, JSON.stringify(config));
  syncAllAppPreviews(config);
  // Mark unsaved changes (no auto-save — user must click Gem)
  appBuilderHasChanges = true;
  updateAppBuilderSaveStatus('unsaved');
}

// Update App Social (Kontakt page)
function updateAppSocial(platform, value) {
  const config = loadAppBuilderConfig();
  config.social[platform] = value;
  // Save to localStorage and sync preview immediately
  localStorage.setItem(APP_BUILDER_CONFIG_KEY, JSON.stringify(config));
  syncAllAppPreviews(config);
  // Mark unsaved changes (no auto-save — user must click Gem)
  appBuilderHasChanges = true;
  updateAppBuilderSaveStatus('unsaved');
}

// Save App Builder Contact
function saveAppBuilderContact() {
  const config = loadAppBuilderConfig();
  saveAppBuilderConfig(config);
  toast('Kontaktoplysninger gemt!', 'success');
}

// Update App Delivery (Levering page)
function updateAppDelivery(field, value) {
  const config = loadAppBuilderConfig();
  config.levering[field] = value;
  // Save to localStorage and sync preview immediately
  localStorage.setItem(APP_BUILDER_CONFIG_KEY, JSON.stringify(config));
  syncAllAppPreviews(config);
  // Mark unsaved changes (no auto-save — user must click Gem)
  appBuilderHasChanges = true;
  updateAppBuilderSaveStatus('unsaved');
}

// Save App Builder Delivery
function saveAppBuilderDelivery() {
  const config = loadAppBuilderConfig();
  saveAppBuilderConfig(config);
  toast('Leveringsindstillinger gemt!', 'success');
}

// =====================================================
// ACCOUNT PAGE FUNCTIONS
// =====================================================

// Navigate to account page
function showAccountPage(page) {
  // Close profile dropdown
  const dropdown = document.getElementById('profile-dropdown');
  if (dropdown) dropdown.classList.remove('active');

  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // Show requested page
  const targetPage = document.getElementById('page-' + page);
  if (targetPage) {
    targetPage.classList.add('active');

    // Load data based on page
    switch(page) {
      case 'mine-oplysninger':
        loadAccountInfo();
        break;
      case 'betalingsmetoder':
        loadPaymentMethods();
        break;
      case 'leveringsadresser':
        loadDeliveryAddresses();
        break;
      case 'ordrehistorik':
        loadOrderHistory();
        break;
    }
  }
}

// ========== Profile Pages Navigation ==========

function showProfilePage(page) {
  // Close any open dropdowns
  const dropdown = document.getElementById('profile-dropdown');
  if (dropdown) dropdown.classList.remove('active');

  // Hide all pages
  document.querySelectorAll('.page, .workflow-page').forEach(p => p.classList.remove('active'));

  // Clear all active states
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.nav-dropdown-item').forEach(i => i.classList.remove('active'));

  // Show requested profile page
  const targetPage = document.getElementById('page-' + page);
  if (targetPage) {
    targetPage.classList.add('active');

    // Set active state on sidebar item
    const items = document.querySelectorAll('.nav-dropdown-item');
    items.forEach(item => {
      if (item.getAttribute('onclick') === `showProfilePage('${page}')`) {
        item.classList.add('active');
      }
    });

    // Scroll to top
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.scrollTop = 0;

    // Load data based on page
    switch(page) {
      case 'admin-profil':
        loadAdminProfileOverview();
        break;
      case 'admin-oplysninger':
        loadAdminOplysninger();
        break;
      case 'admin-team':
        loadAdminTeam();
        break;
      case 'admin-virksomhed':
        loadAdminVirksomhed();
        break;
      case 'admin-sikkerhed':
        loadAdminSikkerhed();
        break;
      case 'admin-aktivitet':
        loadAdminAktivitet();
        break;
      case 'admin-abonnement':
        loadAdminAbonnement();
        break;
      case 'kunde-profil':
        loadKundeProfileOverview();
        break;
      case 'kunde-oplysninger':
        loadKundeOplysninger();
        break;
      case 'kunde-ordrer':
        loadKundeOrdrer();
        break;
      case 'kunde-betaling':
        loadKundeBetaling();
        break;
      case 'kunde-adresser':
        loadKundeAdresser();
        break;
      case 'kunde-loyalitet':
        loadKundeLoyalitet();
        break;
      case 'kunde-praeferencer':
        loadKundePraeferencer();
        break;
    }
  }
}

// ========== Admin Profile Functions ==========

function loadAdminProfileOverview() {
  const profile = JSON.parse(localStorage.getItem('orderflow_admin_profile') || '{}');
  const name = (profile.firstName || 'Admin') + ' ' + (profile.lastName || '');
  const el = document.getElementById('admin-profile-name');
  if (el) el.textContent = name.trim();

  const emailEl = document.getElementById('admin-profile-email');
  if (emailEl) emailEl.textContent = profile.email || currentUser?.email || 'admin@flow.dk';

  const titleEl = document.getElementById('admin-profile-title');
  if (titleEl) titleEl.textContent = profile.title || 'Administrator';

  // Update avatar initial
  const avatarEl = document.getElementById('admin-profile-avatar');
  if (avatarEl) avatarEl.textContent = (profile.firstName || 'A').charAt(0).toUpperCase();

  // Load stats
  const teamCount = JSON.parse(localStorage.getItem('orderflow_admin_team') || '[]').length;
  const statTeam = document.getElementById('admin-stat-team');
  if (statTeam) statTeam.textContent = teamCount || '3';

  const statKunder = document.getElementById('admin-stat-kunder');
  if (statKunder) statKunder.textContent = restaurants?.length || '12';
}

function loadAdminOplysninger() {
  const profile = JSON.parse(localStorage.getItem('orderflow_admin_profile') || '{}');
  const fields = {
    'admin-firstname': profile.firstName || '',
    'admin-lastname': profile.lastName || '',
    'admin-email': profile.email || currentUser?.email || '',
    'admin-phone': profile.phone || '',
    'admin-title': profile.title || '',
    'admin-position': profile.position || ''
  };
  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });
}

function saveAdminOplysninger() {
  const profile = {
    firstName: document.getElementById('admin-firstname')?.value || '',
    lastName: document.getElementById('admin-lastname')?.value || '',
    email: document.getElementById('admin-email')?.value || '',
    phone: document.getElementById('admin-phone')?.value || '',
    title: document.getElementById('admin-title')?.value || '',
    position: document.getElementById('admin-position')?.value || ''
  };
  localStorage.setItem('orderflow_admin_profile', JSON.stringify(profile));

  // Sync profile to Supabase
  _saveBuilderConfigToSupabase('admin_profile', profile);

  showSaveStatus('admin-oplysninger-status', 'saved');
}

async function inviteTeamMember() {
  const email = prompt('Indtast email på den medarbejder du vil invitere:');
  if (!email || !email.includes('@')) { toast('Ugyldig email', 'warn'); return; }

  const role = prompt('Rolle (Admin/Medarbejder):', 'Medarbejder') || 'Medarbejder';

  try {
    const response = await fetch('/api/auth/provision-customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('orderflow-auth-token')}` },
      body: JSON.stringify({ email, role: role.toLowerCase() })
    });

    if (!response.ok) throw new Error('Invitation fejlede');

    const team = JSON.parse(localStorage.getItem('orderflow_admin_team') || '[]');
    team.push({ name: email.split('@')[0], email, role, status: 'Inviteret' });
    localStorage.setItem('orderflow_admin_team', JSON.stringify(team));

    toast(`Invitation sendt til ${email}`, 'success');
    loadAdminTeam();
  } catch (err) {
    toast('Fejl: ' + err.message, 'error');
  }
}
window.inviteTeamMember = inviteTeamMember;

function loadAdminTeam() {
  const team = JSON.parse(localStorage.getItem('orderflow_admin_team') || 'null') || [
    { name: 'Martin Sarvio', email: 'martin@flow.dk', role: 'Admin', status: 'Aktiv' },
    { name: 'Emma Nielsen', email: 'emma@flow.dk', role: 'Medarbejder', status: 'Aktiv' },
    { name: 'Lars Petersen', email: 'lars@flow.dk', role: 'Medarbejder', status: 'Inviteret' }
  ];
  const container = document.getElementById('admin-team-list');
  if (!container) return;

  container.innerHTML = team.map((m, i) => `
    <div class="card" style="padding:16px;display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:40px;height:40px;border-radius:50%;background:var(--color-primary);display:flex;align-items:center;justify-content:center;font-weight:600;color:#fff;font-size:14px">${m.name.charAt(0)}</div>
        <div>
          <div style="font-weight:600;font-size:14px">${m.name}</div>
          <div style="font-size:12px;color:var(--color-text-muted)">${m.email}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        <span style="padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${m.role === 'Admin' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.08)'};color:${m.role === 'Admin' ? 'var(--color-primary)' : 'var(--color-text-muted)'}">${m.role}</span>
        <span style="padding:4px 10px;border-radius:20px;font-size:11px;font-weight:500;background:${m.status === 'Aktiv' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'};color:${m.status === 'Aktiv' ? 'var(--color-success)' : '#F59E0B'}">${m.status}</span>
      </div>
    </div>
  `).join('');
}

function loadAdminVirksomhed() {
  const company = JSON.parse(localStorage.getItem('orderflow_admin_company') || '{}');
  const fields = {
    'company-name': company.name || '',
    'company-cvr': company.cvr || '',
    'company-address': company.address || '',
    'company-city': company.city || '',
    'company-zip': company.zip || '',
    'company-phone': company.phone || '',
    'company-email': company.email || ''
  };
  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });
}

function saveAdminVirksomhed() {
  const company = {
    name: document.getElementById('company-name')?.value || '',
    cvr: document.getElementById('company-cvr')?.value || '',
    address: document.getElementById('company-address')?.value || '',
    city: document.getElementById('company-city')?.value || '',
    zip: document.getElementById('company-zip')?.value || '',
    phone: document.getElementById('company-phone')?.value || '',
    email: document.getElementById('company-email')?.value || ''
  };
  localStorage.setItem('orderflow_admin_company', JSON.stringify(company));

  // Sync company to Supabase
  _saveBuilderConfigToSupabase('admin_company', company);

  showSaveStatus('company-save-status', 'saved');
}

function loadAdminSikkerhed() {
  const sessions = [
    { device: 'Chrome - macOS', location: 'København, DK', time: 'Aktiv nu', current: true },
    { device: 'Safari - iPhone', location: 'Aarhus, DK', time: '2 timer siden', current: false },
    { device: 'Firefox - Windows', location: 'Odense, DK', time: '1 dag siden', current: false }
  ];
  const container = document.getElementById('admin-sessions-list');
  if (!container) return;

  container.innerHTML = sessions.map(s => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--color-border)">
      <div>
        <div style="font-size:13px;font-weight:500">${s.device}</div>
        <div style="font-size:12px;color:var(--color-text-muted)">${s.location}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:12px;color:${s.current ? 'var(--color-success)' : 'var(--color-text-muted)'}">${s.time}</span>
        ${!s.current ? '<button class="btn btn-ghost" style="font-size:11px;padding:4px 8px">Afslut</button>' : ''}
      </div>
    </div>
  `).join('');
}

function loadAdminAktivitet() {
  const activities = [
    { action: 'Opdaterede virksomhedsoplysninger', type: 'Profil', time: '10 min siden' },
    { action: 'Tilføjede ny medarbejder: Emma Nielsen', type: 'Team', time: '1 time siden' },
    { action: 'Ændrede abonnementsplan til Pro', type: 'Fakturering', time: '3 timer siden' },
    { action: 'Opdaterede API-nøgler', type: 'System', time: '1 dag siden' },
    { action: 'Loggede ind fra ny enhed', type: 'Sikkerhed', time: '2 dage siden' },
    { action: 'Eksporterede kundedata', type: 'Data', time: '3 dage siden' },
    { action: 'Ændrede rolletilladelser', type: 'Team', time: '1 uge siden' },
    { action: 'Oprettede ny kampagne', type: 'Marketing', time: '1 uge siden' }
  ];
  const container = document.getElementById('admin-activity-list');
  if (!container) return;

  const typeColors = {
    'Profil': '#6366F1', 'Team': '#10B981', 'Fakturering': '#F59E0B',
    'System': '#06B6D4', 'Sikkerhed': '#EF4444', 'Data': '#8B5CF6', 'Marketing': '#EC4899'
  };

  container.innerHTML = activities.map(a => `
    <div style="display:flex;align-items:flex-start;gap:12px;padding:14px 0;border-bottom:1px solid var(--color-border)">
      <div style="width:8px;height:8px;border-radius:50%;background:${typeColors[a.type] || '#6366F1'};margin-top:6px;flex-shrink:0"></div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:500">${a.action}</div>
        <div style="display:flex;gap:12px;margin-top:4px">
          <span style="font-size:11px;padding:2px 8px;border-radius:12px;background:rgba(${typeColors[a.type] === '#6366F1' ? '99,102,241' : '255,255,255'},0.1);color:${typeColors[a.type] || 'var(--color-text-muted)'}">${a.type}</span>
          <span style="font-size:11px;color:var(--color-text-muted)">${a.time}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function loadAdminAbonnement() {
  // Placeholder data for subscription
  const sub = JSON.parse(localStorage.getItem('orderflow_admin_subscription') || 'null') || {
    plan: 'Pro', price: '599', period: 'måned', nextBilling: '2026-03-06',
    usage: { kunder: 12, maxKunder: 50, ordrer: 342, storage: '2.1 GB' }
  };
  const planEl = document.getElementById('admin-plan-name');
  if (planEl) planEl.textContent = sub.plan;

  const priceEl = document.getElementById('admin-plan-price');
  if (priceEl) priceEl.textContent = sub.price + ' kr/' + sub.period;

  const nextEl = document.getElementById('admin-next-billing');
  if (nextEl) nextEl.textContent = sub.nextBilling;

  const usageBar = document.getElementById('admin-usage-bar');
  if (usageBar) usageBar.style.width = Math.round((sub.usage.kunder / sub.usage.maxKunder) * 100) + '%';

  const usageText = document.getElementById('admin-usage-text');
  if (usageText) usageText.textContent = `${sub.usage.kunder} / ${sub.usage.maxKunder} kunder`;
}

// ========== Kunde Profile Functions ==========

function loadKundeProfileOverview() {
  const profile = JSON.parse(localStorage.getItem('orderflow_kunde_profile') || '{}');
  const name = (profile.firstName || 'Kunde') + ' ' + (profile.lastName || '');
  const el = document.getElementById('kunde-profile-name');
  if (el) el.textContent = name.trim();

  const emailEl = document.getElementById('kunde-profile-email');
  if (emailEl) emailEl.textContent = profile.email || currentUser?.email || 'kunde@example.dk';

  const avatarEl = document.getElementById('kunde-profile-avatar');
  if (avatarEl) avatarEl.textContent = (profile.firstName || 'K').charAt(0).toUpperCase();

  // Load loyalty status
  const loyalty = JSON.parse(localStorage.getItem('orderflow_kunde_loyalty') || '{}');
  const pointsEl = document.getElementById('kunde-stat-points');
  if (pointsEl) pointsEl.textContent = loyalty.points || '2.450';

  const tierEl = document.getElementById('kunde-stat-tier');
  if (tierEl) tierEl.textContent = loyalty.tier || 'Guld';
}

function loadKundeOplysninger() {
  const profile = JSON.parse(localStorage.getItem('orderflow_kunde_profile') || '{}');
  const fields = {
    'kunde-firstname': profile.firstName || '',
    'kunde-lastname': profile.lastName || '',
    'kunde-email': profile.email || currentUser?.email || '',
    'kunde-phone': profile.phone || ''
  };
  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });
}

function saveKundeOplysninger() {
  const profile = {
    firstName: document.getElementById('kunde-firstname')?.value || '',
    lastName: document.getElementById('kunde-lastname')?.value || '',
    email: document.getElementById('kunde-email')?.value || '',
    phone: document.getElementById('kunde-phone')?.value || ''
  };
  localStorage.setItem('orderflow_kunde_profile', JSON.stringify(profile));

  if (window.SupabaseDB) {
    window.SupabaseDB.saveUserSetting('kunde_profile', profile)
      .catch(err => console.warn('Supabase sync fejl (kunde profile):', err));
  }

  showSaveStatus('kunde-oplysninger-status', 'saved');
}

function loadKundeOrdrer() {
  const orders = [
    { id: '#ORD-2847', date: '2026-02-06', restaurant: 'Pizza Palace', total: '189 kr', status: 'Leveret' },
    { id: '#ORD-2831', date: '2026-02-04', restaurant: 'Sushi House', total: '342 kr', status: 'Leveret' },
    { id: '#ORD-2815', date: '2026-02-01', restaurant: 'Burger Bar', total: '145 kr', status: 'Leveret' },
    { id: '#ORD-2798', date: '2026-01-28', restaurant: 'Thai Garden', total: '278 kr', status: 'Leveret' },
    { id: '#ORD-2776', date: '2026-01-25', restaurant: 'Pizza Palace', total: '212 kr', status: 'Leveret' }
  ];
  const container = document.getElementById('kunde-orders-list');
  if (!container) return;

  container.innerHTML = orders.map(o => `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr;gap:16px;align-items:center;padding:14px 0;border-bottom:1px solid var(--color-border);font-size:13px">
      <span style="font-weight:600;color:var(--color-primary)">${o.id}</span>
      <span style="color:var(--color-text-muted)">${o.date}</span>
      <span>${o.restaurant}</span>
      <span style="font-weight:600">${o.total}</span>
      <span style="padding:4px 10px;border-radius:20px;font-size:11px;font-weight:500;background:rgba(16,185,129,0.15);color:var(--color-success);display:inline-block;width:fit-content">${o.status}</span>
    </div>
  `).join('');
}

function loadKundeBetaling() {
  const cards = JSON.parse(localStorage.getItem('orderflow_kunde_cards') || 'null') || [
    { type: 'Visa', last4: '4242', expiry: '12/27', default: true },
    { type: 'Mastercard', last4: '8888', expiry: '06/28', default: false }
  ];
  const container = document.getElementById('kunde-cards-list');
  if (!container) return;

  container.innerHTML = cards.map((c, i) => `
    <div class="card" style="padding:20px;display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:16px">
        <div style="width:48px;height:32px;border-radius:6px;background:${c.type === 'Visa' ? 'linear-gradient(135deg,#1a1f71,#2a3eb1)' : 'linear-gradient(135deg,#eb001b,#f79e1b)'};display:flex;align-items:center;justify-content:center">
          <span style="color:#fff;font-size:10px;font-weight:700">${c.type}</span>
        </div>
        <div>
          <div style="font-size:14px;font-weight:600">•••• •••• •••• ${c.last4}</div>
          <div style="font-size:12px;color:var(--color-text-muted)">Udløber ${c.expiry}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        ${c.default ? '<span style="padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;background:rgba(99,102,241,0.15);color:var(--color-primary)">Standard</span>' : ''}
        <button class="btn btn-ghost" style="font-size:12px">Fjern</button>
      </div>
    </div>
  `).join('');
}

function loadKundeAdresser() {
  const addresses = JSON.parse(localStorage.getItem('orderflow_kunde_addresses') || 'null') || [
    { label: 'Hjem', address: 'Vesterbrogade 42, 3. th', city: '1620 København V', default: true },
    { label: 'Arbejde', address: 'Kongens Nytorv 15', city: '1050 København K', default: false }
  ];
  const container = document.getElementById('kunde-addresses-list');
  if (!container) return;

  container.innerHTML = addresses.map((a, i) => `
    <div class="card" style="padding:20px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <span style="font-size:14px;font-weight:600">${a.label}</span>
        <div style="display:flex;align-items:center;gap:8px">
          ${a.default ? '<span style="padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;background:rgba(99,102,241,0.15);color:var(--color-primary)">Standard</span>' : ''}
          <button class="btn btn-ghost" style="font-size:12px">Rediger</button>
        </div>
      </div>
      <div style="font-size:13px;color:var(--color-text-muted)">${a.address}</div>
      <div style="font-size:13px;color:var(--color-text-muted)">${a.city}</div>
    </div>
  `).join('');
}

function loadKundeLoyalitet() {
  const loyalty = JSON.parse(localStorage.getItem('orderflow_kunde_loyalty') || 'null') || {
    points: 2450, tier: 'Guld', nextTier: 'Platin', pointsToNext: 550,
    history: [
      { action: 'Ordre #ORD-2847', points: '+45', date: '2026-02-06' },
      { action: 'Ordre #ORD-2831', points: '+68', date: '2026-02-04' },
      { action: 'Indløst belønning', points: '-500', date: '2026-02-02' },
      { action: 'Ordre #ORD-2815', points: '+29', date: '2026-02-01' },
      { action: 'Bonus - Guld tier', points: '+100', date: '2026-01-31' }
    ],
    rewards: [
      { name: 'Gratis levering', cost: 200, available: true },
      { name: '10% rabat på næste ordre', cost: 500, available: true },
      { name: 'Gratis dessert', cost: 300, available: true },
      { name: 'VIP adgang til nye restauranter', cost: 1000, available: true }
    ]
  };

  const pointsEl = document.getElementById('loyalty-points-value');
  if (pointsEl) pointsEl.textContent = loyalty.points.toLocaleString('da-DK');

  const tierEl = document.getElementById('loyalty-tier-name');
  if (tierEl) tierEl.textContent = loyalty.tier;

  const progressEl = document.getElementById('loyalty-progress-bar');
  if (progressEl) {
    const progress = Math.round(((3000 - loyalty.pointsToNext) / 3000) * 100);
    progressEl.style.width = progress + '%';
  }

  const nextEl = document.getElementById('loyalty-next-tier');
  if (nextEl) nextEl.textContent = `${loyalty.pointsToNext} point til ${loyalty.nextTier}`;

  // Render history
  const historyContainer = document.getElementById('loyalty-history-list');
  if (historyContainer) {
    historyContainer.innerHTML = loyalty.history.map(h => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--color-border)">
        <div>
          <div style="font-size:13px;font-weight:500">${h.action}</div>
          <div style="font-size:11px;color:var(--color-text-muted)">${h.date}</div>
        </div>
        <span style="font-size:13px;font-weight:600;color:${h.points.startsWith('+') ? 'var(--color-success)' : 'var(--color-danger)'}">${h.points}</span>
      </div>
    `).join('');
  }

  // Render rewards
  const rewardsContainer = document.getElementById('loyalty-rewards-list');
  if (rewardsContainer) {
    rewardsContainer.innerHTML = loyalty.rewards.map(r => `
      <div class="card" style="padding:16px;display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-size:13px;font-weight:600">${r.name}</div>
          <div style="font-size:12px;color:var(--color-text-muted)">${r.cost} point</div>
        </div>
        <button class="btn btn-${loyalty.points >= r.cost ? 'primary' : 'secondary'}" style="font-size:12px;padding:6px 14px" ${loyalty.points < r.cost ? 'disabled' : ''}>Indløs</button>
      </div>
    `).join('');
  }
}

function loadKundePraeferencer() {
  const prefs = JSON.parse(localStorage.getItem('orderflow_kunde_preferences') || '{}');

  const fields = {
    'pref-language': prefs.language || 'da',
    'pref-email-notif': prefs.emailNotif !== false,
    'pref-sms-notif': prefs.smsNotif !== false,
    'pref-push-notif': prefs.pushNotif !== false,
    'pref-marketing': prefs.marketing || false,
    'pref-dietary': prefs.dietary || ''
  };

  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = val;
    else el.value = val;
  });
}

function saveKundePraeferencer() {
  const prefs = {
    language: document.getElementById('pref-language')?.value || 'da',
    emailNotif: document.getElementById('pref-email-notif')?.checked ?? true,
    smsNotif: document.getElementById('pref-sms-notif')?.checked ?? true,
    pushNotif: document.getElementById('pref-push-notif')?.checked ?? true,
    marketing: document.getElementById('pref-marketing')?.checked ?? false,
    dietary: document.getElementById('pref-dietary')?.value || ''
  };
  localStorage.setItem('orderflow_kunde_preferences', JSON.stringify(prefs));

  if (window.SupabaseDB) {
    window.SupabaseDB.saveUserSetting('kunde_preferences', prefs)
      .catch(err => console.warn('Supabase sync fejl (kunde prefs):', err));
  }

  showSaveStatus('kunde-prefs-status', 'saved');
}

// ========== Mine Oplysninger ==========

function loadAccountInfo() {
  const profile = JSON.parse(localStorage.getItem('orderflow_user_profile') || '{}');

  const firstnameEl = document.getElementById('account-firstname');
  const lastnameEl = document.getElementById('account-lastname');
  const emailEl = document.getElementById('account-email');
  const phoneEl = document.getElementById('account-phone');

  if (firstnameEl) firstnameEl.value = profile.firstName || '';
  if (lastnameEl) lastnameEl.value = profile.lastName || '';
  if (emailEl) emailEl.value = profile.email || (currentUser?.email || '');
  if (phoneEl) phoneEl.value = profile.phone || '';
}

function saveAccountInfo() {
  const profile = {
    firstName: document.getElementById('account-firstname')?.value || '',
    lastName: document.getElementById('account-lastname')?.value || '',
    email: document.getElementById('account-email')?.value || '',
    phone: document.getElementById('account-phone')?.value || ''
  };

  localStorage.setItem('orderflow_user_profile', JSON.stringify(profile));

  if (window.SupabaseDB) {
    window.SupabaseDB.saveUserSetting('user_profile', profile)
      .catch(err => console.warn('Supabase sync fejl (account info):', err));
  }

  // Update topbar display
  updateProfileDropdownDisplay(profile);

  const statusEl = document.getElementById('account-save-status');
  if (statusEl) {
    statusEl.textContent = 'Gemt!';
    setTimeout(() => { statusEl.textContent = ''; }, 2000);
  }
  toast('Oplysninger gemt', 'success');
}

function updateProfileDropdownDisplay(profile) {
  const nameEl = document.getElementById('dropdown-name');
  const emailEl = document.getElementById('dropdown-email');
  const avatarEl = document.getElementById('topbar-avatar');

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Bruger';

  if (nameEl) nameEl.textContent = fullName;
  if (emailEl) emailEl.textContent = profile.email || '';
  if (avatarEl) avatarEl.textContent = (profile.firstName?.[0] || 'B').toUpperCase();
}

function changeAccountPassword() {
  const current = document.getElementById('account-current-password')?.value;
  const newPass = document.getElementById('account-new-password')?.value;
  const confirm = document.getElementById('account-confirm-password')?.value;

  if (!current || !newPass || !confirm) {
    toast('Udfyld alle felter', 'error');
    return;
  }

  if (newPass !== confirm) {
    toast('Adgangskoderne matcher ikke', 'error');
    return;
  }

  if (newPass.length < 6) {
    toast('Adgangskoden skal være mindst 6 tegn', 'error');
    return;
  }

  // In a real implementation, this would call an API
  toast('Adgangskode ændret', 'success');

  // Clear fields
  document.getElementById('account-current-password').value = '';
  document.getElementById('account-new-password').value = '';
  document.getElementById('account-confirm-password').value = '';
}

// ========== Betalingsmetoder ==========

function loadPaymentMethods() {
  const methods = JSON.parse(localStorage.getItem('orderflow_payment_methods') || '[]');
  const container = document.getElementById('payment-methods-list');

  if (!container) return;

  if (methods.length === 0) {
    container.innerHTML = `
      <div class="empty" style="padding:40px;text-align:center">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
        </div>
        <div style="margin-top:12px">Ingen betalingsmetoder tilføjet</div>
        <div style="font-size:var(--font-size-sm);color:var(--muted);margin-top:8px">
          Tilføj et kort for hurtigere betaling
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = methods.map((method, index) => `
    <div class="setting-card" style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-4)">
      <div style="display:flex;align-items:center;gap:var(--space-4)">
        <div style="width:48px;height:32px;background:var(--bg3);border-radius:4px;display:flex;align-items:center;justify-content:center">
          ${getCardTypeIcon(method.type)}
        </div>
        <div>
          <div style="font-weight:500">${method.type} •••• ${method.lastFour}</div>
          <div style="font-size:var(--font-size-sm);color:var(--muted)">Udløber ${method.expiry}</div>
        </div>
      </div>
      <div style="display:flex;gap:var(--space-2)">
        ${method.isDefault ? '<span style="background:var(--accent);color:#fff;padding:2px 8px;border-radius:4px;font-size:12px">Standard</span>' : ''}
        <button class="btn btn-secondary" style="padding:6px 12px" onclick="deletePaymentMethod(${index})">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

function getCardTypeIcon(type) {
  const icons = {
    'Visa': '<svg width="32" height="20" viewBox="0 0 32 20"><rect fill="#1A1F71" width="32" height="20" rx="2"/><text x="16" y="13" text-anchor="middle" fill="#fff" font-size="8" font-weight="bold">VISA</text></svg>',
    'Mastercard': '<svg width="32" height="20" viewBox="0 0 32 20"><rect fill="#000" width="32" height="20" rx="2"/><circle cx="12" cy="10" r="6" fill="#EB001B"/><circle cx="20" cy="10" r="6" fill="#F79E1B"/></svg>',
    'MobilePay': '<svg width="32" height="20" viewBox="0 0 32 20"><rect fill="#5A78FF" width="32" height="20" rx="2"/><text x="16" y="13" text-anchor="middle" fill="#fff" font-size="6" font-weight="bold">MobilePay</text></svg>'
  };
  return icons[type] || '<svg width="32" height="20" viewBox="0 0 32 20"><rect fill="#666" width="32" height="20" rx="2"/></svg>';
}

function showAddPaymentMethodModal() {
  let modal = document.getElementById('payment-method-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'payment-method-modal';
    modal.className = 'modal';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-overlay" onclick="closePaymentMethodModal()"></div>
    <div class="modal-content" style="max-width:400px">
      <div class="modal-header">
        <h3>Tilføj betalingsmetode</h3>
        <button class="modal-close" onclick="closePaymentMethodModal()">&times;</button>
      </div>
      <div class="modal-body" style="padding:var(--space-5)">
        <div class="form-group">
          <label class="form-label">Korttype</label>
          <select class="input" id="new-card-type">
            <option value="Visa">Visa</option>
            <option value="Mastercard">Mastercard</option>
            <option value="MobilePay">MobilePay</option>
          </select>
        </div>
        <div class="form-group" style="margin-top:var(--space-4)">
          <label class="form-label">Kortnummer</label>
          <input type="text" class="input" id="new-card-number" placeholder="1234 5678 9012 3456" maxlength="19">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);margin-top:var(--space-4)">
          <div class="form-group">
            <label class="form-label">Udløbsdato</label>
            <input type="text" class="input" id="new-card-expiry" placeholder="MM/YY" maxlength="5">
          </div>
          <div class="form-group">
            <label class="form-label">CVV</label>
            <input type="text" class="input" id="new-card-cvv" placeholder="123" maxlength="4">
          </div>
        </div>
        <div style="margin-top:var(--space-4)">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="checkbox" id="new-card-default">
            <span style="font-size:var(--font-size-sm)">Gør til standardkort</span>
          </label>
        </div>
      </div>
      <div class="modal-footer" style="padding:var(--space-4);display:flex;gap:var(--space-3);justify-content:flex-end">
        <button class="btn btn-secondary" onclick="closePaymentMethodModal()">Annuller</button>
        <button class="btn btn-primary" onclick="addPaymentMethod()">Tilføj kort</button>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

function closePaymentMethodModal() {
  const modal = document.getElementById('payment-method-modal');
  if (modal) modal.classList.remove('active');
}

function addPaymentMethod() {
  const type = document.getElementById('new-card-type')?.value;
  const number = document.getElementById('new-card-number')?.value.replace(/\s/g, '');
  const expiry = document.getElementById('new-card-expiry')?.value;
  const isDefault = document.getElementById('new-card-default')?.checked;

  if (!number || number.length < 12) {
    toast('Indtast gyldigt kortnummer', 'error');
    return;
  }

  if (!expiry || expiry.length < 5) {
    toast('Indtast gyldig udløbsdato', 'error');
    return;
  }

  const methods = JSON.parse(localStorage.getItem('orderflow_payment_methods') || '[]');

  // If this is default, remove default from others
  if (isDefault) {
    methods.forEach(m => m.isDefault = false);
  }

  methods.push({
    type: type,
    lastFour: number.slice(-4),
    expiry: expiry,
    isDefault: isDefault || methods.length === 0
  });

  localStorage.setItem('orderflow_payment_methods', JSON.stringify(methods));

  closePaymentMethodModal();
  loadPaymentMethods();
  toast('Betalingsmetode tilføjet', 'success');
}

function deletePaymentMethod(index) {
  if (!confirm('Er du sikker på du vil fjerne denne betalingsmetode?')) return;

  const methods = JSON.parse(localStorage.getItem('orderflow_payment_methods') || '[]');
  methods.splice(index, 1);
  localStorage.setItem('orderflow_payment_methods', JSON.stringify(methods));

  loadPaymentMethods();
  toast('Betalingsmetode fjernet', 'success');
}

// ========== Leveringsadresser ==========

function loadDeliveryAddresses() {
  const addresses = JSON.parse(localStorage.getItem('orderflow_delivery_addresses') || '[]');
  const container = document.getElementById('delivery-addresses-list');

  if (!container) return;

  if (addresses.length === 0) {
    container.innerHTML = `
      <div class="empty" style="padding:40px;text-align:center">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div style="margin-top:12px">Ingen adresser tilføjet</div>
        <div style="font-size:var(--font-size-sm);color:var(--muted);margin-top:8px">
          Tilføj en adresse for hurtigere levering
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = addresses.map((addr, index) => `
    <div class="setting-card" style="padding:var(--space-4)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-weight:500;margin-bottom:4px">${addr.label || 'Adresse'}</div>
          <div style="color:var(--text2)">${addr.street}</div>
          <div style="color:var(--muted);font-size:var(--font-size-sm)">${addr.postalCode} ${addr.city}</div>
          ${addr.note ? `<div style="color:var(--muted);font-size:var(--font-size-sm);margin-top:4px">${addr.note}</div>` : ''}
        </div>
        <div style="display:flex;gap:var(--space-2);align-items:center">
          ${addr.isDefault ? '<span style="background:var(--accent);color:#fff;padding:2px 8px;border-radius:4px;font-size:12px">Standard</span>' : ''}
          <button class="btn btn-secondary" style="padding:6px 12px" onclick="editAddress(${index})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="btn btn-secondary" style="padding:6px 12px" onclick="deleteAddress(${index})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function showAddAddressModal(editIndex = null) {
  const addresses = JSON.parse(localStorage.getItem('orderflow_delivery_addresses') || '[]');
  const addr = editIndex !== null ? addresses[editIndex] : {};
  const isEdit = editIndex !== null;

  let modal = document.getElementById('address-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'address-modal';
    modal.className = 'modal';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeAddressModal()"></div>
    <div class="modal-content" style="max-width:450px">
      <div class="modal-header">
        <h3>${isEdit ? 'Rediger adresse' : 'Tilføj adresse'}</h3>
        <button class="modal-close" onclick="closeAddressModal()">&times;</button>
      </div>
      <div class="modal-body" style="padding:var(--space-5)">
        <div class="form-group">
          <label class="form-label">Betegnelse</label>
          <input type="text" class="input" id="address-label" placeholder="F.eks. Hjem, Arbejde" value="${addr.label || ''}">
        </div>
        <div class="form-group" style="margin-top:var(--space-4)">
          <label class="form-label">Adresse</label>
          <input type="text" class="input" id="address-street" placeholder="Gadenavn og nummer" value="${addr.street || ''}">
        </div>
        <div style="display:grid;grid-template-columns:120px 1fr;gap:var(--space-4);margin-top:var(--space-4)">
          <div class="form-group">
            <label class="form-label">Postnummer</label>
            <input type="text" class="input" id="address-postal" placeholder="2100" maxlength="4" value="${addr.postalCode || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">By</label>
            <input type="text" class="input" id="address-city" placeholder="København" value="${addr.city || ''}">
          </div>
        </div>
        <div class="form-group" style="margin-top:var(--space-4)">
          <label class="form-label">Note (valgfri)</label>
          <input type="text" class="input" id="address-note" placeholder="F.eks. Ring på døren" value="${addr.note || ''}">
        </div>
        <div style="margin-top:var(--space-4)">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="checkbox" id="address-default" ${addr.isDefault ? 'checked' : ''}>
            <span style="font-size:var(--font-size-sm)">Gør til standardadresse</span>
          </label>
        </div>
      </div>
      <div class="modal-footer" style="padding:var(--space-4);display:flex;gap:var(--space-3);justify-content:flex-end">
        <button class="btn btn-secondary" onclick="closeAddressModal()">Annuller</button>
        <button class="btn btn-primary" onclick="saveAddress(${editIndex})">${isEdit ? 'Gem' : 'Tilføj'}</button>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

function closeAddressModal() {
  const modal = document.getElementById('address-modal');
  if (modal) modal.classList.remove('active');
}

function editAddress(index) {
  showAddAddressModal(index);
}

function saveAddress(editIndex) {
  const label = document.getElementById('address-label')?.value.trim();
  const street = document.getElementById('address-street')?.value.trim();
  const postalCode = document.getElementById('address-postal')?.value.trim();
  const city = document.getElementById('address-city')?.value.trim();
  const note = document.getElementById('address-note')?.value.trim();
  const isDefault = document.getElementById('address-default')?.checked;

  if (!street || !postalCode || !city) {
    toast('Udfyld adresse, postnummer og by', 'error');
    return;
  }

  const addresses = JSON.parse(localStorage.getItem('orderflow_delivery_addresses') || '[]');

  if (isDefault) {
    addresses.forEach(a => a.isDefault = false);
  }

  const newAddr = { label, street, postalCode, city, note, isDefault: isDefault || addresses.length === 0 };

  if (editIndex !== null) {
    addresses[editIndex] = newAddr;
  } else {
    addresses.push(newAddr);
  }

  localStorage.setItem('orderflow_delivery_addresses', JSON.stringify(addresses));

  closeAddressModal();
  loadDeliveryAddresses();
  toast(editIndex !== null ? 'Adresse opdateret' : 'Adresse tilføjet', 'success');
}

function deleteAddress(index) {
  if (!confirm('Er du sikker på du vil fjerne denne adresse?')) return;

  const addresses = JSON.parse(localStorage.getItem('orderflow_delivery_addresses') || '[]');
  addresses.splice(index, 1);
  localStorage.setItem('orderflow_delivery_addresses', JSON.stringify(addresses));

  loadDeliveryAddresses();
  toast('Adresse fjernet', 'success');
}

// ========== Ordre Historik ==========

let orderHistoryPage = 1;
const ORDERS_PER_PAGE = 10;


function loadAppBuilderTemplate(templateId) {
  const template = appBuilderTemplates[templateId];
  if (!template) {
    toast('App skabelon ikke fundet', 'error');
    return;
  }

  currentAppTemplate = templateId;

  // Store selected template
  localStorage.setItem('orderflow_app_template', templateId);

  // Update all template selectors
  document.querySelectorAll('#app-template-selector').forEach(select => {
    select.value = templateId;
  });

  toast('App skabelon valgt: ' + template.name, 'success');

  // Refresh app preview if visible
  if (typeof updateAppPreview === 'function') {
    updateAppPreview();
  }
}

// Initialize App Builder template on page load
function initAppBuilderTemplate() {
  const savedTemplate = localStorage.getItem('orderflow_app_template') || 'app-skabelon-1';
  currentAppTemplate = savedTemplate;

  // Set dropdown value
  const selector = document.getElementById('app-template-selector');
  if (selector) {
    selector.value = savedTemplate;
  }
}

// Load Web Builder template
function loadWebBuilderTemplate(templateId, options) {
  const silent = options && options.silent;
  const template = resolveTemplateById(templateId);
  if (!template) {
    if (!silent) toast('Skabelon ikke fundet', 'error');
    return;
  }

  // Switch preview iframe source based on template type
  const previewFile = template.previewFile || './demos/pwa-preview-mario.html';
  const override = getTemplateOverride(templateId);
  const baseHref = getTemplateBaseHref(template);
  const overrideHtml = override ? injectBaseTag(override, baseHref) : null;

  // Target Web Builder iframes by ID and class
  const frames = [];
  const mainFrame = document.getElementById('webbuilder-preview-frame');
  if (mainFrame) frames.push(mainFrame);
  document.querySelectorAll('.webbuilder-preview-frame').forEach(f => {
    if (!frames.includes(f)) frames.push(f);
  });
  const fullscreenFrame = document.getElementById('wb-fullscreen-preview-frame');
  if (fullscreenFrame && !frames.includes(fullscreenFrame)) frames.push(fullscreenFrame);

  frames.forEach(iframe => {
    if (overrideHtml) {
      iframe.src = 'about:blank';
      iframe.srcdoc = overrideHtml;
      return;
    }

    if (iframe.hasAttribute('srcdoc')) iframe.removeAttribute('srcdoc');
    const currentSrc = iframe.src.split('/').pop();
    const newSrc = previewFile.split('/').pop();
    if (currentSrc !== newSrc) {
      iframe.src = previewFile;
    }
  });

  // Merge template with default config
  webBuilderConfig = JSON.parse(JSON.stringify(template));
  webBuilderConfig._templateId = templateId;

  // Populate form fields
  populateWebBuilderForms();

  // Update preview (with small delay to allow iframe to load)
  setTimeout(() => {
    updateWebBuilderPreview({ skipUnsaved: true });
  }, 100);

  if (!silent) toast('Skabelon indlæst: ' + template.branding.name, 'success');
}

// Set inline preview device size
function setWbInlinePreviewDevice(device) {
  const deviceSizes = {
    mobile: { width: 280, height: 560, borderRadius: 32, padding: 10 },
    tablet: { width: 400, height: 540, borderRadius: 24, padding: 8 },
    desktop: { width: '100%', height: '100%', borderRadius: 12, padding: 6 }
  };

  const size = deviceSizes[device];
  if (!size) return;

  // Update all inline preview containers
  document.querySelectorAll('.wb-preview-device-container').forEach(container => {
    if (device === 'desktop') {
      container.style.width = '100%';
      container.style.maxWidth = '380px';
      container.style.height = 'calc(100% - 20px)';
    } else {
      container.style.width = size.width + 'px';
      container.style.height = size.height + 'px';
      container.style.maxWidth = '';
    }
    container.style.borderRadius = size.borderRadius + 'px';
    container.style.padding = size.padding + 'px';
  });

  // Update active button styling
  document.querySelectorAll('.wb-device-btn-inline').forEach(btn => {
    const isActive = btn.dataset.device === device;
    btn.classList.toggle('active', isActive);
    btn.style.background = isActive ? 'var(--bg1)' : 'transparent';
  });
}

// Customer search for admin support
function searchWebBuilderCustomers(query) {
  const resultsContainer = document.getElementById('wb-customer-results');
  if (!resultsContainer) return;

  if (!query || query.length < 2) {
    resultsContainer.innerHTML = '<div style="padding:12px;color:var(--muted);font-size:12px;text-align:center">Indtast mindst 2 tegn for at søge...</div>';
    return;
  }

  // Søg i localStorage efter gemte kunde-konfigurationer
  const savedConfigs = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('orderflow_customer_')) {
      try {
        const config = JSON.parse(localStorage.getItem(key));
        if (config && config.branding && config.branding.name) {
          savedConfigs.push({ key, config });
        }
      } catch (e) {}
    }
  }

  // Filtrer baseret på søgning
  const filtered = savedConfigs.filter(item =>
    item.config.branding.name.toLowerCase().includes(query.toLowerCase())
  );

  if (filtered.length === 0) {
    resultsContainer.innerHTML = '<div style="padding:12px;color:var(--muted);font-size:12px;text-align:center">Ingen kunder fundet</div>';
  } else {
    resultsContainer.innerHTML = filtered.map(item => `
      <div style="padding:10px 12px;cursor:pointer;border-bottom:1px solid var(--border);font-size:13px"
           onmouseover="this.style.background='var(--bg2)'"
           onmouseout="this.style.background='transparent'"
           onclick="loadCustomerConfig('${item.key}')">
        <div style="font-weight:500">${item.config.branding.name}</div>
        <div style="color:var(--muted);font-size:11px">${item.config.contact?.city || 'Ukendt by'}</div>
      </div>
    `).join('');
  }
}

function showWbCustomerResults() {
  const resultsContainer = document.getElementById('wb-customer-results');
  if (resultsContainer) resultsContainer.style.display = 'block';
}

function hideWbCustomerResults() {
  const resultsContainer = document.getElementById('wb-customer-results');
  if (resultsContainer) resultsContainer.style.display = 'none';
}

function loadCustomerConfig(key) {
  try {
    const config = JSON.parse(localStorage.getItem(key));
    if (config) {
      webBuilderConfig = config;
      populateWebBuilderForms();
      updateWebBuilderPreview();
      hideWbCustomerResults();
      document.getElementById('wb-customer-search').value = '';
      toast('Kunde indlæst: ' + config.branding.name, 'success');
    }
  } catch (e) {
    toast('Kunne ikke indlæse kunde', 'error');
  }
}

// Navigate to Web Builder page with specific section
function showWebBuilderPage(section) {
  // Map section names to page IDs
  const pageMap = {
    'branding': 'wb-branding',
    'farver': 'wb-farver',
    'billeder': 'wb-billeder',
    'menu': 'wb-menu',
    'timer': 'wb-timer',
    'kontakt': 'wb-kontakt',
    'blog': 'wb-blog',
    'levering': 'wb-levering',
    'funktioner': 'wb-funktioner',
    'social': 'wb-social'
  };

  const pageId = pageMap[section] || 'wb-branding';
  showPage(pageId);
  showPageIdBadge('webbuilder-' + section);

  // Update sidebar active state
  document.querySelectorAll('#nav-webbuilder-section .nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.getElementById('nav-wb-' + section);
  if (activeBtn) activeBtn.classList.add('active');

  // Special handling for hours tab
  if (section === 'timer') {
    renderBusinessHoursGrid();
  }

  // Load config if needed and initialize preview
  if (!webBuilderConfig) {
    loadWebBuilderConfig();
  }

  // Ensure preview iframes match selected template
  const selector = document.getElementById('wb-template-selector');
  if (selector && selector.value) {
    loadWebBuilderTemplate(selector.value, { silent: true });
  }

  // Update preview after page switch (give iframe time to load)
  setTimeout(() => {
    updateWebBuilderPreview({ skipUnsaved: true });
    // Reset unsaved flag - page load is not a user change
    webBuilderHasChanges = false;
    updateWebBuilderSaveStatus('saved');
  }, 400);
}

// Navigate to Flow landing page (opens in new window)

function switchWebBuilderTab(tab) {
  showWebBuilderPage(tab);
}

// Load Web Builder config from localStorage (per-template)
function loadWebBuilderConfig() {
  const selector = document.getElementById('wb-template-selector');
  const templateId = selector?.value || 'skabelon-1';
  const storageKey = 'orderflow_webbuilder_config_' + templateId;

  // Migration: move old generic key to template-specific key
  const oldConfig = localStorage.getItem('orderflow_webbuilder_config');
  if (oldConfig && !localStorage.getItem(storageKey)) {
    localStorage.setItem(storageKey, oldConfig);
  }

  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      webBuilderConfig = JSON.parse(saved);
    } catch (e) {
      const template = webBuilderTemplates[templateId];
      webBuilderConfig = template ? JSON.parse(JSON.stringify(template)) : { ...defaultWebBuilderConfig };
    }
  } else {
    const template = webBuilderTemplates[templateId];
    webBuilderConfig = template ? JSON.parse(JSON.stringify(template)) : { ...defaultWebBuilderConfig };
  }
  webBuilderConfig._templateId = templateId;

  // Populate form fields
  populateWebBuilderForms();
}

// Populate form fields from config
function populateWebBuilderForms() {
  if (!webBuilderConfig) return;

  // Branding
  const nameEl = document.getElementById('wb-name');
  const shortNameEl = document.getElementById('wb-short-name');
  const sloganEl = document.getElementById('wb-slogan');
  const descEl = document.getElementById('wb-description');
  const logoEl = document.getElementById('wb-logo');

  if (nameEl) nameEl.value = webBuilderConfig.branding?.name || defaultWebBuilderConfig.branding.name;
  if (shortNameEl) shortNameEl.value = webBuilderConfig.branding?.shortName || '';
  if (sloganEl) sloganEl.value = webBuilderConfig.branding?.slogan || defaultWebBuilderConfig.branding.slogan;
  if (descEl) descEl.value = webBuilderConfig.branding?.description || defaultWebBuilderConfig.branding.description;

  // Handle logo (can be string or object with url)
  const logoValue = webBuilderConfig.branding?.logo;
  if (logoEl) {
    if (typeof logoValue === 'object' && logoValue?.url) {
      logoEl.value = logoValue.url;
    } else if (typeof logoValue === 'string') {
      logoEl.value = logoValue;
    } else {
      logoEl.value = '';
    }
  }

  // Colors - extended set
  const colors = webBuilderConfig.branding?.colors || {};
  const colorFields = ['primary', 'secondary', 'accent', 'text', 'bg', 'surface', 'muted', 'success', 'warning', 'error'];
  colorFields.forEach(c => {
    const colorEl = document.getElementById('wb-color-' + c);
    const textEl = document.getElementById('wb-color-' + c + '-text');
    const defaultColor = defaultWebBuilderConfig.branding?.colors?.[c] || '#000000';
    // Map 'bg' to 'background' and 'muted' to 'textMuted' for config
    const configKey = c === 'bg' ? 'background' : (c === 'muted' ? 'textMuted' : c);
    if (colorEl) colorEl.value = colors[configKey] || defaultColor;
    if (textEl) textEl.value = colors[configKey] || defaultColor;
  });

  // Fonts
  const headingEl = document.getElementById('wb-font-heading');
  const bodyEl = document.getElementById('wb-font-body');
  if (headingEl) headingEl.value = webBuilderConfig.branding?.fonts?.heading || defaultWebBuilderConfig.branding.fonts.heading;
  if (bodyEl) bodyEl.value = webBuilderConfig.branding?.fonts?.body || defaultWebBuilderConfig.branding.fonts.body;

  // Images
  const heroEl = document.getElementById('wb-hero-image');
  const featuredEl = document.getElementById('wb-featured-image');
  if (heroEl) heroEl.value = webBuilderConfig.images?.hero || '';
  if (featuredEl) featuredEl.value = webBuilderConfig.images?.featured || '';

  // Hero Overlay
  const overlayColor = webBuilderConfig.images?.heroOverlay?.color || '#000000';
  const overlayOpacity = Math.round((webBuilderConfig.images?.heroOverlay?.opacity || 0.4) * 100);
  const overlayColorEl = document.getElementById('wb-hero-overlay-color');
  const overlayColorTextEl = document.getElementById('wb-hero-overlay-color-text');
  const overlayOpacityEl = document.getElementById('wb-hero-overlay-opacity');
  const overlayOpacityValueEl = document.getElementById('wb-hero-overlay-opacity-value');
  if (overlayColorEl) overlayColorEl.value = overlayColor;
  if (overlayColorTextEl) overlayColorTextEl.value = overlayColor;
  if (overlayOpacityEl) overlayOpacityEl.value = overlayOpacity;
  if (overlayOpacityValueEl) overlayOpacityValueEl.textContent = overlayOpacity + '%';

  // Menu
  const currencyEl = document.getElementById('wb-currency');
  const taxEl = document.getElementById('wb-tax-rate');
  if (currencyEl) currencyEl.value = webBuilderConfig.menu?.currency || defaultWebBuilderConfig.menu.currency;
  if (taxEl) taxEl.value = webBuilderConfig.menu?.taxRate || defaultWebBuilderConfig.menu.taxRate;

  // Contact
  const addressEl = document.getElementById('wb-address');
  const postalEl = document.getElementById('wb-postal');
  const cityEl = document.getElementById('wb-city');
  const phoneEl = document.getElementById('wb-phone');
  const emailEl = document.getElementById('wb-email');
  if (addressEl) addressEl.value = webBuilderConfig.contact?.address || '';
  if (postalEl) postalEl.value = webBuilderConfig.contact?.postalCode || '';
  if (cityEl) cityEl.value = webBuilderConfig.contact?.city || '';
  if (phoneEl) phoneEl.value = webBuilderConfig.contact?.phone || '';
  if (emailEl) emailEl.value = webBuilderConfig.contact?.email || '';

  // Delivery
  const deliveryEnabledEl = document.getElementById('wb-delivery-enabled');
  const feeEl = document.getElementById('wb-delivery-fee');
  const minOrderEl = document.getElementById('wb-min-order');
  const freeDeliveryEl = document.getElementById('wb-free-delivery');
  const deliveryTimeEl = document.getElementById('wb-delivery-time');
  if (deliveryEnabledEl) deliveryEnabledEl.checked = webBuilderConfig.delivery?.enabled !== false;
  if (feeEl) feeEl.value = webBuilderConfig.delivery?.fee || defaultWebBuilderConfig.delivery.fee;
  if (minOrderEl) minOrderEl.value = webBuilderConfig.delivery?.minimumOrder || defaultWebBuilderConfig.delivery.minimumOrder;
  if (freeDeliveryEl) freeDeliveryEl.value = webBuilderConfig.delivery?.freeDeliveryThreshold || defaultWebBuilderConfig.delivery.freeDeliveryThreshold;
  if (deliveryTimeEl) deliveryTimeEl.value = webBuilderConfig.delivery?.estimatedTime || defaultWebBuilderConfig.delivery.estimatedTime;

  // Features
  const feats = webBuilderConfig.features || {};
  const featOrderingEl = document.getElementById('wb-feat-ordering');
  const featLoyaltyEl = document.getElementById('wb-feat-loyalty');
  const featPickupEl = document.getElementById('wb-feat-pickup');
  const featDeliveryEl = document.getElementById('wb-feat-delivery');
  const featAccountsEl = document.getElementById('wb-feat-accounts');
  const featPushEl = document.getElementById('wb-feat-push');
  if (featOrderingEl) featOrderingEl.checked = feats.ordering !== false;
  if (featLoyaltyEl) featLoyaltyEl.checked = feats.loyalty !== false;
  if (featPickupEl) featPickupEl.checked = feats.pickup !== false;
  if (featDeliveryEl) featDeliveryEl.checked = feats.delivery !== false;
  if (featAccountsEl) featAccountsEl.checked = feats.customerAccounts === true;
  if (featPushEl) featPushEl.checked = feats.pushNotifications === true;

  // Social Media
  const fbEl = document.getElementById('wb-facebook');
  const igEl = document.getElementById('wb-instagram');
  const ttEl = document.getElementById('wb-tiktok');
  if (fbEl) fbEl.value = webBuilderConfig.contact?.socialMedia?.facebook || '';
  if (igEl) igEl.value = webBuilderConfig.contact?.socialMedia?.instagram || '';
  if (ttEl) ttEl.value = webBuilderConfig.contact?.socialMedia?.tiktok || '';

  // Update logo preview
  if (typeof updateWbLogoPreview === 'function') {
    updateWbLogoPreview();
  }

  // Initialize Billeder image previews
  setTimeout(() => {
    if (typeof initBillederPreviews === 'function') {
      initBillederPreviews();
    }
  }, 100);
}

// Render business hours grid
function renderBusinessHoursGrid() {
  const container = document.getElementById('wb-hours-grid');
  if (!container) return;

  const days = [
    { key: 'monday', label: 'Mandag' },
    { key: 'tuesday', label: 'Tirsdag' },
    { key: 'wednesday', label: 'Onsdag' },
    { key: 'thursday', label: 'Torsdag' },
    { key: 'friday', label: 'Fredag' },
    { key: 'saturday', label: 'Lørdag' },
    { key: 'sunday', label: 'Søndag' }
  ];

  const hours = webBuilderConfig?.businessHours || defaultWebBuilderConfig.businessHours;

  container.innerHTML = days.map(day => {
    const h = hours[day.key] || { open: '11:00', close: '22:00', closed: false };
    return `
      <div style="display:grid;grid-template-columns:100px 1fr 1fr 80px;gap:12px;align-items:center;margin-bottom:12px">
        <span style="font-weight:500">${day.label}</span>
        <input type="time" class="input" id="wb-hours-${day.key}-open" value="${h.open}" ${h.closed ? 'disabled' : ''} onchange="updateWebBuilderPreview()">
        <input type="time" class="input" id="wb-hours-${day.key}-close" value="${h.close}" ${h.closed ? 'disabled' : ''} onchange="updateWebBuilderPreview()">
        <label style="display:flex;align-items:center;gap:6px;font-size:12px">
          <input type="checkbox" id="wb-hours-${day.key}-closed" ${h.closed ? 'checked' : ''} onchange="toggleDayClosed('${day.key}')">
          Lukket
        </label>
      </div>
    `;
  }).join('');
}

// Toggle day closed
// toggleDayClosed — see earlier unified definition

// Sync color picker with text input
function syncColorInput(type) {
  const textEl = document.getElementById('wb-color-' + type + '-text');
  const colorEl = document.getElementById('wb-color-' + type);

  if (textEl && colorEl) {
    const value = textEl.value;
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      colorEl.value = value;
      updateWebBuilderPreview();
    }
  }
}

// Hero Overlay color sync
function syncHeroOverlayColor() {
  const colorEl = document.getElementById('wb-hero-overlay-color');
  const textEl = document.getElementById('wb-hero-overlay-color-text');
  if (colorEl && textEl) textEl.value = colorEl.value;
}

function syncHeroOverlayColorText() {
  const textEl = document.getElementById('wb-hero-overlay-color-text');
  const colorEl = document.getElementById('wb-hero-overlay-color');
  if (textEl && colorEl && /^#[0-9A-Fa-f]{6}$/.test(textEl.value)) {
    colorEl.value = textEl.value;
    updateWebBuilderPreview();
  }
}

function updateHeroOverlayOpacity() {
  const slider = document.getElementById('wb-hero-overlay-opacity');
  const display = document.getElementById('wb-hero-overlay-opacity-value');
  if (slider && display) display.textContent = slider.value + '%';
}

// Gallery images from Web builder Galleri folder
const WEB_BUILDER_GALLERY_IMAGES = [
  'images/Web builder Galleri/photo-1513104890138-7c749659a591.jpeg',
  'images/Web builder Galleri/photo-1574071318508-1cdbab80d002.jpeg',
  'images/Web builder Galleri/photo-1565299624946-b28f40a0ae38.jpeg',
  'images/Web builder Galleri/photo-1563379926898-05f4575a45d8.jpeg',
  'images/Web builder Galleri/photo-1560023907-5f339617ea30.jpeg',
  'images/Web builder Galleri/photo-1571877227200-a0d98ea607e9.jpeg',
  'images/Web builder Galleri/photo-1612874742237-6526221588e3.jpeg',
  'images/Web builder Galleri/photo-1622483767028-3f66f32aef97.jpeg',
  'images/Web builder Galleri/photo-1628840042765-356cda07504e.jpeg',
  'images/Web builder Galleri/photo-1488477181946-6428a0291777.jpeg',
  'images/Web builder Galleri/087cb32951d67b24e3800e63cc8e221e8cf153e3.jpg',
  'images/Web builder Galleri/6b34ff795ebe5ab0649a25a5462d47f6daf8878b.jpg',
  'images/Web builder Galleri/3f614186573fe3272aad077f8ac3ae5728296c77.jpg',
  'images/Web builder Galleri/4eb224c0724cce65431e27f6cbf88341734c716d.jpg',
  'images/Web builder Galleri/37075d1fe31da04fb73fe1600d90d13398836d96.jpg',
  'images/Web builder Galleri/dd995904bc5b2a79b5f1211676f34425afc864d7.jpg',
  'images/Web builder Galleri/5f70ea179451103d83cc64257accbe7484234ee1.jpg',
  'images/Web builder Galleri/a4727c950fa3cd8633959f81de98178b0b890760.jpg',
  'images/Web builder Galleri/36a6d191948546e09f528cc212ff65a1d36cedd2.jpeg',
  'images/Web builder Galleri/e69a0b6a7fc0c45a510c176eaa705fe2c2107c94.jpg.webp'
];

let currentGalleryTarget = 'hero';

function setGalleryTarget(target) {
  currentGalleryTarget = target;
  const heroBtn = document.getElementById('gallery-target-hero');
  const logoBtn = document.getElementById('gallery-target-logo');
  if (heroBtn) {
    heroBtn.style.background = target === 'hero' ? 'var(--accent)' : 'var(--bg2)';
    heroBtn.style.color = target === 'hero' ? 'white' : 'var(--text)';
  }
  if (logoBtn) {
    logoBtn.style.background = target === 'logo' ? 'var(--accent)' : 'var(--bg2)';
    logoBtn.style.color = target === 'logo' ? 'white' : 'var(--text)';
  }
}

function initGalleryGrid() {
  const grid = document.getElementById('wb-gallery-grid');
  if (!grid) return;

  grid.innerHTML = WEB_BUILDER_GALLERY_IMAGES.map(img => `
    <div onclick="selectFromGallery('${img}')" style="cursor:pointer;border-radius:8px;overflow:hidden;aspect-ratio:1;position:relative;border:2px solid transparent;transition:border-color 0.2s" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='transparent'">
      <img src="${img}" style="width:100%;height:100%;object-fit:cover" loading="lazy" onerror="this.parentElement.style.display='none'">
    </div>
  `).join('');
}

function selectFromGallery(imageUrl) {
  if (currentGalleryTarget === 'hero') {
    const heroEl = document.getElementById('wb-hero-image');
    if (heroEl) heroEl.value = imageUrl;
    if (typeof updateWbHeroPreview === 'function') updateWbHeroPreview();
  } else {
    const logoEl = document.getElementById('wb-logo');
    if (logoEl) logoEl.value = imageUrl;
    if (typeof updateWbLogoPreview === 'function') updateWbLogoPreview();
  }
  updateWebBuilderPreview();
  toast('Billede valgt!', 'success');
}

// Collect form data into config object
function collectWebBuilderFormData() {
  const config = { ...defaultWebBuilderConfig };

  // Branding
  const logoUrl = document.getElementById('wb-logo')?.value || '';
  config.branding = {
    name: document.getElementById('wb-name')?.value || '',
    shortName: document.getElementById('wb-short-name')?.value || '',
    slogan: document.getElementById('wb-slogan')?.value || '',
    description: document.getElementById('wb-description')?.value || '',
    logo: {
      url: logoUrl,
      darkUrl: logoUrl
    },
    colors: {
      primary: document.getElementById('wb-color-primary')?.value || '#D4380D',
      secondary: document.getElementById('wb-color-secondary')?.value || '#FFF7E6',
      accent: document.getElementById('wb-color-accent')?.value || '#FFA940',
      background: document.getElementById('wb-color-bg')?.value || '#FFFFFF',
      surface: document.getElementById('wb-color-surface')?.value || '#F5F5F5',
      text: document.getElementById('wb-color-text')?.value || '#1A1A1A',
      textMuted: document.getElementById('wb-color-muted')?.value || '#666666',
      success: document.getElementById('wb-color-success')?.value || '#52C41A',
      warning: document.getElementById('wb-color-warning')?.value || '#FAAD14',
      error: document.getElementById('wb-color-error')?.value || '#F5222D'
    },
    fonts: {
      heading: document.getElementById('wb-font-heading')?.value || 'Playfair Display',
      body: document.getElementById('wb-font-body')?.value || 'Inter'
    }
  };

  // Images
  config.images = {
    hero: document.getElementById('wb-hero-image')?.value || '',
    featured: document.getElementById('wb-featured-image')?.value || '',
    heroOverlay: {
      color: document.getElementById('wb-hero-overlay-color')?.value || '#000000',
      opacity: parseInt(document.getElementById('wb-hero-overlay-opacity')?.value || '40') / 100
    }
  };

  // Menu
  config.menu = {
    currency: document.getElementById('wb-currency')?.value || 'DKK',
    taxRate: parseInt(document.getElementById('wb-tax-rate')?.value) || 25
  };

  // Contact
  config.contact = {
    address: document.getElementById('wb-address')?.value || '',
    postalCode: document.getElementById('wb-postal')?.value || '',
    city: document.getElementById('wb-city')?.value || '',
    phone: document.getElementById('wb-phone')?.value || '',
    email: document.getElementById('wb-email')?.value || '',
    socialMedia: {
      facebook: document.getElementById('wb-facebook')?.value || '',
      instagram: document.getElementById('wb-instagram')?.value || '',
      tiktok: document.getElementById('wb-tiktok')?.value || ''
    }
  };

  // Business Hours
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  config.businessHours = {};
  days.forEach(day => {
    config.businessHours[day] = {
      open: document.getElementById('wb-hours-' + day + '-open')?.value || '11:00',
      close: document.getElementById('wb-hours-' + day + '-close')?.value || '22:00',
      closed: document.getElementById('wb-hours-' + day + '-closed')?.checked || false
    };
  });

  // Delivery
  config.delivery = {
    enabled: document.getElementById('wb-delivery-enabled')?.checked || false,
    fee: parseInt(document.getElementById('wb-delivery-fee')?.value) || 35,
    minimumOrder: parseInt(document.getElementById('wb-min-order')?.value) || 150,
    freeDeliveryThreshold: parseInt(document.getElementById('wb-free-delivery')?.value) || 300,
    estimatedTime: parseInt(document.getElementById('wb-delivery-time')?.value) || 45
  };

  // Features
  config.features = {
    ordering: document.getElementById('wb-feat-ordering')?.checked || false,
    loyalty: document.getElementById('wb-feat-loyalty')?.checked || false,
    pickup: document.getElementById('wb-feat-pickup')?.checked || false,
    delivery: document.getElementById('wb-feat-delivery')?.checked || false,
    customerAccounts: document.getElementById('wb-feat-accounts')?.checked || false,
    pushNotifications: document.getElementById('wb-feat-push')?.checked || false
  };

  return config;
}

// Save Web Builder config (per-template)
function saveWebBuilderConfig(section) {
  webBuilderConfig = collectWebBuilderFormData();
  const templateId = webBuilderConfig._templateId || document.getElementById('wb-template-selector')?.value || 'skabelon-1';
  const storageKey = 'orderflow_webbuilder_config_' + templateId;
  localStorage.setItem(storageKey, JSON.stringify(webBuilderConfig));
  // Keep generic key in sync for backwards compatibility
  localStorage.setItem('orderflow_webbuilder_config', JSON.stringify(webBuilderConfig));
  toast('Web Builder konfiguration gemt', 'success');
  updateWebBuilderPreview();

  // Broadcast to other tabs for cross-tab sync
  webBuilderChannel.postMessage({ type: 'webbuilder_update', config: webBuilderConfig });

  // Sync to Supabase in background
  if (window.SupabaseDB) {
    window.SupabaseDB.saveBuilderConfig('web_builder', webBuilderConfig)
      .then(result => {
        if (result.success) {
          console.log('✅ Web Builder config synced to Supabase');
        }
      })
      .catch(err => console.warn('⚠️ Supabase sync failed:', err));
  }

  // Send scroll-besked til preview for at vise den relevante sektion
  if (section) {
    const sectionMap = {
      'branding': 'hero',
      'farver': 'hero',
      'kontakt': 'ftco-appointment',
      'timer': 'ftco-intro',
      'blog': 'ftco-section',
      'levering': 'ftco-services',
      'social': 'ftco-footer'
    };
    const targetSection = sectionMap[section];
    if (targetSection) {
      sendScrollToSection(targetSection);
    }
  }

  // Vis "✓ Ændringer gemt" på alle aktive save-status spans
  document.querySelectorAll('.wb-save-status').forEach(status => {
    status.style.display = 'block';
    setTimeout(() => status.style.display = 'none', 3000);
  });
}

// Auto-save Web Builder changes with debounce
let webBuilderAutoSaveTimer = null;
webBuilderHasChanges = false;
let webBuilderIsSaving = false;
let webBuilderSaveCount = 0;

function autoSaveWebBuilder() {
  // Prevent re-entry during save
  if (webBuilderIsSaving) return;

  if (webBuilderAutoSaveTimer) clearTimeout(webBuilderAutoSaveTimer);
  webBuilderHasChanges = true;
  updateWebBuilderSaveStatus('saving');

  webBuilderAutoSaveTimer = setTimeout(() => {
    webBuilderIsSaving = true;

    // Get current config and save
    const config = collectWebBuilderFormData();

    // Save version every 5th save
    webBuilderSaveCount++;
    if (webBuilderSaveCount >= 5) {
      saveWebBuilderVersion();
      webBuilderSaveCount = 0;
    }

    // Broadcast to other tabs
    webBuilderChannel.postMessage({ type: 'webbuilder_update', config: config });

    // Sync to Supabase in background
    if (window.SupabaseDB) {
      window.SupabaseDB.saveBuilderConfig('web_builder', config)
        .then(result => {
          if (result.success) {
            console.log('✅ Web Builder config synced to Supabase');
          }
        })
        .catch(err => console.warn('⚠️ Supabase sync failed:', err));
    }

    webBuilderHasChanges = false;
    webBuilderIsSaving = false;
    updateWebBuilderSaveStatus('saved');
    console.log('🌐 Web Builder: Auto-saved changes');
  }, 2000);
}

function updateWebBuilderSaveStatus(status) {
  const statusEls = document.querySelectorAll('.wb-save-status');
  statusEls.forEach(el => {
    if (status === 'saving') {
      el.textContent = '⏳ Gemmer...';
      el.style.display = 'inline';
      el.style.color = 'var(--warning, #f59e0b)';
    } else if (status === 'saved') {
      el.textContent = '✓ Ændringer gemt';
      el.style.display = 'inline';
      el.style.color = 'var(--success, #22c55e)';
      setTimeout(() => { el.style.display = 'none'; }, 3000);
    }
  });
}

// Send scroll command to preview iframe
function sendScrollToSection(sectionId) {
  const frames = [
    document.getElementById('webbuilder-preview-frame'),
    document.getElementById('wb-fullscreen-preview-frame')
  ];
  frames.forEach(frame => {
    if (frame?.contentWindow) {
      try {
        frame.contentWindow.postMessage({
          type: 'SCROLL_TO_SECTION',
          sectionId: sectionId
        }, '*');
      } catch (err) {
        console.warn('Error sending scroll command:', err);
      }
    }
  });
}

// Update Web Builder preview
function updateWebBuilderPreview(options) {
  const config = collectWebBuilderFormData();
  sendConfigToWebBuilderPreview(config);

  // Save to localStorage immediately (for preview sync)
  localStorage.setItem('orderflow_webbuilder_config', JSON.stringify(config));

  // Mark unsaved changes (no auto-save — user must click Gem)
  // Skip when called from page navigation or template loading
  if (!options || !options.skipUnsaved) {
    webBuilderHasChanges = true;
    updateWebBuilderSaveStatus('unsaved');
  }

  // Also update inline preview elements with the restaurant name
  const nameValue = document.getElementById('wb-name')?.value || 'Pizzeria Roma';
  const previewNameElements = [
    'wb-logo-preview-name',
    'wb-hero-preview-name'
  ];
  previewNameElements.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = nameValue;
  });
}

// Send config to preview iframe
function sendConfigToWebBuilderPreview(config) {
  // Collect all preview frames (by ID and by class)
  const frames = [];

  // Add frames by ID
  const frameIds = ['webbuilder-preview-frame', 'wb-fullscreen-preview-frame'];
  frameIds.forEach(id => {
    const frame = document.getElementById(id);
    if (frame) frames.push(frame);
  });

  // Add frames by class (for embedded previews in Web Builder pages)
  document.querySelectorAll('.webbuilder-preview-frame').forEach(frame => {
    if (!frames.includes(frame)) frames.push(frame);
  });

  // Send config to all found frames
  frames.forEach(frame => {
    if (frame?.contentWindow) {
      try {
        frame.contentWindow.postMessage({
          type: 'UPDATE_RESTAURANT_CONFIG',
          config: config
        }, '*');
      } catch (err) {
        console.warn('Error sending config to preview frame:', err);
      }
    }
  });
}

// Initialize Web Builder preview with retry mechanism
function initWebBuilderPreview() {
  loadWebBuilderConfig();

  // Retry mechanism to ensure iframe is ready
  let retries = 0;
  const maxRetries = 10;
  const retryDelay = 300;

  const sendInitialConfig = () => {
    const frames = document.querySelectorAll('#webbuilder-preview-frame, .webbuilder-preview-frame');
    let hasReadyFrame = false;

    frames.forEach(frame => {
      if (frame && frame.contentWindow) {
        try {
          updateWebBuilderPreview();
          hasReadyFrame = true;
        } catch (e) {
          console.warn('Preview frame not ready, retrying...', e);
        }
      }
    });

    if (!hasReadyFrame && retries < maxRetries) {
      retries++;
      setTimeout(sendInitialConfig, retryDelay);
    }
  };

  // Initial delay to let iframe start loading
  setTimeout(sendInitialConfig, 500);
}

// Open the full website in a new tab - dynamic based on selected template
function openFullWebsite() {
  const selector = document.getElementById('wb-template-selector');
  const templateId = selector?.value || 'skabelon-1';
  const template = webBuilderTemplates[templateId];
  const websiteUrl = template?.previewFile || './demos/pwa-preview-mario.html';
  window.open(websiteUrl, '_blank');
}

// Open Web Builder preview in fullscreen modal with device selector
function openWebBuilderPreviewFullscreen() {
  // Get active template preview file
  const selector = document.getElementById('wb-template-selector');
  const templateId = selector?.value || 'skabelon-1';
  const template = webBuilderTemplates[templateId];
  const override = getTemplateOverride(templateId);
  const baseHref = getTemplateBaseHref(template);
  const overrideHtml = override ? injectBaseTag(override, baseHref) : null;
  const previewSrc = overrideHtml ? 'about:blank' : (template?.previewFile || './Website%20builder/dist/index.html');

  // Check if modal already exists
  let modal = document.getElementById('wb-preview-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'wb-preview-modal';
    modal.className = 'modal-overlay';
    modal.style.cssText = 'display:flex;align-items:center;justify-content:center;z-index:10000';
    modal.innerHTML = `
      <div class="modal" style="width:95vw;max-width:1400px;height:90vh;display:flex;flex-direction:column;padding:0;overflow:hidden">
        <div class="modal-header" style="flex-shrink:0;display:flex;justify-content:space-between;align-items:center;padding:16px 24px;border-bottom:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:16px">
            <h3 style="margin:0;font-size:16px">Forhåndsvisning</h3>
            <div class="wb-device-selector" style="display:flex;gap:4px;background:var(--bg2);border-radius:8px;padding:4px">
              <button class="wb-device-btn active" data-device="mobile" onclick="setWbPreviewDevice('mobile')" style="padding:8px 16px;border:none;background:var(--bg1);border-radius:6px;cursor:pointer;font-size:13px;font-weight:500">Mobil</button>
              <button class="wb-device-btn" data-device="tablet" onclick="setWbPreviewDevice('tablet')" style="padding:8px 16px;border:none;background:transparent;border-radius:6px;cursor:pointer;font-size:13px">Tablet</button>
              <button class="wb-device-btn" data-device="desktop" onclick="setWbPreviewDevice('desktop')" style="padding:8px 16px;border:none;background:transparent;border-radius:6px;cursor:pointer;font-size:13px">Desktop</button>
            </div>
          </div>
          <button class="modal-close" onclick="closeWbPreviewModal()" style="font-size:24px;background:none;border:none;cursor:pointer;color:var(--text)">&times;</button>
        </div>
        <div class="modal-body" style="flex:1;display:flex;align-items:center;justify-content:center;background:var(--bg2);padding:24px;overflow:auto">
          <div id="wb-preview-device-frame" class="wb-device-frame mobile" style="background:#000;border-radius:32px;padding:12px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);transition:all 0.3s ease">
            <iframe
              id="wb-fullscreen-preview-frame"
              src="${previewSrc}"
              style="width:100%;height:100%;border:none;border-radius:20px;background:#fff"
              onload="initFullscreenPreview()"
            ></iframe>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Add styles for device frames
    if (!document.getElementById('wb-device-styles')) {
      const style = document.createElement('style');
      style.id = 'wb-device-styles';
      style.textContent = `
        .wb-device-frame.mobile { width: 375px; height: 667px; }
        .wb-device-frame.tablet { width: 768px; height: 600px; border-radius: 24px; }
        .wb-device-frame.desktop { width: 100%; max-width: 1200px; height: 100%; border-radius: 12px; padding: 8px; }
        .wb-device-btn.active { background: var(--bg1) !important; font-weight: 500 !important; }
        .wb-device-btn:hover:not(.active) { background: rgba(255,255,255,0.5) !important; }
      `;
      document.head.appendChild(style);
    }
  }

  modal.style.display = 'flex';

  const fullscreenFrame = document.getElementById('wb-fullscreen-preview-frame');
  if (fullscreenFrame) {
    if (overrideHtml) {
      fullscreenFrame.src = 'about:blank';
      fullscreenFrame.srcdoc = overrideHtml;
    } else {
      if (fullscreenFrame.hasAttribute('srcdoc')) fullscreenFrame.removeAttribute('srcdoc');
      if (fullscreenFrame.src !== previewSrc) fullscreenFrame.src = previewSrc;
    }
  }

  // Add click-outside handler to close modal
  modal.onclick = (e) => {
    if (e.target === modal) {
      closeWbPreviewModal();
    }
  };

  // Initialize preview after a short delay
  setTimeout(() => {
    initFullscreenPreview();
  }, 100);
}

// Set preview device size
function setWbPreviewDevice(device) {
  const frame = document.getElementById('wb-preview-device-frame');
  if (!frame) return;

  frame.className = 'wb-device-frame ' + device;

  // Update buttons
  document.querySelectorAll('.wb-device-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.style.background = 'transparent';
    btn.style.fontWeight = 'normal';
  });
  const activeBtn = document.querySelector(`.wb-device-btn[data-device="${device}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.style.background = 'var(--bg1)';
    activeBtn.style.fontWeight = '500';
  }
}

// Close preview modal
function closeWbPreviewModal() {
  const modal = document.getElementById('wb-preview-modal');
  if (modal) modal.style.display = 'none';
}

// Initialize fullscreen preview with retry mechanism
function initFullscreenPreview() {
  let retries = 0;
  const maxRetries = 5;
  const tryUpdate = () => {
    const iframe = document.getElementById('wb-fullscreen-preview-frame');
    if (iframe && iframe.contentWindow) {
      // Send current config to preview
      updateWebBuilderPreview();
    } else if (retries < maxRetries) {
      retries++;
      setTimeout(tryUpdate, 200);
    }
  };
  tryUpdate();
}

// Listen for messages from Web Builder preview
window.addEventListener('message', (event) => {
  if (event.data?.type === 'WEBBUILDER_READY') {
    updateWebBuilderPreview();
  }
});

// Update Logo preview when URL changes
function updateWbLogoPreview() {
  const logoUrl = document.getElementById('wb-logo')?.value || '';
  const previewImg = document.getElementById('wb-logo-preview');
  const previewCircle = document.getElementById('wb-logo-preview-circle');
  const brandingPreview = document.getElementById('wb-branding-logo-preview');
  const placeholder = document.getElementById('wb-logo-placeholder');
  const circlePlaceholder = document.getElementById('wb-logo-preview-circle-placeholder');
  const removeBtn = document.getElementById('wb-logo-remove-btn');
  const uploadArea = document.getElementById('wb-logo-upload-area');

  if (logoUrl && logoUrl.trim() !== '') {
    if (previewImg) {
      previewImg.src = logoUrl;
      previewImg.style.display = 'block';
    }
    if (previewCircle) {
      previewCircle.src = logoUrl;
      previewCircle.style.display = 'block';
    }
    if (brandingPreview) {
      brandingPreview.src = logoUrl;
      brandingPreview.style.display = 'block';
    }
    if (placeholder) placeholder.style.display = 'none';
    if (circlePlaceholder) circlePlaceholder.style.display = 'none';
    if (removeBtn) removeBtn.style.display = 'block';
    if (uploadArea) uploadArea.style.border = '2px solid var(--primary)';
  } else {
    if (previewImg) {
      previewImg.src = '';
      previewImg.style.display = 'none';
    }
    if (previewCircle) {
      previewCircle.src = '';
      previewCircle.style.display = 'none';
    }
    if (brandingPreview) {
      brandingPreview.src = '';
      brandingPreview.style.display = 'none';
    }
    if (placeholder) placeholder.style.display = 'flex';
    if (circlePlaceholder) circlePlaceholder.style.display = 'block';
    if (removeBtn) removeBtn.style.display = 'none';
    if (uploadArea) uploadArea.style.border = '2px dashed var(--border)';
  }

  // Update the restaurant name in preview
  const nameInput = document.getElementById('wb-name');
  const previewName = document.getElementById('wb-logo-preview-name');
  if (nameInput && previewName) {
    previewName.textContent = nameInput.value || 'Pizzeria Roma';
  }

  updateWebBuilderPreview();
}

// Clear Logo
function clearWbLogo() {
  const logoInput = document.getElementById('wb-logo');
  const fileInput = document.getElementById('wb-logo-file-input');
  if (logoInput) {
    logoInput.value = '';
    updateWbLogoPreview();
  }
  if (fileInput) {
    fileInput.value = '';
  }
}

// Handle logo file upload from file input
function handleLogoFileUpload(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    processLogoFile(file);
  }
}

// Handle logo file drop
function handleLogoFileDrop(event) {
  const files = event.dataTransfer.files;
  if (files && files[0]) {
    const file = files[0];
    // Check if it's an accepted image type
    const acceptedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (acceptedTypes.includes(file.type) || file.name.match(/\.(png|jpg|jpeg|svg)$/i)) {
      processLogoFile(file);
    } else {
      toast('Understøtter kun PNG, JPG og SVG billeder', 'error');
    }
  }
}

// Process the logo file and convert to data URL
function processLogoFile(file) {
  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast('Filen er for stor. Maks 5MB', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    const logoInput = document.getElementById('wb-logo');
    if (logoInput) {
      logoInput.value = dataUrl;
      updateWbLogoPreview();
      toast('Logo uploadet!', 'success');
    }
  };
  reader.onerror = function() {
    toast('Kunne ikke læse filen', 'error');
  };
  reader.readAsDataURL(file);
}

// Update Hero preview when URL changes
function updateWbHeroPreview() {
  const heroUrl = document.getElementById('wb-hero-image')?.value || '';
  const previewImg = document.getElementById('wb-hero-preview');
  const previewDemo = document.getElementById('wb-hero-preview-demo');
  const placeholder = document.getElementById('wb-hero-placeholder');
  const demoPlaceholder = document.getElementById('wb-hero-preview-demo-placeholder');
  const removeBtn = document.getElementById('wb-hero-remove-btn');
  const uploadArea = document.getElementById('wb-hero-upload-area');

  if (heroUrl && heroUrl.trim() !== '') {
    if (previewImg) previewImg.src = heroUrl;
    if (previewDemo) previewDemo.src = heroUrl;
    if (removeBtn) removeBtn.style.display = 'block';
  } else {
    if (previewImg) {
      previewImg.src = '';
      previewImg.style.display = 'none';
    }
    if (previewDemo) {
      previewDemo.src = '';
      previewDemo.style.display = 'none';
    }
    if (placeholder) placeholder.style.display = 'flex';
    if (demoPlaceholder) demoPlaceholder.style.display = 'flex';
    if (removeBtn) removeBtn.style.display = 'none';
    if (uploadArea) uploadArea.style.border = '2px dashed var(--border)';
  }

  // Update the restaurant name in preview
  const nameInput = document.getElementById('wb-name');
  const previewName = document.getElementById('wb-hero-preview-name');
  if (nameInput && previewName) {
    previewName.textContent = nameInput.value || 'Pizzeria Roma';
  }

  updateWebBuilderPreview();
}

// Clear Hero
function clearWbHero() {
  const heroInput = document.getElementById('wb-hero-image');
  if (heroInput) {
    heroInput.value = '';
    updateWbHeroPreview();
  }
}

// Initialize Billeder previews on page load
function initBillederPreviews() {
  updateWbLogoPreview();
  updateWbHeroPreview();
}

// =====================================================
// COOKIE SAMTYKKE SETTINGS
// =====================================================

// Load cookie consent settings from localStorage
function loadCookieSettings() {
  const savedSettings = localStorage.getItem('cookieConsentSettings');
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);

    // Display style
    const displayStyle = settings.displayStyle || 'banner';
    const styleBanner = document.getElementById('style-banner');
    const stylePopup = document.getElementById('style-popup');
    if (styleBanner) styleBanner.checked = displayStyle === 'banner';
    if (stylePopup) stylePopup.checked = displayStyle === 'popup';

    // Show/hide popup settings based on display style
    updatePopupSettingsVisibility(displayStyle);

    // Popup settings
    if (settings.popupSettings) {
      const companyName = document.getElementById('popup-company-name');
      const logoUrl = document.getElementById('popup-logo-url');
      const showAbout = document.getElementById('popup-show-about');
      if (companyName) companyName.value = settings.popupSettings.companyName || '';
      if (logoUrl) logoUrl.value = settings.popupSettings.logoUrl || '';
      if (showAbout) showAbout.checked = settings.popupSettings.showAboutTab !== false;
    }

    // Banner texts
    const bannerTitle = document.getElementById('cookie-banner-title');
    const bannerDesc = document.getElementById('cookie-banner-desc');
    if (bannerTitle) bannerTitle.value = settings.bannerTitle || 'Vi bruger cookies';
    if (bannerDesc) bannerDesc.value = settings.bannerDesc || '';

    // Button texts
    const btnAccept = document.getElementById('cookie-btn-accept');
    const btnReject = document.getElementById('cookie-btn-reject');
    const btnSave = document.getElementById('cookie-btn-save');
    if (btnAccept) btnAccept.value = settings.btnAccept || 'Accepter alle';
    if (btnReject) btnReject.value = settings.btnReject || 'Kun nødvendige';
    if (btnSave) btnSave.value = settings.btnSave || 'Gem mine valg';

    // Toggle settings
    const bannerActive = document.getElementById('cookie-banner-active');
    const showDetails = document.getElementById('cookie-show-details');
    if (bannerActive) bannerActive.checked = settings.bannerActive !== false;
    if (showDetails) showDetails.checked = settings.showDetails !== false;
  }

  // Load privacy modal settings
  const savedPrivacySettings = localStorage.getItem('privacyModalSettings');
  if (savedPrivacySettings) {
    const privacySettings = JSON.parse(savedPrivacySettings);
    const privacyModalActive = document.getElementById('privacy-modal-active');
    if (privacyModalActive) privacyModalActive.checked = privacySettings.enabled !== false;
  }

  // Load and render privacy categories
  renderPrivacyCategories();

  // Setup display style change listener
  setupDisplayStyleListener();
}

// Update popup settings visibility based on display style
function updatePopupSettingsVisibility(style) {
  const popupSettingsCard = document.getElementById('popup-settings-card');
  if (popupSettingsCard) {
    popupSettingsCard.style.display = style === 'popup' ? 'block' : 'none';
  }

  // Update visual selection on options
  document.querySelectorAll('.display-style-option').forEach(option => {
    if (option.dataset.style === style) {
      option.style.borderColor = 'var(--accent)';
      option.style.background = 'rgba(45, 212, 191, 0.05)';
    } else {
      option.style.borderColor = 'var(--border)';
      option.style.background = 'transparent';
    }
  });
}

// Setup event listener for display style radio buttons
function setupDisplayStyleListener() {
  const radios = document.querySelectorAll('input[name="cookie-display-style"]');
  radios.forEach(radio => {
    radio.addEventListener('change', function() {
      updatePopupSettingsVisibility(this.value);
    });
  });
}

// Save cookie consent settings to localStorage
function saveCookieSettings() {
  // Get selected display style
  const displayStyle = document.querySelector('input[name="cookie-display-style"]:checked')?.value || 'banner';

  const settings = {
    // Display style
    displayStyle: displayStyle,

    // Popup settings
    popupSettings: {
      companyName: document.getElementById('popup-company-name')?.value || '',
      logoUrl: document.getElementById('popup-logo-url')?.value || '',
      showAboutTab: document.getElementById('popup-show-about')?.checked !== false
    },

    // Banner texts
    bannerTitle: document.getElementById('cookie-banner-title')?.value || 'Vi bruger cookies',
    bannerDesc: document.getElementById('cookie-banner-desc')?.value || '',

    // Button texts
    btnAccept: document.getElementById('cookie-btn-accept')?.value || 'Accepter alle',
    btnReject: document.getElementById('cookie-btn-reject')?.value || 'Kun nødvendige',
    btnSave: document.getElementById('cookie-btn-save')?.value || 'Gem mine valg',

    // Toggle settings
    bannerActive: document.getElementById('cookie-banner-active')?.checked !== false,
    showDetails: document.getElementById('cookie-show-details')?.checked !== false,

    // Metadata
    lastUpdated: new Date().toISOString()
  };

  // Privacy modal settings
  const privacyModalSettings = {
    enabled: document.getElementById('privacy-modal-active')?.checked !== false,
    lastUpdated: new Date().toISOString()
  };

  localStorage.setItem('cookieConsentSettings', JSON.stringify(settings));
  localStorage.setItem('privacyModalSettings', JSON.stringify(privacyModalSettings));

  // Show success message
  const statusEl = document.getElementById('cookie-save-status');
  if (statusEl) {
    statusEl.style.display = 'inline';
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  }

  toast('Cookie indstillinger gemt', 'success');

  // Also save privacy categories
  savePrivacyCategories();
}

// =====================================================
// PRIVACY CATEGORIES MANAGEMENT
// =====================================================

// Default privacy categories (GDPR compliant)
const DEFAULT_PRIVACY_CATEGORIES = [
  {
    id: 'necessary',
    name: 'Nødvendige',
    description: 'Disse cookies er nødvendige for at hjemmesiden kan fungere korrekt. De sikrer grundlæggende funktioner som sidenavigation og adgang til sikre områder.',
    required: true,
    gdprBasis: 'legitimate_interest',
    order: 0
  },
  {
    id: 'functional',
    name: 'Funktionelle',
    description: 'Disse cookies gør det muligt at huske dine præferencer og tilpasse hjemmesiden til dig, f.eks. sprogvalg og region.',
    required: false,
    gdprBasis: 'consent',
    order: 1
  },
  {
    id: 'analytics',
    name: 'Statistik',
    description: 'Disse cookies hjælper os med at forstå, hvordan besøgende bruger vores hjemmeside ved at indsamle anonyme statistikker.',
    required: false,
    gdprBasis: 'consent',
    order: 2
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Disse cookies bruges til at vise dig relevante annoncer baseret på dine interesser på tværs af hjemmesider.',
    required: false,
    gdprBasis: 'consent',
    order: 3
  }
];

// GDPR basis options
const GDPR_BASIS_OPTIONS = {
  'consent': 'Samtykke (GDPR Art. 6(1)(a))',
  'legitimate_interest': 'Legitim interesse (GDPR Art. 6(1)(f))',
  'contract': 'Kontraktopfyldelse (GDPR Art. 6(1)(b))',
  'legal_obligation': 'Retlig forpligtelse (GDPR Art. 6(1)(c))'
};

// Get privacy categories from localStorage or return defaults
function getPrivacyCategories() {
  const saved = localStorage.getItem('privacyCategories');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Error parsing privacy categories:', e);
    }
  }
  return DEFAULT_PRIVACY_CATEGORIES;
}

// Save privacy categories to localStorage
function savePrivacyCategories() {
  const categories = collectCategoriesFromUI();
  localStorage.setItem('privacyCategories', JSON.stringify(categories));
}

// Collect categories from the UI form
function collectCategoriesFromUI() {
  const container = document.getElementById('privacy-categories-list');
  if (!container) return getPrivacyCategories();

  const categoryElements = container.querySelectorAll('[data-category-id]');
  const categories = [];

  categoryElements.forEach((el, index) => {
    const id = el.dataset.categoryId;
    const nameInput = el.querySelector(`[data-field="name"]`);
    const descInput = el.querySelector(`[data-field="description"]`);
    const requiredInput = el.querySelector(`[data-field="required"]`);
    const gdprSelect = el.querySelector(`[data-field="gdprBasis"]`);

    categories.push({
      id: id,
      name: nameInput?.value || 'Ny kategori',
      description: descInput?.value || '',
      required: requiredInput?.checked || false,
      gdprBasis: gdprSelect?.value || 'consent',
      order: index
    });
  });

  return categories.length > 0 ? categories : getPrivacyCategories();
}

// Render privacy categories in the admin UI
function renderPrivacyCategories() {
  const container = document.getElementById('privacy-categories-list');
  if (!container) return;

  const categories = getPrivacyCategories();

  container.innerHTML = categories.map((cat, index) => `
    <div class="privacy-category-item" data-category-id="${cat.id}" style="background:var(--bg2);border-radius:12px;padding:16px;border:1px solid var(--border)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:8px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2" style="cursor:grab">
            <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
            <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
          </svg>
          <span style="font-weight:600;font-size:14px">${cat.name}</span>
          ${cat.required ? '<span style="font-size:10px;background:var(--accent);color:white;padding:2px 6px;border-radius:4px;margin-left:4px">Obligatorisk</span>' : ''}
        </div>
        ${cat.id !== 'necessary' ? `
          <button onclick="deletePrivacyCategory('${cat.id}')" style="background:none;border:none;cursor:pointer;color:var(--danger);padding:4px" title="Slet kategori">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        ` : ''}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group" style="margin:0">
          <label class="form-label" style="font-size:11px">Navn</label>
          <input type="text" class="input" data-field="name" value="${cat.name}" style="font-size:13px" ${cat.id === 'necessary' ? '' : ''}>
        </div>

        <div class="form-group" style="margin:0">
          <label class="form-label" style="font-size:11px">GDPR Grundlag</label>
          <select class="input" data-field="gdprBasis" style="font-size:13px">
            ${Object.entries(GDPR_BASIS_OPTIONS).map(([value, label]) =>
              `<option value="${value}" ${cat.gdprBasis === value ? 'selected' : ''}>${label}</option>`
            ).join('')}
          </select>
        </div>
      </div>

      <div class="form-group" style="margin:12px 0 0 0">
        <label class="form-label" style="font-size:11px">Beskrivelse</label>
        <textarea class="input" data-field="description" rows="2" style="font-size:13px">${cat.description}</textarea>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
        <div style="font-size:12px;color:var(--muted)">
          ${cat.required ? 'Brugere kan ikke deaktivere denne kategori' : 'Brugere kan vælge at deaktivere'}
        </div>
        <label class="toggle" style="transform:scale(0.85)">
          <input type="checkbox" data-field="required" ${cat.required ? 'checked' : ''} ${cat.id === 'necessary' ? 'disabled' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>
  `).join('');
}

// Add a new privacy category
function addPrivacyCategory() {
  const categories = getPrivacyCategories();
  const newId = 'custom_' + Date.now();

  categories.push({
    id: newId,
    name: 'Ny kategori',
    description: 'Beskriv hvad denne cookie-kategori bruges til...',
    required: false,
    gdprBasis: 'consent',
    order: categories.length
  });

  localStorage.setItem('privacyCategories', JSON.stringify(categories));
  renderPrivacyCategories();
  toast('Ny kategori tilføjet', 'success');
}

// Delete a privacy category
function deletePrivacyCategory(categoryId) {
  if (categoryId === 'necessary') {
    toast('Nødvendige cookies kan ikke slettes', 'error');
    return;
  }

  if (!confirm('Er du sikker på at du vil slette denne kategori?')) return;

  // First save current UI state
  const categories = collectCategoriesFromUI();
  const filtered = categories.filter(c => c.id !== categoryId);

  localStorage.setItem('privacyCategories', JSON.stringify(filtered));
  renderPrivacyCategories();
  toast('Kategori slettet', 'success');
}

// ============================================
// LANDING PAGE CMS
// ============================================

// Default Landing Page Configuration
const defaultLandingPageConfig = {
  hero: {
    videoUrl: 'https://videos.pexels.com/video-files/5529601/5529601-uhd_1440_2732_25fps.mp4',
    headline: 'Din restaurant, din app',
    subheadline: 'OrderFlow giver dig en fuldt tilpasset mobil app og hjemmeside – uden de høje provisioner fra tredjepartsplatforme.',
    rotatingWords: ['designet', 'udviklet', 'optimeret'],
    primaryButton: { text: 'Kom i gang gratis', url: '/priser.html' },
    secondaryButton: { text: 'Se hvordan det virker', url: '/how-it-works.html' }
  },
  tabs: [
    { id: 'tab1', number: '1', label: 'Online bestilling', heading: 'Online Bestilling', description: 'Modtag ordrer direkte fra din egen hjemmeside og app – helt uden provision.', imageUrl: 'images/apple-iphone-16-pro-max-2024-medium.png', backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 'tab2', number: '2', label: 'Mobilapp', heading: 'Din Egen App', description: 'En branded app i din kundes lomme – push-notifikationer, loyalitetsprogram og mere.', imageUrl: 'images/apple-iphone-16-pro-max-2024-medium.png', backgroundGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { id: 'tab3', number: '3', label: 'Hjemmeside', heading: 'Smuk Hjemmeside', description: 'En moderne, mobilvenlig hjemmeside der konverterer besøgende til kunder.', imageUrl: 'images/apple-iphone-16-pro-max-2024-medium.png', backgroundGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { id: 'tab4', number: '4', label: 'Marketing', heading: 'Smart Marketing', description: 'Automatiserede kampagner, SMS og email marketing – alt samlet ét sted.', imageUrl: 'images/apple-iphone-16-pro-max-2024-medium.png', backgroundGradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }
  ],
  trusted: {
    heading: 'Betroet af 500+ restauranter i Danmark',
    cards: [
      { id: 'c1', imageUrl: 'images/restaurant1.jpg', name: 'Bella Italia', role: 'København', backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
      { id: 'c2', imageUrl: 'images/restaurant2.jpg', name: 'Sushi House', role: 'Aarhus', backgroundGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }
    ]
  },
  appleFeatures: {
    heading: 'Alt du behøver til at drive din restaurant online',
    subheading: 'Fra online bestilling til marketing automatisering – OrderFlow samler alle dine værktøjer ét sted.',
    features: [
      { id: 'f1', badge: 'Bestilling', title: 'Direkte ordrer', description: '0% provision på alle ordrer' },
      { id: 'f2', badge: 'App', title: 'Branded app', description: 'Din egen app i App Store' },
      { id: 'f3', badge: 'Web', title: 'Hjemmeside', description: 'Moderne og hurtig' },
      { id: 'f4', badge: 'Marketing', title: 'Automatisering', description: 'SMS og email kampagner' },
      { id: 'f5', badge: 'Loyalty', title: 'Kundeloyalitet', description: 'Beløn dine gæster' },
      { id: 'f6', badge: 'Analytics', title: 'Indsigt', description: 'Data om dine kunder' }
    ]
  },
  bento: {
    heading: 'Gå i dybden med vores løsninger',
    cards: [
      { id: 'b1', label: 'ONLINE BESTILLING', title: 'Modtag ordrer direkte – uden provision', imageUrl: 'images/bento1.jpg', url: '/online-bestilling.html' },
      { id: 'b2', label: 'MOBIL APP', title: 'Din egen app til iOS og Android', imageUrl: 'images/bento2.jpg', url: '/restaurant-mobile-app.html' }
    ]
  },
  beliefs: {
    mainTitle: 'Why Flow?',
    subtitle: 'Et budskab fra vores grundlægger',
    author: { imageUrl: 'images/founder.jpg', name: 'Martin Sarvio', role: 'CEO & Founder' },
    beliefs: [
      { id: 'bl1', heading: 'Ingen provisioner', text: 'Vi tror på, at restauranter bør beholde deres fortjeneste – ikke betale 30% til tredjeparter.' },
      { id: 'bl2', heading: 'Eget brand', text: 'Din restaurant, din app, din hjemmeside – ikke skjult bag andres logo.' },
      { id: 'bl3', heading: 'Fuld kontrol', text: 'Du ejer dine kundedata og kan markedsføre direkte til dem.' }
    ]
  },
  testimonials: [
    { id: 't1', quote: 'OrderFlow har transformeret vores online forretning. Vi sparer tusindvis hver måned på provisioner.', avatarUrl: 'images/avatar1.jpg', name: 'Lars Jensen', role: 'Bella Italia, København' },
    { id: 't2', quote: 'Vores kunder elsker appen. Push-notifikationer har øget vores genbestillinger med 40%.', avatarUrl: 'images/avatar2.jpg', name: 'Maria Hansen', role: 'Sushi House, Aarhus' }
  ],
  footer: {
    supportSection: { phone: '+45 70 70 70 70', email: 'support@orderflow.dk', logoUrl: 'images/logo.png' },
    bottomSection: { copyright: '© 2024 OrderFlow. Alle rettigheder forbeholdes.' },
    columns: [
      { id: 'col1', heading: 'Produkt', links: [{ id: 'l1', text: 'Online Bestilling', url: '/online-bestilling.html' }, { id: 'l2', text: 'Mobil App', url: '/restaurant-mobile-app.html' }] },
      { id: 'col2', heading: 'Ressourcer', links: [{ id: 'l3', text: 'Priser', url: '/priser.html' }, { id: 'l4', text: 'Kom i gang', url: '/how-it-works.html' }] }
    ]
  }
};

// Landing Page Config - loaded from localStorage or defaults
let landingPageConfig = null;

// Load Landing Page config
