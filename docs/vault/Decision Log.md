---
tags: [log]
livedocs: snapshot
---
# Decision Log

Dated entries tagged `[agent decision]`. Newest first.

## 2026-10-12 — THE GHOST law, extended: MOUNTING a ghost is physics-neutral — proven, not asserted; a link ACCEPTED ends the run in friend mode `[agent decision]` `[systems engineer]`

The final sheet probe named a determinism fault (item (d): the identical 4-piece build reportedly ran
0.57 s with the par ghost mounted vs 0.67 s off; the re-probe's bedroom 2.80/2.83 split, "confirmed and
reproducible"). The audit closed the mechanism question before touching code: NO ghost lane adds a
physics body — every source is a translucent Three.js rig (the car-rig precedent) plus a `GhostTrace`,
and every wind steps a FRESH headless `World` that is `free()`d; `attachScene` moves scene nodes; the
entire coupling remains one `sync` line. The probe's own numbers read the audit honestly: 0.57 s is the
friend's `bbc4df19` rail-shortcut build and 0.67 s the author's DIFFERENTLY seated cup — two builds, one
misattribution (the return trip's own −0.03/0.10 rows ARE those builds' times), and the re-probe's split
correlates with re-anchored seatings, not mounts (a remove/re-place cycle re-aims the ring — the same
builder law as the porch re-anchor). LAWS, now held by tests rather than prose: (1) THE MOUNTING LAW —
with ANY ghost source mounted (bundle par trace, your-best record mirror, pasted friend link, chain/house
row, cold page) the run's hash AND finish print are IDENTICAL to the unmoved run: `tests/e2e/ghost-purity.spec.ts`
+ the Node interleaved-wind family in `tests/unit/ghost.test.ts`; a ghost that ever adds a body to a
live world fails them red. (2) THE LINEAGE ACCEPTANCE (item (a), one flag deep): a run that ACCEPTED a
hashed link ENDS in friend mode — `beatLineage` reads the SAME acceptance fact (`racedLink` with a hash)
the verdict row already prints, not the rail's current visual mode; an edit that lifts their car off the
grid never un-races the link, and the CHAIN's middle link mints (red-first receipt: the pre-fix gate
printed `lineage=NONE` in `tests/e2e/lineage.spec.ts`, which now walks paste → beat → publish → row
SHOWS lineage → two fresh-context devices verify the chain of two). (3) THE DOOR SHOWS THE CHALLENGE
(item (b)): the `#s=` viewer page prints NAME · GOAL · PAR straight off the payload v2 fields
(`#gw-replay-payload-line`) — presentation only, no field enters a sim; a v1 link prints nothing new.
Rejected: a separate non-stepped world per ghost (there was never a shared one to separate), mounting
census-ordered ghost bodies (no lane added a body to hold to the law — the law now catches anyone who
ever does). `replay:all` stays 30/30 byte-identical at this HEAD. See [[Modules/replay]], [[Modules/share]],
[[Concepts/Chain]], `Sessions/2026-10-12 Ghost purity.md`.

## 2026-10-12 — THE SEATING LAW: every launch seats identically, or the hash is a dice roll wearing a receipt `[agent decision]` `[systems engineer]`

- **THE FIX (closes the retry-law escalation above)** — `World.reset()` no longer removes-and-re-adds the car
  bodies. It REBUILDS the physics world through the constructor's own creation sequence (`createSimWorld` →
  `addTrackColliders` over the stored splines → `spawnCar`), so every launch is a FIRST launch by construction.
  THE MECHANISM, measured not assumed: Rapier frees the car's collider slot only when the NEXT step reclaims
  memory, and the re-added registration comes back at the same slot index with a bumped handle GENERATION —
  kitchen-sandbox's last collider reads `…8200000000` fresh vs `…8200000001` after any Retry. The solver
  iterates the contact graph keyed by those bits, so the impulse accumulation sums in a different order, the
  suspension settles ~0.1 mm apart by step 1, and the run lands two steps late (320 vs 322 kitchen-sandbox;
  kitchen01's par `557f33bc`/266 vs `d32417dc`/268; the escalated 337/339 kitchen line, same signature). This
  is the collider-order law ("2.84 → 2.72 on rebuild") caught in the launch path, now closed at its root.
- **THE LAW** — a run's hash is a receipt only if every launch of a build seats the car in the identical
  collider/world state; otherwise the hash is a dice roll wearing a receipt. Enforced by
  `tests/unit/seating.test.ts` (fresh-vs-Retry collider handle bits + spawn poses, three levels; run equality
  fresh/Retry/replayRun) and the e2e the repo lacked — `tests/e2e/retry-share-verify.spec.ts`: build → Retry →
  launch → share → paste → `verified`, RED pre-fix (kitchen01's post-Retry link printed `mismatch`), green after.
- **THE LAWS it honors** — (1) the 30 reference anchors are FIRST-launch replays: `replay:all` 30/30 verified
  and the atlas hashes byte-identical at this fix (only its date field moves); (2) STRICT REPAIR — live-retry
  hashes CONVERGE to fresh-launch hashes, nothing that ever verified changes meaning; a link created after a
  Retry BEFORE this fix replays from scratch and cannot match its recorded live hash — such links can never
  verify and age honestly, silently re-keying them would burn the receipt; (3) the sim rebuild per Retry is
  construction cost, not frame cost (once per Retry, 131 colliders), and `dispose()` semantics are unchanged.
  See `Modules/world` THE SEATING LAW and `Sessions/2026-10-12 Seating fix`.

## 2026-10-12 — the sheet-fix retune: thresholds swept at BOTH scales (325 rigs), and the retry-launch finding escalated `[agent decision]` `[feel engineer]`

- **THE RETUNE** — the sheet re-probe verdicted the tally PAINT: ~35 launches, one badge, zero in free play.
  The cause was measurement, not math: `AIR_MIN_S` 0.25 / `CATCH_MIN_AIR_S` 0.15 were swept only on campaign
  pars, and every sandbox gap flight flies 0.108–0.117 s — under both bars. `tools/tally-sweep.mjs` now
  plays 325 rigs (`tools/tally-fixtures.ts`: the six probe-named lines incl. the film-kept garage
  "slick skip", inside a deterministic 48-cell grammar grid per sandbox) and re-scores every trace against
  the five-threshold candidate grid per scale — the published table lives in [[Modules/tally]]. Shipped:
  `AIR_MIN_S` 0.25 → **0.05**, `CATCH_MIN_AIR_S` 0.15 → **0.09**; `RUNOUT_MIN_M` 0.15, `FALL_MIN_S` 0.15,
  `FALL_MIN_DROP_M` 0.06 and the noise-floor spend bar UNCHANGED (the grid shows no honest candidate moves).
  The two bars sit in a measured void — deck seams fly ≤ 0.0125 s (289 segments), real flights ≥ 0.1 s
  (144), nothing between. Farm cap re-checked: degenerates **0/325** (0/325 was the baseline at the old
  bars too), BOOSTER-FARM still exactly **3 badges — 3 spend**, the 3/run law intact, cap 6 stands;
  jump-and-land mints **142/142** (was 1/142). THE GATE now also fails any jump-and-land rig that mints
  no air+catch — the sheet-fix law, what the eyes see the sheet must grant, pinned red-first by the
  film-kept fixture before the constants moved. Rejected: one shared bar for air and catch (a seam can
  open a catch candidate the eye never saw); lowering the FALL bars to buy sandbox falls (the sweep
  shows it buys max-6 campaigns and 95-badge inflation — the lie-by-generosity the airborne reading
  already retired once).
- **THE RETRY-LAW FINDING (escalated, not papered)** — the re-probe's ENG FLAG (the kitchen 2.84 s finish
  that did not reproduce; the bedroom line timing 2.80/2.83/2.83/2.80) is NOT the tally and NOT the ghost:
  with ghosts OFF, headless, the same build replays **337 steps fresh vs 339 steps after `World.launch()`’s
  `reset()`** (kitchen-sandbox 5-straight+cup build; hashes `b9479e90` vs `121319e0`; byte-identical on
  pre-tally main `ec95e72` — the tally mounts read-only, the tape/interleave tests stay green). A re-seated
  car enters the collider order one step differently; the suspension settles 0.1 mm apart and the run lands
  two steps late. Consequences stated plainly: `Why the same build always runs the same way` is true of
  REPLAYS and false of the second LIVE launch of a session; a record ghost wound from the build beats the
  live car it records by ~0.02 s; and MEASURED on the shipped page — the share link taken after a FRESH
  launch verifies (`verified · matches the link`) while the SAME build’s link taken after one RETRY
  FAILS its own replay. This is the pre-existing collider-order law the freeplay probe already met as
  "2.84 → 2.72 on rebuild", caught in the launch path. Fixing it is `World.reset()`’s physics surface (a full sim rebuild
  per launch, or spawn-order-stable car re-entry) — the World/physics owner’s call, named for the director;
  this branch changes no sim code. See `Sessions/2026-10-12 Sheet fix — the sandbox-scale tally.md`.

## 2026-10-12 — THE CHAIN law greenlit: the ladder becomes community lines; the payload grows name, goal, par, lineage — v1 links verify forever `[agent decision]` `[systems engineer]`

The re-probe decided what argument could not: the named-line machinery HOLDS (a placed cup re-anchors the
verdict; "to the door · beat par −0.53" was the first win the toy ever called in a sandbox) — but the moment
that line is shared it dies: the payload carries build+par yet LOSES the name, the cup-goal and the author's
measured par, so a friend's ghost race prints `you vs par` for the WRONG game. The content exists locally and
evaporates on the wire. Greenlit: share payload **v2** — `name`, `goal` (the placed cup's transform), `par`
(the author's reference run measured by the gen-pars rule), optional `lineage` (the link whose ghost this run
beat). LAWS: optional-on-read / mandatory-on-write-new — **v1 links verify forever**, tested both directions
on real v1 fixtures, because a broken old link is a burned receipt; the cup-goal rides as geometry the guard
already places (no new physics, no hash near it — the verdict reads the cup from the BUILD); the LINES tab
seeds with the thirty authored pars, "published by the house", so the chain is never empty — the campaign
stands as tutorial-spine-plus-seed-gallery, undeleted, unmodified; chain rank is phrased as what it is
(verifiable from payloads, walked on this device), never a global number (single-machine law). THE TALLY's
badges are NOT rank inputs until their sandbox-scale sweep lands — tuning must not leak into the ladder.
Rejected: a server (the hash is the trust backend), accounts (a name is a string, not an identity),
score-normalized rank (unfalsifiable — the class of lie the 7.5 bought protection from). Proof: schema
round-trip fixtures, lines-tab e2e (seed thirty playable, named-line publish, beat-a-friend verdict row),
old-link-forever test in CI. See [[Modules/replay]], [[Modules/save]], `Sessions/2026-10-12 Sheet re-probe.md`.

## 2026-10-12 — THE TALLY law: badges are approvals physics granted, thresholds swept in CI `[agent decision]` `[feel engineer]`

- **THE TALLY LAW** — a badge may be granted ONLY for an event the deterministic sim itself
  produced, read as a PURE function of the recorded trace (`src/tally/detectors.ts` over
  `TraceSample` lists — the fifth surface of the input law: the tally owns no bodies, steps
  nothing, reads the tape). Freeplay Lane B of [[Reference/Action Plan 2026-10-12]] ships the
  sheet: five badges (air > 0.25 s, clean catch = a flight caught on ≥ 0.15 m of held ground,
  room crossing between declared parcels, chain fall = an AIRBORNE sustained descent, booster/
  spring spend = a one-step gain past 3·g·`FIXED_DT`), the tally tail on EVERY result bar
  (`tallyLines`, three lines max, campaign included — the sheet fills during the tutorial), and
  the personal records in the save (`settings.records`, no version bump — under `settings`
  because the merge law carries settings by reference and would drop an unknown top-level key).
- **Thresholds are SWEPT, not tuned**: `tools/tally-sweep.mjs` (k02-order-table idiom) plays 37
  rigs — all 30 par builds, the six sandbox references, a placeable booster-farm — through the
  shipped replay and the shipped detectors; measured max 4 badges/run, farm 3, `BADGE_CAP_PER_RUN`
  = 6, and the `--gate` line runs in CI after `replay:all`. The exploration's degenerate-optimizer
  risk is answered with a measurement and a number, not an assurance (same honesty as the fail-
  timing sweeps). The chain-fall threshold is a measured correction in public: the first sweep
  pass read the spike's dy-drop rule in world units and granted 2–3 per campaign run off rolling
  deck descents — the sheet lying by generosity; the airborne reading is the shipped one.
- **Hash neutrality is a gate, not a claim**: the feasibility note’s §3 probe measurement is
  promoted to a unit test — kitchen01’s par build hashes to its atlas receipt `d32417dc` with a
  tally tape mounted INLINE on the step loop and without, event streams equal across repeats
  (`tests/unit/tally.test.ts`, written red before `src/tally` existed); `replay:all` 30/30 and
  the atlas run unchanged.
- **The sandbox gains a stake, not a new truth**: a cup the PLAYER placed already re-anchors the
  physics’ capture volume (`World` reifies the last `finishCup`; the feasibility T5 measurement),
  so a named line is keyed to the cup’s seat (mm-quantised) and its record is
  (name, best time, the build that ran it) — the your-best ghost is that stored build’s own
  `TapeRecorder` wind (`GhostMode` `'record'`, the bar says `ghost: your line`), a save-schema
  statement and nothing else. The share page’s run-cam mounts on the sandbox result reading the
  run’s own recorded states. Every number says the daily’s sentence verbatim: the records are
  your own runs on this device only — there is no server and the sheet does not pretend there is
  one. Nothing moves: the 37 anchors are frozen, stars stay stars, and the campaign is DEMOTED
  by addition only.

## 2026-10-11 — Rules of the house, round two (wrong-branch drift, stamp paths, evaluator isolation) `[agent decision]`

- **Wrong-branch drift is repaired with `git merge --ff-only <stray>`, never cherry-picks** — an evaluator
  that ran `git checkout` inside the main checkout (instead of its worktree) left round-two merges
  committed on `eval-eng-r2` while `main` sat still; the commits were real and linear, one FF moved them
  home. Verify `git branch --show-current` BEFORE trusting merge/push output on a shared checkout — a
  `-q` push happily reports success for pushing the wrong ref's nothing.
- **`livedocs stamp` takes vault-relative paths** (`"Reference/Level Ladder.md"`); a `docs/vault/...`
  argument doubles the path and dies mid-loop with a FileNotFoundError traceback.
- **Agents' worktrees live OUTSIDE the repo root**; if `git worktree add` fails, report — never fall back
  to branch work in the main checkout; never `git add -A` beside a stray nested clone (the gitlink
  incident: two evaluator worktrees staged as embedded repos).
- **Merge-conflict order that survived**: `drift.lock` + capture PNGs `--theirs` (intentional
  re-baselines), `Decision Log` by hand keeping BOTH blocks, complete the merge commit, THEN the stamp
  loop until `livedocs affected` is clean, THEN push. Tests run over an unresolved merge mean nothing.

## 2026-10-09 — The FAREWELL law: porch05's first clear replaces the result bar with one crane pass and three doors `[agent decision]` `[level designer]`

The player evaluation's truth #7 — "the campaign's final state is a two-star bar with Retry and Share —
no farewell, no summary of the thirty rungs, no view of the whole house" — was the shapeless end of a
shaped game. The law now shipped (program T3.3, PAIRED with the doors): clearing `porch05` for the
FIRST time (a FINISHED run, not a dev preview — a preview mints no star, so it mints no ending) skips
`resultPanel.show` and opens `src/pages/farewell.ts` instead: ONE crane pass over all six sets mounted
side by side at their canonical origins (the registry's own visual-only builders — replay rigs, zero
new physics, zero hash movement; `replay:all` untouched because this is post-run cinema, not sim), the
eye DWELLING on each room in campaign order, lifting between rooms, settling on the wide house — and
carrying the player's OWN star tally per room, folded through `CAMPAIGN` (the one source of room
membership). The page is EVENT-DRIVEN like the replay (`farewellPlan`: constants in, timed reveals
out, deterministic machine to machine). Then THREE DOORS, one click each, all three shipped surfaces:
the room's sandbox (`?level=porch-sandbox`), today's daily run (`?daily=1`), and the SHARE film of the
porch05 run that just ended (`#s=`, the payload frozen at the same edge the share button would have
used). ONCE PER SAVE rides the premiere's idiom: `gravity-works.farewell.seen` in localStorage,
deliberately OUTSIDE the save schema (a UI fact, no v3 bump), set at the FIRE not the finish — a crane
skipped half-way was still stood in, and skipping shows the whole truth (summary + doors) at once.
`?farewell=1` forces it for the farewell's own spec, `?farewell=off` is the URL-affordance family's
opt-out and `tests/e2e/goto.ts` appends it so no ladder-walking spec is ever ambushed (the `?intro=`
law again). THE REDUCED-MOTION LAW: the crane is pure motion, so reduced motion gets the STATIC
SUMMARY PAGE — the same tally, the same doors, no camera, the set row never even built. Everything
else at the terminal edge (stars, sound, hash note, daily chip) runs exactly as behind a panel; ONLY
the bar is replaced. Proofs: `tests/e2e/farewell.spec.ts` (bar replaced, reveals in campaign order,
each door lands, second clear = the ordinary bar, reduced-motion = static) and
`tests/unit/farewell.test.ts` (param family, tally fold, the plan's determinism and sweep).

## 2026-10-09 — The campaign ladder is re-WOVEN flat: grammar rungs ≥3 apart, arcs and hashes frozen `[agent decision]` `[level designer]`

The player evaluation's structural verdict — "a player at rung 8 (bedroom01)
feels déjà vu because rung 8 is rung 1 with different wallpaper… the rooms'
grammar clusters" — is a ORDER problem, not a content problem: five rooms ship
the same five-beat rhythm (01 gap lesson, 02 CHOICE, 03 TRADE-OFF, 05 encore,
04 capstone) back to back. T3.1 re-wove the FLAT ladder in `campaign.ts`
(nav data only). Chosen: interleave-WITH-RAMPS (short same-room runs, then
weave) over pure round-robin — a pure weave front-loads six 01 rungs, which
is the disease itself. The order and the five asserted laws (grammar gap,
prerequisite table, room arcs, rising curve, beginner walk) live in
[[Concepts/Levels]] §Ordering of the ladder; the prerequisite table derived
from the rung notes is the load-bearing part: capstone ← own room's 01-03;
encore ← own 01/03 + kitchen05 (every encore tray carries a `booster`
TEMPTATION — the lesson is Sunday Run's); every live grip zone ← kitchen04
(the `hazards` declarations are the source, including the wet rooms' 01s);
bedroom01 ← kitchen01 (the no-launch lesson reframes the launch verb).
Edge cases ruled NON-prerequisites: geometry citations (the ENCORE_DIP's
PORCH THRESHOLD lead) are rung-local authoring references, not player
lessons; `garden01`'s shadow is not a grip zone; porch rungs carry no live
zone and no booster. Design calls defended in the note: first five = kitchen
ramp → bedroom ramp; every encore lands DIRECTLY on its room's `04` (all four
encore→finale adjacencies survive, so the encore specs' semantics are
unchanged); `porch05` stays last. The honesty line the plan demanded:
nav-only TREATS THE SYMPTOM — the repetition is spaced out, not cured; T3.2's
ghost is the cure. Frozen by gate: ZERO level-data change — `replay:all`
verified byte-identical rung-for-rung against the pre-weave tree; ids are the
append-only shipped thirty (no save migration: `stars`/`reached` record IDS,
and the next-rung resolution from ids is unit-asserted across the re-weave).
Regenerated rows: campaign/boot expected-next rows (unlock = previous star,
meaning preserved — `kitchen05`'s star now opens `bedroom03`, `garden02`'s
opens `bedroom05`); dev-select grouping unchanged (rooms stay visually
grouped — `CAMPAIGN` is now a projection of the flat ladder, one source of
order). See `Sessions/2026-10-09 Program T3 warp.md`.

## 2026-10-09 — The failure note says MOVE when the BUILD DATA says MOVE: the MOVE clause and its precedence law `[agent decision]` `[level designer]`

Program T2.1 (Action Plan T2.1; the evaluation's truth #4 — "the failure note only knows how to say ADD when the tray is empty and the truth is MOVE" — and truth #5, the kitchen05 booster wall). The note gains a second reading of the build graph, `moveHintFor` in `src/ui/advice.ts` — socket facts only (the same join arithmetic `flippedKindsFor` reads; NO physics in the note), surfaced through the `#gw-note-body` gate chain as `moveHint` (`src/ui/result.ts`, plumbed `src/boot.ts`; shared/replay pages pass `null` and keep every shipped line byte-identical). Two readings, two precedence laws, chosen over the alternatives: (a) the ORPHAN clause (a piece the player placed sits on the goal's own open exit) **outranks the ADD list** — rejecting "name a kind you could add while a placed piece dangles past the goal", because "add a drop" spoken beside a player-placed drop past the cup is the same lie-by-silence the R-flag fix retired; the sentence names the piece and the goal in the language the note already owns (the `goalNoun`), the return seat via the existing WHERE tail, and teaches `]` — the tie-walk doubled as aim-to-socket since the stage-6 a11y fix, so the sentence is executable with no new verb. An AUTHORED run-out fixture never names: kitchen02's curve is authored, not stranded, and only player pieces speak. (b) The BOOSTER sequencing clause **fires only where the ADD tail is silent** (stock spent, or the tray holds only the booster) and never overrides an actionable ADD — while a placeable piece remains, ADD is the more actionable truth, and playtest Q's rule stands: no copy names a booster the player cannot act on (the `canAct('booster')` gate rides the note's own gate). Wording law kept: the machine naming (`fell off` vs `rolled past`) survives the insert unchanged; the clause is an inserted clause, not a new verdict. Proofs: `tests/unit/result.test.ts` sweeps (orphan outranks, authored-run-out silence, booster silence-when-placed/actionable, byte-identical null-path lines) and `tests/e2e/program-voice.spec.ts`; the kitchen03/kitchen04 residual's Deferred line closes (`Home`).

## 2026-10-09 — The Remove button names what it takes, in the ring's own words `[agent decision]` `[feel engineer]`

The Place button named its socket (2026-10-08); its twin left the deletion's direction to superstition — one LIFO button on a tray whose pieces are indistinguishable once placed, which is exactly what the k03 playtest's clear-and-rebuild was. `removePhrase` (`src/ui/builder.ts`) now writes the button's text as `Remove the <piece> <locator>` — the locator chosen in the socket-graph words the ring and the note already speak: `by the ramp` (its entry joins an anchor's exit), `past the cup` (seated on the goal's own exit — the orphan), `at the car's start point` (the bare release socket), and the LIFO law itself, `you placed last`, only when the graph locates the piece by nothing else; `title`/`aria-label` state the last-in-first-out rule outright. The piece comes from `removeIndex`, the scan `removeLast` performs — ONE source, so the label cannot drift from the click; rejection lines and the spoken `removed the X` line are unchanged, and the plain `Remove piece` stands when the button owns nothing.

## 2026-10-09 — Share links open PLAYING: the film leads, the verdict is one line, and autoplay stays legal `[agent decision]` `[systems engineer]`

Program T2.2 (the evaluation's truth #3 — two seconds of badge before film). Over the alternatives (badge shrink; verdict-on-launch-optimistic — rejected as the page claiming an outcome before it computes): the page restacks to THE FILM FIRST — the stage is the first substantial node and `startReplayPlayer` (`src/pages/share.ts`) paints the PRE-WIND preview frame as the page's first paint, the title demotes to a caption, the bar (Play, scrub, speed, `#gw-replay-build` exit) mounts under it BEFORE the wind so the CTA is one click from first paint; the badge element is retired, not hidden, replaced by ONE honest verdict line under the player (`#gw-replay-verdict`, `role=status`) that PROMISES while `settle` has not resolved and PRONOUNS the machine-local result when it has — wording machine-local, glyph riding the word, the `verified`/`mismatch` strings and every spec-read ID untouched; the hash essay moves behind a closed `<details>` fold (`#gw-replay-verify-fold`), the mechanism paragraph byte-identical inside it. AUTOPLAY LAW: a silent replay is not a media embed — the page RE-SIMS on the local machine, so opening playing breaks no autoplay policy (the evaluation's own distinction), with the reduced-motion pause and click-to-override preserved. Proofs: `tests/e2e/program-voice.spec.ts` DOM-order test plus the reworked `tests/e2e/share-replay.spec.ts`.

## 2026-10-09 — kitchen04 is placeably UNWINNABLE as shipped: the guard audit enumerated the wrong sockets `[agent decision]` `[level designer]`

While building the T2.1 e2e proof on kitchen04, the scripted whole-tray rebuild the MOVE clause names found ZERO legal second seats in every one of the 24 orders: after `gapLip @ ramp exit`, the sink-exit socket refuses all four remaining pieces (`blocked — the tap is in the way`). Measured cause: the `tap`'s guard box bottom edge (`setPlacementGuard` → `blockerOf`, whole-group AABB) sits 2.2–7 mm BELOW the sink-exit deck plane the par's own pieces run through (`endSocket` at deck height), so any flat piece seated there intersects it — the placement guard is stricter than the collision the par's own finish proves survivable. The K4 tap-wall audit (`Sessions/2026-10-09 Stage 4 - K4 tap wall`) checked the INITIAL sockets on the fixture-only rail and never the MID-CHAIN seats a real build walks into — an audit-scope miss, not a physics change. Options weighed: lift the tap base a few mm on the mount row (re-derives every k04 hash and owes its own playtest) vs a leaf-granularity guard (the camera lane's `setCameraSolids` precedent — the set lane already conceded group boxes over-block for cameras) vs retargeting the sink-exit socket (the par chain would no longer seat, which is itself the bug's confession). Chose DEFER with loud evidence (`Home`, `Concepts/Levels` kitchen04 card): the fix is a set/mount pass with its own acceptance playtest, not a voice-pass side effect — and a rung whose answer is unplaceable is the one thing worth flagging loudly while a quieter surface (a note saying "move it back") can mask it. The T2.1 proof therefore demonstrates the clause on kitchen04's BUILDABLE half (the cup-exit orphan) and executes the full sentence live on kitchen05.

## 2026-10-09 — The same-machine caveat is UPGRADED with evidence: 37/37 reference hashes reproduce on linux-x64 `[agent decision]` `[technical artist]`

Final Report "next" #2 asked whether the share-hash claim — proven same-machine, hedged everywhere it is spoken — actually survives a different OS/CPU, given Rapier is CPU WASM over IEEE-754 doubles. Ran the cheap experiment GitHub Actions makes free (the software GL rasterizer never touches physics, so a headless derive costs one `replayRun` per level per runner): `tools/hash-atlas.mjs` derives every registered level's reference-build terminal hash (+ steps, time, tray pieces, par lines) into the committed `docs/vault/Reference/hash-atlas.json` with a platform/node/rapier header, and the CI `determinism-atlas` job re-derives and diffs it on ubuntu-latest and macos-latest — REPORTED, never gating (per-level `::warning::` + step summary; the other gates cannot see it). Result: **37/37 on linux-x64, 37/37 on a second darwin-arm64 machine**, no rung's hash or step count budged, across Node patch drift v22.22.1 ↔ v22.23.x; the suite's node↔browser hard assert also rode the same ubuntu job green. Chose to UPGRADE the claim honestly rather than keep a caveat the data has outgrown: "verified on linux-x64 + darwin-arm64; Windows/iOS/Android/arm-linux/x86-32 remain unproven". The UI wording law moves with it: the badge stays machine-local ("verified on this machine" is what the page itself proves) and the verification NOTE now names the machines the cross-machine claim covers (`src/boot.ts`). The job stays report-only until a stage-7 promotion decision — if a future run diverges, the table localises it (same-rung different-hash = float divergence; a subset of rungs = a solver-branch story, a stage-7 question). Any par-hash re-derivation must regenerate the atlas in the same commit. Full table and law: `Reference/Cross-platform determinism 2026-10-09`, `Modules/replay`, `Modules/share`.

## 2026-10-09 — Steering is PARKED WITH CONDITIONS: the channel works, the bowl does not `[agent decision]` `[physics engineer]`

Ask #1 (drivable yaw, open since stage 3) got its decisive spike (`Reference/Steering spike 2026-10-09.md`, branch `spike-steering`, NEVER merged): steering lives in `World.step()`'s INPUTS phase as data-driven impulse events — `car.ts` untouched, flag default-off, and the hash law proven from both ends (flag-off `replay:all` byte-identical to baseline md5; a deliberate wishbone-constant mutation moved every hash and failed 6 rungs — the suite sees sim changes). Measured verdict on the ASK itself: ~100 swept combinations of radius/bank/speed/actuation crossed ZERO banked arcs — the wall-plough bleed (50 % of KE in ~0.5 s inside the bank) and down-bank slide are rail-side physics a chassis impulse cannot pay for; steering changes HOW a bowl run dies, not WHETHER. Chosen over adopt-or-reject: **park with three named conditions** — (1) a track-side rail work-honesty pass with a passive-car-completes-`steerbowl` gate BEFORE any steer key ships; (2) a studio ruling on whether this is a build+DRIVE game (the pure-build stack — par stars, death-clock learnability, share-as-proof — assumes no hands mid-run); (3) any adoption migrates with zero re-anchors (`steerEvents` a World option, never level data; campaign levels pass none; share payload v3 optional-field only). The law this pins: a future rail pass may not quietly redefine "drivable" as "steerable" — if the passive gate is met and steering still buys nothing, the ask closes REJECTED by geometry. See `Sessions` trail, [[Concepts/Levels]] (ask #1).
## 2026-10-08 — Six sandboxes ship, and the two longest encores move to the porch clock `[agent decision]` `[level designer]`

Two items from the shipped Final Report's "next" list, both measured against
playtest DD ("fresh skin, familiar bones… cut the encores' length, keep
their sets… trim garden05/garage05 toward porch-level brevity").
**(A) The sandbox promise, finished.** The kitchen's `kitchen-sandbox` was
the pattern; now every room ships one — `bedroom-sandbox`,
`bathroom-sandbox`, `garden-sandbox`, `garage-sandbox`, `porch-sandbox`,
each registered by its room's `05` file with the kitchen's semantics
verbatim: `sandbox: true`, budget 999, every kind ×99, a reference lap at
the ladder's own geometry (four gap rooms 2.733 s on the shared
`KITCHEN_GAP` off the 0.28 shelf; the porch laps its own verbs in 1.158 s),
and NONE of the campaign surface — off `CAMPAIGN`, invisible to the level
select, nobody's Next, `?level=`-addressable, badgeless (exactly the
kitchen one's discoverability; the ladder stays THIRTY). No existing hash
moved: these are new ids, and `replay:all` is 30/30 as before.
**(B) The encore brevity trim — and the honest part: two par hashes moved.**
`garden05` and `garage05` kept the rail, the pinned `ENCORE_DIP` and the
tray EXACTLY and moved only the release to the ladder's fail-timing chute
(−29°/0.24 m, blend 0.12) with a 21°/0.18 m run-out catch — the −12° ramp's
~1.7 s crawl was the whole length. **Par replay hash `1b37dfed` →
`1f99683a` on BOTH rungs** (parTime 3.05 → 1.35, measured 1.342; pieces
unchanged at 4; their `setPlacement` rows re-derived). The four-rung encore
family rail SPLIT IN TWO: `bedroom05`/`bathroom05` stay byte-identical on
the −12° rail (`1b37dfed`, 3.05) — DD's trim was scoped to the two rooms
whose encores read as pure remixes, and the light-pool and flood encores'
staging IS their freshness — and no other rung's hash budged (kitchen's
`PINNED` atlas intact). The trim could not be law-neutral and is not
claimed as one: the promise law survives UNBROKEN (11/11 sampled omissions
fall, earlier) and the tail-hash/EARLY-LATE booster laws survive byte-exact,
but THREE laws flipped with the crawl and are re-stated with measured
numbers in the level files and tests — deck-first FINISHES 0.025 s late
(porch05's own exception idiom; it fell at 2.808), the two-plank mid bridge
finishes SLOW, and booster-spent-AND-line-ridden overshoots and FALLS (the
buy became a substitution, never an addition). A geometry-preserving
alternative was measured first and is DEAD: on any −12° release the porch
clock is unreachable (the crawl is ~60 % of the rung), and every grid cell
tested (chute height × dip step × lead × catch face, 60+ cells) flips the
same two ORDER laws — the trim's cell is the one that flips the fewest.
Proof: `tests/unit/garden-levels.test.ts` + `tests/unit/garage-levels.test.ts`
(104 green between them), `tests/e2e/stage6-encore-brevity.spec.ts` (fresh
session, no instructions, four blind Places, ONE launch, finished — the k3
floor on the porch clock), `tests/e2e/stage6-sandboxes.spec.ts` (screenshot
smoke + campaign-invisibility per sandbox), pars re-derived by script,
`replay:all` 30/30. See [[Concepts/Levels]] §Sandbox and §The encore
brevity trim, [[Reference/Level Ladder]] §Sandboxes,
`Sessions/2026-10-08 Stage 6 sandbox + encores`.

## 2026-10-08 — The Place button names the socket it drops into `[agent decision]` `[feel engineer]`

Playtest DD burned ~10 launches and 18 minutes on kitchen01 — the first impression of the whole game — because the tray "Place" button, labelled nothing but "Place", dropped pieces at what read as "a fixed right-side socket" instead of the spot the aim had named. Diagnosis: there is no fixed socket — hover-aim legitimately follows the mouse wherever it crosses the canvas (`HOVER_PX`, the ratified aim law), INCLUDING the transit from the aimed socket up to the button, so the press answered the transit's last intermediate hover, not the aim the player had chosen, and nothing on screen said so at the press. Option (b) — removing or downgrading the button to the keyboard path — was rejected: it strands the pure-click player, exactly the player DD was. Chosen (a): **the Place button places at the CURRENT aim (the ring the ghost already wears — the placement code never changes) and its LABEL carries that socket's ratified name**, `Place — <socket>`, written by `updateGhost` wherever the aim moves (`src/ui/builder.ts`; the same words `#gw-target-label` speaks, minus the verb and the tie tail — one naming system, inherited socket-naming laws, greyed kinds stay unnameable); a button that cannot place names no spot. The law this pins: **no place verb may speak the generic word alone while a specific socket is about to be built** — the screen under the player's eyes at the press instant must name what the press will do (the input-truth law extended from status lines to BUTTON TEXT). Proof: `tests/e2e/place-honesty.spec.ts` (fresh kitchen01, mouse-only: every button press places at the socket the aim names, asserted through `__gwTargetSocket`/`__gwOpenSockets` and the counter — zero mis-drops — including the DD transit gesture with the mouse path crossing the canvas; the label rides every aim change), keyboard parity untouched (`tests/e2e/a11y.spec.ts` holds). Cross-reference the aim-or-speak law (Decision Log 2026-10-10) — same truth, new surface: that one says WHERE a canvas click may build, this one says WHAT the tray button must say about it. See `Modules/ui`, `Sessions/2026-10-08 Stage 6 place honesty.md`.
### Same day: kitchen03's second wall is fixed in the CALL-OUT, and the determinism anchor does not move `[agent decision]` `[level designer]`

The bowl walled a second fresh-eyes stranger (playtest DD, 6+ launches, after playtest BB's 6): "the only snap is a curve exit the game itself says is blocked — furniture is in the way", "building backwards from the cup runs off-table", "] swaps to the car's start point". The rung is solvable — the par replays verify and 60/60 whole-tray orders finish — so §12 says fix the level or the callout, and the measurement chose which. **Geometry options measured and REJECTED:** (a) *move the blocking furniture* — the box that refuses the rim seat is not furniture, it is `cereal-bowl`'s own AABB (asserted at `tests/unit/set-wiring.test.ts`), and the bowl is ONE prop for every kitchen rung, so "move it" means moving the set for the whole room to service one rung whose rim line is anyway BLOCKED (ask #1: no shipped car steers a banked yaw arc) — the socket would become a placeable decoy that physics then fails, a worse wall; (b) *close the cup's dangling exit with kitchen02's run-out idiom* — the cup sits at the rim of the round counter (the dress spans x 0.52–1.47; the cup's entry is x 2.218), so a run-out deck hangs over the floor, which is the exact "off-table" tell DD read correctly. Chosen, and it moves NO geometry: **the callout names the discoverable path** — a red seat names the object that refused it (`SetGuard` names from the set's own object naming, `solidWord`, authority-tested box-for-box) and hands over the key that has an answer; a legal seat past the finish says the run ENDS at the goal, so a line built past it is never travelled; and the failure note's ADD tail, which already named only a KIND, now names the END the kind goes on (the far open exit of the start-connected chain — the socket `chainHeadIndex` aims the boot ring at, so the sentence is a fact about the build graph, never a guess about intent), and teaches `]` only when the ring marks somewhere else. Two laws bound the new tail, and they are why it is not simply stapled to every failure line: it rides an ADD tail ONLY (a critique — "flatten the landing", "re-place it flat (no R)" — is about a piece already on the track), and an unknown aim (a shared or replay page) leaves every shipped line byte-identical. Consequences worth naming: the blocked copy is no longer the single `GHOST_LABEL.blocked` string a spec could grep, `setPlacementGuard` returns named guards (the camera walk maps them back to boxes), and `physicsNote`/`resultModel` gained one UI-side argument — none of which the physics or a run hash ever sees, which is exactly why kitchen03's anchor `a1a50d05` STANDS and no re-anchor line is owed. Proof: two fresh browser sessions on the worktree's dev build, ≤ 6 launches each — cleared in 1 and in 2 (the second entered DD's cup-side trap deliberately and was returned by the note); the rung's floor is now a spec (`tests/e2e/stage6-k3-discoverability.spec.ts`: five blind Places, one launch, finished). Residual filed rather than papered over: a player who ignores the past-finish tell and fills the tray on the far side gets the BARE head (the stock tail needs stock) and `Remove piece` is last-in-first-out, so that recovery is clear-and-rebuild — the ask is an ORPHAN-PAST-GOAL clause or a Remove that names which piece it takes. See [[Concepts/Levels]], [[Modules/ui]], `Sessions/2026-10-08 Stage 6 k3 discoverability`.

## 2026-10-08 — Tab is never the game's key; the touch orbit is a two-finger drag and the pinch stays the browser's `[agent decision]` `[feel engineer]`

The stage-6 audit found the keyboard claim had been a lie by construction: the aim tie-walk rode Tab under world focus, and world focus is the page's default state — the FIRST Tab of a session preventDefaulted into `cycleAim` and focus never moved, so a keyboard user could not reach a single button by Tab. It survived five stages because every prior "keyboard" proof drove focus() or the arrows. Chose: **Tab is the browser's focus walk on every element, everywhere** — no page verb may ride it (`[ ]` already owned the tie-walk honestly); the fix is subtractive (Tab leaves the keydown table) plus a real traversal spec that walks the live stop list rather than asserting focus() outcomes. The same pass bound `L` to launch (world focus, the same `startRun` as the button, taught on the hint) so the brief's keyboard-only level is literally the e2e. The touch translation chose similarly on the one contested pair: **two-finger parallel drag is the app's orbit; SPREAD stays the browser's pinch zoom** (`touch-action: pan-y pinch-zoom`) — page magnification is an accessibility feature we must not swallow, so the two-finger gesture without scale change is ours and the recognizer's `pointercancel` ends it with no verb; a second touch contact latches the press as framing so a two-finger sequence can never place. Long-press stays a no-surface decision (documented, not invented). Proof: `tests/e2e/a11y.spec.ts` + `tests/e2e/a11y-touch.spec.ts` (390/820 has_touch), `scripts/a11y-contrast.mjs` in CI, the tab-stop screenshots in docs/explorations/a11y; the laws stand in `Modules/ui`, `Modules/camera`, and the audit `Reference/Accessibility audit 2026-10-08`.

## 2026-10-11 — The tape pump rides timers; rAF only paints — a CI-only hang was a product bug `[agent decision]` `[feel engineer]`

The share-replay trace test went red ONLY on CI (a 30 s `page.evaluate` timeout, 6/6 green locally): the chunked wind's arm raced rAF against a 16 ms timer, and a STARVED frame callback starved the chunks. Chasing the CI difference found the USER bug behind it — Chrome fires NO rAF at all in a HIDDEN tab, so a visitor who backgrounded a share link never got their tape — fixing only the spec would have shipped that. Chosen: the slice chain rides `setTimeout(0)` and **rAF only paints** the winding label (`src/boot.ts`'s wind; `Modules/replay`); the trace/state seams became READ-ONLY (no evaluate does synchronous catch-up) and the specs READY-poll the wind phase (90 s) before their first evaluate; the pace clamp no longer wipes the ledger, so a film-out session's law-honouring frames stay provable even in 2-frame 4× tails. The LAW this records: when a repro exists only in an starved-frame environment (CI compositor, hidden tab), ask what a USER in that environment sees before touching the test — here the environment was a user condition, not a flake. Proof: `tests/e2e/stage5-ready.spec.ts` item 4 (hidden `visibilityState`, rAF NEVER fires — probe note: `waitForFunction` defaults to rAF polling — the tape still winds to the identical slice ledger), and a CI-truth repro on a GPU box, `E2E_SWIFTSHADER=1` (renderer string verified) × `E2E_STARVE_RAF_MS=300` × `GQA_FORCE_SOFTWARE_GL=1` × `--repeat-each=6 --workers=6`: 42/42 on share-replay + stage5-ready. Cross-references: the record-then-render law (Decision Log 2026-10-09) and the chunking/hash-equality law (2026-10-10) — this entry changes WHO ticks the clock, never what the clock computes; the per-rendered-frame pace law from the CI-red salvage holds through it (`tests/e2e/share-replay.spec.ts`). See `Sessions/2026-10-10 Stage 5 - BB feel fixes.md` (pump addendum), `Modules/replay`.

## 2026-10-10 — A replay slice is SCHEDULING, never semantics: the TapeRecorder chunking and the hash-equality law `[agent decision]` `[feel engineer]`

Playtest CC clicked Play on a share link and the film answered ~6 s late with the playhead pinned at the end — two one-shot simulations (the `replayRun` verdict + the synchronous `stepAndRecord` fast-forward) plus a ~870 ms one-time shader compile, all on a blocked main thread behind a button still reading "Play". Two shapes for the fix: trim the sims (still a dead window, and the verdict would re-sim separately from the tape — two sources of truth per page), or make the ONE deterministic sim resumable. Chosen: `TapeRecorder` (`src/replay/cinematic.ts`) — the stepping loop as a state machine, `pump(n)` ≤ 32 fixed steps per slice (≤ 8 ms), `sliceHashes` ledgering the STATE HASH at every boundary; `stepAndRecord` is its one-shot wrapper. THE LAW: **slicing may only ever be a scheduling decision** — the terminal hash must equal the one-shot `replayRun` result (the existing gate) AND every slice boundary must carry the state hash the one-shot Node `World` holds at the same step count, asserted slice-by-slice (`tests/e2e/stage5-ready.spec.ts` item 3, `tests/unit/cinematic.test.ts`). Because the wind settles the verdict, the share page pays ONE simulation; `replayRun` survives only as the could-not-mount fallback. The wait became a SURFACE: the waiting bar up by ~150 ms with a counting label, a click during the wind QUEUED and honoured with snap-to-0, the ledger `waiting → queued-click → playing → ended` (`__gwReplayWind`/`__gwReplayPhases` seams). Rejected: an arbitrary-timeout spinner (still a hole), keyframe tricks across slices (forbidden invented states — the 2026-10-09 record-then-render law stands; this entry extends WHO ticks the clock, never WHAT the clock computes). See `Modules/replay`, `Sessions/2026-10-10 Stage 5 - BB feel fixes.md` (readiness addendum).

## 2026-10-10 — The aim range is the HOVER_PX cone; a world-range cap is redundant and was removed `[agent decision]` `[feel engineer]`

Playtest BB: "snap ghost lands far from cursor — placed a lip 150 px from where I clicked and it counted." A WIP fix capped aim at a 0.5 m ray-perpendicular world range; headless geometry showed the cap is MATHEMATICALLY REDUNDANT with the screen cone (perp = dCam·tan θ — a screen-radius conjunction only ever TIGHTENS at depth) and it REFUSED legitimate aims (every campaign aim beyond ~3.5 m; a feeltrack centre click sits 159 px out anyway). The cap came out. The LAW: the snap range IS the `HOVER_PX` screen cone, and placement is AIM-OR-SPEAK — a held click inside the cone places, a held click outside places NOTHING, moves no ring and says "nothing fits out here" (BB's real bug was never radius — it was placing at the STALE ring after a failed aim); empty-handed clicks speak the hand line FIRST wherever they land (playtest U's contract). Consequence for the suite: nine specs that had proved placement THROUGH the stale ring (centre clicks at 159 px) now express the intent at the ring's own projection (`Builder.targetSocketPx` + `__gwTargetSocketPx`), so they prove the GESTURE law and the far-click specs prove the RANGE law; T11 keeps its below-fold release honestly (a 65 px in-cone release point, asserted as a precondition). Cross-reference the click-vs-drag disambiguation of the §9.3 amendment (Decision Log 2026-10-09) — same owner (`clickPlaceAt`), different law: that one says WHEN a press is a click, this one says WHERE a click may build. See `Modules/ui`, `Sessions/2026-10-10 Stage 5 - BB feel fixes.md`.

## 2026-10-10 — The "other spot" walk may only visit DISTINCT outcomes `[agent decision]` `[feel engineer]`

Playtest BB hit the same 1.94 s run twice via the `]` "other spot" key — two candidate sockets, byte-identical builds, the hint lying about having a choice. The tie list now carries the DISTINCT-OUTCOME law: candidates are listed for the `]` walk only when their dry-run build hashes differ (`distinctOutcomes`/`dryRunHash`, `src/ui/builder.ts`), and the dry run shares the APP'S inputs — held kind + EXACT tray-override params + flip through `Builder.heldState()`/`__gwHeldState` — so the test-side recompute can disagree about outcomes but never about geometry (a WIP keyed on `PIECES.landing.params` while the app seated the tray override and "hashes disagreed about geometry, not about the law"). Same-surface honesty: the tie line states the count of distinct builds the key visits. Cross-reference the three-way advice truth (Decision Log 2026-10-09) — an advice tail may name only a kind the player can act on; this entry extends the law from WORDS to KEYS: a hint may advertise only an outcome the key can actually produce. Unit-gated (`tests/unit/aim-outcomes.test.ts`) + live proof (`tests/e2e/stage5-bb-feel.spec.ts` item 4). See `Modules/ui`.

## 2026-10-10 — A dev preview mints nothing: URL addressing stays free, progression stays earned `[agent decision]` `[systems engineer]`

Playtest BB finished a par run on `?level=bedroom02` — a LOCKED rung — and saw the star mint and the map show it unlocked: the 2026-10-07 "URL debug affordances are recorded, not stripped" entry had ruled that addressing is free and the LADDER gates what is EARNED, but the recording half had no teeth — `recordStars` wrote from the terminal status alone. Chosen: boot reads `levelUnlock` at start, and on a locked campaign rung addressed by `?level=` it SKIPS `recordStars` and gates `Next` off, wearing the corner `#gw-dev-preview` badge — so the badge's promise is a property of the code path, not a caption. The doctrine's sentence amends to: only a finished run MINTS, **on a rung the save has opened**. Share/replay pages wear nothing (they never build the game DOM). Consequence kept honest: the campaign specs now seed the PREVIOUS rung's star (save wins over seed) so their earned-star claims run on genuinely unlocked boards. Cross-reference Decision Log 2026-10-07 (record-not-strip — unchanged doctrine, new enforcement) and 2026-10-07 (star/reached migrade — the mint rule itself untouched). See `Modules/ui`, `Modules/world`, `Sessions/2026-10-10 Stage 5 - BB shell fixes.md`.

## 2026-10-09 — The porch is ratified as variant A (sunday morning, 15/16); rain is DEFERRED on cost, REJECTED on treatment `[art director]`

Three porch variants judged on the eight-line rubric: A morning 15, B dusk 13, C rain 10 — A ratified, no send-back, and the same-day production check found all six must-not-lose items survive the port (the weave-shadow parallelogram carried by ADDRESS, not physics: the lifted sky-side shadow tint moved into `src/sets/porch` data as `SHADOW_TINT_SKY_LIFT`, no new shader features). B is kept as A's EVENING GRADE, not a set — its lit hall interior is the exact orange-field-beside-orange-track failure the track rule exists to prevent. The RAIN ruling is the durable one: its COST is measured trivial (one InstancedMesh, 270 five-sided cylinders, no shadow casting — inside budget with room), and it failed anyway on TREATMENT (diecast facets, puddles as flat decals, streaks grazing the tilt-shift band). Recorded so a future "add rain, it's cheap" is argued against the RIGHT axis: the gate for rain is a material decision (billboard or liquid class) and a camera reading, never a performance veto — the porch ladder ships zero live hazard zones BY LAW and rain arrives as enforced physics or as shade, never as a painted lie. See `Reference/Review 2026-10-09 porch judging.md`, `Modules/sets`, `Sessions/2026-10-09 Stage 5 - porch production set.md`.

## 2026-10-10 — Salvage discipline when an agent dies: verify the PUSH, build before you prove, scan for markers `[agent decision]`

Stage 5 lost three agents mid-task (wire faults, session deaths) and every salvage found the SAME class of lie — the tree was not what the log claimed. Three standing rules, one per found failure: **(1) Merge a worktree by its HEAD, never by a remote ref** — already recorded 2026-10-08 after the stage5-k3 stale-ref merge; the rule now includes its evidence: `git -C <worktree> rev-parse HEAD` + `git status --porcelain` FIRST, and a wire-fault salvage must verify the PUSH (a silently failed push, not a missing commit, was the cause). **(2) BUILD before you prove** — the BB-feel salvage's first proof run reused a dead session's `vite preview` squatting its port and serving a PRE-checkpoint `dist/`, failing specs against code that did not exist on disk; before believing any red, kill port squatters on the proof lane and rebuild (`npm run build`) against the commit being proved. **(3) Scan for conflict markers after every merge AND every rebase** — an agent's rebase committed the conflict markers THEMSELVES (the `playtest-pq` spec carried `<<<<<<<` as source text until a green run made it red); `git grep -n "^<<<<<<<\|^>>>>>>>"` before declaring a salvage green. The cross-referenced discipline entries stay canonical (merge-discipline 2026-10-07: resolve with markers-in-place, stamp after `git merge`; worktree-HEAD 2026-10-08): this entry adds the push-verification, build-before-push and marker-scan habits the stage-5 salvages paid for, and takes no position against them. See `Sessions/2026-10-10 Stage 5 - BB feel fixes.md`, `Sessions/2026-10-10 Stage 5 - K3 re-sweep.md`, `Sessions/2026-10-10 Stage 5 - BB shell fixes.md`.

## 2026-10-09 — The campaign is ONE flat ladder across five rooms; a room boundary is an ordinary step, never an event `[agent decision]` `[systems engineer]` `[level designer]`

Stage 4 could have grown a per-room progression — room-complete flags, room gates, a second progress table. Chose instead what the bedroom boundary already proved: the rooms of `src/world/campaign.ts` are GROUPING METADATA over the same flat ladder `nextInCampaign` walks — `CAMPAIGN_LADDER` is their concatenation, so the Next button and the level select cannot disagree by construction, and `levelUnlock` states §9.2's rule ONCE (first rung / previous-rung star / the legacy `reached` carry — the v1→v2 star/reached semantics are the Decision Log 2026-10-07 entry, unchanged: migration carries STANDING, only a finished run MINTS). Every room handoff was then a TABLE ROW, not a code path: `kitchen05 → bedroom01` (room picker), `bedroom04 → bathroom01` (bathroom pass), `bathroom04 → garden01` (garden pass), and the close-out `garden04 → garage01` with `garage04` next = null — the ladder's end is the campaign's end, 21 rungs, one rule (sandbox excepted; `Sessions/2026-10-09 Stage 4 - garage ladder`). Rejected: per-room gate state (two sources of truth that CAN disagree — the very bug class the flat ladder exists to kill) and any unlock code in the garage close-out (the diff was the row, the pars and the placement table). Cross-reference the merge round-trips that carried five branches into this table: the merge-discipline rules (Decision Log 2026-10-07) paid twice — a `checkout --ours` hunk loss and a gate-skipped merge commit, both caught by the standing rules. See [[Modules/world]], [[Modules/save]], `Sessions/2026-10-07 Stage 4 - room picker`.

## 2026-10-09 — Advice tails wear the three-way truth: CRITIQUE for what is in the build, ADD for tray stock, SILENCE for what cannot be acted on `[agent decision]` `[systems engineer]`

Playtest W round5 read a drop-only build's note — "fell off nose-first — flatten the landing or lower the lip" — as a LIE: the landing had never been placed. The Q-round `actionableKindsFor` gate had made the tail logically honest (landing was tray stock) but said it in CRITIQUE grammar. Decision: `physicsNote` takes a second set, `placedKindsFor(build)` (`src/boot.ts`, plumbed UI-side beside `actionableKindsFor` — the physics and the run hash never see either), and each advice half dresses per truth: critique wording ("flatten the landing", "lower the lip") only for a kind IN the build that ran, add wording ("add a flat landing", "add a lip") for tray stock, and DROPPED when neither; an unknown set stays permissive so shared/replay pages are unchanged. The sibling sweep of every shipped tail found the booster line already add-shaped (honest for placed and stock alike) — no other tail carries the trap. Unit-swept in `tests/unit/result.test.ts`; playtest Q's actionability gate and W's phrasing are the same law seen twice from different sides: a note may only speak about the build the player can still make. See `Modules/ui`, `Sessions/2026-10-09 Stage 4 - round5 note tails phrasing`.

## 2026-10-09 — Recording-proxy doctrine: an anomaly is a TOOLING law until the host proves a page law `[agent decision]` `[feel engineer]` `[systems engineer]`

Rounds X/Y/Z arrived with device-side horror stories — tabs dropping to about:blank, black canvases, "clicks inert on EVERY level, Enter always places", a camera that "latches after one orbit". Chose the DIFFERENTIAL over the anecdote: `tests/e2e/playtest-y-clickdiff.spec.ts`, 14 cells, fresh context per cell, the PRODUCTION preview build, and a recording proxy installed before any app code that logs every canvas listener REGISTRATION and every event the browser actually DISPATCHES. Zero cells crashed the page. The inert clicks reproduced ONLY as tooling laws — a `Input.dispatchMouseEvent` down/up with no `button` field emits ZERO page events (Chrome eats it in the browser process), and a positional-desync down/up never touches the board (probe: `pointerdown` at (0,0), target BODY) — both pinned as permanent assertions, page-innocent. Two REAL page defects fell out of the same matrix (the gesture owner attaching after the wasm await; a stuck-press guard testing `ev.target === canvas` and eating below-fold releases — it asks COORDINATES now), which is the doctrine's other half: run the differential, fix what it indicts, pin what it clears, and never chase an unverified anomaly into a page change. STANDING BAR for reopenings (playtest Z close-out): host-side `page.on('crash')` logs plus `webglcontextlost` accounting BEFORE any page-crash theory reopens (Home Deferred); the camera-latch theory was disproved 4/5 by the tester's own log, and the Z Esc-Esc "never homed" observation has no page-side repro (the recenter is proven in `tests/e2e/camera-torture.spec.ts`) and stays unfiled against the page unless the crash-log bar is met. See `Sessions/2026-10-09 Stage 4 - click differential`, `Sessions/2026-10-09 Playtest Z round7`.

## 2026-10-09 — Deaths need a CLOCK and a PLACE: the ramp angle is the clustering engine — move the clock, never the lesson `[agent decision]` `[level designer]`

Playtest K/M (L02) and U (bedroom02) could not learn from walls where every wrong build died at the same instant with nothing on screen to interpret (L02: nine builds, all ~2.2 s; B2: seven fallers, all 2.98–3.25 s, 0.4–0.9 m PAST the cup). The headless sweeps (~25 000 runs L02, ~110 B2) produced the laws: the death clock = ramp-end arrival + flight + a constant ~0.4 s floor fall, and a shallow crawl ramp pays that approach for EVERY build right or wrong — the ramp ANGLE is the clustering engine (−12° compressed nine builds into 2.2–2.4 s; L02's −29° chute and B2's −22° spread the classes). Separation therefore comes from WHERE a wrong build can die — a build can only die early where the rail it fails to cross is NEAR the ramp end — and one flat-socket void can never separate a lip catapult from a drop catch (shared flight-distance window), so the CLOCK moves, not the lesson. Shipped: L02 as a −29°/0.16 m chute with the 0.11 m reach law and 0.10/0.125 m drop steps — three visible families (0.87–0.97 rail-end / 1.05–1.18 void / 1.23–1.28 off-the-drop), 12/12 whole-tray orders finish, NO wrong build finishes; bedroom02 re-authored on ONE deck plane (pillow sink vs plateau step, both routes finish ANCHORED, every death lands by 2.6 s, ask #2b retired for the rung). Rejected: death captions over an undifferentiated cluster (a louder note over the same invisible death) and geometry-only fixes (law 3 proves they cannot separate the catch pair). Consequence for every future ladder, including stage 5's porch: the fail-family sweep is part of AUTHORING, not a post-playtest rescue — wrong builds must say WHAT they got wrong by WHEN and WHERE they die. See `Sessions/2026-10-09 Stage 4 - L02 fail-timing`, `Sessions/2026-01-18 Stage 4 - B2 learnability.md` (log misdated by an agent clock fault — the pass ran in stage 4), [[Concepts/Levels]].

## 2026-10-08 — A garden shadow is a READING, not a hazard; its cool is a rig dial, `fillShadeDepth` `[agent decision]` `[level designer]` `[technical artist]`

The garden's sun-bars rung could have shipped the shade bars as gameplay (a grip zone wearing a shadow decal). Chose the opposite law, stated three ways: PHYSICS — `garden01` has NO live zone and the set's `HAZARDS` list is empty BY LAW; shade never touches the grip field, the solver reads light never where the light falls; GRAMMAR — the callout says it on first sight, `PROP_CALLOUTS['prop:shadowBars']`: "Cool strips are the sun's shadow — same stone, same grip. Read them, never fear them." (`src/sets/garden/index.ts`); the ladder's grip lessons stay where they were, in FILMS (wet patch, oil stain) — shadow ≠ slippery, and rung 01 is the campaign's first rung whose lesson is a pure CAMERA reading. What actually changed the pixels is the round-1 send-back knob, `fillShadeDepth` (`uFillShadeDepth`, an option on `createLightingRig`): the fill term dims IN PROPORTION TO SHADOW COVERAGE, so an open sky replaces the sun it blocked at full gain — the sweep proved no global `fillStrength` darkens shadowed stone without dragging every frame's median (lit pixels are BIT-identical at any depth). It is a first-class dial for every future set (garden production review carry-forward 5), not a garden patch. See [[Modules/render]], [[Modules/sets]], `Sessions/2026-10-08 Stage 4 - garden ladder`.

## 2026-10-09 — Build mode gets a RESTRICTED orbit; the fixed view is amended out of the §9.3 reading, and the canvas click is no longer a press-move-release `[agent decision] `[feel engineer]`

Playtest Q (fresh eyes, round 2) built four levels "from ONE FIXED ANGLE, no orbit at all" and reported the two halves of the same fault: the fixed build framing HID the goal — "the cup was invisible/guessable on 3 of 5 kitchen levels" (item 7) — and the canvas's one gesture was wrong: "left-drag on canvas PLACES a piece (press+move+release counts as click) — no way to orbit; right-drag does nothing" (item 6). The §9.3 tutorial brief ("a hand shows drag, snap, launch") had been read ever since the shell-truth pass as "build view stays fixed to protect placement clarity" — but that stance was never recorded here, only practised, and the playtest ledger now argues the opposite: clarity came from the ring + ghost + hover-aim, and the fixed angle is what made players guess. Decision, deliberately RESTRICTED (a free OrbControls rig would re-open every framing proof and lets a stranger frame the table under its own cloth):

- **One degree of turn.** Right-drag (or Space+drag) = damped yaw about the vertical through the framing centre, clamped ±60° to the table's sensible hemisphere (the eye never crosses the splashback plane at −z, and yaw-only can never dip under the table); NO zoom (the run camera and replay own push-in; `frameCamera`'s solved distance is untouched); a left-drag past the threshold PANS the framing in its own screen plane, clamped to 0.4 × the span. Damping is the run camera's exponential family, τ 0.15 s. `src/camera/build-camera.ts`, `Modules/camera`.
- **Explicit click-vs-drag disambiguation** — the `CANVAS_DRAG_PX` rule: a press released within 6 CSS px PLACES at the aimed socket; a press that TRAVELS is a VIEW gesture and places NOTHING. One gesture owner (`attachBuildView`), two verbs (the builder's `aimAt`/`clickPlaceAt`), and Q's misfire-place becomes structurally impossible instead of politely discouraged. Proof: `tests/e2e/build-view.spec.ts` (orbit moves the camera and places nothing; pan places nothing; a clean click places; Space+drag orbits) on the BUILT page through `__gwCameraPose`/`__gwBuildView`.
- **Compatibility held the hard way:** `frameCamera` gained an OPTIONAL view argument and at zero yaw/pan its pose composition is bit-identical to the old direct set (asserted), so every visual baseline, the goal-framing/end-hold proofs and every run hash stand exactly where they were (the camera layer feeds no physics; the determinism spec stayed green). Alternatives rejected: wheel-zoom (fights the framing proofs, playtest B's scroll trap), full 3-DOF orbit (framing proofs become suggestions), keeping left-drag = place with a modifier-only view (Q never found modifiers; the RIGHT button and a visible hint line `Look: right-drag` are discoverable).

Same playtest, same ledger, two copy rulings the evidence forced: failure-note ADVICE may now name only kinds the player can ACT on now — placed OR still stocked in the tray (`actionableKindsFor`; Q's K2: "flatten the landing" with no landing reachable) — and the first `flipped fit` of a session says its WHY once on the same status line, "it rides backwards; fine for a coaster, not for a launch (press R again to flip back)" — honest about the ride and about R being its own undo. See `Sessions/2026-10-09 Stage 4 - build view controls`, `Modules/camera`, `Modules/ui`.

## 2026-10-08 — Pixel-audit tools decode via pngjs, never a hand-rolled chunk loop; every new audit tool gets a watchdog smoke before any batch `[agent decision] `[tools]`

Three art-audit scripts (`tint_audit.mjs`, `census.mjs`, `tint2.mjs`) appeared to hang during the garage round — they were infinite loops, not slowness: their PNG chunk walker lacked the loop-tail advance (`off += 12 + len`), so it spun forever inside the chunk list from IHDR onward. `tools/histogram.mjs` had always carried the advance and was fine; the bug class was copy-paste of the walker without the tail line. Chosen fix for the surviving tool: `tools/census.mjs` decodes with `pngjs` (already a devDependency, proven) instead of repairing the hand-rolled walker — the repo's own test stack uses it, so one less bespoke parser to get wrong. Standing hygiene (was also how the bug hid): any new tool touching images gets ONE smoke run under a watchdog (`(node tool.png & P=$!; sleep 20; kill $P …)`, macOS has no `timeout`) on a single real frame before being pointed at a batch. See `tools/census.mjs` header, `tools/histogram.mjs`.

## 2026-10-07 — Campaign unlocks persist as stars; the v1 save migrates as `reached`, never as minted stars `[agent decision]` `[systems engineer]`

Stage 4's level select needed persisted unlocks, and v1 saves recorded NONE — progress lived only in the in-session `gateNext`. Two ways to carry an old player's kitchen: DERIVE unlocks from the v1 build-autosaves AT READ TIME forever (rejected: `rememberBuild` fires on any edit, so one placed piece in `kitchen05` would permanently read as opening the bedroom — unlocks would be minted by touching, not earned), or MIGRATE ONCE (chosen): save v2 adds `progress { stars, reached }`; the terminal run records `stars` (best-per-level, failures record nothing), and `MIGRATIONS[1]` freezes each v1 build key into `reached` — a level whose autosave existed is one the player STOOD in, so it does not relock (a kitchen finisher must not wake up behind `kitchen01`), while a kitchen-only save's bedrooms gain no mark and stay gated on `kitchen05`'s earned star. `reached` receives NO writes after the migrade: the unlock rule (`levelUnlock`, `src/world/campaign.ts`, the single statement) reads first-rung / previous-rung-star / legacy-reached, and the star line stays §9.2's — a star is minted only by a FINISHED run (any build — the `?build=par` rig finishes real physics; the unlock e2e therefore builds `kitchen05` piece-by-piece rather than trust a rig), never by a URL param and never by migration minting display stars old bytes cannot justify. Caveat recorded, not hidden: `reached` = any v1 builds key, so a tinkerer who `?level=`-visited a bedroom rung keeps THAT rung open (visited ≠ starred, no cascade). See `Modules/save`, `Modules/ui`, `Sessions/2026-10-07 Stage 4 - room picker`.

## 2026-10-07 — 60 fps with post ON: CI records-and-defers on software rasterizers `[agent decision]` `[systems engineer]`

The tier ceilings and keep-up gates calibrated on the desktop box went red on the ubuntu-latest runner — the numbers confessed the runner has no GPU: GitHub's Linux CI renders headless Chromium with SwiftShader (software GL), where the high tier measured a 351.00 ms median against the 100 ms ceiling and the rendered loop fell to keep-up 0.63. **CI cannot prove 60 fps with post ON on software rasterizers, and a ceiling inflated until it passes on a software rasterizer catches no render-cost regression either** — inflating ~3.5x, expected-fail on Linux, or dropping the gate were all rejected as louder lies. Chosen: `tests/e2e/perf-stage3.spec.ts` detects the renderer (`UNMASKED_RENDERER_WEBGL`; `SOFTWARE_RENDERER_RE` matches SwiftShader/llvmpipe/Mesa-llvmpipe; `GQA_FORCE_SOFTWARE_GL=1` simulates the branch); on software GL the post-ON tier/keep-up measurements still run and their tables attach as artefacts, but ceilings are reported via `testInfo.annotations` as RECORDED (software GL — deferred to hardware GPU) and pass; on hardware GL the per-platform ceiling table (`HARDWARE_TIER_CEILINGS_MS`, darwin row calibrated) is hard, and the post-OFF stage-2 stepping gates stay hard on every runner. On darwin the spec launches with `--use-angle=metal` so the local box genuinely gates the hardware path (recorded: tiers 2.5/2.1/1.8 ms, rendered-loop 16.70 ms median, 60 fps line hard-asserted). **Software GL records-and-defers; hardware measurement is a standing open item — Home Deferred** (stage-6 performance pass, or the day a hardware-GPU runner exists). See [[Concepts/Performance]], `Sessions/2026-10-06 Stage 3 - review fixes`.

## 2026-10-07 — The shipped page keeps its URL debug affordances; they are recorded, not stripped `[agent decision]` `[systems engineer]`

The stage-3 adversarial review flagged `?level=`, `?build=par` and `?launch=1` on the shipped page as ladder bypasses. Options: strip them outside `import.meta.env.DEV`, or record them. Chose RECORD — the entire e2e rig (`visual`, `perf-stage3`, `result`, `shell-truth`, `loop`, `determinism`) drives the PRODUCTION build (`vite preview`, `DEV=false`) through exactly these params, so a DEV-gate would blind the whole suite while shipping nothing new to players; a test-only build flavour would fork what is tested from what ships. They are DEBUG affordances and stay documented as such: `?level=` selects any registered level (default `kitchen01`, unknown ids fall back), `?build=par` re-mounts the reference build, `?launch=1` releases at first ready. None of them mints progress: the ladder gates what the player has EARNED (`gateNext` shows Next only on ≥ 1 star), not what a URL can ADDRESS — no param forges a star, a save, or a share. See `Modules/src`.

## 2026-10-07 — CI-truth pass: printed numbers became gates, and no comparison can be skipped away `[agent decision]` `[systems engineer]`

Four honesty fixes from the stage-3 adversarial review, one pattern: a number printed where it could fail is a gate; a number that only prints is a rumour. (1) `tests/e2e/visual.spec.ts` ran baseline + ratified-render comparison in ONE test body whose platform-missing `test.skip` aborted everything after it — on Linux (only `tests/visual/darwin/` committed) the platform-free exploration diff the header promised to run everywhere never executed. Baseline and exploration comparisons are now SEPARATE tests per shot, the exploration test contains no skip path, and the `GQA_BASELINE_DIR` env override proves it by simulating a baseline-less platform (baseline tests SKIP, exploration tests still RUN). (2) `tests/e2e/determinism.spec.ts` node↔browser equality is HARD-ASSERTED — the §2.2 "reported, not asserted until known" allowance is retired because every run since the stage-2 gate has been MATCH/`verified`; the wiring stays spawn-free (the spec's own Node process IS the node side, same `replayRun` import the tools use; the browser recomputes independently against the hash embedded in the share fragment), and a mismatch on any runner is a real cross-engine finding, failed loudly, never skipped. (3) perf measurement B's per-tier medians got documented generous ceilings (`TIER_CEILING_MS` — ≈ 3.5× the clean M5 SwiftShader medians AND ≥ 1.5× the worst full-suite-contention row QA ever recorded, i.e. high 100 / medium 70 / low 55 ms) that fail the job on regression, with the human-readable table attached to the HTML report as artefact + annotation. (4) The post stack leaked the grade pass's GPU objects per placement (`PostStack.dispose()` omitted `stages.grade`); disposal is completed and gated by a 20-cycle build→dispose `renderer.info` test (`tests/e2e/post-dispose.spec.ts` over the new harness `__postCycle` seam; pre-fix programs 8→9 and pinned, post-fix 8→8). See `Modules/dev`, `Modules/render`, `Modules/replay`, `Sessions/2026-10-06 Stage 3 - review fixes`.

## 2026-10-07 — Visual-regression baselines are platform-suffixed directories with a loud skip `[agent decision]` `[qa engineer]`

Stage-3 baselines (three canonical kitchen-set shots + the game shell at kitchen01 idle) commit under `tests/visual/<platform>/` — `tests/visual/darwin/` from this macOS box. A runner with no directory for its platform **skips loudly** (visible SKIPPED, skip message names the platform and the remedy) rather than passing: CI can never be falsely green on pixels it has never been compared against. Alternatives rejected: (a) generate-in-CI on first run behind a flag — lets whatever the runner's GL happens to emit define "correct" with no human diff of the committed PNGs; (b) one cross-platform baseline — SwiftShader/ANGLE differ across OSes by more than the antialiasing tolerance (0.1 % gate), so it would be falsely red. Lighting up a platform is one deliberate `GQA_UPDATE_BASELINES=1` run there plus committing the PNGs. The platform-free cross-check that runs everywhere: the harness output vs the ratified `docs/explorations/kitchen-set/` renders must be within 2 % (measured 0.0000 %, exact). RECONCILED 2026-10-07 (stage-3 review): the cross-check DID NOT actually run on Linux while baseline + comparison shared one test body — the baseline `test.skip` aborted everything after it; the comparisons are now separate tests per shot (the exploration test has no skip path) and `GQA_BASELINE_DIR` simulates a baseline-less platform to prove it — see `Sessions/2026-10-06 Stage 3 - review fixes`. Dev-only deps `pixelmatch`/`pngjs` stay test-side; the §2.8 runtime-deps gate is not engaged. See `Sessions/2026-10-05 Stage 3 - qa visual + perf`, `tests/e2e/visual.spec.ts` header.

## 2026-10-07 — The kitchen bowl is sized to its rim sockets, not to the tile's silhouette `[agent decision]` `[environment artist]`

The chosen reference's bowl rim centreline sits at 0.101 m; `Concepts/Levels` says the artist's mesh is built TO the L03 socket numbers (radius 0.12, 120° sweep, flat sockets on the kit's tangent frame) so the day steering lands, seating a bank piece between `bowl.in`/`bowl.out` is a data edit. Chose: scale the tile-B lathe profile uniformly (shape unchanged) until the rim crown's mid-wall circle lands exactly on 0.12 — an ~18 % wider bowl in every canonical frame — over faking sockets off the smaller bowl (the mesh then does not pass through the socket poses, which is the convention's whole point) or growing only the rim (breaks the reference profile, rubric line 1). The socket tangent sign reproduces the level-derived L03 poses frame-for-frame (`tests/unit/kitchen-set.test.ts`); the hero's rim car keeps the reference's facing (parked, not committed). See `Modules/sets-kitchen`, `Sessions/2026-10-07 Stage 3 - kitchen set.md`.

## 2026-10-07 — Stage 3 UI plumbing: par-time ceil, star line readings, card framing `[agent decision]` `[systems engineer]`

Three small contracts the stage-3 brief left open. (1) **Par times are the measured reference-build finish ceil’d to 0.05 s** (`scripts/gen-pars.mjs`), not the raw float: a par of exactly 3.0083 s would fail a 3.0084 s run on tick jitter across machines, while the ceil never loosens the line by more than one twenty-second of a second; the alternatives considered — exact replay time (brittle) and a designer hand-rounded number (defeats “regenerated by script”). `npm run pars -- --check` is the drift gate, and a reference build that no longer finishes is a hard error, not a par. (2) **“Finish / under par pieces / under par time” reads as three independent stars** (`starsFor`): each line contributes one star whether or not the others landed, so a fast-but-chunky run is ★★, matching §1’s comma list literally; the cumulative alternative silently made the time star unreachable for budget-overshoot runs. Comparisons are `<=` — matching the reference build’s own pace is good enough. (3) **The share card frames the build, not the kitchen**: `src/dev/cameras.ts`’s hero rig is a fixed provisional framing of the bowl turn, so `heroCameraFor` (src/share/card.ts) keeps that rig’s attitude, fov and three-quarter direction and scales the distance to the build’s bounding box — the same framing rule applied to the thing actually being shared; the alternatives (reuse the fixed rig → cards of off-kitchen builds crop the track; per-level card cameras → a camera table to maintain that nothing else reads). Also recorded: the hazard physics-note line and the `hazardsTouched` field ship before any hazard exists in `World.observe`, deliberately — the note gains a status without ever claiming a hazard it cannot evidence (count stays 0, line unreachable until a prop can set it). See `Modules/ui`, `Modules/world`, `Modules/share`.

## 2026-10-06 — The page pays for exactly the set it mounts: lazy per-set builder imports `[agent decision]` `[systems engineer]`

By the garage row, `src/sets/index.ts` imported all five set builders STATICALLY, so every page load evaluated every set's geometry module while exactly ONE set ever mounts per boot — the boot-heavy campaign e2es measured roughly 2x boot time once the garage row landed. Chose: the registration's `build` becomes async and DYNAMICALLY imports its set module, boot evaluates only the mounted set's builder; the token rows and placement tables stay STATIC so the warm first frame and the `?post=on` grade read them before the set module is even fetched, and the one caller (`buildGameSet` in `src/boot.ts`) simply awaits — the mount rides boot's existing async line, no new waterfall. Rejected: one dynamic chunk for ALL of `src/sets` (first paint still pays the full set payload) and keeping it eager with a CI budget bump (pays bytes forever to avoid one `await`). The same CI-truth pass fixed the two campaign specs honestly rather than inflating budgets: the spec states its own 60 s waits, and the camera-follow read POLLS `__gwCameraPose` instead of trusting a fixed 600 ms wall window. See `Modules/sets`, `Modules/src`, `Modules/camera`.

## 2026-10-06 — Post stack: one full-frame draw when possible; stages drop before resolution, resolution never `[agent decision]` `[technical artist]`

The composer chain is RenderPass → tilt-shift → soft bloom → grade(+vignette, terminal), and every design choice was driven by the software-GL frame-cost table in `Sessions/2026-10-06 Stage 3 - post stack and backlog.md`: the tilt-shift's separable pair runs in quarter-res internal buffers composited back by circle of confusion (the naive full-frame pair cost ~60 ms/frame where this costs ~8); the vignette is a term of the grade pass and the grade carries the sRGB encode, retiring two full-frame draws a textbook chain would spend (vignette pass + OutputPass); bloom is a bespoke quarter-res one-Pass pipeline clamped in code to `BLOOM_SOFT_CEILING` 0.22, not `UnrealBloomPass` (its mip pyramid is more machine than "soft" and more cost than the set can lend). The quality ladder drops bloom → tilt-shift and never resolution. Alternatives rejected: UnrealBloomPass (cost), half-res tilt (still ~2× the quarter-res pair at equal visible radius — the defocus is by definition softer than the buffer's texel step), keeping the OutputPass (one more 2.9 MP read for a conversion the last stage can fold). Post stays OFF by default everywhere — harness URLs and the shipped page without `?post=on` render the byte-stable stage-2 path. See `Modules/render`.

## 2026-10-06 — Shadow-dither budget: snap half-covered fragments to a world-space weave, biased to shadow `[agent decision]` `[technical artist]`

The stage-1 review found the painterly ramp's speckle failure repeating in Three's PCF (a 5-tap Vogel disc rotated by per-pixel interleaved-gradient noise: partial coverage re-rolls per pixel). The fix is a `uShadowDither` budget in `ToonMaterial`: most of a half-covered fragment's decision goes to a hard call biased with a fine world-space weave (~2 mm cells, so the boundary lives in world space and survives camera motion), a minority keeps the raw blend. Two iterations mattered: snapping at 50 % coverage with a bias toward LIT smeared bright patches through the tap's floor penumbra, so the snap is biased to SHADOW (full light needs ≥ 70 % coverage) and the rig's `shadow.normalBias` went to 0.006 so curved shells stop half-covering themselves. Alternatives rejected: raw IGN left in (the speckle AD rejected), VSM (new shadow pipeline, cost), blurring shadows in post (would gray the tinted-shadow contract). The budget stays a parameter — 0 is a hard stable edge, 1 is raw Three. See `Modules/render`.

## 2026-10-06 — Loop: a speed window BY DESIGN, `[2.30 R, +∞)`; the droop tether is declared the modelled up-stop `[agent decision]` `[feel engineer]`

The stage-2 carry-in (up-stop wheels / "size the loop for the collider
variant") resolved without new physics. A full `loopTry` release-height
scan (shipped car + `ROLL_COEF`, 0.1 R steps to 6 R, both variants —
table in [[Modules/physics]]) shows an identical pattern: floor at 2.30 R
(the shipped bisected gate), then completes everywhere above it apart from
bounce-phase dip rows, with NO ceiling — because the suspension's droop
tether (tension-capable strut force, added in the loop-geometry round)
already expresses an up-stop wheel in the one place the solver sees
forces. Options weighed: (a) model a bounded-capacity up-stop so a real
physical ceiling (~2.5 R ideal) exists — rejected for the slice: it moves
shipped hashes to buy a fidelity the 5-level vertical slice never drives
past the gate, and the knob (`droopMaxForce`) already exists if stage 5+
playtests want it; (b) leave it silent — rejected, the brief demands the
window be stated. Chose (c): document the window as design, keep
`LOOP_RADIUS = 0.10` (still serves the shipped car's 1.25× passage rule),
and record the collider variant as PROVEN for the loop piece.

## 2026-10-06 — Hazard grip acts on the friction channels the solver HAS, and the lateral-slip claim is stated as measured `[agent decision]` `[feel engineer]`

Ask #2a (the wet patch's "halves grip") could be wired three ways: a live
per-region collider-friction edit, a per-piece `friction` param, or a
per-wheel-contact grip query. Chose the contact query
(`GripField`/`WheelSupport`): it is per-WHEEL (the brief's word), it is
trivially hash-neutral (uniform grip is bit-identical — not approximately,
`x * 1 === x`), and live friction edits on merged hulls would
re-tune-requiring everywhere. Consumers: rolling-resistance magnitude
(mean grip — the kit's RR law IS an effective μ, so wet plastic is LOW
DRAG and the patch reads faster: L04 ground 2.350 → 2.292 s), the per-wheel
drag SHARING (a straddled patch yaws the car toward the dry side — the
honest lateral effect: slip 2.38° → 3.98°), the self-aligning budget, and
variant a's live tyre μ. Rejected: inventing a per-mount lateral scrub
force to make "slides wide" real — that is exactly the lateral-model family
the loop work rejected ([[Modules/physics]]), and on a U-channel the rails
make it moot anyway (kinematic constraint: the wall carries lateral demand
grip-independently). The design failure the level card wanted ("sliding
wide") therefore stays gated behind ask #1 (drivable yaw), stated in
[[Modules/hazards]] rather than faked in a test.

## 2026-10-06 — KITCHEN 04's wet patch re-centred onto the ground line's deck `[agent decision]` `[feel engineer]` (placement fix; flagged for LD review)

With the zone hook live, the authored centre (the PAR rig's landing level
run) put the patch ON the par line's own deck — bit-diverging the par
replay and breaking the file's own "grip-independent par" contract within
the same file. Measured both ways; moved the centre to the GROUND build's
straight seam (the decked sink's middle), which is what the level's prose
always described. Alternatives: leave it (par grip-independence becomes
false in fact, not just in prose) or move the ground line (bigger LD
diff). One function, comments updated, both lines' claims now measured.

## 2026-10-06 — Kitchen rungs with an undrivable yaw half ship as done-but-BLOCKED-rung, not blocked levels `[agent decision]` `[level designer]`

L02 (curve choice) and L03 (bowl bank line) were specced around mid-run yaw geometry, and no yaw piece is drivable by either shipped car at any swept radius/speed/bank (probe table in `Sessions/2026-10-06 Stage 3 - level ladder`). Options: mark the levels BLOCKED (starves stage 3 of content and hides the one-line fix), or fake drivability with a par build that fails (forbidden by the playability gate). Chose: ship both levels with par lines that finish (proved headless), keep the yaw geometry as fixture run-out past the cup (the feel track's own precedent), and mark the RUNG BLOCKED with a one-paragraph piece request (`Concepts/Levels` ask #1). Alternatives rejected: par builds containing the yaw piece (test-red = ship-red, and it would be honest only by being useless), and a steering hack inside the level files (physics is not the level designer's file).

## 2026-10-06 — Levels carry `tray` + `parBuild`; `budget` = tray total; the contract `Level` is not touched `[agent decision]` `[level designer]`

The ladder needs per-kind budgets and a replayable reference build, and `Level` (`src/world/level.ts`) has neither seam and is not the level designer's file. Chose: `KitchenLevel extends Level` in `src/world/levels/kitchen01.level.ts` with `tray` (its total IS `budget`, so tray contents = budget by construction), `fixtures`, and `parBuild()` also wired as `placeholderBuild()` so share/replay/the builder see zero new seams; the pars script will read the same fields. Alternative rejected: editing `Level` directly (would collide with the Systems Engineer's file set mid-stage, and the extension is strictly additive).

## 2026-10-06 — 60 fps with post: claimed with software-GL caveats, hardware re-measure deferred to QA `[technical artist]`

The stage-3 brief line — tile-B scene ≥59 fps with post ON on this machine — is reported honestly rather than asserted: the headless browser is SwiftShader (confirmed via `WEBGL_debug_renderer_info`), and under a software rasteriser the *scene* alone is over budget at canonical 1600×900 even with post off. Measured with the harness `perf=N` hook (blocking readPixels timing, not submission timestamps — `gl.finish()` under-reports by ~70×): post costs are grade ≈ +1–3 ms, tilt-shift ≈ +8, bloom ≈ +12 at 1600×900 establishing, and at game resolution 960×540 the high tier totals ≈ 25 ms blocking with the rAF loop still vsync-pinned through medium. The stage-2 game-shell keep-up evidence (median 16.70, sim/wall 1.00) remains valid for the shipped default path (post off; opt-in by URL). QA should re-measure on a hardware GPU alongside the standing stage-2 hardware caveat; if the budget says drop, medium is the fallback tier. See `Sessions/2026-10-06 Stage 3 - post stack and backlog.md`.

## 2026-10-04 — Chord slabs are not the reason the roll test lied `[agent decision]` `[systems engineer]`

The stage-2 brief asked for a test in which a sphere rolls **≥ 3× farther** down a 5° kit incline than down the same incline rebuilt from 12 chord slabs, on the strength of the entry below ("colliders"). It is not true, and the test in `tests/unit/track-rolling.test.ts` says what is instead: kit 1.83 m vs 12-chord slabs **2.15 m** (the slabs win slightly, because a chord cuts a fraction of a millimetre *inside* the blend and so drops the ball fractionally further), and the stage-1 car on the same two decks 3.675 m vs 3.590 m. Reason: 12 chords spread over ≤ 5° of pitch deviate from the swept surface by well under a millimetre, and a seam a rigid body never has to cross cannot decelerate it. What *is* true and now gated: a sphere on a kit deck covers 95 % of what it covers on a single perfect cuboid (0.579 m vs 0.611 m), the collider surface never deviates from the centreline further than the mesh does, and 12 chords of a kit **loop** cut 2.7 mm into the running surface where the kit's hulls cut 0.44 mm (6×) — which is why invariant 2's loop-threshold test must run on kit geometry. Consequence for the Feel Engineer: the 2.5× false deceleration in the entry below lived in the suspension's contact normals at slab seams, not in the surface, so re-tuning `ROLL_COEF` against kit geometry is the open item, not "smoother colliders". Alternatives considered and rejected: quietly asserting a weaker ratio (hides nothing useful), and asserting the 3× against a strawman slab rig (a lie). See `Modules/track`.

## 2026-10-04 — Track kit shape: arc segments, convex-part profile, merged hulls, Δv launchers `[agent decision]` `[systems engineer]`

Four choices the [[Concepts/Track Kit|Track Kit]] contract left open, taken in the code and elaborated back into its interface section: (1) centrelines are **piecewise arcs** (constant pitch/yaw rate per segment) rather than centripetal Catmull-Rom — the contract allowed either; arcs give exact arc length, an exact analytic loop (invariant 2 holds to 1e-17) and parallel transport for free, and cost nothing because every pitch change in the kit is a blend anyway. (2) The one U-channel profile is stored as a **union of convex parts** (deck, two rails, two lips) instead of one concave polygon, because a hull of a concave ring is a solid slab that would bury the channel. (3) A collider segment is the hull of **consecutive** rings, merged while the accumulated turn stays under two degrees — the alternatives were a seam every 5 cm (the deck problem we are solving) or one box per chord (the geometry we are not doing again). (4) `applyImpulse` expresses launcher `power` as a **Δv** read against the target body's own mass, so kit code stays unit-blind; and `toColliderDescs` takes a length `scale` parameter, which is the only way to honour both halves of the contract's "physics converts at collider-build time" and "kit code never sees sim units". Gap pieces (`drop`, `gapLip`) carry their empty span as `solid: false` data rather than being two pieces, which keeps every joint a socket joint. Details: `Modules/track`, `Sessions/2026-10-04 Stage 2 - track kit.md`.


## 2026-10-04 — The §7.1 roll metric is a drop-**ramp** metric `[feel engineer]` (Director recording)

The honest rig revealed the bible line was ambiguous: vertical free-drop onto flat deck measures **0.00 m** for *any* car (no horizontal momentum) — stage-1's 0.28/0.61 m were launch-velocity and buried-car-creep artifacts. The metric is now precisely: release from rest, 30 cm of ramp drop, flat deck, measure wheel-centre travel after touchdown. Also landed: variant-a's wheels now have real colliders (they silently never hit the track — a collision-group bug; fixing it moved its peak speed 2.66→12.57 m/s), `quant()` NaN/∞ now poisons the hash instead of mapping to zero. Open with kit geometry: `ROLL_COEF` re-tune (currently overshoots 2.5 m by 2.3–3.4×), loop-landing sink.

## 2026-10-04 — Stage 1 references ratified: kitchen tile B, car-a, ramp B `[art director]` (Director recording)

Full scores and keeps in `Reference/Review 2026-10-04 Stage 1 explorations.md`; references written into `Concepts/Art Bible` §Chosen references. Tile B wins the kitchen (14/15/13; the only tile with no broken frame); tile A failed its floor frame with a focal zero (floating ribbon, crushed-foil bowl). One send-back of two used: the tile-B integration re-render (grading to A's value range, bowl-interior glaze, wet patch as film not cutout, mug pull-back, brighter tyres) — that becomes the permanent reference and the first task of stage 3. Car-a "sedan blocky" wins (only silhouette naming its type at 200 px); ramp variant B (three hard steps) wins; painterly rejected for dither speckle.

## 2026-10-04 — Tilt-shift is a blocking dependency `[art director]`

Rubric line 3 (scale cues) is capped for every scene until tilt-shift post lands — the signature look cannot be judged honestly without it. Technical Artist delivers it in stage 3 before any render is *final* (not merely provisional); until then renders are labelled provisional in reviews.

## 2026-10-04 — Material system backlog `[art director]` (from tile C's audit + review)

For the Technical Artist, in priority order: grain frequency per surface size (streaks on big floors); accent reachable in the fill light (fill gain not hardcoded); stain/decal capability (mug ring, wet patch as film); ceramic saturation lift; shadow-dither budget at grazing angles; a minimum warm-brown lightness floor for tyres and contact parts; **grain belongs to painted-wood and toy classes only** — speckle on ceramic reads as lens dirt. The backface-normal fix already landed.

## 2026-10-04 — Car palette rule `[art director]`

Car hues stay Okabe–Ito-derived (colorblind-safe) **and must not read orange through the kitchen grading** — kitchen-c drifted to tomato under the gold key. Car-a's blue is ratified; trim variants must pass a re-render check through the kitchen grade, not just a palette check.

## 2026-10-04 — Car physics: raycast wheels win; jointed wheels rejected on evidence `[agent decision]` (Feel Engineer, merged by Director)

Both variants DNF the provisional feel track; raycast wheels beat wheel-colliders on every metric (peak speed 7.25 m/s ≈ free-fall bound; colliders 2.66 m/s) and revolute-joint support showed three reproducible failure modes in Rapier 0.21 @ 120 Hz / SIM_SCALE 10 (static-friction brake-lock, position-joint sink→plough, pitch↔spin energy drain). Stage 2 builds on **raycast wheels with contact-normal spring support** (support force follows the *track* normal, not chassis-up; bodies must have `canSleep=false`). Alternatives: keep jointed wheels (measured worse), raycast with chassis-up support (drag cancels gravity on slopes). See `Modules/physics.md`.

**Correction at stage-1 review (reviewer finding, 2026-10-04):** the "wheel colliders" variant never gave its wheels collision — so jointed support was measured honestly, but a *proper wheel-collider model* was not. And since both variants DNF'd, no loop/landing data backs the choice. Carried into stage 2 as a standing gate: the track kit must produce loop/landing data for both a corrected wheel-collider variant **and** the raycast base before any tuning is locked; if the corrected variant wins on the real track, stage 2 switches base (recorded then, not silently).

## 2026-10-04 — Colliders: no chord-slab trimeshes for rolling surfaces `[agent decision]` (Feel Engineer, merged by Director)

The bake-off's chord-slab track geometry (boxes stitched along a spline) produced seam-stitching deceleration ~2.5× the tuned rolling-resistance target and ploughed the chassis into the deck on slopes — it, not the car, caused both misses (roll 0.61 m vs ≈2.5 m target; loop unmeasurable). Stage-2 track colliders will be generated smooth from the same spline as the mesh (compound convexs or swept channel hulls), which the brief already demands; the bake-off numbers are baseline, not ceiling.

## 2026-10-07 — Kitchen set is PLACED per level, not re-modelled `[agent decision]` (Systems Engineer)

The L04 tap↔wet-patch disconnect looked like a geometry bug (EA measured the spout ~1.55 cm off the deck) but was a SPACE bug: the sink lives in the level's chain space, the tap in the set's canonical layout, and nothing had ever mapped one to the other. Chose a per-level MOUNT table (`src/world/setPlacement.ts`) — standard levels translate the counter under the timed rail; kitchen04 yaws so `TAP.drip` maps exactly onto the authored zone on the ground-build seam deck. Rejected alternatives: editing the tap geometry (teleports a prop ~1.9 m off the counter to chase one anchor) and moving the zone data (comes off the deck the ground line drives — would silently break the Feel Engineer's measured bite). All six kitchen par hashes unchanged (pinned in `tests/unit/set-wiring.test.ts`); the physics-neutrality proof is browser-hash-equals-headless-hash in `tests/e2e/set-wiring.spec.ts`.

## 2026-10-04 — SIM_SCALE = 10 `[agent decision]` (Feel Engineer)

Sim lengths ×10, gravity ×10, mass ×1000; time unchanged. Rapier's absolute tolerances bite a 7.5 cm toy 13× harder than their design scale. The one true record is `Concepts/Feel` §Physics scale factor; everything else references it.

## 2026-10-04 — ToonMaterial backface fix `[technical artist]` (from kitchen tile C)

`gl_FrontFacing` normals were never flipped, so two-sided lathe forms (the cereal bowl!) shaded their inner wall in the darkest ramp band — "grey mud" in every ramp render. One-line fix with before/after renders in `docs/explorations/`. Lesson recorded: *system tiles catch what prop tiles hide.*

## 2026-10-04 — livedocs: never put PNG paths in backticks `[agent decision]` (Director)

livedocs tries to anchor any backticked path, then crashes (`UnicodeDecodeError`) reading binary files, blocking commits that touch `src/render` whenever a note backticks a `.png`. Convention: render paths in notes are written *without* backticks (or under `docs/explorations/` in prose). `livedocs coverage` will show them unresolved — expected.

## 2026-10-04 — Kitchen palette seeds: gold #EFAF4B dominant, mint #5FB49C accent, track #FF7A1A constant `[technical artist]`

Derived by pure hex math in `src/render/tokens.ts` (no three import → identical in node and browser). Shadow fill is shifted ~12–22 % toward the accent via token math so shade reads cool against warm sun. Final confirmation awaits the stage-1 style-tile choice.

## 2026-10-03 — npm over pnpm `[agent decision]` (Director)

Chose npm for install/lockfile. Alternative: pnpm (faster, stricter node_modules). Reason: zero extra toolchain to install in CI; the dependency list is tiny so npm's layout costs nothing. The brief permits either.

## 2026-10-03 — Physics: `@dimforge/rapier3d-compat` 0.21.0 `[agent decision]` (Director)

Chose the **compat** build (wasm inlined as base64 in `dist/rapier.mjs`, ~4.1 MB raw / ≈1.2 MB gz) over `@dimforge/rapier3d` (which needs a sidecar `.wasm` fetch). Reason: single-file module suits static Pages hosting with a relative base; no fetch-path fragility. Over the 50 kB dependency gate — mandated by the brief's stack. Rapier core is f32-in-wasm, which is IEEE-deterministic across wasm hosts, but cross-platform determinism will be *measured* by the stage-2 headless harness (Node vs browser) before the share UI claims it; if it fails, verification stays same-machine and the UI says so (§12 of the brief).

## 2026-10-03 — Renderer: `three` 0.186.1 `[agent decision]` (Director)

128 kB gz core. Mandated by the brief. No other rendering library considered. Material system will be built on Three.js shader chunks per the brief (§8), not on `MeshToonMaterial` as-is.

## 2026-10-03 — Vite `base: './'` `[agent decision]` (Director)

Relative base so one build artifact serves from the Pages project path (`/gravity-works/`) and from any preview server. Alternative: env-dependent absolute base. Reason: zero configuration, and the game never needs to know its mount point.

## 2026-10-03 — livedocs anchoring in a TypeScript repo `[agent decision]` (Director)

livedocs symbol resolution is Python-first; TS names in notes likely resolve as `unknown` (never blocks) rather than anchored hashes. The vault therefore binds by *discipline*: notes name real paths/symbols in backticks, the Documentarian reconciles at every stage close with `livedocs affected`/`coverage`/`verify`, and `livedocs verify` stays in CI. Recorded so a fresh Director doesn't mistake `unknown` coverage for a broken gate.

## 2026-10-03 — Pages deploy = workflow build type `[agent decision]` (Director)

Enabled GitHub Pages with `build_type=workflow`; `.github/workflows/deploy.yml` builds with Vite and publishes `dist`. Alternative: deploy from `main`/`docs`. Reason: artifact must be the built bundle, and the same commit must be checkable by CI first. Site: https://gusellerm.github.io/gravity-works/

## 2026-10-07 — Merge discipline after the builder.ts near-miss [agent decision]
`git checkout --ours <file>` to resolve one conflict region silently dropped the other side's
auto-mergeable hunks in `src/ui/builder.ts` (the empty-click speech line vanished; CI caught it
only because the branch's own e2e asserted it). Two standing rules: (1) resolve code conflicts by
editing conflict markers in place, never by wholesale `--ours`/`--theirs` checkouts — if a file
truly should take one side, diff the other side's version against the result first; (2) after ANY
`git merge` commit (which skips the pre-commit hook), run `livedocs affected` and batch-stamp
before pushing — `git merge -q` bypassing the gate is how `Reference/Level Ladder.md` went stale
for one commit.

## 2026-10-07 — Stage 5 scope: "thirty par builds" reads as "every par build" [agent decision]
The stage-5 acceptance line counts 30 levels (6 sets x 5 rungs); the shipped ladder is 21 (kitchen
has 5, the four stage-4 rooms have 4 each — trimmed deliberately for design density, see the stage-4
ladder notes). Porch lands as a 5-rung set -> 26 levels. The acceptance is honoured in substance:
`tools/replay-all` (or the e2e equivalent) verifies the replay hash of EVERY registered level's par
build, and the count is stated honestly in the session log rather than padding rungs to hit a number.

## 2026-10-09 — Stage 5 replay seek model: pre-record, don't re-sim on seek `[agent decision]` (Feel Engineer)
Two shapes for "drag-to-seek on a deterministic run": (a) keep a live World and STEP it forward
per seek, re-launching from scratch for a backward seek; (b) fast-forward the one deterministic
sim ONCE before the first frame — storing every step's `state()` plus the follow-camera poses
advanced at `FIXED_DT` — and make playback/seek pure reads (`floor(t/dt)` into the record).
Chose (b): the invariant the brief demands ("state at t is the sim's state at t") is true BY
CONSTRUCTION rather than by an O(t) re-run that would stutter on every backward scrub, and the
record doubles as the test surface — Node's `replayRun({record:true})` yields the identical list,
asserted step-for-step with zero difference. Cost: ~15·120 steps of upfront sim (well under a
second) and ~200 KB of doubles for a capped run. Alternatives rejected: keyframe + interpolation
(forbidden — invented states), live re-stepping (a); recorded video of a first playthrough
(a second source of truth).

## 2026-10-08 — Merge a worktree by its HEAD, never by a remote ref [agent decision]
The first stage5-k3 merge took `origin/stage5-k3` while the agent's real commit `b78fe83` sat in
its worktree HEAD — a silently FAILED push (GitHub 500 window) left remote ≠ branch. Symptom: the
merge brought half-done checkpoint code under old tests and two unit tests went red that were green
where the agent ran them. Rule: for any worktree branch, `git -C <worktree> rev-parse HEAD` and
`git status --porcelain` FIRST; merge THAT sha (objects are shared across worktrees), and re-push
the branch from the worktree before concluding. Wire-fault salvage must verify the PUSH, not the commit.

## 2026-10-10 — The spec harness speaks through the URL-affordance family (post/intro off) [agent decision] `[systems engineer]`
The face-lane merge made the post stack and the premise beat DEFAULT (program T1.2), and CI — a
SwiftShader box with no GPU — turned that into a mass-timeout event (run 37998013944: a11y-touch ×2,
the Tab walk, focus-visible, camera-torture, lifecycle-kill, playtest N/PQ/TU, program-voice, shell,
stage6-k3 — every failure an actionability wait starved of frames, all green on Metal). Chosen: the
e2e harness opts NON-VISUAL specs out through the RECORDED PARAMS, not through build flavors or
mutations — `tests/e2e/goto.ts` is the one door non-visual specs land through (`specUrl` appends
`post=off&intro=off` to relative addresses; an explicit param on the call always wins; hash routes
and absolute URLs pass through; pinned by `tests/unit/spec-url.test.ts`), and the specs that TEST
post/intro/tint-shift visuals (`visual`, `filmstrip`, the `replay`/`share-replay`/`determinism` hash
family, `perf*`, `post-dispose`, `intro`, `harness`) never import it and ride
the DEFAULT page with their honest budgets — `playtest-y-clickdiff` is the cautionary name: it SOUNDS
visual, its assertions are event-order probes, and its T5 cell failed a SwiftShader contention sweep
in the first P3 round precisely for riding the composer, so it opts out through the door like the
non-visual rest. The beat needed a param to opt out BY WORD, not by
signal: `?intro=off` joins the family (`src/pages/intro.ts` — off wins over every audience
inference; `navigator.webdriver` stays as belt-and-braces for real browsers; `tests/unit/
intro-params.test.ts` pins the logic). Amends the family list of Decision Log 2026-10-07 ("recorded,
not stripped" — doctrine unchanged, roster longer); the param is a skip, never a behavior change for
humans. Stragglers fixed event-driven, not slowed: `lifecycle-kill` folds its proxy remove-click INTO
the kill task (the old click→evaluate RPC gap was the 350 ms debounce's under CPU load) and settles
by polling the save on disk instead of out-waiting clocks. See [[src]] for the param roster.
## 2026-10-09 — A ghost is a TRACE, not a second simulation: the racing and daily-seed laws `[agent decision]` `[feel engineer]`

The design evaluation's "retention 10×" (§8) was cheap ONLY if a ghost cost what a replay costs; the
plan (Action Plan 2026-10-09 T3.2) also demanded a MEASURED answer to the piece-order question before
any cross-player equality claim. Two shapes were on the table: run a second live `World` beside the
player's and step both (a coupling the hash COULD leak through, a second solver cost per frame, and a
ghost that could diverge from its own recorded run), or make the ghost the recorded STEP LIST of a
headless wind of the very build the deterministic engine already hashes — the same `TapeRecorder` list
`replayRun({record:true})` yields, read at the live sim's clock. Chose the trace: the coupling is one
`sync(world.time)` line, `hashedBodies` never sees a ghost (`replay:all` 30/30 at this HEAD; the live
page's run hashes byte-equal to the Node replay, asserted), and a ghost cannot diverge from a run that
already happened. THE ORDER PROBE: `scripts/probe-piece-order.mjs` — every registered level's
reference build under 4 deterministic piece-ARRAY permutations — measured **148/148 permuted replays
hash-identical with `seq` kept** (`reify` re-sorts by `seq`) and **148/148 identical even RENUMBERED**
(array order becoming canonical order — hash AND step count); the answer is recorded HERE and in [[replay]] so no
future note has to re-wonder, and the par ghost never leaned on the claim anyway (it winds the
canonical `parBuild()` array itself). A friend link follows the same law with the build as its public
face: the share payload decodes with the shipped parser, THEIR build mounts as the TRACK through the
ordinary rebuild line (a build that refuses to mount SAYS so and stays their run — the alternative,
mounting half a build, was refused), their car is that build's trace, and an edit that replaces their
track LIFTS their ghost rather than racing a stranger's track. THE LAUNCH LAW: the ghost car is painted
FROM THE LAUNCH (the grid stays one car — a translucent duplicate in the player's own grid pose is a
double-exposure, and the committed idle-shell baseline stays byte-stable, no re-baseline owed);
reduced motion defaults the toggle OFF (the ghost is pure motion — the choice stays the player's).
DAILY rode the same rails at the SMALLEST honest shape (T3.4): `?seed=` is the page feature,
`?daily=1` is `seed = hash(UTC date)` riding the build's existing seed field into the hash and nowhere
else (zero shipped hashes move), the record is one localStorage triple with the SINGLE-MACHINE clause
inside the chip's sentence — a leaderboard would be a server we do not have, so the copy says what the
mechanism can honour. Rejected: a second live World (coupling risk, cost, divergence), a daily "page"
(new chrome for what is one param plus one chip line), storing ghosts in the save envelope (a ghost is
derivable data; the save carries choices, not caches). Proof: `tests/unit/ghost.test.ts`,
`tests/e2e/ghosts.spec.ts`. See [[replay]], [[ui]], [[save]], `Sessions/2026-10-09 Program T3 ghosts`.
## 2026-10-11 — THE GHOST LAW: the par line is an afterlife affordance, earned before it races `[agent decision]` `[feel engineer]`

The round-1 ghost shipped a spoiler: a campaign rung's par line rode the rail from the FIRST build phase, so the
surprise the rungs are built on ("does my line make it?") was answered before the question was asked — the player
evaluation scored the regression straight into the drop 7 → 6.5, and the k02 scenario is the exhibit: a fresh
build phase with a translucent car already knowing the way. The last lane left the law half-said ("default OFF
until the rung is first finished, then remembered ON") without writing the machinery down — this is that entry.
Chosen: the par ghost is an AFTERLIFE affordance. A campaign rung shows NO par line until its FIRST finish, and
the truth is the save as it already stands — `progress.stars[levelId]` ≥ 1 (a finished run always earns at least
one star; `starsFor` pays "finish at all" first) or the legacy `reached` carry (v1-era rungs the migrade
documents as walked) — so no schema, no new record, no hash anywhere near it (`parGhostEarned`, `src/pages/ghost.ts`).
Before the finish the bar reads the CALM word `ghost: par — finish first to race` and nothing arms, teases, or
half-shows; a press on the locked toggle persists nothing. At the first finish the rung UNLOCKS: the plain toggle
returns remembered ON — the reduced-motion law still decides that default, and an explicit stored OFF is honored,
because the SETTING governs where a line may show while the LAW gates the spoiler (the stored choice never unlocks
an unearned rung — that direction was on the table and refused, or the law would be a default the player who left
the rail on in the sandbox would walk straight past). Sandboxes and the daily default ON unlocked — they ARE the
afterlife surfaces the ghost was always for; a pasted friend link is an explicit ask and is never locked (the
law gates the rung's own line, never a car the player summoned). Rejected: a per-level seen-flag (a second truth
beside the save's — the drift the livedocs gate exists to punish), hiding the line only in the result delta
(the spoiler is the BUILD PHASE), and gating the friend link (a refusal dressed as a law). THE TRACE CACHE came
with it (engineering N4): the wind is deterministic, so `cachedGhostTrace` keys the tape by (level, canonical
build bytes) for the shell's lifetime — measured on kitchen01: every flip cost 139–187 ms before, after it is
182 ms once and 0–3 ms after (`scripts/probe-ghost-flip.mjs`; the fresh idle chrome re-baselines the shell
capture by the locked word alone — 3 354 px, the chip band, stated in [[ui]]). The farewell crane loop's
`boundaryStopped()` guard (engineering N3, mirroring `share.ts`) shipped in the same pass with mutation teeth:
a throwing farewell frame lands the ERROR face with the crane's plan clock frozen, red if the guard line goes.
Proof: `tests/unit/ghost.test.ts` (the law's truth table, the cache's hit/miss/evict), `tests/e2e/ghosts.spec.ts`
(unearned k02 build phase, unlock-on-first-finish remembered ON, toggle persistence, afterlife defaults, the O(1)
flip), `tests/e2e/farewell.spec.ts` (the freeze). Ghost stays visuals-only: `replay:all` 30/30 byte-same at this
HEAD. See [[ui]], [[replay]], [[save]], `Sessions/2026-10-11 Round2 ghosts.md`.

## 2026-10-11 — THE DAILY LAW: a date picks a BOARD — hash(UTC date) addresses one of the thirty rungs `[agent decision]` `[feel engineer]`

The round-1 daily was a date sticker on rung one, and the game's own physics law was the witness for the
prosecution: the seed "is folded into the hash only", so every day's run was Monday's run — "race today"
raced a track that was never today's. The fix had to make the date MATTER without teaching the sim to read
it (the determinism law — the seed rides the build field into the hash and touches nothing else — is the
one surface the program may not trade twice). Chosen: the SAME number decides a second fact. `dailySeed`
(FNV-1a over the ISO day, unchanged) now also picks TODAY'S BOARD by a one-line fold —
`dailyBoardId(seed)` = seed mod 30 over `CAMPAIGN_LADDER` (`src/world/campaign.ts`, nav data, pure, every
machine agrees because the seed does) — and the daily page boots that rung unless an explicit `?level=`
addresses one (addressing doctrine: the door you came through names the room you land in). The page says
which board it is (`#gw-daily-board`, zero-flow corner: "today's board — <registry name> · <UTC day>"),
the result chip LEADS with the name (`dailyChipLine(rec, today, boardName)`), the par ghost rides the rung
by the ghost law (the daily is an afterlife surface — default ON, the Lane-B law doing today's board no
special favor), and the streak record belongs to the ADDRESSED day. A `?date=YYYY-MM-DD` recorded debug
param pins which UTC day the hash rides — `dailySeed` already took an injectable date; the URL is that
seam, and it is also the midnight-race cure engineering N6 asked for (both sides of every test read ONE
day key). A daily page is never a dev preview (the mint's own law: a finished run on a campaign board
mints normally, rung-picked or date-picked alike). Rejected: rotating by weekday (a six-day calendar is a
pattern, not a date — a Tuesday in October would race a Tuesday in March), a bespoke daily level set (30
new boards the budget/tray/par laws must re-earn for a calendar the ladder already IS), and keeping the
word "daily" for a sticker (the evaluation's own ultimatum: rotate it or retire it). Proofs:
`tests/unit/campaign.test.ts` (the fold), `tests/unit/boot.test.ts` (`dailyAddress`/`resolveLevel`),
`tests/e2e/daily.spec.ts` (two dates → two NAMED boards, stable within a date, the page hash IS the Node
replay twice over, the chip reads the name, the record keys the addressed day) and the `ghosts.spec`
afterlife defaults. THE ADJACENT ROUND-2 LAWS rode the same commit: the 20 px back (the compact chrome
constant returns to 288 and the chip band rides the page's bottom slack — `--gw-chip-bottom`, stated in
[[ui]]), and the sandbox doors made visible (every room row's sub-entry link + the farewell's first door
naming all six — [[Levels]], [[ui]]). See [[ui]], [[save]], [[Levels]],
`Sessions/2026-10-11 Round2 doors.md`.

## 2026-10-11 — round-2 Lane D: bloom size gate, the stills' car, and the sprinkler read

**Bloom's never-list ban becomes a SIZE gate, not just a threshold.** A small bright prop (bowl chip, mug rim,
lamp-post flare, duck specular, goal pin, sprinkler dot) could still ignite a flare at DEFAULT by concentrating
threshold-crossing luma into a few pixels — the ban was enforced only on magnitude. `SoftBloomPass` now gates
the bright pass on `min(center, neighbourhood-mean)` over a plus of ±2 quarter-res texels
(`BLOOM_SIZE_GATE_TAXELS`): only a bright AREA wider than the pin footprint passes, an isolated spot cannot
bloom on its centre alone. Rejected: raising `BLOOM_THRESHOLD` (dims the sunlit decks too — histogram mean
must not move), per-prop emissive lists (bypassable, not a law). The ban stays empirically enforced mid-run by
a synthetic probe (`flare-probe` scene, `bloom-flare` spec: small-disc spread 5.5 px → 0 px, halo 217 px →
0 px, area control still glows). See [[render]], `Sessions/2026-10-11 Round2 bloom`.

**The stills' car is the driven sedan everywhere, so the stills stop lying.** All six `*-set.ts` still scenes
carried a generic `car()` stand-in while the game and the film mounted `createCarRig` — the hero stills
quietly starred a different car (filmcar precedent: the rig replaces stand-ins, baselines re-take with
before/after pairs). Rejected: leaving the stand-in in stills (evidence keeps lying), a separate hero car model
(a third thing to keep in sync). Kitchen `establishing`/`hero`/`floor` + `tests/visual/darwin/*` re-took with
evidence; the visual suite is green at 0.0000 %. See [[render]], [[dev]] .

**Garden sprinkler — DECISION: readable ARCS in the exploration; production is already the "out" option.**
Round-2 §2: the spray "reads as scattered candy dots rather than water." The five frozen droplet spheres in the
stage-1 exploration `garden.ts` are now two continuous ballistic ARC ribbons (`sprinkler-spray-arc`, one
parabola per side, liquid material). Rejected: keep the dots (the finding), and any PRODUCTION spray geometry —
the shipped garden set already ships the sprinkler as a DATA grip-zone + a `prop:sprinkler` text callout, no
spray mesh, so the scored garden frames never carried the dots (confirmed on the measured garden03 mid-run and
the garden hero); "out" was the shipped answer, this pass only makes the exploration quote honest. Materials /
geometry in one dev scene; nothing sim. See [[sets]], [[dev]], `Sessions/2026-10-11 Round2 bloom`.

## 2026-10-11 — round 2 Lane A: re-anchor kitchen02's par; stagger the encore death clocks

Two honesty calls, both measured past the point where the shipped numbers were load-bearing.
(1) KITCHEN02'S PAR MOVES `0b4dbab2` → `8008b9aa` (parTime 1.05 → 1.00). The P4 rim guard made the
union dump CHOOSE but not EXCLUSIVE: the ring could still seat a 4th ask past the mouth (the
goal-tell seat — now REFUSED, placement layer, the same machinery as the body guard) and an
off-list trio 3★'d the 1.05 bar. The star law is made order-invariant by anchoring the par AT the
measured 1.00 floor of the authored line (`drop → straight → straight`) — the beater the fail-timing
pass had already named. Rejected: geometry sweeps to push the lip-last seatings ≥ 1.06 (swept
lead/height/blend/span ×~1000 worlds — those seatings are a physical dribble pop at 1.025–1.033,
invariant to every knob; no honest geometry separates them). Proof: 24-permutation sweep in
`tests/unit/goal-guard.test.ts`, the order table in [[Sessions/2026-10-11 Round2 choice]].
(2) THE ENCORE DEATH CLOCKS STAGGER — bathroom05/bedroom05/garage05 rails move, garden05 holds as
the porch anchor, so no two encores share a death clock (player: "same tray, same death"). The
canonical shared fail (`drop → straight → landing`) dies at 1.475/2.008/2.792/3.100, pairwise
≥ 0.308 s. Grade is the only lever (the death clock self-cancels under height/lead/catch/release —
measured); each room's cell was chosen by its OWN law set surviving the battery verbatim in
status, with four named law re-statements (garage's trim-era carries flip back to the original
kill; bathroom's mid bridge and drag restate in the porch-clocked idiom; bedroom's drag
compresses). Rejected: moving garden05 (spends the hidden line), bedroom grade past −11.35° (walks
the chain off the 1.4 m floor disc — the rug law binds before the stagger target), any garage
grade that lets the five-piece over-earn beat the par clock, a catch-wall stand-up (moves the
cup out of the hidden line's reach). Proof: `tests/unit/encore-stagger.test.ts` + the four room
ladder tests; ledger in [[Sessions/2026-10-11 Round2 choice]].

## 2026-10-12 — THE PULL-BACK AND THE FACE: an advice sentence owns a verb; the sheet gets a read-only face `[agent decision]` `[level designer]`

The final-sheet probe found two ways the freeplay door lied by omission. (c) THE OVERSHOOT SOFT-LOCK — the note said `the straight sits past the cup — pull it back` while the Remove button could only take the LAST piece placed; on 3 of 6 sandboxes (garage/bathroom/garden sightings, the probe's method stated) the sentence owned no reachable verb. The fix adds NO new key: `removeIndex` gains a first clause — a piece the player placed and the tray owns, seated joined to the goal fixture's own open exit, is what the click takes — read from `goalExitJoinIndex`/`pullbackTargetIndex` in `src/track/build.ts`, the SAME join fact `moveHintFor`'s ORPHAN clause reads (one source: the sentence can never name a piece the click will not take; the fixture-run-out and tray-gate laws keep kitchen02's authored curve and every campaign LIFO rebuild byte-exact). Rejected: a Replace-on-the-sitting-piece verb (a second button for a sentence one button already points at) and an advice rewrite (the sentence was TRUE — the verb was missing). Proof law — verbs ACTUALLY heal, per room: `tools/pullback-verify.mjs` replays the probe's overshoot build on all six sandboxes (dies, is named, is not LIFO-reachable, the Remove→Place→Launch sequence rebuilds the par line to its exact par time); the porch cell needed one honesty footnote — its sink sling-shot reaches the cup from the ride-to-cup seat, so porch's scenario overshoots the DROP instead, and the sweep says so rather than staging a fake death. `tests/unit/pullback.test.ts` (the agreement laws, authored-run-out silence, tray gate) and `tests/e2e/pullback.spec.ts` (the live kitchen-sandbox walk, note as the only instruction) pin it; `replay:all` stayed 30/30 byte-same. (g) THE CHROME TRAP — the name-`save` button collided with the Save dropdown's `Save` (one page, two controls, one name; the probe's click opened settings mid-result). The row is a FIELD now: `name this line` is the input's `<label>`, the commit says `name it`, ids unchanged, and the rects are asserted disjoint. (e)/(10) THE SHEET GETS A FACE, modestly: the ledger is printed where reading lives — the LINES tab's one footline (every kind, its lifetime count, zeros honest, `RECORDS_HONESTY` verbatim, absent while nothing is earned) — and on a SANDBOX result bar the lifetime number rides ONLY the earned line, in parentheses, only for kinds this run moved, never a fourth line, never on a run that earned nothing; campaign bars pass `null` and stay byte-identical. Rejected: a standing tally board on every bar — the probe proved the invisible ledger carried no temptation, so the face is a footline you can only read, not a streak, rank or counter to feed. Proofs: `tests/unit/pullback.test.ts`, the FACE block in `tests/unit/tally.test.ts`, `tests/e2e/pullback.spec.ts`, `tests/e2e/tally.spec.ts` (field law + disjoint rects); receipt `Sessions/2026-10-12 Pullback + face.md`.
