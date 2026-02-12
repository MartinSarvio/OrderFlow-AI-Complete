import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getCorsHeaders, handleCorsPreflightResponse } from "../_shared/cors.ts"
import { createRequestLogger } from "../_shared/logger.ts"

/**
 * e-conomic Proxy Edge Function
 * 
 * Routes frontend requests to e-conomic REST API server-side.
 * API credentials are stored in Supabase (api_credentials or integration_connections)
 * and NEVER exposed to the browser.
 *
 * Supported actions:
 *   - test-connection: Validate credentials by calling /self
 *   - list-customers: List customers with pagination
 *   - get-customer: Get single customer by number
 *   - list-invoices: List booked invoices
 *   - list-draft-invoices: List draft invoices
 *   - list-products: List products
 *   - get-company: Get company/self info
 *   - sync-status: Get sync metadata from integration_connections
 *   - custom: Forward arbitrary e-conomic API request
 */

const ECONOMIC_BASE_URL = "https://restapi.e-conomic.com"

interface EconomicCredentials {
  appSecretToken: string
  agreementGrantToken: string
}

async function getCredentials(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string
): Promise<EconomicCredentials | null> {
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Try api_credentials table first
  const { data: creds } = await supabase
    .from("api_credentials")
    .select("credentials")
    .eq("user_id", userId)
    .eq("system", "economic")
    .single()

  if (creds?.credentials) {
    return {
      appSecretToken: creds.credentials.appSecret || creds.credentials.appSecretToken || "",
      agreementGrantToken: creds.credentials.agreementToken || creds.credentials.agreementGrantToken || "",
    }
  }

  // Fallback: integration_configs table
  const { data: configs } = await supabase
    .from("integration_configs")
    .select("config")
    .eq("user_id", userId)
    .eq("integration_name", "economic")
    .single()

  if (configs?.config?.credentials) {
    return {
      appSecretToken: configs.config.credentials.appSecret || configs.config.credentials.appSecretToken || "",
      agreementGrantToken: configs.config.credentials.agreementToken || configs.config.credentials.agreementGrantToken || "",
    }
  }

  // Fallback: integration_connections table
  const { data: conn } = await supabase
    .from("integration_connections")
    .select("config")
    .eq("user_id", userId)
    .eq("system", "economic")
    .single()

  if (conn?.config?.credentials) {
    return {
      appSecretToken: conn.config.credentials.appSecret || conn.config.credentials.appSecretToken || "",
      agreementGrantToken: conn.config.credentials.agreementToken || conn.config.credentials.agreementGrantToken || "",
    }
  }

  return null
}

async function economicRequest(
  method: string,
  endpoint: string,
  credentials: EconomicCredentials,
  body?: unknown,
  params?: Record<string, string>
): Promise<{ status: number; data: unknown }> {
  const url = new URL(endpoint, ECONOMIC_BASE_URL)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v))
  }

  const headers: Record<string, string> = {
    "X-AppSecretToken": credentials.appSecretToken,
    "X-AgreementGrantToken": credentials.agreementGrantToken,
    "Content-Type": "application/json",
  }

  const fetchOptions: RequestInit = { method, headers }
  if (body && ["POST", "PUT", "PATCH"].includes(method)) {
    fetchOptions.body = JSON.stringify(body)
  }

  const response = await fetch(url.toString(), fetchOptions)
  const data = response.status === 204 ? null : await response.json()

  return { status: response.status, data }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  const log = createRequestLogger(req, { module: "economic-proxy", channel: "integration" })

  if (req.method === "OPTIONS") {
    return handleCorsPreflightResponse(req)
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY")!
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!

    // Get user from JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const { action, ...params } = await req.json()

    log.info({ event: "economic_proxy.request", action, user_id: user.id })

    // Get credentials
    const credentials = await getCredentials(supabaseUrl, serviceRoleKey, user.id)
    if (!credentials && action !== "sync-status") {
      return new Response(
        JSON.stringify({ error: "e-conomic credentials not configured. Add them in Integrationer." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    let result: { status: number; data: unknown }

    switch (action) {
      case "test-connection": {
        result = await economicRequest("GET", "/self", credentials!)
        if (result.status === 200) {
          // Update integration_connections status
          const adminClient = createClient(supabaseUrl, serviceRoleKey)
          await adminClient.from("integration_connections").upsert({
            user_id: user.id,
            system: "economic",
            status: "connected",
            last_sync: new Date().toISOString(),
            last_sync_status: "success",
            config: { company: (result.data as any)?.company?.name },
          }, { onConflict: "user_id,system" })
        }
        break
      }

      case "get-company": {
        result = await economicRequest("GET", "/self", credentials!)
        break
      }

      case "list-customers": {
        const qp: Record<string, string> = {
          pagesize: String(params.pageSize || 100),
          skippages: String(params.skipPages || 0),
        }
        if (params.filter) qp.filter = params.filter
        result = await economicRequest("GET", "/customers", credentials!, undefined, qp)
        break
      }

      case "get-customer": {
        if (!params.customerNumber) {
          return new Response(
            JSON.stringify({ error: "customerNumber required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          )
        }
        result = await economicRequest("GET", `/customers/${params.customerNumber}`, credentials!)
        break
      }

      case "list-invoices": {
        const qp: Record<string, string> = {
          pagesize: String(params.pageSize || 100),
          skippages: String(params.skipPages || 0),
        }
        result = await economicRequest("GET", "/invoices/booked", credentials!, undefined, qp)
        break
      }

      case "list-draft-invoices": {
        const qp: Record<string, string> = {
          pagesize: String(params.pageSize || 100),
          skippages: String(params.skipPages || 0),
        }
        result = await economicRequest("GET", "/invoices/drafts", credentials!, undefined, qp)
        break
      }

      case "list-products": {
        const qp: Record<string, string> = {
          pagesize: String(params.pageSize || 100),
          skippages: String(params.skipPages || 0),
        }
        result = await economicRequest("GET", "/products", credentials!, undefined, qp)
        break
      }

      case "sync-status": {
        const adminClient = createClient(supabaseUrl, serviceRoleKey)
        const { data: conn } = await adminClient
          .from("integration_connections")
          .select("*")
          .eq("user_id", user.id)
          .eq("system", "economic")
          .single()

        return new Response(
          JSON.stringify({ success: true, connection: conn }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      case "custom": {
        if (!params.method || !params.endpoint) {
          return new Response(
            JSON.stringify({ error: "method and endpoint required for custom action" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          )
        }
        result = await economicRequest(
          params.method,
          params.endpoint,
          credentials!,
          params.body,
          params.queryParams
        )
        break
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    }

    const success = result!.status >= 200 && result!.status < 300
    log.info({
      event: "economic_proxy.response",
      action,
      economic_status: result!.status,
      success,
    })

    return new Response(
      JSON.stringify({ success, data: result!.data, status: result!.status }),
      {
        status: success ? 200 : result!.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    log.error({
      event: "economic_proxy.error",
      error_reason: (error as Error).message,
    })
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
