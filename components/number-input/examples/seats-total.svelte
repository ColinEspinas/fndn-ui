<script lang="ts">
  import { NumberInput } from "@fndn/svelte";

  const price = 20;
  let seats = $state("8");
  const count = $derived(Number(seats) || 0);
</script>

<!-- controlled: the total follows the value as it changes -->
<div class="flex items-end gap-3">
  <NumberInput bind:value={seats} label="Seats on Team" min={1} max={500} class="w-36" />
  <span class="pb-1.5 text-sm text-ink-2">${(count * price).toLocaleString("en-US")} a month</span>
</div>
