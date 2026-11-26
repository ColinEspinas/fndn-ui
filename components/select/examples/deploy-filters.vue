<script setup lang="ts">
import { ref } from "vue";
import { PhDownloadSimple } from "@phosphor-icons/vue";
import { Button, Select } from "@fndn/vue";

const statuses = ["All statuses", "Ready", "Building", "Failed", "Canceled"];
const ranges = ["Last 24 hours", "Last 7 days", "Last 30 days"];

const status = ref<string | null>("All statuses");
const range = ref<string | null>("Last 7 days");
</script>

<!-- sm Selects and an sm Button line up at 28px -->
<template>
  <div class="flex flex-wrap items-center gap-2">
    <Select :items="statuses" v-model:value="status" size="sm" aria-label="Status" style="width: 136px" />
    <Select :items="ranges" v-model:value="range" size="sm" aria-label="Date range" style="width: 136px" />
    <Button size="sm">
      <template #icon><PhDownloadSimple data-slot="icon" weight="bold" /></template>
      Export
    </Button>
  </div>
</template>
