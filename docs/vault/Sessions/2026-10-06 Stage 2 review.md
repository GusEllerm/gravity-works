---
livedocs: snapshot
tags: [session, stage-2, review]
---
# 2026-10-06 Stage 2 review (reviewer, fresh eyes)

## Verdict

**BLOCK.** The spine is real and most accept lines are honestly proven — but
`main` is red: `tests/e2e/builder.spec.ts` fails on HEAD and the CI run for the
HEAD commit failed on the remote. A stage cannot close with a broken test on
`main` (§3 git conventions; stage 0's own accept line "CI green"). One
acceptance-line test cannot prove its line, and two cross-module constants
disagree while a comment claims they don't. None of the rest is deep; the
fix-list is short and mechanical.

## Findings

### [BLOCKER] builder e2e is red on `main` — CI on HEAD failed

- `tests/e2e/builder.spec.ts:19,39` expects `8 / 16 pieces`;
  `152ccc1` grew `FEEL_TRACK_KINDS` to 9 (the `drop` catch piece,
  `src/feel/feeltrack.ts:92`) and the placeholder build now lays 9. The
  place/remove steps (lines 30/44) are off by one too — three assertions to fix.
- Repro: `npx playwright test` → `1 failed, 8 passed` (`unexpected value
  "9 / 16 pieces"`). Remote confirms: CI run 37225506086 on HEAD
  (`5b80cac`) — **failure**, `npx playwright test` step.
- Scenario: every push from here on inherits a red suite; the "tests pass"
  evidence for the stage becomes unfalsifiable. Fix is a five-minute spec bump.

### [MAJOR] The loop-gate test does not assert the [2.25, 2.75] R band for the bisect — the accept line rides on two hand-picked grid rows

- `tests/unit/feel.test.ts:191-192`: `const t = loopThreshold(variant,
  LOOP_RADIUS, { iters: 7 }); expect(Number.isFinite(t.heightOverR))` — the
  bisect's value is only checked for **finiteness**. It goes red if the top of
  the bracket (4.5 R) DNFs, never for a threshold that has drifted to 3 R.
  The §7.1 "within 10 % of theory" line is enforced only by the adjacent
  pointwise pair `loopTry(2.2R)===false / loopTry(2.4R)===true` and by prose
  in `tools/feel.mjs`. The band itself lives only in a comment
  (`src/feel/feeltrack.ts:55`).
- Worse, the predicate being bisected is **known non-monotonic**: the same
  test documents dip rows (`n` at 2.5, 3.0, 3.5 R). A bisection
  (`run.ts loopThreshold`, lo/hi halving) assumes monotonicity; on today's
  phase lottery it can land anywhere in the dip structure and stay green.
  The feel table shows exactly this: `loopH` (coef 0, 10 iters) bisects to
  **3.03 R** while `loopHfric` (coef 0.117) says 2.51 R and the footer text
  claims "the threshold sits at 2.4 r" — three numbers for one metric, only
  one of which is the shipped-friction reading.
- Fix: bisect with a monotone-safe scan (or bisect `min completion above a
  floor`), then assert `expect(t.heightOverR).toBeGreaterThanOrEqual(2.25);
  toBeLessThanOrEqual(2.75)` at the shipped `ROLL_COEF`, and reconcile the
  tool footer.

### [MAJOR] Two `TRACK_FRICTION` constants disagree; the comment that claims they match is false

- `src/world/world.ts:57` — `TRACK_FRICTION = 0.6`, doc: *"same constant the
  feel rigs' boxes use"*. `src/feel/kittrack.ts:23` — `TRACK_FRICTION =
  0.05`. The feel rigs' boxes no longer exist (the chord-slab code was
  deleted), so the sentence points at nothing; the game's colliders are built
  at 0.6 (`world.ts:224`) and every metric rig at 0.05.
- Scenario: for the shipped raycast variant this is currently inert — the
  chassis is filtered out of track contacts and it has no wheel bodies, so
  nothing physically touches the deck and the friction value never acts. But
  the moment anything contacts for real (the `wheelColliders` variant in
  `World`, stage-3 hazards, chassis contact when the filter changes) the game
  and the harness are driving different rubber, and the "jointed variant
  agrees at every height" claim (feel.test header) has only ever been measured
  on the 0.05 rig. One constant, imported, like `ROLL_COEF` already is.

### [MAJOR] Physics crutch-pile: every fix is documented, none is removal-tested (complexity debt)

`src/physics/car.ts` grew guide bumps, droop tethers, the deck-alignment
wishbone torque, a rotor damper bolted onto it (`wDeck` lead **plus**
`+0.15*(rawTrue−wc)`, `car.ts:570`), anti-roll and scrub torques, and the
rail-wall spring — each introduced to cure a symptom of the previous one. The
energy audit (`tools/feel.mjs audit`) is real evidence that no site injects
work today, and I reran it: honest. But it is not in CI and no test would go
red if any single crutch were deleted; the only feedback loop is the metrics
table. Two tell-tales that crutches still lean on each other: the alignment
law needs the `em < 0.85` gate because its own mean-normal steering
"reverse-rotates the car" past 50° (comment admits it), and the threshold
grid's mid-window dips (2.5/3.0/3.5 R fail while 2.4/2.6 pass) are accepted as
"bounce-phase physics" — a suspension-phase lottery inside an acceptance
metric is a crutch-interaction signature until proven otherwise. Judgment:
**major debt, not a blocker** — the numbers measured are honest; the structure
is fragile for stage-3 tuning. Ask: a cheap "crutch-off" ablation matrix in
`tools/feel.mjs` (each term zeroed, metrics delta tabled, committed alongside
any tuning change) so removal regressions are evidence, not folklore.

### [MINOR] Hot-path comments that claim things the code no longer does

- `src/physics/car.ts:264` `carStep` doc: *"Variant b applies spring/damper
  forces; a relies on joints"* — joints were dropped entirely (the
  `jointedStep` doc says so 30 lines later); the a/b labels also flip meaning
  between that file and `run.ts`/`world.ts`.
- `src/world/world.ts:95` `SPAWN_ADVANCE` note says "this 5 cm"; the constant
  (`world.ts:96`) is 0.02 m.
- `src/feel/feeltrack.ts:41` `FEEL_DROP_HEIGHT` comment concludes "the feel
  track drops 0.45 m"; the value is 0.52 (changed in `152ccc1`, comment not).
  `src/world/levels/feeltrack.level.ts:6` repeats "the 0.45 m drop" and its
  chain listing omits the `drop` catch piece.
- `docs/vault/Performance/stage-2.md` "the 8-piece kit feel track" — 9 now.
- `src/feel/feeltrack.ts:70-91`: two stacked JSDoc blocks on
  `FEEL_TRACK_KINDS`, the first superseded by the second — one is dead prose.
- `src/physics/car.ts:483`: garbled comment fragment *"measured 教训:"*.
- `docs/vault/Home.md` Deferred still says the cross-platform determinism
  claim is "awaiting the stage-2 harness measurement" — the harness has now
  measured MATCH (below); record the outcome.

### [MINOR] House style / duplication

- `src/physics/sim.ts:139` `addStaticTrimesh` is exported and called by nobody
  (§11 no-dead-code).
- `tools/feel.mjs` `loopFric` hard-codes `coef: 0.117` while everywhere else
  imports `ROLL_COEF = 0.12` — a mirrored tuning constant with no reason
  given.
- `tests/unit/feel.test.ts:52-53` `MEASURED_DROP_ROLL_*_M = 0.0` are tripwire
  bands, not measurements — the names say MEASURED.

### Notes (not defects, verified honest as documented)

- Determinism hash: quant touches every hashed body (7 words each), NaN/±inf
  get distinct poison words (feel.test proves they differ), the run seed is
  folded into the hash initial (`world.ts seededHash`) and seed-sensitivity is
  asserted (`world.test.ts:47`); a build edit and a 0.001° param nudge both
  move the hash (replay.test + my probe below). Replay termination is
  terminal-status-or-fixed-cap — no clock, no race.
- The node↔browser determinism spec deliberately reports instead of asserting
  (§2.2). It currently prints `node 099403c7 browser 099403c7 => MATCH (page
  verdict: verified)`; since the outcome is known-good, promote the assertion
  next stage so a future mismatch cannot pass CI silently. The replay e2e
  already hard-asserts `verified` on the same machine, so the share-line holds.
- Perf integrity: mode A's 60 fps branch has an honest escape hatch on
  SwiftShader and mode B gates only stepping — so CI can never fail the
  *rendered* line. But the local run genuinely shows median 16.70 ms, max
  16.80 ms, keep-up 1.00 (a workload over budget would show 33 ms frames), and
  the Performance note says all of this plainly, including that no real GPU
  has yet rendered the game. Deferred to stage-3 re-measure, as noted there.

## Execution log

| command | result |
|---|---|
| `npm run typecheck` | clean |
| `npm test` | **90/90 pass** (11 files) |
| `npx playwright test` | **1 failed, 8 passed** — `builder.spec.ts:19` expects `8 / 16 pieces`, page says `9 / 16` |
| `gh run list` / view 37225506086 | CI **failure** on HEAD `5b80cac`, step `npx playwright test` (same builder assertion) |
| `npx playwright test determinism` | node↔node `099403c7 == 099403c7` MATCH (361 steps, finished); node↔browser `099403c7 == 099403c7` MATCH, page verdict `verified` |
| `npx playwright test perf` | rendered: 285 frames, median 16.70 ms, p95 16.70, max 16.80 (~59.9 fps), keep-up 1.00; stepping-only: median 1.04 ms/10-step frame, 16.1x headroom |
| manual probe (scratch, not committed) | `landing` piece `angle +0.001°` → hash `099403c7 → b197df02` **CHANGED** |
| `grep -rn "it.fails\|.skip\|.only" tests/` | none — no disguised skips |
| `git status` | clean before and after |

`node tools/feel.mjs` table (verbatim, HEAD 5b80cac):

```text
variant        | finish | peak     | apex                    | landing  | rollDrop | rollRamp | loopH            | loopHfric | hash
wheelColliders | 3.31 s | 3.00 m/s | 1.08 / 0.99 m/s (1.09x) | 0.061 Ns | 0.00 m   | 2.47 m   | 0.303 m (3.03 r) | 2.51 r    | cee96961 =repeat
raycastWheels  | 3.31 s | 3.00 m/s | 1.08 / 0.99 m/s (1.09x) | 0.061 Ns | 0.00 m   | 2.47 m   | 0.303 m (3.03 r) | 2.51 r    | 90d4cd69 =repeat
```

## Accept lines, one by one

| line | proven? |
|---|---|
| a car completes the feel track | yes — feel.test `completed===true` with grounded-cup capture, 3.31 s; game path finished at step 361 in the determinism spec |
| loop threshold within 10 % of theory | measured yes (2.51 R shipped-friction), **asserted no** — bisect value is not band-gated (MAJOR above) |
| headless determinism test passes | yes — node↔node hard-asserted, build/seed/param sensitivity tested, my probe agrees |
| a share link replays to the same hash | yes — replay.spec hard-asserts `verified`; node→browser cross-check currently MATCH |
| 60 fps with post stack off | locally yes (~59.9 fps, keep-up 1.00); CI can only gate stepping + keep-up — documented honestly, no real-GPU measurement yet |

## To clear the BLOCK

1. Bump `builder.spec.ts` counters 8→9 (and 9→10 on the place step), land, CI green.
2. Band-assert the real bisect in the loop-gate test; fix the monotonicity story or replace bisect with a scan.
3. One shared `TRACK_FRICTION` (import, not mirror), comment corrected.
4. Sweep the stale comments listed above; delete `addStaticTrimesh` or wire it; record the node↔browser MATCH in the Decision Log/Home.
