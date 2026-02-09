/**
 * Shared rate limiting for Edge Functions
 * In-memory sliding window per key (IP, restaurantId, etc.)
 * Resets on cold start — sufficient for Deno Edge Functions.
 */

const store = new Map<string, { count: number; resetAt: number }>()

// Clean up expired entries periodically to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60_000
let lastCleanup = Date.now()

function cleanupExpired() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  cleanupExpired()

  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, retryAfterMs: 0 }
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.resetAt - now,
    }
  }

  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count, retryAfterMs: 0 }
}

export function getClientIP(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}
