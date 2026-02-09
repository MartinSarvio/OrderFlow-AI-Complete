import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createRequestLogger } from "../_shared/logger.ts"
import { getCorsHeaders, handleCorsPreflightResponse } from "../_shared/cors.ts"

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
  const corsHeaders = getCorsHeaders(req)
  const log = createRequestLogger(req, { module: 'receive-sms', channel: 'sms' })

  if (req.method === "OPTIONS") {
    return handleCorsPreflightResponse(req)
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
    const tenantOverride = extractTenantOverride(req, payload)

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

    if (!normalizedSender) {
      log.warn({
        event: "channel.sms.validation_failed",
        error_reason: "invalid_sender",
        sender_raw: sender,
      })
      return new Response(
        JSON.stringify({ status: "ignored", reason: "invalid_sender" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    log.info({
      event: 'channel.sms.received',
      from: normalizedSender,
      to: normalizedReceiver,
      message_length: message.length,
      provider: 'inmobile'
    })
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("ANON_KEY")
    const defaultTenantId = Deno.env.get("DEFAULT_TENANT_ID") || ""
    const messagesInsertKey = serviceRoleKey || anonKey
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
      log.error({
        event: "channel.sms.config_error",
        error_reason: "Missing SUPABASE_URL or insert key",
      })
      return new Response(
        JSON.stringify({ status: "error", reason: "server_config" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const messagesInsertHeaders = {
      "Content-Type": "application/json",
      "apikey": messagesInsertKey,
      "Authorization": `Bearer ${messagesInsertKey}`,
      "Prefer": "return=representation",
    }

    if (!serviceRoleKey && anonKey) {
      warnings.push("service_role_missing_thread_processing_skipped")
      log.warn({
        event: "channel.sms.partial_mode",
        warning_reason: "SERVICE_ROLE_KEY missing - only messages insert is enabled",
      })
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
      headers: messagesInsertHeaders,
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

    // If service role is missing, return early after storing message for realtime/UI.
    if (!serviceRoleKey) {
      return new Response(
        JSON.stringify({ success: true, thread_id: null, warnings }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const serviceAuthHeaders = {
      "apikey": serviceRoleKey,
      "Authorization": `Bearer ${serviceRoleKey}`,
    }
    const serviceHeaders = {
      ...serviceAuthHeaders,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    }

    // Bridge to conversation thread system
    // Step 1: Resolve tenant
    const tenantId = await resolveTenantByReceiver(
      supabaseUrl,
      serviceAuthHeaders,
      normalizedReceiver || receiver,
      defaultTenantId,
      tenantOverride,
    )

    if (!tenantId) {
      warnings.push("no_tenant")
      return new Response(
        JSON.stringify({ success: true, thread_id: null, warnings }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Step 2: Find or create customer
    let customerId: string | null = null
    if (tenantId) {
      const custRes = await fetch(`${supabaseUrl}/rest/v1/rpc/get_or_create_customer`, {
        method: "POST",
        headers: serviceHeaders,
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
          { headers: serviceAuthHeaders }
        )
        if (lookupRes.ok) {
          const existing = await lookupRes.json()
          if (existing.length > 0) {
            customerId = existing[0].id
          } else {
            const insRes = await fetch(`${supabaseUrl}/rest/v1/customers`, {
              method: "POST",
              headers: serviceHeaders,
              body: JSON.stringify({ tenant_id: tenantId, phone: normalizedSender }),
            })
            if (insRes.ok) {
              const inserted = await insRes.json()
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
    }

    // Step 3: Find or create thread + insert thread_message
    let threadId: string | null = null
    if (tenantId && customerId) {
      const threadRes = await fetch(
        `${supabaseUrl}/rest/v1/conversation_threads?tenant_id=eq.${tenantId}&customer_id=eq.${customerId}&channel=eq.sms&status=eq.open&order=created_at.desc&limit=1`,
        { headers: serviceAuthHeaders }
      )
      if (threadRes.ok) {
        const threads = await threadRes.json()
        if (threads.length > 0) {
          threadId = threads[0].id
          await fetch(`${supabaseUrl}/rest/v1/conversation_threads?id=eq.${threadId}`, {
            method: "PATCH",
            headers: { ...serviceHeaders, "Prefer": "return=minimal" },
            body: JSON.stringify({ last_message_at: new Date().toISOString() }),
          })
        }
      }

      if (!threadId) {
        const newRes = await fetch(`${supabaseUrl}/rest/v1/conversation_threads`, {
          method: "POST",
          headers: serviceHeaders,
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
          headers: serviceHeaders,
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
      JSON.stringify({ success: true, thread_id: threadId, warnings }),
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
