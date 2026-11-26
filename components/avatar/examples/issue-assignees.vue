<script setup lang="ts">
import { Avatar } from "@fndn/vue";

const assignees = [
  { name: "Lucas Moreau", photo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%236f9e8c'/%3E%3Ccircle cx='20' cy='16' r='8' fill='%23f6e7d8'/%3E%3Cpath d='M6 40a14 12 0 0 1 28 0z' fill='%23f6e7d8'/%3E%3C/svg%3E" },
  { name: "Aiko Tanaka", photo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23c98aa0'/%3E%3Ccircle cx='20' cy='16' r='8' fill='%23f6e7d8'/%3E%3Cpath d='M6 40a14 12 0 0 1 28 0z' fill='%23f6e7d8'/%3E%3C/svg%3E" },
  { name: "Jonas Weber", photo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%237fa6c9'/%3E%3Ccircle cx='20' cy='16' r='8' fill='%23f6e7d8'/%3E%3Cpath d='M6 40a14 12 0 0 1 28 0z' fill='%23f6e7d8'/%3E%3C/svg%3E" },
];
</script>

<!-- a stack: each avatar overlaps the last, a ring in the surface colour keeps them apart; photos read better than initials when they overlap -->
<template>
  <div class="flex w-80 items-center gap-3 text-sm">
    <div class="min-w-0 flex-1">
      <p class="font-medium text-ink">Usage alerts fire twice for one project</p>
      <p class="text-ink-2">#503 · data-pipeline</p>
    </div>
    <div class="flex -space-x-1">
      <Avatar v-for="person in assignees" :key="person.name" :name="person.name" :src="person.photo" size="20" class="ring-2 ring-surface" />
    </div>
  </div>
</template>
