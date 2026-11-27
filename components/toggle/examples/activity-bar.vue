<script setup lang="ts">
import { ref } from "vue";
import { PhFolder, PhGitBranch, PhMagnifyingGlass, PhTerminal } from "@phosphor-icons/vue";
import { Toggle } from "@fndn/vue";

const views = [
  { value: "explorer", label: "Explorer", icon: PhFolder },
  { value: "search", label: "Search", icon: PhMagnifyingGlass },
  { value: "source-control", label: "Source control", icon: PhGitBranch },
  { value: "terminal", label: "Terminal", icon: PhTerminal },
];

const view = ref<string | null>("explorer");
</script>

<!-- an editor's activity bar: muted ghost toggles. The open view keeps the pressed fill and its ink;
      pressing it again closes the side bar -->
<template>
  <div role="toolbar" aria-orientation="vertical" aria-label="Views" class="flex w-11 flex-col items-center gap-1 rounded-card bg-canvas py-1.5">
    <Toggle
      v-for="v in views"
      :key="v.value"
      variant="ghost"
      size="md"
      shape="rounded"
      square
      muted
      :tooltip="v.label"
      :pressed="view === v.value"
      @update:pressed="(pressed: boolean) => (view = pressed ? v.value : null)"
    >
      <template #icon><component :is="v.icon" data-slot="icon" weight="bold" /></template>
    </Toggle>
  </div>
</template>
