/* Reusable, dependency-free video scrubbing component for the static portfolio. */
(() => {
  'use strict';

  const clamp01 = value => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  const validDuration = video => Number.isFinite(video.duration) && video.duration > 0;

  class CursorScrubVideo {
    constructor(root, options = {}) {
      if (!root) throw new TypeError('CursorScrubVideo requires a root element.');
      this.root = root;
      this.options = {
        videoFile: '', axis: 'horizontal', reverse: false, trackingArea: 'component',
        smoothing: 0.22, objectFit: 'cover', showPoster: true, borderRadius: 0,
        poster: '', staticOnTouch: true, ...options
      };
      this.targetTime = 0;
      this.smoothedTime = 0;
      this.seeking = false;
      this.ready = false;
      this.rafId = 0;
      this.ownedObjectUrl = '';
      this.posterFailed = false;
      this.sourceInitialized = false;
      this.disposed = false;
      this.mediaQueryMotion = matchMedia('(prefers-reduced-motion: reduce)');
      this.mediaQueryHover = matchMedia('(hover: none)');

      this.poster = document.createElement('img');
      this.poster.className = 'cursor-scrub-poster';
      this.poster.alt = '';
      this.poster.setAttribute('aria-hidden', 'true');
      this.poster.decoding = 'async';
      this.poster.loading = 'eager';
      this.poster.fetchPriority = 'high';

      this.video = document.createElement('video');
      this.video.className = 'cursor-scrub-video-frame';
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.preload = 'auto';
      this.video.disableRemotePlayback = true;
      this.video.setAttribute('muted', '');
      this.video.setAttribute('playsinline', '');
      this.video.setAttribute('preload', 'auto');
      this.video.setAttribute('disableRemotePlayback', '');
      this.video.controls = false;
      this.video.loop = false;
      this.video.autoplay = false;

      this.emptyMessage = document.createElement('span');
      this.emptyMessage.className = 'cursor-scrub-empty';
      this.emptyMessage.textContent = 'Add a video file';
      this.emptyMessage.setAttribute('aria-hidden', 'true');
      this.root.replaceChildren(this.poster, this.video, this.emptyMessage);

      this._onPointerMove = event => this._readPointer(event);
      this._onSeeking = () => { this.seeking = true; };
      this._onSeeked = () => {
        this.seeking = false;
        if (validDuration(this.video)) this.smoothedTime = this.video.currentTime;
        if (this._shouldTrack() && validDuration(this.video) && Math.abs(this.targetTime - this.video.currentTime) > 0.008) this._schedule();
      };
      this._onMetadata = () => {
        if (!validDuration(this.video)) return;
        this.video.currentTime = 0;
        this.targetTime = this.smoothedTime = 0;
      };
      this._onCanPlayThrough = () => {
        if (this.disposed) return;
        this.ready = validDuration(this.video);
        if (!this.ready) return;
        this.video.pause();
        this.video.currentTime = 0;
        this.targetTime = this.smoothedTime = 0;
        if (this.mediaQueryMotion.matches || (this.options.staticOnTouch && this.mediaQueryHover.matches)) {
          this.video.style.opacity = '0';
          this._showPosterOrEmpty();
          this.root.dataset.scrubState = 'static';
          return;
        }
        this.root.dataset.scrubState = 'ready';
        this._showVideoFrame();
        if (this.lastPointer) this._readPointer(this.lastPointer);
      };
      this._onError = () => {
        if (!this.video.getAttribute('src')) return;
        if (this.canPlayTimer) window.clearTimeout(this.canPlayTimer);
        this.ready = false;
        this.seeking = false;
        this._cancelFrame();
        this.video.pause();
        this.root.dataset.scrubState = this.options.poster ? 'poster-error' : 'error';
        this._showPosterOrEmpty();
        this._diagnostic('Cursor video could not be loaded; using the poster fallback.');
      };
      this._onPosterError = () => {
        this.posterFailed = true;
        this.root.dataset.scrubState = 'poster-error';
        this.emptyMessage.textContent = 'Add a video file';
        this.emptyMessage.style.display = 'grid';
        this._diagnostic('The configured character still could not be loaded.');
      };
      this._onVisibility = () => {
        if (document.hidden) {
          this._cancelFrame();
          this.video.pause();
        } else if (this._shouldTrack() && this.ready && Math.abs(this.targetTime - this.video.currentTime) > 0.008) {
          this._schedule();
        }
      };
      this._onMotionChange = () => this._refreshMotionMode();
      this._onHoverChange = () => this._refreshMotionMode();

      this._listen(this.video, 'loadedmetadata', this._onMetadata);
      this._listen(this.video, 'canplaythrough', this._onCanPlayThrough);
      this._listen(this.video, 'seeking', this._onSeeking);
      this._listen(this.video, 'seeked', this._onSeeked);
      this._listen(this.video, 'error', this._onError);
      this._listen(this.poster, 'error', this._onPosterError);
      this._listen(document, 'visibilitychange', this._onVisibility);
      this._listen(this.mediaQueryMotion, 'change', this._onMotionChange);
      this._listen(this.mediaQueryHover, 'change', this._onHoverChange);
      this._applyPresentation();
      this._refreshMotionMode();
    }

    _listen(target, type, listener, options) {
      if (typeof target.addEventListener === 'function') {
        target.addEventListener(type, listener, options);
        (this.listeners ||= []).push([target, type, listener, false]);
      } else if (typeof target.addListener === 'function') {
        target.addListener(listener);
        (this.listeners ||= []).push([target, type, listener, true]);
      }
    }

    _diagnostic(message) {
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || new URLSearchParams(location.search).has('debug')) console.warn(`[CursorScrubVideo] ${message}`);
    }

    _sourceUrl(source) {
      if (source instanceof Blob) {
        this.ownedObjectUrl = URL.createObjectURL(source);
        return this.ownedObjectUrl;
      }
      return typeof source === 'string' ? source.trim() : '';
    }

    _refreshMotionMode() {
      if (this.disposed) return;
      const staticMode = this.mediaQueryMotion.matches || (this.options.staticOnTouch && this.mediaQueryHover.matches);
      if (staticMode) {
        this._unbindTracking();
        this._cancelFrame();
        this.video.pause();
        this.video.style.opacity = '0';
        this._showPosterOrEmpty();
        this.root.dataset.scrubState = 'static';
        return;
      }
      if (!this.options.videoFile) {
        this._unbindTracking();
        if (!this.sourceInitialized) this._loadSource();
        return;
      }
      this._bindTracking();
      if (this.ready) {
        this.video.style.opacity = '1';
        this.poster.style.opacity = '0';
      } else if (!this.sourceInitialized) {
        this._loadSource();
      }
    }

    _loadSource() {
      this.sourceInitialized = true;
      const source = this._sourceUrl(this.options.videoFile);
      if (!source) {
        this.ready = false;
        this.root.dataset.scrubState = this.options.poster ? 'poster-only' : 'empty';
        this._showPosterOrEmpty();
        return;
      }
      this.video.src = source;
      if (this.options.poster) this.video.poster = this.options.poster;
      this.video.load();
      this.root.dataset.scrubState = 'loading';
      this._showPosterOrEmpty();
      try {
        const priming = this.video.play();
        if (priming && typeof priming.then === 'function') {
          priming.then(() => {
            this.video.pause();
            if (!this.ready && validDuration(this.video)) this.video.currentTime = 0;
          }).catch(() => { /* Autoplay is often blocked; loading and seeking still work. */ });
        } else {
          this.video.pause();
        }
      } catch {
        this.video.pause();
      }
      this.canPlayTimer = window.setTimeout(() => {
        if (!this.ready && !this.disposed) this._diagnostic('canplaythrough has not fired; cursor scrubbing remains disabled and the poster stays visible.');
      }, 12000);
    }

    _applyPresentation() {
      const fit = ['cover', 'contain', 'fill'].includes(this.options.objectFit) ? this.options.objectFit : 'cover';
      const radius = Number.isFinite(Number(this.options.borderRadius)) ? Math.max(0, Number(this.options.borderRadius)) : 0;
      this.root.style.setProperty('--cursor-scrub-fit', fit);
      this.root.style.setProperty('--cursor-scrub-radius', `${radius}px`);
      this.root.dataset.axis = this.options.axis === 'vertical' ? 'vertical' : 'horizontal';
    }

    _showPosterOrEmpty() {
      const poster = String(this.options.poster || '').trim();
      if (poster) {
        this.emptyMessage.textContent = 'Add a video file';
        let absolutePoster = poster;
        try { absolutePoster = new URL(poster, document.baseURI).href; } catch { /* Let the image error event activate the fallback message. */ }
        if (this.poster.src !== absolutePoster) this.poster.src = poster;
        this.poster.style.opacity = this.options.showPoster ? '1' : '0';
        this.emptyMessage.style.display = this.posterFailed ? 'grid' : 'none';
      } else {
        this.poster.removeAttribute('src');
        this.poster.style.opacity = '0';
      }
      this.emptyMessage.style.display = poster ? 'none' : 'grid';
    }

    _showVideoFrame() {
      this._showPosterOrEmpty();
      this.video.style.opacity = '1';
      this.poster.style.opacity = '0';
      this.emptyMessage.style.display = 'none';
      if (this.canPlayTimer) window.clearTimeout(this.canPlayTimer);
    }

    _bindTracking() {
      this._unbindTracking();
      if (this.options.trackingArea === 'window') this._listen(window, 'pointermove', this._onPointerMove, { passive: true });
      else this._listen(this.root, 'pointermove', this._onPointerMove, { passive: true });
    }

    _unbindTracking() {
      for (const [target, type, listener, legacy] of this.listeners || []) {
        if ((target === window || target === this.root) && type === 'pointermove') legacy ? target.removeListener(listener) : target.removeEventListener(type, listener);
      }
      this.listeners = (this.listeners || []).filter(([target, type]) => !((target === window || target === this.root) && type === 'pointermove'));
    }

    _readPointer(event) {
      this.lastPointer = { clientX: event.clientX, clientY: event.clientY };
      if (!this.ready || !validDuration(this.video)) return;
      let normalized;
      if (this.options.trackingArea === 'window') {
        const dimension = this.options.axis === 'vertical' ? window.innerHeight : window.innerWidth;
        if (!Number.isFinite(dimension) || dimension <= 0) return;
        normalized = (this.options.axis === 'vertical' ? event.clientY : event.clientX) / dimension;
      } else {
        const rect = this.root.getBoundingClientRect();
        const dimension = this.options.axis === 'vertical' ? rect.height : rect.width;
        if (!Number.isFinite(dimension) || dimension <= 0) return;
        normalized = ((this.options.axis === 'vertical' ? event.clientY - rect.top : event.clientX - rect.left) / dimension);
      }
      const position = clamp01(this.options.reverse ? 1 - normalized : normalized);
      const time = position * this.video.duration;
      if (!Number.isFinite(time)) return;
      this.targetTime = time;
      this._schedule();
    }

    _shouldTrack() {
      return !this.disposed && !document.hidden && !this.mediaQueryMotion.matches && this.ready;
    }

    _schedule() {
      if (!this._shouldTrack() || this.rafId) return;
      this.rafId = requestAnimationFrame(() => this._tick());
    }

    _tick() {
      this.rafId = 0;
      if (!this._shouldTrack() || this.seeking || !validDuration(this.video)) return;
      const smoothing = Math.max(0.02, Math.min(1, Number(this.options.smoothing) || 0.22));
      let next = this.smoothedTime + (this.targetTime - this.smoothedTime) * smoothing;
      if (Math.abs(this.targetTime - next) < 0.008) next = this.targetTime;
      if (!Number.isFinite(next)) return;
      if (Math.abs(this.video.currentTime - next) > 0.008) {
        this.seeking = true;
        this.smoothedTime = next;
        try { this.video.currentTime = next; }
        catch (error) { this.seeking = false; this._diagnostic(`Could not seek this frame: ${error.message}`); }
      } else {
        this.smoothedTime = next;
        if (Math.abs(this.targetTime - next) > 0.008) this._schedule();
      }
    }

    update(nextOptions = {}) {
      const previousSource = this.options.videoFile;
      const previousPoster = this.options.poster;
      this.options = { ...this.options, ...nextOptions };
      this._applyPresentation();
      if (previousSource !== this.options.videoFile || previousPoster !== this.options.poster) {
        this._disposeSource();
        if(previousPoster !== this.options.poster) this.posterFailed = false;
        this.sourceInitialized = false;
        this.ready = false;
        this.video.style.opacity = '0';
        this._refreshMotionMode();
      } else {
        this._refreshMotionMode();
        this._showPosterOrEmpty();
      }
    }

    _cancelFrame() {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }

    _disposeSource() {
      if (this.canPlayTimer) window.clearTimeout(this.canPlayTimer);
      this.video.pause();
      this.video.removeAttribute('src');
      this.video.load();
      this.ready = false;
      this.seeking = false;
      this.sourceInitialized = false;
      if (this.ownedObjectUrl) URL.revokeObjectURL(this.ownedObjectUrl);
      this.ownedObjectUrl = '';
    }

    destroy() {
      if (this.disposed) return;
      this.disposed = true;
      this._cancelFrame();
      this._disposeSource();
      for (const [target, type, listener, legacy] of this.listeners || []) legacy ? target.removeListener(listener) : target.removeEventListener(type, listener);
      this.listeners = [];
      if (this.root.cursorScrubVideo === this) delete this.root.cursorScrubVideo;
      this.root.dataset.scrubState = 'destroyed';
    }
  }

  window.CursorScrubVideo = CursorScrubVideo;
  window.mountCursorScrubVideos = () => {
    document.querySelectorAll('[data-cursor-scrub]').forEach(root => {
      if (root.cursorScrubVideo) return;
      root.cursorScrubVideo = new CursorScrubVideo(root, {
        videoFile: root.dataset.videoFile || '',
        poster: root.dataset.poster || '',
        axis: root.dataset.axis || 'horizontal',
        reverse: root.dataset.reverse === 'true',
        trackingArea: root.dataset.trackingArea || 'component',
        smoothing: Number(root.dataset.smoothing) || 0.22,
        objectFit: root.dataset.objectFit || 'contain',
        showPoster: root.dataset.showPoster !== 'false',
        borderRadius: Number(root.dataset.borderRadius) || 0,
        staticOnTouch: root.dataset.staticOnTouch !== 'false'
      });
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', window.mountCursorScrubVideos, { once: true });
  else window.mountCursorScrubVideos();
})();
