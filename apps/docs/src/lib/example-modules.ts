/* One example file's module (components/<name>/examples/<file>.tsx|vue|svelte), loaded when a page shows it,
 * through the two-level lists of lib/vite-modules.mjs: the framework's list of components, then
 * that component's list of files. A page loads only the lists and the examples it shows. */
import type { Fw } from "./types";

type Loader = () => Promise<{ default: any }>;
type List = { files: Record<string, () => Promise<List | { default: any }>> };

/* one per framework, so each mount module (loaded only when its framework is selected) pulls its own */
const ROOTS: Record<Fw, () => Promise<List>> = {
  react: () => import("virtual:docs-examples/react"),
  vue: () => import("virtual:docs-examples/vue"),
  svelte: () => import("virtual:docs-examples/svelte"),
};

/** The module of components/<name>/examples/<file>.<ext> in a framework, or undefined when there is none. */
export async function exampleModule(fw: Fw, name: string, file: string): Promise<{ default: any } | undefined> {
  const root = await ROOTS[fw]();
  const list = (await root.files[name]?.()) as List | undefined;
  const load = list?.files[file] as Loader | undefined;
  return load ? load() : undefined;
}
