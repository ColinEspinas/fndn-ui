<script setup lang="ts">
import { computed, ref } from "vue";
import { PhFile } from "@phosphor-icons/vue";
import { CodeBlock, Tabs } from "@fndn/vue";

const files = [
  {
    path: "src/middleware/rate-limit.ts",
    name: "rate-limit.ts",
    lines: [
      "import { buckets } from \"./store\";",
      "",
      "const WINDOW_MS = 60_000;",
      "const LIMIT = 120;",
      "",
      "export function rateLimit(key: string, now = Date.now(), options: { limit?: number; windowMs?: number } = {}) {",
      "  const bucket = buckets.get(key) ?? { count: 0, windowStart: now };",
      "  if (now - bucket.windowStart >= (options.windowMs ?? WINDOW_MS)) {",
      "    bucket.count = 0;",
      "    bucket.windowStart = now;",
      "  }",
      "  bucket.count += 1;",
      "  buckets.set(key, bucket);",
      "  return bucket.count <= (options.limit ?? LIMIT);",
      "}",
    ],
  },
  { path: "package.json", name: "package.json", lines: ["{", "  \"name\": \"billing-api\",", "  \"version\": \"2.14.0\",", "  \"private\": true", "}"] },
];

const open = ref(files);
const active = ref(files[0]!.path);
const items = computed(() => open.value.map((file) => ({ value: file.path, label: file.name, icon: PhFile })));
const fileOf = (path: string) => open.value.find((file) => file.path === path)!;
</script>

<!-- an editor pane: attached file tabs over the code block's editor look (no frame, no header, no
     copy; lines never wrap, the gutter stays while the code scrolls sideways) -->
<template>
  <div class="h-64 w-full max-w-[560px] overflow-hidden rounded-card bg-canvas shadow-card">
    <Tabs
      v-if="open.length"
      v-model:value="active"
      variant="attached"
      size="xs"
      closable
      fill
      aria-label="Open files"
      :items="items"
      @close="(path) => (open = open.filter((file) => file.path !== path))"
    >
      <template #panel="{ item }">
        <CodeBlock editor :filename="item.value" :lines="fileOf(item.value).lines" :current-line="item.value === active ? 7 : undefined" />
      </template>
    </Tabs>
    <p v-else class="p-4 text-sm text-ink-2">No open files</p>
  </div>
</template>
