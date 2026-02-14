// Vercel Serverless Function — Verify Stripe Checkout Session
// Returns payment status and metadata for post-payment flow

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: 'session_id is required' });

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) return res.status(500).json({ error: 'Stripe er ikke konfigureret. Tilføj STRIPE_SECRET_KEY i Vercel Dashboard → Settings → Environment Variables.' });

    const response = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(session_id)}`,
      {
        headers: { 'Authorization': `Bearer ${stripeSecretKey}` },
      }
    );

    const session = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ paid: false, error: session.error?.message || 'Invalid session' });
    }

    return res.status(200).json({
      paid: session.payment_status === 'paid',
      businessName: session.metadata?.business_name || null,
      customerEmail: session.customer_details?.email || null,
    });
  } catch (error) {
    console.error('Verify session error:', error);
    return res.status(500).json({ paid: false, error: error.message });
  }
}
