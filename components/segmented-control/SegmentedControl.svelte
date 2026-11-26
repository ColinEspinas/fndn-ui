<!-- Pick one of a few options side by side. A radio group, by Ark UI (Zag radio-group). -->
<script lang="ts">
  import { SegmentGroup } from "@ark-ui/svelte/segment-group";
  import type { Snippet } from "svelte";
  import { trackModality } from "../lib/modality";
  import { scrollSelected } from "./segmented-control.logic";
  import Count from "../count/Count.svelte";
  import { segmentedControl } from "./segmented-control.recipe";

  export type SegmentedOption = {
    value: string;
    /** Text of the segment. With `icons` it is not shown but stays the accessible name. */
    label?: string;
    disabled?: boolean;
    /** Status dot inside the label: a tag hue, or true for a neutral (ink-3) dot. */
    dot?: SegmentedDotTone | true;
    /** Count inside the label, after the text (a plain Count). */
    count?: number | string;
  };

  export type SegmentedDotTone = "blue" | "green" | "orange" | "red" | "purple" | "cyan" | "yellow" | "pink";

  type Props = {
    /** Segments in order. Strings are accepted as value = label. */
    options: ReadonlyArray<string | SegmentedOption>;
    /** Two-way bindable: <SegmentedControl bind:value />. Defaults to the first option. */
    value?: string;
    onvaluechange?: (value: string) => void;
    /** segments: on a field track (default). chips: separate 26px chips with a gap, for a filter row; size does not apply. */
    variant?: "segments" | "chips";
    /** sm: 24px compact switcher (default). md: 32px control. */
    size?: "xs" | "sm" | "md" | "lg";
    /** pill: fully round. rounded: a field's corners, for squarer chrome. Left out, the app's shape (a pill, or rounded in a rounded app: "shape": "rounded" in the project's fndn.json). */
    shape?: "pill" | "rounded";
    /** Equal-width segments that share the root's width. */
    fill?: boolean;
    /** Icon-only square segments; labels stay as accessible names. Render the icons with the `icon` snippet. */
    icons?: boolean;
    disabled?: boolean;
    /** Form field name of the radios. */
    name?: string;
    /** Icon of an option, rendered before its label. */
    icon?: Snippet<[{ option: { value: string; label: string; disabled?: boolean; dot?: SegmentedDotTone | true; count?: number | string } }]>;
    class?: string;
    style?: string;
    id?: string;
    "aria-label"?: string;
    "aria-labelledby"?: string;
    onkeydown?: (event: KeyboardEvent) => void;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    options, value = $bindable(), onvaluechange, variant = "segments", size = "md", shape, fill = false, icons = false, disabled = false, name, icon,
    class: className, style, id, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledby, onkeydown, ...data
  }: Props = $props();

  const opts = $derived(options.map((o) => (typeof o === "string" ? { value: o, label: o } : { label: o.value, ...o })));
  const r = $derived(segmentedControl({ variant, size, shape, fill, icons }));
  const current = $derived(value ?? opts.find((o) => !o.disabled)?.value ?? null);

  /* Home / End are not part of the native radio keys */
  function homeEnd(event: KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement }) {
    onkeydown?.(event);
    if (event.defaultPrevented || (event.key !== "Home" && event.key !== "End")) return;
    const inputs = Array.from(event.currentTarget.querySelectorAll<HTMLInputElement>('input[type="radio"]:not(:disabled)'));
    const target = event.key === "Home" ? inputs[0] : inputs[inputs.length - 1];
    if (!target) return;
    event.preventDefault();
    target.focus();
    target.click();
  }

  $effect(() => trackModality());

  /* Svelte sets `checked` as a property only; mirror it into the attribute like the other targets */
  let root = $state<HTMLElement | null>(null);
  $effect(() => {
    const selected = current;
    root?.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((input) => { input.defaultChecked = input.value === selected; });
  });
  /* labels are never cut: options that do not fit scroll sideways, the selected one kept in view (segmented-control.logic.ts) */
  $effect(() => scrollSelected(root));
</script>

<SegmentGroup.Root
  bind:ref={root}
  {...data} data-slot="segmented-control"
  class={r.base({ class: className })}
  {style}
  {id}
  aria-label={ariaLabel}
  aria-labelledby={ariaLabelledby}
  orientation="horizontal"
  value={current}
  onValueChange={(details) => { if (details.value == null) return; value = details.value; onvaluechange?.(details.value); }}
  {disabled}
  {name}
  onkeydown={homeEnd}
>
  <SegmentGroup.Indicator data-slot="segmented-control-thumb" class={r.thumb()} />
  {#each opts as o (o.value)}
    <SegmentGroup.Item value={o.value} disabled={o.disabled} data-slot="segmented-control-option" class={r.option()}>
      {#if icon}{@render icon({ option: o })}{/if}
      <SegmentGroup.ItemText data-slot="segmented-control-label" class={r.label()}>{#if o.dot}<span data-slot="segmented-control-dot" class={r.dot({ tone: o.dot === true ? "none" : o.dot })} aria-hidden="true"></span>{/if}{o.label}{#if o.count != null}{" "}<Count>{o.count}</Count>{/if}</SegmentGroup.ItemText>
      <SegmentGroup.ItemHiddenInput data-slot="segmented-control-input" class={r.input()} />
    </SegmentGroup.Item>
  {/each}
</SegmentGroup.Root>
