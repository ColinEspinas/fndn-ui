<!-- Pixel-grid loader with a shimmering label and elapsed timer. -->
<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { loadingState } from "./loading-state.recipe";
  import Shimmer from "../shimmer/Shimmer.svelte";

  export type LoadingStateVariant = "drive" | "dots" | "orbit";
  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    variant?: LoadingStateVariant;
    label?: string;
    /** Formatted elapsed time; ticks from mount when omitted. */
    elapsed?: string;
    showElapsed?: boolean;
  };
  let { variant = "drive", label = "Loading", elapsed, showElapsed = true, class: className, ...rest }: Props = $props();

  function formatElapsed(ms: number): string {
    const total = Math.floor(ms / 100) / 10;
    if (total < 60) return `${total.toFixed(1)}s`;
    const minutes = Math.floor(total / 60);
    /* past an hour the tenths stop meaning anything: 1h 12m */
    if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    return `${minutes}m ${(total % 60).toFixed(1)}s`;
  }

  const r = $derived(loadingState({ variant }));

  let ticking = $state("0.0s");
  $effect(() => {
    if (elapsed !== undefined || !showElapsed) return;
    const start = Date.now();
    const t = setInterval(() => { ticking = formatElapsed(Date.now() - start); }, 100);
    return () => clearInterval(t);
  });
</script>

<div role="status" aria-label={label} data-slot="loading-state" class={r.base({ class: className as string | undefined })} {...rest}>
  <span data-slot="loading-state-grid" class={r.grid()} aria-hidden="true">
    {#each { length: 9 } as _, i (i)}<span data-slot="loading-state-cell" class={r.cell()}></span>{/each}
  </span>
  <Shimmer data-loading-state="label" speed="fast" class={r.label()} title={label}>{label}</Shimmer>
  {#if showElapsed}<span data-slot="loading-state-elapsed" class={r.elapsed()} aria-hidden="true">{elapsed ?? ticking}</span>{/if}
</div>
