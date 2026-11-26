<!-- A centred window over a dimmed page. Behaviour by Ark UI (Zag dialog). -->
<script lang="ts">
  import { Dialog as ArkDialog } from "@ark-ui/svelte/dialog";
  import { Portal } from "@ark-ui/svelte/portal";
  import X from "phosphor-svelte/lib/XIcon";
  import { untrack, type Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { mergeProps } from "@ark-ui/svelte/utils";
  import Button from "../button/Button.svelte";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import { trackModality } from "../lib/modality";
  import { submittedAction } from "./dialog.logic";
  import { dialog } from "./dialog.recipe";

  export type DialogActionVariant = "primary" | "outline" | "secondary" | "accent" | "success" | "danger" | "danger-outline" | "ghost";
  export type DialogAction = {
    label: string;
    /** Passed to onaction. Defaults to the label. */
    value?: string;
    variant?: DialogActionVariant;
    /** false keeps the dialog open after the press (or the form's submit). */
    close?: boolean;
    /** The id of a form in the body that this button submits (type="submit" form="<id>"). The
     * browser checks the form first; its submit event, not the click, calls onaction and closes. */
    form?: string;
  };

  type Props = {
    /** Two-way bindable: <Dialog bind:open /> */
    open?: boolean;
    onopenchange?: (open: boolean) => void;
    /** Names the dialog. Required. */
    title: string;
    description?: string;
    /** alertdialog is for destructive confirms: a click outside does not close it and focus starts on the first action. */
    role?: "dialog" | "alertdialog";
    /** Footer buttons in order, least destructive first. */
    actions?: ReadonlyArray<DialogAction>;
    onaction?: (value: string) => void;
    /** Custom footer instead of `actions`. */
    footer?: Snippet;
    /** Show the close button in the header. */
    closable?: boolean;
    /** Bare: the dialog is only the frame (position, focus trap, motion). No fill, no shadow, no padding, no header; the title still names it for assistive technology. Its one child is the surface, as in a command palette. */
    bare?: boolean;
    /** Width: sm 360px, md 440px (default), lg 880px (a large preview). */
    size?: "sm" | "md" | "lg";
    /** Where the window sits: center (at the bottom on a phone), or top: pinned near the top and growing downward (a command palette). */
    placement?: "center" | "top";
    /** Opens and closes at once from the pointer too (a command palette): no fade or scale. */
    instant?: boolean;
    /** What takes focus when it opens: an element, a selector (looked up inside the window first), or a
     * function returning the element. Default: the first control (the first action for alertdialog). */
    initialFocus?: HTMLElement | string | (() => HTMLElement | null);
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
    open = $bindable(false), onopenchange, title, description, role = "dialog", actions, onaction, footer, closable = true, bare = false, size = "md", placement = "center", instant = false,
    initialFocus, trigger, triggerLabel, children, class: className, ...data
  }: Props = $props();

  let footerEl = $state<HTMLElement | null>(null);
  let headerEl = $state<HTMLElement | null>(null);
  const initialFocusEl = () => {
    if (typeof initialFocus === "function") return initialFocus();
    if (typeof initialFocus === "string") return headerEl?.parentElement?.querySelector<HTMLElement>(initialFocus) ?? document.querySelector<HTMLElement>(initialFocus);
    if (initialFocus) return initialFocus;
    return footerEl?.querySelector<HTMLElement>("button") ?? null;
  };
  const setOpen = (next: boolean) => { open = next; onopenchange?.(next); };
  /* open when it mounted: drawn at once (the recipe skips the entrance) until it first closes */
  let mountedOpen = $state(untrack(() => open));
  $effect.pre(() => { if (!open) mountedOpen = false; });
  const press = (action: DialogAction) => {
    onaction?.(action.value ?? action.label);
    if (action.close !== false) setOpen(false);
  };
  /* an action that names a form acts on the form's submit, which the browser fires only for a valid form */
  const submitted = (event: Event) => {
    const action = footer ? undefined : submittedAction(actions, footerEl, event);
    if (action) press(action);
  };
  $effect(() => trackModality());
  const r = $derived(dialog({ size, bare, placement, instant }));
</script>

<div {...data} data-slot="dialog" class={r.base({ class: className })}>
  <ArkDialog.Root
    {open}
    {role}
    closeOnInteractOutside={role !== "alertdialog"}
    initialFocusEl={initialFocus || role === "alertdialog" ? initialFocusEl : undefined}
    onOpenChange={(details) => setOpen(details.open)}
  >
    {#if trigger}
      <ArkDialog.Trigger>
        {#snippet asChild(props)}{@render trigger(props)}{/snippet}
      </ArkDialog.Trigger>
    {:else if triggerLabel}
      <ArkDialog.Trigger>
        {#snippet asChild(props)}<Button {...props()} data-dialog="trigger" size="sm" class={r.trigger()}>{triggerLabel}</Button>{/snippet}
      </ArkDialog.Trigger>
    {/if}
    <Portal>
      <ArkDialog.Backdrop data-slot="dialog-backdrop" data-mounted-open={mountedOpen ? "" : undefined} class={r.backdrop()} />
      <!-- a press on the dimmed area must not pull focus out of the window -->
      <ArkDialog.Positioner data-slot="dialog-positioner" class={r.positioner()} onmousedown={(e: MouseEvent) => { if (e.target === e.currentTarget) e.preventDefault(); }}>
        <ArkDialog.Content data-slot="dialog-content" data-mounted-open={mountedOpen ? "" : undefined} class={r.content()} onsubmit={submitted}>
          <div bind:this={headerEl} data-slot="dialog-header" class={r.header()}>
            <ArkDialog.Title data-slot="dialog-title" class={r.title()}>{title}</ArkDialog.Title>
            {#if closable && !bare}
              <!-- the close trigger owns the button (its data-scope and data-part); the tooltip adds itself -->
              {#snippet closeIcon()}<X data-slot="icon" weight="bold" />{/snippet}
              <ArkDialog.CloseTrigger>
                {#snippet asChild(closeProps)}
                  <Tooltip content="Close" triggerId={closeProps().id ?? undefined}>
                    {#snippet trigger(tip)}
                      <Button {...mergeProps(tip(), closeProps())} data-dialog="close" class={r.close()} variant="ghost" size="sm" shape="rounded" square muted aria-label="Close" icon={closeIcon} />
                    {/snippet}
                  </Tooltip>
                {/snippet}
              </ArkDialog.CloseTrigger>
            {/if}
          </div>
          {#if description}<ArkDialog.Description data-slot="dialog-description" class={r.description()}>{description}</ArkDialog.Description>{/if}
          {#if children}<div data-slot="dialog-body" class={r.body()}>{@render children()}</div>{/if}
          {#if footer || (actions && actions.length)}
            <div bind:this={footerEl} data-slot="dialog-footer" class={r.footer()}>
              {#if footer}
                {@render footer()}
              {:else if actions}
                {#each actions as action (action.value ?? action.label)}
                  {#if action.form}
                    <Button variant={action.variant ?? "outline"} size="sm" type="submit" form={action.form}>{action.label}</Button>
                  {:else}
                    <Button variant={action.variant ?? "outline"} size="sm" onclick={() => press(action)}>{action.label}</Button>
                  {/if}
                {/each}
              {/if}
            </div>
          {/if}
        </ArkDialog.Content>
      </ArkDialog.Positioner>
    </Portal>
  </ArkDialog.Root>
</div>
