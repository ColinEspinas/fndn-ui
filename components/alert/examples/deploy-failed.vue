<script setup lang="ts">
import { ref } from "vue";
import { Alert, type AlertAction } from "@fndn/vue";

const actions: AlertAction[] = [
  { label: "Redeploy", value: "redeploy" },
  { label: "Dismiss", value: "dismiss", variant: "ghost" },
];
const state = ref<"failed" | "redeploying" | "dismissed">("failed");
</script>

<template>
  <Alert v-if="state === 'redeploying'" class="w-full max-w-[420px]" tone="accent" title="Redeploying web-app">
    Started again from commit a1b2c3d on main.
  </Alert>
  <Alert
    v-else-if="state === 'failed'"
    class="w-full max-w-[420px]"
    tone="red"
    title="Deploy to Production failed"
    :actions="actions"
    @action="(value) => (state = value === 'redeploy' ? 'redeploying' : 'dismissed')"
  >
    The build of dpl_7f3a9c exited with code 1. The previous deploy is still live.
  </Alert>
</template>
