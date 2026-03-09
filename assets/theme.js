/**
 * theme.js — Vendor Theme Pro
 * Main theme JavaScript (ES6+, no jQuery)
 */

/* =========================================================
   1. HAMBURGER MENU
   ========================================================= */
(function initHamburgerMenu() {
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  const overlay = document.querySelector('.mobile-nav-overlay');
  const closeBtn = document.querySelector('.mobile-nav__close');
  const focusableSelectors =
    'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

  if (!hamburger || !mobileNav) return;

  function getFocusable() {
    return Array.from(mobileNav.querySelectorAll(focusableSelectors)).filter(
      (el) => !el.closest('[hidden]')
    );
  }

  function openNav() {
    mobileNav.classList.add('is-open');
    overlay && overlay.classList.add('is-visible');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-open');
    const focusable = getFocusable();
    if (focusable.length) focusable[0].focus();
  }

  function closeNav() {
    mobileNav.classList.remove('is-open');
    overlay && overlay.classList.remove('is-visible');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
    hamburger.focus();
  }

  function trapFocus(e) {
    if (!mobileNav.classList.contains('is-open')) return;
    const focusable = getFocusable();
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    if (e.key === 'Escape') closeNav();
  }

  hamburger.addEventListener('click', () => {
    const isOpen = mobileNav.classList.contains('is-open');
    isOpen ? closeNav() : openNav();
  });

  closeBtn && closeBtn.addEventListener('click', closeNav);
  overlay && overlay.addEventListener('click', closeNav);
  document.addEventListener('keydown', trapFocus);
})();


/* =========================================================
   2. HEADER SCROLL
   ========================================================= */
(function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  function onScroll() {
    if (window.scrollY > 10) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();


/* =========================================================
   3. ANNOUNCEMENT BAR DISMISS
   ========================================================= */
(function initAnnouncementBar() {
  const bar = document.querySelector('.announcement-bar');
  const dismissBtn = document.querySelector('.announcement-bar__dismiss');
  if (!bar || !dismissBtn) return;

  const key = 'announcement_dismissed';

  if (sessionStorage.getItem(key) === '1') {
    bar.style.display = 'none';
    return;
  }

  dismissBtn.addEventListener('click', () => {
    bar.style.display = 'none';
    sessionStorage.setItem(key, '1');
  });
})();


/* =========================================================
   4. QUANTITY SELECTORS (delegated)
   ========================================================= */
(function initQuantitySelectors() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.qty-minus, .qty-plus');
    if (!btn) return;

    const wrapper = btn.closest('.quantity-selector');
    if (!wrapper) return;

    const input = wrapper.querySelector('input[type="number"], input[type="text"]');
    if (!input) return;

    const min = parseInt(input.min, 10) || 1;
    let val = parseInt(input.value, 10) || min;

    if (btn.classList.contains('qty-plus')) {
      val += 1;
    } else {
      val = Math.max(min, val - 1);
    }

    input.value = val;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
})();


/* =========================================================
   5. FAQ ACCORDION
   ========================================================= */
(function initFaqAccordion() {
  const items = document.querySelectorAll('details.faq-item');
  if (!items.length) return;

  items.forEach((item) => {
    const summary = item.querySelector('summary');
    const content = item.querySelector('.faq-item__content');

    item.addEventListener('toggle', () => {
      if (item.open) {
        item.classList.add('is-open');
        if (content) {
          content.style.maxHeight = content.scrollHeight + 'px';
        }
        // Close siblings
        items.forEach((sibling) => {
          if (sibling !== item && sibling.open) {
            sibling.open = false;
          }
        });
      } else {
        item.classList.remove('is-open');
        if (content) {
          content.style.maxHeight = '0';
        }
      }
    });
  });
})();


/* =========================================================
   6. SCROLL ANIMATIONS
   ========================================================= */
(function initScrollAnimations() {
  const elements = document.querySelectorAll('.animate-on-scroll');
  if (!elements.length || !('IntersectionObserver' in window)) {
    elements.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const siblings = el.closest('.grid, .grid-list, [data-animate-group]');

        if (siblings) {
          const gridItems = Array.from(
            siblings.querySelectorAll('.animate-on-scroll:not(.is-visible)')
          );
          const idx = gridItems.indexOf(el);
          el.style.transitionDelay = idx > 0 ? `${idx * 80}ms` : '0ms';
        }

        el.classList.add('is-visible');
        observer.unobserve(el);
      });
    },
    { threshold: 0.12 }
  );

  elements.forEach((el) => observer.observe(el));
})();


/* =========================================================
   7. CART COUNT UPDATE
   ========================================================= */
function updateCartCount() {
  fetch('/cart.js', { credentials: 'same-origin' })
    .then((r) => r.json())
    .then((cart) => {
      const badges = document.querySelectorAll('.cart-count, [data-cart-count]');
      badges.forEach((badge) => {
        badge.textContent = cart.item_count;
        badge.setAttribute('aria-label', `Cart: ${cart.item_count} items`);
        badge.style.display = cart.item_count > 0 ? '' : 'none';
      });
    })
    .catch(() => {});
}

document.addEventListener('DOMContentLoaded', updateCartCount);
window.updateCartCount = updateCartCount;


/* =========================================================
   8. SEARCH OVERLAY / FORM
   ========================================================= */
(function initSearch() {
  const toggleBtns = document.querySelectorAll('.search-toggle, [data-search-toggle]');
  const searchOverlay = document.querySelector('.search-overlay');
  const searchInput = searchOverlay && searchOverlay.querySelector('input[type="search"], input[type="text"]');
  const closeBtn = searchOverlay && searchOverlay.querySelector('.search-overlay__close');

  if (!toggleBtns.length || !searchOverlay) return;

  function openSearch() {
    searchOverlay.classList.add('is-open');
    searchOverlay.removeAttribute('hidden');
    if (searchInput) {
      searchInput.focus();
    }
  }

  function closeSearch() {
    searchOverlay.classList.remove('is-open');
    searchOverlay.setAttribute('hidden', '');
  }

  toggleBtns.forEach((btn) => btn.addEventListener('click', (e) => {
    e.preventDefault();
    const isOpen = searchOverlay.classList.contains('is-open');
    isOpen ? closeSearch() : openSearch();
  }));

  closeBtn && closeBtn.addEventListener('click', closeSearch);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchOverlay.classList.contains('is-open')) {
      closeSearch();
    }
  });

  searchOverlay.addEventListener('click', (e) => {
    if (e.target === searchOverlay) closeSearch();
  });
})();


/* =========================================================
   9. STICKY HEADER (scroll class — CSS handles position)
   ========================================================= */
(function initStickyHeader() {
  const header = document.querySelector('.site-header[data-sticky]');
  if (!header) return;

  let lastY = window.scrollY;

  function onScroll() {
    const currentY = window.scrollY;
    if (currentY > 80) {
      header.classList.add('is-sticky');
    } else {
      header.classList.remove('is-sticky');
    }
    if (currentY > lastY && currentY > 200) {
      header.classList.add('header-hidden');
    } else {
      header.classList.remove('header-hidden');
    }
    lastY = currentY;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
