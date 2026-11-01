/**
 * Coverflow Carousel Engine
 * Extracted & adapted from 21st.dev (@ruixen.ui/components/coverflow-carousel)
 * Pure vanilla implementation with 3D transforms, inertial pointer drag,
 * keyboard controls, and responsive touch gestures.
 */

(function () {
  'use strict';

  function initCoverflow() {
    const container = document.querySelector('[data-coverflow-carousel]');
    if (!container) return;

    const stage = container.querySelector('[data-cf-stage]');
    const track = container.querySelector('[data-cf-track]');
    const cards = Array.from(container.querySelectorAll('[data-cf-card]'));
    const prevBtn = container.querySelector('[data-cf-prev]');
    const nextBtn = container.querySelector('[data-cf-next]');
    const dotsContainer = container.querySelector('[data-cf-dots]');
    const captionContainer = container.querySelector('[data-cf-caption]');

    if (!stage || !track || cards.length === 0) return;

    if (prevBtn && prevBtn.parentElement) {
      prevBtn.parentElement.classList.add('cf-controls');
    }

    // Physics & transform parameters from 21st.dev specification
    const config = {
      rotate: 42,         // max rotation angle in deg
      depth: 0.58,        // depth displacement factor
      falloff: 0.56,      // non-linear curve exponent
      fade: 0.14,         // distance opacity fade factor
      gap: 0.08,          // horizontal spacing factor
      loop: true,         // infinite circular navigation
    };

    const count = cards.length;
    let currentPos = 0;
    let targetPos = 0;
    let cardWidth = 0;
    let rafId = null;
    let activeIndex = 0;

    // Pointer drag state
    let dragTrack = null;
    let isDragging = false;
    let dragDistance = 0;

    // Pre-parse team member metadata from card DOM
    const teamMembers = cards.map((card, idx) => {
      const name = card.dataset.name || card.querySelector('h4')?.textContent?.trim() || '';
      const role = card.dataset.role || card.querySelector('p')?.textContent?.trim() || '';
      const socialHtml = card.querySelector('[data-cf-socials]')?.innerHTML || '';
      return { idx, name, role, socialHtml };
    });

    // Create pagination dots if container exists
    if (dotsContainer) {
      dotsContainer.classList.add('cf-pagination');
      dotsContainer.innerHTML = '';
      cards.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'cf-pagination-dot';
        if (i === 0) dot.setAttribute('aria-current', 'true');
        dot.setAttribute('aria-label', `Go to team member ${i + 1}`);
        dot.addEventListener('click', () => {
          goToSlide(i);
        });
        dotsContainer.appendChild(dot);
      });
    }

    const dots = dotsContainer ? Array.from(dotsContainer.querySelectorAll('button')) : [];

    function updateCaption(index) {
      if (!captionContainer) return;
      const member = teamMembers[index];
      if (!member) return;

      const nameEl = captionContainer.querySelector('[data-cf-name]');
      const roleEl = captionContainer.querySelector('[data-cf-role]');
      const socialsEl = captionContainer.querySelector('[data-cf-socials-target]');

      if (nameEl) nameEl.textContent = member.name;
      if (roleEl) roleEl.textContent = member.role;
      if (socialsEl) {
        socialsEl.innerHTML = member.socialHtml;
      }
    }

    function updateDots(index) {
      if (!dots.length) return;
      dots.forEach((dot, i) => {
        if (i === index) {
          dot.setAttribute('aria-current', 'true');
        } else {
          dot.removeAttribute('aria-current');
        }
      });
    }

    function measure() {
      if (cards[0]) {
        cardWidth = cards[0].offsetWidth;
        renderTransforms();
      }
    }

    // Measure on init and resize
    measure();
    const resizeObserver = new ResizeObserver(() => measure());
    resizeObserver.observe(stage);

    function normalizeIndex(pos) {
      return ((Math.round(pos) % count) + count) % count;
    }

    function renderTransforms() {
      if (!cardWidth) return;
      const step = cardWidth * (1 + config.gap);
      const curr = currentPos;

      cards.forEach((card, i) => {
        let offset = i - curr;
        if (config.loop) {
          offset = ((offset % count) + count) % count;
          if (offset > count / 2) offset -= count;
        }

        const dist = Math.abs(offset);
        const K = Math.pow(dist, config.falloff);
        const rot = Math.min(config.rotate * K, 82) * Math.sign(offset);

        const tx = offset * step;
        const tz = -config.depth * cardWidth * K;
        const ry = -rot;

        card.style.transform = `translateX(calc(-50% + ${tx}px)) translateZ(${tz}px) rotateY(${ry}deg)`;

        const loopFade = config.loop ? Math.min(1, Math.max(0, count / 2 - dist)) : 1;
        const opacity = Math.max(0, 1 - config.fade * dist) * loopFade;
        card.style.opacity = String(opacity);
        card.style.zIndex = String(100 - Math.round(dist));

        if (Math.round(dist) === 0) {
          card.classList.add('is-active-card');
          card.setAttribute('aria-hidden', 'false');
        } else {
          card.classList.remove('is-active-card');
          card.setAttribute('aria-hidden', 'true');
        }
      });
    }

    function animateTo(target) {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      targetPos = target;
      const newActive = normalizeIndex(targetPos);
      if (newActive !== activeIndex) {
        activeIndex = newActive;
        updateDots(activeIndex);
        updateCaption(activeIndex);
      }

      function step() {
        const delta = targetPos - currentPos;
        if (Math.abs(delta) < 0.0004) {
          currentPos = targetPos;
          renderTransforms();
          rafId = null;
          return;
        }
        currentPos += delta * 0.16;
        renderTransforms();
        rafId = requestAnimationFrame(step);
      }

      rafId = requestAnimationFrame(step);
    }

    function goToSlide(index) {
      if (config.loop) {
        const diff = Math.round((currentPos - index) / count);
        animateTo(index + diff * count);
      } else {
        animateTo(Math.max(0, Math.min(count - 1, index)));
      }
    }

    function stepSlide(dir) {
      if (config.loop) {
        animateTo(Math.round(targetPos) + dir);
      } else {
        animateTo(Math.max(0, Math.min(count - 1, Math.round(targetPos) + dir)));
      }
    }

    // Pointer events for smooth desktop & touch dragging
    stage.addEventListener('pointerdown', (e) => {
      // Allow interaction with buttons or links inside the card
      if (e.target.closest('a, button')) return;

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      try {
        stage.setPointerCapture(e.pointerId);
      } catch (_) {}

      isDragging = true;
      dragDistance = 0;
      stage.classList.add('is-dragging');

      dragTrack = {
        id: e.pointerId,
        startX: e.clientX,
        startPos: currentPos,
        velocity: 0,
        lastX: e.clientX,
        lastTime: performance.now(),
      };
    });

    stage.addEventListener('pointermove', (e) => {
      if (!isDragging || !dragTrack || dragTrack.id !== e.pointerId) return;

      const step = cardWidth * (1 + config.gap);
      if (!step) return;

      const now = performance.now();
      const deltaX = e.clientX - dragTrack.startX;
      dragDistance = Math.abs(deltaX);

      const rawPos = dragTrack.startPos - (deltaX / step);
      currentPos = config.loop ? rawPos : Math.max(0, Math.min(count - 1, rawPos));

      const dt = Math.max(now - dragTrack.lastTime, 1);
      const dx = e.clientX - dragTrack.lastX;
      dragTrack.velocity = (dx / dt) * 1000;
      dragTrack.lastX = e.clientX;
      dragTrack.lastTime = now;

      const idx = normalizeIndex(currentPos);
      if (idx !== activeIndex) {
        activeIndex = idx;
        updateDots(activeIndex);
        updateCaption(activeIndex);
      }

      renderTransforms();
    });

    function finishDrag(e) {
      if (!isDragging || !dragTrack || dragTrack.id !== e.pointerId) return;

      isDragging = false;
      stage.classList.remove('is-dragging');

      try {
        if (stage.hasPointerCapture(e.pointerId)) {
          stage.releasePointerCapture(e.pointerId);
        }
      } catch (_) {}

      const step = cardWidth * (1 + config.gap);
      const v = dragTrack.velocity / (step || 250);
      dragTrack = null;

      // Apply momentum clamp
      const momentum = Math.max(-2, Math.min(2, -v * 0.18));
      const target = Math.round(currentPos + momentum);
      animateTo(config.loop ? target : Math.max(0, Math.min(count - 1, target)));
    }

    stage.addEventListener('pointerup', finishDrag);
    stage.addEventListener('pointercancel', finishDrag);

    // Click on side card jumps to that card (unless dragged)
    cards.forEach((card, idx) => {
      card.addEventListener('click', (e) => {
        if (dragDistance > 8) return; // Ignore drag release
        if (e.target.closest('a, button')) return; // Allow links

        const currentActive = normalizeIndex(currentPos);
        if (currentActive !== idx) {
          e.preventDefault();
          goToSlide(idx);
        }
      });
    });

    // Arrow controls
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        stepSlide(-1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        stepSlide(1);
      });
    }

    // Keyboard navigation
    stage.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepSlide(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepSlide(1);
      }
    });

    // Initial render & sync
    updateDots(0);
    updateCaption(0);
    renderTransforms();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCoverflow);
  } else {
    initCoverflow();
  }
})();
