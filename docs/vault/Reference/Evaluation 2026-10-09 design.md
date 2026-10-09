---
tags: [reference, evaluation]
livedocs: snapshot
---
# Evaluation 2026-10-09 — design + art (external evaluator)

> [!abstract] Method
> Read the four bibles (Art Bible, Feel, Levels, Track Kit) plus the AD review notes; rendered the hero rig
> and three further canonical angles of all six production sets through the harness (dev build, 1600×900,
> DPR 1, post ON, my own tmp; PNGs deliberately not committed); captured six in-game mid-run frames
> (par builds via the real shell + run camera: kitchen04, bedroom03, bathroom03, garden03, garage02/04,
> porch05) plus build-phase frames of kitchen04 and kitchen-sandbox; drove kitchen01 mouse-only as a
> stranger; audited the kit's campaign usage from the level files and the full voice map from the sound
> sources. Nothing in the repo was modified by this pass.

## 1. Stills vs exploration — what decayed in the port

The exploration tiles were judged 13–16/16. The production renders are systematically **softer, blown and
speckled** where the tiles were crisp, stepped and graded. The recurring lost pixels:

- **Dither speckle at every shadow-to-lit boundary.** The Art Bible rejected painterly softness 0.3
  precisely for "dither speckle at grazing angles" — it has returned through the shadow/occlusion path:
  kitchen floor (the whole right-half shadow field is pointillist), garage side (the sunblade is a NOISE
  BAND of white speckle, the wheel tyre grains, the foreground zebra-stripes; this is the same frame the
  AD failed at 10/16 and it still ships this way), garden floor (comb-f fringe on every slab seam and an
  orange rust-fringe along the track deck edges), bedroom (brown grit in the plank seams).
- **Blown highs the tiles did not have**: kitchen mug and bowl milk, bedroom lamp post (a neon-white pole
  that reads lens-flare — the never list bans flare), garage blade band, porch window frame.
- **The signature affordance moved out of the money shot** in two rooms: garden hero no longer frames the
  bore mouth (a grey blur-box at the right edge; the exploration's dark pipe mouth WAS the 13/13 shot);
  garage run-time never shows the blade or the wheel at all.
- **A billboard regression**: the kitchen's cereal box entered the production frame as a flat saturated
  yellow slab with a hard teal band that fights the book-spine teal — line 4 material, absent from the
  judged tile.
- **Wet films read as dirt**: the garden sprinkler sprawl and the kitchen puddle render as brown speckled
  oval colonies (mud/mould), not liquid — the bathroom's film treatment (round-2 fix 5) did not port.
- **Cars parked off-track** (kitchen hero/floor: the focus-band car sits on bare counter with no deck under
  it) — harmless in a still, wrong in a game whose whole language is "cars are on the orange".
- What DID survive: the kitchen tap-shadow and drip, the garden trellis bars + watering-can shadow, the
  porch weave-shadow parallelogram (both cameras), the garage wheel as goal line. The ratifications were
  real; the decay is grade-and-post, not set geometry.

Also honest about my own method: the wiring seam (scene + level param) mounts the set where the LEVEL
mounts it, which puts the kitchen set out of frame at the canonical rigs — there is no committed still
ANYWHERE that shows a level's built line inside its room. And the bathroom has no production still scene
and no rig row at all (it rides the provisional kitchen fallback) — the 14/15 porcelain cathedral exists
only on the two exploration tiles; in the game it is a mint void with a tile island.

## 2. Art scores (production render as shipped, stills AND in-game frames, /10)

| set | score | named evidence |
|---|---:|---|
| kitchen | **7.0** | hero/floor stills carry the tile-B grammar (tap shadow, bowl, mug ring), but: dither field in the floor shadow, blown mug/milk, teal-band billboard box, off-track parked car; build-phase gameplay drops to the coaster-void (§5). |
| bedroom | **6.5** | the ratified hard three-step lamp drama (hero-b: crisp ramp bands, indigo shadows) is milked — defocus haze over the frame, clipped lamp post, gritty plank seams, the voxel-book fringe the ratification already flagged; the one lamp-lit room plays flatter than its own tile. |
| bathroom | **6.0** | no production still, no canonical rig row, never rendered as a set since judging; in-run the tub/tiles vanish (mint-green infinity, a duck blob, a blown-white cup). The room with the best exploration (14/15) is the room with no evidence trail. |
| garden | **6.5** | establishing keeps the trellis rhythm and sun disc; hero loses the bore mouth to a blur-box right edge; sprawl film reads as dirt; sky band is a literal gradient (never-list); run-time is flat lime lawn with a channel. |
| garage | **5.5** | hero is acceptable (wheel, blade, bench), but the side rig still renders the AD-failed speckle frame (blade as noise band, sparkle as mould dots, spoke dither fringe); in-run neither the blade nor the sparkle appears at all — the room's two signatures are stills-only. |
| porch | **7.0** | the weave parallelogram survives both cameras (the judging's must-not-lose #1 holds), threshold reads spatially, amber discipline intact — the freshest port in the house; loses points on the flat hazy slate field and the blown window trim. |

Mean 6.4. The pattern is not "bad sets" — it is that the REVIEW stills and the PLAYED frame are drifting
into different games (§5), and the post/grade stack is eating exactly the hard-edged toon confidence the
explorations were ratified for.

## 3. Kit design space (attack 2)

Thirteen kinds. Across the 26-rung campaign the player can ever PLACE six kinds
(straight, gapLip, drop, landing, ramp-adjacent, booster in five rungs). The other seven are fixtures or
ghosts: `curve` only ever pre-placed run-out, `bank` is only the bowl fixture, and **`loop`,
`springLauncher`, `bigCurve`, `sbend` are never placed by ANY authored line in ANY level** — the sandbox
(EVERY_PIECE ×99) is their only existence, behind a defocused coaster-room. The Marble It Up! reference
is a game ABOUT loops and banked spirals; this campaign never drives one. Every rail ride (bowl rim,
drain, bore, wheel tunnel, door) is STAGING behind asks #1/#4/#7a/#8b — the rail exists as camera
`railPoints` and a promise. Combos the campaign never shows: spring-launch chains, the booster mid-run
(it is a first-or-late binary, never a flow verb), banked-speed lines, any elevation profile (Track Kit
backlog), every curve family. The pieces are authored as splines with a real derivation pipeline
(mesh=collider=rail) and five of them have no level because the DESIGN space collapsed onto one gap verb.

## 4. Motion + sound honesty (attacks 3–4)

**The car you drive is a red box.** The shipped in-game car is the World fallback: a plain Lambert
BoxGeometry — no wheels, no stripe, no bevels, no die-cast ramp, no squash (JuiceFeed emits squash/dust
events with a loudness mapping and NOTHING imports it), no wheel rotation read, no tilt-shift FOCUS PULL
personality beyond the blur itself. The car-a rig the AD ratified exists only in the dev scenes. Every
mid-run frame this pass wore the box. The stills' car is a toy; the playable car is a placeholder.

**From the voice map + play:** launch (noise tick + 520 blip) and snap (sine knock + chip) are honest and
good; roll is speed-mapped low-pass noise — honest but one timbre for every surface (tile/porcelain/oil
all hiss the same); cup's 95 Hz thud + bell is the game's best sound. Where audio cheapens the visual:
(a) **landing is SILENT** — the whole ladder's grammar is a hard catch and there is no land voice at all
(cup fires only as an outcome; the squash that should own it is unconsumed juice); (b) **mid-run hazard
contact is silent** — the hazard voice fires only at the result edge, so rolling through the splash/oil
patch mutes exactly as the visual goes wet (the world even EXPOSES the squeal number per step; the
firewall only lets speed+pose cross, so it never reaches a voice); (c) the **booster impulse is silent**
— louder than launch in pixels, zero in dB; (d) the **tap-drip affordance tell** (Feel's list, the
rung's lesson) has no drip voice — ticks and birds are the only beds; (e) porch/garage/bedroom/bathroom
run under room-tone only — the Sunday-morning room has no creak, no yard. Ring ping never fires — the
campaign contains no loop.

## 5. Level design craft + the played frame (attack 5)

**The flat ladder, confirmed.** Kitchen01, bathroom01, garden01, garage01 are the SAME flight (lip→drop→
landing, par 2.25/1.10) re-skinned; the 01-03-04 slot is the same three beats in every room (intro flight
→ choice → trade-off → order-invariant capstone, pars 2.25→2.35→2.70→2.70 EVERYWHERE), and the four
encores are two byte-identical rails (bedroom05≡bathroom05 hashes; garden05≡garage05) wearing different
props. The fail-timing law, the promise law (every omission FALLS, with death clocks) and the tray⊇par
honesty are genuinely the best level-design thinking I have audited this year — the CURVE, though, is a
staircase painted six times. Room "difficulty" is vocabulary rotation, not new verbs; the sandbox is
under-authored (one seating geometry per kind, the same par rail as its room's rung 01-ish, framed by the
weakest camera in the game); springLauncher waits for nothing except a rung nobody wrote.

**The tutorial's current truth**: DD's 18 min / ~14 launches was the Place-button lie, and that fix
SHIPPED (the button names its socket). Post-fix strangers clear kitchen01 in one build (X round 6 — one
build; BB — one build, 3★ at 2.13 s). I could not reproduce the 18 min — what I CAN report is the new
tutorial wall: the build-phase view of kitchen01 is a tiny yellow disc on a grey void under max defocus
(the focus point rides the 0.22 m release pose, and the strength ramp saturates by 0.30 m), the ring is a
few pixels on a plank in the sky, and a 40-sample mouse sweep never enabled Place — consistent with X's
"ring below the viewport" and X's unreproducible Esc-Esc black-screen crash, which is still open. The
tutorial's TIME is fixed; its READABILITY is not.

**Played-frame law break**: the Art Bible's camera line says "a camera that FRAMES over one that
follows". In play the run camera is 60 % orange channel with a grey void beyond the set disc — the
monumental room becomes a doll's-eye highway. The stills frame; the game follows.

## 6. Design verdict: **6.5 / 10**

The simulation-of-truth culture (bit-identical wet sweeps, death-clock sweeps, tray parity) makes the
levels the most honest marble-puzzle rooms I have measured. But the campaign is one verb in six costumes,
the played presentation is a different (weaker) game than the judged one, five kit verbs are dead weight,
and the retention loop stops at "share link". A Marble It Up! competitor would beat this on content
variety; a Monument Valley on presentation. Craft A-, direction execution D.

## 7. Top-8 opportunities, ranked by player-value per engineering-risk

1. **Ship the ratified car in-game** — wire the car-a rig (wheels, stripe, bevels, die-cast material) + the ALREADY-WRITTEN JuiceFeed (squash/dust/loudness) into the shell. ~Days; the single largest moment-to-moment win in the house; both halves exist, nobody plugged them together.
2. **Defocus budget for play cameras** — the tilt-shift strength saturates at 0.30 m; cap floor→top strength (or use the low/medium tap tier) for the build + run cameras. Hours-to-a-day; the room must read while you play it.
3. **Kill the dither speckle at shadow boundaries** — one materials/shadows pass (ramp softness or shadow bias); it touches every set's line-8 score at once. Low-medium risk, systemic.
4. **A landing thud + surface-honest roll** — add a land voice fired from the already-exposed airborne→grounded edge (screen-visible: the pose crosses, which the firewall already permits for the ring ping), and EQ the roll by the deck grip the world already publishes per wheel. A day or two; it closes the biggest audio lie in the map.
5. **One loop rung + one spring rung per ladder** (level data only — the pieces, socket math and par-regen seam all exist) — or at minimum one showcase rung per room whose tray is loop/spring/bigCurve/sbend. Days of LD time; this is the genre's actual content.
6. **Race the ghost / daily challenge** (the retention 10×, §8): deterministic (level, build, seed) + hash-verified replay + procedural cinematic rigs ALREADY EXIST — replay a friend's payload as a second ghost car in your world, and rotate one shared seed per day. Medium risk, built ENTIRELY from shipped parts.
7. **Bathroom pipeline parity** — a `bathroom-set` still scene + a SET_SHOTS rig row (the other five rooms have them); re-land the 14/15 cathedral as evidence, then port its film treatment to garden/kitchen puddles.
8. **Set-boundary void + build-camera framing** — extend/mask the world beyond the set disc (warm table, edge dressing) and frame the build camera on the set, not the bbox; the tutorial's first sight is the game's poster.

## 8. The retention argument (attack 6, argued from the codebase)

**Ghost-racing on the replay rig.** The engine already guarantees a run is (level, build, seed) → a hash;
`replay` recomputes and compares; `cinematic.ts` already picks crane/rail/lock-off shots from track
geometry; share payloads already ship the build. What no one has spent: mount a SECOND car from a foreign
payload's replay stream in your world and race it — the par build as the tutorial's ghost on every rung
(the k3 discoverability wall becomes "watch the line, then beat it"), and a daily one-seed challenge with
hash-stamped ghosts. Determinism here is not a trivia badge (verified cross-platform 37/37); it is a
social primitive, and it is the only mechanic that multiplies the EXISTING content instead of asking for
six more rooms.

## 9. Honest gaps in this pass

Six stills per set, one play session, mouse-sweep only (touch/a11y paths not exercised); no listening
measurement (voice claims are from the synthesis code + fire-point map, not a dB bench); garage-floor,
bedroom-floor/establishing and porch-floor/establishing frames were rendered but viewed only in
thumbnails; the Esc-Esc crash I did not attempt to reproduce.
