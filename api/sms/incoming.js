export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', message: 'OrderFlow SMS Webhook running' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { msisdn, message } = req.body;
  console.log(`📱 SMS fra ${msisdn}: ${message}`);

  return res.status(200).json({ success: true, from: msisdn, message });
}