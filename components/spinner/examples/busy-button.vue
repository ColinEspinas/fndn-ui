<script setup lang="ts">
import { Button, Spinner } from "@fndn/vue";
</script>

<template>
  <Button aria-disabled="true" aria-busy="true">
    <template #icon><Spinner decorative /></template>
    Deploying to Production…
  </Button>
</template>
