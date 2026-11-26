<script setup lang="ts">
import { ref } from "vue";
import { Listbox } from "@fndn/vue";

const events = [
  { value: "deploy-failed", label: "A deploy fails" },
  { value: "deploy-ready", label: "A production deploy is ready" },
  { value: "review", label: "Someone requests my review" },
  { value: "invoice", label: "An invoice is paid" },
  { value: "seats", label: "The workspace runs out of seats" },
];

const picked = ref(["deploy-failed", "review"]);
</script>

<template>
  <Listbox :items="events" v-model:value="picked" label="Email me when" selection-mode="multiple" style="width: 280px" />
</template>
