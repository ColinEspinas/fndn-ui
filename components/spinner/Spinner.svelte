<!-- Hairline ring with a single ink arc. -->
<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { spinner } from "./spinner.recipe";

  export type SpinnerSize = "sm" | "md" | "lg";
  type Props = HTMLAttributes<HTMLSpanElement> & {
    size?: SpinnerSize;
    label?: string;
    /** Purely visual, inside something that is already a status region: aria-hidden, no role or label. */
    decorative?: boolean;
  };
  let { size = "sm", label = "Loading", decorative = false, class: className, ...rest }: Props = $props();

  const cls = $derived(spinner({ size, class: className as string | undefined }));
</script>

{#if decorative}
  <span data-slot="spinner" class={cls} aria-hidden="true" {...rest}></span>
{:else}
  <span role="status" aria-label={label} data-slot="spinner" class={cls} {...rest}></span>
{/if}
