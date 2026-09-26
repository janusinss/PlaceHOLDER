/**
 * PlaceHOLDER - High-End Smooth Scroll Engine
 * Powered by Lenis & GSAP Ticker
 */
(function () {
  'use strict';

  if (typeof window === 'undefined') return;

  // Disable automatic scroll restoration by the browser
  if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  // Universal helper to force scroll position to the top across all engines
  window.forceScrollToTop = function (immediate) {
    window._suppressScrollRestore = true;
    window.scrollTo({ top: 0, left: 0, behavior: immediate !== false ? 'instant' : 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (window.lenis) {
      window.lenis.scrollTo(0, { immediate: true });
    }
    setTimeout(function () {
      window._suppressScrollRestore = false;
    }, 400);
  };

  // Force top on load if no specific hash anchor
  if (!window.location.hash) {
    window.forceScrollToTop(true);
  }

  window.addEventListener('pageshow', function (e) {
    if (!window.location.hash) {
      window.forceScrollToTop(true);
    }
  });

  // Global capture for internal navigation clicks to prevent bottom-stuck redirects
  document.addEventListener('click', function (e) {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href) return;

    // Handle hash links on the same page
    if (href.startsWith('#')) {
      if (href !== '#' && href.length > 1) {
        const target = document.querySelector(href);
        if (target && window.lenis) {
          e.preventDefault();
          window.lenis.scrollTo(target, { offset: -70, duration: 1.0 });
        }
      }
      return;
    }

    // Handle internal navigation to another page / route
    const isExternal = href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:') || link.target === '_blank';
    if (!isExternal && !href.includes('#')) {
      window.forceScrollToTop(true);
    }
  }, { capture: true });

  // Initialize Lenis Ultra-Smooth Inertial Scroll Engine
  let lenis = null;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      lerp: 0.1,             // Crisp, prompt settling that eliminates asymptotic subpixel text jitter
      smoothWheel: true,     // Silky mouse wheel & trackpad momentum
      wheelMultiplier: 0.9,  // Natural 1:1 wheel ratio
      touchMultiplier: 1.0,  // Natural touch response
      syncTouch: false,      // Preserves 120Hz native hardware compositor scroll on mobile
      autoResize: true,
      infinite: false,
      overscroll: false,     // Clean non-bouncing stop at boundaries
    });
    window.lenis = lenis;

    if (!window.location.hash) {
      lenis.scrollTo(0, { immediate: true });
    }

    // Direct high-precision requestAnimationFrame loop for Lenis
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Keep GSAP ScrollTrigger synchronized with interpolated scroll position
    if (typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
    }
  }

  // Top progress bar disabled per user request
  const existingBar = document.getElementById('scroll-progress-bar');
  if (existingBar) existingBar.remove();

  // Auto-center initial Rapid MVP Delivery card on mobile
  function centerWhyPartnerInitial() {
    if (window.innerWidth >= 640) return;
    const track = document.querySelector('.why-partner-track');
    if (!track || track.dataset.userScrolled === 'true') return;
    const target = track.querySelector('[data-card="rapid-mvp"]');
    if (target) {
      const left = target.offsetLeft - ((window.innerWidth - target.offsetWidth) / 2);
      track.scrollLeft = left;
    }
  }

  const track = document.querySelector('.why-partner-track');
  if (track) {
    const markInteracted = () => { track.dataset.userScrolled = 'true'; };
    track.addEventListener('touchstart', markInteracted, { passive: true });
    track.addEventListener('pointerdown', markInteracted, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', centerWhyPartnerInitial);
  } else {
    centerWhyPartnerInitial();
  }
  window.addEventListener('resize', centerWhyPartnerInitial);
  setTimeout(centerWhyPartnerInitial, 100);
  setTimeout(centerWhyPartnerInitial, 400);

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          centerWhyPartnerInitial();
        }
      });
    }, { threshold: 0.15 });
    const el = document.querySelector('.why-partner-track');
    if (el) observer.observe(el);
  }
})();
