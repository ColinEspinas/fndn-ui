/* tabs — put the indicator on the selected tab before the first paint (shared by the React, Vue
 * and Svelte adapters). Plain TypeScript, DOM only.
 *
 * The engine (Zag) measures the selected tab after mount and its framework renders the result a
 * frame or more later (more on a cold docs load), so a freshly mounted strip would paint without
 * its indicator. placeIndicator writes the engine's own numbers (the offset box of the selected
 * tab: --left, --top, --width, --height) and un-hides the indicator; the engine's values replace
 * them as soon as it renders them. The indicator does not transition then (the engine keeps
 * transition-property none until a selection is being made), so nothing slides on mount. */

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
  if (!list || value === undefined || list.scrollWidth <= list.clientWidth) return;
  const trigger = list.querySelector<HTMLElement>(`[data-slot=tabs-trigger][data-value="${CSS.escape(value)}"]`);
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

/** How long a pointer-closed attached tab takes to close its room before onClose: duration.reveal
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

/** Run `fn` once the strip has been painted (two frames): `ready` set any earlier would let the
 * tabs of the first render play their arrival. Returns a cancel function. */
export function afterFirstPaint(fn: () => void): () => void {
  let id = requestAnimationFrame(() => { id = requestAnimationFrame(fn); });
  return () => cancelAnimationFrame(id);
}
