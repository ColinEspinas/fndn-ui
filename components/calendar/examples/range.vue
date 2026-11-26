<script setup lang="ts">
import { Calendar } from "@fndn/vue";
</script>

<template>
  <Calendar aria-label="Stay" selectionMode="range" :defaultValue="['2026-12-10', '2026-12-14']" />
</template>
