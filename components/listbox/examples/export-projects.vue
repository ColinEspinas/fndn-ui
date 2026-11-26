<script setup lang="ts">
import { ref } from "vue";
import { Listbox } from "@fndn/vue";

const projects = ["web-app", "billing-api", "mobile", "docs-site", "data-pipeline"];
const picked = ref<string[]>(["web-app", "billing-api"]);
</script>

<template>
  <div class="flex flex-col gap-2" style="width: 240px">
    <Listbox :items="projects" v-model:value="picked" label="Projects to export" selection-mode="multiple" />
    <span class="text-sm text-ink-2">{{ picked.length ? `${picked.length} of ${projects.length} projects` : "Pick at least one project." }}</span>
  </div>
</template>
