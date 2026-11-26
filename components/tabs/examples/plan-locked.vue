<script setup lang="ts">
import { ref } from "vue";
import { Tabs, type TabsItem } from "@fndn/vue";

/* Analytics is on the Business plan: the tab stays in its place, disabled */
const items: TabsItem[] = [
  { value: "usage", label: "Usage", content: "1.2 M requests and 38 GB of bandwidth this month." },
  { value: "analytics", label: "Analytics", content: "Visitors, pages and referrers.", disabled: true },
  { value: "invoices", label: "Invoices", content: "INV-2024-0117 · $1,240.00 · Paid Nov 1, 2026" },
];

const value = ref("usage");
</script>

<template>
  <Tabs v-model:value="value" class="w-80" :items="items" variant="underline" aria-label="Billing" />
</template>
