<script setup lang="ts">
import { ref } from "vue";
import { PromptBar } from "@fndn/vue";

const value = ref("/");

const model = ref("atlas-large");

const models = [
  { value: "atlas-large", label: "Atlas Large", meta: "Most capable" },
  { value: "atlas-small", label: "Atlas Small", meta: "Fastest" },
];

const sources = [
  { value: "accounts", label: "Customer accounts", description: "1,284 workspaces, plans and MRR", icon: "users" },
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
  <!-- the composer sits at the foot of the chat; the list opens upward into the room above it -->
  <div class="flex h-[300px] w-[420px] max-w-full flex-col justify-end">
    <PromptBar
      shape="rounded"
      v-model:value="value"
      v-model:model="model"
      :models="models"
      :sources="sources"
      :commands="commands"
    />
  </div>
</template>
