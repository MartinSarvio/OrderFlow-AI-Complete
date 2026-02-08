/**
 * FLOW Template Auth - Customer-facing
 * Shared auth for all web builder templates (skabelon-1, -2, -3) + mobile app
 * Provides: customer login, signup, guest checkout, profile, order history
 * NOTE: This is customer-only auth. Admin access is NOT exposed here.
 */
(function() {
  'use strict';

  const SUPABASE_URL = 'https://qymtjhzgtcittohutmay.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5bXRqaHpndGNpdHRvaHV0bWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MjMzNjYsImV4cCI6MjA2NzI5OTM2Nn0.n6FYURqirRHO0pLPVDflAjH34aiiSxx7a_ZckDPW4DE';
  const AUTH_STORAGE_KEY = 'flow-customer-auth';
  const GUEST_STORAGE_KEY = 'flow-guest-customer';

  let supabase = null;
  let currentUser = null;
  let guestData = null;
  let authListeners = [];

  // ========== INITIALIZATION ==========

  function initSupabase() {
    if (supabase) return supabase;

    if (window.supabase?.createClient) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storageKey: AUTH_STORAGE_KEY,
          storage: window.localStorage
        }
      });
      return supabase;
    }

    // Load Supabase from CDN dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    script.onload = function() {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storageKey: AUTH_STORAGE_KEY,
          storage: window.localStorage
        }
      });
      checkSession();
    };
    document.head.appendChild(script);
    return null;
  }

  // ========== SESSION MANAGEMENT ==========

  async function checkSession() {
    if (!supabase) return null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        currentUser = session.user;
        notifyListeners(true);
        updateAuthUI(true);
        return session.user;
      }
    } catch (e) {
      console.warn('FlowAuth: session check failed:', e);
    }

    // Check for saved guest data
    loadGuestData();
    notifyListeners(false);
    updateAuthUI(false);
    return null;
  }

  // ========== CUSTOMER LOGIN ==========

  async function login(email, password) {
    if (!supabase) { initSupabase(); return { error: 'Supabase ikke klar' }; }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    currentUser = data.user;
    clearGuestData();
    notifyListeners(true);
    updateAuthUI(true);
    return { user: data.user };
  }

  // ========== CUSTOMER SIGNUP ==========

  async function signup(email, password, name, phone) {
    if (!supabase) { initSupabase(); return { error: 'Supabase ikke klar' }; }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          phone: phone || '',
          role: 'customer'
        }
      }
    });
    if (error) return { error: error.message };

    currentUser = data.user;
    clearGuestData();
    notifyListeners(true);
    updateAuthUI(true);
    return { user: data.user };
  }

  // ========== GUEST CHECKOUT ==========

  /**
   * Save guest customer data (no account required)
   * Used during checkout for customers who don't want to create an account
   */
  function setGuestData(data) {
    guestData = {
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      savedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestData));
    } catch (e) { /* ignore */ }
    return guestData;
  }

  function loadGuestData() {
    try {
      const saved = localStorage.getItem(GUEST_STORAGE_KEY);
      if (saved) guestData = JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return guestData;
  }

  function clearGuestData() {
    guestData = null;
    try { localStorage.removeItem(GUEST_STORAGE_KEY); } catch (e) { /* ignore */ }
  }

  function getGuestData() {
    if (!guestData) loadGuestData();
    return guestData;
  }

  // ========== LOGOUT ==========

  async function logout() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    currentUser = null;
    clearGuestData();
    notifyListeners(false);
    updateAuthUI(false);
  }

  // ========== AUTH STATE LISTENERS ==========

  function onAuthChange(callback) {
    authListeners.push(callback);
    return () => {
      authListeners = authListeners.filter(cb => cb !== callback);
    };
  }

  function notifyListeners(isLoggedIn) {
    authListeners.forEach(cb => {
      try { cb(isLoggedIn, currentUser); } catch (e) { /* ignore */ }
    });
  }

  // ========== CUSTOMER INFO ==========

  function getUser() {
    return currentUser;
  }

  function isLoggedIn() {
    return !!currentUser;
  }

  function getCustomerName() {
    if (currentUser) {
      return currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Kunde';
    }
    if (guestData) return guestData.name || 'G\u00e6st';
    return null;
  }

  function getCustomerEmail() {
    if (currentUser) return currentUser.email;
    if (guestData) return guestData.email;
    return null;
  }

  function getCustomerPhone() {
    if (currentUser) return currentUser.user_metadata?.phone || '';
    if (guestData) return guestData.phone;
    return null;
  }

  /**
   * Get customer data object (works for both logged-in and guest)
   */
  function getCustomerData() {
    if (currentUser) {
      return {
        name: currentUser.user_metadata?.full_name || '',
        email: currentUser.email || '',
        phone: currentUser.user_metadata?.phone || '',
        isGuest: false,
        userId: currentUser.id
      };
    }
    if (guestData) {
      return {
        name: guestData.name || '',
        email: guestData.email || '',
        phone: guestData.phone || '',
        isGuest: true,
        userId: null
      };
    }
    return null;
  }

  // ========== UI HELPERS ==========

  function updateAuthUI(isLoggedIn) {
    document.querySelectorAll('[data-auth="logged-out"]').forEach(el => {
      el.style.display = isLoggedIn ? 'none' : '';
    });
    document.querySelectorAll('[data-auth="logged-in"]').forEach(el => {
      el.style.display = isLoggedIn ? '' : 'none';
    });

    if (isLoggedIn && currentUser) {
      document.querySelectorAll('[data-auth-name]').forEach(el => {
        el.textContent = getCustomerName();
      });
      document.querySelectorAll('[data-auth-email]').forEach(el => {
        el.textContent = currentUser.email || '';
      });
    }
  }

  // Show login modal (jQuery/Bootstrap or vanilla)
  function showLoginModal() {
    showModal('flow-login-modal');
  }

  function showSignupModal() {
    showModal('flow-signup-modal');
  }

  function showProfileModal() {
    showModal('flow-profile-modal');
  }

  function showModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    if (window.jQuery) {
      window.jQuery(modal).modal('show');
    } else {
      modal.style.display = 'flex';
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    if (window.jQuery) {
      window.jQuery(modal).modal('hide');
    } else {
      modal.style.display = 'none';
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  }

  // ========== FORM HANDLERS ==========

  async function handleLogin(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('flow-login-email')?.value?.trim();
    const password = document.getElementById('flow-login-password')?.value;
    const errorEl = document.getElementById('flow-login-error');
    const btn = document.getElementById('flow-login-btn');

    if (!email || !password) {
      if (errorEl) errorEl.textContent = 'Udfyld email og adgangskode';
      return;
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Logger ind...'; }
    if (errorEl) errorEl.textContent = '';

    const result = await login(email, password);

    if (btn) { btn.disabled = false; btn.textContent = 'Log ind'; }

    if (result.error) {
      if (errorEl) errorEl.textContent = result.error;
    } else {
      closeModal('flow-login-modal');
    }
  }

  async function handleSignup(e) {
    if (e) e.preventDefault();
    const name = document.getElementById('flow-signup-name')?.value?.trim();
    const email = document.getElementById('flow-signup-email')?.value?.trim();
    const phone = document.getElementById('flow-signup-phone')?.value?.trim();
    const password = document.getElementById('flow-signup-password')?.value;
    const errorEl = document.getElementById('flow-signup-error');
    const btn = document.getElementById('flow-signup-btn');

    if (!email || !password) {
      if (errorEl) errorEl.textContent = 'Udfyld email og adgangskode';
      return;
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Opretter konto...'; }
    if (errorEl) errorEl.textContent = '';

    const result = await signup(email, password, name, phone);

    if (btn) { btn.disabled = false; btn.textContent = 'Opret konto'; }

    if (result.error) {
      if (errorEl) errorEl.textContent = result.error;
    } else {
      closeModal('flow-signup-modal');
    }
  }

  // ========== EXPOSE CUSTOMER-FACING API ==========

  window.FlowAuth = {
    // Init
    init: initSupabase,
    checkSession,

    // Auth
    login,
    signup,
    logout,
    isLoggedIn,

    // Guest checkout
    setGuestData,
    getGuestData,
    clearGuestData,

    // Customer info
    getUser,
    getCustomerName,
    getCustomerEmail,
    getCustomerPhone,
    getCustomerData,

    // Auth state
    onAuthChange,

    // UI
    showLoginModal,
    showSignupModal,
    showProfileModal,
    closeModal,
    handleLogin,
    handleSignup
  };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initSupabase(); setTimeout(checkSession, 300); });
  } else {
    initSupabase();
    setTimeout(checkSession, 300);
  }
})();
