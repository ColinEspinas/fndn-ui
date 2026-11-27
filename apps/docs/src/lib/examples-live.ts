/* One example file mounted live in the selected framework, into an element of the page: React in a
 * root of its own, Vue and Svelte by their runtimes (mount-vue.ts, mount-svelte.ts, loaded only
 * when that framework is selected). Every example sits in Ark's LocaleProvider (direction). */
import { mountReactExample } from "./mount-react";
import type { Fw } from "./types";

export type Unmount = () => void;

export async function mountExample(fw: Fw, el: HTMLElement, name: string, file: string, dir: "ltr" | "rtl"): Promise<Unmount> {
  if (fw === "react") return mountReactExample(el, name, file, dir);
  if (fw === "vue") return (await import("./mount-vue")).mountVueExample(el, name, file, dir);
  return (await import("./mount-svelte")).mountSvelteExample(el, name, file, dir);
}
