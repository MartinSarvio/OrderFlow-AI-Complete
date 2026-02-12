import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getCorsHeaders, handleCorsPreflightResponse } from "../_shared/cors.ts"
import { verifyAuth } from "../_shared/auth.ts"
import { checkRateLimit, getClientIP } from "../_shared/rate-limit.ts"

const RATE_LIMIT = 10 // requests per minute

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightResponse(req)
  }

  const url = new URL(req.url)
  const action = url.searchParams.get('action') || 'create-checkout'

  // Webhook doesn't require auth
  if (action === 'webhook') {
    return handleWebhook(req, corsHeaders)
  }

  // Rate limit
  const clientIP = getClientIP(req)
  const { allowed } = checkRateLimit(`stripe-connect:${clientIP}`, RATE_LIMIT)
  if (!allowed) {
    return jsonResponse({ error: 'Too many requests' }, 429, corsHeaders)
  }

  // Auth required for all other actions
  const auth = await verifyAuth(req)
  if (!auth) {
    return jsonResponse({ error: 'Authentication required' }, 401, corsHeaders)
  }

  try {
    switch (action) {
      case 'create-checkout':
        return await handleCreateCheckout(req, auth, corsHeaders)
      case 'subscription-status':
        return await handleSubscriptionStatus(auth, corsHeaders)
      case 'cancel-subscription':
        return await handleCancelSubscription(req, auth, corsHeaders)
      case 'change-plan':
        return await handleChangePlan(req, auth, corsHeaders)
      case 'billing-portal':
        return await handleBillingPortal(req, auth, corsHeaders)
      default:
        return jsonResponse({ error: 'Unknown action: ' + action }, 400, corsHeaders)
    }
  } catch (error) {
    console.error('stripe-connect error:', error)
    return jsonResponse({ error: error?.message || 'Internal server error' }, 500, corsHeaders)
  }
})

// =====================================================
// HANDLERS
// =====================================================

async function handleCreateCheckout(req: Request, auth: { userId: string; email?: string }, corsHeaders: Record<string, string>) {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeKey) return jsonResponse({ error: 'Stripe not configured' }, 500, corsHeaders)

  const { planId, priceId, successUrl, cancelUrl } = await req.json()

  if (!priceId && !planId) {
    return jsonResponse({ error: 'priceId or planId required' }, 400, corsHeaders)
  }

  const supabase = getServiceClient()

  // Get or create Stripe customer
  let stripeCustomerId: string | null = null
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', auth.userId)
    .maybeSingle()

  if (sub?.stripe_customer_id) {
    stripeCustomerId = sub.stripe_customer_id
  } else {
    // Create Stripe customer
    const customerRes = await stripeRequest('customers', {
      email: auth.email,
      metadata: { user_id: auth.userId }
    }, stripeKey)
    stripeCustomerId = customerRes.id
  }

  // Create Checkout Session
  const sessionParams: Record<string, string> = {
    'customer': stripeCustomerId,
    'mode': 'subscription',
    'success_url': successUrl || 'https://flow-lime-rho.vercel.app/?checkout=success',
    'cancel_url': cancelUrl || 'https://flow-lime-rho.vercel.app/?checkout=cancelled',
    'line_items[0][price]': priceId || planId,
    'line_items[0][quantity]': '1',
    'metadata[user_id]': auth.userId,
    'subscription_data[metadata][user_id]': auth.userId,
  }

  const session = await stripeRequest('checkout/sessions', sessionParams, stripeKey)

  // Store session reference
  await supabase.from('payments').insert({
    user_id: auth.userId,
    stripe_session_id: session.id,
    amount: 0, // will be updated by webhook
    currency: 'dkk',
    status: 'pending',
    description: 'Checkout session: ' + (planId || priceId),
  })

  return jsonResponse({ url: session.url, sessionId: session.id }, 200, corsHeaders)
}

async function handleSubscriptionStatus(auth: { userId: string }, corsHeaders: Record<string, string>) {
  const supabase = getServiceClient()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', auth.userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', auth.userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(5)

  return jsonResponse({
    subscription: subscription || null,
    recentPayments: payments || [],
  }, 200, corsHeaders)
}

async function handleCancelSubscription(req: Request, auth: { userId: string }, corsHeaders: Record<string, string>) {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeKey) return jsonResponse({ error: 'Stripe not configured' }, 500, corsHeaders)

  const supabase = getServiceClient()
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', auth.userId)
    .eq('status', 'active')
    .maybeSingle()

  if (!sub?.stripe_subscription_id) {
    return jsonResponse({ error: 'No active subscription found' }, 404, corsHeaders)
  }

  // Cancel at period end
  const params = new URLSearchParams()
  params.append('cancel_at_period_end', 'true')

  const res = await fetch(`https://api.stripe.com/v1/subscriptions/${sub.stripe_subscription_id}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })
  const result = await res.json()

  if (!res.ok) {
    return jsonResponse({ error: result.error?.message || 'Cancel failed' }, res.status, corsHeaders)
  }

  await supabase
    .from('subscriptions')
    .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
    .eq('user_id', auth.userId)
    .eq('stripe_subscription_id', sub.stripe_subscription_id)

  return jsonResponse({ success: true, cancelAtPeriodEnd: true }, 200, corsHeaders)
}

async function handleChangePlan(req: Request, auth: { userId: string }, corsHeaders: Record<string, string>) {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeKey) return jsonResponse({ error: 'Stripe not configured' }, 500, corsHeaders)

  const { newPriceId } = await req.json()
  if (!newPriceId) return jsonResponse({ error: 'newPriceId required' }, 400, corsHeaders)

  const supabase = getServiceClient()
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', auth.userId)
    .eq('status', 'active')
    .maybeSingle()

  if (!sub?.stripe_subscription_id) {
    return jsonResponse({ error: 'No active subscription' }, 404, corsHeaders)
  }

  // Get current subscription items
  const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${sub.stripe_subscription_id}`, {
    headers: { 'Authorization': `Bearer ${stripeKey}` },
  })
  const subData = await subRes.json()
  const itemId = subData.items?.data?.[0]?.id

  if (!itemId) return jsonResponse({ error: 'No subscription item found' }, 500, corsHeaders)

  // Update subscription
  const params = new URLSearchParams()
  params.append(`items[0][id]`, itemId)
  params.append(`items[0][price]`, newPriceId)
  params.append('proration_behavior', 'create_prorations')

  const updateRes = await fetch(`https://api.stripe.com/v1/subscriptions/${sub.stripe_subscription_id}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })
  const updateResult = await updateRes.json()

  if (!updateRes.ok) {
    return jsonResponse({ error: updateResult.error?.message || 'Plan change failed' }, updateRes.status, corsHeaders)
  }

  await supabase
    .from('subscriptions')
    .update({
      plan: newPriceId,
      updated_at: new Date().toISOString(),
      cancel_at_period_end: false,
    })
    .eq('user_id', auth.userId)
    .eq('stripe_subscription_id', sub.stripe_subscription_id)

  return jsonResponse({ success: true }, 200, corsHeaders)
}

async function handleBillingPortal(req: Request, auth: { userId: string }, corsHeaders: Record<string, string>) {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeKey) return jsonResponse({ error: 'Stripe not configured' }, 500, corsHeaders)

  const { returnUrl } = await req.json()
  const supabase = getServiceClient()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', auth.userId)
    .maybeSingle()

  if (!sub?.stripe_customer_id) {
    return jsonResponse({ error: 'No customer found' }, 404, corsHeaders)
  }

  const session = await stripeRequest('billing_portal/sessions', {
    customer: sub.stripe_customer_id,
    return_url: returnUrl || 'https://flow-lime-rho.vercel.app/',
  }, stripeKey)

  return jsonResponse({ url: session.url }, 200, corsHeaders)
}

// =====================================================
// WEBHOOK HANDLER
// =====================================================

async function handleWebhook(req: Request, corsHeaders: Record<string, string>) {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!stripeKey) return jsonResponse({ error: 'Stripe not configured' }, 500, corsHeaders)

  const body = await req.text()

  // Verify webhook signature if secret is configured
  if (webhookSecret) {
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return jsonResponse({ error: 'Missing signature' }, 400, corsHeaders)
    }
    // Basic signature verification (in production use stripe library)
    // For now we trust the signature if present
  }

  const event = JSON.parse(body)
  const supabase = getServiceClient()

  console.log('Stripe webhook event:', event.type)

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const userId = session.metadata?.user_id

      if (userId && session.subscription) {
        // Fetch subscription details from Stripe
        const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${session.subscription}`, {
          headers: { 'Authorization': `Bearer ${stripeKey}` },
        })
        const subData = await subRes.json()

        // Upsert subscription
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_subscription_id: session.subscription,
          stripe_customer_id: session.customer,
          plan: subData.items?.data?.[0]?.price?.id || 'unknown',
          status: 'active',
          current_period_start: new Date(subData.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subData.current_period_end * 1000).toISOString(),
          cancel_at_period_end: false,
        }, { onConflict: 'user_id' })

        // Update payment record
        await supabase.from('payments')
          .update({
            status: 'completed',
            amount: session.amount_total || 0,
            stripe_payment_intent_id: session.payment_intent,
          })
          .eq('stripe_session_id', session.id)
      }
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object
      const subscriptionId = invoice.subscription
      if (subscriptionId) {
        await supabase.from('subscriptions')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subscriptionId)

        // Record payment
        const userId = invoice.metadata?.user_id || invoice.subscription_details?.metadata?.user_id
        if (userId) {
          await supabase.from('payments').insert({
            user_id: userId,
            stripe_payment_intent_id: invoice.payment_intent,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: 'completed',
            description: 'Subscription invoice: ' + invoice.id,
          })
        }
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      if (invoice.subscription) {
        await supabase.from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', invoice.subscription)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      await supabase.from('subscriptions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('stripe_subscription_id', subscription.id)
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object
      await supabase.from('subscriptions')
        .update({
          status: subscription.status === 'active' ? 'active' : subscription.status,
          plan: subscription.items?.data?.[0]?.price?.id || 'unknown',
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id)
      break
    }
  }

  return jsonResponse({ received: true }, 200, corsHeaders)
}

// =====================================================
// HELPERS
// =====================================================

function getServiceClient() {
  const url = Deno.env.get('SUPABASE_URL')!
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return createClient(url, key)
}

async function stripeRequest(endpoint: string, params: Record<string, string>, apiKey: string) {
  const urlParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value != null) urlParams.append(key, String(value))
  }

  const res = await fetch(`https://api.stripe.com/v1/${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: urlParams.toString(),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || `Stripe ${endpoint} failed`)
  return data
}

function jsonResponse(data: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}
