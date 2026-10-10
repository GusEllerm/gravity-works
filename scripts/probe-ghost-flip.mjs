// PERFFLIP — the trace-cache probe (engineering N4, Action Plan 2026-10-11
// Lane B): time a `ghost: par` OFF→ON flip until the `gw-ghost-ready` FACT
// (never a timeout) on any origin. On a PRE-cache build every flip is the
// full headless wind; on a cached build the first flip pays the tape and
// every later flip is a Map hit — the note's perf line is this table.
//   node scripts/probe-ghost-flip.mjs http://localhost:<port> [flips]
import { chromium } from '@playwright/test';

const origin = process.argv[2] ?? 'http://localhost:4173';
const flips = Number(process.argv[3] ?? 3);
const seed = `
  let save = {}
  try { save = JSON.parse(localStorage.getItem('gravity-works.save') ?? '{}') } catch { save = {} }
  const progress = save.progress ?? {}
  progress.stars = { kitchen01: 1, ...(progress.stars ?? {}) }
  progress.reached = progress.reached ?? {}
  save.progress = progress; save.v = save.v ?? 2
  save.builds = save.builds ?? {}; save.settings = save.settings ?? {}
  localStorage.setItem('gravity-works.save', JSON.stringify(save))
`;
const browser = await chromium.launch();
const page = await browser.newPage();
await page.addInitScript(seed); // earned rung: the rail is ON (both laws agree here)
await page.goto(`${origin}/?level=kitchen01&post=off&intro=off&farewell=off`);
await page.waitForFunction(() => typeof window.__gwGhostState === 'function', null, { timeout: 30000 });
const times = [];
for (let i = 0; i < flips; i++) {
  await page.click('#gw-ghost-toggle'); // -> off (no wind asked)
  times.push(
    await page.evaluate(
      () =>
        new Promise((resolve, reject) => {
          const t = document.getElementById('gw-ghost-toggle');
          const t0 = performance.now();
          addEventListener('gw-ghost-ready', () => resolve(performance.now() - t0), { once: true });
          setTimeout(() => reject(new Error('flip never landed a ready ghost')), 60000);
          t.click(); // -> on: the wind the cache may make free
        }),
    ),
  );
}
const cache = await page.evaluate(() =>
  typeof window.__gwGhostTraceCache === 'function' ? window.__gwGhostTraceCache() : null,
);
console.log(JSON.stringify({ origin, flips: times.map((t) => Math.round(t)), cache }));
await browser.close();
