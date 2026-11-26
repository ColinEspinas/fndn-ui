<script setup lang="ts">
import { ref } from "vue";
import { DatePicker } from "@fndn/vue";

const dates = ref<string[]>([]);
</script>

<template>
  <div class="flex flex-col gap-2" style="width: 220px">
    <DatePicker label="Release date" v-model:value="dates" defaultFocusedValue="2026-12-01" />
    <span class="text-sm text-ink-2">{{ dates[0] ? `Saved as ${dates[0]}` : "Not scheduled yet" }}</span>
  </div>
</template>
