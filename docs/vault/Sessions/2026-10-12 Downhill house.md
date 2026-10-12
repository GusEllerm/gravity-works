---
tags: [session]
livedocs: snapshot
---
# 2026-10-12 Downhill house

Level Designer, build 1 of "THE DOWNHILL greenlit" (branch `dh-house`, ports 5040+).

## What shipped (artifacts 1–6)

1. **`src/world/levels/house.level.ts`** — one new id, `house`, APPEND-ONLY. Six ratified `04`
   decks on the canon altitudes (3.432/2.745/2.059/1.373/0.686/0.000 — re-derived from live
   campaign y-stats in `tests/unit/house-levels.test.ts`), five authored drop-and-catch legs
   (straight → authored `drop` → straight, 2 cm run-in seat; ballistic only), the PORCH cup LAST
   so the outcome law reads exactly one cup. The world floor is `Level.floor` — the spike's 60 m
   cruise slab deliberately SHRUNK (top −0.75, edge 2 m past the frame): the spike's own tail
   ("rollout for 25 s") is the UX this cut refuses; a missed line rolls off the world in ~2 s and
   `observe` ends the run honestly (`fell`). `replay:all` 30/30 verified at every commit; campaign
   pars/atlas rows byte-identical (the ONE diff `npm run pars` surfaced — bedroom-sandbox 3.15 →
   2.75 — is PRE-EXISTING drift on main: main HEAD itself replays 2.733 s; the row was restored to
   the shipped bytes to honor "campaign data byte-identical", the drift is main's to own).
2. **The input law, product**: `Level.inputs` — wind every 60 steps along the velocity, governed
   at 2.5 m/s, launch 0.4 — applied inside `World.step` in the spike instrument's EXACT order;
   `FreeHouse` vs product `World` measured step-IDENTICAL over 600 steps (0.00e+0 dev). THE
   RECEIPT: `6caea49b` / 807 steps, stable twice headless (unit + e2e + atlas row); par 6.75 s,
   51 pieces; wind-off probe ≤ 1 room (the law is not optional).
3. **Rooms collected**: read-only parcel probe (moving capture + terminal stall branch, the fp
   law); result bar "4 rooms · 6.7 s — you stopped at the bathroom"; `settings.records.houses`
   personal best (`readHouseBest`/`recordHouseRun`, schema-tolerant ride, SAVE_VERSION 2); par
   ghost default ON (the existing afterlife law classifies every off-ladder id — no new setting).
4. **Tours**: each room window links its five rungs at the exact `?level=<room>NN` bytes; locked
   rungs are spans with a lock, not dead links. House family (`?level=house`, `&room=`, the
   launch affordance) recorded in `tests/e2e/goto.ts`.
5. **Camera v1**: menu = crane parked at the porch; the run plan imports the farewell's
   DWELL/MOVE/HAZE onto `roomGraph` — 3 hand-offs on a 4-room run, the two-hand-off floor is a
   theorem, not a tune. Kept honest: no set props, no per-deck framing canon yet (the spike names
   those as per-room passes); the frame reads as a staircase descent in cream haze.
6. **e2e** `tests/e2e/downhill.spec.ts`: the page's run verifies its own hash against this
   process's `replayRun` (the determinism family's wiring), 4 rooms ≥ 3, second release hashes
   SAME (seating law, live), result copy, best in the save, ghost on by default, tour bytes
   unchanged. 7/7 green on port 5042.

## Findings for the director

- THE RECEIPT is `6caea49b` (atlas-appended). THE NUMBER holds in product: the canonical frame
  physics-approves 4 rooms — garage@1.0s → kitchen@1.9s → bedroom@2.8s → bathroom@3.7s.
- One probe anomaly, disclosed: the very first page-load run on a cold server hashed `8821d5b5`/809
  steps; five subsequent loads, including identical-pattern reprobes and the e2e under 7-worker
  load, matched node `6caea49b`/807 every time. Not reproduced, not papered — the e2e now asserts
  first-run-equals-node on a fresh profile every CI run, which is the standing tripwire.
- Pre-existing on main: `pars.json` drifts from `gen-pars` at bedroom-sandbox (no `pars --check`
  gate in CI to catch it). Not mine to fix here; named.
- Porch finding (spike §2c) inherited honestly: the porch cup is drive-past geometry at downhill
  speed; the authored-catch amendment to the frame is a connector-pass task, logged in the house
  note.
