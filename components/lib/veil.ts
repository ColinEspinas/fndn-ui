/* The edge veils of a table that scrolls sideways: a card arms them only while its table is wider
 * than it. Plain TypeScript, DOM only.
 *
 * The veils follow a scroll-driven timeline (the table and filter-table recipes). A card whose
 * table stops overflowing (the card grew, a filter left narrower rows) has no scroll range, and
 * Chromium then keeps the timeline's last progress: a card scrolled to the end that widens to fit
 * kept its start veil over the first column. data-overflow goes on the card while the table
 * overflows it, and the recipe hangs the veils' animation on it: a card that fits shows none.
 * Measured at once (call it before the first paint) and again on every resize. */

/** Keep data-overflow on the card in step with its table's width. Returns a cleanup. */
export function watchVeils(card: HTMLElement | null): () => void {
  if (!card) return () => {};
  const measure = () => {
    const over = card.scrollWidth > card.clientWidth + 0.5;
    if (over !== card.hasAttribute("data-overflow")) card.toggleAttribute("data-overflow", over);
  };
  measure();
  if (typeof ResizeObserver === "undefined") return () => {};
  const resize = new ResizeObserver(measure);
  resize.observe(card);
  for (const child of Array.from(card.children)) resize.observe(child);
  return () => resize.disconnect();
}
