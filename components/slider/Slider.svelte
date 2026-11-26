<!-- Pick a number, or a range, on a track. Behaviour by Ark UI (Zag slider). -->
<script lang="ts">
  import { Slider as ArkSlider } from "@ark-ui/svelte/slider";
  import { trackModality } from "../lib/modality";
  import { slider } from "./slider.recipe";

  export type SliderSize = "sm" | "md";

  type Props = {
    /** Two-way bindable: one number per thumb ([40], or [20, 80] for a range), <Slider bind:value />.
     * Unbound and unset: one thumb in the middle. Updates while dragging and on every key. */
    value?: number[];
    onvaluechange?: (value: number[]) => void;
    /** When a drag ends, or after a key. */
    onvaluechangeend?: (value: number[]) => void;
    min?: number;
    max?: number;
    step?: number;
    /** A range: how many steps the two thumbs keep between them. */
    minStepsBetweenThumbs?: number;
    /** md: 24px control, 20px thumb (default). sm: 18px control, 14px thumb. */
    size?: SliderSize;
    /** Visible label, above at the start; names the thumbs. */
    label?: string;
    /** Show the value at the end of the label row. */
    showValue?: boolean;
    /** Formats each value, for the text shown and the text announced (aria-valuetext). */
    formatValue?: (value: number) => string;
    /** Names of the thumbs of a range, one per thumb. */
    thumbLabels?: string[];
    /** Form field name (the hidden inputs). */
    name?: string;
    disabled?: boolean;
    "aria-label"?: string;
    id?: string;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    min = 0, max = 100, value = $bindable(), onvaluechange, onvaluechangeend, step = 1, minStepsBetweenThumbs, size = "md",
    label, showValue, formatValue, thumbLabels, name, disabled, "aria-label": ariaLabel, class: className, ...rest
  }: Props = $props();

  /* the engine needs as many values as thumbs: the default is one thumb in the middle */
  // svelte-ignore state_referenced_locally
  if (value === undefined) value = [min + (max - min) / 2];
  const current = $derived(value ?? [min + (max - min) / 2]);

  const r = $derived(slider({ size }));
  const uid = $props.id();
  const thumbId = (index: number) => `${uid}-thumb-${index}`;
  /* a thumb with a name of its own (thumbLabels, or aria-label without a visible label) is named by
   * it alone: it labels itself, which reads its aria-label, instead of the shared label */
  const own = $derived(thumbLabels ?? (!label && ariaLabel != null ? current.map(() => ariaLabel) : undefined));
  const format = (v: number) => (formatValue ? formatValue(v) : String(v));

  $effect(() => trackModality());
</script>

<ArkSlider.Root
  data-slot="slider"
  class={r.base({ class: className })}
  bind:value
  onValueChange={(d: { value: number[] }) => onvaluechange?.(d.value)}
  onValueChangeEnd={(d: { value: number[] }) => onvaluechangeend?.(d.value)}
  {min}
  {max}
  {step}
  {minStepsBetweenThumbs}
  {name}
  {disabled}
  ids={{ thumb: thumbId }}
  aria-label={own ?? (ariaLabel != null ? [ariaLabel] : undefined)}
  aria-labelledby={own?.map((_, index) => thumbId(index))}
  getAriaValueText={formatValue ? ({ value: v }: { value: number }) => formatValue(v) : undefined}
  {...rest}
>
  {#if label}<ArkSlider.Label data-slot="slider-label" class={r.label()}>{label}</ArkSlider.Label>{/if}
  {#if showValue}<ArkSlider.ValueText data-slot="slider-value-text" class={r.valueText()}>{current.map(format).join(" – ")}</ArkSlider.ValueText>{/if}
  <ArkSlider.Control data-slot="slider-control" class={r.control()}>
    <ArkSlider.Track data-slot="slider-track" class={r.track()}>
      <ArkSlider.Range data-slot="slider-range" class={r.range()} />
    </ArkSlider.Track>
    {#each current as _, index (index)}
      <ArkSlider.Thumb {index} data-slot="slider-thumb" class={r.thumb()}>
        <ArkSlider.HiddenInput data-slot="slider-hidden-input" />
      </ArkSlider.Thumb>
    {/each}
  </ArkSlider.Control>
</ArkSlider.Root>
