import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, message, sender, apiToken } = await req.json()

    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use provided credentials or environment variables
    const gatewayApiToken = apiToken || Deno.env.get('GATEWAYAPI_TOKEN')
    const senderName = sender || Deno.env.get('GATEWAYAPI_SENDER') || 'OrderFlow'

    if (!gatewayApiToken) {
      return new Response(
        JSON.stringify({ error: 'GatewayAPI token not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format phone number - GatewayAPI expects MSISDN (without + sign)
    let msisdn = to.replace(/[\s\-\(\)]/g, '')
    if (msisdn.startsWith('+')) {
      msisdn = msisdn.substring(1)
    }
    // Assume Danish number if no country code
    if (msisdn.length === 8) {
      msisdn = '45' + msisdn
    }

    // Create Basic Auth header for GatewayAPI (token:)
    const basicAuth = btoa(`${gatewayApiToken}:`)

    // Build request body for GatewayAPI
    const gatewayBody = {
      sender: senderName,
      message: message,
      recipients: [
        { msisdn: parseInt(msisdn) }
      ]
    }

    console.log('Sending SMS via GatewayAPI:', {
      to: msisdn,
      sender: senderName,
      bodyLength: message.length
    })

    const response = await fetch('https://gatewayapi.com/rest/mtsms', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(gatewayBody)
    })

    const result = await response.json()

    console.log('GatewayAPI response:', JSON.stringify(result))

    if (response.ok && result.ids) {
      return new Response(
        JSON.stringify({
          success: true,
          ids: result.ids,
          usage: result.usage
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({
          error: result.message || result.error || 'Failed to send SMS',
          code: result.code,
          details: result
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Send SMS GatewayAPI error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
