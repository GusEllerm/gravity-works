import { test, expect } from '@playwright/test'
import zlib from 'node:zlib'
import { FEELTRACK } from '../../src/world/levels/feeltrack.level.ts'
import { encodeShareUrl, type ShareCodec } from '../../src/share/share.ts'

/**
 * Share -> replay -> verified, end to end. The fragment here is produced by
 * the Node-side zlib codec (proving the zlib/CompressionStream interop
 * direction against the real page), embedded with a deliberately wrong hash
 * first — the page must say `mismatch` and echo the hash it recomputed — and
 * then with that hash embedded, which the page must confirm as `verified`.
 */
const zlibCodec: ShareCodec = {
  deflate: async (b) => new Uint8Array(zlib.deflateRawSync(Buffer.from(b))),
  inflate: async (b) => new Uint8Array(zlib.inflateRawSync(Buffer.from(b))),
}

test('a share fragment replays in the page and verifies against the embedded hash', async ({ page }) => {
  const build = FEELTRACK.placeholderBuild()
  const payload = { levelId: build.levelId, seed: build.seed, hash: '00000000', build }

  const wrongUrl = await encodeShareUrl(payload, zlibCodec)
  await page.goto(`/${wrongUrl}`)
  await expect(page.locator('#gw-replay-status')).toHaveText('mismatch', { timeout: 60_000 })
  const echoed = await page.locator('#gw-replay-hash').textContent()
  const recomputed = echoed?.match(/replay hash ([0-9a-f]{8})/)?.[1]
  expect(recomputed, `page echoed no hash in ${JSON.stringify(echoed)}`).toMatch(/^[0-9a-f]{8}$/)

  const rightUrl = await encodeShareUrl({ ...payload, hash: recomputed! }, zlibCodec)
  await page.goto(`/${rightUrl}`)
  await expect(page.locator('#gw-replay-status')).toHaveText('verified', { timeout: 60_000 })
})

test('a garbage fragment says so instead of throwing', async ({ page }) => {
  await page.goto('/#s=not!!valid')
  await expect(page.locator('#gw-replay-status')).toHaveText('invalid share link')
})
