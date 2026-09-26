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

  // Initialize Lenis Smooth Scroll Engine
  let lenis = null;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
      infinite: false,
    });
    window.lenis = lenis;

    if (!window.location.hash) {
      lenis.scrollTo(0, { immediate: true });
    }

    // Connect Lenis with GSAP Ticker for smooth 60/120fps synchronization
    if (typeof gsap !== 'undefined') {
      if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        lenis.on('scroll', ScrollTrigger.update);
      }
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }
  }

  // Glowing Top Scroll Reading Progress Indicator
  const progressBar = document.createElement('div');
  progressBar.id = 'scroll-progress-bar';
  document.body.appendChild(progressBar);

  const updateProgress = (scroll, maxScroll) => {
    if (maxScroll <= 0) {
      progressBar.style.width = '0%';
      return;
    }
    const percent = Math.min(Math.max((scroll / maxScroll) * 100, 0), 100);
    progressBar.style.width = `${percent}%`;
  };

  if (lenis) {
    lenis.on('scroll', (e) => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      updateProgress(e.scroll, maxScroll);
    });
  } else {
    window.addEventListener('scroll', () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      updateProgress(window.scrollY, maxScroll);
    }, { passive: true });
  }
})();
