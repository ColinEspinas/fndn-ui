<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { ContextCards, type ContextChunk } from "@fndn/vue";

const sources: ContextChunk[] = [
  {
    title: "Timeline, 14:05 to 14:31",
    chars: "880 characters",
    body: "Bookings failed with 503s for 26 minutes after the Postgres primary ran out of connections; the pool was raised from 80 to 160.",
    source: "INC-482 Postmortem.md",
    badge: "MD",
    tone: "neutral",
  },
  {
    title: "Connection pool runbook",
    chars: "1,140 characters",
    body: "If active connections stay above 90% for five minutes, restart the PgBouncer pods one at a time and page the on-call engineer.",
    source: "Runbooks / Database.md",
    badge: "MD",
    tone: "neutral",
  },
  {
    title: "Error rate by endpoint",
    chars: "2,310 characters",
    body: "POST /bookings: 18.4% errors at 14:12, 0.2% at 14:35. GET /availability stayed under 0.5% throughout.",
    source: "api-errors-2026-11-12.csv",
    badge: "CSV",
    tone: "green",
  },
];

/* retrieval returns one source at a time while the answer streams */
const shown = ref(1);
let timer = 0;
const tick = () => {
  if (shown.value < sources.length) timer = window.setTimeout(() => { shown.value++; tick(); }, 1000);
};
onMounted(tick);
onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <ContextCards title="Sources" :count="String(shown)" :chunks="sources.slice(0, shown)" />
</template>
