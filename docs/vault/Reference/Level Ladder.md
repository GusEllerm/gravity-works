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
| `kitchen02` | `kitchen02.level.ts` | a CHOICE: two lines across one gap; the lazy one is faster — AND every wrong build now TEACHES by WHEN it dies | 4 (`straight`×2, `gapLip`, `drop`) — the UNION of the two lines, none spare | 3 | 1.05 | done, **with the curve rung BLOCKED** (ask #1) — the curve is fixture run-out past the cup; both lines finish on the BUILDER mount (lazy 1.01 s par, arc 1.07 s — the pop costs the hop) and EVERY order of the whole tray finishes (12/12, 1.00–1.13 s, test-gated). THE STAGE-4 FAIL-TIMING PASS: the −12°/0.28 m shared ramp was the CLUSTERING ENGINE (every wrong build AND first try died invisible at 2.2–2.4 s — the ramp-end arrival clock, ~25 000 headless sweep); L02 now steers the release INTO the void on its own short steep chute (−29°, 0.16 m, blend 0.12 — the blend is camera-framing-tuned, not rail-tuned), one 0.11 m `straight` = the L02 `gapLip` span (the reach-sum law intact), and a 0.10 m/0.125 m-lead `drop` — all declared in `trayParams`/level data. The 34-build enumeration dies in THREE VISIBLE FAMILIES (~0.9 ramp-end, ~1.05–1.15 void/bridge, ~1.25 off-the-drop) and NO wrong build finishes (both former pinned exceptions — the ssg catapult, the gd wedge — now fall); par beatable by `drop`-first at 1.00; deaths never airborne above the deck past the cup mouth (x-gate corrected to the deck-plane metric). Fixture-reading note (Q round 2: curve read as scenery): the pre-placed run-out curve IS off the timed rail and rides the SAME track-orange as playable rail (`buildTrackMeshes` is uniform per build) — demoting off-rail rails needs a render-side per-piece flag, HANDOFF, not level data (session log 2026-10-09 K5 booster + fixture reading) |
| `kitchen03` | `kitchen03.level.ts` | the bowl on the set; gap verbs at speed | 5 (`straight`×2, `gapLip`, `drop`, `landing`) | 5 | 2.65 | done, **with the bowl line BLOCKED** (ask #1 + ask #4) — the tray IS the par build's multiset (5/5 placeable, one 0.15 m straight geometry), rim built + socketed (`bowl.in`/`bowl.out`), timed line runs past it; par 2.617 s. Fixture-reading note (Q round 2): the rim pair is off the TIMED rail (run ends at the cup before it) and rides the kit's track orange like every build piece — same render-side handoff as `kitchen02`, not level data |
| `kitchen04` | `kitchen04.level.ts` | the tap hazard: affordance before hazard — the drips mark the sink the arc must fly | 4 (`gapLip`, `drop`, `landing`, `straight`) | 4 | 2.55 | done, **hazard live** (ask #2a delivered, [[Modules/hazards]]) — tray = the par line's exact multiset (learnability pass: the spare `straight` ×2 was Playtest G's "which 4 of 5" wall); ALL 24 whole-tray orders finish builder-anchored (2.47–3.12 s, test-gated), par ORDER beatable at 2.47 s; par replays bit-identical with the zone (flies the patch, 2.517 s); the patch is a TELLS-not-a-TOLL on every buildable line — grip physics measured on the ground build as HAZARD PROBE (hash diverges, wet faster — low-drag plastic), the probe is not a route (its bridged deck can't reach the anchored cup, `fell`; ask #2b) |
| `kitchen05` | `kitchen05.level.ts` | everything + one forced trade-off (one landing, one booster, two gaps) | 6 (`gapLip`×2, `drop`×2, `landing`, `booster`) | 6 | 2.40 | done — the two INTENDED lines finish test-gated (par 2.392, booster FIRST off the ramp; the between-gaps `kitchen05MidBoosterBuild` 2.50 — beatable, not obvious) and the THREE wrong allocations measured to NOT finish (A no-booster, B back-lip `kitchen05LateBoosterBuild`, C the place-LAST `kitchen05LastBoosterBuild` — playtest Q's hint-reading wall; the `booster` callout copy now says spend-EARLY); chains the PINNED original gap (the trade-off needs an unforgiving gap). Coherence-checked unchanged: tray = the par build's exact multiset (6/6) |
| `kitchen-sandbox` | `kitchen05.level.ts` | the set unlocked (`sandbox: true`, no budget) | none (all pieces ×99) | 5 | 2.70 | done — reference build finishes (2.667 s), on one 0.175 m straight geometry |

The other sets follow at their own stage (the bedroom shipped FOUR rungs
at stage 4 — below — and the bathroom FOUR right after it; the garden
ladder is the garden set's later wave, also FOUR, below; and the garage —
the RATIFIED variant-C room — is the campaign's LAST room, FOUR rungs,
below). The ladder is otherwise empty.

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

## The garden ladder (stage 4 — four rungs)

| id | file | teaches | tray (budget) | par pieces | par time | status |
|---|---|---|---|---|---|---|
| `garden01` | `garden01.level.ts` | the SUN-SHADOW line: shaded = cooler, purely visual — read the camera, shadows are never hazards | 3 (`gapLip`, `drop`, `landing`) | 3 | 2.25 | done — the L01 flight under the trellis bars, NO live zone at all (the rung's whole lesson is that the bars are read-only rhythm — the set's `HAZARDS` empty BY LAW); every omission `fell` anchored; 5 of 6 whole-tray orders finish (`landing>drop>gapLip` pinned); `prop:shadowBars` callout |
| `garden02` | `garden02.level.ts` | the CHOICE: lazy slab line vs the showy launch at the drain-pipe bore (the garden's bowl moment re-homed — the set has NO birdbath) | 5 (`straight`×2, `gapLip`, `drop`, `landing`) | 3 | 2.35 | done — lazy 2.350 beats bore 2.550 chained; ANCHORED both reach, lazy still wins 2.350 vs 2.367 (ask #2b bites LESS, the bathroom02 pattern); whole tray finishes every order sampled (2.292–2.392; 78 of 120 swept — choice tray, not order-invariant whole); the BORE RIDE is blocked (staging: mouth frames ~77 cm behind the lane, test-pinned; bowl turn = ask #7a behind ask #1/#4, kitchen L03's pattern) |
| `garden03` | `garden03.level.ts` | the TRADE-OFF, garden flavor: dry high line vs the SPRINKLER sprawl (grip vs time — wet beats its own dry yet still loses to height) | 5 (`straight`×2, `gapLip`, `drop`, `landing`) | 4 | 2.70 | done — par 2.667 flies the sprawl (wet == dry bit-for-bit); shortcut chained 2.708, `fell` anchored (ask #2b); shortcut WET 2.675 beats its own dry 2.708 yet loses the par — low drag, the honest delta; the TIMED head is a hazard-KIND ask (#7b), shipped as an always-wet `wetPatch` sprawl (`source: 'sprinkler'`); 84 of 120 swept (choice tray) |
| `garden04` | `garden04.level.ts` | everything, one tray, a live sprawl under the flight (capstone; ordering IS the line choice) | 4 (`straight`, `gapLip`, `drop`, `landing`) | 4 | 2.70 | done — ALL 24 whole-tray orders finish (2.467–3.300, sweep seating inherited — the lesson IS the order-invariant sum) AND sampled orders replay BIT-IDENTICAL wet vs dry; par ORDER beatable at 2.467 s; decked probe diverges wet-faster (2.583 vs 2.717); the hill half of the brief stays Track Kit backlog (the AD's re-home of variant C's ramps), the stepping stones are the gravel crossing's standing in — staging, never fake verbs |

The garden rungs join the ladder after `bathroom04`
(`nextLevelId('bathroom04') === 'garden01'`); `gardenSetPlacement` mounts
the ratified golden-hour set UNDER the run on the bedroom rule with the
WIDEST offset of the four sets (x = rail midpoint, −52 cm — variant B
dresses all around its deck and the hose coil stands in a forward sun
stripe — flush paving (`DECK_Y`, the floor-camera law) 5 mm under the
LOWEST authored deck, yaw 0 so the ratified bore yaw and the cross-lane
shadow bars stay as reviewed; rows re-derived, and every `dress` mesh's
live group box swept against the corridor, by
`tests/unit/garden-levels.test.ts`). The geometry economy is the
bathroom's verbatim (same ramps, same `KITCHEN_GAP`, same sweep seating),
so the garden clocks ARE the bathroom clocks — stated openly, with the
lessons, hazards and the sun regime as the new thing
(`Sessions/2026-10-08 Stage 4 - garden ladder.md`).

## The garage ladder (stage 4 — four rungs, the campaign's last room)

| id | file | teaches | tray (budget) | par pieces | par time | status |
|---|---|---|---|---|---|---|
| `garage01` | `garage01.level.ts` | the OIL-STAIN grip hazard enters: the film halves grip, and the patch is flown AROUND, not driven through — the stain itself is the lesson | 3 (`gapLip`, `drop`, `landing`) | 3 | 2.25 | done — par = the L01 flight over the film, BIT-IDENTICAL wet vs dry (measured 2.233); every omission `fell` anchored; 5 of 6 whole-tray orders finish (`landing>drop>gapLip` pinned falling); the THROUGH line is the tray-unbuyable probe (diverges wet, wet FASTER 2.250 < 2.383 — low drag, the honest in-channel delta); `prop:oilStain` callout registered BY THE LEVEL FILE (the set module carries no `PROP_CALLOUTS` row — ask #8a) |
| `garage02` | `garage02.level.ts` | the CHOICE of the AD's ported mezzanine: the HIGH workbench line vs the FLOOR line — a real trade-off, and the lazy-high line is the fast one | 5 (`straight`×3, `drop`, `landing`) | 3 | 2.40 | done — high 2.367 beats floor 2.575 chained (both finish — the trade-off is real in the tray); ANCHORED only the high line reaches the cup (floor `fell` 2.925 — bedroom02's plateau property, ask #2b, pinned); sampled orders: the pure-high subset finishes and one beats the par clock (2.250), the mixed ones `fell` (choice tray, not whole-order-invariant); `trayParams` seats `drop`/`landing` the par never places |
| `garage03` | `garage03.level.ts` | the TRADE-OFF the tunnel FORCES: the speed line flies the goal line dry; the oil-film lane costs time | 5 (`straight`×2, `gapLip`, `drop`, `landing`) | 4 | 2.70 | done — par 2.667 flies the film (wet == dry bit-for-bit); the lane chained 2.675 finishes and `fell` anchored (ask #2b); lane WET 2.675 beats its own dry 2.708 yet STILL loses the speed line — bathroom03's tightest margin re-flowed; the zone is centred deep on the lane's own deck (bathroom03's fix verbatim); whole tray finishes every order sampled (best 2.483); **the ride THROUGH the wheel is STAGING** — variant C declares no sockets; a bore ride needs a lane-crossing tunnel anchor (ask #8b) behind ask #4/#1 |
| `garage04` | `garage04.level.ts` | everything, one tray, stain + HEIGHT combined, a live film under the flight (capstone; the campaign's last rung) | 4 (`straight`, `gapLip`, `drop`, `landing`) | 4 | 2.70 | done — ALL 24 whole-tray orders finish (2.467–3.300, sweep seating inherited — the lesson IS the order-invariant sum) AND sampled orders replay BIT-IDENTICAL wet vs dry; par ORDER beatable at 2.467 s; decked probe diverges wet-faster (2.583 vs 2.717); starts at the 0.26 bench height — the two garage verbs on one line, `nextInCampaign('garage04') === null` |

The garage rungs join the ladder after `garden04`
(`nextInCampaign('garden04') === 'garage01'`, and `garage04` is the
campaign's LAST rung — no Next beyond it); `garageSetPlacement` mounts
the ratified variant-C set UNDER the run on the bedroom rule (x = rail
midpoint, −37 cm off the corridor — the family-tightest offset that keeps
the forward-most dress solid, the flattened CARDBOARD at set z +0.261, a
full 10 cm clear — the flush slab 5 mm under the LOWEST authored
finish deck, yaw 0 so the ratified wheel, blade and stain films stay
behind the set-origin line as reviewed; rows re-derived, the dress-box
sweep derived from the live group boxes, and the wheel tunnel's
behind-the-lane honesty pinned, by `tests/unit/garage-levels.test.ts`).
The geometry economy is the bathroom's verbatim (same ramps,
same `KITCHEN_GAP` as `SHOP_GAP`, same sweep seating), so the garage
clocks ARE the bathroom clocks — stated openly, with the oil stain, the
ported mezzanine and the goal-line wheel as the new thing
(`Sessions/2026-10-09 Stage 4 - garage ladder.md`).

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
  the second lines: L02's arc route no longer FASTER-beats the lazy par on
  the fixed cup — the stage-4 discoverability pass re-authored its tray to
  the two lines' union so their reaches sum equal (both lines reach the
  anchored cup, lazy wins 2.17 s to 2.19 s, and all 12 orders of the whole
  tray finish) — and L04's ground build (hazard
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
it spans FOUR ladders — kitchen, bedroom, bathroom, garden — and the
bathroom's `drain`/`splash` alternates and the garden's `bore`/`wet
shortcut` alternates ride
in the same roster (the bathroom and garden hazard PROBES, like kitchen04's ground
build, are NOT in the line roster — hazard replay, not tray-affordable
routes); since the garage pass it spans FIVE — the garage's `floor`/`oil
lane` alternates join the roster and the pars/parity/budget trio of
checks now covers the garage rungs too.

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
- `getLevel` now resolves 23 ids once the level modules are imported (feel
  rig, kitchen six, bedroom four, bathroom four, garden four, garage four); the kitchen
  files self-register via `registerLevel` on import
  (`feeltrack.level.ts`'s registry), the bedroom files do the same
  (`registerBedroom` wraps it), the bathroom files likewise
  (`registerBathroom`), the garden files likewise (`registerGarden`), and
  the garage files likewise (`registerGarage`).
  `src/boot.ts` imports every rung (the
  kitchen wiring since stage 2, the bedroom wiring added at the stage-4
  ladder pass, the bathroom wiring at the stage-4 bathroom pass, the garden
  wiring at the stage-4 garden pass, the garage wiring at the stage-4 garage
  pass — a file outside the level designer's
  lane, touched only to
  register and extend the `void [...]` list; `LADDER` itself is the
  campaign table).
- Nothing on this rung-blocking blocks stage 3 integration; the blocked
  halves are additive data edits when ask #1 lands.
