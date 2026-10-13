---
livedocs: snapshot
tags: [session, house-era, loop-four]
---
# 2026-10-13 — Door seams (loop four's three below-9 lines, closed at the door)

Lane: h4-seams. The loop-four verdict left three lines below 9 and all three at the DOOR: the
self-contradicting status line, the trailer that cannot travel, the keyboard seams. This lane
funded exactly those three, red-first, on worktree `gw-k2`, branch `h4-seams`.

## 1. THE CONTRADICTION — one run prints ONE verdict (`h4: one verdict …`)

`finalize()` wrote the result line and never the status line: `#gw-house-status` "4 rooms · 3.7 s"
printed directly above `#gw-house-result` "…6.7 s — you stopped at the bathroom", both
`role=status`, one run. Fix: the result line IS the verdict; the status line is RETIRED at the
terminal edge (role lifted, text cleared) and RE-ARMED by `launchRun` (`role=status`,
`houseStatusLine(0, 0)`) as the live counter it always was. A re-release rides the same tape —
`lastRunHash` vs the terminal hash prints "same film — this release replayed the same tape" on the
retired line (no role, so still ONE live status).

- Red (pre-fix): `downhill.spec.ts › ONE run prints ONE verdict` — TWO live statuses after a run.
- Green: exactly one `[role=status]` with text page-wide (`gw-house-result`), asserted after BOTH
  releases; "same film" visible after the second.

## 2. THE TRAVELING TRAILER — Share at the door, sandboxes at the door (`h4: the trailer travels …`)

- `#gw-house-share` on the downhill result chrome, hidden until a terminal edge. The payload
  carries NOTHING the run did not already carry: `{v:2, levelId: house, seed: 0, hash,
  build: HOUSE.parBuild(), name: 'The House'}` — the INPUT law means the RECEIPT already commits
  the wind (wind is step-keyed LEVEL data; the link names the level), so the trailer rides the
  v2 envelope with zero new fields. Canonical envelope 7 707 B; `shareJson` stamps `"v":2`.
- Proof both halves, `downhill.spec.ts › THE TRAILER TRAVELS` (RED pre-fix: `#gw-house-share`
  not found): node side decodes the minted link and RE-SIMS the carried build → `6caea49b`
  807 steps `fell` 6.725 s — the receipt answers for the link; the friend page replayed from the
  link prints `verified`. `rememberLink` walks the chain like any share press.
- `#gw-home-sandboxes` — the six doors' free-build siblings on the home flow line (`?level=<room>-sandbox`,
  "garage free build · …" in descent order): one hop from `/`, Tab-named (`front-door.spec.ts ›
  FREE is one hop`, RED pre-fix: zero sandbox anchors).

## 3. THE KEYBOARD SEAMS — Escape + downhill Tab order (`h4: keyboard seams …`)

- ESCAPE CLOSES WHAT THE DOOR OPENED (home mode, fresh listener — the `mountHomeDoor` machinery
  stays where it belongs, the NON-home pages): open window closes via `openWindow(null)`
  (`aria-expanded` false, camera unparks), focus returns to the window button; else the Lines
  corner closes onto `#gw-lines-corner`. RED pre-fix: `aria-expanded` stayed `true` after Escape.
  (`front-door.spec.ts` × 2, focus walked INTO the panel with Tab first so the return is proven.)
- THE TAB WALK WALKS DOWNHILL: home's six window buttons are emitted in `ROOM_IDS` (descent) order
  — garage first, not CAMPAIGN-projection fifth. Nav order only; names, sills, tour bytes, sill
  stars unchanged (sill tests green untouched). The order assertion lives in `a11y.spec.ts`
  (RED pre-fix: the filter walk came back kitchen-first).

## Referees

- `npm run replay:all` — 30 rungs all verified, byte-identical; house receipt `6caea49b`
  (807 steps, `fell`, 6.725 s) unchanged — the share payload re-sims to it exactly.
- `npm test` — 1023 green. `src/boot.ts` untouched at 1595 lines (< 1700 budget).
- Full e2e on `h4-seams` green at the PR tree (port 5162, `E2E_PORT`); intro beat specs pass
  standalone (a one-off runner-saturation flake with the sound loudness suite in the same shard:
  the beat's rAF starves → `timeout` end — the phase seam proves the plan, stated per lane).
- Notes: `Modules/house.md` (three new laws), `Modules/ui.md`, `Modules/share.md` reconciled and
  stamped per commit; the Action Plan snapshot acked (dated plan, not restated).
