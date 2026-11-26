/* One example rendered in React: JSON props as props, `text` as children, `width` as an inline
 * style, props the spec marks `model` as their uncontrolled twin (value → defaultValue, so the
 * example stays interactive; the playground controls them instead, see exampleElement), inside
 * Ark's LocaleProvider (direction). The playground renders the element in its own tree; the test
 * page gives it a root of its own (lib/mount-react.tsx). */
import { createElement, useEffect, useState, type ReactElement } from "react";
import { LocaleProvider } from "@ark-ui/react/locale";
import { arkLocale, cap, liveModelProps, modelProps, pascal, type Example, type ModelReport, type Spec } from "./types";

/* each adapter is its own chunk, loaded when a page shows it (never all of them at once) */
import { files as adapters } from "virtual:docs-adapters/react"; /* lib/vite-modules.mjs */
const loaded = new Map<string, any>();
const pending = new Map<string, Promise<any>>();

/** The React component of a spec, loaded once and cached. */
export function loadComponent(name: string, file?: string): Promise<any> {
  if (!name) return Promise.resolve(undefined);
  if (loaded.has(name)) return Promise.resolve(loaded.get(name));
  let p = pending.get(name);
  if (!p) {
    const load = adapters[file ?? `${name}.tsx`];
    p = load ? load().then((m) => { const c = m[pascal(name)]; loaded.set(name, c); return c; }) : Promise.resolve(undefined);
    pending.set(name, p);
  }
  return p;
}
export const componentOf = (name: string): any => loaded.get(name);

/** The component once loaded (undefined until then; null when there is none). `sync`: take a
 * cached one in the first render (client-only islands; a hydrated island must match the server). */
export function useComponent(name: string, file?: string, sync = false): any {
  const [c, setC] = useState<any>(() => (sync ? loaded.get(name) : undefined));
  useEffect(() => { let alive = true; void loadComponent(name, file).then((x) => { if (alive) setC(() => x ?? null); }); return () => { alive = false; }; }, [name, file]);
  return c;
}

/** `report` (the playground only): the two-way props with a change event are controlled instead,
 * `value` with `onValueChange` telling `report`, so a value set from outside reaches the mounted
 * component as it would in an app (a carousel travels to the new page). */
export function exampleElement(spec: Pick<Spec, "name" | "props"> & Partial<Pick<Spec, "events">>, example: Example, values: Record<string, unknown>, dir: "ltr" | "rtl", report?: ModelReport): ReactElement | null {
  const Component = componentOf(spec.name);
  if (!Component) return null;
  const props: Record<string, unknown> = { ...values };
  const live = report ? liveModelProps(spec) : [];
  for (const k of modelProps(spec)) {
    if (live.includes(k)) { if (props[k] === undefined) delete props[k]; props[`on${cap(k)}Change`] = (v: unknown) => report!(k, v); }
    else if (k in props) { props[`default${cap(k)}`] = props[k]; delete props[k]; }
  }
  if (example.width) props.style = { width: example.width };
  return createElement(LocaleProvider, { locale: arkLocale(dir) }, createElement(Component, props, example.text));
}
