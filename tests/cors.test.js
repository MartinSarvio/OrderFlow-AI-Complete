/**
 * Tests for Edge Function CORS configuration
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
