<script setup lang="ts">
import { PhArrowsClockwise, PhCopy, PhTerminal, PhTrash } from "@phosphor-icons/vue";
import { ContextMenu, StatusPill, type MenuEntry } from "@fndn/vue";

const items: MenuEntry[] = [
  { value: "logs", label: "View build logs", icon: PhTerminal },
  { value: "copy-id", label: "Copy deploy ID", icon: PhCopy },
  {
    type: "submenu",
    label: "Redeploy to",
    icon: PhArrowsClockwise,
    items: [
      { value: "redeploy:production", label: "Production" },
      { value: "redeploy:staging", label: "Staging" },
      { value: "redeploy:preview", label: "Preview" },
    ],
  },
  { type: "separator" },
  { value: "delete", label: "Delete deploy", tone: "danger", icon: PhTrash },
];
</script>

<template>
  <ContextMenu :items="items" label="Deploy dpl_7f3a9c" class="flex w-80 items-center gap-3 rounded-control px-2 py-1.5">
    <StatusPill tone="green">Ready</StatusPill>
    <div class="flex min-w-0 flex-1 flex-col">
      <span class="font-mono text-sm text-ink">dpl_7f3a9c</span>
      <span class="text-xs text-ink-2">main · a1b2c3d</span>
    </div>
    <span class="text-xs text-ink-2">2 min ago</span>
  </ContextMenu>
</template>
