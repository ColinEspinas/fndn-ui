<!-- A confirm that interrupts: the Dialog with role="alertdialog". -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import Button from "../button/Button.svelte";
  import Dialog from "../dialog/Dialog.svelte";
  import { alertDialog } from "./alert-dialog.recipe";

  type Props = {
    /** Two-way bindable: <AlertDialog bind:open /> */
    open?: boolean;
    onopenchange?: (open: boolean) => void;
    /** The question; names the window. */
    title: string;
    /** What happens, and whether it can be undone. */
    description?: string;
    /** Say what it does ("Delete project"). */
    actionLabel?: string;
    cancelLabel?: string;
    /** danger: a danger action (default). neutral: a primary action. */
    tone?: "danger" | "neutral";
    /** The Dialog's widths: sm 360px, md 440px (default). */
    size?: "sm" | "md";
    onaction?: () => void;
    /** Cancel, Escape, or any close that is not the action. */
    oncancel?: () => void;
    /** Your own trigger. The snippet receives a function returning the props to spread on your element. */
    trigger?: Snippet<[() => HTMLButtonAttributes]>;
    /** Renders the Dialog's default Button trigger with this label. */
    triggerLabel?: string;
    /** Body content under the description. */
    children?: Snippet;
    class?: string;
    [data: `data-${string}`]: string | undefined;
  };

  let {
    open = $bindable(false), onopenchange, title, description, actionLabel = "Continue", cancelLabel = "Cancel", tone = "danger", size = "md",
    onaction, oncancel, trigger, triggerLabel, children, class: className, ...data
  }: Props = $props();

  const setOpen = (next: boolean, acted = false) => {
    if (!next && open && !acted) oncancel?.();
    open = next;
    onopenchange?.(next);
  };
  const r = alertDialog();
</script>

{#snippet footer()}
  <Button data-alert-dialog="cancel" class={r.cancel()} variant="ghost" size="sm" onclick={() => setOpen(false)}>{cancelLabel}</Button>
  <Button data-alert-dialog="action" class={r.action()} variant={tone === "danger" ? "danger" : "primary"} size="sm" onclick={() => { onaction?.(); setOpen(false, true); }}>{actionLabel}</Button>
{/snippet}

<div {...data} data-slot="alert-dialog" class={r.base({ class: className })}>
  <Dialog
    {open}
    onopenchange={(next) => setOpen(next)}
    role="alertdialog"
    closable={false}
    {size}
    {title}
    {description}
    {trigger}
    {triggerLabel}
    {footer}
    {children}
  />
</div>
