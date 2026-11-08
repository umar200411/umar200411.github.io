// The inline head script normally adds `js` before first paint; keep reveals off if its
// slow-network fallback already showed the content.
if (!window.__revealFallback) document.documentElement.classList.add('js');
window.__siteReady = true;

const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.nav-toggle');
const menu = document.querySelector('.nav-links');
const progress = document.querySelector('.scroll-progress span');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const coarsePointer = window.matchMedia('(hover: none), (pointer: coarse)');
const heroSection = document.querySelector('.depot-page');

// Keep the compact header oriented to the section currently in view.
const sectionLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')]
  .filter(link => link.getAttribute('href') !== '#contact' || document.querySelector('#contact'));
const trackedSections = sectionLinks
  .map(link => ({ link, section: document.querySelector(link.getAttribute('href')) }))
  .filter(item => item.section);
if ('IntersectionObserver' in window && trackedSections.length) {
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      trackedSections.forEach(item => {
        const active = item.section === entry.target;
        item.link.classList.toggle('is-active', active);
        if (active) item.link.setAttribute('aria-current', 'location');
        else item.link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
  trackedSections.forEach(item => sectionObserver.observe(item.section));
}

function animateStats() {
  document.querySelectorAll('.stat-number[data-count]').forEach(number => {
    if (number.dataset.animated === 'true') return;
    number.dataset.animated = 'true';
    const target = Number(number.dataset.count);
    const duration = 520;
    const start = performance.now();

    if (reduceMotion.matches) {
      number.firstChild.textContent = String(target).padStart(2, '0');
      return;
    }

    const update = now => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      number.firstChild.textContent = String(Math.round(target * eased)).padStart(2, '0');
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  });
}

// Delegated so links added later (such as the floating back-to-top button) behave the same.
document.addEventListener('click', event => {
  const link = event.target.closest?.('a[href="#top"]');
  if (!link) return;
  event.preventDefault();
  window.scrollTo({ top: 0, left: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  history.replaceState(null, '', '#top');
  // Keyboard users continue from the top of the page instead of the footer.
  // (The hero brand comes first: the sticky header's brand is off-screen at the top of the homepage.)
  if (event.detail === 0) (document.querySelector('.depot-brand-lockup > a') || document.querySelector('.brand'))?.focus({ preventScroll: true });
});

function closeMenu() {
  menu?.classList.remove('open');
  document.body.classList.remove('menu-open');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Open navigation');
}
menuButton?.addEventListener('click', () => {
  const isOpen = menu?.classList.toggle('open') ?? false;
  document.body.classList.toggle('menu-open', isOpen);
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
});
menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
document.addEventListener('click', event => {
  if (menu?.classList.contains('open') && !event.target.closest('.site-header')) closeMenu();
});

let scrollPending = false;
function updateScrollUI() {
  const max = document.documentElement.scrollHeight - innerHeight;
  const fraction = max > 0 ? Math.min(1, scrollY / max) : 0;
  if (progress) progress.style.transform = `scaleX(${fraction})`;
  header?.classList.toggle('scrolled', scrollY > 14);
  // The hero has its own navigation; the compact header takes over once it scrolls away.
  const heroBottom = heroSection ? heroSection.offsetTop + heroSection.offsetHeight - 120 : 0;
  header?.classList.toggle('is-visible', scrollY > heroBottom);
  scrollPending = false;
}
window.addEventListener('scroll', () => {
  if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateScrollUI); }
}, { passive: true });
window.addEventListener('resize', () => {
  updateScrollUI();
  if (innerWidth > 1023) closeMenu();
}, { passive: true });
updateScrollUI();

document.querySelectorAll('.process-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const step = trigger.closest('.process-step');
    const isOpen = step?.classList.toggle('is-open') ?? false;
    trigger.setAttribute('aria-expanded', String(isOpen));
  });
});

document.querySelectorAll('.screenshot-gallery').forEach(gallery => {
  const controls = [...gallery.querySelectorAll('.demo-control[data-image]')];
  const target = document.getElementById(controls[0]?.getAttribute('aria-controls') || '');
  const image = target?.querySelector('img');
  const status = gallery.querySelector('.gallery-status');
  if (!image || !controls.length) return;

  const preloads = new Map();
  const preload = src => {
    if (preloads.has(src)) return preloads.get(src);
    const request = new Promise((resolve, reject) => {
      const candidate = new Image();
      candidate.decoding = 'async';
      candidate.onload = () => resolve(candidate);
      candidate.onerror = reject;
      candidate.src = src;
      if (candidate.complete && candidate.naturalWidth) resolve(candidate);
    });
    preloads.set(src, request);
    return request;
  };

  const preloadNeighbors = control => {
    const index = controls.indexOf(control);
    [controls[index - 1], controls[index + 1]]
      .filter(item => item?.dataset.image && item.dataset.image !== image.getAttribute('src'))
      .forEach(item => preload(item.dataset.image).catch(() => {}));
  };
  const activeControl = () => controls.find(control => control.getAttribute('aria-pressed') === 'true') || controls[0];
  gallery.addEventListener('pointerenter', () => preloadNeighbors(activeControl()), { once: true, passive: true });
  gallery.addEventListener('focusin', () => preloadNeighbors(activeControl()), { once: true });

  controls.forEach(control => {
    control.addEventListener('click', async () => {
      const src = control.dataset.image;
      if (!src || new URL(src, document.baseURI).href === image.src) return;
      try {
        await preload(src);
      } catch {
        return;
      }
      image.src = src;
      image.alt = control.dataset.alt || control.dataset.label || 'Project screenshot';
      if (target.classList.contains('browser-preview')) {
        const mobileLayout = control.dataset.layout === 'mobile';
        target.classList.toggle('is-mobile', mobileLayout);
        target.closest('.project-media--magnet')?.classList.toggle('is-mobile-preview', mobileLayout);
      }
      controls.forEach(item => {
        const selected = item === control;
        item.classList.toggle('is-active', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
      if (status) status.textContent = `Showing ${control.dataset.label || 'selected'} screenshot.`;
      preloadNeighbors(control);
    });
  });
});

// Scroll-linked phone tilt: one layout read per frame, and only while the showcase is on screen.
const phoneShowcase = document.querySelector('.project-media--beautify');
if (phoneShowcase && !reduceMotion.matches) {
  let showcaseFrame = 0;
  let showcaseVisible = !('IntersectionObserver' in window);
  const updatePhoneShowcase = () => {
    showcaseFrame = 0;
    const rect = phoneShowcase.getBoundingClientRect();
    const viewportProgress = Math.max(0, Math.min(1, (innerHeight - rect.top) / (innerHeight + rect.height)));
    phoneShowcase.style.setProperty('--phone-shift', `${Math.round(42 - viewportProgress * 27)}px`);
    phoneShowcase.style.setProperty('--phone-tilt', `${(viewportProgress * 7).toFixed(2)}deg`);
  };
  const requestShowcaseUpdate = () => {
    if (showcaseVisible && !showcaseFrame) showcaseFrame = requestAnimationFrame(updatePhoneShowcase);
  };
  if (!showcaseVisible) {
    new IntersectionObserver(([entry]) => {
      showcaseVisible = entry.isIntersecting;
      requestShowcaseUpdate();
    }).observe(phoneShowcase);
  }
  window.addEventListener('scroll', requestShowcaseUpdate, { passive: true });
  requestShowcaseUpdate();
}

const stats = document.querySelector('.about-stats');
if (stats && 'IntersectionObserver' in window) {
  const statsObserver = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      animateStats();
      statsObserver.disconnect();
    }
  }, { threshold: .35 });
  statsObserver.observe(stats);
} else {
  animateStats();
}

// Scroll-triggered reveals with a graceful fallback for older browsers.
const revealElements = [...document.querySelectorAll('.reveal')];
if ('IntersectionObserver' in window && !reduceMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
  revealElements.forEach((element, index) => {
    // Small stagger only within short groups so scrolling stays responsive.
    if (element.matches('.skill-card, .process-step, .experience-item')) {
      const siblings = [...element.parentElement.children];
      element.style.setProperty('--reveal-delay', `${siblings.indexOf(element) * 55}ms`);
    }
    observer.observe(element);
  });
} else {
  revealElements.forEach(element => element.classList.add('in-view'));
}

// Subtle 3D tilt and magnetic buttons on desktop only (the hero light lives in effects.js).
if (finePointer.matches && !reduceMotion.matches) {
  document.querySelectorAll('.tilt-card').forEach(card => {
    let rect;
    card.addEventListener('pointermove', event => {
      rect ??= card.getBoundingClientRect();
      const dx = (event.clientX - rect.left) / rect.width - 0.5;
      const dy = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty('--ry', `${(dx * 5).toFixed(2)}deg`);
      card.style.setProperty('--rx', `${(-dy * 5).toFixed(2)}deg`);
    }, { passive: true });
    card.addEventListener('pointerenter', () => { rect = card.getBoundingClientRect(); }, { passive: true });
    card.addEventListener('pointerleave', () => {
      rect = undefined;
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });

  document.querySelectorAll('.magnetic').forEach(button => {
    let rect;
    button.addEventListener('pointermove', event => {
      rect ??= button.getBoundingClientRect();
      button.style.setProperty('--mx', `${((event.clientX - rect.left - rect.width / 2) * 0.13).toFixed(1)}px`);
      button.style.setProperty('--my', `${((event.clientY - rect.top - rect.height / 2) * 0.13).toFixed(1)}px`);
    }, { passive: true });
    button.addEventListener('pointerenter', () => { rect = button.getBoundingClientRect(); }, { passive: true });
    button.addEventListener('pointerleave', () => {
      rect = undefined;
      button.style.setProperty('--mx', '0px');
      button.style.setProperty('--my', '0px');
    });
  });
}

if (coarsePointer.matches) {
  document.querySelectorAll('a, button, .experience-item, .skill-card, .process-step').forEach(element => {
    element.addEventListener('pointerdown', () => element.classList.add('touch-press'), { passive: true });
    const clearPress = () => element.classList.remove('touch-press');
    element.addEventListener('pointerup', clearPress, { passive: true });
    element.addEventListener('pointercancel', clearPress, { passive: true });
    element.addEventListener('pointerleave', clearPress, { passive: true });
  });
}

const copyButton = document.querySelector('.copy-email');
const copyStatus = document.querySelector('.copy-status');
copyButton?.addEventListener('click', async () => {
  const email = copyButton.dataset.email;
  try {
    await navigator.clipboard.writeText(email);
    if (copyStatus) copyStatus.textContent = 'Email copied to clipboard.';
  } catch {
    if (copyStatus) copyStatus.textContent = 'Opening your email app.';
    window.location.href = `mailto:${email}`;
  }
});
const year = document.querySelector('#year');
if (year) year.textContent = String(new Date().getFullYear());

const stateTitle = document.querySelector('[data-state-title]');
const stateCopy = document.querySelector('[data-state-copy]');
const stateButtons = document.querySelectorAll('[data-state]');
const stateMessages = {
  idle: ['Ready to book', 'Select a service to see the state change.'],
  loading: ['Checking availability…', 'Fetching the latest salon and time-slot data.'],
  success: ['Booking confirmed', 'A clear success state keeps the next step obvious.'],
  error: ['Could not complete booking', 'The user gets a recovery path instead of a dead end.']
};
const stateDemo = document.querySelector('.state-demo');
let bookingFlowTimer = 0;
function setLabState(state) {
  const message = stateMessages[state];
  if (!message) return;
  stateButtons.forEach(item => item.classList.toggle('is-selected', item.dataset.state === state && !item.classList.contains('state-trigger')));
  if (stateTitle) stateTitle.textContent = message[0];
  if (stateCopy) stateCopy.textContent = message[1];
  stateDemo?.setAttribute('data-active-state', state);
  if (stateDemo && !reduceMotion.matches) {
    stateDemo.classList.remove('state-changing');
    requestAnimationFrame(() => stateDemo.classList.add('state-changing'));
  }
}
stateButtons.forEach(button => button.addEventListener('click', () => {
  window.clearTimeout(bookingFlowTimer);
  setLabState(button.dataset.state);
  // "Run booking flow" plays the whole sequence: loading, then a confirmed booking.
  if (button.classList.contains('state-trigger')) {
    bookingFlowTimer = window.setTimeout(() => setLabState('success'), reduceMotion.matches ? 600 : 1700);
  }
}));

const projectFilters = document.querySelectorAll('.project-filter');
const projectCards = document.querySelectorAll('[data-project-type]');
projectFilters.forEach(filter => filter.addEventListener('click', () => {
  const selected = filter.dataset.filter;
  projectFilters.forEach(item => item.classList.toggle('is-active', item === filter));
  projectCards.forEach(card => {
    const matches = selected === 'all' || card.dataset.projectType.split(' ').includes(selected);
    if (matches) {
      card.hidden = false;
      requestAnimationFrame(() => card.classList.add('filter-enter'));
      window.setTimeout(() => card.classList.remove('filter-enter'), 380);
    } else {
      card.hidden = true;
    }
  });
}));

const projectBrief = document.querySelector('#project-brief');
projectBrief?.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(projectBrief);
  const body = `Project type: ${data.get('type')}\nTimeline: ${data.get('timeline')}\n\nProject note:\n${data.get('message') || 'I would like to discuss a project.'}`;
  const href = `mailto:umar@umarsaeedqureshi.com?subject=${encodeURIComponent('Project brief for Umar Saeed Qureshi')}&body=${encodeURIComponent(body)}`;
  const status = projectBrief.querySelector('.brief-status');
  if (status) status.textContent = 'Opening your email app…';
  window.location.href = href;
});
