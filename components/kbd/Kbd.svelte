<!-- Keyboard hint: one or more keys. -->
<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { kbd } from "./kbd.recipe";

  export type KbdVariant = "boxed" | "plain";
  type Props = Omit<HTMLAttributes<HTMLElement>, "children"> & {
    /** The keys in order, e.g. ["⌘", "K"]. */
    keys: string[];
    variant?: KbdVariant;
  };

  let { keys = [], variant = "boxed", class: className, ...rest }: Props = $props();

  const r = $derived(kbd({ variant }));
</script>

<kbd data-slot="kbd" dir="ltr" class={r.base({ class: className as string | undefined })} {...rest}>{#each keys as key, i (i)}<kbd data-slot="kbd-key" class={r.key()}>{key}</kbd>{/each}</kbd>
