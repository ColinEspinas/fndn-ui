<script setup lang="ts">
import { PhQuestion } from "@phosphor-icons/vue";
import { Button, Dialog, Kbd, TextRow } from "@fndn/vue";

const shortcuts = [
  { action: "Search the workspace", keys: ["⌘", "K"] },
  { action: "Create a project", keys: ["C"] },
  { action: "Go to deploys", keys: ["G", "D"] },
  { action: "Toggle the sidebar", keys: ["⌘", "B"] },
];
</script>

<!-- your own trigger: a ghost Button with an icon, at the foot of the help panel -->
<template>
  <div class="flex w-80 items-center gap-3">
    <div class="min-w-0 flex-1">
      <div class="text-sm font-medium text-ink">Work faster</div>
      <div class="text-xs text-ink-2">Every action in Northwind has a key.</div>
    </div>
    <Dialog size="sm" title="Keyboard shortcuts">
      <template #trigger>
        <Button variant="ghost" size="sm">
          <template #icon><PhQuestion data-slot="icon" weight="bold" /></template>
          Shortcuts
        </Button>
      </template>
      <div class="flex flex-col">
        <TextRow v-for="s in shortcuts" :key="s.action" :label="s.action">
          <template #value><Kbd :keys="s.keys" /></template>
        </TextRow>
      </div>
    </Dialog>
  </div>
</template>
