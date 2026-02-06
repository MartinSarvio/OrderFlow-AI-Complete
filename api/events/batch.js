/**
 * FLOW Analytics Events Batch API
 *
 * Receives batched analytics events and stores them in Supabase.
 * Handles sessions, events, and page views.
 *
 * POST /api/events/batch
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Parse user agent for device info
 */
function parseUserAgent(userAgent) {
    if (!userAgent) return { device_type: 'unknown', browser: null, os: null };

    const ua = userAgent.toLowerCase();

    // Device type
    let device_type = 'desktop';
    if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua)) {
        device_type = /ipad|tablet/i.test(ua) ? 'tablet' : 'mobile';
    }

    // Browser
    let browser = null;
    if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('edg')) browser = 'Edge';
    else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';

    // OS
    let os = null;
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac os') || ua.includes('macos')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

    return { device_type, browser, os };
}

/**
 * Extract UTM parameters from URL
 */
function extractUTMParams(url) {
    try {
        const urlObj = new URL(url);
        return {
            utm_source: urlObj.searchParams.get('utm_source'),
            utm_medium: urlObj.searchParams.get('utm_medium'),
            utm_campaign: urlObj.searchParams.get('utm_campaign'),
            utm_term: urlObj.searchParams.get('utm_term'),
            utm_content: urlObj.searchParams.get('utm_content'),
        };
    } catch {
        return {};
    }
}

/**
 * Get or create session
 */
async function getOrCreateSession(sessionId, visitorId, restaurantId, event, userAgent) {
    if (!sessionId) return null;

    // Check if session exists
    const { data: existingSession } = await supabase
        .from('sessions')
        .select('id')
        .eq('session_id', sessionId)
        .single();

    if (existingSession) {
        // Update session metrics
        await supabase
            .from('sessions')
            .update({
                page_views: supabase.rpc('increment', { row_id: existingSession.id, column: 'page_views' }),
                events_count: supabase.rpc('increment', { row_id: existingSession.id, column: 'events_count' }),
            })
            .eq('session_id', sessionId);

        return existingSession.id;
    }

    // Create new session
    const deviceInfo = parseUserAgent(userAgent);
    const utmParams = extractUTMParams(event.page_url || '');

    const { data: newSession, error } = await supabase
        .from('sessions')
        .insert({
            session_id: sessionId,
            visitor_id: visitorId,
            restaurant_id: restaurantId,
            ...deviceInfo,
            ...utmParams,
            referrer: event.event_data?.referrer || null,
            landing_page: event.page_path || event.event_data?.landing_page || null,
            page_views: 1,
            events_count: 1,
        })
        .select('id')
        .single();

    if (error) {
        console.error('Failed to create session:', error);
        return null;
    }

    return newSession.id;
}

/**
 * Store event in database
 */
async function storeEvent(event) {
    const { data, error } = await supabase.from('events').insert({
        restaurant_id: event.restaurant_id || null,
        session_id: event.session_id || null,
        event_name: event.event_name,
        event_category: event.event_category || 'other',
        event_data: event.event_data || {},
        page_url: event.page_url,
        page_path: event.page_path,
        page_title: event.page_title,
        element_id: event.event_data?.element_id,
        element_class: event.event_data?.element_class,
        element_text: event.event_data?.element_text,
        element_tag: event.event_data?.element_tag,
        viewport_x: event.event_data?.viewport_x,
        viewport_y: event.event_data?.viewport_y,
        page_x: event.event_data?.page_x,
        page_y: event.event_data?.page_y,
        timestamp: event.timestamp || new Date().toISOString(),
        time_on_page_ms: event.event_data?.time_on_page_ms,
    });

    if (error) {
        console.error('Failed to store event:', error);
        return false;
    }

    return true;
}

/**
 * Store page view
 */
async function storePageView(event) {
    if (event.event_name !== 'page_view') return;

    const { error } = await supabase.from('page_views').insert({
        restaurant_id: event.restaurant_id || null,
        session_id: event.session_id || null,
        page_url: event.page_url,
        page_path: event.page_path,
        page_title: event.page_title,
        entered_at: event.timestamp || new Date().toISOString(),
    });

    if (error) {
        console.error('Failed to store page view:', error);
    }
}

/**
 * Update page view exit
 */
async function updatePageViewExit(event) {
    if (event.event_name !== 'page_exit') return;

    const { error } = await supabase
        .from('page_views')
        .update({
            exited_at: event.timestamp || new Date().toISOString(),
            time_on_page_ms: event.event_data?.time_on_page_ms,
            max_scroll_depth_percent: event.event_data?.max_scroll_depth_pct,
        })
        .eq('session_id', event.session_id)
        .eq('page_path', event.event_data?.page_path)
        .is('exited_at', null);

    if (error) {
        console.error('Failed to update page view exit:', error);
    }
}

/**
 * Process ecommerce events for daily metrics
 */
async function processEcommerceEvent(event) {
    if (event.event_name !== 'checkout_completed') return;

    const restaurantId = event.restaurant_id;
    if (!restaurantId) return;

    const today = new Date().toISOString().split('T')[0];

    // Update daily metrics
    const { error } = await supabase.rpc('increment_daily_metric', {
        p_restaurant_id: restaurantId,
        p_date: today,
        p_metric: 'total_orders',
        p_amount: 1,
    });

    if (error) {
        console.error('Failed to update daily metrics:', error);
    }
}

/**
 * Main handler
 */
export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(200).set(corsHeaders).end();
        return;
    }

    // Only allow POST
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { events, metadata } = req.body;

        if (!events || !Array.isArray(events)) {
            res.status(400).json({ error: 'Invalid request: events array required' });
            return;
        }

        const userAgent = req.headers['user-agent'];
        const results = {
            received: events.length,
            processed: 0,
            errors: 0,
        };

        // Process each event
        for (const event of events) {
            try {
                // Ensure session exists
                if (event.session_id && metadata?.visitor_id) {
                    await getOrCreateSession(
                        event.session_id,
                        metadata.visitor_id,
                        event.restaurant_id,
                        event,
                        userAgent
                    );
                }

                // Store event
                const stored = await storeEvent(event);
                if (stored) {
                    results.processed++;

                    // Additional processing based on event type
                    await storePageView(event);
                    await updatePageViewExit(event);
                    await processEcommerceEvent(event);
                } else {
                    results.errors++;
                }
            } catch (err) {
                console.error('Error processing event:', err);
                results.errors++;
            }
        }

        res.status(200).set(corsHeaders).json({
            success: true,
            ...results,
        });
    } catch (error) {
        console.error('Event batch API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
