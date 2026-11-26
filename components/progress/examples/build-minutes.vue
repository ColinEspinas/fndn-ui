<script setup lang="ts">
import { Progress } from "@fndn/vue";
</script>

<template>
  <Progress class="w-full" :value="2140" :max="3000" label="Build minutes this month" show-value value-text="2,140 of 3,000 min" tone="accent" />
</template>
