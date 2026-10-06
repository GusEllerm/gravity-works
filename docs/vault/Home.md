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

**Now: stage 4 in flight** — the kitchen five are shipped, and the bedroom, bathroom and garden ladders (four rungs each, `Sessions/2026-10-07 Stage 4 - bedroom ladder.md`, `Sessions/2026-10-08 Stage 4 - bathroom ladder.md`, `Sessions/2026-10-08 Stage 4 - garden ladder.md`) ride after them in the campaign (`src/world/campaign.ts`); the garage exploration is ratified, its ladder is a later wave.

**Stage 3 (kitchen vertical slice) — closed.** Shipped on `main`: the RATIFIED kitchen set (AD 16/15/15 — `Reference/Review 2026-10-07 Stage 3 kitchen set round 2.md` — mounted per level by `src/world/setPlacement.ts`), five playable levels `kitchen01`–`kitchen05` in `LADDER` with star-gated progression (`gateNext`, `nextLevelId`), the result screen + help drawer + share card, script-generated pars (`npm run pars -- --check` gate), the tilt-shift post stack (`src/render/post`; OFF by default; the quality ladder drops stages, never resolution), the §7.3 `RunCamera` WIRED into the shell (eye trails the rail, aim leads, clears set solids — [[Modules/camera]]), the input-truth pass (visible target ring, hover/click place, window keyboard parity, one verb per event — playtests E/F/G, `Modules/ui`), deterministic replay with the node↔browser equality HARD-ASSERTED (`099403c7`, page verdict `verified`, `Modules/replay`), and share links that verify on the deployed page (`src/share`). **Acceptance evidence: fresh playtesters cleared all five levels unaided** — `Sessions/2026-10-06 Playtest I confirmation.md` (kitchen01→kitchen05, ★★–★★★); `Sessions/2026-10-06 Playtest H confirmation.md` cleared L01 faster than par (2.16 s vs par 2.25 s, ★★★). The adversarial-review verdicts and the residual polish ledger are in `Reference/Stage 3 Review 2026-10-06.md`; the `stage-3` tag is not yet cut (Director owes it).

**Stage 1 (explorations) — closed** (references in `Reference/Review 2026-10-04 Stage 1 explorations.md`: kitchen tile B, car-a sedan blocky, ramp variant B; physics reference: raycast wheels; tile-B integration send-back queued for stage 3).

**Stage 2 (the spine) — closed.** The whole spine is landed and the accept lines are proven on `main`: track kit (`src/track`, 13 pieces, splines → mesh/collider/rail/sockets), `World` + data-driven feel-track level (`src/world`), builder UI (`src/ui`), save/share/replay (`src/save`, `src/share`, `src/replay`), the §7.3 run camera as a pure tested class (`src/camera`; wired into the shell in stage 3), and the physics rework (raycast-wheel car with rail steering, solver-energy audit, crutch-ablation suite). Accept lines: a car completes the feel track (harness 3.31 s / world 361 steps, both variants); canonical loop threshold **2.30 R** from the bracketed, wing-probed bisect, band-asserted in test; node↔browser determinism hard-matches at `099403c7` with the page verdict `verified`; the builder e2e derives its counters from level data; 90/90 unit, 9/9 e2e. Stage 2 changed no render output; the kitchen art slice opened — and closed — in stage 3.

## Plan

- [x] Stage 0 — bootstrap, CI, vault, bibles v0 (tag `stage-0`)
- [x] Stage 1 — explorations: kitchen tiles ×3, car ×3, physics ×2, toon ramps ×3; references chosen (`stage-1`)
- [x] Stage 2 — the spine: track kit + sockets, builder, `World`, fixed-step physics, run camera, real feel track, determinism harness, save/share (`stage-2`)
- [x] Stage 3 — kitchen vertical slice: materials backlog, post stack, ratified kitchen set, 5 playable levels cleared unaided, result screen, help drawer, share card (tag `stage-3` owed by the Director)
- [ ] Stage 4 — bathroom / bedroom / garden / garage in parallel + levels + hazards
- [ ] Stage 5 — porch, cinematic replay, synthesised sound
- [ ] Stage 6 — polish and ship (a11y, responsive, perf, copy, README, final playtest, `Sessions/Final Report.md`)

Staffing is per-stage and recorded in `Sessions/` notes; roles and protocols live in [[Studio]].

## Deferred (open items only — closed carry-ins list their closing evidence)

- **60 fps with post ON on a hardware GPU — standing open item**: CI cannot prove it on software rasterizers — GitHub's Linux runner is SwiftShader, where the high tier measures 351 ms; software GL now RECORDS-and-DEFERS (annotations, never inflated ceilings) and the hardware measurement is owed (stage-6 perf pass or a hardware-GPU runner; Decision Log 2026-10-07, [[Concepts/Performance|Performance]], `Performance/stage-3`).
- **Liquid specular ceiling** — open AD carry-forward (`Reference/Review 2026-10-07 Stage 3 kitchen set round 2.md` ticket 1, Technical Artist): cap the `liquid` class's specular contribution so a set-tinted base cannot be lifted above ~240 luma — the milk's hero-distance glare. Candidate acceptance: `tools/histogram.mjs` over the hero's milk-disc crop reports 0 % ≥ 248.
- **Residual polish ledger from playtests H+I** — seven non-blocking tickets (silent world-click-place misses, L02 discoverability for one tester, camera wall-bury at run end, 3 s Retry dead time, zoom-tight chase, ✗-mark legibility, stale target line after the panel) — itemized with quotes in `Reference/Stage 3 Review 2026-10-06.md`; fold into the stage-4 playtest round.
- **Player-built hash order-sensitivity** (stage-3 shell-readiness carry-out, `Sessions/2026-10-07 Stage 3 - shell readiness.md`): the hash is collider-ORDER-sensitive, so the same geometry built in a different piece order hashes differently (`c97b86b6` vs `b4d7c637` on a player-built L01) — harmless today (identical builds replay bit-exact; all pinned-hash tests hold), but canonicalise the piece order in `reify` (`src/track/build.ts`) before any hash claim ever depends on cross-build equality.
- **Cross-platform determinism** — node↔browser equality is now HARD-ASSERTED in the spec on every runner (`099403c7`, page verdict `verified`); cross-OS/CPU floating-point equivalence remains open — the assert simply fails the job loudly on any runner where it is false; the share-replay e2e also hard-asserts `verified`.
- **Stage-4 AD carry-forwards** (set-round-2 review): the floor-camera template rule (prop under the rim line: lower camera + slight upward tilt band) and one story detail inside the floor shot's near third; gate track-orange hue in the material registry BEFORE bathroom; set two's first still ships with the darks budget visible in its histogram.
- Closed at stage 3, evidence where named: tile-B integration re-render and the whole stage-1 material backlog (production canonicals ratified, `Modules/render`, `Modules/sets-kitchen`); tilt-shift post (landed — renders are no longer provisional on that account, `Modules/render`); run-camera shell wiring ([[Modules/camera]]); loop-piece sizing / up-stop wheels (speed window BY DESIGN `[2.30 R, +∞)`, droop tether = modelled up-stop, [[Modules/physics]] §speed window); feel-track gap length — `FEEL_DROP_HEIGHT` is **0.52 m**, the quoted "45 cm" carry-in is VERIFIED STALE, do not re-apply ([[Modules/feel]] Layout); all stage-1 review fixes (landed stage 2).
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
5. `Reference/Review 2026-10-04 Stage 1 explorations.md` (what was chosen, scored, sent back), `Reference/Review 2026-10-07 Stage 3 kitchen set round 2.md` (the ratified set), `Reference/Stage 3 Review 2026-10-06.md` (what stage 3's gates really assert + the open polish ledger)
6. Recent notes under `Sessions/`
