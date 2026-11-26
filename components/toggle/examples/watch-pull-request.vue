<script setup lang="ts">
import { ref } from "vue";
import { PhBell } from "@phosphor-icons/vue";
import { Toggle } from "@fndn/vue";

/* a toggle keeps its label; the pressed fill and the line under it say the state */
const watching = ref(true);
</script>

<template>
  <div class="flex max-w-80 flex-col items-start gap-2">
    <p class="text-sm font-medium text-ink">#482 Add retry to webhook delivery</p>
    <div class="flex items-center gap-3">
      <Toggle v-model:pressed="watching" size="sm">
        <template #icon><PhBell data-slot="icon" weight="bold" /></template>
        Watch
      </Toggle>
      <span class="text-sm text-ink-2">{{ watching ? "Every review and comment" : "Only when you are mentioned" }}</span>
    </div>
  </div>
</template>
