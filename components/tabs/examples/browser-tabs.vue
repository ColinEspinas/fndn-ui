<script setup lang="ts">
import { ref } from "vue";
import { PhGitBranch, PhGlobe, PhPlus, PhTerminal } from "@phosphor-icons/vue";
import { Button, Tabs, Tooltip, type TabsItem } from "@fndn/vue";

const pages: TabsItem[] = [
  { value: "deploys", label: "Deploys · web-app", icon: PhTerminal, content: "dpl_7f3a9c is live on Production." },
  { value: "pr-482", label: "#482 Add retry to webhook delivery", icon: PhGitBranch, content: "2 approvals, checks passing." },
  { value: "status", label: "Status · Northwind", icon: PhGlobe, content: "All systems operational." },
];

const open = ref(pages);
const active = ref("pr-482");
let next = 1;
function add() {
  const value = `new-${next++}`;
  open.value = [...open.value, { value, label: "New tab", icon: PhGlobe, content: "A blank page." }];
  active.value = value;
}
</script>

<!-- browser tabs: closable pill tabs, each with its page's icon. A title stops at 240px, cut with its
     full text in the title; a new tab opens its room and a closed one gives it back -->
<template>
  <Tabs
    v-model:value="active"
    class="w-full max-w-[560px]"
    size="sm"
    closable
    :items="open"
    aria-label="Open tabs"
    @close="(value) => (open = open.filter((tab) => tab.value !== value))"
  >
    <template #panel="{ item }"><p class="py-2.5 text-sm text-ink-2">{{ item.content }}</p></template>
    <template #end>
      <Tooltip content="New tab">
        <Button variant="ghost" size="xs" square muted aria-label="New tab" @click="add">
          <template #icon><PhPlus data-slot="icon" weight="bold" /></template>
        </Button>
      </Tooltip>
    </template>
  </Tabs>
</template>
