<!-- A button that stays pressed. Behaviour by Ark UI (Zag toggle). -->
<script lang="ts">
  import { Toggle as ArkToggle } from "@ark-ui/svelte/toggle";
  import { mergeProps } from "@ark-ui/svelte/utils";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import { toggle } from "./toggle.recipe";
  import { trackModality } from "../lib/modality";
  import { truncationTitles } from "../lib/truncate";

  export type ToggleVariant = "outline" | "ghost" | "ink";
export type ToggleIndicator = "none" | "start" | "bottom";
  export type ToggleSize = "xs" | "sm" | "md" | "lg";
  export type ToggleShape = "pill" | "rounded";

  type Props = Omit<HTMLButtonAttributes, "onchange" | "children"> & {
    /** Two-way bindable: <Toggle bind:pressed /> */
    pressed?: boolean;
    onpressedchange?: (pressed: boolean) => void;
    variant?: ToggleVariant;
    size?: ToggleSize;
    /** Radius only: pill or rounded. Left out, the app's shape (a pill, or rounded in a rounded app: "shape": "rounded" in the project's fndn.json). */
    shape?: ToggleShape;
    /** Icon-only: equal width and height (24, 28 or 32). Name it with tooltip or aria-label. */
    square?: boolean;
    /** ink-3 at rest, ink when hovered, held down or pressed. */
    muted?: boolean;
    /** The ink look's pressed mark: a 2px ink bar at the inline start (an activity bar) or at the bottom (a toolbar). */
    indicator?: ToggleIndicator;
    /** Icon, rendered in the icon part. */
    icon?: Snippet;
    /** Wraps the toggle in a Tooltip with this text; also the name (aria-label) of a square or icon-only toggle that has none. */
    tooltip?: string;
    /** The label. */
    children?: Snippet;
  };

  let {
    pressed = $bindable(false), onpressedchange, variant = "outline", size = "md", shape, square, muted, indicator = "none", icon, tooltip,
    class: className, style, disabled, children, ...rest
  }: Props = $props();

  const r = $derived(toggle({ variant, size, shape, square: !!square, muted: !!muted, indicator }));
  const named = $derived(tooltip && (square || !children) && rest["aria-label"] == null ? { "aria-label": tooltip } : {});

  /* a label cut by its ellipsis carries its full text as a title */
  let label = $state<HTMLElement | null>(null);
  $effect(() => truncationTitles(label));
  $effect(() => trackModality());
</script>

{#snippet root(extra: () => HTMLButtonAttributes)}
  <!-- the engine's props, the caller's, then the tooltip's on top: the order of React's as-child -->
  <ArkToggle.Root bind:pressed disabled={disabled ?? undefined} onPressedChange={(next: boolean) => onpressedchange?.(next)}>
    {#snippet asChild(toggleProps)}
      <button
        {...mergeProps(toggleProps(), named, rest, extra())}
        data-slot="toggle"
        class={r.base({ class: className as string | undefined })}
        {style}
      >
        {#if icon}<span data-slot="toggle-icon" class={r.icon()} aria-hidden="true">{@render icon()}</span>{/if}
        {#if children}<span bind:this={label} data-slot="toggle-label" class={r.label()}>{@render children()}</span>{/if}
      </button>
    {/snippet}
  </ArkToggle.Root>
{/snippet}

{#if tooltip}
  <Tooltip content={tooltip}>
    {#snippet trigger(tipProps)}{@render root(tipProps)}{/snippet}
  </Tooltip>
{:else}
  {@render root(() => ({}))}
{/if}
