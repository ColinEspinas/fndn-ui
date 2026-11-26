<script setup lang="ts">
import { ref } from "vue";
import { ThinkingState } from "@fndn/vue";

const expanded = ref(true);

const selected = ref(1);

const rows = [
  { primary: "Read", secondary: "src/booking/availability.test.ts", mono: true },
  {
    primary: "Edit",
    secondary: "src/booking/availability.ts",
    mono: true,
    add: 18,
    del: 6,
  },
  { primary: "Run", secondary: "pnpm test availability", mono: true },
];
</script>

<template>
  <ThinkingState
    variant="coding"
    v-model:expanded="expanded"
    v-model:selected="selected"
    doneLabel="Ran 3 tools"
    :rows="rows"
  />
</template>
