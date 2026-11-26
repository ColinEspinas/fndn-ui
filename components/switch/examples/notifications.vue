<script setup lang="ts">
import { ref } from "vue";
import { Separator, Switch } from "@fndn/vue";

/* a settings list: label at the start, switch at the end of each row */
const settings = [
  { id: "deploy-failed", label: "A deploy fails" },
  { id: "review-requested", label: "Someone requests your review" },
  { id: "weekly-usage", label: "Weekly usage summary for Northwind" },
];

const on = ref<Record<string, boolean>>({ "deploy-failed": true, "review-requested": true, "weekly-usage": false });
</script>

<template>
  <div class="flex w-80 flex-col">
    <div v-for="(s, i) in settings" :key="s.id">
      <Separator v-if="i > 0" class="my-2" />
      <div class="flex items-center justify-between gap-4">
        <span :id="s.id" class="text-sm text-ink">{{ s.label }}</span>
        <Switch v-model:checked="on[s.id]" size="sm" :aria-labelledby="s.id" />
      </div>
    </div>
  </div>
</template>
