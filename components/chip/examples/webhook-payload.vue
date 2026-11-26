<script setup lang="ts">
import { Chip } from "@fndn/vue";

const fields = [
  { name: "deploy.id", about: "The deploy, like dpl_7f3a9c." },
  { name: "deploy.state", about: "One of ready, error or canceled." },
  { name: "created_at", about: "When the event happened, in UTC." },
];
</script>

<template>
  <dl class="grid w-80 grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-2 text-sm">
    <div v-for="field in fields" :key="field.name" class="contents">
      <dt><Chip>{{ field.name }}</Chip></dt>
      <dd class="text-ink-2">{{ field.about }}</dd>
    </div>
  </dl>
</template>
