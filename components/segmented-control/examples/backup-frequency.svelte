<script lang="ts">
  import { SegmentedControl } from "@fndn/svelte";

  /* fill: equal segments across a settings panel; an option the plan lacks is disabled and explained */
  const frequencies = [
    { value: "hourly", label: "Hourly", disabled: true },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
  ];
  let frequency = $state("daily");
</script>

<div class="flex w-80 flex-col gap-2">
  <p id="backup-label" class="text-sm font-medium text-ink">Database backups</p>
  <SegmentedControl bind:value={frequency} fill options={frequencies} aria-labelledby="backup-label" />
  <p class="text-xs text-ink-2">Hourly backups are on the Business plan.</p>
</div>
