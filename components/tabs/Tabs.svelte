<!-- Switch between views that share one place. Behaviour by Ark UI (Zag tabs). -->
<script lang="ts">
  import { Tabs as ArkTabs } from "@ark-ui/svelte/tabs";
  import CaretDown from "phosphor-svelte/lib/CaretDownIcon";
  import X from "phosphor-svelte/lib/XIcon";
  import { tick, untrack, type Component, type Snippet } from "svelte";
  import Button from "../button/Button.svelte";
  import { trackModality } from "../lib/modality";
  import Menu from "../menu/Menu.svelte";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import {
    afterFirstPaint, allTabsMenu, closeDelay, focusTab, focusTabSoon, holdsFocus, neighbourTab, placeIndicator, revealTab, revealTabSoon, tabsLabels, watchStrip,
    type TabsLabels as Labels,
  } from "./tabs.logic";
  import { tabs } from "./tabs.recipe";

  export type TabsLabels = Labels;

  export type TabsItem = {
    value: string; label?: string; content?: string; disabled?: boolean;
    /** Before the label: an icon component (a file icon, drawn with data-slot="icon") or an image URL (a favicon). */
    icon?: Component<any> | string;
    /** This tab has a close button and closes on Delete. Overrides the Tabs' `closable`. */
    closable?: boolean;
  };

  type Props = {
    /** Tabs in order, each with its panel content. Strings are accepted as value = label. */
    items: ReadonlyArray<TabsItem | string>;
    /** Two-way bindable: <Tabs bind:value />. Defaults to the first enabled tab. */
    value?: string;
    onvaluechange?: (value: string) => void;
    /** pill: selected tab on a filled pill (default; also document tabs). underline: ink bar under the selected tab. */
    variant?: "pill" | "underline";
    /** xs 24 · sm 28 (dense: editors, browsers) · md (default). Dimensions only. */
    size?: "xs" | "sm" | "md";
    /** pill or underline inside a card header: the strip fills the header's height, with no hairline of its own. */
    inHeader?: boolean;
    /** Wraps the list in the header part (data-slot="tabs-header") with this class added: the host's header row. */
    headerClass?: string;
    /** Attributes for the header row, so a host can mark it as its own part. */
    headerProps?: Record<string, string | undefined>;
    /** Parts after the list inside the header part (a path, a copy button). Implies the header part. */
    end?: Snippet;
    /** Every tab has a close button and closes on Delete (an item's own `closable` wins): document tabs,
     * whose title stops at 240px, cut at its end with its full text in the title. */
    closable?: boolean;
    /** A tab asks to close (its button, or Delete / Backspace on it). Remove it from `items`: when it
     * was selected, the next tab (else the previous) is already selected through onvaluechange. */
    onclose?: (value: string) => void;
    /** Verb of a close button's name, followed by the tab's text ("Close rate-limit.ts"). */
    closeLabel?: string;
    /** The root fills its container's height; the selected panel takes the rest and scrolls. */
    fill?: boolean;
    /** Name of the tab list. */
    "aria-label"?: string;
    /** The strings, for translation: allTabs, the name and tooltip of the button that lists every tab. */
    labels?: Partial<TabsLabels>;
    /** Content of a panel; defaults to the item's `content`. */
    panel?: Snippet<[{ item: TabsItem & { label: string } }]>;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    items, value = $bindable(), onvaluechange, variant = "pill", size = "md", inHeader = false, headerClass, headerProps, end, closable = false, onclose,
    closeLabel = "Close", fill = false, "aria-label": ariaLabel, labels, panel, class: className, style, ...data
  }: Props = $props();

  const opts = $derived(items.map((o) => (typeof o === "string" ? { value: o, label: o } : { label: o.value, ...o })));
  /* after mount: from then on an inserted closable tab opens its room (nothing plays on first paint) */
  let ready = $state(false);
  /* closable tabs closed by the pointer, while their room closes */
  let closing = $state<string[]>([]);
  const r = $derived(tabs({ variant, size, inHeader, fill, ready }));
  const current = $derived(value ?? opts.find((o) => !o.disabled)?.value);

  $effect(() => { trackModality(); return afterFirstPaint(() => { ready = true; }); });
  /* the indicator on the selected tab from the first paint (the engine measures a frame or more later) */
  let root = $state<HTMLElement | null>(null);
  $effect(() => { placeIndicator(root); revealTab(root, untrack(() => current), true); });
  /* more tabs than room: the edge fades and the all-tabs button (measured, never on a hidden list) */
  let overflow = $state(false);
  $effect(() => watchStrip(root, (over) => { overflow = over; }));
  const text = $derived(tabsLabels(labels));
  /* every tab in order, the selected one checked; picking one selects it (and scrolls it into view) */
  const moreItems = $derived(allTabsMenu(opts.filter((o) => !closing.includes(o.value)), current));
  /* a strip that scrolls keeps the selected tab in view (also when a tab is added and selected) */
  let seen: string | undefined;
  $effect(() => {
    const key = `${current}\u0000${opts.length}`;
    if (seen !== undefined && key !== seen) void tick().then(() => revealTabSoon(root, current));
    seen = key;
  });

  function select(next: string) { value = next; onvaluechange?.(next); }
  const canClose = (o: TabsItem) => o.closable ?? closable;
  function close(o: TabsItem, focus: boolean) {
    const next = neighbourTab(opts, o.value);
    if (current === o.value && next !== undefined) select(next);
    if (focus || holdsFocus(root, o.value)) focusTab(root, next);
    /* from the pointer the tab closes its room first (instant from the keyboard) */
    const wait = closeDelay(root, focus);
    if (wait === 0) { onclose?.(o.value); return; }
    closing = [...closing, o.value];
    setTimeout(() => { closing = closing.filter((v) => v !== o.value); onclose?.(o.value); }, wait);
  }
  function onTabKey(o: TabsItem, event: KeyboardEvent) {
    if ((event.key === "Delete" || event.key === "Backspace") && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
      event.preventDefault();
      close(o, true);
    }
  }
</script>

{#snippet list()}
  <ArkTabs.List data-slot="tabs-list" class={r.list()} aria-label={ariaLabel}>
    <ArkTabs.Indicator data-slot="tabs-indicator" class={r.indicator()} />
    {#each opts as o (o.value)}
      {#if canClose(o)}
        <div data-slot="tabs-tab" class={r.tab({ closing: closing.includes(o.value) })}>
          <ArkTabs.Trigger value={o.value} disabled={o.disabled} data-slot="tabs-trigger" class={r.trigger({ closable: true, closing: closing.includes(o.value) })} aria-keyshortcuts="Delete" onkeydown={(event: KeyboardEvent) => onTabKey(o, event)}>{#if o.icon}<span data-slot="tabs-icon" class={r.icon()} aria-hidden="true">{#if typeof o.icon === "string"}<img src={o.icon} alt="" />{:else}{@const Icon = o.icon}<Icon data-slot="icon" />{/if}</span>{/if}<span data-slot="tabs-label" class={r.label({ closable: true })} title={o.label}>{o.label}</span></ArkTabs.Trigger>
          <button type="button" data-slot="tabs-close" class={r.close()} tabindex="-1" aria-label={`${closeLabel} ${o.label ?? o.value}`} disabled={o.disabled} onpointerdown={(event) => event.preventDefault()} onclick={() => close(o, false)}><X data-slot="icon" weight="bold" aria-hidden="true" /></button>
        </div>
      {:else}
        <ArkTabs.Trigger value={o.value} disabled={o.disabled} data-slot="tabs-trigger" class={r.trigger({ closable: false })}>{#if o.icon}<span data-slot="tabs-icon" class={r.icon()} aria-hidden="true">{#if typeof o.icon === "string"}<img src={o.icon} alt="" />{:else}{@const Icon = o.icon}<Icon data-slot="icon" />{/if}</span>{/if}<span data-slot="tabs-label" class={r.label()} title={o.label}>{o.label}</span></ArkTabs.Trigger>
      {/if}
    {/each}
  </ArkTabs.List>
{/snippet}

{#snippet more()}
  {#if overflow}
    <Menu data-tabs="more" class={r.more()} placement="bottom-end" items={moreItems} onradiochange={(_name, next) => { select(next); focusTabSoon(root, next); }}>
      {#snippet trigger(menuProps)}
        <Tooltip content={text.allTabs} {...menuProps()}>
          {#snippet trigger(tipProps)}
            <Button {...tipProps()} data-tabs="more-trigger" class={r.moreTrigger()} variant="ghost" size={variant === "pill" ? "xs" : size} square muted aria-label={text.allTabs}>
              {#snippet icon()}<CaretDown data-slot="icon" weight="bold" />{/snippet}
            </Button>
          {/snippet}
        </Tooltip>
      {/snippet}
    </Menu>
  {/if}
{/snippet}

<ArkTabs.Root
  bind:ref={root}
  {...data} data-slot="tabs" class={r.base({ class: className })}
  {style}
  value={current}
  onValueChange={(details) => select(details.value)}
>
  {#if headerClass !== undefined || end}
    <div data-slot="tabs-header" {...headerProps} class={r.header({ class: headerClass })}>{@render list()}{@render more()}{@render end?.()}</div>
  {:else}
    {@render list()}
    {@render more()}
  {/if}
  {#each opts as o (o.value)}
    <ArkTabs.Content value={o.value} data-slot="tabs-content" class={r.content()}>{#if panel}{@render panel({ item: o })}{:else}{o.content}{/if}</ArkTabs.Content>
  {/each}
</ArkTabs.Root>
