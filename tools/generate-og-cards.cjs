// Regenerates the social preview cards in assets/og/ (1200x630 JPEGs used by og:image / twitter:image).
// Usage: start a local server (python3 -m http.server 4173 --bind 127.0.0.1), then run: npm run og-cards
// Edit the text in the `cards` object below if your headline or projects change.
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(path.join(process.cwd(), 'node_modules/playwright'));
const base = 'http://127.0.0.1:4173/';
const out = path.join(process.cwd(), 'assets/og');
fs.mkdirSync(out, { recursive: true });

const css = `
*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;overflow:hidden;background:#05070f;color:#eef1fb;font-family:Inter,system-ui,sans-serif}
.card{position:relative;width:1200px;height:630px;overflow:hidden;background:radial-gradient(720px 520px at 86% 18%,rgba(77,226,255,.17),transparent 62%),radial-gradient(640px 460px at 0% 100%,rgba(143,128,255,.22),transparent 62%),linear-gradient(180deg,#070b1a,#05070f)}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(148,190,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(148,190,255,.07) 1px,transparent 1px);background-size:48px 48px}
.edge{position:absolute;left:0;right:0;bottom:0;height:6px;background:linear-gradient(90deg,#4de2ff,#8f80ff 50%,#c8ff4d)}
.copy{position:absolute;z-index:2;left:72px;top:62px;bottom:62px;width:610px;display:flex;flex-direction:column}
.brand{font:700 40px/1 'Space Grotesk';letter-spacing:-.06em}.brand span{color:#c8ff4d}
.kicker{margin-top:54px;display:flex;align-items:center;gap:14px;font:500 17px/1 'JetBrains Mono';letter-spacing:.09em;color:rgba(238,241,251,.78)}
.dot{width:12px;height:12px;border-radius:50%;background:#c8ff4d;box-shadow:0 0 0 6px rgba(200,255,77,.18),0 0 18px rgba(200,255,77,.8)}
h1{margin:22px 0 0;font:700 76px/1 'Space Grotesk';letter-spacing:-.05em}
h1 em{font-style:normal;color:transparent;background:linear-gradient(95deg,#4de2ff,#7c9bff 50%,#b39cff);-webkit-background-clip:text;background-clip:text}
.sub{margin-top:26px;font:400 25px/1.4 Inter;color:rgba(238,241,251,.74)}
.foot{margin-top:auto;display:flex;align-items:center;gap:16px;font:500 19px/1 'JetBrains Mono';color:rgba(238,241,251,.85)}
.pill{padding:12px 18px;border-radius:999px;background:#c8ff4d;color:#05070f;font:600 19px/1 Inter}
.art{position:absolute;z-index:1;right:0;top:0;bottom:0;width:560px;display:grid;place-items:center}
.halo{position:absolute;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,rgba(143,128,255,.32),rgba(77,226,255,.1) 45%,transparent 68%)}
`;
const page = (copy, art) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=JetBrains+Mono:wght@500&family=Space+Grotesk:wght@700&display=block" rel="stylesheet">
<style>${css}</style></head><body><div class="card"><div class="grid"></div>${art}<div class="copy">${copy}</div><div class="edge"></div></div></body></html>`;

const cards = {
  home: page(
    `<div class="brand">umar<span>✳</span></div>
     <div class="kicker"><span class="dot"></span>AVAILABLE FOR PROJECTS</div>
     <h1>I build Flutter apps <em>and websites.</em></h1>
     <div class="sub">Umar Saeed Qureshi · Flutter &amp; web developer</div>
     <div class="foot"><span class="pill">Start a project ↗</span>umarsaeedqureshi.com</div>`,
    `<div class="art"><div class="halo"></div><img src="${base}assets/character-still.webp" style="position:absolute;bottom:-6px;right:-130px;width:820px;-webkit-mask-image:linear-gradient(180deg,#000 72%,transparent 99%)"></div>`),
  beautify: page(
    `<div class="brand">umar<span>✳</span></div>
     <div class="kicker"><span class="dot"></span>CASE STUDY · LIVE ON GOOGLE PLAY</div>
     <h1>Beautify<em>✳</em></h1>
     <div class="sub">A salon booking app I built and published on my own, with Flutter and Firebase.</div>
     <div class="foot"><span class="pill">Read the case study ↗</span>umarsaeedqureshi.com</div>`,
    `<div class="art"><div class="halo" style="background:radial-gradient(circle,rgba(255,122,217,.3),rgba(143,128,255,.12) 45%,transparent 68%)"></div><img src="${base}assets/projects/beautify/discover.webp" style="position:relative;width:250px;padding:9px;border-radius:38px;background:linear-gradient(145deg,#23283a,#0a0c14);box-shadow:0 40px 80px -24px rgba(0,0,0,.85),0 0 60px -10px rgba(255,122,217,.45);transform:rotate(-5deg)"></div>`),
  'magnet-masala': page(
    `<div class="brand">umar<span>✳</span></div>
     <div class="kicker"><span class="dot"></span>CASE STUDY · LIVE ONLINE STORE</div>
     <h1>Magnet Masala<em>✳</em></h1>
     <div class="sub">An online store for a Pakistani spice brand, with WhatsApp ordering.</div>
     <div class="foot"><span class="pill">Read the case study ↗</span>umarsaeedqureshi.com</div>`,
    `<div class="art" style="width:600px"><div class="halo" style="background:radial-gradient(circle,rgba(255,154,82,.3),rgba(143,128,255,.12) 45%,transparent 68%)"></div><div style="position:relative;width:520px;overflow:hidden;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:#0b0d14;box-shadow:0 40px 80px -30px rgba(0,0,0,.85),0 0 70px -20px rgba(255,154,82,.5);transform:translateX(70px)"><div style="display:flex;gap:6px;padding:10px 12px;background:#121521"><i style="width:9px;height:9px;border-radius:50%;background:#ff5f57"></i><i style="width:9px;height:9px;border-radius:50%;background:#febc2e"></i><i style="width:9px;height:9px;border-radius:50%;background:#28c840"></i></div><img src="${base}assets/projects/magnet-masala/home-desktop.webp" style="display:block;width:100%;aspect-ratio:16/10;object-fit:cover;object-position:top"></div></div>`),
  pulse: page(
    `<div class="brand">umar<span>✳</span></div>
     <div class="kicker"><span class="dot" style="background:#4de2ff;box-shadow:0 0 0 6px rgba(77,226,255,.18),0 0 18px rgba(77,226,255,.8)"></span>CASE STUDY · IN DEVELOPMENT</div>
     <h1>Pulse<em>✳</em></h1>
     <div class="sub">An all-in-one app for students: classes, tasks, routines and study sessions in one place.</div>
     <div class="foot"><span class="pill">Read the case study ↗</span>umarsaeedqureshi.com</div>`,
    `<div class="art"><div class="halo" style="background:radial-gradient(circle,rgba(77,226,255,.3),rgba(143,128,255,.14) 45%,transparent 68%)"></div><svg viewBox="0 0 320 80" style="position:relative;width:440px;overflow:visible"><path d="M0 46H92l12 0 8-14 8 14h10l10-38 11 66 10-28h16l9-9 9 9H320" fill="none" stroke="rgba(77,226,255,.25)" stroke-width="2"/><path d="M92 46l12 0 8-14 8 14h10l10-38 11 66 10-28h16l9-9 9 9" fill="none" stroke="rgba(77,226,255,.3)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M92 46l12 0 8-14 8 14h10l10-38 11 66 10-28h16l9-9 9 9" fill="none" stroke="#4de2ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`)
};

(async () => {
  const browser = await chromium.launch();
  const tab = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await tab.goto(base + 'robots.txt');
  for (const [name, html] of Object.entries(cards)) {
    await tab.setContent(html, { waitUntil: 'networkidle' });
    await tab.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
    const file = path.join(out, `${name}.jpg`);
    await tab.screenshot({ path: file, type: 'jpeg', quality: 86 });
    console.log(file.replace(process.cwd() + '/', ''), Math.round(fs.statSync(file).size / 1024) + 'KB');
  }
  await browser.close();
})();
