<script setup lang="ts">
import { PhSidebarSimple } from "@phosphor-icons/vue";
import { Button, Tooltip } from "@fndn/vue";
</script>

<template>
  <div class="flex items-center gap-2">
    <Tooltip content="Toggle sidebar" shortcut="⌘." placement="bottom-start">
      <Button variant="ghost" size="sm" square aria-label="Toggle sidebar">
        <template #icon><PhSidebarSimple data-slot="icon" weight="bold" /></template>
      </Button>
    </Tooltip>
    <span class="text-sm font-medium text-ink">Deploys</span>
  </div>
</template>
