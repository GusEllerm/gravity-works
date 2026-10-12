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
import { CAMPAIGN, CAMPAIGN_LADDER, dailyBoardId, levelUnlock, previousInCampaign } from '../world/campaign.ts';
import { getLevel } from '../world/levels/feeltrack.level.ts';
import { parFor, starGlyphs, type StarCount } from '../world/stars.ts';
import { starRulesLine } from './result.ts';
import { defaultStorage, loadSave, type StorageLike } from '../save/save.ts';
import { chainRankLine, readChain } from '../share/chain.ts';
import { dailySeed } from '../save/daily.ts';

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

/** The rung's par line in seconds — registry/pars truth, empty if the
 *  rig has no shipped par (a house line needs one, so it never lists). */
function levelParLine(id: string): string {
  try {
    return parFor(id, getLevel(id).par).time.toFixed(2);
  } catch {
    return '';
  }
}

/**
 * Render the page into `root`. One read of the save at render time: stars
 * recorded after this page loads show on the next visit (the page never
 * watches storage — a page swap is a page boot, the shell's convention).
 *
 * THE LINES TAB (freeplay Lane C — THE CHAIN): the ladder is a DOOR, not
 * the building, so the page's second tab lists LINES, not rungs — first
 * the thirty authored pars republished as links "published by the house"
 * (one click: `?level=<id>&line=house` races the par build's own ghost
 * against the shipped par — the seed is never empty and the campaign is
 * undeleted, unchanged-hash, tutorial-spine-plus-seed-gallery), then the
 * device's CHAIN WALK: the links this browser published or raced, rows of
 * link/ghost/par/name straight from the stored payloads, and the rank
 * sentence phrased as what it is — a count walked here, never a global
 * number, never badges (the CHAIN law's NOT-an-input clause). The LEVELS
 * tab is the whole stage-4 page unchanged, default-shown: every existing
 * surface, lock law and star readout rides it untouched.
 */
export function createLevelSelect(root: HTMLElement, store: StorageLike | null = defaultStorage()): void {
  const save = loadSave(store);
  root.innerHTML = '<h1>Gravity Works — levels</h1>';
  // the lock-state styling (dimmed locked rungs, small lock-rule line) is
  // scoped to this page's root class in src/ui/shell.css
  root.classList.add('gw-levelselect');

  // ---- the tabs (plain accessible DOM: a tablist of two real buttons,
  // the panels are plain sections; default tab = LEVELS, the whole
  // stage-4 page, so every existing surface is exactly where it was) ----
  const tabs = document.createElement('div');
  tabs.id = 'gw-levelselect-tabs';
  tabs.setAttribute('role', 'tablist');
  const levelsTabBtn = tabButton('gw-tab-levels', 'Levels', true);
  const linesTabBtn = tabButton('gw-tab-lines', 'Lines', false);
  tabs.append(levelsTabBtn, linesTabBtn);
  root.appendChild(tabs);

  const levelsPanel = document.createElement('div');
  levelsPanel.id = 'gw-panel-levels';
  levelsPanel.setAttribute('role', 'tabpanel');
  root.appendChild(levelsPanel);
  const linesPanel = document.createElement('div');
  linesPanel.id = 'gw-panel-lines';
  linesPanel.setAttribute('role', 'tabpanel');
  linesPanel.hidden = true;
  root.appendChild(linesPanel);
  const show = (levels: boolean): void => {
    levelsPanel.hidden = !levels;
    linesPanel.hidden = levels;
    levelsTabBtn.setAttribute('aria-selected', String(levels));
    linesTabBtn.setAttribute('aria-selected', String(!levels));
  };
  levelsTabBtn.addEventListener('click', () => show(true));
  linesTabBtn.addEventListener('click', () => show(false));

  const status = document.createElement('p');
  status.id = 'gw-levelselect-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.textContent = 'A level opens when the level before it earns at least one star.';
  levelsPanel.appendChild(status);

  // THE SANDBOX DOORS, VISIBLE (round 2, Lane C — supersedes P4 item 5's
  // one calm line): the 2026-10-11 player evaluation named the residue —
  // "the level board names the six sandboxes and links none"; a true
  // sentence nobody clicks is a door still hidden. The census still holds
  // (Decision Log 2026-10-10): the 30 campaign trays stock FIVE kinds
  // exactly, and `loop`/`springLauncher` live only in a sandbox — but the
  // cure is no longer a paragraph. Every room's row now carries its
  // sandbox as a sub-entry BESIDE its rungs: one real link per room
  // (`?level=<room>-sandbox`, the registry's own id and name — the
  // addressing doctrine untouched, nothing unlocks, no rung rule moves),
  // styled one calm step below the rung buttons so a sandbox reads as the
  // TOY door it is and never as an unearned rung: it is nobody's rung,
  // nobody's `next`, and it wears no stars — the star readout belongs to
  // the ladder only. The kinds fact the old line carried rides the
  // sub-entry text instead of a prose sentence.
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
    // the room's SANDBOX rides its row: one quiet sub-entry, a real link
    // (an `<a>`, deliberately not a rung-styled button — no stars, no lock,
    // no rules line: the toy is not scored by the ladder and says so)
    const sandboxItem = document.createElement('li');
    sandboxItem.className = 'gw-level-sandbox-item';
    const sandboxLink = document.createElement('a');
    sandboxLink.id = `gw-level-${room.sandboxId}`;
    sandboxLink.className = 'gw-level-sandbox';
    sandboxLink.href = `?level=${room.sandboxId}`;
    sandboxLink.textContent =
      `${levelName(room.sandboxId)} — every piece in the kit, loops and springs included`;
    sandboxItem.appendChild(sandboxLink);
    list.appendChild(sandboxItem);
    section.appendChild(list);
    levelsPanel.appendChild(section);
  }

  // ---- THE LINES TAB (Lane C — THE CHAIN) --------------------------------
  createLinesTab(linesPanel, store);
}

function tabButton(id: string, label: string, selected: boolean): HTMLButtonElement {
  const b = document.createElement('button');
  b.id = id;
  b.type = 'button';
  b.setAttribute('role', 'tab');
  b.setAttribute('aria-selected', String(selected));
  b.textContent = label;
  b.addEventListener('click', () => {
    if (document.activeElement === b) b.blur();
  });
  return b;
}

/** The LINES panel body, pure over the save's chain store and the shipped
 *  pars — every row is an `<a>` to an address, no new physics surface. */
export function createLinesTab(panel: HTMLElement, store: StorageLike | null = defaultStorage()): void {
  panel.innerHTML = '';
  const heading = document.createElement('h2');
  heading.textContent = 'Lines';
  panel.appendChild(heading);

  const rank = document.createElement('p');
  rank.id = 'gw-lines-rank';
  const links = readChain(store);
  rank.textContent = chainRankLine(links);
  panel.appendChild(rank);

  // 1. THE SEED — the thirty authored pars, republished as links. House
  //    rows are campaign ORDER (the ladder as a gallery); the daily's
  //    seed fold marks TODAY'S LINK so the tab and the daily agree about
  //    which house line the day is (same fold, same number, same name).
  const houseHeading = document.createElement('h3');
  houseHeading.textContent = 'Published by the house';
  panel.appendChild(houseHeading);
  const todayLinkId = dailyBoardId(dailySeed());
  const house = document.createElement('ol');
  house.id = 'gw-lines-house';
  for (const id of CAMPAIGN_LADDER) {
    const par = levelParLine(id);
    if (par === '') continue; // a rig with no shipped par is not a house line
    const item = document.createElement('li');
    const a = document.createElement('a');
    a.id = `gw-line-${id}`;
    a.className = 'gw-line';
    a.href = `?level=${encodeURIComponent(id)}&line=house`;
    a.textContent =
      `${levelName(id)} — par ${par} s · published by the house` +
      (id === todayLinkId ? ' · today’s link' : '');
    item.appendChild(a);
    house.appendChild(item);
  }
  panel.appendChild(house);

  // 2. THE CHAIN — the links this device published or raced, straight
  //    from the payloads (name, par, the board, what they beat). The
  //    phrasing is the store's: walked HERE, verifiable from the bytes
  //    below, no server anywhere in the sentence.
  const chainHeading = document.createElement('h3');
  chainHeading.textContent = 'This device’s chain';
  panel.appendChild(chainHeading);
  if (links.length === 0) {
    const none = document.createElement('p');
    none.id = 'gw-lines-chain-empty';
    none.textContent = 'nothing published or raced here yet — a share press or a pasted link becomes a row';
    panel.appendChild(none);
  } else {
    const chain = document.createElement('ol');
    chain.id = 'gw-lines-chain';
    for (const link of links.slice().reverse()) {
      const item = document.createElement('li');
      item.className = 'gw-line-item';
      item.dataset['hash'] = link.hash;
      const a = document.createElement('a');
      a.className = 'gw-line';
      a.id = `gw-line-link-${link.hash}`;
      a.href = `?level=${encodeURIComponent(link.levelId)}&link=${link.hash}`;
      const parts = [link.name !== undefined ? `“${link.name}”` : levelName(link.levelId)];
      if (link.par !== undefined) parts.push(`par ${link.par.toFixed(2)} s`);
      parts.push(`board ${levelName(link.levelId)}`);
      if (link.lineage !== undefined)
        parts.push(`beat ${link.lineage.name !== undefined ? `“${link.lineage.name}”` : link.lineage.hash}`);
      a.textContent = parts.join(' · ');
      item.appendChild(a);
      chain.appendChild(item);
    }
    panel.appendChild(chain);
  }
}
