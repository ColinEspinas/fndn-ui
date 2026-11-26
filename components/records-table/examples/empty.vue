<script setup lang="ts">
import { RecordsTable } from "@fndn/vue";

const columns = [
  { key: "company", label: "Company", width: 190 },
  { key: "plan", label: "Plan", width: 100 },
  { key: "seats", label: "Seats", type: "number", width: 90 },
  {
    key: "health",
    label: "Health",
    type: "status",
    width: 130,
    options: [
      { value: "at-risk", label: "At risk", tone: "red" },
      { value: "declining", label: "Declining", tone: "orange" },
      { value: "healthy", label: "Healthy", tone: "green" },
      { value: "onboarding", label: "Onboarding", tone: "neutral" },
    ],
  },
] as const;

const labels = { empty: "No accounts at risk this week" };
</script>

<template>
  <RecordsTable :columns="columns" :rows="[]" :labels="labels" style="width: 560px" />
</template>
