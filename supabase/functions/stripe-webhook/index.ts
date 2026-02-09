/**
 * Stripe Webhook Handler
 *
 * Receives Stripe webhook events and updates order/payment status.
 * Verifies webhook signatures to prevent spoofing.
 *
 * POST /functions/v1/stripe-webhook
 * Headers: Stripe-Signature (required)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Stripe webhook signature verification (manual HMAC since no Stripe SDK in Deno)
async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string
): Promise<boolean> {
  const parts = sigHeader.split(',').reduce((acc: Record<string, string>, part) => {
    const [key, value] = part.split('=')
    acc[key] = value
    return acc
  }, {})

  const timestamp = parts['t']
  const signature = parts['v1']

  if (!timestamp || !signature) return false

  // Check timestamp is within 5 minutes (300 seconds)
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - parseInt(timestamp)) > 300) return false

  // Compute expected signature
  const signedPayload = `${timestamp}.${payload}`
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload))
  const expectedSignature = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return expectedSignature === signature
}

serve(async (req) => {
  // Webhooks don't use CORS - Stripe sends directly
  const headers = { 'Content-Type': 'application/json' }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers,
    })
  }

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured')
    return new Response(JSON.stringify({ error: 'Webhook not configured' }), {
      status: 500,
      headers,
    })
  }

  const body = await req.text()
  const sigHeader = req.headers.get('Stripe-Signature') || ''

  // Verify signature
  const isValid = await verifyStripeSignature(body, sigHeader, webhookSecret)
  if (!isValid) {
    console.warn('Invalid Stripe webhook signature')
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers,
    })
  }

  const event = JSON.parse(body)

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        const orderId = paymentIntent.metadata?.order_id
        const restaurantId = paymentIntent.metadata?.restaurant_id

        if (orderId) {
          // Update order payment status
          await supabase
            .from('unified_orders')
            .update({
              payment_status: 'paid',
              payment_reference: paymentIntent.id,
              paid_at: new Date().toISOString(),
              status: 'confirmed',
            })
            .eq('id', orderId)

          // Log payment
          await supabase.from('payments').insert({
            order_id: orderId,
            restaurant_id: restaurantId,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency?.toUpperCase() || 'DKK',
            status: 'completed',
            provider: 'stripe',
            provider_transaction_id: paymentIntent.id,
            completed_at: new Date().toISOString(),
          })
        }

        console.log(`Payment succeeded: ${paymentIntent.id}`)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        const orderId = paymentIntent.metadata?.order_id
        const restaurantId = paymentIntent.metadata?.restaurant_id

        if (orderId) {
          await supabase
            .from('unified_orders')
            .update({
              payment_status: 'failed',
              payment_reference: paymentIntent.id,
            })
            .eq('id', orderId)

          await supabase.from('payments').insert({
            order_id: orderId,
            restaurant_id: restaurantId,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency?.toUpperCase() || 'DKK',
            status: 'failed',
            provider: 'stripe',
            provider_transaction_id: paymentIntent.id,
            failed_at: new Date().toISOString(),
          })
        }

        console.warn(`Payment failed: ${paymentIntent.id}`)
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object
        const paymentIntentId = charge.payment_intent

        if (paymentIntentId) {
          // Update payment record
          await supabase
            .from('payments')
            .update({
              status: charge.amount_refunded === charge.amount ? 'refunded' : 'partially_refunded',
              refunded_amount: charge.amount_refunded,
              refund_reason: charge.refunds?.data?.[0]?.reason || 'requested',
            })
            .eq('provider_transaction_id', paymentIntentId)

          // Update order
          await supabase
            .from('unified_orders')
            .update({
              payment_status: charge.amount_refunded === charge.amount ? 'refunded' : 'paid',
              status: charge.amount_refunded === charge.amount ? 'cancelled' : undefined,
            })
            .eq('payment_reference', paymentIntentId)
        }

        console.log(`Refund processed: ${charge.id}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Log webhook event
    await supabase.from('webhook_logs').insert({
      webhook_type: 'incoming',
      webhook_name: 'stripe',
      method: 'POST',
      request_body: { event_type: event.type, event_id: event.id },
      status: 'success',
      idempotency_key: event.id,
    }).catch(() => {})

    return new Response(JSON.stringify({ received: true }), { headers })
  } catch (error) {
    console.error('Stripe webhook error:', error)

    await supabase.from('webhook_logs').insert({
      webhook_type: 'incoming',
      webhook_name: 'stripe',
      request_body: { event_type: event.type, event_id: event.id },
      status: 'failed',
      error_message: error?.message || 'Unknown error',
      idempotency_key: event.id,
    }).catch(() => {})

    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500,
      headers,
    })
  }
})
