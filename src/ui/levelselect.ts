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
 * nothing or lying about being unplayable. Nothing on this page is locked
 * that the unlock rule says is open, and nothing open jumps you anywhere
 * the rule did not grant. The rule itself is `levelUnlock` in
 * `src/world/campaign.ts` — read once here, never restated.
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
      button.textContent = `${name} ${starGlyphs(stars)}`;
      const lock = levelUnlock(save.progress, id);
      if (lock.unlocked) {
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
        button.setAttribute('aria-label', `${name} — locked`);
        // a locked rung is not a dead button: it says exactly what opens it
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
