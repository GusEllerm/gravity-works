---
tags: [reference, evaluation]
livedocs: snapshot
---
# Evaluation 2026-10-11 — design + art round 2 (external evaluator)

> [!abstract] Method
> Round 2 of the 2026-10-09 pass (which said 6.5/10, "the stills frame; the game follows"). Read the
> prior verdict, the Program T1 feel package and the T3/P4 program logs. Everything below was rendered
> or played against the committed build (`940f57f`) served on my own port with `tools/render.mjs`-style
> headless chromium (1600×900, DPR 1), my own tmp, PNGs deliberately uncommitted: the `car-a` rig
> through the harness at six camera angles; canonical `hero`/`establishing` stills of all six set
> scenes with `post=on`; the real shell (post ON = the shipped default, `wantPost`) at build phase and
> mid-run on kitchen04, bedroom03, bathroom03, garden03, garage02, porch05 (`?build=par`) plus the
> ALT_LINES rooms on `?build=alt` with the par ghost racing; the premise beat forced with `?intro=1`
> sampled 0.3–5 s; the farewell crane forced on a seeded first porch05 clear, sampled per reveal; the
> daily-seeded result screen; both sandboxes; kitchen03 idle. Where I extrapolate from code rather
> than pixels I say so.

## 1. Is the played frame now the judged frame? — **Partly. 7/10.**

The single biggest 2026-10-09 finding is genuinely fixed where it counted: **the car you drive is the
ratified sedan.** Mid-run in every room it reads as the die-cast toy — beveled body, proud stripe band,
four wheels seated on the deck through launch, gap flight and landing (kitchen04/bedroom03/garden03
frames), wheels properly in the channel, no red box anywhere on the played path. Verdict on charm at
six angles: side and three-quarter views are the ratified toy; the **head-on view is a blue slab with
two blown specular chips** (no bumper/lamp read at all) and at run-camera distance the **roof-rack bars
read as a white book strapped to the roof** — charming, mildly derivative, not toy-derivative. The
stills, conversely, have NOT been re-cut: all six set scenes still mount their bespoke stand-in cars
(kitchen/bedroom/bathroom even ship the literal red box in the canonical `hero` stills — see §3.3), so
the drift has flipped direction: **the game now stars the car the stills never got.**

The defocus budget is honored at default tier: the tilt caps (`PLAY_TILT_TUNING`, top strength 0.65,
kernel 6 buffer-px) do what §7 #2 asked — build-phase frames READ (kitchen03 idle: the room, the ring,
the built line, mild haze only). Nothing I captured is milky at default high. What IS mushy is not the
tilt: it's **bloom on small white props** — the kitchen bowl/mug, the bedroom lamp post (still a
neon-white pole with a flare streak mid-run, the never-list ban), the bathroom duck's specular (a lens
flare), the garden/porch goal pin — every ~5 mm white dot in a run frame blooms into a lightbulb.

The composition law is still broken at one moment, and it's the most-seen moment in the game: **the
terminal edge.** Result, fail and end-hold frames in kitchen02/03/04, garage03, porch05 pull the camera
UP AND BACK and freeze the room as a thumbnail on a blank table — 80 % empty gradient, the set a props
cluster in one third of the frame ("you vs par — time −0.02 s" printed over a poster-sized nothing).
The run itself now frames well (the run camera holds the car and the room together through corners);
it's the frame you LOOK AT to decide whether to Retry that stopped being a composition. Played-frame
verdict: **7/10** (6.5 → 7.0): the car is shipped, the tilt is capped, the run frames; the terminal
hold and two rooms' run-set (below) are what still split the two frames.

## 2. Art scores — production render as shipped, default post ON, stills AND played (x/10)

| set | score | named evidence |
|---|---:|---|
| kitchen | **7.0** | hero still is the ratified tile-B grammar (tap shadow, drip, crisp specks-in-bowl) and mid-run kitchen04 is warm and legible with the sedan on the orange; stills lose the point that the focus-band car is a RED BOX stand-in, the cereal-box billboard (flat yellow slab + hard teal band) is unchanged, the bowl/mug read as blown white spheres in EVERY frame (build, beat, result), and the terminal hold is the pale-void thumbnail (mid2400). |
| bedroom | **6.5** | the wood reads crisp and the run frame (sedan under the trellis-lamp line) is the most honest played frame in the house; but the lamp is a neon-white pole with a flare streak in BOTH the hero still and the build camera (never-list), the still's car is a green wheel-less block, and one blown white card sits mid-frame in the hero. |
| bathroom | **7.0** | the pipeline parity finally happened — the cathedral exists on evidence: hero still has the tub, the duck, the porcelain tile grid, hard step-shadows (6.0 → 7.0); but the RUN camera never shows it: mid-run is a mint void with a flat cyan checkerboard plane (reads as graph paper, not porcelain) and a duck-head specular flare at the left edge; the still's car is again a red block. The room is still two different games 60 frames apart. |
| garden | **7.0** | the bore mouth is BACK in the hero (dark green pipe at the left, the 13/13 shot re-earned) and reads again mid-run; trellis bars, watering-can shadow, sun disc all hold; loses points where the sprinkler film reads as scattered candy dots rather than water, the lawn run-field is flat lime, and the goal pin blooms. |
| garage | **6.5** | the AD-failed frame is dead at establishing: the sunblade is now a solid white wedge (zero speckle — the dither sweep worked there) with the wheel and bench reading as darks; but mid-run the blade edge re-dithers (white sparkle NOISE along the oil-stain boundary, garage02-mid900 — the 2026-10-09 finding, alive at default), the oil stain itself reads as flat moss-green slime in every frame, the hero stills show staircase jaggies on the blade/shadow seams, and the run camera still leaves the blade and the sparkle OUT of frame (garage03 alt = a tan highway with track islands). |
| porch | **7.5** | the freshest port stays fresh: the weave-shadow parallelogram holds mid-run, the pavilion/hedge/floor-mat spatial read survives even the high fail-cam, and the farewell's Porch reveal is the one crane frame that reads as a room; loses a half point on the stills' bespoke stand-in car and the goal-pin flare. |

Mean **6.9** (6.4 →). The grade-and-post decay named last round is mostly cured at STILL level; what
sits between this and 7.5 mean is: blown speculars on small white props (one law, six rooms), the two
stills-vs-run cameras' rooms (bathroom, garage), and the stand-in cars in the evidence itself.

## 3. The new stuff, judged

**3.1 Premise beat (first 5 s): keep it.** t+0.3 is almost the poster — the sedan seen from behind at
the foot of the launch ramp, vanishing-point track, title in the display face; t+1–2 the §7.3 launch
peep leads it over the counter, and the whole thing is silent BY CONSTRUCTION and over in ~3 s (par's
terminal edge ends it; the 9 s timer never nears). Would I keep watching? Yes — it is the best 3
seconds the game has. Two blemishes: (1) **the chips leak through the beat** — `Sound: on` top-right
and the whole `ghost: par / paste a share link to race it / ghost: from link` strip bottom-left are on
screen during the cold first visit (the `hidden`-attribute chip sweep lives only in `farewell.ts`;
`intro.ts` never got it, and the inline-`display` chips defeat the `.gw-premiere` class rule); (2) the
foreground track smears hard at t0.3 (the tilt band is centred on the release pose — a law, but the
beat's first frame is its worst tilt case). Fix the chips (minutes) and this is the front door.

**3.2 Farewell crane: it's a flyover, and five of the six reveals don't land.** Mechanically excellent
(six reveals + tally + three doors, honest copy — "and that is the house."; the doors are clean). But
the crane mounts the SETS (permanent geometry, no build): Kitchen's reveal is a **flat tan disc with
five props on it and no track** — a UFO, not the counter I spent 15 rungs on; Bedroom/Garage read
partly (planks / wheel+bench), Garden is a green mat on a plate, and the discs OVERLAP each other at
their edges. The one reveal that lands is Porch — because the porch's permanent geometry IS a room.
The crane wants the `setCameras` `hero` rig per room (the set's own framings already exist for
garden/porch/bathroom) and the par build line mounted under the camera (the `?set=` entry and the
premiere's `placeholderBuild` both exist) — see opportunity 3. The reduced-motion static summary page
is the better composition of the two.

**3.3 Stills pipeline: the evidence still lies.** `createCarRig` feeds `boot.ts`, the share film and
the ghost — but none of the six `*-set.ts` scenes: kitchen/bedroom/bathroom still render a "tile-B
stand-in" (a red toyBlock with a stripe) in canonical `hero`/`establishing`, garden/garage/porch their
own bespoke minis. The ratified sedan has NEVER been through the set grade — the re-render the
car-rig comment promises ("the car-a re-render through the kitchen grade is the car scene's job")
nobody scheduled it.

**3.4 Ghost visuals: present, honest, not always legible.** In the ALT rooms the translucent par car
shares the world with yours — and the answer is palette-dependent: in **porch/garage** light it reads
as a ghostly silhouette (faded sedan, clearly a car); in **bedroom/garden** warm-light it washes to a
pale crumpled shape that reads as debris, not a car (GHOST_MIN_ALPHA floor exists, but a washed-out
same-hue car on same-hue light has no edge). The white ring gate and the finish pin help; nothing
outlines the ghost. The overlap case (you on par) is honest — you can't SEE it while you match it,
which is exactly the feedback the delta beat sells.

**3.5 The chrome (daily/farewell/ghost): same voice, mostly.** The dark-brown result panel, the tray
chips, the daily line with its single-machine honesty sentence ("your own runs on this device only"),
the farewell doors' copy — one family, plain-spoken, no impostor. Two chips-level nicks: the ghost-bar
strip is the noisiest cluster on the page (three controls, one placeholder input) and the long failure
note can run off the right edge of the status line (observed garage03/porch05 fails — note the
canvas-clipped screenshots exaggerate; the full-page result screens are clean).

**3.6 Sandbox play-framing: the tan disc is painted over, not gone.** Build-phase sandbox is now a
warm table field (no grey-void disc at the campaign framing — the kitchen03 idle and both sandboxes
confirm), the 13-kind tray is honest, and the pre-placed run-out line is readable. But kitchen-sandbox
is ~80 % empty gradient with one long straight vanishing into haze — a lane, not a room; garage-sandbox
hangs its set in the far corner. The play framing is fine; the SANDBOX still has no composition law of
its own (nothing frames the set inside its own sandbox camera).

## 4. The five-verb frontier: three cheapest CONTENT moves (data only, existing pieces)

1. **One showcase rung per room whose TRAY stocks a dead verb** — swap the 04 slot of each ladder
   (the trade-off rung) for a line whose tray includes `loop` / `bigCurve` / `sbend` /
   `springLauncher`. Every part exists (splines, sockets, par-regen, tray⊇par parity); this is level
   DATA. The campaign currently contains ZERO loops and ZERO spring chains; the genre's signature
   verbs are still sandbox-only after two rounds. Six rungs of LD time.
2. **Author the magnet/whirlpool ZONE data onto four existing rungs** — the voice-map rows are already
   ratified-and-waiting (`splash`/`oil`'s siblings), the `hazardContactVoice` classifier and the
   `hazardsTouched` tally already exist; the zones themselves are boxes in set data. Two rooms get a
   new verb (suction, drain) with zero new geometry and zero new sound work, and the encores'
   byte-identical rail pairs finally diverge.
3. **Ghost-duel encores** — re-cut the four encore rails (two are hash-identical twins) as "beat the
   par ghost by X" rungs: author the par line as the encore's authored trace (the ghost rails, the
   race chip and the delta beat shipped whole). A ghost is a content FORMAT: every re-cut encore
   doubles its room's authored content without adding a piece.

## 5. Top-7 opportunities, by player-value per risk

1. **Frame the terminal edge** — at the result/fail/end-hold, hand the camera to the STATIC framer
   (`frameCamera` + the finish witness already bias it) instead of freezing the retreated follow pose;
   one day; the most-viewed composition in the game is currently its worst. LOW risk (visuals-only).
2. **Chip-sweep the premise beat** — call the farewell's four-line `hidden` sweep when the beat starts
   (`intro.ts`); minutes; the cold visit's first frame must not sell a share box. LOWEST risk.
3. **Farewell = the six RATIFIED frames** — drive the crane off each set's `hero` row of
   `setCameras` (three sets ship theirs already) and mount the room's par build under it (the
   premiere's build idiom); ~2 days; turns the flyover into the victory lap — reveals 1–5 land.
4. **Put the rig in the stills** — `createCarRig` replaces the stand-in `car()` in the six `*-set.ts`
   scenes, baselines re-shot with before/after pairs (the filmcar precedent); hours + gate work; the
   evidence trail stops contradicting the game.
5. **Specular-bloom law for small whites** — cap per-pixel bloom input by projected screen size (or
   pre-darken the die-cast specular on ≤5 mm props): the lamp post, duck eye, mug, bowl, goal pins;
   one pass, six rooms' "blown" findings die together; MED (touches the ratified grade — needs the
   full baseline family re-baselined honestly).
6. **Run-camera set-presence pass for bathroom + garage** — the `solids`/`finishArc` machinery exists;
   extend the kitchen-style prop boxes + a framing nudge so the tub/tile grid and the blade/wheel
   STAY IN the run frame in their own rooms; ~days; the last two rooms where the run leaves the set.
   MED risk (camera tuning can regress watchability suites).
7. **Ghost edge-readability law** — shift the ghost body a token hue off the player's set blue and add
   the already-damped rim term at low strength to ghost materials, keeping the alpha floor; hours;
   fixes bedroom/garden wash-out; LOW risk, visuals-only.

## 6. Honest gaps in this pass

Screenshots cannot show wheel spin, squash timing or the thud — the rig's MOTION is judged from
geometry at rest + the T1.1 filmstrip log; audio claims are code+log, not a dB bench. Mid-run seconds
are sampled at ~0.9/2.4 s of real time (fast par rungs show their end-hold at 2.4 s — that's how the
terminal-edge finding got found, but a couple of "mid" frames in porch05/kitchen03 are end states).
The crane's per-reveal line text showed Garage twice in my poll log between reveals 4–5 (Garden's line
lives ~0.6 s of plan time and my sampler drifted — the summary table and the final page name all six
rooms correctly, and the known CI-starve note in the commit log describes the same sensitivity); I did
not reproduce a reveal-order failure, only observed my own sampling race it. Two stills angles
(bathroom/garage `floor`) not re-shotted this round; touch/a11y paths not exercised; I played via
scripted par/alt runs rather than hand, selectively.
