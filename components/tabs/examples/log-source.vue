<script setup lang="ts">
import { ref } from "vue";
import { Tabs, type TabsItem } from "@fndn/vue";

/* pill tabs switch what one card shows: here, which log */
const items: TabsItem[] = [
  { value: "build", label: "Build", content: "10:42:48 Build finished in 47s. 312 files, 4.1 MB." },
  { value: "runtime", label: "Runtime", content: "10:51:03 POST /api/webhooks 200 in 84 ms" },
  { value: "edge", label: "Edge", content: "Cache hit rate 92.4% across 3 regions." },
];

const value = ref("build");
</script>

<template>
  <Tabs v-model:value="value" class="w-80" :items="items" aria-label="Logs" />
</template>
