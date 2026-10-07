---
tags: [reference, review]
livedocs: snapshot
---
# Review 2026-10-09 — fixture deck-inlay signal, AD re-check (Art Director)

> [!abstract] Scope and method
> Targeted re-check of the two frames the readability-signal session flagged (session log
> 2026-10-09 Stage 4 - fixture readability signal, "Frames the AD must re-check"): the kitchen01
> hero shell still and the K3 bowl level wiring still. NOT a full re-judge — scored on palette
> coherence and affordance legibility only, pass/fail. Budget: one census run plus three views.
> Captures: fresh `vite preview` builds of the current HEAD — the game shell at /?level=kitchen01&post=on
> (960x540, same convention as `tests/e2e/visual.spec.ts`) and the harness wiring stills at
> ?harness=1&scene=kitchen-set&level=kitchen03&post=on (hero + default cameras).
> Frames beside this note under tmp/ad-fixture-signal/ — kitchen01-idle-signal.png, kitchen03-bowl-hero.png,
> kitchen03-bowl-default.png. Census: `tmp/fixture-signal/signal-census.mjs` between the committed
> pre-signal baseline and the fresh kitchen01 capture — changed 955, lifted-orange 357, mean Δb 16.7:
> the inlay footprint is present at the shell resolution and moves deck→inlay (g/b UP), no re-hue.

## Scores (rubric items in scope only)

- **Palette coherence: PASS.** The kitchen01 ramp/cup decks read as the same orange material with a
  lit centre lane — the census direction (blue up at ~unchanged red) matches FIXTURE_SIGNAL's
  lightness-only lift, and nothing in either frame introduces a hue outside the ratified family.
- **Affordance legibility: FAIL — bowl rim only.** kitchen01 PASSES: the stripe reads as part of
  the road. The K3 bowl-rim pair does not: in both cameras the fixture-inlay renders as a white-hot
  emissive pill floating in the rim gap — it reads as a separate object (a light strip / socket
  glint), not as the deck's own lane line, i.e. the exact scenery-vs-fixture confusion the signal
  exists to kill. The rim's banked/curved geometry presents the +0.8 mm ribbon near edge-on to the
  key light; the DoubleSide + polygonOffset treatment then blows the core out to white at that
  angle (the log's own K2-chute warning, one step further).

## Verdict

- kitchen01: the 215 px baseline delta is a legitimate fixture re-skin — **ratified, no re-shoot**;
  the suite stays green inside the 0.1 % AA gate as measured.
- Bowl rim (banked fixtures generally): **rework requested** before the rim pair is ratified —
  tame the inlay's lighting response on banked decks (e.g. FrontSide-only or a flatter-shaded
  material for fixture-inlay), keeping the lightness-only lift. Re-check with two bowl-camera
  views after the fix.
