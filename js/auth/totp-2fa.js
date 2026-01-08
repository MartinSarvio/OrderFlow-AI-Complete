/**
 * TOTP 2FA Module for OrderFlow
 * RFC 6238 compliant Time-based One-Time Password implementation
 * Compatible with Google Authenticator, Microsoft Authenticator, Authy, etc.
 *
 * Browser-compatible implementation using Web Crypto API
 */

const TOTP2FA = (function() {
  'use strict';

  // =====================================================
  // Configuration
  // =====================================================
  const CONFIG = {
    // TOTP settings
    TOTP_DIGITS: 6,           // Number of digits in OTP
    TOTP_PERIOD: 30,          // Time step in seconds
    TOTP_WINDOW: 0,           // Strict: only current time step is valid
    TOTP_ALGORITHM: 'SHA-1',  // HMAC algorithm (standard for authenticator apps)

    // Backup codes
    BACKUP_CODE_COUNT: 10,
    BACKUP_CODE_LENGTH: 8,

    // Rate limiting
    MAX_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000,  // 15 minutes

    // App info
    APP_NAME: 'OrderFlow',
    ISSUER: 'OrderFlow'
  };

  // =====================================================
  // Storage with localStorage persistence
  // =====================================================
  const userSecrets = new Map();
  const pendingSetups = new Map();
  const attemptTracking = new Map();

  // localStorage keys
  const STORAGE_KEYS = {
    USER_SECRETS: 'orderflow_totp_secrets',
    PENDING_SETUPS: 'orderflow_totp_pending'
  };

  // Load from localStorage on init
  function loadFromStorage() {
    try {
      const secretsData = localStorage.getItem(STORAGE_KEYS.USER_SECRETS);
      if (secretsData) {
        const parsed = JSON.parse(secretsData);
        Object.entries(parsed).forEach(([key, value]) => {
          userSecrets.set(key, value);
        });
      }
      const pendingData = localStorage.getItem(STORAGE_KEYS.PENDING_SETUPS);
      if (pendingData) {
        const parsed = JSON.parse(pendingData);
        Object.entries(parsed).forEach(([key, value]) => {
          pendingSetups.set(key, value);
        });
      }
    } catch (e) {
      console.warn('Failed to load TOTP data from localStorage:', e);
    }
  }

  // Save to localStorage
  function saveToStorage() {
    try {
      const secretsObj = Object.fromEntries(userSecrets);
      localStorage.setItem(STORAGE_KEYS.USER_SECRETS, JSON.stringify(secretsObj));
      const pendingObj = Object.fromEntries(pendingSetups);
      localStorage.setItem(STORAGE_KEYS.PENDING_SETUPS, JSON.stringify(pendingObj));
    } catch (e) {
      console.warn('Failed to save TOTP data to localStorage:', e);
    }
  }

  // Also check orderflow_2fa_settings as fallback for secrets
  function getUserSecretFromFallback(userId) {
    try {
      const settings = JSON.parse(localStorage.getItem('orderflow_2fa_settings') || '{}');
      if (settings.totp_enabled && settings.totp_secret) {
        return {
          secret: settings.totp_secret,
          enabled: settings.totp_confirmed,
          hashedCodes: settings.backup_codes || [],
          createdAt: Date.now()
        };
      }
    } catch (e) {}
    return null;
  }

  // Load on module init
  loadFromStorage();

  // =====================================================
  // Utility Functions
  // =====================================================

  /**
   * Generate cryptographically secure random bytes
   */
  function getRandomBytes(length) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return array;
  }

  /**
   * Convert byte array to Base32 string
   */
  function toBase32(buffer) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    let bits = 0;
    let value = 0;

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;

      while (bits >= 5) {
        result += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      result += alphabet[(value << (5 - bits)) & 31];
    }

    return result;
  }

  /**
   * Convert Base32 string to byte array
   */
  function fromBase32(str) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    str = str.toUpperCase().replace(/[^A-Z2-7]/g, '');

    const output = [];
    let bits = 0;
    let value = 0;

    for (let i = 0; i < str.length; i++) {
      const idx = alphabet.indexOf(str[i]);
      if (idx === -1) continue;

      value = (value << 5) | idx;
      bits += 5;

      if (bits >= 8) {
        output.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return new Uint8Array(output);
  }

  /**
   * Generate a random secret key
   */
  function generateSecret() {
    const bytes = getRandomBytes(20); // 160 bits
    return toBase32(bytes);
  }

  /**
   * Generate backup codes
   */
  function generateBackupCodes() {
    const codes = [];
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars

    for (let i = 0; i < CONFIG.BACKUP_CODE_COUNT; i++) {
      let code = '';
      for (let j = 0; j < CONFIG.BACKUP_CODE_LENGTH; j++) {
        const randomIndex = getRandomBytes(1)[0] % chars.length;
        code += chars[randomIndex];
        if (j === 3) code += '-'; // Format: XXXX-XXXX
      }
      codes.push(code);
    }

    return codes;
  }

  /**
   * Hash a backup code for storage
   */
  async function hashBackupCode(code) {
    const encoder = new TextEncoder();
    const data = encoder.encode(code.replace(/-/g, '').toUpperCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * HMAC-SHA1 using Web Crypto API
   */
  async function hmacSha1(key, message) {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
    return new Uint8Array(signature);
  }

  /**
   * Generate TOTP code for a given time
   */
  async function generateTOTP(secret, time = null) {
    const secretBytes = fromBase32(secret);
    const timeStep = time !== null ? time : Math.floor(Date.now() / 1000 / CONFIG.TOTP_PERIOD);

    // Convert time to 8-byte big-endian buffer
    const timeBuffer = new ArrayBuffer(8);
    const timeView = new DataView(timeBuffer);
    timeView.setUint32(4, timeStep, false); // Big-endian

    // Calculate HMAC
    const hmac = await hmacSha1(secretBytes, new Uint8Array(timeBuffer));

    // Dynamic truncation
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    ) % Math.pow(10, CONFIG.TOTP_DIGITS);

    return code.toString().padStart(CONFIG.TOTP_DIGITS, '0');
  }

  /**
   * Verify TOTP code with time window tolerance
   */
  async function verifyTOTP(secret, code) {
    const currentTime = Math.floor(Date.now() / 1000 / CONFIG.TOTP_PERIOD);
    const expectedCode = await generateTOTP(secret, currentTime);
    return timingSafeEqual(code, expectedCode);
  }

  /**
   * Timing-safe string comparison
   */
  function timingSafeEqual(a, b) {
    if (a.length !== b.length) return false;

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  /**
   * Generate otpauth:// URL for QR code
   */
  function generateOtpauthUrl(userId, secret) {
    const label = encodeURIComponent(`${CONFIG.APP_NAME}:${userId}`);
    const params = new URLSearchParams({
      secret: secret,
      issuer: CONFIG.ISSUER,
      algorithm: CONFIG.TOTP_ALGORITHM,
      digits: CONFIG.TOTP_DIGITS.toString(),
      period: CONFIG.TOTP_PERIOD.toString()
    });

    return `otpauth://totp/${label}?${params.toString()}`;
  }

  /**
   * Check and update rate limiting
   */
  function checkRateLimit(userId) {
    const now = Date.now();
    let tracking = attemptTracking.get(userId) || { attempts: 0, lockedUntil: 0 };

    // Check if locked
    if (tracking.lockedUntil > now) {
      const remainingSeconds = Math.ceil((tracking.lockedUntil - now) / 1000);
      return {
        allowed: false,
        message: `Konto er låst. Prøv igen om ${remainingSeconds} sekunder.`,
        remainingSeconds
      };
    }

    // Reset if lockout expired
    if (tracking.lockedUntil > 0 && tracking.lockedUntil <= now) {
      tracking = { attempts: 0, lockedUntil: 0 };
    }

    return { allowed: true, attempts: tracking.attempts };
  }

  /**
   * Record a failed attempt
   */
  function recordFailedAttempt(userId) {
    let tracking = attemptTracking.get(userId) || { attempts: 0, lockedUntil: 0 };
    tracking.attempts++;

    if (tracking.attempts >= CONFIG.MAX_ATTEMPTS) {
      tracking.lockedUntil = Date.now() + CONFIG.LOCKOUT_DURATION;
      tracking.attempts = 0;
    }

    attemptTracking.set(userId, tracking);
    return tracking;
  }

  /**
   * Clear failed attempts on successful verification
   */
  function clearAttempts(userId) {
    attemptTracking.delete(userId);
  }

  // =====================================================
  // Public API
  // =====================================================

  return {
    /**
     * Enable 2FA for a user - generates secret and QR code URL
     * @param {string} userId - User identifier (email or ID)
     * @param {string} appName - App name to show in authenticator
     * @returns {Object} Setup data including secret and QR URL
     */
    async enable(userId, appName = CONFIG.APP_NAME) {
      const secret = generateSecret();
      const backupCodes = generateBackupCodes();
      const hashedCodes = await Promise.all(backupCodes.map(hashBackupCode));

      const otpauthUrl = generateOtpauthUrl(userId, secret);

      // Store pending setup
      pendingSetups.set(userId, {
        secret,
        backupCodes,
        hashedCodes,
        createdAt: Date.now()
      });
      saveToStorage();

      return {
        success: true,
        secret,
        otpauthUrl,
        backupCodes,
        qrCodeData: otpauthUrl, // Can be used with QR code library
        message: 'Scan QR-koden med din authenticator app og indtast koden for at bekræfte'
      };
    },

    /**
     * Confirm 2FA setup after user verifies with first code
     * @param {string} userId - User identifier
     * @param {string} code - 6-digit code from authenticator
     * @returns {Object} Confirmation result
     */
    async confirm(userId, code) {
      const pending = pendingSetups.get(userId);

      if (!pending) {
        return {
          success: false,
          error: 'Ingen ventende 2FA opsætning fundet. Start forfra.'
        };
      }

      // Check if setup expired (10 minutes)
      if (Date.now() - pending.createdAt > 10 * 60 * 1000) {
        pendingSetups.delete(userId);
        return {
          success: false,
          error: '2FA opsætning udløbet. Start forfra.'
        };
      }

      // Verify the code
      const isValid = await verifyTOTP(pending.secret, code);

      if (!isValid) {
        return {
          success: false,
          error: 'Ugyldig kode. Tjek at tiden på din enhed er korrekt.'
        };
      }

      // Store confirmed setup
      userSecrets.set(userId, {
        secret: pending.secret,
        hashedCodes: pending.hashedCodes,
        enabled: true,
        confirmedAt: Date.now()
      });

      pendingSetups.delete(userId);
      saveToStorage();

      return {
        success: true,
        message: '2FA er nu aktiveret!',
        backupCodesRemaining: pending.hashedCodes.length
      };
    },

    /**
     * Verify 2FA code during login
     * @param {string} userId - User identifier
     * @param {string} code - 6-digit code from authenticator OR backup code
     * @returns {Object} Verification result
     */
    async verify(userId, code) {
      // Check rate limiting
      const rateCheck = checkRateLimit(userId);
      if (!rateCheck.allowed) {
        return { success: false, error: rateCheck.message, locked: true };
      }

      // Try to get from in-memory first, then localStorage fallback
      let userData = userSecrets.get(userId);
      if (!userData || !userData.enabled) {
        // Try fallback from orderflow_2fa_settings
        userData = getUserSecretFromFallback(userId);
      }

      if (!userData || !userData.enabled) {
        return {
          success: false,
          error: '2FA er ikke aktiveret for denne bruger'
        };
      }

      // Clean the code
      const cleanCode = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

      // Try TOTP verification first (6 digits)
      if (/^\d{6}$/.test(cleanCode)) {
        const isValid = await verifyTOTP(userData.secret, cleanCode);

        if (isValid) {
          clearAttempts(userId);
          return {
            success: true,
            method: 'totp',
            message: 'Kode verificeret'
          };
        }
      }

      // Try backup code (8 characters)
      if (cleanCode.length === 8 || cleanCode.length === 9) {
        const hashedInput = await hashBackupCode(cleanCode);
        const codeIndex = userData.hashedCodes.findIndex(h => h === hashedInput);

        if (codeIndex !== -1) {
          // Remove used backup code
          userData.hashedCodes.splice(codeIndex, 1);
          userSecrets.set(userId, userData);
          saveToStorage();

          clearAttempts(userId);
          return {
            success: true,
            method: 'backup',
            message: 'Backup kode brugt',
            backupCodesRemaining: userData.hashedCodes.length,
            warning: userData.hashedCodes.length < 3
              ? `Advarsel: Kun ${userData.hashedCodes.length} backup koder tilbage!`
              : null
          };
        }
      }

      // Invalid code
      const tracking = recordFailedAttempt(userId);
      const attemptsLeft = CONFIG.MAX_ATTEMPTS - tracking.attempts;

      return {
        success: false,
        error: `Ugyldig kode. ${attemptsLeft > 0 ? `${attemptsLeft} forsøg tilbage.` : 'Konto låst i 15 minutter.'}`,
        attemptsLeft: attemptsLeft > 0 ? attemptsLeft : 0
      };
    },

    /**
     * Disable 2FA for a user (requires current code for security)
     * @param {string} userId - User identifier
     * @param {string} code - Current valid code
     * @returns {Object} Result
     */
    async disable(userId, code) {
      // Verify code first
      const verifyResult = await this.verify(userId, code);

      if (!verifyResult.success) {
        return {
          success: false,
          error: 'Kunne ikke verificere kode. 2FA ikke deaktiveret.'
        };
      }

      userSecrets.delete(userId);
      pendingSetups.delete(userId);
      attemptTracking.delete(userId);
      saveToStorage();

      return {
        success: true,
        message: '2FA er nu deaktiveret'
      };
    },

    /**
     * Regenerate backup codes
     * @param {string} userId - User identifier
     * @param {string} code - Current valid code
     * @returns {Object} New backup codes
     */
    async regenerateBackupCodes(userId, code) {
      // Verify code first
      const verifyResult = await this.verify(userId, code);

      if (!verifyResult.success) {
        return {
          success: false,
          error: 'Kunne ikke verificere kode. Backup koder ikke regenereret.'
        };
      }

      const userData = userSecrets.get(userId);
      if (!userData) {
        return { success: false, error: '2FA ikke fundet' };
      }

      const newBackupCodes = generateBackupCodes();
      const hashedCodes = await Promise.all(newBackupCodes.map(hashBackupCode));

      userData.hashedCodes = hashedCodes;
      userSecrets.set(userId, userData);
      saveToStorage();

      return {
        success: true,
        backupCodes: newBackupCodes,
        message: 'Nye backup koder genereret. Gem dem sikkert!'
      };
    },

    /**
     * Check if user has 2FA enabled
     * @param {string} userId - User identifier
     * @returns {Object} Status
     */
    getStatus(userId) {
      let userData = userSecrets.get(userId);
      if (!userData) {
        userData = getUserSecretFromFallback(userId);
      }
      const pending = pendingSetups.get(userId);

      return {
        enabled: userData?.enabled || false,
        pendingSetup: !!pending,
        backupCodesRemaining: userData?.hashedCodes?.length || 0
      };
    },

    /**
     * Generate current TOTP for testing/debugging
     * Only available in development
     */
    async _debugGenerateCode(userId) {
      if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
        return { error: 'Not available in production' };
      }

      const userData = userSecrets.get(userId);
      if (!userData) return { error: 'User not found' };

      const code = await generateTOTP(userData.secret);
      return { code };
    },

    // Export config for external modification
    CONFIG,

    // Export utilities for Supabase integration
    utils: {
      generateSecret,
      generateBackupCodes,
      hashBackupCode,
      verifyTOTP,
      generateOtpauthUrl
    }
  };
})();

// Export for both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TOTP2FA;
}
if (typeof window !== 'undefined') {
  window.TOTP2FA = TOTP2FA;
}
