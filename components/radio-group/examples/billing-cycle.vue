<script setup lang="ts">
import { ref } from "vue";
import { RadioGroup } from "@fndn/vue";

/* horizontal: two or three short options in a row */
const cycles = [
  { value: "monthly", label: "Monthly · $24 per seat" },
  { value: "yearly", label: "Yearly · $19 per seat" },
];

const value = ref("yearly");
</script>

<template>
  <RadioGroup v-model:value="value" name="cycle" label="Billing cycle" orientation="horizontal" :items="cycles" />
</template>
