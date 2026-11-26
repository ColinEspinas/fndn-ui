<script setup lang="ts">
import { ref } from "vue";
import { Pager } from "@fndn/vue";

const alerts = [
  "Error rate above 2% on billing-api",
  "p95 latency 1.8 s on web-app in Singapore",
  "data-pipeline job failed 3 times since 09:00",
  "Certificate for docs.northwind.example expires in 6 days",
];

/* alerts stacked on top of each other page up and down */
const page = ref(0);
</script>

<template>
  <div class="flex w-80 items-center gap-3">
    <p class="m-0 flex-1 text-sm text-ink">{{ alerts[page] }}</p>
    <Pager
      v-model:page="page"
      :count="alerts.length"
      orientation="vertical"
      separator="/"
      unit="Alert"
      label="Open alerts"
      prevLabel="Previous alert"
      nextLabel="Next alert"
    />
  </div>
</template>
