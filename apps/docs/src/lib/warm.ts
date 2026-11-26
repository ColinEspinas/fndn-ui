/* Getting the next component page ready before it is shown.
 *
 * A component page's island needs the component's spec and, in React, its adapter. If they arrive
 * after the page is on screen, the stage and the inspector are empty for a few frames and then
 * pop in, which reads as a flicker on every navigation. So:
 *   - a link to a component page starts loading both when it is pointed at or focused;
 *   - the router waits for them (600 ms at most) before it swaps the page, so the new page is
 *     complete in its first frame.
 * Imported by the tree, which is on every page. */
import { getOptions } from "./store";
import { componentOf, loadComponent } from "./render";
import { loadSpec } from "./spec-cache";
import { targetsOf, type Fw, type Spec } from "./types";

/** In React the stage needs the adapter; Vue and Svelte load theirs when they mount. */
export const adapterReady = (spec: Spec, fw: Fw) => fw !== "react" || !targetsOf(spec).includes("react") || componentOf(spec.name) !== undefined;

export async function prepare(name: string, fw: Fw = getOptions().fw): Promise<void> {
  const spec = await loadSpec(name);
  if (!adapterReady(spec, fw)) await loadComponent(spec.name, spec.files?.react?.[0]);
  /* Vue and Svelte mount their own adapter after the swap: with it loaded here, that mount takes
   * microtasks, not a fetch, and the stage is not empty for a few frames */
  if (fw === "vue" && targetsOf(spec).includes("vue")) await (mounters.vue ??= await import("./mount-vue")).preloadVue(spec.name);
  if (fw === "svelte" && targetsOf(spec).includes("svelte")) await (mounters.svelte ??= await import("./mount-svelte")).preloadSvelte(spec.name);
}

/** The Vue and Svelte mount modules once loaded, for a mount in the frame of the swap (Workbench). */
export const mounters: { vue?: typeof import("./mount-vue"); svelte?: typeof import("./mount-svelte") } = {};

const nameOf = (path: string | null | undefined) => path?.match(/^\/components\/([a-z0-9-]+)\/?$/)?.[1];

if (typeof document !== "undefined") {
  const onPoint = (e: Event) => {
    const name = nameOf((e.target as Element | null)?.closest?.("a[href]")?.getAttribute("href"));
    if (name) void prepare(name).catch(() => {});
  };
  document.addEventListener("pointerover", onPoint, { passive: true });
  document.addEventListener("focusin", onPoint, { passive: true });
  /* the client router fetches the next page here: wait for the island's data with it */
  document.addEventListener("astro:before-preparation", (e) => {
    const event = e as Event & { to?: URL; loader?: () => Promise<void> };
    const name = nameOf(event.to?.pathname);
    const load = event.loader;
    if (!name || !load) return;
    event.loader = async () => {
      const ready = Promise.race([prepare(name).catch(() => {}), new Promise<void>((done) => setTimeout(done, 600))]);
      await Promise.all([load(), ready]);
    };
  });
}
