<!-- White surface on the hairline ring. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { card } from "./card.recipe";

  export type CardElevation = "hairline" | "card" | "raised" | "overlay";
  type Props = HTMLAttributes<HTMLDivElement> & { elevation?: CardElevation; inset?: boolean; children?: Snippet };

  let { elevation = "card", inset, class: className, children, ...rest }: Props = $props();
</script>

<div data-slot="card" class={card({ elevation, inset: !!inset }).base({ class: className as string | undefined })} {...rest}>
  {@render children?.()}
</div>
