<script setup lang="ts">
import { PhCheck, PhSparkle } from "@phosphor-icons/vue";
import { Shimmer } from "@fndn/vue";

const done = ["Read the failing test in webhooks.test.ts", "Found the 10 s timeout in deliver()"];
</script>

<template>
  <ol class="flex w-80 max-w-full flex-col gap-2 text-sm">
    <li v-for="step in done" :key="step" class="flex items-center gap-2 text-ink-2">
      <PhCheck data-slot="icon" weight="bold" class="shrink-0 text-green" aria-hidden="true" />
      {{ step }}
    </li>
    <li class="flex items-center gap-2">
      <PhSparkle data-slot="icon" weight="fill" class="shrink-0 text-accent" aria-hidden="true" />
      <Shimmer>Writing a retry with backoff…</Shimmer>
    </li>
  </ol>
</template>
