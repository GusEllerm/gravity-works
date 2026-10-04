---
tags: [concept]
---
# Feel

> [!abstract] Role
> The feel bible: physics and camera targets the Feel Engineer owns. These are targets to be *measured against*; measured values replace targets as they land, with a Decision Log entry per change.

## Physics targets

- Fixed step **120 Hz**, render-interpolated, substeps allowed for fast cars. Never a variable step.
- Car: rigid body with four wheel colliders **or** raycast wheels — chosen at stage 1 by a two-variant bake-off on the feel track; the one that survives loops and landings wins.
- Simulate at a scaled mass/length (a literal 0.05 kg at 1:64 is too light for solver behaviour); the **visual** scale stays 1:64. The scale factor is documented in exactly one place: this note.
- Rolling resistance + bearing friction: a car released from a **30 cm drop onto flat track rolls ≈ 2.5 m** before stopping.
- Loop physics within **10 % of theory**: minimum release height for a loop of radius r is a little over 2.5 r frictionless; with game friction the game lands near that. Guarded by a test.
- Continuous collision detection on cars. Track pieces: static trimesh or compound convex colliders generated from the **same spline as the mesh** — what you see is what you hit.
- Determinism: a run is (level, build, seed); hash body transforms every 10 steps; the share link carries the final hash; replay recomputes and compares.

**Measured:** _pending stage 2 (physics not yet built)_.

## Launch and release

- Click → first visible motion under **50 ms**.
- Held release charges nothing; release is the moment. Spring launchers charge visibly over **600 ms** with a click at full.
- Reset returns the car to start in under **300 ms**, no loading.

**Measured:** _pending_.

## Camera

- Run camera leads the car by ≈ **0.4 s** along the spline, 150 ms positional lag, slower rotational lag — turns anticipated, loops framed from the side.
- FOV 35° play / 28° replay. Tilt-shift focus band centred on the car, band height ≈ 20 % of frame, defocus tied to distance from the set's floor.
- No camera shake above a subtle landing thump.

**Measured:** _pending_.

## Juice list

Wheel-contact squeak at speed · track flex on landing · slight car squash on impact · dust puff at drop points · chime at the finish cup · piece snap = soft click + 0.25 s settle · hazard tells (tap drips before the patch spreads; sprinkler ticks before it fires). Every item has a reduced-motion equivalent.

## The feel track

One permanent test level exercising everything: drop → straight → banked turn → loop at threshold radius → gap jump → landing ramp → finish cup. Every tuning change is driven on it with a recorded replay and a metrics table (time to finish, peak speed, loop completion margin, landing impact, deviation from previous replay). Replays live in the repo.

_Currently provisional — the real track lands at stage 2._

## Physics scale factor

**SIM_SCALE = 10** — the sim runs every length ×10, gravity ×10 (98.1), and mass ×1000 (constant density), and maps back for gameplay: length/10, velocity/√10, time unchanged. Why: Rapier's solver tolerances, contact prediction margins and sleep thresholds are tuned for bodies around its default length unit (~1 m). A 7.5 cm toy is 13× below that, and every absolute tolerance then bites proportionally harder — penetration recovery, seam stitching, and small-velocity stiction thresholds swallow the car. Scaling geometry and gravity by the same factor keeps real-world time (a 120 Hz fixed step stays real-time), and ×1000 mass keeps density physically meaningful. This is a rendering-agnostic sim-space choice: all track/car authoring is in world metres; `src/physics/sim.ts` owns the conversion. Decided here; referenced, never re-derived. — Feel Engineer, stage 1 bake-off
