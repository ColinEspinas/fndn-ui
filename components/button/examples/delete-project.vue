<script setup lang="ts">
import { PhTrash } from "@phosphor-icons/vue";
import { Button } from "@fndn/vue";
</script>

<!-- a danger zone: the outline danger look (red edge, red fill on hover); the filled danger is for the confirmation that follows. The label names what goes -->
<template>
  <div class="flex max-w-96 flex-col items-start gap-3">
    <div>
      <p class="text-sm font-medium text-ink">Delete billing-api</p>
      <p class="text-sm text-ink-2">Removes 128 deploys, 3 environments and every API key of this project.</p>
    </div>
    <Button variant="danger-outline">
      <template #icon><PhTrash data-slot="icon" weight="bold" /></template>
      Delete project
    </Button>
  </div>
</template>
