// =====================================================
// SOCIAL MEDIA INTEGRATION MODULE
// Facebook & Instagram - OAuth, Workflows, Push Messages
// =====================================================

(function() {
  'use strict';

  // ============================================
  // 1. INTEGRATION STATUS MANAGER
  // ============================================
  
  const SocialIntegration = {
    // Check if a platform is connected (from localStorage/config)
    isConnected(platform) {
      const status = JSON.parse(localStorage.getItem('orderflow_' + platform + '_agent_status') || '{}');
      return status.connected === true;
    },

    // Get integration details
    getIntegration(platform) {
      return {
        connected: this.isConnected(platform),
        pageId: localStorage.getItem(platform + '_page_id') || '',
        pageName: localStorage.getItem(platform + '_page_name') || '',
        accessToken: localStorage.getItem(platform + '_access_token') || '',
        enabled: localStorage.getItem(platform + '-toggle-state') === 'true'
      };
    },

    // Connect platform (mock for demo)
    connect(platform, data) {
      const status = JSON.parse(localStorage.getItem('orderflow_' + platform + '_agent_status') || '{}');
      status.connected = true;
      status.active = true;
      localStorage.setItem('orderflow_' + platform + '_agent_status', JSON.stringify(status));
      if (data.pageId) localStorage.setItem(platform + '_page_id', data.pageId);
      if (data.pageName) localStorage.setItem(platform + '_page_name', data.pageName);
      if (data.accessToken) localStorage.setItem(platform + '_access_token', data.accessToken);
      this.refreshAllUI();
    },

    // Disconnect platform
    disconnect(platform) {
      const status = { active: false, connected: false, paymentsConfigured: false };
      localStorage.setItem('orderflow_' + platform + '_agent_status', JSON.stringify(status));
      localStorage.removeItem(platform + '_page_id');
      localStorage.removeItem(platform + '_page_name');
      localStorage.removeItem(platform + '_access_token');
      this.refreshAllUI();
    },

    // Refresh all related UI
    refreshAllUI() {
      ['instagram', 'facebook'].forEach(function(ch) {
        if (typeof updateWorkflowAgentUI === 'function') updateWorkflowAgentUI(ch);
      });
      // Re-render integrationer tab if visible
      if (typeof renderCustomerIntegrations === 'function') {
        var el = document.getElementById('vaerktoejer-content-apikeys');
        if (el && el.style.display !== 'none') renderCustomerIntegrations();
      }
    }
  };

  // ============================================
  // 2. PRODUCT TRACKING & PUSH MESSAGES
  // ============================================

  const ProductTracker = {
    DB_KEY: 'orderflow_product_views',
    TEMPLATES_KEY: 'orderflow_push_templates',
    PUSH_LOG_KEY: 'orderflow_push_log',

    // Default message templates (Danish)
    defaultTemplates: {
      product_view: {
        instagram: "Hej {name}! 👋 Så du lige vores {product}? {emoji} Vil du bestille? Skriv 'bestil' for at komme i gang!",
        facebook: "Hej {name}! 👋 Vi så du kiggede på vores {product} {emoji}. Skal vi hjælpe dig med en bestilling?"
      },
      cart_abandon: {
        instagram: "Hej {name}! Din kurv venter stadig på dig 🛒 Du havde {product} klar. Vil du afslutte din bestilling?",
        facebook: "Hej {name}! Du glemte vist din kurv 🛒 {product} venter stadig på dig!"
      },
      reorder: {
        instagram: "Hej {name}! Det er et stykke tid siden din sidste bestilling af {product} {emoji}. Skal vi lave en til?",
        facebook: "Hej {name}! Savner du vores {product}? {emoji} Bestil igen med ét klik!"
      }
    },

    // Product emoji map
    emojiMap: {
      pizza: '🍕', burger: '🍔', sushi: '🍣', salat: '🥗', pasta: '🍝',
      kaffe: '☕', dessert: '🍰', drinks: '🥤', sandwich: '🥪', default: '😋'
    },

    // Log a product view
    logView(userId, productId, productName, platform) {
      const views = JSON.parse(localStorage.getItem(this.DB_KEY) || '[]');
      views.push({
        id: 'pv_' + Date.now(),
        userId: userId,
        productId: productId,
        productName: productName,
        platform: platform,
        timestamp: new Date().toISOString(),
        pushSent: false,
        converted: false
      });
      // Keep last 500 entries
      if (views.length > 500) views.splice(0, views.length - 500);
      localStorage.setItem(this.DB_KEY, JSON.stringify(views));
      
      // Check if we should trigger a push
      this.checkTrigger(userId, productId, productName, platform);
    },

    // Check trigger conditions
    checkTrigger(userId, productId, productName, platform) {
      const settings = this.getSettings();
      if (!settings.enabled) return;

      const delayMs = (settings.delayMinutes || 5) * 60 * 1000;

      // Schedule push message
      setTimeout(() => {
        this.sendPush(userId, productId, productName, platform);
      }, delayMs);
    },

    // Send push message (mock/demo)
    sendPush(userId, productId, productName, platform) {
      if (!SocialIntegration.isConnected(platform)) return;

      const views = JSON.parse(localStorage.getItem(this.DB_KEY) || '[]');
      const view = views.find(v => v.userId === userId && v.productId === productId && !v.pushSent);
      if (!view) return;

      // Check if user already converted
      if (view.converted) return;

      // Get template
      const templates = JSON.parse(localStorage.getItem(this.TEMPLATES_KEY) || 'null') || this.defaultTemplates;
      const template = templates.product_view[platform] || templates.product_view.instagram;

      // Find emoji
      let emoji = this.emojiMap.default;
      Object.keys(this.emojiMap).forEach(key => {
        if (productName.toLowerCase().includes(key)) emoji = this.emojiMap[key];
      });

      // Build message
      const message = template
        .replace('{name}', 'kunde')
        .replace('{product}', productName)
        .replace('{emoji}', emoji);

      // Log the push
      const log = JSON.parse(localStorage.getItem(this.PUSH_LOG_KEY) || '[]');
      log.push({
        id: 'push_' + Date.now(),
        userId: userId,
        productId: productId,
        productName: productName,
        platform: platform,
        message: message,
        timestamp: new Date().toISOString(),
        status: 'sent' // demo mode
      });
      localStorage.setItem(this.PUSH_LOG_KEY, JSON.stringify(log));

      // Mark view as push sent
      view.pushSent = true;
      localStorage.setItem(this.DB_KEY, JSON.stringify(views));

      console.log('[ProductTracker] Push sent:', { platform, userId, productName, message });
    },

    // Get settings
    getSettings() {
      return JSON.parse(localStorage.getItem('orderflow_push_settings') || '{"enabled":true,"delayMinutes":5}');
    },

    // Save settings
    saveSettings(settings) {
      localStorage.setItem('orderflow_push_settings', JSON.stringify(settings));
    },

    // Get push log
    getLog() {
      return JSON.parse(localStorage.getItem(this.PUSH_LOG_KEY) || '[]');
    },

    // Get stats
    getStats() {
      const log = this.getLog();
      const views = JSON.parse(localStorage.getItem(this.DB_KEY) || '[]');
      return {
        totalViews: views.length,
        totalPushes: log.length,
        converted: views.filter(v => v.converted).length,
        conversionRate: views.length > 0 ? Math.round((views.filter(v => v.converted).length / views.length) * 100) : 0
      };
    }
  };

  // ============================================
  // 3. WORKFLOW AUTOMATION ENGINE
  // ============================================

  const WorkflowEngine = {
    DB_KEY: 'orderflow_workflows',
    LOG_KEY: 'orderflow_workflow_log',

    // Default workflows
    defaultWorkflows: [
      {
        id: 'wf_menu',
        name: 'Menu forespørgsel',
        platform: 'both',
        enabled: true,
        trigger: {
          type: 'message_received',
          conditions: [
            { field: 'text', operator: 'contains_any', values: ['menu', 'menukort', 'hvad har i', 'hvad tilbyder'] }
          ]
        },
        actions: [
          { type: 'reply', message: "Her er vores menu! 📋 Du kan se alle vores retter herunder. Skriv navnet på den ret du vil bestille, så hjælper jeg dig! 😊" },
          { type: 'send_menu', format: 'text' },
          { type: 'set_context', key: 'awaiting_order', value: true }
        ]
      },
      {
        id: 'wf_order',
        name: 'Bestilling',
        platform: 'both',
        enabled: true,
        trigger: {
          type: 'message_received',
          conditions: [
            { field: 'text', operator: 'contains_any', values: ['bestil', 'bestille', 'order', 'købe', 'vil gerne have'] }
          ]
        },
        actions: [
          { type: 'reply', message: "Fantastisk! 🎉 Hvad vil du gerne bestille? Skriv retnavnet og antal." },
          { type: 'start_order_flow' },
          { type: 'set_context', key: 'ordering', value: true }
        ]
      },
      {
        id: 'wf_hours',
        name: 'Åbningstider',
        platform: 'both',
        enabled: true,
        trigger: {
          type: 'message_received',
          conditions: [
            { field: 'text', operator: 'contains_any', values: ['åbningstider', 'hvornår åbner', 'hvornår lukker', 'åben', 'lukket', 'opening hours'] }
          ]
        },
        actions: [
          { type: 'reply', message: "🕐 Vores åbningstider:\n\nMandag-Fredag: 11:00 - 22:00\nLørdag-Søndag: 12:00 - 23:00\n\nVi glæder os til at se dig! 😊" }
        ]
      },
      {
        id: 'wf_delivery',
        name: 'Leveringsinfo',
        platform: 'both',
        enabled: true,
        trigger: {
          type: 'message_received',
          conditions: [
            { field: 'text', operator: 'contains_any', values: ['levering', 'levere', 'delivery', 'udbringning', 'fragt'] }
          ]
        },
        actions: [
          { type: 'reply', message: "🚗 Vi leverer inden for 5 km radius!\n\n• Leveringstid: 30-45 min\n• Minimum ordre: 100 kr\n• Gratis levering over 250 kr\n\nVil du bestille med levering?" }
        ]
      },
      {
        id: 'wf_greeting',
        name: 'Velkomst',
        platform: 'both',
        enabled: true,
        trigger: {
          type: 'message_received',
          conditions: [
            { field: 'text', operator: 'contains_any', values: ['hej', 'hey', 'hello', 'hi', 'goddag', 'hallo'] }
          ]
        },
        actions: [
          { type: 'reply', message: "Hej! 👋 Velkommen! Hvordan kan jeg hjælpe dig?\n\n📋 Skriv 'menu' for at se vores menu\n🛒 Skriv 'bestil' for at bestille\n🕐 Skriv 'åbningstider' for tider\n🚗 Skriv 'levering' for leveringsinfo" }
        ]
      }
    ],

    // Load workflows
    getWorkflows() {
      const stored = localStorage.getItem(this.DB_KEY);
      if (stored) return JSON.parse(stored);
      // Initialize with defaults
      localStorage.setItem(this.DB_KEY, JSON.stringify(this.defaultWorkflows));
      return this.defaultWorkflows;
    },

    // Save workflows
    saveWorkflows(workflows) {
      localStorage.setItem(this.DB_KEY, JSON.stringify(workflows));
    },

    // Add workflow
    addWorkflow(workflow) {
      const workflows = this.getWorkflows();
      workflow.id = 'wf_' + Date.now();
      workflows.push(workflow);
      this.saveWorkflows(workflows);
      return workflow;
    },

    // Update workflow
    updateWorkflow(id, updates) {
      const workflows = this.getWorkflows();
      const idx = workflows.findIndex(w => w.id === id);
      if (idx >= 0) {
        Object.assign(workflows[idx], updates);
        this.saveWorkflows(workflows);
      }
    },

    // Delete workflow
    deleteWorkflow(id) {
      const workflows = this.getWorkflows().filter(w => w.id !== id);
      this.saveWorkflows(workflows);
    },

    // Toggle workflow
    toggleWorkflow(id) {
      const workflows = this.getWorkflows();
      const wf = workflows.find(w => w.id === id);
      if (wf) {
        wf.enabled = !wf.enabled;
        this.saveWorkflows(workflows);
      }
    },

    // Process incoming message
    processMessage(message, platform) {
      const workflows = this.getWorkflows().filter(w => w.enabled && (w.platform === 'both' || w.platform === platform));
      
      for (const wf of workflows) {
        if (this.matchesTrigger(message, wf.trigger)) {
          this.executeActions(wf, message, platform);
          this.logExecution(wf, message, platform);
          return { matched: true, workflow: wf };
        }
      }
      return { matched: false };
    },

    // Check if message matches trigger
    matchesTrigger(message, trigger) {
      if (trigger.type !== 'message_received') return false;
      
      const text = (message.text || '').toLowerCase();
      
      for (const condition of trigger.conditions) {
        if (condition.operator === 'contains_any') {
          if (condition.values.some(v => text.includes(v.toLowerCase()))) return true;
        } else if (condition.operator === 'equals') {
          if (condition.values.some(v => text === v.toLowerCase())) return true;
        } else if (condition.operator === 'starts_with') {
          if (condition.values.some(v => text.startsWith(v.toLowerCase()))) return true;
        }
      }
      return false;
    },

    // Execute workflow actions
    executeActions(workflow, message, platform) {
      const actions = workflow.actions || [];
      let delay = 0;

      actions.forEach(action => {
        setTimeout(() => {
          this.executeAction(action, message, platform);
        }, delay);
        delay += 1000; // 1 sec between actions
      });
    },

    // Execute single action
    executeAction(action, message, platform) {
      switch (action.type) {
        case 'reply':
          console.log('[Workflow] Reply on ' + platform + ':', action.message);
          // In production: call Instagram/Facebook API to send message
          break;
        case 'send_menu':
          console.log('[Workflow] Sending menu on ' + platform);
          break;
        case 'start_order_flow':
          console.log('[Workflow] Starting order flow on ' + platform);
          // In production: integrate with OrderingAgent
          break;
        case 'set_context':
          console.log('[Workflow] Set context:', action.key, '=', action.value);
          break;
        case 'create_order':
          console.log('[Workflow] Creating order on ' + platform);
          break;
        case 'update_crm':
          console.log('[Workflow] Updating CRM for user');
          break;
        default:
          console.log('[Workflow] Unknown action:', action.type);
      }
    },

    // Log workflow execution
    logExecution(workflow, message, platform) {
      const log = JSON.parse(localStorage.getItem(this.LOG_KEY) || '[]');
      log.push({
        id: 'wflog_' + Date.now(),
        workflowId: workflow.id,
        workflowName: workflow.name,
        platform: platform,
        messageText: (message.text || '').substring(0, 100),
        timestamp: new Date().toISOString()
      });
      if (log.length > 200) log.splice(0, log.length - 200);
      localStorage.setItem(this.LOG_KEY, JSON.stringify(log));
    },

    // Get execution log
    getLog() {
      return JSON.parse(localStorage.getItem(this.LOG_KEY) || '[]');
    },

    // Get stats
    getStats() {
      const log = this.getLog();
      const workflows = this.getWorkflows();
      const now = new Date();
      const today = log.filter(l => new Date(l.timestamp).toDateString() === now.toDateString());
      const thisWeek = log.filter(l => (now - new Date(l.timestamp)) < 7 * 24 * 60 * 60 * 1000);
      
      return {
        totalWorkflows: workflows.length,
        activeWorkflows: workflows.filter(w => w.enabled).length,
        totalExecutions: log.length,
        todayExecutions: today.length,
        weekExecutions: thisWeek.length
      };
    }
  };

  // ============================================
  // 4. WORKFLOW UI RENDERER
  // ============================================

  function renderWorkflowSection(platform) {
    const workflows = WorkflowEngine.getWorkflows().filter(w => w.platform === 'both' || w.platform === platform);
    const stats = WorkflowEngine.getStats();

    let html = '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-5);margin-bottom:var(--space-5)">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-4)">';
    html += '<div><h3 style="font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);margin:0">Workflow Automation</h3>';
    html += '<p style="color:var(--muted);font-size:var(--font-size-sm);margin-top:4px">' + stats.activeWorkflows + ' aktive workflows • ' + stats.todayExecutions + ' kørt i dag</p></div>';
    html += '<button class="btn btn-sm btn-primary" onclick="SocialIntegration.showAddWorkflowModal(\'' + platform + '\')">+ Ny Workflow</button>';
    html += '</div>';

    // Workflow list
    html += '<div style="display:flex;flex-direction:column;gap:var(--space-3)">';
    workflows.forEach(function(wf) {
      const color = wf.enabled ? 'var(--success)' : 'var(--muted)';
      const triggerText = wf.trigger.conditions.map(c => c.values.join(', ')).join(' / ');
      const actionCount = (wf.actions || []).length;

      html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-3);background:var(--bg2);border-radius:var(--radius-sm);border:1px solid var(--border)">';
      html += '<div style="display:flex;align-items:center;gap:var(--space-3);flex:1">';
      html += '<div style="width:8px;height:8px;border-radius:50%;background:' + color + ';flex-shrink:0"></div>';
      html += '<div><span style="font-weight:500;font-size:var(--font-size-sm)">' + wf.name + '</span>';
      html += '<div style="font-size:11px;color:var(--muted);margin-top:2px">Trigger: "' + triggerText + '" → ' + actionCount + ' handling' + (actionCount !== 1 ? 'er' : '') + '</div></div>';
      html += '</div>';
      html += '<div style="display:flex;align-items:center;gap:var(--space-2)">';
      html += '<button class="btn btn-sm" onclick="SocialIntegration.editWorkflow(\'' + wf.id + '\')" style="padding:4px 8px;font-size:11px;border:1px solid var(--border);background:var(--card);color:var(--color-text);border-radius:var(--radius-sm);cursor:pointer">Rediger</button>';
      html += '<label style="position:relative;display:inline-block;width:36px;height:20px;cursor:pointer">';
      html += '<input type="checkbox"' + (wf.enabled ? ' checked' : '') + ' onchange="SocialIntegration.toggleWorkflow(\'' + wf.id + '\')" style="opacity:0;width:0;height:0">';
      html += '<div style="position:absolute;inset:0;background:' + (wf.enabled ? 'var(--success)' : 'var(--muted)') + ';border-radius:10px;transition:0.2s"><span style="position:absolute;left:2px;top:2px;width:16px;height:16px;background:white;border-radius:50%;transition:0.2s;transform:' + (wf.enabled ? 'translateX(16px)' : 'translateX(0)') + '"></span></div>';
      html += '</label>';
      html += '</div></div>';
    });
    html += '</div></div>';

    return html;
  }

  // ============================================
  // 5. PUSH MESSAGE UI RENDERER
  // ============================================

  function renderPushMessageSection(platform) {
    const stats = ProductTracker.getStats();
    const settings = ProductTracker.getSettings();
    const log = ProductTracker.getLog().filter(l => l.platform === platform).slice(-5).reverse();

    let html = '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-5);margin-bottom:var(--space-5)">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-4)">';
    html += '<div><h3 style="font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);margin:0">Push Beskeder</h3>';
    html += '<p style="color:var(--muted);font-size:var(--font-size-sm);margin-top:4px">Proaktive beskeder baseret på produktvisninger</p></div>';
    html += '<label style="position:relative;display:inline-block;width:40px;height:22px;cursor:pointer">';
    html += '<input type="checkbox"' + (settings.enabled ? ' checked' : '') + ' onchange="SocialIntegration.togglePushMessages(this.checked)" style="opacity:0;width:0;height:0">';
    html += '<div style="position:absolute;inset:0;background:' + (settings.enabled ? 'var(--success)' : 'var(--muted)') + ';border-radius:11px;transition:0.2s"><span style="position:absolute;left:2px;top:2px;width:18px;height:18px;background:white;border-radius:50%;transition:0.2s;transform:' + (settings.enabled ? 'translateX(18px)' : 'translateX(0)') + '"></span></div>';
    html += '</label></div>';

    // Stats row
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-3);margin-bottom:var(--space-4)">';
    html += '<div style="text-align:center;padding:var(--space-3);background:var(--bg2);border-radius:var(--radius-sm)"><div style="font-size:var(--font-size-xl);font-weight:var(--font-weight-bold);color:var(--primary)">' + stats.totalViews + '</div><div style="font-size:11px;color:var(--muted)">Visninger</div></div>';
    html += '<div style="text-align:center;padding:var(--space-3);background:var(--bg2);border-radius:var(--radius-sm)"><div style="font-size:var(--font-size-xl);font-weight:var(--font-weight-bold);color:#ec4899">' + stats.totalPushes + '</div><div style="font-size:11px;color:var(--muted)">Sendt</div></div>';
    html += '<div style="text-align:center;padding:var(--space-3);background:var(--bg2);border-radius:var(--radius-sm)"><div style="font-size:var(--font-size-xl);font-weight:var(--font-weight-bold);color:var(--success)">' + stats.converted + '</div><div style="font-size:11px;color:var(--muted)">Konverteret</div></div>';
    html += '<div style="text-align:center;padding:var(--space-3);background:var(--bg2);border-radius:var(--radius-sm)"><div style="font-size:var(--font-size-xl);font-weight:var(--font-weight-bold)">' + stats.conversionRate + '%</div><div style="font-size:11px;color:var(--muted)">Rate</div></div>';
    html += '</div>';

    // Delay setting
    html += '<div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-4);padding:var(--space-3);background:var(--bg2);border-radius:var(--radius-sm)">';
    html += '<span style="font-size:var(--font-size-sm);font-weight:500">Forsinkelse:</span>';
    html += '<select class="input" onchange="SocialIntegration.setPushDelay(this.value)" style="width:auto;font-size:var(--font-size-sm);padding:4px 8px">';
    [1,2,5,10,15,30].forEach(function(m) {
      html += '<option value="' + m + '"' + (settings.delayMinutes == m ? ' selected' : '') + '>' + m + ' min</option>';
    });
    html += '</select>';
    html += '<span style="font-size:12px;color:var(--muted)">efter produktvisning</span>';
    html += '</div>';

    // Recent log
    if (log.length > 0) {
      html += '<div style="font-size:var(--font-size-sm);font-weight:500;margin-bottom:var(--space-2)">Seneste beskeder</div>';
      log.forEach(function(l) {
        const time = new Date(l.timestamp).toLocaleString('da-DK', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
        html += '<div style="display:flex;align-items:center;gap:var(--space-2);padding:6px 0;border-bottom:1px solid var(--border);font-size:12px">';
        html += '<span style="color:var(--success)">✓</span>';
        html += '<span style="flex:1;color:var(--muted)">' + l.productName + ' → ' + l.userId + '</span>';
        html += '<span style="color:var(--muted)">' + time + '</span></div>';
      });
    }

    html += '</div>';
    return html;
  }

  // ============================================
  // 6. ENHANCED AGENT STATUS (Integration-dependent)
  // ============================================

  // Override updateWorkflowAgentUI to check integration status
  const originalUpdateUI = window.updateWorkflowAgentUI;
  
  window.updateWorkflowAgentUI = function(channel) {
    const status = window.workflowAgentStatus && window.workflowAgentStatus[channel];
    if (!status) return;

    const isConnected = SocialIntegration.isConnected(channel);
    const prefix = channel;

    // Status dot and text on workflow pages
    const statusDot = document.getElementById(prefix + '-agent-status-dot');
    const statusText = document.getElementById(prefix + '-agent-status-text');
    const toggleBtn = document.getElementById(prefix + '-toggle-btn');

    if (statusDot && statusText) {
      if (!isConnected) {
        // NOT connected - show inactive with link to Værktøjer
        statusDot.style.background = '#f59e0b';
        statusText.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:#f59e0b;display:inline-block"></span> Inaktiv — <a href="javascript:void(0)" onclick="showPage(\'vaerktoejer\');switchVaerktoejTab(\'agenter\')" style="color:#f59e0b;text-decoration:underline;font-size:12px">Forbind på Værktøjer</a>';
        if (toggleBtn) {
          toggleBtn.textContent = 'Forbind konto først';
          toggleBtn.classList.remove('btn-primary');
          toggleBtn.classList.add('btn-secondary');
          toggleBtn.disabled = true;
        }
      } else if (status.active) {
        statusDot.style.background = 'var(--success)';
        statusText.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:var(--success);display:inline-block"></span> Aktiv';
        if (toggleBtn) {
          toggleBtn.textContent = 'Deaktiver Agent';
          toggleBtn.classList.remove('btn-primary');
          toggleBtn.classList.add('btn-secondary');
          toggleBtn.disabled = false;
        }
      } else {
        statusDot.style.background = 'var(--muted)';
        statusText.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:var(--muted);display:inline-block"></span> Inaktiv';
        if (toggleBtn) {
          toggleBtn.textContent = 'Aktiver Agent';
          toggleBtn.classList.remove('btn-secondary');
          toggleBtn.classList.add('btn-primary');
          toggleBtn.disabled = false;
        }
      }
    }

    // Also update the Værktøjer agent cards
    updateVaerktoejAgentCard(channel, isConnected, status.active);

    // Integration status on workflow pages
    const integrationEl = document.getElementById(prefix + '-integration-status');
    if (integrationEl) {
      if (isConnected) {
        integrationEl.innerHTML = '<div style="width:8px;height:8px;border-radius:50%;background:var(--success)"></div><span style="color:var(--success)">Forbundet</span>';
      } else {
        integrationEl.innerHTML = '<div style="width:8px;height:8px;border-radius:50%;background:var(--muted)"></div><span style="color:var(--muted)">Ikke forbundet</span>';
      }
    }

    // Payment status
    const paymentEl = document.getElementById(prefix + '-payment-status');
    if (paymentEl) {
      if (status.paymentsConfigured) {
        paymentEl.innerHTML = '<div style="width:8px;height:8px;border-radius:50%;background:var(--success)"></div><span style="color:var(--success)">Konfigureret</span>';
      } else {
        paymentEl.innerHTML = '<div style="width:8px;height:8px;border-radius:50%;background:var(--muted)"></div><span style="color:var(--muted)">Ikke konfigureret</span>';
      }
    }

    // Render workflow + push sections on workflow pages
    renderWorkflowAndPushSections(channel);
  };

  function updateVaerktoejAgentCard(channel, isConnected, isActive) {
    // Find the agent card on Værktøjer page by looking at the onclick handler
    var cards = document.querySelectorAll('[onclick*="openAgentConfigPanel(\'' + channel + '\')"]');
    cards.forEach(function(card) {
      var statusSpan = card.querySelector('div[style*="border-top"] > span:first-child');
      if (statusSpan) {
        var dot = statusSpan.querySelector('span');
        if (!isConnected) {
          if (dot) dot.style.background = '#f59e0b';
          statusSpan.style.color = '#f59e0b';
          statusSpan.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:#f59e0b;display:inline-block"></span>Ej forbundet';
        } else if (isActive) {
          var color = channel === 'instagram' ? '#ec4899' : '#3b82f6';
          if (dot) dot.style.background = color;
          statusSpan.style.color = color;
          statusSpan.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:' + color + ';display:inline-block"></span>Aktiv';
        } else {
          if (dot) dot.style.background = 'var(--muted)';
          statusSpan.style.color = 'var(--muted)';
          statusSpan.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:var(--muted);display:inline-block"></span>Inaktiv';
        }
      }
    });
  }

  // Inject workflow + push sections into workflow pages
  function renderWorkflowAndPushSections(channel) {
    var containerId = channel + '-workflow-extras';
    var container = document.getElementById(containerId);
    if (!container) {
      // Try to insert after the API Integration section on workflow pages
      var page = document.getElementById('page-' + channel + '-workflow');
      if (!page) return;
      var actionBtns = page.querySelector('div[style*="display:flex"][style*="flex-wrap:wrap"]');
      if (!actionBtns) return;
      container = document.createElement('div');
      container.id = containerId;
      actionBtns.parentNode.insertBefore(container, actionBtns);
    }

    if (!SocialIntegration.isConnected(channel)) {
      container.innerHTML = '<div style="background:rgba(245,158,11,0.05);border:1px solid rgba(245,158,11,0.2);border-radius:var(--radius-md);padding:var(--space-5);margin-bottom:var(--space-5);text-align:center">' +
        '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" style="margin-bottom:var(--space-3)"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' +
        '<h4 style="font-weight:var(--font-weight-semibold);margin-bottom:var(--space-2)">Konto ikke forbundet</h4>' +
        '<p style="color:var(--muted);font-size:var(--font-size-sm);margin-bottom:var(--space-3)">Forbind din ' + (channel === 'instagram' ? 'Instagram Business' : 'Facebook Page') + ' konto for at aktivere workflows og push-beskeder</p>' +
        '<button class="btn btn-primary" onclick="showPage(\'vaerktoejer\');setTimeout(function(){openAgentConfigPanel(\'' + channel + '\')},300)" style="font-size:var(--font-size-sm)">Gå til Værktøjer → Forbind</button>' +
        '</div>';
      return;
    }

    container.innerHTML = renderWorkflowSection(channel) + renderPushMessageSection(channel);
  }

  // ============================================
  // 7. PUBLIC API
  // ============================================

  window.SocialIntegration = {
    // Core
    isConnected: SocialIntegration.isConnected.bind(SocialIntegration),
    connect: SocialIntegration.connect.bind(SocialIntegration),
    disconnect: SocialIntegration.disconnect.bind(SocialIntegration),

    // Product tracking
    logProductView: ProductTracker.logView.bind(ProductTracker),
    getPushStats: ProductTracker.getStats.bind(ProductTracker),
    togglePushMessages: function(enabled) {
      var s = ProductTracker.getSettings();
      s.enabled = enabled;
      ProductTracker.saveSettings(s);
      SocialIntegration.refreshAllUI();
    },
    setPushDelay: function(minutes) {
      var s = ProductTracker.getSettings();
      s.delayMinutes = parseInt(minutes);
      ProductTracker.saveSettings(s);
    },

    // Workflows
    getWorkflows: WorkflowEngine.getWorkflows.bind(WorkflowEngine),
    processMessage: WorkflowEngine.processMessage.bind(WorkflowEngine),
    toggleWorkflow: function(id) {
      WorkflowEngine.toggleWorkflow(id);
      SocialIntegration.refreshAllUI();
    },
    getWorkflowStats: WorkflowEngine.getStats.bind(WorkflowEngine),

    // Add workflow modal
    showAddWorkflowModal: function(platform) {
      var name = prompt('Workflow navn:');
      if (!name) return;
      var triggerWords = prompt('Trigger ord (komma-separeret):');
      if (!triggerWords) return;
      var replyMsg = prompt('Auto-svar besked:');
      if (!replyMsg) return;

      WorkflowEngine.addWorkflow({
        name: name,
        platform: platform === 'instagram' || platform === 'facebook' ? platform : 'both',
        enabled: true,
        trigger: {
          type: 'message_received',
          conditions: [{ field: 'text', operator: 'contains_any', values: triggerWords.split(',').map(s => s.trim()) }]
        },
        actions: [{ type: 'reply', message: replyMsg }]
      });
      SocialIntegration.refreshAllUI();
      if (typeof toast === 'function') toast('Workflow oprettet!', 'success');
    },

    editWorkflow: function(id) {
      var wfs = WorkflowEngine.getWorkflows();
      var wf = wfs.find(w => w.id === id);
      if (!wf) return;

      var name = prompt('Workflow navn:', wf.name);
      if (name === null) return;
      var triggerWords = prompt('Trigger ord (komma-separeret):', wf.trigger.conditions[0].values.join(', '));
      if (triggerWords === null) return;
      var replyAction = wf.actions.find(a => a.type === 'reply');
      var replyMsg = prompt('Auto-svar besked:', replyAction ? replyAction.message : '');
      if (replyMsg === null) return;

      WorkflowEngine.updateWorkflow(id, {
        name: name,
        trigger: { type: 'message_received', conditions: [{ field: 'text', operator: 'contains_any', values: triggerWords.split(',').map(s => s.trim()) }] },
        actions: [{ type: 'reply', message: replyMsg }]
      });
      SocialIntegration.refreshAllUI();
      if (typeof toast === 'function') toast('Workflow opdateret!', 'success');
    },

    refreshAllUI: SocialIntegration.refreshAllUI.bind(SocialIntegration)
  };

  // Init on page load
  document.addEventListener('DOMContentLoaded', function() {
    // Ensure status is loaded
    ['instagram', 'facebook'].forEach(function(ch) {
      if (typeof loadWorkflowAgentPage === 'function') {
        // Will be called by page navigation
      }
    });
  });

})();
