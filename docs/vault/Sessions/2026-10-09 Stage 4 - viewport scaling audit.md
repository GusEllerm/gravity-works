---
livedocs: snapshot
---

# 2026-10-09 Stage 4 - viewport scaling audit (Feel Engineer)

Worktree `gw-feel12`, branch `stage4-viewport`. Round-5's 2/2 ghost-offset (V: "~40 px up and
left"; W: "~2 m away", click-on-ghost places nothing) — **reproduced, root-caused, and gated**.

## The actual transform sin

Not a scale bug, not a cached rect: every pointer event already re-reads
`getBoundingClientRect()` correctly (client-vs-local clean, no dpr math, viewport-relative
scroll-safe). The sin is that **the canvas MOVES under a still cursor**. `#gw-builder-host`
sits ABOVE the canvas, and its toggleable rows — `#gw-tray-hint` (hidden after first place),
`#gw-ring-hint`, the (un)styled `#gw-ghost-state` / `#gw-target-label` lines — appear, hide,
and wrap MID-SESSION and teleport the canvas. Measured on kitchen01, one session, cursor still:

    fresh load          rect.y = 270
    holding a piece     rect.y = 311   (+41: hint rows inserted)
    after first place   rect.y = 243   (−68: hint rows removed)

The director's forensic (160,**311**,960,540) IS the holding-a-piece state. Between mouse
events nothing re-derived the aim, so the ghost kept projecting from where the canvas USED to
be — a constant offset that scales with the shift: V's 40 px, W's ~2 m at wide framing. Clicks
then re-aimed through the LIVE rect onto a different socket than the ghost shown (or nowhere,
where `aimAt` keeps the last target) — "clicking the ghost places nothing, Enter works".

## Fixes

1. **Single-source transform** — new `src/ui/aim-transform.ts` `worldToClientPx()` (live rect,
   live camera, CSS px, dpr never enters) now backs BOTH `socketCandidates` and
   `ringWithinReach` in `src/ui/builder.ts` (they carried duplicated inline math).
2. **Aim never goes stale** — `builder.revalidateAim()` runs from `boot.ts`'s frame loop: one
   rect comparison per frame (four-number identity; idle pages pay one
   `getBoundingClientRect`), and on a moved rect re-derives the target for the STILL cursor —
   with a fast path that never churns a `]`-walked tie selection. Parity with a fresh live
   hover is asserted by an e2e (revalidation ≡ hover).
3. **Layout steadied** — `src/ui/shell.css` reserves the toggleable rows (integer
   `min-height`/`line-height`; `visibility` instead of `display:none` for the `hidden` hints;
   the stage-3 `#gw-tray-hint[hidden]{display:none}` collapsed-row rule removed). Canvas
   rect.y is now CONSTANT (316) across load/hold/place/delete. Integer px matters: a
   fractional `1.3em` reserve shifted the canvas sub-pixel and broke the visual baseline clip
   (960x541) — that is also why the rect was fractional in the first place.
4. **Graphics hiccup** (W's black tab) — `webglcontextlost` → `preventDefault` + frame loop
   PAUSES + `#gw-hiccup` overlay "graphics hiccup — click to restore"; restore (or the click
   via `renderer.forceContextRestore()`) hides it and the page paints and plays. Seam
   `__gwForceContextLoss` drives the e2e.
5. **Stuck-press guard** — in `attachBuildView`'s release: an UNTRACKED mouse release over the
   canvas (down fell outside the window / dropped) is fresh place intent through the same
   verb, deduped against the `click` fallback. e2e drives it via CDP negative-coordinate
   mousePressed + in-window release.

## Per-viewport proof (new `tests/e2e/viewport-aim.spec.ts`, real mouse sweeps)

| viewport | sweep: aim == own projection | ghost under cursor | click-the-ghost places | placed socket == ghost target |
|---|---|---|---|---|
| 1280x720 dpr1 | 2/2 sockets, 0.0 px | < 3 px | yes (x3) | yes (socket consumed from open list) |
| 1600x900 dpr2 | 2/2, 0.0 px | < 3 px | yes | yes |
| 1100x1400 dpr1.5 (tall) | 2/2, 0.0 px | < 3 px | yes | yes |
| 1280x720 + scrolled 130 px | winner-parity | — | yes (counter increments) | yes |

Plus: rect-never-teleports per viewport; revalidation-parity; context-loss round trip
(overlay → click → painted + playable); stuck-press places. Full suite: **110/110 e2e,
577/577 unit**, visual baselines unchanged.

## Known residual (noted, not changed)

When scrolled far, the sticky toolbar host OVERLAPS the canvas top band; pointer events there
land on the toolbar (by stage-3 design — "Remove is never out of reach"). Aim simply does not
fire under that band; it never places wrong, and the revalidation keeps the ghost honest
wherever events DO arrive.
