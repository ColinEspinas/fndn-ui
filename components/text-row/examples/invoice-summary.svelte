<script lang="ts">
  import { TextRow } from "@fndn/svelte";

  const lines = [
    { label: "Team plan", value: "$240.00", meta: "12 seats" },
    { label: "Extra build minutes", value: "$18.00", meta: "1,200 min" },
    { label: "Total for November", value: "$258.00" },
  ];
</script>

<div class="flex w-80 flex-col divide-y divide-line">
  {#each lines as line (line.label)}
    <TextRow label={line.label} value={line.value} meta={line.meta} />
  {/each}
</div>
