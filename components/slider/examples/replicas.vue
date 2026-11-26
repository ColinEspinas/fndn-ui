<script setup lang="ts">
import { computed, ref } from "vue";
import { Slider } from "@fndn/vue";

/* controlled: the price under the slider follows it while it moves */
const PRICE = 18;

const replicas = ref([3]);
const count = computed(() => replicas.value[0] ?? 1);
</script>

<template>
  <div class="flex w-80 flex-col gap-2">
    <Slider v-model:value="replicas" label="Replicas of billing-api" show-value :min="1" :max="10" />
    <p class="text-sm text-ink-2 tabular-nums">
      {{ count }} × ${{ PRICE }} = <span class="text-ink">${{ count * PRICE }}.00</span> per month
    </p>
  </div>
</template>
