---
livedocs: module
tags: [module, ui]
---
# Modules/ui

> [!abstract] Role
> The builder UI (brief §9.1): tray, socket snapping, ghost, budget counter. Plain accessible DOM so the stage-6 a11y pass extends rather than rebuilds it. Owner: Systems Engineer.

## What it does

`src/ui/builder.ts` — `createBuilder(host, { level, build, onChange })` renders `#gw-tray` (a real `<button>` per kit kind from `PIECE_KINDS`, `data-kind`, aria-pressed), `#gw-piece-count` ("n / budget pieces"), `#gw-ghost-state`, `#gw-target-label`, and the `#gw-place` / `#gw-rotate` / `#gw-remove-piece` / `#gw-launch` buttons. It owns no physics: every mutation hands the canonical `Build` to `onChange`; the shell rebuilds the `World` (`src/boot.ts`).

Placement model: the track is a socket graph. `targets()` lists open sockets (unoccupied `startSocket` + piece exit sockets nothing is joined to within `JOIN_TOL`); arrows cycle targets and kinds, `R` toggles forward/reverse seating, Enter places, Delete removes. Forward seating is `fitSocket` (the contract's exact seating) and the `snapSocket` gate decides the ghost's colour — green `snapped`, amber `seated` (a reverse mount is a half turn about the target's up: deck lines still match, tangents deliberately do not, so the gate reports it honestly), red `invalid`. The ghost itself is a translucent mesh of `pieceGeometries(kind)` in the world's scene (`setScene`).

## Guarded by

`tests/e2e/builder.spec.ts` (13 tray buttons, hover→ghost, place/remove move the counter, rotate reports `seated`/`snapped`, zero console errors). Budget overflow refuses placement; keyboard focus rings are stage 6, roles/labels are already real.

## Depends on / used by

`src/track` only (snap/pieces/socket) — never `src/physics`. Used by `src/boot.ts`.
