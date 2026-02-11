// =====================================================
// PRINTER SERVICE - Star Micronics TSP100A Integration
// Star WebPRNT SDK wrapper for browser-to-printer communication
// =====================================================

// Printer settings stored in localStorage
const PRINTER_SETTINGS_KEY = 'orderflow_printer_settings';

const DEFAULT_PRINTER_SETTINGS = {
  enabled: false,
  printerIp: '192.168.1.100',
  printerPort: 80,
  useHttps: false,
  useProxy: true, // Use VPS proxy via Tailscale (recommended for Vercel deployment)
  proxyUrl: 'http://31.220.111.87:3456/print',
  paperWidth: 80, // 80mm or 58mm
  autoPrintKitchen: true,
  autoPrintCustomer: false,
  kitchenOrderTypes: ['all'], // 'all', 'online', 'sms', 'walk-in', 'delivery'
  soundOnKitchenPrint: true,
  soundRepeat: 3,
  cutAfterPrint: true,
  restaurantName: '',
  restaurantAddress: '',
  restaurantPhone: '',
  restaurantCvr: '',
  footerText: 'Tak for din bestilling!',
  showQrCode: false,
  qrCodeUrl: '',
};

function getPrinterSettings() {
  try {
    const saved = localStorage.getItem(PRINTER_SETTINGS_KEY);
    return saved ? { ...DEFAULT_PRINTER_SETTINGS, ...JSON.parse(saved) } : { ...DEFAULT_PRINTER_SETTINGS };
  } catch {
    return { ...DEFAULT_PRINTER_SETTINGS };
  }
}

function savePrinterSettings(settings) {
  localStorage.setItem(PRINTER_SETTINGS_KEY, JSON.stringify(settings));
}

function getPrinterUrl() {
  const s = getPrinterSettings();
  
  // Use proxy if enabled (recommended for production/Vercel)
  if (s.useProxy && s.proxyUrl) {
    return s.proxyUrl;
  }
  
  // Direct connection (local development only)
  const protocol = s.useHttps ? 'https' : 'http';
  return `${protocol}://${s.printerIp}:${s.printerPort}/StarWebPRNT/SendMessage`;
}

// =====================================================
// CORE PRINT FUNCTION
// =====================================================

function sendToPrinter(requestXml) {
  return new Promise((resolve, reject) => {
    const settings = getPrinterSettings();
    if (!settings.enabled) {
      reject(new Error('Printer er deaktiveret'));
      return;
    }

    const trader = new StarWebPrintTrader({
      url: getPrinterUrl(),
      timeout: 10000,
    });

    trader.onReceive = function (response) {
      // Check printer status
      const status = {
        success: response.traderSuccess === 'true',
        coverOpen: trader.isCoverOpen(response),
        offline: trader.isOffLine(response),
        paperEnd: trader.isPaperEnd(response),
        paperNearEnd: trader.isPaperNearEnd(response),
        cutterError: trader.isAutoCutterError(response),
        highTemp: trader.isHighTemperatureStop(response),
      };

      if (status.success) {
        resolve(status);
      } else {
        let errorMsg = 'Print fejlede';
        if (status.coverOpen) errorMsg = 'Printer låg er åbent';
        else if (status.offline) errorMsg = 'Printer er offline';
        else if (status.paperEnd) errorMsg = 'Printer er løbet tør for papir';
        else if (status.cutterError) errorMsg = 'Cutter fejl';
        reject(new Error(errorMsg));
      }
    };

    trader.onError = function (response) {
      let msg = 'Kan ikke forbinde til printer';
      if (response.status === 0) msg = 'Printer timeout - tjek netværksforbindelse';
      reject(new Error(msg));
    };

    trader.onTimeout = function () {
      reject(new Error('Printer timeout'));
    };

    try {
      trader.sendMessage({ request: requestXml });
    } catch (e) {
      reject(new Error('Fejl ved afsendelse: ' + e.message));
    }
  });
}

// =====================================================
// CHECK PRINTER STATUS
// =====================================================

async function checkPrinterStatus() {
  const settings = getPrinterSettings();
  if (!settings.enabled) {
    return { online: false, reason: 'Deaktiveret' };
  }

  try {
    const builder = new StarWebPrintBuilder();
    // Send empty initialization to check status
    const request = builder.createInitializationElement({ reset: 'false', print: 'false' });
    const status = await sendToPrinter(request);
    return {
      online: true,
      paperNearEnd: status.paperNearEnd,
      details: status,
    };
  } catch (e) {
    return { online: false, reason: e.message };
  }
}

// =====================================================
// PRINT CUSTOMER RECEIPT
// =====================================================

async function printCustomerReceipt(order, restaurant) {
  const settings = getPrinterSettings();
  const builder = new StarWebPrintBuilder();
  let request = '';

  // Initialize
  request += builder.createInitializationElement({});

  // Codepage for Danish chars (æøå)
  request += builder.createTextElement({ codepage: 'cp1252', international: 'denmark' });

  // === HEADER ===
  request += builder.createAlignmentElement({ position: 'center' });
  request += builder.createTextElement({
    emphasis: 'true',
    width: 2,
    height: 2,
    data: (settings.restaurantName || restaurant?.name || 'Restaurant') + '\n',
  });
  request += builder.createTextElement({
    emphasis: 'false',
    width: 1,
    height: 1,
    data: (settings.restaurantAddress || restaurant?.address || '') + '\n',
  });
  if (settings.restaurantPhone || restaurant?.phone) {
    request += builder.createTextElement({
      data: 'Tlf: ' + (settings.restaurantPhone || restaurant?.phone) + '\n',
    });
  }
  if (settings.restaurantCvr) {
    request += builder.createTextElement({ data: 'CVR: ' + settings.restaurantCvr + '\n' });
  }

  // Divider
  request += builder.createAlignmentElement({ position: 'left' });
  request += builder.createRuledLineElement({ thickness: 'medium', width: settings.paperWidth === 80 ? 576 : 384 });
  request += builder.createFeedElement({ line: 1 });

  // === ORDER INFO ===
  request += builder.createTextElement({
    emphasis: 'true',
    data: 'Ordre #' + (order.id || '???') + '\n',
  });
  request += builder.createTextElement({
    emphasis: 'false',
    data: 'Dato: ' + formatReceiptDate(order.createdAt || new Date().toISOString()) + '\n',
  });
  request += builder.createTextElement({
    data: 'Type: ' + (order.orderType || 'Afhentning') + '\n',
  });
  if (order.customerName && order.customerName !== 'Ukendt') {
    request += builder.createTextElement({ data: 'Kunde: ' + order.customerName + '\n' });
  }
  if (order.orderType === 'Delivery' && order.address) {
    request += builder.createTextElement({ data: 'Adresse: ' + order.address + '\n' });
  }

  // Divider
  request += builder.createRuledLineElement({ thickness: 'medium', width: settings.paperWidth === 80 ? 576 : 384 });
  request += builder.createFeedElement({ line: 1 });

  // === ITEMS ===
  const items = parseOrderItems(order.items);
  for (const item of items) {
    const nameStr = (item.qty > 1 ? item.qty + 'x ' : '') + item.name;
    const priceStr = item.price ? item.price.toFixed(2) + ' kr' : '';

    if (priceStr) {
      // Right-align price
      const maxChars = settings.paperWidth === 80 ? 48 : 32;
      const padding = maxChars - nameStr.length - priceStr.length;
      const line = nameStr + (padding > 0 ? ' '.repeat(padding) : '  ') + priceStr + '\n';
      request += builder.createTextElement({ data: line });
    } else {
      request += builder.createTextElement({ data: nameStr + '\n' });
    }

    if (item.note) {
      request += builder.createTextElement({
        font: 'font_b',
        data: '  * ' + item.note + '\n',
      });
      request += builder.createTextElement({ font: 'font_a' });
    }
  }

  // Divider
  request += builder.createRuledLineElement({ thickness: 'medium', width: settings.paperWidth === 80 ? 576 : 384 });
  request += builder.createFeedElement({ line: 1 });

  // === TOTALS ===
  const total = parseFloat(order.total) || 0;
  const momsRate = 0.25;
  const subtotal = total / (1 + momsRate);
  const moms = total - subtotal;
  const maxChars = settings.paperWidth === 80 ? 48 : 32;

  const subtotalLine = formatReceiptLine('Subtotal:', subtotal.toFixed(2) + ' kr', maxChars);
  const momsLine = formatReceiptLine('Moms (25%):', moms.toFixed(2) + ' kr', maxChars);

  request += builder.createTextElement({ data: subtotalLine + '\n' });
  request += builder.createTextElement({ data: momsLine + '\n' });
  request += builder.createFeedElement({ line: 1 });

  // TOTAL - large
  request += builder.createTextElement({
    emphasis: 'true',
    width: 2,
    height: 2,
  });
  request += builder.createAlignmentElement({ position: 'center' });
  request += builder.createTextElement({ data: 'TOTAL: ' + total.toFixed(2) + ' kr\n' });
  request += builder.createTextElement({ emphasis: 'false', width: 1, height: 1 });

  // === FOOTER ===
  request += builder.createFeedElement({ line: 1 });
  request += builder.createAlignmentElement({ position: 'center' });
  if (settings.footerText) {
    request += builder.createTextElement({ data: settings.footerText + '\n' });
  }

  // QR Code
  if (settings.showQrCode && settings.qrCodeUrl) {
    request += builder.createFeedElement({ line: 1 });
    const qrData = settings.qrCodeUrl.replace('{orderId}', order.id || '');
    request += builder.createQrCodeElement({
      model: 'model2',
      level: 'level_m',
      cell: 5,
      data: qrData,
    });
  }

  request += builder.createFeedElement({ line: 1 });
  request += builder.createTextElement({
    font: 'font_b',
    data: formatReceiptDate(new Date().toISOString()) + '\n',
  });

  // Cut paper
  if (settings.cutAfterPrint) {
    request += builder.createCutPaperElement({ feed: 'true', type: 'partial' });
  }

  return sendToPrinter(request);
}

// =====================================================
// PRINT KITCHEN RECEIPT
// =====================================================

async function printKitchenReceipt(order, restaurant) {
  const settings = getPrinterSettings();
  const builder = new StarWebPrintBuilder();
  let request = '';

  // Initialize
  request += builder.createInitializationElement({});
  request += builder.createTextElement({ codepage: 'cp1252', international: 'denmark' });

  // Sound alert for kitchen
  if (settings.soundOnKitchenPrint) {
    request += builder.createSoundElement({
      channel: 1,
      repeat: settings.soundRepeat || 3,
    });
  }

  // === HEADER - LARGE ===
  request += builder.createAlignmentElement({ position: 'center' });
  request += builder.createTextElement({
    emphasis: 'true',
    width: 3,
    height: 3,
    data: '** KOEKKEN **\n',
  });

  // Order number - VERY LARGE
  request += builder.createTextElement({
    emphasis: 'true',
    width: 4,
    height: 4,
    data: '#' + (order.id || '???') + '\n',
  });

  // Order type
  request += builder.createTextElement({
    emphasis: 'true',
    width: 2,
    height: 2,
    data: (order.orderType || 'Afhentning').toUpperCase() + '\n',
  });

  request += builder.createTextElement({ emphasis: 'false', width: 1, height: 1 });

  // Time
  request += builder.createTextElement({
    data: 'Tid: ' + formatReceiptTime(order.createdAt || new Date().toISOString()) + '\n',
  });

  if (order.customerName && order.customerName !== 'Ukendt') {
    request += builder.createTextElement({
      emphasis: 'true',
      width: 2,
      height: 1,
      data: order.customerName + '\n',
    });
    request += builder.createTextElement({ emphasis: 'false', width: 1, height: 1 });
  }

  if (order.orderType === 'Delivery' && order.address) {
    request += builder.createTextElement({ data: 'Adr: ' + order.address + '\n' });
  }

  // Divider
  request += builder.createAlignmentElement({ position: 'left' });
  const lineWidth = settings.paperWidth === 80 ? 576 : 384;
  request += builder.createRuledLineElement({ thickness: 'thick', width: lineWidth });
  request += builder.createFeedElement({ line: 1 });

  // === ITEMS - LARGE TEXT for kitchen readability ===
  const items = parseOrderItems(order.items);
  for (const item of items) {
    request += builder.createTextElement({
      emphasis: 'true',
      width: 2,
      height: 2,
      data: (item.qty > 1 ? item.qty + 'x ' : '') + item.name + '\n',
    });

    if (item.note) {
      request += builder.createTextElement({
        emphasis: 'false',
        width: 1,
        height: 2,
        data: '   >> ' + item.note + '\n',
      });
    }
  }

  // Divider
  request += builder.createTextElement({ width: 1, height: 1, emphasis: 'false' });
  request += builder.createRuledLineElement({ thickness: 'thick', width: lineWidth });
  request += builder.createFeedElement({ line: 1 });

  // Notes
  if (order.notes || order.specialInstructions) {
    request += builder.createTextElement({
      emphasis: 'true',
      width: 2,
      height: 2,
      data: 'NOTER:\n',
    });
    request += builder.createTextElement({
      emphasis: 'false',
      width: 1,
      height: 2,
      data: (order.notes || order.specialInstructions) + '\n',
    });
    request += builder.createTextElement({ width: 1, height: 1 });
  }

  // Estimated time
  if (order.estimatedTime) {
    request += builder.createAlignmentElement({ position: 'center' });
    request += builder.createTextElement({
      emphasis: 'true',
      width: 2,
      height: 2,
      data: 'Klar ca: ' + order.estimatedTime + ' min\n',
    });
  }

  // Cut paper
  if (settings.cutAfterPrint) {
    request += builder.createCutPaperElement({ feed: 'true', type: 'partial' });
  }

  return sendToPrinter(request);
}

// =====================================================
// TEST PRINT
// =====================================================

async function printTestReceipt() {
  const settings = getPrinterSettings();
  const builder = new StarWebPrintBuilder();
  let request = '';

  request += builder.createInitializationElement({});
  request += builder.createTextElement({ codepage: 'cp1252', international: 'denmark' });

  // Sound
  request += builder.createSoundElement({ channel: 1, repeat: 1 });

  request += builder.createAlignmentElement({ position: 'center' });
  request += builder.createTextElement({
    emphasis: 'true',
    width: 2,
    height: 2,
    data: 'TEST PRINT\n',
  });
  request += builder.createTextElement({
    emphasis: 'false',
    width: 1,
    height: 1,
    data: 'Star TSP100A\n',
  });
  request += builder.createTextElement({
    data: 'OrderFlow Printer Integration\n',
  });

  request += builder.createFeedElement({ line: 1 });
  request += builder.createAlignmentElement({ position: 'left' });

  // Test Danish characters
  request += builder.createTextElement({
    data: 'Danske tegn: æøå ÆØÅ\n',
  });
  request += builder.createTextElement({
    data: 'Papirbredde: ' + settings.paperWidth + 'mm\n',
  });
  request += builder.createTextElement({
    data: 'Printer IP: ' + settings.printerIp + '\n',
  });
  request += builder.createTextElement({
    data: 'Tidspunkt: ' + formatReceiptDate(new Date().toISOString()) + '\n',
  });

  request += builder.createFeedElement({ line: 1 });
  request += builder.createRuledLineElement({
    thickness: 'medium',
    width: settings.paperWidth === 80 ? 576 : 384,
  });
  request += builder.createFeedElement({ line: 1 });

  // Sample items
  const maxChars = settings.paperWidth === 80 ? 48 : 32;
  request += builder.createTextElement({
    data: formatReceiptLine('2x Margherita Pizza', '178.00 kr', maxChars) + '\n',
  });
  request += builder.createTextElement({
    data: formatReceiptLine('1x Cola', '25.00 kr', maxChars) + '\n',
  });
  request += builder.createTextElement({
    data: formatReceiptLine('1x Tiramisu', '65.00 kr', maxChars) + '\n',
  });

  request += builder.createRuledLineElement({
    thickness: 'medium',
    width: settings.paperWidth === 80 ? 576 : 384,
  });
  request += builder.createFeedElement({ line: 1 });

  request += builder.createTextElement({
    emphasis: 'true',
    data: formatReceiptLine('TOTAL:', '268.00 kr', maxChars) + '\n',
  });

  request += builder.createFeedElement({ line: 1 });
  request += builder.createAlignmentElement({ position: 'center' });
  request += builder.createTextElement({
    emphasis: 'false',
    data: 'Printer virker! Alt er godt.\n',
  });

  // QR code test
  request += builder.createFeedElement({ line: 1 });
  request += builder.createQrCodeElement({
    model: 'model2',
    level: 'level_m',
    cell: 5,
    data: 'https://orderflow.dk',
  });

  request += builder.createFeedElement({ line: 2 });
  request += builder.createCutPaperElement({ feed: 'true', type: 'partial' });

  return sendToPrinter(request);
}

// =====================================================
// PRINT QUEUE SYSTEM
// =====================================================

const PRINT_QUEUE_KEY = 'orderflow_print_queue';
let printQueueProcessing = false;
let printQueueInterval = null;

function getPrintQueue() {
  try {
    return JSON.parse(localStorage.getItem(PRINT_QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function savePrintQueue(queue) {
  localStorage.setItem(PRINT_QUEUE_KEY, JSON.stringify(queue));
}

function addToPrintQueue(type, order, restaurant) {
  const queue = getPrintQueue();
  queue.push({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
    type, // 'customer' or 'kitchen'
    order: JSON.parse(JSON.stringify(order)),
    restaurant: restaurant ? { name: restaurant.name, address: restaurant.address, phone: restaurant.phone } : null,
    attempts: 0,
    maxAttempts: 5,
    createdAt: new Date().toISOString(),
    lastAttempt: null,
    status: 'pending', // pending, printing, failed, done
  });
  savePrintQueue(queue);
  processPrintQueue();
}

async function processPrintQueue() {
  if (printQueueProcessing) return;
  printQueueProcessing = true;

  const queue = getPrintQueue();
  const pending = queue.filter((j) => j.status === 'pending' || j.status === 'failed');

  for (const job of pending) {
    if (job.attempts >= job.maxAttempts) {
      job.status = 'failed';
      continue;
    }

    job.status = 'printing';
    job.attempts++;
    job.lastAttempt = new Date().toISOString();
    savePrintQueue(queue);

    try {
      if (job.type === 'customer') {
        await printCustomerReceipt(job.order, job.restaurant);
      } else if (job.type === 'kitchen') {
        await printKitchenReceipt(job.order, job.restaurant);
      }
      job.status = 'done';
      console.log(`🖨️ Print job ${job.id} (${job.type}) completed`);
    } catch (e) {
      console.warn(`🖨️ Print job ${job.id} failed (attempt ${job.attempts}): ${e.message}`);
      job.status = job.attempts >= job.maxAttempts ? 'failed' : 'pending';
    }

    savePrintQueue(queue);
  }

  // Clean completed jobs older than 1 hour
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const cleaned = queue.filter((j) => j.status !== 'done' || j.createdAt > oneHourAgo);
  savePrintQueue(cleaned);

  printQueueProcessing = false;
}

function startPrintQueueProcessor() {
  if (printQueueInterval) return;
  // Process queue every 30 seconds for retries
  printQueueInterval = setInterval(processPrintQueue, 30000);
  // Also process immediately
  processPrintQueue();
}

function stopPrintQueueProcessor() {
  if (printQueueInterval) {
    clearInterval(printQueueInterval);
    printQueueInterval = null;
  }
}

function getPrintQueueStats() {
  const queue = getPrintQueue();
  return {
    total: queue.length,
    pending: queue.filter((j) => j.status === 'pending').length,
    printing: queue.filter((j) => j.status === 'printing').length,
    failed: queue.filter((j) => j.status === 'failed').length,
    done: queue.filter((j) => j.status === 'done').length,
  };
}

function clearPrintQueue() {
  savePrintQueue([]);
}

function retryFailedJobs() {
  const queue = getPrintQueue();
  queue.forEach((j) => {
    if (j.status === 'failed') {
      j.status = 'pending';
      j.attempts = 0;
    }
  });
  savePrintQueue(queue);
  processPrintQueue();
}

// =====================================================
// ORDER PRINT TRIGGERS
// =====================================================

/**
 * Called when a new order comes in (from SMS, online, etc.)
 * Triggers kitchen print if auto-print is enabled
 */
function triggerKitchenPrint(order, restaurant) {
  const settings = getPrinterSettings();
  if (!settings.enabled || !settings.autoPrintKitchen) return;

  // Check if this order type should be printed
  if (!settings.kitchenOrderTypes.includes('all')) {
    const typeMap = {
      Pickup: 'walk-in',
      Delivery: 'delivery',
      Online: 'online',
      SMS: 'sms',
    };
    const orderTypeKey = typeMap[order.orderType] || order.orderType?.toLowerCase();
    if (!settings.kitchenOrderTypes.includes(orderTypeKey)) return;
  }

  addToPrintQueue('kitchen', order, restaurant);
  console.log('🖨️ Køkken-print tilføjet til kø for ordre #' + order.id);
}

/**
 * Called when an order is completed
 * Triggers customer receipt print
 */
function triggerCustomerPrint(order, restaurant) {
  const settings = getPrinterSettings();
  if (!settings.enabled) return;

  addToPrintQueue('customer', order, restaurant);
  console.log('🖨️ Kunde-kvittering tilføjet til kø for ordre #' + order.id);
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function parseOrderItems(itemsStr) {
  if (!itemsStr) return [];
  if (Array.isArray(itemsStr)) return itemsStr;

  // Parse string format like "2x Pizza Margherita, 1x Cola"
  const items = [];
  const parts = itemsStr.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    const match = part.match(/^(\d+)\s*x\s*(.+?)(?:\s+(\d+(?:[.,]\d+)?)\s*kr)?$/i);
    if (match) {
      items.push({
        qty: parseInt(match[1]),
        name: match[2].trim(),
        price: match[3] ? parseFloat(match[3].replace(',', '.')) : null,
        note: null,
      });
    } else {
      items.push({ qty: 1, name: part, price: null, note: null });
    }
  }

  return items;
}

function formatReceiptDate(isoStr) {
  try {
    const d = new Date(isoStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${mins}`;
  } catch {
    return isoStr;
  }
}

function formatReceiptTime(isoStr) {
  try {
    const d = new Date(isoStr);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return isoStr;
  }
}

function formatReceiptLine(left, right, maxChars) {
  const padding = maxChars - left.length - right.length;
  return left + (padding > 0 ? ' '.repeat(padding) : '  ') + right;
}

// =====================================================
// INIT - Start queue processor when printer is enabled
// =====================================================

function initPrinterService() {
  const settings = getPrinterSettings();
  if (settings.enabled) {
    startPrintQueueProcessor();
    console.log('🖨️ Printer service startet - IP: ' + settings.printerIp);
  }
}

// Auto-init on load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    // Delay init to not block page load
    setTimeout(initPrinterService, 2000);
  });
}
