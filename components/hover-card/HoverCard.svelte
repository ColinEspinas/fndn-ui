<!-- A preview surface that opens on hover or focus. Behaviour by Ark UI (Zag hover-card). -->
<script lang="ts">
  import { HoverCard as ArkHoverCard } from "@ark-ui/svelte/hover-card";
  import { Portal } from "@ark-ui/svelte/portal";
  import { untrack, type Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { hoverCard } from "./hover-card.recipe";
  import { trackModality } from "../lib/modality";
  import { looksLikePath, middleTruncation } from "../lib/truncate";

  export type HoverCardPlacement = "top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "right";
  /** One preformatted line of a preview; add and del lines are tinted and signed. */
  export type HoverCardLine = { text: string; tone?: "ctx" | "add" | "del" };

  type Props = {
    /** Two-way bindable: <HoverCard bind:open /> */
    open?: boolean;
    onopenchange?: (open: boolean) => void;
    /** Header text, e.g. a file name. */
    title?: string;
    /** Lines added / removed, shown in the header. */
    add?: number;
    del?: number;
    /** Preformatted lines, e.g. a file diff. */
    lines?: ReadonlyArray<HoverCardLine>;
    placement?: HoverCardPlacement;
    openDelay?: number;
    closeDelay?: number;
    /** Your own trigger. The snippet receives a function returning the props to spread on your element. */
    trigger?: Snippet<[() => HTMLButtonAttributes]>;
    /** Renders the default mono chip trigger with this label when no `trigger` is given. */
    triggerLabel?: string;
    /** Body content. */
    children?: Snippet;
    class?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    open = $bindable(false), onopenchange, title, add, del, lines, placement = "bottom-start", openDelay = 500, closeDelay = 150,
    trigger, triggerLabel, children, class: className, ...data
  }: Props = $props();

  const r = hoverCard();
  const SIGN = { ctx: " ", add: "+", del: "−" } as const;
  const hasMeta = $derived(add !== undefined || del !== undefined);
  $effect(() => trackModality());
  /* open when it mounted: drawn at once (the recipe skips the entrance) until it first closes */
  let mountedOpen = $state(untrack(() => open));
  $effect.pre(() => { if (!open) mountedOpen = false; });
  /* the default trigger, when it names a file, is cut in the middle (full text in title) */
  let wrap = $state<HTMLElement | null>(null);
  $effect(() => (trigger ? undefined : middleTruncation(wrap, ":scope > [data-slot=hover-card-trigger]", { when: looksLikePath })));
</script>

<div bind:this={wrap} {...data} data-slot="hover-card" class={r.base({ class: className })}>
  <ArkHoverCard.Root
    {open}
    {openDelay}
    {closeDelay}
    onOpenChange={(details) => { open = details.open; onopenchange?.(details.open); }}
    positioning={{ placement, gutter: 6 }}
  >
    <ArkHoverCard.Trigger>
      {#snippet asChild(props)}
        {#if trigger}{@render trigger(props)}{:else}<button {...props()} type="button" data-slot="hover-card-trigger" class={r.trigger()}>{triggerLabel}</button>{/if}
      {/snippet}
    </ArkHoverCard.Trigger>
    <Portal>
      <ArkHoverCard.Positioner data-slot="hover-card-positioner" class={r.positioner()}>
        <ArkHoverCard.Content data-slot="hover-card-content" data-mounted-open={mountedOpen ? "" : undefined} class={r.content()}>
          {#if title || hasMeta}
            <div data-slot="hover-card-header" class={r.header()}>
              {#if title}<span data-slot="hover-card-title" class={r.title()}>{title}</span>{/if}
              {#if hasMeta}<span data-slot="hover-card-meta" class={r.meta()}>{#if add !== undefined}<span data-slot="hover-card-add" class={r.add()}>+{add.toLocaleString()}</span>{/if}{#if del !== undefined}<span data-slot="hover-card-del" class={r.del()}>−{del.toLocaleString()}</span>{/if}</span>{/if}
            </div>
          {/if}
          {#if lines && lines.length}
            <div data-slot="hover-card-lines" class={r.lines()}>
              {#each lines as line, i (i)}
                <div data-slot="hover-card-line" class={r.line({ tone: line.tone ?? "ctx" })}>
                  <span data-slot="hover-card-sign" class={r.sign()}>{SIGN[line.tone ?? "ctx"]}</span>
                  <span data-slot="hover-card-text" class={r.text()}>{line.text}</span>
                </div>
              {/each}
            </div>
          {/if}
          {#if children}<div data-slot="hover-card-body" class={r.body()}>{@render children()}</div>{/if}
        </ArkHoverCard.Content>
      </ArkHoverCard.Positioner>
    </Portal>
  </ArkHoverCard.Root>
</div>
