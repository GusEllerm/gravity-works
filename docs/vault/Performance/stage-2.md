---
livedocs: snapshot
tags: [performance, stage-2]
---
# Stage 2 — frame-time baselines

> [!abstract] Role
> Measured frame times for the Stage 2 spine, from `tests/e2e/perf.spec.ts`. The gate definition lives in [[Performance Baselines|Reference/Performance Baselines]]; this note is the dated measurement (a snapshot).

## Machine note

Measured 2026-10-05 by QA on: **Apple M5 Pro, 20-core integrated GPU, macOS 26.6.2**, Node 22.22.1, headless Chromium via Playwright 1.63 (WebGL through **SwiftShader software GL** — no hardware GPU in the browser process). CI machines will differ; the honest CI gate is the GPU-free one (mode B), per [[Performance Baselines]].

## Measurements

Scene: **feel track** — the real game shell (`/`, placeholder build = the 9-piece kit feel track, plain materials; the post stack does not exist in stage 2, so "post off" is the shipped page itself). Run relaunched at each terminal status to cover ≥5 s of **simulated** time.

| Scene | Mode | frames | median | p95 | mean | max | fps | sim/wall |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| feel-track | A — stepped **and rendered** (headless SwiftShader) | ~286 | **16.70 ms** | 16.70–16.80 ms | 16.67 ms | 16.80 ms | ~59.9 | **1.00** |
| feel-track | B — World stepping only, `visuals: false`, Node | 60×(10 steps) | **0.70–1.07 ms** | 2.70–3.90 ms | 1.30–1.73 ms | ≤40 ms | budget headroom 15–24× | — |

Three repeat runs; ranges show the spread. Mode B samples one 60 Hz frame's worth of physics (10 steps at 120 Hz).

## Which number is meaningful

- **Mode B is the portable gate.** No GPU, no compositor — pure `World.step()` cost. 10-step frames land ~1 ms against the 16.7 ms budget (~15–24× headroom), so the fixed-step physics half of the spine can feed 60 fps on any Node-capable machine. This is what CI hard-asserts.
- **Mode A passes here, pinned to the vsync ceiling.** Median 16.70 ms = exactly the headless 60 Hz rAF interval with zero dropped frames (max 16.80 ms) and a sim/wall keep-up of 1.00 — the frame workload fits inside the budget even under a software rasteriser. But a vsync-paced median is a *ceiling*, not a *cost*: the headroom above it is unmeasured, and on a slower CI VM a SwiftShader miss would be a statement about software GL, not the game. The spec therefore records mode A, only hard-gates the weaker "pipeline produces frames" claim, and keeps the keep-up assertion (the loop may not fall behind the clock).
- **Integrated-laptop-GPU verification** (the brief's literal machine class) becomes meaningful when the post stack and a real set exist — re-measure at stage 3 and record here per stage.

## Reproduce

`E2E_PORT=<free port> npx playwright test perf` (prints both lines as `[perf:rendered]` / `[perf:stepping-only]`).
