<script setup lang="ts">
import { TextRow } from "@fndn/vue";

const lines = [
  { label: "Team plan", value: "$240.00", meta: "12 seats" },
  { label: "Extra build minutes", value: "$18.00", meta: "1,200 min" },
  { label: "Total for November", value: "$258.00" },
];
</script>

<template>
  <div class="flex w-80 flex-col divide-y divide-line">
    <TextRow v-for="line in lines" :key="line.label" :label="line.label" :value="line.value" :meta="line.meta" />
  </div>
</template>
