---
livedocs: snapshot
---

# Stage 4 — banked-inlay verdict re-measure (K3 bowl rim) — environment artist

Targeted follow-up to [[Review 2026-10-09 fixture signal]] (AD re-check): the note's FAIL says the
`fixture-inlay` "renders as a white-hot emissive pill" on the K3 bowl-rim pair. Re-measured with
causal ablations on the exact AD URLs/cameras (fresh `vite preview` HEAD builds; frames + probes
beside this log under `tmp/env-inlay-bank/`). **The blow-out is real but it is not the inlay, and
the inlay needs no shading change — no code changed.**

## The pill is the parked runner car, not the ribbon

Causal tests on `?harness=1&scene=kitchen-set&level=kitchen03&shot=hero&post=on` (`cap.mjs`, `bisect.mjs`):

- Hide the `fixture-inlay` meshes → **0 changed pixels** in hero, floor AND (with the car)
  establishing; the pill is pixel-identical (`bowl2-hero-before` vs `-noinlay`).
- Hide the parked runner car the level branch adds at `startSocket` → the pill **vanishes**
  (cream pixels 1367 → 0, `bowl-hero-nocar.png`); hiding the whole track group leaves it untouched.
- Per-piece-group ablation (`perpiece.mjs`): in hero/establishing/floor only the RAMP fixture piece
  is visible at all — the `bank`/`curve` rim pair contributes **0 pixels to every canonical K3
  wiring view**, so the rim ribbon cannot be the pixels the AD judged. (The rim is not framed;
  the groove in the crop is the pitched ramp run, the capsule its parked runner: cream stripe
  #F6E9D2 at full key reads sRGB 255/255/210 ≈ L\* 98.6 — a blown high, and the set's brightest
  object. That is a car-material/staging exposure item, not a deck signal one.)

## The banked rim ribbon, measured where it IS visible (dev camera)

Free dev camera seated above the bowl (`rimband.mjs`, post off): census of the rim ribbon against
the deck beneath the SAME pixels — banked `bank`+`curve` inlay footprint 50051 px, **inlay L\* 35.3
median / 38.5 max vs deck-under L\* 29.7**; same-frame flat/`ramp` inlay: 35.3 median / 45.5 max,
deck-under 29.7. The banked ribbon sits in the same lightness band as the flat-deck ribbon and its
MAXIMUM is LOWER than the flat deck's (banked faces fall away from the key) — a quiet ribbon,
never crossing the bloom threshold (linear luma ≈ 0.1 vs 0.72). Reference flat-deck read, game
shell `/?level=kitchen01&post=on` vs the committed pre-signal baseline: deck-under L\* 92.2, inlay
L\* 94.1 median / 98.5 max (the AD-ratified 215-px re-skin region).

In hero-type views the ribbon is fully occluded by the channel's own rail lips at grazing angle
(`depthtest.mjs`: depthTest-off paints a 29210-px ramp band, full-scene render 0; polygonOffset
−20/−10 flips nothing — this is rail occlusion, the geometry truth the session log's "coverage is
view-dependent by nature" line already documents).

## Verification state

kitchen01 unchanged (zero code edits; shell delta stays the ratified 215 px = 0.0415 % inside the
AA gate), canonical renders byte-identical, unit 572 green, typecheck green, pars `--check` clean,
`playwright test visual` 7/7 green.

## Handoff (AD)

The rim pair cannot be ratified or re-judged from the current wiring stills — the rim pair is not
in any K3 canonical frame. Suggested next step is a scene-owner/dev-camera bowl framing (e.g. the
one `rimband.mjs` seats) plus a decision on the parked runner's blown stripe (car paint or pose),
after which the ribbon can be judged in-frame with the numbers above as the reference.
