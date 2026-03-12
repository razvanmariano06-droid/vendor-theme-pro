/* animations.js — Proveedors Shop Online */
'use strict';

document.addEventListener('DOMContentLoaded', function () {

  /* =========================================================
     HAMBURGER / MOBILE MENU
     ========================================================= */
  var menuToggle = document.getElementById('menu-toggle');
  var mobileNav = document.getElementById('mobile-nav');
  var iconHamburger = menuToggle ? menuToggle.querySelector('.icon-hamburger') : null;
  var iconClose = menuToggle ? menuToggle.querySelector('.icon-close') : null;

  function openMenu() {
    if (!mobileNav || !menuToggle) return;
    mobileNav.setAttribute('aria-hidden', 'false');
    menuToggle.setAttribute('aria-expanded', 'true');
    if (iconHamburger) iconHamburger.style.display = 'none';
    if (iconClose) iconClose.style.display = 'block';
    document.body.classList.add('menu-open');
  }

  function closeMenu() {
    if (!mobileNav || !menuToggle) return;
    mobileNav.setAttribute('aria-hidden', 'true');
    menuToggle.setAttribute('aria-expanded', 'false');
    if (iconHamburger) iconHamburger.style.display = 'block';
    if (iconClose) iconClose.style.display = 'none';
    document.body.classList.remove('menu-open');
  }

  function toggleMenu() {
    if (!mobileNav) return;
    if (mobileNav.getAttribute('aria-hidden') === 'false') {
      closeMenu();
    } else {
      openMenu();
    }
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', toggleMenu);
  }

  /* Close on outside click */
  document.addEventListener('click', function (e) {
    if (!mobileNav || !menuToggle) return;
    if (
      mobileNav.getAttribute('aria-hidden') === 'false' &&
      !mobileNav.contains(e.target) &&
      !menuToggle.contains(e.target)
    ) {
      closeMenu();
    }
  });

  /* Home link: close menu + smooth scroll to #packages */
  var homeLinks = document.querySelectorAll('[data-action="home"]');
  homeLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      closeMenu();
      var packagesEl = document.getElementById('packages');
      if (packagesEl) {
        e.preventDefault();
        packagesEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  /* =========================================================
     INTERSECTION OBSERVER — .anim-fade-up
     ========================================================= */
  var fadeElements = document.querySelectorAll('.anim-fade-up');
  if (fadeElements.length > 0 && typeof IntersectionObserver !== 'undefined') {
    var fadeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    fadeElements.forEach(function (el) {
      fadeObserver.observe(el);
    });
  }

  /* =========================================================
     FAQ ACCORDION
     ========================================================= */
  var faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(function (item, index) {
    var btn = item.querySelector('.faq-question');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var isActive = item.classList.contains('active');

      /* Close all */
      faqItems.forEach(function (fi) {
        fi.classList.remove('active');
        var fb = fi.querySelector('.faq-question');
        if (fb) fb.setAttribute('aria-expanded', 'false');
      });

      /* Toggle clicked */
      if (!isActive) {
        item.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* =========================================================
     QUANTITY +/- BUTTONS (product page)
     ========================================================= */
  var qtyMinus = document.querySelectorAll('.qty-minus');
  var qtyPlus = document.querySelectorAll('.qty-plus');

  qtyMinus.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = btn.closest('.qty-control') ? btn.closest('.qty-control').querySelector('.qty-input') : null;
      if (!input) return;
      var val = parseInt(input.value, 10) || 1;
      if (val > 1) {
        input.value = val - 1;
        syncQtyHidden(input);
      }
    });
  });

  qtyPlus.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = btn.closest('.qty-control') ? btn.closest('.qty-control').querySelector('.qty-input') : null;
      if (!input) return;
      var val = parseInt(input.value, 10) || 1;
      var max = parseInt(input.getAttribute('max'), 10) || 99;
      if (val < max) {
        input.value = val + 1;
        syncQtyHidden(input);
      }
    });
  });

  function syncQtyHidden(input) {
    var hidden = document.getElementById('product-qty-hidden');
    if (hidden) hidden.value = input.value;
  }

  /* =========================================================
     PRODUCT PAGE — THUMBNAIL SWITCHING
     ========================================================= */
  var thumbs = document.querySelectorAll('.product-thumb');
  var mainImg = document.getElementById('main-product-img');

  thumbs.forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      if (!mainImg) return;
      var src = thumb.getAttribute('data-src');
      var alt = thumb.getAttribute('data-alt') || '';
      mainImg.src = src;
      mainImg.alt = alt;
      thumbs.forEach(function (t) { t.classList.remove('active'); });
      thumb.classList.add('active');
    });
  });

  /* =========================================================
     PRODUCT PAGE — VARIANT SELECT
     ========================================================= */
  var variantSelect = document.getElementById('variant-select');
  var productPriceEl = document.getElementById('product-price');
  var productComparePriceEl = document.getElementById('product-compare-price');
  var variantIdInput = document.getElementById('product-variant-id');

  if (variantSelect) {
    variantSelect.addEventListener('change', function () {
      var selected = variantSelect.options[variantSelect.selectedIndex];
      if (!selected) return;

      if (productPriceEl) {
        var price = selected.getAttribute('data-price');
        if (price) productPriceEl.textContent = price;
      }
      if (productComparePriceEl) {
        var comparePrice = selected.getAttribute('data-compare-price');
        if (comparePrice) {
          productComparePriceEl.textContent = comparePrice;
          productComparePriceEl.style.display = '';
        } else {
          productComparePriceEl.style.display = 'none';
        }
      }
      if (variantIdInput) {
        variantIdInput.value = selected.value;
      }
    });
  }

  /* =========================================================
     CART ICON BUTTONS — add to cart + redirect
     ========================================================= */
  var cartBtns = document.querySelectorAll('.cart-icon-btn[data-product-id]');
  cartBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var variantId = btn.getAttribute('data-product-id');
      if (!variantId) return;

      btn.disabled = true;

      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: variantId, quantity: 1 })
      })
        .then(function () {
          window.location.href = '/cart';
        })
        .catch(function () {
          window.location.href = '/cart';
        });
    });
  });

  /* =========================================================
     TICKER — VIEWERS + COUNTDOWN
     ========================================================= */
  var viewerEls = document.querySelectorAll('.ticker-viewers');
  var countdownEls = document.querySelectorAll('.ticker-countdown');

  /* Random viewers */
  function randomViewers() {
    var count = Math.floor(Math.random() * 51) + 30; /* 30–80 */
    viewerEls.forEach(function (el) { el.textContent = count; });
  }

  randomViewers();
  setInterval(randomViewers, 8000);

  /* Countdown from 02:59:59 */
  var countdownTotal = 2 * 3600 + 59 * 60 + 59;

  function formatCountdown(secs) {
    var h = Math.floor(secs / 3600);
    var m = Math.floor((secs % 3600) / 60);
    var s = secs % 60;
    return (
      String(h).padStart(2, '0') + ':' +
      String(m).padStart(2, '0') + ':' +
      String(s).padStart(2, '0')
    );
  }

  function tickCountdown() {
    countdownEls.forEach(function (el) { el.textContent = formatCountdown(countdownTotal); });
    if (countdownTotal > 0) {
      countdownTotal--;
    } else {
      countdownTotal = 2 * 3600 + 59 * 60 + 59;
    }
  }

  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* =========================================================
     FAKE PURCHASE NOTIFICATIONS
     ========================================================= */
  var notifEl = document.getElementById('fake-notification');

  var notifNames = [
    'Alex M.', 'Jordan T.', 'Sam R.', 'Chris P.', 'Taylor W.',
    'Morgan B.', 'Casey L.', 'Riley S.', 'Jamie K.', 'Drew H.',
    'Blake N.', 'Avery C.', 'Quinn A.', 'Reese J.', 'Parker D.',
    'Finley O.', 'Hayden G.', 'Cameron F.', 'Dakota V.', 'Charlie E.',
    'Skyler Z.', 'Emery I.', 'Sage U.', 'River Y.', 'Phoenix X.'
  ];

  var fallbackProducts = [
    'Reseller Starter Pack',
    'Premium Supplier Directory',
    'Wholesale Vendor Bundle',
    'Elite Reseller Package',
    'Dropship Supplier List'
  ];

  function getNotifProducts() {
    var prods = window.fakeNotifProducts;
    if (prods && prods.length > 0) return prods;
    return fallbackProducts;
  }

  function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function showNotification() {
    if (!notifEl) return;

    var name = randomItem(notifNames);
    var product = randomItem(getNotifProducts());
    var mins = Math.floor(Math.random() * 55) + 5;

    notifEl.innerHTML =
      '<span style="color:var(--primary);font-weight:700;">' + name + '</span> just purchased<br>' +
      '<span style="color:#fff;font-weight:700;">' + product + '</span><br>' +
      '<span style="font-size:0.75rem;color:var(--gray-500);">' + mins + ' minutes ago</span>';

    notifEl.style.display = 'block';
    notifEl.style.animation = 'none';
    notifEl.offsetHeight; /* reflow */
    notifEl.style.animation = '';

    setTimeout(function () {
      notifEl.style.display = 'none';
      scheduleNextNotification();
    }, 4000);
  }

  function scheduleNextNotification() {
    var delay = Math.floor(Math.random() * 3000) + 5000; /* 5–8 seconds */
    setTimeout(showNotification, delay);
  }

  /* Start the cycle */
  setTimeout(showNotification, 3000);

}); /* end DOMContentLoaded */
