<script setup lang="ts">
import { ref } from "vue";
import { Avatar, Select } from "@fndn/vue";

const roles = [
  { value: "owner", label: "Owner", disabled: true },
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

const members = ref([
  { name: "Maya Chen", email: "maya@northwind.example", role: "owner" },
  { name: "Daniel Okafor", email: "daniel@northwind.example", role: "admin" },
  { name: "Priya Raman", email: "priya@northwind.example", role: "viewer" },
]);
</script>

<!-- ghost: reads as text in a dense list until it is hovered or focused -->
<template>
  <ul class="m-0 flex w-full max-w-[360px] list-none flex-col gap-3 p-0">
    <li v-for="member in members" :key="member.email" class="flex items-center gap-3">
      <Avatar :name="member.name" :size="20" />
      <div class="flex min-w-0 flex-1 flex-col">
        <span class="text-sm font-medium text-ink">{{ member.name }}</span>
        <span class="truncate text-xs text-ink-2" :title="member.email">{{ member.email }}</span>
      </div>
      <Select
        :items="roles"
        v-model:value="member.role"
        size="sm"
        variant="ghost"
        placement="bottom-end"
        :disabled="member.role === 'owner'"
        :aria-label="`Role of ${member.name}`"
      />
    </li>
  </ul>
</template>
