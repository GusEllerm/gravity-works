/**
 * THE PREMISE BEAT (program T1.2, player evaluation "The first 60 seconds":
 * at t+0 "no title screen, no menu, no premise — the page IS the kitchen01
 * builder"). On the COLD FIRST VISIT the house shows itself first: the room
 * with ONE silent car rolling the rung's own par line, BEFORE any builder
 * chrome appears. Nothing new is built for it — the beat reuses the shipped
 * machinery: the level's par reference build mounted in the ordinary game
 * shell (the `?build=par` rig), the ordinary §7.3 run camera leading the
 * car, and the ordinary terminal edge ending it. It is ANIMATED by
 * definition, so the reduced-motion law sends reduced-motion players
 * STRAIGHT to the builder (the same `reducedMotionActive` rule every
 * decorative tween asks). A click or any keypress SKIPS (the one event is
 * swallowed whole — the splash owns it, it never places a piece or starts
 * audio mid-beat).
 *
 * WHOSE FIRST VISIT this is, said exactly:
 * - a real cold browser (no `localStorage` beat flag), landing on the bare
 *   root — no `?level=`/`?build=`/`?set=` address, because a recorded
 *   address is a test rig or a return path, nobody's first visit;
 * - NOT automation: headless runners (`navigator.webdriver`) skip the beat
 *   — every suite page would otherwise sit through a 3-second film — and
 *   the beat's own spec (`tests/e2e/intro.spec.ts`) opts IN explicitly with
 *   `?intro=1`, so the cinematic stays gated by its own tests, never by
 *   accident;
 * - `?intro=1` forces the beat for that spec (and for a human who wants
 *   the encore) — but never past reduced-motion, which wins outright.
 *
 * SILENT is structural, not a volume hack: a cold first visit has made no
 * gesture, the audio engine is unlocked ONLY by a gesture, and the beat's
 * own skip listener swallows that first gesture before the unlock ever
 * hears it. No voice can speak during the beat.
 *
 * The chrome is hidden by ONE class on the app root (see `ui/shell.css`);
 * the h1 stays — the title IS the premise screen now, and it is the line
 * the display face was chosen for. The rules lesson the builder would
 * otherwise have spent on an invisible callout line is deferred to the
 * beat's end by the boot glue.
 */
import type { Build } from '../track/build.ts';
import type { Level } from '../world/level.ts';
import type { RunStatus } from '../world/world.ts';
import { reducedMotionActive } from '../ui/motion.ts';
import { loadSave } from '../save/save.ts';

/** One-shot flag: the beat plays exactly once per browser. A save-schema
 *  reservation was the worse trade (`Modules/save`); this is a UI fact,
 *  not a game fact, and it never touches a hash or a star. */
const SEEN_KEY = 'gravity-works.premiere.seen';

/** Safety net: a build that never reaches a terminal status (impossible on
 *  the par rails the suite proves, but a beat that outstays 9 s is a bug
 *  the player should not sit through). */
const BEAT_TIMEOUT_MS = 9000;

/** Decide, per the header's law, whether THIS landing plays the beat. */
export function premiereWanted(params: URLSearchParams): boolean {
  const forced = params.get('intro') === '1';
  // the reduced-motion law wins outright — straight to the builder
  if (reducedMotionActive(loadSave().settings.reducedMotion)) return false;
  if (forced) return true;
  // automation never sits through the film (its own spec opts in)
  if (typeof navigator !== 'undefined' && navigator.webdriver) return false;
  // a recorded address is a test rig or a return path, not a first visit
  if (params.has('level') || params.has('build') || params.has('set')) return false;
  try {
    if (localStorage.getItem(SEEN_KEY)) return false;
  } catch {
    return false; // storage blocked: not verifiably a first visit — don't nag
  }
  return true;
}

/** Address the flag the beat's own spec asserts on (no second source). */
export function premiereSeen(): boolean {
  try {
    return !!localStorage.getItem(SEEN_KEY);
  } catch {
    return false;
  }
}

export interface PremiereBeat {
  /** The build the beat's world mounts in: the level's par reference line. */
  readonly build: Build;
  /** True while the chrome is still hidden. */
  readonly running: boolean;
  /**
   * A terminal status arrived. Returns TRUE when the beat owns the edge —
   * the boot then skips the panel, the stars, the share freeze and the
   * end-hold (the beat's last look is the finish composition for one
   * still beat before the builder returns) — and false after the beat
   * already ended (a post-skip terminal is an ordinary run edge).
   */
  terminal(status: RunStatus): boolean;
  /** End the beat (skip, terminal, or timeout): idempotent — chrome back,
   *  listeners gone, the seen flag set. */
  end(): void;
}

/** Start the beat: hides the chrome and arms the skip + timeout. The boot
 *  glue owns WHEN it ends (terminal edge, skip, or the safety timer). */
export function startPremiereBeat(root: HTMLElement, level: Level): PremiereBeat {
  root.classList.add('gw-premiere');
  let active = true;

  const beat: PremiereBeat = {
    build: level.placeholderBuild(),
    get running() {
      return active;
    },
    terminal(status) {
      if (!active) return false;
      void status; // every terminal ends the beat: the finish composition IS its last frame
      return true;
    },
    end() {
      if (!active) return;
      active = false;
      clearTimeout(timer);
      window.removeEventListener('pointerdown', skip, true);
      window.removeEventListener('keydown', skip, true);
      root.classList.remove('gw-premiere');
      try {
        localStorage.setItem(SEEN_KEY, '1');
      } catch {
        // storage blocked: the beat may replay next visit — nothing else about
        // it changed, and a nagging title screen beats a throw at the boot
      }
    },
  };
  const skip = (ev: Event): void => {
    // capture + swallow: the dismissing gesture belongs to the beat alone
    ev.stopPropagation();
    beat.end();
  };
  window.addEventListener('pointerdown', skip, true);
  window.addEventListener('keydown', skip, true);
  const timer = setTimeout(() => beat.end(), BEAT_TIMEOUT_MS);
  return beat;
}
