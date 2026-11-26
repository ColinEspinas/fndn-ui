<script setup lang="ts">
import { ref } from "vue";
import { RadioGroup } from "@fndn/vue";

/* an option the plan does not include stays in the list, disabled, and says why */
const retention = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "365", label: "1 year (Business plan)", disabled: true },
];

const value = ref("30");
</script>

<template>
  <RadioGroup v-model:value="value" name="retention" label="Keep deploy logs for" :items="retention" />
</template>
