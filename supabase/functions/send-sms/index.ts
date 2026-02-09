import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createRequestLogger, EdgeLogger } from "../_shared/logger.ts"
import { getCorsHeaders, handleCorsPreflightResponse } from "../_shared/cors.ts"
import { checkRateLimit, getClientIP } from "../_shared/rate-limit.ts"

const SMS_RATE_LIMIT = 5 // max SMS sends per IP per minute

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  const log = createRequestLogger(req, { module: 'send-sms', channel: 'sms' })

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightResponse(req)
  }

  // Rate limit by IP
  const clientIP = getClientIP(req)
  const { allowed, retryAfterMs } = checkRateLimit(`sms:${clientIP}`, SMS_RATE_LIMIT)
  if (!allowed) {
    log.warn({
      event: 'channel.sms.rate_limited',
      client_ip: clientIP,
      retry_after_ms: retryAfterMs,
    })
    return new Response(
      JSON.stringify({ error: 'Too many requests. Try again later.' }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil(retryAfterMs / 1000)),
        },
      }
    )
  }

  const startTime = Date.now()

  try {
    const { to, message, sender, apiKey, restaurantId, orderId } = await req.json()

    // Enrich logger context with request data
    const enrichedLog = log.child({
      restaurantId: restaurantId,
      orderId: orderId
    })

    if (!to || !message) {
      enrichedLog.warn({
        event: 'channel.sms.validation_failed',
        error_reason: 'Missing required fields',
        has_to: !!to,
        has_message: !!message
      })
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const inmobileApiKey = apiKey || Deno.env.get('INMOBILE_API_KEY')

    if (!inmobileApiKey) {
      enrichedLog.error({
        event: 'channel.sms.config_error',
        error_reason: 'InMobile API key not configured'
      })
      return new Response(
        JSON.stringify({ error: 'InMobile API key not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format phone number: remove spaces, keep + prefix, ensure country code
    let phoneNumber = to.replace(/\s/g, '')
    if (phoneNumber.startsWith('+')) {
      phoneNumber = phoneNumber.slice(1) // Remove + for API
    }
    if (!phoneNumber.startsWith('45') && phoneNumber.length === 8) {
      phoneNumber = '45' + phoneNumber
    }

    // InMobile V4 API - uses HTTP Basic Auth with empty username and API key as password
    const basicAuth = btoa(':' + inmobileApiKey)

    // InMobile requires numeric sender (shortcode)
    const senderNumber = sender || Deno.env.get('INMOBILE_SENDER') || '54540109'

    const requestBody = {
      messages: [{
        to: phoneNumber,
        text: message,
        from: senderNumber,
        respectBlacklist: true
      }]
    }

    enrichedLog.info({
      event: 'channel.sms.sending',
      to: phoneNumber,
      sender: senderNumber,
      message_length: message.length,
      provider: 'inmobile'
    })

    const response = await fetch('https://api.inmobile.com/v4/sms/outgoing', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const result = await response.json()
    const duration = Date.now() - startTime

    // Check for successful response
    if (response.ok && result.results && result.results.length > 0 && result.results[0].messageId) {
      const messageId = result.results[0].messageId

      enrichedLog.info({
        event: 'channel.sms.sent',
        message_sid: messageId,
        to: phoneNumber,
        provider: 'inmobile',
        duration_ms: duration
      })

      return new Response(
        JSON.stringify({ success: true, sid: messageId, provider: 'inmobile' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      const errorMsg = result.errorMessage || result.results?.[0]?.errorMessage || 'Failed to send SMS'
      const errorCode = result.results?.[0]?.errorCode || response.status

      enrichedLog.error({
        event: 'channel.sms.send_failed',
        to: phoneNumber,
        provider: 'inmobile',
        error_code: errorCode,
        error_reason: errorMsg,
        duration_ms: duration
      })

      return new Response(
        JSON.stringify({ error: errorMsg, details: result }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    const duration = Date.now() - startTime
    log.error({
      event: 'channel.sms.error',
      error_reason: error.message,
      stack: error.stack,
      duration_ms: duration
    })
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
