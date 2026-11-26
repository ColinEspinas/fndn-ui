<script setup lang="ts">
import { Separator } from "@fndn/vue";
</script>

<template>
  <div class="flex w-72 flex-col gap-3 text-sm">
    <div>
      <p class="font-medium text-ink">Project name</p>
      <p class="text-ink-2">web-app, used in preview URLs and the CLI.</p>
    </div>
    <Separator />
    <div>
      <p class="font-medium text-ink">Production branch</p>
      <p class="text-ink-2">Pushes to main deploy to Production.</p>
    </div>
  </div>
</template>
