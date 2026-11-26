<script setup lang="ts">
import { ref } from "vue";
import { SegmentedControl } from "@fndn/vue";

/* fill: equal segments across a settings panel; an option the plan lacks is disabled and explained */
const frequencies = [
  { value: "hourly", label: "Hourly", disabled: true },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];
const frequency = ref("daily");
</script>

<template>
  <div class="flex w-80 flex-col gap-2">
    <p id="backup-label" class="text-sm font-medium text-ink">Database backups</p>
    <SegmentedControl v-model:value="frequency" fill :options="frequencies" aria-labelledby="backup-label" />
    <p class="text-xs text-ink-2">Hourly backups are on the Business plan.</p>
  </div>
</template>
