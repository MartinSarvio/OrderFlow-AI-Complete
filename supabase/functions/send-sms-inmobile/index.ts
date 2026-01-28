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

    let phoneNumber = to.replace(/\s/g, '').replace('+', '')
    if (!phoneNumber.startsWith('45')) {
      phoneNumber = '45' + phoneNumber
    }

    const response = await fetch('https://api.inmobile.com/v4/sms/outgoing', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(inmobileApiKey + ':')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: [phoneNumber],
        text: message,
        from: sender || Deno.env.get('INMOBILE_SENDER') || 'OrderFlow',
        respectBlacklist: true
      })
    })

    const result = await response.json()

    if (response.ok && result.messageIds && result.messageIds.length > 0) {
      return new Response(
        JSON.stringify({ success: true, sid: result.messageIds[0], provider: 'inmobile' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ error: result.errorMessage || 'Failed to send SMS', details: result }),
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
