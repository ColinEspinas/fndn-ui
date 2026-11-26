<script setup lang="ts">
import { Kbd } from "@fndn/vue";

/* a shortcuts list: the action at the start, its keys at the end; a sequence reads "then" */
const shortcuts = [
  { action: "Search projects and people", keys: [["⌘", "K"]] },
  { action: "New project", keys: [["C"]] },
  { action: "Go to deploys", keys: [["G"], ["D"]] },
  { action: "Toggle the sidebar", keys: [["⌘", "B"]] },
];
</script>

<template>
  <dl class="flex w-80 flex-col gap-2 text-sm">
    <div v-for="s in shortcuts" :key="s.action" class="flex items-center justify-between gap-4">
      <dt class="text-ink-2">{{ s.action }}</dt>
      <dd class="flex items-center gap-1 text-xs text-ink-2">
        <span v-for="(k, i) in s.keys" :key="i" class="contents"><template v-if="i > 0">then</template><Kbd :keys="k" /></span>
      </dd>
    </div>
  </dl>
</template>
