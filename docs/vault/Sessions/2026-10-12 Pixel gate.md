---
livedocs: snapshot
tags: [session]
---
# 2026-10-12 Pixel gate (Systems Engineer — round-2 debt N1, the cheaper half)

## Goal

Pay debt N1 (`Reference/Evaluation 2026-10-11 engineering round2.md`): the shipped shell's pixels were
asserted nowhere on Linux CI. The bloom-merge clobber incident proved the class — a wrong capture sat
GREEN on `main` for days because only one Mac's pixels could be compared. Deliver ONE Linux-runs pixel
assert through the existing render path (SwiftShader on ubuntu), baselines generated FROM a CI run, wired
so a shell-pixel change goes RED on CI regardless of the committer's machine. Darwin gate + regeneration
doctrine untouched. Branch `fp-pixelgate`, worktree `gw-g3` (outside the repo root), base main `0b07040`.

## What was done

- `tests/e2e/visual.spec.ts` — `CI_ENFORCED_VIEWS` (initially just `shell-kitchen01-idle`, the settled
  idle shell at `?level=kitchen01&post=on`: no run active, nothing animates, liquid `uTime` stays 0, fixed
  1600x900 viewport, canvas-native 960x540). For enforced views, a missing baseline under `CI=1` is a hard
  FAIL on any platform — the loud skip stays off-CI and for non-enforced views, so darwin behavior is
  byte-identical (verified: all 7 visual tests pass at 0.0000 %). Rebase mode grew an honest frame count:
  with a `recapture` hook it gates TWO consecutive captures (`REBASE frame-stability self-check`) before a
  baseline is ever committed — SwiftShader determinism is only trusted where proven (the atlas, fixed
  steps), checked everywhere else.
- `.github/workflows/ci.yml` — `linux-baselines` bootstrap job (PR-only): captures any missing enforced
  view on ubuntu-latest via `GQA_UPDATE_BASELINES=1 npx playwright test visual`, commits the PNGs to the
  PR branch (they arrive as a reviewable PR diff — the human-eyes condition the 2026-10-07 Decision Log
  required to accept generate-in-CI). `check` now `needs:` it and checks out the PR head, so the assert
  itself — red or green — runs in the PR's own ubuntu check. Flow stated: **ONE PR, two stages inside it**
  (bootstrap captures and commits, check enforces, same run), not a two-PR sequence. On main pushes the
  job skips; PNGs live in `tests/visual/linux/`.
- Docs: [[Concepts/CI Pixel Truth]] (living note, the law), Decision Log 2026-10-12 (amends only the
  flagged-first-run form of the 2026-10-07 rejection), `Concepts.md` index line.

## Decisions

- Cheaper half chosen over the harness-parity rig: one static view that closes the class, not a Linux
  copy of every canonical shot. The exploration cross-check and the darwin doctrine stand verbatim.
- Flakiness budget: the self-check is in the capture path itself (a frame-unstable view cannot commit as
  a baseline); if CI ever flakes twice on a view, replace it with a more static one, don't chase it.
- Non-vacuity proven locally, both directions: `CI=1 GQA_BASELINE_DIR=tests/visual/linux npx playwright
  test visual -g "game shell"` on a baseline-less box FAILS with `CI PIXEL TRUTH MISSING` (was: skip);
  rebase self-check on darwin measured 0.0000 % between consecutive captures.

## Receipts

- Local (darwin, `E2E_PORT=5020/5021/5022`): visual 7/7 at 0.0000 %; missing-baseline probe RED; rebase
  self-check 0 px drift; unit **990/990**; full e2e **270 passed / 1 designed skip / 0 failed** (3.3 min,
  `E2E_PORT=5024`; the run's replay-spec side effect rewrote the docs/explorations/replay PNGs — restored,
  not committed, per the binary-clobber doctrine). `npm run typecheck` clean; `npm run build`
  clean before push.
- CI: first PR run — `linux-baselines` captures + commits the PNG; `check` then runs the assert on ubuntu.
  Receipts filled from the watched runs below.

## Next

- If a future view joins `CI_ENFORCED_VIEWS`, the bootstrap picks it up automatically (delete the PNG in
  the PR to force a re-take). The expensive half (Linux baselines for the canonical shots) stays open debt.
