import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function normalizePhone(raw: string): string {
  let digits = raw.replace(/[^0-9]/g, "")
  if (!digits) return ""
  if (digits.startsWith("00")) digits = digits.slice(2)
  if (digits.startsWith("45")) return `+${digits}`
  if (digits.length === 8) return `+45${digits}`
  return `+${digits}`
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ status: "ok", provider: "inmobile" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  try {
    const payload = await req.json()
    console.log("InMobile webhook:", JSON.stringify(payload))

    const message = String(payload.text || payload.message || "")
    const sender = String(payload.msisdn || payload.sender || "")
    const receiver = String(payload.shortcode || payload.receiver || "")

    if (!message || !sender) {
      return new Response(
        JSON.stringify({ error: "Missing: msisdn, text" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify({
        phone: normalizePhone(sender),
        direction: "inbound",
        content: message,
        provider: "inmobile",
        receiver: normalizePhone(receiver),
        raw_payload: payload,
        created_at: new Date().toISOString(),
      }),
    })

    if (!insertResponse.ok) {
      const err = await insertResponse.text()
      return new Response(
        JSON.stringify({ error: "Insert failed", details: err }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
