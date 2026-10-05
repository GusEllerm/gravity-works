---
livedocs: snapshot
tags: [session, stage-3]
---
# 2026-10-06 Stage 3 - shell truth

Systems Engineer pass over the shell after the E/F/G acceptance reports
(`Sessions/2026-10-05 Playtest E/F/G`). One ledger item per finding, all
verified green (typecheck, 245 unit tests, the full playwright suite on
E2E_PORT 4209).

## 1. The input story rebuilt (`src/ui/builder.ts`)

- **Visible target, always**: a ring mesh (`builder-target` torus at the
  socket frame) marks the socket the held piece WILL occupy — piece held or
  not. The `targetSocket()` method + the shell's `__gwTargetSocket` seam
  let the e2e assert the marker DISPLACES when the arrows move.
- **Hover aims, click places**: `attachCanvas(canvas, camera)` projects every
  open socket, pointermove/click pick the nearest within `HOVER_PX`; the
  ghost (green/amber/red + reason) is on the socket BEFORE the click; click
  = place at the hovered socket, drag optional.
- **Keyboard parity** on `window` (focus anywhere): ↑/↓ kind, ←/→ the SAME
  visible target, Enter place, R flip, Delete remove. A focused `<button>`
  keeps its native Enter (the handler must NOT preventDefault it — doing so
  cancelled "Enter launches Launch" in the first draft; the keyboard-only
  e2e caught it in one run).
- Hint copy now states exactly those affordances; the old "Move: drag or
  arrows · Place: Enter" line is gone.
- Kitchen01 is built END-TO-END with arrows+Enter alone in
  `tests/e2e/shell-truth.spec.ts` (the stage-6 requirement's seed).

## 2. Star-gated progression (`src/boot.ts`)

`gateNext(stars)` — `#gw-result-next` shows only on a finished run that
earned ≥1 star (§9.2 progression-by-stars); 0-star failures show Retry only.
The loop spec's Next walk stays green (that run finishes); the new spec
launches the EMPTY build, reads `☆☆☆`, and asserts Next is hidden.

## 3. Honest labels

- The tray legend DECREMENTS: `drop ×1` → `drop ×0` (×N counts what is LEFT;
  the `gw-tray-reason` line says so in one phrase).
- The count line: `#gw-piece-count` = "2 of 3 pieces used".
- Budget copy never doubles the tray: on tray levels the legend is the
  counter; "out of budget" survives only on no-tray (sandbox/feel) levels.
- The VERB TABLE comment at the top of `builder.ts` fixes one verb per event
  (place/placed; the socket's verdict is "fits here"/"flipped fit"/
  "blocked — the set is in the way"). "snapped"/"seated" are retired from
  the screen; `GHOST_LABEL` maps internal states to the table. The Feel
  Engineer's failure notes never use placement verbs.

## 4. Hash legibility

`runStatusLine` no longer carries the hash; it lives in `#gw-hash-value`
behind `<details>` "determinism fingerprint — same build, same run,
anywhere". The shell compares consecutive terminal hashes + piece counts and
prints "same run — your extra piece never touched the road" in
`#gw-hash-note` when they match across different builds. `Modules/replay`
now states precisely why that is honest: the accumulator folds the CAR
bodies' quantised transforms (`world.hashedBodies`, chassis + wheels) —
statics off the path cannot perturb it.

## 5. Rotate is visible

`R` re-renders the ghost through a ≤150 ms slerp/lerp snap-to-orientation
(`ROTATE_MS`); the e2e pixel-diffs the canvas across the animation and the
settled frame (diff > 50 px, zero-noise baseline run).

## 6. First paint

One static warm frame (the set sky, `SET_TOKENS.kitchen.background`) renders
before `World.create` awaits the physics wasm; `#gw-canvas` also carries the
warm CSS backdrop. The e2e probes the canvas from an `addInitScript` at the
moment the element exists — non-black, proof not prose.

## 7. Help entry

The drawer hosts over `#gw-stage`: quiet focusable toggle TOP-RIGHT, list as
an absolute overlay (pointer-events only on the controls — world clicks
still land). No more page-bottom word-button.

## 8. e2e

`tests/e2e/shell-truth.spec.ts`: keyboard-only L01 build (arrows+Enter,
marker displacement), fail → Retry-only (Next hidden), first-paint non-black,
rotate pixel diff. All green.

## Notes for the crew

- The `shell-kitchen01-idle` visual baseline was ALREADY RED on main before
  this pass (canvas CSS width 980px vs the 960px backing the baseline was
  shot at — the letterbox fix upscaled the element). Fixed with
  `max-width: 960px` on the canvas and the baseline REBASED (the ring marker
  and the Help toggle are the intended new pixels).
- Feel: the verb table lives in `src/ui/builder.ts` — match note wording to
  it; nothing in `result.ts` changed here.
- The keyboard handler intercepts arrows page-wide (preventDefault) — the
  stage-6 a11y pass may want a "focused region" gate; today every arrow
  moves the visible marker, which is exactly what the hint claims.
