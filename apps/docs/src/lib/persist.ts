/* The next page's props for an island kept across pages (transition:persist), in the same frame as
 * the swap.
 *
 * Astro hands a persisted island the new page's props by rewriting its `props` attribute; the React
 * renderer then re-renders inside startTransition, a task or two later. Between the two the browser
 * paints the new page around the old island: the next component's title over the previous
 * component's stage, a flicker on every navigation. So the island
 * reads the new props itself on `astro:after-swap`, which fires synchronously after the swap, and
 * commits them with flushSync before that first paint. */
import { useLayoutEffect, useState } from "react";
import { flushSync } from "react-dom";

/* Astro's serialisation of island props: every value is a [type, value] pair (astro-island.js) */
type Raw = [number, unknown];
function revive(raw: Raw): unknown {
  const [type, value] = raw;
  if (type === 0) return reviveObject(value);
  if (type === 1) return (value as Raw[]).map(revive);
  if (type === 3) return new Date(value as string);
  if (type === 7) return new URL(value as string);
  if (type === 11) return Number.POSITIVE_INFINITY * (value as number);
  return undefined; /* types the docs' props never use */
}
function reviveObject(value: unknown): unknown {
  if (typeof value !== "object" || value === null) return value;
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, revive(v as Raw)]));
}

/** The island's props, replaced by the next page's as soon as the page is swapped. */
export function useSwapProps<P extends object>(persist: string, props: P): P {
  const [swapped, setSwapped] = useState<{ raw: string; props: P } | null>(null);
  useLayoutEffect(() => {
    const onSwap = () => {
      const island = document.querySelector(`astro-island[data-astro-transition-persist="${persist}"]`);
      const raw = island?.getAttribute("props");
      if (!island?.isConnected || !raw) return;
      try {
        const next = reviveObject(JSON.parse(raw)) as P;
        flushSync(() => setSwapped((s) => (s?.raw === raw ? s : { raw, props: next })));
      } catch { /* Astro's own re-render follows */ }
    };
    document.addEventListener("astro:after-swap", onSwap);
    return () => document.removeEventListener("astro:after-swap", onSwap);
  }, [persist]);
  return swapped ? swapped.props : props;
}
