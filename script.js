document.documentElement.classList.add('js');

const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.nav-toggle');
const menu = document.querySelector('.nav-links');
const progress = document.querySelector('.scroll-progress span');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const coarsePointer = window.matchMedia('(hover: none), (pointer: coarse)');

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

document.querySelectorAll('a[href="#top"]').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    window.scrollTo({ top: 0, left: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    history.replaceState(null, '', '#top');
  });
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
  scrollPending = false;
}
window.addEventListener('scroll', () => {
  if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateScrollUI); }
}, { passive: true });
window.addEventListener('resize', () => {
  updateScrollUI();
  if (innerWidth > 900) closeMenu();
}, { passive: true });
updateScrollUI();

document.querySelectorAll('.process-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const step = trigger.closest('.process-step');
    const isOpen = step?.classList.toggle('is-open') ?? false;
    trigger.setAttribute('aria-expanded', String(isOpen));
  });
});

document.querySelectorAll('.demo-switcher').forEach(switcher => {
  const art = switcher.closest('.project-art');
  const screen = art?.querySelector('.phone-screen');
  const bannerCopy = screen?.querySelector('.phone-banner strong');
  switcher.querySelectorAll('.demo-control').forEach(control => {
    control.addEventListener('click', () => {
      switcher.querySelectorAll('.demo-control').forEach(item => {
        item.classList.remove('is-active');
        item.setAttribute('aria-pressed', 'false');
      });
      control.classList.add('is-active');
      control.setAttribute('aria-pressed', 'true');
      const view = control.dataset.demo || 'discover';
      screen?.setAttribute('data-view', view);
      if (bannerCopy) {
        bannerCopy.textContent = {
          discover: 'A little time for yourself.',
          book: 'Book your moment.',
          profile: 'Your glow starts here.'
        }[view];
      }
    });
  });
});

const phoneShowcase = document.querySelector('.project-art');
if (phoneShowcase && !reduceMotion.matches) {
  const updatePhoneShowcase = () => {
    const rect = phoneShowcase.getBoundingClientRect();
    const viewportProgress = Math.max(0, Math.min(1, (innerHeight - rect.top) / (innerHeight + rect.height)));
    phoneShowcase.style.setProperty('--phone-shift', `${Math.round(42 - viewportProgress * 27)}px`);
    phoneShowcase.style.setProperty('--phone-tilt', `${(viewportProgress * 7).toFixed(2)}deg`);
    phoneShowcase.classList.toggle('is-scrolling', rect.top < innerHeight && rect.bottom > 0);
  };
  window.addEventListener('scroll', updatePhoneShowcase, { passive: true });
  updatePhoneShowcase();
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

// Pointer-reactive light, subtle 3D tilt, and magnetic buttons on desktop only.
if (finePointer.matches && !reduceMotion.matches) {
  const cursorDot = document.querySelector('.cursor-dot');
  const cursorRing = document.querySelector('.cursor-ring');
  const hero = document.querySelector('.hero');
  let pointerPending = false;
  let pointerX = 0;
  let pointerY = 0;
  let cursorX = 0;
  let cursorY = 0;
  let cursorFrame = 0;
  let ringX = 0;
  let ringY = 0;

  document.documentElement.classList.add('has-custom-cursor');
  const updateCursor = () => {
    ringX += (cursorX - ringX) * 0.18;
    ringY += (cursorY - ringY) * 0.18;
    cursorDot?.style.setProperty('--cursor-x', `${cursorX}px`);
    cursorDot?.style.setProperty('--cursor-y', `${cursorY}px`);
    cursorRing?.style.setProperty('--cursor-x', `${ringX}px`);
    cursorRing?.style.setProperty('--cursor-y', `${ringY}px`);
    if (Math.abs(cursorX - ringX) > 0.1 || Math.abs(cursorY - ringY) > 0.1) {
      cursorFrame = requestAnimationFrame(updateCursor);
    } else {
      cursorFrame = 0;
    }
  };
  document.addEventListener('pointermove', event => {
    cursorX = event.clientX;
    cursorY = event.clientY;
    if (!cursorFrame) {
      ringX = cursorX;
      ringY = cursorY;
      cursorFrame = requestAnimationFrame(updateCursor);
    }
  }, { passive: true });
  document.querySelectorAll('a, button, .tilt-card, .project-art').forEach(element => {
    element.addEventListener('pointerenter', () => document.documentElement.classList.add('cursor-hover'));
    element.addEventListener('pointerleave', () => document.documentElement.classList.remove('cursor-hover'));
  });

  hero?.addEventListener('pointermove', event => {
    const rect = hero.getBoundingClientRect();
    pointerX = event.clientX - rect.left;
    pointerY = event.clientY - rect.top;
    if (pointerPending) return;
    pointerPending = true;
    requestAnimationFrame(() => {
      hero.style.setProperty('--cursor-x', `${pointerX}px`);
      hero.style.setProperty('--cursor-y', `${pointerY}px`);
      pointerPending = false;
    });
  }, { passive: true });

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

// Lightweight canvas atmosphere: particle trails and matrix-like drops on capable devices.
if (!reduceMotion.matches) {
  const canvas = document.querySelector('.hero-canvas');
  const hero = document.querySelector('.hero');
  const context = canvas?.getContext('2d');
  if (canvas && context && hero) {
    const particles = Array.from({ length: 34 }, (_, index) => ({
      x: Math.random(),
      y: Math.random(),
      speed: .00015 + Math.random() * .00035,
      size: 1 + Math.random() * 2,
      phase: index * .7
    }));
    const drops = Array.from({ length: 16 }, (_, index) => ({
      x: .56 + Math.random() * .42,
      y: Math.random(),
      speed: .0007 + Math.random() * .0012,
      char: ['0', '1', '✦', '↗'][index % 4]
    }));
    const trail = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastTime = 0;
    let pointer = { x: .75, y: .35 };

    const resizeCanvas = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = canvas.clientWidth = hero.clientWidth;
      height = canvas.clientHeight = hero.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const renderCanvas = time => {
      const delta = Math.min(32, time - lastTime || 16);
      lastTime = time;
      context.clearRect(0, 0, width, height);
      context.font = '11px Space Grotesk, sans-serif';
      context.textAlign = 'center';

      particles.forEach(particle => {
        particle.y -= particle.speed * delta;
        if (particle.y < -.03) particle.y = 1.03;
        const x = particle.x * width + Math.sin(time * .0005 + particle.phase) * 18;
        const y = particle.y * height;
        context.fillStyle = 'rgba(215, 255, 100, .55)';
        context.fillRect(x, y, particle.size, particle.size);
      });

      drops.forEach(drop => {
        drop.y += drop.speed * delta;
        if (drop.y > 1.08) drop.y = -.04;
        context.fillStyle = 'rgba(157, 234, 255, .18)';
        context.fillText(drop.char, drop.x * width, drop.y * height);
      });

      trail.forEach((point, index) => {
        point.life -= delta * .0018;
        context.fillStyle = `rgba(215, 255, 100, ${Math.max(0, point.life) * .28})`;
        context.beginPath();
        context.arc(point.x, point.y, 1.5 + index * .08, 0, Math.PI * 2);
        context.fill();
      });
      while (trail.length && trail[0].life <= 0) trail.shift();
      frame = requestAnimationFrame(renderCanvas);
    };

    hero.addEventListener('pointermove', event => {
      const rect = hero.getBoundingClientRect();
      pointer = { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
      trail.push({ x: event.clientX - rect.left, y: event.clientY - rect.top, life: 1 });
      if (trail.length > 22) trail.shift();
      hero.style.setProperty('--parallax-x', `${((pointer.x - .5) * 18).toFixed(1)}px`);
      hero.style.setProperty('--parallax-y', `${((pointer.y - .5) * 12).toFixed(1)}px`);
    }, { passive: true });
    window.addEventListener('resize', resizeCanvas, { passive: true });
    resizeCanvas();
    frame = requestAnimationFrame(renderCanvas);
    window.addEventListener('pagehide', () => cancelAnimationFrame(frame), { once: true });
  }
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
