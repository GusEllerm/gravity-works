---
module: src/juice
tags: [module, feel]
status: current
---

# Module: juice — the §7.4 trigger events

`src/juice/juice.ts` is the whole module: one class (`JuiceFeed`) and one
constants bag (`JUICE`). It exists so the renderer and the audio designer
have a SINGLE source for the §7.4 effects — and so "does this juice change
the physics?" has a testable answer: **no, bit-for-bit.**

## The rule: physics is the clock, juice is the echo

The feed READS and never writes. Consumers call `feed.step(prev, next)`
with the two consecutive `WorldState` snapshots around a sim step (plus
`feed.pieceSnapped(at, def)` from the builder UI — the one event not
derivable from run state), and it emits `JuiceEvent`s carrying the physical
numbers behind each effect, so animation and sound scale off measurement,
not guesswork:

| hook | trigger, derived from state | numbers on the event |
|---|---|---|
| tyre squeal | `grounded && speed > 1 && slip > 0.17 rad`, re-trigger ≤ 20/s | slip rad, m/s, intensity 0..1 |
| landing squash | airborne→grounded (≥3 airborne steps), approach `velocity.y` | world impulse N·s, peak scale, 120 ms |
| dust puff | same, above the higher `0.02 N·s` thud floor | impulse, puff radius m, 120 ms |
| piece snap settle | builder `pieceSnapped()` call | 250 ms settle, 6 % overshoot |
| hazard tell | velocity ray reaches a zone box within 350 ms | lead ms, gripFactor, zone centre |
| chime | `running` → terminal status | outcome, time s, speed m/s |

Mass assumption: `JUICE_CAR_MASS_KG = 0.04` — the 40 kg sim chassis at
`SIM_SCALE³`, consistent with `toWorldImpulse`'s S⁴ rule and with the feel
harness's measured 0.061 N·s landing.

## Calibrated against measured runs, not vibes

Thresholds came from probing real `World` runs (`tests/unit/juice.test.ts`
re-runs the same routes):

- **Squeal floor 0.17 rad (≈9.7°).** Rolling lines top out at **8.5°** of
  re-align slip (peak), averaging ~3° — silent, correctly. The L04 par
  landing skids the wheels to **44.8°** while they re-align — squeals. The
  gap between those two measurements is the threshold's home.
- **Landing impulse.** The L04 par flight arrives at 1.67 m/s →
  `0.04 kg × 1.67 = 0.067 N·s` → squash scale 0.35 (clamped ≤ 0.4) + a
  0.084 m dust puff. Same order as the feel rig's 0.061 N·s.
- **Tell lead 350 ms.** At the L04 launch speed (~2.3 m/s) that is ~0.8 m
  of visible drip before the wheel crosses the zone face — the test
  asserts `t(tell) < t(grip drops below 1)` on the ground line, i.e. the
  affordance genuinely precedes the hazard, and the tell is the LEVEL
  telling (it fires on the par line too, which never feels the grip —
  the tap drips whether or not you touch the patch).

## Reduced motion

`reducedMotion: true` collapses every ANIMATED event (squeal, squash,
dust, snap settle) to **nothing**, and keeps the purely informational
markers (hazard tell, chime) as **instant** markers — `durationMs: 0`.
It is a constructor flag, so it is decided per feed (settings menu sets
it once).

## Hash neutrality — the contract with physics

`JuiceFeed` touches no Rapier object and no world field; worse, it must
not even branch on them. The test pins it the hard way: the same L04 par
run driven WITH the feed attached hashes `7adc07a8` — identical to the
juice-off run and to the shipped par hash.

## The consumer landed (program T1.1, stage 7)

`src/juice/layer.ts` (`createJuiceLayer`) is the shell-side consumer: the
boot render loop drives `layer.step(prev, next)` with the frame sink's own
snapshot pair (`World.states()`) once per sim step, and `layer.snap(at,
def)` is the builder's hook in `builder.onChange`. The layer PRESENTS and
never writes physics: `landingSquash` animates the car rig's squash pivot
on a 120 ms WALL envelope (and fires the `onLanding` hook the shell routes
to the landing THUD in [[sound]]), `dustPuff` blooms a pooled film at the
event position, `snapSettle` pops the just-placed piece group 6 % proud for
250 ms — a mesh scale, never a transform any hash can see. `zoneAt` is the
cheap surface read (point-in-box over the level's plain zone data) that
picks the landing's wet/oil voice. The rig/pool/pose group follow the R7
lift-before-`World.dispose` law, so the leak gate sees zero drift.

Reduced motion (`src/ui/motion.ts` law, `reducedMotionActive`): every
ANIMATED presentation snaps to its still frame — no squash, no dust, no
pop, no wheel spin. The feed itself runs UNreduced in the shell so the
landing's SOUND hook keeps firing; the flag decides the pixels only — the
same information-over-motion split as `durationMs: 0` above. Hash
neutrality is re-proven through the layer, not just the feed
(`tests/unit/juice-layer.test.ts`: the L04 par run driven THROUGH the
layer hashes like the bare run; squash animates and eases to exactly 1;
reduced motion stays still while the thud still fires).

Still not here: no squeal voice (the 20 Hz re-trigger would slam
`RUN_VOICE_CAP` — it needs a slower voice-map row first), no drip-tell
visual, and no audio for the booster impulse. `squeal`/`hazardTell`/
`chime` events reach the shell through `onEvent` unchanged when they are.

Depends on `src/world` (types only — no runtime import beyond math; the
layer adds `three` for the puff film). Guarded by
`tests/unit/juice.test.ts` + `tests/unit/juice-layer.test.ts`. See also
[[hazards]] (zones feed the tell), [[feel]], [[render]], [[sound]].
