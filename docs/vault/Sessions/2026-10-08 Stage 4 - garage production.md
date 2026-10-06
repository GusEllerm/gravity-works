---
tags: [session]
livedocs: snapshot
---
# 2026-10-08 — Stage 4: garage production set

Environment Artist (salvaged by the Director after an engine fault mid-pass).

The ratified variant C ports cleanly through the bathroom pattern: dev-scene geometry verbatim in `src/sets/garage/data.ts`, tokens at registry level, indoor rig (no outdoor options touched). The AD's must-not-lose list survives measurement — `tools/census.mjs` on the three production frames gives 6.72/2.78/6.19 % tinted darks with ~0 blackish, the house's darkest earned shadows intact; carry-forwards (bulb in hero frame, ribbon blade, soft stain film, mezzanine) are all in the set data. One e2e smoke (`garage-set.spec.ts`) renders the set error-free; other sets' baselines untouched. Friction: none new — the registry row + dev scene entry pattern now costs one screen of code per room, which is the point.
