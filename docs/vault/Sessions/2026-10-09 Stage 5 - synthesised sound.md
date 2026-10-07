---
livedocs: snapshot
tags: [session, stage-5, sound]
---
# 2026-10-09 Stage 5 — synthesised sound (Technical Artist)

Role: Technical Artist. Worktree `gw-snd1`, branch `stage5-sound` off `main` @ defeeb3. Owns: `src/sound/`, the sound wiring in `src/boot.ts`, the optional `settings.sound` key in `src/save/save.ts`, `tests/unit/sound.test.ts`, `tests/e2e/sound.spec.ts`, `Modules/sound.md` (+ the save-note line). Main untouched; AD/FE lanes untouched.

## Goal

"Synthesised sound and mix with a mute" — reduced-stimulus acceptance: nothing above a gentle level, nothing repetitive within a run. Everything from code, zero assets; audio must NEVER read sim state beyond what the UI shows and NEVER touch determinism/the hash.

## What was done

- **`src/sound/`** — three files. `voices.ts` (15 voices + design-gain table, all envelopes ≤ 0.5 pre-master; seeded `mulberry32` noise so renders repeat), `bus.ts` (master chain: `MASTER_CEILING` = 0.2512 = **−12 dBFS** → gentle limiter; convolver-free room = 2 damped combs (37/53 ms, fb .66/.61) → 2 allpasses → tone; plus the `OfflineAudioContext` loudness harness `renderVoice`), `sound.ts` (`SoundEngine`/`createSound`: gesture-only context, mute/volume, ≤20 Hz roll throttle, per-run repetition guard, sparse bed schedulers, deaf fallback).
- **Voices** (all event-driven from boot/UI hooks): launch click · wheel-roll (filtered noise, modulated by the car MESH's on-screen speed at ≤ 20 Hz, never per frame) · piece snap · ring ping (edge on the visibly-inverted pose, ≥ 600 ms apart) · cup land thud+bell (terminal edge) · fail whoosh / stall hum / hazard crackle · star chimes 1–3 · Place/Undo UI blips · kitchen clock tick + garden birds + room-tone bed (per `setBed`) · gentle victory arpeggio (fires ONLY when the run beat the save's best — progress, not repetition).
- **Measured loudness** (Chromium `OfflineAudioContext`, through the real chain; e2e asserts peak ≤ 0.2512 and |DC| < 0.005): launch −26.6, snap −20.1, ring −21.5, cup −20.0, whoosh −22.0, hum −16.3, hazard −20.4, chime(3★) −15.5, victory −16.2, blips −25.2/−26.8, tick −36.9, bird −24.5, room bed −42.2, roll −29.6 dBFS. Loudest voice sits ~3.5 dB under the ceiling; DC ≤ 1.4e-4 everywhere.
- **Mute + volume** in the save (see Decisions) + a real toggle and slider (`#gw-sound-toggle`, `#gw-sound-volume`), page-corner absolute so the shell visual baseline is byte-stable (0-diff vs main: the 0.0415 % shell diff is environmental and reproduces identically on untouched main).
- **Tests**: unit 602/602 (18 new: import-graph firewall, autoplay gate, repetition cap, outcome→voice map, 20 Hz throttle, bed spacing, deaf fallback, settings round-trip). e2e 134 passed / 1 designed skip (4 new sound specs: autoplay on trusted gestures; every voice offline-rendered under the ceiling; a `?build=par` sound-on run that throws nothing and trips no guard; mute across reload).

## Decisions

- **Settings: NON-schema-touching.** `settings.sound = { muted?, volume? }` is an optional key on `SaveSettings`; `isSaveData` validates `settings` as an object and passes unknown keys through, so it round-trips at `SAVE_VERSION` 2 with no migrade — the same trick `calloutsSeen` used, and it leaves v3 free for F6's autosave-revision migration. Asserted in test.
- **The determinism firewall is architectural, not behavioral**: (1) nothing in `world`/`physics`/`render`/`camera` imports `src/sound` and nothing there is imported by it — hard-asserted against the source text; there is NO call path from `World.step` to an audio node; (2) sounds fire only at boot/UI hooks (buttons, `builder.onChange` edges, the terminal-status block, which hands `finishRun` exactly the result-panel fields); (3) the only continuous inputs are the rendered car's screen speed and inverted pose, computed from the mesh pose the frame loop already draws, fed through a read-only `engine.frame` sink AFTER the stepping loop, throttled to 20 Hz inside the engine.
- **Repetition as a test failure**: `RUN_VOICE_CAP` = 12 per run per voice; excess firings are DROPPED, counted and warned — a voice firing repeatedly inside a run is caught as a design bug, not tuned with volume.
- **Offline-audio harness placement**: vitest's node env has no WebAudio and the repo adds no polyfill dependency, so the OfflineAudioContext renders run in the e2e (headless Chromium renders audio off-device, no fake flag needed) while the unit file carries the deterministic in-process halves (mock-context gain scheduling, counters, throttles, save round-trip).
- Fixed on the way (measured, not guessed): the cup's bells started 20 ms before their envelope and played at unity gain for the gap (peak 2.58 linear!); the stall hum double-stacked triangles at −14.7 dB; the Q-8 clock tick was inaudible at −53 dB.

## Next

- AD's call whether the bed densities (tick 0.9–1.6 s, bird 3.5–9 s) read gentle in real playtests; both are one constant away.
- If the ring ping should ever key off a collectible ring mechanic rather than the inversion edge, the voice already exists — only the trigger moves.
- F6's v3 migrade can now claim the version bump without colliding with `settings.sound`.
