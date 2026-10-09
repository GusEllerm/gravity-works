import { chromium } from '@playwright/test'
const browser = await chromium.launch()
const ctx = await browser.newContext({ baseURL: 'http://localhost:4571' })
const A = await ctx.newPage()
const B = await ctx.newPage()
for (const [n, p] of [['A', A], ['B', B]]) {
  p.on('pageerror', (e) => console.log(`[${n}] pageerror:`, String(e)))
  p.on('console', (m) => { if (m.type() === 'error') console.log(`[${n}] console.error:`, m.text()) })
}
const dump = async (label) => {
  const raw = await A.evaluate(() => localStorage.getItem('gravity-works.save'))
  const env = raw ? JSON.parse(raw) : null
  console.log(label, env ? Object.keys(env.builds) + ' | ' + Object.entries(env.builds).map(([k, v]) => k + ':' + (typeof v === 'string' ? 'plain' : v.t)).join(',') : 'null')
}
await A.goto('/?level=kitchen01')
console.log('A ready', await A.locator('#gw-status').textContent())
console.log('A visibility', await A.evaluate(() => document.visibilityState))
await B.goto('/?level=kitchen02')
console.log('B ready', await B.locator('#gw-status').textContent())
console.log('B visibility', await B.evaluate(() => document.visibilityState))
console.log('A visibility after B open', await A.evaluate(() => document.visibilityState))
const place = async (p, kind) => { await p.click(`#gw-tray-${kind}`); await p.click('#gw-place') }
await Promise.all([place(A, 'gapLip'), place(B, 'straight')])
await A.waitForTimeout(1500)
await dump('after round 1 + settle:')
await Promise.all([place(A, 'drop'), place(B, 'drop')])
await A.waitForTimeout(1500)
await dump('after round 2 + settle:')
await A.waitForTimeout(3000)
await dump('after settle 2:')
await browser.close()
