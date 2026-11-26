<script setup lang="ts">
import { PhSlidersHorizontal } from "@phosphor-icons/vue";
import { Button, Menu, type MenuEntry } from "@fndn/vue";

/* options keep their own state; listen to @radio-change / @checked-change to store them */
const items: MenuEntry[] = [
  {
    type: "radio-group",
    name: "sort",
    label: "Sort by",
    value: "deployed",
    items: [
      { value: "deployed", label: "Last deploy" },
      { value: "name", label: "Project name" },
      { value: "status", label: "Status" },
    ],
  },
  { type: "separator" },
  {
    type: "group",
    label: "Columns",
    items: [
      { type: "checkbox", value: "branch", label: "Branch", checked: true },
      { type: "checkbox", value: "author", label: "Deployed by", checked: true },
      { type: "checkbox", value: "duration", label: "Build time" },
    ],
  },
];
</script>

<template>
  <Menu :items="items">
    <template #trigger>
      <Button size="sm">
        <template #icon><PhSlidersHorizontal data-slot="icon" weight="bold" /></template>
        View
      </Button>
    </template>
  </Menu>
</template>
