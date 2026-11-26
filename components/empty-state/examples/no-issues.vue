<script setup lang="ts">
import { PhPlus } from "@phosphor-icons/vue";
import { Button, EmptyState } from "@fndn/vue";
</script>

<!-- the next step under the text: the one thing to do in an empty project -->
<template>
  <EmptyState size="block" icon="folder-open" title="No open issues in billing-api" hint="Issues you create or import show up here.">
    <template #action>
      <Button variant="outline" size="sm" shape="rounded">
        <template #icon><PhPlus data-slot="icon" weight="bold" /></template>
        New issue
      </Button>
    </template>
  </EmptyState>
</template>
