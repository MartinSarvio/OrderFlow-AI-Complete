import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function normalizePhone(raw: string): string {
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // GatewayAPI sends JSON webhook
    const payload = await req.json()

    console.log("Received GatewayAPI webhook payload:", JSON.stringify(payload))

    // GatewayAPI webhook format:
    // {
    //   "id": 123456789,
    //   "msisdn": 4512345678,
    //   "receiver": 4587654321,
    //   "message": "Hello world",
    //   "senttime": 1234567890,
    //   "webhook_label": "my-webhook"
    // }

    const sender = payload.msisdn ? String(payload.msisdn) : ""
    const message = payload.message || ""
    const receiver = payload.receiver ? String(payload.receiver) : ""
    const messageId = payload.id ? String(payload.id) : ""

    console.log("Parsed GatewayAPI SMS - From:", sender, "Body:", message, "To:", receiver, "ID:", messageId)

    if (!message || !sender) {
      console.log("Missing required fields")
      return new Response(
        JSON.stringify({ success: true, message: "No action needed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        JSON.stringify({ error: "Configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const serverNow = new Date().toISOString()

    const insertPayload = {
      phone,
      direction: "inbound",
      content: message,
      provider: "gatewayapi",
      receiver: normalizePhone(receiver),
      gatewayapi_id: messageId,
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
      return new Response(
        JSON.stringify({ error: "Database error", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const insertedData = await insertResponse.json()
    console.log("Message inserted successfully:", JSON.stringify(insertedData))

    return new Response(
      JSON.stringify({ success: true, id: insertedData[0]?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Webhook error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
