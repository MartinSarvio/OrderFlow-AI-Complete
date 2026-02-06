/**
 * Unified Inbox Module
 * Handles conversation threads, messages, and orders from all channels
 */

const UnifiedInbox = {
  // Current state
  currentThreadId: null,
  threads: [],
  messages: [],
  currentOrder: null,
  subscription: null,

  // Channel icons/colors
  channels: {
    sms: { label: 'SMS', color: '#22c55e', icon: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z' },
    instagram: { label: 'Instagram', color: '#e1306c', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
    facebook: { label: 'Facebook', color: '#1877f2', icon: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' },
    web: { label: 'Web', color: '#6366f1', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z' },
    app: { label: 'App', color: '#8b5cf6', icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' }
  },

  // Status colors
  statusColors: {
    draft: '#6b7280',
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    preparing: '#8b5cf6',
    ready: '#22c55e',
    picked_up: '#06b6d4',
    delivered: '#10b981',
    completed: '#22c55e',
    cancelled: '#ef4444',
    refunded: '#f97316'
  },

  /**
   * Initialize the inbox
   */
  async init() {
    console.log('Initializing Unified Inbox...');
    await this.loadThreads();
    this.setupRealtimeSubscription();
  },

  /**
   * Load threads from Supabase
   */
  async loadThreads(filters = {}) {
    const loadingEl = document.getElementById('inbox-threads-loading');
    const emptyEl = document.getElementById('inbox-threads-empty');
    const listEl = document.getElementById('inbox-threads-list');

    if (loadingEl) loadingEl.style.display = 'block';
    if (emptyEl) emptyEl.style.display = 'none';

    try {
      // Get current restaurant
      const restaurantId = window.currentRestaurant?.id;
      if (!restaurantId) {
        console.warn('No restaurant selected');
        return;
      }

      // Build query
      let query = window.supabaseClient
        .from('conversation_threads')
        .select(`
          id,
          channel,
          status,
          requires_attention,
          ai_confidence,
          last_message_at,
          created_at,
          customer:customers(id, name, phone, email)
        `)
        .eq('tenant_id', restaurantId)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .limit(50);

      // Apply filters
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.channel) query = query.eq('channel', filters.channel);

      const { data: threads, error } = await query;

      if (error) throw error;

      this.threads = threads || [];

      // Get last message for each thread
      for (const thread of this.threads) {
        const { data: messages } = await window.supabaseClient
          .from('thread_messages')
          .select('content, direction, created_at')
          .eq('thread_id', thread.id)
          .order('created_at', { ascending: false })
          .limit(1);

        thread.lastMessage = messages?.[0];

        // Get unread count
        const { count } = await window.supabaseClient
          .from('thread_messages')
          .select('id', { count: 'exact', head: true })
          .eq('thread_id', thread.id)
          .eq('direction', 'inbound')
          .is('read_at', null);

        thread.unreadCount = count || 0;
      }

      this.renderThreads();

    } catch (err) {
      console.error('Failed to load threads:', err);
      showNotification('Kunne ikke indlæse samtaler', 'error');
    } finally {
      if (loadingEl) loadingEl.style.display = 'none';
    }
  },

  /**
   * Render thread list
   */
  renderThreads() {
    const listEl = document.getElementById('inbox-threads-list');
    const emptyEl = document.getElementById('inbox-threads-empty');
    const loadingEl = document.getElementById('inbox-threads-loading');

    if (loadingEl) loadingEl.style.display = 'none';

    if (!this.threads.length) {
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    // Clear existing threads (except loading and empty states)
    const existingThreads = listEl.querySelectorAll('.inbox-thread-item');
    existingThreads.forEach(el => el.remove());

    // Render threads
    this.threads.forEach(thread => {
      const channel = this.channels[thread.channel] || this.channels.web;
      const customerName = thread.customer?.name || thread.customer?.phone || 'Ukendt';
      const lastMessage = thread.lastMessage?.content || 'Ingen beskeder';
      const timeAgo = this.formatTimeAgo(thread.last_message_at || thread.created_at);

      const threadEl = document.createElement('div');
      threadEl.className = 'inbox-thread-item';
      threadEl.dataset.threadId = thread.id;
      if (thread.id === this.currentThreadId) threadEl.classList.add('active');

      threadEl.innerHTML = `
        <div style="padding:var(--space-3) var(--space-4);border-bottom:1px solid var(--border);cursor:pointer;transition:background 0.15s;${thread.unreadCount > 0 ? 'background:rgba(99,102,241,0.05);' : ''}" onmouseover="this.style.background='var(--muted-bg)'" onmouseout="this.style.background='${thread.unreadCount > 0 ? 'rgba(99,102,241,0.05)' : 'transparent'}'">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
            <div style="display:flex;align-items:center;gap:var(--space-2)">
              ${thread.unreadCount > 0 ? '<span style="width:8px;height:8px;background:var(--primary);border-radius:50%"></span>' : ''}
              <span style="font-weight:${thread.unreadCount > 0 ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)'}">${this.escapeHtml(customerName)}</span>
            </div>
            <span style="font-size:11px;color:var(--muted)">${timeAgo}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <p style="font-size:var(--font-size-sm);color:var(--muted);margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px">${this.escapeHtml(lastMessage.substring(0, 50))}</p>
            <span style="background:${channel.color};color:white;padding:1px 6px;border-radius:var(--radius-sm);font-size:10px">${channel.label}</span>
          </div>
          ${thread.requires_attention ? '<div style="margin-top:4px"><span style="background:var(--warning);color:white;padding:1px 6px;border-radius:var(--radius-sm);font-size:10px">Kræver opmærksomhed</span></div>' : ''}
        </div>
      `;

      threadEl.onclick = () => this.selectThread(thread.id);
      listEl.appendChild(threadEl);
    });
  },

  /**
   * Select and load a thread
   */
  async selectThread(threadId) {
    this.currentThreadId = threadId;

    // Update active state
    document.querySelectorAll('.inbox-thread-item').forEach(el => {
      el.classList.toggle('active', el.dataset.threadId === threadId);
    });

    // Show header and reply box
    document.getElementById('inbox-conversation-header').style.display = 'block';
    document.getElementById('inbox-reply-box').style.display = 'block';
    document.getElementById('inbox-select-prompt').style.display = 'none';

    // Find thread
    const thread = this.threads.find(t => t.id === threadId);
    if (!thread) return;

    // Update header
    const channel = this.channels[thread.channel] || this.channels.web;
    document.getElementById('inbox-customer-name').textContent = thread.customer?.name || 'Ukendt';
    document.getElementById('inbox-customer-phone').textContent = thread.customer?.phone || thread.customer?.email || '-';
    document.getElementById('inbox-channel-badge').textContent = channel.label;
    document.getElementById('inbox-channel-badge').style.background = channel.color;

    // Load messages
    await this.loadMessages(threadId);

    // Load order
    await this.loadThreadOrder(threadId);

    // Mark messages as read
    await this.markMessagesRead(threadId);
  },

  /**
   * Load messages for a thread
   */
  async loadMessages(threadId) {
    const messagesEl = document.getElementById('inbox-messages');

    try {
      const { data: messages, error } = await window.supabaseClient
        .from('thread_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      this.messages = messages || [];
      this.renderMessages();

    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  },

  /**
   * Render messages
   */
  renderMessages() {
    const messagesEl = document.getElementById('inbox-messages');

    // Clear except select prompt
    const existingMessages = messagesEl.querySelectorAll('.inbox-message');
    existingMessages.forEach(el => el.remove());

    // Render messages
    this.messages.forEach(msg => {
      const isInbound = msg.direction === 'inbound';
      const time = new Date(msg.created_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });

      const msgEl = document.createElement('div');
      msgEl.className = 'inbox-message';
      msgEl.style.cssText = `display:flex;flex-direction:column;align-items:${isInbound ? 'flex-start' : 'flex-end'}`;

      msgEl.innerHTML = `
        <div style="max-width:80%;padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);background:${isInbound ? 'var(--muted-bg)' : 'var(--primary)'};color:${isInbound ? 'var(--text1)' : 'white'}">
          ${msg.message_type === 'order_event' ?
            `<div style="display:flex;align-items:center;gap:var(--space-2)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              <span>${this.escapeHtml(msg.content)}</span>
            </div>` :
            `<p style="margin:0;white-space:pre-wrap">${this.escapeHtml(msg.content)}</p>`
          }
        </div>
        <span style="font-size:10px;color:var(--muted);margin-top:2px">${time}${msg.sender_type === 'ai' ? ' • AI' : ''}</span>
      `;

      messagesEl.appendChild(msgEl);
    });

    // Scroll to bottom
    messagesEl.scrollTop = messagesEl.scrollHeight;
  },

  /**
   * Load order for thread
   */
  async loadThreadOrder(threadId) {
    const noOrderEl = document.getElementById('inbox-no-order');
    const detailsEl = document.getElementById('inbox-order-details');

    try {
      const { data: orders, error } = await window.supabaseClient
        .from('unified_orders')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (orders && orders.length > 0) {
        this.currentOrder = orders[0];
        this.renderOrder();
        noOrderEl.style.display = 'none';
        detailsEl.style.display = 'block';
      } else {
        this.currentOrder = null;
        noOrderEl.style.display = 'block';
        detailsEl.style.display = 'none';
      }

    } catch (err) {
      console.error('Failed to load order:', err);
    }
  },

  /**
   * Render order details
   */
  renderOrder() {
    if (!this.currentOrder) return;

    const order = this.currentOrder;
    const statusColor = this.statusColors[order.status] || '#6b7280';

    document.getElementById('inbox-order-number').textContent = order.order_number || '-';

    const statusEl = document.getElementById('inbox-order-status');
    statusEl.textContent = this.getStatusLabel(order.status);
    statusEl.style.background = statusColor;

    // Render items
    const itemsEl = document.getElementById('inbox-order-items');
    const items = order.line_items || [];
    itemsEl.innerHTML = items.map(item => `
      <div style="display:flex;justify-content:space-between;padding:var(--space-1) 0">
        <span>${item.quantity}x ${this.escapeHtml(item.name)}</span>
        <span>${(item.quantity * item.unit_price).toFixed(2)} kr</span>
      </div>
    `).join('') || '<p style="color:var(--muted);font-size:var(--font-size-sm)">Ingen produkter</p>';

    // Render totals
    document.getElementById('inbox-order-subtotal').textContent = `${(order.subtotal || 0).toFixed(2)} kr`;
    document.getElementById('inbox-order-delivery').textContent = `${(order.delivery_fee || 0).toFixed(2)} kr`;
    document.getElementById('inbox-order-total').textContent = `${(order.total || 0).toFixed(2)} kr`;
  },

  /**
   * Mark messages as read
   */
  async markMessagesRead(threadId) {
    try {
      await window.supabaseClient
        .from('thread_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('thread_id', threadId)
        .eq('direction', 'inbound')
        .is('read_at', null);

      // Update local thread
      const thread = this.threads.find(t => t.id === threadId);
      if (thread) {
        thread.unreadCount = 0;
        this.renderThreads();
      }

    } catch (err) {
      console.error('Failed to mark messages read:', err);
    }
  },

  /**
   * Send a reply
   */
  async sendReply(content) {
    if (!content.trim() || !this.currentThreadId) return;

    try {
      const { error } = await window.supabaseClient
        .from('thread_messages')
        .insert({
          thread_id: this.currentThreadId,
          direction: 'outbound',
          sender_type: 'agent',
          content: content.trim(),
          message_type: 'text'
        });

      if (error) throw error;

      // Clear input
      document.getElementById('inbox-reply-input').value = '';

      // Reload messages
      await this.loadMessages(this.currentThreadId);

      showNotification('Besked sendt', 'success');

    } catch (err) {
      console.error('Failed to send reply:', err);
      showNotification('Kunne ikke sende besked', 'error');
    }
  },

  /**
   * Setup realtime subscription
   */
  setupRealtimeSubscription() {
    if (!window.supabaseClient) return;

    const restaurantId = window.currentRestaurant?.id;
    if (!restaurantId) return;

    // Subscribe to new messages
    this.subscription = window.supabaseClient
      .channel('inbox-updates')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'thread_messages' },
        (payload) => {
          console.log('New message:', payload);
          // Reload threads and current conversation
          this.loadThreads();
          if (this.currentThreadId === payload.new.thread_id) {
            this.loadMessages(this.currentThreadId);
          }
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'conversation_threads' },
        (payload) => {
          console.log('Thread update:', payload);
          this.loadThreads();
        }
      )
      .subscribe();

    console.log('Realtime subscription active');
  },

  /**
   * Cleanup
   */
  destroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  },

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  formatTimeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Nu';
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} t`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} d`;
    return date.toLocaleDateString('da-DK');
  },

  getStatusLabel(status) {
    const labels = {
      draft: 'Kladde',
      pending: 'Afventer',
      confirmed: 'Bekræftet',
      preparing: 'Tilberedes',
      ready: 'Klar',
      picked_up: 'Afhentet',
      delivered: 'Leveret',
      completed: 'Fuldført',
      cancelled: 'Annulleret',
      refunded: 'Refunderet'
    };
    return labels[status] || status;
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// ============================================
// GLOBAL FUNCTIONS (called from HTML)
// ============================================

function filterInboxThreads() {
  const status = document.getElementById('inbox-filter-status')?.value || '';
  const channel = document.getElementById('inbox-filter-channel')?.value || '';
  UnifiedInbox.loadThreads({ status, channel });
}

function sendInboxReply() {
  const input = document.getElementById('inbox-reply-input');
  if (input) {
    UnifiedInbox.sendReply(input.value);
  }
}

function insertQuickReply(text) {
  const input = document.getElementById('inbox-reply-input');
  if (input) {
    input.value = text;
    input.focus();
  }
}

function resolveCurrentThread() {
  if (!UnifiedInbox.currentThreadId) return;

  window.supabaseClient
    .from('conversation_threads')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', UnifiedInbox.currentThreadId)
    .then(({ error }) => {
      if (error) {
        showNotification('Kunne ikke opdatere status', 'error');
      } else {
        showNotification('Samtale markeret som løst', 'success');
        UnifiedInbox.loadThreads();
      }
    });
}

function createOrderFromThread() {
  // TODO: Open order creation modal
  showNotification('Ordre oprettelse kommer snart', 'info');
}

function confirmInboxOrder() {
  if (!UnifiedInbox.currentOrder) return;

  window.supabaseClient
    .from('unified_orders')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('id', UnifiedInbox.currentOrder.id)
    .then(({ error }) => {
      if (error) {
        showNotification('Kunne ikke bekræfte ordre', 'error');
      } else {
        showNotification('Ordre bekræftet', 'success');
        UnifiedInbox.loadThreadOrder(UnifiedInbox.currentThreadId);
      }
    });
}

function markOrderReady() {
  if (!UnifiedInbox.currentOrder) return;

  window.supabaseClient
    .from('unified_orders')
    .update({ status: 'ready', estimated_ready_time: new Date().toISOString() })
    .eq('id', UnifiedInbox.currentOrder.id)
    .then(({ error }) => {
      if (error) {
        showNotification('Kunne ikke opdatere ordre', 'error');
      } else {
        showNotification('Ordre markeret som klar', 'success');
        UnifiedInbox.loadThreadOrder(UnifiedInbox.currentThreadId);
      }
    });
}

function cancelInboxOrder() {
  if (!UnifiedInbox.currentOrder) return;

  if (!confirm('Er du sikker på at du vil annullere denne ordre?')) return;

  window.supabaseClient
    .from('unified_orders')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', UnifiedInbox.currentOrder.id)
    .then(({ error }) => {
      if (error) {
        showNotification('Kunne ikke annullere ordre', 'error');
      } else {
        showNotification('Ordre annulleret', 'success');
        UnifiedInbox.loadThreadOrder(UnifiedInbox.currentThreadId);
      }
    });
}

// Initialize when page is shown
document.addEventListener('DOMContentLoaded', () => {
  // Will be called when page is shown
});

// Export
if (typeof window !== 'undefined') {
  window.UnifiedInbox = UnifiedInbox;
}
