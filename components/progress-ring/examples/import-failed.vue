<script setup lang="ts">
import { Button, ProgressRing } from "@fndn/vue";
</script>

<template>
  <div class="flex w-80 items-center gap-3 text-sm">
    <ProgressRing :progress="0.42" tone="red" label="Import stopped at 42%">!</ProgressRing>
    <div class="min-w-0 flex-1">
      <p class="font-medium text-ink">Import stopped at 42%</p>
      <p class="text-ink-2">data-pipeline lost its connection after 18,240 of 43,500 events.</p>
    </div>
    <Button size="sm">Retry</Button>
  </div>
</template>
