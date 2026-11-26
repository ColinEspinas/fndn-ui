<!-- A select you can type into: the list is filtered by the text. Behaviour by Ark UI (Zag combobox). -->
<script lang="ts">
  import { Combobox as ArkCombobox, createListCollection } from "@ark-ui/svelte/combobox";
  import { Portal } from "@ark-ui/svelte/portal";
  import CaretDown from "phosphor-svelte/lib/CaretDownIcon";
  import Check from "phosphor-svelte/lib/CheckIcon";
  import type { Component, Snippet } from "svelte";
  import Button from "../button/Button.svelte";
  import { glide } from "../lib/glide";
  import { trackModality } from "../lib/modality";
  import { truncationTitles } from "../lib/truncate";
  import { matchParts } from "./combobox.logic";
  import { combobox } from "./combobox.recipe";

  export type ComboboxItem = {
    value: string;
    label: string;
    /** A leading icon: a Phosphor icon component (drawn bold), or a component drawing a 14px image (a favicon). */
    icon?: Component<any>;
    meta?: string;
    disabled?: boolean;
    /** Other words that find this option (an ISO code, a city, a former name); never shown. */
    keywords?: ReadonlyArray<string>;
  };
  export type ComboboxPlacement = "bottom-start" | "bottom" | "bottom-end" | "top-start" | "top" | "top-end";

  type Props = {
    /** Options in order. Strings are accepted as value = label. */
    items: ReadonlyArray<ComboboxItem | string>;
    /** Two-way bindable: <Combobox bind:value /> */
    value?: string | null;
    onvaluechange?: (value: string | null) => void;
    onopenchange?: (open: boolean) => void;
    /** Called with the text in the field as the user types. */
    oninputvaluechange?: (text: string) => void;
    placeholder?: string;
    /** Visible label. Without one, pass aria-label. */
    label?: string;
    "aria-label"?: string;
    /** Before the text, inside the field: an icon, an avatar or a status (a snippet), or text. */
    start?: Snippet | string;
    /** After the text, inside the field, before the caret: a star, a status, a count. A control inside it keeps its own press. */
    end?: Snippet | string;
    /** The caret button at the end. false: the field opens its list by typing, a click or the arrow keys only. */
    caret?: boolean;
    /** The part of each label that matches what was typed stays in ink, the rest dims (Chrome's suggestions). */
    highlightMatch?: boolean;
    /** Enter with no option highlighted keeps what was typed as the value (onvaluechange fires with the text). */
    allowCustomValue?: boolean;
    /** Shown in the list when nothing matches. */
    emptyText?: string;
    /** aria-label of the caret button. */
    triggerLabel?: string;
    /** The shared control's sizes, dimensions only: xs 24px, sm 28px, md 32px, lg 36px. */
    size?: "xs" | "sm" | "md" | "lg";
    /** The look, at every size: outline (the form field), subtle (the inspector), ghost (nothing until touched). */
    variant?: "outline" | "subtle" | "ghost";
    disabled?: boolean;
    invalid?: boolean;
    /** Form field name; the input carries it. */
    name?: string;
    placement?: ComboboxPlacement;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    items, value = $bindable(null), onvaluechange, onopenchange, oninputvaluechange, placeholder = "Search", label, "aria-label": ariaLabel, start, end,
    caret = true, highlightMatch = false, allowCustomValue = false, emptyText = "No results", triggerLabel = "Show options", size = "md", variant = "outline", disabled = false, invalid = false, name, placement = "bottom-start",
    class: className, style, ...data
  }: Props = $props();

  const all = $derived.by(() => {
    const list = items.map((item): ComboboxItem => (typeof item === "string" ? { value: item, label: item } : item));
    /* free text that was kept is an option of its own, so the field and the list show it */
    if (allowCustomValue && value && !list.some((item) => item.value === value)) list.push({ value, label: value });
    return list;
  });
  /* the list filters on what the user typed, not on the label a selection writes into the field:
   * reopened after a choice, it shows every option again. A query matches the label or a keyword */
  let query = $state("");
  const collection = $derived.by(() => {
    const needle = query.trim().toLowerCase();
    const matches = (item: ComboboxItem) => item.label.toLowerCase().includes(needle) || !!item.keywords?.some((word) => word.toLowerCase().includes(needle));
    return createListCollection<ComboboxItem>({ items: needle ? all.filter(matches) : all });
  });
  const hasStart = $derived(start != null && start !== "");
  const r = $derived(combobox({ size, variant, start: hasStart, end: end != null && end !== "", caret }));

  const choose = (next: string | null) => { value = next; onvaluechange?.(value); };
  /* free text: Enter with no option highlighted keeps what was typed. Runs before the engine's
   * Enter (capture), which would put back the chosen label; an exact match of an option (a
   * disabled one too) is never kept as text */
  function keepTyped(event: KeyboardEvent, close: () => void) {
    if (!allowCustomValue || event.key !== "Enter" || event.isComposing) return;
    const input = event.currentTarget as HTMLInputElement;
    const text = input.value.trim();
    if (!text || input.hasAttribute("aria-activedescendant")) return;
    if (all.some((item) => item.label.toLowerCase() === text.toLowerCase())) return;
    event.preventDefault();
    choose(text);
    close();
  }
  /* a press on the start or end part (or the control's own padding) is a press in the field: focus,
   * then the field's click, which opens the list. A control inside them keeps its own press */
  function inField(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target !== event.currentTarget && (!target.closest("[data-slot=combobox-start], [data-slot=combobox-end]") || target.closest("a, button, input, select, textarea, [tabindex]"))) return null;
    return (event.currentTarget as HTMLElement).querySelector<HTMLInputElement>("[data-slot=combobox-input]");
  }
  function pressDown(event: MouseEvent) {
    const input = inField(event);
    if (!input) return;
    event.preventDefault();
    input.focus();
  }
  function pressUp(event: MouseEvent) {
    inField(event)?.click();
  }
  /* start text cut by its ellipsis carries its full text as a title */
  let control = $state<HTMLElement | null>(null);
  $effect(() => truncationTitles(control, "[data-slot=combobox-start]"));

  let content = $state<HTMLElement | null>(null);
  let highlight = $state<HTMLElement | null>(null);
  $effect(() => {
    trackModality();
    if (!content || !highlight) return;
    return glide(content, highlight, { rows: "[data-slot=combobox-item]", follow: "highlighted" });
  });
</script>

<ArkCombobox.Root
  {...data} data-slot="combobox"
  class={r.base({ class: className })}
  {style}
  {collection}
  value={value == null ? [] : [value]}
  onValueChange={(details) => choose(details.value[0] ?? null)}
  onInputValueChange={(details) => {
    if (details.reason === "input-change") query = details.inputValue;
    oninputvaluechange?.(details.inputValue);
  }}
  onOpenChange={(details) => {
    /* the query is dropped when the list next opens (by anything but typing), not when it closes:
       a closing list keeps the options it shows while it fades, it does not fill up again */
    if (details.open && details.reason !== "input-change") query = "";
    onopenchange?.(details.open);
  }}
  disabled={disabled || items.length === 0}
  {invalid}
  {name}
  {placeholder}
  openOnClick
  inputBehavior="autohighlight"
  positioning={{ placement, gutter: 4, sameWidth: false }}
>
  {#if label}<ArkCombobox.Label data-slot="combobox-label" class={r.label()}>{label}</ArkCombobox.Label>{/if}
  <ArkCombobox.Context>
    {#snippet render(api)}
      <ArkCombobox.Control bind:ref={control} data-slot="combobox-control" class={r.control()} onmousedown={pressDown} onclick={pressUp}>
        {#if hasStart}<span data-slot="combobox-start" class={r.start()}>{#if typeof start === "string"}{start}{:else}{@render start?.()}{/if}</span>{/if}
        <ArkCombobox.Input data-slot="combobox-input" class={r.input()} aria-label={ariaLabel} dir="auto" onkeydowncapture={(event: KeyboardEvent) => keepTyped(event, () => api().setOpen(false))} />
        {#if end != null && end !== ""}<span data-slot="combobox-end" class={r.end()}>{#if typeof end === "string"}{end}{:else}{@render end()}{/if}</span>{/if}
        {#if caret}
          <ArkCombobox.Trigger>
            {#snippet asChild(triggerProps)}
              <Button {...triggerProps()} aria-label={triggerLabel} data-combobox="trigger" class={r.trigger()} variant="ghost" size="xs" square muted>
                {#snippet icon()}<span data-slot="combobox-indicator" class={r.indicator()}><CaretDown data-slot="icon" weight="bold" /></span>{/snippet}
              </Button>
            {/snippet}
          </ArkCombobox.Trigger>
        {/if}
      </ArkCombobox.Control>
    {/snippet}
  </ArkCombobox.Context>
  <Portal>
    <ArkCombobox.Positioner data-slot="combobox-positioner" class={r.positioner()}>
      <ArkCombobox.Content bind:ref={content} data-slot="combobox-content" class={r.content()}>
        <span bind:this={highlight} data-slot="combobox-highlight" class={r.highlight()} aria-hidden="true"></span>
        {#each collection.items as item (item.value)}
          <ArkCombobox.Item {item} data-slot="combobox-item" class={r.item()}>
            {@const parts = highlightMatch ? matchParts(item.label, query) : null}
            {#if item.icon}{@const Icon = item.icon}<span data-slot="combobox-item-icon" class={r.itemIcon()} aria-hidden="true"><Icon data-slot="icon" weight="bold" /></span>{/if}
            <ArkCombobox.ItemText data-slot="combobox-item-text" class={r.itemText({ matching: !!parts })}>{#if parts}{parts[0]}<span data-slot="combobox-item-match" class={r.itemMatch()}>{parts[1]}</span>{parts[2]}{:else}{item.label}{/if}</ArkCombobox.ItemText>
            {#if item.meta}<span data-slot="combobox-item-meta" class={r.itemMeta()}>{item.meta}</span>{/if}
            <span data-slot="combobox-item-indicator" class={r.itemIndicator()} aria-hidden="true"><Check data-slot="icon" weight="bold" /></span>
          </ArkCombobox.Item>
        {/each}
        <ArkCombobox.Empty data-slot="combobox-empty" class={r.empty()}>{emptyText}</ArkCombobox.Empty>
      </ArkCombobox.Content>
    </ArkCombobox.Positioner>
  </Portal>
</ArkCombobox.Root>
