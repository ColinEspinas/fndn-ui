<script setup lang="ts">
import { ref } from "vue";
import { ChatComposer } from "@fndn/vue";

const tabs = ref([
  {
    value: "new",
    label: "New chat",
  },
]);

const value = ref("Draft a reply to Brightline Dental about the double-booked Tuesday slots");

const suggestions = ["Summarize today's tickets", "Find accounts at risk"];
</script>

<template>
  <ChatComposer
    v-model:tabs="tabs"
    v-model:value="value"
    :suggestions="suggestions"
    style="width: 380px"
  />
</template>
