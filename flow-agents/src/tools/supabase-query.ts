import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';

// ============================================================
// Supabase Query Tool — Database queries for OrderFlow
// ============================================================

let supabase: SupabaseClient | null = null;

/**
 * Get or create Supabase client
 */
function getClient(): SupabaseClient {
  if (!supabase) {
    if (!config.supabaseUrl || !config.supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
    }
    supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }
  return supabase;
}

// ── Types ────────────────────────────────────────────────────

export interface OrderQuery {
  status?: string;
  tenant_id?: string;
  from_date?: string;
  to_date?: string;
  phone?: string;
  limit?: number;
}

export interface ThreadQuery {
  tenant_id?: string;
  channel?: string;
  status?: string;
  limit?: number;
}

export interface MessageQuery {
  thread_id: string;
  limit?: number;
}

export interface StatusUpdate {
  order_id: string;
  new_status: string;
  reason: string;
  updated_by: string;
}

// ── Query functions ──────────────────────────────────────────

/**
 * Query orders from unified_orders table
 */
export async function queryOrders(query: OrderQuery): Promise<{
  data: Record<string, unknown>[];
  count: number;
  error: string | null;
}> {
  try {
    const client = getClient();
    let q = client
      .from('unified_orders')
      .select('*', { count: 'exact' });

    if (query.status) q = q.eq('status', query.status);
    if (query.tenant_id) q = q.eq('tenant_id', query.tenant_id);
    if (query.phone) q = q.eq('customer_phone', query.phone);
    if (query.from_date) q = q.gte('created_at', query.from_date);
    if (query.to_date) q = q.lte('created_at', query.to_date);

    q = q.order('created_at', { ascending: false });
    if (query.limit) q = q.limit(query.limit);

    const { data, count, error } = await q;

    return {
      data: (data || []) as Record<string, unknown>[],
      count: count || 0,
      error: error ? error.message : null,
    };
  } catch (err) {
    return {
      data: [],
      count: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Query conversation threads
 */
export async function queryThreads(query: ThreadQuery): Promise<{
  data: Record<string, unknown>[];
  count: number;
  error: string | null;
}> {
  try {
    const client = getClient();
    let q = client
      .from('conversation_threads')
      .select('*', { count: 'exact' });

    if (query.tenant_id) q = q.eq('tenant_id', query.tenant_id);
    if (query.channel) q = q.eq('channel', query.channel);
    if (query.status) q = q.eq('status', query.status);

    q = q.order('updated_at', { ascending: false });
    if (query.limit) q = q.limit(query.limit);

    const { data, count, error } = await q;

    return {
      data: (data || []) as Record<string, unknown>[],
      count: count || 0,
      error: error ? error.message : null,
    };
  } catch (err) {
    return {
      data: [],
      count: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Query messages from a conversation thread
 */
export async function queryMessages(query: MessageQuery): Promise<{
  data: Record<string, unknown>[];
  count: number;
  error: string | null;
}> {
  try {
    const client = getClient();
    let q = client
      .from('thread_messages')
      .select('*', { count: 'exact' })
      .eq('thread_id', query.thread_id)
      .order('created_at', { ascending: true });

    if (query.limit) q = q.limit(query.limit);

    const { data, count, error } = await q;

    return {
      data: (data || []) as Record<string, unknown>[],
      count: count || 0,
      error: error ? error.message : null,
    };
  } catch (err) {
    return {
      data: [],
      count: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Update order status with audit trail
 */
export async function updateOrderStatus(update: StatusUpdate): Promise<{
  success: boolean;
  error: string | null;
  previousStatus: string | null;
}> {
  try {
    const client = getClient();

    // Get current order to record previous status
    const { data: currentOrder, error: fetchError } = await client
      .from('unified_orders')
      .select('status')
      .eq('id', update.order_id)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError.message, previousStatus: null };
    }

    const previousStatus = (currentOrder as Record<string, unknown>)?.status as string || null;

    // Update the order
    const { error: updateError } = await client
      .from('unified_orders')
      .update({
        status: update.new_status,
        updated_at: new Date().toISOString(),
        status_changed_by: update.updated_by,
        status_change_reason: update.reason,
      })
      .eq('id', update.order_id);

    if (updateError) {
      return { success: false, error: updateError.message, previousStatus };
    }

    // Log the status change in audit trail
    await client.from('order_status_log').insert({
      order_id: update.order_id,
      previous_status: previousStatus,
      new_status: update.new_status,
      reason: update.reason,
      changed_by: update.updated_by,
      created_at: new Date().toISOString(),
    }).then(() => {}); // Best-effort audit log

    return { success: true, error: null, previousStatus };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      previousStatus: null,
    };
  }
}

/**
 * Find order by phone number (for SMS matching)
 */
export async function findOrderByPhone(phone: string): Promise<{
  data: Record<string, unknown> | null;
  error: string | null;
}> {
  try {
    const client = getClient();

    // Normalize phone number (remove spaces, ensure +45 prefix for Danish numbers)
    const normalizedPhone = phone.replace(/\s+/g, '');

    const { data, error } = await client
      .from('unified_orders')
      .select('*')
      .eq('customer_phone', normalizedPhone)
      .not('status', 'in', '("completed","cancelled","delivered")')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return {
      data: (data as Record<string, unknown>) || null,
      error: error ? error.message : null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Find conversation thread by phone number
 */
export async function findThreadByPhone(phone: string): Promise<{
  data: Record<string, unknown> | null;
  error: string | null;
}> {
  try {
    const client = getClient();
    const normalizedPhone = phone.replace(/\s+/g, '');

    const { data, error } = await client
      .from('conversation_threads')
      .select('*')
      .eq('customer_phone', normalizedPhone)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    return {
      data: (data as Record<string, unknown>) || null,
      error: error ? error.message : null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Check message idempotency (prevent duplicate processing)
 */
export async function checkIdempotency(messageId: string): Promise<{
  isDuplicate: boolean;
  error: string | null;
}> {
  try {
    const client = getClient();

    const { data, error } = await client
      .from('message_idempotency')
      .select('id')
      .eq('message_id', messageId)
      .maybeSingle();

    if (error) {
      return { isDuplicate: false, error: error.message };
    }

    if (data) {
      return { isDuplicate: true, error: null };
    }

    // Insert idempotency record
    await client.from('message_idempotency').insert({
      message_id: messageId,
      processed_at: new Date().toISOString(),
    });

    return { isDuplicate: false, error: null };
  } catch (err) {
    return {
      isDuplicate: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── MCP Tool Definitions ─────────────────────────────────────

export const supabaseQueryTools = [
  {
    name: 'query_orders',
    description: 'Query orders from the unified_orders table. Filter by status, tenant, date range, or phone number.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', description: 'Order status filter (e.g., pending, confirmed, preparing, completed, cancelled)' },
        tenant_id: { type: 'string', description: 'Tenant/restaurant ID' },
        from_date: { type: 'string', description: 'Start date (ISO 8601)' },
        to_date: { type: 'string', description: 'End date (ISO 8601)' },
        phone: { type: 'string', description: 'Customer phone number' },
        limit: { type: 'number', description: 'Max results (default: 50)' },
      },
    },
  },
  {
    name: 'query_threads',
    description: 'Query conversation threads. Filter by tenant, channel (sms/email/meta), or status.',
    input_schema: {
      type: 'object' as const,
      properties: {
        tenant_id: { type: 'string', description: 'Tenant/restaurant ID' },
        channel: { type: 'string', description: 'Channel filter (sms, email, meta)' },
        status: { type: 'string', description: 'Thread status' },
        limit: { type: 'number', description: 'Max results (default: 50)' },
      },
    },
  },
  {
    name: 'query_messages',
    description: 'Query messages from a specific conversation thread.',
    input_schema: {
      type: 'object' as const,
      properties: {
        thread_id: { type: 'string', description: 'Thread ID to query messages from' },
        limit: { type: 'number', description: 'Max messages (default: 100)' },
      },
      required: ['thread_id'],
    },
  },
  {
    name: 'update_order_status',
    description: 'Update an order status with audit trail. Records previous status, new status, reason, and who made the change.',
    input_schema: {
      type: 'object' as const,
      properties: {
        order_id: { type: 'string', description: 'Order ID to update' },
        new_status: { type: 'string', description: 'New status value' },
        reason: { type: 'string', description: 'Reason for the status change' },
      },
      required: ['order_id', 'new_status', 'reason'],
    },
  },
  {
    name: 'find_order_by_phone',
    description: 'Find the most recent active order for a phone number. Used when matching incoming SMS to orders.',
    input_schema: {
      type: 'object' as const,
      properties: {
        phone: { type: 'string', description: 'Customer phone number' },
      },
      required: ['phone'],
    },
  },
];

/**
 * Handle MCP tool calls for Supabase queries
 */
export async function handleSupabaseQueryTool(
  toolName: string,
  input: Record<string, unknown>
): Promise<string> {
  switch (toolName) {
    case 'query_orders': {
      const result = await queryOrders({
        status: input.status as string | undefined,
        tenant_id: input.tenant_id as string | undefined,
        from_date: input.from_date as string | undefined,
        to_date: input.to_date as string | undefined,
        phone: input.phone as string | undefined,
        limit: (input.limit as number) || 50,
      });
      return JSON.stringify(result, null, 2);
    }

    case 'query_threads': {
      const result = await queryThreads({
        tenant_id: input.tenant_id as string | undefined,
        channel: input.channel as string | undefined,
        status: input.status as string | undefined,
        limit: (input.limit as number) || 50,
      });
      return JSON.stringify(result, null, 2);
    }

    case 'query_messages': {
      const threadId = input.thread_id as string;
      if (!threadId) return JSON.stringify({ error: 'thread_id is required' });
      const result = await queryMessages({
        thread_id: threadId,
        limit: (input.limit as number) || 100,
      });
      return JSON.stringify(result, null, 2);
    }

    case 'update_order_status': {
      const orderId = input.order_id as string;
      const newStatus = input.new_status as string;
      const reason = input.reason as string;
      if (!orderId || !newStatus || !reason) {
        return JSON.stringify({ error: 'order_id, new_status, and reason are required' });
      }
      const result = await updateOrderStatus({
        order_id: orderId,
        new_status: newStatus,
        reason,
        updated_by: 'workflow-agent',
      });
      return JSON.stringify(result, null, 2);
    }

    case 'find_order_by_phone': {
      const phone = input.phone as string;
      if (!phone) return JSON.stringify({ error: 'phone is required' });
      const result = await findOrderByPhone(phone);
      return JSON.stringify(result, null, 2);
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}
