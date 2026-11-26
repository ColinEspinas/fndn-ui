<!-- A linear progress bar. Behaviour by Ark UI (Zag progress). -->
<script lang="ts">
  import { Progress as ArkProgress } from "@ark-ui/svelte/progress";
  import { progress } from "./progress.recipe";

  export type ProgressTone = "orange" | "green" | "red" | "accent";
  export type ProgressSize = "sm" | "md";

  type Props = {
    /** Between min and max (clamped). null or omitted: indeterminate. */
    value?: number | null;
    min?: number;
    max?: number;
    /** Shown above the track at the start; names the progress bar. */
    label?: string;
    /** The progress bar's name when there is no visible label. */
    ariaLabel?: string;
    /** Shows the value above the track at the end ("42%"). */
    showValue?: boolean;
    /** Text shown as the value instead of the percentage ("3 of 8 files"); also aria-valuetext. */
    valueText?: string;
    tone?: ProgressTone;
    /** The track's height: sm 4px, md 6px. */
    size?: ProgressSize;
    class?: string;
    style?: string;
    /** data-* attributes land on the root (a host marks it as one of its parts). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    value = null, min = 0, max = 100, label, ariaLabel = "Progress", showValue = false, valueText, tone = "orange", size = "md", class: className, style, ...data
  }: Props = $props();

  const uid = $props.id();
  const labelId = `${uid}label`;
  const r = $derived(progress({ tone, size }));
  const lo = $derived(Number.isFinite(min) ? min : 0);
  const hi = $derived(Number.isFinite(max) && max > lo ? max : lo + 100);
  /* omitted or not a number: indeterminate (Ark's own default would be 50) */
  const v = $derived(value == null || !Number.isFinite(value) ? null : Math.min(hi, Math.max(lo, value)));
  const hasLabel = $derived(label != null && label !== "");
</script>

<ArkProgress.Root {...data} data-slot="progress" class={r.base({ class: className })} {style} value={v} min={lo} max={hi} ids={{ label: labelId }}>
  {#if hasLabel}<ArkProgress.Label data-slot="progress-label" class={r.label()}>{label}</ArkProgress.Label>{/if}
  {#if showValue && v != null}
    {#if valueText}
      <ArkProgress.ValueText data-slot="progress-value" class={r.value()} aria-hidden="true">{valueText}</ArkProgress.ValueText>
    {:else}
      <ArkProgress.ValueText data-slot="progress-value" class={r.value()} aria-hidden="true" />
    {/if}
  {/if}
  <ArkProgress.Track
    data-slot="progress-track"
    class={r.track()}
    aria-label={hasLabel ? undefined : ariaLabel}
    aria-labelledby={hasLabel ? labelId : undefined}
    aria-valuetext={valueText}
  >
    <ArkProgress.Range data-slot="progress-range" class={r.range()} />
  </ArkProgress.Track>
</ArkProgress.Root>
