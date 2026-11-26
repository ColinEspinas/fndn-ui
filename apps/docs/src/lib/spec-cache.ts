/* What a component page's island needs from the spec (/spec/<name>.json), fetched once per
 * component and kept. lib/warm.ts loads it ahead of a navigation. */
import type { Spec } from "./types";

const pending = new Map<string, Promise<Spec>>();
const ready = new Map<string, Spec>();

export function loadSpec(name: string): Promise<Spec> {
  let p = pending.get(name);
  if (!p) {
    p = fetch(`/spec/${name}.json`).then((r) => r.json()).then((s: Spec) => { ready.set(name, s); return s; });
    pending.set(name, p);
  }
  return p;
}
/* dev: a component's spec, fixture or example was saved (lib/vite-modules.mjs); fetched again on next use */
if (import.meta.hot) import.meta.hot.on("docs:content", ({ name }: { name: string }) => { pending.delete(name); ready.delete(name); });

/** The spec if it has already arrived, read without waiting. */
export const readySpec = (name: string): Spec | undefined => ready.get(name);
