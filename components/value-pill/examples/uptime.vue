<script setup lang="ts">
import { ValuePill } from "@fndn/vue";
</script>

<template>
  <p class="max-w-[300px] text-md text-ink">
    Production answered <ValuePill tone="green">99.98%</ValuePill> of requests in the last 30 days, with a median response of <ValuePill>142 ms</ValuePill>.
  </p>
</template>
