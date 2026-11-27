/* tabs — the strip's measurements and the close hand-over (shared by the React, Vue and Svelte
 * adapters). Plain TypeScript, DOM only.
 *
 * placeIndicator puts the indicator on the selected tab before the first paint. The engine (Zag)
 * measures the selected tab after mount and its framework renders the result a frame or more later
 * (more on a cold docs load), so a freshly mounted strip would paint without its indicator.
 * placeIndicator writes the engine's own numbers (the offset box of the selected tab: --left,
 * --top, --width, --height) and un-hides the indicator; the engine's values replace them as soon as
 * it renders them. The indicator does not transition then (the engine keeps transition-property
 * none until a selection is being made), so nothing slides on mount.
 *
 * watchStrip measures whether the tabs are wider than the list (data-overflow on the list, and a
 * callback the adapters render the all-tabs button from) and keeps the edge fades in step with the
 * scroll position (watchVeils, lib/veil.ts). */

import { watchVeils } from "../lib/veil";

const LIST = ":scope > [data-slot=tabs-list], :scope > [data-slot=tabs-header] > [data-slot=tabs-list]";

/** Call before the first paint (useLayoutEffect / onMounted / $effect) with the tabs root. */
export function placeIndicator(root: HTMLElement | null): void {
  const list = root?.querySelector<HTMLElement>(LIST);
  if (!list) return;
  const indicator = list.querySelector<HTMLElement>(":scope > [data-slot=tabs-indicator]");
  /* a closable tab's trigger sits in the (unpositioned) tab part: its offset box is still the list's */
  const tab = list.querySelector<HTMLElement>(':scope > [data-slot=tabs-trigger][aria-selected="true"], :scope > [data-slot=tabs-tab] > [data-slot=tabs-trigger][aria-selected="true"]');
  if (!indicator || !tab) return;
  if (!indicator.hidden && parseFloat(indicator.style.getPropertyValue("--width")) > 0) return;
  /* un-hide before measuring: a measure forces a style pass, and one taken while the indicator is
   * hidden would start the selected tab's stand-in background (recipe) and then fade it out */
  const wasHidden = indicator.hidden;
  indicator.hidden = false;
  if (tab.offsetWidth === 0) { indicator.hidden = wasHidden; return; }
  indicator.style.setProperty("--left", `${tab.offsetLeft}px`);
  indicator.style.setProperty("--top", `${tab.offsetTop}px`);
  indicator.style.setProperty("--width", `${tab.offsetWidth}px`);
  indicator.style.setProperty("--height", `${tab.offsetHeight}px`);
}

/** Keep the tab `value` in view inside a strip that scrolls sideways (more tabs than room): call it
 * after the selection changes and after tabs are added. Only the list scrolls (never the page),
 * by the least that shows the whole tab and its close button, with 24px to spare so the next tab
 * peeks in. Instant after a key, under reduced motion and on mount (`instant`); otherwise smooth. */
export function revealTab(root: HTMLElement | null, value: string | undefined, instant = false): void {
  const list = root?.querySelector<HTMLElement>(LIST);
  if (!list || value === undefined) return;
  reveal(list, list.querySelector<HTMLElement>(`[data-slot=tabs-trigger][data-value="${CSS.escape(value)}"]`), instant);
}

/* the 24px kept clear is the width of the edge fade (tabs.recipe.ts): a revealed tab is never under it */
function reveal(list: HTMLElement, trigger: HTMLElement | null, instant: boolean): void {
  if (list.scrollWidth <= list.clientWidth) return;
  const tab = trigger?.closest<HTMLElement>("[data-slot=tabs-tab]") ?? trigger;
  if (!tab) return;
  const box = list.getBoundingClientRect();
  const r = tab.getBoundingClientRect();
  const spare = Math.min(24, Math.max(0, (box.width - r.width) / 2));
  let delta = 0;
  if (r.left < box.left + spare) delta = r.left - box.left - spare;
  else if (r.right > box.right - spare) delta = r.right - box.right + spare;
  if (Math.abs(delta) < 1) return;
  const still = instant || document.documentElement.dataset.fndnInput === "keyboard" || matchMedia("(prefers-reduced-motion: reduce)").matches;
  list.scrollBy({ left: delta, behavior: still ? "instant" : "smooth" });
}

/** The tab to select and focus when `value` closes: the next enabled tab, else the previous one. */
export function neighbourTab(values: ReadonlyArray<{ value: string; disabled?: boolean }>, value: string): string | undefined {
  const i = values.findIndex((o) => o.value === value);
  if (i < 0) return undefined;
  const after = values.slice(i + 1).find((o) => !o.disabled);
  const before = values.slice(0, i).reverse().find((o) => !o.disabled);
  return (after ?? before)?.value;
}

/** Whether focus is on the trigger of tab `value` (a tab closed by its button while focused hands
 * focus on, or it would fall to the page when the tab goes). */
export function holdsFocus(root: HTMLElement | null, value: string): boolean {
  const el = document.activeElement;
  return !!root && !!el && root.contains(el) && el.getAttribute("data-slot") === "tabs-trigger" && el.getAttribute("data-value") === value;
}

/** Focus the trigger of tab `value` inside the tabs root (after a keyboard close). */
export function focusTab(root: HTMLElement | null, value: string | undefined): void {
  if (value === undefined) return;
  root?.querySelector<HTMLElement>(`[data-slot=tabs-trigger][data-value="${CSS.escape(value)}"]`)?.focus();
}

/** How long a pointer-closed tab takes to close its room before onClose: duration.reveal
 * (0 under reduced motion, from the token) or 0 from the keyboard (keyboard actions are instant). */
export function closeDelay(root: HTMLElement | null, keyboard: boolean): number {
  if (!root || keyboard || document.documentElement.dataset.fndnInput === "keyboard") return 0;
  const raw = getComputedStyle(root).getPropertyValue("--fndn-duration-reveal").trim();
  const ms = raw.endsWith("ms") ? parseFloat(raw) : raw.endsWith("s") ? parseFloat(raw) * 1000 : 0;
  return Number.isFinite(ms) ? ms : 0;
}

/** revealTab now and again once an arriving tab has opened its room (it starts at width 0). */
export function revealTabSoon(root: HTMLElement | null, value: string | undefined): void {
  revealTab(root, value);
  const ms = closeDelay(root, false);
  if (ms > 0) setTimeout(() => revealTab(root, value), ms + 20);
}

/** Focus the trigger of tab `value` once a menu that closed has handed focus back to its trigger
 * (two frames): a tab picked from the all-tabs menu takes focus, as after any selection. */
export function focusTabSoon(root: HTMLElement | null, value: string): void {
  afterFirstPaint(() => focusTab(root, value));
}

/** Run `fn` once the strip has been painted (two frames): `ready` set any earlier would let the
 * tabs of the first render play their arrival. Returns a cancel function. */
export function afterFirstPaint(fn: () => void): () => void {
  let id = requestAnimationFrame(() => { id = requestAnimationFrame(fn); });
  return () => cancelAnimationFrame(id);
}

/** True while the tabs are wider than the list. A list with no box (display: none on it or above
 * it: a host that shows a pager and a select instead) is not overflowing: there is nothing to
 * measure, and the all-tabs button must not appear beside a list its host has hidden. */
function overflows(list: HTMLElement): boolean {
  if (!list.getClientRects().length) return false;
  return list.scrollWidth > list.clientWidth + 1;
}

/** Keep the indicator on the selected tab while tabs open or close their room beside it. The
 * engine re-measures when the selection changes or a tab it knew of resizes, not when the selected
 * tab only moves (a tab arriving or closing before it): the offsets are written here then, as
 * placeIndicator writes them, with no transition (the engine enables one only for a selection). */
function followIndicator(list: HTMLElement): void {
  const indicator = list.querySelector<HTMLElement>(":scope > [data-slot=tabs-indicator]");
  const tab = list.querySelector<HTMLElement>(':scope > [data-slot=tabs-trigger][aria-selected="true"], :scope > [data-slot=tabs-tab] > [data-slot=tabs-trigger][aria-selected="true"]');
  if (!indicator || !tab || indicator.hidden || tab.offsetWidth === 0) return;
  const set = (name: string, px: number) => {
    if (parseFloat(indicator.style.getPropertyValue(name)) !== px) indicator.style.setProperty(name, `${px}px`);
  };
  set("--left", tab.offsetLeft);
  set("--top", tab.offsetTop);
  set("--width", tab.offsetWidth);
  set("--height", tab.offsetHeight);
}

/** Keep the strip's overflow state in step with its size and its tabs: data-overflow on the list
 * and `onOverflow(true | false)` on every change (the adapters render the all-tabs button from it),
 * data-overflow-start and data-overflow-end on the list from the scroll position (the edge fades).
 * Measures at once (call it before the first paint), then on every change of size of the list or a
 * tab, and when tabs are added or removed. When the strip starts to overflow, the selected tab is
 * scrolled clear of the fade (instantly). Returns a cleanup. */
export function watchStrip(root: HTMLElement | null, onOverflow: (overflow: boolean) => void): () => void {
  if (!root) return () => {};
  let list: HTMLElement | null = null;
  let last: boolean | undefined;
  let frame = 0;
  let stopVeils = () => {};
  const measure = () => {
    if (!list) return;
    followIndicator(list);
    const over = overflows(list);
    if (over !== list.hasAttribute("data-overflow")) list.toggleAttribute("data-overflow", over);
    if (over === last) return;
    last = over;
    onOverflow(over);
    /* the all-tabs button takes its room in the next render: then bring the selected tab clear */
    if (over) {
      const at = list;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => reveal(at, at.querySelector<HTMLElement>('[data-slot=tabs-trigger][aria-selected="true"]'), true));
    }
  };
  const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
  const tree = typeof MutationObserver === "undefined" ? null : new MutationObserver(() => { attach(); measure(); });
  /* the list, every tab in it, and the parents a re-render may replace the list in */
  function attach() {
    const now = root!.querySelector<HTMLElement>(LIST);
    if (now !== list) {
      stopVeils();
      list = now;
      stopVeils = watchVeils(list);
    }
    resize?.disconnect();
    tree?.disconnect();
    tree?.observe(root!, { childList: true });
    if (!list) return;
    resize?.observe(list);
    for (const child of Array.from(list.children)) resize?.observe(child);
    if (list.parentElement && list.parentElement !== root) tree?.observe(list.parentElement, { childList: true });
    tree?.observe(list, { childList: true });
  }
  attach();
  measure();
  return () => { cancelAnimationFrame(frame); resize?.disconnect(); tree?.disconnect(); stopVeils(); };
}

/** The strings of the Tabs, for translation. */
export type TabsLabels = {
  /** Name and tooltip of the button that lists every tab while the strip overflows. */
  allTabs: string;
};
export const TABS_LABELS: TabsLabels = { allTabs: "All tabs" };
export const tabsLabels = (labels?: Partial<TabsLabels>): TabsLabels => ({ ...TABS_LABELS, ...labels });

/** The all-tabs menu: one radio group of every tab in order, the selected one checked; picking one
 * closes the menu. A tab whose label is not text (a React node) is listed by its value. */
export function allTabsMenu(
  tabs: ReadonlyArray<{ value: string; label?: unknown; disabled?: boolean }>,
  value: string | undefined,
): [{ type: "radio-group"; name: string; value?: string; closeOnSelect: true; items: Array<{ value: string; label: string; disabled?: boolean }> }] {
  return [{
    type: "radio-group", name: "tabs", value, closeOnSelect: true,
    items: tabs.map((o) => ({ value: o.value, label: typeof o.label === "string" ? o.label : o.value, disabled: o.disabled })),
  }];
}
