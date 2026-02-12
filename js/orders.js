// FLOW Orders Module — orders, order history, filterOrders

function saveOrderToInternalOrdersPage(orderData) {
  addLog('📦 Gemmer ordre til Ordrer-siden...', 'info');
  
  // Byg ordre objekt til intern brug
  const order = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    status: 'Ny',
    customerName: orderData.customerName,
    phone: orderData.phone,
    orderType: orderData.orderType,
    address: orderData.address || null,
    items: orderData.items || [],
    orderSummary: orderData.orderSummary,
    totalPrice: orderData.totalPrice,
    currency: 'DKK',
    restaurantId: orderData.restaurantId,
    restaurantName: orderData.restaurantName
  };
  
  // Gem i localStorage (vises på Ordrer-siden)
  const existingOrders = JSON.parse(localStorage.getItem('orders_module') || '[]');
  existingOrders.unshift(order);
  localStorage.setItem('orders_module', JSON.stringify(existingOrders));
  
  addLog(`✅ Ordre #${order.id} gemt til Ordrer-siden`, 'success');
  
  // Opdater ordrer-siden hvis den er synlig
  if (document.getElementById('page-orders')?.classList.contains('active')) {
    loadOrdersPage();
  }
  
  return order;
}

// Subscribe to realtime order updates from Supabase
let ordersRealtimeSubscription = null;
function subscribeToOrderUpdates() {
  if (ordersRealtimeSubscription) return;
  if (!window.waitForSupabase) return;
  window.waitForSupabase().then(sb => {
    if (!sb) return;
    ordersRealtimeSubscription = sb
      .channel('unified-orders-admin')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'unified_orders' }, (payload) => {
        console.log('New order received via realtime:', payload.new?.order_number);
        loadOrdersPage._supaFetched = false;
        loadOrdersPage();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'unified_orders' }, () => {
        loadOrdersPage._supaFetched = false;
        loadOrdersPage();
      })
      .subscribe();
  });
}

// Fetch orders from Supabase unified_orders table
async function fetchUnifiedOrders() {
  try {
    if (!window.waitForSupabase) return [];
    const sb = await window.waitForSupabase();
    if (!sb) return [];

    const { data, error } = await sb
      .from('unified_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) { console.warn('fetchUnifiedOrders error:', error); return []; }

    // Map Supabase order format to admin display format
    const statusMap = {
      'draft': 'Ny', 'pending': 'Ny', 'confirmed': 'Accepteret',
      'preparing': 'I gang', 'ready': 'Færdig', 'completed': 'Færdig',
      'delivered': 'Færdig', 'cancelled': 'Afvist', 'refunded': 'Afvist'
    };

    return (data || []).map(o => ({
      id: Date.now() + Math.random(),
      supabaseId: o.id,
      orderNumber: o.order_number || '',
      customer: o.customer_name || o.customer_phone || 'Ukendt',
      phone: o.customer_phone || '',
      email: o.customer_email || '',
      items: (o.line_items || []).map(item => `${item.quantity}x ${item.name}`).join(', '),
      total: parseFloat(o.total) || 0,
      status: statusMap[o.status] || 'Ny',
      source: o.source_channel || 'web',
      type: o.fulfillment_type === 'delivery' ? 'Levering' : 'Afhentning',
      date: new Date(o.created_at).toLocaleString('da-DK'),
      paymentStatus: o.payment_status,
      paymentMethod: o.payment_method,
      notes: o.customer_notes || ''
    }));
  } catch (e) {
    console.warn('fetchUnifiedOrders failed:', e);
    return [];
  }
}

// Load og vis ordrer på Ordrer-siden
function loadOrdersPage() {
  // Start realtime subscription for live order updates
  subscribeToOrderUpdates();

  const ordersList = document.getElementById('orders-list');
  const ordersCount = document.getElementById('orders-count');
  let orders = JSON.parse(localStorage.getItem('orders_module') || '[]');

  // Add demo orders if enabled
  if (isDemoDataEnabled()) {
    const demoOrders = getDemoDataOrders();
    orders = [...orders, ...demoOrders];
  }

  // Also fetch from Supabase unified_orders (async, merges into localStorage)
  if (!loadOrdersPage._supaFetched) {
    loadOrdersPage._supaFetched = true;
    fetchUnifiedOrders().then(supaOrders => {
      if (supaOrders.length > 0) {
        const existing = JSON.parse(localStorage.getItem('orders_module') || '[]');
        const existingIds = new Set(existing.map(o => o.supabaseId || ''));
        const newOrders = supaOrders.filter(o => !existingIds.has(o.supabaseId));
        if (newOrders.length > 0) {
          const merged = [...newOrders, ...existing];
          localStorage.setItem('orders_module', JSON.stringify(merged));
          loadOrdersPage._supaFetched = false;
          loadOrdersPage(); // Re-render with new data
        }
      }
      loadOrdersPage._supaFetched = false;
    }).catch(() => { loadOrdersPage._supaFetched = false; });
  }
  
  if (ordersCount) {
    const newOrders = orders.filter(o => o.status === 'Ny').length;
    ordersCount.textContent = `${orders.length} ordre${orders.length !== 1 ? 'r' : ''}${newOrders > 0 ? ` (${newOrders} nye)` : ''}`;
  }
  
  if (orders.length === 0) {
    ordersList.innerHTML = `
      <div class="empty">
        <div class="empty-icon">📦</div>
        <div>Ingen ordrer endnu</div>
        <div style="font-size:12px;color:var(--muted);margin-top:8px">Ordrer vises her når kunder bestiller via SMS</div>
      </div>`;
    return;
  }
  
  ordersList.innerHTML = orders.map(order => {
    // Status farver (uden ikoner)
    const statusColors = {
      'Ny': { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24' },
      'Afventer': { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24' },
      'Accepteret': { bg: 'rgba(96,165,250,0.15)', color: '#60a5fa' },
      'I gang': { bg: 'rgba(168,85,247,0.15)', color: '#a855f7' },
      'Færdig': { bg: 'rgba(52,211,153,0.15)', color: '#34d399' },
      'Afvist': { bg: 'rgba(248,113,113,0.15)', color: '#f87171' }
    };
    const statusStyle = statusColors[order.status] || statusColors['Ny'];
    
    // Vis forskellige knapper baseret på status (uden emojis)
    let actionButtons = '';
    
    if (order.status === 'Ny' || order.status === 'Afventer') {
      // Ny/Afventer ordre: Accept/Afvis knapper
      actionButtons = `
        <button class="btn" style="flex:1;font-size:12px;background:#ef4444;color:#fff" onclick="rejectOrder(${order.id})">Afvis</button>
        <button class="btn btn-primary" style="flex:1;font-size:12px" onclick="acceptOrder(${order.id})">Accepter</button>
      `;
    } else if (order.status === 'Accepteret') {
      // Accepteret: Start knap
      actionButtons = `
        <button class="btn btn-secondary" style="flex:1;font-size:12px" onclick="startOrder(${order.id})">Start tilberedning</button>
      `;
    } else if (order.status === 'I gang') {
      // I gang: Færdig knap
      actionButtons = `
        <button class="btn btn-primary" style="flex:1;font-size:12px" onclick="completeOrder(${order.id})">Færdig</button>
        <button class="btn btn-secondary" style="font-size:12px;padding:6px 8px" onclick="manualPrintOrder(${order.id},'kitchen')" title="Print køkken-kvittering">🖨️</button>
      `;
    } else if (order.status === 'Færdig' || order.status === 'Afvist') {
      // Færdig/Afvist: Slet knap
      actionButtons = `
        <button class="btn btn-secondary" style="flex:1;font-size:12px" onclick="deleteOrder(${order.id})">Fjern</button>
      `;
    }
    
    return `
    <div class="order-item" data-channel="${order.channel || 'sms'}" data-status="${order.status || 'Ny'}" style="padding:16px;border:1px solid var(--border);border-radius:var(--radius-md);margin-bottom:12px;background:var(--card);${order.status === 'Ny' || order.status === 'Afventer' ? 'border-left:3px solid #fbbf24;' : ''}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <div>
          <div style="font-weight:600;font-size:15px">${order.customerName || 'Ukendt kunde'}</div>
          <div style="font-size:12px;color:var(--muted)">${order.phone || ''}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="display:inline-flex;align-items:center;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:500;background:${statusStyle.bg};color:${statusStyle.color}">
            ${order.status}
          </span>
          <span style="font-size:11px;color:var(--muted)">#${order.id}</span>
        </div>
      </div>
      <div style="background:var(--bg3);padding:12px;border-radius:var(--radius-sm);margin-bottom:12px">
        <div style="font-size:13px;margin-bottom:8px"><strong>Ordre:</strong> ${order.orderSummary}</div>
        <div style="font-size:14px;color:var(--accent);font-weight:600">Total: ${order.totalPrice || 0} kr</div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text2);margin-bottom:12px">
        <span>${order.orderType === 'Delivery' ? 'Levering' : 'Afhentning'}${order.address ? ': ' + order.address : ''}</span>
        <span>${new Date(order.timestamp).toLocaleString('da-DK')}</span>
      </div>
      <div style="display:flex;gap:8px">
        ${actionButtons}
      </div>
    </div>
  `}).join('');
}

// Filter orders by channel and status dropdowns
function filterOrders() {
  const channel = document.getElementById('orders-filter-channel')?.value || 'all';
  const status = document.getElementById('orders-filter-status')?.value || 'all';
  const items = document.querySelectorAll('#orders-list .order-item');
  let visible = 0;
  items.forEach(item => {
    const matchChannel = channel === 'all' || item.dataset.channel === channel;
    const matchStatus = status === 'all' || item.dataset.status === status;
    if (matchChannel && matchStatus) {
      item.style.display = '';
      visible++;
    } else {
      item.style.display = 'none';
    }
  });
  const countEl = document.getElementById('orders-count');
  if (countEl) {
    countEl.textContent = `${visible} ordre${visible !== 1 ? 'r' : ''} vist`;
  }
}

// ACCEPT ordre - sender bekræftelses-SMS
async function acceptOrder(orderId) {
  const orders = JSON.parse(localStorage.getItem('orders_module') || '[]');
  // Fix: Compare as strings to handle type mismatch
  const order = orders.find(o => String(o.id) === String(orderId));
  
  if (!order) {
    console.error('Order not found:', orderId);
    toast('Ordre ikke fundet', 'error');
    return;
  }
  
  // Find restaurant for SMS
  const restaurant = restaurants.find(r => r.id === order.restaurantId) || restaurants[0];
  
  // Get custom message or use default
  const defaultMsg = `Din ordre er bekræftet! ${restaurant?.name || 'Restauranten'} har modtaget din bestilling og går straks i gang. Vi sender besked, når maden er klar.`;
  let message = restaurant?.customMessages?.orderAccepted || defaultMsg;
  
  // Send bekræftelses-SMS til kunden
  if (order.phone) {
    try {
      await sendSMSToCustomer(order.phone, message, restaurant);
      toast(`SMS sendt til ${order.customerName}`, 'success');
    } catch (err) {
      console.error('SMS fejl:', err);
    }
  }
  
  // Opdater status
  order.status = 'Accepteret';
  order.acceptedAt = new Date().toISOString();
  localStorage.setItem('orders_module', JSON.stringify(orders));
  loadOrdersPage();
  
  toast(`Ordre #${order.id} accepteret`, 'success');
}

// AFVIS ordre - sender afvisnings-SMS
async function rejectOrder(orderId) {
  const orders = JSON.parse(localStorage.getItem('orders_module') || '[]');
  // Fix: Compare as strings to handle type mismatch
  const order = orders.find(o => String(o.id) === String(orderId));
  
  if (!order) {
    console.error('Order not found:', orderId);
    toast('Ordre ikke fundet', 'error');
    return;
  }
  
  if (!confirm(`Er du sikker på du vil afvise ordren fra ${order.customerName}? Kunden får besked.`)) return;
  
  // Find restaurant for SMS
  const restaurant = restaurants.find(r => r.id === order.restaurantId) || restaurants[0];
  
  // Send afvisnings-SMS til kunden
  if (order.phone) {
    try {
      await sendSMSToCustomer(order.phone,
        `Beklager! ${restaurant?.name || 'Restauranten'} har desværre for travlt til at modtage din ordre lige nu. Prøv venligst igen om lidt, eller ring til os direkte. Vi beklager ulejligheden 🙏`,
        restaurant
      );
    } catch (err) {
      console.error('SMS fejl:', err);
    }
  }
  
  // Opdater status
  order.status = 'Afvist';
  order.rejectedAt = new Date().toISOString();
  localStorage.setItem('orders_module', JSON.stringify(orders));
  loadOrdersPage();
  
  toast(`Ordre #${order.id} afvist`, 'info');
}

// START tilberedning - viser popup for tidsestimat
async function startOrder(orderId) {
  const orders = JSON.parse(localStorage.getItem('orders_module') || '[]');
  // Fix: Compare as strings to handle type mismatch
  const order = orders.find(o => String(o.id) === String(orderId));
  
  if (!order) {
    console.error('Order not found:', orderId);
    toast('Ordre ikke fundet', 'error');
    return;
  }
  
  // Find restaurant
  const restaurant = restaurants.find(r => r.id === order.restaurantId) || restaurants[0];
  
  // Get default time from automation settings
  const defaultTime = restaurant?.automation?.defaultTime || 30;
  
  // Show time estimate popup
  showTimeEstimatePopup(orderId, defaultTime, restaurant);
}

// Show time estimate popup
function showTimeEstimatePopup(orderId, defaultTime, restaurant) {
  // Create popup overlay
  const popup = document.createElement('div');
  popup.id = 'time-estimate-popup';
  popup.style.cssText = `
    position:fixed;top:0;left:0;right:0;bottom:0;
    background:rgba(0,0,0,0.7);z-index:10000;
    display:flex;align-items:center;justify-content:center;
  `;
  
  popup.innerHTML = `
    <div style="background:var(--bg2);padding:24px;border-radius:var(--radius-lg);max-width:400px;width:90%">
      <h3 style="margin:0 0 16px;font-size:16px">Angiv forventet ventetid</h3>
      <p style="font-size:13px;color:var(--muted);margin-bottom:16px">Hvor lang tid forventes ordren at tage?</p>
      
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <button class="btn btn-secondary time-btn" onclick="setEstimateTime(15)" style="flex:1">15 min</button>
        <button class="btn btn-secondary time-btn" onclick="setEstimateTime(20)" style="flex:1">20 min</button>
        <button class="btn btn-secondary time-btn" onclick="setEstimateTime(30)" style="flex:1">30 min</button>
        <button class="btn btn-secondary time-btn" onclick="setEstimateTime(45)" style="flex:1">45 min</button>
      </div>
      
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:20px">
        <input type="number" id="custom-estimate-time" class="input" value="${defaultTime}" min="5" max="120" style="width:80px">
        <span style="color:var(--muted);font-size:13px">minutter</span>
      </div>
      
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn btn-secondary" onclick="closeTimeEstimatePopup()">Annuller</button>
        <button class="btn btn-primary" onclick="confirmStartOrder('${orderId}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          Start Tilberedning
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(popup);
}

// Set estimate time from quick buttons
function setEstimateTime(minutes) {
  document.getElementById('custom-estimate-time').value = minutes;
  // Highlight selected button
  document.querySelectorAll('.time-btn').forEach(btn => btn.classList.remove('active'));
}

// Close time estimate popup
function closeTimeEstimatePopup() {
  const popup = document.getElementById('time-estimate-popup');
  if (popup) popup.remove();
}

// Confirm and start order with time estimate
async function confirmStartOrder(orderId) {
  const estimateTime = parseInt(document.getElementById('custom-estimate-time').value) || 30;
  closeTimeEstimatePopup();
  
  const orders = JSON.parse(localStorage.getItem('orders_module') || '[]');
  // Fix: Compare as strings to handle type mismatch
  const order = orders.find(o => String(o.id) === String(orderId));
  
  if (!order) {
    console.error('Order not found:', orderId);
    toast('Ordre ikke fundet', 'error');
    return;
  }
  
  // Find restaurant
  const restaurant = restaurants.find(r => r.id === order.restaurantId) || restaurants[0];
  
  // Calculate estimated ready time
  const readyTime = new Date(Date.now() + estimateTime * 60 * 1000);
  const readyTimeStr = readyTime.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
  
  // Get custom message or use default based on order type
  let message;
  if (order.orderType === 'Delivery') {
    message = `🚗 Vi er nu i gang med din bestilling! Forventet levering om ca. ${estimateTime} minutter (kl. ${readyTimeStr}). Vi giver besked når maden er på vej!`;
  } else {
    message = `🍳 Køkkenet er nu i gang med din bestilling! Din mad er klar til afhentning om ca. ${estimateTime} minutter (kl. ${readyTimeStr}).`;
  }
  
  // Send "i gang" SMS til kunden
  if (order.phone) {
    try {
      await sendSMSToCustomer(order.phone, message, restaurant);
      toast(`SMS sendt til ${order.customerName}`, 'success');
    } catch (err) {
      console.error('SMS fejl:', err);
      toast('SMS kunne ikke sendes', 'error');
    }
  }
  
  // Opdater status
  order.status = 'I gang';
  order.estimatedTime = estimateTime;
  order.estimatedReadyTime = readyTimeStr;
  order.startedAt = new Date().toISOString();
  localStorage.setItem('orders_module', JSON.stringify(orders));
  loadOrdersPage();
  
  toast(`Ordre #${order.id} - tilberedning startet (${estimateTime} min)`, 'success');
}

// FÆRDIG ordre - sender "færdig" SMS med dynamisk tekst
async function completeOrder(orderId) {
  const orders = JSON.parse(localStorage.getItem('orders_module') || '[]');
  // Fix: Compare as strings to handle type mismatch
  const order = orders.find(o => String(o.id) === String(orderId));
  
  if (!order) {
    console.error('Order not found:', orderId);
    toast('Ordre ikke fundet', 'error');
    return;
  }
  
  // Find restaurant for SMS
  const restaurant = restaurants.find(r => r.id === order.restaurantId) || restaurants[0];
  
  // Dynamisk tekst baseret på ordretype
  let message;
  if (order.orderType === 'Delivery') {
    message = `🚗 Din mad er nu på vej til dig! Forventet levering inden for kort tid. Velbekomme fra ${restaurant?.name || 'os'}! 🍕`;
  } else {
    message = `✅ Din ordre er nu klar til afhentning! Vi glæder os til at se dig. Velbekomme fra ${restaurant?.name || 'os'}! 🍕`;
  }
  
  // Send "færdig" SMS til kunden
  if (order.phone) {
    try {
      await sendSMSToCustomer(order.phone, message, restaurant);
      toast(`SMS sendt til ${order.customerName}`, 'success');
    } catch (err) {
      console.error('SMS fejl:', err);
    }
  }
  
  // Opdater status
  order.status = 'Færdig';
  order.completedAt = new Date().toISOString();
  localStorage.setItem('orders_module', JSON.stringify(orders));
  loadOrdersPage();

  // 🖨️ Trigger customer receipt print
  try {
    const printerSettings = getPrinterSettings();
    if (printerSettings.autoPrintCustomer) {
      triggerCustomerPrint(order, restaurant);
    }
  } catch (e) { console.warn('Customer print trigger error:', e); }
  
  toast(`Ordre #${order.id} markeret som færdig`, 'success');
}

// Replace message variables with actual values
function replaceMessageVariables(message, restaurant, order, estimateTime = null) {
  if (!message) return message;
  
  const restaurantName = restaurant?.name || 'Restauranten';
  const orderType = order?.orderType || 'Afhentning';
  const deliveryText = orderType === 'Delivery' ? 'på vej til dig! 🚗' : 'klar til afhentning! 🏪';
  
  return message
    .replace(/\{\{restaurant\}\}/gi, restaurantName)
    .replace(/\{\{restaurant_name\}\}/gi, restaurantName)
    .replace(/\{\{ventetid\}\}/gi, estimateTime || order?.estimatedTime || '30')
    .replace(/\{\{leveringstype\}\}/gi, deliveryText)
    .replace(/\{\{ordre_id\}\}/gi, order?.id || '')
    .replace(/\{\{kunde_navn\}\}/gi, order?.customerName || 'Kunde')
    .replace(/\{\{ordre\}\}/gi, order?.items || '');
}

// Slet enkelt ordre
function deleteOrder(orderId) {
  const orders = JSON.parse(localStorage.getItem('orders_module') || '[]');
  const filtered = orders.filter(o => o.id !== orderId);
  localStorage.setItem('orders_module', JSON.stringify(filtered));
  loadOrdersPage();
}

// Save order to module (from workflow)
function saveOrderToModule(orderData) {
  const orders = JSON.parse(localStorage.getItem('orders_module') || '[]');
  
  const newOrder = {
    id: Date.now().toString(),
    phone: orderData.phone,
    customerName: orderData.customerName || 'Ukendt',
    orderType: orderData.orderType || 'Pickup',
    address: orderData.address || '',
    items: orderData.items || '',
    total: orderData.parsedOrder?.total || 0,
    restaurantId: orderData.restaurantId,
    status: orderData.status || 'Afventer',
    estimatedTime: orderData.estimatedTime || null,
    createdAt: orderData.createdAt || new Date().toISOString(),
    acceptedAt: orderData.acceptedAt || null,
    startedAt: orderData.startedAt || null,
    completedAt: orderData.completedAt || null
  };
  
  orders.push(newOrder);
  localStorage.setItem('orders_module', JSON.stringify(orders));
  
  addLog(`📋 Ordre gemt: #${newOrder.id} - ${newOrder.customerName}`, 'success');

  // 🖨️ Trigger kitchen print for new order
  try {
    const restaurant = restaurants.find(r => r.id === newOrder.restaurantId) || restaurants[0];
    triggerKitchenPrint(newOrder, restaurant);
  } catch (e) { console.warn('Kitchen print trigger error:', e); }

  return newOrder;
}

// Hjælpefunktion til at sende SMS til kunde (bruger eksisterende sendSMS)
async function sendSMSToCustomer(phone, message, restaurant) {
  try {
    // Use our InMobile SMS function
    await sendSMS(phone, message);
    return true;
  } catch (err) {
    console.error('SMS error:', err);
    return false;
  }
}

// Legacy funktion for bagudkompatibilitet
function updateOrderStatus(orderId, newStatus) {
  const orders = JSON.parse(localStorage.getItem('orders_module') || '[]');
  const orderIndex = orders.findIndex(o => o.id === orderId);
  
  if (orderIndex !== -1) {
    orders[orderIndex].status = newStatus;
    localStorage.setItem('orders_module', JSON.stringify(orders));
    loadOrdersPage();
  }
}

// Ryd alle ordrer
function clearAllOrders() {
  if (confirm('Er du sikker på du vil slette alle ordrer?')) {
    localStorage.removeItem('orders_module');
    loadOrdersPage();
  }
}

// =====================================================
// ADVANCED AI HELPER FUNCTIONS
// =====================================================

/**
 * Get current conversation ID for AdvancedAI
 */
function getCurrentConversationId() {

function loadOrderHistory() {
  // Get orders from the orders_module (existing system) and mark completed ones
  const allOrders = JSON.parse(localStorage.getItem('orders_module') || '[]');
  const historyOrders = JSON.parse(localStorage.getItem('orderflow_order_history') || '[]');

  // Combine completed orders from active orders + history
  const completedFromActive = allOrders.filter(o =>
    o.status === 'Færdig' || o.status === 'Afvist' || o.status === 'Annulleret'
  );

  // Merge without duplicates (by ID)
  const existingIds = new Set(historyOrders.map(o => o.id));
  completedFromActive.forEach(order => {
    if (!existingIds.has(order.id)) {
      historyOrders.push({
        ...order,
        completedAt: order.completedAt || new Date().toISOString()
      });
    }
  });

  // Sort by date (newest first)
  historyOrders.sort((a, b) => new Date(b.completedAt || b.timestamp) - new Date(a.completedAt || a.timestamp));

  // Save merged history
  localStorage.setItem('orderflow_order_history', JSON.stringify(historyOrders));

  // Apply filters and render
  filterOrderHistory();
}

function filterOrderHistory() {
  const fromDate = document.getElementById('history-from-date')?.value;
  const toDate = document.getElementById('history-to-date')?.value;
  const statusFilter = document.getElementById('history-status-filter')?.value;

  let orders = JSON.parse(localStorage.getItem('orderflow_order_history') || '[]');

  // Apply filters
  if (fromDate) {
    const from = new Date(fromDate);
    orders = orders.filter(o => new Date(o.completedAt || o.timestamp) >= from);
  }

  if (toDate) {
    const to = new Date(toDate);
    to.setHours(23, 59, 59);
    orders = orders.filter(o => new Date(o.completedAt || o.timestamp) <= to);
  }

  if (statusFilter) {
    orders = orders.filter(o => o.status === statusFilter);
  }

  renderOrderHistory(orders);
}

function renderOrderHistory(orders) {
  const container = document.getElementById('order-history-list');
  const paginationContainer = document.getElementById('order-history-pagination');

  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="empty" style="padding:60px;text-align:center">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </div>
        <div style="margin-top:12px">Ingen ordrer fundet</div>
        <div style="font-size:var(--font-size-sm);color:var(--muted);margin-top:8px">
          Dine gennemførte ordrer vises her
        </div>
      </div>
    `;
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  // Pagination
  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
  const startIndex = (orderHistoryPage - 1) * ORDERS_PER_PAGE;
  const pageOrders = orders.slice(startIndex, startIndex + ORDERS_PER_PAGE);

  container.innerHTML = pageOrders.map(order => {
    const statusColors = {
      'Færdig': { bg: 'rgba(52,211,153,0.15)', color: '#34d399', text: 'Gennemført' },
      'Afvist': { bg: 'rgba(248,113,113,0.15)', color: '#f87171', text: 'Afvist' },
      'Annulleret': { bg: 'rgba(156,163,175,0.15)', color: '#9ca3af', text: 'Annulleret' }
    };
    const status = statusColors[order.status] || statusColors['Færdig'];

    const orderDate = new Date(order.completedAt || order.timestamp);
    const formattedDate = orderDate.toLocaleDateString('da-DK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const formattedTime = orderDate.toLocaleTimeString('da-DK', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <div class="setting-card" style="padding:var(--space-4)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--space-3)">
          <div>
            <div style="font-weight:600;font-size:var(--font-size-base)">Ordre #${order.id}</div>
            <div style="font-size:var(--font-size-sm);color:var(--muted)">${formattedDate} kl. ${formattedTime}</div>
          </div>
          <span style="background:${status.bg};color:${status.color};padding:4px 12px;border-radius:20px;font-size:12px;font-weight:500">
            ${status.text}
          </span>
        </div>

        <div style="background:var(--bg3);padding:var(--space-3);border-radius:var(--radius-sm);margin-bottom:var(--space-3)">
          <div style="font-size:var(--font-size-sm);color:var(--text2)">${order.items || 'Ingen varer angivet'}</div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <span style="font-size:var(--font-size-sm);color:var(--muted)">${order.orderType || 'Pickup'}</span>
            ${order.address ? `<span style="font-size:var(--font-size-sm);color:var(--muted)"> - ${order.address}</span>` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:var(--space-3)">
            <span style="font-weight:600">${formatOrderPrice(order.total || 0)} kr</span>
            ${order.status === 'Færdig' ? `
              <button class="btn btn-secondary" style="padding:6px 12px;font-size:12px" onclick="reorder('${order.id}')">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 4v6h-6"/>
                  <path d="M1 20v-6h6"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                Genbestil
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Render pagination
  if (paginationContainer && totalPages > 1) {
    let paginationHTML = '';

    if (orderHistoryPage > 1) {
      paginationHTML += `<button class="btn btn-secondary" style="padding:6px 12px" onclick="goToHistoryPage(${orderHistoryPage - 1})">←</button>`;
    }

    for (let i = 1; i <= totalPages; i++) {
      const isActive = i === orderHistoryPage;
      paginationHTML += `
        <button class="btn ${isActive ? 'btn-primary' : 'btn-secondary'}"
                style="padding:6px 12px;min-width:36px"
                onclick="goToHistoryPage(${i})">${i}</button>
      `;
    }

    if (orderHistoryPage < totalPages) {
      paginationHTML += `<button class="btn btn-secondary" style="padding:6px 12px" onclick="goToHistoryPage(${orderHistoryPage + 1})">→</button>`;
    }

    paginationContainer.innerHTML = paginationHTML;
  } else if (paginationContainer) {
    paginationContainer.innerHTML = '';
  }
}

function goToHistoryPage(page) {
  orderHistoryPage = page;
  filterOrderHistory();

  // Scroll to top of list
  document.getElementById('order-history-list')?.scrollIntoView({ behavior: 'smooth' });
}

function reorder(orderId) {
  const history = JSON.parse(localStorage.getItem('orderflow_order_history') || '[]');
  const order = history.find(o => String(o.id) === String(orderId));

  if (!order) {
    toast('Ordre ikke fundet', 'error');
    return;
  }

  // Create new order based on previous
  const newOrder = {
    id: Date.now().toString(),
    phone: order.phone,
    customerName: order.customerName,
    orderType: order.orderType,
    address: order.address,
    items: order.items,
    total: order.total,
    restaurantId: order.restaurantId,
    status: 'Ny',
    timestamp: new Date().toISOString()
  };

  const orders = JSON.parse(localStorage.getItem('orders_module') || '[]');
  orders.unshift(newOrder);
  localStorage.setItem('orders_module', JSON.stringify(orders));

  toast('Ordre genbestilt!', 'success');

  // Navigate to orders page
  showPage('orders');
}

function formatOrderPrice(price) {
  return new Intl.NumberFormat('da-DK').format(price);
}

// =====================================================
// WEB BUILDER FUNCTIONS
// =====================================================

// Default Web Builder configuration
const defaultWebBuilderConfig = {
  branding: {
    name: 'Din Restaurant',
    slogan: 'Autentisk smag siden 1985',
    description: 'Velkommen til vores restaurant. Vi serverer de bedste retter med friske ingredienser.',
    logo: '',
    colors: {
      primary: '#D4380D',
      secondary: '#FFF7E6',
      accent: '#FFA940',
      text: '#1A1A1A'
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Inter'
    }
  },
  contact: {
    address: '',
    postalCode: '',
    city: '',
    phone: '',
    email: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      tiktok: ''
    }
  },
  businessHours: {
    monday: { open: '11:00', close: '22:00', closed: false },
    tuesday: { open: '11:00', close: '22:00', closed: false },
    wednesday: { open: '11:00', close: '22:00', closed: false },
    thursday: { open: '11:00', close: '22:00', closed: false },
    friday: { open: '11:00', close: '23:00', closed: false },
    saturday: { open: '12:00', close: '23:00', closed: false },
    sunday: { open: '12:00', close: '21:00', closed: false }
  },
  delivery: {
    enabled: true,
    fee: 35,
    minimumOrder: 150,
    freeDeliveryThreshold: 300,
    estimatedTime: 45
  },
  features: {
    ordering: true,
    loyalty: true,
    pickup: true,
    delivery: true,
    customerAccounts: false,
    pushNotifications: false
  },
  menu: {
    currency: 'DKK',
    taxRate: 25
  },
  images: {
    hero: '',
    featured: ''
  }
};

let webBuilderConfig = null;

// Web Builder Templates - Demo skabeloner
const webBuilderTemplates = {
  'skabelon-1': {
    templateType: 'skabelon-1',
    templatePath: 'templates/skabelon-1/',
    previewFile: './templates/skabelon-1/dist/index.html#menu',
    branding: {
      name: 'Pizzeria Roma',
      shortName: 'Roma',
      slogan: 'Autentisk italiensk pizza siden 1985',
      description: 'Vi laver pizza med kærlighed og de bedste ingredienser fra Italien. Kom og smag forskellen!',
      logo: { url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop', darkUrl: '' },
      colors: {
        primary: '#D4380D',
        secondary: '#FFF7E6',
        accent: '#FFA940',
        background: '#FFFFFF',
        surface: '#F5F5F5',
        text: '#1A1A1A',
        textMuted: '#666666',
        success: '#52C41A',
        warning: '#FAAD14',
        error: '#F5222D'
      },
      fonts: { heading: 'Playfair Display', body: 'Inter' }
    },
    contact: {
      address: 'Rådhusstræde 12',
      postalCode: '1466',
      city: 'København',
      phone: '+45 33 12 34 56',
      email: 'info@pizzeriaroma.dk',
      socialMedia: { facebook: 'https://facebook.com/pizzeriaroma', instagram: 'https://instagram.com/pizzeriaroma', tiktok: '' }
    },
    businessHours: {
      monday: { open: '11:00', close: '22:00', closed: false },
      tuesday: { open: '11:00', close: '22:00', closed: false },
      wednesday: { open: '11:00', close: '22:00', closed: false },
      thursday: { open: '11:00', close: '22:00', closed: false },
      friday: { open: '11:00', close: '23:00', closed: false },
      saturday: { open: '12:00', close: '23:00', closed: false },
      sunday: { open: '12:00', close: '21:00', closed: false }
    },
    delivery: { enabled: true, fee: 35, minimumOrder: 150, freeDeliveryThreshold: 300, estimatedTime: 45 },
    features: { ordering: true, loyalty: true, pickup: true, delivery: true, customerAccounts: true, pushNotifications: true },
    menu: { currency: 'DKK', taxRate: 25 },
    images: { hero: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1200&h=600&fit=crop', featured: '' }
  },
  'skabelon-2': {
    templateType: 'skabelon-2',
    templatePath: 'templates/skabelon-2/',
    previewFile: './templates/skabelon-2/index.html',
    branding: {
      name: 'Feane Restaurant',
      shortName: 'Feane',
      slogan: 'Fantastisk Mad & Service',
      description: 'Oplev vores unikke retter lavet med de friskeste ingredienser og passion for madlavning.',
      logo: { url: '', darkUrl: '' },
      colors: {
        primary: '#ffbe33',
        secondary: '#222831',
        accent: '#e1e1e1',
        background: '#FFFFFF',
        surface: '#F8F9FA',
        text: '#222222',
        textMuted: '#666666',
        success: '#28a745',
        warning: '#ffc107',
        error: '#dc3545'
      },
      fonts: { heading: 'Poppins', body: 'Open Sans' }
    },
    contact: {
      address: 'Nørrebrogade 45',
      postalCode: '2200',
      city: 'København N',
      phone: '+45 38 88 88 88',
      email: 'info@feane.dk',
      socialMedia: { facebook: 'https://facebook.com/feane', instagram: 'https://instagram.com/feane', tiktok: '' }
    },
    businessHours: {
      monday: { open: '10:00', close: '22:00', closed: false },
      tuesday: { open: '10:00', close: '22:00', closed: false },
      wednesday: { open: '10:00', close: '22:00', closed: false },
      thursday: { open: '10:00', close: '22:00', closed: false },
      friday: { open: '10:00', close: '23:00', closed: false },
      saturday: { open: '11:00', close: '23:00', closed: false },
      sunday: { open: '11:00', close: '21:00', closed: false }
    },
    delivery: { enabled: true, fee: 25, minimumOrder: 120, freeDeliveryThreshold: 250, estimatedTime: 35 },
    features: { ordering: true, loyalty: true, pickup: true, delivery: true, customerAccounts: true, pushNotifications: false },
    menu: { currency: 'DKK', taxRate: 25 },
    images: { hero: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=600&fit=crop', featured: '' }
  },
  'skabelon-3': {
    templateType: 'skabelon-3',
    templatePath: 'templates/skabelon-3/',
    previewFile: './templates/skabelon-3/index.html',
    branding: {
      name: 'Pizza Delicious',
      shortName: 'Pizza',
      slogan: 'Lækker Italiensk Køkken',
      description: 'Oplev autentiske italienske smagsvarianter med vores håndlavede pizzaer og friske ingredienser.',
      logo: { url: '', darkUrl: '' },
      colors: {
        primary: '#FAC564',
        secondary: '#121618',
        accent: '#78D5EF',
        background: '#FFFFFF',
        surface: '#F8F9FA',
        text: '#1A1A1A',
        textMuted: '#6c757d',
        success: '#28a745',
        warning: '#ffc107',
        error: '#dc3545'
      },
      fonts: { heading: 'Josefin Sans', body: 'Poppins' }
    },
    contact: {
      address: 'Via Roma 42',
      postalCode: '2100',
      city: 'København Ø',
      phone: '+45 35 42 42 42',
      email: 'ciao@pizzadelicious.dk',
      socialMedia: { facebook: 'https://facebook.com/pizzadelicious', instagram: 'https://instagram.com/pizzadelicious', tiktok: '' }
    },
    businessHours: {
      monday: { open: '12:00', close: '22:00', closed: false },
      tuesday: { open: '12:00', close: '22:00', closed: false },
      wednesday: { open: '12:00', close: '22:00', closed: false },
      thursday: { open: '12:00', close: '22:00', closed: false },
      friday: { open: '12:00', close: '23:00', closed: false },
      saturday: { open: '11:00', close: '23:00', closed: false },
      sunday: { open: '11:00', close: '21:00', closed: false }
    },
    delivery: { enabled: true, fee: 29, minimumOrder: 100, freeDeliveryThreshold: 250, estimatedTime: 40 },
    features: { ordering: true, loyalty: true, pickup: true, delivery: true, customerAccounts: false, pushNotifications: false },
    menu: { currency: 'DKK', taxRate: 25 },
    images: { hero: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=600&fit=crop', featured: '' }
  }
};

// App Builder Templates - Skabeloner for mobil app
const appBuilderTemplates = {
  'app-skabelon-1': {
    id: 'app-skabelon-1',
    name: 'App Skabelon 1',
    description: 'Standard app skabelon med klassisk layout',
    previewFile: './demos/app-preview.html',
    colors: {
      primary: '#D4380D',
      secondary: '#FFF7E6',
      accent: '#FFA940',
      background: '#FFFFFF',
      surface: '#F5F5F5',
      text: '#1A1A1A'
    },
    fonts: { heading: 'Playfair Display', body: 'Inter' },
    layout: 'classic'
  },
  'app-skabelon-2': {
    id: 'app-skabelon-2',
    name: 'App Skabelon 2',
    description: 'Moderne app skabelon med mørkt tema (kommer snart)',
    previewFile: './demos/app-preview-v2.html',
    colors: {
      primary: '#FAC564',
      secondary: '#121618',
      accent: '#78D5EF',
      background: '#1A1A1A',
      surface: '#2D2D2D',
      text: '#FFFFFF'
    },
    fonts: { heading: 'Josefin Sans', body: 'Poppins' },
    layout: 'modern'
  }
};

let currentAppTemplate = 'app-skabelon-1';

// Load App Builder template
