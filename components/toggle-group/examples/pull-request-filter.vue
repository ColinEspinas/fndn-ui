<script setup lang="ts">
import { computed, ref } from "vue";
import { ToggleGroup } from "@fndn/vue";

/* one at most, and a second click clears it: a filter you can switch off */
const COUNTS: Record<string, number> = { open: 12, merged: 15, closed: 4 };
const states = [
  { value: "open", label: "Open" },
  { value: "merged", label: "Merged" },
  { value: "closed", label: "Closed" },
];

const show = ref<string[]>(["open"]);
const state = computed(() => show.value[0]);
</script>

<template>
  <div class="flex flex-col items-start gap-2">
    <ToggleGroup v-model:value="show" aria-label="Show pull requests" size="sm" :items="states" />
    <p class="text-sm text-ink-2" role="status">
      {{ state ? `${COUNTS[state]} ${state} pull requests in billing-api` : "All 31 pull requests in billing-api" }}
    </p>
  </div>
</template>
