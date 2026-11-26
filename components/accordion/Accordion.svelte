<!-- A stack of disclosures, one open at a time unless multiple. Behaviour by Ark UI (Zag accordion). -->
<script lang="ts">
  import { Accordion as ArkAccordion } from "@ark-ui/svelte/accordion";
  import CaretRight from "phosphor-svelte/lib/CaretRightIcon";
  import type { Snippet } from "svelte";
  import { accordion } from "./accordion.recipe";
  import { trackModality } from "../lib/modality";

  export type AccordionItem = {
    value: string;
    /** The trigger's text. */
    label: string;
    /** Trailing muted note in the trigger. */
    meta?: string;
    /** Plain detail text in the region, inset like the label. */
    detail?: string;
    disabled?: boolean;
  };

  type Props = {
    items: ReadonlyArray<AccordionItem>;
    /** Two-way bindable: <Accordion bind:value />, the values of the open items. */
    value?: string[];
    onvaluechange?: (value: string[]) => void;
    /** Several items may be open at once. */
    multiple?: boolean;
    /** The open item closes when its trigger is pressed again (default true). */
    collapsible?: boolean;
    /** plain: rows on the page. card: the rows in one surface card. */
    variant?: "plain" | "card";
    /** Where the caret sits in each trigger. */
    caret?: "start" | "end";
    disabled?: boolean;
    /** Free content in an item's region, after its detail text (receives the item). */
    content?: Snippet<[AccordionItem]>;
    class?: string;
    style?: string;
    /** data-* attributes land on the root (a host marks it as one of its parts). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    items, value = $bindable([]), onvaluechange, multiple = false, collapsible = true, variant = "plain", caret = "end", disabled = false, content, class: className, style, ...data
  }: Props = $props();

  $effect(() => trackModality());
  const r = $derived(accordion({ variant }));
</script>

{#snippet caretEl()}<span data-slot="accordion-caret" class={r.caret()} aria-hidden="true"><CaretRight data-slot="icon" weight="bold" /></span>{/snippet}

<ArkAccordion.Root
  {...data}
  data-slot="accordion"
  class={r.base({ class: className })}
  {style}
  {value}
  {multiple}
  {collapsible}
  {disabled}
  onValueChange={(details) => { value = details.value; onvaluechange?.(details.value); }}
>
  {#each items as item (item.value)}
    <ArkAccordion.Item value={item.value} disabled={item.disabled} data-slot="accordion-item" class={r.item()}>
      <ArkAccordion.ItemTrigger data-slot="accordion-trigger" class={r.trigger()}>
        {#if caret === "start"}{@render caretEl()}{/if}
        <span data-slot="accordion-label" class={r.label()}>{item.label}</span>
        {#if item.meta}<span data-slot="accordion-meta" class={r.meta()}>{item.meta}</span>{/if}
        {#if caret === "end"}{@render caretEl()}{/if}
      </ArkAccordion.ItemTrigger>
      <ArkAccordion.ItemContent data-slot="accordion-content" class={r.content()}>
        <div data-slot="accordion-body" class={r.body()}>
          {#if item.detail}<p data-slot="accordion-text" class={r.text()}>{item.detail}</p>{/if}
          {@render content?.(item)}
        </div>
      </ArkAccordion.ItemContent>
    </ArkAccordion.Item>
  {/each}
</ArkAccordion.Root>
