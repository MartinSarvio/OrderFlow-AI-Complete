import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createRequestLogger } from "../_shared/logger.ts"

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

/**
 * Extract sender, receiver, text from various payload formats:
 *   1. Flat webhook:  { msisdn, text, shortcode }
 *   2. InMobile V4:   { from: { rawSource }, to: { msisdn }, text }
 *   3. V4 array:      { messages: [{ from, to, text }] }
 */
function extractMessage(payload: Record<string, unknown>): { message: string; sender: string; receiver: string; messageId: string } | null {
  // V4 array wrapper — take first message
  let source = payload
  if (Array.isArray(payload.messages) && payload.messages.length > 0) {
    source = payload.messages[0] as Record<string, unknown>
  }

  // Try V4 nested format first
  const from = source.from as Record<string, unknown> | undefined
  const to = source.to as Record<string, unknown> | undefined

  let sender = ""
  let receiver = ""

  if (from && typeof from === "object") {
    sender = String(from.rawSource || "")
    if (!sender && from.phoneNumber) {
      const cc = String(from.countryCode || "45")
      sender = cc + String(from.phoneNumber)
    }
  }

  if (to && typeof to === "object") {
    receiver = String(to.msisdn || to.phoneNumber || "")
  }

  // Fall back to flat fields
  if (!sender) sender = String(source.msisdn || source.sender || "")
  if (!receiver) receiver = String(source.shortcode || source.receiver || "")

  const message = String(source.text || source.message || source.body || "")
  const messageId = String(source.id || source.messageId || source.message_id || `sms-${Date.now()}`)

  if (!message || !sender) return null

  return { message, sender, receiver, messageId }
}

function looksLikeMissedCall(payload: Record<string, unknown>): boolean {
  let source = payload
  if (Array.isArray(payload.events) && payload.events.length > 0) {
    source = payload.events[0] as Record<string, unknown>
  } else if (Array.isArray(payload.calls) && payload.calls.length > 0) {
    source = payload.calls[0] as Record<string, unknown>
  } else if (Array.isArray(payload.messages) && payload.messages.length > 0) {
    source = payload.messages[0] as Record<string, unknown>
  }

  const text = String(source.text || source.fulltext || source.fullText || source.message || source.body || "").trim()
  if (text) return false

  if (source.missed === true || source.isMissed === true || source.answered === false) {
    return true
  }

  const eventType = String(
    source.event ||
    source.eventType ||
    source.callStatus ||
    source.status ||
    source.type ||
    ""
  ).toLowerCase()

  return /missed|missed_call|no_answer|noanswer|unanswered|busy|failed|not_answered/.test(eventType)
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")

    // Support a shared webhook setup: route missed-call payloads to the dedicated call endpoint.
    if (looksLikeMissedCall(payload)) {
      try {
        if (!supabaseUrl) {
          throw new Error("SUPABASE_URL is missing")
        }

        const routeRes = await fetch(`${supabaseUrl}/functions/v1/receive-missed-call`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        log.info({
          event: "channel.call.routed_from_receive_sms",
          target_endpoint: "receive-missed-call",
          route_status: routeRes.status,
        })

        return new Response(
          JSON.stringify({
            status: "routed",
            endpoint: "receive-missed-call",
            routeStatus: routeRes.status,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      } catch (routeErr) {
        log.error({
          event: "channel.call.route_failed",
          target_endpoint: "receive-missed-call",
          error_reason: (routeErr as Error).message,
        })
        return new Response(
          JSON.stringify({ status: "error", reason: "missed_call_route_failed" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }
    }

    const extracted = extractMessage(payload)

    if (!extracted) {
      log.warn({
        event: 'channel.sms.validation_failed',
        error_reason: 'Missing required fields or unsupported format',
        payload_keys: Object.keys(payload).join(','),
      })
      return new Response(
        JSON.stringify({ error: "Missing: msisdn/from, text" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const { message, sender, receiver, messageId } = extracted
    const normalizedSender = normalizePhone(sender)
    const normalizedReceiver = normalizePhone(receiver)

    log.info({
      event: 'channel.sms.received',
      from: normalizedSender,
      to: normalizedReceiver,
      message_length: message.length,
      provider: 'inmobile'
    })
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    const supabaseHeaders = {
      "Content-Type": "application/json",
      "apikey": serviceRoleKey!,
      "Authorization": `Bearer ${serviceRoleKey}`,
      "Prefer": "return=representation",
    }

    // Insert into messages table (backward compatibility)
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
      headers: supabaseHeaders,
      body: JSON.stringify(insertPayload),
    })

    if (!insertResponse.ok) {
      const err = await insertResponse.text()
      log.error({
        event: 'channel.sms.insert_failed',
        error_reason: err,
        status_code: insertResponse.status,
        from: normalizedSender,
      })
    } else {
      await insertResponse.json()
    }

    // Bridge to conversation thread system
    // Step 1: Resolve tenant
    let tenantId: string | null = null
    if (normalizedReceiver) {
      const tenantRes = await fetch(
        `${supabaseUrl}/rest/v1/restaurants?sms_number=eq.${encodeURIComponent(normalizedReceiver)}&select=id&limit=1`,
        { headers: { "apikey": serviceRoleKey!, "Authorization": `Bearer ${serviceRoleKey}` } }
      )
      if (tenantRes.ok) {
        const tenants = await tenantRes.json()
        if (tenants.length > 0) tenantId = tenants[0].id
      }
    }
    if (!tenantId) {
      const fallbackRes = await fetch(
        `${supabaseUrl}/rest/v1/restaurants?select=id&limit=1`,
        { headers: { "apikey": serviceRoleKey!, "Authorization": `Bearer ${serviceRoleKey}` } }
      )
      if (fallbackRes.ok) {
        const fallback = await fallbackRes.json()
        if (fallback.length > 0) tenantId = fallback[0].id
      }
    }

    // Step 2: Find or create customer
    let customerId: string | null = null
    if (tenantId) {
      const custRes = await fetch(`${supabaseUrl}/rest/v1/rpc/get_or_create_customer`, {
        method: "POST",
        headers: supabaseHeaders,
        body: JSON.stringify({ p_tenant_id: tenantId, p_phone: normalizedSender, p_email: null, p_name: null }),
      })
      if (custRes.ok) {
        const custData = await custRes.json()
        customerId = Array.isArray(custData) ? custData[0]?.id : custData?.id
      }

      // Fallback: direct lookup/insert
      if (!customerId) {
        const lookupRes = await fetch(
          `${supabaseUrl}/rest/v1/customers?phone=eq.${encodeURIComponent(normalizedSender)}&tenant_id=eq.${tenantId}&select=id&limit=1`,
          { headers: { "apikey": serviceRoleKey!, "Authorization": `Bearer ${serviceRoleKey}` } }
        )
        if (lookupRes.ok) {
          const existing = await lookupRes.json()
          if (existing.length > 0) {
            customerId = existing[0].id
          } else {
            const insRes = await fetch(`${supabaseUrl}/rest/v1/customers`, {
              method: "POST",
              headers: supabaseHeaders,
              body: JSON.stringify({ tenant_id: tenantId, phone: normalizedSender }),
            })
            if (insRes.ok) {
              const inserted = await insRes.json()
              customerId = inserted[0]?.id || null
            }
          }
        }
      }
    }

    // Step 3: Find or create thread + insert thread_message
    let threadId: string | null = null
    if (tenantId && customerId) {
      const threadRes = await fetch(
        `${supabaseUrl}/rest/v1/conversation_threads?tenant_id=eq.${tenantId}&customer_id=eq.${customerId}&channel=eq.sms&status=eq.open&order=created_at.desc&limit=1`,
        { headers: { "apikey": serviceRoleKey!, "Authorization": `Bearer ${serviceRoleKey}` } }
      )
      if (threadRes.ok) {
        const threads = await threadRes.json()
        if (threads.length > 0) {
          threadId = threads[0].id
          await fetch(`${supabaseUrl}/rest/v1/conversation_threads?id=eq.${threadId}`, {
            method: "PATCH",
            headers: { ...supabaseHeaders, "Prefer": "return=minimal" },
            body: JSON.stringify({ last_message_at: new Date().toISOString() }),
          })
        }
      }

      if (!threadId) {
        const newRes = await fetch(`${supabaseUrl}/rest/v1/conversation_threads`, {
          method: "POST",
          headers: supabaseHeaders,
          body: JSON.stringify({
            tenant_id: tenantId,
            customer_id: customerId,
            channel: "sms",
            external_thread_id: normalizedSender,
            status: "open",
            last_message_at: new Date().toISOString(),
          }),
        })
        if (newRes.ok) {
          const newThread = await newRes.json()
          threadId = newThread[0]?.id || null
        }
      }

      // Insert thread_message
      if (threadId) {
        await fetch(`${supabaseUrl}/rest/v1/thread_messages`, {
          method: "POST",
          headers: supabaseHeaders,
          body: JSON.stringify({
            thread_id: threadId,
            direction: "inbound",
            sender_type: "customer",
            content: message,
            message_type: "text",
            external_message_id: messageId,
            metadata: { phone: normalizedSender, provider: "inmobile", receiver: normalizedReceiver },
            status: "pending",
          }),
        })
      }
    }

    const duration = Date.now() - startTime

    log.info({
      event: 'channel.sms.stored',
      from: normalizedSender,
      thread_id: threadId,
      has_thread: !!threadId,
      duration_ms: duration,
    })

    return new Response(
      JSON.stringify({ success: true, thread_id: threadId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    const duration = Date.now() - startTime
    log.error({
      event: 'channel.sms.error',
      error_reason: (error as Error).message,
      stack: (error as Error).stack,
      duration_ms: duration
    })
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
