(() => {
  const hero = document.querySelector('.hero:has([data-depot-container])');
  if (!hero) return;
  const stage = hero.querySelector('[data-depot-stage]');
  const containers = [...hero.querySelectorAll('[data-depot-container]')];
  const rail = hero.querySelector('.depot-rail');
  const carriage = hero.querySelector('.depot-carriage');
  const rod = hero.querySelector('.depot-rod');
  const grip = hero.querySelector('.depot-grip-head');
  const moreButton = hero.querySelector('.depot-explore-toggle');
  const moreMenu = hero.querySelector('.depot-more-links');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const machine = { state:'IDLE', active:null, target:null, pending:null, generation:0, priorFocus:null };
  const duration = { travel:760, lower:560, grab:250, lift:920, doors:720 };
  const wait = ms => new Promise(resolve => window.setTimeout(resolve, reduced.matches ? 0 : ms));
  const setState = state => { machine.state = state; hero.dataset.depotState = state; hero.classList.toggle('depot-busy', state !== 'IDLE' && state !== 'OPEN'); };
  const setCraneX = x => {
    const coordinate=typeof x==='number' ? x+'%' : x;
    carriage.style.left=coordinate;
    rod.style.left=coordinate;
    grip.style.left=coordinate;
  };
  const closeAllPanels = () => containers.forEach(item => {
    item.classList.remove('is-open','is-gripped','is-selected');
    item.setAttribute('aria-expanded','false');
    item.querySelector('.depot-card-content')?.setAttribute('inert','');
    item.querySelector('.depot-card-content')?.setAttribute('aria-hidden','true');
  });
  const pointFor = container => {
    const cr = container.getBoundingClientRect();
    const rr = rail.getBoundingClientRect();
    return {
      x: Math.max(6, Math.min(94, ((cr.left + cr.width / 2 - rr.left) / rr.width) * 100)),
      y: Math.max(4, (cr.top + cr.height / 2 - rr.top - 24) / window.innerHeight * 100)
    };
  };
  const originFor = container => {
    const heroRect = hero.getBoundingClientRect();
    const railRect = rail.getBoundingClientRect();
    const x = parseFloat(getComputedStyle(container).getPropertyValue('--pile-x')) || 50;
    const y = parseFloat(getComputedStyle(container).getPropertyValue('--pile-y')) || 50;
    return { x, y: Math.max(4,(heroRect.top + heroRect.height*y/100 - railRect.top - 24)/innerHeight*100) };
  };
  const travel = async container => {
    const p = pointFor(container);
    setCraneX(p.x);
    hero.style.setProperty('--rod-length', Math.max(30, p.y) + 'vh');
    await wait(duration.travel);
  };
  const moveToDisplay = async container => {
    const displayY = 48;
    container.style.setProperty('--display-y', displayY + '%');
    setCraneX(50);
    const heroRect=hero.getBoundingClientRect(), railRect=rail.getBoundingClientRect();
    hero.style.setProperty('--rod-length', Math.max(18,(heroRect.top+heroRect.height*displayY/100-railRect.top-24)/innerHeight*100)+'vh');
    container.classList.add('is-selected');
    await wait(duration.lift);
  };
  const release = async container => {
    if (!container) return;
    container.classList.remove('is-open');
    container.setAttribute('aria-expanded','false');
    container.querySelector('.depot-card-content')?.setAttribute('inert','');
    container.querySelector('.depot-card-content')?.setAttribute('aria-hidden','true');
    await wait(duration.doors);
    if (container.classList.contains('is-selected')) {
      setState('RETURNING');
      const origin=originFor(container);
      setCraneX(origin.x);
      hero.style.setProperty('--rod-length',Math.max(30,origin.y)+'vh');
      container.classList.remove('is-selected');
      await wait(duration.lift);
      container.classList.remove('is-gripped','is-selected');
      container.style.removeProperty('--display-y');
      hero.style.setProperty('--rod-length','30px');
      await wait(duration.lift);
    }
    if (machine.active === container) machine.active = null;
  };
  const runPickup = async (container, generation) => {
    machine.target = container;
    await release(machine.active);
    if (generation !== machine.generation) return;
    setState('MOVING');
    await travel(container);
    if (generation !== machine.generation) return;
    setState('LOWERING');
    const p = pointFor(container);
    hero.style.setProperty('--rod-length', Math.max(30, p.y) + 'vh');
    await wait(duration.lower);
    if (generation !== machine.generation) return;
    setState('GRABBING');
    container.classList.add('is-gripped');
    await wait(duration.grab);
    if (generation !== machine.generation) return;
    setState('LIFTING');
    await moveToDisplay(container);
    if (generation !== machine.generation) return;
    setState('OPENING');
    container.classList.add('is-open');
    container.setAttribute('aria-expanded','true');
    await wait(duration.doors);
    if (generation !== machine.generation) return;
    machine.active = container;
    machine.target = null;
    container.querySelector('.depot-card-content')?.removeAttribute('inert');
    container.querySelector('.depot-card-content')?.setAttribute('aria-hidden','false');
    setState('OPEN');
    if (machine.priorFocus?.matches(':focus-visible')) {
      const heading = container.querySelector('.depot-card-content h2');
      heading?.setAttribute('tabindex','-1');
      heading?.focus({preventScroll:true});
    }
  };
  const activate = async container => {
    if (!container) return;
    if (machine.active === container && machine.state === 'OPEN') return;
    machine.pending = container;
    if (machine.state !== 'IDLE' && machine.state !== 'OPEN') return;
    while (machine.pending) {
      const next = machine.pending;
      machine.pending = null;
      machine.priorFocus = document.activeElement;
      const generation = ++machine.generation;
      try { await runPickup(next, generation); }
      catch (error) {
        console.error('Depot pickup recovered from an animation error.', error);
        setState('ERROR_RECOVERY');
        closeAllPanels();
        machine.active = null;
        machine.target = null;
        hero.style.setProperty('--rod-length','30px');
        setState('IDLE');
      }
    }
  };
  const byId = id => containers.find(item => item.dataset.depotContainer === id);
  containers.forEach(item => {
    item.querySelector('.depot-card-content')?.setAttribute('inert','');
    item.querySelector('.depot-card-content')?.setAttribute('aria-hidden','true');
    item.setAttribute('aria-expanded','false');
  });
  containers.forEach(container => container.addEventListener('click', event => {
    if (event.target.closest('a')) return;
    activate(container);
  }));
  hero.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (moreMenu?.classList.contains('is-open')) {
        moreMenu.classList.remove('is-open'); moreButton?.setAttribute('aria-expanded','false'); moreButton?.focus();
      } else if (machine.active !== byId('intro') || machine.state !== 'OPEN') {
        event.preventDefault(); activate(byId('intro'));
      }
    }
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-depot-container]')) {
      event.preventDefault(); activate(event.target);
    }
  });
  moreButton?.addEventListener('click', () => {
    const open = moreMenu.classList.toggle('is-open');
    moreButton.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.depot-tools') && moreMenu?.classList.contains('is-open')) {
      moreMenu.classList.remove('is-open'); moreButton?.setAttribute('aria-expanded','false');
    }
  });
  const resizeObserver = new ResizeObserver(() => {
    if (machine.state === 'IDLE' || machine.state === 'OPEN') {
      if (machine.active) {
        const p = pointFor(machine.active);
        setCraneX(p.x);
      } else {
        setCraneX(50); hero.style.setProperty('--rod-length','30px');
      }
    } else if (machine.target && ['MOVING','LOWERING','GRABBING'].includes(machine.state)) {
      const p=pointFor(machine.target);
      setCraneX(p.x);
      hero.style.setProperty('--rod-length',Math.max(30,p.y)+'vh');
    } else if (machine.target && machine.state === 'LIFTING') {
      setCraneX(50);
      const heroRect=hero.getBoundingClientRect(), railRect=rail.getBoundingClientRect();
      hero.style.setProperty('--rod-length',Math.max(18,(heroRect.top+heroRect.height*.48-railRect.top-24)/innerHeight*100)+'vh');
    }
  });
  resizeObserver.observe(stage);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && machine.state !== 'IDLE' && machine.state !== 'OPEN') {
      machine.generation++; machine.pending = null;
      closeAllPanels();
      machine.active = null; machine.target = null;
      hero.style.setProperty('--rod-length','30px'); setCraneX(50); setState('IDLE');
    }
  });
  hero.classList.add('depot-enhanced');
  if (reduced.matches) {
    const intro = byId('intro');
    intro.classList.add('is-selected','is-open');
    intro.setAttribute('aria-expanded','true');
    intro.querySelector('.depot-card-content')?.removeAttribute('inert');
    intro.querySelector('.depot-card-content')?.setAttribute('aria-hidden','false');
    machine.active = intro; setState('OPEN');
  } else {
    window.setTimeout(() => activate(byId('intro')), 450);
  }
})();
