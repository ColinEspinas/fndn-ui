<script setup lang="ts">
import { AgentScreen } from "@fndn/vue";
</script>

<template>
  <AgentScreen
    label="Reproducing HAR-482: double booking in Safari"
    :cursor="{ x: 68, y: 30 }"
    recording
  />
</template>
