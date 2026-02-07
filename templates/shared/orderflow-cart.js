(function () {
  const STORAGE_KEY = 'orderflow_web_cart_v1';
  const DEFAULT_DELIVERY_FEE = 29;

  let cart = loadCart();
  let overlay;
  let itemsEl;
  let emptyEl;
  let subtotalEl;
  let taxEl;
  let deliveryEl;
  let totalEl;
  let checkoutForm;
  let errorEl;
  let floatingBtn;

  function loadCart() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return { items: [], fulfillment: { type: 'pickup' } };
  }

  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function parsePrice(text) {
    if (!text) return 0;
    const cleaned = text.replace(/[^0-9,.-]/g, '').replace(',', '.');
    const value = parseFloat(cleaned);
    return Number.isFinite(value) ? value : 0;
  }

  function findItemFromSkabelon2(target) {
    const card = target.closest('.box');
    if (!card) return null;
    const name = card.querySelector('.detail-box h5')?.textContent?.trim();
    const priceText = card.querySelector('.options h6')?.textContent || '';
    const price = parsePrice(priceText);
    if (!name) return null;
    return { name, unit_price: price || 0, quantity: 1 };
  }

  function findItemFromSkabelon3(target) {
    const card = target.closest('.menu-wrap');
    if (!card) return null;
    const name = card.querySelector('.text h3')?.textContent?.trim();
    const priceText = card.querySelector('.price span')?.textContent || '';
    const price = parsePrice(priceText);
    if (!name) return null;
    return { name, unit_price: price || 0, quantity: 1 };
  }

  function addItem(item) {
    if (!item || !item.name) return;
    const existing = cart.items.find(
      (i) => i.name === item.name && i.unit_price === item.unit_price
    );
    if (existing) {
      existing.quantity += item.quantity || 1;
    } else {
      cart.items.push({
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: item.name,
        unit_price: item.unit_price || 0,
        quantity: item.quantity || 1
      });
    }
    saveCart();
    renderCart();
    showToast(`${item.name} tilføjet til kurv`);
  }

  function updateQuantity(id, delta) {
    const item = cart.items.find((i) => i.id === id);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
      cart.items = cart.items.filter((i) => i.id !== id);
    }
    saveCart();
    renderCart();
  }

  function calculateTotals() {
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );
    const tax = subtotal * 0.25;
    const deliveryFee = cart.fulfillment?.type === 'delivery' ? DEFAULT_DELIVERY_FEE : 0;
    const total = subtotal + tax + deliveryFee;
    return { subtotal, tax, deliveryFee, total };
  }

  function renderCart() {
    if (!itemsEl || !emptyEl) return;

    if (cart.items.length === 0) {
      itemsEl.innerHTML = '';
      emptyEl.style.display = 'block';
    } else {
      emptyEl.style.display = 'none';
      itemsEl.innerHTML = cart.items
        .map(
          (item) => `
          <div class="of-cart-item">
            <div>
              <div class="of-cart-item-name">${item.name}</div>
              <div class="of-cart-item-price">${formatCurrency(item.unit_price)} x ${item.quantity}</div>
            </div>
            <div class="of-cart-item-qty">
              <button data-of-qty="-1" data-id="${item.id}">-</button>
              <span>${item.quantity}</span>
              <button data-of-qty="1" data-id="${item.id}">+</button>
            </div>
          </div>
        `
        )
        .join('');
    }

    const totals = calculateTotals();
    if (subtotalEl) subtotalEl.textContent = formatCurrency(totals.subtotal);
    if (taxEl) taxEl.textContent = formatCurrency(totals.tax);
    if (deliveryEl) deliveryEl.textContent = formatCurrency(totals.deliveryFee);
    if (totalEl) totalEl.textContent = formatCurrency(totals.total);

    if (checkoutForm) {
      const fulfillmentSelect = checkoutForm.querySelector('select[name=\"fulfillment\"]');
      if (fulfillmentSelect) {
        fulfillmentSelect.value = cart.fulfillment?.type || 'pickup';
        overlay
          .querySelectorAll('[data-of-address]')
          .forEach((el) => {
            el.style.display = fulfillmentSelect.value === 'delivery' ? 'grid' : 'none';
          });
      }
    }

    const totalCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    if (floatingBtn) {
      const countEl = floatingBtn.querySelector('.of-count');
      if (countEl) countEl.textContent = totalCount.toString();
      floatingBtn.style.display = totalCount > 0 ? 'flex' : 'none';
    }
  }

  function formatCurrency(amount) {
    return `${Math.round(amount)} kr.`;
  }

  function openCart() {
    if (!overlay) return;
    overlay.classList.add('of-active');
  }

  function closeCart() {
    if (!overlay) return;
    overlay.classList.remove('of-active');
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'of-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('of-show'));
    setTimeout(() => {
      toast.classList.remove('of-show');
      setTimeout(() => toast.remove(), 200);
    }, 1800);
  }

  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.id = 'of-cart-overlay';
    overlay.innerHTML = `
      <div class="of-cart">
        <div class="of-cart-header">
          <h3>Din kurv</h3>
          <button class="of-cart-close" type="button">×</button>
        </div>
        <div class="of-cart-body">
          <div class="of-cart-empty">Din kurv er tom</div>
          <div class="of-cart-items"></div>

          <div class="of-cart-summary">
            <div class="of-cart-summary-row"><span>Subtotal</span><span id="of-subtotal">0 kr.</span></div>
            <div class="of-cart-summary-row"><span>Moms (25%)</span><span id="of-tax">0 kr.</span></div>
            <div class="of-cart-summary-row"><span>Levering</span><span id="of-delivery">0 kr.</span></div>
            <div class="of-cart-summary-row" style="font-weight:600"><span>Total</span><span id="of-total">0 kr.</span></div>
          </div>

          <form class="of-checkout-form" id="of-checkout-form">
            <div class="of-checkout-row">
              <div>
                <label>Navn *</label>
                <input type="text" name="name" required />
              </div>
              <div>
                <label>Telefon *</label>
                <input type="tel" name="phone" required />
              </div>
            </div>
            <div>
              <label>Email</label>
              <input type="email" name="email" />
            </div>
            <div>
              <label>Levering / afhentning</label>
              <select name="fulfillment">
                <option value="pickup">Afhentning</option>
                <option value="delivery">Levering</option>
              </select>
            </div>
            <div class="of-checkout-row" data-of-address>
              <div>
                <label>Adresse</label>
                <input type="text" name="street" placeholder="Gade og nr." />
              </div>
              <div>
                <label>Postnummer</label>
                <input type="text" name="postalCode" />
              </div>
            </div>
            <div class="of-checkout-row" data-of-address>
              <div>
                <label>By</label>
                <input type="text" name="city" />
              </div>
              <div>
                <label>Etage / Dørkode</label>
                <input type="text" name="doorCode" />
              </div>
            </div>
            <div>
              <label>Betaling</label>
              <select name="paymentMethod">
                <option value="card">Kort</option>
                <option value="mobilepay">MobilePay</option>
                <option value="cash">Kontant</option>
              </select>
            </div>
            <div id="of-checkout-error" style="color:#dc2626;font-size:12px"></div>
            <div class="of-checkout-actions">
              <button class="of-btn-secondary" type="button" data-of-close>Fortsæt shopping</button>
              <button class="of-btn-primary" type="submit">Gennemfør ordre</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    itemsEl = overlay.querySelector('.of-cart-items');
    emptyEl = overlay.querySelector('.of-cart-empty');
    subtotalEl = overlay.querySelector('#of-subtotal');
    taxEl = overlay.querySelector('#of-tax');
    deliveryEl = overlay.querySelector('#of-delivery');
    totalEl = overlay.querySelector('#of-total');
    checkoutForm = overlay.querySelector('#of-checkout-form');
    errorEl = overlay.querySelector('#of-checkout-error');

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeCart();
    });

    overlay.querySelector('.of-cart-close')?.addEventListener('click', closeCart);
    overlay.querySelector('[data-of-close]')?.addEventListener('click', closeCart);

    checkoutForm?.addEventListener('submit', handleCheckoutSubmit);
  }

  function handleCheckoutSubmit(event) {
    event.preventDefault();
    if (!checkoutForm) return;

    errorEl.textContent = '';

    if (cart.items.length === 0) {
      errorEl.textContent = 'Kurven er tom.';
      return;
    }

    const formData = new FormData(checkoutForm);
    const name = (formData.get('name') || '').toString().trim();
    const phone = (formData.get('phone') || '').toString().trim();
    const email = (formData.get('email') || '').toString().trim();
    const fulfillmentType = (formData.get('fulfillment') || 'pickup').toString();
    const paymentMethod = (formData.get('paymentMethod') || 'card').toString();

    if (!name || !phone) {
      errorEl.textContent = 'Udfyld navn og telefon.';
      return;
    }

    if (fulfillmentType === 'delivery') {
      const street = (formData.get('street') || '').toString().trim();
      const postalCode = (formData.get('postalCode') || '').toString().trim();
      const city = (formData.get('city') || '').toString().trim();
      if (!street || !postalCode || !city) {
        errorEl.textContent = 'Udfyld adresse, postnummer og by.';
        return;
      }
    }

    const address = {
      street: (formData.get('street') || '').toString().trim(),
      postalCode: (formData.get('postalCode') || '').toString().trim(),
      city: (formData.get('city') || '').toString().trim(),
      doorCode: (formData.get('doorCode') || '').toString().trim()
    };

    const payload = {
      items: cart.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price
      })),
      customer: { name, phone, email: email || undefined },
      fulfillment: {
        type: fulfillmentType,
        address: fulfillmentType === 'delivery' ? address : undefined
      },
      payment_method: paymentMethod
    };

    errorEl.textContent = 'Opretter ordre...';

    fetch('/api/public/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || 'Kunne ikke oprette ordre');
        }
        return res.json();
      })
      .then((data) => {
        cart.items = [];
        cart.fulfillment = { type: fulfillmentType };
        saveCart();
        renderCart();
        showToast(`Ordre oprettet: ${data.order_number || ''}`.trim());
        closeCart();
      })
      .catch((err) => {
        errorEl.textContent = err instanceof Error ? err.message : 'Kunne ikke oprette ordre';
      });
  }

  function buildFloatingButton() {
    floatingBtn = document.createElement('div');
    floatingBtn.className = 'of-floating-cart';
    floatingBtn.innerHTML = `Kurv <span class="of-count">0</span>`;
    floatingBtn.addEventListener('click', openCart);
    document.body.appendChild(floatingBtn);
  }

  function bindEvents() {
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const openBtn = target.closest('[data-of-cart-open]');
      if (openBtn) {
        event.preventDefault();
        openCart();
        return;
      }

      const addBtn = target.closest('[data-of-add-to-cart]');
      if (addBtn) {
        event.preventDefault();
        const item = findItemFromSkabelon3(addBtn);
        if (item) addItem(item);
        openCart();
        return;
      }

      const skabelon2Add = target.closest('.food_section .options a');
      if (skabelon2Add) {
        event.preventDefault();
        const item = findItemFromSkabelon2(skabelon2Add);
        if (item) addItem(item);
        openCart();
        return;
      }

      const qtyBtn = target.closest('[data-of-qty]');
      if (qtyBtn && qtyBtn.dataset.id) {
        event.preventDefault();
        const delta = parseInt(qtyBtn.dataset.ofQty, 10) || 0;
        updateQuantity(qtyBtn.dataset.id, delta);
      }
    });

    document.addEventListener('change', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement)) return;
      if (target.name === 'fulfillment') {
        const isDelivery = target.value === 'delivery';
        cart.fulfillment = { type: target.value };
        saveCart();
        renderCart();
        overlay
          .querySelectorAll('[data-of-address]')
          .forEach((el) => {
            el.style.display = isDelivery ? 'grid' : 'none';
          });
      }
    });
  }

  function init() {
    if (!cart.fulfillment) cart.fulfillment = { type: 'pickup' };
    buildOverlay();
    buildFloatingButton();
    bindEvents();

    overlay
      .querySelectorAll('[data-of-address]')
      .forEach((el) => {
        el.style.display = 'none';
      });

    renderCart();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
