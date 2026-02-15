import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE ||
  process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { restaurantData, userId } = req.body;

    if (!restaurantData || !userId) {
      return res.status(400).json({ error: 'Missing restaurantData or userId' });
    }

    if (!restaurantData.name || !restaurantData.name.trim()) {
      return res.status(400).json({ error: 'Restaurant name is required' });
    }

    // Validate userId is a UUID
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Verify the user exists in Supabase auth (prevents arbitrary user_id injection)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !userData?.user) {
      // Also try the Authorization header JWT to identify the caller
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const { data: jwtUser } = await supabase.auth.getUser(token);
        if (jwtUser?.user?.id) {
          // Use the JWT user's ID instead
          restaurantData.user_id = jwtUser.user.id;
        } else {
          return res.status(401).json({ error: 'User not found or invalid token' });
        }
      } else {
        return res.status(401).json({ error: 'User not found' });
      }
    } else {
      restaurantData.user_id = userId;
    }

    // Clean up data
    delete restaurantData.id; // Let database generate UUID
    restaurantData.name = restaurantData.name.trim();

    // Insert using service role (bypasses RLS)
    const { data, error } = await supabase
      .from('restaurants')
      .insert([restaurantData])
      .select()
      .single();

    if (error) {
      console.error('Restaurant creation error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ success: true, restaurant: data });
  } catch (err) {
    console.error('Unexpected error in /api/restaurants/create:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
