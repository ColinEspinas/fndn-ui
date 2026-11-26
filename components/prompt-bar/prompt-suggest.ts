/* Prompt suggestions — the @ (sources) and / (commands) lists of the prompt bar.
 *
 * The combobox pattern on a textarea: the textarea keeps focus, the list is a listbox, the
 * active option is exposed through aria-activedescendant. This file holds the parts every
 * target shares, so React, Vue and Svelte behave the same:
 *   parseToken      the @word or /word being typed just before the caret
 *   filterOptions   which options match it
 *   suggestKey      what a keydown means while a list is open
 *   applySuggestion the text after accepting an option
 *   placeList       keeps the portaled list over (or under) the composer while it is open
 * Plain TypeScript, DOM only, no framework imports. */

export type SuggestKind = "source" | "command";
export type SuggestToken = { kind: SuggestKind; query: string; start: number; end: number };
export type SuggestOption = { value: string; label: string; description?: string };

/** The trigger char must start the text or follow whitespace; the query runs to the caret. */
const TOKEN = /(^|\s)([@/])([^\s@/]*)$/u;

export function parseToken(text: string, caret: number = text.length): SuggestToken | null {
  const before = text.slice(0, caret);
  const match = TOKEN.exec(before);
  if (!match) return null;
  const start = match.index + match[1]!.length;
  return { kind: match[2] === "@" ? "source" : "command", query: match[3]!.toLowerCase(), start, end: caret };
}

/** Sources match anywhere in the label; commands match from the start of their name. */
export function matches(kind: SuggestKind, query: string, option: SuggestOption): boolean {
  if (!query) return true;
  if (kind === "command") return option.value.toLowerCase().startsWith(query);
  return option.label.toLowerCase().includes(query) || option.value.toLowerCase().includes(query);
}

export function filterOptions<T extends SuggestOption>(kind: SuggestKind, query: string, options: ReadonlyArray<T>): T[] {
  return options.filter((o) => matches(kind, query, o));
}

/** The text a chosen option puts in place of the token. */
export function insertionFor(kind: SuggestKind, option: SuggestOption): string {
  return kind === "source" ? `@${option.label} ` : `/${option.value} `;
}

export function applySuggestion(text: string, token: SuggestToken, insert: string): { value: string; caret: number } {
  const value = text.slice(0, token.start) + insert + text.slice(token.end);
  return { value, caret: token.start + insert.length };
}

/** An IME is composing: neither the list nor send may react to Enter or the arrows. */
export const composing = (e: KeyboardEvent): boolean => e.isComposing || e.keyCode === 229;

export type SuggestAction =
  | { type: "move"; index: number }
  | { type: "accept"; index: number }
  | { type: "dismiss" };

/** What a keydown on the textarea means while a list is open. null: let it through. */
export function suggestKey(e: KeyboardEvent, open: boolean, count: number, active: number): SuggestAction | null {
  if (!open || composing(e) || e.altKey || e.ctrlKey || e.metaKey) return null;
  if (e.key === "Escape") return { type: "dismiss" };
  if (count === 0) return null;
  if (e.key === "ArrowDown") return { type: "move", index: (active + 1) % count };
  if (e.key === "ArrowUp") return { type: "move", index: (active - 1 + count) % count };
  if ((e.key === "Enter" || e.key === "Tab") && !e.shiftKey) return { type: "accept", index: Math.min(Math.max(active, 0), count - 1) };
  return null;
}

/** Enter without Shift, outside an IME composition, sends. */
export const isSubmitKey = (e: KeyboardEvent): boolean =>
  e.key === "Enter" && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey && !composing(e);

/** Keep the active option visible inside the scrolling listbox. */
export function revealOption(listbox: HTMLElement | null, id: string | undefined): void {
  if (!listbox || !id) return;
  const option = listbox.querySelector<HTMLElement>(`[id="${CSS.escape(id)}"]`);
  if (!option) return;
  const top = option.offsetTop;
  const bottom = top + option.offsetHeight;
  if (top < listbox.scrollTop) listbox.scrollTop = top - 4;
  else if (bottom > listbox.scrollTop + listbox.clientHeight) listbox.scrollTop = bottom - listbox.clientHeight + 4;
}

/**
 * Pin a portaled positioner to the composer while its list is open: same width, `gap` px above
 * it, or below when there is clearly more room there. Exposes --available-height for the list's
 * max-height. Follows scrolling, resizing and the composer growing. Returns a cleanup.
 */
export function placeList(anchor: HTMLElement, positioner: HTMLElement, gap = 8): () => void {
  const MARGIN = 8;
  const update = () => {
    const r = anchor.getBoundingClientRect();
    const vh = document.documentElement.clientHeight;
    const above = r.top - gap - MARGIN;
    const below = vh - r.bottom - gap - MARGIN;
    const top = above >= 160 || above >= below;
    const s = positioner.style;
    s.position = "fixed";
    s.left = `${r.left}px`;
    s.width = `${r.width}px`;
    if (top) { s.top = "auto"; s.bottom = `${vh - r.top + gap}px`; }
    else { s.bottom = "auto"; s.top = `${r.bottom + gap}px`; }
    s.setProperty("--available-height", `${Math.max(0, Math.floor(top ? above : below))}px`);
    /* the portal leaves the component's subtree: carry its writing direction along */
    const dir = getComputedStyle(anchor).direction;
    if (positioner.dir !== dir) positioner.dir = dir;
  };
  update();
  /* A list that is open while focus is elsewhere was not opened by typing: it was there at first
   * paint (a field restored with "/" in it). That is not an entrance, so the popup surface lands at
   * once (its @starting-style entrance would play otherwise; a framework may paint it a frame
   * later). The highlight inside needs nothing: lib/glide.ts shows a highlight placed at mount with no fade. */
  if (!anchor.contains(document.activeElement)) {
    const land = () => { for (const a of positioner.getAnimations({ subtree: true })) a.finish(); };
    land();
    requestAnimationFrame(() => requestAnimationFrame(land));
  }
  const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
  observer?.observe(anchor);
  window.addEventListener("scroll", update, { capture: true, passive: true });
  window.addEventListener("resize", update, { passive: true });
  return () => {
    observer?.disconnect();
    window.removeEventListener("scroll", update, { capture: true });
    window.removeEventListener("resize", update);
  };
}
