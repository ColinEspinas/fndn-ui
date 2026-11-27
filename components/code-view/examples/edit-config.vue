<script setup lang="ts">
import { ref } from "vue";
import { CodeView } from "@fndn/vue";

const code = ref([
  "export default {",
  "  project: \"web-app\",",
  "  regions: [\"fra1\", \"iad1\"],",
  "  buildCommand: \"pnpm build\",",
  "};",
].join("\n"));
</script>

<template>
  <CodeView v-model:value="code" editable label="northwind.config.ts" />
</template>
