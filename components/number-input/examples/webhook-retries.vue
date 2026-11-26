<script setup lang="ts">
import { ref } from "vue";
import { Label, NumberInput } from "@fndn/vue";

const retries = ref("5");
</script>

<!-- sm in a settings row: the Label points at the input by id -->
<template>
  <div class="flex w-full max-w-80 items-center justify-between gap-4">
    <div class="flex min-w-0 flex-col gap-0.5">
      <Label for="webhook-retries">Retries</Label>
      <span class="text-xs text-ink-2">Before a delivery is marked failed.</span>
    </div>
    <NumberInput id="webhook-retries" v-model:value="retries" size="sm" :min="0" :max="10" class="w-24 shrink-0" />
  </div>
</template>
