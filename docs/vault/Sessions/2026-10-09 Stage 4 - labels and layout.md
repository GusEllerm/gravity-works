---
livedocs: snapshot
---

# Stage 4 — systems engineer: labels and layout (playtest M), 2026-10-09

## What landed

1. **Player words, not codenames** (`src/track/pieces.ts` `PIECE_LABELS` + `pieceLabel`, consumed in
   `src/ui/builder.ts` and `src/ui/help.ts`). Audited all 13 kinds: straight→Straight, curve→Curve,
   bigCurve→**Wide curve**, sbend→**S-bend**, bank→Banked turn, loop→Loop, drop→Drop, ramp→Ramp,
   gapLip→**Lip**, landing→Landing, booster→Booster, springLauncher→**Spring**, finishCup→**Cup**.
   Tray button text + aria-labels + the ×N legend + locked/spent messages + the `target: end of …`
   line + Help-glossary titles all speak these words; codenames survive ONLY as ids (element ids,
   `data-kind`, callout/help entry ids, saves). `gapLip`→"Lip" also makes the "lower the lip" advice
   and M's "bridge" habit refer to the same visible button. `tests/e2e/set-wiring.spec.ts`'s target
   assertion follows the word ("end of cup").
2. **Help overlays, never pushes** — measured and pinned: at 1280×720 the drawer is already a pure
   overlay (`#gw-help` absolute over `#gw-stage`); the canvas keeps ~98 % visible area with Help open
   and opening it moves neither the canvas rect nor the scroll. New `tests/e2e/labels.spec.ts` pins
   the >60 % claim + the identity of the rect/scroll before/after (M's page was the older deployed
   build; the contract is now regression-locked at main).
3. **Fingerprint copy** (`src/boot.ts`): the summary is one human line —
   "Same pieces, same run, every time — this code proves it." — details + `#gw-hash-value` unchanged.
4. **Rotate feedback** — FE's flip-echo handoff had not landed (both FE/LD worktrees still at main),
   so the press path in `src/ui/builder.ts` `rotate()` now prints a passive tail: `#gw-ghost-state`
   reads e.g. "flipped fit · rotated" after R or the Rotate button — and stays silent when nothing is
   held (nothing rotated). `tests/e2e/builder.spec.ts` updated to the new copy contract.
5. **"stalled after its last push…"** lives in `src/ui/result.ts` `physicsNote` — the Feel Engineer's
   derivation file. NOT edited (per brief).

## Handoffs

- **FE**: (a) `physicsNote`'s "stalled after its last push — the track ahead needs less than it gave"
  is yours per item 5 — M could not parse it; suggest naming the boosters ("the booster ran out before
  the climb"). (b) When the flip-echo lands on your side, coordinate with the ` · rotated` tail in
  `builder.ts` — one line, one owner; retire whichever duplicates.
- **LD**: M's "bridge" is the lip+drop gap-cross pair; the tray now says "Lip"/"Drop" — worth keeping
  level callout copy on the same words (`PIECE_CALLOUTS` in `src/ui/callouts.ts` already says
  "launch lip").

## Proofs

`npm run typecheck` + `npx vitest run` 506 green; full Playwright suite on `E2E_PORT=4240`
(59 passed) incl. `tests/e2e/labels.spec.ts` (labels/no-codename, 1280×720 help-overlay >60 %,
fingerprint line, rotated echo on both press paths).
