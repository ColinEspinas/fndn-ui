<script lang="ts">
  import { NumberInput } from "@fndn/svelte";

  let limit = $state("500");
</script>

<!-- formatOptions shows the value as money; the steppers move by $50 -->
<NumberInput
  bind:value={limit}
  label="Monthly spend limit"
  min={0}
  step={50}
  formatOptions={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
  class="w-48"
/>
