<script setup lang="ts">
import { Pager } from "@fndn/vue";
</script>

<!-- with a single page both buttons are disabled, and the pager stays in its place -->
<template>
  <div class="flex w-80 items-center justify-between gap-3">
    <span class="text-sm text-ink-2">1 deploy matches “usage-alerts”</span>
    <Pager :count="1" label="Matching deploys" prevLabel="Previous match" nextLabel="Next match" />
  </div>
</template>
