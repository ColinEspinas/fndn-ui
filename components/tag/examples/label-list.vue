<script setup lang="ts">
import { Count, Tag } from "@fndn/vue";

const labels = [
  { name: "bug", tone: "red", open: 14 },
  { name: "feature", tone: "green", open: 32 },
  { name: "docs", tone: "blue", open: 6 },
] as const;
</script>

<!-- a dot carries the hue where the label stands on its own -->
<template>
  <ul class="flex w-48 flex-col gap-1.5 text-sm">
    <li v-for="label in labels" :key="label.name" class="flex items-center justify-between gap-3">
      <Tag :tone="label.tone" dot>{{ label.name }}</Tag>
      <Count>{{ label.open }}</Count>
    </li>
  </ul>
</template>
