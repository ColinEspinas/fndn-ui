<script setup lang="ts">
import { ref } from "vue";
import { Flowchart } from "@fndn/vue";

const triggers = [
  {
    value: "workspace-created",
    label: "Workspace created",
    caption: "Runs when a customer signs up",
  },
  {
    value: "trial-ending",
    label: "Trial ends in 3 days",
    caption: "Runs three days before a trial ends",
  },
  {
    value: "first-booking",
    label: "First booking made",
    caption: "Runs on a workspace's first booking",
  },
];

const properties = [
  { value: "plan", label: "plan" },
  { value: "industry", label: "industry" },
  { value: "team-size", label: "team size" },
  { value: "source", label: "signup source" },
];

const choices = {
  plan: [
    { value: "starter", label: "Starter", meta: "$19 / seat" },
    { value: "team", label: "Team", meta: "$49 / seat" },
    { value: "business", label: "Business", meta: "$99 / seat" },
    { value: "enterprise", label: "Enterprise", meta: "Custom" },
  ],
  industry: [
    { value: "dental", label: "Dental" },
    { value: "healthcare", label: "Healthcare" },
    { value: "logistics", label: "Logistics" },
    { value: "real-estate", label: "Real estate" },
  ],
  "team-size": [
    { value: "1-5", label: "1–5 people" },
    { value: "6-25", label: "6–25 people" },
    { value: "26-100", label: "26–100 people" },
    { value: "100+", label: "More than 100" },
  ],
  source: [
    { value: "search", label: "Search" },
    { value: "referral", label: "Customer referral" },
    { value: "partner", label: "Partner: Dental Association of Oregon" },
  ],
};

const trigger = ref("trial-ending");

const conditions = ref([]);
</script>

<template>
  <Flowchart
    :triggers="triggers"
    v-model:trigger="trigger"
    source="workspace"
    :properties="properties"
    :choices="choices"
    v-model:conditions="conditions"
    style="width: 420px"
  />
</template>
