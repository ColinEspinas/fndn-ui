<script setup lang="ts">
import { Avatar } from "@fndn/vue";

const projects = [
  { name: "web-app", initials: "W", color: "var(--fndn-tag-orange)", env: "Production" },
  { name: "billing-api", initials: "B", color: "var(--fndn-tag-purple)", env: "Production" },
  { name: "docs-site", initials: "D", color: "var(--fndn-tag-cyan)", env: "Preview" },
];
</script>

<!-- square for things (projects, workspaces), round for people -->
<template>
  <ul class="flex w-64 flex-col gap-2.5 text-sm">
    <li v-for="project in projects" :key="project.name" class="flex items-center gap-2.5">
      <Avatar :name="project.name" :initials="project.initials" :color="project.color" shape="square" size="20" />
      <span class="flex-1 font-medium text-ink">{{ project.name }}</span>
      <span class="text-ink-2">{{ project.env }}</span>
    </li>
  </ul>
</template>
