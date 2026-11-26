<!-- A list of options laid in the page, single or multiple choice. Behaviour by Ark UI (Zag listbox). -->
<script lang="ts">
  import { Listbox as ArkListbox, createListCollection } from "@ark-ui/svelte/listbox";
  import Check from "phosphor-svelte/lib/CheckIcon";
  import type { Component } from "svelte";
  import { glide } from "../lib/glide";
  import { trackModality } from "../lib/modality";
  import { listbox } from "./listbox.recipe";

  export type ListboxItem = {
    value: string;
    label: string;
    /** One line after the label (an address, a cost): cut when the row is full, with a title. */
    description?: string;
    /** A leading icon: a Phosphor icon component (drawn bold). */
    icon?: Component<any>;
    /** At the row's end: a note, a count, or a status letter (M, A, D). */
    meta?: string;
    /** The meta's colour: a status letter in its tone (orange modified, green added, red deleted). Default neutral (ink-2). */
    metaTone?: "neutral" | "accent" | "green" | "orange" | "red";
    disabled?: boolean;
  };

  type Props = {
    /** Options in order. Strings are accepted as value = label. */
    items: ReadonlyArray<ListboxItem | string>;
    /** Two-way bindable: the selected values (one at most in single mode), <Listbox bind:value />. */
    value?: string[];
    onvaluechange?: (value: string[]) => void;
    /** single: one value, a click replaces it. multiple: a click adds or removes. */
    selectionMode?: "single" | "multiple";
    /** Visible label. Without one, pass aria-label. */
    label?: string;
    "aria-label"?: string;
    /** Row height: xs 24 · sm 28 (dense: editors) · md 32 · lg 36. */
    size?: "xs" | "sm" | "md" | "lg";
    /** card: a box in the page (default). flush: no box, the list is part of its pane (a change list, an explorer). */
    variant?: "card" | "flush";
    disabled?: boolean;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    items, value = $bindable([]), onvaluechange, selectionMode = "single", label, "aria-label": ariaLabel, size = "md", variant = "card", disabled = false,
    class: className, style, ...data
  }: Props = $props();

  const collection = $derived(
    createListCollection<ListboxItem>({ items: items.map((item) => (typeof item === "string" ? { value: item, label: item } : item)) }),
  );
  const r = $derived(listbox({ size, variant }));

  /* hovered or focused: the list shows its highlight */
  let hovered = $state(false);
  let focused = $state(false);
  const active = $derived(hovered || focused);

  /* The engine marks its highlighted row only while the list has keyboard focus, and its
   * highlightOnHover waits for its own record of a press or a key, so the pointer alone would never
   * move the one highlight. Here a mouse move over an enabled row makes it the engine's highlighted
   * value (unless the last input was a key: a list scrolled by the keyboard under a resting pointer
   * keeps its highlight), and the row carries data-highlighted while it is that value and the list is
   * hovered or holds focus: the glide follows it. */
  function onRowMove(event: PointerEvent, item: ListboxItem, api: { highlightedValue: string | null; highlightValue: (value: string) => void }) {
    if (event.pointerType !== "mouse" || item.disabled || api.highlightedValue === item.value) return;
    if (document.documentElement.dataset.fndnInput === "keyboard") return;
    api.highlightValue(item.value);
  }

  let content = $state<HTMLElement | null>(null);
  let highlight = $state<HTMLElement | null>(null);
  $effect(() => {
    trackModality();
    if (!content || !highlight) return;
    return glide(content, highlight, { rows: "[data-slot=listbox-item]", follow: "highlighted" });
  });
</script>

<ArkListbox.Root
  {...data} data-slot="listbox"
  class={r.base({ class: className })}
  {style}
  {collection}
  {value}
  onValueChange={(details) => { value = details.value; onvaluechange?.(details.value); }}
  {selectionMode}
  {disabled}
>
  {#if label}<ArkListbox.Label data-slot="listbox-label" class={r.label()}>{label}</ArkListbox.Label>{/if}
  <ArkListbox.Content
    bind:ref={content}
    data-slot="listbox-content"
    class={r.content()}
    aria-label={label ? undefined : ariaLabel}
    onpointerenter={() => (hovered = true)}
    onpointerleave={() => (hovered = false)}
    onfocusin={() => (focused = true)}
    onfocusout={() => (focused = false)}
  >
    <span bind:this={highlight} data-slot="listbox-highlight" class={r.highlight()} aria-hidden="true"></span>
    <ArkListbox.Context>
      {#snippet render(api)}
        {#each collection.items as item (item.value)}
          <ArkListbox.Item
            {item}
            data-slot="listbox-item"
            class={r.item()}
            data-highlighted={active && api().highlightedValue === item.value ? "" : undefined}
            onpointermove={(event: PointerEvent) => onRowMove(event, item, api())}
          >
            {#if item.icon}{@const Icon = item.icon}<span data-slot="listbox-item-icon" class={r.itemIcon()} aria-hidden="true"><Icon data-slot="icon" weight="bold" /></span>{/if}
            <ArkListbox.ItemText data-slot="listbox-item-text" class={r.itemText()}>{item.label}</ArkListbox.ItemText>
            {#if item.description}<span data-slot="listbox-item-description" class={r.itemDescription()} title={item.description}>{item.description}</span>{/if}
            {#if item.meta}<span data-slot="listbox-item-meta" class={r.itemMeta({ metaTone: item.metaTone })}>{item.meta}</span>{/if}
            <span data-slot="listbox-item-indicator" class={r.itemIndicator()} aria-hidden="true"><Check data-slot="icon" weight="bold" /></span>
          </ArkListbox.Item>
        {/each}
      {/snippet}
    </ArkListbox.Context>
  </ArkListbox.Content>
</ArkListbox.Root>
