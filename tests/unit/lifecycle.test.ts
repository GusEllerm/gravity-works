/**
 * T0.5 BLINDNESS GATE 1, unit half (engineering evaluation R5/M2). The e2e
 * (`tests/e2e/lifecycle-kill.spec.ts`) proves the REAL wiring — a page that
 * goes hidden must not lose a pending edit. This file pins the lifecycle
 * CONTRACT that wiring stands on, deterministically and event-modelled:
 * the mobile app-switch is a `visibilitychange` whose `visibilityState`
 * reads 'hidden' and NOTHING ELSE — no `pagehide`, no unload, the document
 * survives. The two shell hooks in `src/boot.ts` (pagehide→flush and
 * visibilitychange→hidden→flush) are mirrored here verbatim over a fake
 * document, and the mutation-blind event orderings are asserted:
 *
 * 1. app-switch kill (hidden event, no pagehide): the pending edit lands;
 * 2. a resume (visible event) writes nothing — the guard branch matters;
 * 3. repeated hidden events with no new edits are byte-stable (idempotent);
 * 4. the later real unload (pagehide) finds the slate clean.
 *
 * Limit, stated honestly: this mirrors the hooks, it cannot import the
 * browser-only boot; only the e2e can catch someone DELETING the real hook,
 * which is exactly what it is mutation-proven against. This file is what
 * stays green when a browser surface cannot background a page at all (see
 * the e2e header for the protocol probe) and what keeps the flush's
 * semantics pinned while the wiring is being moved by the extraction crew.
 */
import { describe, expect, test } from 'vitest';
import { createBuildAutosave, loadSave, memoryStorage, rememberBuild, savedBuild } from '../../src/save/save.ts';
import { KITCHEN01 } from '../../src/world/levels/kitchen01.level.ts';
import type { Build } from '../../src/track/build.ts';

/** Minimal document/window event model with a real visibilityState getter —
 *  the shape every browser gives the shell hooks. */
function fakePage() {
  const docListeners: ((ev: { type: string }) => void)[] = [];
  const winListeners: ((ev: { type: string }) => void)[] = [];
  const doc = {
    visibilityState: 'visible' as 'visible' | 'hidden',
    addEventListener: (_type: string, fn: (ev: { type: string }) => void) => docListeners.push(fn),
  };
  const win = {
    addEventListener: (_type: string, fn: (ev: { type: string }) => void) => winListeners.push(fn),
  };
  const fire = {
    visibilitychange(next: 'visible' | 'hidden') {
      doc.visibilityState = next;
      for (const fn of docListeners) fn({ type: 'visibilitychange' });
    },
    pagehide() {
      for (const fn of winListeners) fn({ type: 'pagehide' });
    },
  };
  return { doc, win, fire };
}

describe('page-lifecycle autosave contract (app-switch kill modelled at unit level)', () => {
  test('a hidden visibilitychange with NO pagehide stores the pending edit; a resume does not write', () => {
    const page = fakePage();
    // manual clock: the ONLY writes are the ones the hooks force
    const store = memoryStorage();
    const autosave = createBuildAutosave((b) => rememberBuild(b, store), 350, {
      schedule: () => 0, // never fires: the window stays open by construction
      cancel: () => undefined,
    });
    // THE SAME two hooks the game shell installs (src/boot.ts, flush law)
    page.win.addEventListener('pagehide', () => autosave.flush());
    page.doc.addEventListener('visibilitychange', () => {
      if (page.doc.visibilityState === 'hidden') autosave.flush();
    });

    const full = KITCHEN01.parBuild();
    const pieces = full.pieces;
    const staged: Build = { ...full, pieces: pieces.slice(0, pieces.length - 1) };
    autosave.edit(staged); // the last placement — still PENDING, window open
    expect(savedBuild(KITCHEN01.id, store)).toBeUndefined();

    // THE APP-SWITCH: one visibilitychange event, state hidden, no pagehide.
    page.fire.visibilitychange('hidden');
    const savedNow = savedBuild(KITCHEN01.id, store);
    expect(savedNow, 'the hidden-event flush must store the pending edit').not.toBeUndefined();
    expect(savedNow!.pieces.length).toBe(staged.pieces.length);

    // idempotence: the tab is backgrounded again with nothing new pending
    const bytes = loadSave(store).builds[KITCHEN01.id];
    page.fire.visibilitychange('hidden');
    expect(loadSave(store).builds[KITCHEN01.id]).toBe(bytes);

    // a RESUME must not write (the guard branch of the hook): a 'visible'
    // event with an open window must leave the disk exactly as it was
    autosave.edit({ ...full, pieces: pieces.slice(0, 1) }); // fresh pending edit
    const beforeResume = loadSave(store).builds[KITCHEN01.id];
    page.fire.visibilitychange('visible');
    expect(loadSave(store).builds[KITCHEN01.id], 'a visible event must not flush').toBe(beforeResume);

    // the later REAL navigation away (reload/level change) fires pagehide —
    // it flushes the still-pending edit and the loop closes clean
    page.fire.pagehide();
    expect(savedBuild(KITCHEN01.id, store)!.pieces.length).toBe(1);
    const settled = loadSave(store).builds[KITCHEN01.id];
    page.fire.pagehide();
    expect(loadSave(store).builds[KITCHEN01.id]).toBe(settled);
  });
});
