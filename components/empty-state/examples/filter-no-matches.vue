<script setup lang="ts">
import { EmptyState } from "@fndn/vue";
</script>

<!-- under a filter bar: the pull request list is empty for these filters -->
<template>
  <EmptyState size="row" align="center" icon="funnel" title="No open pull requests by Lucas Moreau" class="w-80 max-w-full" />
</template>
