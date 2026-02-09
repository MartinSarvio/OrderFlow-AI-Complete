/**
 * Tests for Edge Function CORS and Rate Limiting configuration
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Read the CORS module source
const corsSource = readFileSync(resolve(__dirname, '../supabase/functions/_shared/cors.ts'), 'utf-8')

// Extract ALLOWED_ORIGINS from source
const originsMatch = corsSource.match(/ALLOWED_ORIGINS\s*=\s*\[([\s\S]*?)\]/)
const originsBlock = originsMatch ? originsMatch[1] : ''
const allowedOrigins = originsBlock
  .match(/'([^']+)'/g)
  ?.map(s => s.replace(/'/g, '')) || []

describe('CORS Configuration', () => {
  it('includes production Vercel domain', () => {
    expect(allowedOrigins).toContain('https://flow-lime-rho.vercel.app')
  })

  it('includes production domain', () => {
    expect(allowedOrigins).toContain('https://orderflow.dk')
  })

  it('includes www production domain', () => {
    expect(allowedOrigins).toContain('https://www.orderflow.dk')
  })

  it('includes localhost for development', () => {
    expect(allowedOrigins.some(o => o.includes('localhost'))).toBe(true)
  })

  it('does NOT include wildcard *', () => {
    expect(allowedOrigins).not.toContain('*')
  })

  it('has at least 3 origins configured', () => {
    expect(allowedOrigins.length).toBeGreaterThanOrEqual(3)
  })
})

describe('CORS Module Exports', () => {
  it('exports getCorsHeaders function', () => {
    expect(corsSource).toContain('export function getCorsHeaders')
  })

  it('exports handleCorsPreflightResponse function', () => {
    expect(corsSource).toContain('export function handleCorsPreflightResponse')
  })

  it('checks Origin header', () => {
    expect(corsSource).toContain("req.headers.get('Origin')")
  })

  it('sets Vary header for allowed origins', () => {
    expect(corsSource).toContain("'Vary': 'Origin'")
  })
})

// Rate Limiting tests
const rateLimitSource = readFileSync(resolve(__dirname, '../supabase/functions/_shared/rate-limit.ts'), 'utf-8')
const smsSource = readFileSync(resolve(__dirname, '../supabase/functions/send-sms/index.ts'), 'utf-8')
const emailSource = readFileSync(resolve(__dirname, '../supabase/functions/send-otp-email/index.ts'), 'utf-8')
const aiChatSource = readFileSync(resolve(__dirname, '../supabase/functions/ai-chat/index.ts'), 'utf-8')

describe('Rate Limit Module', () => {
  it('exports checkRateLimit function', () => {
    expect(rateLimitSource).toContain('export function checkRateLimit')
  })

  it('exports getClientIP function', () => {
    expect(rateLimitSource).toContain('export function getClientIP')
  })

  it('checks x-forwarded-for header', () => {
    expect(rateLimitSource).toContain('x-forwarded-for')
  })

  it('returns allowed, remaining, retryAfterMs', () => {
    expect(rateLimitSource).toContain('allowed')
    expect(rateLimitSource).toContain('remaining')
    expect(rateLimitSource).toContain('retryAfterMs')
  })
})

describe('Rate Limiting in Edge Functions', () => {
  it('send-sms imports rate limiter', () => {
    expect(smsSource).toContain("from \"../_shared/rate-limit.ts\"")
  })

  it('send-sms has rate limit of 5/min', () => {
    expect(smsSource).toContain('SMS_RATE_LIMIT = 5')
  })

  it('send-sms returns 429 on limit', () => {
    expect(smsSource).toContain('status: 429')
  })

  it('send-otp-email imports rate limiter', () => {
    expect(emailSource).toContain("from \"../_shared/rate-limit.ts\"")
  })

  it('send-otp-email has rate limit of 5/min', () => {
    expect(emailSource).toContain('EMAIL_RATE_LIMIT = 5')
  })

  it('send-otp-email returns 429 on limit', () => {
    expect(emailSource).toContain('status: 429')
  })

  it('ai-chat uses shared rate limiter', () => {
    expect(aiChatSource).toContain("from '../_shared/rate-limit.ts'")
  })

  it('ai-chat has rate limit of 50/min', () => {
    expect(aiChatSource).toContain('AI_RATE_LIMIT = 50')
  })
})
