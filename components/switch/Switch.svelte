<!-- On/off toggle; a native button with role=switch. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { trackModality } from "../lib/modality";
  import { switchRecipe } from "./switch.recipe";

  type Props = Omit<HTMLButtonAttributes, "onchange" | "children"> & {
    /** Two-way bindable: <Switch bind:checked /> */
    checked?: boolean;
    oncheckedchange?: (checked: boolean) => void;
    /** md: 40×24 (default). sm: 32×18. */
    size?: "sm" | "md";
    /** Accessible name when there is no visible label. */
    label?: string;
    /** Visible label. The switch is wrapped in a <label>, so the text toggles and names it.
     * `class` and `style` then land on that wrapper (the outermost element: what a caller sizes and
     * places); every other attribute stays on the button. */
    children?: Snippet;
  };

  let { checked = $bindable(false), oncheckedchange, size = "md", label, class: className, style, disabled, onclick, children, ...rest }: Props = $props();

  const r = $derived(switchRecipe({ size }));

  $effect(() => trackModality());
</script>

{#snippet control()}
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    {disabled}
    data-slot="switch" class={r.base({ class: children ? undefined : (className as string | undefined) })}
    style={children ? undefined : style}
    onclick={(e) => {
      onclick?.(e);
      if (e.defaultPrevented) return;
      checked = !checked;
      oncheckedchange?.(checked);
    }}
    {...rest}
  >
    <span data-slot="switch-thumb" class={r.thumb()} aria-hidden="true"></span>
  </button>
{/snippet}

{#if children}
  <label data-slot="switch-label" class={r.label({ class: className as string | undefined })} {style}>
    {@render control()}
    <span data-slot="switch-label-text" class={r.labelText()}>{@render children()}</span>
  </label>
{:else}
  {@render control()}
{/if}
