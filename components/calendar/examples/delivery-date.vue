<script setup lang="ts">
import { ref } from "vue";
import { Calendar } from "@fndn/vue";

const dates = ref<string[]>(["2026-12-12"]);
</script>

<template>
  <div class="flex flex-col gap-2">
    <Calendar aria-label="Delivery date" v-model:value="dates" />
    <span class="text-sm text-ink-2">{{ dates[0] ? `Delivery on ${dates[0]}.` : "No date chosen." }}</span>
  </div>
</template>
