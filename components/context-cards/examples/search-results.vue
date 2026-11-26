<script setup lang="ts">
import { ContextCards } from "@fndn/vue";

const chunks = [
  {
    title: "Renewal terms",
    chars: "640 characters",
    body: "The agreement renews on January 4 for 12 months at $2,400 per month unless either party gives 60 days' written notice.",
    source: "Kestrel Logistics – Master Services Agreement (signed 2025-01-04).pdf",
    href: "https://example.com/docs/kestrel-msa.pdf",
    badge: "PDF",
    tone: "red",
  },
  {
    title: "Seat usage, last 90 days",
    chars: "1,250 characters",
    body: "Active seats fell from 180 to 128; the Denver and Reno depots stopped booking dock slots in September.",
    source: "kestrel-usage-q3.csv",
    href: "https://example.com/exports/kestrel-usage-q3.csv",
    badge: "CSV",
    tone: "green",
  },
  {
    title: "Volume discount table",
    chars: "530 characters",
    body: "Accounts with 100 to 249 seats get 12% off list; 250 seats and above get 18% and a named support contact.",
    source: "Pricing 2026.xlsx",
    href: "https://example.com/sheets/pricing-2026.xlsx",
    badge: "XLSX",
    tone: "green",
  },
  {
    title: "Last check-in call",
    chars: "910 characters",
    body: "Their operations lead asked for SMS reminders to drivers and a cheaper plan for seasonal depots.",
    source: "Call notes – Sofia Alvarez.docx",
    href: "https://example.com/docs/kestrel-call-notes.docx",
    badge: "DOC",
    tone: "accent",
  },
  {
    title: "Open support tickets",
    chars: "380 characters",
    body: "Two open tickets: calendar sync delays for the Reno depot (high) and an invoice address change (low).",
    source: "Support export.csv",
    href: "https://example.com/exports/support.csv",
    badge: "CSV",
    tone: "green",
  },
  {
    title: "Roadmap commitment",
    chars: "270 characters",
    body: "SMS reminders ship in Q1; Kestrel is on the beta list.",
    source: "Roadmap.md",
    href: "https://example.com/docs/roadmap.md",
    badge: "MD",
    tone: "neutral",
  },
];
</script>

<template>
  <ContextCards title="All chunks" count="32" :chunks="chunks" />
</template>
