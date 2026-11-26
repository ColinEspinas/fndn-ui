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
];

const rows = [
  { id: "brightline", company: "Brightline Dental", plan: "Business", seats: 48, health: "healthy" },
  { id: "kestrel", company: "Kestrel Logistics", plan: "Team", seats: 112, health: "at-risk" },
  { id: "juniper", company: "Juniper Health", plan: "Enterprise", seats: 1240, health: "healthy" },
  { id: "tidewater", company: "Tidewater Realty", plan: "Team", seats: 23, health: "declining" },
  { id: "orbit", company: "Orbit Studio", plan: "Starter", seats: 6, health: "onboarding" },
];

const rowActions = [
  { value: "open", label: "Open account" },
  { value: "invoices", label: "View invoices" },
  { type: "separator" },
  { value: "cancel", label: "Cancel subscription", tone: "danger" },
];
</script>

<template>
  <RecordsTable :columns="columns" :rows="rows" :rowActions="rowActions" style="width: 560px" />
</template>
