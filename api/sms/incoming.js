import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  // Allow GET for testing
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'Webhook is running',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variables
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = req.body;

    console.log('Incoming SMS webhook:', JSON.stringify(body));

    // Parse Twilio format
    let phone = body.msisdn || body.sender || body.from || '';
    let content = body.message || body.text || body.body || '';
    let receiver = body.receiver || body.to || '';

    // Normalize phone to E.164
    phone = phone.toString().replace(/\D/g, '');
    if (phone && !phone.startsWith('45') && phone.length === 8) {
      phone = '45' + phone;
    }
    if (phone && !phone.startsWith('+')) {
      phone = '+' + phone;
    }

    if (!phone || !content) {
      console.log('Missing phone or content');
      return res.status(200).json({ status: 'ignored', reason: 'missing data' });
    }

    // Save to Supabase
    const { data, error } = await supabase
      .from('messages')
      .insert({
        phone: phone,
        content: content,
        direction: 'incoming',
        created_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(200).json({ status: 'error', message: error.message });
    }

    console.log('Message saved:', data);
    return res.status(200).json({ status: 'success', id: data[0]?.id });

  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(200).json({ status: 'error', message: err.message });
  }
}
