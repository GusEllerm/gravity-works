---
tags: [plan, program, stage-7]
livedocs: living
---
# Action Plan 2026-10-09 — "shows its debug face" program

> [!abstract] Inputs
> Three evaluations ([[Evaluation 2026-10-09 player]] **4/10**, [[Evaluation 2026-10-09 engineering]] **6/10** robustness,
> [[Evaluation 2026-10-09 design]] **6.5/10**) and two recommenders ([[Recommendations 2026-10-09 creative]],
> [[Recommendations 2026-10-09 technical]]). Success bar: a fresh EVALUATOR (not playtester) re-scores the player
> experience ≥ 7/10 with zero new data-loss or silent-failure findings.

## Diagnosis (three sentences)

The engine is unusually trustworthy and the game under-delivers it: the shipped look is OFF by default, the
in-game car is a fallback box, the written-and-judged juice is unconsumed, and a first visit lands in a beige
builder. One gap verb in six costumes keeps the corridor samey, the advice law cannot say the two truths it
will meet in the first ten minutes (empty-tray MOVE, booster sequencing), and there is no ending. Under the
carpet, one true scandal: any unreadable save silently erases the campaign, and no unexpected error anywhere
wears a face.

## Track 0 — Foundations (week 1) — extraction and honesty, zero player-visible change

- **T0.1 `src/ui/advice.ts` extraction** — the eight pure `*KindsFor`/`goalNounFor` derivations leave
  `src/boot.ts` (unit-pinned already); behavior-preserving, the suite is the proof.
- **T0.2 `src/pages/share.ts` + `src/pages/select.ts`** — the share-run/replay page and level select leave
  boot; this is the file future features stop fighting over (technical §1: 30/30 commits touched boot).
- **T0.3 Save quarantine (R1)** — `migrateBlob` never silently `freshSave()`s a PARSEABLE blob: raw moved to
  `gravity-works.save.corrupt-<n>`, one honest settings line, and the already-tested export/import row wired.
  v3 stays reserved; no schema bump.
- **T0.4 Error boundary + boot retry (R2/R3, ONE affordance)** — `window` error/unhandledrejection → flush
  autosave, freeze honestly, one overlay with reload; a rejected set-chunk import shows the same face with
  Retry, never a half-page.
- **T0.5 Blindness gates (R5)** — an e2e that KILLS visibility for real (CDP), and a game-shell leak gate
  around `rebuild()` reusing the post-stack counter idiom. These land BEFORE the fix batch, per the
  recommendation, so the fixes can't regress blind.
- **T0.6 Micro batch** — R7 ghost/marker lifted before `world.dispose()` (mirrors the set law), R8 volume
  persist debounced like the build autosave, R9 load-merge-write gets a newest-wins merge instead of leases.

**Gate:** `replay:all` 30/30, suite green, `boot.ts` measurably smaller, mutations for R5 items now RED.

## Track 1 — The face and the feel (weeks 2–3)

- **T1.1 Feel package (PAIRED, one delivery):** the ratified car-a rig IN-GAME (wheels, stripe, die-cast —
  render layer, out of `hashedBodies`), the `JuiceFeed` consumed (squash/dust, reduced-motion honored), the
  landing THUD and surface-honest roll on the existing voice map. The car without the thud is a prettier box.
- **T1.2 First 60 seconds:** post stack ON by default (the perf verdict already proves the ladder at post ON),
  play-camera defocus capped, the build camera framed on the SET not the disc, display face + a five-second
  premise beat (one silent car roll before any builder chrome). Pixel bars/filmstrips re-baselined deliberately.
- **T1.3 Rig repair + grade pass:** bathroom hero scene row, garage side-rig off the AD-failed speckle frame,
  dither speckle at shadow boundaries swept, blown-highs capped. Colour/histogram gates re-baselined per set.

**Gate:** a screenshot diff of a cold first visit vs the evaluation's t+0 shot is a different, better game.

## Track 2 — The voice and the truth (weeks 2–3, after their extractions)

- **T2.1 Advice MOVE-wave (PAIRED):** the empty-tray ORPHAN-PAST-GOAL clause (the verb is MOVE — name the
  piece AND its socket), a Remove that NAMES what it takes, and booster-sequencing honesty (the advice line
  teaches `]` wherever sequencing is the answer; k05 escalates to level-data only if the truth still can't
  be said). This extends the studio's best asset, it does not rewrite it.
- **T2.2 Share first two seconds (after T0.2, in `src/pages/share.ts`):** the link opens PLAYING from frame
  zero on the establishing shot; the verdict is ONE honest line under the player; the hash essay moves below
  the fold. The `verified`/`mismatch` strings specs read stay byte-identical, only re-placed.

## Track 3 — The shape of the game (weeks 3–5)

- **T3.1 Order re-weave:** interleave rooms in `src/world/campaign.ts` so same-grammar rungs sit ≥3 apart
  (nav-data only — ids append-only, ZERO hash movement; unlock-chain specs regenerate their expected-next
  rows). Treats the déjà vu honestly while T3.2 cures it.
- **T3.2 Ghost racing:** the par-build ghost first — derived at level-load from the atlas-par trace, mounted
  visuals-only, excluded from `hashedBodies`, reduced-motion = ghost off; a friend's build IS a ghost via the
  share payload (no server). Prerequisite check first: the canonical piece-ORDER question gets one measured
  probe (does `reify` order-sensitivity ever bite shipped builds?) before any cross-player equality claim.
  *SHIPPED — the probe measured 148/148 order-insensitive; see `Sessions/2026-10-09 Program T3 ghosts`.*
- **T3.3 The farewell (PAIRED with the doors):** porch05 cleared replaces the result bar with one crane pass
  over all six sets carrying the player's own star count, then three doors: sandbox, daily, share.
- **T3.4 Daily challenge (only after T3.2 proves the ghost cheap):** `seed = hash(UTC date)`, one rung/day
  board from the shipped kit, localStorage best-time personal best, no server, honest about being
  single-machine-comparable. *SHIPPED in the ghost lane at the smallest honest shape (the same level at
  the day's seed + a result-screen chip) — `Sessions/2026-10-09 Program T3 ghosts`.*

## Ordering traps (why THIS order)

1. Extraction before features (creative's own sequence note): T1.1/T2.2 would otherwise be boot.ts knife fights.
2. Gates before fixes (T0.5 before T0.6): otherwise the blindness ships again.
3. Car before juice before defocus-cap: all three change the played frame; pixel gates re-baseline once, not thrice.
4. Ghost before daily before farewell-doors: the doors need something to open onto.
5. Any level-data escalation (k05) is a Decision Log decision with a blind-clear proof, never silent.

## Budget & laws

The 30 shipped hashes are frozen (T3.1 touches nav only; anything else that would move a hash is a decision
first). Audio stays event-only behind the firewall; ghosts/juice/cars stay visuals-only outside
`hashedBodies`. Concurrency ≤3 agents; merge discipline unchanged (worktree-HEAD shas, build before push,
marker scans, post-merge stamps).
