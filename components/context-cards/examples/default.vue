<script setup lang="ts">
import { ContextCards } from "@fndn/vue";

const chunks = [
  {
    title: "Refund window",
    chars: "412 characters",
    body: "Annual plans: full refund within 30 days of renewal.",
    source: "Billing Policy 2026.pdf",
    badge: "PDF",
    tone: "red",
  },
  {
    title: "Who approves refunds",
    chars: "236 characters",
    body: "Refunds over $500 need sign-off from Finance.",
    source: "Support Playbook.docx",
    badge: "DOC",
    tone: "accent",
  },
];
</script>

<template>
  <ContextCards title="Sources" count="2" :chunks="chunks" />
</template>
