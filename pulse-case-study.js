(() => {
  const media = window.pulseMediaSources || {};
  const labels = {
    dashboard:'Pulse Today Dashboard screenshot', planner:'Pulse Planner screenshot',
    learning:'Pulse Learning screen screenshot', academics:'Pulse Academics screen screenshot',
    academicGroups:'Pulse Academic Groups screen screenshot', livingSky:'Pulse Living Sky visual capture',
    progress:'Pulse Progress screen screenshot', settings:'Pulse Settings screen screenshot',
    namaz:'Pulse Namaz screen screenshot'
  };
  document.querySelectorAll('[data-pulse-media-slot]').forEach(slot => {
    const key = slot.dataset.pulseMediaSlot;
    const src = media[key];
    if (typeof src !== 'string' || !src.trim()) return;
    const image = document.createElement('img');
    image.alt = labels[key] || 'Pulse application screenshot';
    image.loading = key === 'dashboard' && slot.classList.contains('pulse-hero-visual') ? 'eager' : 'lazy';
    image.decoding = 'async';
    image.addEventListener('load', () => {
      slot.classList.add('has-authentic-media');
      slot.setAttribute('aria-label', image.alt);
      const label = slot.querySelector('.pulse-visual-message > span, .pulse-living-placeholder > span, .pulse-screen-placeholder > span');
      if (label) label.textContent = 'APP SCREEN';
      const topLine = slot.querySelector('.pulse-visual-topline');
      if (topLine) topLine.textContent = 'PULSE / APP SCREEN';
      const caption = slot.querySelector('.pulse-visual-caption');
      if (caption) caption.textContent = 'PULSE APP';
    }, {once:true});
    image.addEventListener('error', () => image.remove(), {once:true});
    slot.prepend(image);
    image.src = src;
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get('from') !== 'depot') return;
  document.querySelectorAll('[data-pulse-back]').forEach(link => {
    link.href = '/#depot-work';
    link.textContent = link.classList.contains('pulse-back-link') ? '← Back to Work container' : '← Back to Work container';
  });
})();
