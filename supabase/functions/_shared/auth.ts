/**
 * Shared authentication helper for Edge Functions
 * Validates JWT tokens and extracts user identity.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface AuthResult {
  userId: string
  email?: string
}

/**
 * Verify the request's Authorization header against Supabase auth.
 * Returns the authenticated user or null if invalid/missing.
 */
export async function verifyAuth(req: Request): Promise<AuthResult | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.replace('Bearer ', '')

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    return null
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data?.user) return null

    return {
      userId: data.user.id,
      email: data.user.email,
    }
  } catch {
    return null
  }
}

/**
 * Check if a user owns a specific restaurant.
 */
export async function verifyRestaurantOwnership(
  userId: string,
  restaurantId: string
): Promise<boolean> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) return false

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data, error } = await supabase
      .from('restaurants')
      .select('id')
      .eq('id', restaurantId)
      .eq('user_id', userId)
      .maybeSingle()

    return !error && data !== null
  } catch {
    return false
  }
}
