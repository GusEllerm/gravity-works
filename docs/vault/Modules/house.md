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
- `src/pages/house.ts` — the `?level=house` page: `bootHouse` (routed by `src/boot.ts`’s
  `?level=` branch before `bootGame`, so the campaign shell is untouched), `houseResultLine`,
  `houseStatusLine`, `houseBestLine`. Launch-only chrome (the input law: RELEASE is the whole
  control surface), the live ROOMS readout, the result bar “N rooms · T s — you stopped at the
  <room>”, the device best line with the honesty sentence verbatim, the par ghost default-ON (the
  page asks `parGhostRule` with `surface = afterlife` — the house IS the afterlife), the debug
  seam `__gwHouseState`, and the room windows: six `<section data-room>`s whose tour links are the
  UNCHANGED `?level=<room>NN` bytes of the level select (locked rungs stay locks, not dead links).
  `?level=house&room=<id>` re-parks the menu camera (presentation only); the family is recorded in
  `tests/e2e/goto.ts`.
- `src/camera/house-camera.ts` — camera v1: `menuPose` (the crane parked at the porch) and the
  run's dwell/leg/dwell hand-offs read off `roomGraph` and the live parcel approvals.

## The laws it holds

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

## See also

- [[Decision Log]] "THE DOWNHILL greenlit" (the law), [[Reference/Downhill Spike]] (the frame
  table, THE NUMBER, the camera study), [[Modules/world]] (the gated floor/wind additions),
  [[Modules/camera]] (the house camera), [[Concepts/Levels]] (the tours).
