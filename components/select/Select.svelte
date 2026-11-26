<!-- Pick one value from a list. Behaviour by Ark UI (Zag select). -->
<script lang="ts">
  import { Portal } from "@ark-ui/svelte/portal";
  import { Select as ArkSelect, createListCollection } from "@ark-ui/svelte/select";
  import CaretDown from "phosphor-svelte/lib/CaretDownIcon";
  import Check from "phosphor-svelte/lib/CheckIcon";
  import { glide } from "../lib/glide";
  import { trackModality } from "../lib/modality";
  import { select } from "./select.recipe";

  export type SelectItem = { value: string; label: string; meta?: string; disabled?: boolean };
  export type SelectPlacement = "bottom-start" | "bottom" | "bottom-end" | "top-start" | "top" | "top-end";

  type Props = {
    /** Options in order. Strings are accepted as value = label. */
    items: ReadonlyArray<SelectItem | string>;
    /** Two-way bindable: <Select bind:value /> */
    value?: string | null;
    onvaluechange?: (value: string | null) => void;
    onopenchange?: (open: boolean) => void;
    placeholder?: string;
    /** Visible label. Without one, pass aria-label. */
    label?: string;
    "aria-label"?: string;
    /** The shared control's sizes, dimensions only: xs 24px, sm 28px, md 32px, lg 36px. */
    size?: "xs" | "sm" | "md" | "lg";
    /** The look, at every size: outline (the form field, as wide as its container), subtle (the
     * inspector), ghost (reads as text until touched, sized to its value: the model picker). */
    variant?: "outline" | "subtle" | "ghost";
    disabled?: boolean;
    invalid?: boolean;
    /** Form field name; renders a hidden native select. */
    name?: string;
    placement?: SelectPlacement;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    items, value = $bindable(null), onvaluechange, onopenchange, placeholder = "Select", label, "aria-label": ariaLabel,
    size = "md", variant = "outline", disabled = false, invalid = false, name, placement = "bottom-start", class: className, style, ...data
  }: Props = $props();

  const collection = $derived(
    createListCollection<SelectItem>({ items: items.map((item) => (typeof item === "string" ? { value: item, label: item } : item)) }),
  );

  const r = $derived(select({ size, variant }));

  let content = $state<HTMLElement | null>(null);
  let highlight = $state<HTMLElement | null>(null);
  $effect(() => {
    trackModality();
    if (!content || !highlight) return;
    return glide(content, highlight, { rows: "[data-slot=select-item]", follow: "highlighted" });
  });
</script>

<ArkSelect.Root
  {...data} data-slot="select"
  class={r.base({ class: className })}
  {style}
  {collection}
  value={value == null ? [] : [value]}
  onValueChange={(details) => { value = details.value[0] ?? null; onvaluechange?.(value); }}
  onOpenChange={(details) => onopenchange?.(details.open)}
  disabled={disabled || items.length === 0}
  {invalid}
  {name}
  positioning={{ placement, gutter: 4 }}
>
  {#if label}<ArkSelect.Label data-slot="select-label" class={r.label()}>{label}</ArkSelect.Label>{/if}
  <ArkSelect.Control data-slot="select-control" class={r.control()}>
    <ArkSelect.Trigger data-slot="select-trigger" class={r.trigger()} aria-label={ariaLabel}>
      <ArkSelect.ValueText data-slot="select-value" class={r.value()} {placeholder} />
      <span data-slot="select-indicator" class={r.indicator()} aria-hidden="true"><CaretDown data-slot="icon" weight="bold" /></span>
    </ArkSelect.Trigger>
  </ArkSelect.Control>
  <Portal>
    <ArkSelect.Positioner data-slot="select-positioner" class={r.positioner()}>
      <ArkSelect.Content bind:ref={content} data-slot="select-content" class={r.content()}>
        <span bind:this={highlight} data-slot="select-highlight" class={r.highlight()} aria-hidden="true"></span>
        {#each collection.items as item (item.value)}
          <ArkSelect.Item {item} data-slot="select-item" class={r.item()}>
            <ArkSelect.ItemText data-slot="select-item-text" class={r.itemText()}>{item.label}</ArkSelect.ItemText>
            {#if item.meta}<span data-slot="select-item-meta" class={r.itemMeta()}>{item.meta}</span>{/if}
            <span data-slot="select-item-indicator" class={r.itemIndicator()} aria-hidden="true"><Check data-slot="icon" weight="bold" /></span>
          </ArkSelect.Item>
        {/each}
      </ArkSelect.Content>
    </ArkSelect.Positioner>
  </Portal>
  {#if name}<ArkSelect.HiddenSelect />{/if}
</ArkSelect.Root>
