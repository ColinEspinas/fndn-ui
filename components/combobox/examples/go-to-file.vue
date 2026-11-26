<script setup lang="ts">
import { ref } from "vue";
import { PhFile, PhFileText, PhGear } from "@phosphor-icons/vue";
import { Combobox, type ComboboxItem } from "@fndn/vue";

/* an editor's "Go to file": each file leads with its icon, its folder after it; as you type, the
 * part of each name you typed stays in ink and the rest dims, so you see why a file is listed */
const files: ComboboxItem[] = [
  { value: "src/middleware/rate-limit.ts", label: "rate-limit.ts", meta: "src/middleware", icon: PhFile },
  { value: "src/middleware/rate-limit.test.ts", label: "rate-limit.test.ts", meta: "src/middleware", icon: PhFile },
  { value: "src/webhooks/retry-policy.ts", label: "retry-policy.ts", meta: "src/webhooks", icon: PhFile },
  { value: "docs/rate-limits.md", label: "rate-limits.md", meta: "docs", icon: PhFileText },
  { value: "config/limits.yaml", label: "limits.yaml", meta: "config", icon: PhGear },
];

const file = ref<string | null>(null);
</script>

<template>
  <Combobox v-model:value="file" :items="files" highlight-match aria-label="Go to file" placeholder="Go to file" empty-text="No file matches" style="width: 320px" />
</template>
