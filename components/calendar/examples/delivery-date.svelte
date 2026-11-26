<script lang="ts">
  import { Calendar } from "@fndn/svelte";

  let dates = $state<string[]>(["2026-12-12"]);
</script>

<div class="flex flex-col gap-2">
  <Calendar aria-label="Delivery date" bind:value={dates} />
  <span class="text-sm text-ink-2">{dates[0] ? `Delivery on ${dates[0]}.` : "No date chosen."}</span>
</div>
