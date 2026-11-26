<script setup lang="ts">
import { ref } from "vue";
import { PromptBar, type PromptBarSource } from "@fndn/vue";

const value = ref("Summarize this week's tickets from Juniper Health");

const model = ref("atlas-small");

const models = [
  { value: "atlas-large", label: "Atlas Large", meta: "Most capable" },
  { value: "atlas-small", label: "Atlas Small", meta: "Fastest" },
];

const sources: PromptBarSource[] = [
  { value: "accounts", label: "Customer accounts", description: "1,284 workspaces, plans and MRR", icon: "users" },
  { value: "tickets", label: "Support tickets", description: "Open and closed, last 90 days", icon: "chat-circle" },
  { value: "metrics", label: "Product metrics", description: "Bookings, activation, churn", icon: "chart-bar" },
];
</script>

<template>
  <PromptBar
    shape="pill"
    busy
    v-model:value="value"
    v-model:model="model"
    :models="models"
    :sources="sources"
    style="width: 420px"
  />
</template>
