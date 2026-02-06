/**
 * FLOW Analytics Tracker
 * Version: 1.0
 *
 * Comprehensive event tracking for FLOW platform.
 * Tracks page views, clicks, scrolls, checkout events, AI interactions, and more.
 */

(function(window) {
    'use strict';

    // =====================================================
    // CONFIGURATION
    // =====================================================

    const CONFIG = {
        // Batch settings
        BATCH_SIZE: 10,
        FLUSH_INTERVAL: 5000, // 5 seconds
        MAX_QUEUE_SIZE: 100,

        // Session settings
        SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
        SESSION_STORAGE_KEY: 'flow_session',
        VISITOR_STORAGE_KEY: 'flow_visitor_id',

        // API endpoint
        API_ENDPOINT: '/api/events/batch',

        // Event categories
        CATEGORIES: {
            ECOMMERCE: 'ecommerce',
            ENGAGEMENT: 'engagement',
            AI: 'ai',
            SOCIAL: 'social',
            SYSTEM: 'system',
            MARKETING: 'marketing',
            OTHER: 'other'
        },

        // Critical events that flush immediately
        CRITICAL_EVENTS: [
            'checkout_completed',
            'checkout_payment_failed',
            'ai_order_created',
            'system_error',
            'ai_escalation_triggered'
        ],

        // Debug mode
        DEBUG: false
    };

    // =====================================================
    // ANALYTICS TRACKER CLASS
    // =====================================================

    class AnalyticsTracker {
        constructor(options = {}) {
            this.restaurantId = options.restaurantId || null;
            this.enabled = options.enabled !== false;
            this.debug = options.debug || CONFIG.DEBUG;

            this.eventQueue = [];
            this.flushTimer = null;
            this.isInitialized = false;

            // Session & visitor
            this.sessionId = null;
            this.visitorId = null;
            this.sessionData = null;

            // Page tracking
            this.currentPage = null;
            this.pageEnterTime = null;
            this.maxScrollDepth = 0;

            // Tracking state
            this.trackingEnabled = {
                pageViews: true,
                clicks: true,
                scroll: true,
                forms: true,
                errors: true
            };

            if (this.enabled) {
                this.init();
            }
        }

        // =====================================================
        // INITIALIZATION
        // =====================================================

        init() {
            if (this.isInitialized) return;

            this.visitorId = this.getOrCreateVisitor();
            this.sessionId = this.getOrCreateSession();

            this.startFlushTimer();
            this.setupEventListeners();
            this.trackPageView();

            this.isInitialized = true;
            this.log('Analytics initialized', { visitorId: this.visitorId, sessionId: this.sessionId });
        }

        // Get or create anonymous visitor ID
        getOrCreateVisitor() {
            let visitorId = localStorage.getItem(CONFIG.VISITOR_STORAGE_KEY);
            if (!visitorId) {
                visitorId = 'v_' + this.generateUUID();
                localStorage.setItem(CONFIG.VISITOR_STORAGE_KEY, visitorId);
            }
            return visitorId;
        }

        // Get or create session
        getOrCreateSession() {
            let session = JSON.parse(sessionStorage.getItem(CONFIG.SESSION_STORAGE_KEY) || 'null');
            const now = Date.now();

            if (!session || (now - session.lastActivity) > CONFIG.SESSION_TIMEOUT) {
                // New session
                session = {
                    id: 's_' + this.generateUUID(),
                    startedAt: now,
                    lastActivity: now,
                    pageViews: 0,
                    events: 0
                };

                this.trackEvent('session_started', {
                    referrer: document.referrer,
                    landing_page: window.location.pathname
                }, CONFIG.CATEGORIES.SYSTEM);
            }

            session.lastActivity = now;
            sessionStorage.setItem(CONFIG.SESSION_STORAGE_KEY, JSON.stringify(session));
            this.sessionData = session;

            return session.id;
        }

        // Update session activity
        updateSessionActivity() {
            if (this.sessionData) {
                this.sessionData.lastActivity = Date.now();
                sessionStorage.setItem(CONFIG.SESSION_STORAGE_KEY, JSON.stringify(this.sessionData));
            }
        }

        // =====================================================
        // EVENT LISTENERS
        // =====================================================

        setupEventListeners() {
            // Click tracking
            if (this.trackingEnabled.clicks) {
                document.addEventListener('click', this.handleClick.bind(this), { capture: true });
            }

            // Scroll tracking
            if (this.trackingEnabled.scroll) {
                this.setupScrollTracking();
            }

            // Form tracking
            if (this.trackingEnabled.forms) {
                this.setupFormTracking();
            }

            // Error tracking
            if (this.trackingEnabled.errors) {
                this.setupErrorTracking();
            }

            // Page visibility (flush on hide)
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    this.trackPageExit();
                    this.flush(true); // Force flush
                }
            });

            // Before unload
            window.addEventListener('beforeunload', () => {
                this.trackPageExit();
                this.flush(true);
            });

            // SPA navigation detection
            this.setupSPATracking();
        }

        // Click tracking handler
        handleClick(e) {
            const target = e.target.closest('[data-track-click]') || e.target;

            // Get element details
            const elementId = target.id || null;
            const elementClass = target.className || null;
            const elementText = (target.innerText || target.textContent || '').substring(0, 100).trim();
            const elementTag = target.tagName;

            // Check for special tracking attributes
            const trackData = target.dataset.trackClick;
            let eventName = 'element_click';
            let extraData = {};

            if (trackData) {
                try {
                    extraData = JSON.parse(trackData);
                    eventName = extraData.event || eventName;
                } catch (err) {
                    eventName = trackData;
                }
            }

            this.trackEvent(eventName, {
                element_id: elementId,
                element_class: typeof elementClass === 'string' ? elementClass : null,
                element_text: elementText,
                element_tag: elementTag,
                viewport_x: e.clientX,
                viewport_y: e.clientY,
                page_x: e.pageX,
                page_y: e.pageY,
                ...extraData
            }, CONFIG.CATEGORIES.ENGAGEMENT);
        }

        // Scroll tracking
        setupScrollTracking() {
            let ticking = false;

            const checkScroll = () => {
                const scrollTop = window.scrollY || document.documentElement.scrollTop;
                const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                const scrollPercent = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;

                if (scrollPercent > this.maxScrollDepth) {
                    this.maxScrollDepth = scrollPercent;

                    // Track milestones
                    [25, 50, 75, 90, 100].forEach(milestone => {
                        if (scrollPercent >= milestone && (this.maxScrollDepth - (scrollPercent - this.maxScrollDepth)) < milestone) {
                            this.trackEvent('page_scroll_milestone', {
                                scroll_depth_pct: milestone,
                                page_path: window.location.pathname
                            }, CONFIG.CATEGORIES.ENGAGEMENT);
                        }
                    });
                }

                ticking = false;
            };

            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(checkScroll);
                    ticking = true;
                }
            }, { passive: true });
        }

        // Form tracking
        setupFormTracking() {
            // Form focus
            document.addEventListener('focusin', (e) => {
                if (e.target.matches('input, textarea, select')) {
                    const form = e.target.closest('form');
                    const formId = form?.id || form?.name || 'unknown';

                    this.trackEvent('form_field_focus', {
                        form_id: formId,
                        field_name: e.target.name || e.target.id,
                        field_type: e.target.type
                    }, CONFIG.CATEGORIES.ENGAGEMENT);
                }
            });

            // Form submit
            document.addEventListener('submit', (e) => {
                const form = e.target;
                const formId = form.id || form.name || 'unknown';

                this.trackEvent('form_submitted', {
                    form_id: formId,
                    form_action: form.action
                }, CONFIG.CATEGORIES.ENGAGEMENT);
            });
        }

        // Error tracking
        setupErrorTracking() {
            window.addEventListener('error', (e) => {
                this.trackEvent('javascript_error', {
                    message: e.message,
                    filename: e.filename,
                    lineno: e.lineno,
                    colno: e.colno,
                    stack: e.error?.stack?.substring(0, 500)
                }, CONFIG.CATEGORIES.SYSTEM);
            });

            window.addEventListener('unhandledrejection', (e) => {
                this.trackEvent('unhandled_promise_rejection', {
                    reason: String(e.reason).substring(0, 500)
                }, CONFIG.CATEGORIES.SYSTEM);
            });
        }

        // SPA navigation tracking
        setupSPATracking() {
            // History API
            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;

            history.pushState = (...args) => {
                originalPushState.apply(history, args);
                this.handleNavigation();
            };

            history.replaceState = (...args) => {
                originalReplaceState.apply(history, args);
                this.handleNavigation();
            };

            window.addEventListener('popstate', () => {
                this.handleNavigation();
            });

            // Hash change
            window.addEventListener('hashchange', () => {
                this.handleNavigation();
            });
        }

        handleNavigation() {
            // Track exit from previous page
            this.trackPageExit();

            // Track new page view
            setTimeout(() => {
                this.trackPageView();
            }, 100);
        }

        // =====================================================
        // CORE TRACKING METHODS
        // =====================================================

        /**
         * Track an event
         * @param {string} eventName - Name of the event
         * @param {object} properties - Event properties
         * @param {string} category - Event category
         */
        trackEvent(eventName, properties = {}, category = CONFIG.CATEGORIES.OTHER) {
            if (!this.enabled) return;

            this.updateSessionActivity();

            const event = {
                event_name: eventName,
                event_category: category,
                restaurant_id: this.restaurantId,
                session_id: this.sessionId,
                visitor_id: this.visitorId,
                timestamp: new Date().toISOString(),
                page_url: window.location.href,
                page_path: window.location.pathname,
                page_title: document.title,
                event_data: properties
            };

            this.eventQueue.push(event);
            this.log('Event tracked', event);

            // Flush immediately for critical events
            if (CONFIG.CRITICAL_EVENTS.includes(eventName)) {
                this.flush(true);
            }

            // Flush if queue is full
            if (this.eventQueue.length >= CONFIG.MAX_QUEUE_SIZE) {
                this.flush();
            }
        }

        /**
         * Track a page view
         */
        trackPageView() {
            const pagePath = window.location.pathname;

            // Skip if same page
            if (this.currentPage === pagePath) return;

            this.currentPage = pagePath;
            this.pageEnterTime = Date.now();
            this.maxScrollDepth = 0;

            // Update session page views
            if (this.sessionData) {
                this.sessionData.pageViews++;
                sessionStorage.setItem(CONFIG.SESSION_STORAGE_KEY, JSON.stringify(this.sessionData));
            }

            this.trackEvent('page_view', {
                referrer: document.referrer,
                viewport_width: window.innerWidth,
                viewport_height: window.innerHeight,
                screen_width: window.screen.width,
                screen_height: window.screen.height
            }, CONFIG.CATEGORIES.ENGAGEMENT);
        }

        /**
         * Track page exit
         */
        trackPageExit() {
            if (!this.currentPage || !this.pageEnterTime) return;

            const timeOnPage = Date.now() - this.pageEnterTime;

            this.trackEvent('page_exit', {
                page_path: this.currentPage,
                time_on_page_ms: timeOnPage,
                max_scroll_depth_pct: this.maxScrollDepth
            }, CONFIG.CATEGORIES.ENGAGEMENT);
        }

        // =====================================================
        // CHECKOUT TRACKING
        // =====================================================

        trackCheckoutStarted(cartValue, itemCount, cartItems = []) {
            this.trackEvent('checkout_started', {
                cart_value: cartValue,
                item_count: itemCount,
                items: cartItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                }))
            }, CONFIG.CATEGORIES.ECOMMERCE);
        }

        trackItemAdded(product, quantity, cartTotal) {
            this.trackEvent('checkout_item_added', {
                product_id: product.id,
                product_name: product.name,
                product_category: product.category,
                quantity: quantity,
                price: product.price,
                cart_total: cartTotal
            }, CONFIG.CATEGORIES.ECOMMERCE);
        }

        trackItemRemoved(product, quantity, cartTotal) {
            this.trackEvent('checkout_item_removed', {
                product_id: product.id,
                product_name: product.name,
                quantity: quantity,
                cart_total: cartTotal
            }, CONFIG.CATEGORIES.ECOMMERCE);
        }

        trackDeliverySelected(fulfillmentType, deliveryFee, estimatedTime) {
            this.trackEvent('checkout_delivery_selected', {
                fulfillment_type: fulfillmentType,
                delivery_fee: deliveryFee,
                estimated_time: estimatedTime
            }, CONFIG.CATEGORIES.ECOMMERCE);
        }

        trackPaymentInitiated(paymentMethod, amount) {
            this.trackEvent('checkout_payment_initiated', {
                payment_method: paymentMethod,
                amount: amount
            }, CONFIG.CATEGORIES.ECOMMERCE);
        }

        trackPaymentCompleted(paymentMethod, amount, transactionId) {
            this.trackEvent('checkout_payment_completed', {
                payment_method: paymentMethod,
                amount: amount,
                transaction_id: transactionId
            }, CONFIG.CATEGORIES.ECOMMERCE);
        }

        trackPaymentFailed(paymentMethod, errorCode, errorMessage) {
            this.trackEvent('checkout_payment_failed', {
                payment_method: paymentMethod,
                error_code: errorCode,
                error_message: errorMessage
            }, CONFIG.CATEGORIES.ECOMMERCE);
        }

        trackOrderCompleted(order) {
            this.trackEvent('checkout_completed', {
                order_id: order.id,
                total: order.total,
                subtotal: order.subtotal,
                tax: order.tax,
                delivery_fee: order.deliveryFee || order.delivery_fee,
                item_count: order.items?.length || 0,
                fulfillment_type: order.fulfillmentType || order.fulfillment_type,
                payment_method: order.paymentMethod || order.payment_method,
                items: order.items?.map(item => ({
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                }))
            }, CONFIG.CATEGORIES.ECOMMERCE);
        }

        trackCheckoutAbandoned(step, cartValue, timeSpentSec) {
            this.trackEvent('checkout_abandoned', {
                step: step,
                cart_value: cartValue,
                time_spent_sec: timeSpentSec
            }, CONFIG.CATEGORIES.ECOMMERCE);
        }

        // =====================================================
        // AI TRACKING
        // =====================================================

        trackAIConversationStarted(conversationId, channel, language = 'da') {
            this.trackEvent('ai_conversation_started', {
                conversation_id: conversationId,
                channel: channel,
                language: language
            }, CONFIG.CATEGORIES.AI);
        }

        trackAIIntentDetected(conversationId, intent, confidence, entities = []) {
            this.trackEvent('ai_intent_detected', {
                conversation_id: conversationId,
                intent: intent,
                confidence: confidence,
                entities: entities
            }, CONFIG.CATEGORIES.AI);
        }

        trackAIClarificationNeeded(conversationId, clarificationType, attemptCount) {
            this.trackEvent('ai_clarification_needed', {
                conversation_id: conversationId,
                clarification_type: clarificationType,
                attempt_count: attemptCount
            }, CONFIG.CATEGORIES.AI);
        }

        trackAIItemAdded(conversationId, productId, productName, quantity) {
            this.trackEvent('ai_item_added', {
                conversation_id: conversationId,
                product_id: productId,
                product_name: productName,
                quantity: quantity
            }, CONFIG.CATEGORIES.AI);
        }

        trackAIOrderCreated(conversationId, orderId, total, itemCount) {
            this.trackEvent('ai_order_created', {
                conversation_id: conversationId,
                order_id: orderId,
                total: total,
                item_count: itemCount
            }, CONFIG.CATEGORIES.AI);
        }

        trackAIEscalation(conversationId, reason, frustrationScore) {
            this.trackEvent('ai_escalation_triggered', {
                conversation_id: conversationId,
                reason: reason,
                frustration_score: frustrationScore
            }, CONFIG.CATEGORIES.AI);
        }

        trackAIConversationEnded(conversationId, outcome, messageCount, durationSec) {
            this.trackEvent('ai_conversation_ended', {
                conversation_id: conversationId,
                outcome: outcome,
                message_count: messageCount,
                duration_sec: durationSec
            }, CONFIG.CATEGORIES.AI);
        }

        trackAIFeedback(conversationId, rating, feedbackText) {
            this.trackEvent('ai_feedback_received', {
                conversation_id: conversationId,
                rating: rating,
                feedback_text: feedbackText
            }, CONFIG.CATEGORIES.AI);
        }

        // =====================================================
        // SOCIAL TRACKING
        // =====================================================

        trackSocialMessageReceived(platform, userId) {
            this.trackEvent(`social_${platform}_message_received`, {
                platform: platform,
                user_id_hash: this.hashString(userId)
            }, CONFIG.CATEGORIES.SOCIAL);
        }

        trackSocialOrderStarted(platform, userId, conversationId) {
            this.trackEvent(`social_${platform}_order_started`, {
                platform: platform,
                user_id_hash: this.hashString(userId),
                conversation_id: conversationId
            }, CONFIG.CATEGORIES.SOCIAL);
        }

        trackSocialOrderCompleted(platform, orderId, total) {
            this.trackEvent(`social_${platform}_order_completed`, {
                platform: platform,
                order_id: orderId,
                total: total
            }, CONFIG.CATEGORIES.SOCIAL);
        }

        trackSMSLinkClicked(campaignId, linkId) {
            this.trackEvent('social_sms_link_clicked', {
                campaign_id: campaignId,
                link_id: linkId
            }, CONFIG.CATEGORIES.MARKETING);
        }

        // =====================================================
        // MARKETING TRACKING
        // =====================================================

        trackCampaignView(campaignId, campaignType) {
            this.trackEvent('campaign_viewed', {
                campaign_id: campaignId,
                campaign_type: campaignType
            }, CONFIG.CATEGORIES.MARKETING);
        }

        trackCampaignClick(campaignId, campaignType, linkId) {
            this.trackEvent('campaign_clicked', {
                campaign_id: campaignId,
                campaign_type: campaignType,
                link_id: linkId
            }, CONFIG.CATEGORIES.MARKETING);
        }

        trackLoyaltySignup(tier) {
            this.trackEvent('loyalty_signup', {
                tier: tier
            }, CONFIG.CATEGORIES.MARKETING);
        }

        trackLoyaltyPointsEarned(points, orderId) {
            this.trackEvent('loyalty_points_earned', {
                points: points,
                order_id: orderId
            }, CONFIG.CATEGORIES.MARKETING);
        }

        trackLoyaltyRewardRedeemed(rewardId, rewardName, pointsCost) {
            this.trackEvent('loyalty_reward_redeemed', {
                reward_id: rewardId,
                reward_name: rewardName,
                points_cost: pointsCost
            }, CONFIG.CATEGORIES.MARKETING);
        }

        // =====================================================
        // PRODUCT TRACKING
        // =====================================================

        trackProductView(product) {
            this.trackEvent('product_viewed', {
                product_id: product.id,
                product_name: product.name,
                product_category: product.category,
                price: product.price
            }, CONFIG.CATEGORIES.ECOMMERCE);
        }

        trackProductAddToCart(product, quantity) {
            this.trackEvent('product_add_to_cart', {
                product_id: product.id,
                product_name: product.name,
                product_category: product.category,
                price: product.price,
                quantity: quantity
            }, CONFIG.CATEGORIES.ECOMMERCE);
        }

        trackProductRemoveFromCart(product, quantity) {
            this.trackEvent('product_remove_from_cart', {
                product_id: product.id,
                product_name: product.name,
                quantity: quantity
            }, CONFIG.CATEGORIES.ECOMMERCE);
        }

        trackMenuCategoryView(categoryName) {
            this.trackEvent('menu_category_viewed', {
                category_name: categoryName
            }, CONFIG.CATEGORIES.ENGAGEMENT);
        }

        trackMenuSearch(searchTerm, resultsCount) {
            this.trackEvent('menu_searched', {
                search_term: searchTerm,
                results_count: resultsCount
            }, CONFIG.CATEGORIES.ENGAGEMENT);
        }

        // =====================================================
        // FLUSH & SEND
        // =====================================================

        startFlushTimer() {
            if (this.flushTimer) {
                clearInterval(this.flushTimer);
            }
            this.flushTimer = setInterval(() => this.flush(), CONFIG.FLUSH_INTERVAL);
        }

        async flush(force = false) {
            if (this.eventQueue.length === 0) return;

            // Take events from queue
            const eventsToSend = this.eventQueue.splice(0, CONFIG.BATCH_SIZE);

            try {
                const response = await fetch(CONFIG.API_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        events: eventsToSend,
                        metadata: {
                            visitor_id: this.visitorId,
                            session_id: this.sessionId,
                            sent_at: new Date().toISOString()
                        }
                    }),
                    keepalive: force // Ensure delivery on page unload
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                this.log('Events flushed', { count: eventsToSend.length });
            } catch (error) {
                // Re-queue failed events
                this.eventQueue.unshift(...eventsToSend);
                this.log('Flush failed, events re-queued', { error: error.message, count: eventsToSend.length });
            }
        }

        // =====================================================
        // UTILITY METHODS
        // =====================================================

        generateUUID() {
            if (crypto.randomUUID) {
                return crypto.randomUUID();
            }
            // Fallback
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        hashString(str) {
            if (!str) return null;
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return 'h_' + Math.abs(hash).toString(16);
        }

        log(...args) {
            if (this.debug) {
                console.log('[FlowAnalytics]', ...args);
            }
        }

        // =====================================================
        // PUBLIC API
        // =====================================================

        setRestaurantId(restaurantId) {
            this.restaurantId = restaurantId;
        }

        setDebug(enabled) {
            this.debug = enabled;
        }

        enable() {
            this.enabled = true;
            if (!this.isInitialized) {
                this.init();
            }
        }

        disable() {
            this.enabled = false;
            this.flush(true);
        }

        getSessionId() {
            return this.sessionId;
        }

        getVisitorId() {
            return this.visitorId;
        }

        // Custom event tracking
        track(eventName, properties = {}, category = CONFIG.CATEGORIES.OTHER) {
            this.trackEvent(eventName, properties, category);
        }

        // Identify user (for logged-in users)
        identify(userId, traits = {}) {
            this.trackEvent('user_identified', {
                user_id: userId,
                traits: traits
            }, CONFIG.CATEGORIES.SYSTEM);
        }
    }

    // =====================================================
    // GLOBAL INITIALIZATION
    // =====================================================

    // Create global instance
    window.FlowAnalytics = AnalyticsTracker;
    window.flowAnalytics = null;

    /**
     * Initialize analytics
     * @param {object} options - Configuration options
     * @returns {AnalyticsTracker}
     */
    window.initFlowAnalytics = function(options = {}) {
        if (!window.flowAnalytics) {
            window.flowAnalytics = new AnalyticsTracker(options);
        } else if (options.restaurantId) {
            window.flowAnalytics.setRestaurantId(options.restaurantId);
        }
        return window.flowAnalytics;
    };

    // Auto-initialize if data attribute present
    document.addEventListener('DOMContentLoaded', () => {
        const scriptTag = document.querySelector('script[data-flow-analytics]');
        if (scriptTag) {
            const restaurantId = scriptTag.dataset.restaurantId;
            const debug = scriptTag.dataset.debug === 'true';
            window.initFlowAnalytics({ restaurantId, debug });
        }
    });

})(window);
