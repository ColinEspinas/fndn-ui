/* Navigation menu — the panel box sits under the row, in a portal.
 *
 * The panel box (the engine's viewport positioner) is rendered in a portal, like every popup, so
 * it is never clipped by, nor counted inside, the row that opens it. The engine places the box
 * from the row's start (--viewport-x, from the root's rect) and expects it under the row: this
 * puts the positioner on the root's box in page coordinates (left, top = the root's bottom,
 * width) and gives it the opening trigger's offset and width from the root's start
 * (--trigger-x, --trigger-width), which the box's transform-origin reads so it grows from that
 * trigger. It follows the page's scroll and resizes while open. Returns the cleanup. */
export function anchorPanel(root: HTMLElement | null, positioner: HTMLElement | null): () => void {
  if (!root || !positioner) return () => {};
  const place = () => {
    const r = root.getBoundingClientRect();
    positioner.style.left = `${r.left + window.scrollX}px`;
    positioner.style.top = `${r.bottom + window.scrollY}px`;
    positioner.style.width = `${r.width}px`;
    const trigger = root.querySelector<HTMLElement>("[data-navigation-menu=trigger][aria-expanded=true]");
    if (trigger) {
      const t = trigger.getBoundingClientRect();
      positioner.style.setProperty("--trigger-x", `${t.left - r.left}px`);
      positioner.style.setProperty("--trigger-width", `${t.width}px`);
    }
  };
  place();
  const resize = new ResizeObserver(place);
  resize.observe(root);
  window.addEventListener("resize", place);
  window.addEventListener("scroll", place, { capture: true, passive: true });
  return () => {
    resize.disconnect();
    window.removeEventListener("resize", place);
    window.removeEventListener("scroll", place, { capture: true });
  };
}

/* Vue and Svelte: a key pressed in the panel reaches the item that owns it.
 *
 * The engine pages the links of an open panel with the arrow keys, Home and End on the item that
 * owns the panel (the item's keydown handler; the link's own handler only moves along the row's
 * orientation, and the panel's returns early once the panel is outside the root). React delivers
 * the keydown of a portalled panel to its ancestors in the component tree, the item included; the
 * DOM does not. This listens on the panel box and hands a key that nothing handled to the item
 * whose panel it came from, so the keys behave as they do in React. Only the keys the item handles
 * are handed on, as a bubbling copy (Svelte listens for them on its root, by delegation). Returns the
 * cleanup. */
const ITEM_KEYS = new Set(["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End"]);
export function forwardPanelKeys(root: HTMLElement | null, positioner: HTMLElement | null): () => void {
  if (!root || !positioner) return () => {};
  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || !ITEM_KEYS.has(e.key)) return;
    const value = (e.target as Element | null)?.closest?.("[data-part=content]")?.getAttribute("data-value");
    if (!value) return;
    const item = [...root.querySelectorAll<HTMLElement>("[data-part=item]")].find((i) => i.getAttribute("data-value") === value);
    if (!item) return;
    const { key, code, altKey, ctrlKey, metaKey, shiftKey } = e;
    const copy = new KeyboardEvent("keydown", { key, code, altKey, ctrlKey, metaKey, shiftKey, bubbles: true, cancelable: true });
    item.dispatchEvent(copy);
    if (copy.defaultPrevented) { e.preventDefault(); e.stopPropagation(); }
  };
  positioner.addEventListener("keydown", onKey);
  return () => positioner.removeEventListener("keydown", onKey);
}

/* The current page. A link is current when it says so (current: true) or when its href is the
 * page's (currentHref); a trigger holds the current page when one of its panel's links is current:
 * it is marked aria-current="true" (the current section, not the page itself) and keeps the ghost
 * button's darker fill, as a current plain link does. */
type CurrentLink = { href?: string; current?: boolean };
/** Is this link the current page? */
export const isCurrent = (link: CurrentLink, currentHref?: string): boolean =>
  !!link.current || (!!currentHref && !!link.href && link.href === currentHref);
/** Does this trigger's panel hold the current page? */
export const holdsCurrent = (links: ReadonlyArray<CurrentLink> | undefined, currentHref?: string): boolean =>
  !!links?.some((link) => isCurrent(link, currentHref));
