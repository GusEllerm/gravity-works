---
livedocs: snapshot
tags: [session, program, p4]
---
# 2026-10-10 Program filmcar — the film's star and the farewell's chips

Two residuals from the player final, one lane. **The film's star:** `startReplayPlayer` in
`src/pages/share.ts` now mounts the ratified `createCarRig` exactly where the shell does — a `car-pose`
wrapper at `-CAR_GROUND_LIFT`, `setKeyLight` declared, `world.carMesh.visible = false` with the proxy's
transforms still written from the tape (visuals-only: nothing enters `hashedBodies`, the wind hashed
no visuals, `replay:all` 30/30 verified and the node↔browser hard gate byte-identical) — and the wheel
spin crosses from wall-time integration to the TAPE: cumulative arc length over
`radius × CAR_SPIN_DAMP` per step, so wheel stance is a pure function of playhead step (seek-, rate-
and capture-deterministic). The intro beat needed no change — it IS the ordinary shell on `?build=par`
and has worn the rig since T1.1. The JUICE layer stays game-shell-only **by decision**: squash is the
driver's contact voice on wall-clock time, the films are cinema frames of an already-curated pose
track, and a wall-time squash would make the committed capture PNGs frame-order-dependent for a
motion the cut grammar does not ask for — squash out, not trivial, and said so.
`__gwReplayCarRig()` is the new seam; `tests/e2e/share-replay.spec.ts` asserts rig mounted + proxy
hidden; the bb-feel car census moved with the mount — the film now stars the sedan, so the retired
whole-frame proxy-red band became the rig-blue band (B−R > 60) inside a 65 px box centred on
`__gwReplayCarNdc`: measured 3.9–51 % on every honest kitchen01 framing, ≈ 0 % on empty ground, floor
0.015 — deliberate re-baseline, and the four committed captures in `docs/explorations/replay/` moved
with it, before/after pairs committed beside them as `p4-before-after-*.png`; per-shot
pixelmatch(threshold 0.1) diff — **wide 0.14 %, finish 0.30 %, feeltrack 0.06 %, follow 5.39 %** (the
box was a few dozen px per frame at these framings; the follow frame at 2.0 s is the close-up where
the box filled the road: its red band-share fell 2.97 % → 2.31 %, blue rose 0.42 % → 0.60 %; wide's
red 1.05 % → 1.03 % is the start-socket car at distance). The solid-red censor is untouched and now
passes further from its ceiling (the sedan left the red band with the proxy; `replay-red` re-verified
green). **The farewell leak:** the cure is one honest `hidden` sweep — `startFarewell` sets `hidden`
on `#gw-sound`, `#gw-save`, `#gw-ghost-bar` and `#gw-dev-preview` when the crane shows, and
`shell.css` gains the `#…[hidden] { display: none !important }` chip rule that wins the cascade over
the chips' INLINE `display:flex` — that cascade loss, not a missing selector, is WHY the sound chip
leaked through a class that listed it (the premise beat's identical leak stays as-is, out of this
lane's brief; the chips are DOM corners on a 3-second film nobody automated). `tests/e2e/farewell.spec.ts`
asserts all three always-mounted chips wear the attribute and paint nothing at the crane. Suite:
typecheck clean, 883 unit, full e2e 235 passed (3 parallel-load starve flakes on this box —
two a11y timeouts and the pre-existing farewell reveal-vs-finish read — all green re-run in
isolation; the filmstrip dense-window gap reproduces at HEAD on this machine too), the replay/share/
farewell/ghost/determinism set green by name. Laws live where they bind: [[Modules/replay]]
(the film's star, the census), [[Modules/ui]] (the chip sweep), [[Modules/render]] (who calls the
factory).
