/**
 * Huawei Watch Fit 3 - Teleprompter & PowerPoint Remote
 * Cliente WebSocket y Controlador del Simulador
 */

(function () {
  // Elementos DOM
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const globalStatusPill = document.getElementById('globalStatusPill');
  const watchClock = document.getElementById('watchClock');
  const currentSlideNum = document.getElementById('currentSlideNum');
  const totalSlidesNum = document.getElementById('totalSlidesNum');
  const slideTitle = document.getElementById('slideTitle');
  const teleprompterViewport = document.getElementById('teleprompterViewport');
  const teleprompterContent = document.getElementById('teleprompterContent');
  const hapticFlash = document.getElementById('hapticFlash');
  const digitalCrown = document.getElementById('digitalCrown');
  const btnToggleScroll = document.getElementById('btnToggleScroll');
  const scrollIcon = document.getElementById('scrollIcon');
  const speedBadge = document.getElementById('speedBadge');
  const btnFontDec = document.getElementById('btnFontDec');
  const btnFontInc = document.getElementById('btnFontInc');
  const touchPrev = document.getElementById('touchPrev');
  const touchNext = document.getElementById('touchNext');
  const btnToolbarPrev = document.getElementById('btnToolbarPrev');
  const btnToolbarNext = document.getElementById('btnToolbarNext');
  const btnTogglePresentation = document.getElementById('btnTogglePresentation');
  const txtPresentationMode = document.getElementById('txtPresentationMode');
  const btnFullscreen = document.getElementById('btnFullscreen');

  // Estado de la aplicación
  let socket = null;
  let isConnected = false;
  let isFullscreenPresentation = false;
  let currentSlide = 1;
  let totalSlides = 1;
  let fontSize = 21; // px inicial
  let isAutoScrolling = false;
  let scrollSpeedIdx = 0;
  const scrollSpeeds = [1.0, 1.5, 2.0];
  let scrollAnimFrame = null;
  let lastScrollTime = 0;

  // Actualizar reloj del smartwatch
  function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    if (watchClock) watchClock.textContent = `${hours}:${minutes}`;
  }
  setInterval(updateClock, 1000);
  updateClock();

  // Feedback háptico (físico en móvil y visual en pantalla)
  function triggerHaptic(pattern = [40]) {
    // 1. Vibración física en teléfonos Android / navegadores móviles
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignorar si el navegador bloquea vibración sin interacción previa
      }
    }

    // 2. Feedback visual instantáneo
    if (hapticFlash) {
      hapticFlash.classList.add('flash-active');
      setTimeout(() => {
        hapticFlash.classList.remove('flash-active');
      }, 120);
    }
  }

  // Conexión WebSocket con reconexión automática
  function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    console.log('[WS] Conectando a', wsUrl);
    statusText.textContent = 'Conectando...';
    statusDot.className = 'status-dot disconnected';

    socket = new WebSocket(wsUrl);

    socket.onopen = function () {
      console.log('[WS] Conexión establecida con éxito');
      isConnected = true;
      statusDot.className = 'status-dot connected';
      statusText.textContent = 'En Línea (PPT Sync)';
    };

    socket.onmessage = function (event) {
      try {
        const data = JSON.parse(event.data);
        handleServerPayload(data);
      } catch (err) {
        console.error('[WS] Error al parsear mensaje:', err);
      }
    };

    socket.onclose = function () {
      console.warn('[WS] Conexión cerrada. Reintentando en 2 segundos...');
      isConnected = false;
      statusDot.className = 'status-dot disconnected';
      statusText.textContent = 'Reconectando...';
      setTimeout(connectWebSocket, 2000);
    };

    socket.onerror = function (error) {
      console.error('[WS] Error de socket:', error);
      socket.close();
    };
  }

  // Enviar comando al servidor
  function sendCommand(action, extra = {}) {
    triggerHaptic([35]);
    if (socket && socket.readyState === WebSocket.OPEN) {
      const payload = Object.assign({ action: action }, extra);
      socket.send(JSON.stringify(payload));
    } else {
      console.warn('[WS] Socket no conectado. Acción ignorada:', action);
    }
  }

  // Procesar estado recibido desde el servidor
  function handleServerPayload(data) {
    console.log('[STATUS UPDATE]', data);

    const prevSlide = currentSlide;
    currentSlide = data.current_slide || 1;
    totalSlides = data.total_slides || 1;
    isFullscreenPresentation = !!data.is_fullscreen;

    // Actualizar badges
    currentSlideNum.textContent = currentSlide;
    totalSlidesNum.textContent = totalSlides;

    // Título de la diapositiva
    slideTitle.textContent = data.title || `Diapositiva ${currentSlide}`;

    // Notas de orador (Teleprompter)
    const rawNotes = data.notes || 'Sin notas de orador.';
    formatTeleprompterText(rawNotes);

    // Si cambió de diapositiva, feedback háptico doble y reset de scroll
    if (prevSlide !== currentSlide) {
      triggerHaptic([50, 40, 50]);
      teleprompterViewport.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Modo de presentación en botón
    if (txtPresentationMode) {
      txtPresentationMode.textContent = isFullscreenPresentation ? 'Esc Salir' : 'F5 Proyectar';
    }
  }

  // Formato visual y legible de notas en teleprompter
  function formatTeleprompterText(text) {
    const paragraphs = text
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (paragraphs.length === 0) {
      teleprompterContent.innerHTML = '<p style="color: rgba(255,255,255,0.4); font-style: italic;">Sin notas para esta diapositiva.</p>';
      return;
    }

    teleprompterContent.innerHTML = paragraphs
      .map(p => `<p>${escapeHtml(p)}</p>`)
      .join('');
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Control de tamaño de fuente
  btnFontInc.addEventListener('click', () => {
    if (fontSize < 36) {
      fontSize += 2;
      teleprompterContent.style.fontSize = `${fontSize}px`;
    }
  });

  btnFontDec.addEventListener('click', () => {
    if (fontSize > 14) {
      fontSize -= 2;
      teleprompterContent.style.fontSize = `${fontSize}px`;
    }
  });

  // Auto-Scroll Logic
  function toggleAutoScroll() {
    isAutoScrolling = !isAutoScrolling;
    if (isAutoScrolling) {
      btnToggleScroll.classList.add('active');
      scrollIcon.textContent = '❚❚';
      lastScrollTime = performance.now();
      scrollAnimFrame = requestAnimationFrame(autoScrollLoop);
    } else {
      btnToggleScroll.classList.remove('active');
      scrollIcon.textContent = '▶';
      if (scrollAnimFrame) cancelAnimationFrame(scrollAnimFrame);
    }
  }

  function autoScrollLoop(now) {
    if (!isAutoScrolling) return;

    const delta = (now - lastScrollTime) / 1000;
    lastScrollTime = now;

    // Velocidad base: 26 px por segundo * multiplicador
    const pixels = 26 * scrollSpeeds[scrollSpeedIdx] * delta;
    teleprompterViewport.scrollTop += pixels;

    // Detener al llegar al final
    const maxScroll = teleprompterViewport.scrollHeight - teleprompterViewport.clientHeight;
    if (teleprompterViewport.scrollTop >= maxScroll - 2) {
      toggleAutoScroll();
      return;
    }

    scrollAnimFrame = requestAnimationFrame(autoScrollLoop);
  }

  btnToggleScroll.addEventListener('click', toggleAutoScroll);

  speedBadge.addEventListener('click', () => {
    scrollSpeedIdx = (scrollSpeedIdx + 1) % scrollSpeeds.length;
    speedBadge.textContent = `${scrollSpeeds[scrollSpeedIdx]}x`;
  });

  // Simulación de Corona Digital mediante rueda del ratón
  function handleCrownScroll(deltaY) {
    teleprompterViewport.scrollTop += deltaY * 0.8;
    // Efecto visual de rotación en la corona
    if (digitalCrown) {
      digitalCrown.style.transform = `scale(0.97)`;
      setTimeout(() => (digitalCrown.style.transform = ''), 60);
    }
  }

  digitalCrown.addEventListener('wheel', (e) => {
    e.preventDefault();
    handleCrownScroll(e.deltaY);
  }, { passive: false });

  teleprompterViewport.addEventListener('wheel', (e) => {
    // Si la rueda se usa sobre el texto, scroll natural suave
    handleCrownScroll(e.deltaY * 0.5);
  });

  // Zonas de toque en los bordes
  touchPrev.addEventListener('click', () => sendCommand('PREV_SLIDE'));
  touchNext.addEventListener('click', () => sendCommand('NEXT_SLIDE'));
  btnToolbarPrev.addEventListener('click', () => sendCommand('PREV_SLIDE'));
  btnToolbarNext.addEventListener('click', () => sendCommand('NEXT_SLIDE'));

  // Alternar proyección F5
  btnTogglePresentation.addEventListener('click', () => {
    if (isFullscreenPresentation) {
      sendCommand('EXIT_PRESENTATION');
    } else {
      sendCommand('START_PRESENTATION');
    }
  });

  // Pantalla completa del navegador
  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // Gestos táctiles (Swipes para móviles)
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  teleprompterViewport.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    }
  }, { passive: true });

  teleprompterViewport.addEventListener('touchend', (e) => {
    if (e.changedTouches.length === 1) {
      const deltaX = e.changedTouches[0].clientX - touchStartX;
      const deltaY = e.changedTouches[0].clientY - touchStartY;
      const elapsed = Date.now() - touchStartTime;

      // Si es un swipe horizontal neto rápido (< 400ms y > 60px)
      if (elapsed < 450 && Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        if (deltaX < 0) {
          // Swipe hacia la izquierda -> Siguiente
          sendCommand('NEXT_SLIDE');
        } else {
          // Swipe hacia la derecha -> Anterior
          sendCommand('PREV_SLIDE');
        }
      }
    }
  }, { passive: true });

  // Atajos de Teclado de Presentador
  window.addEventListener('keydown', (e) => {
    // Ignorar si el foco está en un input
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    switch (e.key) {
      case 'ArrowRight':
      case 'PageDown':
      case ' ': // Barra espaciadora
        e.preventDefault();
        sendCommand('NEXT_SLIDE');
        break;

      case 'ArrowLeft':
      case 'PageUp':
      case 'Backspace':
        e.preventDefault();
        sendCommand('PREV_SLIDE');
        break;

      case 'F5':
        e.preventDefault();
        sendCommand('START_PRESENTATION');
        break;

      case 'Escape':
        sendCommand('EXIT_PRESENTATION');
        break;

      case 'p':
      case 'P':
        toggleAutoScroll();
        break;

      case '+':
      case '=':
        btnFontInc.click();
        break;

      case '-':
        btnFontDec.click();
        break;
    }
  });

  // Iniciar conexión WebSocket
  connectWebSocket();
})();
