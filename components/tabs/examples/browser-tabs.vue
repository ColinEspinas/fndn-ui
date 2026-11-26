<script setup lang="ts">
import { ref } from "vue";
import { PhGitBranch, PhGlobe, PhTerminal } from "@phosphor-icons/vue";
import { Tabs, type TabsItem } from "@fndn/vue";

const pages: TabsItem[] = [
  { value: "deploys", label: "Deploys · web-app", icon: PhTerminal, content: "dpl_7f3a9c is live on Production." },
  { value: "pr-482", label: "#482 Add retry to webhook delivery", icon: PhGitBranch, content: "2 approvals, checks passing." },
  { value: "status", label: "Status · Northwind", icon: PhGlobe, content: "All systems operational." },
];

const open = ref(pages);
const active = ref("pr-482");
</script>

<!-- browser tabs: attached, so the selected tab is the toolbar's surface and joins it; the others sit
     on the darker strip. Tabs share the strip (240px at most) and shrink before it scrolls -->
<template>
  <div class="w-full max-w-[560px] overflow-hidden rounded-card bg-canvas shadow-card">
    <Tabs
      v-model:value="active"
      variant="attached"
      size="sm"
      closable
      :items="open"
      aria-label="Open tabs"
      @close="(page) => (open = open.filter((tab) => tab.value !== page))"
    >
      <template #panel="{ item }"><p class="px-3 py-2.5 text-sm text-ink-2">{{ item.content }}</p></template>
    </Tabs>
  </div>
</template>
