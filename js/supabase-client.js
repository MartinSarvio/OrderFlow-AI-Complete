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
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5bXRqaHpndGNpdHRvaHV0bWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MjMzNjYsImV4cCI6MjA2NzI5OTM2Nn0.n6FYURqirRHO0pLPVDflAjH34aiiSxx7a_ZckDPW4DE'
};

// Export config to window for use in other modules
window.SUPABASE_CONFIG = SUPABASE_CONFIG;

// Initialize Supabase Client with retry mechanism
let supabase = null;
let initializationPromise = null;
const MAX_INIT_RETRIES = 50; // 5 seconds max (50 * 100ms)

function hasSupabaseLibrary() {
  return !!(window.supabase && typeof window.supabase.createClient === 'function');
}

function initializeSupabase() {
  if (supabase) {
    return Promise.resolve(supabase);
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = new Promise((resolve, reject) => {
    let retryCount = 0;

    function attemptInit() {
      retryCount++;

      if (!hasSupabaseLibrary()) {
        if (retryCount >= MAX_INIT_RETRIES) {
          console.error('❌ Supabase library failed to load after 5 seconds');
          // Create a mock client that will show proper errors
          window.supabaseClient = null;
          initializationPromise = null;
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
        if (retryCount >= MAX_INIT_RETRIES) {
          console.error('❌ Failed to initialize Supabase client:', err);
          window.supabaseClient = null;
          initializationPromise = null;
          reject(err);
          return;
        }
        console.warn(`⚠️ Supabase init failed, retrying... (${retryCount}/${MAX_INIT_RETRIES})`);
        setTimeout(attemptInit, 100);
      }
    }

    attemptInit();
  });

  return initializationPromise;
}

async function ensureSupabaseClient() {
  if (supabase) return supabase;

  if (window.supabaseClient) {
    supabase = window.supabaseClient;
    return supabase;
  }

  try {
    await initializeSupabase();
  } catch (err) {
    // If init failed once due race/network hiccup, attempt one hard retry.
    initializationPromise = null;
    await initializeSupabase();
  }

  if (!supabase && window.supabaseClient) {
    supabase = window.supabaseClient;
  }

  return supabase;
}

// Start initialization immediately
initializeSupabase();

// Export promise for other modules to await
window.waitForSupabase = () => ensureSupabaseClient();

/**
 * SUPABASE DATABASE HELPER
 *
 * Provides convenient methods for all database operations.
 * Handles error logging and data transformation.
 */
const SupabaseDB = {
  // UUID validation helper
  _isUuid(value) {
    const normalized = String(value || '').trim();
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized);
  },

  // Try to resolve a valid UUID for auth.users.id
  async _resolveAuthUserId(preferredUserId) {
    const preferred = String(preferredUserId || '').trim();

    if (!supabase) await ensureSupabaseClient();

    // ALWAYS try Supabase auth first — RLS requires user_id = auth.uid()
    if (supabase?.auth?.getUser) {
      try {
        const { data, error } = await supabase.auth.getUser();
        const authUserId = data?.user?.id;
        if (!error && this._isUuid(authUserId)) {
          if (preferred && preferred !== authUserId) {
            console.warn('⚠️ Overriding preferred userId with auth.uid() for RLS compatibility:', preferred, '→', authUserId);
          }
          return authUserId;
        }
      } catch (err) {
        console.warn('⚠️ Could not resolve auth user from Supabase session:', err?.message || err);
      }
    }

    // Fallback: use preferred UUID if Supabase auth unavailable
    if (this._isUuid(preferred)) {
      return preferred;
    }

    // Secondary source: local user id key (if set)
    const storedUserId = localStorage.getItem('orderflow_user_id');
    if (this._isUuid(storedUserId)) {
      return storedUserId;
    }

    // Last fallback: Supabase auth storage blob
    try {
      const raw = localStorage.getItem('orderflow-auth-token');
      if (raw) {
        const parsed = JSON.parse(raw);
        const sessionUserId =
          parsed?.currentSession?.user?.id ||
          parsed?.user?.id ||
          parsed?.session?.user?.id ||
          parsed?.[0]?.user?.id;
        if (this._isUuid(sessionUserId)) {
          return sessionUserId;
        }
      }
    } catch (err) {
      console.warn('⚠️ Could not parse orderflow-auth-token for user id:', err?.message || err);
    }

    return null;
  },

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
      if (!supabase) await ensureSupabaseClient();

      const resolvedUserId = await this._resolveAuthUserId(userId);
      if (!resolvedUserId) {
        console.warn('⚠️ getRestaurants skipped: no valid UUID user_id', { providedUserId: userId });
        return [];
      }

      // Strategy: Try server-side API first (bypasses RLS), fall back to direct Supabase
      // 1. Server-side API (service role key, no RLS)
      try {
        const apiBase = window.location.origin;
        const resp = await fetch(`${apiBase}/api/restaurants/list?userId=${encodeURIComponent(resolvedUserId)}`);
        if (resp.ok) {
          const result = await resp.json();
          if (result.restaurants) {
            console.log('✅ Restaurants loaded via API:', result.restaurants.length);
            return result.restaurants.map(r => this._transformRestaurant(r));
          }
        }
      } catch (apiErr) {
        console.warn('⚠️ API list not available:', apiErr.message);
      }

      // 2. Fallback: direct Supabase (requires valid JWT)
      if (supabase) {
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('user_id', resolvedUserId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(r => this._transformRestaurant(r));
      }

      return [];
    } catch (err) {
      console.error('❌ Error fetching restaurants:', err);
      throw err;
    }
  },

  /**
   * Get single restaurant by ID (scoped to current user)
   */
  async getRestaurant(restaurantId, userId) {
    try {
      // Wait for Supabase to be initialized
      if (!supabase) await ensureSupabaseClient();
      if (!supabase) {
        console.error('❌ Supabase not initialized in getRestaurant');
        return null;
      }

      let query = supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId);

      // Scope to user if userId provided (ownership check)
      if (userId) {
        const resolvedUserId = await this._resolveAuthUserId(userId);
        if (resolvedUserId) {
          query = query.eq('user_id', resolvedUserId);
        }
      }

      const { data, error } = await query.single();

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
      if (!supabase) await ensureSupabaseClient();
      if (!supabase) throw new Error('Supabase not initialized in createRestaurant');

      // Transform revenue fields to bigint (øre/cents)
      const dbData = this._prepareRestaurantForDB(restaurantData);
      delete dbData.id; // Let database default uuid_generate_v4() handle id

      const normalizedName = String(dbData.name || '').trim();
      if (!normalizedName) {
        throw new Error('Restaurant name is required (name må ikke være NULL)');
      }
      dbData.name = normalizedName;

      const resolvedUserId = await this._resolveAuthUserId(userId);
      if (!resolvedUserId) {
        throw new Error('Missing valid auth user UUID (user_id må ikke være NULL)');
      }
      dbData.user_id = resolvedUserId;

      // Strategy: Try server-side API first (bypasses RLS), fall back to direct Supabase
      let created = null;

      // 1. Try server-side API endpoint (uses service role key, no RLS issues)
      try {
        const apiBase = window.location.origin;
        const token = (await supabase.auth.getSession())?.data?.session?.access_token || '';
        const resp = await fetch(`${apiBase}/api/restaurants/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ restaurantData: dbData, userId: resolvedUserId })
        });
        const result = await resp.json();
        if (resp.ok && result.restaurant) {
          created = result.restaurant;
          console.log('✅ Restaurant created via API:', created.id);
        } else {
          console.warn('⚠️ API create failed:', result.error, '— trying direct Supabase...');
        }
      } catch (apiErr) {
        console.warn('⚠️ API endpoint not available:', apiErr.message, '— trying direct Supabase...');
      }

      // 2. Fallback: direct Supabase insert (requires valid JWT for RLS)
      if (!created) {
        const { data, error } = await supabase
          .from('restaurants')
          .insert([dbData])
          .select()
          .single();

        if (error) {
          if (error.message?.includes('row-level security')) {
            throw new Error('Kunne ikke oprette restaurant. Prøv at logge helt ud og ind igen.');
          }
          throw error;
        }
        created = data;
        console.log('✅ Restaurant created via direct Supabase:', created.id);
      }

      return this._transformRestaurant(created);
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
      if (!supabase) await ensureSupabaseClient();
      if (!supabase) throw new Error('Supabase not initialized in updateRestaurant');

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
      if (!supabase) await ensureSupabaseClient();
      if (!supabase) throw new Error('Supabase not initialized in deleteRestaurant');

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
  // SUBSCRIPTION PLANS
  // ============================================================================

  /**
   * Get all subscription plans
   */
  async getSubscriptionPlans(activeOnly = true) {
    try {
      if (!supabase) await window.waitForSupabase();
      if (!supabase) return [];

      let query = supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;

      console.log('✅ Subscription plans fetched:', (data || []).length);
      return data || [];
    } catch (err) {
      console.error('❌ Error fetching subscription plans:', err);
      return [];
    }
  },

  /**
   * Create new subscription plan
   */
  async createSubscriptionPlan(planData) {
    try {
      if (!supabase) await window.waitForSupabase();

      const { data, error } = await supabase
        .from('subscription_plans')
        .insert([planData])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Subscription plan created:', data.id);
      return data;
    } catch (err) {
      console.error('❌ Error creating subscription plan:', err);
      throw err;
    }
  },

  /**
   * Update subscription plan
   */
  async updateSubscriptionPlan(planId, updates) {
    try {
      if (!supabase) await window.waitForSupabase();

      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('subscription_plans')
        .update(updates)
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Subscription plan updated:', planId);
      return data;
    } catch (err) {
      console.error('❌ Error updating subscription plan:', err);
      throw err;
    }
  },

  /**
   * Delete subscription plan
   */
  async deleteSubscriptionPlan(planId) {
    try {
      if (!supabase) await window.waitForSupabase();

      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      console.log('✅ Subscription plan deleted:', planId);
      return true;
    } catch (err) {
      console.error('❌ Error deleting subscription plan:', err);
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
          if (payload.new && payload.new.direction === 'inbound') {
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
   * Subscribe to product changes for a restaurant
   */
  subscribeToProducts(restaurantId, callback) {
    return supabase
      .channel(`products-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          console.log('🔄 Product change detected:', payload);
          callback(payload);
        }
      )
      .subscribe();
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
      console.log('Cleaned up old OTP attempts');
    } catch (err) {
      console.error('cleanupExpiredOTPs error:', err);
    }
  },

  // =====================================================
  // MEDIA LIBRARY FUNCTIONS
  // =====================================================

  /**
   * Upload a media file to Supabase Storage
   * @param {File} file - File object to upload
   * @param {string} folder - Folder name (default: 'images')
   * @returns {Object} {url, path, name, type, error}
   */
  async uploadMedia(file, folder = 'images') {
    try {
      if (!supabase) {
        console.error('Supabase not initialized');
        return { error: 'Supabase not initialized' };
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
      if (!allowedTypes.includes(file.type)) {
        return { error: 'Filtype ikke understøttet. Brug JPEG, PNG, GIF, WebP, MP4 eller WebM.' };
      }

      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        return { error: 'Filen er for stor. Maksimum 50MB.' };
      }

      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `${folder}/${timestamp}-${safeName}`;

      // Upload to 'media' bucket
      const { data, error } = await supabase.storage
        .from('media')
        .upload(path, file, {
          contentType: file.type,
          cacheControl: '31536000', // 1 year cache
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return { error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(path);

      console.log('Media uploaded:', urlData.publicUrl);
      return {
        url: urlData.publicUrl,
        path: path,
        name: file.name,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        size: file.size,
        error: null
      };
    } catch (err) {
      console.error('Error uploading media:', err);
      return { error: err.message };
    }
  },

  /**
   * List all media files in a folder
   * @param {string} folder - Folder name (default: 'images')
   * @returns {Array} List of files with URLs
   */
  async listMedia(folder = 'images') {
    try {
      if (!supabase) {
        console.error('Supabase not initialized');
        return [];
      }

      const { data: files, error } = await supabase.storage
        .from('media')
        .list(folder, {
          limit: 500,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('List error:', error);
        return [];
      }

      // Get public URLs for each file
      return files.map(file => {
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(`${folder}/${file.name}`);

        return {
          id: file.id,
          name: file.name,
          path: `${folder}/${file.name}`,
          url: urlData.publicUrl,
          type: file.metadata?.mimetype?.startsWith('video/') ? 'video' : 'image',
          size: file.metadata?.size || 0,
          createdAt: file.created_at
        };
      });
    } catch (err) {
      console.error('Error listing media:', err);
      return [];
    }
  },

  /**
   * Delete a media file
   * @param {string} path - Full path to the file
   * @returns {Object} {success, error}
   */
  async deleteMedia(path) {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase not initialized' };
      }

      const { error } = await supabase.storage
        .from('media')
        .remove([path]);

      if (error) {
        console.error('Delete error:', error);
        return { success: false, error: error.message };
      }

      console.log('Media deleted:', path);
      return { success: true, error: null };
    } catch (err) {
      console.error('Error deleting media:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Get public URL for a media file
   * @param {string} path - Full path to the file
   * @returns {string} Public URL
   */
  getMediaUrl(path) {
    if (!supabase) return '';

    const { data } = supabase.storage
      .from('media')
      .getPublicUrl(path);

    return data?.publicUrl || '';
  },

  // ============================================================================
  // BUILDER CONFIGURATIONS (App Builder, Web Builder, CMS)
  // ============================================================================

  /**
   * Save builder configuration to Supabase
   * @param {string} configType - 'app_builder', 'web_builder', or 'cms'
   * @param {object} configData - The configuration object
   * @param {string} restaurantId - Optional restaurant ID
   */
  async saveBuilderConfig(configType, configData, restaurantId = null) {
    try {
      if (!supabase) await window.waitForSupabase();
      if (!supabase) {
        console.warn('⚠️ Supabase not available, saving to localStorage only');
        return { success: false, error: 'Supabase not initialized' };
      }

      const userId = this.getCurrentUserId();
      if (!userId) {
        console.warn('⚠️ No user logged in, saving to localStorage only');
        return { success: false, error: 'No user logged in' };
      }

      const record = {
        user_id: userId,
        restaurant_id: restaurantId,
        config_type: configType,
        config_data: configData,
        updated_at: new Date().toISOString()
      };

      // Upsert based on user_id and config_type
      const { data, error } = await supabase
        .from('builder_configs')
        .upsert(record, { onConflict: 'user_id,config_type,restaurant_id' })
        .select()
        .single();

      if (error) {
        // Table might not exist yet - fallback to localStorage
        if (error.code === '42P01') {
          console.warn('⚠️ builder_configs table does not exist, saving to localStorage only');
          return { success: false, error: 'Table not found' };
        }
        throw error;
      }

      console.log(`✅ ${configType} config saved to Supabase`);
      return { success: true, data };
    } catch (err) {
      console.error(`❌ Error saving ${configType} config:`, err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Save user setting to Supabase (user_settings table)
   * @param {string} settingsType - Setting category (e.g. 'user_profile', 'notification_settings')
   * @param {object} settingsData - The settings data object
   */
  async saveUserSetting(settingsType, settingsData) {
    try {
      if (!supabase) await window.waitForSupabase();
      if (!supabase) {
        console.warn('⚠️ Supabase not available for user setting sync');
        return { success: false, error: 'Supabase not initialized' };
      }

      const userId = this.getCurrentUserId();
      if (!userId) {
        console.warn('⚠️ No user logged in for user setting sync');
        return { success: false, error: 'No user logged in' };
      }

      const record = {
        user_id: userId,
        settings_type: settingsType,
        settings_data: settingsData,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_settings')
        .upsert(record, { onConflict: 'user_id,settings_type' })
        .select()
        .single();

      if (error) {
        if (error.code === '42P01') {
          console.warn('⚠️ user_settings table does not exist');
          return { success: false, error: 'Table not found' };
        }
        throw error;
      }

      console.log(`✅ ${settingsType} saved to Supabase`);
      return { success: true, data };
    } catch (err) {
      console.error(`❌ Error saving ${settingsType}:`, err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Load builder configuration from Supabase
   * @param {string} configType - 'app_builder', 'web_builder', or 'cms'
   * @param {string} restaurantId - Optional restaurant ID
   */
  async loadBuilderConfig(configType, restaurantId = null) {
    try {
      if (!supabase) await window.waitForSupabase();
      if (!supabase) {
        return { success: false, data: null, error: 'Supabase not initialized' };
      }

      const userId = this.getCurrentUserId();
      if (!userId) {
        return { success: false, data: null, error: 'No user logged in' };
      }

      let query = supabase
        .from('builder_configs')
        .select('*')
        .eq('user_id', userId)
        .eq('config_type', configType);

      if (restaurantId) {
        query = query.eq('restaurant_id', restaurantId);
      } else {
        query = query.is('restaurant_id', null);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        // Table might not exist
        if (error.code === '42P01') {
          return { success: false, data: null, error: 'Table not found' };
        }
        throw error;
      }

      if (data) {
        console.log(`✅ ${configType} config loaded from Supabase`);
        return { success: true, data: data.config_data };
      }

      return { success: true, data: null }; // No config found
    } catch (err) {
      console.error(`❌ Error loading ${configType} config:`, err);
      return { success: false, data: null, error: err.message };
    }
  },

  /**
   * Get current user ID from session
   */
  getCurrentUserId() {
    // Check localStorage for demo mode user
    const demoMode = localStorage.getItem('orderflow_demo_mode') === 'true';
    if (demoMode) {
      return 'demo-user';
    }

    // Fallback to localStorage user ID
    const storedUserId = localStorage.getItem('orderflow_user_id');
    if (this._isUuid(storedUserId)) {
      return storedUserId;
    }

    // Supabase auth session blob (persisted with storageKey: orderflow-auth-token)
    try {
      const raw = localStorage.getItem('orderflow-auth-token');
      if (raw) {
        const parsed = JSON.parse(raw);
        const sessionUserId =
          parsed?.currentSession?.user?.id ||
          parsed?.user?.id ||
          parsed?.session?.user?.id ||
          parsed?.[0]?.user?.id;
        if (this._isUuid(sessionUserId)) {
          return sessionUserId;
        }
      }
    } catch (err) {
      console.warn('⚠️ Could not parse auth token storage for user id:', err?.message || err);
    }

    return null;
  },

  /**
   * Save template to Supabase storage
   * @param {File} file - ZIP file
   * @param {object} metadata - Template metadata
   */
  async saveTemplate(file, metadata) {
    try {
      if (!supabase) await window.waitForSupabase();
      if (!supabase) {
        return { success: false, error: 'Supabase not initialized' };
      }

      const path = `templates/${metadata.id}/${file.name}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('templates')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { data, error } = await supabase
        .from('templates')
        .upsert({
          id: metadata.id,
          name: metadata.name,
          description: metadata.description,
          file_path: path,
          config: metadata,
          created_by: this.getCurrentUserId(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Template saved to Supabase:', metadata.id);
      return { success: true, data };
    } catch (err) {
      console.error('❌ Error saving template:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Get all templates from Supabase
   */
  async getTemplates() {
    try {
      if (!supabase) await window.waitForSupabase();
      if (!supabase) {
        return { success: false, data: [], error: 'Supabase not initialized' };
      }

      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          return { success: false, data: [], error: 'Table not found' };
        }
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (err) {
      console.error('❌ Error loading templates:', err);
      return { success: false, data: [], error: err.message };
    }
  },

  // =====================================================
  // ANALYTICS & METRICS FUNCTIONS
  // =====================================================

  /**
   * Get daily metrics for a restaurant
   * @param {string} restaurantId - Restaurant UUID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   */
  async getDailyMetrics(restaurantId, startDate, endDate) {
    try {
      if (!supabase) await window.waitForSupabase();
      if (!supabase) return { success: false, data: [], error: 'Supabase not initialized' };

      const { data, error } = await supabase
        .from('daily_metrics')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) throw error;

      // Convert øre to DKK
      const formatted = (data || []).map(row => ({
        ...row,
        total_revenue_dkk: row.total_revenue / 100,
        avg_order_value_dkk: row.avg_order_value / 100
      }));

      return { success: true, data: formatted };
    } catch (err) {
      console.error('❌ Error fetching daily metrics:', err);
      return { success: false, data: [], error: err.message };
    }
  },

  /**
   * Get today's metrics for a restaurant
   * @param {string} restaurantId - Restaurant UUID
   */
  async getTodayMetrics(restaurantId) {
    const today = new Date().toISOString().split('T')[0];
    return this.getDailyMetrics(restaurantId, today, today);
  },

  /**
   * Get product analytics for a restaurant
   * @param {string} restaurantId - Restaurant UUID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   */
  async getProductAnalytics(restaurantId, startDate, endDate) {
    try {
      if (!supabase) await window.waitForSupabase();
      if (!supabase) return { success: false, data: [], error: 'Supabase not initialized' };

      const { data, error } = await supabase
        .from('product_analytics')
        .select(`
          *,
          products:product_id (name, category, price)
        `)
        .eq('restaurant_id', restaurantId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('revenue', { ascending: false });

      if (error) throw error;

      // Format data
      const formatted = (data || []).map(row => ({
        ...row,
        revenue_dkk: row.revenue / 100,
        product_name: row.products?.name,
        product_category: row.products?.category
      }));

      return { success: true, data: formatted };
    } catch (err) {
      console.error('❌ Error fetching product analytics:', err);
      return { success: false, data: [], error: err.message };
    }
  },

  // =====================================================
  // AI CONVERSATION FUNCTIONS
  // =====================================================

  /**
   * Create a new AI conversation
   * @param {string} restaurantId - Restaurant UUID
   * @param {object} data - Conversation data
   */
  async createAIConversation(restaurantId, data) {
    try {
      if (!supabase) await window.waitForSupabase();
      if (!supabase) return { success: false, error: 'Supabase not initialized' };

      const conversationId = data.conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const { data: conversation, error } = await supabase
        .from('ai_conversations')
        .insert({
          conversation_id: conversationId,
          restaurant_id: restaurantId,
          channel: data.channel || 'web_chat',
          channel_user_id: data.channelUserId,
          customer_phone: data.customerPhone,
          customer_name: data.customerName,
          language: data.language || 'da',
          current_state: data.currentState || 'GREETING'
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ AI conversation created:', conversationId);
      return { success: true, data: conversation, conversationId };
    } catch (err) {
      console.error('❌ Error creating AI conversation:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Add a message to an AI conversation
   * @param {string} conversationId - Conversation ID
   * @param {object} message - Message data
   */
  async addAIMessage(conversationId, message) {
    try {
      if (!supabase) await window.waitForSupabase();
      if (!supabase) return { success: false, error: 'Supabase not initialized' };

      const { data, error } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: conversationId,
          role: message.role,
          content: message.content,
          detected_intent: message.detectedIntent,
          intent_confidence: message.intentConfidence,
          entities: message.entities,
          response_time_ms: message.responseTimeMs,
          tokens_used: message.tokensUsed,
          conversation_state: message.conversationState
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation message count
      await supabase.rpc('increment_conversation_messages', {
        p_conversation_id: conversationId
      });

      return { success: true, data };
    } catch (err) {
      console.error('❌ Error adding AI message:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Update AI conversation outcome
   * @param {string} conversationId - Conversation ID
   * @param {object} updates - Update data
   */
  async updateAIConversation(conversationId, updates) {
    try {
      if (!supabase) await window.waitForSupabase();
      if (!supabase) return { success: false, error: 'Supabase not initialized' };

      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (updates.outcome) updateData.outcome = updates.outcome;
      if (updates.orderId) updateData.order_id = updates.orderId;
      if (updates.currentState) updateData.current_state = updates.currentState;
      if (updates.endedAt) updateData.ended_at = updates.endedAt;
      if (updates.frustrationScore !== undefined) updateData.frustration_score = updates.frustrationScore;
      if (updates.customerRating) updateData.customer_rating = updates.customerRating;
      if (updates.customerFeedback) updateData.customer_feedback = updates.customerFeedback;

      const { data, error } = await supabase
        .from('ai_conversations')
        .update(updateData)
        .eq('conversation_id', conversationId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (err) {
      console.error('❌ Error updating AI conversation:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Get AI conversations for a restaurant
   * @param {string} restaurantId - Restaurant UUID
   * @param {number} limit - Max results
   */
  async getAIConversations(restaurantId, limit = 50) {
    try {
      if (!supabase) await window.waitForSupabase();
      if (!supabase) return { success: false, data: [], error: 'Supabase not initialized' };

      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (err) {
      console.error('❌ Error fetching AI conversations:', err);
      return { success: false, data: [], error: err.message };
    }
  },

  /**
   * Get AI conversation with messages
   * @param {string} conversationId - Conversation ID
   */
  async getAIConversationWithMessages(conversationId) {
    try {
      if (!supabase) await window.waitForSupabase();
      if (!supabase) return { success: false, error: 'Supabase not initialized' };

      const { data: conversation, error: convError } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('conversation_id', conversationId)
        .single();

      if (convError) throw convError;

      const { data: messages, error: msgError } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (msgError) throw msgError;

      return { success: true, data: { ...conversation, messages: messages || [] } };
    } catch (err) {
      console.error('❌ Error fetching AI conversation with messages:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Get AI performance metrics
   * @param {string} restaurantId - Restaurant UUID
   * @param {number} days - Number of days to look back
   */
  async getAIPerformanceMetrics(restaurantId, days = 7) {
    try {
      if (!supabase) await window.waitForSupabase();
      if (!supabase) return { success: false, error: 'Supabase not initialized' };

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('ai_conversations')
        .select('outcome, message_count, clarification_count, frustration_score, started_at, ended_at')
        .eq('restaurant_id', restaurantId)
        .gte('started_at', startDate.toISOString());

      if (error) throw error;

      // Calculate metrics
      const total = data.length;
      const completed = data.filter(c => c.outcome === 'order_completed').length;
      const escalated = data.filter(c => c.outcome === 'escalated').length;
      const abandoned = data.filter(c => c.outcome === 'abandoned').length;

      const avgMessages = total > 0 ? data.reduce((sum, c) => sum + (c.message_count || 0), 0) / total : 0;
      const avgClarifications = total > 0 ? data.reduce((sum, c) => sum + (c.clarification_count || 0), 0) / total : 0;
      const avgFrustration = total > 0 ? data.reduce((sum, c) => sum + (parseFloat(c.frustration_score) || 0), 0) / total : 0;

      // Calculate average duration
      const durations = data
        .filter(c => c.started_at && c.ended_at)
        .map(c => new Date(c.ended_at) - new Date(c.started_at));
      const avgDurationMs = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

      return {
        success: true,
        data: {
          total_conversations: total,
          orders_created: completed,
          escalations: escalated,
          abandoned: abandoned,
          completion_rate: total > 0 ? (completed / total * 100).toFixed(1) : 0,
          escalation_rate: total > 0 ? (escalated / total * 100).toFixed(1) : 0,
          avg_messages: avgMessages.toFixed(1),
          avg_clarifications: avgClarifications.toFixed(1),
          avg_frustration_score: avgFrustration.toFixed(2),
          avg_duration_sec: Math.round(avgDurationMs / 1000)
        }
      };
    } catch (err) {
      console.error('❌ Error fetching AI performance metrics:', err);
      return { success: false, error: err.message };
    }
  },

  // =====================================================
  // ORDER ITEMS FUNCTIONS
  // =====================================================

  /**
   * Create order items for an order
   * @param {string} orderId - Order UUID
   * @param {array} items - Array of order items
   */
  async createOrderItems(orderId, items) {
    try {
      if (!supabase) await window.waitForSupabase();
      if (!supabase) return { success: false, error: 'Supabase not initialized' };

      const orderItems = items.map(item => ({
        order_id: orderId,
        product_id: item.productId || item.product_id,
        product_name: item.name || item.product_name,
        product_sku: item.sku || item.product_sku,
        product_category: item.category || item.product_category,
        unit_price: Math.round((item.price || item.unit_price) * 100), // Convert to øre
        quantity: item.quantity || 1,
        line_total: Math.round((item.price || item.unit_price) * (item.quantity || 1) * 100),
        discount_amount: item.discount ? Math.round(item.discount * 100) : 0,
        discount_reason: item.discountReason,
        options: item.options || [],
        notes: item.notes
      }));

      const { data, error } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select();

      if (error) throw error;

      console.log('✅ Order items created:', data.length);
      return { success: true, data };
    } catch (err) {
      console.error('❌ Error creating order items:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Get order items for an order
   * @param {string} orderId - Order UUID
   */
  async getOrderItems(orderId) {
    try {
      if (!supabase) await window.waitForSupabase();
      if (!supabase) return { success: false, data: [], error: 'Supabase not initialized' };

      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Convert from øre to DKK
      const formatted = (data || []).map(item => ({
        ...item,
        unit_price_dkk: item.unit_price / 100,
        line_total_dkk: item.line_total / 100,
        discount_amount_dkk: item.discount_amount / 100
      }));

      return { success: true, data: formatted };
    } catch (err) {
      console.error('❌ Error fetching order items:', err);
      return { success: false, data: [], error: err.message };
    }
  },

  // =====================================================
  // PAYMENT FUNCTIONS
  // =====================================================

  /**
   * Create a payment record
   * @param {object} paymentData - Payment data
   */
  async createPayment(paymentData) {
    try {
      if (!supabase) await window.waitForSupabase();
      if (!supabase) return { success: false, error: 'Supabase not initialized' };

      const { data, error } = await supabase
        .from('payments')
        .insert({
          order_id: paymentData.orderId || paymentData.order_id,
          restaurant_id: paymentData.restaurantId || paymentData.restaurant_id,
          amount: Math.round(paymentData.amount * 100), // Convert to øre
          currency: paymentData.currency || 'DKK',
          status: paymentData.status || 'pending',
          provider: paymentData.provider,
          provider_transaction_id: paymentData.transactionId || paymentData.provider_transaction_id,
          provider_response: paymentData.providerResponse,
          card_last_four: paymentData.cardLastFour || paymentData.card_last_four,
          card_brand: paymentData.cardBrand || paymentData.card_brand
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Payment created:', data.id);
      return { success: true, data };
    } catch (err) {
      console.error('❌ Error creating payment:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Update payment status
   * @param {string} paymentId - Payment UUID
   * @param {string} status - New status
   * @param {object} additionalData - Additional update data
   */
  async updatePaymentStatus(paymentId, status, additionalData = {}) {
    try {
      if (!supabase) await window.waitForSupabase();
      if (!supabase) return { success: false, error: 'Supabase not initialized' };

      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (status === 'failed') {
        updateData.failed_at = new Date().toISOString();
      }

      if (additionalData.providerTransactionId) {
        updateData.provider_transaction_id = additionalData.providerTransactionId;
      }
      if (additionalData.providerResponse) {
        updateData.provider_response = additionalData.providerResponse;
      }

      const { data, error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (err) {
      console.error('❌ Error updating payment status:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Get payments for an order
   * @param {string} orderId - Order UUID
   */
  async getOrderPayments(orderId) {
    try {
      if (!supabase) await window.waitForSupabase();
      if (!supabase) return { success: false, data: [], error: 'Supabase not initialized' };

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert from øre to DKK
      const formatted = (data || []).map(payment => ({
        ...payment,
        amount_dkk: payment.amount / 100,
        refunded_amount_dkk: payment.refunded_amount / 100
      }));

      return { success: true, data: formatted };
    } catch (err) {
      console.error('❌ Error fetching order payments:', err);
      return { success: false, data: [], error: err.message };
    }
  },

  // =====================================================
  // CONSENT FUNCTIONS
  // =====================================================

  /**
   * Record user consent
   * @param {string} userId - User UUID
   * @param {string} consentType - Type of consent
   * @param {boolean} granted - Whether consent is granted
   * @param {object} options - Additional options
   */
  async recordConsent(userId, consentType, granted, options = {}) {
    try {
      if (!supabase) await window.waitForSupabase();
      if (!supabase) return { success: false, error: 'Supabase not initialized' };

      // If withdrawing consent, update existing record
      if (!granted) {
        const { data, error } = await supabase
          .from('user_consents')
          .update({
            granted: false,
            withdrawn_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('consent_type', consentType)
          .eq('granted', true)
          .select()
          .single();

        if (data) {
          console.log('✅ Consent withdrawn:', consentType);
          return { success: true, data };
        }
      }

      // Create new consent record
      const { data, error } = await supabase
        .from('user_consents')
        .insert({
          user_id: userId,
          restaurant_id: options.restaurantId,
          consent_type: consentType,
          granted,
          consent_version: options.consentVersion,
          consent_text: options.consentText,
          collection_method: options.collectionMethod || 'settings_page',
          granted_at: granted ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Consent recorded:', consentType, granted);
      return { success: true, data };
    } catch (err) {
      console.error('❌ Error recording consent:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Check if user has given consent
   * @param {string} userId - User UUID
   * @param {string} consentType - Type of consent
   */
  async checkConsent(userId, consentType) {
    try {
      if (!supabase) await window.waitForSupabase();
      if (!supabase) return { success: false, hasConsent: false, error: 'Supabase not initialized' };

      const { data, error } = await supabase
        .from('user_consents')
        .select('granted')
        .eq('user_id', userId)
        .eq('consent_type', consentType)
        .eq('granted', true)
        .is('withdrawn_at', null)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found

      return { success: true, hasConsent: !!data };
    } catch (err) {
      console.error('❌ Error checking consent:', err);
      return { success: false, hasConsent: false, error: err.message };
    }
  },

  /**
   * Get all consents for a user
   * @param {string} userId - User UUID
   */
  async getUserConsents(userId) {
    try {
      if (!supabase) await window.waitForSupabase();
      if (!supabase) return { success: false, data: [], error: 'Supabase not initialized' };

      const { data, error } = await supabase
        .from('user_consents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (err) {
      console.error('❌ Error fetching user consents:', err);
      return { success: false, data: [], error: err.message };
    }
  },

  // =====================================================
  // WEBHOOK LOGGING FUNCTIONS
  // =====================================================

  /**
   * Log a webhook request/response
   * @param {object} webhookData - Webhook data
   */
  async logWebhook(webhookData) {
    try {
      if (!supabase) await window.waitForSupabase();
      if (!supabase) return { success: false, error: 'Supabase not initialized' };

      const { data, error } = await supabase
        .from('webhook_logs')
        .insert({
          restaurant_id: webhookData.restaurantId,
          webhook_type: webhookData.type || 'incoming',
          webhook_name: webhookData.name,
          method: webhookData.method,
          url: webhookData.url,
          headers: webhookData.headers,
          request_body: webhookData.requestBody,
          response_status: webhookData.responseStatus,
          response_body: webhookData.responseBody,
          response_time_ms: webhookData.responseTimeMs,
          status: webhookData.status || 'success',
          error_message: webhookData.errorMessage,
          idempotency_key: webhookData.idempotencyKey
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (err) {
      console.error('❌ Error logging webhook:', err);
      return { success: false, error: err.message };
    }
  },

  // =====================================================
  // INTEGRATION CONFIG FUNCTIONS
  // =====================================================

  /**
   * Get integration config
   * @param {string} restaurantId - Restaurant UUID
   * @param {string} integrationType - Integration type
   * @param {string} integrationName - Integration name
   */
  async getIntegrationConfig(restaurantId, integrationType, integrationName) {
    try {
      if (!supabase) await window.waitForSupabase();
      if (!supabase) return { success: false, error: 'Supabase not initialized' };

      const { data, error } = await supabase
        .from('integration_configs')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('integration_type', integrationType)
        .eq('integration_name', integrationName)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return { success: true, data };
    } catch (err) {
      console.error('❌ Error fetching integration config:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Save integration config
   * @param {string} restaurantId - Restaurant UUID
   * @param {string} integrationType - Integration type
   * @param {string} integrationName - Integration name
   * @param {object} config - Configuration data
   */
  async saveIntegrationConfig(restaurantId, integrationType, integrationName, config) {
    try {
      if (!supabase) await window.waitForSupabase();
      if (!supabase) return { success: false, error: 'Supabase not initialized' };

      const { data, error } = await supabase
        .from('integration_configs')
        .upsert({
          restaurant_id: restaurantId,
          integration_type: integrationType,
          integration_name: integrationName,
          config: config.settings || config,
          credentials_encrypted: config.credentials,
          status: config.status || 'active',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'restaurant_id,integration_type,integration_name'
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Integration config saved:', integrationName);
      return { success: true, data };
    } catch (err) {
      console.error('❌ Error saving integration config:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Get all integrations for a restaurant
   * @param {string} restaurantId - Restaurant UUID
   */
  async getIntegrations(restaurantId) {
    try {
      if (!supabase) await window.waitForSupabase();
      if (!supabase) return { success: false, data: [], error: 'Supabase not initialized' };

      const { data, error } = await supabase
        .from('integration_configs')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('integration_type', { ascending: true });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (err) {
      console.error('❌ Error fetching integrations:', err);
      return { success: false, data: [], error: err.message };
    }
  },

  // =====================================================
  // SYSTEM & ERROR LOGGING
  // =====================================================

  /**
   * Log a system event
   * @param {string} level - Log level (debug, info, warn, error, critical)
   * @param {string} category - Log category
   * @param {string} message - Log message
   * @param {object} options - Additional options
   */
  async logSystemEvent(level, category, message, options = {}) {
    try {
      if (!supabase) await window.waitForSupabase();
      if (!supabase) return { success: false, error: 'Supabase not initialized' };

      const { data, error } = await supabase
        .from('system_logs')
        .insert({
          log_level: level,
          log_category: category,
          message,
          details: options.details,
          service: options.service,
          function_name: options.functionName,
          restaurant_id: options.restaurantId,
          user_id: options.userId,
          stack_trace: options.stackTrace,
          request_id: options.requestId,
          duration_ms: options.durationMs
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (err) {
      console.error('❌ Error logging system event:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Log an error
   * @param {Error|object} error - Error to log
   * @param {object} context - Error context
   */
  async logError(error, context = {}) {
    try {
      if (!supabase) await window.waitForSupabase();
      if (!supabase) return { success: false, error: 'Supabase not initialized' };

      const errorMessage = error.message || String(error);
      const errorHash = this.hashString(errorMessage + (error.stack || ''));

      // Check for existing error with same hash
      const { data: existing } = await supabase
        .from('error_logs')
        .select('id, occurrence_count')
        .eq('error_hash', errorHash)
        .eq('status', 'new')
        .single();

      if (existing) {
        // Update occurrence count
        await supabase
          .from('error_logs')
          .update({
            occurrence_count: existing.occurrence_count + 1,
            last_seen_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        return { success: true, data: { id: existing.id, isExisting: true } };
      }

      // Create new error log
      const { data, error: insertError } = await supabase
        .from('error_logs')
        .insert({
          error_type: context.errorType || 'other',
          error_code: error.code,
          error_message: errorMessage,
          error_hash: errorHash,
          stack_trace: error.stack,
          service: context.service,
          restaurant_id: context.restaurantId,
          user_id: context.userId,
          request_url: context.requestUrl,
          request_method: context.requestMethod,
          browser: context.browser,
          os: context.os
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return { success: true, data };
    } catch (err) {
      console.error('❌ Error logging error:', err);
      return { success: false, error: err.message };
    }
  },

  // Simple hash function for error deduplication
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'e_' + Math.abs(hash).toString(16);
  }
};

// Export SupabaseDB helper immediately
// Note: supabaseClient will be exported by initializeSupabase() when ready
window.SupabaseDB = SupabaseDB;

console.log('✅ SupabaseDB helper initialized (waiting for Supabase client...)');
console.log('✅ window.SupabaseDB is now:', typeof window.SupabaseDB, window.SupabaseDB ? 'defined' : 'undefined');
