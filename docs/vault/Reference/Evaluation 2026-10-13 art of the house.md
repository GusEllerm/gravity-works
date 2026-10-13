---
tags: [reference, evaluation, art, house]
livedocs: snapshot
---
# Evaluation 2026-10-13 — art of the house (the named gap between 8 and 9)

> [!abstract] Method
> Worktree `gw-h6`, branch `eval-h4-art`, evidence tree `203356c` (tree of `main` + captures only).
> `npm run build` + `vite preview` **:5110**, fresh profiles, plus `tools/render.mjs` stills at
> 1600×900 DPR 1. Frames: `Sessions/eval-art-house/` (home at 1600×900 / 1280×633 / 430×860,
> `house-run-t*` downhill frames, `campaign-<room>04-t*` same-deck run frames, `still-*-establishing`
> ratified set stills, `menu-*` crane frames, `mock-window-doorframe*` the item-5 mock through the
> new dev scene `src/dev/scenes/house-window-mock.ts`). Grounding: [[Sessions/2026-10-13 Freeform
> program close]] §below-9 item 1, [[Concepts/Art Bible]], [[Reference/Canonical Cameras]],
> [[Reference/Downhill Spike]] §3 (fp-downhill tip `dd52880`), [[Modules/house]].
> **Headline: the house renders as a diagram because THE HOUSE PAGE MOUNTS NO SETS AT ALL.**
> The schematic is not a lighting tuning or an instancing compromise — `src/pages/house.ts` builds
> `World` over `HOUSE` (51 track pieces + the slab + the Lambert `table`), and nothing in it ever
> calls a set builder or a `LightingRig`. The spike's "six ratified sets mounted" sentence was
> true of the SPIKE scene (`src/dev/scenes/freehouse.ts`, `downhill-frame.ts` on `fp-downhill`);
> the product page inherited the physics and the camera and none of the art. Every trick the studio
> paid for lives inside the six `src/sets/*/index.ts` builders, which the house never invokes.

## 1. The schematic dissected — cause → evidence frame → cost

The verdict's phrase ("paper-card windows on a schematic") is exactly right; here are the causes,
priced against the ratified sets' trick inventory (`tap-drip` / `mug-ring-film` / crumb trail and the
tap's rig shadow in `src/sets/kitchen/index.ts`; `oil-drip-film-*` in `src/sets/garage/index.ts`;
`wet-drip-film-*` (DRIPS) in `src/sets/bathroom/index.ts`; the window sill + `drip-line` in
`src/sets/porch/index.ts`). **None of these meshes exists in a single house frame** — the absence
cause is never instancing cost and never "setPlacement at an offset loses the dressing pass": the
dressing passes are plain code inside each set's `build`, deterministic at any transform. The cause
is that the house pass never calls them.

| # | Cause (the mechanism) | Evidence frame | Priced against the sets' grammar |
|---|---|---|---|
| A | **No sets mounted.** `house.ts` creates the world and stops: no `buildGameSet` (the campaign shell's mount, `src/pages/mount.ts`), no `SET_TOKENS` background, no painted-wood table swap, no car rig — the downhill's hero car is the World's RED PROXY BOX (the small blue rig in the frames is the par ghost) | `home-1600x900.png`, `house-run-t2100.png` (slivers + one grey slab), `house-run-t5200.png` (red dash far-left = the player) | The whole trick inventory is MISSING because the pass is ABSENT, not cheapened. Cost: per-room wiring + the dollhouse cut (§5) — the mock proves it is a mount, not an art program. |
| B | **Flat light.** World's default rig — `AmbientLight 0.85` white + white `DirectionalLight 1.1` (`src/world/world.ts` visuals), no `createLightingRig`, no `applyKeyLight`, and `shadowMap` is enabled in the harness but never on the house page's own renderer | `campaign-kitchen04-t1000.png` (gold bands, tinted shadow under the counter) vs `house-run-t2400.png` (shadowless rails floating on uniform cream) | The sets' one-strong-light law (§Light) is the cheapest trick of all and it isn't running. Cost: one warm key + per-room `applyKeyLight` at frame altitude. |
| C | **The void has no air.** `menuPose`/`homePose`/`beatPullPose` all return `fog: 0` (`src/camera/house-camera.ts`); the 0.11 `CRANE_HAZE` breathes ONLY on a run's legs. The home and menu frames are 9 m of flat `#efe0c8` — art-rubric line 8 (no uniform ambient, no gradient nothing) is met only in the failure direction: uniform EVERYTHING | `menu-kitchen-t0.png`, `home-1280x633.png`; contrast `house-run-t2400.png` (the leg's haze is the ONE atmospheric read in the whole era) | The build-view fog already exists and the farewell already proved haze sells the between. Cost: one density at the home pose only. |
| D | **Frame altitudes expose what per-set cameras hide.** The dwell eye sits 3.1 m out (`HOUSE_FRAMING.distance`) at deck altitude, vs the campaign's 0.25 m trail law (`RunCamera.TRAIL`) and ~0.4–0.8 m canonical rigs; there is no `setCameraSolids` house-wide, so the eye floats in the void the spike named ("floating floor discs, prop undersides, the void under the stair" — §3, fp-downhill tip) — in the product it's worse than the spike's wording: nothing floats, because nothing was mounted | `campaign-garage04-t1000.png` (set floor fills the frame) vs `house-run-t1200.png` (two rail slivers over paper) | The spike priced this honestly: "per-deck framing canon + a house-wide solids set + the cross-section dressing the AD would author for the home screen anyway". Still unfunded. |
| E | **The windows are DOM paper.** Six white `<button>` cards (`.gw-house-window`, `src/ui/shell.css`) projected onto the decks — labels ON the schematic, not holes INTO rooms; at 1280×633 they stack, at 430×860 they pile into a file drawer over a vanishing scene | `home-1280x633.png`, `home-430x860.png` | The sill star-line ("★ 8/15") is already the right instinct — it just rides CSS. Cost: geometry + transparent hit targets (§5 mock). |
| F | **The grey slab.** The scaled Lambert `table` plane renders as a grey parallelogram (the T1.2 "grey broken floor" the campaign shell fixed by swapping in painted wood — the house page scales the plane but never pays that fix) — grey is on the never-list | `home-1600x900.png`, `menu-porch-t0.png` | One material swap the boot shell already contains. Cost: trivial. |

## 2. Per-set parity — campaign frame vs house frame (same deck, 0/4 tricks survive)

Campaign column = the ratified set still (`still-<room>-establishing.png`, `render.mjs` through the
production set scenes) cross-checked against the same deck's campaign run frame
(`campaign-<room>04-t1000.png`); house column = this branch's `house-run-*` / `home-*` frames of the
SAME `04` deck in the section. Score = surviving art signals (set geometry / key direction+shadow /
room-palette floor / dressing trick) out of 4, normalized to /10.

| Set | Campaign frame shows | House frame shows | Parity |
|---|---|---|---|
| Garage | bench + mezzanine grammar, oil-drip films, epoxy slab (`still-garage-establishing`, `campaign-garage04-t1000`) | two rail slivers + slab corner (`house-run-t500/1200`) | **1/10** (orange track only) |
| Kitchen | bowl + tap + frozen `tap-drip`, mug-ring film, crumb trail, gold key (`still-kitchen-establishing`, `campaign-kitchen04-t1000`) | ribbon of track over cream (`house-run-t2100`) | **1/10** |
| Bedroom | nightlight palette, floor disc + washers, dresser props (`still-bedroom-establishing`, `campaign-bedroom04-t1000`) | floating rails, no floor (`house-run-t3000`) | **1/10** |
| Bathroom | mint tile room, wet-drip films, tub row (`still-bathroom-establishing`, `campaign-bathroom04-t1000`) | rails + a thread of orange (`house-run-t3900`) | **1/10** |
| Garden | dusk sun rig, hose coil, patio disc (`still-garden-establishing`, `campaign-garden04-t1000`) | never in a run frame (runs die at bathroom); a sliver at home | **0/10** |
| Porch | rail stoam, window sill props, `drip-line` (`still-porch-establishing`, `campaign-porch04-t1000`) | a cup sliver bottom-right of the home pose | **1/10** |

**Same set, different game? No — same TRACK, no game.** The honest answer to the item-2 question:
the drift is not the lighting rig "at frame altitudes" (no rig runs) and not a camera exposing
undersides (there are no undersides to expose — the drift is absence). Where the campaign run frames
DO thin out at 1 s (bathroom/garage read sparse even mounted — the run camera aims down-track), that
is the known run-camera law, not house drift; the ratified stills remain the parity bar.

## 3. Crane frames — diagram or film

The MENU frames (`menu-kitchen-t0.png`, `menu-porch-t0.png`, all three home sizes) are unambiguously
a DIAGRAM: no shadow, no fog, no set, thread-thin track, DOM labels as the only nouns. The run's
HAND-OFFS are the only moving pictures the era makes — the leg lift + the 0.11 haze sine
(`house-run-t2400.png`) genuinely reads descent, which is the spike's §3 finding reproduced exactly:
"the fog legs sell the between". Verdict: menu = diagram; hand-offs = diagram in motion — the fog is
the era's one surviving trick, and it fires only between rooms, never where a stranger sits.

## 4. The connectors — fixtures or scar tissue

FIXTURES, visibly: straight → bare ballistic `drop` → straight, 12 cm stubs that disconnect
mid-air with no leg, no skirt, no catch geometry (`house-run-t1200.png` — two brown slivers and a
gap). The spike called them fixtures and the product shipped the word verbatim. They are the
physics-correct catch (sweep law §2b) and that law must not move; the scar tissue is purely visual —
the drop arc is a kit piece and could wear a housing the way the booster piece already does.

## 5. Windows-as-UI — the proposal, rendered

The mock (`node tools/render.mjs --scene house-window-mock --shot establishing` →
`mock-window-doorframe.png`; `--param voidfog=on` → `mock-window-doorframe-voidfog.png`) mounts the
six sets at their decks (translation-only, each `04`'s own placement row) and makes THE WINDOW = THE
ROOM'S OWN DOORFRAME: painted-wood posts in the room's dominant, an accent lintel, and a forward
sill plank — the sill the `windowSillLine` star read belongs on as geometry; the DOM button becomes
a transparent hit rect over the opening. Portholes-in-a-wall and a generic dollhouse wall were the
rejected alternatives: neither is in the sets' material language, and a wall occludes the orange
constant. Honest costs the mock proves: (a) the DOLLHOUSE CUT — a set's big geometry (splashback,
walls, floor discs, slabs > ~0.85 m) reads as flat colour bands at section altitudes, so the mount
needs a per-set cull/framing rule (the mock culls by mesh bbox; the per-deck shelf in the room's
`ground` token replaces the disc); (b) the void-fog knob at 0.055 washes the section — the home-pose
density must sit near 0.015–0.02 (fog-free mock stays the reference frame).

## 6. Three-line art plan for the house era (ranked by impact/cost)

1. **Per-set dressing pass re-runs at frame offsets** — mount the six ratified sets on the house
   decks exactly as their `04`s mount them (translation-only, the dollhouse-cut rule from the mock)
   so the ENTIRE ratified trick inventory — tap shadow, drips, sill props — appears in every house
   frame with zero new visual language; highest impact at medium cost (one mount call + one cull
   rule per set), and it makes causes A, D and F disappear with it.
2. **The void gets the build-view fog at the home camera only** — give `homePose`/`menuPose` a small
   `FogExp2` density (~0.02, `0` at run dwells so the physics footage stays untouched) so nine
   metres of section read as air instead of paper; lowest cost in the codebase (one field per pose),
   visible in the first frame a stranger sees.
3. **Window = the room's own doorframe mesh** — replace the paper-card fill with each room's
   painted-wood doorframe (dominant posts, accent lintel, a real sill for the star line) at the deck
   centre, the DOM button demoted to a transparent hit target, so the cross-section stops wearing a
   legend and starts wearing architecture; medium impact at medium cost, and it fixes the small-screen
   pile-up because the windows occupy pixels the rooms already own.

## Honest seams

- The `?harness=1` stills path enables `shadowMap` and per-set rigs; the game shell uses toon-band
  tints + a shadow-catcher table instead (`src/boot.ts`), and the house page has NEITHER — cause B
  is stated from the frames and the source, not from a shader dump.
- Campaign run frames at t=1 s are sparse for some rooms even mounted (the run camera's down-track
  aim); parity scoring therefore leads with the ratified stills, with the run frames as corroboration.
- The mock is a proposal render, not a shipped mount: it deliberately ignores the dollhouse-cut
  naming (bbox rule, not named meshes), which a production pass should fix; the run physics, hashes
  and the 37 anchors were not touched by anything here.
