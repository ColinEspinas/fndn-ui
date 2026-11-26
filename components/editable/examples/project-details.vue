<script setup lang="ts">
import { ref } from "vue";
import { Editable, TextRow } from "@fndn/vue";

const branch = ref("main");
const command = ref("pnpm build");
const timeout = ref("15");
</script>

<!-- inline: the value of a detail row, edited in place -->
<template>
  <div style="width: 320px">
    <TextRow label="Production branch">
      <template #value><Editable v-model:value="branch" variant="inline" aria-label="Production branch" /></template>
    </TextRow>
    <TextRow label="Build command">
      <template #value><Editable v-model:value="command" variant="inline" aria-label="Build command" /></template>
    </TextRow>
    <TextRow label="Build timeout" meta="min">
      <template #value><Editable v-model:value="timeout" variant="inline" aria-label="Build timeout in minutes" /></template>
    </TextRow>
  </div>
</template>
