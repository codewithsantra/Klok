/**
 * How much of a single continuous timer run should actually be credited.
 *
 * A sub-item runs only for its allocated time — never past it. Total logged
 * time can never exceed the target, so a run is credited only up to whatever
 * remains, and nothing once the target is met.
 *
 * This is the server-authoritative version of the UI's stop-at-target: the
 * client auto-stops while the page is open, but if the tab is closed (or you
 * fall asleep) the run keeps ticking in the background. Applying the cap on
 * every pause/reconcile is what stops a 2h task banking 16.7h overnight.
 *
 * All values in milliseconds.
 */
export function creditedRunMs(runMs: number, accumMs: number, targetMs: number): number {
  if (runMs <= 0) return 0;
  // A target of 0 would make every cap 0 and silently swallow time; treat it
  // as "uncapped" rather than discarding the run.
  if (targetMs <= 0) return runMs;

  const remaining = targetMs - accumMs;
  if (remaining <= 0) return 0; // already at/over target — no more time counts
  return Math.min(runMs, remaining);
}
