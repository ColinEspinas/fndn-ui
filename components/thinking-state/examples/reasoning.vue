<script setup lang="ts">
import { ref } from "vue";
import { ThinkingState } from "@fndn/vue";

const expanded = ref(true);

const rows = [
  {
    primary: "Errors on harbor/api rose from 0.2% to 4.1% right after the 14:05 deploy, and every failing request hits /v2/availability.",
  },
  {
    primary: "Rolling back to #481 is safe: migration 0142 only adds a nullable column, so the previous build still reads the bookings table.",
  },
];
</script>

<template>
  <ThinkingState
    variant="reasoning"
    v-model:expanded="expanded"
    doneLabel="Thought for 6 seconds"
    :rows="rows"
  />
</template>
