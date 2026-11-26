<script setup lang="ts">
import { DiffTable } from "@fndn/vue";

const columns = ["Plan", "Billing", "Price"];

const rows = [
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
    key: "business",
    name: "Business",
    category: "Monthly",
    tone: "accent",
    value: "$99 per seat",
    change: "unchanged",
  },
];
</script>

<template>
  <DiffTable title="Proposed price changes" :columns="columns" :rows="rows" />
</template>
