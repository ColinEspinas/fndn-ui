/* approval-card — framework-neutral pieces shared by the React, Vue and Svelte adapters. */

/** Show the active question: the viewport takes its height and the track brings it to the top.
 * At rest the track sits in normal layout (a negative margin), never on a transform: a transform of
 * a whole number of CSS pixels is still a fraction of a device pixel at 125% display scaling, and
 * the question's text would rest one device pixel off. A move is a FLIP: the track takes its new
 * place in layout at once, a transform holds it where it was (or where an interrupted move had
 * got to), and that transform eases away over the track's own transition. Without `animate` the
 * track and the viewport land at once. */
export function placeTrack(viewport: HTMLElement, track: HTMLElement, step: HTMLElement, animate: boolean): void {
  const from = parseFloat(track.style.marginTop) || 0;
  const live = getComputedStyle(track).transform;
  const moving = live && live !== "none" ? new DOMMatrixReadOnly(live).m42 : 0;
  const to = -step.offsetTop;
  const shift = from + moving - to;
  track.style.transition = "none";
  if (!animate) viewport.style.transition = "none";
  viewport.style.height = `${step.offsetHeight}px`;
  track.style.marginTop = `${to}px`;
  track.style.transform = animate && shift ? `translateY(${shift}px)` : "";
  void track.offsetHeight;
  track.style.transition = "";
  if (!animate) viewport.style.transition = "";
  if (animate && shift) track.style.transform = "";
}

/** Dismiss fades the card out only for a pointer click with motion allowed: a click from a key
 * (Enter or Space on the button: detail 0) and reduced motion close it at once. */
export function fadesOnDismiss(event?: { detail?: number } | null): boolean {
  if (!event || !((event.detail ?? 0) > 0)) return false;
  return !(typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches);
}

/** Run `done` once the card's fade-out has ended: data-leaving takes its opacity to 0 over
 * duration.fast (the recipe's leaving variant), then the host hides it. A timer stands in for a transition
 * that never ends (a card hidden or removed mid-fade). Returns a cancel. */
export function afterFadeOut(card: HTMLElement | null, done: () => void): () => void {
  if (!card) { done(); return () => {}; }
  const stop = () => { clearTimeout(timer); card.removeEventListener("transitionend", onEnd); };
  const finish = () => { stop(); done(); };
  const onEnd = (e: TransitionEvent) => { if (e.target === card && e.propertyName === "opacity") finish(); };
  card.addEventListener("transitionend", onEnd);
  const timer = setTimeout(finish, 600);
  return stop;
}
