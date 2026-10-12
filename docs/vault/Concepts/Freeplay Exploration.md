---
tags: [concept, freeplay, exploration]
---
# Freeplay Exploration

> [!abstract] Role
> Design paper (write-only; no product code). The director's question: the 30-rung flat ladder
> averages ~1 decision per rung and repeats its grammar — how does Gravity Works become a
> FREE-FORM experience without losing what the loop made it: determinism, the physics-approves
> judgment, share-as-content, and the 7.5/10 honesty? Three candidate shapes are sketched, one is
> recommended, and the kill-list names what breaks and what is irreversible. Owner: Creative
> Designer. Inputs: [[Concepts/Levels]] (campaign law), [[Concepts/Track Kit]],
> `Sessions/2026-10-11 Round2 doors`, the round-3 verdict's "below 8" §1, `Reference/Action Plan
> 2026-10-11`. (The creative-recommendations note the Action Plan 2026-10-09 wikilinks is not
> anywhere in the vault or history — both recommendations notes are broken links; the plan note
> itself stands in for their content.)

## The endowment (what free-form must keep)

Four assets, all shipped, all paid for:

1. **The engine's core is a JUDGMENT, not a goal.** `World.create` + the fixed-step sim approve or
   refuse ANY proposal — a build either finishes or falls, identically on every machine
   (`Reference/Cross-platform determinism 2026-10-09`, 37/37 atlas). No authored cup is required
   for the judgment to speak; the cup is just where the campaign points it.
2. **The house is already ONE space.** The farewell crane flies all six rooms in one pass
   (`src/pages/farewell.ts`), and the round-3 tail fogged the legs between them. The crane is a
   proof of continuity wearing an ending's clothes.
3. **Share links carry builds + pars, and ghosts make any line raceable.** "ghost: from link"
   (`src/pages/ghost.ts`) already races a stranger's verified car; the hash is the promise that the
   race is honest.
4. **The daily already folds seeds.** `dailySeed` → `dailyBoardId` is a deterministic curator with
   no server; it currently curates toward the ladder, but the fold is a selector, not a law.

The failure mode to design against is documented, not hypothetical: **empty-canvas paralysis**. The
round-2 design evaluation read kitchen-sandbox as "a lane, not a room", and the recurring evaluator
line is "the sandboxes are the toy, and the game hides the door." Every candidate below must open
the door AND never hand a stranger a blank table.

## The map (two axes)

**X — where success is decided:** AUTHORED (a designer's cup/par defines the win) ↔ EMERGENT
(the physics judgment and the player's own intention define it).
**Y — unit of play:** PER-RUNG (an episode: one tray, one build, one result bar) ↔
WHOLE-HOUSE (continuous: the six rooms as one field).

```
                         AUTHORED ◄──────────────► EMERGENT
              ┌─────────────────────────┬─────────────────────┐
   WHOLE-     │  the daily board        │  A · THE DOWNHILL   │
   HOUSE      │  (authored rung,        │  (one launch across │
              │   emergent clock)       │   the stitched six) │
              ├─────────────────────────┼─────────────────────┤
   PER-RUNG   │  THE CAMPAIGN today     │  B · THE TALLY      │
              │  (30 rungs, star law)   │  (tricks/approvals  │
              │  sandbox ≈ gap room     │   on the raw house) │
              │  with ×99 tray          ├─────────────────────┤
              │                         │  C · THE CHAIN      │
              │                         │  (per-LINE: player- │
              │                         │   published lines, │
              │                         │   ladder=community) │
              └─────────────────────────┴─────────────────────┘
```

The campaign sits alone in its quadrant and that is why it feels like the whole game. The sandboxes
sit at the authored/emergent seam ON the per-rung row — one room, no budget, but still a rung-shaped
level with a `parBuild` lap pretending to be a freebuild. Free-form play lives at every other
position; the three candidates take three of the four.

## The height problem (answered first, because it decides the candidates)

A gravity racer needs elevation. In a free-form house the table runs out — and the honest answer is
that the game already manufactures height three ways, all shipped, none new physics:

- **Fixtures ARE altitude.** Every campaign start is a fixture ramp anchored by `initialBuild`;
  garage02's mezzanine "high line" and kitchen's 0.22 m book stack are level data, not mechanics.
  A HOUSE level can boot the six sets pre-built at DIFFERENT altitudes exactly the same way — a
  house frame of authored decks, one `setPlacement`-shaped table of y-offsets.
- **The kit descends, and the campaign idiom is drop-and-catch.** The whole ladder is flights
  between decks joined by `drop` catches; a house stitched from rooms connected the same way is
  the SAME physics scaled up — which matters because yaw is still ask #1 (the steering spike
  crossed zero banked arcs, `Reference/Steering spike 2026-10-09`): rooms CANNOT be joined by
  drivable corners, only by ballistic gap-and-catch, which is precisely the grammar the studio
  has spent two years perfecting.
- **Players can build height up, barely, with `ramp`/`booster`/`springLauncher`** — all in the
  sandbox tray at ×99, and round-3's stranger finished a booster+loop sandbox build on try one.
  Stacking as player practice exists; it is just unscored and unframed.

The six rooms also already READ as an altitude ladder in campaign prose (garage bench → kitchen
counter → bedroom shelf → bathroom tile → garden paving → porch plank). The proposal that all
three candidates share: make that ladder a canonical number — a HOUSE FRAME, porch at 0, garage
mezzanine at the top, six decks, joined by authored drop-and-catch connectors that are FIXTURES.
The player's job is never to manufacture the altitude; it is to cross it.

## Candidate A — THE DOWNHILL (whole-house continuous, player-chosen goals)

**Core loop.** One launch, one car, the house as one field. The home screen is the cross-section
house; you pick a window and roll. The physics judges every threshold you cross (each room's own
finish line, the room's `captureVolume` cup or the frame's floor, still counts as a crossing);
you collect rooms, not rungs. Player-chosen goals ride the surfaces that exist: your own par via
the ghost ("you said 40 seconds — beat your own house"), the daily's fold pointed at today's START
WINDOW instead of today's rung, and friend links that race the same descent.

**Scoring grammar.** Stars retire; the score is ROOMS CROSSED (each is a physics approval, not a
menu checkbox), with distance-along-rail as the tiebreak and the clock as a personal, player-set
par. The result bar reads "3 rooms · 14.2 s — you stopped at the garden."

**What the judgment means.** Everything. A room's threshold is refused or granted exactly like a
gap today; the difference is there is no cup at the end of the world — the judgment becomes a
metronome of approvals instead of one verdict.

**Onboarding.** The canvas boots FURNISHED — six ratified sets are already built geometry;
the house frame's connectors are fixtures. First session: the crane (the game's own farewell
camera, repurposed as the MENU camera) pulls back from the kitchen window, a car free-rolls one
room and dies in the next one's puddle — the premise beat, promoted to the house. If you stall,
every window offers its TOUR (below).

**Content treadmill.** The house is finished at launch (six sets + one connector pass). Treadmill
only if rooms keep being added — append-only, and each new room is an AD set round, not a level
batch. This is the candidate that converts content production from 30 rungs per program into
"one room every few seasons."

**Migration.** The campaign becomes the TOURS: each room's five rungs stay exactly as shipped —
same ids, same hashes, same `CAMPAIGN_LADDER` unlock law — and are reachable FROM the room's
window ("learn this floor"). Level select becomes the cross-section; the farewell's crane pass
becomes the menu camera it already is; `dailyBoardId` is untouched. Cost is the house level itself
(one new id joining the atlas append-only), a house-local placement table (the campaign's
`setPlacement` rows unmoved), and the connector-authoring pass — which is the crane-legs fog
the round-3 verdict already asked to be painted, now load-bearing. Heaviest of the three;
one irreversible UI decision (the home screen).

## Candidate B — THE TALLY (trick/approval scoring on the raw house)

**Core loop.** No goals at all, anywhere — build, launch, and read the sheet. The replay tape the
engine already records is classified into APPROVED EVENTS the physics actually granted: airborne
longer than X (air-time), a landing on a `landing`'s deck with ≥Y m of run-out (a clean catch),
a line that crossed into a second set's frame (room-to-room — possible today in the sandboxes'
adjacent staging, cheap in the house), longest unbroken chain of approvals (longest-line), a
booster or spring spend. The tally sheet is the score; every run mints it.

**Scoring grammar.** Badges + counts replace stars. The share card becomes a tally sheet; the
save holds personal bests (the daily's "your own runs on this device only" honesty sentence,
re-used verbatim). No global board — the single-machine law is stated, not hidden.

**What the judgment means.** It IS the scoreboard: every badge is an approval event already paid
for by the sim; nothing is scored that physics did not grant. This is the purest reading of "the
engine is a judgment" — it costs no new physics, only a classifier over the tape, the exact idiom
of the sound voice-map and `moveHintFor`'s derivation-from-truth.

**Onboarding.** The tally is RETROACTIVE: your last ten campaign runs already earned it — "first
0.4 s air — earned on kitchen01 · first booster spend — sandbox". A new player's sheet fills
during the tutorial, so the free-form day starts WITH a filled sheet and a vocabulary. The empty
canvas gets a three-badge footer: "things you can make from where the car is now", each named by
the same advice voice.

**Content treadmill.** Zero authoring forever — the content is the player optimizing the sheet.
The treadmill moves to a TUNING law: badge thresholds need the studio's own sweep tooling (the
`k02-order-table` enumeration idiom applied to trick definitions) or a single booster-loop rig
maxes the sheet every day — the degenerate-optimizer risk is real and is the same class of bug
the fail-timing sweeps already catch.

**Migration.** An overlay. Nothing moves — no id, no hash, no surface demoted; the campaign keeps
stars AND gains the tally tail. Cheapest candidate by an order of magnitude. Weakness: without a
GOAL, the sheet is a dashboard; a scoreboard with nobody's line on it is the sandbox door painted
louder, not opened — unless paired with C.

## Candidate C — THE CHAIN (player-published lines ARE the content)

**Core loop.** The ladder is the community's lines. A finish publishes: the share payload already
carries build + par + verified hash, and the ghost already races any link. The Chain adds one
sentence to the payload (schema version, append-only) — the LINK'S LINEAGE: which link's ghost you
beat to mint this one. "The ladder" is a chain of links that travels inside the links; there is no
server and no server is needed — determinism (`Modules/replay`, the atlas) is the trust backend
that makes a pasted link a fair race.

**Scoring grammar.** Par transfer. Each line carries its author's par (the star law's own
artifacts, now player-authored); you earn "beat <name>'s par" or you don't, and the ladder rank is
chain length + par-beaten, both verifiable from payloads alone. The daily fold (`dailySeed`) names
TODAY'S LINK the way it names today's board — the curator stays deterministic.

**What the judgment means.** A link is only publishable if physics approved the run — the hash
verdict IS the "no cheating" stamp; the round-3 evaluator's own words: the social loop is the most
polished part of the game.

**Onboarding.** The Chain opens SEEDED: the thirty campaign pars ARE thirty authored lines — the
first thirty links, published by "the house", each playable with one click on any device. Empty-
canvas paralysis cannot occur because the ladder is never empty and the player is never asked to
invent — the first free-form act is "beat one line, then publish yours," and beating is taught by
the campaign (which is, unchanged, the tutorial for what a line is).

**Content treadmill.** Community-fed; the studio authors only the seeds, which exist already.
Honest wall: **audience chicken-and-egg** — link-chains travel by the same channel as the links
and a game with no players has an empty ladder; the seeded thirty is the mitigation, and the
daily is the daily reason to return while the ladder is short.

**Migration.** Light-medium: share payload gains one field (save/share version bump, old links
must verify forever — a promise that becomes irreversible the day it ships); "ghost: from link"
becomes the chain's walk-up entry; the level select grows one tab. Campaign untouched.

## Recommendation

**Ship B first, grow C's spine on top of it, and commit A as the Decision Log bet only when B
proves the sheet holds a session without a cup.**

Sequence and why:

1. **B (the TALLY) now** — it cannot break a hash, a surface, or a promise, and it converts every
   existing run (campaign included) into freeplay evidence: does a goal-less score hold attention,
   or is the sheet just a sandbox in chrome? One cheap build buys the decisive experiment.
2. **C (the Chain) as the daily's social face** — the machinery is 80 % shipped (verified share,
   from-link ghosts, the seed fold); the schema field is the only new promise, so it must be made
   once and kept forever. This answers the director's "leveling system" complaint directly: the
   ladder becomes community lines while the 30 authored pars become its first, always-playable
   links — the campaign DEMOTED to tutorial-spine-plus-seed-gallery, nothing deleted.
3. **A (the Downhill) is the shape the house wants to become** — it is the only candidate that
   makes the crane's one-space a play fact rather than a victory lap, and its connector pass
   finishes the crane legs the round-3 verdict already lists as unfinished. It is also the only
   one that re-authoring cannot undo once players learn the house is one room. Bet it explicitly
   (below), not by drift.

Rejected as standalone: A without B/C is an empty cathedral (the house IS a canvas — same
paralysis, bigger); C without B is a ladder that still averages ~1 decision per link; B without C
is a dashboard nobody visits. The merge B→C→A keeps every asset and demotes nothing.

## Kill-list and irreversibilities

Frozen law first: **the 37 reference-build anchors do not move** under any part of this plan. The
house is a NEW id (append-only, atlas-appending); tours ride the shipped rungs; the tally reads the
tape read-only. The campaign may be DEMOTED (tours, seeded links) but campaign code and data are
not deleted absent a Decision Log entry — and B, C, and A each need their own entry for the
claims they make, not one blanket "freeplay" entry.

What breaks / is irreversible, in order of commitment:

- **B:** nothing irreversible; the badge thresholds are tunable (but publish the sweep or a
  booster-loop farm retires your credibility — this is an honesty risk, not a hash risk).
- **C:** the **share-payload schema bump is the only true point of no return** — links exist in
  the world and must verify forever; lineage must be optional-on-read, mandatory-on-write-new;
  the chain-rank number must be phrased as what it is (verifiable from payloads) or it becomes
  the game's first unfalsifiable stat, which is exactly the class of lie the 7.5 bought protection
  from.
- **A:** the **home screen becomes the house** — first-visit pixel baselines, the premise beat,
  and every chrome spec that assumes a rung-first boot are re-baselined (costly, not undoable in
  players' heads); the **farewell is rewired, not deleted** — porch05's "last word" section is a
  promise ("clearing the ladder means X"), and its crane-as-menu-camera re-homing must keep the
  one-clear-one-farewell law or the ending loses its last word; the **house frame's deck altitudes
  become canon** — every future set placement, camera rig, and the farewell's path inherits the
  six-deck ladder, which is why it goes in the Decision Log BEFORE the connector pass, not after.
- **Across all:** the single-machine law constrains C's rank display and B's records; say
  "your device" every time, the way the daily already does.

## The surfaces (what a player actually sees)

- **Home screen = the house, rendered.** Cross-section (roof off, one wall off), camera = the
  farewell crane's path parked at the porch; each room's window is the link its level-select row
  is today; a toured room carries its star tally on the sill; the daily chip and the chain field
  live in the same corner chrome they already own. No new visual language — it is the ending,
  running as the beginning.
- **Every result bar gains the tally tail** (B): three approved-event lines in the existing
  stock-voice, no new panel.
- **The level select grows a "lines" tab** (C): the seeded thirty, then the chain, each row one
  link, one ghost, one par, one name.
- **The sandbox gains a composition law it lacks** (any candidate): it is a ROOM, framed like a
  rung's, with the two neighbouring rooms' edges visible where the house frame allows — the door
  stops being hidden by becoming the same camera as everything else.

*Paper only. No code, no assets, no hash moved. The next artifact this note asks for is three
Decision Log entries (B/C/A as each is greenlit) and, for A, a spike: the house-frame table with
the six sets mounted at their frame altitudes, one car launched from the garage mezzanine, and the
count of rooms physics approves on the way down.*
