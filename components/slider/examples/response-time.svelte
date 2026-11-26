<script lang="ts">
  import { Slider } from "@fndn/svelte";

  /* a range: two thumbs, each named, kept a few steps apart */
  let range = $state([120, 800]);
</script>

<Slider
  bind:value={range}
  label="Response time"
  showValue
  min={0}
  max={2000}
  step={10}
  minStepsBetweenThumbs={5}
  thumbLabels={["Fastest", "Slowest"]}
  formatValue={(v) => `${v} ms`}
  class="w-80"
/>
