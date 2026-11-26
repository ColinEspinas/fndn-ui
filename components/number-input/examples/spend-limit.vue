<script setup lang="ts">
import { ref } from "vue";
import { NumberInput } from "@fndn/vue";

const limit = ref("500");
</script>

<!-- formatOptions shows the value as money; the steppers move by $50 -->
<template>
  <NumberInput
    v-model:value="limit"
    label="Monthly spend limit"
    :min="0"
    :step="50"
    :format-options="{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }"
    class="w-48"
  />
</template>
