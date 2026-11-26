<script lang="ts">
  import { Slider } from "@fndn/svelte";

  /* controlled: the price under the slider follows it while it moves */
  const PRICE = 18;

  let replicas = $state([3]);
  const count = $derived(replicas[0] ?? 1);
</script>

<div class="flex w-80 flex-col gap-2">
  <Slider bind:value={replicas} label="Replicas of billing-api" showValue min={1} max={10} />
  <p class="text-sm text-ink-2 tabular-nums">
    {count} × ${PRICE} = <span class="text-ink">${count * PRICE}.00</span> per month
  </p>
</div>
