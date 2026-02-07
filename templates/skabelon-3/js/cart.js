/**
 * Pizza Delicious Cart System (Skabelon-3)
 * jQuery/Bootstrap 4 based shopping cart
 */
(function($) {
  'use strict';

  const CART_STORAGE_KEY = 'flow_pizza_cart';
  const DELIVERY_FEE = 35;
  const TAX_RATE = 0.25;

  const PizzaCart = {
    items: [],
    orderType: 'pickup',
    isOpen: false,

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
      try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items)); } catch (e) {}
    },

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
      if (qty <= 0) { this.remove(index); return; }
      this.items[index].quantity = qty;
      this.save();
      this.render();
    },

    clear() {
      this.items = [];
      this.save();
      this.render();
    },

    getItemCount() { return this.items.reduce((s, i) => s + i.quantity, 0); },
    getSubtotal() { return this.items.reduce((s, i) => s + (i.price * i.quantity), 0); },
    getTax() { return this.getSubtotal() * TAX_RATE; },
    getDeliveryFee() { return this.orderType === 'delivery' ? DELIVERY_FEE : 0; },
    getTotal() { return this.getSubtotal() + this.getTax() + this.getDeliveryFee(); },
    formatPrice(amt) { return amt.toFixed(2).replace('.', ',') + ' kr.'; },

    renderDrawer() {
      if ($('#pizza-cart-drawer').length) return;

      $('body').append(`
        <div id="pizza-cart-overlay" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9998;opacity:0;transition:opacity 0.3s"></div>
        <div id="pizza-cart-drawer" style="position:fixed;top:0;right:-400px;width:380px;max-width:90vw;height:100%;background:#fff;z-index:9999;transition:right 0.3s ease;display:flex;flex-direction:column;box-shadow:-4px 0 20px rgba(0,0,0,0.2)">
          <div style="padding:20px;background:#000;color:#fff;display:flex;justify-content:space-between;align-items:center">
            <h5 style="margin:0;font-weight:700;font-family:'Josefin Sans',sans-serif"><span class="icon-shopping-cart" style="margin-right:8px"></span>Din kurv</h5>
            <button id="pizza-cart-close" style="background:none;border:none;color:#fff;font-size:28px;cursor:pointer;line-height:1">&times;</button>
          </div>
          <div style="padding:10px 20px;background:#f8f9fa;border-bottom:1px solid #eee;display:flex;gap:8px">
            <button class="pizza-order-type active" data-type="pickup" style="flex:1;padding:10px;border:2px solid #000;background:#000;color:#fff;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px">Afhentning</button>
            <button class="pizza-order-type" data-type="delivery" style="flex:1;padding:10px;border:2px solid #000;background:#fff;color:#000;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px">Levering (+${DELIVERY_FEE} kr.)</button>
          </div>
          <div id="pizza-cart-items" style="flex:1;overflow-y:auto;padding:16px 20px"></div>
          <div id="pizza-cart-footer" style="padding:16px 20px;border-top:2px solid #eee">
            <div id="pizza-cart-totals"></div>
            <a href="checkout.html" id="pizza-checkout-btn" class="btn btn-primary btn-block" style="background:#000;border-color:#000;padding:12px;font-weight:700;border-radius:8px;margin-top:12px;font-size:15px">G\u00e5 til kassen</a>
          </div>
        </div>
      `);
    },

    open() {
      this.isOpen = true;
      this.render();
      $('#pizza-cart-drawer').css('right', '0');
      $('#pizza-cart-overlay').show().animate({ opacity: 1 }, 200);
      $('body').css('overflow', 'hidden');
    },

    close() {
      this.isOpen = false;
      $('#pizza-cart-drawer').css('right', '-400px');
      $('#pizza-cart-overlay').animate({ opacity: 0 }, 200, function() { $(this).hide(); });
      $('body').css('overflow', '');
    },

    render() {
      this.updateBadge();
      this.renderItems();
      this.renderTotals();
    },

    updateBadge() {
      const count = this.getItemCount();
      // Nav badge
      let $navBadge = $('#pizza-cart-badge-nav');
      if ($navBadge.length) {
        $navBadge.text(count || '').toggle(count > 0);
      }
    },

    renderItems() {
      const $c = $('#pizza-cart-items');
      if (!$c.length) return;

      if (this.items.length === 0) {
        $c.html('<div style="text-align:center;padding:40px 0;color:#999"><span class="icon-shopping-cart" style="font-size:48px;display:block;margin-bottom:16px"></span><p style="margin:0">Din kurv er tom</p></div>');
        $('#pizza-checkout-btn').css({ opacity: 0.5, pointerEvents: 'none' });
        return;
      }

      $('#pizza-checkout-btn').css({ opacity: 1, pointerEvents: 'auto' });

      let html = '';
      this.items.forEach((item, i) => {
        html += `
          <div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #f0f0f0;align-items:flex-start">
            ${item.image ? `<div style="width:56px;height:56px;border-radius:8px;background:url(${item.image}) center/cover;flex-shrink:0"></div>` : ''}
            <div style="flex:1;min-width:0">
              <div style="font-weight:700;font-size:14px;margin-bottom:2px">${item.name}</div>
              ${item.options.length ? `<div style="font-size:12px;color:#888">${item.options.join(', ')}</div>` : ''}
              <div style="font-size:13px;font-weight:600;margin-top:4px">${this.formatPrice(item.price)}</div>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <button onclick="PizzaCart.updateQty(${i},${item.quantity-1})" style="width:28px;height:28px;border:1px solid #ddd;background:#fff;border-radius:4px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center">&minus;</button>
              <span style="min-width:20px;text-align:center;font-weight:700;font-size:14px">${item.quantity}</span>
              <button onclick="PizzaCart.updateQty(${i},${item.quantity+1})" style="width:28px;height:28px;border:1px solid #ddd;background:#fff;border-radius:4px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center">+</button>
            </div>
            <button onclick="PizzaCart.remove(${i})" style="background:none;border:none;color:#dc3545;cursor:pointer;font-size:18px;padding:4px">&times;</button>
          </div>
        `;
      });
      $c.html(html);
    },

    renderTotals() {
      const $t = $('#pizza-cart-totals');
      if (!$t.length || !this.items.length) { $t.html(''); return; }

      let html = `
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span>Subtotal</span><span>${this.formatPrice(this.getSubtotal())}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;color:#888"><span>Moms (25%)</span><span>${this.formatPrice(this.getTax())}</span></div>
      `;
      if (this.orderType === 'delivery') {
        html += `<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;color:#888"><span>Levering</span><span>${this.formatPrice(this.getDeliveryFee())}</span></div>`;
      }
      html += `<div style="display:flex;justify-content:space-between;font-size:16px;font-weight:700;margin-top:8px;padding-top:8px;border-top:2px solid #000"><span>Total</span><span>${this.formatPrice(this.getTotal())}</span></div>`;
      $t.html(html);
    },

    bindEvents() {
      var self = this;

      $(document).on('click', '#pizza-cart-close, #pizza-cart-overlay', function() { self.close(); });

      $(document).on('click', '.pizza-order-type', function() {
        var type = $(this).data('type');
        self.orderType = type;
        $('.pizza-order-type').each(function() {
          var active = $(this).data('type') === type;
          $(this).css({ background: active ? '#000' : '#fff', color: active ? '#fff' : '#000' }).toggleClass('active', active);
        });
        self.renderTotals();
      });

      // "Order" or "Add to cart" buttons in menu
      $(document).on('click', '[data-add-to-cart]', function(e) {
        e.preventDefault();
        var $wrap = $(this).closest('.services-wrap, .menu-wrap, [data-item-id]');
        if (!$wrap.length) $wrap = $(this).closest('.col-lg-4, .col-md-6');

        self.add({
          id: $wrap.attr('data-item-id') || 'pizza-' + Math.random().toString(36).slice(2, 8),
          name: $wrap.find('h3').first().text().trim() || $wrap.find('h5').first().text().trim(),
          price: parseFloat($wrap.attr('data-item-price') || $wrap.find('.price span').first().text().replace(/[^0-9.,]/g, '').replace(',', '.')) || 0,
          image: ($wrap.find('.img').css('background-image') || '').replace(/url\(["']?/, '').replace(/["']?\)/, '') || $wrap.find('img').first().attr('src') || ''
        });
      });

      $(document).on('keydown', function(e) { if (e.key === 'Escape' && self.isOpen) self.close(); });
    },

    showToast(message) {
      var $t = $('#pizza-cart-toast');
      if ($t.length) $t.remove();
      $t = $('<div id="pizza-cart-toast" style="position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#000;color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;z-index:10000;box-shadow:0 4px 12px rgba(0,0,0,0.3);white-space:nowrap"><span class="icon-check" style="margin-right:8px;color:#28a745"></span>' + message + '</div>');
      $('body').append($t);
      setTimeout(function() { $t.fadeOut(300, function() { $t.remove(); }); }, 2500);
    },

    getCheckoutData() {
      return {
        items: this.items.map(function(i) { return Object.assign({}, i, { lineTotal: i.price * i.quantity }); }),
        orderType: this.orderType,
        subtotal: this.getSubtotal(),
        tax: this.getTax(),
        deliveryFee: this.getDeliveryFee(),
        total: this.getTotal(),
        itemCount: this.getItemCount()
      };
    }
  };

  window.PizzaCart = PizzaCart;
  $(function() { PizzaCart.init(); });

})(jQuery);
