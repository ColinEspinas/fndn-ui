<script setup lang="ts">
import { CodeBlock } from "@fndn/vue";

const lines = [
  "await northwind.deploys.create({",
  "  project: \"web-app\",",
  "  target: \"production\",",
  "});",
];
</script>

<template>
  <CodeBlock variant="code" filename="scripts/deploy.ts" :lines="lines" />
</template>
