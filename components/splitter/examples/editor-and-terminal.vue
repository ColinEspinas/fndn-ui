<script setup lang="ts">
import { ref } from "vue";
import { Splitter } from "@fndn/vue";

const code = [
  "test(\"retries a failed delivery\", async () => {",
  "  server.failNext(2);",
  "  await deliver(event);",
  "  expect(server.calls).toBe(3);",
  "});",
];
const output = ["$ pnpm test webhooks", "✓ webhooks.test.ts (12 tests) 840ms", "Tests  12 passed (12)"];
const size = ref([60, 40]);
</script>

<template>
  <div class="h-64 w-full max-w-md rounded-card bg-surface shadow-card">
    <Splitter
      v-model:size="size"
      orientation="vertical"
      grip
      :panels="[
        { id: 'editor', minSize: 25 },
        { id: 'terminal', minSize: 20 },
      ]"
    >
      <template #panel="{ panel }">
        <pre v-if="panel.id === 'editor'" class="p-3 font-mono text-xs leading-relaxed text-ink">{{ code.join("\n") }}</pre>
        <pre v-else class="p-3 font-mono text-xs leading-relaxed text-ink-2">{{ output.join("\n") }}</pre>
      </template>
    </Splitter>
  </div>
</template>
