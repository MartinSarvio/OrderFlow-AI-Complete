import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY;

const DEFAULT_ADMIN_EMAILS = ['martinsarvio@hotmail.com'];

function normalizeEmail(value = '') {
  return String(value || '').trim().toLowerCase();
}

function isDuplicateUserError(message = '') {
  return /already registered|already exists|duplicate|exists/i.test(String(message));
}

function parseAdminEmails() {
  const raw = String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
  return Array.from(new Set([...DEFAULT_ADMIN_EMAILS, ...raw]));
}

function isValidEmail(email = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

function sanitizeRedirectTo(value, req) {
  const fallback = `${getBaseUrl(req)}/setup-password.html`;
  if (!value) return fallback;

  try {
    const parsed = new URL(String(value));
    const allowedOrigin = getBaseUrl(req);
    if (parsed.origin !== allowedOrigin) return fallback;
    return parsed.toString();
  } catch {
    return fallback;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Supabase server configuration is missing' });
  }

  const authHeader = String(req.headers.authorization || '');
  const accessToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : '';

  if (!accessToken) {
    return res.status(401).json({ error: 'Missing access token' });
  }

  const email = normalizeEmail(req.body?.email);
  const contactName = String(req.body?.contactName || '').trim();
  const restaurantName = String(req.body?.restaurantName || '').trim();
  const restaurantId = String(req.body?.restaurantId || '').trim();
  const redirectTo = sanitizeRedirectTo(req.body?.redirectTo, req);

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  try {
    const { data: requesterData, error: requesterError } = await supabaseAdmin.auth.getUser(accessToken);
    if (requesterError || !requesterData?.user?.id) {
      return res.status(401).json({ error: 'Invalid session token' });
    }

    const requester = requesterData.user;
    const requesterEmail = normalizeEmail(requester.email);

    let isAdmin = parseAdminEmails().includes(requesterEmail);
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requester.id)
      .maybeSingle();

    if (roleData?.role === 'admin') {
      isAdmin = true;
    }

    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin role required' });
    }

    const inviteResult = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        full_name: contactName,
        restaurant_name: restaurantName,
        restaurant_id: restaurantId
      }
    });

    if (inviteResult.error) {
      if (!isDuplicateUserError(inviteResult.error.message)) {
        return res.status(400).json({ error: inviteResult.error.message || 'Failed to invite user' });
      }

      const resetResult = await supabaseAdmin.auth.resetPasswordForEmail(email, { redirectTo });
      if (resetResult.error) {
        return res.status(400).json({ error: resetResult.error.message || 'Failed to send reset link' });
      }

      return res.status(200).json({ status: 'reset_link_sent_existing_user' });
    }

    const invitedUserId = inviteResult.data?.user?.id || null;

    if (invitedUserId) {
      const { error: roleUpsertError } = await supabaseAdmin
        .from('user_roles')
        .upsert(
          {
            user_id: invitedUserId,
            role: 'customer',
            requires_2fa: false
          },
          { onConflict: 'user_id' }
        );

      if (roleUpsertError) {
        console.warn('[provision-customer] role upsert failed:', roleUpsertError.message);
      }
    }

    return res.status(200).json({
      status: 'invite_sent',
      invitedUserId
    });
  } catch (error) {
    console.error('[provision-customer] error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
