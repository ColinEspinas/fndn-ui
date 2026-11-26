<script lang="ts">
  import { NumberInput } from "@fndn/svelte";

  let seats = $state("12");
</script>

<!-- min and max bound the steppers, the arrow keys and what can be typed -->
<NumberInput bind:value={seats} label="Seats" min={1} max={500} class="w-40" />
