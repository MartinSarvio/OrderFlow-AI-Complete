// VPS Printer Proxy
// Forwards HTTPS requests from OrderFlow (Vercel) to MacBook via Tailscale

const http = require('http');

const PORT = 3456;
const MACBOOK_TAILSCALE_IP = '100.79.171.122';
const MACBOOK_PROXY_PORT = 3457;

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
    res.end(JSON.stringify({ 
      status: 'ok', 
      route: `VPS → Tailscale → MacBook (${MACBOOK_TAILSCALE_IP}:${MACBOOK_PROXY_PORT})`
    }));
    return;
  }

  // Proxy to MacBook
  if (req.url === '/print' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      // Forward to MacBook via Tailscale
      const macbookReq = http.request({
        hostname: MACBOOK_TAILSCALE_IP,
        port: MACBOOK_PROXY_PORT,
        path: '/print',
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=UTF-8',
          'Content-Length': Buffer.byteLength(body)
        },
        timeout: 10000
      }, (macbookRes) => {
        let macbookBody = '';
        
        macbookRes.on('data', chunk => {
          macbookBody += chunk.toString();
        });

        macbookRes.on('end', () => {
          console.log(`✅ MacBook proxy responded: ${macbookRes.statusCode}`);
          res.writeHead(macbookRes.statusCode, { ...corsHeaders, 'Content-Type': 'text/xml' });
          res.end(macbookBody);
        });
      });

      macbookReq.on('error', (err) => {
        console.error('❌ MacBook proxy error:', err.message);
        res.writeHead(502, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'MacBook proxy unreachable', details: err.message }));
      });

      macbookReq.on('timeout', () => {
        console.error('⏱️ MacBook proxy timeout');
        macbookReq.destroy();
        res.writeHead(504, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'MacBook proxy timeout' }));
      });

      macbookReq.write(body);
      macbookReq.end();
    });
    return;
  }

  // 404
  res.writeHead(404, { ...corsHeaders, 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🖨️  VPS Printer Proxy listening on port ${PORT}`);
  console.log(`📡 Forwarding to MacBook via Tailscale: ${MACBOOK_TAILSCALE_IP}:${MACBOOK_PROXY_PORT}`);
  console.log(`🌍 Public endpoint: http://31.220.111.87:${PORT}/print`);
});
