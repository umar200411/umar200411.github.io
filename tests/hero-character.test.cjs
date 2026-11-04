const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'hero-character.js'), 'utf8');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function mountHero({ reducedMotion = false } = {}) {
  const handlers = new Map();
  const element = () => ({
    classList: { add() {}, remove() {} },
    addEventListener(name, handler) { handlers.set(this.name + name, handler); }
  });
  const hero = element(); hero.name = 'hero';
  hero.getBoundingClientRect = () => ({ left: 0, width: 900 });
  const canvas = element(); canvas.name = 'canvas';
  canvas.getContext = () => ({ clearRect() {}, drawImage() {} });
  const fallback = element(); fallback.name = 'fallback';
  const message = element(); message.name = 'message'; message.textContent = 'Currently building something interesting.';
  const hello = element(); hello.name = 'hello';
  const root = element(); root.name = 'root'; root.dataset = { heroState: 'idle' };
  root.closest = () => hero;
  root.querySelector = selector => ({
    '.hero-character-canvas': canvas,
    '.hero-character-fallback': fallback,
    '.hero-reaction-text': message,
    '.hero-say-hello': hello
  })[selector];
  const document = {
    hidden: false,
    querySelector: () => root,
    addEventListener() {}
  };
  const media = query => ({ matches: query.includes('pointer: fine') || (reducedMotion && query.includes('prefers-reduced-motion')), addEventListener() {} });
  vm.runInNewContext(source, {
    document,
    window: { umarHeroSequences: {}, setTimeout },
    matchMedia: media,
    performance,
    requestAnimationFrame: callback => setTimeout(() => callback(performance.now()), 16),
    cancelAnimationFrame: clearTimeout,
    clearTimeout,
    Image: class {}
  });
  return {
    root, message,
    move(x) { handlers.get('heropointermove')({ clientX: x, target: { closest: () => null } }); },
    leave() { handlers.get('heropointerleave')(); },
    hello() { handlers.get('helloclick')(); }
  };
}

test('left and right zones dwell, hold, then return to idle with missing frames', async () => {
  const ui = mountHero();
  ui.move(100);
  await wait(370);
  assert.equal(ui.root.dataset.heroState, 'lookLeft');
  assert.equal(ui.message.textContent, 'Someone’s over here?');
  await wait(2500);
  assert.equal(ui.root.dataset.heroState, 'idle');
  ui.leave();
  await wait(1450);
  ui.move(800);
  await wait(370);
  assert.equal(ui.root.dataset.heroState, 'lookRight');
});

test('a rapid left-to-right move queues the latest directional reaction', async () => {
  const ui = mountHero();
  ui.move(100);
  await wait(370);
  assert.equal(ui.root.dataset.heroState, 'lookLeft');
  ui.move(800);
  await wait(300);
  assert.equal(ui.root.dataset.heroState, 'lookLeft');
  await wait(2450);
  assert.equal(ui.root.dataset.heroState, 'lookRight');
});

test('the center greeting takes priority after a directional reaction returns', async () => {
  const ui = mountHero();
  ui.move(100);
  await wait(370);
  ui.move(450);
  await wait(300);
  assert.equal(ui.root.dataset.heroState, 'lookLeft');
  await wait(2450);
  assert.equal(ui.root.dataset.heroState, 'noticeVisitor');
});

test('the greeting advances through distinct states and remains replayable', async () => {
  const ui = mountHero();
  ui.hello();
  await wait(180);
  assert.equal(ui.root.dataset.heroState, 'noticeVisitor');
  await wait(970);
  assert.equal(ui.root.dataset.heroState, 'removeHeadset');
  await wait(970);
  assert.equal(ui.root.dataset.heroState, 'wave');
  await wait(970);
  assert.equal(ui.root.dataset.heroState, 'pointDown');
  await wait(1850);
  assert.equal(ui.root.dataset.heroState, 'idle');
  ui.hello();
  await wait(180);
  assert.equal(ui.root.dataset.heroState, 'noticeVisitor');
});

test('reduced motion keeps the static visual and gives the greeting a quiet reset', async () => {
  const ui = mountHero({ reducedMotion: true });
  ui.hello();
  assert.equal(ui.root.dataset.heroState, 'wave');
  await wait(1900);
  assert.equal(ui.root.dataset.heroState, 'idle');
});
