<script setup lang="ts">
import { DatePicker } from "@fndn/vue";
</script>

<template>
  <div class="flex items-center justify-between gap-4" style="width: 360px">
    <h3 class="text-sm font-medium text-ink">Revenue</h3>
    <DatePicker size="sm" variant="ghost" aria-label="Report period" selectionMode="range" :defaultValue="['2026-12-01', '2026-12-31']" placement="bottom-end" />
  </div>
</template>
