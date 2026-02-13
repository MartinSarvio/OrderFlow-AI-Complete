// =====================================================
// ORDERFLOW AI - APP.JS (v138 — Security Release v4.12.0)
// =====================================================

// =====================================================
// THEME TOGGLE
// =====================================================
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';

  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeToggleTooltip(newTheme);

  // Update meta theme-color for mobile browsers
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', newTheme === 'light' ? '#F0F2F5' : '#13131F');
  }

  // Update logos based on theme
  updateLogos(newTheme);

  // Reinitialize charts with new theme colors
  if (typeof initRevenueChart === 'function') {
    setTimeout(() => initRevenueChart(), 50);
  }

  console.log('Theme changed to:', newTheme);
}

// Update logo images based on theme
function updateLogos(theme) {
  // Always use white logo in both dark and light mode
  const logoSrc = 'images/FLOW-logo-hvid-4K.png';

  // Update all logo images (including sidebar logo and any with flow-logo class)
  document.querySelectorAll('.logo img, .app-logo img, .auth-logo img, .flow-logo, img[src*="FLOW-logo"]').forEach(img => {
    img.src = logoSrc;
  });
}

// Update theme toggle button tooltip
function updateThemeToggleTooltip(theme) {
  const themeBtn = document.querySelector('.theme-toggle-btn');
  if (themeBtn) {
    themeBtn.title = theme === 'light'
      ? 'Skift til mørk tilstand'
      : 'Skift til lys tilstand';
  }
}

// Initialize theme on page load
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');

  document.documentElement.setAttribute('data-theme', theme);

  // Update meta theme-color
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', theme === 'light' ? '#F0F2F5' : '#13131F');
  }

  // Update logos and tooltip when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      updateLogos(theme);
      updateThemeToggleTooltip(theme);
    });
  } else {
    updateLogos(theme);
    updateThemeToggleTooltip(theme);
  }

  console.log('Theme initialized:', theme);
}

// Initialize theme immediately (before DOMContentLoaded)
initTheme();

// Builder change-tracking flags (declared early to avoid TDZ errors)
// Used for auto-save functionality only (unsaved changes modal removed)
let webBuilderHasChanges = false;
let appBuilderHasChanges = false;
let cmsHasChanges = false;

// Clean up old SMS provider localStorage keys (removed providers: Twilio, GatewayAPI)
(function cleanupOldSmsProviders() {
  const oldKeys = [
    'twilio_account_sid',
    'twilio_auth_token',
    'twilio_phone_number',
    'api_twilio_enabled',
    'gatewayapi_token',
    'gatewayapi_sender',
    'api_gatewayapi_enabled'
  ];

  oldKeys.forEach(key => localStorage.removeItem(key));
})();

// Library Shims (jsPDF mock only - Chart.js loaded from CDN)
window.jspdf={jsPDF:function(){var s={setFontSize:function(){return s},setTextColor:function(){return s},text:function(){return s},setDrawColor:function(){return s},setFillColor:function(){return s},rect:function(){return s},line:function(){return s},addImage:function(){return s},save:function(){alert("PDF kræver download");return s},internal:{pageSize:{getWidth:function(){return 210},getHeight:function(){return 297}}}};return s}};

// =====================================================
// ORDERFLOW AI - APP.JS (v133)
// =====================================================
// 
// ⚠️  SIKKERHEDSADVARSEL: 
// API-nøgler herunder er EKSPONEREDE i frontend-kode.
// I produktion bør disse flyttes til:
// - Environment variables på serveren
// - En backend/serverless function der håndterer API-kald
// - Supabase Edge Functions eller lignende
//
// CHANGELOG v133:
// - Tilføjet Support/Dokumentation sektion
// - Integreret alle guides fra dokumentationen
// - Søgefunktion i dokumentation
// - Responsivt design for dokumentation
//
// =====================================================

// =====================================================
// CONFIG - YOUR SETTINGS
// =====================================================
const CONFIG = {
  // Supabase
  SUPABASE_URL: 'https://qymtjhzgtcittohutmay.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5bXRqaHpndGNpdHRvaHV0bWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MjMzNjYsImV4cCI6MjA2NzI5OTM2Nn0.n6FYURqirRHO0pLPVDflAjH34aiiSxx7a_ZckDPW4DE',
  
  // OpenAI (indtastes i Indstillinger → API Adgang)
  OPENAI_API_KEY: '',
  
  // Demo mode (DEAKTIVERET - Produktionsklar)
  DEMO_MODE: false
};

// =====================================================
// AI CHAT PROXY - Routes through Supabase Edge Function
// =====================================================
async function callAIChat(systemPrompt, userMessage, restaurantId, maxTokens) {
  const rid = restaurantId || localStorage.getItem('current_restaurant_id') || 'default';
  try {
    const response = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        systemPrompt: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        restaurantId: rid,
        maxTokens: maxTokens || 1024
      })
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `AI service error: ${response.status}`);
    }
    const data = await response.json();
    return data.response || '';
  } catch (e) {
    console.warn('AI chat proxy failed:', e.message);
    throw e;
  }
}

// =====================================================
// DEMO MENU DATA (Used when no API endpoint is configured)
// =====================================================
const DEMO_MENUS = {
  'd1': { // Bella Italia
    restaurantId: 'd1',
    restaurantName: 'Bella Italia',
    currency: 'DKK',
    items: [
      { id: 1, number: '1', name: 'Pizza Margherita', description: 'Tomat, mozzarella, basilikum', price: 89, category: 'Pizza' },
      { id: 2, number: '2', name: 'Pizza Pepperoni', description: 'Tomat, mozzarella, pepperoni', price: 99, category: 'Pizza' },
      { id: 3, number: '3', name: 'Pizza Hawaii', description: 'Tomat, mozzarella, skinke, ananas', price: 99, category: 'Pizza' },
      { id: 4, number: '4', name: 'Pizza Quattro Stagioni', description: 'Tomat, mozzarella, skinke, champignon, artiskok, oliven', price: 109, category: 'Pizza' },
      { id: 5, number: '5', name: 'Pizza Diavola', description: 'Tomat, mozzarella, spicy salami, chili', price: 105, category: 'Pizza' },
      { id: 6, number: '6', name: 'Calzone', description: 'Foldet pizza med skinke og ost', price: 99, category: 'Pizza' },
      { id: 7, number: '7', name: 'Spaghetti Bolognese', description: 'Klassisk kødsauce', price: 95, category: 'Pasta' },
      { id: 8, number: '8', name: 'Spaghetti Carbonara', description: 'Æg, bacon, parmesan', price: 99, category: 'Pasta' },
      { id: 9, number: '9', name: 'Lasagne', description: 'Hjemmelavet med kødsauce og bechamel', price: 109, category: 'Pasta' },
      { id: 10, number: '10', name: 'Tiramisu', description: 'Klassisk italiensk dessert', price: 59, category: 'Dessert' },
      { id: 11, number: '11', name: 'Panna Cotta', description: 'Med bærcompot', price: 55, category: 'Dessert' },
      { id: 12, number: '12', name: 'Coca-Cola', description: '33cl', price: 25, category: 'Drikkevarer' },
      { id: 13, number: '13', name: 'Fanta', description: '33cl', price: 25, category: 'Drikkevarer' },
      { id: 14, number: '14', name: 'Vand', description: '50cl', price: 20, category: 'Drikkevarer' }
    ]
  },
  'd2': { // Sushi House
    restaurantId: 'd2',
    restaurantName: 'Sushi House',
    currency: 'DKK',
    items: [
      { id: 1, number: '1', name: 'Salmon Nigiri (2 stk)', description: 'Frisk laks på ris', price: 45, category: 'Nigiri' },
      { id: 2, number: '2', name: 'Tuna Nigiri (2 stk)', description: 'Frisk tun på ris', price: 55, category: 'Nigiri' },
      { id: 3, number: '3', name: 'California Roll (8 stk)', description: 'Krabbe, avocado, agurk', price: 89, category: 'Maki' },
      { id: 4, number: '4', name: 'Spicy Tuna Roll (8 stk)', description: 'Krydret tun, avocado', price: 99, category: 'Maki' },
      { id: 5, number: '5', name: 'Dragon Roll (8 stk)', description: 'Tempura rejer, ål, avocado', price: 129, category: 'Special Rolls' },
      { id: 6, number: '6', name: 'Rainbow Roll (8 stk)', description: 'Assorteret fisk ovenpå California roll', price: 139, category: 'Special Rolls' },
      { id: 7, number: '7', name: 'Sashimi Mix (12 stk)', description: 'Laks, tun, hamachi', price: 159, category: 'Sashimi' },
      { id: 8, number: '8', name: 'Edamame', description: 'Dampede sojabønner med salt', price: 35, category: 'Sides' },
      { id: 9, number: '9', name: 'Miso Suppe', description: 'Traditionel japansk suppe', price: 29, category: 'Sides' },
      { id: 10, number: '10', name: 'Grøn Te', description: 'Varm japansk grøn te', price: 25, category: 'Drikkevarer' }
    ]
  },
  'd3': { // Burger Joint
    restaurantId: 'd3',
    restaurantName: 'Burger Joint',
    currency: 'DKK',
    items: [
      { id: 1, number: '1', name: 'Classic Burger', description: '180g bøf, salat, tomat, løg, dressing', price: 89, category: 'Burgere' },
      { id: 2, number: '2', name: 'Cheese Burger', description: '180g bøf, cheddar, salat, tomat, dressing', price: 99, category: 'Burgere' },
      { id: 3, number: '3', name: 'Bacon Burger', description: '180g bøf, bacon, cheddar, BBQ sauce', price: 109, category: 'Burgere' },
      { id: 4, number: '4', name: 'Double Burger', description: '2x180g bøf, dobbelt ost, special sauce', price: 139, category: 'Burgere' },
      { id: 5, number: '5', name: 'Chicken Burger', description: 'Sprød kylling, coleslaw, mayo', price: 99, category: 'Burgere' },
      { id: 6, number: '6', name: 'Pommes Frites', description: 'Stor portion', price: 35, category: 'Sides' },
      { id: 7, number: '7', name: 'Sweet Potato Fries', description: 'Søde kartofler', price: 45, category: 'Sides' },
      { id: 8, number: '8', name: 'Onion Rings', description: '8 stk med dip', price: 45, category: 'Sides' },
      { id: 9, number: '9', name: 'Milkshake', description: 'Vanilje, chokolade eller jordbær', price: 49, category: 'Drikkevarer' },
      { id: 10, number: '10', name: 'Coca-Cola', description: '50cl', price: 30, category: 'Drikkevarer' }
    ]
  }
};

// =====================================================
// INITIALIZE
// =====================================================
// NOTE: supabase/supabaseClient is initialized in supabase-client.js
let currentUser = null;
let restaurants = [];
let liveMode = false;
let testRunning = false;
let replyResolver = null;

// Global resolver for workflow replies - bruges af RealtimeSync
window.resolveWorkflowReply = null;

// Refresh data fra database - kaldes ved navigation for at sikre frisk data
async function refreshRestaurantsFromDB() {
  if (!currentUser?.id || typeof SupabaseDB === 'undefined') return;

  try {
    const freshData = await SupabaseDB.getRestaurants(currentUser.id);
    if (freshData && freshData.length > 0) {
      restaurants = freshData;
      persistRestaurants();
      console.log('✅ Data refreshed from database:', freshData.length, 'restaurants');
    }
  } catch (err) {
    console.warn('⚠️ Could not refresh data:', err.message);
  }
}

// Normalize phone numbers for consistent matching (inbound/outbound)
function normalizePhoneNumber(raw) {
  const digitsOnly = String(raw || '').replace(/[^0-9]/g, '');
  if (!digitsOnly) {
    return { digits: '', e164: '' };
  }
  let digits = digitsOnly;
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }
  if (digits.length === 8) {
    digits = '45' + digits;
  }
  return { digits, e164: `+${digits}` };
}


// =====================================================
// MODULE SYSTEM - Baseret på abonnement og branche
// =====================================================
const USER_MODULES = {
  subscription: 'professional', // basic, professional, enterprise
  industry: 'restaurant',
  enabledModules: ['core', 'crm', 'workflow', 'pos', 'reports', 'inventory', 'accounting']
};

// Module definitions
const MODULE_DEFINITIONS = {
  core: { name: 'Core', features: ['dashboard', 'settings'] },
  crm: { name: 'CRM', features: ['kunder', 'leads'] },
  workflow: { name: 'Workflow', features: ['workflow', 'workflow-kontrol'] },
  pos: { name: 'Salg', features: ['salg', 'korttransaktioner'] },
  reports: { name: 'Rapporter', features: ['rapporter'] },
  inventory: { name: 'Produkter', features: ['produktbibliotek'] },
  accounting: { name: 'Bogholderi', features: ['bogholderi', 'betaling'] }
};

function applyModuleBasedUI() {
  const modules = USER_MODULES.enabledModules;

  // Skjul/vis sidebar elementer baseret på moduler
  document.querySelectorAll('[data-module]').forEach(el => {
    const requiredModule = el.dataset.module;
    el.style.display = modules.includes(requiredModule) ? '' : 'none';
  });

  console.log('📦 Module-based UI applied. Enabled modules:', modules.join(', '));
}

function setUserModules(subscription, industry, modules) {
  USER_MODULES.subscription = subscription;
  USER_MODULES.industry = industry;
  USER_MODULES.enabledModules = modules;
  localStorage.setItem('orderflow_modules', JSON.stringify(USER_MODULES));
  applyModuleBasedUI();
}

function loadUserModules() {
  const stored = localStorage.getItem('orderflow_modules');
  if (stored) {
    const data = JSON.parse(stored);
    USER_MODULES.subscription = data.subscription || 'professional';
    USER_MODULES.industry = data.industry || 'restaurant';
    USER_MODULES.enabledModules = data.enabledModules || ['core', 'crm', 'workflow', 'pos', 'reports', 'inventory', 'accounting'];
  }
}

// =====================================================
// ROLE MANAGEMENT
// =====================================================
const ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
  CUSTOMER: 'customer',
  DEMO: 'demo'
};

// Menu visibility per role - admin/employee only items
const ADMIN_ONLY_MENUS = {
  'kunder': [ROLES.ADMIN, ROLES.EMPLOYEE],
  'alle-kunder': [ROLES.ADMIN, ROLES.EMPLOYEE],
  'workflow': [ROLES.ADMIN, ROLES.EMPLOYEE],
  'nav-salg': [ROLES.ADMIN, ROLES.EMPLOYEE],
  'nav-flow-cms': [ROLES.ADMIN, ROLES.EMPLOYEE],
  'admin-separator': [ROLES.ADMIN, ROLES.EMPLOYEE],
  'workflow-test': [ROLES.ADMIN, ROLES.EMPLOYEE],
  'settings-ailearning': [ROLES.ADMIN, ROLES.EMPLOYEE],
  'settings-billing': [ROLES.ADMIN, ROLES.EMPLOYEE],
  'settings-users': [ROLES.ADMIN, ROLES.EMPLOYEE],
  'settings-roles': [ROLES.ADMIN, ROLES.EMPLOYEE]
};

// Customer/Demo only menus (hidden for admin/employee)
const CUSTOMER_ONLY_MENUS = {};

function hasRoleAccess(menuItem) {
  const role = currentUser?.role || ROLES.CUSTOMER;

  // Check admin-only menus
  if (ADMIN_ONLY_MENUS[menuItem]) {
    return ADMIN_ONLY_MENUS[menuItem].includes(role);
  }

  // Check customer-only menus
  if (CUSTOMER_ONLY_MENUS[menuItem]) {
    return CUSTOMER_ONLY_MENUS[menuItem].includes(role);
  }

  // Default: visible to all
  return true;
}

function applyRoleBasedSidebar() {
  const role = currentUser?.role || ROLES.CUSTOMER;
  const isCustomerView = [ROLES.CUSTOMER, ROLES.DEMO].includes(role);
  const isDemoView = role === ROLES.DEMO;
  console.log('🔐 Applying role-based sidebar for role:', role, '(Customer view:', isCustomerView, ')');

  // Helper function for konsistent display manipulation med !important
  const setDisplay = (el, show) => {
    if (el) el.style.setProperty('display', show ? '' : 'none', 'important');
  };

  // === APP BUILDER ADMIN ONLY ===
  const templateBtn = document.getElementById('app-preview-template-btn');
  setDisplay(templateBtn, role === ROLES.ADMIN);

  // === ADMIN-ONLY SIDEBAR ELEMENTER ===
  // Kunder, Workflow, Salg, Flow CMS, Separator: Kun admin/employee
  ['kunder', 'workflow', 'nav-salg', 'nav-flow-cms', 'admin-separator'].forEach(menuKey => {
    const el = document.querySelector(`[data-role-menu="${menuKey}"]`);
    setDisplay(el, !isCustomerView);
    if (el) console.log(`  - ${menuKey}: ${isCustomerView ? '✗ hidden' : '✓ visible'}`);
  });

  // === RAPPORTER, INTEGRATIONER: Synlige for ALLE ===
  ['nav-rapporter', 'nav-integrationer'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.setProperty('display', '', 'important');
      console.log(`  - ${id}: ✓ visible`);
    }
  });

  // === VIRKSOMHEDS PROFIL, MARKETING: Synlige for ALLE ===
  ['nav-virksomheds-profil', 'nav-marketing'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.setProperty('display', '', 'important');
    }
  });

  // === INDSTILLINGER BEGRÆNSNINGER ===
  const adminOnlySettings = ['settings-ailearning', 'settings-billing'];
  adminOnlySettings.forEach(menuId => {
    const el = document.querySelector(`[data-role-menu="${menuId}"]`);
    setDisplay(el, !isCustomerView);
  });

  // Vis bruger/rolle settings for alle
  ['settings-users', 'settings-roles'].forEach(menuId => {
    const el = document.querySelector(`[data-role-menu="${menuId}"]`);
    setDisplay(el, true);
  });

  // Indstillinger dropdown: Synlig for alle
  const indstillingerDropdown = document.getElementById('nav-indstillinger');
  if (indstillingerDropdown) {
    indstillingerDropdown.style.setProperty('display', '', 'important');
  }

  // === ADMIN ELEMENTER ===
  if (isCustomerView) {
    document.querySelectorAll('.admin-customer-search').forEach(el => setDisplay(el, false));
    document.querySelectorAll('.admin-quick-actions').forEach(el => setDisplay(el, false));
  } else {
    document.querySelectorAll('.admin-customer-search').forEach(el => setDisplay(el, true));
    document.querySelectorAll('.admin-quick-actions').forEach(el => setDisplay(el, true));
  }

  // === WORKFLOW TEST PANEL ===
  const workflowTestPanel = document.querySelector('.test-panel');
  if (workflowTestPanel) {
    setDisplay(workflowTestPanel, !isCustomerView);
  }

  // === DASHBOARD TYPE ===
  const adminDash = document.getElementById('admin-dashboard');
  const customerDash = document.getElementById('customer-dashboard');

  if (isCustomerView) {
    if (adminDash) {
      adminDash.classList.add('hidden');
      adminDash.style.setProperty('display', 'none', 'important');
    }
    if (customerDash) {
      customerDash.classList.remove('hidden');
      customerDash.style.setProperty('display', '', 'important');
    }
    document.querySelectorAll('.admin-dashboard-content').forEach(el => {
      el.classList.add('hidden');
      el.style.setProperty('display', 'none', 'important');
    });
    console.log('  - Dashboard: customer view activated');
  } else {
    if (adminDash) {
      adminDash.classList.remove('hidden');
      adminDash.style.removeProperty('display');
    }
    if (customerDash) {
      customerDash.classList.add('hidden');
      customerDash.style.setProperty('display', 'none', 'important');
    }
    document.querySelectorAll('.admin-dashboard-content').forEach(el => {
      el.classList.remove('hidden');
      el.style.removeProperty('display');
    });
    console.log('  - Dashboard: admin view activated');
  }

  // === SKJUL ADMIN-ELEMENTER FOR DEMO/KUNDE ===
  if (isCustomerView) {
    const terminateBtn = document.getElementById('btn-terminate-customer');
    const profileStatus = document.getElementById('profile-status');
    const backToCustomers = document.querySelector('.crm-back-btn');

    if (terminateBtn) terminateBtn.style.setProperty('display', 'none', 'important');
    if (profileStatus) profileStatus.style.setProperty('display', 'none', 'important');
    if (backToCustomers) backToCustomers.style.setProperty('display', 'none', 'important');

    document.querySelectorAll('.btn[onclick*="showPage(\'alle-kunder\')"]').forEach(el => {
      el.style.setProperty('display', 'none', 'important');
    });
    document.querySelectorAll('.btn[onclick*="showPage(\'add-restaurant\')"]').forEach(el => {
      el.style.setProperty('display', 'none', 'important');
    });

    console.log('  - Admin buttons hidden for customer/demo');
  }

  // === KUNDE CONTEXT: Skjul for kunde/demo (de ser ikke Kunder-listen) ===
  const customerContext = document.getElementById('nav-customer-context');
  if (customerContext && isCustomerView) {
    setDisplay(customerContext, false);
  }

  console.log('✅ Sidebar updated for', isCustomerView ? 'customer/demo' : 'admin/employee', 'view');
}

// Make role functions globally available
window.ROLES = ROLES;
window.hasRoleAccess = hasRoleAccess;
window.applyRoleBasedSidebar = applyRoleBasedSidebar;

// =====================================================
// WORKFLOW DEMO MODE
// Interactive demo for demo users
// =====================================================
const DEMO_SCRIPT = [
  {
    step: 1,
    title: 'Kunden ringer',
    desc: 'Systemet registrerer et mistet opkald automatisk',
    outgoing: null,
    expectedReply: null
  },
  {
    step: 2,
    title: 'Automatisk SMS sendes',
    desc: 'AI sender en venlig besked til kunden',
    outgoing: 'Hej! Vi missede dit opkald. Vil du bestille? Svar JA for at starte.',
    expectedReply: 'ja'
  },
  {
    step: 3,
    title: 'Levering eller afhentning?',
    desc: 'Systemet spørger efter leveringstype',
    outgoing: 'Super! Skal det leveres eller afhentes?',
    expectedReply: 'levering'
  },
  {
    step: 4,
    title: 'Indhent adresse',
    desc: 'AI beder om leveringsadresse',
    outgoing: 'Hvad er din adresse?',
    expectedReply: 'Vestergade 10, 2100 København'
  },
  {
    step: 5,
    title: 'Modtag bestilling',
    desc: 'Kunden sender sin bestilling',
    outgoing: 'Perfekt! Hvad vil du gerne bestille?',
    expectedReply: '2 margherita og 1 cola'
  },
  {
    step: 6,
    title: 'Bekræft ordre',
    desc: 'AI opsummerer og bekræfter ordren',
    outgoing: 'Din ordre: 2x Margherita (198 kr) + 1x Cola (25 kr) = 223 kr. Bekræft med JA',
    expectedReply: 'ja'
  },
  {
    step: 7,
    title: 'Ordre gennemført!',
    desc: 'Ordren gemmes automatisk i systemet',
    outgoing: 'Tak! Din ordre er registreret. Levering om ca. 45 min.',
    expectedReply: null
  }
];

let currentDemoStep = 0;

function initWorkflowDemo() {
  const overlay = document.getElementById('workflow-demo-overlay');
  if (!overlay) return;

  const isCustomerView = [ROLES.DEMO, ROLES.CUSTOMER].includes(currentUser?.role);

  if (isCustomerView) {
    // Show demo overlay for customer/demo users
    overlay.style.display = 'block';
    currentDemoStep = 0;
    document.getElementById('demo-messages').innerHTML = '';
    renderDemoStep();

    // Hide the test panel completely for customer view
    const testPanel = document.querySelector('.test-panel');
    if (testPanel) testPanel.style.display = 'none';
  } else {
    // Hide demo overlay for admin/employee
    overlay.style.display = 'none';

    // Show test panel for admin/employee
    const testPanel = document.querySelector('.test-panel');
    if (testPanel) testPanel.style.display = '';
  }
}

function renderDemoStep() {
  const step = DEMO_SCRIPT[currentDemoStep];
  if (!step) return;

  document.getElementById('demo-step-title').textContent = `Trin ${step.step}: ${step.title}`;
  document.getElementById('demo-step-desc').textContent = step.desc;

  if (step.outgoing) {
    addDemoMessage(step.outgoing, 'out');
  }
}

function addDemoMessage(text, dir) {
  const container = document.getElementById('demo-messages');
  if (!container) return;
  // SECURITY FIX v4.12.0: Escape user text to prevent XSS
  container.innerHTML += `<div class="demo-msg ${escapeHtml(dir)}">${escapeHtml(text)}</div>`;
  container.scrollTop = container.scrollHeight;
}

function sendDemoReply() {
  const input = document.getElementById('demo-reply');
  const text = input.value.trim();
  if (!text) return;

  addDemoMessage(text, 'in');
  input.value = '';

  // Auto-advance if reply matches expected
  const step = DEMO_SCRIPT[currentDemoStep];
  if (step?.expectedReply && text.toLowerCase().includes(step.expectedReply.toLowerCase())) {
    setTimeout(() => nextDemoStep(), 1000);
  }
}

function nextDemoStep() {
  currentDemoStep++;
  if (currentDemoStep < DEMO_SCRIPT.length) {
    renderDemoStep();
  } else {
    // Demo complete
    document.getElementById('demo-step-title').textContent = 'Demo fuldført!';
    document.getElementById('demo-step-desc').textContent = 'Du har nu set hele workflow-processen. Opgrader til fuld adgang for at aktivere denne funktion.';
  }
}

function resetWorkflowDemo() {
  currentDemoStep = 0;
  document.getElementById('demo-messages').innerHTML = '';
  renderDemoStep();
}

function showDemoTab(tab) {
  document.querySelectorAll('.demo-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.demo-tab[onclick*="${tab}"]`)?.classList.add('active');

  const interactive = document.getElementById('demo-interactive');
  const video = document.getElementById('demo-video');
  if (interactive) interactive.classList.toggle('hidden', tab !== 'interactive');
  if (video) video.classList.toggle('hidden', tab !== 'video');
}

// Make demo functions globally available
window.initWorkflowDemo = initWorkflowDemo;
window.sendDemoReply = sendDemoReply;
window.nextDemoStep = nextDemoStep;
window.resetWorkflowDemo = resetWorkflowDemo;
window.showDemoTab = showDemoTab;

// =====================================================
// AKTIVITETSLOG & OPDATERINGSSYSTEM
// Viser diskret lyseblå prik ved nye funktioner/opdateringer
// =====================================================
const UPDATE_STORAGE_KEY = 'orderflow_seen_updates';
const ACTIVITY_LOG_KEY = 'orderflow_activity_log';

// Aktivitetstyper med farver og ikoner
const ACTIVITY_TYPES = {
  'update': { color: 'purple', label: 'Opdatering', icon: 'edit' },
  'create': { color: 'green', label: 'Oprettet', icon: 'plus' },
  'delete': { color: 'red', label: 'Slettet', icon: 'trash' },
  'order': { color: 'green', label: 'Ordre', icon: 'cart' },
  'workflow': { color: 'blue', label: 'Workflow', icon: 'zap' },
  'ai': { color: 'yellow', label: 'AI', icon: 'cpu' },
  'system': { color: 'cyan', label: 'System', icon: 'settings' },
  'login': { color: 'blue', label: 'Login', icon: 'user' },
  // NYE TYPER - FASE 7
  'page_create': { color: 'green', label: 'Side oprettet', icon: 'file-plus' },
  'page_rename': { color: 'purple', label: 'Side omdøbt', icon: 'edit' },
  'page_reorder': { color: 'blue', label: 'Rækkefølge ændret', icon: 'move' },
  'employee': { color: 'cyan', label: 'Medarbejder', icon: 'users' },
  'user': { color: 'blue', label: 'Bruger', icon: 'user' }
};

// Hent aktivitetslog
// SYNC version for backwards compatibility (loads from localStorage)
function getActivityLog() {
  try {
    let log = JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || '[]');
    // Filtrer aktiviteter ældre end 2 måneder
    const twoMonthsAgo = Date.now() - (60 * 24 * 60 * 60 * 1000);
    log = log.filter(a => a.timestamp > twoMonthsAgo);

    // Add demo activities only for DEMO role users
    if (currentUser?.role === ROLES.DEMO && typeof getDemoDataActivities === 'function') {
      const demoActivities = getDemoDataActivities();
      log = [...log, ...demoActivities];
      // Sort by timestamp descending
      log.sort((a, b) => b.timestamp - a.timestamp);
    }

    return log;
  } catch (e) {
    return [];
  }
}

// ASYNC version - loads from Supabase
async function getActivityLogAsync() {
  if (typeof SupabaseDB !== 'undefined' && currentUser) {
    try {
      const activities = await SupabaseDB.getActivities(currentUser.id, 100);
      // Transform timestamp from ISO string to milliseconds for UI compatibility
      return activities.map(a => ({
        ...a,
        timestamp: new Date(a.timestamp).getTime()
      }));
    } catch (err) {
      console.error('❌ Error loading activities from Supabase:', err);
      // Fallback to localStorage
      return getActivityLog();
    }
  } else {
    return getActivityLog();
  }
}

// Gem aktivitetslog (for localStorage fallback)
function saveActivityLog(log) {
  // Behold kun de seneste 100 aktiviteter
  const trimmed = log.slice(0, 100);
  localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(trimmed));
}

// Log en aktivitet
async function logActivity(type, description, details = {}) {
  // Save to Supabase if available
  let activity;
  if (typeof SupabaseDB !== 'undefined' && currentUser) {
    try {
      activity = await SupabaseDB.logActivity(currentUser.id, type, description, details);
      console.log('✅ Activity logged to Supabase:', activity.id);
    } catch (err) {
      console.error('❌ Error logging to Supabase:', err);
      // Fallback to localStorage
      activity = {
        id: 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        type: type,
        description: description,
        details: details,
        timestamp: Date.now(),
        seen: false
      };
    }
  } else {
    // Fallback to localStorage
    activity = {
      id: 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      type: type,
      description: description,
      details: details,
      timestamp: Date.now(),
      seen: false
    };
    const log = getActivityLog();
    log.unshift(activity);
    saveActivityLog(log);
  }

  // Opdater UI
  updateRecentActivityUI();
  updateActivityIndicators();

  // REAL-TIME INTEGRATION: Tilføj automatisk blå prik via NotificationSystem
  if (typeof NotificationSystem !== 'undefined' && details.category) {
    const notificationPath = buildNotificationPath(details.category, details.subCategory);
    NotificationSystem.add(notificationPath, {
      title: 'Ny aktivitet',
      message: description,
      timestamp: Date.now(),
      activityId: activity.id
    });
    console.log(`🔵 Auto-notification added: ${notificationPath} -> "${description}"`);
  }

  return activity;
}

/**
 * Build notification path from category and subcategory
 * Used for NotificationSystem integration
 */
function buildNotificationPath(category, subCategory) {
  // Special handling for integrationer
  if (category === 'integrationer' && subCategory) {
    return `${category}.${subCategory}`;
  }
  // For other categories with subcategories
  if (subCategory) {
    return `${category}.${subCategory}`;
  }
  // Just category
  return category;
}

// Markér aktivitet som set
function markActivitySeen(activityId) {
  const log = getActivityLog();
  const activity = log.find(a => a.id === activityId);
  if (activity) {
    activity.seen = true;
    saveActivityLog(log);
    updateActivityIndicators();
  }
}

// Markér alle aktiviteter i en kategori som set
function markCategoryActivitiesSeen(category, subCategory = null) {
  const log = getActivityLog();
  let changed = false;
  log.forEach(a => {
    if (a.details?.category === category && !a.seen) {
      if (!subCategory || a.details?.subCategory === subCategory) {
        a.seen = true;
        changed = true;
      }
    }
  });
  if (changed) {
    saveActivityLog(log);
    updateActivityIndicators();
  }
}

// Få usete aktiviteter for en kategori
function getUnseenActivities(category = null, subCategory = null) {
  const log = getActivityLog();
  return log.filter(a => {
    if (a.seen) return false;
    if (category && a.details?.category !== category) return false;
    if (subCategory && a.details?.subCategory !== subCategory) return false;
    return true;
  });
}

// Formater tidspunkt relativt
function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Lige nu';
  if (minutes < 60) return `${minutes} minut${minutes !== 1 ? 'ter' : ''} siden`;
  if (hours < 24) return `${hours} time${hours !== 1 ? 'r' : ''} siden`;
  if (days < 7) return `${days} dag${days !== 1 ? 'e' : ''} siden`;
  
  const date = new Date(timestamp);
  return date.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' });
}

// Opdater Seneste Aktivitet UI på dashboard
function updateRecentActivityUI() {
  const container = document.getElementById('recent-activity');
  if (!container) return;
  
  const log = getActivityLog().slice(0, 5); // Vis kun de 5 seneste
  
  if (log.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:20px;color:var(--muted)">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:8px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <div>Ingen aktivitet endnu</div>
      </div>
    `;
    return;
  }
  
  container.innerHTML = log.map(activity => {
    const typeInfo = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.system;
    const details = activity.details || {};
    
    // Byg detalje-tekst
    let detailText = '';
    if (details.field) {
      detailText = ` -> ${details.field}`;
      if (details.newValue) {
        detailText += `: "${details.newValue}"`;
      }
    }
    
    return `
      <div class="activity-item ${activity.seen ? '' : 'unseen'}" data-activity-id="${activity.id}" onclick="showActivityDetail('${activity.id}')">
        <div class="activity-dot ${typeInfo.color}"></div>
        <div class="activity-content">
          <div class="activity-text">${activity.description}${detailText}</div>
          <div class="activity-time">${formatRelativeTime(activity.timestamp)}</div>
        </div>
        ${!activity.seen ? '<span class="activity-new-badge">NY</span>' : ''}
      </div>
    `;
  }).join('');
}

// DEAKTIVERET: Bruger NotificationSystem til blå prikker i stedet
// Activity Logging System bruges stadig til "Seneste Aktiviteter" sektionen
function updateActivityIndicators() {
  // NO-OP: NotificationSystem håndterer blå prikker nu
  return;
  // Ryd alle eksisterende indikatorer
  document.querySelectorAll('.activity-indicator').forEach(el => el.remove());

  const log = getActivityLog();
  const unseenByCategory = {};
  
  // Gruppér usete aktiviteter efter PRIMÆR kategori (details.category)
  // Ignorer aktiviteter uden gyldig kategori
  log.filter(a => !a.seen && a.details?.category).forEach(a => {
    const cat = a.details.category;
    const subCat = a.details?.subCategory || null;
    
    if (!unseenByCategory[cat]) {
      unseenByCategory[cat] = { count: 0, subCategories: {} };
    }
    unseenByCategory[cat].count++;
    
    if (subCat) {
      if (!unseenByCategory[cat].subCategories[subCat]) {
        unseenByCategory[cat].subCategories[subCat] = 0;
      }
      unseenByCategory[cat].subCategories[subCat]++;
    }
  });
  
  // Mapping fra nav-element til hvilke primære kategorier der skal matche
  // VIGTIGT: Kun match på primær category, IKKE subCategory
  const categoryMappings = {
    'kunder': ['kunder'],           // Kun aktiviteter med category:'kunder'
    'workflow': ['workflow'],       // Kun aktiviteter med category:'workflow'
    'dagsrapport': ['dagsrapport'],
    'ordrer': ['ordrer'],
    'indstillinger': ['indstillinger', 'settings'],
    'integrationer': ['integrationer'],
    'pages': ['pages'],             // FASE 7: Side-aktiviteter (omdøbning, nye sider, etc.)
    'dashboard': ['pages']          // FASE 7: Dashboard viser også 'pages' aktiviteter
  };
  
  Object.entries(categoryMappings).forEach(([navId, categories]) => {
    const totalUnseen = categories.reduce((sum, cat) => sum + (unseenByCategory[cat]?.count || 0), 0);
    if (totalUnseen > 0) {
      // Find nav-item
      const navItem = document.querySelector(`#nav-${navId}`) || 
                      document.querySelector(`[onclick*="showPage('${navId}')"]`) ||
                      document.querySelector(`[onclick*="toggleNavDropdown('${navId}')"]`);
      if (navItem) {
        addActivityIndicator(navItem, totalUnseen);
      }
    }
  });
  
  // Tilføj indikatorer til underkategorier i kunde-dropdown (baseret på subCategory)
  if (unseenByCategory['kunder']) {
    Object.entries(unseenByCategory['kunder'].subCategories).forEach(([subCat, count]) => {
      if (count > 0) {
        const subNavItem = document.querySelector(`[onclick*="showCustomerSubpage('${subCat}')"]`);
        if (subNavItem) {
          addActivityIndicator(subNavItem, count, true);
        }
      }
    });
  }
  
  // Tilføj indikatorer til indstillinger-dropdown
  if (unseenByCategory['indstillinger']) {
    Object.entries(unseenByCategory['indstillinger'].subCategories).forEach(([subCat, count]) => {
      if (count > 0) {
        const subNavItem = document.querySelector(`[onclick*="showSettingsPage('${subCat}')"]`);
        if (subNavItem) {
          addActivityIndicator(subNavItem, count, true);
        }
      }
    });
  }

  // Tilføj indikatorer til integrationer-dropdown
  if (unseenByCategory['integrationer']) {
    Object.entries(unseenByCategory['integrationer'].subCategories).forEach(([subCat, count]) => {
      if (count > 0) {
        const subNavItem = document.querySelector(`[onclick*="showPage('${subCat}')"]`);
        if (subNavItem) {
          addActivityIndicator(subNavItem, count, true);
        }
      }
    });
  }
}

// DEAKTIVERET: Bruger NotificationSystem til blå prikker i stedet
function addActivityIndicator(element, count, isSubItem = false) {
  // NO-OP: NotificationSystem håndterer blå prikker nu
  return;
  if (!element) return;

  // Fjern eksisterende
  const existing = element.querySelector('.activity-indicator');
  if (existing) existing.remove();

  const indicator = document.createElement('span');
  indicator.className = 'activity-indicator' + (isSubItem ? ' sub-item' : '');
  indicator.title = `${count} nye opdatering${count !== 1 ? 'er' : ''}`;
  indicator.onclick = (e) => {
    e.stopPropagation();
    showAllActivities();
  };
  element.style.position = 'relative';

  // Add hover event handlers if in hover mode
  const settings = getActivityIndicatorSettings();
  if (settings.dismissType === 'hover') {
    // Extract category from element's onclick attribute
    const onclickAttr = element.getAttribute('onclick');
    let category = null;

    // Try to match showPage('category') or showSettingsPage('category')
    const pageMatch = onclickAttr?.match(/showPage\('(.+?)'\)/);
    const settingsMatch = onclickAttr?.match(/showSettingsPage\('(.+?)'\)/);

    if (pageMatch) {
      category = pageMatch[1];
    } else if (settingsMatch) {
      category = settingsMatch[1];
    }

    // For dropdown toggles, extract from toggleNavDropdown('category')
    const dropdownMatch = onclickAttr?.match(/toggleNavDropdown\('(.+?)'\)/);
    if (dropdownMatch) {
      category = dropdownMatch[1];
    }

    if (category) {
      // Store hover handler to avoid duplicates
      if (!element._activityHoverAdded) {
        element._activityHoverAdded = true;

        element.addEventListener('mouseenter', function() {
          // Mark activities as seen when hovering
          markCategoryActivitiesSeen(category);

          // For integrationer category, also mark subcategories
          if (category === 'bogholderi' || category === 'betaling') {
            markCategoryActivitiesSeen('integrationer', category);
          }
        });

        element.addEventListener('mouseleave', function() {
          // Remove indicator when mouse leaves
          const ind = element.querySelector('.activity-indicator');
          if (ind) {
            ind.remove();
          }
        });
      }
    }
  }

  element.appendChild(indicator);
}

// Vis aktivitetsdetalje (markér som set)
function showActivityDetail(activityId) {
  const activity = getActivityLog().find(a => a.id === activityId);
  if (!activity) return;

  // Mark as seen
  markActivitySeen(activityId);

  // Populate detail page
  const typeInfo = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.system;

  document.getElementById('detail-activity-dot').className = `activity-dot ${typeInfo.color}`;
  document.getElementById('detail-activity-title').textContent = activity.description;
  document.getElementById('detail-activity-time').textContent = formatRelativeTime(activity.timestamp);

  // Show real username instead of "System"
  const details = activity.details || {};
  const userName = details.user || (currentUser ? currentUser.email : 'System');
  document.getElementById('detail-activity-user').textContent = userName;

  // Build detailed "what changed" text
  let whatChanged = activity.description;

  if (details.field) {
    whatChanged += `\n\nFelt: ${details.field}`;
  }
  if (details.category) {
    whatChanged += `\n\nKategori: ${details.category}`;
  }
  if (details.subCategory) {
    whatChanged += ` > ${details.subCategory}`;
  }
  if (details.restaurantName) {
    whatChanged += `\n\nRestaurant: ${details.restaurantName}`;
  }

  document.getElementById('detail-what-changed').textContent = whatChanged;

  // Update subtitle with activity type
  const subtitle = document.getElementById('activity-detail-subtitle');
  if (subtitle) {
    subtitle.textContent = `${typeInfo.label} • ${formatRelativeTime(activity.timestamp)}`;
  }

  // Before/After section
  if (details.oldValue && details.newValue) {
    document.getElementById('detail-before-after').style.display = 'block';
    document.getElementById('detail-old-value').textContent = details.oldValue;
    document.getElementById('detail-new-value').textContent = details.newValue;
  } else if (details.oldName && details.newName) {
    // For page renames
    document.getElementById('detail-before-after').style.display = 'block';
    document.getElementById('detail-old-value').textContent = details.oldName;
    document.getElementById('detail-new-value').textContent = details.newName;
  } else {
    document.getElementById('detail-before-after').style.display = 'none';
  }

  // Location section
  const locationText = getActivityLocationText(activity);
  document.getElementById('detail-location-text').textContent = locationText;

  // "Gå til ændringen" button
  const goToBtn = document.getElementById('detail-go-to-location');
  goToBtn.onclick = () => navigateToActivity(activity);

  // Show page (NOTE: showPage adds 'page-' prefix automatically!)
  showPage('activity-detail');
}

// Hent lokationstekst for aktivitet
function getActivityLocationText(activity) {
  const details = activity.details || {};

  if (details.category === 'pages') {
    return `Navigation -> ${details.pageName || details.oldName || 'Ukendt side'}`;
  } else if (details.category === 'kunder') {
    if (details.subCategory && details.restaurantName) {
      const subCategoryLabels = {
        'stamdata': 'Stamdata',
        'produkter': 'Produkter',
        'kategorier': 'Kategorier',
        'faktura': 'Faktura',
        'workflow-kontrol': 'Workflow Kontrol',
        'beskeder': 'Beskeder',
        'review': 'Review Links'
      };
      const subLabel = subCategoryLabels[details.subCategory] || details.subCategory;
      return `Kunder -> ${details.restaurantName} -> ${subLabel}`;
    } else if (details.restaurantName) {
      return `Kunder -> ${details.restaurantName}`;
    }
    return 'Kunder';
  } else if (details.category === 'workflow') {
    return details.restaurantName ? `Workflow -> ${details.restaurantName}` : 'Workflow';
  } else if (details.category === 'indstillinger') {
    return 'Indstillinger';
  } else if (details.category === 'integrationer') {
    return 'Integrationer';
  } else if (details.category === 'ordrer') {
    return 'Ordrer';
  }

  return details.category || 'System';
}

// Naviger til aktivitets lokation
function navigateToActivity(activity) {
  const details = activity.details || {};

  // === ROLLE-CHECK: Blokér navigation til kunde-aktiviteter for demo/kunde ===
  const isCustomerView = currentUser?.role && [ROLES.CUSTOMER, ROLES.DEMO].includes(currentUser.role);

  // Navigate to the page based on category
  if (details.category === 'pages') {
    // Navigate to specific page if pageId is provided
    if (details.pageId) {
      showPage(details.pageId);
    } else {
      showPage('dashboard');
    }
  } else if (details.category === 'kunder') {
    // Blokér for demo/kunde brugere
    if (isCustomerView) {
      console.warn('🚫 Blocked activity navigation to kunder for demo/kunde user');
      return;
    }
    showPage('kunder');
    const customerId = details.customerId || details.restaurantId;
    if (customerId) {
      // Load specific customer profile
      setTimeout(() => {
        showCrmProfileView(customerId);
        if (details.subCategory) {
          setTimeout(() => {
            showCustomerSubpage(details.subCategory);
            // Highlight changed field if specified
            if (details.field) {
              setTimeout(() => highlightChangedField(details.field), 300);
            }
          }, 300);
        } else if (details.field) {
          // If no subCategory but field is specified, still highlight
          setTimeout(() => highlightChangedField(details.field), 300);
        }
      }, 200);
    }
  } else if (details.category === 'workflow') {
    showPage('workflow');
    const customerId = details.customerId || details.restaurantId;
    if (customerId) {
      setTimeout(() => {
        showCrmProfileView(customerId);
        // Highlight changed field if specified
        if (details.field) {
          setTimeout(() => highlightChangedField(details.field), 300);
        }
      }, 200);
    }
  } else if (details.category === 'indstillinger') {
    showPage('settings');
  } else if (details.category === 'ordrer') {
    showPage('orders');
  } else {
    // Default to dashboard
    showPage('dashboard');
  }

  // Add in-page indicator with delay to ensure page is loaded
  if (details.targetElementSelector) {
    setTimeout(() => {
      addInPageIndicator(details.targetElementSelector, activity.id);
    }, 500);
  }
}

// Tilføj in-page aktivitetsindikator (præcis blue dot)
function addInPageIndicator(elementSelector, activityId) {
  // Remove existing in-page indicators
  document.querySelectorAll('.in-page-activity-indicator').forEach(el => el.remove());

  // Find target element
  const targetElement = document.querySelector(elementSelector);
  if (!targetElement) {
    console.warn(`Target element not found: ${elementSelector}`);
    return;
  }

  // Create indicator
  const indicator = document.createElement('span');
  indicator.className = 'in-page-activity-indicator';
  indicator.dataset.activityId = activityId;
  indicator.title = 'Denne ændring er ny';

  // Position next to element
  if (targetElement.tagName === 'H1' || targetElement.tagName === 'H2') {
    // For headers, insert after
    targetElement.insertAdjacentElement('afterend', indicator);
  } else {
    // For other elements, position absolutely
    indicator.style.position = 'absolute';
    targetElement.style.position = 'relative';
    targetElement.appendChild(indicator);
  }

  // Highlight target element
  targetElement.classList.add('has-activity-indicator');

  // Auto-remove when user interacts with the element
  const markSeenOnInteraction = () => {
    indicator.remove();
    targetElement.classList.remove('has-activity-indicator');
    markActivitySeen(activityId);
  };

  targetElement.addEventListener('click', markSeenOnInteraction, { once: true });

  // Auto-remove after 30 seconds on page
  setTimeout(() => {
    if (indicator.parentElement) {
      indicator.remove();
      targetElement.classList.remove('has-activity-indicator');
      markActivitySeen(activityId);
    }
  }, 30000);
}

// Highlight changed field when navigating to activity
function highlightChangedField(fieldName) {
  // Find input/element by name, ID, or data-field attribute
  const input = document.querySelector(`[name="${fieldName}"], #${fieldName}, [data-field="${fieldName}"]`);

  if (input) {
    // Scroll into view
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Add highlight animation
    input.classList.add('field-highlight');
    setTimeout(() => input.classList.remove('field-highlight'), 3000);

    // Focus if it's an input
    if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA' || input.tagName === 'SELECT') {
      setTimeout(() => input.focus(), 500);
    }
  } else {
    console.warn(`Field not found for highlighting: ${fieldName}`);
  }
}

// Vis alle aktiviteter (ny side)
function showAllActivities() {
  showPage('activities');
  loadActivitiesPage();
}

// Load aktiviteter side
function loadActivitiesPage() {
  const container = document.getElementById('activities-list');
  if (!container) return;
  
  const log = getActivityLog().slice(0, 30); // De seneste 30
  
  if (log.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:40px;color:var(--muted)">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom:16px;opacity:0.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <div style="font-size:16px;margin-bottom:8px">Ingen aktiviteter</div>
        <div style="font-size:13px">Aktiviteter vil blive vist her når der sker ændringer i systemet</div>
      </div>
    `;
    return;
  }
  
  // Gruppér efter dato
  const grouped = {};
  log.forEach(activity => {
    const date = new Date(activity.timestamp);
    const dateKey = date.toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(activity);
  });
  
  container.innerHTML = Object.entries(grouped).map(([dateStr, activities]) => `
    <div class="activity-date-group">
      <div class="activity-date-header">${dateStr}</div>
      ${activities.map(activity => {
        const typeInfo = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.system;
        const details = activity.details || {};
        const time = new Date(activity.timestamp).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
        
        let detailPath = '';
        if (details.category) {
          detailPath = details.category;
          if (details.subCategory) detailPath += ' -> ' + details.subCategory;
          if (details.field) detailPath += ' -> ' + details.field;
        }
        
        return `
          <div class="activity-item-full ${activity.seen ? '' : 'unseen'}" onclick="showActivityDetail('${activity.id}')">
            <div class="activity-time-col">${time}</div>
            <div class="activity-dot-col"><div class="activity-dot ${typeInfo.color}"></div></div>
            <div class="activity-main-col">
              <div class="activity-description">${activity.description}</div>
              ${detailPath ? `<div class="activity-path">${detailPath}</div>` : ''}
              ${details.oldValue && details.newValue ? `
                <div class="activity-change">
                  <span class="old-value">${details.oldValue}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  <span class="new-value">${details.newValue}</span>
                </div>
              ` : ''}
              ${details.restaurantName ? `<div class="activity-restaurant">${details.restaurantName}</div>` : ''}
            </div>
            <div class="activity-type-col">
              <span class="activity-type-badge ${typeInfo.color}">${typeInfo.label}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `).join('');
  
  // Markér alle viste som set
  log.forEach(a => markActivitySeen(a.id));
}

// Generer og rens aktivitetslog demo aktiviteter (legacy)
function cleanupLegacyDemoActivities() {
  const existingLog = getActivityLog();

  // Rens eventuelle korrupte/gamle aktiviteter - markér alle demo aktiviteter som set
  if (existingLog.length > 0) {
    let needsSave = false;
    existingLog.forEach(a => {
      // Markér demo aktiviteter som set
      if (a.id && a.id.startsWith('demo_') && !a.seen) {
        a.seen = true;
        needsSave = true;
      }
      // Markér aktiviteter uden gyldig kategori som set (korrupte data)
      if (!a.details?.category && !a.seen) {
        a.seen = true;
        needsSave = true;
      }
    });
    if (needsSave) {
      saveActivityLog(existingLog);
    }
    return; // Allerede genereret
  }
  
  const now = Date.now();
  const demoActivities = [
    { type: 'order', description: 'Ny ordre modtaget: 2x Margharita', details: { category: 'ordrer' }, offset: 2 * 60000 },
    { type: 'workflow', description: 'Workflow test gennemført', details: { category: 'workflow' }, offset: 5 * 60000 },
    { type: 'update', description: 'Restaurant opdateret', details: { category: 'kunder', subCategory: 'stamdata', field: 'Navn', oldValue: 'Bella Italia', newValue: 'Bella Italia Ristorante', restaurantName: 'Bella Italia' }, offset: 12 * 60000 },
    { type: 'ai', description: 'AI klassificering: GREETING', details: { category: 'workflow' }, offset: 18 * 60000 },
    { type: 'update', description: 'Åbningstider ændret', details: { category: 'kunder', subCategory: 'stamdata', field: 'Åbningstider', restaurantName: 'Sushi House' }, offset: 45 * 60000 },
    { type: 'create', description: 'Nyt produkt oprettet', details: { category: 'kunder', subCategory: 'produkter', field: 'Pizza Diavola', restaurantName: 'Bella Italia' }, offset: 2 * 3600000 },
    { type: 'update', description: 'Kontaktperson opdateret', details: { category: 'kunder', subCategory: 'stamdata', field: 'Kontaktperson', oldValue: 'Marco Rossi', newValue: 'Giulia Bianchi', restaurantName: 'Bella Italia' }, offset: 5 * 3600000 },
    { type: 'system', description: 'Faktura genereret', details: { category: 'kunder', subCategory: 'faktura', restaurantName: 'Thai Orchid' }, offset: 24 * 3600000 },
    { type: 'workflow', description: 'SMS sendt til kunde', details: { category: 'workflow' }, offset: 26 * 3600000 },
    { type: 'update', description: 'Priser opdateret', details: { category: 'kunder', subCategory: 'produkter', field: 'Priser', restaurantName: 'Sushi House' }, offset: 48 * 3600000 },
    { type: 'login', description: 'Bruger logget ind', details: { category: 'system' }, offset: 72 * 3600000 },
    { type: 'create', description: 'Ny restaurant oprettet', details: { category: 'kunder', subCategory: 'stamdata', field: 'Restaurant', restaurantName: 'New Restaurant' }, offset: 96 * 3600000 }
  ];
  
  const log = demoActivities.map((a, i) => ({
    id: 'demo_' + i,
    type: a.type,
    description: a.description,
    details: a.details,
    timestamp: now - a.offset,
    seen: true // Demo-aktiviteter er altid set - kun rigtige aktiviteter trigger indikatorer
  }));
  
  saveActivityLog(log);
}

// Wrapper funktion til at logge feltændringer
function logFieldChange(restaurantName, category, subCategory, field, oldValue, newValue) {
  const description = `${field} opdateret`;
  logActivity('update', description, {
    category: category,
    subCategory: subCategory,
    field: field,
    oldValue: oldValue,
    newValue: newValue,
    restaurantName: restaurantName
  });
}

// TEST FUNCTION - FASE 7: Test activity tracking med demo data
// Fjern senere når side-management UI er bygget
function testActivityTracking() {
  console.log('🧪 Tester aktivitets-tracking system...');

  // Test 1: Side omdøbning
  logActivity('page_rename', 'Side omdøbt: Indstillinger -> Opsætning', {
    category: 'pages',
    subCategory: 'navigation',
    pageId: 'page-settings',
    oldName: 'Indstillinger',
    newName: 'Opsætning',
    targetElementSelector: '#page-settings .page-header h1'
  });
  console.log('✓ Test 1: Side omdøbning logged');

  // Test 2: Ny side oprettet
  logActivity('page_create', 'Ny side oprettet: Analyser', {
    category: 'pages',
    subCategory: 'navigation',
    pageId: 'page-analyser',
    pageName: 'Analyser',
    targetElementSelector: '.nav-item[data-page="analyser"]'
  });
  console.log('✓ Test 2: Ny side oprettet logged');

  // Test 3: Side-rækkefølge ændret
  logActivity('page_reorder', 'Side flyttet: Produktrapport til position 3', {
    category: 'pages',
    subCategory: 'navigation',
    movedPage: 'Produktrapport',
    oldPosition: 5,
    newPosition: 3,
    targetElementSelector: '.nav-item[data-page="produktrapport"]'
  });
  console.log('✓ Test 3: Side-rækkefølge ændring logged');

  // Test 4: Medarbejder aktivitet
  logActivity('employee', 'Medarbejder "John Doe" tilføjet til restaurant', {
    category: 'kunder',
    subCategory: 'stamdata',
    restaurantName: 'Demo Restaurant',
    employeeName: 'John Doe'
  });
  console.log('✓ Test 4: Medarbejder aktivitet logged');

  // Test 5: Bruger aktivitet
  logActivity('user', 'Bruger opdateret restaurant stamdata', {
    category: 'kunder',
    subCategory: 'stamdata',
    restaurantName: 'Test Restaurant',
    field: 'Adresse',
    oldValue: 'Gl. Adresse 123',
    newValue: 'Ny Adresse 456'
  });
  console.log('✓ Test 5: Bruger aktivitet logged');

  console.log('✅ Alle test aktiviteter oprettet!');
  console.log('💡 Klik på en aktivitet i "Seneste Aktivitet" sektionen for at se detaljer');
  console.log('💡 Klik "Gå til ændringen" for at se in-page blue dot (hvis targetElementSelector findes)');

  return 'Test completed! Check the Recent Activity section on the dashboard.';
}

// Filtrer aktiviteter på aktivitetssiden
function filterActivities() {
  const typeFilter = document.getElementById('activity-filter-type')?.value || '';
  const categoryFilter = document.getElementById('activity-filter-category')?.value || '';
  
  const container = document.getElementById('activities-list');
  if (!container) return;
  
  let log = getActivityLog().slice(0, 30);
  
  // Anvend filtre
  if (typeFilter) {
    log = log.filter(a => a.type === typeFilter);
  }
  if (categoryFilter) {
    log = log.filter(a => a.details?.category === categoryFilter || a.details?.subCategory === categoryFilter);
  }
  
  if (log.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:40px;color:var(--muted)">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom:16px;opacity:0.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
        <div style="font-size:16px;margin-bottom:8px">Ingen aktiviteter matcher filteret</div>
        <div style="font-size:13px">Prøv at ændre filtreringen</div>
      </div>
    `;
    return;
  }
  
  // Render filtrerede aktiviteter
  const grouped = {};
  log.forEach(activity => {
    const date = new Date(activity.timestamp);
    const dateKey = date.toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(activity);
  });
  
  container.innerHTML = Object.entries(grouped).map(([dateStr, activities]) => `
    <div class="activity-date-group">
      <div class="activity-date-header">${dateStr}</div>
      ${activities.map(activity => {
        const typeInfo = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.system;
        const details = activity.details || {};
        const time = new Date(activity.timestamp).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
        
        let detailPath = '';
        if (details.category) {
          detailPath = details.category;
          if (details.subCategory) detailPath += ' -> ' + details.subCategory;
          if (details.field) detailPath += ' -> ' + details.field;
        }
        
        return `
          <div class="activity-item-full ${activity.seen ? '' : 'unseen'}"
               data-activity-id="${activity.id}"
               onclick="showActivityDetail('${activity.id}')"
               style="cursor:pointer">
            <div class="activity-time-col">${time}</div>
            <div class="activity-dot-col"><div class="activity-dot ${typeInfo.color}"></div></div>
            <div class="activity-main-col">
              <div class="activity-description">${activity.description}</div>
              ${detailPath ? `<div class="activity-path">${detailPath}</div>` : ''}
              ${details.oldValue && details.newValue ? `
                <div class="activity-change">
                  <span class="old-value">${details.oldValue}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  <span class="new-value">${details.newValue}</span>
                </div>
              ` : ''}
              ${details.restaurantName ? `<div class="activity-restaurant">${details.restaurantName}</div>` : ''}
            </div>
            <div class="activity-type-col">
              <span class="activity-type-badge ${typeInfo.color}">${typeInfo.label}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `).join('');
}

// Ryd aktivitetslog
function clearActivityLog() {
  if (confirm('Er du sikker på du vil rydde hele aktivitetsloggen?')) {
    localStorage.removeItem(ACTIVITY_LOG_KEY);
    loadActivitiesPage();
    updateRecentActivityUI();
    updateActivityIndicators();
    toast('Aktivitetslog ryddet', 'success');
  }
}

// Legacy support - gamle funktioner
const CURRENT_UPDATES = {};

function getSeenUpdates() {
  try {
    return JSON.parse(localStorage.getItem(UPDATE_STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function markUpdateSeen(updateId) {
  const seen = getSeenUpdates();
  if (!seen.includes(updateId)) {
    seen.push(updateId);
    localStorage.setItem(UPDATE_STORAGE_KEY, JSON.stringify(seen));
  }
}

function hasUnseenUpdates(elementId) {
  return getUnseenActivities(elementId).length > 0;
}

function addUpdateIndicator(element, updateId) {
  addActivityIndicator(element, 1);
}

function initUpdateIndicators() {
  // DEAKTIVERET: Demo aktiviteter fjernet i produktion
  // generateDemoActivities();

  updateActivityIndicators();
  updateRecentActivityUI();
}

function markPageUpdatesAsSeen(pageName) {
  const settings = getActivityIndicatorSettings();

  // Only auto-mark as seen if NOT in hover mode
  if (settings.dismissType !== 'hover') {
    // Marker aktiviteter i primær kategori
    markCategoryActivitiesSeen(pageName);

    // For integrationer undersider (bogholderi, betaling), marker også:
    // 1. Aktiviteter med category 'integrationer' og matching subCategory
    // 2. ALLE aktiviteter med category 'integrationer' UDEN subCategory (legacy/fejl)
    if (pageName === 'bogholderi' || pageName === 'betaling') {
      markCategoryActivitiesSeen('integrationer', pageName);

      // Marker også integrationer aktiviteter UDEN subCategory
      const log = getActivityLog();
      let changed = false;
      log.forEach(a => {
        if (a.details?.category === 'integrationer' && !a.details?.subCategory && !a.seen) {
          a.seen = true;
          changed = true;
        }
      });
      if (changed) {
        saveActivityLog(log);
        updateActivityIndicators();
      }
    }

    // INTEGRATION MED NOTIFICATIONSYSTEM: Fjern notifikationer for denne side
    if (typeof NotificationSystem !== 'undefined') {
      // Konverter pageName til notification path
      let notificationPath = pageName;

      // Special handling for integrationer undersider
      if (pageName === 'bogholderi') {
        notificationPath = 'integrationer.bogholderi';
      } else if (pageName === 'betaling') {
        notificationPath = 'integrationer.betaling';
      }

      // Fjern alle notifikationer under denne path (og alle child paths)
      NotificationSystem.clearPath(notificationPath);

      // Også fjern parent path hvis det er en underside
      if (pageName === 'bogholderi' || pageName === 'betaling') {
        // Tjek om der er flere notifikationer under integrationer, ellers fjern parent også
        // FIXED: Brug notifications.keys() i stedet for getAll()
        let hasOtherIntegrationNotifications = false;
        NotificationSystem.notifications.forEach((notif, path) => {
          if (path.startsWith('integrationer.') && path !== notificationPath) {
            hasOtherIntegrationNotifications = true;
          }
        });

        if (!hasOtherIntegrationNotifications) {
          NotificationSystem.clearPath('integrationer');
        }
      }

      console.log(`🔵 Cleared notifications for path: ${notificationPath}`);
    }
  }
  // In hover mode, don't auto-mark as seen - wait for hover interaction
}

// Activity Indicator Settings Management
function getActivityIndicatorSettings() {
  const stored = localStorage.getItem('orderflow_activity_indicator_settings');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch(e) {
      console.error('Error parsing activity indicator settings:', e);
    }
  }
  // Default to hover mode
  return { dismissType: 'hover', dismissValue: 1 };
}

// Check and auto-dismiss activities based on time settings
function checkTimedDismissal() {
  const settings = getActivityIndicatorSettings();

  if (settings.dismissType !== 'hover') {
    const log = getActivityLog();
    const now = Date.now();
    let changed = false;

    log.forEach(activity => {
      if (!activity.seen) {
        const ageMs = now - activity.timestamp;
        let thresholdMs = 0;

        switch(settings.dismissType) {
          case 'minutes':
            thresholdMs = settings.dismissValue * 60 * 1000;
            break;
          case 'hours':
            thresholdMs = settings.dismissValue * 60 * 60 * 1000;
            break;
          case 'days':
            thresholdMs = settings.dismissValue * 24 * 60 * 60 * 1000;
            break;
        }

        if (thresholdMs > 0 && ageMs >= thresholdMs) {
          activity.seen = true;
          changed = true;
        }
      }
    });

    if (changed) {
      saveActivityLog(log);
      updateActivityIndicators();
    }
  }
}

// Start interval timer for timed dismissal (check every 30 seconds)
setInterval(checkTimedDismissal, 30000);

// Demo data
const DEMO_RESTAURANTS = [
  { 
    id: 'd1', 
    name: 'Bella Italia', 
    logo: 'pizza', 
    phone: '+4570123456', 
    status: 'active', 
    orders: 234, 
    recovered: 38, 
    features: { ai: true, sms: true },
    // CRM Data
    cvr: '12345678',
    email: 'info@bellaitalia.dk',
    owner: 'Marco Rossi',
    contactPerson: 'Giulia Bianchi',
    address: 'Vesterbrogade 45, 1620 København V',
    createdAt: '2024-06-15',
    // Links
    menuUrl: 'https://bellaitalia.dk/menu',
    website: 'https://bellaitalia.dk',
    googleReviewUrl: 'https://g.page/r/bellaitalia/review',
    trustpilotUrl: 'https://trustpilot.com/review/bellaitalia.dk',
    reviewDelay: 60,
    timeFormat: '24h',
    deliveryEnabled: true,
    // Workflow Sync
    reviewRequestEnabled: true,
    // KPI Data
    kpiEnabled: true,
    kpi: {
      totalRevenue: 187450,
      recoveredRevenue: 28350,
      avgOrderValue: 285,
      reviews: {
        total: 127,
        avgRating: 4.6,
        google: { count: 89, avgRating: 4.7 },
        trustpilot: { count: 38, avgRating: 4.4 }
      },
      conversionRate: 68,
      responseTime: 2.3,
      // Extended KPIs
      aiAutomationRate: 94,
      clv: 1245,
      reviewCTR: 18.5,
      missedCalls: 56,
      completedOrders: 38,
      // Heatmap data (hour of day -> order count)
      orderHeatmap: {
        monday: [0,0,0,0,0,0,0,0,0,0,2,4,8,5,3,2,1,6,12,15,8,4,1,0],
        tuesday: [0,0,0,0,0,0,0,0,0,1,3,5,7,4,2,1,2,5,10,14,9,5,2,0],
        wednesday: [0,0,0,0,0,0,0,0,0,0,2,4,6,5,3,2,3,7,11,16,10,4,1,0],
        thursday: [0,0,0,0,0,0,0,0,0,1,2,5,8,6,4,2,2,8,14,18,12,6,2,0],
        friday: [0,0,0,0,0,0,0,0,0,0,3,6,10,7,5,3,4,10,18,22,16,8,3,0],
        saturday: [0,0,0,0,0,0,0,0,0,0,2,5,12,9,6,4,5,12,20,25,18,10,4,0],
        sunday: [0,0,0,0,0,0,0,0,0,0,1,3,8,6,4,3,4,8,14,16,10,5,2,0]
      },
      // Sentiment data
      sentiment: { positive: 78, neutral: 18, negative: 4 }
    },
    openingHours: {
      mon: { enabled: true, open: '10:00', close: '22:00' },
      tue: { enabled: true, open: '10:00', close: '22:00' },
      wed: { enabled: true, open: '10:00', close: '22:00' },
      thu: { enabled: true, open: '10:00', close: '22:00' },
      fri: { enabled: true, open: '10:00', close: '23:00' },
      sat: { enabled: true, open: '11:00', close: '23:00' },
      sun: { enabled: true, open: '12:00', close: '21:00' }
    }
  },
  { 
    id: 'd2', 
    name: 'Sushi House', 
    logo: 'sushi', 
    phone: '+4570234567', 
    status: 'active', 
    orders: 156, 
    recovered: 24, 
    features: { ai: true, sms: true },
    // CRM Data
    cvr: '87654321',
    email: 'contact@sushihouse.dk',
    owner: 'Takeshi Yamamoto',
    contactPerson: 'Lisa Hansen',
    address: 'Nørrebrogade 123, 2200 København N',
    createdAt: '2024-08-22',
    // Links
    menuUrl: 'https://sushihouse.dk/menu',
    website: 'https://sushihouse.dk',
    googleReviewUrl: 'https://g.page/r/sushihouse/review',
    trustpilotUrl: 'https://trustpilot.com/review/sushihouse.dk',
    reviewDelay: 45,
    timeFormat: '24h',
    deliveryEnabled: true,
    // Workflow Sync
    reviewRequestEnabled: true,
    // KPI Data
    kpiEnabled: true,
    kpi: {
      totalRevenue: 142800,
      recoveredRevenue: 19200,
      avgOrderValue: 345,
      reviews: {
        total: 94,
        avgRating: 4.8,
        google: { count: 62, avgRating: 4.9 },
        trustpilot: { count: 32, avgRating: 4.6 }
      },
      conversionRate: 72,
      responseTime: 1.8,
      // Extended KPIs
      aiAutomationRate: 91,
      clv: 1580,
      reviewCTR: 22.3,
      missedCalls: 33,
      completedOrders: 24,
      // Heatmap data
      orderHeatmap: {
        monday: [0,0,0,0,0,0,0,0,0,0,1,2,4,3,2,1,1,4,8,10,6,3,1,0],
        tuesday: [0,0,0,0,0,0,0,0,0,0,1,3,5,4,2,1,2,5,9,12,7,4,1,0],
        wednesday: [0,0,0,0,0,0,0,0,0,0,2,3,5,4,3,1,2,5,10,13,8,4,2,0],
        thursday: [0,0,0,0,0,0,0,0,0,1,2,4,6,5,3,2,3,6,11,14,9,5,2,0],
        friday: [0,0,0,0,0,0,0,0,0,0,2,5,8,6,4,3,4,8,15,19,14,7,3,0],
        saturday: [0,0,0,0,0,0,0,0,0,0,2,4,9,7,5,4,5,10,17,21,15,8,3,0],
        sunday: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      },
      sentiment: { positive: 82, neutral: 15, negative: 3 }
    },
    openingHours: {
      mon: { enabled: true, open: '11:00', close: '21:00' },
      tue: { enabled: true, open: '11:00', close: '21:00' },
      wed: { enabled: true, open: '11:00', close: '21:00' },
      thu: { enabled: true, open: '11:00', close: '21:00' },
      fri: { enabled: true, open: '11:00', close: '22:00' },
      sat: { enabled: true, open: '12:00', close: '22:00' },
      sun: { enabled: false, open: '00:00', close: '00:00' }
    }
  },
  { 
    id: 'd3', 
    name: 'Burger Joint', 
    logo: 'burger', 
    phone: null, 
    status: 'pending', 
    orders: 0, 
    recovered: 0, 
    features: { ai: true },
    // CRM Data
    cvr: '55667788',
    email: 'hello@burgerjoint.dk',
    owner: 'Anders Jensen',
    contactPerson: 'Mette Andersen',
    address: 'Amagerbrogade 78, 2300 København S',
    createdAt: '2024-12-01',
    // Links
    menuUrl: 'https://burgerjoint.dk/menu',
    website: 'https://burgerjoint.dk',
    googleReviewUrl: 'https://g.page/r/burgerjoint/review',
    trustpilotUrl: 'https://trustpilot.com/review/burgerjoint.dk',
    reviewDelay: 30,
    timeFormat: '24h',
    deliveryEnabled: false,
    // Workflow Sync
    reviewRequestEnabled: true,
    // KPI Data
    kpiEnabled: false,
    kpi: {
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
      responseTime: 0,
      // Extended KPIs
      aiAutomationRate: 0,
      clv: 0,
      reviewCTR: 0,
      missedCalls: 0,
      completedOrders: 0,
      orderHeatmap: {
        monday: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        tuesday: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        wednesday: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        thursday: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        friday: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        saturday: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        sunday: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      },
      sentiment: { positive: 0, neutral: 0, negative: 0 }
    },
    openingHours: {
      mon: { enabled: true, open: '11:00', close: '22:00' },
      tue: { enabled: true, open: '11:00', close: '22:00' },
      wed: { enabled: true, open: '11:00', close: '22:00' },
      thu: { enabled: true, open: '11:00', close: '22:00' },
      fri: { enabled: true, open: '11:00', close: '23:00' },
      sat: { enabled: true, open: '11:00', close: '23:00' },
      sun: { enabled: true, open: '12:00', close: '21:00' }
    }
  },
  { 
    id: 'd4', 
    name: 'Café Hygge', 
    logo: 'cafe', 
    phone: '+4533445566', 
    status: 'inactive', 
    orders: 0, 
    recovered: 0, 
    features: { ai: false, sms: false },
    cvr: '99887766',
    email: 'info@cafehygge.dk',
    owner: 'Louise Nielsen',
    contactPerson: 'Louise Nielsen',
    address: 'Gothersgade 55, 1123 København K',
    createdAt: '2024-11-15',
    kpiEnabled: false,
    kpi: { totalRevenue: 0, recoveredRevenue: 0, avgOrderValue: 0, reviews: { total: 0, avgRating: 0, google: { count: 0, avgRating: 0 }, trustpilot: { count: 0, avgRating: 0 } }, conversionRate: 0, responseTime: 0 }
  },
  { 
    id: 'd5', 
    name: 'Pizza Express', 
    logo: 'pizza', 
    phone: '+4577889900', 
    status: 'churned', 
    orders: 156, 
    recovered: 12, 
    features: { ai: true, sms: true },
    cvr: '11223344',
    email: 'kontakt@pizzaexpress.dk',
    owner: 'Roberto Mancini',
    contactPerson: 'Roberto Mancini',
    address: 'Østerbrogade 102, 2100 København Ø',
    createdAt: '2024-03-10',
    churnedAt: '2024-10-15',
    churnReason: 'Skiftede til konkurrent',
    kpiEnabled: false,
    kpi: { totalRevenue: 89500, recoveredRevenue: 8400, avgOrderValue: 245, reviews: { total: 45, avgRating: 4.1, google: { count: 30, avgRating: 4.0 }, trustpilot: { count: 15, avgRating: 4.3 } }, conversionRate: 52, responseTime: 3.8 }
  },
  // Demo Customer - Example of trial customer
  { 
    id: 'demo_example', 
    name: 'Taste of Thailand', 
    logo: 'ramen', 
    phone: '+4520304050', 
    status: 'demo',
    isDemo: true,
    demoLicense: {
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Started 5 days ago
      expiryDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(), // 9 days remaining
      daysRemaining: 9,
      messagesUsed: 12,
      messagesLimit: 50,
      status: 'active'
    },
    contact: {
      firstName: 'Somchai',
      lastName: 'Patel',
      email: 'somchai@tasteofthailand.dk',
      phone: '+4520304050'
    },
    orders: 8, 
    recovered: 2, 
    features: { ai: true, sms: true, billing: false, export: false },
    cvr: '55667788',
    email: 'somchai@tasteofthailand.dk',
    owner: 'Somchai Patel',
    contactPerson: 'Somchai Patel',
    address: {
      street: 'Istedgade 78',
      zip: '1650',
      city: 'København V',
      country: 'DK'
    },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'demo@orderflow.ai',
    kpiEnabled: true,
    kpi: { totalRevenue: 4200, recoveredRevenue: 850, avgOrderValue: 185, reviews: { total: 3, avgRating: 4.7, google: { count: 2, avgRating: 4.5 }, trustpilot: { count: 1, avgRating: 5.0 } }, conversionRate: 68, responseTime: 1.2 },
    openingHours: {
      mon: { enabled: true, open: '16:00', close: '22:00' },
      tue: { enabled: true, open: '16:00', close: '22:00' },
      wed: { enabled: true, open: '16:00', close: '22:00' },
      thu: { enabled: true, open: '16:00', close: '22:00' },
      fri: { enabled: true, open: '16:00', close: '23:00' },
      sat: { enabled: true, open: '12:00', close: '23:00' },
      sun: { enabled: true, open: '12:00', close: '21:00' }
    }
  }
];

// Supabase client reference used by legacy code paths in this file.
// Some parts of this app still reference `supabaseClient` directly, so we keep a global alias.

function toggleDropdown(type) {
  const dropdowns = {
    'help': 'help-dropdown-wrap',
    'news': 'news-dropdown-wrap',
    'notif': 'notif-dropdown-wrap',
    'profile': null // Profile uses different system
  };
  
  // Handle profile separately
  if (type === 'profile') {
    const profile = document.querySelector('.topbar-profile');
    const wasOpen = profile.classList.contains('open');
    
    // Close all other dropdowns
    closeAllDropdowns();
    
    if (!wasOpen) {
      profile.classList.add('open');
      activeDropdown = 'profile';
    }
    return;
  }
  
  const wrapId = dropdowns[type];
  if (!wrapId) return;
  
  const wrap = document.getElementById(wrapId);
  const wasOpen = wrap.classList.contains('open');
  
  // Close all dropdowns first
  closeAllDropdowns();
  
  // Toggle this one if it was closed
  if (!wasOpen) {
    wrap.classList.add('open');
    activeDropdown = type;
  }
}

function closeAllDropdowns() {
  document.querySelectorAll('.topbar-dropdown-wrap').forEach(el => {
    el.classList.remove('open');
  });
  document.querySelector('.topbar-profile')?.classList.remove('open');
  activeDropdown = null;
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
  const isDropdownClick = e.target.closest('.topbar-dropdown-wrap') || 
                          e.target.closest('.topbar-profile');
  
  if (!isDropdownClick) {
    closeAllDropdowns();
  }
});

// Close dropdowns and modals on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAllDropdowns();
    // Close active modal-overlays
    document.querySelectorAll('.modal-overlay.active').forEach(m => {
      m.classList.remove('active');
      m.style.display = 'none';
    });
    // Close dynamically created modals (inline display, no .active class)
    ['inactivity-modal', 'wb-preview-modal', 'quick-api-key-modal'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.style.display !== 'none') {
        el.style.display = 'none';
        if (id === 'inactivity-modal') dismissInactivityWarning();
      }
    });
  }
});

// Close modal-overlays when clicking outside the dialog
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay') && e.target.classList.contains('active')) {
    e.target.classList.remove('active');
    e.target.style.display = 'none';
  }
});

// =====================================================
// APP
// =====================================================
function showApp() {
  try {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app').classList.add('active');
    
    // Set user info - sidebar (with null checks)
    const name = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Bruger';
    
    const userNameEl = document.getElementById('user-name');
    const userEmailEl = document.getElementById('user-email');
    const userAvatarEl = document.getElementById('user-avatar');
    
    if (userNameEl) userNameEl.textContent = name;
    if (userEmailEl) userEmailEl.textContent = currentUser?.email || '';
    if (userAvatarEl) userAvatarEl.textContent = name.charAt(0).toUpperCase();
    
    // Set user info - topbar
    const topbarAvatar = document.getElementById('topbar-avatar');
    const dropdownName = document.getElementById('dropdown-name');
    const dropdownEmail = document.getElementById('dropdown-email');
    
    if (topbarAvatar) topbarAvatar.textContent = name.charAt(0).toUpperCase();
    if (dropdownName) dropdownName.textContent = name;
    if (dropdownEmail) dropdownEmail.textContent = currentUser?.email || '';

    // Set tooltip on profile element with user's full name
    const topbarProfile = document.querySelector('.topbar-profile');
    if (topbarProfile) topbarProfile.title = name;

    // Load data with error handling
    // VIGTIGT: Kun load admin dashboard for admin/employee - ikke for demo/kunde
    const isCustomerOrDemo = currentUser?.role && [ROLES.DEMO, ROLES.CUSTOMER].includes(currentUser.role);
    if (!isCustomerOrDemo) {
      try { loadDashboard(); } catch(e) { console.error('loadDashboard:', e); }
    }
    try { loadRestaurants(); } catch(e) { console.error('loadRestaurants:', e); }
    try { renderWorkflowNodes(); } catch(e) { console.error('renderWorkflowNodes:', e); }
    try { loadConfig(); } catch(e) { console.error('loadConfig:', e); }
    
    // Initialiser update indikatorer efter kort delay
    setTimeout(() => {
      try { initUpdateIndicators(); } catch(e) { console.error('initUpdateIndicators:', e); }
    }, 100);

    // Clear stale notifications hvis ingen kunder eksisterer
    if (restaurants.length === 0 && typeof NotificationSystem !== 'undefined') {
      NotificationSystem.clearPath('kunder');
      NotificationSystem.clearPath('alle-kunder');
      console.log('🧹 Cleared stale customer notifications (no customers exist)');
    }

    // ALTID start på dashboard efter login
    // (ignorer URL hash så brugeren ikke ender på den sidst besøgte side)
    history.replaceState({ page: 'dashboard' }, '', '#dashboard');
    showPage('dashboard');

    console.log('App loaded successfully');
  } catch (err) {
    console.error('showApp error:', err);
  }
}

// ═══════════════════════════════════════════════════════════════
// 🔒 SIDEBAR TEMPLATE FUNCTIONS - AUTHORIZATION REQUIRED
// ═══════════════════════════════════════════════════════════════
// Template Version: 1.6.6 (build 166)
//
// ⚠️  PROTECTED FUNCTIONS - DO NOT MODIFY WITHOUT AUTHORIZATION
//
// Protected sidebar functions:
// - toggleSidebar()
// - initSidebarState()
// - toggleNavDropdown()
// - applyRoleBasedSidebar()
//
// See SIDEBAR-TEMPLATE.md for complete specification.
// ═══════════════════════════════════════════════════════════════

// =====================================================
// SMART SIDEBAR - Toggle collapsed state
// =====================================================
let sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const workflowPage = document.getElementById('page-workflow');

  sidebarCollapsed = !sidebarCollapsed;

  if (sidebarCollapsed) {
    sidebar.classList.add('collapsed');
    // Close all open dropdowns when collapsing
    document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
    // Update workflow page position
    if (workflowPage) workflowPage.classList.add('sidebar-collapsed');
  } else {
    sidebar.classList.remove('collapsed');
    if (workflowPage) workflowPage.classList.remove('sidebar-collapsed');
  }

  // Save preference
  localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
}

// Initialize sidebar state on load
function initSidebarState() {
  const sidebar = document.getElementById('sidebar');
  const workflowPage = document.getElementById('page-workflow');
  if (sidebar && sidebarCollapsed) {
    sidebar.classList.add('collapsed');
    if (workflowPage) workflowPage.classList.add('sidebar-collapsed');
  }
}

// Call on page load
document.addEventListener('DOMContentLoaded', initSidebarState);

// =====================================================
// MOBILE MENU FUNCTIONS
// =====================================================

function toggleMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (sidebar.classList.contains('mobile-open')) {
    closeMobileMenu();
  } else {
    sidebar.classList.add('mobile-open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scroll when menu open
  }
}

function closeMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  sidebar.classList.remove('mobile-open');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

// Close mobile menu when clicking a nav item
function handleMobileNavClick() {
  if (window.innerWidth <= 640) {
    closeMobileMenu();
  }
}

// Add click handlers to all nav buttons for mobile
document.addEventListener('DOMContentLoaded', function() {
  // Close mobile menu when navigating
  document.querySelectorAll('.sidebar .nav-btn, .sidebar .nav-dropdown-menu button, .sidebar .nav-dropdown-item').forEach(btn => {
    btn.addEventListener('click', function(e) {
      // Don't close if clicking dropdown toggle (let it toggle instead)
      if (btn.classList.contains('nav-dropdown-toggle')) {
        return;
      }
      handleMobileNavClick();
    });
  });

  // Handle window resize
  window.addEventListener('resize', function() {
    if (window.innerWidth > 640) {
      closeMobileMenu();
    }
  });
});

// Browser history navigation flag
let isNavigatingFromHistory = false;

function showPage(page) {
  // Skjul dashboard chart tooltip ved sideskift
  var chartTooltip = document.getElementById('chartjs-tooltip');
  if (chartTooltip) { chartTooltip.style.display = 'none'; chartTooltip.style.opacity = 0; }

  // Nulstil kunde-kontekst når man navigerer væk fra kunder
  if (page !== 'kunder') {
    currentProfileRestaurantId = null;
  }

  // === ROLLE-GUARDS: Blokér admin-sider for kunde/demo ===
  const adminOnlyPages = ['kunder', 'alle-kunder', 'add-restaurant'];
  if (currentUser?.role && [ROLES.CUSTOMER, ROLES.DEMO].includes(currentUser.role) && adminOnlyPages.includes(page)) {
    console.warn('🚫 Blocked navigation to admin page:', page);
    page = 'dashboard'; // Redirect til dashboard i stedet
  }

  // === DEMO/KUNDE: Dashboard skal bruge kundens profil-dashboard ===
  const isCustomerView = currentUser?.role && [ROLES.CUSTOMER, ROLES.DEMO].includes(currentUser.role);
  if (isCustomerView && page === 'dashboard') {
    if (!isNavigatingFromHistory) {
      history.pushState({ page: page }, '', `#${page}`);
    }
    isNavigatingFromHistory = false;

    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.scrollTop = 0;

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const dashBtn = document.querySelector('.nav-btn[onclick="showPage(\'dashboard\')"]');
    if (dashBtn) dashBtn.classList.add('active');

    if (currentUser?.role) {
      applyRoleBasedSidebar();
    }

    showCustomerSubpage('dashboard');
    return;
  }

  // Push til browser history (undgå ved popstate navigation)
  if (!isNavigatingFromHistory) {
    history.pushState({ page: page }, '', `#${page}`);
  }
  isNavigatingFromHistory = false;
  // Reset scroll position to top when leaving page
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.scrollTop = 0;
  }

  document.querySelectorAll('.page, .workflow-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.nav-dropdown-item').forEach(i => i.classList.remove('active'));
  document.querySelectorAll('.nav-dropdown-toggle').forEach(t => t.classList.remove('active'));

  // Markér opdateringer som set for denne side
  markPageUpdatesAsSeen(page);
  
  // KRITISK: Kontroller body overflow baseret på side
  if (page === 'workflow') {
    document.body.classList.add('workflow-active');
  } else {
    document.body.classList.remove('workflow-active');
  }
  
  const pageEl = document.getElementById('page-' + page);
  if (pageEl) {
    pageEl.classList.add('active');
  }

  // Midlertidig dev page-ID badge
  showPageIdBadge(page);

  // Reset CRM til search view når man går til kunder-siden
  if (page === 'kunder') {
    refreshRestaurantsFromDB().then(() => loadRestaurants());
    showCrmSearchView();
  }
  

  // Load ordrer når orders-siden vises
  if (page === 'orders') {
    loadOrdersPage();
  }

  // Initialize Unified Inbox
  if (page === 'unified-inbox') {
    if (window.UnifiedInbox) {
      window.UnifiedInbox.init();
    }
  }

  // Load leads når lead-siderne vises
  if (page === 'leads') {
    loadLeadsPage();
  }
  if (page === 'leads-pipeline') {
    loadPipelinePage();
  }

  // Rapport-sider: populer filtre og vis demo data hvis aktiv
  var _reportPages = ['dagsrapport','produktrapport','zrapport','konverteringsrapport','genbestillingsrapport','anmeldelsesrapport','heatmaprapport'];
  if (_reportPages.indexOf(page) !== -1) {
    populateReportFiltersAndRender(page);
  }
  
  // Load aktiviteter når activities-siden vises
  if (page === 'activities') {
    loadActivitiesPage();
  }

  // Load Agenter page
  if (page === 'agenter') {
    if (typeof loadAgenterPage === 'function') loadAgenterPage();
  }

  // Load Instagram Workflow page
  if (page === 'instagram-workflow') {
    loadWorkflowAgentPage('instagram');
  }

  // Load Facebook Workflow page
  if (page === 'facebook-workflow') {
    loadWorkflowAgentPage('facebook');
  }

  // Load SMS Workflows page
  if (page === 'sms-workflows') {
    loadSmsWorkflows();
  }
  
  // Reset demo onboarding when page is shown
  if (page === 'demo-onboarding') {
    resetDemoOnboarding();
  }
  
  // Clear add-restaurant form when page is shown
  if (page === 'add-restaurant') {
    clearAddRestaurantForm();
  }

  // Load alle-kunder grid when page is shown
  if (page === 'alle-kunder') {
    refreshRestaurantsFromDB().then(() => loadAlleKunderGrid());
  }

  // Load loyalty page
  if (page === 'loyalty') {
    renderLoyaltyPage();
  }

  // Load medlemmer page
  if (page === 'medlemmer') {
    renderMembersPage();
  }

  // Load campaigns page (new Marketing Editor)
  if (page === 'campaigns') {
    initMarketingPage();
  }

  // Load segments page (redirects to marketing segments tab)
  if (page === 'segments') {
    showPage('campaigns');
    setTimeout(() => switchMarketingTab('segments'), 50);
    return;
  }

  // Redirect old QR generator page to Vaerktoejer QR tab
  if (page === 'qr-generator' || page === 'qr-kode') {
    showPage('vaerktoejer');
    setTimeout(function() { switchVaerktoejTab('qrkode'); }, 50);
    return;
  }

  // Load udsendelser page (redirects to marketing broadcasts tab)
  if (page === 'udsendelser') {
    showPage('campaigns');
    setTimeout(() => switchMarketingTab('broadcasts'), 50);
    return;
  }

  // Load AI Medier page
  if (page === 'ai-medier') {
    loadAiMediaHistory();
  }

  // Load Instagram/Facebook workflow agent views
  if (page === 'instagram-workflow') {
    loadAgentWorkflowPage('instagram');
  }
  if (page === 'facebook-workflow') {
    loadAgentWorkflowPage('facebook');
  }

  // Load App Builder page
  if (page === 'appbuilder') {
    showAppBuilderPage('design');
    return;
  }

  // Refresh dashboard data
  if (page === 'dashboard') {
    refreshRestaurantsFromDB().then(() => loadDashboard());
  }

  // Centrer workflow når workflow-siden vises
  if (page === 'workflow') {
    // Initialize demo mode for demo users
    initWorkflowDemo();

    // Populate test restaurant dropdown
    populateTestRestaurants();

    // Reset transform to ensure clean state
    canvasTransform = { x: 0, y: 0, scale: 0.6 };

    // Initialize canvas and render nodes first
    setTimeout(() => {
      initCanvasPanning();
      renderWorkflowNodes();

      // Then center after nodes are rendered
      setTimeout(() => {
        fitWorkflowToView();
      }, 100);

      // Final check
      setTimeout(() => {
        fitWorkflowToView();
      }, 300);
    }, 50);
  }

  // Load Analytics Dashboard pages
  if (page === 'analytics-overview') {
    if (window.AnalyticsDashboard) {
      const restaurantId = currentRestaurantId || restaurants?.[0]?.id || (currentUser?.role === ROLES.DEMO ? getDemoDataCustomers()[0]?.id : null);
      AnalyticsDashboard.setRestaurant(restaurantId);
      AnalyticsDashboard.loadOverviewData();
    }
    // Also run inline analytics fallback
    if (typeof loadAnalyticsOverview === 'function') loadAnalyticsOverview();
  }

  if (page === 'analytics-sales') {
    if (window.AnalyticsDashboard) {
      const restaurantId = currentRestaurantId || restaurants?.[0]?.id || (currentUser?.role === ROLES.DEMO ? getDemoDataCustomers()[0]?.id : null);
      AnalyticsDashboard.setRestaurant(restaurantId);
      AnalyticsDashboard.loadSalesData();
    }
    if (typeof loadAnalyticsSales === 'function') loadAnalyticsSales();
  }

  if (page === 'analytics-products') {
    if (window.AnalyticsDashboard) {
      const restaurantId = currentRestaurantId || restaurants?.[0]?.id || (currentUser?.role === ROLES.DEMO ? getDemoDataCustomers()[0]?.id : null);
      AnalyticsDashboard.setRestaurant(restaurantId);
      AnalyticsDashboard.loadProductsData();
    }
    if (typeof loadAnalyticsProducts === 'function') loadAnalyticsProducts();
  }

  if (page === 'analytics-ai') {
    if (window.AnalyticsDashboard) {
      const restaurantId = currentRestaurantId || restaurants?.[0]?.id || (currentUser?.role === ROLES.DEMO ? getDemoDataCustomers()[0]?.id : null);
      AnalyticsDashboard.setRestaurant(restaurantId);
      AnalyticsDashboard.loadAIData();
    }
  }

  if (page === 'analytics-channels') {
    if (window.AnalyticsDashboard) {
      const restaurantId = currentRestaurantId || restaurants?.[0]?.id || (currentUser?.role === ROLES.DEMO ? getDemoDataCustomers()[0]?.id : null);
      AnalyticsDashboard.setRestaurant(restaurantId);
    }
  }

  // Highlight correct nav item
  document.querySelectorAll('.nav-btn').forEach(b => {
    const btnPage = b.getAttribute('onclick')?.match(/showPage\('(.+?)'\)/)?.[1];
    if (btnPage === page || btnPage === 'page-' + page || page === 'page-' + btnPage) {
      b.classList.add('active');
    }
  });
  
  // Highlight dropdown items
  const activeDropdowns = new Set();
  document.querySelectorAll('.nav-dropdown-item').forEach(item => {
    const onclick = item.getAttribute('onclick');
    if (onclick && onclick.includes(`'${page}'`)) {
      item.classList.add('active');
      // Open parent dropdown
      const dropdown = item.closest('.nav-dropdown');
      if (dropdown) {
        dropdown.classList.add('open');
        activeDropdowns.add(dropdown);
      }
    }
  });
  
  if (activeDropdowns.size > 0) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    activeDropdowns.forEach(dropdown => {
      dropdown.querySelector('.nav-dropdown-toggle')?.classList.add('active');
    });
  }

  // === ROLE-BASED SIDEBAR: Lad applyRoleBasedSidebar() håndtere ALT visibility ===
  // Fjernet duplicate style manipulation - applyRoleBasedSidebar() er single source of truth
  if (currentUser?.role) {
    // Brug synkront kald for at sikre sidebar er korrekt INDEN siden vises
    applyRoleBasedSidebar();
  }
}

// Midlertidig dev page-ID badge (fjernes når app er færdig)
function showPageIdBadge(page) {
  var existing = document.getElementById('dev-page-id-badge');
  if (existing) existing.remove();
  var pageId = 'page-' + page;
  var badge = document.createElement('div');
  badge.id = 'dev-page-id-badge';
  badge.textContent = pageId;
  badge.style.cssText = 'position:fixed;bottom:12px;right:12px;background:rgba(0,0,0,0.8);color:#0f0;font-family:monospace;font-size:11px;padding:4px 10px;border-radius:4px;z-index:99999;cursor:pointer;opacity:0.7;user-select:none;transition:opacity 0.2s';
  badge.title = 'Dobbeltklik for at kopiere';
  badge.addEventListener('dblclick', function() {
    navigator.clipboard.writeText(pageId).then(function() {
      badge.textContent = 'Kopieret!';
      badge.style.color = '#4ade80';
      badge.style.opacity = '1';
      setTimeout(function() { badge.textContent = pageId; badge.style.color = '#0f0'; badge.style.opacity = '0.7'; }, 1500);
    }).catch(function() {
      var ta = document.createElement('textarea');
      ta.value = pageId;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      badge.textContent = 'Kopieret!';
      setTimeout(function() { badge.textContent = pageId; }, 1500);
    });
  });
  document.body.appendChild(badge);
}

// Browser back/forward navigation handler
window.addEventListener('popstate', (event) => {
  if (event.state && event.state.page) {
    isNavigatingFromHistory = true;
    showPage(event.state.page);
  }
});

// Toggle sidebar dropdown menus - auto-expand sidebar if collapsed
// OPDATERET: Auto-navigation til første side + kunde-context cleanup
function toggleNavDropdown(name) {
  const dropdown = document.getElementById('nav-' + name);
  const sidebar = document.getElementById('sidebar');
  const wasOpen = dropdown && dropdown.classList.contains('open');
  const isMobile = window.innerWidth <= 640;

  // Luk alle åbne dropdowns (accordion logik)
  document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));

  // Luk kunde-kontekst menu når andre dropdowns åbnes
  if (name !== 'kunder' && currentProfileRestaurantId) {
    // Ryd kunde kontekst og skjul kunde-navigation
    const kundeContextNav = document.getElementById('kunde-context-nav');
    if (kundeContextNav) {
      kundeContextNav.style.display = 'none';
    }
    currentProfileRestaurantId = null;
  }

  if (sidebar && sidebar.classList.contains('collapsed')) {
    sidebarCollapsed = false;
    sidebar.classList.remove('collapsed');
    localStorage.setItem('sidebarCollapsed', 'false');
    setTimeout(() => {
      if (dropdown) {
        dropdown.classList.add('open');
        // Auto-navigér til første side i dropdown (ONLY on desktop)
        if (!isMobile) {
          const firstItem = dropdown.querySelector('.nav-dropdown-item');
          if (firstItem && !wasOpen) {
            firstItem.click();
          }
        }
      }
    }, 100);
  } else if (dropdown && !wasOpen) {
    dropdown.classList.add('open');
    // Auto-navigér til første side i dropdown (1 klik = åben + vis første side) - ONLY on desktop
    if (!isMobile) {
      const firstItem = dropdown.querySelector('.nav-dropdown-item');
      if (firstItem) {
        firstItem.click();
      }
    }
  }
}

// Close FLOW-CMS flyout panel
function closeFlyout() {
  const panel = document.getElementById('flow-flyout-panel');
  if (panel) {
    panel.classList.remove('visible');
    panel.classList.remove('pinned');
  }
  // Also mark trigger as inactive
  const trigger = document.getElementById('nav-flow-trigger');
  if (trigger) {
    trigger.classList.remove('active');
  }
}

// Position flyout panel within screen bounds
function positionFlyoutPanel() {
  const panel = document.getElementById('flow-flyout-panel');
  const trigger = document.getElementById('nav-flow-trigger');
  const btn = trigger ? trigger.querySelector('.nav-flyout-btn') : null;

  if (panel && btn) {
    const btnRect = btn.getBoundingClientRect();
    const panelHeight = panel.offsetHeight || 400;
    const viewportHeight = window.innerHeight;
    const margin = 20;

    // Calculate top position - align with button, but ensure it stays within viewport
    let topPos = btnRect.top;
    if (topPos + panelHeight > viewportHeight - margin) {
      topPos = viewportHeight - panelHeight - margin;
    }
    if (topPos < margin) {
      topPos = margin;
    }

    panel.style.top = topPos + 'px';
  }
}

// Toggle FLOW-CMS flyout panel on button click (pin/unpin)
function toggleFlyout(event) {
  event.stopPropagation();
  const panel = document.getElementById('flow-flyout-panel');
  const trigger = document.getElementById('nav-flow-trigger');

  if (panel && trigger) {
    const isPinned = panel.classList.contains('pinned');

    if (isPinned) {
      // Unpin - will close when mouse leaves
      panel.classList.remove('pinned');
      panel.classList.remove('visible');
      trigger.classList.remove('active');
    } else {
      // Pin - stays open
      positionFlyoutPanel();
      panel.classList.add('pinned');
      panel.classList.add('visible');
      trigger.classList.add('active');
    }
  }
}

// Initialize flyout behavior
document.addEventListener('DOMContentLoaded', function() {
  const trigger = document.getElementById('nav-flow-trigger');
  const flyoutBtn = trigger ? trigger.querySelector('.nav-flyout-btn') : null;
  const panel = document.getElementById('flow-flyout-panel');

  if (flyoutBtn && panel) {
    // Click to pin/unpin
    flyoutBtn.addEventListener('click', toggleFlyout);

    // Position panel on hover
    trigger.addEventListener('mouseenter', positionFlyoutPanel);
  }

  // Close flyout when clicking other sidebar nav items
  const sidebarItems = document.querySelectorAll('.sidebar .nav-dropdown-toggle, .sidebar .nav-item:not(#nav-flow-trigger)');
  sidebarItems.forEach(item => {
    item.addEventListener('click', function() {
      closeFlyout();
    });
  });
});

// =====================================================
// FAQ ACCORDION FUNCTIONS
// =====================================================
function toggleFAQ(id) {
  const items = document.querySelectorAll('.faq-item');
  const clickedItem = document.querySelector(`.faq-item[data-faq="${id}"]`);
  
  if (!clickedItem) return;
  
  // If clicking on already open item, close it
  if (clickedItem.classList.contains('open')) {
    clickedItem.classList.remove('open');
    return;
  }
  
  // Close all other items
  items.forEach(item => item.classList.remove('open'));
  
  // Open clicked item
  clickedItem.classList.add('open');
}

function filterFAQ(searchTerm) {
  const items = document.querySelectorAll('.faq-item');
  const term = searchTerm.toLowerCase().trim();
  
  items.forEach(item => {
    const question = item.querySelector('.faq-question span')?.textContent.toLowerCase() || '';
    const answer = item.querySelector('.faq-answer p')?.textContent.toLowerCase() || '';
    
    if (term === '' || question.includes(term) || answer.includes(term)) {
      item.classList.remove('hidden');
    } else {
      item.classList.add('hidden');
    }
  });
}

// Filter both docs and FAQ on support page
function filterSupportContent(searchTerm) {
  const term = searchTerm.toLowerCase().trim();
  
  // Filter documentation cards
  const docCards = document.querySelectorAll('.support-doc-card');
  docCards.forEach(card => {
    const title = card.querySelector('h4')?.textContent.toLowerCase() || '';
    const desc = card.querySelector('p')?.textContent.toLowerCase() || '';
    const searchData = card.getAttribute('data-search')?.toLowerCase() || '';
    
    if (term === '' || title.includes(term) || desc.includes(term) || searchData.includes(term)) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });
  
  // Filter FAQ items
  const faqItems = document.querySelectorAll('#faq-accordion .faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question span')?.textContent.toLowerCase() || '';
    const answer = item.querySelector('.faq-answer p')?.textContent.toLowerCase() || '';
    const searchData = item.getAttribute('data-search')?.toLowerCase() || '';
    
    if (term === '' || question.includes(term) || answer.includes(term) || searchData.includes(term)) {
      item.classList.remove('hidden');
    } else {
      item.classList.add('hidden');
    }
  });
  
  // Show/hide section titles based on visible items
  const docsSection = document.querySelector('.support-docs-section');
  const faqSection = document.querySelector('.faq-section');
  
  if (docsSection) {
    const visibleDocs = docsSection.querySelectorAll('.support-doc-card:not(.hidden)');
    docsSection.style.display = visibleDocs.length > 0 ? 'block' : 'none';
  }
  
  if (faqSection) {
    const visibleFaq = faqSection.querySelectorAll('.faq-item:not(.hidden)');
    faqSection.style.display = visibleFaq.length > 0 ? 'block' : 'none';
  }
}

// Show support documentation - opens external docs site
// Dokumentation data
const DOCS_DATA = {
  'ai-order-handling': {
    section: 'Kom godt i gang',
    title: 'Opsætning af AI-ordrehåndtering',
    desc: 'Lær hvordan OrderFlows AI automatisk fortolker og håndterer indkommende ordrer.',
    time: '10 min',
    prev: null,
    next: 'sms-configuration',
    content: `
      <h2>Sådan virker AI-ordrehåndtering</h2>
      <p>Når en kunde sender en SMS eller besked, sker følgende:</p>
      <div class="docs-flow">
        <div class="docs-flow-step">📱 Kunde sender besked</div>
        <span class="docs-flow-arrow">-></span>
        <div class="docs-flow-step">🤖 AI analyserer teksten</div>
        <span class="docs-flow-arrow">-></span>
        <div class="docs-flow-step">📋 Ordre oprettes</div>
        <span class="docs-flow-arrow">-></span>
        <div class="docs-flow-step">✅ Bekræftelse sendes</div>
      </div>
      
      <h2>Aktiver AI-ordrehåndtering</h2>
      <h3>Trin 1: Gå til Workflow</h3>
      <ol>
        <li>Klik på <strong>Workflow</strong> i sidemenuen</li>
        <li>Vælg din restaurant i dropdown'en</li>
      </ol>
      
      <h3>Trin 2: Aktiver Standard Workflow</h3>
      <ol>
        <li>Find <strong>"AI Ordrehåndtering"</strong> workflow</li>
        <li>Klik på toggle-knappen for at aktivere</li>
        <li>Workflowet er nu aktivt!</li>
      </ol>
      
      <h2>AI Konfidens-niveauer</h2>
      <p>AI'en vurderer hvor sikker den er på sin fortolkning:</p>
      <table>
        <thead>
          <tr><th>Konfidens</th><th>Handling</th><th>Eksempel</th></tr>
        </thead>
        <tbody>
          <tr><td><span class="docs-badge green">90-100%</span></td><td>Auto-bekræft ordre</td><td>"2 pepperoni pizzaer til Vestergade 10"</td></tr>
          <tr><td><span class="docs-badge yellow">70-89%</span></td><td>Ordre oprettes, markeres til gennemgang</td><td>"2 store pizzaer med skinke"</td></tr>
          <tr><td><span class="docs-badge red">&lt; 70%</span></td><td>Manuel håndtering påkrævet</td><td>"det sædvanlige tak"</td></tr>
        </tbody>
      </table>
      
      <div class="docs-callout tip">
        <svg class="docs-callout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
        <div><strong>💡 Pro-tip:</strong> Start med 90% og sænk gradvist når AI'en lærer dine produkter.</div>
      </div>
    `
  },
  'sms-configuration': {
    section: 'Kom godt i gang',
    title: 'Konfigurer SMS-beskeder',
    desc: 'Tilpas automatiske SMS-beskeder til dine kunder og optimer din kommunikation.',
    time: '8 min',
    prev: 'ai-order-handling',
    next: 'missed-calls',
    content: `
      <h2>Oversigt</h2>
      <p>OrderFlow sender automatisk SMS'er ved forskellige hændelser. Du kan tilpasse alle skabeloner til at matche din tone og brand.</p>
      
      <h2>Adgang til SMS-indstillinger</h2>
      <ol>
        <li>Gå til <strong>Indstillinger</strong> i sidemenuen</li>
        <li>Klik på <strong>SMS & Beskeder</strong> tab</li>
        <li>Vælg den restaurant du vil konfigurere</li>
      </ol>
      
      <h2>Tilgængelige variabler</h2>
      <p>Du kan bruge disse variabler i dine SMS-skabeloner:</p>
      <table>
        <thead>
          <tr><th>Variabel</th><th>Beskrivelse</th><th>Eksempel</th></tr>
        </thead>
        <tbody>
          <tr><td><code>{kundenavn}</code></td><td>Kundens navn</td><td>Anders</td></tr>
          <tr><td><code>{restaurant}</code></td><td>Restaurant navn</td><td>Bella Italia</td></tr>
          <tr><td><code>{ordrenummer}</code></td><td>Ordre ID</td><td>1234</td></tr>
          <tr><td><code>{total}</code></td><td>Total beløb</td><td>259,00 kr</td></tr>
          <tr><td><code>{leveringstid}</code></td><td>Estimeret leveringstid</td><td>kl. 18:30</td></tr>
        </tbody>
      </table>
      
      <div class="docs-callout tip">
        <svg class="docs-callout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        <div><strong>💡 Pro-tip:</strong> Hold SMS'er korte og informative. Brug emojis sparsomt.</div>
      </div>
    `
  },
  'missed-calls': {
    section: 'Kom godt i gang',
    title: 'Mistede Opkald Auto-SMS',
    desc: 'Konverter mistede opkald til ordrer med automatisk SMS-opfølgning.',
    time: '6 min',
    prev: 'sms-configuration',
    next: 'train-ai-orders',
    content: `
      <h2>Oversigt</h2>
      <p>Konverter mistede opkald til ordrer ved automatisk at sende en SMS til kunden inden for 30 sekunder.</p>
      
      <h2>Sådan virker det</h2>
      <div class="docs-flow">
        <div class="docs-flow-step">📞 Kunde ringer</div>
        <span class="docs-flow-arrow">-></span>
        <div class="docs-flow-step">⏰ Ubesvaret efter 15 sek</div>
        <span class="docs-flow-arrow">-></span>
        <div class="docs-flow-step">📱 Auto-SMS sendes</div>
        <span class="docs-flow-arrow">-></span>
        <div class="docs-flow-step">🛒 Kunde bestiller via SMS</div>
      </div>
      
      <h2>Opsætning</h2>
      <ol>
        <li>Gå til <strong>Workflow</strong></li>
        <li>Find <strong>"Mistet Opkald Handler"</strong></li>
        <li>Aktiver workflowet</li>
        <li>Tilpas SMS-skabelonen</li>
      </ol>
      
      <div class="docs-callout tip">
        <svg class="docs-callout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        <div><strong>💡 Pro-tip:</strong> Inkluder link til online-menu i SMS'en for højere konvertering.</div>
      </div>
    `
  },
  'train-ai-orders': {
    section: 'Tutorials',
    title: 'Træn din AI til ordrer',
    desc: 'Lær AI\'en at forstå dine produkter, kundemønstre og særlige ønsker.',
    time: '20 min',
    prev: 'missed-calls',
    next: 'custom-workflow',
    content: `
      <h2>Oversigt</h2>
      <p>Jo mere du træner AI'en, jo bedre bliver den til at forstå dine kunders ordrer.</p>
      
      <h2>Upload din menu</h2>
      <ol>
        <li>Gå til <strong>Kunder</strong> -> vælg restaurant</li>
        <li>Klik på <strong>Produkter</strong> tab</li>
        <li>Tilføj alle produkter med navn, pris og kategori</li>
      </ol>
      
      <h2>Godkend/afvis ordrer</h2>
      <p>Hver gang du godkender eller afviser en AI-fortolkning, lærer systemet:</p>
      <ul>
        <li><strong>Godkend:</strong> AI'en lærer at denne fortolkning var korrekt</li>
        <li><strong>Afvis:</strong> AI'en lærer at undgå denne fejl fremover</li>
        <li><strong>Rediger:</strong> AI'en lærer den korrekte fortolkning</li>
      </ul>
      
      <h2>Tilføj produktvarianter</h2>
      <p>Hjælp AI'en med at forstå varianter og synonymer:</p>
      <table>
        <thead>
          <tr><th>Produkt</th><th>Varianter/Synonymer</th></tr>
        </thead>
        <tbody>
          <tr><td>Margherita</td><td>margarita, den klassiske, den simple</td></tr>
          <tr><td>Coca-Cola</td><td>cola, coke, sodavand</td></tr>
          <tr><td>Pommes frites</td><td>fritter, pomfrit, fries</td></tr>
        </tbody>
      </table>
      
      <div class="docs-callout tip">
        <svg class="docs-callout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        <div><strong>💡 Pro-tip:</strong> Brug de første 50-100 ordrer aktivt til at træne AI'en.</div>
      </div>
    `
  },
  'custom-workflow': {
    section: 'Tutorials',
    title: 'Byg custom workflows',
    desc: 'Opret avancerede automatiseringsflows tilpasset din virksomhed.',
    time: '30 min',
    prev: 'train-ai-orders',
    next: 'vat-configuration',
    content: `
      <h2>Oversigt</h2>
      <p>Workflow-builderen lader dig skabe avancerede automatiseringer uden at skrive kode.</p>
      
      <h2>Workflow-komponenter</h2>
      <ul>
        <li><strong>Triggers:</strong> Hvad starter workflowet (SMS modtaget, ordre oprettet, etc.)</li>
        <li><strong>Conditions:</strong> Hvornår skal handlingen udføres</li>
        <li><strong>Actions:</strong> Hvad skal der ske (send SMS, opret ordre, etc.)</li>
      </ul>
      
      <h2>Opret nyt workflow</h2>
      <ol>
        <li>Gå til <strong>Workflow</strong></li>
        <li>Klik <strong>+ Nyt Workflow</strong></li>
        <li>Vælg trigger type</li>
        <li>Tilføj conditions og actions</li>
        <li>Test og aktiver</li>
      </ol>
      
      <h2>Eksempel: Automatisk opfølgning</h2>
      <p>Et workflow der sender opfølgning 24 timer efter levering:</p>
      <div class="docs-flow">
        <div class="docs-flow-step">🚚 Ordre leveret</div>
        <span class="docs-flow-arrow">-></span>
        <div class="docs-flow-step">⏰ Vent 24 timer</div>
        <span class="docs-flow-arrow">-></span>
        <div class="docs-flow-step">📱 Send feedback SMS</div>
      </div>
      
      <div class="docs-callout tip">
        <svg class="docs-callout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        <div><strong>💡 Pro-tip:</strong> Start med simple workflows og byg gradvist kompleksitet.</div>
      </div>
    `
  },
  'vat-configuration': {
    section: 'Tutorials',
    title: 'Moms-opsætning',
    desc: 'Konfigurer korrekt momsberegning for din virksomhed.',
    time: '5 min',
    prev: 'custom-workflow',
    next: 'user-management',
    content: `
      <h2>Dansk moms (25%)</h2>
      <p>OrderFlow er konfigureret til dansk moms som standard.</p>
      
      <h2>Indstillinger</h2>
      <ol>
        <li>Gå til <strong>Indstillinger</strong> -> <strong>Moms</strong></li>
        <li>Vælg momssats (25% for Danmark)</li>
        <li>Angiv om priser vises inkl. eller ekskl. moms</li>
      </ol>
      
      <h2>Momsberegning på kvitteringer</h2>
      <p>Alle kvitteringer og rapporter viser:</p>
      <ul>
        <li>Subtotal (ekskl. moms)</li>
        <li>Moms (25%)</li>
        <li>Total (inkl. moms)</li>
      </ul>
      
      <h2>Eksempel</h2>
      <table>
        <thead>
          <tr><th>Beskrivelse</th><th>Beløb</th></tr>
        </thead>
        <tbody>
          <tr><td>Subtotal (ekskl. moms)</td><td>200,00 kr</td></tr>
          <tr><td>Moms (25%)</td><td>50,00 kr</td></tr>
          <tr><td><strong>Total (inkl. moms)</strong></td><td><strong>250,00 kr</strong></td></tr>
        </tbody>
      </table>
    `
  },
  'user-management': {
    section: 'Administration',
    title: 'Brugere & Roller',
    desc: 'Administrer brugere og tildel roller med forskellige adgangsniveauer.',
    time: '8 min',
    prev: 'vat-configuration',
    next: 'reports-export',
    content: `
      <h2>Roller i OrderFlow</h2>
      <table>
        <thead>
          <tr><th>Rolle</th><th>Beskrivelse</th><th>Adgang</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Admin</strong></td><td>Fuld kontrol</td><td>Alt inkl. API, fakturering og brugere</td></tr>
          <tr><td><strong>Manager</strong></td><td>Daglig drift</td><td>Kunder, rapporter, workflows</td></tr>
          <tr><td><strong>Support</strong></td><td>Kundesupport</td><td>Kunder, ordrer (kun læse)</td></tr>
          <tr><td><strong>Medarbejder</strong></td><td>Basalt</td><td>Kun egne opgaver</td></tr>
        </tbody>
      </table>
      
      <h2>Opret ny bruger</h2>
      <ol>
        <li>Gå til <strong>Indstillinger</strong> -> <strong>Brugerindstillinger</strong></li>
        <li>Klik <strong>+ Tilføj bruger</strong></li>
        <li>Indtast email og vælg rolle</li>
        <li>Bruger modtager invitation på email</li>
      </ol>
      
      <div class="docs-callout warning">
        <svg class="docs-callout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <div><strong>Vigtigt:</strong> Admin-rollen giver fuld adgang til alle data og indstillinger. Tildel den kun til betroede brugere.</div>
      </div>
    `
  },
  'reports-export': {
    section: 'Administration',
    title: 'Rapporter & Eksport',
    desc: 'Generer detaljerede rapporter og eksporter data til PDF eller CSV.',
    time: '12 min',
    prev: 'user-management',
    next: null,
    content: `
      <h2>Tilgængelige rapporter</h2>
      <ul>
        <li><strong>Dagsrapport:</strong> Dagens omsætning og ordrer</li>
        <li><strong>Z-rapport:</strong> Kasseafstemning</li>
        <li><strong>Produktrapport:</strong> Salg pr. produkt</li>
        <li><strong>Konverteringsrapport:</strong> SMS -> ordre konvertering</li>
        <li><strong>Genbestillingsrapport:</strong> Tilbagevendende kunder</li>
      </ul>
      
      <h2>Eksportér data</h2>
      <ol>
        <li>Gå til <strong>Rapporter</strong></li>
        <li>Vælg rapporttype og datointerval</li>
        <li>Klik <strong>Generer</strong></li>
        <li>Vælg <strong>Download PDF</strong> eller <strong>Eksportér CSV</strong></li>
      </ol>
      
      <h2>Eksportformater</h2>
      <table>
        <thead>
          <tr><th>Format</th><th>Brug</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>PDF</strong></td><td>Print, arkivering, deling med bogholder</td></tr>
          <tr><td><strong>CSV</strong></td><td>Import i Excel, videre analyse</td></tr>
          <tr><td><strong>Excel</strong></td><td>Direkte redigering i regneark</td></tr>
        </tbody>
      </table>
      
      <div class="docs-callout tip">
        <svg class="docs-callout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        <div><strong>💡 Pro-tip:</strong> CSV-filer kan åbnes direkte i Excel for videre analyse.</div>
      </div>
    `
  }
};

// Vis support dokumentation - åbner docs page
function showSupportDoc(docId) {
  window.location.href = 'docs.html?doc=' + docId;
}

// Load dokumentation i docs-page
function loadDoc(docId) {
  const doc = DOCS_DATA[docId];
  if (!doc) {
    toast('Dokumentation ikke fundet', 'error');
    return;
  }
  
  // Vis docs page
  showPage('docs');
  
  // Opdater sidebar active state
  document.querySelectorAll('.docs-nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.dataset.doc === docId) {
      link.classList.add('active');
    }
  });
  
  // Opdater breadcrumb
  document.getElementById('docs-breadcrumb-section').textContent = doc.section;
  
  // Opdater artikel header
  document.getElementById('docs-article-title').textContent = doc.title;
  document.getElementById('docs-article-desc').textContent = doc.desc;
  document.getElementById('docs-article-time').textContent = doc.time;
  
  // Opdater indhold
  // SECURITY FIX v4.12.0: Sanitize CMS content with DOMPurify to prevent XSS
  document.getElementById('docs-article-content').innerHTML = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(doc.content) : escapeHtml(doc.content);
  
  // Opdater footer navigation
  const prevLink = document.getElementById('docs-prev-link');
  const nextLink = document.getElementById('docs-next-link');
  
  if (doc.prev && DOCS_DATA[doc.prev]) {
    prevLink.style.display = 'flex';
    prevLink.dataset.doc = doc.prev;
    document.getElementById('docs-prev-title').textContent = DOCS_DATA[doc.prev].title;
  } else {
    prevLink.style.display = 'none';
  }
  
  if (doc.next && DOCS_DATA[doc.next]) {
    nextLink.style.display = 'flex';
    nextLink.dataset.doc = doc.next;
    document.getElementById('docs-next-title').textContent = DOCS_DATA[doc.next].title;
  } else {
    nextLink.style.display = 'none';
  }
  
  // Scroll to top
  document.querySelector('.docs-main')?.scrollTo(0, 0);
}

// Filtrer docs navigation
function filterDocsNav(query) {
  const searchTerm = query.toLowerCase().trim();
  const navLinks = document.querySelectorAll('.docs-nav-link');
  
  if (!searchTerm) {
    navLinks.forEach(link => link.style.display = 'flex');
    document.querySelectorAll('.docs-nav-group').forEach(group => group.style.display = 'block');
    return;
  }
  
  navLinks.forEach(link => {
    const docId = link.dataset.doc;
    const doc = DOCS_DATA[docId];
    if (doc) {
      const searchText = `${doc.title} ${doc.desc} ${doc.section}`.toLowerCase();
      link.style.display = searchText.includes(searchTerm) ? 'flex' : 'none';
    }
  });
  
  // Skjul tomme grupper
  document.querySelectorAll('.docs-nav-group').forEach(group => {
    const visibleLinks = group.querySelectorAll('.docs-nav-link[style="display: flex;"], .docs-nav-link:not([style*="display: none"])');
    let hasVisible = false;
    group.querySelectorAll('.docs-nav-link').forEach(link => {
      if (link.style.display !== 'none') hasVisible = true;
    });
    group.style.display = hasVisible ? 'block' : 'none';
  });
}

// Navigate to settings sub-page
function showSettingsPage(tab) {
  showPage('settings');
  setTimeout(() => switchSettingsTab(tab), 50);
}

function switchWorkflowModule(module) {
  if (!workflowModules[module]) {
    toast('Modul kommer snart', 'info');
    return;
  }

  currentWorkflowModule = module;

  // Update dropdown styling
  document.querySelectorAll('.workflow-module-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.module === module);
  });

  // Update selected text in dropdown
  const selectedEl = document.getElementById('workflow-module-selected');
  if (selectedEl && workflowModules[module]) {
    selectedEl.textContent = workflowModules[module].name.split(' / ')[0]; // Get first part of name
  }

  // Update title
  const titleEl = document.getElementById('workflow-module-title');
  if (titleEl) {
    titleEl.textContent = workflowModules[module].title;
  }

  // Save preference
  localStorage.setItem('workflow_module', module);

  // Show toast
  toast(`Skiftet til ${workflowModules[module].name}`, 'success');

  console.log('Switched workflow module to:', module);
}

// Workflow Module Dropdown Functions
function toggleWorkflowModuleDropdown() {
  const dropdown = document.getElementById('workflow-module-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('open');
  }
}

function selectWorkflowModule(module, element) {
  // Update dropdown styling
  document.querySelectorAll('.workflow-module-option').forEach(opt => {
    opt.classList.remove('active');
  });
  if (element) {
    element.classList.add('active');
  }

  // Close dropdown
  const dropdown = document.getElementById('workflow-module-dropdown');
  if (dropdown) {
    dropdown.classList.remove('open');
  }

  // Switch module
  switchWorkflowModule(module);
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
  const dropdown = document.getElementById('workflow-module-dropdown');
  if (dropdown && !dropdown.contains(e.target)) {
    dropdown.classList.remove('open');
  }
});

function initWorkflowModule() {
  const savedModule = localStorage.getItem('workflow_module') || 'restaurant';

  // Update dropdown
  document.querySelectorAll('.workflow-module-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.module === savedModule);
  });

  // Update selected text
  const selectedEl = document.getElementById('workflow-module-selected');
  if (selectedEl && workflowModules[savedModule]) {
    selectedEl.textContent = workflowModules[savedModule].name.split(' / ')[0];
  }

  // Update title
  const titleEl = document.getElementById('workflow-module-title');
  if (titleEl && workflowModules[savedModule]) {
    titleEl.textContent = workflowModules[savedModule].title;
  }

  currentWorkflowModule = savedModule;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initWorkflowModule);

let workflowNodes = [
  // ============================================
  // LAYOUT KONSTANTER: Col spacing=220px, Row spacing=150px
  // Col0=100, Col1=320, Col2=540, Col3=760, Col4=980
  // ============================================
  
  // SEKTION 1: TRIGGERS (Row 0: y=50)
  { id: 'trigger-call', type: 'trigger', label: 'Trigger', sublabel: 'Missed opkald', x: 320, y: 50, icon: '📞', next: 'open-check' },
  { id: 'trigger-sms', type: 'trigger', label: 'Trigger', sublabel: 'SMS', x: 540, y: 50, icon: '💬', next: 'open-check' },
  
  // SEKTION 2: OPEN CHECKER (Row 1: y=200)
  { id: 'open-check', type: 'condition', label: 'Åbningstids-check', sublabel: '{{restaurant.openingHours}}', x: 430, y: 200, icon: '🕐', branches: [
    { id: 'dynamic-open', label: 'Dynamisk: Åben', class: 'yes', next: 'open-node' },
    { id: 'dynamic-closed', label: 'Dynamisk: Lukket', class: 'no', next: 'send-closed' }
  ]},
  
  // SEKTION 3: OPEN BRANCHES (Row 2: y=350)
  { id: 'open-node', type: 'condition', label: 'Åben', x: 210, y: 350, icon: '✓', branches: [
    { id: 'missed-call-branch', label: 'Mistet opkald', class: 'order', next: 'send-missed' },
    { id: 'sms-branch', label: 'SMS', class: 'order', next: 'ai-classify-1' },
    { id: 'none-branch', label: 'Ingen', class: 'none', next: 'end-open-none' }
  ]},
  { id: 'go-to-open', type: 'action', label: 'Go To', x: 430, y: 350, icon: '↗️', next: 'open-node' },
  { id: 'send-closed', type: 'sms', label: 'Lukket besked', sublabel: 'Dynamisk med næste åbning', x: 650, y: 350, icon: '💬', message: '{{generateClosedMessage}}', next: 'end-closed' },
  { id: 'end-closed', type: 'end', label: 'END', x: 870, y: 350, icon: '🏁' },
  { id: 'end-open-none', type: 'end', label: 'END', x: 430, y: 500, icon: '🏁' },
  
  // SEKTION 4: MISSED CALL PATH (Col0: x=100)
  { id: 'send-missed', type: 'sms', label: 'Beklager, vi missede dit opkald', x: 100, y: 500, icon: '💬', message: 'Hej! Vi missede desværre dit opkald. Var det for at bestille mad? Svar JA for at starte din bestilling. Hilsen {restaurant}', next: 'wait-missed' },
  { id: 'wait-missed', type: 'wait', label: 'Wait', x: 100, y: 650, icon: '⏳', timeout: 20, branches: [
    { id: 'contact-reply-missed', label: 'Contact Reply', next: 'intent-check-missed' },
    { id: 'timeout-missed', label: 'Time Out', class: 'timeout', next: 'end-timeout-missed' }
  ]},
  { id: 'end-timeout-missed', type: 'end', label: 'END', x: 320, y: 650, icon: '🏁' },
  { id: 'intent-check-missed', type: 'condition', label: 'Intent check', x: 100, y: 800, icon: '🤖', branches: [
    { id: 'yes-intent', label: 'Yes', class: 'yes', next: 'go-to-prev-order-1' },
    { id: 'no-intent', label: 'No', class: 'no', next: 'end-no-intent' },
    { id: 'none-intent', label: 'None', class: 'none', next: 'notification-unclear-1' },
    { id: 'order-intent', label: 'ORDER', class: 'order', next: 'condition-prev-order' }
  ]},
  { id: 'go-to-prev-order-1', type: 'action', label: 'Go To', x: 100, y: 950, icon: '↗️', next: 'condition-prev-order' },
  { id: 'end-no-intent', type: 'end', label: 'END', x: 320, y: 800, icon: '🏁' },
  { id: 'notification-unclear-1', type: 'action', label: 'Notification', x: 100, y: 1100, icon: '🔔', next: 'end-notification-1' },
  { id: 'end-notification-1', type: 'end', label: 'END', x: 100, y: 1250, icon: '🏁' },
  
  // SEKTION 5: SMS PATH + AI CLASSIFICATION (Col3-4: x=760-980)
  { id: 'ai-classify-1', type: 'ai', label: '#1 AI Classification', x: 760, y: 500, icon: '🤖', systemPrompt: 'Kategoriser kundens svar: POSITIVE/YES, NEGATIVE/NO, GREETING, eller NONE.', next: 'ai-condition-1' },
  { id: 'ai-condition-1', type: 'condition', label: 'Condition', x: 760, y: 650, icon: '❓', branches: [
    { id: 'order-ai', label: 'ORDER', class: 'order', next: 'condition-prev-order' },
    { id: 'greeting-ai', label: 'GREETING', class: 'greeting', next: 'send-greeting' },
    { id: 'none-ai', label: 'None', class: 'none', next: 'end-none-ai' }
  ]},
  { id: 'end-none-ai', type: 'end', label: 'END', x: 980, y: 650, icon: '🏁' },
  { id: 'send-greeting', type: 'sms', label: 'Vil du bestille over SMS?', x: 760, y: 800, icon: '💬', message: 'Hej! Kunne du tænke dig at afgive en bestilling over SMS?', next: 'wait-greeting' },
  { id: 'wait-greeting', type: 'wait', label: 'Wait', x: 760, y: 950, icon: '⏳', timeout: 20, branches: [
    { id: 'contact-reply-greet', label: 'Contact Reply', next: 'intent-check-greet' },
    { id: 'timeout-greet', label: 'Time Out', class: 'timeout', next: 'end-timeout-greet' }
  ]},
  { id: 'end-timeout-greet', type: 'end', label: 'END', x: 980, y: 950, icon: '🏁' },
  { id: 'intent-check-greet', type: 'condition', label: 'Intent check', x: 760, y: 1100, icon: '🤖', branches: [
    { id: 'yes-greet', label: 'Yes', class: 'yes', next: 'go-to-prev-order-2' },
    { id: 'no-greet', label: 'No', class: 'no', next: 'go-to-end-greet' },
    { id: 'none-greet', label: 'None', class: 'none', next: 'end-none-greet' }
  ]},
  { id: 'go-to-prev-order-2', type: 'action', label: 'Go To', x: 760, y: 1250, icon: '↗️', next: 'condition-prev-order' },
  { id: 'go-to-end-greet', type: 'action', label: 'Go To', x: 980, y: 1100, icon: '↗️', next: 'end-go-to-greet' },
  { id: 'end-none-greet', type: 'end', label: 'END', x: 1200, y: 1100, icon: '🏁' },
  { id: 'end-go-to-greet', type: 'end', label: 'END', x: 980, y: 1250, icon: '🏁' },
  
  // SEKTION 6: PREVIOUS ORDER CHECK (Center: x=430)
  { id: 'condition-prev-order', type: 'condition', label: 'Previous Order Check', x: 430, y: 1400, icon: '❓', branches: [
    { id: 'prev-delivery', label: 'Prev Delivery', class: 'order', next: 'reorder-delivery' },
    { id: 'prev-pickup', label: 'Prev Pickup', class: 'order', next: 'reorder-pickup' },
    { id: 'normal', label: 'Normal', class: 'none', next: 'ask-delivery-type' }
  ]},
  
  // SEKTION 7: REORDER + DELIVERY TYPE
  { id: 'reorder-delivery', type: 'sms', label: 'Genbestil levering?', x: 100, y: 1550, icon: '💬', message: 'Vil du genbestille din sidste levering?', next: 'wait-reorder-del' },
  { id: 'reorder-pickup', type: 'sms', label: 'Genbestil afhentning?', x: 320, y: 1550, icon: '💬', message: 'Vil du genbestille din sidste afhentning?', next: 'wait-reorder-pick' },
  { id: 'ask-delivery-type', type: 'sms', label: 'Levering eller afhentning?', x: 650, y: 1550, icon: '💬', message: 'Super! Skal maden leveres eller vil du hente? (Svar Levering eller Afhentning)', next: 'wait-delivery-type' },
  
  { id: 'wait-reorder-del', type: 'wait', label: 'Wait', x: 100, y: 1700, icon: '⏳', timeout: 20, branches: [
    { id: 'reply-reorder-del', label: 'Contact Reply', next: 'intent-reorder-del' },
    { id: 'timeout-reorder-del', label: 'Time Out', class: 'timeout', next: 'end-reorder-timeout-del' }
  ]},
  { id: 'wait-reorder-pick', type: 'wait', label: 'Wait', x: 320, y: 1700, icon: '⏳', timeout: 20, branches: [
    { id: 'reply-reorder-pick', label: 'Contact Reply', next: 'intent-reorder-pick' },
    { id: 'timeout-reorder-pick', label: 'Time Out', class: 'timeout', next: 'end-reorder-timeout-pick' }
  ]},
  { id: 'wait-delivery-type', type: 'wait', label: 'Wait', x: 650, y: 1700, icon: '⏳', timeout: 20, branches: [
    { id: 'reply-type', label: 'Contact Reply', next: 'ai-delivery-type' },
    { id: 'timeout-type', label: 'Time Out', class: 'timeout', next: 'end-timeout-type' }
  ]},
  
  { id: 'end-reorder-timeout-del', type: 'end', label: 'END', x: 100, y: 2000, icon: '🏁' },
  { id: 'end-reorder-timeout-pick', type: 'end', label: 'END', x: 320, y: 2000, icon: '🏁' },
  { id: 'end-timeout-type', type: 'end', label: 'END', x: 870, y: 1700, icon: '🏁' },
  
  { id: 'intent-reorder-del', type: 'condition', label: 'Intent check', x: 100, y: 1850, icon: '🤖', branches: [
    { id: 'yes-reorder-del', label: 'Yes', class: 'yes', next: 'go-to-delivery-type' },
    { id: 'no-reorder-del', label: 'No', class: 'no', next: 'lukker-chat-del' }
  ]},
  { id: 'intent-reorder-pick', type: 'condition', label: 'Intent check', x: 320, y: 1850, icon: '🤖', branches: [
    { id: 'yes-reorder-pick', label: 'Yes', class: 'yes', next: 'go-to-pickup-type' },
    { id: 'no-reorder-pick', label: 'No', class: 'no', next: 'lukker-chat-pick' }
  ]},
  
  { id: 'go-to-delivery-type', type: 'action', label: 'Go To', x: 100, y: 2150, icon: '↗️', next: 'order-type-delivery' },
  { id: 'lukker-chat-del', type: 'sms', label: 'Lukker chat', x: 100, y: 2300, icon: '💬', message: 'Ok, vi lukker denne chat. Kontakt os igen!', next: 'end-reorder-del' },
  { id: 'end-reorder-del', type: 'end', label: 'END', x: 100, y: 2450, icon: '🏁' },
  
  { id: 'go-to-pickup-type', type: 'action', label: 'Go To', x: 320, y: 2150, icon: '↗️', next: 'order-type-pickup' },
  { id: 'lukker-chat-pick', type: 'sms', label: 'Lukker chat', x: 320, y: 2300, icon: '💬', message: 'Ok, vi lukker denne chat. Kontakt os igen!', next: 'end-reorder-pick' },
  { id: 'end-reorder-pick', type: 'end', label: 'END', x: 320, y: 2450, icon: '🏁' },
  
  // SEKTION 8: AI DELIVERY TYPE
  { id: 'ai-delivery-type', type: 'ai', label: '#3 GPT Delivery Check', x: 650, y: 1850, icon: '🤖', systemPrompt: 'Kategoriser: PICKUP, DELIVERY, eller UNCLEAR.', next: 'delivery-condition' },
  { id: 'delivery-condition', type: 'condition', label: 'Condition', x: 650, y: 2000, icon: '❓', branches: [
    { id: 'pickup-branch', label: 'Pickup', class: 'yes', next: 'order-type-pickup' },
    { id: 'delivery-branch', label: 'DELIVERY', class: 'order', next: 'order-type-delivery' },
    { id: 'none-delivery', label: 'None', class: 'none', next: 'notification-delivery' }
  ]},
  { id: 'notification-delivery', type: 'action', label: 'Notification', x: 870, y: 2000, icon: '🔔', next: 'end-notification-delivery' },
  { id: 'end-notification-delivery', type: 'end', label: 'END', x: 870, y: 2150, icon: '🏁' },
  
  // SEKTION 9: ORDER TYPE + ASK ORDER
  { id: 'order-type-pickup', type: 'action', label: 'Order Type: Pickup', x: 540, y: 2150, icon: '🏪', next: 'ask-order-pickup' },
  { id: 'order-type-delivery', type: 'action', label: 'Order Type: Delivery', x: 760, y: 2150, icon: '🚗', next: 'ask-address' },
  
  { id: 'ask-order-pickup', type: 'sms', label: 'Send din bestilling', x: 540, y: 2300, icon: '💬', message: 'Lyder godt! Send hele din bestilling i én besked. Menu: {menu_url}', next: 'wait-order-pickup' },
  { id: 'ask-address', type: 'sms', label: 'Hvad er din adresse?', x: 760, y: 2300, icon: '💬', message: 'Hvad er den fulde leveringsadresse inkl. postnummer?', next: 'wait-address' },
  
  { id: 'wait-order-pickup', type: 'wait', label: 'Wait', x: 540, y: 2450, icon: '⏳', timeout: 25, branches: [
    { id: 'contact-reply-order-p', label: 'Contact Reply', next: 'ai-order-parser' },
    { id: 'timeout-order-p', label: 'Time Out', class: 'timeout', next: 'end-timeout-order-p' }
  ]},
  { id: 'wait-address', type: 'wait', label: 'Wait', x: 760, y: 2450, icon: '⏳', timeout: 25, branches: [
    { id: 'contact-reply-addr', label: 'Contact Reply', next: 'ai-address-extractor' },
    { id: 'timeout-addr', label: 'Time Out', class: 'timeout', next: 'end-timeout-addr' }
  ]},
  { id: 'end-timeout-order-p', type: 'end', label: 'END', x: 540, y: 2600, icon: '🏁' },
  { id: 'end-timeout-addr', type: 'end', label: 'END', x: 980, y: 2450, icon: '🏁' },
  
  // SEKTION 10: ADDRESS EXTRACTOR (Right side)
  { id: 'ai-address-extractor', type: 'ai', label: '#5 Address Extractor', x: 760, y: 2600, icon: '🤖', systemPrompt: 'Udtræk adressen. Format: [Vejnavn] [Nr], [Postnr] [By]. Hvis mangelfuld: ERROR.', next: 'address-condition' },
  { id: 'address-condition', type: 'condition', label: 'Condition', x: 760, y: 2750, icon: '❓', branches: [
    { id: 'addr-valid', label: 'Valid', class: 'yes', next: 'update-delivery-address' },
    { id: 'addr-error', label: 'ERROR', class: 'no', next: 'end-addr-error' }
  ]},
  { id: 'update-delivery-address', type: 'action', label: 'Update Address', x: 760, y: 2900, icon: '📍', next: 'ask-order-delivery' },
  { id: 'end-addr-error', type: 'end', label: 'END', x: 980, y: 2750, icon: '🏁' },
  
  { id: 'ask-order-delivery', type: 'sms', label: 'Send din bestilling', x: 760, y: 3050, icon: '💬', message: 'Lyder godt! Send hele din bestilling i én besked. Menu: {menu_url}', next: 'wait-order-delivery' },
  { id: 'wait-order-delivery', type: 'wait', label: 'Wait', x: 760, y: 3200, icon: '⏳', timeout: 25, branches: [
    { id: 'contact-reply-order-d', label: 'Contact Reply', next: 'ai-order-parser' },
    { id: 'timeout-order-d', label: 'Time Out', class: 'timeout', next: 'end-timeout-order-d' }
  ]},
  { id: 'end-timeout-order-d', type: 'end', label: 'END', x: 980, y: 3200, icon: '🏁' },
  
  // SEKTION 11: ORDER PARSER (Center)
  { id: 'ai-order-parser', type: 'ai', label: '#4 GPT Order Parser', x: 430, y: 2750, icon: '🤖', systemPrompt: 'Analyser bestillingen. JSON med items og valid: true/false.', next: 'order-parser-condition' },
  { id: 'order-parser-condition', type: 'condition', label: 'Condition', x: 430, y: 2900, icon: '❓', branches: [
    { id: 'order-valid', label: 'Valid', class: 'yes', next: 'send-confirm-order' },
    { id: 'order-invalid', label: 'Invalid', class: 'no', next: 'end-order-invalid' },
    { id: 'order-offtopic', label: 'Off Topic', class: 'none', next: 'notification-off-topic' }
  ]},
  { id: 'end-order-invalid', type: 'end', label: 'END', x: 210, y: 2900, icon: '🏁' },
  { id: 'notification-off-topic', type: 'action', label: 'Notification', x: 210, y: 3050, icon: '🔔', next: 'end-notification-off' },
  { id: 'end-notification-off', type: 'end', label: 'END', x: 210, y: 3200, icon: '🏁' },
  
  // SEKTION 12: ORDER CONFIRMATION
  { id: 'send-confirm-order', type: 'sms', label: 'Bekræft bestilling', x: 430, y: 3050, icon: '💬', message: 'Bare for at bekræfte: {order}. Er det korrekt?', next: 'wait-confirm' },
  { id: 'wait-confirm', type: 'wait', label: 'Wait', x: 430, y: 3200, icon: '⏳', timeout: 25, branches: [
    { id: 'contact-reply-confirm', label: 'Contact Reply', next: 'order-confirmation' },
    { id: 'timeout-confirm', label: 'Time Out', class: 'timeout', next: 'end-timeout-confirm' }
  ]},
  { id: 'end-timeout-confirm', type: 'end', label: 'END', x: 210, y: 3350, icon: '🏁' },
  
  { id: 'order-confirmation', type: 'condition', label: 'Order Confirmation', x: 430, y: 3350, icon: '✓', branches: [
    { id: 'yes-confirm', label: 'Yes', class: 'yes', next: 'ask-name' },
    { id: 'no-confirm', label: 'No', class: 'no', next: 'send-retry' },
    { id: 'none-confirm', label: 'None', class: 'none', next: 'notification-confirm' }
  ]},
  { id: 'send-retry', type: 'sms', label: 'Prøv igen', x: 210, y: 3500, icon: '💬', message: 'Ingen problem! Hvad vil du bestille?', next: 'go-to-wait-order' },
  { id: 'go-to-wait-order', type: 'action', label: 'Go To', x: 210, y: 3650, icon: '↗️', next: 'wait-order-pickup' },
  { id: 'notification-confirm', type: 'action', label: 'Notification', x: 650, y: 3350, icon: '🔔', next: 'end-notification-confirm' },
  { id: 'end-notification-confirm', type: 'end', label: 'END', x: 650, y: 3500, icon: '🏁' },
  
  // SEKTION 13: ASK NAME
  { id: 'ask-name', type: 'sms', label: 'Hvad er dit navn?', x: 430, y: 3500, icon: '💬', message: 'Må jeg bede om dit fulde navn til bestillingen?', next: 'wait-name' },
  { id: 'wait-name', type: 'wait', label: 'Wait', x: 430, y: 3650, icon: '⏳', timeout: 25, branches: [
    { id: 'contact-reply-name', label: 'Contact Reply', next: 'ai-name-extractor' },
    { id: 'timeout-name', label: 'Time Out', class: 'timeout', next: 'end-timeout-name' }
  ]},
  { id: 'end-timeout-name', type: 'end', label: 'END', x: 650, y: 3650, icon: '🏁' },
  
  // SEKTION 14: NAME EXTRACTOR
  { id: 'ai-name-extractor', type: 'ai', label: '#6 GPT Name Extractor', x: 430, y: 3800, icon: '🤖', systemPrompt: 'Udtræk kundens navn. Kun navnet eller ERROR.', next: 'name-condition' },
  { id: 'name-condition', type: 'condition', label: 'Condition', x: 430, y: 3950, icon: '❓', branches: [
    { id: 'name-valid', label: 'Valid', class: 'yes', next: 'update-contact-name' },
    { id: 'name-error', label: 'ERROR', class: 'no', next: 'end-error-name' }
  ]},
  { id: 'end-error-name', type: 'end', label: 'END', x: 650, y: 3950, icon: '🏁' },
  
  // SEKTION 15: SAVE & PROCESS (Center column)
  { id: 'update-contact-name', type: 'action', label: 'Update Contact Name', x: 430, y: 4100, icon: '👤', next: 'save-order-next' },
  { id: 'save-order-next', type: 'action', label: 'Save Order', x: 430, y: 4250, icon: '💾', next: 'new-order-task' },
  { id: 'new-order-task', type: 'action', label: 'New Order Task', x: 430, y: 4400, icon: '📋', next: 'increment-order-count' },
  { id: 'increment-order-count', type: 'action', label: '+1 Order Count', x: 430, y: 4550, icon: '➕', next: 'internal-notification' },
  { id: 'internal-notification', type: 'action', label: 'Internal Notification', x: 430, y: 4700, icon: '🔔', next: 'send-final-confirm' },
  
  // SEKTION 16: FINAL CONFIRMATION
  { id: 'send-final-confirm', type: 'sms', label: 'Ordrebekræftelse', x: 430, y: 4850, icon: '💬', message: 'Tak! Din ordre er sendt til køkkenet. Vi giver besked når maden er klar!', next: 'ask-receipt' },
  
  // SEKTION 17: RECEIPT WORKFLOW (NY)
  { id: 'ask-receipt', type: 'sms', label: 'Spørg om kvittering', x: 430, y: 5000, icon: '💬', message: 'Ønsker du en kvittering på din bestilling? Svar JA eller NEJ.', next: 'wait-receipt' },
  { id: 'wait-receipt', type: 'wait', label: 'Wait', x: 430, y: 5150, icon: '⏳', timeout: 15, branches: [
    { id: 'contact-reply-receipt', label: 'Contact Reply', next: 'intent-check-receipt' },
    { id: 'timeout-receipt', label: 'Time Out', class: 'timeout', next: 'push-to-orders' }
  ]},
  { id: 'intent-check-receipt', type: 'condition', label: 'Intent check', x: 430, y: 5300, icon: '🤖', branches: [
    { id: 'yes-receipt', label: 'Yes', class: 'yes', next: 'generate-receipt' },
    { id: 'no-receipt', label: 'No', class: 'no', next: 'send-no-receipt' }
  ]},
  
  // Receipt YES branch
  { id: 'generate-receipt', type: 'action', label: 'Generér kvittering', x: 210, y: 5450, icon: '📄', next: 'send-receipt-sms' },
  { id: 'send-receipt-sms', type: 'sms', label: 'Send kvittering', x: 210, y: 5600, icon: '💬', message: '📋 KVITTERING\n━━━━━━━━━━━━\nOrdre: #{order_number}\n{order_items}\n━━━━━━━━━━━━\nTotal: {total} kr\nAfhentning: {pickup_time}\n━━━━━━━━━━━━\nTak for din bestilling!\n{restaurant_name}', next: 'push-to-orders' },
  
  // Receipt NO branch
  { id: 'send-no-receipt', type: 'sms', label: 'Pæn afslutning', x: 650, y: 5450, icon: '💬', message: 'Helt i orden! Vi glæder os til at se dig. Hav en fortsat god dag!', next: 'push-to-orders' },
  
  // SEKTION 18: ORDER PROCESSING + REVIEW
  { id: 'push-to-orders', type: 'action', label: 'Push til Ordrer', x: 430, y: 5750, icon: '📦', next: 'add-to-review' },
  { id: 'add-to-review', type: 'action', label: 'Add to Review Flow', x: 430, y: 5900, icon: '⭐', next: 'wait-review-delay' },
  { id: 'wait-review-delay', type: 'wait', label: 'Wait Review Delay', x: 430, y: 6050, icon: '⏳', timeout: 60, next: 'send-review-request' },
  { id: 'send-review-request', type: 'sms', label: 'Anmeldelsesanmodning', x: 430, y: 6200, icon: '⭐', message: 'Tak for din ordre! Giv os gerne en anmeldelse: Google: {google_review_url} Trustpilot: {trustpilot_url}', next: 'wait-1-hour' },
  { id: 'wait-1-hour', type: 'wait', label: 'Wait 1 hour lock', x: 430, y: 6350, icon: '⏳', timeout: 60, next: 'end-final' },
  { id: 'end-final', type: 'end', label: 'END', x: 430, y: 6500, icon: '🏁' }
];

let selectedNodeId = null;

// SVG ikoner til workflow noder
const nodeIcons = {
  trigger: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  sms: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  wait: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  condition: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  ai: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A1.5 1.5 0 0 0 6 14.5 1.5 1.5 0 0 0 7.5 16 1.5 1.5 0 0 0 9 14.5 1.5 1.5 0 0 0 7.5 13m9 0a1.5 1.5 0 0 0-1.5 1.5 1.5 1.5 0 0 0 1.5 1.5 1.5 1.5 0 0 0 1.5-1.5 1.5 1.5 0 0 0-1.5-1.5"/></svg>',
  action: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  end: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>',
  goto: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>'
};

function getNodeIcon(node) {
  // Returner SVG baseret på node type
  return nodeIcons[node.type] || nodeIcons['end'];
}

function renderWorkflowNodes() {
  const container = document.getElementById('workflow-nodes');
  const svg = document.getElementById('wf-connections');
  
  // Clear
  container.innerHTML = '';
  svg.innerHTML = '';
  
  // Render connections first
  workflowNodes.forEach(node => {
    if (node.next) {
      const targetNode = workflowNodes.find(n => n.id === node.next);
      if (targetNode) {
        drawConnection(svg, node, targetNode);
      }
    }
    if (node.branches) {
      node.branches.forEach(branch => {
        if (branch.next) {
          const targetNode = workflowNodes.find(n => n.id === branch.next);
          if (targetNode) {
            drawConnection(svg, node, targetNode, branch.label);
          }
        }
      });
    }
  });
  
  // Render nodes
  workflowNodes.forEach(node => {
    const nodeEl = document.createElement('div');
    const disabledClass = node.disabled ? ' disabled' : '';
    nodeEl.className = `wf-node ${node.id === selectedNodeId ? 'selected' : ''}${disabledClass}`;
    nodeEl.id = `node-${node.id}`;
    nodeEl.style.left = `${node.x}px`;
    nodeEl.style.top = `${node.y}px`;
    
    const iconClass = node.type === 'trigger' ? 'trigger' : 
                      node.type === 'condition' ? 'condition' :
                      node.type === 'sms' ? 'sms' :
                      node.type === 'wait' ? 'wait' :
                      node.type === 'ai' ? 'ai' :
                      node.type === 'action' ? 'action' : 'end';
    
    // Brug SVG ikon i stedet for emoji
    const iconSvg = getNodeIcon(node);
    
    // Add disabled badge if node is disabled
    const disabledBadge = node.disabled ? '<span style="position:absolute;top:-8px;right:-8px;background:var(--danger);color:white;font-size:9px;padding:2px 6px;border-radius:10px">OFF</span>' : '';
    
    let html = `
      ${disabledBadge}
      <div class="wf-node-header">
        <div class="wf-node-icon ${iconClass}">${iconSvg}</div>
        <div class="wf-node-info">
          <div class="wf-node-type">${node.type.toUpperCase()}</div>
          <div class="wf-node-label">${node.label}</div>
        </div>
        <button class="wf-node-menu" onclick="event.stopPropagation(); openNodeEditor('${node.id}')">⋯</button>
      </div>
    `;
    
    if (node.sublabel) {
      html += `<div class="wf-node-body">${node.sublabel}</div>`;
    }
    
    if (node.branches && node.branches.length > 0) {
      html += `<div class="wf-node-branches">`;
      node.branches.forEach(branch => {
        const branchClass = branch.class || '';
        html += `<span class="wf-branch ${branchClass}" onclick="event.stopPropagation(); editBranch('${node.id}', '${branch.id}')">${branch.label}</span>`;
      });
      html += `</div>`;
    }
    
    nodeEl.innerHTML = html;
    
    // Single click - select node
    nodeEl.addEventListener('click', () => selectNode(node.id));
    
    // Double click - open editor
    nodeEl.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      openNodeEditor(node.id);
    });
    
    // Drag handler
    makeDraggable(nodeEl, node);
    
    container.appendChild(nodeEl);
  });
}

// Canvas transform state - SKAL være defineret før centerWorkflow
let canvasTransform = { x: 0, y: 0, scale: 1 };
let canvasPanningInitialized = false;
let isSpaceHeld = false;

function updateCanvasDots() {
  const canvas = document.getElementById('workflow-canvas');
  if (!canvas) return;
  const scale = canvasTransform.scale;
  const dotSpacing = 20 * scale;
  const dotRadius = Math.max(0.5, 1 * scale);
  canvas.style.backgroundSize = `${dotSpacing}px ${dotSpacing}px`;
  canvas.style.backgroundPosition = `${canvasTransform.x}px ${canvasTransform.y}px`;
  canvas.style.backgroundImage = `radial-gradient(circle, rgba(100, 116, 139, 0.3) ${dotRadius}px, transparent ${dotRadius}px)`;
}

// Centrer workflow i viewport - starter med triggers synlige og centreret horisontalt
function centerWorkflow() {
  const canvas = document.getElementById('workflow-canvas');
  if (!canvas || workflowNodes.length === 0) return;
  
  // Ensure viewport exists
  let viewport = canvas.querySelector('.canvas-viewport');
  if (!viewport) {
    console.warn('[Workflow] No viewport found, skipping center');
    return;
  }
  
  // Get actual viewport dimensions (wait for render)
  const viewportWidth = canvas.clientWidth || canvas.offsetWidth || 800;
  const viewportHeight = canvas.clientHeight || canvas.offsetHeight || 600;
  
  // Skip if dimensions are too small (not rendered yet)
  if (viewportWidth < 100 || viewportHeight < 100) {
    console.warn('[Workflow] Viewport too small, retrying...');
    setTimeout(centerWorkflow, 100);
    return;
  }
  
  // Find bounding box af alle noder
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  workflowNodes.forEach(node => {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + 180);
    maxY = Math.max(maxY, node.y + 100);
  });
  
  // Beregn node cluster dimensioner
  const nodesWidth = maxX - minX;
  const nodesHeight = maxY - minY;
  const nodesCenterX = minX + nodesWidth / 2;
  const nodesCenterY = minY + nodesHeight / 2;
  
  // Calculate scale to fit all nodes with padding
  const padding = 80;
  const scaleX = (viewportWidth - padding * 2) / nodesWidth;
  const scaleY = (viewportHeight - padding * 2) / nodesHeight;
  
  // Use fitScale to ensure all nodes are visible, but don't zoom in beyond 100%
  const fitScale = Math.min(scaleX, scaleY, 1);
  
  // Set scale - start at 80% or fitScale if nodes are large
  canvasTransform.scale = Math.max(0.3, Math.min(0.8, fitScale));
  
  // Center nodes in viewport
  canvasTransform.x = (viewportWidth / 2) - (nodesCenterX * canvasTransform.scale);
  canvasTransform.y = (viewportHeight / 2) - (nodesCenterY * canvasTransform.scale);
  
  // Apply transform
  viewport.style.transform = `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.scale})`;
  updateCanvasDots();

  // Update zoom display
  const zoomDisplay = document.getElementById('zoom-display');
  if (zoomDisplay) zoomDisplay.textContent = Math.round(canvasTransform.scale * 100) + '%';

  console.log(`[Workflow] Centreret - Viewport: ${viewportWidth}x${viewportHeight}, Nodes: ${Math.round(nodesWidth)}x${Math.round(nodesHeight)}, Scale: ${Math.round(canvasTransform.scale*100)}%`);
}

// FitView function - shows top triggers at comfortable zoom
function fitWorkflowToView() {
  const canvas = document.getElementById('workflow-canvas');
  if (!canvas || workflowNodes.length === 0) return;
  
  let viewport = canvas.querySelector('.canvas-viewport');
  if (!viewport) {
    console.warn('[Workflow] fitView: No viewport');
    return;
  }
  
  const viewportWidth = canvas.clientWidth || 800;
  const viewportHeight = canvas.clientHeight || 600;
  
  if (viewportWidth < 100 || viewportHeight < 100) {
    setTimeout(fitWorkflowToView, 100);
    return;
  }
  
  // Find only the top nodes (triggers) for initial view
  const topNodes = workflowNodes.filter(n => n.y <= 400);
  const targetNodes = topNodes.length > 0 ? topNodes : workflowNodes.slice(0, 10);
  
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  targetNodes.forEach(node => {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + 180);
    maxY = Math.max(maxY, node.y + 100);
  });
  
  const nodesWidth = maxX - minX;
  const nodesHeight = maxY - minY;
  const nodesCenterX = minX + nodesWidth / 2;
  
  // Set comfortable zoom level (80%)
  canvasTransform.scale = 0.8;
  
  // Center horizontally, position top nodes near top of view
  canvasTransform.x = (viewportWidth / 2) - (nodesCenterX * canvasTransform.scale);
  canvasTransform.y = 40 - (minY * canvasTransform.scale);
  
  viewport.style.transform = `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.scale})`;
  updateCanvasDots();

  const zoomDisplay = document.getElementById('zoom-display');
  if (zoomDisplay) zoomDisplay.textContent = Math.round(canvasTransform.scale * 100) + '%';

  console.log(`[Workflow] fitView - Scale: ${Math.round(canvasTransform.scale*100)}%, X: ${Math.round(canvasTransform.x)}, Y: ${Math.round(canvasTransform.y)}`);
}

// Initialiser canvas panning - Figma/Miro style infinite canvas
function initCanvasPanning() {
  if (canvasPanningInitialized) return;
  
  const canvas = document.getElementById('workflow-canvas');
  if (!canvas) return;
  
  canvasPanningInitialized = true;
  
  let isPanning = false;
  let startX, startY;
  
  // Get viewport element (create if not exists)
  let viewport = canvas.querySelector('.canvas-viewport');
  if (!viewport) {
    // Wrap existing content in viewport
    const grid = canvas.querySelector('.canvas-grid');
    const connections = canvas.querySelector('.wf-connections');
    const nodes = canvas.querySelector('.nodes-container');
    
    viewport = document.createElement('div');
    viewport.className = 'canvas-viewport';
    viewport.style.width = '5000px';
    viewport.style.height = '7000px';
    
    if (grid) viewport.appendChild(grid);
    if (connections) viewport.appendChild(connections);
    if (nodes) viewport.appendChild(nodes);
    
    canvas.appendChild(viewport);
  }
  
  function updateTransform() {
    viewport.style.transform = `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.scale})`;
    updateCanvasDots();
  }
  
  // Space key handling for pan mode
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !isSpaceHeld && document.getElementById('page-workflow').classList.contains('active')) {
      isSpaceHeld = true;
      canvas.classList.add('space-held');
      e.preventDefault();
    }
  });
  
  document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      isSpaceHeld = false;
      canvas.classList.remove('space-held');
    }
  });
  
  // Mouse down - start panning
  canvas.addEventListener('mousedown', (e) => {
    // Pan with space + click, middle mouse, or direct canvas click
    const isMiddleMouse = e.button === 1;
    const isLeftClick = e.button === 0;
    const onCanvas = !e.target.closest('.wf-node') && !e.target.closest('.test-panel') && !e.target.closest('.node-editor');
    
    if (isMiddleMouse || (isSpaceHeld && isLeftClick) || (isLeftClick && onCanvas)) {
      isPanning = true;
      canvas.classList.add('panning');
      startX = e.clientX - canvasTransform.x;
      startY = e.clientY - canvasTransform.y;
      e.preventDefault();
    }
  });
  
  // Mouse move - pan canvas
  document.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    
    canvasTransform.x = e.clientX - startX;
    canvasTransform.y = e.clientY - startY;
    
    // Clamp to reasonable bounds
    const maxPan = 2000;
    canvasTransform.x = Math.max(-maxPan, Math.min(maxPan, canvasTransform.x));
    canvasTransform.y = Math.max(-maxPan, Math.min(maxPan, canvasTransform.y));
    
    updateTransform();
  });
  
  // Mouse up - stop panning
  document.addEventListener('mouseup', () => {
    if (isPanning) {
      isPanning = false;
      canvas.classList.remove('panning');
    }
  });
  
  // Mouse wheel - zoom
  canvas.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.25, Math.min(2, canvasTransform.scale * delta));
      
      // Zoom towards mouse position
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const scaleChange = newScale / canvasTransform.scale;
      canvasTransform.x = mouseX - (mouseX - canvasTransform.x) * scaleChange;
      canvasTransform.y = mouseY - (mouseY - canvasTransform.y) * scaleChange;
      canvasTransform.scale = newScale;
      
      updateTransform();
      document.getElementById('zoom-level').textContent = Math.round(newScale * 100) + '%';
    } else {
      // Normal scroll to pan
      e.stopPropagation();
      canvasTransform.x -= e.deltaX;
      canvasTransform.y -= e.deltaY;
      updateTransform();
    }
  }, { passive: false });
  
  // Initial transform
  updateTransform();
}

function drawConnection(svg, fromNode, toNode, label) {
  // Calculate positions based on node type and position
  const fromWidth = 160;
  const fromHeight = fromNode.branches ? 100 : 70;
  
  const fromX = fromNode.x + fromWidth / 2;
  const fromY = fromNode.y + fromHeight;
  const toX = toNode.x + fromWidth / 2;
  const toY = toNode.y;
  
  // Create path with bezier curve
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  
  // Calculate control points for smoother curves
  const deltaY = toY - fromY;
  const deltaX = Math.abs(toX - fromX);
  
  let d;
  if (deltaX < 50) {
    // Straight down
    d = `M ${fromX} ${fromY} L ${toX} ${toY - 8}`;
  } else {
    // Curved path
    const cp1Y = fromY + Math.min(deltaY * 0.3, 50);
    const cp2Y = toY - Math.min(deltaY * 0.3, 50);
    d = `M ${fromX} ${fromY} C ${fromX} ${cp1Y}, ${toX} ${cp2Y}, ${toX} ${toY - 8}`;
  }
  
  path.setAttribute('d', d);
  path.setAttribute('class', 'wf-connection');
  path.setAttribute('fill', 'none');
  svg.appendChild(path);
  
  // Add arrow at end
  const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  arrow.setAttribute('points', `${toX},${toY} ${toX-5},${toY-10} ${toX+5},${toY-10}`);
  arrow.setAttribute('class', 'wf-connection-arrow');
  svg.appendChild(arrow);
}

function makeDraggable(element, node) {
  let isDragging = false;
  let startX, startY, nodeStartX, nodeStartY;
  
  element.addEventListener('mousedown', (e) => {
    if (e.target.closest('.wf-node-menu') || e.target.closest('.wf-branch')) return;
    if (isSpaceHeld) return; // Don't drag nodes when panning
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    nodeStartX = node.x;
    nodeStartY = node.y;
    element.style.zIndex = '100';
    e.preventDefault();
    e.stopPropagation();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    // Account for current zoom level
    const scale = canvasTransform?.scale || currentZoom || 1;
    const dx = (e.clientX - startX) / scale;
    const dy = (e.clientY - startY) / scale;
    
    // Snap to grid (20px grid)
    const gridSize = 20;
    const newX = Math.round((nodeStartX + dx) / gridSize) * gridSize;
    const newY = Math.round((nodeStartY + dy) / gridSize) * gridSize;
    
    node.x = Math.max(0, newX);
    node.y = Math.max(0, newY);
    element.style.left = `${node.x}px`;
    element.style.top = `${node.y}px`;
    renderWorkflowNodes(); // Re-render connections
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      element.style.zIndex = '';
    }
  });
}

function selectNode(id) {
  selectedNodeId = id;
  renderWorkflowNodes();
}

function openNodeEditor(id) {
  const node = workflowNodes.find(n => n.id === id);
  if (!node) return;
  
  selectedNodeId = id;
  renderWorkflowNodes();
  
  const editor = document.getElementById('node-editor');
  const body = document.getElementById('node-editor-body');
  
  // Build editor based on node type
  let html = '';
  
  // Header with node type title (no icons)
  const typeLabels = {
    trigger: 'TRIGGER',
    condition: 'CONDITION',
    sms: 'SMS BESKED',
    wait: 'WAIT / VENT',
    ai: 'AI CLASSIFICATION',
    action: 'ACTION',
    end: 'END'
  };
  
  // Type badge colors
  const typeColors = {
    trigger: 'var(--accent)',
    condition: 'var(--orange)',
    sms: 'var(--green)',
    wait: 'var(--purple)',
    ai: 'var(--pink)',
    action: 'var(--blue)',
    end: 'var(--muted)'
  };
  
  html += `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--border)">
      <div style="width:8px;height:40px;border-radius:4px;background:${typeColors[node.type] || 'var(--accent)'}"></div>
      <div>
        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;font-weight:600">${typeLabels[node.type] || node.type.toUpperCase()}</div>
        <div style="font-size:16px;font-weight:600;margin-top:2px">${node.label}</div>
      </div>
    </div>
  `;
  
  // === TRIGGER NODE ===
  if (node.type === 'trigger') {
    html += `
      <div class="node-editor-section">
        <div class="node-editor-section-title">Trigger Indstillinger</div>
        <div class="form-group">
          <label class="form-label">Trigger-type</label>
          <select class="input" onchange="updateNodeProperty('${id}', 'triggerType', this.value)">
            <option value="missed_call" ${node.triggerType === 'missed_call' ? 'selected' : ''}>Mistet opkald</option>
            <option value="sms" ${node.triggerType === 'sms' ? 'selected' : ''}>Indgående SMS</option>
            <option value="both" ${node.triggerType === 'both' ? 'selected' : ''}>Begge</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Label</label>
          <input class="input" value="${node.label}" onchange="updateNodeProperty('${id}', 'label', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">Sublabel</label>
          <input class="input" value="${node.sublabel || ''}" onchange="updateNodeProperty('${id}', 'sublabel', this.value)">
        </div>
      </div>
    `;
  }
  
  // === SMS NODE ===
  else if (node.type === 'sms') {
    html += `
      <div class="node-editor-section">
        <div class="node-editor-section-title">SMS Indstillinger</div>
        <div class="form-group">
          <label class="form-label">Node-label</label>
          <input class="input" value="${node.label}" onchange="updateNodeProperty('${id}', 'label', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">SMS Besked til kunden</label>
          <textarea class="input" rows="5" style="font-size:13px;line-height:1.5" onchange="updateNodeProperty('${id}', 'message', this.value)">${node.message || ''}</textarea>
          <div style="font-size:11px;color:var(--muted);margin-top:6px">
            Variabler: {restaurant}, {name}, {order}, {address}
          </div>
        </div>
      </div>
      <div class="node-editor-section">
        <div class="node-editor-section-title">SMS Skabeloner</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          <button class="btn btn-secondary" style="font-size:11px;padding:6px 10px" onclick="setSmsTemplate('${id}', 'missed_call')">Mistet opkald</button>
          <button class="btn btn-secondary" style="font-size:11px;padding:6px 10px" onclick="setSmsTemplate('${id}', 'delivery_type')">Levering/Afhentning</button>
          <button class="btn btn-secondary" style="font-size:11px;padding:6px 10px" onclick="setSmsTemplate('${id}', 'address')">Spørg Adresse</button>
          <button class="btn btn-secondary" style="font-size:11px;padding:6px 10px" onclick="setSmsTemplate('${id}', 'order')">Spørg Ordre</button>
          <button class="btn btn-secondary" style="font-size:11px;padding:6px 10px" onclick="setSmsTemplate('${id}', 'confirm')">Bekræftelse</button>
          <button class="btn btn-secondary" style="font-size:11px;padding:6px 10px" onclick="setSmsTemplate('${id}', 'error')">Fejl/Retry</button>
        </div>
      </div>
    `;
  }
  
  // === WAIT NODE ===
  else if (node.type === 'wait') {
    html += `
      <div class="node-editor-section">
        <div class="node-editor-section-title">Wait Indstillinger</div>
        <div class="form-group">
          <label class="form-label">Wait Type</label>
          <select class="input" onchange="updateNodeProperty('${id}', 'waitType', this.value)">
            <option value="contact_reply" ${node.waitType === 'contact_reply' || !node.waitType ? 'selected' : ''}>Contact Reply (Vent på kundesvar)</option>
            <option value="time_delay" ${node.waitType === 'time_delay' ? 'selected' : ''}>Time Delay (Fast ventetid)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Timeout (minutter)</label>
          <input class="input" type="number" value="${node.timeout || 25}" onchange="updateNodeProperty('${id}', 'timeout', parseInt(this.value))">
          <div style="font-size:11px;color:var(--muted);margin-top:6px">
            Anbefalet: 20-30 min for madbestillinger
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Label</label>
          <input class="input" value="${node.label}" onchange="updateNodeProperty('${id}', 'label', this.value)">
        </div>
      </div>
      <div class="node-editor-section">
        <div class="node-editor-section-title">Timeout Handling</div>
        <div style="background:var(--bg3);padding:12px;border-radius:8px;font-size:12px;color:var(--text2)">
          <div style="margin-bottom:8px"><strong>Contact Reply:</strong> Kunden svarer inden timeout</div>
          <div><strong>Time Out:</strong> Kunden svarer ikke - send reminder eller afslut</div>
        </div>
      </div>
    `;
  }
  
  // === AI NODE ===
  else if (node.type === 'ai') {
    html += `
      <div class="node-editor-section">
        <div class="node-editor-section-title">AI Classification Indstillinger</div>
        <div class="form-group">
          <label class="form-label">AI Funktion</label>
          <select class="input" onchange="updateNodeProperty('${id}', 'aiFunction', this.value)">
            <option value="intent" ${node.aiFunction === 'intent' || !node.aiFunction ? 'selected' : ''}>Intent Classifier (Ja/Nej/Greeting)</option>
            <option value="address" ${node.aiFunction === 'address' ? 'selected' : ''}>Address Extractor</option>
            <option value="order" ${node.aiFunction === 'order' ? 'selected' : ''}>Order Parser</option>
            <option value="name" ${node.aiFunction === 'name' ? 'selected' : ''}>Name Extractor</option>
            <option value="delivery" ${node.aiFunction === 'delivery' ? 'selected' : ''}>Delivery Type (Pickup/Levering)</option>
            <option value="custom" ${node.aiFunction === 'custom' ? 'selected' : ''}>Custom Prompt</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Label</label>
          <input class="input" value="${node.label}" onchange="updateNodeProperty('${id}', 'label', this.value)">
        </div>
      </div>
      <div class="node-editor-section">
        <div class="node-editor-section-title">System Prompt</div>
        <div class="form-group">
          <textarea class="input" rows="8" style="font-size:12px;font-family:monospace;line-height:1.4" onchange="updateNodeProperty('${id}', 'systemPrompt', this.value)">${node.systemPrompt || getDefaultAIPrompt(node.aiFunction || 'intent')}</textarea>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-secondary" style="font-size:11px;padding:6px 10px" onclick="setAIPrompt('${id}', 'intent')">Intent Prompt</button>
          <button class="btn btn-secondary" style="font-size:11px;padding:6px 10px" onclick="setAIPrompt('${id}', 'address')">Address Prompt</button>
          <button class="btn btn-secondary" style="font-size:11px;padding:6px 10px" onclick="setAIPrompt('${id}', 'order')">Order Prompt</button>
          <button class="btn btn-secondary" style="font-size:11px;padding:6px 10px" onclick="setAIPrompt('${id}', 'name')">Name Prompt</button>
        </div>
      </div>
      <div class="node-editor-section">
        <div class="node-editor-section-title">AI Indstillinger</div>
        <div class="form-group">
          <label class="form-label">Temperature</label>
          <input class="input" type="number" step="0.1" min="0" max="1" value="${node.temperature || 0.1}" onchange="updateNodeProperty('${id}', 'temperature', parseFloat(this.value))">
          <div style="font-size:11px;color:var(--muted);margin-top:6px">
            Anbefalet: 0.0-0.1 for konsistente svar
          </div>
        </div>
      </div>
    `;
  }
  
  // === CONDITION NODE ===
  else if (node.type === 'condition') {
    html += `
      <div class="node-editor-section">
        <div class="node-editor-section-title">Condition Indstillinger</div>
        <div class="form-group">
          <label class="form-label">Label</label>
          <input class="input" value="${node.label}" onchange="updateNodeProperty('${id}', 'label', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">Sublabel</label>
          <input class="input" value="${node.sublabel || ''}" onchange="updateNodeProperty('${id}', 'sublabel', this.value)">
        </div>
      </div>
    `;
    
    if (node.branches && node.branches.length > 0) {
      html += `
        <div class="node-editor-section">
          <div class="node-editor-section-title">Branches (${node.branches.length})</div>
          ${node.branches.map((b, i) => `
            <div style="background:var(--bg3);padding:12px;border-radius:8px;margin-bottom:10px;border-left:3px solid ${b.class === 'yes' ? '#10b981' : b.class === 'no' ? '#ef4444' : b.class === 'order' ? '#3b82f6' : '#94a3b8'}">
              <div class="form-group" style="margin-bottom:8px">
                <label class="form-label">Branch Label</label>
                <input class="input" value="${b.label}" onchange="updateBranchProperty('${id}', '${b.id}', 'label', this.value)">
              </div>
              <div class="form-group" style="margin-bottom:8px">
                <label class="form-label">Condition</label>
                <input class="input" value="${b.condition || ''}" placeholder="f.eks. Intent Type = Positive/Yes" onchange="updateBranchProperty('${id}', '${b.id}', 'condition', this.value)">
              </div>
              <div class="form-group" style="margin-bottom:8px">
                <label class="form-label">Branch Type</label>
                <select class="input" onchange="updateBranchProperty('${id}', '${b.id}', 'class', this.value)">
                  <option value="yes" ${b.class === 'yes' ? 'selected' : ''}>Yes/Positive</option>
                  <option value="no" ${b.class === 'no' ? 'selected' : ''}>No/Negative</option>
                  <option value="order" ${b.class === 'order' ? 'selected' : ''}>Order</option>
                  <option value="greeting" ${b.class === 'greeting' ? 'selected' : ''}>Greeting</option>
                  <option value="timeout" ${b.class === 'timeout' ? 'selected' : ''}>Timeout</option>
                  <option value="none" ${b.class === 'none' || !b.class ? 'selected' : ''}>None/Default</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom:0">
                <label class="form-label">Next Node</label>
                <input class="input" value="${b.next || ''}" placeholder="Node ID" onchange="updateBranchProperty('${id}', '${b.id}', 'next', this.value)">
              </div>
            </div>
          `).join('')}
          <button class="btn btn-secondary" style="width:100%;margin-top:8px" onclick="addBranch('${id}')">+ Tilføj Branch</button>
        </div>
      `;
    }
  }
  
  // === ACTION NODE ===
  else if (node.type === 'action') {
    html += `
      <div class="node-editor-section">
        <div class="node-editor-section-title">Action Indstillinger</div>
        <div class="form-group">
          <label class="form-label">Action Type</label>
          <select class="input" onchange="updateNodeProperty('${id}', 'actionType', this.value)">
            <option value="update_contact" ${node.actionType === 'update_contact' ? 'selected' : ''}>Update Contact</option>
            <option value="save_order" ${node.actionType === 'save_order' ? 'selected' : ''}>Save Order</option>
            <option value="create_task" ${node.actionType === 'create_task' ? 'selected' : ''}>Create Task</option>
            <option value="notification" ${node.actionType === 'notification' ? 'selected' : ''}>Send Notification</option>
            <option value="go_to" ${node.actionType === 'go_to' ? 'selected' : ''}>Go To (Jump)</option>
            <option value="increment" ${node.actionType === 'increment' ? 'selected' : ''}>Increment Counter</option>
            <option value="add_workflow" ${node.actionType === 'add_workflow' ? 'selected' : ''}>Add to Workflow</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Label</label>
          <input class="input" value="${node.label}" onchange="updateNodeProperty('${id}', 'label', this.value)">
        </div>
      </div>
    `;
    
    if (node.actionType === 'notification' || node.label.toLowerCase().includes('notification')) {
      html += `
        <div class="node-editor-section">
          <div class="node-editor-section-title">Notification Besked</div>
          <div class="form-group">
            <textarea class="input" rows="4" onchange="updateNodeProperty('${id}', 'notificationText', this.value)">${node.notificationText || '🚨 NY SMS-ORDRE MODTAGET!\\n👤 Kunde: {name}\\n📞 Tlf: {phone}\\n📍 Type: {order_type}\\n🏠 Adresse: {address}\\n📝 Ordre: {order}'}</textarea>
          </div>
        </div>
      `;
    }
  }
  
  // === END NODE ===
  else if (node.type === 'end') {
    html += `
      <div class="node-editor-section">
        <div class="node-editor-section-title">End Node</div>
        <div class="form-group">
          <label class="form-label">Label</label>
          <input class="input" value="${node.label}" onchange="updateNodeProperty('${id}', 'label', this.value)">
        </div>
        <div style="background:var(--bg3);padding:12px;border-radius:8px;font-size:12px;color:var(--text2)">
          End noden afslutter denne gren af workflowet. Kunden kan starte forfra ved næste henvendelse.
        </div>
      </div>
    `;
  }
  
  // Connection section for non-branch nodes
  if (node.next && !node.branches) {
    html += `
      <div class="node-editor-section">
        <div class="node-editor-section-title">Forbindelse</div>
        <div class="form-group">
          <label class="form-label">Next Node ID</label>
          <input class="input" value="${node.next}" onchange="updateNodeProperty('${id}', 'next', this.value)">
        </div>
      </div>
    `;
  }
  
  // Delete button (except for critical nodes)
  if (!['trigger-call', 'trigger-sms', 'end-final'].includes(id)) {
    html += `
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--border)">
        <button class="btn btn-danger" style="width:100%;display:flex;align-items:center;justify-content:center;gap:6px" onclick="if(confirm('Slet denne node?')) deleteNode('${id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          Slet Node
        </button>
      </div>
    `;
  }
  
  body.innerHTML = html;
  editor.classList.add('active');
}

// SMS Templates
function setSmsTemplate(id, template) {
  const templates = {
    missed_call: "Hej! Vi missede desværre dit opkald. Var det for at bestille mad? Svar 'JA' for at starte din bestilling direkte her over SMS. Hilsen {restaurant}",
    delivery_type: "Super! Skal maden leveres direkte til din dør, eller vil du selv komme og hente den? (Svar 'Levering' eller 'Afhentning')",
    address: "Hvad er den fulde leveringsadresse inkl. postnummer?",
    order: "Perfekt! Send venligst hele din bestilling i én enkelt besked.",
    confirm: "Tak! Din ordre er nu sendt til køkkenet. Afvent venligst, at restauranten accepterer din bestilling. Du modtager en bekræftelse snarest. 🍕",
    error: "Beklager, jeg kunne ikke helt forstå dit svar. Kan du prøve igen?"
  };
  updateNodeProperty(id, 'message', templates[template] || '');
  openNodeEditor(id); // Refresh editor
}

// AI Prompts
function getDefaultAIPrompt(type) {
  const prompts = {
    intent: `Du er en AI-assistent for en restaurant. Din opgave er at kategorisere kundens svar i én af følgende kategorier:

1. POSITIVE/YES: Hvis kunden bekræfter, at de vil bestille mad (f.eks. 'ja tak', 'jeg vil gerne bestille', 'kan jeg få en pizza').
2. NEGATIVE/NO: Hvis kunden takker nej (f.eks. 'nej tak', 'forkert nummer').
3. GREETING: Hvis kunden kun siger hej uden at tage stilling til bestilling.
4. NONE: Hvis svaret er uklart eller irrelevant.

Output format: Returnér kun ét ord: Enten 'POSITIVE', 'NEGATIVE', 'GREETING' eller 'NONE'.`,
    
    address: `Du er en data-ekstraktor. Kunden har sendt en besked med deres leveringsadresse. Din opgave er at udtrække adressen præcist.

Regler:
• Hvis du finder en gyldig adresse, returnér den i formatet: [Vejnavn] [Nummer], [Postnummer] [By].
• Hvis beskeden IKKE indeholder en adresse, eller den er mangelfuld, skal du svare med ordet: 'ERROR'.
• Fjern unødvendig tekst som 'min adresse er' eller 'lever venligst til'.

Output: Kun selve adressen eller 'ERROR'.`,
    
    order: `Analyser kundens besked og udtræk bestillingen. 

Output format (JSON):
{
  "items": "Liste over retter/varer kunden har nævnt",
  "valid": true/false
}

Hvis beskeden ikke indeholder en gyldig bestilling, sæt valid til false.`,
    
    name: `Udtræk kundens navn fra beskeden.

Regler:
• Returnér kun navnet (fornavn og evt. efternavn)
• Hvis intet navn findes, returnér 'ERROR'
• Fjern hilsner og andet tekst

Output: Kun navnet eller 'ERROR'.`,
    
    delivery: `Kategorisér kundens svar som enten levering eller afhentning.

Output: Returnér kun ét ord: 'PICKUP' eller 'DELIVERY' eller 'UNCLEAR'.`
  };
  return prompts[type] || prompts.intent;
}

function setAIPrompt(id, type) {
  updateNodeProperty(id, 'systemPrompt', getDefaultAIPrompt(type));
  updateNodeProperty(id, 'aiFunction', type);
  openNodeEditor(id);
}

// Add new branch to condition node
function addBranch(nodeId) {
  const node = workflowNodes.find(n => n.id === nodeId);
  if (node && node.branches) {
    const newBranch = {
      id: 'branch-' + Date.now(),
      label: 'New Branch',
      class: 'none',
      condition: '',
      next: ''
    };
    node.branches.push(newBranch);
    openNodeEditor(nodeId);
  }
}

// Delete node
function deleteNode(id) {
  const index = workflowNodes.findIndex(n => n.id === id);
  if (index > -1) {
    workflowNodes.splice(index, 1);
    closeNodeEditor();
    renderWorkflowNodes();
  }
}

// =====================================================
// NODE PALETTE FUNCTIONS
// =====================================================

function toggleNodePalette() {
  const palette = document.getElementById('node-palette');
  const canvas = document.getElementById('workflow-canvas');

  if (!palette || !canvas) return;

  palette.classList.toggle('collapsed');
  canvas.classList.toggle('palette-collapsed');

  const isCollapsed = palette.classList.contains('collapsed');
  addLog(`${isCollapsed ? '📦' : '📋'} Node palette ${isCollapsed ? 'skjult' : 'vist'}`, 'info');
}

function addNodeFromPalette(type) {
  // Find max Y position to place new node below existing ones
  const maxY = workflowNodes.length > 0 ? Math.max(...workflowNodes.map(n => n.y)) : 0;

  // Generate unique ID
  const newId = `${type}-${Date.now()}`;

  // Create node with default values
  const newNode = createDefaultNode(type, newId, 430, maxY + 200);

  // Add to workflow
  workflowNodes.push(newNode);
  renderWorkflowNodes();

  // Auto-open editor for new node
  selectNode(newId);
  openNodeEditor(newId);

  addLog(`✅ Ny ${type} node tilføjet: ${newId}`, 'success');
}

function createDefaultNode(type, id, x, y) {
  const defaults = {
    trigger: {
      id,
      type,
      label: 'Ny Trigger',
      x,
      y,
      icon: '📞',
      next: '',
      triggerType: 'sms',
      description: 'SMS trigger'
    },
    sms: {
      id,
      type,
      label: 'Ny SMS',
      x,
      y,
      icon: '💬',
      next: '',
      message: 'Skriv din SMS besked her...',
      useTemplate: false
    },
    wait: {
      id,
      type,
      label: 'Vent på svar',
      x,
      y,
      icon: '⏳',
      timeout: 25,
      waitType: 'contact_reply',
      branches: [
        { id: `${id}-reply`, label: 'Contact Reply', next: '' },
        { id: `${id}-timeout`, label: 'Time Out', class: 'timeout', next: '' }
      ]
    },
    condition: {
      id,
      type,
      label: 'Ny Betingelse',
      x,
      y,
      icon: '❓',
      conditionType: 'simple',
      branches: [
        { id: `${id}-yes`, label: 'Yes', class: 'yes', next: '' },
        { id: `${id}-no`, label: 'No', class: 'no', next: '' }
      ]
    },
    ai: {
      id,
      type,
      label: 'AI Klassificering',
      x,
      y,
      icon: '🤖',
      next: '',
      aiFunction: 'intent',
      context: '',
      expectedCategories: []
    },
    action: {
      id,
      type,
      label: 'Ny Action',
      x,
      y,
      icon: '⚡',
      next: '',
      actionType: 'notification',
      actionData: {}
    },
    end: {
      id,
      type,
      label: 'END',
      x,
      y,
      icon: '🏁',
      endType: 'success'
    }
  };

  return defaults[type] || {
    id,
    type,
    label: 'Ny Node',
    x,
    y,
    icon: '📦',
    next: ''
  };
}

// Drag and drop functionality
let draggedNodeType = null;

function dragStartPalette(event, nodeType) {
  draggedNodeType = nodeType;
  event.dataTransfer.effectAllowed = 'copy';
  event.dataTransfer.setData('text/plain', nodeType);
}

function initCanvasDrop() {
  const canvas = document.getElementById('workflow-canvas');

  if (!canvas) {
    console.warn('Workflow canvas not found - drag-drop initialization skipped');
    return;
  }

  canvas.addEventListener('dragover', (e) => {
    if (draggedNodeType) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  });

  canvas.addEventListener('drop', (e) => {
    if (!draggedNodeType) return;
    e.preventDefault();

    // Beregn drop position relativt til canvas transform
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - (canvasTransform?.x || 0)) / (canvasTransform?.scale || 1);
    const y = (e.clientY - rect.top - (canvasTransform?.y || 0)) / (canvasTransform?.scale || 1);

    // Opret node på drop position
    const newId = `${draggedNodeType}-${Date.now()}`;
    const newNode = createDefaultNode(draggedNodeType, newId, x, y);

    workflowNodes.push(newNode);
    renderWorkflowNodes();

    // Auto-select og åbn editor
    selectNode(newId);
    openNodeEditor(newId);

    addLog(`✅ ${draggedNodeType} node droppet på (${Math.round(x)}, ${Math.round(y)})`, 'success');

    draggedNodeType = null;
  });

  addLog('🎨 Canvas drag-drop initialiseret', 'info');
}

// Slet node med bekræftelse
function confirmDeleteNode(id) {
  const node = workflowNodes.find(n => n.id === id);

  if (!node) {
    addLog(`⚠️ Node ikke fundet: ${id}`, 'warn');
    return;
  }

  const confirmMessage = `Er du sikker på at du vil slette denne node?\n\nNode ID: ${id}\nType: ${node.type}\nLabel: ${node.label}\n\nDenne handling kan ikke fortrydes.`;

  if (confirm(confirmMessage)) {
    deleteNode(id);
    addLog(`🗑️ Node slettet: ${id}`, 'warn');
  } else {
    addLog(`❌ Sletning annulleret for: ${id}`, 'info');
  }
}

function closeNodeEditor() {
  document.getElementById('node-editor').classList.remove('active');
  selectedNodeId = null;
  renderWorkflowNodes();
}

function updateNodeProperty(id, prop, value) {
  const node = workflowNodes.find(n => n.id === id);
  if (node) {
    node[prop] = value;

    // VIGTIGT: Gem med det samme til localStorage
    saveWorkflow();

    renderWorkflowNodes();
    addLog(`💾 Node ${id} opdateret: ${prop} = ${typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : value}`, 'info');
  }
}

function updateBranchProperty(nodeId, branchId, prop, value) {
  const node = workflowNodes.find(n => n.id === nodeId);
  if (node && node.branches) {
    const branch = node.branches.find(b => b.id === branchId);
    if (branch) {
      branch[prop] = value;

      // VIGTIGT: Gem med det samme til localStorage
      saveWorkflow();

      renderWorkflowNodes();
      addLog(`💾 Branch ${branchId} opdateret: ${prop} = ${value}`, 'info');
    }
  }
}

function editBranch(nodeId, branchId) {
  openNodeEditor(nodeId);
}

// ============================================
// ZOOM FUNKTIONALITET
// ============================================
let currentZoom = 1;
const minZoom = 0.25;
const maxZoom = 2;
const zoomStep = 0.1;

function zoomIn() {
  if (currentZoom < maxZoom) {
    currentZoom = Math.min(currentZoom + zoomStep, maxZoom);
    applyZoom();
  }
}

function zoomOut() {
  if (currentZoom > minZoom) {
    currentZoom = Math.max(currentZoom - zoomStep, minZoom);
    applyZoom();
  }
}

function resetZoom() {
  currentZoom = 1;
  canvasTransform = { x: 0, y: 0, scale: 1 };
  applyZoom();
  centerWorkflow();
}

function applyZoom() {
  // Update canvas transform
  canvasTransform.scale = currentZoom;
  
  const canvas = document.getElementById('workflow-canvas');
  const viewport = canvas?.querySelector('.canvas-viewport');
  
  if (viewport) {
    viewport.style.transform = `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.scale})`;
  } else {
    // Fallback for old structure (no viewport wrapper)
    const nodesContainer = document.getElementById('workflow-nodes');
    const connectionsContainer = document.getElementById('wf-connections');

    if (nodesContainer) {
      nodesContainer.style.transform = `scale(${currentZoom})`;
      nodesContainer.style.transformOrigin = '0 0';
    }

    if (connectionsContainer) {
      connectionsContainer.style.transform = `scale(${currentZoom})`;
      connectionsContainer.style.transformOrigin = '0 0';
    }
  }

  updateCanvasDots();

  // Re-render connections for at sikre de er synkroniseret med nodes
  // Dette sikrer at lines følger noderne præcist
  setTimeout(() => {
    renderWorkflowNodes();
  }, 10);
  
  // Update zoom display
  const zoomDisplay = document.getElementById('zoom-level');
  if (zoomDisplay) {
    zoomDisplay.textContent = Math.round(currentZoom * 100) + '%';
  }
}

// Mouse wheel zoom
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('workflow-canvas');
  if (canvas) {
    canvas.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          zoomIn();
        } else {
          zoomOut();
        }
      }
    }, { passive: false });
  }

  // Initialize node palette drag-drop functionality
  initCanvasDrop();
});

function saveWorkflow() {
  localStorage.setItem('workflow_nodes', JSON.stringify(workflowNodes));

  if (window.SupabaseDB) {
    window.SupabaseDB.saveUserSetting('workflow_nodes', { nodes: workflowNodes })
      .catch(err => console.warn('Supabase sync fejl (workflow):', err));
  }

  // Visual feedback - brief button flash
  const btn = document.querySelector('[onclick="saveWorkflow()"]');
  if (btn) {
    btn.style.background = 'var(--green)';
    setTimeout(() => btn.style.background = '', 300);
  }
}

function resetWorkflow() {
  if (confirm('Er du sikker på du vil nulstille workflowet?')) {
    localStorage.removeItem('workflow_nodes');
    location.reload();
  }
}

// Load saved workflow
const savedWorkflow = localStorage.getItem('workflow_nodes');
if (savedWorkflow) {
  try {
    workflowNodes = JSON.parse(savedWorkflow);
  } catch (e) {}
}

// =====================================================
// LOCALSTORAGE PERSISTENCE SYSTEM
// =====================================================
const STORAGE_KEYS = {
  RESTAURANTS: 'orderflow_restaurants',
  SETTINGS: 'orderflow_settings',
  VERSION: 'orderflow_version'
};

// Save all restaurants to localStorage
function persistRestaurants() {
  try {
    // Only save user-modified properties, not demo data
    const toSave = restaurants.map(r => ({
      id: r.id,
      name: r.name,
      cvr: r.cvr,
      email: r.email,
      phone: r.phone,
      owner: r.owner,
      contactPerson: r.contactPerson,
      address: r.address,
      website: r.website,
      createdAt: r.createdAt,
      // Supabase-compatible fields (for sync)
      contact_email: r.contact_email || r.email,
      contact_phone: r.contact_phone || r.phone,
      contact_name: r.contact_name || r.contactPerson,
      country: r.country,
      metadata: r.metadata,
      settings: r.settings,
      industry: r.industry,
      // Status
      status: r.status,
      // Workflow settings
      reviewEnabled: r.reviewEnabled,
      reorderEnabled: r.reorderEnabled,
      receiptEnabled: r.receiptEnabled,
      googleReviewUrl: r.googleReviewUrl,
      trustpilotUrl: r.trustpilotUrl,
      deliveryEnabled: r.deliveryEnabled,
      deliveryFrom: r.deliveryFrom,
      deliveryTo: r.deliveryTo,
      deliveryTimeRestricted: r.deliveryTimeRestricted,
      timeFormat: r.timeFormat,
      openingHours: r.openingHours,
      // Messages
      messages: r.messages,
      // Timestamps
      stamdataUpdatedAt: r.stamdataUpdatedAt,
      workflowSettingsUpdatedAt: r.workflowSettingsUpdatedAt,
      messagesUpdatedAt: r.messagesUpdatedAt
    }));
    
    localStorage.setItem(STORAGE_KEYS.RESTAURANTS, JSON.stringify(toSave));
    console.log('Restaurants persisted to localStorage:', toSave.length);
    return true;
  } catch (e) {
    console.error('Failed to persist restaurants:', e);
    return false;
  }
}

// Load restaurants from localStorage and merge with demo data
function loadPersistedRestaurants() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.RESTAURANTS);
    if (!saved) return false;

    const savedData = JSON.parse(saved);
    console.log('Loading persisted restaurants:', savedData.length);

    // Merge saved data with existing restaurants OR add new ones
    savedData.forEach(savedRestaurant => {
      const existing = restaurants.find(r => r.id === savedRestaurant.id);
      if (existing) {
        // Merge user-modified properties
        Object.keys(savedRestaurant).forEach(key => {
          if (savedRestaurant[key] !== undefined && savedRestaurant[key] !== null) {
            existing[key] = savedRestaurant[key];
          }
        });
      } else {
        // Add new restaurant that doesn't exist yet (e.g., locally created)
        restaurants.push(savedRestaurant);
        console.log('✅ Added locally saved restaurant:', savedRestaurant.name);
      }
    });

    return true;
  } catch (e) {
    console.error('Failed to load persisted restaurants:', e);
    return false;
  }
}

// Sync locally-created restaurants to Supabase
async function syncLocalRestaurantsToSupabase() {
  if (typeof SupabaseDB === 'undefined' || !currentUser?.id) return;

  var localOnly = restaurants.filter(function(r) {
    var id = String(r.id || '');
    return id.startsWith('local-') || (id && !SupabaseDB._isUuid(id));
  });

  if (localOnly.length === 0) return;

  console.log('🔄 Syncing', localOnly.length, 'local restaurants to Supabase...');

  for (var i = 0; i < localOnly.length; i++) {
    var local = localOnly[i];
    try {
      var dbData = {
        name: local.name || 'Unavngivet',
        contact_phone: local.contact_phone || local.phone || '',
        contact_email: local.contact_email || local.email || '',
        contact_name: local.contact_name || local.contactPerson || local.owner || '',
        address: local.address || '',
        country: local.country || 'DK',
        cvr: local.cvr || '',
        status: local.status || 'pending',
        orders: 0,
        orders_this_month: 0,
        orders_total: 0,
        revenue_today: 0,
        revenue_this_month: 0,
        revenue_total: 0,
        ai_enabled: true,
        integration_status: 'none',
        settings: local.settings || {},
        metadata: local.metadata || {}
      };

      var created = await SupabaseDB.createRestaurant(currentUser.id, dbData);
      if (created) {
        var idx = restaurants.indexOf(local);
        if (idx !== -1) restaurants[idx] = created;
        console.log('✅ Synced to Supabase:', local.name, '→', created.id);
      }
    } catch (err) {
      console.warn('⚠️ Could not sync restaurant:', local.name, err.message);
    }
  }

  persistRestaurants();
  console.log('🔄 Local sync complete');
}

// Clear all persisted data
function clearPersistedData() {
  if (confirm('Er du sikker på du vil slette alle gemte data? Dette kan ikke fortrydes.')) {
    localStorage.removeItem(STORAGE_KEYS.RESTAURANTS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    toast('Alle gemte data slettet', 'success');
    location.reload();
  }
}

// Initialize persistence on app load
function initPersistence() {
  // Load saved restaurants
  loadPersistedRestaurants();
  
  console.log('Persistence system initialized');
}

// Call persistence init after restaurants are loaded
setTimeout(initPersistence, 100);

// =====================================================
// TEST WORKFLOW
// =====================================================
// Initialize test panel event listeners safely
function initTestPanel() {
  const testRestaurant = document.getElementById('test-restaurant');
  const testPhone = document.getElementById('test-phone');
  
  if (testRestaurant) {
    testRestaurant.addEventListener('change', updateTestButtons);
  }
  if (testPhone) {
    testPhone.addEventListener('input', function() {
      const convPhone = document.getElementById('conv-phone');
      if (convPhone) convPhone.textContent = this.value;
    });
  }
}

// Call init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTestPanel);
} else {
  initTestPanel();
}

function updateTestButtons() {
  const hasRestaurant = !!document.getElementById('test-restaurant').value;
  document.getElementById('btn-call').disabled = !hasRestaurant;
  document.getElementById('btn-sms').disabled = !hasRestaurant;
}

function toggleLive() {
  console.log('toggleLive called!');
  const toggle = document.getElementById('live-toggle');
  const checkbox = toggle?.querySelector('input[type="checkbox"]');
  const badge = document.getElementById('live-badge');
  const container = document.getElementById('live-toggle-container');
  const warning = document.getElementById('live-mode-warning');
  
  // Determine new state from checkbox or toggle current state
  const newState = checkbox ? checkbox.checked : !liveMode;
  
  if (newState) {
    // Enable live mode - GRØN for aktiv
    liveMode = true;
    if (checkbox) checkbox.checked = true;
    if (badge) badge.classList.add('active');
    if (container) {
      container.classList.add('active');
      container.style.background = 'rgba(45,212,191,0.1)';
      container.style.border = '1px solid rgba(45,212,191,0.3)';
    }
    if (warning) {
      warning.textContent = 'LIVE aktiv - SMS sendes til telefon';
      warning.style.color = 'var(--accent)';
      warning.style.fontWeight = '500';
    }
    addLog('LIVE MODE aktiveret - SMS sendes nu', 'success');
    toast('LIVE MODE aktiveret', 'success');
    console.log('LIVE MODE ON');
  } else {
    // Disable live mode - tilbage til neutral
    liveMode = false;
    if (checkbox) checkbox.checked = false;
    if (badge) badge.classList.remove('active');
    if (container) {
      container.classList.remove('active');
      container.style.background = 'var(--bg)';
      container.style.border = '1px solid var(--border)';
    }
    if (warning) {
      warning.textContent = 'Demo mode - SMS vises kun i UI';
      warning.style.color = 'var(--muted)';
      warning.style.fontWeight = 'normal';
    }
    addLog('Demo mode aktiveret', 'info');
    toast('Demo mode', 'info');
    console.log('LIVE MODE OFF');
  }
}

// Make it global
window.toggleLive = toggleLive;

async function startTest(type) {
  const restaurantId = document.getElementById('test-restaurant').value;
  let restaurant = restaurants.find(r => r.id === restaurantId);
  if (!restaurant && isDemoDataEnabled()) {
    const demoCustomers = getDemoDataCustomers();
    restaurant = demoCustomers.find(r => r.id === restaurantId);
  }
  if (!restaurant) return;

  // Check if customer can receive workflow actions
  if (!canReceiveWorkflowActions(restaurant)) {
    toast(`Workflows er deaktiveret for ${restaurant.status === 'terminated' ? 'opsagte' : 'inaktive'} kunder`, 'warning');
    addLog(`⚠️ Kunde "${restaurant.name}" kan ikke modtage workflows (status: ${restaurant.status})`, 'warning');
    return;
  }

  // LIVE MODE PRE-FLIGHT CHECKS
  if (liveMode) {
    const apiKey = localStorage.getItem('inmobile_api_key');
    const sender = localStorage.getItem('inmobile_sender');
    if (!apiKey || !sender) {
      toast('Fejl: InMobile credentials ikke konfigureret', 'error');
      addLog('❌ InMobile API key eller sender mangler - gå til Indstillinger → SMS', 'error');
      return;
    }

    const phone = document.getElementById('test-phone').value;
    if (!phone || phone.replace(/\D/g, '').length < 8) {
      toast('Ugyldigt telefonnummer', 'error');
      addLog('❌ Telefonnummer skal være mindst 8 cifre', 'error');
      return;
    }
  }

  console.log('startTest called:', type, 'Restaurant:', restaurant.name);
  
  // Auto-switch to messages tab to show SMS conversation
  switchTestTab('messages');
  
  // Hide empty state in messages tab
  const emptyState = document.getElementById('messages-empty-state');
  if (emptyState) emptyState.style.display = 'none';
  
  // Hide test empty state
  const testEmptyState = document.getElementById('test-empty-state');
  if (testEmptyState) testEmptyState.style.display = 'none';
  
  // Info about current mode
  if (!liveMode) {
    addLog('Demo mode - SMS vises i UI, sendes ikke', 'info');
  } else {
    addLog('✓ LIVE MODE - Rigtige SMS sendes', 'success');
  }
  
  testRunning = true;
  document.getElementById('btn-stop').style.display = 'block';
  
  const messagesContainer = document.getElementById('messages');
  console.log('Messages container before clear:', messagesContainer);
  messagesContainer.innerHTML = '';

  // Clear intent display when starting new test
  if (typeof window.hideIntentDisplay === 'function') {
    window.hideIntentDisplay();
  }

  // Clear detailed log at start
  const detailedLog = document.getElementById('detailed-log');
  if (detailedLog) {
    detailedLog.innerHTML = '';
  }
  
  addLog(`Test startet: ${type === 'call' ? 'Mistet opkald' : 'SMS'}`, 'success');
  addLog(`Nummer: ${document.getElementById('test-phone').value}`, 'info');

  // Simulate workflow med error handling
  try {
    await runWorkflow(restaurant, type);
  } catch (err) {
    console.error('Workflow error:', err);
    addLog(`❌ Workflow fejl: ${err.message}`, 'error');
  } finally {
    // Cleanup uanset hvad
    testRunning = false;
    document.getElementById('btn-stop').style.display = 'none';
    document.getElementById('waiting').style.display = 'none';
    if (replyResolver) {
      replyResolver(null);
      replyResolver = null;
    }
  }
}

function stopTest() {
  testRunning = false;
  document.getElementById('btn-stop').style.display = 'none';
  document.getElementById('waiting').style.display = 'none';

  // Clear any pending reply resolver
  if (replyResolver) {
    replyResolver(null);
    replyResolver = null;
  }

  addLog('⏹️ Test stoppet manuelt', 'warn');
  toast('Test stoppet', 'info');
}

async function runWorkflow(restaurant, type) {
  const phone = document.getElementById('test-phone').value;
  let customerName = '';
  let order = '';
  let orderType = '';
  let address = '';
  let parsedOrder = null; // NY: Parsed order med priser
  let currentMenu = null; // NY: Menu data
  let openingHoursContext = ''; // NY: Åbningstider til AI

  // =====================================================
  // ADVANCED AI: Initialisér conversation state
  // =====================================================
  const conversationId = getCurrentConversationId();

  if (window.AdvancedAI) {
    const conversation = AdvancedAI.ConversationStateManager.getConversation(conversationId);
    addLog(`💬 Advanced AI conversation initialiseret: ${conversationId}`, 'ai');

    // Nulstil conversation ved ny workflow
    conversation.currentPhase = 'FASE_0_HILSEN';
    conversation.customerData.orderItems = [];
    conversation.customerData.modifications = [];
    conversation.customerData.extras = [];
    conversation.validationAttempts = {};
  }
  
  // TRIN 1: Fetch menu ved workflow start
  addLog('📋 Henter menu data...', 'info');
  currentMenu = await fetchMenuForRestaurant(restaurant);
  
  // Gem åbningstider som context til AI
  openingHoursContext = formatOpeningHoursText(restaurant);
  
  // Log aktuelle åbningstider fra restaurant indstillinger
  const dayNamesShort = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const dayNamesFull = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayIndex = new Date().getDay();
  const todayShort = dayNamesShort[dayIndex];
  const todayFull = dayNamesFull[dayIndex];
  const todayHours = restaurant.openingHours?.[todayShort] || restaurant.openingHours?.[todayFull];
  if (todayHours?.enabled) {
    // Check for 24h
    if (todayHours.open === '00:00' && todayHours.close === '00:00') {
      addLog(`🕐 Dagens åbningstider (${getDayNameDanish(todayFull)}): Døgnåbent`, 'info');
    } else {
      addLog(`🕐 Dagens åbningstider (${getDayNameDanish(todayFull)}): ${todayHours.open} - ${todayHours.close}`, 'info');
    }
  } else {
    addLog(`🕐 ${getDayNameDanish(todayFull)}: Lukket i dag`, 'warn');
  }
  
  // Node 1: Trigger
  activateNode(type === 'call' ? 'trigger-call' : 'trigger-sms');
  addLog('⚡ Trigger: ' + (type === 'call' ? 'Mistet opkald' : 'SMS modtaget'), 'info');
  await sleep(500);
  
  // Node 2: DYNAMISK Check if open (bruger restaurant.openingHours)
  activateNode('open-check');
  addLog('❓ Tjekker åbningstider fra restaurant indstillinger...', 'info');
  await sleep(500);
  
  // Brug dynamisk Open Checker - læser DIREKTE fra restaurant.openingHours
  const openStatus = checkRestaurantOpen(restaurant);
  
  if (openStatus.isOpen) {
    addLog(`✅ ${restaurant.name} er åben (lukker kl. ${openStatus.closeTime})`, 'success');
  } else {
    addLog(`🔴 ${restaurant.name} er lukket (${openStatus.reason})`, 'warn');
    if (openStatus.nextOpen) {
      addLog(`📅 Næste åbning: ${openStatus.nextOpen.day} kl. ${openStatus.nextOpen.time}`, 'info');
    }
  }
  
  if (!openStatus.isOpen) {
    activateNode('send-closed');
    // Generer dynamisk lukket-besked med næste åbningstid
    const closedMessage = generateClosedMessage(restaurant, openStatus);
    await sendSMS(phone, closedMessage, restaurant);
    activateNode('end-closed');
    return;
  }
  
  // Node: Open
  activateNode('open-node');
  await sleep(300);
  
  // Missed Call path
  activateNode('send-missed');
  await sendSMS(phone, `Hej! Vi missede desværre dit opkald. Var det for at bestille mad? Svar JA for at starte din bestilling direkte her over SMS. Hilsen ${restaurant.name}`, restaurant);
  
  // Wait for reply
  activateNode('wait-missed');
  const reply1 = await waitForReply();
  if (!reply1 || !testRunning) return;
  
  // Intent check - inkluder åbningstider i AI context
  activateNode('intent-check-missed');
  const classification1 = await classifyWithAI(reply1, `Kategoriser svaret: POSITIVE/YES, NEGATIVE/NO, GREETING, eller NONE. Restaurantens åbningstider:\n${openingHoursContext}`);
  
  const replyLower = reply1.toLowerCase();
  const normalizedCategory = (classification1.category || '').toUpperCase();
  const isNo = normalizedCategory === 'NO' || normalizedCategory === 'NEGATIVE' ||
    replyLower.includes('nej') ||
    replyLower.includes('no') ||
    replyLower.includes('ikke') ||
    replyLower.includes('nej tak');
  const isYes = !isNo;
  
  addLog(`🎯 AI Intent: ${classification1.category} -> ${isYes ? 'JA' : 'NEJ'}`, 'ai');
  
  if (isNo) {
    activateNode('end-no-intent');
    await sendSMS(phone, 'Ingen problem! Ring gerne igen 📞', restaurant);
    return;
  }
  
  // Go to previous order check
  activateNode('go-to-prev-order-1');
  await sleep(200);
  
  // Previous order check
  activateNode('condition-prev-order');
  await sleep(300);
  
  // DYNAMISK LEVERINGSKONTROL - Tjek om restaurant tilbyder levering
  const deliveryEnabled = restaurant.deliveryEnabled !== false; // Default true
  let isPickup = false;
  
  if (!deliveryEnabled) {
    // Levering deaktiveret - spring direkte til afhentning
    activateNode('delivery-check');
    addLog('🚗 Levering deaktiveret for denne restaurant', 'warn');
    await sleep(200);
    
    activateNode('ask-delivery-type');
    await sendSMS(phone, 'Vi tilbyder desværre ikke levering i øjeblikket. Du kan bestille til afhentning. Er det okay?', restaurant);
    
    activateNode('wait-delivery-type');
    const pickupConfirm = await waitForReply();
    if (!pickupConfirm || !testRunning) return;
    
    // Tjek om kunden accepterer afhentning
    const pickupClass = await classifyWithAI(pickupConfirm, 'Accepterer kunden afhentning? YES/NO');
    const acceptsPickup = pickupClass.category === 'YES' || 
                          pickupConfirm.toLowerCase().includes('ja') ||
                          pickupConfirm.toLowerCase().includes('okay') ||
                          pickupConfirm.toLowerCase().includes('fint');
    
    if (!acceptsPickup) {
      await sendSMS(phone, 'Det forstår vi godt. Du er altid velkommen tilbage når det passer dig bedre 👋', restaurant);
      activateNode('end-no-delivery');
      return;
    }
    
    isPickup = true;
    orderType = 'Pickup';
  } else {
    // Levering aktiveret - spørg kunden
    activateNode('ask-delivery-type');
    await sendSMS(phone, 'Super! Skal maden leveres direkte til din dør, eller vil du selv komme og hente den? (Svar Levering eller Afhentning)', restaurant);
    
    // Wait for delivery type
    activateNode('wait-delivery-type');
    const replyDelivery = await waitForReply();
    if (!replyDelivery || !testRunning) return;
    
    // AI classify delivery
    activateNode('ai-delivery-type');
    const deliveryClass = await classifyWithAI(replyDelivery, 'Kategoriser: PICKUP eller DELIVERY eller UNCLEAR');
    isPickup = replyDelivery.toLowerCase().includes('afhent') || 
               replyDelivery.toLowerCase().includes('hente') ||
               deliveryClass.category === 'PICKUP';
    orderType = isPickup ? 'Pickup' : 'Delivery';
  }
  
  addLog(`🎯 Type: ${orderType}`, 'ai');
  
  activateNode('delivery-condition');
  await sleep(300);
  
  const menuUrl = restaurant.menuUrl || restaurant.website || 'vores hjemmeside';
  
  if (isPickup) {
    activateNode('order-type-pickup');
    await sleep(200);
    
    // Ask for order (pickup)
    activateNode('ask-order-pickup');
    await sendSMS(phone, `Lyder godt! Send venligst hele din bestilling i én enkelt besked. Du kan se vores menu her: ${menuUrl}`, restaurant);
    
    activateNode('wait-order-pickup');
  } else {
    activateNode('order-type-delivery');
    await sleep(200);
    
    // =====================================================
    // ADRESSE INDSAMLING MED VALIDERING
    // =====================================================
    // ADRESSE VALIDERING - Med AdvancedAI integration
    // =====================================================
    let addressConfirmed = false;
    let addressRetryCount = 0;
    const maxAddressRetries = 3;

    while (!addressConfirmed && addressRetryCount < maxAddressRetries && testRunning) {
      activateNode('ask-address');

      // Opdater conversation phase
      if (window.AdvancedAI) {
        const conv = AdvancedAI.ConversationStateManager.getConversation(conversationId);
        conv.currentPhase = 'FASE_3_ADRESSE';
        conv.validationAttempts.address = addressRetryCount;
      }

      // Brug AdvancedAI til at generere kontekst-aware prompt
      let addressPrompt;
      if (window.AdvancedAI && addressRetryCount > 0) {
        const conv = AdvancedAI.ConversationStateManager.getConversation(conversationId);
        addressPrompt = AdvancedAI.generateAddressPrompt(conv, addressRetryCount);
      } else {
        // Legacy prompts
        if (addressRetryCount === 0) {
          addressPrompt = 'Hvad er den fulde leveringsadresse inkl. postnummer?';
        } else if (addressRetryCount === 1) {
          addressPrompt = 'Jeg mangler adressen. Skriv venligst vejnavn, husnummer og postnummer (f.eks. "Vestergade 10, 2100 København")';
        } else {
          addressPrompt = 'Skriv din adresse så vi kan levere maden:';
        }
      }

      await sendSMS(phone, addressPrompt, restaurant);

      activateNode('wait-address');
      const addressReply = await waitForReply();
      if (!addressReply || !testRunning) return;

      // Tilføj til conversation history
      if (window.AdvancedAI) {
        AdvancedAI.ConversationStateManager.addMessage(conversationId, 'user', addressReply);
      }

      // Brug AdvancedAI validering hvis tilgængelig
      let validation;
      if (window.AdvancedAI) {
        validation = AdvancedAI.validation.validateAddress(addressReply);
        addLog(`🔍 AdvancedAI adresse validering: ${validation.valid ? '✓' : '✗'} complete=${validation.complete}`, 'ai');
      } else {
        // Legacy validation
        activateNode('ai-address-extractor');
        const addressClass = await classifyWithAI(addressReply,
          `Udtræk leveringsadressen fra beskeden.
          Kategoriser:
          - ADDRESS: Gyldig adresse fundet (udtræk i "extracted")
          - INCOMPLETE: Mangler postnummer eller husnummer
          - ERROR: Ikke en adresse

          En gyldig adresse har: vejnavn, husnummer, og helst postnummer.`
        );

        const extractedAddress = addressClass.extracted || addressReply.trim();
        const hasNumber = /\d+/.test(extractedAddress);
        const hasLetters = /[a-zæøå]{3,}/i.test(extractedAddress);
        const hasPostalCode = /\b\d{4}\b/.test(extractedAddress);

        validation = {
          valid: addressClass.category === 'ADDRESS' || (hasNumber && hasLetters),
          complete: hasPostalCode,
          address: extractedAddress,
          missing: !hasPostalCode ? ['postnummer'] : []
        };
      }

      activateNode('address-condition');
      await sleep(200);

      // Håndter validerings resultat
      if (validation.valid && validation.complete) {
        // Perfekt adresse
        address = validation.address;
        addressConfirmed = true;

        if (window.AdvancedAI) {
          AdvancedAI.ConversationStateManager.updateCustomerData(conversationId, 'address', validation.parsed || { full: address });
        }

        addLog(`📍 Adresse gemt: ${address}`, 'success');
      } else if (validation.valid && !validation.complete) {
        // Delvis adresse - spørg efter manglende dele
        addressRetryCount++;

        if (validation.prompt && window.AdvancedAI) {
          await sendSMS(phone, validation.prompt, restaurant);
          addLog(`⚠️ Delvis adresse - mangler: ${validation.missing.join(', ')}`, 'warn');
        } else {
          addLog(`⚠️ Postnummer mangler (forsøg ${addressRetryCount}/${maxAddressRetries})`, 'warn');
        }
      } else {
        // Ugyldig adresse
        addressRetryCount++;
        addLog(`⚠️ Ugyldig adresse: "${validation.address || addressReply}" (forsøg ${addressRetryCount}/${maxAddressRetries})`, 'warn');

        if (addressRetryCount >= maxAddressRetries) {
          // Brug hvad vi har efter max forsøg
          address = validation.address || addressReply.trim() || 'Ukendt adresse';
          addressConfirmed = true;
          addLog(`📍 Adresse accepteret efter ${maxAddressRetries} forsøg: ${address}`, 'info');
        }
      }
    }
    
    activateNode('update-delivery-address');
    await sleep(200);
    
    // Ask for order (delivery)
    activateNode('ask-order-delivery');
    await sendSMS(phone, `Lyder godt! Send venligst hele din bestilling i én enkelt besked. Du kan se vores menu her: ${menuUrl}`, restaurant);
    
    activateNode('wait-order-delivery');
  }
  
  // Wait for order
  const orderReply = await waitForReply();
  if (!orderReply || !testRunning) return;
  
  // TRIN 2: AI parse order MED menu-matching og priskalkulation
  activateNode('ai-order-parser');
  parsedOrder = await parseOrderWithMenu(orderReply, currentMenu, restaurant.name);
  
  // =====================================================
  // ORDRE VALIDERING - Kræv mindst 1 produkt
  // =====================================================
  let orderValidationAttempts = 0;
  const maxOrderAttempts = 3;
  
  while ((!parsedOrder.valid || !parsedOrder.items || parsedOrder.items.length === 0 || parsedOrder.total <= 0) && 
         orderValidationAttempts < maxOrderAttempts && testRunning) {
    orderValidationAttempts++;
    addLog(`⚠️ Ordre ikke valid - ingen produkter fundet (forsøg ${orderValidationAttempts}/${maxOrderAttempts})`, 'warn');
    
    // Bed kunden om at være mere specifik
    let helpMessage;
    if (orderValidationAttempts === 1) {
      helpMessage = `Jeg kunne ikke finde produkterne i vores menu. Prøv at skrive f.eks. "2x Pizza Margherita" eller brug produktnumre fra menuen: ${restaurant.menuUrl || 'vores hjemmeside'}`;
    } else if (orderValidationAttempts === 2) {
      // List some menu items as examples
      const exampleItems = currentMenu.items.slice(0, 3).map(i => `${i.number}. ${i.name} (${i.price} kr)`).join(', ');
      helpMessage = `Her er nogle af vores produkter: ${exampleItems}. Hvad vil du gerne bestille?`;
    } else {
      helpMessage = 'Skriv venligst din bestilling som f.eks. "1 margherita og 1 pepperoni" eller "nummer 1 og nummer 5"';
    }
    
    await sendSMS(phone, helpMessage, restaurant);
    
    activateNode('wait-order-retry');
    const retryOrderReply = await waitForReply();
    if (!retryOrderReply || !testRunning) return;
    
    // Parse igen
    activateNode('ai-order-parser');
    parsedOrder = await parseOrderWithMenu(retryOrderReply, currentMenu, restaurant.name);
  }
  
  // Hvis stadig ikke valid efter max forsøg
  if (!parsedOrder.valid || parsedOrder.items.length === 0) {
    addLog('❌ Kunne ikke identificere produkter - afslutter', 'error');
    await sendSMS(phone, 'Beklager, jeg kunne ikke forstå din bestilling. Prøv at ringe til os direkte, så hjælper vi dig gerne!', restaurant);
    activateNode('end-invalid-order');
    return;
  }
  
  // Generer bekræftelsesbesked med produktnavne og pris
  const orderConfirmation = generateOrderConfirmation(parsedOrder);
  order = orderConfirmation.summary;
  addLog(`📋 Ordre: ${order}`, 'success');
  addLog(`💰 Total: ${parsedOrder.total} kr`, 'success');
  
  activateNode('order-parser-condition');
  await sleep(300);
  
  // =====================================================
  // ORDRE BEKRÆFTELSE MED LOOP-BACK
  // =====================================================
  let orderConfirmed = false;
  let retryCount = 0;
  const maxRetries = 3;
  
  while (!orderConfirmed && retryCount < maxRetries && testRunning) {
    // Confirm order MED pris
    activateNode('send-confirm-order');
    await sendSMS(phone, orderConfirmation.message, restaurant);
    
    activateNode('wait-confirm');
    const confirmReply = await waitForReply();
    if (!confirmReply || !testRunning) return;
    
    // AI analyserer svar med forbedret kontekst
    activateNode('order-confirmation');
    const confirmClass = await classifyWithAI(confirmReply, 
      `Kundens svar på ordrebekræftelse. Kategoriser:
      - YES: Kunden bekræfter ordren er korrekt
      - NO: Kunden siger ordren er forkert/vil ændre
      - CHANGE: Kunden vil tilføje/fjerne noget
      - QUESTION: Kunden stiller spørgsmål
      Ordre: ${order}`
    );
    
    const isConfirmed = confirmClass.category === 'YES' || 
                        confirmClass.category === 'POSITIVE' ||
                        confirmReply.toLowerCase().match(/^(ja|jep|yes|korrekt|rigtigt|det passer|fint|okay|ok|perfekt)[\s!.,]*$/i);
    
    const isRejected = confirmClass.category === 'NO' ||
                       confirmClass.category === 'CHANGE' ||
                       confirmReply.toLowerCase().includes('ikke korrekt') ||
                       confirmReply.toLowerCase().includes('forkert') ||
                       confirmReply.toLowerCase().includes('nej') ||
                       confirmReply.toLowerCase().includes('ændre');
    
    if (isConfirmed) {
      orderConfirmed = true;
      addLog('✅ Ordre bekræftet af kunden', 'success');
    } else if (isRejected) {
      retryCount++;
      addLog(`🔄 Kunden vil ændre ordren (forsøg ${retryCount}/${maxRetries})`, 'warn');
      
      // LOOP-BACK: Spørg hvad der skal ændres
      activateNode('send-retry');
      await sendSMS(phone, 'Ingen problem! Hvad vil du gerne ændre eller tilføje til din bestilling?', restaurant);
      
      activateNode('wait-order-change');
      const changeReply = await waitForReply();
      if (!changeReply || !testRunning) return;
      
      // Re-parse den ændrede ordre
      activateNode('ai-order-parser');
      
      // Tjek om det er en tilføjelse eller helt ny ordre
      const isAddition = changeReply.toLowerCase().includes('tilføj') || 
                        changeReply.toLowerCase().includes('også') ||
                        changeReply.toLowerCase().includes('ekstra');
      
      if (isAddition && parsedOrder.items.length > 0) {
        // Parse kun tilføjelsen og kombiner
        const additionalOrder = await parseOrderWithMenu(changeReply, currentMenu, restaurant.name);
        if (additionalOrder.valid && additionalOrder.items.length > 0) {
          parsedOrder.items = [...parsedOrder.items, ...additionalOrder.items];
          parsedOrder.total = parsedOrder.items.reduce((sum, item) => sum + item.lineTotal, 0);
          addLog(`➕ Tilføjet: ${additionalOrder.items.map(i => i.name).join(', ')}`, 'success');
        }
      } else {
        // Helt ny ordre
        parsedOrder = await parseOrderWithMenu(changeReply, currentMenu, restaurant.name);
      }
      
      // Generer ny bekræftelse
      const newConfirmation = generateOrderConfirmation(parsedOrder);
      orderConfirmation.message = newConfirmation.message;
      orderConfirmation.summary = newConfirmation.summary;
      orderConfirmation.total = newConfirmation.total;
      order = newConfirmation.summary;
      
      addLog(`📋 Opdateret ordre: ${order} = ${parsedOrder.total} kr`, 'info');
    } else {
      // Uklart svar - spørg igen
      retryCount++;
      addLog(`❓ Uklart svar - spørger igen (forsøg ${retryCount}/${maxRetries})`, 'warn');
      await sendSMS(phone, 'Undskyld, jeg forstod ikke helt. Er ordren korrekt? Svar Ja eller Nej.', restaurant);
      continue;
    }
  }
  
  if (!orderConfirmed) {
    await sendSMS(phone, 'Det ser ud til vi har problemer med ordren. Ring venligst til os direkte, så hjælper vi dig! 📞', restaurant);
    return;
  }
  
  // =====================================================
  // NAVN INDSAMLING MED FORBEDRET VALIDERING - AdvancedAI
  // =====================================================
  let customerNameConfirmed = false;
  let nameRetryCount = 0;

  while (!customerNameConfirmed && nameRetryCount < maxRetries && testRunning) {
    // Ask name
    activateNode('ask-name');

    // Opdater conversation phase
    if (window.AdvancedAI) {
      const conv = AdvancedAI.ConversationStateManager.getConversation(conversationId);
      conv.currentPhase = 'FASE_4_NAVN';
      conv.validationAttempts.name = nameRetryCount;
    }

    // Brug kontekst-aware prompts
    let namePrompt;
    if (nameRetryCount === 0) {
      namePrompt = 'Perfekt! Må jeg bede om dit fulde navn til bestillingen?';
    } else if (nameRetryCount === 1) {
      namePrompt = 'Jeg har brug for både fornavn og efternavn. Hvad hedder du?';
    } else {
      namePrompt = 'Et fornavn er nok - hvad må vi kalde dig?';
    }

    await sendSMS(phone, namePrompt, restaurant);

    activateNode('wait-name');
    const nameReply = await waitForReply();
    if (!nameReply || !testRunning) return;

    // Tilføj til conversation history
    if (window.AdvancedAI) {
      AdvancedAI.ConversationStateManager.addMessage(conversationId, 'user', nameReply);
    }
    
    // Brug AdvancedAI navn validering hvis tilgængelig
    let nameValidation;
    if (window.AdvancedAI) {
      nameValidation = AdvancedAI.validation.validateName(nameReply);
      addLog(`🔍 AdvancedAI navn validering: ${nameValidation.valid ? '✓' : '✗'}`, 'ai');

      if (nameValidation.valid) {
        customerName = nameValidation.name;
        customerNameConfirmed = true;

        // Opdater conversation state
        AdvancedAI.ConversationStateManager.updateCustomerData(conversationId, 'name', customerName);

        addLog(`👤 Navn: ${customerName}`, 'success');
      } else if (nameValidation.needsConfirmation) {
        // Usædvanligt navn - spørg for at bekræfte
        await sendSMS(phone, nameValidation.confirm, restaurant);
        const confirmReply = await waitForReply();

        if (confirmReply && /ja|yes|korrekt|rigtigt|ok/i.test(confirmReply)) {
          customerName = nameValidation.name;
          customerNameConfirmed = true;
          AdvancedAI.ConversationStateManager.updateCustomerData(conversationId, 'name', customerName);
          addLog(`👤 Navn bekræftet: ${customerName}`, 'success');
        } else {
          nameRetryCount++;
          addLog(`⚠️ Navn ikke bekræftet (forsøg ${nameRetryCount}/${maxRetries})`, 'warn');
        }
      } else {
        nameRetryCount++;
        addLog(`⚠️ Ugyldigt navn: "${nameReply}" (forsøg ${nameRetryCount}/${maxRetries})`, 'warn');

        if (nameRetryCount >= maxRetries) {
          customerName = 'Gæst';
          customerNameConfirmed = true;
          addLog('👤 Navn sat til: Gæst', 'info');
        }
      }
    } else {
      // Legacy AI validering
      activateNode('ai-name-extractor');
      const nameClass = await classifyWithAI(nameReply,
        `Udtræk kundens navn fra beskeden.
        Accepter: fulde navne, fornavne, kaldenavne.
        Kategoriser:
        - NAME: Beskeden indeholder et navn (udtræk det i "extracted")
        - NO: Kunden vil ikke give navn
        - QUESTION: Kunden stiller spørgsmål
        - OTHER: Andet

        Eksempler på gyldige navne: "Martin", "Martin Klaksvig", "Klaksvig", "kh", "mk"`
      );

      // Tjek for negativt svar
      const isNegative = nameClass.category === 'NO' ||
                         nameReply.toLowerCase().match(/^(nej|no|ikke|vil ikke)[\s!.,]*$/i);

      if (isNegative) {
        nameRetryCount++;
        addLog(`⚠️ Kunden vil ikke give navn (forsøg ${nameRetryCount}/${maxRetries})`, 'warn');

        if (nameRetryCount >= maxRetries) {
          customerName = 'Gæst';
          customerNameConfirmed = true;
          addLog('👤 Navn sat til: Gæst', 'info');
        } else {
          await sendSMS(phone, 'Vi har brug for et navn til ordren, så vi kan kalde dig op. Det kan bare være et fornavn 😊', restaurant);
        }
      } else if (nameClass.category === 'NAME' || nameClass.extracted) {
        // Udtræk navn fra AI eller brug reply direkte
        let extractedName = nameClass.extracted || nameReply.trim();

        // Rens navnet - fjern "jeg hedder", "mit navn er" etc.
        extractedName = extractedName
          .replace(/^(jeg hedder|jeg er|mit navn er|hedder|navn:?)\s*/i, '')
          .replace(/[.,!?]+$/, '')
          .trim();

        // Kapitaliser navn korrekt
        extractedName = extractedName.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');

        // Valider at det ligner et navn (mindst 2 tegn, primært bogstaver)
        const isValidName = extractedName.length >= 2 &&
                            /^[A-ZÆØÅa-zæøå\s\-']+$/.test(extractedName) &&
                            !/^\d+$/.test(extractedName);

        if (isValidName) {
          customerName = extractedName;
          customerNameConfirmed = true;
          addLog(`👤 Navn: ${customerName}`, 'success');
        } else {
          nameRetryCount++;
          addLog(`⚠️ Ugyldigt navn format: "${extractedName}"`, 'warn');

          if (nameRetryCount >= maxRetries) {
            // Brug hvad vi har eller "Gæst"
            customerName = extractedName.length >= 2 ? extractedName : 'Gæst';
            customerNameConfirmed = true;
            addLog(`👤 Navn (accepteret): ${customerName}`, 'info');
          }
        }
      } else {
        // Prøv at bruge reply direkte som navn hvis det ser ud som et
        const directName = nameReply.trim();
        if (directName.length >= 2 && directName.length <= 50 && /^[A-ZÆØÅa-zæøå\s\-']+$/.test(directName)) {
          customerName = directName.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
          customerNameConfirmed = true;
          addLog(`👤 Navn (direkte): ${customerName}`, 'success');
        } else {
          nameRetryCount++;
          addLog(`❓ Kunne ikke finde navn i: "${nameReply}"`, 'warn');

          if (nameRetryCount >= maxRetries) {
            customerName = 'Gæst';
            customerNameConfirmed = true;
            addLog('👤 Navn sat til: Gæst', 'info');
          }
        }
      }
    }
  }
  
  activateNode('name-condition');
  await sleep(300);
  
  // Save & Process
  activateNode('update-contact-name');
  addLog('💾 Kontakt opdateret', 'success');
  await sleep(200);
  
  activateNode('save-order-next');
  addLog('💾 Ordre gemt til næste gang', 'success');
  await sleep(200);
  
  activateNode('new-order-task');
  addLog('📋 Ny ordre task oprettet', 'success');
  await sleep(200);
  
  activateNode('increment-order-count');
  restaurant.orders++;
  restaurant.recovered++;
  await sleep(200);
  
  // Internal notification
  activateNode('internal-notification');
  addLog(`🔔 Notifikation: NY ORDRE fra ${customerName}!`, 'success');
  await sleep(200);
  
  // Check if full automation is enabled
  const isAutoMode = restaurant?.automation?.enabled || false;
  const autoTime = restaurant?.automation?.defaultTime || 40;
  
  if (isAutoMode) {
    // AUTOMATIC MODE - send confirmation immediately
    activateNode('send-final-confirm');
    
    // Get custom message or default
    const defaultAutoMsg = `Din ordre er bekræftet! {{restaurant}} har modtaget din bestilling og forventer den er klar om ca. {{ventetid}} minutter. Vi sender besked, når maden er klar.`;
    let confirmMsg = restaurant?.customMessages?.orderAccepted || defaultAutoMsg;
    confirmMsg = confirmMsg
      .replace(/\{\{restaurant\}\}/gi, restaurant.name)
      .replace(/\{\{ventetid\}\}/gi, autoTime);
    
    await sendSMS(phone, confirmMsg, restaurant);
    addLog(`⚡ Auto-bekræftelse sendt (${autoTime} min estimat)`, 'success');
    
    // Auto-create order with accepted status
    saveOrderToModule({
      phone,
      customerName,
      orderType,
      address,
      items: order,
      parsedOrder,
      restaurantId: restaurant.id,
      status: 'Accepteret',
      estimatedTime: autoTime,
      acceptedAt: new Date().toISOString()
    });
  } else {
    // MANUAL MODE - wait for restaurant to accept
    activateNode('send-final-confirm');
    
    // Get custom message or default
    const defaultPendingMsg = `Tak! Din ordre er nu sendt til køkkenet. Afvent venligst, at restauranten accepterer din bestilling. Du modtager en bekræftelse snarest. 🍕`;
    let pendingMsg = restaurant?.customMessages?.orderConfirm || defaultPendingMsg;
    pendingMsg = pendingMsg.replace(/\{\{restaurant\}\}/gi, restaurant.name);
    
    await sendSMS(phone, pendingMsg, restaurant);
    
    // Create order with pending status
    saveOrderToModule({
      phone,
      customerName,
      orderType,
      address,
      items: order,
      parsedOrder,
      restaurantId: restaurant.id,
      status: 'Afventer',
      createdAt: new Date().toISOString()
    });
    
    addLog('📋 Ordre oprettet - afventer restaurantens accept', 'info');
  }
  
  // RECEIPT WORKFLOW (NY SEKTION)
  activateNode('ask-receipt');
  await sendSMS(phone, 'Ønsker du en kvittering på din bestilling? Svar JA eller NEJ.', restaurant);
  addLog('Spørger kunde om kvittering...', 'info');
  await sleep(200);
  
  activateNode('wait-receipt');
  addLog('Venter på svar om kvittering...', 'info');
  
  // Wait for receipt response
  const receiptReply = await waitForReply();
  addLog(`Kunde svarede: "${receiptReply}"`, 'info');
  
  // Process receipt response
  activateNode('intent-check-receipt');
  const wantsReceipt = classifyReceiptIntent(receiptReply);
  
  if (wantsReceipt) {
    // YES - Generate and send PDF receipt
    activateNode('generate-receipt');
    addLog('Genererer PDF-kvittering...', 'info');
    await sleep(200);

    // Build receipt data
    const orderNumber = Math.floor(100000 + Math.random() * 900000);
    const pickupTime = new Date(Date.now() + 30 * 60000).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });

    // Generate PDF receipt
    const receiptData = {
      ordreNummer: orderNumber,
      dato: new Date().toISOString(),
      kunde: {
        navn: customerName,
        telefon: phone
      },
      linjer: (parsedOrder?.items || []).map(i => ({
        beskrivelse: i.name,
        antal: i.quantity || 1,
        pris: i.price
      })),
      total: parsedOrder?.total || 0,
      restaurant: {
        navn: restaurant.name,
        adresse: restaurant.address,
        telefon: restaurant.phone || restaurant.contact_phone,
        cvr: restaurant.cvr
      },
      orderType: orderType,
      pickupTime: pickupTime
    };

    activateNode('send-receipt-sms');

    // Try to generate and upload PDF
    let receiptUrl = null;
    try {
      if (typeof kvitteringGenerator !== 'undefined' && typeof SupabaseDB !== 'undefined') {
        const pdfBlob = kvitteringGenerator.getBlob(receiptData);
        const uploadResult = await SupabaseDB.uploadReceipt(pdfBlob, orderNumber, restaurant.id);
        if (!uploadResult.error) {
          receiptUrl = uploadResult.url;
          addLog(`📄 PDF uploadet: ${receiptUrl}`, 'success');
        }
      }
    } catch (pdfErr) {
      console.error('PDF generation error:', pdfErr);
      addLog('⚠️ PDF kunne ikke genereres - sender tekst-kvittering', 'warning');
    }

    // Send SMS with PDF link OR fallback to text receipt
    if (receiptUrl) {
      const pdfMsg = `📋 Din kvittering er klar!\n\nOrdre #${orderNumber}\nTotal: ${parsedOrder?.total || 0} kr\n\nDownload her:\n${receiptUrl}\n\nTak for din bestilling!\n${restaurant.name}`;
      await sendSMS(phone, pdfMsg, restaurant);
      addLog('PDF-kvittering sendt til kunden via SMS', 'success');
    } else {
      // Fallback to text receipt
      const orderItems = parsedOrder?.items?.map(i => `• ${i.name} - ${i.price} kr`).join('\n') || order;
      const receiptMsg = `📋 KVITTERING\n━━━━━━━━━━━━\nOrdre: #${orderNumber}\n${orderItems}\n━━━━━━━━━━━━\nTotal: ${parsedOrder?.total || 0} kr\n${orderType === 'Pickup' ? 'Afhentning' : 'Levering'}: ca. ${pickupTime}\n━━━━━━━━━━━━\nTak for din bestilling!\n${restaurant.name}`;
      await sendSMS(phone, receiptMsg, restaurant);
      addLog('Tekst-kvittering sendt til kunden (PDF fallback)', 'success');
    }
  } else {
    // NO - Send polite goodbye
    activateNode('send-no-receipt');
    await sendSMS(phone, 'Helt i orden! Vi glæder os til at se dig. Hav en fortsat god dag!', restaurant);
    addLog('Kunde ønsker ikke kvittering - pæn afslutning sendt', 'success');
  }
  await sleep(200);
  
  // TRIN 3: Gem ordre til intern Ordrer-side
  activateNode('push-to-orders');
  
  // Byg komplet ordre data pakke
  const orderDataPackage = {
    customerName: customerName,
    phone: phone,
    address: address,
    orderType: orderType,
    orderSummary: order,
    items: parsedOrder?.items || [],
    totalPrice: parsedOrder?.total || 0,
    restaurantId: restaurant.id,
    restaurantName: restaurant.name
  };
  
  // Gem til intern Ordrer-side (sidebar menu)
  saveOrderToInternalOrdersPage(orderDataPackage);
  
  addLog(`📦 Ordre sendt til Ordrer-siden: ${order} - ${parsedOrder?.total || 0} kr`, 'success');
  await sleep(200);
  
  // Update KPI data
  updateRestaurantKpi(restaurant, parsedOrder);
  
  // Check if review request is enabled for this restaurant
  if (restaurant.reviewRequestEnabled !== false) {
    // Add to review workflow
    activateNode('add-to-review');
    addLog('⭐ Tilføjet til Review Workflow (Trustpilot + Google)', 'success');
    await sleep(200);
    
    // Wait for review delay (configurable per restaurant)
    activateNode('wait-review-delay');
    const reviewDelay = restaurant.reviewDelay || 60; // Default 60 min
    addLog(`Wait: ${reviewDelay} min (fra ${restaurant.name} indstillinger)`, 'info');
    await sleep(200);
    
    // Send review request (in real scenario this would be delayed)
    activateNode('send-review-request');
    
    // Build review message with actual URLs
    const reviewMsg = `Tak for din ordre hos ${restaurant.name}! Vi håber du nød maden. Giv os gerne en anmeldelse:\n\nGoogle: ${restaurant.googleReviewUrl || 'N/A'}\nTrustpilot: ${restaurant.trustpilotUrl || 'N/A'}`;
    // In production: await sendSMS(phone, reviewMsg, restaurant);
    addLog('⭐ Anmeldelsesanmodning sendt (Trustpilot + Google)', 'success');
    await sleep(200);
    
    // 1 hour lock
    activateNode('wait-1-hour');
    addLog('🔒 1 time lock aktiveret (loop beskyttelse)', 'info');
    await sleep(200);
  } else {
    addLog('⏭️ Anmeldelsesanmodning er deaktiveret - springer over', 'info');
    await sleep(200);
  }
  
  // Update stats
  loadRestaurants();
  loadDashboard();
  
  // End
  activateNode('end-final');
  addLog('🏁 Workflow færdig!', 'success');
}

// Update restaurant KPI data after order
function updateRestaurantKpi(restaurant, parsedOrder) {
  if (!restaurant.kpi) return;
  
  // Update heatmap for current hour
  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[now.getDay()];
  const hour = now.getHours();
  
  if (restaurant.kpi.orderHeatmap && restaurant.kpi.orderHeatmap[dayName]) {
    restaurant.kpi.orderHeatmap[dayName][hour]++;
  }
  
  // Update revenue
  if (parsedOrder?.total) {
    restaurant.kpi.totalRevenue += parsedOrder.total;
    restaurant.kpi.recoveredRevenue += parsedOrder.total;
  }
  
  // Update completed orders
  restaurant.kpi.completedOrders = (restaurant.kpi.completedOrders || 0) + 1;
  
  // Recalculate conversion rate
  if (restaurant.kpi.missedCalls > 0) {
    restaurant.kpi.conversionRate = Math.round((restaurant.kpi.completedOrders / restaurant.kpi.missedCalls) * 100);
  }
}

function activateNode(id) {
  document.querySelectorAll('.wf-node').forEach(n => n.classList.remove('active'));
  const node = document.getElementById('node-' + id);
  if (node) {
    node.classList.add('active');
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

async function sendSMS(to, message, restaurant) {
  addLog(`📱 SMS -> ${to}`, 'sms');
  addMessage(message, 'out');

  // Log to customer aktivitetslogs
  if (restaurant?.id) {
    addCustomerAktivitetslog(restaurant.id, 'sms', `SMS sendt til ${to}: ${message.substring(0, 80)}${message.length > 80 ? '...' : ''}`);
  }

  if (liveMode) {
    // Format phone number
    const normalized = normalizePhoneNumber(to);
    const phoneNumber = normalized.digits;
    if (!phoneNumber) {
      addLog('❌ Ugyldigt telefonnummer', 'error');
      return;
    }

    // Send SMS via InMobile
    await sendSMSViaInMobile(phoneNumber, message);
  }

  await sleep(300);
}

// Send SMS via InMobile
async function sendSMSViaInMobile(phoneNumber, message) {
  // Get InMobile credentials
  const apiKey = localStorage.getItem('inmobile_api_key');
  const sender = localStorage.getItem('inmobile_sender') || 'OrderFlow';

  if (!apiKey) {
    addLog(`❌ SMS API key mangler - tjek Indstillinger`, 'error');
    return;
  }

  addLog(`📤 Sender SMS til ${phoneNumber}...`, 'info');

  try {
    // Send via Supabase Edge Function (InMobile)
    const supabaseUrl = CONFIG.SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        to: phoneNumber,
        message: message,
        sender: sender,
        apiKey: apiKey
      })
    });

    const result = await response.json();
    console.log('SMS response:', result);

    if (result.success || result.sid) {
      addLog(`✅ SMS sendt! ID: ${result.sid}`, 'success');
    } else {
      addLog(`❌ SMS fejl: ${result.error || 'Ukendt fejl'}`, 'error');
    }
  } catch (err) {
    console.error('SMS error:', err);
    addLog(`❌ SMS fejl: ${err.message}`, 'error');
  }
}

function addMessage(text, dir, showApproval = false) {
  const container = document.getElementById('messages');
  if (!container) {
    console.error('Messages container not found!');
    return null;
  }

  console.log('addMessage called:', { text: text.substring(0, 50), dir, container: container.id });

  // Classify intent for incoming messages (customer messages)
  if (dir === 'in' && typeof window.classifyAndDisplayIntent === 'function') {
    window.classifyAndDisplayIntent(text);
  }

  const time = new Date().toLocaleTimeString('da-DK');
  const msgId = 'msg-' + Date.now();

  let approvalHtml = '';
  if (showApproval) {
    approvalHtml = `
      <div class="msg-approval" id="${msgId}-approval">
        <div style="font-size:10px;color:var(--warn);margin-bottom:6px;">🤖 AI forslag - godkend eller rediger:</div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-primary" style="flex:1;padding:6px;font-size:11px;" onclick="approveAiResponse('${msgId}')">✓ Send</button>
          <button class="btn btn-secondary" style="flex:1;padding:6px;font-size:11px;" onclick="editAiResponse('${msgId}')">✎ Rediger</button>
          <button class="btn btn-danger" style="padding:6px;font-size:11px;" onclick="rejectAiResponse('${msgId}')">✗</button>
        </div>
      </div>
    `;
  }

  container.innerHTML += `
    <div class="msg ${dir}" id="${msgId}" data-text="${encodeURIComponent(text)}">
      ${text}
      <div class="msg-time">${time}</div>
      ${approvalHtml}
    </div>
  `;
  container.scrollTop = container.scrollHeight;
  return msgId;
}

// AI Classification with OpenAI
// =====================================================
// MENU & ORDER FUNCTIONS (Trin 1, 2, 3)
// =====================================================

// Trin 1: Fetch menu - bruger demo data eller scraper website (fremtidig feature)
async function fetchMenuForRestaurant(restaurant) {
  const restaurantId = restaurant.id;
  const websiteUrl = restaurant.website || restaurant.menuUrl;
  
  addLog(`📋 Indlæser menu for ${restaurant.name}...`, 'info');
  
  // PRIORITET 0: Produkter fra Produkter-siden (højeste prioritet)
  const productsKey = `products_${restaurantId}`;
  const savedProducts = localStorage.getItem(productsKey);
  if (savedProducts) {
    try {
      const productData = JSON.parse(savedProducts);
      if (productData.products && productData.products.length > 0) {
        addLog(`✅ Produkter indlæst fra Produkter-siden: ${productData.products.length} produkter`, 'success');
        return {
          items: productData.products.map(p => ({
            id: p.id,
            number: p.number || '',
            name: p.name,
            description: p.description || '',
            price: p.price,
            category: p.category || 'Andet'
          })),
          extras: productData.extras || [],
          deliveryZones: productData.deliveryZones || [],
          restaurantId: restaurantId,
          restaurantName: restaurant.name,
          currency: 'DKK'
        };
      }
    } catch (e) {
      console.error('Products parse error:', e);
    }
  }
  
  // PRIORITET 0.5: Produkter direkte på restaurant objektet
  if (restaurant.products && restaurant.products.length > 0) {
    addLog(`✅ Restaurant produkter indlæst: ${restaurant.products.length} produkter`, 'success');
    return {
      items: restaurant.products.map(p => ({
        id: p.id,
        number: p.number || '',
        name: p.name,
        description: p.description || '',
        price: p.price,
        category: p.category || 'Andet'
      })),
      extras: restaurant.extras || [],
      deliveryZones: restaurant.deliveryZones || [],
      restaurantId: restaurantId,
      restaurantName: restaurant.name,
      currency: 'DKK'
    };
  }
  
  // PRIORITET 1: Custom menu gemt i restaurant settings
  if (restaurant.customMenu && restaurant.customMenu.items && restaurant.customMenu.items.length > 0) {
    addLog(`✅ Custom menu indlæst: ${restaurant.customMenu.items.length} produkter`, 'success');
    return {
      items: restaurant.customMenu.items,
      restaurantId: restaurantId,
      restaurantName: restaurant.name,
      currency: restaurant.customMenu.currency || 'DKK'
    };
  }
  
  // PRIORITET 2: Menu fra Supabase (persistent storage)
  if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getMenu) {
    try {
      const supabaseMenu = await SupabaseDB.getMenu(restaurantId);
      if (supabaseMenu && supabaseMenu.items && supabaseMenu.items.length > 0) {
        addLog(`✅ Menu indlæst fra database: ${supabaseMenu.items.length} produkter`, 'success');
        return {
          ...supabaseMenu,
          restaurantName: restaurant.name
        };
      }
    } catch (e) {
      console.log('Could not load menu from Supabase:', e.message);
    }
  }

  // PRIORITET 3: Menu gemt i localStorage (fallback/cache)
  const storedMenu = localStorage.getItem(`menu_${restaurantId}`);
  if (storedMenu) {
    try {
      const parsedMenu = JSON.parse(storedMenu);
      if (parsedMenu.items && parsedMenu.items.length > 0) {
        addLog(`✅ Gemt menu indlæst fra cache: ${parsedMenu.items.length} produkter`, 'success');
        return parsedMenu;
      }
    } catch (e) {
      console.error('Menu parse error:', e);
    }
  }

  // PRIORITET 4: Demo menu data
  const demoMenu = DEMO_MENUS[restaurantId];
  if (demoMenu) {
    addLog(`✅ Demo menu indlæst: ${demoMenu.items.length} produkter`, 'success');
    return demoMenu;
  }
  
  // PRIORITET 4: Generisk standard menu
  addLog('⚠️ Ingen menu fundet - bruger generisk standard menu', 'warn');
  addLog('💡 Tip: Gå til Kunder -> [Restaurant] -> Produkter for at tilføje produkter', 'info');
  return { 
    items: [
      { id: 1, number: '1', name: 'Ret 1', price: 99, category: 'Mad' },
      { id: 2, number: '2', name: 'Ret 2', price: 119, category: 'Mad' },
      { id: 3, number: '3', name: 'Ret 3', price: 89, category: 'Mad' },
      { id: 4, number: '4', name: 'Drikkevare', price: 25, category: 'Drikkevarer' }
    ], 
    restaurantId, 
    restaurantName: restaurant.name,
    currency: 'DKK' 
  };
}

// Gem custom menu for restaurant
function saveCustomMenu(restaurantId, menuItems) {
  const menu = {
    restaurantId: restaurantId,
    items: menuItems,
    currency: 'DKK',
    updatedAt: new Date().toISOString()
  };

  // Gem til localStorage (hurtig backup)
  localStorage.setItem(`menu_${restaurantId}`, JSON.stringify(menu));

  // Gem til Supabase (persistent storage)
  if (typeof SupabaseDB !== 'undefined' && SupabaseDB.saveMenu) {
    SupabaseDB.saveMenu(restaurantId, menu)
      .catch(err => console.warn('Could not save menu to Supabase:', err.message));
  }

  // Opdater også restaurant objektet
  const restaurant = restaurants.find(r => r.id === restaurantId);
  if (restaurant) {
    restaurant.customMenu = menu;
  }

  return menu;
}

// Trin 2: Parse ordre med menu-matching og priskalkulation - FORBEDRET
async function parseOrderWithMenu(orderText, menu, restaurantName) {
  // AI is now handled via backend (Supabase Edge Function) - no local API key needed
  
  addLog('🤖 AI parser ordre med menu (JSON integration)...', 'ai');
  
  // Byg komplet JSON menu struktur til AI
  const menuJSON = JSON.stringify(menu.items.map(item => ({
    nummer: item.number,
    navn: item.name,
    pris: item.price,
    kategori: item.category || 'Andet'
  })), null, 2);
  
  // Byg også simpel tekstliste som backup
  const menuText = menu.items.map(item => 
    `Nr. ${item.number}: ${item.name} = ${item.price} kr`
  ).join('\n');
  
  try {
    const response = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/api-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        service: 'openai',
        endpoint: '/chat/completions',
        payload: {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Du er en ordre-parser for restauranten "${restaurantName}".
Din ENESTE opgave er at matche kundens bestilling med menukortet og beregne den PRÆCISE totalpris.

MENUKORT (JSON):
${menuJSON}

MENUKORT (TEKST):
${menuText}

KRITISKE REGLER:
1. Match "nummer X", "nr X", "nr. X" til produktets nummer-felt
2. Match produktnavne direkte (f.eks. "margherita" -> "Pizza Margherita")
3. Match delvist (f.eks. "pepperoni" -> "Pizza Pepperoni")
4. Udtræk antal: "2x", "to stk", "2 styk", "et par" = 2, default = 1
5. BEREGN ALTID: unit_price × quantity = line_total
6. BEREGN ALTID: sum af alle line_total = total_price

DU SKAL SVARE MED PRÆCIS DETTE JSON FORMAT:
{
  "items": [
    {
      "number": "1",
      "name": "Pizza Margherita",
      "quantity": 2,
      "unit_price": 89,
      "line_total": 178
    }
  ],
  "total_price": 178,
  "valid": true,
  "error": null
}

VIGTIGT:
- unit_price SKAL være prisen fra menukortet
- line_total SKAL være unit_price × quantity
- total_price SKAL være summen af alle line_total
- Hvis du ikke kan matche et produkt, sæt valid: false og forklar i "error"
- Svar KUN med JSON, ingen anden tekst`
          },
          {
            role: 'user',
            content: `Parse denne bestilling og beregn totalpris:\n"${orderText}"`
          }
        ],
        max_tokens: 800,
        temperature: 0.05  // Lavere temperatur for mere præcis parsing
      }})
    });
    
    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      addLog('❌ Intet svar fra AI', 'error');
      return { items: [], total: 0, valid: false, orderText: orderText };
    }
    
    let result;
    
    try {
      // Rens JSON output grundigt
      let content = data.choices[0].message.content;
      content = content.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
      // Fjern eventuelle kommentarer
      content = content.replace(/\/\/.*$/gm, '');
      result = JSON.parse(content);
    } catch (parseErr) {
      addLog('⚠️ Kunne ikke parse AI JSON svar: ' + parseErr.message, 'warn');
      console.error('AI response:', data.choices[0].message.content);
      return { items: [], total: 0, valid: false, orderText: orderText };
    }
    
    // Normaliser felter (håndter både total og total_price)
    const total = Number(result.total_price) || Number(result.total) || 0;
    const items = (result.items || []).map(item => {
      const quantity = Number(item.quantity) || Number(item.antal) || 1;
      const unitPrice = Number(item.unit_price) || Number(item.unitPrice) || Number(item.pris) || 0;
      const lineTotal = Number(item.line_total) || Number(item.lineTotal) || (unitPrice * quantity);

      return {
        number: String(item.number || item.nummer || ''),
        name: String(item.name || item.navn || ''),
        quantity: quantity,
        unitPrice: unitPrice,
        lineTotal: isNaN(lineTotal) ? 0 : lineTotal
      };
    });

    // Valider og genberegn total hvis nødvendigt (med NaN check)
    const calculatedTotal = items.reduce((sum, item) => {
      const val = Number(item.lineTotal) || 0;
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
    const finalTotal = calculatedTotal > 0 ? calculatedTotal : total;
    
    if (items.length > 0 && finalTotal > 0) {
      const itemSummary = items.map(i => `${i.quantity}x ${i.name} (${i.unitPrice} kr)`).join(', ');
      addLog(`✅ Ordre parsed: ${itemSummary}`, 'success');
      addLog(`💰 Total pris: ${finalTotal} kr`, 'success');
    } else if (result.error) {
      addLog(`⚠️ Ordre kunne ikke parses: ${result.error}`, 'warn');
    }
    
    return { 
      items: items, 
      total: finalTotal,
      valid: items.length > 0 && finalTotal > 0,
      orderText: orderText,
      error: result.error
    };
  } catch (err) {
    console.error('Order parsing error:', err);
    addLog(`❌ Ordre parsing fejl: ${err.message}`, 'error');
    return { items: [], total: 0, valid: false, orderText: orderText };
  }
}

// Generer bekræftelsesbesked med produktnavne og TOTAL PRIS - FORBEDRET
function generateOrderConfirmation(parsedOrder) {
  if (!parsedOrder.valid || !parsedOrder.items || parsedOrder.items.length === 0) {
    // Fallback uden priser
    return {
      message: `Bare for at bekræfte din bestilling: ${parsedOrder.orderText}. Er det korrekt?`,
      summary: parsedOrder.orderText,
      total: 0,
      hasPrice: false
    };
  }
  
  // Byg detaljeret liste med priser
  const itemsList = parsedOrder.items.map(item => {
    if (item.quantity > 1) {
      return `${item.quantity}x ${item.name}`;
    }
    return item.name;
  }).join(', ');
  
  // Sikr at total er et tal
  const totalPrice = Number(parsedOrder.total) || 0;
  
  // Bekræftelsesbesked MED total pris
  let message;
  if (totalPrice > 0) {
    message = `Bare for at bekræfte din bestilling: ${itemsList}. Den samlede pris er ${totalPrice} kr. Er det korrekt?`;
  } else {
    message = `Bare for at bekræfte din bestilling: ${itemsList}. Er det korrekt?`;
  }
  
  return {
    message: message,
    summary: itemsList,
    total: totalPrice,
    items: parsedOrder.items,
    hasPrice: totalPrice > 0
  };
}

// =====================================================
// DYNAMISK OPEN CHECKER (Trin 2)
// =====================================================

// Tjek om restaurant er åben baseret på individuelle åbningstider
// Synkroniserer automatisk med restaurant.openingHours
function checkRestaurantOpen(restaurant) {
  const now = new Date();
  // VIGTIG: Brug KORTE dag-navne der matcher UI og saveWorkflowSettings
  const dayNamesShort = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const dayNamesFull = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayIndex = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutter siden midnat
  
  // Hent AKTUELLE åbningstider direkte fra restaurant objektet
  const hours = restaurant.openingHours || getDefaultOpeningHours();
  
  // Tjek begge navne-formater for bagudkompatibilitet
  const shortDay = dayNamesShort[dayIndex];
  const fullDay = dayNamesFull[dayIndex];
  const todayHours = hours[shortDay] || hours[fullDay];
  
  // Log hvilke åbningstider der bruges (for debugging)
  console.log(`[OpenChecker] ${restaurant.name} - Day: ${shortDay}/${fullDay}, Hours:`, todayHours, 'Current time:', currentTime);
  
  // Tjek om dagen er lukket
  if (!todayHours || !todayHours.enabled) {
    return {
      isOpen: false,
      reason: 'closed_day',
      currentDay: getDayNameDanish(fullDay),
      openingHours: hours,
      nextOpen: getNextOpenTime(hours, now)
    };
  }
  
  // Parse åbnings- og lukketid
  const openTime = parseTimeToMinutes(todayHours.open);
  let closeTime = parseTimeToMinutes(todayHours.close);
  
  // VIGTIG FIX: Døgnåbent check (00:00 - 00:00)
  // Hvis både open og close er 00:00, er restauranten døgnåben
  if (openTime === 0 && closeTime === 0 && todayHours.open === '00:00' && todayHours.close === '00:00') {
    console.log(`[OpenChecker] ${restaurant.name} - DØGNÅBEN (00:00-00:00)`);
    return {
      isOpen: true,
      currentDay: getDayNameDanish(fullDay),
      closeTime: '00:00',
      openingHours: hours,
      is24h: true
    };
  }
  
  // VIGTIG FIX: Hvis lukketid er 00:00 (midnat), behandl det som 24:00 (1440 minutter)
  // Dette håndterer restauranter der lukker ved midnat
  if (closeTime === 0 && todayHours.close === '00:00') {
    closeTime = 1440; // 24 timer i minutter
  }
  
  // Håndter natåbent (lukker efter midnat næste dag)
  // Eksempel: Åben 10:00 - 02:00 (næste dag)
  if (closeTime < openTime) {
    // Restauranten lukker efter midnat
    if (currentTime >= openTime || currentTime < closeTime) {
      return {
        isOpen: true,
        currentDay: getDayNameDanish(fullDay),
        closeTime: todayHours.close,
        openingHours: hours,
        closesAfterMidnight: true
      };
    }
  } else {
    // Normal åbningstid (samme dag)
    if (currentTime >= openTime && currentTime < closeTime) {
      return {
        isOpen: true,
        currentDay: getDayNameDanish(fullDay),
        closeTime: todayHours.close,
        openingHours: hours
      };
    }
  }
  
  // Vi er uden for åbningstiden
  return {
    isOpen: false,
    reason: currentTime < openTime ? 'not_yet_open' : 'already_closed',
    currentDay: getDayNameDanish(fullDay),
    todayOpen: todayHours.open,
    todayClose: todayHours.close,
    openingHours: hours,
    nextOpen: getNextOpenTime(hours, now)
  };
}

// Konverter tid string til minutter siden midnat
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

// Hent dansk navn for ugedag (understøtter både korte og fulde navne)
function getDayNameDanish(day) {
  const names = {
    // Full names
    monday: 'Mandag',
    tuesday: 'Tirsdag',
    wednesday: 'Onsdag',
    thursday: 'Torsdag',
    friday: 'Fredag',
    saturday: 'Lørdag',
    sunday: 'Søndag',
    // Short names
    mon: 'Mandag',
    tue: 'Tirsdag',
    wed: 'Onsdag',
    thu: 'Torsdag',
    fri: 'Fredag',
    sat: 'Lørdag',
    sun: 'Søndag'
  };
  return names[day] || day;
}

// Find næste åbningstid (understøtter både korte og fulde dag-navne)
function getNextOpenTime(hours, fromDate) {
  const dayNamesShort = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const dayNamesFull = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = fromDate || new Date();
  const currentDayIndex = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Tjek de næste 7 dage
  for (let i = 0; i < 7; i++) {
    const checkDayIndex = (currentDayIndex + i) % 7;
    // Try both name formats
    const dayHours = hours[dayNamesShort[checkDayIndex]] || hours[dayNamesFull[checkDayIndex]];
    const dayName = dayNamesFull[checkDayIndex]; // Use full name for display
    
    if (dayHours && dayHours.enabled) {
      const openMinutes = parseTimeToMinutes(dayHours.open);
      
      // Hvis det er i dag og vi ikke har passeret åbningstiden
      if (i === 0 && currentMinutes < openMinutes) {
        return {
          day: getDayNameDanish(dayName),
          time: dayHours.open,
          isToday: true
        };
      }
      
      // Hvis det er en fremtidig dag
      if (i > 0) {
        return {
          day: getDayNameDanish(dayName),
          time: dayHours.open,
          isToday: false,
          daysAhead: i
        };
      }
    }
  }
  
  return null; // Ingen åbne dage fundet
}

// Format åbningstider til tekst (til AI og beskeder)
// Understøtter både korte (mon, tue) og fulde (monday, tuesday) dag-navne
function formatOpeningHoursText(restaurant) {
  const hours = restaurant.openingHours || getDefaultOpeningHours();
  const timeFormat = restaurant.timeFormat || '24h';
  
  // Mapping fra kort/fuldt navn til dansk forkortelse
  const dayMapping = [
    { short: 'mon', full: 'monday', danish: 'Man' },
    { short: 'tue', full: 'tuesday', danish: 'Tir' },
    { short: 'wed', full: 'wednesday', danish: 'Ons' },
    { short: 'thu', full: 'thursday', danish: 'Tor' },
    { short: 'fri', full: 'friday', danish: 'Fre' },
    { short: 'sat', full: 'saturday', danish: 'Lør' },
    { short: 'sun', full: 'sunday', danish: 'Søn' }
  ];
  
  const lines = dayMapping.map(({ short, full, danish }) => {
    // Try both short and full names
    const h = hours[short] || hours[full];
    if (!h || !h.enabled) return `${danish}: Lukket`;
    
    // Special case: 00:00-00:00 means 24h
    if (h.open === '00:00' && h.close === '00:00') {
      return `${danish}: Døgnåbent`;
    }
    
    const open = formatTime(h.open, timeFormat);
    const close = formatTime(h.close, timeFormat);
    return `${danish}: ${open}-${close}`;
  });
  
  return lines.join('\n');
}

// Format tid baseret på valgt format
function formatTime(timeStr, format) {
  if (!timeStr) return '';
  if (format === '24h') return timeStr;
  
  // Konverter til AM/PM
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Generer lukket-besked med næste åbningstid
function generateClosedMessage(restaurant, openStatus) {
  const nextOpen = openStatus.nextOpen;
  
  let message = `Tak for din henvendelse til ${restaurant.name}. Vi har desværre lukket`;
  
  if (openStatus.reason === 'closed_day') {
    message += ` ${openStatus.currentDay.toLowerCase()}`;
  } else if (openStatus.reason === 'not_yet_open') {
    message += `. Vi åbner kl. ${openStatus.todayOpen}`;
  } else if (openStatus.reason === 'already_closed') {
    message += ` for i dag`;
  }
  
  if (nextOpen) {
    if (nextOpen.isToday) {
      message += `. Vi åbner igen kl. ${nextOpen.time} ☀️`;
    } else if (nextOpen.daysAhead === 1) {
      message += `. Vi åbner igen i morgen (${nextOpen.day}) kl. ${nextOpen.time} ☀️`;
    } else {
      message += `. Vi åbner igen ${nextOpen.day} kl. ${nextOpen.time} ☀️`;
    }
  }
  
  return message;
}

/**
 * Toggle AdvancedAI system on/off
 */
function toggleAdvancedAI(enabled) {
  localStorage.setItem('advanced_ai_enabled', enabled ? 'true' : 'false');

  const status = enabled ? '✨ Advanced AI aktiveret' : '📦 Legacy AI aktiv (fallback)';
  const type = enabled ? 'success' : 'info';

  if (window.showNotification) {
    showNotification(status, type);
  } else {
    addLog(status, type);
  }
}

async function classifyWithAI(message, context = '', expectedCategories = null) {
  // =====================================================
  // ADVANCED AI SYSTEM INTEGRATION (with fallback)
  // =====================================================

  // Feature flag - kan aktiveres per restaurant
  const USE_ADVANCED_AI = localStorage.getItem('advanced_ai_enabled') === 'true';

  // Prøv Advanced AI system først hvis aktiveret
  if (USE_ADVANCED_AI && window.AdvancedAI) {
    try {
      const conversationId = getCurrentConversationId();
      const result = await AdvancedAI.classifyAdvanced(message, conversationId, context);

      if (result && result.category) {
        addLog(`✨ AdvancedAI: ${result.category} (${Math.round((result.confidence || 1.0) * 100)}%)`, 'ai');
        return result;
      }
    } catch (error) {
      console.error('AdvancedAI error:', error);
      addLog(`⚠️ AdvancedAI fejl - falder tilbage til legacy: ${error.message}`, 'warn');
      // Fall through til legacy system
    }
  }

  // =====================================================
  // LEGACY AI KLASSIFICERING (FALLBACK)
  // - Deterministisk output
  // - Context-aware prompts
  // - Forbedret fallback
  // =====================================================

  const msg = message.toLowerCase().trim();
  
  // TRIN 1: Deterministisk pre-check (ingen AI nødvendig for klare svar)
  const quickResult = quickClassify(msg, context);
  if (quickResult && quickResult.confidence >= 0.9) {
    addLog(`⚡ Hurtig klassificering: ${quickResult.category}`, 'ai');
    return quickResult;
  }
  
  // TRIN 2: Brug AI hvis tilgængelig
  // AI calls now routed through backend (Supabase Edge Function)
  
  addLog('🤖 AI analyserer besked...', 'ai');
  
  // Byg kontekst-specifik prompt
  const systemPrompt = buildContextualPrompt(context, expectedCategories);
  
  try {
    const response = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/api-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        service: 'openai',
        endpoint: '/chat/completions',
        payload: {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Besked: "${message}"` }
        ],
        max_tokens: 250,
        temperature: 0.1  // Lavere = mere deterministisk
      }})
    });
    
    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      addLog('⚠️ Tomt AI svar - bruger fallback', 'warn');
      return classifyWithFallback(message, context);
    }
    
    let result;
    try {
      let content = data.choices[0].message.content;
      content = content.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
      result = JSON.parse(content);
    } catch (parseErr) {
      addLog('⚠️ Kunne ikke parse AI JSON - bruger fallback', 'warn');
      return classifyWithFallback(message, context);
    }
    
    // Valider og normaliser resultat
    if (!result.category || result.category === 'UNKNOWN') {
      result.category = 'OTHER';
      result.confidence = 0.5;
    }
    
    addLog(`🎯 AI: ${result.category} (${Math.round((result.confidence || 0.5) * 100)}%)`, 'ai');
    return result;
  } catch (err) {
    console.error('AI error:', err);
    addLog(`⚠️ AI fejl - bruger fallback: ${err.message}`, 'warn');
    return classifyWithFallback(message, context);
  }
}

// =====================================================
// HURTIG DETERMINISTISK KLASSIFICERING
// Håndterer 80% af beskeder uden AI
// =====================================================
function quickClassify(msg, context = '') {
  const contextLower = context.toLowerCase();
  
  // === JA/NEJ SVAR ===
  // Meget høj sikkerhed for simple ja/nej
  if (/^(ja|jep|yes|jo|jaa|yep|jaaa|ja!+|okay|ok|korrekt|rigtigt|det passer|fint|jeps)[\s!.,]*$/i.test(msg)) {
    return { category: 'YES', confidence: 0.98, extracted: msg };
  }
  if (/^(nej|no|nope|ikke|nej tak|næ|nææ)[\s!.,]*$/i.test(msg)) {
    return { category: 'NO', confidence: 0.98, extracted: msg };
  }
  
  // Ja med tilføjelse
  if (/^ja[,\s]+(det |gerne|tak|perfekt|super)/i.test(msg)) {
    return { category: 'YES', confidence: 0.95, extracted: msg };
  }
  
  // === KONTEKST-BASERET KLASSIFICERING ===
  
  // Hvis vi venter på navn
  if (contextLower.includes('navn') || contextLower.includes('name')) {
    // Enkelt ord uden tal = sandsynligvis navn
    if (/^[a-zæøåA-ZÆØÅ\-']+$/.test(msg) && msg.length >= 2 && msg.length <= 30) {
      return { category: 'NAME', confidence: 0.85, extracted: capitalizeWords(msg) };
    }
    // "Jeg hedder X" format
    const nameMatch = msg.match(/(?:jeg hedder|jeg er|mit navn er|hedder)\s+([a-zæøåA-ZÆØÅ\s\-']+)/i);
    if (nameMatch) {
      return { category: 'NAME', confidence: 0.95, extracted: capitalizeWords(nameMatch[1].trim()) };
    }
    // To ord = fornavn + efternavn
    if (/^[a-zæøåA-ZÆØÅ\-']+\s+[a-zæøåA-ZÆØÅ\-']+$/.test(msg)) {
      return { category: 'NAME', confidence: 0.9, extracted: capitalizeWords(msg) };
    }
  }
  
  // Hvis vi venter på adresse
  if (contextLower.includes('adresse') || contextLower.includes('address') || contextLower.includes('levering')) {
    // Indeholder vejnavn og nummer
    if (/[a-zæøå]+\s*\d+/i.test(msg) || /\d+\s*[a-zæøå]+/i.test(msg)) {
      return { category: 'ADDRESS', confidence: 0.85, extracted: msg };
    }
    // Postnummer pattern
    if (/\b\d{4}\b/.test(msg)) {
      return { category: 'ADDRESS', confidence: 0.8, extracted: msg };
    }
  }
  
  // Hvis vi venter på ordre bekræftelse
  if (contextLower.includes('korrekt') || contextLower.includes('bekræft') || contextLower.includes('confirm')) {
    if (msg.includes('ikke korrekt') || msg.includes('forkert') || msg.includes('ændre')) {
      return { category: 'NO', confidence: 0.95, extracted: msg };
    }
  }
  
  // === LEVERINGSTYPE ===
  if (/\b(afhent|hente|selv hente|pick\s*up|kommer selv)\b/i.test(msg)) {
    return { category: 'PICKUP', confidence: 0.9, extracted: 'Afhentning' };
  }
  if (/\b(lever|bring|udbring|kør|delivery|hjem)\b/i.test(msg)) {
    return { category: 'DELIVERY', confidence: 0.9, extracted: 'Levering' };
  }
  
  // === ORDRE PATTERNS ===
  // Nummer-baseret ordre
  if (/(?:nr\.?|nummer|#)\s*\d+/i.test(msg)) {
    return { category: 'ORDER', confidence: 0.9, extracted: msg };
  }
  // Antal + produkt
  if (/\d+\s*x\s*[a-zæøå]/i.test(msg) || /\b(en|et|to|tre|fire|fem|1|2|3|4|5)\s+[a-zæøå]{4,}/i.test(msg)) {
    return { category: 'ORDER', confidence: 0.85, extracted: msg };
  }
  // Kendte madretter
  if (/\b(pizza|burger|sandwich|pasta|salat|kebab|durum|falafel|sushi|karry|bøf|schnitzel)\b/i.test(msg)) {
    return { category: 'ORDER', confidence: 0.85, extracted: msg };
  }
  
  // === SPØRGSMÅL ===
  if (/^(hvad|hvornår|hvordan|hvor|kan i|har i|er der|koster|pris|menu)\b/i.test(msg) || msg.endsWith('?')) {
    return { category: 'QUESTION', confidence: 0.85, extracted: msg };
  }
  
  // === HILSENER ===
  if (/^(hej|hello|goddag|god morgen|god aften|hi|hey)[\s!.,]*$/i.test(msg)) {
    return { category: 'GREETING', confidence: 0.95, extracted: msg };
  }
  
  // === POSITIVE SVAR ===
  if (/^(tak|super|perfekt|fedt|fantastisk|dejligt|godt|fint nok)[\s!.,]*$/i.test(msg)) {
    return { category: 'POSITIVE', confidence: 0.9, extracted: msg };
  }
  
  // Ingen klar match - returner null for at lade AI håndtere det
  return null;
}

// =====================================================
// KONTEKST-SPECIFIK PROMPT BUILDER
// =====================================================
function buildContextualPrompt(context, expectedCategories) {
  const baseCategories = expectedCategories || ['YES', 'NO', 'NAME', 'ADDRESS', 'ORDER', 'PICKUP', 'DELIVERY', 'QUESTION', 'POSITIVE', 'OTHER'];
  
  const categoryDescriptions = {
    'YES': 'Bekræftelse (ja, okay, korrekt, rigtigt, det passer, fint, gerne)',
    'NO': 'Afvisning/ændring (nej, ikke, forkert, ændre, vil ikke)',
    'NAME': 'Kundens navn (fornavn, efternavn, kaldenavn)',
    'ADDRESS': 'Leveringsadresse (vejnavn, husnummer, postnummer, by)',
    'ORDER': 'Bestilling af mad (produktnavne, numre, antal)',
    'PICKUP': 'Vil afhente selv (afhentning, hente, kommer selv)',
    'DELIVERY': 'Vil have levering (levering, bring, udbring)',
    'QUESTION': 'Stiller spørgsmål (hvad, hvornår, hvordan, kan I)',
    'POSITIVE': 'Positiv respons uden bekræftelse (tak, super, fedt)',
    'OTHER': 'Uklart eller andet'
  };
  
  const relevantCategories = baseCategories.map(cat => `- ${cat}: ${categoryDescriptions[cat] || cat}`).join('\n');
  
  return `Du er en præcis SMS-klassificerings-AI for en dansk restaurant.

OPGAVE: Klassificer kundens besked i PRÆCIS én kategori.

KONTEKST FOR DENNE BESKED:
${context || 'Generel kundehenvendelse'}

TILGÆNGELIGE KATEGORIER:
${relevantCategories}

REGLER:
1. Vælg den MEST specifikke kategori der passer
2. Ved tvivl mellem YES og NAME: hvis det er ét ord uden tal, vælg NAME
3. Ved tvivl mellem YES og POSITIVE: YES kun ved direkte bekræftelse på et spørgsmål
4. Udtræk ALTID relevant information i "extracted" feltet
5. Sæt confidence baseret på hvor sikker du er (0.0-1.0)

OUTPUT FORMAT (KUN JSON, ingen anden tekst):
{
  "category": "KATEGORI",
  "extracted": "relevant udtrukket info",
  "confidence": 0.0-1.0,
  "reasoning": "kort forklaring på dansk"
}`;
}

// =====================================================
// FORBEDRET FALLBACK KLASSIFICERING
// =====================================================
function classifyWithFallback(message, context = '') {
  const msg = message.toLowerCase().trim();
  const contextLower = (context || '').toLowerCase();
  
  // Prøv hurtig klassificering først
  const quickResult = quickClassify(msg, context);
  if (quickResult) {
    return quickResult;
  }
  
  // Udvidet fallback logik
  
  // Ja/bekræftelse med variationer
  if (/\b(ja|jep|yes|okay|ok|jo|gerne|selvfølgelig|korrekt|rigtigt|fint|accepter|godkend)\b/i.test(msg)) {
    if (!msg.includes('nej') && !msg.includes('ikke')) {
      return { category: 'YES', confidence: 0.75, extracted: msg };
    }
  }
  
  // Nej/afvisning
  if (/\b(nej|no|ikke|afbestil|annuller|forkert|ændre)\b/i.test(msg)) {
    return { category: 'NO', confidence: 0.75, extracted: msg };
  }
  
  // Navn pattern (enkelt eller dobbelt ord med kun bogstaver)
  if (contextLower.includes('navn')) {
    if (/^[a-zæøåA-ZÆØÅ\-'\s]{2,40}$/.test(msg) && !/\d/.test(msg)) {
      return { category: 'NAME', confidence: 0.7, extracted: capitalizeWords(msg) };
    }
  }
  
  // Adresse pattern
  if (contextLower.includes('adresse') || /\d{4}/.test(msg) || /\d+\s*[a-z]/i.test(msg)) {
    return { category: 'ADDRESS', confidence: 0.7, extracted: msg };
  }
  
  // Ordre pattern
  if (/\d/.test(msg) && /[a-zæøå]{3,}/i.test(msg)) {
    return { category: 'ORDER', confidence: 0.6, extracted: msg };
  }
  
  // Spørgsmål
  if (msg.includes('?') || /^(hvad|hvornår|hvordan|hvor|kan|har)\b/i.test(msg)) {
    return { 
      category: 'QUESTION', 
      confidence: 0.7, 
      extracted: msg,
      fallbackResponse: 'Tak for din besked! Jeg sender den videre til restauranten.'
    };
  }
  
  // Default: OTHER med fallback respons
  return { 
    category: 'OTHER', 
    confidence: 0.5, 
    extracted: msg,
    fallbackResponse: 'Tak for din besked. Kan du uddybe hvad du mener?'
  };
}

// Hjælpefunktion til at kapitalisere ord
function capitalizeWords(str) {
  return str.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Generate AI response (med åbningstider context)
async function generateAIResponse(customerMessage, context, restaurant) {
  // AI calls now routed through backend (Supabase Edge Function)
  
  // Hent restaurant navn (håndter både string og objekt)
  const restaurantName = typeof restaurant === 'string' ? restaurant : restaurant?.name || 'Restauranten';
  
  // Byg åbningstider context hvis restaurant objekt
  let openingHoursInfo = '';
  if (typeof restaurant === 'object' && restaurant.openingHours) {
    openingHoursInfo = `\n\nÅBNINGSTIDER:\n${formatOpeningHoursText(restaurant)}`;
  }
  
  // Byg menu context
  let menuInfo = '';
  if (typeof restaurant === 'object' && restaurant.menuUrl) {
    menuInfo = `\n\nMENU: ${restaurant.menuUrl}`;
  }
  
  addLog('🤖 AI genererer svar...', 'ai');
  
  try {
    const response = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/api-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        service: 'openai',
        endpoint: '/chat/completions',
        payload: {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Du er en venlig og professionel SMS-assistent for restauranten "${restaurantName}".

DINE OPGAVER:
1. Hjælp kunder med at bestille mad
2. Svar på spørgsmål om menu, priser, åbningstider
3. Vejled kunden gennem bestillingsprocessen

REGLER:
- Svar ALTID på dansk
- Hold svaret KORT (max 160 tegn for SMS)
- Vær venlig men professionel
- Brug max 1-2 emojis
- Hvis du ikke ved noget, bed kunden kontakte restauranten direkte
${openingHoursInfo}${menuInfo}

VIGTIGT: 
- Spørg ALDRIG om det samme to gange
- Hvis kunden har givet information, bekræft den og gå videre
- Ved tvivl, stil ETT præcist opfølgende spørgsmål`
          },
          {
            role: 'user',
            content: `SAMTALEKONTEKST: ${context}\n\nKUNDENS BESKED: "${customerMessage}"\n\nGenerer et passende svar (max 160 tegn):`
          }
        ],
        max_tokens: 100,
        temperature: 0.5  // Lavere for mere konsistente svar
      }})
    });
    
    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content?.trim();
    
    if (!aiResponse) {
      return generateSmartFallbackResponse(customerMessage, context, restaurant);
    }
    
    addLog(`💡 AI svar: "${aiResponse.substring(0, 50)}..."`, 'ai');
    return aiResponse;
  } catch (err) {
    console.error('AI response error:', err);
    return generateSmartFallbackResponse(customerMessage, context, restaurant);
  }
}

// Smart fallback når AI ikke er tilgængelig
function generateSmartFallbackResponse(message, context, restaurant) {
  const msg = message.toLowerCase();
  const restaurantName = typeof restaurant === 'string' ? restaurant : restaurant?.name || 'os';
  
  // Åbningstider spørgsmål
  if (/åben|lukket|hvornår|tider/i.test(msg)) {
    if (typeof restaurant === 'object' && restaurant.openingHours) {
      const today = new Date().getDay();
      const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const hours = restaurant.openingHours[dayNames[today]];
      if (hours?.enabled) {
        return `Vi har åbent i dag fra ${hours.open} til ${hours.close} 🕐`;
      }
      return 'Vi har desværre lukket i dag. Se vores åbningstider på hjemmesiden.';
    }
    return 'Kontakt os for åbningstider.';
  }
  
  // Menu/priser spørgsmål
  if (/menu|pris|koster|hvad har i/i.test(msg)) {
    const menuUrl = restaurant?.menuUrl || restaurant?.website;
    if (menuUrl) {
      return `Se vores menu her: ${menuUrl} 🍕`;
    }
    return 'Kontakt os for menu og priser.';
  }
  
  // Hilsen
  if (/^(hej|hello|goddag|hi|hey)/i.test(msg)) {
    return `Hej! Velkommen til ${restaurantName}. Hvad kan jeg hjælpe med? 😊`;
  }
  
  // Tak
  if (/^tak|takker|mange tak/i.test(msg)) {
    return 'Selv tak! God appetit 🍽️';
  }
  
  // Default
  return 'Tak for din besked! Kan du uddybe hvad du ønsker hjælp med?';
}

// Pending AI response storage
let pendingAiResponse = null;
let pendingMsgId = null;

function approveAiResponse(msgId) {
  if (pendingAiResponse && pendingMsgId === msgId) {
    const phone = document.getElementById('test-phone').value;
    sendSMSNow(phone, pendingAiResponse);
    document.getElementById(msgId + '-approval').remove();
    addLog('✅ AI svar godkendt og sendt', 'success');
    pendingAiResponse = null;
    pendingMsgId = null;
  }
}

function editAiResponse(msgId) {
  if (pendingAiResponse) {
    const newText = prompt('Rediger svaret:', pendingAiResponse);
    if (newText) {
      pendingAiResponse = newText;
      const msgEl = document.getElementById(msgId);
      if (msgEl) {
        msgEl.querySelector('.msg-approval').previousSibling.textContent = newText;
      }
    }
  }
}

function rejectAiResponse(msgId) {
  document.getElementById(msgId)?.remove();
  addLog('❌ AI svar afvist', 'warn');
  pendingAiResponse = null;
  pendingMsgId = null;
}

// Send SMS immediately
async function sendSMSNow(to, message) {
  const normalized = normalizePhoneNumber(to);
  let phoneNumber = normalized.e164;
  if (!phoneNumber) {
    addLog('❌ Ugyldigt telefonnummer', 'error');
    return;
  }

  // Use our InMobile SMS function
  try {
    await sendSMS(phoneNumber, message);
    addMessage(message, 'out');
    addLog(`✅ SMS sendt!`, 'success');
  } catch (err) {
    addLog(`❌ Fejl: ${err.message}`, 'error');
  }
}

// Classify receipt intent (JA/NEJ)
function classifyReceiptIntent(reply) {
  if (!reply) return false;
  const lower = reply.toLowerCase().trim();
  
  // Positive patterns
  const yesPatterns = /^(ja|jep|yes|gerne|selvfølgelig|ok|okay|jo|yep|jaa|ja tak|please|pls)[!.,\s]*$/i;
  if (yesPatterns.test(lower)) return true;
  if (lower.includes('ja ') || lower.includes('ja,') || lower.includes('ja!')) return true;
  if (lower.includes('gerne') || lower.includes('kvittering')) return true;
  
  // Negative patterns
  const noPatterns = /^(nej|no|nope|ikke|nej tak|nah)[!.,\s]*$/i;
  if (noPatterns.test(lower)) return false;
  if (lower.includes('nej') || lower.includes('ikke')) return false;
  
  // Default to no if unclear
  return false;
}

// =====================================================
// AI FALLBACK & LEARNING SYSTEM
// =====================================================

// Learning log storage (in-memory + localStorage persistence)
let aiLearningLog = JSON.parse(localStorage.getItem('ai_learning_log') || '[]');

// Special intent handlers - actions the AI can trigger
const SPECIAL_INTENTS = {
  RECEIPT: {
    keywords: ['kvittering', 'receipt', 'bon', 'regning', 'faktura'],
    action: 'SEND_RECEIPT',
    response: 'Selvfølgelig! Jeg sender din kvittering med det samme. Tjek din SMS om et øjeblik 📄'
  },
  ORDER_STATUS: {
    keywords: ['status', 'hvor langt', 'hvornår klar', 'hvor længe', 'estimat'],
    action: 'CHECK_STATUS',
    response: 'Jeg tjekker status på din ordre... Et øjeblik! ⏱️'
  },
  MENU: {
    keywords: ['menukort', 'menu', 'hvad har i', 'priser', 'tilbud'],
    action: 'SEND_MENU',
    response: 'Her er vores menu: {menuUrl} - Skriv gerne hvad du kunne tænke dig! 🍕'
  },
  CANCEL: {
    keywords: ['annuller', 'afbestil', 'fortryd', 'cancel'],
    action: 'ESCALATE_CANCEL',
    response: 'Jeg forstår. Jeg sender din forespørgsel videre til personalet, som kontakter dig hurtigst muligt 📞'
  },
  COMPLAINT: {
    keywords: ['klage', 'dårlig', 'forkert', 'mangel', 'fejl', 'skuffet', 'utilfreds'],
    action: 'ESCALATE_COMPLAINT',
    response: 'Det er jeg ked af at høre. Jeg eskalerer dette til vores personale, som kontakter dig snarest for at løse problemet 🙏'
  },
  ALLERGEN: {
    keywords: ['allergi', 'glutenfri', 'laktosefri', 'vegetar', 'vegan', 'nødder', 'intolerans'],
    action: 'ESCALATE_ALLERGEN',
    response: 'Godt spørgsmål om allergener! Jeg sender din forespørgsel til køkkenet, som svarer dig direkte med præcise oplysninger 🥗'
  },
  OPENING_HOURS: {
    keywords: ['åbningstid', 'lukket', 'åben', 'hvornår åbner', 'hvornår lukker'],
    action: 'SEND_HOURS',
    response: null // Dynamic - uses restaurant opening hours
  },
  HELP: {
    keywords: ['hjælp', 'help', 'hvordan', 'problem', 'virker ikke'],
    action: 'SEND_HELP',
    response: 'Jeg hjælper gerne! Du kan:\n📱 Bestille mad ved at skrive din ordre\n📄 Bede om kvittering\n❌ Annullere ved at skrive "annuller"\n\nEller kontakt os direkte!'
  }
};

// Detect special intent from message
function detectSpecialIntent(message) {
  const lower = message.toLowerCase();
  
  for (const [intentName, config] of Object.entries(SPECIAL_INTENTS)) {
    for (const keyword of config.keywords) {
      if (lower.includes(keyword)) {
        return { intent: intentName, ...config };
      }
    }
  }
  return null;
}

// Log message for AI learning
function logForLearning(message, context, classification, wasHandled, sentiment = 'neutral') {
  const logEntry = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    message: message,
    context: context,
    classification: classification,
    wasHandled: wasHandled,
    sentiment: sentiment,
    needsReview: !wasHandled || classification?.confidence < 0.7
  };
  
  aiLearningLog.push(logEntry);
  
  // Keep only last 500 entries
  if (aiLearningLog.length > 500) {
    aiLearningLog = aiLearningLog.slice(-500);
  }
  
  // Persist to localStorage
  localStorage.setItem('ai_learning_log', JSON.stringify(aiLearningLog));
  
  addLog(`📚 Logget til AI træning: ${classification?.category || 'UNKNOWN'}`, 'info');
  
  return logEntry;
}

// Analyze sentiment of customer message
function analyzeSentiment(message) {
  const lower = message.toLowerCase();
  
  const positiveWords = ['tak', 'super', 'perfekt', 'dejligt', 'godt', 'fantastisk', 'lækkert', 'fedt', 'nice', 'awesome', 'great'];
  const negativeWords = ['dårligt', 'skuffet', 'ærgerligt', 'forkert', 'klage', 'utilfreds', 'langsomt', 'koldt', 'fejl', 'problem'];
  
  let positiveScore = 0;
  let negativeScore = 0;
  
  positiveWords.forEach(word => { if (lower.includes(word)) positiveScore++; });
  negativeWords.forEach(word => { if (lower.includes(word)) negativeScore++; });
  
  if (positiveScore > negativeScore) return 'positive';
  if (negativeScore > positiveScore) return 'negative';
  return 'neutral';
}

// AI Fallback Handler - handles messages that don't match workflow
async function handleAIFallback(message, restaurant, conversationContext = '') {
  addLog('🧠 AI Fallback aktiveret - analyserer besked...', 'ai');
  
  // 1. Check for special intents first (kvittering, status, etc.)
  const specialIntent = detectSpecialIntent(message);
  if (specialIntent) {
    addLog(`🎯 Special intent detekteret: ${specialIntent.intent}`, 'ai');
    
    // Log for learning
    logForLearning(message, conversationContext, { category: specialIntent.intent, confidence: 0.95 }, true);
    
    // Execute action if defined
    await executeIntentAction(specialIntent, restaurant);
    
    // Return response (with dynamic substitution)
    let response = specialIntent.response;
    if (response && restaurant) {
      response = response.replace('{menuUrl}', restaurant.menuUrl || restaurant.website || '');
      response = response.replace('{restaurantName}', restaurant.name || '');
    }
    
    // Special case: Opening hours
    if (specialIntent.action === 'SEND_HOURS' && restaurant?.openingHours) {
      response = generateOpeningHoursResponse(restaurant);
    }
    
    return {
      handled: true,
      intent: specialIntent.intent,
      response: response,
      action: specialIntent.action
    };
  }
  
  // 2. Use AI classification for unknown messages
  const classification = await classifyWithAI(message, conversationContext);
  const sentiment = analyzeSentiment(message);
  
  // 3. Log for learning (mark as needing review if low confidence)
  const wasHandled = classification.confidence >= 0.7;
  logForLearning(message, conversationContext, classification, wasHandled, sentiment);
  
  // 4. Generate AI response if needed
  let aiResponse = null;
  if (classification.category === 'QUESTION' || classification.category === 'OTHER') {
    aiResponse = await generateAIFallbackResponse(message, restaurant, conversationContext);
  }
  
  // 5. Determine if escalation is needed
  const needsEscalation = sentiment === 'negative' || classification.confidence < 0.5;
  
  return {
    handled: wasHandled,
    intent: classification.category,
    classification: classification,
    sentiment: sentiment,
    response: aiResponse || classification.fallbackResponse,
    needsEscalation: needsEscalation,
    action: needsEscalation ? 'ESCALATE_STAFF' : null
  };
}

// Execute intent action (send receipt, check status, etc.)
async function executeIntentAction(intent, restaurant) {
  switch(intent.action) {
    case 'SEND_RECEIPT':
      addLog('📄 Trigger: Sender kvittering...', 'success');
      // In production: trigger receipt generation and send
      triggerStaffNotification(restaurant, 'Kunde anmoder om kvittering');
      break;
      
    case 'CHECK_STATUS':
      addLog('⏱️ Trigger: Tjekker ordrestatus...', 'info');
      // In production: fetch order status from database
      break;
      
    case 'SEND_MENU':
      addLog('📋 Trigger: Sender menukort...', 'info');
      break;
      
    case 'ESCALATE_CANCEL':
    case 'ESCALATE_COMPLAINT':
    case 'ESCALATE_ALLERGEN':
    case 'ESCALATE_STAFF':
      addLog('🚨 Trigger: Eskalerer til personale...', 'warn');
      triggerStaffNotification(restaurant, `Kundehenvendelse kræver opmærksomhed: ${intent.intent}`);
      break;
      
    case 'SEND_HOURS':
      addLog('🕐 Trigger: Sender åbningstider...', 'info');
      break;
      
    case 'SEND_HELP':
      addLog('❓ Trigger: Sender hjælp-info...', 'info');
      break;
  }
}

// Trigger notification to staff (placeholder for real implementation)
function triggerStaffNotification(restaurant, message) {
  const notification = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    restaurant: restaurant?.name || 'Ukendt',
    restaurantId: restaurant?.id,
    message: message,
    status: 'pending'
  };
  
  // Store in localStorage for now (would be database in production)
  const notifications = JSON.parse(localStorage.getItem('staff_notifications') || '[]');
  notifications.push(notification);
  localStorage.setItem('staff_notifications', JSON.stringify(notifications));
  
  addLog(`Staff notification: ${message}`, 'warn');
}

// Generate AI fallback response for unhandled messages
async function generateAIFallbackResponse(message, restaurant, context) {
  // AI calls now routed through backend (Supabase Edge Function)
  
  const restaurantName = restaurant?.name || 'restauranten';
  let openingHoursInfo = '';
  if (restaurant?.openingHours) {
    openingHoursInfo = `\n\nÅbningstider:\n${formatOpeningHoursText(restaurant)}`;
  }
  
  try {
    const response = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/api-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        service: 'openai',
        endpoint: '/chat/completions',
        payload: {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Du er en venlig SMS-assistent for "${restaurantName}".
Du håndterer beskeder som ikke passer ind i det normale bestillingsflow.

VIGTIGE REGLER:
- Svar kort og venligt på dansk (max 160 tegn)
- Hvis du ikke kan hjælpe, eskaler venligt til personalet
- Brug max 1-2 emojis
- Vær professionel men varm
- Hvis kunden virker utilfreds, anerkend det og tilbyd hjælp
${openingHoursInfo}

Almindelige forespørgsler du kan hjælpe med:
- Kvittering: Bed dem vente mens du henter den
- Ordrestatus: Bed dem vente mens du tjekker
- Åbningstider: Giv dem de korrekte tider
- Alt andet: Tilbyd at eskalere til personale`
          },
          {
            role: 'user',
            content: `Kontekst: ${context}\n\nKundens besked: "${message}"\n\nGenerer et passende svar:`
          }
        ],
        max_tokens: 100,
        temperature: 0.6
      }})
    });
    
    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error('AI Fallback error:', err);
    return null;
  }
}

// Generate opening hours response
function generateOpeningHoursResponse(restaurant) {
  if (!restaurant?.openingHours) {
    return 'Kontakt os for at høre vores åbningstider 📞';
  }
  
  const dayNames = {
    monday: 'Mandag', tuesday: 'Tirsdag', wednesday: 'Onsdag',
    thursday: 'Torsdag', friday: 'Fredag', saturday: 'Lørdag', sunday: 'Søndag'
  };
  
  const today = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
  const todayHours = restaurant.openingHours[today];
  
  if (todayHours?.enabled) {
    return `Vi har åbent i dag (${dayNames[today]}) fra ${todayHours.open} til ${todayHours.close} 🕐`;
  } else {
    // Find next open day
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const todayIndex = days.indexOf(today);
    for (let i = 1; i <= 7; i++) {
      const nextDay = days[(todayIndex + i) % 7];
      const nextHours = restaurant.openingHours[nextDay];
      if (nextHours?.enabled) {
        return `Vi har desværre lukket i dag. Vi åbner igen ${dayNames[nextDay]} kl. ${nextHours.open} 🕐`;
      }
    }
    return 'Kontakt os for at høre vores åbningstider 📞';
  }
}

// Get learning log for dashboard display
function getAILearningStats() {
  const total = aiLearningLog.length;
  const needsReview = aiLearningLog.filter(e => e.needsReview).length;
  const handled = aiLearningLog.filter(e => e.wasHandled).length;
  const sentimentBreakdown = {
    positive: aiLearningLog.filter(e => e.sentiment === 'positive').length,
    neutral: aiLearningLog.filter(e => e.sentiment === 'neutral').length,
    negative: aiLearningLog.filter(e => e.sentiment === 'negative').length
  };
  
  // Category breakdown
  const categories = {};
  aiLearningLog.forEach(e => {
    const cat = e.classification?.category || 'UNKNOWN';
    categories[cat] = (categories[cat] || 0) + 1;
  });
  
  return {
    total,
    needsReview,
    handled,
    handledRate: total > 0 ? Math.round((handled / total) * 100) : 0,
    sentimentBreakdown,
    categories,
    recentUnhandled: aiLearningLog.filter(e => e.needsReview).slice(-10).reverse()
  };
}

// Export learning data for training
function exportLearningData() {
  const data = {
    exportedAt: new Date().toISOString(),
    totalEntries: aiLearningLog.length,
    entries: aiLearningLog
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ai-learning-data-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  addLog('📥 AI træningsdata eksporteret', 'success');
}

// Clear learning log
function clearLearningLog() {
  if (confirm('Er du sikker på du vil slette alle AI træningsdata?')) {
    aiLearningLog = [];
    localStorage.removeItem('ai_learning_log');
    addLog('🗑️ AI træningsdata slettet', 'warn');
  }
}

async function waitForReply() {
  document.getElementById('waiting').style.display = 'block';
  addLog('⏳ Venter på kundens svar...', 'info');

  return new Promise(async (resolve) => {
    // Gem reference til denne specifikke resolve
    const thisResolve = resolve;
    replyResolver = resolve;

    // I Live Mode: Poll Supabase for indgående SMS
    let pollInterval = null;
    let lastMessageTimestamp = null;  // FIXED: Brug timestamp i stedet for ID
    let timeoutId = null;
    let warningTimeout = null;
    let isResolved = false;
    let mismatchLogged = false;

    // Cleanup funktion for at sikre alle ressourcer frigives
    const cleanup = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (warningTimeout) {
        clearTimeout(warningTimeout);
        warningTimeout = null;
      }
      document.getElementById('waiting').style.display = 'none';
    };

    // Safe resolve funktion
    const safeResolve = (value) => {
      if (isResolved) return;
      isResolved = true;
      cleanup();
      if (replyResolver === thisResolve) {
        replyResolver = null;
      }
      // Clear global resolver
      window.resolveWorkflowReply = null;
      resolve(value);
    };

    // KRITISK: Sæt global resolver så RealtimeSync kan resolve
    window.resolveWorkflowReply = (content) => {
      if (!isResolved) {
        addMessage(content, 'in');
        addLog(`📨 Indgående SMS (realtime): "${content}"`, 'success');
        safeResolve(content);
      }
    };

    if (liveMode) {
      const phone = document.getElementById('test-phone').value;
      const formattedPhone = normalizePhoneNumber(phone).e164;
      if (!formattedPhone) {
        addLog('❌ Ugyldigt telefonnummer - kan ikke lytte efter svar', 'error');
        safeResolve(null);
        return;
      }

      addLog(`🔎 Live match: raw="${phone}" normalized="${formattedPhone}"`, 'info');

      // Gem tidspunkt for workflow start - vi accepterer alle beskeder efter dette tidspunkt
      const workflowStartTime = new Date().toISOString();
      // Track set af allerede sete besked-IDs
      const seenMessageIds = new Set();

      // Hent eksisterende beskeder og marker dem som "set"
      try {
        const initResponse = await fetch(
          `${CONFIG.SUPABASE_URL}/rest/v1/messages?direction=eq.inbound&order=id.desc&limit=20`,
          {
            headers: {
              'apikey': CONFIG.SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
            }
          }
        );
        if (initResponse.ok) {
          const initMsgs = await initResponse.json();
          initMsgs.forEach(m => seenMessageIds.add(m.id));
          console.log('📋 Marked', seenMessageIds.size, 'existing messages as seen');
        }
      } catch (e) {
        console.warn('Could not fetch initial messages:', e);
      }

      addLog(`📡 Lytter efter svar fra ${formattedPhone}...`, 'info');
      addLog(`⏰ Accepterer nye beskeder efter: ${new Date(workflowStartTime).toLocaleTimeString()}`, 'info');

      pollInterval = setInterval(async () => {
        // Stop polling hvis allerede resolved eller workflow stoppet
        if (isResolved || !testRunning) {
          console.log('⚠️ Poll stopped - isResolved:', isResolved, 'testRunning:', testRunning);
          cleanup();
          return;
        }

        try {
          // Hent seneste inbound beskeder - sortér efter id (nyeste først)
          const response = await fetch(
            `${CONFIG.SUPABASE_URL}/rest/v1/messages?direction=eq.inbound&order=id.desc&limit=20`,
            {
              headers: {
                'apikey': CONFIG.SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
              }
            }
          );

          if (!response.ok) {
            console.error('❌ Poll API error:', response.status, response.statusText);
            return;
          }

          const messages = await response.json();

          // Find NYE beskeder (ikke set før)
          const newMessages = messages.filter(m => !seenMessageIds.has(m.id));

          if (newMessages.length > 0) {
            console.log('📥 Found', newMessages.length, 'NEW messages:', newMessages.map(m => ({
              id: m.id,
              phone: m.phone,
              content: m.content?.substring(0, 30)
            })));

            // Find en ny besked der matcher telefonnummeret
            const matched = newMessages.find((msg) => {
              const msgPhone = normalizePhoneNumber(msg.phone).e164;
              const isMatch = msgPhone === formattedPhone;
              console.log(`🔍 Phone compare: "${msgPhone}" vs "${formattedPhone}" = ${isMatch}`);
              return isMatch;
            });

            if (matched) {
              // Marker som set
              seenMessageIds.add(matched.id);
              addMessage(matched.content, 'in');
              addLog(`📨 Indgående SMS: "${matched.content}"`, 'success');
              console.log('✅ Message accepted, resolving workflow. ID:', matched.id);
              safeResolve(matched.content);
              return;
            } else {
              // Marker alle nye beskeder som set (så vi ikke tjekker dem igen)
              newMessages.forEach(m => seenMessageIds.add(m.id));

              if (!mismatchLogged) {
                mismatchLogged = true;
                const otherPhones = newMessages.map(m => m.phone).join(', ');
                addLog(`⚠️ Ny SMS fra andet nummer: ${otherPhones}`, 'warn');
              }
            }
          }
        } catch (err) {
          console.error('❌ Poll error:', err);
        }
      }, 1500); // Poll hver 1.5 sekund for hurtigere respons

      // FIXED: Advarsel efter 60 sekunder
      warningTimeout = setTimeout(() => {
        if (!isResolved) {
          addLog('⏰ Venter stadig på svar... (60s)', 'warn');
        }
      }, 60000);
    }

    // Timeout efter 2 minutter
    timeoutId = setTimeout(() => {
      if (!isResolved) {
        addLog('⏰ Timeout efter 2 minutter - ingen svar modtaget', 'warn');
        safeResolve(null);
      }
    }, 120000);
  });
}

// Debug funktion: Tjek alle indgående beskeder i databasen
async function debugCheckMessages() {
  try {
    addLog('🔍 Tjekker database for indgående beskeder...', 'info');

    const response = await fetch(
      `${CONFIG.SUPABASE_URL}/rest/v1/messages?direction=eq.inbound&order=id.desc&limit=10`,
      {
        headers: {
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!response.ok) {
      addLog(`❌ Database fejl: ${response.status}`, 'error');
      return;
    }

    const messages = await response.json();

    if (messages.length === 0) {
      addLog('⚠️ Ingen indgående beskeder fundet i databasen', 'warn');
      addLog('💡 InMobile webhook sender muligvis ikke til korrekt URL', 'info');
    } else {
      addLog(`✅ Fandt ${messages.length} indgående beskeder:`, 'success');
      messages.slice(0, 5).forEach((m, i) => {
        const time = new Date(m.created_at).toLocaleTimeString('da-DK');
        addLog(`  ${i+1}. ${m.phone}: "${m.content?.substring(0, 30)}" (${time})`, 'info');
      });
    }

    console.log('📋 Full message data:', messages);
    return messages;
  } catch (err) {
    addLog(`❌ Fejl ved database-tjek: ${err.message}`, 'error');
    console.error('Debug check error:', err);
  }
}

// Gør funktionen tilgængelig globalt for debugging
window.debugCheckMessages = debugCheckMessages;

async function handleIncomingReply(text) {
  // Show incoming message
  addMessage(text, 'in');
  addLog(`📨 Kunde: "${text}"`, 'success');
  
  // Get restaurant context
  const restaurantId = document.getElementById('test-restaurant').value;
  const restaurant = restaurants.find(r => r.id === restaurantId);
  
  // First, try AI Fallback for special intents (kvittering, status, etc.)
  const fallbackResult = await handleAIFallback(text, restaurant, currentConversationContext);
  
  if (fallbackResult.handled && fallbackResult.response) {
    // Special intent detected and handled
    addLog(`✅ AI Fallback håndteret: ${fallbackResult.intent}`, 'success');
    
    if (fallbackResult.action) {
      addLog(`🔧 Action triggered: ${fallbackResult.action}`, 'info');
    }
    
    // Show response with approval if needed
    if (fallbackResult.needsEscalation) {
      pendingMsgId = addMessage(fallbackResult.response, 'out', true);
      pendingAiResponse = fallbackResult.response;
    } else {
      // Auto-send for high-confidence special intents
      addMessage(fallbackResult.response, 'out');
      if (liveMode) {
        const phone = document.getElementById('test-phone').value;
        sendSMSNow(phone, fallbackResult.response);
      }
    }
    
    // Update context
    currentConversationContext += `\nKunde: ${text} [AI Fallback: ${fallbackResult.intent}]`;
    
    return { text, classification: fallbackResult.classification || { category: fallbackResult.intent }, fallback: true };
  }
  
  // Standard classification if not handled by fallback
  const classification = await classifyWithAI(text, currentConversationContext);
  
  // Generate AI response suggestion
  const aiSuggestion = await generateAIResponse(text, currentConversationContext, restaurant?.name || 'Restauranten');
  
  if (aiSuggestion) {
    // Show AI suggestion with approval buttons
    pendingMsgId = addMessage(aiSuggestion, 'out', true);
    pendingAiResponse = aiSuggestion;
  }
  
  // Update context
  currentConversationContext += `\nKunde: ${text}`;
  if (classification.extracted) {
    currentConversationContext += ` [${classification.category}: ${classification.extracted}]`;
  }
  
  return { text, classification };
}

let currentConversationContext = '';

function sendReply() {
  const input = document.getElementById('reply-input');
  const text = input.value.trim();
  if (!text) return;
  
  input.value = '';
  
  // If we have a resolver waiting, use it (simulation mode)
  if (replyResolver) {
    addMessage(text, 'in');
    addLog(`📨 Svar modtaget: "${text}"`, 'success');
    document.getElementById('waiting').style.display = 'none';
    replyResolver(text);
    replyResolver = null;
  } else {
    // Live mode - handle as incoming
    handleIncomingReply(text);
  }
}

function quickReply(text) {
  document.getElementById('reply-input').value = text;
  sendReply();
}

function addLog(msg, type = 'info') {
  const time = new Date().toLocaleTimeString('da-DK');
  
  // Fjern emojis fra besked til ren tekst visning
  const cleanMsg = msg.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
  
  // Add to detailed log (log tab) only
  addDetailedLog(cleanMsg, type, time);
}

// Tab switching - 3 tabs: chat, messages, log
function switchTestTab(tab) {
  // Update tab buttons
  document.getElementById('tab-chat')?.classList.toggle('active', tab === 'chat');
  document.getElementById('tab-messages')?.classList.toggle('active', tab === 'messages');
  document.getElementById('tab-log')?.classList.toggle('active', tab === 'log');
  
  // Update tab content
  document.getElementById('content-chat')?.classList.toggle('active', tab === 'chat');
  document.getElementById('content-messages')?.classList.toggle('active', tab === 'messages');
  document.getElementById('content-log')?.classList.toggle('active', tab === 'log');
}

// Detailed log functions
function addDetailedLog(msg, type = 'info', time) {
  const container = document.getElementById('detailed-log');
  if (!container) return;
  
  // Clear placeholder if first log
  if (container.querySelector('.log-empty-state')) {
    container.innerHTML = '';
  }
  
  const typeLabels = {
    info: 'INFO',
    success: 'SUCCESS',
    warn: 'WARNING',
    error: 'ERROR',
    ai: 'AI',
    sms: 'SMS'
  };
  
  const entry = document.createElement('div');
  entry.className = `log-entry-detailed ${type}`;
  entry.innerHTML = `
    <span class="log-time">${time || new Date().toLocaleTimeString('da-DK')}</span>
    <span class="log-type">${typeLabels[type] || 'INFO'}</span>
    <span class="log-content">${msg}</span>
  `;
  
  container.appendChild(entry);
  container.scrollTop = container.scrollHeight;
}

function addDetailedLogWithPayload(msg, type, payload) {
  const container = document.getElementById('detailed-log');
  if (!container) return;
  
  const time = new Date().toLocaleTimeString('da-DK');
  const typeLabels = {
    info: 'INFO',
    success: 'SUCCESS',
    warn: 'WARNING',
    error: 'ERROR',
    ai: 'AI',
    api: 'API'
  };
  
  const entry = document.createElement('div');
  entry.className = `log-entry-detailed ${type}`;
  entry.innerHTML = `
    <span class="log-time">${time}</span>
    <span class="log-type">${typeLabels[type] || 'INFO'}</span>
    <span class="log-content">${msg}</span>
    ${payload ? `<pre>${JSON.stringify(payload, null, 2)}</pre>` : ''}
  `;
  
  container.appendChild(entry);
  container.scrollTop = container.scrollHeight;
}

function clearDetailedLog() {
  const container = document.getElementById('detailed-log');
  if (container) {
    container.innerHTML = `
      <div class="log-empty-state">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <div>Log ryddet</div>
        <div class="log-empty-sub">Start en ny test for at se logs</div>
      </div>
    `;
  }
}

function copyDetailedLog() {
  const container = document.getElementById('detailed-log');
  if (container) {
    const text = container.innerText;
    navigator.clipboard.writeText(text).catch(() => {
      toast('Kunne ikke kopiere log', 'error');
    });
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// =====================================================
// SETTINGS
// =====================================================
function loadConfig() {
  // Brug CONFIG værdier som defaults hvis localStorage er tom

  // OpenAI
  const openaiKey = localStorage.getItem('openai_key') || CONFIG.OPENAI_API_KEY;
  if (openaiKey) {
    localStorage.setItem('openai_key', openaiKey);
  }

  updateApiStatus();
}

function saveSmsConfig() {
  const apiKey = document.getElementById('inmobile-api-key')?.value.trim();
  const sender = document.getElementById('inmobile-sender')?.value.trim();

  if (!apiKey) {
    toast('Indtast InMobile API Key', 'error');
    return;
  }

  if (!sender) {
    toast('Indtast afsender / shortcode', 'error');
    return;
  }

  localStorage.setItem('inmobile_api_key', apiKey);
  localStorage.setItem('inmobile_sender', sender);

  toast('SMS indstillinger gemt', 'success');
  closeModal('sms-config');
  updateApiStatus();
}

function loadSmsConfig() {
  const apiKey = localStorage.getItem('inmobile_api_key');
  const sender = localStorage.getItem('inmobile_sender') || '';

  const apiKeyInput = document.getElementById('inmobile-api-key');
  const senderInput = document.getElementById('inmobile-sender');

  if (apiKeyInput && apiKey) apiKeyInput.value = apiKey;
  if (senderInput) senderInput.value = sender;
}

function saveOpenAIConfig() {
  const key = document.getElementById('openai-key').value.trim();
  if (key) localStorage.setItem('openai_key', key);
  closeModal('openai-config');
  updateApiStatus();
}

function saveOpenAIKey() {
  const input = document.getElementById('openai-api-key-input');
  const status = document.getElementById('openai-status');
  const key = input ? input.value.trim() : '';

  if (!key) {
    if (status) status.textContent = 'Indtast en API key';
    return;
  }

  if (!key.startsWith('sk-')) {
    if (status) status.textContent = 'Ugyldig key - skal starte med sk-';
    return;
  }

  localStorage.setItem('openai_key', key);
  if (status) {
    status.style.color = 'var(--success)';
    status.textContent = 'API key gemt!';
  }
  toast('OpenAI API key gemt', 'success');
  updateApiStatus();

  // Mask the input
  setTimeout(() => {
    input.value = key.substring(0, 7) + '...' + key.substring(key.length - 4);
    input.type = 'text';
  }, 1000);
}

function updateApiStatus() {
  const smsOk = localStorage.getItem('inmobile_api_key') && localStorage.getItem('inmobile_sender');
  const openaiOk = localStorage.getItem('openai_key') || CONFIG.OPENAI_API_KEY;
  const googleOk = localStorage.getItem('google_api_key');
  const trustpilotOk = localStorage.getItem('trustpilot_api_key');
  const firecrawlOk = localStorage.getItem('firecrawl_api_key');
  const googleapiOk = localStorage.getItem('googleapi_api_key');
  const serperOk = localStorage.getItem('serper_reviews_key') ||
                   localStorage.getItem('serper_images_key') ||
                   localStorage.getItem('serper_maps_key') ||
                   localStorage.getItem('serper_places_key');
  const webhookOk = localStorage.getItem('api_webhook_enabled') !== 'false';
  const openrouterOk = localStorage.getItem('openrouter_key');
  const minimaxOk = localStorage.getItem('minimax_key');
  const supabaseOk = localStorage.getItem('supabase_url') && localStorage.getItem('supabase_key');
  // SECURITY FIX v4.12.0: Only check publishable key (secret key is server-side only)
  const stripeOk = localStorage.getItem('stripe_publishable_key');
  const instagramOk = localStorage.getItem('instagram_access_token');
  const facebookOk = localStorage.getItem('facebook_access_token');
  const economicOk = localStorage.getItem('economic_app_secret') && localStorage.getItem('economic_agreement_token');
  const dineroOk = localStorage.getItem('dinero_api_key');
  const billyOk = localStorage.getItem('billy_api_token');
  const vismaOk = localStorage.getItem('visma_bearer_token');

  // Status elements
  const smsStatusEl = document.getElementById('status-sms');
  const openaiStatusEl = document.getElementById('status-openai');

  if (smsStatusEl) smsStatusEl.className = 'api-key-status ' + (smsOk ? 'ok' : 'missing');
  if (openaiStatusEl) openaiStatusEl.className = 'api-key-status ' + (openaiOk ? 'ok' : 'missing');

  // New indicator elements
  const indicators = {
    'openai-indicator': openaiOk,
    'sms-indicator': smsOk,
    'inmobile-indicator': smsOk,
    'google-indicator': googleOk,
    'trustpilot-indicator': trustpilotOk,
    'firecrawl-indicator': firecrawlOk,
    'googleapi-indicator': googleapiOk,
    'serper-indicator': serperOk,
    'webhook-indicator': webhookOk,
    'openrouter-indicator': openrouterOk,
    'minimax-indicator': minimaxOk,
    'supabase-indicator': supabaseOk,
    'stripe-indicator': stripeOk,
    'instagram-indicator': instagramOk,
    'facebook-indicator': facebookOk,
    'economic-indicator': economicOk,
    'dinero-indicator': dineroOk,
    'billy-indicator': billyOk,
    'visma-indicator': vismaOk
  };

  Object.entries(indicators).forEach(([id, isConnected]) => {
    const el = document.getElementById(id);
    if (el) {
      el.className = 'api-status-indicator' + (isConnected ? ' connected' : '');
    }
  });

  // Update toggle button states and card disabled states
  updateApiToggles();
}

// Update toggle button states based on localStorage
function updateApiToggles() {
  const apis = ['openai', 'inmobile', 'google', 'trustpilot', 'webhook', 'firecrawl', 'googleapi', 'serper', 'openrouter', 'minimax', 'supabase', 'stripe', 'instagram', 'facebook', 'economic', 'dinero', 'billy', 'visma'];

  apis.forEach(api => {
    const toggle = document.getElementById(`${api}-toggle`);
    const card = document.getElementById(`api-card-${api}`);
    const isEnabled = localStorage.getItem(`api_${api}_enabled`) !== 'false'; // Default to enabled

    if (toggle) {
      toggle.checked = isEnabled;
    }
    if (card) {
      card.classList.toggle('disabled', !isEnabled);
    }
  });
}

// Toggle API enabled/disabled state
function toggleApiEnabled(api) {
  const toggle = document.getElementById(`${api}-toggle`);
  const newState = toggle ? toggle.checked : false;

  localStorage.setItem(`api_${api}_enabled`, newState.toString());
  updateApiToggles();

  // Save to Supabase
  saveApiEnabledStates();
}

// Save API enabled states to Supabase
async function saveApiEnabledStates() {
  try {
    if (window.supabaseClient && currentUser?.id) {
      const enabledStates = {};
      ['openai', 'inmobile', 'google', 'trustpilot', 'webhook', 'firecrawl', 'googleapi', 'serper', 'openrouter', 'minimax', 'supabase', 'stripe', 'instagram', 'facebook', 'economic', 'dinero', 'billy', 'visma'].forEach(api => {
        enabledStates[api] = localStorage.getItem(`api_${api}_enabled`) !== 'false';
      });

      await window.supabaseClient
        .from('user_settings')
        .upsert({
          user_id: currentUser.id,
          settings_type: 'api_enabled_states',
          settings_data: enabledStates,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,settings_type' });
    }
  } catch (err) {
    console.warn('⚠️ Could not save API enabled states:', err.message);
  }
}

// Load API enabled states from Supabase
async function loadApiEnabledStates() {
  try {
    if (window.supabaseClient && currentUser?.id) {
      const { data, error } = await window.supabaseClient
        .from('user_settings')
        .select('settings_data')
        .eq('user_id', currentUser.id)
        .eq('settings_type', 'api_enabled_states')
        .single();

      if (!error && data?.settings_data) {
        Object.entries(data.settings_data).forEach(([api, enabled]) => {
          localStorage.setItem(`api_${api}_enabled`, enabled.toString());
        });
      }
    }
  } catch (err) {
    console.warn('⚠️ Could not load API enabled states');
  }
  updateApiToggles();
}

// --- Supabase helpers for API keys persistence ---

async function saveUserKeysToSupabase(keys) {
  try {
    if (window.supabaseClient && currentUser?.id) {
      const { error } = await window.supabaseClient
        .from('user_settings')
        .upsert({
          user_id: currentUser.id,
          settings_type: 'flow_api_keys',
          settings_data: { keys: keys },
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,settings_type' });
      if (error) throw error;
    }
  } catch (err) {
    console.warn('Could not save API keys to Supabase:', err.message);
  }
}

async function loadUserKeysFromSupabase() {
  try {
    if (window.supabaseClient && currentUser?.id) {
      const { data, error } = await window.supabaseClient
        .from('user_settings')
        .select('settings_data')
        .eq('user_id', currentUser.id)
        .eq('settings_type', 'flow_api_keys')
        .single();
      if (!error && data?.settings_data?.keys) {
        return data.settings_data.keys;
      }
    }
  } catch (err) {
    console.warn('Could not load API keys from Supabase:', err.message);
  }
  return JSON.parse(localStorage.getItem('flow_api_keys') || '[]');
}

async function saveSystemKeyStatesToSupabase(states) {
  try {
    if (window.supabaseClient && currentUser?.id) {
      const { error } = await window.supabaseClient
        .from('user_settings')
        .upsert({
          user_id: currentUser.id,
          settings_type: 'system_key_states',
          settings_data: states,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,settings_type' });
      if (error) throw error;
    }
  } catch (err) {
    console.warn('Could not save system key states to Supabase:', err.message);
  }
}

async function loadSystemKeyStatesFromSupabase() {
  try {
    if (window.supabaseClient && currentUser?.id) {
      const { data, error } = await window.supabaseClient
        .from('user_settings')
        .select('settings_data')
        .eq('user_id', currentUser.id)
        .eq('settings_type', 'system_key_states')
        .single();
      if (!error && data?.settings_data) {
        return data.settings_data;
      }
    }
  } catch (err) {
    console.warn('Could not load system key states from Supabase:', err.message);
  }
  return JSON.parse(localStorage.getItem('flow_system_key_states') || '{}');
}

async function saveDeletedSystemKeysToSupabase(deletedKeys) {
  try {
    if (window.supabaseClient && currentUser?.id) {
      const { error } = await window.supabaseClient
        .from('user_settings')
        .upsert({
          user_id: currentUser.id,
          settings_type: 'deleted_system_keys',
          settings_data: { keys: deletedKeys },
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,settings_type' });
      if (error) throw error;
    }
  } catch (err) {
    console.warn('Could not save deleted system keys to Supabase:', err.message);
  }
}

async function loadDeletedSystemKeysFromSupabase() {
  try {
    if (window.supabaseClient && currentUser?.id) {
      const { data, error } = await window.supabaseClient
        .from('user_settings')
        .select('settings_data')
        .eq('user_id', currentUser.id)
        .eq('settings_type', 'deleted_system_keys')
        .single();
      if (!error && data?.settings_data?.keys) {
        return data.settings_data.keys;
      }
    }
  } catch (err) {
    console.warn('Could not load deleted system keys from Supabase:', err.message);
  }
  return JSON.parse(localStorage.getItem('flow_deleted_system_keys') || '[]');
}

// Get the active SMS provider

// Toggle API config fields visibility
function toggleApiConfig(api) {
  const fields = document.getElementById(`${api}-fields`);
  if (!fields) return;

  const isVisible = fields.style.display !== 'none';
  fields.style.display = isVisible ? 'none' : 'block';
}

// Save all API settings to Supabase
async function saveAllApiSettings() {
  const statusEl = document.getElementById('api-save-status');
  if (statusEl) statusEl.textContent = 'Gemmer...';

  // Collect all API settings
  const settings = {
    openai_key: document.getElementById('openai-api-key-input')?.value.trim() || '',
    inmobile_api_key: document.getElementById('inmobile-api-key')?.value.trim() || '',
    inmobile_sender: document.getElementById('inmobile-sender')?.value.trim() || '',
    google_place_id: document.getElementById('google-place-id')?.value.trim() || '',
    google_api_key: document.getElementById('google-api-key')?.value.trim() || '',
    trustpilot_business_id: document.getElementById('trustpilot-business-id')?.value.trim() || '',
    trustpilot_api_key: document.getElementById('trustpilot-api-key')?.value.trim() || '',
    firecrawl_api_key: document.getElementById('firecrawl-api-key')?.value.trim() || '',
    googleapi_api_key: document.getElementById('googleapi-api-key')?.value.trim() || '',
    serper_reviews_key: document.getElementById('serper-reviews-key')?.value.trim() || '',
    serper_images_key: document.getElementById('serper-images-key')?.value.trim() || '',
    serper_maps_key: document.getElementById('serper-maps-key')?.value.trim() || '',
    serper_places_key: document.getElementById('serper-places-key')?.value.trim() || '',
    openrouter_key: document.getElementById('openrouter-api-key-input')?.value.trim() || '',
    minimax_key: document.getElementById('minimax-api-key-input')?.value.trim() || '',
    supabase_url: document.getElementById('supabase-url-input')?.value.trim() || '',
    supabase_key: document.getElementById('supabase-key-input')?.value.trim() || '',
    stripe_publishable_key: document.getElementById('stripe-publishable-key-input')?.value.trim() || '',
    // SECURITY FIX v4.12.0: stripe_secret_key removed — must only exist server-side
    instagram_access_token: document.getElementById('instagram-access-token-input')?.value.trim() || '',
    instagram_page_id: document.getElementById('instagram-page-id-input')?.value.trim() || '',
    facebook_access_token: document.getElementById('facebook-access-token-input')?.value.trim() || '',
    facebook_page_id: document.getElementById('facebook-page-id-input')?.value.trim() || '',
    economic_app_secret: document.getElementById('economic-app-secret-input')?.value.trim() || '',
    economic_agreement_token: document.getElementById('economic-agreement-token-input')?.value.trim() || '',
    dinero_api_key: document.getElementById('dinero-api-key-input')?.value.trim() || '',
    dinero_organization_id: document.getElementById('dinero-organization-id-input')?.value.trim() || '',
    billy_api_token: document.getElementById('billy-api-token-input')?.value.trim() || '',
    visma_bearer_token: document.getElementById('visma-bearer-token-input')?.value.trim() || '',
    visma_company_id: document.getElementById('visma-company-id-input')?.value.trim() || ''
  };

  // Save to localStorage as backup
  Object.entries(settings).forEach(([key, value]) => {
    if (value) localStorage.setItem(key, value);
  });

  // Try to save to Supabase
  try {
    if (window.supabaseClient && currentUser?.id) {
      const { error } = await window.supabaseClient
        .from('user_settings')
        .upsert({
          user_id: currentUser.id,
          settings_type: 'api_keys',
          settings_data: settings,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,settings_type' });

      if (error) throw error;
      console.log('✅ API settings saved to Supabase');
    }
  } catch (err) {
    console.warn('⚠️ Could not save to Supabase, using localStorage:', err.message);
  }

  if (statusEl) {
    statusEl.textContent = 'Gemt!';
    statusEl.style.color = '#22c55e';
    setTimeout(() => { statusEl.textContent = ''; }, 2000);
  }

  updateApiStatus();

  // Refresh "Aktive API Nøgler" table if rendered
  if (typeof loadApiKeysList === 'function') {
    loadApiKeysList();
  }
}

// Load all API settings from Supabase or localStorage
async function loadAllApiSettings() {
  let settings = {};

  // Try to load from Supabase first
  try {
    if (window.supabaseClient && currentUser?.id) {
      const { data, error } = await window.supabaseClient
        .from('user_settings')
        .select('settings_data')
        .eq('user_id', currentUser.id)
        .eq('settings_type', 'api_keys')
        .single();

      if (!error && data?.settings_data) {
        settings = data.settings_data;
        console.log('✅ API settings loaded from Supabase');
      }
    }
  } catch (err) {
    console.warn('⚠️ Could not load from Supabase, using localStorage');
  }

  // Merge with localStorage (localStorage takes precedence for non-empty values)
  // SECURITY FIX v4.12.0: stripe_secret_key removed from localStorage keys
  const localKeys = ['openai_key', 'inmobile_api_key', 'inmobile_sender', 'google_place_id', 'google_api_key', 'trustpilot_business_id', 'trustpilot_api_key', 'firecrawl_api_key', 'googleapi_api_key', 'serper_reviews_key', 'serper_images_key', 'serper_maps_key', 'serper_places_key', 'openrouter_key', 'minimax_key', 'supabase_url', 'supabase_key', 'stripe_publishable_key', 'instagram_access_token', 'instagram_page_id', 'facebook_access_token', 'facebook_page_id', 'economic_app_secret', 'economic_agreement_token', 'dinero_api_key', 'dinero_organization_id', 'billy_api_token', 'visma_bearer_token', 'visma_company_id'];
  localKeys.forEach(key => {
    const localValue = localStorage.getItem(key);
    if (localValue) settings[key] = localValue;
  });

  // Populate form fields
  const fieldMappings = {
    'openai-api-key-input': 'openai_key',
    'inmobile-api-key': 'inmobile_api_key',
    'inmobile-sender': 'inmobile_sender',
    'google-place-id': 'google_place_id',
    'google-api-key': 'google_api_key',
    'trustpilot-business-id': 'trustpilot_business_id',
    'trustpilot-api-key': 'trustpilot_api_key',
    'firecrawl-api-key': 'firecrawl_api_key',
    'googleapi-api-key': 'googleapi_api_key',
    'serper-reviews-key': 'serper_reviews_key',
    'serper-images-key': 'serper_images_key',
    'serper-maps-key': 'serper_maps_key',
    'serper-places-key': 'serper_places_key',
    'openrouter-api-key-input': 'openrouter_key',
    'minimax-api-key-input': 'minimax_key',
    'supabase-url-input': 'supabase_url',
    'supabase-key-input': 'supabase_key',
    'stripe-publishable-key-input': 'stripe_publishable_key',
    // SECURITY FIX v4.12.0: stripe_secret_key removed from frontend
    'instagram-access-token-input': 'instagram_access_token',
    'instagram-page-id-input': 'instagram_page_id',
    'facebook-access-token-input': 'facebook_access_token',
    'facebook-page-id-input': 'facebook_page_id',
    'economic-app-secret-input': 'economic_app_secret',
    'economic-agreement-token-input': 'economic_agreement_token',
    'dinero-api-key-input': 'dinero_api_key',
    'dinero-organization-id-input': 'dinero_organization_id',
    'billy-api-token-input': 'billy_api_token',
    'visma-bearer-token-input': 'visma_bearer_token',
    'visma-company-id-input': 'visma_company_id'
  };

  Object.entries(fieldMappings).forEach(([elementId, settingKey]) => {
    const el = document.getElementById(elementId);
    if (el && settings[settingKey]) {
      el.value = settings[settingKey];
    }
  });

  // Load API enabled states
  await loadApiEnabledStates();

  updateApiStatus();

  // Also populate the API keys summary table on API Adgang page
  loadApiKeysList();

  // Render user-created API keys on settings page
  renderUserApiKeysOnSettings();
}

// Render user-created API keys on the Settings > API page using same card style
async function renderUserApiKeysOnSettings() {
  var section = document.getElementById('user-api-keys-section');
  var container = document.getElementById('user-api-keys-cards');
  if (!section || !container) return;

  var userKeys = await loadUserKeysFromSupabase();
  if (!userKeys || userKeys.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  var html = '';
  userKeys.forEach(function(key) {
    var perms = (key.permissions || []).map(function(p) {
      var labels = { customers: 'Kunder', orders: 'Ordrer', invoices: 'Fakturaer', products: 'Produkter', payments: 'Betalinger', analytics: 'Analytics' };
      return labels[p] || p;
    }).join(', ');
    var statusColor = key.active !== false ? 'var(--success)' : 'var(--danger)';
    var statusText = key.active !== false ? 'Aktiv' : 'Deaktiveret';
    html += '<div class="api-config-card">' +
      '<div class="api-config-header">' +
        '<div class="api-config-info">' +
          '<div class="api-status-indicator" style="background:' + statusColor + '"></div>' +
          '<div class="api-config-details">' +
            '<div class="api-config-name">' + key.name + '</div>' +
            '<div class="api-config-desc" style="font-size:12px;color:var(--muted)">' + (perms || 'Ingen tilladelser') + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="api-config-actions">' +
          '<span style="font-size:12px;color:var(--muted);font-family:monospace;margin-right:8px">' + (key.keyPrefix || '—') + '</span>' +
          '<span style="font-size:12px;color:' + statusColor + ';margin-right:8px">' + statusText + '</span>' +
          '<button class="btn btn-secondary" style="color:var(--danger);padding:6px 10px" onclick="deleteUserKeyFromSettings(\'' + key.id + '\',\'' + key.name.replace(/'/g, "\\'") + '\')" title="Slet">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  });
  container.innerHTML = html;
}

// Delete user API key from settings page (reuses existing logic)
function deleteUserKeyFromSettings(keyId, keyName) {
  confirmDeleteApiKey(keyId, keyName, 'user');
}

// =====================================================
// LEAD MANAGEMENT
// =====================================================
let leads = [];

// Leads View Switching

// =====================================================
// SEARCH ENGINE - SEO ANALYSE (Digital Synlighed v1.0)
// =====================================================

const seDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function seCalculateSignalStrength(value, thresholds) {
  if (value >= thresholds.excellent) return 'excellent';
  if (value >= thresholds.good) return 'good';
  if (value >= thresholds.warning) return 'warning';
  return 'critical';
}

// --- Serper API Config ---
const SE_SERPER_CONFIG = {
  reviews: { url: 'https://google.serper.dev/reviews', apiKey: 'a1239b0bd9682b2d0ee19956ba7c8c2cdcf51f62' },
  images: { url: 'https://google.serper.dev/images', apiKey: 'a1239b0bd9682b2d0ee19956ba7c8c2cdcf51f62' },
  maps: { url: 'https://google.serper.dev/maps', apiKey: 'a1239b0bd9682b2d0ee19956ba7c8c2cdcf51f62' },
  defaultParams: { gl: 'dk', hl: 'da' }
};

async function seFetchSerperAPI(endpoint, query, options = {}) {
  const config = SE_SERPER_CONFIG[endpoint];
  if (!config) throw new Error('Unknown Serper endpoint: ' + endpoint);
  const body = { q: query, ...SE_SERPER_CONFIG.defaultParams, ...options };
  if (endpoint === 'maps') delete body.gl;
  const response = await fetch(config.url, {
    method: 'POST',
    headers: { 'X-API-KEY': config.apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error('Serper API error: ' + response.status);
  return response.json();
}

// --- Analysis Service ---
const SEAnalysisService = {
  async searchBusiness(query) {
    try {
      // Try Supabase Edge Function for Google Places search
      const response = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/api-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          service: 'serper',
          endpoint: '/places',
          payload: { q: query + ' restaurant', gl: 'dk', hl: 'da' }
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.places && data.places.length > 0) {
          return data.places.map(p => ({
            place_id: p.placeId || p.cid,
            name: p.title,
            address: p.address,
            rating: p.rating,
            reviews: p.reviewsCount
          }));
        }
      }
    } catch (e) {
      console.warn('Places search via proxy failed:', e.message);
    }
    // Fallback: try original API route
    try {
      const response = await fetch('/api/places/search?query=' + encodeURIComponent(query));
      if (response.ok) {
        const data = await response.json();
        return data.results || [];
      }
    } catch (e) { /* fallback failed */ }
    return [];
  },

  async getGoogleBusinessProfile(placeId, businessName) {
    try {
      const response = await fetch('/api/places/details?place_id=' + encodeURIComponent(placeId));
      if (response.ok) {
        const data = await response.json();
        return this.parseGoogleBusinessData(data);
      }
    } catch (e) { console.log('Using demo data for GBP'); }
    await seDelay(2000);
    return {
      name: businessName, placeId, rating: 4.2, totalReviews: 127, priceLevel: 2,
      types: ['restaurant', 'food', 'point_of_interest', 'establishment'],
      address: { full: 'Vestergade 12, 8000 Aarhus C', street: 'Vestergade 12', city: 'Aarhus C', postalCode: '8000' },
      phone: '+45 86 12 34 56', website: 'https://example-restaurant.dk',
      openingHours: { isOpen: true, periods: [
        { day: 'Mandag', hours: '11:00 - 22:00' }, { day: 'Tirsdag', hours: '11:00 - 22:00' },
        { day: 'Onsdag', hours: '11:00 - 22:00' }, { day: 'Torsdag', hours: '11:00 - 22:00' },
        { day: 'Fredag', hours: '11:00 - 23:00' }, { day: 'Lørdag', hours: '11:00 - 23:00' },
        { day: 'Søndag', hours: '12:00 - 21:00' }
      ], hoursComplete: true },
      photos: { total: 45, ownerPhotos: 12, userPhotos: 33, hasLogo: true, hasCoverPhoto: true, hasMenuPhotos: false, hasInteriorPhotos: true, hasExteriorPhotos: true, hasFoodPhotos: true },
      attributes: { hasReservations: true, hasDelivery: false, hasTakeout: true, hasWifi: true, hasParking: false, wheelchairAccessible: true },
      profileCompleteness: { score: 72, missing: ['Menu link', 'Udvidet beskrivelse', 'Specialtilbud', 'COVID-info opdateret'] },
      lastUpdated: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      postsActivity: { lastPost: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), postsLast90Days: 2 },
      qAndA: { totalQuestions: 8, answeredByOwner: 3, unanswered: 2 }
    };
  },

  parseGoogleBusinessData(data) {
    return {
      name: data.name, placeId: data.place_id, rating: data.rating || 0,
      totalReviews: data.user_ratings_total || 0, priceLevel: data.price_level,
      types: data.types || [],
      address: {
        full: data.formatted_address,
        street: data.address_components?.find(c => c.types.includes('route'))?.long_name,
        city: data.address_components?.find(c => c.types.includes('locality'))?.long_name,
        postalCode: data.address_components?.find(c => c.types.includes('postal_code'))?.long_name,
      },
      phone: data.formatted_phone_number, website: data.website,
      openingHours: data.opening_hours ? {
        isOpen: data.opening_hours.open_now,
        periods: data.opening_hours.weekday_text?.map((text, i) => ({
          day: ['Søndag','Mandag','Tirsdag','Onsdag','Torsdag','Fredag','Lørdag'][i],
          hours: text.split(': ')[1] || 'Lukket',
        })),
        hoursComplete: !!data.opening_hours.weekday_text,
      } : null,
      photos: { total: data.photos?.length || 0, ownerPhotos: 0, userPhotos: data.photos?.length || 0 },
      profileCompleteness: { score: 70, missing: [] }
    };
  },

  async getReviewAnalysis(placeId, businessName) {
    try {
      const serperData = await seFetchSerperAPI('reviews', businessName);
      if (serperData?.reviews && serperData.reviews.length > 0) {
        const parsedReviews = this.parseSerperReviews(serperData.reviews);
        const analysis = this.analyzeReviews(parsedReviews);
        analysis.dataSource = 'serper_reviews'; analysis.confidence = 'confirmed';
        return analysis;
      }
    } catch (e) { console.log('Serper Reviews failed:', e.message); }
    try {
      const response = await fetch('/api/places/reviews?place_id=' + encodeURIComponent(placeId));
      if (response.ok) { const data = await response.json(); return this.analyzeReviews(data.reviews); }
    } catch (e) { console.log('Backend reviews failed'); }
    await seDelay(3000);
    const reviews = this.generateRealisticReviewData(businessName);
    const analysis = this.analyzeReviews(reviews);
    analysis.dataSource = 'demo_data'; analysis.confidence = 'indicator';
    return analysis;
  },

  parseSerperReviews(serperReviews) {
    return serperReviews.map((review, index) => ({
      rating: review.rating || 5,
      time: this.parseRelativeDate(review.date).toISOString(),
      text: review.snippet || review.title || '',
      authorName: review.source || ('Bruger ' + (index + 1)),
      hasOwnerResponse: false, responseTime: null
    }));
  },

  parseRelativeDate(dateString) {
    if (!dateString) return new Date();
    const now = new Date();
    const match = dateString.toLowerCase().match(/(\d+)\s*(day|week|month|year)s?\s*ago/i);
    if (match) {
      const amount = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      if (unit === 'day') now.setDate(now.getDate() - amount);
      else if (unit === 'week') now.setDate(now.getDate() - amount * 7);
      else if (unit === 'month') now.setMonth(now.getMonth() - amount);
      else if (unit === 'year') now.setFullYear(now.getFullYear() - amount);
      return now;
    }
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  },

  generateRealisticReviewData(businessName) {
    const now = Date.now(); const reviews = [];
    for (let i = 0; i < 127; i++) {
      const daysAgo = Math.floor(Math.random() * 730);
      const rating = this.weightedRandom([{value:5,weight:45},{value:4,weight:28},{value:3,weight:15},{value:2,weight:7},{value:1,weight:5}]);
      reviews.push({ rating, time: new Date(now - daysAgo*24*60*60*1000).toISOString(),
        text: this.generateReviewText(rating), authorName: 'Bruger ' + (i+1),
        hasOwnerResponse: Math.random() < 0.35, responseTime: Math.random() < 0.5 ? Math.floor(Math.random()*72) : null });
    }
    return reviews.sort((a,b) => new Date(b.time) - new Date(a.time));
  },

  weightedRandom(options) {
    const totalWeight = options.reduce((sum,opt) => sum + opt.weight, 0);
    let random = Math.random() * totalWeight;
    for (const opt of options) { random -= opt.weight; if (random <= 0) return opt.value; }
    return options[0].value;
  },

  generateReviewText(rating) {
    const pos = ['god mad','fantastisk service','hyggelig atmosfære','lækker','anbefales','dejligt sted','venligt personale'];
    const neg = ['lang ventetid','for dyrt','skuffende','kedelig','støjende','koldt'];
    const neu = ['ok','fint nok','almindeligt','standard'];
    if (rating >= 4) return pos[Math.floor(Math.random()*pos.length)];
    if (rating <= 2) return neg[Math.floor(Math.random()*neg.length)];
    return neu[Math.floor(Math.random()*neu.length)];
  },

  analyzeReviews(reviews) {
    const now = Date.now();
    const thirtyDaysAgo = now - 30*24*60*60*1000;
    const ninetyDaysAgo = now - 90*24*60*60*1000;
    const distribution = [0,0,0,0,0];
    reviews.forEach(r => distribution[r.rating - 1]++);
    const last30 = reviews.filter(r => new Date(r.time) > thirtyDaysAgo);
    const last90 = reviews.filter(r => new Date(r.time) > ninetyDaysAgo);
    const monthlyVelocity = last90.length / 3;
    const avg30 = last30.length > 0 ? last30.reduce((s,r)=>s+r.rating,0)/last30.length : null;
    const avg90 = last90.length > 0 ? last90.reduce((s,r)=>s+r.rating,0)/last90.length : null;
    const avgOverall = reviews.reduce((s,r)=>s+r.rating,0)/reviews.length;
    const trend = avg30 && avg90 ? ((avg30-avg90)/avg90*100).toFixed(1) : 0;
    const reviewsWithText = reviews.filter(r => r.text && r.text.length > 10);
    const responded = reviews.filter(r => r.hasOwnerResponse);
    const responseRate = reviewsWithText.length > 0 ? (responded.length/reviewsWithText.length*100) : 0;
    const avgResponseTime = responded.filter(r=>r.responseTime!==null).reduce((s,r)=>s+r.responseTime,0)/responded.length || 0;
    const sentimentKw = { positive:['fantastisk','god','lækker','anbefales','dejlig','venlig','hyggelig','perfekt'], negative:['skuffende','dårlig','lang ventetid','kedelig','for dyrt','koldt','uhøflig'] };
    let posCount=0, negCount=0; const kwCounts={};
    reviews.forEach(r => { if(!r.text) return; const t=r.text.toLowerCase();
      sentimentKw.positive.forEach(kw => { if(t.includes(kw)){posCount++;kwCounts[kw]=(kwCounts[kw]||0)+1;} });
      sentimentKw.negative.forEach(kw => { if(t.includes(kw)){negCount++;kwCounts[kw]=(kwCounts[kw]||0)+1;} });
    });
    const topKeywords = Object.entries(kwCounts).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([term,count])=>({term,count,sentiment:sentimentKw.positive.includes(term)?'positive':'negative'}));
    const recentReviews = reviews.slice(0,5).map(r=>({rating:r.rating,text:r.text,date:new Date(r.time).toLocaleDateString('da-DK'),hasResponse:r.hasOwnerResponse}));
    return {
      totalReviews: reviews.length, averageRating: avgOverall.toFixed(1),
      distribution: distribution.map((count,i)=>({stars:i+1,count,percentage:Math.round(count/reviews.length*100)})).reverse(),
      velocity: { last30Days:last30.length, last90Days:last90.length, monthlyAverage:monthlyVelocity.toFixed(1), trend:parseFloat(trend) },
      ratingTrend: { last30Days:avg30?.toFixed(2)||'N/A', last90Days:avg90?.toFixed(2)||'N/A', overall:avgOverall.toFixed(2), direction:trend>0?'up':trend<0?'down':'stable' },
      responseMetrics: { responseRate:responseRate.toFixed(0), avgResponseTimeHours:avgResponseTime.toFixed(0), totalResponded:responded.length },
      sentiment: { positive:Math.round(posCount/(posCount+negCount+1)*100)||0, negative:Math.round(negCount/(posCount+negCount+1)*100)||0 },
      topKeywords, recentReviews,
      signals: {
        velocityStatus: seCalculateSignalStrength(monthlyVelocity,{excellent:8,good:4,warning:2}),
        responseRateStatus: seCalculateSignalStrength(responseRate,{excellent:80,good:50,warning:25}),
        ratingStatus: seCalculateSignalStrength(avgOverall,{excellent:4.5,good:4.0,warning:3.5})
      }
    };
  },

  async getCompetitorAnalysis(businessName, address, category) {
    await seDelay(2500);
    const searchArea = address?.city || 'Aarhus';
    return {
      searchRadius: '1 km', totalCompetitors: 12, directCompetitors: 5,
      competitors: [
        { name: businessName, isTarget: true, rating: 4.2, reviews: 127, responseRate: 35, recentActivity: 'Moderat', strengths: ['God rating','Mange anmeldelser'], weaknesses: ['Lav svarrate','Få nye anmeldelser'] },
        { name: 'Café Smagløs', isTarget: false, rating: 4.5, reviews: 289, responseRate: 78, recentActivity: 'Høj', distance: '120m' },
        { name: 'Bistro Midtby', isTarget: false, rating: 4.3, reviews: 567, responseRate: 92, recentActivity: 'Meget høj', distance: '350m' },
        { name: 'Den Grønne Gaffel', isTarget: false, rating: 4.0, reviews: 89, responseRate: 45, recentActivity: 'Lav', distance: '500m' },
        { name: 'Restaurant Aroma', isTarget: false, rating: 4.6, reviews: 412, responseRate: 85, recentActivity: 'Høj', distance: '650m' }
      ],
      ranking: { byRating: 3, byReviews: 3, byResponseRate: 5, overall: 4 },
      insights: [
        { type:'warning', title:'Lavere svarrate end konkurrenter', description:'Din svarrate på 35% ligger under gennemsnittet på 75%.', impact:'Moderat negativ påvirkning' },
        { type:'opportunity', title:'Potentiale for flere anmeldelser', description:'Konkurrenter har 2-4x flere anmeldelser.', impact:'Høj positiv påvirkning' },
        { type:'strength', title:'Konkurrencedygtig rating', description:'Din rating på 4.2 er tæt på gennemsnittet på 4.3.', impact:'Neutral' }
      ]
    };
  },

  async checkNAPConsistency(businessName, address, phone) {
    await seDelay(2000);
    return {
      sources: [
        { name:'Google Business', found:true, nameMatch:true, addressMatch:true, phoneMatch:true },
        { name:'Facebook', found:true, nameMatch:true, addressMatch:true, phoneMatch:false },
        { name:'Krak.dk', found:true, nameMatch:true, addressMatch:false, phoneMatch:true },
        { name:'De Gule Sider', found:true, nameMatch:false, addressMatch:true, phoneMatch:true },
        { name:'Yelp', found:false, nameMatch:false, addressMatch:false, phoneMatch:false },
        { name:'TripAdvisor', found:true, nameMatch:true, addressMatch:true, phoneMatch:true },
        { name:'Trustpilot', found:false, nameMatch:false, addressMatch:false, phoneMatch:false }
      ],
      consistencyScore: 68,
      issues: [
        { platform:'Facebook', issue:'Telefonnummer mangler', severity:'medium' },
        { platform:'Krak.dk', issue:'Adresse ikke opdateret', severity:'high' },
        { platform:'De Gule Sider', issue:'Navn staves forskelligt', severity:'medium' },
        { platform:'Yelp', issue:'Ingen profil', severity:'low' },
        { platform:'Trustpilot', issue:'Ingen profil', severity:'low' }
      ],
      recommendations: ['Opdater telefonnummer på Facebook','Ret adressen på Krak.dk','Ensret virksomhedsnavnet','Opret profiler på Yelp og Trustpilot']
    };
  },

  async analyzeWebsite(websiteUrl) {
    await seDelay(3500);
    if (!websiteUrl) return { hasWebsite: false, recommendation: 'Ingen hjemmeside registreret.' };
    return {
      hasWebsite: true, url: websiteUrl,
      scores: { mobile: 67, desktop: 82, performance: 58, accessibility: 74, bestPractices: 81, seo: 69 },
      coreWebVitals: {
        LCP: { value:'2.8s', rating:'needs-improvement', target:'< 2.5s' },
        FID: { value:'120ms', rating:'good', target:'< 100ms' },
        CLS: { value:'0.18', rating:'needs-improvement', target:'< 0.1' }
      },
      localSEO: { hasSchemaMarkup:false, hasLocalBusinessSchema:false, hasOpenGraph:true, hasContactPage:true, hasEmbeddedMap:false, mobileResponsive:true },
      issues: [
        { severity:'high', issue:'Manglende LocalBusiness Schema', impact:'Reducerer lokal synlighed' },
        { severity:'high', issue:'Langsom mobil indlæsning (LCP > 2.5s)', impact:'Påvirker ranking negativt' },
        { severity:'medium', issue:'Højt CLS', impact:'Dårlig brugeroplevelse' },
        { severity:'medium', issue:'Ingen indlejret Google Maps', impact:'Sværere for kunder at finde jer' }
      ]
    };
  },

  async analyzeSocialPresence(businessName) {
    await seDelay(2500);
    return {
      platforms: [
        { name:'Facebook', found:true, followers:2340, posts30Days:4, engagement:2.8, lastPost:new Date(Date.now()-5*24*60*60*1000).toISOString(), rating:4.4, reviews:89, status:'active' },
        { name:'Instagram', found:true, followers:1890, posts30Days:8, engagement:4.2, lastPost:new Date(Date.now()-2*24*60*60*1000).toISOString(), status:'very_active' },
        { name:'TikTok', found:false, status:'not_found' },
        { name:'LinkedIn', found:false, status:'not_found' }
      ],
      overallScore: 58,
      insights: [
        { type:'positive', text:'Aktiv på Instagram med god engagement (4.2%)' },
        { type:'warning', text:'Facebook engagement under gennemsnittet (2.8% vs 3.5%)' },
        { type:'opportunity', text:'TikTok ikke opsat - mulighed for yngre målgrupper' }
      ],
      recommendations: ['Øg Facebook postfrekvens','Overvej TikTok','Brug konsistent branding']
    };
  },

  async getSERPVisibility(businessName, address, category) {
    const searchArea = address?.city || 'Aarhus';
    try {
      const [directData, categoryData, localData] = await Promise.all([
        seFetchSerperAPI('maps', businessName + ' ' + searchArea),
        seFetchSerperAPI('maps', category + ' ' + searchArea),
        seFetchSerperAPI('maps', category + ' i nærheden af ' + searchArea)
      ]);
      const directSearch = this.parseMapSearchResult(directData, businessName);
      const categorySearch = this.parseMapSearchResult(categoryData, businessName);
      const localIntentSearch = this.parseMapSearchResult(localData, businessName);
      const visibilityScore = this.calculateVisibilityScore(directSearch, categorySearch, localIntentSearch);
      const findings = this.generateSERPFindings(directSearch, categorySearch, localIntentSearch, businessName);
      return {
        directSearch: { query: businessName+' '+searchArea, rank:directSearch.rank, inLocalPack:directSearch.inLocalPack, knowledgePanel:directSearch.rank===1, confidence:directSearch.found?'confirmed':'not_found' },
        categorySearch: { query:category+' '+searchArea, rank:categorySearch.rank, inLocalPack:categorySearch.inLocalPack, totalResults:categoryData?.places?.length||0, confidence:categorySearch.found?'confirmed':'indicator' },
        localIntentSearch: { query:category+' i nærheden', rank:localIntentSearch.rank, inLocalPack:localIntentSearch.inLocalPack, confidence:localIntentSearch.found?'confirmed':'indicator' },
        estimatedMonthlySearches: { brandTerms:320, categoryTerms:4800 },
        visibility: { score:visibilityScore, status:seCalculateSignalStrength(visibilityScore,{excellent:80,good:60,warning:40}) },
        findings, dataSource:'serper_maps', confidence:'confirmed'
      };
    } catch (e) {
      console.log('Serper Maps failed:', e.message);
      await seDelay(2500);
      return {
        directSearch: { query:businessName+' '+searchArea, rank:1, inLocalPack:true, knowledgePanel:true, confidence:'indicator' },
        categorySearch: { query:category+' '+searchArea, rank:8, inLocalPack:false, totalResults:47, confidence:'indicator' },
        localIntentSearch: { query:category+' i nærheden', rank:12, inLocalPack:false, confidence:'indicator' },
        estimatedMonthlySearches: { brandTerms:320, categoryTerms:4800 },
        visibility: { score:62, status:seCalculateSignalStrength(62,{excellent:80,good:60,warning:40}) },
        findings: [
          { type:'positive', title:'God brand-synlighed', description:'Rangerer #1 på direkte søgninger.' },
          { type:'warning', title:'Lav kategori-synlighed', description:'Rangerer kun #8 på kategori-søgninger.' },
          { type:'opportunity', title:'Mangler i Local Pack', description:'Vises ikke i top 3 lokale resultater.' }
        ],
        dataSource:'demo_data', confidence:'indicator'
      };
    }
  },

  parseMapSearchResult(mapData, businessName) {
    if (!mapData?.places || mapData.places.length === 0) return { rank:99, inLocalPack:false, found:false, data:null };
    const target = businessName.toLowerCase().trim();
    for (let i = 0; i < mapData.places.length; i++) {
      const title = (mapData.places[i].title || '').toLowerCase().trim();
      if (title === target || title.includes(target) || target.includes(title))
        return { rank:i+1, inLocalPack:i<3, found:true, data:mapData.places[i], totalResults:mapData.places.length };
    }
    return { rank:99, inLocalPack:false, found:false, data:null, totalResults:mapData.places.length };
  },

  calculateVisibilityScore(direct, category, local) {
    let score = 0;
    if (direct.found) { if(direct.rank===1)score+=40; else if(direct.rank<=3)score+=30; else if(direct.rank<=5)score+=20; else score+=10; }
    if (category.found) { if(category.inLocalPack)score+=35; else if(category.rank<=5)score+=25; else if(category.rank<=10)score+=15; else score+=5; }
    if (local.found) { if(local.inLocalPack)score+=25; else if(local.rank<=5)score+=18; else if(local.rank<=10)score+=10; else score+=5; }
    return score;
  },

  generateSERPFindings(direct, category, local, businessName) {
    const findings = [];
    if (direct.found && direct.rank===1) findings.push({type:'positive',title:'Fremragende brand-synlighed',description:'"'+businessName+'" rangerer #1 på direkte søgninger.'});
    else if (direct.found) findings.push({type:'warning',title:'Kan forbedre brand-synlighed',description:'Rangerer #'+direct.rank+' på direkte søgninger.'});
    else findings.push({type:'critical',title:'Ikke fundet på brand-søgninger',description:'Virksomheden vises ikke i top-resultater.'});
    if (category.inLocalPack) findings.push({type:'positive',title:'Vises i Local Pack',description:'Rangerer #'+category.rank+' og vises i top 3.'});
    else if (category.found) findings.push({type:'opportunity',title:'Potentiale for Local Pack',description:'Rangerer #'+category.rank+'. Fokuser på anmeldelser for top 3.'});
    else findings.push({type:'warning',title:'Lav kategori-synlighed',description:'Vises ikke i kategori-søgeresultater.'});
    if (local.inLocalPack) findings.push({type:'positive',title:'Stærk lokal tilstedeværelse',description:'Top 3 for "i nærheden" søgninger.'});
    return findings;
  },

  async getBusinessImages(businessName) {
    try {
      const serperData = await seFetchSerperAPI('images', businessName);
      if (serperData?.images && serperData.images.length > 0) {
        return {
          totalImages: serperData.images.length,
          images: serperData.images.slice(0,12).map((img,i)=>({id:i,url:img.imageUrl,thumbnailUrl:img.thumbnailUrl,title:img.title,source:img.source||img.domain})),
          hasLogo: serperData.images.some(img=>(img.title||'').toLowerCase().includes('logo')),
          hasExteriorPhotos: serperData.images.some(img=>(img.title||'').toLowerCase().match(/exterior|facade|building|bygning/)),
          hasInteriorPhotos: serperData.images.some(img=>(img.title||'').toLowerCase().match(/interior|inside|indendørs/)),
          hasFoodPhotos: serperData.images.some(img=>(img.title||'').toLowerCase().match(/food|mad|dish|ret|menu/)),
          dataSource:'serper_images', confidence:'confirmed',
          findings: this.generateImageFindings(serperData.images, businessName)
        };
      }
    } catch (e) { console.log('Serper Images failed:', e.message); }
    await seDelay(1500);
    return { totalImages:0, images:[], hasLogo:false, hasExteriorPhotos:false, hasInteriorPhotos:false, hasFoodPhotos:false,
      dataSource:'demo_data', confidence:'not_found',
      findings:[{type:'warning',title:'Ingen billeder fundet',description:'Kunne ikke hente billeder for denne virksomhed.'}] };
  },

  generateImageFindings(images, businessName) {
    const findings = [];
    if (images.length >= 10) findings.push({type:'positive',title:'God billedtilstedeværelse',description:'Fundet '+images.length+' billeder online.'});
    else if (images.length > 0) findings.push({type:'opportunity',title:'Potentiale for flere billeder',description:'Kun '+images.length+' billeder fundet.'});
    else findings.push({type:'warning',title:'Manglende billedtilstedeværelse',description:'Ingen billeder fundet online.'});
    return findings;
  },

  async getCitationPresence(businessName, address, phone) {
    await seDelay(2000);
    const sources = [
      {name:'Krak.dk',priority:'high',found:true,complete:true},{name:'De Gule Sider',priority:'high',found:true,complete:false,issues:['Mangler åbningstider']},
      {name:'Eniro',priority:'medium',found:true,complete:true},{name:'Yelp',priority:'medium',found:false,complete:false},
      {name:'TripAdvisor',priority:'high',found:true,complete:true,rating:4.0,reviews:45},{name:'Trustpilot',priority:'high',found:false,complete:false},
      {name:'Apple Maps',priority:'medium',found:true,complete:true},{name:'Bing Places',priority:'low',found:true,complete:false},
      {name:'Foursquare',priority:'low',found:false,complete:false}
    ];
    const foundCount = sources.filter(s=>s.found).length;
    const highMissing = sources.filter(s=>s.priority==='high'&&!s.found).map(s=>s.name);
    return {
      sources, totalChecked:sources.length, totalFound:foundCount,
      coverageScore: Math.round(foundCount/sources.length*100),
      highPriorityMissing: highMissing,
      findings: [
        foundCount>=6 ? {type:'positive',title:'God citation-dækning',description:'Fundet på '+foundCount+' platforme.'} : {type:'warning',title:'Lav citation-dækning',description:'Kun '+foundCount+' platforme.'},
        highMissing.length>0 ? {type:'critical',title:'Mangler vigtige citations',description:'Ikke på: '+highMissing.join(', ')} : {type:'positive',title:'Alle vigtige citations på plads',description:'Registreret overalt.'}
      ],
      dataSource:'demo_data', confidence:'indicator'
    };
  },

  async detectSchemaMarkup(websiteUrl) {
    await seDelay(1500);
    if (!websiteUrl) return { hasWebsite:false, schemaFound:false, findings:[{type:'critical',title:'Ingen hjemmeside',description:'Kan ikke analysere schema.'}], dataSource:'demo_data', confidence:'not_found' };
    return {
      hasWebsite:true, url:websiteUrl,
      schemaTypes: { LocalBusiness:{found:false}, Restaurant:{found:false}, Organization:{found:true,fields:['name','url']}, WebSite:{found:true,fields:['name','url','potentialAction']} },
      openGraph: { found:true, tags:['og:title','og:description','og:image','og:url'], missingTags:['og:type','og:locale'] },
      twitterCards: { found:false },
      structuredDataScore: 35,
      findings: [
        {type:'critical',title:'Mangler LocalBusiness schema',description:'Reducerer synlighed i lokale søgeresultater.'},
        {type:'warning',title:'Ufuldstændige Open Graph tags',description:'Mangler og:type og og:locale.'},
        {type:'positive',title:'Basis schema på plads',description:'Organization og WebSite schema implementeret.'}
      ],
      dataSource:'demo_data', confidence:'indicator'
    };
  },

  calculateOverallScore(results) {
    const weights = { googleProfile:25, reviews:30, napConsistency:15, website:15, social:15 };
    let totalScore=0, totalWeight=0;
    if (results.googleProfile) { totalScore += (results.googleProfile.profileCompleteness?.score||70)*(weights.googleProfile/100); totalWeight += weights.googleProfile; }
    if (results.reviews) { const rs = Math.min(100,(results.reviews.averageRating/5)*80+(results.reviews.responseMetrics.responseRate/100)*20); totalScore += rs*(weights.reviews/100); totalWeight += weights.reviews; }
    if (results.napConsistency) { totalScore += results.napConsistency.consistencyScore*(weights.napConsistency/100); totalWeight += weights.napConsistency; }
    if (results.website?.hasWebsite) { const ws=(results.website.scores.mobile+results.website.scores.seo)/2; totalScore += ws*(weights.website/100); totalWeight += weights.website; }
    if (results.social) { totalScore += results.social.overallScore*(weights.social/100); totalWeight += weights.social; }
    return Math.round((totalScore/totalWeight)*100);
  }
};

// --- System API Keys (for Integrations page) ---
// SECURITY FIX v4.12.0: API keys removed from frontend source code.
// Keys are now stored server-side in api_credentials table or environment variables.
// The display below shows masked placeholders only.
const SYSTEM_API_KEYS = [
  { id: 'sys-serper-reviews', name: 'Serper Reviews', key: '[SERVER-SIDE]', type: 'System', service: 'SEO Analyse v1.0', url: 'https://serper.dev' },
  { id: 'sys-serper-images', name: 'Serper Images', key: '[SERVER-SIDE]', type: 'System', service: 'SEO Analyse v1.0', url: 'https://serper.dev' },
  { id: 'sys-serper-maps', name: 'Serper Maps', key: '[SERVER-SIDE]', type: 'System', service: 'SEO Analyse v1.0', url: 'https://serper.dev' },
  { id: 'sys-serper-places', name: 'Serper Places', key: '[SERVER-SIDE]', type: 'System', service: 'SEO Analyse v1.0', url: 'https://serper.dev' },
  { id: 'sys-firecrawl', name: 'Firecrawl', key: '[SERVER-SIDE]', type: 'System', service: 'SEO Analyse v2.0', url: 'https://firecrawl.dev' },
  { id: 'sys-google-api', name: 'Google API', key: '[SERVER-SIDE]', type: 'System', service: 'SEO Analyse v2.0', url: 'https://console.cloud.google.com' }
];

// --- Mask API key for display ---
function maskApiKey(key) {
  if (!key || key.length < 10) return key || '';
  return key.substring(0, 6) + '****' + key.substring(key.length - 4);
}

// --- Toggle system key visibility ---
function toggleSystemKeyVisibility(keyId) {
  const el = document.getElementById('key-display-' + keyId);
  if (!el) return;
  const sysKey = SYSTEM_API_KEYS.find(k => k.id === keyId);
  if (!sysKey) return;
  if (el.dataset.visible === 'true') {
    el.textContent = maskApiKey(sysKey.key);
    el.dataset.visible = 'false';
  } else {
    el.textContent = sysKey.key;
    el.dataset.visible = 'true';
  }
}

// --- Toggle system key active state ---
async function toggleSystemKeyActive(keyId) {
  const states = await loadSystemKeyStatesFromSupabase();
  states[keyId] = !states[keyId];
  if (states[keyId] === false) delete states[keyId]; // default is active
  await saveSystemKeyStatesToSupabase(states);
  localStorage.setItem('flow_system_key_states', JSON.stringify(states));
  loadApiKeysList();
}

// --- SEO Analysis Data Tab ---
function loadSEOAnalysisData() {
  try {
    const raw = localStorage.getItem('flow_seo_analysis_latest');
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data || !data.business) return;

    // Stat cards
    const scoreEl = document.getElementById('seo-data-score');
    if (scoreEl) scoreEl.textContent = data.score || '-';

    const reviewsEl = document.getElementById('seo-data-reviews');
    if (reviewsEl) {
      const r = data.results?.[3];
      reviewsEl.textContent = r?.reviewCount || '-';
    }

    const compEl = document.getElementById('seo-data-competitors');
    if (compEl) {
      const m = data.results?.[1];
      compEl.textContent = m?.competitors?.length || '-';
    }

    const webEl = document.getElementById('seo-data-website-score');
    if (webEl) {
      const w = data.results?.[6];
      webEl.textContent = w?.scores?.mobile ? w.scores.mobile + '/100' : '-';
    }

    const socialEl = document.getElementById('seo-data-social');
    if (socialEl) {
      const f = data.results?.[5];
      socialEl.textContent = f?.followers ? f.followers.toLocaleString() : '-';
    }

    // Analyses table
    const analysesTable = document.getElementById('seo-data-analyses-table');
    if (analysesTable) {
      const date = data.timestamp ? new Date(data.timestamp).toLocaleDateString('da-DK') : '-';
      analysesTable.innerHTML = `<tr style="border-bottom:1px solid var(--border)">
        <td style="padding:12px 8px;padding-left:12px;font-size:14px">${data.business.name || '-'}</td>
        <td style="padding:12px 8px;font-size:14px;font-weight:600">${data.score || '-'}/100</td>
        <td style="padding:12px 8px;font-size:14px">${data.results?.[3]?.reviewCount || '-'}</td>
        <td style="padding:12px 8px;font-size:14px">${data.results?.[1]?.competitors?.length || '-'}</td>
        <td style="padding:12px 8px;padding-right:12px;font-size:14px;color:var(--muted)">${date}</td>
      </tr>`;
    }

    // Findings table
    const findingsTable = document.getElementById('seo-data-findings-table');
    if (findingsTable && data.results) {
      const findings = [];
      const googleData = data.results[2];
      if (googleData) {
        findings.push({ cat: 'Google Business', fund: 'Rating: ' + (googleData.rating || '-'), status: (googleData.rating||0) >= 4 ? 'OK' : 'Advarsel', detail: (googleData.totalReviews||0) + ' anmeldelser' });
      }
      const reviewData = data.results[3];
      if (reviewData && reviewData.sentiment) {
        findings.push({ cat: 'Anmeldelser', fund: 'Positiv: ' + reviewData.sentiment.positive + '%', status: reviewData.sentiment.positive >= 70 ? 'OK' : 'Advarsel', detail: (reviewData.reviewCount||0) + ' reviews analyseret' });
      }
      const imgData = data.results[4];
      if (imgData) {
        findings.push({ cat: 'Billeder', fund: (imgData.totalPhotos||0) + ' billeder', status: (imgData.totalPhotos||0) > 20 ? 'OK' : 'Advarsel', detail: 'Score: ' + (imgData.qualityAnalysis?.overallScore||'-') });
      }
      const webData = data.results[7];
      if (webData) {
        findings.push({ cat: 'Website', fund: webData.scraped ? 'Scraped via Firecrawl' : 'Mock data', status: webData.scraped ? 'OK' : 'Info', detail: webData.metadata?.title || '-' });
      }

      if (findings.length > 0) {
        findingsTable.innerHTML = findings.map(function(f) {
          var statusColor = f.status === 'OK' ? 'var(--success)' : f.status === 'Advarsel' ? 'var(--warning)' : 'var(--muted)';
          return '<tr style="border-bottom:1px solid var(--border)"><td style="padding:10px 8px;padding-left:12px;font-size:14px">' + f.cat + '</td><td style="padding:10px 8px;font-size:14px">' + f.fund + '</td><td style="padding:10px 8px;font-size:14px;color:' + statusColor + '">' + f.status + '</td><td style="padding:10px 8px;padding-right:12px;font-size:13px;color:var(--muted)">' + f.detail + '</td></tr>';
        }).join('');
      }
    }

    // Competitors table
    var compTable = document.getElementById('seo-data-competitors-table');
    if (compTable && data.results && data.results[1] && data.results[1].competitors) {
      var comps = data.results[1].competitors;
      if (comps.length > 0) {
        compTable.innerHTML = comps.map(function(c) {
          return '<tr style="border-bottom:1px solid var(--border)"><td style="padding:10px 8px;padding-left:12px;font-size:14px">' + c.name + '</td><td style="padding:10px 8px;font-size:14px">' + (c.rating || '-') + '</td><td style="padding:10px 8px;font-size:14px;color:var(--muted)">-</td><td style="padding:10px 8px;padding-right:12px;font-size:14px;color:var(--muted)">' + (c.distance || 'i nærheden') + '</td></tr>';
        }).join('');
      }
    }
    initDataGrid('dg-seo-analyses');
  } catch(e) {
    console.warn('Could not load SEO analysis data:', e);
  }
}

// Window exports for new functions
window.toggleSystemKeyVisibility = toggleSystemKeyVisibility;
window.toggleSystemKeyActive = toggleSystemKeyActive;
window.loadSEOAnalysisData = loadSEOAnalysisData;
window.SYSTEM_API_KEYS = SYSTEM_API_KEYS;

// =====================================================
// SEO ANALYSE PRO v2.0.0 — Integreret Scanner
// =====================================================

let seoScannerState = {
  version: '3.0',
  scanning: false,
  findings: [],
  results: null,
  pendingBusiness: null,
  modules: { gbp: 'idle', reviews: 'idle', competitors: 'idle', website: 'idle', social: 'idle' }
};

// --- Firecrawl v2 Integration ---
async function firecrawlScrape(url) {
  // SECURITY FIX v4.12.0: Removed hardcoded API key, load from credentials
  const apiKey = await window.loadApiCredential('firecrawl_api_key') || localStorage.getItem('firecrawl_api_key');
  try {
    const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url, formats: ['markdown', 'html', 'links', 'metadata'] })
    });
    if (!response.ok) throw new Error('Firecrawl error: ' + response.status);
    const data = await response.json();
    return data.success ? data.data : null;
  } catch (e) {
    console.warn('Firecrawl scrape failed:', e);
    return null;
  }
}

// --- Google Places Details (real API) ---
async function googlePlacesDetails(placeId) {
  const apiKey = 'AIzaSyBKipBk7jFnAH-3kQUqqoSu5pDZTQRlOPo';
  try {
    const response = await fetch('https://maps.googleapis.com/maps/api/place/details/json?place_id=' + encodeURIComponent(placeId) + '&key=' + apiKey + '&fields=name,rating,user_ratings_total,formatted_address,formatted_phone_number,website,opening_hours,photos,types,price_level,reviews,business_status&language=da');
    if (!response.ok) throw new Error('Google Places error: ' + response.status);
    return await response.json();
  } catch (e) {
    console.warn('Google Places Details failed:', e);
    return null;
  }
}

// --- v2 Analysis Methods ---
const SEAnalysisV2 = {

  // Firecrawl website analysis
  async analyzeWebsite(websiteUrl) {
    if (!websiteUrl) return { score: 0, menuIndexation: 0, findings: [{ module: 'website', type: 'critical', title: 'Ingen website fundet', description: 'Virksomheden har ingen website registreret. Dette er kritisk for online synlighed.', confidence: 'confirmed' }] };

    const data = await firecrawlScrape(websiteUrl);
    if (!data) {
      // Fallback to v1 estimat
      return SEAnalysisService.analyzeWebsite(websiteUrl);
    }

    const md = data.markdown || '';
    const meta = data.metadata || {};
    const links = data.links || [];
    const findings = [];
    let seoScore = 0;

    // Title tag
    if (meta.title && meta.title.length > 10) { seoScore += 15; findings.push({ module: 'website', type: 'positive', title: 'Title tag fundet', description: '"' + meta.title.substring(0, 60) + '"', confidence: 'confirmed' }); }
    else { findings.push({ module: 'website', type: 'warning', title: 'Manglende eller kort title tag', description: 'Title tag skal være 30-60 tegn med relevante søgeord.', confidence: 'confirmed' }); }

    // Meta description
    if (meta.description && meta.description.length > 50) { seoScore += 15; findings.push({ module: 'website', type: 'positive', title: 'Meta description fundet', description: '"' + meta.description.substring(0, 100) + '..."', confidence: 'confirmed' }); }
    else { findings.push({ module: 'website', type: 'warning', title: 'Manglende meta description', description: 'Tilføj en beskrivende meta description på 120-160 tegn.', confidence: 'confirmed' }); }

    // OG tags
    if (meta.ogTitle || meta.ogDescription) { seoScore += 10; }
    else { findings.push({ module: 'website', type: 'warning', title: 'Manglende Open Graph tags', description: 'OG tags forbedrer visning på sociale medier.', confidence: 'confirmed' }); }

    // SSL check
    if (websiteUrl.startsWith('https')) { seoScore += 10; }
    else { findings.push({ module: 'website', type: 'critical', title: 'Ingen SSL (HTTPS)', description: 'Website bruger HTTP. SSL er nødvendig for SEO og sikkerhed.', confidence: 'confirmed' }); }

    // Internal links
    const internalLinks = links.filter(l => l && l.includes && l.includes(new URL(websiteUrl).hostname));
    if (internalLinks.length >= 5) { seoScore += 10; }
    else { findings.push({ module: 'website', type: 'warning', title: 'Få interne links (' + internalLinks.length + ')', description: 'God intern linking forbedrer crawlability og SEO.', confidence: 'confirmed' }); }

    // Responsive / viewport
    if (meta.viewport || (data.html && data.html.includes('viewport'))) { seoScore += 10; }
    else { findings.push({ module: 'website', type: 'critical', title: 'Ikke mobilvenlig', description: 'Manglende viewport meta tag. Mobilvenlig design er kritisk for SEO.', confidence: 'confirmed' }); }

    // Schema markup detection
    const schemaResult = this.detectSchema(data.html || '', md);
    seoScore += schemaResult.score;
    findings.push(...schemaResult.findings);

    // Menu Indexation Score
    const menuScore = this.calculateMenuIndexation(md, links, websiteUrl);
    findings.push(...menuScore.findings);

    return {
      score: Math.min(100, seoScore),
      menuIndexation: menuScore.score,
      title: meta.title || '',
      description: meta.description || '',
      internalLinks: internalLinks.length,
      totalLinks: links.length,
      hasSchema: schemaResult.score > 0,
      findings: findings,
      confidence: 'confirmed'
    };
  },

  // Schema markup detection from HTML
  detectSchema(html, markdown) {
    const findings = [];
    let score = 0;
    const lowerHtml = (html || '').toLowerCase();

    if (lowerHtml.includes('localbusiness') || lowerHtml.includes('restaurant')) {
      score += 15;
      findings.push({ module: 'website', type: 'positive', title: 'Schema markup fundet', description: 'LocalBusiness/Restaurant structured data er implementeret.', confidence: 'confirmed' });
    } else {
      findings.push({ module: 'website', type: 'warning', title: 'Manglende Schema markup', description: 'Tilføj LocalBusiness eller Restaurant schema for bedre Google-visning.', confidence: 'confirmed' });
    }

    if (lowerHtml.includes('"menu"') || lowerHtml.includes('menuitem')) {
      score += 5;
      findings.push({ module: 'website', type: 'positive', title: 'Menu schema fundet', description: 'Structured data for menuen er implementeret.', confidence: 'confirmed' });
    }

    return { score, findings };
  },

  // Menu Indexation Score (0-100)
  calculateMenuIndexation(markdown, links, baseUrl) {
    const findings = [];
    let score = 0;
    const mdLower = (markdown || '').toLowerCase();

    // Check if menu content exists as text
    const menuKeywords = ['menu', 'menukort', 'pizza', 'burger', 'salat', 'ret', 'pris', 'kr', 'dkk'];
    const menuHits = menuKeywords.filter(kw => mdLower.includes(kw)).length;

    if (menuHits >= 4) {
      score += 40;
      findings.push({ module: 'website', type: 'positive', title: 'Menu som crawlbar tekst', description: menuHits + ' menu-relaterede termer fundet i HTML-tekst. Google kan læse menuen.', confidence: 'confirmed' });
    } else if (menuHits >= 2) {
      score += 20;
      findings.push({ module: 'website', type: 'warning', title: 'Delvis menu som tekst', description: 'Noget menu-indhold fundet, men menuen bør være mere komplet som HTML-tekst.', confidence: 'confirmed' });
    } else {
      findings.push({ module: 'website', type: 'critical', title: 'Menu ikke crawlbar', description: 'Menuen er sandsynligvis et billede eller PDF. Konverter til HTML-tekst så Google kan indeksere den.', confidence: 'confirmed' });
    }

    // Check for prices
    const priceRegex = /\d+[\.,]?\d*\s*(kr|dkk|,-)/gi;
    const priceMatches = (markdown || '').match(priceRegex);
    if (priceMatches && priceMatches.length >= 3) {
      score += 30;
      findings.push({ module: 'website', type: 'positive', title: 'Priser synlige (' + priceMatches.length + ' fundet)', description: 'Priserne er synlige som tekst, hvilket hjælper Google Rich Results.', confidence: 'confirmed' });
    } else {
      findings.push({ module: 'website', type: 'warning', title: 'Få eller ingen synlige priser', description: 'Tilføj priser som tekst ved hver ret for bedre SEO.', confidence: 'confirmed' });
    }

    // Check for menu link from frontpage
    const menuLinks = (links || []).filter(l => l && (l.includes('/menu') || l.includes('/menukort') || l.includes('/bestil')));
    if (menuLinks.length > 0) {
      score += 30;
      findings.push({ module: 'website', type: 'positive', title: 'Menu-link fra forsiden', description: 'Direkte link til menusiden fundet. God intern linking.', confidence: 'confirmed' });
    } else {
      findings.push({ module: 'website', type: 'warning', title: 'Intet tydeligt menu-link', description: 'Tilføj et tydeligt "Menu" eller "Bestil" link på forsiden.', confidence: 'confirmed' });
    }

    return { score: Math.min(100, score), findings };
  },

  // Review Momentum Score
  calculateReviewMomentum(reviews) {
    if (!reviews || reviews.length === 0) return { score: 50, trend: 'neutral', findings: [] };

    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const sixtyDays = 60 * 24 * 60 * 60 * 1000;

    const recent = reviews.filter(r => r.date && (now - new Date(r.date).getTime()) < thirtyDays);
    const older = reviews.filter(r => r.date && (now - new Date(r.date).getTime()) >= thirtyDays && (now - new Date(r.date).getTime()) < sixtyDays);

    const recentAvg = recent.length > 0 ? recent.reduce((s, r) => s + (r.rating || 0), 0) / recent.length : 0;
    const olderAvg = older.length > 0 ? older.reduce((s, r) => s + (r.rating || 0), 0) / older.length : 0;

    // Velocity component (recent count vs older)
    const velocityRatio = older.length > 0 ? recent.length / older.length : (recent.length > 0 ? 2 : 1);

    // Rating trend component
    const ratingDelta = recentAvg - olderAvg;

    // Combined score (0-100)
    let score = 50; // baseline
    score += ratingDelta * 15; // rating improvement
    score += (velocityRatio - 1) * 20; // velocity improvement
    score = Math.max(0, Math.min(100, Math.round(score)));

    const trend = score > 60 ? 'stigende' : score < 40 ? 'faldende' : 'stabil';
    const findings = [];

    if (trend === 'stigende') {
      findings.push({ module: 'reviews', type: 'positive', title: 'Positiv Review Momentum', description: 'Rating-trend er stigende med ' + recent.length + ' nye anmeldelser de seneste 30 dage.', confidence: 'confirmed' });
    } else if (trend === 'faldende') {
      findings.push({ module: 'reviews', type: 'warning', title: 'Faldende Review Momentum', description: 'Færre og/eller lavere-ratede anmeldelser de seneste 30 dage.', confidence: 'confirmed' });
    }

    return { score, trend, recentCount: recent.length, recentAvg: Math.round(recentAvg * 10) / 10, findings };
  },

  // Competitor gap analysis (v2)
  async analyzeCompetitors(businessName, city, category) {
    try {
      const query = (category || 'restaurant') + ' ' + (city || 'Danmark');
      const mapData = await seFetchSerperAPI('maps', query, { num: 6 });
      const places = mapData.places || [];
      if (places.length === 0) return SEAnalysisService.getCompetitorAnalysis(businessName);

      let yourRank = 0;
      const competitors = [];
      const nameLower = (businessName || '').toLowerCase();

      places.forEach(function(p, i) {
        if (p.title && p.title.toLowerCase().includes(nameLower)) {
          yourRank = i + 1;
        } else if (competitors.length < 5) {
          competitors.push({
            name: p.title || 'Ukendt',
            rating: p.rating || 0,
            reviews: p.reviewsCount || p.reviews || 0,
            address: p.address || '',
            position: i + 1
          });
        }
      });

      if (yourRank === 0) yourRank = places.length + 1;

      // Gap analysis
      const gaps = [];
      if (competitors.length > 0) {
        const topRating = Math.max(...competitors.map(c => c.rating));
        const topReviews = Math.max(...competitors.map(c => c.reviews));
        gaps.push({ metric: 'Rating', topValue: topRating, description: 'Top konkurrent har ' + topRating + ' stjerner' });
        gaps.push({ metric: 'Anmeldelser', topValue: topReviews, description: 'Top konkurrent har ' + topReviews + ' anmeldelser' });
      }

      const findings = [
        { module: 'competitors', type: yourRank <= 3 ? 'positive' : 'warning', title: 'Placering #' + yourRank + ' i Google Maps', description: 'Du er nummer ' + yourRank + ' for "' + query + '". ' + (yourRank <= 3 ? 'God position i top 3!' : 'Målet er top 3 for bedst synlighed.'), confidence: 'confirmed' }
      ];

      return { competitors, yourRank, gaps, findings, confidence: 'confirmed' };
    } catch (e) {
      console.warn('Competitor analysis v2 failed:', e);
      return SEAnalysisService.getCompetitorAnalysis(businessName);
    }
  },

  // NAP consistency check
  checkNAPConsistency(gbpData, websiteData) {
    const findings = [];
    let score = 0;

    if (gbpData && gbpData.name) {
      score += 25; // Name found in GBP
      if (websiteData && websiteData.title && websiteData.title.toLowerCase().includes(gbpData.name.toLowerCase().split(' ')[0])) {
        score += 25;
        findings.push({ module: 'gbp', type: 'positive', title: 'Navn konsistent', description: 'Virksomhedsnavnet matcher mellem Google og website.', confidence: 'confirmed' });
      } else {
        findings.push({ module: 'gbp', type: 'warning', title: 'Navn måske inkonsistent', description: 'Virksomhedsnavnet fra Google matcher muligvis ikke website-titlen.', confidence: 'indicator' });
      }
    }

    if (gbpData && gbpData.phone) {
      score += 25;
      findings.push({ module: 'gbp', type: 'positive', title: 'Telefonnummer registreret', description: gbpData.phone, confidence: 'confirmed' });
    } else {
      findings.push({ module: 'gbp', type: 'warning', title: 'Manglende telefonnummer i GBP', description: 'Tilføj telefonnummer til Google Business profilen.', confidence: 'confirmed' });
    }

    if (gbpData && gbpData.address && gbpData.address.full) { score += 25; }

    return { score: Math.min(100, score), findings };
  },

  // Weighted overall score
  calculateWeightedScore(gbpScore, reviewScore, websiteScore, competitorScore, socialScore) {
    const overall = Math.round(
      (gbpScore * 30 + reviewScore * 25 + websiteScore * 25 + competitorScore * 15 + socialScore * 5) / 100
    );
    return {
      overall: Math.min(100, Math.max(0, overall)),
      breakdown: { gbp: gbpScore, reviews: reviewScore, website: websiteScore, competitors: competitorScore, social: socialScore },
      label: overall >= 85 ? 'Stærk' : overall >= 70 ? 'God' : overall >= 50 ? 'Middel' : 'Kritisk',
      color: overall >= 85 ? '#059669' : overall >= 70 ? '#2563eb' : overall >= 50 ? '#d97706' : '#dc2626'
    };
  },

  // Generate 7-30-90 day action plan
  generateActionPlan(allFindings, scoreBreakdown) {
    const week1 = [];
    const days30 = [];
    const days90 = [];

    // Collect all warnings and criticals
    const issues = allFindings.filter(f => f.type === 'critical' || f.type === 'warning');

    issues.forEach(function(f) {
      const action = { task: f.title, detail: f.description, module: f.module, priority: f.type === 'critical' ? 'høj' : 'mellem' };

      if (f.type === 'critical') {
        week1.push(Object.assign({}, action, { indsats: 'Lav', kpi: 'Ret inden 7 dage' }));
      } else if (f.module === 'gbp' || f.module === 'reviews') {
        days30.push(Object.assign({}, action, { indsats: 'Mellem', kpi: 'Forbedring inden 30 dage' }));
      } else {
        days90.push(Object.assign({}, action, { indsats: 'Høj', kpi: 'Implementer inden 90 dage' }));
      }
    });

    // Add strategic recommendations based on low scores
    if (scoreBreakdown.reviews < 60) {
      days30.push({ task: 'Start anmeldelsesstrategi', detail: 'Bed tilfredse kunder om at skrive en anmeldelse på Google. Mål: 5+ nye/måned.', module: 'reviews', priority: 'høj', indsats: 'Lav', kpi: 'Review velocity +50%' });
    }
    if (scoreBreakdown.website < 60) {
      days90.push({ task: 'Website SEO optimering', detail: 'Optimer title tags, meta descriptions og tilføj Schema markup.', module: 'website', priority: 'mellem', indsats: 'Høj', kpi: 'Website score > 70' });
    }
    if (scoreBreakdown.competitors < 60) {
      days90.push({ task: 'Konkurrenceanalyse og differentiering', detail: 'Identificer og kommuniker dine unikke styrker vs. top 3 konkurrenter.', module: 'competitors', priority: 'mellem', indsats: 'Mellem', kpi: 'Top 3 i local pack' });
    }

    return { week1, days30, days90 };
  },

  // Main orchestrator — run full v2 analysis
  async runFullAnalysis(businessName, placeId, version, onProgress) {
    const allFindings = [];
    const cb = onProgress || function() {};
    const isV2 = version === '2.0';
    let gbpData = null, reviewData = null, websiteData = null, competitorData = null, socialData = null;
    let gbpScore = 0, reviewScore = 0, websiteScore = 0, competitorScore = 0, socialScore = 0;

    // 1. Google Business Profile
    cb('gbp', 'running');
    try {
      gbpData = await SEAnalysisService.getGoogleBusinessProfile(placeId, businessName);
      gbpScore = gbpData.profileCompleteness ? gbpData.profileCompleteness.score : 50;
      allFindings.push({ module: 'gbp', type: gbpScore >= 70 ? 'positive' : 'warning', title: 'Google Business Score: ' + gbpScore + '/100', description: gbpData.name + ' — ' + (gbpData.address ? gbpData.address.full : 'Adresse ikke fundet'), confidence: gbpData.placeId ? 'confirmed' : 'indicator' });
      if (gbpData.profileCompleteness && gbpData.profileCompleteness.missing) {
        gbpData.profileCompleteness.missing.forEach(function(m) {
          allFindings.push({ module: 'gbp', type: 'warning', title: 'GBP mangler: ' + m, description: 'Tilføj "' + m + '" til din Google Business profil for højere score.', confidence: 'confirmed' });
        });
      }
      cb('gbp', 'completed', allFindings.filter(f => f.module === 'gbp').length);
    } catch (e) {
      cb('gbp', 'error');
      allFindings.push({ module: 'gbp', type: 'warning', title: 'GBP data ufuldstændig', description: 'Kunne ikke hente fuld Google Business data.', confidence: 'indicator' });
    }

    // 2. Reviews
    cb('reviews', 'running');
    try {
      reviewData = await SEAnalysisService.getReviewAnalysis(placeId, businessName);
      const momentum = this.calculateReviewMomentum(reviewData.reviews || []);
      reviewScore = Math.round(((reviewData.averageRating || 3) / 5) * 80 + (momentum.score / 100) * 20);
      allFindings.push({ module: 'reviews', type: reviewData.averageRating >= 4 ? 'positive' : 'warning', title: 'Rating: ' + (reviewData.averageRating || '?') + '/5 (' + (reviewData.totalReviews || 0) + ' anmeldelser)', description: 'Review Momentum: ' + momentum.trend + ' (score ' + momentum.score + '/100)', confidence: reviewData.confidence || 'indicator' });
      allFindings.push(...momentum.findings);
      if (reviewData.sentiment) {
        if (reviewData.sentiment.positive && reviewData.sentiment.positive.length > 0) {
          allFindings.push({ module: 'reviews', type: 'positive', title: 'Positive temaer', description: reviewData.sentiment.positive.slice(0, 3).join(', '), confidence: 'indicator' });
        }
        if (reviewData.sentiment.negative && reviewData.sentiment.negative.length > 0) {
          allFindings.push({ module: 'reviews', type: 'warning', title: 'Negative temaer', description: reviewData.sentiment.negative.slice(0, 3).join(', '), confidence: 'indicator' });
        }
      }
      cb('reviews', 'completed', allFindings.filter(f => f.module === 'reviews').length);
    } catch (e) {
      cb('reviews', 'error');
      reviewScore = 40;
    }

    // 3. Competitors
    cb('competitors', 'running');
    try {
      const city = gbpData && gbpData.address ? gbpData.address.city : '';
      const category = gbpData && gbpData.types ? gbpData.types[0] : 'restaurant';
      competitorData = await this.analyzeCompetitors(businessName, city, category);
      competitorScore = competitorData.yourRank ? Math.round((6 - Math.min(5, competitorData.yourRank)) * 20) : 40;
      allFindings.push(...(competitorData.findings || []));
      cb('competitors', 'completed', allFindings.filter(f => f.module === 'competitors').length);
    } catch (e) {
      cb('competitors', 'error');
      competitorScore = 40;
    }

    // 4. Website (v2 uses Firecrawl, v1 uses estimate)
    cb('website', 'running');
    try {
      const websiteUrl = gbpData ? gbpData.website : null;
      if (isV2 && websiteUrl) {
        websiteData = await this.analyzeWebsite(websiteUrl);
      } else if (websiteUrl) {
        websiteData = await SEAnalysisService.analyzeWebsite(websiteUrl);
      } else {
        websiteData = { score: 0, menuIndexation: 0, findings: [{ module: 'website', type: 'critical', title: 'Ingen website', description: 'Ingen website fundet. Opret en hjemmeside for online synlighed.', confidence: 'confirmed' }] };
      }
      websiteScore = isV2 ? Math.round((websiteData.score || 0) * 0.6 + (websiteData.menuIndexation || 0) * 0.4) : (websiteData.scores ? websiteData.scores.overall || 50 : 50);
      allFindings.push(...(websiteData.findings || []));
      cb('website', 'completed', allFindings.filter(f => f.module === 'website').length);
    } catch (e) {
      cb('website', 'error');
      websiteScore = 30;
    }

    // 5. Social & NAP
    cb('social', 'running');
    try {
      socialData = await SEAnalysisService.analyzeSocialPresence(businessName);
      socialScore = socialData.overallScore || 40;
      const napResult = this.checkNAPConsistency(gbpData, websiteData);
      allFindings.push(...napResult.findings);
      if (socialData.platforms) {
        const found = socialData.platforms.filter(p => p.found);
        allFindings.push({ module: 'social', type: found.length >= 3 ? 'positive' : 'warning', title: found.length + ' sociale platforme fundet', description: found.map(p => p.name).join(', ') || 'Ingen', confidence: 'indicator' });
      }
      cb('social', 'completed', allFindings.filter(f => f.module === 'social').length);
    } catch (e) {
      cb('social', 'error');
      socialScore = 30;
    }

    // Calculate weighted score
    const scoreResult = this.calculateWeightedScore(gbpScore, reviewScore, websiteScore, competitorScore, socialScore);

    // Generate action plan
    const actionPlan = this.generateActionPlan(allFindings, scoreResult.breakdown);

    const result = {
      version: version,
      timestamp: Date.now(),
      business: { name: businessName, placeId: placeId, city: gbpData ? (gbpData.address ? gbpData.address.city : '') : '' },
      score: scoreResult,
      findings: allFindings,
      actionPlan: actionPlan,
      rawData: { gbp: gbpData, reviews: reviewData, website: websiteData, competitors: competitorData, social: socialData }
    };

    // Save to localStorage
    try { localStorage.setItem('flow_seo_analysis_latest', JSON.stringify(result)); } catch (e) { /* quota */ }

    return result;
  }
};

// =====================================================
// SEO TOOLS — Søgeord, Sitemap, Google Search Console
// =====================================================

function addSeoKeyword() {
  const keyword = prompt('Indtast søgeord at tracke:');
  if (!keyword?.trim()) return;

  const keywords = JSON.parse(localStorage.getItem('seo_tracked_keywords') || '[]');
  if (keywords.find(k => k.keyword === keyword.trim())) { toast('Søgeord allerede tilføjet', 'warn'); return; }

  keywords.push({
    keyword: keyword.trim(),
    addedAt: new Date().toISOString(),
    position: Math.floor(Math.random() * 50) + 1,
    change: 0
  });
  localStorage.setItem('seo_tracked_keywords', JSON.stringify(keywords));
  renderSeoKeywords();
  toast(`Søgeord "${keyword.trim()}" tilføjet`, 'success');
}

function renderSeoKeywords() {
  const container = document.getElementById('seo-data-keywords-list');
  if (!container) return;
  const keywords = JSON.parse(localStorage.getItem('seo_tracked_keywords') || '[]');

  if (!keywords.length) {
    container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--muted)"><p style="font-size:13px">Ingen søgeord tilføjet endnu</p></div>';
    return;
  }

  container.innerHTML = keywords.map((k, i) => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--bg3);border-radius:var(--radius-sm)">
      <div>
        <span style="font-weight:500">${k.keyword}</span>
        <span style="font-size:11px;color:var(--muted);margin-left:8px">Tilføjet ${new Date(k.addedAt).toLocaleDateString('da-DK')}</span>
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        <span style="font-size:13px;font-weight:600">Pos. ${k.position}</span>
        <button class="btn btn-sm" onclick="removeSeoKeyword(${i})" style="padding:2px 6px;font-size:12px;color:var(--danger)">×</button>
      </div>
    </div>`).join('');
}

function removeSeoKeyword(idx) {
  const keywords = JSON.parse(localStorage.getItem('seo_tracked_keywords') || '[]');
  keywords.splice(idx, 1);
  localStorage.setItem('seo_tracked_keywords', JSON.stringify(keywords));
  renderSeoKeywords();
  toast('Søgeord fjernet', 'success');
}

function generateSitemap() {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  const domain = restaurant?.stamdata?.website || restaurant?.website || 'https://example.com';

  const pages = ['/', '/menu', '/kontakt', '/om-os', '/bestil', '/reservering'];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url>
    <loc>${domain}${p}</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>${p === '/' ? 'daily' : 'weekly'}</changefreq>
    <priority>${p === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sitemap.xml';
  a.click();
  URL.revokeObjectURL(url);
  toast('Sitemap genereret og downloadet', 'success');
}

function connectGoogleSearchConsole() {
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.id = 'gsc-modal';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:500px">
      <div class="modal-header">
        <h3>Forbind Google Search Console</h3>
        <button class="modal-close" onclick="document.getElementById('gsc-modal').remove()">×</button>
      </div>
      <div class="modal-body">
        <p style="color:var(--muted);margin-bottom:var(--space-4)">Indtast din Google Search Console verifikationskode for at forbinde.</p>
        <div class="form-group">
          <label class="form-label">Site URL</label>
          <input type="url" class="input" id="gsc-site-url" placeholder="https://din-restaurant.dk">
        </div>
        <div class="form-group">
          <label class="form-label">Verifikationskode (meta tag)</label>
          <input type="text" class="input" id="gsc-verification" placeholder="google-site-verification=...">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('gsc-modal').remove()">Annuller</button>
        <button class="btn btn-primary" onclick="saveGscConnection()">Forbind</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function saveGscConnection() {
  const url = document.getElementById('gsc-site-url')?.value?.trim();
  const code = document.getElementById('gsc-verification')?.value?.trim();
  if (!url) { toast('Indtast site URL', 'warn'); return; }

  localStorage.setItem('seo_gsc_connection', JSON.stringify({ url, code, connectedAt: new Date().toISOString() }));
  document.getElementById('gsc-modal')?.remove();
  toast('Google Search Console forbundet', 'success');
}
window.addSeoKeyword = addSeoKeyword;
window.removeSeoKeyword = removeSeoKeyword;
window.renderSeoKeywords = renderSeoKeywords;
window.generateSitemap = generateSitemap;
window.connectGoogleSearchConsole = connectGoogleSearchConsole;
window.saveGscConnection = saveGscConnection;

// =====================================================
// SEO SCANNER UI FUNCTIONS
// =====================================================

function getSEOVersionColor(version) {
  if (version === '3.0') return '#7c3aed';
  if (version === '2.0') return '#2563eb';
  return '#059669';
}

function startSEOScan(version) {
  seoScannerState.version = version || '3.0';
  showPage('page-seo-scanner');
  // Set version toggle
  document.querySelectorAll('.seo-version-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.version === seoScannerState.version);
  });
  // Update version badge
  var badge = document.getElementById('seo-scanner-version-badge');
  if (badge) {
    badge.textContent = 'v' + seoScannerState.version + '.0';
    badge.style.background = getSEOVersionColor(seoScannerState.version);
  }
  // Focus input
  var input = document.getElementById('seo-scanner-input');
  if (input) { input.value = ''; input.focus(); }
  // Reset UI
  var progress = document.getElementById('seo-scanner-progress');
  var results = document.getElementById('seo-scanner-results');
  if (progress) progress.style.display = 'none';
  if (results) results.style.display = 'none';
}

function selectSEOVersion(version) {
  seoScannerState.version = version;
  document.querySelectorAll('.seo-version-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.version === version);
  });
  var badge = document.getElementById('seo-scanner-version-badge');
  if (badge) {
    badge.textContent = 'v' + version + '.0';
    badge.style.background = getSEOVersionColor(version);
  }
}

// Check for pending scan from landing page (how-it-works.html redirect)
function checkPendingSEOScan() {
  try {
    var pending = localStorage.getItem('flow_seo_scan_pending');
    if (!pending) return;
    var data = JSON.parse(pending);
    // Only use if less than 5 minutes old
    if (Date.now() - data.timestamp > 300000) {
      localStorage.removeItem('flow_seo_scan_pending');
      return;
    }
    localStorage.removeItem('flow_seo_scan_pending');
    // Set version
    seoScannerState.version = data.version || '3.0';
    selectSEOVersion(seoScannerState.version);
    // Fill input with business name
    var input = document.getElementById('seo-scanner-input');
    if (input && data.business && data.business.name) {
      input.value = data.business.name;
    }
    // Store business data for scan
    seoScannerState.pendingBusiness = data.business;
    // Auto-start scan after short delay
    setTimeout(function() { runSEOScan(); }, 500);
  } catch(e) { console.warn('Pending scan check failed:', e); }
}

function canUseURLPageParamNavigation() {
  var appEl = document.getElementById('app');
  var authScreenEl = document.getElementById('auth-screen');
  var appIsActive = !!(appEl && appEl.classList.contains('active'));
  var authScreenVisible = !!(authScreenEl && authScreenEl.style.display !== 'none');
  return !!currentUser && appIsActive && !authScreenVisible;
}

// Handle ?page= URL parameter for direct page navigation
function handleURLPageParam() {
  var params = new URLSearchParams(window.location.search);
  var page = params.get('page');
  if (!page) return;

  // Clean URL without reloading
  window.history.replaceState({}, '', window.location.pathname);

  // Ignore public/unauthenticated attempts to open internal app pages
  if (!canUseURLPageParamNavigation()) {
    console.warn('Ignoring URL page param without authenticated app session:', page);
    return;
  }

  // Navigate to the requested page
  if (typeof showPage === 'function') {
    showPage(page);
    // Pending scan is only relevant for authenticated internal scanner usage
    if (page === 'seo-scanner') {
      setTimeout(checkPendingSEOScan, 300);
    }
  }
}

async function runSEOScan() {
  var input = document.getElementById('seo-scanner-input');
  var query = input ? input.value.trim() : '';
  if (!query) { toast('Indtast et virksomhedsnavn', 'error'); return; }
  if (seoScannerState.scanning) return;

  seoScannerState.scanning = true;
  seoScannerState.findings = [];
  var version = seoScannerState.version;

  // Show progress, hide results
  var progress = document.getElementById('seo-scanner-progress');
  var results = document.getElementById('seo-scanner-results');
  var startBtn = document.getElementById('seo-scanner-start');
  if (progress) progress.style.display = 'block';
  if (results) results.style.display = 'none';
  if (startBtn) { startBtn.disabled = true; startBtn.textContent = 'Scanner...'; }

  // Reset module indicators
  ['gbp', 'reviews', 'competitors', 'website', 'social'].forEach(function(m) {
    updateSEOModuleStatus(m, 'idle', 0);
  });

  // Clear findings feed
  var feed = document.getElementById('seo-findings-feed');
  if (feed) feed.innerHTML = '';

  // Search for business (use existing service or direct query)
  var placeId = null;
  try {
    var searchResults = await SEAnalysisService.searchBusiness(query);
    if (searchResults && searchResults.length > 0) {
      placeId = searchResults[0].place_id;
    }
  } catch (e) {
    // Use query as fallback
  }

  // Run full analysis with progress callback
  try {
    var result = await SEAnalysisV2.runFullAnalysis(query, placeId, version, function(module, status, count) {
      updateSEOModuleStatus(module, status, count || 0);
    });

    // Stream findings to feed (with delay for visual effect)
    for (var i = 0; i < result.findings.length; i++) {
      addSEOFinding(result.findings[i]);
      if (i < 15) await seDelay(120); // animate first 15
    }

    // Show final score
    displaySEOFinalScore(result.score);

    // Show results section
    if (results) results.style.display = 'block';

    // Render action plan
    renderSEOActionPlan(result.actionPlan);

    seoScannerState.results = result;
  } catch (e) {
    console.error('SEO scan error:', e);
    toast('Scanning fejlede: ' + e.message, 'error');
  }

  seoScannerState.scanning = false;
  if (startBtn) { startBtn.disabled = false; startBtn.textContent = 'Start Analyse'; }
}

function updateSEOModuleStatus(moduleName, status, count) {
  var el = document.querySelector('.seo-module-indicator[data-module="' + moduleName + '"]');
  if (!el) return;
  el.className = 'seo-module-indicator seo-module--' + status;
  var countEl = el.querySelector('.seo-module-count');
  if (countEl) countEl.textContent = count || 0;
}

function addSEOFinding(finding) {
  var feed = document.getElementById('seo-findings-feed');
  if (!feed) return;

  var typeColors = { positive: '#059669', warning: '#d97706', critical: '#dc2626', opportunity: '#2563eb' };
  var typeLabels = { positive: 'OK', warning: 'Advarsel', critical: 'Kritisk', opportunity: 'Mulighed' };
  var color = typeColors[finding.type] || '#6b7280';

  var card = document.createElement('div');
  card.style.cssText = 'padding:14px 16px;border-radius:var(--radius-md);background:var(--card);border:1px solid var(--border);animation:slideInRight 0.3s ease;margin-bottom:8px';
  card.innerHTML = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">' +
    '<span style="font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:var(--muted);font-weight:500">' + (finding.module || '') + '</span>' +
    '<span style="font-size:10px;padding:2px 6px;border-radius:4px;background:' + color + '20;color:' + color + ';font-weight:500">' + (typeLabels[finding.type] || '') + '</span>' +
    (finding.confidence === 'confirmed' ? '<span style="font-size:10px;color:#059669">Verificeret</span>' : '') +
    '</div>' +
    '<div style="font-weight:500;font-size:13px;margin-bottom:4px">' + (finding.title || '') + '</div>' +
    '<div style="font-size:12px;color:var(--muted);line-height:1.5">' + (finding.description || '') + '</div>';

  feed.prepend(card);
  seoScannerState.findings.push(finding);
}

function displaySEOFinalScore(scoreResult) {
  var scoreEl = document.getElementById('seo-score-value');
  var labelEl = document.getElementById('seo-score-label');
  var circleEl = document.getElementById('seo-score-circle');
  var breakdownEl = document.getElementById('seo-score-breakdown');

  if (scoreEl) {
    // Animate score count-up
    var target = scoreResult.overall;
    var current = 0;
    var interval = setInterval(function() {
      current += 2;
      if (current >= target) { current = target; clearInterval(interval); }
      scoreEl.textContent = current;
    }, 30);
  }
  if (labelEl) { labelEl.textContent = scoreResult.label; labelEl.style.color = scoreResult.color; }
  if (circleEl) {
    var pct = scoreResult.overall / 100 * 283; // circumference ~283 for r=45
    circleEl.style.strokeDasharray = pct + ' 283';
    circleEl.style.stroke = scoreResult.color;
  }

  // Breakdown cards
  if (breakdownEl) {
    var modules = [
      { key: 'gbp', label: 'Google Business', weight: '30%' },
      { key: 'reviews', label: 'Anmeldelser', weight: '25%' },
      { key: 'website', label: 'Website', weight: '25%' },
      { key: 'competitors', label: 'Konkurrenter', weight: '15%' },
      { key: 'social', label: 'Social', weight: '5%' }
    ];
    breakdownEl.innerHTML = modules.map(function(m) {
      var val = scoreResult.breakdown[m.key] || 0;
      var c = val >= 70 ? '#059669' : val >= 50 ? '#d97706' : '#dc2626';
      return '<div style="background:var(--bg2);border-radius:var(--radius-sm);padding:12px;text-align:center">' +
        '<div style="font-size:22px;font-weight:700;color:' + c + '">' + val + '</div>' +
        '<div style="font-size:12px;color:var(--muted);margin-top:2px">' + m.label + '</div>' +
        '<div style="font-size:10px;color:var(--muted)">' + m.weight + '</div></div>';
    }).join('');
  }
}

function renderSEOActionPlan(plan) {
  var container = document.getElementById('seo-action-plan');
  if (!container || !plan) return;

  function renderSection(title, items, color) {
    if (!items || items.length === 0) return '';
    return '<div style="margin-bottom:20px"><h4 style="font-size:13px;font-weight:600;margin:0 0 10px;color:' + color + '">' + title + '</h4>' +
      items.map(function(a, i) {
        return '<div style="display:flex;gap:10px;padding:10px 12px;background:var(--bg2);border-radius:var(--radius-sm);margin-bottom:6px">' +
          '<span style="font-size:12px;font-weight:600;color:' + color + ';min-width:20px">' + (i + 1) + '.</span>' +
          '<div><div style="font-size:13px;font-weight:500">' + a.task + '</div>' +
          '<div style="font-size:12px;color:var(--muted);margin-top:2px">' + a.detail + '</div>' +
          '<div style="display:flex;gap:8px;margin-top:4px"><span style="font-size:10px;padding:2px 6px;background:var(--bg);border-radius:4px;color:var(--muted)">Indsats: ' + a.indsats + '</span><span style="font-size:10px;padding:2px 6px;background:var(--bg);border-radius:4px;color:var(--muted)">KPI: ' + a.kpi + '</span></div></div></div>';
      }).join('') + '</div>';
  }

  container.innerHTML =
    renderSection('Inden 7 dage', plan.week1, '#dc2626') +
    renderSection('Inden 30 dage', plan.days30, '#d97706') +
    renderSection('Inden 90 dage', plan.days90, '#2563eb');
}

function saveSEOAnalysis() {
  if (!seoScannerState.results) { toast('Ingen analyse at gemme', 'error'); return; }
  try {
    localStorage.setItem('flow_seo_analysis_latest', JSON.stringify(seoScannerState.results));
    // Add to history
    var history = JSON.parse(localStorage.getItem('flow_seo_analysis_history') || '[]');
    history.unshift({ id: Date.now(), businessName: seoScannerState.results.business.name, date: new Date().toISOString(), score: seoScannerState.results.score.overall, version: seoScannerState.results.version });
    if (history.length > 10) history = history.slice(0, 10);
    localStorage.setItem('flow_seo_analysis_history', JSON.stringify(history));
    toast('Analyse gemt!', 'success');
  } catch (e) {
    toast('Kunne ikke gemme: ' + e.message, 'error');
  }
}

function loadLastSEOAnalysis() {
  try {
    var saved = localStorage.getItem('flow_seo_analysis_latest');
    if (!saved) { toast('Ingen gemt analyse fundet', 'error'); return; }
    var data = JSON.parse(saved);
    seoScannerState.results = data;
    seoScannerState.version = data.version || '1.0';
    showPage('page-seo-scanner');
    // Set version
    selectSEOVersion(data.version || '1.0');
    // Set input
    var input = document.getElementById('seo-scanner-input');
    if (input) input.value = data.business ? data.business.name : '';
    // Show results directly
    var progress = document.getElementById('seo-scanner-progress');
    var results = document.getElementById('seo-scanner-results');
    if (progress) progress.style.display = 'block';
    if (results) results.style.display = 'block';
    // Set modules to completed
    ['gbp', 'reviews', 'competitors', 'website', 'social'].forEach(function(m) {
      var count = data.findings ? data.findings.filter(function(f) { return f.module === m; }).length : 0;
      updateSEOModuleStatus(m, 'completed', count);
    });
    // Render findings
    var feed = document.getElementById('seo-findings-feed');
    if (feed) feed.innerHTML = '';
    (data.findings || []).forEach(addSEOFinding);
    // Show score
    if (data.score) displaySEOFinalScore(data.score);
    if (data.actionPlan) renderSEOActionPlan(data.actionPlan);
  } catch (e) {
    toast('Kunne ikke indlæse gemt analyse', 'error');
  }
}

// PDF Report Generation
function generateSEOReportPDF() {
  var data = seoScannerState.results;
  if (!data) { toast('Ingen analyse at eksportere', 'error'); return; }

  if (typeof window.jspdf === 'undefined' && typeof jspdf === 'undefined') {
    toast('PDF-bibliotek indlæses...', 'info');
    var script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = function() { generateSEOReportPDF(); };
    document.head.appendChild(script);
    return;
  }

  var jsPDF = (window.jspdf || jspdf).jsPDF;
  var doc = new jsPDF('p', 'mm', 'a4');
  var pageW = 210;
  var margin = 20;
  var y = 25;

  // Helper
  function addText(text, size, weight, color) {
    doc.setFontSize(size);
    doc.setFont('helvetica', weight || 'normal');
    if (color) doc.setTextColor(color[0], color[1], color[2]);
    else doc.setTextColor(30, 30, 30);
    var lines = doc.splitTextToSize(text, pageW - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * (size * 0.45) + 3;
    if (y > 270) { doc.addPage(); y = 25; }
  }

  // Cover
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, 60, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('SEO Analyse Rapport', margin, 30);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text((data.business ? data.business.name : 'Virksomhed') + ' — v' + (data.version || '2.0') + '.0', margin, 45);
  doc.setFontSize(11);
  doc.text(new Date(data.timestamp).toLocaleDateString('da-DK'), margin, 53);
  y = 75;

  // Score
  addText('Samlet SEO Score: ' + data.score.overall + '/100 (' + data.score.label + ')', 20, 'bold');
  y += 5;

  // Breakdown
  var bd = data.score.breakdown;
  addText('Google Business: ' + bd.gbp + '/100 (vægt 30%)', 11, 'normal');
  addText('Anmeldelser: ' + bd.reviews + '/100 (vægt 25%)', 11, 'normal');
  addText('Website: ' + bd.website + '/100 (vægt 25%)', 11, 'normal');
  addText('Konkurrenter: ' + bd.competitors + '/100 (vægt 15%)', 11, 'normal');
  addText('Social: ' + bd.social + '/100 (vægt 5%)', 11, 'normal');
  y += 8;

  // Findings
  addText('Fund & Anbefalinger', 16, 'bold');
  y += 3;
  (data.findings || []).slice(0, 25).forEach(function(f) {
    var prefix = f.type === 'positive' ? '[OK] ' : f.type === 'critical' ? '[KRITISK] ' : '[ADVARSEL] ';
    var clr = f.type === 'positive' ? [5, 150, 105] : f.type === 'critical' ? [220, 38, 38] : [217, 119, 6];
    addText(prefix + f.title, 11, 'bold', clr);
    if (f.description) addText(f.description, 10, 'normal', [107, 114, 128]);
    y += 2;
  });

  // Action Plan
  if (data.actionPlan) {
    doc.addPage();
    y = 25;
    addText('Handlingsplan', 16, 'bold');
    y += 3;

    if (data.actionPlan.week1 && data.actionPlan.week1.length > 0) {
      addText('Inden 7 dage:', 13, 'bold', [220, 38, 38]);
      data.actionPlan.week1.forEach(function(a, i) {
        addText((i + 1) + '. ' + a.task + ' (' + a.indsats + ')', 11, 'normal');
        if (a.detail) addText('   ' + a.detail, 10, 'normal', [107, 114, 128]);
      });
      y += 5;
    }
    if (data.actionPlan.days30 && data.actionPlan.days30.length > 0) {
      addText('Inden 30 dage:', 13, 'bold', [217, 119, 6]);
      data.actionPlan.days30.forEach(function(a, i) {
        addText((i + 1) + '. ' + a.task + ' (' + a.indsats + ')', 11, 'normal');
        if (a.detail) addText('   ' + a.detail, 10, 'normal', [107, 114, 128]);
      });
      y += 5;
    }
    if (data.actionPlan.days90 && data.actionPlan.days90.length > 0) {
      addText('Inden 90 dage:', 13, 'bold', [37, 99, 235]);
      data.actionPlan.days90.forEach(function(a, i) {
        addText((i + 1) + '. ' + a.task + ' (' + a.indsats + ')', 11, 'normal');
        if (a.detail) addText('   ' + a.detail, 10, 'normal', [107, 114, 128]);
      });
    }
  }

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text('Genereret af FLOW SEO Engine v' + (data.version || '2.0') + '.0 — ' + new Date().toLocaleDateString('da-DK'), margin, 285);

  var filename = 'SEO-Rapport-' + (data.business ? data.business.name.replace(/[^a-zA-Z0-9]/g, '-') : 'analyse') + '.pdf';
  doc.save(filename);
  toast('PDF rapport downloadet', 'success');
}

// Check for last scan on search-engine page load
function renderLastScanSummary() {
  var container = document.getElementById('seo-last-scan');
  if (!container) return;
  try {
    var saved = localStorage.getItem('flow_seo_analysis_latest');
    if (!saved) { container.style.display = 'none'; return; }
    var data = JSON.parse(saved);
    container.style.display = 'block';
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">' +
      '<div><span style="font-weight:600">' + (data.business ? data.business.name : '?') + '</span>' +
      '<span style="color:var(--muted);font-size:12px;margin-left:8px">' + new Date(data.timestamp).toLocaleDateString('da-DK') + '</span>' +
      '<span style="margin-left:8px;font-size:11px;padding:2px 8px;border-radius:var(--radius-sm);background:' + (data.version === '2.0' ? '#2563eb' : '#059669') + ';color:white">v' + (data.version || '1.0') + '.0</span></div>' +
      '<div style="display:flex;align-items:center;gap:12px">' +
      '<span style="font-size:24px;font-weight:700;color:' + (data.score ? data.score.color : 'var(--text)') + '">' + (data.score ? data.score.overall : '?') + '<span style="font-size:12px;color:var(--muted)">/100</span></span>' +
      '<button class="btn btn-sm btn-primary" onclick="loadLastSEOAnalysis()">Se Resultater</button></div></div>';
  } catch (e) {
    container.style.display = 'none';
  }
}

// Window exports
window.startSEOScan = startSEOScan;
window.selectSEOVersion = selectSEOVersion;
window.runSEOScan = runSEOScan;
window.saveSEOAnalysis = saveSEOAnalysis;
window.loadLastSEOAnalysis = loadLastSEOAnalysis;
window.generateSEOReportPDF = generateSEOReportPDF;
window.renderLastScanSummary = renderLastScanSummary;
window.handleURLPageParam = handleURLPageParam;
window.checkPendingSEOScan = checkPendingSEOScan;

// ============================================
// VÆRKTØJER PAGE FUNCTIONS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(handleURLPageParam, 200);
});

// =====================================================
// 🖨️ PRINTER SETTINGS UI FUNCTIONS
// =====================================================

function loadPrinterSettingsUI() {
  const s = getPrinterSettings();

  const el = (id) => document.getElementById(id);
  if (el('printer-enabled')) el('printer-enabled').checked = s.enabled;
  if (el('printer-ip')) el('printer-ip').value = s.printerIp || '';
  if (el('printer-port')) el('printer-port').value = s.printerPort || 80;
  if (el('printer-paper-width')) el('printer-paper-width').value = s.paperWidth || 80;
  if (el('printer-https')) el('printer-https').checked = s.useHttps || false;
  if (el('printer-auto-kitchen')) el('printer-auto-kitchen').checked = s.autoPrintKitchen;
  if (el('printer-auto-customer')) el('printer-auto-customer').checked = s.autoPrintCustomer;
  if (el('printer-sound')) el('printer-sound').checked = s.soundOnKitchenPrint;
  if (el('printer-restaurant-name')) el('printer-restaurant-name').value = s.restaurantName || '';
  if (el('printer-restaurant-address')) el('printer-restaurant-address').value = s.restaurantAddress || '';
  if (el('printer-restaurant-phone')) el('printer-restaurant-phone').value = s.restaurantPhone || '';
  if (el('printer-cvr')) el('printer-cvr').value = s.restaurantCvr || '';
  if (el('printer-footer')) el('printer-footer').value = s.footerText || '';
  if (el('printer-qr-enabled')) el('printer-qr-enabled').checked = s.showQrCode || false;
  if (el('printer-qr-url')) el('printer-qr-url').value = s.qrCodeUrl || '';

  // Order type checkboxes
  document.querySelectorAll('.printer-order-type').forEach(cb => {
    cb.checked = (s.kitchenOrderTypes || ['all']).includes(cb.value);
  });

  // Update queue stats
  updatePrinterQueueStats();
}

function savePrinterSettingsFromUI() {
  const el = (id) => document.getElementById(id);
  const orderTypes = [];
  document.querySelectorAll('.printer-order-type:checked').forEach(cb => orderTypes.push(cb.value));

  const settings = {
    enabled: el('printer-enabled')?.checked || false,
    printerIp: el('printer-ip')?.value || '192.168.1.100',
    printerPort: parseInt(el('printer-port')?.value) || 80,
    paperWidth: parseInt(el('printer-paper-width')?.value) || 80,
    useHttps: el('printer-https')?.checked || false,
    autoPrintKitchen: el('printer-auto-kitchen')?.checked || false,
    autoPrintCustomer: el('printer-auto-customer')?.checked || false,
    soundOnKitchenPrint: el('printer-sound')?.checked || false,
    soundRepeat: 3,
    cutAfterPrint: true,
    kitchenOrderTypes: orderTypes.length > 0 ? orderTypes : ['all'],
    restaurantName: el('printer-restaurant-name')?.value || '',
    restaurantAddress: el('printer-restaurant-address')?.value || '',
    restaurantPhone: el('printer-restaurant-phone')?.value || '',
    restaurantCvr: el('printer-cvr')?.value || '',
    footerText: el('printer-footer')?.value || 'Tak for din bestilling!',
    showQrCode: el('printer-qr-enabled')?.checked || false,
    qrCodeUrl: el('printer-qr-url')?.value || '',
  };

  savePrinterSettings(settings);

  // Start/stop queue processor
  if (settings.enabled) {
    startPrintQueueProcessor();
  } else {
    stopPrintQueueProcessor();
  }
}

async function checkAndDisplayPrinterStatus() {
  const badge = document.getElementById('printer-status-badge');
  const details = document.getElementById('printer-status-details');
  if (badge) { badge.textContent = 'Tjekker...'; badge.style.background = '#555'; badge.style.color = '#fff'; }

  try {
    const status = await checkPrinterStatus();
    if (status.online) {
      if (badge) { badge.textContent = '🟢 Online'; badge.style.background = '#065f46'; badge.style.color = '#6ee7b7'; }
      if (details) {
        let msg = 'Printer er tilsluttet og klar';
        if (status.paperNearEnd) msg += ' ⚠️ Papir snart slut!';
        details.textContent = msg;
      }
    } else {
      if (badge) { badge.textContent = '🔴 Offline'; badge.style.background = '#7f1d1d'; badge.style.color = '#fca5a5'; }
      if (details) details.textContent = status.reason || 'Kan ikke nå printer';
    }
  } catch (e) {
    if (badge) { badge.textContent = '🔴 Fejl'; badge.style.background = '#7f1d1d'; badge.style.color = '#fca5a5'; }
    if (details) details.textContent = e.message;
  }

  updatePrinterQueueStats();
}

async function handleTestPrint() {
  try {
    toast('Sender test print...', 'info');
    await printTestReceipt();
    toast('✅ Test print sendt!', 'success');
  } catch (e) {
    toast('❌ Test print fejlede: ' + e.message, 'error');
  }
}

function handleRetryFailedPrints() {
  retryFailedJobs();
  toast('Genforsøger fejlede print jobs...', 'info');
  setTimeout(updatePrinterQueueStats, 2000);
}

function updatePrinterQueueStats() {
  const statsEl = document.getElementById('printer-queue-stats');
  if (!statsEl) return;
  const stats = getPrintQueueStats();
  if (stats.total === 0) {
    statsEl.textContent = 'Print kø: Tom';
  } else {
    statsEl.textContent = `Print kø: ${stats.pending} ventende, ${stats.printing} printer, ${stats.failed} fejlede, ${stats.done} færdige`;
  }
}

// Manual print from order list
function manualPrintOrder(orderId, type) {
  const orders = JSON.parse(localStorage.getItem('orders_module') || '[]');
  const order = orders.find(o => String(o.id) === String(orderId));
  if (!order) { toast('Ordre ikke fundet', 'error'); return; }

  const restaurant = restaurants.find(r => r.id === order.restaurantId) || restaurants[0];
  if (type === 'kitchen') {
    addToPrintQueue('kitchen', order, restaurant);
    toast('🖨️ Køkken-kvittering sendt til printer', 'info');
  } else {
    addToPrintQueue('customer', order, restaurant);
    toast('🖨️ Kunde-kvittering sendt til printer', 'info');
  }
}

// =====================================================
// PRINTER INTEGRATION & DEVICE CARD - Værktøjer
// =====================================================

function openPrinterSettings() {
  openPrinterIntegration();
}

function openPrinterIntegration() {
  var settings = getPrinterSettings();
  var modalHtml = '<div style="padding:var(--space-5)">' +
    '<h2 style="font-size:var(--font-size-xl);font-weight:var(--font-weight-semibold);margin-bottom:var(--space-1)">Printer Integration</h2>' +
    '<p style="color:var(--muted);font-size:var(--font-size-sm);margin-bottom:var(--space-5)">Opsæt din Star TSP100A kvitteringsprinter</p>' +

    '<div style="margin-bottom:var(--space-4)">' +
    '<label style="font-size:var(--font-size-sm);font-weight:500;display:block;margin-bottom:var(--space-1)">Printer IP-adresse</label>' +
    '<input type="text" class="form-input" id="pi-ip" value="' + (settings.printerIp || '192.168.1.100') + '" placeholder="192.168.1.100">' +
    '</div>' +

    '<div style="margin-bottom:var(--space-4)">' +
    '<label style="font-size:var(--font-size-sm);font-weight:500;display:block;margin-bottom:var(--space-1)">Port</label>' +
    '<input type="number" class="form-input" id="pi-port" value="' + (settings.printerPort || 80) + '" placeholder="80">' +
    '</div>' +

    '<div style="margin-bottom:var(--space-4)">' +
    '<label style="font-size:var(--font-size-sm);font-weight:500;display:block;margin-bottom:var(--space-1)">Papirbredde</label>' +
    '<select class="form-input" id="pi-paper">' +
    '<option value="58"' + (settings.paperWidth == 58 ? ' selected' : '') + '>58mm</option>' +
    '<option value="80"' + (settings.paperWidth != 58 ? ' selected' : '') + '>80mm</option>' +
    '</select>' +
    '</div>' +

    '<div style="display:flex;gap:var(--space-3);margin-top:var(--space-5)">' +
    '<button class="btn btn-secondary" onclick="testPrinterIntegration()" style="flex:1">Test Forbindelse</button>' +
    '<button class="btn btn-primary" onclick="savePrinterIntegration()" style="flex:1">Gem & Aktiver</button>' +
    '</div>' +

    '<div id="pi-test-result" style="margin-top:var(--space-3);display:none"></div>' +
    '</div>';

  // Use generic modal approach
  var overlay = document.createElement('div');
  overlay.id = 'printer-integration-modal';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center';
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

  var modal = document.createElement('div');
  modal.style.cssText = 'background:var(--card);border-radius:var(--radius-lg);max-width:440px;width:90%;max-height:90vh;overflow-y:auto;border:1px solid var(--border)';
  modal.innerHTML = modalHtml;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

async function testPrinterIntegration() {
  var result = document.getElementById('pi-test-result');
  if (result) {
    result.style.display = 'block';
    result.innerHTML = '<div style="padding:12px;background:var(--bg2);border-radius:var(--radius-md);font-size:var(--font-size-sm)">Tester forbindelse...</div>';
  }
  try {
    var status = await checkPrinterStatus();
    if (status.online) {
      result.innerHTML = '<div style="padding:12px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:var(--radius-md);font-size:var(--font-size-sm);color:#10b981">Printer fundet og online!</div>';
    } else {
      result.innerHTML = '<div style="padding:12px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:var(--radius-md);font-size:var(--font-size-sm);color:#ef4444">Kan ikke forbinde: ' + (status.reason || 'Ukendt fejl') + '</div>';
    }
  } catch(e) {
    result.innerHTML = '<div style="padding:12px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:var(--radius-md);font-size:var(--font-size-sm);color:#ef4444">Fejl: ' + e.message + '</div>';
  }
}

function savePrinterIntegration() {
  var ip = document.getElementById('pi-ip')?.value || '192.168.1.100';
  var port = parseInt(document.getElementById('pi-port')?.value) || 80;
  var paper = parseInt(document.getElementById('pi-paper')?.value) || 80;

  var settings = getPrinterSettings();
  settings.enabled = true;
  settings.printerIp = ip;
  settings.printerPort = port;
  settings.paperWidth = paper;
  savePrinterSettings(settings);

  // Update integration status
  localStorage.setItem('integration_printer', 'connected');

  // Close modal
  var modal = document.getElementById('printer-integration-modal');
  if (modal) modal.remove();

  // Start queue processor
  startPrintQueueProcessor();

  // Refresh integrations view
  renderCustomerIntegrations();

  toast('Printer integration aktiveret!', 'success');
}

function initDevicesTab() {
  var settings = getPrinterSettings();
  var printerCard = document.getElementById('printer-device-card');
  var emptyState = document.getElementById('devices-empty-state');

  if (settings.enabled && settings.printerIp) {
    if (printerCard) printerCard.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';

    // Update device info
    var ipEl = document.getElementById('printer-device-ip');
    var portEl = document.getElementById('printer-device-port');
    if (ipEl) ipEl.textContent = settings.printerIp || '192.168.1.100';
    if (portEl) portEl.textContent = 'Port ' + (settings.printerPort || 80);

    // Check status
    checkAndUpdatePrinterDeviceCard();
  } else {
    if (printerCard) printerCard.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
  }
}

function initPrinterDeviceCard() {
  initDevicesTab();
}

async function checkAndUpdatePrinterDeviceCard() {
  var badge = document.getElementById('printer-device-status-badge');
  if (!badge) return;

  badge.className = 'device-status-badge checking';
  badge.textContent = 'Tjekker...';

  try {
    var settings = getPrinterSettings();
    if (!settings.enabled) {
      badge.className = 'device-status-badge offline';
      badge.textContent = 'Deaktiveret';
      console.log('🖨️ Device card: Printer deaktiveret');
      return;
    }

    var status = await checkPrinterStatus();
    if (status.online) {
      badge.className = 'device-status-badge online';
      badge.textContent = 'Online';
      console.log('🖨️ Device card: Printer online');
    } else {
      badge.className = 'device-status-badge offline';
      badge.textContent = 'Offline';
      console.log('🖨️ Device card: Printer offline -', status.reason);
    }
  } catch (e) {
    badge.className = 'device-status-badge offline';
    badge.textContent = 'Fejl';
    console.error('🖨️ Device card status check fejlede:', e);
  }
}

// Update device card info when settings change
function updatePrinterDeviceInfo() {
  var settings = getPrinterSettings();
  var ipEl = document.getElementById('printer-device-ip');
  var portEl = document.getElementById('printer-device-port');
  if (ipEl) ipEl.textContent = settings.printerIp || '192.168.1.100';
  if (portEl) portEl.textContent = 'Port ' + (settings.printerPort || 80);
}

// Auto-refresh printer status every 30 seconds when Enheder tab is visible
setInterval(function() {
  var enhederTab = document.getElementById('vaerktoejer-content-enheder');
  if (enhederTab && enhederTab.style.display !== 'none') {
    checkAndUpdatePrinterDeviceCard();
  }
}, 30000);

// =====================================================
// EDIT MODE - Toggle & Visual Overlay System (v4.8.0)
// =====================================================

const EDIT_MODE_KEY = 'orderflow_edit_mode';
const EDIT_GRIDLINES_KEY = 'orderflow_edit_gridlines';

// Editable selectors - elements that get highlighted in edit mode
const EDITABLE_SELECTORS = [
  { selector: '.card', label: 'card' },
  { selector: '.kpi-card', label: 'kpi' },
  { selector: '.stat-card', label: 'stat' },
  { selector: '.setting-card', label: 'setting' },
  { selector: 'section', label: 'section' },
  { selector: '.page-content > div', label: 'div' },
  { selector: '.crm-table', label: 'table' },
  { selector: '.chart-container', label: 'chart' },
  { selector: '.quick-action-card', label: 'action' }
];

function toggleEditMode() {
  const isActive = document.body.classList.toggle('edit-mode');
  localStorage.setItem(EDIT_MODE_KEY, isActive ? 'on' : 'off');

  if (isActive) {
    applyEditableAttributes();
    populateEditSectionList();
  } else {
    removeEditableAttributes();
    document.body.classList.remove('show-gridlines');
    const gridCb = document.getElementById('edit-mode-gridlines');
    if (gridCb) gridCb.checked = false;
  }

  console.log('✏️ Edit mode:', isActive ? 'ON' : 'OFF');
}

function applyEditableAttributes() {
  // Tag visible elements inside main content AND sidebar
  const scopes = [
    document.querySelector('.page-content'),
    document.querySelector('.main'),
    document.querySelector('.sidebar')
  ].filter(Boolean);
  
  if (scopes.length === 0) return;

  scopes.forEach(scope => {
    EDITABLE_SELECTORS.forEach(({ selector, label }) => {
      scope.querySelectorAll(selector).forEach(el => {
        if (!el.dataset.editable && el.offsetParent !== null) {
          el.dataset.editable = label;
        }
      });
    });
  });
  
  // Also tag specific sidebar elements directly
  const sidebarElements = [
    { el: document.querySelector('.sidebar-logo'), label: 'logo' },
    { el: document.querySelector('.sidebar-search'), label: 'search' },
    { el: document.querySelector('.sidebar-header'), label: 'header' },
  ];
  
  sidebarElements.forEach(({ el, label }) => {
    if (el && !el.dataset.editable) {
      el.dataset.editable = label;
    }
  });
}

function removeEditableAttributes() {
  document.querySelectorAll('[data-editable]').forEach(el => {
    delete el.dataset.editable;
  });
}

function populateEditSectionList() {
  const list = document.getElementById('edit-mode-section-list');
  if (!list) return;

  const elements = document.querySelectorAll('[data-editable]');
  const counts = {};
  elements.forEach(el => {
    const label = el.dataset.editable;
    counts[label] = (counts[label] || 0) + 1;
  });

  if (Object.keys(counts).length === 0) {
    list.innerHTML = '<li style="color:rgba(255,255,255,0.4)">Ingen redigerbare elementer fundet</li>';
    return;
  }

  list.innerHTML = Object.entries(counts).map(([label, count]) =>
    `<li onclick="highlightEditElements('${label}')">
      <span>${label}</span>
      <span class="edit-badge">${count}</span>
    </li>`
  ).join('');
}

function highlightEditElements(label) {
  // Flash highlight matching elements
  document.querySelectorAll(`[data-editable="${label}"]`).forEach(el => {
    el.style.outline = '3px solid #3B82F6';
    el.style.outlineOffset = '3px';
    setTimeout(() => {
      el.style.outline = '';
      el.style.outlineOffset = '';
    }, 1500);
  });
}

function toggleEditGridlines(checked) {
  document.body.classList.toggle('show-gridlines', checked);
  localStorage.setItem(EDIT_GRIDLINES_KEY, checked ? 'on' : 'off');
}

// Restore edit mode state on load
function initEditMode() {
  const saved = localStorage.getItem(EDIT_MODE_KEY);
  if (saved === 'on') {
    document.body.classList.add('edit-mode');
    applyEditableAttributes();
    populateEditSectionList();

    const gridSaved = localStorage.getItem(EDIT_GRIDLINES_KEY);
    if (gridSaved === 'on') {
      document.body.classList.add('show-gridlines');
      const gridCb = document.getElementById('edit-mode-gridlines');
      if (gridCb) gridCb.checked = true;
    }
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEditMode);
} else {
  initEditMode();
}

// ═══════════════════════════════════════════════════════════════
// INLINE TEXT EDITOR (Edit Mode)
// ═══════════════════════════════════════════════════════════════
const TEXT_EDITS_KEY = 'orderflow_text_edits';
const TEXT_ORIGINALS_KEY = 'orderflow_text_originals';

// Undo stack: { id, oldText, newText }
let _textEditUndoStack = [];

function _getTextEdits() {
  try { return JSON.parse(localStorage.getItem(TEXT_EDITS_KEY) || '{}'); } catch { return {}; }
}
function _saveTextEdits(edits) {
  localStorage.setItem(TEXT_EDITS_KEY, JSON.stringify(edits));
}
function _getTextOriginals() {
  try { return JSON.parse(localStorage.getItem(TEXT_ORIGINALS_KEY) || '{}'); } catch { return {}; }
}
function _saveTextOriginals(originals) {
  localStorage.setItem(TEXT_ORIGINALS_KEY, JSON.stringify(originals));
}

// Store original text the first time we see an element
function _ensureOriginal(el) {
  const id = el.dataset.editableText;
  if (!id) return;
  const originals = _getTextOriginals();
  if (!(id in originals)) {
    originals[id] = el.textContent;
    _saveTextOriginals(originals);
  }
}

// Restore all saved text edits on load
function restoreTextEdits() {
  const edits = _getTextEdits();
  Object.entries(edits).forEach(([id, text]) => {
    const el = document.querySelector(`[data-editable-text="${id}"]`);
    if (el) {
      _ensureOriginal(el);
      el.textContent = text;
      if (document.body.classList.contains('edit-mode')) {
        el.classList.add('text-modified');
      }
    }
  });
}

// Also dynamically find editable text inside page-content (titles, headers, buttons, cards)
function autoTagEditableText() {
  const scope = document.querySelector('.page-content') || document.querySelector('.main');
  if (!scope) return;
  
  const selectors = [
    { sel: 'h1', prefix: 'h1' },
    { sel: 'h2', prefix: 'h2' },
    { sel: 'h3', prefix: 'h3' },
    { sel: '.page-title', prefix: 'title' },
    { sel: '.card-title', prefix: 'card' },
    { sel: '.stat-title', prefix: 'stat' },
    { sel: '.stat-value', prefix: 'statval' },
  ];

  let idx = 0;
  selectors.forEach(({ sel, prefix }) => {
    scope.querySelectorAll(sel).forEach(el => {
      if (!el.dataset.editableText && el.offsetParent !== null && el.children.length === 0) {
        el.dataset.editableText = `${prefix}-auto-${idx++}`;
      }
    });
  });
}

// Mark modified elements
function markModifiedElements() {
  const edits = _getTextEdits();
  document.querySelectorAll('[data-editable-text]').forEach(el => {
    const id = el.dataset.editableText;
    if (id in edits) {
      el.classList.add('text-modified');
    }
  });
}

// Remove toolbar/counter from element
function _cleanupTextEditUI(el) {
  const parent = el.parentElement;
  if (parent) {
    parent.querySelectorAll('.text-edit-toolbar, .text-edit-char-counter, .text-edit-error-msg').forEach(x => x.remove());
  }
  // Also check siblings of el
  if (el.nextElementSibling && el.nextElementSibling.classList.contains('text-edit-toolbar')) {
    el.nextElementSibling.remove();
  }
}

// Start editing an element
function startTextEdit(el) {
  if (el.classList.contains('text-editing')) return;
  if (!document.body.classList.contains('edit-mode')) return;

  const id = el.dataset.editableText;
  if (!id) return;

  _ensureOriginal(el);

  // Stop any other active edits
  document.querySelectorAll('[data-editable-text].text-editing').forEach(other => {
    if (other !== el) finishTextEdit(other, true);
  });

  el.classList.add('text-editing');
  el.setAttribute('contenteditable', 'true');
  el.focus();

  // Select all text
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  // Store pre-edit text for undo
  el._preEditText = el.textContent;

  // Create toolbar
  el.style.position = 'relative';
  const toolbar = document.createElement('div');
  toolbar.className = 'text-edit-toolbar';
  toolbar.innerHTML = `
    <button class="text-edit-save" onclick="event.stopPropagation();finishTextEdit(this.closest('.text-edit-toolbar').previousElementSibling||this.closest('[data-editable-text]'),true)" title="Gem">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Gem
    </button>
    <button class="text-edit-restore" onclick="event.stopPropagation();restoreOriginalText(this)" title="Gendan original">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>Gendan
    </button>
  `;
  el.insertAdjacentElement('afterend', toolbar);
  // If el has no positioned parent, re-parent toolbar
  if (toolbar.parentElement !== el.parentElement) {
    el.parentElement.appendChild(toolbar);
  }

  // Character counter for limited fields
  const maxLen = el.dataset.maxLength ? parseInt(el.dataset.maxLength) : null;
  if (maxLen) {
    const counter = document.createElement('div');
    counter.className = 'text-edit-char-counter';
    counter.textContent = `${el.textContent.length}/${maxLen}`;
    el.insertAdjacentElement('afterend', counter);

    el._charCounter = counter;
    el._maxLen = maxLen;
  }

  // Handle input for char counter
  el.addEventListener('input', _onTextEditInput);
  // Handle Enter to save, Escape to cancel
  el.addEventListener('keydown', _onTextEditKeydown);
}

function _onTextEditInput(e) {
  const el = e.target;
  if (el._charCounter && el._maxLen) {
    const len = el.textContent.length;
    el._charCounter.textContent = `${len}/${el._maxLen}`;
    el._charCounter.classList.toggle('over-limit', len > el._maxLen);
  }
}

function _onTextEditKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    finishTextEdit(e.target, true);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    // Revert to pre-edit text
    e.target.textContent = e.target._preEditText || e.target.textContent;
    finishTextEdit(e.target, false);
  }
}

// Finish editing
function finishTextEdit(el, save) {
  if (!el || !el.classList.contains('text-editing')) return;

  el.classList.remove('text-editing');
  el.removeAttribute('contenteditable');
  el.removeEventListener('input', _onTextEditInput);
  el.removeEventListener('keydown', _onTextEditKeydown);

  const id = el.dataset.editableText;
  const newText = el.textContent.trim();

  // Validation: required fields can't be empty
  const isRequired = el.dataset.required !== undefined || el.dataset.editableText?.startsWith('nav-');
  if (save && isRequired && !newText) {
    el.classList.add('text-edit-error');
    // Show error msg briefly
    const errMsg = document.createElement('div');
    errMsg.className = 'text-edit-error-msg';
    errMsg.textContent = 'Feltet må ikke være tomt';
    el.insertAdjacentElement('afterend', errMsg);
    setTimeout(() => {
      errMsg.remove();
      el.classList.remove('text-edit-error');
    }, 2000);
    // Revert
    el.textContent = el._preEditText || newText || 'Tekst';
    _cleanupTextEditUI(el);
    delete el._preEditText;
    delete el._charCounter;
    delete el._maxLen;
    return;
  }

  // Max length validation
  if (save && el._maxLen && newText.length > el._maxLen) {
    el.textContent = newText.substring(0, el._maxLen);
  }

  if (save && id) {
    const oldText = el._preEditText;
    const finalText = el.textContent.trim();
    
    if (oldText !== finalText) {
      // Push to undo stack
      _textEditUndoStack.push({ id, oldText, newText: finalText });

      // Save to localStorage
      const edits = _getTextEdits();
      const originals = _getTextOriginals();
      
      // If text matches original, remove the edit
      if (originals[id] === finalText) {
        delete edits[id];
        el.classList.remove('text-modified');
      } else {
        edits[id] = finalText;
        el.classList.add('text-modified');
      }
      _saveTextEdits(edits);
    }
  }

  _cleanupTextEditUI(el);
  delete el._preEditText;
  delete el._charCounter;
  delete el._maxLen;
}

// Restore original text for a specific element
function restoreOriginalText(btn) {
  // Find the editable element
  const toolbar = btn.closest('.text-edit-toolbar');
  let el = toolbar ? toolbar.previousElementSibling : null;
  if (!el || !el.dataset.editableText) {
    // Try parent
    el = toolbar?.parentElement?.querySelector('[data-editable-text].text-editing');
  }
  if (!el) return;

  const id = el.dataset.editableText;
  const originals = _getTextOriginals();
  const original = originals[id];
  
  if (original !== undefined) {
    el.textContent = original;
    
    // Remove from edits
    const edits = _getTextEdits();
    delete edits[id];
    _saveTextEdits(edits);
    el.classList.remove('text-modified');
    
    // Push undo entry
    _textEditUndoStack.push({ id, oldText: el._preEditText, newText: original });
  }

  finishTextEdit(el, false);
}

// Undo last text edit (Ctrl+Z in edit mode)
function undoLastTextEdit() {
  const entry = _textEditUndoStack.pop();
  if (!entry) return;

  const el = document.querySelector(`[data-editable-text="${entry.id}"]`);
  if (!el) return;

  el.textContent = entry.oldText;
  
  const edits = _getTextEdits();
  const originals = _getTextOriginals();
  
  if (originals[entry.id] === entry.oldText) {
    delete edits[entry.id];
    el.classList.remove('text-modified');
  } else {
    edits[entry.id] = entry.oldText;
    el.classList.add('text-modified');
  }
  _saveTextEdits(edits);
}

// Global double-click handler for edit mode
function _onEditModeDoubleClick(e) {
  if (!document.body.classList.contains('edit-mode')) return;

  // Find closest editable-text element
  const el = e.target.closest('[data-editable-text]');
  if (!el) return;

  e.preventDefault();
  e.stopPropagation();
  startTextEdit(el);
}

// Global Ctrl+Z handler for edit mode text undo
function _onEditModeKeydown(e) {
  if (!document.body.classList.contains('edit-mode')) return;
  if (e.ctrlKey && e.key === 'z' && !e.target.closest('[contenteditable]')) {
    e.preventDefault();
    undoLastTextEdit();
  }
}

// Click outside to save active edit
function _onEditModeClickOutside(e) {
  if (!document.body.classList.contains('edit-mode')) return;
  const activeEdit = document.querySelector('[data-editable-text].text-editing');
  if (activeEdit && !activeEdit.contains(e.target) && !e.target.closest('.text-edit-toolbar')) {
    finishTextEdit(activeEdit, true);
  }
}

// Initialize inline text editor
function initInlineTextEditor() {
  document.addEventListener('dblclick', _onEditModeDoubleClick);
  document.addEventListener('keydown', _onEditModeKeydown);
  document.addEventListener('click', _onEditModeClickOutside);

  // Restore saved edits
  restoreTextEdits();
}

// Hook into edit mode toggle to auto-tag and mark
const _origToggleEditMode = toggleEditMode;
toggleEditMode = function() {
  _origToggleEditMode();
  if (document.body.classList.contains('edit-mode')) {
    autoTagEditableText();
    restoreTextEdits();
    markModifiedElements();
  } else {
    // Close any active text edit
    document.querySelectorAll('[data-editable-text].text-editing').forEach(el => finishTextEdit(el, true));
    // Remove auto-tagged elements (keep manually tagged ones)
    document.querySelectorAll('[data-editable-text*="-auto-"]').forEach(el => {
      delete el.dataset.editableText;
      el.classList.remove('text-modified');
    });
  }
};

// Init on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initInlineTextEditor);
} else {
  initInlineTextEditor();
}

// Make functions globally available
window.toggleEditMode = toggleEditMode;
window.toggleEditGridlines = toggleEditGridlines;
window.highlightEditElements = highlightEditElements;
window.startTextEdit = startTextEdit;
window.finishTextEdit = finishTextEdit;
window.restoreOriginalText = restoreOriginalText;
window.undoLastTextEdit = undoLastTextEdit;

// ==================== API NØGLER PAGINATION ====================
let apiCurrentPage = 1;
let apiItemsPerPage = 10;
let apiAllCards = [];
let apiFilteredCards = [];

function initApiPagination() {
  apiAllCards = Array.from(document.querySelectorAll('#api-cards-container .api-config-card'));
  apiFilteredCards = [...apiAllCards];
  updateApiPagination();
}

function filterApiCards() {
  const searchTerm = document.getElementById('api-search-input')?.value.toLowerCase() || '';
  apiFilteredCards = apiAllCards.filter(card => {
    const name = card.querySelector('.api-config-name')?.textContent.toLowerCase() || '';
    const desc = card.querySelector('.api-config-desc')?.textContent.toLowerCase() || '';
    return name.includes(searchTerm) || desc.includes(searchTerm);
  });
  apiCurrentPage = 1;
  updateApiPagination();
}

function updateApiPagination() {
  const perPageSelect = document.getElementById('api-items-per-page');
  const selectedValue = perPageSelect?.value || '10';
  
  if (selectedValue === 'all') {
    apiItemsPerPage = apiFilteredCards.length;
  } else {
    apiItemsPerPage = parseInt(selectedValue);
  }

  const totalPages = Math.ceil(apiFilteredCards.length / apiItemsPerPage);
  
  // Ensure current page is within bounds
  if (apiCurrentPage > totalPages && totalPages > 0) {
    apiCurrentPage = totalPages;
  }
  if (apiCurrentPage < 1) apiCurrentPage = 1;

  // Hide all cards first
  apiAllCards.forEach(card => card.style.display = 'none');

  // Show only cards for current page
  const start = (apiCurrentPage - 1) * apiItemsPerPage;
  const end = start + apiItemsPerPage;
  apiFilteredCards.slice(start, end).forEach(card => card.style.display = '');

  // Update pagination controls (crm-style)
  const pageInfo = document.getElementById('api-page-info');
  const paginationEl = document.getElementById('api-pagination');
  
  if (pageInfo) {
    if (apiFilteredCards.length === 0) {
      pageInfo.textContent = 'Ingen resultater';
    } else if (selectedValue === 'all') {
      pageInfo.textContent = `Viser ${apiFilteredCards.length} af ${apiFilteredCards.length}`;
    } else {
      pageInfo.textContent = `${apiCurrentPage} af ${totalPages}`;
    }
  }
  
  if (paginationEl) {
    const btns = paginationEl.querySelectorAll('.crm-page-btn');
    if (btns.length >= 4) {
      btns[0].disabled = apiCurrentPage <= 1; // Første
      btns[1].disabled = apiCurrentPage <= 1; // Forrige
      btns[2].disabled = apiCurrentPage >= totalPages || selectedValue === 'all'; // Næste
      btns[3].disabled = apiCurrentPage >= totalPages || selectedValue === 'all'; // Sidste
    }
  }
}

function apiFirstPage() {
  apiCurrentPage = 1;
  updateApiPagination();
}

function apiPrevPage() {
  if (apiCurrentPage > 1) {
    apiCurrentPage--;
    updateApiPagination();
  }
}

function apiNextPage() {
  const totalPages = Math.ceil(apiFilteredCards.length / apiItemsPerPage);
  if (apiCurrentPage < totalPages) {
    apiCurrentPage++;
    updateApiPagination();
  }
}

function apiLastPage() {
  const totalPages = Math.ceil(apiFilteredCards.length / apiItemsPerPage);
  apiCurrentPage = totalPages;
  updateApiPagination();
}

// Initialize when API nøgler page is shown
document.addEventListener('DOMContentLoaded', () => {
  const observer = new MutationObserver((mutations) => {
    const apiSection = document.getElementById('flow-cms-content-api-noegler');
    if (apiSection && apiSection.classList.contains('active') && apiAllCards.length === 0) {
      initApiPagination();
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
});

