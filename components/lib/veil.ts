/* The edge veils of a scroller: the side it continues past fades, to show there is more. This
 * keeps two attributes on the scroller, which the recipe paints from:
 *   data-overflow-start  content is hidden past the start edge (scrolled away from the start)
 *   data-overflow-end    content is hidden past the end edge
 * Neither is set while the content fits. The veils are drawn from the scroll position by this
 * code, not by a scroll-driven animation, so they look the same in every browser.
 *
 * Correct at once (call it before the first paint: no veil flashes in or out on mount), on scroll
 * (a passive listener, one write per frame), when the scroller or its content resizes, and when
 * the content changes. Right-to-left is handled (scrollLeft runs from 0 to negative there). A
 * couple of pixels count as nothing, so a fractional offset never shows a veil.
 * Plain TypeScript, DOM only. */

export type VeilOptions = {
  /** The axis the scroller scrolls on: "x" (inline, the default) or "y". */
  axis?: "x" | "y";
  /** While this returns true the attributes are left as they are: a scroller held at a size on
   * its way to another (a width that eases) is judged again when the ease ends. */
  hold?: () => boolean;
};

/* offsets this close to an end count as at that end */
const TOLERANCE = 2;

/** Keep data-overflow-start and data-overflow-end on the scroller in step with its scroll
 * position. Returns a cleanup. */
export function watchVeils(scroller: HTMLElement | null, { axis = "x", hold }: VeilOptions = {}): () => void {
  if (!scroller) return () => {};
  const el = scroller;
  const set = (name: string, on: boolean) => {
    if (on !== el.hasAttribute(name)) el.toggleAttribute(name, on);
  };
  const measure = () => {
    if (hold?.()) return;
    const range = axis === "x" ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight;
    /* the distance scrolled from the start, whatever the direction's sign */
    const from = Math.abs(axis === "x" ? el.scrollLeft : el.scrollTop);
    set("data-overflow-start", range > TOLERANCE && from > TOLERANCE);
    set("data-overflow-end", range > TOLERANCE && range - from > TOLERANCE);
  };
  let frame = 0;
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; measure(); });
  };
  measure();
  el.addEventListener("scroll", schedule, { passive: true });
  el.addEventListener("transitionend", schedule);
  /* resize observers run after layout and before paint: measure there and then */
  const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
  const observeChildren = () => { for (const child of Array.from(el.children)) resize?.observe(child); };
  resize?.observe(el);
  observeChildren();
  const content = new MutationObserver(() => { observeChildren(); schedule(); });
  content.observe(el, { childList: true, subtree: true, characterData: true });
  return () => {
    cancelAnimationFrame(frame);
    el.removeEventListener("scroll", schedule);
    el.removeEventListener("transitionend", schedule);
    resize?.disconnect();
    content.disconnect();
  };
}
