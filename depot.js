(() => {
  const hero = document.querySelector('.depot-page');
  if (!hero) return;
  const stage = hero.querySelector('[data-depot-stage]');
  const containers = [...hero.querySelectorAll('[data-depot-container]')];
  const rail = hero.querySelector('.depot-rail');
  const carriage = hero.querySelector('.depot-carriage');
  const rod = hero.querySelector('.depot-rod');
  const grip = hero.querySelector('.depot-grip-head');
  const dock = hero.querySelector('.depot-content-dock');
  const dockContent = hero.querySelector('.depot-dock-content');
  const moreButton = hero.querySelector('.depot-explore-toggle');
  const moreMenu = hero.querySelector('.depot-more-links');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const durations = { travel: 760, lower: 560, grab: 250, lift: 920, doors: 620, reveal: 280 };
  const machine = { state:'IDLE', active:null, target:null, pending:null, running:false, priorFocus:null, keyboard:false, activeOrigin:null };
  const wait = ms => new Promise(resolve => window.setTimeout(resolve, reduced.matches ? 0 : ms));
  const setState = state => {
    machine.state = state;
    hero.dataset.depotState = state;
    hero.classList.toggle('depot-busy', !['IDLE','OPEN'].includes(state));
  };
  const setCraneX = value => {
    const x = typeof value === 'number' ? `${value}%` : value;
    carriage.style.left = rod.style.left = grip.style.left = x;
  };
  const setRodTo = (y, railRect = rail.getBoundingClientRect()) => {
    const stageRect = stage.getBoundingClientRect();
    const localTop = railRect.top - stageRect.top + 24;
    const length = Math.max(24, y - localTop - 12);
    hero.style.setProperty('--rod-length', `${length}px`);
  };
  const pointFor = container => {
    const box = container.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const railRect = rail.getBoundingClientRect();
    return {
      x: Math.max(5, Math.min(95, ((box.left + box.width / 2 - railRect.left) / railRect.width) * 100)),
      y: box.top + box.height / 2 - stageRect.top
    };
  };
  const pilePointFor = container => {
    const stageRect = stage.getBoundingClientRect();
    const railRect = rail.getBoundingClientRect();
    const style = getComputedStyle(container);
    const x = (parseFloat(style.getPropertyValue('--pile-x')) || 50) / 100;
    const y = (parseFloat(style.getPropertyValue('--pile-y')) || 50) / 100;
    const stageX = stageRect.left + stageRect.width * x;
    return {
      x: Math.max(5,Math.min(95,((stageX-railRect.left)/railRect.width)*100)),
      y: stageRect.height * y
    };
  };
  const displayPoint = () => {
    const rect = stage.getBoundingClientRect();
    const x = matchMedia('(max-width: 700px)').matches ? .82 : .84;
    const y = matchMedia('(max-width: 700px)').matches ? .25 : .54;
    return { x, y: rect.height * y };
  };
  const railPercentForStageX = stagePercent => {
    const stageRect = stage.getBoundingClientRect();
    const railRect = rail.getBoundingClientRect();
    const stageX = stageRect.left + stageRect.width * stagePercent;
    return Math.max(4,Math.min(96,((stageX-railRect.left)/railRect.width)*100));
  };
  const setGripSpan = (container, scale = 1.06) => {
    grip.style.setProperty('--grip-span', `${Math.max(72, (container?.offsetWidth || 72) * scale)}px`);
  };
  const make = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  };
  const makeLink = ([label, href, target]) => {
    const link = make('a', '', label);
    link.href = href;
    if (target) link.dataset.depotTarget = target;
    if (/^https?:/.test(href)) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
    if (href.endsWith('.pdf')) link.download = '';
    return link;
  };
  const renderContent = container => {
    const data = window.umarDepotContent?.[container.dataset.depotContainer];
    if (!data) return;
    dockContent.replaceChildren();
    const header = make('div','depot-dock-header');
    header.append(make('span','depot-card-kicker',data.kicker));
    const close = make('button','depot-dock-close','Back to depot');
    close.type = 'button'; close.dataset.depotBack = '';
    header.append(close);
    dockContent.append(header);
    const heading = make('h2','',data.title); heading.tabIndex = -1;
    dockContent.append(heading);
    if (data.role) dockContent.append(make('p','depot-card-role',data.role));
    (data.paragraphs || []).forEach(copy => dockContent.append(make('p','',copy)));
    if (data.featured) {
      const feature = make('article','depot-content-featured-project');
      const art = make('div','depot-pulse-placeholder');
      art.setAttribute('role','img');
      art.setAttribute('aria-label','Pulse app screenshot placeholder; authentic app screens have not been supplied.');
      art.append(make('span','','SCREEN IMAGERY PENDING'),make('strong','',data.featured.title));
      const copy = make('div','depot-pulse-feature-copy');
      copy.append(make('span','depot-card-kicker',data.featured.eyebrow));
      const status = make('span','depot-pulse-status',data.featured.status);
      const description = make('p','',data.featured.copy);
      const link = makeLink(data.featured.link);
      link.className='depot-pulse-case-link';
      copy.append(status,description,link);
      feature.append(art,copy);
      dockContent.append(feature);
    }
    (data.entries || []).forEach(([title, copy, ...links]) => {
      const entry = make('article','depot-content-entry');
      entry.append(make('strong','',title));
      if (copy) entry.append(make('p','',copy));
      const validLinks = links.filter(item => Array.isArray(item) && item.length > 1);
      if (validLinks.length) {
        const row = make('div','depot-card-links');
        validLinks.forEach(item => row.append(makeLink(item)));
        entry.append(row);
      }
      dockContent.append(entry);
    });
    (data.groups || []).forEach(group => {
      const row = make('div','depot-skills');
      group.forEach(skill => row.append(make('b','',skill)));
      dockContent.append(row);
    });
    if (data.stateLab) {
      const demo = make('div','depot-state-lab');
      demo.append(make('strong','','State Lab'));
      const controls = make('div','depot-state-controls');
      for (const state of ['idle','loading','success','error']) {
        const button = make('button','',state[0].toUpperCase()+state.slice(1));
        button.type = 'button'; button.dataset.previewState = state;
        button.setAttribute('aria-pressed',String(state === 'idle')); controls.append(button);
      }
      demo.append(controls,make('p','depot-state-output','Idle — ready for a new request.'));
      dockContent.append(demo);
    }
    if (data.process) dockContent.append(make('p','depot-process',data.process.join(' → ')));
    if (data.note) dockContent.append(make('p','depot-content-note',data.note));
    if (data.links?.length) {
      const row = make('div','depot-card-links');
      data.links.forEach(item => row.append(makeLink(item)));
      dockContent.append(row);
    }
  };
  const exposeDock = open => {
    dock.classList.toggle('is-open',open);
    dock.toggleAttribute('inert',!open);
    dock.setAttribute('aria-hidden',String(!open));
    hero.classList.toggle('depot-content-open',open);
  };
  const closeDock = async () => {
    exposeDock(false);
    await wait(durations.reveal);
  };
  const lowerTo = async y => { setRodTo(y); await wait(durations.lower); };
  const returnActive = async () => {
    const current = machine.active;
    if (!current) return;
    setState('RETURNING');
    current.classList.remove('is-open');
    current.setAttribute('aria-expanded','false');
    current.querySelector('.depot-trigger').setAttribute('aria-expanded','false');
    await closeDock();
    await wait(durations.doors - durations.reveal);
    const origin = pilePointFor(current);
    // The crane and held box return together, preserving their relative alignment.
    setRodTo(origin.y);
    setCraneX(origin.x);
    current.classList.remove('is-selected');
    await wait(durations.lift);
    current.classList.remove('is-gripped');
    setGripSpan(null);
    hero.style.setProperty('--rod-length','24px');
    await wait(durations.lift);
    machine.active = null;
    machine.activeOrigin = null;
  };
  const pickup = async container => {
    machine.target = container;
    setState('MOVING');
    const source = pilePointFor(container);
    setCraneX(source.x);
    hero.style.setProperty('--rod-length','24px');
    await wait(durations.travel);
    setState('LOWERING');
    await lowerTo(source.y);
    setState('GRABBING');
    setGripSpan(container);
    container.classList.add('is-gripped');
    await wait(durations.grab);
    setState('LIFTING');
    container.classList.add('is-selected');
    const destination = displayPoint();
    setCraneX(railPercentForStageX(destination.x));
    setRodTo(destination.y);
    await wait(durations.lift);
    setState('OPENING');
    container.classList.add('is-open');
    await wait(durations.doors);
    renderContent(container);
    exposeDock(true);
    machine.active = container;
    machine.activeOrigin = source;
    machine.target = null;
    container.setAttribute('aria-expanded','true');
    container.querySelector('.depot-trigger').setAttribute('aria-expanded','true');
    setState('OPEN');
    if (machine.keyboard) dockContent.querySelector('h2')?.focus({preventScroll:true});
  };
  const runSelection = async container => {
    if (!container || (container === machine.active && machine.state === 'OPEN')) return;
    if (machine.active) await returnActive();
    await pickup(container);
  };
  const drain = async () => {
    if (machine.running) return;
    machine.running = true;
    try {
      while (machine.pending) {
        const command = machine.pending;
        machine.pending = null;
        machine.keyboard = command.keyboard;
        machine.priorFocus = command.focus;
        if (command.type === 'close') {
          if (machine.active && machine.active.dataset.depotContainer !== 'intro') await returnActive();
          else if (machine.active) await returnActive();
          setState('IDLE');
          if (command.restoreFocus?.isConnected) command.restoreFocus.focus({preventScroll:true});
        } else {
          await runSelection(command.container);
        }
      }
    } catch (error) {
      console.error('Depot animation recovered from an error.',error);
      exposeDock(false);
      containers.forEach(item => {
        item.classList.remove('is-open','is-selected','is-gripped');
        item.setAttribute('aria-expanded','false');
        item.querySelector('.depot-trigger')?.setAttribute('aria-expanded','false');
      });
      machine.active = machine.target = null;
      machine.activeOrigin = null;
      hero.style.setProperty('--rod-length','24px'); setCraneX('86%'); setState('IDLE');
    } finally {
      machine.running = false;
      if (machine.pending) drain();
    }
  };
  const activate = (container, {keyboard=false, focus=document.activeElement}={}) => {
    if (!container) return;
    // Latest requested target wins while a mechanical sequence is in progress.
    machine.pending = {type:'select',container,keyboard,focus};
    drain();
  };
  const close = ({restoreFocus=document.activeElement,keyboard=false}={}) => {
    machine.pending = {type:'close',restoreFocus,keyboard,focus:restoreFocus};
    drain();
  };
  const byId = id => containers.find(item => item.dataset.depotContainer === id);
  containers.forEach(item => {
    item.setAttribute('aria-expanded','false');
    item.querySelector('.depot-trigger')?.setAttribute('aria-expanded','false');
  });
  exposeDock(false);
  setCraneX('86%');
  hero.style.setProperty('--rod-length','24px');
  setState('IDLE');
  containers.forEach(container => container.querySelector('.depot-trigger').addEventListener('click',event => {
    activate(container,{keyboard:event.detail===0,focus:event.currentTarget});
  }));
  hero.addEventListener('click',event => {
    const back = event.target.closest('[data-depot-back]');
    if (back) { close({restoreFocus:machine.active?.querySelector('.depot-trigger'),keyboard:event.detail===0}); return; }
    const preview = event.target.closest('[data-preview-state]');
    if (preview) {
      const output=preview.closest('.depot-state-lab')?.querySelector('.depot-state-output');
      const copy={idle:'Idle — ready for a new request.',loading:'Loading — working through the request.',success:'Success — the action completed.',error:'Error — the request needs another try.'};
      preview.closest('.depot-state-lab')?.querySelectorAll('[data-preview-state]').forEach(button=>button.setAttribute('aria-pressed',String(button===preview)));
      if(output) output.textContent=copy[preview.dataset.previewState];
      return;
    }
    const link=event.target.closest('[data-depot-target]');
    if (link && hero.contains(link)) {
      event.preventDefault();
      if (moreMenu?.contains(link)) {
        moreMenu.classList.remove('is-open');
        moreButton?.setAttribute('aria-expanded','false');
      }
      const target=byId(link.dataset.depotTarget);
      if(target) { history.replaceState(null,'',link.getAttribute('href')); activate(target,{keyboard:event.detail===0,focus:link}); }
    }
  });
  hero.addEventListener('keydown',event => {
    if (event.key === 'Escape' && (machine.active || moreMenu?.classList.contains('is-open'))) {
      event.preventDefault();
      if (moreMenu?.classList.contains('is-open')) { moreMenu.classList.remove('is-open'); moreButton?.setAttribute('aria-expanded','false'); }
      close({restoreFocus:machine.active?.querySelector('.depot-trigger'),keyboard:true});
    }
  });
  moreButton?.addEventListener('click',() => {
    const open=moreMenu.classList.toggle('is-open'); moreButton.setAttribute('aria-expanded',String(open));
  });
  document.addEventListener('click',event => {
    if (!event.target.closest('.depot-tools') && moreMenu?.classList.contains('is-open')) { moreMenu.classList.remove('is-open'); moreButton.setAttribute('aria-expanded','false'); }
  });
  const resizeObserver = new ResizeObserver(() => {
    if (machine.active && machine.state === 'OPEN') {
      const p=displayPoint(); setCraneX(railPercentForStageX(p.x)); setRodTo(p.y);
    } else if (machine.target && ['MOVING','LOWERING','GRABBING'].includes(machine.state)) {
      const p=machine.state==='MOVING' ? pilePointFor(machine.target) : pointFor(machine.target);
      setCraneX(p.x);
      if(machine.state!=='MOVING') setRodTo(p.y);
    } else if (machine.target && ['LIFTING','OPENING'].includes(machine.state)) {
      const p=displayPoint(); setCraneX(railPercentForStageX(p.x)); setRodTo(p.y);
    } else if (machine.active && machine.state === 'RETURNING') {
      const p=pilePointFor(machine.active); setCraneX(p.x); setRodTo(p.y);
    }
  });
  resizeObserver.observe(stage);
  document.addEventListener('visibilitychange',() => {
    if (document.hidden && !machine.running) { setCraneX('86%'); hero.style.setProperty('--rod-length','24px'); }
  });
  hero.classList.add('depot-enhanced');
  const requested=location.hash.match(/^#depot-(work|about|process|contact)$/)?.[1];
  const initialTarget=requested==='process' ? byId('journey') : byId(requested||'');
  if (initialTarget) activate(initialTarget);
  if (reduced.matches && !initialTarget) {
    // The static intro remains visible in the left column; users can still open any dock.
    hero.dataset.depotReducedMotion='true';
  }
})();
