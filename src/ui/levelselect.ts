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
import { parFor, starGlyphs, type StarCount } from '../world/stars.ts';
import { starRulesLine } from './result.ts';
import { defaultStorage, loadSave, type StorageLike } from '../save/save.ts';

/** The level's display name — registry truth; a nameless rung shows its id. */
function levelName(id: string): string {
  try {
    return getLevel(id).name;
  } catch {
    return id;
  }
}

/** The rung's star rules with its own par numbers — registry truth again.
 *  Teaching BEFORE the first run (playtest N: "the star rules only appear
 *  after a run"): every open rung states what its three stars cost. */
function levelRulesLine(id: string): string {
  try {
    const level = getLevel(id);
    return starRulesLine(parFor(id, level.par));
  } catch {
    return '';
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

  // THE SANDBOX LINE (P4 shortlist item 5 — the 2026-10-10 player
  // evaluation: "the level select still does not list the sandboxes — the
  // campaign points at the afterlife only ONCE, from the finale", and the
  // first hour "never says the word" for the kinds its five-kind kit never
  // places). The census is the evidence (Decision Log 2026-10-10): the 30
  // campaign trays stock FIVE kinds exactly (`straight, gapLip, drop,
  // landing, booster`); `loop` and `springLauncher` (and bigCurve/sbend)
  // appear in NO campaign tray and NO par build — the callout system
  // teaches PLACED kinds, so those two lines can only ever speak where the
  // tray stocks them: a sandbox. A rung tray cannot honestly stock a piece
  // no authored line uses (the tray-parity and budget laws every rung is
  // measured on, and an ADD tail naming a loop on a gap rung is the
  // playtest-M lie this program killed). So the cure is ONE calm line on
  // the first hour's own map — this page — naming the sandboxes and the
  // pieces they keep, and saying the true way in (the farewell's first
  // door; the `?level=` addressing doctrine is untouched, no new affordance,
  // nothing here unlocks or navigates). The banked-rim and run-out kinds
  // the campaign DOES ship get their own moment at the rung (`firstSetAppearance`).
  const sandboxLine = document.createElement('p');
  sandboxLine.id = 'gw-levelselect-sandboxes';
  sandboxLine.textContent =
    'And six sandboxes, one per room — every piece in the kit, loops and springs included. '
    + 'The farewell\u2019s first door opens the porch one.';
  root.appendChild(sandboxLine);

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
        // the per-rung RULES line (playtest N): stars + this level's par,
        // on the rung, before the first run — what each ★ costs, countable
        const rules = document.createElement('span');
        rules.className = 'gw-level-rules';
        rules.textContent = levelRulesLine(id);
        button.appendChild(rules);
        button.setAttribute('aria-label', `${name} — ${stars} of 3 stars — ${levelRulesLine(id)}`);
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
