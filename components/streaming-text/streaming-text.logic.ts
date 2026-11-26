/* Streaming text — the stall timer shared by every target.
 *
 *   stallTimer  call it each time a word arrives (and not once done): when no other word has come
 *               for duration.enter × 2, `onStall` runs and the adapter sets the stalled variant, so
 *               the caret blinks and a stalled stream does not look frozen. The returned cancel
 *               runs on the next word, which drops the blink.
 * Plain TypeScript, DOM only, no framework imports. */

const ms = (value: string): number => {
  const v = value.trim();
  if (!v) return NaN;
  return v.endsWith("ms") ? parseFloat(v) : parseFloat(v) * 1000;
};

/** Run `onStall` after duration.enter × 2 (read from the element's tokens); returns a cancel. */
export function stallTimer(el: Element | null, onStall: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const enter = el ? ms(getComputedStyle(el).getPropertyValue("--fndn-duration-enter")) : NaN;
  const id = window.setTimeout(onStall, 2 * (Number.isFinite(enter) && enter > 0 ? enter : 300));
  return () => window.clearTimeout(id);
}
