<!-- Card footer part. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { card } from "./card.recipe";

  type Props = HTMLAttributes<HTMLDivElement> & { children?: Snippet };
  let { class: className, children, ...rest }: Props = $props();
</script>

<div data-slot="card-footer" class={card().footer({ class: className as string | undefined })} {...rest}>{@render children?.()}</div>
