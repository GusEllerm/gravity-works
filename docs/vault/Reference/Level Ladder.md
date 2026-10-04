---
tags: [reference, levels]
---
# Level Ladder

> [!abstract] Role
> The ladder of levels the game ships with — the registry in
> `src/world/levels/` (`LEVELS`, `getLevel`), one file per level, each a
> plain-data `Level` plus a kit-piece `Build`. This note tracks which rungs
> exist, what each teaches, its budget, and its pars. Level design itself:
> [[Concepts/Levels]].

## The kitchen ladder (stage 3)

| id | file | teaches | tray (budget) | par pieces | par time | status |
|---|---|---|---|---|---|---|
| `feeltrack` | `feeltrack.level.ts` | (test track, not a rung) | — (16) | 9 | 5.0 | the accept-line level, unchanged |
| `kitchen01` | `kitchen01.level.ts` | the tutorial: three pieces, one gap, launch | 3 (`gapLip`, `drop`, `landing`) | 3 | 2.21 | done — par build finishes headless; "one way" is authoring intent, the gap pieces punish nothing (ask #3) |
| `kitchen02` | `kitchen02.level.ts` | a CHOICE: two lines across one gap; the lazy one is faster | 5 (`straight`×2, `gapLip`, `drop`, `landing`) | 3 | 2.27 | done, **with the curve rung BLOCKED** (ask #1) — the curve is fixture run-out past the cup; both lines finish |
| `kitchen03` | `kitchen03.level.ts` | the bowl on the set; gap verbs at speed | 5 (`straight`×2, `gapLip`, `drop`, `landing`) | 5 | 2.50 | done, **with the bowl line BLOCKED** (ask #1) — rim built + socketed (`bowl.in`/`bowl.out`), timed line runs past it |
| `kitchen04` | `kitchen04.level.ts` | the tap hazard: affordance before hazard, wet patch halves grip | 5 (`gapLip`, `drop`, `landing`, `straight`×2) | 4 | 2.45 | done, **hazard live** (ask #2a delivered, [[Modules/hazards]]) — par replays bit-identical with the zone (flies the patch, grip-independent to the bit); ground line drives THROUGH it (hash diverges, finishes 0.06 s faster — low-drag plastic) |
| `kitchen05` | `kitchen05.level.ts` | everything + one forced trade-off (one landing, one booster, two gaps) | 6 (`gapLip`×2, `drop`×2, `landing`, `booster`) | 6 | 2.39 | done — both wrong allocations measured to NOT finish; par beatable, not obvious |
| `kitchen-sandbox` | `kitchen05.level.ts` | the set unlocked (`sandbox: true`, no budget) | none (all pieces ×99) | 5 | 2.53 | done — reference build finishes |

Five other sets: five rungs each at their own stage (stage 4+); the ladder is
otherwise empty.

## Pars

**`pars` values above are measured par-build replay times, hand-written into
the level files. `npm run pars` does not exist yet** — the Systems Engineer's
pars-regeneration script has not merged as of this writing, so this table's
`par time` column carries the designer's measurements (2026-10-06, raycast
car, shipped `ROLL_COEF`, headless `World` via `src/replay/replay.ts`) rather
than script output. Regenerate every cell (and each `Level.par.time`) the day
the script lands; until then, do not trust these to survive a physics retune.
`par pieces` = pieces of the tray the reference build places (≤ tray total).

## What is blocked, honestly

- **Rung "mid-run yaw geometry" — BLOCKED** (affects L02's curve, L03's bowl
  line): no yaw piece (`curve`/`bigCurve`/`sbend`/`bank`) is drivable by
  either shipped car at any swept radius/speed/bank — the car ploughs off or
  dies on the yaw seam. The piece case is one paragraph in
  [[Concepts/Levels]] (ask #1) for the Feel Engineer. The LEVELS are not
  blocked — all five par builds finish (`tests/unit/kitchen-levels.test.ts`)
  — but L02 and L03 do not yet deliver their yaw half.
- **Hazard mechanic (wet patch) — pending** (ask #2a): `World` reads no grip
  zones; L04's par line is designed grip-independent so it is provable today.
- **`Level.finishSocket` — pending** (ask #2b): the cup currently rides at
  the end of whatever build replays, so routing cannot fail in replay; in
  the real builder it must. This is also why L01's wrong-order experiments
  all finish.

## Notes

- The `Level` shape is the contract: `{ id, name, seed, startSocket, budget,
  par, maxTime, placeholderBuild() }` ([[Concepts/Track Kit]]); kitchen
  levels extend it with `tray`/`parBuild`/`fixtures`/`hazards`/`propSockets`
  as `KitchenLevel` — see [[Concepts/Levels]] for why (per-kind budget has no
  home in the contract yet). `placeholderBuild()` returns the par build, so
  share/replay need no new seam.
- Every kitchen parBuild finishing is a TEST, not a claim:
  `tests/unit/kitchen-levels.test.ts` (plus L02/L04 second lines finishing
  and L05's wrong allocations NOT finishing).
- `getLevel` now resolves 7 ids once the kitchen modules are imported; the
  kitchen files self-register via `registerLevel` on import
  (`feeltrack.level.ts`'s registry). Wiring the game entry (`src/boot.ts`)
  to import them is a one-line systems task, deliberately not done here —
  `src/boot.ts` is not the level designer's file.
- Nothing on this rung-blocking blocks stage 3 integration; the blocked
  halves are additive data edits when ask #1 lands.
