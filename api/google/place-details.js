// api/google/place-details.js
// Vercel Serverless Function for Google Places Details API

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { place_id } = req.query;

  if (!place_id) {
    return res.status(400).json({ error: 'place_id parameter is required' });
  }

  try {
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyBKipBk7jFnAH-3kQUqqoSu5pDZTQRlOPo';

    const fields = [
      'name', 'rating', 'user_ratings_total', 'formatted_address',
      'formatted_phone_number', 'website', 'opening_hours',
      'geometry', 'photos', 'reviews', 'types', 'business_status'
    ].join(',');

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(place_id)}&key=${GOOGLE_API_KEY}&fields=${fields}&language=da`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return res.status(200).json({ result: null, status: data.status });
    }

    return res.status(200).json({ result: data.result, status: 'OK' });

  } catch (error) {
    console.error('Google Places API error:', error);
    return res.status(200).json({ result: null, status: 'ERROR' });
  }
}
