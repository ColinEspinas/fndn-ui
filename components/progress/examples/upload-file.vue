<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { Button, Progress } from "@fndn/vue";

const value = ref(0);
const running = ref(false);
let timer: ReturnType<typeof setInterval> | undefined;
watch(running, (on) => {
  clearInterval(timer);
  if (on) timer = setInterval(() => (value.value = Math.min(100, value.value + 7 + Math.round(Math.random() * 12))), 450);
});
onBeforeUnmount(() => clearInterval(timer));
const done = computed(() => value.value >= 100);
function start() {
  value.value = 0;
  running.value = true;
}
</script>

<template>
  <div class="flex w-full max-w-sm flex-col gap-3">
    <Progress :value="value" :label="done ? 'Uploaded data-pipeline-2026-11.csv' : 'Uploading data-pipeline-2026-11.csv'" show-value :tone="done ? 'green' : 'accent'" />
    <Button size="sm" class="self-start" @click="start">{{ done || !running ? "Start upload" : "Restart" }}</Button>
  </div>
</template>
