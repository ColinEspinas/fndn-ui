<script setup lang="ts">
import { InsightCards } from "@fndn/vue";

const insights = [
  {
    id: "tidewater",
    title: "Bookings falling",
    summary: [
      { entity: "Tidewater Realty" },
      " booked ",
      { value: "-38%", tone: "red" },
      " fewer viewings over eight weeks; the contract renews on ",
      { value: "Jan 4" },
      ".",
    ],
    chart: {
      kind: "line",
      format: "number",
      series: [
        {
          name: "Bookings per week",
          tone: "red",
          values: [412, 398, 371, 344, 309, 288, 270, 255],
        },
      ],
    },
    action: "Draft a check-in email for Sofia",
  },
];
</script>

<template>
  <InsightCards title="Account health" :insights="insights" style="width: 344px" />
</template>
