/**
 * Email OTP Module for OrderFlow
 * Secure email-based one-time password authentication
 *
 * Features:
 * - 6-digit OTP codes
 * - 10 minute expiration
 * - Rate limiting (5/hour, 15/day)
 * - HTML email templates
 * - Timing-safe verification
 */

const EmailOTP = (function() {
  'use strict';

  // =====================================================
  // Configuration
  // =====================================================
  const CONFIG = {
    // OTP settings
    OTP_LENGTH: 6,
    OTP_EXPIRY: 10 * 60 * 1000,  // 10 minutes
    OTP_CHARS: '0123456789',     // Numeric only for easy input

    // Rate limiting
    MAX_PER_HOUR: 5,
    MAX_PER_DAY: 15,
    LOCKOUT_DURATION: 60 * 60 * 1000,  // 1 hour

    // Verification attempts
    MAX_VERIFY_ATTEMPTS: 5,

    // App info
    APP_NAME: 'OrderFlow',
    SUPPORT_EMAIL: 'support@orderflow.dk'
  };

  // =====================================================
  // In-memory storage (replace with Supabase in production)
  // =====================================================
  const pendingOTPs = new Map();      // email -> OTP data
  const rateLimits = new Map();        // email -> rate limit data
  const verifyAttempts = new Map();    // email -> attempt count

  // =====================================================
  // Utility Functions
  // =====================================================

  /**
   * Generate cryptographically secure random OTP
   */
  function generateOTPCode() {
    const array = new Uint8Array(CONFIG.OTP_LENGTH);
    crypto.getRandomValues(array);

    let otp = '';
    for (let i = 0; i < CONFIG.OTP_LENGTH; i++) {
      otp += CONFIG.OTP_CHARS[array[i] % CONFIG.OTP_CHARS.length];
    }
    return otp;
  }

  /**
   * Hash OTP for storage
   */
  async function hashOTP(otp, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(otp + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate random salt
   */
  function generateSalt() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
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
   * Check rate limits
   */
  function checkRateLimit(email) {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    let limits = rateLimits.get(email) || { attempts: [], lockedUntil: 0 };

    // Check lockout
    if (limits.lockedUntil > now) {
      const remainingMinutes = Math.ceil((limits.lockedUntil - now) / 60000);
      return {
        allowed: false,
        reason: `For mange forsøg. Prøv igen om ${remainingMinutes} minutter.`,
        remainingMinutes
      };
    }

    // Clean old attempts
    limits.attempts = limits.attempts.filter(t => t > oneDayAgo);

    // Count recent attempts
    const hourlyAttempts = limits.attempts.filter(t => t > oneHourAgo).length;
    const dailyAttempts = limits.attempts.length;

    if (hourlyAttempts >= CONFIG.MAX_PER_HOUR) {
      limits.lockedUntil = now + CONFIG.LOCKOUT_DURATION;
      rateLimits.set(email, limits);
      return {
        allowed: false,
        reason: 'Maksimalt antal koder pr. time nået. Prøv igen om en time.'
      };
    }

    if (dailyAttempts >= CONFIG.MAX_PER_DAY) {
      return {
        allowed: false,
        reason: 'Maksimalt antal koder pr. dag nået. Prøv igen i morgen.'
      };
    }

    return {
      allowed: true,
      hourlyRemaining: CONFIG.MAX_PER_HOUR - hourlyAttempts,
      dailyRemaining: CONFIG.MAX_PER_DAY - dailyAttempts
    };
  }

  /**
   * Record OTP request for rate limiting
   */
  function recordOTPRequest(email) {
    let limits = rateLimits.get(email) || { attempts: [], lockedUntil: 0 };
    limits.attempts.push(Date.now());
    rateLimits.set(email, limits);
  }

  /**
   * Check verification attempts
   */
  function checkVerifyAttempts(email) {
    const attempts = verifyAttempts.get(email) || { count: 0, lockedUntil: 0 };
    const now = Date.now();

    if (attempts.lockedUntil > now) {
      const remainingSeconds = Math.ceil((attempts.lockedUntil - now) / 1000);
      return { allowed: false, remainingSeconds };
    }

    if (attempts.count >= CONFIG.MAX_VERIFY_ATTEMPTS) {
      attempts.lockedUntil = now + 15 * 60 * 1000; // 15 min lockout
      attempts.count = 0;
      verifyAttempts.set(email, attempts);
      return { allowed: false, remainingSeconds: 15 * 60 };
    }

    return { allowed: true, attemptsLeft: CONFIG.MAX_VERIFY_ATTEMPTS - attempts.count };
  }

  /**
   * Record failed verification
   */
  function recordFailedVerify(email) {
    let attempts = verifyAttempts.get(email) || { count: 0, lockedUntil: 0 };
    attempts.count++;
    verifyAttempts.set(email, attempts);
    return CONFIG.MAX_VERIFY_ATTEMPTS - attempts.count;
  }

  /**
   * Clear verification attempts on success
   */
  function clearVerifyAttempts(email) {
    verifyAttempts.delete(email);
  }

  // =====================================================
  // Email Templates
  // =====================================================

  const templates = {
    /**
     * Generate HTML email template
     */
    html(otp, expiryMinutes = 10) {
      return `
<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Din engangskode - ${CONFIG.APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" style="width:100%;max-width:480px;border-collapse:collapse;background:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);border-radius:12px 12px 0 0;">
              <h1 style="margin:0;color:#2dd4bf;font-size:24px;font-weight:700;">${CONFIG.APP_NAME}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;font-weight:600;">Din engangskode</h2>
              <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
                Brug denne kode til at logge ind. Koden udløber om ${expiryMinutes} minutter.
              </p>

              <!-- OTP Code Box -->
              <div style="background:#f8fafc;border:2px dashed #e2e8f0;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
                <span style="font-family:'Courier New',monospace;font-size:36px;font-weight:700;letter-spacing:8px;color:#0f172a;">${otp}</span>
              </div>

              <p style="margin:0 0 8px;color:#64748b;font-size:13px;">
                <strong>Sikkerhedstip:</strong>
              </p>
              <ul style="margin:0 0 24px;padding-left:20px;color:#64748b;font-size:13px;line-height:1.8;">
                <li>Del aldrig denne kode med andre</li>
                <li>Vi vil aldrig bede om din kode via telefon</li>
                <li>Hvis du ikke anmodede om denne kode, ignorer denne email</li>
              </ul>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background:#f8fafc;border-radius:0 0 12px 12px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                Denne email blev sendt af ${CONFIG.APP_NAME}.<br>
                Brug for hjælp? <a href="mailto:${CONFIG.SUPPORT_EMAIL}" style="color:#2dd4bf;text-decoration:none;">${CONFIG.SUPPORT_EMAIL}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    },

    /**
     * Generate plain text email
     */
    text(otp, expiryMinutes = 10) {
      return `${CONFIG.APP_NAME} - Din engangskode

Din engangskode er: ${otp}

Koden udløber om ${expiryMinutes} minutter.

SIKKERHEDSTIP:
- Del aldrig denne kode med andre
- Vi vil aldrig bede om din kode via telefon
- Hvis du ikke anmodede om denne kode, ignorer denne email

Med venlig hilsen,
${CONFIG.APP_NAME}
${CONFIG.SUPPORT_EMAIL}`;
    },

    /**
     * Email subject
     */
    subject() {
      return `${CONFIG.APP_NAME}: Din engangskode`;
    }
  };

  // =====================================================
  // Public API
  // =====================================================

  return {
    /**
     * Generate and send OTP via email
     * @param {string} email - Recipient email
     * @param {Object} metadata - Optional metadata (IP, user agent)
     * @param {Function} sendFn - Async function to send email: (data) => Promise
     * @returns {Object} Result
     */
    async generate(email, metadata = {}, sendFn) {
      email = email.toLowerCase().trim();

      // Check rate limit
      const rateCheck = checkRateLimit(email);
      if (!rateCheck.allowed) {
        return {
          success: false,
          error: rateCheck.reason,
          rateLimited: true
        };
      }

      // Generate OTP
      const otp = generateOTPCode();
      const salt = generateSalt();
      const hash = await hashOTP(otp, salt);

      // Store pending OTP
      pendingOTPs.set(email, {
        hash,
        salt,
        expiresAt: Date.now() + CONFIG.OTP_EXPIRY,
        metadata,
        createdAt: Date.now()
      });

      // Record for rate limiting
      recordOTPRequest(email);

      // Clear previous verification attempts
      clearVerifyAttempts(email);

      // Prepare email data
      const emailData = {
        to: email,
        subject: templates.subject(),
        html: templates.html(otp),
        text: templates.text(otp),
        otp: otp  // Include for debug in development
      };

      // Send email via provided function
      if (sendFn) {
        try {
          await sendFn(emailData);
        } catch (err) {
          console.error('Email send error:', err);
          return {
            success: false,
            error: 'Kunne ikke sende email. Prøv igen.'
          };
        }
      }

      const result = {
        success: true,
        message: `Engangskode sendt til ${email}`,
        expiresIn: CONFIG.OTP_EXPIRY / 1000,
        remaining: {
          hourly: rateCheck.hourlyRemaining - 1,
          daily: rateCheck.dailyRemaining - 1
        }
      };

      // Include OTP in debug mode only
      if (typeof process === 'undefined' || process.env?.NODE_ENV !== 'production') {
        result._debug_otp = otp;
      }

      return result;
    },

    /**
     * Verify email OTP
     * @param {string} email - User email
     * @param {string} code - 6-digit code
     * @returns {Object} Verification result
     */
    async verify(email, code) {
      email = email.toLowerCase().trim();
      code = code.replace(/\s/g, '');  // Remove whitespace

      // Check verification attempts
      const attemptCheck = checkVerifyAttempts(email);
      if (!attemptCheck.allowed) {
        return {
          success: false,
          error: `For mange forsøg. Prøv igen om ${Math.ceil(attemptCheck.remainingSeconds / 60)} minutter.`,
          locked: true
        };
      }

      // Get pending OTP
      const pending = pendingOTPs.get(email);

      if (!pending) {
        recordFailedVerify(email);
        return {
          success: false,
          error: 'Ingen aktiv kode. Anmod om en ny kode.',
          noCode: true
        };
      }

      // Check expiration
      if (Date.now() > pending.expiresAt) {
        pendingOTPs.delete(email);
        return {
          success: false,
          error: 'Koden er udløbet. Anmod om en ny kode.',
          expired: true
        };
      }

      // Verify code
      const inputHash = await hashOTP(code, pending.salt);
      const isValid = timingSafeEqual(inputHash, pending.hash);

      if (!isValid) {
        const attemptsLeft = recordFailedVerify(email);
        return {
          success: false,
          error: `Ugyldig kode. ${attemptsLeft > 0 ? `${attemptsLeft} forsøg tilbage.` : 'Konto midlertidigt låst.'}`,
          attemptsLeft: attemptsLeft > 0 ? attemptsLeft : 0
        };
      }

      // Success - clean up
      pendingOTPs.delete(email);
      clearVerifyAttempts(email);

      return {
        success: true,
        message: 'Kode verificeret',
        verifiedAt: Date.now()
      };
    },

    /**
     * Cancel pending OTP
     * @param {string} email - User email
     */
    cancel(email) {
      email = email.toLowerCase().trim();
      const existed = pendingOTPs.has(email);
      pendingOTPs.delete(email);
      clearVerifyAttempts(email);

      return {
        success: true,
        cancelled: existed
      };
    },

    /**
     * Get OTP status
     * @param {string} email - User email
     */
    getStatus(email) {
      email = email.toLowerCase().trim();
      const pending = pendingOTPs.get(email);
      const rateCheck = checkRateLimit(email);

      if (!pending) {
        return {
          hasPendingOTP: false,
          canRequest: rateCheck.allowed,
          rateLimit: rateCheck
        };
      }

      const expiresIn = Math.max(0, pending.expiresAt - Date.now());
      return {
        hasPendingOTP: true,
        expiresIn: Math.ceil(expiresIn / 1000),
        canRequest: rateCheck.allowed,
        rateLimit: rateCheck
      };
    },

    /**
     * Resend OTP (cancel current and generate new)
     */
    async resend(email, metadata = {}, sendFn) {
      this.cancel(email);
      return this.generate(email, metadata, sendFn);
    },

    // Export templates for customization
    templates,

    // Export config
    CONFIG,

    // Utilities for Supabase integration
    utils: {
      generateOTPCode,
      hashOTP,
      generateSalt,
      checkRateLimit
    }
  };
})();

// Export for both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EmailOTP;
}
if (typeof window !== 'undefined') {
  window.EmailOTP = EmailOTP;
}
