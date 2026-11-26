<script setup lang="ts">
import { ref } from "vue";
import { ApprovalCard } from "@fndn/vue";

const questions = [
  {
    q: "When should I migrate the bookings table (2.4M rows)?",
    type: "radio",
    options: [
      "Now, with a 40-second write lock",
      "Tonight at 02:00 UTC, the quietest hour",
      "Online in batches, about 25 minutes",
    ],
  },
  {
    q: "Where should it run first?",
    type: "check",
    options: ["Staging", "EU production", "US production"],
  },
  {
    q: "If a health check fails afterwards, what should I do?",
    type: "radio",
    options: [
      "Roll back automatically",
      "Pause and page Maya Chen",
      "Keep going and log it",
    ],
  },
];

const index = ref(0);

const state = ref("closed");
</script>

<template>
  <ApprovalCard
    :questions="questions"
    v-model:index="index"
    v-model:state="state"
  />
</template>
