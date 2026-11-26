<script setup lang="ts">
import { PhChartLine, PhGear, PhHouse, PhRocketLaunch } from "@phosphor-icons/vue";
import { Button, Tooltip } from "@fndn/vue";

const pages = [
  { label: "Overview", icon: PhHouse },
  { label: "Deploys", icon: PhRocketLaunch },
  { label: "Usage", icon: PhChartLine },
  { label: "Settings", icon: PhGear },
];
</script>

<!-- a collapsed rail has no visible labels: the tooltip names each page, to the side -->
<template>
  <nav aria-label="Project" class="flex flex-col gap-0.5">
    <Tooltip v-for="page in pages" :key="page.label" :content="page.label" placement="right">
      <Button variant="ghost" square :aria-label="page.label">
        <template #icon><component :is="page.icon" data-slot="icon" weight="bold" /></template>
      </Button>
    </Tooltip>
  </nav>
</template>
