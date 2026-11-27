<script setup lang="ts">
import { CodeBlock } from "@fndn/vue";

const code = [
  "import { defineConfig } from \"@northwind/sdk\";",
  "",
  "export default defineConfig({",
  "  project: \"web-app\",",
  "  framework: \"vite\",",
  "  buildCommand: \"pnpm build\",",
  "  outputDirectory: \"dist\",",
  "  regions: [\"fra1\", \"iad1\"],",
  "  environments: {",
  "    production: { branch: \"main\", domain: \"app.northwind.example\" },",
  "    staging: { branch: \"develop\" },",
  "    preview: { branches: [\"feat/*\", \"fix/*\"] },",
  "  },",
  "  headers: [",
  "    { source: \"/assets/(.*)\", cacheControl: \"public, max-age=31536000, immutable\" },",
  "  ],",
  "});",
].join("\n");
</script>

<template>
  <CodeBlock variant="code" filename="northwind.config.ts" :value="code" :max-height="200" />
</template>
