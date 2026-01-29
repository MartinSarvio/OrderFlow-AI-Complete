/**
 * REAL-TIME SYNC MODULE
 *
 * Håndterer real-time opdateringer fra Supabase via WebSocket subscriptions.
 * Opdaterer automatisk UI når data ændres i databasen.
 */

const RealtimeSync = {
  subscriptions: [],
  initialized: false,

  /**
   * Initialize real-time synchronization
   */
  async init(userId) {
    if (this.initialized) {
      console.warn('⚠️ RealtimeSync already initialized');
      return;
    }

    if (!SupabaseDB || !userId) {
      console.warn('⚠️ Cannot initialize RealtimeSync - missing SupabaseDB or userId');
      return;
    }

    // Wait for Supabase to be initialized
    if (typeof window.waitForSupabase === 'function') {
      try {
        await window.waitForSupabase();
        console.log('✅ Supabase ready for RealtimeSync');
      } catch (err) {
        console.error('❌ Supabase failed to initialize:', err);
        return;
      }
    }

    console.log('🔄 Initializing real-time sync for user:', userId);

    try {
      // Subscribe to restaurant changes
      const restaurantSub = SupabaseDB.subscribeToRestaurants(userId, (payload) => {
        this.handleRestaurantChange(payload);
      });
      this.subscriptions.push(restaurantSub);
      console.log('✅ Subscribed to restaurant changes');

      // Subscribe to activity changes
      const activitySub = SupabaseDB.subscribeToActivities(userId, (payload) => {
        this.handleActivityChange(payload);
      });
      this.subscriptions.push(activitySub);
      console.log('✅ Subscribed to activity changes');

      // Subscribe to notification changes
      const notificationSub = SupabaseDB.subscribeToNotifications(userId, (payload) => {
        this.handleNotificationChange(payload);
      });
      this.subscriptions.push(notificationSub);
      console.log('✅ Subscribed to notification changes');

      // Subscribe to inbound SMS messages (await because it waits for Supabase init)
      const messageSub = await SupabaseDB.subscribeToMessages((payload) => {
        this.handleMessageChange(payload);
      });
      if (messageSub) {
        this.subscriptions.push(messageSub);
        console.log('✅ Subscribed to message changes');
      } else {
        console.error('❌ Failed to subscribe to message changes');
      }

      this.initialized = true;
      console.log('✅ Real-time sync initialized successfully');

      // Re-subscribe when tab becomes visible (handles connection loss when tab is hidden)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.initialized) {
          console.log('🔄 Tab visible - verifying subscriptions');
        }
      });
    } catch (err) {
      console.error('❌ Error initializing real-time sync:', err);
    }
  },

  /**
   * Handle restaurant change events
   */
  handleRestaurantChange(payload) {
    console.log('🔄 Restaurant change:', payload.eventType, payload);

    switch (payload.eventType) {
      case 'INSERT':
        // New restaurant added
        const newRestaurant = SupabaseDB._transformRestaurant(payload.new);
        if (!restaurants.find(r => r.id === newRestaurant.id)) {
          restaurants.push(newRestaurant);
          console.log('✅ New restaurant added to local array:', newRestaurant.name);
        }
        break;

      case 'UPDATE':
        // Restaurant updated
        const updatedRestaurant = SupabaseDB._transformRestaurant(payload.new);
        const index = restaurants.findIndex(r => r.id === updatedRestaurant.id);
        if (index !== -1) {
          restaurants[index] = updatedRestaurant;
          console.log('✅ Restaurant updated in local array:', updatedRestaurant.name);
        }
        break;

      case 'DELETE':
        // Restaurant deleted
        restaurants = restaurants.filter(r => r.id !== payload.old.id);
        console.log('✅ Restaurant removed from local array:', payload.old.id);
        break;
    }

    // Refresh UI
    if (typeof loadRestaurants === 'function') {
      loadRestaurants();
    }
    if (typeof loadDashboard === 'function') {
      loadDashboard();
    }
  },

  /**
   * Handle activity change events
   */
  handleActivityChange(payload) {
    console.log('🔄 Activity change:', payload.eventType, payload);

    if (payload.eventType === 'INSERT') {
      // New activity logged
      console.log('✅ New activity detected:', payload.new.description);

      // Refresh activity UI
      if (typeof updateRecentActivityUI === 'function') {
        updateRecentActivityUI();
      }
      if (typeof updateActivityIndicators === 'function') {
        updateActivityIndicators();
      }
    }
  },

  /**
   * Handle notification change events
   */
  handleNotificationChange(payload) {
    console.log('🔄 Notification change:', payload.eventType, payload);

    switch (payload.eventType) {
      case 'INSERT':
        // New notification added
        if (typeof NotificationSystem !== 'undefined') {
          // Notification was added by another client/window - sync it
          NotificationSystem.notifications.set(payload.new.path, {
            path: payload.new.path,
            title: payload.new.title,
            message: payload.new.message,
            timestamp: new Date(payload.new.timestamp).getTime(),
            read: payload.new.seen,
            expiresAt: payload.new.expires_at ? new Date(payload.new.expires_at).getTime() : null
          });
          NotificationSystem.applyNotifications();
          console.log('✅ Notification synced from database:', payload.new.path);
        }
        break;

      case 'DELETE':
        // Notification deleted
        if (typeof NotificationSystem !== 'undefined') {
          NotificationSystem.notifications.delete(payload.old.path);
          NotificationSystem.applyNotifications();
          console.log('✅ Notification removed (synced):', payload.old.path);
        }
        break;
    }
  },

  /**
   * Handle inbound SMS message events
   */
  handleMessageChange(payload) {
    // Detaljeret logging for debugging
    console.log('📨 Message change received:', {
      eventType: payload.eventType,
      direction: payload.new?.direction,
      phone: payload.new?.phone,
      provider: payload.new?.provider,
      content: payload.new?.content?.substring(0, 50),
      hasResolver: typeof window.resolveWorkflowReply === 'function',
      timestamp: new Date().toISOString()
    });

    if (payload.eventType === 'INSERT' && payload.new.direction === 'inbound') {
      const message = payload.new;

      // 1. Switch to Beskeder tab
      if (typeof switchTestTab === 'function') {
        switchTestTab('messages');
      }

      // 2. Hide empty state
      const emptyState = document.getElementById('messages-empty-state');
      if (emptyState) emptyState.style.display = 'none';

      // 3. Update phone number in header
      const convPhone = document.getElementById('conv-phone');
      if (convPhone) convPhone.textContent = message.phone;

      // 4. CRITICAL: Display the message in the messages container
      // Check if container exists first
      const messagesContainer = document.getElementById('messages');
      if (!messagesContainer) {
        console.error('❌ Messages container not found!');
        return;
      }

      if (typeof addMessage === 'function') {
        console.log('✅ Adding inbound message to UI:', {
          content: message.content.substring(0, 50),
          containerExists: !!messagesContainer,
          containerChildren: messagesContainer.children.length
        });

        const msgElement = addMessage(message.content, 'in');

        // Verify message was added
        if (msgElement) {
          console.log('✅ Message element created and added to DOM');

          // Ensure message is visible
          if (msgElement.style) {
            msgElement.style.display = 'block';
            msgElement.style.visibility = 'visible';
            msgElement.style.opacity = '1';
          }

          // Scroll to show new message
          msgElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
        } else {
          console.error('❌ addMessage returned null/undefined');
        }
      } else {
        console.error('❌ addMessage function not available');
      }

      // 5. Log the incoming SMS
      if (typeof addLog === 'function') {
        addLog(`📨 Indgående SMS fra ${message.phone}: ${message.content}`, 'info');
      }

      // 6. Show notification for new SMS
      if (typeof NotificationSystem !== 'undefined') {
        const preview = message.content.length > 50
          ? message.content.substring(0, 50) + '...'
          : message.content;
        NotificationSystem.add('workflow.sms.incoming', {
          title: 'Ny SMS',
          message: `Fra ${message.phone}: ${preview}`
        });
      }

      // 7. KRITISK: Resolve workflow hvis den venter på svar
      if (typeof window.resolveWorkflowReply === 'function') {
        console.log('✅ Resolving workflow with message:', message.content);
        window.resolveWorkflowReply(message.content);
      } else {
        console.warn('⚠️ No workflow resolver waiting - message not routed to workflow');
      }

      console.log('✅ Inbound SMS handled:', message.phone);
    }
  },

  /**
   * Clean up subscriptions
   */
  cleanup() {
    if (SupabaseDB) {
      SupabaseDB.unsubscribeAll();
    }
    this.subscriptions = [];
    this.initialized = false;
    console.log('🔇 Real-time sync cleaned up');
  }
};

// Auto-initialize when user logs in
if (typeof window !== 'undefined') {
  window.RealtimeSync = RealtimeSync;
}

console.log('✅ RealtimeSync module loaded');
