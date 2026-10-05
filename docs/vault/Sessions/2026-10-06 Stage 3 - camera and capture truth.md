---
livedocs: snapshot
tags: [session, stage-3, feel]
---
# 2026-10-06 Stage 3 — camera and capture truth (feel engineer)

Worktree `gw-feel5`, branch `stage3-camera`. Ledger: playtest E/F/G items owned by feel —
beige wall, terminal-status latency, the finish-cup contradiction, failure-note vocabulary.
All measurements below are reproducible from the tests named; camera probe rigs lived in
`.scratch/` (untracked).

## 1. Beige wall — RunCamera no longer buries into set solids

Measured root cause (headless replay of the L01–L04 par runs through `RunCamera`): the old
rail-lead eye sat AHEAD of the car for 67–72 % of every run — the car was behind the camera
plane, and "beige wall" was the chassis interior or a blurred solid filling the frame. Fixed
the eye model in `src/camera/run-camera.ts` (trail on the rail behind the car, sweep-clamped
`TRAIL_MAX_SWEEP` 1.05 rad at the 0.12 m bowl rim, launch dolly `LAUNCH_PEEP` 0.10 m, and a
set-solid clearance pass with `CLEAR_MARGIN` 0.04 m / filtered lift lag 0.25; measured values
in [[Modules/camera]]).

Proof: the 250 ms filmstrip e2e (`tests/e2e/filmstrip.spec.ts`, port 4210, L02 par run,
9 frames): worst single-colour share 41.6 % against the 60 % bar, car in-frame every step;
plus a unit proof that the eye is never inside a set solid across all four pars.

## 2. Terminal-status latency — 12 s → 0.59 s

Playtest E understated it: a car stopped dead on the deck NEVER concluded `stalled` — the
contact corrector's jitter reads 0.02–0.05 m/s of phantom speed, above the old 0.02 m/s
threshold, so the counter never filled and the run rode to the 12 s timeout. Tuned
`STALL_SPEED` 0.02→0.05 m/s (0.67 car-lengths/s at 1:10 — below anything that reads as
motion) and `STALL_SECONDS` 2.0→0.5 s. Concludes ~0.59 s after the real stop (≈10 steps of
spawn settle + the window). Status-only: the feel-track hash (`cee96961`/`90d4cd69`), the
finish step, and every `pars.json` hash are bit-identical across the swap — pinned in
`tests/unit/world.test.ts` and [[Modules/physics]].

## 3. The finish-cup contradiction — real miss, now closed

Playtest G's "car visibly inside the cup, scored 0 / flew off" is a REAL capture-math miss,
not a misread: capture tests the chassis CENTRE against a 2-radii sphere (`CUP_CAPTURE_FACTOR`
2 → 0.072 m); a car that dies with its nose in the 0.045 m bowl rests with its centre on the
RIM — measured 0.084 m out in the launch-speed sweep — and the stall branch ended the run
`stalled` while the picture said made-it. Fix: the STALL branch of `observe` gets a
cup-centre + chassis-half-length (0.0375 m) reach test — a stopped car whose nose reaches the
cup is captured. The moving-capture test is untouched, so every run that finishes in motion
keeps its terminal step and hash (pars regenerate byte-clean). Regression pair in
`tests/unit/world.test.ts`: launch 1.7 m/s rim-stop now `finished`, launch 1.4 short-stop
still `stalled`.

Art-director, one legibility check: the finish fixture reads ambiguous next to the set's
coffee mug — G wrote "cup (mug?)" unprompted. Measured L04: capture centre at (2.435, −0.457,
0); the set mug sits 0.77 m away diagonally at counter height (box 1.83…1.95, −0.27, 0.43…
0.55), cereal bowl 0.74 m, carton 1.00 m — near enough in a shallow-focus chase frame to be
read as one prop. No physics change; worth a silhouette/material difference on the real cup.

## 4. Failure-note vocabulary — one verb per physics event

Playtest E ("snapped vs seated") and G ("status line says seated with a flew-off verdict")
were the same bug wearing two hats: placement and physics shared verbs. Table now, enforced
in `tests/unit/stars.test.ts` (note heads) and `tests/e2e/builder.spec.ts` (ghost words):

| event | verb (status line = note head = the one verb) |
|---|---|
| cup capture | `finished` (shell); "seated" is reserved for the cup capture in `world.ts` |
| leaving the set | `fell off` — never also "flew off" / "landed nose first" |
| stopped without grip | `stalled` — never also "ran out" |
| clock | `timed out` — never "never made it" |
| piece meets socket | `snapped` / `reversed` (amber, reverse mount) / `invalid` / `blocked` |

Renamed the builder ghost state `seated` → `reversed` in `src/ui/builder.ts` (it always meant
"flipped reverse mount, gate honest"; the word collided with the cup). Systems engineer:
`runStatusLine` in `src/boot.ts` is unchanged and canonical — if the shell ever wants a
cup-specific win line ("seated in the cup"), take it from the stall-capture branch, not a new
verb. `physicsNote` heads now equal those status words verbatim.

## 5. Verification

vitest 255 green; feel harness hashes unchanged (`cee96961`, `90d4cd69`); `pars.json`
regenerates byte-clean; e2e green except the pre-existing `visual.spec.ts` kitchen01 idle
baseline mismatch (980×540 vs 960×540 canvas scaling, present before this crew). Docs
reconciled: [[Modules/camera]], [[Modules/world]], [[Modules/physics]], [[Modules/ui]].
