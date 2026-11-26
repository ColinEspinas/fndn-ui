<!-- Card description part. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { card } from "./card.recipe";

  type Props = HTMLAttributes<HTMLParagraphElement> & { children?: Snippet };
  let { class: className, children, ...rest }: Props = $props();
</script>

<p data-slot="card-description" class={card().description({ class: className as string | undefined })} {...rest}>{@render children?.()}</p>
