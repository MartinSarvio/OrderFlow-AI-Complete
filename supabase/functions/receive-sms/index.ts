import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "")
  if (!digits) return ""
  if (digits.startsWith("45")) {
    return `+${digits}`
  }
  if (digits.length === 8) {
    return `+45${digits}`
  }
  return `+${digits}`
}

function parseTimestamp(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

async function parsePayload(req: Request): Promise<Record<string, unknown>> {
  if (req.method === "GET") {
    const params = new URL(req.url).searchParams
    return Object.fromEntries(params.entries())
  }

  const contentType = req.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    const json = await req.json()
    return json && typeof json === "object" ? json : {}
  }

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await req.formData()
    const payload: Record<string, unknown> = {}
    for (const [key, value] of form.entries()) {
      payload[key] = String(value)
    }
    return payload
  }

  const text = await req.text()
  if (!text) return {}
  const params = new URLSearchParams(text)
  return Object.fromEntries(params.entries())
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const payload = await parsePayload(req)

    const webhookSecret = Deno.env.get("WEBHOOK_SECRET")
    if (webhookSecret) {
      const headerSecret = req.headers.get("x-webhook-secret")
      const querySecret = new URL(req.url).searchParams.get("secret")
      const bodySecret = payload.secret
      if (headerSecret !== webhookSecret && querySecret !== webhookSecret && bodySecret !== webhookSecret) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }
    }

    // GatewayAPI sender msisdn og receiver som TAL, ikke strenge
    const message = String(payload.message || payload.text || payload.body || payload.content || "")
    const sender = String(payload.msisdn || payload.sender || payload.from || payload.phone || payload.originator || "")
    const receiver = String(payload.receiver || payload.to || payload.recipient || "")

    if (!message || !sender) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: sender, message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const phone = normalizePhone(sender)
    // GatewayAPI bruger senttime (Unix timestamp i sekunder)
    const sentTime = payload.senttime ? new Date(Number(payload.senttime) * 1000).toISOString() : null
    const createdAt = sentTime || parseTimestamp(payload.timestamp) || parseTimestamp(payload.time) || null

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY") ||
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
      Deno.env.get("SUPABASE_ANON_KEY")

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Supabase env vars missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const insertPayload = {
      phone,
      direction: "inbound",
      content: message,
      provider: "gatewayapi",
      receiver,
      raw_payload: payload,
      created_at: createdAt || new Date().toISOString(),
    }

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
      return new Response(
        JSON.stringify({ error: "Failed to insert message", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
