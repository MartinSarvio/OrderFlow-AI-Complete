// FLOW Auth Module — login, signup, OAuth, 2FA, session management

// =====================================================
// DEVICE DETECTION & TRUSTED DEVICES
// =====================================================

/**
 * Detect device type from User-Agent
 * @returns {Object} Device type and icon identifier
 */
function detectDeviceType() {
  const ua = navigator.userAgent;

  if (/iPhone/i.test(ua)) return { type: 'iPhone', icon: 'phone' };
  if (/iPad/i.test(ua)) return { type: 'iPad', icon: 'tablet' };
  if (/Android/i.test(ua) && /Mobile/i.test(ua)) return { type: 'Android', icon: 'phone' };
  if (/Android/i.test(ua)) return { type: 'Android Tablet', icon: 'tablet' };
  if (/Macintosh|Mac OS/i.test(ua)) return { type: 'macOS', icon: 'laptop' };
  if (/Windows/i.test(ua)) return { type: 'Windows', icon: 'laptop' };
  if (/Linux/i.test(ua)) return { type: 'Linux', icon: 'laptop' };

  return { type: 'Ukendt enhed', icon: 'unknown' };
}

/**
 * Register current device in Supabase
 */
async function registerDevice() {
  const client = window.supabaseClient;
  if (!client) {
    console.warn('⚠️ Cannot register device: Supabase not available');
    return;
  }

  try {
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;

    const device = detectDeviceType();

    const { error } = await client.from('trusted_devices').upsert({
      user_id: user.id,
      device_type: device.type,
      device_icon: device.icon,
      user_agent: navigator.userAgent,
      last_seen: new Date().toISOString()
    }, {
      onConflict: 'user_id,user_agent',
      ignoreDuplicates: false
    });

    if (error) {
      console.warn('⚠️ Could not register device:', error.message);
    } else {
      console.log('✅ Device registered:', device.type);
    }
  } catch (err) {
    console.warn('⚠️ Device registration error:', err);
  }
}

/**
 * Load trusted devices from Supabase
 */
async function loadTrustedDevices() {
  const client = window.supabaseClient;
  if (!client) {
    console.warn('⚠️ Cannot load devices: Supabase not available');
    return;
  }

  try {
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;

    const { data: devices, error } = await client
      .from('trusted_devices')
      .select('*')
      .eq('user_id', user.id)
      .order('last_seen', { ascending: false });

    if (error) {
      console.warn('⚠️ Could not load devices:', error.message);
      return;
    }

    renderTrustedDevices(devices || []);
    console.log('✅ Loaded trusted devices:', devices?.length || 0);
  } catch (err) {
    console.warn('⚠️ Load devices error:', err);
  }
}

/**
 * Render trusted devices in the UI
 * @param {Array} devices - Array of device objects
 */
function renderTrustedDevices(devices) {
  const container = document.getElementById('trusted-devices-list');
  if (!container) return;

  if (!devices || devices.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:var(--space-6);color:var(--muted)">
        <p>Ingen betroede enheder registreret endnu.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = devices.map((device, index) => {
    const iconSvg = getDeviceIcon(device.device_icon);
    const gradientColors = getDeviceGradient(device.device_icon);
    const lastSeen = formatDeviceDate(device.last_seen);

    return `
      <div style="display:flex;align-items:center;gap:var(--space-4);padding:var(--space-4);background:var(--bg3);border-radius:var(--radius-sm)">
        <div style="width:56px;height:56px;background:${gradientColors};border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          ${iconSvg}
        </div>
        <div style="flex:1">
          <div style="font-weight:var(--font-weight-semibold);font-size:var(--font-size-base);margin-bottom:var(--space-1)">${escapeHtml(device.device_type)}</div>
          <div style="font-size:var(--font-size-sm);color:var(--muted)">Sidst set ${lastSeen}</div>
        </div>
        <button class="btn btn-secondary" onclick="removeTrustedDevice('${device.id}')">Fjern</button>
      </div>
    `;
  }).join('');
}

/**
 * Get SVG icon for device type
 */
function getDeviceIcon(iconType) {
  switch (iconType) {
    case 'phone':
      return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>';
    case 'tablet':
      return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>';
    case 'laptop':
      return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="20" x2="22" y2="20"/></svg>';
    default:
      return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
  }
}

/**
 * Get gradient colors for device type
 */
function getDeviceGradient(iconType) {
  switch (iconType) {
    case 'phone':
      return 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)';
    case 'tablet':
      return 'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)';
    case 'laptop':
      return 'linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)';
    default:
      return 'var(--bg2)';
  }
}

/**
 * Format device last seen date
 */
function formatDeviceDate(isoDate) {
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year}, ${hours}.${minutes}`;
}

/**
 * Remove a trusted device
 */
async function removeTrustedDevice(deviceId) {
  if (!confirm('Er du sikker på, at du vil fjerne denne enhed fra dine betroede enheder?')) {
    return;
  }

  const client = window.supabaseClient;
  if (!client) {
    console.warn('⚠️ Cannot remove device: Supabase not available');
    return;
  }

  try {
    const { error } = await client
      .from('trusted_devices')
      .delete()
      .eq('id', deviceId);

    if (error) {
      console.error('❌ Could not remove device:', error.message);
      alert('Kunne ikke fjerne enheden. Prøv igen.');
      return;
    }

    // Reload the devices list
    await loadTrustedDevices();
    console.log('✅ Device removed:', deviceId);
  } catch (err) {
    console.error('❌ Remove device error:', err);
    alert('Kunne ikke fjerne enheden. Prøv igen.');
  }
}


// =====================================================
// SESSION MANAGEMENT - Rolle-baseret timeout med inaktivitets-prompt
// =====================================================
const SESSION_KEY = 'orderflow_session';
const SESSION_DURATION_ADMIN = 30 * 60 * 1000;     // 30 minutter for admin/employee
const SESSION_DURATION_CUSTOMER = 10 * 60 * 1000;  // 10 minutter for customer/demo
const INACTIVITY_WARNING_TIME = 30 * 1000;         // 30 sek warning før logout
let sessionTimeoutId = null;
let warningTimeoutId = null;
let countdownInterval = null;

// Hent session duration baseret på brugerindstilling eller rolle
function getSessionDuration() {
  // Check for user-saved timeout setting
  let savedTimeout = null;
  try {
    savedTimeout = localStorage.getItem('orderflow_session_timeout');
  } catch (err) {
    savedTimeout = null;
  }
  if (savedTimeout) {
    const timeout = parseInt(savedTimeout, 10);
    if (timeout > 0) return timeout;
  }
  // Fallback to role-based defaults
  const role = currentUser?.role;
  if (role === 'admin' || role === 'employee') {
    return SESSION_DURATION_ADMIN;
  }
  return SESSION_DURATION_CUSTOMER;
}

// Save session timeout setting
function saveSessionTimeoutSetting() {
  const select = document.getElementById('session-timeout-setting');
  if (select) {
    const value = select.value;
    localStorage.setItem('orderflow_session_timeout', value);
    resetSessionTimeout();
    toast('Session timeout gemt', 'success');
  }
}

// Load session timeout setting into select element
function loadSessionTimeoutSetting() {
  const select = document.getElementById('session-timeout-setting');
  const saved = localStorage.getItem('orderflow_session_timeout');
  if (select && saved) {
    select.value = saved;
  }
}

function persistSession(user) {
  const duration = (user?.role === 'admin' || user?.role === 'employee')
    ? SESSION_DURATION_ADMIN
    : SESSION_DURATION_CUSTOMER;
  const sessionData = {
    user: user,
    expiresAt: Date.now() + duration
  };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  } catch (err) {
    // Safari private mode can throw on setItem. Don't block login on persistence.
    console.warn('⚠️ Could not persist session to localStorage:', err?.message || err);
  }
  console.log('💾 Session saved, expires:', new Date(sessionData.expiresAt).toLocaleString());
  startSessionTimeout();
}

function restoreSession() {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;

    const session = JSON.parse(stored);
    if (Date.now() > session.expiresAt) {
      console.log('⏰ Session expired, clearing...');
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    console.log('🔄 Restoring session for:', session.user.email);
    // Delay startSessionTimeout until after currentUser is set
    setTimeout(() => startSessionTimeout(), 100);
    return session.user;
  } catch (err) {
    console.warn('⚠️ Could not restore session:', err);
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  if (sessionTimeoutId) {
    clearTimeout(sessionTimeoutId);
    sessionTimeoutId = null;
  }
  if (warningTimeoutId) {
    clearTimeout(warningTimeoutId);
    warningTimeoutId = null;
  }
  hideInactivityWarning();
  console.log('🗑️ Session cleared');
}

function startSessionTimeout() {
  // Clear existing timeouts
  if (sessionTimeoutId) clearTimeout(sessionTimeoutId);
  if (warningTimeoutId) clearTimeout(warningTimeoutId);

  const duration = getSessionDuration();
  const warningTime = Math.max(0, duration - INACTIVITY_WARNING_TIME);

  console.log(`⏱️ Session timeout set: ${duration/1000}s (warning at ${warningTime/1000}s)`);

  // Vis warning 30 sek før logout
  warningTimeoutId = setTimeout(() => {
    showInactivityWarning();
  }, warningTime);

  // Logout efter fuld duration
  sessionTimeoutId = setTimeout(() => {
    hideInactivityWarning();
    console.log('⏰ Session timeout - logging out due to inactivity');
    toast('Session udløbet - log venligst ind igen', 'warning');
    logout();
  }, duration);
}

function resetSessionTimeout() {
  // Skjul warning hvis den vises
  hideInactivityWarning();

  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) {
    try {
      const session = JSON.parse(stored);
      const duration = getSessionDuration();
      session.expiresAt = Date.now() + duration;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      startSessionTimeout();
    } catch (err) {
      console.warn('⚠️ Could not reset session:', err);
    }
  }
}

// Inaktivitets-warning modal
function showInactivityWarning() {
  let modal = document.getElementById('inactivity-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'inactivity-modal';
    modal.innerHTML = `
      <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:99999;display:flex;align-items:center;justify-content:center;">
        <div style="background:var(--card-bg, #1a1a2e);padding:2rem;border-radius:16px;text-align:center;max-width:400px;box-shadow:0 20px 60px rgba(0,0,0,0.4);">
          <h3 style="margin-bottom:1rem;color:var(--text-primary, #fff);font-size:1.25rem;">Er du stadig der?</h3>
          <p style="margin-bottom:1.5rem;color:var(--text-secondary, #aaa);">Du vil blive logget ud om <span id="inactivity-countdown" style="font-weight:bold;color:var(--accent, #2dd4bf);">30</span> sekunder.</p>
          <button onclick="dismissInactivityWarning()" style="padding:0.75rem 2rem;background:var(--accent, #2dd4bf);color:#000;border:none;border-radius:8px;cursor:pointer;font-size:1rem;font-weight:500;transition:transform 0.2s;">Ja, jeg er her</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.style.display = 'block';
  startInactivityCountdown();
}

function hideInactivityWarning() {
  const modal = document.getElementById('inactivity-modal');
  if (modal) modal.style.display = 'none';
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

function dismissInactivityWarning() {
  hideInactivityWarning();
  resetSessionTimeout();
  console.log('✅ User confirmed activity, session extended');
}

function startInactivityCountdown() {
  let seconds = 30;
  const el = document.getElementById('inactivity-countdown');
  if (countdownInterval) clearInterval(countdownInterval);
  if (el) el.textContent = seconds;

  countdownInterval = setInterval(() => {
    seconds--;
    if (el) el.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      // Auto-logout when countdown reaches 0
      hideInactivityWarning();
      console.log('⏰ Session expired - logging out');
      handleLogout();
    }
  }, 1000);
}

// Track user activity to reset session timeout
function initActivityTracking() {
  const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
  let lastActivity = Date.now();

  activityEvents.forEach(event => {
    document.addEventListener(event, () => {
      // Throttle: only reset if more than 30 seconds since last reset
      if (Date.now() - lastActivity > 30000) {
        lastActivity = Date.now();
        resetSessionTimeout();
      }
    }, { passive: true });
  });
}

// Initialize activity tracking when DOM is ready
document.addEventListener('DOMContentLoaded', initActivityTracking);

var supabaseClient = window.supabaseClient || null;

// Sync local alias with supabase-client.js (which already declares `let supabase`)
supabase = supabaseClient || supabase;

if (typeof window.waitForSupabase === 'function') {
  window.waitForSupabase()
    .then((client) => {
      if (client) {
        supabaseClient = client;
        supabase = client;
      }
    })
    .catch((err) => {
      console.warn('⚠️ Supabase client not ready in app.js bootstrap:', err?.message || err);

// =====================================================
// AUTH
// =====================================================
// Auth view navigation — replaces old showAuthTab
function showAuthView(viewName) {
  var views = document.querySelectorAll('.auth-view');
  views.forEach(function(v) { v.classList.remove('active'); });
  var target = document.getElementById('auth-view-' + viewName);
  if (target) target.classList.add('active');
  // Also hide 2FA form when switching views
  var twoFa = document.getElementById('2fa-challenge-form');
  if (twoFa && viewName !== '2fa') twoFa.style.display = 'none';
  // Clear error
  var err = document.getElementById('auth-error');
  if (err) err.style.display = 'none';
}

// Backwards compatibility
function showAuthTab(tab) {
  showAuthView(tab === 'signup' ? 'signup' : 'login');
}

// Toggle password visibility — see full implementation at line ~23428

// Password setup link expiry (used for invite/reset links)
const PASSWORD_LINK_EXPIRY_STORAGE_KEY = 'orderflow_password_link_expiry_minutes';
const PASSWORD_LINK_EXPIRY_DEFAULT_MINUTES = 10;
const PASSWORD_LINK_EXPIRY_MIN_MINUTES = 1;
const PASSWORD_LINK_EXPIRY_MAX_MINUTES = 120;

function sanitizePasswordLinkExpiryMinutes(rawValue) {
  var parsed = parseInt(rawValue, 10);
  if (!Number.isFinite(parsed)) return PASSWORD_LINK_EXPIRY_DEFAULT_MINUTES;
  if (parsed < PASSWORD_LINK_EXPIRY_MIN_MINUTES) return PASSWORD_LINK_EXPIRY_MIN_MINUTES;
  if (parsed > PASSWORD_LINK_EXPIRY_MAX_MINUTES) return PASSWORD_LINK_EXPIRY_MAX_MINUTES;
  return parsed;
}

function getConfiguredPasswordLinkExpiryMinutes() {
  try {
    var stored = localStorage.getItem(PASSWORD_LINK_EXPIRY_STORAGE_KEY);
    return sanitizePasswordLinkExpiryMinutes(stored);
  } catch (err) {
    return PASSWORD_LINK_EXPIRY_DEFAULT_MINUTES;
  }
}

function setConfiguredPasswordLinkExpiryMinutes(rawValue, options = {}) {
  var minutes = sanitizePasswordLinkExpiryMinutes(rawValue);
  try {
    localStorage.setItem(PASSWORD_LINK_EXPIRY_STORAGE_KEY, String(minutes));
  } catch (err) {
    console.warn('Could not persist password link expiry setting:', err);
  }

  if (!options.silent && typeof toast === 'function') {
    toast('Link udløbstid gemt: ' + minutes + ' min.', 'success');
  }

  var statusEl = document.getElementById('cms-password-link-expiry-status');
  if (statusEl) {
    statusEl.textContent = 'Gemt (' + minutes + ' min)';
    statusEl.style.display = 'inline';
    setTimeout(function() {
      if (statusEl) statusEl.style.display = 'none';
    }, 2200);
  }

  return minutes;
}

function buildPasswordSetupRedirectUrl() {
  var minutes = getConfiguredPasswordLinkExpiryMinutes();
  var expiresAt = Date.now() + (minutes * 60 * 1000);
  var url = new URL(window.location.origin + '/setup-password.html');
  url.searchParams.set('flow_pw_exp', String(expiresAt));
  url.searchParams.set('flow_pw_ttl', String(minutes));
  return url.toString();
}

function renderCMSPasswordLinkSettings() {
  var inputEl = document.getElementById('cms-password-link-expiry-minutes');
  if (!inputEl) return;
  inputEl.value = String(getConfiguredPasswordLinkExpiryMinutes());
}

function handleCMSPasswordLinkExpiryInput(inputOrValue) {
  var value = (inputOrValue && typeof inputOrValue === 'object' && 'value' in inputOrValue)
    ? inputOrValue.value
    : inputOrValue;
  var sanitized = sanitizePasswordLinkExpiryMinutes(value);

  var inputEl = document.getElementById('cms-password-link-expiry-minutes');
  if (inputEl) inputEl.value = String(sanitized);
}

function saveCMSPasswordLinkExpirySetting() {
  var inputEl = document.getElementById('cms-password-link-expiry-minutes');
  if (!inputEl) return;
  setConfiguredPasswordLinkExpiryMinutes(inputEl.value);
}

// Forgot password — send reset email via Supabase
var forgotPasswordEmail = '';
async function handleForgotPassword(e) {
  e.preventDefault();
  var email = document.getElementById('forgot-email').value;
  if (!email) return;
  forgotPasswordEmail = email;

  try {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      var redirectUrl = buildPasswordSetupRedirectUrl();
      var result = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });
      if (result.error) {
        showAuthError(result.error.message);
        return;
      }
    }
  } catch (err) {
    console.warn('Password reset error:', err);
  }

  // Show email sent view regardless (don't reveal if email exists)
  var display = document.getElementById('forgot-email-display');
  if (display) display.textContent = email;
  showAuthView('email-sent');
  startResendTimer();
}

// Resend timer
var resendTimerInterval = null;
function startResendTimer() {
  var seconds = 30;
  var timerEl = document.getElementById('resend-timer');
  var btnEl = document.getElementById('resend-btn');
  var textEl = document.getElementById('resend-timer-text');
  if (btnEl) btnEl.disabled = true;
  if (textEl) textEl.style.display = 'inline';
  if (btnEl) btnEl.style.display = 'none';

  if (resendTimerInterval) clearInterval(resendTimerInterval);
  resendTimerInterval = setInterval(function() {
    seconds--;
    if (timerEl) {
      var m = Math.floor(seconds / 60);
      var s = seconds % 60;
      timerEl.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }
    if (seconds <= 0) {
      clearInterval(resendTimerInterval);
      if (textEl) textEl.style.display = 'none';
      if (btnEl) { btnEl.style.display = 'inline'; btnEl.disabled = false; }
    }
  }, 1000);
}

// Resend reset email
async function resendResetEmail() {
  if (!forgotPasswordEmail) return;
  try {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      var redirectUrl = buildPasswordSetupRedirectUrl();
      await supabaseClient.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: redirectUrl
      });
    }
  } catch (err) {
    console.warn('Resend error:', err);
  }
  startResendTimer();
}

// Reset password — called after PASSWORD_RECOVERY event
async function handleResetPassword(e) {
  e.preventDefault();
  var pw = document.getElementById('reset-password').value;
  var pwConfirm = document.getElementById('reset-password-confirm').value;

  if (pw !== pwConfirm) {
    showAuthError('Adgangskoderne matcher ikke.');
    return;
  }
  if (pw.length < 6) {
    showAuthError('Adgangskoden skal være mindst 6 tegn.');
    return;
  }

  try {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      var result = await supabaseClient.auth.updateUser({ password: pw });
      if (result.error) {
        showAuthError(result.error.message);
        return;
      }
      if (typeof toast === 'function') toast('Adgangskode nulstillet!', 'success');
      showAuthView('login');
    }
  } catch (err) {
    showAuthError('Kunne ikke nulstille adgangskode. Prøv igen.');
  }
}

// Social login via Supabase Auth
async function socialLoginGoogle() {
  try {
    const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/app/' }
    });
    if (error) throw error;
  } catch (err) {
    if (typeof toast === 'function') toast('Google login fejlede: ' + err.message, 'error');
  }
}

async function socialLoginFacebook() {
  try {
    const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: window.location.origin + '/app/' }
    });
    if (error) throw error;
  } catch (err) {
    if (typeof toast === 'function') toast('Facebook login fejlede: ' + err.message, 'error');
  }
}
window.socialLoginGoogle = socialLoginGoogle;
window.socialLoginFacebook = socialLoginFacebook;

async function handleLogin(e) {
  e.preventDefault();
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const submitBtn = e?.target?.querySelector?.('button[type="submit"]');
  const email = (emailInput?.value || '').trim();
  const password = passwordInput?.value || '';

  if (!email || !password) {
    showAuthError('Indtast email og adgangskode.');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logger ind...';
  }

  // Wait for Supabase to initialize (max 5 seconds)
  if (typeof window.waitForSupabase === 'function') {
    try {
      await Promise.race([
        window.waitForSupabase(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      console.log('✅ Supabase client ready for user login');
    } catch (err) {
      console.warn('⚠️ Supabase initialization timeout for user login');
      showAuthError('Kunne ikke forbinde til server. Prøv igen om et øjeblik.');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Log ind';
      }
      return;
    }
  }

  // Check if Supabase is available
  const authClient = window.supabaseClient || supabaseClient || supabase || null;

  if (!authClient?.auth?.signInWithPassword) {
    console.error('❌ Supabase not available after waiting');

    // Fallback for admin users
    const ADMIN_EMAILS = ['martinsarvio@hotmail.com'];
    if (ADMIN_EMAILS.includes(email.toLowerCase())) {
      console.log('🔑 Using local admin fallback...');
      loginAdminLocal();
      return;
    }

    showAuthError('Kunne ikke forbinde til server. Prøv igen.');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Log ind';
    }
    return;
  }

  try {
    _loginSubmitInProgress = true;
    console.log('🔑 Attempting login with email:', email);
    const { data, error } = await authClient.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
    console.log('✅ Login successful:', data.user.email);

    // Admin emails list - these users always get admin role
    const ADMIN_EMAILS = ['martinsarvio@hotmail.com'];
    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

    // Determine user role
    let userRole = isAdmin ? 'admin' : 'user';

    // Try to get role from database
    if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUserRole) {
      try {
        const dbRole = await SupabaseDB.getUserRole(data.user.id);
        if (dbRole && ['admin', 'employee', 'customer'].includes(dbRole)) {
          userRole = dbRole;
        }
      } catch (err) {
        console.warn('⚠️ Could not get user role from database:', err);
      }
    }

    // Build temporary user object for 2FA check
    const tempUser = {
      ...data.user,
      role: userRole
    };

    console.log(`👤 User role: ${tempUser.role}${isAdmin ? ' (admin)' : ''}`);

    // =====================================================
    // 2FA CHECK - Only for admin and employee roles
    // =====================================================
    if (typeof check2FARequired === 'function' && (userRole === 'admin' || userRole === 'employee')) {
      console.log('🔐 Checking 2FA requirements...');

      const twoFACheck = await check2FARequired(tempUser);

      if (twoFACheck.required) {
        if (twoFACheck.settings || twoFACheck.methods) {
          // User has 2FA set up - show challenge
          console.log('🔐 2FA required - showing challenge');

          // Store pending login data
          window._pending2FALogin = {
            user: tempUser,
            settings: twoFACheck.settings,
            isAdmin: isAdmin
          };

          // Hide login form and show 2FA challenge
          show2FAChallenge(tempUser, twoFACheck.settings);
          return; // Wait for 2FA verification

        } else if (userRole === 'employee') {
          // Employee without 2FA - force setup
          console.log('🔐 Employee requires 2FA setup');

          // Store pending login data
          window._pending2FALogin = {
            user: tempUser,
            settings: null,
            isAdmin: isAdmin
          };

          // Show 2FA setup required screen
          show2FASetupRequired(tempUser);
          return; // Wait for 2FA setup
        }
        // Admin without 2FA can proceed (they can opt-out)
      }
    }

    // =====================================================
    // COMPLETE LOGIN (no 2FA required or admin opt-out)
    // =====================================================
    await finishLogin(tempUser, isAdmin);

  } catch (err) {
    const message = err?.message || err?.error_description || 'Login mislykkedes. Tjek email og kode.';
    showAuthError(message);
  } finally {
    _loginSubmitInProgress = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Log ind';
    }
  }
}

/**
 * Play premium login transition animation
 * Logo zoom effect with form blur
 * @returns {Promise} Resolves when animation completes
 */
function playLoginTransition() {
  return new Promise((resolve) => {
    console.log('✨ Starting login transition...');

    const authCard = document.querySelector('.auth-card');
    const authLogo = document.querySelector('.auth-logo');
    const authScreen = document.getElementById('auth-screen');

    // Step 1: Blur and fade out the login form (0.8s)
    if (authCard) {
      authCard.style.transition = 'all 0.8s ease';
      authCard.style.filter = 'blur(20px)';
      authCard.style.opacity = '0';
    }

    // Step 2: Center the logo and zoom (2s) - reduceret zoom fra 3.5 til 2
    if (authLogo) {
      const logoRect = authLogo.getBoundingClientRect();
      const screenCenterY = window.innerHeight / 2;
      const logoCenterY = logoRect.top + logoRect.height / 2;
      const offsetY = screenCenterY - logoCenterY;

      authLogo.style.transition = 'all 2s ease-in-out';
      authLogo.style.transform = `translateY(${offsetY}px) scale(2)`;
    }

    // Wait for zoom animation (2s), then blur entire screen (0.5s)
    setTimeout(() => {
      // Blur hele auth-screen (baggrund + logo)
      if (authScreen) {
        authScreen.style.transition = 'all 0.5s ease';
        authScreen.style.filter = 'blur(20px)';
        authScreen.style.opacity = '0';
      }

      setTimeout(() => {
        // Reset styles
        if (authCard) {
          authCard.style.filter = '';
          authCard.style.opacity = '';
        }
        if (authLogo) {
          authLogo.style.transform = '';
          authLogo.style.filter = '';
          authLogo.style.opacity = '';
        }
        if (authScreen) {
          authScreen.style.filter = '';
          authScreen.style.opacity = '';
        }
        console.log('✨ Login transition complete');
        resolve();
      }, 500);
    }, 2000);
  });
}

/**
 * Complete the login process after authentication (and optional 2FA)
 */
async function finishLogin(user, isAdmin) {
  currentUser = user;

  // Persist session for "remember me" functionality
  persistSession(user);

  // Load restaurants from Supabase
  if (typeof SupabaseDB !== 'undefined') {
    try {
      const dbRestaurants = await SupabaseDB.getRestaurants(currentUser.id);
      restaurants = dbRestaurants || [];
      console.log('✅ Loaded restaurants from Supabase:', restaurants.length);

      // Also merge any locally persisted restaurants (created while offline)
      loadPersistedRestaurants();
      console.log('📦 Total restaurants after merge:', restaurants.length);

      // Sync any locally-created restaurants (local-* IDs) to Supabase
      await syncLocalRestaurantsToSupabase();
    } catch (err) {
      console.warn('⚠️ Could not load restaurants from Supabase:', err);
      restaurants = [];
      // Fall back to localStorage
      loadPersistedRestaurants();
      console.log('📦 Loaded restaurants from localStorage:', restaurants.length);
    }

    // Initialize real-time sync
    if (typeof RealtimeSync !== 'undefined') {
      await RealtimeSync.init(currentUser.id);
    }

    // Load API settings from Supabase
    if (typeof loadAllApiSettings === 'function') {
      await loadAllApiSettings();
    }
  } else {
    // Supabase not available, use localStorage
    restaurants = [];
    loadPersistedRestaurants();
    console.log('📦 Loaded restaurants from localStorage (no Supabase):', restaurants.length);
  }

  // Play login transition animation
  await playLoginTransition();

  showApp();

  // Log user login activity
  logActivity('login', 'Bruger login', {
    category: 'system',
    user: currentUser.email,
    role: currentUser.role
  });

  // Register device for trusted devices tracking
  registerDevice();
}

// =====================================================
// SIGNUP FLOW (3 STEPS)
// =====================================================

let signupInviteCount = 1;
let selectedIntegrations = [];

// Signup step navigation
function nextSignupStep(step) {
  // Validate step 1 before going to step 2
  if (step === 2) {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-password-confirm')?.value || '';

    if (!email || !password) {
      showAuthError('Udfyld email og password');
      return;
    }
    if (password.length < 6) {
      showAuthError('Password skal være mindst 6 tegn');
      return;
    }
    if (password !== confirm) {
      showAuthError('Passwords matcher ikke');
      return;
    }
  }

  // Validate step 2 before going to step 3
  if (step === 3) {
    const company = document.getElementById('signup-company').value;
    if (!company) {
      showAuthError('Virksomhedsnavn er påkrævet');
      return;
    }
  }

  // Hide all steps
  document.querySelectorAll('.signup-step').forEach(s => s.style.display = 'none');
  document.getElementById(`signup-step-${step}`).style.display = 'block';

  // Update step dots (now 3 steps)
  document.querySelectorAll('.step-dot').forEach((dot, i) => {
    dot.style.background = (i + 1) <= step ? 'var(--accent)' : 'var(--border)';
  });

  // Clear any error
  document.getElementById('auth-error').style.display = 'none';
}

function prevSignupStep(step) {
  document.querySelectorAll('.signup-step').forEach(s => s.style.display = 'none');
  document.getElementById(`signup-step-${step}`).style.display = 'block';

  // Update step dots
  document.querySelectorAll('.step-dot').forEach((dot, i) => {
    dot.style.background = (i + 1) <= step ? 'var(--accent)' : 'var(--border)';
  });
}

// Team invite field management
function addInviteField() {
  signupInviteCount++;
  const container = document.getElementById('team-invite-list');
  const newRow = document.createElement('div');
  newRow.className = 'invite-row';
  newRow.innerHTML = `
    <input type="email" class="input invite-email" placeholder="kollega@email.dk">
    <select class="input invite-role">
      <option value="staff">Medarbejder</option>
      <option value="manager">Manager</option>
    </select>
    <button type="button" class="btn-icon-remove" onclick="this.parentElement.remove()">×</button>
  `;
  container.appendChild(newRow);
}

// Integration toggle
function toggleIntegration(integration) {
  const btn = document.querySelector(`[data-integration="${integration}"]`);
  const index = selectedIntegrations.indexOf(integration);

  if (index > -1) {
    selectedIntegrations.splice(index, 1);
    btn.classList.remove('selected');
  } else {
    selectedIntegrations.push(integration);
    btn.classList.add('selected');
  }
}

function getSelectedIntegrations() {
  return selectedIntegrations;
}

// CSV Import
let currentImportType = null;

function showImportDialog(type) {
  currentImportType = type;
  document.getElementById('csv-import-input').click();
}

async function handleCsvImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const rows = text.split('\n').map(row => row.split(','));
    const headers = rows[0].map(h => h.trim().toLowerCase());
    const data = rows.slice(1).filter(row => row.length > 1);

    if (currentImportType === 'customers') {
      const customers = data.map(row => ({
        name: row[headers.indexOf('name')] || row[0],
        phone: row[headers.indexOf('phone')] || row[headers.indexOf('telefon')] || row[1],
        email: row[headers.indexOf('email')] || row[2],
        address: row[headers.indexOf('address')] || row[headers.indexOf('adresse')] || row[3]
      }));
      window.pendingImportData = { type: 'customers', data: customers };
      toast(`${customers.length} kunder klar til import`, 'success');
    } else if (currentImportType === 'products') {
      const products = data.map(row => ({
        name: row[headers.indexOf('name')] || row[headers.indexOf('navn')] || row[0],
        price: parseFloat(row[headers.indexOf('price')] || row[headers.indexOf('pris')] || row[1]) || 0,
        category: row[headers.indexOf('category')] || row[headers.indexOf('kategori')] || row[2]
      }));
      window.pendingImportData = { type: 'products', data: products };
      toast(`${products.length} produkter klar til import`, 'success');
    }
  } catch (err) {
    toast('Fejl ved læsning af CSV fil', 'error');
    console.error('CSV import error:', err);
  }

  event.target.value = '';
}

async function sendTeamInvitations(userId, restaurantId) {
  const inviteRows = document.querySelectorAll('.invite-row');
  const invitations = [];

  inviteRows.forEach(row => {
    const emailEl = row.querySelector('.invite-email');
    const roleEl = row.querySelector('.invite-role');
    const email = emailEl ? emailEl.value.trim() : '';
    const role = roleEl ? roleEl.value : 'staff';
    if (email) {
      invitations.push({ email, role });
    }
  });

  if (invitations.length === 0) return;

  try {
    for (const invite of invitations) {
      await supabaseClient.from('pending_invitations').insert({
        inviter_id: userId,
        restaurant_id: restaurantId,
        email: invite.email,
        role: invite.role,
        status: 'pending',
        created_at: new Date().toISOString()
      });
      console.log(`📧 Invitation gemt til ${invite.email} som ${invite.role}`);
    }
    toast(`${invitations.length} invitationer sendt`, 'success');
  } catch (err) {
    console.warn('⚠️ Kunne ikke gemme invitationer:', err.message);
  }
}

async function processPendingImports(userId, restaurantId) {
  if (!window.pendingImportData) return;

  const { type, data } = window.pendingImportData;

  try {
    if (type === 'customers') {
      for (const customer of data) {
        await supabaseClient.from('customer_contacts').insert({
          restaurant_id: restaurantId,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          created_at: new Date().toISOString()
        });
      }
      toast(`${data.length} kunder importeret`, 'success');
    } else if (type === 'products') {
      for (const product of data) {
        await supabaseClient.from('products').insert({
          user_id: userId,
          restaurant_id: restaurantId,
          name: product.name,
          price: product.price,
          category: product.category,
          created_at: new Date().toISOString()
        });
      }
      toast(`${data.length} produkter importeret`, 'success');
    }
  } catch (err) {
    console.warn('⚠️ Kunne ikke importere data:', err.message);
  }

  window.pendingImportData = null;
}

function resetSignupForm() {
  // Reset til step 1
  document.querySelectorAll('.signup-step').forEach(s => s.style.display = 'none');
  const step1 = document.getElementById('signup-step-1');
  if (step1) step1.style.display = 'block';
  document.querySelectorAll('.step-dot').forEach((dot, i) => {
    dot.style.background = i === 0 ? 'var(--accent)' : 'var(--border)';
  });

  // Clear all fields
  const fields = ['signup-email', 'signup-password', 'signup-password-confirm', 'signup-company',
    'signup-cvr', 'signup-owner', 'signup-contact-name', 'signup-contact-email',
    'signup-phone', 'signup-address', 'signup-website'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  // Reset team invites
  const teamList = document.getElementById('team-invite-list');
  if (teamList) {
    teamList.innerHTML = `
      <div class="invite-row">
        <input type="email" class="input invite-email" placeholder="kollega@email.dk">
        <select class="input invite-role">
          <option value="staff">Medarbejder</option>
          <option value="manager">Manager</option>
        </select>
      </div>
    `;
  }
  signupInviteCount = 1;

  // Reset integrations
  selectedIntegrations = [];
  document.querySelectorAll('.integration-btn').forEach(btn => btn.classList.remove('selected'));

  // Reset import data
  window.pendingImportData = null;
}

async function handleSignup(e) {
  e.preventDefault();

  // New simplified signup form data
  const firstName = document.getElementById('signup-firstname')?.value || '';
  const lastName = document.getElementById('signup-lastname')?.value || '';
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  let authClient = supabase || window.supabaseClient || null;
  if (!authClient && typeof window.waitForSupabase === 'function') {
    try {
      authClient = await window.waitForSupabase();
      if (authClient) supabase = authClient;
    } catch (err) {
      console.warn('⚠️ Supabase not ready for signup:', err?.message || err);
    }
  }

  if (CONFIG.DEMO_MODE || !authClient) {
    loginDemo();
    return;
  }

  try {
    // Opret bruger i Supabase Auth
    const { data, error } = await authClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: (firstName + ' ' + lastName).trim()
        }
      }
    });

    if (error) throw error;

    // Success
    toast('Konto oprettet! Tjek din email for bekræftelse.', 'success');
    showAuthView('login');
  } catch (err) {
    showAuthError(err.message);
  }
}

async function loginDemo() {
  console.log('🎯 Demo login...');

  // Demo bruger med begrænset adgang
  currentUser = {
    id: 'demo-user-' + Date.now(),
    email: 'demo@orderflow.dk',
    user_metadata: { full_name: 'Demo Bruger' },
    role: ROLES.DEMO
  };

  // Load demo restaurant data
  restaurants = getDemoRestaurants();

  // Sæt demo restaurant som aktiv (for subpages)
  currentProfileRestaurantId = restaurants[0]?.id || 'demo-restaurant-1';
  localStorage.setItem('lastViewedCustomerId', currentProfileRestaurantId);
  console.log('📍 Demo restaurant ID sat:', currentProfileRestaurantId);

  // Play login transition animation
  await playLoginTransition();

  showApp();

  // VIGTIGT: Brug requestAnimationFrame for at sikre at DOM er færdig
  // Dette løser race condition hvor applyRoleBasedSidebar() blev kaldt før DOM var opdateret
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      applyRoleBasedSidebar();
      console.log('✅ Role-based sidebar applied after showApp() completed');

    });
  });

  toast('Demo mode aktiveret', 'info');
  console.log('👤 Logget ind som Demo bruger');
}

function getDemoRestaurants() {
  return [{
    id: 'demo-restaurant-1',
    name: 'Demo Pizzeria',
    status: 'demo',
    isDemo: true,
    cvr: '12345678',
    contact_phone: '+4512345678',
    contact_email: 'demo@pizzeria.dk',
    contact_name: 'Demo Kontakt',
    owner: 'Demo Ejer',
    phone: '+4512345678',
    email: 'demo@pizzeria.dk',
    address: 'Demovej 123, 2100 København',
    country: 'DK',
    industry: 'pizzeria',
    website: 'https://demo.orderflow.dk',
    created_at: new Date().toISOString(),
    orders_total: 127,
    revenue_total: 45890,
    ai_enabled: true,
    integration_status: 'active',
    // Workflow settings
    googleReviewUrl: 'https://g.page/demo-pizzeria/review',
    trustpilotUrl: 'https://trustpilot.com/review/demo-pizzeria',
    reorderEnabled: true,
    receiptEnabled: true,
    deliveryEnabled: true,
    // Opening hours
    openingHours: {
      mon: { enabled: true, open: '10:00', close: '22:00' },
      tue: { enabled: true, open: '10:00', close: '22:00' },
      wed: { enabled: true, open: '10:00', close: '22:00' },
      thu: { enabled: true, open: '10:00', close: '22:00' },
      fri: { enabled: true, open: '10:00', close: '23:00' },
      sat: { enabled: true, open: '11:00', close: '23:00' },
      sun: { enabled: true, open: '12:00', close: '21:00' }
    },
    // SMS messages
    messages: {
      'msg-welcome-text': 'Hej {{kunde}}! Tak for din interesse i Demo Pizzeria.',
      'msg-pending-text': 'Vi har modtaget din ordre og arbejder på den.',
      'msg-accepted-text': 'Din ordre er accepteret! Forventet ventetid: {{ventetid}} min.',
      'msg-preparing-text': 'Din ordre er nu under tilberedning.',
      'msg-ready-text': 'Din ordre er klar til afhentning/levering!',
      'msg-picked-up-text': 'Tak for din ordre hos Demo Pizzeria!',
      'msg-closed-text': 'Vi har desværre lukket. Åbningstider: {{åbningstider}}',
      'msg-error-text': 'Beklager, der opstod en fejl. Prøv igen eller ring til os.'
    },
    metadata: {
      industry: 'pizzeria',
      website: 'https://demo.orderflow.dk'
    }
  }];
}

/**
 * Admin Login Function
 * Prefills admin email and asks for password in the normal login form.
 */
async function loginAdmin() {
  const adminEmail = 'martinsarvio@hotmail.com';
  try {
    const emailEl = document.getElementById('login-email');
    const passwordEl = document.getElementById('login-password');
    if (emailEl) emailEl.value = adminEmail;
    if (passwordEl) {
      passwordEl.value = '';
      passwordEl.focus();
    }
    if (typeof toast === 'function') {
      toast('Indtast admin-adgangskode for at logge ind', 'info');
    }
  } catch (err) {
    console.warn('Could not prefill admin login form:', err);
  }
}

/**
 * Local Admin Login Fallback
 * Used when Supabase is not available
 */
async function loginAdminLocal() {
  console.log('🔑 Local admin login (fallback)...');

  // Resolve a valid UUID for admin user (required for Supabase operations)
  var adminId = null;
  var UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  // 1. Check localStorage for a previously stored real UUID
  var storedId = localStorage.getItem('orderflow_user_id');
  if (storedId && UUID_REGEX.test(storedId)) {
    adminId = storedId;
    console.log('🔑 Using stored UUID:', adminId);
  }

  // 2. Check orderflow-auth-token for cached session UUID
  if (!adminId) {
    try {
      var raw = localStorage.getItem('orderflow-auth-token');
      if (raw) {
        var parsed = JSON.parse(raw);
        var sessionId = parsed?.currentSession?.user?.id || parsed?.user?.id || parsed?.session?.user?.id;
        if (sessionId && UUID_REGEX.test(sessionId)) {
          adminId = sessionId;
          console.log('🔑 Using cached session UUID:', adminId);
        }
      }
    } catch (e) {}
  }

  // 3. Try Supabase auth.getUser() if client is available
  if (!adminId) {
    try {
      var authClient = window.supabaseClient;
      if (authClient?.auth?.getUser) {
        var resp = await authClient.auth.getUser();
        if (resp?.data?.user?.id && UUID_REGEX.test(resp.data.user.id)) {
          adminId = resp.data.user.id;
          console.log('🔑 Using Supabase auth UUID:', adminId);
        }
      }
    } catch (e) {}
  }

  // 4. No valid identity found — require proper login
  if (!adminId) {
    console.warn('🔑 No valid admin UUID found. Proper authentication required.');
    showAuthError('Kunne ikke verificere identitet. Log ind med email og adgangskode.');
    return;
  }

  // Persist for future sessions
  localStorage.setItem('orderflow_user_id', adminId);

  // Resolve user profile from cached auth data
  let adminEmail = 'admin@orderflow.dk';
  let adminName = 'Administrator';
  try {
    const raw = localStorage.getItem('orderflow-auth-token');
    if (raw) {
      const parsed = JSON.parse(raw);
      const user = parsed?.currentSession?.user || parsed?.user || parsed?.session?.user;
      if (user?.email) adminEmail = user.email;
      if (user?.user_metadata?.full_name) adminName = user.user_metadata.full_name;
    }
  } catch (e) {}

  const tempUser = {
    id: adminId,
    email: adminEmail,
    user_metadata: {
      full_name: adminName
    },
    role: 'admin'
  };

  // Check 2FA from localStorage
  try {
    const localSettings = JSON.parse(localStorage.getItem('orderflow_2fa_settings') || '{}');
    const hasTOTP = localSettings.totp_enabled && localSettings.totp_confirmed;
    const hasEmail = localSettings.email_otp_enabled;

    console.log('🔐 Local 2FA Check:', { hasTOTP, hasEmail, localSettings });

    if (hasTOTP || hasEmail) {
      // Store pending login
      pending2FAUser = tempUser;
      pending2FASettings = localSettings;

      // Show 2FA challenge
      show2FAChallenge(tempUser, localSettings);
      return; // Wait for 2FA verification
    }
  } catch (e) {
    console.warn('Could not check local 2FA settings:', e);
  }

  // No 2FA - proceed with login
  currentUser = tempUser;
  restaurants = [];

  // Try to load from Supabase first (admin may have valid UUID now)
  if (typeof SupabaseDB !== 'undefined') {
    try {
      var dbRestaurants = await SupabaseDB.getRestaurants(currentUser.id);
      if (dbRestaurants && dbRestaurants.length > 0) {
        restaurants = dbRestaurants;
        console.log('✅ Loaded restaurants from Supabase (admin):', restaurants.length);
      }
    } catch (err) {
      console.warn('⚠️ Could not load from Supabase (admin):', err.message);
    }
  }

  // Merge locally persisted restaurants
  loadPersistedRestaurants();
  console.log('📦 Total restaurants after merge:', restaurants.length);

  // Sync local-only restaurants to Supabase
  await syncLocalRestaurantsToSupabase();

  // Play login transition animation
  await playLoginTransition();

  showApp();
  applyRoleBasedSidebar();

  // Log admin login activity
  logActivity('login', 'Administrator login (local)', {
    category: 'system',
    user: currentUser.email,
    role: currentUser.role
  });

  console.log('✅ Local admin logged in!');
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  const message = String(msg || 'Der opstod en fejl. Prøv igen.');
  if (el) {
    el.textContent = message;
    el.style.display = 'block';
  }
  if (typeof toast === 'function') {
    toast(message, 'error');
  }
}

function logout() {
  const authClient = supabase || window.supabaseClient;
  if (authClient?.auth) authClient.auth.signOut();
  clearSession(); // Clear persisted session
  resetAuthUI();
}

function resetAuthUI() {
  // KRITISK: Kun clear session hvis vi IKKE har en gyldig lokal session
  // Dette forhindrer Supabase auth events i at slette vores lokale session
  const hasLocalSession = localStorage.getItem(SESSION_KEY);
  if (!hasLocalSession) {
    currentUser = null;
    clearSession();
  } else {
    console.log('🛡️ resetAuthUI: Bevarer lokal session');
    return; // Stop her - bevar session
  }
  pending2FAUser = null;
  pending2FASettings = null;
  window._pending2FALogin = null;
  document.getElementById('app').classList.remove('active');
  document.getElementById('auth-screen').style.display = 'flex';
  showAuthView('login');
  const challengeForm = document.getElementById('2fa-challenge-form');
  const setupRequired = document.getElementById('2fa-setup-required');

  if (challengeForm) challengeForm.style.display = 'none';
  if (setupRequired) setupRequired.style.display = 'none';

  const codeInput = document.getElementById('2fa-code-input');
  const emailCodeInput = document.getElementById('2fa-email-code-input');
  const backupCodeInput = document.getElementById('2fa-backup-code-input');
  if (codeInput) codeInput.value = '';
  if (emailCodeInput) emailCodeInput.value = '';
  if (backupCodeInput) backupCodeInput.value = '';
}


document.addEventListener('DOMContentLoaded', () => {
  renderHeaderNotifications();
});

async function initAuthStateListener() {
  if (typeof window.waitForSupabase === 'function') {
    try {
      await window.waitForSupabase();
    } catch (err) {
      console.warn('Supabase not ready for auth listener:', err);
    }
  }

  const authClient = window.supabaseClient || supabaseClient || supabase || null;

  if (!authClient?.auth?.onAuthStateChange) return;

  authClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESH_FAILED') {
      resetAuthUI();
      return;
    }

    if (event === 'PASSWORD_RECOVERY') {
      // User clicked the reset link from email — show reset password form
      document.getElementById('auth-screen').style.display = 'flex';
      document.getElementById('app').classList.remove('active');
      showAuthView('reset');
      return;
    }

    // If the user is already signed in to Supabase (e.g. session persisted in browser),
    // we still need to "finishLogin()" so the app transitions out of the auth screen.
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
      attemptAutoLoginFromSupabaseSession(session, event);
      return;
    }
  });

  // Safety net: in some cases INITIAL_SESSION doesn't fire (timing/script load),
  // so we also proactively check the current session.
  if (authClient?.auth?.getSession) {
    authClient.auth.getSession()
      .then(({ data }) => {
        if (data?.session) attemptAutoLoginFromSupabaseSession(data.session, 'getSession');
      })
      .catch((err) => console.warn('Could not get Supabase session:', err));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // KRITISK: Restore session FØRST, FØR Supabase auth listener
  // Ellers vil Supabase's SIGNED_OUT event slette vores lokale session
  const savedUser = restoreSession();

  if (savedUser) {
    currentUser = savedUser;
    console.log('🔄 Session restored, showing app...');

    // Immediately show app to prevent flash of login screen
    showApp();
    applyRoleBasedSidebar();

    // Load restaurants in background
    (async () => {
      if (typeof SupabaseDB !== 'undefined') {
        try {
          const dbRestaurants = await SupabaseDB.getRestaurants(currentUser.id);
          restaurants = dbRestaurants || [];
          loadPersistedRestaurants();
          console.log('✅ Restaurants loaded from restored session:', restaurants.length);

          // Initialize real-time sync
          if (typeof RealtimeSync !== 'undefined') {
            await RealtimeSync.init(currentUser.id);
          }

          // Refresh dashboard if visible
          if (typeof loadDashboard === 'function') {
            loadDashboard();
          }
        } catch (err) {
          console.warn('⚠️ Could not load restaurants:', err);
          loadPersistedRestaurants();
        }
      } else {
        loadPersistedRestaurants();
      }
      console.log('✅ App restored from saved session');
    })();
  } else {
    // Kun init Supabase auth listener hvis INGEN lokal session
    // Dette forhindrer at Supabase sletter vores session
    initAuthStateListener();
  }
});

// ============================================================================
// Supabase Session -> App Login Bridge
// ============================================================================
let _supabaseAutoLoginHandled = false;
let _supabaseAutoLoginInProgress = false;
let _loginSubmitInProgress = false;

async function attemptAutoLoginFromSupabaseSession(session, sourceEvent) {
  try {
    if (_supabaseAutoLoginHandled || _supabaseAutoLoginInProgress) return;
    if (!session?.user?.id) return;
    if (sourceEvent === 'SIGNED_IN' && _loginSubmitInProgress) return;

    // If we already have our local app-session, do not override it.
    let hasLocalSession = false;
    try {
      hasLocalSession = !!localStorage.getItem(SESSION_KEY);
    } catch (err) {
      hasLocalSession = false;
    }
    if (hasLocalSession) return;

    _supabaseAutoLoginInProgress = true;

    const email = String(session.user.email || '').toLowerCase();
    const ADMIN_EMAILS = ['martinsarvio@hotmail.com'];
    const isAdmin = ADMIN_EMAILS.includes(email);

    let userRole = isAdmin ? 'admin' : 'user';

    // Try to resolve role from DB (non-blocking; will fall back to "user").
    if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUserRole) {
      try {
        const dbRole = await SupabaseDB.getUserRole(session.user.id);
        if (dbRole && ['admin', 'employee', 'customer'].includes(dbRole)) {
          userRole = dbRole;
        }
      } catch (err) {
        console.warn('⚠️ Could not get user role from database (auto-login):', err);
      }
    }

    const tempUser = {
      ...session.user,
      role: userRole
    };

    console.log(`🔁 Auto-login from Supabase session (${sourceEvent || 'unknown'}):`, {
      userId: tempUser.id,
      email: tempUser.email,
      role: tempUser.role
    });

    // Respect existing 2FA gating if configured for admin/employee.
    if (typeof check2FARequired === 'function' && (userRole === 'admin' || userRole === 'employee')) {
      try {
        const twoFACheck = await check2FARequired(tempUser);
        if (twoFACheck?.required) {
          if (twoFACheck.settings || twoFACheck.methods) {
            _supabaseAutoLoginHandled = true;
            window._pending2FALogin = {
              user: tempUser,
              settings: twoFACheck.settings,
              isAdmin: isAdmin
            };
            show2FAChallenge(tempUser, twoFACheck.settings);
            return;
          }
          if (userRole === 'employee') {
            _supabaseAutoLoginHandled = true;
            window._pending2FALogin = {
              user: tempUser,
              settings: null,
              isAdmin: isAdmin
            };
            show2FASetupRequired(tempUser);
            return;
          }
          // Admin without 2FA can proceed.
        }
      } catch (err) {
        console.warn('2FA check failed (auto-login):', err);
      }
    }

    await finishLogin(tempUser, isAdmin);
    _supabaseAutoLoginHandled = true;
  } catch (err) {
    console.warn('Auto-login from Supabase session failed:', err);
  } finally {
    _supabaseAutoLoginInProgress = false;
  }
}

// =====================================================
// HEADER DROPDOWN FUNKTIONER
// =====================================================
let activeDropdown = null;


async function check2FARequired(user) {
  try {
    // Get user role
    let roleData = null;
    try {
      roleData = await SupabaseDB.getUserRole(user.id);
    } catch (e) {
      console.warn('Could not get user role from DB:', e);
    }

    const role = roleData?.role || user.role || 'customer';
    const isEmployee = role === 'admin' || role === 'employee';

    // Customers and demo users skip 2FA
    if (!isEmployee) {
      return { required: false, canProceed: true };
    }

    // Get 2FA settings - try database first, then localStorage
    let settings = null;
    try {
      settings = await SupabaseDB.get2FASettings(user.id);
    } catch (e) {
      console.warn('Could not get 2FA settings from DB:', e);
    }

    // Fallback to localStorage if DB settings not found
    if (!settings || (!settings.totp_enabled && !settings.email_otp_enabled)) {
      try {
        const localSettings = JSON.parse(localStorage.getItem('orderflow_2fa_settings') || '{}');
        if (localSettings.totp_enabled || localSettings.email_otp_enabled) {
          settings = localSettings;
          console.log('📱 Using 2FA settings from localStorage');
        }
      } catch (e) {
        console.warn('Could not get 2FA settings from localStorage:', e);
      }
    }

    // Check if 2FA is configured
    const hasTOTP = settings?.totp_enabled && settings?.totp_confirmed;
    const hasEmail = settings?.email_otp_enabled;
    const hasAny2FA = hasTOTP || hasEmail;

    console.log('🔐 2FA Check:', {
      role,
      settings,
      hasTOTP,
      hasEmail,
      hasAny2FA,
      totp_enabled: settings?.totp_enabled,
      totp_confirmed: settings?.totp_confirmed
    });

    // Employee without 2FA - require setup
    if (isEmployee && !hasAny2FA && role !== 'admin') {
      return {
        required: true,
        canProceed: false,
        requiresSetup: true,
        message: 'Du skal aktivere 2FA for at fortsætte'
      };
    }

    // Admin without 2FA - can proceed (optional)
    if (role === 'admin' && !hasAny2FA) {
      return { required: false, canProceed: true };
    }

    // Has 2FA - show challenge
    if (hasAny2FA) {
      return {
        required: true,
        canProceed: false,
        settings: settings,
        methods: {
          totp: hasTOTP,
          email: hasEmail
        }
      };
    }

    return { required: false, canProceed: true };
  } catch (err) {
    console.error('check2FARequired error:', err);
    return { required: false, canProceed: true, error: err.message };
  }
}

/**
 * Show 2FA challenge UI
 */
function show2FAChallenge(user, settings) {
  pending2FAUser = user;
  pending2FASettings = settings;

  // Hide all auth views, show 2FA challenge
  document.querySelectorAll('.auth-view').forEach(function(v) { v.classList.remove('active'); });
  const challengeForm = document.getElementById('2fa-challenge-form');
  if (challengeForm) challengeForm.style.display = 'block';

  const cancelBtn = document.getElementById('2fa-cancel-btn');
  if (cancelBtn) {
    cancelBtn.disabled = false;
    cancelBtn.classList.remove('disabled');
  }

  attach2FAEnterHandlers();

  // Configure method tabs
  const methodTabs = document.getElementById('2fa-method-tabs');
  if (methodTabs) {
    const hasTOTP = settings?.totp_enabled && settings?.totp_confirmed;
    const hasEmail = settings?.email_otp_enabled;

    const totpTab = methodTabs.querySelector('[data-method="totp"]');
    const emailTab = methodTabs.querySelector('[data-method="email"]');

    if (totpTab) totpTab.style.display = hasTOTP ? 'flex' : 'none';
    if (emailTab) emailTab.style.display = hasEmail ? 'flex' : 'none';

    // Select first available method
    if (hasTOTP) {
      switch2FAMethod('totp');
    } else if (hasEmail) {
      switch2FAMethod('email');
    }
  }

  // Set email display
  const emailDisplay = document.getElementById('2fa-email-display');
  if (emailDisplay && user?.email) {
    emailDisplay.textContent = user.email;
  }

  // Focus code input
  setTimeout(() => {
    const input = document.getElementById('2fa-code-input');
    if (input) input.focus();
  }, 100);
}

function attach2FAEnterHandlers() {
  const inputs = [
    document.getElementById('2fa-code-input'),
    document.getElementById('2fa-email-code-input'),
    document.getElementById('2fa-backup-code-input')
  ].filter(Boolean);

  inputs.forEach((input) => {
    if (input.dataset.enterBound === 'true') {
      return;
    }
    input.dataset.enterBound = 'true';
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        verify2FAChallenge();
      }
    });
  });
}

/**
 * Show 2FA setup required UI (for employees)
 */
function show2FASetupRequired(user) {
  pending2FAUser = user;

  // Hide all auth views, show setup required
  document.querySelectorAll('.auth-view').forEach(function(v) { v.classList.remove('active'); });
  const challengeForm = document.getElementById('2fa-challenge-form');
  const setupRequired = document.getElementById('2fa-setup-required');

  if (challengeForm) challengeForm.style.display = 'none';
  if (setupRequired) setupRequired.style.display = 'block';
}

/**
 * Switch between 2FA methods (TOTP/Email)
 */
function switch2FAMethod(method) {
  current2FAMethod = method;

  // Update tabs
  document.querySelectorAll('.2fa-method-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.method === method);
    if (tab.dataset.method === method) {
      tab.style.background = 'var(--accent-dim)';
      tab.style.borderColor = 'var(--accent)';
    } else {
      tab.style.background = '';
      tab.style.borderColor = '';
    }
  });

  // Show/hide inputs
  const totpInput = document.getElementById('2fa-totp-input');
  const emailInput = document.getElementById('2fa-email-input');

  if (totpInput) totpInput.style.display = method === 'totp' ? 'block' : 'none';
  if (emailInput) emailInput.style.display = method === 'email' ? 'block' : 'none';

  // If switching to email, send OTP automatically
  if (method === 'email' && pending2FAUser) {
    send2FAEmailOTP();
  }

  // Focus appropriate input
  setTimeout(() => {
    const inputId = method === 'totp' ? '2fa-code-input' : '2fa-email-code-input';
    const input = document.getElementById(inputId);
    if (input) input.focus();
  }, 100);
}

/**
 * Toggle backup code input visibility
 */
function toggle2FABackupInput() {
  const backupInput = document.getElementById('2fa-backup-input');
  if (backupInput) {
    const isVisible = backupInput.style.display !== 'none';
    backupInput.style.display = isVisible ? 'none' : 'block';

    if (!isVisible) {
      const input = document.getElementById('2fa-backup-code-input');
      if (input) input.focus();
    }
  }
}

/**
 * Send 2FA email OTP
 */
async function send2FAEmailOTP() {
  if (!pending2FAUser?.email) return;

  const resendBtn = document.getElementById('2fa-resend-btn');
  if (resendBtn) {
    resendBtn.disabled = true;
    resendBtn.textContent = 'Sender...';
  }

  try {
    // Generate OTP via EmailOTP module
    const result = await window.EmailOTP?.generate(
      pending2FAUser.email,
      { userId: pending2FAUser.id },
      async (emailData) => {
        // Send via Edge Function
        const response = await fetch(`${SUPABASE_CONFIG?.url || 'https://qymtjhzgtcittohutmay.supabase.co'}/functions/v1/send-otp-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_CONFIG?.key || ''}`
          },
          body: JSON.stringify({
            to: emailData.to,
            otp: emailData.otp,
            appName: 'OrderFlow'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to send email');
        }
      }
    );

    if (result?.success) {
      toast('Kode sendt til din email', 'success');
    } else {
      toast(result?.error || 'Kunne ikke sende kode', 'error');
    }
  } catch (err) {
    console.error('send2FAEmailOTP error:', err);
    toast('Fejl ved afsendelse af kode', 'error');
  } finally {
    if (resendBtn) {
      resendBtn.disabled = false;
      resendBtn.textContent = 'Send ny kode';
    }
  }
}

/**
 * Resend 2FA email OTP
 */
async function resend2FAEmail() {
  await send2FAEmailOTP();
}

/**
 * Verify 2FA challenge
 */
async function verify2FAChallenge() {
  const verifyBtn = document.getElementById('2fa-verify-btn');
  if (verifyBtn) {
    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Verificerer...';
  }

  try {
    let code = '';
    let method = current2FAMethod;

    // Check for backup code first
    const backupInput = document.getElementById('2fa-backup-input');
    const backupCode = document.getElementById('2fa-backup-code-input')?.value?.trim();

    if (backupInput?.style.display !== 'none' && backupCode) {
      code = backupCode.replace(/-/g, '');
      method = 'backup';
    } else if (current2FAMethod === 'email') {
      code = document.getElementById('2fa-email-code-input')?.value?.trim() || '';
    } else {
      code = document.getElementById('2fa-code-input')?.value?.trim() || '';
    }

    if (!code) {
      toast('Indtast en kode', 'error');
      return;
    }

    let result;

    if (method === 'email') {
      // Verify email OTP
      result = await window.EmailOTP?.verify(pending2FAUser.email, code);
    } else {
      // Verify TOTP or backup code (use email as userId for consistency)
      result = await window.TOTP2FA?.verify(pending2FAUser.email, code);
    }

    if (result?.success) {
      // Update last used timestamp in database
      if (typeof SupabaseDB !== 'undefined') {
        SupabaseDB.update2FASettings(pending2FAUser.id, {
          last_used_at: new Date().toISOString()
        });

        // Update backup codes if one was used
        if (result.method === 'backup' && result.backupCodesRemaining !== undefined) {
          // Would need to sync with database here
        }
      }

      // 2FA successful - complete login
      currentUser = pending2FAUser;
      pending2FAUser = null;
      pending2FASettings = null;

      // Load user data and show app
      await completeLogin();

    } else {
      toast(result?.error || 'Ugyldig kode', 'error');

      // Clear input on error
      const inputId = method === 'email' ? '2fa-email-code-input' :
                      method === 'backup' ? '2fa-backup-code-input' : '2fa-code-input';
      const input = document.getElementById(inputId);
      if (input) {
        input.value = '';
        input.focus();
      }
    }

  } catch (err) {
    console.error('verify2FAChallenge error:', err);
    toast('Fejl ved verificering', 'error');
  } finally {
    if (verifyBtn) {
      verifyBtn.disabled = false;
      verifyBtn.textContent = 'Bekræft';
    }
  }
}

/**
 * Complete login after 2FA verification
 */
async function completeLogin() {
  try {
    // Get pending login data
    const pendingData = window._pending2FALogin;
    if (pendingData && pendingData.user) {
      currentUser = pendingData.user;
    }

    // Clean up pending data
    window._pending2FALogin = null;
    pending2FAUser = null;
    pending2FASettings = null;

    // Load restaurants from Supabase
    if (typeof SupabaseDB !== 'undefined' && currentUser) {
      const dbRestaurants = await SupabaseDB.getRestaurants(currentUser.id);
      restaurants = dbRestaurants || [];
      loadPersistedRestaurants();

      if (typeof RealtimeSync !== 'undefined') {
        await RealtimeSync.init(currentUser.id);
      }
    }

    // Play login animation (same as normal login)
    await playLoginTransition();

    showApp();

    logActivity('login', '2FA login succesfuld', {
      category: 'system',
      user: currentUser.email,
      role: currentUser.role
    });

  } catch (err) {
    console.error('completeLogin error:', err);
    showApp(); // Show app anyway
  }
}

/**
 * Cancel 2FA challenge and return to login
 */
function cancel2FAChallenge() {
  pending2FAUser = null;
  pending2FASettings = null;
  window._pending2FALogin = null;

  // Sign out from Supabase since login was cancelled
  if (typeof supabaseClient !== 'undefined' && supabaseClient) {
    supabaseClient.auth.signOut().catch(err => {
      console.warn('Could not sign out after 2FA cancel:', err);
    });
  }

  // Show login view, hide challenge
  const challengeForm = document.getElementById('2fa-challenge-form');
  if (challengeForm) challengeForm.style.display = 'none';
  showAuthView('login');

  // Clear inputs
  const codeInput = document.getElementById('2fa-code-input');
  const emailInput = document.getElementById('2fa-email-code-input');
  const backupInput = document.getElementById('2fa-backup-code-input');
  if (codeInput) codeInput.value = '';
  if (emailInput) emailInput.value = '';
  if (backupInput) backupInput.value = '';
}

/**
 * Setup 2FA from login screen (for employees without 2FA)
 */
async function setup2FAFromLogin(method) {
  if (!pending2FAUser) return;

  if (method === 'email') {
    // Enable email OTP directly
    const result = await SupabaseDB?.enableEmailOTP(pending2FAUser.id);
    if (result?.success) {
      toast('Email 2FA aktiveret', 'success');
      // Now show challenge
      const settings = await SupabaseDB?.get2FASettings(pending2FAUser.id);
      show2FAChallenge(pending2FAUser, settings);
    } else {
      toast('Kunne ikke aktivere email 2FA', 'error');
    }
  } else if (method === 'totp') {
    // Show TOTP setup - would need to implement inline setup
    // For now, complete login and redirect to settings
    currentUser = pending2FAUser;
    pending2FAUser = null;
    await completeLogin();
    // Navigate to 2FA settings
    setTimeout(() => {
      showSettings('passwords');
      toast('Konfigurer venligst din authenticator app', 'info');
    }, 500);
  }
}

/**
 * Cancel 2FA setup from login and logout
 */
function cancel2FASetupFromLogin() {
  pending2FAUser = null;
  pending2FASettings = null;
  window._pending2FALogin = null;

  // Sign out from Supabase
  if (typeof supabaseClient !== 'undefined' && supabaseClient) {
    supabaseClient.auth.signOut();
  }

  // Reset UI
  const loginForm = document.getElementById('login-form');
  const setupRequired = document.getElementById('2fa-setup-required');
  const authTabs = document.querySelector('.auth-tabs');
  const demoButtons = document.getElementById('auth-demo-buttons');

  if (loginForm) loginForm.style.display = 'block';
  if (setupRequired) setupRequired.style.display = 'none';
  if (authTabs) authTabs.style.display = 'flex';
  if (demoButtons) demoButtons.style.display = 'block';
}

// ============================================================================
// 2FA SETTINGS FUNCTIONS (for index.html settings page)
// ============================================================================

/**
 * Initialize 2FA settings page
 */
async function init2FASettings() {
  if (!currentUser) return;

  try {
    // Get settings from localStorage first (always available)
    const localSettings = JSON.parse(localStorage.getItem('orderflow_2fa_settings') || '{}');
    let settings = { ...localSettings };

    // Try to get from database if available (non-blocking)
    if (typeof window.SupabaseDB !== 'undefined' && window.SupabaseDB.get2FASettings) {
      try {
        const dbSettings = await window.SupabaseDB.get2FASettings(currentUser.id);
        if (dbSettings) {
          settings = { ...settings, ...dbSettings };
          if (localSettings.totp_enabled && !settings.totp_enabled) {
            settings.totp_enabled = true;
          }
          if (localSettings.totp_confirmed && !settings.totp_confirmed) {
            settings.totp_confirmed = true;
          }
          if (localSettings.email_otp_enabled && !settings.email_otp_enabled) {
            settings.email_otp_enabled = true;
          }
          // Sync to localStorage
          localStorage.setItem('orderflow_2fa_settings', JSON.stringify(settings));
        }
      } catch (dbErr) {
        console.warn('Database read failed, using localStorage:', dbErr);
      }
    }

    const role = currentUser.role || 'customer';
    const isEmployee = role === 'employee';
    const isAdmin = role === 'admin';

    // Show employee warning if applicable
    const warning = document.getElementById('2fa-employee-warning');
    if (warning) {
      warning.style.display = isEmployee ? 'block' : 'none';
    }

    // Update TOTP status
    const totpEnabled = settings?.totp_enabled;
    const totpConfirmed = settings?.totp_confirmed;
    const hasTOTP = totpEnabled && totpConfirmed;
    const totpToggle = document.getElementById('2fa-totp-toggle');
    const totpStatus = document.getElementById('2fa-totp-status');
    const totpBtn = document.getElementById('2fa-totp-btn');

    // Update toggle state
    if (totpToggle) {
      totpToggle.checked = hasTOTP;
      totpToggle.disabled = false;
    }

    // Legacy support for old UI elements
    if (totpStatus) {
      totpStatus.style.display = 'inline-block';
      totpStatus.textContent = hasTOTP ? 'Aktiv' : 'Ikke aktiv';
      totpStatus.style.background = hasTOTP ? 'var(--green)' : 'var(--muted)';
      totpStatus.style.color = 'white';
    }

    if (totpBtn) {
      totpBtn.textContent = hasTOTP ? 'Deaktiver' : 'Aktivér';
      totpBtn.onclick = hasTOTP ? deactivateTOTP : setup2FATOTP;
    }

    const setupDiv = document.getElementById('2fa-totp-setup');
    if (setupDiv) {
      const inSetup = totpEnabled && !totpConfirmed;
      setupDiv.style.display = inSetup ? 'block' : 'none';
      if (inSetup && settings?.totp_secret && currentUser?.email) {
        const secretCode = document.getElementById('2fa-secret-code');
        if (secretCode) {
          secretCode.textContent = settings.totp_secret;
        }

        const qrImg = document.getElementById('2fa-qr-code');
        if (qrImg && window.TOTP2FA?.utils?.generateOtpauthUrl) {
          const otpauthUrl = window.TOTP2FA.utils.generateOtpauthUrl(currentUser.email, settings.totp_secret);
          render2FAQrCode(otpauthUrl);
        }
      }
    }

    // Update Email OTP status
    const hasEmail = settings?.email_otp_enabled;
    const emailToggle = document.getElementById('2fa-email-toggle');
    const emailStatus = document.getElementById('2fa-email-status');
    const emailBtn = document.getElementById('2fa-email-btn');

    // Update toggle state
    if (emailToggle) {
      emailToggle.checked = hasEmail;
      emailToggle.disabled = false;
    }

    // Legacy support for old UI elements
    if (emailStatus) {
      emailStatus.style.display = 'inline-block';
      emailStatus.textContent = hasEmail ? 'Aktiv' : 'Ikke aktiv';
      emailStatus.style.background = hasEmail ? 'var(--green)' : 'var(--muted)';
      emailStatus.style.color = 'white';
    }

    if (emailBtn) {
      emailBtn.textContent = hasEmail ? 'Deaktiver' : 'Aktivér';
    }

    // Show email address
    const emailAddress = document.getElementById('2fa-email-address');
    if (emailAddress && currentUser.email) {
      emailAddress.textContent = currentUser.email;
    }

    // Show backup codes section if any 2FA is enabled
    const backupSection = document.getElementById('2fa-backup-section');
    if (backupSection) {
      backupSection.style.display = (hasTOTP || hasEmail) ? 'block' : 'none';
    }

    // Update backup codes count
    const backupCount = document.getElementById('2fa-backup-count');
    if (backupCount && settings?.backup_codes_remaining !== undefined) {
      backupCount.textContent = `${settings.backup_codes_remaining} koder tilbage`;
    }

    // Show disable section for admin only
    const disableSection = document.getElementById('2fa-disable-section');
    if (disableSection) {
      disableSection.style.display = isAdmin && (hasTOTP || hasEmail) ? 'block' : 'none';
    }

  } catch (err) {
    console.error('init2FASettings error:', err);
  }
}

/**
 * Setup TOTP 2FA
 */
async function setup2FATOTP() {
  if (!currentUser) return;

  try {
    // Generate TOTP secret using local TOTP2FA module
    const result = await window.TOTP2FA?.enable(currentUser.email, 'OrderFlow');

    if (!result?.success) {
      toast(result?.error || 'Kunne ikke starte 2FA opsætning', 'error');
      return;
    }

    // Save to localStorage (works without database)
    const settings = JSON.parse(localStorage.getItem('orderflow_2fa_settings') || '{}');
    settings.totp_enabled = true;
    settings.totp_secret = result.secret;
    settings.totp_confirmed = false;
    settings.backup_codes = result.backupCodes;
    localStorage.setItem('orderflow_2fa_settings', JSON.stringify(settings));

    // Also try database if available (non-blocking)
    if (typeof window.SupabaseDB !== 'undefined' && window.SupabaseDB.enableTOTP) {
      try {
        await window.SupabaseDB.enableTOTP(currentUser.id, result.secret, result.backupCodes);
      } catch (dbErr) {
        console.warn('Database save failed, using localStorage:', dbErr);
      }
    }

    // Show setup UI
    const setupDiv = document.getElementById('2fa-totp-setup');
    if (setupDiv) {
      setupDiv.style.display = 'block';
    }

    // Display secret code
    const secretCode = document.getElementById('2fa-secret-code');
    if (secretCode) {
      secretCode.textContent = result.secret;
    }

    // Generate QR code
    render2FAQrCode(result.otpauthUrl);

    // Store backup codes for display after confirmation
    window._pending2FABackupCodes = result.backupCodes;

    toast('Scan QR-koden med din authenticator app', 'success');

  } catch (err) {
    console.error('setup2FATOTP error:', err);
    toast('Fejl ved opsætning af 2FA', 'error');
  }
}

/**
 * Generate a branded FLOW QR code with circular dots, black background, and FLOW logo
 * @param {string} data - URL or text to encode
 * @param {HTMLElement} container - DOM element to render into
 * @param {Object} [options] - Override options
 * @param {number} [options.width=280] - QR code width
 * @param {number} [options.height=280] - QR code height
 * @param {boolean} [options.showLogo=true] - Show FLOW logo in center
 */
function generateBrandedQR(data, container, options = {}) {
  if (!container) return;
  container.innerHTML = '';

  const width = options.width || 280;
  const height = options.height || 280;
  const showLogo = options.showLogo !== false;

  // Use qr-code-styling if available
  if (typeof QRCodeStyling !== 'undefined') {
    const qrConfig = {
      width,
      height,
      data,
      type: 'svg',
      dotsOptions: {
        color: '#ffffff',
        type: 'dots'
      },
      backgroundOptions: {
        color: '#000000'
      },
      cornersSquareOptions: {
        type: 'extra-rounded',
        color: '#ffffff'
      },
      cornersDotOptions: {
        type: 'dot',
        color: '#ffffff'
      },
      qrOptions: {
        errorCorrectionLevel: showLogo ? 'H' : 'M'
      }
    };

    if (showLogo) {
      qrConfig.image = 'images/FLOW-logo-hvid-4K.png';
      qrConfig.imageOptions = {
        crossOrigin: 'anonymous',
        margin: 4,
        imageSize: 0.4,
        hideBackgroundDots: true
      };
    }

    const qrCode = new QRCodeStyling(qrConfig);
    qrCode.append(container);
    console.log('✅ Branded FLOW QR code generated');
    return qrCode;
  }

  // Fallback to standard QRCode
  console.warn('QRCodeStyling not available, falling back to standard QR');
  if (typeof QRCode !== 'undefined') {
    const wrapper = document.createElement('div');
    wrapper.style.background = '#000';
    wrapper.style.padding = '16px';
    wrapper.style.borderRadius = '12px';
    wrapper.style.display = 'inline-block';
    container.appendChild(wrapper);

    if (typeof QRCode.toDataURL === 'function') {
      QRCode.toDataURL(data, { width: width, margin: 1, color: { dark: '#ffffff', light: '#000000' } })
        .then(url => {
          const img = document.createElement('img');
          img.width = width;
          img.height = height;
          img.alt = 'QR Code';
          img.style.display = 'block';
          img.src = url;
          wrapper.appendChild(img);
        })
        .catch(() => {
          wrapper.innerHTML = `<p style="color:#fff;font-size:12px;word-break:break-all;padding:10px;">${escapeHtml(data)}</p>`;
        });
    } else if (typeof QRCode === 'function') {
      new QRCode(wrapper, { text: data, width, height, colorDark: '#ffffff', colorLight: '#000000' });
    }
    return null;
  }

  container.innerHTML = `<p style="color:var(--muted);font-size:12px;word-break:break-all;padding:10px;">${escapeHtml(data)}</p>`;
  return null;
}

// =====================================================
// QR KODE GENERATOR PAGE
// =====================================================
let currentQRInstance = null;

function renderQRGeneratorFields() {
  const type = document.getElementById('qr-type')?.value || 'bestilling';
  const fieldsContainer = document.getElementById('qr-fields');
  if (!fieldsContainer) return;

  const fieldTemplates = {
    bestilling: `
      <div style="margin-bottom:var(--space-4)">
        <label style="font-size:var(--font-size-sm);color:var(--muted);display:block;margin-bottom:var(--space-1)">Bestillings-URL</label>
        <input type="text" class="form-input" id="qr-url" placeholder="https://din-restaurant.dk/bestil">
      </div>`,
    menu: `
      <div style="margin-bottom:var(--space-4)">
        <label style="font-size:var(--font-size-sm);color:var(--muted);display:block;margin-bottom:var(--space-1)">Menu-URL</label>
        <input type="text" class="form-input" id="qr-url" placeholder="https://din-restaurant.dk/menu">
      </div>`,
    bord: `
      <div style="margin-bottom:var(--space-4)">
        <label style="font-size:var(--font-size-sm);color:var(--muted);display:block;margin-bottom:var(--space-1)">Base URL</label>
        <input type="text" class="form-input" id="qr-url" placeholder="https://din-restaurant.dk/bord/">
      </div>
      <div style="margin-bottom:var(--space-4)">
        <label style="font-size:var(--font-size-sm);color:var(--muted);display:block;margin-bottom:var(--space-1)">Bordnummer</label>
        <input type="number" class="form-input" id="qr-bord-nummer" placeholder="1" min="1" max="999" value="1">
      </div>`,
    wifi: `
      <div style="margin-bottom:var(--space-4)">
        <label style="font-size:var(--font-size-sm);color:var(--muted);display:block;margin-bottom:var(--space-1)">Netværksnavn (SSID)</label>
        <input type="text" class="form-input" id="qr-wifi-ssid" placeholder="Restaurant WiFi">
      </div>
      <div style="margin-bottom:var(--space-4)">
        <label style="font-size:var(--font-size-sm);color:var(--muted);display:block;margin-bottom:var(--space-1)">Adgangskode</label>
        <input type="text" class="form-input" id="qr-wifi-password" placeholder="password123">
      </div>
      <div style="margin-bottom:var(--space-4)">
        <label style="font-size:var(--font-size-sm);color:var(--muted);display:block;margin-bottom:var(--space-1)">Kryptering</label>
        <select class="form-input" id="qr-wifi-encryption">
          <option value="WPA">WPA/WPA2</option>
          <option value="WEP">WEP</option>
          <option value="nopass">Ingen (åbent netværk)</option>
        </select>
      </div>`,
    betaling: `
      <div style="margin-bottom:var(--space-4)">
        <label style="font-size:var(--font-size-sm);color:var(--muted);display:block;margin-bottom:var(--space-1)">Betalingslink</label>
        <input type="text" class="form-input" id="qr-url" placeholder="https://pay.mobilepay.dk/...">
      </div>`,
    custom: `
      <div style="margin-bottom:var(--space-4)">
        <label style="font-size:var(--font-size-sm);color:var(--muted);display:block;margin-bottom:var(--space-1)">URL eller tekst</label>
        <input type="text" class="form-input" id="qr-url" placeholder="https://eksempel.dk">
      </div>`
  };

  fieldsContainer.innerHTML = fieldTemplates[type] || fieldTemplates.custom;
}

function getQRData() {
  const type = document.getElementById('qr-type')?.value || 'custom';

  if (type === 'wifi') {
    const ssid = document.getElementById('qr-wifi-ssid')?.value || '';
    const password = document.getElementById('qr-wifi-password')?.value || '';
    const encryption = document.getElementById('qr-wifi-encryption')?.value || 'WPA';
    if (!ssid) { toast('Indtast netværksnavn (SSID)', 'error'); return null; }
    return `WIFI:T:${encryption};S:${ssid};P:${password};;`;
  }

  if (type === 'bord') {
    const baseUrl = document.getElementById('qr-url')?.value || '';
    const bordNr = document.getElementById('qr-bord-nummer')?.value || '1';
    if (!baseUrl) { toast('Indtast base URL', 'error'); return null; }
    return baseUrl.replace(/\/$/, '') + '/' + bordNr;
  }

  const url = document.getElementById('qr-url')?.value || '';
  if (!url) { toast('Indtast en URL eller tekst', 'error'); return null; }
  return url;
}

function generateQRFromForm() {
  const data = getQRData();
  if (!data) return;

  const size = parseInt(document.getElementById('qr-size')?.value || '300');
  const showLogo = document.getElementById('qr-show-logo')?.checked !== false;
  const container = document.getElementById('qr-preview-container');
  if (!container) return;

  container.style.background = '#000';
  container.style.borderRadius = '12px';
  container.style.padding = '20px';

  currentQRInstance = generateBrandedQR(data, container, {
    width: size,
    height: size,
    showLogo: showLogo
  });

  const downloadSection = document.getElementById('qr-download-section');
  if (downloadSection) downloadSection.style.display = 'block';

  const qrType = document.getElementById('qr-type')?.value || 'custom';
  saveQRToHistory(qrType, data);
  toast('QR kode genereret', 'success');
}

function saveQRToHistory(type, data) {
  try {
    var history = JSON.parse(localStorage.getItem('flow_qr_history') || '[]');
    history.unshift({ type: type, data: data, date: new Date().toISOString() });
    if (history.length > 50) history = history.slice(0, 50);
    localStorage.setItem('flow_qr_history', JSON.stringify(history));
    loadQRHistory();
  } catch (e) { /* ignore */ }
}

function loadQRHistory() {
  var tbody = document.getElementById('qr-history-tbody');
  if (!tbody) return;
  var history = [];
  try { history = JSON.parse(localStorage.getItem('flow_qr_history') || '[]'); } catch (e) { /* ignore */ }
  if (!history.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:var(--space-6);color:var(--muted);font-size:var(--font-size-sm)">Ingen QR koder genereret endnu</td></tr>';
    return;
  }
  var typeLabels = { bestilling: 'Bestillingslink', menu: 'Menu link', bord: 'Bordnummer', wifi: 'WiFi', betaling: 'Betalingslink', custom: 'Brugerdefineret', preview: 'App Preview', '2fa': '2FA' };
  tbody.innerHTML = history.map(function(item, i) {
    var typeLabel = typeLabels[item.type] || item.type;
    var shortData = item.data.length > 60 ? item.data.substring(0, 57) + '...' : item.data;
    var dateStr = new Date(item.date).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    return '<tr style="border-bottom:1px solid var(--border)">' +
      '<td style="padding:var(--space-2) var(--space-3);font-size:var(--font-size-sm)">' + typeLabel + '</td>' +
      '<td style="padding:var(--space-2) var(--space-3);font-size:var(--font-size-sm);color:var(--muted);max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + item.data.replace(/"/g, '&quot;') + '">' + shortData + '</td>' +
      '<td style="padding:var(--space-2) var(--space-3);font-size:var(--font-size-sm);color:var(--muted)">' + dateStr + '</td>' +
      '<td style="padding:var(--space-2) var(--space-3);text-align:right"><button class="btn btn-sm btn-ghost" onclick="removeQRHistoryItem(' + i + ')">Fjern</button></td>' +
    '</tr>';
  }).join('');
}

function removeQRHistoryItem(index) {
  try {
    var history = JSON.parse(localStorage.getItem('flow_qr_history') || '[]');
    history.splice(index, 1);
    localStorage.setItem('flow_qr_history', JSON.stringify(history));
    loadQRHistory();
  } catch (e) { /* ignore */ }
}

function downloadQRCode() {
  var container = document.getElementById('qr-preview-container');
  if (!container) return;
  var qrType = document.getElementById('qr-type') ? document.getElementById('qr-type').value : 'qr';

  // SVG output (primary — from QRCodeStyling with type:'svg')
  var svg = container.querySelector('svg');
  if (svg) {
    var svgData = new XMLSerializer().serializeToString(svg);
    var svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    var canvas = document.createElement('canvas');
    var scale = 2;
    var rect = svg.getBoundingClientRect();
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    var ctx = canvas.getContext('2d');
    var img = new Image();
    var url = URL.createObjectURL(svgBlob);
    img.onload = function() {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(function(blob) {
        if (!blob) { toast('Kunne ikke downloade QR kode', 'error'); return; }
        var dlUrl = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.download = 'flow-qr-' + qrType + '-' + Date.now() + '.png';
        link.href = dlUrl;
        link.click();
        URL.revokeObjectURL(dlUrl);
        toast('QR kode downloadet', 'success');
      }, 'image/png');
    };
    img.onerror = function() {
      URL.revokeObjectURL(url);
      toast('Kunne ikke downloade QR kode', 'error');
    };
    img.src = url;
    return;
  }

  // Canvas fallback
  var canvasEl = container.querySelector('canvas');
  if (canvasEl) {
    canvasEl.toBlob(function(blob) {
      if (!blob) { toast('Kunne ikke downloade QR kode', 'error'); return; }
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.download = 'flow-qr-' + qrType + '-' + Date.now() + '.png';
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      toast('QR kode downloadet', 'success');
    }, 'image/png');
    return;
  }

  // Image fallback
  var imgEl = container.querySelector('img');
  if (imgEl) {
    var link = document.createElement('a');
    link.download = 'flow-qr-' + Date.now() + '.png';
    link.href = imgEl.src;
    link.click();
    toast('QR kode downloadet', 'success');
    return;
  }

  toast('Generer først en QR kode', 'error');
}

function render2FAQrCode(otpauthUrl) {
  const container = document.getElementById('2fa-qr-container');
  if (!container) return;
  container.innerHTML = '';
  container.style.background = '#fff';
  container.style.borderRadius = '12px';
  container.style.padding = '16px';
  // 2FA QR: ingen logo, standard sort-på-hvid for authenticator app kompatibilitet
  if (typeof QRCodeStyling !== 'undefined') {
    var qr = new QRCodeStyling({
      width: 200, height: 200, data: otpauthUrl, type: 'svg',
      dotsOptions: { color: '#000000', type: 'square' },
      backgroundOptions: { color: '#ffffff' },
      cornersSquareOptions: { type: 'square', color: '#000000' },
      cornersDotOptions: { type: 'square', color: '#000000' },
      qrOptions: { errorCorrectionLevel: 'M' }
    });
    qr.append(container);
  } else {
    generateBrandedQR(otpauthUrl, container, { width: 200, height: 200, showLogo: false });
  }
  saveQRToHistory('2fa', otpauthUrl);
}

/**
 * Confirm TOTP 2FA setup
 */
async function confirm2FATOTP() {
  const code = document.getElementById('2fa-totp-verify-code')?.value?.trim();

  if (!code || code.length !== 6) {
    toast('Indtast 6-cifret kode', 'error');
    return;
  }

  try {
    // Verify the code using local TOTP module
    const result = await window.TOTP2FA?.confirm(currentUser.email, code);

    if (result?.success) {
      // Update localStorage
      const settings = JSON.parse(localStorage.getItem('orderflow_2fa_settings') || '{}');
      settings.totp_confirmed = true;
      localStorage.setItem('orderflow_2fa_settings', JSON.stringify(settings));

      // Also try database if available (non-blocking)
      if (typeof window.SupabaseDB !== 'undefined' && window.SupabaseDB.confirmTOTP) {
        try {
          await window.SupabaseDB.confirmTOTP(currentUser.id);
        } catch (dbErr) {
          console.warn('Database confirm failed, using localStorage:', dbErr);
        }
      }

      toast('2FA aktiveret!', 'success');

      // Hide setup UI
      const setupDiv = document.getElementById('2fa-totp-setup');
      if (setupDiv) {
        setupDiv.style.display = 'none';
      }

      // Show backup codes
      if (window._pending2FABackupCodes) {
        showBackupCodesModal(window._pending2FABackupCodes);
        delete window._pending2FABackupCodes;
      }

      // Refresh settings
      init2FASettings();

    } else {
      toast(result?.error || 'Ugyldig kode', 'error');
      document.getElementById('2fa-totp-verify-code').value = '';
    }

  } catch (err) {
    console.error('confirm2FATOTP error:', err);
    toast('Fejl ved bekræftelse', 'error');
  }
}

/**
 * Cancel 2FA setup
 */
function cancel2FASetup() {
  // Nulstil localStorage flags - vigtig for at forhindre at setup UI vises igen
  const settings = JSON.parse(localStorage.getItem('orderflow_2fa_settings') || '{}');
  settings.totp_enabled = false;
  settings.totp_secret = null;
  settings.totp_confirmed = false;
  localStorage.setItem('orderflow_2fa_settings', JSON.stringify(settings));

  // Skjul setup div
  const setupDiv = document.getElementById('2fa-totp-setup');
  if (setupDiv) {
    setupDiv.style.display = 'none';
  }

  // Nulstil toggle
  const toggle = document.getElementById('2fa-totp-toggle');
  if (toggle) toggle.checked = false;

  // Clear inputs og pending data
  const verifyCode = document.getElementById('2fa-totp-verify-code');
  if (verifyCode) verifyCode.value = '';
  delete window._pending2FABackupCodes;

  // Refresh UI state
  init2FASettings();
}

/**
 * Deactivate TOTP 2FA
 */
async function deactivateTOTP() {
  const code = prompt('Indtast din nuværende 2FA kode for at deaktivere:');
  if (!code) return;

  try {
    const result = await window.TOTP2FA?.disable(currentUser.email, code);

    if (result?.success) {
      // Update localStorage
      const settings = JSON.parse(localStorage.getItem('orderflow_2fa_settings') || '{}');
      settings.totp_enabled = false;
      settings.totp_secret = null;
      settings.totp_confirmed = false;
      localStorage.setItem('orderflow_2fa_settings', JSON.stringify(settings));

      // Also try database if available (non-blocking)
      if (typeof window.SupabaseDB !== 'undefined') {
        try {
          await window.SupabaseDB.update2FASettings(currentUser.id, {
            totp_enabled: false,
            totp_secret: null,
            totp_confirmed: false
          });
        } catch (dbErr) {
          console.warn('Database update failed, using localStorage:', dbErr);
        }
      }

      toast('TOTP deaktiveret', 'success');
      init2FASettings();
    } else {
      toast(result?.error || 'Kunne ikke deaktivere', 'error');
    }
  } catch (err) {
    console.error('deactivateTOTP error:', err);
    toast('Fejl', 'error');
  }
}

/**
 * Toggle Email OTP
 */
async function toggle2FAEmail() {
  if (!currentUser) return;

  try {
    // Get current settings from localStorage
    const settings = JSON.parse(localStorage.getItem('orderflow_2fa_settings') || '{}');
    const hasEmail = settings.email_otp_enabled;

    if (hasEmail) {
      // Check if can disable (must have another method or be admin)
      const hasTOTP = settings.totp_enabled && settings.totp_confirmed;
      const role = currentUser.role;

      if (!hasTOTP && role === 'employee') {
        toast('Du skal have mindst én 2FA metode aktiveret', 'error');
        return;
      }

      // Disable
      settings.email_otp_enabled = false;
      localStorage.setItem('orderflow_2fa_settings', JSON.stringify(settings));
      toast('Email 2FA deaktiveret', 'success');

    } else {
      // Enable
      settings.email_otp_enabled = true;
      localStorage.setItem('orderflow_2fa_settings', JSON.stringify(settings));
      toast('Email 2FA aktiveret', 'success');
    }

    // Also try database if available (non-blocking)
    if (typeof window.SupabaseDB !== 'undefined') {
      try {
        if (hasEmail) {
          await window.SupabaseDB.update2FASettings(currentUser.id, { email_otp_enabled: false });
        } else {
          await window.SupabaseDB.enableEmailOTP(currentUser.id);
        }
      } catch (dbErr) {
        console.warn('Database update failed, using localStorage:', dbErr);
      }
    }

    init2FASettings();

  } catch (err) {
    console.error('toggle2FAEmail error:', err);
    toast('Fejl', 'error');
  }
}

/**
 * Handle TOTP toggle change
 * @param {boolean} checked - Whether toggle is checked
 */
async function handleTOTPToggle(checked) {
  const toggle = document.getElementById('2fa-totp-toggle');
  const emailToggle = document.getElementById('2fa-email-toggle');

  if (!currentUser) {
    if (toggle) toggle.checked = !checked;
    return;
  }

  if (checked) {
    // Deaktiver E-mail Kode hvis den er aktiv (mutually exclusive)
    const settings = JSON.parse(localStorage.getItem('orderflow_2fa_settings') || '{}');
    if (settings.email_otp_enabled) {
      settings.email_otp_enabled = false;
      localStorage.setItem('orderflow_2fa_settings', JSON.stringify(settings));
      if (emailToggle) emailToggle.checked = false;
    }

    // Enable TOTP - start setup process
    await setup2FATOTP();
  } else {
    // Disable TOTP
    await deactivateTOTP();
  }

  // Refresh toggle state after action
  init2FASettings();
}

/**
 * Handle Email OTP toggle change
 * @param {boolean} checked - Whether toggle is checked
 */
async function handleEmailToggle(checked) {
  const toggle = document.getElementById('2fa-email-toggle');
  const totpToggle = document.getElementById('2fa-totp-toggle');

  if (!currentUser) {
    if (toggle) toggle.checked = !checked;
    return;
  }

  try {
    // Get settings from localStorage
    const settings = JSON.parse(localStorage.getItem('orderflow_2fa_settings') || '{}');

    if (!checked) {
      // Disable E-mail OTP
      settings.email_otp_enabled = false;
      localStorage.setItem('orderflow_2fa_settings', JSON.stringify(settings));
      toast('E-mail 2FA deaktiveret', 'success');

    } else {
      // Deaktiver Authenticator App hvis den er aktiv (mutually exclusive)
      if (settings.totp_enabled && settings.totp_confirmed) {
        settings.totp_enabled = false;
        settings.totp_confirmed = false;
        settings.totp_secret = null;
        if (totpToggle) totpToggle.checked = false;
      }

      // Enable E-mail OTP
      settings.email_otp_enabled = true;
      localStorage.setItem('orderflow_2fa_settings', JSON.stringify(settings));
      toast('E-mail 2FA aktiveret. Ved login sendes en kode til din e-mail.', 'success');
    }

    // Also try database if available (non-blocking)
    if (typeof window.SupabaseDB !== 'undefined') {
      try {
        if (!checked) {
          await window.SupabaseDB.update2FASettings(currentUser.id, { email_otp_enabled: false });
        }
      } catch (dbErr) {
        console.warn('Database update failed, using localStorage:', dbErr);
      }
    }

    init2FASettings();

  } catch (err) {
    console.error('handleEmailToggle error:', err);
    toast('Fejl', 'error');
    // Revert toggle on error
    if (toggle) toggle.checked = !checked;
  }
}

/**
 * Show backup codes
 */
function showBackupCodes() {
  const display = document.getElementById('2fa-backup-codes-display');
  if (display) {
    display.style.display = 'block';
    // Would need to fetch from TOTP2FA or database
    const list = document.getElementById('2fa-backup-codes-list');
    if (list) {
      list.innerHTML = '<p style="color:var(--muted);font-size:13px">Backup koder er krypteret. Kontakt support hvis du har brug for nye.</p>';
    }
  }
}

/**
 * Hide backup codes
 */
function hideBackupCodes() {
  const display = document.getElementById('2fa-backup-codes-display');
  if (display) {
    display.style.display = 'none';
  }
}

/**
 * Show backup codes modal after TOTP setup
 */
function showBackupCodesModal(codes) {
  const list = document.getElementById('2fa-backup-codes-list');
  if (list && codes) {
    list.innerHTML = codes.map(code =>
      `<code style="background:var(--bg2);padding:8px;border-radius:4px;font-size:14px;text-align:center">${code}</code>`
    ).join('');

    const display = document.getElementById('2fa-backup-codes-display');
    if (display) {
      display.style.display = 'block';
    }

    // Also show the backup section
    const section = document.getElementById('2fa-backup-section');
    if (section) {
      section.style.display = 'block';
    }
  }
}

/**
 * Regenerate backup codes
 */
async function regenerateBackupCodes() {
  const code = prompt('Indtast din nuværende 2FA kode for at generere nye backup koder:');
  if (!code) return;

  try {
    const result = await window.TOTP2FA?.regenerateBackupCodes(currentUser.email, code);

    if (result?.success) {
      showBackupCodesModal(result.backupCodes);
      toast('Nye backup koder genereret', 'success');
      init2FASettings();
    } else {
      toast(result?.error || 'Kunne ikke generere nye koder', 'error');
    }
  } catch (err) {
    console.error('regenerateBackupCodes error:', err);
    toast('Fejl', 'error');
  }
}

/**
 * Disable all 2FA (admin only)
 */
async function disable2FA() {
  if (currentUser?.role !== 'admin') {
    toast('Kun administratorer kan deaktivere 2FA helt', 'error');
    return;
  }

  if (!confirm('Er du sikker på at du vil deaktivere al 2FA? Dette reducerer sikkerheden på din konto.')) {
    return;
  }

  try {
    await SupabaseDB?.disable2FA(currentUser.id);
    toast('2FA deaktiveret', 'success');
    init2FASettings();
  } catch (err) {
    console.error('disable2FA error:', err);
    toast('Fejl ved deaktivering', 'error');
  }
}

// Export 2FA functions to window
window.check2FARequired = check2FARequired;
window.show2FAChallenge = show2FAChallenge;
window.show2FASetupRequired = show2FASetupRequired;
window.switch2FAMethod = switch2FAMethod;
window.toggle2FABackupInput = toggle2FABackupInput;
window.send2FAEmailOTP = send2FAEmailOTP;
window.resend2FAEmail = resend2FAEmail;
window.verify2FAChallenge = verify2FAChallenge;
window.cancel2FAChallenge = cancel2FAChallenge;
window.setup2FAFromLogin = setup2FAFromLogin;
window.cancel2FASetupFromLogin = cancel2FASetupFromLogin;
window.init2FASettings = init2FASettings;
window.setup2FATOTP = setup2FATOTP;
window.confirm2FATOTP = confirm2FATOTP;
window.cancel2FASetup = cancel2FASetup;
window.toggle2FAEmail = toggle2FAEmail;
window.showBackupCodes = showBackupCodes;
window.hideBackupCodes = hideBackupCodes;
window.regenerateBackupCodes = regenerateBackupCodes;
window.disable2FA = disable2FA;



// ===== Flatpickr Calendar Initialization (shadcn/ui style) =====
function initDatePickers(root) {
  if (typeof flatpickr === 'undefined') {
    console.warn('Flatpickr not loaded – date pickers use native browser UI');
    return;
  }

  flatpickr.localize(flatpickr.l10ns.da);

  var container = root || document;
  var calendarSVG = '<svg class="datepicker-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  var clearSVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  container.querySelectorAll('input[type="date"]').forEach(function(input) {
    if (input.hasAttribute('data-datepicker-init')) return;
    input.setAttribute('data-datepicker-init', 'true');

    var origOnchange = input.getAttribute('onchange');
    var origValue = input.value || '';
    var origWidth = input.style.width || '';
    var origMinWidth = input.style.minWidth || '';
    var placeholderText = 'Vælg dato';

    // Convert input
    input.type = 'text';
    input.setAttribute('data-input', '');
    input.setAttribute('readonly', 'readonly');
    input.className = 'datepicker-hidden-input';

    // Create wrapper
    var wrapper = document.createElement('div');
    wrapper.className = 'datepicker-wrapper';
    if (origWidth) wrapper.style.width = origWidth;
    if (origMinWidth) wrapper.style.minWidth = origMinWidth;

    // Create trigger button
    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'datepicker-trigger';
    trigger.setAttribute('data-toggle', '');
    trigger.innerHTML = calendarSVG + '<span class="datepicker-text is-placeholder">' + placeholderText + '</span>';

    // Create clear button
    var clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'datepicker-clear';
    clearBtn.setAttribute('title', 'Ryd dato');
    clearBtn.style.display = 'none';
    clearBtn.innerHTML = clearSVG;

    // Build DOM: wrapper > trigger + input + clearBtn
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(trigger);
    wrapper.appendChild(input);
    wrapper.appendChild(clearBtn);

    // Clear button click
    clearBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (input._flatpickr) input._flatpickr.clear();
    });

    // Format date for display (DD.MM.YYYY)
    function formatDisplay(d) {
      return String(d.getDate()).padStart(2, '0') + '.' +
             String(d.getMonth() + 1).padStart(2, '0') + '.' +
             d.getFullYear();
    }

    // Initialize Flatpickr on wrapper with wrap mode
    flatpickr(wrapper, {
      dateFormat: 'Y-m-d',
      locale: 'da',
      disableMobile: true,
      allowInput: false,
      wrap: true,
      defaultDate: origValue || null,
      onChange: function(selectedDates, dateStr) {
        var textEl = wrapper.querySelector('.datepicker-text');
        if (selectedDates.length && dateStr) {
          textEl.textContent = formatDisplay(selectedDates[0]);
          textEl.classList.remove('is-placeholder');
          clearBtn.style.display = '';
          wrapper.classList.add('has-value');
        } else {
          textEl.textContent = placeholderText;
          textEl.classList.add('is-placeholder');
          clearBtn.style.display = 'none';
          wrapper.classList.remove('has-value');
        }
        // Fire original onchange handler
        if (origOnchange) {
          try { new Function(origOnchange).call(input); }
          catch(err) { console.warn('Datepicker onchange error:', err); }
        }
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // Set initial display if value was preset
    if (origValue) {
      var textEl = wrapper.querySelector('.datepicker-text');
      var parts = origValue.split('-');
      if (parts.length === 3) {
        textEl.textContent = parts[2] + '.' + parts[1] + '.' + parts[0];
      } else {
        textEl.textContent = origValue;
      }
      textEl.classList.remove('is-placeholder');
      clearBtn.style.display = '';
      wrapper.classList.add('has-value');
    }
  });
}

window.initDatePickers = initDatePickers;

document.addEventListener('DOMContentLoaded', function() {
  initDatePickers();
});


// ===== LOYALTY PROGRAM =====

// Loyalty data cache
let loyaltySettings = null;
let loyaltyRewards = [];
let loyaltyMembers = [];

// Tier colors and icons
const LOYALTY_TIERS = {
  bronze: { color: '#cd7f32', icon: '', name: 'Bronze' },
  silver: { color: '#c0c0c0', icon: '', name: 'Sølv' },
  gold: { color: '#ffd700', icon: '', name: 'Guld' },
  platinum: { color: '#e5e4e2', icon: '', name: 'Platin' }
};

// Get loyalty settings for restaurant
