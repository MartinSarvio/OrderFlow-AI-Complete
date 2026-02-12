// FLOW Demo Module — demo data generation and toggling

// =====================================================
// DEMO DATA SYSTEM - Systemvedligeholdelse Toggle
// =====================================================

const DEMO_DATA_KEY = 'orderflow_demo_data_enabled';

// Check if demo data is enabled (via toggle in settings or DEMO role)
function isDemoDataEnabled() {
  if (localStorage.getItem(DEMO_DATA_KEY) === 'true') return true;
  return typeof currentUser !== 'undefined' && currentUser?.role === ROLES.DEMO;
}

// Toggle demo data on/off
function toggleDemoData() {
  const toggle = document.getElementById('demo-data-toggle');
  const enabled = toggle?.checked ?? false;

  localStorage.setItem(DEMO_DATA_KEY, enabled ? 'true' : 'false');

  if (enabled) {
    loadAllDemoData();
    toast('Demo data aktiveret - alle sider viser nu eksempeldata', 'success');
  } else {
    clearAllDemoData();
    toast('Demo data deaktiveret', 'info');
  }

  updateDemoDataStatus();

  // Refresh current view and any visible page
  setTimeout(() => {
    loadRestaurants();
    loadOrdersPage();
    loadDashboard();
    refreshDemoVisiblePage();
  }, 100);
}

// Refresh demo data on the currently visible page
function refreshDemoVisiblePage() {
  const activePage = document.querySelector('.page.active');
  if (!activePage) return;
  const pageId = activePage.id?.replace('page-', '');
  if (!pageId) return;

  // Refresh page-specific data
  if (pageId === 'leads') loadLeadsPage();
  if (pageId === 'leads-pipeline') loadPipelinePage();
  if (pageId === 'activities') loadActivitiesPage();
  if (pageId === 'analytics-overview' && window.AnalyticsDashboard) AnalyticsDashboard.loadOverviewData();
  if (pageId === 'analytics-sales' && window.AnalyticsDashboard) AnalyticsDashboard.loadSalesData();
  if (pageId === 'analytics-products' && window.AnalyticsDashboard) AnalyticsDashboard.loadProductsData();
  if (pageId === 'analytics-ai' && window.AnalyticsDashboard) AnalyticsDashboard.loadAIData();
  if (pageId === 'campaigns') initMarketingPage();
  if (pageId === 'alle-kunder') loadAlleKunderGrid();

  // Report pages
  var reportPages = ['dagsrapport','produktrapport','zrapport','konverteringsrapport','genbestillingsrapport','anmeldelsesrapport','heatmaprapport'];
  if (reportPages.indexOf(pageId) !== -1) {
    populateReportFiltersAndRender(pageId);
  }
}

// Regenerate demo data with new random values
function regenerateDemoData() {
  if (!isDemoDataEnabled()) {
    toast('Aktiver demo data først', 'warning');
    return;
  }

  loadAllDemoData();
  updateDemoDataStatus();
  toast('Nye demo data genereret', 'success');

  // Refresh views
  loadRestaurants();
  loadOrdersPage();
  loadDashboard();
  refreshDemoVisiblePage();
}

// Load all demo data to localStorage
function loadAllDemoData() {
  const customers = generateDemoCustomers();
  const orders = generateAllDemoOrders(customers);
  const leads = generateDemoLeads();
  const products = generateDemoProducts();
  const campaigns = generateDemoCampaigns();
  const activities = generateDemoActivities();
  const invoices = generateDemoInvoicesData(customers);

  localStorage.setItem('orderflow_demo_customers', JSON.stringify(customers));
  localStorage.setItem('orderflow_demo_orders', JSON.stringify(orders));
  localStorage.setItem('orderflow_demo_leads', JSON.stringify(leads));
  localStorage.setItem('orderflow_demo_products', JSON.stringify(products));
  localStorage.setItem('orderflow_demo_campaigns', JSON.stringify(campaigns));
  localStorage.setItem('orderflow_demo_activities', JSON.stringify(activities));
  localStorage.setItem('orderflow_demo_invoices', JSON.stringify(invoices));

  // Generate demo reports
  generateAllDemoReports();

  console.log('✅ Demo data loaded:', {
    customers: customers.length,
    orders: orders.length,
    leads: leads.length,
    products: products.items?.length || 0,
    campaigns: campaigns.length,
    activities: activities.length,
    invoices: invoices.length,
    reports: 7
  });
}

// Generate all 7 demo reports with default date ranges
function generateAllDemoReports() {
  const today = new Date();
  const todayISO = today.toISOString().split('T')[0];
  const ago30 = new Date(today); ago30.setDate(ago30.getDate() - 30);
  const ago30ISO = ago30.toISOString().split('T')[0];
  const monday = new Date(today); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const mondayISO = monday.toISOString().split('T')[0];

  generateDagsrapport(todayISO, true);
  generateProduktrapport(ago30ISO, todayISO, true);
  generateZrapport(todayISO, true);
  generateKonverteringsrapport(30, true);
  generateGenbestillingsrapport(90, true);
  generateAnmeldelsesrapport(30, true);
  generateHeatmaprapport(mondayISO, true);

  localStorage.setItem('orderflow_demo_report_params', JSON.stringify({
    dagsrapport: { dato: todayISO },
    produktrapport: { fra: ago30ISO, til: todayISO },
    zrapport: { dato: todayISO },
    konverteringsrapport: { periode: 30 },
    genbestillingsrapport: { periode: 90 },
    anmeldelsesrapport: { periode: 30 },
    heatmaprapport: { dato: mondayISO }
  }));
}

// Clear all demo data from localStorage
function clearAllDemoData() {
  const demoKeys = [
    'orderflow_demo_customers',
    'orderflow_demo_orders',
    'orderflow_demo_leads',
    'orderflow_demo_products',
    'orderflow_demo_campaigns',
    'orderflow_demo_activities',
    'orderflow_demo_invoices',
    'orderflow_demo_report_params'
  ];
  demoKeys.forEach(key => localStorage.removeItem(key));

  // Clear report global variables
  dagsrapportData = null;
  produktrapportData = null;
  zrapportData = null;
  konverteringsrapportData = null;
  genbestillingsrapportData = null;
  anmeldelsesrapportData = null;
  heatmaprapportData = null;

  // Restore empty state on report pages
  clearAllReportContent();

  console.log('🗑️ Demo data cleared');
}

function clearAllReportContent() {
  const emptyStates = {
    'dagsrapport-content': { icon: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>', text: 'Vælg en dato for at generere dagsrapport', sub: 'Rapporten viser salgsdata, betalinger og momsspecifikation' },
    'produktrapport-content': { icon: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>', text: 'Vælg datointerval for at generere produktrapport', sub: 'Se hvilke produkter der sælger bedst' },
    'zrapport-content': { icon: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>', text: 'Vælg en dato for at generere Z-rapport', sub: 'Daglig kasserapport med afstemning' },
    'konverteringsrapport-content': { icon: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>', text: 'Vælg en periode for at generere konverteringsrapport', sub: 'Se hvor mange kunder SAAS-systemet konverterer' },
    'genbestillingsrapport-content': { icon: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>', text: 'Vælg en periode for at generere genbestillingsrapport', sub: 'Se genbestillingsprocenter' },
    'anmeldelsesrapport-content': { icon: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>', text: 'Vælg en periode for at generere anmeldelsesrapport', sub: 'Se konvertering fra anmeldelser' },
    'heatmaprapport-content': { icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>', text: 'Vælg en uge for at generere heatmap', sub: 'Oversigt over hvornår ordretrykket er størst' }
  };
  Object.entries(emptyStates).forEach(([id, cfg]) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<div class="card" style="padding:24px"><div class="empty"><div class="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' + cfg.icon + '</svg></div><div>' + cfg.text + '</div><div style="font-size:var(--font-size-sm);color:var(--muted);margin-top:8px">' + cfg.sub + '</div></div></div>';
  });
  ['dagsrapport-dato','produktrapport-fra','produktrapport-til','zrapport-dato','heatmaprapport-dato'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  ['konverteringsrapport-periode','genbestillingsrapport-periode','anmeldelsesrapport-periode'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.selectedIndex = el.querySelector('[selected]')?.index || 0;
  });
}

// Populate report filters and auto-render when navigating to report pages
function populateReportFiltersAndRender(page) {
  // Always set dagsrapport date to today (existing behavior)
  if (page === 'dagsrapport') {
    var dagEl = document.getElementById('dagsrapport-dato');
    if (dagEl && !dagEl.value) dagEl.value = new Date().toISOString().split('T')[0];
  }

  if (typeof isDemoDataEnabled !== 'function' || !isDemoDataEnabled()) return;

  var params = JSON.parse(localStorage.getItem('orderflow_demo_report_params') || '{}');
  var p = params[page];
  if (!p) return;

  // Populate filter inputs with demo values
  switch (page) {
    case 'dagsrapport':
      var d1 = document.getElementById('dagsrapport-dato');
      if (d1) d1.value = p.dato;
      break;
    case 'produktrapport':
      var f1 = document.getElementById('produktrapport-fra');
      var t1 = document.getElementById('produktrapport-til');
      if (f1) f1.value = p.fra;
      if (t1) t1.value = p.til;
      break;
    case 'zrapport':
      var z1 = document.getElementById('zrapport-dato');
      if (z1) z1.value = p.dato;
      break;
    case 'konverteringsrapport':
      var k1 = document.getElementById('konverteringsrapport-periode');
      if (k1) k1.value = p.periode;
      break;
    case 'genbestillingsrapport':
      var g1 = document.getElementById('genbestillingsrapport-periode');
      if (g1) g1.value = p.periode;
      break;
    case 'anmeldelsesrapport':
      var a1 = document.getElementById('anmeldelsesrapport-periode');
      if (a1) a1.value = p.periode;
      break;
    case 'heatmaprapport':
      var h1 = document.getElementById('heatmaprapport-dato');
      if (h1) h1.value = p.dato;
      break;
  }

  // Check if data exists in global variable, render if so
  var dataMap = {
    'dagsrapport': dagsrapportData,
    'produktrapport': produktrapportData,
    'zrapport': zrapportData,
    'konverteringsrapport': konverteringsrapportData,
    'genbestillingsrapport': genbestillingsrapportData,
    'anmeldelsesrapport': anmeldelsesrapportData,
    'heatmaprapport': heatmaprapportData
  };
  var renderMap = {
    'dagsrapport': renderDagsrapport,
    'produktrapport': renderProduktrapport,
    'zrapport': renderZrapport,
    'konverteringsrapport': renderKonverteringsrapport,
    'genbestillingsrapport': renderGenbestillingsrapport,
    'anmeldelsesrapport': renderAnmeldelsesrapport,
    'heatmaprapport': renderHeatmaprapport
  };

  if (dataMap[page]) {
    // Data exists, just render
    renderMap[page]();
  } else {
    // Data null (e.g., after page reload) — regenerate silently from saved params
    var regenMap = {
      'dagsrapport': function() { generateDagsrapport(p.dato, true); },
      'produktrapport': function() { generateProduktrapport(p.fra, p.til, true); },
      'zrapport': function() { generateZrapport(p.dato, true); },
      'konverteringsrapport': function() { generateKonverteringsrapport(p.periode, true); },
      'genbestillingsrapport': function() { generateGenbestillingsrapport(p.periode, true); },
      'anmeldelsesrapport': function() { generateAnmeldelsesrapport(p.periode, true); },
      'heatmaprapport': function() { generateHeatmaprapport(p.dato, true); }
    };
    if (regenMap[page]) regenMap[page]();
  }
}

// Update demo data status display
function updateDemoDataStatus() {
  const enabled = isDemoDataEnabled();
  const toggle = document.getElementById('demo-data-toggle');
  const statusText = document.getElementById('demo-data-status-text');
  const customersCount = document.getElementById('demo-data-customers-count');
  const ordersCount = document.getElementById('demo-data-orders-count');
  const leadsCount = document.getElementById('demo-data-leads-count');
  const reportsCountEl = document.getElementById('demo-data-reports-count');

  if (toggle) toggle.checked = enabled;

  if (enabled) {
    if (statusText) {
      statusText.textContent = 'Aktiveret';
      statusText.style.color = 'var(--success)';
    }

    const customers = JSON.parse(localStorage.getItem('orderflow_demo_customers') || '[]');
    const orders = JSON.parse(localStorage.getItem('orderflow_demo_orders') || '[]');
    const leads = JSON.parse(localStorage.getItem('orderflow_demo_leads') || '[]');
    const reportsCount = [dagsrapportData, produktrapportData, zrapportData, konverteringsrapportData, genbestillingsrapportData, anmeldelsesrapportData, heatmaprapportData].filter(d => d !== null).length;

    if (customersCount) customersCount.textContent = customers.length;
    if (ordersCount) ordersCount.textContent = orders.length;
    if (leadsCount) leadsCount.textContent = leads.length;
    if (reportsCountEl) reportsCountEl.textContent = reportsCount;
  } else {
    if (statusText) {
      statusText.textContent = 'Deaktiveret';
      statusText.style.color = 'var(--muted)';
    }
    if (customersCount) customersCount.textContent = '0';
    if (ordersCount) ordersCount.textContent = '0';
    if (leadsCount) leadsCount.textContent = '0';
    if (reportsCountEl) reportsCountEl.textContent = '0';
  }
}

// Initialize demo data status on page load
function initDemoDataStatus() {
  updateDemoDataStatus();
}

// =====================================================
// DEMO DATA GENERATORS
// =====================================================

// Generate 15 demo customers (restaurants)
function generateDemoCustomers() {
  const demoRestaurants = [
    { name: 'Pizza Palace', industry: 'pizzeria', city: 'København' },
    { name: 'Burger House', industry: 'burger', city: 'Aarhus' },
    { name: 'Sushi Garden', industry: 'sushi', city: 'Odense' },
    { name: 'Thai Orchid', industry: 'thai', city: 'Aalborg' },
    { name: 'Bella Italia', industry: 'pizzeria', city: 'Esbjerg' },
    { name: 'Golden Dragon', industry: 'chinese', city: 'Randers' },
    { name: 'Kebab King', industry: 'kebab', city: 'Kolding' },
    { name: 'Café Central', industry: 'cafe', city: 'Horsens' },
    { name: 'Grill House', industry: 'grill', city: 'Vejle' },
    { name: 'Indian Spice', industry: 'indian', city: 'Roskilde' },
    { name: 'Fish & Chips', industry: 'seafood', city: 'Helsingør' },
    { name: 'Mexican Fiesta', industry: 'mexican', city: 'Silkeborg' },
    { name: 'Greek Taverna', industry: 'greek', city: 'Herning' },
    { name: 'Vegan Delight', industry: 'vegan', city: 'Næstved' },
    { name: 'Steakhouse Prime', industry: 'steakhouse', city: 'Frederiksberg' }
  ];

  const statuses = ['active', 'active', 'active', 'active', 'pending', 'inactive'];

  return demoRestaurants.map((r, i) => {
    const revenue = Math.floor(Math.random() * 200000) + 50000;
    const ordersCount = Math.floor(revenue / 150);
    const cvrBase = 10000000 + i * 1111111;

    return {
      id: `demo-customer-${i + 1}`,
      name: r.name,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      isDemo: true,
      cvr: String(cvrBase),
      contact_phone: `+45 ${20 + i} ${10 + i}${20 + i} ${30 + i}${40 + i}`,
      contact_email: `kontakt@${r.name.toLowerCase().replace(/\s+/g, '')}.dk`,
      contact_name: ['Lars Hansen', 'Mette Nielsen', 'Peter Jensen', 'Anna Pedersen', 'Thomas Andersen'][i % 5],
      owner: ['Lars Hansen', 'Mette Nielsen', 'Peter Jensen'][i % 3],
      address: `${['Hovedgaden', 'Strandvejen', 'Nørregade', 'Vestergade', 'Østergade'][i % 5]} ${10 + i * 3}`,
      city: r.city,
      country: 'Danmark',
      industry: r.industry,
      website: `https://www.${r.name.toLowerCase().replace(/\s+/g, '')}.dk`,
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      revenue_total: revenue,
      orders_total: ordersCount,
      ai_enabled: Math.random() > 0.3,
      integration_status: ['connected', 'connected', 'pending', 'disconnected'][Math.floor(Math.random() * 4)],
      // Demo products for this restaurant
      productCategories: ['Pizza', 'Pasta', 'Burger', 'Drikkevarer', 'Dessert', 'Tilbehør'],
      products: generateDemoProductsForRestaurant(r.industry, i),
      deliveryZones: [
        { name: 'Zone 1', minOrder: 100, fee: 25, freeAbove: 300 },
        { name: 'Zone 2', minOrder: 150, fee: 35, freeAbove: 400 }
      ],
      extras: [
        { name: 'Extra ost', price: 10 },
        { name: 'Extra sauce', price: 5 },
        { name: 'Bacon', price: 15 },
        { name: 'Jalapeños', price: 8 }
      ]
    };
  });
}

// Generate demo products based on restaurant industry
function generateDemoProductsForRestaurant(industry, index) {
  const productTemplates = {
    pizzeria: [
      { name: 'Margherita', price: 89, category: 'Pizza' },
      { name: 'Pepperoni', price: 99, category: 'Pizza' },
      { name: 'Quattro Formaggi', price: 109, category: 'Pizza' },
      { name: 'Calzone', price: 119, category: 'Pizza' },
      { name: 'Hawaiianer', price: 99, category: 'Pizza' },
      { name: 'Carbonara', price: 89, category: 'Pasta' },
      { name: 'Bolognese', price: 85, category: 'Pasta' }
    ],
    burger: [
      { name: 'Classic Burger', price: 89, category: 'Burger' },
      { name: 'Cheese Burger', price: 99, category: 'Burger' },
      { name: 'Bacon Burger', price: 109, category: 'Burger' },
      { name: 'Veggie Burger', price: 95, category: 'Burger' },
      { name: 'Double Stack', price: 129, category: 'Burger' },
      { name: 'Chicken Burger', price: 99, category: 'Burger' }
    ],
    sushi: [
      { name: 'Nigiri Mix (8 stk)', price: 129, category: 'Sushi' },
      { name: 'Maki Set (12 stk)', price: 99, category: 'Sushi' },
      { name: 'California Roll', price: 79, category: 'Sushi' },
      { name: 'Sashimi Deluxe', price: 159, category: 'Sushi' },
      { name: 'Teriyaki Salmon', price: 119, category: 'Varm' }
    ],
    default: [
      { name: 'Dagens Ret', price: 99, category: 'Hovedret' },
      { name: 'Forret', price: 69, category: 'Forret' },
      { name: 'Dessert', price: 59, category: 'Dessert' }
    ]
  };

  const drinks = [
    { name: 'Cola', price: 25, category: 'Drikkevarer' },
    { name: 'Fanta', price: 25, category: 'Drikkevarer' },
    { name: 'Sprite', price: 25, category: 'Drikkevarer' },
    { name: 'Vand', price: 20, category: 'Drikkevarer' },
    { name: 'Øl', price: 35, category: 'Drikkevarer' }
  ];

  const desserts = [
    { name: 'Tiramisu', price: 59, category: 'Dessert' },
    { name: 'Cheesecake', price: 55, category: 'Dessert' },
    { name: 'Is (3 kugler)', price: 45, category: 'Dessert' }
  ];

  const baseProducts = productTemplates[industry] || productTemplates.default;
  const allProducts = [...baseProducts, ...drinks, ...desserts];

  return allProducts.map((p, i) => ({
    id: `demo-product-${index}-${i}`,
    name: p.name,
    price: p.price,
    category: p.category,
    description: `Lækker ${p.name.toLowerCase()} lavet med friske ingredienser`,
    available: true,
    isDemo: true
  }));
}

// Generate orders for all demo customers
function generateAllDemoOrders(customers) {
  const allOrders = [];
  const paymentMethods = ['Kort', 'Kontant', 'MobilePay', 'Faktura'];
  const products = [
    'Margherita', 'Pepperoni', 'Quattro Formaggi', 'Calzone', 'Hawaiianer',
    'Burger Classic', 'Cheese Burger', 'Veggie Burger', 'Crispy Chicken',
    'Sushi Mix', 'Nigiri Set', 'Maki Roll', 'Teriyaki', 'Ramen',
    'Cola', 'Fanta', 'Sprite', 'Vand', 'Øl', 'Vin',
    'Tiramisu', 'Cheesecake', 'Is', 'Brownie'
  ];

  customers.forEach((customer, custIndex) => {
    const orderCount = Math.floor(Math.random() * 30) + 20; // 20-50 ordrer per kunde

    for (let i = 0; i < orderCount; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 60)); // Sidste 60 dage
      date.setHours(Math.floor(Math.random() * 14) + 10); // 10:00 - 24:00
      date.setMinutes(Math.floor(Math.random() * 60));

      const numItems = Math.floor(Math.random() * 4) + 1;
      const items = [];
      for (let j = 0; j < numItems; j++) {
        items.push({
          name: products[Math.floor(Math.random() * products.length)],
          quantity: Math.floor(Math.random() * 3) + 1,
          price: Math.floor(Math.random() * 100) + 50
        });
      }

      const orderStatuses = ['completed', 'completed', 'completed', 'completed', 'pending', 'cancelled'];

      allOrders.push({
        id: `demo-order-${custIndex}-${i}`,
        restaurant_id: customer.id,
        restaurant_name: customer.name,
        customer_name: ['Anders Jensen', 'Bente Nielsen', 'Christian Pedersen', 'Dorthe Hansen', 'Erik Andersen'][Math.floor(Math.random() * 5)],
        customer_phone: `+45 ${Math.floor(Math.random() * 90000000) + 10000000}`,
        created_at: date.toISOString(),
        total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
        items: items,
        delivery_type: Math.random() > 0.5 ? 'delivery' : 'pickup',
        delivery_address: Math.random() > 0.5 ? `${['Hovedgaden', 'Strandvejen', 'Nørregade'][Math.floor(Math.random() * 3)]} ${Math.floor(Math.random() * 100) + 1}` : null
      });
    }
  });

  // Sort by date descending
  return allOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

// Generate 25 demo leads
function generateDemoLeads() {
  const stages = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
  const sources = ['Website', 'Telefon', 'Email', 'LinkedIn', 'Anbefaling', 'Messe', 'Google Ads'];
  const industries = ['pizzeria', 'burger', 'sushi', 'cafe', 'restaurant', 'takeaway', 'catering'];

  const leads = [];
  const names = [
    'Restaurant Sunset', 'Café Hygge', 'Pizza Corner', 'Burger Spot', 'Sushi Time',
    'Thai Kitchen', 'Indian Palace', 'Mexican Wave', 'Greek Island', 'Italian Touch',
    'Fast Food Plus', 'Healthy Eats', 'Street Food', 'Gourmet Grill', 'Ocean Fresh',
    'Pasta House', 'Noodle Bar', 'BBQ Master', 'Salad Studio', 'Dessert Heaven',
    'Coffee Corner', 'Juice Bar', 'Smoothie Shop', 'Ice Cream Dream', 'Bakery Bliss'
  ];

  for (let i = 0; i < 25; i++) {
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 90));

    const stage = stages[Math.floor(Math.random() * stages.length)];
    const dealValue = Math.floor(Math.random() * 50000) + 10000;

    leads.push({
      id: `demo-lead-${i + 1}`,
      name: names[i],
      contact_name: ['Lars', 'Mette', 'Peter', 'Anna', 'Thomas'][Math.floor(Math.random() * 5)] + ' ' + ['Hansen', 'Nielsen', 'Jensen', 'Pedersen'][Math.floor(Math.random() * 4)],
      contact_email: `kontakt@${names[i].toLowerCase().replace(/\s+/g, '')}.dk`,
      contact_phone: `+45 ${Math.floor(Math.random() * 90000000) + 10000000}`,
      stage: stage,
      source: sources[Math.floor(Math.random() * sources.length)],
      industry: industries[Math.floor(Math.random() * industries.length)],
      deal_value: dealValue,
      probability: stage === 'won' ? 100 : stage === 'lost' ? 0 : Math.floor(Math.random() * 80) + 10,
      created_at: createdDate.toISOString(),
      last_activity: new Date(createdDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      notes: `Interesseret i ${['OrderFlow Pro', 'OrderFlow Standard', 'OrderFlow Starter'][Math.floor(Math.random() * 3)]} pakken.`,
      isDemo: true
    });
  }

  return leads;
}

// Generate demo products (menu items)
function generateDemoProducts() {
  return {
    categories: [
      { id: 'cat-1', name: 'Pizza', color: '#e63946' },
      { id: 'cat-2', name: 'Burgere', color: '#f4a261' },
      { id: 'cat-3', name: 'Sushi', color: '#2a9d8f' },
      { id: 'cat-4', name: 'Drikkevarer', color: '#457b9d' },
      { id: 'cat-5', name: 'Dessert', color: '#9d4edd' },
      { id: 'cat-6', name: 'Tilbehør', color: '#6c757d' }
    ],
    items: [
      // Pizzaer
      { id: 'p1', name: 'Margherita', price: 89, category: 'Pizza', description: 'Tomat, mozzarella, basilikum' },
      { id: 'p2', name: 'Pepperoni', price: 99, category: 'Pizza', description: 'Tomat, mozzarella, pepperoni' },
      { id: 'p3', name: 'Quattro Formaggi', price: 109, category: 'Pizza', description: 'Fire forskellige oste' },
      { id: 'p4', name: 'Hawaiianer', price: 99, category: 'Pizza', description: 'Skinke, ananas' },
      { id: 'p5', name: 'Calzone', price: 119, category: 'Pizza', description: 'Foldet pizza med fyld' },
      { id: 'p6', name: 'Vegetar', price: 95, category: 'Pizza', description: 'Grøntsager, ost' },
      // Burgere
      { id: 'b1', name: 'Classic Burger', price: 89, category: 'Burgere', description: 'Oksekød, salat, tomat' },
      { id: 'b2', name: 'Cheese Burger', price: 99, category: 'Burgere', description: 'Med cheddar ost' },
      { id: 'b3', name: 'Bacon Burger', price: 109, category: 'Burgere', description: 'Sprød bacon' },
      { id: 'b4', name: 'Veggie Burger', price: 95, category: 'Burgere', description: 'Vegetarisk bøf' },
      // Sushi
      { id: 's1', name: 'Nigiri Mix (8 stk)', price: 119, category: 'Sushi', description: 'Laks, tun, rejer' },
      { id: 's2', name: 'Maki Roll (12 stk)', price: 89, category: 'Sushi', description: 'California, Spicy tuna' },
      { id: 's3', name: 'Sashimi (10 stk)', price: 149, category: 'Sushi', description: 'Frisk fisk' },
      // Drikkevarer
      { id: 'd1', name: 'Cola', price: 25, category: 'Drikkevarer', description: '33 cl' },
      { id: 'd2', name: 'Fanta', price: 25, category: 'Drikkevarer', description: '33 cl' },
      { id: 'd3', name: 'Vand', price: 20, category: 'Drikkevarer', description: '50 cl' },
      { id: 'd4', name: 'Øl', price: 35, category: 'Drikkevarer', description: '33 cl' },
      // Dessert
      { id: 'ds1', name: 'Tiramisu', price: 49, category: 'Dessert', description: 'Klassisk italiensk' },
      { id: 'ds2', name: 'Cheesecake', price: 55, category: 'Dessert', description: 'New York style' },
      { id: 'ds3', name: 'Is (3 kugler)', price: 39, category: 'Dessert', description: 'Valgfri smag' },
      // Tilbehør
      { id: 't1', name: 'Pommes Frites', price: 35, category: 'Tilbehør', description: 'Crispy' },
      { id: 't2', name: 'Løgringe', price: 39, category: 'Tilbehør', description: 'Paneret' },
      { id: 't3', name: 'Hvidløgsbrød', price: 29, category: 'Tilbehør', description: '4 stk' }
    ]
  };
}

// Generate 5 demo campaigns
function generateDemoCampaigns() {
  const campaigns = [
    { name: 'Sommertilbud 2024', type: 'email', status: 'active' },
    { name: 'Nyhedsbrev Februar', type: 'email', status: 'completed' },
    { name: 'SMS Påmindelse', type: 'sms', status: 'active' },
    { name: 'Loyalitetsbonus', type: 'email', status: 'draft' },
    { name: 'Weekend Special', type: 'sms', status: 'scheduled' }
  ];

  return campaigns.map((c, i) => {
    const sent = Math.floor(Math.random() * 2000) + 500;
    const opened = Math.floor(sent * (Math.random() * 0.4 + 0.3)); // 30-70% open rate
    const clicked = Math.floor(opened * (Math.random() * 0.3 + 0.1)); // 10-40% click rate

    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - (i * 7));

    return {
      id: `demo-campaign-${i + 1}`,
      name: c.name,
      type: c.type,
      status: c.status,
      sent: c.status === 'draft' ? 0 : sent,
      opened: c.status === 'draft' ? 0 : opened,
      clicked: c.status === 'draft' ? 0 : clicked,
      revenue: c.status === 'draft' ? 0 : Math.floor(clicked * (Math.random() * 200 + 100)),
      created_at: createdDate.toISOString(),
      scheduled_for: c.status === 'scheduled' ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() : null,
      subject: `${c.name} - Speciel tilbud til dig!`,
      isDemo: true
    };
  });
}

// Generate 50 demo activities
function generateDemoActivities() {
  const activityTypes = [
    { type: 'order', icon: 'shopping-cart', color: 'var(--success)' },
    { type: 'customer', icon: 'user-plus', color: 'var(--info)' },
    { type: 'login', icon: 'log-in', color: 'var(--muted)' },
    { type: 'settings', icon: 'settings', color: 'var(--warn)' },
    { type: 'campaign', icon: 'mail', color: 'var(--purple)' },
    { type: 'lead', icon: 'trending-up', color: 'var(--accent)' }
  ];

  const activities = [];
  const messages = {
    order: ['Ny ordre modtaget fra', 'Ordre leveret til', 'Ordre afsluttet for'],
    customer: ['Ny kunde oprettet:', 'Kunde opdateret:', 'Kunde aktiveret:'],
    login: ['Bruger loggede ind:', 'Session startet for', 'Login fra ny enhed:'],
    settings: ['Indstillinger opdateret af', 'API nøgle genereret af', 'Åbningstider ændret af'],
    campaign: ['Kampagne sendt:', 'Email åbnet fra', 'Klik registreret på'],
    lead: ['Nyt lead oprettet:', 'Lead flyttet til', 'Lead konverteret:']
  };

  const names = ['Pizza Palace', 'Burger House', 'Sushi Garden', 'Thai Orchid', 'Bella Italia'];
  const users = ['admin@orderflow.dk', 'support@orderflow.dk', 'salg@orderflow.dk'];

  for (let i = 0; i < 50; i++) {
    const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const date = new Date();
    date.setMinutes(date.getMinutes() - i * Math.floor(Math.random() * 60 + 10));

    const messageOptions = messages[activityType.type];
    const message = messageOptions[Math.floor(Math.random() * messageOptions.length)];
    const target = activityType.type === 'login' || activityType.type === 'settings'
      ? users[Math.floor(Math.random() * users.length)]
      : names[Math.floor(Math.random() * names.length)];

    activities.push({
      id: `demo-activity-${i + 1}`,
      type: activityType.type,
      icon: activityType.icon,
      color: activityType.color,
      message: `${message} ${target}`,
      timestamp: date.toISOString(),
      user: users[Math.floor(Math.random() * users.length)],
      isDemo: true
    });
  }

  return activities;
}

// Generate demo invoices
function generateDemoInvoicesData(customers) {
  const invoices = [];

  customers.slice(0, 10).forEach((customer, custIndex) => {
    const invoiceCount = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < invoiceCount; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);

      const amount = Math.floor(Math.random() * 5000) + 1000;
      const statuses = ['paid', 'paid', 'paid', 'pending', 'overdue'];

      invoices.push({
        id: `demo-invoice-${custIndex}-${i}`,
        invoice_number: `INV-2024-${String(custIndex * 10 + i + 1).padStart(4, '0')}`,
        customer_id: customer.id,
        customer_name: customer.name,
        amount: amount,
        vat: Math.floor(amount * 0.25),
        total: Math.floor(amount * 1.25),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        created_at: date.toISOString(),
        due_date: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        paid_at: Math.random() > 0.3 ? new Date(date.getTime() + Math.random() * 25 * 24 * 60 * 60 * 1000).toISOString() : null,
        description: `Abonnement - ${['OrderFlow Pro', 'OrderFlow Standard', 'OrderFlow Starter'][Math.floor(Math.random() * 3)]}`,
        isDemo: true
      });
    }
  });

  return invoices.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

// Helper: Get demo customers for display
function getDemoDataCustomers() {
  if (!isDemoDataEnabled()) return [];
  return JSON.parse(localStorage.getItem('orderflow_demo_customers') || '[]');
}

// Helper: Get demo orders for display
function getDemoDataOrders() {
  if (!isDemoDataEnabled()) return [];
  return JSON.parse(localStorage.getItem('orderflow_demo_orders') || '[]');
}

// Helper: Get demo leads for display
function getDemoDataLeads() {
  if (!isDemoDataEnabled()) return [];
  return JSON.parse(localStorage.getItem('orderflow_demo_leads') || '[]');
}

// Helper: Get demo activities for display
function getDemoDataActivities() {
  if (!isDemoDataEnabled()) return [];
  return JSON.parse(localStorage.getItem('orderflow_demo_activities') || '[]');
}

// Helper: Get demo campaigns for display
function getDemoDataCampaigns() {
  if (!isDemoDataEnabled()) return [];
  return JSON.parse(localStorage.getItem('orderflow_demo_campaigns') || '[]');
}

// Helper: Get demo invoices for display
function getDemoDataInvoices() {
  if (!isDemoDataEnabled()) return [];
  return JSON.parse(localStorage.getItem('orderflow_demo_invoices') || '[]');
}

// Helper: Find restaurant from real OR demo customers
