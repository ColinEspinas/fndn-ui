<script setup lang="ts">
import { Slider } from "@fndn/vue";
</script>

<!-- disabled: the setting stays readable, and the line under it says what unlocks it -->
<template>
  <div class="flex w-80 flex-col gap-2">
    <Slider label="Concurrent builds" show-value :min="1" :max="8" :value="[1]" disabled />
    <p class="text-xs text-ink-2">The Free plan runs one build at a time. Upgrade to Team for up to 8.</p>
  </div>
</template>
