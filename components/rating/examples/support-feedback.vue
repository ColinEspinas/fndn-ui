<script setup lang="ts">
import { ref } from "vue";
import { Rating } from "@fndn/vue";

/* asking for a score: the label is the question, a word under the stars says what the score means */
const WORDS = ["", "Did not help", "Slow to help", "Solved it eventually", "Quick and clear", "Excellent"];

const score = ref(4);
</script>

<template>
  <div class="flex flex-col gap-2">
    <Rating v-model:value="score" label="How was your chat with Aiko Tanaka?" />
    <p class="h-4 text-xs text-ink-2" aria-live="polite">{{ WORDS[score] }}</p>
  </div>
</template>
