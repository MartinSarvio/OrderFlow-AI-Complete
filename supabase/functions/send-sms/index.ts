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
    const { to, message, sender, token } = await req.json()

    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use provided token or environment variable
    const apiToken = token || Deno.env.get('GATEWAYAPI_TOKEN')

    if (!apiToken) {
      return new Response(
        JSON.stringify({ error: 'GatewayAPI token not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format phone number (remove spaces, +, ensure 45 prefix)
    let phoneNumber = to.replace(/\s/g, '').replace('+', '')
    if (!phoneNumber.startsWith('45')) {
      phoneNumber = '45' + phoneNumber
    }

    // Send via GatewayAPI
    const response = await fetch('https://gatewayapi.com/rest/mtsms', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message,
        sender: sender || 'OrderFlow',
        recipients: [{ msisdn: parseInt(phoneNumber) }]
      })
    })

    const result = await response.json()

    if (result.ids && result.ids.length > 0) {
      return new Response(
        JSON.stringify({
          success: true,
          sid: result.ids[0],
          cost: result.usage?.total_cost
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ error: result.message || 'Failed to send SMS' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
