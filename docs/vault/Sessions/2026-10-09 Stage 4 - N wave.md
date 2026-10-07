---
livedocs: snapshot
tags: [session]
---
# 2026-10-09 Stage 4 — N wave (systems engineer: boot/ui/shell wiring)

Wire-fault salvage: the prior attempt died before launching; this pass landed the playtest-N items
owned by `ui`/`boot` — panel/retry wiring, the star-rules lesson (level select + first boot — the
first-boot half is SHELL work, done here rather than wait on the retired LD handoff), the spent-kind
message audit, L01's boot default target — plus the kitchen02 boot-build (empty-tray) fault hardening
and the boot-invariant test.

## 1. The panel stopped swallowing the world + a permanent Retry

`#gw-result` got `pointer-events: none` + `user-select: none` on the root, with interactivity scoped
to `#gw-result-buttons` (`src/ui/shell.css`) — with the panel open, a canvas click inside the panel's
own rectangle reaches the canvas and PLACES, and a drag across the panel selects no panel text. The
viewport-safe compact pass (960×540, both buttons inside the window, no scrollback) is what the
result.spec assertion already proves the panel needs, so nothing depended on the panel scrolling
itself. The way back now lives OUTSIDE the panel: the permanent control beside Launch speaks the word
the playtesters looked for — label `Retry`, aria "Retry from the start — the build stays as built",
element id `gw-reset` kept as the test surface — and the shell wires it and `#gw-result-retry` to the
SAME `resetCar` (as-built: car home, build kept, panel away). A dismissed panel can no longer hide it.

## 2. Star rules before the first run

`starRulesLine(par)` (exported from `src/ui/result.ts`) states the three lines with a level's OWN par
numbers. It rides every OPEN rung of the level select as a `.gw-level-rules` line (registry/pars data
only, same no-mirroring rule as the names), and `src/boot.ts` says it quietly ONCE on a level's first
boot through `firstLesson` (`src/ui/callouts.ts` — the callouts' seen set under id `rules:<levelId>`,
no save-shape move). Teaching precedes failure: the rules are legible before the first launch, not
only on the panel after one.

## 3. Spent-kind messages

Audited every tray message path in `src/ui/builder.ts`. The real contradiction source: hovering a
SPENT-but-unlocked tray button silently swapped the held piece for it, so "no landing left in the
tray" could fire while the player believed they held the Lip. Hover now selects only a `selectable`
kind (a spent button says nothing on hover and steals nothing), and the spent/locked click lines
append "— you are holding <word>" when another kind is in hand: the message names the kind the CLICK
tried and never contradicts the piece held. `place()`'s cap line already names the held kind (the
only kind it can be about) — unchanged.

## 4. L01's initial target sits on the par rail

Verified first: NO merged or pending LD change covers this — the fixture reorder moves par data, but
the BOOT default is the builder's `targetIndex = 0` = list head = `level start` (a legal
`drop@start` dead end; N's eight-try wall), and the target-list order is a `builder.ts` rule, not
level data. So the shell owns the fix: `chainHeadIndex` walks the join chain from the first-built
piece (every fixture build starts on its start ramp; `JOIN_TOL` joins only, build order, no scoring)
and aims the boot default at the far open exit — the ramp exit where the par line begins. The bare
`level start` socket stays a target (arrows/hover still walk there); `place()`'s
follow-the-placed-piece rule is untouched. A later LD reorder only moves which socket the walk lands
on; the rule stays true.

Proof: `tests/e2e/playtest-n.spec.ts` (6 tests, green at `E2E_PORT=4250`: panel pass-through +
no-selection + hittable Retry; permanent Retry as-built after a dismissed panel; rules on the select
AND first boot, quiet on the second; hover-steals-nothing + both-kinds click; fresh kitchen01 first
Place at the default target advances the par chain — `target: end of ramp` → `end of lip` →
`end of drop` — and the pure-UI three-click build finishes ★★★). Updated `loop.spec.ts`,
`shell.spec.ts`, `set-wiring.spec.ts` to the new default (their ArrowRight walks now start at the
chain head). Full e2e suite green (65 passed), unit suite green (506), `tsc` clean.

## 5. kitchen02's boot build — the empty-tray fault (repro + hardening + invariant)

Reproduced first: current main does NOT exhibit it — a data probe over all 21 ladder rungs found
every tray/fixture table kind-DISJOINT, and a fresh-browser boot of `?level=kitchen02` shows the
tray full ("Straight ×2 · Drop ×1 · Lip ×1", 0 of 4 placed). The fault is a *latent class*: the
shell's fixture-vs-tray test was kind MEMBERSHIP (`p.def in fixtures`), which mounts the whole tray
onto the boot build the moment any rung puts a kind in BOTH tables — the shape of the report ("the
LD's full tray build is mounted at boot"). Fixed as the class: `initialBuild` now mounts by
PER-KIND FIXTURE QUOTA (the `fixtures` counts, build order) — the boot build can never exceed the
fixture multiset — and `trayParityBuild` / `playerPieceCount` share the same quota so parity anchors
what the boot mounted. New `tests/unit/boot-invariants.test.ts` pins, for EVERY rung: boot build ⊆
fixtures, tray/fixture tables disjoint (the gate that makes mount-rule decidability authorable, not
guessable), the tray boots FULL (allowance − mounted > 0 per tray kind), and parity anchors the
boot's fixtures at their transforms. Unit suite: 511 green.

Handoffs: LD — keep `tray` and `fixtures` kind-DISJOINT (the L02 curve run-out precedent); a pending
kitchen01/02 reorder that puts a tray kind into the fixtures table will fail the new invariant test
loudly rather than ship the empty tray — if a rung genuinely needs a kind in both, bring it and we
author a real mount rule. If the reorder lands a fixture ON the start socket, `chainHeadIndex`
follows the chain automatically; re-run the `set-wiring` target-order assertion on merge. FE — the
panel no longer owns the region above the stage for pointers; camera work is untouched. Earlier
specs' semantics unchanged apart from the documented default target; the rules-line copy may be
reworded by a copy pass without moving the wiring.
