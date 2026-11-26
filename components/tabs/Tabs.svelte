<!-- Switch between views that share one place. Behaviour by Ark UI (Zag tabs). -->
<script lang="ts">
  import { Tabs as ArkTabs } from "@ark-ui/svelte/tabs";
  import X from "phosphor-svelte/lib/XIcon";
  import { tick, untrack, type Component, type Snippet } from "svelte";
  import { trackModality } from "../lib/modality";
  import { afterFirstPaint, closeDelay, focusTab, holdsFocus, neighbourTab, placeIndicator, revealTab, revealTabSoon } from "./tabs.logic";
  import { tabs } from "./tabs.recipe";

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
    /** pill: selected tab on a filled pill (default). underline: ink bar under the selected tab.
     * attached: browser and editor tabs; the selected tab is the surface below it (--fndn-tabs-surface) and joins it. */
    variant?: "pill" | "underline" | "attached";
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
    /** Every tab has a close button and closes on Delete (an item's own `closable` wins). */
    closable?: boolean;
    /** A tab asks to close (its button, or Delete / Backspace on it). Remove it from `items`: when it
     * was selected, the next tab (else the previous) is already selected through onvaluechange. */
    onclose?: (value: string) => void;
    /** Verb of a close button's name, followed by the tab's text ("Close rate-limit.ts"). */
    closeLabel?: string;
    /** The root fills its container's height; the selected panel takes the rest and scrolls. */
    fill?: boolean;
    /** attached only. shrink (default, Chrome): tabs share the strip and shrink, labels cut with a title.
     * fit (VS Code): each tab as wide as its title, the strip scrolls. */
    tabSizing?: "shrink" | "fit";
    /** Name of the tab list. */
    "aria-label"?: string;
    /** Content of a panel; defaults to the item's `content`. */
    panel?: Snippet<[{ item: TabsItem & { label: string } }]>;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    items, value = $bindable(), onvaluechange, variant = "pill", size = "md", inHeader = false, headerClass, headerProps, end, closable = false, onclose,
    closeLabel = "Close", fill = false, tabSizing = "shrink", "aria-label": ariaLabel, panel, class: className, style, ...data
  }: Props = $props();

  const opts = $derived(items.map((o) => (typeof o === "string" ? { value: o, label: o } : { label: o.value, ...o })));
  /* after mount: from then on an inserted attached tab opens its room (nothing plays on first paint) */
  let ready = $state(false);
  /* attached tabs closed by the pointer, while their room closes */
  let closing = $state<string[]>([]);
  const r = $derived(tabs({ variant, size, inHeader, fill, tabSizing, ready }));
  const current = $derived(value ?? opts.find((o) => !o.disabled)?.value);

  $effect(() => { trackModality(); return afterFirstPaint(() => { ready = true; }); });
  /* the indicator on the selected tab from the first paint (the engine measures a frame or more later) */
  let root = $state<HTMLElement | null>(null);
  $effect(() => { placeIndicator(root); revealTab(root, untrack(() => current), true); });
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
    /* attached, from the pointer: the tab closes its room first (instant from the keyboard) */
    const wait = variant === "attached" ? closeDelay(root, focus) : 0;
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
          <ArkTabs.Trigger value={o.value} disabled={o.disabled} data-slot="tabs-trigger" class={r.trigger({ closable: true, closing: closing.includes(o.value) })} aria-keyshortcuts="Delete" onkeydown={(event: KeyboardEvent) => onTabKey(o, event)}>{#if o.icon}<span data-slot="tabs-icon" class={r.icon()} aria-hidden="true">{#if typeof o.icon === "string"}<img src={o.icon} alt="" />{:else}{@const Icon = o.icon}<Icon data-slot="icon" />{/if}</span>{/if}<span data-slot="tabs-label" class={r.label()} title={o.label}>{o.label}</span></ArkTabs.Trigger>
          <button type="button" data-slot="tabs-close" class={r.close()} tabindex="-1" aria-label={`${closeLabel} ${o.label ?? o.value}`} disabled={o.disabled} onpointerdown={(event) => event.preventDefault()} onclick={() => close(o, false)}><X data-slot="icon" weight="bold" aria-hidden="true" /></button>
        </div>
      {:else}
        <ArkTabs.Trigger value={o.value} disabled={o.disabled} data-slot="tabs-trigger" class={r.trigger({ closable: false })}>{#if o.icon}<span data-slot="tabs-icon" class={r.icon()} aria-hidden="true">{#if typeof o.icon === "string"}<img src={o.icon} alt="" />{:else}{@const Icon = o.icon}<Icon data-slot="icon" />{/if}</span>{/if}<span data-slot="tabs-label" class={r.label()} title={o.label}>{o.label}</span></ArkTabs.Trigger>
      {/if}
    {/each}
  </ArkTabs.List>
{/snippet}

<ArkTabs.Root
  bind:ref={root}
  {...data} data-slot="tabs" class={r.base({ class: className })}
  {style}
  value={current}
  onValueChange={(details) => select(details.value)}
>
  {#if headerClass !== undefined || end}
    <div data-slot="tabs-header" {...headerProps} class={r.header({ class: headerClass })}>{@render list()}{@render end?.()}</div>
  {:else}
    {@render list()}
  {/if}
  {#each opts as o (o.value)}
    <ArkTabs.Content value={o.value} data-slot="tabs-content" class={r.content()}>{#if panel}{@render panel({ item: o })}{:else}{o.content}{/if}</ArkTabs.Content>
  {/each}
</ArkTabs.Root>
