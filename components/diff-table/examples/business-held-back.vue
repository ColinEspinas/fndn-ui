<script setup lang="ts">
import { ref } from "vue";
import { DiffTable, type DiffTableRow } from "@fndn/vue";

const columns: [string, string, string] = ["Plan", "Billing", "Price"];

const rows: DiffTableRow[] = [
  {
    key: "team-49",
    name: "Team",
    category: "Monthly",
    tone: "accent",
    value: "$49 per seat",
    change: "removed",
  },
  {
    key: "team-59",
    name: "Team",
    category: "Monthly",
    tone: "accent",
    value: "$59 per seat",
    change: "added",
  },
  {
    key: "team-annual",
    name: "Team",
    category: "Annual",
    tone: "green",
    value: "$490 per seat",
    change: "unchanged",
  },
  {
    key: "business-99",
    name: "Business",
    category: "Monthly",
    tone: "accent",
    value: "$99 per seat",
    change: "removed",
  },
  {
    key: "business-119",
    name: "Business",
    category: "Monthly",
    tone: "accent",
    value: "$119 per seat",
    change: "added",
  },
];

const included = ref({ "business-99": false, "business-119": false });
</script>

<template>
  <DiffTable
    title="Proposed price changes"
    :columns="columns"
    :rows="rows"
    v-model:included="included"
  />
</template>
