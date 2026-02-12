// FLOW Leads Module — leads, pipeline, activities, reports

function showLeadsAddView() {
  document.getElementById('leads-list-view').style.display = 'none';
  document.getElementById('leads-add-view').style.display = 'block';
  clearLeadForm();
}

function showLeadsListView() {
  document.getElementById('leads-add-view').style.display = 'none';
  document.getElementById('leads-list-view').style.display = 'block';
  clearLeadForm();
}

// Pipeline View Switching
function showPipelineAddView() {
  document.getElementById('pipeline-kanban-view').style.display = 'none';
  document.getElementById('pipeline-add-view').style.display = 'block';
  clearPipelineLeadForm();
}

function showPipelineKanbanView() {
  document.getElementById('pipeline-add-view').style.display = 'none';
  document.getElementById('pipeline-kanban-view').style.display = 'block';
  clearPipelineLeadForm();
}

function clearLeadForm() {
  ['lead-name', 'lead-company', 'lead-phone', 'lead-email', 'lead-source', 'lead-value', 'lead-notes']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
}

function clearPipelineLeadForm() {
  ['pipeline-lead-name', 'pipeline-lead-company', 'pipeline-lead-phone', 'pipeline-lead-email',
   'pipeline-lead-source', 'pipeline-lead-value', 'pipeline-lead-notes', 'pipeline-lead-stage']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (el.tagName === 'SELECT') {
          el.selectedIndex = 0;
        } else {
          el.value = '';
        }
      }
    });
}

function saveNewLead() {
  const name = document.getElementById('lead-name')?.value.trim();
  const phone = document.getElementById('lead-phone')?.value.trim();

  if (!name) {
    toast('Navn er påkrævet', 'error');
    document.getElementById('lead-name')?.focus();
    return;
  }

  if (!phone) {
    toast('Telefon er påkrævet', 'error');
    document.getElementById('lead-phone')?.focus();
    return;
  }

  const lead = {
    id: 'lead-' + Date.now(),
    name: name,
    company: document.getElementById('lead-company')?.value.trim() || '',
    phone: phone,
    email: document.getElementById('lead-email')?.value.trim() || '',
    source: document.getElementById('lead-source')?.value || 'workflow',
    value: parseInt(document.getElementById('lead-value')?.value) || 0,
    stage: 'new',
    notes: document.getElementById('lead-notes')?.value.trim() || '',
    created_at: new Date().toISOString()
  };

  leads.push(lead);
  saveLeads();
  showLeadsListView();
  loadLeadsPage();
  toast('Lead tilføjet', 'success');
}

function saveNewLeadFromPipeline() {
  const name = document.getElementById('pipeline-lead-name')?.value.trim();
  const phone = document.getElementById('pipeline-lead-phone')?.value.trim();

  if (!name) {
    toast('Navn er påkrævet', 'error');
    document.getElementById('pipeline-lead-name')?.focus();
    return;
  }

  if (!phone) {
    toast('Telefon er påkrævet', 'error');
    document.getElementById('pipeline-lead-phone')?.focus();
    return;
  }

  const lead = {
    id: 'lead-' + Date.now(),
    name: name,
    company: document.getElementById('pipeline-lead-company')?.value.trim() || '',
    phone: phone,
    email: document.getElementById('pipeline-lead-email')?.value.trim() || '',
    source: document.getElementById('pipeline-lead-source')?.value || 'workflow',
    value: parseInt(document.getElementById('pipeline-lead-value')?.value) || 0,
    stage: document.getElementById('pipeline-lead-stage')?.value || 'new',
    notes: document.getElementById('pipeline-lead-notes')?.value.trim() || '',
    created_at: new Date().toISOString()
  };

  leads.push(lead);
  saveLeads();
  showPipelineKanbanView();
  loadPipelinePage();
  toast('Lead tilføjet', 'success');
}

// Legacy function for backwards compatibility
function showAddLeadModal() {
  showLeadsAddView();
}

function toggleLeadsSetup() {
  showLeadsAddView();
}

function saveLeads() {
  localStorage.setItem('orderflow_leads', JSON.stringify(leads));
}

function loadLeads() {
  const stored = localStorage.getItem('orderflow_leads');
  if (stored) {
    leads = JSON.parse(stored);
  }
  // Add demo leads if enabled
  if (isDemoDataEnabled()) {
    const demoLeads = getDemoDataLeads();
    leads = [...leads, ...demoLeads];
  }
}

function loadLeadsPage() {
  loadLeads();

  // Update stats
  const totalEl = document.getElementById('leads-total');
  const newEl = document.getElementById('leads-new');
  const qualifiedEl = document.getElementById('leads-qualified');
  const conversionEl = document.getElementById('leads-conversion');

  if (totalEl) totalEl.textContent = leads.length;
  if (newEl) newEl.textContent = leads.filter(l => l.stage === 'new').length;
  if (qualifiedEl) qualifiedEl.textContent = leads.filter(l => l.stage === 'qualified').length;

  const won = leads.filter(l => l.stage === 'won').length;
  const convRate = leads.length > 0 ? Math.round((won / leads.length) * 100) : 0;
  if (conversionEl) conversionEl.textContent = convRate + '%';

  // Update table
  const tbody = document.getElementById('leads-tbody');
  if (!tbody) return;

  if (leads.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted)">Ingen leads endnu. Klik "Tilføj Lead" for at oprette det første.</td></tr>`;
    return;
  }

  tbody.innerHTML = leads.map(lead => `
    <tr onclick="editLead('${lead.id}')" style="cursor:pointer">
      <td>${lead.name}</td>
      <td>${lead.company || '-'}</td>
      <td>${lead.phone || '-'}</td>
      <td>${lead.source}</td>
      <td>${lead.value ? formatCurrency(lead.value) : '-'}</td>
      <td><span class="lead-stage lead-stage-${lead.stage}">${getStageLabel(lead.stage)}</span></td>
      <td>${new Date(lead.created_at).toLocaleDateString('da-DK')}</td>
    </tr>
  `).join('');
}

function getStageLabel(stage) {
  const labels = {
    'new': 'Ny',
    'contacted': 'Kontaktet',
    'qualified': 'Kvalificeret',
    'proposal': 'Tilbud',
    'won': 'Vundet',
    'lost': 'Tabt'
  };
  return labels[stage] || stage;
}

function editLead(leadId) {
  const lead = leads.find(l => l.id === leadId);
  if (!lead) return;

  const newStage = prompt(`Ændr stadie for ${lead.name}:\n(new, contacted, qualified, proposal, won, lost)`, lead.stage);
  if (newStage && ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'].includes(newStage)) {
    lead.stage = newStage;
    saveLeads();
    loadLeadsPage();
    loadPipelinePage();
    toast('Lead opdateret', 'success');
  }
}

function loadPipelinePage() {
  loadLeads();

  const stages = ['new', 'contacted', 'qualified', 'proposal', 'won'];

  stages.forEach(stage => {
    const container = document.getElementById('pipeline-' + stage);
    const countEl = document.getElementById('pipeline-count-' + stage);
    const stageLeads = leads.filter(l => l.stage === stage);

    if (countEl) countEl.textContent = stageLeads.length;

    if (container) {
      if (stageLeads.length === 0) {
        container.innerHTML = '<div style="padding:16px;text-align:center;color:var(--muted);font-size:13px">Ingen leads</div>';
      } else {
        container.innerHTML = stageLeads.map(lead => `
          <div class="pipeline-card" onclick="editLead('${lead.id}')" style="background:var(--bg3);padding:12px;border-radius:var(--radius-md);cursor:pointer;border:1px solid var(--border)">
            <div style="font-weight:var(--font-weight-medium);margin-bottom:4px">${lead.name}</div>
            <div style="font-size:12px;color:var(--muted)">${lead.company || 'Ingen firma'}</div>
            ${lead.value ? `<div style="font-size:12px;color:var(--accent);margin-top:4px">${formatCurrency(lead.value)}</div>` : ''}
          </div>
        `).join('');
      }
    }
  });
}

function filterLeadsList() {
  const search = document.getElementById('leads-search')?.value.toLowerCase() || '';
  loadLeads();

  const filtered = leads.filter(lead =>
    lead.name.toLowerCase().includes(search) ||
    (lead.company && lead.company.toLowerCase().includes(search)) ||
    (lead.phone && lead.phone.includes(search))
  );

  const tbody = document.getElementById('leads-tbody');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted)">Ingen leads matcher søgningen</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(lead => `
    <tr onclick="editLead('${lead.id}')" style="cursor:pointer">
      <td>${lead.name}</td>
      <td>${lead.company || '-'}</td>
      <td>${lead.phone || '-'}</td>
      <td>${lead.source}</td>
      <td>${lead.value ? formatCurrency(lead.value) : '-'}</td>
      <td><span class="lead-stage lead-stage-${lead.stage}">${getStageLabel(lead.stage)}</span></td>
      <td>${new Date(lead.created_at).toLocaleDateString('da-DK')}</td>
    </tr>
  `).join('');
}

function filterLeadsByStage(stage) {
  loadLeads();
  const filtered = stage === 'all' ? leads : leads.filter(l => l.stage === stage);

  const tbody = document.getElementById('leads-tbody');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted)">Ingen leads i dette stadie</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(lead => `
    <tr onclick="editLead('${lead.id}')" style="cursor:pointer">
      <td>${lead.name}</td>
      <td>${lead.company || '-'}</td>
      <td>${lead.phone || '-'}</td>
      <td>${lead.source}</td>
      <td>${lead.value ? formatCurrency(lead.value) : '-'}</td>
      <td><span class="lead-stage lead-stage-${lead.stage}">${getStageLabel(lead.stage)}</span></td>
      <td>${new Date(lead.created_at).toLocaleDateString('da-DK')}</td>
    </tr>
  `).join('');
}

// =====================================================
// UTILS
// =====================================================

// Format currency for KPI display
function formatCurrency(amount) {
  if (!amount) return '0 kr';
  return new Intl.NumberFormat('da-DK', { 
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  }).format(amount) + ' kr';
}

// Settings tab switching - synchronized with sidebar
