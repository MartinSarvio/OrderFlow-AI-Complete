import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE ||
  process.env.SUPABASE_SERVICE_KEY;

function json(res, status, payload) {
  res.status(status).json(payload);
}

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function parseNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9,.-]/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

async function resolveTenant(supabase, host) {
  if (!host) return null;

  const platformDomains = ['orderflow.dk', 'orderflow.local', 'localhost'];
  const isPlatformDomain = platformDomains.some((d) => host.includes(d));

  let subdomain = '';
  let customDomain = null;

  if (isPlatformDomain) {
    subdomain = host.split('.')[0].split(':')[0];
  } else {
    customDomain = host.split(':')[0];
  }

  if (customDomain) {
    const { data: customSite } = await supabase
      .from('tenant_sites')
      .select('id, tenant_id, subdomain, template_id, custom_domain, status, settings')
      .eq('custom_domain', customDomain)
      .eq('status', 'active')
      .single();
    if (customSite) return customSite;
  }

  if (subdomain) {
    const { data: subdomainSite } = await supabase
      .from('tenant_sites')
      .select('id, tenant_id, subdomain, template_id, custom_domain, status, settings')
      .eq('subdomain', subdomain)
      .eq('status', 'active')
      .single();
    if (subdomainSite) return subdomainSite;
  }

  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    return json(res, 500, { error: 'Server configuration error' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    const host = req.headers.host || '';
    const siteData = await resolveTenant(supabase, host);

    if (!siteData?.tenant_id) {
      return json(res, 404, { error: 'Site not found', host });
    }

    let body = req.body || {};
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return json(res, 400, { error: 'Invalid JSON payload' });
      }
    }
    const items = Array.isArray(body.items) ? body.items : [];
    const customer = body.customer || {};
    const fulfillment = body.fulfillment || {};

    if (!items.length) {
      return json(res, 400, { error: 'Missing items' });
    }

    if (!customer?.name || !customer?.phone) {
      return json(res, 400, { error: 'Missing customer name or phone' });
    }

    if (!fulfillment?.type) {
      return json(res, 400, { error: 'Missing fulfillment type' });
    }

    const sanitizedItems = items.map((item) => {
      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      const unitPrice = parseNumber(item.unit_price);
      return {
        name: item.name || 'Vare',
        quantity,
        unit_price: unitPrice,
        notes: item.notes || '',
        modifiers: item.modifiers || []
      };
    });

    const subtotal = round2(
      sanitizedItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
    );
    const tax = round2(subtotal * 0.25);

    const { data: configData } = await supabase
      .from('site_configs')
      .select('delivery_fee, free_delivery_threshold, minimum_order_amount')
      .eq('tenant_id', siteData.tenant_id)
      .single();

    const { data: restaurantData } = await supabase
      .from('restaurants')
      .select('delivery_fee, minimum_order_amount')
      .eq('id', siteData.tenant_id)
      .single();

    let deliveryFee = 0;
    if (fulfillment.type === 'delivery') {
      deliveryFee = parseNumber(configData?.delivery_fee ?? restaurantData?.delivery_fee ?? 0);
    }

    const discount = parseNumber(body.discount || 0);
    const tip = parseNumber(body.tip || 0);
    const total = round2(subtotal + tax + deliveryFee - discount + tip);

    const address = fulfillment.address || {};
    const deliveryAddress = fulfillment.type === 'delivery'
      ? {
          street: address.street || '',
          city: address.city || '',
          postal_code: address.postalCode || address.postal_code || '',
          floor: address.floor || '',
          door_code: address.doorCode || address.door_code || '',
          instructions: address.notes || address.instructions || ''
        }
      : null;

    const { data: customerId, error: customerError } = await supabase.rpc('get_or_create_customer', {
      p_tenant_id: siteData.tenant_id,
      p_phone: customer.phone,
      p_email: customer.email || null,
      p_name: customer.name,
      p_instagram_id: null,
      p_facebook_id: null
    });

    if (customerError) {
      console.error('Customer creation error:', customerError);
      return json(res, 500, { error: 'Failed to create customer' });
    }

    const { data: order, error: orderError } = await supabase
      .from('unified_orders')
      .insert({
        tenant_id: siteData.tenant_id,
        source_channel: 'web',
        customer_id: customerId,
        line_items: sanitizedItems,
        subtotal,
        tax_amount: tax,
        delivery_fee: deliveryFee,
        discount_amount: discount,
        tip_amount: tip,
        total,
        currency: 'DKK',
        fulfillment_type: fulfillment.type,
        delivery_address: deliveryAddress,
        delivery_notes: address.notes || null,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_email: customer.email || null,
        payment_method: body.payment_method || 'card',
        payment_status: 'pending',
        status: 'pending'
      })
      .select('id, order_number, status')
      .single();

    if (orderError) {
      console.error('Order insert error:', orderError);
      return json(res, 500, { error: 'Failed to create order' });
    }

    return json(res, 200, {
      order_id: order.id,
      order_number: order.order_number,
      status: order.status
    });
  } catch (err) {
    console.error('Order API error:', err);
    return json(res, 500, { error: 'Internal server error', message: err.message });
  }
}
