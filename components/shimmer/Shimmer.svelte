<!-- Shimmering label — the agent is processing. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { shimmer } from "./shimmer.recipe";

  type Props = HTMLAttributes<HTMLSpanElement> & { speed?: "normal" | "fast"; tone?: "ink" | "accent"; children?: Snippet };
  let { speed = "normal", tone = "ink", class: className, children, ...rest }: Props = $props();

  const cls = $derived(shimmer({ speed, tone, class: className as string | undefined }));
</script>

<span data-slot="shimmer" class={cls} {...rest}>{@render children?.()}</span>
