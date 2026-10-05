# Stage 4 — bedroom set exploration (Environment Artist)

Throwaway dev scenes: bedroom-a / bedroom-b / bedroom-c in src/dev/scenes/bedroom.ts.
Renders: docs/explorations/bedroom/hero-a|b|c.png and close-a|b|c.png, 1280x720,
post stack ON (hero = canonical hero shot, close = canonical floor shot).
Kitchen conventions reused: shared material classes and toon ramp, the lighting rig
(one key, two-band fill, no ambient), 1:64 scale discipline (car ~47 mm long), flat
non-gradient backdrop, orange track constant from the global tokens, never re-hued.
Kitchen palette deliberately NOT reused — the bedroom's seed is indigo + amber
(nightlight), per the Art Bible time-of-day table.

Each variant: floor plane + one anchor (bed edge or desk leg), giant props as
terrain, one straight toy track threaded through.

## A — carpet pile, morning sunbeam

- Material story: carpet. Fabric class with the toy treatment and a low-frequency
  grain standing in for pile mottle, plus instanced tufts along the track edge for
  grazing light to comb through. Visual only — pile grip is a playtest question,
  not a shader parameter.
- Scale joke: the bed edge is a cliff and the overturned mug is a tunnel the track
  drives straight through; the charging cable lies across the straight as a speed
  bump the car pops; a pillow plateaus up-right. Lost toy block + dust bunny = the
  lived-in detail.
- Light: low amber key from a curtained window at frame right; long shadows raked
  across the pile; indigo pulled into the shade tint so dusk lives in the corners.
- What a track WANTS here: cable-bump humps on every straight (free launch juice),
  tunnel bores through mugs and slipped-under shoes, and carpet edges where the
  bed-cliff meets the floor as step-up ramps. No springs — the carpet variant's
  vertical play comes from prop bumps, not the floor.

## B — hardwood, lamp-lit dusk

- Material story: painted wood at floor frequency — long lazy grain, dark hairline
  board seams (data strips, not texture). Props stay wood/ceramic/die-cast so the
  floor is the only big grain surface, per the TA's frequency rule.
- Scale joke: the desk is two monumental legs whose desktop lives above the frame
  (furniture as weather — the lamp attached to it is the sun); the book pyramid is
  a ziggurat with one book leaning down to the deck as its offered ramp; the cable
  snake sits up and faces the track; homework abandoned under the lamp is the
  lived-in detail.
- Light: one low lamp key at frame right, warm pool, deep indigo beyond; the set's
  darkest histogram — shadows carry the palette.
- What a track WANTS here: drawer-front tunnels under the desk (a drawer pulled
  halfway is a portal at this scale), book-ramp launches from the pyramid tiers,
  and the board seams as rhythm strips the car ticks over. Desk-drawer tunnels are
  this variant's signature ask.

## C — duvet fabric as terrain

- Material story: the floor IS the bed. A displaced, stitch-seamed duvet —
  soft-body LOOK only (static displaced plane + seam tubes; no cloth sim). Fabric
  rim does the roundness; quilting flattens within a hand's width of the track so
  the track itself stays straight and driveable.
- Scale joke: driving across a made bed. A pillow plateau, one picture book slid
  off, the cable snaking along a fold, an overturned mug half-sunk in the soft
  ground; glasses left on the pillow are the lived-in detail; the nightlight at
  frame right is the honest single source.
- Light: pre-dawn nightlight — dim, warm, low; indigo floods everything it misses.
  Weakest key of the three by design; it passed the no-uniform-ambient line because
  the fill is the indigo band pair, not ambient mush.
- What a track WANTS here: bed-spring ramps — the springs under a duvet are real
  at 1:64, so every crest of the quilting is a launch opportunity, and the gaps
  between mattress and bedframe are trench sections. This variant is the one that
  should earn springs as a level mechanic.

## Honest demerits (for the AD's fresh eyes)

- A's floor shot is the emptiest: the bed flank reads big and flat and the car is
  small in the band; B's hero is the strongest frame of the six; C's mug reads as
  a marshmallow at hero distance — a tunnel needs a visible dark bore, which the
  toon ramp gives only when the mouth faces the key.
- All three could stand one more lived-in detail inside the floor camera's focus
  band (the stage-3 carry-forward; only B half-complies via its pencil shadow).
