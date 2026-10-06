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
  The ladder rule (stage-3 coherence pass) is **`tray ⊇ parBuild`**: every
  piece the reference build places must be afforded by the tray plus the
  `fixtures`, and a tray kind carries **ONE geometry** — the builder seats a
  held kind with the parameters `levelTrayParams` derives, so a par chain
  that uses one kind at two sizes is a build NO tray can place. The rule is a
  TEST over every line a level authors (par + the alternates the cards
  promise): `tests/unit/kitchen-levels.test.ts`, "tray ⊇ parBuild".
- `trayParams` — the geometry of a tray kind the PAR line never places. A
  kind's seating parameters otherwise come from its first placement in
  `parBuild()`, so the pieces only an ALTERNATE line uses — L02's `gapLip`
  and `landing`, the whole point of a choice level — would otherwise seat at
  kit DEFAULTS and build a different gap than the one both lines were
  measured on. L02 declares those two; the ladder test asserts every authored
  line places each tray kind at exactly the geometry the tray seats it with.
- `fixtures` — pieces the level ships BUILT-IN (the book-stack `ramp`, the
  counter `finishCup`, the bowl's rim, the L02 run-out curve). They are part
  of `parBuild`'s geometry but not of the tray, and `initialBuild` mounts
  them ANCHORED at their par transforms — which is why a piece-count par is
  counted WITHOUT them (§Pars are counted on the tray basis).
- `parBuild()` — the Level Designer's reference build: fixtures plus the
  intended line. This is the pars-regeneration seam: a script replays it
  headless and writes `par.time`. Every parBuild in the ladder must finish —
  that is `tests/unit/kitchen-levels.test.ts`, not prose.
- `sandbox?: boolean` — the no-budget variant (kitchen ships one,
  `kitchen-sandbox`, registered by `src/world/levels/kitchen05.level.ts`).
- `hazards` and `propSockets` — see the two convention sections below.

The bedroom rungs (stage 4) mirror the WHOLE seam as `BedroomLevel`
(`src/world/levels/bedroom01.level.ts`, `set: 'bedroom'`,
`bedroomLevel`/`registerBedroom` mirrors of `kitchenLevel`/
`registerKitchen`) — every tray/`trayParams`/`fixtures`/`parBuild` rule
above applies to both ladders, and the ladder test enforces it on both.
The bathroom rungs (stage 4) mirror it a third time as `BathroomLevel`
(`src/world/levels/bathroom01.level.ts`, `set: 'bathroom'`,
`bathroomLevel`/`registerBathroom`) and add one authoring helper, `wetPatchOverSeam`
— a wet-patch zone centred on a build's own deck SEAM (the kitchen04
convention made reusable), used by rungs 01/04; rung 03 centres its zone
directly on the SOFT line's landing deck. The garden rungs (stage 4) mirror
it a fourth time as `GardenLevel`
(`src/world/levels/garden01.level.ts`, `set: 'garden'`,
`gardenLevel`/`registerGarden`), reusing `wetPatchOverSeam`'s rule from the
bathroom file rather than restating it.

## The bathroom four (design cards)

The bathroom ladder (stage 4) is four rungs on the RATIFIED variant-A set
(`src/sets/bathroom/data.ts`, the porcelain cathedral, 14/15 at both
cameras — ported by the Level Designer as a minimal art port, friction
logged in `Sessions/2026-10-08 Stage 4 - bathroom ladder.md`), entering the
campaign after `bedroom04`. Every rung rides the same authoring kit and the
same invariants as the kitchen/bedroom ladders; the geometry economy is the
bedroom's (one 0.20 m `straight` geometry for 01–03, the 0.30 m sweep
seating on 04, the shared `KITCHEN_GAP` numbers as `DRAIN_GAP`). Set
mounting follows the bedroom rule with its own offset — `bathroomSetPlacement`
centres the 2.8 m floor disc on the run, 25 cm BEHIND the corridor
(`BATH_AXIS_OFFSET`, larger than the bedroom's 15 because variant A's prop
cluster spans ±0.29 m of its origin), floor 5 mm under the LOWEST authored
deck. The set's two wet-patch FILMS are decoration at set space; live grip
zones are LEVEL data (the kitchen04 convention), which is exactly ask #6.

**BATHROOM 01 — The Drip** (`bathroom01.level.ts`, the hazard enters the
bathroom). Teaches: a wet patch halves grip, and a wet patch is RIDDEN
AROUND, not through. The par line is the kitchen L01's proven flight over
the drain sink (`gapLip`→`drop`→`landing`, ramp 0.22, tray = the exact
multiset, par 3, 2.25 — measured 2.233 s, builder-mount byte-identical to
the par), and the puddle UNDER the flight window is a LIVE zone centred on
the PROBE build's decked-sink seam — so the par replays BIT-IDENTICAL wet
vs dry (airborne wheels, no contact), every one- and two-piece omission
falls anchored, five of six whole-tray orders finish and the L01-pinned
`landing→drop→gapLip` falls (the same table, re-measured). The THROUGH line
is the probe (two 0.30 decks the tray cannot buy — no `straight` in the
tray at all): it diverges wet vs dry and runs wet FASTER (2.250 vs 2.383 —
the honest in-channel manifestation of halved grip is LOW DRAG,
[[Modules/hazards]]; the slides-wide failure mode stays ask #1's blocked
lateral half). The rung's one-line prop callout (`prop:wetPatch` in the set
module — the lesson Playtest G never found on L04) says it in nine words:
"Wet tile halves grip — put your line around it, not through it."

**BATHROOM 02 — Rim or Drain** (`bathroom02.level.ts`). Teaches: the
CHOICE — the lazy rim line vs the showy straight into the tunnel mouth —
and that the fast line is the lazy one, kitchen02's lesson re-staged on
tile. Par (3 of 5 tray pieces, 2.35) rolls the `drop`'s catch between two
0.20 m decks; the DRAIN line (`gapLip` launch off the rim toward the set's
drain prop — the tunnel mouth is STAGING; the drain is a plain anchor,
nothing snaps to it) finishes too (chained 2.550) and the tray affords both
(`trayParams` declares the `gapLip`/`landing` the par never places). The
builder-anchored truth (ask #2b, and it bites LESS here than on
bedroom02/03): BOTH lines reach the fixed cup and the lazy one still wins
— 2.350 vs 2.367, test-pinned. Whole-tray orders finish every order the
test samples (2.292–2.392; the best order beats the par clock at the
pieces-star's cost) — but the CHOICE tray is not order-invariant whole
(swept at authoring: 39 of the 60 distinct whole-tray orders finish — the
extra two pieces are the OTHER line's parts; the family measured the same
property on bedroom02, 13 of 20). The order-invariance gate lives on the
capstones (kitchen04, bedroom04, bathroom04 — 24/24), not on a rung whose
tray is deliberately bigger than its par. No live zone on this rung (the
wet tile is the set's TELLS; grip returns as mechanic in 03).

**BATHROOM 03 — Tub Wall** (`bathroom03.level.ts`). Teaches: the
TRADE-OFF — height over the wall (dry, hard catch) vs the SPLASH-PATCH
route (a soft `landing` whose deck sits low in a live wet zone). The par
(4 of 5, 2.70 — measured 2.667) takes the hard `drop` catch across the
wall's base and flies the splash: bit-identical wet vs dry. The splash
line (the `landing` twin, declared in `trayParams`, chained 2.708) finishes
chained and does NOT reach the anchored cup (ask #2b, pinned) — and it is
LEGITIMATELY wet: its hash diverges, and the honest delta is low drag again
— splash-wet 2.675 beats splash-dry 2.708 yet STILL loses to the dry high
line (2.667 < 2.675), the tightest grip-physics statement in the ladder.
Whole tray finishes every order the test samples (best 2.483, beats the
par clock); like 02 it is a CHOICE tray, not order-invariant whole (swept
at authoring: 42 of 60). The zone is centred deep on the soft line's own landing deck — the
first draft centred mid-entry and the par's `drop` step-top grazed the band
(measured, fixed; both lines share the launch, so the zone must start past
the step).

**BATHROOM 04 — Full Bath** (`bathroom04.level.ts`, the capstone). Every
bathroom verb on one line — deck run, launch, sink dip-and-catch, soft
run-out — with the bathroom's signature under the flight: the sink puddle
is LIVE, centred above the sink mouth at the decked (probe) height, and the
rung's claim is the strongest in the ladder: ALL 24 whole-tray orders
finish (2.467–3.300, the bedroom04 sweep's seating inherited deliberately —
the lesson IS the order-invariant whole-tray sum) AND the dry sweep IS a
wet sweep: par and the sampled orders replay BIT-IDENTICAL wet vs dry,
because every buildable line crosses the puddle airborne or on the low
catch deck. The decked probe (one 0.62 m bridge the tray cannot seat)
diverges and runs wet-faster — the toll stays theoretical. Par ORDER
beatable at 2.467 s. The puddle centre is derived from the PAR's own
landing-entry x, not the probe seam — the first draft's seam-centred zone
let the par's step-top graze the band (measured wet != dry; the probe's
deck is still high and wet at the shipped centre, so the bite claim
survives the move).

## The garden four (design cards)

The garden ladder (stage 4) is four rungs on the RATIFIED variant-B set
(`src/sets/garden/data.ts`, paving slabs at golden hour — sun disc, trellis
shadow bars, sky-derived shade, 14/13/13 at the three production cameras,
`Reference/Review 2026-10-08 Stage 4 garden*.md`), entering the campaign
after `bathroom04`. Every rung rides the same authoring kit and the same
invariants as the three earlier ladders; the geometry economy is the
bathroom's verbatim (one 0.20 m `straight` geometry for 01–03, the 0.30 m
sweep seating on 04, the shared `KITCHEN_GAP` numbers as `BORE_GAP`) — the
rung LESSONS are the new thing, and because the seats are identical the
garden clocks are the bathroom clocks, which the tests pin as
relationships, not folklore. Set mounting follows the bedroom rule with the
widest offset of the four sets — `gardenSetPlacement` centres the patio disc (radius 1.15 m) on the run, 52 cm BEHIND the corridor (`GARDEN_AXIS_OFFSET`,
variant B dresses all around its deck and the hose coil stands in a forward
sun stripe at set z +0.39), the flush paving's finish surface (`DECK_Y`,
the floor-camera law) 5 mm under the LOWEST authored deck, yaw 0 (the
set's own off-axis bore yaw is the ratified focal fix). The two prop
callouts (`prop:shadowBars`, `prop:sprinkler`) register in the set module,
the bathroom `prop:wetPatch` precedent.

**GARDEN 01 — Shadow Bars** (`garden01.level.ts`, the ladder opens with the
EYE, not the wheel). Teaches: the SUN-SHADOW LINE — the shaded strip is
cooler because outdoors the shade is sky-lit (the first rig where the tint
provably derives from the sky value), and that difference is VISUAL: the
trellis bars are read-only rhythm, the concept's law kept literally — the
set ships `HAZARDS` empty and the rung ships no live zone at all, so the
honest wet-side assertion is that there is nothing to be wet about. The
physics is the kitchen-L01/bathroom01 flight (`gapLip`→`drop`→`landing`,
ramp 0.22, tray = the exact multiset, par 3, 2.25 — measured 2.233 s,
builder-mount byte-identical, every omission `fell` anchored, five of six
whole-tray orders finish with `landing→drop→gapLip` pinned falling). What
is new is only where the camera teaches the player to LOOK, and
`prop:shadowBars` says it in one line.

**GARDEN 02 — Slab or Bore** (`garden02.level.ts`). Teaches: the CHOICE —
the lazy slab line vs the showy launch toward the drain-pipe mouth — and
that the fast line is the lazy one, bathroom02 re-staged under the sun. The
bowl half of the brief ran into the ratified set: variant B has NO birdbath
(the exploration deliberately left the bowl out so the garden would not
spend its signature on the kitchen's), and the set's one socketed
signature is the BORE. So the bore carries the SHOWY half as STAGING — the
mouth pair (`PIPE_SOCKET_FRAMES`, `pipe.in`/`pipe.out`) sits ~77 cm behind
the +x lane at every shipped mount (test-pinned), nothing on the lane can
chain through it, and the bowl TURN itself is blocked behind the same stack
kitchen L03 named (ask #1's drivable yaw + ask #4's prop-socket seating)
plus ask #7a (a birdbath prop with a lane-crossing socket pair). The RUNG
is not blocked: par (3 of 5, 2.35 — measured 2.350) beats the chained bore
line 2.550, on the builder mount BOTH lines reach the cup and the lazy one
still wins (2.350 vs 2.367, ask #2b biting LESS here, exactly as on
bathroom02), and whole-tray orders finish every order the test samples
(2.292–2.392, best beats the par clock; swept at authoring 78 of 120
permutations — the same choice-tray property as bathroom02's 39 of 60).

**GARDEN 03 — The Sprinkler** (`garden03.level.ts`). Teaches: the
TRADE-OFF in the garden's own hazard verb — grip vs time, the sprinkler's
sprawl instead of the bathroom's puddle. The par (4 of 5, 2.70 — measured
2.667) takes the high DRY route and flies the sprawl: bit-identical wet vs
dry. The WET SHORTCUT (the soft `landing` twin, declared in `trayParams`,
chained 2.708) finishes chained, does NOT reach the anchored cup (ask #2b,
pinned), and is legitimately wet: hash diverges, and the honest delta is
the low-drag one again — sprinkler-wet 2.675 beats sprinkler-dry 2.708 yet
STILL loses to the dry high line. What the brief's SPRINKLER really wants
is a TIMED gate (the concept's "pure vertical motion in a set of
straights") — the data model has one hazard kind, `WetPatch`, so what
ships is the always-wet sprawl (`source: 'sprinkler'`) and the rung makes
no timing claim; the cycling head is ask #7b. Zone centring inherits the
bathroom03 fix verbatim (deep on the soft line's own deck). Whole tray
finishes every order sampled (best 2.483); choice tray, not
order-invariant whole (84 of 120 swept).

**GARDEN 04 — Golden Hour** (`garden04.level.ts`, the capstone). Every
garden verb on one line — deck run, launch, gap dip-and-catch, soft
run-out — with the sprinkler's sprawl LIVE under the flight window
(centred by the bathroom04 rule: the par's landing-entry x at the decked
(probe) y). The line choice the brief asks a capstone to combine is the
one this economy honestly affords: the tray IS the par's exact multiset,
ALL 24 whole-tray orders finish (2.467–3.300, the sweep seating inherited
deliberately), so your ORDERING is the line you pick and the clock is the
reward — the par ORDER is beatable at 2.467 s. The dry sweep IS a wet
sweep: par and the sampled orders replay BIT-IDENTICAL wet vs dry, and the
decked probe (one 0.62 m bridge the tray cannot seat) diverges and runs
wet-faster (2.583 vs 2.717). The brief's HILL half stays where the AD
re-homed variant C's ramps — the track system's elevation profile (Track
Kit backlog), not faked by a `drop` — and the stepping stones are variant
C's props: the ratified deck's laid gravel crossing stands in as pure
staging, which is the sentence this ladder keeps making — what READS
differently need not DRIVE differently (the shadow bars), and what DRIVES
differently says so (the sprawl is live; the stones never were).

The garden rungs join the campaign after `bathroom04`
(`nextInCampaign('bathroom04') === 'garden01'`), making the room order
kitchen → bedroom → bathroom → garden — the play order the bathroom pass
handoff was already walking toward (the registry lists sets in arrival
order, which put garden's ROW in before the bathroom's; the campaign table
is progression, and it now says FOUR rooms honestly, garden last because
its first rung opens with bathroom04's star). `tests/unit/garden-levels.test.ts` is the rung gate; the cross-
ladder tray ⊇ parBuild roster spans FOUR ladders.


Pieces are laid per-instance by `lay` (the kitchen helper in `kitchen01`):
the kit's `chain` keys params by KIND, so any level that reuses one kind more
than once (L05's two lips) seats each instance with `fitSocket` directly —
same socket math, still pure data. Reusing a kind at two different PARAMETER
sets is now forbidden for tray kinds: the tray seats every held `straight` at
one geometry, so a level that wants 0.12 m and 0.25 m of counter deck picks
ONE size (the stage-3 coherence pass unified L02 to 0.18, L03 to 0.15, L04 to
the ground line's 0.3 and the sandbox to 0.175).

The release pose convention: the car starts at 0.9 of the start ramp's pitch
blend (the feel rigs' `marks.start`), taken from the par build's own
`KitRig` in WORLD metres — note `feeltrack.level.ts`'s `startSocketOf` feeds
the rig's SIM-space pose into that world field (a 10× displacement that
happens to stay on that level's very long ramp); kitchen's
`startSocketFromBuild` divides by `SIM_SCALE` and is the correct pattern.

## Pars are counted on the tray basis

`scripts/gen-pars.mjs` writes `parPieces` = the pieces the reference build
places **minus the level's `fixtures`**, because every consumer counts that
way: `Builder.playerCount` (the tray counter, the budget gate, the star line
and the panel's "N pieces — par M") never counts a built-in fixture, and
`playerPieceCount` in `src/boot.ts` applies the same rule to a replay/share
payload's build. The deployed page read **"3 pieces — par 5" on a
three-piece tutorial**: the script had recorded the WHOLE reference build
(fixtures included, 5 for L01) against a counter that tops out at 3, so the
2-star line could never be missed and `loop.spec` was red. One basis now,
pinned per rung by `tests/unit/kitchen-levels.test.ts` (`PARS[levelId].pieces
== Level.par.pieces`). `trayParityBuild` (also `src/boot.ts`) is the other
new seam the ladder test reads: the build the shipped builder produces when
the player places the par line — fixtures anchored, tray pieces seated at the
tray's single geometry — and on every coherent rung it is BYTE-IDENTICAL to
`parBuild()`.

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
clean catch — 2.317 s (par 2.35); and the arc route — `gapLip` launch +
`drop` + `landing` — 2.442 s, its own landing blend costs the difference.
Common failure: building the arc because it looks fast. Par is the par
because it is the lazy line's reference build; 3 of the 5 tray pieces are
placed. STAGE-3 COHERENCE: the two counter straights are now ONE 0.18 m
geometry (was 0.12 + 0.25 — a second geometry the tray could not seat, so the
player's lazy line fell 13 cm short of the anchored cup), and `gapLip` /
`landing` are declared in `trayParams` because the lazy par line never places
them; the arc route's time moved with the geometry (2.49 → 2.442 s). The
rung this level was specced to add — a drivable mid-run `curve` — is
BLOCKED (see ask #1); the curve is fixture geometry past the cup, built,
colliding, railable, run-out style, exactly the honesty standard the feel
track set. PLAYTEST E FOLLOW-UP (learnability pass): E never cleared this
rung, but E's own L02 build (`straight → drop → straight`) finishes at
2.32 s on the shipped builder's anchored mount (asserted in
`tests/unit/kitchen-levels.test.ts`) — the lazy line IS discoverable from
the set alone, and E's failure predates the builder's target-follow fix
(the same one the L01 promise walk needed), not a level defect. NO fixture
nudge added: the seam cue the brief asked to evaluate would be text-free
window-dressing over a bug that is already fixed.

**KITCHEN 03 — The Bowl** (`kitchen03.level.ts`). Teaches: the set's
signature at speed — the gap verbs back to back beside the cereal bowl. The
bowl IS the set's bowl: the rim line (a `bank` + counter-`curve` pair) is
seated THROUGH the set's `bowl.in` / `bowl.out` socket frames (`BOWL_SOCKET_FRAMES`
carried into world space by the level's set mount, `src/world/setPlacement.ts`),
not chained off the timed line; the timed line runs past it into the cup.
STAGE-3 COHERENCE — the bowl line is now a build a tray can place: the tray
(2 `straight`, `gapLip`, `drop`, `landing` = 5 = budget) IS the multiset the
par build places, and both straights are ONE 0.15 m geometry (was 0.1 + 0.2,
a second geometry the tray could not seat — the player's run got two 0.1 m
straights and a line 10 cm shorter than the one the cup is anchored against).
Par 2.617 s (2.65), measured on that line; the rim fixtures ride the set's
sockets, so mounting the set anywhere moves the bowl and the line with it.
Common failure: none on the par line — but the car visibly begs to
take the rim, and cannot (ask #1). Par is the par because it is everything
drivable today on the way to the bowl. The bowl's intended banked line
becomes a data edit — seat a `bank` between the rim sockets — the day
steering lands AND the builder can seat a piece on a PROP socket (ask #4);
that half of the rung is BLOCKED.

**KITCHEN 04 — The Tap** (`kitchen04.level.ts`). Teaches: the hazard enters;
affordance (the tap dripping, upstream, visibly) before hazard (its splash
marks the sink the arc must fly). The wet patch is
`hazards` DATA (see convention below): centre on the ground probe's decked-sink seam, `gripFactor: 0.5`, source `tap`. The AFFORDANCE reaches the data
through the mount, not a re-model: kitchen04's set placement yaws the whole
set so the tap's `drip` anchor maps exactly onto that zone centre — the
drips land in the patch (Decision Log 2026-10-07; coordinate-tested in `tests/unit/set-wiring.test.ts`).
STAGE-3 LEARNABILITY PASS (Playtest G hard-walled here: nine attempts,
every tray combo, "nose-first"/"flew off", quit). G's nine builds were
reproduced headlessly on the mount the SHIPPED builder makes (`initialBuild`
anchors the fixtures — session log `2026-10-06 Stage 3 - L04 learnability`):
all fail, and the culprit was the TRAY, not the physics — it held FIVE
pieces for a FOUR-piece answer (`straight` ×2 for a line that places one),
so the puzzle was "guess which 4 of 5" and every wrong subset fell into the
sink. The tray now IS the par line's exact multiset — `gapLip`, `drop`,
`landing`, `straight`, four pieces, budget 4, all load-bearing. Every kit
socket seats flat, so a chain's reach is an ORDER-INVARIANT SUM of its
pieces: **every whole-tray chain lands deck-to-deck at the cup and every
order finishes** (24/24, 2.47–3.12 s, test-asserted) — eligibility instead
of guessing, the L01 lesson at sink scale. Par 2.52 s (2.55) is the
reference ORDER, beatable within the tray: `drop → landing → straight →
gapLip` runs 2.47 s. Wrong SUBSETS stay real geometry: G's partials
(`drop`, `drop → landing`, `drop → straight`, `gapLip → landing`,
`straight`) are pinned to fall — the sink is the `drop`'s span (0.24 m,
longer than a flat roll-off can fly). The par line FLIES the sink
(`gapLip` → `drop` → `landing` → run-out) and replays BIT-IDENTICAL wet vs
dry (grip-independent to the bit, 2.517 s on the pre-pass chain,
unchanged by the zone). For every line a player can BUILD, the patch is a
TELLS-not-a-TOLL: the drips mark the sink, and no finishing line touches
the zone. The zone's grip physics are still measured — on
`kitchen04GroundBuild()`, which is now explicitly the HAZARD/JUICE PROBE it
physically always was: two loose `straight`s bridge the sink at ramp height
and drive THROUGH the patch, the hash diverges and the probe runs 0.06 s
FASTER wet (2.350 s dry → 2.292 s wet — the honest in-channel
manifestation of "halves grip" on a straight is LOW DRAG; sliding wide is a
channel-kinematics NO on a straight, [[Modules/hazards]]; the measurable
lateral signature is the straddled-patch-edge yaw, slip 2.38° → 3.98°).
The probe is NOT a route and never was one in the builder: its bridged
deck ends at the RAMP's deck height — above and 38 cm short of the cup the
chained par anchors (`fell` at 2.675 s, table below) — and with every
socket flat, no subset of this tray can bridge the sink AND terminate at
the low anchored cup. "The tap forces a line choice" is therefore a
chained-cup claim; ask #2b (`Level.finishSocket`) is what makes it a
choice. The 0.3 m `L04_STRAIGHT` and the ground build are byte-identical
FROM the stage-3 coherence/placement fixes: `wetPatch()` centres the zone
on the probe's seam, so the patch, the tap's yaw and the par's
bit-identical wet/dry hashes stayed exactly where those fixes put them —
the learnability pass moved no geometry, only the tray.

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
booster too late. STAGE-3 COHERENCE: this rung is where the tray rule was
checked against, not changed — its tray is ALREADY the exact multiset the par
build places (`gapLip`×2, `drop`×2, `landing`, `booster` = 6 = budget), both
wrong allocations fit the same tray, and every tray kind appears at ONE
geometry (the two `gapLip`s are the same parameters, laid as two instances).
The stage-3 playtest hand-off claimed L05's tray did not contain its par
pieces; measured against the shipped `initialBuild` + tray seating it does —
`trayParityBuild(KITCHEN05)` is byte-identical to its `parBuild()` and the
tray-basis par is 6/6. No geometry moved here; the rung's hashes are the
pre-coherence ones.

## The bedroom four (design cards)

The bedroom ladder (stage 4) is four rungs, not five — it inherits the
kitchen's five as its prequel (`nextLevelId` walks `kitchen05 → bedroom01`
and star-gates the walk as everywhere: `Next` appears only on an earned
star). Every rung rides the shared authoring kit
(`src/world/levels/bedroom01.level.ts` re-exports the placement math from
`kitchen01.level.ts` — that file's `lay`/`kitchenRamp`/`startSocketFromBuild`
are the family's, not the kitchen's) and the stage-3 invariants: tray =
multiset `parBuild` uses, ONE geometry per kind per level, par ≤ 4 tray
pieces. The set is the level: `bedroomSetPlacement`
(`src/world/setPlacement.ts`) centres the floor disc ON the run (x = the
par rail's midpoint — the rails are 2.2–2.5 m long and the disc is a
2.8 m diameter), slides it 15 cm off the corridor (−z) so every prop
solid clears the lane (homework near edge 14.6 cm off-axis, test-asserted)
and drops it so the floor sits 5 mm under the LOWEST authored line's
finish deck — the kitchen counter rule with one stage-4 addition: a
choice level's floor cannot bury a line the player can run (bedroom02's
soft line ends 18 cm below its par, so the row follows the soft line).

**BEDROOM 01 — Cable Dip** (`bedroom01.level.ts`, the tutorial of RIDE
OVER). The cable snake crossing the floor is the set's fourth voice, and
this rung says what a cable means: you do not launch at a cable — the
tray holds NO `gapLip` and none appears in the line. The deck steps DOWN
for the cable (the `drop` piece IS the dip: step, catch, roll-out)
between two 0.20 m `straight`s, and the exact three-piece fit finishes —
par 2.35 (measured 2.350 s), tray = par = 3 = budget, every piece
load-bearing. The promise is the kitchen L01 standard, on the shipped
builder's mounting: placing all three finishes (and every whole-tray
ORDER finishes — eligibility, not order-guessing), while every omission
falls against the anchored fixtures (bare, drop-only, straight-only,
either single straight missing — all `fell`, test-pinned). The geometry
is the stage-3-proven lazy-line catch (ramp 0.28, `KITCHEN_GAP` drop, one
0.20 m straight geometry — one step longer than the kitchen's 0.18 so the
rung's hashes are its own). Common failure: none that ends the run — the
hole the missing `drop` leaves is 0.136 m of empty span, longer than the
flat roll-off clears.

**BEDROOM 02 — Pillow Plateau** (`bedroom02.level.ts`). Teaches: a
choice off the mattress — stay high, or drop to the pillow. The par
(three of five tray pieces, 2.40 — measured 2.367 s) is the HIGH line:
three `straight`s, the deck never leaves plateau height, pure rolling.
The tempting SOFT line (`drop` off the plateau edge into the `landing`
pillow, then the floor run) finishes too — 2.575 s chained — and the
catch costs it 0.21 s. `trayParams` declares `drop`/`landing` (the par
line never places them — the choice pieces must seat at the geometry the
lines were measured on, not kit defaults). ANCHORED HONESTY (ask #2b,
and sharper here than kitchen02's table entry): on the mount the shipped
builder makes, ONLY the high line reaches the anchored cup — the soft
line runs 18 cm below the cup deck (`fell`, pinned by test), and the
two-straight partial falls short. "Two ways off the plateau" is a
chained-model claim; on one rail the plateau line is the only finisher,
and the card says so. The soft line stays authored data so the claim
stays falsifiable, not folklore.

**BEDROOM 03 — Pyramid Air** (`bedroom03.level.ts`). Teaches: one
launch, two catches — the trade-off is which catcher you buy. The line:
`gapLip` off the book pyramid (a fixture-top `ramp` at 0.30), then
EITHER the HARD catch (the `drop`'s stepped catch onto the desk deck,
then the run-out straight — the PAR, 4 of 5 tray pieces, 2.70 — measured
2.667 s) OR the SOFT catch (a longer 0.32 m `landing`, declared in
`trayParams`, measured 2.708 s). The hard catch wins the clock by 0.04 s
— small, measured, true. No whole-tray wall (the Playtest-G rule this
rung was authored under): placing ALL FIVE finishes in every order
sampled (2.483–2.558 s — faster than the par, at the cost of the pieces
star), so the only dead builds are the ones that SKIP the catcher; the
soft four-piece fit falls against the anchored cup (chained-model claim,
ask #2b, test-pinned). THE TUNNEL THAT IS NOT: the half-open drawer would
be the third line — straight through the bore. It stays a dream for the
kitchen-bowl reasons plus one: the builder cannot seat on a prop socket
(ask #4), and the bore never crosses the level corridor — so this level
exports `propSockets` `drawer.in`/`drawer.out` through its own set mount
(the `BOWL_SOCKET_FRAMES` convention, `DRAWER_SOCKET_FRAMES` carried by
`bedroomSetPlacement`) AND states the defect: `drawer.in`'s tangent
points OUT of the bore at both ends (it is `+DRAWER_AXIS` at the front
face), against the travel direction the bowl pair's convention defines.
The ask to the Environment Artist (ask #5) is a tangent flip and one
lane-crossing bore anchor — not a remodel.

**BEDROOM 04 — Lights Out** (`bedroom04.level.ts`, the capstone). Every
bedroom verb on one line — deck run (`straight`), pyramid launch
(`gapLip`), cable dip-and-catch (`drop`), soft run-out (`landing`) — and
the tray IS the answer: four pieces, budget four, all load-bearing, the
Playtest-G lesson as architecture. All 24 whole-tray orders finish on the
builder's anchored mount (measured 2.467–3.300 s, test-gated exactly like
kitchen04's gate), the par ORDER (2.683 → par 2.70) is beatable within
the tray (`drop → landing → straight → gapLip` runs 2.467 s), and the
lamp-shadow drama is PURE STAGING — the practical is the set's own
`LAMP.bulb` point light; the level moves no light and no mechanic. The
`straight` is 0.30 m here, not the ladder's 0.20: the order-invariant
whole-tray SUM that makes 24/24 possible was proven at the kitchen L04
sweep's 0.3 m run-out geometry, and one-geometry-per-kind holds — the
tray seats its one straight at 0.30.

## Sandbox (per set)

The kitchen sandbox: `sandbox: true`, budget 999 ("no budget"), every piece
unlocked at 99 copies; the reference build is one clean lap of every drivable
kitchen verb and finishes in 2.667 s (par 2.70, `parPieces` 5 on the tray
basis). Its two counter straights are one 0.175 m geometry (`SB_STRAIGHT`) —
the same 0.35 m of deck the lap always had, as two pieces the tray can
actually seat. Other sets' sandboxes follow the same
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
flies the patch), while its ground-build hash DIVERGES (the probe drives
through) — the probe left the tray ⊇ line roster at the L04 learnability
pass (it is hazard data replay, not a player route; see the L04 card). One placement correction shipped with the hook: `wetPatch()`
now centres the patch on the ground build's straight seam (the decked
sink's middle) — the earlier centre, taken from the PAR rig's landing run,
sat on the par line's own deck and quietly broke the par's
grip-independence promise the moment the hook existed. Flagged for LD
review. The bathroom ladder (stage 4) generalises the convention into
`wetPatchOverSeam` (`bathroom01.level.ts`) — a zone centred on a named
build's entry-frame seam — and states the split explicitly: the bathroom
SET carries wet-patch FILMS as decoration (`DRIPS` in
`src/sets/bathroom/data.ts`), the LEVELS carry the live zones; lining a
film up with a zone centre across a mounted set is ask #6. The garden
ladder (stage 4) keeps the convention and changes only the SOURCE tag: the
sprinkler sprawl of garden03/04 is a plain `WetPatch` disc whose `source:
'sprinkler'` names the head it belongs to — the cycling head itself is a
NEW KIND (ask #7b), and until it lands no rung makes a timing claim.

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

**Ask #4 — seat a piece on a PROP socket (the bowl line's other half).**
L03's rim sockets are real data — `bowl.in`/`bowl.out` ride the set's
`BOWL_SOCKET_FRAMES` through the level's mount, and the mesh passes through
them by contract — but the BUILDER never offers them: `targets()` in
`src/ui/builder.ts` walks the sockets of PLACED PIECES only, so a `bank` can
only ever be seated on the end of a track. The day ask #1 lands, the bowl line
is still two edits from shippable: the builder must list named prop sockets as
targets (labels the player can read, `bowl.in`), and the seating must respect
the set's own placement matrix so the piece rides the bowl wherever the level
mounts it. Without it, "seat a `bank` between the rim sockets" is an
authoring joke — the player has no way to do it and the rim stays a fixture.
Owner: Systems Engineer (builder) with the Environment Artist on the labels.

**Ask #5 — put the bedroom tunnel and cable on the lane (blocking: the
bedroom03 third line, the bedroom01 story).** Two set asks from the
bedroom ladder, one per prop. (a) THE DRAWER BORE:
`DRAWER_SOCKET_FRAMES` carries `drawer.in`'s tangent as `+DRAWER_AXIS` at
the FRONT face — out of the bore, against the in-then-through travel
direction the `bowl.in`/`bowl.out` convention defines (the bowl pair's
tangents point ALONG the ride; the drawer pair's point away from it at
both ends). One sign flip (or mirroring the pair the way the rim does)
makes the frames lawful data. And no level chain can cross the bore at
deck height today: the dresser sits 30 cm behind the corridor the set's
own layout draws, and yawing the room onto the bore lands the bed and
pyramid ON the lane (measured while authoring bedroom03 — the placement
table therefore keeps yaw 0 and the tunnel stays a fixture-dream). What
the tunnel needs is one bore-aligned anchor a level can cross — a second
dresser placement, or a dresser-only offset the SetInstance surface can
carry — with the neighbours kept off the +x lane. (b) THE CABLE: the AD
ratified the cable as a TRACK ask, not a grip zone, and the set is a
visual mount (no colliders — the kitchen rule), so the "speed bump" a
level can teach with is the `drop` it already rides. One named anchor —
where the cable's run crosses the future track corridor — would let the
dip card's story be geometry instead of prose. Owners: Environment Artist
(anchors, tangent sign), Systems Engineer (dresser-only placement, ask #4
for the seating side).

**Ask #6 — put the bathroom wet-patch film on the lane (blocking: nothing;
weakening: bathroom01/04's affordance precision).** Variant A's two wet-
patch films sit on room-centre tile around the DEV track the exploration
was dressed on; production mounts the set 25 cm behind a straight +x lane,
so at every rung's mount the films land 10–25 cm SHORT of the live zone's
footprint (centred on the deck seam by the kitchen04 convention) — the
puddle TELLS but does not exactly touch the zone's near edge, and rung 01's
"reads before it bites" is a near-miss rather than an exact overlay. The
fix is one data value, not a remodel: a lane-crossing wetPatch anchor —
move one `DRIPS` row so that at the four shipped mounts its world position
lands inside the zone footprint (`tests/unit/bathroom-levels.test.ts` will
assert the overlap the day it lands). Why not yaw, like kitchen04's tap?
Measured while authoring bathroom01: variant A's prop cluster spans ±0.29 m
of the set origin AROUND the dev track line, so any yaw that maps a film
onto a lane-centred zone swings the TUB shell across the corridor guard
boxes — the same finding that keeps `bathroomSetPlacement` at yaw 0.
Owner: Environment Artist (one data row).

**Ask #7 — the garden's bowl and the garden's clock (from the garden
ladder, stage 4).** Two asks from the garden four, one per blocked idea.
**(a) THE BIRDBATH (Environment Artist, blocking: a future bowl-turn rung,
not garden02 — which ships its choice honest).** The brief asked the
garden ladder for a bowl moment; the ratified variant-B set has no birdbath
(the exploration deliberately skipped the bowl so the garden would not
repeat the kitchen hero), and its one socketed signature, the drain-pipe
bore, never crosses the +x lane at any mount that keeps the dress off the
corridor (`tests/unit/garden-levels.test.ts` pins the mouth ≥ 70 cm behind
the lane; a set yaw that brought it across would undo the ratified off-
axis bore fix and swing the can onto the corridor — the bathroom lesson,
re-measured). What a bowl turn needs is one bowl WITH a lane-crossing
socket pair — a birdbath prop placed (or a second placement anchor carried
on the SetInstance surface, ask #5's shape) whose `birdbath.in`/`birdbath.
out` frames follow the rim's in-then-through tangent convention — and then
ask #1 (drivable yaw) and ask #4 (prop-socket seating) still stand between
the frames and a rideable turn. **(b) THE SPRINKLER KIND (Systems
Engineer / Technical Artist, blocking: nothing — garden03 ships its trade-
off without the clock).** The concept's sprinkler is a TIMED gate — "pure
vertical motion in a set of straights" — and `src/world/hazards.ts` has
one kind, the static `WetPatch` disc. A `sprinkler` hazard kind — centre,
radius, `dutyCycle`/`phase`, normalising to the same per-contact grip
field — would let a rung teach grip-vs-WAITING instead of grip-vs-time;
garden03/04 ship the always-wet sprawl (`source: 'sprinkler'`) and claim
no timing. Owner split as written: (a) is one prop and an anchor, (b) is
one hazard normaliser.

## The same data replayed the way the BUILDER mounts it

Every claim above is a `lay`/`chain` build: the cup rides at the end of
whatever line is being replayed. The shipped builder mounts the level
DIFFERENTLY — `initialBuild` anchors the fixtures at their par transforms and
the player's pieces chain off them — and a line that fits the tray can still
behave differently against an anchored cup. Measured at this pass (the same
seats, the tray's own geometry, fixtures anchored):

| line | chained (the card's number) | anchored (what a player builds) |
|---|---|---|
| L02 arc route | finished 2.442 s | finished **2.242 s — FASTER than the lazy par (2.317 s)** |
| L04 ground build (hazard probe, not a route since the learnability pass) | finished 2.292 s (wet) | **`fell` at 2.675 s** — two 0.3 m straights stop short of the anchored cup |
| L05 both wrong allocations | `fell` | `fell` (unchanged: the trade-off holds either way) |

So two card claims are properties of the CHAINED data model, not of the game:
L02's "the lazy line is the fast one" (a ballistic crossing beats rolling a
`drop` when both must reach the same fixed cup) and L04's decked-sink
probe (it cannot reach the cup at all — since the learnability pass the L04
card claims the anchored truth directly and keeps the probe as hazard
data). Both are ask #2b's
(`Level.finishSocket`) — with a level-owned finish point the two lines would
be measured against the same world position in replay and in the builder, and
these two claims become testable in the shipped mounting. Until then the
cards state the chained number and this table states the other one.

**And the tutorial's target walk (fixed at this pass).** The shipped
builder's `targets()` list is in ARRAY order, and `initialBuild` mounts the
fixtures FIRST — so on L01 the list starts `[level start, end of ramp, end of
finishCup]`, and after the player seats the `gapLip` on the ramp's exit the
list becomes `[level start, end of finishCup, end of gapLip]`: the same
"place" keystroke now aims at the CUP's exit and the `drop` is seated there,
a few centimetres from where the line is. The three-piece fit therefore failed
in the UI while finishing byte-identically in every data-level test
(`fell`, 2.41 s, hash 0951a819 — reproduced headlessly by porting the target
rule), which is why `tests/e2e/shell.spec.ts` "building all three tray
pieces…" was red on `main` from the moment the L01 promise fix merged. The fix
is in the builder, not the geometry: after a successful `place()` the default
target moves to the exit the placed piece just created (`src/ui/builder.ts`),
and the arrows still walk everywhere. The UI/Systems lane should sanity-check
that follow rule against its own plans for target discoverability (ask #2b
will move these targets again).

## Blocked rungs

L02's curve and L03's bowl line are BLOCKED pending ask #1 (the levels
themselves are NOT blocked — both par builds finish and both levels teach
their choice/hazard lessons). L03's bowl line additionally needs ask #4
(prop-socket seating in the builder). The bedroom's drawer-tunnel THIRD
line is BLOCKED (ask #5 — a tangent flip plus a lane-crossing bore
anchor — with ask #4 on the seating side); the rung is NOT (bedroom03's
two authored lines finish and its trade-off is measured). The bathroom
four (stage 4) ship UNBLOCKED — all four par builds finish, both hazard
gates measure, and 02's anchored truth is the ladder's rare case where ask
#2b bites LESS than expected (both lines reach the cup); the rung-shaped
caveat there is the grip one: on channel straights "rides around, not
through" is a TELLS-not-a-TOLL lesson whose toll half waits on ask #1's
lateral authority (the wet-zone low-drag and step-grazing numbers are
pinned in `tests/unit/bathroom-levels.test.ts`). The garden four (stage 4)
also ship UNBLOCKED on the same evidence (par finishes, choice measured on
both mountings, wet/dry hashes pinned), with two honest caveats stated at
the cards: garden02's SHOWY half points at a bore that is staging, not a
ride (the bowl turn proper is ask #7a behind ask #1/#4, kitchen L03's
pattern), and garden03's SPRINKLER is a clockless sprawl until ask #7b
gives the hazard model a timed kind. See
[[Reference/Level Ladder]].

## Guarded by

`tests/unit/kitchen-levels.test.ts` — every kitchen parBuild finishes
headless through `src/replay/replay.ts` (same seam share links use), the L01
three-piece promise (exact fit finishes with margin: seed-stable, release-
speed-range; every tray-piece omission fails against the anchored fixtures),
L02's two lines and L04's ground PROBE finish, L02's Playtest-E lazy build
finishes anchored, L04's WHOLE-TRAY ORDER SWEEP finishes (all 24 orders of
the four tray pieces — the Playtest G learnability gate) while G's partial
builds fall, L05's two wrong allocations do
not, budgets equal trays, the sandbox exists, and the bowl sockets are
exported. The stage-3 coherence pass adds the describe **"kitchen ladder —
tray ⊇ parBuild (a level you cannot build is not a level)"**: per level and
per AUTHORED line, every piece is tray- or fixture-afforded and placed at the
tray's one geometry per kind; per level, `trayParityBuild` (the builder's own
seating of the par line) is byte-identical to `parBuild()`, and
`pars.json`'s par piece count equals the level's tray-basis `par.pieces`.
The stage-4 bedroom pass adds `tests/unit/bedroom-levels.test.ts` — the
same gates for the bedroom four (every par finishes headless, contracts,
both authored lines of 02/03, the 01 only-fit with every omission falling
anchored, 03's no-wall whole tray, 04's 24/24 sweep and beatable par, the
placement table derived from the live builds, the drawer sockets
exported) AND the describe **"ladders (kitchen + bedroom) — tray ⊇
parBuild on EVERY authored level"**, which runs the invariant over BOTH
ladders' rosters and their alternates — the rule is one test over the
whole shipped ladder now, not a kitchen file. (Since the bathroom pass
that describe spans THREE ladders — kitchen, bedroom, bathroom — and the
bathroom's two alternates ride in it too.) The stage-4 bathroom pass adds
`tests/unit/bathroom-levels.test.ts` — the same gates for the bathroom
four PLUS the hazard gates the L04 pass established: every bathroom par
replays BIT-IDENTICAL wet vs dry, every probe/splash line DIVERGES and
runs wet-FASTER (the low-drag truth, not folk physics), 03's wet splash
still loses to the dry high line, 04's sampled whole-tray orders replay
wet == dry, and the placement table (rail midpoint, −25 cm offset, lowest-
deck floor) is re-derived from the live builds with every prop's lane
clearance asserted analytically. The stage-4 garden pass adds
`tests/unit/garden-levels.test.ts` — the same gates for the garden four
(pars finish, contracts, 01's exact fit + omission table + pinned order,
02's choice on both mountings + the bore-stays-off-the-lane geometry check,
03's wet-shortcut hashes, 04's 24/24 sweep that is its own wet sweep + the
probe) PLUS the flush-deck placement derivation (the paving's `DECK_Y`
surface rides the lowest authored deck) and a DERIVED dress sweep: every
`dress` mesh's live group box must clear the corridor by 10 cm at every
rung's mount (the hose coil in its forward sun stripe is why the garden
offset is 52 cm, the widest of the four sets) — and extends the cross-
ladder describe to FOUR ladders (kitchen, bedroom, bathroom, garden; the
garden bore line and wet shortcut ride the roster).
