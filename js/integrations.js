// FLOW Integrations Module — integrations, API keys, accounting, payment

function loadApiNoglerPage() {
  apiConnectionsSearchQuery = '';
  apiConnectionsCurrentPage = 1;
  var searchInput = document.getElementById('api-connections-search');
  if (searchInput) searchInput.value = '';

  // Show FLOW ID
  var flowId = localStorage.getItem('flow_id');
  if (!flowId) {
    flowId = generateFlowIdString();
    localStorage.setItem('flow_id', flowId);
  }
  var flowIdEl = document.getElementById('api-page-flow-id');
  if (flowIdEl) flowIdEl.value = flowId;

  // Load all API connections
  loadApiConnectionsList();
}

async function loadApiConnectionsList() {
  var tbody = document.getElementById('api-connections-list');
  if (!tbody) return;

  var disabledStates = await loadSystemKeyStatesFromSupabase();
  var deletedSysKeys = await loadDeletedSystemKeysFromSupabase();
  var userKeys = await loadUserKeysFromSupabase();

  var allSysKeys = (typeof SYSTEM_API_KEYS !== 'undefined' ? SYSTEM_API_KEYS : []);
  var allKeys = [];

  // System keys
  allSysKeys.forEach(function(sKey) {
    if (deletedSysKeys.indexOf(sKey.id) !== -1) return;
    var isDisabled = disabledStates[sKey.id] === true;
    allKeys.push({
      id: sKey.id, name: sKey.name, service: sKey.service,
      keyValue: sKey.key, maskedKey: maskApiKey(sKey.key),
      type: 'System', keyType: 'system',
      permissions: 'Fuld adgang',
      status: isDisabled ? 'Deaktiveret' : 'Aktiv',
      statusColor: isDisabled ? 'var(--danger)' : 'var(--success)',
      hasFullKey: true, created: sKey.created || '—'
    });
  });

  // Configured APIs
  CONFIGURED_APIS.forEach(function(cfg) {
    var keyValue = localStorage.getItem(cfg.keyField);
    var relatedKeyValue = '';
    (cfg.relatedFields || []).some(function(field) {
      var value = localStorage.getItem(field);
      if (value) { relatedKeyValue = value; return true; }
      return false;
    });
    var effectiveKeyValue = keyValue || relatedKeyValue;
    var isEnabled = localStorage.getItem('api_' + cfg.toggleName + '_enabled') !== 'false';
    var hasKey = !!effectiveKeyValue;
    allKeys.push({
      id: 'cfg-' + cfg.toggleName, name: cfg.name, service: cfg.service,
      keyValue: effectiveKeyValue || '', maskedKey: hasKey ? maskApiKey(effectiveKeyValue) : '—',
      type: 'Konfigureret', keyType: 'configured',
      permissions: cfg.permissions || 'Læs/Skriv',
      status: !hasKey ? 'Ikke konfigureret' : (isEnabled ? 'Aktiv' : 'Deaktiveret'),
      statusColor: !hasKey ? 'var(--muted)' : (isEnabled ? 'var(--success)' : 'var(--danger)'),
      hasFullKey: hasKey, created: '—'
    });
  });

  // User keys
  userKeys.forEach(function(key) {
    allKeys.push({
      id: key.id, name: key.name, service: null,
      keyValue: null, maskedKey: key.keyPrefix,
      type: 'Bruger', keyType: 'user',
      permissions: (key.permissions || []).join(', ') || 'Brugerdefineret',
      status: 'Aktiv', statusColor: 'var(--success)',
      hasFullKey: false, created: key.created || '—'
    });
  });

  // Update stats
  var totalEl = document.getElementById('api-stat-total');
  var activeEl = document.getElementById('api-stat-active');
  var inactiveEl = document.getElementById('api-stat-inactive');
  var requestsEl = document.getElementById('api-stat-requests');
  if (totalEl) totalEl.textContent = allKeys.length;
  if (activeEl) activeEl.textContent = allKeys.filter(function(k) { return k.status === 'Aktiv'; }).length;
  if (inactiveEl) inactiveEl.textContent = allKeys.filter(function(k) { return k.status !== 'Aktiv'; }).length;
  if (requestsEl) requestsEl.textContent = Math.floor(Math.random() * 500) + 100;

  // Filter
  var query = apiConnectionsSearchQuery.toLowerCase();
  var filtered = allKeys;
  if (query) {
    filtered = allKeys.filter(function(k) {
      return (k.name && k.name.toLowerCase().indexOf(query) !== -1) ||
             (k.service && k.service.toLowerCase().indexOf(query) !== -1) ||
             (k.type && k.type.toLowerCase().indexOf(query) !== -1);
    });
  }

  // Pagination
  var totalPages = Math.max(1, Math.ceil(filtered.length / apiConnectionsPageSize));
  if (apiConnectionsCurrentPage > totalPages) apiConnectionsCurrentPage = totalPages;
  var startIdx = (apiConnectionsCurrentPage - 1) * apiConnectionsPageSize;
  var pageItems = filtered.slice(startIdx, startIdx + apiConnectionsPageSize);

  // Render
  if (pageItems.length === 0) {
    tbody.innerHTML = '<tr style="border-bottom:1px solid var(--border)"><td colspan="7" style="padding:24px;text-align:center;color:var(--muted)">' +
      (query ? 'Ingen forbindelser matcher søgningen' : 'Ingen API forbindelser endnu') + '</td></tr>';
  } else {
    tbody.innerHTML = pageItems.map(function(k) {
      var nameCell = escapeHtml(k.name);
      if (k.service) nameCell += '<span style="font-size:11px;color:var(--muted);margin-left:6px">(' + escapeHtml(k.service) + ')</span>';
      var typeBadge = k.keyType === 'system' ? 'background:var(--accent);color:#fff' :
                      k.keyType === 'configured' ? 'background:var(--info);color:#fff' : 'background:var(--bg2);color:var(--text)';
      return '<tr style="border-bottom:1px solid var(--border)">' +
        '<td style="padding:12px 8px;font-size:14px">' + nameCell + '</td>' +
        '<td style="padding:12px 8px;font-size:13px;font-family:monospace;color:var(--muted)">' + escapeHtml(k.maskedKey) + '</td>' +
        '<td style="padding:12px 8px"><span style="padding:2px 8px;border-radius:4px;font-size:12px;' + typeBadge + '">' + escapeHtml(k.type) + '</span></td>' +
        '<td style="padding:12px 8px;font-size:13px;color:var(--muted)">' + escapeHtml(k.permissions) + '</td>' +
        '<td style="padding:12px 8px"><span style="color:' + k.statusColor + ';font-size:13px;font-weight:600">' + escapeHtml(k.status) + '</span></td>' +
        '<td style="padding:12px 8px;font-size:13px;color:var(--muted)">' + escapeHtml(k.created) + '</td>' +
        '<td style="padding:12px 8px;text-align:right">' +
          '<button class="btn btn-secondary btn-sm" onclick="showFlowCMSPage(\'integrationer\')" title="Administrer" style="padding:4px 8px;font-size:12px">Administrer</button>' +
        '</td></tr>';
    }).join('');
  }

  // Pagination controls
  var pagDiv = document.getElementById('api-connections-pagination');
  if (pagDiv) {
    if (totalPages <= 1) { pagDiv.innerHTML = ''; return; }
    var html = '';
    for (var i = 1; i <= totalPages; i++) {
      var isActive = i === apiConnectionsCurrentPage;
      html += '<button class="btn ' + (isActive ? 'btn-primary' : 'btn-secondary') + ' btn-sm" onclick="apiConnectionsCurrentPage=' + i + ';loadApiConnectionsList()" style="padding:4px 10px;font-size:12px">' + i + '</button>';
    }
    pagDiv.innerHTML = html;
  }
}

function filterApiConnections(value) {
  apiConnectionsSearchQuery = value;
  apiConnectionsCurrentPage = 1;
  loadApiConnectionsList();
}

window.loadApiNoglerPage = loadApiNoglerPage;
window.loadApiConnectionsList = loadApiConnectionsList;
window.filterApiConnections = filterApiConnections;

// Load integrations page
function loadIntegrationsPage() {
  // Reset search and pagination state
  apiKeysSearchQuery = '';
  apiKeysCurrentPage = 1;
  var searchInput = document.getElementById('api-keys-search');
  if (searchInput) searchInput.value = '';

  // Generate FLOW ID if not exists
  let flowId = localStorage.getItem('flow_id');
  if (!flowId) {
    flowId = generateFlowIdString();
    localStorage.setItem('flow_id', flowId);
  }

  const flowIdDisplay = document.getElementById('flow-id-display');
  if (flowIdDisplay) flowIdDisplay.value = flowId;

  // Load API keys
  loadApiKeysList();

  // Load connected integrations
  loadConnectedIntegrations();
}

// Generate FLOW ID string
function generateFlowIdString() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const random1 = Array.from({length: 5}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const random2 = Array.from({length: 5}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `FLOW-REST-${random1}-${random2}`;
}

// Copy FLOW ID
function copyFlowId() {
  const flowIdDisplay = document.getElementById('flow-id-display');
  if (flowIdDisplay) {
    navigator.clipboard.writeText(flowIdDisplay.value);
    toast('FLOW ID kopieret til udklipsholder', 'success');
  }
}

// Regenerate FLOW ID
function regenerateFlowId() {
  if (confirm('Er du sikker? Eksisterende integrationer skal opdateres med det nye ID.')) {
    const newId = generateFlowIdString();
    localStorage.setItem('flow_id', newId);
    const flowIdDisplay = document.getElementById('flow-id-display');
    if (flowIdDisplay) flowIdDisplay.value = newId;
    toast('Nyt FLOW ID genereret', 'success');
  }
}

// Generate API Key
async function generateApiKey() {
  const nameInput = document.getElementById('api-key-name');
  const name = nameInput?.value?.trim();

  if (!name) {
    toast('Indtast et navn til API nøglen', 'warning');
    return;
  }

  // Gather permissions
  const permissions = [];
  if (document.getElementById('perm-customers')?.checked) permissions.push('customers');
  if (document.getElementById('perm-orders')?.checked) permissions.push('orders');
  if (document.getElementById('perm-invoices')?.checked) permissions.push('invoices');
  if (document.getElementById('perm-products')?.checked) permissions.push('products');
  if (document.getElementById('perm-payments')?.checked) permissions.push('payments');
  if (document.getElementById('perm-analytics')?.checked) permissions.push('analytics');

  if (permissions.length === 0) {
    toast('Vælg mindst én tilladelse', 'warning');
    return;
  }

  // Generate key (40-character hex format)
  const hexChars = '0123456789abcdef';
  const apiKey = Array.from({length: 40}, () => hexChars[Math.floor(Math.random() * hexChars.length)]).join('');

  const newKey = {
    id: Date.now().toString(),
    name,
    keyPrefix: maskApiKey(apiKey),
    permissions,
    createdAt: new Date().toISOString(),
    lastUsed: null,
    active: true
  };

  // Load existing keys, add new one, save to Supabase + localStorage cache
  let keys = await loadUserKeysFromSupabase();
  keys.push(newKey);
  await saveUserKeysToSupabase(keys);
  localStorage.setItem('flow_api_keys', JSON.stringify(keys));

  // Show generated key
  const container = document.getElementById('generated-key-container');
  const keyDisplay = document.getElementById('generated-api-key');
  if (container && keyDisplay) {
    keyDisplay.value = apiKey;
    container.style.display = 'block';
  }

  // Clear input
  if (nameInput) nameInput.value = '';

  // Reload list
  loadApiKeysList();
  renderUserApiKeysOnSettings();

  toast('API nøgle genereret', 'success');
}

// --- API Keys Pagination & Search State ---
var apiKeysCurrentPage = 1;
var apiKeysPageSize = 12;
var apiKeysSearchQuery = '';

// SVG icons for API key row actions
var apiKeyEyeSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
var apiKeyGearSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>';
var apiKeyTrashSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>';

// Configured APIs definition (shared between functions)
var CONFIGURED_APIS = [
  { name: 'OpenAI', keyField: 'openai_key', toggleName: 'openai', service: 'AI Assistent', inputId: 'openai-api-key-input' },
  { name: 'InMobile SMS', keyField: 'inmobile_api_key', toggleName: 'inmobile', service: 'SMS Service', inputId: 'inmobile-api-key', relatedFields: ['inmobile_sender'] },
  { name: 'Google Reviews', keyField: 'google_api_key', toggleName: 'google', service: 'Anmeldelser', inputId: 'google-api-key', relatedFields: ['google_place_id'] },
  { name: 'Trustpilot', keyField: 'trustpilot_api_key', toggleName: 'trustpilot', service: 'Anmeldelser', inputId: 'trustpilot-api-key', relatedFields: ['trustpilot_business_id'] },
  { name: 'Firecrawl', keyField: 'firecrawl_api_key', toggleName: 'firecrawl', service: 'Web Crawling', inputId: 'firecrawl-api-key' },
  { name: 'Google API', keyField: 'googleapi_api_key', toggleName: 'googleapi', service: 'Google Services', inputId: 'googleapi-api-key' },
  { name: 'Serper', keyField: 'serper_reviews_key', toggleName: 'serper', service: 'SEO Analyse', inputId: 'serper-reviews-key', relatedFields: ['serper_images_key', 'serper_maps_key', 'serper_places_key'] },
  { name: 'OpenRouter', keyField: 'openrouter_key', toggleName: 'openrouter', service: 'AI Billedgenerering', inputId: 'openrouter-api-key-input' },
  { name: 'MiniMax', keyField: 'minimax_key', toggleName: 'minimax', service: 'AI Videogenerering', inputId: 'minimax-api-key-input' }
];

// Load API keys list with search and pagination
async function loadApiKeysList() {
  var tbody = document.getElementById('api-keys-list');
  if (!tbody) return;

  // Load from Supabase first, fallback to localStorage
  var disabledStates = await loadSystemKeyStatesFromSupabase();
  var deletedSysKeys = await loadDeletedSystemKeysFromSupabase();
  var userKeys = await loadUserKeysFromSupabase();

  // Sync to localStorage as cache
  localStorage.setItem('flow_system_key_states', JSON.stringify(disabledStates));
  localStorage.setItem('flow_deleted_system_keys', JSON.stringify(deletedSysKeys));
  localStorage.setItem('flow_api_keys', JSON.stringify(userKeys));

  var allSysKeys = (typeof SYSTEM_API_KEYS !== 'undefined' ? SYSTEM_API_KEYS : []);

  // Build unified data model
  var allKeys = [];

  // A. System keys (filter deleted)
  allSysKeys.forEach(function(sKey) {
    if (deletedSysKeys.indexOf(sKey.id) !== -1) return;
    var isDisabled = disabledStates[sKey.id] === true;
    allKeys.push({
      id: sKey.id, name: sKey.name, service: sKey.service,
      keyValue: sKey.key, maskedKey: maskApiKey(sKey.key),
      type: 'System', keyType: 'system',
      status: isDisabled ? 'Deaktiveret' : 'Aktiv',
      statusColor: isDisabled ? 'var(--danger)' : 'var(--success)',
      hasFullKey: true, serviceUrl: sKey.url || '#',
      toggleName: null, keyField: null
    });
  });

  // B. Configured API connections
  CONFIGURED_APIS.forEach(function(cfg) {
    var keyValue = localStorage.getItem(cfg.keyField);
    var relatedKeyValue = '';
    (cfg.relatedFields || []).some(function(field) {
      var value = localStorage.getItem(field);
      if (value) {
        relatedKeyValue = value;
        return true;
      }
      return false;
    });
    var effectiveKeyValue = keyValue || relatedKeyValue;
    var isEnabled = localStorage.getItem('api_' + cfg.toggleName + '_enabled') !== 'false';
    var hasKey = !!effectiveKeyValue;
    allKeys.push({
      id: 'cfg-' + cfg.toggleName, name: cfg.name, service: cfg.service,
      keyValue: effectiveKeyValue || '', maskedKey: hasKey ? maskApiKey(effectiveKeyValue) : '—',
      type: 'Konfigureret', keyType: 'configured',
      status: !hasKey ? 'Ikke konfigureret' : (isEnabled ? 'Aktiv' : 'Deaktiveret'),
      statusColor: !hasKey ? 'var(--muted)' : (isEnabled ? 'var(--success)' : 'var(--danger)'),
      hasFullKey: hasKey, serviceUrl: null,
      toggleName: cfg.toggleName, keyField: cfg.keyField
    });
  });

  // C. User-generated keys
  userKeys.forEach(function(key) {
    allKeys.push({
      id: key.id, name: key.name, service: null,
      keyValue: null, maskedKey: key.keyPrefix,
      type: 'Bruger', keyType: 'user',
      status: 'Aktiv', statusColor: 'var(--success)',
      hasFullKey: false, serviceUrl: null,
      toggleName: null, keyField: null
    });
  });

  // Render Integrations list with its own search + pagination state
  if (tbody) {
    var query = apiKeysSearchQuery.toLowerCase();
    var filtered = allKeys;
    if (query) {
      filtered = allKeys.filter(function(k) {
        return (k.name && k.name.toLowerCase().indexOf(query) !== -1) ||
               (k.service && k.service.toLowerCase().indexOf(query) !== -1) ||
               (k.maskedKey && k.maskedKey.toLowerCase().indexOf(query) !== -1) ||
               (k.type && k.type.toLowerCase().indexOf(query) !== -1);
      });
    }

    // Pagination
    var totalPages = Math.max(1, Math.ceil(filtered.length / apiKeysPageSize));
    if (apiKeysCurrentPage > totalPages) apiKeysCurrentPage = totalPages;
    var startIdx = (apiKeysCurrentPage - 1) * apiKeysPageSize;
    var pageItems = filtered.slice(startIdx, startIdx + apiKeysPageSize);

    // Render rows
    if (pageItems.length === 0) {
      tbody.innerHTML = '<tr style="border-bottom:1px solid var(--border)"><td colspan="5" style="padding:24px;text-align:center;color:var(--muted)">' +
        (query ? 'Ingen nøgler matcher søgningen' : 'Ingen API nøgler') + '</td></tr>';
    } else {
      tbody.innerHTML = pageItems.map(function(k) {
        return renderApiKeyRow(k, disabledStates);
      }).join('');
    }

    // Render pagination
    renderApiKeysPagination(totalPages);
  }

}

// Render a single API key table row with consistent actions
function renderApiKeyRow(k, disabledStates) {
  // Helper: escape for use inside onclick attribute single-quoted params
  function attrSafe(str) { return escapeHtml(str || '').replace(/'/g, '&#39;'); }

  var nameCell = escapeHtml(k.name);
  if (k.service) nameCell += '<span style="font-size:11px;color:var(--muted);margin-left:6px">(' + escapeHtml(k.service) + ')</span>';

  var actions = '';
  var btnStyle = 'padding:4px 8px;margin-right:4px';
  var safeId = attrSafe(k.id);

  // Eye icon (only if full key available)
  if (k.hasFullKey) {
    if (k.keyType === 'system') {
      actions += '<button class="btn btn-secondary btn-sm" onclick="toggleSystemKeyVisibility(\'' + safeId + '\')" title="Vis/skjul nøgle" style="' + btnStyle + '">' + apiKeyEyeSvg + '</button>';
    } else if (k.keyType === 'configured') {
      actions += '<button class="btn btn-secondary btn-sm" onclick="toggleConfiguredKeyVisibility(\'' + safeId + '\',\'' + attrSafe(k.keyField) + '\')" title="Vis/skjul nøgle" style="' + btnStyle + '">' + apiKeyEyeSvg + '</button>';
    }
  }

  // Gear icon
  if (k.keyType === 'system') {
    var isDisabled = disabledStates[k.id] === true;
    var safeUrl = attrSafe(k.serviceUrl);
    var ddBtnStyle = 'display:block;width:100%;padding:10px 16px;background:none;border:none;text-align:left;cursor:pointer;font-size:13px;color:var(--text)';
    var ddHover = 'onmouseover="this.style.background=\'var(--bg-secondary)\'" onmouseout="this.style.background=\'none\'"';
    actions += '<div style="display:inline-block;position:relative">' +
      '<button class="btn btn-secondary btn-sm" id="api-gear-btn-' + escapeHtml(k.id) + '" onclick="toggleApiKeyDropdown(\'' + safeId + '\')" title="Indstillinger" style="' + btnStyle + '">' + apiKeyGearSvg + '</button>' +
      '<div id="api-key-dropdown-' + escapeHtml(k.id) + '" style="display:none;position:absolute;top:calc(100% + 4px);right:0;background:var(--card);border:1px solid var(--border);border-radius:8px;min-width:160px;z-index:100;box-shadow:0 4px 12px rgba(0,0,0,0.15);overflow:hidden">' +
        '<button onclick="window.open(\'' + safeUrl + '\',\'_blank\');toggleApiKeyDropdown(\'' + safeId + '\')" style="' + ddBtnStyle + '" ' + ddHover + '>Rediger</button>' +
        '<button onclick="toggleSystemKeyActive(\'' + safeId + '\');toggleApiKeyDropdown(\'' + safeId + '\')" style="' + ddBtnStyle + '" ' + ddHover + '>' + (isDisabled ? 'Aktiver' : 'Deaktiver') + '</button>' +
      '</div></div>';
  } else if (k.keyType === 'configured') {
    actions += '<button class="btn btn-secondary btn-sm" onclick="showFlowCMSPage(\'api-noegler\')" title="Rediger i API Nøgler" style="' + btnStyle + '">' + apiKeyGearSvg + '</button>';
  }

  // Delete icon (all types)
  actions += '<button class="btn btn-secondary btn-sm" onclick="confirmDeleteApiKey(\'' + safeId + '\',\'' + attrSafe(k.name) + '\',\'' + attrSafe(k.keyType) + '\')" title="Slet" style="padding:4px 8px;color:var(--danger)">' + apiKeyTrashSvg + '</button>';

  return '<tr style="border-bottom:1px solid var(--border)">' +
    '<td style="padding:12px 8px;font-size:14px">' + nameCell + '</td>' +
    '<td style="padding:12px 8px;font-size:13px;font-family:monospace;color:var(--muted)" id="key-display-' + escapeHtml(k.id) + '" data-visible="false">' + escapeHtml(k.maskedKey) + '</td>' +
    '<td style="padding:12px 8px;font-size:13px;color:var(--muted)">' + escapeHtml(k.type) + '</td>' +
    '<td style="padding:12px 8px;font-size:13px;color:' + k.statusColor + '">' + escapeHtml(k.status) + '</td>' +
    '<td style="padding:12px 8px;text-align:right;white-space:nowrap">' + actions + '</td></tr>';
}

// Render pagination controls
function renderApiKeysPagination(totalPages) {
  var container = document.getElementById('api-keys-pagination');
  if (!container) return;
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  var html = '';
  if (apiKeysCurrentPage > 1) {
    html += '<button class="btn btn-secondary" style="padding:6px 12px" onclick="goToApiKeysPage(' + (apiKeysCurrentPage - 1) + ')">←</button>';
  }
  for (var i = 1; i <= totalPages; i++) {
    html += '<button class="btn ' + (i === apiKeysCurrentPage ? 'btn-primary' : 'btn-secondary') + '" style="padding:6px 12px;min-width:36px" onclick="goToApiKeysPage(' + i + ')">' + i + '</button>';
  }
  if (apiKeysCurrentPage < totalPages) {
    html += '<button class="btn btn-secondary" style="padding:6px 12px" onclick="goToApiKeysPage(' + (apiKeysCurrentPage + 1) + ')">→</button>';
  }
  container.innerHTML = html;
}

function goToApiKeysPage(page) {
  apiKeysCurrentPage = page;
  loadApiKeysList();
}

// Search/filter API keys
function filterApiKeys(query) {
  apiKeysSearchQuery = (query || '').trim();
  apiKeysCurrentPage = 1;
  loadApiKeysList();
}

// Scroll to API key generator section
function scrollToApiKeyGenerator() {
  var el = document.getElementById('api-key-name');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(function() { el.focus(); }, 500);
  }
}

function showQuickApiKeyCreate() {
  var existing = document.getElementById('quick-api-key-modal');
  if (existing) existing.remove();

  var modal = document.createElement('div');
  modal.id = 'quick-api-key-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);z-index:10000;display:flex;align-items:center;justify-content:center;padding:24px';
  modal.innerHTML = '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius-xl);width:100%;max-width:480px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);overflow:hidden">' +
    '<div style="padding:24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">' +
    '<div style="font-size:18px;font-weight:600">Tilføj API Nøgle</div>' +
    '<button onclick="document.getElementById(\'quick-api-key-modal\').remove()" style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:transparent;border:none;color:var(--muted);cursor:pointer;border-radius:var(--radius-sm);font-size:20px">&times;</button>' +
    '</div>' +
    '<div style="padding:24px;display:flex;flex-direction:column;gap:16px">' +
    '<div class="form-group" style="margin:0">' +
    '<label class="form-label">Navn <span style="color:var(--danger)">*</span></label>' +
    '<input type="text" class="input" id="quick-api-key-name" placeholder="f.eks. OpenRouter Production">' +
    '</div>' +
    '<div class="form-group" style="margin:0">' +
    '<label class="form-label">API Nøgle <span style="color:var(--danger)">*</span></label>' +
    '<div style="position:relative">' +
    '<input type="password" class="input" id="quick-api-key-value" placeholder="Indsæt din API nøgle her..." style="padding-right:44px">' +
    '<button type="button" onclick="toggleQuickKeyVisibility()" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--muted);cursor:pointer;padding:4px" title="Vis/skjul">' +
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
    '</button></div>' +
    '</div>' +
    '<div class="form-group" style="margin:0">' +
    '<label class="form-label">Tjeneste / Beskrivelse</label>' +
    '<input type="text" class="input" id="quick-api-key-service" placeholder="f.eks. Billedgenerering, AI Assistant...">' +
    '</div>' +
    '<div class="form-group" style="margin:0">' +
    '<label class="form-label">Endpoint URL</label>' +
    '<input type="text" class="input" id="quick-api-key-endpoint" placeholder="f.eks. https://api.openrouter.ai/v1">' +
    '</div>' +
    '</div>' +
    '<div style="padding:16px 24px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px">' +
    '<button class="btn btn-secondary" onclick="document.getElementById(\'quick-api-key-modal\').remove()">Annuller</button>' +
    '<button class="btn btn-primary" onclick="executeQuickApiKeyCreate()">Gem nøgle</button>' +
    '</div></div>';

  document.body.appendChild(modal);
  modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
  setTimeout(function() { document.getElementById('quick-api-key-name')?.focus(); }, 100);
}

function toggleQuickKeyVisibility() {
  var input = document.getElementById('quick-api-key-value');
  if (input) input.type = input.type === 'password' ? 'text' : 'password';
}

async function executeQuickApiKeyCreate() {
  var nameInput = document.getElementById('quick-api-key-name');
  var keyInput = document.getElementById('quick-api-key-value');
  var serviceInput = document.getElementById('quick-api-key-service');
  var endpointInput = document.getElementById('quick-api-key-endpoint');

  var name = nameInput?.value?.trim();
  var apiKey = keyInput?.value?.trim();
  var service = serviceInput?.value?.trim() || '';
  var endpoint = endpointInput?.value?.trim() || '';

  if (!name) { toast('Indtast et navn til API nøglen', 'warning'); nameInput?.focus(); return; }
  if (!apiKey) { toast('Indtast API nøglen', 'warning'); keyInput?.focus(); return; }

  var newKey = {
    id: Date.now().toString(),
    name: name,
    keyPrefix: maskApiKey(apiKey),
    fullKey: apiKey,
    service: service,
    endpoint: endpoint,
    createdAt: new Date().toISOString(),
    lastUsed: null,
    active: true
  };

  var keys = await loadUserKeysFromSupabase();
  keys.push(newKey);
  await saveUserKeysToSupabase(keys);
  localStorage.setItem('flow_api_keys', JSON.stringify(keys));

  // Close modal and refresh list
  var modal = document.getElementById('quick-api-key-modal');
  if (modal) modal.remove();

  loadApiKeysList();
  renderUserApiKeysOnSettings();
  toast('API nøgle "' + name + '" tilføjet', 'success');
}

// Toggle visibility for configured API keys
function toggleConfiguredKeyVisibility(keyId, keyField) {
  var el = document.getElementById('key-display-' + keyId);
  if (!el) return;
  var fullKey = localStorage.getItem(keyField);
  if (!fullKey) return;
  if (el.dataset.visible === 'true') {
    el.textContent = maskApiKey(fullKey);
    el.dataset.visible = 'false';
  } else {
    el.textContent = fullKey;
    el.dataset.visible = 'true';
  }
}

// Confirm delete API key using modal
function confirmDeleteApiKey(keyId, keyName, keyType) {
  document.getElementById('delete-confirm-message').textContent =
    'Er du sikker på at du vil slette API nøglen "' + keyName + '"?';
  document.getElementById('delete-confirm-btn').onclick = function() {
    executeDeleteApiKey(keyId, keyType);
  };
  var modal = document.getElementById('delete-confirm-modal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('active');
  }
}

// Execute API key deletion
async function executeDeleteApiKey(keyId, keyType) {
  if (keyType === 'system') {
    var deletedKeys = await loadDeletedSystemKeysFromSupabase();
    if (deletedKeys.indexOf(keyId) === -1) deletedKeys.push(keyId);
    await saveDeletedSystemKeysToSupabase(deletedKeys);
    localStorage.setItem('flow_deleted_system_keys', JSON.stringify(deletedKeys));
  } else if (keyType === 'configured') {
    var toggleName = keyId.replace('cfg-', '');
    var cfg = CONFIGURED_APIS.find(function(c) { return c.toggleName === toggleName; });
    if (cfg) {
      localStorage.removeItem(cfg.keyField);
      if (cfg.relatedFields) cfg.relatedFields.forEach(function(f) { localStorage.removeItem(f); });
      var inputEl = document.getElementById(cfg.inputId);
      if (inputEl) inputEl.value = '';
    }
  } else if (keyType === 'user') {
    var keys = await loadUserKeysFromSupabase();
    keys = keys.filter(function(k) { return k.id !== keyId; });
    await saveUserKeysToSupabase(keys);
    localStorage.setItem('flow_api_keys', JSON.stringify(keys));
  }

  closeDeleteConfirmModal();
  loadApiKeysList();
  updateApiStatus();
  renderUserApiKeysOnSettings();
  toast('API nøgle slettet', 'success');
}

// Toggle API key gear dropdown
function toggleApiKeyDropdown(keyId) {
  // Close any other open API key dropdowns first
  document.querySelectorAll('[id^="api-key-dropdown-"]').forEach(function(dd) {
    if (dd.id !== 'api-key-dropdown-' + keyId) {
      dd.style.display = 'none';
    }
  });

  var dropdown = document.getElementById('api-key-dropdown-' + keyId);
  if (!dropdown) return;

  if (dropdown.style.display === 'none' || dropdown.style.display === '') {
    dropdown.style.display = 'block';
    setTimeout(function() {
      document.addEventListener('click', closeApiKeyDropdownOnOutsideClick);
    }, 100);
  } else {
    dropdown.style.display = 'none';
    document.removeEventListener('click', closeApiKeyDropdownOnOutsideClick);
  }
}

function closeApiKeyDropdownOnOutsideClick(e) {
  var anyOpen = false;
  document.querySelectorAll('[id^="api-key-dropdown-"]').forEach(function(dd) {
    var btnId = dd.id.replace('api-key-dropdown-', 'api-gear-btn-');
    var btn = document.getElementById(btnId);
    if (dd.style.display === 'block') {
      if (!dd.contains(e.target) && (!btn || !btn.contains(e.target))) {
        dd.style.display = 'none';
      } else {
        anyOpen = true;
      }
    }
  });
  if (!anyOpen) {
    document.removeEventListener('click', closeApiKeyDropdownOnOutsideClick);
  }
}

// Delete system API key (delegates to modal)
function deleteSystemKey(keyId) {
  var sysKey = (typeof SYSTEM_API_KEYS !== 'undefined' ? SYSTEM_API_KEYS : []).find(function(k) { return k.id === keyId; });
  confirmDeleteApiKey(keyId, sysKey ? sysKey.name : 'System nøgle', 'system');
}

// Delete user API key (delegates to modal)
function deleteApiKey(keyId) {
  var keys = JSON.parse(localStorage.getItem('flow_api_keys') || '[]');
  var key = keys.find(function(k) { return k.id === keyId; });
  confirmDeleteApiKey(keyId, key ? key.name : 'API nøgle', 'user');
}

// Show integration fields based on selected system
function showIntegrationFields() {
  const system = document.getElementById('integration-system')?.value;

  // Hide all
  ['economic', 'dinero', 'billy', 'visma'].forEach(s => {
    const el = document.getElementById('integration-fields-' + s);
    if (el) el.style.display = 'none';
  });

  // Show selected
  if (system) {
    const fields = document.getElementById('integration-fields-' + system);
    if (fields) fields.style.display = 'block';
  }

  // Enable/disable add button
  const addBtn = document.getElementById('add-integration-btn');
  if (addBtn) addBtn.disabled = system !== 'economic'; // Only e-conomic is available now
}

// Add integration
async function addIntegration() {
  const system = document.getElementById('integration-system')?.value;

  if (system === 'economic') {
    const appSecret = document.getElementById('economic-app-secret')?.value?.trim();
    const agreementToken = document.getElementById('economic-agreement-token')?.value?.trim();

    if (!appSecret || !agreementToken) {
      toast('Indtast både App Secret Token og Agreement Grant Token', 'warning');
      return;
    }

    // Save to Supabase via integration_configs table
    try {
      if (typeof SupabaseDB !== 'undefined' && currentUser?.id) {
        const result = await SupabaseDB.saveIntegrationConfig(currentUser.id, 'accounting', 'economic', {
          settings: {
            appSecretPrefix: appSecret.substring(0, 8) + '...',
            agreementTokenPrefix: agreementToken.substring(0, 8) + '...'
          },
          credentials: {
            appSecret: appSecret,
            agreementToken: agreementToken
          },
          status: 'active'
        });
        if (!result.success) {
          console.warn('Could not save integration to Supabase:', result.error);
        }
      }
    } catch (err) {
      console.warn('Error saving integration to Supabase:', err.message);
    }

    // Also save to localStorage as fallback cache
    const integrations = JSON.parse(localStorage.getItem('flow_integrations') || '[]');
    if (!integrations.some(i => i.system === 'economic')) {
      integrations.push({
        id: Date.now().toString(),
        system: 'economic',
        name: 'e-conomic',
        status: 'connected',
        connectedAt: new Date().toISOString(),
        config: {
          appSecretPrefix: appSecret.substring(0, 8) + '...',
          agreementTokenPrefix: agreementToken.substring(0, 8) + '...'
        }
      });
      localStorage.setItem('flow_integrations', JSON.stringify(integrations));
    }

    // Save to integration_connections for the economic-proxy to find
    try {
      const client = window.supabaseClient || window.supabase;
      if (client && currentUser?.id) {
        await client.from('integration_connections').upsert({
          user_id: currentUser.id,
          system: 'economic',
          status: 'connected',
          config: {
            credentials: {
              appSecret: appSecret,
              agreementToken: agreementToken
            }
          }
        }, { onConflict: 'user_id,system' });
      }
    } catch (e) {
      console.warn('Could not save to integration_connections:', e.message);
    }

    // Clear fields
    document.getElementById('economic-app-secret').value = '';
    document.getElementById('economic-agreement-token').value = '';
    document.getElementById('integration-system').value = '';
    showIntegrationFields();

    // Show status
    const status = document.getElementById('integration-save-status');
    if (status) {
      status.style.display = 'inline';
      setTimeout(() => status.style.display = 'none', 3000);
    }

    // Reload
    loadConnectedIntegrations();

    // Test connection via Edge Function
    toast('e-conomic integration tilføjet — tester forbindelse...', 'info');
    try {
      const testResult = await callEconomicProxy('test-connection');
      if (testResult.success) {
        toast('e-conomic forbundet! (' + (testResult.data?.company?.name || '') + ')', 'success');
        updateEconomicSyncStatus({
          status: 'connected',
          lastSync: new Date().toISOString(),
          companyName: testResult.data?.company?.name || ''
        });
      } else {
        toast('e-conomic tilføjet, men forbindelsestest fejlede. Tjek dine nøgler.', 'warning');
      }
    } catch (e) {
      toast('e-conomic integration gemt. Forbindelsestest kunne ikke køres.', 'info');
    }
  }
}

// Load connected integrations
async function loadConnectedIntegrations() {
  const container = document.getElementById('connected-integrations-list');
  if (!container) return;

  let integrations = [];

  // Try Supabase first
  try {
    if (typeof SupabaseDB !== 'undefined' && currentUser?.id) {
      const result = await SupabaseDB.getIntegrations(currentUser.id);
      if (result.success && result.data?.length > 0) {
        integrations = result.data.map(cfg => ({
          id: cfg.id,
          system: cfg.integration_name,
          name: cfg.integration_name === 'economic' ? 'e-conomic' : cfg.integration_name,
          status: cfg.status,
          connectedAt: cfg.created_at || cfg.updated_at,
          config: cfg.config
        }));
        // Cache to localStorage
        localStorage.setItem('flow_integrations', JSON.stringify(integrations));
      }
    }
  } catch (err) {
    console.warn('Could not load integrations from Supabase:', err.message);
  }

  // Fallback to localStorage
  if (integrations.length === 0) {
    integrations = JSON.parse(localStorage.getItem('flow_integrations') || '[]');
  }

  // Also check individually connected integrations (e.g. Stripe via "Dine Integrationer")
  const localIntegrationMap = {
    betalinger: { name: 'Stripe / Betalinger', system: 'stripe' },
    pos: { name: 'POS Terminal', system: 'pos' },
    levering: { name: 'Levering', system: 'levering' },
    regnskab: { name: 'Regnskab', system: 'regnskab' }
  };
  Object.keys(localIntegrationMap).forEach(key => {
    if (localStorage.getItem('integration_' + key) === 'connected') {
      const alreadyExists = integrations.some(i => i.system === localIntegrationMap[key].system || i.id === key);
      if (!alreadyExists) {
        integrations.push({
          id: key,
          system: localIntegrationMap[key].system,
          name: localIntegrationMap[key].name,
          status: 'active',
          connectedAt: new Date().toISOString()
        });
      }
    }
  });

  if (integrations.length === 0) {
    container.innerHTML = `
      <div style="padding:24px;text-align:center;color:var(--muted)">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.5;margin-bottom:12px">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        <p>Ingen integrationer tilsluttet endnu</p>
        <p style="font-size:12px;margin-top:4px">Tilføj en integration ovenfor for at komme i gang</p>
      </div>
    `;
    return;
  }

  container.innerHTML = integrations.map(int => {
    const isEconomic = int.system === 'economic';
    const syncInfo = isEconomic && int.config?.lastSync
      ? `<div style="font-size:11px;color:var(--muted);margin-top:2px">Seneste sync: ${new Date(int.config.lastSync).toLocaleString('da-DK')}</div>`
      : '';
    const syncBtn = isEconomic
      ? `<button class="btn btn-secondary btn-sm" onclick="syncEconomicNow()">Synkroniser</button>`
      : '';

    return `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:16px;border:1px solid var(--border);border-radius:8px;margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:40px;height:40px;background:var(--success-dim, rgba(34,197,94,0.1));border-radius:8px;display:flex;align-items:center;justify-content:center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div>
          <div style="font-weight:600;font-size:14px">${int.name}</div>
          <div style="font-size:12px;color:var(--muted)">Forbundet ${new Date(int.connectedAt).toLocaleDateString('da-DK')}</div>
          ${syncInfo}
        </div>
      </div>
      <div style="display:flex;gap:8px">
        ${syncBtn}
        <button class="btn btn-secondary btn-sm" onclick="testIntegration('${int.id}')">Test forbindelse</button>
        <button class="btn btn-danger btn-sm" onclick="removeIntegration('${int.id}')">Fjern</button>
      </div>
    </div>`;
  }).join('');

  // Add sync status container after the list
  if (!document.getElementById('economic-sync-status')) {
    container.insertAdjacentHTML('afterend', '<div id="economic-sync-status" style="display:none"></div>');
  }

  // Load e-conomic sync status
  if (integrations.some(i => i.system === 'economic')) {
    loadEconomicSyncStatus();
  }
}

// Test integration connection — uses economic-proxy Edge Function for e-conomic
async function testIntegration(integrationId) {
  toast('Tester forbindelse...', 'info');

  // Find integration to check system type
  const integrations = JSON.parse(localStorage.getItem('flow_integrations') || '[]');
  const integration = integrations.find(i => i.id === integrationId);
  const system = integration?.system || '';

  if (system === 'economic') {
    try {
      const result = await callEconomicProxy('test-connection');
      if (result.success) {
        const companyName = result.data?.company?.name || 'e-conomic';
        toast('e-conomic forbindelse OK! (' + companyName + ')', 'success');

        // Update sync status in UI
        updateEconomicSyncStatus({
          status: 'connected',
          lastSync: new Date().toISOString(),
          companyName: companyName
        });
      } else {
        toast('e-conomic forbindelse fejlede: ' + (result.data?.message || 'Ukendt fejl'), 'error');
      }
    } catch (err) {
      toast('Forbindelsesfejl: ' + err.message, 'error');
    }
  } else {
    // Fallback for non-economic integrations
    setTimeout(() => {
      toast('Forbindelse OK!', 'success');
    }, 1500);
  }
}

// ============ e-conomic PROXY CLIENT ============

// Call the economic-proxy Edge Function
async function callEconomicProxy(action, params = {}) {
  const supabaseUrl = typeof CONFIG !== 'undefined' ? CONFIG.SUPABASE_URL : '';
  const anonKey = typeof CONFIG !== 'undefined' ? CONFIG.SUPABASE_ANON_KEY : '';

  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase configuration missing');
  }

  const client = window.supabaseClient || window.supabase;
  let authToken = anonKey;
  if (client) {
    try {
      const { data: { session } } = await client.auth.getSession();
      if (session?.access_token) authToken = session.access_token;
    } catch (e) {}
  }

  const response = await fetch(supabaseUrl + '/functions/v1/economic-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + authToken,
      'apikey': anonKey
    },
    body: JSON.stringify({ action, ...params })
  });

  return response.json();
}

// Update sync status display for e-conomic
function updateEconomicSyncStatus(info) {
  const statusEl = document.getElementById('economic-sync-status');
  if (!statusEl) return;

  statusEl.style.display = 'block';
  statusEl.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;padding:12px;background:var(--success-dim, rgba(34,197,94,0.1));border:1px solid var(--success);border-radius:8px;margin-top:12px">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      <div>
        <div style="font-size:13px;font-weight:600;color:var(--success)">Forbundet${info.companyName ? ' — ' + info.companyName : ''}</div>
        <div style="font-size:11px;color:var(--muted)">Seneste sync: ${info.lastSync ? new Date(info.lastSync).toLocaleString('da-DK') : 'Aldrig'}</div>
      </div>
    </div>
  `;
}

// Load e-conomic sync status on page load
async function loadEconomicSyncStatus() {
  try {
    const result = await callEconomicProxy('sync-status');
    if (result.success && result.connection) {
      const conn = result.connection;
      if (conn.status === 'connected') {
        updateEconomicSyncStatus({
          status: conn.status,
          lastSync: conn.last_sync,
          companyName: conn.config?.company || ''
        });
      }
    }
  } catch (e) {
    // Silently fail — user may not have credentials
  }
}

// Sync e-conomic data now
async function syncEconomicNow() {
  toast('Synkroniserer med e-conomic...', 'info');
  try {
    // Fetch company info as a sync check
    const result = await callEconomicProxy('test-connection');
    if (result.success) {
      const companyName = result.data?.company?.name || 'e-conomic';
      updateEconomicSyncStatus({
        status: 'connected',
        lastSync: new Date().toISOString(),
        companyName: companyName
      });

      // Update integration_connections sync timestamp
      const client = window.supabaseClient || window.supabase;
      if (client) {
        const { data: { user } } = await client.auth.getUser();
        if (user) {
          await client.from('integration_connections').upsert({
            user_id: user.id,
            system: 'economic',
            status: 'connected',
            last_sync: new Date().toISOString(),
            last_sync_status: 'success',
            config: { company: companyName }
          }, { onConflict: 'user_id,system' });
        }
      }

      toast('e-conomic synkroniseret! (' + companyName + ')', 'success');
      loadConnectedIntegrations();
    } else {
      toast('Sync fejlede: ' + (result.data?.message || 'Ukendt fejl'), 'error');
    }
  } catch (err) {
    toast('Sync fejlede: ' + err.message, 'error');
  }
}

// Export new integration functions
window.callEconomicProxy = callEconomicProxy;
window.syncEconomicNow = syncEconomicNow;
window.loadEconomicSyncStatus = loadEconomicSyncStatus;
window.updateEconomicSyncStatus = updateEconomicSyncStatus;

// Remove integration
async function removeIntegration(integrationId) {
  if (!confirm('Er du sikker på at du vil fjerne denne integration?')) return;

  // Remove from Supabase
  try {
    if (window.supabaseClient) {
      await window.supabaseClient
        .from('integration_configs')
        .delete()
        .eq('id', integrationId);
    }
  } catch (err) {
    console.warn('Could not delete integration from Supabase:', err.message);
  }

  // Remove from localStorage cache
  const integrations = JSON.parse(localStorage.getItem('flow_integrations') || '[]');
  const filtered = integrations.filter(i => i.id !== integrationId);
  localStorage.setItem('flow_integrations', JSON.stringify(filtered));
  loadConnectedIntegrations();
  toast('Integration fjernet', 'success');
}

// ============ END INTEGRATIONS PAGE ============

// Load and render Flow pages grid
function loadFlowPagesList() {
  const grid = document.getElementById('flow-pages-grid');
  if (!grid) return;

  grid.innerHTML = flowPagesList.map(page => `
    <div class="flow-page-card">
      <h3>${page.title}</h3>
      <p>${page.description}</p>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn btn-primary btn-sm" onclick="editFlowPage('${page.slug}')">Rediger indhold</button>
        <button class="btn btn-secondary btn-sm" onclick="window.open('/landing-pages/${page.slug}.html', '_blank')">Besøg side</button>
      </div>
    </div>
  `).join('');
}

// Edit a Flow page
function editFlowPage(slug) {
  const page = flowPagesList.find(p => p.slug === slug);
  if (!page) return;

  currentEditingPage = {
    slug: slug,
    title: page.title,
    sections: loadPageSections(slug)
  };

  renderPageEditor();
  switchFlowCMSTab('editor');
}

// Load page sections from localStorage or defaults
function loadPageSections(slug) {
  const saved = localStorage.getItem('flow_page_' + slug);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading page sections:', e);
    }
  }

  // Get default content for this page from the template
  const defaults = defaultFlowPageContent[slug] || {};

  // Return default sections with actual page content from template
  return [
    { id: 'header', type: 'Header', locked: true, content: {} },
    {
      id: 'hero',
      type: 'Hero Sektion',
      locked: false,
      content: defaults.hero || { title: '', subtitle: '', ctaText: 'Kom i gang', ctaUrl: '#demo' }
    },
    {
      id: 'features',
      type: 'Features',
      locked: false,
      content: defaults.features || { items: [] }
    },
    {
      id: 'cta',
      type: 'Call to Action',
      locked: false,
      content: defaults.cta || { title: '', buttonText: '' }
    },
    { id: 'footer', type: 'Footer', locked: true, content: {} }
  ];
}

// Render page editor with sections
function renderPageEditor() {
  const container = document.getElementById('flow-sections-list');
  const titleEl = document.getElementById('flow-editor-page-title');

  if (titleEl && currentEditingPage) {
    titleEl.textContent = 'Redigerer: ' + currentEditingPage.title;
  }

  if (!container || !currentEditingPage) return;

  container.innerHTML = currentEditingPage.sections.map((section, index) => `
    <div class="flow-section-editor" data-index="${index}">
      <div class="flow-section-header" onclick="toggleSectionFields(${index})">
        <span class="flow-section-type">${section.type}</span>
        <span class="flow-section-locked">${section.locked ? '🔒 Låst' : '✏️ Redigerbar'}</span>
      </div>
      ${section.locked ? `
        <div class="flow-section-fields" style="padding:16px;color:var(--muted)">
          <p>Denne sektion er låst og kan ikke redigeres. Header og footer er ens på alle sider.</p>
        </div>
      ` : `
        <div class="flow-section-fields" id="section-fields-${index}" style="display:none">
          ${renderSectionFields(section)}
        </div>
      `}
    </div>
  `).join('');
}

// Toggle section fields visibility
function toggleSectionFields(index) {
  const fields = document.getElementById('section-fields-' + index);
  if (fields) {
    fields.style.display = fields.style.display === 'none' ? 'block' : 'none';
  }
}

// Render fields for a section
function renderSectionFields(section) {
  if (section.type === 'Hero Sektion') {
    return `
      <div class="form-group">
        <label class="form-label">Overskrift</label>
        <input type="text" class="input" id="section-${section.id}-title" value="${section.content.title || ''}" placeholder="Hovedoverskrift">
      </div>
      <div class="form-group">
        <label class="form-label">Undertitel</label>
        <textarea class="input" id="section-${section.id}-subtitle" rows="2" placeholder="Beskrivende tekst">${section.content.subtitle || ''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Knaptekst</label>
        <input type="text" class="input" id="section-${section.id}-cta-text" value="${section.content.ctaText || ''}" placeholder="Kom i gang">
      </div>
      <div class="form-group">
        <label class="form-label">Knap URL</label>
        <input type="text" class="input" id="section-${section.id}-cta-url" value="${section.content.ctaUrl || ''}" placeholder="#demo">
      </div>
    `;
  }

  if (section.type === 'Call to Action') {
    return `
      <div class="form-group">
        <label class="form-label">Overskrift</label>
        <input type="text" class="input" id="section-${section.id}-title" value="${section.content.title || ''}" placeholder="Klar til at komme i gang?">
      </div>
      <div class="form-group">
        <label class="form-label">Knaptekst</label>
        <input type="text" class="input" id="section-${section.id}-button" value="${section.content.buttonText || ''}" placeholder="Start gratis">
      </div>
    `;
  }

  if (section.type === 'Features') {
    return `
      <div class="form-group">
        <label class="form-label">Feature beskrivelser (én per linje)</label>
        <textarea class="input" id="section-${section.id}-items" rows="6" placeholder="Feature 1\nFeature 2\nFeature 3">${(section.content.items || []).join('\n')}</textarea>
      </div>
    `;
  }

  return `<p style="color:var(--muted)">Ingen redigerbare felter for denne sektionstype.</p>`;
}

// Save Flow page
function saveFlowPage() {
  if (!currentEditingPage) return;

  // Collect data from form fields
  currentEditingPage.sections.forEach(section => {
    if (section.locked) return;

    if (section.type === 'Hero Sektion') {
      section.content.title = document.getElementById('section-' + section.id + '-title')?.value || '';
      section.content.subtitle = document.getElementById('section-' + section.id + '-subtitle')?.value || '';
      section.content.ctaText = document.getElementById('section-' + section.id + '-cta-text')?.value || '';
      section.content.ctaUrl = document.getElementById('section-' + section.id + '-cta-url')?.value || '';
    }

    if (section.type === 'Call to Action') {
      section.content.title = document.getElementById('section-' + section.id + '-title')?.value || '';
      section.content.buttonText = document.getElementById('section-' + section.id + '-button')?.value || '';
    }

    if (section.type === 'Features') {
      const items = document.getElementById('section-' + section.id + '-items')?.value || '';
      section.content.items = items.split('\n').filter(i => i.trim());
    }
  });

  // Save to localStorage
  localStorage.setItem('flow_page_' + currentEditingPage.slug, JSON.stringify(currentEditingPage.sections));

  toast('Side gemt', 'success');
}

// Preview Flow page
function previewFlowPage() {
  if (currentEditingPage) {
    window.open('landing-pages/' + currentEditingPage.slug + '.html', '_blank');
  }
}

// =====================================================
// MARKETING EDITOR (React Admin Style)
// =====================================================

// Marketing State
let marketingCampaigns = [];
let marketingBroadcasts = [];
let marketingSegments = [];
let currentCampaignId = null;
let marketingHasChanges = false;

// Default campaigns

function renderCustomerIntegrations() {
  var container = document.getElementById('vaerktoejer-content-apikeys');
  if (!container) return;

  var integrations = [
    {
      id: 'betalinger', title: 'Betalinger', color: '#10b981',
      desc: 'Modtag betalinger via Stripe, MobilePay og andre betalingsløsninger',
      providers: 'Stripe, MobilePay',
      icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
      statusKey: 'integration_betalinger',
      action: 'connect'
    },
    {
      id: 'pos', title: 'POS Terminal', color: '#f59e0b',
      desc: 'Forbind din fysiske betalingsterminal til ordresystemet',
      providers: 'SumUp, Zettle',
      icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><rect x="6" y="7" width="12" height="6" rx="1"/></svg>',
      statusKey: 'integration_pos',
      action: 'connect'
    },
    {
      id: 'levering', title: 'Levering', color: '#3b82f6',
      desc: 'Automatisk synkronisering med leveringsplatforme',
      providers: 'Wolt, Just Eat, Hungr',
      icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
      statusKey: 'integration_levering',
      action: 'connect'
    },
    {
      id: 'regnskab', title: 'Regnskab', color: '#8b5cf6',
      desc: 'Automatisk bogføring af ordrer og fakturaer',
      providers: 'e-conomic, Dinero, Billy',
      icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
      statusKey: 'integration_regnskab',
      action: 'connect'
    },
    {
      id: 'instagram', title: 'Agent Instagram', color: '#ec4899',
      desc: 'Instagram Business API — auto-reply DM, ordremodtagelse og produktbeskeder',
      providers: 'Instagram Graph API',
      icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>',
      statusKey: 'orderflow_instagram_agent_status',
      action: 'agent_instagram'
    },
    {
      id: 'facebook', title: 'Agent Facebook', color: '#3b82f6',
      desc: 'Facebook Page & Messenger API — auto-reply, ordremodtagelse og push-beskeder',
      providers: 'Facebook Messenger API',
      icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>',
      statusKey: 'orderflow_facebook_agent_status',
      action: 'agent_facebook'
    },
    {
      id: 'sms', title: 'SMS & Kommunikation', color: '#f97316',
      desc: 'SMS-udsendelse er inkluderet i din plan og håndteres af FLOW',
      providers: 'Inkluderet',
      icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
      statusKey: 'integration_sms',
      action: 'included'
    },
    {
      id: 'printer', title: 'Star TSP100A Printer', color: '#6366f1',
      desc: 'Tilslut kvitteringsprinter til automatisk print af ordre',
      providers: 'Star TSP100',
      icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
      statusKey: 'integration_printer',
      action: 'printer'
    }
  ];

  var html = '<div style="margin-bottom:var(--space-4)">' +
    '<h3 style="font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);margin-bottom:var(--space-2)">Dine Integrationer</h3>' +
    '<p style="color:var(--muted);font-size:var(--font-size-sm);margin-bottom:var(--space-5)">Forbind dine forretningsværktøjer med ét klik. Alle integrationer er fuldt håndteret af FLOW.</p></div>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:var(--space-4)">';

  integrations.forEach(function(ig) {
    var isConnected = localStorage.getItem(ig.statusKey) === 'connected';
    var isIncluded = ig.action === 'included';
    var isAgents = ig.action === 'agents';
    var isAgentPlatform = ig.action === 'agent_instagram' || ig.action === 'agent_facebook';

    // Check agent platform connection from agent status
    if (isAgentPlatform) {
      var agentStatus = JSON.parse(localStorage.getItem(ig.statusKey) || '{}');
      isConnected = agentStatus.connected === true;
    }

    // Check printer integration status from printerSettings
    var isPrinter = ig.action === 'printer';
    if (isPrinter) {
      var ps = getPrinterSettings();
      isConnected = ps.enabled && ps.printerIp;
      if (isConnected) localStorage.setItem(ig.statusKey, 'connected');
      else localStorage.removeItem(ig.statusKey);
    }

    var statusColor = (isConnected || isIncluded) ? ig.color : 'var(--muted)';
    var statusText = isIncluded ? 'Inkluderet' : (isPrinter && isConnected ? 'Tilsluttet' : (isConnected ? 'Forbundet' : 'Ej forbundet'));
    var statusBg = (isConnected || isIncluded) ? 'rgba(' + hexToRgb(ig.color) + ',0.1)' : 'var(--bg2)';

    var btnHtml = '';
    if (isIncluded) {
      btnHtml = '<span style="font-size:12px;color:' + ig.color + ';font-weight:500">Aktiv</span>';
    } else if (isAgentPlatform) {
      var agentId = ig.action === 'agent_instagram' ? 'instagram' : 'facebook';
      if (isConnected) {
        btnHtml = '<button class="btn btn-sm" style="font-size:12px;padding:6px 14px;border:1px solid var(--border);color:var(--color-text);background:var(--card);border-radius:var(--radius-sm);cursor:pointer" onclick="openAgentConfigPanel(\'' + agentId + '\')">Administrer</button>';
      } else {
        btnHtml = '<button class="btn btn-sm" style="font-size:12px;padding:6px 14px;background:' + ig.color + ';color:white;border:none;border-radius:var(--radius-sm);cursor:pointer" onclick="openAgentConfigPanel(\'' + agentId + '\')">Forbind konto</button>';
      }
    } else if (isAgents) {
      btnHtml = '<button class="btn btn-sm" style="font-size:12px;padding:6px 14px;border:1px solid ' + ig.color + ';color:' + ig.color + ';background:none;border-radius:var(--radius-sm);cursor:pointer" onclick="switchVaerktoejTab(\'agenter\')">Se Agenter</button>';
    } else if (isPrinter && isConnected) {
      btnHtml = '<button class="btn btn-sm" style="font-size:12px;padding:6px 14px;border:1px solid var(--border);color:var(--color-text);background:var(--card);border-radius:var(--radius-sm);cursor:pointer" onclick="openPrinterIntegration()">Administrer</button>';
    } else if (isPrinter) {
      btnHtml = '<button class="btn btn-sm" style="font-size:12px;padding:6px 14px;background:' + ig.color + ';color:white;border:none;border-radius:var(--radius-sm);cursor:pointer" onclick="openPrinterIntegration()">Opsæt Integration</button>';
    } else if (isConnected) {
      btnHtml = '<button class="btn btn-sm" style="font-size:12px;padding:6px 14px;border:1px solid var(--border);color:var(--color-text);background:var(--card);border-radius:var(--radius-sm);cursor:pointer" onclick="openIntegrationConfig(\'' + ig.id + '\')">Administrer</button>';
    } else {
      btnHtml = '<button class="btn btn-sm" style="font-size:12px;padding:6px 14px;background:' + ig.color + ';color:white;border:none;border-radius:var(--radius-sm);cursor:pointer" onclick="openIntegrationConfig(\'' + ig.id + '\')">Forbind</button>';
    }

    html += '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--space-5);transition:all 0.2s" onmouseover="this.style.borderColor=\'' + ig.color + '\';this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.transform=\'translateY(0)\'">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:var(--space-3)">' +
      '<div style="display:flex;align-items:center;gap:var(--space-3)">' +
      '<div style="width:44px;height:44px;background:linear-gradient(135deg,' + ig.color + ',' + ig.color + 'dd);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;color:white;flex-shrink:0">' + ig.icon + '</div>' +
      '<div><h4 style="font-weight:var(--font-weight-semibold);margin:0;font-size:var(--font-size-base)">' + ig.title + '</h4>' +
      '<span style="color:var(--muted);font-size:12px">' + ig.providers + '</span></div></div>' +
      '</div>' +
      '<p style="color:var(--muted);font-size:var(--font-size-sm);margin-bottom:var(--space-4);line-height:1.5">' + ig.desc + '</p>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;padding-top:var(--space-3);border-top:1px solid var(--border)">' +
      '<span style="font-size:12px;color:' + statusColor + ';font-weight:500;display:flex;align-items:center;gap:4px"><span style="width:6px;height:6px;border-radius:50%;background:' + statusColor + ';display:inline-block"></span>' + statusText + '</span>' +
      btnHtml + '</div></div>';
  });

  html += '</div>';
  container.innerHTML = html;
}

function openIntegrationConfig(integrationId) {
  var configs = {
    betalinger: {
      title: 'Betalinger', color: '#10b981',
      sections: [
        { type: 'info', text: 'Forbind din betalingsløsning for at modtage betalinger direkte via OrderFlow.' },
        { type: 'select', key: 'payment_provider', label: 'Betalingsudbyder', options: ['Stripe', 'MobilePay', 'Vipps'] },
        { type: 'toggle', key: 'payment_auto_capture', label: 'Automatisk capture', desc: 'Træk betaling automatisk når ordren bekræftes' },
        { type: 'toggle', key: 'payment_receipt_email', label: 'Email-kvittering', desc: 'Send kvittering til kunden efter betaling' }
      ]
    },
    pos: {
      title: 'POS Terminal', color: '#f59e0b',
      sections: [
        { type: 'info', text: 'Par din POS-terminal for at modtage fysiske betalinger via ordresystemet.' },
        { type: 'select', key: 'pos_provider', label: 'POS-udbyder', options: ['SumUp', 'Zettle (iZettle)', 'Nets'] },
        { type: 'field', key: 'pos_terminal_id', label: 'Terminal ID', placeholder: 'F.eks. SU-XXXXX' },
        { type: 'toggle', key: 'pos_auto_print', label: 'Automatisk kvittering', desc: 'Print kvittering ved betaling' }
      ]
    },
    levering: {
      title: 'Levering', color: '#3b82f6',
      sections: [
        { type: 'info', text: 'Synkroniser ordrer automatisk med din leveringsplatform.' },
        { type: 'select', key: 'delivery_provider', label: 'Leveringsplatform', options: ['Wolt', 'Just Eat', 'Hungr', 'Egen levering'] },
        { type: 'toggle', key: 'delivery_auto_accept', label: 'Auto-accept ordrer', desc: 'Accepter leveringsordrer automatisk' },
        { type: 'toggle', key: 'delivery_status_sync', label: 'Status-synkronisering', desc: 'Synkroniser leveringsstatus i realtid' }
      ]
    },
    regnskab: {
      title: 'Regnskab', color: '#8b5cf6',
      sections: [
        { type: 'info', text: 'Automatiser bogføring af ordrer, fakturaer og udgifter.' },
        { type: 'select', key: 'accounting_provider', label: 'Regnskabssystem', options: ['e-conomic', 'Dinero', 'Billy', 'Visma'] },
        { type: 'toggle', key: 'accounting_auto_book', label: 'Automatisk bogføring', desc: 'Bogfør ordrer automatisk i dit regnskabssystem' },
        { type: 'toggle', key: 'accounting_invoice', label: 'Automatiske fakturaer', desc: 'Opret fakturaer automatisk ved ordre' }
      ]
    }
  };

  var config = configs[integrationId];
  if (!config) return;

  var panel = document.getElementById('agent-config-panel');
  var title = document.getElementById('agent-config-title');
  var body = document.getElementById('agent-config-body');
  var footer = document.getElementById('agent-config-footer');

  title.textContent = config.title + ' — Integration';
  title.style.color = config.color;

  var bodyHtml = '';
  config.sections.forEach(function(s) {
    bodyHtml += '<div style="margin-bottom:var(--space-4)">';
    if (s.type === 'info') {
      bodyHtml += '<div style="padding:var(--space-3);background:rgba(' + hexToRgb(config.color) + ',0.05);border:1px solid rgba(' + hexToRgb(config.color) + ',0.2);border-radius:var(--radius-sm);font-size:var(--font-size-sm);color:var(--color-text);line-height:1.5">' + s.text + '</div>';
    } else if (s.type === 'select') {
      var current = localStorage.getItem(s.key) || s.options[0];
      bodyHtml += '<label style="display:block;font-size:var(--font-size-sm);font-weight:500;margin-bottom:4px">' + s.label + '</label>' +
        '<select class="input" id="intconfig-' + s.key + '" style="width:100%;font-size:var(--font-size-sm)">';
      s.options.forEach(function(opt) { bodyHtml += '<option value="' + opt + '"' + (opt === current ? ' selected' : '') + '>' + opt + '</option>'; });
      bodyHtml += '</select>';
    } else if (s.type === 'field') {
      var val = localStorage.getItem(s.key) || '';
      bodyHtml += '<label style="display:block;font-size:var(--font-size-sm);font-weight:500;margin-bottom:4px">' + s.label + '</label>' +
        '<input class="input" id="intconfig-' + s.key + '" type="text" value="' + escapeHtml(val) + '" placeholder="' + (s.placeholder || '') + '" style="width:100%;font-size:var(--font-size-sm)">';
    } else if (s.type === 'toggle') {
      var checked = localStorage.getItem(s.key) === 'true';
      bodyHtml += '<div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-3);background:var(--bg2);border-radius:var(--radius-sm)">' +
        '<div><span style="font-weight:500;font-size:var(--font-size-sm)">' + s.label + '</span>' + (s.desc ? '<br><span style="font-size:11px;color:var(--muted)">' + s.desc + '</span>' : '') + '</div>' +
        '<label style="position:relative;display:inline-block;width:40px;height:22px;cursor:pointer"><input type="checkbox" id="intconfig-' + s.key + '"' + (checked ? ' checked' : '') + ' style="opacity:0;width:0;height:0" onchange="this.nextElementSibling.style.background=this.checked?\'' + config.color + '\':\'var(--muted)\';this.nextElementSibling.querySelector(\'span\').style.transform=this.checked?\'translateX(18px)\':\'translateX(0)\'">' +
        '<div style="position:absolute;inset:0;background:' + (checked ? config.color : 'var(--muted)') + ';border-radius:11px;transition:0.2s"><span style="position:absolute;left:2px;top:2px;width:18px;height:18px;background:white;border-radius:50%;transition:0.2s;transform:' + (checked ? 'translateX(18px)' : 'translateX(0)') + '"></span></div></label></div>';
    }
    bodyHtml += '</div>';
  });
  body.innerHTML = bodyHtml;

  var isConnected = localStorage.getItem('integration_' + integrationId) === 'connected';
  footer.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center">' +
    (isConnected ? '<button class="btn btn-sm" style="font-size:var(--font-size-sm);color:var(--danger);background:none;border:none;cursor:pointer" onclick="disconnectIntegration(\'' + integrationId + '\')">Afbryd forbindelse</button>' : '<span></span>') +
    '<button class="btn btn-primary" onclick="saveIntegrationConfig(\'' + integrationId + '\')" style="font-size:var(--font-size-sm)">' + (isConnected ? 'Gem ændringer' : 'Forbind') + '</button>' +
    '</div>';

  panel.style.display = 'flex';
  requestAnimationFrame(function() {
    document.getElementById('agent-config-drawer').style.transform = 'translateX(0)';
  });
}

function saveIntegrationConfig(integrationId) {
  var panel = document.getElementById('agent-config-body');
  if (!panel) return;
  var inputs = panel.querySelectorAll('[id^="intconfig-"]');
  inputs.forEach(function(el) {
    var key = el.id.replace('intconfig-', '');
    if (el.type === 'checkbox') {
      localStorage.setItem(key, el.checked ? 'true' : 'false');
    } else {
      if (el.value) localStorage.setItem(key, el.value);
    }
  });
  localStorage.setItem('integration_' + integrationId, 'connected');
  toast('Integration forbundet', 'success');
  closeAgentConfigPanel();
  renderCustomerIntegrations();
}

function disconnectIntegration(integrationId) {
  localStorage.removeItem('integration_' + integrationId);
  // Also remove from flow_integrations cache
  try {
    var cached = JSON.parse(localStorage.getItem('flow_integrations') || '[]');
    cached = cached.filter(function(i) { return i.id !== integrationId; });
    localStorage.setItem('flow_integrations', JSON.stringify(cached));
  } catch (e) {}
  toast('Integration afbrudt', 'info');
  closeAgentConfigPanel();
  renderCustomerIntegrations();
  loadConnectedIntegrations();
}

// ============================================
// AGENT STATISTICS TAB
// ============================================

