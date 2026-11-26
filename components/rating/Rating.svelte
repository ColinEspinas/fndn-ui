<!-- A score out of a few stars. Behaviour by Ark UI (Zag rating-group). -->
<script lang="ts">
  import { RatingGroup } from "@ark-ui/svelte/rating-group";
  import Star from "phosphor-svelte/lib/StarIcon";
  import { trackModality } from "../lib/modality";
  import { rating } from "./rating.recipe";

  export type RatingSize = "sm" | "md";

  type Props = {
    /** Two-way bindable: the score (0 = none; 3.5 with allowHalf), <Rating bind:value />. */
    value?: number;
    onvaluechange?: (value: number) => void;
    /** Number of stars. */
    count?: number;
    /** Half stars: the first half of a star picks .5. */
    allowHalf?: boolean;
    /** md: 24px cells, 20px stars (default). sm: 18px cells, 14px stars. */
    size?: RatingSize;
    /** Visible label above the stars. */
    label?: string;
    /** Shows the score; it cannot be changed (still focusable and announced). */
    readOnly?: boolean;
    disabled?: boolean;
    /** Form field name. */
    name?: string;
    /** Name of the stars when there is no visible label. */
    "aria-label"?: string;
    id?: string;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    value = $bindable(0), onvaluechange, count = 5, allowHalf, size = "md", label, readOnly, disabled, name, "aria-label": ariaLabel,
    class: className, ...rest
  }: Props = $props();

  const r = $derived(rating({ size, disabled: !!disabled }));
  const stars = $derived(Array.from({ length: count }, (_, i) => i + 1));
  const named = $derived(!label && ariaLabel ? { "aria-label": ariaLabel } : {});

  $effect(() => trackModality());
</script>

<RatingGroup.Root
  data-slot="rating"
  class={r.base({ class: className })}
  bind:value
  onValueChange={(d: { value: number }) => onvaluechange?.(d.value)}
  {count}
  {allowHalf}
  {readOnly}
  {disabled}
  {name}
  {...rest}
>
  {#if label}<RatingGroup.Label data-slot="rating-label" class={r.label()}>{label}</RatingGroup.Label>{/if}
  <RatingGroup.Control data-slot="rating-control" class={r.control()} {...named}>
    {#each stars as index (index)}
      <RatingGroup.Item {index} data-slot="rating-item" class={r.item()}>
        <Star data-slot="icon" weight="fill" aria-hidden="true" />
        <Star data-slot="icon" weight="fill" aria-hidden="true" />
      </RatingGroup.Item>
    {/each}
  </RatingGroup.Control>
  <RatingGroup.HiddenInput data-slot="rating-hidden-input" />
</RatingGroup.Root>
