/**
 * Shared CORS configuration for Edge Functions
 * Restricts access to known FLOW app domains only.
 */

const ALLOWED_ORIGINS = [
  'https://flow-lime-rho.vercel.app',
  'https://orderflow.dk',
  'https://www.orderflow.dk',
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
]

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || ''
  const isAllowed = ALLOWED_ORIGINS.includes(origin)

  if (!isAllowed) {
    // Deny cross-origin access for unknown origins
    return {
      'Access-Control-Allow-Origin': 'null',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    }
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-trace-id, x-restaurant-id',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Vary': 'Origin',
  }
}

export function handleCorsPreflightResponse(req: Request): Response {
  return new Response('ok', { headers: getCorsHeaders(req) })
}
