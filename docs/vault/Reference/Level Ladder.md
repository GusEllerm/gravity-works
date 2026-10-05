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
| `kitchen01` | `kitchen01.level.ts` | the tutorial: three pieces, one gap, launch | 3 (`gapLip`, `drop`, `landing`) | 3 | 2.25 | done — par build finishes headless WITH MARGIN (seed-stable, release-speed-range finish); a build missing any tray piece CANNOT finish against the anchored fixtures (stage-3 promise fix); the one-way ORDER is still authoring intent (ask #3) |
| `kitchen02` | `kitchen02.level.ts` | a CHOICE: two lines across one gap; the lazy one is faster | 5 (`straight`×2, `gapLip`, `drop`, `landing`) | 3 | 2.35 | done, **with the curve rung BLOCKED** (ask #1) — the curve is fixture run-out past the cup; both lines finish (par 2.317 s, arc 2.442 s). Stage-3 coherence: ONE 0.18 m `straight` geometry (the tray seats both copies identically) and `trayParams` for the two kinds the lazy par never places |
| `kitchen03` | `kitchen03.level.ts` | the bowl on the set; gap verbs at speed | 5 (`straight`×2, `gapLip`, `drop`, `landing`) | 5 | 2.65 | done, **with the bowl line BLOCKED** (ask #1 + ask #4) — the tray IS the par build's multiset (5/5 placeable, one 0.15 m straight geometry), rim built + socketed (`bowl.in`/`bowl.out`), timed line runs past it; par 2.617 s |
| `kitchen04` | `kitchen04.level.ts` | the tap hazard: affordance before hazard — the drips mark the sink the arc must fly | 4 (`gapLip`, `drop`, `landing`, `straight`) | 4 | 2.55 | done, **hazard live** (ask #2a delivered, [[Modules/hazards]]) — tray = the par line's exact multiset (learnability pass: the spare `straight` ×2 was Playtest G's "which 4 of 5" wall); ALL 24 whole-tray orders finish builder-anchored (2.47–3.12 s, test-gated), par ORDER beatable at 2.47 s; par replays bit-identical with the zone (flies the patch, 2.517 s); the patch is a TELLS-not-a-TOLL on every buildable line — grip physics measured on the ground build as HAZARD PROBE (hash diverges, wet faster — low-drag plastic), the probe is not a route (its bridged deck can't reach the anchored cup, `fell`; ask #2b) |
| `kitchen05` | `kitchen05.level.ts` | everything + one forced trade-off (one landing, one booster, two gaps) | 6 (`gapLip`×2, `drop`×2, `landing`, `booster`) | 6 | 2.40 | done — both wrong allocations measured to NOT finish; par beatable, not obvious; chains the PINNED original gap (the trade-off needs an unforgiving gap). Coherence-checked unchanged: tray = the par build's exact multiset (6/6) |
| `kitchen-sandbox` | `kitchen05.level.ts` | the set unlocked (`sandbox: true`, no budget) | none (all pieces ×99) | 5 | 2.70 | done — reference build finishes (2.667 s), on one 0.175 m straight geometry |

The other sets follow at their own stage (the bedroom shipped FOUR rungs
at stage 4 — below — and the bathroom FOUR right after it; the garden and
garage explorations are ratified but their ladders are later waves); the
ladder is otherwise empty.

## The bedroom ladder (stage 4 — four rungs)

| id | file | teaches | tray (budget) | par pieces | par time | status |
|---|---|---|---|---|---|---|
| `bedroom01` | `bedroom01.level.ts` | the cable: RIDE OVER, don't fly — no lip exists | 3 (`straight`×2, `drop`) | 3 | 2.35 | done — the three-piece fit is the ONLY builder-mountable fit (every omission `fell` anchored, all three whole-tray orders finish); 0.20 m single `straight` geometry, `KITCHEN_GAP` dip, ramp 0.28 |
| `bedroom02` | `bedroom02.level.ts` | a CHOICE off the mattress: stay high or drop to the pillow — high is faster | 5 (`straight`×3, `drop`, `landing`) | 3 | 2.40 | done — par 2.367 vs soft 2.575 (chained, both finish, test-asserted); `trayParams` carries the two pieces the par never places; ANCHORED: only the high line reaches the cup (soft `fell` 18 cm below — ask #2b, pinned by test) |
| `bedroom03` | `bedroom03.level.ts` | the trade-off: one launch, which catcher do you buy? | 5 (`straight`×2, `gapLip`, `drop`, `landing`) | 4 | 2.70 | done, **the tunnel THIRD line BLOCKED** (ask #5 + ask #4) — hard `drop` catch 2.667 beats the soft 0.32 m `landing` 2.708 (chained); whole tray finishes ANY order sampled (2.483–2.558, beats par, loses the pieces star — no Playtest-G wall); `drawer.in`/`drawer.out` exported as `propSockets` through the level's mount, with the tangent-sign defect stated |
| `bedroom04` | `bedroom04.level.ts` | everything, one tray, no guesses (capstone) | 4 (`straight`, `gapLip`, `drop`, `landing`) | 4 | 2.70 | done — tray = the par's exact multiset, ALL 24 whole-tray orders finish anchored (2.467–3.300, test-gated), par ORDER beatable at 2.467 s; lamp-shadow drama is pure staging (the set's own `LAMP.bulb` practical) |

The bedroom rungs join the shipped ladder after `kitchen05`
(`nextLevelId('kitchen05') === 'bedroom01'`); `bedroomSetPlacement`
mounts the ratified set UNDER the run (x = rail midpoint, −15 cm off the
corridor, floor 5 mm under the LOWEST authored deck). The `kitchen-sandbox`
row above remains the only sandbox; the bedroom sandbox follows the same
shape at its own stage.

## The bathroom ladder (stage 4 — four rungs)

| id | file | teaches | tray (budget) | par pieces | par time | status |
|---|---|---|---|---|---|---|
| `bathroom01` | `bathroom01.level.ts` | the wet patch enters: grip is HALVED, and the patch is ridden AROUND (flown), not through | 3 (`gapLip`, `drop`, `landing`) | 3 | 2.25 | done — par = the L01 flight over the drain sink, BIT-IDENTICAL wet vs dry; every omission `fell` anchored; 5 of 6 whole-tray orders finish (`landing>drop>gapLip` pinned falling); the THROUGH line is the tray-unbuyable probe (diverges wet, wet FASTER — low drag, not folk physics) |
| `bathroom02` | `bathroom02.level.ts` | the CHOICE: lazy rim line vs the showy straight at the drain (the tunnel mouth is staging) | 5 (`straight`×2, `gapLip`, `drop`, `landing`) | 3 | 2.35 | done — lazy 2.350 beats drain 2.550 chained; ANCHORED both lines still reach and the lazy one still wins (2.350 vs 2.367 — ask #2b bites LESS here, pinned); whole tray finishes every order SAMPLED (2.292–2.392) — the CHOICE tray is not whole-order-invariant (39 of 60 swept; same property as bedroom02's 13 of 20 — the invariant gate is the capstone's); `trayParams` seats the launch pieces the par never places |
| `bathroom03` | `bathroom03.level.ts` | the TRADE-OFF: height over the tub wall (hard, dry catch) vs the splash-patch route (soft catch in a live wet zone) | 5 (`straight`×2, `gapLip`, `drop`, `landing`) | 4 | 2.70 | done — par 2.667 flies the splash (wet == dry bit-for-bit); splash chained 2.708 finishes and `fell` anchored (ask #2b); splash WET 2.675 beats its own dry yet still loses to the dry high line — the ladder's tightest grip statement; whole tray finishes every order SAMPLED (best 2.483); CHOICE tray, not whole-order-invariant (42 of 60 swept) |
| `bathroom04` | `bathroom04.level.ts` | everything, one tray, a live puddle under the flight (capstone) | 4 (`straight`, `gapLip`, `drop`, `landing`) | 4 | 2.70 | done — ALL 24 whole-tray orders finish (the inherited 0.3 m sweep seating — the lesson IS the order-invariant sum) AND the sampled orders replay wet == dry; par ORDER beatable at 2.467 s; the decked probe diverges wet-faster — the toll stays theoretical (ask #1's lateral half) |

The bathroom rungs join the ladder after `bedroom04`
(`nextLevelId('bedroom04') === 'bathroom01'`); `bathroomSetPlacement`
mounts the ratified variant-A set UNDER the run on the bedroom rule with a
wider offset (x = rail midpoint, −25 cm off the corridor — variant A's prop
cluster spans ±0.29 m of its origin — yaw 0, floor 5 mm under the LOWEST
authored deck; rows re-derived by `tests/unit/bathroom-levels.test.ts`).
The set is the RATIFIED porcelain cathedral ported from the dev scene by
the Level Designer as a minimal art port — the ramp/material friction that
implies is stated in `Sessions/2026-10-08 Stage 4 - bathroom ladder.md`,
not tuned away.

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
- **Bedroom drawer-tunnel THIRD line — BLOCKED** (stage 4): the bore never
  crosses the level corridor and `drawer.in`'s tangent points OUT of the
  bore (against the bowl-socket travel convention); one sign flip plus a
  lane-crossing bore anchor (ask #5), and prop-socket seating in the
  builder (ask #4), put the tunnel on the map. The RUNG is not blocked —
  both authored lines of `bedroom03` finish and the catch trade-off is
  measured.
- **Hazard mechanic (wet patch) — pending** (ask #2a): `World` reads no grip
  zones; L04's par line is designed grip-independent so it is provable today.
- **`Level.finishSocket` — pending** (ask #2b): the cup currently rides at
  the end of whatever build replays, so routing cannot fail in replay; in
  the real builder it must. This is also why L01's wrong-order experiments
  all finish. Stage-3 coherence measured what the anchored mounting does to
  the second lines: L02's arc route reaches the fixed cup and is then FASTER
  than the lazy par (2.242 s vs 2.317 s), and L04's ground build (hazard
  probe since the learnability pass) does not
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
every line each level authors (par, L02's arc, L05's two wrong allocations;
L04's ground build left the roster at the L04 learnability pass — it is a
hazard probe, not a tray-affordable route), and `trayParityBuild` (the builder's seating of the par line,
fixtures anchored) must serialize byte-identically to `parBuild()`. Kinds a
par line never places but an alternate line needs are declared in
`trayParams` (see [[Concepts/Levels]]). Since stage 4 the same three
assertions run over EVERY authored level of the shipped ladders in
`tests/unit/bedroom-levels.test.ts` ("ladders (kitchen + bedroom +
bathroom) — tray ⊇ parBuild on EVERY authored level") — the rule covers
the whole shipped ladder, kitchen rungs included; since the bathroom pass
it spans THREE ladders and the bathroom's `drain`/`splash` alternates ride
in the same roster (the bathroom hazard PROBES, like kitchen04's ground
build, are NOT in the line roster — hazard replay, not tray-affordable
routes).

## Notes

- The `Level` shape is the contract: `{ id, name, seed, startSocket, budget,
  par, maxTime, placeholderBuild() }` ([[Concepts/Track Kit]]); kitchen
  levels extend it with `tray`/`parBuild`/`fixtures`/`hazards`/`propSockets`
  as `KitchenLevel` — see [[Concepts/Levels]] for why (per-kind budget has no
  home in the contract yet). `placeholderBuild()` returns the par build, so
  share/replay need no new seam.
- Every kitchen parBuild finishing is a TEST, not a claim:
  `tests/unit/kitchen-levels.test.ts` (plus L02's second line and L04's
  ground PROBE finishing, L04's whole-tray order sweep finishing — the
  Playtest G learnability gate — and L05's wrong allocations NOT
  finishing).
- `getLevel` now resolves 15 ids once the level modules are imported (feel
  rig, kitchen six, bedroom four, bathroom four); the kitchen files self-register via
  `registerLevel` on import
  (`feeltrack.level.ts`'s registry), the bedroom files do the same
  (`registerBedroom` wraps it), and the bathroom files likewise
  (`registerBathroom`). `src/boot.ts` imports every rung (the
  kitchen wiring since stage 2, the bedroom wiring added at the stage-4
  ladder pass, the bathroom wiring at the stage-4 bathroom pass — a file outside the level designer's lane, touched only to
  register and extend the `void [...]` list; `LADDER` itself is the
  campaign table).
- Nothing on this rung-blocking blocks stage 3 integration; the blocked
  halves are additive data edits when ask #1 lands.
