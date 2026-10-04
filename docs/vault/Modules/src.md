---
tags: [module]
---
# src (app root)

> [!abstract] Role
> The browser entry point and shell of Gravity Works. At stage 0 it only renders a placeholder; the game `World` lands at stage 2.

## What it does

`src/main.ts` queries `#app` and hands it to `src/boot.ts`, which fills it with the placeholder shell. Nothing else imports them; `index.html` is the only host.

## How it works

One DOM query, one function call — no router, no framework (per the brief's "small entity model, not a framework"). Guarded by `tests/unit/boot.test.ts` (pure string render) and `tests/e2e/smoke.spec.ts` (page loads with zero console errors).

## Depends on / used by

Depends on nothing. Used by `index.html` only. Future modules (`src/world`, `src/track`, `src/physics`, `src/render`, `src/ui`, `src/sets/*`) will be created stage by stage, each with its own note here.
