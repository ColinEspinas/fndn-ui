<script lang="ts">
  import { Tag } from "@fndn/svelte";

  const labels = [
    { name: "bug", tone: "red" },
    { name: "billing-api", tone: "blue" },
    { name: "priority: high", tone: "orange" },
  ] as const;
</script>

<!-- an issue's labels, Linear's way: neutral boxes, the hue only in the dot, so a row of many hues stays quiet -->
<div class="flex w-80 flex-col gap-2 text-sm">
  <div>
    <p class="font-medium text-ink">Webhook retries stop after the third attempt</p>
    <p class="text-ink-2">#491 opened by Priya Raman · 3 h ago</p>
  </div>
  <div class="flex flex-wrap gap-1.5">
    {#each labels as label (label.name)}
      <Tag tone={label.tone} variant="outline">{label.name}</Tag>
    {/each}
  </div>
</div>
