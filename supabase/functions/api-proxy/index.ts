// =====================================================
// FLOW API Proxy Edge Function
// v4.12.0 Security Sprint 1
// 
// Proxies API calls to third-party services using
// server-side stored API keys. Frontend NEVER sends
// API keys directly to external services.
// =====================================================

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Service endpoints configuration
const SERVICE_CONFIG: Record<string, { baseUrl: string; keyName: string; authHeader: string }> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    keyName: 'openai_key',
    authHeader: 'Bearer',
  },
  firecrawl: {
    baseUrl: 'https://api.firecrawl.dev/v2',
    keyName: 'firecrawl_api_key',
    authHeader: 'Bearer',
  },
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    keyName: 'openrouter_key',
    authHeader: 'Bearer',
  },
  serper: {
    baseUrl: 'https://google.serper.dev',
    keyName: 'serper_api_key',
    authHeader: 'Bearer',
  },
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify user from JWT
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    const { service, endpoint, payload } = await req.json()

    if (!service || !endpoint) {
      return new Response(JSON.stringify({ error: 'Missing service or endpoint' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const config = SERVICE_CONFIG[service]
    if (!config) {
      return new Response(JSON.stringify({ error: `Unknown service: ${service}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get API key from api_credentials table
    const { data: cred, error: credError } = await supabase
      .from('api_credentials')
      .select('key_value')
      .eq('user_id', user.id)
      .eq('key_name', config.keyName)
      .single()

    if (credError || !cred?.key_value) {
      // Also check environment variables as fallback
      const envKey = Deno.env.get(config.keyName.toUpperCase())
      if (!envKey) {
        return new Response(JSON.stringify({ error: `API key not configured for ${service}. Set it in Settings → API Access.` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      // Use env key
      var apiKey = envKey
    } else {
      var apiKey = cred.key_value
    }

    // Make the proxied request
    const targetUrl = `${config.baseUrl}${endpoint}`
    const proxyResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${config.authHeader} ${apiKey}`,
        ...(service === 'openrouter' ? {
          'HTTP-Referer': 'https://flow.dk',
          'X-Title': 'FLOW App',
        } : {}),
      },
      body: JSON.stringify(payload),
    })

    const responseData = await proxyResponse.json()

    return new Response(JSON.stringify(responseData), {
      status: proxyResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('API Proxy error:', err)
    return new Response(JSON.stringify({ error: 'Internal proxy error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
