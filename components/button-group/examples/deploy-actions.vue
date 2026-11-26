<script setup lang="ts">
import { PhArrowClockwise, PhArrowSquareOut, PhDownloadSimple } from "@phosphor-icons/vue";
import { Button, ButtonGroup } from "@fndn/vue";
</script>

<!-- vertical: a stack of related actions in a narrow side panel -->
<template>
  <ButtonGroup label="Deploy dpl_7f3a9c" orientation="vertical" class="w-52">
    <Button size="sm">
      <template #icon><PhArrowSquareOut data-slot="icon" weight="bold" /></template>
      Open preview
    </Button>
    <Button size="sm">
      <template #icon><PhDownloadSimple data-slot="icon" weight="bold" /></template>
      Download build log
    </Button>
    <Button size="sm">
      <template #icon><PhArrowClockwise data-slot="icon" weight="bold" /></template>
      Redeploy
    </Button>
  </ButtonGroup>
</template>
