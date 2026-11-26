<script setup lang="ts">
import { ref } from "vue";
import { ChatComposer, type ChatComposerTab } from "@fndn/vue";

const tabs = ref<ChatComposerTab[]>([
  {
    value: "incident",
    label: "API latency",
    messages: [
      {
        role: "user",
        text: "p95 latency on harbor/api doubled at 09:40. What changed?",
      },
    ],
  },
  {
    value: "deploy-482",
    label: "Deploy #482",
  },
]);

const tab = ref("incident");

const suggestions = ["Compare with yesterday", "Open the dashboard"];
</script>

<template>
  <ChatComposer
    v-model:tabs="tabs"
    v-model:tab="tab"
    busy
    status="Reading the request logs"
    :suggestions="suggestions"
    style="width: 380px"
  />
</template>
