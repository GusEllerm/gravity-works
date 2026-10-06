/**
 * THE LEVEL SELECT (stage 4): the `?levels=1` page — the whole campaign in
 * one honest list. Plain accessible DOM like every other shell surface:
 * one `<section>` per room with a real heading (§9.2's rooms are the page's
 * GROUPING, not a filter), one `<button id="gw-level-<id>">` per rung
 * carrying the level's own name (registry truth, never a mirrored string)
 * and its earned stars as the shared ★/☆ readout.
 *
 * Locked rungs follow the tray's no-dead-affordances convention: they stay
 * focusable, carry `aria-disabled="true"` and `aria-describedby` pointing
 * at the page's live region, and CLICKING ONE SAYS WHY — "Locked — earn at
 * least one star on <previous level> to open this." — instead of doing
 * nothing or lying about being unplayable. They also TEACH WITHOUT A CLICK
 * (playtest K: "taught nothing about what's unlocked or why"): a locked
 * rung carries a lock glyph and NO ☆☆☆ placeholder (stars are the unlock
 * rule's currency and an unearned rung may not fake them), stars ACTUALLY
 * earned stay visible behind the lock, and the rung states its rule INLINE
 * in the button — "Earn a star on <previous level> to open this" — so
 * locked, unlocked-unplayed (☆☆☆) and earned (★) differ at a glance.
 * Nothing on this page is locked that the unlock rule says is open, and
 * nothing open jumps you anywhere the rule did not grant. The rule itself
 * is `levelUnlock` in `src/world/campaign.ts` — read once here, never
 * restated.
 *
 * This page is a PLAYER surface. `?level=` remains the recorded debug
 * addressing (Decision Log 2026-10-07) — the page is how a player travels,
 * the param is how the test rig and the developer do; what a player may
 * PLAY is decided by stars earned, not by either.
 */
import { CAMPAIGN, levelUnlock, previousInCampaign } from '../world/campaign.ts';
import { getLevel } from '../world/levels/feeltrack.level.ts';
import { starGlyphs, type StarCount } from '../world/stars.ts';
import { defaultStorage, loadSave, type StorageLike } from '../save/save.ts';

/** The level's display name — registry truth; a nameless rung shows its id. */
function levelName(id: string): string {
  try {
    return getLevel(id).name;
  } catch {
    return id;
  }
}

/**
 * Render the page into `root`. One read of the save at render time: stars
 * recorded after this page loads show on the next visit (the page never
 * watches storage — a page swap is a page boot, the shell's convention).
 */
export function createLevelSelect(root: HTMLElement, store: StorageLike | null = defaultStorage()): void {
  const save = loadSave(store);
  root.innerHTML = '<h1>Gravity Works — levels</h1>';
  // the lock-state styling (dimmed locked rungs, small lock-rule line) is
  // scoped to this page's root class in src/ui/shell.css
  root.classList.add('gw-levelselect');

  const status = document.createElement('p');
  status.id = 'gw-levelselect-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.textContent = 'A level opens when the level before it earns at least one star.';
  root.appendChild(status);

  for (const room of CAMPAIGN) {
    const section = document.createElement('section');
    section.dataset.room = room.id;
    const heading = document.createElement('h2');
    heading.textContent = room.label;
    section.appendChild(heading);
    const list = document.createElement('ul');
    for (const id of room.levelIds) {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.id = `gw-level-${id}`;
      button.type = 'button';
      const name = levelName(id);
      const stars = Math.min(3, Math.max(0, Math.trunc(save.progress.stars[id] ?? 0))) as StarCount;
      const lock = levelUnlock(save.progress, id);
      if (lock.unlocked) {
        // UNLOCKED reads at a glance: an unplayed rung honestly shows ☆☆☆
        // (nothing earned yet), an earned one shows its ★ — the glyph count
        // is the difference, and a LOCKED rung shows no ☆ padding (see
        // below), so "merely unstarred" and "locked" cannot be confused
        // (playtest K: plain-text view read locked rungs as unplayed).
        button.textContent = `${name} `;
        const glyph = document.createElement('span');
        glyph.className = 'gw-level-stars';
        glyph.textContent = starGlyphs(stars);
        button.appendChild(glyph);
        button.setAttribute('aria-label', `${name} — ${stars} of 3 stars`);
        button.addEventListener('click', () => {
          const p = new URLSearchParams();
          p.set('level', id);
          window.location.search = p.toString(); // a search swap is a page boot
        });
      } else {
        button.setAttribute('aria-disabled', 'true');
        button.setAttribute('aria-describedby', 'gw-levelselect-status');
        const need = lock.requires ?? previousInCampaign(id);
        const whyText = `Earn a star on ${levelName(need ?? '')} to open this`;
        // LOCKED reads at a glance (playtest K: "taught nothing about
        // what's unlocked or why"): a lock glyph plus the rule itself
        // INLINE in the button, and NO ☆ padding — the ☆☆☆ placeholder is
        // the readout of an OPEN rung with nothing earned, and on a locked
        // one it reads as "merely unstarred" (playtest K, plain-text view).
        // Stars ACTUALLY earned are never hidden, even behind a lock: the
        // `?level=` doctrine lets a star exist on a still-gated rung, and a
        // hidden trophy is as big a lie as a fake ☆.
        const earned = stars >= 1;
        button.textContent = `${name}${earned ? ' ' : ''}`;
        if (earned) {
          const glyph = document.createElement('span');
          glyph.className = 'gw-level-stars';
          glyph.textContent = starGlyphs(stars);
          button.appendChild(glyph);
          button.append(' ');
        }
        button.appendChild(document.createTextNode('🔒 '));
        const why = document.createElement('span');
        why.className = 'gw-level-lockline';
        why.textContent = whyText;
        button.appendChild(why);
        button.setAttribute(
          'aria-label',
          earned
            ? `${name} — ${stars} of 3 stars — locked — ${whyText.toLowerCase()}`
            : `${name} — locked — ${whyText.toLowerCase()}`,
        );
        // a locked rung is not a dead button: it still says exactly what opens it
        button.addEventListener('click', () => {
          status.textContent = `Locked — earn at least one star on ${levelName(need ?? '')} to open this level.`;
        });
      }
      item.appendChild(button);
      list.appendChild(item);
    }
    section.appendChild(list);
    root.appendChild(section);
  }
}
