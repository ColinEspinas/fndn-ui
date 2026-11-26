<script setup lang="ts">
import { PhArrowClockwise, PhArrowCounterClockwise } from "@phosphor-icons/vue";
import { Button, ButtonGroup, Tooltip } from "@fndn/vue";
</script>

<!-- icon-only and joined: each button named by aria-label and its tooltip -->
<template>
  <ButtonGroup label="History">
    <Tooltip content="Undo">
      <Button size="sm" shape="rounded" square aria-label="Undo">
        <template #icon><PhArrowCounterClockwise data-slot="icon" weight="bold" /></template>
      </Button>
    </Tooltip>
    <Tooltip content="Redo">
      <Button size="sm" shape="rounded" square aria-label="Redo" disabled>
        <template #icon><PhArrowClockwise data-slot="icon" weight="bold" /></template>
      </Button>
    </Tooltip>
  </ButtonGroup>
</template>
