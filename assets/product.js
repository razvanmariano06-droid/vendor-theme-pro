/**
 * product.js — Vendor Theme Pro
 * Product page JavaScript (ES6+, no jQuery)
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


/* =========================================================
   1. PRODUCT DATA
   ========================================================= */
const productData = (function parseProductData() {
  const el = document.getElementById('product-json');
  if (!el) return null;
  try {
    return JSON.parse(el.textContent);
  } catch (err) {
    console.error('[product.js] Failed to parse product JSON', err);
    return null;
  }
})();

window.productData = productData;


/* =========================================================
   2. VARIANT SELECTOR
   ========================================================= */
(function initVariantSelector() {
  if (!productData) return;

  const form = document.querySelector('form[action="/cart/add"]');
  if (!form) return;

  const optionSelects = form.querySelectorAll('.product-option__select, [data-option-select]');
  const variantIdInput = form.querySelector('input[name="id"]');
  const addToCartBtn = form.querySelector('[data-add-to-cart], button[type="submit"]');
  const priceEl = document.querySelector('[data-product-price]');
  const comparePriceEl = document.querySelector('[data-product-compare-price]');
  const availabilityEl = document.querySelector('[data-product-availability]');
  const mainImage = document.querySelector('[data-product-main-image]');

  function getSelectedOptions() {
    const opts = [];
    optionSelects.forEach((sel) => opts.push(sel.value));
    return opts;
  }

  function findVariant(selectedOptions) {
    return (productData.variants || []).find((variant) =>
      variant.options.every((opt, i) => opt === selectedOptions[i])
    ) || null;
  }

  function updatePrice(variant) {
    if (!priceEl) return;
    if (!variant) {
      priceEl.textContent = '—';
      comparePriceEl && (comparePriceEl.textContent = '');
      return;
    }
    priceEl.textContent = formatMoney(variant.price);
    if (comparePriceEl) {
      if (variant.compare_at_price && variant.compare_at_price > variant.price) {
        comparePriceEl.textContent = formatMoney(variant.compare_at_price);
        comparePriceEl.style.display = '';
      } else {
        comparePriceEl.textContent = '';
        comparePriceEl.style.display = 'none';
      }
    }
  }

  function updateAvailability(variant) {
    if (!addToCartBtn) return;
    const available = variant && variant.available;
    addToCartBtn.disabled = !available;
    if (availabilityEl) {
      availabilityEl.textContent = available ? 'In stock' : 'Out of stock';
      availabilityEl.dataset.available = available ? 'true' : 'false';
    }
    if (addToCartBtn) {
      addToCartBtn.textContent = available ? 'Add to cart' : 'Sold out';
    }
  }

  function updateMainImage(variant) {
    if (!mainImage || !variant || !variant.featured_image) return;
    const imgSrc = variant.featured_image.src;
    if (mainImage.tagName === 'IMG') {
      mainImage.src = imgSrc;
      mainImage.alt = variant.featured_image.alt || '';
    }
    // Highlight matching thumbnail
    const thumbs = document.querySelectorAll('[data-product-thumbnail]');
    thumbs.forEach((thumb) => {
      const src = thumb.dataset.imageSrc || (thumb.tagName === 'IMG' ? thumb.src : '');
      thumb.classList.toggle('is-active', src && imgSrc && src.includes(imgSrc.split('?')[0]));
    });
  }

  function updateURL(variant) {
    if (!variant) return;
    const url = new URL(window.location.href);
    url.searchParams.set('variant', variant.id);
    history.replaceState({}, '', url.toString());
  }

  function onOptionChange() {
    const selected = getSelectedOptions();
    const variant = findVariant(selected);

    if (variantIdInput) variantIdInput.value = variant ? variant.id : '';
    updatePrice(variant);
    updateAvailability(variant);
    updateMainImage(variant);
    updateURL(variant);
  }

  optionSelects.forEach((sel) => sel.addEventListener('change', onOptionChange));

  // Init on load
  onOptionChange();
})();


/* =========================================================
   3. PRODUCT PAGE QUANTITY SELECTOR
   ========================================================= */
(function initProductQuantity() {
  const wrapper = document.querySelector('.product-quantity');
  if (!wrapper) return;

  const input = wrapper.querySelector('input[type="number"], input[type="text"]');
  const minusBtn = wrapper.querySelector('.qty-minus');
  const plusBtn = wrapper.querySelector('.qty-plus');

  if (!input) return;

  function clamp(val) {
    const min = parseInt(input.min, 10) || 1;
    return Math.max(min, val);
  }

  minusBtn && minusBtn.addEventListener('click', () => {
    input.value = clamp((parseInt(input.value, 10) || 1) - 1);
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  plusBtn && plusBtn.addEventListener('click', () => {
    input.value = clamp((parseInt(input.value, 10) || 1) + 1);
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  input.addEventListener('change', () => {
    input.value = clamp(parseInt(input.value, 10) || 1);
  });
})();


/* =========================================================
   4. ADD TO CART (AJAX)
   ========================================================= */
(function initAddToCart() {
  const form = document.querySelector('form[action="/cart/add"]');
  if (!form) return;

  const submitBtn = form.querySelector('[data-add-to-cart], button[type="submit"]');

  function showNotification(message, type = 'success') {
    let notif = document.querySelector('.cart-notification');
    if (!notif) {
      notif = document.createElement('div');
      notif.className = 'cart-notification';
      document.body.appendChild(notif);
    }
    notif.textContent = message;
    notif.dataset.type = type;
    notif.classList.add('is-visible');
    clearTimeout(notif._timeout);
    notif._timeout = setTimeout(() => notif.classList.remove('is-visible'), 3000);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => { data[key] = value; });

    if (!data.id || data.id === '') {
      showNotification('Please select a variant.', 'error');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Adding…';
    }

    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(data),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((err) => { throw err; });
        return res.json();
      })
      .then(() => {
        showNotification('Item added to cart!', 'success');
        if (typeof window.updateCartCount === 'function') window.updateCartCount();
      })
      .catch((err) => {
        const msg = err && err.description ? err.description : 'Could not add item to cart.';
        showNotification(msg, 'error');
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Add to cart';
        }
      });
  });
})();


/* =========================================================
   5. IMAGE GALLERY
   ========================================================= */
(function initImageGallery() {
  const mainImage = document.querySelector('[data-product-main-image]');
  const thumbs = document.querySelectorAll('[data-product-thumbnail]');

  if (!mainImage || !thumbs.length) return;

  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', (e) => {
      e.preventDefault();
      const src = thumb.dataset.imageSrc || (thumb.tagName === 'IMG' ? thumb.src : '');
      const alt = thumb.dataset.imageAlt || thumb.alt || '';
      if (!src) return;

      mainImage.style.opacity = '0';
      setTimeout(() => {
        if (mainImage.tagName === 'IMG') {
          mainImage.src = src;
          mainImage.alt = alt;
        }
        mainImage.style.opacity = '1';
      }, 150);

      thumbs.forEach((t) => t.classList.remove('is-active'));
      thumb.classList.add('is-active');
    });
  });
})();
