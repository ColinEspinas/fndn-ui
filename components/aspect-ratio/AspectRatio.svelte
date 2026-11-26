<!-- A box that keeps a width-to-height ratio. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { aspectRatio } from "./aspect-ratio.recipe";

  type Props = HTMLAttributes<HTMLDivElement> & {
    /** Width divided by height: 16 / 9 (default), 1, 4 / 3, 0.75 … Not a positive number: 16 / 9. */
    ratio?: number;
    children?: Snippet;
  };

  let { ratio = 16 / 9, class: className, style, children, ...rest }: Props = $props();
  const value = $derived(Number.isFinite(ratio) && ratio > 0 ? ratio : 16 / 9);
</script>

<div {...rest} data-slot="aspect-ratio" class={aspectRatio({ class: className as string | undefined })} style="--fndn-aspect-ratio: {value};{style ?? ''}">{@render children?.()}</div>
