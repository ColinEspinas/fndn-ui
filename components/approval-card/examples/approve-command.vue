<script setup lang="ts">
import { ApprovalCard, type ApprovalAction } from "@fndn/vue";

const action: ApprovalAction = {
  title: "Run the database migration on Production?",
  description: "Adds the usage_alerts table and backfills it from the last 30 days of events.",
  command: "pnpm --filter billing-api db:migrate --env production",
  details: [
    { label: "Branch", value: "feat/usage-alerts", mono: true },
    { label: "Rows affected", value: "1,284" },
  ],
};
</script>

<template>
  <ApprovalCard :action="action" always-allow />
</template>
