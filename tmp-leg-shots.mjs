// session tooling (not committed): crane LEG shots + fail/sandbox rect
// verification at 1280x633 against the preview server.
import { chromium } from '@playwright/test';

const origin = process.env.ORIGIN ?? 'http://localhost:4880';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 633 } });
const page = await ctx.newPage();

// ---- 1. farewell legs -------------------------------------------------
await page.goto(`${origin}/?intro=off&farewell=off&post=off`);
await page.evaluate(() => {
  let save = {};
  try { save = JSON.parse(localStorage.getItem('gravity-works.save') ?? '{}'); } catch { save = {}; }
  const progress = save.progress ?? {};
  const stars = {};
  for (const room of ['kitchen', 'bedroom', 'bathroom', 'garden', 'garage'])
    for (let i = 1; i <= 5; i++) stars[room + '0' + i] = 3;
  for (let i = 1; i <= 4; i++) stars['porch0' + i] = 3;
  progress.stars = { ...stars, ...(progress.stars ?? {}) };
  progress.reached = progress.reached ?? {};
  save.progress = progress; save.v = save.v ?? 2;
  save.builds = save.builds ?? {}; save.settings = save.settings ?? {};
  localStorage.setItem('gravity-works.save', JSON.stringify(save));
});
await page.goto(`${origin}/?level=porch05&build=par&launch=1&farewell=1&intro=off&post=off`);
// wait for the crane phase
await page.waitForFunction(() => {
  const s = window.__gwFarewellState && window.__gwFarewellState();
  return s && s.phase === 'crane';
}, null, { timeout: 60_000 });
for (let leg = 1; leg <= 5; leg++) {
  const mid = 1.8 + (leg - 1) * 1.9;
  await page.waitForFunction((m) => {
    const s = window.__gwFarewellState();
    return s.phase !== 'crane' || s.t >= m;
  }, mid, { timeout: 30_000 });
  const s = await page.evaluate(() => window.__gwFarewellState());
  await page.screenshot({ path: `playtest-r3b/farewell-leg${leg}.png` });
  console.log(`leg ${leg}: captured at t=${s.t.toFixed(2)} phase=${s.phase}`);
}

// ---- 2. fail state rects ----------------------------------------------
const page2 = await ctx.newPage();
await page2.goto(`${origin}/?level=kitchen01&launch=1&intro=off&farewell=off&post=off`);
await page2.waitForFunction(() => {
  const r = document.getElementById('gw-result');
  return r && !r.hidden && r.classList.contains('gw-result-strip');
}, null, { timeout: 60_000 });
const failRects = await page2.evaluate(() => {
  const ids = ['gw-result', 'gw-status', 'gw-callout', 'gw-hash-details', 'gw-ghost-bar', 'gw-save'];
  const out = {};
  for (const id of ids) {
    const el = document.getElementById(id);
    const r = el.getBoundingClientRect();
    out[id] = { shown: !el.hidden && r.height > 0 && getComputedStyle(el).display !== 'none', top: r.top, bottom: r.bottom };
  }
  return out;
});
await page2.screenshot({ path: 'playtest-r3b/fail-633.png' });
console.log('FAIL', JSON.stringify(failRects));

// ---- 3. sandbox rects ---------------------------------------------------
const page3 = await ctx.newPage();
await page3.goto(`${origin}/?level=kitchen-sandbox&intro=off&farewell=off&post=off`);
await page3.waitForFunction(() => /ready/.test(document.getElementById('gw-status')?.textContent ?? ''), null, { timeout: 30_000 });
const sandRects = await page3.evaluate(() => {
  const ids = ['gw-status', 'gw-callout', 'gw-hash-details', 'gw-ghost-bar', 'gw-save', 'gw-tray'];
  const out = {};
  for (const id of ids) {
    const el = document.getElementById(id);
    const r = el.getBoundingClientRect();
    out[id] = { top: Math.round(r.top), bottom: Math.round(r.bottom) };
  }
  out.canvasH = Math.round(document.querySelector('#gw-stage canvas').getBoundingClientRect().height);
  out.scrollH = document.documentElement.scrollHeight;
  return out;
});
await page3.screenshot({ path: 'playtest-r3b/sandbox-633.png' });
console.log('SANDBOX', JSON.stringify(sandRects));

await browser.close();
