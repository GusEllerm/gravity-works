---
tags: [session]
livedocs: snapshot
---
# 2026-10-08 — Stage 4: camera / latency / note matrix, round 2 (J+K ledger)

Feel Engineer pass, SALVAGED and finished by the Director after an engine
fault killed the agent mid-tune; tests below are the salvage gate.

- **Camera end-bury**: `lift` state in `src/camera/run-camera.ts`
  (`requiredLift` / `FINISH_LIFT` / `LAUNCH_PEEP`, see `Modules/camera`);
  the filmstrip gate now samples the FINAL second at 100 ms on L01+L04 —
  the missing assertion from stage 3's mid-run fix.
- **Verdict latency**: `SLOW_AIR_SPEED`/`SLOW_AIR_SECONDS` window in
  `src/world/world.ts` for the WEDGED case (not grounded, ~0 speed — the
  grounded stall counter can't see it); outcome-only, both feel-track
  hashes verified byte-identical to main (`cee96961`/`90d4cd69`).
- **Note matrix**: the "long jump" line requires the RISE witness
  (`finalTakeoffVy > JUMP_MIN_TAKEOFF_VY`) — playtest K's
  "never crossed the gap" run now gets "the line let go before the cup".
  Salvage added the `stars.test.ts` witness fixtures + a regression test
  for the airborne-but-not-launched case.

Gates at salvage: typecheck clean, 448 unit, filmstrip e2e 1/1 on its own
port, feel.mjs hashes pinned. A leftover scratch spec
(`tests/e2e/__capture.spec.ts`) broke `npm run build` and was removed.
