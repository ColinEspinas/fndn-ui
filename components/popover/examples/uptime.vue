<script setup lang="ts">
import { PhInfo } from "@phosphor-icons/vue";
import { Button, Popover } from "@fndn/vue";
</script>

<!-- a short explanation, no title or close button: Escape or a click outside closes it -->
<template>
  <div class="flex items-center gap-1">
    <span class="text-sm text-ink-2">Uptime, last 30 days</span>
    <span class="text-sm font-medium text-ink">98.2%</span>
    <Popover :closable="false" placement="top">
      <template #trigger>
        <Button variant="ghost" size="xs" square muted aria-label="How uptime is measured">
          <template #icon><PhInfo data-slot="icon" weight="bold" /></template>
        </Button>
      </template>
      Checked every minute from Frankfurt, Virginia and Singapore. Planned maintenance on Nov 9 is not counted.
    </Popover>
  </div>
</template>
