<!-- Inline value badge set off in prose. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { valuePill } from "./value-pill.recipe";

  export type ValuePillTone = "neutral" | "green" | "orange" | "red" | "accent";
  type Props = HTMLAttributes<HTMLSpanElement> & { tone?: ValuePillTone; children?: Snippet };
  let { tone = "neutral", class: className, children, ...rest }: Props = $props();
</script>

<span data-slot="value-pill" class={valuePill({ tone, class: className as string | undefined })} {...rest}>{@render children?.()}</span>
