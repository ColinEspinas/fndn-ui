<script setup lang="ts">
import { ref } from "vue";
import { RadioGroup } from "@fndn/vue";

/* no default when there is no safe guess: nothing is picked until someone chooses */
const regions = [
  { value: "us-east", label: "US East (Virginia)" },
  { value: "eu-west", label: "EU West (Frankfurt)" },
  { value: "ap-northeast", label: "Asia Pacific (Tokyo)" },
];

const value = ref<string | null>(null);
</script>

<template>
  <RadioGroup v-model:value="value" name="region" label="Region for data-pipeline" :items="regions" />
</template>
