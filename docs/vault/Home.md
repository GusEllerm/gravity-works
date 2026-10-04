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

**Stage 0 (bootstrap and charter) — closing.** Repo scaffolded (Vite vanilla-ts, npm), TypeScript strict, Vitest + Playwright smoke, CI (typecheck / unit / e2e / `livedocs verify`) and Pages deploy workflows, Pages live at https://gusellerm.github.io/gravity-works/ . Runtime deps installed but nothing of the game is built yet: `src/boot.ts` shows a placeholder. The three bibles exist at version zero from the brief; nothing visual is chosen yet.

## Plan

- [x] Stage 0 — bootstrap, CI, vault, bibles v0 (this commit, tag `stage-0`)
- [ ] Stage 1 — explorations: kitchen tiles ×3, car ×3, physics ×2, toon ramps ×3; references chosen and recorded
- [ ] Stage 2 — the spine: track kit + sockets, builder, `World`, fixed-step physics, run camera, feel track, determinism harness, save/share
- [ ] Stage 3 — kitchen vertical slice (materials, light, post, set, 5 levels, result screen, help drawer, share card)
- [ ] Stage 4 — bathroom / bedroom / garden / garage in parallel + levels + hazards
- [ ] Stage 5 — porch, cinematic replay, synthesised sound
- [ ] Stage 6 — polish and ship (a11y, responsive, perf, copy, README, final playtest, `Sessions/Final Report.md`)

Staffing is per-stage and recorded in `Sessions/` notes; roles and protocols live in [[Studio]].

## Deferred

- Cross-platform determinism claim — awaiting the stage-2 harness measurement (see Decision Log 2026-10-03).
- Sound — stage 5 by design.
- livedocs TS symbol anchoring is `unknown`-heavy; reconciliation is by Documentarian discipline (Decision Log 2026-10-03).

## Decisions a human should review

- rapier3d-compat ships ≈1.2 MB gz of wasm with the first gameplay build — acceptable? (assumed yes; brief mandates Rapier)
- Publishing to GitHub Pages under the account `GusEllerm` — Pages was enabled on the human's behalf via `gh`.

## Reading order for a fresh Director

1. `PROMPT.md` (the brief — always authoritative)
2. This note (state + plan)
3. [[Decision Log]]
4. [[Studio]] (roles/protocols), [[Art Bible]], [[Feel]]
5. Recent notes under `Sessions/`
