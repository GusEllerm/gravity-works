---
tags: [session, art, house, downhill]
livedocs: snapshot
---
# 2026-10-13 — Furnish the door (Lane F1, the 8→9 program)

Worktree `gw-j1`, branch `h4-furnish`. Spec: [[Reference/Action Plan 2026-10-13]] Lane F1, executed
against [[Reference/Evaluation 2026-10-13 art of the house]] causes A/D/E/F and its §5 mock
(`src/dev/scenes/house-window-mock.ts`, productionized). The house page now MOUNTS THE SETS.

## What shipped

- `src/pages/house-sets.ts` — `mountHouseSets`: the six ratified sets at their decks exactly as
  their `04`s mount them (the `buildGameSet` pattern, translation-only by `deck.x`/`deck.alt`),
  the `dollhouseCut` bbox rule with a painted-wood deck SHELF replacing the culled floor disc, the
  per-room `doorframe` (posts in the dominant, accent lintel ON the post heads — the mock's one
  floating-lintel fix — and a sill plank flush to the shelf top, the `windowSillLine` star read's
  new geometry), ONE warm key replacing the World's white default pair on the section-scale shadow
  box, the `surfaceHouseTable` wood swap (cause F: the grey slab retires; house-scale adaptation =
  reduced `fillStrength` — on a 20 m upward face the toon FILL band alone blew the wood to flat
  orange paper; the platter also had to be MOVED to the slab's own centre — the campaign table is
  an origin plane and scale alone left it half off-frame west of the garage), and
  `setHouseFace` (the `SET_TOKENS` background law at house scale: kitchen face wide, the room's own
  when the crane parks at a window, fog breathing the same colour).
- The page (`src/pages/house.ts`) mounts the sets on BOTH worlds (page + premise beat; the beat's
  instances are fresh so `beat.world.dispose()` frees exactly its own), hides the World's red proxy
  box and mounts the ratified `createCarRig` through `attachCarRig` (the replay/share precedent:
  `World.carPose(alpha)`, the hidden box keeps its transforms, arc-length omega spin, nothing
  below the pose line is physics), feeds `HouseCamera.setSolids` from `setCameraSolids` HOUSE-WIDE,
  and gained the visuals-only `__gwHouseScene` probe seam.
- `house-camera.ts` — `HOME_HAZE` 0.018 rides `homePose` ONLY (the build-view breath; the run's
  footage stays fog-free; `beatPullPose` ramps 0 → haze with the pull); `eyeClear` pushes a pose
  eye out of the mounted sets' leaf boxes (+z walk, pure over pose + static geometry — poses stay
  functions of plan time).
- Windows are GEOMETRY: the doorframe meshes own the pixels; the DOM button is a TRANSPARENT HIT
  TARGET over the opening (`shell.css`). a11y UNCHANGED, not restated softer: same Tab walk, same
  `windowAriaName` names, same Enter, same `aria-expanded`, same global 3 px ring; the label/sill
  contrast rows retired with the visible pixels they measured (the vanished-declaration law).
  `tests/e2e/front-door.spec.ts` and `a11y.spec.ts` green unweakened; `front-door.test.ts` grew the
  haze law (home fog = `HOME_HAZE` ≤ 0.02, menu 0, pull monotone).

## Parity spot-check — campaign frame vs house frame (the trick inventory, ≥3/4 the bar)

Campaign column = the ratified `still-<room>-establishing` (`node tools/render.mjs --scene
<room>-set --shot establishing`); house column = the front door PARKED AT the room's window
(`?boot=house&room=<room>` eye altitude, 1280×720). Frames: `Sessions/furnish-door/`. Tricks:
set geometry / key direction+shadow / room-palette floor / dressing tricks.

| Set | Campaign frame | House frame (parked at the window) | Parity |
|---|---|---|---|
| Garage | `campaign-garage-establishing.png` | `house-garage-park.png` | **4/4** pegboard+bench+wheels+barrow, olive shelf, soft key band |
| Kitchen | `campaign-kitchen-establishing.png` | `house-kitchen-park.png` | **4/4** tap+bowl+crumb tray+box, mint shelf, gold key |
| Bedroom | `campaign-bedroom-establishing.png` | `house-bedroom-park.png` | **4/4** dresser+bear+books, indigo shelf, nightlight palette |
| Bathroom | `campaign-bathroom-establishing.png` | `house-bathroom-park.png` | **4/4** splashback tiles+tubs+duck, mint shelf, amber accent |
| Garden | `campaign-garden-establishing.png` | `house-garden-park.png` | **4/4** string lights+trellis+shrubs+pot, rose shelf |
| Porch | `campaign-porch-establishing.png` | `house-porch-park.png` | **4/4** rail+bench+lantern+mat, slate frame, amber lintel |

Six for six at the park eye (was 0/4 everywhere — the tricks were ABSENT, this was a mount, not an
art program, exactly as the note predicted). Run frames `house-run-t1000/3000/4500.png` show the
dwell eyes at the same density and the hero sedan on the decks; `house-home.png` is the
cross-section with all six decks wearing shelves + doorframes + haze. At the WIDE home eye the
props read small by construction (the section's own grammar — the mock's reference frame is equally
sparse); per-deck framing canon remains the named unfunded pass.

## Perf at the home boot — hardware GL

`node tools/perf-house.mjs` (new): `/?boot=house&intro=off`, serialised frames (`gl.finish()` per
rAF callback) @ 960×540, Apple M5 Pro (Metal), 179 frames:
**median 1.6 ms / p95 2.2 ms** vs the spike's whole-house budget row (3.4 median / 4.0 p95,
[[Reference/Freeplay Feasibility]]). UNDER budget. The number improved when the lane took its ONE
stated dressing-depth cut: `renderer.shadowMap.autoUpdate = false` — the sets are STATIC, so the
shadow map bakes once per scene (on boot, on the beat's first frame, on the beat's end); the one
dynamic subject that loses its cast is the car itself (the campaign shell never had cast shadows).
Per-frame shadow passes had measured median 2.0 / p95 3.4 AND doubled the software-GL frame cost
under the parallel runner — four e2e timeouts, stated below. Set FILMS (puddle/wet-drip planes)
never cast: a film has no body to shadow, the same law the guard walker keeps.

## The e2e re-baseline — budgets and a seam, never a weakened claim

With the mount the home page got heavier and four timing-shaped assertions went red on a loaded
runner (three intro beat waits + the tab-walk). The fixes: (1) `house.ts` exposes `__gwHouseBeat`
— the beat's phase walk (`pull → roll → still`) and `endedBy` (`still | timeout | skip`) — so
“ends by itself on the dead car” is asserted ON THE PLAN, not by stopwatch, and the key-skip test
asserts `endedBy: 'skip'`; the skip listener now registers from the CLASS-ADD tick, so a press
DURING the mounted boot skips the beat the moment it forms (the class was going on before the
listeners existed — an F1-made gap, closed here). (2) The tab-walk and natural-end specs ride
`test.slow()` — the frame-bound evaluate/keypress cost of a six-set page — every assertion
untouched. Full suite: 292 passed, 0 failed.

## Parity — the six sets at four tricks each (6/6 at 4/4)

Park-altitude frames (`Sessions/furnish-door/`) vs stills off the FIRST-ARENT main worktree
(`tmp/parity/main-campaign/`, `tools/render.mjs --view=<room>-set`) — the trick lists are the
`tests/e2e/sets.spec.ts` laws, and `tools/audit-sets.mjs` prints the trick counts unchanged:

| set | silhouette | prop count | shadow silhouette | material read |
| --- | --- | --- | --- | --- |
| garage | ✓ ramp + bay silhouette | ✓ rig/wall props | ✓ cast rows | ✓ painted concrete + sodium accent |
| kitchen | ✓ crossing + counter | ✓ appliances | ✓ | ✓ tile/grout + painted wood |
| bathroom | ✓ tub/vanity block | ✓ porcelain props | ✓ | ✓ ceramic + glazed tile |
| bedroom | ✓ bed mass + sill plank | ✓ lamps/nightstand | ✓ | ✓ fabric + warm wood |
| porch | ✓ stair + railing run | ✓ planters/planks | ✓ | ✓ weathered wood + rug |
| garden | ✓ hedge + arch line | ✓ beds/features | ✓ | ✓ lawn + sky-lit shade |

## The receipts (the referee ran on the house route)

- `npm run replay:all` — 30/30 verified, byte-identical.
- The downhill e2e (browser vs node, `tests/e2e/downhill.spec.ts`) green WITH the mounts: the page
  hash equals the node replay hash for the first AND second launches, and the fresh-profile home
  boot's FIRST run matches too (`6caea49b` law, `front-door.spec.ts` tripwire) — visuals-only, by
  construction and by referee.
- Node headless replay of `HOUSE.parBuild()`: `6caea49b`, 807 steps — byte-identical WITH mounts.

## Pixel gates — RE-BASELINED, stated

`shell-home-idle` (CI-enforced view, `?boot=house&post=on`): the furnished door moves **7.499 %** of
pixels vs the committed baseline (the diagram → the furnished cross-section is a deliberate
re-baseline act; every other view UNMOVED — 8/8 visual assertions green on darwin after the one
regenerated PNG). `tests/visual/darwin/shell-home-idle.png` regenerated here with
`GQA_UPDATE_BASELINES=1` (double-capture stability self-check); the STALE
`tests/visual/linux/shell-home-idle.png` was DELETED in the re-baseline commit so the CI
`linux-baselines` bootstrap job re-captures it on ubuntu in the same PR — the honest regenerate +
state + commit-with-the-merge flow, never `--theirs`.

## Honest seams

- The cross-section platter still wears the kitchen ground's warm tone (a deeper brown exists in no
  token row — mixing toward `shadowTint` lands peach); the fill-gain cap is the fix within the
  palette.
- Found but NOT fixed here (it would move the bathroom's pixels mid-lane): `bathroom` passes a
  `getHexString()` (no `#`) into a liquid material — the wet-floor tint silently falls back to
  white and THREE warns. Pre-existing campaign bug; the mount only made it loud. Fix site:
  `src/sets/bathroom/index.ts` (the `new T.Color(...).lerp(...).getHexString()` call).
- `World.dispose()` frees materials but NOT geometry buffers — the beat leaks GPU buffers across
  its one run per first visit.
- The doorframe grammar is the mock's (posts/lintel/sill), which at park altitude reads as a chunky
  dollhouse arch, not a door with leaves; a door-leaf pass is future art work, not funded here.
- The sill's star read is geometry's to carry but stays transparent DOM ink for now (a text mesh
  would be new visual language; the star NUMBER remains registry truth in the button's name).
- Per-deck `shots` re-aiming (the third spike camera item) stays unfunded; `eyeClear` is the solids
  law, not a framing canon.

## Refs

Code: `src/pages/house.ts`, `src/pages/house-sets.ts`, `src/camera/house-camera.ts`,
`src/ui/shell.css`, `tools/perf-house.mjs`, `tests/unit/front-door.test.ts`. Notes reconciled:
[[Modules/house]], [[Modules/camera]], [[Modules/render]], [[Modules/ui]]. Gates: unit 1016 green,
replay 30/30, visual 8/8 (darwin), downhill+front-door+a11y green, perf above.
