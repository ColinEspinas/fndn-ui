<!-- Number badge with tabular numbers. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { count } from "./count.recipe";

  export type CountVariant = "plain" | "boxed";
  type Props = HTMLAttributes<HTMLSpanElement> & {
    variant?: CountVariant;
    /** md (default): plain in the surrounding size, boxed 20px. sm: plain 12px, boxed 18px. */
    size?: "sm" | "md";
    /** Selected look; automatic inside a selected chip, tab or segment. */
    selected?: boolean;
    children?: Snippet;
  };

  let { variant = "plain", size = "md", selected = false, class: className, children, ...rest }: Props = $props();

  const cls = $derived(count({ variant, size, selected, class: className as string | undefined }));
</script>

<span data-slot="count" class={cls} {...rest}>{@render children?.()}</span>
