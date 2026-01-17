/**
 * SUPABASE CLIENT MODULE
 *
 * Centralized Supabase client configuration and helper functions.
 * Handles all database operations for OrderFlow AI.
 *
 * Project: OrderFlow-AI-Complete
 * URL: https://qymtjhzgtcittohutmay.supabase.co
 */

console.log('🔄 supabase-client.js loading...');

// Supabase Configuration
const SUPABASE_CONFIG = {
  url: 'https://qymtjhzgtcittohutmay.supabase.co',
  // NOTE: In production, use anon key for client-side, service_role only for server-side
  // For now, using service_role for full access during development
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5bXRqaHpndGNpdHRvaHV0bWF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTcyMzM2NiwiZXhwIjoyMDY3Mjk5MzY2fQ.th8EBi8r6JtR4nP0Q1FZoLiLT5-COohX4HvJ15Xd7G8'
};

// Export config to window for use in other modules
window.SUPABASE_CONFIG = SUPABASE_CONFIG;

// Initialize Supabase Client with retry mechanism
let supabase = null;
let initializationPromise = null;
const MAX_INIT_RETRIES = 50; // 5 seconds max (50 * 100ms)

function initializeSupabase() {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = new Promise((resolve, reject) => {
    let retryCount = 0;

    function attemptInit() {
      retryCount++;

      if (typeof window.supabase === 'undefined') {
        if (retryCount >= MAX_INIT_RETRIES) {
          console.error('❌ Supabase library failed to load after 5 seconds');
          // Create a mock client that will show proper errors
          window.supabaseClient = null;
          reject(new Error('Supabase library not loaded'));
          return;
        }
        console.warn(`⚠️ Supabase library not loaded yet, retrying... (${retryCount}/${MAX_INIT_RETRIES})`);
        setTimeout(attemptInit, 100);
        return;
      }

      try {
        supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: 'orderflow-auth-token',
            storage: window.localStorage
          }
        });
        console.log('✅ Supabase client initialized with session persistence:', SUPABASE_CONFIG.url);

        // Export immediately once initialized
        window.supabaseClient = supabase;
        resolve(supabase);
      } catch (err) {
        console.error('❌ Failed to initialize Supabase client:', err);
        reject(err);
      }
    }

    attemptInit();
  });

  return initializationPromise;
}

// Start initialization immediately
initializeSupabase();

// Export promise for other modules to await
window.waitForSupabase = () => initializationPromise;

/**
 * SUPABASE DATABASE HELPER
 *
 * Provides convenient methods for all database operations.
 * Handles error logging and data transformation.
 */
const SupabaseDB = {
  // Get Supabase config for external use
  getConfig() {
    return SUPABASE_CONFIG;
  },

  // ============================================================================
  // RESTAURANTS
  // ============================================================================

  /**
   * Get all restaurants for current user
   */
  async getRestaurants(userId) {
    try {
      // Wait for Supabase to be initialized
      if (!supabase) {
        await window.waitForSupabase();
      }
      if (!supabase) {
        console.error('❌ Supabase not initialized in getRestaurants');
        return [];
      }

      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform bigint revenue fields to numbers
      return data.map(r => this._transformRestaurant(r));
    } catch (err) {
      console.error('❌ Error fetching restaurants:', err);
      throw err;
    }
  },

  /**
   * Get single restaurant by ID
   */
  async getRestaurant(restaurantId) {
    try {
      // Wait for Supabase to be initialized
      if (!supabase) {
        await window.waitForSupabase();
      }
      if (!supabase) {
        console.error('❌ Supabase not initialized in getRestaurant');
        return null;
      }

      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();

      if (error) throw error;

      return this._transformRestaurant(data);
    } catch (err) {
      console.error('❌ Error fetching restaurant:', err);
      throw err;
    }
  },

  /**
   * Create new restaurant
   */
  async createRestaurant(userId, restaurantData) {
    try {
      // Transform revenue fields to bigint (øre/cents)
      const dbData = this._prepareRestaurantForDB(restaurantData);
      dbData.user_id = userId;

      const { data, error } = await supabase
        .from('restaurants')
        .insert([dbData])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Restaurant created:', data.id);
      return this._transformRestaurant(data);
    } catch (err) {
      console.error('❌ Error creating restaurant:', err);
      throw err;
    }
  },

  /**
   * Update restaurant
   */
  async updateRestaurant(restaurantId, updates) {
    try {
      const dbData = this._prepareRestaurantForDB(updates);
      dbData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('restaurants')
        .update(dbData)
        .eq('id', restaurantId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Restaurant updated:', restaurantId);
      return this._transformRestaurant(data);
    } catch (err) {
      console.error('❌ Error updating restaurant:', err);
      throw err;
    }
  },

  /**
   * Delete restaurant
   */
  async deleteRestaurant(restaurantId) {
    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', restaurantId);

      if (error) throw error;

      console.log('✅ Restaurant deleted:', restaurantId);
      return true;
    } catch (err) {
      console.error('❌ Error deleting restaurant:', err);
      throw err;
    }
  },

  // ============================================================================
  // ORDERS
  // ============================================================================

  /**
   * Get orders for a restaurant
   */
  async getOrders(restaurantId, limit = 100) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(o => this._transformOrder(o));
    } catch (err) {
      console.error('❌ Error fetching orders:', err);
      throw err;
    }
  },

  /**
   * Alias for getOrders - compatibility with app.js
   */
  async getOrdersByRestaurant(restaurantId, limit = 100) {
    return this.getOrders(restaurantId, limit);
  },

  /**
   * Create new order
   */
  async createOrder(userId, restaurantId, orderData) {
    try {
      const dbData = this._prepareOrderForDB(orderData);
      dbData.user_id = userId;
      dbData.restaurant_id = restaurantId;

      const { data, error } = await supabase
        .from('orders')
        .insert([dbData])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Order created:', data.id);
      return this._transformOrder(data);
    } catch (err) {
      console.error('❌ Error creating order:', err);
      throw err;
    }
  },

  /**
   * Update order
   */
  async updateOrder(orderId, updates) {
    try {
      const dbData = this._prepareOrderForDB(updates);

      const { data, error } = await supabase
        .from('orders')
        .update(dbData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Order updated:', orderId);
      return this._transformOrder(data);
    } catch (err) {
      console.error('❌ Error updating order:', err);
      throw err;
    }
  },

  // ============================================================================
  // ACTIVITIES
  // ============================================================================

  /**
   * Get activity log for user
   */
  async getActivities(userId, limit = 100) {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('❌ Error fetching activities:', err);
      throw err;
    }
  },

  /**
   * Log new activity
   */
  async logActivity(userId, type, description, details = {}) {
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert([{
          user_id: userId,
          type: type,
          description: description,
          details: details,
          seen: false,
          timestamp: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Activity logged:', data.id);
      return data;
    } catch (err) {
      console.error('❌ Error logging activity:', err);
      throw err;
    }
  },

  /**
   * Mark activity as seen
   */
  async markActivitySeen(activityId) {
    try {
      const { error } = await supabase
        .from('activities')
        .update({ seen: true })
        .eq('id', activityId);

      if (error) throw error;

      console.log('✅ Activity marked as seen:', activityId);
      return true;
    } catch (err) {
      console.error('❌ Error marking activity as seen:', err);
      throw err;
    }
  },

  /**
   * Mark all activities in category as seen
   */
  async markCategoryActivitiesSeen(userId, category, subCategory = null) {
    try {
      let query = supabase
        .from('activities')
        .update({ seen: true })
        .eq('user_id', userId)
        .contains('details', { category: category });

      if (subCategory) {
        query = query.contains('details', { subCategory: subCategory });
      }

      const { error } = await query;

      if (error) throw error;

      console.log('✅ Category activities marked as seen:', category, subCategory);
      return true;
    } catch (err) {
      console.error('❌ Error marking category activities as seen:', err);
      throw err;
    }
  },

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================

  /**
   * Get all notifications for user
   */
  async getNotifications(userId) {
    try {
      // Clean up expired notifications first
      await this._cleanupExpiredNotifications();

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('❌ Error fetching notifications:', err);
      throw err;
    }
  },

  /**
   * Add notification
   */
  async addNotification(userId, path, notificationData) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          path: path,
          title: notificationData.title,
          message: notificationData.message,
          seen: false,
          timestamp: new Date().toISOString(),
          expires_at: notificationData.expires_at || null
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Notification added:', path);
      return data;
    } catch (err) {
      console.error('❌ Error adding notification:', err);
      throw err;
    }
  },

  /**
   * Clear notifications by path (including children)
   */
  async clearNotificationPath(userId, path) {
    try {
      // Delete all notifications that start with this path
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .or(`path.eq.${path},path.like.${path}.%`);

      if (error) throw error;

      console.log('✅ Notifications cleared for path:', path);
      return true;
    } catch (err) {
      console.error('❌ Error clearing notification path:', err);
      throw err;
    }
  },

  /**
   * Mark notification as seen
   */
  async markNotificationSeen(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ seen: true })
        .eq('id', notificationId);

      if (error) throw error;

      console.log('✅ Notification marked as seen:', notificationId);
      return true;
    } catch (err) {
      console.error('❌ Error marking notification as seen:', err);
      throw err;
    }
  },

  // ============================================================================
  // PRODUCTS
  // ============================================================================

  /**
   * Get products for a restaurant
   */
  async getProducts(restaurantId) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('name', { ascending: true });

      if (error) throw error;

      return data.map(p => this._transformProduct(p));
    } catch (err) {
      console.error('❌ Error fetching products:', err);
      throw err;
    }
  },

  /**
   * Create new product
   */
  async createProduct(userId, restaurantId, productData) {
    try {
      const dbData = this._prepareProductForDB(productData);
      dbData.user_id = userId;
      dbData.restaurant_id = restaurantId;

      const { data, error } = await supabase
        .from('products')
        .insert([dbData])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Product created:', data.id);
      return this._transformProduct(data);
    } catch (err) {
      console.error('❌ Error creating product:', err);
      throw err;
    }
  },

  /**
   * Update product
   */
  async updateProduct(productId, updates) {
    try {
      const dbData = this._prepareProductForDB(updates);

      const { data, error } = await supabase
        .from('products')
        .update(dbData)
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Product updated:', productId);
      return this._transformProduct(data);
    } catch (err) {
      console.error('❌ Error updating product:', err);
      throw err;
    }
  },

  /**
   * Delete product
   */
  async deleteProduct(productId) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      console.log('✅ Product deleted:', productId);
      return true;
    } catch (err) {
      console.error('❌ Error deleting product:', err);
      throw err;
    }
  },

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  /**
   * Subscribe to restaurant changes
   */
  subscribeToRestaurants(userId, callback) {
    return supabase
      .channel('restaurants-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurants',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔄 Restaurant change detected:', payload);
          callback(payload);
        }
      )
      .subscribe();
  },

  /**
   * Subscribe to order changes
   */
  subscribeToOrders(restaurantId, callback) {
    return supabase
      .channel(`orders-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          console.log('🔄 Order change detected:', payload);
          callback(payload);
        }
      )
      .subscribe();
  },

  /**
   * Subscribe to activity changes
   */
  subscribeToActivities(userId, callback) {
    return supabase
      .channel('activities-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔄 New activity detected:', payload);
          callback(payload);
        }
      )
      .subscribe();
  },

  /**
   * Subscribe to notification changes
   */
  subscribeToNotifications(userId, callback) {
    return supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔄 Notification change detected:', payload);
          callback(payload);
        }
      )
      .subscribe();
  },

  /**
   * Subscribe to inbound SMS messages
   */
  async subscribeToMessages(callback) {
    // Wait for Supabase to be initialized
    if (!supabase) {
      try {
        await window.waitForSupabase();
      } catch (err) {
        console.error('❌ Cannot subscribe to messages: Supabase failed to initialize', err);
        return null;
      }
    }
    if (!supabase) {
      console.error('❌ Cannot subscribe to messages: Supabase not initialized');
      return null;
    }

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('📨 New message detected:', payload);
          // Filtrer på inbound i callback i stedet for i Supabase filter
          if (payload.new && payload.new.direction === 'incoming') {
            callback(payload);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Messages realtime subscription established');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Messages subscription error:', err);
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Messages subscription timed out - retrying...');
          // Retry subscription after timeout
          setTimeout(() => {
            channel.subscribe();
          }, 2000);
        } else if (status === 'CLOSED') {
          console.warn('⚠️ Messages subscription closed');
        }
      });

    return channel;
  },

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll() {
    if (supabase) {
      supabase.removeAllChannels();
      console.log('🔇 All subscriptions removed');
    }
  },

  // ============================================================================
  // HELPER/INTERNAL METHODS
  // ============================================================================

  /**
   * Transform restaurant from DB (bigint → number for revenue fields)
   */
  _transformRestaurant(dbRestaurant) {
    if (!dbRestaurant) return null;

    return {
      ...dbRestaurant,
      // Convert bigint (øre/cents) to number (kr/dollars)
      revenueToday: Number(dbRestaurant.revenue_today || 0) / 100,
      revenueThisMonth: Number(dbRestaurant.revenue_this_month || 0) / 100,
      revenueTotal: Number(dbRestaurant.revenue_total || 0) / 100,
      // Transform snake_case to camelCase for common fields
      createdAt: dbRestaurant.created_at,
      updatedAt: dbRestaurant.updated_at,
      contactPhone: dbRestaurant.contact_phone,
      contactEmail: dbRestaurant.contact_email,
      // Product categories array
      productCategories: dbRestaurant.product_categories || [],
      // VAT rates
      vatRates: dbRestaurant.vat_rates || [],
    };
  },

  /**
   * Prepare restaurant for DB (number → bigint for revenue fields)
   */
  _prepareRestaurantForDB(restaurant) {
    const dbData = { ...restaurant };

    // Convert revenue fields from kr/dollars to øre/cents (bigint)
    if ('revenueToday' in restaurant) {
      dbData.revenue_today = Math.round((restaurant.revenueToday || 0) * 100);
      delete dbData.revenueToday;
    }
    if ('revenueThisMonth' in restaurant) {
      dbData.revenue_this_month = Math.round((restaurant.revenueThisMonth || 0) * 100);
      delete dbData.revenueThisMonth;
    }
    if ('revenueTotal' in restaurant) {
      dbData.revenue_total = Math.round((restaurant.revenueTotal || 0) * 100);
      delete dbData.revenueTotal;
    }

    // Handle productCategories → product_categories
    if ('productCategories' in restaurant) {
      dbData.product_categories = restaurant.productCategories;
      delete dbData.productCategories;
    }

    // Handle vatRates → vat_rates
    if ('vatRates' in restaurant) {
      dbData.vat_rates = restaurant.vatRates;
      delete dbData.vatRates;
    }

    // Remove computed/readonly fields
    delete dbData.id;
    delete dbData.created_at;
    delete dbData.updated_at;

    return dbData;
  },

  /**
   * Transform order from DB
   */
  _transformOrder(dbOrder) {
    if (!dbOrder) return null;

    return {
      ...dbOrder,
      subtotal: Number(dbOrder.subtotal || 0) / 100,
      tax: Number(dbOrder.tax || 0) / 100,
      delivery_fee: Number(dbOrder.delivery_fee || 0) / 100,
      total: Number(dbOrder.total || 0) / 100
    };
  },

  /**
   * Prepare order for DB
   */
  _prepareOrderForDB(order) {
    const dbData = { ...order };

    // Convert currency fields to øre/cents
    if ('subtotal' in order) dbData.subtotal = Math.round((order.subtotal || 0) * 100);
    if ('tax' in order) dbData.tax = Math.round((order.tax || 0) * 100);
    if ('delivery_fee' in order) dbData.delivery_fee = Math.round((order.delivery_fee || 0) * 100);
    if ('total' in order) dbData.total = Math.round((order.total || 0) * 100);

    // Remove computed fields
    delete dbData.id;
    delete dbData.created_at;
    delete dbData.updated_at;

    return dbData;
  },

  /**
   * Transform product from DB
   */
  _transformProduct(dbProduct) {
    if (!dbProduct) return null;

    return {
      ...dbProduct,
      price: Number(dbProduct.price || 0) / 100,
      cost: Number(dbProduct.cost || 0) / 100
    };
  },

  /**
   * Prepare product for DB
   */
  _prepareProductForDB(product) {
    const dbData = { ...product };

    // Convert currency fields
    if ('price' in product) dbData.price = Math.round((product.price || 0) * 100);
    if ('cost' in product) dbData.cost = Math.round((product.cost || 0) * 100);

    delete dbData.id;
    delete dbData.created_at;
    delete dbData.updated_at;

    return dbData;
  },

  /**
   * Clean up expired notifications
   */
  async _cleanupExpiredNotifications() {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) throw error;
    } catch (err) {
      console.error('⚠️ Error cleaning up expired notifications:', err);
    }
  },

  // ============================================================================
  // CUSTOMER LIFECYCLE & GDPR
  // ============================================================================

  /**
   * Terminate customer (soft delete with GDPR retention)
   * @param {string} restaurantId - Restaurant ID
   * @param {string} reason - Termination reason
   * @param {string} initiatedBy - Admin email who initiated
   * @returns {Object} Updated restaurant
   */
  async terminateCustomer(restaurantId, reason, initiatedBy) {
    try {
      const terminatedAt = new Date();
      const retentionDays = 1825; // 5 years (Danish accounting law)
      const gdprDeletionDate = new Date(terminatedAt);
      gdprDeletionDate.setDate(gdprDeletionDate.getDate() + retentionDays);

      const { data, error } = await supabase
        .from('restaurants')
        .update({
          status: 'terminated',
          terminated_at: terminatedAt.toISOString(),
          termination_reason: reason,
          termination_initiated_by: initiatedBy,
          gdpr_deletion_scheduled_at: gdprDeletionDate.toISOString(),
          retention_period_days: retentionDays,
          updated_at: new Date().toISOString()
        })
        .eq('id', restaurantId)
        .select()
        .single();

      if (error) throw error;

      // Log GDPR audit
      await this.logGdprAudit(restaurantId, 'termination_initiated',
        `Kunde opsagt: ${reason}`, initiatedBy);

      console.log('✅ Customer terminated:', restaurantId);
      return this._transformRestaurant(data);
    } catch (err) {
      console.error('❌ Error terminating customer:', err);
      throw err;
    }
  },

  /**
   * Reactivate a terminated customer
   * @param {string} restaurantId - Restaurant ID
   * @param {string} reactivatedBy - Admin email
   * @returns {Object} Updated restaurant
   */
  async reactivateCustomer(restaurantId, reactivatedBy) {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .update({
          status: 'active',
          terminated_at: null,
          termination_reason: null,
          termination_initiated_by: null,
          gdpr_deletion_scheduled_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', restaurantId)
        .select()
        .single();

      if (error) throw error;

      // Log GDPR audit
      await this.logGdprAudit(restaurantId, 'customer_reactivated',
        'Kunde genaktiveret', reactivatedBy);

      console.log('✅ Customer reactivated:', restaurantId);
      return this._transformRestaurant(data);
    } catch (err) {
      console.error('❌ Error reactivating customer:', err);
      throw err;
    }
  },

  /**
   * Anonymize customer data (before final GDPR deletion)
   * @param {string} restaurantId - Restaurant ID
   * @param {string} performedBy - Admin email
   * @returns {Object} Updated restaurant
   */
  async anonymizeCustomerData(restaurantId, performedBy) {
    try {
      // Get current data for archiving
      const { data: current, error: fetchError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();

      if (fetchError) throw fetchError;
      if (!current) throw new Error('Restaurant not found');

      // Create archived data structure (only financial data for accounting)
      const archivedData = {
        original_id: restaurantId,
        archived_at: new Date().toISOString(),
        financial_summary: {
          total_revenue: current.revenue_total,
          total_orders: current.orders_total,
          created_at: current.created_at,
          terminated_at: current.terminated_at
        },
        cvr_hash: current.cvr ? this._hashValue(current.cvr) : null
      };

      // Anonymize PII fields
      const { data, error } = await supabase
        .from('restaurants')
        .update({
          name: '[GDPR ANONYMISERET]',
          contact_name: null,
          contact_email: null,
          contact_phone: null,
          address: null,
          city: null,
          postal_code: null,
          cvr: null,
          metadata: { gdpr_anonymized: true, anonymized_at: new Date().toISOString() },
          settings: {},
          archived_data: archivedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', restaurantId)
        .select()
        .single();

      if (error) throw error;

      // Log audit
      await this.logGdprAudit(restaurantId, 'data_anonymized',
        'Kundedata anonymiseret iht. GDPR', performedBy);

      console.log('✅ Customer data anonymized:', restaurantId);
      return data;
    } catch (err) {
      console.error('❌ Error anonymizing customer:', err);
      throw err;
    }
  },

  /**
   * Execute GDPR deletion (final step - anonymize + update status)
   * @param {string} restaurantId - Restaurant ID
   * @param {string} performedBy - Admin email or 'SYSTEM_SCHEDULED'
   * @returns {Object} Updated restaurant
   */
  async executeGdprDeletion(restaurantId, performedBy) {
    try {
      // First anonymize if not already done
      await this.anonymizeCustomerData(restaurantId, performedBy);

      // Update status to gdpr_deleted
      const { data, error } = await supabase
        .from('restaurants')
        .update({
          status: 'gdpr_deleted',
          gdpr_deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', restaurantId)
        .select()
        .single();

      if (error) throw error;

      // Delete related data (CASCADE handles most, but explicit for audit)
      await supabase.from('orders').delete().eq('restaurant_id', restaurantId);
      await supabase.from('products').delete().eq('restaurant_id', restaurantId);

      // Log audit
      await this.logGdprAudit(restaurantId, 'gdpr_deletion_executed',
        'GDPR sletning gennemført', performedBy);

      console.log('✅ GDPR deletion executed:', restaurantId);
      return data;
    } catch (err) {
      console.error('❌ Error executing GDPR deletion:', err);
      throw err;
    }
  },

  /**
   * Get customers scheduled for GDPR deletion (past their retention date)
   * @returns {Array} List of restaurants ready for deletion
   */
  async getCustomersForGdprDeletion() {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('status', 'terminated')
        .lte('gdpr_deletion_scheduled_at', new Date().toISOString());

      if (error) throw error;
      return (data || []).map(r => this._transformRestaurant(r));
    } catch (err) {
      console.error('❌ Error fetching GDPR deletion candidates:', err);
      return [];
    }
  },

  /**
   * Get all terminated customers for admin view
   * @param {string} userId - User ID
   * @returns {Array} List of terminated restaurants
   */
  async getTerminatedCustomers(userId) {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['terminated', 'gdpr_deleted'])
        .order('terminated_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(r => this._transformRestaurant(r));
    } catch (err) {
      console.error('❌ Error fetching terminated customers:', err);
      return [];
    }
  },

  /**
   * Log GDPR audit event
   * @param {string} restaurantId - Restaurant ID
   * @param {string} action - Audit action type
   * @param {string} description - Description of the action
   * @param {string} performedBy - Email of admin who performed action
   */
  async logGdprAudit(restaurantId, action, description, performedBy) {
    try {
      const userId = typeof currentUser !== 'undefined' && currentUser ? currentUser.id : null;

      const { data, error } = await supabase
        .from('gdpr_audit_log')
        .insert([{
          user_id: userId,
          restaurant_id: restaurantId,
          action: action,
          description: description,
          performed_by: performedBy,
          metadata: { timestamp: new Date().toISOString() }
        }])
        .select()
        .single();

      if (error) {
        console.warn('⚠️ Could not log GDPR audit (table may not exist yet):', error.message);
        return null;
      }

      console.log('📋 GDPR audit logged:', action);
      return data;
    } catch (err) {
      // Don't throw - audit logging should not break main flow
      console.warn('⚠️ Error logging GDPR audit:', err.message);
      return null;
    }
  },

  /**
   * Save menu items for a restaurant
   * @param {string} restaurantId - Restaurant ID
   * @param {Object} menuData - Menu object with items array
   */
  async saveMenu(restaurantId, menuData) {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .update({
          menu_items: menuData.items || [],
          menu_currency: menuData.currency || 'DKK',
          menu_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', restaurantId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Menu saved to Supabase:', menuData.items?.length || 0, 'items');
      return data;
    } catch (err) {
      console.error('❌ Error saving menu to Supabase:', err);
      throw err;
    }
  },

  /**
   * Load menu for a restaurant
   * @param {string} restaurantId - Restaurant ID
   */
  async getMenu(restaurantId) {
    try {
      // Wait for Supabase to be initialized
      if (!supabase) {
        await window.waitForSupabase();
      }
      if (!supabase) {
        console.error('❌ Supabase not initialized in getMenu');
        return null;
      }

      const { data, error } = await supabase
        .from('restaurants')
        .select('menu_items, menu_currency, menu_updated_at')
        .eq('id', restaurantId)
        .single();

      if (error) throw error;

      if (data && data.menu_items && data.menu_items.length > 0) {
        return {
          restaurantId,
          items: data.menu_items,
          currency: data.menu_currency || 'DKK',
          updatedAt: data.menu_updated_at
        };
      }
      return null;
    } catch (err) {
      console.error('❌ Error loading menu from Supabase:', err);
      return null;
    }
  },

  /**
   * Hash sensitive values for audit trail (not for security)
   * @param {string} value - Value to hash
   * @returns {string} Hashed value
   */
  _hashValue(value) {
    if (!value) return null;
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'HASH_' + Math.abs(hash).toString(16);
  },

  // ============================================================================
  // STORAGE FUNCTIONS - PDF Receipts
  // ============================================================================

  /**
   * Upload a receipt PDF to Supabase Storage
   * @param {Blob} pdfBlob - PDF blob from jsPDF
   * @param {string} orderId - Order ID for filename
   * @param {string} restaurantId - Restaurant ID for folder structure
   * @returns {Object} {url, filename, error}
   */
  async uploadReceipt(pdfBlob, orderId, restaurantId) {
    try {
      if (!supabase) {
        console.error('Supabase not initialized');
        return { error: 'Supabase not initialized' };
      }

      const timestamp = Date.now();
      const filename = `${restaurantId}/kvittering-${orderId}-${timestamp}.pdf`;

      // Upload to 'receipts' bucket
      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(filename, pdfBlob, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return { error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(filename);

      console.log('✅ Receipt uploaded:', urlData.publicUrl);
      return {
        url: urlData.publicUrl,
        filename: filename,
        error: null
      };
    } catch (err) {
      console.error('❌ Error uploading receipt:', err);
      return { error: err.message };
    }
  },

  /**
   * Delete old receipts (cleanup - older than 90 days)
   * @param {string} restaurantId - Restaurant ID
   */
  async cleanupOldReceipts(restaurantId) {
    try {
      if (!supabase) return;

      const { data: files, error } = await supabase.storage
        .from('receipts')
        .list(restaurantId, { limit: 1000 });

      if (error || !files) return;

      const now = Date.now();
      const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

      const oldFiles = files.filter(f => {
        const fileTimestamp = parseInt(f.name.split('-').pop()?.replace('.pdf', '') || '0');
        return (now - fileTimestamp) > ninetyDaysMs;
      });

      if (oldFiles.length > 0) {
        const paths = oldFiles.map(f => `${restaurantId}/${f.name}`);
        await supabase.storage.from('receipts').remove(paths);
        console.log(`🗑️ Cleaned up ${oldFiles.length} old receipts`);
      }
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  },

  // ============================================================================
  // 2FA / OTP AUTHENTICATION
  // ============================================================================

  /**
   * Get user's 2FA settings
   * @param {string} userId - User ID
   * @returns {Object|null} 2FA settings
   */
  async get2FASettings(userId) {
    try {
      if (!supabase) {
        console.warn('Supabase not initialized');
        return null;
      }

      const { data, error } = await supabase
        .from('user_2fa_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {  // Not "no rows" error
        console.error('Error fetching 2FA settings:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('get2FASettings error:', err);
      return null;
    }
  },

  /**
   * Create or update user's 2FA settings
   * @param {string} userId - User ID
   * @param {Object} settings - 2FA settings to update
   */
  async update2FASettings(userId, settings) {
    try {
      if (!supabase) {
        console.warn('Supabase not initialized');
        return { success: false, error: 'Database ikke tilgængelig' };
      }

      // Check if settings exist
      const existing = await this.get2FASettings(userId);

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('user_2fa_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        return { success: true, data };
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('user_2fa_settings')
          .insert([{
            user_id: userId,
            ...settings
          }])
          .select()
          .single();

        if (error) throw error;
        return { success: true, data };
      }
    } catch (err) {
      console.error('update2FASettings error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Enable TOTP for user
   * @param {string} userId - User ID
   * @param {string} secret - TOTP secret (encrypted)
   * @param {string[]} backupCodes - Hashed backup codes
   */
  async enableTOTP(userId, secret, backupCodes) {
    return this.update2FASettings(userId, {
      totp_enabled: true,
      totp_secret: secret,
      totp_confirmed: false,
      backup_codes: backupCodes,
      backup_codes_remaining: backupCodes.length
    });
  },

  /**
   * Confirm TOTP setup after first successful verification
   * @param {string} userId - User ID
   */
  async confirmTOTP(userId) {
    return this.update2FASettings(userId, {
      totp_confirmed: true,
      last_used_at: new Date().toISOString()
    });
  },

  /**
   * Enable Email OTP for user
   * @param {string} userId - User ID
   */
  async enableEmailOTP(userId) {
    return this.update2FASettings(userId, {
      email_otp_enabled: true
    });
  },

  /**
   * Disable all 2FA for user (admin only)
   * @param {string} userId - User ID
   */
  async disable2FA(userId) {
    return this.update2FASettings(userId, {
      totp_enabled: false,
      totp_secret: null,
      totp_confirmed: false,
      email_otp_enabled: false,
      backup_codes: [],
      backup_codes_remaining: 0
    });
  },

  /**
   * Update backup codes remaining count
   * @param {string} userId - User ID
   * @param {string[]} remainingCodes - Remaining hashed backup codes
   */
  async updateBackupCodes(userId, remainingCodes) {
    return this.update2FASettings(userId, {
      backup_codes: remainingCodes,
      backup_codes_remaining: remainingCodes.length
    });
  },

  /**
   * Get user role
   * @param {string} userId - User ID
   * @returns {Object|null} User role data
   */
  async getUserRole(userId) {
    try {
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user role:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('getUserRole error:', err);
      return null;
    }
  },

  /**
   * Set user role
   * @param {string} userId - User ID
   * @param {string} role - Role (admin, employee, customer, demo)
   * @param {boolean} requires2FA - Whether 2FA is required
   */
  async setUserRole(userId, role, requires2FA = true) {
    try {
      if (!supabase) {
        return { success: false, error: 'Database ikke tilgængelig' };
      }

      const existing = await this.getUserRole(userId);

      if (existing) {
        const { data, error } = await supabase
          .from('user_roles')
          .update({ role, requires_2fa: requires2FA, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        return { success: true, data };
      } else {
        const { data, error } = await supabase
          .from('user_roles')
          .insert([{ user_id: userId, role, requires_2fa: requires2FA }])
          .select()
          .single();

        if (error) throw error;
        return { success: true, data };
      }
    } catch (err) {
      console.error('setUserRole error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Log OTP attempt for rate limiting
   * @param {Object} attemptData - Attempt details
   */
  async logOTPAttempt(attemptData) {
    try {
      if (!supabase) return { success: false };

      const { data, error } = await supabase
        .from('otp_attempts')
        .insert([{
          user_id: attemptData.userId,
          email: attemptData.email,
          otp_type: attemptData.type,
          otp_hash: attemptData.hash,
          ip_address: attemptData.ip,
          user_agent: attemptData.userAgent,
          expires_at: attemptData.expiresAt
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('logOTPAttempt error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Check OTP rate limiting for user
   * @param {string} email - User email
   * @param {string} type - OTP type (totp, email)
   * @returns {Object} Rate limit status
   */
  async checkOTPRateLimit(email, type) {
    try {
      if (!supabase) {
        return { allowed: true, reason: 'Database unavailable' };
      }

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Count hourly attempts
      const { count: hourlyCount, error: hourlyError } = await supabase
        .from('otp_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('email', email)
        .eq('otp_type', type)
        .gte('created_at', oneHourAgo);

      if (hourlyError) throw hourlyError;

      // Count daily attempts
      const { count: dailyCount, error: dailyError } = await supabase
        .from('otp_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('email', email)
        .eq('otp_type', type)
        .gte('created_at', oneDayAgo);

      if (dailyError) throw dailyError;

      const maxHourly = type === 'email' ? 5 : 10;
      const maxDaily = type === 'email' ? 15 : 50;

      if (hourlyCount >= maxHourly) {
        return {
          allowed: false,
          reason: 'For mange forsøg denne time. Prøv igen senere.',
          hourlyCount,
          dailyCount
        };
      }

      if (dailyCount >= maxDaily) {
        return {
          allowed: false,
          reason: 'Daglig grænse nået. Prøv igen i morgen.',
          hourlyCount,
          dailyCount
        };
      }

      return {
        allowed: true,
        hourlyCount,
        dailyCount,
        hourlyRemaining: maxHourly - hourlyCount,
        dailyRemaining: maxDaily - dailyCount
      };
    } catch (err) {
      console.error('checkOTPRateLimit error:', err);
      return { allowed: true, error: err.message };  // Allow on error
    }
  },

  /**
   * Mark OTP as verified
   * @param {string} attemptId - OTP attempt ID
   */
  async markOTPVerified(attemptId) {
    try {
      if (!supabase) return { success: false };

      const { data, error } = await supabase
        .from('otp_attempts')
        .update({ verified_at: new Date().toISOString() })
        .eq('id', attemptId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('markOTPVerified error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Increment failed OTP attempts
   * @param {string} attemptId - OTP attempt ID
   */
  async incrementOTPAttempts(attemptId) {
    try {
      if (!supabase) return { success: false };

      // Get current attempts
      const { data: current, error: fetchError } = await supabase
        .from('otp_attempts')
        .select('attempts, max_attempts')
        .eq('id', attemptId)
        .single();

      if (fetchError) throw fetchError;

      const newAttempts = (current.attempts || 0) + 1;
      const isLocked = newAttempts >= (current.max_attempts || 5);

      const updateData = {
        attempts: newAttempts
      };

      if (isLocked) {
        updateData.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      }

      const { data, error } = await supabase
        .from('otp_attempts')
        .update(updateData)
        .eq('id', attemptId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data, isLocked };
    } catch (err) {
      console.error('incrementOTPAttempts error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Cleanup expired OTP attempts
   */
  async cleanupExpiredOTPs() {
    try {
      if (!supabase) return;

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('otp_attempts')
        .delete()
        .lt('created_at', sevenDaysAgo);

      if (error) throw error;
      console.log('🗑️ Cleaned up old OTP attempts');
    } catch (err) {
      console.error('cleanupExpiredOTPs error:', err);
    }
  }
};

// Export SupabaseDB helper immediately
// Note: supabaseClient will be exported by initializeSupabase() when ready
window.SupabaseDB = SupabaseDB;

console.log('✅ SupabaseDB helper initialized (waiting for Supabase client...)');
console.log('✅ window.SupabaseDB is now:', typeof window.SupabaseDB, window.SupabaseDB ? 'defined' : 'undefined');
