<script setup lang="ts">
import { PhTrash } from "@phosphor-icons/vue";
import { AlertDialog, Button, Tooltip } from "@fndn/vue";

const key = { name: "Production server", hint: "nw_live_…4f2a", lastUsed: "Used 3 min ago" };
</script>

<!-- your own trigger: the row's icon button, named by its tooltip -->
<template>
  <div class="flex w-80 items-center gap-3">
    <div class="min-w-0 flex-1">
      <div class="text-sm font-medium text-ink">{{ key.name }}</div>
      <div class="text-xs text-ink-2"><span class="font-mono">{{ key.hint }}</span> · {{ key.lastUsed }}</div>
    </div>
    <AlertDialog
      :title="`Revoke the ${key.name} key?`"
      :description="`Apps that use ${key.hint} stop working at once. Create a new key before you revoke this one.`"
      actionLabel="Revoke key"
    >
      <template #trigger>
        <Tooltip content="Revoke key">
          <Button variant="ghost" size="sm" square muted :aria-label="`Revoke ${key.name} key`">
            <template #icon><PhTrash data-slot="icon" weight="bold" /></template>
          </Button>
        </Tooltip>
      </template>
    </AlertDialog>
  </div>
</template>
