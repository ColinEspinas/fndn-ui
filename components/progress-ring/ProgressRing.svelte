<!-- Small progress ring with content in the center. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { progressRing } from "./progress-ring.recipe";

  export type ProgressRingTone = "orange" | "green" | "red" | "accent";
  export type ProgressRingSize = "sm" | "md";
  type Props = HTMLAttributes<HTMLSpanElement> & {
    /** 0..1. Out-of-range and non-finite values are clamped. */
    progress: number;
    tone?: ProgressRingTone;
    size?: ProgressRingSize;
    /** Accessible name of the progress bar. */
    label?: string;
    children?: Snippet;
  };
  let { progress, tone = "orange", size = "md", label = "Progress", class: className, style, children, ...rest }: Props = $props();
  const c = $derived(progressRing({ size, tone }));
  const px = $derived(size === "sm" ? 24 : 28);
  const r = $derived((px - 2) / 2);
  const value = $derived(Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0);
</script>

<span
  role="progressbar"
  aria-label={label}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={Math.round(value * 100)}
  data-slot="progress-ring"
  class={c.base({ class: className as string | undefined })}
  style="--fndn-progress:{value};{style ?? ''}"
  {...rest}
>
  <svg data-slot="progress-ring-svg" class={c.svg()} viewBox="0 0 {px} {px}" aria-hidden="true">
    <circle data-slot="progress-ring-track" class={c.track()} cx={px / 2} cy={px / 2} r={r} pathLength="100" />
    <circle data-slot="progress-ring-bar" class={c.bar()} cx={px / 2} cy={px / 2} r={r} pathLength="100" />
  </svg>
  {#if children}<span data-slot="progress-ring-label" class={c.label()}>{@render children()}</span>{/if}
</span>
