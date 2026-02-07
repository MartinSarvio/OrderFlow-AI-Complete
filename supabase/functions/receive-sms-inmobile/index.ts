import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createRequestLogger } from "../_shared/logger.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-trace-id, x-restaurant-id",
}

// ============================================================
// InMobile SMS Webhook — Dedicated endpoint for InMobile
// ============================================================
// Handles incoming SMS from InMobile webhooks and bridges them
// into the conversation thread system for workflow-agent processing.
//
// Supports payload formats:
//   1. InMobile webhook:  { msisdn, text, shortcode, id }
//   2. InMobile V4:       { from: { rawSource, phoneNumber, countryCode }, to: { msisdn }, text, receivedAt }
//   3. V4 array wrapper:  { messages: [{ from, to, text, receivedAt }] }
// ============================================================

interface ParsedSMS {
  sender: string
  receiver: string
  text: string
  messageId: string
  receivedAt: string
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
 * Parse InMobile payload into a normalized list of SMS messages.
 * Handles all 3 known formats.
 */
function parseInMobilePayload(payload: Record<string, unknown>): ParsedSMS[] {
  const results: ParsedSMS[] = []
  const now = new Date().toISOString()

  // Format 3: V4 array wrapper { messages: [...] }
  if (Array.isArray(payload.messages)) {
    for (const msg of payload.messages) {
      const parsed = parseSingleMessage(msg as Record<string, unknown>, now)
      if (parsed) results.push(parsed)
    }
    return results
  }

  // Format 1 or 2: single message object
  const parsed = parseSingleMessage(payload, now)
  if (parsed) results.push(parsed)
  return results
}

function parseSingleMessage(msg: Record<string, unknown>, fallbackTime: string): ParsedSMS | null {
  let sender = ""
  let receiver = ""
  let text = ""
  let messageId = ""
  let receivedAt = fallbackTime

  // V4 nested format: { from: { rawSource, phoneNumber, countryCode }, to: { msisdn }, text }
  const from = msg.from as Record<string, unknown> | undefined
  const to = msg.to as Record<string, unknown> | undefined

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

  // Flat webhook format: { msisdn, text, shortcode }
  if (!sender) {
    sender = String(msg.msisdn || msg.sender || msg.from || "")
  }
  if (!receiver) {
    receiver = String(msg.shortcode || msg.receiver || msg.to || "")
  }

  text = String(msg.text || msg.message || msg.body || "")
  messageId = String(msg.id || msg.messageId || msg.message_id || `inmobile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
  receivedAt = String(msg.receivedAt || msg.received_at || msg.timestamp || fallbackTime)

  if (!text || !sender) return null

  return {
    sender: normalizePhone(sender),
    receiver: normalizePhone(receiver),
    text,
    messageId,
    receivedAt,
  }
}

serve(async (req) => {
  const log = createRequestLogger(req, { module: "receive-sms-inmobile", channel: "sms" })

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  // Health check
  if (req.method === "GET") {
    log.info({ event: "channel.sms.health_check", message: "InMobile webhook OK" })
    return new Response(
      JSON.stringify({ status: "ok", provider: "inmobile", endpoint: "receive-sms-inmobile" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const startTime = Date.now()

  try {
    const payload = await req.json()

    log.debug({
      event: "channel.sms.webhook_received",
      provider: "inmobile",
      payload_size: JSON.stringify(payload).length,
    })

    // Parse all messages from the payload
    const messages = parseInMobilePayload(payload)

    if (messages.length === 0) {
      log.warn({
        event: "channel.sms.parse_failed",
        error_reason: "No valid messages found in payload",
        payload_keys: Object.keys(payload).join(","),
      })
      // Return 200 to prevent InMobile from retrying
      return new Response(
        JSON.stringify({ status: "ignored", reason: "no_valid_messages" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !serviceRoleKey) {
      log.error({ event: "channel.sms.config_error", error_reason: "Missing Supabase credentials" })
      return new Response(
        JSON.stringify({ status: "error", reason: "server_config" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabaseHeaders = {
      "Content-Type": "application/json",
      "apikey": serviceRoleKey,
      "Authorization": `Bearer ${serviceRoleKey}`,
      "Prefer": "return=representation",
    }

    const results: Array<{ messageId: string; status: string; error?: string }> = []

    for (const sms of messages) {
      try {
        // Step 1: Insert into messages table (backward compatibility)
        const messagesPayload = {
          phone: sms.sender,
          direction: "inbound",
          content: sms.text,
          provider: "inmobile",
          receiver: sms.receiver,
          raw_payload: payload,
          created_at: sms.receivedAt,
        }

        const msgRes = await fetch(`${supabaseUrl}/rest/v1/messages`, {
          method: "POST",
          headers: supabaseHeaders,
          body: JSON.stringify(messagesPayload),
        })

        if (!msgRes.ok) {
          const err = await msgRes.text()
          log.warn({ event: "channel.sms.messages_insert_failed", error_reason: err, from: sms.sender })
        }

        // Step 2: Resolve tenant from receiving number
        let tenantId: string | null = null

        if (sms.receiver) {
          const tenantRes = await fetch(
            `${supabaseUrl}/rest/v1/restaurants?sms_number=eq.${encodeURIComponent(sms.receiver)}&select=id&limit=1`,
            { headers: { "apikey": serviceRoleKey, "Authorization": `Bearer ${serviceRoleKey}` } }
          )
          if (tenantRes.ok) {
            const tenants = await tenantRes.json()
            if (tenants.length > 0) tenantId = tenants[0].id
          }
        }

        // Fallback: use first tenant
        if (!tenantId) {
          const fallbackRes = await fetch(
            `${supabaseUrl}/rest/v1/restaurants?select=id&limit=1`,
            { headers: { "apikey": serviceRoleKey, "Authorization": `Bearer ${serviceRoleKey}` } }
          )
          if (fallbackRes.ok) {
            const fallback = await fallbackRes.json()
            if (fallback.length > 0) tenantId = fallback[0].id
          }
        }

        if (!tenantId) {
          log.warn({ event: "channel.sms.no_tenant", from: sms.sender })
          results.push({ messageId: sms.messageId, status: "ignored", error: "no_tenant" })
          continue
        }

        // Step 3: Find or create customer
        let customerId: string | null = null
        const customerRes = await fetch(
          `${supabaseUrl}/rest/v1/rpc/get_or_create_customer`,
          {
            method: "POST",
            headers: supabaseHeaders,
            body: JSON.stringify({ p_tenant_id: tenantId, p_phone: sms.sender, p_email: null, p_name: null }),
          }
        )
        if (customerRes.ok) {
          const customerData = await customerRes.json()
          if (Array.isArray(customerData) && customerData.length > 0) {
            customerId = customerData[0].id
          } else if (customerData?.id) {
            customerId = customerData.id
          }
        }

        // Fallback: direct customer lookup/insert
        if (!customerId) {
          const lookupRes = await fetch(
            `${supabaseUrl}/rest/v1/customers?phone=eq.${encodeURIComponent(sms.sender)}&tenant_id=eq.${tenantId}&select=id&limit=1`,
            { headers: { "apikey": serviceRoleKey, "Authorization": `Bearer ${serviceRoleKey}` } }
          )
          if (lookupRes.ok) {
            const existing = await lookupRes.json()
            if (existing.length > 0) {
              customerId = existing[0].id
            } else {
              const insertRes = await fetch(`${supabaseUrl}/rest/v1/customers`, {
                method: "POST",
                headers: supabaseHeaders,
                body: JSON.stringify({ tenant_id: tenantId, phone: sms.sender }),
              })
              if (insertRes.ok) {
                const inserted = await insertRes.json()
                customerId = inserted[0]?.id || null
              }
            }
          }
        }

        if (!customerId) {
          log.warn({ event: "channel.sms.no_customer", from: sms.sender })
          results.push({ messageId: sms.messageId, status: "stored_messages_only", error: "no_customer" })
          continue
        }

        // Step 4: Find or create conversation thread
        let threadId: string | null = null

        const threadRes = await fetch(
          `${supabaseUrl}/rest/v1/conversation_threads?tenant_id=eq.${tenantId}&customer_id=eq.${customerId}&channel=eq.sms&status=eq.open&order=created_at.desc&limit=1`,
          { headers: { "apikey": serviceRoleKey, "Authorization": `Bearer ${serviceRoleKey}` } }
        )
        if (threadRes.ok) {
          const threads = await threadRes.json()
          if (threads.length > 0) {
            threadId = threads[0].id
            // Update last_message_at
            await fetch(`${supabaseUrl}/rest/v1/conversation_threads?id=eq.${threadId}`, {
              method: "PATCH",
              headers: { ...supabaseHeaders, "Prefer": "return=minimal" },
              body: JSON.stringify({ last_message_at: new Date().toISOString() }),
            })
          }
        }

        if (!threadId) {
          const newThreadRes = await fetch(`${supabaseUrl}/rest/v1/conversation_threads`, {
            method: "POST",
            headers: supabaseHeaders,
            body: JSON.stringify({
              tenant_id: tenantId,
              customer_id: customerId,
              channel: "sms",
              external_thread_id: sms.sender,
              status: "open",
              last_message_at: new Date().toISOString(),
            }),
          })
          if (newThreadRes.ok) {
            const newThread = await newThreadRes.json()
            threadId = newThread[0]?.id || null
          }
        }

        if (!threadId) {
          log.warn({ event: "channel.sms.no_thread", from: sms.sender })
          results.push({ messageId: sms.messageId, status: "stored_messages_only", error: "no_thread" })
          continue
        }

        // Step 5: Insert into thread_messages
        const threadMsgRes = await fetch(`${supabaseUrl}/rest/v1/thread_messages`, {
          method: "POST",
          headers: supabaseHeaders,
          body: JSON.stringify({
            thread_id: threadId,
            direction: "inbound",
            sender_type: "customer",
            content: sms.text,
            message_type: "text",
            external_message_id: sms.messageId,
            metadata: { phone: sms.sender, provider: "inmobile", receiver: sms.receiver },
            status: "pending",
          }),
        })

        if (!threadMsgRes.ok) {
          const err = await threadMsgRes.text()
          log.warn({ event: "channel.sms.thread_message_insert_failed", error_reason: err, from: sms.sender })
          results.push({ messageId: sms.messageId, status: "partial", error: "thread_message_failed" })
          continue
        }

        const threadMsg = await threadMsgRes.json()

        log.info({
          event: "channel.sms.stored",
          from: sms.sender,
          message_id: sms.messageId,
          thread_id: threadId,
          thread_message_id: threadMsg[0]?.id,
        })

        results.push({ messageId: sms.messageId, status: "success" })
      } catch (msgError) {
        log.error({
          event: "channel.sms.message_processing_error",
          error_reason: (msgError as Error).message,
          message_id: sms.messageId,
        })
        results.push({ messageId: sms.messageId, status: "error", error: (msgError as Error).message })
      }
    }

    const duration = Date.now() - startTime
    log.info({
      event: "channel.sms.webhook_completed",
      total_messages: messages.length,
      successful: results.filter((r) => r.status === "success").length,
      duration_ms: duration,
    })

    // Always return 200 to prevent InMobile from retrying
    return new Response(
      JSON.stringify({ status: "ok", processed: results.length, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    const duration = Date.now() - startTime
    log.error({
      event: "channel.sms.webhook_error",
      error_reason: (error as Error).message,
      stack: (error as Error).stack,
      duration_ms: duration,
    })
    // Still return 200 to prevent retries
    return new Response(
      JSON.stringify({ status: "error", message: (error as Error).message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
