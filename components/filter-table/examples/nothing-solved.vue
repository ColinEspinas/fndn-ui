<script setup lang="ts">
import { ref } from "vue";
import { FilterTable } from "@fndn/vue";

const rows = [
  {
    task: "Reminder SMS sent twice for the same booking",
    date: "Nov 16",
    status: "todo",
    owner: "Brightline Dental",
  },
  {
    task: "Calendar sync stopped after Google re-auth",
    date: "Nov 15",
    status: "progress",
    owner: "Kestrel Logistics",
  },
  {
    task: "Can't export invoices as CSV",
    date: "Nov 14",
    status: "todo",
    owner: "Juniper Health",
  },
];

const labels = {
  filters: "Filter tickets by status",
  region: "Support tickets",
  empty: "Nothing solved yet this week",
  none: "No tickets yet",
  columns: { task: "Ticket", owner: "Customer" },
  statuses: { todo: "Open", progress: "Pending", done: "Solved" },
};

const filter = ref("done");
</script>

<template>
  <FilterTable :rows="rows" :labels="labels" v-model:filter="filter" />
</template>
