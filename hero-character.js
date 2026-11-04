(() => {
  const root = document.querySelector('[data-hero-character]');
  if (!root) return;

  const hero = root.closest('.hero');
  const canvas = root.querySelector('.hero-character-canvas');
  const fallback = root.querySelector('.hero-character-fallback');
  const message = root.querySelector('.hero-reaction-text');
  const hello = root.querySelector('.hero-say-hello');
  const context = canvas.getContext('2d', { alpha: true });
  const sequences = window.umarHeroSequences || {};
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const images = new Map();
  const messages = {
    idle: 'Currently building something interesting.',
    lookLeft: "Someone’s over here?",
    lookRight: "Hey, who’s over there?",
    noticeVisitor: "Hey, it’s you!",
    removeHeadset: "Hi! I’m Umar.",
    wave: 'Welcome to my portfolio.',
    pointDown: "Come see what I’ve built.",
    returnToIdle: 'Currently building something interesting.'
  };
  let visible = true;
  let active = !document.hidden;
  let running = false;
  let currentZone = null;
  let pendingZone = null;
  let zoneTimer = 0;
  let frame = 0;
  let token = 0;
  let cooldownUntil = 0;
  let idleStart = 0;
  let pendingResolve = null;
  let reducedGreetingTimer = 0;
  let frameDimensions = null;
  let queuedZone = null;

  const sequenceFrames = state => {
    const configured = sequences[state]?.frames;
    if (!Array.isArray(configured)) return [];
    const seen = new Set();
    return configured.filter(url => {
      if (typeof url !== 'string' || !url.trim() || seen.has(url)) return false;
      seen.add(url);
      return true;
    });
  };

  const setMessage = state => {
    if (message.textContent === messages[state]) return;
    message.classList.remove('is-visible');
    window.setTimeout(() => {
      if (root.dataset.heroState === state) {
        message.textContent = messages[state];
        message.classList.add('is-visible');
      }
    }, 120);
  };
  const setState = state => {
    root.dataset.heroState = state;
    setMessage(state);
  };
  message.classList.add('is-visible');

  const loadImage = url => {
    if (!images.has(url)) {
      images.set(url, new Promise(resolve => {
        const image = new Image();
        image.decoding = 'async';
        image.onload = async () => {
          try { await image.decode(); } catch { /* onload already confirms usable pixels */ }
          resolve(image.naturalWidth && image.naturalHeight ? image : null);
        };
        image.onerror = () => resolve(null);
        image.src = url;
      }));
    }
    return images.get(url);
  };
  const draw = image => {
    if (!image || !context) return;
    const { width, height } = canvas;
    const dimensions = `${image.naturalWidth}x${image.naturalHeight}`;
    frameDimensions ??= dimensions;
    if (dimensions !== frameDimensions) return;
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    context.clearRect(0, 0, width, height);
    context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
    root.classList.add('has-frames');
  };
  const loadSequence = async state => {
    const urls = sequenceFrames(state);
    if (!urls.length || !context) return [];
    const loaded = await Promise.all(urls.map(loadImage));
    // A partial or mixed-size sequence could jump or flash. Keep the known good visual instead.
    if (!loaded.every(Boolean)) return [];
    const dimensions = loaded.map(image => `${image.naturalWidth}x${image.naturalHeight}`);
    return dimensions.every(value => value === dimensions[0]) ? loaded : [];
  };
  const sleep = (ms, runToken) => new Promise(resolve => {
    pendingResolve = resolve;
    const start = performance.now();
    const tick = now => {
      if (runToken !== token || !active || !visible) { pendingResolve = null; return resolve(false); }
      if (now - start >= ms) { pendingResolve = null; return resolve(true); }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  });
  const play = async (state, runToken) => {
    setState(state);
    const loaded = await loadSequence(state);
    if (runToken !== token || !active || !visible) return false;
    if (!loaded.length) return true;
    const fps = Math.max(1, Math.min(30, sequences[state].fps || 12));
    const duration = loaded.length * 1000 / fps;
    const start = performance.now();
    return new Promise(resolve => {
      pendingResolve = resolve;
      const tick = now => {
        if (runToken !== token || !active || !visible) { pendingResolve = null; return resolve(false); }
        const index = Math.min(loaded.length - 1, Math.floor((now - start) * fps / 1000));
        draw(loaded[index]);
        if (now - start >= duration) { pendingResolve = null; return resolve(true); }
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
  };
  const showIdle = async () => {
    setState('idle');
    const runToken = token;
    const loaded = await loadSequence('idle');
    if (runToken !== token || !active || !visible) return;
    if (!loaded.length) {
      root.classList.remove('has-frames');
      return;
    }
    idleStart = performance.now();
    const fps = Math.max(1, Math.min(24, sequences.idle.fps || 8));
    const tick = now => {
      if (runToken !== token || running || !active || !visible || reduceMotion.matches) return;
      const index = sequences.idle.loop ? Math.floor((now - idleStart) * fps / 1000) % loaded.length : 0;
      draw(loaded[index]);
      frame = requestAnimationFrame(tick);
    };
    if (reduceMotion.matches) draw(loaded[0]);
    else frame = requestAnimationFrame(tick);
  };
  const react = async zone => {
    if (running) {
      const centerStates = ['noticeVisitor', 'removeHeadset', 'wave', 'pointDown'];
      if (!centerStates.includes(root.dataset.heroState)) queuedZone = zone;
      return;
    }
    if (!active || !visible || performance.now() < cooldownUntil) return;
    running = true;
    cancelAnimationFrame(frame);
    const runToken = ++token;
    currentZone = zone;
    const steps = zone === 'center'
      ? ['noticeVisitor', 'removeHeadset', 'wave', 'pointDown']
      : [zone === 'left' ? 'lookLeft' : 'lookRight'];
    for (const step of steps) {
      if (!(await play(step, runToken))) break;
      if (zone === 'center' && !(await sleep(step === 'pointDown' ? 1800 : 950, runToken))) break;
    }
    if (runToken !== token) return;
    if (zone !== 'center') await sleep(2300, runToken);
    if (runToken !== token) return;
    await play('returnToIdle', runToken);
    if (runToken !== token) return;
    running = false;
    const nextZone = queuedZone;
    queuedZone = null;
    cooldownUntil = nextZone ? 0 : performance.now() + 1400;
    currentZone = null;
    showIdle();
    if (nextZone && nextZone !== zone) {
      currentZone = nextZone;
      window.setTimeout(() => react(nextZone), 20);
    }
  };
  const reset = () => {
    ++token;
    cancelAnimationFrame(frame);
    pendingResolve?.(false);
    pendingResolve = null;
    clearTimeout(reducedGreetingTimer);
    clearTimeout(zoneTimer);
    running = false;
    pendingZone = null;
    currentZone = null;
    queuedZone = null;
    root.classList.remove('has-frames');
    frameDimensions = null;
    setState('idle');
    if (active && visible) showIdle();
  };
  const updateActivity = () => {
    const next = !document.hidden && !reduceMotion.matches;
    if (active !== next) {
      active = next;
      reset();
    }
  };

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      const next = entries[0]?.isIntersecting ?? true;
      if (visible !== next) { visible = next; reset(); }
    }, { threshold: 0.05 }).observe(hero);
  }
  document.addEventListener('visibilitychange', updateActivity);
  reduceMotion.addEventListener?.('change', updateActivity);
  finePointer.addEventListener?.('change', reset);

  hero.addEventListener('pointermove', event => {
    if (!finePointer.matches || reduceMotion.matches || event.target.closest('a, button, nav')) return;
    const rect = hero.getBoundingClientRect();
    const fraction = (event.clientX - rect.left) / rect.width;
    const zone = fraction < .34 ? 'left' : fraction > .66 ? 'right' : 'center';
    if (zone === currentZone || zone === pendingZone) return;
    pendingZone = zone;
    clearTimeout(zoneTimer);
    zoneTimer = window.setTimeout(() => {
      currentZone = pendingZone;
      pendingZone = null;
      react(currentZone);
    }, 170);
  }, { passive: true });
  hero.addEventListener('pointerleave', () => {
    clearTimeout(zoneTimer);
    pendingZone = null;
    currentZone = null;
  });
  hello.addEventListener('click', () => {
    if (reduceMotion.matches) {
      clearTimeout(reducedGreetingTimer);
      setState('wave');
      reducedGreetingTimer = window.setTimeout(() => setState('idle'), 1800);
      return;
    }
    if (running) return;
    cooldownUntil = 0;
    react('center');
  });
  fallback.addEventListener('error', () => root.classList.add('fallback-error'), { once: true });
  // Idle is the only critical sequence. Reactions are loaded on first use and then cached.
  showIdle();
})();
