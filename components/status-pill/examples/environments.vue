<script setup lang="ts">
import { StatusPill } from "@fndn/vue";

/* a neutral pill whose dot alone carries the colour: a category, not a state */
const environments = [
  { name: "Production", dot: "green" },
  { name: "Staging", dot: "yellow" },
  { name: "Preview", dot: "purple" },
] as const;
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <StatusPill v-for="env in environments" :key="env.name" tone="neutral" :dotTone="env.dot">{{ env.name }}</StatusPill>
  </div>
</template>
