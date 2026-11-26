<script setup lang="ts">
import { Dialog, StatusPill, TextRow } from "@fndn/vue";

const deploy = {
  id: "dpl_7f3a9c",
  branch: "main",
  commit: "a1b2c3d",
  message: "Add retry to webhook delivery",
  duration: "1m 42s",
  region: "Frankfurt (fra1)",
};
</script>

<!-- read-only content, no footer: the close button, Escape or a click outside closes it -->
<template>
  <div class="flex w-80 items-center gap-3">
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2 text-sm font-medium text-ink">
        Production <StatusPill tone="green">Ready</StatusPill>
      </div>
      <div class="text-xs text-ink-2">{{ `${deploy.id} · ${deploy.branch} · 2 min ago` }}</div>
    </div>
    <Dialog
      triggerLabel="View deploy"
      :title="`Deploy ${deploy.id}`"
      description="web-app to Production, started by Maya Chen 2 min ago."
    >
      <div class="flex flex-col">
        <TextRow label="Status">
          <template #value><StatusPill tone="green">Ready</StatusPill></template>
        </TextRow>
        <TextRow label="Branch" :value="deploy.branch" />
        <TextRow label="Commit" :value="deploy.commit" :meta="deploy.message" />
        <TextRow label="Build time" :value="deploy.duration" />
        <TextRow label="Region" :value="deploy.region" />
      </div>
    </Dialog>
  </div>
</template>
