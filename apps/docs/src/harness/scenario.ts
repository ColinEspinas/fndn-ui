/* Scenarios: examples that change over time. An example may carry `steps`, each
 * `{ after: <ms since the previous step>, props: { …merged over the current props… } }`.
 * The test page mounts the example with its initial props (see mountExample), then applies each
 * step to the mounted component (React, Vue and Svelte update in place), so entrances and
 * transitions run as they would in an app. */
import type { Example, Mounted, Step } from "../lib/types";

export const stepsOf = (example: Example | undefined): Step[] => example?.steps ?? [];

/** The props after the first `n` steps. */
export function propsAfter(example: Example, n: number): Record<string, unknown> {
  let props: Record<string, unknown> = { ...example.props };
  for (const s of stepsOf(example).slice(0, n)) props = { ...props, ...s.props };
  return props;
}

const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

/** Apply steps `from`…`to` (exclusive) at once, a frame apart, without timers. */
export async function applySteps(mounted: Mounted, example: Example, to: number, from = 0): Promise<void> {
  if (!mounted.update) return;
  for (const s of stepsOf(example).slice(from, to)) { await mounted.update(s.props); await frame(); }
}

export type PlayOptions = {
  /** start after this many steps (already applied) */
  from?: number;
  /** delays are divided by it; read before every step */
  speed?: () => number;
  /** props that win over every step */
  extra?: Record<string, unknown>;
  /** after each step: how many are applied, out of how many */
  onStep?: (n: number, total: number) => void;
};

/** Play the steps in real time. Returns stop(): no step is applied after it. */
export function play(mounted: Mounted, example: Example, opts: PlayOptions = {}): () => void {
  const steps = stepsOf(example);
  let stopped = false;
  let timer = 0;
  const next = (n: number) => {
    if (stopped || n >= steps.length || !mounted.update) return;
    const speed = Math.max(0.01, opts.speed?.() ?? 1);
    timer = window.setTimeout(async () => {
      if (stopped) return;
      await mounted.update!({ ...steps[n]!.props, ...opts.extra });
      if (stopped) return;
      opts.onStep?.(n + 1, steps.length);
      next(n + 1);
    }, steps[n]!.after / speed);
  };
  next(opts.from ?? 0);
  return () => { stopped = true; clearTimeout(timer); };
}

/** Measure the size of the last step in `el` (mounted hidden, then unmounted), so the live
 * scenario can hold that room from the start: on a centred stage a block that grows (taller, or
 * wider as words arrive) would otherwise move everything around it at every step. */
export async function finalSize(el: HTMLElement, mountAt: (step: number) => Promise<Mounted>, total: number): Promise<Size> {
  reserve(el, null);
  el.style.visibility = "hidden";
  try {
    const unmount = await mountAt(total);
    await frame(); await frame();
    const cs = getComputedStyle(el);
    const size = { width: parseFloat(cs.width) || 0, height: parseFloat(cs.height) || 0 };
    unmount();
    return size;
  } finally {
    el.style.visibility = "";
  }
}
export type Size = { width: number; height: number };

/** Hold `size` on a flex stage and keep its content at the top, so growth only fills the room. */
export function reserve(el: HTMLElement, size: Size | null): void {
  el.style.minWidth = size ? `${Math.ceil(size.width)}px` : "";
  el.style.minHeight = size ? `${Math.ceil(size.height)}px` : "";
  el.style.alignContent = size && getComputedStyle(el).flexDirection.startsWith("row") ? "flex-start" : "";
}
