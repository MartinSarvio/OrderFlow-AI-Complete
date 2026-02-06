/**
 * OrderFlow Social Ordering Agent
 * Standalone module for Instagram DMs and Facebook Messenger ordering
 *
 * Converts social media conversations into completed restaurant orders.
 * Supports Danish and English with automatic language detection.
 */

// Get loggers from global scope (loaded via logger.js)
const getLogger = () => window.orderLogger || window.flowLogger || console;
const getAILogger = () => window.aiLogger || window.flowLogger || console;
const getChannelLogger = () => window.channelLogger || window.flowLogger || console;

const OrderingAgent = {
    // ============================================================
    // VERSION INFO
    // ============================================================
    version: '1.2.0',
    buildDate: '2026-02-06',

    // ============================================================
    // CONFIGURATION
    // ============================================================

    config: {
        defaultLanguage: 'da',
        supportedLanguages: ['da', 'en'],
        maxRetries: 1,
        escalationThreshold: 2, // Frustration count before escalation
        cateringThreshold: 15,  // Max people before requiring human
        enableAnalytics: true,  // Enable analytics logging
        enablePayments: true,   // Enable payment integration
        enableMLStorage: true,  // Enable ML training data storage
        paymentTimeout: 900000, // 15 minutes payment timeout
    },

    // ============================================================
    // ANALYTICS & LOGGING
    // ============================================================

    /**
     * Initialize analytics for a conversation
     */
    async initConversationAnalytics(restaurantId, channel, threadId, customerPhone = null) {
        if (!this.config.enableAnalytics) return null;

        try {
            // Create conversation ID
            const conversationId = `${channel}_${threadId}_${Date.now()}`;

            // Log to Supabase if available
            if (window.SupabaseDB?.createAIConversation) {
                const result = await window.SupabaseDB.createAIConversation(restaurantId, {
                    conversationId,
                    channel: channel === 'instagram' ? 'instagram_dm' : channel === 'facebook' ? 'facebook_messenger' : channel,
                    channelUserId: threadId,
                    customerPhone,
                    language: this.config.defaultLanguage,
                    currentState: this.states.GREETING
                });

                if (result.success) {
                    getAILogger().info({
                        event: 'ai.conversation.initialized',
                        conversation_id: conversationId,
                        restaurant_id: restaurantId,
                        channel: channel
                    });
                }
            }

            // Track event if analytics tracker available
            if (window.flowAnalytics?.trackAIConversationStarted) {
                window.flowAnalytics.trackAIConversationStarted(conversationId, channel);
            }

            return conversationId;
        } catch (err) {
            getAILogger().error({
                event: 'ai.conversation.init_failed',
                error_reason: err.message,
                restaurant_id: restaurantId,
                channel: channel
            });
            return null;
        }
    },

    /**
     * Log a message to analytics
     */
    async logMessage(conversationId, role, content, metadata = {}) {
        if (!this.config.enableAnalytics || !conversationId) return;

        try {
            if (window.SupabaseDB?.addAIMessage) {
                await window.SupabaseDB.addAIMessage(conversationId, {
                    role,
                    content,
                    detectedIntent: metadata.intent,
                    intentConfidence: metadata.confidence,
                    entities: metadata.entities,
                    responseTimeMs: metadata.responseTimeMs,
                    conversationState: metadata.state
                });
            }

            // Track intent detection
            if (role === 'user' && metadata.intent && window.flowAnalytics?.trackAIIntentDetected) {
                window.flowAnalytics.trackAIIntentDetected(
                    conversationId,
                    metadata.intent,
                    metadata.confidence || 0.8,
                    metadata.entities || []
                );
            }
        } catch (err) {
            getAILogger().warn({
                event: 'ai.analytics.log_failed',
                error_reason: err.message,
                conversation_id: conversationId
            });
        }
    },

    /**
     * Update conversation outcome
     */
    async updateConversationOutcome(conversationId, outcome, orderId = null, metrics = {}) {
        if (!this.config.enableAnalytics || !conversationId) return;

        try {
            if (window.SupabaseDB?.updateAIConversation) {
                await window.SupabaseDB.updateAIConversation(conversationId, {
                    outcome,
                    orderId,
                    endedAt: new Date().toISOString(),
                    frustrationScore: metrics.frustrationScore
                });
            }

            // Track based on outcome
            if (window.flowAnalytics) {
                if (outcome === 'order_completed' && orderId) {
                    window.flowAnalytics.trackAIOrderCreated(conversationId, orderId, metrics.total, metrics.itemCount);
                } else if (outcome === 'escalated') {
                    window.flowAnalytics.trackAIEscalation(conversationId, metrics.reason, metrics.frustrationScore);
                }

                window.flowAnalytics.trackAIConversationEnded(
                    conversationId,
                    outcome,
                    metrics.messageCount || 0,
                    metrics.durationSec || 0
                );
            }
        } catch (err) {
            getAILogger().warn({
                event: 'ai.analytics.outcome_update_failed',
                error_reason: err.message,
                conversation_id: conversationId,
                outcome: outcome
            });
        }
    },

    // ============================================================
    // PAYMENT INTEGRATION
    // ============================================================

    paymentProviders: {
        stripe: null,
        mobilepay: null,
        configured: false
    },

    /**
     * Initialize payment integration for restaurant
     * Called when restaurant connects their payment provider via platform
     */
    async initPayments(restaurantId, paymentConfig) {
        if (!this.config.enablePayments) return false;

        try {
            this.paymentProviders.configured = true;
            this.paymentProviders.restaurantId = restaurantId;
            this.paymentProviders.defaultProvider = paymentConfig.defaultProvider || 'stripe';
            this.paymentProviders.stripeAccountId = paymentConfig.stripeAccountId;
            this.paymentProviders.mobilepayMerchantId = paymentConfig.mobilepayMerchantId;
            this.paymentProviders.currency = paymentConfig.currency || 'DKK';

            // Store in Supabase for persistence
            if (window.SupabaseDB?.updateRestaurantPaymentConfig) {
                await window.SupabaseDB.updateRestaurantPaymentConfig(restaurantId, {
                    agentPaymentsEnabled: true,
                    stripeAccountId: paymentConfig.stripeAccountId,
                    mobilepayMerchantId: paymentConfig.mobilepayMerchantId,
                    defaultProvider: paymentConfig.defaultProvider
                });
            }

            getLogger().info({
                event: 'order.payment.initialized',
                restaurant_id: restaurantId,
                provider: paymentConfig.defaultProvider
            });
            return true;
        } catch (err) {
            getLogger().error({
                event: 'order.payment.init_failed',
                error_reason: err.message,
                restaurant_id: restaurantId
            });
            return false;
        }
    },

    /**
     * Create payment link for order
     */
    async createPaymentLink(conversation, orderTotal) {
        if (!this.paymentProviders.configured) {
            return { success: false, error: 'Payments not configured' };
        }

        try {
            const paymentData = {
                restaurantId: this.paymentProviders.restaurantId,
                orderId: conversation.orderId || `pending_${conversation.threadId}`,
                amount: orderTotal,
                currency: this.paymentProviders.currency,
                customerName: conversation.customerName,
                customerPhone: conversation.phone,
                items: conversation.items.map(i => ({
                    name: i.name,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice
                })),
                metadata: {
                    channel: conversation.channel,
                    threadId: conversation.threadId,
                    conversationId: conversation._analyticsId
                },
                expiresAt: Date.now() + this.config.paymentTimeout
            };

            // Call payment API
            if (window.SupabaseDB?.createPaymentLink) {
                const result = await window.SupabaseDB.createPaymentLink(paymentData);

                if (result.success) {
                    conversation._paymentId = result.paymentId;
                    conversation._paymentLink = result.paymentLink;
                    conversation._paymentStatus = 'pending';
                    conversation._paymentExpiresAt = paymentData.expiresAt;

                    // Track payment created
                    if (window.flowAnalytics?.trackPaymentCreated) {
                        window.flowAnalytics.trackPaymentCreated(
                            conversation._analyticsId,
                            result.paymentId,
                            orderTotal
                        );
                    }

                    return {
                        success: true,
                        paymentId: result.paymentId,
                        paymentLink: result.paymentLink,
                        expiresAt: paymentData.expiresAt
                    };
                }
            }

            // Fallback: Generate placeholder link
            return {
                success: true,
                paymentId: `pay_${Date.now()}`,
                paymentLink: `https://pay.orderflow.dk/${conversation.threadId}`,
                expiresAt: paymentData.expiresAt
            };

        } catch (err) {
            getLogger().error({
                event: 'order.payment_link.create_failed',
                error_reason: err.message,
                order_id: conversation.orderId,
                channel: conversation.channel
            });
            return { success: false, error: err.message };
        }
    },

    /**
     * Check payment status
     */
    async checkPaymentStatus(conversation) {
        if (!conversation._paymentId) return { status: 'no_payment' };

        try {
            if (window.SupabaseDB?.getPaymentStatus) {
                const result = await window.SupabaseDB.getPaymentStatus(conversation._paymentId);
                conversation._paymentStatus = result.status;

                if (result.status === 'completed') {
                    // Track successful payment
                    if (window.flowAnalytics?.trackPaymentCompleted) {
                        window.flowAnalytics.trackPaymentCompleted(
                            conversation._analyticsId,
                            conversation._paymentId,
                            result.amount
                        );
                    }
                }

                return result;
            }

            return { status: conversation._paymentStatus || 'unknown' };
        } catch (err) {
            getLogger().error({
                event: 'order.payment.status_check_failed',
                error_reason: err.message,
                payment_id: conversation._paymentId
            });
            return { status: 'error', error: err.message };
        }
    },

    /**
     * Handle payment webhook callback
     */
    async handlePaymentWebhook(paymentId, status, metadata) {
        // Find conversation by payment ID
        for (const [key, conversation] of this.conversations) {
            if (conversation._paymentId === paymentId) {
                conversation._paymentStatus = status;

                if (status === 'completed') {
                    // Auto-submit order if payment successful
                    if (conversation.state === this.states.AWAITING_PAYMENT) {
                        conversation.state = this.states.SUBMIT;
                        const result = await this.handleSubmit(conversation, {});

                        // Store ML training data for successful payment flow
                        await this.storeMLTrainingData(conversation, 'payment_success');

                        return { success: true, orderResult: result };
                    }
                } else if (status === 'failed' || status === 'expired') {
                    // Track failed payment
                    if (window.flowAnalytics?.trackPaymentFailed) {
                        window.flowAnalytics.trackPaymentFailed(
                            conversation._analyticsId,
                            paymentId,
                            status
                        );
                    }
                }

                return { success: true, status };
            }
        }

        return { success: false, error: 'Conversation not found' };
    },

    // ============================================================
    // ML TRAINING DATA STORAGE
    // ============================================================

    /**
     * Store conversation for ML training
     * All messages are stored to improve agent responses
     */
    async storeMLTrainingData(conversation, outcome) {
        if (!this.config.enableMLStorage) return;

        try {
            const trainingData = {
                conversationId: conversation._analyticsId,
                restaurantId: conversation._restaurantId,
                channel: conversation.channel,
                language: conversation.language,
                outcome: outcome, // 'order_completed', 'payment_success', 'escalated', 'abandoned'
                messageCount: conversation._messageCount || 0,
                durationSec: conversation._startTime
                    ? Math.round((Date.now() - conversation._startTime) / 1000)
                    : 0,
                frustrationScore: (conversation.metadata?.frustrationCount || 0) / this.config.escalationThreshold,
                orderValue: this.calculateOrderTotal(conversation),
                itemCount: conversation.items?.length || 0,
                fulfillmentType: conversation.fulfillment,
                hadPayment: !!conversation._paymentId,
                paymentSuccessful: conversation._paymentStatus === 'completed',
                stateTransitions: conversation._stateHistory || [],
                createdAt: new Date().toISOString()
            };

            // Store in Supabase ML training table
            if (window.SupabaseDB?.storeMLConversation) {
                await window.SupabaseDB.storeMLConversation(trainingData);
                getAILogger().info({
                    event: 'ai.ml.training_data_stored',
                    conversation_id: conversation._analyticsId,
                    outcome: outcome,
                    message_count: trainingData.messageCount
                });
            }

            // Also store individual messages for fine-tuning
            await this.storeMLMessages(conversation);

        } catch (err) {
            getAILogger().error({
                event: 'ai.ml.storage_failed',
                error_reason: err.message,
                conversation_id: conversation._analyticsId
            });
        }
    },

    /**
     * Store individual messages for ML training
     */
    async storeMLMessages(conversation) {
        if (!this.config.enableMLStorage || !conversation._messageHistory) return;

        try {
            const messages = conversation._messageHistory.map((msg, index) => ({
                conversationId: conversation._analyticsId,
                messageIndex: index,
                role: msg.role,
                content: msg.content,
                intent: msg.intent,
                state: msg.state,
                timestamp: msg.timestamp,
                responseTimeMs: msg.responseTimeMs
            }));

            if (window.SupabaseDB?.storeMLMessages) {
                await window.SupabaseDB.storeMLMessages(messages);
            }
        } catch (err) {
            getAILogger().warn({
                event: 'ai.ml.messages_storage_failed',
                error_reason: err.message,
                conversation_id: conversation._analyticsId
            });
        }
    },

    /**
     * Track message in conversation history for ML
     */
    trackMessageForML(conversation, role, content, metadata = {}) {
        if (!this.config.enableMLStorage) return;

        if (!conversation._messageHistory) {
            conversation._messageHistory = [];
        }

        conversation._messageHistory.push({
            role,
            content,
            intent: metadata.intent,
            state: conversation.state,
            timestamp: Date.now(),
            responseTimeMs: metadata.responseTimeMs
        });

        // Track state transitions
        if (!conversation._stateHistory) {
            conversation._stateHistory = [];
        }

        const lastState = conversation._stateHistory[conversation._stateHistory.length - 1];
        if (!lastState || lastState.state !== conversation.state) {
            conversation._stateHistory.push({
                state: conversation.state,
                timestamp: Date.now()
            });
        }
    },

    /**
     * Get ML insights for improving responses
     */
    async getMLInsights(restaurantId) {
        try {
            if (window.SupabaseDB?.getMLInsights) {
                return await window.SupabaseDB.getMLInsights(restaurantId);
            }

            return {
                totalConversations: 0,
                completionRate: 0,
                avgResponseTime: 0,
                topIntents: [],
                commonEscalationReasons: [],
                peakHours: []
            };
        } catch (err) {
            getAILogger().warn({
                event: 'ai.ml.insights_fetch_failed',
                error_reason: err.message,
                restaurant_id: restaurantId
            });
            return null;
        }
    },

    /**
     * Export training data for external ML model
     */
    async exportTrainingData(restaurantId, options = {}) {
        try {
            if (window.SupabaseDB?.exportMLTrainingData) {
                return await window.SupabaseDB.exportMLTrainingData(restaurantId, {
                    format: options.format || 'jsonl', // jsonl for fine-tuning
                    dateFrom: options.dateFrom,
                    dateTo: options.dateTo,
                    minQuality: options.minQuality || 0.7, // Only export successful conversations
                    includeMessages: options.includeMessages !== false
                });
            }

            return { success: false, error: 'Export not available' };
        } catch (err) {
            getAILogger().error({
                event: 'ai.ml.export_failed',
                error_reason: err.message,
                restaurant_id: restaurantId
            });
            return { success: false, error: err.message };
        }
    },

    // ============================================================
    // SOCIAL MEDIA INTEGRATION
    // ============================================================

    /**
     * Connect Instagram Business account
     */
    async connectInstagram(restaurantId, accessToken, pageId) {
        try {
            if (window.SupabaseDB?.connectSocialChannel) {
                const result = await window.SupabaseDB.connectSocialChannel(restaurantId, {
                    channel: 'instagram',
                    accessToken,
                    pageId,
                    webhookUrl: `${window.location.origin}/api/webhooks/instagram/${restaurantId}`
                });

                if (result.success) {
                    getChannelLogger().info({
                        event: 'channel.instagram.connected',
                        restaurant_id: restaurantId,
                        channel_id: result.channelId
                    });
                    return { success: true, channelId: result.channelId };
                }
            }

            return { success: false, error: 'Connection failed' };
        } catch (err) {
            getChannelLogger().error({
                event: 'channel.instagram.connect_failed',
                error_reason: err.message,
                restaurant_id: restaurantId
            });
            return { success: false, error: err.message };
        }
    },

    /**
     * Connect Facebook Page
     */
    async connectFacebook(restaurantId, accessToken, pageId) {
        try {
            if (window.SupabaseDB?.connectSocialChannel) {
                const result = await window.SupabaseDB.connectSocialChannel(restaurantId, {
                    channel: 'facebook',
                    accessToken,
                    pageId,
                    webhookUrl: `${window.location.origin}/api/webhooks/facebook/${restaurantId}`
                });

                if (result.success) {
                    getChannelLogger().info({
                        event: 'channel.facebook.connected',
                        restaurant_id: restaurantId,
                        channel_id: result.channelId
                    });
                    return { success: true, channelId: result.channelId };
                }
            }

            return { success: false, error: 'Connection failed' };
        } catch (err) {
            getChannelLogger().error({
                event: 'channel.facebook.connect_failed',
                error_reason: err.message,
                restaurant_id: restaurantId
            });
            return { success: false, error: err.message };
        }
    },

    /**
     * Get integration status for restaurant
     */
    async getIntegrationStatus(restaurantId) {
        try {
            if (window.SupabaseDB?.getRestaurantIntegrations) {
                return await window.SupabaseDB.getRestaurantIntegrations(restaurantId);
            }

            return {
                instagram: { connected: false },
                facebook: { connected: false },
                payments: { configured: this.paymentProviders.configured }
            };
        } catch (err) {
            getChannelLogger().warn({
                event: 'channel.integration_status.fetch_failed',
                error_reason: err.message,
                restaurant_id: restaurantId
            });
            return null;
        }
    },

    /**
     * Detect intent from user message with confidence scoring
     */
    detectIntent(text, context = {}) {
        const lowerText = text.toLowerCase().trim();
        const result = {
            intent: 'unknown',
            confidence: 0.5,
            entities: [],
            factors: {}
        };

        // Intent patterns with weights
        const intents = {
            order_food: {
                patterns: [
                    { regex: /\b(bestil|order|køb|buy)\b/i, weight: 0.9 },
                    { regex: /\b(vil have|i want|jeg vil|gerne)\b/i, weight: 0.85 },
                    { regex: /\b(pizza|burger|salat|mad|food)\b/i, weight: 0.8 },
                    { regex: /\b(menu|menuen)\b/i, weight: 0.7 },
                    { regex: /\d+\s*(stk|x|gange)/i, weight: 0.85 } // "2 stk", "3x"
                ],
                entityPatterns: [
                    { regex: /(\d+)\s*(stk|x)?/g, type: 'quantity' },
                    { regex: /\b(stor|mellem|lille|large|medium|small)\b/gi, type: 'size' }
                ]
            },
            check_info: {
                patterns: [
                    { regex: /\b(åbningstider|opening|hours)\b/i, weight: 0.9 },
                    { regex: /\b(hvornår|when|åben|open|lukket|closed)\b/i, weight: 0.85 },
                    { regex: /\b(pris|price|kost|cost|hvor meget)\b/i, weight: 0.85 },
                    { regex: /\b(adresse|address|hvor ligger)\b/i, weight: 0.85 },
                    { regex: /\b(levering|delivery|leverer i)\b/i, weight: 0.8 }
                ],
                entityPatterns: []
            },
            confirm: {
                patterns: [
                    { regex: /^(ja|yes|ok|jep|yep|yeah|sure|bestil)$/i, weight: 0.95 },
                    { regex: /\b(bekræft|confirm|godkend)\b/i, weight: 0.9 },
                    { regex: /^(1|y)$/i, weight: 0.85 }
                ],
                entityPatterns: []
            },
            cancel: {
                patterns: [
                    { regex: /^(nej|no|nope|annuller|cancel|stop)$/i, weight: 0.95 },
                    { regex: /\b(fortryd|undo|afbestil)\b/i, weight: 0.9 },
                    { regex: /^(0|n)$/i, weight: 0.85 }
                ],
                entityPatterns: []
            },
            support: {
                patterns: [
                    { regex: /\b(hjælp|help|support)\b/i, weight: 0.9 },
                    { regex: /\b(problem|fejl|error|virker ikke)\b/i, weight: 0.85 },
                    { regex: /\b(klage|complaint|utilfreds|unhappy)\b/i, weight: 0.9 },
                    { regex: /\b(refund|refundering|penge tilbage)\b/i, weight: 0.95 },
                    { regex: /\b(tale med|speak to|kontakt|contact)\b/i, weight: 0.85 }
                ],
                entityPatterns: []
            },
            greeting: {
                patterns: [
                    { regex: /^(hej|hi|hello|goddag|hey|hallo)[\s!]*$/i, weight: 0.95 },
                    { regex: /^(god morgen|good morning|godaften|good evening)[\s!]*$/i, weight: 0.9 }
                ],
                entityPatterns: []
            },
            fulfillment: {
                patterns: [
                    { regex: /\b(afhentning|pickup|pick up|hente)\b/i, weight: 0.95, subtype: 'pickup' },
                    { regex: /\b(levering|delivery|lever|bringe|kør)\b/i, weight: 0.95, subtype: 'delivery' }
                ],
                entityPatterns: [
                    { regex: /\b(\d{4})\b/g, type: 'postal_code' },
                    { regex: /\b(kl\.?\s*)?(\d{1,2}[:.]\d{2})\b/gi, type: 'time' }
                ]
            }
        };

        // Score each intent
        const scores = {};
        for (const [intentName, intentDef] of Object.entries(intents)) {
            let maxScore = 0;
            let matchedPattern = null;

            for (const pattern of intentDef.patterns) {
                if (pattern.regex.test(lowerText)) {
                    if (pattern.weight > maxScore) {
                        maxScore = pattern.weight;
                        matchedPattern = pattern;
                    }
                }
            }

            if (maxScore > 0) {
                scores[intentName] = { score: maxScore, pattern: matchedPattern };

                // Extract entities
                for (const entityPattern of intentDef.entityPatterns) {
                    const matches = lowerText.matchAll(entityPattern.regex);
                    for (const match of matches) {
                        result.entities.push({
                            type: entityPattern.type,
                            value: match[1] || match[0],
                            position: match.index
                        });
                    }
                }
            }
        }

        // Find best intent
        let bestIntent = 'unknown';
        let bestScore = 0.5;

        for (const [intentName, data] of Object.entries(scores)) {
            if (data.score > bestScore) {
                bestScore = data.score;
                bestIntent = intentName;
            }
        }

        result.intent = bestIntent;
        result.confidence = bestScore;
        result.factors = {
            patternMatchScore: bestScore,
            entityCount: result.entities.length,
            textLength: text.length,
            hasNumbers: /\d/.test(text),
            hasQuestion: /\?/.test(text)
        };

        // Boost confidence if entities support intent
        if (result.entities.length > 0 && bestIntent === 'order_food') {
            result.confidence = Math.min(0.95, result.confidence + 0.05);
        }

        // Lower confidence for very short or very long messages
        if (text.length < 3) {
            result.confidence *= 0.7;
        } else if (text.length > 200) {
            result.confidence *= 0.85;
        }

        return result;
    },

    /**
     * Calculate overall conversation confidence
     * Used to determine if human intervention is needed
     */
    calculateConversationConfidence(conversation) {
        const factors = {
            stateProgress: 0,
            itemsValid: 0,
            customerDetailsComplete: 0,
            noFrustration: 0,
            recentConfidence: 0
        };

        // State progress (further = more confident)
        const stateOrder = [
            this.states.GREETING,
            this.states.IDENTIFY_INTENT,
            this.states.ITEM_SELECTION,
            this.states.FULFILLMENT_CHOICE,
            this.states.CUSTOMER_DETAILS,
            this.states.CONFIRMATION,
            this.states.AWAITING_PAYMENT,
            this.states.SUBMIT,
            this.states.POST_SUBMIT
        ];
        const stateIndex = stateOrder.indexOf(conversation.state);
        factors.stateProgress = Math.max(0, stateIndex / (stateOrder.length - 1));

        // Items validity
        if (conversation.items && conversation.items.length > 0) {
            const validItems = conversation.items.filter(i => i.name && i.quantity > 0);
            factors.itemsValid = validItems.length / conversation.items.length;
        }

        // Customer details completeness
        const requiredFields = ['customerName', 'phone'];
        if (conversation.fulfillment === 'delivery') {
            requiredFields.push('deliveryAddress');
        }
        const filledFields = requiredFields.filter(f => conversation[f]);
        factors.customerDetailsComplete = filledFields.length / requiredFields.length;

        // Frustration penalty
        const frustrationRatio = (conversation.metadata?.frustrationCount || 0) / this.config.escalationThreshold;
        factors.noFrustration = 1 - frustrationRatio;

        // Recent message confidence (from last intent detection)
        factors.recentConfidence = conversation._lastIntentConfidence || 0.7;

        // Weighted average
        const weights = {
            stateProgress: 0.25,
            itemsValid: 0.2,
            customerDetailsComplete: 0.2,
            noFrustration: 0.2,
            recentConfidence: 0.15
        };

        let totalConfidence = 0;
        let totalWeight = 0;

        for (const [factor, value] of Object.entries(factors)) {
            totalConfidence += value * weights[factor];
            totalWeight += weights[factor];
        }

        const confidence = totalConfidence / totalWeight;

        return {
            confidence: Math.round(confidence * 100) / 100,
            factors,
            requiresAttention: confidence < 0.7,
            reason: confidence < 0.7
                ? this.getConfidenceIssueReason(factors)
                : null
        };
    },

    /**
     * Get reason for low confidence
     */
    getConfidenceIssueReason(factors) {
        if (factors.noFrustration < 0.5) return 'customer_frustrated';
        if (factors.itemsValid < 0.5) return 'unclear_items';
        if (factors.recentConfidence < 0.5) return 'unclear_intent';
        if (factors.stateProgress < 0.2) return 'stuck_early';
        return 'general_uncertainty';
    },

    /**
     * Mark conversation as requiring attention in database
     */
    async markRequiresAttention(conversation, reason) {
        if (!conversation._analyticsId) return;

        try {
            if (window.SupabaseDB?.markConversationAttention) {
                await window.SupabaseDB.markConversationAttention(
                    conversation._analyticsId,
                    true,
                    reason
                );
            }

            // Track event
            if (window.flowAnalytics?.trackAIEscalation) {
                window.flowAnalytics.trackAIEscalation(
                    conversation._analyticsId,
                    reason,
                    (conversation.metadata?.frustrationCount || 0) / this.config.escalationThreshold
                );
            }
        } catch (err) {
            getAILogger().warn({
                event: 'ai.attention.mark_failed',
                error_reason: err.message,
                conversation_id: conversation._analyticsId,
                reason: reason
            });
        }
    },

    // ============================================================
    // STATE MACHINE
    // ============================================================

    states: {
        GREETING: 'greeting',
        IDENTIFY_INTENT: 'identify_intent',
        ITEM_SELECTION: 'item_selection',
        FULFILLMENT_CHOICE: 'fulfillment_choice',
        CUSTOMER_DETAILS: 'customer_details',
        CONFIRMATION: 'confirmation',
        AWAITING_PAYMENT: 'awaiting_payment', // New: waiting for payment
        SUBMIT: 'submit',
        POST_SUBMIT: 'post_submit',
        HANDOFF: 'handoff'
    },

    // Required fields for order submission
    requiredFields: {
        base: ['items', 'fulfillment', 'customerName', 'phone'],
        delivery: ['address'],
        pickup: ['pickupTime']
    },

    // ============================================================
    // ORDER DRAFT MODEL
    // ============================================================

    createOrderDraft(channel, threadId) {
        return {
            channel: channel, // 'instagram' | 'facebook'
            threadId: threadId,
            state: this.states.GREETING,
            language: null,
            customerName: null,
            phone: null,
            fulfillment: null, // 'pickup' | 'delivery'
            pickupTime: null,
            deliveryAddress: null,
            deliveryNotes: null,
            doorCode: null,
            floor: null,
            items: [],
            consentFlags: {
                messagingUpdates: true,
                marketingOptIn: false
            },
            metadata: {
                createdAt: Date.now(),
                updatedAt: Date.now(),
                frustrationCount: 0,
                retryCount: 0,
                summaryHash: null,
                confirmedAt: null
            }
        };
    },

    createOrderItem(menuItemId, name, quantity = 1) {
        return {
            menuItemId: menuItemId,
            sku: null,
            name: name,
            quantity: quantity,
            modifiers: [],
            notes: null,
            unitPrice: null,
            totalPrice: null
        };
    },

    // ============================================================
    // LANGUAGE DETECTION & MESSAGES
    // ============================================================

    messages: {
        da: {
            greeting: 'Hej! Vil du bestille det, du lige så? Skriv navnet på retten eller send et screenshot.',
            askLanguage: 'Dansk eller English?',
            askFulfillment: 'Pickup eller levering?',
            askFulfillmentOptions: '1. Pickup\n2. Levering',
            askQuantity: 'Hvor mange?',
            askSize: 'Hvilken størrelse?',
            askPickupTime: 'Hvornår vil du hente? Om 20 min eller senere?',
            askAddress: 'Hvad er adressen til levering?',
            askDoorCode: 'Dør/port kode?',
            askFloor: 'Hvilken etage?',
            askDeliveryNotes: 'Særlige instrukser til levering?',
            askName: 'Navn til ordren?',
            askPhone: 'Telefonnummer til opdateringer?',
            confirmOrder: 'Opsummering:\n{{summary}}\nSvar YES for at placere ordren.',
            orderPlaced: 'Ordren er placeret. Du får opdatering her.',
            orderPlacedPickup: 'Forvent at din ordre er klar {{time}}.',
            orderPlacedDelivery: 'Forvent leveringstid ca. {{time}}.',
            itemNotFound: 'Jeg kunne ikke finde "{{query}}". Mente du en af disse?\n{{suggestions}}',
            itemAmbiguous: 'Vi har flere muligheder:\n{{options}}\nHvilken vil du have? Svar med nummer.',
            restaurantClosed: 'Vi åbner kl. {{openTime}}. Vil du forudbestille til pickup eller levering efter kl. {{openTime}}?',
            allergyWarning: '{{item}} kan indeholde {{allergens}}. Ved alvorlig allergi anbefaler jeg at kontakte personalet direkte.',
            allergyEscalate: 'Vil du have at en medarbejder bekræfter allergener? Eller ring til os.',
            ageConfirmation: 'Dette produkt kræver aldersverifikation. Er du 18 år eller ældre?',
            escalating: 'Jeg sætter dig i kontakt med en medarbejder. Du hører fra os om lidt.',
            retrying: 'Jeg forsøger igen...',
            technicalError: 'Jeg kan ikke få forbindelse til ordresystemet. Jeg sender din ordre til en medarbejder nu.',
            duplicate: 'Det ser ud til at denne ordre allerede er placeret. Vil du bestille igen?',
            anythingElse: 'Vil du tilføje mere til ordren?',
            thanks: 'Tak for din ordre!',
            // Payment messages
            askPayment: 'Total: {{total}} kr. Betal via dette link:\n{{paymentLink}}\n\nLinket er gyldigt i 15 minutter.',
            paymentPending: 'Venter på betaling. Klik på linket for at betale:\n{{paymentLink}}',
            paymentReceived: 'Betaling modtaget! Din ordre behandles nu.',
            paymentFailed: 'Betaling mislykkedes. Prøv igen eller vælg at betale ved {{fulfillment}}.',
            paymentExpired: 'Betalingslinket er udløbet. Vil du have et nyt link?',
            payAtPickup: 'Du kan betale ved afhentning.',
            payAtDelivery: 'Du kan betale ved levering (kontant eller kort).',
            yes: ['ja', 'yes', 'ok', 'jep', 'jo', 'y', 'yep', 'yeah'],
            no: ['nej', 'no', 'nope', 'n', 'nah'],
            pickup: ['pickup', 'afhentning', 'hente', 'selv'],
            delivery: ['levering', 'delivery', 'levere', 'lever', 'bringe']
        },
        en: {
            greeting: 'Hi! Would you like to order what you just saw? Write the dish name or send a screenshot.',
            askLanguage: 'Danish or English?',
            askFulfillment: 'Pickup or delivery?',
            askFulfillmentOptions: '1. Pickup\n2. Delivery',
            askQuantity: 'How many?',
            askSize: 'Which size?',
            askPickupTime: 'When would you like to pick up? In 20 min or later?',
            askAddress: 'What is the delivery address?',
            askDoorCode: 'Door/gate code?',
            askFloor: 'Which floor?',
            askDeliveryNotes: 'Any special delivery instructions?',
            askName: 'Name for the order?',
            askPhone: 'Phone number for updates?',
            confirmOrder: 'Summary:\n{{summary}}\nReply YES to place the order.',
            orderPlaced: 'Order placed! You will receive updates here.',
            orderPlacedPickup: 'Expect your order to be ready {{time}}.',
            orderPlacedDelivery: 'Expected delivery time approx. {{time}}.',
            itemNotFound: 'I could not find "{{query}}". Did you mean one of these?\n{{suggestions}}',
            itemAmbiguous: 'We have several options:\n{{options}}\nWhich one would you like? Reply with number.',
            restaurantClosed: 'We open at {{openTime}}. Would you like to preorder for pickup or delivery after {{openTime}}?',
            allergyWarning: '{{item}} may contain {{allergens}}. For severe allergies, I recommend contacting staff directly.',
            allergyEscalate: 'Would you like a staff member to confirm allergens? Or call us.',
            ageConfirmation: 'This product requires age verification. Are you 18 or older?',
            escalating: 'I am connecting you with a team member. You will hear from us shortly.',
            retrying: 'Retrying...',
            technicalError: 'I cannot connect to the order system. I am forwarding your order to a team member now.',
            duplicate: 'It looks like this order was already placed. Would you like to order again?',
            anythingElse: 'Would you like to add anything else?',
            thanks: 'Thank you for your order!',
            // Payment messages
            askPayment: 'Total: {{total}} kr. Pay via this link:\n{{paymentLink}}\n\nThe link is valid for 15 minutes.',
            paymentPending: 'Waiting for payment. Click the link to pay:\n{{paymentLink}}',
            paymentReceived: 'Payment received! Your order is now being processed.',
            paymentFailed: 'Payment failed. Please try again or choose to pay at {{fulfillment}}.',
            paymentExpired: 'The payment link has expired. Would you like a new link?',
            payAtPickup: 'You can pay at pickup.',
            payAtDelivery: 'You can pay at delivery (cash or card).',
            yes: ['yes', 'ja', 'ok', 'yep', 'y', 'yeah', 'sure'],
            no: ['no', 'nej', 'nope', 'n', 'nah'],
            pickup: ['pickup', 'pick up', 'collect', 'afhentning'],
            delivery: ['delivery', 'deliver', 'levering']
        }
    },

    detectLanguage(text) {
        const danishIndicators = ['jeg', 'vil', 'kan', 'hvad', 'hvor', 'og', 'det', 'en', 'er', 'til', 'med', 'på', 'af', 'den', 'de', 'som', 'har', 'ikke', 'var', 'han', 'hun', 'dig', 'mig', 'os', 'jer', 'tak', 'hej', 'goddag'];
        const englishIndicators = ['i', 'want', 'can', 'what', 'where', 'and', 'the', 'a', 'is', 'to', 'with', 'on', 'of', 'it', 'they', 'that', 'have', 'not', 'was', 'he', 'she', 'you', 'me', 'us', 'thanks', 'hi', 'hello'];

        const words = text.toLowerCase().split(/\s+/);
        let danishScore = 0;
        let englishScore = 0;

        words.forEach(word => {
            if (danishIndicators.includes(word)) danishScore++;
            if (englishIndicators.includes(word)) englishScore++;
        });

        if (danishScore > englishScore) return 'da';
        if (englishScore > danishScore) return 'en';
        return null; // Uncertain
    },

    getMessage(key, lang, replacements = {}) {
        const language = lang || this.config.defaultLanguage;
        let message = this.messages[language][key] || this.messages['da'][key] || key;

        Object.keys(replacements).forEach(placeholder => {
            message = message.replace(`{{${placeholder}}}`, replacements[placeholder]);
        });

        return message;
    },

    // ============================================================
    // MENU MATCHING
    // ============================================================

    menuCatalog: {
        items: [],
        synonyms: {},

        // Add menu item
        addItem(item) {
            this.items.push({
                id: item.id,
                sku: item.sku || null,
                name: item.name,
                nameNormalized: item.name.toLowerCase().trim(),
                category: item.category || null,
                price: item.price || null,
                variants: item.variants || [],
                modifiers: item.modifiers || [],
                allergens: item.allergens || [],
                ageRestricted: item.ageRestricted || false,
                available: item.available !== false,
                synonyms: item.synonyms || []
            });
        },

        // Add synonym mapping
        addSynonym(synonym, canonicalName) {
            this.synonyms[synonym.toLowerCase()] = canonicalName.toLowerCase();
        },

        // Load menu from array
        loadMenu(items) {
            this.items = [];
            items.forEach(item => this.addItem(item));
        },

        // Load synonyms from object
        loadSynonyms(synonymMap) {
            this.synonyms = {};
            Object.keys(synonymMap).forEach(syn => {
                this.synonyms[syn.toLowerCase()] = synonymMap[syn].toLowerCase();
            });
        }
    },

    // Fuzzy string matching (Levenshtein distance)
    levenshteinDistance(str1, str2) {
        const m = str1.length;
        const n = str2.length;
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
                }
            }
        }

        return dp[m][n];
    },

    // Calculate similarity score (0-1)
    similarityScore(str1, str2) {
        const s1 = str1.toLowerCase();
        const s2 = str2.toLowerCase();
        const maxLen = Math.max(s1.length, s2.length);
        if (maxLen === 0) return 1;
        const distance = this.levenshteinDistance(s1, s2);
        return 1 - (distance / maxLen);
    },

    // Search menu items
    searchMenu(query) {
        const normalizedQuery = query.toLowerCase().trim();
        const results = [];

        // Check synonyms first
        if (this.menuCatalog.synonyms[normalizedQuery]) {
            const canonicalName = this.menuCatalog.synonyms[normalizedQuery];
            const item = this.menuCatalog.items.find(i =>
                i.nameNormalized === canonicalName ||
                i.name.toLowerCase().includes(canonicalName)
            );
            if (item && item.available) {
                return [{ item, score: 1, matchType: 'synonym' }];
            }
        }

        // Search through items
        this.menuCatalog.items.forEach(item => {
            if (!item.available) return;

            // Exact match
            if (item.nameNormalized === normalizedQuery) {
                results.push({ item, score: 1, matchType: 'exact' });
                return;
            }

            // Contains match
            if (item.nameNormalized.includes(normalizedQuery) || normalizedQuery.includes(item.nameNormalized)) {
                results.push({ item, score: 0.9, matchType: 'contains' });
                return;
            }

            // Check item synonyms
            if (item.synonyms.some(syn => syn.toLowerCase() === normalizedQuery)) {
                results.push({ item, score: 0.95, matchType: 'item_synonym' });
                return;
            }

            // Fuzzy match
            const score = this.similarityScore(normalizedQuery, item.nameNormalized);
            if (score >= 0.6) {
                results.push({ item, score, matchType: 'fuzzy' });
            }
        });

        // Sort by score descending
        return results.sort((a, b) => b.score - a.score);
    },

    // ============================================================
    // CONVERSATION PROCESSING
    // ============================================================

    // Active conversations storage
    conversations: new Map(),

    // Get or create conversation
    getConversation(channel, threadId) {
        const key = `${channel}:${threadId}`;
        if (!this.conversations.has(key)) {
            this.conversations.set(key, this.createOrderDraft(channel, threadId));
        }
        return this.conversations.get(key);
    },

    // Update conversation
    updateConversation(conversation, updates) {
        Object.assign(conversation, updates, {
            metadata: {
                ...conversation.metadata,
                updatedAt: Date.now()
            }
        });
        return conversation;
    },

    // Process incoming message
    async processMessage(channel, threadId, message, context = {}) {
        const startTime = Date.now();
        const conversation = this.getConversation(channel, threadId);
        const text = message.trim();

        // Initialize analytics for new conversation
        if (!conversation._analyticsId && context.restaurantId) {
            conversation._analyticsId = await this.initConversationAnalytics(
                context.restaurantId,
                channel,
                threadId,
                conversation.phone
            );
            conversation._messageCount = 0;
            conversation._startTime = Date.now();
        }

        // Detect language if not set
        if (!conversation.language) {
            const detected = this.detectLanguage(text);
            if (detected) {
                conversation.language = detected;
            }
        }

        const lang = conversation.language || this.config.defaultLanguage;

        // Detect intent for analytics
        const intentResult = this.detectIntent(text, context);

        // Log incoming user message
        await this.logMessage(conversation._analyticsId, 'user', text, {
            intent: intentResult.intent,
            confidence: intentResult.confidence,
            state: conversation.state
        });

        // Track for ML training
        this.trackMessageForML(conversation, 'user', text, {
            intent: intentResult.intent
        });

        conversation._messageCount = (conversation._messageCount || 0) + 1;

        // Process based on current state
        const response = await this.processState(conversation, text, context);

        const responseTime = Date.now() - startTime;

        // Log assistant response
        await this.logMessage(conversation._analyticsId, 'assistant', response, {
            state: conversation.state,
            responseTimeMs: responseTime
        });

        // Track for ML training
        this.trackMessageForML(conversation, 'assistant', response, {
            state: conversation.state,
            responseTimeMs: responseTime
        });

        conversation._messageCount++;

        return {
            response: response,
            conversation: conversation,
            state: conversation.state,
            analytics: {
                conversationId: conversation._analyticsId,
                intent: intentResult.intent,
                messageCount: conversation._messageCount
            }
        };
    },

    // State machine processor
    async processState(conversation, text, context) {
        const lang = conversation.language || this.config.defaultLanguage;
        const lowerText = text.toLowerCase().trim();

        switch (conversation.state) {
            case this.states.GREETING:
                return this.handleGreeting(conversation, text, context);

            case this.states.IDENTIFY_INTENT:
                return this.handleIdentifyIntent(conversation, text, context);

            case this.states.ITEM_SELECTION:
                return this.handleItemSelection(conversation, text, context);

            case this.states.FULFILLMENT_CHOICE:
                return this.handleFulfillmentChoice(conversation, text, context);

            case this.states.CUSTOMER_DETAILS:
                return this.handleCustomerDetails(conversation, text, context);

            case this.states.CONFIRMATION:
                return this.handleConfirmation(conversation, text, context);

            case this.states.AWAITING_PAYMENT:
                return this.handleAwaitingPayment(conversation, text, context);

            case this.states.SUBMIT:
                return this.handleSubmit(conversation, context);

            case this.states.POST_SUBMIT:
                return this.handlePostSubmit(conversation, text, context);

            case this.states.HANDOFF:
                return this.handleHandoff(conversation, text, context);

            default:
                conversation.state = this.states.GREETING;
                return this.handleGreeting(conversation, text, context);
        }
    },

    // ============================================================
    // STATE HANDLERS
    // ============================================================

    handleGreeting(conversation, text, context) {
        const lang = conversation.language || this.config.defaultLanguage;

        // If message contains menu item reference, skip to item selection
        const menuResults = this.searchMenu(text);
        if (menuResults.length > 0 && menuResults[0].score >= 0.8) {
            conversation.state = this.states.ITEM_SELECTION;
            return this.handleItemSelection(conversation, text, context);
        }

        // Ask about language if uncertain
        if (!conversation.language) {
            return this.getMessage('askLanguage', 'da');
        }

        conversation.state = this.states.IDENTIFY_INTENT;
        return this.getMessage('greeting', lang);
    },

    handleIdentifyIntent(conversation, text, context) {
        const lang = conversation.language;
        const lowerText = text.toLowerCase().trim();

        // Check for menu item
        const menuResults = this.searchMenu(text);
        if (menuResults.length > 0 && menuResults[0].score >= 0.7) {
            conversation.state = this.states.ITEM_SELECTION;
            return this.handleItemSelection(conversation, text, context);
        }

        // Didn't understand - ask clarifying question
        return this.getMessage('greeting', lang);
    },

    handleItemSelection(conversation, text, context) {
        const lang = conversation.language;
        const lowerText = text.toLowerCase().trim();

        // Parse quantity from text (e.g., "2 pizzas", "jeg vil have 3")
        const quantityMatch = text.match(/(\d+)/);
        const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : 1;

        // Remove quantity from search query
        const searchQuery = text.replace(/\d+/g, '').trim();

        // Search menu
        const results = this.searchMenu(searchQuery || text);

        if (results.length === 0) {
            // No match found
            const suggestions = this.menuCatalog.items
                .filter(i => i.available)
                .slice(0, 3)
                .map(i => i.name)
                .join('\n');
            return this.getMessage('itemNotFound', lang, { query: text, suggestions });
        }

        if (results.length === 1 || results[0].score >= 0.9) {
            // Clear match
            const item = results[0].item;

            // Check for allergens if context mentions allergy
            if (context.allergyMention && item.allergens.length > 0) {
                return this.getMessage('allergyWarning', lang, {
                    item: item.name,
                    allergens: item.allergens.join(', ')
                });
            }

            // Check age restriction
            if (item.ageRestricted) {
                // Store pending item and ask for age confirmation
                conversation.pendingItem = { item, quantity };
                return this.getMessage('ageConfirmation', lang);
            }

            // Check for variants
            if (item.variants.length > 0 && !context.variantSelected) {
                const options = item.variants.map((v, i) => `${i + 1}. ${v.name}`).join('\n');
                conversation.pendingItem = { item, quantity };
                return `${item.name}. ${this.getMessage('askSize', lang)}\n${options}`;
            }

            // Add item to order
            const orderItem = this.createOrderItem(item.id, item.name, quantity);
            orderItem.unitPrice = item.price;
            orderItem.totalPrice = item.price * quantity;
            conversation.items.push(orderItem);

            // Move to fulfillment choice
            conversation.state = this.states.FULFILLMENT_CHOICE;
            return this.getMessage('askFulfillment', lang);
        }

        // Multiple matches - ask for clarification
        const options = results.slice(0, 4).map((r, i) => `${i + 1}. ${r.item.name}`).join('\n');
        conversation.pendingMatches = results.slice(0, 4);
        return this.getMessage('itemAmbiguous', lang, { options });
    },

    handleFulfillmentChoice(conversation, text, context) {
        const lang = conversation.language;
        const lowerText = text.toLowerCase().trim();
        const msgs = this.messages[lang];

        // Check for pickup keywords
        if (msgs.pickup.some(k => lowerText.includes(k)) || lowerText === '1') {
            conversation.fulfillment = 'pickup';
            conversation.state = this.states.CUSTOMER_DETAILS;
            return this.getMessage('askPickupTime', lang);
        }

        // Check for delivery keywords
        if (msgs.delivery.some(k => lowerText.includes(k)) || lowerText === '2') {
            conversation.fulfillment = 'delivery';
            conversation.state = this.states.CUSTOMER_DETAILS;
            return this.getMessage('askAddress', lang);
        }

        // Unclear - ask again
        return `${this.getMessage('askFulfillment', lang)}\n${this.getMessage('askFulfillmentOptions', lang)}`;
    },

    handleCustomerDetails(conversation, text, context) {
        const lang = conversation.language;

        // Determine what field we need next
        if (conversation.fulfillment === 'delivery' && !conversation.deliveryAddress) {
            conversation.deliveryAddress = text;
            return this.getMessage('askName', lang);
        }

        if (conversation.fulfillment === 'pickup' && !conversation.pickupTime) {
            conversation.pickupTime = text;
            return this.getMessage('askName', lang);
        }

        if (!conversation.customerName) {
            conversation.customerName = text;
            return this.getMessage('askPhone', lang);
        }

        if (!conversation.phone) {
            // Validate phone number (basic check)
            const phoneDigits = text.replace(/\D/g, '');
            if (phoneDigits.length >= 8) {
                conversation.phone = phoneDigits;
                conversation.state = this.states.CONFIRMATION;
                return this.buildConfirmationMessage(conversation);
            }
            return this.getMessage('askPhone', lang);
        }

        // All details collected - move to confirmation
        conversation.state = this.states.CONFIRMATION;
        return this.buildConfirmationMessage(conversation);
    },

    async handleConfirmation(conversation, text, context) {
        const lang = conversation.language;
        const lowerText = text.toLowerCase().trim();
        const msgs = this.messages[lang];

        // Check for YES
        if (msgs.yes.includes(lowerText)) {
            // Generate summary hash for idempotency
            const summaryHash = this.generateSummaryHash(conversation);

            // Check for duplicate
            if (conversation.metadata.summaryHash === summaryHash && conversation.metadata.confirmedAt) {
                return this.getMessage('duplicate', lang);
            }

            conversation.metadata.summaryHash = summaryHash;
            conversation.metadata.confirmedAt = Date.now();

            // Check if payments are configured - if so, create payment link
            if (this.config.enablePayments && this.paymentProviders.configured) {
                const orderTotal = this.calculateOrderTotal(conversation);

                if (orderTotal > 0) {
                    const paymentResult = await this.createPaymentLink(conversation, orderTotal);

                    if (paymentResult.success) {
                        conversation.state = this.states.AWAITING_PAYMENT;
                        return this.getMessage('askPayment', lang, {
                            total: orderTotal,
                            paymentLink: paymentResult.paymentLink
                        });
                    }
                }
            }

            // No payment configured or zero total - proceed directly to submit
            conversation.state = this.states.SUBMIT;
            return this.handleSubmit(conversation, context);
        }

        // Check for NO - go back to editing
        if (msgs.no.includes(lowerText)) {
            conversation.state = this.states.ITEM_SELECTION;
            return this.getMessage('anythingElse', lang);
        }

        // Unclear - show confirmation again
        return this.buildConfirmationMessage(conversation);
    },

    async handleAwaitingPayment(conversation, text, context) {
        const lang = conversation.language;
        const lowerText = text.toLowerCase().trim();
        const msgs = this.messages[lang];

        // Check if payment link has expired
        if (conversation._paymentExpiresAt && Date.now() > conversation._paymentExpiresAt) {
            // Offer new payment link
            if (msgs.yes.includes(lowerText)) {
                const orderTotal = this.calculateOrderTotal(conversation);
                const paymentResult = await this.createPaymentLink(conversation, orderTotal);

                if (paymentResult.success) {
                    return this.getMessage('askPayment', lang, {
                        total: orderTotal,
                        paymentLink: paymentResult.paymentLink
                    });
                }
            }
            return this.getMessage('paymentExpired', lang);
        }

        // Check payment status
        const paymentStatus = await this.checkPaymentStatus(conversation);

        if (paymentStatus.status === 'completed') {
            conversation.state = this.states.SUBMIT;

            // Store ML training data for successful payment
            await this.storeMLTrainingData(conversation, 'payment_success');

            return this.handleSubmit(conversation, context);
        }

        if (paymentStatus.status === 'failed') {
            // Offer to pay at fulfillment
            const fulfillmentText = conversation.fulfillment === 'pickup' ? 'afhentning' : 'levering';
            return this.getMessage('paymentFailed', lang, { fulfillment: fulfillmentText });
        }

        // User wants to pay at pickup/delivery
        if (lowerText.includes('kontant') || lowerText.includes('cash') ||
            lowerText.includes('ved afhentning') || lowerText.includes('at pickup') ||
            lowerText.includes('ved levering') || lowerText.includes('at delivery')) {

            conversation._paymentStatus = 'pay_at_fulfillment';
            conversation.state = this.states.SUBMIT;
            return this.handleSubmit(conversation, context);
        }

        // Still waiting - remind about payment link
        return this.getMessage('paymentPending', lang, {
            paymentLink: conversation._paymentLink
        });
    },

    async handleSubmit(conversation, context) {
        const lang = conversation.language;

        try {
            // Call integration tool
            const result = await this.integrationTools.createOrder(conversation);

            if (result.success) {
                conversation.state = this.states.POST_SUBMIT;
                conversation.orderId = result.orderId;

                // Track successful order completion
                const durationSec = conversation._startTime
                    ? Math.round((Date.now() - conversation._startTime) / 1000)
                    : 0;

                await this.updateConversationOutcome(
                    conversation._analyticsId,
                    'order_completed',
                    result.orderId,
                    {
                        total: result.total || this.calculateOrderTotal(conversation),
                        itemCount: conversation.items?.length || 0,
                        messageCount: conversation._messageCount || 0,
                        durationSec,
                        frustrationScore: (conversation.metadata.frustrationCount || 0) / this.config.escalationThreshold
                    }
                );

                // Store ML training data for completed order
                await this.storeMLTrainingData(conversation, 'order_completed');

                const timeMsg = conversation.fulfillment === 'pickup'
                    ? this.getMessage('orderPlacedPickup', lang, { time: result.estimatedTime || '20-30 min' })
                    : this.getMessage('orderPlacedDelivery', lang, { time: result.estimatedTime || '35-50 min' });

                return `${this.getMessage('orderPlaced', lang)} ${timeMsg}`;
            }

            throw new Error(result.error || 'Unknown error');

        } catch (error) {
            // Retry once
            if (conversation.metadata.retryCount < this.config.maxRetries) {
                conversation.metadata.retryCount++;
                const retryMsg = this.getMessage('retrying', lang);

                try {
                    const result = await this.integrationTools.createOrder(conversation);
                    if (result.success) {
                        conversation.state = this.states.POST_SUBMIT;

                        // Track successful order after retry
                        await this.updateConversationOutcome(
                            conversation._analyticsId,
                            'order_completed',
                            result.orderId,
                            {
                                total: result.total,
                                itemCount: conversation.items?.length || 0,
                                messageCount: conversation._messageCount || 0
                            }
                        );

                        return this.getMessage('orderPlaced', lang);
                    }
                } catch (retryError) {
                    // Fall through to escalation
                }
            }

            // Track error outcome
            await this.updateConversationOutcome(
                conversation._analyticsId,
                'error',
                null,
                {
                    reason: error.message,
                    messageCount: conversation._messageCount || 0
                }
            );

            // Escalate to human
            conversation.state = this.states.HANDOFF;
            return this.getMessage('technicalError', lang);
        }
    },

    handlePostSubmit(conversation, text, context) {
        const lang = conversation.language;
        // Handle any post-order questions
        return this.getMessage('thanks', lang);
    },

    async handleHandoff(conversation, text, context) {
        const lang = conversation.language;

        // Track escalation
        const durationSec = conversation._startTime
            ? Math.round((Date.now() - conversation._startTime) / 1000)
            : 0;

        this.updateConversationOutcome(
            conversation._analyticsId,
            'escalated',
            null,
            {
                reason: 'frustration_threshold',
                frustrationScore: 1.0,
                messageCount: conversation._messageCount || 0,
                durationSec
            }
        );

        // Store ML training data for escalated conversation
        await this.storeMLTrainingData(conversation, 'escalated');

        return this.getMessage('escalating', lang);
    },

    /**
     * Calculate order total from items
     */
    calculateOrderTotal(conversation) {
        if (!conversation.items || conversation.items.length === 0) return 0;
        return conversation.items.reduce((sum, item) => sum + (item.totalPrice || item.unitPrice || 0) * (item.quantity || 1), 0);
    },

    // ============================================================
    // HELPER METHODS
    // ============================================================

    buildConfirmationMessage(conversation) {
        const lang = conversation.language;
        const lines = [];

        // Items
        conversation.items.forEach(item => {
            lines.push(`${item.name} x${item.quantity}`);
            if (item.modifiers.length > 0) {
                lines.push(`  + ${item.modifiers.join(', ')}`);
            }
            if (item.notes) {
                lines.push(`  Note: ${item.notes}`);
            }
        });

        // Fulfillment
        if (conversation.fulfillment === 'pickup') {
            lines.push(`Pickup: ${conversation.pickupTime}`);
        } else {
            lines.push(`${lang === 'da' ? 'Levering' : 'Delivery'}: ${conversation.deliveryAddress}`);
            if (conversation.doorCode) lines.push(`${lang === 'da' ? 'Dør kode' : 'Door code'}: ${conversation.doorCode}`);
            if (conversation.floor) lines.push(`${lang === 'da' ? 'Etage' : 'Floor'}: ${conversation.floor}`);
        }

        // Customer
        lines.push(`${lang === 'da' ? 'Navn' : 'Name'}: ${conversation.customerName}`);
        lines.push(`${lang === 'da' ? 'Telefon' : 'Phone'}: ${conversation.phone}`);

        // Total if available
        const total = conversation.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
        if (total > 0) {
            lines.push(`Total: ${total} kr`);
        }

        return this.getMessage('confirmOrder', lang, { summary: lines.join('\n') });
    },

    generateSummaryHash(conversation) {
        const data = {
            items: conversation.items.map(i => `${i.menuItemId}:${i.quantity}`).join(','),
            fulfillment: conversation.fulfillment,
            address: conversation.deliveryAddress || conversation.pickupTime,
            phone: conversation.phone
        };
        // Simple hash (in production use crypto)
        return btoa(JSON.stringify(data)).slice(0, 16);
    },

    // Check if order should escalate to human
    shouldEscalate(conversation, reason) {
        const reasons = {
            frustration: conversation.metadata.frustrationCount >= this.config.escalationThreshold,
            catering: conversation.items.reduce((sum, i) => sum + i.quantity, 0) > this.config.cateringThreshold,
            refund: true,
            complaint: true,
            severeAllergy: true,
            technicalFailure: conversation.metadata.retryCount >= this.config.maxRetries,
            userRequest: true
        };
        return reasons[reason] || false;
    },

    // Mark frustration
    markFrustration(conversation) {
        conversation.metadata.frustrationCount++;
        if (this.shouldEscalate(conversation, 'frustration')) {
            conversation.state = this.states.HANDOFF;
            return true;
        }
        return false;
    },

    // ============================================================
    // INTEGRATION TOOLS INTERFACE
    // ============================================================

    integrationTools: {
        // Override these methods with actual API calls

        /**
         * Look up menu items
         * @param {string} query - Search query
         * @returns {Promise<Array>} Menu items
         */
        async lookupMenu(query) {
            // Default: use local menu catalog
            return OrderingAgent.searchMenu(query);
        },

        /**
         * Check restaurant availability
         * @param {Date} datetime - Requested time
         * @returns {Promise<Object>} Availability info
         */
        async getAvailability(datetime) {
            // Override with actual API call
            return {
                open: true,
                nextOpenTime: null,
                estimatedWait: '20-30 min'
            };
        },

        /**
         * Create order in the platform
         * @param {Object} orderDraft - The order draft
         * @returns {Promise<Object>} Order result
         */
        async createOrder(orderDraft) {
            // Override with actual API call
            getLogger().info({
                event: 'order.creating',
                channel: orderDraft.channel,
                item_count: orderDraft.items?.length || 0,
                fulfillment: orderDraft.fulfillment
            });
            return {
                success: true,
                orderId: 'ORD-' + Date.now(),
                estimatedTime: '30-45 min'
            };
        },

        /**
         * Get order status
         * @param {string} orderId - Order ID
         * @returns {Promise<Object>} Order status
         */
        async getOrderStatus(orderId) {
            // Override with actual API call
            return {
                status: 'preparing',
                estimatedTime: '25 min'
            };
        }
    },

    // ============================================================
    // INITIALIZATION
    // ============================================================

    /**
     * Initialize the ordering agent
     * @param {Object} options - Configuration options
     */
    async init(options = {}) {
        // Merge config
        if (options.config) {
            Object.assign(this.config, options.config);
        }

        // Load menu
        if (options.menuItems) {
            this.menuCatalog.loadMenu(options.menuItems);
        }

        // Load synonyms
        if (options.synonyms) {
            this.menuCatalog.loadSynonyms(options.synonyms);
        }

        // Override integration tools
        if (options.integrationTools) {
            Object.assign(this.integrationTools, options.integrationTools);
        }

        // Initialize payments if config provided
        if (options.paymentConfig && options.restaurantId) {
            await this.initPayments(options.restaurantId, options.paymentConfig);
        }

        // Connect social channels if tokens provided
        if (options.restaurantId) {
            if (options.instagramToken && options.instagramPageId) {
                await this.connectInstagram(options.restaurantId, options.instagramToken, options.instagramPageId);
            }
            if (options.facebookToken && options.facebookPageId) {
                await this.connectFacebook(options.restaurantId, options.facebookToken, options.facebookPageId);
            }
        }

        getLogger().info({
            event: 'system.agent.initialized',
            menu_items: this.menuCatalog.items.length,
            payments_enabled: this.paymentProviders.configured,
            ml_storage_enabled: this.config.enableMLStorage,
            analytics_enabled: this.config.enableAnalytics,
            version: this.version
        });

        return this;
    },

    /**
     * Reset a conversation
     * @param {string} channel - Channel (instagram/facebook)
     * @param {string} threadId - Thread ID
     */
    resetConversation(channel, threadId) {
        const key = `${channel}:${threadId}`;
        this.conversations.delete(key);
    },

    /**
     * Get all active conversations
     * @returns {Map} Active conversations
     */
    getActiveConversations() {
        return new Map(this.conversations);
    }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrderingAgent;
}
