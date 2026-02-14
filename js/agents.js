// FLOW Agents Module — Instagram, Facebook, SMS workflows, OrderingAgent

async function loadWorkflowAgentPage(channel) {
  const prefix = channel; // 'instagram' or 'facebook'

  // Set version from OrderingAgent if available
  if (typeof OrderingAgent !== 'undefined') {
    const versionEl = document.getElementById(`${prefix}-agent-version`);
    const buildEl = document.getElementById(`${prefix}-agent-build`);
    if (versionEl) versionEl.textContent = `v${OrderingAgent.version || '1.0.0'}`;
    if (buildEl) buildEl.textContent = OrderingAgent.buildDate || '2026-02-05';
  }

  // Load status from localStorage for demo
  const storedStatus = JSON.parse(localStorage.getItem(`orderflow_${channel}_agent_status`) || 'null');
  if (storedStatus) {
    workflowAgentStatus[channel] = storedStatus;
  }

  // Update UI with current status
  updateWorkflowAgentUI(channel);

  // Load ML statistics from Supabase
  await loadWorkflowMLStats(channel);
}

// Update workflow agent UI
function updateWorkflowAgentUI(channel) {
  const status = workflowAgentStatus[channel];
  const prefix = channel;

  // Status dot and text
  const statusDot = document.getElementById(`${prefix}-agent-status-dot`);
  const statusText = document.getElementById(`${prefix}-agent-status-text`);
  const toggleBtn = document.getElementById(`${prefix}-toggle-btn`);

  if (statusDot && statusText) {
    if (status.active) {
      statusDot.style.background = 'var(--success)';
      statusText.textContent = 'Aktiv';
      if (toggleBtn) {
        toggleBtn.textContent = 'Deaktiver Agent';
        toggleBtn.classList.remove('btn-primary');
        toggleBtn.classList.add('btn-secondary');
      }
    } else {
      statusDot.style.background = 'var(--muted)';
      statusText.textContent = 'Inaktiv';
      if (toggleBtn) {
        toggleBtn.textContent = 'Aktiver Agent';
        toggleBtn.classList.remove('btn-secondary');
        toggleBtn.classList.add('btn-primary');
      }
    }
  }

  // Integration status
  const integrationEl = document.getElementById(`${prefix}-integration-status`);
  if (integrationEl) {
    if (status.connected) {
      integrationEl.innerHTML = `
        <div style="width:8px;height:8px;border-radius:50%;background:var(--success)"></div>
        <span style="color:var(--success)">Forbundet</span>
      `;
    } else {
      integrationEl.innerHTML = `
        <div style="width:8px;height:8px;border-radius:50%;background:var(--muted)"></div>
        <span style="color:var(--muted)">Ikke forbundet</span>
      `;
    }
  }

  // Payment status
  const paymentEl = document.getElementById(`${prefix}-payment-status`);
  if (paymentEl) {
    if (status.paymentsConfigured) {
      paymentEl.innerHTML = `
        <div style="width:8px;height:8px;border-radius:50%;background:var(--success)"></div>
        <span style="color:var(--success)">Aktiv (Stripe)</span>
      `;
    } else {
      paymentEl.innerHTML = `
        <div style="width:8px;height:8px;border-radius:50%;background:var(--muted)"></div>
        <span style="color:var(--muted)">Ikke konfigureret</span>
      `;
    }
  }
}

// Load ML statistics for workflow
async function loadWorkflowMLStats(channel) {
  const prefix = channel;

  try {
    let stats = { conversations: 0, orders: 0, completionRate: 0, avgResponseTime: 0, lastTrained: null };

    // Try to load from Supabase
    if (typeof supabase !== 'undefined' && supabase && typeof OrderingAgent !== 'undefined') {
      const insights = await OrderingAgent.getMLInsights(getCurrentRestaurantId());
      if (insights) {
        stats = {
          conversations: insights.totalConversations || 0,
          orders: Math.round((insights.totalConversations || 0) * (insights.completionRate || 0)),
          completionRate: Math.round((insights.completionRate || 0) * 100),
          avgResponseTime: insights.avgResponseTime || 0,
          lastTrained: insights.lastTrained
        };
      }
    } else {
      // Demo data
      stats = {
        conversations: Math.floor(Math.random() * 500) + 100,
        orders: Math.floor(Math.random() * 200) + 50,
        completionRate: Math.floor(Math.random() * 30) + 60,
        avgResponseTime: (Math.random() * 3 + 1).toFixed(1),
        lastTrained: new Date().toISOString().split('T')[0]
      };
    }

    // Update UI
    const convEl = document.getElementById(`${prefix}-ml-conversations`);
    const ordersEl = document.getElementById(`${prefix}-ml-orders`);
    const rateEl = document.getElementById(`${prefix}-ml-rate`);
    const responseEl = document.getElementById(`${prefix}-ml-response`);
    const trainedEl = document.getElementById(`${prefix}-ml-trained`);

    if (convEl) convEl.textContent = stats.conversations.toLocaleString();
    if (ordersEl) ordersEl.textContent = stats.orders.toLocaleString();
    if (rateEl) rateEl.textContent = `${stats.completionRate}%`;
    if (responseEl) responseEl.textContent = `${stats.avgResponseTime} sek`;
    if (trainedEl) trainedEl.textContent = stats.lastTrained || '-';

  } catch (err) {
    console.error('Error loading ML stats:', err);
  }
}

// Toggle Instagram agent
function toggleInstagramAgent() {
  workflowAgentStatus.instagram.active = !workflowAgentStatus.instagram.active;
  localStorage.setItem('orderflow_instagram_agent_status', JSON.stringify(workflowAgentStatus.instagram));
  updateWorkflowAgentUI('instagram');
  toast(workflowAgentStatus.instagram.active ? 'Instagram agent aktiveret' : 'Instagram agent deaktiveret', 'success');
}

// Toggle Facebook agent
function toggleFacebookAgent() {
  workflowAgentStatus.facebook.active = !workflowAgentStatus.facebook.active;
  localStorage.setItem('orderflow_facebook_agent_status', JSON.stringify(workflowAgentStatus.facebook));
  updateWorkflowAgentUI('facebook');
  toast(workflowAgentStatus.facebook.active ? 'Facebook agent aktiveret' : 'Facebook agent deaktiveret', 'success');
}

// showInstagramConfig + showFacebookConfig — see later definitions with openAgentConfigPanel

// Export workflow functions
window.loadWorkflowAgentPage = loadWorkflowAgentPage;
window.toggleInstagramAgent = toggleInstagramAgent;
window.toggleFacebookAgent = toggleFacebookAgent;
window.showInstagramConfig = showInstagramConfig;
window.showFacebookConfig = showFacebookConfig;

// =====================================================
// AI AGENTS MANAGEMENT (Legacy - keeping for reference)
// =====================================================

let aiAgents = [];
let currentAgentId = null;
let pendingDeleteAgentId = null;

// Load agents from Supabase
async function loadAiAgents() {
  const container = document.getElementById('agents-grid');
  const emptyEl = document.getElementById('agents-empty');

  if (container) {
    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted)">Indlæser agenter...</div>';
  }

  try {
    const userId = getCurrentUserId();

    if (typeof supabase !== 'undefined' && supabase) {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      aiAgents = data || [];
    } else {
      // Fallback to localStorage for demo
      aiAgents = JSON.parse(localStorage.getItem('orderflow_ai_agents') || '[]');
    }

    renderAgentsList();
    renderActiveAgentWorkflow();
  } catch (err) {
    console.error('Error loading AI agents:', err);
    toast('Kunne ikke indlæse agenter', 'error');
    if (container) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--danger)">Fejl ved indlæsning</div>';
    }
  }
}

// Render agents list
function renderAgentsList() {
  const container = document.getElementById('agents-grid');
  const emptyEl = document.getElementById('agents-empty');
  if (!container) return;

  const searchQuery = (document.getElementById('agent-search')?.value || '').toLowerCase();
  const channelFilter = document.getElementById('agent-filter-channel')?.value || '';

  let filteredAgents = aiAgents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery);
    const matchesChannel = !channelFilter || agent.channel === channelFilter;
    return matchesSearch && matchesChannel;
  });

  if (filteredAgents.length === 0) {
    container.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  const statusColors = {
    active: '#22c55e',
    inactive: 'var(--muted)',
    paused: '#f59e0b'
  };

  const statusLabels = {
    active: 'Aktiv',
    inactive: 'Inaktiv',
    paused: 'Pauseret'
  };

  const channelIcons = {
    instagram: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="18" cy="6" r="1.5" fill="currentColor"/></svg>',
    facebook: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>'
  };

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:var(--space-4)">
      ${filteredAgents.map(agent => `
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-4);cursor:pointer;transition:border-color 0.2s" onclick="editAgent('${agent.id}')" onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor='var(--border)'">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--space-3)">
            <div style="display:flex;align-items:center;gap:var(--space-2);color:var(--text2)">
              ${channelIcons[agent.channel] || ''}
              <span style="text-transform:capitalize;font-size:var(--font-size-sm)">${agent.channel}</span>
            </div>
            <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:12px;font-size:11px;background:${agent.status === 'active' ? 'rgba(34,197,94,0.1)' : 'var(--bg2)'};color:${statusColors[agent.status]}">
              <span style="width:6px;height:6px;border-radius:50%;background:${statusColors[agent.status]}"></span>
              ${statusLabels[agent.status]}
            </span>
          </div>
          <h3 style="font-weight:600;margin-bottom:var(--space-2);color:var(--text1)">${agent.name}</h3>
          <div style="display:flex;gap:var(--space-4);font-size:var(--font-size-sm);color:var(--muted);margin-bottom:var(--space-3)">
            <span>Samtaler: ${agent.conversations_count || 0}</span>
            <span>Ordrer: ${agent.orders_completed || 0}</span>
          </div>
          <div style="display:flex;gap:var(--space-2)">
            <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();editAgent('${agent.id}')">Rediger</button>
            <button class="btn btn-sm" style="background:var(--danger-dim);color:var(--danger)" onclick="event.stopPropagation();confirmDeleteAgent('${agent.id}', '${agent.name}')">Slet</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Show create agent modal
function showCreateAgentModal(prefillChannel) {
  currentAgentId = null;
  document.getElementById('agent-modal-title').textContent = 'Opret AI Agent';
  document.getElementById('agent-save-btn').textContent = 'Opret agent';
  document.getElementById('agent-edit-id').value = '';
  document.getElementById('agent-name').value = '';
  document.getElementById('agent-channel').value = prefillChannel || 'instagram';
  document.getElementById('agent-status').value = 'inactive';

  // Reset config to defaults
  document.getElementById('agent-config-language').value = 'da';
  document.getElementById('agent-config-retries').value = '1';
  document.getElementById('agent-config-escalation').value = '2';
  document.getElementById('agent-config-catering').value = '15';
  document.getElementById('agent-config-model').value = 'gpt-4o-mini';
  document.getElementById('agent-config-analytics').checked = true;
  document.getElementById('agent-config-payments').checked = false;
  document.getElementById('agent-config-ml').checked = true;

  populateRestaurantDropdownForAgents('agent-restaurant');
  document.getElementById('agent-modal').style.display = 'flex';
}

// Edit agent
function editAgent(agentId) {
  const agent = aiAgents.find(a => a.id === agentId);
  if (!agent) return;

  currentAgentId = agentId;
  document.getElementById('agent-modal-title').textContent = 'Rediger AI Agent';
  document.getElementById('agent-save-btn').textContent = 'Gem ændringer';
  document.getElementById('agent-edit-id').value = agentId;
  document.getElementById('agent-name').value = agent.name;
  document.getElementById('agent-channel').value = agent.channel;
  document.getElementById('agent-status').value = agent.status;

  // Load config
  const config = agent.config || {};
  document.getElementById('agent-config-language').value = config.defaultLanguage || 'da';
  document.getElementById('agent-config-retries').value = config.maxRetries || 1;
  document.getElementById('agent-config-escalation').value = config.escalationThreshold || 2;
  document.getElementById('agent-config-catering').value = config.cateringThreshold || 15;
  document.getElementById('agent-config-model').value = config.modelVersion || config.model || 'gpt-4o-mini';
  document.getElementById('agent-config-analytics').checked = config.enableAnalytics !== false;
  document.getElementById('agent-config-payments').checked = config.enablePayments === true;
  document.getElementById('agent-config-ml').checked = config.enableMLStorage !== false;

  populateRestaurantDropdownForAgents('agent-restaurant', agent.restaurant_id);
  document.getElementById('agent-modal').style.display = 'flex';
}

// Close agent modal
function closeAgentModal() {
  document.getElementById('agent-modal').style.display = 'none';
  currentAgentId = null;
}

// Save agent (create or update)
async function saveAgent() {
  const name = document.getElementById('agent-name').value.trim();
  if (!name) {
    toast('Indtast et agent navn', 'error');
    return;
  }

  const agentData = {
    name,
    channel: document.getElementById('agent-channel').value,
    status: document.getElementById('agent-status').value,
    restaurant_id: document.getElementById('agent-restaurant').value || null,
    config: {
      defaultLanguage: document.getElementById('agent-config-language').value,
      maxRetries: parseInt(document.getElementById('agent-config-retries').value),
      escalationThreshold: parseInt(document.getElementById('agent-config-escalation').value),
      cateringThreshold: parseInt(document.getElementById('agent-config-catering').value),
      modelVersion: document.getElementById('agent-config-model')?.value.trim() || 'gpt-4o-mini',
      enableAnalytics: document.getElementById('agent-config-analytics').checked,
      enablePayments: document.getElementById('agent-config-payments').checked,
      enableMLStorage: document.getElementById('agent-config-ml').checked,
      paymentTimeout: 900000
    }
  };

  try {
    if (typeof supabase !== 'undefined' && supabase) {
      if (currentAgentId) {
        const { error } = await supabase
          .from('ai_agents')
          .update(agentData)
          .eq('id', currentAgentId);
        if (error) throw error;
        toast('Agent opdateret', 'success');
      } else {
        agentData.user_id = getCurrentUserId();
        const { error } = await supabase
          .from('ai_agents')
          .insert([agentData]);
        if (error) throw error;
        toast('Agent oprettet', 'success');
      }
    } else {
      // Fallback to localStorage
      if (currentAgentId) {
        const idx = aiAgents.findIndex(a => a.id === currentAgentId);
        if (idx > -1) {
          aiAgents[idx] = { ...aiAgents[idx], ...agentData };
        }
      } else {
        agentData.id = 'agent_' + Date.now();
        agentData.user_id = getCurrentUserId();
        agentData.created_at = new Date().toISOString();
        agentData.conversations_count = 0;
        agentData.orders_completed = 0;
        aiAgents.push(agentData);
      }
      localStorage.setItem('orderflow_ai_agents', JSON.stringify(aiAgents));
      toast(currentAgentId ? 'Agent opdateret' : 'Agent oprettet', 'success');
    }

    closeAgentModal();
    loadAiAgents();
  } catch (err) {
    console.error('Error saving agent:', err);
    toast('Kunne ikke gemme agent', 'error');
  }
}

// Confirm delete agent
function confirmDeleteAgent(agentId, agentName) {
  pendingDeleteAgentId = agentId;
  document.getElementById('delete-confirm-message').textContent =
    'Er du sikker på at du vil slette agenten "' + agentName + '"?';
  document.getElementById('delete-confirm-btn').onclick = deleteAgent;
  document.getElementById('delete-confirm-modal').style.display = 'flex';
}

// Delete agent
async function deleteAgent() {
  if (!pendingDeleteAgentId) return;

  try {
    if (typeof supabase !== 'undefined' && supabase) {
      const { error } = await supabase
        .from('ai_agents')
        .delete()
        .eq('id', pendingDeleteAgentId);

      if (error) throw error;
    } else {
      aiAgents = aiAgents.filter(a => a.id !== pendingDeleteAgentId);
      localStorage.setItem('orderflow_ai_agents', JSON.stringify(aiAgents));
    }

    toast('Agent slettet', 'success');
    closeDeleteConfirmModal();
    loadAiAgents();
  } catch (err) {
    console.error('Error deleting agent:', err);
    toast('Kunne ikke slette agent', 'error');
  }

  pendingDeleteAgentId = null;
}

// Filter agents
function filterAgents() {
  renderAgentsList();
}

function openAgentWorkflow(channel) {
  if (!channel) return;
  showPage(`${channel}-workflow`);
}

async function loadAgentWorkflowPage(channel) {
  if (!channel) return;
  if (!aiAgents || aiAgents.length === 0) {
    await loadAiAgents();
    return;
  }
  renderAgentWorkflow(channel);
}

function renderActiveAgentWorkflow() {
  const igPage = document.getElementById('page-instagram-workflow');
  if (igPage?.classList.contains('active')) {
    renderAgentWorkflow('instagram');
  }
  const fbPage = document.getElementById('page-facebook-workflow');
  if (fbPage?.classList.contains('active')) {
    renderAgentWorkflow('facebook');
  }
}

function renderAgentWorkflow(channel) {
  const container = document.getElementById(`workflow-${channel}-content`);
  if (!container) return;

  const channelLabel = channel === 'instagram' ? 'Instagram' : 'Facebook';
  const channelAgents = aiAgents.filter(agent => (agent.channel || '').toLowerCase() === channel);

  if (channelAgents.length === 0) {
    container.innerHTML = `
      <div style="padding:60px 20px;text-align:center;background:var(--card);border-radius:var(--radius-md);border:1px solid var(--border)">
        <h3 style="color:var(--text1);margin-bottom:8px">Ingen ${channelLabel} agent endnu</h3>
        <p style="color:var(--muted);margin-bottom:20px">Opret din første ${channelLabel.toLowerCase()} agent for dette workflow</p>
        <button class="btn btn-primary" onclick="showCreateAgentModal('${channel}')">Opret ${channelLabel} agent</button>
      </div>
    `;
    return;
  }

  const agent = channelAgents.find(a => a.status === 'active') || channelAgents[0];
  const statusLabels = { active: 'Aktiv', inactive: 'Inaktiv', paused: 'Pauseret' };
  const statusColors = { active: '#22c55e', inactive: 'var(--muted)', paused: '#f59e0b' };
  const modelVersion = agent.config?.modelVersion || agent.config?.model || agent.model_version || agent.model || 'gpt-4o-mini';
  const updatedAt = agent.updated_at || agent.created_at;
  const updatedDisplay = updatedAt ? new Date(updatedAt).toLocaleString('da-DK') : '—';

  container.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:var(--space-3);margin-bottom:var(--space-5)">
      <button class="btn btn-secondary" onclick="loadAgentWorkflowPage('${channel}')">Opdater data</button>
      <button class="btn btn-secondary" onclick="showPage('ai-agents')">Se alle agenter</button>
      <button class="btn btn-primary" onclick="editAgent('${agent.id}')">Rediger agent</button>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:var(--space-4)">
      <div class="card">
        <div style="color:var(--muted);font-size:12px;letter-spacing:0.08em;text-transform:uppercase">Agent</div>
        <div style="font-size:18px;font-weight:600;margin-top:6px">${agent.name}</div>
      </div>
      <div class="card">
        <div style="color:var(--muted);font-size:12px;letter-spacing:0.08em;text-transform:uppercase">Workflow</div>
        <div style="font-size:18px;font-weight:600;margin-top:6px">${channelLabel} Workflow</div>
      </div>
      <div class="card">
        <div style="color:var(--muted);font-size:12px;letter-spacing:0.08em;text-transform:uppercase">Modelversion</div>
        <div style="font-size:18px;font-weight:600;margin-top:6px">${modelVersion}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:var(--space-4);margin-top:var(--space-4)">
      <div class="card">
        <div style="color:var(--muted);font-size:12px;letter-spacing:0.08em;text-transform:uppercase">Samtaler</div>
        <div style="font-size:20px;font-weight:600;margin-top:6px">${agent.conversations_count || 0}</div>
      </div>
      <div class="card">
        <div style="color:var(--muted);font-size:12px;letter-spacing:0.08em;text-transform:uppercase">Ordrer</div>
        <div style="font-size:20px;font-weight:600;margin-top:6px">${agent.orders_completed || 0}</div>
      </div>
      <div class="card">
        <div style="color:var(--muted);font-size:12px;letter-spacing:0.08em;text-transform:uppercase">Status</div>
        <div style="font-size:16px;font-weight:600;margin-top:8px;display:inline-flex;align-items:center;gap:8px;color:${statusColors[agent.status] || 'var(--muted)'}">
          <span style="width:8px;height:8px;border-radius:50%;background:${statusColors[agent.status] || 'var(--muted)'}"></span>
          ${statusLabels[agent.status] || agent.status || 'Ukendt'}
        </div>
      </div>
      <div class="card">
        <div style="color:var(--muted);font-size:12px;letter-spacing:0.08em;text-transform:uppercase">Sidst opdateret</div>
        <div style="font-size:16px;font-weight:600;margin-top:6px">${updatedDisplay}</div>
      </div>
    </div>
  `;
}

// =====================================================
// SMS WORKFLOWS MANAGEMENT
// =====================================================

let smsWorkflows = [];
let currentSmsWorkflowId = null;
let pendingDeleteWorkflowId = null;

// Load workflows from Supabase
async function loadSmsWorkflows() {
  const container = document.getElementById('workflows-list');
  const emptyEl = document.getElementById('workflows-empty');

  if (container) {
    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted)">Indlæser workflows...</div>';
  }

  try {
    const userId = getCurrentUserId();

    if (typeof supabase !== 'undefined' && supabase) {
      const { data, error } = await supabase
        .from('sms_workflows')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      smsWorkflows = data || [];
    } else {
      smsWorkflows = JSON.parse(localStorage.getItem('orderflow_sms_workflows') || '[]');
    }

    renderWorkflowsList();
  } catch (err) {
    console.error('Error loading SMS workflows:', err);
    toast('Kunne ikke indlæse workflows', 'error');
    if (container) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--danger)">Fejl ved indlæsning</div>';
    }
  }
}

// Render workflows list
function renderWorkflowsList() {
  const container = document.getElementById('workflows-list');
  const emptyEl = document.getElementById('workflows-empty');
  if (!container) return;

  const searchQuery = (document.getElementById('workflow-search')?.value || '').toLowerCase();
  const variantFilter = document.getElementById('workflow-filter-variant')?.value || '';

  let filteredWorkflows = smsWorkflows.filter(wf => {
    const matchesSearch = wf.name.toLowerCase().includes(searchQuery);
    const matchesVariant = !variantFilter || wf.variant === variantFilter;
    return matchesSearch && matchesVariant;
  });

  if (filteredWorkflows.length === 0) {
    container.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  const statusColors = {
    active: '#22c55e',
    inactive: 'var(--muted)',
    draft: '#f59e0b'
  };

  const statusLabels = {
    active: 'Aktiv',
    inactive: 'Inaktiv',
    draft: 'Kladde'
  };

  const variantLabels = {
    restaurant: 'Restaurant',
    haandvaerker: 'Håndværker',
    custom: 'Brugerdefineret'
  };

  container.innerHTML = '<table style="width:100%;border-collapse:collapse">' +
    '<thead><tr style="border-bottom:1px solid var(--border);background:var(--bg2)">' +
    '<th style="padding:12px 16px;text-align:left;font-weight:500;font-size:var(--font-size-sm)">Navn</th>' +
    '<th style="padding:12px 16px;text-align:left;font-weight:500;font-size:var(--font-size-sm)">Variant</th>' +
    '<th style="padding:12px 16px;text-align:left;font-weight:500;font-size:var(--font-size-sm)">Status</th>' +
    '<th style="padding:12px 16px;text-align:left;font-weight:500;font-size:var(--font-size-sm)">Kørsler</th>' +
    '<th style="padding:12px 16px;text-align:left;font-weight:500;font-size:var(--font-size-sm)">SMS Sendt</th>' +
    '<th style="padding:12px 16px;text-align:right;font-weight:500;font-size:var(--font-size-sm)">Handlinger</th>' +
    '</tr></thead><tbody>' +
    filteredWorkflows.map(function(wf, idx) {
      return '<tr style="border-bottom:1px solid var(--border);background:' + (idx % 2 === 0 ? 'transparent' : 'var(--bg2)') + '">' +
        '<td style="padding:12px 16px;font-weight:500">' + wf.name + '</td>' +
        '<td style="padding:12px 16px">' + (variantLabels[wf.variant] || wf.variant) + '</td>' +
        '<td style="padding:12px 16px">' +
        '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:12px;font-size:11px;background:' + (wf.status === 'active' ? 'rgba(34,197,94,0.1)' : 'var(--bg2)') + ';color:' + statusColors[wf.status] + '">' +
        '<span style="width:6px;height:6px;border-radius:50%;background:' + statusColors[wf.status] + '"></span>' +
        statusLabels[wf.status] + '</span></td>' +
        '<td style="padding:12px 16px">' + (wf.executions_count || 0) + '</td>' +
        '<td style="padding:12px 16px">' + (wf.sms_sent_count || 0) + '</td>' +
        '<td style="padding:12px 16px;text-align:right">' +
        '<div style="display:flex;gap:var(--space-2);justify-content:flex-end">' +
        '<button class="btn btn-sm btn-secondary" onclick="openWorkflowInBuilder(\'' + wf.id + '\')">Builder</button>' +
        '<button class="btn btn-sm btn-secondary" onclick="editSmsWorkflow(\'' + wf.id + '\')">Rediger</button>' +
        '<button class="btn btn-sm" style="background:var(--danger-dim);color:var(--danger)" onclick="confirmDeleteWorkflow(\'' + wf.id + '\', \'' + wf.name + '\')">Slet</button>' +
        '</div></td></tr>';
    }).join('') +
    '</tbody></table>';
}

// Show create workflow modal
function showCreateWorkflowModal() {
  currentSmsWorkflowId = null;
  document.getElementById('sms-workflow-modal-title').textContent = 'Opret SMS Workflow';
  document.getElementById('sms-workflow-save-btn').textContent = 'Opret workflow';
  document.getElementById('sms-workflow-edit-id').value = '';
  document.getElementById('sms-workflow-name').value = '';
  document.getElementById('sms-workflow-variant').value = 'restaurant';
  document.getElementById('sms-workflow-status').value = 'draft';

  document.getElementById('sms-trigger-order-placed').checked = false;
  document.getElementById('sms-trigger-delivered').checked = false;
  document.getElementById('sms-trigger-signup').checked = false;
  document.getElementById('sms-trigger-missed-call').checked = false;

  populateRestaurantDropdownForAgents('sms-workflow-restaurant');
  document.getElementById('sms-workflow-modal').style.display = 'flex';
}

// Edit workflow
function editSmsWorkflow(workflowId) {
  const workflow = smsWorkflows.find(function(w) { return w.id === workflowId; });
  if (!workflow) return;

  currentSmsWorkflowId = workflowId;
  document.getElementById('sms-workflow-modal-title').textContent = 'Rediger SMS Workflow';
  document.getElementById('sms-workflow-save-btn').textContent = 'Gem ændringer';
  document.getElementById('sms-workflow-edit-id').value = workflowId;
  document.getElementById('sms-workflow-name').value = workflow.name;
  document.getElementById('sms-workflow-variant').value = workflow.variant;
  document.getElementById('sms-workflow-status').value = workflow.status;

  var triggers = workflow.triggers || {};
  document.getElementById('sms-trigger-order-placed').checked = triggers.on_order_placed || false;
  document.getElementById('sms-trigger-delivered').checked = triggers.on_order_delivered || false;
  document.getElementById('sms-trigger-signup').checked = triggers.on_customer_signup || false;
  document.getElementById('sms-trigger-missed-call').checked = triggers.on_missed_call || false;

  populateRestaurantDropdownForAgents('sms-workflow-restaurant', workflow.restaurant_id);
  document.getElementById('sms-workflow-modal').style.display = 'flex';
}

// Close workflow modal
function closeSmsWorkflowModal() {
  document.getElementById('sms-workflow-modal').style.display = 'none';
  currentSmsWorkflowId = null;
}

// Save workflow
async function saveSmsWorkflow() {
  var name = document.getElementById('sms-workflow-name').value.trim();
  if (!name) {
    toast('Indtast et workflow navn', 'error');
    return;
  }

  var workflowData = {
    name: name,
    variant: document.getElementById('sms-workflow-variant').value,
    status: document.getElementById('sms-workflow-status').value,
    restaurant_id: document.getElementById('sms-workflow-restaurant').value || null,
    triggers: {
      on_order_placed: document.getElementById('sms-trigger-order-placed').checked,
      on_order_delivered: document.getElementById('sms-trigger-delivered').checked,
      on_customer_signup: document.getElementById('sms-trigger-signup').checked,
      on_missed_call: document.getElementById('sms-trigger-missed-call').checked,
      scheduled: null
    }
  };

  try {
    if (typeof supabase !== 'undefined' && supabase) {
      if (currentSmsWorkflowId) {
        var result = await supabase.from('sms_workflows').update(workflowData).eq('id', currentSmsWorkflowId);
        if (result.error) throw result.error;
        toast('Workflow opdateret', 'success');
      } else {
        workflowData.user_id = getCurrentUserId();
        workflowData.workflow_nodes = [];
        workflowData.workflow_connections = [];
        var result = await supabase.from('sms_workflows').insert([workflowData]);
        if (result.error) throw result.error;
        toast('Workflow oprettet', 'success');
      }
    } else {
      if (currentSmsWorkflowId) {
        var idx = smsWorkflows.findIndex(function(w) { return w.id === currentSmsWorkflowId; });
        if (idx > -1) {
          smsWorkflows[idx] = Object.assign({}, smsWorkflows[idx], workflowData);
        }
      } else {
        workflowData.id = 'workflow_' + Date.now();
        workflowData.user_id = getCurrentUserId();
        workflowData.created_at = new Date().toISOString();
        workflowData.workflow_nodes = [];
        workflowData.workflow_connections = [];
        workflowData.executions_count = 0;
        workflowData.sms_sent_count = 0;
        smsWorkflows.push(workflowData);
      }
      localStorage.setItem('orderflow_sms_workflows', JSON.stringify(smsWorkflows));
      toast(currentSmsWorkflowId ? 'Workflow opdateret' : 'Workflow oprettet', 'success');
    }

    closeSmsWorkflowModal();
    loadSmsWorkflows();
  } catch (err) {
    console.error('Error saving workflow:', err);
    toast('Kunne ikke gemme workflow', 'error');
  }
}

// Open workflow in builder
function openWorkflowInBuilder(workflowId) {
  var workflow = smsWorkflows.find(function(w) { return w.id === workflowId; });
  if (!workflow) return;

  var moduleMap = {
    restaurant: 'restaurant',
    haandvaerker: 'haandvaerker',
    custom: 'restaurant'
  };

  localStorage.setItem('current_workflow_id', workflowId);
  showPage('workflow');

  setTimeout(function() {
    var moduleToSelect = moduleMap[workflow.variant] || 'restaurant';
    if (typeof selectWorkflowModule === 'function') {
      selectWorkflowModule(moduleToSelect);
    }

    if (workflow.workflow_nodes && workflow.workflow_nodes.length > 0) {
      workflowNodes = workflow.workflow_nodes;
      workflowConnections = workflow.workflow_connections || [];
      renderWorkflowNodes();
      if (typeof renderConnections === 'function') {
        renderConnections();
      }
      setTimeout(function() {
        if (typeof fitWorkflowToView === 'function') {
          fitWorkflowToView();
        }
      }, 200);
    }
  }, 100);
}

// Handle workflow variant change
function onWorkflowVariantChange() {
  // Could be used to update UI based on variant selection
}

// Confirm delete workflow
function confirmDeleteWorkflow(workflowId, workflowName) {
  pendingDeleteWorkflowId = workflowId;
  document.getElementById('delete-confirm-message').textContent =
    'Er du sikker på at du vil slette workflowet "' + workflowName + '"?';
  document.getElementById('delete-confirm-btn').onclick = deleteWorkflow;
  document.getElementById('delete-confirm-modal').style.display = 'flex';
}

// Delete workflow
async function deleteWorkflow() {
  if (!pendingDeleteWorkflowId) return;

  try {
    if (typeof supabase !== 'undefined' && supabase) {
      var result = await supabase.from('sms_workflows').delete().eq('id', pendingDeleteWorkflowId);
      if (result.error) throw result.error;
    } else {
      smsWorkflows = smsWorkflows.filter(function(w) { return w.id !== pendingDeleteWorkflowId; });
      localStorage.setItem('orderflow_sms_workflows', JSON.stringify(smsWorkflows));
    }

    toast('Workflow slettet', 'success');
    closeDeleteConfirmModal();
    loadSmsWorkflows();
  } catch (err) {
    console.error('Error deleting workflow:', err);
    toast('Kunne ikke slette workflow', 'error');
  }

  pendingDeleteWorkflowId = null;
}

// Filter workflows
function filterWorkflows() {
  renderWorkflowsList();
}

// =====================================================
// SHARED HELPERS FOR AGENT/WORKFLOW MANAGEMENT
// =====================================================

// Close delete confirm modal
function closeDeleteConfirmModal() {
  var modal = document.getElementById('delete-confirm-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
  }
  pendingDeleteAgentId = null;
  pendingDeleteWorkflowId = null;
}

// Populate restaurant dropdown for agents/workflows
function populateRestaurantDropdownForAgents(selectId, selectedValue) {
  var select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = '<option value="">Vælg restaurant...</option>';

  var restaurantList = window.restaurants || [];

  restaurantList.forEach(function(r) {
    var option = document.createElement('option');
    option.value = r.id;
    option.textContent = r.name || r.firmanavn || 'Unavngivet';
    if (selectedValue && r.id === selectedValue) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

// Get current user ID (helper)
function getCurrentUserId() {
  return (window.currentUser && window.currentUser.id) || localStorage.getItem('demo_user_id') || 'demo-user';
}

function openAgentPage(pageId) {
  if (typeof showPage === 'function') {
    showPage(pageId);
  }
}

function switchVaerktoejTab(tab) {
  var tabs = ['apikeys','agenter','enheder','agentstatus','statistik','qrkode'];
  tabs.forEach(function(t) {
    var content = document.getElementById('vaerktoejer-content-' + t);
    var tabBtn = document.getElementById('vaerktoejer-tab-' + t);
    if (content) content.style.display = (t === tab) ? '' : 'none';
    if (tabBtn) {
      tabBtn.style.color = (t === tab) ? 'var(--color-text)' : 'var(--muted)';
      tabBtn.style.borderBottomColor = (t === tab) ? 'var(--color-text)' : 'transparent';
      tabBtn.style.fontWeight = (t === tab) ? 'var(--font-weight-semibold)' : '500';
    }
  });
  if (tab === 'apikeys') renderCustomerIntegrations();
  if (tab === 'statistik') renderAgentStatistics();
  if (tab === 'agentstatus') renderAgentStatusDashboard();
  if (tab === 'qrkode') loadQRHistory();
  if (tab === 'enheder') initDevicesTab();
}

function checkAgentUpdate(agentName) {
  const btn = event.target;
  const origText = btn.textContent;
  btn.textContent = 'Søger...';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = 'Opdateret';
    btn.style.color = 'var(--success)';
    btn.style.borderColor = 'var(--success)';
    setTimeout(() => { btn.textContent = origText; btn.disabled = false; btn.style.color = ''; btn.style.borderColor = ''; }, 2000);
  }, 1500);
}


// ============================================
// AGENT CONFIGURATION PANEL
// ============================================

var agentConfigDefinitions = {
  instagram: {
    title: 'Agent Instagram', color: '#ec4899', workflowPage: 'instagram-workflow',
    sections: [
      { type: 'status', key: 'instagram' },
      { type: 'oauth', provider: 'instagram', label: 'Forbind Instagram Business' },
      { type: 'field', key: 'instagram_page_id', label: 'Page ID', readonly: true, placeholder: 'Udfyldes automatisk ved tilslutning' },
      { type: 'field', key: 'instagram_access_token', label: 'Access Token', sensitive: true, readonly: true, placeholder: 'Udfyldes ved tilslutning' },
      { type: 'webhook', label: 'Webhook URL', url: window.location.origin + '/api/webhooks/meta' },
      { type: 'toggle', key: 'instagram_auto_reply', label: 'Auto-reply DM', desc: 'Automatisk besvar DM-beskeder med AI' },
      { type: 'toggle', key: 'instagram_order_enabled', label: 'Ordremodtagelse via DM', desc: 'Modtag og behandl bestillinger fra Instagram' },
      { type: 'select', key: 'instagram_language', label: 'Svarsprog', options: ['Dansk','Engelsk'] },
      { type: 'payment', key: 'instagram' }
    ]
  },
  facebook: {
    title: 'Agent Facebook', color: '#3b82f6', workflowPage: 'facebook-workflow',
    sections: [
      { type: 'status', key: 'facebook' },
      { type: 'oauth', provider: 'facebook', label: 'Forbind Facebook Page' },
      { type: 'field', key: 'facebook_page_id', label: 'Page ID', readonly: true, placeholder: 'Udfyldes automatisk ved tilslutning' },
      { type: 'field', key: 'facebook_access_token', label: 'Access Token', sensitive: true, readonly: true, placeholder: 'Udfyldes ved tilslutning' },
      { type: 'webhook', label: 'Webhook URL', url: window.location.origin + '/api/webhooks/meta' },
      { type: 'toggle', key: 'facebook_auto_reply', label: 'Messenger Auto-reply', desc: 'Automatisk besvar Messenger-beskeder' },
      { type: 'toggle', key: 'facebook_order_enabled', label: 'Ordremodtagelse via Messenger', desc: 'Modtag bestillinger fra Facebook Messenger' },
      { type: 'toggle', key: 'facebook_page_posts', label: 'Automatiske Page Posts', desc: 'AI-genererede opslag på din Facebook Page' },
      { type: 'payment', key: 'facebook' }
    ]
  },
  restaurant: {
    title: 'Agent Restaurant', color: '#f97316', workflowPage: 'sms-workflows',
    sections: [
      { type: 'status', key: 'restaurant' },
      { type: 'field', key: 'restaurant_phone', label: 'Afsendernummer', placeholder: '+45...' },
      { type: 'toggle', key: 'sms_order_confirm', label: 'Ordrebekræftelse SMS', desc: 'Send automatisk SMS når ordre modtages' },
      { type: 'toggle', key: 'sms_delivery_update', label: 'Leveringsstatus SMS', desc: 'Opdater kunde om leveringsstatus' },
      { type: 'toggle', key: 'sms_feedback_request', label: 'Feedback-anmodning', desc: 'Anmod om feedback efter levering' },
      { type: 'sms_test' },
      { type: 'webhook', label: 'InMobile Webhook URL', url: (typeof CONFIG !== 'undefined' ? CONFIG.SUPABASE_URL : '') + '/functions/v1/receive-sms-inmobile' }
    ]
  },
  haandvaerker: {
    title: 'Agent Håndværker', color: '#14b8a6', workflowPage: 'sms-workflows',
    sections: [
      { type: 'status', key: 'haandvaerker' },
      { type: 'field', key: 'haandvaerker_phone', label: 'Afsendernummer', placeholder: '+45...' },
      { type: 'toggle', key: 'sms_booking_confirm', label: 'Booking-bekræftelse', desc: 'SMS ved ny booking' },
      { type: 'toggle', key: 'sms_reminder', label: 'Påmindelser', desc: 'Påmindelse før aftale' },
      { type: 'toggle', key: 'sms_followup', label: 'Opfølgning', desc: 'Opfølgning efter udført arbejde' },
      { type: 'sms_test' },
      { type: 'webhook', label: 'InMobile Webhook URL', url: (typeof CONFIG !== 'undefined' ? CONFIG.SUPABASE_URL : '') + '/functions/v1/receive-sms-inmobile' }
    ]
  },
  seo: {
    title: 'Agent SEO', color: '#7c3aed', workflowPage: 'search-engine',
    sections: [
      { type: 'status', key: 'seo' },
      { type: 'field', key: 'site_url', label: 'Hjemmeside URL', placeholder: 'https://din-restaurant.dk' },
      { type: 'toggle', key: 'seo_auto_scan', label: 'Automatisk scanning', desc: 'Kør SEO-analyse automatisk' }
    ]
  }
};

var currentConfigAgent = null;

function openAgentConfigPanel(agentId) {
  var config = agentConfigDefinitions[agentId];
  if (!config) return;
  currentConfigAgent = agentId;
  var panel = document.getElementById('agent-config-panel');
  var title = document.getElementById('agent-config-title');
  var body = document.getElementById('agent-config-body');
  var footer = document.getElementById('agent-config-footer');
  title.textContent = config.title + ' — Konfiguration';
  title.style.color = config.color;
  body.innerHTML = renderAgentConfigSections(agentId, config);
  footer.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center">' +
    '<button class="btn btn-secondary" onclick="showPage(\'' + config.workflowPage + '\');closeAgentConfigPanel()" style="font-size:var(--font-size-sm)">Gå til Workflow</button>' +
    '<button class="btn btn-primary" onclick="saveAgentConfig(\'' + agentId + '\')" style="font-size:var(--font-size-sm)">Gem ændringer</button>' +
    '</div>';
  panel.style.display = 'flex';
  requestAnimationFrame(function() {
    document.getElementById('agent-config-drawer').style.transform = 'translateX(0)';
  });
}

function closeAgentConfigPanel() {
  var drawer = document.getElementById('agent-config-drawer');
  var panel = document.getElementById('agent-config-panel');
  drawer.style.transform = 'translateX(100%)';
  setTimeout(function() { panel.style.display = 'none'; currentConfigAgent = null; }, 300);
}

function renderAgentConfigSections(agentId, config) {
  var html = '';
  config.sections.forEach(function(s) {
    html += '<div style="margin-bottom:var(--space-4)">';
    if (s.type === 'status') {
      var isActive = false;
      if (workflowAgentStatus[s.key]) isActive = workflowAgentStatus[s.key].active;
      else { var stored = localStorage.getItem('agent_' + s.key + '_active'); isActive = stored === 'true'; }
      var dotColor = isActive ? config.color : 'var(--muted)';
      var statusText = isActive ? 'Aktiv' : 'Inaktiv';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-3);background:var(--bg2);border-radius:var(--radius-sm)">' +
        '<div style="display:flex;align-items:center;gap:8px"><span style="width:8px;height:8px;border-radius:50%;background:' + dotColor + ';display:inline-block"></span><span style="font-weight:500">Forbindelsesstatus</span></div>' +
        '<span style="font-size:var(--font-size-sm);color:' + dotColor + ';font-weight:500">' + statusText + '</span></div>';
    } else if (s.type === 'oauth') {
      var connected = workflowAgentStatus[s.provider] && workflowAgentStatus[s.provider].connected;
      if (connected) {
        var pageName = localStorage.getItem(s.provider + '_page_name') || 'Forbundet';
        html += '<div style="padding:var(--space-3);background:rgba(' + hexToRgb(config.color) + ',0.05);border:1px solid ' + config.color + ';border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:space-between">' +
          '<div><span style="font-size:var(--font-size-sm);font-weight:500;color:' + config.color + '">' + pageName + '</span><br><span style="font-size:11px;color:var(--muted)">Forbundet</span></div>' +
          '<button class="btn btn-sm" style="font-size:11px;color:var(--danger)" onclick="disconnectAgent(\'' + s.provider + '\')">Afbryd</button></div>';
      } else {
        html += '<button class="btn" style="width:100%;background:' + config.color + ';color:white;border:none;padding:12px;border-radius:var(--radius-sm);font-weight:500;cursor:pointer" onclick="initMetaOAuth(\'' + s.provider + '\')">' + s.label + '</button>';
      }
    } else if (s.type === 'field') {
      var val = localStorage.getItem(s.key) || '';
      var displayVal = (s.sensitive && val) ? '••••••••' + val.slice(-4) : val;
      html += '<label style="display:block;font-size:var(--font-size-sm);font-weight:500;margin-bottom:4px">' + s.label + '</label>' +
        '<input class="input" id="config-' + s.key + '" type="' + (s.sensitive ? 'password' : 'text') + '" value="' + (s.sensitive ? '' : escapeHtml(val)) + '" placeholder="' + (s.placeholder || '') + '"' + (s.readonly ? ' readonly style="opacity:0.7;cursor:not-allowed"' : '') + ' style="width:100%;font-size:var(--font-size-sm)">';
    } else if (s.type === 'webhook') {
      html += '<label style="display:block;font-size:var(--font-size-sm);font-weight:500;margin-bottom:4px">' + s.label + '</label>' +
        '<div style="display:flex;gap:8px"><input class="input" type="text" value="' + s.url + '" readonly style="flex:1;font-size:12px;opacity:0.7;cursor:not-allowed;font-family:monospace">' +
        '<button class="btn btn-sm" onclick="navigator.clipboard.writeText(\'' + s.url + '\');toast(\'Webhook URL kopieret\',\'success\')" style="flex-shrink:0;font-size:11px">Kopier</button></div>';
    } else if (s.type === 'toggle') {
      var checked = localStorage.getItem(s.key) === 'true';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-3);background:var(--bg2);border-radius:var(--radius-sm)">' +
        '<div><span style="font-weight:500;font-size:var(--font-size-sm)">' + s.label + '</span>' + (s.desc ? '<br><span style="font-size:11px;color:var(--muted)">' + s.desc + '</span>' : '') + '</div>' +
        '<label style="position:relative;display:inline-block;width:40px;height:22px;cursor:pointer"><input type="checkbox" id="config-' + s.key + '"' + (checked ? ' checked' : '') + ' style="opacity:0;width:0;height:0" onchange="this.nextElementSibling.style.background=this.checked?\'' + config.color + '\':\'var(--muted)\';this.nextElementSibling.querySelector(\'span\').style.transform=this.checked?\'translateX(18px)\':\'translateX(0)\'">' +
        '<div style="position:absolute;inset:0;background:' + (checked ? config.color : 'var(--muted)') + ';border-radius:11px;transition:0.2s"><span style="position:absolute;left:2px;top:2px;width:18px;height:18px;background:white;border-radius:50%;transition:0.2s;transform:' + (checked ? 'translateX(18px)' : 'translateX(0)') + '"></span></div></label></div>';
    } else if (s.type === 'select') {
      var current = localStorage.getItem(s.key) || s.options[0];
      html += '<label style="display:block;font-size:var(--font-size-sm);font-weight:500;margin-bottom:4px">' + s.label + '</label>' +
        '<select class="input" id="config-' + s.key + '" style="width:100%;font-size:var(--font-size-sm)">';
      s.options.forEach(function(opt) { html += '<option value="' + opt + '"' + (opt === current ? ' selected' : '') + '>' + opt + '</option>'; });
      html += '</select>';
    } else if (s.type === 'sms_test') {
      html += '<div style="padding:var(--space-3);background:var(--bg2);border-radius:var(--radius-sm)">' +
        '<div style="font-weight:500;font-size:var(--font-size-sm);margin-bottom:8px">Test SMS</div>' +
        '<div style="display:flex;flex-direction:column;gap:8px">' +
        '<input class="input" id="sms-test-phone" type="tel" placeholder="+45 12345678" style="font-size:var(--font-size-sm)">' +
        '<input class="input" id="sms-test-message" type="text" value="Test fra FLOW 🚀" placeholder="Besked..." style="font-size:var(--font-size-sm)">' +
        '<div style="display:flex;gap:8px;align-items:center">' +
        '<button class="btn btn-primary btn-sm" onclick="sendTestSms()" style="font-size:var(--font-size-sm)">Send test SMS</button>' +
        '<span id="sms-test-status" style="font-size:12px;display:none"></span>' +
        '</div></div></div>';
    } else if (s.type === 'payment') {
      var payConfigured = workflowAgentStatus[s.key] && workflowAgentStatus[s.key].paymentsConfigured;
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-3);background:var(--bg2);border-radius:var(--radius-sm)">' +
        '<div style="display:flex;align-items:center;gap:8px"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg><span style="font-weight:500;font-size:var(--font-size-sm)">Stripe Betalinger</span></div>' +
        '<span style="font-size:12px;color:' + (payConfigured ? 'var(--success)' : 'var(--muted)') + ';font-weight:500">' + (payConfigured ? 'Konfigureret' : 'Ikke konfigureret') + '</span></div>';
    }
    html += '</div>';
  });
  return html;
}

function hexToRgb(hex) {
  var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return r + ',' + g + ',' + b;
}

// escapeHtml — see earlier definition

function saveAgentConfig(agentId) {
  var config = agentConfigDefinitions[agentId];
  if (!config) return;
  config.sections.forEach(function(s) {
    if (s.type === 'field' && !s.readonly) {
      var el = document.getElementById('config-' + s.key);
      if (el && el.value) localStorage.setItem(s.key, el.value);
    } else if (s.type === 'toggle') {
      var el = document.getElementById('config-' + s.key);
      if (el) localStorage.setItem(s.key, el.checked ? 'true' : 'false');
    } else if (s.type === 'select') {
      var el = document.getElementById('config-' + s.key);
      if (el) localStorage.setItem(s.key, el.value);
    }
  });
  toast(config.title + ' konfiguration gemt', 'success');
}

function disconnectAgent(provider) {
  if (workflowAgentStatus[provider]) {
    workflowAgentStatus[provider].connected = false;
    localStorage.setItem('orderflow_' + provider + '_agent_status', JSON.stringify(workflowAgentStatus[provider]));
    localStorage.removeItem(provider + '_page_name');
    localStorage.removeItem(provider + '_page_id');
    localStorage.removeItem(provider + '_access_token');
    if (typeof updateWorkflowAgentUI === 'function') updateWorkflowAgentUI(provider);
  }
  if (currentConfigAgent) openAgentConfigPanel(currentConfigAgent);
  toast(provider.charAt(0).toUpperCase() + provider.slice(1) + ' afbrudt', 'info');
}

// ============================================
// META OAUTH INTEGRATION
// ============================================

function initMetaOAuth(channel) {
  var META_APP_ID = localStorage.getItem('meta_app_id') || '905858048603012';
  if (!META_APP_ID) {
    toast('Meta App ID mangler. Tilføj den under API Nøgler først.', 'warning');
    return;
  }
  var redirectUri = encodeURIComponent(window.location.origin + '/api/auth/meta/redirect.html');
  var scope = channel === 'instagram'
    ? 'instagram_basic,instagram_manage_messages,pages_show_list'
    : 'pages_manage_metadata,pages_messaging,pages_show_list';
  var tenantId = window.currentRestaurant?.id || '';
  var state = btoa(JSON.stringify({ channel: channel, ts: Date.now(), tenantId: tenantId }));
  var authUrl = 'https://www.facebook.com/v21.0/dialog/oauth?client_id=' + META_APP_ID + '&redirect_uri=' + redirectUri + '&scope=' + scope + '&response_type=code&state=' + state;
  var popup = window.open(authUrl, 'meta_oauth', 'width=600,height=700,scrollbars=yes');
  window.addEventListener('message', function handler(event) {
    if (event.data && event.data.type === 'meta_oauth_callback') {
      window.removeEventListener('message', handler);
      handleMetaOAuthCallback(event.data, channel);
    }
  });
}

function handleMetaOAuthCallback(data, channel) {
  if (data.error) {
    toast('Forbindelse fejlede: ' + data.error, 'error');
    return;
  }
  toast('Forbinder ' + channel + '...', 'info');
  fetch('/api/auth/meta/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: data.code, state: data.state, channel: channel })
  }).then(function(r) { return r.json(); }).then(function(result) {
    if (result.success) {
      if (workflowAgentStatus[channel]) {
        workflowAgentStatus[channel].connected = true;
        localStorage.setItem('orderflow_' + channel + '_agent_status', JSON.stringify(workflowAgentStatus[channel]));
      }
      if (result.pageName) localStorage.setItem(channel + '_page_name', result.pageName);
      if (result.pageId) localStorage.setItem(channel + '_page_id', result.pageId);
      if (typeof updateWorkflowAgentUI === 'function') updateWorkflowAgentUI(channel);
      if (currentConfigAgent) openAgentConfigPanel(currentConfigAgent);
      toast(channel.charAt(0).toUpperCase() + channel.slice(1) + ' forbundet!', 'success');
    } else {
      toast('Forbindelse fejlede: ' + (result.error || 'Ukendt fejl'), 'error');
    }
  }).catch(function(err) {
    toast('Netværksfejl: ' + err.message, 'error');
  });
}

// Replace placeholder functions
function showInstagramIntegrationModal() { initMetaOAuth('instagram'); }
function showFacebookIntegrationModal() { initMetaOAuth('facebook'); }
function showInstagramConfig() { openAgentConfigPanel('instagram'); }
function showFacebookConfig() { openAgentConfigPanel('facebook'); }

// ============================================
// CUSTOMER INTEGRATIONS TAB
// ============================================


function renderAgentStatistics() {
  var container = document.getElementById('vaerktoejer-content-statistik');
  if (!container) return;
  var agents = [
    { id: 'instagram', name: 'Agent Instagram', color: '#ec4899', prefix: 'instagram' },
    { id: 'facebook', name: 'Agent Facebook', color: '#3b82f6', prefix: 'facebook' },
    { id: 'restaurant', name: 'Agent Restaurant', color: '#f97316', prefix: 'restaurant' },
    { id: 'haandvaerker', name: 'Agent Håndværker', color: '#14b8a6', prefix: 'haandvaerker' },
    { id: 'seo', name: 'Agent SEO', color: '#7c3aed', prefix: 'seo' }
  ];
  var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:var(--space-4)">';
  agents.forEach(function(a) {
    var stats = JSON.parse(localStorage.getItem('agent_stats_' + a.id) || '{}');
    var conversations = stats.conversations || 0;
    var orders = stats.orders || 0;
    var rate = stats.rate || '0%';
    var responseTime = stats.responseTime || '- sek';
    html += '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-5)">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:var(--space-4)">' +
      '<span style="width:8px;height:8px;border-radius:50%;background:' + a.color + ';display:inline-block"></span>' +
      '<h4 style="font-weight:var(--font-weight-semibold);margin:0;font-size:var(--font-size-sm)">' + a.name + '</h4></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">' +
      '<div><div style="color:var(--muted);font-size:11px;margin-bottom:2px">Samtaler</div><div style="font-size:var(--font-size-lg);font-weight:var(--font-weight-bold);color:' + a.color + '">' + conversations + '</div></div>' +
      '<div><div style="color:var(--muted);font-size:11px;margin-bottom:2px">Ordrer</div><div style="font-size:var(--font-size-lg);font-weight:var(--font-weight-bold);color:var(--success)">' + orders + '</div></div>' +
      '<div><div style="color:var(--muted);font-size:11px;margin-bottom:2px">Completion</div><div style="font-size:var(--font-size-lg);font-weight:var(--font-weight-bold)">' + rate + '</div></div>' +
      '<div><div style="color:var(--muted);font-size:11px;margin-bottom:2px">Responstid</div><div style="font-size:var(--font-size-lg);font-weight:var(--font-weight-bold)">' + responseTime + '</div></div>' +
      '</div></div>';
  });
  html += '</div>';
  container.innerHTML = html;
}

function renderAgentStatusDashboard() {
  // Status table is static HTML, no dynamic render needed currently
}

// ============================================================
// AGENTER PAGE — FLOW Agent System
// ============================================================

const AGENT_ENDPOINTS = [
  { name: 'Supabase REST', url: CONFIG.SUPABASE_URL + '/rest/v1/', method: 'GET', critical: true },
  { name: 'SMS Send', url: CONFIG.SUPABASE_URL + '/functions/v1/send-sms', method: 'GET', critical: true },
  { name: 'SMS Receive', url: CONFIG.SUPABASE_URL + '/functions/v1/receive-sms', method: 'GET', critical: true },
  { name: 'Payment Intent', url: CONFIG.SUPABASE_URL + '/functions/v1/create-payment-intent', method: 'GET', critical: true },
  { name: 'OTP Email', url: CONFIG.SUPABASE_URL + '/functions/v1/send-otp-email', method: 'GET', critical: false }
];

const AGENT_SMS_PATTERNS = {
  confirm: { patterns: [/^(ja|yes|ok|jep|yep|jo|oki)$/i, /\b(bekræft|accept|godkend|det er fint|sounds good|confirm)\b/i], confidence: 0.95 },
  cancel: { patterns: [/^(nej|no|nope|nåh)$/i, /\b(annuller|cancel|afbestil|stop|fortryd)\b/i], confidence: 0.95 },
  reschedule: { patterns: [/\b(ændre tid|skubbe|senere|flytte|different time|reschedule|udskyde|kl\.?\s*\d)\b/i], confidence: 0.85 },
  question: { patterns: [/\?$/, /\b(hvad|what|hvornår|when|hvordan|how|kan|can|hvor|where)\b/i], confidence: 0.80 },
  allergy: { patterns: [/\b(allergi|allergy|nødder|nuts|gluten|laktose|lactose|intoleran)\b/i], confidence: 0.99 }
};

const AGENTER_PAGE_AGENTS = [
  {
    id: 'workflow',
    name: 'Agent Workflow',
    subtitle: 'Workflow monitorering',
    description: 'Overvåger workflow-signaler, driftsstatus og seneste agentaktivitet.',
    color: '#6366f1',
    version: 'v1.0.0'
  },
  {
    id: 'debugging',
    name: 'Agent Debugging',
    subtitle: 'Diagnostik',
    description: 'Teknisk fejlfinding, endpoint check og SMS parser test.',
    color: '#f59e0b',
    version: 'v1.0.0'
  },
  {
    id: 'instagram',
    name: 'Agent Instagram',
    subtitle: 'Workflow integration',
    description: 'Status og hurtig adgang til Instagram workflow.',
    color: '#ec4899',
    version: 'v1.2.0'
  },
  {
    id: 'facebook',
    name: 'Agent Facebook',
    subtitle: 'Workflow integration',
    description: 'Status og hurtig adgang til Facebook workflow.',
    color: '#3b82f6',
    version: 'v1.2.0'
  },
  {
    id: 'restaurant',
    name: 'Agent Restaurant',
    subtitle: 'SMS workflows',
    description: 'Overvågning af SMS-workflows og operationelle signaler.',
    color: '#f97316',
    version: 'v1.2.0'
  },
  {
    id: 'haandvaerker',
    name: 'Agent Håndværker',
    subtitle: 'SMS workflows',
    description: 'SMS-workflows og automatisering for håndværkerbranchen.',
    color: '#8b5cf6',
    version: 'v1.1.0'
  },
  {
    id: 'seo',
    name: 'Agent SEO',
    subtitle: 'Søgemaskineoptimering',
    description: 'Digital synlighedsanalyse og SEO-automatisering.',
    color: '#10b981',
    version: 'v3.0.0'
  }
];

const agenterPageState = {
  view: 'overview',
  selectedAgentId: null
};

var AGENT_UPDATE_REGISTRY = {
  workflow: [
    { version: 'v1.0.0', date: '2025-11-01', notes: ['Initial release', 'Workflow monitorering'] },
    { version: 'v1.1.0', date: '2026-01-15', notes: ['Forbedret signal-detektion', 'Ny aktivitetslog', 'Auto-restart ved fejl'] },
    { version: 'v1.2.0', date: '2026-02-05', notes: ['Real-time status updates', 'Performance optimering', 'Webhook retry-logik'] }
  ],
  debugging: [
    { version: 'v1.0.0', date: '2025-11-01', notes: ['Initial release'] },
    { version: 'v1.1.0', date: '2026-01-20', notes: ['Ny endpoint health check', 'SMS parser test forbedret', 'Detaljeret fejlrapportering'] }
  ],
  instagram: [
    { version: 'v1.2.0', date: '2025-12-01', notes: ['Initial release med workflow integration'] },
    { version: 'v1.3.0', date: '2026-02-01', notes: ['Auto-post scheduling', 'Forbedret hashtag-analyse', 'Story analytics integration'] }
  ],
  facebook: [
    { version: 'v1.2.0', date: '2025-12-01', notes: ['Initial release med workflow integration'] },
    { version: 'v1.3.0', date: '2026-02-01', notes: ['Messenger bot integration', 'Audience insights', 'Auto-reply templates'] }
  ],
  restaurant: [
    { version: 'v1.2.0', date: '2025-12-01', notes: ['Initial release med SMS workflows'] },
    { version: 'v1.3.0', date: '2026-01-25', notes: ['Ny ordrebekræftelse flow', 'Allergi-detektion forbedret', 'Prioriteret kø-system'] },
    { version: 'v1.4.0', date: '2026-02-08', notes: ['Multi-sprog SMS', 'Smart retry-logik', 'Leveringstid-estimering'] }
  ],
  haandvaerker: [
    { version: 'v1.1.0', date: '2025-12-15', notes: ['Initial release'] },
    { version: 'v1.2.0', date: '2026-02-03', notes: ['Tidsbestilling automation', 'Kundefeedback integration', 'Automatisk påmindelse-SMS'] }
  ],
  seo: [
    { version: 'v3.0.0', date: '2026-01-01', notes: ['Major version med AI-drevet analyse'] },
    { version: 'v3.1.0', date: '2026-02-07', notes: ['Google Search Console integration', 'Keyword tracking forbedret', 'Konkurrent-analyse modul'] }
  ]
};

function getAgentInstalledVersion(agentId) {
  var versions = JSON.parse(localStorage.getItem('flow_agent_installed_versions') || '{}');
  if (versions[agentId]) return versions[agentId];
  var agent = AGENTER_PAGE_AGENTS.find(function(a) { return a.id === agentId; });
  return agent ? agent.version : 'v1.0.0';
}

function getAgentLatestVersion(agentId) {
  var updates = AGENT_UPDATE_REGISTRY[agentId];
  if (!updates || !updates.length) return getAgentInstalledVersion(agentId);
  return updates[updates.length - 1].version;
}

function agentHasUpdate(agentId) {
  return getAgentInstalledVersion(agentId) !== getAgentLatestVersion(agentId);
}

function getAgentChangelog(agentId, fromVersion) {
  var updates = AGENT_UPDATE_REGISTRY[agentId] || [];
  var collecting = false;
  var result = [];
  for (var i = 0; i < updates.length; i++) {
    if (updates[i].version === fromVersion) { collecting = true; continue; }
    if (collecting) result.push(updates[i]);
  }
  return result;
}

function saveAgentVersion(agentId, version) {
  var versions = JSON.parse(localStorage.getItem('flow_agent_installed_versions') || '{}');
  versions[agentId] = version;
  localStorage.setItem('flow_agent_installed_versions', JSON.stringify(versions));
}

function addAgentUpdateHistory(agentId, fromVersion, toVersion) {
  var history = JSON.parse(localStorage.getItem('flow_agent_update_history') || '[]');
  history.unshift({ agentId: agentId, from: fromVersion, to: toVersion, date: new Date().toISOString() });
  if (history.length > 100) history = history.slice(0, 100);
  localStorage.setItem('flow_agent_update_history', JSON.stringify(history));
}

function safeParseJson(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

function toRelativeTimeLabel(timestamp) {
  if (!timestamp) return 'Ikke registreret';
  const value = new Date(timestamp).getTime();
  if (!value || Number.isNaN(value)) return 'Ukendt';
  const diffMs = Date.now() - value;
  if (diffMs < 0) return 'Lige nu';
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'Lige nu';
  if (diffMin < 60) return diffMin + ' min siden';
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return diffHours + ' timer siden';
  const diffDays = Math.round(diffHours / 24);
  return diffDays + ' dage siden';
}

function getLatestWorkflowSettingsUpdate() {
  let list = (typeof restaurants !== 'undefined' && Array.isArray(restaurants)) ? restaurants : null;
  if (!list || !list.length) {
    list = safeParseJson(localStorage.getItem('orderflow_restaurants'), []);
  }
  if (!Array.isArray(list) || list.length === 0) return 'Ingen registreret';

  let latest = 0;
  list.forEach((item) => {
    if (!item || !item.workflowSettingsUpdatedAt) return;
    const parsed = new Date(item.workflowSettingsUpdatedAt).getTime();
    if (parsed && !Number.isNaN(parsed) && parsed > latest) {
      latest = parsed;
    }
  });
  if (!latest) return 'Ingen registreret';
  return new Date(latest).toLocaleString('da-DK');
}

function getAgentOverviewState(agentId) {
  const debugState = safeParseJson(localStorage.getItem('flow_agent_debug_state'), null);
  const workflowState = safeParseJson(localStorage.getItem('flow_agent_workflow_state'), null);
  const instagramStatus = safeParseJson(localStorage.getItem('orderflow_instagram_agent_status'), null);
  const facebookStatus = safeParseJson(localStorage.getItem('orderflow_facebook_agent_status'), null);

  if (agentId === 'workflow') {
    const activeCount = [instagramStatus, facebookStatus].filter((entry) => entry && entry.active).length;
    const connectedCount = [instagramStatus, facebookStatus].filter((entry) => entry && entry.connected).length;
    const isActive = activeCount > 0 || !!workflowState;
    return {
      label: isActive ? 'Aktiv' : 'Inaktiv',
      color: isActive ? 'var(--success)' : 'var(--muted)',
      metaPrimary: activeCount + '/2 aktive integrationer',
      metaSecondary: connectedCount + '/2 forbundne integrationer'
    };
  }

  if (agentId === 'debugging') {
    const activeRecently = !!(debugState && debugState.lastRun && (Date.now() - new Date(debugState.lastRun).getTime()) < 10 * 60000);
    return {
      label: activeRecently ? 'Aktiv' : 'Inaktiv',
      color: activeRecently ? 'var(--success)' : 'var(--warning)',
      metaPrimary: 'Sidste run: ' + (debugState && debugState.lastRun ? toRelativeTimeLabel(debugState.lastRun) : 'Aldrig'),
      metaSecondary: 'Endpoint monitor'
    };
  }

  if (agentId === 'instagram') {
    const isActive = !!(instagramStatus && instagramStatus.active);
    return {
      label: isActive ? 'Aktiv' : 'Inaktiv',
      color: isActive ? '#ec4899' : 'var(--muted)',
      metaPrimary: instagramStatus && instagramStatus.connected ? 'Forbundet' : 'Ikke forbundet',
      metaSecondary: 'Instagram workflow'
    };
  }

  if (agentId === 'facebook') {
    const isActive = !!(facebookStatus && facebookStatus.active);
    return {
      label: isActive ? 'Aktiv' : 'Inaktiv',
      color: isActive ? '#3b82f6' : 'var(--muted)',
      metaPrimary: facebookStatus && facebookStatus.connected ? 'Forbundet' : 'Ikke forbundet',
      metaSecondary: 'Facebook workflow'
    };
  }

  return {
    label: 'Klar',
    color: 'var(--primary)',
    metaPrimary: 'Read-only monitor',
    metaSecondary: 'SMS workflows'
  };
}

function renderAgenterOverview() {
  const overviewEl = document.getElementById('agenter-overview-view');
  const detailEl = document.getElementById('agenter-detail-view');
  const gridEl = document.getElementById('agenter-cards-grid');
  if (!gridEl || !overviewEl || !detailEl) return;

  overviewEl.style.display = '';
  detailEl.style.display = 'none';

  gridEl.innerHTML = AGENTER_PAGE_AGENTS.map(function(agent) {
    var state = getAgentOverviewState(agent.id);
    var installedVer = getAgentInstalledVersion(agent.id);
    var latestVer = getAgentLatestVersion(agent.id);
    var hasUpdate = installedVer !== latestVer;
    var btnClass = hasUpdate ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-secondary';
    var btnText = hasUpdate ? 'Opdater til ' + latestVer : 'Opdateret';
    var updateBadge = hasUpdate ? '<span style="font-size:10px;padding:2px 6px;border-radius:var(--radius-sm);background:var(--warning);color:#000;font-weight:600;margin-left:6px">Ny version</span>' : '';
    return (
      '<button type="button" onclick="openAgentDetail(\'' + agent.id + '\')" style="text-align:left;background:var(--card);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-5);cursor:pointer;transition:border-color .2s,transform .2s" onmouseenter="this.style.borderColor=\'' + agent.color + '\';this.style.transform=\'translateY(-2px)\'" onmouseleave="this.style.borderColor=\'var(--border)\';this.style.transform=\'translateY(0)\'">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:var(--space-3)">' +
          '<div>' +
            '<h3 style="margin:0 0 4px 0;font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold)">' + agent.name + updateBadge + '</h3>' +
            '<div style="color:var(--muted);font-size:var(--font-size-sm)">' + agent.subtitle + '</div>' +
          '</div>' +
          '<span style="font-size:11px;padding:3px 8px;border-radius:var(--radius-sm);background:' + agent.color + ';color:white">' + installedVer + '</span>' +
        '</div>' +
        '<p style="margin:0 0 var(--space-3) 0;color:var(--muted);font-size:var(--font-size-sm);line-height:1.5">' + agent.description + '</p>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;padding-top:var(--space-3);border-top:1px solid var(--border)">' +
          '<span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:' + state.color + ';font-weight:600"><span style="width:7px;height:7px;border-radius:50%;background:' + state.color + ';display:inline-block"></span>' + state.label + '</span>' +
          '<span style="font-size:12px;color:var(--muted)">' + state.metaPrimary + '</span>' +
        '</div>' +
        '<div style="margin-top:var(--space-3);padding-top:var(--space-3);border-top:1px solid var(--border);display:flex;justify-content:flex-end">' +
          '<span class="' + btnClass + '" onclick="event.stopPropagation();updateAgent(\'' + agent.id + '\')" id="agent-update-btn-' + agent.id + '">' + btnText + '</span>' +
        '</div>' +
      '</button>'
    );
  }).join('');
}

function updateAgent(agentId) {
  var agent = AGENTER_PAGE_AGENTS.find(function(a) { return a.id === agentId; });
  if (!agent) return;

  var installedVer = getAgentInstalledVersion(agentId);
  var latestVer = getAgentLatestVersion(agentId);

  if (installedVer === latestVer) {
    toast(agent.name + ' er allerede opdateret (' + latestVer + ')', 'info');
    return;
  }

  var btn = document.getElementById('agent-update-btn-' + agentId);
  if (!btn) return;

  btn.style.pointerEvents = 'none';
  btn.style.opacity = '0.7';
  btn.textContent = '0%';

  var steps = [10, 25, 40, 55, 70, 85, 95, 100];
  var stepIdx = 0;

  var interval = setInterval(function() {
    if (stepIdx < steps.length) {
      btn.textContent = steps[stepIdx] + '%';
      stepIdx++;
    } else {
      clearInterval(interval);

      // Save updated version
      saveAgentVersion(agentId, latestVer);
      addAgentUpdateHistory(agentId, installedVer, latestVer);

      // Log to activity
      var activity = JSON.parse(localStorage.getItem('flow_agent_activity') || '[]');
      activity.unshift({ type: 'update', agentId: agentId, from: installedVer, to: latestVer, date: new Date().toISOString() });
      if (activity.length > 200) activity = activity.slice(0, 200);
      localStorage.setItem('flow_agent_activity', JSON.stringify(activity));

      toast(agent.name + ' opdateret til ' + latestVer, 'success');
      renderAgenterOverview();

      // Show changelog modal
      var changelog = getAgentChangelog(agentId, installedVer);
      if (changelog.length > 0) {
        showAgentChangelogModal(agent.name, installedVer, latestVer, changelog);
      }
    }
  }, 250);
}

function showAgentChangelogModal(agentName, fromVer, toVer, changelog) {
  var html = '<div style="margin-bottom:var(--space-3)">' +
    '<span style="display:inline-block;padding:2px 8px;border-radius:var(--radius-sm);background:var(--bg2);font-size:12px;color:var(--muted)">' + fromVer + '</span>' +
    ' <span style="color:var(--muted);margin:0 4px">&rarr;</span> ' +
    '<span style="display:inline-block;padding:2px 8px;border-radius:var(--radius-sm);background:var(--success);color:white;font-size:12px;font-weight:600">' + toVer + '</span>' +
  '</div>';

  for (var i = 0; i < changelog.length; i++) {
    var entry = changelog[i];
    html += '<div style="margin-bottom:var(--space-3);padding:var(--space-3);background:var(--bg2);border-radius:var(--radius-sm)">' +
      '<div style="font-weight:var(--font-weight-semibold);font-size:var(--font-size-sm);margin-bottom:4px">' + entry.version + ' <span style="color:var(--muted);font-weight:400;font-size:12px">(' + entry.date + ')</span></div>' +
      '<ul style="margin:0;padding-left:18px;color:var(--muted);font-size:var(--font-size-sm)">';
    for (var j = 0; j < entry.notes.length; j++) {
      html += '<li style="margin-bottom:2px">' + entry.notes[j] + '</li>';
    }
    html += '</ul></div>';
  }

  showCustomModal(agentName + ' — Changelog', html);
}

function loadAgenterPage() {
  agenterPageState.view = 'overview';
  agenterPageState.selectedAgentId = null;
  renderAgenterOverview();
}

function openAgentDetail(agentId) {
  const agent = AGENTER_PAGE_AGENTS.find((entry) => entry.id === agentId);
  if (!agent) return;

  const overviewEl = document.getElementById('agenter-overview-view');
  const detailEl = document.getElementById('agenter-detail-view');
  const titleEl = document.getElementById('agenter-detail-title');
  const subtitleEl = document.getElementById('agenter-detail-subtitle');
  if (!overviewEl || !detailEl || !titleEl || !subtitleEl) return;

  agenterPageState.view = 'detail';
  agenterPageState.selectedAgentId = agentId;

  overviewEl.style.display = 'none';
  detailEl.style.display = '';
  titleEl.textContent = agent.name;
  subtitleEl.textContent = agent.subtitle;

  renderAgentDetail(agentId);
}

function closeAgentDetail() {
  agenterPageState.view = 'overview';
  agenterPageState.selectedAgentId = null;
  renderAgenterOverview();
}

function renderWorkflowSignals() {
  const container = document.getElementById('agent-workflow-signals');
  if (!container) return;

  const workflowModule = localStorage.getItem('workflow_module') || 'restaurant';
  const workflowState = safeParseJson(localStorage.getItem('flow_agent_workflow_state'), null);
  const instagramStatus = safeParseJson(localStorage.getItem('orderflow_instagram_agent_status'), null);
  const facebookStatus = safeParseJson(localStorage.getItem('orderflow_facebook_agent_status'), null);

  const signals = [
    { label: 'Workflow modul', value: workflowModule, tone: 'var(--primary)' },
    { label: 'Sidste workflow-run', value: workflowState && workflowState.lastRun ? toRelativeTimeLabel(workflowState.lastRun) : 'Ingen registreret', tone: 'var(--text)' },
    { label: 'Workflow settings opdateret', value: getLatestWorkflowSettingsUpdate(), tone: 'var(--text)' },
    { label: 'Instagram agent', value: instagramStatus && instagramStatus.active ? 'Aktiv' : 'Inaktiv', tone: instagramStatus && instagramStatus.active ? 'var(--success)' : 'var(--muted)' },
    { label: 'Facebook agent', value: facebookStatus && facebookStatus.active ? 'Aktiv' : 'Inaktiv', tone: facebookStatus && facebookStatus.active ? 'var(--success)' : 'var(--muted)' },
    { label: 'Forbundne integrationer', value: ((instagramStatus && instagramStatus.connected ? 1 : 0) + (facebookStatus && facebookStatus.connected ? 1 : 0)) + '/2', tone: 'var(--text)' }
  ];

  container.innerHTML = signals.map((signal) => (
    '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-4)">' +
      '<div style="font-size:12px;color:var(--muted);margin-bottom:4px">' + signal.label + '</div>' +
      '<div style="font-size:var(--font-size-base);font-weight:var(--font-weight-semibold);color:' + signal.tone + '">' + signal.value + '</div>' +
    '</div>'
  )).join('');
}

function renderActivityList(targetId, emptyMessage) {
  const listEl = document.getElementById(targetId);
  if (!listEl) return;
  const log = safeParseJson(localStorage.getItem('flow_agent_activity'), []);

  if (!Array.isArray(log) || log.length === 0) {
    listEl.innerHTML = '<div style="padding:10px 0;color:var(--muted)">' + emptyMessage + '</div>';
    return;
  }

  listEl.innerHTML = log.slice(-10).reverse().map((entry) => {
    const time = entry && entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString('da-DK') : '--:--';
    const severity = entry && entry.severity ? entry.severity : 'info';
    const color = severity === 'error' ? 'var(--danger)' : severity === 'warning' ? 'var(--warning)' : 'var(--muted)';
    const text = (entry && (entry.message || entry.event)) ? (entry.message || entry.event) : 'Ukendt aktivitet';
    return (
      '<div style="padding:8px 0;border-bottom:1px solid var(--border)">' +
        '<span style="font-size:11px;color:' + color + '">[' + time + ']</span> ' +
        '<span style="font-size:var(--font-size-sm)">' + text + '</span>' +
      '</div>'
    );
  }).join('');
}

function renderWorkflowDetail() {
  const contentEl = document.getElementById('agenter-detail-content');
  if (!contentEl) return;

  const workflowState = safeParseJson(localStorage.getItem('flow_agent_workflow_state'), null);
  const instagramStatus = safeParseJson(localStorage.getItem('orderflow_instagram_agent_status'), null);
  const facebookStatus = safeParseJson(localStorage.getItem('orderflow_facebook_agent_status'), null);

  contentEl.innerHTML =
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:var(--space-3);margin-bottom:var(--space-5)">' +
      '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-4)"><div style="color:var(--muted);font-size:12px">Workflow Agent status</div><div style="font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);margin-top:4px">' + (workflowState ? 'Aktiv monitorering' : 'Klar') + '</div></div>' +
      '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-4)"><div style="color:var(--muted);font-size:12px">Instagram/Facebook aktive</div><div style="font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);margin-top:4px">' + ((instagramStatus && instagramStatus.active ? 1 : 0) + (facebookStatus && facebookStatus.active ? 1 : 0)) + '/2</div></div>' +
      '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-4)"><div style="color:var(--muted);font-size:12px">Sidste heartbeat</div><div style="font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);margin-top:4px">' + (workflowState && workflowState.lastRun ? toRelativeTimeLabel(workflowState.lastRun) : 'Ikke registreret') + '</div></div>' +
      '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-4)"><div style="color:var(--muted);font-size:12px">Seneste workflow save</div><div style="font-size:var(--font-size-base);font-weight:var(--font-weight-semibold);margin-top:4px">' + getLatestWorkflowSettingsUpdate() + '</div></div>' +
    '</div>' +

    '<div style="display:flex;flex-wrap:wrap;gap:var(--space-2);margin-bottom:var(--space-5)">' +
      '<button class="btn btn-primary" onclick="showPage(\'workflow\')">Aabn Workflow</button>' +
      '<button class="btn btn-secondary" onclick="showPage(\'sms-workflows\')">Aabn SMS Workflows</button>' +
      '<button class="btn btn-secondary" onclick="showPage(\'instagram-workflow\')">Aabn Instagram Workflow</button>' +
      '<button class="btn btn-secondary" onclick="showPage(\'facebook-workflow\')">Aabn Facebook Workflow</button>' +
    '</div>' +

    '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-5);margin-bottom:var(--space-4)">' +
      '<h3 style="font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);margin:0 0 var(--space-3) 0">Workflow-signaler</h3>' +
      '<div id="agent-workflow-signals" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:var(--space-3)"></div>' +
    '</div>' +

    '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-5);margin-bottom:var(--space-4)">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:var(--space-3)">' +
        '<h3 style="font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);margin:0">Endpoint overvaagning</h3>' +
        '<button class="btn btn-secondary" onclick="runAgentEndpointCheck()" style="font-size:var(--font-size-sm);padding:6px 12px">Tjek nu</button>' +
      '</div>' +
      '<div style="overflow-x:auto">' +
        '<table style="width:100%;border-collapse:collapse">' +
          '<thead><tr style="border-bottom:1px solid var(--border)"><th style="text-align:left;padding:10px 12px;font-size:var(--font-size-sm);color:var(--muted)">Endpoint</th><th style="text-align:center;padding:10px 12px;font-size:var(--font-size-sm);color:var(--muted)">Status</th><th style="text-align:right;padding:10px 12px;font-size:var(--font-size-sm);color:var(--muted)">Responstid</th><th style="text-align:right;padding:10px 12px;font-size:var(--font-size-sm);color:var(--muted)">Sidst tjekket</th></tr></thead>' +
          '<tbody id="agent-endpoint-table"><tr><td colspan="4" style="padding:16px;text-align:center;color:var(--muted)">Tryk "Tjek nu" for endpoint-check</td></tr></tbody>' +
        '</table>' +
      '</div>' +
    '</div>' +

    '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-5)">' +
      '<h3 style="font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);margin:0 0 var(--space-3) 0">Seneste workflow-aktivitet</h3>' +
      '<div id="agent-workflow-activity-log" style="max-height:240px;overflow-y:auto;font-size:var(--font-size-sm)"></div>' +
    '</div>';

  renderWorkflowSignals();
  renderActivityList('agent-workflow-activity-log', 'Ingen workflow-aktivitet registreret endnu.');
}

function renderDebuggingDetail() {
  const contentEl = document.getElementById('agenter-detail-content');
  if (!contentEl) return;

  const debugState = safeParseJson(localStorage.getItem('flow_agent_debug_state'), null);
  const statusColor = debugState && debugState.lastRun ? 'var(--success)' : 'var(--muted)';

  contentEl.innerHTML =
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:var(--space-3);margin-bottom:var(--space-4)">' +
      '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-4)"><div style="font-size:12px;color:var(--muted)">Debug status</div><div style="display:flex;align-items:center;gap:6px;margin-top:4px;font-size:var(--font-size-base);font-weight:var(--font-weight-semibold);color:' + statusColor + '"><span style="width:8px;height:8px;border-radius:50%;background:' + statusColor + ';display:inline-block"></span>' + (debugState ? 'Aktiv' : 'Ikke startet') + '</div></div>' +
      '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-4)"><div style="font-size:12px;color:var(--muted)">Sidste run</div><div style="margin-top:4px;font-size:var(--font-size-base);font-weight:var(--font-weight-semibold)">' + (debugState && debugState.lastRun ? toRelativeTimeLabel(debugState.lastRun) : 'Aldrig') + '</div></div>' +
    '</div>' +

    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">' +
      '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-5)">' +
        '<h3 style="font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);margin:0 0 var(--space-2) 0">Test SMS parser</h3>' +
        '<p style="color:var(--muted);font-size:var(--font-size-sm);margin-bottom:var(--space-3)">Debugging agentens parser-test for intents.</p>' +
        '<textarea id="agent-sms-input" rows="3" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-md);background:var(--bg-secondary);color:var(--text);font-size:var(--font-size-sm);resize:vertical;font-family:inherit" placeholder="Skriv en SMS-besked, fx \'ja tak\' eller \'allergi nodder\'"></textarea>' +
        '<button class="btn btn-primary" onclick="testAgentSmsParser()" style="margin-top:var(--space-2);font-size:var(--font-size-sm);padding:6px 16px">Analyser</button>' +
        '<div id="agent-sms-result" style="margin-top:var(--space-3);display:none"></div>' +
      '</div>' +
      '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-5)">' +
        '<h3 style="font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);margin:0 0 var(--space-2) 0">Debug aktivitet</h3>' +
        '<p style="color:var(--muted);font-size:var(--font-size-sm);margin-bottom:var(--space-3)">Seneste tekniske events fra agent-aktivitetsloggen.</p>' +
        '<div id="agent-debug-activity-log" style="max-height:240px;overflow-y:auto;font-size:var(--font-size-sm)"></div>' +
      '</div>' +
    '</div>';

  renderActivityList('agent-debug-activity-log', 'Ingen debug-aktivitet registreret endnu.');
}

function renderPlaceholderDetail(agentId) {
  const contentEl = document.getElementById('agenter-detail-content');
  const agent = AGENTER_PAGE_AGENTS.find((entry) => entry.id === agentId);
  if (!contentEl || !agent) return;

  const navigationMap = {
    instagram: 'instagram-workflow',
    facebook: 'facebook-workflow',
    restaurant: 'sms-workflows',
    haandvaerker: 'sms-workflows',
    seo: 'search-engine'
  };
  const targetPage = navigationMap[agentId];

  contentEl.innerHTML =
    '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-6);max-width:860px">' +
      '<h3 style="font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);margin:0 0 var(--space-2) 0">Read-only detalje</h3>' +
      '<p style="color:var(--muted);font-size:var(--font-size-sm);line-height:1.6;margin-bottom:var(--space-4)">' + agent.description + '</p>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:var(--space-3);margin-bottom:var(--space-4)">' +
        '<div style="padding:var(--space-3);background:var(--bg2);border-radius:var(--radius-sm)"><div style="font-size:12px;color:var(--muted)">Agent</div><div style="font-weight:var(--font-weight-semibold)">' + agent.name + '</div></div>' +
        '<div style="padding:var(--space-3);background:var(--bg2);border-radius:var(--radius-sm)"><div style="font-size:12px;color:var(--muted)">Version</div><div style="font-weight:var(--font-weight-semibold)">' + getAgentInstalledVersion(agent.id) + '</div></div>' +
      '</div>' +
      (targetPage ? '<button class="btn btn-primary" onclick="showPage(\'' + targetPage + '\')">Aabn relateret workflow</button>' : '') +
    '</div>';
}

function renderAgentDetail(agentId) {
  if (agentId === 'workflow') {
    renderWorkflowDetail();
    return;
  }
  if (agentId === 'debugging') {
    renderDebuggingDetail();
    return;
  }
  renderPlaceholderDetail(agentId);
}

async function runAgentEndpointCheck() {
  const tableEl = document.getElementById('agent-endpoint-table');
  if (!tableEl) {
    if (typeof toast === 'function') toast('Aabn Workflow Agent detaljen for at koere endpoint check', 'warning');
    return;
  }

  tableEl.innerHTML = '<tr><td colspan="4" style="padding:20px;text-align:center;color:var(--muted)">Checker endpoints...</td></tr>';

  const results = [];
  const headers = { 'apikey': CONFIG.SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + CONFIG.SUPABASE_ANON_KEY };

  for (const ep of AGENT_ENDPOINTS) {
    const start = performance.now();
    let status = 'down';
    let statusCode = null;
    let responseTime = 0;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(ep.url, { method: ep.method, headers, signal: controller.signal });
      clearTimeout(timeout);
      responseTime = Math.round(performance.now() - start);
      statusCode = res.status;
      if (res.ok || res.status === 401) status = 'healthy';
      else if (res.status < 500) status = 'degraded';
      else status = 'down';
    } catch (err) {
      responseTime = Math.round(performance.now() - start);
      status = 'down';
    }

    if (responseTime > 2000 && status === 'healthy') status = 'degraded';

    results.push({ name: ep.name, status, statusCode, responseTime, critical: ep.critical });
  }

  const now = new Date().toLocaleTimeString('da-DK');
  const statusDots = { healthy: 'var(--success)', degraded: 'var(--warning)', down: 'var(--danger)' };
  const statusLabels = { healthy: 'OK', degraded: 'Langsom', down: 'Nede' };

  tableEl.innerHTML = results.map(r => {
    const dot = '<div style="width:8px;height:8px;border-radius:50%;background:' + statusDots[r.status] + ';display:inline-block;margin-right:6px"></div>';
    const critical = r.critical ? '' : ' <span style="color:var(--muted);font-size:11px">(valgfri)</span>';
    return '<tr style="border-bottom:1px solid var(--border)">' +
      '<td style="padding:10px 12px;font-size:var(--font-size-sm)">' + r.name + critical + '</td>' +
      '<td style="padding:10px 12px;text-align:center;font-size:var(--font-size-sm)">' + dot + statusLabels[r.status] + '</td>' +
      '<td style="padding:10px 12px;text-align:right;font-size:var(--font-size-sm)">' + r.responseTime + 'ms</td>' +
      '<td style="padding:10px 12px;text-align:right;font-size:var(--font-size-sm);color:var(--muted)">' + now + '</td>' +
    '</tr>';
  }).join('');

  // Save to localStorage for activity log
  const healthy = results.filter(r => r.status === 'healthy').length;
  let activity = safeParseJson(localStorage.getItem('flow_agent_activity'), []);
  if (!Array.isArray(activity)) activity = [];
  activity.push({
    timestamp: new Date().toISOString(),
    event: 'endpoint_check',
    message: 'Endpoint check: ' + healthy + '/' + results.length + ' healthy',
    severity: healthy === results.length ? 'info' : 'warning'
  });
  localStorage.setItem('flow_agent_activity', JSON.stringify(activity.slice(-50)));

  // Update debug agent + workflow monitor heartbeat
  localStorage.setItem('flow_agent_debug_state', JSON.stringify({ lastRun: new Date().toISOString(), overallStatus: healthy === results.length ? 'healthy' : 'degraded' }));
  const workflowState = safeParseJson(localStorage.getItem('flow_agent_workflow_state'), {}) || {};
  workflowState.lastRun = new Date().toISOString();
  workflowState.healthSummary = healthy + '/' + results.length;
  localStorage.setItem('flow_agent_workflow_state', JSON.stringify(workflowState));

  if (agenterPageState.view === 'detail' && agenterPageState.selectedAgentId === 'workflow') {
    renderWorkflowSignals();
    renderActivityList('agent-workflow-activity-log', 'Ingen workflow-aktivitet registreret endnu.');
  } else {
    renderAgenterOverview();
  }

  if (typeof toast === 'function') toast('Endpoint check færdig: ' + healthy + '/' + results.length + ' OK', healthy === results.length ? 'success' : 'warning');
}

function testAgentSmsParser() {
  const input = document.getElementById('agent-sms-input');
  const resultEl = document.getElementById('agent-sms-result');
  if (!input || !resultEl) return;

  const message = input.value.trim();
  if (!message) { if (typeof toast === 'function') toast('Skriv en SMS-besked først', 'warning'); return; }

  const normalized = message.toLowerCase();

  // Detect language
  const daDa = /\b(ja|nej|tak|hej|bestilling|allergi|nødder|gluten|hvad|hvordan|hvornår|hvor|ændre|annuller|bekræft)\b/i;
  const enEn = /\b(yes|no|please|hello|order|allergy|nuts|what|how|when|where|cancel|confirm)\b/i;
  const daCount = (message.match(daDa) || []).length;
  const enCount = (message.match(enEn) || []).length;
  const language = daCount > enCount ? 'da' : enCount > daCount ? 'en' : (/[æøå]/.test(message) ? 'da' : 'unknown');

  // Check patterns
  let intent = 'unknown';
  let confidence = 0;
  const flags = [];

  for (const [intentName, config] of Object.entries(AGENT_SMS_PATTERNS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(normalized)) {
        intent = intentName;
        confidence = config.confidence;
        break;
      }
    }
    if (intent !== 'unknown') break;
  }

  if (intent === 'allergy') flags.push('CRITICAL');

  // Extract time
  const timeMatch = message.match(/kl\.?\s*(\d{1,2})[.:]?(\d{2})?/i) || message.match(/(\d{1,2})[.:](\d{2})\s*(pm|am)?/i);
  const extractedTime = timeMatch ? timeMatch[0] : null;

  // Display result
  resultEl.style.display = 'block';
  const intentColors = { confirm: 'var(--success)', cancel: 'var(--danger)', reschedule: 'var(--primary)', question: 'var(--warning)', allergy: '#8B0000', unknown: 'var(--muted)' };
  const intentLabels = { confirm: 'Bekræft', cancel: 'Annuller', reschedule: 'Ændre tid', question: 'Spørgsmål', allergy: 'Allergi', unknown: 'Ukendt' };

  resultEl.innerHTML =
    '<div style="background:var(--bg-secondary);border-radius:var(--radius-md);padding:12px;font-size:var(--font-size-sm)">' +
    (intent === 'allergy' ? '<div style="background:#8B0000;color:white;padding:6px 10px;border-radius:4px;margin-bottom:8px;font-weight:600">KRITISK ALLERGI-ALARM</div>' : '') +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
    '<div><span style="color:var(--muted)">Intent:</span> <strong style="color:' + (intentColors[intent] || 'var(--muted)') + '">' + (intentLabels[intent] || intent) + '</strong></div>' +
    '<div><span style="color:var(--muted)">Confidence:</span> <strong>' + Math.round(confidence * 100) + '%</strong></div>' +
    '<div><span style="color:var(--muted)">Sprog:</span> <strong>' + (language === 'da' ? 'Dansk' : language === 'en' ? 'Engelsk' : 'Ukendt') + '</strong></div>' +
    (extractedTime ? '<div><span style="color:var(--muted)">Tid:</span> <strong>' + extractedTime + '</strong></div>' : '') +
    (flags.length > 0 ? '<div><span style="color:var(--muted)">Flags:</span> <strong style="color:#8B0000">' + flags.join(', ') + '</strong></div>' : '') +
    '</div></div>';
}

// ============================================
// SEND TEST SMS via Edge Function (end-to-end)
// ============================================

async function sendTestSms() {
  const phoneInput = document.getElementById('sms-test-phone');
  const messageInput = document.getElementById('sms-test-message');
  const statusEl = document.getElementById('sms-test-status');

  const phone = (phoneInput?.value || '').trim();
  const message = (messageInput?.value || '').trim();

  if (!phone) {
    toast('Indtast et telefonnummer', 'warning');
    phoneInput?.focus();
    return;
  }
  if (!message) {
    toast('Indtast en besked', 'warning');
    messageInput?.focus();
    return;
  }

  // Show sending status
  if (statusEl) {
    statusEl.style.display = 'inline';
    statusEl.style.color = 'var(--warning, #f59e0b)';
    statusEl.textContent = '⏳ Sender...';
  }

  const supabaseUrl = typeof CONFIG !== 'undefined' ? CONFIG.SUPABASE_URL : '';
  const anonKey = typeof CONFIG !== 'undefined' ? CONFIG.SUPABASE_ANON_KEY : '';

  if (!supabaseUrl || !anonKey) {
    toast('Supabase konfiguration mangler', 'error');
    if (statusEl) { statusEl.style.color = 'var(--danger)'; statusEl.textContent = '❌ Konfigurationsfejl'; }
    return;
  }

  // Get auth token
  let authToken = anonKey;
  const client = window.supabaseClient || window.supabase;
  if (client) {
    try {
      const { data: { session } } = await client.auth.getSession();
      if (session?.access_token) authToken = session.access_token;
    } catch (e) {}
  }

  // Get sender from config
  const sender = localStorage.getItem('restaurant_phone') || localStorage.getItem('haandvaerker_phone') || undefined;

  try {
    const response = await fetch(supabaseUrl + '/functions/v1/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + authToken,
        'apikey': anonKey
      },
      body: JSON.stringify({
        to: phone,
        message: message,
        sender: sender
      })
    });

    const result = await response.json();

    if (result.success) {
      toast('SMS sendt! (ID: ' + (result.sid || 'OK') + ')', 'success');
      if (statusEl) {
        statusEl.style.color = 'var(--success, #22c55e)';
        statusEl.textContent = '✅ Sendt! ID: ' + (result.sid || 'OK');
      }

      // Log to sms_send_log via Supabase if available
      if (client) {
        try {
          const { data: { user } } = await client.auth.getUser();
          if (user) {
            await client.from('sms_send_log').insert({
              user_id: user.id,
              phone_to: phone,
              message_text: message,
              sender: sender || 'default',
              status: 'sent',
              provider_message_id: result.sid || null,
              provider: 'inmobile'
            });
          }
        } catch (e) {
          console.warn('Could not log SMS send:', e.message);
        }
      }

      // Log to agent activity
      var activity = JSON.parse(localStorage.getItem('flow_agent_activity') || '[]');
      activity.push({
        timestamp: new Date().toISOString(),
        event: 'sms_test_sent',
        message: 'Test SMS sendt til ' + phone,
        severity: 'info'
      });
      localStorage.setItem('flow_agent_activity', JSON.stringify(activity.slice(-50)));
    } else {
      const errorMsg = result.error || 'Ukendt fejl';
      toast('SMS fejlede: ' + errorMsg, 'error');
      if (statusEl) {
        statusEl.style.color = 'var(--danger)';
        statusEl.textContent = '❌ ' + errorMsg;
      }

      // Log failed attempt
      if (client) {
        try {
          const { data: { user } } = await client.auth.getUser();
          if (user) {
            await client.from('sms_send_log').insert({
              user_id: user.id,
              phone_to: phone,
              message_text: message,
              sender: sender || 'default',
              status: 'failed',
              error_message: errorMsg,
              provider: 'inmobile'
            });
          }
        } catch (e) {}
      }
    }
  } catch (err) {
    toast('Netværksfejl: ' + err.message, 'error');
    if (statusEl) {
      statusEl.style.color = 'var(--danger)';
      statusEl.textContent = '❌ Netværksfejl';
    }
  }
}

window.sendTestSms = sendTestSms;

window.loadAgenterPage = loadAgenterPage;
window.runAgentEndpointCheck = runAgentEndpointCheck;
window.testAgentSmsParser = testAgentSmsParser;
window.openAgentDetail = openAgentDetail;
window.closeAgentDetail = closeAgentDetail;

window.openAgentPage = openAgentPage;
window.openAgentConfigPanel = openAgentConfigPanel;
window.closeAgentConfigPanel = closeAgentConfigPanel;
window.saveAgentConfig = saveAgentConfig;
window.disconnectAgent = disconnectAgent;
window.initMetaOAuth = initMetaOAuth;
window.handleMetaOAuthCallback = handleMetaOAuthCallback;
window.showInstagramIntegrationModal = showInstagramIntegrationModal;
window.showFacebookIntegrationModal = showFacebookIntegrationModal;
window.showInstagramConfig = showInstagramConfig;
window.showFacebookConfig = showFacebookConfig;
window.editCustomerApiKey = editCustomerApiKey;
window.renderCustomerIntegrations = renderCustomerIntegrations;
window.openIntegrationConfig = openIntegrationConfig;
window.saveIntegrationConfig = saveIntegrationConfig;
window.disconnectIntegration = disconnectIntegration;
window.renderAgentStatistics = renderAgentStatistics;
window.renderAgentStatusDashboard = renderAgentStatusDashboard;
window.switchVaerktoejTab = switchVaerktoejTab;
window.openPrinterIntegration = openPrinterIntegration;
window.testPrinterIntegration = testPrinterIntegration;
window.savePrinterIntegration = savePrinterIntegration;
window.initDevicesTab = initDevicesTab;
window.checkAgentUpdate = checkAgentUpdate;
window.updateAgent = updateAgent;
window.showAgentChangelogModal = showAgentChangelogModal;
window.getAgentInstalledVersion = getAgentInstalledVersion;
window.getAgentLatestVersion = getAgentLatestVersion;
window.agentHasUpdate = agentHasUpdate;
window.saveQRToHistory = saveQRToHistory;
window.loadQRHistory = loadQRHistory;
window.removeQRHistoryItem = removeQRHistoryItem;

// Unsaved changes warning removed - feature disabled

// ============================================
// Helper: Find API key from Settings or Opret API Nøgle
function getApiKeyFromAnySource(keyName, searchTerms) {
  var directKey = localStorage.getItem(keyName);
  if (directKey) return directKey;
  var keys = JSON.parse(localStorage.getItem('flow_api_keys') || '[]');
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (!k.fullKey || k.active === false) continue;
    var haystack = ((k.name || '') + ' ' + (k.service || '')).toLowerCase();
    for (var j = 0; j < searchTerms.length; j++) {
      if (haystack.indexOf(searchTerms[j].toLowerCase()) !== -1) return k.fullKey;
    }
  }
  return null;
}

// AI MEDIER - Image & Video Generation
// ============================================

function switchAiMediaTab(tab) {
  document.getElementById('aimedia-tab-images')?.classList.toggle('active', tab === 'images');
  document.getElementById('aimedia-tab-video')?.classList.toggle('active', tab === 'video');
  var imgTab = document.getElementById('aimedia-content-images');
  var vidTab = document.getElementById('aimedia-content-video');
  if (imgTab) imgTab.style.display = tab === 'images' ? 'block' : 'none';
  if (vidTab) vidTab.style.display = tab === 'video' ? 'block' : 'none';
  // Update active tab styling
  var tabs = document.querySelectorAll('#page-ai-medier .tab-btn');
  tabs.forEach(function(btn) {
    btn.style.borderBottomColor = btn.classList.contains('active') ? 'var(--accent)' : 'transparent';
    btn.style.color = btn.classList.contains('active') ? 'var(--text)' : 'var(--muted)';
  });
}

var AI_IMAGE_PRESETS = {
  hero: 'A stunning hero image for a restaurant technology platform. Modern, professional, warm lighting. Clean, high-end aesthetic.',
  food: 'Beautiful food photography. Gourmet dish on a white plate, professional studio lighting, shallow depth of field.',
  restaurant: 'Interior of a modern Scandinavian restaurant. Natural materials, warm atmosphere. Evening lighting with candles.',
  abstract: 'Abstract geometric background with soft gradients. Blue and purple tones. Modern, tech-inspired.'
};

function setAiImagePreset(key) {
  var textarea = document.getElementById('ai-image-prompt');
  if (textarea && AI_IMAGE_PRESETS[key]) {
    textarea.value = AI_IMAGE_PRESETS[key];
  }
}

async function generateAiImage() {
  var prompt = document.getElementById('ai-image-prompt')?.value.trim();
  if (!prompt) { toast('Indtast en beskrivelse af billedet', 'warning'); return; }

  var apiKey = getApiKeyFromAnySource('openrouter_key', ['openrouter', 'nano banana', 'billedgenerering', 'image']);
  if (!apiKey) { toast('Tilføj en OpenRouter API nøgle under Integrationer eller Indstillinger > API', 'warning'); return; }

  var style = document.getElementById('ai-image-style')?.value || 'photorealistic';
  var btn = document.getElementById('ai-image-generate-btn');
  var resultDiv = document.getElementById('ai-image-result');
  var resultContent = document.getElementById('ai-image-result-content');

  btn.disabled = true;
  btn.textContent = 'Genererer...';
  resultDiv.style.display = 'block';
  resultContent.innerHTML = '<div style="display:flex;align-items:center;gap:8px;color:var(--muted)"><div class="loading-spinner" style="width:20px;height:20px"><div class="spinner"></div></div> Genererer billede med AI...</div>';

  var fullPrompt = 'Generate an image: ' + prompt + '. Style: ' + style + '. Output only the image, no text response.';

  try {
    var response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'FLOW App'
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-image-preview',
        messages: [{ role: 'user', content: fullPrompt }]
      })
    });

    if (!response.ok) {
      var errData = await response.json().catch(function() { return {}; });
      throw new Error(errData.error?.message || 'HTTP ' + response.status);
    }

    var data = await response.json();
    if (data.error) throw new Error(data.error.message || 'API fejl');

    var content = data.choices?.[0]?.message?.content;
    var imageFound = false;

    // Check for multimodal response parts (array of content parts)
    if (Array.isArray(content)) {
      for (var i = 0; i < content.length; i++) {
        if (content[i].type === 'image_url' && content[i].image_url?.url) {
          showAiImageResult(content[i].image_url.url, prompt);
          imageFound = true;
          break;
        }
        // Also check for inline_data format
        if (content[i].type === 'image' && content[i].source?.data) {
          var mimeType = content[i].source?.media_type || 'image/png';
          showAiImageResult('data:' + mimeType + ';base64,' + content[i].source.data, prompt);
          imageFound = true;
          break;
        }
      }
    }

    // Fallback: check if content is a string with base64 data
    if (!imageFound && typeof content === 'string') {
      var base64Match = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+\/=]+/);
      if (base64Match) {
        showAiImageResult(base64Match[0], prompt);
        imageFound = true;
      }
    }

    if (!imageFound) {
      resultContent.innerHTML = '<div style="color:var(--danger);padding:var(--space-3);background:rgba(239,68,68,0.1);border-radius:var(--radius-sm)">Kunne ikke generere billede. API svar: ' + (typeof content === 'string' ? content.substring(0, 200) : 'Ukendt format') + '</div>';
    }
  } catch (err) {
    // SECURITY FIX v4.12.0: Escape error message to prevent XSS
    resultContent.innerHTML = '<div style="color:var(--danger);padding:var(--space-3);background:rgba(239,68,68,0.1);border-radius:var(--radius-sm)">Fejl: ' + escapeHtml(err.message) + '</div>';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Generer Billede';
  }
}

function showAiImageResult(imgSrc, prompt) {
  var resultContent = document.getElementById('ai-image-result-content');
  var safePrompt = prompt.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  resultContent.innerHTML = '<img src="' + imgSrc + '" alt="Genereret billede" style="max-width:100%;border-radius:var(--radius-md);margin-bottom:var(--space-3)">' +
    '<div style="display:flex;justify-content:space-between;align-items:center">' +
    '<span style="color:var(--muted);font-size:var(--font-size-sm)">' + safePrompt.substring(0, 80) + '</span>' +
    '<button class="btn btn-secondary" style="font-size:12px;padding:6px 12px" onclick="downloadAiImage()">Download</button>' +
    '</div>';

  addToAiImageGallery(imgSrc, prompt);
  saveAiMediaHistory('image', { src: imgSrc, prompt: prompt, date: new Date().toISOString() });
}

function downloadAiImage() {
  var img = document.querySelector('#ai-image-result-content img');
  if (!img) return;
  var link = document.createElement('a');
  link.href = img.src;
  link.download = 'flow-ai-image-' + Date.now() + '.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function addToAiImageGallery(src, prompt) {
  var gallery = document.getElementById('ai-image-gallery');
  var emptyMsg = document.getElementById('ai-image-gallery-empty');
  if (!gallery) return;
  if (emptyMsg) emptyMsg.style.display = 'none';

  var safePrompt = prompt.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  var item = document.createElement('div');
  item.style.cssText = 'background:var(--card);border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden';
  item.innerHTML = '<img src="' + src + '" style="width:100%;display:block" alt="AI billede">' +
    '<div style="padding:8px 12px;display:flex;justify-content:space-between;align-items:center">' +
    '<span style="font-size:12px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:70%">' + safePrompt.substring(0, 40) + '</span>' +
    '</div>';
  gallery.insertBefore(item, gallery.firstChild);
}

// --- Video Generation (MiniMax Video-01) ---

async function generateAiVideo() {
  var prompt = document.getElementById('ai-video-prompt')?.value.trim();
  if (!prompt) { toast('Indtast en beskrivelse af videoen', 'warning'); return; }

  var apiKey = getApiKeyFromAnySource('minimax_key', ['minimax', 'video', 'videogenerering']);
  if (!apiKey) { toast('Tilføj en MiniMax API nøgle under Integrationer eller Indstillinger > API', 'warning'); return; }

  var btn = document.getElementById('ai-video-generate-btn');
  var progressDiv = document.getElementById('ai-video-progress');
  var progressText = document.getElementById('ai-video-progress-text');
  var progressBar = document.getElementById('ai-video-progress-bar');
  var resultDiv = document.getElementById('ai-video-result');

  btn.disabled = true;
  btn.textContent = 'Sender...';
  progressDiv.style.display = 'block';
  resultDiv.style.display = 'none';
  progressBar.style.width = '10%';
  progressText.textContent = 'Sender anmodning til MiniMax...';

  var requestBody = { model: 'video-01', prompt: prompt };

  // Check for reference image (image-to-video)
  var fileInput = document.getElementById('ai-video-ref-image');
  if (fileInput?.files?.length > 0) {
    try {
      var base64 = await fileToBase64(fileInput.files[0]);
      requestBody.first_frame_image = base64;
    } catch (e) {
      console.warn('Could not read reference image:', e);
    }
  }

  try {
    // Step 1: Submit generation task
    var submitResponse = await fetch('https://api.minimax.chat/v1/video_generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify(requestBody)
    });

    var submitData = await submitResponse.json();
    if (submitData.base_resp?.status_code !== 0) {
      throw new Error(submitData.base_resp?.status_msg || 'Fejl ved afsendelse');
    }

    var taskId = submitData.task_id;
    progressBar.style.width = '25%';
    progressText.textContent = 'Video genereres...';

    // Step 2: Poll for completion
    var fileId = await pollMiniMaxTask(apiKey, taskId, progressText, progressBar);

    // Step 3: Get download URL
    progressBar.style.width = '90%';
    progressText.textContent = 'Henter video...';

    var downloadResponse = await fetch('https://api.minimax.chat/v1/files/retrieve?file_id=' + fileId, {
      headers: { 'Authorization': 'Bearer ' + apiKey }
    });
    var downloadData = await downloadResponse.json();
    var videoUrl = downloadData.file?.download_url;

    if (!videoUrl) throw new Error('Kunne ikke hente video URL');

    progressBar.style.width = '100%';
    progressDiv.style.display = 'none';
    resultDiv.style.display = 'block';

    var safePrompt = prompt.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    var resultContent = document.getElementById('ai-video-result-content');
    resultContent.innerHTML = '<video controls style="width:100%;border-radius:var(--radius-md);max-height:480px"><source src="' + videoUrl + '" type="video/mp4"></video>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:var(--space-3)">' +
      '<span style="color:var(--muted);font-size:var(--font-size-sm)">' + safePrompt.substring(0, 80) + '</span>' +
      '<a href="' + videoUrl + '" download="flow-ai-video-' + Date.now() + '.mp4" class="btn btn-secondary" style="font-size:12px;padding:6px 12px;text-decoration:none">Download</a>' +
      '</div>';

    addToAiVideoGallery(videoUrl, prompt);
    saveAiMediaHistory('video', { url: videoUrl, prompt: prompt, date: new Date().toISOString() });
    toast('Video genereret!', 'success');

  } catch (err) {
    progressDiv.style.display = 'none';
    resultDiv.style.display = 'block';
    document.getElementById('ai-video-result-content').innerHTML =
      '<div style="color:var(--danger);padding:var(--space-3);background:rgba(239,68,68,0.1);border-radius:var(--radius-sm)">Fejl: ' + err.message + '</div>';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Generer Video';
  }
}

async function pollMiniMaxTask(apiKey, taskId, progressText, progressBar) {
  var maxAttempts = 60;
  for (var attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(function(resolve) { setTimeout(resolve, 5000); });

    var resp = await fetch('https://api.minimax.chat/v1/query/video_generation?task_id=' + taskId, {
      headers: { 'Authorization': 'Bearer ' + apiKey }
    });
    var data = await resp.json();
    var status = data.status;

    var progress = Math.min(25 + (attempt / maxAttempts) * 60, 85);
    progressBar.style.width = progress + '%';
    progressText.textContent = 'Video genereres... (' + (status || 'venter') + ')';

    if (status === 'Success') {
      return data.file_id;
    } else if (status === 'Fail') {
      throw new Error('Video generering fejlede: ' + (data.base_resp?.status_msg || 'Ukendt fejl'));
    }
  }
  throw new Error('Timeout: Video generering tog for lang tid');
}

function fileToBase64(file) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function() { resolve(reader.result); };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function addToAiVideoGallery(url, prompt) {
  var gallery = document.getElementById('ai-video-gallery');
  var emptyMsg = document.getElementById('ai-video-gallery-empty');
  if (!gallery) return;
  if (emptyMsg) emptyMsg.style.display = 'none';

  var safePrompt = prompt.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  var item = document.createElement('div');
  item.style.cssText = 'background:var(--card);border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden';
  item.innerHTML = '<video controls style="width:100%;display:block;max-height:240px"><source src="' + url + '" type="video/mp4"></video>' +
    '<div style="padding:8px 12px;display:flex;justify-content:space-between;align-items:center">' +
    '<span style="font-size:12px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:60%">' + safePrompt.substring(0, 40) + '</span>' +
    '<a href="' + url + '" download class="btn btn-secondary" style="font-size:11px;padding:4px 8px;text-decoration:none">Download</a>' +
    '</div>';
  gallery.insertBefore(item, gallery.firstChild);
}

// --- AI Media History ---

function saveAiMediaHistory(type, entry) {
  var key = 'flow_ai_media_' + type + '_history';
  var history = JSON.parse(localStorage.getItem(key) || '[]');
  history.unshift(entry);
  if (history.length > 50) history = history.slice(0, 50);
  localStorage.setItem(key, JSON.stringify(history));
}

function loadAiMediaHistory() {
  var imageHistory = JSON.parse(localStorage.getItem('flow_ai_media_image_history') || '[]');
  var imageGallery = document.getElementById('ai-image-gallery');
  var imageEmpty = document.getElementById('ai-image-gallery-empty');
  if (imageGallery) imageGallery.innerHTML = '';
  if (imageHistory.length > 0 && imageGallery) {
    if (imageEmpty) imageEmpty.style.display = 'none';
    imageHistory.forEach(function(item) {
      addToAiImageGallery(item.src, item.prompt);
    });
  } else if (imageEmpty) {
    imageEmpty.style.display = 'block';
  }

  var videoHistory = JSON.parse(localStorage.getItem('flow_ai_media_video_history') || '[]');
  var videoGallery = document.getElementById('ai-video-gallery');
  var videoEmpty = document.getElementById('ai-video-gallery-empty');
  if (videoGallery) videoGallery.innerHTML = '';
  if (videoHistory.length > 0 && videoGallery) {
    if (videoEmpty) videoEmpty.style.display = 'none';
    videoHistory.forEach(function(item) {
      addToAiVideoGallery(item.url, item.prompt);
    });
  } else if (videoEmpty) {
    videoEmpty.style.display = 'block';
  }

  // Set initial active tab styling
  setTimeout(function() { switchAiMediaTab('images'); }, 50);
}

// Expose AI Medier functions to global scope
window.switchAiMediaTab = switchAiMediaTab;
window.setAiImagePreset = setAiImagePreset;
window.generateAiImage = generateAiImage;
window.downloadAiImage = downloadAiImage;
window.generateAiVideo = generateAiVideo;
window.loadAiMediaHistory = loadAiMediaHistory;

// Expose mobile menu functions globally (for onclick handlers in HTML)
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;

// =====================================================
// PULL-TO-REFRESH - Mobile App Behavior
// =====================================================
(function initPullToRefresh() {
  if (window.innerWidth > 640) return; // Only on mobile
  
  let startY = 0;
  let currentY = 0;
  let isDragging = false;
  let refreshThreshold = 80;
  
  const mainContent = document.querySelector('.main-content-wrapper') || document.querySelector('.main');
  if (!mainContent) return;
  
  // Create refresh indicator
  const refreshIndicator = document.createElement('div');
  refreshIndicator.id = 'pull-refresh-indicator';
  refreshIndicator.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg><span>Træk for at opdatere</span>';
  refreshIndicator.style.cssText = 'position:fixed;top:-100px;left:0;right:0;height:60px;display:flex;align-items:center;justify-content:center;gap:8px;background:var(--bg);color:var(--text);font-size:14px;z-index:9999;transition:top 0.3s ease;';
  refreshIndicator.querySelector('svg').style.cssText = 'width:20px;height:20px;animation:spin 1s linear infinite paused;';
  document.body.appendChild(refreshIndicator);
  
  mainContent.addEventListener('touchstart', function(e) {
    if (mainContent.scrollTop === 0) {
      startY = e.touches[0].pageY;
      isDragging = true;
    }
  }, { passive: true });
  
  mainContent.addEventListener('touchmove', function(e) {
    if (!isDragging) return;
    currentY = e.touches[0].pageY;
    const diff = currentY - startY;
    
    if (diff > 0 && diff < 150) {
      refreshIndicator.style.top = (diff - 100) + 'px';
      if (diff > refreshThreshold) {
        refreshIndicator.querySelector('span').textContent = 'Slip for at opdatere';
      } else {
        refreshIndicator.querySelector('span').textContent = 'Træk for at opdatere';
      }
    }
  }, { passive: true });
  
  mainContent.addEventListener('touchend', function(e) {
    if (!isDragging) return;
    const diff = currentY - startY;
    
    if (diff > refreshThreshold) {
      refreshIndicator.style.top = '0px';
      refreshIndicator.querySelector('span').textContent = 'Opdaterer...';
      refreshIndicator.querySelector('svg').style.animationPlayState = 'running';
      
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else {
      refreshIndicator.style.top = '-100px';
    }
    
    isDragging = false;
    startY = 0;
    currentY = 0;
  }, { passive: true });
})();

// Add spin animation for refresh icon
const style = document.createElement('style');
style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
document.head.appendChild(style);
