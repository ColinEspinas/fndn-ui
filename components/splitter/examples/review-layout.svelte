<script lang="ts">
  import { Button, Splitter } from "@fndn/svelte";

  const panels = [
    { id: "pull-request", content: "#482 Add retry to webhook delivery. Daniel Okafor wants to merge 3 commits into main.", minSize: 20 },
    { id: "change", content: "src/webhooks/deliver.ts, +4 −1: a failed delivery now retries five times with exponential backoff.", minSize: 25 },
    { id: "checks", content: "Build passed, 12 tests passed, preview ready.", minSize: 20 },
  ];
  const initial = [30, 40, 30];
  let size = $state(initial);
</script>

<div class="flex w-full max-w-xl flex-col items-start gap-3">
  <div class="h-44 w-full rounded-card bg-surface shadow-card">
    <Splitter bind:size grip {panels} />
  </div>
  <Button size="sm" onclick={() => (size = initial)}>Reset layout</Button>
</div>
