<script setup lang="ts">
import { ref } from "vue";
import { PhWarningCircle } from "@phosphor-icons/vue";
import { Toggle } from "@fndn/vue";

/* ghost: no fill at rest, for a filter that sits in a list header */
const failedOnly = ref(false);
</script>

<template>
  <div class="flex w-full max-w-80 items-center justify-between gap-3">
    <p class="text-sm font-medium text-ink">{{ failedOnly ? "3 failed deploys" : "48 deploys this week" }}</p>
    <Toggle v-model:pressed="failedOnly" variant="ghost" size="sm">
      <template #icon><PhWarningCircle data-slot="icon" weight="bold" /></template>
      Failed only
    </Toggle>
  </div>
</template>
