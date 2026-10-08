---
tags: [reference, spike]
livedocs: snapshot
---
# Steering spike 2026-10-09 — drivable yaw (ask #1): model, measurements, verdict

> [!abstract] Scope
> SPIKE on branch `spike-steering` — prototype + decision, **no campaign merge**.
> Answers the studio's oldest open ask (ask #1, open since stage 3: every banked line is
> rail-carried; `Concepts/Levels` §ask #1; the 2026-10-06 ladder-ladder decision note swept
> radii 0.6–2.5 m / bank 0–25° and found NO drivable yaw piece). Questions: where steering
> lives in the solve, whether the flag is zero-cost in the hash path, whether it WORKS, and
> what it costs. Everything below is measured on this branch, headless, `replayRun`.

## 1. Model — where steering lives without touching the wheel raycasts

Read whole first: `src/physics/sim.ts` (SIM_SCALE 10, `FIXED_DT`, `hashBodies`, the quantise
and poison-word discipline) and `src/physics/car.ts` (`supportStep` — strut/damper along the
contact normal, the rail feeler rays that are today's ONLY steering, the wishbone alignment,
anti-roll and friction-circle scrub torques; `applyRollingResistance`). The whole module's
one documented steering mechanism is the U-channel rail (`CAR.railSlack` note: "the CHANNEL
does the steering, not the tyres"), and every prior attempt at a tyre/scrub steering law
"either spiralled the car or pinned it at the joint" (comment in `CAR.latFriction`).

The cheapest honest model therefore does NOT live in the force laws at all — it lives in
`World.step()`'s **INPUTS phase**, the same phase the launcher triggers fire in
(`src/world/world.ts`): a new module `src/physics/steer.ts` applies a *steering event* as a
single impulse (chassis-local lateral `applyImpulse`) or a torque impulse about the chassis
up axis (`applyTorqueImpulse`) at a sim-step boundary, BEFORE any ray runs. Nothing in
`car.ts` changes; the raycast solve is byte-identical until an event is due. Events are
DATA (`SteerEvent { t, kind, sign, mag? }`) threaded through `WorldOptions.steerEvents` →
`ReplayOptions.steerEvents`, so `(level, build, seed, steerEvents)` is a complete replay —
no wall clock, no hidden state, the step boundary is the only clock. Impulse sites register
in the `WORK` energy-audit ledger like every other impulse site (the audit-exhaustion rule).

**Flag:** `steerEvents` undefined/empty is DEFAULT OFF — the step loop pays one
array-length test and no float op. Shipped levels never pass events; `World.reset()` zeroes
the fire cursor so a re-launch replays the script identically.

## 2. HASH LAW — the flag is zero-cost in the hash path (measured)

- Baseline (pre-change HEAD): `replay:all` **30/30 verified**; the level+hash table digests
  to md5 `ed3efb2a1a1227a3bc00017860199a52`.
- With the spike wiring in, flag off: `replay:all` **30/30 verified**, SAME md5 — every
  shipped hash byte-identical, kitchen03 still `a1a50d05`, feel-track path untouched.
- Mutation proof (sim-reading line flipped): the wishbone lag constant in `src/physics/car.ts`
  `const a = 0.3` → `0.32` → `replay:all` **6 rungs FAIL** (garage05 3.142 s > 3.05,
  porch01 1.133 > 1.10, porch04 1.108 > 1.10, +3) and EVERY rung's hash moves (garage01
  `d32417dc` → `223c8d5f`). Reverted → 30/30 and the original md5 restored. The suite sees
  sim changes; this spike cannot hide one.
- `tests/unit/steer.test.ts` pins both halves: an empty script hashes equal to no script at
  all, and a FIRED script is deterministic (equal twice) yet differs from the un-steered run
  (steering moves state — it must). Full unit suite green (763 tests).

## 3. Does it WORK — bench `steerbowl` (dev-only, not in campaign)

`src/world/levels/steerbowl.level.ts`: kitchen-convention −12°/0.30 m release → banked BOWL
(90° / 25° bank at r 0.8 m — the family where the passive car survives longest into the arc;
tighter bowls even at ideal-bank speed and gentler 9–15° banks were swept and die sooner) +
mirror counter-arc + 1.0 m run-out. `tools/steer-spike.mjs` prints the table, verifies the
hashes and draws the filmstrip (below).

**As a divergencer: YES, measurably and deterministically.** Same build, two runs:
no-steer `65473a3e` `fell@2.842s`, lateral event at t=2.0 (45 N·s sim ≈ 1 m/s world side
flick) `3f9bafa3` `fell@2.550s`; each replays twice hash-equal; the hashes differ, and the
traces visibly diverge inside the bowl: |Δpos| 0.019 m at t+0.1, 0.158 m at t+0.3, 0.668 m
at t+0.6; 40–124 film pixels per frame differ (car ink ≈ 70 px). The filmstrip
(`docs/explorations/steering-spike/filmstrip.png`, top-down x/z, row 0 no-steer red, row 1
steered blue, 0.18 s steps across the bowl) shows the steered car leaving the rail line and
falling inside the bank where the no-steer car holds it longer. Frames identical before the
fire time (0 px) — the flag-off prefix is exact, not approximate.

**As drivability (the actual ask): NO — the channel cannot cross the bowl.** Swept here,
every combination ended `fell` mid-bank (death x ≈ 2.15–2.4, baseline death x ≈ 2.16 —
steering changes HOW it dies, not WHETHER):

| family swept | count | crossings |
|---|---|---|
| geometry: h 0.15–0.3 m × r 0.25–2.0 m × bank 8–25° × 60/90/120°, passive | ~36 builds | **0** |
| single events: t ∈ {2.0,2.2,2.4} × lat/yaw × both signs × mag 1–120 | 24 | **0** |
| sustained holds (events 12–24/s across the bowl, mag 0.1–6, both signs) | ~38 | **0** |
| ideal-bank-speed bowls (entry tuned to √(rg·tan φ) per bowl, passive + steered) | 8 | **0** |

The failure is the one the stage-3 ladder probe already named: the car enters the arc, the
wall plough bleeds it (measured here: 1.48 → 0.70 m/s across the first third of the bank),
and below the bank's ideal speed the deck itself becomes a slope — the car slides down-bank
off the deck's inner edge. A chassis impulse cannot pay that bill: the energy is being
dissipated by the RAIL/solver interaction, i.e. track-side physics, not by chassis attitude.
Both candidate actuators (lateral, yaw) confirm this symmetrically. The rail-carried verdict
of every steering ask logged since stage 3 STANDS, and it now has a second, sharper
measurement: **even with a working input channel, the shipped cross-section does not convert
steering into drivability at any swept radius/bank/speed/actuation.**

## 4. COST ledger

- **Added sim cost/frame:** flag OFF — one array-length test per step, unmeasurable:
  kitchen03 par replay times 0.0486–0.0574 ms/step before vs after the wiring (noise band).
  Flag ON with 40 fired events — 0.0478 ms/step (same band; an impulse call on a body that
  was already receiving ~10/step). Realtime factor ≈ 20× either way; the 120 Hz budget
  (0.83 ms/step) is untouched.
- **Render cost:** `perf-table --probe-only` — kitchen03 56 draws/f, 20.8k tris, 16.70 ms
  frame, 8 programs — byte-comparable to `Reference/Performance Baselines.md` (the wiring
  adds no scene object).
- **Determinism risk:** float ORDERING is untouched when off (byte-identical tables above).
  When on, the added impulse lands in the inputs phase, before the force laws, so it enters
  the solver exactly once per event and the run stays replayable twice-equal (pinned in
  `tests/unit/steer.test.ts`). Risk is confined to the extra `t`-quantisation (`1e-12`
  boundary epsilon) and is the same class as the launcher-radius trigger: data-driven,
  clockless. No new float law, no new accumulator order → no new hash sensitivity.
- **UI truth (what does the player press?):** UNRESOLVED BY DESIGN — argued both sides:
  - *Build+drive is acceptable:* the run camera already owns attention mid-run; one input
    (A/D, or drag-left/right, one event per ~0.3 s not a held axis) is learnable in a bowl
    rung the way the launcher tap is; the par run stays a deterministic script, so replay
    and share stay honest — the event script rides the payload. The bowl rung then teaches
    "your line is yours to hold", which no rail rung can.
  - *Pure-build is load-bearing:* §1's promise is "build the line, trust the physics"; the
    result/callout/advice stack, par stars, share links, the death-clock learnability law
    (wrong builds must die at distinguishable TIMES — a live driver makes every death the
    player's, not the build's) and the aim-or-speak input law all assume the run has no
    hands. A steer verb also owes a pre-launch TELL (what tells the player a bowl is
    steerable at all? a per-level glyph would have to be TRUE per level, and a scripted
    `steer` affordance flag is level data nothing else reads) — every tell added here is
    another UI-truth surface to keep honest for every rung that never steers.
    The studio's design question is therefore not "can physics steer" (it can now) but
    "is the game the one where you drive" — this spike cannot answer that and deliberately
    does not pick.

## 5. Verdict — PARK WITH CONDITIONS

The input channel is proven: zero-cost off, deterministic on, hash-law-clean, and it moves
the car on a bank visibly. What is NOT proven is the ask itself — making a banked yaw arc
drivable — and the sweep says the blocker is not the missing input but the channel physics
itself (wall-plough energy bleed + down-bank slide at sub-ideal speed). Adopting today buys
a verb that changes HOW a bowl run dies. Conditions for reopening:

1. **Track-side first:** a rail/wall work-honesty pass on banked arcs (the plough is
   measurable — 50 % of KE in ~0.5 s inside the first third of a bank; start from the
   `WORK`-ledger `rail` site in `supportStep`) plus either a down-bank catch (rail reach at
   the low side) or a banked-speed design rule (rung bowls sized so arrival ∈ [ideal,
   ~1.3×ideal]). Gate: a passive car COMPLETES the `steerbowl` bank before any steer key
   ships — until then there is nothing to steer.
2. **Design ruling first:** a studio decision that the game may be build+DRIVE (or that a
   bowl rung is a special scripted-attention mode), argued against §4's pure-build list
   above — with the pre-launch tell designed, not improvised.
3. **If adopted later, the migration re-anchors NOTHING:** `steerEvents` stays out of level
   data (World option only); campaign levels pass none, so every shipped hash is frozen by
   construction (`replay:all` 30/30 stays the gate); steering is OPT-IN per rung via a level
   affordance flag read ONLY by UI tells; share payloads gain an optional script field
   (v3, old payloads byte-unchanged); `steerbowl` remains dev-only.

If condition 1's gate is ever met with steering STILL absent, the ask is closed as REJECTED
by geometry (bowls get sized to the passive-car window instead) — worth stating now so a
future rail pass cannot quietly redefine "drivable" as "steerable".

Files this spike added (branch only): `src/physics/steer.ts`,
`src/world/levels/steerbowl.level.ts`, `tools/steer-spike.mjs`,
`tests/unit/steer.test.ts`, `docs/explorations/steering-spike/filmstrip.png`; wiring edits
`src/world/world.ts` (inputs-phase fire, default-off) and `src/replay/replay.ts`
(passthrough). See [[Modules/physics]], [[Modules/world]], [[Modules/replay]],
[[Concepts/Levels]] (ask #1), the 2026-10-06 blocked-rung decision note.
