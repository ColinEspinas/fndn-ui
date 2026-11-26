<script setup lang="ts">
import { DatePicker } from "@fndn/vue";

const weekend = (date: string) => [0, 6].includes(new Date(`${date}T12:00:00Z`).getUTCDay());
</script>

<!-- the calendar is the point here, so it starts open: weekends, booked days and the dates outside
     Dec 1–23 cannot be chosen -->
<template>
  <div style="width: 300px; height: 340px">
    <DatePicker
      label="Appointment"
      placeholder="Pick a weekday"
      defaultOpen
      defaultFocusedValue="2026-12-01"
      min="2026-12-01"
      max="2026-12-23"
      :unavailable="['2026-12-09', '2026-12-16']"
      :isDateUnavailable="weekend"
      style="width: 220px"
    />
  </div>
</template>
