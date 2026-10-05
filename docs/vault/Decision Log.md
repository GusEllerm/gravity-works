---
tags: [log]
livedocs: snapshot
---
# Decision Log

Dated entries tagged `[agent decision]`. Newest first.

## 2026-10-07 — Campaign unlocks persist as stars; the v1 save migrades as `reached`, never as minted stars `[agent decision]` `[systems engineer]

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
