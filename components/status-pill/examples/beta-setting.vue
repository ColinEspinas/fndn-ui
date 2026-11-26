<script setup lang="ts">
import { StatusPill, Switch } from "@fndn/vue";
</script>

<template>
  <div class="flex w-80 items-start gap-3 text-sm">
    <div class="min-w-0 flex-1">
      <p class="flex items-center gap-2 font-medium text-ink">
        Usage alerts <StatusPill tone="blue" size="sm" :dot="false">Beta</StatusPill>
      </p>
      <p class="text-ink-2">Email the owners when a project passes 80% of its build minutes.</p>
    </div>
    <Switch label="Usage alerts" />
  </div>
</template>
