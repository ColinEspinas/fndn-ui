<!-- The app's core button, in the app's shape: a pill unless the app is rounded. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { button, buttonSpinner } from "./button.recipe";
  import Spinner from "../spinner/Spinner.svelte";
  import { truncationTitles } from "../lib/truncate";
  import { trackModality } from "../lib/modality";
  import { easeSwapWidth, watchSwapWidth } from "./swap";
  import { untrack } from "svelte";

  export type ButtonVariant = "primary" | "outline" | "secondary" | "accent" | "success" | "danger" | "danger-outline" | "ghost";
  export type ButtonSize = "xs" | "sm" | "md" | "lg";
  export type ButtonShape = "pill" | "rounded";

  type Props = HTMLButtonAttributes & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** Icon-only: equal width and height (24, 28 or 32). Needs an aria-label. */
    square?: boolean;
    /** Radius only: pill (a pill square is round) or rounded. Left out, the app's shape (a pill, or rounded in a rounded app: "shape": "rounded" in the project's fndn.json). */
    shape?: ButtonShape;
    /** ink-3 at rest, ink when hovered, pressed or open. */
    muted?: boolean;
    /** Two states in one cell (Copy / Copied): shows the second label and icon. */
    swapped?: boolean;
    /** Leading icon, rendered in the icon part. */
    icon?: Snippet;
    /** Trailing icon (a caret after the label), rendered in an icon part after the label. */
    trailingIcon?: Snippet;
    /** Square buttons: the icon's size in px (--fndn-button-icon-size); defaults to 14 / 15 / 16 by size. */
    iconSize?: number;
    /** Work under way: a spinner takes the icon's place (or covers the label), aria-busy, clicks are
     * dropped; the width does not change and the button keeps its focus. */
    busy?: boolean;
    children?: Snippet;
  };

  let { variant = "outline", size = "md", square, shape, muted, swapped, icon, trailingIcon, iconSize, busy = false, class: className, style, children, type = "button", onclick, ...rest }: Props = $props();

  const r = $derived(button({ variant, size, shape, square: !!square, muted: !!muted, swapped: !!swapped, busy, cover: busy && !icon, holding: busy && !!icon }));
  /* busy: a press does nothing (a submit button does not submit either) */
  const drop = (event: MouseEvent) => event.preventDefault();

  /* a label cut by its ellipsis carries its full text as a title */
  let label = $state<HTMLElement | null>(null);
  $effect(() => truncationTitles(label));
  $effect(() => trackModality());
  /* two states in one cell (Copy / Copied): the width eases to the new label with the cross-fade */
  $effect(() => watchSwapWidth(label?.parentElement));
  let wasSwapped = untrack(() => !!swapped);
  $effect(() => {
    const now = !!swapped;
    if (now === wasSwapped) return;
    wasSwapped = now;
    untrack(() => easeSwapWidth(label?.parentElement));
  });
</script>

<button
  {type}
  data-slot="button"
  class={r.base({ class: className as string | undefined })}
  style={[style, iconSize == null ? "" : `--fndn-button-icon-size: ${iconSize}px`].filter(Boolean).join("; ") || undefined}
  aria-busy={busy || undefined}
  {...rest}
  onclick={busy ? drop : onclick}
>
  {#if icon}<span data-slot="button-icon" class={r.icon()} aria-hidden="true">{@render icon()}{#if busy}<Spinner data-button="spinner" class={buttonSpinner({ cover: !icon })} decorative />{/if}</span>{/if}
  {#if children}<span bind:this={label} data-slot="button-label" class={r.label()}>{@render children()}</span>{/if}
  {#if trailingIcon}<span data-slot="button-icon" data-trailing="" class={r.icon({ holding: false })} aria-hidden="true">{@render trailingIcon()}</span>{/if}
  {#if busy && !icon}<Spinner data-button="spinner" class={buttonSpinner({ cover: !icon })} decorative />{/if}
</button>
