import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createRequestLogger, channelLogger, createAuditEntry } from "../_shared/logger.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-trace-id, x-restaurant-id",
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
  const log = createRequestLogger(req, { module: 'receive-sms', channel: 'sms' })

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method === "GET") {
    log.info({ event: 'channel.sms.health_check', message: 'Health check OK' })
    return new Response(
      JSON.stringify({ status: "ok", provider: "inmobile" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const startTime = Date.now()

  try {
    const payload = await req.json()

    log.debug({
      event: 'channel.sms.webhook_received',
      provider: 'inmobile',
      payload_size: JSON.stringify(payload).length
    })

    const message = String(payload.text || payload.message || "")
    const sender = String(payload.msisdn || payload.sender || "")
    const receiver = String(payload.shortcode || payload.receiver || "")

    if (!message || !sender) {
      log.warn({
        event: 'channel.sms.validation_failed',
        error_reason: 'Missing required fields',
        has_message: !!message,
        has_sender: !!sender
      })
      return new Response(
        JSON.stringify({ error: "Missing: msisdn, text" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const normalizedSender = normalizePhone(sender)
    const normalizedReceiver = normalizePhone(receiver)

    log.info({
      event: 'channel.sms.received',
      from: normalizedSender,
      to: normalizedReceiver,
      message_length: message.length,
      provider: 'inmobile'
    })

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    const insertPayload = {
      phone: normalizedSender,
      direction: "inbound",
      content: message,
      provider: "inmobile",
      receiver: normalizedReceiver,
      raw_payload: payload,
      created_at: new Date().toISOString(),
    }

    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceRoleKey!,
        "Authorization": `Bearer ${serviceRoleKey}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify(insertPayload),
    })

    const duration = Date.now() - startTime

    if (!insertResponse.ok) {
      const err = await insertResponse.text()
      log.error({
        event: 'channel.sms.insert_failed',
        error_reason: err,
        status_code: insertResponse.status,
        from: normalizedSender,
        duration_ms: duration
      })
      return new Response(
        JSON.stringify({ error: "Insert failed", details: err }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const insertedData = await insertResponse.json()

    log.info({
      event: 'channel.sms.stored',
      message_id: insertedData[0]?.id,
      from: normalizedSender,
      duration_ms: duration
    })

    return new Response(
      JSON.stringify({ success: true, message_id: insertedData[0]?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
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
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
