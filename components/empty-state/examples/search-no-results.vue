<script setup lang="ts">
import { Card, EmptyState } from "@fndn/vue";
</script>

<!-- the search palette when nothing matches the query -->
<template>
  <Card elevation="overlay" class="w-[300px] max-w-full">
    <EmptyState size="block" icon="magnifying-glass" title="No results for “billing-apy”" hint="Check the spelling, or search by project, person or deploy ID." />
  </Card>
</template>
