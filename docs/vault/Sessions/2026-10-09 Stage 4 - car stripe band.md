---
livedocs: snapshot
---
# 2026-10-09 — Stage 4: car stripe band ( Technical Artist )

Fixes the blown roof stripe the fixture-signal forensics surfaced
(`Reference/Review 2026-10-09 fixture signal.md` addendum): the parked runner's
roof stripe measured sRGB 255/255/210 (L* 98.6) under the kitchen key — 1,319
of the K3 hero frame's 1,367 blown pixels were the stripe. The material is
re-measured from the tile-B stills: same cream hue one step deeper,
`STRIPE_CREAM #E8D5B0` (was tile-B putty `#F6E9D2`) with the direct-diffuse
gain discipline from the garage round-2 precedent — the stripe stays the
brightest thing ON the car without clipping the frame. The AD note's stripe
item is now ready for its call; the rim pair still wants a bowl-framed still.

Reconstructed + committed by the Director from the agent's dangling working
tree after a wire fault ended its run pre-commit (probes under its session,
before/after renders at both hero cameras, tests green); the dev harness gained
a documented `__h` scene seam the ablation scripts used — dev-only, renders
byte-identical.
