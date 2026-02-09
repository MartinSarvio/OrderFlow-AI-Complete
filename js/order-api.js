/**
 * FLOW Order API
 * Shared order/checkout module for all templates + mobile app
 * Handles: order creation, Stripe payments, customer management
 */
(function() {
  'use strict';

  const SUPABASE_URL = 'https://qymtjhzgtcittohutmay.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5bXRqaHpndGNpdHRvaHV0bWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MjMzNjYsImV4cCI6MjA2NzI5OTM2Nn0.n6FYURqirRHO0pLPVDflAjH34aiiSxx7a_ZckDPW4DE';

  // Stripe publishable test key (safe for client-side)
  const STRIPE_PK = 'pk_test_51RGl6tP4VJXN9yOHBMtVMgKHQJnc2lXz8jVbF7JqRm0mYHmgDKN9k1t8NlCxQZcjLFfBP4qD1WHJ3FnEQMfWlwl00lCvNqUUi';

  let supabase = null;
  let stripe = null;

  // ========== INITIALIZATION ==========

  function initSupabase() {
    if (supabase) return supabase;
    if (window.supabase?.createClient) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      return supabase;
    }
    return null;
  }

  function initStripe() {
    if (stripe) return stripe;
    if (window.Stripe) {
      stripe = window.Stripe(STRIPE_PK);
      return stripe;
    }
    return null;
  }

  // ========== CUSTOMER MANAGEMENT ==========

  /**
   * Get or create customer in Supabase
   * Uses the database function get_or_create_customer()
   */
  async function getOrCreateCustomer(tenantId, customerData) {
    if (!supabase) initSupabase();
    if (!supabase) return { error: 'Supabase not initialized' };

    try {
      const { data, error } = await supabase.rpc('get_or_create_customer', {
        p_tenant_id: tenantId,
        p_phone: customerData.phone || null,
        p_email: customerData.email || null,
        p_name: customerData.name || null
      });

      if (error) throw error;
      return { customerId: data };
    } catch (err) {
      console.error('Order API: getOrCreateCustomer failed:', err);
      return { error: err.message };
    }
  }

  // ========== ORDER CREATION ==========

  /**
   * Generate a unique order number (client-side fallback)
   */
  function generateOrderNumber() {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `${yy}${mm}${dd}-${rand}`;
  }

  /**
   * Create order in Supabase unified_orders table
   * @param {object} orderData - Full order data
   * @returns {object} { order, error }
   */
  async function createOrder(orderData) {
    if (!supabase) initSupabase();
    if (!supabase) {
      // Fallback: save to localStorage
      return saveOrderLocally(orderData);
    }

    try {
      // Get or create customer
      let customerId = null;
      if (orderData.tenantId && (orderData.customer?.email || orderData.customer?.phone)) {
        const result = await getOrCreateCustomer(orderData.tenantId, orderData.customer);
        if (result.customerId) customerId = result.customerId;
      }

      // Build line_items JSONB
      const lineItems = (orderData.items || []).map(item => ({
        id: item.id || item.product_id,
        name: item.name,
        quantity: item.quantity || 1,
        unit_price: Math.round((item.price || item.unit_price) * 100), // DKK to øre
        modifiers: item.options || item.modifiers || [],
        notes: item.notes || ''
      }));

      const dbOrder = {
        tenant_id: orderData.tenantId,
        source_channel: orderData.sourceChannel || 'web',
        customer_id: customerId,
        line_items: lineItems,
        subtotal: orderData.subtotal || 0,
        tax_amount: orderData.tax || 0,
        delivery_fee: orderData.deliveryFee || 0,
        tip_amount: orderData.tip || 0,
        total: orderData.total || 0,
        currency: 'DKK',
        fulfillment_type: orderData.orderType || 'pickup',
        scheduled_time: orderData.scheduledTime || null,
        delivery_address: orderData.deliveryAddress ? {
          street: orderData.deliveryAddress.street,
          city: orderData.deliveryAddress.city,
          postal_code: orderData.deliveryAddress.postalCode,
          floor: orderData.deliveryAddress.floor,
          door_code: orderData.deliveryAddress.doorCode,
          instructions: orderData.deliveryAddress.instructions
        } : null,
        customer_name: orderData.customer?.name || '',
        customer_phone: orderData.customer?.phone || '',
        customer_email: orderData.customer?.email || '',
        payment_method: orderData.paymentMethod || 'card',
        payment_status: 'pending',
        status: 'pending',
        customer_notes: orderData.notes || '',
        metadata: {
          template: orderData.template || 'unknown',
          userAgent: navigator.userAgent?.substring(0, 200)
        }
      };

      const { data, error } = await supabase
        .from('unified_orders')
        .insert([dbOrder])
        .select()
        .single();

      if (error) throw error;

      // Also save locally as backup
      saveOrderLocally({ ...orderData, orderId: data.id, orderNumber: data.order_number });

      return { order: data };
    } catch (err) {
      console.error('Order API: createOrder failed:', err);
      // Fallback to localStorage
      const local = saveOrderLocally(orderData);
      return { order: local.order, error: err.message, savedLocally: true };
    }
  }

  /**
   * Save order to localStorage as backup/fallback
   */
  function saveOrderLocally(orderData) {
    try {
      const orderNumber = orderData.orderNumber || generateOrderNumber();
      const order = {
        id: orderData.orderId || 'local-' + Date.now(),
        order_number: orderNumber,
        ...orderData,
        created_at: new Date().toISOString()
      };

      const key = 'flow_orders_pending';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push(order);
      localStorage.setItem(key, JSON.stringify(existing));

      return { order };
    } catch (e) {
      return { order: { order_number: generateOrderNumber() }, error: 'localStorage failed' };
    }
  }

  // ========== STRIPE PAYMENT ==========

  /**
   * Create a Stripe PaymentIntent via Edge Function
   * @param {number} amount - Amount in DKK (e.g. 149.50)
   * @param {object} metadata - Optional metadata
   * @returns {object} { clientSecret, paymentIntentId, error }
   */
  async function createPaymentIntent(amount, metadata = {}) {
    try {
      const amountInOere = Math.round(amount * 100);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({
          amount: amountInOere,
          currency: 'dkk',
          metadata
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Payment intent failed');

      return {
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId
      };
    } catch (err) {
      console.error('Order API: createPaymentIntent failed:', err);
      return { error: err.message };
    }
  }

  /**
   * Mount Stripe Payment Element into a container
   * @param {string} clientSecret - From createPaymentIntent
   * @param {HTMLElement} container - DOM element to mount into
   * @returns {object} { elements, paymentElement }
   */
  function mountPaymentElement(clientSecret, container) {
    if (!stripe) initStripe();
    if (!stripe) return { error: 'Stripe not loaded' };

    const elements = stripe.elements({
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#1a1a2e',
          borderRadius: '8px',
          fontFamily: 'Inter, system-ui, sans-serif'
        }
      },
      locale: 'da'
    });

    const paymentElement = elements.create('payment', {
      layout: 'tabs'
    });

    paymentElement.mount(container);

    return { elements, paymentElement };
  }

  /**
   * Confirm payment with Stripe
   * @param {object} elements - Stripe Elements instance
   * @param {string} returnUrl - URL to redirect after payment
   * @returns {object} { paymentIntent, error }
   */
  async function confirmPayment(elements, returnUrl) {
    if (!stripe) initStripe();
    if (!stripe) return { error: 'Stripe not loaded' };

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl || window.location.href
      },
      redirect: 'if_required'
    });

    if (error) {
      return { error: error.message };
    }

    return { paymentIntent };
  }

  /**
   * Update order payment status in Supabase
   */
  async function updateOrderPayment(orderId, paymentData) {
    if (!supabase) initSupabase();
    if (!supabase) return { error: 'Supabase not initialized' };

    try {
      const { data, error } = await supabase
        .from('unified_orders')
        .update({
          payment_status: paymentData.status || 'paid',
          payment_provider: 'stripe',
          payment_reference: paymentData.paymentIntentId,
          paid_at: paymentData.status === 'paid' ? new Date().toISOString() : null,
          status: paymentData.status === 'paid' ? 'confirmed' : 'pending'
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return { order: data };
    } catch (err) {
      console.error('Order API: updateOrderPayment failed:', err);
      return { error: err.message };
    }
  }

  // ========== ORDER HISTORY ==========

  /**
   * Get order history for a customer (by email)
   */
  async function getOrderHistory(email, tenantId) {
    if (!supabase) initSupabase();
    if (!supabase) return { orders: [], error: 'Supabase not initialized' };

    try {
      let query = supabase
        .from('unified_orders')
        .select('*')
        .eq('customer_email', email)
        .order('created_at', { ascending: false })
        .limit(20);

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { orders: data || [] };
    } catch (err) {
      console.error('Order API: getOrderHistory failed:', err);
      return { orders: [], error: err.message };
    }
  }

  /**
   * Track order status in realtime
   * @param {string} orderId
   * @param {function} callback - Called with updated order data
   */
  function trackOrder(orderId, callback) {
    if (!supabase) initSupabase();
    if (!supabase) return null;

    const subscription = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'unified_orders',
        filter: `id=eq.${orderId}`
      }, (payload) => {
        callback(payload.new);
      })
      .subscribe();

    return subscription;
  }

  // ========== FULL CHECKOUT FLOW ==========

  /**
   * Complete checkout flow: create order → create payment → confirm
   * @param {object} orderData - Full order data
   * @param {object} elements - Stripe Elements instance (from mountPaymentElement)
   * @param {string} returnUrl - Redirect URL after payment
   * @returns {object} { order, paymentIntent, error }
   */
  async function checkout(orderData, elements, returnUrl) {
    // Step 1: Create order
    const orderResult = await createOrder(orderData);
    if (orderResult.error && !orderResult.order) {
      return { error: 'Kunne ikke oprette ordre: ' + orderResult.error };
    }

    const order = orderResult.order;

    // Step 2: Confirm Stripe payment
    if (orderData.paymentMethod === 'card' || orderData.paymentMethod === 'mobilepay') {
      const payResult = await confirmPayment(elements, returnUrl);
      if (payResult.error) {
        return { order, error: 'Betaling fejlede: ' + payResult.error };
      }

      // Step 3: Update order with payment info
      if (order.id && !order.id.startsWith('local-')) {
        await updateOrderPayment(order.id, {
          status: 'paid',
          paymentIntentId: payResult.paymentIntent?.id
        });
      }

      return { order, paymentIntent: payResult.paymentIntent };
    }

    // Cash payment - just return order
    return { order };
  }

  // ========== EXPOSE API ==========

  window.FlowOrders = {
    // Init
    initSupabase,
    initStripe,

    // Customer
    getOrCreateCustomer,

    // Orders
    createOrder,
    getOrderHistory,
    trackOrder,

    // Payments
    createPaymentIntent,
    mountPaymentElement,
    confirmPayment,
    updateOrderPayment,

    // Full flow
    checkout,

    // Utils
    generateOrderNumber
  };

  // Auto-init on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initSupabase();
      initStripe();
    });
  } else {
    initSupabase();
    initStripe();
  }
})();
