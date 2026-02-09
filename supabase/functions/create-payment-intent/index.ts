import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getCorsHeaders, handleCorsPreflightResponse } from "../_shared/cors.ts"
import { verifyAuth } from "../_shared/auth.ts"
import { checkRateLimit, getClientIP } from "../_shared/rate-limit.ts"

const PAYMENT_RATE_LIMIT = 10 // max payment intents per IP per minute

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightResponse(req)
  }

  // Rate limit
  const clientIP = getClientIP(req)
  const { allowed } = checkRateLimit(`payment:${clientIP}`, PAYMENT_RATE_LIMIT)
  if (!allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Try again later.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Verify authentication
  const auth = await verifyAuth(req)
  if (!auth) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe secret key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { amount, currency, metadata } = await req.json()

    // Validate required fields
    if (!amount || amount < 100) {
      return new Response(
        JSON.stringify({ error: 'Amount must be at least 100 (1.00 DKK in øre)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build PaymentIntent params
    const params = new URLSearchParams()
    params.append('amount', String(Math.round(amount)))
    params.append('currency', currency || 'dkk')
    params.append('automatic_payment_methods[enabled]', 'true')

    // Add metadata if provided
    if (metadata) {
      for (const [key, value] of Object.entries(metadata)) {
        if (value != null) {
          params.append(`metadata[${key}]`, String(value))
        }
      }
    }

    // Create PaymentIntent via Stripe API
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Stripe error:', result)
      return new Response(
        JSON.stringify({ error: result.error?.message || 'Failed to create payment intent' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        clientSecret: result.client_secret,
        paymentIntentId: result.id,
        amount: result.amount,
        currency: result.currency,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Payment intent error:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
