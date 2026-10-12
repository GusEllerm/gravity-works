import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'
const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4533', '--strictPort'], { stdio: 'ignore' })
try {
  const base = 'http://127.0.0.1:4533'
  for (let d = Date.now() + 30000; ; ) {
    try { if ((await fetch(base + '/')).ok) break } catch {}
    if (Date.now() > d) throw new Error('no server')
    await new Promise(r => setTimeout(r, 200))
  }
  const b = await chromium.launch({ headless: true, args: ['--use-angle=metal'] })
  const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage()
  await p.goto(base + '/?harness=1&scene=freehouse&shot=hero', { waitUntil: 'domcontentloaded' })
  await p.waitForFunction(() => window.__sceneReady === true, undefined, { timeout: 60000 })
  await p.screenshot({ path: 'tmp-freehouse.png' })
  await b.close()
} finally { server.kill('SIGTERM') }
