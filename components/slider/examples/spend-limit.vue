<script setup lang="ts">
import { ref } from "vue";
import { Slider } from "@fndn/vue";

/* one number on a track: the label names it, the value shows formatted at the end of the row */
const usd = (v: number) => `$${v.toLocaleString("en-US")}`;

const limit = ref([1200]);
</script>

<template>
  <div class="flex w-80 flex-col gap-2">
    <Slider v-model:value="limit" label="Monthly spend limit" show-value :min="100" :max="5000" :step="100" :format-value="usd" />
    <p class="text-xs text-ink-2">We email maya@northwind.example when Northwind reaches 80%.</p>
  </div>
</template>
