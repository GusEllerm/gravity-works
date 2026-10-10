---
tags: [session, program, stage-7]
livedocs: snapshot
---
# 2026-10-09 — Program T3.3: the farewell (crane pass + three doors)

Level Designer lane on branch `p3-farewell` (worktree gw-f1): Action Plan 2026-10-09 T3.3, PAIRED with
the doors, answering player-truth #7 ("the campaign's final state is a two-star bar with Retry and
Share — no farewell, no summary of the thirty rungs, no view of the whole house"). Law decided here:
Decision Log 2026-10-09 "the FAREWELL law"; surfaces in [[ui]], [[camera]], [[Levels]], [[src]].

## What shipped

- **THE PAGE** — `src/pages/farewell.ts`, the fourth page module beside share/select/intro. Clearing
  `porch05` for the first time (FINISHED, not a dev preview) replaces `resultPanel.show` with ONE crane
  pass: the six registry sets (`SETS[*].build`, canonical origins, laid along x at `CRANE_STEP`) in
  campaign order, the eye DWELLING on each room, LIFTING between them, settling wide on the whole house
  — carrying the player's own star tally per room (`farewellTally` folds `progress.stars` through
  `CAMPAIGN`; off-ladder stars score nowhere). EVENT-DRIVEN like the replay: `farewellPlan` is pure
  (constants in, timed reveals out), `cranePose(t)` pure in t — deterministic machine to machine, zero
  new physics, zero hash movement; `replay:all` untouched (post-run cinema, not sim).
- **THE THREE DOORS** (one click each, all shipped surfaces): the porch sandbox
  (`?level=porch-sandbox`), today's daily run (`?daily=1`, one-use rig params stripped the Next way),
  and the SHARE film of the porch05 run — the payload frozen at the same terminal edge the share
  button would have used, landing on the replay page that opens playing.
- **ONCE PER SAVE** — `gravity-works.farewell.seen` in localStorage, outside the schema (the
  premiere's idiom), written AT THE FIRE: a skipped crane is still an honest seen (skip lands the
  whole summary + doors at once). `?farewell=1` forces for the spec family; `?farewell=off` opts out
  and `tests/e2e/goto.ts` now appends it beside `post=off`/`intro=off` (spec-url unit rows updated) —
  no ladder-walking spec is ever ambushed by the ending. Reduced motion = the STATIC SUMMARY PAGE
  (same tally, same doors, no camera, the set row never built).
- **BOOT WIRING** — one gate + one call in the terminal edge (`farewellRun`), the frame loop parked on
  `farewellHolds` (the `contextLost` idiom) with `startRun` guarded, chrome hidden via the shared
  `.gw-premiere` class, styles in `ui/shell.css` (`#gw-farewell-*`, one layer under the hiccup), seam
  `__gwFarewellState()`. Everything else at the edge (stars, sound, hash note, daily chip) unchanged —
  ONLY the bar is replaced.

## Gate runs

`npm run replay:all` **30/30 verified** (nothing in the sim graph moved). Unit suite **865/865** (new
`tests/unit/farewell.test.ts`: param family, tally fold, plan determinism + camera sweep; the
spec-url contract extended). Full e2e **232 passed, 1 skipped** at this HEAD (new
`tests/e2e/farewell.spec.ts` ×7: bar replaced with reveals in campaign order; skip lands the whole
truth and the next clear is back at the ordinary bar; each door lands — sandbox, daily, share film
verified; second clear = ordinary result; reduced-motion static page), port 4661, honest budgets for
the crane spec (180 s cap, real waits). Shell idle baseline unchanged.

## Known edges (said, not smoothed)

- The crane page renders its OWN canvas (six sets, no post stack); SwiftShader machines pay a second
  or two of "looking over the house…" while the set chunks load — the build phase is a plan event and
  a skip owns it too.
- The doors are navigations; there is deliberately no fourth door back to the played board (the
  campaign is finished — sandbox/daily/film are its afterlife). If the whole farewell is closed
  mid-crane without a door, the ending is still spent (the flag fired) — Retry and the level select
  remain; accepted as the price of "ONCE per save".
- The daily door opens the CURRENT page at today's seed (the T3.4 shape as shipped — "the same level
  at the day's seed"), i.e. porch05 daily; a one-rung-per-day board stays the plan's own unbuilt ask.
