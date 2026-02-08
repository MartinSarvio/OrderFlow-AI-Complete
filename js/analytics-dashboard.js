/**
 * FLOW Analytics Dashboard
 * Handles data loading and visualization for analytics dashboards
 */

const AnalyticsDashboard = {
    // Current state
    currentRestaurantId: null,
    dateRange: '7days',
    lastUpdated: null,
    cachedData: {},

    // ============================================================
    // INITIALIZATION
    // ============================================================

    /**
     * Initialize the analytics dashboard
     */
    init(restaurantId) {
        this.currentRestaurantId = restaurantId;
        console.log('Analytics Dashboard initialized for restaurant:', restaurantId);
    },

    /**
     * Set restaurant ID
     */
    setRestaurant(restaurantId) {
        this.currentRestaurantId = restaurantId;
        this.cachedData = {}; // Clear cache when restaurant changes
    },

    // ============================================================
    // DATA LOADING
    // ============================================================

    /**
     * Get date range based on selection
     */
    getDateRange(range) {
        const now = new Date();
        const end = now.toISOString().split('T')[0];
        let start;

        switch (range || this.dateRange) {
            case 'today':
                start = end;
                break;
            case '7days':
                const d7 = new Date(now);
                d7.setDate(d7.getDate() - 7);
                start = d7.toISOString().split('T')[0];
                break;
            case '30days':
                const d30 = new Date(now);
                d30.setDate(d30.getDate() - 30);
                start = d30.toISOString().split('T')[0];
                break;
            case '90days':
                const d90 = new Date(now);
                d90.setDate(d90.getDate() - 90);
                start = d90.toISOString().split('T')[0];
                break;
            default:
                const d = new Date(now);
                d.setDate(d.getDate() - 7);
                start = d.toISOString().split('T')[0];
        }

        return { start, end };
    },

    /**
     * Generate demo metrics data for charts/stats
     */
    generateDemoMetrics(days) {
        const data = [];
        const now = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const baseOrders = isWeekend ? 35 : 22;
            const orders = baseOrders + Math.floor(Math.random() * 15);
            const avgPrice = 280 + Math.floor(Math.random() * 60);
            data.push({
                date: date.toISOString().split('T')[0],
                total_revenue_dkk: orders * avgPrice,
                total_orders: orders,
                unique_visitors: Math.floor(orders * 3.5 + Math.random() * 20),
                total_sessions: Math.floor(orders * 4.2 + Math.random() * 30),
                orders_web: Math.floor(orders * 0.3),
                orders_app: Math.floor(orders * 0.4),
                orders_instagram: Math.floor(orders * 0.1),
                orders_facebook: Math.floor(orders * 0.05),
                orders_sms: Math.floor(orders * 0.1),
                orders_phone: Math.floor(orders * 0.05),
                orders_delivery: Math.floor(orders * 0.55),
                orders_pickup: Math.floor(orders * 0.4),
                orders_dine_in: Math.floor(orders * 0.05)
            });
        }
        return data;
    },

    /**
     * Generate demo AI metrics
     */
    generateDemoAIMetrics() {
        return {
            total_conversations: 89,
            orders_created: 34,
            completion_rate: 94,
            escalations: 5,
            abandoned: 12,
            avg_messages: 6,
            escalation_rate: 6
        };
    },

    /**
     * Generate demo conversations
     */
    generateDemoConversations() {
        const channels = ['web_chat', 'instagram_dm', 'facebook_messenger', 'sms'];
        const outcomes = ['order_completed', 'abandoned', 'escalated', 'info_provided'];
        const convs = [];
        for (let i = 0; i < 15; i++) {
            const started = new Date();
            started.setHours(started.getHours() - i * 3 - Math.floor(Math.random() * 5));
            convs.push({
                conversation_id: 'demo-conv-' + i,
                started_at: started.toISOString(),
                channel: channels[Math.floor(Math.random() * channels.length)],
                message_count: Math.floor(Math.random() * 12) + 3,
                outcome: i < 6 ? 'order_completed' : outcomes[Math.floor(Math.random() * outcomes.length)]
            });
        }
        return convs;
    },

    /**
     * Generate demo product analytics
     */
    generateDemoProductData() {
        const products = [
            { product_id: 'p1', product_name: 'Margherita Pizza', product_category: 'Pizza', units_sold: 47, revenue_dkk: 4230, menu_views: 234 },
            { product_id: 'p2', product_name: 'Pepperoni Pizza', product_category: 'Pizza', units_sold: 38, revenue_dkk: 3800, menu_views: 198 },
            { product_id: 'p3', product_name: 'Quattro Formaggi', product_category: 'Pizza', units_sold: 29, revenue_dkk: 3190, menu_views: 156 },
            { product_id: 'p4', product_name: 'Burger Classic', product_category: 'Burgere', units_sold: 34, revenue_dkk: 4080, menu_views: 178 },
            { product_id: 'p5', product_name: 'Tiramisu', product_category: 'Dessert', units_sold: 24, revenue_dkk: 1440, menu_views: 112 },
            { product_id: 'p6', product_name: 'Cola', product_category: 'Drikkevarer', units_sold: 56, revenue_dkk: 1680, menu_views: 89 },
            { product_id: 'p7', product_name: 'Caesar Salat', product_category: 'Salat', units_sold: 18, revenue_dkk: 1620, menu_views: 94 },
            { product_id: 'p8', product_name: 'Pommes Frites', product_category: 'Tilbeh\u00f8r', units_sold: 42, revenue_dkk: 1890, menu_views: 67 }
        ];
        return products;
    },

    /**
     * Load analytics overview data
     */
    async loadOverviewData() {
        if (!this.currentRestaurantId) {
            console.warn('No restaurant ID set for analytics');
            // Still show demo data if enabled
            if (typeof isDemoDataEnabled === 'function' && isDemoDataEnabled()) {
                const demoData = this.generateDemoMetrics(7);
                this.updateOverviewStats(demoData);
                this.updateRevenueChart(demoData);
                this.updateChannelChart(demoData);
                const aiData = this.generateDemoAIMetrics();
                this.updateAISummary(aiData);
            }
            return;
        }

        const { start, end } = this.getDateRange();
        let hasData = false;

        try {
            // Load daily metrics
            const metricsResult = await window.SupabaseDB?.getDailyMetrics(
                this.currentRestaurantId,
                start,
                end
            );

            if (metricsResult?.success && metricsResult.data && metricsResult.data.length > 0) {
                this.updateOverviewStats(metricsResult.data);
                this.updateRevenueChart(metricsResult.data);
                this.updateChannelChart(metricsResult.data);
                hasData = true;
            }

            // Load AI performance
            const aiResult = await window.SupabaseDB?.getAIPerformanceMetrics(
                this.currentRestaurantId,
                this.dateRange === 'today' ? 1 : parseInt(this.dateRange) || 7
            );

            if (aiResult?.success && aiResult.data) {
                this.updateAISummary(aiResult.data);
                hasData = true;
            }

            // Update timestamp
            this.lastUpdated = new Date();
            const updateEl = document.getElementById('analytics-last-updated');
            if (updateEl) {
                updateEl.textContent = `Opdateret ${this.formatTime(this.lastUpdated)}`;
            }

        } catch (err) {
            console.error('Error loading analytics overview:', err);
        }

        // Fallback to demo data if no real data and demo mode is on
        if (!hasData && typeof isDemoDataEnabled === 'function' && isDemoDataEnabled()) {
            const days = this.dateRange === 'today' ? 1 : this.dateRange === '30days' ? 30 : this.dateRange === '90days' ? 90 : 7;
            const demoData = this.generateDemoMetrics(days);
            this.updateOverviewStats(demoData);
            this.updateRevenueChart(demoData);
            this.updateChannelChart(demoData);
            const aiData = this.generateDemoAIMetrics();
            this.updateAISummary(aiData);
        }
    },

    /**
     * Load sales data
     */
    async loadSalesData() {
        const range = document.getElementById('sales-date-range')?.value || '7days';
        const { start, end } = this.getDateRange(range);
        let hasData = false;

        if (this.currentRestaurantId) {
            try {
                const result = await window.SupabaseDB?.getDailyMetrics(
                    this.currentRestaurantId,
                    start,
                    end
                );

                if (result?.success && result.data && result.data.length > 0) {
                    this.updateSalesStats(result.data);
                    this.updateSalesChart(result.data);
                    this.updateHourlyChart();
                    this.updateWeekdayChart(result.data);
                    hasData = true;
                }
            } catch (err) {
                console.error('Error loading sales data:', err);
            }
        }

        if (!hasData && typeof isDemoDataEnabled === 'function' && isDemoDataEnabled()) {
            const days = range === 'today' ? 1 : range === '30days' ? 30 : range === '90days' ? 90 : 7;
            const demoData = this.generateDemoMetrics(days);
            this.updateSalesStats(demoData);
            this.updateSalesChart(demoData);
            this.updateHourlyChart();
            this.updateWeekdayChart(demoData);
        }
    },

    /**
     * Load AI dashboard data
     */
    async loadAIData() {
        let hasData = false;

        if (this.currentRestaurantId) {
            try {
                const metricsResult = await window.SupabaseDB?.getAIPerformanceMetrics(
                    this.currentRestaurantId,
                    30
                );

                if (metricsResult?.success && metricsResult.data) {
                    this.updateAIStats(metricsResult.data);
                    this.updateOutcomeChart(metricsResult.data);
                    hasData = true;
                }

                const convsResult = await window.SupabaseDB?.getAIConversations(
                    this.currentRestaurantId,
                    20
                );

                if (convsResult?.success && convsResult.data) {
                    this.updateConversationsTable(convsResult.data);
                    hasData = true;
                }
            } catch (err) {
                console.error('Error loading AI data:', err);
            }
        }

        if (!hasData && typeof isDemoDataEnabled === 'function' && isDemoDataEnabled()) {
            const aiData = this.generateDemoAIMetrics();
            this.updateAIStats(aiData);
            this.updateOutcomeChart(aiData);
            this.updateConversationsTable(this.generateDemoConversations());
        }
    },

    /**
     * Load product analytics
     */
    async loadProductsData() {
        const { start, end } = this.getDateRange('30days');
        let hasData = false;

        if (this.currentRestaurantId) {
            try {
                const result = await window.SupabaseDB?.getProductAnalytics(
                    this.currentRestaurantId,
                    start,
                    end
                );

                if (result?.success && result.data && result.data.length > 0) {
                    this.updateProductsTable(result.data);
                    this.updateProductsStats(result.data);
                    hasData = true;
                }
            } catch (err) {
                console.error('Error loading products data:', err);
            }
        }

        if (!hasData && typeof isDemoDataEnabled === 'function' && isDemoDataEnabled()) {
            const demoProducts = this.generateDemoProductData();
            this.updateProductsTable(demoProducts);
            this.updateProductsStats(demoProducts);
        }
    },

    // ============================================================
    // UI UPDATES - OVERVIEW
    // ============================================================

    /**
     * Update overview statistics
     */
    updateOverviewStats(data) {
        const totals = this.aggregateMetrics(data);

        // Revenue
        this.updateStatCard('stat-revenue-value', this.formatCurrency(totals.totalRevenue));

        // Orders
        this.updateStatCard('stat-orders-value', this.formatNumber(totals.totalOrders));

        // AOV
        const aov = totals.totalOrders > 0 ? totals.totalRevenue / totals.totalOrders : 0;
        this.updateStatCard('stat-aov-value', this.formatCurrency(aov));

        // Visitors
        this.updateStatCard('stat-visitors-value', this.formatNumber(totals.uniqueVisitors));
    },

    /**
     * Update revenue chart
     */
    updateRevenueChart(data) {
        const container = document.getElementById('chart-revenue');
        if (!container) return;

        if (data.length === 0) {
            container.innerHTML = '<div style="text-align:center;color:var(--muted)">Ingen data for denne periode</div>';
            return;
        }

        // Create simple bar chart
        const maxRevenue = Math.max(...data.map(d => d.total_revenue_dkk || 0));
        const chartHtml = `
            <div style="display:flex;align-items:flex-end;gap:4px;height:250px;width:100%;padding:0 8px">
                ${data.map(d => {
                    const height = maxRevenue > 0 ? (d.total_revenue_dkk / maxRevenue * 200) : 0;
                    const date = new Date(d.date);
                    const dayName = date.toLocaleDateString('da-DK', { weekday: 'short' });
                    return `
                        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
                            <div style="width:100%;background:var(--primary);border-radius:4px 4px 0 0;height:${Math.max(height, 4)}px;min-height:4px;transition:height 0.3s" title="${this.formatCurrency(d.total_revenue_dkk)}"></div>
                            <div style="font-size:10px;color:var(--muted)">${dayName}</div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-top:8px;padding:0 8px">
                <span>0 DKK</span>
                <span>${this.formatCurrency(maxRevenue)}</span>
            </div>
        `;

        container.innerHTML = chartHtml;
    },

    /**
     * Update channel distribution chart
     */
    updateChannelChart(data) {
        const container = document.getElementById('channel-bars');
        if (!container) return;

        const totals = this.aggregateMetrics(data);

        const channels = [
            { name: 'Web', value: totals.ordersWeb, color: 'var(--primary)' },
            { name: 'App', value: totals.ordersApp, color: 'var(--success)' },
            { name: 'Instagram', value: totals.ordersInstagram, color: '#E4405F' },
            { name: 'Facebook', value: totals.ordersFacebook, color: '#1877F2' },
            { name: 'SMS', value: totals.ordersSms, color: 'var(--warning)' },
            { name: 'Telefon', value: totals.ordersPhone, color: 'var(--muted)' }
        ];

        const total = channels.reduce((sum, c) => sum + c.value, 0) || 1;

        const barsHtml = channels
            .filter(c => c.value > 0)
            .sort((a, b) => b.value - a.value)
            .map(channel => {
                const pct = Math.round(channel.value / total * 100);
                return `
                    <div style="display:flex;align-items:center;gap:12px">
                        <div style="width:80px;font-size:13px">${channel.name}</div>
                        <div style="flex:1;background:var(--bg-secondary);border-radius:4px;height:24px;overflow:hidden">
                            <div style="height:100%;background:${channel.color};width:${pct}%;transition:width 0.5s"></div>
                        </div>
                        <div style="width:60px;text-align:right;font-size:13px">${channel.value} (${pct}%)</div>
                    </div>
                `;
            }).join('');

        container.innerHTML = barsHtml || '<div style="color:var(--muted);text-align:center;padding:24px">Ingen ordrer i perioden</div>';
    },

    /**
     * Update AI summary on overview
     */
    updateAISummary(data) {
        document.getElementById('ai-conversations')?.replaceChildren(document.createTextNode(this.formatNumber(data.total_conversations)));
        document.getElementById('ai-completion-rate')?.replaceChildren(document.createTextNode(data.completion_rate + '%'));
        document.getElementById('ai-orders')?.replaceChildren(document.createTextNode(this.formatNumber(data.orders_created)));
        document.getElementById('ai-escalations')?.replaceChildren(document.createTextNode(this.formatNumber(data.escalations)));
    },

    // ============================================================
    // UI UPDATES - SALES
    // ============================================================

    /**
     * Update sales statistics
     */
    updateSalesStats(data) {
        const totals = this.aggregateMetrics(data);

        this.updateStatCard('sales-total-revenue', this.formatCurrency(totals.totalRevenue));
        this.updateStatCard('sales-total-orders', this.formatNumber(totals.totalOrders));

        const aov = totals.totalOrders > 0 ? totals.totalRevenue / totals.totalOrders : 0;
        this.updateStatCard('sales-avg-order', this.formatCurrency(aov));

        this.updateStatCard('sales-delivery-orders', this.formatNumber(totals.ordersDelivery));
        this.updateStatCard('sales-pickup-orders', this.formatNumber(totals.ordersPickup));
    },

    /**
     * Update sales chart
     */
    updateSalesChart(data) {
        const container = document.getElementById('sales-chart-revenue');
        if (!container) return;

        if (data.length === 0) {
            container.innerHTML = 'Ingen data for denne periode';
            return;
        }

        // Similar to revenue chart but larger
        const maxRevenue = Math.max(...data.map(d => d.total_revenue_dkk || 0));
        const chartHtml = `
            <div style="display:flex;align-items:flex-end;gap:2px;height:280px;width:100%">
                ${data.map(d => {
                    const height = maxRevenue > 0 ? (d.total_revenue_dkk / maxRevenue * 260) : 0;
                    const date = new Date(d.date);
                    const label = date.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' });
                    return `
                        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0">
                            <div style="font-size:10px;color:var(--text);white-space:nowrap;overflow:hidden">${this.formatCurrency(d.total_revenue_dkk, true)}</div>
                            <div style="width:100%;background:linear-gradient(to top, var(--primary), var(--primary-light, var(--primary)));border-radius:4px 4px 0 0;height:${Math.max(height, 4)}px"></div>
                            <div style="font-size:9px;color:var(--muted);white-space:nowrap">${label}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        container.innerHTML = chartHtml;
    },

    /**
     * Update hourly chart (placeholder with demo data)
     */
    updateHourlyChart() {
        const container = document.getElementById('sales-hourly-chart');
        if (!container) return;

        // Demo data - in production would come from events table
        const hourlyData = [0, 0, 0, 0, 0, 0, 2, 5, 12, 18, 22, 35, 45, 38, 25, 20, 28, 42, 55, 48, 32, 18, 8, 3];
        const maxOrders = Math.max(...hourlyData);

        const barsHtml = hourlyData.map((orders, hour) => {
            const height = maxOrders > 0 ? (orders / maxOrders * 180) : 0;
            const isActive = hour >= 11 && hour <= 21;
            return `
                <div style="flex:1;background:${isActive ? 'var(--primary)' : 'var(--bg-tertiary)'};border-radius:2px 2px 0 0;height:${Math.max(height, 2)}px;opacity:${isActive ? 1 : 0.4}" title="${hour}:00 - ${orders} ordrer"></div>
            `;
        }).join('');

        container.innerHTML = barsHtml;
    },

    /**
     * Update weekday chart
     */
    updateWeekdayChart(data) {
        const container = document.getElementById('sales-weekday-chart');
        if (!container) return;

        // Aggregate by weekday
        const weekdays = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
        const weekdayTotals = [0, 0, 0, 0, 0, 0, 0];

        data.forEach(d => {
            const day = new Date(d.date).getDay();
            weekdayTotals[day] += d.total_orders || 0;
        });

        const maxOrders = Math.max(...weekdayTotals);

        // Reorder to start with Monday
        const orderedDays = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun

        const barsHtml = orderedDays.map(dayIndex => {
            const orders = weekdayTotals[dayIndex];
            const pct = maxOrders > 0 ? (orders / maxOrders * 100) : 0;
            return `
                <div style="display:flex;align-items:center;gap:12px">
                    <div style="width:70px;font-size:13px">${weekdays[dayIndex].substring(0, 3)}</div>
                    <div style="flex:1;background:var(--bg-secondary);border-radius:4px;height:20px;overflow:hidden">
                        <div style="height:100%;background:var(--primary);width:${pct}%"></div>
                    </div>
                    <div style="width:40px;text-align:right;font-size:13px">${orders}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = barsHtml;
    },

    // ============================================================
    // UI UPDATES - AI
    // ============================================================

    /**
     * Update AI statistics
     */
    updateAIStats(data) {
        this.updateStatCard('ai-total-conversations', this.formatNumber(data.total_conversations));
        this.updateStatCard('ai-orders-created', this.formatNumber(data.orders_created));
        this.updateStatCard('ai-completion-rate-detail', data.completion_rate + '%');
        this.updateStatCard('ai-avg-messages', data.avg_messages);
        this.updateStatCard('ai-escalation-rate', data.escalation_rate + '%');
    },

    /**
     * Update outcome chart
     */
    updateOutcomeChart(data) {
        const total = data.total_conversations || 1;

        const completedPct = (data.orders_created / total * 100).toFixed(0);
        const escalatedPct = (data.escalations / total * 100).toFixed(0);
        const abandonedPct = (data.abandoned / total * 100).toFixed(0);
        const infoPct = Math.max(0, 100 - completedPct - escalatedPct - abandonedPct);

        // Update bars
        const completedBar = document.getElementById('ai-outcome-completed');
        const abandonedBar = document.getElementById('ai-outcome-abandoned');
        const escalatedBar = document.getElementById('ai-outcome-escalated');
        const infoBar = document.getElementById('ai-outcome-info');

        if (completedBar) completedBar.style.width = completedPct + '%';
        if (abandonedBar) abandonedBar.style.width = abandonedPct + '%';
        if (escalatedBar) escalatedBar.style.width = escalatedPct + '%';
        if (infoBar) infoBar.style.width = infoPct + '%';

        // Update percentages
        document.getElementById('ai-outcome-completed-pct')?.replaceChildren(document.createTextNode(completedPct + '%'));
        document.getElementById('ai-outcome-abandoned-pct')?.replaceChildren(document.createTextNode(abandonedPct + '%'));
        document.getElementById('ai-outcome-escalated-pct')?.replaceChildren(document.createTextNode(escalatedPct + '%'));
        document.getElementById('ai-outcome-info-pct')?.replaceChildren(document.createTextNode(infoPct + '%'));
    },

    /**
     * Update conversations table
     */
    updateConversationsTable(conversations) {
        const tbody = document.getElementById('ai-conversations-table');
        if (!tbody) return;

        if (!conversations || conversations.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--muted)">Ingen samtaler endnu</td></tr>';
            return;
        }

        const outcomeLabels = {
            'order_completed': '<span style="color:var(--success)">Ordre oprettet</span>',
            'abandoned': '<span style="color:var(--muted)">Afbrudt</span>',
            'escalated': '<span style="color:var(--warning)">Eskaleret</span>',
            'info_provided': '<span style="color:var(--primary)">Info givet</span>',
            'error': '<span style="color:var(--danger)">Fejl</span>'
        };

        const channelLabels = {
            'web_chat': 'Web',
            'instagram_dm': 'Instagram',
            'facebook_messenger': 'Facebook',
            'sms': 'SMS'
        };

        const rows = conversations.slice(0, 20).map(conv => `
            <tr>
                <td style="padding-left:16px">${this.formatDateTime(conv.started_at)}</td>
                <td>${channelLabels[conv.channel] || conv.channel}</td>
                <td>${conv.message_count || 0}</td>
                <td>${outcomeLabels[conv.outcome] || conv.outcome || '-'}</td>
                <td style="padding-right:16px">
                    <button class="btn btn-secondary" style="padding:4px 8px;font-size:11px" onclick="AnalyticsDashboard.viewConversation('${conv.conversation_id}')">
                        Se detaljer
                    </button>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = rows;
    },

    /**
     * View conversation details
     */
    async viewConversation(conversationId) {
        try {
            const result = await window.SupabaseDB?.getAIConversationWithMessages(conversationId);

            if (result?.success && result.data) {
                // Show in modal
                this.showConversationModal(result.data);
            }
        } catch (err) {
            console.error('Error loading conversation:', err);
        }
    },

    /**
     * Show conversation modal
     */
    showConversationModal(conversation) {
        const messages = conversation.messages || [];

        const messagesHtml = messages.map(msg => `
            <div style="display:flex;gap:12px;margin-bottom:12px;${msg.role === 'assistant' ? 'flex-direction:row-reverse' : ''}">
                <div style="width:32px;height:32px;border-radius:50%;background:${msg.role === 'user' ? 'var(--primary)' : 'var(--success)'};display:flex;align-items:center;justify-content:center;color:white;font-size:12px;flex-shrink:0">
                    ${msg.role === 'user' ? 'U' : 'AI'}
                </div>
                <div style="max-width:70%;padding:12px;border-radius:12px;background:var(--bg-secondary);${msg.role === 'assistant' ? 'background:var(--primary);color:white' : ''}">
                    <div style="font-size:13px">${msg.content}</div>
                    ${msg.detected_intent ? `<div style="font-size:10px;opacity:0.7;margin-top:4px">Intent: ${msg.detected_intent} (${(msg.intent_confidence * 100).toFixed(0)}%)</div>` : ''}
                </div>
            </div>
        `).join('');

        const modalHtml = `
            <div class="modal-overlay" id="modal-conversation" style="display:flex" onclick="if(event.target===this)this.remove()">
                <div class="modal" style="max-width:600px;max-height:80vh;display:flex;flex-direction:column">
                    <div class="modal-header">
                        <div class="modal-title">Samtale Detaljer</div>
                        <button class="modal-close" onclick="document.getElementById('modal-conversation').remove()">×</button>
                    </div>
                    <div class="modal-body" style="flex:1;overflow-y:auto">
                        <div style="margin-bottom:16px;padding:12px;background:var(--bg-secondary);border-radius:8px;display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
                            <div><strong>Kanal:</strong> ${conversation.channel}</div>
                            <div><strong>Udfald:</strong> ${conversation.outcome || '-'}</div>
                            <div><strong>Beskeder:</strong> ${conversation.message_count || 0}</div>
                            <div><strong>Startet:</strong> ${this.formatDateTime(conversation.started_at)}</div>
                        </div>
                        <div style="border-top:1px solid var(--border);padding-top:16px">
                            ${messagesHtml || '<div style="color:var(--muted);text-align:center">Ingen beskeder</div>'}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    // ============================================================
    // UI UPDATES - PRODUCTS
    // ============================================================

    /**
     * Update products table
     */
    updateProductsTable(data) {
        const tbody = document.getElementById('products-analytics-table');
        if (!tbody) return;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--muted)">Ingen produktdata endnu</td></tr>';
            return;
        }

        // Aggregate by product
        const productMap = new Map();
        data.forEach(row => {
            const key = row.product_id;
            if (!productMap.has(key)) {
                productMap.set(key, {
                    name: row.product_name || 'Ukendt',
                    category: row.product_category || '-',
                    unitsSold: 0,
                    revenue: 0,
                    views: 0
                });
            }
            const prod = productMap.get(key);
            prod.unitsSold += row.units_sold || 0;
            prod.revenue += row.revenue_dkk || 0;
            prod.views += row.menu_views || 0;
        });

        const products = Array.from(productMap.values())
            .sort((a, b) => b.revenue - a.revenue);

        const rows = products.map(prod => {
            const conversion = prod.views > 0 ? ((prod.unitsSold / prod.views) * 100).toFixed(1) : '-';
            return `
                <tr>
                    <td style="padding-left:16px">${prod.name}</td>
                    <td>${prod.category}</td>
                    <td style="text-align:right">${this.formatNumber(prod.unitsSold)}</td>
                    <td style="text-align:right">${this.formatCurrency(prod.revenue)}</td>
                    <td style="text-align:right">${this.formatNumber(prod.views)}</td>
                    <td style="text-align:right;padding-right:16px">${conversion}%</td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rows;
    },

    /**
     * Update products stats
     */
    updateProductsStats(data) {
        const totalSold = data.reduce((sum, d) => sum + (d.units_sold || 0), 0);
        const uniqueProducts = new Set(data.map(d => d.product_id)).size;

        this.updateStatCard('products-total-sold', this.formatNumber(totalSold));
        this.updateStatCard('products-unique', this.formatNumber(uniqueProducts));

        // Find bestseller
        const productMap = new Map();
        data.forEach(row => {
            const current = productMap.get(row.product_id) || { name: row.product_name, sold: 0 };
            current.sold += row.units_sold || 0;
            productMap.set(row.product_id, current);
        });

        let bestseller = { name: '-', sold: 0 };
        productMap.forEach(prod => {
            if (prod.sold > bestseller.sold) {
                bestseller = prod;
            }
        });

        this.updateStatCard('products-best-seller', bestseller.name);
    },

    // ============================================================
    // HELPER FUNCTIONS
    // ============================================================

    /**
     * Aggregate daily metrics
     */
    aggregateMetrics(data) {
        return data.reduce((acc, d) => ({
            totalRevenue: acc.totalRevenue + (d.total_revenue_dkk || 0),
            totalOrders: acc.totalOrders + (d.total_orders || 0),
            uniqueVisitors: acc.uniqueVisitors + (d.unique_visitors || 0),
            totalSessions: acc.totalSessions + (d.total_sessions || 0),
            ordersWeb: acc.ordersWeb + (d.orders_web || 0),
            ordersApp: acc.ordersApp + (d.orders_app || 0),
            ordersInstagram: acc.ordersInstagram + (d.orders_instagram || 0),
            ordersFacebook: acc.ordersFacebook + (d.orders_facebook || 0),
            ordersSms: acc.ordersSms + (d.orders_sms || 0),
            ordersPhone: acc.ordersPhone + (d.orders_phone || 0),
            ordersDelivery: acc.ordersDelivery + (d.orders_delivery || 0),
            ordersPickup: acc.ordersPickup + (d.orders_pickup || 0),
            ordersDineIn: acc.ordersDineIn + (d.orders_dine_in || 0)
        }), {
            totalRevenue: 0,
            totalOrders: 0,
            uniqueVisitors: 0,
            totalSessions: 0,
            ordersWeb: 0,
            ordersApp: 0,
            ordersInstagram: 0,
            ordersFacebook: 0,
            ordersSms: 0,
            ordersPhone: 0,
            ordersDelivery: 0,
            ordersPickup: 0,
            ordersDineIn: 0
        });
    },

    /**
     * Update a stat card value
     */
    updateStatCard(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value;
        }
    },

    /**
     * Format currency
     */
    formatCurrency(value, short = false) {
        if (value == null) return '-';
        const num = parseFloat(value);
        if (isNaN(num)) return '-';

        if (short && num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }

        return new Intl.NumberFormat('da-DK', {
            style: 'currency',
            currency: 'DKK',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num);
    },

    /**
     * Format number
     */
    formatNumber(value) {
        if (value == null) return '-';
        const num = parseInt(value);
        if (isNaN(num)) return '-';
        return new Intl.NumberFormat('da-DK').format(num);
    },

    /**
     * Format time
     */
    formatTime(date) {
        if (!date) return '';
        return new Date(date).toLocaleTimeString('da-DK', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Format date and time
     */
    formatDateTime(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleString('da-DK', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
};

// Global functions for HTML onclick handlers
function loadAnalyticsData() {
    const range = document.getElementById('analytics-date-range')?.value;
    if (range) {
        AnalyticsDashboard.dateRange = range;
    }
    AnalyticsDashboard.loadOverviewData();
}

function refreshAnalytics() {
    AnalyticsDashboard.loadOverviewData();
}

function loadSalesData() {
    AnalyticsDashboard.loadSalesData();
}

function loadAIData() {
    AnalyticsDashboard.loadAIData();
}

function loadProductsData() {
    AnalyticsDashboard.loadProductsData();
}

function filterProductsTable() {
    const search = document.getElementById('product-search')?.value?.toLowerCase() || '';
    const rows = document.querySelectorAll('#products-analytics-table tr');

    rows.forEach(row => {
        const text = row.textContent?.toLowerCase() || '';
        row.style.display = text.includes(search) ? '' : 'none';
    });
}

function exportSalesReport() {
    alert('Eksport funktion kommer snart');
}

// Expose globally
window.AnalyticsDashboard = AnalyticsDashboard;
