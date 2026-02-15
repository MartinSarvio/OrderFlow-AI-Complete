// =====================================================
// FLOW SECURITY UTILITIES v4.12.0
// Global security functions for XSS prevention,
// error monitoring, and sensitive data handling
// =====================================================

(function() {
  'use strict';

  // =====================================================
  // FIX #2: GLOBAL escapeHtml() - XSS Prevention
  // =====================================================
  
  /**
   * Escapes HTML special characters to prevent XSS attacks.
   * Use this for ALL user-supplied data inserted into innerHTML.
   * @param {*} str - Input to escape (coerced to string)
   * @returns {string} Escaped HTML-safe string
   */
  window.escapeHtml = function(str) {
    if (str === null || str === undefined) return '';
    const s = String(str);
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;'
    };
    return s.replace(/[&<>"'\/`]/g, c => map[c]);
  };

  /**
   * Sanitize a URL to prevent javascript: protocol XSS
   * @param {string} url - URL to sanitize
   * @returns {string} Safe URL or empty string
   */
  window.sanitizeUrl = function(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim().toLowerCase();
    if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:text/html') || trimmed.startsWith('vbscript:')) {
      return '';
    }
    return url;
  };

  // =====================================================
  // FIX #4: GLOBAL ERROR MONITORING
  // =====================================================

  // Sensitive patterns to strip from error logs
  const SENSITIVE_PATTERNS = [
    /sk_live_[a-zA-Z0-9]+/g,
    /sk_test_[a-zA-Z0-9]+/g,
    /pk_live_[a-zA-Z0-9]+/g,
    /pk_test_[a-zA-Z0-9]+/g,
    /Bearer\s+[a-zA-Z0-9._-]+/g,
    /api[_-]?key[=:]\s*["']?[a-zA-Z0-9_-]+["']?/gi,
    /password[=:]\s*["']?[^"'\s]+["']?/gi,
    /secret[=:]\s*["']?[a-zA-Z0-9_-]+["']?/gi,
    /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, // JWTs
    /fc-[a-f0-9]{32}/g // Firecrawl keys
  ];

  /**
   * Strip sensitive data from error messages before logging
   */
  function sanitizeErrorMessage(msg) {
    if (!msg || typeof msg !== 'string') return msg || 'Unknown error';
    let sanitized = msg;
    SENSITIVE_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });
    return sanitized;
  }

  /**
   * Show a user-friendly error toast
   */
  function showErrorToast(message) {
    // Use existing showToast if available, otherwise create simple one
    if (typeof window.showToast === 'function') {
      window.showToast(message, 'error');
      return;
    }
    
    // Fallback toast implementation
    const toast = document.createElement('div');
    toast.className = 'security-error-toast';
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#ef4444;color:#fff;padding:12px 20px;border-radius:8px;font-size:14px;z-index:99999;max-width:400px;box-shadow:0 4px 12px rgba(0,0,0,0.3);animation:fadeIn 0.3s ease';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  /**
   * Log error to Supabase error_logs table (if available) and console
   */
  async function logError(errorData) {
    const sanitizedMessage = sanitizeErrorMessage(errorData.message);
    const sanitizedStack = sanitizeErrorMessage(errorData.stack);
    
    const logEntry = {
      error_type: errorData.type || 'runtime',
      message: sanitizedMessage,
      stack: sanitizedStack ? sanitizedStack.substring(0, 2000) : null,
      url: window.location.href,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      source: errorData.source || null,
      line: errorData.line || null,
      column: errorData.col || null
    };

    // Always log to console
    console.error('[FLOW Error Monitor]', logEntry);

    // Try to log to Supabase (only use actual client, not the library)
    try {
      const client = window.supabaseClient;
      if (client && typeof client.from === 'function') {
        await client.from('error_logs').insert(logEntry);
      }
    } catch (e) {
      // Don't log logging failures to avoid infinite loops
    }
  }

  // Global uncaught error handler
  // Errors that should NOT show a toast to the user (background/API failures)
  const SILENT_ERROR_PATTERNS = [
    /fetch/i, /network/i, /api\.openai/i, /supabase/i, /Failed to fetch/i,
    /Load failed/i, /NetworkError/i, /AbortError/i, /timeout/i,
    /CORS/i, /403/i, /401/i, /429/i, /ResizeObserver/i,
    /Script error/i, /ChunkLoadError/i, /Loading chunk/i,
    /supabase/i, /AuthApiError/i, /AuthSessionMissing/i,
    /auth.*error/i, /session.*expired/i, /refresh_token/i,
    /invalid.*token/i, /JWT/i, /getSession/i,
    /realtime/i, /websocket/i, /channel/i, /subscribe/i,
    /row-level security/i, /RLS/i, /policy/i,
    /Cannot read properties of null/i, /Cannot read properties of undefined/i,
    /is not defined/i, /is not a function/i,
    /ERR_CONNECTION/i, /ERR_NAME/i, /ERR_INTERNET/i, /DNS/i
  ];

  function isSilentError(message) {
    const msg = String(message || '');
    return SILENT_ERROR_PATTERNS.some(p => p.test(msg));
  }

  // Rate-limit error toasts — max 1 per 30 seconds to avoid spamming the user
  let _lastErrorToastTime = 0;
  const ERROR_TOAST_COOLDOWN_MS = 30000;

  function showRateLimitedErrorToast(errorDetail) {
    const now = Date.now();
    if (now - _lastErrorToastTime < ERROR_TOAST_COOLDOWN_MS) return;
    _lastErrorToastTime = now;
    const detail = errorDetail ? ` (${errorDetail.substring(0, 80)})` : '';
    showErrorToast('Der opstod en uventet fejl' + detail);
  }

  window.onerror = function(message, source, line, col, error) {
    logError({
      type: 'uncaught_error',
      message: message,
      stack: error?.stack,
      source: source,
      line: line,
      col: col
    });
    // Only show toast for genuine user-facing errors, not background/API failures
    if (!isSilentError(message) && !isSilentError(error?.message) && !isSilentError(error?.stack)) {
      const detail = String(message || error?.message || '').substring(0, 120);
      console.warn('[FLOW] Uventet fejl vises til bruger:', detail, 'source:', source, 'line:', line);
      showRateLimitedErrorToast(detail);
    }
    return false; // Don't suppress default console error
  };

  // Global unhandled promise rejection handler
  window.addEventListener('unhandledrejection', function(event) {
    const reason = event.reason;
    logError({
      type: 'unhandled_rejection',
      message: reason?.message || String(reason),
      stack: reason?.stack
    });
    // Only show toast for genuine user-facing errors
    if (!isSilentError(reason?.message) && !isSilentError(String(reason)) && !isSilentError(reason?.stack)) {
      const detail = String(reason?.message || reason || '').substring(0, 120);
      console.warn('[FLOW] Unhandled rejection vises til bruger:', detail);
      showRateLimitedErrorToast(detail);
    }
  });

  // =====================================================
  // FIX #1 & #3: API KEY SECURITY
  // Prevent secret keys from being stored in localStorage
  // =====================================================

  // List of sensitive keys that MUST NOT be in localStorage
  const FORBIDDEN_LOCALSTORAGE_KEYS = [
    'stripe_secret_key',
    // Note: stripe_publishable_key is OK (it's a public key)
  ];

  // Keys that should be migrated to server-side storage
  const SERVER_SIDE_ONLY_KEYS = [
    'openai_key',
    'inmobile_api_key',
    'google_api_key',
    'trustpilot_api_key',
    'firecrawl_api_key',
    'googleapi_api_key',
    'serper_reviews_key',
    'serper_images_key',
    'serper_maps_key',
    'serper_places_key',
    'openrouter_key',
    'minimax_key',
    'stripe_secret_key',
    'instagram_access_token',
    'facebook_access_token',
    'economic_app_secret',
    'economic_agreement_token',
    'dinero_api_key',
    'billy_api_token',
    'visma_bearer_token'
  ];

  /**
   * Clean up any forbidden keys from localStorage on load
   * SECURITY: Stripe secret keys must NEVER exist in browser storage
   */
  function cleanupForbiddenKeys() {
    FORBIDDEN_LOCALSTORAGE_KEYS.forEach(key => {
      if (localStorage.getItem(key)) {
        console.warn(`[SECURITY] Removing forbidden key from localStorage: ${key}`);
        localStorage.removeItem(key);
      }
    });
  }

  // Run cleanup on load
  cleanupForbiddenKeys();

  /**
   * Save API credentials to Supabase (server-side, encrypted)
   * Frontend should use this instead of localStorage for API keys
   */
  window.saveApiCredential = async function(keyName, keyValue) {
    // SECURITY: Never store Stripe secret keys anywhere in frontend
    if (keyName === 'stripe_secret_key') {
      console.error('[SECURITY] Stripe secret keys cannot be stored in frontend');
      showErrorToast('Stripe secret keys kan ikke gemmes i browseren. Brug Edge Functions.');
      return false;
    }

    try {
      const client = window.supabaseClient || window.supabase;
      if (!client) throw new Error('Supabase not available');
      
      const { data: { user } } = await client.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await client.from('api_credentials').upsert({
        user_id: user.id,
        key_name: keyName,
        key_value: keyValue, // Encrypted by Supabase column-level encryption
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,key_name' });

      if (error) throw error;

      // Remove from localStorage if it exists there (migration)
      localStorage.removeItem(keyName);
      
      console.log(`[SECURITY] API credential '${keyName}' saved to Supabase`);
      return true;
    } catch (err) {
      console.error('[SECURITY] Failed to save credential:', err.message);
      // Fallback: still save to localStorage for offline use (except forbidden keys)
      if (!FORBIDDEN_LOCALSTORAGE_KEYS.includes(keyName)) {
        localStorage.setItem(keyName, keyValue);
        console.warn(`[SECURITY] Credential saved to localStorage as fallback`);
      }
      return false;
    }
  };

  /**
   * Load API credential from Supabase (with localStorage fallback)
   */
  window.loadApiCredential = async function(keyName) {
    // Never return forbidden keys
    if (FORBIDDEN_LOCALSTORAGE_KEYS.includes(keyName)) {
      return null;
    }

    try {
      const client = window.supabaseClient || window.supabase;
      if (!client) throw new Error('Supabase not available');
      
      const { data: { user } } = await client.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await client
        .from('api_credentials')
        .select('key_value')
        .eq('user_id', user.id)
        .eq('key_name', keyName)
        .single();

      if (!error && data?.key_value) {
        return data.key_value;
      }
    } catch (err) {
      // Fallback to localStorage
    }

    return localStorage.getItem(keyName) || null;
  };

  /**
   * Proxy API call through Supabase Edge Function
   * Instead of calling 3rd party APIs directly with API keys from frontend
   */
  window.proxyApiCall = async function(service, endpoint, payload) {
    try {
      const client = window.supabaseClient || window.supabase;
      if (!client) throw new Error('Supabase not available');
      
      const { data: { session } } = await client.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${CONFIG.SUPABASE_URL}/functions/v1/api-proxy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ service, endpoint, payload })
        }
      );

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Proxy error: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error(`[API Proxy] ${service} call failed:`, err.message);
      throw err;
    }
  };

  console.log('[SECURITY] Flow security utilities loaded (v4.12.0)');
})();
