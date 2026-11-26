<script setup lang="ts">
import { PhCopy, PhDotsThree, PhFolder, PhPencilSimple, PhTrash } from "@phosphor-icons/vue";
import { Button, Menu, Tooltip, type MenuEntry } from "@fndn/vue";

const projects = [
  { name: "web-app", meta: "Deployed 2 min ago by Maya Chen" },
  { name: "billing-api", meta: "Deployed yesterday by Daniel Okafor" },
  { name: "data-pipeline", meta: "No deploys yet" },
];

const actions: MenuEntry[] = [
  { value: "rename", label: "Rename", icon: PhPencilSimple },
  { value: "duplicate", label: "Duplicate", icon: PhCopy },
  { value: "move", label: "Move to…", icon: PhFolder },
  { type: "separator" },
  { value: "delete", label: "Delete", tone: "danger", icon: PhTrash },
];
</script>

<template>
  <ul class="flex w-80 flex-col gap-1">
    <li v-for="project in projects" :key="project.name" class="flex items-center gap-3">
      <div class="flex min-w-0 flex-1 flex-col">
        <span class="text-sm font-medium text-ink">{{ project.name }}</span>
        <span class="text-xs text-ink-2">{{ project.meta }}</span>
      </div>
      <Menu placement="bottom-end" :items="actions">
        <template #trigger>
          <Tooltip content="More actions">
            <Button variant="ghost" size="sm" square :aria-label="`More actions for ${project.name}`">
              <template #icon><PhDotsThree data-slot="icon" weight="bold" /></template>
            </Button>
          </Tooltip>
        </template>
      </Menu>
    </li>
  </ul>
</template>
