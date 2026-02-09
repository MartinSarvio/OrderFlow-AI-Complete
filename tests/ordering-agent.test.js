/**
 * Tests for the OrderFlow Ordering Agent
 * Tests intent detection, menu matching, and conversation state management
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load OrderingAgent source
const agentSource = readFileSync(resolve(__dirname, '../js/ordering-agent.js'), 'utf-8')

// Execute in test context to get OrderingAgent
let OrderingAgent
beforeEach(() => {
  // Reset globals
  globalThis.window = { ...globalThis.window, orderLogger: console, aiLogger: console, channelLogger: console, flowLogger: console }
  globalThis.console = console

  // Evaluate module
  const module = { exports: {} }
  globalThis.module = module
  eval(agentSource)
  OrderingAgent = module.exports
  delete globalThis.module

  // Load test menu
  OrderingAgent.menuCatalog.loadMenu([
    { id: 'p1', name: 'Margherita Pizza', price: 89, category: 'Pizza', allergens: [], synonyms: ['margherita'] },
    { id: 'p2', name: 'Pepperoni Pizza', price: 99, category: 'Pizza', allergens: ['gluten'], synonyms: ['pepperoni'] },
    { id: 'p3', name: 'Caesar Salat', price: 79, category: 'Salat', allergens: ['æg'], synonyms: ['caesar salad'] },
    { id: 'p4', name: 'Cola', price: 30, category: 'Drikkevarer', allergens: [], synonyms: ['coca cola'] },
  ])
})

describe('Intent Detection', () => {
  it('detects order intent', () => {
    const result = OrderingAgent.detectIntent('Jeg vil gerne bestille en pizza')
    expect(result.intent).toBe('order_food')
    expect(result.confidence).toBeGreaterThan(0.7)
  })

  it('detects greeting intent', () => {
    const result = OrderingAgent.detectIntent('Hej!')
    expect(result.intent).toBe('greeting')
    expect(result.confidence).toBeGreaterThan(0.8)
  })

  it('detects confirm intent', () => {
    const result = OrderingAgent.detectIntent('ja')
    expect(result.intent).toBe('confirm')
    expect(result.confidence).toBeGreaterThan(0.6) // Short messages get confidence penalty
  })

  it('detects cancel intent', () => {
    const result = OrderingAgent.detectIntent('nej')
    expect(result.intent).toBe('cancel')
    expect(result.confidence).toBeGreaterThan(0.8)
  })

  it('detects support intent', () => {
    const result = OrderingAgent.detectIntent('Jeg har et problem med min ordre')
    expect(result.intent).toBe('support')
  })

  it('detects fulfillment intent with pickup', () => {
    const result = OrderingAgent.detectIntent('Jeg vil hente den')
    expect(result.intent).toBe('fulfillment')
  })

  it('extracts quantity entities', () => {
    const result = OrderingAgent.detectIntent('2 stk margherita')
    expect(result.entities.some(e => e.type === 'quantity')).toBe(true)
  })
})

describe('Menu Matching', () => {
  it('finds exact match', () => {
    const results = OrderingAgent.searchMenu('Margherita Pizza')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].item.id).toBe('p1')
    expect(results[0].score).toBe(1)
  })

  it('finds partial match', () => {
    const results = OrderingAgent.searchMenu('margherita')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].item.id).toBe('p1')
  })

  it('finds fuzzy match', () => {
    const results = OrderingAgent.searchMenu('margherita piza')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].item.name).toContain('Margherita')
  })

  it('returns empty for no match', () => {
    const results = OrderingAgent.searchMenu('sushi')
    expect(results.length).toBe(0)
  })

  it('handles synonym lookup', () => {
    OrderingAgent.menuCatalog.addSynonym('pep', 'pepperoni pizza')
    const results = OrderingAgent.searchMenu('pep')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].item.id).toBe('p2')
  })
})

describe('Language Detection', () => {
  it('detects Danish', () => {
    expect(OrderingAgent.detectLanguage('Jeg vil gerne bestille mad')).toBe('da')
  })

  it('detects English', () => {
    expect(OrderingAgent.detectLanguage('I want to order food please')).toBe('en')
  })

  it('returns null for ambiguous text', () => {
    expect(OrderingAgent.detectLanguage('pizza')).toBeNull()
  })
})

describe('Conversation State', () => {
  it('creates a new order draft with correct defaults', () => {
    const draft = OrderingAgent.createOrderDraft('instagram', 'thread123')
    expect(draft.channel).toBe('instagram')
    expect(draft.threadId).toBe('thread123')
    expect(draft.state).toBe('greeting')
    expect(draft.items).toEqual([])
    expect(draft.fulfillment).toBeNull()
  })

  it('gets or creates conversation', () => {
    const conv1 = OrderingAgent.getConversation('instagram', 'abc')
    const conv2 = OrderingAgent.getConversation('instagram', 'abc')
    expect(conv1).toBe(conv2) // Same reference
  })

  it('creates separate conversations for different threads', () => {
    const conv1 = OrderingAgent.getConversation('instagram', 'abc')
    const conv2 = OrderingAgent.getConversation('instagram', 'def')
    expect(conv1).not.toBe(conv2)
  })

  it('resets conversation', () => {
    OrderingAgent.getConversation('instagram', 'abc')
    OrderingAgent.resetConversation('instagram', 'abc')
    const conv = OrderingAgent.getConversation('instagram', 'abc')
    expect(conv.state).toBe('greeting') // Fresh state
  })
})

describe('Order Helpers', () => {
  it('creates order item with correct structure', () => {
    const item = OrderingAgent.createOrderItem('p1', 'Margherita Pizza', 2)
    expect(item.menuItemId).toBe('p1')
    expect(item.name).toBe('Margherita Pizza')
    expect(item.quantity).toBe(2)
    expect(item.modifiers).toEqual([])
  })

  it('calculates order total', () => {
    const conv = OrderingAgent.createOrderDraft('instagram', 'test')
    conv.items = [
      { name: 'Pizza', quantity: 1, unitPrice: 89, totalPrice: 89 },
      { name: 'Cola', quantity: 1, unitPrice: 30, totalPrice: 30 },
    ]
    const total = OrderingAgent.calculateOrderTotal(conv)
    expect(total).toBe(119)
  })

  it('returns 0 for empty order', () => {
    const conv = OrderingAgent.createOrderDraft('instagram', 'test')
    expect(OrderingAgent.calculateOrderTotal(conv)).toBe(0)
  })

  it('generates summary hash', () => {
    const conv = OrderingAgent.createOrderDraft('instagram', 'test')
    conv.items = [{ menuItemId: 'p1', quantity: 1 }]
    conv.fulfillment = 'pickup'
    conv.phone = '12345678'
    const hash = OrderingAgent.generateSummaryHash(conv)
    expect(hash).toBeTruthy()
    expect(typeof hash).toBe('string')
  })

  it('detects escalation conditions', () => {
    const conv = OrderingAgent.createOrderDraft('instagram', 'test')
    conv.metadata.frustrationCount = 3
    expect(OrderingAgent.shouldEscalate(conv, 'frustration')).toBe(true)
  })

  it('does not escalate below threshold', () => {
    const conv = OrderingAgent.createOrderDraft('instagram', 'test')
    conv.metadata.frustrationCount = 1
    expect(OrderingAgent.shouldEscalate(conv, 'frustration')).toBe(false)
  })
})

describe('Similarity Score', () => {
  it('returns 1 for identical strings', () => {
    expect(OrderingAgent.similarityScore('pizza', 'pizza')).toBe(1)
  })

  it('returns high score for similar strings', () => {
    const score = OrderingAgent.similarityScore('margherita', 'margarita')
    expect(score).toBeGreaterThan(0.7)
  })

  it('returns low score for different strings', () => {
    const score = OrderingAgent.similarityScore('pizza', 'sushi')
    expect(score).toBeLessThan(0.5)
  })
})
