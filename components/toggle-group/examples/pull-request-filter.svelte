<script lang="ts">
  import { ToggleGroup } from "@fndn/svelte";

  /* one at most, and a second click clears it: a filter you can switch off */
  const COUNTS: Record<string, number> = { open: 12, merged: 15, closed: 4 };
  const states = [
    { value: "open", label: "Open" },
    { value: "merged", label: "Merged" },
    { value: "closed", label: "Closed" },
  ];

  let show = $state<string[]>(["open"]);
  const shown = $derived(show[0]);
</script>

<div class="flex flex-col items-start gap-2">
  <ToggleGroup bind:value={show} aria-label="Show pull requests" size="sm" items={states} />
  <p class="text-sm text-ink-2" role="status">
    {shown ? `${COUNTS[shown]} ${shown} pull requests in billing-api` : "All 31 pull requests in billing-api"}
  </p>
</div>
