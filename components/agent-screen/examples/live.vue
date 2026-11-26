<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef } from "vue";
import { AgentScreen } from "@fndn/vue";

const initial = {
  label: "Issuing the Kestrel Logistics refund",
  cursor: { x: 42, y: 53 },
};

/* each step waits `after` ms, then merges its props over the current ones */
const timeline: { after: number; props: Record<string, unknown> }[] = [
  { after: 900, props: { cursor: { x: 72, y: 30 } } },
  { after: 1100, props: { cursor: { x: 26, y: 68 } } },
  { after: 1100, props: { cursor: { x: 58, y: 44 } } },
  { after: 800, props: { recording: true } },
];

const props = shallowRef<Record<string, unknown>>({ ...initial });
let timer = 0;
onMounted(() => {
  let i = 0;
  const next = () => {
    const step = timeline[i++];
    if (step) timer = window.setTimeout(() => { props.value = { ...props.value, ...step.props }; next(); }, step.after);
  };
  next();
});
onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <AgentScreen v-bind="props" />
</template>
