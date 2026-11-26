<script lang="ts">
  import { Slider } from "@fndn/svelte";

  /* one number on a track: the label names it, the value shows formatted at the end of the row */
  const usd = (v: number) => `$${v.toLocaleString("en-US")}`;

  let limit = $state([1200]);
</script>

<div class="flex w-80 flex-col gap-2">
  <Slider bind:value={limit} label="Monthly spend limit" showValue min={100} max={5000} step={100} formatValue={usd} />
  <p class="text-xs text-ink-2">We email maya@northwind.example when Northwind reaches 80%.</p>
</div>
