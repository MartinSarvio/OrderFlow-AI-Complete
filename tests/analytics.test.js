/**
 * Tests for Analytics Dashboard data loading and formatting
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load AnalyticsDashboard source
const dashboardSource = readFileSync(resolve(__dirname, '../js/analytics-dashboard.js'), 'utf-8')

let AnalyticsDashboard
beforeEach(() => {
  // Set up DOM elements
  document.body.innerHTML = `
    <div id="chart-revenue"></div>
    <div id="channel-bars"></div>
    <div id="stat-revenue-value"></div>
    <div id="stat-orders-value"></div>
    <div id="stat-aov-value"></div>
    <div id="stat-visitors-value"></div>
    <div id="ai-conversations"></div>
    <div id="ai-completion-rate"></div>
    <div id="ai-orders"></div>
    <div id="ai-escalations"></div>
  `

  // Reset globals
  globalThis.currentUser = { role: 'admin' }
  globalThis.isDemoDataEnabled = () => false

  // Evaluate module (creates window.AnalyticsDashboard)
  eval(dashboardSource)
  AnalyticsDashboard = globalThis.window.AnalyticsDashboard
})

describe('shouldShowDemoData', () => {
  it('returns false for admin role', () => {
    globalThis.currentUser = { role: 'admin' }
    expect(AnalyticsDashboard.shouldShowDemoData()).toBe(false)
  })

  it('returns false for employee role', () => {
    globalThis.currentUser = { role: 'employee' }
    expect(AnalyticsDashboard.shouldShowDemoData()).toBe(false)
  })

  it('returns true for demo role', () => {
    globalThis.currentUser = { role: 'demo' }
    expect(AnalyticsDashboard.shouldShowDemoData()).toBe(true)
  })

  it('returns false when no user', () => {
    globalThis.currentUser = undefined
    expect(AnalyticsDashboard.shouldShowDemoData()).toBe(false)
  })
})

describe('Date Range', () => {
  it('returns today for today range', () => {
    const { start, end } = AnalyticsDashboard.getDateRange('today')
    expect(start).toBe(end)
  })

  it('returns 7 day range', () => {
    const { start, end } = AnalyticsDashboard.getDateRange('7days')
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24))
    expect(diffDays).toBe(7)
  })

  it('returns 30 day range', () => {
    const { start, end } = AnalyticsDashboard.getDateRange('30days')
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24))
    expect(diffDays).toBe(30)
  })
})

describe('Data Aggregation', () => {
  it('aggregates empty data', () => {
    const totals = AnalyticsDashboard.aggregateMetrics([])
    expect(totals.totalRevenue).toBe(0)
    expect(totals.totalOrders).toBe(0)
  })

  it('aggregates daily metrics correctly', () => {
    const data = [
      { total_revenue_dkk: 5000, total_orders: 20, unique_visitors: 100, total_sessions: 120, orders_web: 8, orders_app: 12, orders_instagram: 0, orders_facebook: 0, orders_sms: 0, orders_phone: 0, orders_delivery: 12, orders_pickup: 8, orders_dine_in: 0 },
      { total_revenue_dkk: 7000, total_orders: 30, unique_visitors: 150, total_sessions: 180, orders_web: 10, orders_app: 15, orders_instagram: 2, orders_facebook: 1, orders_sms: 1, orders_phone: 1, orders_delivery: 18, orders_pickup: 12, orders_dine_in: 0 },
    ]
    const totals = AnalyticsDashboard.aggregateMetrics(data)
    expect(totals.totalRevenue).toBe(12000)
    expect(totals.totalOrders).toBe(50)
    expect(totals.uniqueVisitors).toBe(250)
    expect(totals.ordersWeb).toBe(18)
    expect(totals.ordersDelivery).toBe(30)
  })
})

describe('Formatting', () => {
  it('formats currency correctly', () => {
    const formatted = AnalyticsDashboard.formatCurrency(12500)
    expect(formatted).toContain('12')
    expect(formatted).toContain('500')
  })

  it('formats null currency as dash', () => {
    expect(AnalyticsDashboard.formatCurrency(null)).toBe('-')
  })

  it('formats short currency', () => {
    const formatted = AnalyticsDashboard.formatCurrency(5500, true)
    expect(formatted).toContain('5.5k')
  })

  it('formats number correctly', () => {
    expect(AnalyticsDashboard.formatNumber(42)).toContain('42')
  })

  it('formats null number as dash', () => {
    expect(AnalyticsDashboard.formatNumber(null)).toBe('-')
  })
})

describe('Demo Data Generators', () => {
  it('generates correct number of days', () => {
    const data = AnalyticsDashboard.generateDemoMetrics(7)
    expect(data).toHaveLength(7)
  })

  it('generates metrics with required fields', () => {
    const data = AnalyticsDashboard.generateDemoMetrics(1)
    const day = data[0]
    expect(day).toHaveProperty('date')
    expect(day).toHaveProperty('total_revenue_dkk')
    expect(day).toHaveProperty('total_orders')
    expect(day).toHaveProperty('unique_visitors')
  })

  it('generates AI metrics with all fields', () => {
    const metrics = AnalyticsDashboard.generateDemoAIMetrics()
    expect(metrics).toHaveProperty('total_conversations')
    expect(metrics).toHaveProperty('orders_created')
    expect(metrics).toHaveProperty('completion_rate')
    expect(metrics).toHaveProperty('escalations')
  })

  it('generates product data', () => {
    const products = AnalyticsDashboard.generateDemoProductData()
    expect(products.length).toBeGreaterThan(0)
    expect(products[0]).toHaveProperty('product_name')
    expect(products[0]).toHaveProperty('revenue_dkk')
  })
})

describe('Empty State', () => {
  it('shows empty state for overview', () => {
    AnalyticsDashboard.showEmptyState('overview')
    const chartEl = document.getElementById('chart-revenue')
    expect(chartEl.innerHTML).toContain('Ingen data endnu')
  })

  it('updates AI summary with zeros', () => {
    AnalyticsDashboard.showEmptyState('overview')
    const aiEl = document.getElementById('ai-conversations')
    expect(aiEl.textContent).toBe('0')
  })
})
