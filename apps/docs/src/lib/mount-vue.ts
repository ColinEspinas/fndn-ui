/* A component mounted with its Vue adapter (the playground, and the test page in src/harness): JSON
 * props as props, `text` as the default slot, `width` as an inline style, props the spec marks
 * `model` bound two-way against local reactive state, inside Ark's LocaleProvider. Loaded only when
 * the framework asked for is Vue. */
import { createApp, h, nextTick, reactive } from "vue";
import { LocaleProvider } from "@ark-ui/vue/locale";
import { arkLocale, cssText, liveModelProps, modelProps, pascal, type Example, type ModelReport, type Mounted, type Spec } from "./types";
import { exampleModule } from "./example-modules";

import { files as modules } from "virtual:docs-adapters/vue"; /* lib/vite-modules.mjs */

/* adapters already loaded, by name: a mount after a page swap needs no await (lib/warm.ts) */
const loaded = new Map<string, any>();

/** Load the adapter ahead (lib/warm.ts), so the mount after a page swap finds it ready. */
export async function preloadVue(name: string): Promise<void> {
  const load = modules[`${pascal(name)}.vue`];
  if (!load) throw new Error(`components/${name}/${pascal(name)}.vue does not exist`);
  if (!loaded.has(name)) loaded.set(name, (await load()).default);
}

export async function mountVue(el: HTMLElement, spec: Pick<Spec, "name" | "props"> & Partial<Pick<Spec, "events">>, example: Example, values: Record<string, unknown>, dir: "ltr" | "rtl", report?: ModelReport): Promise<Mounted> {
  await preloadVue(spec.name);
  return mountVueNow(el, spec, example, values, dir, report)!;
}

/** The mount itself, synchronous: null while the adapter is not loaded yet. `report` (the
 * playground only) is told of every two-way prop the component changes itself. */
export function mountVueNow(el: HTMLElement, spec: Pick<Spec, "name" | "props"> & Partial<Pick<Spec, "events">>, example: Example, values: Record<string, unknown>, dir: "ltr" | "rtl", report?: ModelReport): Mounted | null {
  const Component = loaded.get(spec.name);
  if (!Component) return null;
  const state = reactive<Record<string, unknown>>({ ...values });
  const models = modelProps(spec);
  const live = report ? liveModelProps(spec) : [];
  const locale = arkLocale(dir);
  const app = ownIds(createApp({
    render() {
      const props: Record<string, unknown> = { ...state };
      if (props.style !== undefined) props.style = cssText(props.style);
      if (example.width) props.style = { width: `${example.width}px` };
      for (const k of models) props[`onUpdate:${k}`] = (v: unknown) => { state[k] = v; if (live.includes(k)) report?.(k, v); };
      return h(LocaleProvider, { locale }, { default: () => h(Component, props, example.text !== undefined ? { default: () => example.text } : undefined) });
    },
  }));
  app.mount(el);
  const mounted: Mounted = () => app.unmount();
  /* the props live in reactive state: assigning re-renders the mounted component in place */
  mounted.update = async (next) => { Object.assign(state, next); await nextTick(); };
  return mounted;
}

/* Every example on a page is its own Vue app, and each app's useId() starts from the same value:
 * two menus would both get the id `menu:v-0:trigger`, and the engine, which finds its parts by id
 * in the document, anchored a menu's panel to another example's trigger (or to nothing: the panel
 * then sat at the top of the page). Each app gets its own id prefix. */
let appCount = 0;
const ownIds = <T extends { config: { idPrefix?: string } }>(app: T): T => { app.config.idPrefix = `vx${++appCount}`; return app; };

/* ── example files (components/<name>/examples/<file>.vue) ── */
export async function mountVueExample(el: HTMLElement, name: string, file: string, dir: "ltr" | "rtl"): Promise<() => void> {
  const m = await exampleModule("vue", name, file);
  if (!m) throw new Error(`components/${name}/examples/${file}.vue does not exist`);
  const Component = m.default;
  const locale = arkLocale(dir);
  const app = ownIds(createApp({ render: () => h(LocaleProvider, { locale }, { default: () => h(Component) }) }));
  app.mount(el);
  await nextTick();
  return () => app.unmount();
}
