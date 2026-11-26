<script setup lang="ts">
import { PhGitBranch } from "@phosphor-icons/vue";
import { Toggle } from "@fndn/vue";
</script>

<!-- disabled keeps its pressed state visible and says who can change it -->
<template>
  <div class="flex max-w-80 flex-col items-start gap-2">
    <Toggle size="sm" disabled pressed aria-describedby="auto-merge-why">
      <template #icon><PhGitBranch data-slot="icon" weight="bold" /></template>
      Auto-merge
    </Toggle>
    <p id="auto-merge-why" class="text-sm text-ink-2">You have viewer access to web-app. Ask a maintainer to change this.</p>
  </div>
</template>
