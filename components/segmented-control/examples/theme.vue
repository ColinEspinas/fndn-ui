<script setup lang="ts">
import { ref } from "vue";
import { PhMonitor, PhMoon, PhSun } from "@phosphor-icons/vue";
import { SegmentedControl } from "@fndn/vue";

/* icons: square cells; each label stays in the markup as the accessible name */
const themes = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];
const theme = ref("system");
</script>

<template>
  <div class="flex items-center gap-3">
    <span class="text-sm text-ink-2">Theme</span>
    <SegmentedControl v-model:value="theme" :options="themes" size="sm" icons aria-label="Theme">
      <template #icon="{ option }">
        <PhSun v-if="option.value === 'light'" data-slot="icon" weight="fill" />
        <PhMoon v-else-if="option.value === 'dark'" data-slot="icon" weight="fill" />
        <PhMonitor v-else data-slot="icon" weight="bold" />
      </template>
    </SegmentedControl>
  </div>
</template>
