---
livedocs: snapshot
---

# 2026-10-09 Stage 4 - round4 feel fixes (Feel Engineer)

Worktree `gw-feel11`, branch `stage4-final-feel`. Three confirmed round-4 items (playtests
T+U). Every root cause was REPRODUCED on the built page first (temporary repro specs, since
deleted); every fix carries a gate in `tests/e2e/playtest-tu.spec.ts` that was seen failing
on the pre-fix build.

## 1. World-click placement dead after rotation/orbit — TWO causes, both silent

Reproduced: kitchen01/feeltrack, right-drag orbit, click at the projected ghost — and the
instrumented probe (`__gwTargetSocket` + live-pose projection + event log) split the
behavior from the pointer path.

**a. The zombie ate exactly one click per orbit (the testers' case).** A right-drag whose
`pointerup` is LOST (menu-up, release over chrome) left `press.button = 2`. The join rule
in `attachBuildView`'s `pointerdown` handed any press arriving before the first
reconciling hover to that zombie ("right wins the verb") — so the next LEFT press kept
button 2, its release could never be a clean click, and the click died with NO status
line. One dead click per orbit, "fits here" on screen, Enter always working: T's "twice",
U's "after rotating, yes". FIX — the physical-button mask is now checked AT PRESS, not
only on hover: a left `pointerdown` whose right bit is physically UP is not joining an
orbit; the stale press is re-anchored as this left click and the click lands. Gate: the
dispatched-lost-release sequence (`pointerdown` right, one orbit `pointermove`, NO
pointerup) followed by a real `mouse.down()/up()` — registers, red pre-fix.

**b. The click re-decided the aim instead of honoring the ghost.** `clickPlaceAt` re-ran
`aimAt` at the release point — a SECOND projection of the aim question. While the pose is
still damping (~0.5 s after any gesture) the ghost SLIDES under the cursor between the
hover that showed "fits here" and the release, so the click could bind to a socket the
ghost never showed. FIX — `clickPlaceAt` now shares the aim: if the ring is within
`HOVER_PX` of the release point (`ringWithinReach`), the placement binds to the ring's
own socket; only a click away from the ring re-aims (unchanged rule). Gates: ten mouse-API
click-places on the projected ghost after a 40° orbit — and again with the R flip armed —
each must register or SAY itself; plus a click thrown mid-damping lands on the shown ghost.

**c. Never-silent completed.** An empty-handed world click used to move the ring with no
line; it now says "nothing in hand — pick a piece from the tray, then click to place".

Sweep note: kitchen01's one-lip tray EXHAUSTS after the first place (stuck-hold release),
so the gate sweep runs on the sandbox tray — the exhaustion path is already spoken for by
the `last X placed` line (it self-identified in the repro as the "nothing in hand" line).

## 2. Esc-home inert — ROOT CAUSE: `RECENTER_MS` = 600 ms, a double-TAP window

The wiring was sound (`view.reset()` from any state, damped walk home) and
`camera-torture`'s back-to-back presses passed. A HUMAN reading "Home: Esc Esc" presses a
two-KEY SEQUENCE: scripted at a 900 ms gap the view stayed stranded — both testers'
experience. FIX: `RECENTER_MS` 600 → 1500, and the hint copy is one honest description:
"Home: press Esc twice" (`loop.spec.ts`'s literal updated). Gate: orbit+pan "somewhere
hostile" → Esc, 300 ms, Esc AND Esc, 900 ms, Esc → yaw/pan state zero AND the eye back at
the pre-drag pose (mm-level).

## 3. Pillow Plateau's cup invisible — the LAW holds; the recovery hatch was broken

Measured per level through a new `__gwGoalNdc` seam (cup capture centre projected by the
LIVE camera): the 0.35 goal-bias framing puts the cup at |ndc| ≤ 0.30 on ALL 21 rungs at
build framing (bedroom02: 0.271, −0.243) — the focus set needs NO fix. U's invisibility is
item 2's downstream: a pan/orbit slides the goal away, and with Esc-home inert there is no
way back. The law is now SWEPT, not asserted: the gate walks all 21 campaign levels at
fresh framing and `?build=par` and asserts |ndc| ≤ 0.9 (cup radius margin) per rung.

## Pre-existing red at HEAD (NOT regressions; not touched)

- `aim-depth.spec.ts` was red at HEAD because the keydown table's `BracketRight`/
  `BracketLeft` CODE names were unreachable via `keys[ev.key]` — the advertised `[ ]`
  tie chord was DEAD (the note claimed "the keys are the CHARACTERS"; the code said
  otherwise). One-line repair in scope (`keys[ev.key] ?? keys[ev.code]`); gate green.
- `filmstrip.spec.ts` "L04 scripted wrong build" fails IDENTICALLY at HEAD (status line
  reads `fell off — 2.33s`, the gate polls for `fell off the set|stalled|timed out` —
  run-status copy drift in the watchability lane). Left red for SE; not build framing.

## Proven on

`tests/e2e/playtest-tu.spec.ts` 8/8 (red before, green after); full e2e 96/96; unit 572
passed; filmstrip 2/3 (item above). Notes reconciled: `Modules/ui`, `Modules/camera`.
