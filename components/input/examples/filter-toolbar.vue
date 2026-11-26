<script setup lang="ts">
import { ref } from "vue";
import { PhDownloadSimple } from "@phosphor-icons/vue";
import { Button, Input } from "@fndn/vue";

const query = ref("");
</script>

<!-- sm: 28px, the same height as the sm Button beside it -->
<template>
  <div class="flex w-full max-w-[360px] items-center gap-2">
    <Input v-model:value="query" size="sm" type="search" placeholder="Filter by branch or commit" aria-label="Filter deploys" class="min-w-0 flex-1" />
    <Button size="sm">
      <template #icon><PhDownloadSimple data-slot="icon" weight="bold" /></template>
      Export
    </Button>
  </div>
</template>
