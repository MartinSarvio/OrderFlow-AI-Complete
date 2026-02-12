// FLOW Settings Module — settings, notifications, users, roles

function switchSettingsTab(tab) {
  // Tab name to display title mapping
  const tabTitles = {
    'ailearning': 'Læring',
    'users': 'Brugerindstillinger',
    'roles': 'Roller',
    'moms': 'Moms',
    'sprog': 'Sprog',
    'billing': 'Abonnement',
    'notifications': 'Notifikationer',
    'passwords': 'Adgangskoder',
    'support': 'Support',
    'maintenance': 'Systemvedligeholdelse',
    'cookies': 'Cookie Samtykke',
    'templates': 'Skabeloner',
    'domains': 'Custom Domains',
    'bank': 'Bank',
    'printer': 'Printer'
  };
  
  // Update dynamic page title
  const titleEl = document.getElementById('settings-page-title');
  if (titleEl) {
    titleEl.textContent = tabTitles[tab] || 'Indstillinger';
  }
  
  // Update tab content
  document.querySelectorAll('.settings-tab-content').forEach(c => c.classList.remove('active'));
  const contentEl = document.getElementById('settings-content-' + tab);
  if (contentEl) contentEl.classList.add('active');
  
  // SYNC: Highlight corresponding sidebar item
  syncSidebarSettingsItem(tab);

  // Dev page-ID badge for settings tabs
  showPageIdBadge('settings > settings-content-' + tab);

  // Load AI learning stats when that tab is opened
  if (tab === 'ailearning') {
    refreshAILearningStats();
  }
  
  // Load subscription plans config when billing tab is opened
  if (tab === 'billing') {
    renderSubscriptionPlansConfig();
  }

  // Load custom domains when domains tab is opened
  if (tab === 'domains') {
    loadCustomDomains();
  }

  // Initialize notification settings when notifications tab is opened
  if (tab === 'notifications') {
    initNotificationEmailField();
  }

  // Load session timeout setting when users tab is opened
  if (tab === 'users') {
    loadSessionTimeoutSetting();
  }

  // Initialize 2FA settings when password tab is opened
  if (tab === 'passwords') {
    init2FASettings();
  }

  // Initialize demo data status when maintenance tab is opened
  if (tab === 'maintenance') {
    initDemoDataStatus();
  }

  // Load trusted devices when users tab is opened
  if (tab === 'users') {
    loadTrustedDevices();
  }

  // Load roles when roles tab is opened
  if (tab === 'roles') {
    loadRolesPage();
  }

  // Load cookie consent settings when cookies tab is opened
  if (tab === 'cookies') {
    loadCookieSettings();
  }

  // Load maintenance diagnostics when maintenance tab is opened
  if (tab === 'maintenance') {
    refreshMaintenanceDiagnostics();
  }

  // Load templates when templates tab is opened
  if (tab === 'templates') {
    renderInstalledTemplates();
  }

  // Load printer settings when printer tab is opened
  if (tab === 'printer') {
    loadPrinterSettingsUI();
  }
}

// Sync sidebar highlight with settings tab
function syncSidebarSettingsItem(tab) {
  // Clear all sidebar nav-dropdown-item active states under indstillinger
  document.querySelectorAll('#nav-indstillinger .nav-dropdown-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Find and highlight the matching sidebar item
  const sidebarItems = document.querySelectorAll('#nav-indstillinger .nav-dropdown-item');
  sidebarItems.forEach(item => {
    const onclick = item.getAttribute('onclick');
    if (onclick && onclick.includes(`showSettingsPage('${tab}')`)) {
      item.classList.add('active');
    }
  });
}

// Refresh AI Learning Stats in dashboard
function refreshAILearningStats() {
  const stats = getAILearningStats();
  
  // Update stat cards
  document.getElementById('ai-stat-total').textContent = stats.total;
  document.getElementById('ai-stat-handled').textContent = stats.handledRate + '%';
  document.getElementById('ai-stat-review').textContent = stats.needsReview;
  
  // Sentiment display
  const sentimentEl = document.getElementById('ai-stat-sentiment');
  if (stats.total > 0) {
    const posPercent = Math.round((stats.sentimentBreakdown.positive / stats.total) * 100);
    const negPercent = Math.round((stats.sentimentBreakdown.negative / stats.total) * 100);
    if (posPercent > negPercent) {
      sentimentEl.textContent = '😊 ' + posPercent + '%';
      sentimentEl.style.color = 'var(--green)';
    } else if (negPercent > posPercent) {
      sentimentEl.textContent = '😟 ' + negPercent + '%';
      sentimentEl.style.color = 'var(--danger)';
    } else {
      sentimentEl.textContent = '😐 Neutral';
      sentimentEl.style.color = 'var(--muted)';
    }
  } else {
    sentimentEl.textContent = '-';
    sentimentEl.style.color = 'var(--muted)';
  }
  
  // Render unhandled list
  const listEl = document.getElementById('ai-unhandled-list');
  if (stats.recentUnhandled.length > 0) {
    listEl.innerHTML = stats.recentUnhandled.map(entry => `
      <div style="padding:10px;background:var(--bg3);border-radius:var(--radius-sm);margin-bottom:8px;border-left:3px solid ${entry.sentiment === 'negative' ? 'var(--danger)' : 'var(--orange)'}">
        <div style="font-size:12px;color:var(--text);margin-bottom:4px">"${escapeHtml(entry.message?.substring(0, 80))}${entry.message?.length > 80 ? '...' : ''}"</div>
        <div style="display:flex;gap:8px;font-size:10px;color:var(--muted)">
          <span>${entry.classification?.category || 'UNKNOWN'}</span>
          <span>•</span>
          <span>${Math.round((entry.classification?.confidence || 0) * 100)}% conf</span>
          <span>•</span>
          <span>${new Date(entry.timestamp).toLocaleDateString('da-DK')}</span>
        </div>
      </div>
    `).join('');
  } else {
    listEl.innerHTML = '<p style="color:var(--muted);font-size:12px;text-align:center;padding:20px">Ingen ubehandlede beskeder</p>';
  }
}

// Helper for HTML escaping
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Toggle notification setting - visual feedback only
function toggleNotification(type) {
  // Toggle state is already visible on the checkbox
}

// Save notification email - visual feedback only
function saveNotificationEmail() {
  // Form validation handles errors
}

// Regenerate webhook secret - visual feedback in input field
function regenerateWebhookSecret() {
  const secret = 'whsec_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  document.getElementById('webhook-secret').value = secret;
  // Value update in input is visual feedback
}

// Edit user role (placeholder)
function editUserRole(userId) {
  // Would open modal
}

// Toggle KPI for restaurant - visual feedback in UI update
function toggleRestaurantKpi(restaurantId) {
  const restaurant = restaurants.find(r => r.id === restaurantId);
  if (restaurant) {
    restaurant.kpiEnabled = !restaurant.kpiEnabled;
    
    // Initialize KPI data if enabling and not present
    if (restaurant.kpiEnabled && !restaurant.kpi) {
      restaurant.kpi = {
        totalRevenue: 0,
        recoveredRevenue: 0,
        avgOrderValue: 0,
        reviews: {
          total: 0,
          avgRating: 0,
          google: { count: 0, avgRating: 0 },
          trustpilot: { count: 0, avgRating: 0 }
        },
        conversionRate: 0,
        responseTime: 0
      };
    }
    
    loadRestaurants();
  }
}

// ========================================
// CUSTOMER-SPECIFIC LOGS SYSTEM
// ========================================

// Format timestamp for aktivitetslog (DD.MM.YYYY, HH.MM)

function toast(msg, type = 'info', options = {}) {
  const container = document.getElementById('toasts') || document.body;
  const isSave = /gemt|saved|gemmer|saving/i.test(msg);

  // Simple toast for save operations
  if (isSave) {
    const existing = container.querySelector('.toast-simple');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.className = 'toast-simple';
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => {
      el.classList.add('toast-removing');
      setTimeout(() => el.remove(), 300);
    }, 3000);
    return;
  }

  // Icon SVGs per type
  const icons = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="16.5" r="0.5" fill="#fff"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="16.5" r="0.5" fill="#fff"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="0.5" fill="#fff"/><line x1="12" y1="11" x2="12" y2="17"/></svg>'
  };

  const typeClass = ['success','error','warning','info'].includes(type) ? type : 'info';
  const duration = options.duration || 10;
  const hasBody = !!(options.body || options.action);

  const card = document.createElement('div');
  card.className = 'toast-card toast-card--' + typeClass;

  // Header
  let html = '<div class="toast-header">';
  html += '<div class="toast-icon">' + (icons[typeClass] || icons.info) + '</div>';
  html += '<div class="toast-title">' + escapeHtml(msg) + '</div>';
  html += '<div class="toast-controls">';
  if (hasBody) html += '<button class="toast-toggle-btn" aria-label="Udvid"><svg class="toast-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button>';
  html += '<button class="toast-close-btn" aria-label="Luk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
  html += '</div></div>';

  // Body (collapsed by default)
  if (hasBody) {
    html += '<div class="toast-body">';
    if (options.body) html += '<div>' + escapeHtml(options.body) + '</div>';
    if (options.action) html += '<div class="toast-action"><button class="toast-action-btn">' + escapeHtml(options.action.label || 'OK') + '</button></div>';
    html += '</div>';
  }

  // Progress bar
  html += '<div class="toast-progress">';
  html += '<div class="toast-progress-bar"><div class="toast-progress-track" style="animation-duration:' + duration + 's"></div></div>';
  html += '<div class="toast-timer-text">Lukker om <span class="toast-countdown">' + duration + '</span>s. <span class="toast-stop">Klik stop.</span></div>';
  html += '</div>';

  card.innerHTML = html;
  container.appendChild(card);

  // Countdown state
  let remaining = duration;
  let paused = false;
  const countdownEl = card.querySelector('.toast-countdown');
  const trackEl = card.querySelector('.toast-progress-track');

  const countdownInterval = setInterval(() => {
    if (paused) return;
    remaining--;
    if (countdownEl) countdownEl.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      removeToast();
    }
  }, 1000);

  function removeToast() {
    clearInterval(countdownInterval);
    card.classList.add('toast-removing');
    setTimeout(() => card.remove(), 300);
  }

  // Close button
  card.querySelector('.toast-close-btn').addEventListener('click', removeToast);

  // Toggle expand/collapse
  if (hasBody) {
    const toggleBtn = card.querySelector('.toast-toggle-btn');
    const chevron = card.querySelector('.toast-chevron');
    const body = card.querySelector('.toast-body');
    toggleBtn.addEventListener('click', () => {
      const isExpanded = body.classList.toggle('expanded');
      chevron.classList.toggle('expanded', isExpanded);
    });
  }

  // Stop timer
  card.querySelector('.toast-stop').addEventListener('click', () => {
    paused = true;
    trackEl.classList.add('paused');
    card.querySelector('.toast-timer-text').innerHTML = 'Timer stoppet.';
  });

  // Action button
  if (options.action && options.action.onClick) {
    const actionBtn = card.querySelector('.toast-action-btn');
    if (actionBtn) actionBtn.addEventListener('click', () => {
      options.action.onClick();
      removeToast();
    });
  }

  // Helper: escape HTML
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// ========================================
// MANGLENDE FUNKTIONER - TILFØJET I V128
// ========================================
// Gem notifikationsindstillinger
function saveNotificationSettings() {
  const email = document.getElementById('notification-email')?.value || '';
  const cc = document.getElementById('notification-cc')?.value || '';

  // Gem alle checkbox-indstillinger
  const checkboxes = document.querySelectorAll('[data-notif]');
  const settings = {};
  checkboxes.forEach(cb => {
    settings[cb.dataset.notif] = cb.checked;
  });

  const data = { email, cc, settings };
  localStorage.setItem('orderflow_notification_settings', JSON.stringify(data));

  if (window.SupabaseDB) {
    window.SupabaseDB.saveUserSetting('notification_settings', data)
      .catch(err => console.warn('Supabase sync fejl (notifications):', err));
  }

  showSaveStatus('notification-save-status', 'saved');
}

// Gem stille timer
function saveQuietHours() {
  const start = document.getElementById('quiet-start')?.value || '22:00';
  const end = document.getElementById('quiet-end')?.value || '08:00';
  const allowCritical = document.getElementById('allow-critical')?.checked || true;

  const data = { start, end, allowCritical };
  localStorage.setItem('orderflow_quiet_hours', JSON.stringify(data));

  if (window.SupabaseDB) {
    window.SupabaseDB.saveUserSetting('quiet_hours', data)
      .catch(err => console.warn('Supabase sync fejl (quiet hours):', err));
  }

  showSaveStatus('quiet-hours-save-status', 'saved');
}

// Gem blå prik notifikationsindstillinger
function saveBlueNotificationSettings() {
  const dismissType = document.querySelector('input[name="dismiss-type"]:checked')?.value || 'click';
  const dismissValue = parseInt(document.getElementById('dismiss-value')?.value) || 1;

  // Save to activity indicator settings
  const settings = {
    dismissType: dismissType === 'click' ? 'hover' : dismissType,
    dismissValue: dismissValue
  };
  localStorage.setItem('orderflow_activity_indicator_settings', JSON.stringify(settings));

  // Also save to NotificationSystem for compatibility
  if (typeof NotificationSystem !== 'undefined') {
    NotificationSystem.saveSettings({
      defaultDismissType: dismissType,
      defaultDismissValue: dismissValue
    });
  }

  showSaveStatus('blue-notification-save-status', 'saved');

  // Refresh indicators to apply new settings
  updateActivityIndicators();
}

// Ryd alle blå prik notifikationer
function clearAllBlueNotifications() {
  if (typeof NotificationSystem !== 'undefined') {
    const count = NotificationSystem.notifications.size;
    if (count === 0) {
      toast('Ingen notifikationer at rydde', 'info');
      return;
    }

    if (confirm(`Er du sikker på at du vil rydde alle ${count} notifikationer?`)) {
      NotificationSystem.notifications.clear();
      NotificationSystem.saveNotifications();
      NotificationSystem.applyNotifications();
      toast(`${count} notifikationer ryddet`, 'success');
    }
  } else {
    console.error('NotificationSystem not loaded');
    toast('Fejl: Notifikationssystem ikke indlæst', 'error');
  }
}

// =====================================================
// NOTIFIKATION INITIALISERING
// =====================================================

/**
 * Initialiserer notification email-feltet med brugerens login-email
 * Hvis der allerede er gemt en email i localStorage, bruges den i stedet
 */
function initNotificationEmailField() {
  const emailField = document.getElementById('notification-email');
  if (!emailField) return;

  // Tjek om der er gemt indstillinger i localStorage
  const savedSettings = localStorage.getItem('orderflow_notification_settings');

  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      if (parsed.email) {
        emailField.value = parsed.email;
        // Sæt også CC hvis gemt
        const ccField = document.getElementById('notification-cc');
        if (ccField && parsed.cc) {
          ccField.value = parsed.cc;
        }
        return;
      }
    } catch (e) {
      console.warn('Kunne ikke parse gemte notifikationsindstillinger:', e);
    }
  }

  // Ingen gemt email - brug brugerens login-email
  if (currentUser && currentUser.email) {
    emailField.value = currentUser.email;
  }
}

// =====================================================
// SAMLET NOTIFIKATION GEM-FUNKTION
// =====================================================

/**
 * Gem alle notifikationsindstillinger på én gang
 * Sender også notifikation til header bell og email (hvis aktiveret)
 */
async function saveAllNotificationSettings() {
  try {
    // 1. Gem Blå Prik indstillinger
    const dismissType = document.querySelector('input[name="dismiss-type"]:checked')?.value || 'click';
    const dismissValue = parseInt(document.getElementById('dismiss-value')?.value) || 1;

    const blueSettings = {
      dismissType: dismissType === 'click' ? 'hover' : dismissType,
      dismissValue: dismissValue
    };
    localStorage.setItem('orderflow_activity_indicator_settings', JSON.stringify(blueSettings));

    if (typeof NotificationSystem !== 'undefined') {
      NotificationSystem.saveSettings({
        defaultDismissType: dismissType,
        defaultDismissValue: dismissValue
      });
    }

    // 2. Gem Email indstillinger
    const email = document.getElementById('notification-email')?.value || '';
    const cc = document.getElementById('notification-cc')?.value || '';

    const checkboxes = document.querySelectorAll('[data-notif]');
    const notifSettings = {};
    checkboxes.forEach(cb => {
      notifSettings[cb.dataset.notif] = cb.checked;
    });

    localStorage.setItem('orderflow_notification_settings', JSON.stringify({
      email,
      cc,
      settings: notifSettings
    }));

    // 3. Gem Stille timer
    const quietStart = document.getElementById('quiet-start')?.value || '22:00';
    const quietEnd = document.getElementById('quiet-end')?.value || '08:00';
    const allowCritical = document.getElementById('allow-critical')?.checked ?? true;

    localStorage.setItem('orderflow_quiet_hours', JSON.stringify({
      start: quietStart,
      end: quietEnd,
      allowCritical
    }));

    // Sync alle notifikationsindstillinger til Supabase
    if (window.SupabaseDB) {
      const allSettings = {
        blueSettings,
        notifications: { email, cc, settings: notifSettings },
        quietHours: { start: quietStart, end: quietEnd, allowCritical }
      };
      window.SupabaseDB.saveUserSetting('all_notification_settings', allSettings)
        .catch(err => console.warn('Supabase sync fejl (all notifications):', err));
    }

    // 4. Send notifikation til header ringeklokke
    addHeaderNotification({
      type: 'settings',
      title: 'Indstillinger gemt',
      message: 'Dine notifikationsindstillinger er blevet opdateret',
      icon: 'green'
    });

    // 5. Send email hvis checkbox er aktiveret og email er udfyldt
    // Tjek om "indstillinger ændret" notifikation er slået til
    const monthlyInvoiceCheckbox = document.querySelector('input[data-notif="monthly-invoice"]');
    if (monthlyInvoiceCheckbox?.checked && email) {
      try {
        await sendSettingsEmail(email, cc);
      } catch (err) {
        console.warn('Email notification failed:', err);
      }
    }

    // 6. Vis gem-status
    showSaveStatus('all-notifications-save-status', 'saved');

    // 7. Opdater activity indicators
    if (typeof updateActivityIndicators === 'function') {
      updateActivityIndicators();
    }

    console.log('✅ Alle notifikationsindstillinger gemt');

  } catch (error) {
    console.error('Fejl ved gem af notifikationsindstillinger:', error);
    toast('Fejl ved gem af indstillinger', 'error');
  }
}

/**
 * Tilføj notifikation til header dropdown (ringeklokke)
 * @param {Object} notification - Notifikationsdata
 * @param {string} notification.type - Type af notifikation
 * @param {string} notification.title - Titel på notifikation
 * @param {string} notification.message - Besked
 * @param {string} notification.icon - Icon farve (green, yellow, blue, purple)
 */
function addHeaderNotification(notification) {
  saveHeaderNotifications(notification);
  renderHeaderNotifications();
}

/**
 * Hent ikon SVG baseret på notifikationstype
 */
function getNotificationIcon(type) {
  const icons = {
    settings: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
    order: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
    success: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
    default: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
  };
  return icons[type] || icons.default;
}

/**
 * Opdater notification badge tæller
 * @param {number} change - Ændring (+1 eller -1)
 */
function updateNotificationBadge(change) {
  const badge = document.querySelector('.topbar-badge');
  if (!badge) return;

  let count = parseInt(badge.textContent) || 0;
  count = Math.max(0, count + change);
  
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

function getHeaderNotifications() {
  const saved = JSON.parse(localStorage.getItem('orderflow_header_notifications') || '[]');
  return saved.filter(n => !n.read);
}

function formatNotificationTime(timestamp) {
  if (!timestamp) return 'Lige nu';
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Lige nu';
  if (minutes < 60) return `${minutes} min siden`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} timer siden`;
  const days = Math.floor(hours / 24);
  return `${days} dage siden`;
}

function renderHeaderNotifications() {
  const list = document.getElementById('notif-list');
  const badge = document.querySelector('.topbar-badge');
  if (!list) return;

  const notifications = [];
  getHeaderNotifications().forEach(n => notifications.push({ ...n, source: 'header' }));

  if (typeof NotificationSystem !== 'undefined' && NotificationSystem.notifications) {
    NotificationSystem.notifications.forEach((notification) => {
      if (notification.read) return;
      notifications.push({
        title: notification.title || notification.message || 'Notifikation',
        message: notification.message,
        timestamp: notification.timestamp,
        source: 'system'
      });
    });
  }

  notifications.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  if (!notifications.length) {
    list.innerHTML = '<div class="notif-empty">Ingen notifikationer</div>';
  } else {
    list.innerHTML = notifications.map(item => `
      <div class="topbar-dropdown-item notif-item">
        <div class="notif-content">
          <div class="notif-text">${escapeHtml(item.title || item.message || 'Notifikation')}</div>
          <div class="notif-time">${formatNotificationTime(item.timestamp)}</div>
        </div>
      </div>
    `).join('');
  }

  const count = notifications.length;
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

function markAllHeaderNotificationsRead() {
  const saved = JSON.parse(localStorage.getItem('orderflow_header_notifications') || '[]');
  const updated = saved.map(n => ({ ...n, read: true }));
  localStorage.setItem('orderflow_header_notifications', JSON.stringify(updated));
  if (typeof NotificationSystem !== 'undefined' && NotificationSystem.notifications) {
    NotificationSystem.notifications.forEach((notification, path) => {
      if (!notification.read) {
        NotificationSystem.markRead(path);
      }
    });
  }
  renderHeaderNotifications();
}

/**
 * Gem header notifikationer til localStorage
 */
function saveHeaderNotifications(notification) {
  const saved = JSON.parse(localStorage.getItem('orderflow_header_notifications') || '[]');
  saved.unshift({
    ...notification,
    timestamp: Date.now(),
    read: false
  });
  // Behold kun de sidste 10
  localStorage.setItem('orderflow_header_notifications', JSON.stringify(saved.slice(0, 10)));
}

/**
 * Send email med indstillingsændringer
 * @param {string} email - Modtager email
 * @param {string} cc - CC email (valgfri)
 */
async function sendSettingsEmail(email, cc) {
  if (!email) return;

  // Brug eksisterende Edge Function til at sende email
  const supabaseUrl = window.SUPABASE_CONFIG?.url || 'https://qymtjhzgtcittohutmay.supabase.co';
  const supabaseKey = window.SUPABASE_CONFIG?.key || '';

  const response = await fetch(`${supabaseUrl}/functions/v1/send-otp-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`
    },
    body: JSON.stringify({
      to: email,
      otp: 'SETTINGS', // Special marker - not a real OTP
      appName: 'OrderFlow',
      subject: 'OrderFlow: Dine indstillinger er opdateret',
      // Custom template flag
      isSettingsEmail: true
    })
  });

  if (!response.ok) {
    throw new Error('Failed to send settings email');
  }

  console.log('✅ Settings email sent to:', email);
}


// Gem momsindstillinger
function saveMomsSettings() {
  const momsRate = document.getElementById('moms-rate')?.value || '25';
  const showMoms = document.getElementById('show-moms')?.checked || true;

  const data = { rate: parseFloat(momsRate), showOnReceipt: showMoms };
  localStorage.setItem('orderflow_moms_settings', JSON.stringify(data));

  if (window.SupabaseDB) {
    window.SupabaseDB.saveUserSetting('moms_settings', data)
      .catch(err => console.warn('Supabase sync fejl (moms):', err));
  }

  showSaveStatus('moms-save-status', 'saved');
}

// Gem sprogindstillinger
function saveLanguage() {
  const language = document.getElementById('language-select')?.value || 'da';

  localStorage.setItem('orderflow_language', language);

  if (window.SupabaseDB) {
    window.SupabaseDB.saveUserSetting('language', { language })
      .catch(err => console.warn('Supabase sync fejl (language):', err));
  }

  showSaveStatus('language-save-status', 'saved');
}

// Gem bankindstillinger
function saveBankSettings() {
  const bankName = document.getElementById('bank-name')?.value || '';
  const regNumber = document.getElementById('bank-reg')?.value || '';
  const accountNumber = document.getElementById('bank-account')?.value || '';

  const data = { bankName, regNumber, accountNumber };
  localStorage.setItem('orderflow_bank_settings', JSON.stringify(data));

  if (window.SupabaseDB) {
    window.SupabaseDB.saveUserSetting('bank_settings', data)
      .catch(err => console.warn('Supabase sync fejl (bank):', err));
  }
}

// Gem virksomhedsoplysninger
function saveCompanySettings() {
  const cvr = document.getElementById('company-cvr')?.value || '';
  const phone = document.getElementById('company-phone')?.value || '';
  const email = document.getElementById('company-invoice-email')?.value || '';
  const address = document.getElementById('company-address')?.value || '';
  const postalCode = document.getElementById('company-zip')?.value || '';
  const city = document.getElementById('company-city')?.value || '';

  const data = { cvr, phone, email, address, postalCode, city };
  localStorage.setItem('orderflow_company_settings', JSON.stringify(data));

  if (window.SupabaseDB) {
    window.SupabaseDB.saveUserSetting('company_settings', data)
      .catch(err => console.warn('Supabase sync fejl (company):', err));
  }
}

// Gem alle bank- og virksomhedsoplysninger
function saveAllBankSettings() {
  saveBankSettings();
  saveCompanySettings();
  showSaveStatus('bank-save-status', 'saved');
}

// Indlæs bankindstillinger
function loadBankSettings() {
  const bankSettings = JSON.parse(localStorage.getItem('orderflow_bank_settings') || '{}');
  const companySettings = JSON.parse(localStorage.getItem('orderflow_company_settings') || '{}');

  if (bankSettings.bankName) document.getElementById('bank-name').value = bankSettings.bankName;
  if (bankSettings.regNumber) document.getElementById('bank-reg').value = bankSettings.regNumber;
  if (bankSettings.accountNumber) document.getElementById('bank-account').value = bankSettings.accountNumber;

  if (companySettings.cvr) document.getElementById('company-cvr').value = companySettings.cvr;
  if (companySettings.phone) document.getElementById('company-phone').value = companySettings.phone;
  if (companySettings.email) document.getElementById('company-invoice-email').value = companySettings.email;
  if (companySettings.address) document.getElementById('company-address').value = companySettings.address;
  if (companySettings.postalCode) document.getElementById('company-zip').value = companySettings.postalCode;
  if (companySettings.city) document.getElementById('company-city').value = companySettings.city;
}

// Toggle password visibility
function togglePasswordVisibility(inputId, button) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';

  // Update icon - show eye-off when password is visible, eye when hidden
  const svg = button?.querySelector?.('svg');
  if (svg) {
    if (isPassword) {
      // Eye-off icon (password is now visible)
      svg.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
    } else {
      // Eye icon (password is now hidden)
      svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
    }
  }
}

// Skift adgangskode
function changePassword() {
  const currentPassword = document.getElementById('current-password')?.value || '';
  const newPassword = document.getElementById('new-password')?.value || '';
  const confirmPassword = document.getElementById('confirm-password')?.value || '';

  if (!currentPassword || !newPassword || !confirmPassword) {
    showSaveStatus('password-save-status', 'error');
    return;
  }

  if (newPassword !== confirmPassword) {
    showSaveStatus('password-save-status', 'error');
    return;
  }

  if (newPassword.length < 8) {
    showSaveStatus('password-save-status', 'error');
    return;
  }

  // I demo-mode simulerer vi bare at det lykkes
  if (CONFIG.DEMO_MODE) {
    showSaveStatus('password-save-status', 'saved');
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
    return;
  }

  // Skift adgangskode via Supabase Auth
  if (window.supabaseClient) {
    window.supabaseClient.auth.updateUser({ password: newPassword })
      .then(({ error }) => {
        if (error) {
          console.error('Password change failed:', error);
          showSaveStatus('password-save-status', 'error');
          toast('Kunne ikke ændre adgangskode: ' + error.message, 'error');
        } else {
          console.log('✅ Password changed via Supabase Auth');
          showSaveStatus('password-save-status', 'saved');
          document.getElementById('current-password').value = '';
          document.getElementById('new-password').value = '';
          document.getElementById('confirm-password').value = '';
        }
      })
      .catch(err => {
        console.warn('Supabase auth fejl:', err);
        showSaveStatus('password-save-status', 'error');
      });
  } else {
    showSaveStatus('password-save-status', 'saved');
  }
}

// Gem brugerindstillinger
function saveUserSettings() {
  const firstName = document.getElementById('user-firstname')?.value || '';
  const lastName = document.getElementById('user-lastname')?.value || '';
  const email = document.getElementById('user-email')?.value || '';
  const phone = document.getElementById('user-phone')?.value || '';

  const data = { firstName, lastName, email, phone };
  localStorage.setItem('orderflow_user_profile', JSON.stringify(data));

  if (window.SupabaseDB) {
    window.SupabaseDB.saveUserSetting('user_profile', data)
      .catch(err => console.warn('Supabase sync fejl (user profile):', err));
  }

  showSaveStatus('users-save-status', 'saved');
}

// Vis salgsoversigt — henter ægte data fra Supabase
async function loadSalgsoversigt() {
  const fromDate = document.getElementById('sales-from-date')?.value || '';
  const toDate = document.getElementById('sales-to-date')?.value || '';
  
  if (!fromDate || !toDate) {
    toast('Vælg dato interval', 'error');
    return;
  }
  
  const salesContainer = document.getElementById('sales-overview-result');
  if (!salesContainer) return;

  salesContainer.innerHTML = '<p style="text-align:center;color:var(--muted);padding:16px">Indlæser...</p>';
  salesContainer.style.display = 'block';

  let total = 0, orderCount = 0, avgOrder = 0;
  let source = '';

  try {
    const headers = { 'apikey': CONFIG.SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY };
    const base = CONFIG.SUPABASE_URL + '/rest/v1';
    const fromISO = new Date(fromDate).toISOString();
    const toISO = new Date(toDate + 'T23:59:59').toISOString();

    // Try unified_orders first, then orders
    for (const table of ['unified_orders', 'orders']) {
      const res = await fetch(base + '/' + table + '?select=total,status&created_at=gte.' + fromISO + '&created_at=lte.' + toISO, { headers });
      if (res.ok) {
        const orders = (await res.json()).filter(o => !['cancelled','refunded','draft'].includes(o.status));
        if (orders.length > 0) {
          total = orders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
          orderCount = orders.length;
          avgOrder = Math.round(total / orderCount);
          source = 'Supabase';
          break;
        }
      }
    }

    // Demo mode fallback
    if (orderCount === 0 && typeof isDemoDataEnabled === 'function' && isDemoDataEnabled()) {
      const demoOrders = typeof getDemoDataOrders === 'function' ? getDemoDataOrders() : [];
      const filtered = demoOrders.filter(o => {
        const d = o.created_at;
        return d >= fromDate && d <= toDate + 'T23:59:59';
      });
      if (filtered.length > 0) {
        total = filtered.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
        orderCount = filtered.length;
        avgOrder = Math.round(total / orderCount);
        source = 'demo';
      }
    }
  } catch (e) {
    console.warn('[Salgsoversigt] Fejl:', e);
  }

  if (orderCount === 0) {
    salesContainer.innerHTML = `
      <p style="text-align:center;color:var(--muted);padding:24px;font-size:14px">Ingen ordrer fundet i perioden ${fromDate} til ${toDate}</p>
    `;
  } else {
    salesContainer.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px">
        <div style="background:var(--bg3);padding:16px;border-radius:var(--radius-md);text-align:center">
          <div style="font-size:24px;font-weight:700;color:var(--accent)">${total.toLocaleString('da-DK')} kr</div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px">Total omsætning</div>
        </div>
        <div style="background:var(--bg3);padding:16px;border-radius:var(--radius-md);text-align:center">
          <div style="font-size:24px;font-weight:700;color:var(--green)">${orderCount}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px">Antal ordrer</div>
        </div>
        <div style="background:var(--bg3);padding:16px;border-radius:var(--radius-md);text-align:center">
          <div style="font-size:24px;font-weight:700;color:var(--purple)">${avgOrder} kr</div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px">Gns. ordre</div>
        </div>
      </div>
      <p style="font-size:11px;color:var(--muted);margin-top:12px;text-align:center">Data fra ${fromDate} til ${toDate}${source === 'demo' ? ' (demo)' : ''}</p>
    `;
  }
}

// Vis korttransaktioner — henter fra Supabase payments tabel
async function loadKorttransaktioner() {
  const fromDate = document.getElementById('transactions-from-date')?.value || '';
  const toDate = document.getElementById('transactions-to-date')?.value || '';
  
  if (!fromDate || !toDate) {
    toast('Vælg dato interval', 'error');
    return;
  }
  
  const transContainer = document.getElementById('transactions-result');
  if (!transContainer) return;

  transContainer.innerHTML = '<p style="text-align:center;color:var(--muted);padding:16px">Indlæser...</p>';
  transContainer.style.display = 'block';

  let transactions = [];

  try {
    const headers = { 'apikey': CONFIG.SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY };
    const base = CONFIG.SUPABASE_URL + '/rest/v1';
    const fromISO = new Date(fromDate).toISOString();
    const toISO = new Date(toDate + 'T23:59:59').toISOString();

    const res = await fetch(base + '/payments?select=id,amount,currency,status,stripe_payment_intent_id,created_at&created_at=gte.' + fromISO + '&created_at=lte.' + toISO + '&order=created_at.desc', { headers });
    if (res.ok) {
      const payments = await res.json();
      transactions = payments.map(p => {
        const d = new Date(p.created_at);
        return {
          id: (p.stripe_payment_intent_id || p.id).substring(0, 16),
          date: d.toLocaleDateString('da-DK'),
          amount: Math.round((p.amount || 0) / 100), // øre to DKK
          currency: (p.currency || 'dkk').toUpperCase(),
          status: p.status === 'completed' ? 'Godkendt' : p.status === 'failed' ? 'Afvist' : p.status
        };
      });
    }
  } catch (e) {
    console.warn('[Korttransaktioner] Fejl:', e);
  }

  if (transactions.length === 0) {
    transContainer.innerHTML = `<p style="text-align:center;color:var(--muted);padding:24px;font-size:14px">Ingen transaktioner fundet i perioden ${fromDate} til ${toDate}</p>`;
  } else {
    transContainer.innerHTML = `
      <div style="margin-top:16px;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden">
        <div style="display:grid;grid-template-columns:1fr 100px 100px 100px;gap:8px;padding:12px;background:var(--bg);font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase">
          <div>ID</div>
          <div>Dato</div>
          <div>Beløb</div>
          <div>Status</div>
        </div>
        ${transactions.map(t => `
          <div style="display:grid;grid-template-columns:1fr 100px 100px 100px;gap:8px;padding:12px;border-top:1px solid var(--border);font-size:13px">
            <div style="font-family:monospace;font-size:11px">${escapeHtml(t.id)}</div>
            <div>${t.date}</div>
            <div style="font-weight:600">${t.amount} ${t.currency}</div>
            <div style="color:${t.status === 'Godkendt' ? 'var(--green)' : 'var(--danger)'}">${t.status}</div>
          </div>
        `).join('')}
      </div>
      <p style="font-size:11px;color:var(--muted);margin-top:12px;text-align:center">${transactions.length} transaktioner fundet</p>
    `;
  }
}

// ==================== TEST FUNCTIONS ====================

/**
 * TEST FUNCTION - Demonstrer automatic real-time tracking
 * Kald denne funktion i browser console for at se hvordan
 * ActivityTracker automatisk tracker ændringer
 */
function testAutoTracking() {
  console.log('🤖 Testing Automatic Real-Time Tracking...');
  console.log('');
  console.log('📝 For at teste automatic tracking:');
  console.log('');
  console.log('1️⃣ Tilføj data-track attribut til et input felt:');
  console.log('   <input data-track="kunder:stamdata:navn" value="Demo Restaurant">');
  console.log('');
  console.log('2️⃣ Ændr værdien i inputfeltet (skriv noget nyt)');
  console.log('');
  console.log('3️⃣ Aktiviteten logges AUTOMATISK efter 1 sekund!');
  console.log('   - Aktivitet tilføjes til "Seneste Aktiviteter"');
  console.log('   - Blå prik vises automatisk i sidebar');
  console.log('   - Notifikation sendes til NotificationSystem');
  console.log('');
  console.log('📊 Eksempel data-track formater:');
  console.log('   data-track="kunder:stamdata:navn"          -> Kunder > Stamdata > navn felt');
  console.log('   data-track="workflow:nodes:title"          -> Workflow > Nodes > title felt');
  console.log('   data-track="indstillinger:general:email"   -> Indstillinger > General > email');
  console.log('');
  console.log('💡 ActivityTracker wrapper også automatisk alle save-funktioner:');
  console.log('   - saveStamdata()');
  console.log('   - saveProduct()');
  console.log('   - saveWorkflow()');
  console.log('   - saveSettings()');
  console.log('   - osv...');
  console.log('');
  console.log('✨ Systemet er nu HELT automatisk - ingen manuel logActivity() nødvendig!');
}

/**
 * TEST FUNCTION - Clear all activities and notifications
 * Nyttig til at starte forfra under testing
 */
function clearAllActivities() {
  if (confirm('Er du sikker på at du vil slette ALLE aktiviteter og notifikationer?')) {
    localStorage.removeItem('orderflow_activity_log');
    if (typeof NotificationSystem !== 'undefined') {
      NotificationSystem.clear();
    }
    console.log('🗑️ Alle aktiviteter og notifikationer slettet!');
    console.log('🔄 Refresh siden for at se ændringerne...');

    // Refresh UI
    if (typeof updateRecentActivityUI === 'function') {
      updateRecentActivityUI();
    }
    if (typeof NotificationSystem !== 'undefined') {
      NotificationSystem.render();
    }
  }
}

// Gør tilgængelig i console
window.testActivityTracking = testActivityTracking;
window.testAutoTracking = testAutoTracking;
window.clearAllActivities = clearAllActivities;

// ============================================================================
// 2FA / OTP AUTHENTICATION FUNCTIONS
// ============================================================================

// Global state for 2FA flow
let pending2FAUser = null;
let pending2FASettings = null;
let current2FAMethod = 'totp';

/**
 * Check if user requires 2FA and handle challenge
 * Called after successful password authentication
 */

async function loadRolesPage() {
  const rolesList = document.getElementById('roles-list');
  if (!rolesList) return;

  rolesList.innerHTML = '<div class="role-item-loading">Indlæser roller...</div>';

  try {
    const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/custom_roles?order=is_system.desc,name.asc`, {
      headers: {
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) throw new Error('Kunne ikke hente roller');

    const roles = await response.json();

    if (roles.length === 0) {
      rolesList.innerHTML = '<div class="roles-users-empty">Ingen roller fundet</div>';
      return;
    }

    rolesList.innerHTML = roles.map(role => `
      <div class="role-item ${selectedRoleId === role.id ? 'active' : ''}"
           onclick="selectRole('${role.id}')"
           data-role-id="${role.id}">
        <div class="role-item-info">
          <span class="role-color-dot" style="background:${role.color || '#6b7280'}"></span>
          <span class="role-item-name">${role.name}</span>
          ${role.is_system ? '<span class="role-system-badge">System</span>' : ''}
        </div>
        ${!role.is_system ? `
          <button class="btn-icon-sm btn-danger-ghost" onclick="event.stopPropagation(); deleteRole('${role.id}', '${role.name}')" title="Slet rolle">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        ` : ''}
      </div>
    `).join('');

  } catch (err) {
    console.error('loadRolesPage error:', err);
    rolesList.innerHTML = '<div class="roles-users-empty">Fejl ved indlæsning af roller</div>';
  }
}

// Select a role and show users
async function selectRole(roleId) {
  selectedRoleId = roleId;

  // Update active state in list
  document.querySelectorAll('.role-item').forEach(item => {
    item.classList.toggle('active', item.dataset.roleId === roleId);
  });

  const usersContent = document.getElementById('role-users-content');
  const usersTitle = document.getElementById('role-users-title');

  if (!usersContent) return;

  usersContent.innerHTML = '<div class="role-item-loading">Indlæser brugere...</div>';

  try {
    // First get the role name
    const roleResponse = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/custom_roles?id=eq.${roleId}`, {
      headers: {
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
      }
    });
    const roleData = await roleResponse.json();
    const roleName = roleData[0]?.name || 'Ukendt';

    if (usersTitle) {
      usersTitle.textContent = `Brugere med "${roleName}"`;
    }

    // Map display names to database role values
    const roleMapping = {
      'Administrator': 'admin',
      'Manager': 'manager',
      'Personale': 'employee'
    };
    const dbRoleName = roleMapping[roleName] || roleName.toLowerCase();

    // Get users by role name from user_roles table
    const usersResponse = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/user_roles?role=eq.${dbRoleName}&select=user_id,profiles(id,email,full_name,avatar_url)`, {
      headers: {
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
      }
    });

    if (!usersResponse.ok) {
      throw new Error('Kunne ikke hente brugere');
    }

    const users = await usersResponse.json();
    renderRoleUsers(users, usersContent);

  } catch (err) {
    console.error('selectRole error:', err);
    usersContent.innerHTML = '<div class="roles-users-empty">Fejl ved indlæsning af brugere</div>';
  }
}

function renderRoleUsers(users, container) {
  if (!users || users.length === 0) {
    container.innerHTML = '<div class="roles-users-empty">Ingen brugere med denne rolle</div>';
    return;
  }

  container.innerHTML = users.map(u => {
    const profile = u.profiles || {};
    const name = profile.full_name || profile.email || 'Ukendt bruger';
    const email = profile.email || '';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return `
      <div class="role-user-item">
        <div class="role-user-avatar">${initials}</div>
        <div class="role-user-info">
          <div class="role-user-name">${name}</div>
          <div class="role-user-email">${email}</div>
        </div>
      </div>
    `;
  }).join('');
}

// Show add role modal
function showAddRoleModal() {
  const modal = document.getElementById('add-role-modal');
  if (!modal) return;

  // Reset form
  document.getElementById('new-role-name').value = '';
  selectedRoleColor = '#6b7280';

  // Setup color picker
  const colorGrid = document.getElementById('role-color-picker');
  if (colorGrid) {
    colorGrid.innerHTML = ROLE_COLORS.map(color => `
      <div class="color-option ${color === selectedRoleColor ? 'selected' : ''}"
           style="background:${color}"
           data-color="${color}"
           onclick="selectRoleColor('${color}')"></div>
    `).join('');
  }

  // Setup permissions checkboxes
  const permGrid = document.getElementById('permissions-grid');
  if (permGrid) {
    permGrid.innerHTML = AVAILABLE_PERMISSIONS.map(perm => `
      <label class="permission-checkbox">
        <input type="checkbox" value="${perm.id}">
        <div class="permission-info">
          <span class="permission-label">${perm.label}</span>
          <span class="permission-desc">${perm.desc}</span>
        </div>
      </label>
    `).join('');
  }

  modal.classList.add('active');
}

// Select role color
function selectRoleColor(color) {
  selectedRoleColor = color;
  document.querySelectorAll('.color-option').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.color === color);
  });
}

// Close add role modal
function closeAddRoleModal() {
  const modal = document.getElementById('add-role-modal');
  if (modal) modal.classList.remove('active');
}

// Save new role
async function saveNewRole() {
  const nameInput = document.getElementById('new-role-name');
  const name = nameInput?.value?.trim();

  if (!name) {
    toast('Indtast et rollenavn', 'error');
    return;
  }

  // Get selected permissions
  const permissions = [];
  document.querySelectorAll('#permissions-grid input[type="checkbox"]:checked').forEach(cb => {
    permissions.push(cb.value);
  });

  try {
    const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/custom_roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name,
        color: selectedRoleColor,
        permissions: permissions,
        is_system: false
      })
    });

    if (!response.ok) {
      const err = await response.text();
      if (err.includes('duplicate') || err.includes('unique')) {
        toast('En rolle med dette navn findes allerede', 'error');
      } else {
        toast('Kunne ikke oprette rolle', 'error');
      }
      return;
    }

    toast('Rolle oprettet', 'success');
    closeAddRoleModal();
    loadRolesPage();

  } catch (err) {
    console.error('saveNewRole error:', err);
    toast('Fejl ved oprettelse af rolle', 'error');
  }
}

// Delete role
async function deleteRole(roleId, roleName) {
  if (!confirm(`Er du sikker på du vil slette rollen "${roleName}"?`)) return;

  try {
    const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/custom_roles?id=eq.${roleId}&is_system=eq.false`, {
      method: 'DELETE',
      headers: {
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) {
      toast('Kunne ikke slette rolle', 'error');
      return;
    }

    toast('Rolle slettet', 'success');

    // Reset selection if deleted role was selected
    if (selectedRoleId === roleId) {
      selectedRoleId = null;
      const usersContent = document.getElementById('role-users-content');
      const usersTitle = document.getElementById('role-users-title');
      if (usersContent) usersContent.innerHTML = '<div class="roles-users-empty">Vælg en rolle for at se tilknyttede brugere</div>';
      if (usersTitle) usersTitle.textContent = 'Brugere';
    }

    loadRolesPage();

  } catch (err) {
    console.error('deleteRole error:', err);
    toast('Fejl ved sletning af rolle', 'error');
  }
}

// Export role management functions
window.loadRolesPage = loadRolesPage;
window.selectRole = selectRole;
window.showAddRoleModal = showAddRoleModal;
window.selectRoleColor = selectRoleColor;
window.closeAddRoleModal = closeAddRoleModal;
window.saveNewRole = saveNewRole;
window.deleteRole = deleteRole;

// =====================================================
// VERSION & CACHE MANAGEMENT
// =====================================================

/**
 * Update version display in System Status
 */
function updateSystemVersion() {
  const versionEl = document.getElementById('system-version');
  if (versionEl && window.VERSION_CONFIG) {
    versionEl.textContent = VERSION_CONFIG.getDisplayVersion();
  }
}

/**
 * Clear Service Worker cache and reload
 * Preserves: theme, session
 */
async function clearAppCache() {
  const confirmed = confirm('Er du sikker på at du vil rydde cachen? Siden vil genindlæses.');
  if (!confirmed) return;

  toast('Rydder cache...', 'info');

  try {
    // Clear Service Worker caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('Service Worker caches cleared');
    }

    // Unregister Service Workers to force fresh install
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      console.log('Service Workers unregistered');
    }

    toast('Cache ryddet! Genindlæser...', 'success');

    // Force hard reload after short delay
    setTimeout(() => {
      window.location.reload(true);
    }, 1000);

  } catch (error) {
    console.error('Error clearing cache:', error);
    toast('Fejl ved rydning af cache', 'error');
  }
}

/**
 * Clear all app data including localStorage (except session and theme)
 */
async function clearAppCacheAndData() {
  const confirmed = confirm(
    'ADVARSEL: Dette vil slette alle lokale data!\n\n' +
    'Din session og tema-indstilling bevares, men alt andet nulstilles.\n\n' +
    'Fortsæt?'
  );
  if (!confirmed) return;

  toast('Rydder alle data...', 'info');

  try {
    // Preserve these keys
    const preserveKeys = ['theme', 'orderflow_session', 'flow_system_key_states', 'flow_deleted_system_keys', 'flow_api_keys', 'flow_id'];
    // Also preserve API enabled states (dynamic keys)
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('api_') && key.endsWith('_enabled')) {
        preserveKeys.push(key);
      }
    });
    const preserved = {};

    // Save preserved values
    preserveKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) preserved[key] = value;
    });

    // Clear localStorage
    localStorage.clear();

    // Restore preserved values
    Object.entries(preserved).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });

    console.log('localStorage cleared (preserved: theme, session)');

    // Clear Service Worker caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }

    // Unregister Service Workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }

    toast('Alle data ryddet! Genindlæser...', 'success');

    setTimeout(() => {
      window.location.reload(true);
    }, 1000);

  } catch (error) {
    console.error('Error clearing data:', error);
    toast('Fejl ved rydning af data', 'error');
  }
}

// Export cache management functions
window.clearAppCache = clearAppCache;
window.clearAppCacheAndData = clearAppCacheAndData;
window.updateSystemVersion = updateSystemVersion;

// Initialize version display when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateSystemVersion);
} else {
  updateSystemVersion();
}

// ==================== MAINTENANCE PAGE FUNCTIONS ====================

/**
 * Refresh Service Worker - force update to latest version
 */
async function refreshServiceWorker() {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.update();
      }
      toast('Service Worker opdateret!', 'success');
      refreshMaintenanceDiagnostics();
    } else {
      toast('Service Worker ikke understøttet', 'warning');
    }
  } catch (error) {
    console.error('Error refreshing Service Worker:', error);
    toast('Fejl ved opdatering af Service Worker', 'error');
  }
}

/**
 * Get localStorage size in human readable format
 */
function getLocalStorageSize() {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length * 2; // UTF-16 uses 2 bytes per character
    }
  }
  if (total < 1024) return total + ' B';
  if (total < 1024 * 1024) return (total / 1024).toFixed(1) + ' KB';
  return (total / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Get number of cached files
 */
async function getCachedFilesCount() {
  if (!('caches' in window)) return 0;
  try {
    const cacheNames = await caches.keys();
    let totalFiles = 0;
    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      totalFiles += keys.length;
    }
    return totalFiles;
  } catch {
    return 0;
  }
}

/**
 * Get browser info
 */
function getBrowserInfo() {
  const ua = navigator.userAgent;
  let browser = 'Ukendt';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  return browser;
}

/**
 * Refresh maintenance diagnostics display
 */
async function refreshMaintenanceDiagnostics() {
  // System Status
  const versionEl = document.getElementById('maint-app-version');
  const buildEl = document.getElementById('maint-build-number');
  const releaseDateEl = document.getElementById('maint-release-date');
  const swStatusEl = document.getElementById('maint-sw-status');
  const browserEl = document.getElementById('maint-browser-info');

  if (versionEl && window.VERSION_CONFIG) {
    versionEl.textContent = window.VERSION_CONFIG.version || '-';
  }
  if (buildEl && window.VERSION_CONFIG) {
    buildEl.textContent = window.VERSION_CONFIG.build || '-';
  }
  if (releaseDateEl && window.VERSION_CONFIG) {
    releaseDateEl.textContent = window.VERSION_CONFIG.releaseDate || '-';
  }
  if (swStatusEl) {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      swStatusEl.innerHTML = registrations.length > 0
        ? '<span style="color:var(--success)">Aktiv</span>'
        : '<span style="color:var(--muted)">Ingen</span>';
    } else {
      swStatusEl.textContent = 'Ikke understøttet';
    }
  }
  if (browserEl) {
    browserEl.textContent = getBrowserInfo();
  }

  // Diagnostics
  const localStorageEl = document.getElementById('maint-localstorage-size');
  const cachedFilesEl = document.getElementById('maint-cached-files');
  const userInfoEl = document.getElementById('maint-user-info');
  const supabaseStatusEl = document.getElementById('maint-supabase-status');

  if (localStorageEl) {
    localStorageEl.textContent = getLocalStorageSize();
  }
  if (cachedFilesEl) {
    const count = await getCachedFilesCount();
    cachedFilesEl.textContent = count + ' filer';
  }
  if (userInfoEl) {
    if (currentUser) {
      userInfoEl.textContent = currentUser.email || currentUser.user_metadata?.full_name || 'Ukendt';
    } else {
      userInfoEl.textContent = 'Ikke logget ind';
    }
  }
  if (supabaseStatusEl) {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      supabaseStatusEl.innerHTML = '<span style="color:var(--success)">Forbundet</span>';
    } else {
      supabaseStatusEl.innerHTML = '<span style="color:var(--warn)">Ikke forbundet</span>';
    }
  }
}

/**
 * Export settings to JSON file
 */
function exportSettings() {
  try {
    const settings = {};
    const excludeKeys = ['orderflow_session']; // Don't export sensitive session data

    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key) && !excludeKeys.includes(key)) {
        try {
          settings[key] = JSON.parse(localStorage[key]);
        } catch {
          settings[key] = localStorage[key];
        }
      }
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      appVersion: window.VERSION_CONFIG?.version || 'unknown',
      settings: settings
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orderflow-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast('Indstillinger eksporteret!', 'success');
  } catch (error) {
    console.error('Error exporting settings:', error);
    toast('Fejl ved eksport af indstillinger', 'error');
  }
}

/**
 * Import settings from JSON file
 */
function importSettings() {
  const input = document.getElementById('settings-import-input');
  if (input) {
    input.click();
  }
}

/**
 * Handle settings import file selection
 */
function handleSettingsImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);

      if (!data.settings) {
        toast('Ugyldig backup-fil', 'error');
        return;
      }

      if (!confirm('Er du sikker på at du vil importere disse indstillinger? Eksisterende indstillinger vil blive overskrevet.')) {
        return;
      }

      // Save current theme
      const currentTheme = localStorage.getItem('theme');

      // Import settings
      for (let key in data.settings) {
        const value = data.settings[key];
        localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
      }

      // Restore theme if it was overwritten
      if (currentTheme) {
        localStorage.setItem('theme', currentTheme);
      }

      toast('Indstillinger importeret! Genindlæser...', 'success');
      setTimeout(() => window.location.reload(), 1500);

    } catch (error) {
      console.error('Error importing settings:', error);
      toast('Fejl ved import - ugyldig fil', 'error');
    }
  };
  reader.readAsText(file);

  // Reset input
  event.target.value = '';
}

/**
 * Download full diagnostics report
 */
async function downloadDiagnosticsReport() {
  try {
    const report = {
      generatedAt: new Date().toISOString(),
      system: {
        appVersion: window.VERSION_CONFIG?.version || 'unknown',
        build: window.VERSION_CONFIG?.build || 'unknown',
        releaseDate: window.VERSION_CONFIG?.releaseDate || 'unknown',
        cacheName: window.VERSION_CONFIG?.cacheName || 'unknown'
      },
      browser: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        cookiesEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        platform: navigator.platform
      },
      storage: {
        localStorageSize: getLocalStorageSize(),
        localStorageKeys: Object.keys(localStorage).length,
        cachedFiles: await getCachedFilesCount()
      },
      session: {
        loggedIn: !!currentUser,
        userEmail: currentUser?.email || null,
        userRole: currentUser?.role || null
      },
      serviceWorker: {
        supported: 'serviceWorker' in navigator,
        registrations: 'serviceWorker' in navigator
          ? (await navigator.serviceWorker.getRegistrations()).length
          : 0
      },
      supabase: {
        initialized: typeof supabaseClient !== 'undefined' && !!supabaseClient
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orderflow-diagnostics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast('Diagnostik rapport downloadet!', 'success');
  } catch (error) {
    console.error('Error generating diagnostics report:', error);
    toast('Fejl ved generering af rapport', 'error');
  }
}

// Export maintenance functions
window.refreshServiceWorker = refreshServiceWorker;
window.refreshMaintenanceDiagnostics = refreshMaintenanceDiagnostics;
window.exportSettings = exportSettings;
window.importSettings = importSettings;
window.handleSettingsImport = handleSettingsImport;
window.downloadDiagnosticsReport = downloadDiagnosticsReport;

// ==================== APP BUILDER FUNCTIONS ====================

// Show App Builder page
