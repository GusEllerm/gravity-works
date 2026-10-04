# gravity-works vault

This vault is the long-term memory for **gravity-works**. Agents and people write it as the code takes shape;
`livedocs` keeps the notes honest: every note that names code in backticks is bound to that code, and a
commit that changes the code is blocked until the note is updated or acknowledged.

## Where things go

| Folder | Holds | Checked against code? |
|---|---|---|
| `Modules/` | one note per module or package: what it does, how it works, what depends on it | yes |
| `Concepts/` | ideas that span modules: an architecture, a lifecycle, an invariant | yes, where they name code |
| `Reference/` | external facts, surveys, dated reviews | reviews (`Review *`) are snapshots |
| `Sessions/` | one log per working session | snapshots (never checked) |
| `Templates/` | note templates (the Templates core plugin points here) | — |

## How to write a note that stays true

- Name code in backticks: `` `module.function()` ``, `` `ClassName` ``, `` `path/to/file.py` ``. Those are the
  claims livedocs checks. Prose that names no code is not checked (and is reported as such).
- Commit the note; the commit stamps it. There is nothing else to run.
- When a commit is blocked, the message shows *was / now* for the code that changed and the note lines
  that mention it. Edit the note and commit again, or `livedocs stamp <note> --ack --reason "…"` if the
  note is still right.
- Dated records go in `Sessions/` or are named `Reference/Review …`; they are snapshots and never block.

## Map

- [[Modules]] · [[Concepts]] · [[Reference]] · [[Sessions]]

## Current status

**Stage 1 (explorations) — closed** (references in `Reference/Review 2026-10-04 Stage 1 explorations.md`: kitchen tile B, car-a sedan blocky, ramp variant B; physics reference: raycast wheels; tile-B integration send-back queued for stage 3).

**Stage 2 (the spine) — closed.** The whole spine is landed and the accept lines are proven on `main`: track kit (`src/track`, 13 pieces, splines → mesh/collider/rail/sockets), `World` + data-driven feel-track level (`src/world`), builder UI (`src/ui`), save/share/replay (`src/save`, `src/share`, `src/replay`), the §7.3 run camera as a pure tested class (`src/camera`; not yet wired into the shell's frame loop — stage-3 item), and the physics rework (raycast-wheel car with rail steering, solver-energy audit, crutch-ablation suite). Accept lines: a car completes the feel track (harness 3.31 s / world 361 steps, both variants); canonical loop threshold **2.30 R** from the bracketed, wing-probed bisect, band-asserted in test; node↔browser determinism hard-matches at `099403c7` with the page verdict `verified`; the builder e2e derives its counters from level data; 90/90 unit, 9/9 e2e. **The kitchen art slice is NOT started** — no `src/sets/`, no tile-B re-render, tilt-shift still the flagged blocking dependency for all render finals; stage 2 changed no render output.

## Plan

- [x] Stage 0 — bootstrap, CI, vault, bibles v0 (tag `stage-0`)
- [x] Stage 1 — explorations: kitchen tiles ×3, car ×3, physics ×2, toon ramps ×3; references chosen (`stage-1`)
- [x] Stage 2 — the spine: track kit + sockets, builder, `World`, fixed-step physics, run camera, real feel track, determinism harness, save/share (`stage-2`)
- [ ] Stage 3 — kitchen vertical slice (materials, light, post, set, 5 levels, result screen, help drawer, share card)
- [ ] Stage 4 — bathroom / bedroom / garden / garage in parallel + levels + hazards
- [ ] Stage 5 — porch, cinematic replay, synthesised sound
- [ ] Stage 6 — polish and ship (a11y, responsive, perf, copy, README, final playtest, `Sessions/Final Report.md`)

Staffing is per-stage and recorded in `Sessions/` notes; roles and protocols live in [[Studio]].

## Deferred

- Stage-2 reviewer carry-ins to stage 3 (from `Sessions/2026-10-06 Stage 2 review.md` and the round's notes):
  - ~~Size the loop piece for the collider variant~~ — RESOLVED stage 3: the collider variant's loop window is the same pass/fail pattern as the raycast car through 6 R (table in [[physics]] §speed window); the loop piece needs no resizing for it. The banked-yaw lip graze remains a geometry-cosmetics question, not physics.
  - **Feel-track gap length** — a carry-in quoted "the feel-track gap is fixed at 45 cm"; VERIFIED STALE at the stage-2 close: `FEEL_DROP_HEIGHT` is **0.52 m** (the 2026-10-06 energy audit rebalanced 0.45 → 0.52 and the fix-crew swept the stale 0.45 comments; the value deliberately sits in a narrow two-line window — see [[feel]] Layout). Do not re-apply 45 cm.
  - **Hardware 60 fps confirmation** — every stage-2 rendered number is SwiftShader software GL; the ~59.9 fps line needs one pass on a real GPU (stage-3 re-measure, [[Performance/stage-2|Performance/stage-2]]).
  - ~~Up-stop wheels question~~ — RESOLVED stage 3 by documentation: the loop has a speed window BY DESIGN, `[2.30 R, +∞)` — the floor is the bisected gate, and the top end is held because the droop tether already IS the up-stop expressed in forces (full scan + verdict in [[physics]] §speed window). Bounding the tether for a physical ceiling remains an optional fidelity knob.
  - Run-camera wiring into the game shell ([[camera]] Integration status).
- Stage-1 review findings to fix in stage 2 (see `Sessions/2026-10-04 Stage 1 review.md`) — all landed in stage 2: honest roll-test rig; corrected wheel-collider variant; `setRollCoef`/`startOffset` removed; `tokens.test.ts` assertions non-vacuous; roll test passes when the target is met; `quant()` NaN no longer maps to 0.
- Tile-B integration re-render (Art Director send-back) → first task of stage 3.
- Material backlog (grain frequency, accent-to-light, decals, ceramic saturation, dither budget, tyre lightness floor) → stage 3, Technical Artist.
- Tilt-shift/post stack → stage 3; renders are *provisional* until then.
- Cross-platform determinism claim — the stage-2 harness measured **MATCH** (`npx playwright test determinism`: node `099403c7` = browser `099403c7`, page verdict `verified`; node↔node too). Cross-OS/CPU floating-point equivalence remains open for stage 3; same-machine node↔browser is proven, and the share-replay e2e hard-asserts `verified`.
- Sound — stage 5 by design.
- livedocs TS symbol anchoring is `unknown`-heavy; reconciliation is by Documentarian discipline (Decision Log 2026-10-03). Never backtick PNG paths in notes.

## Decisions a human should review

- rapier3d-compat ships ≈1.2 MB gz of wasm with the first gameplay build — acceptable? (assumed yes; brief mandates Rapier)
- Publishing to GitHub Pages under the account `GusEllerm` — Pages was enabled on the human's behalf via `gh`.

## Reading order for a fresh Director

1. `PROMPT.md` (the brief — always authoritative)
2. This note (state + plan)
3. [[Decision Log]]
4. [[Studio]] (roles/protocols), [[Art Bible]], [[Feel]]
5. `Reference/Review 2026-10-04 Stage 1 explorations.md` (what was chosen, scored, and sent back)
6. Recent notes under `Sessions/`
