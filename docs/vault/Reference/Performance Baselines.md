---
tags: [reference]
---
# Performance Baselines

> [!abstract] Role
> The frame-time gate every stage is measured against (brief §2.4: 60 fps on an integrated laptop GPU is a gate, not a goal) and what CI may honestly assert. Owner: QA Engineer; per-stage numbers live in [[Performance]].

## The gate

For each shipped scene, over ≥5 s of simulated time with the World stepping and the real rAF loop rendering:

- **median frame time ≤ 16.7 ms** (60 fps),
- **p95 ≤ 25 ms**.

Post stack off is the stage-2 bar (no post stack exists before stage 3); post on becomes an additional bar at stage 3.

## What CI may assert (honesty rules)

Headless CI browsers rasterise with software GL (SwiftShader). Therefore the suite splits the claim:

- **`tests/e2e/perf.spec.ts` test B — hard gate.** The same `World.step()` loop with `visuals: false` in Node, timed per 10-step chunk (one 60 Hz frame at the 120 Hz fixed step). GPU-free, machine-portable, so CI asserts median ≤ 16.7 ms / p95 ≤ 25 ms on it.
- **`tests/e2e/perf.spec.ts` test A — reported.** The rendered game shell. On SwiftShader a 60 fps miss is a statement about the rasteriser, so CI asserts only (a) the loop keeps up with the clock (sim seconds per wall second > 0.8) and (b) frames are produced without page errors; median/p95 are printed and recorded in the stage note. On a machine with a real GPU the printed numbers are the gate verdict proper.

`docs/vault/Performance/stage-N.md` holds the measured table plus the machine note; a stage cannot close with those fields empty.

## Baselines

| Date | Stage | Scene | Mode | Median | p95 | Verdict |
|---|---|---|---|---:|---:|---|
| 2026-10-05 | 2 | feel track | rendered, headless SwiftShader | 16.70 ms (vsync-pinned, 0 drops) | 16.70–16.80 ms | pass |
| 2026-10-05 | 2 | feel track | stepping only (Node) | 0.70–1.07 ms / 10-step frame | 2.70–3.90 ms | pass, ~15–24× headroom |

Details: [[stage-2]].
