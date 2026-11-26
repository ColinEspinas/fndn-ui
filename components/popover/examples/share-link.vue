<script setup lang="ts">
import { PhShareNetwork } from "@phosphor-icons/vue";
import { Button, Clipboard, Popover } from "@fndn/vue";

const previewUrl = "https://web-app-git-feat-usage-alerts.northwind.example";
</script>

<template>
  <div class="flex w-80 items-center justify-between gap-3">
    <div class="flex min-w-0 flex-col">
      <span class="text-sm font-medium text-ink">feat/usage-alerts</span>
      <span class="text-xs text-ink-2">Preview deployed 4 min ago</span>
    </div>
    <Popover
      placement="bottom-end"
      title="Share preview"
      description="Anyone in Northwind with the link can open this preview."
    >
      <template #trigger>
        <Button size="sm">
          <template #icon><PhShareNetwork data-slot="icon" weight="bold" /></template>
          Share
        </Button>
      </template>
      <Clipboard variant="field" :value="previewUrl" aria-label="Preview link" />
    </Popover>
  </div>
</template>
