<!-- A 1px rule that divides content, with an optional label in the middle. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { separator } from "./separator.recipe";

  export type SeparatorOrientation = "horizontal" | "vertical";

  type Props = HTMLAttributes<HTMLDivElement> & {
    /** horizontal (default): 1px high, full width. vertical: 1px wide, as tall as its row. */
    orientation?: SeparatorOrientation;
    /** Purely visual: role="none", skipped by assistive technology. */
    decorative?: boolean;
    /** The label in the middle. */
    children?: Snippet;
  };

  let { orientation = "horizontal", decorative, class: className, children, ...rest }: Props = $props();

  const labelId = $props.id();
  const r = $derived(separator({ orientation, labelled: !!children }));
  /* a separator's children are presentational: a labelled one is named by its label */
  const a11y = $derived(
    decorative
      ? { role: "none" }
      : { role: "separator", "aria-orientation": orientation, ...(children ? { "aria-labelledby": labelId } : {}) },
  );
</script>

<div data-slot="separator" {...a11y} class={r.base({ class: className as string | undefined })} {...rest}>
  {#if children}<span id={labelId} data-slot="separator-label" class={r.label()}>{@render children()}</span>{/if}
</div>
