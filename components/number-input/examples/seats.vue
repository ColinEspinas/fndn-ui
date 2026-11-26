<script setup lang="ts">
import { ref } from "vue";
import { NumberInput } from "@fndn/vue";

const seats = ref("12");
</script>

<!-- min and max bound the steppers, the arrow keys and what can be typed -->
<template>
  <NumberInput v-model:value="seats" label="Seats" :min="1" :max="500" class="w-40" />
</template>
