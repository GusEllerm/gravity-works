---
tags: [session]
livedocs: snapshot
---
# 2026-10-08 — Stage 4: kitchen02 discoverability

Level Designer pass, SALVAGED and finished by the Director after an engine
fault killed the agent mid-diagnosis.

**Reproduction (headless, on the shipped builder's mount):** every chain
H's and K's reports describe was replayed. Their deaths split into three
families, all from one cause — a 5-piece tray serving two 3–4-piece lines
means plausible orders split three ways and **nothing on screen says which
rail a chain rides**: (a) lines that finish, ~2.2–2.6 s; (b) lines that
land PAST the cup and fall off the far end, ~3.0–3.1 s — K's three deaths
("the gap outran the landing" is what a too-long line gets); (c)
lip-launched lines that fly the hole and fall IN it, ~2.4 s — H's deaths.
So the physics is honest; the FINDING is the wall.

**Redesign:** the rung keeps its lesson (one gap, two buildable lines, the
lazy fast line wins) but the discovery path is the rule the bedroom rungs
later authored under — the tray states the route the fixtures make visible
(one `drop` sits the crossing; the callout line was rewritten to point AT
it: "the line crosses where the drop is"), so a wrong order fails visibly
EARLY on the near rail instead of costing a full 3 s run off the far end.
`setPlacement` row and the kitchen-levels/set-wiring tests re-derive from
the moved geometry (the mount table dragged with it, as designed). Pars
regenerated (`npm run pars`), every par finishes headless, `pars --check`
green.

Salvage gate at commit: 447 unit, pars --check, typecheck clean. Two
scratch probes (`.l02_*.mjs`) deleted — the two-harness disagreement they
chased was the un-anchored probe build vs the builder's anchored mount,
already the known G-L04 class (fixed in the test, not the level).
