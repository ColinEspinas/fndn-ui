<script setup lang="ts">
import { PhBrowsers } from "@phosphor-icons/vue";
import { AspectRatio, StatusPill } from "@fndn/vue";
</script>

<template>
  <div class="flex w-80 max-w-full items-center gap-3">
    <div class="w-36 shrink-0">
      <AspectRatio :ratio="16 / 9" class="rounded-control bg-inset">
        <div class="grid place-items-center text-ink-3">
          <PhBrowsers data-slot="icon" weight="bold" class="text-2xl" aria-hidden="true" />
        </div>
      </AspectRatio>
    </div>
    <div class="flex min-w-0 flex-col items-start gap-1 text-sm">
      <p class="font-medium text-ink">web-app</p>
      <p class="max-w-full truncate text-ink-2" title="feat/usage-alerts">feat/usage-alerts</p>
      <StatusPill tone="green" size="sm">Ready</StatusPill>
    </div>
  </div>
</template>
