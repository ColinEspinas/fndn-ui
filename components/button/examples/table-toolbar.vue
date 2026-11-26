<script setup lang="ts">
import { PhCaretDown, PhFunnelSimple, PhPlus } from "@phosphor-icons/vue";
import { Button } from "@fndn/vue";
</script>

<!-- sm (28px) in a toolbar above a table: every control of the row shares the size -->
<template>
  <div class="flex w-80 items-center gap-2">
    <Button size="sm">
      <template #icon><PhFunnelSimple data-slot="icon" weight="bold" /></template>
      Filter
    </Button>
    <Button size="sm">
      Newest
      <template #trailingIcon><PhCaretDown data-slot="icon" weight="bold" /></template>
    </Button>
    <Button variant="primary" size="sm" class="ms-auto">
      <template #icon><PhPlus data-slot="icon" weight="bold" /></template>
      New project
    </Button>
  </div>
</template>
