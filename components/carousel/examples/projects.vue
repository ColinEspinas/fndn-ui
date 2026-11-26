<script setup lang="ts">
import { Carousel } from "@fndn/vue";

const projects = [
  { name: "web-app", detail: "Deployed 2 min ago" },
  { name: "billing-api", detail: "Deployed 1 h ago" },
  { name: "mobile", detail: "Building" },
  { name: "docs-site", detail: "Deployed yesterday" },
  { name: "data-pipeline", detail: "Failed on Staging" },
];
</script>

<template>
  <Carousel class="w-full max-w-lg" label="Projects" :slides-per-page="3" :spacing="8" indicators :items="projects.map((project) => ({ label: project.name }))">
    <template #slide="{ index }">
      <div class="flex h-20 flex-col justify-end gap-0.5 bg-inset p-3 text-sm">
        <p class="truncate font-medium text-ink">{{ projects[index]!.name }}</p>
        <p class="truncate text-xs text-ink-2">{{ projects[index]!.detail }}</p>
      </div>
    </template>
  </Carousel>
</template>
