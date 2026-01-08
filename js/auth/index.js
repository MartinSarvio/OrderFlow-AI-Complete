/**
 * OrderFlow Auth System
 * Unified authentication module with TOTP 2FA and Email OTP
 *
 * Usage:
 *   const auth = require('./auth');  // Node.js
 *   // or use window.OrderFlowAuth in browser
 *
 *   // TOTP 2FA
 *   const setup = await auth.totp.enable('user@email.com');
 *   auth.totp.verify('user@email.com', '123456');
 *
 *   // Email OTP
 *   await auth.email.generate('user@email.com', {}, sendEmailFn);
 *   auth.email.verify('user@email.com', '123456');
 */

(function(root) {
  'use strict';

  // Import modules (works in both browser and Node.js)
  let TOTP2FA, EmailOTP;

  if (typeof require !== 'undefined') {
    // Node.js
    TOTP2FA = require('./totp-2fa');
    EmailOTP = require('./email-otp');
  } else if (typeof window !== 'undefined') {
    // Browser
    TOTP2FA = window.TOTP2FA;
    EmailOTP = window.EmailOTP;
  }

  // =====================================================
  // Unified Auth Manager
  // =====================================================

  const OrderFlowAuth = {
    /**
     * TOTP 2FA module
     */
    totp: TOTP2FA,

    /**
     * Email OTP module
     */
    email: EmailOTP,

    /**
     * Check if user requires 2FA based on role
     * @param {string} role - User role (admin, employee, customer)
     * @returns {Object} 2FA requirements
     */
    get2FARequirements(role) {
      const requirements = {
        admin: {
          required: false,      // Admin can opt-out
          recommended: true,
          canDisable: true
        },
        employee: {
          required: true,       // Must have at least one method
          recommended: true,
          canDisable: false
        },
        customer: {
          required: false,
          recommended: false,
          canDisable: true
        },
        demo: {
          required: false,
          recommended: false,
          canDisable: true
        }
      };

      return requirements[role] || requirements.customer;
    },

    /**
     * Check if user has valid 2FA setup
     * @param {string} userId - User ID
     * @param {Object} settings - User's 2FA settings from database
     * @returns {Object} Validation result
     */
    validate2FASetup(userId, settings, role) {
      const requirements = this.get2FARequirements(role);

      const hasTOTP = settings?.totp_enabled && settings?.totp_confirmed;
      const hasEmail = settings?.email_otp_enabled;
      const hasAny2FA = hasTOTP || hasEmail;

      if (requirements.required && !hasAny2FA) {
        return {
          valid: false,
          error: 'Du skal aktivere mindst én 2FA metode',
          requiresSetup: true,
          available: {
            totp: !hasTOTP,
            email: !hasEmail
          }
        };
      }

      return {
        valid: true,
        methods: {
          totp: hasTOTP,
          email: hasEmail
        },
        canDisable: requirements.canDisable && hasAny2FA,
        backupCodesRemaining: settings?.backup_codes_remaining || 0
      };
    },

    /**
     * Get available 2FA methods for a user
     * @param {Object} settings - User's 2FA settings
     * @returns {Array} Available methods for login challenge
     */
    getAvailableMethods(settings) {
      const methods = [];

      if (settings?.totp_enabled && settings?.totp_confirmed) {
        methods.push({
          type: 'totp',
          name: 'Authenticator App',
          description: 'Brug kode fra din authenticator app',
          icon: 'smartphone'
        });
      }

      if (settings?.email_otp_enabled) {
        methods.push({
          type: 'email',
          name: 'Email Kode',
          description: 'Modtag kode på din email',
          icon: 'mail'
        });
      }

      // Always allow backup codes if available
      if (settings?.backup_codes_remaining > 0) {
        methods.push({
          type: 'backup',
          name: 'Backup Kode',
          description: `${settings.backup_codes_remaining} koder tilbage`,
          icon: 'key'
        });
      }

      return methods;
    },

    /**
     * Verify 2FA code (auto-detect method)
     * @param {string} userId - User ID
     * @param {string} code - OTP code
     * @param {string} method - Method type (totp, email, backup)
     * @param {Object} settings - User's 2FA settings
     * @returns {Object} Verification result
     */
    async verify(userId, code, method, settings) {
      switch (method) {
        case 'totp':
        case 'backup':
          // TOTP verification handles both TOTP and backup codes
          return await this.totp.verify(userId, code);

        case 'email':
          return await this.email.verify(userId, code);

        default:
          return {
            success: false,
            error: 'Ukendt verifikationsmetode'
          };
      }
    },

    /**
     * Initialize 2FA challenge for login
     * @param {string} userId - User ID
     * @param {Object} settings - User's 2FA settings
     * @param {Function} sendEmailFn - Function to send email OTP
     * @returns {Object} Challenge data
     */
    async initChallenge(userId, settings, sendEmailFn) {
      const methods = this.getAvailableMethods(settings);

      if (methods.length === 0) {
        return {
          success: false,
          error: 'Ingen 2FA metoder konfigureret'
        };
      }

      // If email is the only or preferred method, send OTP automatically
      const emailMethod = methods.find(m => m.type === 'email');
      if (emailMethod && sendEmailFn) {
        await this.email.generate(userId, {}, sendEmailFn);
      }

      return {
        success: true,
        methods,
        preferredMethod: methods[0].type,
        emailSent: !!emailMethod
      };
    },

    /**
     * Version info
     */
    version: '1.0.0',

    /**
     * Debug mode check
     */
    get isDebugMode() {
      return typeof process === 'undefined' || process.env?.NODE_ENV !== 'production';
    }
  };

  // Export for various module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrderFlowAuth;
  }
  if (typeof window !== 'undefined') {
    window.OrderFlowAuth = OrderFlowAuth;
  }
  if (typeof root !== 'undefined') {
    root.OrderFlowAuth = OrderFlowAuth;
  }

})(typeof self !== 'undefined' ? self : this);
