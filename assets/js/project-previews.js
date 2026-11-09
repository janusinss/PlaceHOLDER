/* Shared lifecycle for silent, inline project previews, including Safari.
   Only one preview plays at a time: the one under the pointer, otherwise the
   one closest to the middle of the viewport. The rest hold their frame. */
(function () {
  'use strict';

  if (window.__mihaProjectPreviewsInitialized) return;
  window.__mihaProjectPreviewsInitialized = true;

  var selector = 'video[data-project-preview]';
  var stillSelector = 'img[data-project-animation]';
  var previews = new Map();
  var stills = new Map();
  var featured = null;
  var hovered = null;
  var featureFrame = 0;
  var reduceMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var intersectionObserver;
  var refreshFrame = 0;
  var nearEndSeconds = 0.75;

  function inViewport(video) {
    if (!video.isConnected || !video.getClientRects().length) return false;
    var rect = video.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 &&
      rect.top < window.innerHeight && rect.left < window.innerWidth &&
      window.getComputedStyle(video).visibility !== 'hidden';
  }

  function eligible(state) {
    return !state.disposed && document.visibilityState === 'visible' &&
      state.visible && state.video === featured && inViewport(state.video);
  }

  function mostlyVisible(el) {
    if (!inViewport(el)) return false;
    var rect = el.getBoundingClientRect();
    var shown = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
    return shown >= Math.min(rect.height, window.innerHeight) * 0.5;
  }

  function chooseFeatured() {
    if (document.visibilityState !== 'visible') return null;
    if (hovered && hovered.isConnected && inViewport(hovered)) return hovered;
    if (reduceMotion && reduceMotion.matches) return null;
    var middle = window.innerHeight / 2;
    var best = null;
    var bestDistance = Infinity;
    var bestLeft = Infinity;
    var currentDistance = Infinity;
    function consider(el) {
      if (!mostlyVisible(el)) return;
      var rect = el.getBoundingClientRect();
      var distance = Math.abs(rect.top + rect.height / 2 - middle);
      if (el === featured) currentDistance = distance;
      if (distance < bestDistance - 1 || (Math.abs(distance - bestDistance) <= 1 && rect.left < bestLeft)) {
        best = el;
        bestDistance = distance;
        bestLeft = rect.left;
      }
    }
    previews.forEach(function (state) { consider(state.video); });
    stills.forEach(function (_, img) { consider(img); });
    // Keep the current preview unless another is clearly more centred, so playback doesn't flicker.
    if (featured && currentDistance !== Infinity && currentDistance - bestDistance < 48) return featured;
    return best;
  }

  function updateStill(img) {
    var target = img === featured ? img.getAttribute('data-anim-src') : img.getAttribute('data-poster');
    if (target && img.getAttribute('src') !== target) img.setAttribute('src', target);
  }

  function registerStill(img) {
    if (stills.has(img)) return;
    if (!img.hasAttribute('data-poster')) img.setAttribute('data-poster', img.getAttribute('src'));
    var onError = function () {
      var fallback = img.getAttribute('data-anim-fallback');
      if (fallback && img.getAttribute('src') === img.getAttribute('data-anim-src')) {
        img.setAttribute('data-anim-src', fallback);
        img.removeAttribute('data-anim-fallback');
        updateStill(img);
      }
    };
    img.addEventListener('error', onError);
    stills.set(img, onError);
    scheduleFeature();
  }

  // The fade sits on the preview's wrapper so it never fights the hover zoom on the media itself.
  function markFrame(el) {
    var frame = el.parentElement;
    if (!frame) return;
    var state = el === featured ? 'live' : 'paused';
    if (frame.getAttribute('data-preview-frame') !== state) frame.setAttribute('data-preview-frame', state);
  }

  function markFrames() {
    previews.forEach(function (state) { markFrame(state.video); });
    stills.forEach(function (_, img) { markFrame(img); });
  }

  function injectFadeStyles() {
    if (document.getElementById('miha-preview-fade')) return;
    var style = document.createElement('style');
    style.id = 'miha-preview-fade';
    style.textContent =
      '@media (prefers-reduced-motion: no-preference) {' +
      '[data-preview-frame] { transition: opacity 600ms cubic-bezier(0.22, 1, 0.36, 1), filter 600ms cubic-bezier(0.22, 1, 0.36, 1); }' +
      '[data-preview-frame="paused"] { opacity: 0.55; filter: grayscale(1); }' +
      '}';
    document.head.appendChild(style);
  }

  function updateFeatured() {
    featureFrame = 0;
    var next = chooseFeatured();
    var changed = next !== featured;
    featured = next;
    stills.forEach(function (_, img) { updateStill(img); });
    markFrames();
    if (changed) previews.forEach(updateVisibility);
  }

  function scheduleFeature() {
    if (featureFrame) return;
    featureFrame = window.requestAnimationFrame(updateFeatured);
  }

  function previewIn(target) {
    if (!target || !target.closest) return null;
    if (target.matches(selector) || target.matches(stillSelector)) return target;
    var card = target.closest('article, li, a');
    return card ? card.querySelector(selector + ', ' + stillSelector) : null;
  }

  function clearTimers(state) {
    window.clearTimeout(state.endTimer);
    window.clearTimeout(state.retryTimer);
    window.clearTimeout(state.seekTimer);
    state.endTimer = 0;
    state.retryTimer = 0;
    state.seekTimer = 0;
  }

  function configure(video) {
    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = false;
    video.loop = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.removeAttribute('autoplay');
    video.setAttribute('loop', '');
  }

  function nearEnd(video) {
    return Number.isFinite(video.duration) && video.duration > 0 &&
      video.duration - video.currentTime <= nearEndSeconds;
  }

  function seekStart(video) {
    try { video.currentTime = 0; } catch (error) { /* Metadata may not be ready yet. */ }
  }

  function retryOnce(state) {
    if (!eligible(state) || state.blocked || state.retryTimer) return;
    state.retryTimer = window.setTimeout(function () {
      state.retryTimer = 0;
      if (!eligible(state) || state.blocked || !state.video.paused) return;
      if (state.video.ended || nearEnd(state.video)) seekStart(state.video);
      play(state);
    }, 80);
  }

  function play(state) {
    if (!eligible(state) || state.blocked || state.pending) return;
    configure(state.video);
    if (state.video.ended) seekStart(state.video);
    if (!state.video.paused) return;
    state.pending = true;
    var requestId = ++state.requestId;

    function settled(error) {
      if (requestId !== state.requestId) return;
      state.pending = false;
      if (state.disposed || !error) return;
      if (error.name === 'NotAllowedError') {
        state.blocked = true;
        clearTimers(state);
      } else if (error.name === 'AbortError' && !state.abortRetried) {
        state.abortRetried = true;
        retryOnce(state);
      }
    }

    try {
      var request = state.video.play();
      if (request && typeof request.then === 'function') {
        request.then(function () { settled(); }, settled);
      } else {
        settled();
      }
    } catch (error) {
      settled(error);
    }
  }

  function pause(state) {
    clearTimers(state);
    var pending = state.pending;
    if (pending) {
      state.requestId += 1;
      state.pending = false;
    }
    if (state.video.paused) {
      if (pending) state.video.pause();
      return;
    }
    state.expectedPause = true;
    state.video.pause();
  }

  function updateVisibility(state) {
    var visible = document.visibilityState === 'visible' && inViewport(state.video);
    if (visible && !state.visible) {
      state.pauseRetried = false;
      state.abortRetried = false;
      state.reloadUsed = false;
      state.stableProgress = 0;
    }
    state.visible = visible;
    if (eligible(state)) {
      play(state);
      armSeekRecovery(state);
    }
    else pause(state);
  }

  function reserveDimensions(video) {
    if (!video.videoWidth || !video.videoHeight) return;
    var width = Number(video.getAttribute('width'));
    var height = Number(video.getAttribute('height'));
    if (!video.hasAttribute('width')) {
      video.setAttribute('width', height > 0 ? Math.round(height * video.videoWidth / video.videoHeight) : video.videoWidth);
    }
    if (!video.hasAttribute('height')) {
      video.setAttribute('height', width > 0 ? Math.round(width * video.videoHeight / video.videoWidth) : video.videoHeight);
    }
  }

  function armSeekRecovery(state) {
    if (!eligible(state) || state.blocked || state.reloadUsed || state.seekTimer || !state.video.seeking) return;
    state.seekTimer = window.setTimeout(function () {
      state.seekTimer = 0;
      var video = state.video;
      if (!eligible(state) || state.blocked || state.reloadUsed || !video.seeking) return;
      state.reloadUsed = true;
      state.stableProgress = 0;
      state.lastTime = 0;
      state.requestId += 1;
      state.pending = false;
      clearTimers(state);
      reserveDimensions(video);
      configure(video);
      state.expectedPause = !video.paused;
      try { video.load(); } catch (error) { /* Keep the poster if reloading is unavailable. */ }
    }, 1500);
  }

  function armEndRecovery(state) {
    var video = state.video;
    if (!eligible(state) || state.blocked || video.paused || !nearEnd(video)) {
      window.clearTimeout(state.endTimer);
      state.endTimer = 0;
      return;
    }
    if (state.endTimer || video.playbackRate <= 0) return;
    var remaining = Math.max(0, video.duration - video.currentTime);
    var delay = Math.min(2000, Math.max(500, remaining / video.playbackRate * 1000 + 500));
    state.endTimer = window.setTimeout(function () {
      state.endTimer = 0;
      if (!eligible(state) || state.blocked || video.paused || !nearEnd(video)) return;
      seekStart(video);
      play(state);
    }, delay);
  }

  function register(video) {
    if (previews.has(video)) return;
    var state = {
      video: video, visible: false, blocked: false, pending: false, disposed: false,
      expectedPause: false, pauseRetried: false, abortRetried: false,
      reloadUsed: false, stableProgress: 0,
      requestId: 0, endTimer: 0, retryTimer: 0, seekTimer: 0,
      lastTime: video.currentTime, listeners: []
    };
    previews.set(video, state);
    configure(video);

    function listen(name, callback) {
      video.addEventListener(name, callback);
      state.listeners.push([name, callback]);
    }

    listen('loadedmetadata', function () {
      reserveDimensions(video);
      state.expectedPause = false;
      state.lastTime = video.currentTime;
      updateVisibility(state);
    });
    listen('canplay', function () { updateVisibility(state); });
    listen('playing', function () {
      if (!eligible(state)) pause(state);
    });
    listen('timeupdate', function () {
      var progress = video.currentTime - state.lastTime;
      if (Math.abs(progress) > 0.05) {
        state.pauseRetried = false;
        state.abortRetried = false;
      }
      if (!video.seeking && !video.paused && eligible(state) && progress > 0 && progress < 2) {
        state.stableProgress += progress;
        if (state.stableProgress > 1) state.reloadUsed = false;
      } else if (video.seeking || progress < 0) {
        state.stableProgress = 0;
      }
      state.lastTime = video.currentTime;
      armEndRecovery(state);
    });
    listen('seeking', function () {
      state.stableProgress = 0;
      armSeekRecovery(state);
    });
    listen('seeked', function () {
      window.clearTimeout(state.seekTimer);
      state.seekTimer = 0;
      state.stableProgress = 0;
      state.lastTime = video.currentTime;
      updateVisibility(state);
    });
    listen('ended', function () {
      clearTimers(state);
      if (!eligible(state) || state.blocked) return;
      seekStart(video);
      play(state);
    });
    listen('pause', function () {
      clearTimers(state);
      if (state.expectedPause) {
        state.expectedPause = false;
        armSeekRecovery(state);
        return;
      }
      if (!eligible(state) || state.blocked) return;
      armSeekRecovery(state);
      if (state.pauseRetried) return;
      state.pauseRetried = true;
      retryOnce(state);
    });
    listen('error', function () { clearTimers(state); });

    if (intersectionObserver) intersectionObserver.observe(video);
    updateVisibility(state);
    scheduleFeature();
  }

  function remove(state) {
    state.disposed = true;
    clearTimers(state);
    if (intersectionObserver) intersectionObserver.unobserve(state.video);
    state.listeners.forEach(function (listener) {
      state.video.removeEventListener(listener[0], listener[1]);
    });
    pause(state);
    previews.delete(state.video);
    if (featured === state.video) featured = null;
    if (hovered === state.video) hovered = null;
    scheduleFeature();
  }

  function discover(root) {
    if (!root || root.nodeType !== 1) return;
    if (root.matches(selector)) register(root);
    root.querySelectorAll(selector).forEach(register);
    if (root.matches(stillSelector)) registerStill(root);
    root.querySelectorAll(stillSelector).forEach(registerStill);
  }

  function refreshAll() {
    featured = chooseFeatured();
    stills.forEach(function (_, img) { updateStill(img); });
    markFrames();
    previews.forEach(updateVisibility);
  }

  function gesture(event) {
    if (!event.isTrusted || event.repeat) return;
    previews.forEach(function (state) {
      if (!eligible(state)) return;
      state.blocked = false;
      state.pauseRetried = false;
      state.abortRetried = false;
      window.clearTimeout(state.retryTimer);
      state.retryTimer = 0;
      play(state);
      armSeekRecovery(state);
    });
  }

  function boot() {
    injectFadeStyles();
    if (typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var state = previews.get(entry.target);
          if (state) updateVisibility(state);
        });
        scheduleFeature();
      }, { threshold: [0, 0.01, 0.5, 1] });
    }
    var scheduleRefresh = function () {
      if (refreshFrame) return;
      refreshFrame = window.requestAnimationFrame(function () {
        refreshFrame = 0;
        if (intersectionObserver) updateFeatured();
        else refreshAll();
      });
    };
    window.addEventListener('scroll', scheduleRefresh, { passive: true });
    window.addEventListener('resize', scheduleRefresh, { passive: true });
    if (reduceMotion && reduceMotion.addEventListener) reduceMotion.addEventListener('change', scheduleFeature);

    document.addEventListener('pointerover', function (event) {
      if (event.pointerType !== 'mouse') return;
      var preview = previewIn(event.target);
      if (preview && preview !== hovered) {
        hovered = preview;
        scheduleFeature();
      }
    }, { passive: true });
    document.addEventListener('pointerout', function (event) {
      if (event.pointerType !== 'mouse' || !hovered) return;
      if (previewIn(event.relatedTarget) === hovered) return;
      hovered = null;
      scheduleFeature();
    }, { passive: true });

    discover(document.documentElement);
    new MutationObserver(function (records) {
      records.forEach(function (record) { record.addedNodes.forEach(discover); });
      previews.forEach(function (state) { if (!state.video.isConnected) remove(state); });
      stills.forEach(function (onError, img) {
        if (img.isConnected) return;
        img.removeEventListener('error', onError);
        stills.delete(img);
        if (featured === img) featured = null;
        if (hovered === img) hovered = null;
      });
      scheduleFeature();
    }).observe(document.documentElement, { childList: true, subtree: true });

    document.addEventListener('visibilitychange', refreshAll);
    window.addEventListener('pageshow', refreshAll);
    window.addEventListener('pagehide', function () {
      previews.forEach(function (state) {
        state.visible = false;
        pause(state);
      });
    });
    ['pointerup', 'touchend', 'keydown'].forEach(function (name) {
      document.addEventListener(name, gesture, { capture: true, passive: true });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
