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
    const { to, message, from, accountSid, authToken } = await req.json()

    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use provided credentials or environment variables
    const twilioAccountSid = accountSid || Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = authToken || Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioFromNumber = from || Deno.env.get('TWILIO_PHONE_NUMBER') || '+4552512921'

    if (!twilioAccountSid || !twilioAuthToken) {
      return new Response(
        JSON.stringify({ error: 'Twilio credentials not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format phone number to E.164
    let phoneNumber = to.replace(/\s/g, '')
    if (!phoneNumber.startsWith('+')) {
      // Assume Danish number if no country code
      if (phoneNumber.startsWith('45')) {
        phoneNumber = '+' + phoneNumber
      } else if (phoneNumber.length === 8) {
        phoneNumber = '+45' + phoneNumber
      } else {
        phoneNumber = '+' + phoneNumber
      }
    }

    // Create Basic Auth header for Twilio
    const basicAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`)

    // Send via Twilio REST API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`

    const formData = new URLSearchParams()
    formData.append('To', phoneNumber)
    formData.append('From', twilioFromNumber)
    formData.append('Body', message)

    console.log('Sending SMS via Twilio:', { to: phoneNumber, from: twilioFromNumber, bodyLength: message.length })

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    })

    const result = await response.json()

    console.log('Twilio response:', JSON.stringify(result))

    if (response.ok) {
      return new Response(
        JSON.stringify({
          success: true,
          sid: result.sid,
          status: result.status,
          to: result.to,
          from: result.from
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({
          error: result.message || 'Failed to send SMS',
          code: result.code,
          details: result
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Send SMS error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
