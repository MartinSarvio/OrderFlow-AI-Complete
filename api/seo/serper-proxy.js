// Vercel Serverless Function — Serper API Proxy
// Proxies client-side Serper requests to avoid exposing API keys

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    let payload = req.body;
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload || '{}'); } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON' });
      }
    }

    const endpoint = payload.endpoint || 'search';
    const query = payload.query || '';
    const validEndpoints = ['search', 'places', 'maps', 'reviews', 'images'];

    if (!validEndpoints.includes(endpoint)) {
      return res.status(400).json({ error: 'Invalid endpoint: ' + endpoint });
    }

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    const apiKey = process.env.SERPER_API_KEY || 'a1239b0bd9682b2d0ee19956ba7c8c2cdcf51f62';

    const response = await fetch('https://google.serper.dev/' + endpoint, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: query,
        gl: 'dk',
        hl: 'da',
        location: 'Denmark',
        num: 10
      })
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Serper API error: ' + response.status });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Serper proxy error:', error);
    return res.status(500).json({ error: error.message });
  }
}
