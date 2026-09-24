/**
 * PlaceHOLDER - Interactive Liquid Silk WebGL Shader Engine
 * Simulates undulating dark liquid chrome / satin silk waves with specular highlights
 * and real-time cursor/touch/scroll interaction.
 *
 * Supports multi-canvas, dynamic textures, SPA route transitions (React Router),
 * viewport culling, and automatic recovery on DOM mutations.
 */
(function() {
  'use strict';

  const activeInstances = new Set();

  const vsSource = `
    attribute vec2 position;
    varying vec2 v_uv;
    void main() {
      v_uv = position * 0.5 + 0.5;
      v_uv.y = 1.0 - v_uv.y;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fsSource = `
    precision highp float;
    varying vec2 v_uv;
    uniform sampler2D u_texture;
    uniform float u_time;
    uniform vec2 u_mouse;
    uniform float u_hover;
    uniform vec2 u_resolution;
    uniform float u_scroll;

    void main() {
      vec2 uv = v_uv;

      // Aspect-ratio corrected mouse coordinates
      vec2 m = u_mouse;
      vec2 aspect = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
      float distToMouse = length((uv - m) * aspect);

      // Interactive cursor liquid displacement
      float mouseWave = sin(distToMouse * 16.0 - u_time * 5.0) * exp(-distToMouse * 3.2) * 0.038 * u_hover;
      vec2 mouseDisp = normalize((uv - m) * aspect + 0.0001) * mouseWave;

      // Layered organic fluid silk breathing displacement
      float t = u_time * 0.55 + u_scroll * 0.0008;
      vec2 silkWave = vec2(
        sin(uv.y * 3.5 + t * 0.8 + uv.x * 2.0) * 0.016 + cos(uv.x * 4.5 - t * 0.6) * 0.012,
        cos(uv.x * 3.8 + t * 0.7 - uv.y * 1.5) * 0.018 + sin(uv.y * 5.0 + t * 0.5) * 0.010
      );

      // Secondary diagonal drape fold
      float diag = sin((uv.x * 2.0 + uv.y * 3.0) * 2.5 - t * 0.9) * 0.012;
      silkWave += vec2(diag * 0.7, diag * 1.1);

      vec2 distortedUV = clamp(uv + silkWave + mouseDisp, 0.001, 0.999);
      vec4 texColor = texture2D(u_texture, distortedUV);

      // Specular chrome sheen on wave peaks
      float sheenVal = (silkWave.x + silkWave.y + mouseWave) * 18.0;
      float sheen = pow(max(sheenVal, 0.0), 2.2) * 0.45;

      // Interactive mouse glow
      float mouseGlow = exp(-distToMouse * 4.5) * 0.25 * u_hover;

      vec3 chromeShine = vec3(0.96, 0.98, 1.0) * (sheen + mouseGlow);

      gl_FragColor = vec4(texColor.rgb + chromeShine, 1.0);
    }
  `;

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('LiquidSilk shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function initCanvas(canvas) {
    if (!canvas || canvas.__liquidSilkInit) return;

    // Check if canvas is attached to DOM
    if (!document.body.contains(canvas)) return;

    const container = canvas.closest('#liquid-silk-container, .liquid-silk-container') || canvas.parentElement;
    if (!container) return;

    canvas.__liquidSilkInit = true;

    const gl = canvas.getContext('webgl', { powerPreference: 'high-performance', alpha: true, antialias: true }) ||
               canvas.getContext('experimental-webgl');

    if (!gl) {
      console.warn('LiquidSilk: WebGL unavailable, static image fallback active');
      return;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('LiquidSilk program link error:', gl.getProgramInfoLog(program));
      return;
    }

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1
    ]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uTexture = gl.getUniformLocation(program, 'u_texture');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');
    const uHover = gl.getUniformLocation(program, 'u_hover');
    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uScroll = gl.getUniformLocation(program, 'u_scroll');

    // Create texture with 1x1 dark fallback pixel immediately
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([10, 10, 12, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Dynamic texture image resolution
    let textureSrc = canvas.getAttribute('data-texture');
    if (!textureSrc) {
      const siblingImg = container.querySelector('img');
      if (siblingImg && siblingImg.src) {
        textureSrc = siblingImg.src;
      }
    }
    if (!textureSrc) {
      textureSrc = 'assets/images/cover/clients-cover.jpg';
    }

    let isLoaded = false;
    const image = new Image();
    image.crossOrigin = 'anonymous';

    function uploadTexture() {
      if (isLoaded) return;
      isLoaded = true;
      try {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      } catch (err) {
        console.warn('LiquidSilk texture upload warning:', err);
      }
    }

    image.onload = uploadTexture;
    image.onerror = function() {
      // Retry without anonymous crossOrigin if CORS rejected local file
      if (image.crossOrigin) {
        const retryImg = new Image();
        retryImg.onload = function() {
          image.src = retryImg.src;
          uploadTexture();
        };
        retryImg.src = textureSrc;
      }
    };

    image.src = textureSrc;
    if (image.complete && image.naturalWidth > 0) {
      uploadTexture();
    }

    let mouseX = 0.5, mouseY = 0.5;
    let targetMouseX = 0.5, targetMouseY = 0.5;
    let hover = 0.0, targetHover = 0.0;
    let scrollY = 0, targetScrollY = 0;
    let isVisible = true;
    let rafId = null;

    function onPointerMove(clientX, clientY) {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        targetMouseX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        targetMouseY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
        targetHover = 1.0;
      }
    }

    const mouseMoveHandler = function(e) { onPointerMove(e.clientX, e.clientY); };
    const mouseEnterHandler = function() { targetHover = 1.0; };
    const mouseLeaveHandler = function() { targetHover = 0.0; };

    const touchMoveHandler = function(e) {
      if (e.touches && e.touches[0]) onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const touchStartHandler = function(e) {
      if (e.touches && e.touches[0]) {
        targetHover = 1.0;
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const touchEndHandler = function() { targetHover = 0.0; };

    container.addEventListener('mousemove', mouseMoveHandler, { passive: true });
    container.addEventListener('mouseenter', mouseEnterHandler, { passive: true });
    container.addEventListener('mouseleave', mouseLeaveHandler, { passive: true });
    container.addEventListener('touchmove', touchMoveHandler, { passive: true });
    container.addEventListener('touchstart', touchStartHandler, { passive: true });
    container.addEventListener('touchend', touchEndHandler, { passive: true });

    const scrollHandler = function() {
      targetScrollY = window.scrollY || window.pageYOffset || 0;
    };
    window.addEventListener('scroll', scrollHandler, { passive: true });

    function resize() {
      const width = container.clientWidth || canvas.clientWidth;
      const height = container.clientHeight || canvas.clientHeight;
      if (!width || !height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const renderW = Math.floor(width * dpr);
      const renderH = Math.floor(height * dpr);
      if (canvas.width !== renderW || canvas.height !== renderH) {
        canvas.width = renderW;
        canvas.height = renderH;
        gl.viewport(0, 0, renderW, renderH);
      }
    }

    window.addEventListener('resize', resize, { passive: true });
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(resize);
      ro.observe(container);
    }
    resize();

    // IntersectionObserver to pause rendering when offscreen
    let io = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          isVisible = entry.isIntersecting;
        });
      }, { threshold: 0.01 });
      io.observe(container);
    }

    const startTime = performance.now();

    function render() {
      // Self-cleanup if canvas was removed by React
      if (!document.body.contains(canvas)) {
        cleanup();
        return;
      }

      if (isVisible) {
        resize();
        const elapsed = (performance.now() - startTime) * 0.001;

        mouseX += (targetMouseX - mouseX) * 0.08;
        mouseY += (targetMouseY - mouseY) * 0.08;
        hover += (targetHover - hover) * 0.06;
        scrollY += (targetScrollY - scrollY) * 0.1;

        gl.useProgram(program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(uTexture, 0);

        gl.uniform1f(uTime, elapsed);
        gl.uniform2f(uMouse, mouseX, mouseY);
        gl.uniform1f(uHover, hover);
        gl.uniform2f(uResolution, canvas.width, canvas.height);
        gl.uniform1f(uScroll, scrollY);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      rafId = requestAnimationFrame(render);
    }

    rafId = requestAnimationFrame(render);

    function cleanup() {
      if (rafId) cancelAnimationFrame(rafId);
      container.removeEventListener('mousemove', mouseMoveHandler);
      container.removeEventListener('mouseenter', mouseEnterHandler);
      container.removeEventListener('mouseleave', mouseLeaveHandler);
      container.removeEventListener('touchmove', touchMoveHandler);
      container.removeEventListener('touchstart', touchStartHandler);
      container.removeEventListener('touchend', touchEndHandler);
      window.removeEventListener('scroll', scrollHandler);
      window.removeEventListener('resize', resize);
      if (io) io.disconnect();
      activeInstances.delete(canvas);
      canvas.__liquidSilkInit = false;
    }

    canvas.__liquidSilkCleanup = cleanup;
    activeInstances.add(canvas);
  }

  function initAllLiquidSilk() {
    const selector = '#liquid-silk-canvas, .liquid-silk-canvas, canvas[data-liquid-silk], [id*="liquid-silk-canvas"]';
    const canvases = document.querySelectorAll(selector);
    canvases.forEach(function(canvas) {
      if (!canvas.__liquidSilkInit) {
        initCanvas(canvas);
      }
    });
  }

  // Export globals
  window.initLiquidSilk = initAllLiquidSilk;
  window.initLiquidSilkCanvas = initCanvas;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllLiquidSilk);
  } else {
    initAllLiquidSilk();
  }
  window.addEventListener('load', initAllLiquidSilk);

  // Persistent MutationObserver to automatically bind canvases whenever React mounts or swaps routes
  let debounceTimer = null;
  const observer = new MutationObserver(function() {
    if (debounceTimer) return;
    debounceTimer = setTimeout(function() {
      debounceTimer = null;
      initAllLiquidSilk();
    }, 40);
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }
})();
