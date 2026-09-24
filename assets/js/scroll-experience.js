/**
 * PlaceHOLDER - High-End Smooth Scroll Engine
 * Powered by Lenis & GSAP Ticker
 */
(function () {
  'use strict';

  if (typeof window === 'undefined') return;

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

    // Smooth Anchor Link Navigation
    document.addEventListener('click', (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && href !== '#' && href.length > 1) {
          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            lenis.scrollTo(target, { offset: -70, duration: 1.0 });
          }
        }
      }
    });
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
