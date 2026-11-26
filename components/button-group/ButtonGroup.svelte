<!-- Buttons joined into one control. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import Button, { type ButtonShape, type ButtonSize } from "../button/Button.svelte";
  import { buttonGroup } from "./button-group.recipe";

  export type ButtonGroupItem = { value: string; label: string; disabled?: boolean };

  type Props = Omit<HTMLAttributes<HTMLDivElement>, "role"> & {
    orientation?: "horizontal" | "vertical";
    /** The group's accessible name. */
    label?: string;
    /** Buttons as data, rendered before the children. */
    items?: ReadonlyArray<ButtonGroupItem>;
    onitemclick?: (value: string) => void;
    /** The Button variant of the items (children set their own). */
    variant?: "outline" | "primary" | "secondary" | "ghost";
    /** The Button size of the items. */
    size?: ButtonSize;
    /** The Button shape of the items. Left out, the app's shape (a pill, or rounded in a rounded app: "shape": "rounded" in the project's fndn.json). */
    shape?: ButtonShape;
    children?: Snippet;
  };

  let { orientation = "horizontal", label, items, onitemclick, variant = "outline", size = "md", shape, class: className, children, ...rest }: Props = $props();

  const r = $derived(buttonGroup({ orientation }));
</script>

<div {...rest} role="group" aria-label={label} data-slot="button-group" class={r.base({ class: className as string | undefined })}>
  {#each items ?? [] as item (item.value)}
    <Button data-button-group="item" class={r.item()} {variant} {size} {shape} disabled={item.disabled} onclick={() => onitemclick?.(item.value)}>{item.label}</Button>
  {/each}
  {@render children?.()}
</div>
