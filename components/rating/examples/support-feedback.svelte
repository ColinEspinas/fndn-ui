<script lang="ts">
  import { Rating } from "@fndn/svelte";

  /* asking for a score: the label is the question, a word under the stars says what the score means */
  const WORDS = ["", "Did not help", "Slow to help", "Solved it eventually", "Quick and clear", "Excellent"];

  let score = $state(4);
</script>

<div class="flex flex-col gap-2">
  <Rating bind:value={score} label="How was your chat with Aiko Tanaka?" />
  <p class="h-4 text-xs text-ink-2" aria-live="polite">{WORDS[score]}</p>
</div>
