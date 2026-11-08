/* ==========================================================================
   Motion layer: GSAP (ScrollTrigger, SplitText, Flip) + Lenis.
   Driven by data attributes in the HTML:
     data-reveal        fade up once when scrolled into view (siblings stagger)
     data-split="lines" headline revealed line by line from behind a mask
     data-count         number counts up from 0 once
     data-magnetic      subtle magnetic pull (fine pointers only)
     data-type-lines    terminal lines type out once
     data-journey       vertical line draws on scroll; items fade in as it reaches them
     data-process-line  connecting line draws through the process steps
     data-marquee       ticker that speeds up with scroll velocity and reverses on scroll up
   Progressive enhancement: if this file or the libraries fail to load, or the visitor
   prefers reduced motion, script.js keeps its CSS-based fallback and all content is visible.
   Only transform and opacity are animated (plus the SVG stroke draw in the State Lab).
   ========================================================================== */
(() => {
  'use strict';

  const root = document.documentElement;
  const heroWaiting = root.classList.contains('motion-wait');
  const releaseHero = () => root.classList.remove('motion-wait');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const { gsap, ScrollTrigger, SplitText, Flip, Lenis } = window;
  if (reduced || !gsap || !ScrollTrigger) { releaseHero(); return; }
  gsap.registerPlugin(...[ScrollTrigger, SplitText, Flip].filter(Boolean));

  /* ---------- Global timing tokens: tweak motion here ---------- */
  const light = matchMedia('(hover: none), (max-width: 767px)').matches;     // touch / small screens
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches && !light;
  const MOTION = {
    ease: 'power3.out',
    duration: light ? 0.55 : 0.8,      // 0.6–0.9s on desktop, shorter on touch
    stagger: light ? 0.06 : 0.07,      // 0.06–0.08s
    offset: light ? 14 : 24,           // reveal distance in px (24 max)
    start: 'top 88%'                   // when reveals fire
  };
  gsap.defaults({ ease: MOTION.ease, duration: MOTION.duration });

  const motion = window.PortfolioMotion = { active: true, tokens: MOTION };
  root.classList.add('gsap');
  const make = (tag, className) => { const el = document.createElement(tag); el.className = className; el.setAttribute('aria-hidden', 'true'); return el; };
  const clear = 'opacity,transform,transition';

  /* ---------- 1. Lenis smooth scroll, synced with ScrollTrigger ---------- */
  let lenis = null;
  if (Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('.depot-dock-content, .nav-links, .brief-fields textarea').forEach(el => el.setAttribute('data-lenis-prevent', ''));
  }
  const headerOffset = () => -((parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) || 68) + 12);
  motion.scrollTo = target => {
    if (lenis) lenis.scrollTo(target, { offset: typeof target === 'number' ? 0 : headerOffset(), duration: 1.1 });
    else if (typeof target === 'number') window.scrollTo(0, target);
    else target.scrollIntoView();
  };
  // Same-page anchors scroll smoothly (links already handled elsewhere, e.g. depot containers, are skipped).
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href*="#"]');
    if (!link || link.classList.contains('skip-link')) return;
    const url = new URL(link.href, location.href);
    if (url.pathname !== location.pathname || url.hash.length < 2) return;
    const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) return;
    event.preventDefault();
    motion.scrollTo(target);
    history.pushState(null, '', url.hash);
    if (event.detail === 0) { if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
  });

  // Thin scroll-progress bar at the very top.
  const bar = make('div', 'motion-progress');
  document.body.append(bar);
  const setBar = gsap.quickSetter(bar, 'scaleX');
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: self => setBar(self.progress) });

  /* ---------- Count-up helper ---------- */
  const countUp = el => {
    if (el.dataset.counted) return;
    el.dataset.counted = 'true';
    const target = Number(el.dataset.count);
    const digits = el.textContent.trim().length;
    const value = { n: 0 };
    el.textContent = '0'.padStart(digits, '0');
    gsap.to(value, { n: target, duration: 1.1, ease: 'power2.out', onUpdate: () => { el.textContent = String(Math.round(value.n)).padStart(digits, '0'); } });
  };

  /* ---------- 2. Hero: headline by lines, then copy and CTAs, then stats ---------- */
  const intro = document.querySelector('.depot-intro');
  if (intro && heroWaiting) {
    root.classList.add('motion-hero');
    releaseHero();
    const headline = intro.querySelector('[data-split]');
    const kicker = intro.querySelector('.depot-kicker');
    const rest = [...intro.children].filter(child => child !== headline && child !== kicker);
    const heroCounts = [...intro.querySelectorAll('[data-count]')];
    heroCounts.forEach(el => { el.dataset.final = el.textContent; });
    gsap.from(kicker, { opacity: 0, y: MOTION.offset, clearProps: clear });
    if (headline && SplitText) {
      SplitText.create(headline, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit(self) {
          gsap.set(self.masks, { paddingBottom: '0.14em', marginBottom: '-0.14em' }); // keep descenders inside the mask
          return gsap.from(self.lines, { yPercent: 110, duration: 0.9, stagger: 0.08, delay: 0.1 });
        }
      });
    } else if (headline) {
      gsap.from(headline, { opacity: 0, y: MOTION.offset, delay: 0.1, clearProps: clear });
    }
    gsap.from(rest, { opacity: 0, y: MOTION.offset, stagger: MOTION.stagger, delay: 0.45, clearProps: clear, onStart: () => heroCounts.forEach(countUp) });
  } else {
    releaseHero();
    document.querySelectorAll('.depot-intro [data-count]').forEach(el => { el.dataset.counted = 'true'; });
  }

  /* ---------- 5. Depot containers: staggered drop-in ---------- */
  const pile = document.querySelector('.depot-container-pile');
  if (pile && (heroWaiting || pile.getBoundingClientRect().top > innerHeight)) {
    // Only the visual box moves; the measured containers and click targets stay put.
    gsap.from(pile.querySelectorAll('.depot-box'), {
      y: -26, duration: 0.7, stagger: 0.06, clearProps: 'transform',
      scrollTrigger: { trigger: pile, start: 'top 90%', once: true }
    });
  }

  /* ---------- 3. Site-wide scroll reveals ---------- */
  const headingBlock = el => el.matches('.section-heading, .process-heading, .contact-top');
  const partsOf = el => headingBlock(el) ? [...el.children].flatMap(child => child.tagName === 'DIV' ? [...child.children] : [child]) : [el];
  const reveals = [...document.querySelectorAll('[data-reveal]')].filter(el => !el.closest('[data-journey]'));
  reveals.forEach(el => {
    if (headingBlock(el)) gsap.set(el, { opacity: 1, y: 0, transition: 'none' });
    gsap.set(partsOf(el), { opacity: 0, y: MOTION.offset, transition: 'none' });
  });
  const reveal = elements => {
    const fresh = elements.filter(el => !el.dataset.revealed);
    fresh.forEach(el => { el.dataset.revealed = 'true'; el.classList.add('in-view'); });
    if (!fresh.length) return;
    gsap.to(fresh.flatMap(partsOf), { opacity: 1, y: 0, stagger: MOTION.stagger, overwrite: true, clearProps: clear });
    fresh.filter(headingBlock).forEach(el => gsap.set(el, { clearProps: clear, delay: MOTION.duration + 0.4 }));
  };
  ScrollTrigger.batch(reveals, { start: MOTION.start, once: true, onEnter: reveal });
  motion.reveal = reveal;

  // Stats elsewhere count up once when they appear.
  document.querySelectorAll('[data-count]').forEach(el => {
    if (el.dataset.counted) return;
    ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => countUp(el) });
  });

  /* ---------- 4. Projects: Flip-animated filtering ---------- */
  let filterTimeline = null;
  motion.filterProjects = (cards, matches) => {
    filterTimeline?.progress(1);
    const list = cards[0]?.parentElement;
    if (!list || !Flip) return false;
    const leaving = cards.filter(card => !card.hidden && !matches(card));
    const entering = cards.filter(card => card.hidden && matches(card));
    filterTimeline = gsap.timeline({ onComplete: () => ScrollTrigger.refresh() });
    if (leaving.length) filterTimeline.to(leaving, { opacity: 0, scale: 0.97, duration: 0.25, ease: 'power2.in', transition: 'none' });
    filterTimeline.add(() => {
      const staying = [...list.children].filter(el => !el.hidden && !leaving.includes(el));
      const state = Flip.getState(staying);
      leaving.forEach(card => { card.hidden = true; gsap.set(card, { clearProps: clear }); });
      entering.forEach(card => { card.hidden = false; card.dataset.revealed = 'true'; card.classList.add('in-view'); });
      gsap.set(staying, { transition: 'none' });
      filterTimeline.add(Flip.from(state, { duration: 0.6, ease: MOTION.ease, onComplete: () => gsap.set(staying, { clearProps: 'transform,transition' }) }));
      if (entering.length) filterTimeline.add(gsap.fromTo(entering, { opacity: 0, y: MOTION.offset, transition: 'none' }, { opacity: 1, y: 0, duration: 0.6, stagger: MOTION.stagger, clearProps: clear }), 0.1);
    });
    return true;
  };

  /* ---------- 6. release.sh: type the lines once ---------- */
  document.querySelectorAll('[data-type-lines]').forEach(term => {
    const rows = [...term.querySelectorAll('p')].map(p => {
      const node = [...p.childNodes].filter(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()).pop();
      return { p, node, text: node ? node.textContent : '' };
    }).filter(row => row.node);
    if (!rows.length) return;
    const last = rows[rows.length - 1];
    let cursor = null;
    if (last.text.endsWith('_')) {       // the trailing "_" becomes a blinking cursor (same text)
      last.text = last.text.slice(0, -1);
      cursor = document.createElement('span');
      cursor.className = 'term-cursor';
      cursor.textContent = '_';
      last.node.after(cursor);
    }
    rows.forEach(row => { row.node.textContent = ''; });
    gsap.set(rows.map(row => row.p), { opacity: 0 });
    ScrollTrigger.create({
      trigger: term, start: 'top 85%', once: true,
      onEnter: () => {
        const typing = gsap.timeline();
        rows.forEach(row => {
          const typed = { n: 0 };
          typing.set(row.p, { opacity: 1 })
            .to(typed, { n: row.text.length, duration: Math.max(0.3, row.text.length * 0.035), ease: 'none', onUpdate: () => { row.node.textContent = row.text.slice(0, Math.round(typed.n)); } })
            .to({}, { duration: 0.14 });
        });
        typing.add(() => cursor?.classList.add('is-blinking'));
      }
    });
  });

  /* ---------- 7. Journey: line draws, roles fade in as it reaches them ---------- */
  const journey = document.querySelector('[data-journey]');
  if (journey) {
    journey.prepend(make('div', 'journey-track'), make('div', 'journey-line'));
    gsap.fromTo(journey.querySelector('.journey-line'), { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: journey, start: 'top 75%', end: 'bottom 75%', scrub: 0.6 } });
    journey.querySelectorAll('[data-reveal]').forEach(item => {
      gsap.set(item, { opacity: 0, y: MOTION.offset, transition: 'none' });
      ScrollTrigger.create({ trigger: item, start: 'top 75%', once: true, onEnter: () => {
        item.classList.add('in-view');
        gsap.to(item, { opacity: 1, y: 0, clearProps: clear });
      } });
    });
  }

  /* ---------- 8. Process: a connecting line draws through the steps ---------- */
  const processGrid = document.querySelector('[data-process-line]');
  if (processGrid) {
    gsap.matchMedia().add('(min-width: 1200px)', () => {
      const line = make('div', 'process-line');
      processGrid.prepend(line);
      gsap.fromTo(line, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: processGrid, start: 'top 85%', end: 'top 35%', scrub: 0.6 } });
      return () => line.remove();
    });
  }

  /* ---------- 9. State Lab: crossfades, spinner → check, shake, flow highlight ---------- */
  const demo = document.querySelector('.state-demo');
  if (demo) {
    const dot = demo.querySelector('.state-status-dot');
    const status = demo.querySelector('.state-status');
    const body = demo.querySelector('.state-demo-body');
    const flow = [...document.querySelectorAll('.state-flow article')];
    dot?.insertAdjacentHTML('beforeend', '<svg class="state-icon" viewBox="0 0 28 28" aria-hidden="true" focusable="false"><circle class="state-spinner" cx="14" cy="14" r="11" pathLength="100"/><path class="state-check" d="M10.6 14.2l2.3 2.3 4.5-4.9" pathLength="1"/></svg>');
    const spinner = demo.querySelector('.state-spinner');
    const check = demo.querySelector('.state-check');
    const spin = spinner ? gsap.to(spinner, { rotation: 360, svgOrigin: '14 14', duration: 0.9, ease: 'none', repeat: -1, paused: true }) : null;
    let flowTimeline = null;
    const highlight = index => flow.forEach((article, i) => article.classList.toggle('is-lit', i === index));
    motion.labState = (state, apply) => {
      gsap.killTweensOf(status);
      gsap.timeline()
        .to(status, { opacity: 0, y: -6, duration: 0.18, ease: 'power2.in' })
        .add(apply)
        .fromTo(status, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.4, clearProps: 'opacity,transform' });
      flowTimeline?.kill();
      if (state === 'loading') {
        spin?.play();
        gsap.to(spinner, { opacity: 1, duration: 0.2 });
        gsap.set(check, { opacity: 0 });
        flowTimeline = gsap.timeline().add(() => highlight(0)).add(() => highlight(1), 0.55);
      } else {
        spin?.pause();
        gsap.to(spinner, { opacity: 0, duration: 0.25 });
        if (state === 'success') {
          gsap.fromTo(dot, { scale: 0.6 }, { scale: 1.7, duration: 0.5, ease: 'back.out(2.5)' });
          gsap.fromTo(check, { opacity: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.45, delay: 0.15, ease: 'power2.out' });
                    highlight(2);
          flowTimeline = gsap.timeline({ delay: 1.6 }).add(() => highlight(-1));
        } else {
          gsap.to(dot, { scale: 1, duration: 0.3 });
          gsap.to(check, { opacity: 0, duration: 0.2 });
                    highlight(-1);
          if (state === 'error') gsap.fromTo(body, { x: 0 }, { keyframes: { x: [0, -7, 6, -4, 3, 0] }, duration: 0.45, ease: 'power2.out', clearProps: 'transform' });
        }
      }
    };
  }

  /* ---------- 10. Marquees: seamless, velocity-aware, reverse on scroll up ---------- */
  const marquee = document.querySelector('[data-marquee]');
  if (marquee) {
    const rows = [...marquee.querySelectorAll('.marquee-track')].map(track => ({
      track,
      direction: track.classList.contains('marquee-track--reverse') ? 1 : -1,
      seconds: parseFloat(track.style.animationDuration) || parseFloat(getComputedStyle(track).animationDuration) || 40,
      x: 0, half: 1, speed: 0,
      set: gsap.quickSetter(track, 'x', 'px')
    }));
    const measure = () => rows.forEach(row => {
      row.seconds = parseFloat(row.track.style.animationDuration) || row.seconds;
      row.half = row.track.scrollWidth / 2;
      row.speed = row.half / row.seconds;
      if (row.direction > 0 && row.x === 0) row.x = -row.half;
    });
    root.classList.add('motion-marquee');
    measure();
    ScrollTrigger.addEventListener('refresh', measure);
    let boost = 1, scrollDirection = 1, hover = 1, onScreen = true;
    ScrollTrigger.create({ trigger: marquee, start: 'top bottom', end: 'bottom top', onToggle: self => { onScreen = self.isActive; } });
    ScrollTrigger.create({ onUpdate: self => {
      scrollDirection = self.direction;
      boost = Math.max(boost, 1 + Math.min(Math.abs(self.getVelocity()) / 1600, 1.6));
    } });
    if (finePointer) {
      marquee.addEventListener('pointerenter', () => { hover = 0.15; });
      marquee.addEventListener('pointerleave', () => { hover = 1; });
    }
    gsap.ticker.add((time, deltaMs) => {
      if (!onScreen) return;
      const dt = Math.min(deltaMs, 64) / 1000;
      boost += (1 - boost) * Math.min(1, dt * 2.5);
      rows.forEach(row => {
        row.x += row.direction * scrollDirection * row.speed * boost * hover * dt;
        if (row.x <= -row.half) row.x += row.half;
        if (row.x > 0) row.x -= row.half;
        row.set(row.x);
      });
    });
  }

  /* ---------- 11. Magnetic primary CTAs (fine pointers only) ---------- */
  if (finePointer) {
    document.querySelectorAll('[data-magnetic]').forEach(el => {
      const toX = gsap.quickTo(el, 'x', { duration: 0.5, ease: MOTION.ease });
      const toY = gsap.quickTo(el, 'y', { duration: 0.5, ease: MOTION.ease });
      el.addEventListener('pointermove', event => {
        const box = el.getBoundingClientRect();
        toX((event.clientX - box.left - box.width / 2) * 0.18);
        toY((event.clientY - box.top - box.height / 2) * 0.25);
      }, { passive: true });
      el.addEventListener('pointerleave', () => { toX(0); toY(0); });
    });
  }

  /* ---------- Keep trigger positions right as images and fonts arrive ---------- */
  let refreshTimer = 0;
  const refreshSoon = () => { clearTimeout(refreshTimer); refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 200); };
  document.querySelectorAll('img').forEach(img => { if (!img.complete) img.addEventListener('load', refreshSoon, { once: true }); });
  window.addEventListener('load', refreshSoon);
  document.fonts?.ready.then(refreshSoon);
  motion.destroy = () => { ScrollTrigger.getAll().forEach(trigger => trigger.kill()); lenis?.destroy(); };
})();
