---
livedocs: snapshot
---

# 2026-10-09 Stage 4 - gesture and camera hardening (Feel Engineer)

Worktree `gw-feel10`, branch `stage4-gesture`. Four items from playtests R+S round 3,
in severity order. Every root cause below was REPRODUCED on the built page before the
fix, and every fix has a gate that was seen red on the pre-fix build (or is bitten in a
unit test where the browser geometry refused to reproduce).

## 1. Orbit dies / camera void — ROOT CAUSE: a lost pointer release leaves a stuck press

The recogniser (`attachBuildView`) trusted exactly one event — `pointerup` on the canvas.
Scripted reproduction (playwright-core, off-canvas-release / rapid-drag / drag+hover mixes):
a press whose release never arrives (released off the window / over browser chrome —
Playwright's off-viewport `mouse.up()` is never dispatched, the same class of miss a real
browser makes at window edges) left `press` non-null with `dragged: true`. Every later
HOVER `pointermove` then moved the framing — repro log shows the hover sweep alone
drifting `panTarget` to (0.65, -0.43) and parking `yawTarget` at the ±60° clamp:
S's "zombied into a parts-bin void" and R's "worked once, then dead permanently" (drags
into a saturated clamp read as ignored). The camera was not dead; the recogniser was
believing a button was still down, forever.

Fix — STATE ROBUSTNESS, three defences that none trusts a single event:

1. **Button reconcile**: every `pointermove` checks the physical `ev.buttons` mask against
   the pressed button; a move with the button physically up ENDS the press with no verb.
   Hover can now NEVER move the framing (worst case: one event, which is itself dropped).
2. **Window-level release net**: `pointerup`/`pointercancel` are decided on `window`, so a
   release the canvas misses still ends the press; `setPointerCapture` is best-effort in a
   try/catch. Second button joining an open press makes the verb ORBIT without re-anchoring
   the click origin; a held Space is released on window blur (the stuck-`spaceHeld` cousin).
3. **Home reset**: `Escape Escape` (600 ms window) zeroes the yaw/pan TARGETS from any
   state — the frame loop's damping walk brings the pose home. The hint line gained
   "· Home: Esc Esc". This is the recovery hatch by construction: no gesture sequence can
   strand the view.

Proof: `tests/e2e/camera-torture.spec.ts` — (a) lost-release + hard hover sweep moves the
framing state by EXACTLY nothing (red on b93efbf: hover panned — repro log above);
(b) 20 seeded randomized pointer ops (drags, off-canvas/off-viewport releases, mixed
buttons, hover sweeps, click bursts) with per-op invariants (finite, yaw-clamped,
table-bounded), ending: a fresh right-drag STILL moves the yaw and Esc Esc damps to ~0;
(c) Esc Esc homes a clamped+parked view. `build-view.spec.ts` unchanged and green.

## 2. Click-place no-ops — ROOT CAUSES: silent drag latch + pointer-path-only verb

Two ways a place intent died silently: (a) the 6 px click threshold — a real click with a
few px of finger travel latched as a framing drag and the release placed NOTHING while the
ghost said "fits here" (R's exact complaint; Enter was immune); (b) a `click` with no
pointer sequence behind it (synthetic/automation, `detail 0`) was routed to no verb at all
— the "Enter worked, the pointer route did not" event-ordering split.

Fix: `CANVAS_DRAG_PX` 6 → 20 (a click that lands, lands; a deliberate pan never stops
inside 20 px — the build-view drag proofs use 100+); a synthetic click routes to the same
place verb, deduped against the pointer path (700 ms / 20 px); and placement is
IDEMPOTENT-VISIBLE — every `place()` failure path speaks ("no open socket to place at …",
the budget lines), a click is never a coin-flip into the void.

Proof: `tests/e2e/click-place.spec.ts` — ten mouse-API click-places all register (each
followed by Delete so budget cannot excuse one), a 12-px-travel click places and leaves
`panTarget` at (0,0), the budget wall leaves the status line SPEAKING, and a synthetic
`node.click()` places exactly once (real click on the same point then places exactly one
more). 10/10 + 4/4 green.

## 3. Aim depth disambiguation — ROOT CAUSE: screen-nearest projection, no depth vote

`socketAtPoint` claimed the screen-nearest open socket within `HOVER_PX` (120 px). Under
orbit the near flight-line socket and the far chain socket project within pixels; the FAR
one won by a hair and the landing "always snapped onto the chain BEHIND the cup" (S, K3).

Fix: `socketCandidates` — everything within `HOVER_PX`, reduced to the near-ties of the
screen-nearest (within `AIM_TIE_PX` = 28 px of its screen distance), then ordered by
CAMERA DISTANCE ascending: the NEARER depth wins a tie. The choice is EXPOSED: the target
label says `· n of m near — [ ] to pick the other`, and `]`/`[` (and Tab at world focus —
never over a control) cycle the ring through the candidates (`cycleAim`; keys are the
characters — `ev.key` is `]`, a bug the first spec run caught). Arrow-walk and any
mutation retire the tie list. `__gwOpenSockets` seam added for the proof.

Proof: `tests/e2e/aim-depth.spec.ts` — K3 at a 30° orbit, the closest screen pair with a
depth split, aim its MIDPOINT: the ring lands on the NEARER socket (far one >2 cm away),
label says "near", `]` → far socket, Tab → back. Red pre-fix by construction (no tie rule).

## 4. Wide-hold on FAILURE paths — ROOT CAUSE: the end-hold was the CUP-biased table solve

On fell/stalled/timeout the shell re-solved `frameCamera` with the car's final point merely
ADDED to the box — framing stayed cup-biased and the composed eye had no clearance rule
against the set solids (the run camera has one; the static hand-back did not). R's "buried
in a peach wall — never saw the marble fall" lives exactly there: the terminal step and the
damping ticks after it (where `buildView.step → apply` was overwriting any lift with the
raw table pose).

Fix: `frameDeathHold` (`src/camera/build-camera.ts`) — same table family, WIDER
(span × 1.5, floor 1.4), look-at biased 55 % toward the car's LAST SEEABLE point, and the
sightline clearance SOLVED not guessed: the eye Y is solved so the ray clears a blocker's
top at the crossing ENTRY parameter (`y(t) = (1−t)E + t·Ty` — lifting merely to `top + m`
re-dives below a near wall's top on a downward sight; an earlier revision of this function
shipped that mistake and the unit test caught it). Boot holds the witness in `endHold` so
the damping tick RE-SOLVES the cleared pose; Retry/Launch/edit clear it; success keeps the
cup framing unchanged.

Proof: unit — a wall containing the wide hold's own eye: the identical solve WITHOUT the
clearance is buried, WITH it sits above the wall top with the death still the subject
(<0.6 rad); a flung-off-world death stays ±0.6 m clamped; an empty build can't crash it.
E2E — `filmstrip.spec.ts` new test: scripted wrong build on L04 (par line, run-out stripped
through the shipped Remove button → `fell` at 2.33 s), sampled every 100 ms across the
final second AND the whole end-hold window after the terminal step: ≥20 frames, none
>60 % single-colour (measured max ≈30 %), and the settled car projects IN FRONT of the eye
inside the canvas — the death site is on screen while the verdict lands. Note: on this
scripted geometry the pre-fix hold passed the colour bar too (0.316), so the gate carries
the DEATH-IN-FRAME assertion as the part with teeth; the wall-bury mechanism itself is
unit-bitten (the scripted kitchen04 death site is not inside a wall — R's exact build
could not be reproduced without hand-editing their chain, and the fixtures-only and
landing-stripped builds both die in the open).

## Gates

* unit: 542 passed (31 files) — `build-camera.test.ts` +3 death-hold tests.
* e2e: 82 passed (41.5 s) — +`camera-torture`, +`click-place`, +`aim-depth`;
  `build-view`, `loop` (hint copy), filmstrip all green on this branch.
* filmstrip: 3 passed — +L04 failure end-hold.

## Notes

`Modules/camera` (end-hold + gesture contract rewritten in place), `Modules/ui` (aim
verbs, tie keys, threshold, never-silent), `Modules/src` (boot hand-back sentence)
updated; `world`, `replay`, `Concepts/Levels`, `Reference/Level Ladder` honestly acked
(their claims about the touched lines are untouched by this diff). This note is
livedocs: snapshot.
