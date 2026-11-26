<!-- A small raised surface anchored to its trigger. Behaviour by Ark UI (Zag popover). -->
<script lang="ts">
  import { Popover as ArkPopover } from "@ark-ui/svelte/popover";
  import { Portal } from "@ark-ui/svelte/portal";
  import X from "phosphor-svelte/lib/XIcon";
  import { untrack, type Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { mergeProps } from "@ark-ui/svelte/utils";
  import Button from "../button/Button.svelte";
  import { popover } from "./popover.recipe";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import { trackModality } from "../lib/modality";

  export type PopoverPlacement = "top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "right";

  type Props = {
    /** Two-way bindable: <Popover bind:open /> */
    open?: boolean;
    onopenchange?: (open: boolean) => void;
    title?: string;
    description?: string;
    /** Show the close button in the header. */
    closable?: boolean;
    placement?: PopoverPlacement;
    /** Your own trigger. The snippet receives a function returning the props to spread on your element. */
    trigger?: Snippet<[() => HTMLButtonAttributes]>;
    /** Renders a default Button trigger with this label when no `trigger` is given. */
    triggerLabel?: string;
    /** Body content. */
    children?: Snippet;
    class?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    open = $bindable(false), onopenchange, title, description, closable = true, placement = "bottom-start",
    trigger, triggerLabel, children, class: className, ...data
  }: Props = $props();

  const r = popover();
  $effect(() => trackModality());
  /* open when it mounted: drawn at once (the recipe skips the entrance) until it first closes */
  let mountedOpen = $state(untrack(() => open));
  $effect.pre(() => { if (!open) mountedOpen = false; });
</script>

<div {...data} data-slot="popover" class={r.base({ class: className })}>
  <ArkPopover.Root
    {open}
    onOpenChange={(details) => { open = details.open; onopenchange?.(details.open); }}
    positioning={{ placement, gutter: 6 }}
  >
    {#if trigger}
      <ArkPopover.Trigger>
        {#snippet asChild(props)}{@render trigger(props)}{/snippet}
      </ArkPopover.Trigger>
    {:else}
      <ArkPopover.Trigger>
        {#snippet asChild(props)}<Button {...props()} data-popover="trigger" class={r.trigger()} variant="outline" size="sm">{triggerLabel}</Button>{/snippet}
      </ArkPopover.Trigger>
    {/if}
    <Portal>
      <ArkPopover.Positioner data-slot="popover-positioner" class={r.positioner()}>
        <ArkPopover.Content data-slot="popover-content" data-mounted-open={mountedOpen ? "" : undefined} class={r.content()}>
          {#if title || closable}
            <div data-slot="popover-header" class={r.header()}>
              {#if title}<ArkPopover.Title data-slot="popover-title" class={r.title()}>{title}</ArkPopover.Title>{/if}
              {#if closable}
                <!-- the close trigger owns the button (its data-scope and data-part); the tooltip adds itself -->
                <ArkPopover.CloseTrigger>
                  {#snippet asChild(closeProps)}
                    <Tooltip content="Close" triggerId={closeProps().id ?? undefined}>
                      {#snippet trigger(tip)}
                        <Button {...mergeProps(tip(), closeProps())} variant="ghost" size="xs" shape="rounded" square muted aria-label="Close" data-popover="close" class={r.close()}>
                          {#snippet icon()}<X data-slot="icon" weight="bold" />{/snippet}
                        </Button>
                      {/snippet}
                    </Tooltip>
                  {/snippet}
                </ArkPopover.CloseTrigger>
              {/if}
            </div>
          {/if}
          {#if description}<ArkPopover.Description data-slot="popover-description" class={r.description()}>{description}</ArkPopover.Description>{/if}
          {#if children}<div data-slot="popover-body" class={r.body()}>{@render children()}</div>{/if}
        </ArkPopover.Content>
      </ArkPopover.Positioner>
    </Portal>
  </ArkPopover.Root>
</div>
