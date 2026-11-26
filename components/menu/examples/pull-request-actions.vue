<script setup lang="ts">
import { ref } from "vue";
import { PhDotsThree, PhTag, PhUserPlus, PhX } from "@phosphor-icons/vue";
import { Button, Menu, Tooltip, type MenuEntry } from "@fndn/vue";

const people: Record<string, string> = {
  priya: "Priya Raman",
  lucas: "Lucas Moreau",
  aiko: "Aiko Tanaka",
  sofia: "Sofia Alvarez",
};

/* a sub-menu keeps a second-level choice out of the first list */
const items: MenuEntry[] = [
  {
    type: "submenu",
    label: "Request review",
    icon: PhUserPlus,
    items: Object.entries(people).map(([value, label]) => ({ value, label })),
  },
  {
    type: "submenu",
    label: "Add label",
    icon: PhTag,
    items: [
      { value: "bug", label: "bug" },
      { value: "reliability", label: "reliability" },
      { value: "needs-docs", label: "needs-docs" },
    ],
  },
  { type: "separator" },
  { value: "close", label: "Close pull request", tone: "danger", icon: PhX },
];

const reviewer = ref("");
</script>

<template>
  <div class="flex w-80 items-center gap-3">
    <div class="flex min-w-0 flex-1 flex-col">
      <span class="text-sm font-medium text-ink">#482 Add retry to webhook delivery</span>
      <span class="text-xs text-ink-2">{{ reviewer ? `Review requested from ${reviewer}` : "Daniel Okafor wants to merge into main" }}</span>
    </div>
    <Menu placement="bottom-end" :items="items" @select="(value) => people[value] && (reviewer = people[value])">
      <template #trigger>
        <Tooltip content="More actions">
          <Button variant="ghost" size="sm" square aria-label="More actions for #482">
            <template #icon><PhDotsThree data-slot="icon" weight="bold" /></template>
          </Button>
        </Tooltip>
      </template>
    </Menu>
  </div>
</template>
