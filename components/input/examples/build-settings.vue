<script setup lang="ts">
import { ref } from "vue";
import { Field, Input } from "@fndn/vue";

const command = ref("pnpm build");
const output = ref("apps/web/dist");
</script>

<!-- subtle: the grey inset look for dense side panels, where an outline on every field is noise -->
<template>
  <div class="flex w-full max-w-64 flex-col gap-3">
    <Field label="Build command">
      <Input v-model:value="command" size="sm" variant="subtle" mono />
    </Field>
    <Field label="Output directory">
      <Input v-model:value="output" size="sm" variant="subtle" mono />
    </Field>
  </div>
</template>
