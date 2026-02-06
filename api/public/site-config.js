import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY; // Use anon key for public access

/**
 * Public Site Config API
 * GET /api/public/site-config
 *
 * Returns site configuration based on Host header
 * Used by customer-facing websites to load tenant data
 *
 * Query params:
 * - host: Override host header (for testing)
 *
 * Response:
 * {
 *   tenant: { id, subdomain, template_id },
 *   config: { logo_url, colors, etc. },
 *   menu: [ { category, items } ],
 *   restaurant: { name, address, phone }
 * }
 */
export default async function handler(req, res) {
  // CORS headers for cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variables
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get host from query param (for testing) or header
    const host = req.query.host || req.headers.host || '';

    if (!host) {
      return res.status(400).json({ error: 'Missing host header' });
    }

    // Extract subdomain from host
    // Examples:
    // - mario-pizza.orderflow.dk -> mario-pizza
    // - bestil.kunde.dk -> full domain (custom)
    // - localhost:3000 -> localhost (dev)

    let subdomain = '';
    let customDomain = null;

    // Check if it's a known platform domain
    const platformDomains = ['orderflow.dk', 'orderflow.local', 'localhost'];
    const isPlatformDomain = platformDomains.some(d => host.includes(d));

    if (isPlatformDomain) {
      // Extract subdomain
      subdomain = host.split('.')[0].split(':')[0]; // Handle port numbers
    } else {
      // Treat as custom domain
      customDomain = host.split(':')[0]; // Remove port if present
    }

    // Try to find site by custom domain first, then by subdomain
    let siteData = null;

    if (customDomain) {
      const { data: customSite } = await supabase
        .from('tenant_sites')
        .select(`
          id,
          tenant_id,
          subdomain,
          template_id,
          custom_domain,
          status,
          settings
        `)
        .eq('custom_domain', customDomain)
        .eq('status', 'active')
        .single();

      siteData = customSite;
    }

    if (!siteData && subdomain) {
      const { data: subdomainSite } = await supabase
        .from('tenant_sites')
        .select(`
          id,
          tenant_id,
          subdomain,
          template_id,
          custom_domain,
          status,
          settings
        `)
        .eq('subdomain', subdomain)
        .eq('status', 'active')
        .single();

      siteData = subdomainSite;
    }

    if (!siteData) {
      return res.status(404).json({
        error: 'Site not found',
        host,
        subdomain,
        customDomain
      });
    }

    // Get site config
    const { data: configData } = await supabase
      .from('site_configs')
      .select('*')
      .eq('tenant_id', siteData.tenant_id)
      .single();

    // Get restaurant info
    const { data: restaurantData } = await supabase
      .from('restaurants')
      .select(`
        id,
        name,
        address,
        phone,
        email,
        description,
        logo_url,
        opening_hours,
        delivery_enabled,
        pickup_enabled,
        minimum_order_amount,
        delivery_fee
      `)
      .eq('id', siteData.tenant_id)
      .single();

    // Get menu (using the function we created in migration)
    const { data: menuData } = await supabase
      .rpc('get_site_menu', { p_tenant_id: siteData.tenant_id });

    // Build response
    const response = {
      tenant: {
        id: siteData.tenant_id,
        subdomain: siteData.subdomain,
        template_id: siteData.template_id,
        custom_domain: siteData.custom_domain
      },
      config: configData || {
        // Defaults if no config exists
        primary_color: '#6366f1',
        secondary_color: '#8b5cf6',
        font_family: 'Inter'
      },
      restaurant: restaurantData || {},
      menu: menuData || [],
      features: configData?.features || {
        ordering: true,
        reservations: false,
        loyalty: false
      }
    };

    // Cache for 5 minutes (CDN/browser)
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    return res.status(200).json(response);

  } catch (err) {
    console.error('Site config API error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
