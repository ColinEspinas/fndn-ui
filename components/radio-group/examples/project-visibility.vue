<script setup lang="ts">
import { ref } from "vue";
import { RadioGroup } from "@fndn/vue";

/* exactly one of a short list, all visible at once */
const visibility = [
  { value: "private", label: "Private: only members of web-app" },
  { value: "internal", label: "Internal: everyone at Northwind" },
  { value: "public", label: "Public: anyone with the link" },
];

const value = ref("internal");
</script>

<template>
  <RadioGroup v-model:value="value" name="visibility" label="Who can see web-app" :items="visibility" />
</template>
