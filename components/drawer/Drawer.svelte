<!-- A sheet that slides in from an edge and is dragged away. Behaviour by Ark UI (Zag drawer). -->
<script lang="ts">
  import { Drawer as ArkDrawer } from "@ark-ui/svelte/drawer";
  import { Portal } from "@ark-ui/svelte/portal";
  import { mergeProps } from "@ark-ui/svelte/utils";
  import X from "phosphor-svelte/lib/XIcon";
  import { untrack, type Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import Button from "../button/Button.svelte";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import { trackModality } from "../lib/modality";
  import { drawer } from "./drawer.recipe";

  export type DrawerSide = "bottom" | "end" | "start";
  export type DrawerActionVariant = "primary" | "outline" | "secondary" | "accent" | "success" | "danger" | "danger-outline" | "ghost";
  export type DrawerAction = {
    label: string;
    /** Passed to onaction. Defaults to the label. */
    value?: string;
    variant?: DrawerActionVariant;
    /** false keeps the sheet open after the press. */
    close?: boolean;
  };

  type Props = {
    /** Two-way bindable: <Drawer bind:open /> */
    open?: boolean;
    onopenchange?: (open: boolean) => void;
    /** The edge it slides from and is dragged back to: bottom (default), end, start. */
    side?: DrawerSide;
    /** Names the sheet. Required. */
    title: string;
    description?: string;
    /** Footer Buttons in order, least destructive first. */
    actions?: ReadonlyArray<DrawerAction>;
    onaction?: (value: string) => void;
    /** Custom footer instead of `actions`. */
    footer?: Snippet;
    /** Show the close button in the header. */
    closable?: boolean;
    /** Your own trigger. The snippet receives a function returning the props to spread on your element. */
    trigger?: Snippet<[() => HTMLButtonAttributes]>;
    /** Renders a default Button trigger with this label when no `trigger` is given. */
    triggerLabel?: string;
    /** Body content. */
    children?: Snippet;
    class?: string;
    [data: `data-${string}`]: string | undefined;
  };

  let {
    open = $bindable(false), onopenchange, side = "bottom", title, description, actions, onaction, footer, closable = true,
    trigger, triggerLabel, children, class: className, ...data
  }: Props = $props();

  const SWIPE = { bottom: "down", end: "end", start: "start" } as const;
  const setOpen = (next: boolean) => { open = next; onopenchange?.(next); };
  /* open when it mounted: drawn at once (the recipe skips the entrance) until it first closes */
  let mountedOpen = $state(untrack(() => open));
  $effect.pre(() => { if (!open) mountedOpen = false; });
  const press = (action: DrawerAction) => {
    onaction?.(action.value ?? action.label);
    if (action.close !== false) setOpen(false);
  };
  $effect(() => trackModality());
  const r = $derived(drawer({ side }));
</script>

<div {...data} data-slot="drawer" class={r.base({ class: className })}>
  <ArkDrawer.Root {open} swipeDirection={SWIPE[side]} onOpenChange={(details) => setOpen(details.open)}>
    {#if trigger}
      <ArkDrawer.Trigger>
        {#snippet asChild(props)}{@render trigger(props)}{/snippet}
      </ArkDrawer.Trigger>
    {:else if triggerLabel}
      <ArkDrawer.Trigger>
        {#snippet asChild(props)}<Button {...props()} data-drawer="trigger" size="sm" class={r.trigger()}>{triggerLabel}</Button>{/snippet}
      </ArkDrawer.Trigger>
    {/if}
    <Portal>
      <ArkDrawer.Backdrop data-slot="drawer-backdrop" data-mounted-open={mountedOpen ? "" : undefined} class={r.backdrop()} />
      <ArkDrawer.Positioner data-slot="drawer-positioner" class={r.positioner()}>
        <ArkDrawer.Content data-slot="drawer-content" data-mounted-open={mountedOpen ? "" : undefined} class={r.content()}>
          {#if side === "bottom"}
            <ArkDrawer.Grabber data-slot="drawer-grabber" class={r.grabber()} aria-hidden="true">
              <ArkDrawer.GrabberIndicator data-slot="drawer-grabber-indicator" class={r.grabberIndicator()} />
            </ArkDrawer.Grabber>
          {/if}
          <div data-slot="drawer-header" class={r.header()}>
            <ArkDrawer.Title data-slot="drawer-title" class={r.title()}>{title}</ArkDrawer.Title>
            {#if closable}
              <!-- the close trigger owns the button (its data-scope and data-part); the tooltip adds itself -->
              {#snippet closeIcon()}<X data-slot="icon" weight="bold" />{/snippet}
              <ArkDrawer.CloseTrigger>
                {#snippet asChild(closeProps)}
                  <Tooltip content="Close" triggerId={closeProps().id ?? undefined}>
                    {#snippet trigger(tip)}
                      <Button {...mergeProps(tip(), closeProps())} data-drawer="close" class={r.close()} variant="ghost" size="sm" shape="rounded" square muted aria-label="Close" icon={closeIcon} />
                    {/snippet}
                  </Tooltip>
                {/snippet}
              </ArkDrawer.CloseTrigger>
            {/if}
          </div>
          {#if description}<ArkDrawer.Description data-slot="drawer-description" class={r.description()}>{description}</ArkDrawer.Description>{/if}
          {#if children}<div data-slot="drawer-body" class={r.body()}>{@render children()}</div>{/if}
          {#if footer || (actions && actions.length)}
            <div data-slot="drawer-footer" class={r.footer()}>
              {#if footer}
                {@render footer()}
              {:else if actions}
                {#each actions as action (action.value ?? action.label)}
                  <Button variant={action.variant ?? "outline"} size="sm" onclick={() => press(action)}>{action.label}</Button>
                {/each}
              {/if}
            </div>
          {/if}
        </ArkDrawer.Content>
      </ArkDrawer.Positioner>
    </Portal>
  </ArkDrawer.Root>
</div>
