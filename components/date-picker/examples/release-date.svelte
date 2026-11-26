<script lang="ts">
  import { DatePicker } from "@fndn/svelte";

  let dates = $state<string[]>([]);
</script>

<div class="flex flex-col gap-2" style="width: 220px">
  <DatePicker label="Release date" bind:value={dates} defaultFocusedValue="2026-12-01" />
  <span class="text-sm text-ink-2">{dates[0] ? `Saved as ${dates[0]}` : "Not scheduled yet"}</span>
</div>
