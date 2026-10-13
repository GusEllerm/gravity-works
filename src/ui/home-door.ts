/**
 * THE WAY BACK (h4 Lane F2, player truth 3: "the new front door is a
 * ONE-WAY door — nothing in the shipped UI leads back to it"). One link
 * in the chrome of every page that is not the front door — the rung
 * builder, the sandboxes, the share page: `⌂ the house`, NAMED and
 * Tab-reachable, the nav's FIRST crumb — the header says what it always
 * was: a room you came from.
 *
 * THE KEY FORM of the same verb is a single `Escape`, with the stated
 * exceptions, because Escape is already spoken for on a rung page:
 *
 * 1. a press CONSUMED upstream never reaches the door — the result
 *    panel's dismiss runs capture+`stopPropagation` (`src/boot.ts`), so
 *    it sees that press first and it stops being a door press… which is
 *    why this listener is CAPTURE: it must also COUNT that swallowed
 *    press, or the panel's second Escape would read as a chord opener
 *    and walk a player out of the level mid-thought (the law
 *    `tests/e2e/playtest-aa.spec.ts` proves). The share page opts out of
 *    the panel guard (`panelOwnsEscape: false`) — its verdict panel has
 *    no dismiss law to protect, so a visible panel there must not eat
 *    the only way home.
 * 2. the BUILD CAMERA's double-Escape recenter chord (`build-camera.ts`)
 *    owns Escape whenever it MEANS something: while the view is off home
 *    the first press belongs to the chord, and the SECOND press of any
 *    chord is never a door. On a view that is already home the chord is
 *    a no-op — and a lone first press means the house.
 *
 * `href="?"` is the BARE ROUTE from any addressed page — same path,
 * empty query — which is exactly the route that boots THE HOUSE
 * (`src/boot.ts`'s front-door fork). No new URL family is invented.
 */
import { RECENTER_MS } from '../camera/build-camera.ts';

export interface HomeDoorOptions {
  /** The nav row the link joins as its FIRST crumb. */
  nav: HTMLElement;
  /** True when the view is already home — the camera's chord would be a
   *  no-op and a lone Escape means the door. Pages with no build camera
   *  (the share page) pass nothing: every Escape is theirs. */
  viewAtHome?: () => boolean;
  /** Set false where NO result-panel dismiss claims the key (the share
   *  page — `src/pages/share.ts`); a visible read-only verdict panel
   *  must not swallow the way home. */
  panelOwnsEscape?: boolean;
}

/** Mount the link and wire the key. Returns the link (specs name it). */
export function mountHomeDoor(opts: HomeDoorOptions): HTMLAnchorElement {
  const link = document.createElement('a');
  link.id = 'gw-home-link';
  link.href = '?'; // the bare route — THE HOUSE, rendered
  link.textContent = '\u2302 the house';
  opts.nav.prepend(link); // the first crumb: the room you came from
  const sep = document.createElement('span');
  sep.className = 'gw-nav-sep';
  sep.textContent = ' \u00B7 ';
  link.after(sep); // AFTER the link joined the row — `after` on a
  // detached node lands nowhere
  // `-1e9`, NOT 0: `performance.now()` on a page younger than
  // RECENTER_MS would otherwise read the FIRST Escape of the page's
  // life as the second half of a chord that never opened (a share link
  // opened and dismissed inside that window would never find the door —
  // the exact shape the e2e caught in the session log).
  let lastSeen = -1e9;
  window.addEventListener(
    'keydown',
    (ev) => {
      if (ev.key !== 'Escape' || ev.defaultPrevented) return;
      const now = performance.now();
      const secondOfChord = now - lastSeen <= RECENTER_MS;
      lastSeen = now;
      if (secondOfChord) return; // the chord's second press belongs to the camera
      // a VISIBLE result panel owns this press (its own capture handler
      // dismisses it — `src/boot.ts`); the door only COUNTS it here
      if (opts.panelOwnsEscape ?? true) {
        const panel = document.getElementById('gw-result');
        if (panel && !panel.hidden) return;
      }
      if (opts.viewAtHome && !opts.viewAtHome()) return; // the chord's first press too
      window.location.href = '?';
    },
    true, // capture: the panel's swallowed press still COUNTS as chord-half one
  );
  return link;
}
