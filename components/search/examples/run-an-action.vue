<script setup lang="ts">
import { ref } from "vue";
import { Search, type SearchItem } from "@fndn/vue";

/* the meta carries the shortcut; an action you may not take stays listed, disabled */
const actions: SearchItem[] = [
  { value: "Deploy web-app to Production", label: "Deploy web-app to Production", meta: "⌘D" },
  { value: "Roll back to dpl_7f3a9c", label: "Roll back to dpl_7f3a9c" },
  { value: "Copy the latest commit", label: "Copy the latest commit", meta: "⌘⇧C" },
  { value: "Delete workspace", label: "Delete workspace", meta: "Owner only", disabled: true },
];

const ran = ref("");
</script>

<template>
  <div class="flex w-80 flex-col gap-2">
    <Search :items="actions" label="Run an action" placeholder="Run an action…" @select="(value) => (ran = value)" />
    <p class="text-xs text-ink-2">{{ ran ? `Started: ${ran}` : "Pick an action, or type to filter." }}</p>
  </div>
</template>
