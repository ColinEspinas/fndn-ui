<script setup lang="ts">
import { PhFile, PhFolder } from "@phosphor-icons/vue";
import { TreeView, type TreeViewNode } from "@fndn/vue";

const folder = PhFolder;
const file = PhFile;

const items: TreeViewNode[] = [
  {
    value: "src", label: "src", icon: folder,
    children: [
      {
        value: "src/webhooks", label: "webhooks", icon: folder,
        children: [
          { value: "src/webhooks/deliver.ts", label: "deliver.ts", icon: file },
          { value: "src/webhooks/retry-policy.ts", label: "retry-policy.ts", icon: file },
        ],
      },
      {
        value: "src/invoices", label: "invoices", icon: folder,
        children: [{ value: "src/invoices/render-pdf.ts", label: "render-pdf.ts", icon: file }],
      },
    ],
  },
  { value: "package.json", label: "package.json", icon: file },
];
</script>

<template>
  <TreeView
    class="w-64"
    aria-label="billing-api files"
    :defaultExpandedValue="['src']"
    :defaultSelectedValue="['src/webhooks']"
    :items="items"
  />
</template>
