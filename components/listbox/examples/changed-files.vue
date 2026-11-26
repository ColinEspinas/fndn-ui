<script setup lang="ts">
import { ref } from "vue";
import { Listbox, type ListboxItem } from "@fndn/vue";

/* an editor's change list: xs rows, the folder dimmed after the name, a status letter at the end in
 * its tone (M modified, A added, D deleted) */
const changes: ListboxItem[] = [
  { value: "src/middleware/rate-limit.ts", label: "rate-limit.ts", description: "src/middleware", meta: "M", metaTone: "orange" },
  { value: "src/webhooks/retry-policy.ts", label: "retry-policy.ts", description: "src/webhooks", meta: "A", metaTone: "green" },
  { value: "src/webhooks/legacy-queue.ts", label: "legacy-queue.ts", description: "src/webhooks", meta: "D", metaTone: "red" },
  { value: "package.json", label: "package.json", meta: "M", metaTone: "orange" },
];

const selected = ref(["src/middleware/rate-limit.ts"]);
</script>

<template>
  <Listbox :items="changes" v-model:value="selected" size="xs" aria-label="Changes" style="width: 280px" />
</template>
