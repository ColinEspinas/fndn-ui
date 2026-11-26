<script setup lang="ts">
import { ref } from "vue";
import { PromptBar } from "@fndn/vue";

const value = ref("Which accounts renewing in December show churn risk?");

const model = ref("atlas-large");

const models = [
  { value: "atlas-large", label: "Atlas Large", meta: "Most capable" },
  { value: "atlas-small", label: "Atlas Small", meta: "Fastest" },
  { value: "atlas-reason", label: "Atlas Reason", meta: "Thinks longer" },
];

const sources = [
  { value: "accounts", label: "Customer accounts", description: "1,284 workspaces, plans and MRR", icon: "users" },
  { value: "tickets", label: "Support tickets", description: "Open and closed, last 90 days", icon: "chat-circle" },
  { value: "metrics", label: "Product metrics", description: "Bookings, activation, churn", icon: "chart-bar" },
  { value: "web", label: "Web search", description: "Public pages and news", icon: "globe" },
];

const commands = [
  { value: "summarize", description: "Summarize this conversation" },
  { value: "draft-email", description: "Write an email to a customer" },
  { value: "query", description: "Ask the data warehouse in SQL" },
  { value: "chart", description: "Chart the last result" },
  { value: "ticket", description: "Open a support ticket" },
];
</script>

<template>
  <PromptBar
    shape="rounded"
    v-model:value="value"
    v-model:model="model"
    :models="models"
    :sources="sources"
    :commands="commands"
    style="width: 420px"
  />
</template>
