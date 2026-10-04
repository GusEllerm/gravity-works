---
livedocs: snapshot
tags: [session, stage-3, feel]
---
# 2026-10-06 Stage 3 - hazards and juice (feel engineer)

Worktree `gw-feel4`, branch `stage3-hazards`. Four deliverables, four
commits, every one green (`vitest` 152, `tsc`, `node tools/feel.mjs` table
bit-identical: `90d4cd69`/`cee96961`, rollRamp 2.47 m, loopGate 2.30 r).

## Round note: the branch base was red

`tests/unit/post-params.test.ts` referenced a `src/dev/post-params.ts` that
was never committed — typecheck failed at my first commit's doorstep.
Reconstructed the module from the test's contract (post-effect parameter
records + presets), noted in [[Modules/dev]]. A stage cannot start from a
red base; this one was made startable, not papered over.

## 1. Hazard zones (ask #2a) — delivered and MEASURED

`src/world/hazards.ts` normalises level `wetPatch` data to cuboid zones;
`carStep` gained an optional `GripField` sampled AT EACH WHEEL CONTACT, and
grip now acts on every friction channel the solver actually has: RR
magnitude, per-wheel drag sharing (a straddled patch yaws toward the dry
side), self-align budget, variant-a live tyre μ. Proof, all in
`tests/unit/hazards.test.ts`: par-with-zone replays **bit-identical** to
par dry (`7adc07a8`, 2.450 s — the par line flies the patch, grip never
enters); the ground line's hash DIVERGES in-zone (`772b9e30` → `fce78ea5`)
and finishes; slip rig 2.38° → 3.98° (1.67×, > the 1.4× assertion floor);
factor-1 zones are bit-nothing. Honest limit stated in
[[Modules/hazards]] + Decision Log: on a U-channel the rails bound lateral
slide, so "slides wide" was NOT faked with an invented scrub force — the
measurable signature is the drag-differential yaw. **Flagged for LD
review**: the authored L04 patch sat ON the par rig's own landing run
(contradicting its own "par flies past" contract); re-centred onto the
ground build's seam — placement change, physics untouched.

## 2. Run camera — the residual snap found and measured out

The seam probe said it: the linear cache interpolation sat **1.8 mm off
the frame-derived path AT piece seams** (10× the smooth stretch, kinked
derivative = velocity hitch). `KitRig.railPointAt` now evaluates
`frameAt(s) + up·RAIL_WHEEL_HEIGHT` directly; seams are C0+C1 by
measurement (2.1 µm gap at 1 µm probes, 0.0005° tangent jump across every
socket of two real builds) and §7.3 lead/63 % are now measured end-to-end
on the loop rig's real 4 m run-out rail. [[Modules/camera]]. Shell wiring
still the integration item (unchanged).

## 3. Juice hooks (§7.4) — new `src/juice`

Pure echo, zero touch: `JuiceFeed.step(prev, next)` derives squeal
(slip-threshold calibrated between measured roll peak 8.5° and landing
skid 44.8°), landing squash + dust (real impulse: L04 par lands 0.067 N·s
→ 120 ms squash + 0.084 m puff), hazard tell (velocity-ray lead ≤ 350 ms,
test asserts `t(tell) < t(grip drops)`), snap settle (250 ms, builder
call), chime (terminal status). Reduced motion → animated juice emits
nothing, informational markers go instant. Hash neutrality pinned the hard
way: feed-on == feed-off == the shipped `7adc07a8`. New [[Modules/juice]].

## 4. Carry-ins: loop speed window — documented, not built

Full `loopTry` scan to 6 R, both variants: identical pass/fail rows, floor
2.30 R, NO ceiling — the droop tether is already the up-stop expressed in
forces. Decision (logged): window is `[2.30 R, +∞)` BY DESIGN, table +
reasoning in [[Modules/physics]] §speed window; `LOOP_RADIUS` unchanged —
still the 1.25× rule + 7 %; collider variant: PROVEN for the loop piece.

## Left on the table

- Run-camera + `JuiceFeed` wiring into the shell loop — one integration
  task, [[camera]]/[[juice]] carry the carry-in lines.
- L04 patch placement review (LD) — geometry change listed above.
- Hazard windows mode in `tools/feel.mjs`: the proofs live in vitest
  instead; a feel-table row would need a wet-route baseline nobody ships.
