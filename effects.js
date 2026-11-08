/* ==========================================================================
   Effects layer: ambient canvases (hero starfield, contact particle field),
   pointer spotlights, the floating back-to-top ring, and off-screen pausing.

   Every effect is progressive. It scales to the device (fewer particles,
   lower frame rate and pixel density on phones, static on low-power devices
   flagged `fx-lite` by the head script), pauses when off-screen or in a
   background tab, and renders a single still frame for reduced motion.
   ========================================================================== */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const coarse = matchMedia('(pointer: coarse)').matches;
  const lite = root.classList.contains('fx-lite');
  const canObserve = 'IntersectionObserver' in window && 'ResizeObserver' in window;
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const isLight = () => root.getAttribute('data-theme') === 'light';
  const canvases = [];
  const onMotionChange = callback => {
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', callback);
    else if (reduceMotion.addListener) reduceMotion.addListener(callback);
  };

  /* ---------- Shared canvas engine ---------- */
  class AmbientCanvas {
    constructor(host, scene) {
      this.host = host;
      this.scene = scene;
      this.canvas = document.createElement('canvas');
      this.canvas.className = `fx-canvas ${scene.className}`;
      this.canvas.setAttribute('aria-hidden', 'true');
      host.prepend(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this.width = 0;
      this.height = 0;
      this.time = 0;
      this.raf = 0;
      this.last = 0;
      this.visible = false;
      this.frameInterval = 1000 / 30;
      this.loop = this.loop.bind(this);

      new ResizeObserver(() => this.resize()).observe(host);
      new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
        this.sync();
      }, { rootMargin: '120px 0px' }).observe(host);
      document.addEventListener('visibilitychange', () => this.sync());
            onMotionChange(() => { this.sync(); this.paint(0); });
      canvases.push(this);
      this.resize();
    }

    get animated() { return !reduceMotion.matches && !lite; }

    sync() {
      const run = this.visible && !document.hidden && this.animated;
      if (run && !this.raf) {
        this.last = performance.now();
        this.raf = requestAnimationFrame(this.loop);
      } else if (!run && this.raf) {
        cancelAnimationFrame(this.raf);
        this.raf = 0;
      }
    }

    resize() {
      const rect = this.host.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      // Mobile browser bars nudge the height while scrolling; ignore small changes so the
      // canvas buffer is not reallocated mid-scroll.
      if (width === this.width && Math.abs(height - this.height) < this.height * .15) return;
      const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : this.scene.maxDpr);
      this.width = width;
      this.height = height;
      this.canvas.width = Math.round(width * dpr);
      this.canvas.height = Math.round(height * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.scene.seed(this);
      this.paint(0);
    }

    loop(now) {
      this.raf = requestAnimationFrame(this.loop);
      const elapsed = now - this.last;
      if (elapsed < this.frameInterval - 2) return;
      this.last = now;
      const dt = Math.min(elapsed, 80) / 1000;
      this.time += dt;
      this.paint(dt);
    }

    paint(dt) {
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.scene.render(this, dt);
      this.ctx.globalAlpha = 1;
    }
  }

  /* ---------- Hero: drifting, twinkling starfield with pointer parallax ---------- */
    const starColors = { white: '#e8eeff', cyan: '#4de2ff', lime: '#c8ff4d', violet: '#a99bff' };
  const starColorsLight = { white: '#64748b', cyan: '#0e93b5', lime: '#5b9a0d', violet: '#7c5cf0' };
  function starfieldScene(host) {
    const stars = [];
    const parallax = { x: 0, y: 0, tx: 0, ty: 0 };
    let shooting = null;
    let nextShot = 4 + Math.random() * 5;

    if (finePointer.matches) {
      host.addEventListener('pointermove', event => {
        const rect = host.getBoundingClientRect();
        parallax.tx = ((event.clientX - rect.left) / rect.width - .5) * 2;
        parallax.ty = ((event.clientY - rect.top) / rect.height - .5) * 2;
      }, { passive: true });
      host.addEventListener('pointerleave', () => { parallax.tx = parallax.ty = 0; }, { passive: true });
    }

    return {
      className: 'fx-stars',
      maxDpr: 1.5,
      seed(view) {
        const count = Math.round(clamp(view.width * view.height / (coarse ? 9000 : 6500), 36, coarse ? 90 : 170));
        stars.length = 0;
        for (let i = 0; i < count; i += 1) {
          const roll = Math.random();
          stars.push({
            x: Math.random(),
            y: Math.random(),
            z: .2 + Math.random() * .8, // depth drives size, brightness and parallax
            phase: Math.random() * Math.PI * 2,
            speed: .5 + Math.random() * 1.6,
            color: roll < .07 ? 'lime' : roll < .16 ? 'cyan' : roll < .22 ? 'violet' : 'white'
          });
        }
        // Group by colour so fillStyle only changes a few times per frame.
        stars.sort((a, b) => a.color.localeCompare(b.color));
      },
      render(view, dt) {
        const { ctx, width, height, time } = view;
        const ease = Math.min(1, dt * 2.5);
        // Stars stay quiet behind the headline so they never read as stray punctuation.
        const wide = width > 900;
        const quiet = (x, y) => wide
          ? (x < width * .34 ? .28 : x < width * .52 ? .28 + (x - width * .34) / (width * .18) * .72 : 1)
          : (y > height * .1 && y < height * .34 ? .35 : 1);
        parallax.x += (parallax.tx - parallax.x) * ease;
        parallax.y += (parallax.ty - parallax.y) * ease;
                let color = '';
        const light = isLight();
        const palette = light ? starColorsLight : starColors;
        const strength = light ? .5 : 1;
        for (const star of stars) {
          star.y -= dt * .007 * star.z;
          if (star.y < -.02) { star.y = 1.02; star.x = Math.random(); }
          const twinkle = dt ? .55 + .45 * Math.sin(time * star.speed + star.phase) : .8;
          const size = .45 + star.z * 1.25;
          const x = star.x * width - parallax.x * star.z * 16;
          const y = star.y * height - parallax.y * star.z * 10;
          if (star.color !== color) { color = star.color; ctx.fillStyle = palette[color]; }
          ctx.globalAlpha = (.18 + .62 * star.z) * twinkle * quiet(x, y) * strength;
          if (size < 1.1) {
            ctx.fillRect(x - size, y - size, size * 2, size * 2);
          } else {
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
                if (!dt || light) return;
        // An occasional shooting star crossing the upper sky (night theme only).
        nextShot -= dt;
        if (!shooting && nextShot <= 0) {
          shooting = { x: width * (.35 + Math.random() * .6), y: height * Math.random() * .35, life: 0, span: .9 + Math.random() * .5 };
          nextShot = 6 + Math.random() * 8;
        }
        if (shooting) {
          shooting.life += dt / shooting.span;
          if (shooting.life >= 1) { shooting = null; return; }
          const travel = shooting.life * Math.min(width, 900) * .45;
          const headX = shooting.x - travel;
          const headY = shooting.y + travel * .42;
          const tail = 90;
          const gradient = ctx.createLinearGradient(headX, headY, headX + tail, headY - tail * .42);
          gradient.addColorStop(0, 'rgba(232,238,255,.95)');
          gradient.addColorStop(1, 'rgba(77,226,255,0)');
          ctx.globalAlpha = Math.sin(shooting.life * Math.PI);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(headX, headY);
          ctx.lineTo(headX + tail, headY - tail * .42);
          ctx.stroke();
        }
      }
    };
  }

  /* ---------- Contact: connected particle field that reacts to the pointer ---------- */
  function constellationScene(host) {
    const nodes = [];
    const pointer = { x: 0, y: 0, active: false };
        const palette = ['#c8ff4d', '#8f80ff', '#4de2ff', '#e8eeff'];
    const paletteLight = ['#5b9a0d', '#6d4ee0', '#0e7490', '#475569'];
    const move = event => {
      const rect = host.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    };
    host.addEventListener('pointermove', move, { passive: true });
    host.addEventListener('pointerdown', move, { passive: true });
    host.addEventListener('pointerleave', () => { pointer.active = false; }, { passive: true });

    return {
      className: 'fx-constellation',
      maxDpr: 2,
      seed(view) {
        const count = Math.round(clamp(view.width * view.height / (coarse ? 15000 : 11000), 22, coarse ? 46 : 96));
        nodes.length = 0;
        for (let i = 0; i < count; i += 1) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 6 + Math.random() * 14;
          const vx = Math.cos(angle) * speed;
          const vy = Math.sin(angle) * speed;
          nodes.push({ x: Math.random() * view.width, y: Math.random() * view.height, vx, vy, bx: vx, by: vy, r: .8 + Math.random() * 1.6, color: palette[i % palette.length] });
        }
      },
      render(view, dt) {
        const { ctx, width, height } = view;
        const link = coarse ? 105 : 135;
        const link2 = link * link;
        const reach = 170;
        const reach2 = reach * reach;
        const edge = y => Math.min(1, y / (height * .18), (height - y) / (height * .25));
        for (const node of nodes) {
          if (dt) {
            if (pointer.active) {
              const dx = node.x - pointer.x;
              const dy = node.y - pointer.y;
              const d2 = dx * dx + dy * dy;
              if (d2 < reach2 && d2 > 1) {
                const distance = Math.sqrt(d2);
                const push = (1 - distance / reach) * 140 * dt;
                node.vx += dx / distance * push;
                node.vy += dy / distance * push;
              }
            }
            const settle = Math.min(1, dt * 1.2);
            node.vx += (node.bx - node.vx) * settle;
            node.vy += (node.by - node.vy) * settle;
            node.x += node.vx * dt;
            node.y += node.vy * dt;
            if (node.x < -20) node.x = width + 20; else if (node.x > width + 20) node.x = -20;
            if (node.y < -20) node.y = height + 20; else if (node.y > height + 20) node.y = -20;
          }
        }
                const light = isLight();
        ctx.lineWidth = 1;
        ctx.strokeStyle = light ? '#6366f1' : '#8f9cff';
        for (let i = 0; i < nodes.length; i += 1) {
          const a = nodes[i];
          for (let j = i + 1; j < nodes.length; j += 1) {
            const b = nodes[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 > link2) continue;
                        ctx.globalAlpha = (1 - d2 / link2) * (light ? .22 : .32) * Math.max(0, Math.min(edge(a.y), edge(b.y)));
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        if (pointer.active && dt) {
                    ctx.strokeStyle = light ? '#4d7c0f' : '#c8ff4d';
          for (const node of nodes) {
            const dx = node.x - pointer.x;
            const dy = node.y - pointer.y;
            const d2 = dx * dx + dy * dy;
            if (d2 > reach2 * 1.3) continue;
            ctx.globalAlpha = (1 - d2 / (reach2 * 1.3)) * .5;
            ctx.beginPath();
            ctx.moveTo(pointer.x, pointer.y);
            ctx.lineTo(node.x, node.y);
            ctx.stroke();
          }
        }
                for (const [index, node] of nodes.entries()) {
          ctx.globalAlpha = (light ? .7 : .85) * Math.max(0, edge(node.y));
          ctx.fillStyle = light ? paletteLight[index % paletteLight.length] : node.color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };
  }

  if (canObserve) {
    const hero = document.querySelector('.depot-page');
    if (hero) new AmbientCanvas(hero, starfieldScene(hero));
    const contact = document.querySelector('.contact-section');
        if (contact) new AmbientCanvas(contact, constellationScene(contact));
    document.addEventListener('themechange', () => canvases.forEach(view => view.paint(0)));
  }

  /* ---------- Hero light that follows the pointer (composited transform only) ---------- */
  const hero = document.querySelector('.depot-page');
  if (hero && finePointer.matches && !lite) {
    const light = document.createElement('div');
    light.className = 'hero-spotlight';
    light.setAttribute('aria-hidden', 'true');
    hero.prepend(light);
    let frame = 0;
    let x = 0;
    let y = 0;
    hero.addEventListener('pointermove', event => {
      const rect = hero.getBoundingClientRect();
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
      if (!frame) frame = requestAnimationFrame(() => {
        frame = 0;
        light.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
      hero.classList.add('has-pointer');
    }, { passive: true });
    hero.addEventListener('pointerleave', () => hero.classList.remove('has-pointer'), { passive: true });
  }

  /* ---------- Cards: a soft light that follows the pointer ---------- */
  if (finePointer.matches && !reduceMotion.matches) {
    const selector = [
      '.project-card', '.skill-card', '.service-card', '.now-grid article', '.working-points article',
      '.process-step', '.experience-item', '.state-demo', '.state-architecture',
      '.contact-channel', '.case-feature-grid article', '.pulse-feature-card', '.pulse-design-principles article'
    ].join(',');
    document.querySelectorAll(selector).forEach(card => card.classList.add('fx-spot'));
    let frame = 0;
    let target = null;
    let px = 0;
    let py = 0;
    document.addEventListener('pointermove', event => {
      const card = event.target.closest?.('.fx-spot');
      if (!card) return;
      target = card;
      px = event.clientX;
      py = event.clientY;
      if (!frame) frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = target.getBoundingClientRect();
        target.style.setProperty('--spot-x', `${Math.round(px - rect.left)}px`);
        target.style.setProperty('--spot-y', `${Math.round(py - rect.top)}px`);
      });
    }, { passive: true });
  }

    /* ---------- Phones and tablets: a "Start a project" button that follows the reader ---------- */
  const contactSection = document.getElementById('contact');
  const projectCta = document.createElement('a');
  projectCta.className = 'fx-cta';
  projectCta.href = contactSection ? '#contact' : '/#contact';
  projectCta.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/><path d="M8.5 11.5h7M8.5 14.5h4"/></svg>Start a project';
  document.body.append(projectCta);
  let contactInView = false;

  /* ---------- Floating back-to-top button with a scroll-progress ring ---------- */
  const topButton = document.createElement('a');
  topButton.className = 'fx-top';
  topButton.href = '#top';
  topButton.setAttribute('aria-label', 'Back to top');
  topButton.innerHTML = '<svg viewBox="0 0 52 52" aria-hidden="true" focusable="false"><circle class="fx-top-track" cx="26" cy="26" r="24"/><circle class="fx-top-ring" cx="26" cy="26" r="24" pathLength="100"/></svg><span aria-hidden="true">↑</span>';
  document.body.append(topButton);
  const ring = topButton.querySelector('.fx-top-ring');
  let scrollFrame = 0;
  let footerInView = false;
  const updateTopButton = () => {
    scrollFrame = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    const fraction = max > 0 ? clamp(scrollY / max, 0, 1) : 0;
    ring.style.strokeDashoffset = String(100 - fraction * 100);
        topButton.classList.toggle('is-visible', scrollY > innerHeight * .9 && !footerInView);
    projectCta.classList.toggle('is-visible', scrollY > innerHeight * .9 && !footerInView && !contactInView);
  };
  const requestTopUpdate = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateTopButton); };
  window.addEventListener('scroll', requestTopUpdate, { passive: true });
  window.addEventListener('resize', requestTopUpdate, { passive: true });
  const footer = document.querySelector('.site-footer, .pulse-footer');
  if (footer && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      footerInView = entry.isIntersecting;
      requestTopUpdate();
    }).observe(footer);
  }
    if (contactSection && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      contactInView = entry.isIntersecting;
      requestTopUpdate();
    }).observe(contactSection);
  }
  updateTopButton();

  /* ---------- Ticker rows: always long enough to cover the screen ---------- */
  // Each row slides by half its length per loop, so the row must be at least twice the viewport
  // wide or a gap opens at the end of every loop on wide monitors. Whole copies of the original
  // sets are appended (keeping the loop seamless) and the duration grows to keep the same speed.
  document.querySelectorAll('.marquee-track').forEach(track => {
    const sets = [...track.children];
    if (!sets.length) return;
    const baseDuration = parseFloat(getComputedStyle(track).animationDuration) || 40;
    const fill = () => {
      while (track.scrollWidth < innerWidth * 2 + 240 && track.children.length < sets.length * 8) {
        sets.forEach(set => track.append(set.cloneNode(true)));
      }
      track.style.animationDuration = `${baseDuration * track.children.length / sets.length}s`;
    };
    fill();
    window.addEventListener('resize', fill, { passive: true });
  });

  /* ---------- Pause decorative CSS animations while their section is off-screen ---------- */
  if ('IntersectionObserver' in window) {
    const pausable = document.querySelectorAll('.depot-page, .marquee, .project-card--pulse, .skill-card, .state-lab-section, .contact-section, .pulse-hero, .pulse-status-section');
    const pauser = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('fx-paused', !entry.isIntersecting));
    }, { rootMargin: '80px 0px' });
    pausable.forEach(element => pauser.observe(element));
  }
})();
