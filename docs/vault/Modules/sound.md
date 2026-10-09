---
livedocs: module
tags: [module, sound]
---
# Modules/sound

> [!abstract] Role
> Stage 5: synthesised sound and mix with a mute (brief §8 "Sound"). All audio is synthesized from code —
> zero assets, nothing licensed. Owner: Technical Artist.

## What it does

`src/sound/` is three files and a firewall. `src/sound/voices.ts` holds every voice as a pure scheduling
function over a `BaseAudioContext`: `VOICE_GAIN` (the per-voice design ceiling table, nothing above 0.5),
`VOICE_NAMES`, the seeded PRNG `mulberry32` behind every noise buffer (so offline renders repeat), and the
voice functions — `launch` click, the sustained `startRoll` noise voice, piece `snap`, loop `ring` ping, cup
`cup` thud+bell, the fail trio (`whoosh` / `hum` / `hazard`), `chime` (1–3 star bells; its note count rides
on the function), the new-best-only `victory` arpeggio, `blipPlace` / `blipUndo`, and the bed voices
(`tick`, `bird`, `startRoomBed`). `src/sound/bus.ts` builds the master chain — `MASTER_CEILING` (-12 dBFS)
into a gentle `DynamicsCompressor` limiter, plus the convolver-free room in `makeRoom` (two damped combs →
two allpasses → tone) — and the loudness harness `renderVoice` / `renderAllVoices`, which render any voice
offline THROUGH that same chain and return measured peak and DC. `src/sound/sound.ts` is `SoundEngine`
(factory `createSound`): the AudioContext is constructed ONLY inside `unlock()`, which boot calls from the
first real gesture (autoplay policy); before that every method is a no-op, and a context that refuses to
start makes the engine `deaf`, never a crash. Mute and volume persist as `settings.sound`
(`SoundSettings` in `src/save/save.ts`) — an optional settings key, no schema bump, no migrade, the same
technique `calloutsSeen` used. Since the stage-7 program (engineering R8) the WRITE SHAPE of that
persistence is the build autosave's: `setVolume` (the slider's `input` storm — dozens of full
load-merge-writes per second at the old code) schedules a TRAILING write, one per drag burst
(`SOUND.VOLUME_PERSIST_MS` = 350, injectable `clock` in `SoundOptions` exactly like
`createBuildAutosave`'s), and `flushPersist()` rides the same lifecycle edges — mute (a discrete verb,
still an immediate persist that carries any pending volume in its envelope), `dispose`, and the
`pagehide` / visibility-hidden listeners `createSound` registers on itself (the module owns its own
durability; boot stays out of it). The persist goes through `saveSave`, so a volume write is a MERGING
write (R9): it can never clobber a build another tab just placed.

THE DETERMINISM FIREWALL (the stage-5 rule): nothing under `src/world`, `src/physics`, `src/render` or
`src/camera` imports `src/sound`, and nothing there is imported BY it — the import graph is hard-asserted
in `tests/unit/sound.test.ts`, so there is no call path from `World.step` into an audio node. Every sound
enters through a call at a boot/UI hook: the launch button, an edit burst edge in `builder.onChange`, the
Place/Remove buttons, and the terminal-edge block in `src/boot.ts` (which hands `finishRun` exactly the
fields the result panel prints — status, stars, new-best, hazard tally). The two continuous sounds read
only what the SCREEN renders: the car mesh's own on-screen speed (position delta / wall dt, fed to the roll
at ≤ 20 Hz by the engine's throttle — `SOUND.ROLL_UPDATE_HZ`, never per frame, never per step) and the
car's visibly inverted pose (`upAxisYOfQuat` < `SOUND.INVERTED_UP_Y`, one `ring` ping per loop edge, ≥
`SOUND.RING_MIN_GAP_MS` apart). `engine.frame` is called from the render loop AFTER the stepping block and
pulls nothing.

REPETITION is guarded, not hoped for: `RUN_VOICE_CAP` counts event voices per run and DROPS (and counts in
`rejected`, and warns) any voice that fires more than 12 times in one run — voices attach to distinct
events by design, so the guard stays silent in play and red in test. The ambience beds (kitchen clock
`tick`, garden `bird`, the `room` tone bed, chosen by `setBed` from the level's set id) are spaced by their
scheduler's minimum gaps (`TICK_MIN_MS`, `BIRD_MIN_MS`), stop on mute, and pause while the tab hides.

## Measured loudness (Chromium OfflineAudioContext, the same chain the game runs — e2e asserts it)

Every voice peaks under the -12 dBFS ceiling with DC under 2e-4: launch -26.6, snap -20.1, ring -21.5, cup
-20.0, whoosh -22.0, hum -16.3, hazard -20.4, chime(3★) -15.5, victory -16.2, blips -25/-27, tick -36.9,
bird -24.5, room bed -42.2, roll -29.6 dBFS. The loudness assertion lives in `tests/e2e/sound.spec.ts`
because vitest's `node` environment has no WebAudio; `tests/unit/sound.test.ts` carries the in-process
halves (design-gain table, autoplay gate, repetition guard, 20 Hz throttle, bed spacing, mute persistence,
firewall).

## Guarded by

`tests/unit/sound.test.ts` (18 tests: the import-graph firewall, gain tables, no-context-before-gesture,
the repetition cap + reset-per-run, outcome→voice mapping, ≤20 Hz roll updates, one ring ping per loop,
kitchen bed spacing under a pinned rng + fake timers, mute/volume persist, deaf fallback, the
`settings.sound` save round-trip at v2, and since the stage-7 program the R8 burst proofs — 50
`setVolume` calls under a fake clock cost exactly ONE persist, `flushPersist` lands a pending drag
exactly once and the dead timer writes nothing, and through a real store a 20-event drag writes the
envelope once) and `tests/e2e/sound.spec.ts` (autoplay gate on trusted gestures;
every voice rendered offline under 0.2512 peak with |DC| < 0.005; a `?build=par` sound-on run that throws
nothing and trips no guard; mute honored across reload through localStorage) and
`tests/e2e/save-volume.spec.ts` (a keyboard drag then an INSTANT reload lands the value — the flush
rides the pagehide edge exactly like the build autosave).

## Depends on / used by

`src/save` (settings persistence only). Used by `src/boot.ts` (the only game-side importer).
