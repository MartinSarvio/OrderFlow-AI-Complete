/**
 * FLOW Template Auth Bridge
 * Shared auth script for all web builder templates (skabelon-1, -2, -3)
 * Provides login, signup, logout via Supabase Auth + Admin Dashboard navigation
 */
(function() {
  'use strict';

  const SUPABASE_URL = 'https://qymtjhzgtcittohutmay.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5bXRqaHpndGNpdHRvaHV0bWF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTcyMzM2NiwiZXhwIjoyMDY3Mjk5MzY2fQ.th8EBi8r6JtR4nP0Q1FZoLiLT5-COohX4HvJ15Xd7G8';
  const AUTH_STORAGE_KEY = 'orderflow-template-auth';

  let supabase = null;
  let currentUser = null;

  // Resolve admin dashboard URL (relative to template location)
  function getAdminUrl() {
    const path = window.location.pathname;
    if (path.includes('/templates/skabelon-1/')) return '../../index.html';
    if (path.includes('/templates/skabelon-2/')) return '../../index.html';
    if (path.includes('/templates/skabelon-3/')) return '../../index.html';
    return '/index.html';
  }

  // Initialize Supabase client
  function initSupabase() {
    if (supabase) return supabase;

    // Check if Supabase JS is loaded (from CDN or parent)
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

  // Check existing session
  async function checkSession() {
    if (!supabase) return null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        currentUser = session.user;
        updateAuthUI(true);
        return session.user;
      }
    } catch (e) {
      console.warn('Template auth session check failed:', e);
    }
    updateAuthUI(false);
    return null;
  }

  // Login with email/password
  async function login(email, password) {
    if (!supabase) { initSupabase(); return { error: 'Supabase not ready' }; }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    currentUser = data.user;
    updateAuthUI(true);
    return { user: data.user };
  }

  // Signup with email/password
  async function signup(email, password, name) {
    if (!supabase) { initSupabase(); return { error: 'Supabase not ready' }; }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });
    if (error) return { error: error.message };

    currentUser = data.user;
    updateAuthUI(true);
    return { user: data.user };
  }

  // Logout
  async function logout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    currentUser = null;
    updateAuthUI(false);
  }

  // Navigate to admin dashboard
  function goToAdmin() {
    window.location.href = getAdminUrl();
  }

  // Update UI based on auth state
  function updateAuthUI(isLoggedIn) {
    // Elements with data-auth attributes
    document.querySelectorAll('[data-auth="logged-out"]').forEach(el => {
      el.style.display = isLoggedIn ? 'none' : '';
    });
    document.querySelectorAll('[data-auth="logged-in"]').forEach(el => {
      el.style.display = isLoggedIn ? '' : 'none';
    });

    // Update user name displays
    if (isLoggedIn && currentUser) {
      document.querySelectorAll('[data-auth-name]').forEach(el => {
        el.textContent = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Bruger';
      });
    }
  }

  // Show login modal (for jQuery/Bootstrap templates)
  function showLoginModal() {
    const modal = document.getElementById('flow-login-modal');
    if (modal) {
      if (window.jQuery) {
        window.jQuery(modal).modal('show');
      } else {
        modal.style.display = 'flex';
        modal.classList.add('show');
      }
    }
  }

  // Show signup modal
  function showSignupModal() {
    const modal = document.getElementById('flow-signup-modal');
    if (modal) {
      if (window.jQuery) {
        window.jQuery(modal).modal('show');
      } else {
        modal.style.display = 'flex';
        modal.classList.add('show');
      }
    }
  }

  // Close modal
  function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      if (window.jQuery) {
        window.jQuery(modal).modal('hide');
      } else {
        modal.style.display = 'none';
        modal.classList.remove('show');
      }
    }
  }

  // Handle login form submit
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

  // Handle signup form submit
  async function handleSignup(e) {
    if (e) e.preventDefault();
    const name = document.getElementById('flow-signup-name')?.value?.trim();
    const email = document.getElementById('flow-signup-email')?.value?.trim();
    const password = document.getElementById('flow-signup-password')?.value;
    const errorEl = document.getElementById('flow-signup-error');
    const btn = document.getElementById('flow-signup-btn');

    if (!email || !password) {
      if (errorEl) errorEl.textContent = 'Udfyld alle felter';
      return;
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Opretter konto...'; }
    if (errorEl) errorEl.textContent = '';

    const result = await signup(email, password, name);

    if (btn) { btn.disabled = false; btn.textContent = 'Opret konto'; }

    if (result.error) {
      if (errorEl) errorEl.textContent = result.error;
    } else {
      closeModal('flow-signup-modal');
    }
  }

  // Expose API globally
  window.FlowAuth = {
    init: initSupabase,
    checkSession,
    login,
    signup,
    logout,
    goToAdmin,
    showLoginModal,
    showSignupModal,
    handleLogin,
    handleSignup,
    getUser: () => currentUser
  };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initSupabase(); setTimeout(checkSession, 300); });
  } else {
    initSupabase();
    setTimeout(checkSession, 300);
  }
})();
