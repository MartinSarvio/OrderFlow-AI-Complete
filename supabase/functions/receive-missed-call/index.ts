import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createRequestLogger } from "../_shared/logger.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-trace-id, x-restaurant-id",
}

interface MissedCallEvent {
  caller: string
  receiver: string
  eventId: string
  eventType: string
  receivedAt: string
  isMissed: boolean
}

function normalizePhone(raw: string): string {
  let digits = (raw || "").replace(/[^0-9]/g, "")
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
): Promise<{ row: { id: string; name: string } | null; columnMissing: boolean }> {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/restaurants?${column}=eq.${encodeURIComponent(candidate)}&select=id,name&limit=1`,
    { headers: authHeaders },
  )

  if (!response.ok) {
    const body = await response.text()
    const columnMissing = response.status === 400 && body.includes(`restaurants.${column}`) && body.includes("does not exist")
    return { row: null, columnMissing }
  }

  const rows = await response.json()
  if (rows?.length > 0) {
    return { row: { id: rows[0].id, name: rows[0].name || "restauranten" }, columnMissing: false }
  }
  return { row: null, columnMissing: false }
}

async function resolveTenantForCall(
  supabaseUrl: string,
  authHeaders: Record<string, string>,
  receiver: string,
  defaultTenantId?: string,
): Promise<{ id: string; name: string } | null> {
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
    if (result.row) return result.row
  }

  // Fallback: contact_phone column used by some schemas.
  for (const candidate of candidates) {
    const result = await tryResolveByColumn(supabaseUrl, authHeaders, "contact_phone", candidate)
    if (result.columnMissing) break
    if (result.row) return result.row
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
      return { id: String(row.id || ""), name: String(row.name || "restauranten") }
    }
  }

  if (defaultTenantId) {
    if (allRows.length > 0) {
      const match = allRows.find((row) => String(row.id || "") === defaultTenantId)
      if (match?.id) {
        return { id: String(match.id), name: String(match.name || "restauranten") }
      }
    } else {
      const defaultRes = await fetch(
        `${supabaseUrl}/rest/v1/restaurants?id=eq.${encodeURIComponent(defaultTenantId)}&select=id,name&limit=1`,
        { headers: authHeaders },
      )
      if (defaultRes.ok) {
        const rows = await defaultRes.json()
        if (rows.length > 0) {
          return { id: rows[0].id, name: rows[0].name || "restauranten" }
        }
      }
    }
  }

  if (allRows.length > 0) {
    return { id: String(allRows[0].id || ""), name: String(allRows[0].name || "restauranten") }
  }

  const fallbackRes = await fetch(`${supabaseUrl}/rest/v1/restaurants?select=id,name&limit=1`, { headers: authHeaders })
  if (!fallbackRes.ok) return null
  const rows = await fallbackRes.json()
  if (rows.length === 0) return null
  return { id: rows[0].id, name: rows[0].name || "restauranten" }
}

function isLikelyMissedCall(source: Record<string, unknown>, eventType: string): boolean {
  const missedExplicit = source.missed === true || source.isMissed === true
  if (missedExplicit) return true

  const answered = source.answered as boolean | undefined
  if (answered === false) return true

  return /missed|no_answer|noanswer|unanswered|busy|failed|not_answered/.test(eventType)
}

function extractMissedCallEvent(payload: Record<string, unknown>): MissedCallEvent | null {
  let source = payload

  if (Array.isArray(payload.events) && payload.events.length > 0) {
    source = payload.events[0] as Record<string, unknown>
  } else if (Array.isArray(payload.calls) && payload.calls.length > 0) {
    source = payload.calls[0] as Record<string, unknown>
  } else if (Array.isArray(payload.messages) && payload.messages.length > 0) {
    source = payload.messages[0] as Record<string, unknown>
  }

  const from = source.from as Record<string, unknown> | undefined
  const to = source.to as Record<string, unknown> | undefined

  let caller = ""
  let receiver = ""

  if (from && typeof from === "object") {
    caller = String(from.rawSource || from.msisdn || from.phoneNumber || from.number || "")
    if (!caller && from.countryCode && from.phoneNumber) {
      caller = `${String(from.countryCode)}${String(from.phoneNumber)}`
    }
  }

  if (to && typeof to === "object") {
    receiver = String(to.msisdn || to.phoneNumber || to.number || "")
  }

  if (!caller) {
    caller = String(
      source.msisdn ||
      source.caller ||
      source.callerMsisdn ||
      source.sender ||
      source.senderMsisdn ||
      source.from ||
      source.originator ||
      source.phone ||
      source.cli ||
      ""
    )
  }

  if (!receiver) {
    receiver = String(
      source.shortcode ||
      source.receiver ||
      source.targetMsisdn ||
      source.targetMSISDN ||
      source.to ||
      source.did ||
      source.destination ||
      ""
    )
  }

  if (!caller) return null

  const eventType = String(
    source.event ||
    source.eventType ||
    source.callStatus ||
    source.status ||
    source.type ||
    "missed_call"
  ).toLowerCase()

  const eventId = String(
    source.id ||
    source.eventId ||
    source.callId ||
    source.uuid ||
    `missed-call-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  )

  const receivedAt = String(source.timestamp || source.createdAt || source.receivedAt || new Date().toISOString())
  const isMissed = isLikelyMissedCall(source, eventType)

  return {
    caller: normalizePhone(caller),
    receiver: normalizePhone(receiver),
    eventId,
    eventType,
    receivedAt,
    isMissed,
  }
}

function getSmsSenderFromReceiver(receiver: string): string | null {
  const digits = (receiver || "").replace(/[^0-9]/g, "")
  if (!digits) return null
  if (digits.length === 8) return digits
  if (digits.length === 10 && digits.startsWith("45")) return digits.slice(2)
  return null
}

function buildMissedCallSms(template: string | undefined, restaurantName: string): string {
  const fallback = `Hej! Vi missede desvaerre dit opkald til ${restaurantName}. Var det for at bestille mad? Svar JA for at starte din bestilling direkte her over SMS.`
  if (!template) return fallback
  return template.replace(/\{\{restaurant\}\}/gi, restaurantName)
}

serve(async (req) => {
  const log = createRequestLogger(req, { module: "receive-missed-call", channel: "call" })

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ status: "ok", endpoint: "receive-missed-call" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  const startTime = Date.now()

  try {
    const payload = await req.json()
    const event = extractMissedCallEvent(payload)

    if (!event) {
      log.warn({
        event: "channel.call.validation_failed",
        error_reason: "missing_caller",
        payload_keys: Object.keys(payload).join(","),
      })
      return new Response(
        JSON.stringify({ status: "ignored", reason: "missing_caller" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (!event.isMissed) {
      log.info({
        event: "channel.call.ignored",
        reason: "not_missed_event",
        event_type: event.eventType,
        caller: event.caller,
      })
      return new Response(
        JSON.stringify({ status: "ignored", reason: "not_missed_event", eventType: event.eventType }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const defaultTenantId = Deno.env.get("DEFAULT_TENANT_ID") || ""

    if (!supabaseUrl || !serviceRoleKey) {
      log.error({ event: "channel.call.config_error", error_reason: "missing_supabase_credentials" })
      return new Response(
        JSON.stringify({ status: "error", reason: "server_config" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // Resolve tenant by receiving number first.
    const tenant = await resolveTenantForCall(
      supabaseUrl,
      serviceAuthHeaders,
      event.receiver,
      defaultTenantId,
    )
    const tenantId = tenant?.id || null
    const tenantName = tenant?.name || "restauranten"

    if (!tenantId) {
      log.warn({
        event: "channel.call.ignored",
        reason: "no_tenant",
        caller: event.caller,
        receiver: event.receiver,
      })
      return new Response(
        JSON.stringify({ status: "ignored", reason: "no_tenant" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Idempotency check.
    const idemCheckRes = await fetch(
      `${supabaseUrl}/rest/v1/message_idempotency?select=id&channel=eq.call&external_message_id=eq.${encodeURIComponent(event.eventId)}&tenant_id=eq.${encodeURIComponent(tenantId)}&limit=1`,
      { headers: serviceAuthHeaders }
    )
    if (idemCheckRes.ok) {
      const idemRows = await idemCheckRes.json()
      if (idemRows.length > 0) {
        return new Response(
          JSON.stringify({ status: "duplicate", eventId: event.eventId }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }
    }

    // Find or create customer.
    let customerId: string | null = null
    const customerRes = await fetch(`${supabaseUrl}/rest/v1/rpc/get_or_create_customer`, {
      method: "POST",
      headers: serviceHeaders,
      body: JSON.stringify({ p_tenant_id: tenantId, p_phone: event.caller, p_email: null, p_name: null }),
    })
    if (customerRes.ok) {
      const customerData = await customerRes.json()
      customerId = Array.isArray(customerData) ? customerData[0]?.id : customerData?.id
    }

    if (!customerId) {
      const lookupRes = await fetch(
        `${supabaseUrl}/rest/v1/customers?phone=eq.${encodeURIComponent(event.caller)}&tenant_id=eq.${encodeURIComponent(tenantId)}&select=id&limit=1`,
        { headers: serviceAuthHeaders }
      )
      if (lookupRes.ok) {
        const existing = await lookupRes.json()
        if (existing.length > 0) {
          customerId = existing[0].id
        } else {
          const createRes = await fetch(`${supabaseUrl}/rest/v1/customers`, {
            method: "POST",
            headers: serviceHeaders,
            body: JSON.stringify({ tenant_id: tenantId, phone: event.caller }),
          })
          if (createRes.ok) {
            const created = await createRes.json()
            customerId = created[0]?.id || null
          }
        }
      }
    }

    if (!customerId) {
      return new Response(
        JSON.stringify({ status: "error", reason: "customer_lookup_failed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Find or create open SMS thread.
    let threadId: string | null = null
    const threadLookupRes = await fetch(
      `${supabaseUrl}/rest/v1/conversation_threads?tenant_id=eq.${encodeURIComponent(tenantId)}&customer_id=eq.${encodeURIComponent(customerId)}&channel=eq.sms&status=eq.open&order=created_at.desc&limit=1`,
      { headers: serviceAuthHeaders }
    )
    if (threadLookupRes.ok) {
      const threads = await threadLookupRes.json()
      if (threads.length > 0) {
        threadId = threads[0].id
        await fetch(`${supabaseUrl}/rest/v1/conversation_threads?id=eq.${threadId}`, {
          method: "PATCH",
          headers: { ...serviceHeaders, "Prefer": "return=minimal" },
          body: JSON.stringify({ last_message_at: event.receivedAt }),
        })
      }
    }

    if (!threadId) {
      const createThreadRes = await fetch(`${supabaseUrl}/rest/v1/conversation_threads`, {
        method: "POST",
        headers: serviceHeaders,
        body: JSON.stringify({
          tenant_id: tenantId,
          customer_id: customerId,
          channel: "sms",
          external_thread_id: event.caller,
          status: "open",
          last_message_at: event.receivedAt,
        }),
      })
      if (createThreadRes.ok) {
        const newThread = await createThreadRes.json()
        threadId = newThread[0]?.id || null
      }
    }

    // Mark idempotency before sending SMS to avoid duplicate "missed call" auto-messages.
    await fetch(`${supabaseUrl}/rest/v1/message_idempotency`, {
      method: "POST",
      headers: serviceHeaders,
      body: JSON.stringify({
        channel: "call",
        external_message_id: event.eventId,
        tenant_id: tenantId,
        thread_id: threadId,
      }),
    })

    // Log call event in thread.
    if (threadId) {
      await fetch(`${supabaseUrl}/rest/v1/thread_messages`, {
        method: "POST",
        headers: serviceHeaders,
        body: JSON.stringify({
          thread_id: threadId,
          direction: "inbound",
          sender_type: "system",
          content: "Missed call detected",
          message_type: "order_event",
          external_message_id: event.eventId,
          metadata: {
            event: "missed_call",
            event_type: event.eventType,
            phone: event.caller,
            receiver: event.receiver,
          },
          status: "sent",
          created_at: event.receivedAt,
        }),
      })
    }

    // Send auto SMS to start SMS workflow.
    const smsText = buildMissedCallSms(Deno.env.get("MISSED_CALL_SMS_TEMPLATE"), tenantName)
    const smsSender = getSmsSenderFromReceiver(event.receiver)

    let smsSent = false
    let smsError = ""
    let smsSid = ""

    try {
      const sendSmsRes = await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          to: event.caller,
          message: smsText,
          ...(smsSender ? { sender: smsSender } : {}),
          restaurantId: tenantId,
        }),
      })

      const sendSmsBody = await sendSmsRes.json()
      smsSent = !!sendSmsBody?.success
      smsSid = sendSmsBody?.sid || ""
      smsError = sendSmsBody?.error || ""
    } catch (err) {
      smsSent = false
      smsError = (err as Error).message
    }

    // Store outbound SMS in both thread_messages and messages for compatibility/UI visibility.
    if (threadId) {
      await fetch(`${supabaseUrl}/rest/v1/thread_messages`, {
        method: "POST",
        headers: serviceHeaders,
        body: JSON.stringify({
          thread_id: threadId,
          direction: "outbound",
          sender_type: "agent",
          content: smsText,
          message_type: "text",
          external_message_id: smsSid || `${event.eventId}-auto-sms`,
          metadata: {
            source: "receive-missed-call",
            auto_generated: true,
            receiver: event.receiver,
            provider: "inmobile",
          },
          status: smsSent ? "sent" : "failed",
          error_message: smsError || null,
        }),
      })
    }

    await fetch(`${supabaseUrl}/rest/v1/messages`, {
      method: "POST",
      headers: serviceHeaders,
      body: JSON.stringify({
        phone: event.caller,
        direction: "outbound",
        content: smsText,
        provider: "inmobile",
        receiver: event.receiver,
        raw_payload: {
          source: "receive-missed-call",
          event_id: event.eventId,
          event_type: event.eventType,
          sms_sent: smsSent,
          sms_sid: smsSid || null,
          sms_error: smsError || null,
        },
        created_at: new Date().toISOString(),
      }),
    })

    const duration = Date.now() - startTime
    log.info({
      event: "channel.call.processed",
      caller: event.caller,
      receiver: event.receiver,
      thread_id: threadId,
      sms_sent: smsSent,
      duration_ms: duration,
    })

    return new Response(
      JSON.stringify({
        status: "ok",
        eventId: event.eventId,
        threadId,
        smsSent,
        smsError: smsError || null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    const duration = Date.now() - startTime
    log.error({
      event: "channel.call.error",
      error_reason: (err as Error).message,
      stack: (err as Error).stack,
      duration_ms: duration,
    })
    return new Response(
      JSON.stringify({ status: "error", message: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
