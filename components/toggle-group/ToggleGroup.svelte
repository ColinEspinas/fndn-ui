<!-- A row of Toggles, one or several pressed. Behaviour by Ark UI (Zag toggle-group). -->
<script lang="ts">
  import { ToggleGroup as ArkToggleGroup } from "@ark-ui/svelte/toggle-group";
  import { mergeProps } from "@ark-ui/svelte/utils";
  import type { Component } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import { toggle } from "../toggle/toggle.recipe";
  import { toggleGroup } from "./toggle-group.recipe";
  import { trackModality } from "../lib/modality";
  import { truncationTitles } from "../lib/truncate";

  export type ToggleGroupItem = {
    value: string;
    /** Text of the item. With `square` it is not shown: it names the item and is its tooltip. */
    label?: string;
    /** Icon component, e.g. TextBIcon (rendered bold, data-slot="icon"). */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon?: Component<any>;
    /** Tooltip text; a square item uses its label when this is left out. */
    tooltip?: string;
    disabled?: boolean;
  };

  type Props = {
    /** The toggles, in order. Strings are accepted as value = label. */
    items: ReadonlyArray<string | ToggleGroupItem>;
    /** Two-way bindable: the pressed values, <ToggleGroup bind:value />. */
    value?: string[];
    onvaluechange?: (value: string[]) => void;
    /** Several may be pressed at once (bold + italic). Otherwise one at most (alignment). */
    multiple?: boolean;
    /** One at most: a click on the pressed item releases it. */
    deselectable?: boolean;
    /** The Toggle's looks. */
    variant?: "outline" | "ghost";
    /** The Toggle's sizes, the one control scale: xs 24px, sm 28px, md 32px, lg 36px. */
    size?: "xs" | "sm" | "md" | "lg";
    /** Radius only: pill or rounded. Left out, the app's shape (a pill, or rounded in a rounded app: "shape": "rounded" in the project's fndn.json). */
    shape?: "pill" | "rounded";
    /** Icon-only items: as wide as they are tall, named and tipped by their labels. */
    square?: boolean;
    /** ink-3 at rest, ink when hovered, held down or pressed. */
    muted?: boolean;
    orientation?: "horizontal" | "vertical";
    disabled?: boolean;
    /** Name of the group (role=group, or radiogroup when one at most). */
    "aria-label"?: string;
    id?: string;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    items, value = $bindable([]), onvaluechange, multiple, deselectable, variant = "outline", size = "md", shape, square, muted,
    orientation = "horizontal", disabled, class: className, ...rest
  }: Props = $props();

  const list = $derived(items.map((i): ToggleGroupItem => (typeof i === "string" ? { value: i, label: i } : i)));
  const r = $derived(toggleGroup({ orientation, muted: !!muted, variant }));
  const t = $derived(toggle({ variant, size, shape, square: !!square, muted: !!muted }));
  /* square: the icon alone shows, the label names the item and is its tooltip (an item without an
   * icon still shows its label, named by its tooltip when it has one) */
  const iconOnly = (item: ToggleGroupItem) => !!square && item.icon != null;
  const tip = (item: ToggleGroupItem) => item.tooltip ?? (iconOnly(item) ? item.label : undefined);
  const named = (item: ToggleGroupItem) => {
    const name = square ? (item.tooltip ?? (iconOnly(item) ? item.label : undefined)) : undefined;
    return name ? { "aria-label": name } : {};
  };

  /* a label cut by its ellipsis carries its full text as a title */
  let root = $state<HTMLElement | null>(null);
  $effect(() => truncationTitles(root, "[data-slot=toggle-group-label]"));
  $effect(() => trackModality());
</script>

{#snippet item(entry: ToggleGroupItem, extra: () => HTMLButtonAttributes)}
  <!-- the engine's props, ours, then the tooltip's on top: the order of React's as-child -->
  <ArkToggleGroup.Item value={entry.value} disabled={entry.disabled}>
    {#snippet asChild(itemProps)}
      <button {...mergeProps(itemProps(), named(entry), extra())} data-slot="toggle-group-item" class={t.base({ class: r.item() })}>
        {#if entry.icon}<span data-slot="toggle-group-icon" class={t.icon({ class: r.icon() })} aria-hidden="true"><entry.icon data-slot="icon" weight="bold" /></span>{/if}
        {#if !iconOnly(entry) && entry.label}<span data-slot="toggle-group-label" class={t.label({ class: r.label() })}>{entry.label}</span>{/if}
      </button>
    {/snippet}
  </ArkToggleGroup.Item>
{/snippet}

<ArkToggleGroup.Root
  bind:ref={root}
  data-slot="toggle-group"
  class={r.base({ class: className })}
  bind:value
  onValueChange={(d: { value: string[] }) => onvaluechange?.(d.value)}
  {multiple}
  {deselectable}
  {orientation}
  {disabled}
  {...rest}
>
  {#each list as entry (entry.value)}
    {@const text = tip(entry)}
    {#if text}
      <Tooltip content={text}>
        {#snippet trigger(tipProps)}{@render item(entry, tipProps)}{/snippet}
      </Tooltip>
    {:else}
      {@render item(entry, () => ({}))}
    {/if}
  {/each}
</ArkToggleGroup.Root>
