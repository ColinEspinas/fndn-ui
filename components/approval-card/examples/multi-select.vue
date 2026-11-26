<script setup lang="ts">
import { ref } from "vue";
import { ApprovalCard } from "@fndn/vue";

const questions = [
  {
    q: "The summary of yesterday's booking outage is drafted. Which customers should get it?",
    type: "check",
    options: [
      "Accounts with failed bookings (38)",
      "Accounts with an open ticket (17)",
      "Every Business plan account (412)",
    ],
  },
  {
    q: "Who should it come from?",
    type: "radio",
    options: [
      "Priya Raman, Support lead",
      "The Harbor status team",
      "Each account's success manager",
    ],
  },
  {
    q: "When should it go out?",
    type: "radio",
    options: ["Right away", "Tomorrow at 09:00 in each customer's time zone"],
  },
];

const answers = { "0": [0, 1] };

const index = ref(0);
</script>

<template>
  <ApprovalCard
    :questions="questions"
    v-model:index="index"
    :defaultAnswers="answers"
  />
</template>
