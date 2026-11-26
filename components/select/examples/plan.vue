<script setup lang="ts">
import { ref } from "vue";
import { Select } from "@fndn/vue";

/* meta sits at the end of each option; a long name wraps instead of being cut */
const plans = [
  { value: "free", label: "Free", meta: "$0" },
  { value: "team", label: "Team", meta: "$20 / seat" },
  { value: "business", label: "Business", meta: "$45 / seat" },
  { value: "enterprise", label: "Enterprise, with SSO, audit log and an annual contract", meta: "Contact sales" },
];

const plan = ref<string | null>("team");
</script>

<template>
  <Select :items="plans" v-model:value="plan" label="Plan" style="width: 260px" />
</template>
