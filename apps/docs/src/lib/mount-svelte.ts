/* A component mounted with its Svelte adapter (the playground, and the test page in src/harness):
 * $bindable props work uncontrolled when given an initial value, so model props need no wiring.
 * Loaded only when the framework asked for is Svelte. */
import { flushSync, mount, unmount } from "svelte";
import Harness from "./Render.svelte";
import RenderExample from "./RenderExample.svelte";
import { arkLocale, cssText, liveModelProps, pascal, type Example, type ModelReport, type Mounted, type Spec } from "./types";
import { exampleModule } from "./example-modules";

import { files as modules } from "virtual:docs-adapters/svelte"; /* lib/vite-modules.mjs */

/* adapters already loaded, by name: a mount after a page swap needs no await (lib/warm.ts) */
const loaded = new Map<string, any>();

/** Load the adapter ahead (lib/warm.ts), so the mount after a page swap finds it ready. */
export async function preloadSvelte(name: string): Promise<void> {
  const load = modules[`${pascal(name)}.svelte`];
  if (!load) throw new Error(`components/${name}/${pascal(name)}.svelte does not exist`);
  if (!loaded.has(name)) loaded.set(name, (await load()).default);
}

export async function mountSvelte(el: HTMLElement, spec: Pick<Spec, "name" | "props"> & Partial<Pick<Spec, "events">>, example: Example, values: Record<string, unknown>, dir: "ltr" | "rtl", report?: ModelReport): Promise<Mounted> {
  await preloadSvelte(spec.name);
  return mountSvelteNow(el, spec, example, values, dir, report)!;
}

/** The mount itself, synchronous: null while the adapter is not loaded yet. `report` (the
 * playground only) is told of every two-way prop the component changes itself, through its change
 * callback (`onpagechange`); a value set later by update() replaces the component's own. */
export function mountSvelteNow(el: HTMLElement, spec: Pick<Spec, "name" | "props"> & Partial<Pick<Spec, "events">>, example: Example, values: Record<string, unknown>, dir: "ltr" | "rtl", report?: ModelReport): Mounted | null {
  const component = loaded.get(spec.name);
  if (!component) return null;
  const props: Record<string, unknown> = { ...values, ...(values.style !== undefined ? { style: cssText(values.style) } : {}), ...(example.width ? { style: `width: ${example.width}px` } : {}) };
  if (report) for (const k of liveModelProps(spec)) props[`on${k.toLowerCase()}change`] = (v: unknown) => report(k, v);
  const instance = mount(Harness, { target: el, props: { component, props, text: example.text, locale: arkLocale(dir) } });
  const mounted: Mounted = () => { void unmount(instance); };
  /* Render.svelte exports update(): the same component instance takes the new props */
  mounted.update = async (next) => { (instance as unknown as { update: (p: Record<string, unknown>) => void }).update(next); flushSync(); };
  return mounted;
}

/* ── example files (components/<name>/examples/<file>.svelte) ── */
export async function mountSvelteExample(el: HTMLElement, name: string, file: string, dir: "ltr" | "rtl"): Promise<() => void> {
  const m = await exampleModule("svelte", name, file);
  if (!m) throw new Error(`components/${name}/examples/${file}.svelte does not exist`);
  const component = m.default;
  const instance = mount(RenderExample, { target: el, props: { component, locale: arkLocale(dir) } });
  flushSync();
  return () => { void unmount(instance); };
}
