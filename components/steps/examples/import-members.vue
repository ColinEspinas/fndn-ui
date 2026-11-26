<script setup lang="ts">
import { computed, ref } from "vue";
import { Button, Steps } from "@fndn/vue";

const items = [{ title: "Upload CSV" }, { title: "Match columns" }, { title: "Invite" }];

/* your own buttons drive the step; the last one names what it does */
const step = ref(0);
const done = computed(() => step.value === items.length);
const last = computed(() => step.value === items.length - 1);
</script>

<template>
  <div class="flex w-80 flex-col gap-4">
    <Steps v-model:step="step" linear :items="items" />
    <div class="flex justify-end gap-2">
      <Button size="sm" :disabled="step === 0 || done" @click="step = step - 1">Back</Button>
      <Button size="sm" variant="primary" @click="step = done ? 0 : step + 1">{{ done ? "Import more" : last ? "Invite 18 people" : "Next" }}</Button>
    </div>
  </div>
</template>
