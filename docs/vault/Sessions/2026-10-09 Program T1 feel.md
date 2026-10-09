---
livedocs: snapshot
tags: [session, program, stage-7, feel, sound, render]
---
# Program T1.1 feel package (engine artist) — car rig IN-GAME, juice wired, thud landed

Worktree `gw-y1`, branch `p2-feel`, base `f37c57d`. One coherent delivery of
[[Action Plan 2026-10-09]] T1.1 against the design evaluation's §4/§5 ("the car you drive is a red box",
"the landing is SILENT", "mid-run hazard contact is silent"): the ratified car on screen, the written
`JuiceFeed` finally consumed, and the played frame given its THUD. Ports 4590 (lane) / 4591 (baseline
server).

## 1. The ratified car-a rig IN-GAME (render layer only)

New `src/render/car-rig.ts` — `createCarRig(tokens)` is the single factory for the ratified sedan
(beveled `toyBlock` body, proud cream stripe band, raked cabin + glass + roof-rack bars, four wheels with
spinning hub caps). `src/dev/scenes/cars.ts` now builds `car-a` THROUGH it (same meshes, same order — one
source of truth), and `src/boot.ts` mounts the same rig in the game shell: a pose group driven by
`World.carPose(alpha)`, the rig hung at `-CAR_GROUND_LIFT` (0.041 m = the strut-rest chassis height,
`suspRest 0.16 + |wheelY| 0.25` ÷ `SIM_SCALE`) so the wheels seat on the deck. The `World` fallback box
stays mounted but HIDDEN (`carMesh.visible = false`) — headless and every scene-graph probe untouched.
Wheel spin is a render-side omega read off the SAME on-screen motion the roll voice gets, divided by
`CAR_SPIN_DAMP` 12 (the physical ω of the 9.5 mm wheel strobes at 60 fps; damped it reads ~1.7 rev/s at
2 m/s); reduced motion parks it. The rig is created once per boot and follows the R7 lift-before-`dispose`
law across rebuilds. **Proof:** `npm run replay:all` 30/30 verified with every hash byte-equal to the
base commit's table (kitchen03 `a1a50d05` et al.); `hashedBodies` is still `chassis + wheels` and nothing
in `src/world`/`src/physics` changed a float.

## 2. `JuiceFeed` wired (squash, dust, snap settle)

New `src/juice/layer.ts` — `createJuiceLayer` consumes the feed at SHELL hooks: `step(prev, next)` rides
the frame sink's own snapshot pair inside the boot step loop, `snap(at, def)` rides `builder.onChange`.
`landingSquash` → the rig's squash pivot on a 120 ms WALL envelope (down-and-out, eased, pivoted at the
wheel-contact plane); `dustPuff` → a pooled 4-film dust bloom at the event position; `snapSettle` → the
just-placed piece group pops 6 % proud for 250 ms (mesh scale, never a transform). The feed is
constructed UNreduced so the landing hook always fires; `reducedMotionActive` (the `src/ui/motion.ts`
law) snaps every animated presentation to its still — squash/dust/pop/wheel-spin off, thud on (a thud is
not a motion; same information-over-motion split as the feed's own `durationMs: 0` markers).
`tests/unit/juice-layer.test.ts` proves the L04 par run driven THROUGH the layer hashes like the bare run
(7adc07a8), the squash animates and eases to exactly 1, reduced motion stays still while the thud fires.
Squeal/`hazardTell`/chime events reach the shell through `onEvent` unconsumed — the squeal voice needs a
slower voice-map row than `RUN_VOICE_CAP` allows; ledgered below.

## 3. SOUND: landing THUD + hazard-contact ticks + surface-honest roll

Voice map extended (`src/sound/voices.ts` + `sound.ts`), the firewall untouched (voices take plain
numbers at boot/UI hooks; import-graph test green):

- **`land`** — the `cup`-family thud WITHOUT the bell, voiced per surface (`LAND_SHAPE`: tile /
  porcelain / wood / concrete + wet / oil). Fired by `SoundEngine.land(impulseNs, surface)` from the
  juice landing hook; the impulse rides the event, the surface is cheap: the mounted set's floor
  (`surfaceForSet`) overridden by the zone the landing point sits in (`zoneAt` probed at the WHEEL LINE
  — zone boxes are deck-space bands 41 mm under the chassis centre).
- **`splash` / `oil` / `magnet` / `whirl`** — mid-run contact ticks on the RISING EDGE of the grip dip
  the HUD's `hazardsTouched` tally already counts (the existing UI-visible contact event), classified by
  the authored zone id (`hazardContactVoice`: splash-patch-film→splash, oil-stain-shop→oil; magnet and
  whirlpool are voice-map slots for zones the LD has not authored, loudness-ratified the day they land).
  Rolling through the splash no longer mutes exactly as the visual goes wet.
- **Surface-honest roll** at its cheapest: `setSurface(setId)` scales the roll's two cutoffs ONCE per
  room (`ROLL_TONE`, porcelain 1.25 … garden 0.6), never per frame.

Loudness gates green (`tests/e2e/sound.spec.ts`, every voice through the real master chain):
land −20.8 dBFS (the harness renders ALL six surfaces at full impulse and reports the WORST peak),
splash −31.8, oil −33.6, magnet −22.7, whirl −31.8; the existing 15 unchanged (cup −20.0, roll −29.6 …).
Repetition guard green on a sound-on par run (no rejects).

## 4. Gate results + deliberate re-baseline

`npm run replay:all` 30/30, byte-equal hashes. Unit 821/821 (38 files, +1). e2e **209 passed / 1 skipped
/ 1 failed** — the one failure, `lifecycle-kill.spec.ts` "a REAL background flushes the pending edit",
fails IDENTICALLY on the base commit `f37c57d` on this machine (deterministic here, `page.evaluate
SyntaxError: "[object Object]" is not valid JSON` — the disk-check's `JSON.parse(blob)` sees a
non-string); PRE-EXISTING environment failure, not this delivery. Repro:
`E2E_PORT=<port> npx playwright test lifecycle-kill.spec.ts` against either build. Also environmental
and NOT touched: the canonical set baselines measure 0.039–0.076 % on this box from MAIN's own build
(their committed renders predate this GPU/driver); all under the 0.1 % gate. Deliberate re-baseline:
`tests/visual/darwin/shell-kitchen01-idle.png` ONLY (T1.1 changes the played frame by contract — the red
box is gone). The suite regenerates `docs/explorations/replay/*.png` on every run (they differ on main
too); restored to committed state here.

## 5. Evidence — before/after filmstrip of a kitchen03 mid-run

`tmp/t1-feel/strip.mjs` (the filmstrip gate's click-launch/150 ms sampling idiom) run against base
(port 4591) and branch (4590): `tmp/t1-feel/before/` = the evaluator's plain RED BOX mid-run;
`tmp/t1-feel/after/` = the blue sedan, wheels and roof-rack reading, seated on the channel through the
launch ramp, gap flight and landing. Same level, same par build, same sampling script.

## Decisions / next

- No Decision Log entry needed: no hashes moved, no schema touched; the 30-rung freeze held.
- Next (ledgered): squeal voice row (needs a re-trigger slower than 20 Hz or its own cap), the tap-drip
  tell voice, booster-impulse voice, magnet/whirlpool zone DATA if the LD authors them, and the replay
  page's car (T2.2's share page will pass the rig where the film shows the car).
