<script setup lang="ts">
import { TaskRows } from "@fndn/vue";

const rows = [
  {
    key: "payouts",
    label: "Matched Stripe payouts to invoices",
    amount: "1,284 charges",
    status: "done",
    details: [
      { label: "Matched automatically", meta: "1,271" },
      { label: "Matched by amount and date", meta: "13" },
    ],
  },
  {
    key: "refunds",
    label: "Reconciled October refunds",
    amount: "$18,420.50",
    status: "done",
    details: [
      { label: "Refunds issued in Stripe", meta: "37" },
      { label: "Credit notes in the ledger", meta: "37" },
    ],
  },
  {
    key: "failed",
    label: "Checking failed renewals",
    amount: "12 invoices",
    status: "running",
    step: 2,
    details: [
      { label: "Card declined", meta: "9" },
      { label: "Bank transfer overdue", meta: "3" },
    ],
  },
  {
    key: "export",
    label: "Export the journal to the accountant",
    amount: "1 file",
    status: "failed",
    details: [
      { label: "close-2026-10.csv", meta: "built" },
      { label: "Upload to the shared drive", meta: "403" },
    ],
  },
];
</script>

<template>
  <TaskRows variant="list" :rows="rows" />
</template>
