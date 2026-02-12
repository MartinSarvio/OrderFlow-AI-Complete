// FLOW Dashboard Module — loadDashboard, KPI cards, revenue chart

// =====================================================
// DATA LOADING
// =====================================================
function updateBreadcrumb(page, subpage) {
  const pageTitle = document.getElementById('page-title-kunder');
  if (!pageTitle) return;
  
  const pageTitles = {
    'dashboard': 'Dashboard',
    'kunder': 'Kunder',
    'orders': 'Ordrer',
    'workflow': 'Workflow',
    'settings': 'Indstillinger'
  };
  
  if (subpage) {
    // SECURITY FIX v4.12.0: Escape dynamic page names to prevent XSS
    pageTitle.innerHTML = `${escapeHtml(pageTitles[page] || page)} <span style="color:var(--muted);font-weight:400"> / </span> <span style="color:var(--text)">${escapeHtml(subpage)}</span>`;
  } else {
    pageTitle.textContent = pageTitles[page] || page;
  }
}

function showModal(id) {
  document.getElementById('modal-' + id).classList.add('active');
}

function closeModal(id) {
  document.getElementById('modal-' + id).classList.remove('active');
}


// =====================================================
// DATA LOADING
// =====================================================
// Dashboard data storage
let dashboardStats = {
  ordersThisMonth: 0,
  ordersTotal: 0,
  revenueThisMonth: 0,
  revenueTotal: 0,
  revenueHistory: [],
  revenuePeriod: 'week'
};

let revenueChart = null;

function loadDashboard() {
  // Combine real restaurants with demo customers if enabled
  let allRestaurants = [...restaurants];
  if (isDemoDataEnabled()) {
    const demoCustomers = getDemoDataCustomers();
    allRestaurants = [...allRestaurants, ...demoCustomers];
  }

  // Restaurant counts - EXTENDED for full lifecycle
  const active = allRestaurants.filter(r => r.status === 'active').length;
  const inactive = allRestaurants.filter(r => r.status === 'inactive' || r.status === 'pending').length;
  const churned = allRestaurants.filter(r => r.status === 'churned' || r.status === 'cancelled').length;
  const terminated = allRestaurants.filter(r => r.status === 'terminated').length;

  // Order counts - include demo data stats when enabled
  let ordersToday = allRestaurants.reduce((s, r) => s + (r.orders || 0), 0);
  dashboardStats.ordersThisMonth = allRestaurants.reduce((s, r) => s + (r.ordersThisMonth || 0), 0);
  dashboardStats.ordersTotal = allRestaurants.reduce((s, r) => s + (r.ordersTotal || r.orders_total || 0), 0);

  // Demo data: calculate demo stats from demo orders
  if (isDemoDataEnabled()) {
    const demoOrders = getDemoDataOrders();
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);
    const demoOrdersToday = demoOrders.filter(o => o.created_at?.startsWith(today)).length;
    const demoOrdersMonth = demoOrders.filter(o => o.created_at?.startsWith(thisMonth)).length;
    ordersToday += demoOrdersToday;
    dashboardStats.ordersThisMonth += demoOrdersMonth || Math.floor(demoOrders.length * 0.3);
    if (dashboardStats.ordersTotal === 0) dashboardStats.ordersTotal = demoOrders.length;
  }

  // Conversations: derive from orders, no random numbers
  const conversations = isDemoDataEnabled() ? Math.floor(ordersToday * 0.3) : 0;

  // Revenue calculations
  let revenueToday = allRestaurants.reduce((s, r) => s + (r.revenueToday || 0), 0);
  dashboardStats.revenueThisMonth = allRestaurants.reduce((s, r) => s + (r.revenueThisMonth || 0), 0);
  dashboardStats.revenueTotal = allRestaurants.reduce((s, r) => s + (r.revenueTotal || r.revenue_total || 0), 0);

  // Demo data: calculate demo revenue
  if (isDemoDataEnabled()) {
    const demoOrders = getDemoDataOrders();
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);
    const demoRevenueToday = demoOrders.filter(o => o.created_at?.startsWith(today)).reduce((s, o) => s + (o.total || 0), 0);
    const demoRevenueMonth = demoOrders.filter(o => o.created_at?.startsWith(thisMonth)).reduce((s, o) => s + (o.total || 0), 0);
    revenueToday += demoRevenueToday;
    dashboardStats.revenueThisMonth += demoRevenueMonth || Math.floor(demoOrders.reduce((s, o) => s + (o.total || 0), 0) * 0.3);
  }

  // Generate revenue history for chart
  generateRevenueHistory();
  
  // Update Restaurant Status
  const el1 = document.getElementById('stat-restaurants');
  const el2 = document.getElementById('stat-inactive');
  const el3 = document.getElementById('stat-churned');
  
  if (el1) el1.textContent = active;
  if (el2) el2.textContent = inactive;
  if (el3) el3.textContent = churned;

  // Update terminated count (GDPR retention)
  const elTerminated = document.getElementById('stat-terminated');
  if (elTerminated) elTerminated.textContent = terminated;

  // Update Order Statistics
  const el4 = document.getElementById('stat-orders');
  const el5 = document.getElementById('stat-orders-month');
  const el6 = document.getElementById('stat-orders-total');
  const el7 = document.getElementById('stat-conversations');
  
  // Format helper: show "—" when no data and not in demo mode
  const _dashFmt = (val, suffix) => {
    if (!isDemoDataEnabled() && val === 0) return '—';
    return suffix ? val.toLocaleString('da-DK') + suffix : val.toLocaleString('da-DK');
  };

  if (el4) el4.textContent = _dashFmt(ordersToday, '');
  if (el5) el5.textContent = _dashFmt(dashboardStats.ordersThisMonth, '');
  if (el6) el6.textContent = _dashFmt(dashboardStats.ordersTotal, '');
  if (el7) el7.textContent = _dashFmt(conversations, '');
  
  // Update Revenue
  const el8 = document.getElementById('stat-revenue');
  const el9 = document.getElementById('stat-revenue-month');
  const el10 = document.getElementById('stat-revenue-total');
  
  if (el8) el8.textContent = _dashFmt(revenueToday, ' kr');
  if (el9) el9.textContent = _dashFmt(dashboardStats.revenueThisMonth, ' kr');
  if (el10) el10.textContent = _dashFmt(dashboardStats.revenueTotal, ' kr');
  
  // Initialize chart with delay to ensure Chart.js is loaded
  setTimeout(() => {
    initRevenueChart();
  }, 100);

  // Update recent activity feed
  updateRecentActivityUI();
}

function generateRevenueHistory() {
  const now = new Date();
  const history = { week: [], month: [], year: [], weekPrev: [], monthPrev: [], yearPrev: [] };

  // Use demo orders for chart data when demo mode is enabled
  const useDemoChart = isDemoDataEnabled();
  let demoOrders = [];
  if (useDemoChart) {
    demoOrders = getDemoDataOrders();
  }

  // Helper: sum demo revenue for a date
  const getDemoRevenueForDate = (dateStr) => {
    return demoOrders.filter(o => o.created_at?.startsWith(dateStr)).reduce((s, o) => s + (o.total || 0), 0);
  };

  // 7 dage
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayLabel = date.toLocaleDateString('da-DK', { weekday: 'short' });
    const dateStr = date.toISOString().split('T')[0];
    const val = useDemoChart ? getDemoRevenueForDate(dateStr) : 0;
    history.week.push({ label: dayLabel, value: val });
    // Previous week
    const prevDate = new Date(date);
    prevDate.setDate(prevDate.getDate() - 7);
    const prevStr = prevDate.toISOString().split('T')[0];
    history.weekPrev.push({ label: dayLabel, value: useDemoChart ? getDemoRevenueForDate(prevStr) : 0 });
  }

  // 30 dage
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayLabel = date.getDate() + '/' + (date.getMonth() + 1);
    const dateStr = date.toISOString().split('T')[0];
    const val = useDemoChart ? getDemoRevenueForDate(dateStr) : 0;
    history.month.push({ label: dayLabel, value: val });
    const prevDate = new Date(date);
    prevDate.setDate(prevDate.getDate() - 30);
    history.monthPrev.push({ label: dayLabel, value: useDemoChart ? getDemoRevenueForDate(prevDate.toISOString().split('T')[0]) : 0 });
  }

  // 12 måneder
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    const monthLabel = monthNames[date.getMonth()];
    const monthStr = date.toISOString().slice(0, 7);
    const val = useDemoChart ? demoOrders.filter(o => o.created_at?.startsWith(monthStr)).reduce((s, o) => s + (o.total || 0), 0) : 0;
    history.year.push({ label: monthLabel, value: val });
    const prevDate = new Date(date);
    prevDate.setFullYear(prevDate.getFullYear() - 1);
    history.yearPrev.push({ label: monthLabel, value: 0 });
  }

  dashboardStats.revenueHistory = history;
}

function initRevenueChart() {
  const canvas = document.getElementById('revenue-chart');
  if (!canvas || typeof Chart === 'undefined') return;
  
  // Destroy existing chart
  if (revenueChart) {
    revenueChart.destroy();
  }
  
  const ctx = canvas.getContext('2d');
  const period = dashboardStats.revenuePeriod;
  const data = dashboardStats.revenueHistory[period] || [];
  const prevData = dashboardStats.revenueHistory[period + 'Prev'] || [];
  
  revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.label),
      datasets: [
        {
          label: 'Omsætning',
          data: data.map(d => d.value),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4
        },
        {
          label: 'Forrige periode',
          data: prevData.map(d => d.value),
          borderColor: '#60a5fa',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.4,
          borderWidth: 1.5,
          pointRadius: 0,
          pointHoverRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: false,
          external: function(context) {
            // Get or create tooltip element
            let tooltipEl = document.getElementById('chartjs-tooltip');
            if (!tooltipEl) {
              tooltipEl = document.createElement('div');
              tooltipEl.id = 'chartjs-tooltip';
              tooltipEl.innerHTML = '<div class="chart-tooltip-inner"></div>';
              document.body.appendChild(tooltipEl);
            }
            
            const tooltipModel = context.tooltip;
            
            // Hide if no tooltip
            if (tooltipModel.opacity === 0) {
              tooltipEl.style.opacity = 0;
              tooltipEl.style.display = 'none';
              return;
            }
            tooltipEl.style.display = 'block';
            
            // Set content
            if (tooltipModel.body) {
              const dataPoints = tooltipModel.dataPoints;
              const label = dataPoints[0].label;
              
              // Format date based on period
              let dateStr = label;
              const now = new Date();
              if (dashboardStats.revenuePeriod === 'week') {
                // Convert weekday to full date
                const dayMap = { 'man': 1, 'tir': 2, 'ons': 3, 'tor': 4, 'fre': 5, 'lør': 6, 'søn': 0 };
                const dayIndex = dataPoints[0].dataIndex;
                const date = new Date();
                date.setDate(date.getDate() - (6 - dayIndex));
                dateStr = date.getDate() + ' ' + ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'][date.getMonth()] + ' ' + date.getFullYear();
              } else if (dashboardStats.revenuePeriod === 'month') {
                // Already in d/m format, convert to full
                const parts = label.split('/');
                if (parts.length === 2) {
                  const monthNames = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
                  dateStr = parts[0] + ' ' + monthNames[parseInt(parts[1]) - 1] + ' ' + now.getFullYear();
                }
              } else {
                // Year view - month name
                dateStr = label + ' ' + now.getFullYear();
              }
              
              let innerHtml = '<div class="chart-tooltip-title">' + dateStr + '</div>';
              innerHtml += '<div class="chart-tooltip-body">';
              
              dataPoints.forEach((point, i) => {
                const color = point.dataset.borderColor;
                const value = point.raw.toLocaleString('da-DK');
                const labelText = i === 0 ? 'Omsætning' : 'Forrige periode';
                innerHtml += '<div class="chart-tooltip-row">';
                innerHtml += '<span class="chart-tooltip-dot" style="background:' + color + '"></span>';
                innerHtml += '<span class="chart-tooltip-label">' + labelText + '</span>';
                innerHtml += '<span class="chart-tooltip-value">' + value + ' DKK</span>';
                innerHtml += '</div>';
              });
              
              innerHtml += '</div>';
              tooltipEl.querySelector('.chart-tooltip-inner').innerHTML = innerHtml;
            }
            
            // Position
            const position = context.chart.canvas.getBoundingClientRect();
            const mouseEvent = context.chart._lastEvent;
            const mouseY = mouseEvent ? mouseEvent.y : tooltipModel.caretY;
            tooltipEl.style.opacity = 1;
            tooltipEl.style.position = 'absolute';
            tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
            tooltipEl.style.top = position.top + window.pageYOffset + mouseY - 10 + 'px';
            tooltipEl.style.pointerEvents = 'none';
            tooltipEl.style.transform = 'translateX(-50%)';
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: true,
            color: document.documentElement.getAttribute('data-theme') === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)',
            drawBorder: true,
            borderColor: document.documentElement.getAttribute('data-theme') === 'light' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.1)'
          },
          ticks: {
            display: true,
            color: document.documentElement.getAttribute('data-theme') === 'light' ? '#000000' : '#ffffff',
            font: { size: 11 },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 7
          },
          border: {
            display: true,
            color: document.documentElement.getAttribute('data-theme') === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            display: true,
            color: document.documentElement.getAttribute('data-theme') === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)',
            drawBorder: true,
            borderColor: document.documentElement.getAttribute('data-theme') === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'
          },
          ticks: {
            display: true,
            color: document.documentElement.getAttribute('data-theme') === 'light' ? '#000000' : '#ffffff',
            font: { size: 11 },
            maxTicksLimit: 6,
            callback: function(value) {
              if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
              if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
              return value;
            }
          },
          border: {
            display: true,
            color: document.documentElement.getAttribute('data-theme') === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'
          }
        }
      }
    }
  });
}

function setRevenuePeriod(period) {
  dashboardStats.revenuePeriod = period;
  
  // Update button states
  document.querySelectorAll('.chart-period').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.includes(
      period === 'week' ? '7 dage' : period === 'month' ? '30 dage' : '12 mdr'
    ));
  });
  
  // Redraw chart
  initRevenueChart();
}

// Restaurant logo SVG icons based on type/emoji
