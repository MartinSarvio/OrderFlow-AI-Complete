import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Normalize phone number to E.164 format
function normalizePhoneNumber(phone) {
  if (!phone) return null;

  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Handle different formats
  if (cleaned.startsWith('+')) {
    return cleaned; // Already E.164
  } else if (cleaned.startsWith('00')) {
    return '+' + cleaned.slice(2); // 0045... -> +45...
  } else if (cleaned.startsWith('45') && cleaned.length === 10) {
    return '+' + cleaned; // 4512345678 -> +4512345678
  } else if (cleaned.length === 8) {
    return '+45' + cleaned; // Danish number without country code
  } else if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return '+45' + cleaned.slice(1); // 012345678 -> +4512345678
  }

  // Default: assume it needs +45 prefix if 8 digits
  if (cleaned.length === 8) {
    return '+45' + cleaned;
  }

  return '+' + cleaned;
}

export default async function handler(req, res) {
  // Health check
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      message: 'OrderFlow SMS Webhook running',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    console.log('Incoming webhook payload:', JSON.stringify(body));

    // Extract phone and message - GatewayAPI format only
    let phone, message;

    // GatewayAPI format
    if (body.msisdn) {
      phone = body.msisdn;
      message = body.message || body.text || body.body;
    }
    // Generic format fallback
    else if (body.phone || body.from || body.sender) {
      phone = body.phone || body.from || body.sender;
      message = body.message || body.text || body.body || body.content;
    }

    if (!phone || !message) {
      console.error('Missing phone or message in payload:', body);
      return res.status(400).json({
        error: 'Missing required fields',
        received: { phone: !!phone, message: !!message }
      });
    }

    // Normalize phone number to E.164
    const normalizedPhone = normalizePhoneNumber(phone);
    console.log('SMS fra ' + phone + ' (normalized: ' + normalizedPhone + '): ' + message);

    // Save to Supabase messages table
    const { data, error } = await supabase
      .from('messages')
      .insert({
        phone: normalizedPhone,
        content: message,
        direction: 'inbound',
        raw_phone: phone,
        provider_data: body,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(200).json({
        success: false,
        error: 'Database error',
        details: error.message
      });
    }

    console.log('Message saved to Supabase:', data.id);

    return res.status(200).json({
      success: true,
      id: data.id,
      phone: normalizedPhone,
      message: message
    });

  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(200).json({
      success: false,
      error: err.message
    });
  }
}
