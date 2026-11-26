<!-- A disclosure: a trigger and a region that reveals under it. Behaviour by Ark UI (Zag collapsible). -->
<script lang="ts">
  import { Collapsible as ArkCollapsible } from "@ark-ui/svelte/collapsible";
  import CaretRight from "phosphor-svelte/lib/CaretRightIcon";
  import type { Snippet } from "svelte";
  import { collapsible } from "./collapsible.recipe";
  import { trackModality } from "../lib/modality";
  import { truncationTitles } from "../lib/truncate";

  type Props = {
    /** Two-way bindable: <Collapsible bind:open /> */
    open?: boolean;
    onopenchange?: (open: boolean) => void;
    disabled?: boolean;
    /** row: a whole row is the trigger. inline: a text-sized header on the text line. section: a quiet section header. */
    variant?: "row" | "inline" | "section";
    /** Where the caret sits in the trigger. */
    caret?: "start" | "end" | "none";
    /** The trigger's content: text, or a snippet. */
    label?: string | Snippet;
    /** Trailing muted note in the trigger. */
    meta?: string;
    /** Plain detail text, inset like the trigger. */
    detail?: string;
    /** The region's content (after the detail text). */
    children?: Snippet;
    /** A closed region stays laid out at zero height (invisible, out of the tab order) instead of
     * display: none, so entrances inside it do not replay when it reopens. */
    keepLayout?: boolean;
    /** A class added to the trigger (a host's hook). */
    triggerClass?: string;
    /** A class added to the label part (a host's hook). */
    labelClass?: string;
    class?: string;
    style?: string;
    /** data-* attributes land on the root (a host marks it as one of its parts). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    open = $bindable(false), onopenchange, disabled = false, variant = "row", caret = "end", label, meta, detail, children, keepLayout = false, triggerClass, labelClass,
    class: className, style, ...data
  }: Props = $props();

  const r = $derived(collapsible({ variant }));

  $effect(() => trackModality());

  /* a label cut by its ellipsis carries its full text as a title (inline, section: a row's label
   * wraps, so nothing is cut) */
  let labelEl = $state<HTMLElement | null>(null);
  $effect(() => (variant === "row" ? undefined : truncationTitles(labelEl)));
</script>

{#snippet caretEl()}<span data-slot="collapsible-caret" class={r.caret()} aria-hidden="true"><CaretRight data-slot="icon" weight="bold" /></span>{/snippet}

<ArkCollapsible.Root
  {...data}
  data-slot="collapsible" class={r.base({ class: className })}
  {style}
  data-keep-layout={keepLayout ? "" : undefined}
  {open}
  {disabled}
  onOpenChange={(details) => { open = details.open; onopenchange?.(details.open); }}
>
  <ArkCollapsible.Trigger data-slot="collapsible-trigger" class={r.trigger({ class: triggerClass })}>
    {#if caret === "start"}{@render caretEl()}{/if}
    <span bind:this={labelEl} data-slot="collapsible-label" class={r.label({ class: labelClass })}>{#if typeof label === "function"}{@render label()}{:else}{label ?? ""}{/if}</span>
    {#if meta}<span data-slot="collapsible-meta" class={r.meta()}>{meta}</span>{/if}
    {#if caret === "end"}{@render caretEl()}{/if}
  </ArkCollapsible.Trigger>
  <ArkCollapsible.Content data-slot="collapsible-content" class={r.content()}>
    <div data-slot="collapsible-body" class={r.body()}>
      {#if detail}<p data-slot="collapsible-text" class={r.text()}>{detail}</p>{/if}
      {@render children?.()}
    </div>
  </ArkCollapsible.Content>
</ArkCollapsible.Root>
