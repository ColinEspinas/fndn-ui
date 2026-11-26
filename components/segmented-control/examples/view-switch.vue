<script setup lang="ts">
import { ref } from "vue";
import { PhColumns, PhListBullets, PhPlus } from "@phosphor-icons/vue";
import { Button, SegmentedControl } from "@fndn/vue";

/* sm (28px) beside an sm Button: one control height across the toolbar */
const views = [
  { value: "list", label: "List" },
  { value: "board", label: "Board" },
];
const view = ref("board");
</script>

<template>
  <div class="flex w-80 items-center justify-between gap-3">
    <SegmentedControl v-model:value="view" size="sm" :options="views" aria-label="View">
      <template #icon="{ option }">
        <PhListBullets v-if="option.value === 'list'" data-slot="icon" weight="bold" />
        <PhColumns v-else data-slot="icon" weight="bold" />
      </template>
    </SegmentedControl>
    <Button variant="primary" size="sm">
      <template #icon><PhPlus data-slot="icon" weight="bold" /></template>
      New project
    </Button>
  </div>
</template>
