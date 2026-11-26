<!-- A region that scrolls with a thin overlay scrollbar. Behaviour by Ark UI (Zag scroll-area). -->
<script lang="ts">
  import { ScrollArea as ArkScrollArea } from "@ark-ui/svelte/scroll-area";
  import type { Snippet } from "svelte";
  import { scrollArea } from "./scroll-area.recipe";

  export type ScrollAreaOrientation = "vertical" | "horizontal" | "both";

  type Props = {
    /** Which scrollbars it draws (the viewport scrolls whichever way its content overflows). */
    orientation?: ScrollAreaOrientation;
    children?: Snippet;
    class?: string;
    style?: string;
    id?: string;
    "aria-label"?: string;
    /** data-* attributes land on the root (a host marks it as one of its parts). */
    [data: `data-${string}`]: string | undefined;
  };

  let { orientation = "vertical", class: className, children, ...rest }: Props = $props();

  const r = $derived(scrollArea({ orientation }));
  const bars = $derived(orientation === "both" ? (["vertical", "horizontal"] as const) : [orientation]);
</script>

<ArkScrollArea.Root {...rest} data-slot="scroll-area" class={r.base({ class: className as string | undefined })}>
  <ArkScrollArea.Viewport data-slot="scroll-area-viewport" class={r.viewport()}>
    <ArkScrollArea.Content data-slot="scroll-area-content" class={r.content()}>{@render children?.()}</ArkScrollArea.Content>
  </ArkScrollArea.Viewport>
  {#each bars as o (o)}
    <ArkScrollArea.Scrollbar orientation={o} data-slot="scroll-area-scrollbar" class={r.scrollbar()}>
      <ArkScrollArea.Thumb data-slot="scroll-area-thumb" class={r.thumb()} />
    </ArkScrollArea.Scrollbar>
  {/each}
  {#if orientation === "both"}<ArkScrollArea.Corner data-slot="scroll-area-corner" class={r.corner()} />{/if}
</ArkScrollArea.Root>
