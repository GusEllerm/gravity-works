---
tags: [reference, levels]
---
# Level Ladder

> [!abstract] Role
> The ladder of levels the game ships with — the registry in
> `src/world/levels/` (`LEVELS`, `getLevel`), one file per level, each a
> plain-data `Level` plus a kit-piece `Build`. This note tracks which rungs
> exist, what each teaches, its budget, and its pars. Level design itself:
> [[Concepts/Levels]].

## The kitchen ladder (stage 3)

| id | file | teaches | tray (budget) | par pieces | par time | status |
|---|---|---|---|---|---|---|
| `feeltrack` | `feeltrack.level.ts` | (test track, not a rung) | — (16) | 9 | 3.05 | the accept-line level, unchanged |
| `feeltrack` | `feeltrack.level.ts` | (test track, not a rung) | — (16) | 9 | 3.05 | the accept-line level, unchanged |
| `kitchen01` | `kitchen01.level.ts` | the tutorial: three pieces, one gap, launch | 3 (`gapLip`, `drop`, `landing`) | 3 | 2.25 | done — par build finishes headless WITH MARGIN (seed-stable, release-speed-range finish); a build missing any tray piece CANNOT finish against the anchored fixtures (stage-3 promise fix); the one-way ORDER is still authoring intent (ask #3) |
| `kitchen02` | `kitchen02.level.ts` | a CHOICE: two lines across one gap; the lazy one is faster | 5 (`straight`×2, `gapLip`, `drop`, `landing`) | 3 | 2.35 | done, **with the curve rung BLOCKED** (ask #1) — the curve is fixture run-out past the cup; both lines finish (par 2.317 s, arc 2.442 s). Stage-3 coherence: ONE 0.18 m `straight` geometry (the tray seats both copies identically) and `trayParams` for the two kinds the lazy par never places |
| `kitchen03` | `kitchen03.level.ts` | the bowl on the set; gap verbs at speed | 5 (`straight`×2, `gapLip`, `drop`, `landing`) | 5 | 2.65 | done, **with the bowl line BLOCKED** (ask #1 + ask #4) — the tray IS the par build's multiset (5/5 placeable, one 0.15 m straight geometry), rim built + socketed (`bowl.in`/`bowl.out`), timed line runs past it; par 2.617 s |
| `kitchen04` | `kitchen04.level.ts` | the tap hazard: affordance before hazard, wet patch halves grip | 5 (`gapLip`, `drop`, `landing`, `straight`×2) | 4 | 2.55 | done, **hazard live** (ask #2a delivered, [[Modules/hazards]]) — par replays bit-identical with the zone (flies the patch, grip-independent to the bit; 2.517 s); ground line drives THROUGH it (hash diverges, finishes 0.06 s faster — low-drag plastic). Stage-3 coherence: the par's run-out is the ground line's 0.3 m straight (one tray geometry) |
| `kitchen05` | `kitchen05.level.ts` | everything + one forced trade-off (one landing, one booster, two gaps) | 6 (`gapLip`×2, `drop`×2, `landing`, `booster`) | 6 | 2.40 | done — both wrong allocations measured to NOT finish; par beatable, not obvious; chains the PINNED original gap (the trade-off needs an unforgiving gap). Coherence-checked unchanged: tray = the par build's exact multiset (6/6) |
| `kitchen-sandbox` | `kitchen05.level.ts` | the set unlocked (`sandbox: true`, no budget) | none (all pieces ×99) | 5 | 2.70 | done — reference build finishes (2.667 s), on one 0.175 m straight geometry |

Five other sets: five rungs each at their own stage (stage 4+); the ladder is
otherwise empty.

## Pars

**The `par time` column is now `npm run pars` output** (`src/world/pars.json`,
measured with the raycast car, shipped `ROLL_COEF`, headless `World` via
`src/replay/replay.ts`, ceil to 0.05 s; `npm run pars -- --check` guards
drift). The script landed after this table was first hand-written, and it now
imports every level file (`scripts/gen-pars.mjs`), so no cell is a designer's
private measurement any more; each `Level.par.time` in the level file is the
fallback only. **`parPieces` is on the TRAY basis** — the reference build's
pieces minus the level's `fixtures` — because every consumer (the tray
counter, the budget gate, the star line, the panel's "N pieces — par M")
counts what the PLAYER places; counting the whole build is what made the
deployed panel read "3 pieces — par 5" on a three-piece tutorial. The
`par pieces` column below is that same number, and
`tests/unit/kitchen-levels.test.ts` pins `pars.json`'s value to it per rung.
Re-derived for every rung at the L01 promise fix (stage 3): L01–L04 and the
sandbox chain the re-authored `KITCHEN_GAP`; `kitchen05` pins the original
numbers. Re-measured again at the stage-3 **ladder coherence** pass, which
unified every level's `straight` geometry (a tray seats one geometry per kind)
— L02/L03/L04/sandbox pars and hashes moved, `kitchen01`/`kitchen05` did not.
`par pieces` = pieces of the tray the reference build places (≤ tray total).

## What is blocked, honestly

- **Rung "mid-run yaw geometry" — BLOCKED** (affects L02's curve, L03's bowl
  line): no yaw piece (`curve`/`bigCurve`/`sbend`/`bank`) is drivable by
  either shipped car at any swept radius/speed/bank — the car ploughs off or
  dies on the yaw seam. The piece case is one paragraph in
  [[Concepts/Levels]] (ask #1) for the Feel Engineer. The LEVELS are not
  blocked — all five par builds finish (`tests/unit/kitchen-levels.test.ts`)
  — but L02 and L03 do not yet deliver their yaw half.
- **Hazard mechanic (wet patch) — pending** (ask #2a): `World` reads no grip
  zones; L04's par line is designed grip-independent so it is provable today.
- **`Level.finishSocket` — pending** (ask #2b): the cup currently rides at
  the end of whatever build replays, so routing cannot fail in replay; in
  the real builder it must. This is also why L01's wrong-order experiments
  all finish. Stage-3 coherence measured what the anchored mounting does to
  the second lines: L02's arc route reaches the fixed cup and is then FASTER
  than the lazy par (2.242 s vs 2.317 s), and L04's ground line does not
  reach it at all (`fell`) — see [[Concepts/Levels]] §The same data replayed
  the way the BUILDER mounts it.
- **L01's three-piece fit could not be placed with the shipped target walk —
  FIXED at this pass (a `src/ui/builder.ts` change, i.e. the systems lane's
  file — flagged there for review).** `targets()` lists free exits in ARRAY
  order and `initialBuild` mounts the fixtures first, so after the `gapLip`
  took the ramp's exit the next "place" aimed at `end of finishCup` and the
  `drop` was seated on the cup (`fell` at 2.41 s, hash `0951a819`, reproduced
  headlessly). `place()` now moves the default target to the exit the placed
  piece created. This is why `tests/e2e/shell.spec.ts` "building all three tray
  pieces launches, finishes…" was red on `main` from the moment the L01 promise
  fix merged: not a geometry regression — the data-level promise test was green
  the whole time and the same three pieces seated on the RUN finish
  byte-identically to the par (`d32417dc`). It is green on this branch.

## The tray ⊇ parBuild rule

Every rung's tray must AFFORD its reference build (plus the fixtures), and
because the builder seats a held kind with ONE geometry per kind, no par line
may use one kind at two sizes. Both halves are a test, not a comment: the
"tray ⊇ parBuild" describe in `tests/unit/kitchen-levels.test.ts` checks
every line each level authors (par, L02's arc, L04's ground, L05's two wrong
allocations), and `trayParityBuild` (the builder's seating of the par line,
fixtures anchored) must serialize byte-identically to `parBuild()`. Kinds a
par line never places but an alternate line needs are declared in
`trayParams` (see [[Concepts/Levels]]).

## Notes

- The `Level` shape is the contract: `{ id, name, seed, startSocket, budget,
  par, maxTime, placeholderBuild() }` ([[Concepts/Track Kit]]); kitchen
  levels extend it with `tray`/`parBuild`/`fixtures`/`hazards`/`propSockets`
  as `KitchenLevel` — see [[Concepts/Levels]] for why (per-kind budget has no
  home in the contract yet). `placeholderBuild()` returns the par build, so
  share/replay need no new seam.
- Every kitchen parBuild finishing is a TEST, not a claim:
  `tests/unit/kitchen-levels.test.ts` (plus L02/L04 second lines finishing
  and L05's wrong allocations NOT finishing).
- `getLevel` now resolves 7 ids once the kitchen modules are imported; the
  kitchen files self-register via `registerLevel` on import
  (`feeltrack.level.ts`'s registry). Wiring the game entry (`src/boot.ts`)
  to import them is a one-line systems task, deliberately not done here —
  `src/boot.ts` is not the level designer's file.
- Nothing on this rung-blocking blocks stage 3 integration; the blocked
  halves are additive data edits when ask #1 lands.
