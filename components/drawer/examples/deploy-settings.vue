<script setup lang="ts">
import { ref } from "vue";
import { Drawer, Field, Input, Switch, type DrawerAction } from "@fndn/vue";

const actions: DrawerAction[] = [
  { label: "Cancel", value: "cancel", variant: "ghost" },
  { label: "Save changes", value: "save", variant: "primary" },
];

const branch = ref("main");
const buildCommand = ref("pnpm build");
const deployOnPush = ref(true);
</script>

<!-- a side panel keeps the page in view while you edit what is on it -->
<template>
  <div class="flex w-80 items-center justify-between gap-3">
    <div class="flex min-w-0 flex-col">
      <span class="text-sm font-medium text-ink">Production</span>
      <span class="text-xs text-ink-2">Deploys main on every push</span>
    </div>
    <Drawer
      side="end"
      triggerLabel="Edit deploy settings"
      title="Deploy settings"
      description="web-app · Production"
      :actions="actions"
    >
      <div class="flex flex-col gap-4">
        <Field label="Production branch">
          <Input v-model="branch" mono />
        </Field>
        <Field label="Build command" helper="Runs in the repository root.">
          <Input v-model="buildCommand" mono />
        </Field>
        <Switch v-model:checked="deployOnPush">Deploy every push to main</Switch>
      </div>
    </Drawer>
  </div>
</template>
