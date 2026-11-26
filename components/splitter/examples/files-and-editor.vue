<script setup lang="ts">
import { ref } from "vue";
import { Splitter } from "@fndn/vue";

const files = ["deliver.ts", "retry.ts", "verify.ts", "webhooks.test.ts"];
const code = [
  "retry(() => post(event), {",
  "  attempts: 5,",
  "  backoff: \"exponential\",",
  "});",
];
const size = ref([30, 70]);
</script>

<template>
  <div class="h-[136px] w-full">
    <Splitter
      v-model:size="size"
      :panels="[
        { id: 'files', minSize: 25 },
        { id: 'editor', minSize: 40 },
      ]"
    >
      <template #panel="{ panel }">
        <ul v-if="panel.id === 'files'" class="flex flex-col gap-0.5 p-1.5 text-sm text-ink-2" aria-label="Files">
          <li v-for="file in files" :key="file" :class="`truncate rounded-control px-2 py-1 ${file === 'deliver.ts' ? 'bg-hover text-ink' : ''}`">{{ file }}</li>
        </ul>
        <pre v-else class="p-3 font-mono text-xs leading-relaxed text-ink">{{ code.join("\n") }}</pre>
      </template>
    </Splitter>
  </div>
</template>
