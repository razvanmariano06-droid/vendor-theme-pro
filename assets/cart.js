/**
 * cart.js — Vendor Theme Pro
 * Cart page JavaScript (ES6+, no jQuery)
 */

/* =========================================================
   UTILITIES
   ========================================================= */
function formatMoney(cents) {
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: window.Shopify && window.Shopify.currency ? window.Shopify.currency.active : 'USD',
  });
}

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}


/* =========================================================
   SHARED: FETCH CART AND UPDATE TOTALS
   ========================================================= */
function fetchAndUpdateCart() {
  return fetch('/cart.js', { credentials: 'same-origin' })
    .then((res) => res.json())
    .then((cart) => {
      // Update subtotal
      const subtotalEls = document.querySelectorAll('[data-cart-subtotal]');
      subtotalEls.forEach((el) => { el.textContent = formatMoney(cart.total_price); });

      // Update header badge (shared utility if theme.js loaded)
      const badges = document.querySelectorAll('.cart-count, [data-cart-count]');
      badges.forEach((badge) => {
        badge.textContent = cart.item_count;
        badge.setAttribute('aria-label', `Cart: ${cart.item_count} items`);
        badge.style.display = cart.item_count > 0 ? '' : 'none';
      });

      // Show empty state if needed
      if (cart.item_count === 0) {
        showEmptyCart();
      }

      return cart;
    });
}

function showEmptyCart() {
  const cartItems = document.querySelector('[data-cart-items]');
  const cartFooter = document.querySelector('[data-cart-footer]');
  const emptyState = document.querySelector('[data-cart-empty]');

  if (cartItems) cartItems.style.display = 'none';
  if (cartFooter) cartFooter.style.display = 'none';
  if (emptyState) {
    emptyState.style.display = '';
    emptyState.removeAttribute('hidden');
  }
}


/* =========================================================
   1. QUANTITY UPDATES
   ========================================================= */
(function initCartQuantity() {
  const cartItemsContainer = document.querySelector('[data-cart-items]');
  if (!cartItemsContainer) return;

  const debouncedUpdate = debounce(function (lineKey, qty, lineItem) {
    updateLineItemQty(lineKey, qty, lineItem);
  }, 400);

  cartItemsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.qty-minus, .qty-plus');
    if (!btn) return;

    const lineItem = btn.closest('[data-line-item]');
    if (!lineItem) return;

    const input = lineItem.querySelector('input[data-qty-input]');
    if (!input) return;

    const min = parseInt(input.min, 10) || 1;
    let val = parseInt(input.value, 10) || min;

    if (btn.classList.contains('qty-plus')) {
      val += 1;
    } else {
      val = Math.max(min, val - 1);
    }

    input.value = val;
    debouncedUpdate(lineItem.dataset.lineKey || lineItem.dataset.lineItem, val, lineItem);
  });

  cartItemsContainer.addEventListener('change', (e) => {
    const input = e.target.closest('input[data-qty-input]');
    if (!input) return;

    const lineItem = input.closest('[data-line-item]');
    if (!lineItem) return;

    const min = parseInt(input.min, 10) || 1;
    const val = Math.max(min, parseInt(input.value, 10) || min);
    input.value = val;
    debouncedUpdate(lineItem.dataset.lineKey || lineItem.dataset.lineItem, val, lineItem);
  });

  function updateLineItemQty(lineKey, qty, lineItemEl) {
    lineItemEl && lineItemEl.classList.add('is-loading');

    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ id: lineKey, quantity: qty }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((err) => { throw err; });
        return res.json();
      })
      .then((cart) => {
        // Update line item price
        const updatedItem = cart.items.find(
          (item) => item.key === lineKey || String(item.variant_id) === String(lineKey)
        );
        if (lineItemEl && updatedItem) {
          const linePriceEl = lineItemEl.querySelector('[data-line-price]');
          if (linePriceEl) linePriceEl.textContent = formatMoney(updatedItem.line_price);
        }

        // Update subtotal elements
        const subtotalEls = document.querySelectorAll('[data-cart-subtotal]');
        subtotalEls.forEach((el) => { el.textContent = formatMoney(cart.total_price); });

        // Update header badge
        const badges = document.querySelectorAll('.cart-count, [data-cart-count]');
        badges.forEach((badge) => {
          badge.textContent = cart.item_count;
          badge.style.display = cart.item_count > 0 ? '' : 'none';
        });

        if (cart.item_count === 0) showEmptyCart();
      })
      .catch((err) => {
        console.error('[cart.js] Quantity update failed', err);
      })
      .finally(() => {
        lineItemEl && lineItemEl.classList.remove('is-loading');
      });
  }
})();


/* =========================================================
   2. REMOVE ITEM
   ========================================================= */
(function initCartRemove() {
  const cartItemsContainer = document.querySelector('[data-cart-items]');
  if (!cartItemsContainer) return;

  cartItemsContainer.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('[data-remove-item]');
    if (!removeBtn) return;

    const lineItem = removeBtn.closest('[data-line-item]');
    if (!lineItem) return;

    const lineKey = removeBtn.dataset.removeItem ||
      lineItem.dataset.lineKey ||
      lineItem.dataset.lineItem;

    removeBtn.disabled = true;
    lineItem.classList.add('is-removing');

    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ id: lineKey, quantity: 0 }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((err) => { throw err; });
        return res.json();
      })
      .then((cart) => {
        // Animate out and remove DOM node
        lineItem.style.transition = 'opacity 0.3s ease, max-height 0.4s ease';
        lineItem.style.overflow = 'hidden';
        lineItem.style.maxHeight = lineItem.offsetHeight + 'px';
        requestAnimationFrame(() => {
          lineItem.style.opacity = '0';
          lineItem.style.maxHeight = '0';
        });
        setTimeout(() => lineItem.remove(), 420);

        // Update totals
        const subtotalEls = document.querySelectorAll('[data-cart-subtotal]');
        subtotalEls.forEach((el) => { el.textContent = formatMoney(cart.total_price); });

        // Update header badge
        const badges = document.querySelectorAll('.cart-count, [data-cart-count]');
        badges.forEach((badge) => {
          badge.textContent = cart.item_count;
          badge.style.display = cart.item_count > 0 ? '' : 'none';
        });

        if (cart.item_count === 0) showEmptyCart();
      })
      .catch((err) => {
        console.error('[cart.js] Remove item failed', err);
        removeBtn.disabled = false;
        lineItem.classList.remove('is-removing');
      });
  });
})();


/* =========================================================
   3. CART TOTAL UPDATE (explicit refresh)
   ========================================================= */
window.refreshCartTotals = fetchAndUpdateCart;

document.addEventListener('DOMContentLoaded', () => {
  // Initial fetch to sync totals on page load
  fetchAndUpdateCart().catch(() => {});
});


/* =========================================================
   4. CART NOTE
   ========================================================= */
(function initCartNote() {
  const noteInput = document.querySelector('[data-cart-note], textarea[name="note"]');
  if (!noteInput) return;

  const saveNote = debounce(function (note) {
    fetch('/cart/update.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ note }),
    })
      .then((res) => res.json())
      .then(() => {})
      .catch((err) => console.error('[cart.js] Note save failed', err));
  }, 600);

  noteInput.addEventListener('input', () => saveNote(noteInput.value));
})();
