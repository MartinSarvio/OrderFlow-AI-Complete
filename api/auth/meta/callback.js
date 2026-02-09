import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;

/**
 * Meta OAuth Callback Handler
 * POST /api/auth/meta/callback
 *
 * Exchanges authorization code for long-lived access token.
 * Flow:
 * 1. Exchange code for short-lived token (1 hour)
 * 2. Exchange short-lived for long-lived token (60 days)
 * 3. Get page list and identify connected page
 * 4. Subscribe page to webhook events
 * 5. Store integration in Supabase
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, channel, state } = req.body;

    if (!code || !channel) {
      return res.status(400).json({ error: 'Missing code or channel' });
    }

    if (!META_APP_ID || !META_APP_SECRET) {
      return res.status(500).json({ error: 'Meta app credentials not configured' });
    }

    const redirectUri = `${getBaseUrl(req)}/api/auth/meta/redirect.html`;

    // Step 1: Exchange authorization code for short-lived token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${META_APP_SECRET}&code=${code}`;

    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('[Meta OAuth] Token exchange error:', tokenData.error);
      return res.status(400).json({ error: tokenData.error.message || 'Token exchange failed' });
    }

    const shortLivedToken = tokenData.access_token;

    // Step 2: Exchange for long-lived token (60 days)
    const longLivedUrl = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortLivedToken}`;

    const longLivedResponse = await fetch(longLivedUrl);
    const longLivedData = await longLivedResponse.json();

    if (longLivedData.error) {
      console.error('[Meta OAuth] Long-lived token error:', longLivedData.error);
      return res.status(400).json({ error: 'Failed to get long-lived token' });
    }

    const accessToken = longLivedData.access_token;
    const expiresIn = longLivedData.expires_in || 5184000; // 60 days default

    // Step 3: Get user's pages
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`;
    const pagesResponse = await fetch(pagesUrl);
    const pagesData = await pagesResponse.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      return res.status(400).json({ error: 'No Facebook Pages found. Ensure your account manages at least one page.' });
    }

    // Use the first page (or let user choose in a future update)
    const page = pagesData.data[0];
    const pageId = page.id;
    const pageName = page.name;
    const pageAccessToken = page.access_token;

    // Step 4: For Instagram, get the Instagram Business Account ID
    let instagramAccountId = null;
    if (channel === 'instagram') {
      const igUrl = `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`;
      const igResponse = await fetch(igUrl);
      const igData = await igResponse.json();

      if (igData.instagram_business_account) {
        instagramAccountId = igData.instagram_business_account.id;
      }
    }

    // Step 5: Subscribe page to webhooks (Messenger events)
    const subscribeUrl = `https://graph.facebook.com/v18.0/${pageId}/subscribed_apps?subscribed_fields=messages,messaging_postbacks,messaging_optins&access_token=${pageAccessToken}`;
    await fetch(subscribeUrl, { method: 'POST' });

    // Step 6: Store in Supabase (if configured)
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase.from('social_integrations').upsert({
        platform: channel,
        platform_id: channel === 'instagram' ? instagramAccountId : pageId,
        page_id: pageId,
        page_name: pageName,
        access_token: pageAccessToken,
        user_access_token: accessToken,
        status: 'connected',
        connected_at: new Date().toISOString(),
        token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString()
      }, { onConflict: 'platform' });
    }

    return res.status(200).json({
      success: true,
      pageId: pageId,
      pageName: pageName,
      instagramAccountId: instagramAccountId,
      channel: channel
    });

  } catch (err) {
    console.error('[Meta OAuth] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function getBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}
