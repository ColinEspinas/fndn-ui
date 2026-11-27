<script setup lang="ts">
import { CodeBlock } from "@fndn/vue";

const files = [
  {
    path: "src/client.ts",
    label: "client.ts",
    value: [
      "import { Northwind } from \"@northwind/sdk\";",
      "",
      "export const northwind = new Northwind({ apiKey: process.env.NORTHWIND_API_KEY });",
    ].join("\n"),
  },
  {
    path: "src/webhooks/verify.ts",
    label: "verify.ts",
    highlighted: [
      "<span style=\"color: var(--fndn-accent-ink)\">export const</span> secret = process.env.<span style=\"color: var(--fndn-orange)\">WEBHOOK_SECRET</span>;",
    ],
    value: "export const secret = process.env.WEBHOOK_SECRET;",
  },
];
</script>

<template>
  <CodeBlock :files="files" :height="120" />
</template>
