---
livedocs: snapshot
tags: [session]
---
# 2026-10-03 Stage 0 — Bootstrap and studio charter

## Goal

Execute §3 of the brief exactly: scaffold, vault, CI, Pages, bibles v0.

## What was done

- Vite vanilla-ts scaffold kept as one commit; demo files removed in the bootstrap commit; `strict: true` added.
- Deps: three 0.186.1 (128 kB gz), @dimforge/rapier3d-compat 0.21.0 (~4.1 MB raw, wasm inlined), vitest 5, Playwright 1.63, npm (not pnpm).
- CI: typecheck + vitest + Playwright chromium smoke + `livedocs verify` — green on the remote (run 37178525344).
- Pages enabled with `build_type=workflow`; deploy workflow fixed once (top-level `environment:` is invalid — it belongs on the job). Site live: https://gusellerm.github.io/gravity-works/ (HTTP 200).
- Vault: bibles v0 ([[Art Bible]], [[Feel]], [[Studio]]), [[Decision Log]] with six stage-0 entries, `Modules/src.md`, plan in [[Home]].
- `livedocs verify` locally clean; gate active via `.githooks`.

## Decisions

Recorded in [[Decision Log]] under 2026-10-03 (npm; rapier-compat; three; relative base; livedocs TS anchoring caveat; Pages workflow).

## Next

Stage 1 — explorations. Wave 1: Technical Artist builds the render harness + toon ramp variants (main checkout); Feel Engineer runs the two-variant car physics bake-off on a provisional feel track (own worktree — file sets disjoint). Wave 2 (after harness): two Environment Artists build competing kitchen style tiles; car look ×3. Then a fresh Art Director reviews renders with the rubric and references get chosen into the bibles.
