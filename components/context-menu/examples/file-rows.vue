<script setup lang="ts">
import { PhArrowSquareOut, PhCopy, PhFile, PhPencilSimple, PhTrash } from "@phosphor-icons/vue";
import { ContextMenu, type MenuEntry } from "@fndn/vue";

const files = [
  { name: "deliver.ts", modified: "2 min ago" },
  { name: "retry-policy.ts", modified: "Yesterday" },
  { name: "deliver.test.ts", modified: "Nov 12" },
];

const actions: MenuEntry[] = [
  { value: "open", label: "Open", icon: PhArrowSquareOut },
  { value: "copy-path", label: "Copy path", icon: PhCopy },
  { value: "rename", label: "Rename", icon: PhPencilSimple },
  { type: "separator" },
  { value: "delete", label: "Delete", tone: "danger", icon: PhTrash },
];
</script>

<!-- each row is its own area: right-click, long press or Shift+F10 opens the menu for that file -->
<template>
  <div class="flex w-80 flex-col">
    <ContextMenu v-for="file in files" :key="file.name" :items="actions" :label="file.name" class="flex items-center gap-2 rounded-control px-2 py-1.5">
      <PhFile class="size-4 shrink-0 text-ink-3" weight="bold" />
      <span class="flex-1 font-mono text-sm text-ink">{{ file.name }}</span>
      <span class="text-xs text-ink-2">{{ file.modified }}</span>
    </ContextMenu>
  </div>
</template>
