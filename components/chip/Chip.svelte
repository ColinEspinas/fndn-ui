<!-- Monospace token chip for code values. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { chip } from "./chip.recipe";

  export type ChipTone = "neutral" | "accent" | "green" | "orange" | "red";
  type Props = HTMLAttributes<HTMLElement> & { tone?: ChipTone; children?: Snippet };

  let { tone = "neutral", class: className, children, ...rest }: Props = $props();

  const cls = $derived(chip({ tone, class: className as string | undefined }));
</script>

<code data-slot="chip" class={cls} {...rest}>{@render children?.()}</code>
