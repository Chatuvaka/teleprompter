import vibrator from '@system.vibrator';

export default {
  data: {
    currentTime: '10:00',
    currentSlide: 1,
    totalSlides: 1,
    slideTitle: 'Esperando diapositivas...',
    speakerNotes: 'Conecta el reloj al teléfono o simulador para ver tus notas de orador en tiempo real.',
    isAutoScrolling: false,
    fontSize: 22,
    timerClock: null,
    scrollTimer: null
  },

  onInit() {
    this.updateClock();
    this.timerClock = setInterval(() => {
      this.updateClock();
    }, 10000);

    // Inicializar canal de escucha P2P con el teléfono Android
    this.initP2pListener();
  },

  onDestroy() {
    if (this.timerClock) clearInterval(this.timerClock);
    if (this.scrollTimer) clearInterval(this.scrollTimer);
  },

  updateClock() {
    const now = new Date();
    const h = (now.getHours() < 10 ? '0' : '') + now.getHours();
    const m = (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
    this.currentTime = `${h}:${m}`;
  },

  /**
   * Alerta háptica sutil de confirmación
   */
  triggerHaptic() {
    try {
      vibrator.vibrate({
        mode: 'short'
      });
    } catch (e) {
      console.log('Vibrator not supported in simulator: ' + e);
    }
  },

  /**
   * Envía comandos hacia el teléfono Android mediante el canal P2P
   */
  sendCommandToPhone(action) {
    this.triggerHaptic();
    const payload = JSON.stringify({ action: action });
    console.log('[WATCH -> PHONE] Enviando comando: ' + payload);

    // Enviar a través de la API Wear Engine si está en dispositivo físico
    if (typeof wearEngine !== 'undefined' && wearEngine.send) {
      wearEngine.send({
        data: payload,
        success: () => console.log('Comando enviado con éxito'),
        fail: (err) => console.log('Error enviando comando: ' + err)
      });
    }
  },

  /**
   * Escucha mensajes del teléfono con las notas de orador
   */
  initP2pListener() {
    if (typeof wearEngine !== 'undefined' && wearEngine.onReceive) {
      wearEngine.onReceive((data) => {
        try {
          const payload = JSON.parse(data);
          this.handleIncomingPayload(payload);
        } catch (e) {
          console.log('Error parseando payload de teléfono: ' + e);
        }
      });
    }
  },

  /**
   * Actualiza la UI del teleprompter con las notas recibidas
   */
  handleIncomingPayload(payload) {
    if (payload.current_slide) {
      if (this.currentSlide !== payload.current_slide) {
        this.triggerHaptic();
        // Reset scroll al inicio
        const scrollElem = this.$element('prompterScroll');
        if (scrollElem && scrollElem.scrollTo) {
          scrollElem.scrollTo({ position: 0 });
        }
      }
      this.currentSlide = payload.current_slide;
    }
    if (payload.total_slides) this.totalSlides = payload.total_slides;
    if (payload.title) this.slideTitle = payload.title;
    if (payload.notes) this.speakerNotes = payload.notes;
  },

  /**
   * Gestos Swipe para avanzar o retroceder diapositiva sin mirar
   */
  handleSwipe(e) {
    if (e.direction === 'left') {
      // Swipe hacia la izquierda: Siguiente diapositiva
      this.onNextSlide();
    } else if (e.direction === 'right') {
      // Swipe hacia la derecha: Diapositiva anterior
      this.onPrevSlide();
    }
  },

  onNextSlide() {
    this.sendCommandToPhone('NEXT_SLIDE');
  },

  onPrevSlide() {
    this.sendCommandToPhone('PREV_SLIDE');
  },

  /**
   * Control mediante la corona giratoria (Digital Crown)
   */
  handleKeyEvent(e) {
    // Código de corona giratoria en Lite Wearable (Rotary Event / KeyCode 24 o 25)
    const scrollElem = this.$element('prompterScroll');
    if (!scrollElem) return;

    if (e.code === 261 || e.code === 24) {
      // Giro hacia arriba
      scrollElem.scrollBy({ dy: -30 });
    } else if (e.code === 262 || e.code === 25) {
      // Giro hacia abajo
      scrollElem.scrollBy({ dy: 30 });
    }
  },

  /**
   * Alternar auto-scroll del teleprompter
   */
  toggleAutoScroll() {
    this.triggerHaptic();
    this.isAutoScrolling = !this.isAutoScrolling;

    if (this.isAutoScrolling) {
      this.scrollTimer = setInterval(() => {
        const scrollElem = this.$element('prompterScroll');
        if (scrollElem) {
          scrollElem.scrollBy({ dy: 6 });
        }
      }, 100);
    } else {
      if (this.scrollTimer) clearInterval(this.scrollTimer);
    }
  },

  increaseFont() {
    if (this.fontSize < 30) {
      this.fontSize += 2;
    }
  },

  decreaseFont() {
    if (this.fontSize > 16) {
      this.fontSize -= 2;
    }
  }
};
