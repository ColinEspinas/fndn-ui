<script setup lang="ts">
import { PhCheck, PhCircle } from "@phosphor-icons/vue";
import { ProgressRing } from "@fndn/vue";

const steps = [
  { name: "Deploy to Production", done: true },
  { name: "Add a custom domain", done: false },
  { name: "Turn on usage alerts", done: false },
];
</script>

<template>
  <div class="flex w-72 flex-col gap-3 text-sm">
    <div class="flex items-center gap-3">
      <ProgressRing :progress="3 / 5" label="Setup: 3 of 5 steps done">3</ProgressRing>
      <div>
        <p class="font-medium text-ink">Set up web-app</p>
        <p class="text-ink-2">3 of 5 steps done</p>
      </div>
    </div>
    <ul class="flex flex-col gap-1.5">
      <li v-for="step in steps" :key="step.name" :class="`flex items-center gap-2 ${step.done ? 'text-ink-2 line-through' : 'text-ink'}`">
        <PhCheck v-if="step.done" data-slot="icon" weight="bold" class="text-green" />
        <PhCircle v-else data-slot="icon" class="text-ink-3" />
        {{ step.name }}
      </li>
    </ul>
  </div>
</template>
