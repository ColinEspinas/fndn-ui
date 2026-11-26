<script setup lang="ts">
import { ref } from "vue";
import { SegmentedControl } from "@fndn/vue";

/* chips: a filter row over a list, each with a status dot and a count */
const states = [
  { value: "all", label: "All", count: 31 },
  { value: "open", label: "Open", dot: "green" as const, count: 12 },
  { value: "draft", label: "Draft", dot: true as const, count: 4 },
  { value: "merged", label: "Merged", dot: "purple" as const, count: 15 },
];

const status = ref("open");
</script>

<template>
  <SegmentedControl v-model:value="status" variant="chips" :options="states" aria-label="Pull requests by status" />
</template>
