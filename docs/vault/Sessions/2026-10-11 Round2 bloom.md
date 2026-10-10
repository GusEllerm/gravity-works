---
tags: [session, round2, lane-d]
livedocs: snapshot
---
# 2026-10-11 Round2 bloom (Technical Artist, Lane D)

Worktree `gw-z3`, branch `r2-bloom`. Lane D of [[Action Plan 2026-10-11]] — bloom and the two-games rooms.
Rule honored throughout: **no sim touch** — materials, cameras, rigs, film data only; `replay:all` byte-identical
(verified at close, see CLOSURE below).

## 1. BLOOM size gate (the never-list ban, mid-run-verified)

`SoftBloomPass` bright pass now gates on `min(center, neighbourhood-mean)` over a plus of ±`BLOOM_SIZE_GATE_TAXELS`
(2 quarter-res texels = ±8 screen px) — an isolated spot passes only as part of an AREA. One pass, six rooms
(design round-2 note opportunity 5).

**Flare-probe gate** (the histogram/censor harness extension this lane promised): the `flare-probe` dev scene
(`src/dev/scenes/flare-probe.ts`) puts a 4.4 mm white disc (the duck-specular / goal-pin / lamp-flare /
sprinkler-dot class, ≈13 px at the hero rig) beside a 100 mm area control through the real post stack;
`tests/e2e/bloom-flare.spec.ts` measures the radial spread from pixels (bar = deck median + 15).

| probe metric | gate OFF (2026-10-09 law) | gate ON (default tier) |
|---|---:|---:|
| small-disc spread beyond its edge | **5.5 px** | **0.0 px** (gate ≤ 2 px) |
| small-disc annulus halo budget | **217 px** | **0 px** (gate ≤ 30 px) |
| area control (sun/blade class) keeps glow | 3183 px | 1916 px (must stay > 0) |

Per-shot capture diffs (stated, deliberately re-baselined): kitchen hero 1600×900 gate OFF→ON — **13.8 % of
pixels changed, mean Δ8.8 luma, max Δ73**; histogram mean 195.3→195.0, p5 115→114, p95 233→231, ≥243 stays
0.00 %. The pixelmatch-0.1 visual baselines and the ratified-exploration diffs stay GREEN without re-shoot
(hero 0.18 %, establishing 0.21 %, floor 0.44 % vs the 2 % finding bar) — the law change lives in halos, under
the color gate's tolerance, so **no colour gate needed re-baselining**: stated diffs above.

## 2. GARAGE — oil tone, mid-run dither, framing

* **Oil color (materials only)**: `STAIN.filmTone` mixed 28 % toward `#2A2418` read GREEN on cool concrete
  (g > r in the shader) — the garage hero's floor band measured **58.66 % moss-band pixels**. Tone is now warm
  graphite `#3E382C` (r > g > b): **3.82 %**, the residual being the lawn. Evidence
  `docs/explorations/round2/garage-hero-{before,after}-oil-tone.png`. `STAIN.spread/alpha` untouched; the
  comment at `filmTone` in `src/sets/garage/data.ts` carries the law.
* **Blade mid-run dither — CLOSED, and the mechanism named**: run-window frames of garage02 at 350/900 ms at
  1600×900 @ dpr2 hold **0 pixels ≥ 245 luma** (r8-era: 153 px, a 4 % bright band) — IDENTICALLY 0 with the
  bloom size gate force-disabled, so the surviving mechanism at HEAD was bloom-lit specular dots, not material
  dither (`shadowDither` already 0 in `MATERIAL_TUNES`). The size gate is what makes the ban hold MID-RUN
  (probe table above); no speckle detector (`tools/speckle.mjs`) finds an isolated ≥ 240 pixel in any run frame.
* **Framing (cameras only)**: `RUN_FRAMING.eyeUp = 0.028` via the new per-set `runFraming` registry field —
  garage02 mid-run 900 ms went from wall+track to carrying the buckets/cardboard/toolbox + lawn (`garage02-
  midrun900-{before,after}-framing.png`). Honest limit: the wheel/workbench stay BEHIND the run camera at the
  yaw-0 corner (composition law; the lift buys the visible half). Build-phase framing unchanged (yaw-0 law —
  the blade already crosses the build gaze; verified `garage02-build-before.png`).

## 3. BATHROOM — grout read + run framing

* **Grout contrast (materials only)**: `TILES.grout` `#9DBDBA` → `#B6C2B6`, `groutDiffuse` 0.5 → 0.62. Hero
  tile band: grout-line floor **p5 65 → 76** luma, band mean unchanged (135.5 → 136.0), spread 46.7 → 45.3 —
  softer porcelain read, not blacker lines. Evidence `bathroom-hero-{before,after}-grout.png`; blown census
  still 0.000 %.
* **Framing**: same `runFraming.eyeUp = 0.028`; bathroom03 mid-run went from wall-blank to SHOWING the tub,
  the duck and the tile grid (`bathroom03-midrun-{before,after}-framing.png`). Camera tests: 36 green
  (eyeUp default 0 = byte-identical; lift raises eye, steepens pitch, never touches azimuth).

## 4. STILLS — the rig in every scene, evidence stops lying

All six `*-set.ts` still scenes now `createCarRig(tokens).group` instead of the `car()` stand-in (the scale arg
dropped — the rig IS full-size; the stand-ins' 0.62 was the lie). The `toyBlock`/`dieCastPaint`-only imports
dropped with them. Kitchen canonical captures RE-TOOK (filmcar precedent, before/after pairs in
`docs/explorations/round2/kitchen-*-car-rig.png`): drift vs the ratified explorations from the swap alone —
establishing **1.62 %**, hero **7.65 %**, floor **13.18 %** — deliberately over the 2 % finding bar (a ratified
LOOK change, not a platform drift: the stills now star the driven sedan, the AD-pitched opportunity).
`tests/visual/darwin/*` + the ratified PNGs re-baselined to the final build: 0.0000 % on all four assertions;
visual + flare suites green.

## 5. SPRINKLER — DECISION: readable arcs (exploration); production already "out"

Measured: the garden HERO and garden03 MID-RUN carry no dots — the shipped garden set mounts NO spray geometry
(the sprinkler is a data grip-zone + the `prop:sprinkler` callout; `HAZARDS` ships empty by the track-ask law,
`src/sets/garden/data.ts`). The candy dots lived only in the stage-1 exploration `src/dev/scenes/garden.ts`
five frozen droplet spheres. DECISION: **arcs** — the exploration's droplets are now two continuous ballistic
`TubeGeometry` ribbons (`sprinkler-spray-arc`, one parabola per side); one dev scene, materials/geometry, no
sim. Logged in the Decision Log (rejected: keep the dots; add production spray geometry — the data-zone answer
already reads clean on measured frames).

## CLOSURE

* Suites at close: `npm run test` (887 unit), full `playwright test`, `replay:all` **30 rungs byte-identical**
  (twice — mid-session and at close), `npm run build` clean; visual suite 0.0000 % against re-baselined PNGs.
* Colour gates: the bloom gate needed NO re-baseline (histogram mean moved ≤ 0.3, ≥243 unchanged at 0.00 %);
  the STILLS baselines were deliberately re-taken — per-shot diffs stated in §4 — which is the only re-baseline
  this lane performed.
* Evidence folder: `docs/explorations/round2/` (before/after pairs per finding + the flare probe gate-off/on).
