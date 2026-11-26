<!-- The squarer, bordered label of tables and fields, optionally removable. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
  import X from "phosphor-svelte/lib/XIcon";
  import { mergeProps } from "@ark-ui/svelte/utils";
  import Button from "../button/Button.svelte";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import { truncationTitles } from "../lib/truncate";
  import { tag } from "./tag.recipe";

  export type TagTone = "neutral" | "accent" | "blue" | "green" | "orange" | "red" | "purple" | "cyan" | "yellow" | "pink";
  export type TagSize = "md" | "sm";
  type Props = HTMLAttributes<HTMLSpanElement> & {
    tone?: TagTone;
    /** tint (default): the box takes the hue. outline: a neutral box with the hue in its dot (Linear's labels); the dot shows. */
    variant?: "tint" | "outline";
    size?: TagSize;
    /** Radius only: rounded (default) or pill, for a tag in a pill-shaped host. */
    shape?: "rounded" | "pill";
    /** Leading dot in the tag's hue. */
    dot?: boolean;
    /** Remove button at the end. */
    removable?: boolean;
    /** aria-label of the remove button. */
    removeLabel?: string;
    onremove?: () => void;
    /** A tooltip on the remove button (the real Tooltip around it). */
    removeTooltip?: string;
    /** Attributes for the remove button, e.g. a data attribute the owner uses to move focus after a removal. */
    removeProps?: HTMLButtonAttributes & Record<`data-${string}`, string | undefined>;
    /** A glyph before the label (a file, a source); takes the dot's place. */
    icon?: Snippet;
    children?: Snippet;
  };

  let { tone = "neutral", variant = "tint", size = "md", shape = "rounded", dot = false, removable = false, removeLabel = "Remove", onremove, removeTooltip, removeProps, icon, class: className, children, ...rest }: Props = $props();
  const showDot = $derived((dot || variant === "outline") && !icon);
  const r = $derived(tag({ tone, variant, size, shape, removable: !!removable }));
  const onRemoveClick = (e: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => { (removeProps?.onclick as ((e: MouseEvent) => void) | undefined)?.(e); onremove?.(); };

  /* a label cut by its ellipsis carries its full text as a title */
  let label = $state<HTMLElement | null>(null);
  $effect(() => truncationTitles(label));
</script>

<span data-slot="tag" class={r.base({ class: className as string | undefined })} {...rest}>
  {#if showDot}<span data-slot="tag-dot" class={r.dot()} aria-hidden="true"></span>{/if}
  {#if icon}<span data-slot="tag-icon" class={r.icon()} aria-hidden="true">{@render icon()}</span>{/if}
  {#if children}<span bind:this={label} data-slot="tag-label" class={r.label()}>{@render children()}</span>{/if}
  {#if removable}
    {#snippet removeIcon()}<X data-slot="icon" weight="bold" />{/snippet}
    {#if removeTooltip}
      <Tooltip content={removeTooltip}>
        {#snippet trigger(tipProps)}
          <Button {...mergeProps(tipProps(), { ...removeProps, onclick: onRemoveClick })} data-tag="remove" class={r.remove({ class: removeProps?.class as string | undefined })} variant="ghost" size="xs" {shape} square iconSize={size === "sm" ? 10 : 12} aria-label={removeLabel} icon={removeIcon} />
        {/snippet}
      </Tooltip>
    {:else}
      <Button {...removeProps} data-tag="remove" class={r.remove({ class: removeProps?.class as string | undefined })} variant="ghost" size="xs" {shape} square iconSize={size === "sm" ? 10 : 12} aria-label={removeLabel} onclick={onRemoveClick} icon={removeIcon} />
    {/if}
  {/if}
</span>
