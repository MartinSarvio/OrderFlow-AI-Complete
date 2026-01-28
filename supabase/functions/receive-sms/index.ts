import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-twilio-signature",
}

function normalizePhone(raw: string): string {
  // Keep the + if present, otherwise add it
  if (raw.startsWith("+")) return raw
  let digits = raw.replace(/[^0-9]/g, "")
  if (!digits) return ""
  if (digits.startsWith("00")) {
    digits = digits.slice(2)
  }
  if (digits.startsWith("45")) {
    return `+${digits}`
  }
  if (digits.length === 8) {
    return `+45${digits}`
  }
  return `+${digits}`
}

async function parsePayload(req: Request): Promise<Record<string, string>> {
  const contentType = req.headers.get("content-type") || ""

  // Twilio sends application/x-www-form-urlencoded
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await req.text()
    const params = new URLSearchParams(text)
    const payload: Record<string, string> = {}
    for (const [key, value] of params.entries()) {
      payload[key] = value
    }
    return payload
  }

  // Also support JSON for testing
  if (contentType.includes("application/json")) {
    const json = await req.json()
    return json && typeof json === "object" ? json : {}
  }

  // Fallback: try to parse as form data
  const text = await req.text()
  if (text) {
    const params = new URLSearchParams(text)
    const payload: Record<string, string> = {}
    for (const [key, value] of params.entries()) {
      payload[key] = value
    }
    return payload
  }

  return {}
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const payload = await parsePayload(req)

    // Log payload for debugging
    console.log("Received Twilio webhook payload:", JSON.stringify(payload))

    // Twilio status callback (delivery reports)
    if (payload.MessageStatus) {
      console.log("Received Twilio status callback:", payload.MessageStatus)
      // Return empty TwiML
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { ...corsHeaders, "Content-Type": "text/xml" } }
      )
    }

    // Parse Twilio incoming SMS format
    // From = sender phone number
    // Body = message content
    // To = your Twilio number
    const sender = payload.From || ""
    const message = payload.Body || ""
    const receiver = payload.To || ""
    const messageSid = payload.MessageSid || ""

    console.log("Parsed Twilio SMS - From:", sender, "Body:", message, "To:", receiver, "SID:", messageSid)

    if (!message || !sender) {
      console.log("Missing required fields, returning empty TwiML")
      // Return empty TwiML (Twilio expects XML response)
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { ...corsHeaders, "Content-Type": "text/xml" } }
      )
    }

    const phone = normalizePhone(sender)

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY") ||
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
      Deno.env.get("SUPABASE_ANON_KEY")

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Supabase env vars missing")
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { ...corsHeaders, "Content-Type": "text/xml" } }
      )
    }

    const serverNow = new Date().toISOString()

    const insertPayload = {
      phone,
      direction: "inbound",
      content: message,
      provider: "twilio",
      receiver: normalizePhone(receiver),
      twilio_sid: messageSid,
      raw_payload: payload,
      created_at: serverNow,
      inserted_at: serverNow,
    }

    console.log("Inserting message:", JSON.stringify(insertPayload))

    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify(insertPayload),
    })

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text()
      console.error("Insert failed:", errorText)
    } else {
      const insertedData = await insertResponse.json()
      console.log("Message inserted successfully:", JSON.stringify(insertedData))
    }

    // Always return empty TwiML to acknowledge receipt
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { ...corsHeaders, "Content-Type": "text/xml" } }
    )
  } catch (error) {
    console.error("Webhook error:", error)
    // Return empty TwiML even on error
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { ...corsHeaders, "Content-Type": "text/xml" } }
    )
  }
})
