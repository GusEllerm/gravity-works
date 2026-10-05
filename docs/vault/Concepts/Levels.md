---
tags: [concept, levels]
---
# Levels

> [!abstract] Role
> How a Gravity Works level is made of data: the contract shape, what a tray
> and a par build are, the kitchen five (design cards), the prop/socket and
> hazard conventions the Environment Artist builds to, and the two honest
> gaps between level intent and shipped physics. Owner: Level Designer;
> [[Reference/Level Ladder]] carries the table.

## The data model

A level is a plain-data `Level` (`src/world/level.ts`): start socket, budget, par, seed, max time, a build factory, and an optional `parBuild` seam (the reference build `scripts/gen-pars.mjs` replays to regenerate `src/world/pars.json`; falls back to the build factory until a designer authors one). The kitchen levels are one rung
richer — `KitchenLevel` (`src/world/levels/kitchen01.level.ts`) adds:

- `tray` — a per-kind piece count map, the pieces the player may place. Its
  **total IS `budget`** (the contract's number field), so "tray contents =
  budget" holds by construction. This is the per-kind budget the ladder
  tables and the builder UI need until the `Level` shape itself grows one
  (`npm run pars` now imports every level file and reads these builds).
- `fixtures` — pieces the level ships BUILT-IN (the book-stack `ramp`, the
  counter `finishCup`, the bowl's rim, the L02 run-out curve). They are part
  of `parBuild`'s geometry but not of the tray.
- `parBuild()` — the Level Designer's reference build: fixtures plus the
  intended line. This is the pars-regeneration seam: a script replays it
  headless and writes `par.time`. Every parBuild in the ladder must finish —
  that is `tests/unit/kitchen-levels.test.ts`, not prose.
- `sandbox?: boolean` — the no-budget variant (kitchen ships one,
  `kitchen-sandbox`, registered by `src/world/levels/kitchen05.level.ts`).
- `hazards` and `propSockets` — see the two convention sections below.

Pieces are laid per-instance by `lay` (the kitchen helper in `kitchen01`):
the kit's `chain` keys params by KIND, so any level that reuses one kind with
two parameter sets (L05's two lips) must seat each piece with `fitSocket`
directly — same socket math, still pure data.

The release pose convention: the car starts at 0.9 of the start ramp's pitch
blend (the feel rigs' `marks.start`), taken from the par build's own
`KitRig` in WORLD metres — note `feeltrack.level.ts`'s `startSocketOf` feeds
the rig's SIM-space pose into that world field (a 10× displacement that
happens to stay on that level's very long ramp); kitchen's
`startSocketFromBuild` divides by `SIM_SCALE` and is the correct pattern.

## The kitchen five (design cards)

**KITCHEN 01 — Book Drop** (`kitchen01.level.ts`, the tutorial). Teaches:
place three pieces, press launch — and nothing less than placing all three
crosses the gap. Start on a book stack (fixture `ramp`, 0.22 m), one gap,
finish cup on the counter. Tray: `gapLip`, `drop`, `landing` — exactly three
pieces; the intended fit is lip → drop → landing (launch, catch, roll-out)
and placing all three finishes in 2.23 s (par 2.25) — proven by test with
the margins the playtest said were missing: the finish is bit-identical
across an 8-seed sweep (0 % time spread — the sim is deterministic; the seed
folds into the hash only) and finishes across the whole release-speed range
(shipped default 0 up to the kit's full launch speed; the pre-fix geometry
fell from a 0.2-sim-unit nudge). And it is the ONLY tray fit that finishes:
replayed the way the shipped builder mounts fixtures (`initialBuild` anchors
them at their par transforms), every build missing a tray piece falls into
the hole that piece left (`tests/unit/kitchen-levels.test.ts`).

The gap, measured truth after the stage-3 promise fix: the deck steps down
**0.12 m** across the gap (`drop` height 0.12, angle 45°, leads 0.05), the
`drop` spans 0.24 m of which 0.136 m is the empty span, and the soft catch
is 0.36 m of `landing` deck (`level` 0.24). **Why three pieces close it
now**: the lip fires the car ballistically at ~1.3 m/s, +10°; a parabola —
not the catch ARC the old piece sizes assumed — is what actually meets the
deck plane, 0.24 m past the lip at a shallow approach, which is exactly
where the drop's exit-lead + landing entry now sit. The old numbers (height
0.15, angle 40, lead 0.01) put the landing ENTRY plane ~15 mm UNDER that
parabola by the time the chain reached it — the car arrived beneath its own
landing and fell ("the gap outran the landing" was physics, not player
error), and where it did finish it slammed the flat deck at −34° and
survived on 1-pixel luck (the pass set was fragmented: drop.lead 0.01
finished, 0.02 fell). Two further numbers carry the promise: the whole
`drop` span (0.24 m) is longer than a flat roll-off can fly (~0.19 m), so a
missing drop cannot be skipped on a bounce into the cup; and touchdown
(~0.25 m into the landing) still has ~0.10 m of deck to the run-out blend,
so release speed ±10 % moves touchdown by millimetres, not off. The lesson
re-stated: **every tray piece is load-bearing** — launch (lip), fall and
catch (drop), run out (landing); the geometry now teaches that by itself,
without UI hints. Common failure: none that ends the run — in the chained-
cup data model five of the six tray ORDERS still finish (only landing→drop→
gapLip falls); the one-way ORDER remains authoring intent (ask #3) — what is
no longer optional is WHICH three: omit any piece and the hole is geometry,
not a suggestion.

**KITCHEN 02 — Two Ways** (`kitchen02.level.ts`). Teaches: a choice, and
that the fast line is not the showy one. One gap, two valid crossings
(both finish, asserted): the lazy line — the `drop` between two straights, a
clean catch — 2.32 s; and the arc route — `gapLip` launch + `drop` +
`landing` — 2.49 s, its own landing blend costs the difference. Common
failure: building the arc because it looks fast. Par is the par because it
is the lazy line's reference build; 3 of the 5 tray pieces are placed. The
rung this level was specced to add — a drivable mid-run `curve` — is
BLOCKED (see ask #1); the curve is fixture geometry past the cup, built,
colliding, railable, run-out style, exactly the honesty standard the feel
track set.

**KITCHEN 03 — The Bowl** (`kitchen03.level.ts`). Teaches: the set's
signature at speed — the gap verbs back to back beside the cereal bowl. The
bowl IS the set's bowl: the rim line (a `bank` + counter-`curve` pair) is
seated THROUGH the set's `bowl.in` / `bowl.out` socket frames (`BOWL_SOCKET_FRAMES`
carried into world space by the level's set mount, `src/world/setPlacement.ts`),
not chained off the timed line; the timed line runs past it into the cup. Common failure: none on the par line — but the car visibly begs to
take the rim, and cannot (ask #1). Par is the par because it is everything
drivable today on the way to the bowl. The bowl's intended banked line
becomes a data edit — seat a `bank` between the rim sockets — the day
steering lands; that half of the rung is BLOCKED.

**KITCHEN 04 — The Tap** (`kitchen04.level.ts`). Teaches: the hazard enters;
affordance (the tap dripping, upstream, visibly) before hazard (its splash
halves grip on the patch below the sink's far rim). The wet patch is
`hazards` DATA (see convention below): centre on the ground build's decked-
sink seam, `gripFactor: 0.5`, source `tap`. The AFFORDANCE reaches the data
through the mount, not a re-model: kitchen04's set placement yaws the whole
set so the tap's `drip` anchor maps exactly onto that zone centre — the
drips land in the patch, the zone stays on the deck the car drives
(Decision Log 2026-10-07; coordinate-tested in `tests/unit/set-wiring.test.ts`). Two lines, both measured with
the live zone hook (stage 3): the par line FLIES the sink (`gapLip` →
`drop` → `landing`, then past the patch — grip-independent to the BIT,
2.57 s, hash unchanged by the zone), and the ground line decks straight over
the sink with the two loose `straight`s and drives THROUGH the patch — its
hash diverges and it finishes 0.06 s FASTER (2.350 s dry → 2.292 s wet):
the honest in-channel manifestation of "halves grip" on a straight is
LOW DRAG, the speed-management question the brief intends. The failure the
card wanted — sliding wide — is a channel-kinematics NO on a straight (the
rail carries lateral demand grip-independently; [[Modules/hazards]]);
the measurable lateral signature is the straddled-patch-edge yaw
(slip 2.38° → 3.98°, dry → wet). Par is the par because it is the line that
does not care about the water.

**KITCHEN 05 — Sunday Run** (`kitchen05.level.ts`). Teaches: everything,
with a budget that cannot buy two solutions. Tray: 2 `gapLip`, 2 `drop`,
**1** `landing`, **1** `booster` — six tray pieces placed across two gaps and a
flat between (plus the two fixtures). The forced trade-off: one soft catch, one speed purchase; the
booster must be spent EARLY (before the first lip). Wrong answer A: no
booster, the car is a gram of rolling resistance short of the back gap's far
rim — `fell`. Wrong answer B: land the front gap and save the booster for
the back lip — the extra speed overshoots the catch — `fell`. Both wrong
answers are in the test, so the trade-off is measured, not asserted. This
rung chains its OWN pinned copy of the original gap numbers
(`KITCHEN05_GAP`, `kitchen05.level.ts`): its lesson needs an unforgiving
_gap_ — when the shared `KITCHEN_GAP` softened for the L01 promise, the
no-booster line silently started finishing, un-teaching the trade-off; the
pin restores the measured wrong answers byte-identically (par hash
unchanged). Par 2.39 s; beatable (a between-gaps booster line finishes at
2.50 s, and a tighter line is out there), not obvious. Common failure:
booster too late.

## Sandbox (per set)

The kitchen sandbox: `sandbox: true`, budget 999 ("no budget"), every piece
unlocked at 9 copies; the reference build is one clean lap of every drivable
kitchen verb and finishes in 2.64 s. Other sets' sandboxes follow the same
shape in their own files at their own stage.

## Conventions the Environment Artist builds to

**Props expose sockets.** The cereal bowl's rim is a place a track can
attach (Track Kit: "props expose sockets too"). The convention: the bowl
prop's rim carries TWO named sockets, `bowl.in` and `bowl.out`, and the rim's
centreline is a planar arc tangent to `bowl.in` in the rim's plane; the
prop's mesh geometry must pass through both socket poses. KITCHEN 03 exports
the actual world poses as `propSockets` (`bowlSockets()` in
`kitchen03.level.ts` — the set's socket frames as PLACED by the level's set
mount, radius 0.12,
120° sweep, 25° bank); the artist's mesh is built TO those numbers so a
future bank piece seats without either side moving. The tap prop's drip
point is a plain anchor point (no socket — nothing snaps to it); the wet
patch it creates is hazard data, not geometry.

**Hazards as data.** A `WetPatch` hazard (declared in
`kitchen01.level.ts`) is `{ center, radius, gripFactor, source }` in world
metres. **Since stage 3 the `World` DOES read zones** — ask #2a was built
as the per-contact grip hook (`src/world/hazards.ts` normalises the
`WetPatch` to a cuboid `HazardZone`, and `carStep` samples it at every
wheel contact: see [[Modules/hazards]]). The design contract holds and is
now measured, not assumed: a level's PAR line must be grip-independent,
and KITCHEN 04's par replays BIT-IDENTICAL with the live zone (its line
flies the patch), while its ground line's hash DIVERGES (it drives
through). One placement correction shipped with the hook: `wetPatch()`
now centres the patch on the ground build's straight seam (the decked
sink's middle) — the earlier centre, taken from the PAR rig's landing run,
sat on the par line's own deck and quietly broke the par's
grip-independence promise the moment the hook existed. Flagged for LD
review.

## Piece requests / asks (one paragraph each)

**Ask #1 — make a mid-run yaw arc drivable (blocking rungs: L02 curve, L03
bowl line).** Every mid-run yaw piece — `curve`, `bigCurve`, `sbend`, `bank`
— fails for both shipped car variants across a sweep of radii (0.6–2.5 m),
entry speeds (~0.9–2.4 m/s) and bank angles (0–25°): the car either ploughs
straight off the outer wall (`fell`) or dies on the straight→yaw seam where
the contact solver eats essentially all forward energy in one step (crawls
away at 0.03 m/s). `Modules/feel.md` named this "the open boundary" and
assigned it to the wheel-collider variant's acceptance; the World-level test
here shows both variants behave identically on yaw (`World` drives the same
raycast steering). The kitchen needs one steerable yaw piece before rung L02
and the bowl promise in L03 can ship as anything more than a fixture —
options for the Feel Engineer: a steering model with real channel authority
at yaw-seam loads, or a "guided curve" piece whose channel walls carry the
lateral force the car cannot ask its wheels for.

**Ask #2 — zone hook for hazards + level-owned finish socket.** Two narrow
`World` requests from the hazard and tutorial levels: (a) a per-region deck
grip multiplier KITCHEN 04's `wetPatch` can ride on — **DELIVERED stage 3**
as a per-wheel-contact grip field (`src/world/hazards.ts` +
`WheelSupport`/`GripField` in the car; see [[Modules/hazards]]); (b)
`Level.finishSocket` so the cup is the LEVEL's world-fixed point a player
must BUILD TO, instead of a `finishCup` piece chained at the end of
whatever build is being replayed — **open** (Systems Engineer). (b) is why the
kitchen levels' wrong-order experiments all "finish" over small gaps: a
chained cup makes reachability free, so only physics failure — never routing
failure — can occur. Neither blocks today's par builds; both are needed for
the levels to bite in the real builder.

**Ask #3 — punish a wrongly-placed gap piece (L01 "only fit one way").** At
every parameter combination tried (drop depths 0.15–0.28 m, ramp heights
0.06–0.30 m, catch radii 0.02–0.06), no window exists where the lip/drop/
landing trio finishes in exactly one order: the pieces are either
forgiving in all six orders or unfinishable in all. KITCHEN 01's claim, per
the brief, is therefore the weaker true one — "a player must be able to
finish by placing all three" (proved) — and its one-way fit is a
builder-UI-side ordering hint until a gap piece exists that punishes wrong
placement (or ask #2b makes a misplaced trio miss the cup). **STAGE-3
UPDATE (L01 promise fix):** the WHICH side of this ask is now closed by
geometry — the re-authored `KITCHEN_GAP` makes every one- and two-piece
omission fall against the anchored fixtures (test-asserted), and five of six
tray ORDERS still finish in the chained-cup model (landing→drop→gapLip
falls), so the ORDER half of the ask stands: one-way seating remains a
builder-UI hint pending ask #2b.

## Blocked rungs

L02's curve and L03's bowl line are BLOCKED pending ask #1 (the levels
themselves are NOT blocked — both par builds finish and both levels teach
their choice/hazard lessons). See [[Reference/Level Ladder]].

## Guarded by

`tests/unit/kitchen-levels.test.ts` — every kitchen parBuild finishes
headless through `src/replay/replay.ts` (same seam share links use), the L01
three-piece promise (exact fit finishes with margin: seed-stable, release-
speed-range; every tray-piece omission fails against the anchored fixtures),
L02's two lines and L04's ground line finish, L05's two wrong allocations do
not, budgets equal trays, the sandbox exists, and the bowl sockets are
exported.
