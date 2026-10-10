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

## Ordering of the ladder (stage 6 T3.1 re-weave)

`CAMPAIGN_LADDER` in `campaign.ts` is authored FLAT and the rooms are a
projection of it (`CAMPAIGN` groups its rungs under room headings for the
select; `nextInCampaign`/`previousInCampaign`/`levelUnlock` read the flat
order and nothing else). The weave answers the player evaluation's déjà vu
("rung 8 is rung 1 with different wallpaper" — the five rooms' 01-style gap
rungs and every room's identical grammar cluster) by interleaving the rooms.
**The honest line the plan insists on: nav-only interleaving TREATS THE
SYMPTOM — the grammar repetition is still there, it is no longer
back-to-back; the cure is T3.2 (ghost racing).** Laws, all asserted in
`campaign.test.ts`:

1. **Grammar gap.** Grammar = the room's rung number (01 intro/gap lesson,
   02 CHOICE, 03 TRADE-OFF/order, 04 capstone, 05 encore/finale). Consecutive
   same-grammar rungs sit ≥3 indices apart.
2. **Prerequisite table** (derived from the rung notes; a rung never assumes
   a lesson it has not yet had): every `X04` after `X01,X02,X03` (each
   capstone spends its room's verbs); `kitchen05` after `kitchen01..04`;
   `porch05` after `porch01..04` and LAST; every encore `X05` after
   `X01,X03` (it doubles the room's founding sentence and spends its
   catcher); every encore after `kitchen05` (each carries a `booster`
   TEMPTATION — the booster lesson is Sunday Run's); every rung SHIPING A
   LIVE GRIP ZONE (the `hazards` rows: `bathroom01/03/04/05`,
   `garage01/03/04/05`, `garden03/04/05`) after `kitchen04` (the wet-patch
   lesson); `bedroom01` after `kitchen01` (its no-launch lesson reframes the
   launch verb the tutorial taught). Edge cases: `garden01`'s shadow bars
   are NOT a grip zone (no live hazards — exempt); the encoures' PORCH
   THRESHOLD dip-lead geometry is a rung-local AUTHORING citation, not a
   player lesson (no porch prerequisite); the porch rungs ship no live zone
   and no booster (exempt except by room arc).
3. **Arcs preserved.** Within every room the authored order is intact
   (01,02,03,05,04 — kitchen/porch straight 01..05), every encore lands
   DIRECTLY on its room's `04`, and each room's `04` is that room's last
   rung — `bedroom04` still reads as a capstone. The per-room "entering the
   campaign after X04" sentences in the room sections below describe ARRIVAL
   eras in the set registry; the FLAT play order is the weave, stated here
   and in `campaign.ts`.
4. **Rising curve.** No rung's tray (`pars.json` parPieces) is more than two
   pieces smaller than its predecessor's, and the second half is not easier
   than the first (means from `pars.json`). The room-intro rungs reset FELT
   difficulty gently by design; parTime is not comparable across clock
   families (the porch clocks are kitchen02's chute clocks), so the curve law
   speaks in tray size.
5. **Beginner walk (design call).** The first five rungs are the KITCHEN RAMP
   (tutorial, choice, speed — the house's verbs in the shipped tutorial
   order) into the BEDROOM RAMP (the ride-over reframe and its choice):
   interleave-WITH-RAMPS, not interleave-only — pure round-robin front-loads
   six wallpaper variants of the same intro rung, which is the disease. Then
   the weave opens: back to the kitchen's tap and booster (6–7), the bathroom
   era (8–12), the garden's wake carrying the bedroom encore onto its finale
   (13–19), the garage block (20–24), the porch as the closing block (25–29).

The shipped order: kitchen01, kitchen02, kitchen03, bedroom01, bedroom02,
kitchen04, kitchen05, bedroom03, bathroom01, bathroom02, bathroom03,
bathroom05, bathroom04, garden01, garden02, bedroom05, bedroom04, garden03,
garden05, garden04, garage01, garage02, garage03, garage05, garage04, porch01,
porch02, porch03, porch04, porch05. Nav data only: ids are the shipped
append-only ones, no level file moved, and `replay:all` is byte-identical
rung-for-rung (verified by per-rung hash diff against the pre-weave tree).
Saves need no migration: `stars`/`reached` record IDS, so a mid-campaign save
resolves its next rung from the new order sanely (asserted in
`campaign.test.ts`).

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
  them ANCHORED at their par transforms — by PER-KIND QUOTA (the `fixtures`
  counts themselves, build order): a kind may not live in BOTH the tray and
  the fixtures, and the boot-invariant test (`tests/unit/boot-invariants.test.ts`)
  gates every rung on it — the N-wave kitchen02 "tray empty at boot" fault
  was exactly what the old membership test did when it could not tell a
  fixture's copy from a tray piece's. This is also why a piece-count par is
  counted WITHOUT them (§Pars are counted on the tray basis).
- `parBuild()` — the Level Designer's reference build: fixtures plus the
  intended line. This is the pars-regeneration seam: a script replays it
  headless and writes `par.time`. Every parBuild in the ladder must finish —
  that is `tests/unit/kitchen-levels.test.ts`, not prose.
- `sandbox?: boolean` — the no-budget variant. Since the stage-6 sandbox
  pass every room ships one: `kitchen-sandbox`, `bedroom-sandbox`,
  `bathroom-sandbox`, `garden-sandbox`, `garage-sandbox`,
  `porch-sandbox`, each registered by its room's `05` level file (the
  kitchen's lives in `src/world/levels/kitchen05.level.ts`). See §Sandbox
  (per set).
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
bedroom03 — bedroom02 retired its own case at the B2 redesign): BOTH
lines reach the fixed cup and the lazy one still wins
— 2.350 vs 2.367, test-pinned. Whole-tray orders finish every order the
test samples (2.292–2.392; the best order beats the par clock at the
pieces-star's cost) — but the CHOICE tray is not order-invariant whole
(swept at authoring: 39 of the 60 distinct whole-tray orders finish — the
extra two pieces are the OTHER line's parts; the family measured the same
property on bedroom02, 7 of 20 finish since the B2 redesign). The order-invariance gate lives on the
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

## The garage four (design cards)

The garage ladder (stage 4) is four rungs on the RATIFIED variant-C set
(`src/sets/garage/data.ts` — epoxy sparkle, door-gap sunblade, the
bike-wheel tunnel goal line, 12/13 at both production cameras,
`Reference/Review 2026-10-08 Stage 4 garage.md`), entering the campaign
after `garden04` as the campaign's LAST room. The geometry economy is the
bathroom's verbatim (one 0.20 m `straight` geometry for 01–03, the 0.30 m
sweep seating on 04, `KITCHEN_GAP` as `SHOP_GAP`, ramps 0.22/0.28/0.30/
0.26), so the garage clocks ARE the bathroom clocks — the rung LESSONS are
the new thing and the tests pin relationships, not folklore. Set mounting
is the bedroom rule (`garageSetPlacement`): slab centred on the run,
37 cm BEHIND the corridor (`GARAGE_AXIS_OFFSET` — the family-tightest
offset, set by the forward-most dress solid, the flattened cardboard at
set z +0.261, and swept from the live group boxes by the ladder test),
the flush slab 5 mm under the LOWEST authored finish deck, yaw 0 (the
ratified wheel, blade corridor and stain films all sit behind the set-
origin line; the AD's own goal-line composition is the reason, the
bathroom/garden lesson re-measured). The room's lessons trace to its own
reviewed physics: the stain's FILM treatment (round-2 fix 5), variant B's
ported mezzanine beat (carry-forward 4), and the AD's hazard-affordance
scoreboard ("bike-wheel tunnel = ready and should anchor the garage's
goal-line levels").

**GARAGE 01 — The Stain** (`garage01.level.ts`, the hazard enters). Teaches:
the OIL-STAIN grip hazard — the patch IS the lesson, and the AD's round-2
film treatment is what makes the tell honest (a sheen on the epoxy, not a
decal): `gripFactor` 0.5 on a live `wetPatch` (`source: 'oilStain'`,
centred by `wetPatchOverSeam` on the decked probe's seam, the kitchen04
convention). The physics is the kitchen-L01/bathroom01 flight (ramp 0.22,
tray = the exact multiset, par 3, 2.25 — measured 2.233 s, builder-mount
byte-identical, wet == dry to the bit, every omission `fell` anchored,
five of six orders finish with `landing→drop→gapLip` pinned). The THROUGH
line is the tray-unbuyable PROBE: it diverges wet and runs wet-FASTER
(2.250 < 2.383 — the low-drag truth, not folk physics). The first-sight
line `prop:oilStain` is registered by THIS rung's file — the ratified set
module carries no `PROP_CALLOUTS` row (ask #8a; the bathroom
`prop:wetPatch` precedent is where the line should live).

**GARAGE 02 — Mezzanine** (`garage02.level.ts`). Teaches: the CHOICE the
AD's carry-forward 4 ported into C's geometry — the workbench HEIGHT line
vs the garage FLOOR line, a real trade-off with both routes in one tray
(5 pieces, the union, none spare). The HIGH line is the par and the fast
one (pure rolling, 3 of 5, 2.40 — measured 2.367); the FLOOR line
(`garage02FloorBuild`: the `drop` off the bench edge, the soft `landing`
catch, the floor run) finishes chained at 2.575 and `fell` against the
ANCHORED cup (2.925 — bedroom02's plateau property, ask #2b, pinned and
stated on the card). Sampled whole-tray orders: the pure-high subset
finishes and one beats the par clock (2.250); mixed orders `fell` — the
choice tray is not whole-order-invariant (the capstone's gate is).
`trayParams` seats the `drop`/`landing` the par never places; every other
tray kind seats automatically from its first `parBuild` placement.

**GARAGE 03 — Wheel Tunnel** (`garage03.level.ts`). Teaches: the
TRADE-OFF the ratified goal line FORCES — the tunnel is on the straight,
so the straight is the speed line; the oil-film LANE costs time. The par
(4 of 5, 2.70 — measured 2.667) launches down the corridor with the hard
DRY `drop` catch and flies the film (wet == dry bit-for-bit); the LANE
(the soft `landing` twin declared in `trayParams`, chained 2.675) is
legitimately wet — its hash diverges and it beats its own dry (2.708) yet
STILL loses to the speed line, bathroom03's tightest margin re-flowed —
and `fell` anchored (ask #2b). The zone sits deep on the lane's own deck
(the bathroom03 centring fix verbatim). THE TUNNEL THAT IS NOT: variant C
declares no sockets — the wheel is a goal-line STORY, not a bore — so the
ride THROUGH it is staging (the bathroom drain / garden bore pattern);
the live box test pins the wheel entirely behind the corridor at every
mount, and a bore ride needs a lane-crossing tunnel anchor (ask #8b)
behind ask #4's prop-socket seating and ask #1 as always. The whole tray
finishes every order sampled (best 2.483; the choice tray is not whole-
order-invariant).

**GARAGE 04 — Last Lap** (`garage04.level.ts`, the capstone AND the
campaign's final rung). Every garage verb on one line at bench HEIGHT
(ramp 0.26, rung 02's lesson under the wheels) with the oil film LIVE
under the flight window (centred by the bathroom04 rule: the par's
landing-entry x at the decked (probe) y) — the brief's stain + height
combination, not a re-run. The tray IS the par's exact multiset, ALL 24
whole-tray orders finish (2.467–3.300, the sweep seating inherited
deliberately — your ORDERING is the line choice, the par ORDER beatable
at 2.467 s), and the dry sweep IS a wet sweep: par and the sampled orders
replay BIT-IDENTICAL wet vs dry; the decked probe (one 0.62 m bridge the
tray cannot seat) diverges and runs wet-faster (2.583 vs 2.717). After
this rung `nextInCampaign('garage04') === null` — the campaign ends in
the garage, under the door-gap blade with the wheel standing at the end
of the straight.

The garage rungs join the campaign after `garden04`
(`nextInCampaign('garden04') === 'garage01'`), making the room order
kitchen → bedroom → bathroom → garden → GARAGE and closing the campaign:
garage04 is the last rung on the ladder and the last `nextInCampaign`
step (null beyond it). `tests/unit/garage-levels.test.ts` is the rung
gate; the cross-ladder tray ⊇ parBuild roster spans FIVE ladders.


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

## The porch five (design cards)

The porch ladder (stage 5) is five rungs on the RATIFIED porch set
(`src/sets/porch/data.ts` — the weave-shade lattice, the threshold pair,
the gutter flume, 12/13 at the production cameras,
`Reference/Review 2026-10-09 Stage 5 porch set.md`), entering the campaign
after `garage04` as the campaign's LAST room. THE ROOM SHIPS ZERO LIVE
HAZARD ZONES BY LAW: the set's `HAZARDS` is empty and no rung adds a zone
— the weave shade is garden01's read-only-rhythm doctrine promoted to a
room rule, and the taught hazard (rain on the planks) must wait for
enforced physics, never a decorative zone. Every rung launches on the
fail-timing tool — the −29°/0.16 m MORNING CHUTE (`porch01`'s
`PORCH_GEOM`, the kit file the whole ladder shares: `PORCH_STRAIGHT`
0.11, `PORCH_LIP`/`THRESHOLD_GAP` (kitchen02's drop with the 0.125
porch leads), the PINNED `PORCH_STEP` and the `PORCH_SINK`) — so every
death on every rung lands under ~1.5 s and the death families are the
rung cards' currency. Set mounting is the bedroom rule
(`porchSetPlacement`): planks centred on the run, 53 cm BEHIND the
corridor (`PORCH_AXIS_OFFSET` — set by the forward-most dress solid, the
ROOF CORNER POSTS at set z +0.421, swept from the live group boxes by
the ladder test), the flush planks (`DECK_Y`, the deck's own 5 mm
carried explicitly) 5 mm under the LOWEST authored finish deck, yaw 0
(the ratified weave, door and gutter stay as reviewed). The threshold
pair is STAGING: `porch02` exports `door.in`/`door.out` through its
mount, INSIDE the deck bounds with its travel axis ACROSS the +x lane —
a ride through the door needs ask #4's prop-socket seating behind a
lane-crossing anchor, and the porch's ask is exactly that anchor. The
callouts (`prop:weaveShadow`, `prop:gutterFlume`) are registered BY THE
SET MODULE — garage ask #8a, answered where it was asked.

**PORCH 01 — Screen Door** (`porch01.level.ts`, the tutorial). Teaches:
the morning flight under the weave — one pop, one catch, one plank, on
the chute tool. Tray = the par line's exact multiset (3 = budget), par 3,
1.10 (measured 1.058, builder-mount byte-identical); ALL 6 whole-tray
orders finish (1.017–1.083) and every omission FALLS — the ramp-end
family UNDER 1 s (0.867–0.967), the single late death (lip+drop over the
far deck, 1.275) a distinct family 0.3 s clear. The cleanest
fail-timing-law statement in the house.

**PORCH 02 — The Open Door** (`porch02.level.ts`). Teaches: the CHOICE —
the lazy three-plank deck vs the POP at the door mouth — with the AD's
threshold pair as pure staging (the pair sits inside the deck, never in
the lane; the test pins it). Tray = the 5-piece union, par 4 (the deck
line, 1.20 — measured 1.158); the door line (`porch02DoorBuild`, the lip
swapped into the deck at span-equal geometry) finishes 1.250 CHAINED AND
ANCHORED — both lines reach, the lazy one still wins, ask #2b retired by
construction. ALL 20 whole-tray orders finish (1.142–1.358, the
kitchen02 sum law); the omission families split ≤1.05 ramp-end vs the
1.25–1.43 far-deck class.

**PORCH 03 — The Step** (`porch03.level.ts`, the rung the anti-cheat
war forged). Teaches: WHERE the step goes in the chain is the whole game
— kitchen03's trench-order lesson on the PINNED geometry. Tray = the
par's whole multiset (4 = budget, 1.25 — measured 1.242): **no subset
finishes at all** (all 11 swept omissions FALL, 0.967–1.408). The first
tuning shipped a fifth piece — a sink ramp — and the sweep kept finding
a no-lip belly bridge finishing UNDER the par line; kitchen03's shape
(tray = par, no landing in the tray) is the cure, and porch05 keeps the
sink only where every line still needs its pops. 22 of 24 orders finish
(lip-first with the step LAST wedges — porch04's belly law announced
early); the exported BOUNCE line (`porch03BounceBuild`) slams the step
off the chute itself and beats par at 1.125 with all four pieces —
kitchen02's beable-par hidden in plain sight.

**PORCH 04 — Sunday Morning** (`porch04.level.ts`, the deck capstone).
Teaches: everything at once, and the LAW that every piece must earn its
place — the PINNED STEP (`PORCH_STEP`: 0.14 m on 55° knife walls, span
preserved at 0.35 so every reach equality holds) was tuned HERE after
the sweep caught a belly build rolling the stock trench UNDER the par
line: the belly that finishes on the ladder's forgiving step DIES here
at 1.475 while ALL 24 whole-tray orders still finish (1.083–1.367) and
no legitimate order beats the par ORDER (1.083 = par itself, 4 of 4,
1.10). The one surviving 3-piece shortcut (pop, step, sink) arrives 0.15
s OVER the par line — pieces star, never the time star.

**PORCH 05 — The Crossing** (`porch05.level.ts`, the campaign's last
rung). Teaches: TWO thresholds — the door mouth and the stoam edge, one
per line — and the crossing you choose. Par (4, 1.20 — measured 1.192)
SINKS the mouth (`PORCH_SINK`, the soft catch that keeps the speed) and
belly-steps the stoam run-out; the catch-first alternative
(`porch05CatchFirstBuild`, 1.392) pops onto the step HARD at both
thresholds. Both finish chained AND anchored at the same single cup
(equal reach sums, the sink's span == the step's), ALL 12 orders finish
(1.117–1.475), the par order is beatable within the tray (1.117 — the
campaign lets you leave fast), and every subset FALLS by 1.525 except
the one-threshold shortcut, 0.07 s over the line. `porch05.next ===
null` — the campaign ends in the yard light.

## Pars are counted on the tray basis

`scripts/gen-pars.mjs` writes `parPieces` = the pieces the reference build
places **minus the level's `fixtures`**, because every consumer counts that
way: `Builder.playerCount` (the tray counter, the budget gate, the star line
and the panel's "N pieces — par M") never counts a built-in fixture, and
`playerPieceCount` in `src/ui/advice.ts` applies the same rule to a replay/share
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
that the fast line is not the showy one. STAGE-4 DISCOVERABILITY PASS (the
Playtest H + K wall) fixed WHICH builds finish — the tray is now the UNION
of the two lines ({`straight`×2, `gapLip`, `drop`} = 4, none spare), one
`straight` geometry EQUAL to the `gapLip`'s span (the reach-sum law: flat
sockets ⇒ a chain's reach is the SUM of its spans), and EVERY order of the
whole tray finishes — **until the P4 shortlist pass (2026-10-10, item 1):
"every order finishes" was also "place-everything is a line", so the rung
asked for no CHOICE. The tray is unchanged (the union, none spare) but the
rung now sets `blockedGoalSeat` (`src/world/level.ts`): the builder derives
the goal piece's body as a named placement-guard solid (`goalGuardFor`,
`src/ui/builder.ts` — AABB clipped at the mouth plane, placement layer
only, no collider, no physics read) and the union dump's tail seat is
REFUSED at the rim — `blocked — the cup is in the way`. The three legal
lines clear the guard by ≥ 2 mm (measured); the twelve whole-tray orders
all land their 4th piece in or past the cup body, so the dump must choose
and the trio the refusal leaves seated FALLS (the union line can die).
The par replay hash rides unchanged, byte-identical at `0b4dbab2` — the
honest check `replayRun` makes with the flag set (`tests/unit/goal-guard.test.ts`;
`replay:all` 30/30; `tests/e2e/goal-rung.spec.ts` proves refusal, death,
and that BOTH authored lines still seat everything and finish).** STAGE-4 FAIL-TIMING PASS (this pass) fixed what the
WRONG builds teach. Every later playtest died INVISIBLE and IDENTICAL: nine
distinct wrong builds and first tries all ended at ~2.2–2.4 s, "car vanished
out of sight" — because the shared `kitchenRamp(0.28)` (−12°, a 1.43 m
crawl) spends ~1.8 s of clock before any chain can discover its mistake,
then all cover a similar flight to a similar near-cup death. The standing
finding — "the ramp's angle is the CLUSTERING ENGINE; sweep steeper launch
ramps × void sizes" — was executed as ~25 000 headless worlds on the shipped
mount; the sweep's verdict: THE DEATH CLOCK IS RAMP-END ARRIVAL + A CONSTANT
~0.4 s FALL (angle moves it only through height), a belly hop across a flat
air gap dies at ≥ 0.10 m of gap (no hop distance at all), and no
flat-socket void size separates a lip catapult from a drop catch — so
separation must come from the CLOCK, by steering the release line straight
into the void. THE GEOMETRY NOW: a short steep chute (`angle −29`, 0.16 m —
a stated deviation from the ladder's −12° ramp convention, like L04's gap),
blend 0.12 m (its own knob: the 0.08 blend left the run camera pitched down
the chute while the car was at the drop — car at |ndc| 0.99 past the 0.95
frustum gate; 0.12 eases it to 0.89, and 0.14, though camera-clean, stalls
one whole-tray order); one `straight` = the lip's span = 0.11 m (doubled
with the lip's deck length 0.0405, law intact); the `drop` deviates again —
0.10 m step (below the ladder's 0.12) with 0.125 m leads: at 0.12 of step
NO lead stopped the `gapLip → drop` pair wedge-capturing the cup lip at par
speed; at 0.10 the pair-belly and the pop-catch thresholds coexist and
every 2-piece build dies. WHAT FAILING NOW TEACHES (every chainable build
enumerated on the shipped mount, test-pinned — 34 builds): wrong builds die
in THREE VISIBLE FAMILIES — ~0.9 s bare/flat builds fly off the ramp end
into the void AT the rail; ~1.05 s bridged decks land IN the void a
rail-length out; ~1.15 bridge+lip catapults; ~1.25 s drop-pairs cross the
visible catch and fall off its far deck ("the deck must REACH the cup").
Nothing flies past the cup any more — the fail gate samples the last point
ABOVE the rail deck plane (the old x-check sampled cars already sliding on
the floor, whose x drifts ~0.5 m, and could not see flyovers). Both lines
still finish and still order their lesson: lazy `straight → drop →
straight` 1.01 s vs arc `gapLip → drop → straight` 1.07 s (the pop costs
the hop — honest, measured, the bedroom03 precedent), par 1.05, BEATABLE by
`drop → straight → straight` at 1.00, and all 12 whole-tray orders finish
1.00–1.13 s. NO WRONG BUILD FINISHES: both former pinned exceptions are
dead at this geometry — the `straight → straight → gapLip` catapult (once a
2.20 s finisher) falls in the void at ~1.15 s, and the `gapLip → drop`
wedge-capture falls at ~1.27 s. Robust across seeds 1–6 and launch speeds
×1.0–1.1. The curve run-out past the cup is unchanged fixture geometry (the
mid-run `curve` rung stays BLOCKED, ask #1); the counter row in the
set-wiring table re-derived with the shorter, higher rail.

**KITCHEN 03 — The Bowl** (`kitchen03.level.ts`). Teaches: the set's
signature at speed — the gap verbs back to back beside the cereal bowl. The
bowl IS the set's bowl: the rim line (a `bank` + counter-`curve` pair) is
seated THROUGH the set's `bowl.in` / `bowl.out` socket frames (`BOWL_SOCKET_FRAMES`
carried into world space by the level's set mount, `src/world/setPlacement.ts`),
not chained off the timed line; the timed line runs past it into the cup.
STAGE-3 COHERENCE — the bowl line is now a build a tray can place: the tray
(2 `straight`, `gapLip`, `drop`, `landing` = 5 = budget) IS the multiset the
par build places, and both straights are ONE `straight` geometry (0.15 m at
the time — was 0.1 + 0.2, a second geometry the tray could not seat — the
player's run got two 0.1 m straights and a line 10 cm shorter than the one
the cup is anchored against).
STAGE-5 K3 RE-SWEEP (playtests AA + BB walled the bowl back to back — AA 4
builds to the 3★, BB 6 and quit, "no advice text ever differentiated my six
builds"): the rung moved onto kitchen02's fail-timing tools, all level-local
— a short steep −29°/0.34 m chute (0.16 m BLEND, camera-framing-tuned like
kitchen02's), ONE 0.22 m `straight` whose span EQUALS the 12° `gapLip`'s
(the equality law), a 0.11 m `drop` step on 0.11 m leads, and a SHALLOW 8°
sink `landing` instead of the tutorial's forgiving `KITCHEN_GAP` catch —
with the sink at the chute TOE in the par order (the car drops off the
books into the bowl's mouth: kitchen02's toe idiom, and the only position
whose pitch step at 2.4 m/s stays inside the run camera's 0.35 s rotation
lag — sink-last put the par run's toe out of frame, |ndc| 1.28). The old
−12° crawl had put every death at 2.58–2.96 s while the old spans let 15 of
the 4-piece subsets finish — strangers died late, invisibly and
identically. The 171-build sweep now: 111/111 subset orders FALL,
1.07–1.74 s in five size-monotone bands, never airborne past the cup
mouth; 60/60 whole-tray orders finish (1.43–1.61 s, 7 under the par clock)
— the 0.10 m step the checkpoint shipped wedged one order (`s,s,d,g,l`,
nose-first into the sink's rising tail at EVERY seed — the rail is
seed-independent); the +1 cm step under the ladder's 0.12 m belly
threshold, with the leads shortened once the blend went 0.16, cleared it.
The stock-tail note rule (B2 pass 2) prints SIX different admissible
vocabularies across the ten rebuilt AA/BB attempts. Par 1.45 (measured
1.433), piece-par exact by construction — the tray IS the par multiset, so
the first try at the whole tray always pays the finish itself. The rim
fixtures ride the set's sockets, so mounting the set anywhere moves the
bowl and the line with it (the set-wiring row re-derived twice: the chute
move, then the wedge/toe re-lay).
Common failure: none on the par line — but the car visibly begs to
take the rim, and cannot (ask #1). Par is the par because it is everything
drivable today on the way to the bowl. The bowl's intended banked line
becomes a data edit — seat a `bank` between the rim sockets — the day
steering lands AND the builder can seat a piece on a PROP socket (ask #4);
that half of the rung is BLOCKED.
STAGE-6 DISCOVERABILITY PASS (playtest DD 2026-10-08: the bowl walled a
SECOND fresh-eyes stranger — 6+ builds, "the only snap is a curve exit the
game itself says is blocked — furniture is in the way", "building backwards
from the cup runs off-table", "] swaps to the car's start point". BB's five
builds earlier said the same three things). NOTHING MOVED: no piece
geometry, no tray, no par, no set mount — the rung was already SOLVABLE
(the par replays verify and 60/60 whole-tray orders finish), so per the law
(PROMPT §12: confused twice → fix the level or the callout, never the length
of the explanation) the fix went into the CALLOUT, and the reason is
measured, not taste: the thing that refuses the rim seat is not furniture,
it is `cereal-bowl`'s own box (`tests/unit/set-wiring.test.ts` now pins
that the guard name which blocks a straight at `bowl.out` IS the bowl), and
the bowl is ONE prop for every kitchen rung; and the kitchen02 idiom that
closes a cup's dangling exit with a run-out fixture cannot be used here
because the cup sits at the rim of the round counter (the dress spans
x 0.52–1.47 against a cup entry at x 2.218), so a run-out deck would float
over the floor — DD's own "runs off-table". What the rung now says instead
(the three tells and their proofs are in [[Modules/ui]]): a red seat NAMES
the object that refused it ("the cereal bowl is in the way") and the verb
that has an answer; a legal green seat past the finish says the run ends at
the cup so nothing past it is ever travelled; and the failure note's ADD
tail names the END the kind goes on, which is the far open exit of the
start-connected chain — the socket the boot ring is already bound to, so the
blind five-Place build still stands as the rung's floor. The aim walk also
gets its own gate now: `]`/`←→` reach every open end, and two of the four
ends on this rung are dead ends the copy has to be honest about (the bowl
rim: blocked by the bowl; the cup's far side: past the goal), which is what
made the OTHER two — the ramp's exit and the chain's own end — invisible.
Geometry, pars and the determinism anchor are untouched by this pass:
`a1a50d05` still holds (no `a1a50d05` Decision Log line is owed, because no
geometry moved), `npm run pars --check` and `replay:all` 30/30 green.
Residual, honestly open: a player who ignores the past-the-finish tell and
fills the tray on the far side gets the BARE head (the stock tail needs
stock, and a spent tray has none) and `Remove piece` is last-in-first-out,
so the recovery is clear-and-rebuild — the tell is what prevents arriving
there, and the ask (an ORPHAN-PAST-GOAL clause naming the stranded kind, or
a Remove that can name which piece it will take) is a systems ask, filed in
`Sessions/2026-10-08 Stage 6 k3 discoverability`.

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
unchanged by the zone). STAGE-4 K4 TAP-WALL PASS (Playtest R) measured the
stronger claim the learnability pass used to make — "no finishing line
touches the zone" — FALSE on the builder mount: 10 of the 24 whole-tray
orders deck the sink's near half and roll THROUGH the zone (grip 0.5 for
0.11–0.29 s) yet finish at 2.53–2.61 s, inside the fly lines' clock; the
patch is a TELLS with a COSTLESS toll, and the tray-minus-`drop` order
`gapLip → straight → landing` FINISHES wet where it `fell` dry (wet-can-rescue,
bathroom03's twin; both test-pinned). No buildable line DIES of grip — the
toll has no stakes yet (ask #2b's lateral half). R's wall itself was a
REVERSED `gapLip` mount (the R flag left up), pinned falling at the sink
(2.192 s) and past the cup (2.533 s) under one identical note — the
advice-honesty fix is note-side, see
`Sessions/2026-10-09 Stage 4 - K4 tap wall`. **PROGRAM T2.1 FIND (2026-10-09,
`Sessions/2026-10-09 Program T2 voice`):** that audit's socket list missed the
MID-CHAIN seats — the live builder refuses EVERY whole-tray order's SECOND seat
(`blocked — the tap is in the way` at `end of lip`): the `tap` group box's bottom
edge (`setPlacementGuard` → `blockerOf`, group granularity) sits 2.2–7 mm below
the sink-exit deck plane the par's own pieces run through, so the rung is
placeably UNWINNABLE as shipped (a browser whole-tray walk finds no legal second
seat; `tests/e2e/program-voice.spec.ts` therefore asserts the buildable half —
the lip + a drop on the cup's own exit — and the MOVE-clause note it earns). The
mount-row fix (lift the tap base a few mm, or leaf-granularity guard per the
camera lane's precedent) is Deferred (`Home`). The zone's grip physics are
still measured — on
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
the back lip — the extra speed overshoots the catch — `fell`. Wrong answer
C (playtest Q round 2): every par piece in par order and the booster saved
LAST — `fell` 2.47 s, the build a "place the booster last" hint would
teach; the rung has NO such hint and the one shipped copy that reads as an
ORDER — the `booster` first-sight callout (`src/ui/callouts.ts`) — now
says spend it early (caps lowered by the 2026-10-08 copy pass; it used to read "in the middle of a run"; measured,
mid-chain finishes but pays +0.11 s, last falls, early is the fast line,
so on this rung the booster belongs FIRST in the tray line, not
mid-chain — the level file's header carries the verdict; there is no
per-level hint render seam in the level data). All three wrong answers
are in the test, so the trade-off is measured, not asserted. This
rung chains its OWN pinned copy of the original gap numbers
(`KITCHEN05_GAP`, `kitchen05.level.ts`): its lesson needs an unforgiving
_gap_ — when the shared `KITCHEN_GAP` softened for the L01 promise, the
no-booster line silently started finishing, un-teaching the trade-off; the
pin restores the measured wrong answers byte-identically (par hash
unchanged). Par 2.39 s; beatable — the between-gaps booster line is now
DATA (`kitchen05MidBoosterBuild`, finishes 2.50 s, test-gated alongside
the par as the second intended line; a tighter line is out there), not
obvious. Common failure: booster too late. The useful booster socket is
visible by construction: the builder's boot target ring sits on the ramp's
open exit (`chainHeadIndex`), which is exactly where the par seats it and
where a held booster reports `fits here` on the fixture-only rail. PROGRAM
T2.1 (THE BOOSTER SEQUENCING TRUTH): when the booster is actionable but not
spent at the head of the line, the failure note itself says the order —
"the booster needs spending EARLY — … before the first lip · press ] to
walk the open ends" (`moveHintFor` → `physicsNote`, `Modules/ui`) — and
`tests/e2e/program-voice.spec.ts` EXECUTES the sentence live: Remove ×5 (each
label naming the piece it takes), `]` to the ramp exit, booster-first, and
the par build is byte-rebuilt and finished ★★★; the booster-first ordering
is expressible through the DEFAULT aim exactly as the boot-ring sentence
above says. STAGE-3 COHERENCE: this rung is where the tray rule was
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
choice level's floor cannot bury a line the player can run (since the
B2 redesign bedroom02's two routes end on ONE deck plane, so the row
follows either; pre-B2 the soft line ended 18 cm below its par).

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
choice off the mattress — sink into the pillow, or step hard off the
plateau edge — and since the **B2 redesign** (Playtest U round 4's wall)
BOTH roads reach the same anchored mug. The par (4 of 5 tray pieces,
1.75 — measured 1.72 s) is the PILLOW line: one 0.4 m deck of mattress,
then the `landing` re-authored as a 32° SINK (`PILLOW_SINK`, dy −0.1867 —
steepened from 30° at the **B2 pass-2** fix, see below), then the floor
run. The STEP line (two high decks, then the `drop` deepened to match the
sink — `PLATEAU_STEP`, dy −0.1900, its leads shortened 0.0885 → 0.0766 at
pass 2 so the step span still equals the sink's shorter dx, declared in
`trayParams` because the par never places it) finishes too, ~0.3 s
slower (1.72 vs 2.04 chained): the ballistic slam eats what the high
deck gained. The two decks pass the mug mouth ~3 mm apart — ONE floor
plane — which is what RETIRES ask #2b for this rung: chained AND
builder-anchored both lines finish (test-pinned, and the anchored-soft-
falls pin is retired with them). The rung rides its own seating: 0.4 m
decks (`BEDROOM02_STRAIGHT`) and a −22° launch (`BEDROOM02_RAMP_ANGLE`,
the L02 "the ramp angle is its own knob" precedent) that shortens the
crawl enough to separate the fail classes. THE FAIL STREAM IS THE LESSON:
the old geometry died every wrong build at ~3.0–3.25 s invisibly past the
cup ("the line let go before the cup" — unknowable, which is what walled
U; 13-of-20 orders finished, several sub-par). The B2 redesign fixed the
invisibility, then Playtest AA (stage 5) walled differently: six builds,
ONE death — "always ~a hand's width from the glowing papers" — because
the start-sink build and the deck-only build died 5 cm from EACH OTHER
under the mug wall (1.57 s / 2.17 s, both ~0.11 m short) and the tailless
note read the same on both. THE PASS-2 FIX moved one number: the sink
steepened 30° → 32° (dx 0.383 → 0.360), which re-houses the start-sink
family at the START end (1.34 s, 0.79 m short — a distinct early site)
while the double-drop family stays inside the 2.6 s cap (a 34° variant
measured and REJECTED: it tumbled `l,d,s,s` to 3.63 s). The angle knob
was swept −12…−28 and −22 stays: shallower STALLS the step line, steeper
drag every family toward the cup site. What geometry CANNOT do here is
said plainly: a three-flats build chains to within the sink's dx of the
par chain's end, so it lands ~0.11–0.15 m short of the mug at EVERY angle
that keeps the step line finishing — the deck-only family keeps the
hand's-width site and is separated instead by owning the LATEST clock
alone (2.17 s against ≤1.84 s for every other family) and by the
pass-2 note tail, which lists exactly the pieces the tray still holds
("add a drop or a landing" — see `Modules/ui`). The four families now
read: flipped piece 1.28 s at the flip; sink-at-start 1.34 s at the
start end; almost-right (pillow line minus a deck) 1.84 s UNDER AND PAST
the mug, cup in frame overhead; deck-only 2.17 s a hand's width short —
and the lesson is one informed retry from any of them. Nothing reaches
2.6 s (all 20 whole-tray orders: worst 2.49; death-clock cap test-pinned)
and 7 of 20 orders finish (1.67–2.38, the CHOICE-tray property unchanged);
no build of three pieces or fewer finishes (test-enumerated). The whole-
tray sweep cannot be under par in PIECES by construction (5 placements
against a 4-piece par — 0 of 20), which is what makes the tray read
"under par" as a 4-piece edit of the par line (2/20 orders beat the par
CLOCK). Seeds 1–6 and
launch jitter 0–0.1 m/s stable.

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

## The stage-6 encore rungs (design card)

The campaign-30 pass adds ONE rung to each four-rung room — `bedroom05`
"Cable Snake", `bathroom05` "Twin Drains", `garden05` "Two Shadows",
`garage05` "Spill Course" (named "Dyno Run" until the 2026-10-08 copy pass de-jargoned it) — the campaign 26 → 30. The NEW IDEA every one of
them teaches is the house's founding sentence DOUBLED: **the DOUBLE
CROSSING** — the lane is crossed TWICE on one line, `drop → straight →
drop → landing`, and the rung's pinned `ENCORE_DIP` (the ladder's 0.12 m
step on the porch THRESHOLD's 0.11 m lead — span 0.3566 m, LONGER than
the ~0.31 m a roll-off can fly at this release; a stated rung-local
deviation like `PORCH_STEP`, authored after measuring that on the stock
0.05 leads a three-piece half-line FINISHES UNDER the par clock at
2.592) makes the second crossing load-bearing: **all eleven sampled
one-, two- and three-piece omissions FALL** — the promise law of
`kitchen01`, asserted more strongly here than anywhere in the house.
Tray = the par's four + ONE DECOY `straight` + ONE TEMPTATION `booster`
(6 = budget, `tray ⊇ par` + 2 VERBATIM): the spare straight finishes
TAIL-placed at the par's own hash, dies MID-LINE (the deck-first law in
disguise), drags +0.39 s after the catcher; the booster is kitchen05's
law turned into a CHOICE — spent EARLY it buys the second crossing whole
(4 placed, 2.44 — the exported `X05BoosterBuild` hidden line, porch03's
bounce precedent), spent LAST it is trim at the par's own hash. The deck
is a long line on a short leash: par pieces 4 at 3.017 (parTime 3.05 on
the BEDROOM and BATHROOM clocks — the garden/garage pair was brevity-trimmed
to the fail-timing chute in the same stage-6 pass, §The encore brevity trim
below), the par multiset ORDER beatable at 2.783 (kitchen04's law), deck-first
FALLS, and the whole tray finishes tail-first (the 2★ consolation —
Playtest-G's wall PRICED, not walled) and falls booster-first.

**The campaign-order call (the design call the table had to make):** ids
stayed APPEND-ONLY (`05` is a new id; nothing renumbered — the 2026-10-09
campaign decision) and the FLAT ladder slots each encore BETWEEN the
room's 03 and its finale, so every room reads `01, 02, 03, 05, 04`. The
difficulty claim is honest at the pins: harder than 03 (03 forgives a
soft line that finishes; the encore forgives NOTHING — every omission
falls, and the tray carries two pieces that can kill you), below the
finale (the capstone's mastery — every verb, live zones, 24 whole-tray
orders — stays the room's hardest claim; the encore asks for one longer
line, not the whole vocabulary). Kitchen and porch have no encore:
`kitchen05` is the booster's debut rung and the kitchen's finale, and
`porch05` is the campaign's last word.

The room's voice is what differs rung to rung, geometry-economy verbatim
(the four rungs share one authored rail, one hash `1b37dfed`, one
placement x 1.3602 and one finish-deck plane 12.6 cm under the finale
rows): the BEDROOM rides the law clean (no live zone — the room's law);
the BATHROOM's film lies IN sink two's mouth at the waterline a bridged
deck would roll and the ridden dip FLIES it (bit-identical par; the
unbuyable 0.3-span bridge probe rolls the film and runs wet-FASTER,
3.125 vs 3.342 — bathroom01's law moved onto the ride, toll theoretical
exactly as there); the GARDEN's sprinkler keeps its head (`source:
sprinkler`) in crossing two's mouth — the eye reads the ORDER, the
lesson the shadows could not teach; the GARAGE sells the speed at its
own counter (`source: oilStain`, the EARLY spend = the dyno special —
the room that taught the booster quotes its own shop). The four rungs
join the cross-ladder tray-parity roster with their booster lines
(`tests/unit/bedroom-levels.test.ts`), their placement rows are derived
by the room tests, and the ladder proof runs as a fifth test pattern in
`tests/e2e/campaign.spec.ts` (a FRESH browser per encore, the previous
rung's one star as the only key, finish + ★★★ + Next naming the finale).

## The encore brevity trim (garden05, garage05 — stage 6)

Playtest DD: "the 05 rungs stretch that same verb… I'd trim garden05/garage05
toward porch-level brevity" (and the Final Report's "next" list adopted it).
The trim moved ONLY those two rungs' release from the encore rail's
−12°/0.26 shelf to the ladder's fail-timing CHUTE (−29°/0.24 m, blend 0.12)
with a sink-softer 21°/0.18 m run-out catch, deleting the ramp crawl: the
rail, the pinned `ENCORE_DIP` and the tray are untouched, pieces stay 4,
and the clock went 3.05 → 1.35 par (measured 1.342). The PAR REPLAY HASH
MOVED for exactly those two rungs — `1b37dfed` → `1f99683a` — the four-rung
family rail split in two: `bedroom05`/`bathroom05` stay byte-identical on
the old rail (`1b37dfed`, 3.05); no other rung's hash moved (replay:all
30/30, kitchen's `PINNED` atlas intact); the rungs' `setPlacement` rows are
re-derived (rail midpoint 0.95817) and the encore family shares a rail no
more — four level files, two authored rails. Laws at the new release,
measured not papered: the promise law survives UNBROKEN (all 11 sampled
omissions still FALL, earlier, ~1.1–1.5 s); the decoy's tail law survives
byte-exact (par's own hash); booster EARLY stays the hidden line (1.108,
faster than the ride) and LAST stays trim at the par's hash; THREE laws
flipped with the crawl and are re-stated in the tests with their numbers —
deck-first now FINISHES 0.025 s behind the par (porch05's own "finishes
but LATE" exception idiom; at −12° it fell at 2.808), the two-plank mid
bridge finishes SLOW (never fast), and the five-piece booster-spent-AND-
line-ridden overshoots the catch and FALLS (the buy is a SUBSTITUTION for
the far crossing, never an addition). Proof: `tests/unit/garden-levels.test.ts`,
`tests/unit/garage-levels.test.ts`, `tests/e2e/stage6-encore-brevity.spec.ts`
(fresh session, no instructions, four blind Places, one launch, finished),
and the Decision Log 2026-10-08 (sandbox + encores) entry.

## Sandbox (per set)

The six sandboxes — the finished promise (Final Report "next" #3; the
kitchen's was the pattern). Every one is the SAME shape: `sandbox: true`,
budget 999 ("no budget" with the number the contract demands), the FULL
stocked tray — every kind at 99 copies — fixtures `ramp`+`finishCup`,
`maxTime` 20, and a reference lap that finishes like every parBuild here.
Discoverability is the kitchen row's verbatim: NOT a campaign rung (absent
from `CAMPAIGN`, `campaignIndex` −1, nobody's `nextInCampaign`, absent from
the level select), `?level=`-addressable, and the off-ladder unlock read
means no dev-preview badge and a normal mint if a visitor finishes one.
The rooms differ only in the LAP's geometry, which is each ladder's own
seating: the kitchen's counter lap (one 0.175 m straight geometry —
`SB_STRAIGHT`) measures 2.667 s (par 2.70, 5 tray pieces); the four gap
rooms (`bedroom-sandbox`, `bathroom-sandbox`, `garden-sandbox`,
`garage-sandbox`) lap the shared `KITCHEN_GAP` verbs off the 0.28 shelf on
their ladders' 0.2 m straights — 2.733 s, par 2.75, 5 tray pieces; and
`porch-sandbox` laps its own verbs (chute → threshold pop → sink carry →
pinned step → one 0.11 m plank) in 1.158 s, par 1.20, 4 tray pieces. The
set hangs dressed at each id's derived `setPlacement` row (the rung rule:
rail midpoint, deck 5 mm under the lap's finish plane, the room's axis
offset). Proof: one `describe('<set> sandbox')` block per ladder test (lap
finishes, tray parity byte-for-byte, tray = everything ×99, off-ladder
claims, mount derivation) and the screenshot smoke + campaign-invisibility
page checks in `tests/e2e/stage6-sandboxes.spec.ts`.

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

**Ask #8 — the garage's callout row and the garage's goal-line anchor
(from the garage ladder, stage 4).** Two one-line asks from the garage
four, Environment Artist unless noted. **(a) THE CALLOUT ROW (blocking:
nothing; weakening: the rung-01 first-sight seam).** The ratified set
module (`src/sets/garage/index.ts`) registers NO `PROP_CALLOUTS` row —
the STAIN row in the set DATA is decoration and no first-sight line came
with it, so `garage01.level.ts` registers `prop:oilStain` itself (the
bathroom `prop:wetPatch` precedent is a set-module row, and boot imports
levels only, so the manifest line exists either way). Moving the one line
into the set module makes registration authorship match every other set;
the ladder test pins EXISTENCE, not authorship, so the move needs no test
edit. **(b) THE TUNNEL ANCHOR (blocking: a future bore-ride rung, not
garage03 — which ships its trade-off honest).** The AD's scoreboard says
the bike-wheel tunnel "is ready and should anchor the garage's goal-line
levels", and it DOES anchor them visually — but variant C declares no
sockets (`SOCKETS = {}` in `src/sets/garage/data.ts`), the wheel stands
behind the +x lane at every shipped mount (test-pinned from the live
boxes), and the level's oil zones are seam-derived LEVEL data while the
stain FILMS stay set-space decoration tens of cm off the lane (the ask #6
shape, unfixed here). What a bore ride needs is one lane-crossing anchor
pair on the SetInstance surface (`wheel.in`/`wheel.out`, ask #5's shape,
the bowl's in-then-through tangent convention) — with ask #4 (prop-socket
seating) and ask #1 (drivable yaw) still standing between the frames and
a ride; and what rung 01's affordance precision wants is one `STAIN` row
moved so that at the four shipped mounts its film lands inside a zone
footprint (one data value, ask #6 verbatim). Owners: one socket pair and
one moved row, both Environment Artist.

## The same data replayed the way the BUILDER mounts it

Every claim above is a `lay`/`chain` build: the cup rides at the end of
whatever line is being replayed. The shipped builder mounts the level
DIFFERENTLY — `initialBuild` anchors the fixtures at their par transforms and
the player's pieces chain off them — and a line that fits the tray can still
behave differently against an anchored cup. Measured at this pass (the same
seats, the tray's own geometry, fixtures anchored):

| line | chained (the card's number) | anchored (what a player builds) |
|---|---|---|
| L02 arc route | finished 1.07 s | finished 1.07 s — the card's claim HOLDS on this mount (stage-4 fail-timing pass: both lines sum to the anchored cup by the reach law at the new 0.11 m span; the lazy par runs 1.01 s here and every whole-tray order 1.00–1.13 s) |
| L04 ground build (hazard probe, not a route since the learnability pass) | finished 2.292 s (wet) | **`fell` at 2.675 s** — two 0.3 m straights stop short of the anchored cup |
| L05 both wrong allocations | `fell` | `fell` (unchanged: the trade-off holds either way) |

So one card claim is a property of the CHAINED data model, not of the game:
L04's decked-sink
probe (it cannot reach the cup at all — since the learnability pass the L04
card claims the anchored truth directly and keeps the probe as hazard
data). That is ask #2b's
(`Level.finishSocket`) — with a level-owned finish point the two lines would
be measured against the same world position in replay and in the builder, and
these claims become testable in the shipped mounting. (L02's was the other
one until the stage-4 discoverability pass re-authored its tray and gap so
the two lines' reaches SUM equal — the anchored table row and the chained
card now agree by construction, on every order of the tray.) Until then the
cards state the chained number and this table states the other one.

**And the tutorial's target walk (fixed at this pass).** The shipped
builder's `targets()` list is in ARRAY order, and `initialBuild` mounts the
fixtures FIRST — so on L01 the list slots start `[release socket, end of ramp, end of
finishCup]` (the R+S pass renamed what those slots SAY — "the car's start point" (Y+X round6 reword of "where the car starts"),
"cup on the table" — the walk order is untouched), and after the player seats the `gapLip` on the ramp's exit the
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
gives the hazard model a timed kind. The garage four (stage 4) also ship
UNBLOCKED on the same evidence (par finishes, the mezzanine choice
measured on both mountings, wet/dry hashes pinned, the 24/24 capstone
sweep), with two honest caveats stated at the cards: garage03's ride
THROUGH the wheel is staging, not a bore (the tunnel anchor is ask #8b
behind ask #4/#1, the garden bore's pattern), and garage01's film tell
lands near-but-not-exactly on its zone footprint at these mounts (the
callout row and the film anchor are ask #8a/#8b). See
[[Reference/Level Ladder]].

## The ladder's last word — what clearing `porch05` means

`PORCH05_ID` is the campaign's thirtieth rung and the only level whose completion does something the
other twenty-nine do not: it ends the game. On the FIRST finished run of the rung (minted honestly, not
a dev preview — the same `levelUnlock` gate that withholds the mint withholds the farewell) the shell
swaps the result bar for `src/pages/farewell.ts`: one crane tour of the six rooms in campaign order
carrying the player's OWN per-room star tally, then three doors. THE TALLY IS THE SAVE, NOT A LEDGER:
`farewellTally` folds `progress.stars` through `CAMPAIGN`, so the summary is the same thirty rung-ids
the ladder walks (30 rungs × 3 stars = 90 the maximum) and an off-ladder star — a sandbox, the feel rig
— scores nowhere, because a sandbox was never a rung. THE DOORS are progression's honest afterlife: the
room's sandbox (`PORCH_SANDBOX_ID`, the same registry-addressed page the sandbox census specs boot),
today's daily rung (`?daily=1`, `src/save/daily.ts`), and the film of the run that just ended (a share
payload frozen at the same terminal edge the Share button would have used, `src/share/share.ts`) — the
three things the campaign has to offer once it is finished, and nothing else. THE ONCE-PER-SAVE FLAG is
UI state, not level state (`gravity-works.farewell.seen`, outside the save schema), so no level data
moved, no shipped hash moved, and `replay:all` stays 30/30 — the farewell is post-run cinema, never
sim. A second clear of porch05 is an ordinary run behind an ordinary bar. Law, pages and proofs:
[[ui]], [[camera]], `tests/e2e/farewell.spec.ts`, Decision Log 2026-10-09 ("the FAREWELL law").

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
garden bore line and wet shortcut ride the roster). The stage-4 garage
pass adds `tests/unit/garage-levels.test.ts` — the same gates for the
garage four (pars finish, contracts, 01's exact fit + omission table +
pinned order + the stain's wet/dry probe pair, 02's mezzanine choice on
both mountings with the anchored fall pinned, 03's oil-lane hashes and
the speed line's win, 04's 24/24 sweep that is its own wet sweep + the
probe) PLUS the flush-slab placement derivation (no `DECK_Y` row — the
epoxy surface IS the set origin plane, the mount y is the deck line
minus clearance), the derived dress-box sweep (the flattened cardboard
is what sets the 37 cm offset), the bike-wheel-tunnel behind-the-lane
staging check, and the `prop:oilStain` manifest pin — and extends the
cross-ladder describe to FIVE ladders (kitchen, bedroom, bathroom,
garden, garage; the garage floor line and oil lane ride the roster, and
the pars/parity/budget checks now cover the garage rungs too). The
stage-5 porch pass adds `tests/unit/porch-levels.test.ts` — the same
gates for the porch five (pars finish, contracts, THE ZONE-FREE LAW
(`hazards` absent-or-empty on every rung and `HAZARDS` empty in the set
module, test-pinned), 01's exact fit + the EARLY-family omission table,
02's choice on both mountings + the inside-deck/ACROSS-the-lane staging
check, 03's whole-tray-is-par anti-cheat (every subset FALLS) + the 22/24
order sweep + the bounce's par-beat, 04's 24/24 with the pinned-step
belly death + the late shortcut, 05's both-threshold dual-route on both
mountings + the beatable par) PLUS the flush-plank placement derivation
(the deck's `DECK_Y` carried explicitly under the lowest authored
finish deck) and a DERIVED dress sweep (the roof corner POSTS set the
53 cm offset) — and extends the cross-ladder describe to SIX ladders
(kitchen, bedroom, bathroom, garden, garage, porch; the porch door,
bounce and catch-first lines ride the roster).
