<script lang="ts">
  import { Rating } from "@fndn/svelte";

  /* half stars: the first half of a star picks .5 */
  let score = $state(3.5);
</script>

<div class="flex flex-col gap-2">
  <Rating bind:value={score} label="Rate the Status page template" allowHalf />
  <p class="text-xs text-ink-2 tabular-nums">{score.toFixed(1)} of 5</p>
</div>
