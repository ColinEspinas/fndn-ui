/* Mount one example of one component in one framework, with the mounts the docs' playground uses
 * (lib/mount-react.tsx, mount-vue.ts, mount-svelte.ts): JSON props as props, `text` as children,
 * `width` as an inline style, inside Ark's LocaleProvider. Each framework's code is loaded only
 * when asked for, and each adapter is a module of its own, so a page depends only on the files of
 * what it shows: work in progress on another component can neither break nor reload it. */
import { applySteps, stepsOf } from "./scenario";
import type { HarnessSpec } from "./specs";
import { FRAMEWORKS, type Example, type Fw, type Mounted } from "../lib/types";

export type MountOptions = {
  /** "worst": render the fixtures' worstCase entry at `index` (falls back to the first) instead of
   * the example. */
  data?: "demo" | "worst";
  /** A scenario (an example with `steps`): render the state after this many steps, applied at
   * once to the mounted component, without timers. */
  step?: number;
};

export async function mountExample(el: HTMLElement, spec: HarnessSpec, target: Fw, index: number, options: MountOptions = {}): Promise<Mounted> {
  const mounted = await mountInitial(el, spec, target, index, options);
  const example = spec.examples?.[index] ?? spec.examples?.[0];
  if (options.step && options.data !== "worst" && example) await applySteps(mounted, example, Math.min(options.step, stepsOf(example).length));
  return mounted;
}

async function mountInitial(el: HTMLElement, spec: HarnessSpec, target: Fw, index: number, options: MountOptions): Promise<Mounted> {
  el.replaceChildren();
  if (!FRAMEWORKS.includes(target)) { el.textContent = `Unknown target "${target}". Use fw=${FRAMEWORKS.join("|")}.`; return () => {}; }
  if (options.data === "worst") {
    const cases = spec.worstCase ?? [];
    if (!cases.length) { el.textContent = `No worst-case data for ${spec.name} yet.`; return () => {}; }
    spec = { ...spec, examples: cases };
  }
  const example: Example | undefined = spec.examples?.[index] ?? spec.examples?.[0];
  if (!example || example.frameworks === false) {
    el.textContent = `No ${target} example for ${spec.name} yet.`;
    return () => {};
  }
  const host = document.createElement("div");
  host.setAttribute("data-harness-host", "");
  host.style.display = "contents";
  el.append(host);
  /* Ark reads the writing direction from its LocaleProvider, which follows <html dir> */
  const dir = document.documentElement.dir === "rtl" ? "rtl" : "ltr";
  const values = { ...example.props };
  if (target === "vue") return (await import("../lib/mount-vue")).mountVue(host, spec, example, values, dir);
  if (target === "svelte") return (await import("../lib/mount-svelte")).mountSvelte(host, spec, example, values, dir);
  return (await import("../lib/mount-react")).mountReact(host, spec, example, values, dir);
}
