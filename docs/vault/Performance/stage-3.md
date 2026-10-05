---
livedocs: snapshot
tags: [performance, stage-3]
---
# Stage 3 — frame-time baselines (post stack ON)

> [!abstract] Role
> Measured frame times for the Stage 3 vertical slice with the **post stack ON** (the stage-3 accept line), from `tests/e2e/perf-stage3.spec.ts`. The gate definition lives in [[Performance Baselines|Reference/Performance Baselines]]; prior stages in [[stage-2]]. Snapshot note — the measurements, not the gate.

## Machine note

Measured 2026-10-05 by QA on: **Apple M5 Pro, 20-core integrated GPU, macOS 26.6.2**, Node 22.22.1, headless Chromium via Playwright 1.63 (WebGL through **SwiftShader software GL** — no hardware GPU in the browser process). CI machines will differ; the honest CI gate is the GPU-free one (mode C), per [[Performance Baselines]]. Same caveat as stage 2: a rendered miss here is a statement about the software rasteriser, not an integrated laptop GPU; the hardware-GPU confirmation stays deferred (it was deferred in stage 2 *for exactly this stage* — the integrated-laptop re-measure remains an open item for the stage-6 performance pass).

## Resolution, stated

All numbers here are at the **GAME resolution: 960×540** — the shipped canvas size set by `renderer.setSize(960, 540)` in `src/boot.ts`, asserted by the specs. NOT the canonical 1600×900 of §5.8 review renders. The frame budget is what the player pays.

## Measurements

Scene: **kitchen01, par build** — the real game shell (`/?level=kitchen01&build=par&post=on`), stepping at 120 Hz + rendering through the real rAF loop and the real post stack for ≥ 5 s of *simulated* time, relaunching at each terminal status. The shell renders the post ladder at its default tier (`high` — the shell exposes no quality URL knob, so the worst tier is what the game shell measures).

**A — rendered game shell, post=on, 960×540** (isolated runs / full-suite run):

| run | frames | median | p95 | mean | max | fps | sim/wall | blocking-time total (longtask sum) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| isolated 1 | 247 | **16.70 ms** | 33.30 ms | 19.16 ms | 183.3 ms | ~59.9 | **1.00** | 135 ms |
| isolated 2 | 275 | **16.70 ms** | 16.80 ms | 17.21 ms | 166.7 ms | ~59.9 | **1.00** | 130 ms |
| isolated 3 | 255 | **16.70 ms** | 33.30 ms | 18.50 ms | 166.6 ms | ~59.9 | **1.00** | 126 ms |
| full-suite (parallel contention) | 103 | 33.40 ms | 50.10 ms | 38.19 ms | 66.6 ms | ~29.9 | **1.00** | 488 ms |

**B — quality-tier render-cost probe** (harness `kitchen-set` establishing at `size=960x540&post=on&quality=<tier>&perf=90`; each timed frame serialised by a blocking 1-px `readPixels`, so absolute times OVER-state a pipelined loop — the rAF medians show the paced loop). Honest scope: harness scene = the set with parked cars on a fixed clock, **no physics, no run camera** — this isolates what each post tier costs a frame, on top of A's whole-loop number:

| tier (960×540, render-only) | median | p95 | rAF median | blocking-time total / 90 frames |
|---|---:|---:|---:|---:|
| high | 23.6–28.9 ms (65.5 under full-suite contention) | 26.9–37.7 ms | 16.7–33.3 ms | ~2.3–2.8 s |
| medium | 20.4–21.5 ms | 22.8–27.9 ms | 16.7 ms | ~2.0–2.2 s |
| low | 17.2–19.3 ms | 20.3–26.2 ms | 16.7 ms | ~1.8–1.9 s |

**C — World stepping only** (kitchen01 par build, `visuals: false`, Node, GPU-free; 60-chunk untimed warm-up per the stage-2 lesson):

| run | 10-step median | p95 | max | keep-up (sim/wall) | headroom |
|---|---:|---:|---:|---:|---:|
| isolated 1 | **0.41 ms** | 0.75 ms | 0.83 ms | 189.5 | 40.3× |
| isolated 2 | **0.47 ms** | 0.77 ms | 0.96 ms | 166.8 | 35.4× |
| isolated 3 | **0.44 ms** | 0.92 ms | 1.07 ms | 164.0 | 37.6× |
| full-suite | 0.81 ms | 2.25 ms | 2.50 ms | 84.7 | 20.6× |

## Which numbers are meaningful

- **C is the portable CI gate and it passes hard**: physics for the shipped kitchen line fits a 60 Hz frame with 20–40× headroom and the stepping loop keeps up ≥ 1.00 against the wall clock (asserted ≥ 1.00; measured 84–190). Together with the rendered loop's rAF-production + keep-up assertions in A, that is the claim CI may honestly green.
- **A meets the 60 fps post-on line BY NUMBER on this machine**: the loop a player pays holds a vsync-pinned 16.70 ms median (~59.9 fps) with sim/wall keep-up **1.00** in every isolated run. Honest asterisks, by number: p95 lands on 1–2 vsync ticks (16.8–33.3 ms — occasional double-frames), max spikes ~170–180 ms (world rebuild on relaunch), and total main-thread blocking time is ~130 ms over ~5 s of wall (longtask accounting) — 488 ms when the box is contended by the parallel suite. A vsync-pinned median is a ceiling, not a cost — B is the cost view.
- **B says the software-GL headroom is thin**: serialised render-only frames cost 17–29 ms — over budget alone — yet A still hits vsync because the real loop pipelines render behind physics and idle time; on slower hardware the high tier is the first candidate to drop (§8: drop post before resolution). The ladder works as designed at this resolution: high costs ~5–10 ms of serialised work over low.
- **Not integrated-laptop-GPU verification** — same deferral as stage 2, still owed at the stage-6 pass.

## Reproduce

`E2E_PORT=<free port> npx playwright test perf-stage3` — prints `[perf:rendered-post-on]`, `[perf:tier:high|medium|low]`, `[perf:stepping-only-kitchen01]`. Baselines for the visual side of stage 3: `tests/visual/<platform>/` (see `tests/e2e/visual.spec.ts` header for the platform strategy).
