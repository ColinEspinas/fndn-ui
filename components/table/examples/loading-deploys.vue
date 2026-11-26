<script setup lang="ts">
import { Table } from "@fndn/vue";

const columns = [
  { key: "branch", label: "Branch", truncate: true },
  { key: "status", label: "Status" },
  { key: "duration", label: "Duration", numeric: true },
];
</script>

<!-- while the deploys load: the header and as many still placeholder rows as the page usually shows -->
<template>
  <Table variant="flush" aria-label="Recent deploys of web-app" :columns="columns" :rows="[]" loading :loading-rows="3" />
</template>
