/* search — which rows the search shows, in which order and under which group label (shared by the
 * React, Vue and Svelte adapters of search and command-palette). Plain TypeScript, no DOM.
 *
 * Rows of one group are listed together, under one label, groups in the order they first appear in
 * the items; rows without a group form a run with no label. The engine's collection takes the same
 * order, so the arrow keys walk the rows as they are drawn. */

export type SearchRow = { value: string; label: string; group?: string; keywords?: ReadonlyArray<string>; disabled?: boolean };
export type SearchRun<T> = { group: string | undefined; items: T[] };

/** A query matches the label or any keyword (case-insensitive, anywhere in the word). */
export function matchesQuery(item: SearchRow, needle: string): boolean {
  if (!needle) return true;
  if (item.label.toLowerCase().includes(needle)) return true;
  return !!item.keywords?.some((k) => k.toLowerCase().includes(needle));
}

/** How well a row matches (lower is better): the label starts with the query, a word of the label
 * does, the label holds it, a keyword does; -1 when it does not match. */
export function matchRank(item: SearchRow, needle: string): number {
  const label = item.label.toLowerCase();
  if (label.startsWith(needle)) return 0;
  const at = label.indexOf(needle);
  if (at > 0 && /[\s\-_./:]/.test(label[at - 1]!)) return 1;
  if (at > 0) return 2;
  return item.keywords?.some((k) => k.toLowerCase().includes(needle)) ? 3 : -1;
}

/** The rows a query shows: every match for a non-empty query, best first (ties keep their order),
 * the first `limit` otherwise. */
export function filterRows<T extends SearchRow>(items: ReadonlyArray<T>, query: string, limit: number): T[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return items.slice(0, limit);
  return items
    .map((item, i) => ({ item, i, rank: matchRank(item, needle) }))
    .filter((m) => m.rank >= 0)
    .sort((a, b) => a.rank - b.rank || a.i - b.i)
    .map((m) => m.item);
}

/** Rows gathered into runs: one per group, in the order groups first appear. */
export function groupRows<T extends SearchRow>(items: ReadonlyArray<T>): SearchRun<T>[] {
  const runs: SearchRun<T>[] = [];
  const byGroup = new Map<string, SearchRun<T>>();
  for (const item of items) {
    const key = item.group ?? "";
    let run = byGroup.get(key);
    if (!run) { run = { group: item.group, items: [] }; byGroup.set(key, run); runs.push(run); }
    run.items.push(item);
  }
  return runs;
}

/** The command palette's rows: while the query is empty the recent commands come first, under
 * their own label (and leave their group, so a value is listed once); a query searches every
 * command in its own group. */
export function paletteRows<T extends SearchRow>(items: ReadonlyArray<T>, recent: ReadonlyArray<string>, recentLabel: string, query: string): T[] {
  if (query.trim() || !recent.length) return [...items];
  const byValue = new Map(items.map((item) => [item.value, item]));
  const first = recent.map((value) => byValue.get(value)).filter((item): item is T => !!item).map((item) => ({ ...item, group: recentLabel }));
  const taken = new Set(first.map((item) => item.value));
  return [...first, ...items.filter((item) => !taken.has(item.value))];
}

/** ⌘K on macOS, Ctrl K elsewhere (either is accepted everywhere); no Shift or Alt. A key another
 * handler already took (defaultPrevented: an app bound the same key on its own root) is left alone. */
export function isHotkey(event: KeyboardEvent, key: string): boolean {
  return !event.defaultPrevented && (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === key.toLowerCase();
}
