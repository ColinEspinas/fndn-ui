<script setup lang="ts">
import { InsightCards } from "@fndn/vue";
</script>

<template>
  <InsightCards
    title="This week"
    :insights="[]"
    empty-text="No insights yet. They appear after your first full week of bookings."
    style="width: 344px"
  />
</template>
