<script setup lang="ts">
import { PhWarningCircle } from "@phosphor-icons/vue";
import { Button, Shimmer } from "@fndn/vue";
</script>

<template>
  <div class="flex w-80 max-w-full items-center gap-2 text-sm">
    <PhWarningCircle data-slot="icon" weight="fill" class="shrink-0 text-red" aria-hidden="true" />
    <span class="min-w-0 flex-1 text-ink-2">Build failed on main · a1b2c3d</span>
    <Button size="sm" variant="ghost">
      <Shimmer speed="fast" tone="accent">Suggest a fix</Shimmer>
    </Button>
  </div>
</template>
