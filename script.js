document.documentElement.classList.add('js');

const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.nav-toggle');
const menu = document.querySelector('.nav-links');
const progress = document.querySelector('.scroll-progress span');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

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
    if (element.matches('.skill-card, .process-step')) {
      const siblings = [...element.parentElement.children];
      element.style.setProperty('--reveal-delay', `${siblings.indexOf(element) * 75}ms`);
    }
    observer.observe(element);
  });
} else {
  revealElements.forEach(element => element.classList.add('in-view'));
}

// Pointer-reactive light, subtle 3D tilt, and magnetic buttons on desktop only.
if (finePointer.matches && !reduceMotion.matches) {
  const hero = document.querySelector('.hero');
  let pointerPending = false;
  let pointerX = 0;
  let pointerY = 0;
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
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      const dx = (event.clientX - rect.left) / rect.width - 0.5;
      const dy = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty('--ry', `${(dx * 5).toFixed(2)}deg`);
      card.style.setProperty('--rx', `${(-dy * 5).toFixed(2)}deg`);
    }, { passive: true });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });

  document.querySelectorAll('.magnetic').forEach(button => {
    button.addEventListener('pointermove', event => {
      const rect = button.getBoundingClientRect();
      button.style.setProperty('--mx', `${((event.clientX - rect.left - rect.width / 2) * 0.13).toFixed(1)}px`);
      button.style.setProperty('--my', `${((event.clientY - rect.top - rect.height / 2) * 0.13).toFixed(1)}px`);
    }, { passive: true });
    button.addEventListener('pointerleave', () => {
      button.style.setProperty('--mx', '0px');
      button.style.setProperty('--my', '0px');
    });
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
