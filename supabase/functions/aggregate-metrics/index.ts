/**
 * FLOW Daily Metrics Aggregation Function
 *
 * Aggregates daily metrics for all active restaurants.
 * Should be run daily via pg_cron or scheduled trigger.
 *
 * Invocation: POST /functions/v1/aggregate-metrics
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Get date parameter (default to yesterday)
        const url = new URL(req.url);
        const dateParam = url.searchParams.get('date');
        const targetDate = dateParam || getYesterdayDate();

        console.log(`Aggregating metrics for date: ${targetDate}`);

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get all active restaurants
        const { data: restaurants, error: restaurantsError } = await supabase
            .from('restaurants')
            .select('id')
            .eq('status', 'active');

        if (restaurantsError) {
            throw new Error(`Failed to fetch restaurants: ${restaurantsError.message}`);
        }

        console.log(`Processing ${restaurants?.length || 0} restaurants`);

        const results = {
            date: targetDate,
            processed: 0,
            errors: 0,
            details: [] as any[],
        };

        // Process each restaurant
        for (const restaurant of restaurants || []) {
            try {
                const metrics = await aggregateRestaurantMetrics(supabase, restaurant.id, targetDate);
                results.processed++;
                results.details.push({
                    restaurant_id: restaurant.id,
                    success: true,
                    metrics: {
                        total_orders: metrics.total_orders,
                        total_revenue: metrics.total_revenue,
                    },
                });
            } catch (err) {
                console.error(`Error processing restaurant ${restaurant.id}:`, err);
                results.errors++;
                results.details.push({
                    restaurant_id: restaurant.id,
                    success: false,
                    error: err.message,
                });
            }
        }

        // Log completion
        await supabase.from('system_logs').insert({
            log_level: 'info',
            log_category: 'maintenance',
            service: 'aggregate-metrics',
            message: `Daily metrics aggregation completed for ${targetDate}`,
            details: {
                date: targetDate,
                restaurants_processed: results.processed,
                errors: results.errors,
            },
        });

        return new Response(JSON.stringify(results), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        console.error('Aggregation error:', error);

        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});

/**
 * Get yesterday's date in YYYY-MM-DD format
 */
function getYesterdayDate(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
}

/**
 * Aggregate metrics for a single restaurant
 */
async function aggregateRestaurantMetrics(
    supabase: any,
    restaurantId: string,
    date: string
) {
    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;

    // Get order metrics
    const { data: orderData } = await supabase
        .from('orders')
        .select('total, status, metadata')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

    const orders = orderData || [];
    const completedOrders = orders.filter((o: any) => o.status !== 'cancelled');

    const totalRevenue = completedOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
    const totalOrders = completedOrders.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Count by fulfillment type
    const deliveryOrders = completedOrders.filter((o: any) => o.metadata?.fulfillment_type === 'delivery').length;
    const pickupOrders = completedOrders.filter((o: any) => o.metadata?.fulfillment_type === 'pickup').length;
    const dineInOrders = completedOrders.filter((o: any) => o.metadata?.fulfillment_type === 'dine_in').length;

    // Get session metrics
    const { data: sessionData } = await supabase
        .from('sessions')
        .select('id, visitor_id, duration_seconds, page_views')
        .eq('restaurant_id', restaurantId)
        .gte('started_at', startOfDay)
        .lte('started_at', endOfDay);

    const sessions = sessionData || [];
    const totalSessions = sessions.length;
    const uniqueVisitors = new Set(sessions.map((s: any) => s.visitor_id)).size;
    const totalPageViews = sessions.reduce((sum: number, s: any) => sum + (s.page_views || 0), 0);

    // Calculate avg session duration
    const sessionsWithDuration = sessions.filter((s: any) => s.duration_seconds > 0);
    const avgSessionDuration = sessionsWithDuration.length > 0
        ? Math.round(sessionsWithDuration.reduce((sum: number, s: any) => sum + s.duration_seconds, 0) / sessionsWithDuration.length)
        : 0;

    // Calculate bounce rate (sessions with only 1 page view)
    const bouncedSessions = sessions.filter((s: any) => s.page_views <= 1).length;
    const bounceRate = totalSessions > 0 ? bouncedSessions / totalSessions : 0;

    // Get AI metrics
    const { data: aiData } = await supabase
        .from('ai_conversations')
        .select('id, outcome')
        .eq('restaurant_id', restaurantId)
        .gte('started_at', startOfDay)
        .lte('started_at', endOfDay);

    const aiConversations = aiData || [];
    const aiOrdersCreated = aiConversations.filter((c: any) => c.outcome === 'order_completed').length;
    const aiEscalations = aiConversations.filter((c: any) => c.outcome === 'escalated').length;
    const aiConversionRate = aiConversations.length > 0 ? aiOrdersCreated / aiConversations.length : 0;

    // Upsert daily metrics
    const metricsData = {
        restaurant_id: restaurantId,
        date: date,
        total_revenue: totalRevenue,
        total_orders: totalOrders,
        avg_order_value: avgOrderValue,
        orders_delivery: deliveryOrders,
        orders_pickup: pickupOrders,
        orders_dine_in: dineInOrders,
        unique_visitors: uniqueVisitors,
        total_sessions: totalSessions,
        total_page_views: totalPageViews,
        avg_session_duration_sec: avgSessionDuration,
        bounce_rate: bounceRate,
        ai_conversations: aiConversations.length,
        ai_orders_created: aiOrdersCreated,
        ai_conversion_rate: aiConversionRate,
        ai_escalations: aiEscalations,
        updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
        .from('daily_metrics')
        .upsert(metricsData, {
            onConflict: 'restaurant_id,date',
        });

    if (upsertError) {
        throw new Error(`Failed to upsert metrics: ${upsertError.message}`);
    }

    return metricsData;
}
