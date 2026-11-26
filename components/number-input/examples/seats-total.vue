<script setup lang="ts">
import { computed, ref } from "vue";
import { NumberInput } from "@fndn/vue";

const price = 20;
const seats = ref("8");
const count = computed(() => Number(seats.value) || 0);
</script>

<!-- controlled: the total follows the value as it changes -->
<template>
  <div class="flex items-end gap-3">
    <NumberInput v-model:value="seats" label="Seats on Team" :min="1" :max="500" class="w-36" />
    <span class="pb-1.5 text-sm text-ink-2">${{ (count * price).toLocaleString("en-US") }} a month</span>
  </div>
</template>
