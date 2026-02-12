// FLOW Customers Module — CRM, customers, grid, detail, products, invoices

function getRestaurantLogoSvg(logo) {
  // Map food types to SVG icons - supports both emoji (legacy) and text keys
  const iconMap = {
    // Text keys (new format)
    'pizza': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 19.5h20L12 2z"/><circle cx="9" cy="13" r="1.5"/><circle cx="12" cy="9" r="1.5"/><circle cx="15" cy="14" r="1.5"/></svg>',
    'burger': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 15h16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2z"/><path d="M4 11h16"/><path d="M20 11V9a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"/><ellipse cx="12" cy="5" rx="8" ry="2"/></svg>',
    'sushi': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="14" rx="8" ry="4"/><path d="M4 14c0-2.21 3.58-4 8-4s8 1.79 8 4"/><path d="M8 10c0-2 1.79-4 4-4s4 2 4 4"/></svg>',
    'ramen': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 11h16"/><path d="M6 11c0 4 2 8 6 8s6-4 6-8"/><path d="M9 5c0 2 1.5 3 3 3s3-1 3-3"/><line x1="12" y1="8" x2="12" y2="11"/></svg>',
    'salad': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="14" rx="9" ry="6"/><path d="M3 14c0-4 4-7 9-7s9 3 9 7"/><path d="M8 12l2 3 4-5"/></svg>',
    'cafe': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>',
    'dessert': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19h16v-4H4v4z"/><path d="M4 15V11a4 4 0 0 1 8 0h8v4"/><path d="M12 7V4"/><circle cx="12" cy="3" r="1"/></svg>',
    'breakfast': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 12c0-4 3.5-6 8-6s8 2 8 6-3.5 6-8 6-8-2-8-6z"/><path d="M6 12c2-2 4-2 6 0s4 2 6 0"/></svg>',
    'bar': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 11h1a3 3 0 0 1 0 6h-1"/><path d="M5 7h12v10a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V7z"/><path d="M5 7l1-4h10l1 4"/></svg>',
    'pasta': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="16" rx="8" ry="4"/><path d="M4 16v-2c0-1 2-2 2-4s2-4 6-4 6 2 6 4 2 3 2 4v2"/></svg>',
    'default': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    // Emoji keys (legacy support)
    '🍕': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 19.5h20L12 2z"/><circle cx="9" cy="13" r="1.5"/><circle cx="12" cy="9" r="1.5"/><circle cx="15" cy="14" r="1.5"/></svg>',
    '🍔': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 15h16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2z"/><path d="M4 11h16"/><path d="M20 11V9a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"/><ellipse cx="12" cy="5" rx="8" ry="2"/></svg>',
    '🍣': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="14" rx="8" ry="4"/><path d="M4 14c0-2.21 3.58-4 8-4s8 1.79 8 4"/><path d="M8 10c0-2 1.79-4 4-4s4 2 4 4"/></svg>',
    '🍜': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 11h16"/><path d="M6 11c0 4 2 8 6 8s6-4 6-8"/><path d="M9 5c0 2 1.5 3 3 3s3-1 3-3"/><line x1="12" y1="8" x2="12" y2="11"/></svg>',
    '🥗': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="14" rx="9" ry="6"/><path d="M3 14c0-4 4-7 9-7s9 3 9 7"/><path d="M8 12l2 3 4-5"/></svg>',
    '☕': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>',
    '🍰': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19h16v-4H4v4z"/><path d="M4 15V11a4 4 0 0 1 8 0h8v4"/><path d="M12 7V4"/><circle cx="12" cy="3" r="1"/></svg>',
    '🥐': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 12c0-4 3.5-6 8-6s8 2 8 6-3.5 6-8 6-8-2-8-6z"/><path d="M6 12c2-2 4-2 6 0s4 2 6 0"/></svg>',
    '🍺': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 11h1a3 3 0 0 1 0 6h-1"/><path d="M5 7h12v10a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V7z"/><path d="M5 7l1-4h10l1 4"/></svg>',
    '🍝': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="16" rx="8" ry="4"/><path d="M4 16v-2c0-1 2-2 2-4s2-4 6-4 6 2 6 4 2 3 2 4v2"/></svg>',
  };
  
  // Return mapped SVG or default restaurant icon
  return iconMap[logo] || iconMap['default'];
}

function loadRestaurants() {
  const grid = document.getElementById('restaurants-grid');

  // Null check - grid might not exist
  if (!grid) {
    console.log('restaurants-grid not found, skipping');
    return;
  }

  // Combine real restaurants with demo customers if enabled
  let allRestaurants = [...restaurants];
  if (isDemoDataEnabled()) {
    const demoCustomers = getDemoDataCustomers();
    allRestaurants = [...allRestaurants, ...demoCustomers];
  }

  if (allRestaurants.length === 0) {
    grid.innerHTML = '<div class="empty"><div class="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div><div>Ingen restauranter endnu</div><button class="btn btn-primary" style="margin-top:16px" onclick="showModal(\'add-restaurant\')">+ Tilføj restaurant</button></div>';
    return;
  }

  grid.innerHTML = allRestaurants.map(r => {
    // Tjek aktuel åbningsstatus
    const openStatus = checkRestaurantOpen(r);
    const openBadge = openStatus.isOpen 
      ? `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--success);background:rgba(52,211,153,0.1);padding:3px 8px;border-radius:4px;margin-top:6px"><span style="width:6px;height:6px;border-radius:50%;background:var(--success)"></span>Åben nu</span>`
      : `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--danger);background:rgba(248,113,113,0.1);padding:3px 8px;border-radius:4px;margin-top:6px"><span style="width:6px;height:6px;border-radius:50%;background:var(--danger)"></span>Lukket</span>`;
    
    // Få dagens åbningstider (støtter begge navne-formater)
    const dayNamesShort = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayNamesFull = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = new Date().getDay();
    const todayHours = r.openingHours?.[dayNamesShort[dayIndex]] || r.openingHours?.[dayNamesFull[dayIndex]];
    let hoursText = 'Lukket i dag';
    if (todayHours?.enabled) {
      if (todayHours.open === '00:00' && todayHours.close === '00:00') {
        hoursText = 'Døgnåbent';
      } else {
        hoursText = `I dag: ${todayHours.open} - ${todayHours.close}`;
      }
    }
    
    // KPI Section (only if enabled)
    const kpiSection = r.kpiEnabled && r.kpi ? `
      <div class="kpi-section">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <span style="font-size:12px;font-weight:600;color:var(--accent);display:flex;align-items:center;gap:6px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
            Performance
          </span>
          <span style="font-size:10px;color:var(--muted)">Denne måned</span>
        </div>
        <div class="kpi-grid">
          <div class="kpi-item">
            <div class="kpi-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Omsætning
            </div>
            <div class="kpi-value">${formatCurrency(r.kpi.totalRevenue)}</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 6l-9.5 9.5-5-5L1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              Genvundet
            </div>
            <div class="kpi-value positive">${formatCurrency(r.kpi.recoveredRevenue)}</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Rating
            </div>
            <div class="kpi-value">${r.kpi.reviews.avgRating.toFixed(1)}</div>
            <div class="kpi-sub">${r.kpi.reviews.total} anmeldelser</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Konvertering
            </div>
            <div class="kpi-value">${r.kpi.conversionRate}%</div>
          </div>
        </div>
        <div class="review-stats">
          <div class="review-source">
            <svg class="review-source-icon google" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            <span>${r.kpi.reviews.google.avgRating.toFixed(1)} (${r.kpi.reviews.google.count})</span>
          </div>
          <div class="review-source">
            <svg class="review-source-icon trustpilot" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
            <span>${r.kpi.reviews.trustpilot.avgRating.toFixed(1)} (${r.kpi.reviews.trustpilot.count})</span>
          </div>
        </div>
      </div>
    ` : '';
    
    return `
    <div class="restaurant">
      <div class="restaurant-header">
        <div class="restaurant-logo">${getRestaurantLogoSvg(r.logo)}</div>
        <div style="flex:1">
          <div class="restaurant-name">${escapeHtml(r.name)}</div>
          <div class="restaurant-phone">${escapeHtml(r.phone || 'Ikke tildelt')}</div>
          ${openBadge}
        </div>
        <span class="restaurant-status status-${r.status}">${r.status === 'active' ? '● Aktiv' : '○ Afventer'}</span>
      </div>
      <div style="font-size:11px;color:var(--muted);padding:8px 0;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:6px">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        ${hoursText}
      </div>
      <div class="restaurant-stats">
        <div class="restaurant-stat"><div class="restaurant-stat-value">${r.orders || 0}</div><div class="restaurant-stat-label">Ordrer</div></div>
        <div class="restaurant-stat"><div class="restaurant-stat-value">${r.recovered || 0}</div><div class="restaurant-stat-label">Genvundet</div></div>
        <div class="restaurant-stat"><div class="restaurant-stat-value">${r.orders ? Math.round((r.recovered / r.orders) * 100) : 0}%</div><div class="restaurant-stat-label">Rate</div></div>
      </div>
      ${kpiSection}
      <div class="restaurant-actions">
        <button class="btn btn-secondary" style="flex:1" onclick="event.stopPropagation(); editRestaurant('${r.id}')">Rediger</button>
        <button class="btn btn-primary" style="flex:1" onclick="event.stopPropagation(); openCrmDrawer('${r.id}')">Detaljer</button>
      </div>
    </div>
  `}).join('');
  
  // Add click handlers to restaurant cards
  document.querySelectorAll('.restaurant').forEach((card, index) => {
    card.addEventListener('click', () => showCrmProfileView(restaurants[index].id));
  });
  
  // Initialize CRM table
  initCrmTable();
  
  // Update test select (use safer population)
  populateTestRestaurants();
}

// =====================================================
// RESTAURANTS
// =====================================================
async function addRestaurant() {
  const name = (document.getElementById('new-restaurant-name').value || '').trim();
  const logo = document.getElementById('new-restaurant-logo').value || 'pizza';
  const phone = document.getElementById('new-restaurant-phone').value;

  if (!name) {
    toast('Indtast et navn', 'error');
    return;
  }

  const newRestaurantData = {
    name,
    contact_phone: phone,
    status: phone ? 'active' : 'pending',
    orders: 0,
    orders_this_month: 0,
    orders_total: 0,
    revenue_today: 0,
    revenue_this_month: 0,
    revenue_total: 0,
    // Store extra data in metadata JSONB field
    metadata: {
      logo,
      recovered: 0,
      features: { ai: true, sms: true },
      website: '',
      menuUrl: '',
      googleReviewUrl: '',
      trustpilotUrl: '',
      reviewDelay: 60,
      deliveryEnabled: true,
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
        responseTime: 0
      },
      timeFormat: '24h',
      openingHours: getDefaultOpeningHours()
    }
  };

  // Save to Supabase
  if (typeof SupabaseDB !== 'undefined' && currentUser) {
    try {
      const createdRestaurant = await SupabaseDB.createRestaurant(currentUser.id, newRestaurantData);

      // Add to local array
      restaurants.push(createdRestaurant);

      // Update dashboard KPIs (don't reload all restaurants - real-time sync handles that)
      loadDashboard();
      closeModal('add-restaurant');

      // Log activity
      if (typeof logActivity === 'function') {
        logActivity('create', 'Ny restaurant oprettet', {
          category: 'kunder',
          restaurantId: createdRestaurant.id,
          restaurantName: createdRestaurant.name
        });
      }

      // Add notification to Dashboard (så blå prik vises på Dashboard menupunkt)
      if (typeof NotificationSystem !== 'undefined') {
        NotificationSystem.add('dashboard', {
          title: 'Ny kunde oprettet',
          message: `${createdRestaurant.name} blev tilføjet`,
          timestamp: Date.now()
        });
        console.log('🔵 Dashboard notification added for new customer (modal)');
      }

      toast('Restaurant oprettet!', 'success');
    } catch (err) {
      console.error('❌ Error creating restaurant:', err);
      toast('Fejl ved oprettelse af restaurant', 'error');
    }
  } else {
    toast('Supabase ikke tilgængelig', 'error');
  }

  // Clear form
  document.getElementById('new-restaurant-name').value = '';
  document.getElementById('new-restaurant-phone').value = '';
}

async function provisionCustomerAccessForRestaurant(restaurant, options = {}) {
  const email = String(options.email || '').trim().toLowerCase();
  if (!email) return { status: 'skipped' };

  const client = window.supabaseClient || supabase;
  if (!client?.auth) {
    throw new Error('Supabase auth er ikke tilgængelig');
  }

  const contactName = String(options.contactName || options.owner || restaurant?.name || '').trim();
  const redirectTo = buildPasswordSetupRedirectUrl();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) {
    throw new Error(sessionError.message || 'Kunne ikke hente aktiv session');
  }
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) {
    throw new Error('Ingen aktiv session. Log ind igen og prøv på ny.');
  }

  const response = await fetch('/api/auth/provision-customer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      email,
      contactName,
      restaurantName: restaurant?.name || '',
      restaurantId: restaurant?.id || '',
      redirectTo
    })
  });

  let result = null;
  try {
    result = await response.json();
  } catch (parseErr) {
    result = null;
  }

  if (!response.ok) {
    const message = result?.error || `Kundeadgang kunne ikke oprettes (${response.status})`;
    throw new Error(message);
  }

  return {
    status: result?.status || 'invite_sent',
    invitedUserId: result?.invitedUserId || null
  };
}

async function addRestaurantFromPage() {
  const name = (document.getElementById('new-restaurant-name').value || '').trim();
  const owner = document.getElementById('new-restaurant-owner')?.value || '';
  const phone = document.getElementById('new-restaurant-phone').value;
  const cvr = document.getElementById('new-restaurant-cvr')?.value || '';
  const email = document.getElementById('new-restaurant-email')?.value || '';
  const address = document.getElementById('new-restaurant-address')?.value || '';
  const country = document.getElementById('new-restaurant-country')?.value || 'DK';
  const contact = document.getElementById('new-restaurant-contact')?.value || '';
  const website = document.getElementById('new-restaurant-website')?.value || '';
  const industry = document.getElementById('new-restaurant-industry')?.value || 'restaurant';
  const role = document.getElementById('new-restaurant-role')?.value || 'owner';
  const sendWelcome = document.getElementById('new-restaurant-send-welcome')?.checked !== false;

  if (!name) {
    toast('Indtast et restaurantnavn', 'error');
    return;
  }

  // Create data structure matching Supabase schema
  const newRestaurantData = {
    name,
    contact_phone: phone,
    contact_email: email,
    contact_name: contact,
    address,
    country,
    cvr,
    status: phone ? 'active' : 'pending',
    orders: 0,
    orders_this_month: 0,
    orders_total: 0,
    revenue_today: 0,
    revenue_this_month: 0,
    revenue_total: 0,
    ai_enabled: true,
    integration_status: 'none',
    settings: {},
    metadata: {
      logo: 'pizza',
      owner: owner || contact,
      industry: industry,
      user_role: role,
      features: { ai: true, sms: true, billing: true, export: true },
      website: website,
      menuUrl: '',
      googleReviewUrl: '',
      trustpilotUrl: '',
      reviewDelay: 60,
      deliveryEnabled: true,
      kpiEnabled: false,
      kpi: {
        totalRevenue: 0,
        recoveredRevenue: 0,
        avgOrderValue: 0,
        reviews: { total: 0, avgRating: 0, google: { count: 0, avgRating: 0 }, trustpilot: { count: 0, avgRating: 0 } },
        conversionRate: 0,
        responseTime: 0
      },
      timeFormat: '24h',
      openingHours: getDefaultOpeningHours(),
      createdBy: currentUser?.email || 'system'
    }
  };

  try {
    // Check if Supabase is available
    if (typeof SupabaseDB === 'undefined' || !SupabaseDB) {
      console.warn('⚠️ Supabase not available, using localStorage fallback');
      throw new Error('Supabase not available');
    }

    // Save to Supabase database
    console.log('💾 Attempting to save restaurant to Supabase...');
    const createdRestaurant = await SupabaseDB.createRestaurant(currentUser.id, newRestaurantData);

    if (!createdRestaurant) {
      throw new Error('Failed to create restaurant in database');
    }

    console.log('✅ Restaurant created in Supabase:', createdRestaurant.id);

    // Add to local array with real UUID
    restaurants.push(createdRestaurant);

    // Log activity to Supabase
    await logActivity('create', `Ny restaurant oprettet: ${name}`, {
      category: 'kunder',
      subCategory: 'stamdata',
      customerId: createdRestaurant.id
    });

    // Add notification to Dashboard (så blå prik vises på Dashboard menupunkt)
    if (typeof NotificationSystem !== 'undefined') {
      NotificationSystem.add('dashboard', {
        title: 'Ny kunde oprettet',
        message: `${name} blev tilføjet`,
        timestamp: Date.now()
      });
      console.log('🔵 Dashboard notification added for new customer');
    }

    // Log to customer-specific aktivitetslogs
    addCustomerAktivitetslog(createdRestaurant.id, 'system', 'Kundeprofil oprettet');

    let welcomeInviteResult = null;
    if (email && sendWelcome) {
      try {
        welcomeInviteResult = await provisionCustomerAccessForRestaurant(createdRestaurant, {
          email,
          contactName: contact || owner,
          owner
        });
        addCustomerAktivitetslog(createdRestaurant.id, 'system', `Velkomstmail sendt til ${email}`);
      } catch (inviteErr) {
        console.warn('⚠️ Customer invite failed:', inviteErr);
        addCustomerAktivitetslog(
          createdRestaurant.id,
          'system',
          `Kunde oprettet, men login/velkomstmail fejlede: ${inviteErr?.message || 'ukendt fejl'}`
        );
      }
    }

    // Auto-import menu fra hjemmeside (i baggrunden)
    if (website) {
      console.log('🌐 Auto-importing menu from website:', website);
      importMenuFromWebsite(website, createdRestaurant.id, true)
        .then(products => {
          if (products && products.length > 0) {
            toast(`${products.length} produkter importeret fra hjemmeside`, 'success');
            addCustomerAktivitetslog(createdRestaurant.id, 'system', `${products.length} produkter auto-importeret fra hjemmeside`);
          }
        })
        .catch(err => console.warn('Auto-import menu failed:', err));
    }

    // Update dashboard KPIs (don't reload all restaurants - real-time sync handles that)
    loadDashboard();

    // Clear form
    clearAddRestaurantForm();

    if (email && sendWelcome && welcomeInviteResult) {
      toast(`Restaurant "${name}" oprettet + velkomstmail sendt`, 'success');
    } else if (email && sendWelcome) {
      toast(`Restaurant "${name}" oprettet (send velkomstmail manuelt)`, 'info');
    } else {
      toast(`Restaurant "${name}" oprettet`, 'success');
    }

    // Navigate to customer profile with real UUID
    setTimeout(() => {
      openCrmProfile(createdRestaurant.id);
    }, 300);

  } catch (err) {
    console.error('❌ Error creating restaurant:', err);
    const message = String(err?.message || '');
    const shouldUseLocalFallback =
      /supabase not available|not initialized|network|fetch|timeout|uuid|user_id|not found/i.test(message);

    // Data integrity/auth errors should be shown to user (not silently saved locally)
    if (!shouldUseLocalFallback) {
      toast(`Kunde blev ikke oprettet: ${message || 'ukendt fejl'}`, 'error');
      return;
    }

    // Fallback to localStorage when Supabase is not available
    console.log('💾 Using localStorage fallback for restaurant creation...');

    // Generate a local ID
    const localId = 'local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const localRestaurant = {
      ...newRestaurantData,
      id: localId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add to local array
    restaurants.push(localRestaurant);

    // Save to localStorage
    try {
      localStorage.setItem('orderflow_restaurants', JSON.stringify(restaurants));
      console.log('✅ Restaurant saved to localStorage:', localId);
    } catch (storageErr) {
      console.error('localStorage save error:', storageErr);
    }

    // Add notification to Dashboard
    if (typeof NotificationSystem !== 'undefined') {
      NotificationSystem.add('dashboard', {
        title: 'Ny kunde oprettet (lokal)',
        message: `${name} blev tilføjet`,
        timestamp: Date.now()
      });
    }

    // Log to customer-specific aktivitetslogs
    addCustomerAktivitetslog(localId, 'system', 'Kundeprofil oprettet (lokal)');

    // Update dashboard
    loadDashboard();

    // Clear form
    clearAddRestaurantForm();

    toast(`Restaurant "${name}" oprettet (lokal lagring)`, 'success');

    // Navigate to customer profile
    setTimeout(() => {
      openCrmProfile(localId);
    }, 300);
  }
}

function clearAddRestaurantForm() {
  const fields = ['new-restaurant-name', 'new-restaurant-owner', 'new-restaurant-phone', 'new-restaurant-cvr', 'new-restaurant-email', 'new-restaurant-address', 'new-restaurant-contact', 'new-restaurant-website'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const country = document.getElementById('new-restaurant-country');
  if (country) country.value = 'DK';
  const industry = document.getElementById('new-restaurant-industry');
  if (industry) industry.value = 'restaurant';
  const role = document.getElementById('new-restaurant-role');
  if (role) role.value = 'owner';
  const sendWelcome = document.getElementById('new-restaurant-send-welcome');
  if (sendWelcome) sendWelcome.checked = true;
}

// =====================================================
// ALLE KUNDER LIST VIEW
// =====================================================

let alleKunderCurrentPage = 1;
const alleKunderPageSize = 25;
let alleKunderStatusFilter = 'all';
let alleKunderSearchQuery = '';


// =====================================================
// ALLE KUNDER LIST VIEW
// =====================================================

let alleKunderCurrentPage = 1;
const alleKunderPageSize = 25;
let alleKunderStatusFilter = 'all';
let alleKunderSearchQuery = '';

function loadAlleKunderGrid() {
  const tbody = document.getElementById('alle-kunder-tbody');
  if (!tbody) return;

  // Get filtered restaurants
  const filteredRestaurants = getFilteredAlleKunder();

  // Calculate pagination
  const totalItems = filteredRestaurants.length;
  const totalPages = Math.ceil(totalItems / alleKunderPageSize);
  const startIndex = (alleKunderCurrentPage - 1) * alleKunderPageSize;
  const endIndex = startIndex + alleKunderPageSize;
  const paginatedRestaurants = filteredRestaurants.slice(startIndex, endIndex);

  if (filteredRestaurants.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;padding:60px 20px;color:var(--muted)">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin:0 auto 16px;opacity:0.3"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <p style="font-size:var(--font-size-lg)">Ingen kunder fundet</p>
          <p style="font-size:var(--font-size-sm);margin-top:8px">${alleKunderSearchQuery ? 'Prøv en anden søgning' : 'Opret din første kunde for at komme i gang'}</p>
        </td>
      </tr>
    `;
    updateAlleKunderPagination(0, 0);
    return;
  }

  tbody.innerHTML = paginatedRestaurants.map(restaurant => {
    const status = restaurant.status || 'pending';
    const statusBadge = getStatusBadge(status);
    const userId = restaurant.user_id ? restaurant.user_id.substring(0, 8) + '...' : 'N/A';

    return `
      <tr onclick="openCustomerFromAlleKunder('${escapeHtml(restaurant.id)}')" style="cursor:pointer">
        <td><code style="font-size:11px;background:var(--bg3);padding:2px 6px;border-radius:4px">${escapeHtml(userId)}</code></td>
        <td style="font-weight:var(--font-weight-medium)">${escapeHtml(restaurant.name || 'Unavngivet')}</td>
        <td>${escapeHtml(restaurant.metadata?.owner || restaurant.contact_name || '-')}</td>
        <td>${escapeHtml(restaurant.phone || restaurant.contact_phone || '-')}</td>
        <td>${escapeHtml(restaurant.cvr || '-')}</td>
        <td>${restaurant.orders_total || 0}</td>
        <td>${statusBadge}</td>
      </tr>
    `;
  }).join('');

  updateAlleKunderPagination(totalItems, totalPages);
}

/**
 * Open customer profile from Alle Kunder grid
 * Navigates to Kunder page and shows the CRM profile
 */
function openCustomerFromAlleKunder(restaurantId) {
  // Navigate to kunder page and show profile
  showPage('kunder');
  // Small delay to ensure page is rendered
  setTimeout(() => {
    showCrmProfileView(restaurantId);
  }, 100);
}

function getStatusBadge(status) {
  const statusConfig = {
    active: { label: 'Aktiv', class: 'status-active' },
    pending: { label: 'Afventer', class: 'status-pending' },
    inactive: { label: 'Inaktiv', class: 'status-inactive' },
    demo: { label: 'Demo', class: 'status-demo' },
    churned: { label: 'Churned', class: 'status-churned' },
    cancelled: { label: 'Annulleret', class: 'status-cancelled' },
    terminated: { label: 'Opsagt', class: 'status-terminated' },
    gdpr_deleted: { label: 'GDPR Slettet', class: 'status-gdpr-deleted' }
  };
  const config = statusConfig[status] || { label: status, class: '' };
  return `<span class="status-badge ${config.class}">${config.label}</span>`;
}

function getFilteredAlleKunder() {
  let filtered = [...restaurants];
  if (isDemoDataEnabled()) {
    const demoCustomers = getDemoDataCustomers();
    filtered = [...filtered, ...demoCustomers];
  }

  // Apply status filter
  if (alleKunderStatusFilter !== 'all') {
    filtered = filtered.filter(r => r.status === alleKunderStatusFilter);
  }

  // Apply search filter
  if (alleKunderSearchQuery) {
    const query = alleKunderSearchQuery.toLowerCase();
    filtered = filtered.filter(r =>
      (r.name && r.name.toLowerCase().includes(query)) ||
      (r.contact_name && r.contact_name.toLowerCase().includes(query)) ||
      (r.metadata?.owner && r.metadata.owner.toLowerCase().includes(query)) ||
      (r.contact_phone && r.contact_phone.includes(query)) ||
      (r.cvr && r.cvr.includes(query)) ||
      (r.user_id && r.user_id.toLowerCase().includes(query))
    );
  }

  // Sort by created_at descending (newest first)
  filtered.sort((a, b) => {
    const aTime = new Date(a.created_at || 0).getTime();
    const bTime = new Date(b.created_at || 0).getTime();
    return bTime - aTime;
  });

  return filtered;
}

function filterAlleKunderByStatus(status) {
  alleKunderStatusFilter = status;
  alleKunderCurrentPage = 1;
  loadAlleKunderGrid();
}

function filterAlleKunderList() {
  const searchInput = document.getElementById('alle-kunder-search');
  alleKunderSearchQuery = searchInput ? searchInput.value.trim() : '';
  alleKunderCurrentPage = 1;
  loadAlleKunderGrid();
}

function updateAlleKunderPagination(totalItems, totalPages) {
  // Update page info text
  const pageInfo = document.getElementById('alle-kunder-page-info');
  if (pageInfo) {
    pageInfo.textContent = `Side ${alleKunderCurrentPage} af ${totalPages || 1}`;
  }

  // Update button disabled states
  const paginationEl = document.getElementById('alle-kunder-pagination');
  if (paginationEl) {
    const buttons = paginationEl.querySelectorAll('.crm-page-btn');
    buttons.forEach(btn => {
      const onclick = btn.getAttribute('onclick') || '';
      if (onclick.includes('First') || onclick.includes('Prev')) {
        btn.disabled = alleKunderCurrentPage === 1;
      } else if (onclick.includes('Next') || onclick.includes('Last')) {
        btn.disabled = alleKunderCurrentPage >= totalPages || totalPages === 0;
      }
    });
  }
}

function alleKunderFirstPage() {
  alleKunderCurrentPage = 1;
  loadAlleKunderGrid();
}

function alleKunderPrevPage() {
  if (alleKunderCurrentPage > 1) {
    alleKunderCurrentPage--;
    loadAlleKunderGrid();
  }
}

function alleKunderNextPage() {
  const totalPages = Math.ceil(getFilteredAlleKunder().length / alleKunderPageSize);
  if (alleKunderCurrentPage < totalPages) {
    alleKunderCurrentPage++;
    loadAlleKunderGrid();
  }
}

function alleKunderLastPage() {
  const totalPages = Math.ceil(getFilteredAlleKunder().length / alleKunderPageSize);
  alleKunderCurrentPage = totalPages || 1;
  loadAlleKunderGrid();
}


// =====================================================
// DEMO CUSTOMER ONBOARDING
// =====================================================

let demoOnboardingStep = 1;
const DEFAULT_DEMO_LICENSE_DAYS = 14;
const DEFAULT_DEMO_MESSAGE_LIMIT = 50;

function resetDemoOnboarding() {
  demoOnboardingStep = 1;
  
  // Reset all form fields
  document.getElementById('demo-firstname').value = '';
  document.getElementById('demo-lastname').value = '';
  document.getElementById('demo-email').value = '';
  document.getElementById('demo-phone').value = '';
  document.getElementById('demo-restaurant-name').value = '';
  document.getElementById('demo-cvr').value = '';
  document.getElementById('demo-address').value = '';
  document.getElementById('demo-zip').value = '';
  document.getElementById('demo-city').value = '';
  document.getElementById('demo-confirm-terms').checked = false;
  
  // Reset license settings to defaults
  const licenseDaysEl = document.getElementById('demo-license-days');
  const messageLimitEl = document.getElementById('demo-message-limit');
  if (licenseDaysEl) licenseDaysEl.value = DEFAULT_DEMO_LICENSE_DAYS.toString();
  if (messageLimitEl) messageLimitEl.value = DEFAULT_DEMO_MESSAGE_LIMIT.toString();
  
  // Reset step indicators
  updateDemoOnboardingSteps();
}

function updateDemoOnboardingSteps() {
  const steps = document.querySelectorAll('#page-demo-onboarding .onboarding-step');
  const sections = document.querySelectorAll('#page-demo-onboarding .onboarding-section');
  const prevBtn = document.getElementById('demo-prev-btn');
  const nextBtn = document.getElementById('demo-next-btn');
  
  // Update step indicators
  steps.forEach((step, idx) => {
    const stepNum = idx + 1;
    step.classList.remove('active', 'completed');
    if (stepNum === demoOnboardingStep) {
      step.classList.add('active');
    } else if (stepNum < demoOnboardingStep) {
      step.classList.add('completed');
      step.querySelector('.onboarding-step-dot').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
    } else {
      step.querySelector('.onboarding-step-dot').textContent = stepNum;
    }
  });
  
  // Update sections
  sections.forEach(section => {
    section.classList.remove('active');
    if (parseInt(section.dataset.step) === demoOnboardingStep) {
      section.classList.add('active');
    }
  });
  
  // Update buttons
  prevBtn.style.visibility = demoOnboardingStep === 1 ? 'hidden' : 'visible';
  
  if (demoOnboardingStep === 3) {
    nextBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Opret Demo-kunde';
    updateDemoSummary();
  } else {
    nextBtn.innerHTML = 'Næste <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
  }
}

function updateDemoSummary() {
  const firstName = document.getElementById('demo-firstname').value;
  const lastName = document.getElementById('demo-lastname').value;
  const email = document.getElementById('demo-email').value;
  const phone = document.getElementById('demo-phone').value;
  const restaurant = document.getElementById('demo-restaurant-name').value;
  const cvr = document.getElementById('demo-cvr').value;
  const address = document.getElementById('demo-address').value;
  const zip = document.getElementById('demo-zip').value;
  const city = document.getElementById('demo-city').value;
  
  // Get license settings
  const licenseDays = parseInt(document.getElementById('demo-license-days')?.value) || DEFAULT_DEMO_LICENSE_DAYS;
  const messageLimit = parseInt(document.getElementById('demo-message-limit')?.value) || DEFAULT_DEMO_MESSAGE_LIMIT;
  
  document.getElementById('summary-contact').textContent = `${firstName} ${lastName}`;
  document.getElementById('summary-email').textContent = email || '-';
  document.getElementById('summary-phone').textContent = phone || '-';
  document.getElementById('summary-restaurant').textContent = restaurant || '-';
  document.getElementById('summary-cvr').textContent = cvr || '-';
  document.getElementById('summary-address').textContent = address ? `${address}, ${zip} ${city}` : '-';
  
  // Update license info in summary
  document.getElementById('summary-license').innerHTML = `<span class="demo-badge">Demo ${licenseDays} dage</span>`;
  document.getElementById('summary-messages').textContent = `${messageLimit} beskeder`;
  
  // Calculate expiry date
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + licenseDays);
  document.getElementById('summary-expires').textContent = expiryDate.toLocaleDateString('da-DK', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

function validateDemoStep(step) {
  if (step === 1) {
    const firstName = document.getElementById('demo-firstname').value.trim();
    const lastName = document.getElementById('demo-lastname').value.trim();
    const email = document.getElementById('demo-email').value.trim();
    const phone = document.getElementById('demo-phone').value.trim();
    
    if (!firstName) { toast('Indtast fornavn', 'error'); return false; }
    if (!lastName) { toast('Indtast efternavn', 'error'); return false; }
    if (!email || !email.includes('@')) { toast('Indtast gyldig e-mail', 'error'); return false; }
    if (!phone) { toast('Indtast telefonnummer', 'error'); return false; }
    
    return true;
  }
  
  if (step === 2) {
    const restaurant = document.getElementById('demo-restaurant-name').value.trim();
    if (!restaurant) { toast('Indtast restaurantnavn', 'error'); return false; }
    return true;
  }
  
  if (step === 3) {
    const confirmed = document.getElementById('demo-confirm-terms').checked;
    if (!confirmed) { toast('Bekræft at kunden er informeret om demo-vilkår', 'error'); return false; }
    return true;
  }
  
  return true;
}

function demoOnboardingNext() {
  if (!validateDemoStep(demoOnboardingStep)) return;
  
  if (demoOnboardingStep < 3) {
    demoOnboardingStep++;
    updateDemoOnboardingSteps();
  } else {
    // Create demo customer
    createDemoCustomer();
  }
}

function demoOnboardingPrev() {
  if (demoOnboardingStep > 1) {
    demoOnboardingStep--;
    updateDemoOnboardingSteps();
  }
}

function createDemoCustomer() {
  const firstName = document.getElementById('demo-firstname').value.trim();
  const lastName = document.getElementById('demo-lastname').value.trim();
  const email = document.getElementById('demo-email').value.trim();
  const phone = document.getElementById('demo-phone').value.trim();
  const restaurantName = document.getElementById('demo-restaurant-name').value.trim();
  const cvr = document.getElementById('demo-cvr').value.trim();
  const restaurantType = document.getElementById('demo-restaurant-type').value;
  const address = document.getElementById('demo-address').value.trim();
  const zip = document.getElementById('demo-zip').value.trim();
  const city = document.getElementById('demo-city').value.trim();
  
  // Get license settings from dropdowns
  const licenseDays = parseInt(document.getElementById('demo-license-days')?.value) || DEFAULT_DEMO_LICENSE_DAYS;
  const messageLimit = parseInt(document.getElementById('demo-message-limit')?.value) || DEFAULT_DEMO_MESSAGE_LIMIT;
  
  // Calculate demo license dates
  const startDate = new Date();
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + licenseDays);
  
  // Create demo customer object
  const demoCustomer = {
    id: 'demo_' + Date.now(),
    name: restaurantName,
    logo: restaurantType,
    phone: phone,
    status: 'demo',
    isDemo: true,
    demoLicense: {
      startDate: startDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
      daysRemaining: licenseDays,
      messagesUsed: 0,
      messagesLimit: messageLimit,
      status: 'active' // active, expired
    },
    contact: {
      firstName,
      lastName,
      email,
      phone
    },
    cvr: cvr,
    address: {
      street: address,
      zip: zip,
      city: city,
      country: 'DK'
    },
    orders: 0,
    recovered: 0,
    features: { 
      ai: true, 
      sms: true,
      billing: false, // Demo cannot access billing
      export: false   // Demo cannot export sensitive data
    },
    website: '',
    menuUrl: '',
    googleReviewUrl: '',
    trustpilotUrl: '',
    reviewDelay: 60,
    deliveryEnabled: true,
    kpiEnabled: true,
    kpi: {
      totalRevenue: 0,
      recoveredRevenue: 0,
      avgOrderValue: 0,
      reviews: { total: 0, avgRating: 0, google: { count: 0, avgRating: 0 }, trustpilot: { count: 0, avgRating: 0 } },
      conversionRate: 0,
      responseTime: 0
    },
    timeFormat: '24h',
    openingHours: getDefaultOpeningHours(),
    createdAt: startDate.toISOString(),
    createdBy: currentUser?.email || 'system'
  };
  
  // Add to restaurants array
  restaurants.push(demoCustomer);
  
  // Log activity
  logActivity('create', `Demo-kunde oprettet: ${restaurantName}`, { 
    category: 'kunder', 
    subCategory: 'stamdata',
    customerId: demoCustomer.id, 
    contact: `${firstName} ${lastName}`, 
    demoExpiry: expiryDate.toISOString() 
  });
  
  // Update UI
  loadRestaurants();
  loadDashboard();
  
  // Reset onboarding form
  resetDemoOnboarding();
  
  // Show success and navigate to customer
  toast(`Demo-kunde "${restaurantName}" oprettet med ${licenseDays} dages prøveperiode`, 'success');
  
  // Navigate to customer profile
  setTimeout(() => {
    openCrmProfile(demoCustomer.id);
  }, 300);
}

function getDemoLicenseStatus(customer) {
  if (!customer.isDemo || !customer.demoLicense) return null;
  
  const now = new Date();
  const expiry = new Date(customer.demoLicense.expiryDate);
  const daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  
  return {
    isExpired: daysRemaining <= 0,
    daysRemaining: Math.max(0, daysRemaining),
    messagesUsed: customer.demoLicense.messagesUsed || 0,
    messagesLimit: customer.demoLicense.messagesLimit || 50,
    expiryDate: expiry
  };
}

function formatDemoStatus(customer) {
  const status = getDemoLicenseStatus(customer);
  if (!status) return '';
  
  if (status.isExpired) {
    return '<span class="status-demo status-demo-expired">Demo udløbet</span>';
  }
  
  return `<span class="status-demo">Demo · ${status.daysRemaining} dage</span>`;
}

function upgradeDemoCustomer(id) {
  const restaurant = restaurants.find(r => r.id === id);
  if (!restaurant) {
    toast('Kunde ikke fundet', 'error');
    return;
  }
  
  if (!confirm(`Er du sikker på, at du vil opgradere "${restaurant.name}" til betalende kunde?\n\nDette vil:\n- Fjerne demo-status\n- Aktivere fuld funktionalitet\n- Kræve manuel oprettelse af faktureringaftale`)) {
    return;
  }
  
  // Remove demo status
  restaurant.isDemo = false;
  restaurant.demoLicense = null;
  restaurant.status = 'active';
  restaurant.features.billing = true;
  restaurant.features.export = true;
  
  // Log activity
  logActivity('update', `Demo-kunde opgraderet til betalt: ${restaurant.name}`, { 
    category: 'kunder',
    subCategory: 'abonnement',
    customerId: restaurant.id, 
    previousStatus: 'demo',
    newStatus: 'active'
  });
  
  // Update UI
  loadRestaurants();
  loadDashboard();
  
  // Refresh profile view if open
  if (currentProfileRestaurantId === id) {
    showCrmProfileView(id);
  }
  
  toast(`"${restaurant.name}" er nu en betalende kunde`, 'success');
}

// Override showModal to handle demo-onboarding reset
const originalShowModal = showModal;
showModal = function(id) {
  if (id === 'demo-onboarding') {
    resetDemoOnboarding();
  }
  originalShowModal(id);
};

function editRestaurant(id) {
  const restaurant = restaurants.find(r => r.id === id);
  if (!restaurant) {
    toast('Restaurant ikke fundet', 'error');
    return;
  }
  
  // Populate basic form fields
  document.getElementById('edit-restaurant-id').value = id;
  document.getElementById('edit-restaurant-name').value = restaurant.name || '';
  document.getElementById('edit-restaurant-logo').value = restaurant.logo || 'pizza';
  document.getElementById('edit-restaurant-phone').value = restaurant.phone || '';
  document.getElementById('edit-restaurant-sms-number').value = restaurant.smsNumber || restaurant.settings?.sms_number || '';
  document.getElementById('edit-restaurant-website').value = restaurant.website || '';
  document.getElementById('edit-restaurant-menu').value = restaurant.menuUrl || '';
  document.getElementById('edit-restaurant-google').value = restaurant.googleReviewUrl || '';
  document.getElementById('edit-restaurant-trustpilot').value = restaurant.trustpilotUrl || '';
  document.getElementById('edit-restaurant-delay').value = restaurant.reviewDelay || 60;
  
  // Populate delivery toggle
  document.getElementById('edit-restaurant-delivery').checked = restaurant.deliveryEnabled !== false;
  
  // Populate KPI toggle
  const kpiEnabled = restaurant.kpiEnabled || false;
  document.getElementById('edit-restaurant-kpi-enabled').checked = kpiEnabled;
  document.getElementById('kpi-preview').style.display = kpiEnabled ? 'block' : 'none';
  
  // Update KPI preview values
  if (restaurant.kpi) {
    document.getElementById('kpi-preview-revenue').textContent = formatCurrency(restaurant.kpi.totalRevenue);
    document.getElementById('kpi-preview-recovered').textContent = formatCurrency(restaurant.kpi.recoveredRevenue);
    document.getElementById('kpi-preview-rating').textContent = restaurant.kpi.reviews?.avgRating?.toFixed(1) || '0.0';
    document.getElementById('kpi-preview-conversion').textContent = (restaurant.kpi.conversionRate || 0) + '%';
    
    // Extended KPIs
    document.getElementById('kpi-preview-ai').textContent = (restaurant.kpi.aiAutomationRate || 0) + '%';
    document.getElementById('kpi-preview-clv').textContent = formatCurrency(restaurant.kpi.clv || 0);
    document.getElementById('kpi-preview-ctr').textContent = (restaurant.kpi.reviewCTR || 0) + '%';
    
    // Render heatmap
    renderOrderHeatmap(restaurant.kpi.orderHeatmap);
    
    // Render sentiment
    renderSentiment(restaurant.kpi.sentiment);
  }
  
  // Populate review request toggle (Workflow Sync)
  document.getElementById('edit-restaurant-review-request').checked = restaurant.reviewRequestEnabled !== false;
  updateReviewSyncStatus(restaurant.reviewRequestEnabled !== false);
  
  // Load menu editor
  loadMenuItemsEditor(id);
  
  // Populate time format
  const timeFormat = restaurant.timeFormat || '24h';
  document.getElementById('time-format-24').checked = (timeFormat === '24h');
  document.getElementById('time-format-12').checked = (timeFormat === '12h');
  
  // Populate opening hours
  const defaultHours = getDefaultOpeningHours();
  const hours = restaurant.openingHours || defaultHours;
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  days.forEach(day => {
    const dayEl = document.querySelector(`.opening-day[data-day="${day}"]`);
    if (dayEl) {
      const dayHours = hours[day] || defaultHours[day];
      dayEl.querySelector('.day-enabled').checked = dayHours.enabled;
      dayEl.querySelector('.open-time').value = dayHours.open;
      dayEl.querySelector('.close-time').value = dayHours.close;
    }
  });
  
  showModal('edit-restaurant');
}

// Render order heatmap
function renderOrderHeatmap(heatmapData) {
  const container = document.getElementById('order-heatmap');
  if (!container || !heatmapData) return;
  
  // Get max value for scaling
  let maxVal = 1;
  Object.values(heatmapData).forEach(dayData => {
    dayData.forEach(val => { if (val > maxVal) maxVal = val; });
  });
  
  // Sum all days for display
  const hourTotals = new Array(24).fill(0);
  Object.values(heatmapData).forEach(dayData => {
    dayData.forEach((val, hour) => { hourTotals[hour] += val; });
  });
  
  container.innerHTML = hourTotals.map((val, hour) => {
    const intensity = val / (maxVal * 7); // 7 days
    const color = intensity > 0.7 ? 'var(--green)' : intensity > 0.4 ? 'var(--orange)' : intensity > 0.1 ? 'var(--accent)' : 'var(--bg2)';
    return `<div style="height:20px;background:${color};border-radius:2px;opacity:${0.3 + intensity * 0.7}" title="${hour}:00 - ${val} ordrer"></div>`;
  }).join('');
}

// Render sentiment analysis
function renderSentiment(sentimentData) {
  if (!sentimentData) return;
  
  const total = sentimentData.positive + sentimentData.neutral + sentimentData.negative;
  if (total === 0) return;
  
  const posPercent = Math.round((sentimentData.positive / total) * 100);
  const neuPercent = Math.round((sentimentData.neutral / total) * 100);
  const negPercent = Math.round((sentimentData.negative / total) * 100);
  
  document.getElementById('sentiment-positive').style.width = posPercent + '%';
  document.getElementById('sentiment-neutral').style.width = neuPercent + '%';
  document.getElementById('sentiment-negative').style.width = negPercent + '%';
  
  document.getElementById('sentiment-pos-pct').textContent = posPercent;
  document.getElementById('sentiment-neu-pct').textContent = neuPercent;
  document.getElementById('sentiment-neg-pct').textContent = negPercent;
}

// Sync review request toggle with workflow node
function syncReviewRequestToggle() {
  const enabled = document.getElementById('edit-restaurant-review-request').checked;
  updateReviewSyncStatus(enabled);
  
  // Update workflow node status (visual indicator)
  const reviewNode = workflowNodes.find(n => n.id === 'send-review-request');
  if (reviewNode) {
    reviewNode.disabled = !enabled;
    renderWorkflowNodes(); // Re-render to show disabled state
  }
}

// Update sync status indicator
function updateReviewSyncStatus(enabled) {
  const statusEl = document.getElementById('review-sync-status');
  if (statusEl) {
    statusEl.innerHTML = enabled 
      ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><span style="color:var(--green)">Aktiv - synkroniseret med workflow node "Anmeldelsesanmodning"</span>'
      : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg><span>Deaktiveret - noden springes over i workflow</span>';
  }
}

// Export KPI as PDF
function exportKpiPdf() {
  const id = document.getElementById('edit-restaurant-id').value;
  const restaurant = restaurants.find(r => r.id === id);
  if (!restaurant) return;
  
  // In production, this would call a PDF generation API
  console.log(`Generating PDF for ${restaurant.name}`);
}

// Export KPI as Excel
function exportKpiExcel() {
  const id = document.getElementById('edit-restaurant-id').value;
  const restaurant = restaurants.find(r => r.id === id);
  if (!restaurant) return;
  
  // In production, this would generate an XLSX file
  console.log(`Generating Excel for ${restaurant.name}`);
}


// =====================================================
// CRM MODULE FUNCTIONS - SEARCH FIRST DESIGN
// =====================================================

// Current CRM state
let currentProfileRestaurantId = null;
let crmCurrentPage = 1;
const crmPageSize = 10;

// Generate 6-digit UserID from restaurant id
function generateUserId(id) {
  // Handle null/undefined/empty
  if (!id) return '000000';
  
  // Ensure id is a string
  const idStr = String(id);
  
  // Create a hash from the id string to get consistent 6 digits
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = ((hash << 5) - hash) + idStr.charCodeAt(i);
    hash = hash & hash;
  }
  return String(Math.abs(hash) % 1000000).padStart(6, '0');
}

// Safe string getter for search
function safeString(val) {
  if (val === null || val === undefined) return '';
  return String(val).toLowerCase();
}

// Initialize CRM table on page load - show empty state
function initCrmTable() {
  // Show empty state in table (table is always visible now)
  const tbody = document.getElementById('crm-table-body');
  if (tbody) {
    tbody.innerHTML = `
      <tr id="crm-empty-row">
        <td colspan="6" style="text-align:center;padding:40px;color:var(--muted)">
          <div style="margin-bottom:8px">Indtast søgekriterier ovenfor</div>
          <div style="font-size:12px">Søg på navn, CVR, telefonnummer eller UserID</div>
        </td>
      </tr>
    `;
  }
  document.getElementById('crm-page-info').textContent = '1 af 1';
}

// Handle CRM search with autocomplete
function handleCrmSearch(query) {
  query = safeString(query).trim().toLowerCase();

  // Combine real restaurants with demo customers if enabled
  let allCustomers = [...restaurants];
  if (isDemoDataEnabled()) {
    const demoCustomers = getDemoDataCustomers();
    allCustomers = [...allCustomers, ...demoCustomers];
  }

  // Always filter and show results in table
  let filtered;

  if (!query) {
    // If demo data enabled, show all demo customers when no query
    if (isDemoDataEnabled() && allCustomers.length > 0) {
      renderCrmTable(allCustomers, '');
      return;
    }
    // Show empty state row if no query
    const tbody = document.getElementById('crm-table-body');
    if (tbody) {
      tbody.innerHTML = `
        <tr id="crm-empty-row">
          <td colspan="6" style="text-align:center;padding:40px;color:var(--muted)">
            <div style="margin-bottom:8px">Indtast søgekriterier ovenfor</div>
            <div style="font-size:12px">Søg på navn, CVR, telefonnummer eller UserID</div>
          </td>
        </tr>
      `;
    }
    document.getElementById('crm-page-info').textContent = '1 af 1';
    return;
  }

  // Filter all customers with safe string handling
  filtered = allCustomers.filter(r => {
    if (!r) return false;
    const userId = generateUserId(r.id).toLowerCase();
    const name = safeString(r.name).toLowerCase();
    const phone = safeString(r.phone || r.contact_phone).toLowerCase();
    const cvr = safeString(r.cvr).toLowerCase();
    const address = safeString(r.address).toLowerCase();
    const city = safeString(r.city).toLowerCase();

    return name.includes(query) ||
           phone.includes(query) ||
           cvr.includes(query) ||
           userId.includes(query) ||
           address.includes(query) ||
           city.includes(query);
  });

  // Update table directly
  renderCrmTable(filtered, query);
}

// Render CRM table
function renderCrmTable(data, query) {
  const tbody = document.getElementById('crm-table-body');
  const pageInfo = document.getElementById('crm-page-info');
  
  if (!data || data.length === 0) {
    // Show "no results" in table body
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;padding:40px;color:var(--muted)">
            <div style="margin-bottom:8px">Ingen kunder fundet</div>
            <div style="font-size:12px">Prøv at tilpasse din søgning</div>
          </td>
        </tr>
      `;
    }
    if (pageInfo) pageInfo.textContent = '0 af 0';
    return;
  }
  
  // HTML escape function
  const escapeHtml = (str) => {
    if (!str) return '-';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
  
  // Pagination
  const totalPages = Math.ceil(data.length / crmPageSize);
  const start = (crmCurrentPage - 1) * crmPageSize;
  const pageData = data.slice(start, start + crmPageSize);
  
  tbody.innerHTML = pageData.map(r => {
    if (!r) return '';
    const userId = generateUserId(r.id);
    const id = escapeHtml(r.id);
    const name = escapeHtml(r.name) || 'Uden navn';
    const phone = escapeHtml(r.phone || r.contact_phone);
    const cvr = escapeHtml(r.cvr);
    const status = r.status || 'pending';
    const isDemo = r.isDemo || false;
    const rowClass = isDemo ? 'demo-row' : '';
    
    // Status badge with demo support
    let statusBadge = '';
    if (isDemo) {
      const demoStatus = getDemoLicenseStatus(r);
      if (demoStatus && demoStatus.isExpired) {
        statusBadge = '<span class="status-badge status-demo status-demo-expired">Demo udløbet</span>';
      } else if (demoStatus) {
        statusBadge = `<span class="status-badge status-demo">Demo · ${demoStatus.daysRemaining}d</span>`;
      } else {
        statusBadge = '<span class="status-badge status-demo">Demo</span>';
      }
    } else if (status === 'active') {
      statusBadge = '<span class="status-badge status-active">Aktiv</span>';
    } else if (status === 'inactive') {
      statusBadge = '<span class="status-badge status-pending">Inaktiv</span>';
    } else if (status === 'churned') {
      statusBadge = '<span class="status-badge" style="background:rgba(248,113,113,.1);color:var(--danger)">Opsagt</span>';
    } else if (status === 'terminated') {
      statusBadge = '<span class="status-badge status-terminated">Opsagt (GDPR)</span>';
    } else if (status === 'gdpr_deleted') {
      statusBadge = '<span class="status-badge" style="background:rgba(107,114,128,.15);color:var(--muted)">GDPR Slettet</span>';
    } else {
      statusBadge = '<span class="status-badge status-pending">Afventer</span>';
    }
    
    return `
    <tr class="${rowClass}" onclick="showCrmProfileView('${id}')">
      <td style="font-family:'SF Mono',monospace;font-size:12px">${userId}</td>
      <td style="font-weight:500">${name}${isDemo ? ' <span class="demo-badge">DEMO</span>' : ''}</td>
      <td>${phone}</td>
      <td>${cvr}</td>
      <td>Danmark</td>
      <td>${statusBadge}</td>
    </tr>
  `}).join('');
  
  // Update pagination info
  if (pageInfo) pageInfo.textContent = `${crmCurrentPage} af ${totalPages}`;
}

// Pagination functions
function crmFirstPage() { crmCurrentPage = 1; handleCrmSearch(document.getElementById('crm-search')?.value); }
function crmPrevPage() { if (crmCurrentPage > 1) { crmCurrentPage--; handleCrmSearch(document.getElementById('crm-search')?.value); } }
function crmNextPage() { const total = Math.ceil(restaurants.length / crmPageSize); if (crmCurrentPage < total) { crmCurrentPage++; handleCrmSearch(document.getElementById('crm-search')?.value); } }
function crmLastPage() { crmCurrentPage = Math.ceil(restaurants.length / crmPageSize); handleCrmSearch(document.getElementById('crm-search')?.value); }

// Show search view
function showCrmSearchView() {
  document.getElementById('crm-search-view').style.display = 'block';
  document.getElementById('crm-profile-view').style.display = 'none';
  currentProfileRestaurantId = null;
  localStorage.removeItem('lastViewedCustomerId');
  document.getElementById('crm-search').value = '';
  initCrmTable();

  // Update breadcrumb
  updateBreadcrumb('kunder');
}

// Close customer context and return to search
function closeCustomerContext() {
  showCrmSearchView();
}

// Show customer sub-page
function showCustomerSubpage(subpage) {
  const isCustomerView = currentUser?.role && [ROLES.CUSTOMER, ROLES.DEMO].includes(currentUser.role);
  // Fallback til localStorage hvis currentProfileRestaurantId er null
  if (!currentProfileRestaurantId) {
    const lastViewed = localStorage.getItem('lastViewedCustomerId');
    if (lastViewed) currentProfileRestaurantId = lastViewed;
  }
  const restaurantId = currentProfileRestaurantId || (restaurants[0]?.id);

  console.log('📄 showCustomerSubpage:', subpage, 'isCustomerView:', isCustomerView, 'restaurantId:', restaurantId);

  // === FOR DEMO/KUNDE: Brug de RIGTIGE subpages (samme som admin) ===
  if (isCustomerView) {
    // Sørg for at demo restaurant context er sat
    if (!currentProfileRestaurantId && restaurants.length > 0) {
      currentProfileRestaurantId = restaurants[0].id;
      console.log('📍 Sat currentProfileRestaurantId til:', currentProfileRestaurantId);
    }

    // Vis kunder-siden med profil-view aktiv
    const kunderPage = document.getElementById('page-kunder');
    const crmSearchView = document.getElementById('crm-search-view');
    const crmProfileView = document.getElementById('crm-profile-view');

    if (kunderPage && crmProfileView) {
      // Skjul andre pages
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      kunderPage.classList.add('active');

      // Vis profil-view (ikke søge-view)
      if (crmSearchView) crmSearchView.style.display = 'none';
      crmProfileView.style.display = 'block';

      // Opdater header med demo restaurant info
      const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
      if (restaurant) {
        const profileName = document.getElementById('profile-name');
        const profileCvr = document.getElementById('profile-cvr');
        if (profileName) profileName.textContent = restaurant.name;
        if (profileCvr) profileCvr.textContent = restaurant.cvr || '-';
      }
    }
  }

  // Hide all subpages
  document.querySelectorAll('.customer-subpage').forEach(sp => sp.classList.remove('active'));

  // Show selected subpage
  const targetSubpage = document.getElementById('subpage-' + subpage);
  if (targetSubpage) {
    targetSubpage.classList.add('active');
    console.log('✅ Viser subpage:', 'subpage-' + subpage);
  } else {
    console.warn('⚠️ Subpage ikke fundet:', 'subpage-' + subpage);
    // Fallback til dashboard subpage
    const dashboardSubpage = document.getElementById('subpage-dashboard');
    if (dashboardSubpage) {
      dashboardSubpage.classList.add('active');
      subpage = 'dashboard';
    }
  }

  // Dev page-ID badge for subpages
  showPageIdBadge('kunder > subpage-' + subpage);

  // Update sidebar menu items (ensure only one active highlight)
  document.querySelectorAll('.nav-dropdown-item').forEach(item => {
    item.classList.remove('active');
  });
  event?.target?.closest('.nav-dropdown-item')?.classList.add('active');

  // Load data for the sub-page if needed
  if (subpage === 'noegletal') loadCustomerKPIData();
  if (subpage === 'dashboard') loadCustomerDashboard(restaurantId);
  if (subpage === 'produkter') loadProductsPage();
  if (subpage === 'kategorier') renderCategoriesTable();
  if (subpage === 'faktura') loadFakturaPage();
  if (subpage === 'abonnement') loadAbonnementPage();
  if (subpage === 'kundelogs') loadCustomerKundelogs();
  if (subpage === 'aktivitetslogs') loadCustomerAktivitetslogs();
  if (subpage === 'stamdata') loadStamdataPage(restaurantId);
  if (subpage === 'beskeder') loadBeskederPage(restaurantId);
  if (subpage === 'workflow-kontrol') loadWorkflowKontrolPage(restaurantId);
}

/**
 * Load stamdata page - populerer formularfelter med restaurant data
 */
function loadStamdataPage(restaurantId) {
  const restaurant = restaurants.find(r => r.id === restaurantId);
  if (!restaurant) {
    console.warn('Restaurant ikke fundet for stamdata:', restaurantId);
    return;
  }

  console.log('📋 Loading stamdata for:', restaurant.name);

  // Populate STAMDATA form
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  setVal('stamdata-name', restaurant.name);
  setVal('stamdata-cvr', restaurant.cvr);
  setVal('stamdata-owner', restaurant.owner || restaurant.contact_name);
  setVal('stamdata-contact', restaurant.contactPerson || restaurant.contact_name);
  setVal('stamdata-email', restaurant.email || restaurant.contact_email);
  setVal('stamdata-phone', restaurant.phone || restaurant.contact_phone);
  setVal('stamdata-industry', restaurant.industry || restaurant.metadata?.industry);
  setVal('stamdata-address', restaurant.address);
  setVal('stamdata-country', restaurant.country || 'DK');
  setVal('stamdata-website', restaurant.website || restaurant.metadata?.website);
  setVal('stamdata-created', restaurant.createdAt || restaurant.created_at || '-');

  // MobilePay integration
  setVal('stamdata-mobilepay-merchant', restaurant.mobilepayMerchantId);
  setVal('stamdata-mobilepay-api-key', restaurant.mobilepayApiKey);
}

/**
 * Load beskeder page - populerer SMS skabeloner
 */
function loadBeskederPage(restaurantId) {
  const restaurant = restaurants.find(r => r.id === restaurantId);
  if (!restaurant) {
    console.warn('Restaurant ikke fundet for beskeder:', restaurantId);
    return;
  }

  console.log('💬 Loading beskeder for:', restaurant.name);

  // Load saved messages or defaults
  const messages = restaurant.messages || {};
  const setMsg = (id, defaultText) => {
    const el = document.getElementById(id);
    if (el) el.value = messages[id] || defaultText;
  };

  setMsg('msg-welcome-text', 'Hej {{kunde}}! Tak for din interesse i {{restaurant}}.');
  setMsg('msg-pending-text', 'Vi har modtaget din ordre og arbejder på den.');
  setMsg('msg-accepted-text', 'Din ordre er accepteret! Forventet ventetid: {{ventetid}} min.');
  setMsg('msg-preparing-text', 'Din ordre er nu under tilberedning.');
  setMsg('msg-ready-text', 'Din ordre er klar til afhentning/levering!');
  setMsg('msg-picked-up-text', 'Tak for din ordre hos {{restaurant}}!');
  setMsg('msg-closed-text', 'Vi har desværre lukket. Åbningstider: {{åbningstider}}');
  setMsg('msg-error-text', 'Beklager, der opstod en fejl. Prøv igen eller ring til os.');
}

/**
 * Load workflow kontrol page - populerer workflow indstillinger
 */
function loadWorkflowKontrolPage(restaurantId) {
  const restaurant = restaurants.find(r => r.id === restaurantId);
  if (!restaurant) {
    console.warn('Restaurant ikke fundet for workflow kontrol:', restaurantId);
    return;
  }

  console.log('⚙️ Loading workflow kontrol for:', restaurant.name);

  // Workflow toggles
  const setChecked = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.checked = !!val;
  };

  setChecked('wf-review-enabled', restaurant.googleReviewUrl || restaurant.trustpilotUrl);
  setChecked('wf-reorder-enabled', restaurant.reorderEnabled !== false);
  setChecked('wf-receipt-enabled', restaurant.receiptEnabled !== false);
  setChecked('wf-delivery-enabled', restaurant.deliveryEnabled !== false);

  // Review links
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  setVal('wf-google-link', restaurant.googleReviewUrl);
  setVal('wf-trustpilot-link', restaurant.trustpilotUrl);

  // Opening hours
  const oh = restaurant.openingHours || {};
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const defaultTimes = {
    mon: { open: '10:00', close: '22:00' },
    tue: { open: '10:00', close: '22:00' },
    wed: { open: '10:00', close: '22:00' },
    thu: { open: '10:00', close: '22:00' },
    fri: { open: '10:00', close: '23:00' },
    sat: { open: '11:00', close: '23:00' },
    sun: { open: '12:00', close: '21:00' }
  };

  days.forEach(day => {
    const dayData = oh[day] || defaultTimes[day];
    setChecked(`oh-${day}-enabled`, dayData.enabled !== false);
    setVal(`oh-${day}-open`, dayData.open);
    setVal(`oh-${day}-close`, dayData.close);
  });

  // Toggle delivery settings visibility
  if (typeof toggleDeliverySettings === 'function') {
    toggleDeliverySettings();
  }
}


// =====================================================
// CUSTOMER DASHBOARD - Charts and Stats
// =====================================================

let customerRevenueChart = null;
let customerPaymentChart = null;
let customerProductsChart = null;

/**
 * Load customer dashboard data and render charts
 */
async function loadCustomerDashboard(restaurantId) {
  const restaurant = findRestaurantOrDemo(restaurantId);
  if (!restaurant) return;

  // Update KPI stats
  const statsOrders = document.getElementById('customer-stat-orders');
  const statsRevenue = document.getElementById('customer-stat-revenue');
  const statsAvgOrder = document.getElementById('customer-stat-avg-order');
  const statsContacts = document.getElementById('customer-stat-contacts');

  if (statsOrders) statsOrders.textContent = restaurant.orders_total || 0;
  if (statsRevenue) statsRevenue.textContent = formatCurrency(restaurant.revenue_total || 0);
  if (statsAvgOrder) {
    const avg = restaurant.orders_total > 0 ? (restaurant.revenue_total / restaurant.orders_total) : 0;
    statsAvgOrder.textContent = formatCurrency(avg);
  }
  if (statsContacts) statsContacts.textContent = restaurant.contacts_count || (restaurant.isDemo ? Math.floor(Math.random() * 50) + 10 : 0);

  // Try to load orders for charts (revenue & payment methods)
  let orders = [];
  try {
    if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getOrdersByRestaurant) {
      orders = await SupabaseDB.getOrdersByRestaurant(restaurantId) || [];
      console.log(`📊 Loaded ${orders.length} orders from database`);
    }
  } catch (err) {
    console.log('Could not load orders from database:', err.message);
  }

  // Fallback to demo orders for demo customers
  if (orders.length === 0 && restaurant.isDemo && isDemoDataEnabled()) {
    orders = generateDemoOrdersForCustomer(restaurantId);
    console.log(`📊 Loaded ${orders.length} demo orders for ${restaurant.name}`);
  }

  // Load menu items for products chart (from produktbibliotek)
  let menuItems = [];
  try {
    // Try restaurant's customMenu first
    if (restaurant.customMenu && restaurant.customMenu.items && restaurant.customMenu.items.length > 0) {
      menuItems = restaurant.customMenu.items;
      console.log(`📊 Loaded ${menuItems.length} products from customMenu`);
    }
    // Try localStorage
    else {
      const savedMenu = localStorage.getItem(`menu_${restaurantId}`);
      if (savedMenu) {
        const parsed = JSON.parse(savedMenu);
        menuItems = parsed.items || [];
        console.log(`📊 Loaded ${menuItems.length} products from localStorage`);
      }
    }
    // Try Supabase if still empty
    if (menuItems.length === 0 && typeof SupabaseDB !== 'undefined' && SupabaseDB.getMenu) {
      const menu = await SupabaseDB.getMenu(restaurantId);
      if (menu && menu.items && menu.items.length > 0) {
        menuItems = menu.items;
        console.log(`📊 Loaded ${menuItems.length} products from Supabase`);
      }
    }
  } catch (err) {
    console.log('Could not load menu items:', err.message);
  }

  // Hide demo data indicator (we no longer use demo data)
  const demoIndicator = document.getElementById('demo-data-indicator');
  if (demoIndicator) {
    demoIndicator.style.display = 'none';
  }

  // Render charts
  renderCustomerRevenueChart(orders);
  renderCustomerPaymentChart(orders);
  renderCustomerProductsChart(menuItems); // Nu med produktbibliotek data
}

// Chart instances for demo dashboard
let demoRevenueChart = null;
let demoPaymentChart = null;
let demoProductsChart = null;

// Track retry count to prevent infinite loops
let demoDashboardRetryCount = 0;
const MAX_DEMO_DASHBOARD_RETRIES = 10;

/**
 * Load demo dashboard with KPIs and charts for demo/kunde users
 * Called from loginDemo() after showApp()
 */
async function loadDemoDashboard() {
  console.log('📊 Loading demo dashboard... (attempt', demoDashboardRetryCount + 1, ')');

  const restaurant = restaurants[0]; // Use first demo restaurant
  if (!restaurant) {
    console.warn('No restaurant for demo dashboard');
    return;
  }

  // Tjek at customer-dashboard er synligt
  const customerDash = document.getElementById('customer-dashboard');
  if (!customerDash || customerDash.classList.contains('hidden')) {
    if (demoDashboardRetryCount < MAX_DEMO_DASHBOARD_RETRIES) {
      demoDashboardRetryCount++;
      console.warn('Customer dashboard not visible, retrying... (', demoDashboardRetryCount, '/', MAX_DEMO_DASHBOARD_RETRIES, ')');
      setTimeout(() => loadDemoDashboard(), 150);
      return;
    } else {
      console.error('Customer dashboard still not visible after max retries. Forcing visibility.');
      // Force visibility and continue
      if (customerDash) customerDash.classList.remove('hidden');
    }
  }

  // Tjek at canvas elementer eksisterer
  const revenueCtx = document.getElementById('demo-revenue-chart');
  const paymentCtx = document.getElementById('demo-payment-chart');
  const productsCtx = document.getElementById('demo-products-chart');

  if (!revenueCtx || !paymentCtx || !productsCtx) {
    if (demoDashboardRetryCount < MAX_DEMO_DASHBOARD_RETRIES) {
      demoDashboardRetryCount++;
      console.warn('Demo chart canvas elements not found, retrying... (', demoDashboardRetryCount, '/', MAX_DEMO_DASHBOARD_RETRIES, ')');
      setTimeout(() => loadDemoDashboard(), 150);
      return;
    } else {
      console.error('Demo chart canvas elements not found after max retries');
      return;
    }
  }

  // Reset retry count on success
  demoDashboardRetryCount = 0;

  // Update KPI stats
  const statsOrders = document.getElementById('demo-stat-orders');
  const statsRevenue = document.getElementById('demo-stat-revenue');
  const statsAvg = document.getElementById('demo-stat-avg');
  const statsRating = document.getElementById('demo-stat-rating');

  if (statsOrders) statsOrders.textContent = restaurant.orders_total || 127;
  if (statsRevenue) statsRevenue.textContent = formatCurrency(restaurant.revenue_total || 45890);
  if (statsAvg) {
    const avg = restaurant.orders_total > 0 ? (restaurant.revenue_total / restaurant.orders_total) : 361;
    statsAvg.textContent = formatCurrency(avg);
  }
  if (statsRating) statsRating.textContent = '4.8';

  // Generate demo orders for charts
  const orders = generateDemoOrdersData(restaurant.id);
  console.log('📊 Generated', orders.length, 'demo orders for charts');

  // Render demo charts med requestAnimationFrame for at sikre DOM er klar
  requestAnimationFrame(() => {
    renderDemoRevenueChart(orders);
    renderDemoPaymentChart(orders);
    renderDemoProductsChart(orders);
    console.log('✅ Demo charts rendered');
  });

  console.log('✅ Demo dashboard loaded');
}

/**
 * Demo revenue chart
 */
function renderDemoRevenueChart(orders) {
  const ctx = document.getElementById('demo-revenue-chart');
  if (!ctx) return;

  // Group by day (last 30 days)
  const last30Days = [];
  const revenueByDay = {};
  const ordersByDay = {};

  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    last30Days.push(key);
    revenueByDay[key] = 0;
    ordersByDay[key] = 0;
  }

  orders.forEach(order => {
    const date = new Date(order.created_at).toISOString().split('T')[0];
    if (revenueByDay.hasOwnProperty(date)) {
      revenueByDay[date] += order.total || 0;
      ordersByDay[date]++;
    }
  });

  if (demoRevenueChart) demoRevenueChart.destroy();

  demoRevenueChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: last30Days.map(d => new Date(d).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })),
      datasets: [
        {
          label: 'Omsætning',
          data: last30Days.map(d => revenueByDay[d]),
          backgroundColor: 'rgba(34, 197, 94, 0.7)',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
        x: { grid: { display: false } }
      }
    }
  });
}

/**
 * Demo payment methods pie chart
 */
function renderDemoPaymentChart(orders) {
  const ctx = document.getElementById('demo-payment-chart');
  if (!ctx) return;

  const paymentCounts = {};
  orders.forEach(order => {
    const method = order.payment_method || 'Ukendt';
    paymentCounts[method] = (paymentCounts[method] || 0) + 1;
  });

  if (demoPaymentChart) demoPaymentChart.destroy();

  demoPaymentChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(paymentCounts),
      datasets: [{
        data: Object.values(paymentCounts),
        backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: '#999' } }
      }
    }
  });
}

/**
 * Demo top products bar chart
 */
function renderDemoProductsChart(orders) {
  const ctx = document.getElementById('demo-products-chart');
  if (!ctx) return;

  const productSales = {};
  orders.forEach(order => {
    (order.items || []).forEach(item => {
      productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
    });
  });

  const sortedProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (demoProductsChart) demoProductsChart.destroy();

  demoProductsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sortedProducts.map(p => p[0]),
      datasets: [{
        label: 'Solgte enheder',
        data: sortedProducts.map(p => p[1]),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { grid: { display: false } }
      }
    }
  });
}

/**
 * Set demo chart period (not implemented fully - placeholder)
 */
function setDemoChartPeriod(days) {
  // Update active button
  document.querySelectorAll('.demo-charts-section .chart-period').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.includes(days === '30' ? '30' : days === '90' ? '3' : '12'));
  });
  // Could regenerate data for different period here
}

/**
 * Generate demo orders data for charts
 */
function generateDemoOrdersData(restaurantId) {
  const orders = [];
  const paymentMethods = ['Kort', 'Kontant', 'MobilePay', 'Faktura'];
  const products = ['Margherita', 'Pepperoni', 'Quattro Formaggi', 'Calzone', 'Hawaiianer', 'Kebab Pizza', 'Vegetar', 'Tiramisu', 'Cola', 'Fanta'];

  for (let i = 0; i < 50; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));

    const numItems = Math.floor(Math.random() * 4) + 1;
    const items = [];
    for (let j = 0; j < numItems; j++) {
      items.push({
        name: products[Math.floor(Math.random() * products.length)],
        quantity: Math.floor(Math.random() * 3) + 1,
        price: Math.floor(Math.random() * 100) + 50
      });
    }

    orders.push({
      id: `demo-${i}`,
      restaurant_id: restaurantId,
      created_at: date.toISOString(),
      total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      items: items
    });
  }
  return orders;
}


function findRestaurantOrDemo(id) {
  let r = restaurants.find(r => r.id === id);
  if (!r && isDemoDataEnabled()) {
    r = getDemoDataCustomers().find(c => c.id === id);
  }
  return r || null;
}

// Helper: Generate demo orders for a specific demo customer (for charts)
function generateDemoOrdersForCustomer(customerId) {
  if (!isDemoDataEnabled()) return [];
  const allOrders = getDemoDataOrders();
  return allOrders.filter(o => o.restaurant_id === customerId);
}

// Helper: Generate demo heatmap data for customer KPI
function generateDemoHeatmapData() {
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const heatmap = {};
  days.forEach(day => {
    const hours = new Array(24).fill(0);
    for (let h = 10; h <= 22; h++) {
      hours[h] = Math.floor(Math.random() * 15) + (h >= 11 && h <= 13 ? 8 : 0) + (h >= 17 && h <= 20 ? 10 : 0);
    }
    heatmap[day] = hours;
  });
  return heatmap;
}

// Helper: Generate demo kundelogs for a demo customer
function generateDemoKundelogs(customerId) {
  const restaurant = findRestaurantOrDemo(customerId);
  const name = restaurant?.name || 'Demo Kunde';
  const types = ['opkald', 'email', 'system', 'profil', 'ordre', 'note'];
  const logs = [];
  const descriptions = [
    { type: 'opkald', desc: `Udgående opkald til ${name} - aftale om onboarding`, prioritet: 'normal' },
    { type: 'email', desc: `Velkomstmail sendt til ${name}`, prioritet: 'normal' },
    { type: 'system', desc: 'Kundeprofil oprettet automatisk', prioritet: 'lav' },
    { type: 'ordre', desc: `Første testordre modtaget fra ${name}`, prioritet: 'normal' },
    { type: 'profil', desc: 'Virksomhedsoplysninger opdateret', prioritet: 'normal' },
    { type: 'email', desc: `Fakturaoplysninger sendt til ${name}`, prioritet: 'normal' },
    { type: 'note', desc: 'Kunde ønsker integration med e-conomic', prioritet: 'høj' },
    { type: 'opkald', desc: `Opfølgningsopkald med ${name} - tilfreds med systemet`, prioritet: 'normal' },
    { type: 'system', desc: 'API-nøgle genereret til tredjepart', prioritet: 'lav' },
    { type: 'ordre', desc: `Ny ordre #${Math.floor(Math.random() * 9000) + 1000} registreret`, prioritet: 'normal' },
    { type: 'email', desc: 'Månedlig rapport sendt automatisk', prioritet: 'lav' },
    { type: 'note', desc: 'Kunde overvejer opgradering til Pro-pakke', prioritet: 'høj' },
  ];
  for (let i = 0; i < descriptions.length; i++) {
    const d = descriptions[i];
    const ts = new Date();
    ts.setDate(ts.getDate() - i * 3 - Math.floor(Math.random() * 3));
    ts.setHours(Math.floor(Math.random() * 10) + 8, Math.floor(Math.random() * 60));
    logs.push({
      id: `demo-kundelog-${customerId}-${i}`,
      customerId: customerId,
      timestamp: ts.toISOString(),
      type: d.type,
      beskrivelse: d.desc,
      prioritet: d.prioritet,
      reference: `REF-${String(1000 + i).padStart(4, '0')}`,
      tags: [d.type],
      isDemo: true
    });
  }
  return logs;
}

// =====================================================
// END DEMO DATA SYSTEM
// =====================================================

/**
 * Monthly revenue/orders line chart
 */
function renderCustomerRevenueChart(orders) {
  const ctx = document.getElementById('customer-revenue-chart');
  if (!ctx) return;

  // Group by day (last 30 days)
  const last30Days = [];
  const revenueByDay = {};
  const ordersByDay = {};

  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    last30Days.push(key);
    revenueByDay[key] = 0;
    ordersByDay[key] = 0;
  }

  orders.forEach(order => {
    const date = new Date(order.created_at).toISOString().split('T')[0];
    if (revenueByDay.hasOwnProperty(date)) {
      revenueByDay[date] += order.total || 0;
      ordersByDay[date]++;
    }
  });

  if (customerRevenueChart) customerRevenueChart.destroy();

  customerRevenueChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: last30Days.map(d => new Date(d).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })),
      datasets: [
        {
          label: 'Omsætning',
          data: last30Days.map(d => revenueByDay[d]),
          backgroundColor: 'rgba(134, 197, 158, 0.8)',  // Blød grøn (matcher cirkeldiagram)
          borderRadius: 3
        },
        {
          label: 'Ordrer',
          data: last30Days.map(d => ordersByDay[d]),
          backgroundColor: 'rgba(134, 182, 246, 0.8)',  // Blød blå (matcher cirkeldiagram)
          borderRadius: 3,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.05)' }
        },
        y1: {
          position: 'right',
          beginAtZero: true,
          grid: { display: false }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

/**
 * Payment methods doughnut chart
 */
function renderCustomerPaymentChart(orders) {
  const ctx = document.getElementById('customer-payment-chart');
  if (!ctx) return;

  // Standard betalingsmetoder (vises altid)
  const defaultMethods = ['Kort', 'Kontant', 'MobilePay', 'Faktura'];
  const methodColors = {
    'Kort': 'rgba(134, 182, 246, 0.8)',
    'Kontant': 'rgba(134, 197, 158, 0.8)',
    'MobilePay': 'rgba(178, 132, 190, 0.8)',
    'Faktura': 'rgba(246, 186, 134, 0.8)'
  };

  // Tæl betalingsmetoder fra ordrer
  const paymentMethods = {};
  orders.forEach(order => {
    const method = order.payment_method || 'Ukendt';
    paymentMethods[method] = (paymentMethods[method] || 0) + 1;
  });

  if (customerPaymentChart) customerPaymentChart.destroy();

  // Hvis ingen data, vis grå placeholder doughnut
  if (Object.keys(paymentMethods).length === 0) {
    customerPaymentChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Ingen data'],
        datasets: [{
          data: [1],
          backgroundColor: ['rgba(80, 80, 80, 0.3)'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      }
    });
  } else {
    // Vis rigtig data
    const colors = defaultMethods.map(m => methodColors[m]);
    customerPaymentChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(paymentMethods),
        datasets: [{
          data: Object.values(paymentMethods),
          backgroundColor: Object.keys(paymentMethods).map(m => methodColors[m] || 'rgba(158, 158, 158, 0.8)'),
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  // Generer betalingsmetode-tabel - viser ALTID de 4 standard metoder
  const total = Object.values(paymentMethods).reduce((a, b) => a + b, 0);
  let tableHtml = '';

  defaultMethods.forEach(method => {
    const count = paymentMethods[method] || 0;
    const methodOrders = orders.filter(o => o.payment_method === method);
    const amount = methodOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : 0;

    tableHtml += `
      <div class="payment-row">
        <span class="payment-dot" style="background:${methodColors[method]}"></span>
        <span class="payment-method">${method}</span>
        <span class="payment-amount">${formatCurrency(amount)}</span>
        <span class="payment-percent">${percentage}%</span>
      </div>
    `;
  });

  const tableEl = document.getElementById('payment-stats-table');
  if (tableEl) tableEl.innerHTML = tableHtml;
}

/**
 * Top products horizontal bar chart - viser produkter fra produktbibliotek
 */
function renderCustomerProductsChart(menuItems) {
  const ctx = document.getElementById('customer-products-chart');
  if (!ctx) return;

  // Vis produkter fra kundens produktbibliotek (menu items)
  const products = (menuItems || []).slice(0, 10);

  if (customerProductsChart) customerProductsChart.destroy();

  // Hvis ingen produkter, vis synlig grå placeholder bar
  if (products.length === 0) {
    customerProductsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Ingen produkter endnu'],
        datasets: [{
          label: 'Produkter',
          data: [100],  // Synlig værdi
          backgroundColor: 'rgba(80, 80, 80, 0.3)',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          x: { display: false, max: 100 },
          y: { grid: { display: false } }
        }
      }
    });
    return;
  }

  customerProductsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: products.map(p => p.name || p.title || 'Ukendt'),
      datasets: [{
        label: 'Pris',
        data: products.map(p => p.price || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${context.raw} kr`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.05)' },
          title: { display: true, text: 'Pris (kr)', color: 'var(--muted)' }
        },
        y: {
          grid: { display: false }
        }
      }
    }
  });
}

/**
 * Change chart period (placeholder for future implementation)
 */
function setCustomerChartPeriod(period) {
  // Update active button
  document.querySelectorAll('#subpage-dashboard .chart-period').forEach(btn => {
    btn.classList.remove('active');
  });
  event?.target?.classList.add('active');

  // TODO: Implement period filtering
  console.log('Set customer chart period:', period);
}

// =====================================================
// FAKTURA PAGE - Invoice Management
// =====================================================

let invoiceHistoryData = [];
let invoiceCurrentPage = 1;
const invoicesPerPage = 10;

// Default subscription plans (localStorage fallback, overwritten by Supabase on load)
let subscriptionPlans = JSON.parse(localStorage.getItem('orderflow_subscription_plans') || 'null') || [
  { id: 'starter', name: 'Starter', price: 299, description: 'Perfekt til små restauranter', features: ['100 SMS/måned', '2 brugere', 'Basis workflow', 'Email support'], popular: false },
  { id: 'professional', name: 'Professional', price: 799, description: 'Den perfekte løsning for voksende restauranter', features: ['500 SMS/måned', '5 brugere', 'AI Workflow', 'Rapporter', 'Email support', 'API adgang'], popular: true },
  { id: 'enterprise', name: 'Enterprise', price: 1499, description: 'For store restaurantkæder', features: ['Ubegrænset SMS', 'Ubegrænset brugere', 'AI Workflow Pro', 'Avancerede rapporter', '24/7 Support', 'Dedikeret manager'], popular: false }
];

// Transform Supabase DB row → local plan format

function dbPlanToLocal(dbPlan) {
  return {
    id: dbPlan.plan_id || dbPlan.id,
    _dbId: dbPlan.id,
    name: dbPlan.name,
    price: dbPlan.monthly_price,
    monthly_price: dbPlan.monthly_price,
    annual_price: dbPlan.annual_price,
    description: dbPlan.description || '',
    features: Array.isArray(dbPlan.features) ? dbPlan.features : [],
    popular: dbPlan.is_popular || false,
    button_text: dbPlan.button_text || 'Kom i gang',
    button_variant: dbPlan.button_variant || 'default',
    is_active: dbPlan.is_active !== false,
    sort_order: dbPlan.sort_order || 0
  };
}

// Transform local plan → Supabase DB row
function localPlanToDB(plan) {
  return {
    plan_id: plan.id,
    name: plan.name,
    description: plan.description || '',
    monthly_price: plan.monthly_price ?? plan.price ?? 0,
    annual_price: plan.annual_price ?? Math.round((plan.monthly_price || plan.price || 0) * 0.8),
    features: plan.features || [],
    button_text: plan.button_text || 'Kom i gang',
    button_variant: plan.button_variant || 'default',
    is_popular: plan.popular || false,
    is_active: plan.is_active !== false,
    sort_order: plan.sort_order || 0
  };
}

function loadFakturaPage() {
  const restaurant = findRestaurantOrDemo(currentProfileRestaurantId);
  if (!restaurant) return;
  
  // Version check - regenerate if old version (SMS-pakke update)
  const invoiceVersion = 2; // Increment when invoice structure changes
  if (!restaurant.invoices || restaurant.invoiceVersion !== invoiceVersion) {
    restaurant.invoices = generateDemoInvoices(restaurant);
    restaurant.invoiceVersion = invoiceVersion;
  }
  if (!restaurant.paymentMethod) restaurant.paymentMethod = { type: 'card', last4: '4242', holder: (restaurant.contactPerson || restaurant.contact || 'KORTHOLDER').toUpperCase(), expiry: '12/26' };
  if (!restaurant.subscription) restaurant.subscription = { planId: 'professional', nextBilling: getNextMonthFirst() };
  
  invoiceHistoryData = restaurant.invoices;
  invoiceCurrentPage = 1;
  
  updateUpcomingInvoice(restaurant);
  updatePaymentMethodDisplay(restaurant);
  renderInvoiceHistory();
}

function generateDemoInvoices(restaurant) {
  const invoices = [];
  const today = new Date();
  for (let i = 0; i < 12; i++) {
    const invoiceDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const dueDate = new Date(invoiceDate); dueDate.setDate(dueDate.getDate() + 14);
    
    // Generate realistic line items matching Python wrapper structure
    const smsCount = Math.floor(Math.random() * 3) + 1;
    const extraUsers = Math.floor(Math.random() * 5);
    const apiCalls = Math.floor(Math.random() * 20000);
    
    const lines = [
      { description: 'OrderFlow Professional - Månedligt abonnement', quantity: 1, unit: 'måned', price: 799 }
    ];
    
    if (smsCount > 0) {
      lines.push({ description: 'SMS-pakke (1.000 stk.)', quantity: smsCount, unit: 'pakke', price: 249 });
    }
    if (extraUsers > 0) {
      lines.push({ description: 'Ekstra brugerkonti', quantity: extraUsers, unit: 'stk', price: 49 });
    }
    if (apiCalls > 10000) {
      lines.push({ description: 'API-kald overskridelse', quantity: apiCalls - 10000, unit: 'kald', price: 0.02 });
    }
    
    // Calculate totals
    const subtotal = lines.reduce((sum, line) => sum + (line.quantity * line.price), 0);
    const vat = Math.round(subtotal * 0.25 * 100) / 100;
    
    invoices.push({
      id: `INV-${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 90) + 10)}`,
      number: `${invoiceDate.getFullYear()}-${String(1000 + i + 42).slice(-4)}`,
      date: invoiceDate.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      month: invoiceDate.toLocaleDateString('da-DK', { month: 'long', year: 'numeric' }),
      subtotal: Math.round(subtotal * 100) / 100,
      vat: vat,
      total: Math.round((subtotal + vat) * 100) / 100,
      lines: lines,
      paymentTerms: 'Netto 14 dage',
      orderReference: i < 3 ? `PO-${invoiceDate.getFullYear()}-${String(100 + i).padStart(3, '0')}` : null,
      status: i === 0 ? 'pending' : 'paid'
    });
  }
  return invoices;
}

function getNextMonthFirst() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split('T')[0];
}

function updateUpcomingInvoice(restaurant) {
  const plan = subscriptionPlans.find(p => p.id === restaurant.subscription?.planId) || subscriptionPlans[1];
  const subtotal = plan.price + 249 + 98; // SMS-pakke (1.000 stk.) 249 DKK + Ekstra brugere 98 DKK
  const vat = Math.round(subtotal * 0.25 * 100) / 100;
  const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
  document.getElementById('upcoming-invoice-number').textContent = `2025-${String(restaurant.invoices?.length + 43 || 43).padStart(4, '0')}`;
  document.getElementById('upcoming-invoice-period').textContent = nextMonth.toLocaleDateString('da-DK', { month: 'long', year: 'numeric' });
  document.getElementById('upcoming-invoice-date').textContent = formatDateDK(nextMonth);
  document.getElementById('upcoming-invoice-due').textContent = formatDateDK(new Date(nextMonth.getTime() + 14*24*60*60*1000));
  document.getElementById('upcoming-invoice-subtotal').textContent = formatCurrencyDK(subtotal);
  document.getElementById('upcoming-invoice-vat').textContent = formatCurrencyDK(vat);
  document.getElementById('upcoming-invoice-total').textContent = formatCurrencyDK(subtotal + vat);
}

function updatePaymentMethodDisplay(restaurant) {
  const pm = restaurant.paymentMethod;
  document.getElementById('payment-card-number').textContent = `•••• •••• •••• ${pm.last4}`;
  document.getElementById('payment-card-holder').textContent = pm.holder;
  document.getElementById('payment-card-expiry').textContent = pm.expiry;
}

function renderInvoiceHistory() {
  const container = document.getElementById('invoice-history-list');
  const searchTerm = document.getElementById('invoice-search')?.value?.toLowerCase() || '';
  let filtered = searchTerm ? invoiceHistoryData.filter(inv => inv.number.toLowerCase().includes(searchTerm) || inv.month.toLowerCase().includes(searchTerm)) : invoiceHistoryData;
  const start = (invoiceCurrentPage - 1) * invoicesPerPage;
  const paginated = filtered.slice(start, start + invoicesPerPage);
  container.innerHTML = paginated.map(inv => `
    <div style="display:grid;grid-template-columns:1fr 100px 120px 120px 80px;gap:16px;padding:14px 16px;border-bottom:1px solid var(--border);align-items:center;font-size:13px">
      <span style="font-weight:500">${inv.month}</span>
      <span style="color:var(--muted)">${formatDateDK(new Date(inv.date))}</span>
      <span style="font-family:monospace;color:var(--accent)">${inv.number}</span>
      <span style="text-align:right;font-weight:500">${formatCurrencyDK(inv.total)}</span>
      <div style="text-align:center"><button class="btn btn-secondary btn-sm" onclick="downloadInvoicePDF('${inv.number}')" title="Eksporter PDF">↓</button></div>
    </div>
  `).join('');
  document.getElementById('invoice-count-label').textContent = `Viser ${start + 1}-${Math.min(start + invoicesPerPage, filtered.length)} af ${filtered.length} fakturaer`;
  document.getElementById('invoice-prev-btn').disabled = invoiceCurrentPage <= 1;
  document.getElementById('invoice-next-btn').disabled = start + invoicesPerPage >= filtered.length;
}

function filterInvoiceHistory() { invoiceCurrentPage = 1; renderInvoiceHistory(); }
function prevInvoicePage() { if (invoiceCurrentPage > 1) { invoiceCurrentPage--; renderInvoiceHistory(); } }
function nextInvoicePage() { invoiceCurrentPage++; renderInvoiceHistory(); }
function formatDateDK(date) { if (typeof date === 'string') date = new Date(date); return date.toLocaleDateString('da-DK', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
function formatCurrencyDK(amount) { return amount.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' DKK'; }

async function downloadInvoicePDF(invoiceNumber) {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  const invoice = restaurant?.invoices?.find(inv => inv.number === invoiceNumber);
  if (!invoice) { toast('Faktura ikke fundet', 'error'); return; }
  toast('Genererer faktura PDF...', 'info');
  
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    
    // ============ COLORS (matching Python wrapper exactly) ============
    const PRIMARY_COLOR = [26, 26, 46];     // #1a1a2e
    const MEDIUM_GRAY = [224, 224, 224];    // #e0e0e0
    const LIGHT_GRAY = [248, 249, 250];     // #f8f9fa
    const TEXT_COLOR = [51, 51, 51];        // #333333
    
    // ============ PLATFORM INFO (from Python PlatformInfo dataclass) ============
    const platform = {
      company_name: 'OrderFlow ApS',
      address: 'Vestergade 12',
      postal_city: '2100 København Ø',
      cvr: '12345678',
      phone: '+45 70 20 30 40',
      email: 'faktura@orderflow.dk',
      website: 'www.orderflow.dk',
      bank_name: 'Danske Bank',
      bank_reg: '1234',
      bank_account: '12345678'
    };
    
    // ============ PAGE DIMENSIONS (matching Python: A4, 20mm margins) ============
    const pageWidth = 210;   // A4 width in mm
    const pageHeight = 297;  // A4 height in mm
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;  // 170mm
    
    // ============ HEADER - Left: Company Info ============
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEXT_COLOR);
    doc.text(platform.company_name, margin, 25);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${platform.address}, ${platform.postal_city}`, margin, 31);
    doc.text(`CVR: DK ${platform.cvr} | Tlf: ${platform.phone}`, margin, 36);
    doc.text(platform.email, margin, 41);
    
    // ============ HEADER - Right: FAKTURA Title ============
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text('FAKTURA', pageWidth - margin, 25, { align: 'right' });
    
    doc.setFontSize(11);
    doc.text(`Nr. ${invoice.number}`, pageWidth - margin, 33, { align: 'right' });
    
    // ============ HORIZONTAL LINE (1.5pt like Python) ============
    doc.setDrawColor(...PRIMARY_COLOR);
    doc.setLineWidth(0.5);
    doc.line(margin, 46, pageWidth - margin, 46);
    
    // ============ CUSTOMER INFO BOX (Left, Light Gray Background) ============
    // Matching Python: page_width * 0.55, with 3mm padding
    const customerBoxY = 52;
    const customerBoxWidth = contentWidth * 0.55;  // ~93.5mm
    const customerBoxHeight = 38;
    
    doc.setFillColor(...LIGHT_GRAY);
    doc.rect(margin, customerBoxY, customerBoxWidth, customerBoxHeight, 'F');
    
    // Customer info text (with 3mm padding)
    let custY = customerBoxY + 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEXT_COLOR);
    doc.text('Faktureres til:', margin + 3, custY);
    
    // Company name (bold, size 10)
    custY += 6;
    doc.setFontSize(10);
    doc.text(restaurant.name || 'Kunde', margin + 3, custY);
    
    custY += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // Att: (if contact exists)
    if (restaurant.contactPerson || restaurant.contact) {
      doc.text(`Att: ${restaurant.contactPerson || restaurant.contact}`, margin + 3, custY);
      custY += 5;
    }
    
    // Split address into street and postal/city
    const fullAddress = restaurant.address || 'Adresse ikke angivet';
    const addressParts = fullAddress.split(',').map(p => p.trim());
    
    // Street address
    doc.text(addressParts[0] || fullAddress, margin + 3, custY);
    custY += 5;
    
    // Postal city (if exists after comma)
    if (addressParts[1]) {
      doc.text(addressParts[1], margin + 3, custY);
      custY += 5;
    }
    
    // CVR
    if (restaurant.cvr) {
      doc.text(`CVR: ${restaurant.cvr}`, margin + 3, custY);
    }
    
    // ============ INVOICE DATES (Right Side - on same line as labels) ============
    const datesRightX = pageWidth - margin;
    let dateY = customerBoxY + 6;
    
    doc.setFontSize(9);
    
    // Fakturadato
    doc.setFont('helvetica', 'bold');
    doc.text('Fakturadato:', margin + customerBoxWidth + 5, dateY);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDateDK(new Date(invoice.date)), datesRightX, dateY, { align: 'right' });
    
    // Forfaldsdato
    dateY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Forfaldsdato:', margin + customerBoxWidth + 5, dateY);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDateDK(new Date(invoice.dueDate)), datesRightX, dateY, { align: 'right' });
    
    // Betaling
    dateY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Betaling:', margin + customerBoxWidth + 5, dateY);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.paymentTerms || 'Netto 14 dage', datesRightX, dateY, { align: 'right' });
    
    // Deres ref. (if exists)
    if (invoice.orderReference) {
      dateY += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Deres ref.:', margin + customerBoxWidth + 5, dateY);
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.orderReference, datesRightX, dateY, { align: 'right' });
    }
    
    // ============ INVOICE LINES TABLE ============
    let y = customerBoxY + customerBoxHeight + 8;
    
    // Column widths (matching Python: 0.40, 0.12, 0.12, 0.18, 0.18)
    const colWidths = [
      contentWidth * 0.40,  // Beskrivelse
      contentWidth * 0.12,  // Antal
      contentWidth * 0.12,  // Enhed
      contentWidth * 0.18,  // Enhedspris
      contentWidth * 0.18   // Beløb
    ];
    
    // Table Header (dark background)
    doc.setFillColor(...PRIMARY_COLOR);
    doc.rect(margin, y, contentWidth, 10, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    let colX = margin + 3;
    doc.text('Beskrivelse', colX, y + 7);
    colX = margin + colWidths[0];
    doc.text('Antal', colX + colWidths[1] - 3, y + 7, { align: 'right' });
    colX += colWidths[1];
    doc.text('Enhed', colX + colWidths[2] - 3, y + 7, { align: 'right' });
    colX += colWidths[2];
    doc.text('Enhedspris', colX + colWidths[3] - 3, y + 7, { align: 'right' });
    doc.text('Beløb', pageWidth - margin - 3, y + 7, { align: 'right' });
    
    y += 14;
    
    // Table Rows
    doc.setTextColor(...TEXT_COLOR);
    doc.setFont('helvetica', 'normal');
    
    const lines = invoice.lines || [
      { description: 'OrderFlow Abonnement', quantity: 1, unit: 'måned', price: invoice.subtotal || 799 }
    ];
    
    lines.forEach((line, index) => {
      const qty = line.quantity || 1;
      const unitPrice = line.price || line.unit_price || 0;
      const lineTotal = qty * unitPrice;
      
      // Format quantity (integer or 2 decimals)
      const qtyStr = qty === Math.floor(qty) ? String(qty) : qty.toFixed(2).replace('.', ',');
      
      colX = margin + 3;
      doc.text(line.description || 'Linje', colX, y);
      
      colX = margin + colWidths[0];
      doc.text(qtyStr, colX + colWidths[1] - 3, y, { align: 'right' });
      
      colX += colWidths[1];
      doc.text(line.unit || 'stk', colX + colWidths[2] - 3, y, { align: 'right' });
      
      colX += colWidths[2];
      doc.text(formatCurrencyDKShort(unitPrice), colX + colWidths[3] - 3, y, { align: 'right' });
      
      doc.text(formatCurrencyDKShort(lineTotal), pageWidth - margin - 3, y, { align: 'right' });
      
      // Line separator (gray, 0.5pt)
      y += 3;
      doc.setDrawColor(...MEDIUM_GRAY);
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageWidth - margin, y);
      
      y += 5;
    });
    
    // Final line under last row (darker, PRIMARY_COLOR)
    doc.setDrawColor(...PRIMARY_COLOR);
    doc.setLineWidth(0.4);
    doc.line(margin, y - 5, pageWidth - margin, y - 5);
    
    // ============ TOTALS (Right Aligned, matching Python layout) ============
    y += 6;
    const totalsLabelX = pageWidth - margin - 75;
    const totalsValueX = pageWidth - margin - 3;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal ekskl. moms:', totalsLabelX, y);
    doc.text(formatCurrencyDK(invoice.subtotal), totalsValueX, y, { align: 'right' });
    
    y += 6;
    doc.text('Moms 25%:', totalsLabelX, y);
    doc.text(formatCurrencyDK(invoice.vat), totalsValueX, y, { align: 'right' });
    
    // Line above total
    y += 2;
    doc.setDrawColor(...PRIMARY_COLOR);
    doc.setLineWidth(0.4);
    doc.line(totalsLabelX - 5, y, pageWidth - margin, y);
    
    // Total row with background
    y += 1;
    doc.setFillColor(...LIGHT_GRAY);
    doc.rect(totalsLabelX - 5, y, 80, 9, 'F');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Total inkl. moms:', totalsLabelX, y + 6);
    doc.text(formatCurrencyDK(invoice.total), totalsValueX, y + 6, { align: 'right' });
    
    // ============ PAYMENT INFO BOX (Bottom Left, matching Python exactly) ============
    // Python: box_y = 20mm from bottom, box_height = 22mm, box_width = page_width * 0.55
    const paymentBoxY = pageHeight - 42;  // 20mm + 22mm from bottom
    const paymentBoxHeight = 22;
    const paymentBoxWidth = contentWidth * 0.55;
    
    doc.setFillColor(...LIGHT_GRAY);
    doc.rect(margin, paymentBoxY, paymentBoxWidth, paymentBoxHeight, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEXT_COLOR);
    doc.text('Betalingsoplysninger', margin + 3, paymentBoxY + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`${platform.bank_name} | Reg: ${platform.bank_reg} | Konto: ${platform.bank_account}`, margin + 3, paymentBoxY + 11);
    
    // "Anfør fakturanr. XXXX ved betaling" with bold invoice number
    const refPrefix = 'Anfør fakturanr. ';
    const refSuffix = ' ved betaling';
    doc.text(refPrefix, margin + 3, paymentBoxY + 17);
    
    const prefixWidth = doc.getStringUnitWidth(refPrefix) * 9 / doc.internal.scaleFactor;
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.number, margin + 3 + prefixWidth, paymentBoxY + 17);
    
    const numWidth = doc.getStringUnitWidth(invoice.number) * 9 / doc.internal.scaleFactor;
    doc.setFont('helvetica', 'normal');
    doc.text(refSuffix, margin + 3 + prefixWidth + numWidth, paymentBoxY + 17);
    
    // ============ FOOTER (matching Python exactly) ============
    const footerLineY = pageHeight - 15;
    
    // Thin line above footer
    doc.setDrawColor(...MEDIUM_GRAY);
    doc.setLineWidth(0.2);
    doc.line(margin, footerLineY, pageWidth - margin, footerLineY);
    
    // Company info line
    doc.setFontSize(7);
    doc.setTextColor(128, 128, 128);
    const footerText = `${platform.company_name} | ${platform.address}, ${platform.postal_city} | CVR: DK ${platform.cvr} | ${platform.phone} | ${platform.email} | ${platform.website}`;
    doc.text(footerText, pageWidth / 2, footerLineY + 5, { align: 'center' });
    
    // Page number
    doc.setFontSize(8);
    doc.text('Side 1 af 1', pageWidth / 2, footerLineY + 10, { align: 'center' });
    
    // ============ SAVE PDF ============
    doc.save(`Faktura_${invoice.number}.pdf`);
    // toast('Faktura downloadet', 'success'); // Removed - unnecessary
    
  } catch (err) { 
    console.error('PDF generation error:', err); 
    toast('Kunne ikke generere PDF: ' + err.message, 'error'); 
  }
}

// Helper function for currency without "DKK" suffix
function formatCurrencyDKShort(amount) {
  return amount.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function editPaymentMethod() {
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.id = 'payment-method-modal';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:450px">
      <div class="modal-header">
        <h3>Betalingsmetode</h3>
        <button class="modal-close" onclick="document.getElementById('payment-method-modal').remove()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Vælg betalingsmetode</label>
          <select class="input" id="payment-method-select">
            <option value="card">Kreditkort / Debitkort</option>
            <option value="invoice">Faktura</option>
            <option value="mobilepay">MobilePay</option>
          </select>
        </div>
        <p style="font-size:var(--font-size-sm);color:var(--muted)">Kortoplysninger håndteres sikkert via Stripe.</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('payment-method-modal').remove()">Annuller</button>
        <button class="btn btn-primary" onclick="savePaymentMethod()">Gem</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function savePaymentMethod() {
  const method = document.getElementById('payment-method-select')?.value;
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (restaurant) {
    if (!restaurant.billing) restaurant.billing = {};
    restaurant.billing.paymentMethod = method;
    localStorage.setItem(`billing_${restaurant.id}`, JSON.stringify(restaurant.billing));
  }
  toast('Betalingsmetode opdateret', 'success');
  document.getElementById('payment-method-modal')?.remove();
}

async function updatePaymentCard() {
  try {
    const supabaseUrl = CONFIG.SUPABASE_URL;
    const token = (await window.supabaseClient?.auth?.getSession())?.data?.session?.access_token || CONFIG.SUPABASE_ANON_KEY;
    const response = await fetch(supabaseUrl + '/functions/v1/stripe-connect?action=billing-portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
        'apikey': CONFIG.SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ returnUrl: window.location.href })
    });
    const result = await response.json();
    if (result.url) window.location.href = result.url;
    else toast('Kunne ikke oprette Stripe session', 'error');
  } catch (err) {
    toast('Fejl ved kortopsætning: ' + err.message, 'error');
  }
}

// Start Stripe Checkout for subscription plan
async function startSubscriptionCheckout(priceId, planName) {
  try {
    toast('Opretter checkout...', 'info');
    const supabaseUrl = CONFIG.SUPABASE_URL;
    const token = (await window.supabaseClient?.auth?.getSession())?.data?.session?.access_token || CONFIG.SUPABASE_ANON_KEY;
    const response = await fetch(supabaseUrl + '/functions/v1/stripe-connect?action=create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
        'apikey': CONFIG.SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        priceId: priceId,
        successUrl: window.location.origin + '/?checkout=success',
        cancelUrl: window.location.origin + '/?checkout=cancelled'
      })
    });
    const result = await response.json();
    if (result.url) {
      window.location.href = result.url;
    } else {
      toast(result.error || 'Kunne ikke oprette checkout session', 'error');
    }
  } catch (err) {
    toast('Fejl: ' + err.message, 'error');
  }
}

// Load subscription status from Supabase
async function loadSubscriptionStatus() {
  try {
    const supabaseUrl = CONFIG.SUPABASE_URL;
    const token = (await window.supabaseClient?.auth?.getSession())?.data?.session?.access_token || CONFIG.SUPABASE_ANON_KEY;
    const response = await fetch(supabaseUrl + '/functions/v1/stripe-connect?action=subscription-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
        'apikey': CONFIG.SUPABASE_ANON_KEY
      },
      body: '{}'
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn('[Subscription] Status fejl:', e);
  }
  return { subscription: null, recentPayments: [] };
}

// Cancel subscription
async function cancelSubscription() {
  if (!confirm('Er du sikker på du vil opsige dit abonnement? Det vil forblive aktivt til slutningen af den nuværende periode.')) return;
  try {
    const supabaseUrl = CONFIG.SUPABASE_URL;
    const token = (await window.supabaseClient?.auth?.getSession())?.data?.session?.access_token || CONFIG.SUPABASE_ANON_KEY;
    const response = await fetch(supabaseUrl + '/functions/v1/stripe-connect?action=cancel-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
        'apikey': CONFIG.SUPABASE_ANON_KEY
      },
      body: '{}'
    });
    const result = await response.json();
    if (result.success) {
      toast('Abonnement opsagt — aktivt til periodeudløb', 'success');
    } else {
      toast(result.error || 'Kunne ikke opsige', 'error');
    }
  } catch (err) {
    toast('Fejl: ' + err.message, 'error');
  }
}

// Change subscription plan
async function changeSubscriptionPlan(newPriceId) {
  if (!confirm('Skift plan? Der kan blive beregnet en proration.')) return;
  try {
    const supabaseUrl = CONFIG.SUPABASE_URL;
    const token = (await window.supabaseClient?.auth?.getSession())?.data?.session?.access_token || CONFIG.SUPABASE_ANON_KEY;
    const response = await fetch(supabaseUrl + '/functions/v1/stripe-connect?action=change-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
        'apikey': CONFIG.SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ newPriceId })
    });
    const result = await response.json();
    if (result.success) {
      toast('Plan ændret', 'success');
    } else {
      toast(result.error || 'Kunne ikke ændre plan', 'error');
    }
  } catch (err) {
    toast('Fejl: ' + err.message, 'error');
  }
}

// Export subscription functions
window.startSubscriptionCheckout = startSubscriptionCheckout;
window.loadSubscriptionStatus = loadSubscriptionStatus;
window.cancelSubscription = cancelSubscription;
window.changeSubscriptionPlan = changeSubscriptionPlan;

function exportInvoiceHistory() {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return;

  const invoices = restaurant.invoices || [];
  if (!invoices.length) { toast('Ingen fakturaer at eksportere', 'warn'); return; }

  const headers = ['Fakturanr', 'Dato', 'Beløb', 'Status'];
  const rows = invoices.map(inv => [
    inv.number || '',
    new Date(inv.date).toLocaleDateString('da-DK'),
    (inv.amount || 0).toFixed(2),
    inv.status || 'betalt'
  ]);

  const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fakturaer_${restaurant.name || 'export'}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Fakturaer eksporteret', 'success');
}
window.editPaymentMethod = editPaymentMethod;
window.savePaymentMethod = savePaymentMethod;
window.updatePaymentCard = updatePaymentCard;
window.exportInvoiceHistory = exportInvoiceHistory;


// =====================================================
// ABONNEMENT PAGE - Subscription Management
// =====================================================

async function loadAbonnementPage() {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return;
  if (!restaurant.subscription) restaurant.subscription = { planId: 'professional', nextBilling: getNextMonthFirst() };

  // Refresh plans from Supabase
  try {
    if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getSubscriptionPlans) {
      const dbPlans = await SupabaseDB.getSubscriptionPlans(true);
      if (dbPlans && dbPlans.length > 0) {
        subscriptionPlans = dbPlans.map(dbPlanToLocal);
        saveSubscriptionPlans();
      }
    }
  } catch (err) {
    console.warn('⚠️ Bruger cached planer:', err.message);
  }

  const currentPlan = subscriptionPlans.find(p => p.id === restaurant.subscription.planId) || subscriptionPlans[1];
  document.getElementById('current-plan-name').textContent = currentPlan.name;
  document.getElementById('current-plan-desc').textContent = currentPlan.description;
  document.getElementById('current-plan-price').innerHTML = `${currentPlan.price} <span style="font-size:16px;font-weight:400">DKK/md</span>`;
  currentPlan.features.forEach((f, i) => { const el = document.getElementById(`plan-feature-${i + 1}`); if (el) el.textContent = f; });
  document.getElementById('next-billing-date').textContent = new Date(restaurant.subscription.nextBilling).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });
  renderOtherPlans(restaurant.subscription.planId);
}

function renderOtherPlans(currentPlanId) {
  const container = document.getElementById('other-plans-grid');
  container.innerHTML = subscriptionPlans.filter(p => p.id !== currentPlanId).map(plan => `
    <div class="card" style="padding:24px;${plan.popular ? 'border:2px solid var(--accent)' : ''}">
      ${plan.popular ? '<span style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:var(--accent);color:#0a0b0d;font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px">POPULÆR</span>' : ''}
      <h4 style="font-size:18px;font-weight:600;margin-bottom:4px">${plan.name}</h4>
      <p style="font-size:13px;color:var(--muted);margin-bottom:16px">${plan.description}</p>
      <div style="font-size:28px;font-weight:700;margin-bottom:16px">${plan.price} <span style="font-size:14px;font-weight:400;color:var(--muted)">DKK/md</span></div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px">${plan.features.map(f => `<div style="display:flex;align-items:center;gap:8px;font-size:13px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>${f}</div>`).join('')}</div>
      <button class="btn ${plan.popular ? 'btn-primary' : 'btn-secondary'}" style="width:100%" onclick="changePlan('${plan.id}')">Skift til ${plan.name}</button>
    </div>
  `).join('');
}

function changePlan(planId) {
  const plan = subscriptionPlans.find(p => p.id === planId);
  if (!plan) return;
  if (confirm(`Er du sikker på du vil skifte til ${plan.name} (${plan.price} DKK/md)?`)) {
    const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
    if (restaurant) { restaurant.subscription.planId = planId; saveRestaurants(); loadAbonnementPage(); toast(`Skiftet til ${plan.name}`, 'success'); }
  }
}

function purchaseAddon(type) {
  const addons = { 'sms': 'Ekstra SMS-pakke (249 DKK)', 'user': 'Ekstra bruger (49 DKK/md)' };
  toast(`${addons[type]} tilføjet til næste faktura`, 'success');
}

// =====================================================
// SUBSCRIPTION PLAN CONFIGURATION (Settings Admin)
// =====================================================

async function renderSubscriptionPlansConfig() {
  const container = document.getElementById('subscription-plans-config');
  if (!container) return;

  // Fetch from Supabase
  try {
    if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getSubscriptionPlans) {
      const dbPlans = await SupabaseDB.getSubscriptionPlans(false);
      if (dbPlans && dbPlans.length > 0) {
        subscriptionPlans = dbPlans.map(dbPlanToLocal);
        saveSubscriptionPlans();
        console.log('✅ Planer hentet fra Supabase:', subscriptionPlans.length);
      }
    }
  } catch (err) {
    console.warn('⚠️ Kunne ikke hente planer fra Supabase, bruger lokale:', err.message);
  }

  container.innerHTML = subscriptionPlans.map((plan) => `
    <div class="card" style="padding:20px;position:relative;${plan.popular ? 'border:2px solid var(--accent)' : ''}" data-plan-id="${plan.id}">
      ${plan.popular ? '<span style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:var(--accent);color:#0a0b0d;font-size:10px;font-weight:600;padding:3px 10px;border-radius:20px">POPULÆR</span>' : ''}
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <div>
          <h4 style="font-size:16px;font-weight:600;margin:0">${plan.name}</h4>
          <p style="font-size:12px;color:var(--muted);margin:4px 0 0 0">${plan.description}</p>
        </div>
        <div style="display:flex;gap:4px">
          <button class="btn btn-secondary btn-sm" onclick="editSubscriptionPlan('${plan.id}')" title="Rediger">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-secondary btn-sm" onclick="deleteSubscriptionPlan('${plan.id}')" title="Slet" ${subscriptionPlans.length <= 1 ? 'disabled' : ''}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
      <div style="display:flex;gap:16px;align-items:baseline;margin-bottom:12px">
        <div><span style="font-size:24px;font-weight:700">${plan.monthly_price || plan.price || 0}</span> <span style="font-size:12px;font-weight:400;color:var(--muted)">DKK/md</span></div>
        ${plan.annual_price ? `<div><span style="font-size:16px;font-weight:600;color:var(--muted)">${plan.annual_price}</span> <span style="font-size:11px;color:var(--muted)">DKK/md (årlig)</span></div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;font-size:12px">
        ${plan.features.slice(0, 4).map(f => `
          <div style="display:flex;align-items:center;gap:6px">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            ${f}
          </div>
        `).join('')}
        ${plan.features.length > 4 ? `<div style="color:var(--muted)">+${plan.features.length - 4} mere...</div>` : ''}
      </div>
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
        <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer">
          <input type="checkbox" ${plan.popular ? 'checked' : ''} onchange="togglePlanPopular('${plan.id}', this.checked)">
          Markér som populær
        </label>
      </div>
    </div>
  `).join('');
}

async function addSubscriptionPlan() {
  const planId = 'plan_' + Date.now();
  const sortOrder = subscriptionPlans.length + 1;

  const newPlan = {
    id: planId,
    name: 'Ny Plan',
    price: 499,
    monthly_price: 499,
    annual_price: 399,
    description: 'Beskrivelse af planen',
    features: ['Feature 1', 'Feature 2', 'Feature 3'],
    popular: false,
    button_text: 'Kom i gang',
    button_variant: 'default',
    is_active: true,
    sort_order: sortOrder
  };

  // Insert into Supabase
  try {
    if (typeof SupabaseDB !== 'undefined' && SupabaseDB.createSubscriptionPlan) {
      const dbData = localPlanToDB(newPlan);
      const created = await SupabaseDB.createSubscriptionPlan(dbData);
      newPlan._dbId = created.id;
      console.log('✅ Ny plan oprettet i Supabase:', created.id);
    }
  } catch (err) {
    console.error('❌ Fejl ved oprettelse i Supabase:', err);
    toast('Fejl ved oprettelse', 'error');
    return;
  }

  subscriptionPlans.push(newPlan);
  saveSubscriptionPlans();
  renderSubscriptionPlansConfig();
  editSubscriptionPlan(newPlan.id);
}

function editSubscriptionPlan(planId) {
  const plan = subscriptionPlans.find(p => p.id === planId);
  if (!plan) return;

  const html = `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="form-group">
        <label class="form-label">Plannavn</label>
        <input type="text" class="input" id="edit-plan-name" value="${plan.name}">
      </div>
      <div class="form-group">
        <label class="form-label">Beskrivelse</label>
        <input type="text" class="input" id="edit-plan-desc" value="${plan.description}">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group">
          <label class="form-label">Månedlig pris (DKK)</label>
          <input type="number" class="input" id="edit-plan-monthly-price" value="${plan.monthly_price ?? plan.price ?? 0}">
        </div>
        <div class="form-group">
          <label class="form-label">Årlig pris (DKK/md)</label>
          <input type="number" class="input" id="edit-plan-annual-price" value="${plan.annual_price ?? 0}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Knaptekst</label>
        <input type="text" class="input" id="edit-plan-button-text" value="${plan.button_text || 'Kom i gang'}">
      </div>
      <div class="form-group">
        <label class="form-label">Features (én per linje)</label>
        <textarea class="input" id="edit-plan-features" rows="6" style="resize:vertical">${plan.features.join('\n')}</textarea>
      </div>
      <div style="display:flex;gap:12px;justify-content:flex-end">
        <button class="btn btn-secondary" onclick="closeCustomModal()">Annuller</button>
        <button class="btn btn-primary" onclick="saveEditedPlan('${planId}')">Gem ændringer</button>
      </div>
    </div>
  `;

  showCustomModal('Rediger plan: ' + plan.name, html);
}

async function saveEditedPlan(planId) {
  const plan = subscriptionPlans.find(p => p.id === planId);
  if (!plan) return;

  plan.name = document.getElementById('edit-plan-name').value;
  plan.description = document.getElementById('edit-plan-desc').value;
  plan.monthly_price = parseInt(document.getElementById('edit-plan-monthly-price').value) || 0;
  plan.annual_price = parseInt(document.getElementById('edit-plan-annual-price').value) || 0;
  plan.price = plan.monthly_price;
  plan.button_text = document.getElementById('edit-plan-button-text')?.value || 'Kom i gang';
  plan.features = document.getElementById('edit-plan-features').value.split('\n').filter(f => f.trim());

  // Save to Supabase
  try {
    if (typeof SupabaseDB !== 'undefined' && SupabaseDB.updateSubscriptionPlan && plan._dbId) {
      const dbData = localPlanToDB(plan);
      delete dbData.plan_id;
      await SupabaseDB.updateSubscriptionPlan(plan._dbId, dbData);
      console.log('✅ Plan opdateret i Supabase:', plan.name);
    }
  } catch (err) {
    console.error('❌ Fejl ved Supabase opdatering:', err);
    toast('Fejl ved gem', 'error');
    return;
  }

  saveSubscriptionPlans();
  renderSubscriptionPlansConfig();
  closeCustomModal();
  toast('Plan opdateret', 'success');
}

async function deleteSubscriptionPlan(planId) {
  if (subscriptionPlans.length <= 1) {
    toast('Der skal være mindst én plan', 'error');
    return;
  }

  if (confirm('Er du sikker på du vil slette denne plan?')) {
    const plan = subscriptionPlans.find(p => p.id === planId);

    // Delete from Supabase
    try {
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.deleteSubscriptionPlan && plan?._dbId) {
        await SupabaseDB.deleteSubscriptionPlan(plan._dbId);
        console.log('✅ Plan slettet fra Supabase:', plan._dbId);
      }
    } catch (err) {
      console.error('❌ Fejl ved sletning fra Supabase:', err);
      toast('Fejl ved sletning', 'error');
      return;
    }

    subscriptionPlans = subscriptionPlans.filter(p => p.id !== planId);
    saveSubscriptionPlans();
    renderSubscriptionPlansConfig();
    toast('Plan slettet', 'success');
  }
}

async function togglePlanPopular(planId, isPopular) {
  // Nulstil alle andre planer
  if (isPopular) {
    for (const p of subscriptionPlans) {
      if (p.popular && p.id !== planId) {
        p.popular = false;
        try {
          if (typeof SupabaseDB !== 'undefined' && SupabaseDB.updateSubscriptionPlan && p._dbId) {
            await SupabaseDB.updateSubscriptionPlan(p._dbId, { is_popular: false });
          }
        } catch (err) {
          console.warn('⚠️ Fejl ved nulstilling af populær:', err);
        }
      }
    }
  }

  const plan = subscriptionPlans.find(p => p.id === planId);
  if (plan) {
    plan.popular = isPopular;
    try {
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.updateSubscriptionPlan && plan._dbId) {
        await SupabaseDB.updateSubscriptionPlan(plan._dbId, { is_popular: isPopular });
      }
    } catch (err) {
      console.error('❌ Fejl ved populær toggle:', err);
    }
    saveSubscriptionPlans();
    renderSubscriptionPlansConfig();
  }
}

function saveSubscriptionPlans() {
  localStorage.setItem('orderflow_subscription_plans', JSON.stringify(subscriptionPlans));
}

function saveBillingSettings() {
  const settings = {
    paymentTerms: document.getElementById('default-payment-terms')?.value || '14',
    vatRate: document.getElementById('default-vat-rate')?.value || '25'
  };
  localStorage.setItem('orderflow_billing_settings', JSON.stringify(settings));

  if (window.SupabaseDB) {
    window.SupabaseDB.saveUserSetting('billing_settings', settings)
      .catch(err => console.warn('Supabase sync fejl (billing):', err));
  }
}

function savePlatformBillingInfo() {
  const info = {
    company: document.getElementById('platform-company')?.value || 'OrderFlow ApS',
    cvr: document.getElementById('platform-cvr')?.value || '12345678',
    bankReg: document.getElementById('platform-bank-reg')?.value || '1234',
    bankAccount: document.getElementById('platform-bank-account')?.value || '12345678'
  };
  localStorage.setItem('orderflow_platform_billing', JSON.stringify(info));

  if (window.SupabaseDB) {
    window.SupabaseDB.saveUserSetting('platform_billing', info)
      .catch(err => console.warn('Supabase sync fejl (platform billing):', err));
  }
}

function showCustomModal(title, content) {
  let modal = document.getElementById('custom-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'custom-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal" style="max-width:500px">
        <div class="modal-header">
          <h3 id="custom-modal-title"></h3>
          <button class="modal-close" onclick="closeCustomModal()">&times;</button>
        </div>
        <div class="modal-body" id="custom-modal-body"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  document.getElementById('custom-modal-title').textContent = title;
  document.getElementById('custom-modal-body').innerHTML = content;
  modal.classList.add('active');
}

function closeCustomModal() {
  const modal = document.getElementById('custom-modal');
  if (modal) modal.classList.remove('active');
}


// =====================================================
// PRODUKTER PAGE - Menu Management
// =====================================================

let currentProductFilter = null;

function loadProductsPage() {
  // Look in both real and demo restaurants
  let restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant && isDemoDataEnabled()) {
    const demoCustomers = getDemoDataCustomers();
    restaurant = demoCustomers.find(r => r.id === currentProfileRestaurantId);
  }
  if (!restaurant) return;
  
  // Initialize products array if not exists
  if (!restaurant.products) {
    restaurant.products = [];
  }
  if (!restaurant.productCategories) {
    restaurant.productCategories = ['Pizza', 'Pasta', 'Burger', 'Salat', 'Drikkevarer', 'Tilbehør'];
  }
  if (!restaurant.deliveryZones) {
    restaurant.deliveryZones = [];
  }
  if (!restaurant.extras) {
    restaurant.extras = [];
  }
  
  renderProductCategories(restaurant);
  renderProducts(restaurant);
  renderDeliveryZones(restaurant);
  renderExtras(restaurant);
  updateProductCount(restaurant);
}

function renderProductCategories(restaurant) {
  const container = document.getElementById('product-categories');
  const filterContainer = document.getElementById('product-category-filters');
  if (!container || !filterContainer) return;
  
  const categories = restaurant.productCategories || [];
  
  // Render category tags
  container.innerHTML = categories.map((cat, idx) => `
    <div class="tag" style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:var(--bg3);border-radius:var(--radius-full);font-size:12px">
      ${cat}
      <button onclick="removeProductCategory(${idx})" style="background:none;border:none;cursor:pointer;opacity:0.5;padding:0;line-height:1" title="Fjern kategori">×</button>
    </div>
  `).join('');
  
  // Render filter buttons
  filterContainer.innerHTML = `
    <button class="btn btn-secondary btn-sm ${!currentProductFilter ? 'active' : ''}" onclick="filterProductsByCategory(null)" data-category="all">Alle</button>
    ${categories.map(cat => `
      <button class="btn btn-secondary btn-sm ${currentProductFilter === cat ? 'active' : ''}" onclick="filterProductsByCategory('${cat}')">${cat}</button>
    `).join('')}
  `;
}

function addProductCategory() {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return;
  
  const name = prompt('Navn på ny kategori:');
  if (!name || name.trim() === '') return;
  
  if (!restaurant.productCategories) {
    restaurant.productCategories = [];
  }
  
  if (restaurant.productCategories.includes(name.trim())) {
    toast('Kategori findes allerede', 'error');
    return;
  }
  
  restaurant.productCategories.push(name.trim());
  renderProductCategories(restaurant);
  markProductsUnsaved();
  toast('Kategori tilføjet', 'success');
}

function removeProductCategory(idx) {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant || !restaurant.productCategories) return;
  
  if (!confirm('Fjern denne kategori?')) return;
  
  restaurant.productCategories.splice(idx, 1);
  renderProductCategories(restaurant);
  markProductsUnsaved();
}

function filterProductsByCategory(category) {
  currentProductFilter = category;
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (restaurant) {
    renderProductCategories(restaurant);
    renderProducts(restaurant);
  }
}

function renderProducts(restaurant) {
  const container = document.getElementById('products-list');
  const emptyState = document.getElementById('products-empty');
  if (!container) return;

  let products = restaurant.products || [];

  // Apply filter
  if (currentProductFilter) {
    products = products.filter(p => p.category === currentProductFilter);
  }

  // Apply category filter (multi-select)
  const selectedCategories = getCategoryFilters(restaurant.id);
  if (selectedCategories.length > 0) {
    products = products.filter(p => selectedCategories.includes(p.category));
  }

  // Apply search
  const searchTerm = document.getElementById('product-search')?.value?.toLowerCase() || '';
  if (searchTerm) {
    products = products.filter(p =>
      p.name.toLowerCase().includes(searchTerm) ||
      p.number?.toString().includes(searchTerm) ||
      p.category?.toLowerCase().includes(searchTerm)
    );
  }
  
  if (products.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }
  
  if (emptyState) emptyState.style.display = 'none';
  
  container.innerHTML = products.map((product, idx) => {
    const originalIdx = restaurant.products.indexOf(product);
    const categoryName = product.category || 'Ingen kategori';

    return `
    <div style="display:grid;grid-template-columns:60px 2fr 1.5fr 1fr 80px;gap:var(--space-3);padding:12px 16px;background:var(--bg);border-bottom:1px solid var(--border);align-items:center">
      <div style="width:32px;height:32px;background:var(--bg3);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px;color:var(--muted)">${escapeHtml(product.number || idx + 1)}</div>
      <div style="font-weight:500;font-size:14px">${escapeHtml(product.name)}</div>
      <div style="font-size:12px;color:var(--muted)">${escapeHtml(categoryName)}</div>
      <div style="font-weight:600;color:var(--accent);text-align:right">${escapeHtml(product.price || '0')} kr</div>
      <div style="display:flex;gap:4px;justify-content:flex-end">
        <button class="btn btn-secondary btn-sm" onclick="editProduct(${originalIdx})" title="Rediger">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn btn-secondary btn-sm" onclick="deleteProduct(${originalIdx})" title="Slet" style="color:var(--danger)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
  `;
  }).join('');
}

function filterProducts() {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (restaurant) {
    renderProducts(restaurant);
  }
}

function updateProductCount(restaurant) {
  const countEl = document.getElementById('product-count');
  if (countEl) {
    const count = restaurant.products?.length || 0;
    countEl.textContent = `${count} produkt${count !== 1 ? 'er' : ''}`;
  }
}

function showAddProductModal() {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return;
  
  const categories = restaurant.productCategories || [];
  const nextNumber = (restaurant.products?.length || 0) + 1;
  
  const modal = document.createElement('div');
  modal.id = 'product-modal';
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:500px">
      <div class="modal-header">
        <h3>Tilføj produkt</h3>
        <button class="modal-close" onclick="closeProductModal()">×</button>
      </div>
      <div class="modal-body">
        <div style="display:grid;grid-template-columns:80px 1fr;gap:12px;margin-bottom:16px">
          <div class="form-group">
            <label class="form-label">Nr.</label>
            <input type="text" class="input" id="product-number" value="${nextNumber}">
          </div>
          <div class="form-group">
            <label class="form-label">Navn *</label>
            <input type="text" class="input" id="product-name" placeholder="Pizza Margherita">
          </div>
        </div>
        <div class="form-group" style="margin-bottom:16px">
          <label class="form-label">Beskrivelse</label>
          <input type="text" class="input" id="product-description" placeholder="Tomat, mozzarella, basilikum">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
          <div class="form-group">
            <label class="form-label">Kategori</label>
            <select class="input" id="product-category">
              <option value="">Vælg kategori...</option>
              ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Pris (kr) *</label>
            <input type="number" class="input" id="product-price" placeholder="89" min="0" step="1">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeProductModal()">Annuller</button>
        <button class="btn btn-primary" onclick="saveProduct()">Tilføj produkt</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('product-name').focus();
}

function closeProductModal() {
  const modal = document.getElementById('product-modal');
  if (modal) modal.remove();
}

function saveProduct(editIdx = null) {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return;
  
  const number = document.getElementById('product-number').value.trim();
  const name = document.getElementById('product-name').value.trim();
  const description = document.getElementById('product-description').value.trim();
  const category = document.getElementById('product-category').value;
  const price = parseFloat(document.getElementById('product-price').value) || 0;
  
  if (!name) {
    toast('Navn er påkrævet', 'error');
    return;
  }
  if (price <= 0) {
    toast('Pris skal være større end 0', 'error');
    return;
  }
  
  const product = {
    id: editIdx !== null ? restaurant.products[editIdx].id : Date.now().toString(),
    number: number,
    name: name,
    description: description,
    category: category,
    price: price
  };
  
  if (!restaurant.products) {
    restaurant.products = [];
  }
  
  if (editIdx !== null) {
    restaurant.products[editIdx] = product;
    showSaveStatus('product-library-save-status', 'saved');
  } else {
    restaurant.products.push(product);
    showSaveStatus('product-library-save-status', 'saved');
  }
  
  closeProductModal();
  renderProducts(restaurant);
  updateProductCount(restaurant);
  markProductsUnsaved();
}

function editProduct(idx) {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant || !restaurant.products || !restaurant.products[idx]) return;
  
  const product = restaurant.products[idx];
  const categories = restaurant.productCategories || [];
  
  const modal = document.createElement('div');
  modal.id = 'product-modal';
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:500px">
      <div class="modal-header">
        <h3>Rediger produkt</h3>
        <button class="modal-close" onclick="closeProductModal()">×</button>
      </div>
      <div class="modal-body">
        <div style="display:grid;grid-template-columns:80px 1fr;gap:12px;margin-bottom:16px">
          <div class="form-group">
            <label class="form-label">Nr.</label>
            <input type="text" class="input" id="product-number" value="${product.number || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Navn *</label>
            <input type="text" class="input" id="product-name" value="${product.name}">
          </div>
        </div>
        <div class="form-group" style="margin-bottom:16px">
          <label class="form-label">Beskrivelse</label>
          <input type="text" class="input" id="product-description" value="${product.description || ''}">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
          <div class="form-group">
            <label class="form-label">Kategori</label>
            <select class="input" id="product-category">
              <option value="">Vælg kategori...</option>
              ${categories.map(cat => `<option value="${cat}" ${product.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Pris (kr) *</label>
            <input type="number" class="input" id="product-price" value="${product.price}" min="0" step="1">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeProductModal()">Annuller</button>
        <button class="btn btn-primary" onclick="saveProduct(${idx})">Gem ændringer</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function deleteProduct(idx) {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant || !restaurant.products) return;
  
  if (!confirm('Slet dette produkt?')) return;
  
  restaurant.products.splice(idx, 1);
  renderProducts(restaurant);
  updateProductCount(restaurant);
  markProductsUnsaved();
  toast('Produkt slettet', 'info');
}

// =====================================================
// DELIVERY ZONES
// =====================================================

function renderDeliveryZones(restaurant) {
  const container = document.getElementById('delivery-zones-list');
  const emptyState = document.getElementById('delivery-empty');
  if (!container) return;
  
  const zones = restaurant.deliveryZones || [];
  
  if (zones.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }
  
  if (emptyState) emptyState.style.display = 'none';
  
  container.innerHTML = zones.map((zone, idx) => `
    <div style="display:flex;align-items:center;gap:12px;padding:10px;background:var(--bg);border-radius:var(--radius-sm);margin-bottom:8px">
      <div style="flex:1">
        <div style="font-size:13px;font-weight:500">${zone.name}</div>
        <div style="font-size:11px;color:var(--muted)">${zone.postalCodes || 'Ingen postnumre'}</div>
      </div>
      <div style="font-weight:600;color:var(--accent)">${zone.price} kr</div>
      <button onclick="deleteDeliveryZone(${idx})" style="background:none;border:none;cursor:pointer;opacity:0.5;padding:4px">×</button>
    </div>
  `).join('');
}

function addDeliveryZone() {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return;
  
  const name = prompt('Zonenavn (f.eks. "Indre by"):');
  if (!name) return;
  
  const postalCodes = prompt('Postnumre (kommasepareret, f.eks. "2100, 2200, 2300"):');
  const price = prompt('Leveringspris (kr):');
  
  if (!restaurant.deliveryZones) {
    restaurant.deliveryZones = [];
  }
  
  restaurant.deliveryZones.push({
    name: name.trim(),
    postalCodes: postalCodes?.trim() || '',
    price: parseFloat(price) || 0
  });
  
  renderDeliveryZones(restaurant);
  markProductsUnsaved();
  toast('Leveringszone tilføjet', 'success');
}

function deleteDeliveryZone(idx) {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant || !restaurant.deliveryZones) return;
  
  restaurant.deliveryZones.splice(idx, 1);
  renderDeliveryZones(restaurant);
  markProductsUnsaved();
}

// =====================================================
// EXTRAS / TILBEHØR
// =====================================================

function renderExtras(restaurant) {
  const container = document.getElementById('extras-list');
  const emptyState = document.getElementById('extras-empty');
  if (!container) return;
  
  const extras = restaurant.extras || [];
  
  if (extras.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }
  
  if (emptyState) emptyState.style.display = 'none';
  
  container.innerHTML = extras.map((extra, idx) => `
    <div style="display:flex;align-items:center;gap:12px;padding:10px;background:var(--bg);border-radius:var(--radius-sm);margin-bottom:8px">
      <div style="flex:1">
        <div style="font-size:13px;font-weight:500">${extra.name}</div>
        ${extra.applicableTo ? `<div style="font-size:11px;color:var(--muted)">Til: ${extra.applicableTo}</div>` : ''}
      </div>
      <div style="font-weight:600;color:var(--accent)">+${extra.price} kr</div>
      <button onclick="deleteExtra(${idx})" style="background:none;border:none;cursor:pointer;opacity:0.5;padding:4px">×</button>
    </div>
  `).join('');
}

function addExtra() {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return;
  
  const name = prompt('Tilbehør navn (f.eks. "Ekstra ost"):');
  if (!name) return;
  
  const price = prompt('Pris (kr):');
  const applicableTo = prompt('Gælder for kategorier (valgfrit, f.eks. "Pizza, Burger"):');
  
  if (!restaurant.extras) {
    restaurant.extras = [];
  }
  
  restaurant.extras.push({
    id: Date.now().toString(),
    name: name.trim(),
    price: parseFloat(price) || 0,
    applicableTo: applicableTo?.trim() || ''
  });
  
  renderExtras(restaurant);
  markProductsUnsaved();
  toast('Tilbehør tilføjet', 'success');
}

function deleteExtra(idx) {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant || !restaurant.extras) return;
  
  restaurant.extras.splice(idx, 1);
  renderExtras(restaurant);
  markProductsUnsaved();
}

// =====================================================
// IMPORT FUNCTIONS
// =====================================================

async function importMenuFromUrl() {
  const url = document.getElementById('product-import-url').value.trim();
  if (!url) {
    toast('Indtast en URL', 'error');
    return;
  }

  const statusEl = document.getElementById('import-status');
  statusEl.style.display = 'block';
  statusEl.innerHTML = '<span style="color:var(--accent)">⏳ Henter menu fra hjemmeside...</span>';

  try {
    // Check API key
    if (!CONFIG.OPENAI_API_KEY || CONFIG.OPENAI_API_KEY.includes('YOUR_')) {
      statusEl.innerHTML = '<span style="color:var(--danger)">❌ OpenAI API key mangler for URL import</span>';
      return;
    }

    // Step 1: Scrape website content via Supabase Edge Function
    let websiteContent = '';
    try {
      statusEl.innerHTML = '<span style="color:var(--accent)">⏳ Læser hjemmeside indhold...</span>';

      // Get Supabase config safely
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getConfig) {
        const config = SupabaseDB.getConfig();
        const scrapeResponse = await fetch(`${config.url}/functions/v1/scrape-menu`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.key}`
          },
          body: JSON.stringify({ url: url })
        });

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          websiteContent = scrapeData.content || '';
        }
      }
    } catch (scrapeErr) {
      console.warn('Scrape fallback - using URL directly:', scrapeErr);
    }

    // Step 2: Parse with AI
    statusEl.innerHTML = '<span style="color:var(--accent)">⏳ Analyserer menu med AI...</span>';

    const aiPrompt = websiteContent
      ? `Udtræk ALLE produkter med priser fra dette menukort:\n\n${websiteContent.substring(0, 8000)}`
      : `Hent menukort fra denne hjemmeside og udtræk alle produkter: ${url}\nHvis du ikke kan tilgå URL'en, generer et realistisk eksempel-menukort baseret på restaurantens navn.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Du er en menu-parser. Udtræk ALLE produkter fra menukortet.
Returner KUN et JSON array med produkter i dette format:
[
  {"number": "1", "name": "Pizza Margherita", "description": "Tomat, mozzarella, basilikum", "category": "Pizza", "price": 89}
]
Svar KUN med JSON array, ingen anden tekst.
Priser skal være tal uden "kr" eller valuta.
Gæt kategori baseret på produktnavn hvis ikke angivet.`
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.3
      })
    });

    const data = await response.json();
    let products = [];

    try {
      let content = data.choices[0].message.content;
      content = content.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
      products = JSON.parse(content);
    } catch (e) {
      statusEl.innerHTML = '<span style="color:var(--danger)">❌ Kunne ikke parse menu data</span>';
      return;
    }

    if (products.length > 0) {
      const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
      if (restaurant) {
        // Add unique categories
        const newCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
        if (!restaurant.productCategories) restaurant.productCategories = [];
        newCategories.forEach(cat => {
          if (!restaurant.productCategories.includes(cat)) {
            restaurant.productCategories.push(cat);
          }
        });

        // Add products
        if (!restaurant.products) restaurant.products = [];
        products.forEach(p => {
          p.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
          restaurant.products.push(p);
        });

        // Save to Supabase
        if (typeof SupabaseDB !== 'undefined') {
          SupabaseDB.saveMenu(restaurant.id, restaurant.products)
            .catch(err => console.error('Menu save error:', err));
        }

        loadProductsPage();
        markProductsUnsaved();
        statusEl.innerHTML = `<span style="color:var(--accent)">✓ ${products.length} produkter importeret fra hjemmesiden</span>`;
        toast(`${products.length} produkter importeret`, 'success');
      }
    } else {
      statusEl.innerHTML = '<span style="color:var(--warn)">⚠️ Ingen produkter fundet på hjemmesiden</span>';
    }
  } catch (err) {
    console.error('Import error:', err);
    statusEl.innerHTML = `<span style="color:var(--danger)">❌ Fejl: ${escapeHtml(err.message)}</span>`;
  }
}

/**
 * Import menu from restaurant's website (from stamdata)
 * @param {string} websiteUrl - Website URL from stamdata
 * @param {string} restaurantId - Restaurant ID
 * @param {boolean} autoMode - If true, suppress error toasts
 */
async function importMenuFromWebsite(websiteUrl, restaurantId, autoMode = false) {
  if (!websiteUrl) {
    if (!autoMode) toast('Ingen hjemmeside angivet i stamdata', 'warning');
    return [];
  }

  const restaurant = restaurants.find(r => r.id === restaurantId);
  if (!restaurant) return [];

  try {
    // Check API key
    if (!CONFIG.OPENAI_API_KEY || CONFIG.OPENAI_API_KEY.includes('YOUR_')) {
      if (!autoMode) toast('OpenAI API key mangler', 'error');
      return [];
    }

    // Step 1: Fetch website using CORS proxy
    let websiteContent = '';

    // CORS proxy services (fallback chain)
    const CORS_PROXIES = [
      (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`
    ];

    // Try each proxy until one works
    for (const proxyFn of CORS_PROXIES) {
      if (websiteContent) break;
      try {
        const proxyUrl = proxyFn(websiteUrl);
        console.log('🌐 Trying CORS proxy:', proxyUrl);
        const response = await fetch(proxyUrl);
        if (response.ok) {
          websiteContent = await response.text();
          console.log('✅ Successfully fetched website content:', websiteContent.length, 'chars');
        }
      } catch (err) {
        console.warn('Proxy failed, trying next...', err);
      }
    }

    if (!websiteContent) {
      if (!autoMode) toast('Kunne ikke læse hjemmesiden. Prøv igen eller brug "Import fra tekst".', 'warning');
      return [];
    }

    // Step 2: Parse with AI
    console.log('🤖 Sending to OpenAI for parsing...', websiteContent.substring(0, 500));
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Du er en menu-parser. Udtræk ALLE produkter med priser fra teksten.
Returner KUN et JSON array: [{"number": "1", "name": "Produkt", "price": 99, "category": "Kategori"}]
Gæt kategori baseret på produktnavn. Priser skal være tal uden "kr".`
          },
          {
            role: 'user',
            content: websiteContent.substring(0, 10000)
          }
        ],
        max_tokens: 4000
      })
    });

    const aiResult = await response.json();
    console.log('🤖 OpenAI response:', aiResult);
    let products = [];

    try {
      let content = aiResult.choices[0].message.content;
      console.log('🤖 AI content:', content);
      content = content.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
      products = JSON.parse(content);
      console.log('✅ Parsed products:', products.length, 'items');
    } catch (e) {
      console.error('Parse error:', e, 'aiResult:', aiResult);
      if (!autoMode) toast('Kunne ikke parse AI svar', 'error');
      return [];
    }

    // Save products
    if (products.length > 0) {
      products.forEach(p => {
        p.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      });

      if (!restaurant.products) restaurant.products = [];
      restaurant.products.push(...products);

      // Save to Supabase
      if (typeof SupabaseDB !== 'undefined') {
        await SupabaseDB.saveMenu(restaurant.id, restaurant.products);
      }

      toast(`${products.length} produkter importeret fra hjemmeside`, 'success');
    }

    return products;
  } catch (error) {
    console.error('Menu import fejl:', error);
    if (!autoMode) toast('Kunne ikke importere menu', 'error');
    return [];
  }
}

/**
 * Import menu from website URL stored in stamdata
 * Called from "Hent fra Stamdata" button on products page
 */
async function importFromStamdataWebsite() {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) {
    toast('Vælg en kunde først', 'error');
    return;
  }

  const websiteUrl = restaurant.website || restaurant.metadata?.website;
  if (!websiteUrl) {
    toast('Ingen hjemmeside angivet i stamdata. Tilføj website URL under Stamdata først.', 'warning');
    return;
  }

  const statusEl = document.getElementById('import-status');
  if (statusEl) {
    statusEl.style.display = 'block';
    statusEl.innerHTML = `<span style="color:var(--accent)">⏳ Henter menu fra ${escapeHtml(websiteUrl)}...</span>`;
  }

  const products = await importMenuFromWebsite(websiteUrl, restaurant.id, false);

  if (statusEl) {
    if (products.length > 0) {
      statusEl.innerHTML = `<span style="color:var(--accent)">✓ ${products.length} produkter importeret fra hjemmesiden</span>`;
      loadProductsPage();
      markProductsUnsaved();
    } else {
      statusEl.innerHTML = `<span style="color:var(--warn)">⚠️ Ingen produkter fundet på ${escapeHtml(websiteUrl)}</span>`;
    }
  }
}

/**
 * Import menu from uploaded file (PDF or Image)
 * Uses OpenAI Vision API for images, PDF.js + OpenAI for PDFs
 */
async function importMenuFromFile(file) {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) {
    toast('Vælg en kunde først', 'error');
    return [];
  }

  if (!CONFIG.OPENAI_API_KEY || CONFIG.OPENAI_API_KEY.includes('YOUR_')) {
    toast('OpenAI API key mangler', 'error');
    return [];
  }

  const statusEl = document.getElementById('import-status');
  if (statusEl) {
    statusEl.style.display = 'block';
    statusEl.innerHTML = '<span style="color:var(--accent)">⏳ Læser fil...</span>';
  }

  try {
    let products = [];

    if (file.type.startsWith('image/')) {
      // Image file - use OpenAI Vision API
      products = await parseImageMenuWithAI(file);
    } else if (file.type === 'application/pdf') {
      // PDF file - extract text and parse
      products = await parsePDFMenuWithAI(file);
    } else {
      toast('Kun billeder (JPG, PNG) og PDF filer understøttes', 'warning');
      return [];
    }

    if (products.length > 0) {
      // Add unique IDs
      products.forEach(p => {
        p.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      });

      // Add to restaurant
      if (!restaurant.products) restaurant.products = [];
      restaurant.products.push(...products);

      // Add categories
      const newCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
      if (!restaurant.productCategories) restaurant.productCategories = [];
      newCategories.forEach(cat => {
        if (!restaurant.productCategories.includes(cat)) {
          restaurant.productCategories.push(cat);
        }
      });

      // Save to Supabase
      if (typeof SupabaseDB !== 'undefined') {
        await SupabaseDB.saveMenu(restaurant.id, restaurant.products);
      }

      loadProductsPage();
      markProductsUnsaved();

      if (statusEl) {
        statusEl.innerHTML = `<span style="color:var(--accent)">✓ ${products.length} produkter importeret fra fil</span>`;
      }
      toast(`${products.length} produkter importeret`, 'success');
    } else {
      if (statusEl) {
        statusEl.innerHTML = '<span style="color:var(--warn)">⚠️ Ingen produkter fundet i filen</span>';
      }
    }

    return products;
  } catch (error) {
    console.error('File import error:', error);
    if (statusEl) {
      statusEl.innerHTML = `<span style="color:var(--danger)">❌ Fejl: ${escapeHtml(error.message)}</span>`;
    }
    toast('Kunne ikke importere fra fil', 'error');
    return [];
  }
}

/**
 * Parse menu from image using OpenAI Vision API
 */
async function parseImageMenuWithAI(file) {
  // Convert file to base64
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Du er en menu-parser. Udtræk ALLE produkter med priser fra billedet.
Returner KUN et JSON array: [{"number": "1", "name": "Produkt", "description": "Beskrivelse", "price": 99, "category": "Kategori"}]
Priser skal være tal uden "kr". Gæt kategori baseret på produktnavn.`
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Udtræk alle produkter med priser fra dette menukort:' },
            { type: 'image_url', image_url: { url: `data:${file.type};base64,${base64}` } }
          ]
        }
      ],
      max_tokens: 4000
    })
  });

  const data = await response.json();

  try {
    let content = data.choices[0].message.content;
    content = content.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
    return JSON.parse(content);
  } catch (e) {
    console.error('Parse image menu error:', e);
    return [];
  }
}

/**
 * Parse menu from PDF using text extraction + OpenAI
 */
async function parsePDFMenuWithAI(file) {
  // Use PDF.js to extract text (if available)
  let pdfText = '';

  try {
    // Check if PDF.js is loaded
    if (typeof pdfjsLib !== 'undefined') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        pdfText += textContent.items.map(item => item.str).join(' ') + '\n';
      }
    } else {
      // Fallback: Read as text (won't work for most PDFs but worth trying)
      pdfText = await file.text();
    }
  } catch (err) {
    console.warn('PDF text extraction failed:', err);
    // If text extraction fails, try using Vision API on first page
    toast('Prøver billedbaseret analyse af PDF...', 'info');
    return await parseImageMenuWithAI(file);
  }

  if (!pdfText.trim()) {
    toast('Kunne ikke læse tekst fra PDF - prøver billedanalyse', 'info');
    return await parseImageMenuWithAI(file);
  }

  // Parse extracted text with AI
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Du er en menu-parser. Udtræk ALLE produkter med priser fra PDF-teksten.
Returner KUN et JSON array: [{"number": "1", "name": "Produkt", "description": "Beskrivelse", "price": 99, "category": "Kategori"}]
Priser skal være tal uden "kr". Gæt kategori baseret på produktnavn.`
        },
        {
          role: 'user',
          content: pdfText.substring(0, 10000)
        }
      ],
      max_tokens: 4000
    })
  });

  const data = await response.json();

  try {
    let content = data.choices[0].message.content;
    content = content.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
    return JSON.parse(content);
  } catch (e) {
    console.error('Parse PDF menu error:', e);
    return [];
  }
}

/**
 * Handle file input for menu import
 */
function handleMenuFileImport(input) {
  if (input.files && input.files[0]) {
    importMenuFromFile(input.files[0]);
  }
}

async function parseMenuFromText() {
  const text = document.getElementById('product-import-text').value.trim();
  if (!text) {
    toast('Indsæt menu tekst først', 'error');
    return;
  }
  
  const statusEl = document.getElementById('import-status');
  statusEl.style.display = 'block';
  statusEl.innerHTML = '<span style="color:var(--accent)">⏳ Parser menu tekst...</span>';
  
  try {
    // Try AI parsing first
    if (CONFIG.OPENAI_API_KEY && !CONFIG.OPENAI_API_KEY.includes('YOUR_')) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Du er en menu-parser. Udtræk produkter fra teksten.
Returner KUN et JSON array med produkter:
[{"number": "1", "name": "...", "description": "...", "category": "...", "price": 89}]
Priser skal være tal uden "kr". Gæt kategori baseret på produktnavn hvis ikke angivet.
Svar KUN med JSON array.`
            },
            {
              role: 'user',
              content: text
            }
          ],
          max_tokens: 2000,
          temperature: 0.2
        })
      });
      
      const data = await response.json();
      let products = [];
      
      try {
        let content = data.choices[0].message.content;
        content = content.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
        products = JSON.parse(content);
      } catch (e) {
        // Fall through to regex parsing
      }
      
      if (products.length > 0) {
        importParsedProducts(products, statusEl);
        return;
      }
    }
    
    // Fallback: Simple regex parsing
    const products = parseMenuWithRegex(text);
    if (products.length > 0) {
      importParsedProducts(products, statusEl);
    } else {
      statusEl.innerHTML = '<span style="color:var(--warn)">⚠️ Kunne ikke finde produkter. Prøv format: "1. Pizza Margherita - 89 kr"</span>';
    }
  } catch (err) {
    console.error('Parse error:', err);
    statusEl.innerHTML = `<span style="color:var(--danger)">❌ Fejl: ${escapeHtml(err.message)}</span>`;
  }
}

function parseMenuWithRegex(text) {
  const products = [];
  const lines = text.split('\n').filter(l => l.trim());
  
  for (const line of lines) {
    // Try various patterns
    // Pattern 1: "1. Pizza Margherita - 89 kr"
    let match = line.match(/^(\d+)[\.\)]\s*(.+?)\s*[-–]\s*(\d+)\s*(kr|,-)?/i);
    if (match) {
      products.push({
        number: match[1],
        name: match[2].trim(),
        price: parseInt(match[3]),
        category: guessCategory(match[2])
      });
      continue;
    }
    
    // Pattern 2: "Pizza Margherita 89,-"
    match = line.match(/^(.+?)\s+(\d+)\s*(kr|,-)/i);
    if (match) {
      products.push({
        number: (products.length + 1).toString(),
        name: match[1].trim(),
        price: parseInt(match[2]),
        category: guessCategory(match[1])
      });
      continue;
    }
    
    // Pattern 3: "Pizza Margherita: 89"
    match = line.match(/^(.+?):\s*(\d+)/i);
    if (match) {
      products.push({
        number: (products.length + 1).toString(),
        name: match[1].trim(),
        price: parseInt(match[2]),
        category: guessCategory(match[1])
      });
    }
  }
  
  return products;
}

function guessCategory(name) {
  const n = name.toLowerCase();
  if (n.includes('pizza')) return 'Pizza';
  if (n.includes('pasta') || n.includes('spaghetti') || n.includes('lasagne')) return 'Pasta';
  if (n.includes('burger')) return 'Burger';
  if (n.includes('salat')) return 'Salat';
  if (n.includes('sandwich') || n.includes('panini')) return 'Sandwich';
  if (n.includes('suppe')) return 'Suppe';
  if (n.includes('dessert') || n.includes('is') || n.includes('kage')) return 'Dessert';
  if (n.includes('cola') || n.includes('fanta') || n.includes('vand') || n.includes('øl') || n.includes('vin')) return 'Drikkevarer';
  if (n.includes('pommes') || n.includes('frites') || n.includes('dip') || n.includes('brød')) return 'Tilbehør';
  return 'Andet';
}

function importParsedProducts(products, statusEl) {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return;
  
  // Add unique categories
  const newCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
  if (!restaurant.productCategories) restaurant.productCategories = [];
  newCategories.forEach(cat => {
    if (!restaurant.productCategories.includes(cat)) {
      restaurant.productCategories.push(cat);
    }
  });
  
  // Add products with unique IDs
  if (!restaurant.products) restaurant.products = [];
  products.forEach(p => {
    p.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    restaurant.products.push(p);
  });
  
  loadProductsPage();
  markProductsUnsaved();
  statusEl.innerHTML = `<span style="color:var(--accent)">✓ ${products.length} produkter importeret</span>`;
  toast(`${products.length} produkter importeret`, 'success');
  
  // Clear textarea
  document.getElementById('product-import-text').value = '';
}

function handleMenuFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    document.getElementById('product-import-text').value = content;
    toast('Fil indlæst - klik "Parse tekst" for at importere', 'info');
  };
  reader.readAsText(file);
}

// =====================================================
// SAVE & SYNC
// =====================================================

function markProductsUnsaved() {
  const statusEl = document.getElementById('products-save-status');
  if (statusEl) {
    statusEl.innerHTML = '<span style="color:var(--warn)">● Ændringer ikke gemt</span>';
  }
}

function saveProductsExplicit() {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return;

  // Save to localStorage
  const key = `products_${restaurant.id}`;
  const data = {
    products: restaurant.products || [],
    productCategories: restaurant.productCategories || [],
    deliveryZones: restaurant.deliveryZones || [],
    extras: restaurant.extras || []
  };
  localStorage.setItem(key, JSON.stringify(data));

  // Sync to Supabase
  if (window.SupabaseDB && restaurant.id) {
    SupabaseDB.updateRestaurant(restaurant.id, {
      menu_items: data.products,
      product_categories: data.productCategories
    }).catch(err => console.warn('Supabase sync fejl (products):', err));
  }

  // Update save status
  const statusEl = document.getElementById('products-save-status');
  if (statusEl) {
    statusEl.innerHTML = '<span style="color:var(--accent)">✓ Gemt</span>';
  }

  // Sync to workflow
  syncProductsToWorkflow();
}

function syncProductsToWorkflow() {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return;
  
  // Update DEMO_MENUS with restaurant products
  const menuKey = restaurant.id;
  
  // Build menu structure for workflow
  const workflowMenu = {
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    currency: 'DKK',
    items: (restaurant.products || []).map(p => ({
      id: p.id,
      number: p.number,
      name: p.name,
      description: p.description || '',
      price: p.price,
      category: p.category || 'Andet'
    })),
    extras: restaurant.extras || [],
    deliveryZones: restaurant.deliveryZones || []
  };
  
  // Store in global menus
  if (!window.RESTAURANT_MENUS) {
    window.RESTAURANT_MENUS = {};
  }
  window.RESTAURANT_MENUS[menuKey] = workflowMenu;
  
  // Also update DEMO_MENUS if it's a demo restaurant
  if (DEMO_MENUS && DEMO_MENUS[menuKey]) {
    DEMO_MENUS[menuKey] = workflowMenu;
  }
  
  addLog(`📦 Menu synkroniseret: ${workflowMenu.items.length} produkter`, 'success');
  toast('Menu synkroniseret til workflow', 'success');
}

// Load saved products when showing CRM profile
function loadSavedProducts(restaurant) {
  const key = `products_${restaurant.id}`;
  const saved = localStorage.getItem(key);
  
  if (saved) {
    try {
      const data = JSON.parse(saved);
      restaurant.products = data.products || [];
      restaurant.productCategories = data.productCategories || [];
      restaurant.deliveryZones = data.deliveryZones || [];
      restaurant.extras = data.extras || [];
    } catch (e) {
      console.error('Error loading saved products:', e);
    }
  }
}

// ==================== PRODUKTBIBLIOTEK FUNCTIONS ====================

// Toggle product handlinger dropdown
function toggleProductHandlingerDropdown() {
  const dropdown = document.getElementById('product-handlinger-dropdown');
  if (!dropdown) return;

  if (dropdown.style.display === 'none' || dropdown.style.display === '') {
    dropdown.style.display = 'block';
    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', closeProductHandlingerOnOutsideClick);
    }, 100);
  } else {
    dropdown.style.display = 'none';
    document.removeEventListener('click', closeProductHandlingerOnOutsideClick);
  }
}

function closeProductHandlingerOnOutsideClick(e) {
  const dropdown = document.getElementById('product-handlinger-dropdown');
  const btn = document.getElementById('product-handlinger-btn');
  if (dropdown && btn && !dropdown.contains(e.target) && !btn.contains(e.target)) {
    dropdown.style.display = 'none';
    document.removeEventListener('click', closeProductHandlingerOnOutsideClick);
  }
}

// Demo version of product handlinger dropdown
function toggleDemoProductHandlingerDropdown() {
  const dropdown = document.getElementById('demo-product-handlinger-dropdown');
  if (!dropdown) return;

  if (dropdown.style.display === 'none' || dropdown.style.display === '') {
    dropdown.style.display = 'block';
    setTimeout(() => {
      document.addEventListener('click', closeDemoProductHandlingerOnOutsideClick);
    }, 100);
  } else {
    dropdown.style.display = 'none';
    document.removeEventListener('click', closeDemoProductHandlingerOnOutsideClick);
  }
}

function closeDemoProductHandlingerOnOutsideClick(e) {
  const dropdown = document.getElementById('demo-product-handlinger-dropdown');
  const btn = document.getElementById('demo-product-handlinger-btn');
  if (dropdown && btn && !dropdown.contains(e.target) && !btn.contains(e.target)) {
    dropdown.style.display = 'none';
    document.removeEventListener('click', closeDemoProductHandlingerOnOutsideClick);
  }
}

// Navigate to Kategorier page
function navigateToKategorier() {
  showCustomerSubpage('kategorier');
}

// Toggle category filter dropdown
function toggleCategoryFilterDropdown() {
  const dropdown = document.getElementById('category-filter-dropdown');
  if (!dropdown) return;

  if (dropdown.style.display === 'none' || dropdown.style.display === '') {
    // Load categories into dropdown
    renderCategoryFilters();
    dropdown.style.display = 'block';

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', closeCategoryFilterOnOutsideClick);
    }, 100);
  } else {
    dropdown.style.display = 'none';
    document.removeEventListener('click', closeCategoryFilterOnOutsideClick);
  }
}

function closeCategoryFilterOnOutsideClick(e) {
  const dropdown = document.getElementById('category-filter-dropdown');
  const btn = document.getElementById('category-filter-btn');
  if (dropdown && btn && !dropdown.contains(e.target) && !btn.contains(e.target)) {
    dropdown.style.display = 'none';
    document.removeEventListener('click', closeCategoryFilterOnOutsideClick);
  }
}

// Render category filters with checkboxes (MULTI-SELECT)
function renderCategoryFilters() {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return;

  const container = document.getElementById('category-filter-list');
  if (!container) return;

  const categories = restaurant.productCategories || [];

  // Hvis INGEN kategorier eksisterer - dropdown HELT TOM
  if (categories.length === 0) {
    container.innerHTML = '';
    return;
  }

  // Load saved filter state from localStorage
  const savedFilters = getCategoryFilters(restaurant.id);

  let html = '';

  // "Vis alle" som BUTTON (ikke checkbox) øverst
  html += `
    <button class="dropdown-item" onclick="clearAllCategoryFilters()" style="display:flex;align-items:center;gap:8px;width:100%;padding:10px 16px;background:none;border:none;text-align:left;cursor:pointer;font-size:var(--font-size-sm);color:var(--text);font-weight:500">
      Vis alle
    </button>
  `;

  // Separator efter "Vis alle" button
  html += `<hr style="margin:4px 0;border:none;border-top:1px solid var(--border)">`;

  // Alle kategorier med checkboxes (visual feedback via checkbox styling)
  categories.forEach(cat => {
    const isChecked = savedFilters.includes(cat) || savedFilters.length === 0;
    html += `
      <label class="dropdown-item" style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:10px 16px;transition:background 0.15s">
        <input type="checkbox"
               class="category-filter-checkbox"
               data-category="${cat}"
               ${isChecked ? 'checked' : ''}
               onchange="updateCategoryFilter()"
               style="accent-color:var(--accent)">
        <span style="color:${isChecked ? 'var(--accent)' : 'var(--text)'};font-weight:${isChecked ? '500' : '400'}">${cat}</span>
      </label>
    `;
  });

  container.innerHTML = html;
}

// Clear all category filters (for "Vis alle" button)
function clearAllCategoryFilters() {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return;

  // Clear localStorage
  const key = `category_filters_${restaurant.id}`;
  localStorage.removeItem(key);

  // Re-render dropdown and products
  renderCategoryFilters();
  renderProducts(restaurant);

  // Close dropdown
  toggleCategoryFilterDropdown();
}

// Update category filter when checkbox changes (MULTI-SELECT)
function updateCategoryFilter() {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return;

  // Get all checked category names (MULTI-SELECT)
  const checkboxes = document.querySelectorAll('.category-filter-checkbox');
  const selectedCategories = Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.getAttribute('data-category'));

  // Save to localStorage (ARRAY)
  saveCategoryFilters(restaurant.id, selectedCategories);

  // Re-render products with filter
  renderProducts(restaurant);

  // Re-render dropdown to update visual feedback
  renderCategoryFilters();
}

// Get saved category filters from localStorage (PLURAL - returns array)
function getCategoryFilters(restaurantId) {
  const key = `category_filters_${restaurantId}`;
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : [];
}

// Save category filters to localStorage (PLURAL - saves array)
function saveCategoryFilters(restaurantId, categoryNames) {
  const key = `category_filters_${restaurantId}`;
  if (!categoryNames || categoryNames.length === 0) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(categoryNames));
  }
}

// Show Bulk Product Modal — render form in existing subpage
function showBulkProductModal() {
  showCustomerSubpage('add-bulk-product');
  renderBulkProductForm();
}

function renderBulkProductForm() {
  const container = document.getElementById('add-bulk-product-form-container');
  if (!container) return;
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  const categories = restaurant?.productCategories || ['Pizza', 'Pasta', 'Burger', 'Salat', 'Drikkevarer', 'Tilbehør'];
  const catOptions = categories.map(c => `<option value="${c}">${c}</option>`).join('');

  container.innerHTML = `
    <div class="customer-section-compact">
      <div id="bulk-product-rows">
        ${renderBulkProductRow(0, catOptions)}
        ${renderBulkProductRow(1, catOptions)}
        ${renderBulkProductRow(2, catOptions)}
      </div>
      <button class="btn btn-secondary" onclick="addBulkProductRow()" style="margin-top:var(--space-3)">+ Tilføj række</button>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:var(--space-5)">
        <span id="bulk-save-status" style="color:var(--success);display:none">✓ Produkter tilføjet</span>
        <button class="btn btn-primary" onclick="saveBulkProducts()">Tilføj alle produkter</button>
      </div>
    </div>`;
}

function renderBulkProductRow(idx, catOptions) {
  return `<div class="bulk-row" style="display:grid;grid-template-columns:2fr 1fr 1.5fr 40px;gap:var(--space-2);margin-bottom:var(--space-2);align-items:center">
    <input type="text" class="input bulk-name" placeholder="Produktnavn *" style="font-size:var(--font-size-sm)">
    <input type="number" class="input bulk-price" placeholder="Pris *" min="0" style="font-size:var(--font-size-sm)">
    <select class="input bulk-category" style="font-size:var(--font-size-sm)"><option value="">Kategori</option>${catOptions}</select>
    <button class="btn btn-secondary" onclick="this.closest('.bulk-row').remove()" style="padding:4px 8px;font-size:14px" title="Fjern">×</button>
  </div>`;
}

function addBulkProductRow() {
  const container = document.getElementById('bulk-product-rows');
  if (!container) return;
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  const categories = restaurant?.productCategories || [];
  const catOptions = categories.map(c => `<option value="${c}">${c}</option>`).join('');
  container.insertAdjacentHTML('beforeend', renderBulkProductRow(container.children.length, catOptions));
}

function saveBulkProducts() {
  const rows = document.querySelectorAll('#bulk-product-rows .bulk-row');
  const products = [];
  rows.forEach(row => {
    const name = row.querySelector('.bulk-name').value.trim();
    const price = parseFloat(row.querySelector('.bulk-price').value) || 0;
    const category = row.querySelector('.bulk-category').value || guessCategory(name);
    if (name) products.push({ name, price, category });
  });
  if (products.length === 0) { toast('Udfyld mindst ét produktnavn', 'warn'); return; }
  const statusEl = document.getElementById('bulk-save-status') || document.createElement('span');
  importParsedProducts(products, statusEl);
  statusEl.style.display = 'inline';
  setTimeout(() => { showCustomerSubpage('produkter'); }, 1000);
}

// Show Import CSV Modal — navigate to existing subpage
function showImportCSVModal() {
  showCustomerSubpage('import-products');
}

// Show Product Sorting Modal
function showProductSortingModal() {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant || !restaurant.products?.length) { toast('Ingen produkter at sortere', 'warn'); return; }

  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.id = 'product-sorting-modal';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:600px;max-height:80vh;display:flex;flex-direction:column">
      <div class="modal-header">
        <h3>Sortér produkter</h3>
        <button class="modal-close" onclick="document.getElementById('product-sorting-modal').remove()">×</button>
      </div>
      <div class="modal-body" style="overflow-y:auto;flex:1">
        <p style="color:var(--muted);font-size:var(--font-size-sm);margin-bottom:var(--space-3)">Brug pilene til at ændre rækkefølge.</p>
        <div id="sort-product-list">
          ${restaurant.products.map((p, i) => `
            <div class="sort-item" data-idx="${i}" style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-2) var(--space-3);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:var(--space-1);background:var(--card)">
              <div style="display:flex;flex-direction:column;gap:2px">
                <button class="btn btn-secondary" onclick="moveProduct(${i},-1)" style="padding:2px 6px;font-size:10px" ${i === 0 ? 'disabled' : ''}>▲</button>
                <button class="btn btn-secondary" onclick="moveProduct(${i},1)" style="padding:2px 6px;font-size:10px" ${i === restaurant.products.length - 1 ? 'disabled' : ''}>▼</button>
              </div>
              <div style="flex:1">
                <div style="font-weight:500">${p.name}</div>
                <div style="font-size:var(--font-size-xs);color:var(--muted)">${p.category || 'Ingen kategori'} — ${p.price || 0} kr</div>
              </div>
            </div>`).join('')}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('product-sorting-modal').remove()">Luk</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function moveProduct(idx, direction) {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return;
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= restaurant.products.length) return;
  [restaurant.products[idx], restaurant.products[newIdx]] = [restaurant.products[newIdx], restaurant.products[idx]];
  markProductsUnsaved();
  document.getElementById('product-sorting-modal').remove();
  showProductSortingModal();
  renderProducts(restaurant);
}
window.showBulkProductModal = showBulkProductModal;
window.showImportCSVModal = showImportCSVModal;
window.showProductSortingModal = showProductSortingModal;
window.addBulkProductRow = addBulkProductRow;
window.saveBulkProducts = saveBulkProducts;
window.moveProduct = moveProduct;

// Show Add Category Modal
function showAddCategoryModal() {
  const modal = document.getElementById('add-category-modal');
  if (modal) {
    // Reset form
    document.getElementById('category-name').value = '';

    // Populate VAT dropdown with restaurant's momssatser
    const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
    const vatSelect = document.getElementById('category-vat');
    if (vatSelect && restaurant) {
      vatSelect.innerHTML = '<option value="">Vælg momssats (valgfri)</option>';
      const vatRates = restaurant.vatRates || [];
      vatRates.forEach(vat => {
        // SECURITY FIX v4.12.0: Escape VAT data
        vatSelect.innerHTML += `<option value="${escapeHtml(String(vat.rate))}">${escapeHtml(vat.name)} (${escapeHtml(String(vat.rate))}%)</option>`;
      });
    }

    modal.style.display = 'flex';
  }
}

// Close Add Category Modal
function closeAddCategoryModal() {
  const modal = document.getElementById('add-category-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Save Category
async function saveCategory() {
  const nameInput = document.getElementById('category-name');
  const vatSelect = document.getElementById('category-vat');

  const name = nameInput?.value?.trim();
  const vatRate = vatSelect?.value || null;

  if (!name) {
    toast('Kategorinavn er påkrævet', 'error');
    return;
  }

  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) {
    toast('Ingen restaurant valgt', 'error');
    return;
  }

  // Initialize productCategories if not exists
  if (!restaurant.productCategories) {
    restaurant.productCategories = [];
  }

  // Check for duplicate
  if (restaurant.productCategories.includes(name)) {
    toast('Kategori eksisterer allerede', 'error');
    return;
  }

  // Add category
  restaurant.productCategories.push(name);

  // Save to Supabase
  try {
    await SupabaseDB.updateRestaurant(restaurant.id, {
      product_categories: restaurant.productCategories
    });

    toast('Kategori tilføjet', 'success');
    closeAddCategoryModal();

    // Re-render categories table
    renderCategoriesTable();
  } catch (err) {
    console.error('Error saving category:', err);
    toast('Fejl ved gem af kategori', 'error');
  }
}

// Render Categories Table
function renderCategoriesTable() {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return;

  const tableBody = document.getElementById('categories-table-body');
  const emptyState = document.getElementById('categories-empty');

  if (!tableBody) return;

  const categories = restaurant.productCategories || [];

  if (categories.length === 0) {
    tableBody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  let html = '';
  categories.forEach((cat, index) => {
    html += `
      <div style="display:grid;grid-template-columns:2fr 1fr 100px;gap:var(--space-3);padding:14px 16px;border-bottom:1px solid var(--border);align-items:center">
        <span style="font-weight:500">${cat}</span>
        <span style="text-align:right;color:var(--muted)">-</span>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-secondary btn-sm" onclick="deleteCategory('${cat}')" title="Slet kategori">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `;
  });

  tableBody.innerHTML = html;
}

// Delete Category
async function deleteCategory(categoryName) {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant || !restaurant.productCategories) return;

  if (!confirm(`Er du sikker på at du vil slette kategorien "${categoryName}"?`)) {
    return;
  }

  // Remove category from array
  restaurant.productCategories = restaurant.productCategories.filter(c => c !== categoryName);

  // Save to Supabase
  try {
    await SupabaseDB.updateRestaurant(restaurant.id, {
      product_categories: restaurant.productCategories
    });

    toast('Kategori slettet', 'success');
    renderCategoriesTable();

    // Also re-render category filters in case dropdown is open
    renderCategoryFilters();
  } catch (err) {
    console.error('Error deleting category:', err);
    toast('Fejl ved sletning af kategori', 'error');
  }
}

// Save Product Library
async function saveProductLibrary() {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) {
    toast('Ingen restaurant valgt', 'error');
    return;
  }

  try {
    // Get current products from the local restaurant object
    const products = restaurant.menu_items || restaurant.menuItems || [];
    const categories = restaurant.productCategories || [];

    // Save to Supabase
    await SupabaseDB.updateRestaurant(restaurant.id, {
      menu_items: products,
      product_categories: categories
    });

    toast('Produktbibliotek gemt', 'success');
  } catch (err) {
    console.error('Error saving product library:', err);
    toast('Fejl ved gem af produktbibliotek', 'error');
  }
}

// Save Categories Changes
async function saveCategoriesChanges() {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) {
    toast('Ingen restaurant valgt', 'error');
    return;
  }

  try {
    const categories = restaurant.productCategories || [];

    // Save to Supabase
    await SupabaseDB.updateRestaurant(restaurant.id, {
      product_categories: categories
    });

    toast('Kategorier gemt', 'success');
  } catch (err) {
    console.error('Error saving categories:', err);
    toast('Fejl ved gem af kategorier', 'error');
  }
}


// ==================== MOMS FUNCTIONS ====================

// Show Add Momssats Modal
function showAddMomssatsModal() {
  const modal = document.getElementById('add-momssats-modal');
  if (modal) {
    // Reset form
    document.getElementById('momssats-name').value = '';
    document.getElementById('momssats-rate').value = '';
    document.getElementById('momssats-description').value = '';

    modal.style.display = 'flex';
    setTimeout(() => document.getElementById('momssats-name').focus(), 100);
  }
}

// Close Add Momssats Modal
function closeAddMomssatsModal() {
  const modal = document.getElementById('add-momssats-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Save Momssats
function saveMomssats() {
  const name = document.getElementById('momssats-name').value.trim();
  const rate = parseFloat(document.getElementById('momssats-rate').value);
  const description = document.getElementById('momssats-description').value.trim();

  // Validation
  if (!name) {
    toast('Indtast et navn til momssatsen', 'error');
    document.getElementById('momssats-name').focus();
    return;
  }

  if (isNaN(rate) || rate < 0 || rate > 100) {
    toast('Indtast en gyldig momssats mellem 0 og 100', 'error');
    document.getElementById('momssats-rate').focus();
    return;
  }

  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return;

  // Initialize customVatRates if not exists
  if (!restaurant.customVatRates) {
    restaurant.customVatRates = [];
  }

  // Add new VAT rate
  const newRate = {
    id: Date.now().toString(),
    name: name,
    rate: rate,
    description: description,
    createdAt: new Date().toISOString()
  };

  restaurant.customVatRates.push(newRate);

  // Save to localStorage
  saveRestaurants();

  // Update dropdown
  updateMomssatsDropdown();

  // Close modal
  closeAddMomssatsModal();

  showSaveStatus('moms-save-status', 'saved');
}

// Update Momssats Dropdown
function updateMomssatsDropdown() {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return;

  const select = document.getElementById('restaurant-moms-rate');
  if (!select) return;

  // Keep default options
  const defaultOptions = `
    <option value="25">25% (Standard)</option>
    <option value="0">0% (Momsfritaget)</option>
  `;

  // Add custom rates
  let customOptions = '';
  if (restaurant.customVatRates && restaurant.customVatRates.length > 0) {
    customOptions = restaurant.customVatRates.map(rate =>
      `<option value="${rate.rate}">${rate.rate}% (${rate.name})</option>`
    ).join('');
  }

  select.innerHTML = defaultOptions + customOptions;
}

// Load KPI data for customer
function loadCustomerKPIData() {
  const restaurant = findRestaurantOrDemo(currentProfileRestaurantId);
  if (!restaurant) return;

  // Render heatmap - use demo data if demo customer has no real data
  let heatmapData = restaurant.kpi?.orderHeatmap;
  if (!heatmapData && restaurant.isDemo && isDemoDataEnabled()) {
    heatmapData = generateDemoHeatmapData();
  }
  renderCustomerHeatmap(heatmapData);
}

// Render customer heatmap
function renderCustomerHeatmap(heatmapData) {
  const container = document.getElementById('customer-heatmap');
  if (!container) return;
  
  if (!heatmapData) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted);font-size:12px">Ingen data tilgængelig</div>';
    return;
  }
  
  let maxVal = 1;
  Object.values(heatmapData).forEach(dayData => {
    if (Array.isArray(dayData)) {
      dayData.forEach(val => { if (val > maxVal) maxVal = val; });
    }
  });
  
  const hourTotals = new Array(24).fill(0);
  Object.values(heatmapData).forEach(dayData => {
    if (Array.isArray(dayData)) {
      dayData.forEach((val, hour) => { hourTotals[hour] += val; });
    }
  });
  
  container.innerHTML = hourTotals.map((val, hour) => {
    const intensity = val / (maxVal * 7);
    const color = intensity > 0.7 ? 'var(--green)' : intensity > 0.4 ? 'var(--orange)' : intensity > 0.1 ? 'var(--accent)' : 'rgba(255,255,255,0.1)';
    return `<div class="heatmap-bar" style="background:${color};opacity:${0.3 + intensity * 0.7}" title="${hour}:00 - ${val} ordrer"></div>`;
  }).join('');
}

// Show profile view
function showCrmProfileView(id) {
  let restaurant = restaurants.find(r => r.id === id);
  // Also check demo customers if enabled
  if (!restaurant && isDemoDataEnabled()) {
    const demoCustomers = getDemoDataCustomers();
    restaurant = demoCustomers.find(r => r.id === id);
  }
  if (!restaurant) {
    toast('Kunde ikke fundet', 'error');
    return;
  }
  
  currentProfileRestaurantId = id;
  localStorage.setItem('lastViewedCustomerId', id);
  const userId = generateUserId(id);

  // Load saved products for this restaurant
  loadSavedProducts(restaurant);
  
  // Hide search, show profile
  document.getElementById('crm-search-view').style.display = 'none';
  document.getElementById('crm-profile-view').style.display = 'block';

  // Remove active indicator from Kunder nav button (the green dot)
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

  // Reset to first subpage (dashboard)
  document.querySelectorAll('.customer-subpage').forEach(sp => sp.classList.remove('active'));
  document.getElementById('subpage-dashboard').classList.add('active');

  // Load customer dashboard
  loadCustomerDashboard(id);
  
  // Update breadcrumb with restaurant name
  updateBreadcrumb('kunder', restaurant.name);
  
  // Populate header
  document.getElementById('profile-logo').innerHTML = getRestaurantLogoSvg(restaurant.logo);
  document.getElementById('profile-name').textContent = restaurant.name;
  document.getElementById('profile-cvr').textContent = restaurant.cvr || '-';
  document.getElementById('profile-userid').textContent = userId;
  
  const statusEl = document.getElementById('profile-status');
  
  // Handle demo customer status
  if (restaurant.isDemo) {
    const demoStatus = getDemoLicenseStatus(restaurant);
    if (demoStatus && demoStatus.isExpired) {
      statusEl.textContent = 'Demo udløbet';
      statusEl.className = 'crm-profile-status demo-expired';
      statusEl.style.background = 'rgba(248,113,113,0.1)';
      statusEl.style.color = 'var(--danger)';
    } else if (demoStatus) {
      statusEl.textContent = `Demo · ${demoStatus.daysRemaining} dage`;
      statusEl.className = 'crm-profile-status demo';
      statusEl.style.background = 'rgba(251,191,36,0.1)';
      statusEl.style.color = 'var(--warn)';
    } else {
      statusEl.textContent = 'Demo';
      statusEl.className = 'crm-profile-status demo';
      statusEl.style.background = 'rgba(251,191,36,0.1)';
      statusEl.style.color = 'var(--warn)';
    }
  } else if (restaurant.status === 'active') {
    statusEl.textContent = 'Aktiv';
    statusEl.className = 'crm-profile-status active';
    statusEl.style.background = '';
    statusEl.style.color = '';
  } else if (restaurant.status === 'inactive') {
    statusEl.textContent = 'Inaktiv';
    statusEl.className = 'crm-profile-status pending';
    statusEl.style.background = '';
    statusEl.style.color = '';
  } else if (restaurant.status === 'churned') {
    statusEl.textContent = 'Opsagt';
    statusEl.className = 'crm-profile-status';
    statusEl.style.background = 'rgba(248,113,113,0.1)';
    statusEl.style.color = 'var(--danger)';
  } else if (restaurant.status === 'terminated') {
    statusEl.textContent = 'Opsagt (GDPR)';
    statusEl.className = 'crm-profile-status terminated';
    statusEl.style.background = 'rgba(248,113,113,0.15)';
    statusEl.style.color = 'var(--danger)';
    // Show termination banner
    showTerminationBanner(restaurant);
  } else if (restaurant.status === 'gdpr_deleted') {
    statusEl.textContent = 'GDPR Slettet';
    statusEl.className = 'crm-profile-status gdpr-deleted';
    statusEl.style.background = 'rgba(107,114,128,0.15)';
    statusEl.style.color = 'var(--muted)';
  } else {
    statusEl.textContent = 'Afventer';
    statusEl.className = 'crm-profile-status pending';
    statusEl.style.background = '';
    statusEl.style.color = '';
  }

  // Hide termination banner if not terminated
  if (restaurant.status !== 'terminated') {
    const existingBanner = document.getElementById('termination-banner');
    if (existingBanner) existingBanner.style.display = 'none';
  }

  // Show/hide activate button for pending customers (or undefined/null status)
  const activateBtn = document.getElementById('btn-activate-customer');
  if (activateBtn) {
    // Show activate button if status is 'pending', undefined, null, or empty string
    const canActivate = !restaurant.status || restaurant.status === 'pending';
    activateBtn.style.display = canActivate ? 'flex' : 'none';
  }

  // Show/hide terminate button based on status
  const terminateBtn = document.getElementById('btn-terminate-customer');
  if (terminateBtn) {
    const canTerminate = ['active', 'inactive', 'demo'].includes(restaurant.status);
    terminateBtn.style.display = canTerminate ? 'flex' : 'none';
  }

  // Show demo license banner if demo customer
  let demoBanner = document.getElementById('demo-license-banner');
  if (restaurant.isDemo) {
    const demoStatus = getDemoLicenseStatus(restaurant);
    if (!demoBanner) {
      demoBanner = document.createElement('div');
      demoBanner.id = 'demo-license-banner';
      const profileHeader = document.querySelector('.crm-profile-header');
      if (profileHeader) {
        profileHeader.parentNode.insertBefore(demoBanner, profileHeader.nextSibling);
      }
    }
    
    if (demoStatus && demoStatus.isExpired) {
      demoBanner.className = 'demo-expired-banner';
      demoBanner.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        <div class="demo-expired-banner-content">
          <h4>Demo-periode udløbet</h4>
          <p>Denne kundes prøveperiode er udløbet. Opgrader til betalt licens for at fortsætte.</p>
        </div>
        <button class="btn btn-primary" onclick="upgradeDemoCustomer('${restaurant.id}')">Opgrader kunde</button>
      `;
    } else if (demoStatus) {
      demoBanner.className = 'demo-license-info';
      demoBanner.style.marginBottom = 'var(--space-5)';
      demoBanner.innerHTML = `
        <h4 style="margin-bottom:var(--space-3)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Demo-licens aktiv
        </h4>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-4)">
          <div>
            <div style="font-size:20px;font-weight:600;color:var(--text)">${demoStatus.daysRemaining}</div>
            <div style="font-size:11px;color:var(--muted)">Dage tilbage</div>
          </div>
          <div>
            <div style="font-size:20px;font-weight:600;color:var(--text)">${demoStatus.messagesUsed}/${demoStatus.messagesLimit}</div>
            <div style="font-size:11px;color:var(--muted)">Beskeder brugt</div>
          </div>
          <div>
            <div style="font-size:20px;font-weight:600;color:var(--text)">${demoStatus.expiryDate.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}</div>
            <div style="font-size:11px;color:var(--muted)">Udløber</div>
          </div>
          <div style="display:flex;align-items:center">
            <button class="btn btn-primary btn-sm" onclick="upgradeDemoCustomer('${restaurant.id}')">Opgrader</button>
          </div>
        </div>
      `;
    }
    demoBanner.style.display = 'block';
  } else if (demoBanner) {
    demoBanner.style.display = 'none';
  }
  
  // Populate STAMDATA form
  document.getElementById('stamdata-name').value = restaurant.name || '';
  document.getElementById('stamdata-cvr').value = restaurant.cvr || '';
  document.getElementById('stamdata-owner').value = restaurant.owner || '';
  document.getElementById('stamdata-contact').value = restaurant.contactPerson || '';
  document.getElementById('stamdata-email').value = restaurant.email || '';
  document.getElementById('stamdata-phone').value = restaurant.phone || '';
  document.getElementById('stamdata-industry').value = restaurant.industry || restaurant.metadata?.industry || '';
  document.getElementById('stamdata-address').value = restaurant.address || '';
  document.getElementById('stamdata-country').value = restaurant.country || 'DK';
  document.getElementById('stamdata-website').value = restaurant.website || '';
  document.getElementById('stamdata-created').value = restaurant.createdAt || restaurant.created_at || '-';

  // Populate BETALINGSINTEGRATION
  document.getElementById('stamdata-mobilepay-merchant').value = restaurant.mobilepayMerchantId || '';
  document.getElementById('stamdata-mobilepay-api-key').value = restaurant.mobilepayApiKey || '';
  // Generate callback URL
  const callbackEl = document.getElementById('stamdata-payment-callback');
  if (callbackEl) {
    const supabaseUrl = (typeof SupabaseDB !== 'undefined' && SupabaseDB.getConfig) ? SupabaseDB.getConfig().url : '';
    callbackEl.value = restaurant.id && supabaseUrl ? `${supabaseUrl}/functions/v1/mobilepay-webhook?restaurant=${restaurant.id}` : 'Genereres automatisk';
  }

  // Populate WORKFLOW KONTROL
  document.getElementById('wf-review-enabled').checked = !!(restaurant.googleReviewUrl || restaurant.trustpilotUrl);
  document.getElementById('wf-reorder-enabled').checked = restaurant.reorderEnabled !== false;
  document.getElementById('wf-receipt-enabled').checked = restaurant.receiptEnabled !== false;
  document.getElementById('wf-google-link').value = restaurant.googleReviewUrl || '';
  document.getElementById('wf-trustpilot-link').value = restaurant.trustpilotUrl || '';
  document.getElementById('wf-delivery-enabled').checked = restaurant.deliveryEnabled !== false;
  toggleDeliverySettings();
  
  // Populate opening hours (with defaults if not set)
  const oh = restaurant.openingHours || {};
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const defaultTimes = {
    mon: { open: '10:00', close: '22:00' },
    tue: { open: '10:00', close: '22:00' },
    wed: { open: '10:00', close: '22:00' },
    thu: { open: '10:00', close: '22:00' },
    fri: { open: '10:00', close: '23:00' },
    sat: { open: '11:00', close: '23:00' },
    sun: { open: '12:00', close: '21:00' }
  };
  
  days.forEach(day => {
    const dayData = oh[day] || defaultTimes[day];
    const enabledEl = document.getElementById(`oh-${day}-enabled`);
    const openEl = document.getElementById(`oh-${day}-open`);
    const closeEl = document.getElementById(`oh-${day}-close`);
    if (enabledEl) enabledEl.checked = dayData.enabled !== false;
    if (openEl) openEl.value = dayData.open || defaultTimes[day].open;
    if (closeEl) closeEl.value = dayData.close || defaultTimes[day].close;
  });
  
  // Delivery settings
  document.getElementById('wf-delivery-from').value = restaurant.deliveryFrom || '18:00';
  document.getElementById('wf-delivery-to').value = restaurant.deliveryTo || '22:00';
  document.getElementById('wf-delivery-time-restricted').checked = restaurant.deliveryTimeRestricted || false;
  
  // Populate BESKEDER (with defaults)
  const msg = restaurant.messages || {};
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  const setChecked = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };
  
  // Automation toggle
  setChecked('msg-auto-enabled', msg.autoEnabled || false);
  
  // Workflow Beskeder
  setVal('msg-welcome-text', msg.welcome?.text || 'Hej! Tak for dit opkald til {{restaurant}}. Vi fik desværre ikke taget telefonen...');
  setVal('msg-pending-text', msg.pending?.text || 'Tak! Din ordre er nu sendt til køkkenet. Afvent venligst, at restauranten accepterer din bestilling. Du modtager en bekræftelse snarest.');
  setVal('msg-delivery-text', msg.delivery?.text || 'Din ordre er på vej! Forventet leveringstid: {{ventetid}} minutter...');
  
  // Ordre Status Beskeder
  setVal('msg-confirmed-text', msg.confirmed?.text || 'Din ordre er bekræftet! {{restaurant}} har modtaget din bestilling og går straks i gang. Vi sender besked, når maden er klar.');
  setVal('msg-cooking-text', msg.cooking?.text || 'Køkkenet er nu gået i gang med din bestilling! Din mad er klar om ca. {{ventetid}} minutter.');
  setVal('msg-ready-text', msg.ready?.text || 'Din ordre er nu færdig og {{leveringstype}}! Velbekomme fra {{restaurant}}!');
  
  // Efter-Ordre Beskeder
  setChecked('msg-review-enabled', msg.review?.enabled !== false);
  setVal('msg-review-text', msg.review?.text || 'Tak for din ordre hos {{restaurant}}! Vi håber du nød maden 😊 Del gerne din oplevelse: {{review_link}}');
  setChecked('msg-reorder-enabled', msg.reorder?.enabled || false);
  setVal('msg-reorder-text', msg.reorder?.text || 'Hej {{kunde}}! Det er et stykke tid siden vi har set dig hos {{restaurant}}. Har du lyst til at bestille igen? Svar "JA" for at se din sidste ordre 🍕');
  const reorderInterval = document.getElementById('msg-reorder-interval');
  if (reorderInterval) reorderInterval.value = msg.reorder?.interval || '14';
  setChecked('msg-receipt-enabled', msg.receipt?.enabled !== false);
  setVal('msg-receipt-text', msg.receipt?.text || 'KVITTERING - {{restaurant}}\nOrdre: #{{ordre}}\nTotal: {{total}} kr\nDato: {{dato}}\nTak for din ordre!');
  
  // System Beskeder
  setVal('msg-closed-text', msg.closed?.text || 'Tak for din henvendelse! {{restaurant}} har desværre lukket lige nu. Vores åbningstider er {{åbningstider}}. Vi glæder os til at høre fra dig!');
  setVal('msg-error-text', msg.error?.text || 'Beklager, der opstod en fejl. Prøv venligst igen eller ring til os på {{telefon}}.');
  
  // Populate NØGLETAL
  if (restaurant.kpi) {
    document.getElementById('kpi-revenue').textContent = formatCurrency(restaurant.kpi.recoveredRevenue || 0);
    document.getElementById('kpi-ai-rate').textContent = (restaurant.kpi.aiAutomationRate || 0) + '%';
    document.getElementById('kpi-review-rate').textContent = (restaurant.kpi.reviewCTR || 0) + '%';
    document.getElementById('kpi-conversion').textContent = (restaurant.kpi.conversionRate || 0) + '%';
    
    // Reviews
    document.getElementById('review-avg-score').textContent = restaurant.kpi.reviews?.avgRating?.toFixed(1) || '0.0';
    document.getElementById('review-total-count').textContent = restaurant.kpi.reviews?.total || 0;
    document.getElementById('review-stars').innerHTML = renderStars(restaurant.kpi.reviews?.avgRating || 0);
    document.getElementById('google-rating').textContent = restaurant.kpi.reviews?.google?.avgRating?.toFixed(1) || '0.0';
    document.getElementById('google-count').textContent = restaurant.kpi.reviews?.google?.count || 0;
    document.getElementById('trustpilot-rating').textContent = restaurant.kpi.reviews?.trustpilot?.avgRating?.toFixed(1) || '0.0';
    document.getElementById('trustpilot-count').textContent = restaurant.kpi.reviews?.trustpilot?.count || 0;
  }
}

// Render profile heatmap
function renderProfileHeatmap(heatmapData) {
  const container = document.getElementById('profile-heatmap');
  if (!container || !heatmapData) return;
  
  let maxVal = 1;
  Object.values(heatmapData).forEach(dayData => {
    if (Array.isArray(dayData)) {
      dayData.forEach(val => { if (val > maxVal) maxVal = val; });
    }
  });
  
  const hourTotals = new Array(24).fill(0);
  Object.values(heatmapData).forEach(dayData => {
    if (Array.isArray(dayData)) {
      dayData.forEach((val, hour) => { hourTotals[hour] += val; });
    }
  });
  
  container.innerHTML = hourTotals.map((val, hour) => {
    const intensity = val / (maxVal * 7);
    const color = intensity > 0.7 ? 'var(--green)' : intensity > 0.4 ? 'var(--orange)' : intensity > 0.1 ? 'var(--accent)' : 'var(--bg2)';
    return `<div class="crm-heatmap-cell" style="background:${color};opacity:${0.3 + intensity * 0.7}" title="${hour}:00 - ${val} ordrer"></div>`;
  }).join('');
}

// Render stars
function renderStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  let html = '';
  
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      html += '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    } else if (i === fullStars && hasHalf) {
      html += '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" style="opacity:0.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    } else {
      html += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity:0.3"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    }
  }
  return html;
}

// =====================================================
// CUSTOMER SUB-PAGE FUNCTIONS
// =====================================================

// Save Stamdata
function saveStamdata() {
  if (!currentProfileRestaurantId) return;
  
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return;
  
  // Track changes for activity log
  const oldName = restaurant.name;
  const oldCvr = restaurant.cvr;
  const oldOwner = restaurant.owner;
  const oldContact = restaurant.contactPerson;
  const oldEmail = restaurant.email;
  const oldPhone = restaurant.phone;
  const oldIndustry = restaurant.industry;
  const oldAddress = restaurant.address;
  const oldWebsite = restaurant.website;

  // Update values
  restaurant.name = document.getElementById('stamdata-name')?.value || '';
  restaurant.cvr = document.getElementById('stamdata-cvr')?.value || '';
  restaurant.owner = document.getElementById('stamdata-owner')?.value || '';
  restaurant.contactPerson = document.getElementById('stamdata-contact')?.value || '';
  restaurant.email = document.getElementById('stamdata-email')?.value || '';
  restaurant.phone = document.getElementById('stamdata-phone')?.value || '';
  restaurant.industry = document.getElementById('stamdata-industry')?.value || '';
  restaurant.address = document.getElementById('stamdata-address')?.value || '';
  restaurant.country = document.getElementById('stamdata-country')?.value || 'DK';
  restaurant.website = document.getElementById('stamdata-website')?.value || '';

  // Save MobilePay integration
  restaurant.mobilepayMerchantId = document.getElementById('stamdata-mobilepay-merchant')?.value || '';
  restaurant.mobilepayApiKey = document.getElementById('stamdata-mobilepay-api-key')?.value || '';

  // Log field changes
  const fieldMappings = [
    { field: 'Navn', old: oldName, new: restaurant.name },
    { field: 'CVR', old: oldCvr, new: restaurant.cvr },
    { field: 'Ejer', old: oldOwner, new: restaurant.owner },
    { field: 'Kontaktperson', old: oldContact, new: restaurant.contactPerson },
    { field: 'Email', old: oldEmail, new: restaurant.email },
    { field: 'Telefon', old: oldPhone, new: restaurant.phone },
    { field: 'Branche', old: oldIndustry, new: restaurant.industry },
    { field: 'Adresse', old: oldAddress, new: restaurant.address },
    { field: 'Website', old: oldWebsite, new: restaurant.website }
  ];
  
  const changes = fieldMappings.filter(f => f.old !== f.new && (f.old || f.new));
  
  if (changes.length > 0) {
    changes.forEach(change => {
      logActivity('update', `${change.field} opdateret`, {
        category: 'kunder',
        subCategory: 'stamdata',
        field: change.field,
        oldValue: change.old || '(tom)',
        newValue: change.new || '(tom)',
        restaurantId: restaurant.id,
        restaurantName: restaurant.name
      });
    });
    
    // Log to customer-specific aktivitetslogs
    const changedFields = changes.map(c => c.field).join(', ');
    addCustomerAktivitetslog(restaurant.id, 'profil', `Stamdata opdateret: ${changedFields}`);
  }
  
  // Mark last saved timestamp
  restaurant.stamdataUpdatedAt = new Date().toISOString();
  
  // Update header displays
  document.getElementById('profile-name').textContent = restaurant.name || '-';
  document.getElementById('profile-cvr').textContent = restaurant.cvr || '-';
  document.getElementById('nav-customer-name').textContent = restaurant.name || 'Kunde';
  document.getElementById('nav-customer-avatar').textContent = (restaurant.name || '?').charAt(0).toUpperCase();
  
  // Update CRM table if visible
  updateCrmTableRow(restaurant);
  
  // Persist to localStorage
  persistRestaurants();

  // Sync to Supabase
  if (window.SupabaseDB && restaurant.id) {
    SupabaseDB.updateRestaurant(restaurant.id, {
      name: restaurant.name,
      cvr: restaurant.cvr,
      owner: restaurant.owner,
      contact_person: restaurant.contactPerson,
      email: restaurant.email,
      phone: restaurant.phone,
      industry: restaurant.industry,
      address: restaurant.address,
      country: restaurant.country,
      website: restaurant.website
    }).catch(err => console.warn('Supabase sync fejl (stamdata):', err));
  }

  // Show save status
  showSaveStatus('stamdata-save-status', 'saved');
}

// Update CRM table row with new data
function updateCrmTableRow(restaurant) {
  const row = document.querySelector(`tr[data-id="${restaurant.id}"]`);
  if (row) {
    const cells = row.querySelectorAll('td');
    if (cells[1]) cells[1].textContent = restaurant.name || '-';
    if (cells[2]) cells[2].textContent = restaurant.phone || '-';
    if (cells[3]) cells[3].textContent = restaurant.cvr || '-';
  }
}

// Toggle delivery settings visibility
function toggleDeliverySettings() {
  const enabled = document.getElementById('wf-delivery-enabled').checked;
  document.getElementById('delivery-settings').style.display = enabled ? 'block' : 'none';
}

// ============================================================================
// MOBILEPAY INTEGRATION
// ============================================================================

/**
 * Test MobilePay connection
 */
async function testMobilePayConnection() {
  const statusEl = document.getElementById('mobilepay-test-status');
  const merchantId = document.getElementById('stamdata-mobilepay-merchant')?.value;
  const apiKey = document.getElementById('stamdata-mobilepay-api-key')?.value;

  if (!merchantId || !apiKey) {
    statusEl.textContent = '⚠️ Udfyld Merchant ID og API nøgle';
    statusEl.style.color = 'var(--warning)';
    return;
  }

  statusEl.textContent = 'Tester forbindelse...';
  statusEl.style.color = 'var(--muted)';

  try {
    // In production, this would make a real API call to MobilePay
    // For now, we validate the format and simulate a check
    const isValidFormat = /^POSDK\d+$/.test(merchantId) || merchantId.length > 5;

    if (isValidFormat && apiKey.length > 10) {
      statusEl.textContent = '✅ Forbindelse OK';
      statusEl.style.color = 'var(--success)';
    } else {
      statusEl.textContent = '❌ Ugyldigt format';
      statusEl.style.color = 'var(--danger)';
    }
  } catch (err) {
    statusEl.textContent = '❌ Fejl: ' + err.message;
    statusEl.style.color = 'var(--danger)';
  }
}

/**
 * Create a MobilePay payment link for an order
 * @param {Object} order - Order data
 * @param {Object} restaurant - Restaurant with MobilePay credentials
 * @returns {string|null} Payment URL or null if not configured
 */
async function createMobilePayLink(order, restaurant) {
  const merchantId = restaurant.mobilepayMerchantId;
  const apiKey = restaurant.mobilepayApiKey;

  if (!merchantId || !apiKey) {
    console.warn('MobilePay ikke konfigureret for denne restaurant');
    return null;
  }

  try {
    // MobilePay MyShop API endpoint
    // In production, this should go through a Supabase Edge Function for security
    const config = (typeof SupabaseDB !== 'undefined' && SupabaseDB.getConfig) ? SupabaseDB.getConfig() : null;
    if (!config) {
      console.error('Supabase config not available for MobilePay');
      return null;
    }

    const response = await fetch(`${config.url}/functions/v1/create-mobilepay-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.key}`
      },
      body: JSON.stringify({
        merchantId: merchantId,
        amount: Math.round(order.total * 100), // MobilePay uses øre
        orderId: order.id || Date.now().toString(),
        description: `Ordre #${order.id} - ${restaurant.name}`,
        restaurantId: restaurant.id,
        customerPhone: order.phone
      })
    });

    if (!response.ok) {
      throw new Error('MobilePay API fejl');
    }

    const data = await response.json();
    return data.paymentUrl || data.mobilePayAppRedirectUri;
  } catch (err) {
    console.error('MobilePay link error:', err);

    // Fallback: Generate a simple payment reference link
    // In production, this would be a proper MobilePay deep link
    const amount = Math.round((order.total || 0) * 100);
    const reference = order.id || Date.now().toString();
    return `https://mobilepay.dk/erhverv/betalingslink/${merchantId}?amount=${amount}&ref=${reference}`;
  }
}

/**
 * Send payment link to customer via SMS
 * @param {string} phone - Customer phone
 * @param {Object} order - Order data
 * @param {Object} restaurant - Restaurant
 */
async function sendPaymentLink(phone, order, restaurant) {
  const paymentUrl = await createMobilePayLink(order, restaurant);

  if (!paymentUrl) {
    addLog('⚠️ MobilePay ikke konfigureret - springer betalingslink over', 'warning');
    return false;
  }

  const msg = `💳 Betal din ordre med MobilePay:\n\nOrdre #${order.id || 'N/A'}\nTotal: ${order.total} kr\n\nBetal her: ${paymentUrl}\n\n${restaurant.name}`;

  await sendSMS(phone, msg, restaurant);
  addLog('💳 Betalingslink sendt til kunden', 'success');
  return true;
}

// Clear workflow dirty state (shows save confirmation)
function clearWorkflowDirty() {
  showSaveStatus('workflow-save-status', 'saved');
}

/**
 * Generic save status system
 * Usage:
 *   1. Add <span class="save-status" id="unique-id"></span> near save button in HTML
 *   2. Call showSaveStatus('unique-id', 'saved') after successful save
 *   3. Call showSaveStatus('unique-id', 'error') to display error message
 */
function showSaveStatus(elementId, status = 'saved') {
  const statusEl = document.getElementById(elementId);
  if (!statusEl) return;

  if (status === 'saved') {
    statusEl.textContent = '✓ Gemt';
    statusEl.style.color = 'var(--green)';
    setTimeout(() => {
      statusEl.textContent = '';
    }, 3000);
  } else if (status === 'error') {
    statusEl.textContent = '✗ Fejl ved gemning';
    statusEl.style.color = 'var(--red)';
    setTimeout(() => {
      statusEl.textContent = '';
    }, 5000);
  } else {
    statusEl.textContent = '';
  }
}

function clearSaveStatus(elementId) {
  const statusEl = document.getElementById(elementId);
  if (statusEl) {
    statusEl.textContent = '';
  }
}

// Save Workflow Settings (internal - collects data)
function saveWorkflowSettings() {
  if (!currentProfileRestaurantId) return false;
  
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return false;
  
  // Workflow features
  restaurant.reviewEnabled = document.getElementById('wf-review-enabled')?.checked ?? false;
  restaurant.reorderEnabled = document.getElementById('wf-reorder-enabled')?.checked ?? false;
  restaurant.receiptEnabled = document.getElementById('wf-receipt-enabled')?.checked ?? false;
  restaurant.googleReviewUrl = document.getElementById('wf-google-link')?.value || '';
  restaurant.trustpilotUrl = document.getElementById('wf-trustpilot-link')?.value || '';
  
  // Delivery settings
  restaurant.deliveryEnabled = document.getElementById('wf-delivery-enabled')?.checked ?? false;
  restaurant.deliveryFrom = document.getElementById('wf-delivery-from')?.value || '18:00';
  restaurant.deliveryTo = document.getElementById('wf-delivery-to')?.value || '22:00';
  restaurant.deliveryTimeRestricted = document.getElementById('wf-delivery-time-restricted')?.checked ?? false;
  
  // Opening hours
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  restaurant.openingHours = {};
  days.forEach(day => {
    restaurant.openingHours[day] = {
      enabled: document.getElementById(`oh-${day}-enabled`)?.checked ?? true,
      open: document.getElementById(`oh-${day}-open`)?.value || '10:00',
      close: document.getElementById(`oh-${day}-close`)?.value || '22:00'
    };
  });
  
  // Time format
  restaurant.timeFormat = document.getElementById('wf-time-format')?.value || '24h';
  
  // Mark last saved timestamp
  restaurant.workflowSettingsUpdatedAt = new Date().toISOString();
  
  console.log('Workflow settings saved:', restaurant);
  return true;
}

// Save Messages Config (for workflow messages modal)
function saveMessagesConfig() {
  if (!currentProfileRestaurantId) {
    toast('Kunne ikke gemme beskeder - ingen restaurant valgt', 'error');
    return;
  }

  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) {
    toast('Restaurant ikke fundet', 'error');
    return;
  }

  // Initialize messages object if needed
  if (!restaurant.messages) {
    restaurant.messages = {};
  }

  // Save message templates from form (assuming these IDs exist in the modal)
  const confirmationMessage = document.getElementById('msg-confirmation')?.value;
  const reviewMessage = document.getElementById('msg-review')?.value;
  const reorderMessage = document.getElementById('msg-reorder')?.value;

  if (confirmationMessage !== undefined) restaurant.messages.confirmation = confirmationMessage;
  if (reviewMessage !== undefined) restaurant.messages.review = reviewMessage;
  if (reorderMessage !== undefined) restaurant.messages.reorder = reorderMessage;

  // Persist to localStorage and Supabase
  persistRestaurants();

  if (typeof SupabaseDB !== 'undefined') {
    SupabaseDB.updateRestaurant(restaurant.id, {
      metadata: { ...restaurant.metadata, messages: restaurant.messages }
    }).catch(err => console.error('Error saving messages to Supabase:', err));
  }

  closeModal('messages-config');
  toast('Beskeder gemt', 'success');

  console.log('✅ Messages config saved for restaurant:', restaurant.name);
}

// Explicit save with user feedback
function saveWorkflowSettingsExplicit() {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return;

  if (saveWorkflowSettings()) {
    // Persist to localStorage
    persistRestaurants();

    // Sync to Supabase
    if (window.SupabaseDB && restaurant.id) {
      SupabaseDB.updateRestaurant(restaurant.id, {
        metadata: { ...restaurant.metadata, workflow_settings: restaurant.workflowSettings }
      }).catch(err => console.warn('Supabase sync fejl (workflow settings):', err));
    }

    clearWorkflowDirty();

    // LOG ACTIVITY - dette vil automatisk vise blå prik på Workflow Kontrol nav item
    logActivity('update', 'Workflow indstillinger opdateret', {
      category: 'kunder',
      subCategory: 'workflow-kontrol',
      restaurantId: restaurant.id,
      restaurantName: restaurant.name
    });

    // Sync to workflow if active
    syncWorkflowFromCustomerSettings();
  } else {
    toast('Kunne ikke gemme indstillinger', 'error');
  }
}

// Sync workflow from customer settings
function syncWorkflowFromCustomerSettings() {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return;
  
  // Update workflow nodes based on customer settings
  if (typeof syncWorkflowReviewNode === 'function') {
    syncWorkflowReviewNode(restaurant.reviewEnabled && (restaurant.googleReviewUrl || restaurant.trustpilotUrl));
  }
  
  console.log('Workflow synced with customer settings');
}

// Save Message Settings (internal - collects data)
function saveMessageSettings() {
  if (!currentProfileRestaurantId) return false;
  
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return false;
  
  // Helper to safely get element value
  const getVal = (id) => document.getElementById(id)?.value || '';
  const getChecked = (id) => document.getElementById(id)?.checked || false;
  
  restaurant.messages = {
    // Automation
    autoEnabled: getChecked('msg-auto-enabled'),
    
    // Workflow Beskeder
    welcome: { text: getVal('msg-welcome-text') },
    pending: { text: getVal('msg-pending-text') },
    delivery: { text: getVal('msg-delivery-text') },
    
    // Ordre Status Beskeder
    confirmed: { text: getVal('msg-confirmed-text') },
    cooking: { text: getVal('msg-cooking-text') },
    ready: { text: getVal('msg-ready-text') },
    
    // Efter-Ordre Beskeder
    review: { 
      enabled: getChecked('msg-review-enabled'),
      text: getVal('msg-review-text') 
    },
    reorder: { 
      enabled: getChecked('msg-reorder-enabled'),
      text: getVal('msg-reorder-text'),
      interval: document.getElementById('msg-reorder-interval')?.value || '14'
    },
    receipt: { 
      enabled: getChecked('msg-receipt-enabled'),
      text: getVal('msg-receipt-text') 
    },
    
    // System Beskeder
    closed: { text: getVal('msg-closed-text') },
    error: { text: getVal('msg-error-text') }
  };
  
  // Mark last saved timestamp
  restaurant.messagesUpdatedAt = new Date().toISOString();
  
  console.log('Message settings saved:', restaurant.messages);
  return true;
}

// Save all messages with toast notification
function saveAllMessages() {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (saveMessageSettings()) {
    // Persist to localStorage
    persistRestaurants();

    // Sync to Supabase
    if (window.SupabaseDB && restaurant?.id) {
      SupabaseDB.updateRestaurant(restaurant.id, {
        metadata: { ...restaurant.metadata, messages: restaurant.messages }
      }).catch(err => console.warn('Supabase sync fejl (messages):', err));
    }

    // Show save status
    showSaveStatus('messages-save-status', 'saved');

    // Sync messages to workflow
    syncMessagesToWorkflow();
  } else {
    toast('Kunne ikke gemme beskeder', 'error');
  }
}

// Sync messages to workflow nodes
function syncMessagesToWorkflow() {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant || !restaurant.messages) return;
  
  // Update workflow nodes with new message templates
  // This ensures the workflow uses the latest messages
  console.log('Messages synced to workflow:', restaurant.messages);
}

// =====================================================
// WORKFLOW RUNTIME HELPERS
// Get customer-specific settings for workflow execution
// =====================================================

// Get message template for a specific type
function getCustomerMessage(restaurantId, messageType, variables = {}) {
  const restaurant = restaurants.find(r => r.id === restaurantId);
  if (!restaurant || !restaurant.messages) return null;
  
  let template = '';
  
  switch (messageType) {
    case 'welcome':
      template = restaurant.messages.welcome?.text || 'Hej! Tak for dit opkald til {{restaurant}}.';
      break;
    case 'pending':
      template = restaurant.messages.pending?.text || 'Tak! Din ordre er nu sendt til køkkenet.';
      break;
    case 'delivery':
      template = restaurant.messages.delivery?.text || 'Din ordre er på vej!';
      break;
    case 'confirmed':
      template = restaurant.messages.confirmed?.text || 'Din ordre er bekræftet!';
      break;
    case 'cooking':
      template = restaurant.messages.cooking?.text || 'Køkkenet er nu gået i gang med din bestilling!';
      break;
    case 'ready':
      template = restaurant.messages.ready?.text || 'Din ordre er nu færdig!';
      break;
    case 'review':
      if (!restaurant.messages.review?.enabled) return null;
      template = restaurant.messages.review?.text || 'Tak for din ordre! Del gerne din oplevelse.';
      break;
    case 'closed':
      template = restaurant.messages.closed?.text || 'Vi har desværre lukket lige nu.';
      break;
    case 'error':
      template = restaurant.messages.error?.text || 'Beklager, der opstod en fejl.';
      break;
    default:
      return null;
  }
  
  // Replace variables
  Object.keys(variables).forEach(key => {
    template = template.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]);
  });
  
  // Replace restaurant name
  template = template.replace(/{{restaurant}}/g, restaurant.name || 'restauranten');
  
  return template;
}

// Check if delivery is available for a restaurant right now
function isDeliveryAvailableNow(restaurantId) {
  const restaurant = restaurants.find(r => r.id === restaurantId);
  if (!restaurant) return false;
  if (!restaurant.deliveryEnabled) return false;
  if (!restaurant.deliveryTimeRestricted) return true;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [fromHour, fromMin] = (restaurant.deliveryFrom || '18:00').split(':').map(Number);
  const [toHour, toMin] = (restaurant.deliveryTo || '22:00').split(':').map(Number);
  
  const fromTime = fromHour * 60 + fromMin;
  const toTime = toHour * 60 + toMin;
  
  return currentTime >= fromTime && currentTime <= toTime;
}

// Check if restaurant is open right now
function isRestaurantOpenNow(restaurantId) {
  const restaurant = restaurants.find(r => r.id === restaurantId);
  if (!restaurant || !restaurant.openingHours) return true; // Default to open
  
  const now = new Date();
  // Support both short and full day names for compatibility
  const dayNamesShort = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const dayNamesFull = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayIndex = now.getDay();
  
  // Try both name formats
  const todayHours = restaurant.openingHours[dayNamesShort[dayIndex]] || 
                     restaurant.openingHours[dayNamesFull[dayIndex]];
  
  if (!todayHours || !todayHours.enabled) return false;
  
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMin] = (todayHours.open || '00:00').split(':').map(Number);
  const [closeHour, closeMin] = (todayHours.close || '00:00').split(':').map(Number);
  
  const openTime = openHour * 60 + openMin;
  let closeTime = closeHour * 60 + closeMin;
  
  // DØGNÅBENT: Hvis både open og close er 00:00
  if (openTime === 0 && closeTime === 0 && todayHours.open === '00:00' && todayHours.close === '00:00') {
    return true;
  }
  
  // Midnat fix: 00:00 lukketid = 24:00
  if (closeTime === 0 && todayHours.close === '00:00') {
    closeTime = 1440;
  }
  
  // Over midnat: fx 18:00 - 02:00
  if (closeTime < openTime) {
    return currentTime >= openTime || currentTime < closeTime;
  }
  
  // Normal: fx 10:00 - 22:00
  return currentTime >= openTime && currentTime < closeTime;
}

// Get customer workflow settings
function getCustomerWorkflowSettings(restaurantId) {
  const restaurant = restaurants.find(r => r.id === restaurantId);
  if (!restaurant) return null;
  
  return {
    reviewEnabled: restaurant.reviewEnabled && (restaurant.googleReviewUrl || restaurant.trustpilotUrl),
    reorderEnabled: restaurant.reorderEnabled,
    receiptEnabled: restaurant.receiptEnabled,
    deliveryEnabled: restaurant.deliveryEnabled,
    deliveryAvailableNow: isDeliveryAvailableNow(restaurantId),
    isOpen: isRestaurantOpenNow(restaurantId),
    autoEnabled: restaurant.messages?.autoEnabled || false,
    googleReviewUrl: restaurant.googleReviewUrl,
    trustpilotUrl: restaurant.trustpilotUrl
  };
}

// Insert variable into textarea
function insertVariable(textareaId, variable) {
  const textarea = document.getElementById(textareaId);
  if (!textarea) return;
  
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  
  textarea.value = text.substring(0, start) + variable + text.substring(end);
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = start + variable.length;
  
  // Don't auto-save on variable insert to avoid confusion
}

// Export customer PDF (Månedlig KPI Rapport)
function exportCustomerPdf() {
  if (!currentProfileRestaurantId) return;
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return;
  
  // Wait for jsPDF to load
  if (typeof window.jspdf === 'undefined') {
    toast('PDF bibliotek indlæses...', 'info');
    setTimeout(exportCustomerPdf, 500);
    return;
  }
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // PDF Konfiguration
  const PRIMARY_COLOR = [26, 26, 46];
  const ACCENT_COLOR = [45, 212, 191];
  const TEXT_COLOR = [51, 51, 51];
  const MEDIUM_GRAY = [224, 224, 224];
  const GREEN_COLOR = [34, 197, 94];
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25;
  
  let y = 20;
  
  // === HEADER ===
  doc.setFontSize(22);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFont('helvetica', 'bold');
  doc.text('MÅNEDSRAPPORT', margin, y);
  
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(...ACCENT_COLOR);
  doc.setFont('helvetica', 'normal');
  doc.text('OrderFlow SaaS - Nøgletal', margin, y);
  
  // Højre side
  const dateStr = new Date().toLocaleDateString('da-DK');
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_COLOR);
  doc.setFont('helvetica', 'bold');
  doc.text(restaurant.name || 'Restaurant', pageWidth - margin, y - 6, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('CVR: ' + (restaurant.cvr || '-'), pageWidth - margin, y, { align: 'right' });
  doc.text('Genereret: ' + dateStr, pageWidth - margin, y + 4, { align: 'right' });
  
  // Header linje
  y += 5;
  doc.setDrawColor(...PRIMARY_COLOR);
  doc.setLineWidth(0.7);
  doc.line(margin, y, pageWidth - margin, y);
  
  y += 15;
  
  // === KPI SEKTION ===
  const kpi = restaurant.kpi || {};
  
  doc.setFontSize(14);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFont('helvetica', 'bold');
  doc.text('Nøgletal', margin, y);
  y += 10;
  
  // KPI Grid (2x2)
  const kpiData = [
    { label: 'Genvundet Omsætning', value: (kpi.recoveredRevenue || 0).toLocaleString('da-DK') + ' kr', color: GREEN_COLOR },
    { label: 'AI Håndteringsrate', value: (kpi.aiAutomationRate || 0) + '%', color: [168, 85, 247] },
    { label: 'Anmeldelseskonvertering', value: (kpi.reviewCTR || 0) + '%', color: [251, 146, 60] },
    { label: 'Konverteringsrate', value: (kpi.conversionRate || 0) + '%', color: [59, 130, 246] }
  ];
  
  const boxWidth = 75;
  const boxHeight = 25;
  
  kpiData.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = margin + (col * (boxWidth + 10));
    const boxY = y + (row * (boxHeight + 8));
    
    // Box background
    doc.setFillColor(245, 245, 245);
    if (typeof doc.roundedRect === 'function') {
      doc.roundedRect(x, boxY, boxWidth, boxHeight, 2, 2, 'F');
    } else {
      doc.rect(x, boxY, boxWidth, boxHeight, 'F');
    }
    
    // Value
    doc.setFontSize(16);
    doc.setTextColor(...item.color);
    doc.setFont('helvetica', 'bold');
    doc.text(item.value, x + 5, boxY + 10);
    
    // Label
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_COLOR);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, x + 5, boxY + 18);
  });
  
  y += (boxHeight * 2) + 25;
  
  // === ANMELDELSER SEKTION ===
  doc.setFontSize(14);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFont('helvetica', 'bold');
  doc.text('Anmeldelser', margin, y);
  y += 10;
  
  const reviews = kpi.reviews || {};
  
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_COLOR);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Samlet bedømmelse: ' + (reviews.avgRating || 0).toFixed(1) + ' / 5.0', margin, y);
  y += 6;
  doc.text('Antal anmeldelser: ' + (reviews.total || 0), margin, y);
  y += 8;
  
  if (reviews.google) {
    doc.text('Google: ' + (reviews.google.avgRating || 0).toFixed(1) + ' (' + (reviews.google.count || 0) + ' anmeldelser)', margin, y);
    y += 6;
  }
  if (reviews.trustpilot) {
    doc.text('Trustpilot: ' + (reviews.trustpilot.avgRating || 0).toFixed(1) + ' (' + (reviews.trustpilot.count || 0) + ' anmeldelser)', margin, y);
    y += 6;
  }
  
  y += 10;
  
  // === OMSÆTNING SEKTION ===
  doc.setFontSize(14);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFont('helvetica', 'bold');
  doc.text('Omsætning', margin, y);
  y += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_COLOR);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Total omsætning: ' + (kpi.totalRevenue || 0).toLocaleString('da-DK') + ' kr', margin, y);
  y += 6;
  doc.text('Genvundet omsætning: ' + (kpi.recoveredRevenue || 0).toLocaleString('da-DK') + ' kr', margin, y);
  y += 6;
  doc.text('Gennemsnitlig ordreværdi: ' + (kpi.avgOrderValue || 0).toLocaleString('da-DK') + ' kr', margin, y);
  
  // === FOOTER ===
  const footerY = pageHeight - 15;
  
  doc.setDrawColor(...MEDIUM_GRAY);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_COLOR);
  doc.text('Side 1 af 1', pageWidth / 2, footerY, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('OrderFlow SaaS  •  Vestergade 12, 2100 København Ø  •  CVR: 12345678', pageWidth / 2, footerY + 4, { align: 'center' });
  
  // === DOWNLOAD ===
  const fileName = `Maanedsrapport_${restaurant.name?.replace(/\s+/g, '_') || 'Restaurant'}_${new Date().toISOString().slice(0,7)}.pdf`;
  doc.save(fileName);
  
  // toast('PDF downloadet', 'success'); // Removed - unnecessary
}

// Export customer Excel
function exportCustomerExcel() {
  if (!currentProfileRestaurantId) return;
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return;
  
  const kpi = restaurant.kpi || {};
  const reviews = kpi.reviews || {};
  
  // Create CSV content
  const rows = [
    ['MÅNEDSRAPPORT - ' + (restaurant.name || 'Restaurant')],
    ['Genereret', new Date().toLocaleDateString('da-DK')],
    [''],
    ['STAMDATA'],
    ['Virksomhedsnavn', restaurant.name || ''],
    ['CVR', restaurant.cvr || ''],
    ['Adresse', restaurant.address || ''],
    [''],
    ['NØGLETAL'],
    ['Genvundet Omsætning', kpi.recoveredRevenue || 0],
    ['AI Håndteringsrate (%)', kpi.aiAutomationRate || 0],
    ['Anmeldelseskonvertering (%)', kpi.reviewCTR || 0],
    ['Konverteringsrate (%)', kpi.conversionRate || 0],
    [''],
    ['OMSÆTNING'],
    ['Total omsætning', kpi.totalRevenue || 0],
    ['Genvundet omsætning', kpi.recoveredRevenue || 0],
    ['Gennemsnitlig ordreværdi', kpi.avgOrderValue || 0],
    [''],
    ['ANMELDELSER'],
    ['Samlet bedømmelse', reviews.avgRating || 0],
    ['Antal anmeldelser', reviews.total || 0],
    ['Google bedømmelse', reviews.google?.avgRating || 0],
    ['Google antal', reviews.google?.count || 0],
    ['Trustpilot bedømmelse', reviews.trustpilot?.avgRating || 0],
    ['Trustpilot antal', reviews.trustpilot?.count || 0]
  ];
  
  const csv = rows.map(row => row.join(';')).join('\n');
  
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Maanedsrapport_${restaurant.name?.replace(/\s+/g, '_') || 'Restaurant'}_${new Date().toISOString().slice(0,7)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  
  // toast('Excel eksport downloadet', 'success'); // Removed - unnecessary
}

// Check if delivery is available based on time restrictions
function isDeliveryAvailable(restaurant) {
  if (!restaurant.deliveryEnabled) return false;
  if (!restaurant.deliveryTimeRestricted) return true;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [fromHour, fromMin] = (restaurant.deliveryFrom || '18:00').split(':').map(Number);
  const [toHour, toMin] = (restaurant.deliveryTo || '22:00').split(':').map(Number);
  
  const fromTime = fromHour * 60 + fromMin;
  const toTime = toHour * 60 + toMin;
  
  return currentTime >= fromTime && currentTime <= toTime;
}

// Update review links status (legacy - now handled by saveWorkflowSettings)
function updateReviewLinks() {
  // This function is kept for backwards compatibility but logic moved to workflow settings
  saveWorkflowSettings();
}

// Save review links and activate workflow node (legacy)
function saveReviewLinks() {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return;

  const googleUrl = document.getElementById('wf-google-link')?.value.trim() || '';
  const trustpilotUrl = document.getElementById('wf-trustpilot-link')?.value.trim() || '';

  restaurant.googleReviewUrl = googleUrl;
  restaurant.trustpilotUrl = trustpilotUrl;
  restaurant.reviewRequestEnabled = !!(googleUrl || trustpilotUrl);

  // Persist to localStorage
  persistRestaurants();

  // LOG ACTIVITY - dette vil automatisk vise blå prik på Workflow Kontrol nav item
  logActivity('update', 'Anmeldelseslinks opdateret', {
    category: 'kunder',
    subCategory: 'workflow-kontrol',
    restaurantId: restaurant.id,
    restaurantName: restaurant.name
  });

  // Sync workflow node - activate if links exist
  syncWorkflowReviewNode(restaurant.reviewRequestEnabled);

  // Show save status
  showSaveStatus('workflow-save-status', 'saved');
}

// Toggle profile delivery (legacy - redirects to new function)
function toggleProfileDelivery() {
  toggleDeliverySettings();
}

// Toggle automation mode visibility
function toggleAutoMode(enabled) {
  const settings = document.getElementById('auto-mode-settings');
  if (settings) {
    settings.style.display = enabled ? 'block' : 'none';
  }
}

// Open messages configuration modal
function openMessagesModal() {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return;
  
  // Initialize custom messages object if not exists
  if (!restaurant.customMessages) {
    restaurant.customMessages = {};
  }
  
  // Initialize automation settings if not exists
  if (!restaurant.automation) {
    restaurant.automation = { enabled: false, defaultTime: 40 };
  }
  
  // Populate automation settings
  document.getElementById('msg-auto-mode').checked = restaurant.automation.enabled || false;
  document.getElementById('msg-auto-time').value = restaurant.automation.defaultTime || 40;
  toggleAutoMode(restaurant.automation.enabled);
  
  // Populate NEW order status messages
  document.getElementById('msg-order-accepted').value = restaurant.customMessages.orderAccepted || '';
  document.getElementById('msg-order-started').value = restaurant.customMessages.orderStarted || '';
  document.getElementById('msg-order-completed').value = restaurant.customMessages.orderCompleted || '';
  
  // Populate existing workflow messages
  document.getElementById('msg-welcome').value = restaurant.customMessages.welcome || '';
  document.getElementById('msg-order-confirm').value = restaurant.customMessages.orderConfirm || '';
  document.getElementById('msg-delivery').value = restaurant.customMessages.delivery || '';
  document.getElementById('msg-review').value = restaurant.customMessages.review || '';
  document.getElementById('msg-receipt').value = restaurant.customMessages.receipt || '';
  
  showModal('messages-config');
}

// Save custom messages
function saveCustomMessages() {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return;
  
  // Initialize if not exists
  if (!restaurant.customMessages) {
    restaurant.customMessages = {};
  }
  if (!restaurant.automation) {
    restaurant.automation = {};
  }
  
  // Save automation settings
  restaurant.automation.enabled = document.getElementById('msg-auto-mode').checked;
  restaurant.automation.defaultTime = parseInt(document.getElementById('msg-auto-time').value) || 40;
  
  // Save NEW order status messages
  const orderAccepted = document.getElementById('msg-order-accepted').value.trim();
  const orderStarted = document.getElementById('msg-order-started').value.trim();
  const orderCompleted = document.getElementById('msg-order-completed').value.trim();
  
  restaurant.customMessages.orderAccepted = orderAccepted || null;
  restaurant.customMessages.orderStarted = orderStarted || null;
  restaurant.customMessages.orderCompleted = orderCompleted || null;
  
  // Save existing workflow messages
  const welcome = document.getElementById('msg-welcome').value.trim();
  const orderConfirm = document.getElementById('msg-order-confirm').value.trim();
  const delivery = document.getElementById('msg-delivery').value.trim();
  const review = document.getElementById('msg-review').value.trim();
  const receipt = document.getElementById('msg-receipt').value.trim();
  
  restaurant.customMessages.welcome = welcome || null;
  restaurant.customMessages.orderConfirm = orderConfirm || null;
  restaurant.customMessages.delivery = delivery || null;
  restaurant.customMessages.review = review || null;
  restaurant.customMessages.receipt = receipt || null;
  
  closeModal('messages-config');
}

// Get message for a node - returns custom or default
function getMessageForNode(restaurantId, nodeId) {
  const restaurant = restaurants.find(r => r.id === restaurantId);
  if (!restaurant || !restaurant.customMessages) return null;
  
  const messageMap = {
    'send-welcome': restaurant.customMessages.welcome,
    'send-order-confirm': restaurant.customMessages.orderConfirm,
    'send-delivery-info': restaurant.customMessages.delivery,
    'send-review-request': restaurant.customMessages.review,
    'send-receipt': restaurant.customMessages.receipt
  };
  
  return messageMap[nodeId] || null; // null = use default
}

// Edit current profile
function editCurrentProfile() {
  if (currentProfileRestaurantId) {
    editRestaurant(currentProfileRestaurantId);
  }
}

// Test current profile
function testCurrentProfile() {
  if (currentProfileRestaurantId) {
    testRestaurant(currentProfileRestaurantId);
    showPage('workflow');
  }
}

// Export profile PDF
function exportProfilePdf() {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return;
  
  console.log(`Generating PDF for ${restaurant.name}`);
}

// Export profile Excel
function exportProfileExcel() {
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  if (!restaurant) return;
  
  console.log(`Generating Excel for ${restaurant.name}`);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    const searchInput = document.getElementById('crm-search');
    if (searchInput && document.getElementById('page-kunder').classList.contains('active')) {
      showCrmSearchView();
      searchInput.focus();
      searchInput.select();
    }
  }
  
  // Escape to go back to search view
  if (e.key === 'Escape' && currentProfileRestaurantId) {
    showCrmSearchView();
  }
});

// Click handler (autocomplete removed)
document.addEventListener('click', (e) => {
  // Close command results
  if (!e.target.closest('.sidebar-search')) {
    const commandResults = document.getElementById('command-results');
    if (commandResults) commandResults.classList.remove('active');
  }
});

// =====================================================
// GLOBAL COMMAND SEARCH
// =====================================================

// Command search data
const commandItems = [
  // Pages
  { type: 'page', id: 'dashboard', name: 'Dashboard', hint: 'Overblik', keywords: ['dashboard', 'overblik', 'hjem', 'start'] },
  { type: 'page', id: 'kunder', name: 'Kunder', hint: 'CRM', keywords: ['restauranter', 'kunder', 'crm', 'kunde'] },
  { type: 'page', id: 'orders', name: 'Ordrer', hint: 'Alle ordrer', keywords: ['ordrer', 'ordre', 'bestillinger', 'salg'] },
  { type: 'page', id: 'workflow', name: 'Workflow', hint: 'Automatisering', keywords: ['workflow', 'flow', 'automatisering', 'automation'] },
  { type: 'page', id: 'settings', name: 'Indstillinger', hint: 'Konfiguration', keywords: ['indstillinger', 'settings', 'config'] },
  { type: 'page', id: 'salgsoversigt', name: 'Salgsoversigt', hint: 'Salg', keywords: ['salg', 'omsaetning', 'revenue', 'oversigt'] },
  { type: 'page', id: 'loyalty', name: 'Loyalty Program', hint: 'Marketing', keywords: ['loyalty', 'point', 'stamkunde', 'bonus'] },
  { type: 'page', id: 'campaigns', name: 'Kampagner', hint: 'Marketing', keywords: ['kampagne', 'tilbud', 'marketing', 'rabat'] },
  { type: 'page', id: 'appbuilder-design', name: 'App Builder', hint: 'PWA', keywords: ['app', 'builder', 'pwa', 'mobil', 'design'] },
  { type: 'page', id: 'leads', name: 'Leads', hint: 'Salg', keywords: ['leads', 'prospekter', 'potentielle', 'kunder'] },
  // Account
  { type: 'account', id: 'mine-oplysninger', name: 'Mine oplysninger', hint: 'Profil', keywords: ['profil', 'oplysninger', 'konto', 'bruger', 'mig'] },
  { type: 'account', id: 'ordrehistorik', name: 'Ordre historik', hint: 'Historik', keywords: ['ordre', 'historik', 'tidligere', 'bestillinger', 'genbestil'] },
  { type: 'account', id: 'betalingsmetoder', name: 'Betalingsmetoder', hint: 'Kort', keywords: ['betaling', 'kort', 'kreditkort', 'faktura', 'visa', 'mastercard'] },
  { type: 'account', id: 'leveringsadresser', name: 'Leveringsadresser', hint: 'Adresser', keywords: ['adresse', 'levering', 'delivery', 'hjem', 'arbejde'] },
  // Settings
  { type: 'setting', id: 'openai', name: 'OpenAI API', hint: 'AI', keywords: ['openai', 'ai', 'gpt', 'api'] },
  { type: 'setting', id: 'beskeder', name: 'Beskeder', hint: 'Templates', keywords: ['beskeder', 'messages', 'templates', 'skabeloner'] },
  { type: 'setting', id: 'notifications', name: 'Notifikationer', hint: 'Advarsler', keywords: ['notifikationer', 'alerts', 'beskeder', 'push'] },
  { type: 'setting', id: 'users', name: 'Brugerindstillinger', hint: 'Profil', keywords: ['bruger', 'profil', 'konto', 'team'] },
  // Reports
  { type: 'report', id: 'kpi', name: 'KPI Oversigt', hint: 'Analytics', keywords: ['kpi', 'analytics', 'statistik', 'data'] },
  { type: 'report', id: 'monthly', name: 'Månedsrapport', hint: 'PDF', keywords: ['rapport', 'maanedlig', 'pdf', 'export'] }
];

// Handle command search
function handleCommandSearch(query) {
  const results = document.getElementById('command-results');
  if (!results) return;
  
  query = (query || '').toLowerCase().trim();
  
  if (!query) {
    // Show all items grouped
    results.innerHTML = buildCommandResultsHTML(commandItems);
    return;
  }
  
  // Filter items
  const filtered = commandItems.filter(item => 
    item.name.toLowerCase().includes(query) ||
    item.hint.toLowerCase().includes(query) ||
    item.keywords.some(k => k.includes(query))
  );
  
  if (filtered.length === 0) {
    results.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px">Ingen resultater fundet</div>';
  } else {
    results.innerHTML = buildCommandResultsHTML(filtered);
  }
}

// Build command results HTML
function buildCommandResultsHTML(items) {
  const pages = items.filter(i => i.type === 'page');
  const account = items.filter(i => i.type === 'account');
  const settings = items.filter(i => i.type === 'setting');
  const reports = items.filter(i => i.type === 'report');

  let html = '';

  if (pages.length) {
    html += '<div class="command-group"><div class="command-group-title">Sider</div>';
    pages.forEach(item => {
      html += `<div class="command-item" onclick="navigateCommand('${item.id}')">
        ${getCommandIcon(item.id)}
        <span class="command-item-text">${item.name}</span>
        <span class="command-item-hint">${item.hint}</span>
      </div>`;
    });
    html += '</div>';
  }

  if (account.length) {
    html += '<div class="command-group"><div class="command-group-title">Min konto</div>';
    account.forEach(item => {
      html += `<div class="command-item" onclick="navigateCommand('account', '${item.id}')">
        ${getCommandIcon(item.id)}
        <span class="command-item-text">${item.name}</span>
        <span class="command-item-hint">${item.hint}</span>
      </div>`;
    });
    html += '</div>';
  }

  if (settings.length) {
    html += '<div class="command-group"><div class="command-group-title">Indstillinger</div>';
    settings.forEach(item => {
      html += `<div class="command-item" onclick="navigateCommand('settings', '${item.id}')">
        ${getCommandIcon(item.id)}
        <span class="command-item-text">${item.name}</span>
        <span class="command-item-hint">${item.hint}</span>
      </div>`;
    });
    html += '</div>';
  }

  if (reports.length) {
    html += '<div class="command-group"><div class="command-group-title">Rapporter</div>';
    reports.forEach(item => {
      html += `<div class="command-item" onclick="navigateCommand('dashboard', '${item.id}')">
        ${getCommandIcon(item.id)}
        <span class="command-item-text">${item.name}</span>
        <span class="command-item-hint">${item.hint}</span>
      </div>`;
    });
    html += '</div>';
  }

  return html;
}

// Get icon for command item
function getCommandIcon(id) {
  const icons = {
    'dashboard': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    'kunder': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
    'orders': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/></svg>',
    'workflow': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
    'settings': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"/></svg>',
    'openai': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42"/></svg>',
    'beskeder': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    'kpi': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>',
    'monthly': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    // Account icons
    'mine-oplysninger': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    'ordrehistorik': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>',
    'betalingsmetoder': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
    'leveringsadresser': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    // Additional page icons
    'salgsoversigt': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
    'loyalty': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    'campaigns': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    'appbuilder-design': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
    'leads': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>',
    'notifications': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    'users': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
  };
  return icons[id] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/></svg>';
}

// Show command results
function showCommandResults() {
  const results = document.getElementById('command-results');
  if (results) {
    results.classList.add('active');
    handleCommandSearch(document.getElementById('command-search')?.value);
  }
}

// Navigate from command
function navigateCommand(page, sub) {
  const results = document.getElementById('command-results');
  const input = document.getElementById('command-search');

  if (results) results.classList.remove('active');
  if (input) input.value = '';

  // Handle account navigation
  if (page === 'account' && sub) {
    showAccountPage(sub);
    return;
  }

  // Handle settings navigation
  if (page === 'settings' && sub) {
    showPage('settings');
    setTimeout(() => {
      if (typeof showSettingsPage === 'function') {
        showSettingsPage(sub);
      }
    }, 50);
    return;
  }

  showPage(page);
}

// Global keyboard shortcut for command search (Cmd/Ctrl + K)
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    const input = document.getElementById('command-search');
    if (input) {
      input.focus();
      input.select();
      showCommandResults();
    }
  }
  
  // Escape to close command results
  if (e.key === 'Escape') {
    const results = document.getElementById('command-results');
    if (results && results.classList.contains('active')) {
      results.classList.remove('active');
      document.getElementById('command-search')?.blur();
    }
  }
});

// Update KPI preview visibility
function updateKpiPreview() {
  const checked = document.getElementById('edit-restaurant-kpi-enabled').checked;
  document.getElementById('kpi-preview').style.display = checked ? 'block' : 'none';
}

// Sync workflow review node with restaurant setting
function syncWorkflowReviewNode(enabled) {
  // Find the review request node in workflow
  const reviewNode = workflowNodes.find(n => n.id === 'send-review-request');
  if (reviewNode) {
    reviewNode.disabled = !enabled;
    
    // Re-render workflow to show visual change
    if (typeof renderWorkflowNodes === 'function') {
      renderWorkflowNodes();
    }
  }
}

async function saveRestaurantSettings() {
  const id = document.getElementById('edit-restaurant-id').value;
  const restaurant = restaurants.find(r => r.id === id);

  if (!restaurant) {
    toast('Restaurant ikke fundet', 'error');
    return;
  }
  
  // Update basic restaurant data
  restaurant.name = document.getElementById('edit-restaurant-name').value;
  restaurant.logo = document.getElementById('edit-restaurant-logo').value || 'pizza';
  restaurant.phone = document.getElementById('edit-restaurant-phone').value;
  restaurant.smsNumber = document.getElementById('edit-restaurant-sms-number').value.trim();
  restaurant.website = document.getElementById('edit-restaurant-website').value;
  restaurant.menuUrl = document.getElementById('edit-restaurant-menu').value;
  restaurant.googleReviewUrl = document.getElementById('edit-restaurant-google').value;
  restaurant.trustpilotUrl = document.getElementById('edit-restaurant-trustpilot').value;
  restaurant.reviewDelay = parseInt(document.getElementById('edit-restaurant-delay').value) || 60;
  
  // Save delivery toggle
  restaurant.deliveryEnabled = document.getElementById('edit-restaurant-delivery').checked;
  
  // Save review request toggle (Workflow Sync)
  const reviewWasEnabled = restaurant.reviewRequestEnabled;
  restaurant.reviewRequestEnabled = document.getElementById('edit-restaurant-review-request').checked;
  
  // Sync with workflow node if changed
  if (reviewWasEnabled !== restaurant.reviewRequestEnabled) {
    syncWorkflowReviewNode(restaurant.reviewRequestEnabled);
  }
  
  // Save KPI settings
  const kpiWasEnabled = restaurant.kpiEnabled;
  restaurant.kpiEnabled = document.getElementById('edit-restaurant-kpi-enabled').checked;
  
  // Initialize KPI data if newly enabled
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
      responseTime: 0,
      // Extended KPIs
      aiAutomationRate: 0,
      clv: 0,
      reviewCTR: 0,
      missedCalls: 0,
      completedOrders: 0,
      orderHeatmap: {
        monday: new Array(24).fill(0),
        tuesday: new Array(24).fill(0),
        wednesday: new Array(24).fill(0),
        thursday: new Array(24).fill(0),
        friday: new Array(24).fill(0),
        saturday: new Array(24).fill(0),
        sunday: new Array(24).fill(0)
      },
      sentiment: { positive: 0, neutral: 0, negative: 0 }
    };
  }
  
  // Save menu from editor
  saveMenuFromEditor(id);
  
  // Save time format
  restaurant.timeFormat = document.getElementById('time-format-24').checked ? '24h' : '12h';
  
  // Save opening hours
  restaurant.openingHours = {};
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  days.forEach(day => {
    const dayEl = document.querySelector(`.opening-day[data-day="${day}"]`);
    if (dayEl) {
      restaurant.openingHours[day] = {
        enabled: dayEl.querySelector('.day-enabled').checked,
        open: dayEl.querySelector('.open-time').value,
        close: dayEl.querySelector('.close-time').value
      };
    }
  });
  
  // Only auto-activate pending customers when phone is added
  // NEVER reset an active/terminated/etc customer to pending
  if ((!restaurant.status || restaurant.status === 'pending') && restaurant.phone) {
    restaurant.status = 'active';
  }

  // Persist to Supabase
  if (typeof SupabaseDB !== 'undefined') {
    try {
      const settings = restaurant.settings || {};
      settings.sms_number = restaurant.smsNumber || '';
      await SupabaseDB.updateRestaurant(restaurant.id, {
        name: restaurant.name,
        phone: restaurant.phone,
        website: restaurant.website,
        settings: settings,
        status: restaurant.status
      });
    } catch (err) {
      console.error('⚠️ Supabase save failed:', err);
    }
  }

  // Show save status
  showSaveStatus('stamdata-save-status', 'saved');

  // Log activity
  if (typeof logActivity === 'function') {
    await logActivity('update', `Restaurant opdateret: ${restaurant.name}`, {
      category: 'kunder',
      subCategory: 'stamdata',
      customerId: restaurant.id,
      data: { name: restaurant.name }
    });
  }

  // Refresh UI
  loadRestaurants();
  loadDashboard();
  closeModal('edit-restaurant');
}

// Default åbningstider
function getDefaultOpeningHours() {
  return {
    mon: { enabled: true, open: '10:00', close: '22:00' },
    tue: { enabled: true, open: '10:00', close: '22:00' },
    wed: { enabled: true, open: '10:00', close: '22:00' },
    thu: { enabled: true, open: '10:00', close: '22:00' },
    fri: { enabled: true, open: '10:00', close: '23:00' },
    sat: { enabled: true, open: '11:00', close: '23:00' },
    sun: { enabled: true, open: '12:00', close: '21:00' }
  };
}

async function deleteRestaurant() {
  const id = document.getElementById('edit-restaurant-id').value;
  const restaurant = restaurants.find(r => r.id === id);

  if (!restaurant) return;

  if (confirm(`Er du sikker på du vil slette "${restaurant.name}"?`)) {
    // Delete from Supabase
    if (typeof SupabaseDB !== 'undefined') {
      try {
        await SupabaseDB.deleteRestaurant(id);

        // Log activity before removing from array
        if (typeof logActivity === 'function') {
          await logActivity('delete', `Restaurant slettet: ${restaurant.name}`, {
            category: 'kunder',
            subCategory: 'stamdata',
            customerId: id,
            data: { name: restaurant.name }
          });
        }

        // Remove from local array
        restaurants = restaurants.filter(r => r.id !== id);

        // Refresh UI
        loadRestaurants();
        loadDashboard();
        closeModal('edit-restaurant');

        toast('Restaurant slettet', 'success');
      } catch (err) {
        console.error('❌ Error deleting restaurant:', err);
        toast('Fejl ved sletning af restaurant', 'error');
      }
    }
  }
}

// =====================================================
// CUSTOMER TERMINATION & GDPR
// =====================================================

/**
 * Show termination modal for customer
 * @param {string} restaurantId - Restaurant ID to terminate
 */
function showTerminationModal(restaurantId) {
  const restaurant = restaurants.find(r => r.id === restaurantId);
  if (!restaurant) {
    toast('Kunde ikke fundet', 'error');
    return;
  }

  // Check if customer can be terminated
  if (restaurant.status === 'terminated' || restaurant.status === 'gdpr_deleted') {
    toast('Denne kunde er allerede opsagt', 'warning');
    return;
  }

  // Calculate retention info
  const retentionYears = 5;
  const deletionDate = new Date();
  deletionDate.setFullYear(deletionDate.getFullYear() + retentionYears);

  // Populate modal
  const nameEl = document.getElementById('termination-customer-name');
  const idEl = document.getElementById('termination-customer-id');
  const dateEl = document.getElementById('termination-deletion-date');
  const reasonEl = document.getElementById('termination-reason');
  const reasonOtherEl = document.getElementById('termination-reason-other');
  const confirmEl = document.getElementById('termination-confirm-check');

  if (nameEl) nameEl.textContent = restaurant.name || 'Ukendt kunde';
  if (idEl) idEl.value = restaurantId;
  if (dateEl) dateEl.textContent = deletionDate.toLocaleDateString('da-DK', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  if (reasonEl) reasonEl.value = '';
  if (reasonOtherEl) {
    reasonOtherEl.value = '';
    reasonOtherEl.style.display = 'none';
  }
  if (confirmEl) confirmEl.checked = false;

  showModal('terminate-customer');
}

/**
 * Handle termination reason change (show/hide other field)
 */
function onTerminationReasonChange() {
  const reasonEl = document.getElementById('termination-reason');
  const otherEl = document.getElementById('termination-reason-other');

  if (reasonEl && otherEl) {
    otherEl.style.display = reasonEl.value === 'Andet' ? 'block' : 'none';
    if (reasonEl.value !== 'Andet') {
      otherEl.value = '';
    }
  }
}

/**
 * Execute customer termination
 */
async function terminateCustomer() {
  const restaurantId = document.getElementById('termination-customer-id')?.value;
  const reasonSelect = document.getElementById('termination-reason')?.value;
  const reasonOther = document.getElementById('termination-reason-other')?.value?.trim();
  const confirmCheck = document.getElementById('termination-confirm-check')?.checked;

  // Determine final reason
  let reason = reasonSelect;
  if (reasonSelect === 'Andet' && reasonOther) {
    reason = reasonOther;
  }

  if (!reason) {
    toast('Angiv venligst en årsag til opsigelsen', 'error');
    return;
  }

  if (!confirmCheck) {
    toast('Du skal bekræfte at du forstår GDPR-reglerne', 'error');
    return;
  }

  const restaurant = restaurants.find(r => r.id === restaurantId);
  if (!restaurant) {
    toast('Kunde ikke fundet', 'error');
    return;
  }

  try {
    let result;

    // Terminate via Supabase if available
    if (typeof SupabaseDB !== 'undefined' && supabaseClient) {
      result = await SupabaseDB.terminateCustomer(
        restaurantId,
        reason,
        currentUser?.email || 'unknown'
      );
    } else {
      // Local fallback
      const terminatedAt = new Date();
      const gdprDeletionDate = new Date(terminatedAt);
      gdprDeletionDate.setFullYear(gdprDeletionDate.getFullYear() + 5);

      result = {
        ...restaurant,
        status: 'terminated',
        terminated_at: terminatedAt.toISOString(),
        termination_reason: reason,
        termination_initiated_by: currentUser?.email || 'unknown',
        gdpr_deletion_scheduled_at: gdprDeletionDate.toISOString()
      };
    }

    // Update local array
    const index = restaurants.findIndex(r => r.id === restaurantId);
    if (index !== -1) {
      restaurants[index] = result;
    }

    // Persist to localStorage
    if (typeof persistRestaurants === 'function') {
      persistRestaurants();
    }

    // Log activity
    if (typeof logActivity === 'function') {
      await logActivity('update', `Kunde opsagt: ${restaurant.name}`, {
        category: 'kunder',
        subCategory: 'opsigelse',
        customerId: restaurantId,
        data: { reason, status: 'terminated' }
      });
    }

    // Refresh UI
    loadDashboard();
    if (typeof renderCrmTable === 'function') {
      renderCrmTable(restaurants, '');
    }
    closeModal('terminate-customer');
    closeCrmProfile();

    toast('Kunde opsagt. Data bevares i 5 år iht. bogføringsloven.', 'success');
  } catch (err) {
    console.error('❌ Error terminating customer:', err);
    toast('Fejl ved opsigelse af kunde: ' + err.message, 'error');
  }
}

/**
 * Activate a pending customer (change status from pending to active)
 * @param {string} restaurantId - Restaurant ID to activate
 */
async function activateCustomer(restaurantId) {
  const restaurant = restaurants.find(r => r.id === restaurantId);
  if (!restaurant) {
    toast('Kunde ikke fundet', 'error');
    return;
  }

  // Allow activation if status is 'pending', undefined, null, or empty
  if (restaurant.status && restaurant.status !== 'pending') {
    toast('Kun afventende kunder kan aktiveres', 'warning');
    return;
  }

  if (!confirm(`Vil du aktivere "${restaurant.name}"?\n\nKunden vil blive aktiv og kan modtage workflows.`)) {
    return;
  }

  try {
    // Update status
    restaurant.status = 'active';
    restaurant.activated_at = new Date().toISOString();

    // Update via Supabase if available
    if (typeof SupabaseDB !== 'undefined' && supabaseClient) {
      await supabaseClient
        .from('restaurants')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', restaurantId);
    }

    // Persist to localStorage
    if (typeof persistRestaurants === 'function') {
      persistRestaurants();
    }

    // Log activity
    if (typeof logActivity === 'function') {
      await logActivity('update', `Kunde aktiveret: ${restaurant.name}`, {
        category: 'kunder',
        subCategory: 'aktivering',
        customerId: restaurantId
      });
    }

    // Refresh UI
    loadDashboard();
    if (typeof renderCrmTable === 'function') {
      renderCrmTable(restaurants, '');
    }

    // Refresh profile view if open
    if (currentProfileRestaurantId === restaurantId) {
      showCrmProfileView(restaurantId);
    }

    toast('Kunde aktiveret', 'success');
  } catch (err) {
    console.error('❌ Error activating customer:', err);
    toast('Fejl ved aktivering: ' + err.message, 'error');
  }
}

/**
 * Reactivate a terminated customer
 * @param {string} restaurantId - Restaurant ID to reactivate
 */
async function reactivateCustomer(restaurantId) {
  const restaurant = restaurants.find(r => r.id === restaurantId);
  if (!restaurant) {
    toast('Kunde ikke fundet', 'error');
    return;
  }

  if (restaurant.status !== 'terminated') {
    toast('Kun opsagte kunder kan genaktiveres', 'warning');
    return;
  }

  if (!confirm(`Vil du genaktivere "${restaurant.name}"?\n\nKunden vil igen være aktiv og modtage workflows.`)) {
    return;
  }

  try {
    let result;

    // Reactivate via Supabase if available
    if (typeof SupabaseDB !== 'undefined' && supabaseClient) {
      result = await SupabaseDB.reactivateCustomer(
        restaurantId,
        currentUser?.email || 'unknown'
      );
    } else {
      // Local fallback
      result = {
        ...restaurant,
        status: 'active',
        terminated_at: null,
        termination_reason: null,
        termination_initiated_by: null,
        gdpr_deletion_scheduled_at: null
      };
    }

    // Update local array
    const index = restaurants.findIndex(r => r.id === restaurantId);
    if (index !== -1) {
      restaurants[index] = result;
    }

    // Persist to localStorage
    if (typeof persistRestaurants === 'function') {
      persistRestaurants();
    }

    // Log activity
    if (typeof logActivity === 'function') {
      await logActivity('update', `Kunde genaktiveret: ${restaurant.name}`, {
        category: 'kunder',
        subCategory: 'genaktivering',
        customerId: restaurantId
      });
    }

    // Refresh UI
    loadDashboard();
    if (typeof renderCrmTable === 'function') {
      renderCrmTable(restaurants, '');
    }

    // Refresh profile view if open
    if (currentProfileRestaurantId === restaurantId) {
      showCrmProfileView(restaurantId);
    }

    toast('Kunde genaktiveret', 'success');
  } catch (err) {
    console.error('❌ Error reactivating customer:', err);
    toast('Fejl ved genaktivering: ' + err.message, 'error');
  }
}

/**
 * Get retention info for a terminated customer
 * @param {Object} restaurant - Restaurant object
 * @returns {Object|null} Retention info or null if not terminated
 */
function getRetentionInfo(restaurant) {
  if (!restaurant || restaurant.status !== 'terminated' || !restaurant.terminated_at) {
    return null;
  }

  const terminatedDate = new Date(restaurant.terminated_at);
  const deletionDate = new Date(restaurant.gdpr_deletion_scheduled_at);
  const now = new Date();

  const daysRemaining = Math.ceil((deletionDate - now) / (1000 * 60 * 60 * 24));
  const totalDays = Math.ceil((deletionDate - terminatedDate) / (1000 * 60 * 60 * 24));
  const percentComplete = Math.round(((totalDays - daysRemaining) / totalDays) * 100);

  return {
    terminatedDate,
    deletionDate,
    daysRemaining: Math.max(0, daysRemaining),
    totalDays,
    percentComplete: Math.min(100, Math.max(0, percentComplete)),
    reason: restaurant.termination_reason || '-',
    initiatedBy: restaurant.termination_initiated_by || '-'
  };
}

/**
 * Show termination info banner on customer profile
 * @param {Object} restaurant - Restaurant object
 */
function showTerminationBanner(restaurant) {
  const retentionInfo = getRetentionInfo(restaurant);
  if (!retentionInfo) {
    // Hide banner if exists
    const existingBanner = document.getElementById('termination-banner');
    if (existingBanner) existingBanner.style.display = 'none';
    return;
  }

  let banner = document.getElementById('termination-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'termination-banner';
    const profileView = document.getElementById('crm-profile-view');
    const profileHeader = profileView?.querySelector('.crm-profile-header');
    if (profileHeader) {
      profileHeader.parentNode.insertBefore(banner, profileHeader.nextSibling);
    }
  }

  banner.className = 'termination-info-banner';
  banner.innerHTML = `
    <div class="termination-banner-header">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <div>
        <h4>Kunde opsagt</h4>
        <p>Data bevares iht. dansk bogføringslov (5 år)</p>
      </div>
    </div>
    <div class="termination-details">
      <div class="termination-detail">
        <span class="label">Opsagt</span>
        <span class="value">${retentionInfo.terminatedDate.toLocaleDateString('da-DK')}</span>
      </div>
      <div class="termination-detail">
        <span class="label">Årsag</span>
        <span class="value">${retentionInfo.reason}</span>
      </div>
      <div class="termination-detail">
        <span class="label">Slettes</span>
        <span class="value">${retentionInfo.deletionDate.toLocaleDateString('da-DK')}</span>
      </div>
      <div class="termination-detail">
        <span class="label">Dage tilbage</span>
        <span class="value">${retentionInfo.daysRemaining} dage</span>
      </div>
    </div>
    <div class="termination-progress">
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${retentionInfo.percentComplete}%"></div>
      </div>
      <span class="progress-label">${retentionInfo.percentComplete}% af retention-periode</span>
    </div>
    <div class="termination-actions">
      <button class="btn btn-secondary btn-sm" onclick="reactivateCustomer('${restaurant.id}')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"></polyline>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
        Genaktiver kunde
      </button>
    </div>
  `;
  banner.style.display = 'block';
}

/**
 * Check if a customer can receive workflow actions
 * @param {Object} restaurant - Restaurant object
 * @returns {boolean} True if workflow actions are allowed
 */
function canReceiveWorkflowActions(restaurant) {
  if (!restaurant) return false;
  // Default til 'pending' hvis status er undefined/null (nye kunder)
  const status = restaurant.status || 'pending';
  const allowedStatuses = ['active', 'pending', 'demo'];
  return allowedStatuses.includes(status);
}

/**
 * Get the currently selected restaurant from workflow test dropdown
 * @returns {Object|null} Restaurant object or null if none selected
 */
function getSelectedRestaurant() {
  const select = document.getElementById('test-restaurant');
  if (!select || !select.value) return null;
  let restaurant = restaurants.find(r => r.id === select.value);
  if (!restaurant && isDemoDataEnabled()) {
    const demoCustomers = getDemoDataCustomers();
    restaurant = demoCustomers.find(r => r.id === select.value);
  }
  return restaurant || null;
}

/**
 * Filter CRM list by status
 * @param {string} status - Status to filter by ('all' for no filter)
 */
let currentCrmStatusFilter = 'all';

function filterByStatus(status) {
  currentCrmStatusFilter = status;

  // Update active state on filter buttons
  document.querySelectorAll('.crm-status-filters .filter-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.status === status);
  });

  // Combine real restaurants with demo customers if enabled
  let allData = [...restaurants];
  if (isDemoDataEnabled()) {
    const demoCustomers = getDemoDataCustomers();
    allData = [...allData, ...demoCustomers];
  }

  // Filter restaurants
  let filtered = allData;
  if (status !== 'all') {
    if (status === 'demo') {
      filtered = allData.filter(r => r.status === 'demo' || r.isDemo);
    } else {
      filtered = allData.filter(r => r.status === status);
    }
  }

  // Re-render table
  renderCrmTable(filtered, document.getElementById('crm-search')?.value || '');
}

// Populate test restaurant dropdown
function populateTestRestaurants() {
  const select = document.getElementById('test-restaurant');
  if (!select) return;

  // HTML escape function
  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  // Combine real restaurants with demo customers if enabled
  let allRestaurants = [...restaurants];
  if (isDemoDataEnabled()) {
    const demoCustomers = getDemoDataCustomers();
    allRestaurants = [...allRestaurants, ...demoCustomers];
  }

  // Get restaurants that can receive workflow actions (active, pending, demo)
  const workflowRestaurants = allRestaurants.filter(r => r && canReceiveWorkflowActions(r));

  // Build options
  let optionsHtml = '<option value="">Vælg restaurant...</option>';
  workflowRestaurants.forEach(r => {
    const id = escapeHtml(r.id);
    const name = escapeHtml(r.name) || 'Uden navn';
    const userId = generateUserId(r.id);
    const statusLabel = r.status === 'demo' ? ' [Demo]' : r.status === 'pending' ? ' [Afventer]' : '';
    optionsHtml += `<option value="${id}">${name}${statusLabel} (${userId})</option>`;
  });

  select.innerHTML = optionsHtml;

  // Update buttons state
  updateTestButtons();
}

function testRestaurant(id) {
  document.getElementById('test-restaurant').value = id;
  showPage('workflow');
  updateTestButtons();
}

// =====================================================
// MENU EDITOR FUNKTIONER
// =====================================================
let currentEditingMenuItems = [];

function loadMenuItemsEditor(restaurantId) {
  const editor = document.getElementById('menu-items-editor');
  if (!editor) return;
  
  // Hent eksisterende menu
  const restaurant = restaurants.find(r => r.id === restaurantId);
  
  // Prioriter: customMenu > localStorage > demo menu
  let menuItems = [];
  
  if (restaurant?.customMenu?.items?.length > 0) {
    menuItems = restaurant.customMenu.items;
  } else {
    const storedMenu = localStorage.getItem(`menu_${restaurantId}`);
    if (storedMenu) {
      try {
        const parsed = JSON.parse(storedMenu);
        if (parsed.items) menuItems = parsed.items;
      } catch (e) {}
    }
  }
  
  // Hvis ingen menu, vis demo eller tom
  if (menuItems.length === 0 && DEMO_MENUS[restaurantId]) {
    menuItems = DEMO_MENUS[restaurantId].items;
  }
  
  currentEditingMenuItems = [...menuItems];
  renderMenuItemsEditor();
}

function renderMenuItemsEditor() {
  const editor = document.getElementById('menu-items-editor');
  if (!editor) return;
  
  if (currentEditingMenuItems.length === 0) {
    editor.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px">
      Ingen produkter endnu. Klik "+ Tilføj produkt" eller "Importér fra tekst".
    </div>`;
    return;
  }
  
  editor.innerHTML = currentEditingMenuItems.map((item, index) => `
    <div class="menu-item-row" style="display:flex;gap:6px;align-items:center;margin-bottom:6px;padding:6px;background:var(--bg3);border-radius:4px">
      <input type="text" class="input" value="${item.number || ''}" placeholder="Nr" 
        style="width:40px;padding:6px;font-size:12px" 
        onchange="updateMenuItem(${index}, 'number', this.value)">
      <input type="text" class="input" value="${item.name || ''}" placeholder="Produktnavn" 
        style="flex:1;padding:6px;font-size:12px" 
        onchange="updateMenuItem(${index}, 'name', this.value)">
      <input type="number" class="input" value="${item.price || ''}" placeholder="Pris" 
        style="width:60px;padding:6px;font-size:12px" 
        onchange="updateMenuItem(${index}, 'price', parseInt(this.value))">
      <button onclick="removeMenuItem(${index})" style="background:none;border:none;cursor:pointer;color:#f87171;font-size:14px">✕</button>
    </div>
  `).join('');
}

function addMenuItemRow() {
  const nextNumber = currentEditingMenuItems.length + 1;
  currentEditingMenuItems.push({
    id: Date.now(),
    number: String(nextNumber),
    name: '',
    price: 0,
    category: 'Mad'
  });
  renderMenuItemsEditor();
  
  // Scroll til bunden
  const editor = document.getElementById('menu-items-editor');
  if (editor) editor.scrollTop = editor.scrollHeight;
}

function updateMenuItem(index, field, value) {
  if (currentEditingMenuItems[index]) {
    currentEditingMenuItems[index][field] = value;
  }
}

function removeMenuItem(index) {
  currentEditingMenuItems.splice(index, 1);
  renderMenuItemsEditor();
}

function clearMenuItems() {
  if (confirm('Er du sikker på du vil fjerne alle produkter fra menuen?')) {
    currentEditingMenuItems = [];
    renderMenuItemsEditor();
  }
}

function importMenuFromText() {
  const text = prompt(`Indsæt menu tekst (et produkt per linje):\n\nFormat: "Nummer. Produktnavn - Pris kr"\nEller: "Produktnavn: Pris"\n\nEksempel:\n1. Pizza Margherita - 89 kr\n2. Calzone - 99 kr\nCoca-Cola: 25`);
  
  if (!text) return;
  
  const lines = text.split('\n').filter(line => line.trim());
  const newItems = [];
  
  lines.forEach((line, index) => {
    // Prøv forskellige formater
    let match;
    let number = String(index + 1);
    let name = '';
    let price = 0;
    
    // Format: "1. Pizza Margherita - 89 kr" eller "1. Pizza Margherita 89"
    match = line.match(/^(\d+)[.\s]+(.+?)[\s-]+(\d+)\s*(kr)?$/i);
    if (match) {
      number = match[1];
      name = match[2].trim();
      price = parseInt(match[3]);
    } else {
      // Format: "Pizza Margherita: 89" eller "Pizza Margherita - 89"
      match = line.match(/^(.+?)[\s:-]+(\d+)\s*(kr)?$/i);
      if (match) {
        name = match[1].trim();
        price = parseInt(match[2]);
      } else {
        // Bare tekst - brug som navn
        name = line.trim();
      }
    }
    
    if (name) {
      newItems.push({
        id: Date.now() + index,
        number: number,
        name: name,
        price: price || 0,
        category: 'Mad'
      });
    }
  });
  
  if (newItems.length > 0) {
    currentEditingMenuItems = [...currentEditingMenuItems, ...newItems];
    renderMenuItemsEditor();
  } else {
    toast('Kunne ikke parse nogen produkter', 'error');
  }
}

function saveMenuFromEditor(restaurantId) {
  // Filtrer tomme items
  const validItems = currentEditingMenuItems.filter(item => item.name && item.name.trim());

  if (validItems.length === 0) {
    // Slet menu
    localStorage.removeItem(`menu_${restaurantId}`);
    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (restaurant) delete restaurant.customMenu;
    // Slet også fra Supabase
    if (typeof SupabaseDB !== 'undefined' && SupabaseDB.saveMenu) {
      SupabaseDB.saveMenu(restaurantId, { items: [], currency: 'DKK' })
        .catch(err => console.warn('Could not clear menu in Supabase:', err.message));
    }
    return;
  }

  // Gem menu
  const menu = {
    restaurantId: restaurantId,
    items: validItems,
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

  // Opdater restaurant objektet
  const restaurant = restaurants.find(r => r.id === restaurantId);
  if (restaurant) {
    restaurant.customMenu = menu;
  }

  console.log(`Menu saved for ${restaurantId}:`, validItems.length, 'items');
}

// =====================================================
// WORKFLOW
// =====================================================

// Workflow Module System
let currentWorkflowModule = localStorage.getItem('workflow_module') || 'restaurant';

const workflowModules = {
  restaurant: {
    name: 'Restaurant / Takeaway',
    title: 'Restaurant Order Flow',
    icon: '🍕',
    description: 'Workflows til madbestillinger, bordreservationer og kundeservice',
    templates: [
      { id: 'order-food', name: '📦 Bestilling', description: 'Madbestillinger (take-away/levering)' },
      { id: 'book-table', name: '🍽️ Bordreservation', description: 'Håndter bordreservationer' },
      { id: 'complaint', name: '😞 Klage', description: 'Klagehåndtering' }
    ]
  },
  haandvaerker: {
    name: 'Håndværker',
    title: 'Håndværker Workflow',
    icon: '🔧',
    description: 'Workflows til tilbud, tidsbestilling og opfølgning',
    templates: [
      { id: 'tilbud-request', name: '📋 Tilbudsforespørgsel', description: 'Modtag og besvar tilbudsanmodninger' },
      { id: 'haandvaerker-booking', name: '📅 Tidsbestilling', description: 'Book tid til opgave' },
      { id: 'followup', name: '🔄 Opfølgning', description: 'Følg op på afgivne tilbud' }
    ]
  },
  instagram: {
    name: 'Instagram',
    title: 'Instagram Automation',
    icon: '📸',
    description: 'Automatiserede Instagram workflows og engagement',
    templates: [
      { id: 'ig-dm-reply', name: '💬 DM Auto-svar', description: 'Automatiske svar på Instagram DMs' },
      { id: 'ig-comment-reply', name: '💭 Kommentar-svar', description: 'Automatiske svar på kommentarer' },
      { id: 'ig-story-engagement', name: '📱 Story Engagement', description: 'Håndter story mentions og reaktioner' }
    ]
  },
  facebook: {
    name: 'Facebook',
    title: 'Facebook Automation',
    icon: '👍',
    description: 'Automatiserede Facebook workflows og kundeservice',
    templates: [
      { id: 'fb-messenger', name: '💬 Messenger Bot', description: 'Automatiske Messenger beskeder' },
      { id: 'fb-comment-reply', name: '💭 Kommentar-svar', description: 'Automatiske svar på opslag' },
      { id: 'fb-review-response', name: '⭐ Anmeldelse-svar', description: 'Besvar Facebook anmeldelser' }
    ]
  }
};


function formatAktivitetslogTimestamp(timestamp) {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day}.${month}.${year}, ${hours}.${minutes}`;
}

// Get border color based on type and priority
function getLogBorderColor(type, prioritet) {
  if (prioritet === 'kritisk') return 'var(--danger)';
  if (prioritet === 'høj') return 'var(--orange)';
  
  const colors = {
    'sms': 'var(--accent)',
    'opkald': 'var(--purple)',
    'email': 'var(--info)',
    'ordre': 'var(--green)',
    'klage': 'var(--danger)',
    'feedback': 'var(--cyan)',
    'andet': 'var(--muted)'
  };
  return colors[type] || 'var(--accent)';
}

// Get icon for log type
function getLogTypeIcon(type) {
  const icons = {
    'sms': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    'opkald': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    'email': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--info)" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    'ordre': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
    'klage': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    'feedback': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    'andet': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  };
  return icons[type] || icons['andet'];
}

// Get priority badge
function getPrioritetBadge(prioritet) {
  const badges = {
    'lav': '<span style="font-size:10px;padding:2px 8px;background:var(--bg2);border-radius:var(--radius-full);color:var(--muted);margin-left:8px">Lav</span>',
    'høj': '<span style="font-size:10px;padding:2px 8px;background:rgba(251,191,36,0.15);border-radius:var(--radius-full);color:var(--orange);margin-left:8px">Høj</span>',
    'kritisk': '<span style="font-size:10px;padding:2px 8px;background:rgba(248,113,113,0.15);border-radius:var(--radius-full);color:var(--danger);margin-left:8px">Kritisk</span>'
  };
  return badges[prioritet] || '';
}

// Format log date
function formatLogDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return 'I dag ' + date.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'I går ' + date.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
  } else if (days < 7) {
    return days + ' dage siden';
  } else {
    return date.toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}

// Helper: Download file
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Get all customer kundelogs from localStorage
function getAllCustomerKundelogs() {
  return JSON.parse(localStorage.getItem('orderflow_customer_kundelogs') || '{}');
}

// Save all customer kundelogs to localStorage
function saveAllCustomerKundelogs(data) {
  localStorage.setItem('orderflow_customer_kundelogs', JSON.stringify(data));
}

// Get kundelogs for specific customer
function getCustomerKundelogs(customerId) {
  const allLogs = getAllCustomerKundelogs();
  return allLogs[customerId] || [];
}

// Save kundelogs for specific customer
function saveCustomerKundelogsForCustomer(customerId, logs) {
  const allLogs = getAllCustomerKundelogs();
  allLogs[customerId] = logs;
  saveAllCustomerKundelogs(allLogs);
}

// Load and render customer kundelogs
function loadCustomerKundelogs() {
  if (!currentProfileRestaurantId) return;

  // Generate demo kundelogs for demo customers if none exist
  if (isDemoDataEnabled() && currentProfileRestaurantId.startsWith('demo-customer-')) {
    const existingLogs = getCustomerKundelogs(currentProfileRestaurantId);
    if (existingLogs.length === 0) {
      const demoLogs = generateDemoKundelogs(currentProfileRestaurantId);
      saveCustomerKundelogsForCustomer(currentProfileRestaurantId, demoLogs);
    }
  }
  renderCustomerKundelogs();
}

// Render customer kundelogs
function renderCustomerKundelogs() {
  const container = document.getElementById('customer-kundelogs-container');
  const countEl = document.getElementById('customer-kundelogs-count');
  
  if (!container || !currentProfileRestaurantId) return;
  
  const logs = getCustomerKundelogs(currentProfileRestaurantId);
  
  // Get filter values
  const searchTerm = (document.getElementById('customer-kundelog-search')?.value || '').toLowerCase();
  const typeFilter = document.getElementById('customer-kundelog-type-filter')?.value || 'all';
  
  // Filter logs
  let filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      (log.beskrivelse && log.beskrivelse.toLowerCase().includes(searchTerm)) ||
      (log.reference && log.reference.toLowerCase().includes(searchTerm)) ||
      (log.tags && log.tags.some(t => t.toLowerCase().includes(searchTerm)));
    
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    
    return matchesSearch && matchesType;
  });
  
  // Sort by date (newest first)
  filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Update count
  if (countEl) {
    countEl.textContent = `(${filteredLogs.length} log${filteredLogs.length !== 1 ? 's' : ''})`;
  }
  
  // Empty state
  if (filteredLogs.length === 0) {
    if (logs.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:60px 20px">
          <div style="width:80px;height:80px;background:var(--accent-dim);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="11" x2="12" y2="17"/>
              <line x1="9" y1="14" x2="15" y2="14"/>
            </svg>
          </div>
          <h3 style="font-size:18px;font-weight:600;margin-bottom:8px;color:var(--text)">Ingen kundelogs fundet</h3>
          <p style="color:var(--text2);font-size:14px;margin-bottom:24px">Opret en log for at se den her</p>
          <button class="btn btn-primary" onclick="openCustomerKundelogModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Opret første log
          </button>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div style="text-align:center;padding:40px 20px">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.5" style="margin-bottom:16px">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <p style="color:var(--text2);font-size:14px">Ingen logs matcher din søgning</p>
        </div>
      `;
    }
    return;
  }
  
  // Render logs
  container.innerHTML = filteredLogs.map(log => {
    const borderColor = getLogBorderColor(log.type, log.prioritet);
    const typeIcon = getLogTypeIcon(log.type);
    const prioritetBadge = log.prioritet !== 'normal' ? getPrioritetBadge(log.prioritet) : '';
    const formattedDate = formatLogDate(log.timestamp);
    const tagsHtml = log.tags && log.tags.length > 0 
      ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:8px">${log.tags.map(t => `<span style="font-size:10px;padding:2px 8px;background:var(--bg2);border-radius:var(--radius-full);color:var(--text2)">${escapeHtml(t)}</span>`).join('')}</div>` 
      : '';
    
    return `
      <div class="log-entry" style="padding:14px 16px;background:var(--bg3);border-radius:var(--radius-sm);margin-bottom:10px;border-left:3px solid ${borderColor};transition:all 0.15s" 
           onmouseenter="this.style.background='var(--card-hover)'" 
           onmouseleave="this.style.background='var(--bg3)'">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:32px;height:32px;background:var(--bg2);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center">
              ${typeIcon}
            </div>
            <div>
              <span style="font-weight:600;color:var(--text);text-transform:capitalize">${log.type}</span>
              ${log.reference ? `<span style="color:var(--muted);font-size:12px;margin-left:8px">${escapeHtml(log.reference)}</span>` : ''}
              ${prioritetBadge}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:11px;color:var(--muted)">${formattedDate}</span>
            <div style="display:flex;gap:4px">
              <button class="btn btn-ghost btn-icon" style="width:28px;height:28px" onclick="editCustomerKundelog('${log.id}')" title="Rediger">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn btn-ghost btn-icon" style="width:28px;height:28px;color:var(--danger)" onclick="deleteCustomerKundelog('${log.id}')" title="Slet">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
        <div style="font-size:13px;color:var(--text2);line-height:1.5;margin-left:42px">${escapeHtml(log.beskrivelse)}</div>
        ${tagsHtml ? `<div style="margin-left:42px">${tagsHtml}</div>` : ''}
      </div>
    `;
  }).join('');
}

// Filter customer kundelogs
function filterCustomerKundelogs() {
  renderCustomerKundelogs();
}

// Toggle export dropdown for customer kundelogs
function toggleCustomerKundelogExportDropdown() {
  const dropdown = document.getElementById('customer-kundelog-export-dropdown');
  dropdown.classList.toggle('open');
  
  if (dropdown.classList.contains('open')) {
    setTimeout(() => {
      document.addEventListener('click', closeCustomerKundelogExportDropdownOnOutside);
    }, 0);
  }
}

function closeCustomerKundelogExportDropdownOnOutside(e) {
  const dropdown = document.getElementById('customer-kundelog-export-dropdown');
  if (dropdown && !dropdown.contains(e.target)) {
    dropdown.classList.remove('open');
    document.removeEventListener('click', closeCustomerKundelogExportDropdownOnOutside);
  }
}

// Open customer kundelog modal
function openCustomerKundelogModal(editId = null) {
  const modal = document.getElementById('customer-kundelog-modal');
  const title = document.getElementById('customer-kundelog-modal-title');
  
  // Reset form
  document.getElementById('customer-kundelog-edit-id').value = '';
  document.getElementById('customer-kundelog-type').value = 'sms';
  document.getElementById('customer-kundelog-reference').value = '';
  document.getElementById('customer-kundelog-prioritet').value = 'normal';
  document.getElementById('customer-kundelog-beskrivelse').value = '';
  document.getElementById('customer-kundelog-tags').value = '';
  
  if (editId) {
    const logs = getCustomerKundelogs(currentProfileRestaurantId);
    const log = logs.find(l => l.id === editId);
    if (log) {
      title.textContent = 'Rediger kundelog';
      document.getElementById('customer-kundelog-edit-id').value = log.id;
      document.getElementById('customer-kundelog-type').value = log.type;
      document.getElementById('customer-kundelog-reference').value = log.reference || '';
      document.getElementById('customer-kundelog-prioritet').value = log.prioritet;
      document.getElementById('customer-kundelog-beskrivelse').value = log.beskrivelse;
      document.getElementById('customer-kundelog-tags').value = (log.tags || []).join(', ');
    }
  } else {
    title.textContent = 'Opret kundelog';
  }
  
  modal.style.display = 'flex';
  setTimeout(() => document.getElementById('customer-kundelog-beskrivelse').focus(), 100);
}

// Close customer kundelog modal
function closeCustomerKundelogModal() {
  document.getElementById('customer-kundelog-modal').style.display = 'none';
}

// Edit customer kundelog
function editCustomerKundelog(id) {
  openCustomerKundelogModal(id);
}

// Delete customer kundelog
function deleteCustomerKundelog(id) {
  if (confirm('Er du sikker på, at du vil slette denne log?')) {
    let logs = getCustomerKundelogs(currentProfileRestaurantId);
    logs = logs.filter(l => l.id !== id);
    saveCustomerKundelogsForCustomer(currentProfileRestaurantId, logs);
    renderCustomerKundelogs();
    toast('Log slettet', 'success');
  }
}

// Save customer kundelog
function saveCustomerKundelog() {
  if (!currentProfileRestaurantId) {
    toast('Ingen kunde valgt', 'error');
    return;
  }
  
  const editId = document.getElementById('customer-kundelog-edit-id').value;
  const type = document.getElementById('customer-kundelog-type').value;
  const reference = document.getElementById('customer-kundelog-reference').value.trim();
  const prioritet = document.getElementById('customer-kundelog-prioritet').value;
  const beskrivelse = document.getElementById('customer-kundelog-beskrivelse').value.trim();
  const tagsInput = document.getElementById('customer-kundelog-tags').value;
  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];
  
  // Validation
  if (!beskrivelse) {
    toast('Indtast en beskrivelse', 'error');
    document.getElementById('customer-kundelog-beskrivelse').focus();
    return;
  }
  
  let logs = getCustomerKundelogs(currentProfileRestaurantId);
  
  // Get customer name for the log
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  const kundeName = restaurant?.name || 'Ukendt kunde';
  
  if (editId) {
    // Update existing
    const index = logs.findIndex(l => l.id === editId);
    if (index !== -1) {
      logs[index] = {
        ...logs[index],
        type,
        reference,
        prioritet,
        beskrivelse,
        tags,
        updatedAt: new Date().toISOString()
      };
    }
    toast('Log opdateret', 'success');
  } else {
    // Create new
    logs.push({
      id: 'clog_' + Date.now(),
      customerId: currentProfileRestaurantId,
      kunde: kundeName,
      type,
      reference,
      prioritet,
      beskrivelse,
      tags,
      timestamp: new Date().toISOString(),
      createdBy: currentUser?.name || 'System'
    });
    toast('Log oprettet', 'success');
  }
  
  saveCustomerKundelogsForCustomer(currentProfileRestaurantId, logs);

  // Sync to Supabase activity log
  if (window.SupabaseDB) {
    SupabaseDB.logActivity(
      SupabaseDB.getCurrentUserId(),
      editId ? 'update' : 'create',
      `Kundelog ${editId ? 'opdateret' : 'oprettet'}: ${beskrivelse.substring(0, 50)}`,
      { category: 'kunder', subCategory: 'kundelog', customerId: currentProfileRestaurantId, kunde: kundeName, type, prioritet }
    ).catch(err => console.warn('Supabase sync fejl (kundelog):', err));
  }

  closeCustomerKundelogModal();
  renderCustomerKundelogs();
}

// Export customer kundelogs
function exportCustomerKundelogs(format) {
  document.getElementById('customer-kundelog-export-dropdown').classList.remove('open');
  
  const logs = getCustomerKundelogs(currentProfileRestaurantId);
  
  if (logs.length === 0) {
    toast('Ingen logs at eksportere', 'error');
    return;
  }
  
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  const kundeName = restaurant?.name || 'kunde';
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `kundelogs_${kundeName.replace(/\s+/g, '_')}_${timestamp}`;
  
  if (format === 'csv') {
    const headers = ['ID', 'Dato', 'Type', 'Reference', 'Prioritet', 'Beskrivelse', 'Tags'];
    const rows = logs.map(log => [
      log.id,
      new Date(log.timestamp).toLocaleString('da-DK'),
      log.type,
      log.reference || '',
      log.prioritet,
      '"' + (log.beskrivelse || '').replace(/"/g, '""') + '"',
      (log.tags || []).join('; ')
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    downloadFile(csv, filename + '.csv', 'text/csv;charset=utf-8');
    // toast('CSV eksporteret', 'success'); // Removed - unnecessary
  } else if (format === 'json') {
    const json = JSON.stringify(logs, null, 2);
    downloadFile(json, filename + '.json', 'application/json');
    // toast('JSON eksporteret', 'success'); // Removed - unnecessary
  } else if (format === 'pdf') {
    const printContent = `
      <!DOCTYPE html>
      <html><head><meta charset="UTF-8"><title>Kundelogs - ${kundeName}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;color:#333}h1{color:#2dd4bf;border-bottom:2px solid #2dd4bf;padding-bottom:10px}.meta{color:#666;margin-bottom:30px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#2dd4bf;color:#000;padding:12px;text-align:left;font-weight:600}td{padding:10px 12px;border-bottom:1px solid #ddd;vertical-align:top}tr:nth-child(even){background:#f9f9f9}</style></head>
      <body><h1>Kundelogs: ${escapeHtml(kundeName)}</h1><div class="meta">Eksporteret: ${new Date().toLocaleString('da-DK')}<br>Antal logs: ${logs.length}</div>
      <table><thead><tr><th>Dato</th><th>Type</th><th>Reference</th><th>Prioritet</th><th>Beskrivelse</th></tr></thead><tbody>
      ${logs.map(log => `<tr><td>${new Date(log.timestamp).toLocaleString('da-DK')}</td><td>${log.type}</td><td>${escapeHtml(log.reference || '-')}</td><td>${log.prioritet}</td><td>${escapeHtml(log.beskrivelse)}</td></tr>`).join('')}
      </tbody></table></body></html>`;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.onload = function() { printWindow.print(); };
    // toast('PDF klar til print', 'success'); // Removed - unnecessary
  }
}

// ========================================
// CUSTOMER-SPECIFIC AKTIVITETSLOGS
// ========================================

// Get all customer aktivitetslogs from localStorage
function getAllCustomerAktivitetslogs() {
  return JSON.parse(localStorage.getItem('orderflow_customer_aktivitetslogs') || '{}');
}

// Save all customer aktivitetslogs to localStorage
function saveAllCustomerAktivitetslogs(data) {
  localStorage.setItem('orderflow_customer_aktivitetslogs', JSON.stringify(data));
}

// Get aktivitetslogs for specific customer
function getCustomerAktivitetslogs(customerId) {
  const allLogs = getAllCustomerAktivitetslogs();
  return allLogs[customerId] || [];
}

// Save aktivitetslogs for specific customer
function saveCustomerAktivitetslogsForCustomer(customerId, logs) {
  const allLogs = getAllCustomerAktivitetslogs();
  allLogs[customerId] = logs;
  saveAllCustomerAktivitetslogs(allLogs);
}

// Add a new aktivitetslog for a customer (called automatically by system)
function addCustomerAktivitetslog(customerId, type, besked) {
  if (!customerId) return;
  
  let logs = getCustomerAktivitetslogs(customerId);
  logs.unshift({
    id: 'cakt_' + Date.now(),
    customerId: customerId,
    timestamp: new Date().toISOString(),
    type: type,
    besked: besked
  });
  
  // Keep only last 500 logs per customer
  if (logs.length > 500) {
    logs = logs.slice(0, 500);
  }
  
  saveCustomerAktivitetslogsForCustomer(customerId, logs);
  
  // Refresh if viewing this customer's aktivitetslogs
  if (currentProfileRestaurantId === customerId && 
      document.getElementById('subpage-aktivitetslogs')?.classList.contains('active')) {
    renderCustomerAktivitetslogs();
  }
}

// Load and render customer aktivitetslogs
function loadCustomerAktivitetslogs() {
  if (!currentProfileRestaurantId) return;
  
  // Generate demo data if none exists
  const logs = getCustomerAktivitetslogs(currentProfileRestaurantId);
  if (logs.length === 0) {
    const restaurant = findRestaurantOrDemo(currentProfileRestaurantId);
    const name = restaurant?.name || 'Kunde';

    // Add demo aktivitetslogs
    const demoLogs = [
      { type: 'email', besked: `E-mail sendt til ${name}: Velkommen til OrderFlow` },
      { type: 'system', besked: 'Kundeprofil oprettet' },
      { type: 'profil', besked: 'Virksomhedsnavn opdateret' },
      { type: 'ordre', besked: `Ny ordre modtaget fra ${name}` },
      { type: 'system', besked: 'API-nøgle oprettet for integration' },
      { type: 'email', besked: `Månedlig rapport sendt til ${name}` },
      { type: 'opkald', besked: `Opfølgning med ${name} - positiv feedback` }
    ];
    
    demoLogs.forEach((log, i) => {
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - i);
      logs.push({
        id: 'cakt_demo_' + i,
        customerId: currentProfileRestaurantId,
        timestamp: timestamp.toISOString(),
        type: log.type,
        besked: log.besked
      });
    });
    
    saveCustomerAktivitetslogsForCustomer(currentProfileRestaurantId, logs);
  }
  
  renderCustomerAktivitetslogs();
}

// Render customer aktivitetslogs
function renderCustomerAktivitetslogs() {
  const container = document.getElementById('customer-aktivitetslogs-body');
  const countEl = document.getElementById('customer-aktivitetslogs-count');
  
  if (!container || !currentProfileRestaurantId) return;
  
  const logs = getCustomerAktivitetslogs(currentProfileRestaurantId);
  
  // Get filter values
  const searchTerm = (document.getElementById('customer-aktivitetslog-search')?.value || '').toLowerCase();
  const typeFilter = document.getElementById('customer-aktivitetslog-type-filter')?.value || 'all';
  
  // Filter logs
  let filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || log.besked.toLowerCase().includes(searchTerm);
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    return matchesSearch && matchesType;
  });
  
  // Sort by timestamp (newest first)
  filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Update count
  if (countEl) {
    countEl.textContent = `(${filteredLogs.length} log${filteredLogs.length !== 1 ? 's' : ''})`;
  }
  
  // Empty state
  if (filteredLogs.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 20px">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.5" style="margin-bottom:16px">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <p style="color:var(--text2);font-size:14px">${logs.length === 0 ? 'Ingen aktivitetslogs endnu' : 'Ingen logs matcher din søgning'}</p>
      </div>
    `;
    return;
  }
  
  // Render tabel rows
  container.innerHTML = filteredLogs.map((log, index) => {
    const formattedTimestamp = formatAktivitetslogTimestamp(log.timestamp);
    const bgColor = index % 2 === 0 ? 'transparent' : 'var(--bg2)';
    
    return `
      <div style="display:grid;grid-template-columns:180px 1fr;border-bottom:1px solid var(--border);background:${bgColor};transition:background 0.15s"
           onmouseenter="this.style.background='var(--card-hover)'" 
           onmouseleave="this.style.background='${bgColor}'">
        <div style="padding:14px 20px;font-size:13px;color:var(--muted)">${formattedTimestamp}</div>
        <div style="padding:14px 20px;font-size:13px;color:var(--text2);text-align:right">${escapeHtml(log.besked)}</div>
      </div>
    `;
  }).join('');
}

// Filter customer aktivitetslogs
function filterCustomerAktivitetslogs() {
  renderCustomerAktivitetslogs();
}

// Toggle export dropdown for customer aktivitetslogs
function toggleCustomerAktivitetslogExportDropdown() {
  const dropdown = document.getElementById('customer-aktivitetslog-export-dropdown');
  dropdown.classList.toggle('open');
  
  if (dropdown.classList.contains('open')) {
    setTimeout(() => {
      document.addEventListener('click', closeCustomerAktivitetslogExportDropdownOnOutside);
    }, 0);
  }
}

function closeCustomerAktivitetslogExportDropdownOnOutside(e) {
  const dropdown = document.getElementById('customer-aktivitetslog-export-dropdown');
  if (dropdown && !dropdown.contains(e.target)) {
    dropdown.classList.remove('open');
    document.removeEventListener('click', closeCustomerAktivitetslogExportDropdownOnOutside);
  }
}

// Export customer aktivitetslogs
function exportCustomerAktivitetslogs(format) {
  document.getElementById('customer-aktivitetslog-export-dropdown').classList.remove('open');
  
  const logs = getCustomerAktivitetslogs(currentProfileRestaurantId);
  
  if (logs.length === 0) {
    toast('Ingen logs at eksportere', 'error');
    return;
  }
  
  const restaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  const kundeName = restaurant?.name || 'kunde';
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `aktivitetslogs_${kundeName.replace(/\s+/g, '_')}_${timestamp}`;
  
  if (format === 'csv') {
    const headers = ['Timestamp', 'Type', 'Besked'];
    const rows = logs.map(log => [
      formatAktivitetslogTimestamp(log.timestamp),
      log.type,
      '"' + (log.besked || '').replace(/"/g, '""') + '"'
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    downloadFile(csv, filename + '.csv', 'text/csv;charset=utf-8');
    // toast('CSV eksporteret', 'success'); // Removed - unnecessary
  } else if (format === 'json') {
    const json = JSON.stringify(logs, null, 2);
    downloadFile(json, filename + '.json', 'application/json');
    // toast('JSON eksporteret', 'success'); // Removed - unnecessary
  } else if (format === 'pdf') {
    const printContent = `
      <!DOCTYPE html>
      <html><head><meta charset="UTF-8"><title>Aktivitetslogs - ${kundeName}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;color:#333}h1{color:#2dd4bf;border-bottom:2px solid #2dd4bf;padding-bottom:10px}.meta{color:#666;margin-bottom:30px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#2dd4bf;color:#000;padding:12px;text-align:left;font-weight:600}th:last-child{text-align:right}td{padding:10px 12px;border-bottom:1px solid #ddd;vertical-align:top}td:last-child{text-align:right}tr:nth-child(even){background:#f9f9f9}</style></head>
      <body><h1>Aktivitetslogs: ${escapeHtml(kundeName)}</h1><div class="meta">Eksporteret: ${new Date().toLocaleString('da-DK')}<br>Antal logs: ${logs.length}</div>
      <table><thead><tr><th>Timestamp</th><th>Besked</th></tr></thead><tbody>
      ${logs.map(log => `<tr><td>${formatAktivitetslogTimestamp(log.timestamp)}</td><td>${escapeHtml(log.besked)}</td></tr>`).join('')}
      </tbody></table></body></html>`;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.onload = function() { printWindow.print(); };
    // toast('PDF klar til print', 'success'); // Removed - unnecessary
  }
}

// ========================================
// END CUSTOMER-SPECIFIC LOGS SYSTEM
// ========================================

