/* paint — "nothing plays on first paint" (empty-state, status-pill). An entrance is keyed on data-enter,
 * which a root gets only after it has been painted once. So an empty state never fades in with the
 * page or with the host that renders it, and it does fade when it is shown again out of `hidden`
 * (a list that empties, a search with no results). A host that inserts one later and wants the
 * fade sets data-enter itself. Shared by the React, Vue and Svelte
 * adapters. Plain TypeScript. */

/** Run `fn` after the next two frames (the element's first paint is done); returns a cancel. */
export function afterPaint(fn: () => void): () => void {
  if (typeof requestAnimationFrame === "undefined") return () => {};
  let inner = 0;
  const outer = requestAnimationFrame(() => { inner = requestAnimationFrame(fn); });
  return () => { cancelAnimationFrame(outer); cancelAnimationFrame(inner); };
}
