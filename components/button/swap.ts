/* Two states in one button (Copy → Copied): the width eases to the new label.
 *
 * A two-state button is as wide as the label it shows, so swapping "Copy" for "Copied" changes its
 * width. Done in one frame, the button would jump wider and its label sideways before the labels
 * began to cross-fade. So the width eases from the old label's to the new one's while the labels cross-fade: one
 * motion, the same timing (duration.base, out-strong: the Button's `motion-size-base` while
 * `data-swapping` is set).
 *
 * `watchSwapWidth(button)` (on mount; returns the cleanup) keeps the button's width known while it
 * is at rest. `easeSwapWidth(button)` runs right after the DOM shows the new state and before it is
 * painted (React: a layout effect on `swapped`; Vue: a post-flush watcher; Svelte: an `$effect` on
 * `swapped`). From the keyboard the Button is instant, like every other keyboard action. */

const widths = new WeakMap<HTMLElement, number>();

/** Keeps the button's layout width (offsetWidth ignores the press scale) while it is not easing. */
export function watchSwapWidth(button: HTMLElement | null | undefined): () => void {
  if (!button) return () => {};
  widths.set(button, button.offsetWidth);
  const ro = new ResizeObserver(() => { if (!button.hasAttribute("data-swapping")) widths.set(button, button.offsetWidth); });
  ro.observe(button);
  return () => ro.disconnect();
}

export function easeSwapWidth(button: HTMLElement | null | undefined): void {
  if (!button) return;
  /* swapped again while still easing: start from where it is now, not from the old target */
  const from = button.hasAttribute("data-swapping") ? parseFloat(getComputedStyle(button).width) : widths.get(button);
  button.style.width = "";
  const to = button.offsetWidth;
  widths.set(button, to);
  if (from === undefined || Math.abs(from - to) < 0.5) return;
  button.style.width = `${from}px`;
  button.setAttribute("data-swapping", "");
  void button.offsetWidth;
  button.style.width = `${to}px`;
  const done = (e?: TransitionEvent) => {
    if (e && (e.target !== button || e.propertyName !== "width")) return;
    button.removeEventListener("transitionend", done);
    button.removeEventListener("transitioncancel", done);
    clearTimeout(timer);
    /* back to its own width: the same value, so nothing moves */
    button.style.width = "";
    button.removeAttribute("data-swapping");
  };
  button.addEventListener("transitionend", done);
  button.addEventListener("transitioncancel", done);
  /* no transition ran (keyboard, reduced motion, hidden): clean up anyway */
  const timer = setTimeout(done, 600);
}
