/**
 * FLOW AI Chat Edge Function
 *
 * Proxies AI chat requests to Claude API (primary) with OpenAI as fallback.
 * Keeps API keys server-side. Rate limited per restaurant.
 *
 * POST /functions/v1/ai-chat
 * Body: { systemPrompt, messages, restaurantId, maxTokens? }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightResponse } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { verifyAuth, verifyRestaurantOwnership } from '../_shared/auth.ts'

const AI_RATE_LIMIT = 50 // requests per minute per restaurant

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightResponse(req)
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { systemPrompt, messages, restaurantId, maxTokens } = await req.json()

    // Validate required fields
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages array is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!restaurantId) {
      return new Response(JSON.stringify({ error: 'restaurantId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify auth and restaurant ownership
    const auth = await verifyAuth(req)
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const ownsRestaurant = await verifyRestaurantOwnership(auth.userId, restaurantId)
    if (!ownsRestaurant) {
      return new Response(JSON.stringify({ error: 'Not authorized for this restaurant' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Rate limit check
    const { allowed, retryAfterMs } = checkRateLimit(`ai:${restaurantId}`, AI_RATE_LIMIT)
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again in a minute.' }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil(retryAfterMs / 1000)),
        },
      })
    }

    // Try Claude API first
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

    let aiResponse: string | null = null
    let provider = 'none'

    if (anthropicApiKey) {
      aiResponse = await callClaude(anthropicApiKey, systemPrompt, messages, maxTokens)
      provider = 'claude'
    }

    // Fallback to OpenAI if Claude failed or not configured
    if (!aiResponse && openaiApiKey) {
      aiResponse = await callOpenAI(openaiApiKey, systemPrompt, messages, maxTokens)
      provider = 'openai'
    }

    if (!aiResponse) {
      console.error('No AI provider available or all failed')
      return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Log usage (non-blocking)
    logUsage(restaurantId, provider, messages.length).catch(console.error)

    return new Response(JSON.stringify({ response: aiResponse, provider }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('AI chat error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

/**
 * Call Claude API (Anthropic Messages API)
 */
async function callClaude(
  apiKey: string,
  systemPrompt: string | undefined,
  messages: Array<{ role: string; content: string }>,
  maxTokens?: number
): Promise<string | null> {
  try {
    const body: Record<string, unknown> = {
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: maxTokens || 1024,
      messages: messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    }

    if (systemPrompt) {
      body.system = systemPrompt
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Claude API error:', response.status, errorData)
      return null
    }

    const data = await response.json()
    return data.content?.[0]?.text || null
  } catch (err) {
    console.error('Claude API call failed:', err)
    return null
  }
}

/**
 * Call OpenAI Chat Completions API (fallback)
 */
async function callOpenAI(
  apiKey: string,
  systemPrompt: string | undefined,
  messages: Array<{ role: string; content: string }>,
  maxTokens?: number
): Promise<string | null> {
  try {
    const openaiMessages: Array<{ role: string; content: string }> = []

    if (systemPrompt) {
      openaiMessages.push({ role: 'system', content: systemPrompt })
    }

    messages.forEach((m) => {
      openaiMessages.push({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })
    })

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        max_tokens: maxTokens || 1024,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API error:', response.status, errorData)
      return null
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || null
  } catch (err) {
    console.error('OpenAI API call failed:', err)
    return null
  }
}

/**
 * Log AI usage to system_logs (non-blocking)
 */
async function logUsage(restaurantId: string, provider: string, messageCount: number) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !supabaseServiceKey) return

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    await supabase.from('system_logs').insert({
      log_level: 'info',
      log_category: 'ai',
      service: 'ai-chat',
      message: `AI chat response generated via ${provider}`,
      details: {
        restaurant_id: restaurantId,
        provider,
        message_count: messageCount,
      },
    })
  } catch {
    // Non-critical, ignore
  }
}
