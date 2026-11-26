<script lang="ts">
  import { HoverCard, StatusPill } from "@fndn/svelte";
</script>

<div class="flex w-80 flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-ink-2">
  <span>Daniel Okafor opened</span>
  <HoverCard triggerLabel="#482" title="feat/webhook-retry → main" add={128} del={14}>
    <div class="flex flex-col gap-2">
      <span class="font-medium text-ink">Add retry to webhook delivery</span>
      <span class="text-ink-2">Retries failed deliveries 5 times with backoff, then marks the endpoint unhealthy.</span>
      <StatusPill tone="green" class="self-start">Checks passing</StatusPill>
    </div>
  </HoverCard>
  <span>2 hours ago</span>
</div>
