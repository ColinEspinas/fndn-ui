<script setup lang="ts">
import { ref } from "vue";
import { PhArrowDown, PhClock, PhTextAlignLeft } from "@phosphor-icons/vue";
import { Toggle } from "@fndn/vue";

const timestamps = ref(true);
const wrap = ref(false);
const follow = ref(true);
</script>

<!-- icon-only toggles: ghost, muted and square; the tooltip names each one -->
<template>
  <div class="flex items-center gap-3">
    <span class="text-sm text-ink-2">Build log · dpl_7f3a9c</span>
    <div role="toolbar" aria-label="Log options" class="flex items-center gap-0.5">
      <Toggle variant="ghost" size="sm" square muted v-model:pressed="timestamps" tooltip="Show timestamps">
        <template #icon><PhClock data-slot="icon" weight="bold" /></template>
      </Toggle>
      <Toggle variant="ghost" size="sm" square muted v-model:pressed="wrap" tooltip="Wrap long lines">
        <template #icon><PhTextAlignLeft data-slot="icon" weight="bold" /></template>
      </Toggle>
      <Toggle variant="ghost" size="sm" square muted v-model:pressed="follow" tooltip="Follow new output">
        <template #icon><PhArrowDown data-slot="icon" weight="bold" /></template>
      </Toggle>
    </div>
  </div>
</template>
