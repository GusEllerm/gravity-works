/**
 * THE ONE REDUCED-MOTION QUESTION (stage 6 a11y pass, Feel.md's law: "Every
 * item has a reduced-motion equivalent"). `prefers-reduced-motion` is asked
 * once, at use, through the live media query — every decorative animation
 * in the shell (the builder's 150 ms flip tween, the replay cinematic's
 * blends, the help spinner's 12 Hz turntable) asks THIS and snaps to its
 * still frame when it answers `reduce`. The save setting
 * (`settings.reducedMotion`) remains the explicit per-player override:
 * `true` forces stills; when the save stays silent the OS setting decides.
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Save setting first, OS preference as the default (the shared rule every
 *  consumer now uses — boot's replay player included). */
export function reducedMotionActive(saved: boolean | undefined): boolean {
  return saved ?? prefersReducedMotion();
}
