<script setup lang="ts">
import { EntityChip } from "@fndn/vue";

const activity = [
  { id: 1, who: "Maya Chen", color: "var(--fndn-tag-orange)", action: "invited", target: "Priya Raman", targetColor: "var(--fndn-tag-purple)", when: "2 min ago" },
  { id: 2, who: "Daniel Okafor", color: "var(--fndn-tag-blue)", action: "deployed", target: "web-app", targetColor: "var(--fndn-tag-green)", when: "1 h ago" },
];
</script>

<template>
  <ul class="flex w-80 flex-col gap-3 text-md text-ink">
    <li v-for="item in activity" :key="item.id">
      <EntityChip :name="item.who" :color="item.color" /> {{ item.action }} <EntityChip :name="item.target" :color="item.targetColor" /> <span class="text-sm text-ink-2">{{ item.when }}</span>
    </li>
  </ul>
</template>
