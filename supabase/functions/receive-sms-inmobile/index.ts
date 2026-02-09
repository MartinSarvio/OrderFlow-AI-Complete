import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createRequestLogger } from "../_shared/logger.ts"
import { getCorsHeaders, handleCorsPreflightResponse } from "../_shared/cors.ts"

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

function buildPhoneCandidates(raw: string): string[] {
  const candidates: string[] = []
  const push = (value: string) => {
    if (!value) return
    if (!candidates.includes(value)) candidates.push(value)
  }

  const trimmed = String(raw || "").trim()
  const normalized = normalizePhone(trimmed)
  const digits = trimmed.replace(/[^0-9]/g, "")

  push(trimmed)
  push(normalized)

  if (digits) {
    push(digits)
    if (digits.startsWith("45") && digits.length === 10) {
      const local = digits.slice(2)
      push(local)
      push(`+45${local}`)
    } else if (digits.length === 8) {
      push(`45${digits}`)
      push(`+45${digits}`)
    }
  }

  return candidates.filter(Boolean)
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function pickFirstText(values: unknown[]): string {
  for (const value of values) {
    const text = String(value || "").trim()
    if (text) return text
  }
  return ""
}

function extractTenantOverride(req: Request, payload: Record<string, unknown>): string {
  const url = new URL(req.url)
  const body = asRecord(payload)
  return pickFirstText([
    url.searchParams.get("tenant_id"),
    url.searchParams.get("tenantId"),
    url.searchParams.get("restaurant_id"),
    url.searchParams.get("restaurantId"),
    req.headers.get("x-tenant-id"),
    req.headers.get("x-restaurant-id"),
    body.tenant_id,
    body.tenantId,
    body.restaurant_id,
    body.restaurantId,
    body.workflow_tenant_id,
    body.workflowTenantId,
  ])
}

function collectRestaurantNumbers(row: Record<string, unknown>): string[] {
  const values: unknown[] = [
    row.sms_number,
    row.contact_phone,
    asRecord(row.settings).sms_number,
    asRecord(row.settings).smsNumber,
    asRecord(row.settings).shortcode,
    asRecord(row.metadata).sms_number,
    asRecord(row.metadata).smsNumber,
    asRecord(row.metadata).shortcode,
  ]

  const out: string[] = []
  for (const value of values) {
    const text = String(value || "").trim()
    if (!text) continue
    for (const candidate of buildPhoneCandidates(text)) {
      if (!out.includes(candidate)) out.push(candidate)
    }
  }
  return out
}

async function tryResolveByColumn(
  supabaseUrl: string,
  authHeaders: Record<string, string>,
  column: string,
  candidate: string,
): Promise<{ tenantId: string | null; columnMissing: boolean }> {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/restaurants?${column}=eq.${encodeURIComponent(candidate)}&select=id&limit=1`,
    { headers: authHeaders },
  )

  if (!response.ok) {
    const body = await response.text()
    const columnMissing = response.status === 400 && body.includes(`restaurants.${column}`) && body.includes("does not exist")
    return { tenantId: null, columnMissing }
  }

  const rows = await response.json()
  return { tenantId: rows?.[0]?.id || null, columnMissing: false }
}

async function resolveTenantByReceiver(
  supabaseUrl: string,
  authHeaders: Record<string, string>,
  receiver: string,
  defaultTenantId?: string,
  preferredTenantId?: string,
): Promise<string | null> {
  const preferred = String(preferredTenantId || "").trim()
  if (preferred) return preferred

  const forcedDefault = String(defaultTenantId || "").trim()
  if (forcedDefault) return forcedDefault

  const candidates = buildPhoneCandidates(receiver)
  const candidateSet = new Set(candidates)

  // Preferred: dedicated sms_number column.
  let smsNumberColumnAvailable = true
  for (const candidate of candidates) {
    if (!smsNumberColumnAvailable) break
    const result = await tryResolveByColumn(supabaseUrl, authHeaders, "sms_number", candidate)
    if (result.columnMissing) {
      smsNumberColumnAvailable = false
      break
    }
    if (result.tenantId) return result.tenantId
  }

  // Fallback: contact_phone column used by some schemas.
  for (const candidate of candidates) {
    const result = await tryResolveByColumn(supabaseUrl, authHeaders, "contact_phone", candidate)
    if (result.columnMissing) break
    if (result.tenantId) return result.tenantId
  }

  // Final fallback: fetch all restaurants and match known number fields in JSON/settings.
  const allRes = await fetch(
    `${supabaseUrl}/rest/v1/restaurants?select=id,name,contact_phone,settings,metadata&limit=500`,
    { headers: authHeaders },
  )
  const allRows: Record<string, unknown>[] = allRes.ok ? await allRes.json() : []

  for (const row of allRows) {
    const numbers = collectRestaurantNumbers(row)
    if (numbers.some((num) => candidateSet.has(num))) {
      return String(row.id || "")
    }
  }

  if (allRows.length > 0) {
    return String(allRows[0].id || "")
  }

  const fallbackRes = await fetch(`${supabaseUrl}/rest/v1/restaurants?select=id&limit=1`, { headers: authHeaders })
  if (!fallbackRes.ok) return null
  const fallback = await fallbackRes.json()
  return fallback.length > 0 ? fallback[0].id : null
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
    sender = String(
      msg.msisdn ||
      msg.sender ||
      msg.senderMsisdn ||
      msg.sender_msisdn ||
      msg.from ||
      msg.originator ||
      msg.source ||
      msg.sourceAddress ||
      ""
    )
  }
  if (!receiver) {
    receiver = String(
      msg.shortcode ||
      msg.receiver ||
      msg.targetMsisdn ||
      msg.target_msisdn ||
      msg.targetMSISDN ||
      msg.to ||
      msg.destination ||
      msg.recipient ||
      ""
    )
  }

  text = String(msg.text || msg.fulltext || msg.fullText || msg.message || msg.body || msg.sms_text || msg.content || "")
  messageId = String(msg.id || msg.messageId || msg.message_id || msg.externalId || msg.smsId || `inmobile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
  receivedAt = String(msg.receivedAt || msg.received_at || msg.createdAt || msg.timestamp || fallbackTime)

  const normalizedSender = normalizePhone(sender)
  const normalizedReceiver = normalizePhone(receiver)
  if (!text || !normalizedSender) return null

  return {
    sender: normalizedSender,
    receiver: normalizedReceiver,
    text,
    messageId,
    receivedAt,
  }
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
  const corsHeaders = getCorsHeaders(req)
  const log = createRequestLogger(req, { module: "receive-sms-inmobile", channel: "sms" })

  if (req.method === "OPTIONS") {
    return handleCorsPreflightResponse(req)
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
    const tenantOverride = extractTenantOverride(req, payload)

    log.debug({
      event: "channel.sms.webhook_received",
      provider: "inmobile",
      payload_size: JSON.stringify(payload).length,
    })

    const supabaseUrl = Deno.env.get("SUPABASE_URL")

    // Support shared webhook configurations: route call events to dedicated missed-call handler.
    if (looksLikeMissedCall(payload)) {
      try {
        if (!supabaseUrl) {
          throw new Error("SUPABASE_URL is missing")
        }

        const routeUrl = tenantOverride
          ? `${supabaseUrl}/functions/v1/receive-missed-call?tenant_id=${encodeURIComponent(tenantOverride)}`
          : `${supabaseUrl}/functions/v1/receive-missed-call`
        const routeHeaders: Record<string, string> = { "Content-Type": "application/json" }
        if (tenantOverride) routeHeaders["x-tenant-id"] = tenantOverride

        const routeRes = await fetch(routeUrl, {
          method: "POST",
          headers: routeHeaders,
          body: JSON.stringify(payload),
        })

        log.info({
          event: "channel.call.routed_from_receive_sms_inmobile",
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

    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("ANON_KEY")
    const defaultTenantId = Deno.env.get("DEFAULT_TENANT_ID") || ""
    const messagesInsertKey = serviceRoleKey || anonKey
    const canProcessThreads = Boolean(serviceRoleKey)
    const warnings: string[] = []

    if (tenantOverride) {
      warnings.push("tenant_override_applied")
      log.info({
        event: "channel.sms.tenant_override",
        tenant_id: tenantOverride,
      })
    }
    if (defaultTenantId) {
      warnings.push("default_tenant_fallback_enabled")
    }

    if (!supabaseUrl || !messagesInsertKey) {
      log.error({ event: "channel.sms.config_error", error_reason: "Missing Supabase credentials" })
      return new Response(
        JSON.stringify({ status: "error", reason: "server_config" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (!serviceRoleKey && anonKey) {
      warnings.push("service_role_missing_thread_processing_skipped")
      log.warn({
        event: "channel.sms.partial_mode",
        warning_reason: "SERVICE_ROLE_KEY missing - only messages insert is enabled",
      })
    }

    const messagesInsertHeaders = {
      "Content-Type": "application/json",
      "apikey": messagesInsertKey,
      "Authorization": `Bearer ${messagesInsertKey}`,
      "Prefer": "return=representation",
    }
    const serviceAuthHeaders = serviceRoleKey
      ? { "apikey": serviceRoleKey, "Authorization": `Bearer ${serviceRoleKey}` }
      : null
    const serviceHeaders = serviceRoleKey
      ? { ...serviceAuthHeaders, "Content-Type": "application/json", "Prefer": "return=representation" }
      : null

    const results: Array<{ messageId: string; status: string; error?: string }> = []

    for (const sms of messages) {
      try {
        log.info({
          event: "channel.sms.parsed_message",
          message_id: sms.messageId,
          sender: sms.sender,
          receiver: sms.receiver || null,
          text_preview: sms.text.slice(0, 120),
        })

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
          headers: messagesInsertHeaders,
          body: JSON.stringify(messagesPayload),
        })

        if (!msgRes.ok) {
          const err = await msgRes.text()
          log.warn({ event: "channel.sms.messages_insert_failed", error_reason: err, from: sms.sender })
          results.push({ messageId: sms.messageId, status: "error", error: "messages_insert_failed" })
          continue
        }

        // If service role key is missing, we only store to messages for realtime UI.
        if (!canProcessThreads || !serviceHeaders || !serviceAuthHeaders) {
          results.push({
            messageId: sms.messageId,
            status: "stored_messages_only",
            error: "thread_processing_skipped_missing_service_role",
          })
          continue
        }

        // Step 2: Resolve tenant from receiving number
        const tenantId = await resolveTenantByReceiver(
          supabaseUrl,
          serviceAuthHeaders,
          sms.receiver,
          defaultTenantId,
          tenantOverride,
        )

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
            headers: serviceHeaders,
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
            { headers: serviceAuthHeaders }
          )
          if (lookupRes.ok) {
            const existing = await lookupRes.json()
            if (existing.length > 0) {
              customerId = existing[0].id
            } else {
              const insertRes = await fetch(`${supabaseUrl}/rest/v1/customers`, {
                method: "POST",
                headers: serviceHeaders,
                body: JSON.stringify({ tenant_id: tenantId, phone: sms.sender }),
              })
              if (insertRes.ok) {
                const inserted = await insertRes.json()
                if (Array.isArray(inserted)) {
                  customerId = inserted[0]?.id || null
                } else if (inserted?.id) {
                  customerId = inserted.id
                } else {
                  customerId = null
                }
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
          { headers: serviceAuthHeaders }
        )
        if (threadRes.ok) {
          const threads = await threadRes.json()
          if (threads.length > 0) {
            threadId = threads[0].id
            // Update last_message_at
            await fetch(`${supabaseUrl}/rest/v1/conversation_threads?id=eq.${threadId}`, {
              method: "PATCH",
              headers: { ...serviceHeaders, "Prefer": "return=minimal" },
              body: JSON.stringify({ last_message_at: new Date().toISOString() }),
            })
          }
        }

        if (!threadId) {
          const newThreadRes = await fetch(`${supabaseUrl}/rest/v1/conversation_threads`, {
            method: "POST",
            headers: serviceHeaders,
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
          headers: serviceHeaders,
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
      warnings_count: warnings.length,
      duration_ms: duration,
    })

    // Always return 200 to prevent InMobile from retrying
    return new Response(
      JSON.stringify({ status: "ok", processed: results.length, results, warnings }),
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
