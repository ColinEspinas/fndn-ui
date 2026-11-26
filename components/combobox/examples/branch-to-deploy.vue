<script setup lang="ts">
import { ref } from "vue";
import { PhRocketLaunch } from "@phosphor-icons/vue";
import { Button, Combobox } from "@fndn/vue";

const branches = [
  { value: "main", label: "main", meta: "2 min ago" },
  { value: "feat/usage-alerts", label: "feat/usage-alerts", meta: "1 h ago" },
  { value: "fix/invoice-rounding", label: "fix/invoice-rounding", meta: "Yesterday" },
  { value: "release/2026.11", label: "release/2026.11", meta: "Nov 12" },
  { value: "chore/upgrade-node-22-and-pnpm-11-across-workspace", label: "chore/upgrade-node-22-and-pnpm-11-across-workspace", meta: "Nov 3" },
];

const branch = ref<string | null>("main");
</script>

<!-- sm: the combobox and the sm Button share the 28px row -->
<template>
  <div class="flex items-center gap-2">
    <Combobox :items="branches" v-model:value="branch" size="sm" aria-label="Branch" placeholder="Search branches" style="width: 200px" />
    <Button size="sm" variant="primary">
      <template #icon><PhRocketLaunch data-slot="icon" weight="bold" /></template>
      Deploy
    </Button>
  </div>
</template>
