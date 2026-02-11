// Printer Proxy Server
// Forwards HTTPS requests from OrderFlow (Vercel) to local Star TSP100A printer

const http = require('http');
const https = require('https');
const fs = require('fs');

const PORT = 3456;
const PRINTER_IP = '192.168.32.26';
const PRINTER_PORT = 80;

// CORS headers for Vercel
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const server = http.createServer((req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  // Health check
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', printer: `${PRINTER_IP}:${PRINTER_PORT}` }));
    return;
  }

  // Proxy to printer
  if (req.url === '/print' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      // Forward to printer
      const printerReq = http.request({
        hostname: PRINTER_IP,
        port: PRINTER_PORT,
        path: '/StarWebPRNT/SendMessage',
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=UTF-8',
          'Content-Length': Buffer.byteLength(body)
        },
        timeout: 5000
      }, (printerRes) => {
        let printerBody = '';
        
        printerRes.on('data', chunk => {
          printerBody += chunk.toString();
        });

        printerRes.on('end', () => {
          console.log(`✅ Printer responded: ${printerRes.statusCode}`);
          res.writeHead(printerRes.statusCode, { ...corsHeaders, 'Content-Type': 'text/xml' });
          res.end(printerBody);
        });
      });

      printerReq.on('error', (err) => {
        console.error('❌ Printer error:', err.message);
        res.writeHead(502, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Printer unreachable', details: err.message }));
      });

      printerReq.on('timeout', () => {
        console.error('⏱️ Printer timeout');
        printerReq.destroy();
        res.writeHead(504, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Printer timeout' }));
      });

      printerReq.write(body);
      printerReq.end();
    });
    return;
  }

  // 404
  res.writeHead(404, { ...corsHeaders, 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🖨️  Printer Proxy listening on port ${PORT}`);
  console.log(`📡 Forwarding to printer: ${PRINTER_IP}:${PRINTER_PORT}`);
  console.log(`🌍 Public endpoint: http://YOUR_VPS_IP:${PORT}/print`);
});
