/* segmented-control — the control scrolls sideways when its options do not fit (shared by the
 * React, Vue and Svelte adapters). Plain TypeScript, DOM only.
 *
 * data-overflow goes on the root while the options are wider than its content box: the recipe
 * then scrolls the row and shows the edge veils (segmented-control.recipe.ts). Without it nothing
 * changes, so a control whose options fit is untouched by any of this. The selected option is scrolled
 * into view (clear of the veil) when the control mounts and whenever the selection changes:
 * instantly from the keyboard, at mount and under reduced motion, smoothly after a pointer pick.
 * The thumb lives in the scrolled content, so it stays on its option at any scroll position. */

const OPTION = ":scope > [data-slot=segmented-control-option]";
/* the veil's width (segmented-control.recipe.ts): a revealed option clears it */
const VEIL = 16;

function selectedOption(root: HTMLElement): HTMLElement | null {
  return root.querySelector<HTMLElement>(`${OPTION}[data-state="checked"]`)
    ?? root.querySelector<HTMLElement>(`${OPTION}:has(> input:checked)`);
}

/** True while the options are wider than the root's content box (scroll position does not matter). */
function overflows(root: HTMLElement): boolean {
  const options = root.querySelectorAll<HTMLElement>(OPTION);
  if (!options.length) return false;
  let start = Infinity;
  let end = -Infinity;
  for (const option of Array.from(options)) {
    const r = option.getBoundingClientRect();
    start = Math.min(start, r.left);
    end = Math.max(end, r.right);
  }
  /* the boxes are measured on screen (zoom and transforms included), the padding in the root's
   * own CSS pixels: bring the span back to CSS pixels before comparing. Mixing the two made a
   * zoomed-down control (a docs preview) overflow by its padding, lose its fill, fit again and
   * flip every frame (a ResizeObserver loop). */
  const scale = screenScale(root);
  const cs = getComputedStyle(root);
  const inner = root.getBoundingClientRect().width / scale - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
    - parseFloat(cs.borderLeftWidth) - parseFloat(cs.borderRightWidth);
  return (end - start) / scale > inner + 0.5;
}

/** Screen pixels per CSS pixel of the root (CSS zoom or a scale on an ancestor; 1 otherwise). */
function screenScale(root: HTMLElement): number {
  const w = root.offsetWidth;
  const s = w > 0 ? root.getBoundingClientRect().width / w : 1;
  return s > 0 ? s : 1;
}

/** Scroll the selected option into view inside a control that scrolls; never scrolls the page. */
export function revealSelected(root: HTMLElement, smooth = false): void {
  const item = selectedOption(root);
  if (!item || root.scrollWidth <= root.clientWidth) return;
  const view = root.getBoundingClientRect();
  const box = item.getBoundingClientRect();
  /* room between the option and each veil, start and end of the reading direction (negative: under
   * it). The start wins: an option wider than the room between the veils shows its start, in both
   * directions (in right-to-left the left edge is the end). */
  const rtl = getComputedStyle(root).direction === "rtl";
  /* in CSS pixels, like the veil and scrollBy (the boxes are on screen: zoom included) */
  const scale = screenScale(root);
  const start = (rtl ? view.right - box.right : box.left - view.left) / scale - VEIL;
  const end = (rtl ? box.left - view.left : view.right - box.right) / scale - VEIL;
  /* how far the content moves towards its end (positive) or its start (negative) */
  let shift = 0;
  if (start < 0) shift = start;
  else if (end < 0) shift = Math.min(-end, start);
  if (Math.abs(shift) < 1) return;
  const delta = rtl ? -shift : shift;
  root.scrollBy({ left: delta, behavior: smooth ? "smooth" : "instant" });
}

const smoothAllowed = () =>
  typeof document !== "undefined" && document.documentElement.dataset.fndnInput !== "keyboard"
  && !(typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches);

/** Put the thumb on the selected option now, if the engine has not measured it yet. The engine
 * (Zag) measures in a microtask after mount and its framework renders the result a task later, so
 * a freshly mounted control (a docs page swap) would paint a frame or two without a thumb. Called
 * before the first paint (useLayoutEffect / onMounted / $effect); the engine's own values replace
 * these as soon as it renders them (the same numbers: offset box of the selected option). */
export function placeThumb(root: HTMLElement): void {
  const thumb = root.querySelector<HTMLElement>(":scope > [data-slot=segmented-control-thumb]");
  const item = selectedOption(root);
  if (!thumb || !item) return;
  const measured = !thumb.hidden && parseFloat(thumb.style.getPropertyValue("--width")) > 0;
  if (measured || item.offsetWidth === 0) return;
  thumb.style.setProperty("--left", `${item.offsetLeft}px`);
  thumb.style.setProperty("--top", `${item.offsetTop}px`);
  thumb.style.setProperty("--width", `${item.offsetWidth}px`);
  thumb.style.setProperty("--height", `${item.offsetHeight}px`);
  thumb.hidden = false;
}

/** Keep data-overflow in step with the options' width and the selected option in view. Returns a
 * cleanup. Call it before the first paint: it measures at once (data-overflow and the thumb), not
 * a frame later in the first ResizeObserver callback. */
export function scrollSelected(root: HTMLElement | null): () => void {
  if (!root) return () => {};
  placeThumb(root);
  if (typeof ResizeObserver === "undefined" || typeof MutationObserver === "undefined") return () => {};
  let mounted = false;
  let last: HTMLElement | null = null;
  const measure = () => {
    const over = overflows(root);
    if (over !== root.hasAttribute("data-overflow")) root.toggleAttribute("data-overflow", over);
    if (!mounted) { mounted = true; last = selectedOption(root); revealSelected(root); }
  };
  measure();
  placeThumb(root);
  const resize = new ResizeObserver(measure);
  const watchOptions = () => {
    resize.disconnect();
    resize.observe(root);
    root.querySelectorAll<HTMLElement>(OPTION).forEach((option) => resize.observe(option));
  };
  watchOptions();
  const mutations = new MutationObserver((records) => {
    if (records.some((r) => r.type === "childList" && r.target === root)) watchOptions();
    const now = selectedOption(root);
    if (!mounted || !now || now === last) return;
    const first = last === null;
    last = now;
    revealSelected(root, !first && smoothAllowed());
  });
  mutations.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-state"] });
  return () => { resize.disconnect(); mutations.disconnect(); };
}
