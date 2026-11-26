<script setup lang="ts">
import { PhSparkle } from "@phosphor-icons/vue";
import { Alert } from "@fndn/vue";
</script>

<template>
  <Alert class="w-full max-w-[420px]" tone="accent" title="New: usage alerts">
    <template #icon><PhSparkle data-slot="icon" weight="bold" /></template>
    Get an email when a project reaches 80% of its build minutes.
  </Alert>
</template>
