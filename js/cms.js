// FLOW CMS Module — Flow CMS, pages, blog, SEO, colors/fonts

function showFlowPage(slug) {
  // Map slugs to HTML file names
  const pageMap = {
    'landing': 'landing.html',
    'restaurant-hjemmeside': 'restaurant-hjemmeside.html',
    'online-bestilling': 'online-bestilling.html',
    'custom-mobile-app': 'custom-mobile-app.html',
    'zero-commission-delivery': 'zero-commission-delivery.html',
    'loyalitetsprogram': 'loyalitetsprogram.html',
    'automatiseret-marketing': 'automatiseret-marketing.html',
    'case-studies': 'case-studies.html',
    'restaurant-marketing-guide': 'restaurant-marketing-guide.html',
    'seo-for-restauranter': 'seo-for-restauranter.html',
    'restaurant-email-marketing': 'restaurant-email-marketing.html',
    'restaurant-mobile-app': 'restaurant-mobile-app.html',
    'online-bestillingssystemer': 'online-bestillingssystemer.html',
    'om-os': 'om-os.html',
    'karriere': 'karriere.html',
    'ledelse': 'ledelse.html',
    'presse': 'presse.html',
    'partner': 'partner.html',
    'priser': 'landing.html#priser',
    'how-it-works': 'how-it-works.html',
    'blog': 'blog.html'
  };

  const pagePath = pageMap[slug] || slug + '.html';
  window.open(pagePath, '_blank');
}

// =====================================================
// TEMPLATE EDITOR FUNCTIONS
// =====================================================

const templateEditorState = {
  currentTemplate: null,
  currentFile: null,
  files: {},
  unsaved: false
};

const templateEditorFiles = {
  'skabelon-1': [
    { name: 'index.html', path: 'templates/skabelon-1/index.html', type: 'html' },
    { name: 'src/App.tsx', path: 'templates/skabelon-1/src/App.tsx', type: 'tsx' },
    { name: 'src/components/Header.tsx', path: 'templates/skabelon-1/src/components/Header.tsx', type: 'tsx' },
    { name: 'src/components/Hero.tsx', path: 'templates/skabelon-1/src/components/Hero.tsx', type: 'tsx' },
    { name: 'src/components/MenuSection.tsx', path: 'templates/skabelon-1/src/components/MenuSection.tsx', type: 'tsx' },
    { name: 'src/components/Footer.tsx', path: 'templates/skabelon-1/src/components/Footer.tsx', type: 'tsx' },
    { name: 'src/data/mockData.ts', path: 'templates/skabelon-1/src/data/mockData.ts', type: 'ts' },
    { name: 'src/types/index.ts', path: 'templates/skabelon-1/src/types/index.ts', type: 'ts' }
  ],
  'skabelon-2': [
    { name: 'index.html', path: 'templates/skabelon-2/index.html', type: 'html' },
    { name: 'css/style.css', path: 'templates/skabelon-2/css/style.css', type: 'css' },
    { name: 'css/responsive.css', path: 'templates/skabelon-2/css/responsive.css', type: 'css' },
    { name: 'js/custom.js', path: 'templates/skabelon-2/js/custom.js', type: 'js' }
  ],
  'skabelon-3': [
    { name: 'index.html', path: 'templates/skabelon-3/index.html', type: 'html' },
    { name: 'css/style.css', path: 'templates/skabelon-3/css/style.css', type: 'css' },
    { name: 'js/main.js', path: 'templates/skabelon-3/js/main.js', type: 'js' }
  ]
};

function loadTemplateEditorFiles(templateId) {
  templateEditorState.currentTemplate = templateId;
  templateEditorState.currentFile = null;
  templateEditorState.files = {};
  templateEditorState.unsaved = false;

  const files = templateEditorFiles[templateId] || [];
  const listEl = document.getElementById('te-file-list');
  if (!listEl) return;

  const typeIcons = { html: '&#128196;', css: '&#127912;', js: '&#9889;', ts: '&#9889;', tsx: '&#9889;' };

  listEl.innerHTML = files.map(f =>
    `<button onclick="loadTemplateFile('${f.path}','${f.name}')" class="te-file-btn" style="display:block;width:100%;text-align:left;padding:8px 12px;border:none;background:none;border-radius:6px;cursor:pointer;font-size:12px;color:var(--text);transition:background 0.15s" onmouseover="this.style.background='var(--bg2)'" onmouseout="if(!this.classList.contains('active'))this.style.background='none'">${typeIcons[f.type] || '&#128196;'} ${f.name}</button>`
  ).join('');

  const previewFrame = document.getElementById('te-preview-frame');
  if (previewFrame) {
    const template = webBuilderTemplates[templateId];
    previewFrame.src = template?.previewFile || ('templates/' + templateId + '/index.html');
  }

  document.getElementById('te-current-file').textContent = 'Ingen fil valgt';
  document.getElementById('te-code-editor').value = '';
}

async function loadTemplateFile(path, name) {
  if (templateEditorState.unsaved) {
    if (!confirm('Du har ugemte ændringer. Vil du fortsætte?')) return;
  }

  const storageKey = 'te_file_' + path;
  const savedContent = localStorage.getItem(storageKey);

  if (savedContent !== null) {
    templateEditorState.currentFile = path;
    templateEditorState.files[path] = savedContent;
    templateEditorState.unsaved = false;
    document.getElementById('te-current-file').textContent = name;
    document.getElementById('te-code-editor').value = savedContent;
    highlightActiveFile(path);
    return;
  }

  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error('Kunne ikke hente filen');
    const content = await response.text();

    templateEditorState.currentFile = path;
    templateEditorState.files[path] = content;
    templateEditorState.unsaved = false;
    document.getElementById('te-current-file').textContent = name;
    document.getElementById('te-code-editor').value = content;
    highlightActiveFile(path);
  } catch (err) {
    toast('Kunne ikke indlæse filen: ' + err.message, 'error');
  }
}

function highlightActiveFile(path) {
  document.querySelectorAll('.te-file-btn').forEach(function(btn) {
    var isActive = btn.getAttribute('onclick') && btn.getAttribute('onclick').indexOf(path) !== -1;
    btn.classList.toggle('active', isActive);
    btn.style.background = isActive ? 'var(--bg2)' : 'none';
    btn.style.fontWeight = isActive ? '600' : 'normal';
  });
}

function markTemplateFileUnsaved() {
  templateEditorState.unsaved = true;
  var statusEl = document.getElementById('te-save-status');
  if (statusEl) {
    statusEl.textContent = 'Ugemte ændringer';
    statusEl.style.display = '';
    statusEl.style.color = 'var(--warning)';
  }
}

function saveTemplateFile() {
  if (!templateEditorState.currentFile) {
    toast('Ingen fil valgt', 'warning');
    return;
  }

  var content = document.getElementById('te-code-editor').value;
  var storageKey = 'te_file_' + templateEditorState.currentFile;
  localStorage.setItem(storageKey, content);
  templateEditorState.files[templateEditorState.currentFile] = content;
  templateEditorState.unsaved = false;

  var statusEl = document.getElementById('te-save-status');
  if (statusEl) {
    statusEl.textContent = '✓ Gemt';
    statusEl.style.display = '';
    statusEl.style.color = 'var(--success)';
    setTimeout(function() { statusEl.style.display = 'none'; }, 2000);
  }

  toast('Fil gemt', 'success');
}

function refreshTemplatePreview() {
  var previewFrame = document.getElementById('te-preview-frame');
  if (previewFrame && templateEditorState.currentTemplate) {
    previewFrame.src = 'templates/' + templateEditorState.currentTemplate + '/index.html';
  }
}

// =====================================================
// FLOW CMS FUNCTIONS
// =====================================================

// Flow CMS State
let currentEditingPage = null;
let blogPosts = [];
let currentBlogPost = null;

// Flow Pages List
const flowPagesList = [
  // Hovedsider
  { slug: 'landing', title: 'Landing Page', description: 'Hovedside med hero og features' },
  { slug: 'how-it-works', title: 'Sådan virker det', description: 'Produktoversigt' },
  { slug: 'priser', title: 'Priser', description: 'Prisplaner og pakker' },

  // Produkter
  { slug: 'restaurant-hjemmeside', title: 'Restaurant Hjemmeside', description: 'Produktside for hjemmesider' },
  { slug: 'online-bestilling', title: 'Online Bestilling', description: 'Produktside for bestillingssystem' },
  { slug: 'custom-mobile-app', title: 'Custom Mobile App', description: 'Produktside for mobilapp' },
  { slug: 'restaurant-mobile-app', title: 'Restaurant Mobile App', description: 'Guide til mobilapps' },
  { slug: 'zero-commission-delivery', title: 'Zero-Commission Delivery', description: 'Produktside for levering' },
  { slug: 'loyalitetsprogram', title: 'Loyalitetsprogram', description: 'Produktside for loyalitet' },
  { slug: 'automatiseret-marketing', title: 'Automatiseret Marketing', description: 'Produktside for marketing' },

  // Guides & Resources
  { slug: 'case-studies', title: 'Case Studies', description: 'Kundehistorier og resultater' },
  { slug: 'seo-for-restauranter', title: 'SEO for Restauranter', description: 'Guide til søgemaskineoptimering' },
  { slug: 'restaurant-email-marketing', title: 'Restaurant Email Marketing', description: 'Guide til email marketing' },
  { slug: 'restaurant-marketing-guide', title: 'Restaurant Marketing Guide', description: 'Komplet marketing guide' },
  { slug: 'online-bestillingssystemer', title: 'Online Bestillingssystemer', description: 'Sammenligning af systemer' },

  // Virksomhed
  { slug: 'om-os', title: 'Om os', description: 'Virksomhedsprofil' },
  { slug: 'karriere', title: 'Karriere', description: 'Jobopslag og kultur' },
  { slug: 'ledelse', title: 'Ledelse', description: 'Ledelseshold' },
  { slug: 'presse', title: 'Presse', description: 'Pressemateriale' },
  { slug: 'partner', title: 'Partner med Flow', description: 'Partnerprogram' },

  // Support
  { slug: 'help-center', title: 'Help Center', description: 'Hjælp og support' },

  // Workflows
  { slug: 'sms-workflow', title: 'SMS Workflow', description: 'SMS automatisering' },
  { slug: 'instagram-workflow', title: 'Instagram Workflow', description: 'Instagram automatisering' },
  { slug: 'facebook-workflow', title: 'Facebook Workflow', description: 'Facebook automatisering' },

  // Juridisk
  { slug: 'privacy', title: 'Privatlivspolitik', description: 'Privatlivspolitik' },
  { slug: 'terms', title: 'Vilkår og betingelser', description: 'Servicevilkår' },
  { slug: 'cookie-settings', title: 'Cookie indstillinger', description: 'Cookie politik' },
  { slug: 'accessibility', title: 'Tilgængelighed', description: 'Tilgængelighedserklæring' },
  { slug: 'disclaimer', title: 'Ansvarsfraskrivelse', description: 'Ansvarsfraskrivelse' },
  { slug: 'platform-terms', title: 'Platform vilkår', description: 'Platform brugsvilkår' },
  { slug: 'restaurant-agreement', title: 'Restaurant aftale', description: 'Aftale for restauranter' },
  { slug: 'legal', title: 'Juridisk', description: 'Juridisk oversigt og hub' },

  // Blog
  { slug: 'blog', title: 'Blog', description: 'Blog oversigt med alle artikler' },
  { slug: 'blog-post', title: 'Blog Indlæg', description: 'Enkelt blog indlæg skabelon' },

  // Værktøjer
  { slug: 'search-engine', title: 'SEO Analyse', description: 'Digital synlighedsanalyse værktøj' },

  // Dokumentation
  { slug: 'docs', title: 'Dokumentation', description: 'Komplet dokumentation og guides' }
];

// Default content for Flow pages (template content that shows before customer edits)
const defaultFlowPageContent = {
  'landing': {
    hero: {
      title: 'AUTOMATION BYGGET TIL AT ØGE SALG',
      subtitle: 'Flow giver dig de samme værktøjer som store restaurantkæder bruger.',
      ctaText: 'Få en gratis demo',
      ctaUrl: '#demo'
    },
    features: { items: ['Mere Google Trafik', 'Mere Online Salg', 'Flere Genbestillinger', 'Flere App Downloads'] },
    cta: { title: 'Klar til at øge dit salg?', buttonText: 'Book en demo' }
  },
  'restaurant-hjemmeside': {
    hero: {
      title: 'Professionel restaurant hjemmeside',
      subtitle: 'Få en moderne hjemmeside der tiltrækker kunder og øger dit online salg.',
      ctaText: 'Kom i gang',
      ctaUrl: '#demo'
    },
    features: { items: ['Responsivt design', 'Online bestilling', 'SEO optimeret', 'Hurtig indlæsning'] },
    cta: { title: 'Få din egen hjemmeside', buttonText: 'Start gratis' }
  },
  'online-bestilling': {
    hero: {
      title: 'Online bestilling uden provision',
      subtitle: 'Undgå dyre gebyrer fra tredjepartsplatforme. Få dit eget bestillingssystem.',
      ctaText: 'Start gratis',
      ctaUrl: '#demo'
    },
    features: { items: ['0% provision', 'Direkte integration', 'Automatiske bekræftelser', 'Ordre-tracking'] },
    cta: { title: 'Spar penge på provision', buttonText: 'Kom i gang' }
  },
  'custom-mobile-app': {
    hero: {
      title: 'Din egen restaurant app',
      subtitle: 'Giv dine kunder en personlig app-oplevelse med dit brand.',
      ctaText: 'Se demo',
      ctaUrl: '#demo'
    },
    features: { items: ['Push notifikationer', 'Loyalty program', 'Online bestilling', 'Apple Pay & Google Pay'] },
    cta: { title: 'Få din egen app', buttonText: 'Book demo' }
  },
  'zero-commission-delivery': {
    hero: {
      title: 'Levering uden provision',
      subtitle: 'Administrer din egen levering og behold 100% af omsætningen.',
      ctaText: 'Lær mere',
      ctaUrl: '#demo'
    },
    features: { items: ['Ingen provision', 'Real-time tracking', 'Automatisk routing', 'Chauffør-app'] },
    cta: { title: 'Start din levering', buttonText: 'Kom i gang' }
  },
  'loyalitetsprogram': {
    hero: {
      title: 'Øg kundeloyaliteten',
      subtitle: 'Beløn dine faste kunder og få dem til at vende tilbage igen og igen.',
      ctaText: 'Se hvordan',
      ctaUrl: '#demo'
    },
    features: { items: ['Point-system', 'Automatiske belønninger', 'VIP-tiers', 'Fødselsdagsbelønninger'] },
    cta: { title: 'Start dit loyalty program', buttonText: 'Prøv gratis' }
  },
  'automatiseret-marketing': {
    hero: {
      title: 'Marketing på autopilot',
      subtitle: 'Automatisér din markedsføring og nå kunderne på det rigtige tidspunkt.',
      ctaText: 'Se muligheder',
      ctaUrl: '#demo'
    },
    features: { items: ['Email kampagner', 'SMS marketing', 'Automatiske flows', 'Segmentering'] },
    cta: { title: 'Automatisér din marketing', buttonText: 'Kom i gang' }
  },
  'case-studies': {
    hero: {
      title: 'Vores kunders succes',
      subtitle: 'Se hvordan andre restauranter har øget deres salg med Flow.',
      ctaText: 'Se cases',
      ctaUrl: '#cases'
    },
    features: { items: [] },
    cta: { title: 'Bliv den næste succes', buttonText: 'Book en demo' }
  },
  'seo-for-restauranter': {
    hero: {
      title: 'SEO for restauranter',
      subtitle: 'Bliv fundet af flere kunder på Google med vores SEO-guide.',
      ctaText: 'Læs guiden',
      ctaUrl: '#guide'
    },
    features: { items: ['Google My Business', 'Lokale søgninger', 'Anmeldelser', 'Schema markup'] },
    cta: { title: 'Boost din synlighed', buttonText: 'Kom i gang' }
  },
  'restaurant-email-marketing': {
    hero: {
      title: 'Email marketing for restauranter',
      subtitle: 'Lær at bygge relationer med dine kunder via email.',
      ctaText: 'Læs guiden',
      ctaUrl: '#guide'
    },
    features: { items: ['Nyhedsbreve', 'Tilbudsmails', 'Automatiske flows', 'A/B testing'] },
    cta: { title: 'Start email marketing', buttonText: 'Prøv gratis' }
  },
  'restaurant-mobile-app': {
    hero: {
      title: 'Mobilapps for restauranter',
      subtitle: 'Alt du skal vide om at få din egen restaurant-app.',
      ctaText: 'Læs mere',
      ctaUrl: '#info'
    },
    features: { items: ['Native apps', 'Push notifikationer', 'Loyalty integration', 'Online bestilling'] },
    cta: { title: 'Få din egen app', buttonText: 'Se priser' }
  },
  'online-bestillingssystemer': {
    hero: {
      title: 'Sammenlign bestillingssystemer',
      subtitle: 'Find det bedste online bestillingssystem til din restaurant.',
      ctaText: 'Se sammenligning',
      ctaUrl: '#compare'
    },
    features: { items: ['Feature sammenligning', 'Prissammenligning', 'Integrationer', 'Support'] },
    cta: { title: 'Vælg det rigtige system', buttonText: 'Kontakt os' }
  },
  'om-os': {
    hero: {
      title: 'Om Flow',
      subtitle: 'Vi hjælper restauranter med at vokse digitalt.',
      ctaText: 'Lær os at kende',
      ctaUrl: '#team'
    },
    features: { items: [] },
    cta: { title: 'Bliv en del af Flow', buttonText: 'Se ledige stillinger' }
  },
  'karriere': {
    hero: {
      title: 'Karriere hos Flow',
      subtitle: 'Bliv en del af et passioneret team der transformerer restaurant-branchen.',
      ctaText: 'Se stillinger',
      ctaUrl: '#jobs'
    },
    features: { items: ['Fleksibelt arbejde', 'Konkurrencedygtig løn', 'Fantastisk team', 'Hurtig vækst'] },
    cta: { title: 'Ansøg i dag', buttonText: 'Se ledige stillinger' }
  },
  'ledelse': {
    hero: {
      title: 'Vores ledelse',
      subtitle: 'Mød holdet bag Flow.',
      ctaText: 'Se teamet',
      ctaUrl: '#team'
    },
    features: { items: [] },
    cta: { title: 'Kontakt os', buttonText: 'Send besked' }
  },
  'presse': {
    hero: {
      title: 'Presse',
      subtitle: 'Pressemateriale og nyheder om Flow.',
      ctaText: 'Download materiale',
      ctaUrl: '#downloads'
    },
    features: { items: [] },
    cta: { title: 'Pressekontakt', buttonText: 'Kontakt os' }
  },
  'partner': {
    hero: {
      title: 'Bliv Flow Partner',
      subtitle: 'Tjen penge ved at hjælpe restauranter med at vokse.',
      ctaText: 'Bliv partner',
      ctaUrl: '#apply'
    },
    features: { items: ['Høje provisioner', 'Marketing support', 'Dedikeret manager', 'Uddannelse'] },
    cta: { title: 'Start i dag', buttonText: 'Ansøg nu' }
  },
  'how-it-works': {
    hero: {
      title: 'Sådan virker Flow',
      subtitle: 'Se hvor nemt det er at komme i gang med Flow.',
      ctaText: 'Se demo',
      ctaUrl: '#demo'
    },
    features: { items: ['Tilmeld dig', 'Opsæt din profil', 'Gå live', 'Se resultater'] },
    cta: { title: 'Kom i gang på 5 minutter', buttonText: 'Start gratis' }
  },
  'sms-workflow': {
    hero: {
      title: 'Automatiser din kommunikation med AI',
      subtitle: 'Lad AI håndtere dine kundehenvendelser, marketing-beskeder og reservationsbekræftelser.',
      ctaText: 'Kom i gang',
      ctaUrl: '#demo'
    },
    chatDemo: {
      userMessage: 'Hej, jeg vil gerne bestille 2x Margherita og 1x Pepperoni til levering kl. 18:30',
      botMessage: 'Tak for din bestilling! Jeg har modtaget: 2x Margherita (178 kr) og 1x Pepperoni (99 kr). Total: 277 kr. Levering kl. 18:30 til din adresse. Du modtager SMS når maden er på vej!',
      userAvatar: 'https://randomuser.me/api/portraits/women/79.jpg',
      userDelay: 500,
      botDelay: 1200,
      textExpandDelay: 1800
    },
    features: { items: ['98% åbningsrate', 'Win-back kampagner', 'Fødselsdagstilbud', 'Ordrebekræftelser'] },
    cta: { title: 'Start din SMS automation', buttonText: 'Prøv gratis' }
  },
  'instagram-workflow': {
    hero: {
      title: 'Instagram automation',
      subtitle: 'Automatiser svar på DMs, kommentarer og story-mentions.',
      ctaText: 'Kom i gang',
      ctaUrl: '#demo'
    },
    features: { items: ['Auto-svar på DMs', 'Kommentar-automation', 'Story mentions', '24/7 engagement'] },
    cta: { title: 'Automatisér din Instagram', buttonText: 'Prøv gratis' }
  },
  'facebook-workflow': {
    hero: {
      title: 'Facebook automation',
      subtitle: 'Messenger automation og kommentar-svar for din restaurant.',
      ctaText: 'Kom i gang',
      ctaUrl: '#demo'
    },
    features: { items: ['Messenger bot', 'Kommentar-svar', 'Lead generering', 'Automatiske kampagner'] },
    cta: { title: 'Automatisér din Facebook', buttonText: 'Prøv gratis' }
  },
  'blog': {
    hero: {
      title: 'Flow Blog',
      subtitle: 'Tips, guides og nyheder om restaurant marketing, online bestilling og automatisering.',
      ctaText: '',
      ctaUrl: ''
    },
    features: { items: [] },
    cta: { title: '', buttonText: '' }
  },
  'blog-post': {
    hero: {
      title: 'Blogindlæg',
      subtitle: 'Læs artikel fra Flow Blog.',
      ctaText: '',
      ctaUrl: ''
    },
    features: { items: [] },
    cta: { title: '', buttonText: '' }
  },
  'legal': {
    hero: {
      title: 'Juridisk',
      subtitle: 'Oversigt over alle juridiske dokumenter og vilkår.',
      ctaText: 'Se vilkår',
      ctaUrl: '#terms'
    },
    features: { items: [] },
    cta: { title: '', buttonText: '' }
  },
  'search-engine': {
    hero: {
      title: 'SEO Analyse',
      subtitle: 'Analysér din restaurants digitale synlighed.',
      ctaText: 'Start analyse',
      ctaUrl: '#analyze'
    },
    features: { items: [] },
    cta: { title: '', buttonText: '' }
  },
  'docs': {
    hero: {
      title: 'Dokumentation',
      subtitle: 'Guides, API reference og tutorials til Flow platformen.',
      ctaText: 'Kom i gang',
      ctaUrl: '#guides'
    },
    features: { items: [] },
    cta: { title: '', buttonText: '' }
  }
};

// =====================================================
// NEW CMS PAGES EDITOR (React Admin Style)
// =====================================================

// CMS State
let cmsPages = [];
let currentCMSPageId = null;
cmsHasChanges = false;
let originalCMSPages = null;

// BroadcastChannel for cross-tab CMS sync
const cmsChannel = new BroadcastChannel('orderflow_cms_channel');

// BroadcastChannels for cross-tab App/Web Builder sync
const appBuilderChannel = new BroadcastChannel('orderflow_appbuilder_channel');
const webBuilderChannel = new BroadcastChannel('orderflow_webbuilder_channel');

// Cross-tab sync message handlers
cmsChannel.onmessage = (event) => {
  if (event.data?.type === 'cms_update' && event.data.pages) {
    console.log('📡 CMS update received from another tab');
    cmsPages = event.data.pages;
    localStorage.setItem('orderflow_cms_pages', JSON.stringify(cmsPages));
    // Re-render if CMS editor is open
    if (document.getElementById('page-flow-cms')?.classList.contains('active')) {
      renderCMSPagesList();
      if (currentCMSPageId) {
        loadCMSPage(currentCMSPageId);
      }
    }
  }
};

appBuilderChannel.onmessage = (event) => {
  if (event.data?.type === 'appbuilder_update' && event.data.config) {
    console.log('📡 App Builder update received from another tab');
    localStorage.setItem(APP_BUILDER_CONFIG_KEY, JSON.stringify(event.data.config));
    // Sync preview if App Builder is open
    syncAllAppPreviews(event.data.config);
    // Re-render active page if in App Builder
    const activeAppBuilderPage = document.querySelector('[id^="page-appbuilder-"].active');
    if (activeAppBuilderPage) {
      const pageId = activeAppBuilderPage.id.replace('page-appbuilder-', '');
      showAppBuilderPage(pageId);
    }
  }
};

webBuilderChannel.onmessage = (event) => {
  if (event.data?.type === 'webbuilder_update' && event.data.config) {
    console.log('📡 Web Builder update received from another tab');
    localStorage.setItem(WEB_BUILDER_CONFIG_KEY, JSON.stringify(event.data.config));
    // Update preview if Web Builder is open
    updateWebBuilderPreview();
    // Re-render active page if in Web Builder
    const activeWebBuilderPage = document.querySelector('[id^="page-webbuilder-"].active');
    if (activeWebBuilderPage) {
      const pageId = activeWebBuilderPage.id.replace('page-webbuilder-', '');
      showWebBuilderPage(pageId);
    }
  }
};

// =====================================================
// MEDIA LIBRARY
// =====================================================

let mediaLibraryTarget = null; // { sectionId, field } or callback function
let mediaLibraryItems = [];
let selectedMediaItem = null;

// Open media library modal
// target can be: string (input id), function (callback), or object with sectionId/field
// sectionId and field are used for CMS section field updates
async function openMediaLibrary(target, sectionId, field, mediaType = 'image') {
  console.log('openMediaLibrary called', { target, sectionId, field, mediaType });

  // If called with sectionId and field, construct the target object
  if (sectionId && field) {
    // Handle nested paths like tabs.0.image or backgroundVideos.0.url
    if (field.includes('.')) {
      const parts = field.split('.');
      mediaLibraryTarget = {
        inputId: target,
        sectionId,
        nestedPath: parts,
        type: mediaType === 'video' ? 'video' : 'image'
      };
    } else {
      mediaLibraryTarget = { inputId: target, sectionId, field, type: mediaType === 'video' ? 'video' : 'image' };
    }
  } else {
    mediaLibraryTarget = target;
  }
  selectedMediaItem = null;

  const modal = document.getElementById('media-library-modal');
  const grid = document.getElementById('media-library-grid');
  const empty = document.getElementById('media-library-empty');
  const loading = document.getElementById('media-library-loading');
  const selectBtn = document.getElementById('media-select-btn');

  console.log('Modal element found:', !!modal);

  if (!modal) {
    console.error('Media library modal not found in DOM!');
    toast('Kunne ikke åbne medie bibliotek', 'error');
    return;
  }

  modal.classList.add('active');
  console.log('Modal classes after add:', modal.className);

  if (grid) grid.innerHTML = '';
  if (empty) empty.style.display = 'none';
  if (loading) loading.style.display = 'block';
  if (selectBtn) selectBtn.disabled = true;

  // Load media from Supabase
  try {
    console.log('Loading media from Supabase...');
    mediaLibraryItems = await SupabaseDB.listMedia('images');
    console.log('Loaded media items:', mediaLibraryItems?.length || 0);
    renderMediaLibrary();
  } catch (err) {
    console.error('Error loading media:', err);
    toast('Kunne ikke indlæse billeder', 'error');
  }

  if (loading) loading.style.display = 'none';
}

// Close media library modal
function closeMediaLibrary() {
  const modal = document.getElementById('media-library-modal');
  if (modal) {
    modal.classList.remove('active');
  }
  mediaLibraryTarget = null;
  selectedMediaItem = null;
}

// Render media library grid
function renderMediaLibrary(filter = '') {
  const grid = document.getElementById('media-library-grid');
  const empty = document.getElementById('media-library-empty');

  if (!grid) return;

  const filteredItems = filter
    ? mediaLibraryItems.filter(item => item.name.toLowerCase().includes(filter.toLowerCase()))
    : mediaLibraryItems;

  if (filteredItems.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  grid.innerHTML = filteredItems.map(item => `
    <div class="media-library-item" data-path="${item.path}" data-url="${item.url}" onclick="selectMediaLibraryItem(this)" style="cursor:pointer;border:2px solid transparent;border-radius:8px;overflow:hidden;background:var(--bg2);transition:border-color 0.2s">
      <div style="aspect-ratio:1;overflow:hidden;display:flex;align-items:center;justify-content:center;background:var(--bg-tertiary)">
        ${item.type === 'video'
          ? `<video src="${item.url}" style="width:100%;height:100%;object-fit:cover" muted></video>`
          : `<img src="${item.url}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover">`
        }
      </div>
      <div style="padding:8px;font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.name}</div>
      <button onclick="event.stopPropagation();deleteMediaLibraryItem('${item.path}')" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);color:white;border:none;border-radius:4px;padding:4px 8px;font-size:11px;cursor:pointer;opacity:0;transition:opacity 0.2s" class="media-delete-btn">Slet</button>
    </div>
  `).join('');

  // Add hover effect for delete button
  grid.querySelectorAll('.media-library-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.querySelector('.media-delete-btn').style.opacity = '1';
    });
    item.addEventListener('mouseleave', () => {
      item.querySelector('.media-delete-btn').style.opacity = '0';
    });
  });
}

// Filter media library
function filterMediaLibrary(query) {
  renderMediaLibrary(query);
}

// Select a media item
function selectMediaLibraryItem(element) {
  // Deselect previous
  document.querySelectorAll('.media-library-item').forEach(item => {
    item.style.borderColor = 'transparent';
  });

  // Select new
  element.style.borderColor = 'var(--primary)';
  selectedMediaItem = {
    path: element.dataset.path,
    url: element.dataset.url
  };

  document.getElementById('media-select-btn').disabled = false;
}

// Confirm selection
function selectMediaItem() {
  if (!selectedMediaItem || !mediaLibraryTarget) return;

  if (typeof mediaLibraryTarget === 'function') {
    // Callback function
    mediaLibraryTarget(selectedMediaItem.url);
  } else if (mediaLibraryTarget.nestedPath) {
    // Nested CMS section field (e.g., tabs.0.image)
    const page = getCurrentCMSPage();
    if (page) {
      const section = page.sections.find(s => s.id === mediaLibraryTarget.sectionId);
      if (section) {
        let obj = section;
        for (let i = 0; i < mediaLibraryTarget.nestedPath.length - 1; i++) {
          const key = mediaLibraryTarget.nestedPath[i];
          obj = obj[key];
        }
        obj[mediaLibraryTarget.nestedPath[mediaLibraryTarget.nestedPath.length - 1]] = selectedMediaItem.url;
        page.updatedAt = new Date().toISOString();
        markCMSChanged();
      }
    }
    // Update input field if exists
    if (mediaLibraryTarget.inputId) {
      const input = document.getElementById(mediaLibraryTarget.inputId);
      if (input) input.value = selectedMediaItem.url;
    }
    renderCMSSectionsList();
  } else if (mediaLibraryTarget.sectionId && mediaLibraryTarget.field) {
    // CMS section field
    updateSectionField(mediaLibraryTarget.sectionId, mediaLibraryTarget.field, selectedMediaItem.url);
    // Update input field if exists
    if (mediaLibraryTarget.inputId) {
      const input = document.getElementById(mediaLibraryTarget.inputId);
      if (input) input.value = selectedMediaItem.url;
    }
    renderCMSSectionsList();
  } else if (mediaLibraryTarget.sectionId && (mediaLibraryTarget.index !== undefined || mediaLibraryTarget.itemIndex !== undefined)) {
    // Gallery image, review item, or testimonial item
    const idx = mediaLibraryTarget.index ?? mediaLibraryTarget.itemIndex;
    if (mediaLibraryTarget.type === 'gallery') {
      updateGalleryImage(mediaLibraryTarget.sectionId, idx, 'url', selectedMediaItem.url);
    } else if (mediaLibraryTarget.type === 'review') {
      updateReviewItem(mediaLibraryTarget.sectionId, idx, 'image', selectedMediaItem.url);
    } else if (mediaLibraryTarget.type === 'testimonial') {
      updateTestimonialItem(mediaLibraryTarget.sectionId, idx, 'avatar', selectedMediaItem.url);
    }
    // Update input field if exists
    if (mediaLibraryTarget.inputId) {
      const input = document.getElementById(mediaLibraryTarget.inputId);
      if (input) input.value = selectedMediaItem.url;
    }
    renderCMSSectionsList();
  } else if (typeof mediaLibraryTarget === 'string') {
    // Simple input ID
    const input = document.getElementById(mediaLibraryTarget);
    if (input) {
      input.value = selectedMediaItem.url;
      input.dispatchEvent(new Event('change'));
    }
  }

  // Update image picker preview if one exists for this input
  const inputId = mediaLibraryTarget?.inputId || (typeof mediaLibraryTarget === 'string' ? mediaLibraryTarget : null);
  if (inputId) {
    updateImagePickerPreview(inputId, selectedMediaItem.url);
  }

  closeMediaLibrary();
  toast('Billede valgt', 'success');
}

// Handle file upload
async function handleMediaUpload(files) {
  if (!files || files.length === 0) return;

  const grid = document.getElementById('media-library-grid');

  for (const file of files) {
    // Show uploading indicator
    toast('Uploader ' + file.name + '...', 'info');

    const result = await SupabaseDB.uploadMedia(file, 'images');

    if (result.error) {
      toast('Fejl: ' + result.error, 'error');
    } else {
      toast(file.name + ' uploadet', 'success');

      // Add to list and re-render
      mediaLibraryItems.unshift({
        id: result.path,
        name: file.name,
        path: result.path,
        url: result.url,
        type: result.type,
        size: result.size,
        createdAt: new Date().toISOString()
      });
      renderMediaLibrary();
    }
  }

  // Clear file input
  document.getElementById('media-upload-input').value = '';
}

// Delete media item
async function deleteMediaLibraryItem(path) {
  if (!confirm('Er du sikker på at du vil slette dette billede?')) return;

  const result = await SupabaseDB.deleteMedia(path);

  if (result.error) {
    toast('Fejl: ' + result.error, 'error');
  } else {
    toast('Billede slettet', 'success');
    mediaLibraryItems = mediaLibraryItems.filter(item => item.path !== path);
    renderMediaLibrary();
  }
}

// Scrape actual content from landing.html to populate CMS
async function scrapeLandingPageContent() {
  try {
    const response = await fetch('/landing.html');
    if (!response.ok) throw new Error('Failed to fetch landing.html');
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Scrape Hero Section
    const hero = doc.querySelector('[data-cms="hero"]');
    const heroData = {
      headline: hero?.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim() || '',
      subheadline: hero?.querySelector('.hero-content p')?.textContent?.trim() || '',
      backgroundVideo: hero?.querySelector('video source')?.getAttribute('src') || '',
      buttons: [
        {
          text: hero?.querySelector('.button-white')?.textContent?.trim() || 'Få en gratis demo',
          url: hero?.querySelector('.button-white')?.getAttribute('href') || '#demo',
          variant: 'primary'
        },
        {
          text: hero?.querySelector('.button-outline')?.textContent?.trim() || 'Se priser',
          url: hero?.querySelector('.button-outline')?.getAttribute('href') || '#priser',
          variant: 'secondary'
        }
      ]
    };

    // Scrape Features/Tabs Section
    const features = doc.querySelector('[data-cms="features"]');
    const tabItems = features?.querySelectorAll('.tab-item') || [];
    const tabContents = features?.querySelectorAll('.tab-content') || [];
    const tabsData = Array.from(tabItems).map((tab, i) => {
      const content = tabContents[i];
      return {
        id: 'tab-' + (i + 1),
        tabLabel: tab.querySelector('.tab-text')?.textContent?.trim() || '',
        headline: content?.querySelector('.tab-text-content h3')?.textContent?.trim() || '',
        description: content?.querySelector('.tab-text-content p')?.textContent?.trim() || '',
        image: content?.querySelector('.tab-visual img')?.getAttribute('src') || '',
        video: ''
      };
    });

    // Scrape Trusted Section
    const trusted = doc.querySelector('[data-cms="trusted"]');
    const trustedCards = trusted?.querySelectorAll('.trusted-card:not(:nth-child(n+6))') || []; // First 5 only (skip duplicates)
    const trustedData = {
      heading: trusted?.querySelector('h2')?.textContent?.trim() || '',
      cards: Array.from(trustedCards).slice(0, 5).map(card => ({
        name: card.querySelector('.trusted-card-name')?.textContent?.trim() || '',
        role: card.querySelector('.trusted-card-role')?.textContent?.trim() || '',
        image: card.querySelector('img')?.getAttribute('src') || '',
        gradient: card.querySelector('img')?.getAttribute('style')?.match(/background:\s*([^;]+)/)?.[1] || ''
      }))
    };

    // Scrape Apple Features Section
    const appleFeatures = doc.querySelector('[data-cms="appleFeatures"]');
    const appleFeaturesData = {
      heading: appleFeatures?.querySelector('h2')?.textContent?.trim() || '',
      description: appleFeatures?.querySelector('.apple-features-header p')?.textContent?.trim() || ''
    };

    // Scrape Bento Section
    const bento = doc.querySelector('[data-cms="bento"]');
    const bentoData = {
      heading: bento?.querySelector('h2')?.textContent?.trim() || ''
    };

    // Scrape Beliefs Section
    const beliefs = doc.querySelector('[data-cms="beliefs"]');
    const beliefsData = {
      heading: beliefs?.querySelector('h2, .beliefs-title')?.textContent?.trim() || '',
      subtitle: beliefs?.querySelector('.beliefs-subtitle')?.textContent?.trim() || ''
    };

    console.log('Flow CMS: Scraped landing page content', { heroData, tabsData, trustedData });

    return {
      hero: heroData,
      tabs: tabsData,
      trusted: trustedData,
      appleFeatures: appleFeaturesData,
      bento: bentoData,
      beliefs: beliefsData
    };
  } catch (error) {
    console.error('Flow CMS: Error scraping landing page:', error);
    return null;
  }
}

// Default CMS Pages (populated from flowPagesList if no saved data)
function getDefaultCMSPages(scrapedContent = null) {
  return flowPagesList.map((page, index) => {
    const defaults = defaultFlowPageContent[page.slug] || {};

    // Use scraped content for landing page
    const isLandingPage = page.slug === 'landing';
    const scraped = isLandingPage && scrapedContent ? scrapedContent : null;

    // Build sections array based on page type
    const sections = [];

    // Hero section - use scraped content if available
    sections.push({
      id: 'section-hero-' + index,
      type: 'hero',
      order: 0,
      isVisible: true,
      padding: 'medium',
      headline: scraped?.hero?.headline || defaults.hero?.title || page.title,
      subheadline: scraped?.hero?.subheadline || defaults.hero?.subtitle || '',
      backgroundVideo: scraped?.hero?.backgroundVideo || '',
      backgroundImage: '',
      backgroundOverlay: 50,
      animation: 'none',
      alignment: 'center',
      buttons: scraped?.hero?.buttons || [
        { text: defaults.hero?.ctaText || 'Kom i gang', url: defaults.hero?.ctaUrl || '#demo', variant: 'primary' }
      ]
    });

    // Features section - use scraped tabs if available
    if (scraped?.tabs && scraped.tabs.length > 0) {
      sections.push({
        id: 'section-features-' + index,
        type: 'features',
        order: 1,
        isVisible: true,
        padding: 'medium',
        heading: 'Funktioner',
        tabs: scraped.tabs,
        layout: 'tabs',
        columns: 4
      });
    } else if (defaults.features?.items?.length > 0) {
      sections.push({
        id: 'section-features-' + index,
        type: 'features',
        order: 1,
        isVisible: true,
        padding: 'medium',
        features: defaults.features.items.map((item, i) => ({ id: 'f' + i, title: item, description: '' })),
        layout: 'grid',
        columns: 4
      });
    }

    // Trusted section - use scraped data if available
    if (scraped?.trusted && scraped.trusted.cards?.length > 0) {
      sections.push({
        id: 'section-trusted-' + index,
        type: 'trusted',
        order: 2,
        isVisible: true,
        padding: 'medium',
        heading: scraped.trusted.heading,
        cards: scraped.trusted.cards,
        layout: 'carousel',
        animation: 'none'
      });
    }

    // Bento section (only for landing page)
    if (isLandingPage) {
      sections.push({
        id: 'section-bento-' + index,
        type: 'bento',
        order: sections.length,
        isVisible: true,
        padding: 'medium',
        heading: 'Giv din restaurant den samme<br>teknologi som de store brands',
        heroImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop',
        heroOverlayText: 'Dine kunder er vant til at bestille på telefonen.<br>Derfor giver vi din restaurant sin egen <strong>mobile app</strong>.',
        cards: [
          { label: 'Få højere Google rankings med din AI-powered', title: 'restaurant hjemmeside.', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop' },
          { label: 'Vækst dit salg med et', title: 'online bestillingssystem modelleret efter de store brands.', image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=600&h=400&fit=crop' }
        ]
      });

      // Logo Cloud section
      sections.push({
        id: 'section-logocloud-' + index,
        type: 'logocloud',
        order: sections.length,
        isVisible: true,
        padding: 'medium',
        heading: 'Trusted by the world\'s most innovative teams',
        subheading: 'Join thousands of developers and designers who are already building with Smoothui',
        logos: [
          { name: 'Strava', url: 'https://strava.com' },
          { name: 'Descript', url: 'https://descript.com' },
          { name: 'Duolingo', url: 'https://duolingo.com' },
          { name: 'Faire', url: 'https://faire.com' },
          { name: 'Clearbit', url: 'https://clearbit.com' },
          { name: 'Canva', url: 'https://canva.com' },
          { name: 'Canpoy', url: 'https://canpoy.com' },
          { name: 'Casetext', url: 'https://casetext.com' }
        ]
      });

      // Beliefs section
      sections.push({
        id: 'section-beliefs-' + index,
        type: 'beliefs',
        order: sections.length,
        isVisible: true,
        padding: 'medium',
        heading: 'Tre overbevisninger der guider vores virksomhed',
        subtitle: 'Forstå principperne der guider vores beslutninger.',
        author: {
          name: 'Adam Guild',
          role: 'Co-Founder and CEO at OrderFlow',
          image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop'
        },
        items: [
          { heading: 'Salgsvækst er vigtigere end tilpasning.', text: 'Tredjepartsapps har formet hvordan alle bestiller online. Vi tager deres bedste praksis og giver dem til dig. Det er derfor vi udkonkurrerer dem på salg.' },
          { heading: 'Vi skal tjene din forretning hver måned.', text: 'Restauranter er hårde nok. Du behøver ikke endnu en tech-leverandør der binder dig. Kunder stemmer med deres fødder. Vi vil have dig skal kunne forlade os nemt hvis vi ikke tilføjer værdi.' },
          { heading: 'Restauranter bør eje deres kunderelationer.', text: 'En af de grusomste biprodukter af tech "innovation" er hvordan du bliver separeret fra dine kunder. Hvis du beslutter at forlade OrderFlow, får du dine kunder med dig.' }
        ]
      });

      // Testimonials section
      sections.push({
        id: 'section-testimonials-' + index,
        type: 'testimonials',
        order: sections.length,
        isVisible: true,
        padding: 'medium',
        heading: 'Hvad vores kunder siger',
        layout: 'carousel',
        rotationInterval: 5000,
        items: [
          { text: 'Flow har transformeret vores forretning. Vi har øget vores online ordrer med 150% på kun 3 måneder.', author: 'Maria Jensen', role: 'Café Hygge, København', image: 'https://i.pravatar.cc/96?img=1' },
          { text: 'Endelig en platform der forstår restauranters behov. Supporten er fantastisk og systemet er nemt at bruge.', author: 'Thomas Møller', role: 'Burger Joint, Aalborg', image: 'https://i.pravatar.cc/96?img=2' },
          { text: 'Vi sparede over 40.000 kr. om måneden ved at skifte væk fra tredjepartsplatforme. Flow betaler sig selv på få uger.', author: 'Emma Christensen', role: 'Thai Kitchen, Esbjerg', image: 'https://i.pravatar.cc/96?img=3' }
        ]
      });

      // Footer section
      sections.push({
        id: 'section-footer-' + index,
        type: 'footer',
        order: sections.length,
        isVisible: true,
        padding: 'medium',
        columns: [
          { title: 'PRODUKTER', links: [
            { text: 'Restaurant Hjemmeside', url: 'restaurant-hjemmeside.html' },
            { text: 'Online Bestilling', url: 'online-bestilling.html' },
            { text: 'Custom Mobile App', url: 'custom-mobile-app.html' },
            { text: 'Zero-Commission Delivery', url: 'zero-commission-delivery.html' },
            { text: 'Loyalitetsprogram', url: 'loyalitetsprogram.html' },
            { text: 'Automatiseret Marketing', url: 'automatiseret-marketing.html' }
          ]},
          { title: 'RESSOURCER', links: [
            { text: 'Case Studies', url: 'case-studies.html' },
            { text: 'Restaurant Marketing Guide', url: 'restaurant-marketing-guide.html' },
            { text: 'SEO for Restauranter', url: 'seo-for-restauranter.html' },
            { text: 'Restaurant Email Marketing', url: 'restaurant-email-marketing.html' },
            { text: 'Restaurant Mobile App', url: 'restaurant-mobile-app.html' },
            { text: 'Online Bestillingssystemer', url: 'online-bestillingssystemer.html' }
          ]},
          { title: 'VIRKSOMHED', links: [
            { text: 'Om os', url: 'om-os.html' },
            { text: 'Karriere', url: 'karriere.html' },
            { text: 'Ledelse', url: 'ledelse.html' },
            { text: 'Presse', url: 'presse.html' }
          ]},
          { title: 'SUPPORT', links: [
            { text: '+45 70 12 34 56', url: 'tel:+4570123456' },
            { text: 'support@flow.dk', url: 'mailto:support@flow.dk' }
          ]}
        ],
        contact: { phone: '+45 70 12 34 56', email: 'support@flow.dk' },
        copyright: '© 2024 Flow. Alle rettigheder forbeholdes.'
      });
    }

    // CTA section
    sections.push({
      id: 'section-cta-' + index,
      type: 'cta',
      order: sections.length,
      isVisible: true,
      padding: 'medium',
      title: defaults.cta?.title || 'Klar til at komme i gang?',
      description: '',
      button: { text: defaults.cta?.buttonText || 'Book demo', url: '#demo', variant: 'primary' },
      style: 'simple'
    });

    return {
      id: 'page-' + page.slug,
      title: page.title,
      slug: page.slug + '.html',
      description: page.description,
      status: 'published',
      template: 'landing',
      isActive: true,
      seo: {
        title: page.title + ' | Flow',
        description: scraped?.hero?.subheadline || defaults.hero?.subtitle || page.description,
        keywords: []
      },
      sections,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
}

// Load CMS Pages - Supabase first, localStorage fallback (async to support scraping)
async function loadCMSPages() {
  let loaded = false;

  // 1. Prøv Supabase først
  if (window.SupabaseDB) {
    try {
      const result = await window.SupabaseDB.loadBuilderConfig('cms');
      if (result.success && result.data?.pages?.length) {
        cmsPages = result.data.pages;
        // Sync til localStorage som cache
        localStorage.setItem('orderflow_cms_pages', JSON.stringify(cmsPages));
        console.log('✅ CMS pages loaded from Supabase (' + cmsPages.length + ' sider)');
        loaded = true;
      }
    } catch (err) {
      console.warn('⚠️ Supabase CMS load failed, falling back to localStorage:', err);
    }
  }

  // 2. Fallback til localStorage
  if (!loaded) {
    const saved = localStorage.getItem('orderflow_cms_pages');
    if (saved) {
      try {
        cmsPages = JSON.parse(saved);
        console.log('📦 CMS pages loaded from localStorage (' + cmsPages.length + ' sider)');
        loaded = true;
      } catch (e) {
        console.error('Error loading CMS pages from localStorage:', e);
      }
    }
  }

  // 3. Fallback til defaults (first time)
  if (!loaded) {
    console.log('Flow CMS: No saved pages found, scraping landing page content...');
    const scrapedContent = await scrapeLandingPageContent();
    cmsPages = getDefaultCMSPages(scrapedContent);
    localStorage.setItem('orderflow_cms_pages', JSON.stringify(cmsPages));
    console.log('Flow CMS: Landing page content scraped and saved');
  }

  // Kør migrationer
  await migrateVideoUrls();
  migrateMissingSections();
  migrateMissingPages();

  originalCMSPages = JSON.stringify(cmsPages);
  cmsHasChanges = false;
  renderCMSPagesList();
  renderCMSPasswordLinkSettings();
}

// Migrate existing CMS data to include video URLs from landing page
async function migrateVideoUrls() {
  const landingPage = cmsPages.find(p => p.slug === 'landing.html');
  if (!landingPage) return;

  const heroSection = landingPage.sections.find(s => s.type === 'hero');
  if (!heroSection) return;

  let needsSave = false;

  // Migrate old backgroundVideo string to new backgroundVideos array
  if (heroSection.backgroundVideo && !heroSection.backgroundVideos) {
    console.log('Flow CMS: Migrating single video to array format');
    heroSection.backgroundVideos = [{ url: heroSection.backgroundVideo, duration: 10 }];
    heroSection.videoShuffleEnabled = false;
    heroSection.videoShuffleDuration = 10;
    delete heroSection.backgroundVideo;
    needsSave = true;
  }

  // If no videos at all, scrape from landing page
  if (!heroSection.backgroundVideos || heroSection.backgroundVideos.length === 0) {
    console.log('Flow CMS: Scraping video URL from landing page...');
    const scraped = await scrapeLandingPageContent();
    if (scraped?.hero?.backgroundVideo) {
      heroSection.backgroundVideos = [{ url: scraped.hero.backgroundVideo, duration: 10 }];
      heroSection.videoShuffleEnabled = false;
      heroSection.videoShuffleDuration = 10;
      needsSave = true;
      console.log('Flow CMS: Video URL scraped:', scraped.hero.backgroundVideo);
    }
  }

  if (needsSave) {
    localStorage.setItem('orderflow_cms_pages', JSON.stringify(cmsPages));
  }
}

// Migrate existing CMS data to add missing sections for landing page
function migrateMissingSections() {
  const landingPage = cmsPages.find(p => p.slug === 'landing.html');
  if (!landingPage) return;

  let needsSave = false;
  const existingTypes = landingPage.sections.map(s => s.type);
  let maxOrder = Math.max(...landingPage.sections.map(s => s.order || 0), 0);

  // Define sections that should exist on landing page
  const requiredSections = [
    {
      type: 'bento',
      data: {
        heading: 'Giv din restaurant den samme<br>teknologi som de store brands',
        heroImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop',
        heroOverlayText: 'Dine kunder er vant til at bestille på telefonen.<br>Derfor giver vi din restaurant sin egen <strong>mobile app</strong>.',
        cards: [
          { label: 'Få højere Google rankings med din AI-powered', title: 'restaurant hjemmeside.', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop' },
          { label: 'Vækst dit salg med et', title: 'online bestillingssystem modelleret efter de store brands.', image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=600&h=400&fit=crop' }
        ]
      }
    },
    {
      type: 'logocloud',
      data: {
        heading: 'Trusted by the world\'s most innovative teams',
        subheading: 'Join thousands of developers and designers who are already building with Smoothui',
        logos: [
          { name: 'Strava', url: 'https://strava.com' },
          { name: 'Descript', url: 'https://descript.com' },
          { name: 'Duolingo', url: 'https://duolingo.com' },
          { name: 'Faire', url: 'https://faire.com' },
          { name: 'Clearbit', url: 'https://clearbit.com' },
          { name: 'Canva', url: 'https://canva.com' }
        ]
      }
    },
    {
      type: 'beliefs',
      data: {
        heading: 'Tre overbevisninger der guider vores virksomhed',
        subtitle: 'Forstå principperne der guider vores beslutninger.',
        author: {
          name: 'Adam Guild',
          role: 'Co-Founder and CEO at OrderFlow',
          image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop'
        },
        items: [
          { heading: 'Salgsvækst er vigtigere end tilpasning.', text: 'Tredjepartsapps har formet hvordan alle bestiller online. Vi tager deres bedste praksis og giver dem til dig.' },
          { heading: 'Vi skal tjene din forretning hver måned.', text: 'Restauranter er hårde nok. Du behøver ikke endnu en tech-leverandør der binder dig.' },
          { heading: 'Restauranter bør eje deres kunderelationer.', text: 'Hvis du beslutter at forlade OrderFlow, får du dine kunder med dig.' }
        ]
      }
    },
    {
      type: 'testimonials',
      data: {
        heading: 'Hvad vores kunder siger',
        layout: 'carousel',
        rotationInterval: 5000,
        items: [
          { text: 'Flow har transformeret vores forretning. Vi har øget vores online ordrer med 150% på kun 3 måneder.', author: 'Maria Jensen', role: 'Café Hygge, København', image: 'https://i.pravatar.cc/96?img=1' },
          { text: 'Vi sparede over 40.000 kr. om måneden ved at skifte væk fra tredjepartsplatforme.', author: 'Thomas Møller', role: 'Burger Joint, Aalborg', image: 'https://i.pravatar.cc/96?img=2' }
        ]
      }
    },
    {
      type: 'footer',
      data: {
        columns: [
          { title: 'PRODUKTER', links: [{ text: 'Restaurant Hjemmeside', url: 'restaurant-hjemmeside.html' }, { text: 'Online Bestilling', url: 'online-bestilling.html' }] },
          { title: 'RESSOURCER', links: [{ text: 'Case Studies', url: 'case-studies.html' }, { text: 'SEO for Restauranter', url: 'seo-for-restauranter.html' }] },
          { title: 'VIRKSOMHED', links: [{ text: 'Om os', url: 'om-os.html' }, { text: 'Karriere', url: 'karriere.html' }] },
          { title: 'SUPPORT', links: [{ text: '+45 70 12 34 56', url: 'tel:+4570123456' }, { text: 'support@flow.dk', url: 'mailto:support@flow.dk' }] }
        ],
        contact: { phone: '+45 70 12 34 56', email: 'support@flow.dk' },
        copyright: '© 2024 Flow. Alle rettigheder forbeholdes.'
      }
    }
  ];

  // Add missing sections
  requiredSections.forEach(req => {
    if (!existingTypes.includes(req.type)) {
      maxOrder++;
      landingPage.sections.push({
        id: 'section-' + req.type + '-' + Date.now(),
        type: req.type,
        order: maxOrder,
        isVisible: true,
        padding: 'medium',
        ...req.data
      });
      needsSave = true;
      console.log('Flow CMS: Added missing section:', req.type);
    }
  });

  // Migrate features section to use tabs format
  const featuresSection = landingPage.sections.find(s => s.type === 'features');
  if (featuresSection && !featuresSection.tabs) {
    featuresSection.tabs = [
      { id: 'tab-1', tabLabel: 'Mere Google Trafik', headline: 'Beløn dine gæster', description: 'Giv gæster point når de bruger din brandede mobil app. Øg kundeloyalitet og få flere tilbagevendende kunder med et automatiseret belønningssystem.', image: 'images/apple-iphone-16-pro-max-2024-medium.png', video: '' },
      { id: 'tab-2', tabLabel: 'Mere Online Salg', headline: 'Øg dit online salg', description: 'Få flere online ordrer med vores integrerede bestillingssystem. Ingen kommission, fuld kontrol over dine kundedata.', image: 'images/apple-iphone-16-pro-max-2024-medium.png', video: '' },
      { id: 'tab-3', tabLabel: 'Flere Genbestillinger', headline: 'Få flere genbestillinger', description: 'Automatiser din marketing og få kunder til at vende tilbage. SMS-kampagner, push-notifikationer og email marketing.', image: 'images/apple-iphone-16-pro-max-2024-medium.png', video: '' },
      { id: 'tab-4', tabLabel: 'Flere App Downloads', headline: 'Få flere app downloads', description: 'Din egen brandede app i App Store og Google Play. Øg kundeloyalitet og få direkte kontakt med dine gæster.', image: 'images/apple-iphone-16-pro-max-2024-medium.png', video: '' }
    ];
    featuresSection.layout = 'tabs';
    needsSave = true;
    console.log('Flow CMS: Migrated features section to tabs format');
  }

  // Migrate trusted section to add cards if missing
  const trustedSection = landingPage.sections.find(s => s.type === 'trusted');
  if (trustedSection && (!trustedSection.cards || trustedSection.cards.length === 0)) {
    trustedSection.heading = trustedSection.heading || 'Betroet af tusindvis af restauratører';
    trustedSection.cards = [
      { name: 'Maria Jensen', role: 'Café Hygge, København', image: 'images/apple-iphone-16-pro-max-2024-medium.png', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
      { name: 'Anders Nielsen', role: 'Pizzeria Napoli, Aarhus', image: 'images/apple-iphone-16-pro-max-2024-medium.png', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
      { name: 'Sophie Larsen', role: 'Sushi House, Odense', image: 'images/apple-iphone-16-pro-max-2024-medium.png', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
      { name: 'Thomas Møller', role: 'Burger Joint, Aalborg', image: 'images/apple-iphone-16-pro-max-2024-medium.png', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
      { name: 'Emma Christensen', role: 'Thai Kitchen, Esbjerg', image: 'images/apple-iphone-16-pro-max-2024-medium.png', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }
    ];
    needsSave = true;
    console.log('Flow CMS: Migrated trusted section with cards');
  }

  if (needsSave) {
    localStorage.setItem('orderflow_cms_pages', JSON.stringify(cmsPages));
    console.log('Flow CMS: Migration complete - added missing sections to landing page');
  }
}

// MIGRATION: Add missing pages from flowPagesList
function migrateMissingPages() {
  let needsSave = false;
  const existingSlugs = cmsPages.map(p => p.slug.replace('.html', ''));

  flowPagesList.forEach((pageInfo, index) => {
    if (!existingSlugs.includes(pageInfo.slug)) {
      console.log('Flow CMS: Adding missing page:', pageInfo.title, '(' + pageInfo.slug + ')');

      const defaults = defaultFlowPageContent[pageInfo.slug] || {};

      // Create the new page object
      const newPage = {
        id: 'page-' + pageInfo.slug,
        title: pageInfo.title,
        slug: pageInfo.slug + '.html',
        description: pageInfo.description || '',
        status: 'published',
        template: 'landing',
        isActive: true,
        showCookieBanner: false,
        seo: {
          title: pageInfo.title + ' | Flow',
          description: defaults.hero?.subtitle || pageInfo.description || '',
          keywords: []
        },
        sections: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add hero section
      newPage.sections.push({
        id: 'section-hero-' + index,
        type: 'hero',
        order: 0,
        isVisible: true,
        padding: 'medium',
        headline: defaults.hero?.title || pageInfo.title,
        subheadline: defaults.hero?.subtitle || '',
        backgroundVideo: '',
        backgroundImage: '',
        backgroundOverlay: 50,
        animation: 'none',
        alignment: 'center',
        buttons: [
          { text: defaults.hero?.ctaText || 'Kom i gang', url: defaults.hero?.ctaUrl || '#demo', variant: 'primary' }
        ]
      });

      // Add chat-demo section for workflow pages
      if (pageInfo.slug.includes('workflow') && defaults.chatDemo) {
        newPage.sections.push({
          id: 'section-chat-demo-' + index,
          type: 'chat-demo',
          order: 1,
          isVisible: true,
          padding: 'medium',
          userMessage: defaults.chatDemo.userMessage || '',
          botMessage: defaults.chatDemo.botMessage || '',
          userAvatar: defaults.chatDemo.userAvatar || 'https://randomuser.me/api/portraits/women/79.jpg',
          userDelay: defaults.chatDemo.userDelay || 500,
          botDelay: defaults.chatDemo.botDelay || 1200,
          textExpandDelay: defaults.chatDemo.textExpandDelay || 1800
        });
      }

      // Add CTA section
      newPage.sections.push({
        id: 'section-cta-' + index,
        type: 'cta',
        order: newPage.sections.length,
        isVisible: true,
        padding: 'medium',
        title: defaults.cta?.title || 'Klar til at komme i gang?',
        description: '',
        button: { text: defaults.cta?.buttonText || 'Kom i gang', url: '#demo', variant: 'primary' }
      });

      cmsPages.push(newPage);
      needsSave = true;
    }
  });

  if (needsSave) {
    localStorage.setItem('orderflow_cms_pages', JSON.stringify(cmsPages));
    console.log('Flow CMS: Migration complete - added', cmsPages.length - existingSlugs.length, 'missing pages');
  }
}

// Save CMS Pages to localStorage
function saveCMSPages() {
  localStorage.setItem('orderflow_cms_pages', JSON.stringify(cmsPages));
  originalCMSPages = JSON.stringify(cmsPages);
  cmsHasChanges = false;
  updateCMSUnsavedBadge();
  toast('Sider gemt! Genindlæs landing-siden for at se ændringer.', 'success');

  // Sync to Supabase in background
  if (window.SupabaseDB) {
    window.SupabaseDB.saveBuilderConfig('cms', { pages: cmsPages })
      .then(result => {
        if (result.success) {
          console.log('✅ CMS pages synced to Supabase');
        }
      })
      .catch(err => console.warn('⚠️ Supabase sync failed:', err));
  }

  // Dispatch event for other components
  window.dispatchEvent(new CustomEvent('cmsPagesUpdated', { detail: { pages: cmsPages } }));

  // Broadcast to other tabs for cross-tab sync
  cmsChannel.postMessage({ type: 'cms_update', pages: cmsPages });

  // Invalidate service worker cache
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CMS_CACHE' });
  }

  console.log('Flow CMS: Pages saved successfully', cmsPages.length, 'pages');
}

// Auto-save CMS changes with debounce (saves to localStorage without full save)
let cmsAutoSaveTimer = null;
let cmsSaveCount = 0;
function autoSaveCMSChanges() {
  if (cmsAutoSaveTimer) clearTimeout(cmsAutoSaveTimer);
  cmsAutoSaveTimer = setTimeout(() => {
    if (cmsHasChanges) {
      localStorage.setItem('orderflow_cms_pages', JSON.stringify(cmsPages));
      cmsChannel.postMessage({ type: 'cms_update', pages: cmsPages });

      // Save version every 5th save
      cmsSaveCount++;
      if (cmsSaveCount >= 5) {
        saveCMSVersion();
        cmsSaveCount = 0;
      }

      console.log('Flow CMS: Auto-saved changes to localStorage');
    }
  }, 2000);
}

// Mark as changed
function markCMSChanged() {
  cmsHasChanges = true;
  updateCMSUnsavedBadge();
  // No auto-save — user must click Gem
}

// Update unsaved badge
function updateCMSUnsavedBadge() {
  const badge = document.getElementById('cms-unsaved-badge');
  if (badge) {
    badge.style.display = cmsHasChanges ? 'inline-block' : 'none';
  }
}

// Render CMS Pages List
function renderCMSPagesList() {
  const container = document.getElementById('cms-pages-list');
  if (!container) return;

  // Opdater sideantal i header
  const countEl = document.getElementById('cms-pages-count');
  if (countEl) {
    const total = cmsPages.length;
    const published = cmsPages.filter(p => p.status === 'published').length;
    const draft = total - published;
    countEl.textContent = `${total} sider · ${published} publiceret · ${draft} kladder`;
  }

  const searchQuery = (document.getElementById('cms-pages-search')?.value || '').toLowerCase();
  const filteredPages = cmsPages.filter(page =>
    page.title.toLowerCase().includes(searchQuery) ||
    page.slug.toLowerCase().includes(searchQuery)
  );

  container.innerHTML = filteredPages.map(page => {
    const isActive = currentCMSPageId === page.id;
    const sectionCount = (page.sections || []).length;
    const updatedAt = page.updatedAt ? new Date(page.updatedAt).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }) : '';

    return `
    <div class="cms-page-item ${isActive ? 'active' : ''}" onclick="selectCMSPage('${page.id}')" style="padding:16px;border-radius:10px;cursor:pointer;border:1px solid ${isActive ? 'var(--primary)' : 'var(--border)'};background:${isActive ? 'var(--primary-light)' : 'var(--bg2)'};margin-bottom:6px;transition:all 0.2s ease">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-weight:600;font-size:14px">${page.title}</span>
        <span class="badge ${page.status === 'published' ? 'badge-success' : 'badge-warning'}" style="font-size:10px">${page.status === 'published' ? 'Publiceret' : 'Kladde'}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
        <span style="font-size:11px;color:var(--muted)">/${page.slug}</span>
        <span style="font-size:10px;color:var(--muted)">${sectionCount} sektioner${updatedAt ? ' · ' + updatedAt : ''}</span>
      </div>
    </div>
    `;
  }).join('');
}

// Open CMS page in builder (new tab)
function openCMSPageInBuilder(pageId) {
  const page = cmsPages.find(p => p.id === pageId);
  if (!page) return;
  const slug = page.slug.replace('.html', '');
  window.open('/landing-pages/' + slug + '.html', '_blank');
}

// Duplicate a specific CMS page by ID
function duplicateCMSPage(pageId) {
  const page = cmsPages.find(p => p.id === pageId);
  if (!page) return;

  const duplicated = JSON.parse(JSON.stringify(page));
  duplicated.id = 'page-' + Date.now();
  duplicated.title = page.title + ' (Kopi)';
  duplicated.slug = page.slug.replace('.html', '-kopi.html');
  duplicated.status = 'draft';
  duplicated.createdAt = new Date().toISOString();
  duplicated.updatedAt = new Date().toISOString();

  cmsPages.unshift(duplicated);
  markCMSChanged();
  renderCMSPagesList();
  selectCMSPage(duplicated.id);
  toast('Side duplikeret', 'success');
}

// Filter CMS Pages
function filterCMSPages() {
  renderCMSPagesList();
}

// Select CMS Page
function selectCMSPage(pageId) {
  currentCMSPageId = pageId;
  renderCMSPagesList();
  renderCMSPageEditor();
}

// Get current page
function getCurrentCMSPage() {
  return cmsPages.find(p => p.id === currentCMSPageId);
}

// Render CMS Page Editor
function renderCMSPageEditor() {
  const page = getCurrentCMSPage();
  const headerEl = document.getElementById('cms-editor-header');
  const tabsEl = document.getElementById('cms-editor-tabs');
  const emptyEl = document.getElementById('cms-editor-empty');
  const contentTab = document.getElementById('cms-tab-content');

  if (!page) {
    if (headerEl) headerEl.style.display = 'none';
    if (tabsEl) tabsEl.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'flex';
    if (contentTab) contentTab.style.display = 'none';
    return;
  }

  if (headerEl) headerEl.style.display = 'block';
  if (tabsEl) tabsEl.style.display = 'block';
  if (emptyEl) emptyEl.style.display = 'none';

  // Update header
  const titleInput = document.getElementById('cms-page-title-input');
  if (titleInput) titleInput.value = page.title;

  const statusBadge = document.getElementById('cms-page-status-badge');
  if (statusBadge) {
    statusBadge.className = 'badge ' + (page.status === 'published' ? 'badge-success' : 'badge-warning');
    statusBadge.textContent = page.status === 'published' ? 'Publiceret' : 'Kladde';
  }

  const publishBtn = document.getElementById('cms-publish-btn');
  if (publishBtn) {
    publishBtn.textContent = page.status === 'published' ? 'Gem som kladde' : 'Publicer';
  }

  // Update schedule badge
  updateScheduleBadge();

  // Switch to content tab by default
  switchCMSEditorTab('content');
}

// Switch CMS Editor Tab
function switchCMSEditorTab(tab) {
  console.log('switchCMSEditorTab called with:', tab);

  try {
    // Update tab buttons
    document.querySelectorAll('#cms-editor-tabs .tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Hide all tabs (with null checks)
    const contentTab = document.getElementById('cms-tab-content');
    const seoTab = document.getElementById('cms-tab-seo');

    if (contentTab) contentTab.style.display = 'none';
    if (seoTab) seoTab.style.display = 'none';

    // Show selected tab
    const tabEl = document.getElementById('cms-tab-' + tab);
    if (tabEl) {
      tabEl.style.display = 'block';
      console.log('Tab shown:', tab);
    } else {
      console.error('Tab element not found:', 'cms-tab-' + tab);
      return;
    }

    // Render tab content
    const page = getCurrentCMSPage();
    if (!page) {
      console.warn('No page selected for tab:', tab);
      return;
    }
    console.log('Current page:', page.title);

    if (tab === 'content') {
      renderCMSSectionsList();
    } else if (tab === 'seo') {
      const seoTitle = document.getElementById('cms-seo-title');
      const seoDesc = document.getElementById('cms-seo-description');
      const seoKeywords = document.getElementById('cms-seo-keywords');

      if (seoTitle) seoTitle.value = page.seo?.title || '';
      if (seoDesc) seoDesc.value = page.seo?.description || '';
      if (seoKeywords) seoKeywords.value = (page.seo?.keywords || []).join(', ');
    }
  } catch (e) {
    console.error('Error in switchCMSEditorTab:', e);
  }
}

// Render CMS Sections List
function renderCMSSectionsList() {
  const page = getCurrentCMSPage();
  const container = document.getElementById('cms-sections-list');
  if (!container || !page) return;

  const sortedSections = [...page.sections].sort((a, b) => a.order - b.order);

  container.innerHTML = sortedSections.map((section, index) => `
    <div class="cms-section-card" style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;margin-bottom:12px;overflow:hidden;${!section.isVisible ? 'opacity:0.5' : ''}">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:var(--bg3);border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-weight:600;font-size:13px">${getSectionLabel(section.type)}</span>
          ${!section.isVisible ? '<span class="badge" style="font-size:10px;background:var(--muted);color:var(--text-inverse)">Skjult</span>' : ''}
        </div>
        <div style="display:flex;gap:4px">
          <button class="btn btn-sm" onclick="moveSectionUp('${section.id}')" ${index === 0 ? 'disabled' : ''} title="Flyt op" style="font-size:11px">Op</button>
          <button class="btn btn-sm" onclick="moveSectionDown('${section.id}')" ${index === sortedSections.length - 1 ? 'disabled' : ''} title="Flyt ned" style="font-size:11px">Ned</button>
          <button class="btn btn-sm" onclick="toggleSectionVisibility('${section.id}')" title="${section.isVisible ? 'Skjul' : 'Vis'}" style="font-size:11px">${section.isVisible ? 'Skjul' : 'Vis'}</button>
          <button class="btn btn-sm btn-danger" onclick="deleteSectionFromPage('${section.id}')" title="Slet" style="font-size:11px">Slet</button>
        </div>
      </div>
      <div style="padding:16px">
        ${renderSectionEditor(section)}
      </div>
    </div>
  `).join('') || '<p style="text-align:center;color:var(--muted);padding:40px">Ingen sektioner endnu. Klik "Tilføj sektion" for at starte.</p>';
}

// Get section icon (returns empty - no icons to keep design clean)
function getSectionIcon(type) {
  return '';
}

/**
 * Render a visual image picker component
 * @param {Object} options - Configuration options
 * @param {string} options.id - Unique input ID
 * @param {string} options.sectionId - Section ID for updates
 * @param {string} options.field - Field path (e.g., 'backgroundImage' or 'tabs.0.image')
 * @param {string} options.currentValue - Current image URL
 * @param {string} options.label - Label text
 * @param {string} options.size - 'small' | 'medium' | 'large' (default: medium)
 * @param {string} options.shape - 'rectangle' | 'square' | 'circle' (default: rectangle)
 * @param {string} options.updateFn - Custom update function name (optional)
 * @returns {string} HTML string
 */
function renderImagePicker(options) {
  const {
    id,
    sectionId,
    field,
    currentValue,
    label,
    size = 'medium',
    shape = 'rectangle',
    updateFn = null
  } = options;

  // Size configurations
  const sizes = {
    small: { width: 80, height: 60 },
    medium: { width: 160, height: 100 },
    large: { width: 240, height: 150 }
  };
  const { width, height } = sizes[size] || sizes.medium;

  // Shape adjustments
  const borderRadius = shape === 'circle' ? '50%' : '8px';
  const finalHeight = shape === 'square' ? width : (shape === 'circle' ? width : height);

  const hasImage = currentValue && currentValue.trim() !== '';

  return `
    <div class="form-group" style="margin-bottom:12px">
      ${label ? `<label class="form-label" style="font-size:12px">${label}</label>` : ''}
      <div class="cms-image-picker" data-picker-id="${id}">
        <div class="cms-image-preview ${hasImage ? 'has-image' : ''}"
             style="width:${width}px;height:${finalHeight}px;border-radius:${borderRadius};${hasImage ? `background-image:url('${currentValue}')` : ''}"
             onclick="openMediaLibrary('${id}', '${sectionId}', '${field}')">
          ${!hasImage ? `
            <div class="placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
              <span>Vælg billede</span>
            </div>
          ` : ''}
        </div>
        <input type="hidden" id="${id}" value="${currentValue || ''}">
        <div class="cms-image-picker-actions">
          <button type="button" class="btn btn-secondary btn-sm" onclick="openMediaLibrary('${id}', '${sectionId}', '${field}')">
            ${hasImage ? 'Skift billede' : 'Vælg fra bibliotek'}
          </button>
          ${hasImage ? `<button type="button" class="btn btn-sm" style="color:var(--danger)" onclick="clearImagePicker('${id}', '${sectionId}', '${field}')">Fjern</button>` : ''}
        </div>
      </div>
    </div>`;
}

/**
 * Clear an image picker value
 */
function clearImagePicker(inputId, sectionId, field) {
  const input = document.getElementById(inputId);
  if (input) input.value = '';

  // Update the preview
  const picker = document.querySelector(`[data-picker-id="${inputId}"]`);
  if (picker) {
    const preview = picker.querySelector('.cms-image-preview');
    if (preview) {
      preview.style.backgroundImage = '';
      preview.classList.remove('has-image');
      preview.innerHTML = `
        <div class="placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
          <span>Vælg billede</span>
        </div>`;
    }
    // Update button text
    const actionBtn = picker.querySelector('.cms-image-picker-actions .btn-secondary');
    if (actionBtn) actionBtn.textContent = 'Vælg fra bibliotek';
    // Hide remove button
    const removeBtn = picker.querySelector('.cms-image-picker-actions .btn:last-child');
    if (removeBtn && removeBtn.style) removeBtn.style.display = 'none';
  }

  // Update the section field
  updateNestedSectionField(sectionId, field, '');
}

/**
 * Update a nested field in a section (supports dot notation like 'tabs.0.image')
 */
function updateNestedSectionField(sectionId, fieldPath, value) {
  const page = getCurrentCMSPage();
  if (!page) return;

  const section = page.sections.find(s => s.id === sectionId);
  if (!section) return;

  const parts = fieldPath.split('.');
  let obj = section;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = isNaN(parts[i]) ? parts[i] : parseInt(parts[i]);
    if (obj[key] === undefined) obj[key] = {};
    obj = obj[key];
  }

  const lastKey = isNaN(parts[parts.length - 1]) ? parts[parts.length - 1] : parseInt(parts[parts.length - 1]);
  obj[lastKey] = value;

  page.updatedAt = new Date().toISOString();
  markCMSChanged();
}

/**
 * Update image picker preview after media library selection
 */
function updateImagePickerPreview(inputId, imageUrl) {
  const picker = document.querySelector(`[data-picker-id="${inputId}"]`);
  if (!picker) return;

  const preview = picker.querySelector('.cms-image-preview');
  if (preview) {
    if (imageUrl) {
      preview.style.backgroundImage = `url('${imageUrl}')`;
      preview.classList.add('has-image');
      preview.innerHTML = '';
    } else {
      preview.style.backgroundImage = '';
      preview.classList.remove('has-image');
      preview.innerHTML = `
        <div class="placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
          <span>Vælg billede</span>
        </div>`;
    }
  }

  // Update button text
  const actionBtn = picker.querySelector('.cms-image-picker-actions .btn-secondary');
  if (actionBtn) {
    actionBtn.textContent = imageUrl ? 'Skift billede' : 'Vælg fra bibliotek';
  }

  // Show/hide remove button
  const actionsDiv = picker.querySelector('.cms-image-picker-actions');
  if (actionsDiv && imageUrl) {
    let removeBtn = actionsDiv.querySelector('.btn:last-child');
    if (!removeBtn || !removeBtn.textContent.includes('Fjern')) {
      const parts = picker.dataset.pickerId.split('-');
      const sectionId = parts.length > 2 ? parts.slice(1, -1).join('-') : parts[1];
      // SECURITY FIX v4.12.0: Escape dynamic IDs to prevent XSS via data attributes
      actionsDiv.innerHTML += `<button type="button" class="btn btn-sm" style="color:var(--danger)" onclick="clearImagePicker('${escapeHtml(picker.dataset.pickerId)}', '${escapeHtml(sectionId)}', '')">Fjern</button>`;
    }
  }
}

// Get section label
function getSectionLabel(type) {
  const labels = {
    hero: 'Hero',
    text: 'Tekst',
    features: 'Funktioner/Tabs',
    cta: 'Call-to-Action',
    testimonials: 'Udtalelser',
    faq: 'FAQ',
    images: 'Billeder',
    trusted: 'Testimonial Carousel',
    appleFeatures: 'Feature Cards',
    bento: 'Bento Grid',
    beliefs: 'Virksomhedsværdier',
    logocloud: 'Logo Cloud',
    footer: 'Footer'
  };
  return labels[type] || type;
}

// Render Section Editor
function renderSectionEditor(section) {
  switch (section.type) {
    case 'hero':
      return `
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label" style="font-size:12px">Overskrift</label>
          <input type="text" class="input" value="${section.headline || ''}" onchange="updateSectionField('${section.id}', 'headline', this.value)">
        </div>
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label" style="font-size:12px">Underoverskrift</label>
          <textarea class="input" rows="2" onchange="updateSectionField('${section.id}', 'subheadline', this.value)">${section.subheadline || ''}</textarea>
        </div>
        ${renderImagePicker({
          id: 'hero-bg-image-' + section.id,
          sectionId: section.id,
          field: 'backgroundImage',
          currentValue: section.backgroundImage || '',
          label: 'Baggrundsbillede',
          size: 'large'
        })}
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label" style="font-size:12px">Baggrundsvideo(er)</label>

          <!-- Video Shuffle Controls -->
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px;padding:10px;background:var(--bg-tertiary);border-radius:8px">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px">
              <input type="checkbox" ${section.videoShuffleEnabled ? 'checked' : ''} onchange="updateSectionField('${section.id}', 'videoShuffleEnabled', this.checked);this.closest('.form-group').querySelector('.shuffle-duration').style.display=this.checked?'flex':'none'">
              Shuffle videoer
            </label>
            <div class="shuffle-duration" style="display:${section.videoShuffleEnabled ? 'flex' : 'none'};align-items:center;gap:6px">
              <span style="font-size:11px;color:var(--muted)">Skift hver</span>
              <input type="number" class="input" min="3" max="120" value="${section.videoShuffleDuration || 10}" onchange="updateSectionField('${section.id}', 'videoShuffleDuration', parseInt(this.value))" style="width:60px;padding:6px 8px">
              <span style="font-size:11px;color:var(--muted)">sek</span>
            </div>
          </div>

          <!-- Video Liste -->
          <div id="hero-videos-list-${section.id}">
            ${(section.backgroundVideos || []).map((video, idx) => `
              <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;padding:10px;background:var(--bg-tertiary);border-radius:6px">
                <span style="font-size:11px;color:var(--muted);min-width:20px;font-weight:500">${idx + 1}.</span>
                <input type="text" class="input" value="${video.url || ''}" id="hero-video-${section.id}-${idx}" onchange="updateHeroVideo('${section.id}', ${idx}, 'url', this.value)" placeholder="Video URL" style="flex:1">
                <button type="button" class="btn btn-secondary" style="padding:6px 10px;font-size:11px" onclick="openMediaLibrary('hero-video-${section.id}-${idx}', '${section.id}', 'backgroundVideos.${idx}.url', 'video')">Bibliotek</button>
                <button type="button" class="btn" style="padding:6px 10px;color:var(--danger)" onclick="removeHeroVideo('${section.id}', ${idx})">Slet</button>
              </div>
            `).join('')}
          </div>

          <button type="button" class="btn btn-secondary" style="width:100%;margin-top:8px" onclick="addHeroVideo('${section.id}')">+ Tilføj video</button>

          <!-- Video Previews -->
          ${(section.backgroundVideos || []).length > 0 ? `
            <div style="margin-top:12px;display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px">
              ${section.backgroundVideos.map((video, idx) => video.url ? `
                <div style="border-radius:6px;overflow:hidden;background:#000;position:relative">
                  <video src="${video.url}" style="width:100%;height:80px;object-fit:cover" muted playsinline></video>
                  <div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.7);font-size:10px;color:white;padding:4px;text-align:center">${idx + 1}</div>
                </div>
              ` : '').join('')}
            </div>
          ` : '<div style="padding:20px;background:var(--bg-tertiary);border-radius:8px;text-align:center;color:var(--muted);font-size:12px;margin-top:8px">Ingen videoer tilføjet</div>'}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
          <div class="form-group">
            <label class="form-label" style="font-size:12px">Overlay Opacity (0-100)</label>
            <input type="range" min="0" max="100" value="${section.backgroundOverlay || 50}" oninput="this.nextElementSibling.textContent=this.value+'%'" onchange="updateSectionField('${section.id}', 'backgroundOverlay', parseInt(this.value))" style="width:100%">
            <span style="font-size:11px;color:var(--muted)">${section.backgroundOverlay || 50}%</span>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:12px">Animation</label>
            <select class="input" onchange="updateSectionField('${section.id}', 'animation', this.value)">
              <option value="none" ${section.animation === 'none' || !section.animation ? 'selected' : ''}>Ingen</option>
              <option value="fade" ${section.animation === 'fade' ? 'selected' : ''}>Fade In</option>
              <option value="slide" ${section.animation === 'slide' ? 'selected' : ''}>Slide Up</option>
              <option value="zoom" ${section.animation === 'zoom' ? 'selected' : ''}>Zoom In</option>
              <option value="bounce" ${section.animation === 'bounce' ? 'selected' : ''}>Bounce</option>
              <option value="pulse" ${section.animation === 'pulse' ? 'selected' : ''}>Pulse</option>
              <option value="slideLeft" ${section.animation === 'slideLeft' ? 'selected' : ''}>Slide fra venstre</option>
              <option value="slideRight" ${section.animation === 'slideRight' ? 'selected' : ''}>Slide fra højre</option>
              <option value="rotate" ${section.animation === 'rotate' ? 'selected' : ''}>Rotation</option>
              <option value="scale" ${section.animation === 'scale' ? 'selected' : ''}>Scale Up</option>
            </select>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label" style="font-size:12px">Knaptekst</label>
            <input type="text" class="input" value="${section.buttons?.[0]?.text || ''}" onchange="updateSectionButton('${section.id}', 0, 'text', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:12px">Knap URL</label>
            <input type="text" class="input" value="${section.buttons?.[0]?.url || ''}" onchange="updateSectionButton('${section.id}', 0, 'url', this.value)">
          </div>
        </div>
      `;
    case 'text':
      return `
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label" style="font-size:12px">Titel</label>
          <input type="text" class="input" value="${section.title || ''}" onchange="updateSectionField('${section.id}', 'title', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label" style="font-size:12px">Indhold</label>
          <textarea class="input" rows="4" onchange="updateSectionField('${section.id}', 'content', this.value)">${section.content || ''}</textarea>
        </div>
      `;
    case 'features':
      // Initialize tabs array if not present (4 fixed tabs)
      if (!section.tabs || section.tabs.length !== 4) {
        section.tabs = [
          { id: 'tab-1', tabLabel: 'Tab 1', headline: '', description: '', image: '', video: '' },
          { id: 'tab-2', tabLabel: 'Tab 2', headline: '', description: '', image: '', video: '' },
          { id: 'tab-3', tabLabel: 'Tab 3', headline: '', description: '', image: '', video: '' },
          { id: 'tab-4', tabLabel: 'Tab 4', headline: '', description: '', image: '', video: '' }
        ];
      }
      return `
        <div class="form-group" style="margin-bottom:16px">
          <label class="form-label" style="font-size:12px">Sektion Overskrift</label>
          <input type="text" class="input" value="${section.heading || ''}" onchange="updateSectionField('${section.id}', 'heading', this.value)" placeholder="Sektionens hovedtitel">
        </div>
        <div style="font-size:12px;font-weight:600;margin-bottom:12px;color:var(--text-secondary)">Tabs (4 faste)</div>
        ${section.tabs.map((tab, index) => `
          <details class="feature-tab-editor" style="margin-bottom:12px;background:var(--bg-tertiary);border-radius:8px;padding:12px">
            <summary style="cursor:pointer;font-weight:500;font-size:13px;margin-bottom:8px">Tab ${index + 1}: ${tab.tabLabel || 'Unavngivet'}</summary>
            <div style="padding-top:12px;display:flex;flex-direction:column;gap:10px">
              <div class="form-group">
                <label class="form-label" style="font-size:11px">Tab Label</label>
                <input type="text" class="input" value="${tab.tabLabel || ''}" onchange="updateFeatureTab('${section.id}', ${index}, 'tabLabel', this.value)" placeholder="Vis i tab">
              </div>
              <div class="form-group">
                <label class="form-label" style="font-size:11px">Overskrift</label>
                <input type="text" class="input" value="${tab.headline || ''}" onchange="updateFeatureTab('${section.id}', ${index}, 'headline', this.value)" placeholder="Indholdets overskrift">
              </div>
              <div class="form-group">
                <label class="form-label" style="font-size:11px">Beskrivelse</label>
                <textarea class="input" rows="2" onchange="updateFeatureTab('${section.id}', ${index}, 'description', this.value)" placeholder="Indholdets beskrivelse">${tab.description || ''}</textarea>
              </div>
              ${renderImagePicker({
                id: 'feature-tab-img-' + section.id + '-' + index,
                sectionId: section.id,
                field: 'tabs.' + index + '.image',
                currentValue: tab.image || '',
                label: 'Billede',
                size: 'medium'
              })}
              <div class="form-group">
                <label class="form-label" style="font-size:11px">Video URL (valgfrit)</label>
                <input type="text" class="input" value="${tab.video || ''}" onchange="updateFeatureTab('${section.id}', ${index}, 'video', this.value)" placeholder="Video URL (MP4)">
              </div>
            </div>
          </details>
        `).join('')}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
          <div class="form-group">
            <label class="form-label" style="font-size:12px">Layout</label>
            <select class="input" value="${section.layout || 'tabs'}" onchange="updateSectionField('${section.id}', 'layout', this.value)">
              <option value="tabs" ${section.layout === 'tabs' || !section.layout ? 'selected' : ''}>Tabs</option>
              <option value="grid" ${section.layout === 'grid' ? 'selected' : ''}>Grid</option>
              <option value="list" ${section.layout === 'list' ? 'selected' : ''}>Liste</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:12px">Kolonner (grid)</label>
            <select class="input" onchange="updateSectionField('${section.id}', 'columns', parseInt(this.value))">
              <option value="2" ${section.columns === 2 ? 'selected' : ''}>2</option>
              <option value="3" ${section.columns === 3 ? 'selected' : ''}>3</option>
              <option value="4" ${section.columns === 4 || !section.columns ? 'selected' : ''}>4</option>
            </select>
          </div>
        </div>
      `;
    case 'cta':
      return `
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label" style="font-size:12px">Overskrift</label>
          <input type="text" class="input" value="${section.title || ''}" onchange="updateSectionField('${section.id}', 'title', this.value)">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label" style="font-size:12px">Knaptekst</label>
            <input type="text" class="input" value="${section.button?.text || ''}" onchange="updateSectionCTAButton('${section.id}', 'text', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:12px">Knap URL</label>
            <input type="text" class="input" value="${section.button?.url || ''}" onchange="updateSectionCTAButton('${section.id}', 'url', this.value)">
          </div>
        </div>
      `;
    case 'testimonials':
      const testimonialItems = section.items || [];
      return `
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label" style="font-size:12px">Sektion Overskrift</label>
          <input type="text" class="input" value="${section.heading || ''}" onchange="updateSectionField('${section.id}', 'heading', this.value)" placeholder="Hvad siger vores kunder?">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
          <div class="form-group">
            <label class="form-label" style="font-size:12px">Layout</label>
            <select class="input" onchange="updateSectionField('${section.id}', 'layout', this.value)">
              <option value="carousel" ${section.layout === 'carousel' || !section.layout ? 'selected' : ''}>Karrusel (roterende)</option>
              <option value="grid" ${section.layout === 'grid' ? 'selected' : ''}>Grid</option>
              <option value="single" ${section.layout === 'single' ? 'selected' : ''}>Enkelt (stor)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:12px">Auto-rotation (sek)</label>
            <input type="number" class="input" value="${section.rotationInterval || 5}" min="2" max="30" onchange="updateSectionField('${section.id}', 'rotationInterval', parseInt(this.value))">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" style="font-size:12px;margin-bottom:8px;display:block">Citater (${testimonialItems.length})</label>
          <div id="testimonial-items-${section.id}" style="max-height:400px;overflow-y:auto">
            ${testimonialItems.map((item, idx) => `
              <details style="border:1px solid var(--border);padding:12px;border-radius:8px;margin-bottom:8px;background:var(--bg2)">
                <summary style="cursor:pointer;font-weight:500;font-size:13px;display:flex;align-items:center;gap:8px">
                  ${(item.image || item.avatar) ? `<img src="${item.image || item.avatar}" style="width:28px;height:28px;object-fit:cover;border-radius:50%">` : '<span style="width:28px;height:28px;background:var(--bg-tertiary);border-radius:50%;display:inline-block"></span>'}
                  <span>${item.author || item.name || 'Unavngivet'}</span>
                  <span style="color:var(--muted);font-weight:normal;font-size:11px;margin-left:auto">${item.role || ''}</span>
                </summary>
                <div style="padding-top:12px;display:flex;flex-direction:column;gap:8px">
                  <div class="form-group">
                    <label class="form-label" style="font-size:11px">Citat</label>
                    <textarea class="input" rows="3" placeholder="Hvad sagde de?" onchange="updateTestimonialItem('${section.id}', ${idx}, 'text', this.value)">${item.text || item.quote || ''}</textarea>
                  </div>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                    <div class="form-group">
                      <label class="form-label" style="font-size:11px">Navn</label>
                      <input type="text" class="input" placeholder="Navn" value="${item.author || item.name || ''}" onchange="updateTestimonialItem('${section.id}', ${idx}, 'author', this.value)">
                    </div>
                    <div class="form-group">
                      <label class="form-label" style="font-size:11px">Rolle/Firma</label>
                      <input type="text" class="input" placeholder="Rolle/Firma" value="${item.role || ''}" onchange="updateTestimonialItem('${section.id}', ${idx}, 'role', this.value)">
                    </div>
                  </div>
                  ${renderImagePicker({
                    id: 'testimonial-image-' + section.id + '-' + idx,
                    sectionId: section.id,
                    field: 'items.' + idx + '.image',
                    currentValue: item.image || item.avatar || '',
                    label: 'Profilbillede',
                    size: 'small',
                    shape: 'circle'
                  })}
                  <button class="btn btn-sm" style="background:var(--danger);color:white;margin-top:4px" onclick="removeTestimonialItem('${section.id}', ${idx})">Fjern citat</button>
                </div>
              </details>
            `).join('')}
          </div>
          <button class="btn btn-sm" onclick="addTestimonialItem('${section.id}')" style="margin-top:8px;width:100%">+ Tilføj citat</button>
        </div>
      `;
    case 'faq':
      return `
        <div class="form-group">
          <label class="form-label" style="font-size:12px">FAQ Items (JSON format)</label>
          <textarea class="input" rows="4" onchange="updateSectionField('${section.id}', 'items', JSON.parse(this.value || '[]'))">${JSON.stringify(section.items || [], null, 2)}</textarea>
          <p style="font-size:10px;color:var(--muted);margin-top:4px">Format: [{"question": "Spørgsmål", "answer": "Svar"}]</p>
        </div>
      `;
    case 'images':
      const galleryImages = section.images || [];
      const imagesArray = Array.isArray(galleryImages) ? galleryImages : [];
      const normalizedImages = imagesArray.map(img => typeof img === 'string' ? { url: img, alt: '' } : img);
      return `
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label" style="font-size:12px">Galleri Titel</label>
          <input type="text" class="input" value="${section.title || ''}" onchange="updateSectionField('${section.id}', 'title', this.value)">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
          <div class="form-group">
            <label class="form-label" style="font-size:12px">Layout</label>
            <select class="input" onchange="updateSectionField('${section.id}', 'layout', this.value)">
              <option value="grid" ${section.layout === 'grid' ? 'selected' : ''}>Grid</option>
              <option value="carousel" ${section.layout === 'carousel' ? 'selected' : ''}>Karrusel</option>
              <option value="masonry" ${section.layout === 'masonry' ? 'selected' : ''}>Masonry</option>
              <option value="single" ${section.layout === 'single' ? 'selected' : ''}>Enkelt</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:12px">Kolonner</label>
            <select class="input" onchange="updateSectionField('${section.id}', 'columns', parseInt(this.value))">
              <option value="2" ${section.columns === 2 ? 'selected' : ''}>2</option>
              <option value="3" ${section.columns === 3 || !section.columns ? 'selected' : ''}>3</option>
              <option value="4" ${section.columns === 4 ? 'selected' : ''}>4</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" style="font-size:12px;margin-bottom:8px;display:block">Billeder (${normalizedImages.length})</label>
          <div id="gallery-images-${section.id}" style="max-height:350px;overflow-y:auto">
            ${normalizedImages.map((img, idx) => `
              <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center;padding:8px;background:var(--bg2);border-radius:8px;border:1px solid var(--border)">
                ${img.url ? `<img src="${img.url}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;flex-shrink:0">` : '<div style="width:60px;height:60px;background:var(--border);border-radius:4px;flex-shrink:0"></div>'}
                <div style="flex:1;display:flex;flex-direction:column;gap:4px">
                  <input type="text" class="input" placeholder="Billede URL" value="${img.url || ''}" onchange="updateGalleryImage('${section.id}', ${idx}, 'url', this.value)">
                  <input type="text" class="input" placeholder="Alt tekst (SEO)" value="${img.alt || ''}" onchange="updateGalleryImage('${section.id}', ${idx}, 'alt', this.value)">
                </div>
                <button class="btn btn-sm" style="background:var(--danger);color:white;height:32px;flex-shrink:0" onclick="removeGalleryImage('${section.id}', ${idx})">X</button>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-sm" onclick="addGalleryImage('${section.id}')" style="margin-top:8px;width:100%">+ Tilføj billede</button>
        </div>
      `;
    case 'trusted':
      const trustedCards = section.cards || [];
      return `
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label" style="font-size:12px">Sektion Overskrift</label>
          <input type="text" class="input" value="${section.heading || ''}" onchange="updateSectionField('${section.id}', 'heading', this.value)">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
          <div class="form-group">
            <label class="form-label" style="font-size:12px">Layout</label>
            <select class="input" onchange="updateSectionField('${section.id}', 'layout', this.value)">
              <option value="carousel" ${section.layout === 'carousel' || !section.layout ? 'selected' : ''}>Karrusel</option>
              <option value="grid" ${section.layout === 'grid' ? 'selected' : ''}>Grid</option>
              <option value="masonry" ${section.layout === 'masonry' ? 'selected' : ''}>Masonry</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:12px">Animation</label>
            <select class="input" onchange="updateSectionField('${section.id}', 'animation', this.value)">
              <option value="none" ${section.animation === 'none' || !section.animation ? 'selected' : ''}>Ingen</option>
              <option value="fade" ${section.animation === 'fade' ? 'selected' : ''}>Fade In</option>
              <option value="slide" ${section.animation === 'slide' ? 'selected' : ''}>Slide</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" style="font-size:12px;margin-bottom:8px;display:block">Udtalelser (${trustedCards.length})</label>
          <div id="trusted-cards-${section.id}" style="max-height:400px;overflow-y:auto">
            ${trustedCards.map((card, idx) => `
              <details style="border:1px solid var(--border);padding:12px;border-radius:8px;margin-bottom:8px;background:var(--bg2)">
                <summary style="cursor:pointer;font-weight:500;font-size:13px;display:flex;align-items:center;gap:8px">
                  ${card.image ? `<img src="${card.image}" style="width:32px;height:32px;object-fit:cover;border-radius:50%">` : '<span style="width:32px;height:32px;background:var(--bg-tertiary);border-radius:50%;display:inline-block"></span>'}
                  <span>${card.name || 'Unavngivet'}</span>
                  <span style="color:var(--muted);font-weight:normal;font-size:11px;margin-left:auto">${card.role || ''}</span>
                </summary>
                <div style="padding-top:12px;display:flex;flex-direction:column;gap:8px">
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                    <div class="form-group">
                      <label class="form-label" style="font-size:11px">Navn</label>
                      <input type="text" class="input" placeholder="Navn" value="${card.name || ''}" onchange="updateReviewItem('${section.id}', ${idx}, 'name', this.value)">
                    </div>
                    <div class="form-group">
                      <label class="form-label" style="font-size:11px">Firma/Rolle</label>
                      <input type="text" class="input" placeholder="Firma/Rolle" value="${card.role || ''}" onchange="updateReviewItem('${section.id}', ${idx}, 'role', this.value)">
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label" style="font-size:11px">Udtalelse</label>
                    <textarea class="input" rows="2" placeholder="Udtalelse" onchange="updateReviewItem('${section.id}', ${idx}, 'quote', this.value)">${card.quote || ''}</textarea>
                  </div>
                  ${renderImagePicker({
                    id: 'trusted-img-' + section.id + '-' + idx,
                    sectionId: section.id,
                    field: 'cards.' + idx + '.image',
                    currentValue: card.image || '',
                    label: 'Profilbillede',
                    size: 'small',
                    shape: 'circle'
                  })}
                  <div class="form-group">
                    <label class="form-label" style="font-size:11px">Kort gradient baggrund (valgfrit)</label>
                    <input type="text" class="input" placeholder="linear-gradient(135deg, #667eea, #764ba2)" value="${card.gradient || ''}" onchange="updateReviewItem('${section.id}', ${idx}, 'gradient', this.value)">
                  </div>
                  <button class="btn btn-sm" style="background:var(--danger);color:white;margin-top:4px" onclick="removeReviewItem('${section.id}', ${idx})">Fjern udtalelse</button>
                </div>
              </details>
            `).join('')}
          </div>
          <button class="btn btn-sm" onclick="addReviewItem('${section.id}')" style="margin-top:8px;width:100%">+ Tilføj udtalelse</button>
        </div>
      `;
    case 'appleFeatures':
      return `
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label" style="font-size:12px">Sektion Overskrift</label>
          <input type="text" class="input" value="${section.heading || ''}" onchange="updateSectionField('${section.id}', 'heading', this.value)">
        </div>
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label" style="font-size:12px">Beskrivelse</label>
          <textarea class="input" rows="2" onchange="updateSectionField('${section.id}', 'description', this.value)">${section.description || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label" style="font-size:12px">Feature Cards (JSON)</label>
          <textarea class="input" rows="8" onchange="updateSectionField('${section.id}', 'cards', JSON.parse(this.value || '[]'))">${JSON.stringify(section.cards || [], null, 2)}</textarea>
          <p style="font-size:10px;color:var(--muted);margin-top:4px">Format: [{"badge": "Kategori", "title": "Titel", "description": "Beskrivelse"}]</p>
        </div>
      `;
    case 'bento':
      return `
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label" style="font-size:12px">Sektion Overskrift (HTML tilladt)</label>
          <textarea class="input" rows="2" onchange="updateSectionField('${section.id}', 'heading', this.value)">${section.heading || ''}</textarea>
        </div>
        ${renderImagePicker({
          id: 'bento-hero-' + section.id,
          sectionId: section.id,
          field: 'heroImage',
          currentValue: section.heroImage || '',
          label: 'Hero Billede',
          size: 'large'
        })}
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label" style="font-size:12px">Hero Overlay Tekst (HTML tilladt)</label>
          <textarea class="input" rows="2" onchange="updateSectionField('${section.id}', 'heroOverlayText', this.value)">${section.heroOverlayText || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label" style="font-size:12px">Bento Cards (JSON)</label>
          <textarea class="input" rows="6" onchange="updateSectionField('${section.id}', 'cards', JSON.parse(this.value || '[]'))">${JSON.stringify(section.cards || [], null, 2)}</textarea>
          <p style="font-size:10px;color:var(--muted);margin-top:4px">Format: [{"label": "Label tekst", "title": "Titel", "image": "billede URL"}]</p>
        </div>
      `;
    case 'beliefs':
      return `
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label" style="font-size:12px">Sektion Overskrift</label>
          <input type="text" class="input" value="${section.heading || ''}" onchange="updateSectionField('${section.id}', 'heading', this.value)">
        </div>
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label" style="font-size:12px">Undertitel</label>
          <input type="text" class="input" value="${section.subtitle || ''}" onchange="updateSectionField('${section.id}', 'subtitle', this.value)">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
          <div class="form-group">
            <label class="form-label" style="font-size:12px">Forfatter Navn</label>
            <input type="text" class="input" value="${section.author?.name || ''}" onchange="updateSectionAuthor('${section.id}', 'name', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:12px">Forfatter Rolle</label>
            <input type="text" class="input" value="${section.author?.role || ''}" onchange="updateSectionAuthor('${section.id}', 'role', this.value)">
          </div>
        </div>
        ${renderImagePicker({
          id: 'beliefs-author-' + section.id,
          sectionId: section.id,
          field: 'author.image',
          currentValue: section.author?.image || '',
          label: 'Forfatter Billede',
          size: 'small',
          shape: 'circle'
        })}
        <div class="form-group">
          <label class="form-label" style="font-size:12px">Belief Items (JSON)</label>
          <textarea class="input" rows="6" onchange="updateSectionField('${section.id}', 'items', JSON.parse(this.value || '[]'))">${JSON.stringify(section.items || [], null, 2)}</textarea>
          <p style="font-size:10px;color:var(--muted);margin-top:4px">Format: [{"heading": "Overskrift", "text": "Beskrivelse"}]</p>
        </div>
      `;
    case 'logocloud':
      return `
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label" style="font-size:12px">Overskrift</label>
          <input type="text" class="input" value="${section.heading || ''}" onchange="updateSectionField('${section.id}', 'heading', this.value)">
        </div>
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label" style="font-size:12px">Underoverskrift</label>
          <input type="text" class="input" value="${section.subheading || ''}" onchange="updateSectionField('${section.id}', 'subheading', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label" style="font-size:12px">Logos (JSON)</label>
          <textarea class="input" rows="6" onchange="updateSectionField('${section.id}', 'logos', JSON.parse(this.value || '[]'))">${JSON.stringify(section.logos || [], null, 2)}</textarea>
          <p style="font-size:10px;color:var(--muted);margin-top:4px">Format: [{"name": "Firmanavn", "url": "https://example.com"}]</p>
        </div>
      `;
    case 'footer':
      return `
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label" style="font-size:12px">Footer Kolonner (JSON)</label>
          <textarea class="input" rows="8" onchange="updateSectionField('${section.id}', 'columns', JSON.parse(this.value || '[]'))">${JSON.stringify(section.columns || [], null, 2)}</textarea>
          <p style="font-size:10px;color:var(--muted);margin-top:4px">Format: [{"title": "PRODUKTER", "links": [{"text": "Link tekst", "url": "/side.html"}]}]</p>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
          <div class="form-group">
            <label class="form-label" style="font-size:12px">Kontakt Telefon</label>
            <input type="text" class="input" value="${section.contact?.phone || ''}" onchange="updateFooterContact('${section.id}', 'phone', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:12px">Kontakt Email</label>
            <input type="text" class="input" value="${section.contact?.email || ''}" onchange="updateFooterContact('${section.id}', 'email', this.value)">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" style="font-size:12px">Copyright Tekst</label>
          <input type="text" class="input" value="${section.copyright || ''}" onchange="updateSectionField('${section.id}', 'copyright', this.value)">
        </div>
      `;
    case 'chat-demo':
      return `
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label" style="font-size:12px">Bruger Besked</label>
          <textarea class="input" rows="3" onchange="updateSectionField('${section.id}', 'userMessage', this.value)">${section.userMessage || ''}</textarea>
        </div>
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label" style="font-size:12px">AI Svar</label>
          <textarea class="input" rows="4" onchange="updateSectionField('${section.id}', 'botMessage', this.value)">${section.botMessage || ''}</textarea>
        </div>
        ${renderImagePicker({
          id: 'chat-avatar-' + section.id,
          sectionId: section.id,
          field: 'userAvatar',
          currentValue: section.userAvatar || '',
          label: 'Bruger Avatar',
          size: 'small',
          shape: 'circle'
        })}
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:12px">
          <div class="form-group">
            <label class="form-label" style="font-size:12px">Bruger Delay (ms)</label>
            <input type="number" class="input" min="0" max="5000" value="${section.userDelay || 500}" onchange="updateSectionField('${section.id}', 'userDelay', parseInt(this.value))">
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:12px">Bot Delay (ms)</label>
            <input type="number" class="input" min="0" max="5000" value="${section.botDelay || 1200}" onchange="updateSectionField('${section.id}', 'botDelay', parseInt(this.value))">
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:12px">Tekst Expand (ms)</label>
            <input type="number" class="input" min="0" max="5000" value="${section.textExpandDelay || 1800}" onchange="updateSectionField('${section.id}', 'textExpandDelay', parseInt(this.value))">
          </div>
        </div>
      `;
    default:
      return '<p style="color:var(--muted)">Ukendt sektionstype</p>';
  }
}

// Update section field
function updateSectionField(sectionId, field, value) {
  const page = getCurrentCMSPage();
  if (!page) return;

  const section = page.sections.find(s => s.id === sectionId);
  if (section) {
    section[field] = value;
    page.updatedAt = new Date().toISOString();
    markCMSChanged();
  }
}

// Add a new hero video
function addHeroVideo(sectionId) {
  const page = getCurrentCMSPage();
  if (!page) return;

  const section = page.sections.find(s => s.id === sectionId);
  if (!section) return;

  if (!section.backgroundVideos) section.backgroundVideos = [];
  section.backgroundVideos.push({ url: '', duration: section.videoShuffleDuration || 10 });

  page.updatedAt = new Date().toISOString();
  markCMSChanged();
  renderCMSSectionsList();
}

// Remove a hero video
function removeHeroVideo(sectionId, videoIndex) {
  const page = getCurrentCMSPage();
  if (!page) return;

  const section = page.sections.find(s => s.id === sectionId);
  if (!section || !section.backgroundVideos) return;

  section.backgroundVideos.splice(videoIndex, 1);
  page.updatedAt = new Date().toISOString();
  markCMSChanged();
  renderCMSSectionsList();
}

// Update a hero video field
function updateHeroVideo(sectionId, videoIndex, field, value) {
  const page = getCurrentCMSPage();
  if (!page) return;

  const section = page.sections.find(s => s.id === sectionId);
  if (!section || !section.backgroundVideos || !section.backgroundVideos[videoIndex]) return;

  section.backgroundVideos[videoIndex][field] = value;
  page.updatedAt = new Date().toISOString();
  markCMSChanged();
}

// Update section button (hero)
function updateSectionButton(sectionId, buttonIndex, field, value) {
  const page = getCurrentCMSPage();
  if (!page) return;

  const section = page.sections.find(s => s.id === sectionId);
  if (section) {
    if (!section.buttons) section.buttons = [{ text: '', url: '', variant: 'primary' }];
    if (!section.buttons[buttonIndex]) section.buttons[buttonIndex] = { text: '', url: '', variant: 'primary' };
    section.buttons[buttonIndex][field] = value;
    page.updatedAt = new Date().toISOString();
    markCMSChanged();
  }
}

// Update section CTA button
function updateSectionCTAButton(sectionId, field, value) {
  const page = getCurrentCMSPage();
  if (!page) return;

  const section = page.sections.find(s => s.id === sectionId);
  if (section) {
    if (!section.button) section.button = { text: '', url: '', variant: 'primary' };
    section.button[field] = value;
    page.updatedAt = new Date().toISOString();
    markCMSChanged();
  }
}

// Update section features
function updateSectionFeatures(sectionId, value) {
  const page = getCurrentCMSPage();
  if (!page) return;

  const section = page.sections.find(s => s.id === sectionId);
  if (section) {
    section.features = value.split('\n').filter(line => line.trim()).map((title, i) => ({
      id: 'feature-' + i,
      title: title.trim(),
      description: ''
    }));
    page.updatedAt = new Date().toISOString();
    markCMSChanged();
  }
}

// Update feature tab (4 fixed tabs)
function updateFeatureTab(sectionId, tabIndex, field, value) {
  const page = getCurrentCMSPage();
  if (!page) return;

  const section = page.sections.find(s => s.id === sectionId);
  if (section) {
    // Initialize tabs if not present
    if (!section.tabs || section.tabs.length !== 4) {
      section.tabs = [
        { id: 'tab-1', tabLabel: 'Tab 1', headline: '', description: '', image: '', video: '' },
        { id: 'tab-2', tabLabel: 'Tab 2', headline: '', description: '', image: '', video: '' },
        { id: 'tab-3', tabLabel: 'Tab 3', headline: '', description: '', image: '', video: '' },
        { id: 'tab-4', tabLabel: 'Tab 4', headline: '', description: '', image: '', video: '' }
      ];
    }
    section.tabs[tabIndex][field] = value;
    page.updatedAt = new Date().toISOString();
    markCMSChanged();
    // Re-render to update summary text
    if (field === 'tabLabel') {
      renderCMSSectionsList();
    }
  }
}

// Open media library for feature tab image
function openMediaLibraryForFeatureTab(sectionId, tabIndex) {
  const targetId = `feature-tab-img-${sectionId}-${tabIndex}`;
  openMediaLibrary(targetId, sectionId, `tabs.${tabIndex}.image`);
}

// Update section images
function updateSectionImages(sectionId, value) {
  const page = getCurrentCMSPage();
  if (!page) return;

  const section = page.sections.find(s => s.id === sectionId);
  if (section) {
    section.images = value.split('\n').filter(line => line.trim());
    page.updatedAt = new Date().toISOString();
    markCMSChanged();
  }
}

// Update review/testimonial item
function updateReviewItem(sectionId, itemIndex, field, value) {
  const page = getCurrentCMSPage();
  if (!page) return;

  const section = page.sections.find(s => s.id === sectionId);
  if (section && section.cards && section.cards[itemIndex]) {
    section.cards[itemIndex][field] = value;
    page.updatedAt = new Date().toISOString();
    markCMSChanged();
  }
}

// Add new review/testimonial item
function addReviewItem(sectionId) {
  const page = getCurrentCMSPage();
  if (!page) return;

  const section = page.sections.find(s => s.id === sectionId);
  if (section) {
    if (!section.cards) section.cards = [];
    section.cards.push({
      name: '',
      role: '',
      quote: '',
      image: '',
      gradient: ''
    });
    page.updatedAt = new Date().toISOString();
    markCMSChanged();
    renderCMSPageEditor();
  }
}

// Remove review/testimonial item
function removeReviewItem(sectionId, itemIndex) {
  const page = getCurrentCMSPage();
  if (!page) return;

  const section = page.sections.find(s => s.id === sectionId);
  if (section && section.cards) {
    section.cards.splice(itemIndex, 1);
    page.updatedAt = new Date().toISOString();
    markCMSChanged();
    renderCMSPageEditor();
  }
}

// Update testimonial item
function updateTestimonialItem(sectionId, itemIndex, field, value) {
  const page = getCurrentCMSPage();
  if (!page) return;

  const section = page.sections.find(s => s.id === sectionId);
  if (section && section.items && section.items[itemIndex]) {
    section.items[itemIndex][field] = value;
    page.updatedAt = new Date().toISOString();
    markCMSChanged();
  }
}

// Add new testimonial item
function addTestimonialItem(sectionId) {
  const page = getCurrentCMSPage();
  if (!page) return;

  const section = page.sections.find(s => s.id === sectionId);
  if (section) {
    if (!section.items) section.items = [];
    section.items.push({
      text: '',
      author: '',
      role: '',
      image: ''
    });
    page.updatedAt = new Date().toISOString();
    markCMSChanged();
    renderCMSSectionsList();
  }
}

// Remove testimonial item
function removeTestimonialItem(sectionId, itemIndex) {
  const page = getCurrentCMSPage();
  if (!page) return;

  const section = page.sections.find(s => s.id === sectionId);
  if (section && section.items) {
    section.items.splice(itemIndex, 1);
    page.updatedAt = new Date().toISOString();
    markCMSChanged();
    renderCMSSectionsList();
  }
}

// Open media library for testimonial avatar
function openMediaLibraryForTestimonial(sectionId, itemIndex) {
  openMediaLibrary({
    sectionId,
    itemIndex,
    type: 'testimonial',
    inputId: `testimonial-avatar-${sectionId}-${itemIndex}`
  });
}

// Update gallery image
function updateGalleryImage(sectionId, imageIndex, field, value) {
  const page = getCurrentCMSPage();
  if (!page) return;

  const section = page.sections.find(s => s.id === sectionId);
  if (section) {
    // Normalize images array to objects
    if (!section.images) section.images = [];
    section.images = section.images.map(img => typeof img === 'string' ? { url: img, alt: '' } : img);

    if (section.images[imageIndex]) {
      section.images[imageIndex][field] = value;
      page.updatedAt = new Date().toISOString();
      markCMSChanged();
    }
  }
}

// Add new gallery image
function addGalleryImage(sectionId) {
  const page = getCurrentCMSPage();
  if (!page) return;

  const section = page.sections.find(s => s.id === sectionId);
  if (section) {
    if (!section.images) section.images = [];
    // Normalize existing images
    section.images = section.images.map(img => typeof img === 'string' ? { url: img, alt: '' } : img);
    section.images.push({ url: '', alt: '' });
    page.updatedAt = new Date().toISOString();
    markCMSChanged();
    renderCMSPageEditor();
  }
}

// Remove gallery image
function removeGalleryImage(sectionId, imageIndex) {
  const page = getCurrentCMSPage();
  if (!page) return;

  const section = page.sections.find(s => s.id === sectionId);
  if (section && section.images) {
    section.images.splice(imageIndex, 1);
    page.updatedAt = new Date().toISOString();
    markCMSChanged();
    renderCMSPageEditor();
  }
}

// Update section author (for beliefs section)
function updateSectionAuthor(sectionId, field, value) {
  const page = getCurrentCMSPage();
  if (!page) return;

  const section = page.sections.find(s => s.id === sectionId);
  if (section) {
    if (!section.author) section.author = { name: '', role: '', image: '' };
    section.author[field] = value;
    page.updatedAt = new Date().toISOString();
    markCMSChanged();
  }
}

// Update footer contact (for footer section)
function updateFooterContact(sectionId, field, value) {
  const page = getCurrentCMSPage();
  if (!page) return;

  const section = page.sections.find(s => s.id === sectionId);
  if (section) {
    if (!section.contact) section.contact = { phone: '', email: '' };
    section.contact[field] = value;
    page.updatedAt = new Date().toISOString();
    markCMSChanged();
  }
}

// Toggle add section dropdown
function toggleAddSectionDropdown() {
  const dropdown = document.getElementById('add-section-dropdown');
  if (dropdown) {
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  }
}

// Add section to page
function addSectionToPage(type) {
  const page = getCurrentCMSPage();
  if (!page) return;

  const newSection = {
    id: 'section-' + Date.now(),
    type: type,
    order: page.sections.length,
    isVisible: true,
    padding: 'medium'
  };

  // Add type-specific defaults
  switch (type) {
    case 'hero':
      newSection.headline = 'Ny Hero Overskrift';
      newSection.subheadline = '';
      newSection.alignment = 'center';
      newSection.buttons = [{ text: 'Kom i gang', url: '#', variant: 'primary' }];
      break;
    case 'text':
      newSection.title = 'Ny Tekstsektion';
      newSection.content = '';
      newSection.alignment = 'left';
      break;
    case 'features':
      newSection.features = [];
      newSection.layout = 'grid';
      newSection.columns = 3;
      break;
    case 'cta':
      newSection.title = 'Klar til at komme i gang?';
      newSection.description = '';
      newSection.button = { text: 'Kontakt os', url: '#', variant: 'primary' };
      newSection.style = 'simple';
      break;
    case 'testimonials':
      newSection.items = [];
      newSection.layout = 'carousel';
      break;
    case 'faq':
      newSection.items = [];
      break;
    case 'images':
      newSection.images = [];
      newSection.layout = 'gallery';
      break;
    case 'trusted':
      newSection.heading = 'Betroet af tusindvis af restauratører';
      newSection.cards = [];
      break;
    case 'appleFeatures':
      newSection.heading = 'Alt hvad du behøver';
      newSection.description = '';
      newSection.cards = [];
      break;
    case 'bento':
      newSection.heading = 'Giv din restaurant den samme<br>teknologi som de store brands';
      newSection.heroImage = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop';
      newSection.heroOverlayText = 'Dine kunder er vant til at bestille på telefonen. Derfor giver vi din restaurant sin egen <strong>mobile app</strong>.';
      newSection.cards = [
        { label: 'Få højere Google rankings med din AI-powered', title: 'restaurant hjemmeside.', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop' },
        { label: 'Vækst dit salg med et', title: 'online bestillingssystem modelleret efter de store brands.', image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=600&h=400&fit=crop' }
      ];
      break;
    case 'beliefs':
      newSection.heading = 'Vores overbevisninger';
      newSection.subtitle = '';
      newSection.author = { name: '', role: '', image: '' };
      newSection.items = [];
      break;
    case 'logocloud':
      newSection.heading = 'Trusted by the world\'s most innovative teams';
      newSection.subheading = 'Join thousands of developers and designers who are already building with Smoothui';
      newSection.logos = [
        { name: 'Strava', url: 'https://strava.com' },
        { name: 'Descript', url: 'https://descript.com' },
        { name: 'Duolingo', url: 'https://duolingo.com' },
        { name: 'Faire', url: 'https://faire.com' },
        { name: 'Clearbit', url: 'https://clearbit.com' }
      ];
      break;
    case 'footer':
      newSection.columns = [
        { title: 'PRODUKTER', links: [{ text: 'Restaurant Hjemmeside', url: 'restaurant-hjemmeside.html' }, { text: 'Online Bestilling', url: 'online-bestilling.html' }] },
        { title: 'RESSOURCER', links: [{ text: 'Case Studies', url: 'case-studies.html' }, { text: 'SEO for Restauranter', url: 'seo-for-restauranter.html' }] },
        { title: 'VIRKSOMHED', links: [{ text: 'Om os', url: 'om-os.html' }, { text: 'Karriere', url: 'karriere.html' }] },
        { title: 'SUPPORT', links: [{ text: 'Kontakt', url: '#' }] }
      ];
      newSection.contact = { phone: '+45 70 12 34 56', email: 'support@flow.dk' };
      newSection.copyright = '© 2024 Flow. Alle rettigheder forbeholdes.';
      break;
    case 'chat-demo':
      newSection.userMessage = 'Hej, jeg vil gerne bestille 2x Margherita og 1x Pepperoni til levering kl. 18:30';
      newSection.botMessage = 'Tak for din bestilling! Jeg har modtaget: 2x Margherita (178 kr) og 1x Pepperoni (99 kr). Total: 277 kr. Levering kl. 18:30 til din adresse. Du modtager SMS når maden er på vej!';
      newSection.userAvatar = 'https://randomuser.me/api/portraits/women/79.jpg';
      newSection.userDelay = 500;
      newSection.botDelay = 1200;
      newSection.textExpandDelay = 1800;
      break;
  }

  page.sections.push(newSection);
  page.updatedAt = new Date().toISOString();
  markCMSChanged();

  // Close dropdown and re-render
  document.getElementById('add-section-dropdown').style.display = 'none';
  renderCMSSectionsList();
}

// Delete section from page
function deleteSectionFromPage(sectionId) {
  const page = getCurrentCMSPage();
  if (!page) return;

  if (!confirm('Er du sikker på at du vil slette denne sektion?')) return;

  page.sections = page.sections.filter(s => s.id !== sectionId);
  // Re-order remaining sections
  page.sections.forEach((s, i) => s.order = i);
  page.updatedAt = new Date().toISOString();
  markCMSChanged();
  renderCMSSectionsList();
}

// Move section up
function moveSectionUp(sectionId) {
  const page = getCurrentCMSPage();
  if (!page) return;

  const sortedSections = [...page.sections].sort((a, b) => a.order - b.order);
  const index = sortedSections.findIndex(s => s.id === sectionId);
  if (index <= 0) return;

  // Swap orders
  const temp = sortedSections[index].order;
  sortedSections[index].order = sortedSections[index - 1].order;
  sortedSections[index - 1].order = temp;

  page.updatedAt = new Date().toISOString();
  markCMSChanged();
  renderCMSSectionsList();
}

// Move section down
function moveSectionDown(sectionId) {
  const page = getCurrentCMSPage();
  if (!page) return;

  const sortedSections = [...page.sections].sort((a, b) => a.order - b.order);
  const index = sortedSections.findIndex(s => s.id === sectionId);
  if (index < 0 || index >= sortedSections.length - 1) return;

  // Swap orders
  const temp = sortedSections[index].order;
  sortedSections[index].order = sortedSections[index + 1].order;
  sortedSections[index + 1].order = temp;

  page.updatedAt = new Date().toISOString();
  markCMSChanged();
  renderCMSSectionsList();
}

// Toggle section visibility
function toggleSectionVisibility(sectionId) {
  const page = getCurrentCMSPage();
  if (!page) return;

  const section = page.sections.find(s => s.id === sectionId);
  if (section) {
    section.isVisible = !section.isVisible;
    page.updatedAt = new Date().toISOString();
    markCMSChanged();
    renderCMSSectionsList();
  }
}

// Add new CMS page
function addNewCMSPage() {
  const newPage = {
    id: 'page-' + Date.now(),
    title: 'Ny Side',
    slug: 'ny-side.html',
    description: 'Ny side beskrivelse',
    status: 'draft',
    template: 'standard',
    isActive: false,
    seo: {
      title: 'Ny Side | Flow',
      description: '',
      keywords: []
    },
    sections: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  cmsPages.unshift(newPage);
  markCMSChanged();
  renderCMSPagesList();
  selectCMSPage(newPage.id);
}

// Delete current page
function deleteCurrentPage() {
  const page = getCurrentCMSPage();
  if (!page) return;

  if (!confirm(`Er du sikker på at du vil slette "${page.title}"?`)) return;

  cmsPages = cmsPages.filter(p => p.id !== page.id);
  currentCMSPageId = null;
  markCMSChanged();
  renderCMSPagesList();
  renderCMSPageEditor();
}

// Duplicate current page
function duplicateCurrentPage() {
  const page = getCurrentCMSPage();
  if (!page) return;

  const duplicated = JSON.parse(JSON.stringify(page));
  duplicated.id = 'page-' + Date.now();
  duplicated.title = page.title + ' (Kopi)';
  duplicated.slug = page.slug.replace('.html', '-kopi.html');
  duplicated.status = 'draft';
  duplicated.createdAt = new Date().toISOString();
  duplicated.updatedAt = new Date().toISOString();

  cmsPages.unshift(duplicated);
  markCMSChanged();
  renderCMSPagesList();
  selectCMSPage(duplicated.id);
  toast('Side duplikeret', 'success');
}

// Toggle page publish status
function togglePagePublish() {
  const page = getCurrentCMSPage();
  if (!page) return;

  page.status = page.status === 'published' ? 'draft' : 'published';
  page.updatedAt = new Date().toISOString();
  markCMSChanged();
  renderCMSPagesList();
  renderCMSPageEditor();
}

// Preview current page
function previewCurrentPage() {
  const page = getCurrentCMSPage();
  if (page) {
    window.open('landing-pages/' + page.slug, '_blank');
  }
}

// Schedule page changes
function schedulePageChanges() {
  const page = getCurrentCMSPage();
  if (!page) {
    toast('Vælg først en side at planlægge', 'warning');
    return;
  }

  // Clean up any existing schedule modal
  const existing = document.getElementById('schedule-modal');
  if (existing) existing.remove();

  // Get minimum datetime (now + 1 minute)
  const now = new Date();
  now.setMinutes(now.getMinutes() + 1);
  const minDatetime = now.toISOString().slice(0, 16);

  const pendingSchedules = (page.scheduledChanges || []).filter(s => s.status === 'pending');

  let pendingHTML = '';
  if (pendingSchedules.length > 0) {
    pendingHTML = `
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
        <label class="form-label">Planlagte ændringer (${pendingSchedules.length})</label>
        ${pendingSchedules.map(s => `
          <div style="padding:12px;background:var(--bg2);border-radius:8px;margin-top:8px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <span style="font-size:13px;font-weight:500">${new Date(s.scheduledFor).toLocaleString('da-DK')}</span>
              <span style="font-size:11px;color:var(--muted)">${getTimeUntil(s.scheduledFor)}</span>
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-sm" onclick="editScheduledChange('${s.id}')" style="flex:1">Rediger tid</button>
              <button class="btn btn-sm" style="background:var(--danger);color:white" onclick="cancelScheduledChange('${s.id}')">Slet</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  const modal = document.createElement('div');
  modal.className = 'modal-overlay active';
  modal.id = 'schedule-modal';
  modal.innerHTML = `
    <div class="modal" style="max-width:500px">
      <div class="modal-header">
        <div class="modal-title">Planlæg ændringer</div>
        <button class="modal-close" onclick="closeScheduleModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group" style="margin-bottom:16px">
          <label class="form-label">Dato og tid for offentliggørelse</label>
          <input type="datetime-local" class="input" id="schedule-datetime" min="${minDatetime}" style="width:100%">
        </div>
        <p style="font-size:12px;color:var(--muted)">
          De nuværende ændringer vil blive gemt og automatisk publiceret på det valgte tidspunkt.
        </p>
        ${pendingHTML}
      </div>
      <div class="modal-footer" style="padding:16px 24px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary" onclick="closeScheduleModal()">Luk</button>
        <button class="btn btn-primary" onclick="confirmSchedule()">Planlæg nu</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// Get time until scheduled change
function getTimeUntil(dateString) {
  const target = new Date(dateString);
  const now = new Date();
  const diff = target - now;

  if (diff < 0) return 'Forpasset';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `om ${days} dag${days > 1 ? 'e' : ''}`;
  } else if (hours > 0) {
    return `om ${hours}t ${minutes}m`;
  } else {
    return `om ${minutes} min`;
  }
}

// Close schedule modal
function closeScheduleModal() {
  const modal = document.getElementById('schedule-modal');
  if (modal) modal.remove();
}

// Confirm schedule
function confirmSchedule() {
  const datetime = document.getElementById('schedule-datetime').value;
  if (!datetime) {
    toast('Vælg en dato og tid', 'error');
    return;
  }

  const scheduledTime = new Date(datetime);
  if (scheduledTime <= new Date()) {
    toast('Tidspunktet skal være i fremtiden', 'error');
    return;
  }

  const page = getCurrentCMSPage();
  if (!page) return;

  // Create scheduled change
  const scheduledChange = {
    id: 'schedule-' + Date.now(),
    sections: JSON.parse(JSON.stringify(page.sections)),
    scheduledFor: scheduledTime.toISOString(),
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  if (!page.scheduledChanges) page.scheduledChanges = [];
  page.scheduledChanges.push(scheduledChange);

  page.updatedAt = new Date().toISOString();
  markCMSChanged();

  closeScheduleModal();
  toast('Ændringer planlagt til ' + scheduledTime.toLocaleString('da-DK'), 'success');
  updateScheduleBadge();
  renderCMSPageEditor();
}

// Edit scheduled change time
function editScheduledChange(scheduleId) {
  const page = getCurrentCMSPage();
  if (!page || !page.scheduledChanges) return;

  const schedule = page.scheduledChanges.find(s => s.id === scheduleId);
  if (!schedule) return;

  const currentTime = new Date(schedule.scheduledFor).toISOString().slice(0, 16);
  const now = new Date();
  now.setMinutes(now.getMinutes() + 1);
  const minDatetime = now.toISOString().slice(0, 16);

  const newTime = prompt('Ny tid (YYYY-MM-DDTHH:MM):', currentTime);
  if (!newTime) return;

  const newDate = new Date(newTime);
  if (isNaN(newDate.getTime()) || newDate <= new Date()) {
    toast('Ugyldigt tidspunkt', 'error');
    return;
  }

  schedule.scheduledFor = newDate.toISOString();
  page.updatedAt = new Date().toISOString();
  markCMSChanged();
  toast('Planlagt tidspunkt opdateret', 'success');
  closeScheduleModal();
  schedulePageChanges(); // Reopen modal to show updated time
}

// Preview scheduled changes
function previewScheduledChanges(scheduleId) {
  const page = getCurrentCMSPage();
  if (!page || !page.scheduledChanges) return;

  const schedule = page.scheduledChanges.find(s => s.id === scheduleId);
  if (!schedule) return;

  // Store scheduled sections temporarily for preview
  localStorage.setItem('orderflow_cms_preview', JSON.stringify({
    pageSlug: page.slug,
    sections: schedule.sections
  }));

  // Open preview with query parameter
  window.open('landing-pages/' + page.slug + '?preview=scheduled', '_blank');
}

// Cancel scheduled change
function cancelScheduledChange(scheduleId) {
  const page = getCurrentCMSPage();
  if (!page || !page.scheduledChanges) return;

  const idx = page.scheduledChanges.findIndex(s => s.id === scheduleId);
  if (idx !== -1) {
    page.scheduledChanges.splice(idx, 1); // Actually remove, not just mark cancelled
    page.updatedAt = new Date().toISOString();
    markCMSChanged();
    closeScheduleModal();
    toast('Planlagt ændring slettet', 'success');
    updateScheduleBadge();
    renderCMSPageEditor();
  }
}

// Update schedule badge on the Planlæg button
function updateScheduleBadge() {
  const page = getCurrentCMSPage();
  const pendingCount = page?.scheduledChanges?.filter(s => s.status === 'pending').length || 0;

  const scheduleBtn = document.getElementById('cms-schedule-btn');
  if (scheduleBtn) {
    // Remove existing badge
    const existingBadge = scheduleBtn.querySelector('.schedule-badge');
    if (existingBadge) existingBadge.remove();

    // Add badge if there are pending schedules
    if (pendingCount > 0) {
      const badge = document.createElement('span');
      badge.className = 'schedule-badge';
      badge.textContent = pendingCount;
      badge.style.cssText = 'position:absolute;top:-6px;right:-6px;background:var(--primary);color:white;font-size:10px;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 4px';
      scheduleBtn.style.position = 'relative';
      scheduleBtn.appendChild(badge);
    }
  }
}

// Update current page title
function updateCurrentPageTitle() {
  const page = getCurrentCMSPage();
  if (!page) return;

  const input = document.getElementById('cms-page-title-input');
  if (input) {
    page.title = input.value;
    page.updatedAt = new Date().toISOString();
    markCMSChanged();
    renderCMSPagesList();
  }
}

// Update current page SEO
function updateCurrentPageSEO() {
  const page = getCurrentCMSPage();
  if (!page) return;

  page.seo = {
    title: document.getElementById('cms-seo-title')?.value || '',
    description: document.getElementById('cms-seo-description')?.value || '',
    keywords: (document.getElementById('cms-seo-keywords')?.value || '').split(',').map(k => k.trim()).filter(k => k)
  };
  page.updatedAt = new Date().toISOString();
  markCMSChanged();
}

// Update current page slug
function updateCurrentPageSlug() {
  const page = getCurrentCMSPage();
  if (!page) return;

  const input = document.getElementById('cms-page-slug');
  if (input) {
    page.slug = input.value.replace(/[^a-z0-9-]/g, '') + '.html';
    page.updatedAt = new Date().toISOString();
    markCMSChanged();
  }
}

// Update current page template
function updateCurrentPageTemplate() {
  const page = getCurrentCMSPage();
  if (!page) return;

  const select = document.getElementById('cms-page-template');
  if (select) {
    page.template = select.value;
    page.updatedAt = new Date().toISOString();
    markCMSChanged();
  }
}

// Update current page active status
function updateCurrentPageActive() {
  const page = getCurrentCMSPage();
  if (!page) return;

  const checkbox = document.getElementById('cms-page-active');
  if (checkbox) {
    page.isActive = checkbox.checked;
    page.updatedAt = new Date().toISOString();
    markCMSChanged();
  }
}

// Update current page cookie banner setting
function updateCurrentPageCookieBanner() {
  const page = getCurrentCMSPage();
  if (!page) return;

  const checkbox = document.getElementById('cms-page-cookie-banner');
  if (checkbox) {
    page.showCookieBanner = checkbox.checked;
    page.updatedAt = new Date().toISOString();
    markCMSChanged();
  }
}

// Open CMS Page Settings Modal
function openCMSSettingsModal() {
  const page = getCurrentCMSPage();
  if (!page) {
    toast('Vælg først en side', 'warning');
    return;
  }

  // Remove existing modal if open
  const existing = document.getElementById('cms-settings-dynamic-modal');
  if (existing) existing.remove();

  const slugValue = (page.slug || '').replace('.html', '');
  const templateValue = page.template || 'landing';
  const isActive = page.isActive !== false;
  const showCookie = page.showCookieBanner === true;

  const modal = document.createElement('div');
  modal.className = 'modal-overlay active';
  modal.id = 'cms-settings-dynamic-modal';
  modal.innerHTML = `
    <div class="modal" style="max-width:500px">
      <div class="modal-header">
        <div class="modal-title">Side Indstillinger</div>
        <button class="modal-close" onclick="closeCMSSettingsModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group" style="margin-bottom:16px">
          <label class="form-label">URL Slug</label>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="color:var(--muted);font-size:13px">/</span>
            <input type="text" class="input" id="cms-settings-slug" value="${slugValue}" style="flex:1">
            <span style="color:var(--muted);font-size:13px">.html</span>
          </div>
        </div>
        <div class="form-group" style="margin-bottom:16px">
          <label class="form-label">Template</label>
          <select class="input" id="cms-settings-template">
            <option value="landing" ${templateValue === 'landing' ? 'selected' : ''}>Landing Page</option>
            <option value="standard" ${templateValue === 'standard' ? 'selected' : ''}>Standard</option>
            <option value="blog" ${templateValue === 'blog' ? 'selected' : ''}>Blog Post</option>
            <option value="resource" ${templateValue === 'resource' ? 'selected' : ''}>Ressource</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:20px">
          <label class="form-label">Status</label>
          <div style="display:flex;align-items:center;gap:12px">
            <label class="toggle-switch">
              <input type="checkbox" id="cms-settings-active" ${isActive ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
            <span style="font-size:13px">Side er aktiv</span>
          </div>
        </div>
        <div style="border-top:1px solid var(--border);padding-top:20px">
          <h4 style="margin:0 0 16px 0;font-size:14px;font-weight:600;color:var(--text)">Cookie Samtykke</h4>
          <div class="form-group">
            <div style="display:flex;align-items:center;gap:12px">
              <label class="toggle-switch">
                <input type="checkbox" id="cms-settings-cookie" ${showCookie ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
              <span style="font-size:13px">Vis cookie banner på denne side</span>
            </div>
            <p style="font-size:11px;color:var(--muted);margin-top:8px">Når aktiveret vises cookie samtykke banner til nye besøgende</p>
          </div>
        </div>
      </div>
      <div class="modal-footer" style="padding:16px 24px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary" onclick="closeCMSSettingsModal()">Annuller</button>
        <button class="btn btn-primary" onclick="saveCMSSettingsModal()">Gem indstillinger</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function closeCMSSettingsModal() {
  const modal = document.getElementById('cms-settings-dynamic-modal');
  if (modal) modal.remove();
}

function saveCMSSettingsModal() {
  const page = getCurrentCMSPage();
  if (!page) return;

  const slugInput = document.getElementById('cms-settings-slug');
  const templateSelect = document.getElementById('cms-settings-template');
  const activeCheckbox = document.getElementById('cms-settings-active');
  const cookieCheckbox = document.getElementById('cms-settings-cookie');

  if (slugInput) page.slug = slugInput.value.replace(/[^a-z0-9-]/g, '') + '.html';
  if (templateSelect) page.template = templateSelect.value;
  if (activeCheckbox) page.isActive = activeCheckbox.checked;
  if (cookieCheckbox) page.showCookieBanner = cookieCheckbox.checked;

  page.updatedAt = new Date().toISOString();
  markCMSChanged();
  renderCMSPagesList();
  toast('Indstillinger gemt', 'success');
  closeCMSSettingsModal();
}

// Navigate to Flow CMS page
function showFlowCMSPage(tab) {
  showPage('flow-cms');

  // Update sidebar active state for Flow CMS dropdown
  const flowDropdown = document.getElementById('nav-flow');
  if (flowDropdown) {
    const toggle = flowDropdown.querySelector('.nav-dropdown-toggle');
    if (toggle) toggle.classList.add('active');
  }

  // Update dropdown item active state
  document.querySelectorAll('#nav-flow .nav-dropdown-item').forEach(item => {
    item.classList.remove('active');
  });
  const activeItem = document.querySelector(`#nav-flow .nav-dropdown-item[onclick*="${tab}"]`);
  if (activeItem) activeItem.classList.add('active');

  setTimeout(() => switchFlowCMSTab(tab), 50);
  showPageIdBadge('flow-cms > ' + tab);
}

// Switch Flow CMS tab
async function switchFlowCMSTab(tab) {
  const tabTitles = {
    'pages': 'Rediger Flow Sider',
    'editor': 'Rediger Side',
    'blog': 'Blog',
    'blog-editor': 'Rediger Blogindlæg',
    'seo': 'SEO Indstillinger',
    'products-sms': 'SMS Workflow',
    'products-instagram': 'Instagram Workflow',
    'products-facebook': 'Facebook Workflow',
    'raw-data': 'Data',
    'analytics-oversigt': 'Oversigt',
    'api-noegler': 'API Nøgler',
    'integrationer': 'System Integrationer',
    'farver-og-fonts': 'Farver & Fonts'
  };

  const titleEl = document.getElementById('flow-cms-page-title');
  if (titleEl) {
    titleEl.textContent = tabTitles[tab] || 'Flow CMS';
  }

  document.querySelectorAll('#page-flow-cms .settings-tab-content').forEach(c => c.classList.remove('active'));
  const contentEl = document.getElementById('flow-cms-content-' + tab);
  if (contentEl) contentEl.classList.add('active');

  // Load content based on tab
  if (tab === 'pages') await loadCMSPages(); // Use new CMS Pages Editor
  if (tab === 'blog') loadBlogPosts();
  if (tab === 'products-sms') loadWorkflowConfig('sms');
  if (tab === 'products-instagram') loadWorkflowConfig('instagram');
  if (tab === 'products-facebook') loadWorkflowConfig('facebook');
  if (tab === 'raw-data') loadRawDataTab();
  if (tab === 'analytics-oversigt') loadAnalyticsOverview();
  if (tab === 'api-noegler') loadApiNoglerPage();
  if (tab === 'integrationer') loadIntegrationsPage();
  if (tab === 'farver-og-fonts') loadFarverOgFonts();
}

// ==================== CMS THEME: Farver og Fonts ====================

const CMS_THEME_DEFAULTS = {
  colors: {
    primary: '#6366F1',
    accent: '#6366F1',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    background: '#13131F',
    text: '#F0F2F5',
    textSecondary: '#808080',
    textMuted: '#9CA3AF',
    card: '#1E1E30',
    cardHover: '#2A2A40',
    border: '#1F1F2E',
    borderLight: '#2A2A3D',
    bg2: '#1B1B2F',
    bg3: '#1E1E30',
    navBg: '#1B1B2F',
    info: '#06B6D4'
  },
  fonts: {
    heading: 'Inter',
    body: 'Inter'
  }
};

const CMS_THEME_PRESETS = {
  'default-indigo': {
    colors: { primary: '#6366F1', accent: '#6366F1', success: '#10B981', warning: '#F59E0B', danger: '#EF4444', background: '#13131F', text: '#F0F2F5', textSecondary: '#808080', textMuted: '#9CA3AF', card: '#1E1E30', cardHover: '#2A2A40', border: '#1F1F2E', borderLight: '#2A2A3D', bg2: '#1B1B2F', bg3: '#1E1E30', navBg: '#1B1B2F', info: '#06B6D4' },
    fonts: { heading: 'Inter', body: 'Inter' }
  },
  'ocean-blue': {
    colors: { primary: '#3B82F6', accent: '#06B6D4', success: '#10B981', warning: '#F59E0B', danger: '#EF4444', background: '#0F172A', text: '#E2E8F0', textSecondary: '#64748B', textMuted: '#94A3B8', card: '#1E293B', cardHover: '#334155', border: '#1E293B', borderLight: '#334155', bg2: '#0F172A', bg3: '#1E293B', navBg: '#0F172A', info: '#38BDF8' },
    fonts: { heading: 'Inter', body: 'Inter' }
  },
  'forest-green': {
    colors: { primary: '#059669', accent: '#10B981', success: '#34D399', warning: '#F59E0B', danger: '#EF4444', background: '#14532D', text: '#ECFDF5', textSecondary: '#6EE7B7', textMuted: '#A7F3D0', card: '#1A3D2E', cardHover: '#234D3B', border: '#1A3D2E', borderLight: '#234D3B', bg2: '#14532D', bg3: '#1A3D2E', navBg: '#14532D', info: '#06B6D4' },
    fonts: { heading: 'Inter', body: 'Inter' }
  },
  'sunset-orange': {
    colors: { primary: '#F97316', accent: '#FB923C', success: '#10B981', warning: '#F59E0B', danger: '#EF4444', background: '#1C1917', text: '#FFF7ED', textSecondary: '#A8A29E', textMuted: '#78716C', card: '#292524', cardHover: '#3B3633', border: '#292524', borderLight: '#3B3633', bg2: '#1C1917', bg3: '#292524', navBg: '#1C1917', info: '#06B6D4' },
    fonts: { heading: 'Poppins', body: 'Inter' }
  },
  'minimal-dark': {
    colors: { primary: '#A78BFA', accent: '#818CF8', success: '#34D399', warning: '#FBBF24', danger: '#EF4444', background: '#0A0A0F', text: '#E4E4E7', textSecondary: '#71717A', textMuted: '#A1A1AA', card: '#18181B', cardHover: '#27272A', border: '#18181B', borderLight: '#27272A', bg2: '#0A0A0F', bg3: '#18181B', navBg: '#0A0A0F', info: '#06B6D4' },
    fonts: { heading: 'Inter', body: 'Inter' }
  },
  'midnight-blue': {
    colors: { primary: '#1E3A5F', accent: '#C0C0C0', success: '#2DD4BF', warning: '#FBBF24', danger: '#F87171', background: '#0B1120', text: '#E2E8F0', textSecondary: '#94A3B8', textMuted: '#64748B', card: '#131B2E', cardHover: '#1A2640', border: '#1A2640', borderLight: '#243352', bg2: '#0E1525', bg3: '#131B2E', navBg: '#0B1120', info: '#38BDF8' },
    fonts: { heading: 'Inter', body: 'Inter' }
  },
  'rose-gold': {
    colors: { primary: '#E8917A', accent: '#D4A574', success: '#6EE7B7', warning: '#FCD34D', danger: '#FB7185', background: '#1A1118', text: '#FDE8E8', textSecondary: '#C9A9A6', textMuted: '#9A7D7A', card: '#241920', cardHover: '#2E2028', border: '#2E2028', borderLight: '#3D2C34', bg2: '#1E141B', bg3: '#241920', navBg: '#1A1118', info: '#67E8F9' },
    fonts: { heading: 'Playfair Display', body: 'Inter' }
  },
  'arctic-white': {
    colors: { primary: '#3B82F6', accent: '#60A5FA', success: '#10B981', warning: '#F59E0B', danger: '#EF4444', background: '#F8FAFC', text: '#0F172A', textSecondary: '#475569', textMuted: '#94A3B8', card: '#FFFFFF', cardHover: '#F1F5F9', border: '#E2E8F0', borderLight: '#CBD5E1', bg2: '#F1F5F9', bg3: '#FFFFFF', navBg: '#FFFFFF', info: '#0EA5E9' },
    fonts: { heading: 'Inter', body: 'Inter' }
  },
  'charcoal': {
    colors: { primary: '#8B8B8B', accent: '#A3A3A3', success: '#4ADE80', warning: '#FACC15', danger: '#F87171', background: '#171717', text: '#FAFAFA', textSecondary: '#A3A3A3', textMuted: '#737373', card: '#1F1F1F', cardHover: '#2A2A2A', border: '#2A2A2A', borderLight: '#363636', bg2: '#1A1A1A', bg3: '#1F1F1F', navBg: '#171717', info: '#22D3EE' },
    fonts: { heading: 'Inter', body: 'Inter' }
  },
  'emerald': {
    colors: { primary: '#059669', accent: '#D4A843', success: '#34D399', warning: '#FBBF24', danger: '#F87171', background: '#0C1B14', text: '#ECFDF5', textSecondary: '#86EFAC', textMuted: '#6EE7B7', card: '#132A1E', cardHover: '#1A3D2A', border: '#1A3D2A', borderLight: '#245236', bg2: '#0F2118', bg3: '#132A1E', navBg: '#0C1B14', info: '#2DD4BF' },
    fonts: { heading: 'Poppins', body: 'Inter' }
  }
};

const CMS_COLOR_MAP = {
  primary: '--color-primary',
  accent: '--color-accent',
  success: '--color-success',
  warning: '--color-warning',
  danger: '--color-danger',
  background: '--color-bg',
  text: '--color-text',
  textSecondary: '--color-text-secondary',
  textMuted: '--color-text-muted',
  card: '--color-card',
  cardHover: '--color-card-hover',
  border: '--color-border',
  borderLight: '--color-border-light',
  bg2: '--color-bg-2',
  bg3: '--color-bg-3',
  navBg: '--color-nav-bg',
  info: '--color-info'
};

function loadFarverOgFonts() {
  const saved = localStorage.getItem('orderflow_cms_theme');
  const config = saved ? JSON.parse(saved) : CMS_THEME_DEFAULTS;

  // Populate color inputs
  Object.keys(config.colors).forEach(key => {
    const colorEl = document.getElementById('cms-color-' + key);
    const textEl = document.getElementById('cms-color-' + key + '-text');
    const previewEl = document.getElementById('cms-color-' + key + '-preview');
    if (colorEl) colorEl.value = config.colors[key];
    if (textEl) textEl.value = config.colors[key];
    if (previewEl) previewEl.style.background = config.colors[key];
  });

  // Populate font selects
  const headingEl = document.getElementById('cms-font-heading');
  const bodyEl = document.getElementById('cms-font-body');
  if (headingEl) headingEl.value = config.fonts.heading;
  if (bodyEl) bodyEl.value = config.fonts.body;

  updateCMSFontPreview();
}

function switchCMSThemeTab(tab) {
  document.querySelectorAll('#flow-cms-content-farver-og-fonts .settings-tab').forEach(t => t.classList.remove('active'));
  const activeTab = document.querySelector(`#flow-cms-content-farver-og-fonts .settings-tab[onclick*="'${tab}'"]`);
  if (activeTab) activeTab.classList.add('active');

  document.querySelectorAll('.cms-theme-tab-content').forEach(c => {
    c.style.display = 'none';
  });
  const content = document.getElementById('cms-theme-' + tab);
  if (content) {
    content.style.display = 'block';
  }
}

function syncCMSColorInput(type) {
  const textEl = document.getElementById('cms-color-' + type + '-text');
  const colorEl = document.getElementById('cms-color-' + type);
  const previewEl = document.getElementById('cms-color-' + type + '-preview');

  if (textEl && colorEl) {
    const value = textEl.value;
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      colorEl.value = value;
      if (previewEl) previewEl.style.background = value;
    }
  }
}

function updateCMSColorFromPicker(type) {
  const colorEl = document.getElementById('cms-color-' + type);
  const textEl = document.getElementById('cms-color-' + type + '-text');
  const previewEl = document.getElementById('cms-color-' + type + '-preview');

  if (colorEl && textEl) {
    textEl.value = colorEl.value;
    if (previewEl) previewEl.style.background = colorEl.value;
  }
}

function updateCMSFontPreview() {
  const headingFont = document.getElementById('cms-font-heading')?.value || 'Inter';
  const bodyFont = document.getElementById('cms-font-body')?.value || 'Inter';

  const headingEl = document.getElementById('cms-font-preview-heading');
  const bodyEl = document.getElementById('cms-font-preview-body');

  if (headingEl) headingEl.style.fontFamily = `'${headingFont}', sans-serif`;
  if (bodyEl) bodyEl.style.fontFamily = `'${bodyFont}', sans-serif`;
}

function saveCMSTheme() {
  const config = {
    colors: {},
    fonts: {}
  };

  // Collect colors
  Object.keys(CMS_THEME_DEFAULTS.colors).forEach(key => {
    const textEl = document.getElementById('cms-color-' + key + '-text');
    config.colors[key] = textEl ? textEl.value : CMS_THEME_DEFAULTS.colors[key];
  });

  // Collect fonts
  const headingEl = document.getElementById('cms-font-heading');
  const bodyEl = document.getElementById('cms-font-body');
  config.fonts.heading = headingEl ? headingEl.value : 'Inter';
  config.fonts.body = bodyEl ? bodyEl.value : 'Inter';

  // Save to localStorage
  localStorage.setItem('orderflow_cms_theme', JSON.stringify(config));

  // Apply runtime
  applyCMSTheme(config);

  // Show save status
  const status = document.getElementById('cms-theme-save-status');
  if (status) {
    status.style.display = 'inline';
    setTimeout(() => { status.style.display = 'none'; }, 3000);
  }
}

function applyCMSTheme(config) {
  const root = document.documentElement;

  // Apply colors
  Object.keys(config.colors).forEach(key => {
    const cssVar = CMS_COLOR_MAP[key];
    if (cssVar) {
      root.style.setProperty(cssVar, config.colors[key]);
    }
  });

  // Apply primary-related derived colors
  const primary = config.colors.primary;
  if (primary) {
    root.style.setProperty('--color-primary-hover', adjustBrightness(primary, 20));
    root.style.setProperty('--color-primary-active', adjustBrightness(primary, -15));
    root.style.setProperty('--color-primary-dim', primary + '26');
    root.style.setProperty('--color-primary-glow', primary + '59');
  }

  // Apply fonts
  if (config.fonts.heading && config.fonts.heading !== 'Inter') {
    loadGoogleFont(config.fonts.heading);
  }
  if (config.fonts.body && config.fonts.body !== 'Inter') {
    loadGoogleFont(config.fonts.body);
  }
  root.style.setProperty('--font-family-base', `'${config.fonts.body}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`);
}

function adjustBrightness(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(2.55 * percent)));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + Math.round(2.55 * percent)));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + Math.round(2.55 * percent)));
  return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function loadGoogleFont(fontName) {
  const id = 'gfont-' + fontName.replace(/\s+/g, '-').toLowerCase();
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

function applyCMSThemePreset(presetName) {
  const preset = CMS_THEME_PRESETS[presetName];
  if (!preset) return;

  // Update color inputs
  Object.keys(preset.colors).forEach(key => {
    const colorEl = document.getElementById('cms-color-' + key);
    const textEl = document.getElementById('cms-color-' + key + '-text');
    const previewEl = document.getElementById('cms-color-' + key + '-preview');
    if (colorEl) colorEl.value = preset.colors[key];
    if (textEl) textEl.value = preset.colors[key];
    if (previewEl) previewEl.style.background = preset.colors[key];
  });

  // Update font selects
  const headingEl = document.getElementById('cms-font-heading');
  const bodyEl = document.getElementById('cms-font-body');
  if (headingEl) headingEl.value = preset.fonts.heading;
  if (bodyEl) bodyEl.value = preset.fonts.body;

  updateCMSFontPreview();
  switchCMSThemeTab('farver');
}

// Load saved CMS theme on app startup
(function initCMSTheme() {
  const saved = localStorage.getItem('orderflow_cms_theme');
  if (saved) {
    try {
      applyCMSTheme(JSON.parse(saved));
    } catch(e) { /* ignore corrupt data */ }
  }
})();

// Load CMS Data Statistics
function loadCMSDataStats() {
  // Get pages from localStorage
  const savedPages = localStorage.getItem('flow_cms_pages');
  const pages = savedPages ? JSON.parse(savedPages) : [];

  // Get blog posts
  const savedBlog = localStorage.getItem('flow_blog_posts');
  const blogPosts = savedBlog ? JSON.parse(savedBlog) : [];

  // Count pages
  const totalPages = pages.length;
  const publishedPages = pages.filter(p => p.status === 'published').length;
  const draftPages = pages.filter(p => p.status === 'draft').length;

  // Update stats
  const totalEl = document.getElementById('data-total-pages');
  const pubEl = document.getElementById('data-published-pages');
  const draftEl = document.getElementById('data-draft-pages');
  const blogEl = document.getElementById('data-blog-posts');

  if (totalEl) totalEl.textContent = totalPages;
  if (pubEl) pubEl.textContent = publishedPages;
  if (draftEl) draftEl.textContent = draftPages;
  if (blogEl) blogEl.textContent = blogPosts.length;

  // Update table counts
  const landingCount = document.getElementById('data-landing-count');
  const blogCount = document.getElementById('data-blog-count');
  if (landingCount) landingCount.textContent = totalPages;
  if (blogCount) blogCount.textContent = blogPosts.length;

  // Update last modified dates
  if (pages.length > 0) {
    const lastPage = pages.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))[0];
    const landingUpdated = document.getElementById('data-landing-updated');
    if (landingUpdated && lastPage.updatedAt) {
      landingUpdated.textContent = new Date(lastPage.updatedAt).toLocaleDateString('da-DK');
    }
  }

  if (blogPosts.length > 0) {
    const lastBlog = blogPosts.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))[0];
    const blogUpdated = document.getElementById('data-blog-updated');
    if (blogUpdated && lastBlog.updated_at) {
      blogUpdated.textContent = new Date(lastBlog.updated_at).toLocaleDateString('da-DK');
    }
  }
}

// Switch main Data tab between Data (raw data) and Oversigt (analytics)
function switchMainDataTab(tab) {
  // Update main tab buttons
  document.getElementById('main-tab-btn-data')?.classList.toggle('active', tab === 'data');
  document.getElementById('main-tab-btn-oversigt')?.classList.toggle('active', tab === 'oversigt');

  // Update main tab content
  const dataTab = document.getElementById('main-data-tab-data');
  const oversigtTab = document.getElementById('main-data-tab-oversigt');

  if (dataTab) dataTab.style.display = tab === 'data' ? 'block' : 'none';
  if (oversigtTab) oversigtTab.style.display = tab === 'oversigt' ? 'block' : 'none';

  // Load data based on tab
  if (tab === 'data') {
    loadRawDataTab();
  } else if (tab === 'oversigt') {
    loadAnalyticsOverview();
  }
}

// ==================== DATA GRID UTILITY ====================
// Provides sorting + pagination for raw-data tables
const _dgState = new Map();

function initDataGrid(tableId, options) {
  options = Object.assign({ pageSize: 25, pageSizes: [10, 25, 50, 100] }, options || {});
  var table = document.getElementById(tableId);
  if (!table) return;

  var tbody = table.querySelector('tbody');
  if (!tbody) return;

  var pagId = 'dg-pag-' + tableId.replace('dg-', '');
  var pagEl = document.getElementById(pagId);

  // Store all rows
  var allRows = Array.from(tbody.querySelectorAll('tr'));
  // Filter out empty-state rows
  allRows = allRows.filter(function(r) { return !r.querySelector('.dg-empty') && r.cells.length > 1; });

  var state = { rows: allRows, page: 0, pageSize: options.pageSize, sortCol: -1, sortDir: '' };
  _dgState.set(tableId, state);

  // Setup sort handlers on th elements
  var headers = table.querySelectorAll('thead th');
  headers.forEach(function(th, colIdx) {
    th.style.cursor = 'pointer';
    th.addEventListener('click', function() {
      var s = _dgState.get(tableId);
      // Toggle sort direction
      if (s.sortCol === colIdx) {
        s.sortDir = s.sortDir === 'asc' ? 'desc' : (s.sortDir === 'desc' ? '' : 'asc');
      } else {
        s.sortCol = colIdx;
        s.sortDir = 'asc';
      }
      // Update header attributes
      headers.forEach(function(h) { h.removeAttribute('data-sort-dir'); });
      if (s.sortDir) th.setAttribute('data-sort-dir', s.sortDir);

      // Sort rows
      if (s.sortDir) {
        s.rows.sort(function(a, b) {
          var aVal = (a.cells[colIdx] ? a.cells[colIdx].textContent : '').trim();
          var bVal = (b.cells[colIdx] ? b.cells[colIdx].textContent : '').trim();
          // Try numeric comparison
          var aNum = parseFloat(aVal.replace(/[^0-9.\-]/g, ''));
          var bNum = parseFloat(bVal.replace(/[^0-9.\-]/g, ''));
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return s.sortDir === 'asc' ? aNum - bNum : bNum - aNum;
          }
          // Fallback to string comparison
          return s.sortDir === 'asc' ? aVal.localeCompare(bVal, 'da') : bVal.localeCompare(aVal, 'da');
        });
      }
      s.page = 0;
      _dgRender(tableId);
    });
  });

  // Render pagination and visible rows
  _dgRender(tableId);
}

function _dgRender(tableId) {
  var state = _dgState.get(tableId);
  if (!state) return;

  var table = document.getElementById(tableId);
  if (!table) return;
  var tbody = table.querySelector('tbody');
  if (!tbody) return;

  var total = state.rows.length;
  var pageSize = state.pageSize;
  var totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (state.page >= totalPages) state.page = totalPages - 1;
  if (state.page < 0) state.page = 0;

  var start = state.page * pageSize;
  var end = Math.min(start + pageSize, total);

  // Replace tbody contents with sorted/paginated rows
  tbody.innerHTML = '';
  if (total === 0) {
    tbody.innerHTML = '<tr><td colspan="20" class="dg-empty">Ingen data</td></tr>';
  } else {
    for (var i = start; i < end; i++) {
      tbody.appendChild(state.rows[i]);
    }
  }

  // Render pagination
  var pagId = 'dg-pag-' + tableId.replace('dg-', '');
  var pagEl = document.getElementById(pagId);
  if (pagEl) {
    var pagSizes = [10, 25, 50, 100];
    var optionsHtml = pagSizes.map(function(s) {
      return '<option value="' + s + '"' + (s === pageSize ? ' selected' : '') + '>' + s + '</option>';
    }).join('');

    pagEl.innerHTML =
      '<div class="dg-pagination-left">' +
        '<span>Vis</span>' +
        '<select onchange="_dgPageSize(\'' + tableId + '\', this.value)">' + optionsHtml + '</select>' +
        '<span>pr. side</span>' +
      '</div>' +
      '<div class="dg-pagination-right">' +
        '<span>' + (total > 0 ? (start + 1) + '-' + end + ' af ' + total : '0 af 0') + '</span>' +
        '<button onclick="_dgPage(\'' + tableId + '\', -1)"' + (state.page <= 0 ? ' disabled' : '') + '>&lsaquo;</button>' +
        '<span class="dg-page-info">' + (state.page + 1) + ' / ' + totalPages + '</span>' +
        '<button onclick="_dgPage(\'' + tableId + '\', 1)"' + (state.page >= totalPages - 1 ? ' disabled' : '') + '>&rsaquo;</button>' +
      '</div>';
  }
}

function _dgPage(tableId, dir) {
  var state = _dgState.get(tableId);
  if (!state) return;
  state.page += dir;
  _dgRender(tableId);
}

function _dgPageSize(tableId, size) {
  var state = _dgState.get(tableId);
  if (!state) return;
  state.pageSize = parseInt(size);
  state.page = 0;
  _dgRender(tableId);
}

// Load raw data tab content
function loadRawDataTab() {
  switchDataCategory('users');
}

// Switch between data categories (Brugere, Ordrer, Database, Integrationer, Flow CMS, Ændringslog)
function switchDataCategory(category) {
  // Update tab buttons
  const tabs = document.querySelectorAll('#flow-cms-content-raw-data > .settings-tabs .settings-tab');
  const categoryLabels = {
    users: 'Brugere',
    orders: 'Ordrer',
    products: 'Produkter',
    supabase: 'Database',
    integrations: 'Integrationer',
    marketing: 'Marketing',
    flow: 'Flow CMS',
    consent: 'Consent',
    performance: 'Performance',
    geo: 'Geo & Devices',
    changes: 'Ændringslog',
    seo: 'SEO Analyse'
  };

  tabs.forEach(tab => {
    tab.classList.remove('active');
    if (tab.textContent === categoryLabels[category]) {
      tab.classList.add('active');
    }
  });

  // Hide all category contents
  document.querySelectorAll('.data-category-content').forEach(c => c.style.display = 'none');

  // Show selected category
  const categoryEl = document.getElementById('data-category-' + category);
  if (categoryEl) categoryEl.style.display = 'block';

  // Load data for category
  switch(category) {
    case 'users': loadUsersData(); break;
    case 'orders': loadOrdersData(); break;
    case 'products': loadProductsData(); break;
    case 'supabase': loadSupabaseData(); break;
    case 'integrations': loadIntegrationsData(); break;
    case 'marketing': loadMarketingData(); break;
    case 'flow': loadFlowCMSData(); break;
    case 'consent': loadConsentData(); break;
    case 'performance': loadPerformanceData(); break;
    case 'geo': loadGeoData(); break;
    case 'changes': loadChangesData(); break;
    case 'seo': loadSEOAnalysisData(); break;
  }
}

// Load users/customers data
function loadUsersData() {
  // Stats
  document.getElementById('data-total-users').textContent = '156';
  document.getElementById('data-total-customers').textContent = '1,234';
  document.getElementById('data-active-today').textContent = '89';
  document.getElementById('data-new-signups').textContent = '+47';
  document.getElementById('data-logins-today').textContent = '234';
  document.getElementById('data-sessions-active').textContent = '45';

  // Customers table
  const customers = [
    { id: 'C001', name: 'Anders Jensen', email: 'anders@example.dk', phone: '+45 12345678', created: '2026-01-15', orders: 12, total: '4.850 kr' },
    { id: 'C002', name: 'Maria Nielsen', email: 'maria@example.dk', phone: '+45 23456789', created: '2026-01-20', orders: 8, total: '3.200 kr' },
    { id: 'C003', name: 'Peter Larsen', email: 'peter@example.dk', phone: '+45 34567890', created: '2026-01-25', orders: 5, total: '1.875 kr' },
    { id: 'C004', name: 'Louise Hansen', email: 'louise@example.dk', phone: '+45 45678901', created: '2026-02-01', orders: 3, total: '945 kr' },
    { id: 'C005', name: 'Thomas Pedersen', email: 'thomas@example.dk', phone: '+45 56789012', created: '2026-02-03', orders: 1, total: '285 kr' },
  ];
  document.getElementById('data-customers-table').innerHTML = customers.map(c =>
    `<tr><td>${c.id}</td><td>${c.name}</td><td>${c.email}</td><td>${c.phone}</td><td>${c.created}</td><td>${c.orders}</td><td>${c.total}</td></tr>`
  ).join('');

  // Activity table
  const activities = [
    { time: '12:45', email: 'anders@example.dk', action: 'login', ip: '192.168.1.45', device: 'iPhone', status: 'OK' },
    { time: '12:42', email: 'maria@example.dk', action: 'logout', ip: '192.168.1.32', device: 'Chrome', status: 'OK' },
    { time: '12:38', email: 'louise@example.dk', action: 'login', ip: '192.168.1.78', device: 'Safari', status: 'OK' },
    { time: '12:30', email: 'ny@bruger.dk', action: 'signup', ip: '192.168.1.99', device: 'Android', status: 'OK' },
    { time: '12:15', email: 'thomas@example.dk', action: 'login', ip: '192.168.1.12', device: 'Chrome', status: 'OK' },
  ];
  const actionColors = { login: 'var(--success)', logout: 'var(--muted)', signup: 'var(--accent)' };
  document.getElementById('data-activity-table').innerHTML = activities.map(a =>
    `<tr><td>${a.time}</td><td>${a.email}</td><td style="color:${actionColors[a.action]}">${a.action}</td><td>${a.ip}</td><td>${a.device}</td><td style="padding-right:12px;color:var(--success)">${a.status}</td></tr>`
  ).join('');

  // Sessions table
  const sessions = [
    { id: 'S8934', user: 'anders@example.dk', start: '12:30', pages: 5, device: 'iPhone 15', country: 'DK' },
    { id: 'S8933', user: 'maria@example.dk', start: '12:25', pages: 3, device: 'Chrome/Win', country: 'DK' },
    { id: 'S8932', user: 'louise@example.dk', start: '12:20', pages: 7, device: 'Safari/Mac', country: 'DK' },
  ];
  document.getElementById('data-sessions-table').innerHTML = sessions.map(s =>
    `<tr><td>${s.id}</td><td>${s.user}</td><td>${s.start}</td><td>${s.pages}</td><td>${s.device}</td><td>${s.country}</td></tr>`
  ).join('');

  initDataGrid('dg-customers');
  initDataGrid('dg-activity');
  initDataGrid('dg-sessions');
}

// Load orders data
function loadOrdersData() {
  document.getElementById('data-orders-total').textContent = '3,842';
  document.getElementById('data-orders-today').textContent = '47';
  document.getElementById('data-orders-pending').textContent = '12';
  document.getElementById('data-payments-total').textContent = '3,721';
  document.getElementById('data-revenue-total').textContent = '1.2M';
  document.getElementById('data-refunds-total').textContent = '23';

  const orders = [
    { id: '#4523', customer: 'Anders J.', date: '12:01', status: 'confirmed', channel: 'App', items: 3, total: '485 kr', payment: 'Kort' },
    { id: '#4522', customer: 'Maria N.', date: '11:45', status: 'delivered', channel: 'Web', items: 2, total: '320 kr', payment: 'MobilePay' },
    { id: '#4521', customer: 'Peter L.', date: '11:30', status: 'preparing', channel: 'App', items: 4, total: '590 kr', payment: 'Kort' },
    { id: '#4520', customer: 'Louise H.', date: '11:15', status: 'pending', channel: 'Instagram', items: 1, total: '145 kr', payment: 'Afventer' },
  ];
  const statusColors = { pending: 'var(--warning)', confirmed: 'var(--accent)', preparing: 'var(--primary)', delivered: 'var(--success)', cancelled: 'var(--error)' };
  document.getElementById('data-orders-table').innerHTML = orders.map(o =>
    `<tr><td>${o.id}</td><td>${o.customer}</td><td>${o.date}</td><td style="color:${statusColors[o.status]}">${o.status}</td><td>${o.channel}</td><td>${o.items}</td><td>${o.total}</td><td>${o.payment}</td></tr>`
  ).join('');

  const payments = [
    { id: 'P3721', order: '#4523', amount: '485 kr', method: 'Kort', status: 'completed', provider: 'Stripe', time: '12:02' },
    { id: 'P3720', order: '#4522', amount: '320 kr', method: 'MobilePay', status: 'completed', provider: 'MobilePay', time: '11:46' },
    { id: 'P3719', order: '#4521', amount: '590 kr', method: 'Kort', status: 'completed', provider: 'Stripe', time: '11:31' },
  ];
  document.getElementById('data-payments-table').innerHTML = payments.map(p =>
    `<tr><td>${p.id}</td><td>${p.order}</td><td>${p.amount}</td><td>${p.method}</td><td style="color:var(--success)">${p.status}</td><td>${p.provider}</td><td>${p.time}</td></tr>`
  ).join('');

  const items = [
    { id: 'I001', order: '#4523', product: 'Burger Classic', qty: 2, price: '149 kr', subtotal: '298 kr' },
    { id: 'I002', order: '#4523', product: 'Pommes Frites', qty: 1, price: '45 kr', subtotal: '45 kr' },
    { id: 'I003', order: '#4522', product: 'Pizza Margherita', qty: 1, price: '189 kr', subtotal: '189 kr' },
  ];
  document.getElementById('data-order-items-table').innerHTML = items.map(i =>
    `<tr><td>${i.id}</td><td>${i.order}</td><td>${i.product}</td><td>${i.qty}</td><td>${i.price}</td><td>${i.subtotal}</td></tr>`
  ).join('');

  initDataGrid('dg-orders');
  initDataGrid('dg-payments');
  initDataGrid('dg-order-items');
}

// Load Supabase data
function loadSupabaseData() {
  // Tables already hardcoded in HTML
  initDataGrid('dg-supabase-tables');
}

// Load integrations data
function getAllConnectedIntegrations() {
  const integrations = [];

  // 1. CMS-integrationer fra localStorage (e-conomic osv.)
  const flowIntegrations = JSON.parse(localStorage.getItem('flow_integrations') || '[]');
  flowIntegrations.forEach(fi => {
    integrations.push({
      name: fi.name || fi.system,
      type: 'Regnskab',
      status: 'OK',
      statusColor: 'var(--success)',
      sync: new Date(fi.connectedAt).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }),
      activity: Math.floor(Math.random() * 100) + 10,
      errors: 0
    });
  });

  // 2. Leveringsplatforme fra selectedIntegrations
  const deliveryPlatforms = { wolt: 'Wolt', hungry: 'Hungry', foodora: 'Foodora', justeat: 'Just Eat' };
  (selectedIntegrations || []).forEach(key => {
    if (deliveryPlatforms[key]) {
      integrations.push({
        name: deliveryPlatforms[key],
        type: 'Levering',
        status: 'OK',
        statusColor: 'var(--success)',
        sync: new Date().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }),
        activity: Math.floor(Math.random() * 200) + 20,
        errors: 0
      });
    }
  });

  // 3. Standard-integrationer (altid tilgængelige)
  const defaults = [
    { name: 'Stripe', type: 'Payment', status: 'OK', statusColor: 'var(--success)', sync: '12:01', activity: 234, errors: 0 },
    { name: 'Instagram', type: 'Social', status: 'OK', statusColor: 'var(--success)', sync: '10:30', activity: 89, errors: 0 },
    { name: 'Facebook', type: 'Social', status: 'OK', statusColor: 'var(--success)', sync: '09:15', activity: 67, errors: 0 },
    { name: 'SMS Gateway', type: 'Komm.', status: 'OK', statusColor: 'var(--success)', sync: '11:20', activity: 145, errors: 0 },
  ];

  // Undgå duplikater (tjek om en integration allerede er tilføjet)
  const existingNames = integrations.map(i => i.name.toLowerCase());
  defaults.forEach(d => {
    if (!existingNames.includes(d.name.toLowerCase())) {
      integrations.push(d);
    }
  });

  return integrations;
}

function loadIntegrationsData() {
  // Forbindelser-tabel (dynamisk)
  const connections = getAllConnectedIntegrations();
  const connectionsEl = document.getElementById('data-integrations-connections');
  if (connectionsEl) {
    if (connections.length === 0) {
      connectionsEl.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--muted)">Ingen aktive integrationer</td></tr>';
    } else {
      connectionsEl.innerHTML = connections.map(c =>
        `<tr><td>${c.name}</td><td>${c.type}</td><td style="color:${c.statusColor}">${c.status}</td><td>${c.sync}</td><td>${c.activity}</td><td>${c.errors}</td></tr>`
      ).join('');
    }
  }

  // Opdater aktive-antal
  const activeCountEl = document.getElementById('data-integrations-active-count');
  if (activeCountEl) activeCountEl.textContent = connections.length;

  // Webhook Logs
  const webhooks = [
    { time: '12:01', type: 'OUT', endpoint: '/webhook/stripe', status: '200', latency: '45ms', payload: '{...}' },
    { time: '11:58', type: 'IN', endpoint: '/api/orders', status: '201', latency: '120ms', payload: '{...}' },
    { time: '11:45', type: 'OUT', endpoint: '/webhook/economic', status: '200', latency: '230ms', payload: '{...}' },
  ];
  document.getElementById('data-webhooks-table').innerHTML = webhooks.map(w =>
    `<tr><td>${w.time}</td><td>${w.type}</td><td>${w.endpoint}</td><td style="color:var(--success)">${w.status}</td><td>${w.latency}</td><td><button class="btn btn-secondary btn-sm">Vis</button></td></tr>`
  ).join('');

  // API Logs
  const apiLogs = [
    { time: '12:02', method: 'POST', endpoint: '/api/orders', status: '201', ip: '192.168.1.45', latency: '89ms' },
    { time: '12:01', method: 'GET', endpoint: '/api/menu', status: '200', ip: '192.168.1.32', latency: '23ms' },
    { time: '11:59', method: 'POST', endpoint: '/api/payments', status: '200', ip: '192.168.1.45', latency: '156ms' },
  ];
  document.getElementById('data-api-logs-table').innerHTML = apiLogs.map(a =>
    `<tr><td>${a.time}</td><td>${a.method}</td><td>${a.endpoint}</td><td style="color:var(--success)">${a.status}</td><td>${a.ip}</td><td>${a.latency}</td></tr>`
  ).join('');

  initDataGrid('dg-webhooks');
  initDataGrid('dg-api-logs');
  initDataGrid('dg-connections');
}

// Load Flow CMS data
function loadFlowCMSData() {
  document.getElementById('flow-pages').textContent = '8';
  document.getElementById('flow-sections').textContent = '34';
  document.getElementById('flow-blog-posts').textContent = '12';
  document.getElementById('flow-media').textContent = '156';
  document.getElementById('flow-drafts').textContent = '3';
  document.getElementById('flow-published').textContent = '5';

  const pages = [
    { id: 'P001', title: 'Forside', slug: '/', status: 'published', sections: 6, updated: '10:30' },
    { id: 'P002', title: 'Menu', slug: '/menu', status: 'published', sections: 4, updated: '09:15' },
    { id: 'P003', title: 'Om Os', slug: '/om-os', status: 'published', sections: 5, updated: '08:45' },
    { id: 'P004', title: 'Kontakt', slug: '/kontakt', status: 'draft', sections: 3, updated: '11:20' },
  ];
  const statusColors = { published: 'var(--success)', draft: 'var(--warning)' };
  document.getElementById('data-flow-pages-table').innerHTML = pages.map(p =>
    `<tr><td>${p.id}</td><td>${p.title}</td><td>${p.slug}</td><td style="color:${statusColors[p.status]}">${p.status}</td><td>${p.sections}</td><td>${p.updated}</td></tr>`
  ).join('');

  const media = [
    { file: 'hero-bg.jpg', type: 'image/jpeg', size: '2.4MB', uploaded: '2026-02-01', used: 'Forside' },
    { file: 'logo.png', type: 'image/png', size: '45KB', uploaded: '2026-01-15', used: 'Alle sider' },
    { file: 'menu-1.jpg', type: 'image/jpeg', size: '1.8MB', uploaded: '2026-02-03', used: 'Menu' },
  ];
  document.getElementById('data-flow-media-table').innerHTML = media.map(m =>
    `<tr><td>${m.file}</td><td>${m.type}</td><td>${m.size}</td><td>${m.uploaded}</td><td>${m.used}</td></tr>`
  ).join('');

  const conversations = [
    { id: 'AI001', session: 'S8934', start: '12:30', messages: 8, outcome: 'order_completed', duration: '4:32' },
    { id: 'AI002', session: 'S8931', start: '11:45', messages: 5, outcome: 'abandoned', duration: '2:15' },
    { id: 'AI003', session: 'S8928', start: '10:20', messages: 12, outcome: 'escalated', duration: '6:45' },
  ];
  const outcomeColors = { order_completed: 'var(--success)', abandoned: 'var(--warning)', escalated: 'var(--error)' };
  document.getElementById('data-ai-conversations-table').innerHTML = conversations.map(c =>
    `<tr><td>${c.id}</td><td>${c.session}</td><td>${c.start}</td><td>${c.messages}</td><td style="color:${outcomeColors[c.outcome]}">${c.outcome}</td><td>${c.duration}</td></tr>`
  ).join('');

  initDataGrid('dg-flow-pages');
  initDataGrid('dg-flow-media');
  initDataGrid('dg-ai-conversations');
}

// Load changes/audit data
function loadChangesData() {
  document.getElementById('changes-today').textContent = '156';
  document.getElementById('changes-week').textContent = '1,234';
  document.getElementById('changes-users').textContent = '12';
  document.getElementById('changes-tables').textContent = '8';
  document.getElementById('changes-rollbacks').textContent = '0';

  const audit = [
    { time: '12:01', user: 'admin@flow.dk', action: 'UPDATE', table: 'orders', record: '#4523', old: 'pending', new: 'confirmed', ip: '192.168.1.1' },
    { time: '11:58', user: 'system', action: 'INSERT', table: 'payments', record: 'P3721', old: '-', new: '{...}', ip: 'internal' },
    { time: '11:45', user: 'admin@flow.dk', action: 'UPDATE', table: 'products', record: 'PRD087', old: '149 kr', new: '159 kr', ip: '192.168.1.1' },
    { time: '11:30', user: 'system', action: 'INSERT', table: 'orders', record: '#4523', old: '-', new: '{...}', ip: 'internal' },
  ];
  const actionColors = { INSERT: 'var(--success)', UPDATE: 'var(--accent)', DELETE: 'var(--error)' };
  document.getElementById('data-audit-log-table').innerHTML = audit.map(a =>
    `<tr><td style="padding:10px 12px;font-family:monospace;font-size:11px">${a.time}</td><td>${a.user}</td><td style="color:${actionColors[a.action]}">${a.action}</td><td>${a.table}</td><td>${a.record}</td><td style="max-width:80px;overflow:hidden;text-overflow:ellipsis">${a.old}</td><td style="max-width:80px;overflow:hidden;text-overflow:ellipsis">${a.new}</td><td>${a.ip}</td></tr>`
  ).join('');

  const sysLogs = [
    { time: '12:02', level: 'info', service: 'api', message: 'Order #4523 confirmed', trace: 'TR001' },
    { time: '12:01', level: 'info', service: 'webhook', message: 'Stripe webhook received', trace: 'TR002' },
    { time: '11:58', level: 'warning', service: 'economic', message: 'Slow response (230ms)', trace: 'TR003' },
  ];
  const levelColors = { info: 'var(--accent)', warning: 'var(--warning)', error: 'var(--error)' };
  document.getElementById('data-system-logs-table').innerHTML = sysLogs.map(l =>
    `<tr><td style="padding:10px 12px;font-family:monospace;font-size:11px">${l.time}</td><td style="color:${levelColors[l.level]}">${l.level}</td><td>${l.service}</td><td>${l.message}</td><td>${l.trace}</td></tr>`
  ).join('');

  const errors = [
    { time: '10:15', type: 'TimeoutError', message: 'Economic API timeout', stack: '...', user: 'system', status: 'resolved' },
  ];
  document.getElementById('data-error-logs-table').innerHTML = errors.length ? errors.map(e =>
    `<tr><td>${e.time}</td><td style="color:var(--error)">${e.type}</td><td>${e.message}</td><td><button class="btn btn-secondary btn-sm">Vis</button></td><td>${e.user}</td><td style="color:var(--success)">${e.status}</td></tr>`
  ).join('') : '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--muted)">Ingen fejl</td></tr>';

  initDataGrid('dg-audit-log');
  initDataGrid('dg-system-logs');
  initDataGrid('dg-error-logs');
}

// Load products data
function loadProductsData() {
  // Stats
  document.getElementById('prod-total').textContent = '156';
  document.getElementById('prod-active').textContent = '142';
  document.getElementById('prod-categories').textContent = '12';
  document.getElementById('prod-variants').textContent = '234';
  document.getElementById('prod-low-stock').textContent = '5';
  document.getElementById('prod-out-stock').textContent = '3';

  // Products catalog table
  const products = [
    { id: 'PRD001', name: 'Margherita Pizza', category: 'Pizza', price: '99 kr', variants: 3, stock: 'In stock', sold: 234, status: 'Aktiv' },
    { id: 'PRD002', name: 'Pepperoni Pizza', category: 'Pizza', price: '119 kr', variants: 3, stock: 'In stock', sold: 189, status: 'Aktiv' },
    { id: 'PRD003', name: 'Caesar Salat', category: 'Salat', price: '89 kr', variants: 2, stock: 'In stock', sold: 156, status: 'Aktiv' },
    { id: 'PRD004', name: 'Pasta Carbonara', category: 'Pasta', price: '109 kr', variants: 1, stock: 'Lav', sold: 123, status: 'Aktiv' },
    { id: 'PRD005', name: 'Tiramisu', category: 'Dessert', price: '59 kr', variants: 0, stock: 'Udsolgt', sold: 87, status: 'Inaktiv' },
  ];
  const stockColors = { 'In stock': 'var(--success)', 'Lav': 'var(--warning)', 'Udsolgt': 'var(--error)' };
  document.getElementById('data-products-table').innerHTML = products.map(p =>
    `<tr><td style="padding:10px 12px;font-family:monospace;font-size:11px">${p.id}</td><td>${p.name}</td><td>${p.category}</td><td>${p.price}</td><td>${p.variants}</td><td style="color:${stockColors[p.stock] || 'inherit'}">${p.stock}</td><td>${p.sold}</td><td>${p.status}</td></tr>`
  ).join('');

  // Categories table
  const categories = [
    { id: 1, name: 'Pizza', products: 24, sort: 1, visible: true, updated: '2026-02-05' },
    { id: 2, name: 'Pasta', products: 18, sort: 2, visible: true, updated: '2026-02-04' },
    { id: 3, name: 'Salat', products: 12, sort: 3, visible: true, updated: '2026-02-03' },
    { id: 4, name: 'Dessert', products: 8, sort: 4, visible: true, updated: '2026-02-01' },
    { id: 5, name: 'Drikkevarer', products: 15, sort: 5, visible: true, updated: '2026-01-28' },
  ];
  document.getElementById('data-categories-table').innerHTML = categories.map(c =>
    `<tr><td>${c.id}</td><td>${c.name}</td><td>${c.products}</td><td>${c.sort}</td><td style="color:${c.visible ? 'var(--success)' : 'var(--muted)'}">${c.visible ? 'Ja' : 'Nej'}</td><td>${c.updated}</td></tr>`
  ).join('');

  // Variants table
  const variants = [
    { id: 'VAR01', product: 'Margherita Pizza', variant: 'Lille', type: 'Størrelse', price: '-20 kr', stock: 15 },
    { id: 'VAR02', product: 'Margherita Pizza', variant: 'Stor', type: 'Størrelse', price: '+25 kr', stock: 22 },
    { id: 'VAR03', product: 'Pepperoni Pizza', variant: 'Ekstra ost', type: 'Tilføjelse', price: '+15 kr', stock: 100 },
    { id: 'VAR04', product: 'Caesar Salat', variant: 'Med kylling', type: 'Tilføjelse', price: '+35 kr', stock: 45 },
  ];
  document.getElementById('data-variants-table').innerHTML = variants.map(v =>
    `<tr><td style="font-family:monospace;font-size:11px">${v.id}</td><td>${v.product}</td><td>${v.variant}</td><td>${v.type}</td><td>${v.price}</td><td>${v.stock}</td></tr>`
  ).join('');

  initDataGrid('dg-products');
  initDataGrid('dg-categories');
  initDataGrid('dg-variants');
}

// loadMarketingData — see later definition with localStorage support

// Load consent/GDPR data
function loadConsentData() {
  // Stats
  document.getElementById('consent-total').textContent = '4,567';
  document.getElementById('consent-marketing').textContent = '78%';
  document.getElementById('consent-analytics').textContent = '89%';
  document.getElementById('consent-requests').textContent = '12';
  document.getElementById('consent-deletions').textContent = '3';
  document.getElementById('consent-exports').textContent = '8';

  // User consents table (Bruger, Marketing, Analytics, Personalisering, Givet, Opdateret)
  const consents = [
    { user: 'anders@example.dk', marketing: true, analytics: true, personalization: false, given: '2026-02-01', updated: '2026-02-01' },
    { user: 'maria@example.dk', marketing: true, analytics: true, personalization: true, given: '2026-01-28', updated: '2026-01-30' },
    { user: 'peter@example.dk', marketing: false, analytics: true, personalization: false, given: '2026-01-25', updated: '2026-01-25' },
    { user: 'louise@example.dk', marketing: true, analytics: false, personalization: false, given: '2026-01-20', updated: '2026-02-03' },
  ];
  document.getElementById('data-consents-table').innerHTML = consents.map(c =>
    `<tr><td>${c.user}</td><td style="color:${c.marketing ? 'var(--success)' : 'var(--error)'}">${c.marketing ? 'Ja' : 'Nej'}</td><td style="color:${c.analytics ? 'var(--success)' : 'var(--error)'}">${c.analytics ? 'Ja' : 'Nej'}</td><td style="color:${c.personalization ? 'var(--success)' : 'var(--error)'}">${c.personalization ? 'Ja' : 'Nej'}</td><td>${c.given}</td><td>${c.updated}</td></tr>`
  ).join('');

  // GDPR data requests table (ID, Bruger, Type, Status, Anmodet, Fuldført)
  const dataRequests = [
    { id: 'GDPR001', user: 'user1@example.dk', type: 'Indsigt', status: 'Fuldført', requested: '2026-01-15', completed: '2026-01-16' },
    { id: 'GDPR002', user: 'user2@example.dk', type: 'Indsigt', status: 'Fuldført', requested: '2026-01-20', completed: '2026-01-21' },
    { id: 'GDPR003', user: 'user3@example.dk', type: 'Sletning', status: 'Afventer', requested: '2026-02-04', completed: '-' },
  ];
  const gdprStatusColors = { 'Fuldført': 'var(--success)', 'Afventer': 'var(--warning)', 'Afvist': 'var(--error)' };
  document.getElementById('data-gdpr-requests-table').innerHTML = dataRequests.map(r =>
    `<tr><td style="padding:10px 12px;font-family:monospace;font-size:11px">${r.id}</td><td>${r.user}</td><td>${r.type}</td><td style="color:${gdprStatusColors[r.status]}">${r.status}</td><td>${r.requested}</td><td>${r.completed}</td></tr>`
  ).join('');

  // Data deletions table (ID, Bruger, Data type, Records, Slettet, Af)
  const deletions = [
    { id: 'DEL001', user: 'old@example.dk', dataType: 'Personlige data', records: 156, deleted: '2026-01-10', by: 'admin@flow.dk' },
    { id: 'DEL002', user: 'former@example.dk', dataType: 'Profil, Ordrer', records: 45, deleted: '2026-01-05', by: 'system' },
  ];
  document.getElementById('data-deletions-table').innerHTML = deletions.map(d =>
    `<tr><td style="font-family:monospace;font-size:11px">${d.id}</td><td>${d.user}</td><td>${d.dataType}</td><td>${d.records}</td><td>${d.deleted}</td><td>${d.by}</td></tr>`
  ).join('');

  initDataGrid('dg-consents');
  initDataGrid('dg-gdpr-requests');
  initDataGrid('dg-deletions');
}

// Load performance data
function loadPerformanceData() {
  // Stats
  document.getElementById('perf-uptime').textContent = '99.9%';
  document.getElementById('perf-avg-response').textContent = '45ms';
  document.getElementById('perf-p95').textContent = '120ms';
  document.getElementById('perf-errors').textContent = '0.1%';
  document.getElementById('perf-requests').textContent = '234/min';
  document.getElementById('perf-db-time').textContent = '12ms';

  // API performance table (Endpoint, Requests, Avg (ms), P50, P95, P99, Errors)
  const apiPerformance = [
    { endpoint: '/api/orders', requests: 1234, avg: 23, p50: 18, p95: 45, p99: 120, errors: 0 },
    { endpoint: '/api/orders (POST)', requests: 456, avg: 67, p50: 55, p95: 150, p99: 280, errors: 1 },
    { endpoint: '/api/products', requests: 2345, avg: 15, p50: 12, p95: 35, p99: 80, errors: 0 },
    { endpoint: '/api/users', requests: 876, avg: 28, p50: 22, p95: 55, p99: 130, errors: 0 },
    { endpoint: '/api/analytics', requests: 345, avg: 89, p50: 75, p95: 180, p99: 350, errors: 1 },
  ];
  document.getElementById('data-api-perf-table').innerHTML = apiPerformance.map(a =>
    `<tr><td style="padding:10px 12px;font-family:monospace;font-size:11px">${a.endpoint}</td><td>${a.requests}</td><td>${a.avg}</td><td>${a.p50}</td><td>${a.p95}</td><td>${a.p99}</td><td style="padding-right:12px;color:${a.errors > 0 ? 'var(--error)' : 'var(--success)'}">${a.errors}</td></tr>`
  ).join('');

  // Page load times table (Side, Visninger, Avg Load, FCP, LCP, CLS)
  const pageLoads = [
    { page: '/menu', views: 4567, avg: '0.8s', fcp: '0.5s', lcp: '1.2s', cls: '0.05' },
    { page: '/checkout', views: 1234, avg: '1.1s', fcp: '0.7s', lcp: '1.8s', cls: '0.08' },
    { page: '/orders', views: 876, avg: '0.9s', fcp: '0.6s', lcp: '1.4s', cls: '0.03' },
    { page: '/', views: 5678, avg: '0.6s', fcp: '0.3s', lcp: '1.0s', cls: '0.02' },
  ];
  document.getElementById('data-page-perf-table').innerHTML = pageLoads.map(p =>
    `<tr><td style="padding:10px 12px;font-family:monospace;font-size:11px">${p.page}</td><td>${p.views}</td><td>${p.avg}</td><td>${p.fcp}</td><td>${p.lcp}</td><td>${p.cls}</td></tr>`
  ).join('');

  // Database performance table (Query, Calls, Avg (ms), Max, Rows, Cache)
  const dbPerformance = [
    { query: 'SELECT * FROM orders...', calls: 1234, avg: 5, max: 45, rows: '50 avg', cache: '78%' },
    { query: 'INSERT INTO events...', calls: 5678, avg: 2, max: 15, rows: '1', cache: '-' },
    { query: 'SELECT * FROM products...', calls: 2345, avg: 3, max: 25, rows: '156', cache: '95%' },
    { query: 'UPDATE sessions...', calls: 890, avg: 4, max: 35, rows: '1', cache: '-' },
  ];
  document.getElementById('data-db-perf-table').innerHTML = dbPerformance.map(d =>
    `<tr><td style="font-family:monospace;font-size:11px;max-width:200px;overflow:hidden;text-overflow:ellipsis">${d.query}</td><td>${d.calls}</td><td>${d.avg}</td><td>${d.max}</td><td>${d.rows}</td><td>${d.cache}</td></tr>`
  ).join('');

  initDataGrid('dg-api-perf');
  initDataGrid('dg-page-perf');
  initDataGrid('dg-db-perf');
}

// Load geographic and device data
function loadGeoData() {
  // Stats
  document.getElementById('geo-countries').textContent = '12';
  document.getElementById('geo-cities').textContent = '45';
  document.getElementById('geo-mobile').textContent = '68%';
  document.getElementById('geo-desktop').textContent = '28%';
  document.getElementById('geo-browsers').textContent = '8';
  document.getElementById('geo-os').textContent = '5';

  // Geographic data table (Land, By, Besøg, Ordrer, Omsætning, Konv. %)
  const geoData = [
    { country: 'Danmark', city: 'København', visits: 4567, orders: 234, revenue: '67,500 kr', convRate: '5.1%' },
    { country: 'Danmark', city: 'Aarhus', visits: 1234, orders: 89, revenue: '24,300 kr', convRate: '7.2%' },
    { country: 'Danmark', city: 'Odense', visits: 567, orders: 45, revenue: '12,100 kr', convRate: '7.9%' },
    { country: 'Sverige', city: 'Malmö', visits: 345, orders: 23, revenue: '6,200 kr', convRate: '6.7%' },
    { country: 'Tyskland', city: 'Hamburg', visits: 123, orders: 12, revenue: '3,400 kr', convRate: '9.8%' },
  ];
  document.getElementById('data-geo-table').innerHTML = geoData.map(g =>
    `<tr><td>${g.country}</td><td>${g.city}</td><td>${g.visits}</td><td>${g.orders}</td><td>${g.revenue}</td><td>${g.convRate}</td></tr>`
  ).join('');

  // Device types table (Device Type, Model, Sessions, Bounce %, Avg Duration, Konv. %)
  const devices = [
    { type: 'Mobile', model: 'iPhone', sessions: 2345, bounce: '42%', avgDuration: '2:45', convRate: '6.7%' },
    { type: 'Mobile', model: 'Samsung Galaxy', sessions: 1234, bounce: '45%', avgDuration: '2:30', convRate: '7.2%' },
    { type: 'Desktop', model: 'Mac', sessions: 876, bounce: '35%', avgDuration: '4:20', convRate: '8.9%' },
    { type: 'Desktop', model: 'Windows PC', sessions: 567, bounce: '38%', avgDuration: '3:55', convRate: '7.9%' },
    { type: 'Tablet', model: 'iPad', sessions: 234, bounce: '32%', avgDuration: '5:10', convRate: '9.8%' },
  ];
  document.getElementById('data-devices-table').innerHTML = devices.map(d =>
    `<tr><td>${d.type}</td><td>${d.model}</td><td>${d.sessions}</td><td>${d.bounce}</td><td>${d.avgDuration}</td><td>${d.convRate}</td></tr>`
  ).join('');

  // Browsers table (Browser, Version, OS, Sessions, Share %, Issues)
  const browsers = [
    { browser: 'Chrome', version: '121', os: 'iOS', sessions: 2345, share: '45%', issues: 0 },
    { browser: 'Safari', version: '17', os: 'iOS', sessions: 1567, share: '30%', issues: 0 },
    { browser: 'Chrome', version: '121', os: 'Windows', sessions: 678, share: '13%', issues: 1 },
    { browser: 'Firefox', version: '122', os: 'macOS', sessions: 345, share: '7%', issues: 0 },
    { browser: 'Edge', version: '121', os: 'Windows', sessions: 234, share: '5%', issues: 0 },
  ];
  document.getElementById('data-browsers-table').innerHTML = browsers.map(b =>
    `<tr><td>${b.browser}</td><td>${b.version}</td><td>${b.os}</td><td>${b.sessions}</td><td>${b.share}</td><td style="color:${b.issues > 0 ? 'var(--warning)' : 'var(--success)'}">${b.issues}</td></tr>`
  ).join('');

  initDataGrid('dg-geo');
  initDataGrid('dg-devices');
  initDataGrid('dg-browsers');
}

// View table data in Supabase viewer
function viewTableData(table) {
  document.getElementById('supabase-table-select').value = table;
  loadSupabaseTableData();
}

// Load table data from Supabase
function loadSupabaseTableData() {
  const table = document.getElementById('supabase-table-select').value;
  const limit = document.getElementById('supabase-limit').value || 50;
  const viewer = document.getElementById('supabase-data-viewer');

  if (!table) {
    viewer.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted)">Vælg tabel for at se data</div>';
    return;
  }

  // SECURITY FIX v4.12.0: Escape table name
  viewer.innerHTML = `<div style="padding:20px;text-align:center;color:var(--muted)">Indlæser ${escapeHtml(table)} (limit: ${escapeHtml(String(limit))})...</div>`;

  // Demo: Show sample data
  setTimeout(() => {
    viewer.innerHTML = `<table class="data-table" style="margin:0;width:100%"><thead><tr><th style="padding-left:12px">id</th><th>created_at</th><th>data</th><th style="padding-right:12px">status</th></tr></thead><tbody>
      <tr><td style="padding:8px 12px">1</td><td>2026-02-05 10:30</td><td>{...}</td><td>active</td></tr>
      <tr><td style="padding:8px 12px">2</td><td>2026-02-05 09:15</td><td>{...}</td><td>active</td></tr>
      <tr><td style="padding:8px 12px">3</td><td>2026-02-04 15:20</td><td>{...}</td><td>active</td></tr>
    </tbody></table>`;
  }, 500);
}

// Export functions
function exportDataTable(type) {
  alert(`Eksporterer ${type} data til CSV...`);
}

function exportAuditLog() {
  alert('Eksporterer audit log til CSV...');
}

// Load customer data table
function loadCustomerData() {
  const tbody = document.getElementById('customer-data-table');
  if (!tbody) return;

  // Demo data - replace with actual Supabase query
  const customers = [
    { name: 'Anders Jensen', email: 'anders@example.dk', phone: '+45 12 34 56 78', created: '2026-01-15', lastOrder: '2026-02-03', orders: 12 },
    { name: 'Maria Nielsen', email: 'maria@example.dk', phone: '+45 23 45 67 89', created: '2026-01-20', lastOrder: '2026-02-04', orders: 8 },
    { name: 'Peter Larsen', email: 'peter@example.dk', phone: '+45 34 56 78 90', created: '2026-01-25', lastOrder: '2026-02-01', orders: 5 },
    { name: 'Louise Hansen', email: 'louise@example.dk', phone: '+45 45 67 89 01', created: '2026-02-01', lastOrder: '2026-02-05', orders: 3 },
    { name: 'Thomas Pedersen', email: 'thomas@example.dk', phone: '+45 56 78 90 12', created: '2026-02-03', lastOrder: '-', orders: 1 },
  ];

  tbody.innerHTML = customers.map(c => `
    <tr style="cursor:pointer" onclick="showCustomerDetails('${c.email}')">
      <td style="padding:12px 16px">${c.name}</td>
      <td style="padding:12px 8px">${c.email}</td>
      <td style="padding:12px 8px">${c.phone}</td>
      <td style="padding:12px 8px">${c.created}</td>
      <td style="padding:12px 8px">${c.lastOrder}</td>
      <td style="padding:12px 16px;text-align:right">${c.orders}</td>
    </tr>
  `).join('');
}

// Load activity log
function loadActivityLog() {
  const tbody = document.getElementById('activity-log-table');
  if (!tbody) return;

  // Demo data - replace with actual Supabase query
  const activities = [
    { time: '10:45', user: 'anders@example.dk', action: 'login', ip: '192.168.1.45', device: 'iPhone 15 Pro' },
    { time: '10:42', user: 'maria@example.dk', action: 'logout', ip: '192.168.1.32', device: 'Chrome / Windows' },
    { time: '10:38', user: 'louise@example.dk', action: 'login', ip: '192.168.1.78', device: 'Safari / macOS' },
    { time: '10:30', user: 'peter@example.dk', action: 'signup', ip: '192.168.1.99', device: 'Android App' },
    { time: '10:15', user: 'thomas@example.dk', action: 'login', ip: '192.168.1.12', device: 'Chrome / Windows' },
  ];

  const actionLabels = { login: 'Login', logout: 'Logout', signup: 'Oprettet konto' };
  const actionColors = { login: 'var(--success)', logout: 'var(--muted)', signup: 'var(--accent)' };

  tbody.innerHTML = activities.map(a => `
    <tr>
      <td style="padding:12px 16px">${a.time}</td>
      <td style="padding:12px 8px">${a.user}</td>
      <td style="padding:12px 8px"><span style="color:${actionColors[a.action]}">${actionLabels[a.action]}</span></td>
      <td style="padding:12px 8px;color:var(--muted)">${a.ip}</td>
      <td style="padding:12px 16px">${a.device}</td>
    </tr>
  `).join('');
}

// Load signups chart
function loadSignupsChart() {
  const container = document.getElementById('signups-chart');
  if (!container) return;

  // Demo data - 30 days
  const data = [3, 5, 2, 7, 4, 6, 8, 3, 5, 9, 4, 6, 7, 5, 8, 10, 6, 4, 7, 9, 5, 8, 6, 7, 11, 8, 9, 12, 7, 10];
  const max = Math.max(...data);

  container.innerHTML = data.map((val, i) => `
    <div style="flex:1;background:var(--accent);border-radius:2px 2px 0 0;height:${(val/max)*100}%;min-height:4px;opacity:${0.5 + (i/data.length)*0.5}" title="Dag ${i+1}: ${val} nye konti"></div>
  `).join('');
}

// Load raw data stats
function loadRawDataStats() {
  document.getElementById('stat-total-customers')?.textContent && (document.getElementById('stat-total-customers').textContent = '1,234');
  document.getElementById('stat-new-signups')?.textContent && (document.getElementById('stat-new-signups').textContent = '+87');
  document.getElementById('stat-active-users')?.textContent && (document.getElementById('stat-active-users').textContent = '156');
  document.getElementById('stat-returning')?.textContent && (document.getElementById('stat-returning').textContent = '68%');
}

// Load system log
function loadSystemLog() {
  const tbody = document.getElementById('system-log-table');
  if (!tbody) return;

  // Demo data
  const logs = [
    { time: '10:45:23', type: 'order', desc: 'Ordre #4523 oprettet', user: 'anders@example.dk' },
    { time: '10:42:15', type: 'payment', desc: 'Betaling modtaget: 485 kr', user: 'System' },
    { time: '10:38:07', type: 'system', desc: 'Daglig rapport genereret', user: 'System' },
    { time: '10:30:45', type: 'order', desc: 'Ordre #4522 leveret', user: 'System' },
    { time: '10:15:32', type: 'error', desc: 'Webhook timeout: retry pending', user: 'System' },
  ];

  const typeColors = { order: 'var(--accent)', payment: 'var(--success)', system: 'var(--muted)', error: 'var(--error)' };
  const typeLabels = { order: 'Ordre', payment: 'Betaling', system: 'System', error: 'Fejl' };

  tbody.innerHTML = logs.map(l => `
    <tr>
      <td style="padding:12px 16px;font-family:monospace;font-size:12px">${l.time}</td>
      <td style="padding:12px 8px"><span style="color:${typeColors[l.type]};font-weight:500">${typeLabels[l.type]}</span></td>
      <td style="padding:12px 8px">${l.desc}</td>
      <td style="padding:12px 16px;color:var(--muted)">${l.user}</td>
    </tr>
  `).join('');
}

// Filter functions for data tables
function filterCustomerTable() {
  const search = document.getElementById('customer-search')?.value?.toLowerCase() || '';
  const rows = document.querySelectorAll('#customer-data-table tr');
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(search) ? '' : 'none';
  });
}

function filterActivityLog() {
  const filter = document.getElementById('activity-filter')?.value || 'all';
  // In production, this would reload from database with filter
  console.log('Filter activity log:', filter);
}

function filterSystemLog() {
  const filter = document.getElementById('system-log-filter')?.value || 'all';
  // In production, this would reload from database with filter
  console.log('Filter system log:', filter);
}

function exportCustomerData() {
  // In production, this would export actual data
  alert('Eksporterer kundedata til CSV...');
}

function showCustomerDetails(email) {
  // In production, this would show customer details modal
  console.log('Show customer details for:', email);
}

// Switch Analytics sub-tab within Oversigt page

function loadBlogPosts() {
  const saved = localStorage.getItem('flow_blog_posts');
  blogPosts = saved ? JSON.parse(saved) : [];
  renderBlogList();
}

// Render blog list
function renderBlogList() {
  const tbody = document.getElementById('flow-blog-list');
  const emptyEl = document.getElementById('flow-blog-empty');

  if (!tbody) return;

  if (blogPosts.length === 0) {
    tbody.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  tbody.innerHTML = blogPosts.map((post, index) => `
    <tr>
      <td style="font-weight:500">
        ${post.featured_image ? '<span style="color:var(--success);margin-right:4px" title="Har billede">●</span>' : ''}
        ${post.title || 'Uden titel'}
      </td>
      <td style="color:var(--muted)">${post.category || '-'}</td>
      <td><span class="flow-blog-status ${post.status}">${post.status === 'published' ? 'Publiceret' : 'Kladde'}</span></td>
      <td style="color:var(--muted)">${new Date(post.created_at).toLocaleDateString('da-DK')}</td>
      <td style="text-align:right">
        <button class="btn btn-sm btn-secondary" onclick="editBlogPost(${index})">Rediger</button>
        <button class="btn btn-sm" style="color:var(--danger)" onclick="deleteBlogPost(${index})">Slet</button>
      </td>
    </tr>
  `).join('');
}

// Create new blog post
function createNewBlogPost() {
  currentBlogPost = {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    category: '',
    author: '',
    status: 'draft',
    created_at: new Date().toISOString()
  };

  document.getElementById('blog-title').value = '';
  document.getElementById('blog-slug').value = '';
  document.getElementById('blog-excerpt').value = '';
  document.getElementById('blog-content').value = '';
  document.getElementById('blog-featured-image').value = '';
  document.getElementById('blog-category').value = '';
  document.getElementById('blog-author').value = '';

  switchFlowCMSTab('blog-editor');
}

// Edit blog post
function editBlogPost(index) {
  currentBlogPost = { ...blogPosts[index], _index: index };

  document.getElementById('blog-title').value = currentBlogPost.title || '';
  document.getElementById('blog-slug').value = currentBlogPost.slug || '';
  document.getElementById('blog-excerpt').value = currentBlogPost.excerpt || '';
  document.getElementById('blog-content').value = currentBlogPost.content || '';
  document.getElementById('blog-featured-image').value = currentBlogPost.featured_image || '';
  document.getElementById('blog-category').value = currentBlogPost.category || '';
  document.getElementById('blog-author').value = currentBlogPost.author || '';

  switchFlowCMSTab('blog-editor');
}

// Save blog post
function saveBlogPost(status) {
  if (!currentBlogPost) return;

  currentBlogPost.title = document.getElementById('blog-title').value;
  currentBlogPost.slug = document.getElementById('blog-slug').value || generateSlug(currentBlogPost.title);
  currentBlogPost.excerpt = document.getElementById('blog-excerpt').value;
  currentBlogPost.content = document.getElementById('blog-content').value;
  currentBlogPost.featured_image = document.getElementById('blog-featured-image').value;
  currentBlogPost.category = document.getElementById('blog-category').value;
  currentBlogPost.author = document.getElementById('blog-author').value;
  currentBlogPost.status = status;
  currentBlogPost.updated_at = new Date().toISOString();

  if (status === 'published' && !currentBlogPost.published_at) {
    currentBlogPost.published_at = new Date().toISOString();
  }

  if (currentBlogPost._index !== undefined) {
    blogPosts[currentBlogPost._index] = currentBlogPost;
  } else {
    blogPosts.push(currentBlogPost);
  }

  localStorage.setItem('flow_blog_posts', JSON.stringify(blogPosts));

  const statusEl = document.getElementById('blog-save-status');
  if (statusEl) {
    statusEl.style.display = 'inline';
    setTimeout(() => statusEl.style.display = 'none', 3000);
  }

  toast(status === 'published' ? 'Blogindlæg publiceret!' : 'Kladde gemt', 'success');
  switchFlowCMSTab('blog');
}

// Delete blog post
function deleteBlogPost(index) {
  if (!confirm('Er du sikker på at du vil slette dette blogindlæg?')) return;

  blogPosts.splice(index, 1);
  localStorage.setItem('flow_blog_posts', JSON.stringify(blogPosts));
  renderBlogList();
  toast('Blogindlæg slettet', 'info');
}

// Generate URL slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// =====================================================
// WORKFLOW FUNCTIONS
// =====================================================

// Load workflow configuration
function loadWorkflowConfig(type) {
  const saved = localStorage.getItem('flow_product_' + type);
  const config = saved ? JSON.parse(saved) : {};

  if (type === 'sms') {
    const welcomeEl = document.getElementById('sms-welcome-msg');
    const confirmEl = document.getElementById('sms-confirm-msg');
    const reactivateEl = document.getElementById('sms-reactivate-msg');
    const daysEl = document.getElementById('sms-reactivate-days');

    if (welcomeEl) welcomeEl.value = config.welcome || '';
    if (confirmEl) confirmEl.value = config.confirm || '';
    if (reactivateEl) reactivateEl.value = config.reactivate || '';
    if (daysEl) daysEl.value = config.reactivateDays || 14;
  }

  if (type === 'instagram') {
    const welcomeEl = document.getElementById('ig-welcome-msg');
    const storyEl = document.getElementById('ig-story-mention-msg');
    const enabledEl = document.getElementById('ig-auto-reply-enabled');

    if (welcomeEl) welcomeEl.value = config.welcome || '';
    if (storyEl) storyEl.value = config.storyMention || '';
    if (enabledEl) enabledEl.checked = config.autoReplyEnabled || false;
  }

  if (type === 'facebook') {
    const welcomeEl = document.getElementById('fb-welcome-msg');
    const offlineEl = document.getElementById('fb-offline-msg');
    const enabledEl = document.getElementById('fb-auto-reply-enabled');

    if (welcomeEl) welcomeEl.value = config.welcome || '';
    if (offlineEl) offlineEl.value = config.offline || '';
    if (enabledEl) enabledEl.checked = config.autoReplyEnabled || false;
  }
}

// Save product workflow
function saveProductWorkflow(type) {
  let config = {};

  if (type === 'sms') {
    config = {
      welcome: document.getElementById('sms-welcome-msg')?.value || '',
      confirm: document.getElementById('sms-confirm-msg')?.value || '',
      reactivate: document.getElementById('sms-reactivate-msg')?.value || '',
      reactivateDays: parseInt(document.getElementById('sms-reactivate-days')?.value) || 14
    };
  }

  if (type === 'instagram') {
    config = {
      welcome: document.getElementById('ig-welcome-msg')?.value || '',
      storyMention: document.getElementById('ig-story-mention-msg')?.value || '',
      autoReplyEnabled: document.getElementById('ig-auto-reply-enabled')?.checked || false
    };
  }

  if (type === 'facebook') {
    config = {
      welcome: document.getElementById('fb-welcome-msg')?.value || '',
      offline: document.getElementById('fb-offline-msg')?.value || '',
      autoReplyEnabled: document.getElementById('fb-auto-reply-enabled')?.checked || false
    };
  }

  localStorage.setItem('flow_product_' + type, JSON.stringify(config));

  const statusId = type === 'sms' ? 'sms-save-status' : type === 'instagram' ? 'ig-save-status' : 'fb-save-status';
  const statusEl = document.getElementById(statusId);
  if (statusEl) {
    statusEl.style.display = 'inline';
    setTimeout(() => statusEl.style.display = 'none', 3000);
  }

  toast(type.toUpperCase() + ' Workflow gemt', 'success');
}

// Save SEO settings
function saveSEOSettings() {
  const config = {
    defaultDescription: document.getElementById('seo-default-description')?.value || '',
    defaultOgImage: document.getElementById('seo-default-og-image')?.value || ''
  };

  localStorage.setItem('flow_seo_settings', JSON.stringify(config));

  const statusEl = document.getElementById('seo-save-status');
  if (statusEl) {
    statusEl.style.display = 'inline';
    setTimeout(() => statusEl.style.display = 'none', 3000);
  }

  toast('SEO indstillinger gemt', 'success');
}

// =====================================================
// END FLOW CMS FUNCTIONS
// =====================================================

// Switch Farver tab (Tilpasset/Forudindstillinger)
function switchFarverTab(tab) {
  document.querySelectorAll('#page-wb-farver .settings-tab').forEach(t => t.classList.remove('active'));
  const activeTab = document.querySelector(`#page-wb-farver .settings-tab[onclick*="'${tab}'"]`);
  if (activeTab) activeTab.classList.add('active');

  document.querySelectorAll('.farver-tab-content').forEach(c => {
    c.style.display = 'none';
    c.classList.remove('active');
  });
  const content = document.getElementById('farver-' + tab);
  if (content) {
    content.style.display = 'block';
    content.classList.add('active');
  }
}

// Switch Billeder tab (Logo/Hero/Galleri)
function switchBillederTab(tab) {
  document.querySelectorAll('#page-wb-billeder .settings-tab').forEach(t => t.classList.remove('active'));
  const activeTab = document.querySelector(`#page-wb-billeder .settings-tab[onclick*="'${tab}'"]`);
  if (activeTab) activeTab.classList.add('active');

  document.querySelectorAll('.billeder-tab-content').forEach(c => {
    c.style.display = 'none';
    c.classList.remove('active');
  });
  const content = document.getElementById('billeder-' + tab);
  if (content) {
    content.style.display = 'block';
    content.classList.add('active');
  }

  // Initialize gallery grid when galleri tab is selected
  if (tab === 'galleri') {
    initGalleryGrid();
  }
}

// Apply color theme preset
function applyColorTheme(theme) {
  const themes = {
    'pizza-red': { primary: '#E63946', secondary: '#F4A261', accent: '#F9C74F', bg: '#FAFAFA', text: '#264653' },
    'sushi-green': { primary: '#2D6A4F', secondary: '#40916C', accent: '#74C69D', bg: '#FAFAFA', text: '#1B4332' },
    'burger-orange': { primary: '#E76F51', secondary: '#F4A261', accent: '#E9C46A', bg: '#FAFAFA', text: '#264653' },
    'cafe-brown': { primary: '#6F4E37', secondary: '#A67B5B', accent: '#D4A373', bg: '#FAFAFA', text: '#3C2415' },
    'dark-mode': { primary: '#BB86FC', secondary: '#03DAC6', accent: '#CF6679', bg: '#121212', text: '#FFFFFF' }
  };

  const colors = themes[theme];
  if (!colors) return;

  document.getElementById('wb-color-primary').value = colors.primary;
  document.getElementById('wb-color-primary-text').value = colors.primary;
  document.getElementById('wb-color-secondary').value = colors.secondary;
  document.getElementById('wb-color-secondary-text').value = colors.secondary;
  document.getElementById('wb-color-accent').value = colors.accent;
  document.getElementById('wb-color-accent-text').value = colors.accent;
  if (document.getElementById('wb-color-bg')) {
    document.getElementById('wb-color-bg').value = colors.bg;
    document.getElementById('wb-color-bg-text').value = colors.bg;
  }

  updateWebBuilderPreview();
  switchFarverTab('tilpasset');
}

// Toggle Web Builder Preview Panel
let webBuilderPreviewVisible = false;
function toggleWebBuilderPreview() {
  const modal = document.getElementById('wb-preview-modal');
  if (modal && modal.style.display === 'flex') {
    closeWbPreviewModal();
    webBuilderPreviewVisible = false;
  } else {
    openWebBuilderPreviewFullscreen();
    webBuilderPreviewVisible = true;
  }
}

// Set all days open
function setAllDaysOpen() {
  document.querySelectorAll('#wb-hours-grid input[type="checkbox"]').forEach(cb => cb.checked = true);
  updateWebBuilderPreview();
}

// Set all days closed
function setAllDaysClosed() {
  document.querySelectorAll('#wb-hours-grid input[type="checkbox"]').forEach(cb => cb.checked = false);
  updateWebBuilderPreview();
}

// Legacy function for backwards compatibility

function loadLandingPageConfig() {
  const saved = localStorage.getItem('orderflow_landing_page');
  if (saved) {
    try {
      landingPageConfig = JSON.parse(saved);
    } catch (e) {
      console.error('Error loading landing page config:', e);
      landingPageConfig = JSON.parse(JSON.stringify(defaultLandingPageConfig));
    }
  } else {
    landingPageConfig = JSON.parse(JSON.stringify(defaultLandingPageConfig));
  }
}

// Save Landing Page config
function saveLandingPageConfig() {
  localStorage.setItem('orderflow_landing_page', JSON.stringify(landingPageConfig));

  // Show save status
  const statusIds = [
    'landing-save-status',
    'landing-tabs-save-status',
    'landing-trusted-save-status',
    'landing-features-save-status',
    'landing-bento-save-status',
    'landing-beliefs-save-status',
    'landing-testimonials-save-status',
    'landing-footer-save-status'
  ];

  statusIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = 'inline';
      setTimeout(() => { el.style.display = 'none'; }, 3000);
    }
  });

  toast('Landing Page gemt', 'success');
}

// Navigate to Landing Page CMS and switch to tab
function showLandingCMSTab(tab) {
  showPage('landing-cms');
  setTimeout(() => switchLandingCMSTab(tab), 50);
}

// Switch Landing CMS tab
function switchLandingCMSTab(tab) {
  // Load config if not loaded
  if (!landingPageConfig) loadLandingPageConfig();

  // Update tab buttons
  document.querySelectorAll('#page-landing-cms .settings-tab').forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent.toLowerCase().includes(tab.toLowerCase()) ||
        (tab === 'hero' && btn.textContent === 'Hero') ||
        (tab === 'tabs' && btn.textContent === 'Feature Tabs') ||
        (tab === 'trusted' && btn.textContent === 'Trusted By') ||
        (tab === 'features' && btn.textContent === 'Features') ||
        (tab === 'bento' && btn.textContent === 'Bento') ||
        (tab === 'beliefs' && btn.textContent === 'Beliefs') ||
        (tab === 'testimonials' && btn.textContent === 'Testimonials') ||
        (tab === 'how-it-works' && btn.textContent === 'Sådan virker det') ||
        (tab === 'footer' && btn.textContent === 'Footer')) {
      btn.classList.add('active');
    }
  });

  // Switch content
  document.querySelectorAll('#page-landing-cms .settings-tab-content').forEach(c => c.classList.remove('active'));
  const contentEl = document.getElementById('landing-cms-content-' + tab);
  if (contentEl) contentEl.classList.add('active');

  // Populate form fields
  populateLandingTab(tab);
}

// Populate form fields for a tab
function populateLandingTab(tab) {
  if (!landingPageConfig) loadLandingPageConfig();

  switch (tab) {
    case 'hero':
      setInputValue('landing-hero-video', landingPageConfig.hero.videoUrl);
      setInputValue('landing-hero-headline', landingPageConfig.hero.headline);
      setInputValue('landing-hero-subheadline', landingPageConfig.hero.subheadline);
      setInputValue('landing-hero-rotating', (landingPageConfig.hero.rotatingWords || []).join(', '));
      setInputValue('landing-hero-btn1-text', landingPageConfig.hero.primaryButton.text);
      setInputValue('landing-hero-btn1-url', landingPageConfig.hero.primaryButton.url);
      setInputValue('landing-hero-btn2-text', landingPageConfig.hero.secondaryButton.text);
      setInputValue('landing-hero-btn2-url', landingPageConfig.hero.secondaryButton.url);
      break;

    case 'tabs':
      renderLandingTabs();
      break;

    case 'trusted':
      setInputValue('landing-trusted-heading', landingPageConfig.trusted.heading);
      renderLandingTrustedCards();
      break;

    case 'features':
      setInputValue('landing-features-heading', landingPageConfig.appleFeatures.heading);
      setInputValue('landing-features-subheading', landingPageConfig.appleFeatures.subheading);
      renderLandingFeatureCards();
      break;

    case 'bento':
      setInputValue('landing-bento-heading', landingPageConfig.bento.heading);
      renderLandingBentoCards();
      break;

    case 'beliefs':
      setInputValue('landing-beliefs-title', landingPageConfig.beliefs.mainTitle);
      setInputValue('landing-beliefs-subtitle', landingPageConfig.beliefs.subtitle);
      setInputValue('landing-beliefs-author-name', landingPageConfig.beliefs.author.name);
      setInputValue('landing-beliefs-author-role', landingPageConfig.beliefs.author.role);
      setInputValue('landing-beliefs-author-image', landingPageConfig.beliefs.author.imageUrl);
      renderLandingBeliefs();
      break;

    case 'testimonials':
      renderLandingTestimonials();
      break;

    case 'how-it-works':
      loadHIWTestimonials();
      break;

    case 'footer':
      setInputValue('landing-footer-phone', landingPageConfig.footer.supportSection.phone);
      setInputValue('landing-footer-email', landingPageConfig.footer.supportSection.email);
      setInputValue('landing-footer-copyright', landingPageConfig.footer.bottomSection.copyright);
      renderLandingFooterColumns();
      break;
  }
}

// Helper to set input value
function setInputValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || '';
}

// Update Landing Page config
function updateLandingConfig(section, path, value) {
  if (!landingPageConfig) loadLandingPageConfig();

  const parts = path.split('.');
  let obj = landingPageConfig[section];

  for (let i = 0; i < parts.length - 1; i++) {
    obj = obj[parts[i]];
  }
  obj[parts[parts.length - 1]] = value;
}

// Render Feature Tabs editor
function renderLandingTabs() {
  const container = document.getElementById('landing-tabs-container');
  if (!container) return;

  container.innerHTML = landingPageConfig.tabs.map((tab, i) => `
    <div class="setting-card" style="margin-bottom:16px">
      <div class="setting-title">Tab ${i + 1}: ${tab.label}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div class="form-group">
          <label class="form-label">Label</label>
          <input type="text" class="input" value="${tab.label}" oninput="updateLandingTab(${i}, 'label', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">Nummer</label>
          <input type="text" class="input" value="${tab.number}" oninput="updateLandingTab(${i}, 'number', this.value)">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Overskrift</label>
        <input type="text" class="input" value="${tab.heading}" oninput="updateLandingTab(${i}, 'heading', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Beskrivelse</label>
        <textarea class="input" rows="2" oninput="updateLandingTab(${i}, 'description', this.value)">${tab.description}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Billede URL</label>
        <input type="text" class="input" value="${tab.imageUrl}" oninput="updateLandingTab(${i}, 'imageUrl', this.value)">
      </div>
    </div>
  `).join('');
}

// Update a tab
function updateLandingTab(index, field, value) {
  if (!landingPageConfig) loadLandingPageConfig();
  landingPageConfig.tabs[index][field] = value;
}

// Render Trusted By cards
function renderLandingTrustedCards() {
  const container = document.getElementById('landing-trusted-cards-container');
  if (!container) return;

  container.innerHTML = landingPageConfig.trusted.cards.map((card, i) => `
    <div class="setting-card" style="margin-bottom:16px">
      <div class="setting-title" style="display:flex;justify-content:space-between;align-items:center">
        Kort ${i + 1}
        <button class="btn btn-danger btn-sm" onclick="removeLandingTrustedCard(${i})">Slet</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div class="form-group">
          <label class="form-label">Navn</label>
          <input type="text" class="input" value="${card.name}" oninput="updateLandingTrustedCard(${i}, 'name', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">Rolle/By</label>
          <input type="text" class="input" value="${card.role}" oninput="updateLandingTrustedCard(${i}, 'role', this.value)">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Billede URL</label>
        <input type="text" class="input" value="${card.imageUrl}" oninput="updateLandingTrustedCard(${i}, 'imageUrl', this.value)">
      </div>
    </div>
  `).join('');

  container.innerHTML += `<button class="btn btn-secondary" onclick="addLandingTrustedCard()">+ Tilføj kort</button>`;
}

function updateLandingTrustedCard(index, field, value) {
  if (!landingPageConfig) loadLandingPageConfig();
  landingPageConfig.trusted.cards[index][field] = value;
}

function addLandingTrustedCard() {
  if (!landingPageConfig) loadLandingPageConfig();
  landingPageConfig.trusted.cards.push({
    id: 'c' + Date.now(),
    imageUrl: '',
    name: 'Ny restaurant',
    role: 'By',
    backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  });
  renderLandingTrustedCards();
}

function removeLandingTrustedCard(index) {
  if (!landingPageConfig) loadLandingPageConfig();
  landingPageConfig.trusted.cards.splice(index, 1);
  renderLandingTrustedCards();
}

// Render Feature cards
function renderLandingFeatureCards() {
  const container = document.getElementById('landing-features-cards-container');
  if (!container) return;

  container.innerHTML = landingPageConfig.appleFeatures.features.map((feat, i) => `
    <div class="setting-card" style="margin-bottom:16px">
      <div class="setting-title">Feature ${i + 1}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div class="form-group">
          <label class="form-label">Badge</label>
          <input type="text" class="input" value="${feat.badge}" oninput="updateLandingFeature(${i}, 'badge', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">Titel</label>
          <input type="text" class="input" value="${feat.title}" oninput="updateLandingFeature(${i}, 'title', this.value)">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Beskrivelse</label>
        <input type="text" class="input" value="${feat.description}" oninput="updateLandingFeature(${i}, 'description', this.value)">
      </div>
    </div>
  `).join('');
}

function updateLandingFeature(index, field, value) {
  if (!landingPageConfig) loadLandingPageConfig();
  landingPageConfig.appleFeatures.features[index][field] = value;
}

// Render Bento cards
function renderLandingBentoCards() {
  const container = document.getElementById('landing-bento-cards-container');
  if (!container) return;

  container.innerHTML = landingPageConfig.bento.cards.map((card, i) => `
    <div class="setting-card" style="margin-bottom:16px">
      <div class="setting-title">Bento Kort ${i + 1}</div>
      <div class="form-group">
        <label class="form-label">Label</label>
        <input type="text" class="input" value="${card.label}" oninput="updateLandingBento(${i}, 'label', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Titel</label>
        <input type="text" class="input" value="${card.title}" oninput="updateLandingBento(${i}, 'title', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Billede URL</label>
        <input type="text" class="input" value="${card.imageUrl}" oninput="updateLandingBento(${i}, 'imageUrl', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Link URL</label>
        <input type="text" class="input" value="${card.url || ''}" oninput="updateLandingBento(${i}, 'url', this.value)">
      </div>
    </div>
  `).join('');
}

function updateLandingBento(index, field, value) {
  if (!landingPageConfig) loadLandingPageConfig();
  landingPageConfig.bento.cards[index][field] = value;
}

// Render Beliefs
function renderLandingBeliefs() {
  const container = document.getElementById('landing-beliefs-items-container');
  if (!container) return;

  container.innerHTML = landingPageConfig.beliefs.beliefs.map((belief, i) => `
    <div class="setting-card" style="margin-bottom:16px">
      <div class="setting-title">Belief ${i + 1}</div>
      <div class="form-group">
        <label class="form-label">Overskrift</label>
        <input type="text" class="input" value="${belief.heading}" oninput="updateLandingBelief(${i}, 'heading', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Tekst</label>
        <textarea class="input" rows="2" oninput="updateLandingBelief(${i}, 'text', this.value)">${belief.text}</textarea>
      </div>
    </div>
  `).join('');
}

function updateLandingBelief(index, field, value) {
  if (!landingPageConfig) loadLandingPageConfig();
  landingPageConfig.beliefs.beliefs[index][field] = value;
}

// Render Testimonials
function renderLandingTestimonials() {
  const container = document.getElementById('landing-testimonials-container');
  if (!container) return;

  container.innerHTML = landingPageConfig.testimonials.map((test, i) => `
    <div class="setting-card" style="margin-bottom:16px">
      <div class="setting-title" style="display:flex;justify-content:space-between;align-items:center">
        Testimonial ${i + 1}
        <button class="btn btn-danger btn-sm" onclick="removeLandingTestimonial(${i})">Slet</button>
      </div>
      <div class="form-group">
        <label class="form-label">Citat</label>
        <textarea class="input" rows="3" oninput="updateLandingTestimonial(${i}, 'quote', this.value)">${test.quote}</textarea>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div class="form-group">
          <label class="form-label">Navn</label>
          <input type="text" class="input" value="${test.name}" oninput="updateLandingTestimonial(${i}, 'name', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">Rolle/Restaurant</label>
          <input type="text" class="input" value="${test.role}" oninput="updateLandingTestimonial(${i}, 'role', this.value)">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Avatar URL</label>
        <input type="text" class="input" value="${test.avatarUrl}" oninput="updateLandingTestimonial(${i}, 'avatarUrl', this.value)">
      </div>
    </div>
  `).join('');
}

function updateLandingTestimonial(index, field, value) {
  if (!landingPageConfig) loadLandingPageConfig();
  landingPageConfig.testimonials[index][field] = value;
}

function addLandingTestimonial() {
  if (!landingPageConfig) loadLandingPageConfig();
  landingPageConfig.testimonials.push({
    id: 't' + Date.now(),
    quote: 'Ny testimonial...',
    avatarUrl: '',
    name: 'Kundens navn',
    role: 'Restaurant, By'
  });
  renderLandingTestimonials();
}

function removeLandingTestimonial(index) {
  if (!landingPageConfig) loadLandingPageConfig();
  landingPageConfig.testimonials.splice(index, 1);
  renderLandingTestimonials();
}

// Render Footer columns
function renderLandingFooterColumns() {
  const container = document.getElementById('landing-footer-columns-container');
  if (!container) return;

  container.innerHTML = landingPageConfig.footer.columns.map((col, i) => `
    <div class="setting-card" style="margin-bottom:16px">
      <div class="setting-title">Kolonne ${i + 1}</div>
      <div class="form-group">
        <label class="form-label">Overskrift</label>
        <input type="text" class="input" value="${col.heading}" oninput="updateLandingFooterColumn(${i}, 'heading', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Links (ét pr. linje: tekst|url)</label>
        <textarea class="input" rows="4" oninput="updateLandingFooterLinks(${i}, this.value)">${col.links.map(l => l.text + '|' + l.url).join('\n')}</textarea>
      </div>
    </div>
  `).join('');
}

function updateLandingFooterColumn(index, field, value) {
  if (!landingPageConfig) loadLandingPageConfig();
  landingPageConfig.footer.columns[index][field] = value;
}

function updateLandingFooterLinks(colIndex, value) {
  if (!landingPageConfig) loadLandingPageConfig();
  const lines = value.split('\n').filter(l => l.trim());
  landingPageConfig.footer.columns[colIndex].links = lines.map((line, i) => {
    const parts = line.split('|');
    return {
      id: 'l' + Date.now() + i,
      text: parts[0] || '',
      url: parts[1] || '#'
    };
  });
}

// Open Landing Page preview
function openLandingPreview() {
  window.open('website-builder/dist/index.html', 'landingPreview', 'width=1200,height=800');
}

// ==================== HOW IT WORKS TESTIMONIALS ====================

// Default testimonials for how-it-works page
const defaultHIWTestimonials = {
  headline: 'Elsket af restauranter i hele Danmark',
  subheadline: 'Start din gratis prøveperiode. Ingen kreditkort påkrævet.',
  testimonials: [
    { id: 1, name: 'Martin', handle: '@cafe_amalfi', quote: 'Flow har ændret alt for os. Vores ordrer er steget med 40% siden vi startede.' },
    { id: 2, name: 'Sarah', handle: '@pasta_mia', quote: 'Endelig et system der bare virker. Ingen bøvl, ingen problemer.' },
    { id: 3, name: 'Jakob', handle: '@burger_joint', quote: 'Vores kunder elsker den nye app. Vi får rosende anmeldelser hver dag.' },
    { id: 4, name: 'Emma', handle: '@sushi_express', quote: 'Den bedste investering vi har gjort. ROI var positiv efter 2 uger.' },
    { id: 5, name: 'Anders', handle: '@pizza_palace', quote: 'Support teamet er fantastisk. De hjalp os med alt fra start til slut.' },
    { id: 6, name: 'Mette', handle: '@cafe_hygge', quote: 'Vi sparer 10 timer om ugen på administration. Det er uvurderligt.' },
    { id: 7, name: 'Thomas', handle: '@thai_garden', quote: 'Leveringsintegrationen er perfekt. Alt kører automatisk nu.' },
    { id: 8, name: 'Louise', handle: '@french_bistro', quote: 'Vores omsætning er steget 60% på 3 måneder. Utroligt resultat.' },
    { id: 9, name: 'Kasper', handle: '@grill_house', quote: 'Systemet er så intuitivt at selv min bedstemor kunne bruge det.' },
    { id: 10, name: 'Sofie', handle: '@salad_bar', quote: 'Push notifikationer har øget vores genbestillinger markant.' },
    { id: 11, name: 'Nikolaj', handle: '@taco_town', quote: 'Vi har fået 500+ nye kunder gennem appen på bare 2 måneder.' },
    { id: 12, name: 'Camilla', handle: '@dessert_heaven', quote: 'Analytics dashboardet giver os indsigt vi aldrig har haft før.' },
    { id: 13, name: 'Frederik', handle: '@seafood_shack', quote: 'Booking systemet har elimineret no-shows fuldstændigt.' },
    { id: 14, name: 'Ida', handle: '@vegan_vibes', quote: 'Flow integrerer perfekt med vores eksisterende systemer.' },
    { id: 15, name: 'Christian', handle: '@steakhouse_dk', quote: 'Kundeservice svarer altid inden for minutter. Imponerende.' },
    { id: 16, name: 'Julie', handle: '@breakfast_club', quote: 'Menuen er nem at opdatere og ændringerne vises med det samme.' },
    { id: 17, name: 'Mikkel', handle: '@wings_n_things', quote: 'QR-kode bestilling har reduceret ventetiden med 70%.' },
    { id: 18, name: 'Anna', handle: '@smoothie_spot', quote: 'Loyalitetsprogrammet har skabt en fast kundebase for os.' }
  ]
};

let hiwTestimonialsConfig = null;

// Load HIW testimonials from localStorage
function loadHIWTestimonials() {
  const saved = localStorage.getItem('orderflow_hiw_testimonials');
  if (saved) {
    hiwTestimonialsConfig = JSON.parse(saved);
  } else {
    hiwTestimonialsConfig = JSON.parse(JSON.stringify(defaultHIWTestimonials));
  }

  // Populate form fields
  setInputValue('hiw-testimonials-headline', hiwTestimonialsConfig.headline);
  setInputValue('hiw-testimonials-subheadline', hiwTestimonialsConfig.subheadline);

  // Render testimonials
  renderHIWTestimonials();
}

// Render HIW testimonials in the editor
function renderHIWTestimonials() {
  const container = document.getElementById('hiw-testimonials-container');
  if (!container || !hiwTestimonialsConfig) return;

  container.innerHTML = hiwTestimonialsConfig.testimonials.map((t, i) => `
    <div class="setting-card" style="margin-bottom:12px;padding:16px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:12px">
          <img src="https://avatar.vercel.sh/${encodeURIComponent(t.name)}?size=40"
               style="width:40px;height:40px;border-radius:50%;background:#e5e7eb">
          <div>
            <div style="font-weight:600;font-size:14px">${t.name}</div>
            <div style="font-size:12px;color:var(--muted)">${t.handle}</div>
          </div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="removeHIWTestimonial(${i})">Slet</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label" style="font-size:12px">Navn</label>
          <input type="text" class="input" value="${t.name}" oninput="updateHIWTestimonial(${i}, 'name', this.value)">
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label" style="font-size:12px">Handle</label>
          <input type="text" class="input" value="${t.handle}" oninput="updateHIWTestimonial(${i}, 'handle', this.value)">
        </div>
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label" style="font-size:12px">Citat</label>
        <textarea class="input" rows="2" oninput="updateHIWTestimonial(${i}, 'quote', this.value)">${t.quote}</textarea>
      </div>
    </div>
  `).join('');
}

// Update HIW testimonial config
function updateHIWTestimonialConfig() {
  if (!hiwTestimonialsConfig) loadHIWTestimonials();

  const headline = document.getElementById('hiw-testimonials-headline');
  const subheadline = document.getElementById('hiw-testimonials-subheadline');

  if (headline) hiwTestimonialsConfig.headline = headline.value;
  if (subheadline) hiwTestimonialsConfig.subheadline = subheadline.value;
}

// Update single testimonial
function updateHIWTestimonial(index, field, value) {
  if (!hiwTestimonialsConfig) loadHIWTestimonials();
  hiwTestimonialsConfig.testimonials[index][field] = value;
}

// Add new testimonial
function addHIWTestimonial() {
  if (!hiwTestimonialsConfig) loadHIWTestimonials();

  hiwTestimonialsConfig.testimonials.push({
    id: Date.now(),
    name: 'Ny kunde',
    handle: '@restaurant',
    quote: 'Skriv dit citat her...'
  });

  renderHIWTestimonials();
}

// Remove testimonial
function removeHIWTestimonial(index) {
  if (!hiwTestimonialsConfig) loadHIWTestimonials();

  if (hiwTestimonialsConfig.testimonials.length > 1) {
    hiwTestimonialsConfig.testimonials.splice(index, 1);
    renderHIWTestimonials();
  } else {
    toast('Du skal have mindst én testimonial', 'error');
  }
}

// Save HIW testimonials
function saveHIWTestimonials() {
  if (!hiwTestimonialsConfig) return;

  // Update headline/subheadline from inputs
  updateHIWTestimonialConfig();

  // Save to localStorage
  localStorage.setItem('orderflow_hiw_testimonials', JSON.stringify(hiwTestimonialsConfig));

  // Show save status
  const statusEl = document.getElementById('hiw-testimonials-save-status');
  if (statusEl) {
    statusEl.style.display = 'inline';
    setTimeout(() => { statusEl.style.display = 'none'; }, 3000);
  }

  toast('Testimonials gemt!', 'success');
}

// =====================================================
// TEMPLATE MANAGEMENT (Admin)
// =====================================================

let uploadedTemplateFile = null;
let currentTemplateCodeId = null;

function getTemplateOverrides() {
  return JSON.parse(localStorage.getItem('orderflow_template_overrides') || '{}');
}

function setTemplateOverrides(overrides) {
  localStorage.setItem('orderflow_template_overrides', JSON.stringify(overrides));
}

function getTemplateOverride(templateId) {
  const overrides = getTemplateOverrides();
  return overrides[templateId] || null;
}

function setTemplateOverride(templateId, html) {
  const overrides = getTemplateOverrides();
  overrides[templateId] = html;
  setTemplateOverrides(overrides);
}

function clearTemplateOverride(templateId) {
  const overrides = getTemplateOverrides();
  if (overrides[templateId]) delete overrides[templateId];
  setTemplateOverrides(overrides);
}

function resolveTemplateById(templateId) {
  if (webBuilderTemplates[templateId]) return webBuilderTemplates[templateId];
  const customTemplates = JSON.parse(localStorage.getItem('orderflow_custom_templates') || '[]');
  return customTemplates.find(t => t.id === templateId) || null;
}

function getTemplateBaseHref(template) {
  const previewFile = template?.previewFile || (template?.templatePath ? template.templatePath + 'index.html' : '');
  if (!previewFile) return '';
  try {
    return new URL(previewFile, window.location.href).href.replace(/[^/]*$/, '');
  } catch (e) {
    return previewFile.replace(/[^/]*$/, '');
  }
}

function injectBaseTag(html, baseHref) {
  if (!html || !baseHref) return html;
  if (/<base\\s/i.test(html)) return html;
  const headMatch = html.match(/<head[^>]*>/i);
  if (headMatch) {
    return html.replace(headMatch[0], `${headMatch[0]}<base href="${baseHref}">`);
  }
  return `<base href="${baseHref}">` + html;
}

function applyTemplateOverrideToPreview(templateId) {
  const template = resolveTemplateById(templateId);
  if (!template) return false;

  const override = getTemplateOverride(templateId);
  const baseHref = getTemplateBaseHref(template);
  const frames = [];

  const frameIds = ['webbuilder-preview-frame', 'wb-fullscreen-preview-frame'];
  frameIds.forEach(id => {
    const frame = document.getElementById(id);
    if (frame) frames.push(frame);
  });

  document.querySelectorAll('.webbuilder-preview-frame').forEach(frame => {
    if (!frames.includes(frame)) frames.push(frame);
  });

  if (override) {
    const html = injectBaseTag(override, baseHref);
    frames.forEach(iframe => {
      iframe.src = 'about:blank';
      iframe.srcdoc = html;
    });
    return true;
  }

  const previewFile = template.previewFile || (template.templatePath ? template.templatePath + 'index.html' : '');
  frames.forEach(iframe => {
    if (iframe.hasAttribute('srcdoc')) iframe.removeAttribute('srcdoc');
    if (previewFile) iframe.src = previewFile;
  });
  return false;
}

async function openTemplateCodeEditor(templateId) {
  currentTemplateCodeId = templateId;

  const titleEl = document.getElementById('template-code-editor-title');
  if (titleEl) titleEl.textContent = templateId;

  const editor = document.getElementById('template-code-editor');
  if (!editor) return;

  const override = getTemplateOverride(templateId);
  if (override) {
    editor.value = override;
    showModal('template-code-editor');
    return;
  }

  editor.value = 'Indlæser...';
  showModal('template-code-editor');

  const template = webBuilderTemplates[templateId];
  const previewFile = template?.previewFile || (template?.templatePath ? template.templatePath + 'index.html' : '');
  if (!previewFile) {
    editor.value = '';
    toast('Kunne ikke finde skabelon', 'error');
    return;
  }

  try {
    const response = await fetch(previewFile, { cache: 'no-cache' });
    if (!response.ok) throw new Error('Kunne ikke indlæse skabelon');
    const html = await response.text();
    editor.value = html;
  } catch (err) {
    editor.value = '';
    toast('Kunne ikke indlæse skabelon', 'error');
  }
}

function saveTemplateCode() {
  const editor = document.getElementById('template-code-editor');
  if (!editor || !currentTemplateCodeId) return;
  setTemplateOverride(currentTemplateCodeId, editor.value);
  applyTemplateOverrideToPreview(currentTemplateCodeId);
  renderInstalledTemplates();
  toast('Skabelon gemt!', 'success');
}

function resetTemplateCode() {
  if (!currentTemplateCodeId) return;
  clearTemplateOverride(currentTemplateCodeId);
  applyTemplateOverrideToPreview(currentTemplateCodeId);
  renderInstalledTemplates();
  openTemplateCodeEditor(currentTemplateCodeId);
  toast('Skabelon nulstillet', 'success');
}

// Render installed templates list
function renderInstalledTemplates() {
  const container = document.getElementById('templates-list');
  if (!container) return;

  // Get templates from webBuilderTemplates object and localStorage
  const customTemplates = JSON.parse(localStorage.getItem('orderflow_custom_templates') || '[]');
  const allTemplates = { ...webBuilderTemplates };

  // Add custom templates
  customTemplates.forEach(t => {
    allTemplates[t.id] = t;
    if (!webBuilderTemplates[t.id]) {
      webBuilderTemplates[t.id] = t;
    }
  });

  const templateIds = Object.keys(allTemplates);

  if (templateIds.length === 0) {
    container.innerHTML = '<p style="color:var(--muted);text-align:center;padding:32px">Ingen skabeloner installeret</p>';
    return;
  }

  container.innerHTML = templateIds.map(id => {
    const t = allTemplates[id];
    const isCustom = customTemplates.some(ct => ct.id === id);
    const colors = t.branding?.colors || {};
    const hasOverride = !!getTemplateOverride(id);

    return `
      <div class="template-card" style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;overflow:hidden">
        <div style="height:120px;background:linear-gradient(135deg, ${colors.primary || '#2563EB'} 0%, ${colors.secondary || '#1E293B'} 100%);position:relative">
          <div style="position:absolute;bottom:12px;left:12px;right:12px">
            <span class="badge ${isCustom ? 'badge-accent' : 'badge-success'}" style="font-size:10px">${isCustom ? 'Brugerdefineret' : 'Standard'}</span>
            ${hasOverride ? `<span class="badge" style="font-size:10px;background:var(--warn);color:#111;margin-left:6px">Override</span>` : ''}
          </div>
        </div>
        <div style="padding:16px">
          <h4 style="margin:0 0 4px;font-size:14px;font-weight:600">${t.branding?.name || id}</h4>
          <p style="margin:0;font-size:12px;color:var(--muted)">${t.branding?.slogan || 'Ingen beskrivelse'}</p>
          <div style="display:flex;gap:8px;margin-top:12px">
            <button class="btn btn-sm btn-secondary" onclick="previewTemplate('${id}')" style="flex:1">Forhåndsvis</button>
            <button class="btn btn-sm btn-secondary" onclick="openTemplateCodeEditor('${id}')" style="flex:1">Rediger kode</button>
          </div>
          <div style="display:flex;gap:8px;margin-top:8px">
            <button class="btn btn-sm btn-secondary" onclick="openTemplateCodeEditor('${id}')" style="flex:1">Åben editor</button>
            ${isCustom ? `<button class="btn btn-sm" style="background:var(--danger);color:white" onclick="deleteTemplate('${id}')">Slet</button>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Preview a template
function previewTemplate(templateId) {
  const template = resolveTemplateById(templateId);
  if (!template) {
    toast('Kunne ikke finde preview for denne skabelon', 'error');
    return;
  }
  const override = getTemplateOverride(templateId);

  if (override) {
    const baseHref = getTemplateBaseHref(template);
    const html = injectBaseTag(override, baseHref);
    const win = window.open('', '_blank', 'noopener');
    if (!win) {
      toast('Popup blev blokeret. Tillad popups for at åbne skabelonen.', 'warning');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    return;
  }

  if (template?.previewFile) {
    window.open(template.previewFile, '_blank');
  } else if (template?.templatePath) {
    window.open(template.templatePath + 'index.html', '_blank');
  } else {
    toast('Kunne ikke finde preview for denne skabelon', 'error');
  }
}

// Open template editor for a specific template (from FLOW CMS → Skabeloner)
function openTemplateEditor(templateId) {
  showPage('page-template-editor');
  const selector = document.getElementById('te-template-selector');
  if (selector) selector.value = templateId;
  loadTemplateEditorFiles(templateId);
}

// Delete a custom template
function deleteTemplate(templateId) {
  if (!confirm('Er du sikker på du vil slette denne skabelon? Dette kan ikke fortrydes.')) return;

  const customTemplates = JSON.parse(localStorage.getItem('orderflow_custom_templates') || '[]');
  const newTemplates = customTemplates.filter(t => t.id !== templateId);
  localStorage.setItem('orderflow_custom_templates', JSON.stringify(newTemplates));

  // Remove from webBuilderTemplates if it exists
  if (webBuilderTemplates[templateId]) {
    delete webBuilderTemplates[templateId];
  }

  renderInstalledTemplates();
  updateTemplateDropdowns();
  toast('Skabelon slettet', 'success');
}

// Handle template file drop
function handleTemplateDrop(event) {
  event.preventDefault();
  event.target.style.borderColor = 'var(--border)';
  event.target.style.background = 'var(--bg2)';

  const files = event.dataTransfer.files;
  if (files.length > 0 && files[0].name.endsWith('.zip')) {
    handleTemplateUpload(files[0]);
  } else {
    toast('Kun ZIP-filer understøttes', 'error');
  }
}

// Handle template file upload
function handleTemplateUpload(file) {
  if (!file) return;

  if (!file.name.endsWith('.zip')) {
    toast('Kun ZIP-filer understøttes', 'error');
    return;
  }

  if (file.size > 50 * 1024 * 1024) { // 50MB limit
    toast('Filen er for stor (max 50MB)', 'error');
    return;
  }

  uploadedTemplateFile = file;

  // Show progress
  const progressEl = document.getElementById('template-upload-progress');
  const filenameEl = document.getElementById('template-upload-filename');
  const percentEl = document.getElementById('template-upload-percent');
  const barEl = document.getElementById('template-upload-bar');

  if (progressEl) progressEl.style.display = 'block';
  if (filenameEl) filenameEl.textContent = file.name;

  // Simulate upload progress
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 30;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);

      // Show metadata form
      setTimeout(() => {
        if (progressEl) progressEl.style.display = 'none';
        const formEl = document.getElementById('template-metadata-form');
        if (formEl) formEl.style.display = 'block';

        // Pre-fill template name from filename
        const nameInput = document.getElementById('template-name');
        const idInput = document.getElementById('template-id');
        if (nameInput) nameInput.value = file.name.replace('.zip', '').replace(/-/g, ' ').replace(/_/g, ' ');
        if (idInput) idInput.value = file.name.replace('.zip', '').toLowerCase().replace(/\s+/g, '-');
      }, 500);
    }
    if (percentEl) percentEl.textContent = Math.round(progress) + '%';
    if (barEl) barEl.style.width = progress + '%';
  }, 200);
}

// Cancel template upload
function cancelTemplateUpload() {
  uploadedTemplateFile = null;

  const progressEl = document.getElementById('template-upload-progress');
  const formEl = document.getElementById('template-metadata-form');

  if (progressEl) progressEl.style.display = 'none';
  if (formEl) formEl.style.display = 'none';

  // Clear form
  const nameInput = document.getElementById('template-name');
  const idInput = document.getElementById('template-id');
  const descInput = document.getElementById('template-description');
  if (nameInput) nameInput.value = '';
  if (idInput) idInput.value = '';
  if (descInput) descInput.value = '';
}

// Save new template
async function saveNewTemplate() {
  const name = document.getElementById('template-name')?.value?.trim();
  const id = document.getElementById('template-id')?.value?.trim()?.toLowerCase()?.replace(/\s+/g, '-');
  const description = document.getElementById('template-description')?.value?.trim();

  if (!name || !id) {
    toast('Udfyld venligst navn og ID', 'error');
    return;
  }

  // Check if ID already exists
  if (webBuilderTemplates[id]) {
    toast('En skabelon med dette ID eksisterer allerede', 'error');
    return;
  }

  // Create new template object
  const newTemplate = {
    id: id,
    templateType: id,
    templatePath: `templates/${id}/`,
    previewFile: `./templates/${id}/index.html`,
    branding: {
      name: name,
      shortName: name.split(' ')[0],
      slogan: description || 'Tilpasset skabelon',
      description: description || '',
      logo: { url: '', darkUrl: '' },
      colors: {
        primary: '#2563EB',
        secondary: '#1E293B',
        accent: '#3B82F6',
        background: '#FFFFFF',
        surface: '#F8F9FA',
        text: '#1A1A1A',
        textMuted: '#666666',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444'
      },
      fonts: { heading: 'Inter', body: 'Inter' }
    },
    contact: {
      address: '',
      postalCode: '',
      city: '',
      phone: '',
      email: '',
      socialMedia: { facebook: '', instagram: '', tiktok: '' }
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
    delivery: { enabled: true, fee: 29, minimumOrder: 100, freeDeliveryThreshold: 250, estimatedTime: 40 },
    features: { ordering: true, loyalty: true, pickup: true, delivery: true, customerAccounts: true, pushNotifications: false },
    menu: { currency: 'DKK', taxRate: 25 },
    images: { hero: '', featured: '' },
    isCustom: true
  };

  // Save to localStorage custom templates
  const customTemplates = JSON.parse(localStorage.getItem('orderflow_custom_templates') || '[]');
  customTemplates.push(newTemplate);
  localStorage.setItem('orderflow_custom_templates', JSON.stringify(customTemplates));

  // Add to webBuilderTemplates
  webBuilderTemplates[id] = newTemplate;

  // TODO: Upload ZIP to Supabase storage
  // For now, we save metadata only

  // Show success
  const statusEl = document.getElementById('template-save-status');
  if (statusEl) {
    statusEl.style.display = 'inline';
    setTimeout(() => { statusEl.style.display = 'none'; }, 3000);
  }

  toast('Skabelon gemt!', 'success');

  // Reset form
  cancelTemplateUpload();

  // Refresh list and dropdowns
  renderInstalledTemplates();
  updateTemplateDropdowns();
}

// Update all template dropdowns in the app
function updateTemplateDropdowns() {
  const webBuilderSelect = document.getElementById('wb-template-selector');
  if (webBuilderSelect) {
    const currentValue = webBuilderSelect.value;

    // Get all templates including custom
    const customTemplates = JSON.parse(localStorage.getItem('orderflow_custom_templates') || '[]');
    customTemplates.forEach(t => {
      if (!webBuilderTemplates[t.id]) {
        webBuilderTemplates[t.id] = t;
      }
    });

    // Build options HTML
    let optionsHtml = '';
    Object.keys(webBuilderTemplates).forEach(id => {
      const t = webBuilderTemplates[id];
      const isCustom = customTemplates.some(ct => ct.id === id);
      const label = t.branding?.name || id;
      optionsHtml += `<option value="${id}">${label}${isCustom ? ' (Brugerdefineret)' : ''}</option>`;
    });

    webBuilderSelect.innerHTML = optionsHtml;

    // Restore selection if it still exists
    if (webBuilderTemplates[currentValue]) {
      webBuilderSelect.value = currentValue;
    }
  }
}

// =====================================================
// CUSTOM DOMAINS MANAGEMENT
// =====================================================

let customDomains = [];
let pendingDomainVerification = null;

// Load custom domains list
async function loadCustomDomains() {
  try {
    const { data, error } = await supabase
      .from('domain_mappings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    customDomains = data || [];
    renderDomainsList();
  } catch (err) {
    console.error('Error loading domains:', err);
    // Show empty state
    customDomains = [];
    renderDomainsList();
  }
}

// Render domains list
function renderDomainsList() {
  const container = document.getElementById('domains-list');
  if (!container) return;

  if (customDomains.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:32px;color:var(--muted)">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin:0 auto 12px;opacity:0.5">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <p style="font-size:14px">Ingen custom domains tilføjet endnu</p>
        <p style="font-size:12px;margin-top:4px">Din webshop er tilgængelig på dit subdomain</p>
      </div>
    `;
    return;
  }

  container.innerHTML = customDomains.map(domain => {
    const statusColors = {
      'active': 'var(--success)',
      'pending_dns': 'var(--warning)',
      'pending_validation': 'var(--warning)',
      'pending_cert': 'var(--accent)',
      'error': 'var(--error)'
    };
    const statusLabels = {
      'active': 'Aktiv',
      'pending_dns': 'Venter på DNS',
      'pending_validation': 'Validerer...',
      'pending_cert': 'Udsteder SSL',
      'error': 'Fejl'
    };

    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:16px;background:var(--bg2);border-radius:var(--radius-md);margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:10px;height:10px;border-radius:50%;background:${statusColors[domain.status] || 'var(--muted)'}"></div>
          <div>
            <div style="font-weight:500;font-size:14px">${domain.hostname}</div>
            <div style="font-size:12px;color:var(--muted)">${statusLabels[domain.status] || domain.status}</div>
          </div>
        </div>
        <div style="display:flex;gap:8px">
          ${domain.status !== 'active' ? `<button class="btn btn-sm btn-secondary" onclick="showDomainInstructions('${domain.id}')">Se DNS</button>` : ''}
          <button class="btn btn-sm btn-ghost" onclick="removeDomain('${domain.id}')" style="color:var(--error)">Fjern</button>
        </div>
      </div>
    `;
  }).join('');

  // Update SSL status
  updateSSLStatus();
}

// Add new custom domain
async function addCustomDomain() {
  const input = document.getElementById('new-domain-input');
  const hostname = input?.value?.trim().toLowerCase();

  if (!hostname) {
    toast('Indtast et domæne', 'error');
    return;
  }

  // Validate hostname format
  const hostnameRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/;
  if (!hostnameRegex.test(hostname)) {
    toast('Ugyldigt domænenavn', 'error');
    return;
  }

  try {
    // Get current tenant ID
    const tenantId = currentRestaurant?.id;
    if (!tenantId) {
      toast('Ingen restaurant valgt', 'error');
      return;
    }

    // Call database function to create domain mapping
    const { data, error } = await supabase.rpc('create_domain_mapping', {
      p_tenant_id: tenantId,
      p_hostname: hostname
    });

    if (error) throw error;

    if (data && data.length > 0) {
      const domainData = data[0];
      pendingDomainVerification = {
        id: domainData.domain_id,
        hostname: hostname,
        cname_target: domainData.cname_target,
        validation_record: domainData.validation_record,
        validation_value: domainData.validation_value
      };

      // Show DNS instructions
      showDnsInstructions(pendingDomainVerification);

      // Clear input
      input.value = '';

      // Reload domains list
      await loadCustomDomains();

      toast('Domæne tilføjet! Konfigurer DNS for at aktivere.', 'success');
    }
  } catch (err) {
    console.error('Error adding domain:', err);
    if (err.message?.includes('duplicate')) {
      toast('Dette domæne er allerede tilføjet', 'error');
    } else {
      toast('Kunne ikke tilføje domæne: ' + (err.message || 'Ukendt fejl'), 'error');
    }
  }
}

// Show DNS instructions
function showDnsInstructions(domain) {
  const container = document.getElementById('domain-dns-instructions');
  if (!container) return;

  // Parse hostname to get subdomain part
  const parts = domain.hostname.split('.');
  const subdomain = parts.length > 2 ? parts[0] : '@';

  // Update instruction fields
  document.getElementById('dns-cname-name').textContent = subdomain === '@' ? domain.hostname : subdomain;
  document.getElementById('dns-cname-value').textContent = domain.cname_target || 'cname.orderflow.dk';
  document.getElementById('dns-txt-name').textContent = domain.validation_record || `_acme-challenge.${subdomain}`;
  document.getElementById('dns-txt-value').textContent = domain.validation_value || '';

  // Show instructions
  container.style.display = 'block';

  // Store for verification
  pendingDomainVerification = domain;
}

// Show instructions for existing domain
async function showDomainInstructions(domainId) {
  const domain = customDomains.find(d => d.id === domainId);
  if (domain) {
    showDnsInstructions({
      id: domain.id,
      hostname: domain.hostname,
      cname_target: domain.dns_target || 'cname.orderflow.dk',
      validation_record: domain.validation_record,
      validation_value: domain.validation_value
    });
  }
}

// Copy DNS record to clipboard
function copyDnsRecord(type) {
  let text = '';
  if (type === 'cname') {
    const name = document.getElementById('dns-cname-name')?.textContent || '';
    const value = document.getElementById('dns-cname-value')?.textContent || '';
    text = `${name} CNAME ${value}`;
  } else if (type === 'txt') {
    const name = document.getElementById('dns-txt-name')?.textContent || '';
    const value = document.getElementById('dns-txt-value')?.textContent || '';
    text = `${name} TXT "${value}"`;
  }

  navigator.clipboard.writeText(text).then(() => {
    toast('Kopieret til udklipsholder', 'success');
  });
}

// Verify domain now
async function verifyDomainNow() {
  if (!pendingDomainVerification?.id) {
    toast('Ingen domæne at verificere', 'error');
    return;
  }

  const spinner = document.getElementById('domain-verify-spinner');
  const status = document.getElementById('domain-verify-status');
  const message = document.getElementById('domain-verify-message');

  if (spinner) spinner.style.display = 'block';
  if (status) status.textContent = 'Verificerer...';
  if (message) message.textContent = 'Tjekker DNS konfiguration...';

  try {
    const response = await fetch('/api/domains/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain_id: pendingDomainVerification.id })
    });

    const result = await response.json();

    if (result.success) {
      if (result.domain.status === 'active') {
        if (status) status.textContent = 'Domæne aktiveret!';
        if (message) message.textContent = 'Dit domæne er nu aktivt og SSL er konfigureret.';
        if (spinner) spinner.style.display = 'none';
        toast('Domæne verificeret og aktiveret!', 'success');

        // Hide instructions after short delay
        setTimeout(() => {
          document.getElementById('domain-dns-instructions').style.display = 'none';
          pendingDomainVerification = null;
        }, 2000);
      } else {
        if (status) status.textContent = result.message || 'Venter på DNS...';
        if (message) message.textContent = 'DNS er endnu ikke konfigureret korrekt. Prøv igen om et par minutter.';
      }
    } else {
      if (status) status.textContent = 'Verificering fejlede';
      if (message) message.textContent = result.message || 'Tjek din DNS konfiguration.';
    }

    // Reload domains list
    await loadCustomDomains();
  } catch (err) {
    console.error('Verification error:', err);
    if (status) status.textContent = 'Netværksfejl';
    if (message) message.textContent = 'Kunne ikke kontakte verificeringsserveren.';
  }
}

// Remove domain
async function removeDomain(domainId) {
  if (!confirm('Er du sikker på at du vil fjerne dette domæne?')) return;

  try {
    const { error } = await supabase
      .from('domain_mappings')
      .delete()
      .eq('id', domainId);

    if (error) throw error;

    toast('Domæne fjernet', 'success');
    await loadCustomDomains();

    // Hide instructions if this was the pending domain
    if (pendingDomainVerification?.id === domainId) {
      document.getElementById('domain-dns-instructions').style.display = 'none';
      pendingDomainVerification = null;
    }
  } catch (err) {
    console.error('Error removing domain:', err);
    toast('Kunne ikke fjerne domæne', 'error');
  }
}

// Update SSL status display
function updateSSLStatus() {
  const sslStatus = document.getElementById('ssl-status');
  if (!sslStatus) return;

  const activeDomains = customDomains.filter(d => d.status === 'active');

  if (activeDomains.length === 0) {
    sslStatus.innerHTML = `
      <div style="width:8px;height:8px;border-radius:50%;background:var(--muted)"></div>
      <span style="font-size:13px;color:var(--muted)">Ingen aktive certifikater</span>
    `;
  } else {
    sslStatus.innerHTML = activeDomains.map(domain => {
      const expiresAt = domain.ssl_expires_at ? new Date(domain.ssl_expires_at) : null;
      const expiresText = expiresAt ? `Udløber ${expiresAt.toLocaleDateString('da-DK')}` : 'Aktiv';

      return `
        <div style="display:flex;align-items:center;gap:8px;padding:8px 0">
          <div style="width:8px;height:8px;border-radius:50%;background:var(--success)"></div>
          <span style="font-size:13px">${domain.hostname}</span>
          <span style="font-size:11px;color:var(--muted);margin-left:auto">${expiresText}</span>
        </div>
      `;
    }).join('');
  }
}

// =====================================================
// WORKFLOW AGENT PAGES (Instagram/Facebook)
// =====================================================

// Agent status stored per channel
let workflowAgentStatus = {
  instagram: { active: false, connected: false, paymentsConfigured: false },
  facebook: { active: false, connected: false, paymentsConfigured: false }
};

// Load workflow agent page data
