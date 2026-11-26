<!-- Card title part. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { card } from "./card.recipe";

  type Props = HTMLAttributes<HTMLHeadingElement> & { children?: Snippet };
  let { class: className, children, ...rest }: Props = $props();
</script>

<h3 data-slot="card-title" class={card().title({ class: className as string | undefined })} {...rest}>{@render children?.()}</h3>
