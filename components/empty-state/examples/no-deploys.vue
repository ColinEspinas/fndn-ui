<script setup lang="ts">
import { EmptyState } from "@fndn/vue";
</script>

<template>
  <EmptyState
    size="block"
    icon="folder-open"
    title="No deploys yet"
    hint="Push to main to create the first one."
    class="w-full"
  />
</template>
