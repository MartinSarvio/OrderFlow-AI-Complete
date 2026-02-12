// FLOW Analytics Module — AnalyticsDashboard, analytics tabs

function switchAnalyticsTab(tab) {
  // Update tab buttons within oversigt page
  const tabButtons = document.querySelectorAll('#flow-cms-content-analytics-oversigt .settings-tabs .settings-tab');
  tabButtons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent.toLowerCase().includes(tab) ||
        (tab === 'overview' && btn.textContent === 'Oversigt') ||
        (tab === 'sales' && btn.textContent === 'Salg') ||
        (tab === 'products' && btn.textContent === 'Produkter') ||
        (tab === 'ai' && btn.textContent === 'AI Agent') ||
        (tab === 'channels' && btn.textContent === 'Kanaler') ||
        (tab === 'content' && btn.textContent === 'Indhold')) {
      btn.classList.add('active');
    }
  });

  // Update tab content
  document.querySelectorAll('#flow-cms-content-analytics-oversigt .analytics-tab-content').forEach(c => {
    c.classList.remove('active');
  });
  const contentEl = document.getElementById('analytics-tab-' + tab);
  if (contentEl) contentEl.classList.add('active');

  // Load data based on tab
  if (tab === 'overview') loadAnalyticsOverview();
  if (tab === 'sales') loadAnalyticsSales();
  if (tab === 'products') loadAnalyticsProducts();
  if (tab === 'ai') loadAnalyticsAI();
  if (tab === 'channels') loadAnalyticsChannels();
  if (tab === 'content') loadCMSDataStats();
}

// Load inline analytics data
function loadAnalyticsDataInline() {
  loadAnalyticsOverview();
}

function refreshAnalyticsInline() {
  const lastUpdated = document.getElementById('analytics-last-updated-inline');
  if (lastUpdated) {
    lastUpdated.textContent = 'Opdateret: ' + new Date().toLocaleTimeString('da-DK');
  }
  loadAnalyticsOverview();
  toast('Analytics opdateret', 'success');
}

async function loadAnalyticsOverview() {
  const headers = { 'apikey': CONFIG.SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY };
  const base = CONFIG.SUPABASE_URL + '/rest/v1';
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  // Fallback demo data
  let revenue = 0, orderCount = 0, aov = 0, visitorCount = 0, aiConv = 0, aiComp = 0;
  let channelData = {}, topProductsList = [];

  try {
    // Fetch orders (last 30 days)
    const ordersRes = await fetch(base + '/unified_orders?select=total,source_channel,line_items,status&created_at=gte.' + thirtyDaysAgo, { headers });
    if (ordersRes.ok) {
      const orders = await ordersRes.json();
      const completed = orders.filter(o => !['cancelled','refunded','draft'].includes(o.status));
      revenue = completed.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
      orderCount = completed.length;
      aov = orderCount > 0 ? Math.round(revenue / orderCount) : 0;

      // Channel distribution
      completed.forEach(o => {
        const ch = o.source_channel || 'unknown';
        channelData[ch] = (channelData[ch] || 0) + 1;
      });

      // Top products from line_items
      const productCounts = {};
      completed.forEach(o => {
        (o.line_items || []).forEach(item => {
          const name = item.name || 'Ukendt';
          productCounts[name] = (productCounts[name] || 0) + (item.quantity || 1);
        });
      });
      topProductsList = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    }

    // Fetch visitors (page_views last 30 days)
    const viewsRes = await fetch(base + '/page_views?select=visitor_id&created_at=gte.' + thirtyDaysAgo, { headers });
    if (viewsRes.ok) {
      const views = await viewsRes.json();
      const unique = new Set(views.map(v => v.visitor_id).filter(Boolean));
      visitorCount = unique.size || views.length;
    }

    // Fetch AI conversations
    const aiRes = await fetch(base + '/ai_conversations?select=outcome&started_at=gte.' + thirtyDaysAgo, { headers });
    if (aiRes.ok) {
      const convs = await aiRes.json();
      aiConv = convs.length;
      const completed = convs.filter(c => c.outcome === 'completed').length;
      aiComp = aiConv > 0 ? Math.round((completed / aiConv) * 100) : 0;
    }
  } catch (e) {
    console.warn('[Analytics] Supabase fetch fejl, viser demo-data:', e);
    revenue = 47850; orderCount = 156; aov = 307; visitorCount = 1247; aiConv = 89; aiComp = 94;
    channelData = { app: 70, web: 47, sms: 23, walkin: 16 };
    topProductsList = [['Margherita Pizza', 47], ['Pepperoni Pizza', 38], ['Quattro Formaggi', 29], ['Tiramisu', 24], ['Cola', 21]];
  }

  // Use demo fallback if no real data
  if (orderCount === 0 && revenue === 0) {
    revenue = 47850; orderCount = 156; aov = 307; visitorCount = 1247; aiConv = 89; aiComp = 94;
    channelData = { app: 70, web: 47, sms: 23, walkin: 16 };
    topProductsList = [['Margherita Pizza', 47], ['Pepperoni Pizza', 38], ['Quattro Formaggi', 29], ['Tiramisu', 24], ['Cola', 21]];
  }

  const fmt = (n) => n.toLocaleString('da-DK') + ' kr';
  const revenueEl = document.getElementById('inline-stat-revenue');
  const ordersEl = document.getElementById('inline-stat-orders');
  const aovEl = document.getElementById('inline-stat-aov');
  const visitorsEl = document.getElementById('inline-stat-visitors');
  const aiConvEl = document.getElementById('inline-ai-conversations');
  const aiCompEl = document.getElementById('inline-ai-completion');

  if (revenueEl) revenueEl.textContent = fmt(revenue);
  if (ordersEl) ordersEl.textContent = orderCount.toLocaleString('da-DK');
  if (aovEl) aovEl.textContent = fmt(aov);
  if (visitorsEl) visitorsEl.textContent = visitorCount.toLocaleString('da-DK');
  if (aiConvEl) aiConvEl.textContent = aiConv.toLocaleString('da-DK');
  if (aiCompEl) aiCompEl.textContent = aiComp + '%';

  // Channel bars
  const channelBars = document.getElementById('inline-channel-bars');
  if (channelBars) {
    const total = Object.values(channelData).reduce((s, v) => s + v, 0) || 1;
    const channelLabels = { app: 'App', web: 'Website', website: 'Website', sms: 'SMS', phone: 'Telefon', walkin: 'Walk-in', instagram: 'Instagram', facebook: 'Facebook' };
    const channelColors = { app: 'var(--primary)', web: 'var(--success)', website: 'var(--success)', sms: 'var(--info, #3B82F6)', phone: 'var(--warning)', walkin: 'var(--accent)', instagram: '#E1306C', facebook: '#1877F2' };
    const sorted = Object.entries(channelData).sort((a, b) => b[1] - a[1]);
    channelBars.innerHTML = sorted.map(([ch, count]) => {
      const pct = Math.round((count / total) * 100);
      const label = channelLabels[ch] || ch;
      const color = channelColors[ch] || 'var(--primary)';
      return `<div style="display:flex;align-items:center;gap:12px">
        <span style="width:80px;font-size:13px">${label}</span>
        <div style="flex:1;height:24px;background:var(--bg-secondary);border-radius:4px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:${color}"></div>
        </div>
        <span style="font-size:13px;width:40px;text-align:right">${pct}%</span>
      </div>`;
    }).join('');
  }

  // Top products
  const topProducts = document.getElementById('inline-top-products');
  if (topProducts) {
    topProducts.innerHTML = topProductsList.map(([name, count]) =>
      `<tr><td style="padding:12px 16px">${escapeHtml(name)}</td><td style="text-align:right;padding-right:16px">${escapeHtml(String(count))}</td></tr>`
    ).join('');
  }
}

async function loadAnalyticsSales() {
  const headers = { 'apikey': CONFIG.SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY };
  const base = CONFIG.SUPABASE_URL + '/rest/v1';
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString();

  let total = 47850, orders = 156, avg = 307, growth = '+12%';

  try {
    // Current period
    const currRes = await fetch(base + '/unified_orders?select=total,status&created_at=gte.' + thirtyDaysAgo, { headers });
    if (currRes.ok) {
      const currOrders = (await currRes.json()).filter(o => !['cancelled','refunded','draft'].includes(o.status));
      if (currOrders.length > 0) {
        total = currOrders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
        orders = currOrders.length;
        avg = Math.round(total / orders);

        // Previous period for growth
        const prevRes = await fetch(base + '/unified_orders?select=total,status&created_at=gte.' + sixtyDaysAgo + '&created_at=lt.' + thirtyDaysAgo, { headers });
        if (prevRes.ok) {
          const prevOrders = (await prevRes.json()).filter(o => !['cancelled','refunded','draft'].includes(o.status));
          const prevTotal = prevOrders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
          if (prevTotal > 0) {
            const pct = Math.round(((total - prevTotal) / prevTotal) * 100);
            growth = (pct >= 0 ? '+' : '') + pct + '%';
          }
        }
      }
    }
  } catch (e) { console.warn('[Analytics Sales] Fejl:', e); }

  const fmt = (n) => n.toLocaleString('da-DK') + ' kr';
  const salesTotalEl = document.getElementById('sales-total');
  const salesOrdersEl = document.getElementById('sales-orders');
  const salesAvgEl = document.getElementById('sales-avg');
  const salesGrowthEl = document.getElementById('sales-growth');

  if (salesTotalEl) salesTotalEl.textContent = fmt(total);
  if (salesOrdersEl) salesOrdersEl.textContent = orders.toLocaleString('da-DK');
  if (salesAvgEl) salesAvgEl.textContent = fmt(avg);
  if (salesGrowthEl) salesGrowthEl.textContent = growth;
}

async function loadAnalyticsProducts() {
  const headers = { 'apikey': CONFIG.SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY };
  const base = CONFIG.SUPABASE_URL + '/rest/v1';
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  let products = [
    { name: 'Margherita Pizza', qty: 47, revenue: 4230, trend: 15 },
    { name: 'Pepperoni Pizza', qty: 38, revenue: 3800, trend: 8 },
    { name: 'Quattro Formaggi', qty: 29, revenue: 3190, trend: -3 },
    { name: 'Tiramisu', qty: 24, revenue: 1440, trend: 22 },
    { name: 'Cola', qty: 21, revenue: 630, trend: 0 }
  ];

  try {
    const res = await fetch(base + '/unified_orders?select=line_items,status&created_at=gte.' + thirtyDaysAgo, { headers });
    if (res.ok) {
      const orders = (await res.json()).filter(o => !['cancelled','refunded','draft'].includes(o.status));
      if (orders.length > 0) {
        const productMap = {};
        orders.forEach(o => {
          (o.line_items || []).forEach(item => {
            const name = item.name || 'Ukendt';
            if (!productMap[name]) productMap[name] = { qty: 0, revenue: 0 };
            productMap[name].qty += (item.quantity || 1);
            productMap[name].revenue += (item.unit_price || 0) * (item.quantity || 1);
          });
        });
        const sorted = Object.entries(productMap).sort((a, b) => b[1].qty - a[1].qty);
        if (sorted.length > 0) {
          products = sorted.slice(0, 10).map(([name, data]) => ({
            name, qty: data.qty, revenue: Math.round(data.revenue), trend: 0
          }));
        }
      }
    }
  } catch (e) { console.warn('[Analytics Products] Fejl:', e); }

  const table = document.getElementById('products-analytics-table');
  if (table) {
    const fmt = (n) => n.toLocaleString('da-DK') + ' kr';
    table.innerHTML = products.map(p => {
      const trendColor = p.trend > 0 ? 'var(--success)' : p.trend < 0 ? 'var(--danger)' : 'var(--muted)';
      const trendIcon = p.trend > 0 ? '↑' : p.trend < 0 ? '↓' : '→';
      return `<tr><td style="padding:12px 16px">${p.name}</td><td style="text-align:right">${p.qty}</td><td style="text-align:right">${fmt(p.revenue)}</td><td style="text-align:right;padding-right:16px;color:${trendColor}">${trendIcon} ${Math.abs(p.trend)}%</td></tr>`;
    }).join('');
  }
}

async function loadAnalyticsAI() {
  const headers = { 'apikey': CONFIG.SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY };
  const base = CONFIG.SUPABASE_URL + '/rest/v1';
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  let totalConv = 89, compRate = 94, ordersCreated = 67, escRate = 6;
  let recentConvs = [
    { label: 'Kunde #1247', desc: 'Bestilling: 2x Margherita, 1x Cola', outcome: 'completed' },
    { label: 'Kunde #1246', desc: 'Spørgsmål: Åbningstider', outcome: 'completed' },
    { label: 'Kunde #1245', desc: 'Bestilling: 3x Pepperoni', outcome: 'escalated' }
  ];

  try {
    const res = await fetch(base + '/ai_conversations?select=*&started_at=gte.' + thirtyDaysAgo + '&order=started_at.desc&limit=100', { headers });
    if (res.ok) {
      const convs = await res.json();
      if (convs.length > 0) {
        totalConv = convs.length;
        const completed = convs.filter(c => c.outcome === 'completed').length;
        const escalated = convs.filter(c => c.escalated).length;
        const withOrders = convs.filter(c => c.order_created).length;
        compRate = totalConv > 0 ? Math.round((completed / totalConv) * 100) : 0;
        ordersCreated = withOrders;
        escRate = totalConv > 0 ? Math.round((escalated / totalConv) * 100) : 0;
        recentConvs = convs.slice(0, 5).map(c => ({
          label: 'Samtale #' + (c.id || '').substring(0, 6),
          desc: c.intent || (c.order_created ? 'Ordre oprettet' : 'Samtale'),
          outcome: c.outcome || 'in_progress'
        }));
      }
    }
  } catch (e) { console.warn('[Analytics AI] Fejl:', e); }

  const convEl = document.getElementById('ai-total-conversations');
  const compEl = document.getElementById('ai-completion-rate');
  const ordersEl = document.getElementById('ai-orders-created');
  const escEl = document.getElementById('ai-escalation-rate');

  if (convEl) convEl.textContent = totalConv.toLocaleString('da-DK');
  if (compEl) compEl.textContent = compRate + '%';
  if (ordersEl) ordersEl.textContent = ordersCreated.toLocaleString('da-DK');
  if (escEl) escEl.textContent = escRate + '%';

  const outcomeColors = { completed: 'var(--success)', escalated: 'var(--warning)', abandoned: 'var(--danger)', in_progress: 'var(--muted)' };
  const outcomeLabels = { completed: 'Fuldført', escalated: 'Eskaleret', abandoned: 'Forladt', in_progress: 'I gang' };
  const convList = document.getElementById('ai-conversations-list');
  if (convList) {
    convList.innerHTML = recentConvs.map(c => `
      <div style="padding:12px;background:var(--bg-secondary);border-radius:8px;display:flex;justify-content:space-between;align-items:center">
        <div><strong>${c.label}</strong><div style="font-size:12px;color:var(--muted)">${c.desc}</div></div>
        <span style="font-size:12px;color:${outcomeColors[c.outcome] || 'var(--muted)'}">${outcomeLabels[c.outcome] || c.outcome}</span>
      </div>
    `).join('');
  }
}

async function loadAnalyticsChannels() {
  const headers = { 'apikey': CONFIG.SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY };
  const base = CONFIG.SUPABASE_URL + '/rest/v1';
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  let channelCounts = { app: 70, web: 47, phone: 23, walkin: 16 };

  try {
    const res = await fetch(base + '/unified_orders?select=source_channel,status&created_at=gte.' + thirtyDaysAgo, { headers });
    if (res.ok) {
      const orders = (await res.json()).filter(o => !['cancelled','refunded','draft'].includes(o.status));
      if (orders.length > 0) {
        channelCounts = {};
        orders.forEach(o => {
          const ch = o.source_channel || 'unknown';
          channelCounts[ch] = (channelCounts[ch] || 0) + 1;
        });
      }
    }
  } catch (e) { console.warn('[Analytics Channels] Fejl:', e); }

  const channelMap = { app: 'channel-app', web: 'channel-website', website: 'channel-website', phone: 'channel-phone', sms: 'channel-phone', walkin: 'channel-walkin' };
  Object.entries(channelCounts).forEach(([ch, count]) => {
    const elId = channelMap[ch];
    if (elId) {
      const el = document.getElementById(elId);
      if (el) el.textContent = count.toLocaleString('da-DK');
    }
  });
}

// Export CMS Data
function exportCMSData(format) {
  const data = {
    pages: JSON.parse(localStorage.getItem('flow_cms_pages') || '[]'),
    blogPosts: JSON.parse(localStorage.getItem('flow_blog_posts') || '[]'),
    workflows: {
      sms: JSON.parse(localStorage.getItem('flow_product_sms') || '{}'),
      instagram: JSON.parse(localStorage.getItem('flow_product_instagram') || '{}'),
      facebook: JSON.parse(localStorage.getItem('flow_product_facebook') || '{}')
    },
    exportedAt: new Date().toISOString()
  };

  let content, filename, type;

  if (format === 'json') {
    content = JSON.stringify(data, null, 2);
    filename = 'flow-cms-export-' + new Date().toISOString().split('T')[0] + '.json';
    type = 'application/json';
  } else if (format === 'csv') {
    // Simple CSV export for pages
    const headers = ['ID', 'Title', 'Slug', 'Status', 'Template', 'Created', 'Updated'];
    const rows = data.pages.map(p => [
      p.id || '',
      p.title || '',
      p.slug || '',
      p.status || '',
      p.template || '',
      p.createdAt || '',
      p.updatedAt || ''
    ]);
    content = [headers.join(','), ...rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(','))].join('\n');
    filename = 'flow-cms-pages-' + new Date().toISOString().split('T')[0] + '.csv';
    type = 'text/csv';
  }

  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  toast('Data eksporteret som ' + format.toUpperCase(), 'success');
}

// ============ INTEGRATIONS PAGE ============

// ==================== API Nøgler Page ====================

var apiConnectionsSearchQuery = '';
var apiConnectionsCurrentPage = 1;
var apiConnectionsPageSize = 10;

function loadApiNoglerPage() {
