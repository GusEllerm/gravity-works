---
tags: [concept]
---
# Studio

> [!abstract] Role
> The studio charter: what the game is, who works on it, and the protocols that bind the work. Derived from `PROMPT.md`, which stays the source brief.

## In one line

**Gravity Works** is a browser game about building toy-car tracks (1:64 scale inside a real house) that physics has to approve of — build, launch, watch, adjust. Static hosting only; everything procedural; determinism verified by state hash.

## Hard constraints

1. Static hosting on GitHub Pages — no backend, no accounts; persistence is localStorage with a versioned save and migrations.
2. Determinism: same level + build + seed → same run; verified by a state hash of body transforms sampled at fixed intervals. If cross-platform determinism fails, same-machine verification remains and the UI says so honestly.
3. Everything procedural: meshes from code or small in-repo parameter files, sounds synthesised, fonts from Google Fonts only. No third-party likeness or branding.
4. 60 fps on an integrated laptop GPU is a gate, measured per stage, in CI where possible.
5. Taste is written down before it is coded (the bibles); renders are the unit of visual review.
6. Stack: TypeScript strict, Vite, Three.js, Rapier, Vitest, Playwright. Any new runtime dependency over 50 kB gzipped needs a Decision Log entry.

## Roles

| Role | Accountable for | Never does |
|---|---|---|
| Director | scope, staffing, stage plan, integration, the vault | production art, physics tuning |
| Art Director (fresh per review) | art bible, style tiles, render reviews with the rubric; can send visual work back, twice | writes production code |
| Environment Artists (one per set; two compete on the hero set) | a set's pitch, tiles, props, lighting, signature affordance and hazard | other sets, the material system, the camera |
| Technical Artist | material system, lighting rig, post stack, shared mesh generators, frame budget | set dressing |
| Feel Engineer | physics config, car tuning, launcher, camera, juice, the feel track; can reject a piece whose physics misbehaves | art decisions |
| Systems Engineer | track kit and sockets, builder UI, World, save/share/replay, determinism harness; owns core architecture | tuning numbers, art |
| Level Designer | levels, budgets, pars, difficulty curve, tutorial; can request a piece/prop with a one-paragraph case | builds pieces or props |
| Sound Designer (late) | synthesised audio, mix, mute | — |
| Playtesters (fresh, several per stage) | play from scratch with no instructions; their confusion is a bug | fix anything |
| QA Engineer | visual regression, determinism tests, performance gates, a11y audit; can block a stage tag | design |
| Documentarian | the vault; reconciles notes at every stage close and after every review; can block a stage tag when notes and code disagree | writes code |
| Reviewer (fresh per stage) | correctness review of the stage diff against its brief; can block a stage tag | — |

## Protocols

- **Exploration before commitment**: every set, major visual system, and the car start as three (or two) small variants rendered at canonical cameras; the Art Director picks one with the rubric; the winner is written into the bible, losers kept under `docs/explorations/`.
- **Render review**: before/after images at canonical cameras + two-sentence intent; rubric score (12/16, no zeros); two returns → reassign or rescopes.
- **Feel review**: a tuning change ships as a feel-track replay + metrics table before/after.
- **Playtest**: from first playable, every stage ends with ≥3 fresh playtesters on the deployed build; confusion shared by 2 of 3 becomes a bug.
- **Stage close**: Reviewer + QA pass; Documentarian reconciles (`livedocs affected` → `livedocs coverage` → `livedocs verify` clean); `Home.md` current; commit, tag `stage-N`, push, Pages deploy confirmed.

## Stages

0. Bootstrap and charter — CI, vault, bibles from the brief.
1. Explorations — kitchen style tiles ×3, car ×3, physics models ×2, toon ramps ×3; references chosen.
2. The spine — track kit + sockets, builder, World, fixed-step physics, run camera, feel track, determinism harness, save/share.
3. Kitchen vertical slice — materials, light, post, set + props, 5 levels, result screen, help drawer, share card.
4. Four sets in parallel — bathroom, bedroom, garden, garage (+ levels, hazards).
5. Porch, cinematic replay, sound.
6. Polish and ship — a11y, responsive, perf, copy, README, final playtest, `Sessions/Final Report.md`.

## Quality bar

Nothing on screen disagrees with the physics (visual track and collider come from one spline). Every render passes the rubric; every tuning change has a feel-track replay; every animation has a purpose and a reduced-motion equivalent. No dead code, no TODOs on `main`; deferred work lives in `Home.md`. Player-facing text is short, concrete, and never explains what a picture already shows.
