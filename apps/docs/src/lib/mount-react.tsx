/* React in a root of its own: an example file (lib/examples-live.ts), and a component with JSON
 * props (the test page, src/harness). */
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { LocaleProvider } from "@ark-ui/react/locale";
import { arkLocale, pascal, type Example, type Mounted, type Spec } from "./types";
import { exampleModule } from "./example-modules";
import { exampleElement, loadComponent } from "./render";

/** The default export of components/<name>/examples/<file>.tsx (undefined when there is none). */
export async function loadReactExample(name: string, file: string): Promise<any> {
  return (await exampleModule("react", name, file))?.default;
}

export async function mountReactExample(el: HTMLElement, name: string, file: string, dir: "ltr" | "rtl"): Promise<() => void> {
  const Component = await loadReactExample(name, file);
  if (!Component) throw new Error(`components/${name}/examples/${file}.tsx does not exist`);
  const root = createRoot(el);
  /* rendered before this returns, so the caller can measure it */
  flushSync(() => root.render(createElement(LocaleProvider, { locale: arkLocale(dir) }, createElement(Component))));
  return () => root.unmount();
}

/** A component with JSON props (lib/render.tsx), mounted and updated in place. */
export async function mountReact(el: HTMLElement, spec: Pick<Spec, "name" | "props">, example: Example, values: Record<string, unknown>, dir: "ltr" | "rtl"): Promise<Mounted> {
  if (!(await loadComponent(spec.name))) throw new Error(`components/${spec.name}/${spec.name}.tsx has no export ${pascal(spec.name)}`);
  const root = createRoot(el);
  let current = { ...values };
  /* commit the mount now, so a scenario's steps arrive as updates (as they would in an app), not
   * folded into a first render that React had not committed yet */
  flushSync(() => root.render(exampleElement(spec, example, current, dir)));
  const mounted: Mounted = () => root.unmount();
  /* same root, same element type: React updates the mounted tree in place */
  mounted.update = async (next) => {
    current = { ...current, ...next };
    flushSync(() => root.render(exampleElement(spec, example, current, dir)));
  };
  return mounted;
}
