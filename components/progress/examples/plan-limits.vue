<script setup lang="ts">
import { Progress } from "@fndn/vue";

const meters = [
  { label: "Build minutes", value: 71, text: "2,140 of 3,000 min", tone: "accent" },
  { label: "Bandwidth", value: 92, text: "92 of 100 GB", tone: "orange" },
  { label: "Seats", value: 100, text: "12 of 12 seats", tone: "red" },
] as const;
</script>

<template>
  <div class="flex w-full max-w-sm flex-col gap-4">
    <Progress v-for="meter in meters" :key="meter.label" :value="meter.value" :label="meter.label" show-value :value-text="meter.text" :tone="meter.tone" />
  </div>
</template>
