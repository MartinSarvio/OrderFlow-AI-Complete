// api/places/search.js
// Vercel Serverless Function for Serper.dev Places Search

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { query } = req.query;

  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' });
  }

  try {
    const SERPER_API_KEY = process.env.SERPER_API_KEY || 'a1239b0bd9682b2d0ee19956ba7c8c2cdcf51f62';

    const response = await fetch('https://google.serper.dev/places', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
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

    const data = await response.json();

    // Map Serper results to expected format
    const results = (data.places || []).map(place => ({
      place_id: place.cid || `serper_${Date.now()}`,
      name: place.title,
      address: place.address || '',
      type: place.category || 'Virksomhed',
      rating: place.rating,
      reviews: place.ratingCount,
      phone: place.phoneNumber,
      website: place.website
    }));

    return res.status(200).json({ results });

  } catch (error) {
    console.error('Serper API error:', error);
    // Return empty results on error - NO fake data
    return res.status(200).json({ results: [] });
  }
}
