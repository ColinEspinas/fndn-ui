<script setup lang="ts">
import { RecommendationCard, type RecommendationOption } from "@fndn/vue";

const options: RecommendationOption[] = [
  {
    key: "rollback",
    body: [
      "Roll back ",
      { entity: "harbor/api" },
      " to ",
      { value: "v2.41.3" },
      ", the last release with p95 under ",
      { value: "180 ms", tone: "green" },
      ".",
    ],
    short: "Roll back to v2.41.3",
    signal: 3,
    tone: "green",
    label: "High confidence",
    cta: "Roll back",
    ctaVariant: "accent",
  },
  {
    key: "scale",
    body: [
      "Keep the release and scale the bookings workers from ",
      { value: "6" },
      " to ",
      { value: "12 instances", tone: "orange" },
      ".",
    ],
    short: "Scale bookings workers to 12",
    signal: 2,
    tone: "orange",
    label: "Needs review",
    cta: "Configure",
    ctaVariant: "primary",
  },
  {
    key: "incident",
    body: [
      "Leave it running and ",
      { strong: "open an incident" },
      " for Maya Chen to triage.",
    ],
    short: "Open an incident for Maya Chen",
    signal: 1,
    tone: "neutral",
    label: "Low confidence",
    cta: "Open incident",
    ctaVariant: "primary",
  },
];
</script>

<template>
  <RecommendationCard
    title="Booking API latency doubled after the 14:02 deploy"
    :options="options"
  />
</template>
