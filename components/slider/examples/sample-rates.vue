<script setup lang="ts">
import { ref } from "vue";
import { Slider } from "@fndn/vue";

/* sm: a smaller track and thumb for a dense settings panel */
const percent = (v: number) => `${v}%`;

const logs = ref([25]);
const traces = ref([10]);
</script>

<template>
  <div class="flex w-72 flex-col gap-4">
    <Slider v-model:value="logs" size="sm" label="Log sampling" show-value :format-value="percent" />
    <Slider v-model:value="traces" size="sm" label="Trace sampling" show-value :format-value="percent" />
  </div>
</template>
