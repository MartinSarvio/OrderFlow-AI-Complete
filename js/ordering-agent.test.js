/**
 * OrderFlow Social Ordering Agent - Test Cases & Examples
 *
 * This file contains:
 * 1. Sample menu data
 * 2. Example dialog simulations
 * 3. Unit tests for core functionality
 */

// ============================================================
// SAMPLE MENU DATA
// ============================================================

const sampleMenu = [
    {
        id: 'pizza-001',
        sku: 'PIZZA-TRUF',
        name: 'Trøffelpizza',
        category: 'pizza',
        price: 149,
        variants: [
            { id: 'v1', name: 'Normal', price: 149 },
            { id: 'v2', name: 'Stor', price: 179 }
        ],
        modifiers: ['Extra ost', 'Uden løg'],
        allergens: ['gluten', 'mælk'],
        synonyms: ['trøffel pizza', 'truffle pizza']
    },
    {
        id: 'pizza-002',
        sku: 'PIZZA-MARG',
        name: 'Margherita',
        category: 'pizza',
        price: 99,
        variants: [
            { id: 'v1', name: 'Normal', price: 99 },
            { id: 'v2', name: 'Stor', price: 129 }
        ],
        allergens: ['gluten', 'mælk'],
        synonyms: ['margarita', 'margareta']
    },
    {
        id: 'burger-001',
        sku: 'BURG-BACON',
        name: 'Classic Bacon Burger',
        category: 'burger',
        price: 119,
        allergens: ['gluten', 'sennep'],
        synonyms: ['bacon burger', 'baconburger']
    },
    {
        id: 'burger-002',
        sku: 'BURG-SPICY',
        name: 'Spicy Bacon Burger',
        category: 'burger',
        price: 129,
        allergens: ['gluten', 'sennep'],
        synonyms: ['spicy burger', 'hot bacon burger']
    },
    {
        id: 'ramen-001',
        sku: 'RAMEN-PORK',
        name: 'Tonkotsu Ramen',
        category: 'ramen',
        price: 139,
        allergens: ['soja', 'hvede', 'æg'],
        synonyms: ['ramen', 'pork ramen', 'svinekød ramen']
    },
    {
        id: 'gyoza-001',
        sku: 'GYOZA-5',
        name: 'Gyoza (5 stk)',
        category: 'sides',
        price: 59,
        allergens: ['gluten', 'soja'],
        synonyms: ['gyoza', 'dumplings']
    },
    {
        id: 'beer-001',
        sku: 'BEER-PILS',
        name: 'Pilsner',
        category: 'drinks',
        price: 45,
        ageRestricted: true,
        synonyms: ['øl', 'beer', 'pils']
    },
    {
        id: 'dessert-001',
        sku: 'DESSERT-CHOC',
        name: 'Chokolade Fondant',
        category: 'dessert',
        price: 69,
        allergens: ['gluten', 'mælk', 'æg', 'nødder'],
        synonyms: ['fondant', 'chokoladekage']
    }
];

const sampleSynonyms = {
    'bbq ribs': 'Classic Bacon Burger',
    'ribs': 'Classic Bacon Burger',
    'spareribs': 'Classic Bacon Burger',
    'truffle pizza': 'Trøffelpizza',
    'trufflepizza': 'Trøffelpizza'
};

// ============================================================
// TEST UTILITIES
// ============================================================

const TestRunner = {
    results: [],

    async runTest(name, testFn) {
        console.log(`\n🧪 Running: ${name}`);
        try {
            await testFn();
            console.log(`✅ PASSED: ${name}`);
            this.results.push({ name, passed: true });
        } catch (error) {
            console.error(`❌ FAILED: ${name}`);
            console.error(`   Error: ${error.message}`);
            this.results.push({ name, passed: false, error: error.message });
        }
    },

    assertEqual(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`${message} Expected "${expected}", got "${actual}"`);
        }
    },

    assertContains(text, substring, message = '') {
        if (!text.includes(substring)) {
            throw new Error(`${message} Expected text to contain "${substring}"`);
        }
    },

    assertTrue(condition, message = '') {
        if (!condition) {
            throw new Error(message || 'Expected condition to be true');
        }
    },

    summary() {
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        console.log(`\n${'='.repeat(50)}`);
        console.log(`Test Summary: ${passed}/${total} passed`);
        if (passed < total) {
            console.log('\nFailed tests:');
            this.results.filter(r => !r.passed).forEach(r => {
                console.log(`  - ${r.name}: ${r.error}`);
            });
        }
        console.log('='.repeat(50));
    }
};

// ============================================================
// DIALOG SIMULATIONS
// ============================================================

const DialogSimulator = {
    async simulateDialog(dialogSteps, description) {
        console.log(`\n📱 Dialog: ${description}`);
        console.log('-'.repeat(40));

        // Initialize agent with sample menu
        OrderingAgent.init({
            menuItems: sampleMenu,
            synonyms: sampleSynonyms
        });

        const channel = 'instagram';
        const threadId = 'test-' + Date.now();

        for (const step of dialogSteps) {
            if (step.customer) {
                console.log(`👤 Customer: ${step.customer}`);
                const result = await OrderingAgent.processMessage(channel, threadId, step.customer);
                console.log(`🤖 Agent: ${result.response}`);

                if (step.expectContains) {
                    for (const expected of step.expectContains) {
                        if (!result.response.toLowerCase().includes(expected.toLowerCase())) {
                            console.warn(`   ⚠️ Expected response to contain: "${expected}"`);
                        }
                    }
                }

                if (step.expectState) {
                    if (result.state !== step.expectState) {
                        console.warn(`   ⚠️ Expected state: ${step.expectState}, got: ${result.state}`);
                    }
                }
            }
        }

        // Cleanup
        OrderingAgent.resetConversation(channel, threadId);
        console.log('-'.repeat(40));
    }
};

// ============================================================
// EXAMPLE DIALOGS
// ============================================================

const exampleDialogs = {
    // A) Instagram - Interest from post (Danish)
    async dialogA() {
        await DialogSimulator.simulateDialog([
            { customer: 'Jeg så jeres trøffelpizza. Kan jeg bestille 2?' },
            { customer: 'Levering' },
            { customer: 'Normal' },
            { customer: 'Nørrebrogade 10, 3 tv. 2200' },
            { customer: 'Sara' },
            { customer: '12345678' },
            { customer: 'YES', expectContains: ['ordren er placeret'] }
        ], 'A) Instagram - Order from post (Danish)');
    },

    // B) Facebook - Question and upsell
    async dialogB() {
        await DialogSimulator.simulateDialog([
            { customer: 'Hvad er der i jeres ramen?' },
            { customer: 'Ja 1 ramen, og 1 gyoza' },
            { customer: 'Pickup' },
            { customer: 'Om 30 min' },
            { customer: 'Mads' },
            { customer: '99887766' },
            { customer: 'YES' }
        ], 'B) Facebook - Question and order');
    },

    // C) Ambiguous order
    async dialogC() {
        await DialogSimulator.simulateDialog([
            { customer: 'Jeg vil have den burger med bacon', expectContains: ['Classic Bacon', 'Spicy Bacon'] },
            { customer: '2' },
            { customer: 'Pickup' },
            { customer: '20 min' },
            { customer: 'Thomas' },
            { customer: '55667788' },
            { customer: 'YES' }
        ], 'C) Ambiguous order - burger selection');
    },

    // D) Allergy question
    async dialogD() {
        await DialogSimulator.simulateDialog([
            { customer: 'Er der nødder i den dessert?', expectContains: ['nødder'] },
        ], 'D) Allergy question');
    },

    // E) English conversation
    async dialogE() {
        await DialogSimulator.simulateDialog([
            { customer: 'Hi, I would like to order the truffle pizza' },
            { customer: 'Delivery' },
            { customer: 'Vesterbrogade 42, 1620' },
            { customer: 'John' },
            { customer: '40506070' },
            { customer: 'YES' }
        ], 'E) English conversation');
    }
};

// ============================================================
// UNIT TESTS
// ============================================================

const unitTests = {
    async testLanguageDetection() {
        await TestRunner.runTest('Language detection - Danish', () => {
            const result = OrderingAgent.detectLanguage('Jeg vil gerne bestille mad');
            TestRunner.assertEqual(result, 'da', 'Danish detection');
        });

        await TestRunner.runTest('Language detection - English', () => {
            const result = OrderingAgent.detectLanguage('I would like to order food');
            TestRunner.assertEqual(result, 'en', 'English detection');
        });
    },

    async testMenuSearch() {
        OrderingAgent.init({ menuItems: sampleMenu, synonyms: sampleSynonyms });

        await TestRunner.runTest('Menu search - exact match', () => {
            const results = OrderingAgent.searchMenu('Trøffelpizza');
            TestRunner.assertTrue(results.length > 0, 'Should find results');
            TestRunner.assertEqual(results[0].item.name, 'Trøffelpizza', 'Should match exact');
        });

        await TestRunner.runTest('Menu search - synonym match', () => {
            const results = OrderingAgent.searchMenu('ramen');
            TestRunner.assertTrue(results.length > 0, 'Should find ramen');
        });

        await TestRunner.runTest('Menu search - fuzzy match', () => {
            const results = OrderingAgent.searchMenu('margarita');
            TestRunner.assertTrue(results.length > 0, 'Should find margherita');
            TestRunner.assertContains(results[0].item.name.toLowerCase(), 'margherita', 'Fuzzy match');
        });
    },

    async testOrderDraftCreation() {
        await TestRunner.runTest('Order draft creation', () => {
            const draft = OrderingAgent.createOrderDraft('instagram', 'thread-123');
            TestRunner.assertEqual(draft.channel, 'instagram');
            TestRunner.assertEqual(draft.threadId, 'thread-123');
            TestRunner.assertEqual(draft.state, 'greeting');
            TestRunner.assertTrue(Array.isArray(draft.items));
        });
    },

    async testConversationState() {
        OrderingAgent.init({ menuItems: sampleMenu });
        const channel = 'facebook';
        const threadId = 'test-state-' + Date.now();

        await TestRunner.runTest('Conversation state transitions', async () => {
            // Start
            let result = await OrderingAgent.processMessage(channel, threadId, 'Hej');
            TestRunner.assertTrue(result.state !== undefined);

            // Order item
            result = await OrderingAgent.processMessage(channel, threadId, '1 Margherita');
            TestRunner.assertEqual(result.state, 'fulfillment_choice');

            // Choose fulfillment
            result = await OrderingAgent.processMessage(channel, threadId, 'Pickup');
            TestRunner.assertEqual(result.state, 'customer_details');
        });

        OrderingAgent.resetConversation(channel, threadId);
    },

    async testIdempotency() {
        await TestRunner.runTest('Summary hash generation', () => {
            const draft = OrderingAgent.createOrderDraft('instagram', 'test');
            draft.items = [OrderingAgent.createOrderItem('pizza-001', 'Test Pizza', 2)];
            draft.fulfillment = 'pickup';
            draft.pickupTime = '20 min';
            draft.phone = '12345678';

            const hash1 = OrderingAgent.generateSummaryHash(draft);
            const hash2 = OrderingAgent.generateSummaryHash(draft);

            TestRunner.assertEqual(hash1, hash2, 'Same data should produce same hash');
        });
    }
};

// ============================================================
// RUN ALL TESTS
// ============================================================

async function runAllTests() {
    console.log('🚀 OrderingAgent Test Suite');
    console.log('='.repeat(50));

    // Unit tests
    console.log('\n📋 UNIT TESTS');
    await unitTests.testLanguageDetection();
    await unitTests.testMenuSearch();
    await unitTests.testOrderDraftCreation();
    await unitTests.testConversationState();
    await unitTests.testIdempotency();

    TestRunner.summary();

    // Dialog simulations
    console.log('\n📋 DIALOG SIMULATIONS');
    await exampleDialogs.dialogA();
    await exampleDialogs.dialogB();
    await exampleDialogs.dialogC();
    await exampleDialogs.dialogD();
    await exampleDialogs.dialogE();
}

// ============================================================
// USAGE EXAMPLES
// ============================================================

const usageExamples = {
    /**
     * Basic initialization and message processing
     */
    basicUsage() {
        // Initialize with menu
        OrderingAgent.init({
            menuItems: sampleMenu,
            synonyms: sampleSynonyms
        });

        // Process incoming message
        const channel = 'instagram';
        const threadId = 'dm-123456';
        const message = 'Jeg vil gerne bestille 2 pizzaer';

        OrderingAgent.processMessage(channel, threadId, message)
            .then(result => {
                console.log('Response:', result.response);
                console.log('Current state:', result.state);
            });
    },

    /**
     * Custom integration with actual API
     */
    customIntegration() {
        OrderingAgent.init({
            menuItems: sampleMenu,
            integrationTools: {
                async createOrder(orderDraft) {
                    // Call your actual API
                    const response = await fetch('/api/orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            customer: {
                                name: orderDraft.customerName,
                                phone: orderDraft.phone
                            },
                            items: orderDraft.items,
                            fulfillment: {
                                type: orderDraft.fulfillment,
                                address: orderDraft.deliveryAddress,
                                pickupTime: orderDraft.pickupTime
                            },
                            channel: orderDraft.channel,
                            consent: orderDraft.consentFlags
                        })
                    });

                    const data = await response.json();
                    return {
                        success: response.ok,
                        orderId: data.orderId,
                        estimatedTime: data.estimatedTime,
                        error: data.error
                    };
                },

                async getAvailability(datetime) {
                    const response = await fetch(`/api/availability?time=${datetime.toISOString()}`);
                    return response.json();
                }
            }
        });
    },

    /**
     * Webhook handler for Instagram/Facebook
     */
    webhookHandler(req, res) {
        const { channel, threadId, message, sender } = req.body;

        OrderingAgent.processMessage(channel, threadId, message, { sender })
            .then(result => {
                // Send response back through messaging API
                res.json({
                    response: result.response,
                    threadId: threadId
                });
            })
            .catch(error => {
                console.error('Agent error:', error);
                res.status(500).json({ error: 'Processing failed' });
            });
    }
};

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sampleMenu,
        sampleSynonyms,
        runAllTests,
        TestRunner,
        DialogSimulator,
        exampleDialogs,
        unitTests,
        usageExamples
    };
}

// Run tests if executed directly
if (typeof window === 'undefined' && typeof process !== 'undefined') {
    runAllTests().catch(console.error);
}
