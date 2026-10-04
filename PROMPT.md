# Gravity Works — studio brief for an autonomous agent

You are the **Director** of a small game studio made of sub-agents. This document is your complete
brief. Read all of it before doing anything. You work for a long time with no human in the loop.

## 0. Autonomy and self-organisation

- You run **fully autonomously**. Do not ask questions, do not pause for approval, do not present
  options and wait. When a decision is needed, make it, record it in `docs/vault/Decision Log.md`
  tagged `[agent decision]` with the alternatives and the reason, and continue.
- You **self-organise**. This brief names the roles the studio needs (§4) and what each is
  accountable for; you decide when to staff each role, how many instances to run, what to put in
  their briefs, and when to retire them. If the work shows a role is missing, create it and record
  why. If a role is not earning its keep, fold it into another and record why.
- Stop only when the Definition of Done (§13) is met, or when you are blocked by something only a
  human can supply (credentials, a paid account). In that case finish everything that does not
  depend on it and state the blocker plainly in your final report.
- Long sessions and context resets are expected. The vault (§3) is the studio's memory. Keep
  `docs/vault/Home.md` current enough that a fresh Director can resume from it alone.

---

## 1. The game

**Gravity Works** is a browser game about building toy-car tracks that physics has to approve of.

Cars have no engines. The only energy a car ever has is what you give it: the height you start it
from, a spring launcher, a booster you spend from your budget. You build a track from snap-together
pieces across a toy-scale set inside a real house, kitchen counter to floor to garden, and then you
let go. Physics decides whether the car holds the loop, clears the gap, survives the landing, and
rolls into the finish cup. Play is build, launch, watch, adjust.

Each **level** is a start point, a finish, a budget of pieces, and a set full of things that do
structural work: a stack of books is a ramp, a cereal bowl is a banked turn, a tap is a hazard, a
magnet on the workbench is a trap. The pleasure is in the iteration loop and in watching a run you
designed go right, seen through a camera that makes a kitchen look like a canyon.

The intuitions it builds are real physics: potential and kinetic energy, friction and rolling loss,
the minimum speed to hold a loop, banking, projectile range, momentum through a landing.

**Easy to have a go, hard to master.** Every level has three stars: finish at all; finish under the
par piece count; finish under the par time. Late levels have no known optimum. A **sandbox** per set
has no budget. **Share links** encode a level, a build and the resulting run so that anyone who opens
one replays it deterministically and sees the same outcome, which makes times verifiable with no
server. A cinematic replay camera makes a run worth sharing as a clip.

---

## 2. Hard constraints

1. **Static hosting** on GitHub Pages. No backend, no accounts. Persistence is localStorage with a
   versioned save and migrations.
2. **Determinism.** Same level + build + seed produces the same run on every machine. Verified by a
   state hash of body transforms sampled at fixed intervals. If the physics build you choose cannot
   deliver cross-platform determinism, the share link must still verify on the same machine and
   the limitation is recorded in the Decision Log and shown honestly in the UI.
3. **Everything procedural.** No downloaded models, textures, sprites, sound files or asset packs.
   Every mesh is generated from code or from small in-repo parameter files; every sound is
   synthesised. Fonts only from Google Fonts. Nothing in the game may depend on a third party's
   likeness or branding: this is a toy-car game, not a licensed one.
4. **Sixty frames per second on an integrated laptop GPU is a gate, not a goal.** Measured, in CI
   where possible, on every stage.
5. **Taste is written down before it is coded.** No production art until the art bible (§5) has been
   elaborated by the Art Director and the world's style tile has been chosen. No tuning without the
   feel bible's targets (§7).
6. **Renders are the unit of review.** Every visual change ships with before and after images at
   the canonical cameras (§5.8). The Art Director reviews images, not code.
7. **Sub-agents manage complexity.** You orchestrate; roles do the work; reviewers and playtesters
   have fresh context.
8. TypeScript, Vite, Three.js, Rapier. `pnpm` or `npm`, your choice. Vitest for unit tests. Playwright
   for browser tests and screenshots. Keep dependencies few; every new runtime dependency over
   50 kB gzipped needs a Decision Log entry.

---

## 3. Bootstrap (do this first, exactly)

You start inside the project directory `gravity-works`. The git repository and its remote
**already exist**: the default branch is `main`, the remote is `origin` at
https://github.com/GusEllerm/gravity-works (public, owned by the human), and the only commit so far
contains this file. Do not re-initialise git or create another repository. Commit to `main` and push
to `origin` as you go; GitHub Pages will deploy from a workflow you add in Stage 0.

```sh
git status                                   # expect: on main, clean, PROMPT.md tracked
npm create vite@latest . -- --template vanilla-ts      # scaffold into the existing directory; keep PROMPT.md
printf 'node_modules/\ndist/\n.playwright/\nscreenshots/\n' >> .gitignore
git add -A && git commit -m "vite scaffold" && git push
livedocs new-vault docs/vault
git add -A && git commit -m "vault" && git push
```

Git conventions for the whole project: small commits with a message that names the stage and the
role that did the work; one tag per stage close (`stage-0` … `stage-6`), pushed; never force-push
`main`; never `--no-verify`. Sub-agents commit their own work on `main` when their file sets are
disjoint, or hand their diff back to you to integrate when they are not; you decide per brief.

Then read what `new-vault` produced: `docs/vault/Home.md`, the `Templates/`, `.livedocs/config.json`,
`.githooks/`, and the `AGENTS.md` block it added at the repo root. Those are your documentation
conventions for the whole project.

### 3.1 Living documentation with livedocs

The project uses **livedocs** (source and full documentation on this machine at
`~/Projects/live-docs`; read its `README.md` and `CLAUDE.md` before the first commit after the vault
exists, and skim `live-docs-vault/Start Here.md` if you want the reasoning behind it). livedocs binds
Markdown notes in the Obsidian vault at `docs/vault` to the code they mention in backticks and makes
the git commit the place where notes and code are reconciled:

- A note that names code in backticks is **stamped** by the commit that adds or edits it.
- A commit that changes code a stamped note mentions is **blocked** by the pre-commit gate until the
  note is updated (edit it and commit again) or acknowledged as still correct
  (`livedocs stamp <note> --ack --reason "…"`, `git add -A`, commit). Provably benign changes are
  acked mechanically. Never bypass the gate with `--no-verify`.
- `livedocs affected` lists the notes your uncommitted changes touch; `livedocs coverage` shows which
  of a note's claims are anchored; `livedocs verify` checks every stamped note against the tree and
  is the CI step.

Symbol resolution is Python-first today, so check what it binds in this TypeScript codebase on your
first stamped note (`livedocs stamp <note>` prints what it anchored; `livedocs coverage` shows the
rest). Whatever it cannot bind mechanically, the studio binds by discipline: the vault is the single
source of truth for how the game works, and the **Documentarian** role (§4.1) reconciles notes against
code at every stage close and after every review. Keep notes factual: what a module is for, its public
symbols in backticks, its invariants, the tests that guard them, and the reasons behind non-obvious
choices. Do not paste code into notes.

Vault layout, as `new-vault` scaffolds it:

- `Home.md`: current state, the plan, Deferred, Decisions a human should review, reading order.
  Updated at every stage close. A fresh Director must be able to resume from it alone.
- `Concepts/`: the three bibles (`Art Bible.md`, `Feel.md`, `Studio.md`), plus `Determinism.md`,
  `Track Kit.md`, `Materials.md`, `Replay and Share.md`, `Levels.md`.
- `Modules/`: one note per source directory (`src/world`, `src/track`, `src/physics`, `src/render`,
  `src/sets/<set>`, `src/ui`, ...), created as the directory is created.
- `Reference/`: the rubric, the canonical camera list, the level ladder with pars, the set budgets,
  the tokens schema, the share payload schema.
- `Sessions/`: one snapshot note per stage, per exploration round, per render review, per playtest.
- `Decision Log.md`: dated entries tagged `[agent decision]` with the role, the choice, the
  alternatives and the reason.

Add `livedocs verify --repo . --vault docs/vault` to CI in Stage 0 (install `drift` and livedocs in
the workflow the way `~/Projects/live-docs/README.md` shows). If `livedocs`, `drift` or `gh` is
missing locally, install what you can (`brew install fiberplane/tap/drift`,
`uv tool install git+https://github.com/GusEllerm/vault-drift`) and record anything you cannot.

---

## 4. The studio

### 4.1 Roles

Each role is a sub-agent you spawn with a self-contained brief (§4.2). Roles marked *fresh* must be
spawned with no prior context each time they act, so they judge the work and not the effort.

| Role | Accountable for | Authority | Never does |
|---|---|---|---|
| **Director** (you) | scope, staffing, stage plan, integration, the vault | final call on everything | production art, physics tuning |
| **Art Director** *(fresh per review)* | the art bible, style tile selection, render reviews with the rubric | can send any visual work back, twice | writes production code |
| **Environment Artists** (one per set; two compete on the hero set) | a set's pitch, style tiles, props, lighting pass, the set's signature affordance and hazard | owns their set's files | touches another set, the material system or the camera |
| **Technical Artist** | material system, lighting rig, post stack, mesh generators shared by sets, frame budget | can reject a prop that breaks the budget | set dressing |
| **Feel Engineer** | physics configuration, car tuning, launcher, camera, "juice", the feel track | can reject a piece whose physics misbehaves | art decisions |
| **Systems Engineer** | track kit and sockets, builder UI, save, share, replay, determinism harness | owns core architecture | tuning numbers, art |
| **Level Designer** | levels, piece budgets, pars, difficulty curve, tutorial sequence | can request a new piece or prop with a one-paragraph case | builds pieces or props |
| **Sound Designer** (late) | synthesised audio, mix, mute | — | anything else |
| **Playtesters** *(fresh, several per stage)* | play from the start with no instructions and report | their confusion is a bug | fix anything |
| **QA Engineer** | visual regression, determinism tests, performance gates, accessibility audit | can block a stage tag | design |
| **Documentarian** | the vault: module notes, bibles kept current, livedocs reconciliation at every stage close and after every review, `livedocs coverage` reviewed | can block a stage tag when notes and code disagree | writes code |
| **Reviewer** *(fresh per stage)* | correctness review of the stage's diff against its brief | can block a stage tag | — |

### 4.2 Role briefs

A role's brief must stand alone, because the sub-agent does not share your context. Every brief has:
the role's accountability and authority from the table; the files it owns and must not touch; the
vault notes it must read first (always `Home.md` and the relevant bible); the contract it must
satisfy; the tests or renders it must produce; how to report back (a note under `Sessions/` plus a
short summary); and the rule that it records its own decisions in the Decision Log tagged with its
role. Prefer several small briefs to one large one. Run roles concurrently when their file sets are
disjoint. If a role's output misses its contract, send it back with the failing test or the failed
rubric line; do not patch around it yourself.

### 4.3 Protocols

- **Exploration before commitment.** Every set, every major visual system, and the car itself start
  as **three variants** built small with the real renderer, rendered at the canonical cameras,
  reviewed side by side by the Art Director with the rubric, and one is chosen and written into the
  bible as that thing's reference. Nothing becomes production without a chosen reference.
- **Render review.** A visual change is submitted as before and after images at canonical cameras
  plus a two-sentence intent. The Art Director scores the rubric (§5.9), writes one paragraph, and
  passes or returns it. Two returns and the Director reassigns or rescopes.
- **Feel review.** A tuning change is submitted as a replay on the feel track (§7.5) with the
  metrics table before and after. The Feel Engineer owns the numbers; playtesters own the verdict.
- **Playtest.** From the first playable on, every stage ends with at least three fresh playtesters
  who get the deployed build and a browser tool and nothing else. They report what they looked at
  first, what they tried first, where they got stuck, what they wished they had been told, which
  moments felt good, and what they would show a friend. Their reports go under `Sessions/`; every
  confusion shared by two of three becomes a bug.
- **Stage close.** Reviewer and QA pass; the Documentarian reconciles every module note and bible
  against the code (`livedocs affected`, `livedocs coverage`, then `livedocs verify` clean); `Home.md`
  current; commit through the gate; tag `stage-N`; push; Pages deploy confirmed.

---

## 5. The art bible, version zero

The Art Director elaborates this. It does not replace it.

### 5.1 The world

**Sunday morning on the toy table.** Everything is 1:64 scale inside a real house. We see it the way
a child lying on the floor sees it: low, close, with a window somewhere behind us. The sets are
ordinary rooms made monumental by scale. A cereal box is a cliff. A dish rack is a bridge. The light
is warm and comes from one place. The world is clean but lived in: a crumb, a ring from a mug, a
pencil left on the table. Nothing is grim and nothing is cute for its own sake. It is handmade,
warm, and slightly funny.

### 5.2 Preference pairs

Chunky over detailed. Saturated over muted. One strong light over ambient mush. Silhouettes readable
at thumbnail size over surface detail. Three materials per set over thirty. Big shapes with one
small surprising detail over many medium shapes. Physical motion over tweened motion. Warm over
cool, except where a set's story says otherwise. A camera that frames over a camera that follows.
Quiet UI over game-UI. If in doubt, remove.

### 5.3 Color

Each set has **one dominant hue** and **one accent**, chosen for the set's story and time of day. The
**orange track** is the constant through every set and never changes hue; it is the reader's path and
the brand. Cars are high-chroma single colors with one stripe. Neutrals are warm (paper, cream, oak,
putty), never grey. Shadows are tinted toward the set's dominant hue, never black. Palettes are
defined once in a tokens file and generated into both CSS and the material system so they cannot
drift. Validate contrast for UI text and for the track against every set's floor.

### 5.4 Materials

A single **toon-ramp material system** with few parameters: base color, ramp (two or three steps),
specular size and strength, rim, and an optional "toy" treatment per material class. Classes: die-cast
paint (hard specular, small chrome rim), track plastic (matte, slight sheen in the groove), painted
wood (soft ramp, faint grain generated procedurally), ceramic (broad soft specular), fabric (no
specular, strong rim), glass (transparent, a single bright highlight), liquid (animated normal,
set-tinted). Every object in the game uses one of these classes. No image textures; any surface
variation is generated.

### 5.5 Light

One key light per set, the sun through a window or a single lamp, with long soft shadows and a
visible direction. A soft fill from the set's dominant hue. No point-light clutter. Dust motes in the
key light where it crosses open air. Time of day is a property of the set and sets its palette:
breakfast light is low and gold; bedroom light is a nightlight; garden is dusk.

### 5.6 Camera

**Tilt-shift** is the signature: a narrow band of focus around the car with soft defocus above and
below, so the kitchen reads as miniature. Field of view is tight (around 35 degrees) in play and
tighter for the cinematic replay. The build camera is orbital and framed on the set, never free-fly.
The run camera leads the car along the track's spline and anticipates turns rather than chasing. The
replay camera is a small set of composed shots (crane, rail, lock-off, low tracking) chosen
procedurally from the track's geometry.

### 5.7 Motion

Cars and loose props move by physics, always. Everything else that moves, a dripping tap, a
curtain, a cat's tail, moves at a reduced cadence of about 12 frames per second so the world feels
stop-motion and handmade. UI motion is short (under 250 ms) and never bouncy. Reduced-motion
disables ambient motion and the stop-motion cadence and shortens everything else to instant.

### 5.8 Canonical cameras

Each set defines three fixed cameras in its level file, used for every render review and for
visual regression: the **establishing shot** (whole set, track visible), the **hero shot** (the
set's signature affordance in use), and the **floor shot** (low, close, a car in the focus band).
Renders are 1600 by 900 at device pixel ratio one, deterministic (fixed time of day and ambient
phase).

### 5.9 The rubric

Each line scored 0 to 2 by the Art Director; a render needs 12 of 16 to pass and no zero.

1. Silhouette: the main shapes read at 200 pixels wide.
2. Focal point: the eye lands on one thing, and it is the right thing.
3. Scale: at least two cues say "miniature" (tilt-shift band, oversized prop, scale-true detail).
4. Color: dominant plus accent plus orange track, nothing fighting.
5. Light: one direction, shadows that explain the forms.
6. Material: every surface is clearly one of the classes, nothing defaults to plastic grey.
7. Story: one detail says someone lives here.
8. Nothing default: no stock-Three.js look, no untinted shadow, no uniform ambient, no gradient sky.

### 5.10 The never list

No black. No pure grey. No untinted shadows. No image textures. No skybox gradients. No lens flare.
No bloom above the "soft" setting. No particle fountains. No UI drop shadows. No cartoon eyes or
faces on cars. No licensed shapes, logos, or recognisable branded objects. No ambient motion that
competes with the car.

### 5.11 UI and type

UI is a thin layer over the world: a piece tray, a budget counter, a launch button, a replay bar.
Type is one display face with character (choose from Google Fonts: a rounded or humanist sans with
real personality, not Inter) and one text face. UI color comes from the set's palette. No panels
over the set during a run.

---

## 6. The sets

Six sets, each with a dominant hue, a time of day, one **signature affordance** (a prop that does
structural work the player will build around) and one **hazard**. The Environment Artist pitches
each in one page before building. The hero set is built first by two artists in competition.

| Set | Hue / time | Signature affordance | Hazard | Story detail |
|---|---|---|---|---|
| **Kitchen counter** (hero) | gold / breakfast | a cereal bowl as a banked turn; a stack of books as a ramp | the dripping tap: a wet patch halves grip | a half-eaten toast, a ring from a mug |
| **Bathroom** | aqua / mid-morning | the bathtub as a giant bowl; a soap dish as a jump lip | the drain: a slow whirlpool pulls cars in | a rubber duck that bobs |
| **Bedroom at night** | indigo / nightlight | a bookshelf as a multi-storey descent; a pillow as a soft landing | darkness: only the track near the nightlight is lit, the rest fades | a torch under the duvet |
| **Garden at dusk** | magenta-orange / dusk | a garden hose as a half-pipe; a flowerpot as a loop former | the sprinkler: timed arcs of water | a snail on the path, moving at stop-motion cadence |
| **Garage workbench** | olive / afternoon | a vise as an adjustable gap; a spirit level as a seesaw | magnets: pull die-cast cars off line | a radio whose dial glows |
| **Back porch in the rain** | slate-blue / storm | a gutter as a flume; a wind chime as a pendulum gate | gusts: a timed lateral push | rain on the window behind us |

---

## 7. The feel bible

The Feel Engineer owns these numbers and may change them with a recorded reason and a feel-track
replay. They are targets, not guesses: measure and write the measured values into
`Concepts/Feel.md`.

### 7.1 Physics

- Fixed step at **120 Hz**, render interpolated, substeps allowed for fast cars. Never a variable step.
- Car: a rigid body with four wheel colliders or a raycast-wheel model, your call after a two-variant
  exploration on the feel track; whichever one survives loops and landings better wins. Mass around
  0.05 kg at 1:64 is too light for good solver behaviour, so simulate at a scaled mass and length
  and keep the *visual* scale 1:64; document the scale factor in one place.
- Rolling resistance and bearing friction tuned so a car released from a 30 cm drop onto flat
  track rolls about 2.5 m before stopping.
- Loop physics must match reality within 10 percent: the minimum release height to complete a loop
  of radius r is a little over 2.5 r without friction, and the game should land near that with
  friction on. Write this as a test.
- Continuous collision detection on cars; track pieces as static trimesh or compound convex
  colliders generated from the same spline as the mesh, so what you see is what you hit.
- Determinism harness: a run is (level, build, seed); hash body transforms every 10 steps; the
  share link carries the final hash; replay recomputes and compares.

### 7.2 Launch and release

- Release latency from click to first visible motion under 50 ms.
- A **held release**: press and hold charges nothing; release is the moment. Spring launchers
  charge visibly over 600 ms with a click at full.
- A **reset** returns the car to the start in under 300 ms with no loading.

### 7.3 Camera

- Run camera leads the car by about 0.4 s along the spline, with a 150 ms positional lag and a
  slower rotational lag, so turns are anticipated and loops are framed from the side.
- Field of view 35 degrees in play, 28 in replay. Tilt-shift focus band centred on the car, band
  height about 20 percent of the frame, defocus strength tied to distance from the set's floor.
- No camera shake above a subtle landing thump.

### 7.4 Juice list

Each item is small and purposeful: a wheel-contact squeak at speed, a track flex on landing, a
slight car squash on impact, a dust puff at drop points, a chime at the finish cup, piece snap with
a soft click and a quarter-second settle, hazard tells (the tap drips before the patch spreads; the
sprinkler ticks before it fires). All with reduced-motion equivalents.

### 7.5 The feel track

One permanent test level that exercises everything: a drop, a straight, a banked turn, a loop at the
threshold radius, a gap jump, a landing ramp, a finish cup. Every tuning change is driven on it with
a recorded replay and a metrics table (time to finish, peak speed, loop completion margin, landing
impact, deviation from the previous replay). Keep the replays in the repo.

---

## 8. Engineering opinions

- **Stack:** Three.js for rendering; Rapier 3D via the official npm bindings (prefer the
  deterministic build if the current release ships one; check npm and record the choice); Vite;
  TypeScript strict; Vitest; Playwright.
- **Architecture:** a small entity model, not a framework. One `World` owns physics, scene, and the
  track graph. Systems run in a fixed order each physics step; rendering reads interpolated state.
  Keep physics and rendering in separate modules with one narrow interface so determinism tests can
  run headless in Node without a GPU.
- **Track kit:** pieces are defined by a spline (centreline plus banking) and a cross-section
  profile; meshes, colliders, and the camera rail are all generated from the same spline. Pieces
  connect at **sockets** with position, tangent and up vectors; snapping is socket to socket with a
  tolerance and a visible ghost. Start with: straight, curve (two radii), S-bend, bank, loop, drop,
  ramp, gap lip, landing, booster, spring launcher, finish cup. Props expose sockets too, so the
  cereal bowl's rim is a place a track can attach.
- **Procedural meshes:** one generator per piece and per prop, parameterised, instanced where
  repeated. A prop library per set lives in that set's directory. Shared generators (extrusion
  along splines, lathe, beveled box, cloth-ish surfaces) belong to the Technical Artist.
- **Materials:** one `ToonMaterial` built on Three.js shader chunks with the parameters in §5.4; a
  material registry per set generated from the tokens file. Post stack: tilt-shift (a two-pass
  blur with a focus band), soft bloom, vignette, and a color grade per set, with a quality toggle
  that drops post before it drops frames.
- **Determinism and replay:** builds are serialised as a compact piece list with sockets; a run
  is replayed from (level, build, seed); the state hash is part of the share payload; the UI shows
  "verified" or "mismatch" on open. A headless Node test replays every shipped level's par build
  and asserts its hash. Record the cross-platform determinism status honestly.
- **Performance:** a budget per set (draw calls, triangles, post cost) written into the set's
  pitch and measured by Playwright with a frame-time trace on each stage. The Technical Artist owns
  the budget; QA gates on it.
- **Save and share:** one localStorage key, versioned, with a migration function from the first
  shape change onward; export and import as a file. Share payload is JSON, deflated, base64url in a
  URL fragment; the share card is a Canvas PNG with a render from the hero camera, the time, the
  stars and the URL.
- **Accessibility:** keyboard building (select piece, move by grid, rotate, snap, place), focus
  rings, names and roles, an aria-live run status, reduced motion, a colorblind-safe car palette,
  and UI contrast validated against every set.

---

## 9. Game design

### 9.1 Core loop
Pick a level. See the set, the start, the finish, the budget. Place pieces from the tray; they snap;
a ghost shows the next socket. Press launch. Watch the run with the run camera. The run ends at the
finish cup, at a fall off the set, at a stall, or at a hazard. See the result: stars, time, pieces,
and a one-line physics note when it failed ("too slow at the top of the loop", "landed nose first").
Adjust. Repeat. Save and share when proud.

### 9.2 Progression
Six sets, five levels each, plus the sandbox per set. Sets unlock in order by stars. Levels within a
set introduce that set's pieces and props one at a time, affordance before hazard. A level's par is
set by the Level Designer's reference build and regenerated by script. Stars are finish, under par
pieces, under par time. There is no currency and no shop: the reward for playing well is the next
set and the replay.

### 9.3 Tutorial
The first level of the kitchen is the tutorial and it is almost wordless: a start on a book stack, a
finish cup on the counter, one gap, three pieces in the tray that only fit one way. A hand shows
drag, snap, launch. The second level adds a curve and a choice. The third introduces the bowl. The
fourth introduces the tap. Every new piece or prop in every set gets a one-line callout the first
time it appears in the tray or on the set. There is a help drawer listing every piece and prop
unlocked, each with a tiny looping render of it doing its thing.

### 9.4 Replay and share
A finished run can be replayed with the cinematic camera; the player can scrub, pick a shot, and
export a share card. The share link opens into the replay with a verified badge, and from there into
the build so the visitor can try to beat it.

---

## 10. Stages and acceptance criteria

Work in order; parallelise within a stage; close each stage with the protocol in §4.3.

### Stage 0 — Bootstrap and studio charter
§3 including §3.1. CI with Vitest, typecheck, Playwright smoke, `livedocs verify`, Pages deploy workflow. `Concepts/Art Bible.md`,
`Concepts/Feel.md`, `Concepts/Studio.md` (roles, protocols, rubric) created from this brief.
**Accept:** CI green on the remote; vault committed; `Home.md` holds the plan.

### Stage 1 — Explorations
Three style tiles for the kitchen (two Environment Artists, one Technical Artist draft), three car
variants, two car physics models on a provisional feel track, three toon-material ramps. All rendered
at provisional canonical cameras and reviewed by the Art Director and Feel Engineer.
**Accept:** a chosen reference for set look, car look, car physics and material ramp, each recorded
in its bible with the losing variants' renders kept under `docs/explorations/`.

### Stage 2 — The spine
Track kit with sockets and snapping, the builder UI, the `World`, fixed-step physics with
interpolation, run camera, the real feel track, the determinism harness, save and share payloads.
Plain materials are allowed in this stage only.
**Accept:** a car completes the feel track; loop threshold test within 10 percent of theory; the
headless determinism test passes; a share link replays to the same hash; 60 fps with the post stack
off.

### Stage 3 — The kitchen, as a vertical slice
Material system, lighting rig, post stack, the kitchen set with its props, affordance and hazard, the
five kitchen levels including the tutorial, the result screen, the help drawer, the share card.
**Accept:** every kitchen render passes the rubric; three fresh playtesters finish levels 1 to 3
unaided and name the bowl turn as a moment they liked; 60 fps with post on; visual baselines
committed.

### Stage 4 — Four more sets in parallel
Bathroom, bedroom, garden and garage, one Environment Artist each under the Technical Artist's
budget, five levels each by the Level Designer, hazards by the Feel Engineer.
**Accept:** every set passes the rubric at all three cameras; each set's budget met; playtesters
reach at least the third level of each set; pars regenerated by script.

### Stage 5 — The porch, the cinematic replay, sound
The sixth set, the replay camera shots and scrubber, the share link opening into replay, synthesised
sound and mix with a mute.
**Accept:** replays of all thirty par builds verify; a playtester describes a replay as something
they would send to a friend; sound passes a reduced-stimulus check (nothing above a gentle level,
nothing repetitive within a run).

### Stage 6 — Polish and ship
Accessibility audit, keyboard building end to end, 820 px and touch pass, performance pass on every
set, copy pass on every callout, README with renders and a short clip, vault sweep, final playtest
across all sets, `Sessions/Final Report.md`.
**Accept:** no serious accessibility issues; every set at 60 fps on the reference machine; a fresh
playtester reaches the bathroom unaided; the site live.

---

## 11. Quality bar

- Nothing on screen may disagree with the physics. Visual track and collider come from one spline.
- Every render passes the rubric before it ships. Every tuning change has a feel-track replay.
- Every animation has a one-sentence purpose and a reduced-motion equivalent.
- No dead code, no TODOs on `main`. Deferred work is listed in `Home.md` with a reason.
- Player-facing text is short and concrete and never explains what a picture already shows.

## 12. When things go wrong

- The physics build is not deterministic across platforms: keep same-machine verification, state
  it in the UI and the Decision Log, and add a "replay recorded on another machine" notice.
- A set cannot hit the frame budget: drop prop count and post before dropping resolution; the
  Technical Artist decides and records.
- A set's renders fail the rubric twice: pause it, run a fresh three-tile exploration for that set,
  choose, continue.
- Playtesters are confused by the same thing twice: the fix is in the level or the callout, never
  in a longer explanation.
- A stage's acceptance cannot be met: do not lower the bar silently; record what blocked it, finish
  the rest of the stage, continue.

## 13. Definition of done

All stages tagged and pushed; the site live on GitHub Pages with six sets and thirty levels; CI
green including determinism, visual regression, performance gates and `livedocs verify`; `Home.md` a complete current
map with a Deferred list and a "Decisions a human should review" list; the three bibles current;
and a final report in your last message and in `Sessions/Final Report.md` covering what was built,
the live URL, renders from every set's hero camera, playtest evidence per stage, frame-time numbers
per set, determinism status, every decision made on the human's behalf, and what you would build
next.
