/* Gliding highlight — one layer that travels between the rows of a list.
 *
 * It follows either the engine's highlighted row (`data-highlighted`, set by Zag for both pointer
 * and keyboard) or plain hover/focus. It glides for pointer and keyboard moves alike: the layer never carries kbd-instant. A held arrow
 * key retargets the running transition from where the layer is, so it never queues up.
 * Its first appearance never travels: it lands on the row and fades in (a popup opened from the
 * keyboard shows the highlight on its row; it does not fly in from the last position).
 * Nothing plays on first paint: a row already highlighted when the list mounts (a list open at
 * mount, a restored highlight), or highlighted by the engine within the next two frames, is
 * shown at once with no fade. The fade is for a highlight that appears later.
 *
 * The container must be the layer's offset parent (position: relative) and the rows must sit
 * above the layer (position: relative; z-index: 1). The layer is styled by `glideLayer` (below) and
 * the rows by the `option` recipe; the caller names its rows by data-slot
 * (`rows: "[data-slot=select-item]"`; a list of two kinds of rows names both). */
export type GlideOptions = {
  /** Selector of the rows inside the container. Default: "[data-glide-row]" */
  rows?: string;
  /** "highlighted": follow rows carrying data-highlighted. "hover": follow pointer and focus. */
  follow?: "highlighted" | "hover";
};

export function glide(container: HTMLElement, layer: HTMLElement, options: GlideOptions = {}): () => void {
  const rows = options.rows ?? "[data-glide-row]";
  const follow = options.follow ?? "hover";

  /* offsetTop ignores transforms, so a popup that is still scaling in measures correctly */
  const topWithin = (row: HTMLElement) => {
    let y = 0;
    let node: HTMLElement | null = row;
    while (node && node !== container) { y += node.offsetTop; node = node.offsetParent as HTMLElement | null; }
    return y;
  };

  /* mounting: the first two frames after glide() starts; a highlight placed then is not an entrance */
  let mounting = true;
  let frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => { mounting = false; }); });

  let retry = 0;
  let waits = 0;
  const place = (row: HTMLElement | null) => {
    if (!row || !container.contains(row)) { layer.removeAttribute("data-visible"); last = null; return; }
    /* A row that is not rendered yet has no box (the engine marks a row highlighted a few
     * milliseconds before it shows the popup). Placing the layer on it now would make its real
     * position a move, and the highlight would fly in from the top of the list and grow. It stays hidden and lands on the row once it can be measured. */
    if (!row.getClientRects().length) {
      layer.removeAttribute("data-visible");
      /* the row may sit in a window that shows a frame later (a dialog opened by a click): look again
       * on the next frames while it is still the highlighted row */
      if (waits < 30 && row.hasAttribute("data-highlighted")) { waits++; cancelAnimationFrame(retry); retry = requestAnimationFrame(() => { if (row.isConnected && row.hasAttribute("data-highlighted") && last !== row) place(row); }); }
      return;
    }
    waits = 0;
    const appearing = !layer.hasAttribute("data-visible");
    /* It glides between any two rows, across a group's title or a separator too: those sit above
     * the layer (the `option` recipe's label and separator are positioned over it), so it passes
     * behind them. */
    last = row;
    /* first appearance: land on the row, do not travel from wherever it was last */
    if (appearing) layer.style.transition = "none";
    layer.style.transform = `translateY(${topWithin(row)}px)`;
    layer.style.height = `${row.offsetHeight}px`;
    if (appearing) {
      /* at mount it is shown before the transition comes back, so it does not fade either */
      if (mounting) layer.setAttribute("data-visible", "");
      void layer.offsetHeight;
      layer.style.transition = "";
      layer.setAttribute("data-visible", "");
    }
  };
  /* the row the layer stands on */
  let last: HTMLElement | null = null;
  const stopMounting = () => { cancelAnimationFrame(frame); cancelAnimationFrame(retry); mounting = false; };

  if (follow === "highlighted") {
    /* The engine clears the highlight when the pointer leaves a row and sets it again when it
     * reaches the next one, so between two rows (and over a separator or a group label) there is
     * a moment with no highlighted row. Hiding then would turn every pointer move into a
     * disappearance followed by a first appearance, which never travels: the layer would "reset"
     * on every group title. While the pointer is inside the list the layer
     * stays where it is and glides to the next highlighted row; it hides when the pointer leaves
     * the list, or when nothing is highlighted and the pointer is not there (keyboard). */
    let inside = false;
    let hide = 0;
    const current = () => container.querySelector<HTMLElement>(`${rows}[data-highlighted]`);
    const sync = () => {
      const row = current();
      window.clearTimeout(hide);
      if (row) place(row);
      else if (inside && layer.hasAttribute("data-visible")) { /* keep it: the pointer is between rows */ }
      else place(null);
    };
    const enter = () => { inside = true; };
    const leave = () => { inside = false; if (!current()) { window.clearTimeout(hide); place(null); } };
    const observer = new MutationObserver(sync);
    observer.observe(container, { attributes: true, subtree: true, childList: true, attributeFilter: ["data-highlighted", "hidden"] });
    container.addEventListener("pointerenter", enter);
    container.addEventListener("pointermove", enter);
    container.addEventListener("pointerleave", leave);
    sync();
    return () => {
      stopMounting();
      observer.disconnect();
      window.clearTimeout(hide);
      container.removeEventListener("pointerenter", enter);
      container.removeEventListener("pointermove", enter);
      container.removeEventListener("pointerleave", leave);
    };
  }

  const over = (e: Event) => {
    const row = (e.target as Element | null)?.closest?.<HTMLElement>(rows) ?? null;
    if (row) place(row);
  };
  const leave = () => place(null);
  const blur = (e: FocusEvent) => { if (!container.contains(e.relatedTarget as Node | null)) place(null); };
  container.addEventListener("pointerover", over);
  container.addEventListener("pointerleave", leave);
  /* capture: an engine may stop focus events at the row (Zag's tree item does, and in Vue that
   * reaches the native focusin), so the container hears them on the way down */
  container.addEventListener("focusin", over, true);
  container.addEventListener("focusout", blur);
  return () => {
    stopMounting();
    container.removeEventListener("pointerover", over);
    container.removeEventListener("pointerleave", leave);
    container.removeEventListener("focusin", over, true);
    container.removeEventListener("focusout", blur);
  };
}

/** The classes of the highlight layer: a recipe composes them into its highlight slot, and adds
 * what is its own (`highlight: [glideLayer, "inset-x-1"]` inside a popup, 4px in, on the rows).
 * The list is the layer's offset parent (relative); rows sit above it (the option row is
 * `relative z-1`). It glides under the keyboard too, so it never carries kbd-instant. Its height
 * eases only between rows of different heights. */
export const glideLayer = [
  "absolute inset-x-0 top-0 h-0 z-0 rounded-chip bg-hover opacity-0 pointer-events-none",
  "motion-transform-move motion-also-[height_var(--fndn-duration-move)_var(--fndn-easing-out-strong)] motion-opacity-base",
  "data-visible:opacity-100",
].join(" ");
