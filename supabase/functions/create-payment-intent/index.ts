import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getCorsHeaders, handleCorsPreflightResponse } from "../_shared/cors.ts"

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightResponse(req)
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
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
