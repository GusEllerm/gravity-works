---
livedocs: snapshot
---

# 2026-10-11 Round2 ghosts (Lane B — ghosts without spoilers)

Snapshot note (sessions are never checked). Branch `r2-ghosts`, worktree `gw-z2`, base `95dad40`.
Action Plan: [[Reference/Action Plan 2026-10-11]] Lane B — the two engineering debts (N3, N4) and
THE GHOST LAW the player evaluation scored into the 7 → 6.5 drop.

## What shipped

1. **THE GHOST LAW** (`src/pages/ghost.ts` + the rail in `src/boot.ts`; Decision Log 2026-10-11):
   the par ghost is an afterlife affordance. On a campaign rung the rail is OFF and LOCKED until the
   rung's FIRST finish — the save as it already stands (`parGhostEarned`: `progress.stars` ≥ 1 or the
   legacy `reached` carry; no schema bump, no hash). Before the finish the toggle carries the calm
   word `ghost: par — finish first to race` (aria-disabled; a press persists nothing, arms nothing,
   teases nothing). The first finish runs the unlock edge in the terminal-status block: word retires,
   plain toggle returns remembered ON (reduced-motion law still decides; a stored explicit OFF stands —
   the setting governs WHERE a line may show, the law gates the SPOILER). Sandboxes + the daily
   (`?daily=1`/`?seed=`) default ON unlocked — they ARE the afterlife surfaces. The friend link is an
   explicit ask, never locked (`raceFriendLink` enables the rail for their car even on an unearned rung).
2. **Trace CACHE per (level, build)** (engineering N4): `cachedGhostTrace` keys `deriveGhostTrace` on
   `serialize(build)` bytes for the shell's lifetime (16-entry FIFO; a failed wind evicts its key), both
   par and friend winds go through it; seams `__gwGhostTraceCache()`/`__gwGhostTraceCacheClear()`;
   probe `scripts/probe-ghost-flip.mjs`.
3. **`boundaryStopped()` guard at the top of `farewell.ts`'s crane loop** (engineering N3, mirrors
   `share.ts:766`): a throwing farewell frame lands the ERROR face with the plan clock frozen instead
   of a stutter under it. Mutation-proved red-on-break (guard neutered → the new freeze test goes red).
4. **Chrome**: the locked word replaces the toggle label on unearned rungs — the fresh-save idle page
   therefore RE-BASELINES `tests/visual/darwin/shell-kitchen01-idle.png` deliberately: 3 354 px differ,
   bounding box x 0–165 × y 504–524 (the bottom-left chip band — the word), canvas world untouched.

## Proofs

- unit: 888 passed (44 files) — the law's truth table + cache hit/miss/evict added to `tests/unit/ghost.test.ts`.
- e2e ghosts.spec: the law family (unearned k02 build phase — the evaluator's scenario; unlock-on-first-finish
  remembered ON + persists; explicit OFF persists; sandbox/daily default ON; friend link races on a locked rung)
  + the cache test measuring the hit flip against a forced cold MISS. Existing ghost tests seed an EARNED rung
  (the law is why: they prove the racing, so the rung is finished in the seed).
- e2e farewell.spec: + the freeze test (700 ms apart, `__gwFarewellState().t` identical under the face).
- `npm run replay:all`: 30 rungs, all verified (visuals-only law held).
- Perf probe (kitchen01, `?level=kitchen01`, post off): BEFORE (base `95dad40`, preview 4780) flips
  **187 / 150 / 139 ms** — every flip pays the full headless wind. AFTER (this branch, preview 4790)
  **182 ms once, then 0 ms / 3 ms** — `{"size":1,"hits":2,"misses":1}`. The flip got ~50–∞× cheaper
  after the first wind; the wind itself is unchanged work, just paid once.

## Ports

e2e lanes ran E2E_PORT 4791/4792/4793; perf probes used preview servers 4780 (base worktree, removed)
and 4790. Nothing on the default 4173.

## Follow-ups (not this lane's)

- Lane C owns the 20 px band (its rect spec may want the wider locked toggle counted at 633 — the
  p4-chrome disjointness passed here because the word grows the bar rightward, away from `#gw-save`).
- If a future rung ever ships finishable-but-0-star, `parGhostEarned` must gain that truth; today
  `starsFor` pays "finish at all" first, so stars ≥ 1 IS the first-finish record.

## CI (branch proof)

PR #9 (draft, `r2-ghosts` → main): run 38089651756 — check SUCCESS (typecheck, `replay:all`,
`npm test`, full `playwright test`, `livedocs verify`), determinism-atlas ubuntu+macos success.
`git ls-remote origin r2-ghosts` → `0e4a9fb` before the CI pass. main untouched.
