<script setup lang="ts">
import { computed, ref } from "vue";
import { TreeView, type TreeViewNode } from "@fndn/vue";

const items: TreeViewNode[] = [
  { value: "general", label: "General" },
  {
    value: "members", label: "Members",
    children: [
      { value: "people", label: "People" },
      { value: "roles", label: "Roles" },
      { value: "invitations", label: "Invitations" },
    ],
  },
  { value: "billing", label: "Billing" },
  { value: "api-keys", label: "API keys" },
];

const pages: Record<string, string> = {
  general: "Workspace name, URL and default region.",
  people: "7 members. Maya Chen is the owner.",
  roles: "Owner, Admin, Developer and Viewer.",
  invitations: "2 invitations waiting, sent Nov 14, 2026.",
  billing: "Team plan, $1,240.00 a month.",
  "api-keys": "3 keys. nw_live_… was last used 2 min ago.",
};

/* the selection drives the pane: controlled, with a branch open from the start */
const selected = ref(["roles"]);
const expanded = ref(["members"]);
const current = computed(() => selected.value[0] ?? "general");
</script>

<template>
  <div class="flex w-[480px] max-w-full items-start gap-6">
    <TreeView
      v-model:selectedValue="selected"
      v-model:expandedValue="expanded"
      class="w-44 shrink-0"
      aria-label="Workspace settings"
      :items="items"
    />
    <p class="m-0 pt-1.5 text-sm text-ink-2">{{ pages[current] ?? "Pick a page on the left." }}</p>
  </div>
</template>
