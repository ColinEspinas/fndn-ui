<script setup lang="ts">
import { ref } from "vue";
import { PhTrash } from "@phosphor-icons/vue";
import { Button, Input } from "@fndn/vue";

const key = ref("DATABASE_URL");
const value = ref("postgres://web-app@db.northwind.example:5432/main");
</script>

<!-- mono for keys, values and anything copied from a terminal -->
<template>
  <div class="flex w-full max-w-[400px] items-center gap-2">
    <Input v-model:value="key" mono aria-label="Key" class="w-36 min-w-0" />
    <Input v-model:value="value" mono aria-label="Value" class="min-w-0 flex-1" />
    <Button variant="ghost" square muted aria-label="Remove DATABASE_URL">
      <template #icon><PhTrash data-slot="icon" weight="bold" /></template>
    </Button>
  </div>
</template>
