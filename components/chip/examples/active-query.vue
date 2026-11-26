<script setup lang="ts">
import { Chip } from "@fndn/vue";
</script>

<template>
  <p class="max-w-[300px] text-sm text-ink-2">
    Showing 14 deploys where <Chip tone="accent">state = error</Chip> and <Chip tone="accent">branch = main</Chip>, newest first.
  </p>
</template>
