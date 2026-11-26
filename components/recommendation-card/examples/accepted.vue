<script setup lang="ts">
import { ref } from "vue";
import { RecommendationCard, type RecommendationOption } from "@fndn/vue";

const options: RecommendationOption[] = [
  {
    key: "refund",
    body: [
      "Refund ",
      { value: "$1,240.00", tone: "green" },
      " to ",
      { entity: "Kestrel Logistics" },
      " for the duplicate November charge.",
    ],
    short: "Refund $1,240.00 to the card",
    signal: 3,
    tone: "green",
    label: "High confidence",
    cta: "Refund",
    ctaVariant: "accent",
  },
  {
    key: "credit",
    body: [
      "Add a ",
      { value: "$1,240.00" },
      " credit to the December invoice instead of refunding.",
    ],
    short: "Credit the December invoice",
    signal: 2,
    tone: "orange",
    label: "Needs review",
    cta: "Apply credit",
    ctaVariant: "primary",
  },
  {
    key: "ask",
    body: [
      "Hold the refund and ",
      { strong: "ask Daniel Okafor" },
      " to check the Stripe payout first.",
    ],
    short: "Ask Daniel Okafor to check",
    signal: 0,
    tone: "neutral",
    label: "No signal",
    cta: "Send to Daniel",
    ctaVariant: "primary",
  },
];

const selected = ref(1);

const accepted = ref(true);
</script>

<template>
  <RecommendationCard
    title="Kestrel Logistics was charged twice in November"
    :options="options"
    v-model:selected="selected"
    v-model:accepted="accepted"
  />
</template>
