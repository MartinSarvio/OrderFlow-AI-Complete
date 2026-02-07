/**
 * Feane Cart System (Skabelon-2)
 * jQuery/Bootstrap 4 based shopping cart for restaurant ordering
 */
(function($) {
  'use strict';

  const CART_STORAGE_KEY = 'flow_feane_cart';
  const DELIVERY_FEE = 35; // DKK
  const TAX_RATE = 0.25; // 25% moms

  const FeaneCart = {
    items: [],
    orderType: 'pickup', // pickup | delivery
    isOpen: false,

    // ========== CORE ==========

    init() {
      this.load();
      this.renderDrawer();
      this.bindEvents();
      this.updateBadge();
    },

    load() {
      try {
        const saved = localStorage.getItem(CART_STORAGE_KEY);
        if (saved) this.items = JSON.parse(saved);
      } catch (e) { this.items = []; }
    },

    save() {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items));
      } catch (e) { /* ignore */ }
    },

    // ========== ITEM MANAGEMENT ==========

    add(item) {
      const existing = this.items.find(i =>
        i.id === item.id && JSON.stringify(i.options) === JSON.stringify(item.options || [])
      );

      if (existing) {
        existing.quantity += (item.quantity || 1);
      } else {
        this.items.push({
          id: item.id || 'item-' + Date.now(),
          name: item.name,
          price: parseFloat(item.price) || 0,
          quantity: item.quantity || 1,
          image: item.image || '',
          options: item.options || [],
          notes: item.notes || ''
        });
      }

      this.save();
      this.render();
      this.showToast(item.name + ' tilf\u00f8jet til kurv');
    },

    remove(index) {
      this.items.splice(index, 1);
      this.save();
      this.render();
    },

    updateQty(index, qty) {
      if (qty <= 0) {
        this.remove(index);
        return;
      }
      this.items[index].quantity = qty;
      this.save();
      this.render();
    },

    clear() {
      this.items = [];
      this.save();
      this.render();
    },

    // ========== CALCULATIONS ==========

    getItemCount() {
      return this.items.reduce((sum, item) => sum + item.quantity, 0);
    },

    getSubtotal() {
      return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },

    getTax() {
      return this.getSubtotal() * TAX_RATE;
    },

    getDeliveryFee() {
      return this.orderType === 'delivery' ? DELIVERY_FEE : 0;
    },

    getTotal() {
      return this.getSubtotal() + this.getTax() + this.getDeliveryFee();
    },

    // ========== FORMAT ==========

    formatPrice(amount) {
      return amount.toFixed(2).replace('.', ',') + ' kr.';
    },

    // ========== CART DRAWER ==========

    renderDrawer() {
      if ($('#feane-cart-drawer').length) return;

      const drawerHtml = `
        <div id="feane-cart-overlay" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9998;opacity:0;transition:opacity 0.3s"></div>
        <div id="feane-cart-drawer" style="position:fixed;top:0;right:-400px;width:380px;max-width:90vw;height:100%;background:#fff;z-index:9999;transition:right 0.3s ease;display:flex;flex-direction:column;box-shadow:-4px 0 20px rgba(0,0,0,0.15)">
          <div style="padding:20px;background:#1a1a2e;color:#fff;display:flex;justify-content:space-between;align-items:center">
            <h5 style="margin:0;font-weight:600"><i class="fa fa-shopping-cart"></i> Din kurv</h5>
            <button id="feane-cart-close" style="background:none;border:none;color:#fff;font-size:24px;cursor:pointer">&times;</button>
          </div>
          <div style="padding:12px 20px;background:#f8f9fa;border-bottom:1px solid #eee;display:flex;gap:8px">
            <button class="feane-order-type-btn active" data-type="pickup" style="flex:1;padding:8px;border:2px solid #1a1a2e;background:#1a1a2e;color:#fff;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px">Afhentning</button>
            <button class="feane-order-type-btn" data-type="delivery" style="flex:1;padding:8px;border:2px solid #1a1a2e;background:#fff;color:#1a1a2e;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px">Levering (+${DELIVERY_FEE} kr.)</button>
          </div>
          <div id="feane-cart-items" style="flex:1;overflow-y:auto;padding:16px 20px"></div>
          <div id="feane-cart-footer" style="padding:16px 20px;border-top:2px solid #eee;background:#fff">
            <div id="feane-cart-totals"></div>
            <a href="checkout.html" id="feane-checkout-btn" class="btn btn-block" style="background:#1a1a2e;color:#fff;padding:12px;font-weight:600;border-radius:8px;margin-top:12px;text-align:center;font-size:15px;text-decoration:none;display:block">
              G\u00e5 til kassen
            </a>
          </div>
        </div>
      `;
      $('body').append(drawerHtml);
    },

    open() {
      this.isOpen = true;
      this.render();
      $('#feane-cart-drawer').css('right', '0');
      $('#feane-cart-overlay').show().animate({ opacity: 1 }, 200);
      $('body').css('overflow', 'hidden');
    },

    close() {
      this.isOpen = false;
      $('#feane-cart-drawer').css('right', '-400px');
      $('#feane-cart-overlay').animate({ opacity: 0 }, 200, function() { $(this).hide(); });
      $('body').css('overflow', '');
    },

    // ========== RENDERING ==========

    render() {
      this.updateBadge();
      this.renderItems();
      this.renderTotals();
    },

    updateBadge() {
      const count = this.getItemCount();
      let $badge = $('#feane-cart-badge');
      if (!$badge.length) {
        $('.cart_link').css('position', 'relative').append(
          '<span id="feane-cart-badge" style="position:absolute;top:-8px;right:-8px;background:#f00;color:#fff;border-radius:50%;width:20px;height:20px;font-size:11px;display:flex;align-items:center;justify-content:center;font-weight:700"></span>'
        );
        $badge = $('#feane-cart-badge');
      }
      $badge.text(count || '').toggle(count > 0);
    },

    renderItems() {
      const $container = $('#feane-cart-items');
      if (!$container.length) return;

      if (this.items.length === 0) {
        $container.html(`
          <div style="text-align:center;padding:40px 0;color:#999">
            <i class="fa fa-shopping-cart" style="font-size:48px;margin-bottom:16px;display:block"></i>
            <p style="margin:0">Din kurv er tom</p>
          </div>
        `);
        $('#feane-checkout-btn').css({ opacity: 0.5, pointerEvents: 'none' });
        return;
      }

      $('#feane-checkout-btn').css({ opacity: 1, pointerEvents: 'auto' });

      let html = '';
      this.items.forEach((item, index) => {
        html += `
          <div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #f0f0f0;align-items:flex-start">
            ${item.image ? `<img src="${item.image}" style="width:56px;height:56px;object-fit:cover;border-radius:8px" alt="">` : ''}
            <div style="flex:1;min-width:0">
              <div style="font-weight:600;font-size:14px;margin-bottom:2px">${item.name}</div>
              ${item.options.length ? `<div style="font-size:12px;color:#888">${item.options.join(', ')}</div>` : ''}
              <div style="font-size:13px;color:#1a1a2e;font-weight:600;margin-top:4px">${this.formatPrice(item.price)}</div>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <button onclick="FeaneCart.updateQty(${index}, ${item.quantity - 1})" style="width:28px;height:28px;border:1px solid #ddd;background:#fff;border-radius:4px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center">&minus;</button>
              <span style="min-width:20px;text-align:center;font-weight:600;font-size:14px">${item.quantity}</span>
              <button onclick="FeaneCart.updateQty(${index}, ${item.quantity + 1})" style="width:28px;height:28px;border:1px solid #ddd;background:#fff;border-radius:4px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center">+</button>
            </div>
            <button onclick="FeaneCart.remove(${index})" style="background:none;border:none;color:#dc3545;cursor:pointer;font-size:16px;padding:4px" title="Fjern">&times;</button>
          </div>
        `;
      });
      $container.html(html);
    },

    renderTotals() {
      const $totals = $('#feane-cart-totals');
      if (!$totals.length || this.items.length === 0) {
        $totals.html('');
        return;
      }

      let html = `
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
          <span>Subtotal</span><span>${this.formatPrice(this.getSubtotal())}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;color:#888">
          <span>Moms (25%)</span><span>${this.formatPrice(this.getTax())}</span>
        </div>
      `;

      if (this.orderType === 'delivery') {
        html += `
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;color:#888">
            <span>Levering</span><span>${this.formatPrice(this.getDeliveryFee())}</span>
          </div>
        `;
      }

      html += `
        <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:700;margin-top:8px;padding-top:8px;border-top:2px solid #1a1a2e">
          <span>Total</span><span>${this.formatPrice(this.getTotal())}</span>
        </div>
      `;

      $totals.html(html);
    },

    // ========== EVENTS ==========

    bindEvents() {
      const self = this;

      // Cart icon click
      $(document).on('click', '.cart_link', function(e) {
        e.preventDefault();
        self.open();
      });

      // Close drawer
      $(document).on('click', '#feane-cart-close, #feane-cart-overlay', function() {
        self.close();
      });

      // Order type toggle
      $(document).on('click', '.feane-order-type-btn', function() {
        const type = $(this).data('type');
        self.orderType = type;
        $('.feane-order-type-btn').each(function() {
          const isActive = $(this).data('type') === type;
          $(this).css({
            background: isActive ? '#1a1a2e' : '#fff',
            color: isActive ? '#fff' : '#1a1a2e'
          });
          $(this).toggleClass('active', isActive);
        });
        self.renderTotals();
      });

      // Add to cart from menu (data attribute based)
      $(document).on('click', '[data-add-to-cart]', function(e) {
        e.preventDefault();
        const $item = $(this).closest('[data-item-id]').length
          ? $(this).closest('[data-item-id]')
          : $(this).closest('.box, .col-sm-6');

        self.add({
          id: $item.attr('data-item-id') || 'item-' + Math.random().toString(36).slice(2, 8),
          name: $item.find('.detail-box h5, h5').first().text().trim(),
          price: parseFloat($item.attr('data-item-price') || $item.find('.options h6, h6').first().text().replace(/[^0-9.,]/g, '').replace(',', '.')) || 0,
          image: $item.find('.img-box img, img').first().attr('src') || '',
          options: []
        });
      });

      // "Order Online" button
      $(document).on('click', '.order_online', function(e) {
        e.preventDefault();
        window.location.href = 'menu.html';
      });

      // Escape key
      $(document).on('keydown', function(e) {
        if (e.key === 'Escape' && self.isOpen) self.close();
      });
    },

    // ========== TOAST ==========

    showToast(message) {
      const $existing = $('#feane-toast');
      if ($existing.length) $existing.remove();

      const $toast = $(`
        <div id="feane-toast" style="position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;z-index:10000;box-shadow:0 4px 12px rgba(0,0,0,0.2);white-space:nowrap">
          <i class="fa fa-check-circle" style="margin-right:8px;color:#28a745"></i>${message}
        </div>
      `);
      $('body').append($toast);
      setTimeout(() => $toast.fadeOut(300, () => $toast.remove()), 2500);
    },

    // ========== CHECKOUT DATA ==========

    getCheckoutData() {
      return {
        items: this.items.map(item => ({
          ...item,
          lineTotal: item.price * item.quantity
        })),
        orderType: this.orderType,
        subtotal: this.getSubtotal(),
        tax: this.getTax(),
        deliveryFee: this.getDeliveryFee(),
        total: this.getTotal(),
        itemCount: this.getItemCount()
      };
    }
  };

  // Expose globally
  window.FeaneCart = FeaneCart;

  // Init on DOM ready
  $(function() {
    FeaneCart.init();
  });

})(jQuery);
