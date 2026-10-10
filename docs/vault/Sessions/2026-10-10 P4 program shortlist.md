---
livedocs: snapshot
---

# 2026-10-10 — P4 program shortlist (feel engineer, bar 7)

Player evaluation ([[Reference/Evaluation 2026-10-10 player re-run]]) scored 6.5 against a bar of 7. Five concrete items, branch `p4-shortlist`, worktree `gw-y5`, base `eaaa2da`. All five implemented; suite green (882 unit), `replay:all` 30/30 verified at every checkpoint, contrast gate green, build clean.

## 1. kitchen02's unfakeable choice — the blocked rim

The union dump (par + one) finished EVERY order: reach-sum invariance means the tail seats INTO the cup's mouth. Measured first: all 12 whole-tray orders land the 4th piece inside or past the cup body; the three legal lines (par lazy `0b4dbab2`, arc, beater) clear the cup body by >= 2 mm. Fix is placement-layer only: `Level.blockedGoalSeat` → `goalGuardFor()` in `src/ui/builder.ts` derives the goal piece's geometry AABB (clipped at the mouth plane) as a named placement-guard solid; the ghost goes red `blocked — the cup is in the way` and Place refuses. No geometry, no collider, no physics read — par hash `0b4dbab2` survives byte-identical (`tests/unit/goal-guard.test.ts` sims it; `replay:all` agrees). The union dump now CHOOSES and can die choosing: the trio the refusal leaves seated falls (`tests/e2e/goal-rung.spec.ts`).

## 2. the canvas on short windows — 613x345 no more

The law was `max-width: min(960px, calc((100vh - 380px) * 960/540))` under `@media (max-height: 700px)`. The 380 reserved 92px more than the chrome actually spends; the compact lines were re-measured and the constant cut to 288 with the compact-mode chrome tightened (status/callout 13px/2px margins, tray-hint 15px, piece-count/ghost-state 11px/14px, hash-details 10px, h1 13px, nav 11px). Stage share at 633/653/700-px viewports: 54 % / 56 % / 59 % (screenshots `tmp/p4-viewport/stage-{633,653,700}.png`, kept off-commits as scratch). The `result.spec.ts` viewport law (9/9) holds unchanged. The idle visual baseline was rebased for the chrome reflow — the raster offset moved sub-pixel, 0.247 % AA jitter on geometry edges, no rendered-frame change (precedent: stages 3-5 rebases).

## 3. builder chrome wears the display face

`#gw-status`/`#gw-callout` 15px display, `#gw-tray button`/`#gw-controls button` 14px display (the `font: inherit` that pinned system text is gone), `#gw-target-label` 13px; the 12px counters stay system by design. Contrast table reconciled, and the gate's STANDING RED is fixed: the `#gw-replay-badge` DRIFT row referenced an element program T2 deleted (the absent-badge law) — the row is retired, tray/control floor raised to the real 14, target-label split to its own 13 row. (The badge row was red on MAIN before this branch — logged, not caused here.)

## 4. the critique names WHERE (bedroom02)

`placedWhereFor()` in `src/ui/advice.ts` reads the join graph with the Remove button's own rule (`JOIN_TOL`, anchor = the piece whose exit the entry joins; `by the X` / `past the cup` / `at the car's start point`, kinds at two sites joined with `or`) and plumbs through `physicsNote`/`resultModel` as `critiqueWhere`. A CRITIQUE half naming a placed kind now carries its site — `flatten the landing by the drop`, `lower the lip past the cup`; ADD halves, the rotated `re-place it flat (no R)` line, and the null map (share/replay) stay byte-identical. The live tray-button dump on bedroom02 — the evaluator's own 2.33 s death — reads `fell off nose-first — flatten the landing past the cup` (its fifth press takes the cup's open exit; the unit's chain-fit walk puts the same piece `by the drop` — both are the graph's truth about ITS build). Unit caught a real concat bug on the way: `landing${tail}` without a space.

## 5. the first hour says the magic words — with census evidence

The kind census (Decision-Log-grade, probes in this branch's history): the 26 campaign trays stock FIVE kinds exactly (`straight, gapLip, drop, landing, booster`); `loop`/`springLauncher` (and bigCurve/sbend) appear in NO campaign tray and NO par build; `bank`/`curve` ship as GEOMETRY in exactly two fixtures tables — kitchen02 (`curve` run-out) and kitchen03 (`bank` bowl rim + `curve`). The callout system teaches what it PLACES, so a rung tray cannot honestly stock a loop (tray-parity and budget laws would break, and an ADD tail naming a loop on a gap rung is the playtest-M lie). Honest cure, two halves: **`firstSetAppearance()`** (§9.3's never-wired SET half — no firing site existed for any callout but a placement, `prop:*` included) speaks the shipped-kind line once ever on a boot the star-rules line didn't need; and the level select gains ONE calm line naming the sandboxes, what they keep (`loops and springs`), and the true way in (the farewell's first door, `?level=` doctrine untouched, nothing unlocked). Sandboxes verified quiet on the new path (all six fixtures = ramp+finishCup bookends).

## Law notes

- One hash MAY move: none moved. `replay:all` 30/30 at every checkpoint; `0b4dbab2` pinned in `goal-guard.test.ts`.
- Files: `src/world/level.ts`, `src/world/levels/kitchen02.level.ts`, `src/ui/builder.ts`, `src/ui/shell.css`, `src/ui/advice.ts`, `src/ui/result.ts`, `src/boot.ts`, `src/ui/callouts.ts`, `src/ui/levelselect.ts`, `scripts/a11y-contrast.mjs`; tests `goal-guard.test.ts`, `critique-where.test.ts`, `callouts.test.ts` (+describe), `goal-rung.spec.ts`, `p4-words-where.spec.ts`; one rebased baseline.
- Vault note reconciliation (Track Kit, ui, Levels) lands with the final commits of this branch — checkpoint commits carry the code.
