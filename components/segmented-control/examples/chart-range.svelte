<script lang="ts">
  import { SegmentedControl } from "@fndn/svelte";

  /* one of a few ranges, side by side; the figure under it follows the choice */
  const ranges = [
    { value: "24h", label: "24h" },
    { value: "7d", label: "7d" },
    { value: "30d", label: "30d" },
    { value: "90d", label: "90d" },
  ];
  const REQUESTS: Record<string, string> = { "24h": "182,400", "7d": "1.2M", "30d": "5.6M", "90d": "16.9M" };

  let range = $state("7d");
</script>

<div class="flex w-80 flex-col gap-1">
  <div class="flex items-center justify-between gap-3">
    <p class="text-sm font-medium text-ink">Requests</p>
    <SegmentedControl bind:value={range} size="sm" options={ranges} aria-label="Range" />
  </div>
  <p class="text-2xl font-semibold text-ink tabular-nums">{REQUESTS[range]}</p>
  <p class="text-xs text-ink-2">web-app · Production · 98.2% under 300 ms</p>
</div>
