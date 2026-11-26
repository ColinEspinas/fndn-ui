<script setup lang="ts">
import { Clipboard } from "@fndn/vue";
</script>

<!-- disabled: a revoked key stays visible for reference but cannot be copied -->
<template>
  <div class="flex w-80 flex-col gap-1.5">
    <Clipboard variant="field" label="Previous API key" value="nw_live_9Qx3Lm7Ty2Pd8KcW" disabled />
    <p class="text-xs text-ink-2">Revoked on Nov 14, 2026 by Maya Chen.</p>
  </div>
</template>
