// Vercel Serverless Function — Stripe Checkout Session for SEO Report
// Uses raw Stripe API (no npm dependency)

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return res.status(500).json({ 
        error: 'Stripe er ikke konfigureret. Tilføj STRIPE_SECRET_KEY som Environment Variable i Vercel Dashboard → Settings → Environment Variables. Brug din Stripe Secret Key (starter med sk_live_ eller sk_test_).' 
      });
    }

    const { businessName, returnUrl } = req.body;

    if (!returnUrl) {
      return res.status(400).json({ error: 'returnUrl is required' });
    }

    // Build Checkout Session params
    const separator = returnUrl.includes('?') ? '&' : '?';
    const successUrl = `${returnUrl}${separator}paid=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = returnUrl;

    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('line_items[0][price]', 'price_1Sycq8GbzQ9yWU8lgkWTtYN7');
    params.append('line_items[0][quantity]', '1');
    params.append('success_url', successUrl);
    params.append('cancel_url', cancelUrl);
    params.append('metadata[product]', 'seo_report');
    if (businessName) {
      params.append('metadata[business_name]', businessName);
    }

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Stripe Checkout error:', result);
      return res.status(response.status).json({
        error: result.error?.message || 'Failed to create checkout session',
      });
    }

    return res.status(200).json({ url: result.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    return res.status(500).json({ error: error.message });
  }
}
