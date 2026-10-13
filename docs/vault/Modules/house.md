---
tags: [module, house, downhill]
livedocs: live
---
# house

> [!abstract] Role
> THE HOUSE — build 1 of "THE DOWNHILL greenlit" (Decision Log 2026-10-12): the six ratified sets
> mounted as ONE world at the canon deck altitudes, joined by authored drop-and-catch connectors,
> driven under THE INPUT LAW, scored by ROOMS COLLECTED. One new level id — `house` — joining the
> registry APPEND-ONLY: the 37 anchors do not move, the campaign stays byte-identical, and the 30
> rungs are what the greenlight entry proved they already are: the TOURS (`?level=` per window).

## What lives where

- `src/world/house-frame.ts` — the CANON table and the layout: `DESCENT_ORDER`, `deckAlts`,
  `houseLayout`, `roomGraph`, `approveParcels`. Deck altitude = `(5 − rank) · STEP`,
  `STEP = INTERNAL_DROP + dropH` (the campaign's own measured room-height + one kit `drop`),
  porch 0 → garage mezzanine top; `tests/unit/house-levels.test.ts` fails on drift from the
  ratified rows (3.432 / 2.745 / 2.059 / 1.373 / 0.686 / 0.000). The connectors are FIXTURES:
  straight run-out → authored `drop` (ballistic gap only, no `curve`/`bank` — the steering veto)
  → straight run-in seated 2 cm off the next deck's socket; the sweep's law that a `landing`
  trough AFTER the drop makes the catch WORSE is why the `drop`'s own arc is the whole catch.
- `src/world/levels/house.level.ts` — `HOUSE`, `HOUSE_ID`: one `Build` of 51 pieces (six decks,
  five legs, deterministic order) with the PORCH `finishCup` LAST — the only cup the outcome law
  reads, so the full house finishes and everything else stops or falls, mid-descent approvals
  notwithstanding. `parStatuses` = `finished`/`stalled`/`fell`: the ways a downhill run COMPLETES.
- `src/pages/house.ts` — the `?level=house` page AND the front door (build 2): `bootHouse(root, params, opts?)`
  (routed by `src/boot.ts`: the `?level=house` branch as before; the BARE route with
  `{ home: true }` — the home screen; `?boot=rung` is the recorded address of the old rung
  front end, `?boot=house` names the home explicitly — the family lives in `tests/e2e/goto.ts`),
  `houseResultLine`, `houseStatusLine`, `houseBestLine`, plus the front-door purs: `windowAriaName`
  and `windowSillLine`. Launch-only chrome (the input law: RELEASE is the whole control surface —
  on the home screen the house run IS the front-door act), the live ROOMS readout, the result bar
  “N rooms · T s — you stopped at the <room>”, the device best line with the honesty sentence
  verbatim, the par ghost default-ON (the page asks `parGhostRule` with `surface = afterlife` —
  the house IS the afterlife), the debug seam `__gwHouseState`, and the room windows: in the
  addressed page, six `<section data-room>`s whose tour links are the UNCHANGED `?level=<room>NN`
  bytes of the level select (locked rungs stay locks, not dead links); in HOME MODE the same tours
  live INSIDE `#gw-house-windows` — one absolutely-placed `<button id="gw-house-window-<room>">`
  per room projected through the parked crane (`placeWindows`, px off the canvas box), named
  `kitchen, 5 rungs, toured, 8 of 15 stars` / `… not toured yet` (`windowAriaName` — stars folded
  per room from `progress.stars`, the farewell-tally numbers), toured rooms wearing `★ 8/15` on
  the sill (`windowSillLine`), Tab reaches every window and Enter opens it (`aria-expanded`; the
  camera parks at that deck — the `?room=` gesture, presentation only), and the corner chrome
  keeps its corners (the daily chip `#gw-daily-board` → `?daily=1`; the LINES corner
  `#gw-lines-corner` opening the level select's own `createLinesTab`). THE PREMISE BEAT lives
  HERE (law 4): `HOUSE_BEAT` + `HOUSE_BEAT_LEVEL` (the house with the wind OFF in the data and
  one legal launch push — every force still in replayed data; a stepped `World` on its own scene,
  disposed at the beat's end, recording nothing): the crane pulls back from the KITCHEN window
  (`beatPullPose`), the car free-rolls one room and dies in the next (garage @ ~1.4 s, kitchen
  @ ~3.2 s, measured), one still beat, then the chrome returns; `src/pages/intro.ts` keeps the
  audience law and the ONE seen flag (`markPremiereSeen`). `?level=house&room=<id>` re-parks the
  menu camera (presentation only); the family is recorded in `tests/e2e/goto.ts`.
- `src/camera/house-camera.ts` — camera v1 + the door's wide stance: `menuPose` (the crane parked
  at a room's deck), `homePose` (the SAME crane pulled to frame the whole cross-section — build
  2's menu camera, pure over the deck bounds), `beatPullPose` (kitchen window → wide), and the
  run's dwell/leg/dwell hand-offs read off `roomGraph` and the live parcel approvals.

## The laws it holds

- THE FRONT DOOR (build 2, law 3 — the irreversible UI act, stated not quiet) — the BARE route is
  THE HOUSE, rendered: cross-section, six windows as the interactive level select, the house run
  as the front-door act; `?boot=rung` is the recorded old front end and every non-visual spec
  names it explicitly through `tests/e2e/goto.ts` (visual specs opt consciously, per harness
  doctrine); the per-surface re-baseline enumeration lives in `Sessions/2026-10-12 Front door.md`.
  The farewell's door 1 gained “the whole house” as what it opens on (`#gw-farewell-house`,
  `?level=house`, honest copy, gated on the registry) — law 4: REWIRED, NOT DELETED; the crane
  pass and the three doors keep their promise verbatim.
- THE RECEIPT — the canonical downhill build replays with the same hash twice headless
  (`6caea49b`, 807 steps, 4 rooms physics-approved: garage → kitchen → bedroom → bathroom); the
  run IS its own receipt because every force that moves the car is in the replayed data. The
  reference run's honest par is in `src/world/pars.json` (51 pieces, 6.75 s) and its atlas row
  appended alongside the 30 anchors.
- THE INPUT LAW — `house` declares `Level.inputs` (`windEvery: 60`, `windDeltaV: 1.2`,
  `governor: 2.5`, `launchSpeed: 0.4`); `World` applies the wind in the spike instrument's exact
  system order, step-keyed — the spike's `FreeHouse` and the product `World` were measured
  step-identical. Gravity alone dies in the garage (the wind-off probe approves ≤ 1 room): the
  input law is not optional.
- ROOMS COLLECTED — a room's parcel threshold (`Level.parcels`, each room's own `04` cup placed)
  is APPROVED by physics under the shipped capture law via the READ-ONLY probe `approveParcels`
  (moving capture, plus the stall branch on the terminal sample). Approvals never end a run and
  never move a hash. The result line reads "N rooms · T s — you stopped at the <room>"; the
  personal best rides the save under `settings.records` (the "this device" law,
  `readHouseBest`/`recordHouseRun` in `src/save/records.ts`). Rooms replace stars HERE ONLY — the
  campaign keeps its star law untouched.
- APPEND-ONLY — `house` is nobody's rung: off `CAMPAIGN_LADDER`, off the rooms table, invisible to
  the daily fold; `replay:all` 30/30 byte-identical is the standing referee. The world floor slab
  (`Level.floor`, top at −0.75, ending 2 m past the frame — the spike's 60 m cruise slab is NOT
  inherited) is a PHYSICAL collider, the tunnel law; the fell line is the spike's departure law.

- SOUND AT THE DOOR (H2 program, 2026-10-13) — the bare house route is no longer silent: `bootHouse`
  calls `mountSound` (`src/sound/mount.ts`, the shared page wrapper) and feeds the engine from the
  page alone — a read-only crane-position sink into `setScreenSpeed`/`setUpAxisY` (≤ 20 Hz, the
  camera's own sampling law, `upAxisYOfQuat`), `beginRun`/`finishRun` + `launch` around `probeLaunch`,
  and ROOM-BED switches minted at `probeStep`'s parcel crossings (launch → addressed room, catch →
  released, terminal → `startRoomBed` once, idle = `kitchen` at the home page / `porch` when a room is
  addressed). The sim stays sound-free; the firewall test walks the resolved import graph. The
  premise beat keeps its ONE silence BY DESIGN but no longer by accident: no engine is constructed
  during the beat, the beat swallows the autoplay-unlock gesture, and at `endBeat` the page replays
  that gesture into `mountSound({ viaGesture })` — one AudioContext ever, chip included, and the
  beat's own click is what opens the room (hand-off proof in `tests/e2e/sound.spec.ts`).
- The page carries the `gw-home` class (`document.body.classList.toggle('gw-home', !addressed)`), so
  the home page can host the daily chip in the FLOW beside the wordmark instead of pinning it over
  it (the disjoint-rect law; see [[Modules/ui]]).

## See also

- [[Decision Log]] "THE DOWNHILL greenlit" (the law), [[Reference/Downhill Spike]] (the frame
  table, THE NUMBER, the camera study), [[Modules/world]] (the gated floor/wind additions),
  [[Modules/camera]] (the house camera), [[Concepts/Levels]] (the tours).
