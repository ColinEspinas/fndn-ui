<script setup lang="ts">
import { ref } from "vue";
import { Avatar, Drawer, TextRow } from "@fndn/vue";

const members = [
  { name: "Maya Chen", email: "maya@northwind.example", role: "Owner", lastActive: "Now" },
  { name: "Daniel Okafor", email: "daniel@northwind.example", role: "Admin", lastActive: "2 hours ago" },
  { name: "Sofia Alvarez", email: "sofia@northwind.example", role: "Viewer", lastActive: "Nov 12, 2026" },
] as const;

/* one drawer for the whole list: a row sets the member and opens it (open is controlled) */
const open = ref(false);
const member = ref<(typeof members)[number]>(members[0]);
function show(m: (typeof members)[number]) {
  member.value = m;
  open.value = true;
}
</script>

<template>
  <ul class="flex w-80 flex-col">
    <li v-for="m in members" :key="m.email">
      <button
        type="button"
        class="flex w-full items-center gap-3 rounded-control px-2 py-1.5 text-start hover:bg-hover"
        @click="show(m)"
      >
        <Avatar :name="m.name" :size="20" />
        <span class="flex-1 text-sm font-medium text-ink">{{ m.name }}</span>
        <span class="text-xs text-ink-2">{{ m.role }}</span>
      </button>
    </li>
  </ul>
  <Drawer v-model:open="open" side="end" :title="member.name" :description="member.email">
    <TextRow label="Role" :value="member.role" />
    <TextRow label="Last active" :value="member.lastActive" />
    <TextRow label="Projects" value="web-app, billing-api" />
  </Drawer>
</template>
