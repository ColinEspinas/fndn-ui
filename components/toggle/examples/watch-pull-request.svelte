<script lang="ts">
  import Bell from "phosphor-svelte/lib/BellIcon";
  import { Toggle } from "@fndn/svelte";

  /* a toggle keeps its label; the pressed fill and the line under it say the state */
  let watching = $state(true);
</script>

<div class="flex max-w-80 flex-col items-start gap-2">
  <p class="text-sm font-medium text-ink">#482 Add retry to webhook delivery</p>
  <div class="flex items-center gap-3">
    <Toggle bind:pressed={watching} size="sm">
      {#snippet icon()}<Bell data-slot="icon" weight="bold" />{/snippet}
      Watch
    </Toggle>
    <span class="text-sm text-ink-2">{watching ? "Every review and comment" : "Only when you are mentioned"}</span>
  </div>
</div>
