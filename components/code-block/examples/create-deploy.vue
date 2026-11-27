<script setup lang="ts">
import { CodeBlock } from "@fndn/vue";

const code = [
  "await northwind.deploys.create({",
  "  project: \"web-app\",",
  "  target: \"production\",",
  "});",
].join("\n");
</script>

<template>
  <CodeBlock variant="code" filename="scripts/deploy.ts" :value="code" />
</template>
