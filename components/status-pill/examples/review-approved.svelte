<script lang="ts">
  import { Button, StatusPill } from "@fndn/svelte";

  let approved = $state(false);
</script>

<!-- the mark replaces the dot for a finished state and pops in when the status changes -->
<div class="flex w-80 flex-col gap-3 text-sm">
  <div class="flex items-start gap-3">
    <div class="min-w-0 flex-1">
      <p class="font-medium text-ink">Add retry to webhook delivery</p>
      <p class="text-ink-2">#482 · feat/webhook-retry into main</p>
    </div>
    {#if approved}
      <StatusPill tone="green" mark>Approved</StatusPill>
    {:else}
      <StatusPill tone="neutral">In review</StatusPill>
    {/if}
  </div>
  <div class="flex gap-2">
    <Button size="sm" variant="primary" disabled={approved} onclick={() => (approved = true)}>Approve</Button>
    <Button size="sm" variant="ghost" onclick={() => (approved = false)}>Request changes</Button>
  </div>
</div>
