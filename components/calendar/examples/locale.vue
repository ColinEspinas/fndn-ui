<script setup lang="ts">
import { Calendar } from "@fndn/vue";
</script>

<template>
  <Calendar aria-label="Liefertermin" locale="de-DE" :startOfWeek="1" :defaultValue="['2026-12-12']" />
</template>
