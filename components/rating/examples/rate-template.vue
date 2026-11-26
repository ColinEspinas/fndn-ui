<script setup lang="ts">
import { ref } from "vue";
import { Rating } from "@fndn/vue";

/* half stars: the first half of a star picks .5 */
const score = ref(3.5);
</script>

<template>
  <div class="flex flex-col gap-2">
    <Rating v-model:value="score" label="Rate the Status page template" allow-half />
    <p class="text-xs text-ink-2 tabular-nums">{{ score.toFixed(1) }} of 5</p>
  </div>
</template>
