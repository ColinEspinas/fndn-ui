<script setup lang="ts">
import { ref } from "vue";
import { Select } from "@fndn/vue";

const environments = [
  { value: "production", label: "Production", meta: "main" },
  { value: "staging", label: "Staging", meta: "release/2026.11" },
  { value: "preview", label: "Preview", meta: "feat/usage-alerts" },
];

const environment = ref<string | null>("staging");
</script>

<template>
  <Select
    :items="environments"
    v-model:value="environment"
    placeholder="Choose an environment"
    label="Deploy to"
    style="width: 240px"
  />
</template>
