import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, message, sender, apiKey } = await req.json()

    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const inmobileApiKey = apiKey || Deno.env.get('INMOBILE_API_KEY')

    if (!inmobileApiKey) {
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
    // Format: Authorization: Basic base64(:apiKey)
    const basicAuth = btoa(':' + inmobileApiKey)

    const response = await fetch('https://api.inmobile.com/v4/sms/outgoing', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{
          to: phoneNumber,
          text: message,
          from: sender || Deno.env.get('INMOBILE_SENDER') || 'OrderFlow',
          respectBlacklist: true
        }]
      })
    })

    const result = await response.json()
    console.log('InMobile response:', JSON.stringify(result))

    // Check for successful response
    if (response.ok && result.results && result.results.length > 0 && result.results[0].messageId) {
      return new Response(
        JSON.stringify({ success: true, sid: result.results[0].messageId, provider: 'inmobile' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      const errorMsg = result.errorMessage || result.results?.[0]?.errorMessage || 'Failed to send SMS'
      return new Response(
        JSON.stringify({ error: errorMsg, details: result }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('InMobile error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
