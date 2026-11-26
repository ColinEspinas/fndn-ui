<script setup lang="ts">
import { ref } from "vue";
import { Tabs, type TabsItem } from "@fndn/vue";

const files: TabsItem[] = [
  { value: "src/middleware/rate-limit.ts", label: "rate-limit.ts", content: "src/middleware/rate-limit.ts · 84 lines · modified" },
  { value: "src/routes/invoices.ts", label: "invoices.ts", content: "src/routes/invoices.ts · 212 lines" },
  { value: "test/rate-limit.test.ts", label: "rate-limit.test.ts", content: "test/rate-limit.test.ts · 3 failing tests" },
  { value: "src/webhooks/deliver.ts", label: "deliver.ts", content: "src/webhooks/deliver.ts · retry added in #482" },
  { value: "package.json", label: "package.json", content: "package.json · billing-api 2.14.0" },
];

const open = ref(files);
const active = ref(files[0]!.value);
</script>

<!-- closable tabs: the close button, or Delete on the focused tab; the strip scrolls and keeps the
     selected file in view. Removing the item is yours: the neighbour is already selected -->
<template>
  <p v-if="!open.length" class="w-80 text-sm text-ink-2">No open files</p>
  <Tabs
    v-else
    v-model:value="active"
    class="w-80"
    variant="underline"
    closable
    :items="open"
    aria-label="Open files"
    @close="(path) => (open = open.filter((tab) => tab.value !== path))"
  />
</template>
