// FLOW Reports Module — all reports (dags, produkt, z, konvertering, genbestilling, anmeldelse, heatmap)

// =====================================================
// DAGSRAPPORT FUNKTIONER
// =====================================================
let dagsrapportData = null;

function generateDagsrapport(demoDato, silent) {
  const dato = demoDato || document.getElementById('dagsrapport-dato').value;
  if (!dato) {
    toast('Vælg venligst en dato', 'error');
    return;
  }
  
  // Generate demo data based on date
  const dateObj = new Date(dato);
  const seed = dateObj.getDate() + dateObj.getMonth() * 31;
  
  // Format date to Danish (DD.MM.YYYY)
  const formatDateDK = (d) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };
  
  const datoDK = formatDateDK(dateObj);
  
  // Pseudo-random but consistent for same date
  const random = (min, max) => {
    const x = Math.sin(seed * 9999 + min) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  };
  
  const brutto = random(150000, 550000) + random(0, 99) / 100;
  const rabatter = random(0, 5000) + random(0, 99) / 100;
  const kontantSalg = random(20000, 80000) + random(0, 99) / 100;
  const kortSalg = brutto - kontantSalg - rabatter;
  const surcharge = random(200, 800) + random(0, 99) / 100;
  const drikkepenge = random(0, 500) + random(0, 99) / 100;
  const momsRate = 0.25;
  
  dagsrapportData = {
    dato: dato, // Keep ISO for filename
    datoDK: datoDK, // Danish format for display
    aabnet: datoDK + ', ' + String(random(4, 10)).padStart(2, '0') + ':' + String(random(0, 59)).padStart(2, '0'),
    lukket: datoDK + ', ' + String(random(20, 23)).padStart(2, '0') + ':' + String(random(0, 59)).padStart(2, '0'),
    medarbejder: 'Medarbejder / Medarbejder',
    dokumentNummer: 'DOC-' + new Date().getFullYear() + '-' + String(random(1, 999999)).padStart(6, '0'),
    bruttoomsaetning: brutto,
    rabatter: rabatter,
    totalomsaetning: brutto - rabatter,
    momsOpkraevet: (brutto - rabatter) * momsRate / (1 + momsRate),
    salgEksMoms: (brutto - rabatter) / (1 + momsRate),
    kontant: {
      salg: kontantSalg,
      omsaetning: kontantSalg,
      total: kontantSalg
    },
    kort: {
      salg: kortSalg,
      omsaetning: kortSalg,
      surcharge: surcharge,
      drikkepenge: drikkepenge,
      total: kortSalg + surcharge + drikkepenge
    },
    moms: {
      rate: 25,
      netto: (brutto - rabatter) / (1 + momsRate),
      moms: (brutto - rabatter) * momsRate / (1 + momsRate),
      brutto: brutto - rabatter
    }
  };
  
  // Render data table
  renderDagsrapportTable();
  // Generate report files and render file table
  generateReportFiles('dagsrapport', dato).then(() => {
    renderReportFileTable('dagsrapport', dato);
  });
  if (!silent) toast('Rapport genereret', 'success');
}

function renderDagsrapportTable() {
  if (!dagsrapportData) return;
  const d = dagsrapportData;
  const fmt = (n) => n.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' DKK';

  const columns = [
    { key: 'section', label: 'Sektion', width: '120px', bold: true },
    { key: 'felt', label: 'Felt', width: '2fr', bold: true },
    { key: 'vaerdi', label: 'Værdi', width: '1.5fr', align: 'right' }
  ];

  const rows = [
    { section: 'Detaljer', felt: 'Åbnet', vaerdi: d.aabnet },
    { section: '', felt: 'Lukket', vaerdi: d.lukket },
    { section: '', felt: 'Åbnet af', vaerdi: d.medarbejder },
    { section: '', felt: 'Dokumentnummer', vaerdi: d.dokumentNummer },
    { section: 'Salgsoversigt', felt: 'Bruttoomsætning', vaerdi: fmt(d.bruttoomsaetning) },
    { section: '', felt: 'Rabatter', vaerdi: fmt(d.rabatter) },
    { section: '', felt: 'Totalomsætning', vaerdi: fmt(d.totalomsaetning), _highlight: true },
    { section: '', felt: 'Moms opkrævet', vaerdi: fmt(d.momsOpkraevet) },
    { section: '', felt: 'Salg ekskl. moms', vaerdi: fmt(d.salgEksMoms) },
    { section: 'Kontant', felt: 'Salg', vaerdi: fmt(d.kontant.salg) },
    { section: '', felt: 'Omsætning', vaerdi: fmt(d.kontant.omsaetning) },
    { section: '', felt: 'Total', vaerdi: fmt(d.kontant.total), _highlight: true },
    { section: 'Kort', felt: 'Salg', vaerdi: fmt(d.kort.salg) },
    { section: '', felt: 'Omsætning', vaerdi: fmt(d.kort.omsaetning) },
    { section: '', felt: 'Surcharge', vaerdi: fmt(d.kort.surcharge) },
    { section: '', felt: 'Drikkepenge', vaerdi: fmt(d.kort.drikkepenge) },
    { section: '', felt: 'Total', vaerdi: fmt(d.kort.total), _highlight: true },
    { section: 'Moms (' + d.moms.rate + '%)', felt: 'Netto', vaerdi: fmt(d.moms.netto) },
    { section: '', felt: 'Moms', vaerdi: fmt(d.moms.moms) },
    { section: '', felt: 'Brutto', vaerdi: fmt(d.moms.brutto) },
    { section: 'Total', felt: 'Nettobeløb', vaerdi: fmt(d.moms.netto) },
    { section: '', felt: 'Momsbeløb', vaerdi: fmt(d.moms.moms) },
    { section: '', felt: 'Bruttobeløb', vaerdi: fmt(d.moms.brutto), _highlight: true }
  ];

  showReportTable('dagsrapport-content', columns, rows, { reportType: 'dagsrapport', pageSize: 50 });
}

function renderDagsrapport() {
  renderDagsrapportTable();
}

function exportDagsrapportPDF() {
  if (!dagsrapportData) {
    toast('Generer først en rapport', 'error');
    return;
  }
  
  const d = dagsrapportData;
  const fmt = (n) => n.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' DKK';
  
  // Wait for jsPDF to load
  if (typeof window.jspdf === 'undefined') {
    toast('PDF bibliotek indlæses...', 'info');
    setTimeout(exportDagsrapportPDF, 500);
    return;
  }
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // PDF Konfiguration - Matcher Python script farver
  const PRIMARY_COLOR = [26, 26, 46];      // #1a1a2e
  const ACCENT_COLOR = [15, 52, 96];       // #0f3460
  const TEXT_COLOR = [51, 51, 51];         // #333333
  const MEDIUM_GRAY = [224, 224, 224];     // #e0e0e0
  const MUTED_COLOR = [128, 128, 128];     // gray
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25;
  const contentWidth = pageWidth - (margin * 2);
  
  // Platform info
  const platformInfo = {
    name: 'Ordreflow SaaS',
    address: 'Vestergade 12',
    postalCity: '2100 København Ø',
    cvr: '12345678'
  };
  
  // Get restaurant info - try selected restaurant or use demo data
  const selectedRestaurant = restaurants.find(r => r.id === currentProfileRestaurantId);
  const restaurant = {
    name: selectedRestaurant?.name || 'Restaurant Bella Vista ApS',
    cvr: selectedRestaurant?.cvr || '87654321',
    address: selectedRestaurant?.address || 'Nørrebrogade 45',
    postalCity: '2200 København N'
  };
  
  // Format date to Danish format (DD.MM.YYYY)
  const formatDateDanish = (dateStr) => {
    if (!dateStr) return '';
    // Handle both ISO and already formatted dates
    if (dateStr.includes('.')) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dateStr;
  };
  
  // Format datetime to Danish format
  const formatDateTimeDanish = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    const [datePart, timePart] = dateTimeStr.split(', ');
    if (timePart) {
      return `${formatDateDanish(datePart)}, ${timePart}`;
    }
    // If format is "YYYY-MM-DD, HH:MM"
    const match = dateTimeStr.match(/(\d{4}-\d{2}-\d{2}),?\s*(\d{2}:\d{2})/);
    if (match) {
      return `${formatDateDanish(match[1])}, ${match[2]}`;
    }
    return dateTimeStr;
  };
  
  let currentPage = 1;
  const totalPages = 2;
  
  // === HELPER FUNCTIONS ===
  function drawFooter() {
    const footerY = pageHeight - 15;
    
    // Linje over footer
    doc.setDrawColor(...MEDIUM_GRAY);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    
    // Side nummer
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_COLOR);
    doc.setFont('helvetica', 'normal');
    doc.text(`Side ${currentPage} af ${totalPages}`, pageWidth / 2, footerY, { align: 'center' });
    
    // Platform info
    doc.setFontSize(8);
    doc.setTextColor(...MUTED_COLOR);
    const footerText = `${platformInfo.name}  •  ${platformInfo.address}, ${platformInfo.postalCity}  •  CVR: ${platformInfo.cvr}`;
    doc.text(footerText, pageWidth / 2, footerY + 4, { align: 'center' });
  }
  
  function drawHeader() {
    let y = 20;
    
    // Titel
    doc.setFontSize(22);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.text('DAGSRAPPORT', margin, y);
    
    // Platform navn
    y += 7;
    doc.setFontSize(10);
    doc.setTextColor(...ACCENT_COLOR);
    doc.setFont('helvetica', 'normal');
    doc.text(platformInfo.name, margin, y);
    
    // Højre side: Dato
    const todayFormatted = new Date().toLocaleDateString('da-DK', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_COLOR);
    doc.setFont('helvetica', 'normal');
    doc.text(todayFormatted, pageWidth - margin, y - 7, { align: 'right' });
    
    // Restaurant info til højre
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(restaurant.name, pageWidth - margin, y - 1, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(restaurant.address, pageWidth - margin, y + 5, { align: 'right' });
    doc.text(restaurant.postalCity, pageWidth - margin, y + 10, { align: 'right' });
    doc.text('CVR: ' + restaurant.cvr, pageWidth - margin, y + 15, { align: 'right' });
    
    // Header linje
    y += 18;
    doc.setDrawColor(...PRIMARY_COLOR);
    doc.setLineWidth(2);
    doc.line(margin, y, pageWidth - margin, y);
    
    return y + 8;
  }
  
  let y = drawHeader();
  
  function drawSectionHeader(title) {
    // Check for page break
    if (y > pageHeight - 60) {
      drawFooter();
      doc.addPage();
      currentPage++;
      y = 25;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, y);
    y += 2;
  }
  
  function drawSubsectionHeader(title) {
    doc.setFontSize(11);
    doc.setTextColor(...ACCENT_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, y + 6);
    y += 10;
  }
  
  function drawDataRow(label, value, isLast = false) {
    // Check for page break
    if (y > pageHeight - 40) {
      drawFooter();
      doc.addPage();
      currentPage++;
      y = 25;
    }
    
    // Background for row
    y += 4;
    
    // Label
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_COLOR);
    doc.setFont('helvetica', 'normal');
    doc.text(label, margin, y);
    
    // Value
    doc.setTextColor(...PRIMARY_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.text(value, pageWidth - margin, y, { align: 'right' });
    
    y += 4;
    
    // Linje under
    if (isLast) {
      doc.setDrawColor(...PRIMARY_COLOR);
      doc.setLineWidth(1);
    } else {
      doc.setDrawColor(...MEDIUM_GRAY);
      doc.setLineWidth(0.5);
    }
    doc.line(margin, y, pageWidth - margin, y);
    
    y += 4;
  }
  
  // === PAGE 1: DETALJER + SALGSOVERSIGT ===
  
  // Detaljer sektion
  drawSectionHeader('Detaljer');
  drawSubsectionHeader('Oversigt');
  
  drawDataRow('Åbnet', d.aabnet);
  drawDataRow('Lukket', d.lukket);
  drawDataRow('Åbnet af', d.medarbejder);
  drawDataRow('Dokumentnummer', d.dokumentNummer, true);
  
  y += 8;
  
  // Salgsoversigt sektion
  drawSectionHeader('Salgsoversigt');
  drawSubsectionHeader('Oversigt');
  
  drawDataRow('Bruttoomsætning', fmt(d.bruttoomsaetning));
  drawDataRow('Rabatter', fmt(d.rabatter));
  drawDataRow('Totalomsætning', fmt(d.totalomsaetning));
  drawDataRow('Moms opkrævet', fmt(d.momsOpkraevet));
  drawDataRow('Salg ekskl. moms', fmt(d.salgEksMoms), true);
  
  // Draw footer for page 1
  drawFooter();
  
  // === PAGE 2: BETALINGSFORDELING + MOMSSPECIFIKATION ===
  doc.addPage();
  currentPage++;
  y = 25;
  
  // Betalingsfordeling sektion
  drawSectionHeader('Betalingsfordeling');
  
  // Kontant
  drawSubsectionHeader('Kontant');
  drawDataRow('Salg', fmt(d.kontant.salg));
  drawDataRow('Omsætning', fmt(d.kontant.omsaetning));
  drawDataRow('Total', fmt(d.kontant.total), true);
  
  y += 6;
  
  // Kort
  drawSubsectionHeader('Kort');
  drawDataRow('Salg', fmt(d.kort.salg));
  drawDataRow('Omsætning', fmt(d.kort.omsaetning));
  drawDataRow('Surcharge', fmt(d.kort.surcharge));
  drawDataRow('Drikkepenge', fmt(d.kort.drikkepenge));
  drawDataRow('Total', fmt(d.kort.total), true);
  
  y += 8;
  
  // Momsspecifikation sektion
  drawSectionHeader('Momsspecifikation');
  
  drawSubsectionHeader('Rate: ' + d.moms.rate + '%');
  drawDataRow('Net', fmt(d.moms.netto));
  drawDataRow('Moms', fmt(d.moms.moms));
  drawDataRow('Brutto', fmt(d.moms.brutto), true);
  
  y += 6;
  
  drawSubsectionHeader('Total');
  drawDataRow('Nettobeløb', fmt(d.moms.netto));
  drawDataRow('Momsbeløb', fmt(d.moms.moms));
  drawDataRow('Bruttobeløb', fmt(d.moms.brutto), true);
  
  // Draw footer for page 2
  drawFooter();
  
  // === DOWNLOAD ===
  // Use Danish date format for filename (DDMMYYYY)
  const dateForFile = d.datoDK ? d.datoDK.replace(/\./g, '') : d.dato.replace(/-/g, '');
  const fileName = `Dagsrapport_${dateForFile}.pdf`;
  doc.save(fileName);
  
  // toast('PDF downloadet', 'success'); // Removed - unnecessary
}

function exportDagsrapportExcel() {
  // Redirect to new ExportService
  ExportService.toExcel('dagsrapport');
}

// =====================================================
// RAPPORT FUNKTIONER - Alle rapporter med tabeller
// =====================================================
let produktrapportData = null;
let zrapportData = null;
let konverteringsrapportData = null;
let genbestillingsrapportData = null;
let anmeldelsesrapportData = null;
let heatmaprapportData = null;

// Shared seeded random helper
function _reportRandom(seed, min, max, offset) {
  offset = offset || 0;
  const x = Math.sin((seed + offset) * 9999 + min) * 10000;
  return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
}

function _fmtDKK(n) {
  return n.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' kr';
}

function _fmtPct(n) {
  return n.toLocaleString('da-DK', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
}

function _fmtDateDK(d) {
  if (typeof d === 'string') d = new Date(d);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return day + '.' + month + '.' + d.getFullYear();
}

// --- PRODUKTRAPPORT ---
function generateProduktrapport(demoFra, demoTil, silent) {
  const fra = demoFra || document.getElementById('produktrapport-fra').value;
  const til = demoTil || document.getElementById('produktrapport-til').value;
  if (!fra || !til) { toast('Vælg venligst et datointerval', 'error'); return; }

  const seed = new Date(fra).getDate() + new Date(fra).getMonth() * 31 + new Date(til).getDate();
  const r = (min, max, off) => _reportRandom(seed, min, max, off);

  const products = [
    { name: 'Margherita Pizza', cat: 'Pizza', base: 99 },
    { name: 'Pepperoni Pizza', cat: 'Pizza', base: 109 },
    { name: 'Hawaii Pizza', cat: 'Pizza', base: 109 },
    { name: 'Caesar Salat', cat: 'Salater', base: 79 },
    { name: 'Pasta Carbonara', cat: 'Pasta', base: 119 },
    { name: 'Pasta Bolognese', cat: 'Pasta', base: 109 },
    { name: 'Tiramisu', cat: 'Dessert', base: 59 },
    { name: 'Cola 0.5L', cat: 'Drikkevarer', base: 35 },
    { name: 'Fadøl 0.4L', cat: 'Drikkevarer', base: 55 },
    { name: 'Husets Rødvin', cat: 'Vin', base: 149 },
    { name: 'Bruschetta', cat: 'Forretter', base: 69 },
    { name: 'Moules Frites', cat: 'Hovedretter', base: 169 }
  ];

  const rows = products.map((p, i) => {
    const sold = r(20, 350, i);
    const price = p.base + r(-10, 20, i + 100);
    const revenue = sold * price;
    const margin = r(55, 82, i + 200);
    return { name: p.name, cat: p.cat, sold, revenue, avgPrice: price, margin };
  });
  rows.sort((a, b) => b.revenue - a.revenue);

  const totalSold = rows.reduce((s, x) => s + x.sold, 0);
  const totalRevenue = rows.reduce((s, x) => s + x.revenue, 0);
  const avgMargin = rows.reduce((s, x) => s + x.margin, 0) / rows.length;

  produktrapportData = {
    title: 'Produktoversigt',
    period: _fmtDateDK(fra) + ' - ' + _fmtDateDK(til),
    headers: ['Produkt', 'Kategori', 'Solgt', 'Omsætning', 'Gns. pris', 'Avance'],
    rows: rows.map(x => [x.name, x.cat, x.sold.toLocaleString('da-DK'), _fmtDKK(x.revenue), _fmtDKK(x.avgPrice), x.margin + '%']),
    _raw: rows,
    summary: { 'Total produkter': products.length + '', 'Total solgt': totalSold.toLocaleString('da-DK') + ' stk', 'Total omsætning': _fmtDKK(totalRevenue), 'Gns. avance': _fmtPct(avgMargin) }
  };
  const reportDate = til;
  renderProduktrapportTable();
  generateReportFiles('produktrapport', reportDate).then(() => {
    renderReportFileTable('produktrapport', reportDate);
  });
  if (!silent) toast('Rapport genereret', 'success');
}

function autoGenerateProduktrapport() {
  const fra = document.getElementById('produktrapport-fra').value;
  const til = document.getElementById('produktrapport-til').value;
  if (fra && til) generateProduktrapport();
}

function renderProduktrapportTable() {
  if (!produktrapportData) return;

  const columns = [
    { key: 'produkt', label: 'Produkt', width: '2fr', bold: true },
    { key: 'kategori', label: 'Kategori', width: '1fr', muted: true },
    { key: 'solgt', label: 'Antal solgt', width: '80px', align: 'right' },
    { key: 'omsaetning', label: 'Omsætning', width: '1fr', align: 'right' },
    { key: 'gnsPris', label: 'Gns. pris', width: '1fr', align: 'right' },
    { key: 'avance', label: 'Avance', width: '80px', align: 'right' }
  ];

  const rows = produktrapportData._raw.map(x => ({
    produkt: x.name,
    kategori: x.cat,
    solgt: x.sold.toLocaleString('da-DK'),
    omsaetning: _fmtDKK(x.revenue),
    gnsPris: _fmtDKK(x.avgPrice),
    avance: x.margin + '%'
  }));

  // Add summary row
  const summary = produktrapportData.summary;
  rows.push({ produkt: 'Total', kategori: '', solgt: summary['Total solgt'], omsaetning: summary['Total omsætning'], gnsPris: '', avance: summary['Gns. avance'], _highlight: true });

  showReportTable('produktrapport-content', columns, rows, { reportType: 'produktrapport' });
}

function renderProduktrapport() {
  renderProduktrapportTable();
}


// --- Z-RAPPORT ---
function generateZrapport(demoDato, silent) {
  const dato = demoDato || document.getElementById('zrapport-dato').value;
  if (!dato) { toast('Vælg venligst en dato', 'error'); return; }

  const dateObj = new Date(dato);
  const seed = dateObj.getDate() + dateObj.getMonth() * 31 + dateObj.getFullYear();
  const r = (min, max, off) => _reportRandom(seed, min, max, off);

  const lines = [
    { desc: 'Kontant salg', count: r(30, 80, 1), amount: r(8000, 25000, 2) + r(0, 99, 3) / 100 },
    { desc: 'Kort salg (Dankort)', count: r(100, 300, 4), amount: r(30000, 80000, 5) + r(0, 99, 6) / 100 },
    { desc: 'Kort salg (Visa/MC)', count: r(20, 80, 7), amount: r(8000, 25000, 8) + r(0, 99, 9) / 100 },
    { desc: 'MobilePay', count: r(15, 60, 10), amount: r(4000, 15000, 11) + r(0, 99, 12) / 100 },
    { desc: 'Online betaling', count: r(10, 40, 13), amount: r(3000, 12000, 14) + r(0, 99, 15) / 100 },
    { desc: 'Gavekort', count: r(2, 15, 16), amount: r(500, 5000, 17) + r(0, 99, 18) / 100 },
    { desc: 'Rabatter givet', count: r(5, 30, 19), amount: -(r(500, 5000, 20) + r(0, 99, 21) / 100) },
    { desc: 'Returneringer', count: r(0, 5, 22), amount: -(r(0, 2000, 23) + r(0, 99, 24) / 100) }
  ];

  const brutto = lines.filter(l => l.amount > 0).reduce((s, l) => s + l.amount, 0);
  const netto = lines.reduce((s, l) => s + l.amount, 0);
  const moms = netto * 0.25 / 1.25;
  const diff = r(-50, 50, 30) + r(0, 99, 31) / 100;
  const zNr = 'Z-' + dateObj.getFullYear() + '-' + String(r(1, 9999, 32)).padStart(4, '0');

  zrapportData = {
    title: 'Z-Rapport',
    period: _fmtDateDK(dato),
    headers: ['Beskrivelse', 'Antal', 'Beløb (DKK)'],
    rows: lines.map(l => [l.desc, l.count.toLocaleString('da-DK'), _fmtDKK(l.amount)]),
    summary: { 'Brutto omsætning': _fmtDKK(brutto), 'Netto omsætning': _fmtDKK(netto), 'Moms (25%)': _fmtDKK(moms), 'Kassedifference': _fmtDKK(diff), 'Z-nummer': zNr }
  };
  renderZrapportTable();
  generateReportFiles('zrapport', dato).then(() => {
    renderReportFileTable('zrapport', dato);
  });
  if (!silent) toast('Rapport genereret', 'success');
}

function renderZrapportTable() {
  if (!zrapportData) return;
  const d = zrapportData;

  const columns = [
    { key: 'beskrivelse', label: 'Beskrivelse', width: '2fr', bold: true },
    { key: 'antal', label: 'Antal', width: '80px', align: 'right' },
    { key: 'beloeb', label: 'Beløb (DKK)', width: '1.5fr', align: 'right' }
  ];

  const rows = d.rows.map(r => ({
    beskrivelse: r[0],
    antal: r[1],
    beloeb: r[2]
  }));

  // Add summary rows
  Object.entries(d.summary).forEach(([k, v]) => {
    rows.push({ beskrivelse: k, antal: '', beloeb: v, _highlight: k === 'Netto omsætning' });
  });

  showReportTable('zrapport-content', columns, rows, { reportType: 'zrapport', pageSize: 50 });
}

function renderZrapport() {
  renderZrapportTable();
}

// --- KONVERTERINGSRAPPORT ---
function generateKonverteringsrapport(demoPeriode, silent) {
  const periode = demoPeriode || parseInt(document.getElementById('konverteringsrapport-periode').value);
  const seed = periode + new Date().getMonth() * 31 + new Date().getFullYear();
  const r = (min, max, off) => _reportRandom(seed, min, max, off);

  const sources = ['Direkte', 'Google Søgning', 'Facebook Ads', 'Instagram', 'Email kampagner', 'Henvisninger', 'Google Maps', 'TikTok'];
  const rows = sources.map((src, i) => {
    const visitors = r(200, 3000, i);
    const convRate = (r(50, 250, i + 100) / 10);
    const orders = Math.round(visitors * convRate / 100);
    const avgOrder = r(150, 450, i + 200) + r(0, 99, i + 300) / 100;
    const revenue = orders * avgOrder;
    return { src, visitors, orders, convRate, avgOrder, revenue };
  });
  rows.sort((a, b) => b.revenue - a.revenue);

  const totalVisitors = rows.reduce((s, x) => s + x.visitors, 0);
  const totalOrders = rows.reduce((s, x) => s + x.orders, 0);
  const totalRevenue = rows.reduce((s, x) => s + x.revenue, 0);
  const avgConv = totalVisitors > 0 ? (totalOrders / totalVisitors * 100) : 0;

  konverteringsrapportData = {
    title: 'Konverteringsrapport',
    period: 'Sidste ' + periode + ' dage',
    headers: ['Kilde / Kanal', 'Besøgende', 'Ordrer', 'Konvertering', 'Gns. ordre', 'Omsætning'],
    rows: rows.map(x => [x.src, x.visitors.toLocaleString('da-DK'), x.orders.toLocaleString('da-DK'), _fmtPct(x.convRate), _fmtDKK(x.avgOrder), _fmtDKK(x.revenue)]),
    summary: { 'Total besøgende': totalVisitors.toLocaleString('da-DK'), 'Total ordrer': totalOrders.toLocaleString('da-DK'), 'Gns. konvertering': _fmtPct(avgConv), 'Total omsætning': _fmtDKK(totalRevenue) }
  };
  const konvReportDate = new Date().toISOString().split('T')[0];
  renderKonverteringsrapportTable();
  generateReportFiles('konverteringsrapport', konvReportDate).then(() => {
    renderReportFileTable('konverteringsrapport', konvReportDate);
  });
  if (!silent) toast('Rapport genereret', 'success');
}

function renderKonverteringsrapportTable() {
  if (!konverteringsrapportData) return;

  const columns = [
    { key: 'kilde', label: 'Kilde / Kanal', width: '2fr', bold: true },
    { key: 'besoeg', label: 'Besøgende', width: '1fr', align: 'right' },
    { key: 'ordrer', label: 'Ordrer', width: '80px', align: 'right' },
    { key: 'konv', label: 'Konvertering', width: '1fr', align: 'right' },
    { key: 'gnsOrdre', label: 'Gns. ordre', width: '1fr', align: 'right' },
    { key: 'omsaetning', label: 'Omsætning', width: '1.5fr', align: 'right' }
  ];

  const rows = konverteringsrapportData.rows.map(r => ({
    kilde: r[0], besoeg: r[1], ordrer: r[2], konv: r[3], gnsOrdre: r[4], omsaetning: r[5]
  }));

  const s = konverteringsrapportData.summary;
  rows.push({ kilde: 'Total', besoeg: s['Total besøgende'], ordrer: s['Total ordrer'], konv: s['Gns. konvertering'], gnsOrdre: '', omsaetning: s['Total omsætning'], _highlight: true });

  showReportTable('konverteringsrapport-content', columns, rows, { reportType: 'konverteringsrapport' });
}

function renderKonverteringsrapport() {
  renderKonverteringsrapportTable();
}

// --- GENBESTILLINGSRAPPORT ---
function generateGenbestillingsrapport(demoPeriode, silent) {
  const periode = demoPeriode || parseInt(document.getElementById('genbestillingsrapport-periode').value);
  const seed = periode + new Date().getMonth() * 31 + new Date().getFullYear();
  const r = (min, max, off) => _reportRandom(seed, min, max, off);

  const customers = ['Anders Jensen', 'Maria Nielsen', 'Peter Hansen', 'Louise Pedersen', 'Thomas Andersen', 'Sofie Larsen', 'Mikkel Christensen', 'Emma Rasmussen', 'Frederik Møller', 'Line Jørgensen', 'Kasper Thomsen', 'Ida Madsen'];
  const today = new Date();
  const rows = customers.map((name, i) => {
    const orders = r(2, 25, i);
    const daysSinceLast = r(1, 60, i + 100);
    const lastDate = new Date(today);
    lastDate.setDate(lastDate.getDate() - daysSinceLast);
    const totalSpent = orders * (r(150, 500, i + 200) + r(0, 99, i + 300) / 100);
    const avgInterval = r(3, 35, i + 400);
    let status, badgeClass;
    if (avgInterval < 14) { status = 'Aktiv'; badgeClass = 'badge-success'; }
    else if (avgInterval < 30) { status = 'Aftagende'; badgeClass = 'badge-warning'; }
    else { status = 'Inaktiv'; badgeClass = 'badge-danger'; }
    return { name, orders, lastDate: _fmtDateDK(lastDate), totalSpent, avgInterval, status, badgeClass };
  });
  rows.sort((a, b) => b.orders - a.orders);

  const totalCustomers = rows.length;
  const avgOrders = rows.reduce((s, x) => s + x.orders, 0) / totalCustomers;
  const avgInterval = rows.reduce((s, x) => s + x.avgInterval, 0) / totalCustomers;
  const activeCount = rows.filter(x => x.status === 'Aktiv').length;
  const retention = (activeCount / totalCustomers * 100);

  genbestillingsrapportData = {
    title: 'Genbestillingsrapport',
    period: 'Sidste ' + periode + ' dage',
    headers: ['Kunde', 'Ordrer', 'Sidste ordre', 'Total forbrugt', 'Gns. interval', 'Status'],
    rows: rows.map(x => [x.name, x.orders.toLocaleString('da-DK'), x.lastDate, _fmtDKK(x.totalSpent), x.avgInterval + ' dage', x.status]),
    _raw: rows,
    summary: { 'Tilbagevendende kunder': totalCustomers + '', 'Gns. ordrer pr. kunde': avgOrders.toFixed(1), 'Gns. interval': avgInterval.toFixed(0) + ' dage', 'Retention rate': _fmtPct(retention) }
  };
  const genbestReportDate = new Date().toISOString().split('T')[0];
  renderGenbestillingsrapportTable();
  generateReportFiles('genbestillingsrapport', genbestReportDate).then(() => {
    renderReportFileTable('genbestillingsrapport', genbestReportDate);
  });
  if (!silent) toast('Rapport genereret', 'success');
}

function renderGenbestillingsrapportTable() {
  if (!genbestillingsrapportData) return;

  const columns = [
    { key: 'kunde', label: 'Kunde', width: '2fr', bold: true },
    { key: 'ordrer', label: 'Ordrer', width: '80px', align: 'right' },
    { key: 'sidsteOrdre', label: 'Sidste ordre', width: '1fr' },
    { key: 'totalForbrugt', label: 'Total forbrugt', width: '1.2fr', align: 'right' },
    { key: 'gnsInterval', label: 'Gns. interval', width: '1fr', align: 'right' },
    { key: 'status', label: 'Status', width: '80px' }
  ];

  const rows = genbestillingsrapportData._raw.map(x => ({
    kunde: x.name,
    ordrer: x.orders.toLocaleString('da-DK'),
    sidsteOrdre: x.lastDate,
    totalForbrugt: _fmtDKK(x.totalSpent),
    gnsInterval: x.avgInterval + ' dage',
    status: x.status
  }));

  const s = genbestillingsrapportData.summary;
  rows.push({ kunde: 'Opsummering', ordrer: s['Gns. ordrer pr. kunde'], sidsteOrdre: '', totalForbrugt: '', gnsInterval: s['Gns. interval'], status: s['Retention rate'], _highlight: true });

  showReportTable('genbestillingsrapport-content', columns, rows, { reportType: 'genbestillingsrapport' });
}

function renderGenbestillingsrapport() {
  renderGenbestillingsrapportTable();
}

// --- ANMELDELSESRAPPORT ---
function generateAnmeldelsesrapport(demoPeriode, silent) {
  const periode = demoPeriode || parseInt(document.getElementById('anmeldelsesrapport-periode').value);
  const seed = periode + new Date().getMonth() * 31 + new Date().getFullYear();
  const r = (min, max, off) => _reportRandom(seed, min, max, off);

  const platforms = [
    { name: 'Google', baseReviews: 40 },
    { name: 'Trustpilot', baseReviews: 20 },
    { name: 'Facebook', baseReviews: 15 },
    { name: 'TripAdvisor', baseReviews: 10 },
    { name: 'Intern feedback', baseReviews: 50 }
  ];

  const rows = platforms.map((p, i) => {
    const reviews = p.baseReviews + r(0, 30, i);
    const rating = (r(35, 49, i + 100) / 10);
    const positive = Math.round(reviews * (r(65, 95, i + 200) / 100));
    const negative = reviews - positive;
    const conv = r(50, 200, i + 300) / 10;
    return { platform: p.name, reviews, rating, positive, negative, conv };
  });

  const totalReviews = rows.reduce((s, x) => s + x.reviews, 0);
  const avgRating = rows.reduce((s, x) => s + x.rating * x.reviews, 0) / totalReviews;
  const totalPositive = rows.reduce((s, x) => s + x.positive, 0);
  const avgConv = rows.reduce((s, x) => s + x.conv, 0) / rows.length;

  anmeldelsesrapportData = {
    title: 'Anmeldelsesrapport',
    period: 'Sidste ' + periode + ' dage',
    headers: ['Platform', 'Anmeldelser', 'Gns. rating', 'Positive', 'Negative', 'Konvertering'],
    rows: rows.map(x => [x.platform, x.reviews.toLocaleString('da-DK'), x.rating.toFixed(1), x.positive.toLocaleString('da-DK'), x.negative.toLocaleString('da-DK'), _fmtPct(x.conv)]),
    _raw: rows,
    summary: { 'Total anmeldelser': totalReviews.toLocaleString('da-DK'), 'Gns. rating': avgRating.toFixed(1) + ' / 5.0', 'Positive': _fmtPct(totalPositive / totalReviews * 100), 'Anmeldelseskonvertering': _fmtPct(avgConv) }
  };
  const anmReportDate = new Date().toISOString().split('T')[0];
  renderAnmeldelsesrapportTable();
  generateReportFiles('anmeldelsesrapport', anmReportDate).then(() => {
    renderReportFileTable('anmeldelsesrapport', anmReportDate);
  });
  if (!silent) toast('Rapport genereret', 'success');
}

function renderAnmeldelsesrapportTable() {
  if (!anmeldelsesrapportData) return;

  const columns = [
    { key: 'platform', label: 'Platform', width: '2fr', bold: true },
    { key: 'anmeldelser', label: 'Anmeldelser', width: '1fr', align: 'right' },
    { key: 'rating', label: 'Gns. rating', width: '1fr', align: 'right' },
    { key: 'positive', label: 'Positive', width: '80px', align: 'right' },
    { key: 'negative', label: 'Negative', width: '80px', align: 'right' },
    { key: 'konv', label: 'Konvertering', width: '1fr', align: 'right' }
  ];

  const rows = anmeldelsesrapportData._raw.map(x => ({
    platform: x.platform,
    anmeldelser: x.reviews.toLocaleString('da-DK'),
    rating: x.rating.toFixed(1) + ' / 5.0',
    positive: x.positive.toLocaleString('da-DK'),
    negative: x.negative.toLocaleString('da-DK'),
    konv: _fmtPct(x.conv)
  }));

  const s = anmeldelsesrapportData.summary;
  rows.push({ platform: 'Total', anmeldelser: s['Total anmeldelser'], rating: s['Gns. rating'], positive: s['Positive'], negative: '', konv: s['Anmeldelseskonvertering'], _highlight: true });

  showReportTable('anmeldelsesrapport-content', columns, rows, { reportType: 'anmeldelsesrapport' });
}

function renderAnmeldelsesrapport() {
  renderAnmeldelsesrapportTable();
}

// --- HEATMAPRAPPORT ---
function generateHeatmaprapport(demoDato, silent) {
  const dato = demoDato || document.getElementById('heatmaprapport-dato').value;
  if (!dato) { toast('Vælg venligst en dato', 'error'); return; }

  const dateObj = new Date(dato);
  const seed = dateObj.getDate() + dateObj.getMonth() * 31 + dateObj.getFullYear();
  const r = (min, max, off) => _reportRandom(seed, min, max, off);

  const days = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
  const timeSlots = ['10:00-11:00', '11:00-12:00', '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00'];
  const grid = [];
  let maxVal = 0;
  let totalOrders = 0;
  let busiestDay = { day: '', total: 0 };
  let busiestSlot = { slot: '', total: 0 };
  const dayTotals = days.map(() => 0);
  const slotTotals = timeSlots.map(() => 0);

  timeSlots.forEach((slot, si) => {
    const row = [];
    const hour = 10 + si;
    days.forEach((day, di) => {
      let base = r(2, 15, si * 7 + di);
      if (hour >= 12 && hour < 14) base += r(8, 20, si * 7 + di + 100);
      if (hour >= 18 && hour < 21) base += r(10, 25, si * 7 + di + 200);
      if (di >= 4) base = Math.round(base * 1.3);
      if (hour < 11 || hour >= 21) base = Math.max(1, Math.round(base * 0.4));
      row.push(base);
      if (base > maxVal) maxVal = base;
      totalOrders += base;
      dayTotals[di] += base;
      slotTotals[si] += base;
    });
    grid.push(row);
  });

  dayTotals.forEach((t, i) => { if (t > busiestDay.total) { busiestDay = { day: days[i], total: t }; } });
  slotTotals.forEach((t, i) => { if (t > busiestSlot.total) { busiestSlot = { slot: timeSlots[i], total: t }; } });

  const avgPerHour = (totalOrders / (timeSlots.length * days.length)).toFixed(1);

  heatmaprapportData = {
    title: 'Heatmap Rapport',
    period: 'Uge fra ' + _fmtDateDK(dato),
    headers: ['Tidspunkt', ...days],
    rows: timeSlots.map((slot, si) => [slot, ...grid[si].map(v => v.toString())]),
    _grid: grid, _maxVal: maxVal, _timeSlots: timeSlots, _days: days,
    summary: { 'Travleste dag': busiestDay.day + ' (' + busiestDay.total + ' ordrer)', 'Travleste time': busiestSlot.slot + ' (' + busiestSlot.total + ' ordrer)', 'Total ordrer (ugen)': totalOrders.toLocaleString('da-DK'), 'Gns. ordrer pr. time': avgPerHour }
  };
  renderHeatmaprapport();
  generateReportFiles('heatmaprapport', dato).then(() => {
    renderReportFileTable('heatmaprapport', dato);
  });
  if (!silent) toast('Heatmap genereret', 'success');
}

function _heatColor(value, max) {
  const intensity = value / max;
  if (intensity > 0.8) return 'background:rgba(239,68,68,0.3);color:#ef4444;font-weight:600';
  if (intensity > 0.6) return 'background:rgba(251,191,36,0.25);color:#f59e0b;font-weight:600';
  if (intensity > 0.4) return 'background:rgba(251,191,36,0.1)';
  if (intensity > 0.2) return 'background:rgba(99,102,241,0.08)';
  return '';
}

function renderHeatmaprapport() {
  if (!heatmaprapportData) return;
  const d = heatmaprapportData;

  // Heatmap grid (visual)
  const gridCols = '100px ' + d._days.map(() => '1fr').join(' ');
  let html = '<div class="card" style="padding:0;overflow:hidden">';
  html += '<div style="display:grid;grid-template-columns:' + gridCols + ';gap:0;padding:14px 16px;background:var(--bg2);font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;border-radius:var(--radius-md) var(--radius-md) 0 0">';
  html += '<span>Tidspunkt</span>';
  d._days.forEach(day => { html += '<span style="text-align:center">' + day + '</span>'; });
  html += '</div>';
  d._timeSlots.forEach((slot, si) => {
    html += '<div style="display:grid;grid-template-columns:' + gridCols + ';gap:0;padding:8px 16px;border-bottom:1px solid var(--border);align-items:center;font-size:var(--font-size-sm)">';
    html += '<span style="font-weight:500;white-space:nowrap">' + slot + '</span>';
    d._grid[si].forEach(val => {
      const style = _heatColor(val, d._maxVal);
      html += '<span style="text-align:center;padding:4px;border-radius:4px;' + style + '">' + val + '</span>';
    });
    html += '</div>';
  });
  html += '</div>';

  // Summary table below
  html += '<div style="margin-top:var(--space-4)">';
  const summaryColumns = [
    { key: 'felt', label: 'Felt', width: '2fr', bold: true },
    { key: 'vaerdi', label: 'Værdi', width: '1.5fr', align: 'right' }
  ];
  const summaryRows = Object.entries(d.summary).map(([k, v]) => ({ felt: k, vaerdi: v }));

  // Render summary inline
  html += '<div class="card" style="padding:0;overflow:hidden">';
  html += '<div style="display:grid;grid-template-columns:2fr 1.5fr;gap:var(--space-3);padding:14px 16px;background:var(--bg2);font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px"><span>Felt</span><span style="text-align:right">Værdi</span></div>';
  summaryRows.forEach(r => {
    html += '<div style="display:grid;grid-template-columns:2fr 1.5fr;gap:var(--space-3);padding:12px 16px;border-bottom:1px solid var(--border);font-size:var(--font-size-sm)"><span style="font-weight:500">' + r.felt + '</span><span style="text-align:right">' + r.vaerdi + '</span></div>';
  });
  html += '</div></div>';

  document.getElementById('heatmaprapport-content').innerHTML = html;
}

// =====================================================
// =====================================================
// EXPORT SERVICE - Enhanced with Logo & Professional Wrapper
// =====================================================
const ExportService = {
  // Logo as base64 (FLOW logo sort)
  logo: 'data:image/png;base64,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',

  // Global template configuration
  config: {
    company: {
      name: 'JESKO ApS',
      address: 'Vestergade 12',
      postalCity: '2100 København Ø',
      cvr: '12345678',
      website: 'www.ordreflow.dk',
      email: 'support@ordreflow.dk'
    },
    colors: {
      primary: [26, 26, 46],      // #1a1a2e - Dark blue
      accent: [99, 102, 241],     // #6366f1 - Primary purple
      success: [34, 197, 94],     // #22c55e - Green
      text: [51, 51, 51],         // #333333
      muted: [132, 139, 152],     // #848b98
      border: [224, 224, 224],    // #e0e0e0
      headerBg: [249, 250, 251],  // #f9fafb
      white: [255, 255, 255]
    },
    fonts: {
      title: 24,
      subtitle: 14,
      header: 12,
      body: 10,
      small: 9,
      tiny: 8
    },
    margins: {
      top: 20,
      left: 20,
      right: 20,
      bottom: 25
    }
  },

  // Report titles mapping
  titles: {
    'dagsrapport': 'Dagsrapport',
    'produktrapport': 'Produktoversigt',
    'zrapport': 'Z-Rapport',
    'konverteringsrapport': 'Konverteringsrapport',
    'genbestillingsrapport': 'Genbestillingsrapport',
    'anmeldelsesrapport': 'Anmeldelsesrapport',
    'heatmaprapport': 'Heatmap Rapport'
  },

  // Get current restaurant context
  getRestaurant() {
    const selected = typeof restaurants !== 'undefined' ? 
      restaurants.find(r => r.id === currentProfileRestaurantId) : null;
    return {
      name: selected?.name || 'Restaurant',
      cvr: selected?.cvr || 'CVR: 12345678',
      address: selected?.address || 'Adresse',
      postalCity: selected?.postalCity || '2200 København N',
      phone: selected?.phone || '+45 12 34 56 78'
    };
  },

  // Get formatted date
  getFormattedDate() {
    return new Date().toLocaleDateString('da-DK', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  },

  getShortDate() {
    return new Date().toLocaleDateString('da-DK', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  },

  // Get report data based on type
  getReportData(reportType) {
    switch(reportType) {
      case 'dagsrapport':
        return typeof dagsrapportData !== 'undefined' ? dagsrapportData : null;
      case 'produktrapport':
        return produktrapportData || this.getProduktrapportData();
      case 'zrapport':
        return zrapportData || this.getZrapportData();
      case 'konverteringsrapport':
        return konverteringsrapportData || this.getKonverteringsrapportData();
      case 'genbestillingsrapport':
        return genbestillingsrapportData || this.getGenbestillingsrapportData();
      case 'anmeldelsesrapport':
        return anmeldelsesrapportData || this.getAnmeldelsesrapportData();
      case 'heatmaprapport':
        return heatmaprapportData || this.getHeatmaprapportData();
      default:
        return null;
    }
  },

  // Sample data generators for each report type
  getProduktrapportData() {
    return {
      title: 'Produktoversigt',
      period: 'Januar 2026',
      headers: ['Produkt', 'Kategori', 'Solgt', 'Omsætning', 'Avance'],
      rows: [
        ['Margherita Pizza', 'Pizza', '245', '24.500 kr', '68%'],
        ['Pepperoni Pizza', 'Pizza', '189', '20.790 kr', '65%'],
        ['Caesar Salat', 'Salater', '156', '10.920 kr', '72%'],
        ['Pasta Carbonara', 'Pasta', '134', '14.740 kr', '61%'],
        ['Tiramisu', 'Dessert', '98', '4.900 kr', '78%'],
        ['Cola', 'Drikkevarer', '312', '9.360 kr', '82%'],
        ['Husets Rødvin', 'Vin', '87', '13.050 kr', '58%'],
        ['Bruschetta', 'Forretter', '76', '5.320 kr', '71%']
      ],
      summary: {
        'Total produkter': '8',
        'Total solgt': '1.297 stk',
        'Total omsætning': '103.580 kr',
        'Gns. avance': '69%'
      }
    };
  },

  getZrapportData() {
    return {
      title: 'Z-Rapport',
      period: this.getFormattedDate(),
      headers: ['Beskrivelse', 'Antal', 'Beløb'],
      rows: [
        ['Kontant salg', '45', '12.450 kr'],
        ['Kort salg', '187', '52.360 kr'],
        ['MobilePay', '34', '8.920 kr'],
        ['Gavekort', '12', '3.600 kr'],
        ['Rabatter givet', '23', '-2.340 kr'],
        ['Returneringer', '3', '-890 kr']
      ],
      summary: {
        'Brutto omsætning': '77.330 kr',
        'Rabatter': '-2.340 kr',
        'Returneringer': '-890 kr',
        'Netto omsætning': '74.100 kr',
        'Moms (25%)': '14.820 kr',
        'Omsætning ekskl. moms': '59.280 kr'
      }
    };
  },

  getKonverteringsrapportData() {
    return {
      title: 'Konverteringsrapport',
      period: 'Sidste 30 dage',
      headers: ['Kilde', 'Besøgende', 'Ordrer', 'Konvertering', 'Gns. ordre'],
      rows: [
        ['Direkte', '2.450', '312', '12.7%', '245 kr'],
        ['Google', '1.890', '198', '10.5%', '289 kr'],
        ['Facebook', '876', '87', '9.9%', '198 kr'],
        ['Instagram', '654', '76', '11.6%', '234 kr'],
        ['Email', '432', '89', '20.6%', '312 kr'],
        ['Henvisning', '234', '45', '19.2%', '278 kr']
      ],
      summary: {
        'Total besøgende': '6.536',
        'Total ordrer': '807',
        'Gns. konvertering': '12.3%',
        'Total omsætning': '198.456 kr'
      }
    };
  },

  getGenbestillingsrapportData() {
    return {
      title: 'Genbestillingsrapport',
      period: 'Sidste 90 dage',
      headers: ['Kunde', 'Ordrer', 'Sidste ordre', 'Total', 'Gns. interval'],
      rows: [
        ['Anders Jensen', '12', '14-01-2026', '4.560 kr', '7 dage'],
        ['Maria Nielsen', '8', '12-01-2026', '3.240 kr', '11 dage'],
        ['Peter Hansen', '15', '15-01-2026', '6.780 kr', '6 dage'],
        ['Louise Pedersen', '6', '10-01-2026', '2.340 kr', '15 dage'],
        ['Thomas Andersen', '9', '13-01-2026', '4.050 kr', '10 dage']
      ],
      summary: {
        'Tilbagevendende kunder': '156',
        'Gns. ordrer pr. kunde': '4.2',
        'Gns. interval': '12 dage',
        'Retention rate': '67%'
      }
    };
  },

  getAnmeldelsesrapportData() {
    return {
      title: 'Anmeldelsesrapport',
      period: 'Sidste 30 dage',
      headers: ['Platform', 'Anmeldelser', 'Gns. rating', 'Positive', 'Negative'],
      rows: [
        ['Google', '45', '4.6 ★', '42', '3'],
        ['Trustpilot', '23', '4.4 ★', '20', '3'],
        ['Facebook', '18', '4.7 ★', '17', '1'],
        ['TripAdvisor', '12', '4.5 ★', '11', '1'],
        ['Intern feedback', '67', '4.8 ★', '65', '2']
      ],
      summary: {
        'Total anmeldelser': '165',
        'Gns. rating': '4.6 ★',
        'Positive': '155 (94%)',
        'Negative': '10 (6%)'
      }
    };
  },

  getHeatmaprapportData() {
    return {
      title: 'Heatmap Rapport',
      period: 'Sidste 7 dage',
      headers: ['Tidspunkt', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'],
      rows: [
        ['11:00-12:00', '12', '15', '14', '18', '22', '45', '38'],
        ['12:00-13:00', '34', '38', '35', '42', '48', '67', '54'],
        ['13:00-14:00', '28', '32', '29', '35', '38', '52', '43'],
        ['17:00-18:00', '18', '22', '20', '25', '32', '28', '24'],
        ['18:00-19:00', '45', '52', '48', '56', '78', '89', '67'],
        ['19:00-20:00', '56', '62', '58', '68', '92', '98', '78'],
        ['20:00-21:00', '42', '48', '45', '52', '72', '82', '62']
      ],
      summary: {
        'Travleste dag': 'Lørdag',
        'Travleste time': '19:00-20:00',
        'Total ordrer': '2.156',
        'Gns. pr. time': '44'
      }
    };
  },

  // === PDF EXPORT with Professional Wrapper ===
  async toPDF(reportType) {
    const data = this.getReportData(reportType);

    if (reportType === 'dagsrapport') {
      if (!data) {
        toast('Generer først en rapport', 'error');
        return;
      }
      // Use existing dagsrapport PDF function if available
      if (typeof exportDagsrapportPDF === 'function') {
        exportDagsrapportPDF();
        return;
      }
    }

    // Generate PDF with professional wrapper
    this.generateProfessionalPDF(reportType, data);
  },

  generateProfessionalPDF(reportType, data, returnBlob) {
    if (typeof window.jspdf === 'undefined') {
      toast('PDF bibliotek indlæses...', 'info');
      setTimeout(() => this.generateProfessionalPDF(reportType, data, returnBlob), 500);
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const c = this.config.colors;
    const m = this.config.margins;
    const f = this.config.fonts;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - m.left - m.right;
    const restaurant = this.getRestaurant();
    const company = this.config.company;

    let y = m.top;

    // === HEADER SECTION ===
    // Logo (left side)
    try {
      doc.addImage(this.logo, 'PNG', m.left, y, 40, 12);
    } catch(e) {
      // Fallback if logo fails
      doc.setFontSize(f.title);
      doc.setTextColor(...c.accent);
      doc.setFont('helvetica', 'bold');
      doc.text('ORDREFLOW', m.left, y + 8);
    }

    // Restaurant info (right side)
    doc.setFontSize(f.body);
    doc.setTextColor(...c.text);
    doc.setFont('helvetica', 'bold');
    doc.text(restaurant.name, pageWidth - m.right, y + 3, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(f.small);
    doc.setTextColor(...c.muted);
    doc.text(restaurant.address, pageWidth - m.right, y + 7, { align: 'right' });
    doc.text(restaurant.postalCity, pageWidth - m.right, y + 11, { align: 'right' });

    y += 18;

    // Divider line
    doc.setDrawColor(...c.accent);
    doc.setLineWidth(0.8);
    doc.line(m.left, y, pageWidth - m.right, y);

    y += 12;

    // === REPORT TITLE ===
    doc.setFontSize(f.title);
    doc.setTextColor(...c.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(data?.title || this.titles[reportType] || 'Rapport', m.left, y);

    y += 6;

    // Period/Date
    doc.setFontSize(f.body);
    doc.setTextColor(...c.muted);
    doc.setFont('helvetica', 'normal');
    doc.text(data?.period || this.getFormattedDate(), m.left, y);

    // Generated timestamp (right)
    doc.setFontSize(f.tiny);
    const timestamp = new Date().toLocaleString('da-DK');
    doc.text('Genereret: ' + timestamp, pageWidth - m.right, y, { align: 'right' });

    y += 12;

    // === DATA TABLE ===
    if (data && data.headers && data.rows) {
      const colCount = data.headers.length;
      const colWidth = contentWidth / colCount;
      const rowHeight = 8;

      // Table header background
      doc.setFillColor(...c.headerBg);
      doc.rect(m.left, y - 5, contentWidth, rowHeight + 2, 'F');

      // Table header text
      doc.setFontSize(f.small);
      doc.setTextColor(...c.text);
      doc.setFont('helvetica', 'bold');

      data.headers.forEach((header, i) => {
        const x = m.left + (i * colWidth) + 2;
        doc.text(header, x, y);
      });

      y += rowHeight;

      // Table header bottom border
      doc.setDrawColor(...c.border);
      doc.setLineWidth(0.3);
      doc.line(m.left, y - 2, pageWidth - m.right, y - 2);

      // Table rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(f.small);

      data.rows.forEach((row, rowIdx) => {
        // Alternate row background
        if (rowIdx % 2 === 1) {
          doc.setFillColor(252, 252, 253);
          doc.rect(m.left, y - 4, contentWidth, rowHeight, 'F');
        }

        doc.setTextColor(...c.text);
        row.forEach((cell, i) => {
          const x = m.left + (i * colWidth) + 2;
          doc.text(String(cell), x, y);
        });

        y += rowHeight;

        // Check for page break
        if (y > pageHeight - 50) {
          doc.addPage();
          y = m.top + 10;
        }
      });

      // Table bottom border
      doc.setDrawColor(...c.border);
      doc.line(m.left, y - 2, pageWidth - m.right, y - 2);

      y += 10;
    }

    // === SUMMARY SECTION ===
    if (data && data.summary) {
      // Summary box
      const summaryHeight = Object.keys(data.summary).length * 7 + 12;

      doc.setFillColor(...c.headerBg);
      if (typeof doc.roundedRect === 'function') {
        doc.roundedRect(m.left, y, contentWidth, summaryHeight, 3, 3, 'F');
      } else {
        doc.rect(m.left, y, contentWidth, summaryHeight, 'F');
      }

      doc.setDrawColor(...c.accent);
      doc.setLineWidth(0.5);
      if (typeof doc.roundedRect === 'function') {
        doc.roundedRect(m.left, y, contentWidth, summaryHeight, 3, 3, 'S');
      } else {
        doc.rect(m.left, y, contentWidth, summaryHeight, 'S');
      }

      y += 8;

      doc.setFontSize(f.header);
      doc.setTextColor(...c.primary);
      doc.setFont('helvetica', 'bold');
      doc.text('Opsummering', m.left + 5, y);

      y += 7;

      doc.setFontSize(f.body);
      doc.setFont('helvetica', 'normal');

      Object.entries(data.summary).forEach(([key, value]) => {
        doc.setTextColor(...c.muted);
        doc.text(key + ':', m.left + 5, y);

        doc.setTextColor(...c.text);
        doc.setFont('helvetica', 'bold');
        doc.text(String(value), m.left + 60, y);
        doc.setFont('helvetica', 'normal');

        y += 6;
      });
    }

    // === FOOTER ===
    const footerY = pageHeight - 15;

    // Footer divider
    doc.setDrawColor(...c.border);
    doc.setLineWidth(0.3);
    doc.line(m.left, footerY - 8, pageWidth - m.right, footerY - 8);

    // Footer text
    doc.setFontSize(f.tiny);
    doc.setTextColor(...c.muted);

    // Left: Company info
    doc.text(company.name + ' • CVR: ' + company.cvr, m.left, footerY - 3);
    doc.text(company.website + ' • ' + company.email, m.left, footerY + 1);

    // Right: Page number
    doc.text('Side 1 af 1', pageWidth - m.right, footerY - 1, { align: 'right' });

    // Center: Powered by
    doc.setTextColor(...c.accent);
    doc.text('Powered by Ordreflow', pageWidth / 2, footerY - 1, { align: 'center' });

    // Save PDF
    const filename = `${this.titles[reportType] || reportType}_${this.getShortDate().replace(/\./g, '-')}.pdf`;
    if (returnBlob) return { blob: doc.output('blob'), filename };
    doc.save(filename);
    closeExportDropdown();
  },

  // === EXCEL EXPORT ===
  toExcel(reportType) {
    const data = this.getReportData(reportType);

    if (reportType === 'dagsrapport' && !data) {
      toast('Generer først en rapport', 'error');
      return;
    }

    const rows = this.buildDataRows(reportType, data);
    const xmlContent = this.generateExcelXML(reportType, rows, data);

    const blob = new Blob([xmlContent], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${this.titles[reportType] || reportType}_${this.getShortDate().replace(/\./g, '-')}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);

    closeExportDropdown();
  },

  buildDataRows(reportType, data) {
    // For dagsrapport, use existing format
    if (reportType === 'dagsrapport' && data) {
      const d = data;
      const fmt = (n) => typeof n === 'number' ? n.toFixed(2) : n;
      return [
        ['DAGSRAPPORT', d.dato || this.getFormattedDate()],
        [''],
        ['DETALJER'],
        ['Åbnet', d.aabnet || ''],
        ['Lukket', d.lukket || ''],
        ['Åbnet af', d.medarbejder || ''],
        ['Dokumentnummer', d.dokumentNummer || ''],
        [''],
        ['SALGSOVERSIGT'],
        ['Bruttoomsætning', fmt(d.bruttoomsaetning || 0)],
        ['Rabatter', fmt(d.rabatter || 0)],
        ['Totalomsætning', fmt(d.totalomsaetning || 0)],
        ['Moms opkrævet', fmt(d.momsOpkraevet || 0)],
        ['Salg ekskl. moms', fmt(d.salgEksMoms || 0)]
      ];
    }

    // For other reports with headers/rows structure
    if (data && data.headers && data.rows) {
      const rows = [
        [data.title || this.titles[reportType], data.period || this.getFormattedDate()],
        [''],
        data.headers,
        ...data.rows
      ];

      // Add summary if exists
      if (data.summary) {
        rows.push(['']);
        rows.push(['OPSUMMERING']);
        Object.entries(data.summary).forEach(([key, value]) => {
          rows.push([key, value]);
        });
      }

      return rows;
    }

    // Default empty
    return [
      [this.titles[reportType] || reportType, this.getFormattedDate()],
      [''],
      ['Ingen data tilgængelig']
    ];
  },

  generateExcelXML(reportType, rows, data) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<?mso-application progid="Excel.Sheet"?>\n';
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
    xml += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
    xml += '<Styles>\n';
    xml += '<Style ss:ID="Title"><Font ss:Bold="1" ss:Size="16" ss:Color="#6366f1"/></Style>\n';
    xml += '<Style ss:ID="Header"><Font ss:Bold="1" ss:Size="11"/><Interior ss:Color="#f9fafb" ss:Pattern="Solid"/></Style>\n';
    xml += '<Style ss:ID="Bold"><Font ss:Bold="1"/></Style>\n';
    xml += '<Style ss:ID="Number"><NumberFormat ss:Format="#,##0.00"/></Style>\n';
    xml += '</Styles>\n';
    xml += `<Worksheet ss:Name="${this.titles[reportType] || 'Rapport'}">\n`;
    xml += '<Table>\n';

    rows.forEach((row, idx) => {
      xml += '<Row>\n';
      (Array.isArray(row) ? row : [row]).forEach((cell, cellIdx) => {
        let styleAttr = '';
        if (idx === 0) styleAttr = ' ss:StyleID="Title"';
        else if (idx === 2 && data?.headers) styleAttr = ' ss:StyleID="Header"';
        else if (typeof cell === 'string' && cell === cell.toUpperCase() && cell.length > 2) styleAttr = ' ss:StyleID="Bold"';

        const isNumber = typeof cell === 'number' || (typeof cell === 'string' && !isNaN(parseFloat(cell)) && cell.match(/^[\d.,]+$/));
        const cellType = isNumber ? 'Number' : 'String';
        const cellValue = cell === undefined || cell === null ? '' : cell;

        xml += `<Cell${styleAttr}><Data ss:Type="${cellType}">${this.escapeXml(cellValue)}</Data></Cell>\n`;
      });
      xml += '</Row>\n';
    });

    xml += '</Table>\n';
    xml += '</Worksheet>\n';
    xml += '</Workbook>';

    return xml;
  },

  // === CSV EXPORT ===
  toCSV(reportType) {
    const data = this.getReportData(reportType);

    if (reportType === 'dagsrapport' && !data) {
      toast('Generer først en rapport', 'error');
      return;
    }

    const rows = this.buildDataRows(reportType, data);

    // Convert to CSV with semicolon separator (Danish Excel default)
    const csv = rows.map(row =>
      (Array.isArray(row) ? row : [row]).map(cell => {
        const str = String(cell === undefined || cell === null ? '' : cell);
        if (str.includes(';') || str.includes('"') || str.includes('\n')) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      }).join(';')
    ).join('\n');

    // UTF-8 BOM for proper Danish character encoding
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${this.titles[reportType] || reportType}_${this.getShortDate().replace(/\./g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    closeExportDropdown();
  },

  // Helper: Escape XML special characters
  escapeXml(str) {
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  },

  // === BLOB GENERATORS (for report file tables) ===
  getPDFBlob(reportType) {
    const data = this.getReportData(reportType);
    return this.generateProfessionalPDF(reportType, data, true);
  },

  getExcelBlob(reportType) {
    const data = this.getReportData(reportType);
    const rows = this.buildDataRows(reportType, data);
    const xmlContent = this.generateExcelXML(reportType, rows, data);
    const blob = new Blob([xmlContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const filename = `${this.titles[reportType] || reportType}_${this.getShortDate().replace(/\./g, '-')}.xlsx`;
    return { blob, filename };
  },

  getCSVBlob(reportType) {
    const data = this.getReportData(reportType);
    const rows = this.buildDataRows(reportType, data);
    const csv = rows.map(row =>
      (Array.isArray(row) ? row : [row]).map(cell => {
        const str = String(cell === undefined || cell === null ? '' : cell);
        if (str.includes(';') || str.includes('"') || str.includes('\n')) return '"' + str.replace(/"/g, '""') + '"';
        return str;
      }).join(';')
    ).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const filename = `${this.titles[reportType] || reportType}_${this.getShortDate().replace(/\./g, '-')}.csv`;
    return { blob, filename };
  }
};

// === REPORT FILE MANAGEMENT ===
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getReportStorageKey(reportType, dato) {
  return `orderflow_report_files_${reportType}_${dato}`;
}

async function generateReportFiles(reportType, dato) {
  const storageKey = getReportStorageKey(reportType, dato);
  const title = ExportService.titles[reportType] || reportType;
  const dateStr = dato.replace(/-/g, '');
  const now = new Date().toISOString();
  const files = [];

  try {
    // Generate PDF
    const pdf = ExportService.getPDFBlob(reportType);
    if (pdf && pdf.blob) {
      const reader = new FileReader();
      const pdfBase64 = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(pdf.blob);
      });
      files.push({ name: `${title}_${dateStr}.pdf`, format: 'pdf', size: pdf.blob.size, generated: now, data: pdfBase64 });
    }

    // Generate Excel
    const xls = ExportService.getExcelBlob(reportType);
    if (xls && xls.blob) {
      const reader = new FileReader();
      const xlsBase64 = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(xls.blob);
      });
      files.push({ name: `${title}_${dateStr}.xlsx`, format: 'xlsx', size: xls.blob.size, generated: now, data: xlsBase64 });
    }

    // Generate CSV
    const csv = ExportService.getCSVBlob(reportType);
    if (csv && csv.blob) {
      const reader = new FileReader();
      const csvBase64 = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(csv.blob);
      });
      files.push({ name: `${title}_${dateStr}.csv`, format: 'csv', size: csv.blob.size, generated: now, data: csvBase64 });
    }

    localStorage.setItem(storageKey, JSON.stringify({ files }));
    return files;
  } catch (e) {
    console.error('generateReportFiles error:', e);
    return [];
  }
}

function loadReportFiles(reportType, dato) {
  const storageKey = getReportStorageKey(reportType, dato);
  const stored = localStorage.getItem(storageKey);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return parsed.files || [];
  } catch (e) { return []; }
}

function downloadReportFile(reportType, dato, format) {
  const files = loadReportFiles(reportType, dato);
  const file = files.find(f => f.format === format);
  if (!file) { toast('Fil ikke fundet', 'error'); return; }

  const link = document.createElement('a');
  link.href = file.data;
  link.download = file.name;
  link.click();
}

function renderReportFileTable(reportType, dato) {
  const containerId = `${reportType}-files`;
  const container = document.getElementById(containerId);
  if (!container) return;

  const files = loadReportFiles(reportType, dato);

  if (!files || files.length === 0) {
    container.innerHTML = '';
    return;
  }

  const formatBadge = (fmt) => {
    const colors = { pdf: '#dc2626', xlsx: '#16a34a', csv: '#2563eb' };
    return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;color:#fff;background:${colors[fmt] || '#6b7280'}">${fmt.toUpperCase()}</span>`;
  };

  const formatDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('da-DK', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + d.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return iso; }
  };

  container.innerHTML = `
    <div class="card" style="padding:0;overflow:hidden">
      <div style="display:grid;grid-template-columns:1fr 80px 90px 150px 100px;gap:var(--space-3);padding:12px 16px;background:var(--bg);border-bottom:2px solid var(--border);font-size:var(--font-size-sm);font-weight:var(--font-weight-semibold);color:var(--muted)">
        <span>Filnavn</span><span>Format</span><span>Størrelse</span><span>Genereret</span><span style="text-align:center">Download</span>
      </div>
      ${files.map(file => `
        <div style="display:grid;grid-template-columns:1fr 80px 90px 150px 100px;gap:var(--space-3);padding:12px 16px;border-bottom:1px solid var(--border);align-items:center;font-size:var(--font-size-sm)">
          <span style="font-weight:var(--font-weight-medium)">${file.name}</span>
          <span>${formatBadge(file.format)}</span>
          <span style="color:var(--muted)">${formatFileSize(file.size)}</span>
          <span style="color:var(--muted)">${formatDate(file.generated)}</span>
          <span style="text-align:center"><button class="btn btn-secondary btn-sm" onclick="downloadReportFile('${reportType}','${dato}','${file.format}')">Download</button></span>
        </div>
      `).join('')}
    </div>`;
}

// =====================================================
// REUSABLE REPORT DATA TABLE (produktbibliotek-stil)
// =====================================================
const reportTableState = {};

function renderReportDataTable(containerId, columns, rows, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const reportType = options.reportType || containerId.replace('-content', '');
  const pageSize = options.pageSize || 25;

  if (!reportTableState[reportType]) {
    reportTableState[reportType] = { currentPage: 1 };
  }
  const state = reportTableState[reportType];
  if (options.resetPage) state.currentPage = 1;

  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (state.currentPage > totalPages) state.currentPage = totalPages;
  const startIdx = (state.currentPage - 1) * pageSize;
  const paginatedRows = rows.slice(startIdx, startIdx + pageSize);

  const gridCols = columns.map(c => c.width || '1fr').join(' ');

  let html = `<div class="card" style="padding:0;overflow:hidden">`;

  // Header row
  html += `<div style="display:grid;grid-template-columns:${gridCols};gap:var(--space-3);padding:14px 16px;background:var(--bg2);font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;border-radius:var(--radius-md) var(--radius-md) 0 0">`;
  columns.forEach(col => {
    const align = col.align === 'right' ? 'text-align:right' : '';
    html += `<span style="${align}">${col.label}</span>`;
  });
  html += `</div>`;

  // Data rows
  if (paginatedRows.length === 0) {
    html += `<div style="padding:24px;text-align:center;color:var(--muted);font-size:var(--font-size-sm)">Ingen data</div>`;
  } else {
    paginatedRows.forEach((row, idx) => {
      const isHighlight = row._highlight;
      const bgStyle = isHighlight ? 'background:var(--bg2);font-weight:600;' : '';
      html += `<div style="display:grid;grid-template-columns:${gridCols};gap:var(--space-3);padding:12px 16px;border-bottom:1px solid var(--border);align-items:center;font-size:var(--font-size-sm);${bgStyle}">`;
      columns.forEach(col => {
        const val = row[col.key] !== undefined ? row[col.key] : '';
        const align = col.align === 'right' ? 'text-align:right;' : '';
        const fw = col.bold || isHighlight ? 'font-weight:500;' : '';
        const color = col.muted ? 'color:var(--muted);' : '';
        html += `<span style="${align}${fw}${color}">${val}</span>`;
      });
      html += `</div>`;
    });
  }

  html += `</div>`;

  // Pagination
  if (totalItems > pageSize) {
    html += `<div class="crm-pagination" id="${reportType}-pagination">
      <button class="crm-page-btn" onclick="reportTableGoTo('${containerId}','${reportType}','first')" ${state.currentPage === 1 ? 'disabled' : ''}>« Første</button>
      <button class="crm-page-btn" onclick="reportTableGoTo('${containerId}','${reportType}','prev')" ${state.currentPage === 1 ? 'disabled' : ''}>‹ Forrige</button>
      <span class="crm-page-info">Side ${state.currentPage} af ${totalPages}</span>
      <button class="crm-page-btn" onclick="reportTableGoTo('${containerId}','${reportType}','next')" ${state.currentPage >= totalPages ? 'disabled' : ''}>Næste ›</button>
      <button class="crm-page-btn" onclick="reportTableGoTo('${containerId}','${reportType}','last')" ${state.currentPage >= totalPages ? 'disabled' : ''}>Sidste »</button>
    </div>`;
  }

  container.innerHTML = html;
}

// Store columns/rows per report for pagination
const reportTableData = {};

function reportTableGoTo(containerId, reportType, direction) {
  const data = reportTableData[reportType];
  if (!data) return;
  const state = reportTableState[reportType];
  if (!state) return;
  const totalPages = Math.max(1, Math.ceil(data.rows.length / (data.options.pageSize || 25)));

  switch (direction) {
    case 'first': state.currentPage = 1; break;
    case 'prev': if (state.currentPage > 1) state.currentPage--; break;
    case 'next': if (state.currentPage < totalPages) state.currentPage++; break;
    case 'last': state.currentPage = totalPages; break;
  }
  renderReportDataTable(containerId, data.columns, data.rows, data.options);
}

function showReportTable(containerId, columns, rows, options = {}) {
  const reportType = options.reportType || containerId.replace('-content', '');
  reportTableData[reportType] = { columns, rows, options };
  options.resetPage = true;
  renderReportDataTable(containerId, columns, rows, options);
}

// === EXPORT DROPDOWN FUNCTIONS ===
function toggleExportDropdown(id) {
  const dropdown = document.getElementById('export-' + id);
  if (!dropdown) return;

  document.querySelectorAll('.export-dropdown.open').forEach(d => {
    if (d.id !== 'export-' + id) d.classList.remove('open');
  });

  dropdown.classList.toggle('open');
}

function closeExportDropdown() {
  document.querySelectorAll('.export-dropdown.open').forEach(d => d.classList.remove('open'));
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.export-dropdown')) {
    closeExportDropdown();
  }
});


