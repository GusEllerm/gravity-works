/**
 * THE LEVEL SELECT PAGE (program T0.2, extracted from `src/boot.ts`'s
 * router): `?levels=1` renders the campaign board — the page body itself is
 * `createLevelSelect` (`src/ui/levelselect.ts`; the lock-state and
 * star-rules laws live in that module's note). The routing position is
 * unchanged: the boot routes here after the share fragment, before the
 * game; a page swap is a page boot.
 */
import { createLevelSelect } from '../ui/levelselect.ts';

export function bootLevelSelect(root: HTMLElement): void {
  createLevelSelect(root);
}
