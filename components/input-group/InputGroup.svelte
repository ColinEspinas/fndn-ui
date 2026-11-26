<!-- An Input with addons joined to it. class and style go to the group; every other prop to the
     Input. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";
  import Input from "../input/Input.svelte";
  import { inputGroup } from "./input-group.recipe";
  import { truncationTitles } from "../lib/truncate";

  type Props = Omit<HTMLInputAttributes, "size" | "value" | "oninput"> & {
    /** Addon before the field: text (https://), an icon, a Kbd, or a Button (ghost, xs). */
    start?: Snippet | string;
    /** Addon after the field: text (.com, USD), an icon, a Kbd, or a Button (ghost, xs). */
    end?: Snippet | string;
    /** The shared control's sizes, dimensions only: xs 24px, sm 28px, md 32px, lg 36px. */
    size?: "xs" | "sm" | "md" | "lg";
    /** The look, at every size: outline (the form field), subtle (the inspector), ghost (nothing until touched). */
    variant?: "outline" | "subtle" | "ghost";
    mono?: boolean;
    /** aria-invalid on the Input; the group shows the red ring. Absent: a surrounding Field decides. */
    invalid?: boolean;
    /** Two-way bindable: the Input's value. */
    value?: string;
    oninput?: (value: string) => void;
    /** Bindable: the Input element. */
    ref?: HTMLInputElement | null;
  };

  let { start, end, size = "md", variant = "outline", mono, invalid, class: className, style, value = $bindable(""), ref = $bindable(null), ...rest }: Props = $props();

  const r = $derived(inputGroup({ size, variant }));
  const has = (node: Snippet | string | undefined) => node != null && node !== "";
  let root = $state<HTMLElement | null>(null);
  /* addon text cut by its ellipsis carries its full text as a title */
  $effect(() => truncationTitles(root, "[data-slot=input-group-start], [data-slot=input-group-end]"));
  /* a press on an addon's text or icon puts the caret in the field; controls in an addon keep theirs */
  function focusField(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.closest("input, button, a, select, textarea, [tabindex]")) return;
    event.preventDefault();
    ref?.focus();
  }
</script>

{#snippet addon(node: Snippet | string)}{#if typeof node === "string"}{node}{:else}{@render node()}{/if}{/snippet}
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div bind:this={root} data-slot="input-group" class={r.base({ class: className as string | undefined })} {style} onmousedown={focusField}>
  {#if start && has(start)}<span data-slot="input-group-start" class={r.start()}>{@render addon(start)}</span>{/if}
  <Input bind:ref={() => ref, (el) => (ref = el as HTMLInputElement | null)} bind:value data-input-group="input" {size} {mono} {invalid} class={r.input()} {...rest} />
  {#if end && has(end)}<span data-slot="input-group-end" class={r.end()}>{@render addon(end)}</span>{/if}
</div>
