<script setup lang="ts">
import { ref } from "vue";
import { Button, Splitter } from "@fndn/vue";

const panels = [
  { id: "pull-request", content: "#482 Add retry to webhook delivery. Daniel Okafor wants to merge 3 commits into main.", minSize: 20 },
  { id: "change", content: "src/webhooks/deliver.ts, +4 −1: a failed delivery now retries five times with exponential backoff.", minSize: 25 },
  { id: "checks", content: "Build passed, 12 tests passed, preview ready.", minSize: 20 },
];
const initial = [30, 40, 30];
const size = ref(initial);
</script>

<template>
  <div class="flex w-full max-w-xl flex-col items-start gap-3">
    <div class="h-44 w-full rounded-card bg-surface shadow-card">
      <Splitter v-model:size="size" grip :panels="panels" />
    </div>
    <Button size="sm" @click="size = initial">Reset layout</Button>
  </div>
</template>
