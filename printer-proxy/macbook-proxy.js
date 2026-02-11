// MacBook Printer Proxy
// Receives requests from VPS via Tailscale and forwards to local printer

const http = require('http');

const PORT = 3457;
const PRINTER_IP = '192.168.32.26';
const PRINTER_PORT = 80;

const server = http.createServer((req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // Health check
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      printer: `${PRINTER_IP}:${PRINTER_PORT}`,
      note: 'MacBook local proxy ready'
    }));
    return;
  }

  // Proxy to printer
  if (req.url === '/print' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      // Forward to local printer
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
          res.writeHead(printerRes.statusCode, { 'Content-Type': 'text/xml' });
          res.end(printerBody);
        });
      });

      printerReq.on('error', (err) => {
        console.error('❌ Printer error:', err.message);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Printer unreachable', details: err.message }));
      });

      printerReq.on('timeout', () => {
        console.error('⏱️ Printer timeout');
        printerReq.destroy();
        res.writeHead(504, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Printer timeout' }));
      });

      printerReq.write(body);
      printerReq.end();
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🖨️  MacBook Printer Proxy listening on port ${PORT}`);
  console.log(`📡 Forwarding to printer: ${PRINTER_IP}:${PRINTER_PORT}`);
  console.log(`💡 Listening on all interfaces (including Tailscale 100.79.171.122)`);
});
