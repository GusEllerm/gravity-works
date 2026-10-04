---
tags: [module]
---
# src (app root)

> [!abstract] Role
> The browser entry point and shell of Gravity Works. At stage 0 it only renders a placeholder; the game `World` lands at stage 2.

## What it does

`src/main.ts` queries `#app` and hands it to `src/boot.ts`, which fills it with the placeholder shell — unless the URL carries `?harness=1`, in which case it lazily imports `src/dev/harness.ts` instead (the deterministic render harness; see the dev module note). Nothing else imports them; `index.html` is the only host.

## How it works

One DOM query, one function call — no router, no framework (per the brief's "small entity model, not a framework"). The harness branch is one `URLSearchParams` check with a dynamic import, keeping harness code out of the main chunk. Guarded by `tests/unit/boot.test.ts` (pure string render) and `tests/e2e/smoke.spec.ts` (page loads with zero console errors).

## Depends on / used by

Depends on nothing. Used by `index.html` only. Future modules (`src/world`, `src/track`, `src/physics`, `src/render`, `src/ui`, `src/sets/*`) will be created stage by stage, each with its own note here. Created so far: `src/render`, `src/dev`.
