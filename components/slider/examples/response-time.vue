<script setup lang="ts">
import { ref } from "vue";
import { Slider } from "@fndn/vue";

/* a range: two thumbs, each named, kept a few steps apart */
const range = ref([120, 800]);
</script>

<template>
  <Slider
    v-model:value="range"
    label="Response time"
    show-value
    :min="0"
    :max="2000"
    :step="10"
    :min-steps-between-thumbs="5"
    :thumb-labels="['Fastest', 'Slowest']"
    :format-value="(v) => `${v} ms`"
    class="w-80"
  />
</template>
