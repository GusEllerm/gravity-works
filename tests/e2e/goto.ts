/**
 * THE SHARED SPEC GATE (program P3, the post-ON/intro-ON defaults CI audit).
 * Since program T1.2 two things are DEFAULT for the first time: the post
 * stack (`?post=off` is the opt-out, `src/boot.ts`'s `wantPost`) and the
 * premise beat (`src/pages/intro.ts`, skipped by webdriver signal and by
 * `?intro=off`). On a GPU box the defaults cost nothing; on CI's
 * SwiftShader the composer alone turned every actionability wait into a
 * frame-paced crawl (the 2026-10-09 mass-timeout event). The rule is
 * CI-honesty first: NON-VISUAL specs opt OUT explicitly through this one
 * door, and the specs that TEST the post/intro/tint-shift visuals —
 * `visual`, `filmstrip`, the `replay`/`share-replay`/`determinism` hash
 * family, `perf*`, `post-dispose`, `intro`, `harness` —
 * never import this file and ride the DEFAULT page, with honest budgets.
 * (`playtest-y-clickdiff` is named by the P3 audit as the cautionary tale:
 * its name sounds visual, its assertions are event-order probes — it is a
 * NON-visual rider and imports the door like everyone else.)
 *
 * The opt-out is PARAMETER, not mutation: `specUrl` appends only what the
 * address does not already carry (an explicit `post=`/`intro=` on the call
 * always wins), so a spec that opts back IN through the same helper keeps
 * its own word. Absolute URLs (`about:blank`) pass through untouched.
 */
import type { Page } from '@playwright/test'

/** What every spec landing rides unless the address says otherwise:
 *  post off (raw `renderer.render`, the SwiftShader-honest baseline) and
 *  the premise beat explicitly off (`?intro=off`, the URL-affordance
 *  family — Decision Log 2026-10-07 "recorded, not stripped"). */
export const SPEC_DEFAULT_PARAMS = { post: "off", intro: "off" } as const

/** Pure, unit-tested (`tests/unit/spec-url.test.ts`): append the spec
 *  defaults without ever overriding an explicit param or a hash route. */
export function specUrl(url: string): string {
  if (!url.startsWith('/')) return url // absolute (about:blank …): hands off
  const u = new URL(url, 'http://spec.invalid')
  for (const [key, value] of Object.entries(SPEC_DEFAULT_PARAMS)) {
    if (!u.searchParams.has(key)) u.searchParams.set(key, value)
  }
  return u.pathname + (u.search || '') + u.hash
}

/** The one `goto` non-visual specs use. Same contract as `page.goto`,
 *  plus the defaults above. */
export function goto(page: Page, url: string, opts?: Parameters<Page['goto']>[1]) {
  return page.goto(specUrl(url), opts)
}
