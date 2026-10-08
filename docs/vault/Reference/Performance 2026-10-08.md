---
livedocs: snapshot
tags: [reference, performance, stage-6]
---
# Performance 2026-10-08 (stage 6 — every set at 60 fps)

> [!abstract] Role
> The stage-6 performance pass: **all six sets, measured on the reference machine with hardware GL, at their busiest hero rung — every one at 60 fps median.** Gate definition lives in [[Performance Baselines]]; prior stages' numbers in [[stage-3]] / [[stage-2]]; per-stage ledger in [[Performance]]. This is a snapshot note: the measurements and the machine, not the gate. Harness: `node tools/perf-table.mjs` (added by this pass; artefacts under `tmp/stage6-perf/`).

## Reference machine (the box the verdict is stated on)

**MacBook Pro — Apple M5 Pro, 18-core CPU (6 Super + 12 Performance), 20-core GPU, 48 GB, Metal 4, macOS 26.6.2 (25G83)**, Node 22.22.1, Playwright 1.63 headless Chromium launched with `--use-angle=metal`, so the WebGL path is **`ANGLE (Apple, ANGLE Metal Renderer: Apple M5 Pro)`** — a real GPU, which is exactly what the stage-3 note deferred to ("the integrated-laptop re-measure remains an open item for the stage-6 performance pass"). That deferral is CLOSED here. rAF on this box is 60 Hz-paced: a workload far under budget still reports ~16.70 ms frames, which is why the pass reports an **unpaced frame cost** beside the gated median (below), and why a median of 16.70 ms with 0 dropped frames IS the pass, per the stage-2 vsync-EPS reading in `tests/e2e/perf.spec.ts`.

Everything is at the GAME resolution, 960×540 (`renderer.setSize(960, 540)` in `src/boot.ts`), with the World stepping at 120 Hz and the real rAF loop rendering, over ≥5 s of *simulated* time per run (relaunch at every terminal status, the stage-2/3 measurement-A pattern).

## Method (what was measured, and where it is honest)

- **Verdict = hardware GL only.** `--gl hardware` launches Metal ANGLE and the harness **aborts if the page reports a SwiftShader/llvmpipe renderer**, so no software frame can masquerade as a hardware number. Software numbers are recorded separately below as CI-truth context.
- **Hero rung = measured, not assumed.** Every campaign rung (all 30) was probed at `?level=<id>&build=par` and ranked by per-frame draw calls (triangles as tiebreak). Within a set the spread is ≤1 draw except in the kitchen (50→56), because at `build=par` every authored piece is already mounted and rungs differ only by fixtures — a **tray is builder inventory, not meshes**, so the heaviest-*tray* rung is rarely the heaviest-*scene* rung. Where the top tied, the tiebreak rung is named in the notes.
- **GPU counts are taken at the WebGL command boundary** (`drawArrays`/`drawElements`(+instanced), `createProgram`/`deleteProgram`, wrapped on both WebGL prototypes by an init script), which is the same work `renderer.info.render.calls/triangles` counts one level up. It is deliberately not `THREE.info`: the game page exposes no renderer seam, and adding one to `src/boot.ts` for an audit — a file a dozen notes anchor — was the worse trade. The boundary probe also sees the post stack's passes, which is the honest per-frame cost.
- **Two post modes.** `post=off` is the shipped page (`?post=on` is the only way the composer is mounted, per `src/boot.ts`); `post=on` is the stage-3 bar at the shell's default `high` tier, i.e. the worst case. **The table below is the worst case.**

## The six-number table (hardware GL, post stack ON, ≥5 s sim per run)

| set | hero rung | median | p95 | draws/f | tris/f | notes |
|---|---|---:|---:|---:|---:|---|
| kitchen | `kitchen03` | **16.70 ms** | 16.70 ms | 40.9 | 12.0k | 0 dropped frames, cost 3.5 ms, keep-up 1.00. Tied on draws with `kitchen05` (56 idle draws each); `kitchen03` wins the triangle tiebreak — `kitchen05` has the room's biggest TRAY (6) and the same geometry, which is the tray-is-inventory point below. |
| bedroom | `bedroom02` | **16.70 ms** | 16.70 ms | 58.5 | 14.0k | 0 drops, cost 3.5 ms, keep-up 1.00. Highest idle count in the set (82); every bedroom rung is within 1 draw of it, so the room is flat by construction. |
| bathroom | `bathroom04` | **16.70 ms** | 16.80 ms | 40.0 | 10.5k | 1 dropped frame (max 33.4 ms) out of 301, cost 2.6 ms, keep-up 1.00, 15 programs — the most programs of any set (more distinct materials), the fewest triangles. |
| garden | `garden04` | **16.70 ms** | 16.70 ms | 41.9 | **63.0k** | 0 drops, cost 2.6 ms, keep-up 1.00. The triangle-heavy set (90.2k idle — grass/trellis fills); still cheaper per frame than the kitchen in draw terms. |
| garage | `garage04` | **16.70 ms** | 16.80 ms | 47.0 | 7.4k | 0 drops, cost 3.2 ms, keep-up 1.00. Fewest triangles in the house (the mezzanine port is boxes and slabs). |
| porch | `porch04` | **16.70 ms** | 16.70 ms | 51.2 | 52.2k | 0 drops, cost 4.5 ms, keep-up 1.00, 4 relaunches in the window. **The heaviest set: 108 idle draws, ~2× the kitchen's 56** — see the note below. |

**§12 triage: not needed and not applied.** No set missed 60 fps median, so nothing was dropped — no prop count cut, no post cut, no resolution cut. Prop count is untouched in every set.

For completeness, the same six rungs on **the shipped page (post stack OFF)**: every median 16.70 ms; p95 16.70–16.80 ms; draws/f kitchen 32.8, bedroom 50.6, bathroom 32.1, garden 33.9, garage 38.9, porch 43.3; unpaced cost 2.4–3.9 ms; one dropped frame in the whole set (kitchen `kitchen03`, max 33.50 ms); keep-up 0.99–1.00. The post stack is ~8 draw calls of fullscreen passes per frame on every set (40–59 on, 32–51 off); its *time* sits inside the noise of the cost probe (−0.6 to +0.6 ms), i.e. the ladder is not what makes a frame on this machine — consistent with the tier probe in [[stage-3]].

### The two-rows-apart note the brief asked for (draws are not the median)

Every set lands on the same 16.70 ms median, but the *GPU-side* cost is not equal, and the ordering is not the ordering a frame time would imply:

| set | idle-table draws | idle tris/f | run-window draws | unpaced cost (post on) |
|---|---:|---:|---:|---:|
| kitchen | 56.0 | 20.8k | 40.9 | 3.5 ms |
| bedroom | 82.0 | 26.4k | 58.5 | 3.5 ms |
| bathroom | 51.0 | 14.8k | 40.0 | 2.6 ms |
| garden | 76.0 | 90.2k | 41.9 | 2.6 ms |
| garage | 81.0 | 14.7k | 47.0 | 3.2 ms |
| porch | 108.0 | 76.1k | 51.2 | 4.5 ms |

Two things follow. (1) **The porch draws ~1.9× the kitchen's calls at the table (108 vs 56) and still clocks the same 16.70 ms** — at 3.5–4.5 ms unpaced cost the machine is ~4–6× inside the 16.7 ms budget on every set, so draw-call count is currently invisible against vsync; it is the *first* thing to watch if a set doubles its prop count, and the column to diff when it regresses. (2) **Draws and triangles do not rank the same set** — the garden is second-cheapest in calls (41.9 in the run window, behind the bathroom's 40.0) and carries the heaviest polygon load (63.0k, 1.2× the porch and 4.5× the bedroom); the garage is the mirror image (47 calls against 7.4k triangles). A future budget belongs on both axes. The run-window counts are lower than the idle counts because frustum culling retires the set dressing once the run camera leaves it — the idle column is the worst visible geometry, the run column is what a launch actually pays.

## CI truth: the same six runs under SwiftShader (`--gl software`, post ON)

Recorded for context only, NEVER as the verdict — a software rasteriser cannot prove hardware 60 fps (the stage-3 CI-truth rule, `tests/e2e/perf-stage3.spec.ts`). Renderer as reported by the page: `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (LLVM 10.0.0)), SwiftShader driver)`.

| set | level | median | p95 | dropped frames | keep-up |
|---|---|---:|---:|---:|---:|
| kitchen | `kitchen03` | 16.70 ms | 33.20 ms | 14 | 0.88 |
| bedroom | `bedroom02` | 33.40 ms | 133.30 ms | 75 | 0.91 |
| bathroom | `bathroom04` | **66.70 ms** | 200.00 ms | 55 | 0.78 |
| garden | `garden04` | 33.30 ms | 83.30 ms | 91 | 0.86 |
| garage | `garage04` | 16.70 ms | 33.40 ms | 35 | 0.91 |
| porch | `porch04` | 16.70 ms | 33.40 ms | 70 | 0.89 |

Honest caveats: these are THIS Mac's SwiftShader (fast CPUs, so kinder than a Linux CI runner — stage 3 recorded a 351 ms high-tier median there), and they are noisy (a 1.8 s max frame appears even where the median is pinned). The honest CI-assertable claims stay the ones already in the suite: GPU-free `World.step()` budgets and keep-up (`tests/e2e/perf.spec.ts` B, `tests/e2e/perf-stage3.spec.ts` C), plus the hardware-GL branches, which are HARD wherever a hardware GL runner exists — and this machine is one.

## CI budget (item 4: no coverage was traded for speed)

Measured on the reference machine, this pass: **vitest 5.3 s** (755 tests, 36 files), **Playwright e2e 2 m 26 s** (183 tests, 1 skipped, `fullyParallel`, hardware GL — the perf specs' own 5 s windows dominate), **filmstrip config 27.8 s** separately (it owns port 4210 by design and cannot share the parallel suite). ~3 minutes total. That is acceptable for what the suite proves, so **nothing was removed, skipped, shortened, or parallelised away for time** — no test lost a case to this pass, and the two perf specs' ≥5 s simulated-time windows stayed at 5 s. If CI ever needs minutes, the honest place to look is the specs' own `page.goto` count, not their assertions.

## Reproduce

```
npm run perf:table                                      # build + 30-rung probe + six verdicts, hardware GL
node tools/perf-table.mjs --gl software --post on \
  --levels kitchen03,bedroom02,bathroom04,garden04,garage04,porch04   # the CI-truth column
```
The tool takes ports from 4430 up (`--port`), prints both tables and writes `tmp/stage6-perf/*.json`.
